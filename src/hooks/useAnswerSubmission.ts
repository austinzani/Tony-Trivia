import { useState, useEffect, useCallback, useRef } from 'react';
import { AnswerSubmissionManager, AnswerSubmission, SubmissionEventType, SubmissionEvent, AnswerSubmissionOptions } from '../services/answerSubmissionManager';
import { RoundManager } from '../services/roundManager';

export interface UseAnswerSubmissionOptions extends AnswerSubmissionOptions {
  participantId: string;
  onSubmissionCreated?: (submission: AnswerSubmission) => void;
  onSubmissionUpdated?: (submission: AnswerSubmission) => void;
  onSubmissionLocked?: (submissionId: string) => void;
  onSubmissionUnlocked?: (submissionId: string) => void;
  onSubmissionDeleted?: (submissionId: string) => void;
  onValidationFailed?: (errors: string[], warnings: string[]) => void;
  onRoundLocked?: () => void;
  onRoundUnlocked?: () => void;
}

export interface UseAnswerSubmissionReturn {
  // Submission manager instance
  submissionManager: AnswerSubmissionManager;
  
  // Submission operations
  submitAnswer: (questionId: string, answer: string, pointValue: number) => Promise<{ success: boolean; submissionId?: string; errors: string[] }>;
  updateSubmission: (submissionId: string, answer?: string, pointValue?: number) => Promise<{ success: boolean; errors: string[] }>;
  deleteSubmission: (submissionId: string) => Promise<{ success: boolean; errors: string[] }>;
  
  // Lock operations
  lockSubmission: (submissionId: string) => boolean;
  unlockSubmission: (submissionId: string) => boolean;
  lockAllSubmissions: () => void;
  unlockAllSubmissions: () => void;
  
  // Getters
  getSubmission: (submissionId: string) => AnswerSubmission | undefined;
  getSubmissionForQuestion: (questionId: string) => AnswerSubmission | undefined;
  getSubmissionsByParticipant: () => AnswerSubmission[];
  getSubmissionsByQuestion: (questionId: string) => AnswerSubmission[];
  isSubmissionLocked: (submissionId: string) => boolean;
  getUsedPointValues: () => number[];
  getAvailablePointValues: () => number[];
  
  // State
  submissions: AnswerSubmission[];
  submissionCount: number;
  lockedSubmissionCount: number;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  lastError: string | null;
}

export function useAnswerSubmission(
  roundManager: RoundManager,
  options: UseAnswerSubmissionOptions
): UseAnswerSubmissionReturn {
  const {
    participantId,
    onSubmissionCreated,
    onSubmissionUpdated,
    onSubmissionLocked,
    onSubmissionUnlocked,
    onSubmissionDeleted,
    onValidationFailed,
    onRoundLocked,
    onRoundUnlocked,
    ...submissionOptions
  } = options;

  // Create submission manager instance
  const submissionManagerRef = useRef<AnswerSubmissionManager | null>(null);
  if (!submissionManagerRef.current) {
    submissionManagerRef.current = new AnswerSubmissionManager(roundManager, submissionOptions);
  }
  const submissionManager = submissionManagerRef.current;

  // State
  const [submissions, setSubmissions] = useState<AnswerSubmission[]>(() => 
    submissionManager.getSubmissionsByParticipant(participantId)
  );
  const [submissionCount, setSubmissionCount] = useState<number>(() => 
    submissionManager.getSubmissionCount()
  );
  const [lockedSubmissionCount, setLockedSubmissionCount] = useState<number>(() => 
    submissionManager.getLockedSubmissionCount()
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Update state from submission manager
  const updateState = useCallback(() => {
    setSubmissions(submissionManager.getSubmissionsByParticipant(participantId));
    setSubmissionCount(submissionManager.getSubmissionCount());
    setLockedSubmissionCount(submissionManager.getLockedSubmissionCount());
  }, [submissionManager, participantId]);

  // Event handlers
  const handleSubmissionEvent = useCallback((event: SubmissionEvent) => {
    updateState();
    setLastError(null);

    // Only handle events for this participant
    if (event.participantId !== participantId && event.participantId !== '') {
      return;
    }

    switch (event.type) {
      case SubmissionEventType.SUBMISSION_CREATED:
        if (event.data?.submission) {
          onSubmissionCreated?.(event.data.submission);
        }
        break;
        
      case SubmissionEventType.SUBMISSION_UPDATED:
        if (event.data?.newSubmission) {
          onSubmissionUpdated?.(event.data.newSubmission);
        }
        break;
        
      case SubmissionEventType.SUBMISSION_LOCKED:
        onSubmissionLocked?.(event.submissionId);
        break;
        
      case SubmissionEventType.SUBMISSION_UNLOCKED:
        onSubmissionUnlocked?.(event.submissionId);
        break;
        
      case SubmissionEventType.SUBMISSION_DELETED:
        onSubmissionDeleted?.(event.submissionId);
        break;
        
      case SubmissionEventType.VALIDATION_FAILED:
        if (event.data?.errors || event.data?.warnings) {
          onValidationFailed?.(event.data.errors || [], event.data.warnings || []);
          setLastError(event.data.errors?.[0] || 'Validation failed');
        }
        break;
        
      case SubmissionEventType.ROUND_LOCKED:
        onRoundLocked?.();
        break;
        
      case SubmissionEventType.ROUND_UNLOCKED:
        onRoundUnlocked?.();
        break;
    }
  }, [participantId, onSubmissionCreated, onSubmissionUpdated, onSubmissionLocked, onSubmissionUnlocked, onSubmissionDeleted, onValidationFailed, onRoundLocked, onRoundUnlocked, updateState]);

  // Set up event listeners
  useEffect(() => {
    const eventTypes = [
      SubmissionEventType.SUBMISSION_CREATED,
      SubmissionEventType.SUBMISSION_UPDATED,
      SubmissionEventType.SUBMISSION_LOCKED,
      SubmissionEventType.SUBMISSION_UNLOCKED,
      SubmissionEventType.SUBMISSION_DELETED,
      SubmissionEventType.VALIDATION_FAILED,
      SubmissionEventType.ROUND_LOCKED,
      SubmissionEventType.ROUND_UNLOCKED
    ];

    eventTypes.forEach(eventType => {
      submissionManager.addEventListener(eventType, handleSubmissionEvent);
    });

    // Initial state update
    updateState();

    return () => {
      eventTypes.forEach(eventType => {
        submissionManager.removeEventListener(eventType, handleSubmissionEvent);
      });
    };
  }, [submissionManager, handleSubmissionEvent, updateState]);

  // Submission operations
  const submitAnswer = useCallback(async (
    questionId: string,
    answer: string,
    pointValue: number
  ): Promise<{ success: boolean; submissionId?: string; errors: string[] }> => {
    setIsLoading(true);
    setLastError(null);
    setHasUnsavedChanges(false);

    try {
      const result = submissionManager.submitAnswer(questionId, participantId, answer, pointValue);
      
      if (!result.success) {
        setLastError(result.errors[0] || 'Submission failed');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setLastError(errorMessage);
      return { success: false, errors: [errorMessage] };
    } finally {
      setIsLoading(false);
    }
  }, [submissionManager, participantId]);

  const updateSubmission = useCallback(async (
    submissionId: string,
    answer?: string,
    pointValue?: number
  ): Promise<{ success: boolean; errors: string[] }> => {
    setIsLoading(true);
    setLastError(null);
    setHasUnsavedChanges(false);

    try {
      const result = submissionManager.updateSubmission(submissionId, answer, pointValue);
      
      if (!result.success) {
        setLastError(result.errors[0] || 'Update failed');
      }
      
      return { success: result.success, errors: result.errors };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setLastError(errorMessage);
      return { success: false, errors: [errorMessage] };
    } finally {
      setIsLoading(false);
    }
  }, [submissionManager]);

  const deleteSubmission = useCallback(async (
    submissionId: string
  ): Promise<{ success: boolean; errors: string[] }> => {
    setIsLoading(true);
    setLastError(null);

    try {
      const result = submissionManager.deleteSubmission(submissionId);
      
      if (!result.success) {
        setLastError(result.errors[0] || 'Deletion failed');
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setLastError(errorMessage);
      return { success: false, errors: [errorMessage] };
    } finally {
      setIsLoading(false);
    }
  }, [submissionManager]);

  // Lock operations
  const lockSubmission = useCallback((submissionId: string): boolean => {
    return submissionManager.lockSubmission(submissionId);
  }, [submissionManager]);

  const unlockSubmission = useCallback((submissionId: string): boolean => {
    return submissionManager.unlockSubmission(submissionId);
  }, [submissionManager]);

  const lockAllSubmissions = useCallback(() => {
    submissionManager.lockAllSubmissions();
  }, [submissionManager]);

  const unlockAllSubmissions = useCallback(() => {
    submissionManager.unlockAllSubmissions();
  }, [submissionManager]);

  // Getters
  const getSubmission = useCallback((submissionId: string): AnswerSubmission | undefined => {
    return submissionManager.getSubmission(submissionId);
  }, [submissionManager]);

  const getSubmissionForQuestion = useCallback((questionId: string): AnswerSubmission | undefined => {
    const submissionId = submissionManager.getParticipantSubmissionForQuestion(participantId, questionId);
    return submissionId ? submissionManager.getSubmission(submissionId) : undefined;
  }, [submissionManager, participantId]);

  const getSubmissionsByParticipant = useCallback((): AnswerSubmission[] => {
    return submissionManager.getSubmissionsByParticipant(participantId);
  }, [submissionManager, participantId]);

  const getSubmissionsByQuestion = useCallback((questionId: string): AnswerSubmission[] => {
    return submissionManager.getSubmissionsByQuestion(questionId);
  }, [submissionManager]);

  const isSubmissionLocked = useCallback((submissionId: string): boolean => {
    return submissionManager.isSubmissionLocked(submissionId);
  }, [submissionManager]);

  const getUsedPointValues = useCallback((): number[] => {
    return submissionManager.getUsedPointValues(participantId);
  }, [submissionManager, participantId]);

  const getAvailablePointValues = useCallback((): number[] => {
    return submissionManager.getAvailablePointValues(participantId);
  }, [submissionManager, participantId]);

  // Track unsaved changes
  useEffect(() => {
    // This would be implemented based on your specific requirements
    // for tracking when there are unsaved changes in forms
    setHasUnsavedChanges(false);
  }, [submissions]);

  return {
    // Submission manager instance
    submissionManager,
    
    // Submission operations
    submitAnswer,
    updateSubmission,
    deleteSubmission,
    
    // Lock operations
    lockSubmission,
    unlockSubmission,
    lockAllSubmissions,
    unlockAllSubmissions,
    
    // Getters
    getSubmission,
    getSubmissionForQuestion,
    getSubmissionsByParticipant,
    getSubmissionsByQuestion,
    isSubmissionLocked,
    getUsedPointValues,
    getAvailablePointValues,
    
    // State
    submissions,
    submissionCount,
    lockedSubmissionCount,
    hasUnsavedChanges,
    isLoading,
    lastError
  };
}

// Specialized hooks for different use cases
export function useQuestionSubmission(
  roundManager: RoundManager,
  participantId: string,
  questionId: string,
  options: Partial<UseAnswerSubmissionOptions> = {}
) {
  const submissionHook = useAnswerSubmission(roundManager, {
    participantId,
    maxSubmissionsPerQuestion: 1,
    requirePointValueSelection: true,
    enableValidation: true,
    ...options
  });

  const questionSubmission = submissionHook.getSubmissionForQuestion(questionId);
  const availablePointValues = submissionHook.getAvailablePointValues();

  const submitQuestionAnswer = useCallback(async (answer: string, pointValue: number) => {
    return submissionHook.submitAnswer(questionId, answer, pointValue);
  }, [submissionHook.submitAnswer, questionId]);

  const updateQuestionAnswer = useCallback(async (answer?: string, pointValue?: number) => {
    if (!questionSubmission) return { success: false, errors: ['No submission found'] };
    return submissionHook.updateSubmission(questionSubmission.submissionId, answer, pointValue);
  }, [submissionHook.updateSubmission, questionSubmission]);

  const deleteQuestionAnswer = useCallback(async () => {
    if (!questionSubmission) return { success: false, errors: ['No submission found'] };
    return submissionHook.deleteSubmission(questionSubmission.submissionId);
  }, [submissionHook.deleteSubmission, questionSubmission]);

  const lockQuestionAnswer = useCallback(() => {
    if (!questionSubmission) return false;
    return submissionHook.lockSubmission(questionSubmission.submissionId);
  }, [submissionHook.lockSubmission, questionSubmission]);

  const unlockQuestionAnswer = useCallback(() => {
    if (!questionSubmission) return false;
    return submissionHook.unlockSubmission(questionSubmission.submissionId);
  }, [submissionHook.unlockSubmission, questionSubmission]);

  return {
    ...submissionHook,
    questionSubmission,
    availablePointValues,
    submitQuestionAnswer,
    updateQuestionAnswer,
    deleteQuestionAnswer,
    lockQuestionAnswer,
    unlockQuestionAnswer,
    isQuestionLocked: questionSubmission ? submissionHook.isSubmissionLocked(questionSubmission.submissionId) : false,
    hasQuestionSubmission: !!questionSubmission
  };
}

export function useRoundSubmissions(
  roundManager: RoundManager,
  participantId: string,
  options: Partial<UseAnswerSubmissionOptions> = {}
) {
  const submissionHook = useAnswerSubmission(roundManager, {
    participantId,
    allowDuplicatePointValues: false,
    enableValidation: true,
    ...options
  });

  const currentRound = roundManager.getCurrentRound();
  const roundSubmissions = submissionHook.submissions.filter(
    submission => submission.roundId === currentRound?.id
  );

  const lockRoundSubmissions = useCallback(() => {
    roundSubmissions.forEach(submission => {
      submissionHook.lockSubmission(submission.submissionId);
    });
  }, [submissionHook.lockSubmission, roundSubmissions]);

  const unlockRoundSubmissions = useCallback(() => {
    roundSubmissions.forEach(submission => {
      submissionHook.unlockSubmission(submission.submissionId);
    });
  }, [submissionHook.unlockSubmission, roundSubmissions]);

  const getRoundProgress = useCallback(() => {
    if (!currentRound) return { completed: 0, total: 0, percentage: 0 };
    
    const totalQuestions = currentRound.questions.length;
    const completedQuestions = roundSubmissions.length;
    const percentage = totalQuestions > 0 ? (completedQuestions / totalQuestions) * 100 : 0;

    return {
      completed: completedQuestions,
      total: totalQuestions,
      percentage: Math.round(percentage)
    };
  }, [currentRound, roundSubmissions]);

  const isRoundComplete = useCallback(() => {
    const progress = getRoundProgress();
    return progress.completed === progress.total && progress.total > 0;
  }, [getRoundProgress]);

  return {
    ...submissionHook,
    currentRound,
    roundSubmissions,
    lockRoundSubmissions,
    unlockRoundSubmissions,
    getRoundProgress,
    isRoundComplete,
    roundProgress: getRoundProgress()
  };
} 
import { RoundManager } from './roundManager';

export interface AnswerSubmission {
  questionId: string;
  participantId: string;
  answer: string;
  pointValue: number;
  submittedAt: Date;
  isLocked: boolean;
  roundId: string;
  submissionId: string;
}

export interface SubmissionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SubmissionState {
  submissions: Map<string, AnswerSubmission>; // submissionId -> submission
  lockedSubmissions: Set<string>; // submissionIds that are locked
  participantSubmissions: Map<string, Map<string, string>>; // participantId -> questionId -> submissionId
  pointValueUsage: Map<string, Set<number>>; // participantId -> used point values in current round
  submissionsByQuestion: Map<string, Set<string>>; // questionId -> submissionIds
  submissionsByParticipant: Map<string, Set<string>>; // participantId -> submissionIds
}

export interface SubmissionEvent {
  type: SubmissionEventType;
  timestamp: Date;
  submissionId: string;
  participantId: string;
  questionId: string;
  data?: any;
}

export enum SubmissionEventType {
  SUBMISSION_CREATED = 'submission_created',
  SUBMISSION_UPDATED = 'submission_updated',
  SUBMISSION_LOCKED = 'submission_locked',
  SUBMISSION_UNLOCKED = 'submission_unlocked',
  SUBMISSION_DELETED = 'submission_deleted',
  ROUND_LOCKED = 'round_locked',
  ROUND_UNLOCKED = 'round_unlocked',
  VALIDATION_FAILED = 'validation_failed'
}

export type SubmissionEventListener = (event: SubmissionEvent) => void;

export interface AnswerSubmissionOptions {
  allowDuplicatePointValues?: boolean;
  autoLockOnSubmission?: boolean;
  maxSubmissionsPerQuestion?: number;
  requirePointValueSelection?: boolean;
  enableValidation?: boolean;
}

export class AnswerSubmissionManager {
  private state: SubmissionState;
  private roundManager: RoundManager;
  private listeners: Map<SubmissionEventType, Set<SubmissionEventListener>> = new Map();
  private options: Required<AnswerSubmissionOptions>;

  constructor(
    roundManager: RoundManager,
    options: AnswerSubmissionOptions = {}
  ) {
    this.roundManager = roundManager;
    this.options = {
      allowDuplicatePointValues: false,
      autoLockOnSubmission: false,
      maxSubmissionsPerQuestion: 1,
      requirePointValueSelection: true,
      enableValidation: true,
      ...options
    };

    this.state = this.createInitialState();
  }

  private createInitialState(): SubmissionState {
    return {
      submissions: new Map(),
      lockedSubmissions: new Set(),
      participantSubmissions: new Map(),
      pointValueUsage: new Map(),
      submissionsByQuestion: new Map(),
      submissionsByParticipant: new Map()
    };
  }

  // Submission Management
  public submitAnswer(
    questionId: string,
    participantId: string,
    answer: string,
    pointValue: number
  ): { success: boolean; submissionId?: string; errors: string[] } {
    try {
      // Validate submission
      const validation = this.validateSubmission(questionId, participantId, answer, pointValue);
      if (!validation.isValid) {
        this.emitEvent(SubmissionEventType.VALIDATION_FAILED, {
          questionId,
          participantId,
          submissionId: '',
          data: { errors: validation.errors, warnings: validation.warnings }
        });
        return { success: false, errors: validation.errors };
      }

      // Check if participant already has a submission for this question
      const existingSubmissionId = this.getParticipantSubmissionForQuestion(participantId, questionId);
      
      if (existingSubmissionId) {
        // Update existing submission
        return this.updateSubmission(existingSubmissionId, answer, pointValue);
      } else {
        // Create new submission
        return this.createSubmission(questionId, participantId, answer, pointValue);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      return { success: false, errors: ['An unexpected error occurred during submission'] };
    }
  }

  private createSubmission(
    questionId: string,
    participantId: string,
    answer: string,
    pointValue: number
  ): { success: boolean; submissionId: string; errors: string[] } {
    const submissionId = this.generateSubmissionId();
    const currentRound = this.roundManager.getCurrentRound();
    
    if (!currentRound) {
      return { success: false, submissionId: '', errors: ['No active round found'] };
    }

    const submission: AnswerSubmission = {
      questionId,
      participantId,
      answer,
      pointValue,
      submittedAt: new Date(),
      isLocked: this.options.autoLockOnSubmission,
      roundId: currentRound.id,
      submissionId
    };

    // Update state
    this.state.submissions.set(submissionId, submission);
    
    // Update participant submissions mapping
    if (!this.state.participantSubmissions.has(participantId)) {
      this.state.participantSubmissions.set(participantId, new Map());
    }
    this.state.participantSubmissions.get(participantId)!.set(questionId, submissionId);

    // Update point value usage
    if (!this.state.pointValueUsage.has(participantId)) {
      this.state.pointValueUsage.set(participantId, new Set());
    }
    this.state.pointValueUsage.get(participantId)!.add(pointValue);

    // Update question submissions mapping
    if (!this.state.submissionsByQuestion.has(questionId)) {
      this.state.submissionsByQuestion.set(questionId, new Set());
    }
    this.state.submissionsByQuestion.get(questionId)!.add(submissionId);

    // Update participant submissions mapping
    if (!this.state.submissionsByParticipant.has(participantId)) {
      this.state.submissionsByParticipant.set(participantId, new Set());
    }
    this.state.submissionsByParticipant.get(participantId)!.add(submissionId);

    // Lock if auto-lock is enabled
    if (this.options.autoLockOnSubmission) {
      this.state.lockedSubmissions.add(submissionId);
    }

    // Update round manager with point usage
    this.roundManager.usePointValue(participantId, pointValue);

    // Emit event
    this.emitEvent(SubmissionEventType.SUBMISSION_CREATED, {
      questionId,
      participantId,
      submissionId,
      data: { submission }
    });

    return { success: true, submissionId, errors: [] };
  }

  public updateSubmission(
    submissionId: string,
    answer?: string,
    pointValue?: number
  ): { success: boolean; submissionId: string; errors: string[] } {
    const submission = this.state.submissions.get(submissionId);
    if (!submission) {
      return { success: false, submissionId: '', errors: ['Submission not found'] };
    }

    if (this.isSubmissionLocked(submissionId)) {
      return { success: false, submissionId: '', errors: ['Cannot update locked submission'] };
    }

    const oldPointValue = submission.pointValue;
    const newPointValue = pointValue ?? submission.pointValue;
    const newAnswer = answer ?? submission.answer;

    // Validate updated submission
    if (pointValue !== undefined || answer !== undefined) {
      const validation = this.validateSubmission(
        submission.questionId,
        submission.participantId,
        newAnswer,
        newPointValue,
        submissionId
      );
      
      if (!validation.isValid) {
        return { success: false, submissionId: '', errors: validation.errors };
      }
    }

    // Update point value usage if changed
    if (pointValue !== undefined && pointValue !== oldPointValue) {
      const participantUsage = this.state.pointValueUsage.get(submission.participantId);
      if (participantUsage) {
        participantUsage.delete(oldPointValue);
        participantUsage.add(newPointValue);
      }

      // Update round manager
      this.roundManager.releasePointValue(submission.participantId, oldPointValue);
      this.roundManager.usePointValue(submission.participantId, newPointValue);
    }

    // Update submission
    const updatedSubmission: AnswerSubmission = {
      ...submission,
      answer: newAnswer,
      pointValue: newPointValue,
      submittedAt: new Date()
    };

    this.state.submissions.set(submissionId, updatedSubmission);

    // Emit event
    this.emitEvent(SubmissionEventType.SUBMISSION_UPDATED, {
      questionId: submission.questionId,
      participantId: submission.participantId,
      submissionId,
      data: { oldSubmission: submission, newSubmission: updatedSubmission }
    });

    return { success: true, submissionId, errors: [] };
  }

  public deleteSubmission(submissionId: string): { success: boolean; errors: string[] } {
    const submission = this.state.submissions.get(submissionId);
    if (!submission) {
      return { success: false, errors: ['Submission not found'] };
    }

    if (this.isSubmissionLocked(submissionId)) {
      return { success: false, errors: ['Cannot delete locked submission'] };
    }

    // Remove from all mappings
    this.state.submissions.delete(submissionId);
    this.state.lockedSubmissions.delete(submissionId);

    // Update participant submissions mapping
    const participantSubmissions = this.state.participantSubmissions.get(submission.participantId);
    if (participantSubmissions) {
      participantSubmissions.delete(submission.questionId);
    }

    // Update point value usage
    const participantUsage = this.state.pointValueUsage.get(submission.participantId);
    if (participantUsage) {
      participantUsage.delete(submission.pointValue);
    }

    // Update question submissions mapping
    const questionSubmissions = this.state.submissionsByQuestion.get(submission.questionId);
    if (questionSubmissions) {
      questionSubmissions.delete(submissionId);
    }

    // Update participant submissions mapping
    const participantSubmissionsSet = this.state.submissionsByParticipant.get(submission.participantId);
    if (participantSubmissionsSet) {
      participantSubmissionsSet.delete(submissionId);
    }

    // Update round manager
    this.roundManager.releasePointValue(submission.participantId, submission.pointValue);

    // Emit event
    this.emitEvent(SubmissionEventType.SUBMISSION_DELETED, {
      questionId: submission.questionId,
      participantId: submission.participantId,
      submissionId,
      data: { deletedSubmission: submission }
    });

    return { success: true, errors: [] };
  }

  // Locking/Unlocking
  public lockSubmission(submissionId: string): boolean {
    if (!this.state.submissions.has(submissionId)) {
      return false;
    }

    if (this.state.lockedSubmissions.has(submissionId)) {
      return true; // Already locked
    }

    this.state.lockedSubmissions.add(submissionId);
    
    const submission = this.state.submissions.get(submissionId)!;
    this.emitEvent(SubmissionEventType.SUBMISSION_LOCKED, {
      questionId: submission.questionId,
      participantId: submission.participantId,
      submissionId
    });

    return true;
  }

  public unlockSubmission(submissionId: string): boolean {
    if (!this.state.submissions.has(submissionId)) {
      return false;
    }

    if (!this.state.lockedSubmissions.has(submissionId)) {
      return true; // Already unlocked
    }

    this.state.lockedSubmissions.delete(submissionId);
    
    const submission = this.state.submissions.get(submissionId)!;
    this.emitEvent(SubmissionEventType.SUBMISSION_UNLOCKED, {
      questionId: submission.questionId,
      participantId: submission.participantId,
      submissionId
    });

    return true;
  }

  public lockAllSubmissions(): void {
    this.state.submissions.forEach((submission, submissionId) => {
      if (!this.state.lockedSubmissions.has(submissionId)) {
        this.state.lockedSubmissions.add(submissionId);
      }
    });

    this.emitEvent(SubmissionEventType.ROUND_LOCKED, {
      questionId: '',
      participantId: '',
      submissionId: '',
      data: { lockedCount: this.state.lockedSubmissions.size }
    });
  }

  public unlockAllSubmissions(): void {
    this.state.lockedSubmissions.clear();

    this.emitEvent(SubmissionEventType.ROUND_UNLOCKED, {
      questionId: '',
      participantId: '',
      submissionId: '',
      data: { unlockedCount: this.state.submissions.size }
    });
  }

  // Validation
  private validateSubmission(
    questionId: string,
    participantId: string,
    answer: string,
    pointValue: number,
    excludeSubmissionId?: string
  ): SubmissionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.options.enableValidation) {
      return { isValid: true, errors, warnings };
    }

    // Validate required fields
    if (!questionId.trim()) {
      errors.push('Question ID is required');
    }

    if (!participantId.trim()) {
      errors.push('Participant ID is required');
    }

    if (!answer.trim()) {
      errors.push('Answer is required');
    }

    if (this.options.requirePointValueSelection && (!pointValue || pointValue <= 0)) {
      errors.push('Point value selection is required');
    }

    // Validate point value against round rules
    const currentRound = this.roundManager.getCurrentRound();
    if (currentRound) {
      const availablePointValues = this.roundManager.getAvailablePointValues(currentRound.id);
      if (!availablePointValues.includes(pointValue)) {
        errors.push(`Point value ${pointValue} is not valid for this round`);
      }

      // Check if point value is already used by this participant
      if (!this.options.allowDuplicatePointValues) {
        const usedPointValues = this.state.pointValueUsage.get(participantId) || new Set();
        if (usedPointValues.has(pointValue)) {
          // Check if this is an update to the same submission
          const existingSubmissionId = this.getParticipantSubmissionForQuestion(participantId, questionId);
          if (existingSubmissionId !== excludeSubmissionId) {
            errors.push(`Point value ${pointValue} has already been used in this round`);
          }
        }
      }
    }

    // Validate max submissions per question
    if (this.options.maxSubmissionsPerQuestion > 0) {
      const questionSubmissions = this.state.submissionsByQuestion.get(questionId) || new Set();
      const participantSubmissionsForQuestion = Array.from(questionSubmissions).filter(subId => {
        const sub = this.state.submissions.get(subId);
        return sub && sub.participantId === participantId && subId !== excludeSubmissionId;
      });

      if (participantSubmissionsForQuestion.length >= this.options.maxSubmissionsPerQuestion) {
        errors.push(`Maximum ${this.options.maxSubmissionsPerQuestion} submission(s) allowed per question`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Getters
  public getSubmission(submissionId: string): AnswerSubmission | undefined {
    return this.state.submissions.get(submissionId);
  }

  public getSubmissionsByParticipant(participantId: string): AnswerSubmission[] {
    const submissionIds = this.state.submissionsByParticipant.get(participantId) || new Set();
    return Array.from(submissionIds)
      .map(id => this.state.submissions.get(id))
      .filter((sub): sub is AnswerSubmission => sub !== undefined);
  }

  public getSubmissionsByQuestion(questionId: string): AnswerSubmission[] {
    const submissionIds = this.state.submissionsByQuestion.get(questionId) || new Set();
    return Array.from(submissionIds)
      .map(id => this.state.submissions.get(id))
      .filter((sub): sub is AnswerSubmission => sub !== undefined);
  }

  public getParticipantSubmissionForQuestion(participantId: string, questionId: string): string | undefined {
    return this.state.participantSubmissions.get(participantId)?.get(questionId);
  }

  public isSubmissionLocked(submissionId: string): boolean {
    return this.state.lockedSubmissions.has(submissionId);
  }

  public getUsedPointValues(participantId: string): number[] {
    return Array.from(this.state.pointValueUsage.get(participantId) || new Set());
  }

  public getAvailablePointValues(participantId: string): number[] {
    const currentRound = this.roundManager.getCurrentRound();
    if (!currentRound) return [];

    const allPointValues = this.roundManager.getAvailablePointValues(currentRound.id);
    const usedPointValues = this.getUsedPointValues(participantId);
    
    return allPointValues.filter(value => !usedPointValues.includes(value));
  }

  public getAllSubmissions(): AnswerSubmission[] {
    return Array.from(this.state.submissions.values());
  }

  public getSubmissionCount(): number {
    return this.state.submissions.size;
  }

  public getLockedSubmissionCount(): number {
    return this.state.lockedSubmissions.size;
  }

  // Event System
  public addEventListener(type: SubmissionEventType, listener: SubmissionEventListener): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  public removeEventListener(type: SubmissionEventType, listener: SubmissionEventListener): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  public removeAllEventListeners(type?: SubmissionEventType): void {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
    }
  }

  private emitEvent(type: SubmissionEventType, data: Partial<SubmissionEvent>): void {
    const event: SubmissionEvent = {
      type,
      timestamp: new Date(),
      submissionId: data.submissionId || '',
      participantId: data.participantId || '',
      questionId: data.questionId || '',
      data: data.data
    };

    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in submission event listener for ${type}:`, error);
        }
      });
    }
  }

  // Utility
  private generateSubmissionId(): string {
    return `submission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public reset(): void {
    this.state = this.createInitialState();
  }

  public exportState(): SubmissionState {
    return {
      submissions: new Map(this.state.submissions),
      lockedSubmissions: new Set(this.state.lockedSubmissions),
      participantSubmissions: new Map(
        Array.from(this.state.participantSubmissions.entries()).map(
          ([key, value]) => [key, new Map(value)]
        )
      ),
      pointValueUsage: new Map(
        Array.from(this.state.pointValueUsage.entries()).map(
          ([key, value]) => [key, new Set(value)]
        )
      ),
      submissionsByQuestion: new Map(
        Array.from(this.state.submissionsByQuestion.entries()).map(
          ([key, value]) => [key, new Set(value)]
        )
      ),
      submissionsByParticipant: new Map(
        Array.from(this.state.submissionsByParticipant.entries()).map(
          ([key, value]) => [key, new Set(value)]
        )
      )
    };
  }

  public importState(state: SubmissionState): void {
    this.state = state;
  }
} 
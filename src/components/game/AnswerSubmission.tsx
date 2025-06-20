import React, { useState, useEffect, useCallback } from 'react';
import {
  Lock,
  Unlock,
  Send,
  Edit3,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import {
  AnswerSubmissionManager,
  AnswerSubmission,
  SubmissionEventType,
} from '../../services/answerSubmissionManager';
import { Question } from '../../types/game';

export interface AnswerSubmissionProps {
  question: Question;
  participantId: string;
  submissionManager: AnswerSubmissionManager;
  availablePointValues: number[];
  isReadOnly?: boolean;
  showPointValues?: boolean;
  showLockControls?: boolean;
  autoSubmit?: boolean;
  className?: string;
  onSubmissionChange?: (submission: AnswerSubmission | null) => void;
  onValidationError?: (errors: string[]) => void;
  onSubmissionLocked?: (submissionId: string) => void;
  onSubmissionUnlocked?: (submissionId: string) => void;
}

export interface AnswerSubmissionState {
  answer: string;
  selectedPointValue: number | null;
  submission: AnswerSubmission | null;
  isLocked: boolean;
  isSubmitting: boolean;
  errors: string[];
  warnings: string[];
  hasUnsavedChanges: boolean;
}

const AnswerSubmission: React.FC<AnswerSubmissionProps> = ({
  question,
  participantId,
  submissionManager,
  availablePointValues,
  isReadOnly = false,
  showPointValues = true,
  showLockControls = false,
  autoSubmit = false,
  className = '',
  onSubmissionChange,
  onValidationError,
  onSubmissionLocked,
  onSubmissionUnlocked,
}) => {
  const [state, setState] = useState<AnswerSubmissionState>(() => {
    const existingSubmissionId =
      submissionManager.getParticipantSubmissionForQuestion(
        participantId,
        question.id
      );
    const existingSubmission = existingSubmissionId
      ? submissionManager.getSubmission(existingSubmissionId)
      : null;

    return {
      answer: existingSubmission?.answer || '',
      selectedPointValue: existingSubmission?.pointValue || null,
      submission: existingSubmission,
      isLocked: existingSubmission
        ? submissionManager.isSubmissionLocked(existingSubmission.submissionId)
        : false,
      isSubmitting: false,
      errors: [],
      warnings: [],
      hasUnsavedChanges: false,
    };
  });

  // Update state when submission manager changes
  useEffect(() => {
    const updateSubmissionState = () => {
      const submissionId =
        submissionManager.getParticipantSubmissionForQuestion(
          participantId,
          question.id
        );
      const submission = submissionId
        ? submissionManager.getSubmission(submissionId)
        : null;
      const isLocked = submission
        ? submissionManager.isSubmissionLocked(submission.submissionId)
        : false;

      setState(prev => ({
        ...prev,
        submission,
        isLocked,
        answer: submission?.answer || prev.answer,
        selectedPointValue: submission?.pointValue || prev.selectedPointValue,
      }));

      onSubmissionChange?.(submission);
    };

    const handleSubmissionEvent = () => {
      updateSubmissionState();
    };

    // Subscribe to submission events
    submissionManager.addEventListener(
      SubmissionEventType.SUBMISSION_CREATED,
      handleSubmissionEvent
    );
    submissionManager.addEventListener(
      SubmissionEventType.SUBMISSION_UPDATED,
      handleSubmissionEvent
    );
    submissionManager.addEventListener(
      SubmissionEventType.SUBMISSION_LOCKED,
      handleSubmissionEvent
    );
    submissionManager.addEventListener(
      SubmissionEventType.SUBMISSION_UNLOCKED,
      handleSubmissionEvent
    );
    submissionManager.addEventListener(
      SubmissionEventType.SUBMISSION_DELETED,
      handleSubmissionEvent
    );

    // Initial update
    updateSubmissionState();

    return () => {
      submissionManager.removeEventListener(
        SubmissionEventType.SUBMISSION_CREATED,
        handleSubmissionEvent
      );
      submissionManager.removeEventListener(
        SubmissionEventType.SUBMISSION_UPDATED,
        handleSubmissionEvent
      );
      submissionManager.removeEventListener(
        SubmissionEventType.SUBMISSION_LOCKED,
        handleSubmissionEvent
      );
      submissionManager.removeEventListener(
        SubmissionEventType.SUBMISSION_UNLOCKED,
        handleSubmissionEvent
      );
      submissionManager.removeEventListener(
        SubmissionEventType.SUBMISSION_DELETED,
        handleSubmissionEvent
      );
    };
  }, [submissionManager, participantId, question.id, onSubmissionChange]);

  // Handle answer input change
  const handleAnswerChange = useCallback((value: string) => {
    setState(prev => ({
      ...prev,
      answer: value,
      hasUnsavedChanges: value !== (prev.submission?.answer || ''),
      errors: [],
      warnings: [],
    }));
  }, []);

  // Handle point value selection
  const handlePointValueChange = useCallback(
    (pointValue: number) => {
      setState(prev => ({
        ...prev,
        selectedPointValue: pointValue,
        hasUnsavedChanges: true,
        errors: [],
        warnings: [],
      }));

      // Auto-submit if enabled and answer is provided
      if (autoSubmit && state.answer.trim()) {
        handleSubmit(state.answer, pointValue);
      }
    },
    [autoSubmit, state.answer]
  );

  // Handle submission
  const handleSubmit = useCallback(
    async (answerText?: string, pointValue?: number) => {
      const finalAnswer = answerText || state.answer;
      const finalPointValue = pointValue || state.selectedPointValue;

      if (!finalAnswer.trim()) {
        setState(prev => ({ ...prev, errors: ['Answer is required'] }));
        onValidationError?.(['Answer is required']);
        return;
      }

      if (showPointValues && !finalPointValue) {
        setState(prev => ({
          ...prev,
          errors: ['Point value selection is required'],
        }));
        onValidationError?.(['Point value selection is required']);
        return;
      }

      setState(prev => ({
        ...prev,
        isSubmitting: true,
        errors: [],
        warnings: [],
      }));

      try {
        const result = submissionManager.submitAnswer(
          question.id,
          participantId,
          finalAnswer,
          finalPointValue || 1
        );

        if (result.success) {
          setState(prev => ({
            ...prev,
            isSubmitting: false,
            hasUnsavedChanges: false,
            errors: [],
            warnings: [],
          }));
        } else {
          setState(prev => ({
            ...prev,
            isSubmitting: false,
            errors: result.errors,
            warnings: [],
          }));
          onValidationError?.(result.errors);
        }
      } catch (error) {
        console.error('Submission error:', error);
        setState(prev => ({
          ...prev,
          isSubmitting: false,
          errors: ['An unexpected error occurred'],
          warnings: [],
        }));
      }
    },
    [
      state.answer,
      state.selectedPointValue,
      question.id,
      participantId,
      submissionManager,
      showPointValues,
      onValidationError,
    ]
  );

  // Handle lock/unlock
  const handleToggleLock = useCallback(() => {
    if (!state.submission) return;

    if (state.isLocked) {
      const success = submissionManager.unlockSubmission(
        state.submission.submissionId
      );
      if (success) {
        onSubmissionUnlocked?.(state.submission.submissionId);
      }
    } else {
      const success = submissionManager.lockSubmission(
        state.submission.submissionId
      );
      if (success) {
        onSubmissionLocked?.(state.submission.submissionId);
      }
    }
  }, [
    state.submission,
    state.isLocked,
    submissionManager,
    onSubmissionLocked,
    onSubmissionUnlocked,
  ]);

  // Handle deletion
  const handleDelete = useCallback(() => {
    if (!state.submission || state.isLocked) return;

    if (window.confirm('Are you sure you want to delete this submission?')) {
      const result = submissionManager.deleteSubmission(
        state.submission.submissionId
      );
      if (result.success) {
        setState(prev => ({
          ...prev,
          answer: '',
          selectedPointValue: null,
          submission: null,
          isLocked: false,
          hasUnsavedChanges: false,
          errors: [],
          warnings: [],
        }));
      }
    }
  }, [state.submission, state.isLocked, submissionManager]);

  // Check if form is valid
  const isFormValid =
    state.answer.trim() && (!showPointValues || state.selectedPointValue);
  const canSubmit =
    !isReadOnly && !state.isLocked && !state.isSubmitting && isFormValid;
  const canEdit = !isReadOnly && !state.isLocked;

  return (
    <div className={`bg-white border rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">Your Answer</h3>
          {state.submission && (
            <div className="flex items-center space-x-1">
              {state.isLocked ? (
                <Lock className="w-4 h-4 text-red-500" />
              ) : (
                <Unlock className="w-4 h-4 text-green-500" />
              )}
              <span
                className={`text-xs font-medium ${state.isLocked ? 'text-red-600' : 'text-green-600'}`}
              >
                {state.isLocked ? 'Locked' : 'Unlocked'}
              </span>
            </div>
          )}
        </div>

        {/* Lock Controls */}
        {showLockControls && state.submission && (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleToggleLock}
              className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                state.isLocked
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {state.isLocked ? (
                <Unlock className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              <span>{state.isLocked ? 'Unlock' : 'Lock'}</span>
            </button>

            {!state.isLocked && (
              <button
                onClick={handleDelete}
                className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-md text-sm font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Point Value Selection */}
      {showPointValues && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Point Value{' '}
            {state.selectedPointValue && `(${state.selectedPointValue} points)`}
          </label>
          <div className="flex flex-wrap gap-2">
            {availablePointValues.map(value => (
              <button
                key={value}
                onClick={() => handlePointValueChange(value)}
                disabled={!canEdit}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  state.selectedPointValue === value
                    ? 'bg-blue-500 text-white'
                    : canEdit
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Answer Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Answer
        </label>
        {question.type === 'multiple-choice' ? (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={`answer-${question.id}`}
                  value={option}
                  checked={state.answer === option}
                  onChange={e => handleAnswerChange(e.target.value)}
                  disabled={!canEdit}
                  className="text-blue-500 focus:ring-blue-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        ) : (
          <textarea
            value={state.answer}
            onChange={e => handleAnswerChange(e.target.value)}
            disabled={!canEdit}
            placeholder="Enter your answer..."
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              canEdit
                ? 'border-gray-300'
                : 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
            }`}
            rows={3}
          />
        )}
      </div>

      {/* Error Messages */}
      {state.errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800">
                Validation Errors
              </h4>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {state.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warning Messages */}
      {state.warnings.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Warnings</h4>
              <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                {state.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Submission Status */}
      {state.submission && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Answer submitted{' '}
                {showPointValues && `for ${state.submission.pointValue} points`}
              </p>
              <p className="text-xs text-green-600">
                Submitted at {state.submission.submittedAt.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {!autoSubmit && (
            <button
              onClick={() => handleSubmit()}
              disabled={!canSubmit}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
                canSubmit
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {state.isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{state.submission ? 'Update' : 'Submit'}</span>
                </>
              )}
            </button>
          )}

          {state.submission && !state.isLocked && (
            <button
              onClick={() => handleAnswerChange('')}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md font-medium transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Unsaved Changes Indicator */}
        {state.hasUnsavedChanges && !autoSubmit && (
          <div className="flex items-center space-x-1 text-orange-600">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Unsaved changes</span>
          </div>
        )}
      </div>

      {/* Read-only Notice */}
      {isReadOnly && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm text-gray-600">
            This submission is in read-only mode.
          </p>
        </div>
      )}
    </div>
  );
};

export default AnswerSubmission;

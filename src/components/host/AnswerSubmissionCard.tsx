import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Clock,
  Lock,
  Unlock,
  AlertTriangle,
  MessageSquare,
  User,
  Target,
  Calendar,
  Star,
  Edit3,
  Trash2,
  Eye,
  MoreHorizontal,
} from 'lucide-react';
import type {
  AnswerSubmissionCardProps,
  AnswerReviewAction,
  AnswerReviewStatus,
} from '../../types/answerManagement';

const AnswerSubmissionCard: React.FC<AnswerSubmissionCardProps> = ({
  submission,
  teamName,
  questionText,
  questionNumber,
  isSelected = false,
  showActions = true,
  showTeamInfo = true,
  showTimestamp = true,
  onReview,
  onSelect,
  onLockToggle,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackText, setFeedbackText] = useState(
    submission.hostFeedback || ''
  );
  const [customPoints, setCustomPoints] = useState(
    submission.pointsAwarded || submission.pointValue
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status-based styling
  const getStatusStyles = (status: AnswerReviewStatus) => {
    switch (status) {
      case 'approved':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          icon: CheckCircle,
          iconColor: 'text-green-600',
        };
      case 'rejected':
        return {
          bg: 'bg-red-50 border-red-200',
          text: 'text-red-800',
          icon: XCircle,
          iconColor: 'text-red-600',
        };
      case 'needs-review':
        return {
          bg: 'bg-orange-50 border-orange-200',
          text: 'text-orange-800',
          icon: AlertTriangle,
          iconColor: 'text-orange-600',
        };
      case 'auto-approved':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          icon: CheckCircle,
          iconColor: 'text-blue-600',
        };
      default: // pending
        return {
          bg: 'bg-yellow-50 border-yellow-200',
          text: 'text-yellow-800',
          icon: Clock,
          iconColor: 'text-yellow-600',
        };
    }
  };

  const statusStyles = getStatusStyles(submission.reviewStatus);
  const StatusIcon = statusStyles.icon;

  // Handle review actions
  const handleReviewAction = useCallback(
    async (action: 'approve' | 'reject' | 'needs-review') => {
      if (!onReview) return;

      setIsSubmitting(true);
      try {
        const reviewAction: AnswerReviewAction = {
          submissionId: submission.submissionId,
          action,
          feedback: feedbackText || undefined,
          pointsAwarded: action === 'approve' ? customPoints : 0,
          reviewedBy: 'current-host-id', // Would come from auth context
          reviewedAt: new Date(),
        };

        await onReview(reviewAction);
        setShowFeedbackForm(false);
        setFeedbackText('');
      } catch (error) {
        console.error('Failed to review submission:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [submission.submissionId, feedbackText, customPoints, onReview]
  );

  const handleSelectToggle = useCallback(() => {
    onSelect?.(submission.submissionId, !isSelected);
  }, [submission.submissionId, isSelected, onSelect]);

  const handleLockToggle = useCallback(() => {
    onLockToggle?.(submission.submissionId);
  }, [submission.submissionId, onLockToggle]);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <motion.div
      layout
      className={`
        relative bg-white rounded-lg border-2 transition-all duration-200 hover:shadow-md
        ${statusStyles.bg}
        ${isSelected ? 'ring-2 ring-blue-500 border-blue-300' : 'border-gray-200'}
        ${submission.isLocked ? 'opacity-75' : ''}
        ${className}
      `}
    >
      {/* Lock indicator */}
      {submission.isLocked && (
        <div className="absolute top-2 right-2 z-10">
          <div className="p-1 bg-gray-800 text-white rounded-full">
            <Lock className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* Conflict indicator */}
      {submission.hasConflict && (
        <div className="absolute top-2 left-2 z-10">
          <div className="p-1 bg-orange-500 text-white rounded-full">
            <AlertTriangle className="w-3 h-3" />
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            {/* Selection checkbox */}
            {showActions && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={handleSelectToggle}
                className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
              />
            )}

            <div className="flex-1 min-w-0">
              {/* Team info */}
              {showTeamInfo && (
                <div className="flex items-center space-x-2 mb-1">
                  <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="font-medium text-gray-900 truncate">
                    {teamName}
                  </span>
                </div>
              )}

              {/* Question info */}
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm text-gray-600">
                  Q{questionNumber}: {truncateText(questionText, 50)}
                </span>
              </div>
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <div
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusStyles.text} bg-white border`}
            >
              <StatusIcon className={`w-3 h-3 ${statusStyles.iconColor}`} />
              <span className="capitalize">
                {submission.reviewStatus.replace('-', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Answer content */}
        <div className="mb-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-900 font-medium">
                  {isExpanded
                    ? submission.answer
                    : truncateText(submission.answer, 100)}
                </p>
                {submission.answer.length > 100 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>

              {/* Point value */}
              <div className="ml-3 flex items-center space-x-1 bg-white px-2 py-1 rounded-full border">
                <Star className="w-3 h-3 text-yellow-500" />
                <span className="text-sm font-medium text-gray-900">
                  {submission.pointsAwarded || submission.pointValue}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Host feedback */}
        {submission.hostFeedback && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Host Feedback
                </p>
                <p className="text-sm text-blue-800">
                  {submission.hostFeedback}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-4">
            {showTimestamp && (
              <div className="flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>
                  Submitted {formatTimestamp(new Date(submission.submittedAt))}
                </span>
              </div>
            )}

            {submission.reviewedAt && (
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>
                  Reviewed {formatTimestamp(new Date(submission.reviewedAt))}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {submission.isLocked && (
              <span className="text-orange-600 font-medium">Locked</span>
            )}
          </div>
        </div>

        {/* Feedback form */}
        {showFeedbackForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-3 bg-gray-50 rounded-lg border"
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback (optional)
                </label>
                <textarea
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="Add feedback for the team..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points to Award
                </label>
                <input
                  type="number"
                  value={customPoints}
                  onChange={e => setCustomPoints(parseInt(e.target.value) || 0)}
                  min={0}
                  max={6}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Action buttons */}
        {showActions &&
          submission.reviewStatus === 'pending' &&
          !submission.isLocked && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleReviewAction('approve')}
                  disabled={isSubmitting}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve</span>
                </button>

                <button
                  onClick={() => handleReviewAction('reject')}
                  disabled={isSubmitting}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>

                <button
                  onClick={() => setShowFeedbackForm(!showFeedbackForm)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Feedback</span>
                </button>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={handleLockToggle}
                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  title={
                    submission.isLocked
                      ? 'Unlock submission'
                      : 'Lock submission'
                  }
                >
                  {submission.isLocked ? (
                    <Unlock className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

        {/* Locked state message */}
        {submission.isLocked && showActions && (
          <div className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded-md">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-800">
                This submission is locked and cannot be modified
              </span>
            </div>
            <button
              onClick={handleLockToggle}
              className="px-2 py-1 text-xs bg-orange-200 text-orange-800 rounded hover:bg-orange-300 transition-colors"
            >
              Unlock
            </button>
          </div>
        )}
      </div>

      {/* Loading overlay */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">Processing...</span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export { AnswerSubmissionCard };

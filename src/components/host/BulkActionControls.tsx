import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  Trash2,
  RefreshCw,
  Users,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import type {
  BulkActionControlsProps,
  BulkAnswerAction,
} from '../../types/answerManagement';

const BulkActionControls: React.FC<BulkActionControlsProps> = ({
  selectedCount,
  isActionInProgress,
  onBulkAction,
  onSelectAll,
  onSelectNone,
  className = '',
}) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState('');
  const [pendingAction, setPendingAction] = useState<
    'approve' | 'reject' | null
  >(null);

  const handleBulkAction = useCallback(
    (action: BulkAnswerAction['action'], feedback?: string) => {
      const bulkAction: BulkAnswerAction = {
        submissionIds: [], // Will be populated by parent component
        action,
        feedback,
        reviewedBy: 'current-host-id', // Would come from auth context
        reviewedAt: new Date(),
      };

      onBulkAction(bulkAction);
      setShowFeedbackForm(false);
      setBulkFeedback('');
      setPendingAction(null);
    },
    [onBulkAction]
  );

  const handleActionWithFeedback = useCallback(
    (action: 'approve' | 'reject') => {
      setPendingAction(action);
      setShowFeedbackForm(true);
    },
    []
  );

  const handleSubmitWithFeedback = useCallback(() => {
    if (pendingAction) {
      handleBulkAction(pendingAction, bulkFeedback || undefined);
    }
  }, [pendingAction, bulkFeedback, handleBulkAction]);

  const handleCancelFeedback = useCallback(() => {
    setShowFeedbackForm(false);
    setBulkFeedback('');
    setPendingAction(null);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-900">
              {selectedCount} submission{selectedCount !== 1 ? 's' : ''}{' '}
              selected
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Select All
            </button>
            <span className="text-gray-400">•</span>
            <button
              onClick={onSelectNone}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Select None
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center space-x-3 mb-4">
        {/* Approve All */}
        <button
          onClick={() => handleActionWithFeedback('approve')}
          disabled={isActionInProgress}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Approve All</span>
        </button>

        {/* Reject All */}
        <button
          onClick={() => handleActionWithFeedback('reject')}
          disabled={isActionInProgress}
          className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
          <span>Reject All</span>
        </button>

        {/* Lock All */}
        <button
          onClick={() => handleBulkAction('lock')}
          disabled={isActionInProgress}
          className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          <Lock className="w-4 h-4" />
          <span>Lock All</span>
        </button>

        {/* Unlock All */}
        <button
          onClick={() => handleBulkAction('unlock')}
          disabled={isActionInProgress}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <Unlock className="w-4 h-4" />
          <span>Unlock All</span>
        </button>
      </div>

      {/* Feedback Form */}
      {showFeedbackForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-4 mb-4"
        >
          <div className="flex items-center space-x-2 mb-3">
            <MessageSquare className="w-4 h-4 text-gray-600" />
            <h4 className="font-medium text-gray-900">
              {pendingAction === 'approve' ? 'Bulk Approve' : 'Bulk Reject'} -
              Add Feedback
            </h4>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Feedback for all selected submissions (optional)
              </label>
              <textarea
                value={bulkFeedback}
                onChange={e => setBulkFeedback(e.target.value)}
                placeholder="Add feedback that will be applied to all selected submissions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={handleCancelFeedback}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitWithFeedback}
                disabled={isActionInProgress}
                className={`
                  px-4 py-1.5 text-sm font-medium rounded-md transition-colors
                  ${
                    pendingAction === 'approve'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }
                  disabled:opacity-50
                `}
              >
                {isActionInProgress ? (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <span>
                    {pendingAction === 'approve' ? 'Approve' : 'Reject'}{' '}
                    {selectedCount} Submissions
                  </span>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {isActionInProgress && !showFeedbackForm && (
        <div className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-gray-200">
          <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
          <span className="text-sm text-gray-600">
            Processing bulk action...
          </span>
        </div>
      )}

      {/* Tips */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Use bulk actions to quickly review multiple
          submissions at once. You can add feedback that will be applied to all
          selected submissions.
        </p>
      </div>
    </motion.div>
  );
};

export { BulkActionControls };

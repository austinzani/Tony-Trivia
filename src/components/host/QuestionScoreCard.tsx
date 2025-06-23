import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  Edit3,
  Clock,
  Target,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { type QuestionScoreCardProps } from '../../types/scoreManagement';

export function QuestionScoreCard({
  questionData,
  entityType,
  onScoreChange,
  canEdit = true,
}: QuestionScoreCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newScore, setNewScore] = useState(questionData.currentScore);
  const [reason, setReason] = useState('');

  const handleSave = () => {
    if (newScore !== questionData.currentScore && reason.trim()) {
      onScoreChange(questionData.questionId, newScore, reason);
      setIsEditing(false);
      setReason('');
    }
  };

  const handleCancel = () => {
    setNewScore(questionData.currentScore);
    setReason('');
    setIsEditing(false);
  };

  // Get status color and icon
  const getStatusDisplay = () => {
    if (questionData.isCorrect) {
      return {
        icon: CheckCircle,
        color: 'text-green-600',
        bg: 'bg-green-100',
        label: 'Correct',
      };
    } else {
      return {
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-100',
        label: 'Incorrect',
      };
    }
  };

  const {
    icon: StatusIcon,
    color: statusColor,
    bg: statusBg,
    label: statusLabel,
  } = getStatusDisplay();

  // Calculate score percentage
  const scorePercentage =
    questionData.maxPossibleScore > 0
      ? (questionData.currentScore / questionData.maxPossibleScore) * 100
      : 0;

  return (
    <motion.div
      layout
      className="question-score-card bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`p-2 rounded-lg ${statusBg}`}>
            <StatusIcon className={`w-4 h-4 ${statusColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
              {questionData.questionText}
            </h4>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
              <span
                className={`px-2 py-1 rounded-full ${statusBg} ${statusColor}`}
              >
                {statusLabel}
              </span>
              {questionData.submissionTime && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(questionData.submissionTime).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {canEdit && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Edit score"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Score Display */}
      {!isEditing ? (
        <div className="space-y-3">
          {/* Score Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Score</span>
              <span className="font-medium text-gray-900">
                {questionData.currentScore} / {questionData.maxPossibleScore}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  questionData.isCorrect ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{
                  width: `${Math.max(0, Math.min(100, scorePercentage))}%`,
                }}
              />
            </div>
            <div className="text-xs text-gray-500 text-center">
              {scorePercentage.toFixed(1)}% of possible points
            </div>
          </div>

          {/* Answer Display */}
          {questionData.originalAnswer && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <HelpCircle className="w-4 h-4 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">
                    {entityType === 'team' ? 'Team' : 'Player'} Answer:
                  </p>
                  <p className="text-sm text-gray-900 font-medium">
                    {questionData.originalAnswer}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Correct Answer */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <Target className="w-4 h-4 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-green-700 mb-1">Correct Answer:</p>
                <p className="text-sm text-green-900 font-medium">
                  {questionData.correctAnswer}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <div className="space-y-4">
          {/* Score Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Adjust Score
            </label>
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <input
                  type="number"
                  value={newScore}
                  onChange={e => setNewScore(Number(e.target.value))}
                  min={0}
                  max={questionData.maxPossibleScore}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="text-sm text-gray-600">
                / {questionData.maxPossibleScore}
              </div>
            </div>

            {/* Score Change Indicator */}
            {newScore !== questionData.currentScore && (
              <div className="mt-2 text-sm">
                <span className="text-gray-600">Change: </span>
                <span
                  className={`font-medium ${
                    newScore > questionData.currentScore
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {newScore > questionData.currentScore ? '+' : ''}
                  {newScore - questionData.currentScore} points
                </span>
              </div>
            )}
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Reason for Change <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Explain why this score is being adjusted..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Warning for significant changes */}
          {Math.abs(newScore - questionData.currentScore) >
            questionData.maxPossibleScore * 0.5 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-yellow-800 text-sm font-medium">
                    Large Score Change
                  </p>
                  <p className="text-yellow-700 text-sm">
                    This adjustment represents a significant change to the
                    original score.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={
                newScore === questionData.currentScore || !reason.trim()
              }
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

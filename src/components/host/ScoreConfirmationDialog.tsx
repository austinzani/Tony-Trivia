import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Target,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { type ScoreConfirmationDialogProps } from '../../types/scoreManagement';

export function ScoreConfirmationDialog({
  isOpen,
  data,
  onConfirm,
  onCancel,
  validationResult,
}: ScoreConfirmationDialogProps) {
  if (!isOpen) return null;

  const {
    entityId,
    entityType,
    entityName,
    currentScore,
    newScore,
    adjustment,
    reason,
    questionId,
    questionText,
  } = data;

  // Get icon and color based on adjustment type
  const getAdjustmentIcon = () => {
    if (adjustment > 0)
      return { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' };
    if (adjustment < 0)
      return { icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-100' };
    return { icon: Target, color: 'text-blue-600', bg: 'bg-blue-100' };
  };

  const {
    icon: AdjustmentIcon,
    color: iconColor,
    bg: iconBg,
  } = getAdjustmentIcon();

  // Get severity level
  const getSeverityLevel = () => {
    const percentChange = Math.abs((adjustment / currentScore) * 100);
    if (percentChange > 50) return 'high';
    if (percentChange > 20) return 'medium';
    return 'low';
  };

  const severityLevel = getSeverityLevel();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg"
      >
        {/* Header */}
        <div className="flex items-start space-x-4 mb-6">
          <div className={`p-3 rounded-lg ${iconBg}`}>
            <AdjustmentIcon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Confirm Score Adjustment
            </h3>
            <p className="text-gray-600">
              {entityType === 'team' ? 'Team' : 'Player'}:{' '}
              <span className="font-medium">{entityName}</span>
            </p>
            {questionText && (
              <p className="text-sm text-gray-500 mt-1">
                Question: {questionText}
              </p>
            )}
          </div>
        </div>

        {/* Score Change Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Current
              </p>
              <p className="text-lg font-bold text-gray-900">{currentScore}</p>
              <p className="text-xs text-gray-600">points</p>
            </div>
            <div className="flex items-center justify-center">
              <div
                className={`p-2 rounded-full ${adjustment > 0 ? 'bg-green-100' : adjustment < 0 ? 'bg-red-100' : 'bg-blue-100'}`}
              >
                {adjustment > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : adjustment < 0 ? (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                ) : (
                  <Target className="w-4 h-4 text-blue-600" />
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                New
              </p>
              <p className="text-lg font-bold text-gray-900">{newScore}</p>
              <p className="text-xs text-gray-600">points</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-sm text-gray-600">Adjustment:</span>
              <span
                className={`text-lg font-bold ${
                  adjustment > 0
                    ? 'text-green-600'
                    : adjustment < 0
                      ? 'text-red-600'
                      : 'text-blue-600'
                }`}
              >
                {adjustment > 0 ? '+' : ''}
                {adjustment} points
              </span>
            </div>
          </div>
        </div>

        {/* Validation Results */}
        {validationResult && (
          <div className="mb-6 space-y-3">
            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-medium text-sm">
                      Validation Errors
                    </p>
                    <ul className="text-red-700 text-sm mt-1 space-y-1">
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-yellow-800 font-medium text-sm">
                      Warnings
                    </p>
                    <ul className="text-yellow-700 text-sm mt-1 space-y-1">
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Severity Indicator */}
        {severityLevel !== 'low' && (
          <div
            className={`mb-6 p-3 rounded-lg border ${
              severityLevel === 'high'
                ? 'bg-red-50 border-red-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}
          >
            <div className="flex items-start space-x-2">
              <AlertCircle
                className={`w-5 h-5 mt-0.5 ${
                  severityLevel === 'high' ? 'text-red-600' : 'text-yellow-600'
                }`}
              />
              <div>
                <p
                  className={`font-medium text-sm ${
                    severityLevel === 'high'
                      ? 'text-red-800'
                      : 'text-yellow-800'
                  }`}
                >
                  {severityLevel === 'high'
                    ? 'Large Score Change'
                    : 'Significant Score Change'}
                </p>
                <p
                  className={`text-sm ${
                    severityLevel === 'high'
                      ? 'text-red-700'
                      : 'text-yellow-700'
                  }`}
                >
                  This adjustment represents a{' '}
                  {Math.abs((adjustment / currentScore) * 100).toFixed(1)}%
                  change from the current score.
                  {severityLevel === 'high' &&
                    ' Please ensure this is intentional.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reason Display */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-blue-800 font-medium text-sm mb-1">
                Reason for Adjustment
              </p>
              <p className="text-blue-700 text-sm leading-relaxed">{reason}</p>
            </div>
          </div>
        </div>

        {/* Performance Impact */}
        {entityType === 'team' && Math.abs(adjustment) >= 10 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-6">
            <div className="flex items-start space-x-2">
              <Zap className="w-5 h-5 text-purple-600 mt-0.5" />
              <div>
                <p className="text-purple-800 font-medium text-sm">
                  Team Impact
                </p>
                <p className="text-purple-700 text-sm">
                  This adjustment may significantly affect the team's
                  leaderboard position and could impact game dynamics.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={validationResult && !validationResult.isValid}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
              validationResult && !validationResult.isValid
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : severityLevel === 'high'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : adjustment > 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : adjustment < 0
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {severityLevel === 'high'
              ? 'Confirm Large Change'
              : 'Confirm Adjustment'}
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          This action will be logged and can be reviewed in the score history.
        </p>
      </motion.div>
    </motion.div>
  );
}

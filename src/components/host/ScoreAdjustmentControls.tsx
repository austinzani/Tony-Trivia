import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Minus,
  Edit3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { type ScoreAdjustmentControlsProps } from '../../types/scoreManagement';

export function ScoreAdjustmentControls({
  entityId,
  entityType,
  entityName,
  currentScore,
  onAdjust,
  disabled = false,
  maxScore = 1000,
  minScore = -100,
}: ScoreAdjustmentControlsProps) {
  const [adjustmentMode, setAdjustmentMode] = useState<
    'increment' | 'direct' | null
  >(null);
  const [adjustmentValue, setAdjustmentValue] = useState(0);
  const [directScore, setDirectScore] = useState(currentScore);
  const [reason, setReason] = useState('');
  const [showReasonInput, setShowReasonInput] = useState(false);

  // Predefined increment values
  const incrementValues = [1, 5, 10, 25, 50, 100];

  // Handle increment/decrement
  const handleIncrement = useCallback(
    (value: number) => {
      const newScore = currentScore + value;
      if (newScore > maxScore || newScore < minScore) return;

      setAdjustmentValue(value);
      setAdjustmentMode('increment');
      setShowReasonInput(true);
    },
    [currentScore, maxScore, minScore]
  );

  // Handle direct score change
  const handleDirectChange = useCallback(() => {
    if (directScore === currentScore) return;

    setAdjustmentValue(directScore - currentScore);
    setAdjustmentMode('direct');
    setShowReasonInput(true);
  }, [directScore, currentScore]);

  // Handle confirmation
  const handleConfirm = useCallback(() => {
    if (!reason.trim()) {
      alert('Please provide a reason for the score adjustment');
      return;
    }

    const newScore =
      adjustmentMode === 'direct'
        ? directScore
        : currentScore + adjustmentValue;

    onAdjust({
      entityId,
      entityType,
      entityName,
      currentScore,
      newScore,
      adjustment: adjustmentValue,
      reason: reason.trim(),
    });

    // Reset form
    setAdjustmentMode(null);
    setAdjustmentValue(0);
    setReason('');
    setShowReasonInput(false);
    setDirectScore(currentScore);
  }, [
    reason,
    adjustmentMode,
    directScore,
    currentScore,
    adjustmentValue,
    onAdjust,
    entityId,
    entityType,
    entityName,
  ]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setAdjustmentMode(null);
    setAdjustmentValue(0);
    setReason('');
    setShowReasonInput(false);
    setDirectScore(currentScore);
  }, [currentScore]);

  return (
    <div className="score-adjustment-controls">
      {/* Quick Increment/Decrement Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Increment Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Plus className="w-4 h-4 mr-2 text-green-600" />
            Add Points
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {incrementValues.map(value => (
              <button
                key={`add-${value}`}
                onClick={() => handleIncrement(value)}
                disabled={disabled || currentScore + value > maxScore}
                className="px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                +{value}
              </button>
            ))}
          </div>
        </div>

        {/* Decrement Section */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Minus className="w-4 h-4 mr-2 text-red-600" />
            Remove Points
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {incrementValues.map(value => (
              <button
                key={`subtract-${value}`}
                onClick={() => handleIncrement(-value)}
                disabled={disabled || currentScore - value < minScore}
                className="px-3 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                -{value}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Direct Score Input */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
          <Edit3 className="w-4 h-4 mr-2 text-blue-600" />
          Set Exact Score
        </h4>
        <div className="flex items-center space-x-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-600 mb-1">
              New Score
            </label>
            <input
              type="number"
              value={directScore}
              onChange={e => setDirectScore(Number(e.target.value))}
              disabled={disabled}
              min={minScore}
              max={maxScore}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
          <div className="text-center">
            <span className="text-xs text-gray-600 block mb-1">Change</span>
            <span
              className={`text-sm font-medium ${
                directScore - currentScore > 0
                  ? 'text-green-600'
                  : directScore - currentScore < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              {directScore - currentScore > 0 ? '+' : ''}
              {directScore - currentScore}
            </span>
          </div>
          <button
            onClick={handleDirectChange}
            disabled={disabled || directScore === currentScore}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Score Limits Warning */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
          <div className="text-sm">
            <p className="text-yellow-800 font-medium">Score Limits</p>
            <p className="text-yellow-700">
              Minimum: {minScore} points • Maximum: {maxScore} points
            </p>
          </div>
        </div>
      </div>

      {/* Reason Input Modal */}
      {showReasonInput && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              {adjustmentValue > 0 ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : adjustmentValue < 0 ? (
                <XCircle className="w-6 h-6 text-red-600" />
              ) : (
                <Edit3 className="w-6 h-6 text-blue-600" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirm Score Adjustment
                </h3>
                <p className="text-sm text-gray-600">
                  {entityType === 'team' ? 'Team' : 'Player'}: {entityName}
                </p>
              </div>
            </div>

            {/* Score Change Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Current Score:</span>
                <span className="font-medium">{currentScore} points</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">New Score:</span>
                <span className="font-medium">
                  {adjustmentMode === 'direct'
                    ? directScore
                    : currentScore + adjustmentValue}{' '}
                  points
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Adjustment:</span>
                  <span
                    className={`font-bold ${
                      adjustmentValue > 0
                        ? 'text-green-600'
                        : adjustmentValue < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {adjustmentValue > 0 ? '+' : ''}
                    {adjustmentValue} points
                  </span>
                </div>
              </div>
            </div>

            {/* Reason Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Reason for Adjustment <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Explain why this score adjustment is necessary..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!reason.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirm Adjustment
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

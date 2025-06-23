import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Calendar,
  User,
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  RotateCcw,
  Filter,
  Search,
  AlertTriangle,
  Clock,
  FileText,
} from 'lucide-react';
import { type ScoreHistoryDisplayProps } from '../../types/scoreManagement';

export function ScoreHistoryDisplay({
  history,
  filters,
  onFilterChange,
  onRevert,
  showActions = true,
}: ScoreHistoryDisplayProps) {
  const [sortBy, setSortBy] = useState<'timestamp' | 'adjustment' | 'entity'>(
    'timestamp'
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  // Filtered and sorted history
  const filteredHistory = useMemo(() => {
    let filtered = [...history];

    // Apply entity type filter
    if (filters.entityType && filters.entityType !== 'all') {
      filtered = filtered.filter(
        entry => entry.entityType === filters.entityType
      );
    }

    // Apply entity filter
    if (filters.entityId) {
      filtered = filtered.filter(entry => entry.entityId === filters.entityId);
    }

    // Apply adjustment type filter
    if (filters.adjustmentType && filters.adjustmentType !== 'all') {
      if (filters.adjustmentType === 'manual') {
        filtered = filtered.filter(entry => entry.type === 'manual');
      } else if (filters.adjustmentType === 'automatic') {
        filtered = filtered.filter(entry => entry.type === 'automatic');
      }
    }

    // Apply time range filter
    if (filters.timeRange) {
      filtered = filtered.filter(entry => {
        const entryTime = new Date(entry.timestamp);
        return (
          entryTime >= filters.timeRange!.start &&
          entryTime <= filters.timeRange!.end
        );
      });
    }

    // Apply show reverted filter
    if (!filters.showReverted) {
      filtered = filtered.filter(entry => !entry.isReverted);
    }

    // Apply question filter
    if (filters.questionId) {
      filtered = filtered.filter(
        entry => entry.questionId === filters.questionId
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'timestamp':
          comparison =
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case 'adjustment':
          comparison = Math.abs(a.adjustment) - Math.abs(b.adjustment);
          break;
        case 'entity':
          comparison = a.entityName.localeCompare(b.entityName);
          break;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [history, filters, sortBy, sortDirection]);

  // Get icon for adjustment type
  const getAdjustmentIcon = (entry: (typeof history)[0]) => {
    if (entry.isReverted) return { icon: RotateCcw, color: 'text-gray-500' };
    if (entry.adjustment > 0)
      return { icon: TrendingUp, color: 'text-green-600' };
    if (entry.adjustment < 0)
      return { icon: TrendingDown, color: 'text-red-600' };
    return { icon: Target, color: 'text-blue-600' };
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  return (
    <div className="score-history-display bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <History className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Score History
            </h3>
            <p className="text-sm text-gray-600">
              {filteredHistory.length} entries
            </p>
          </div>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-2">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="timestamp">Sort by Time</option>
            <option value="adjustment">Sort by Change</option>
            <option value="entity">Sort by Name</option>
          </select>
          <button
            onClick={() =>
              setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'))
            }
            className="px-2 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {sortDirection === 'desc' ? '↓' : '↑'}
          </button>
        </div>
      </div>

      {/* Filter Summary */}
      {(filters.entityType !== 'all' ||
        filters.adjustmentType !== 'all' ||
        filters.entityId ||
        filters.questionId) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-800 font-medium">
              Active Filters:
            </span>
            <div className="flex flex-wrap gap-2">
              {filters.entityType !== 'all' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {filters.entityType}s only
                </span>
              )}
              {filters.adjustmentType !== 'all' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {filters.adjustmentType} changes
                </span>
              )}
              {filters.entityId && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Specific entity
                </span>
              )}
              {filters.questionId && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  Specific question
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Entries */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {filteredHistory.map(entry => {
            const { icon: AdjustmentIcon, color: iconColor } =
              getAdjustmentIcon(entry);
            const isExpanded = expandedEntry === entry.id;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`border rounded-lg p-4 transition-all ${
                  entry.isReverted
                    ? 'border-gray-200 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-lg ${
                        entry.isReverted
                          ? 'bg-gray-100'
                          : entry.adjustment > 0
                            ? 'bg-green-100'
                            : entry.adjustment < 0
                              ? 'bg-red-100'
                              : 'bg-blue-100'
                      }`}
                    >
                      <AdjustmentIcon className={`w-4 h-4 ${iconColor}`} />
                    </div>

                    <div className="flex items-center space-x-2">
                      {entry.entityType === 'team' ? (
                        <Users className="w-4 h-4 text-blue-600" />
                      ) : (
                        <User className="w-4 h-4 text-green-600" />
                      )}
                      <span className="font-medium text-gray-900">
                        {entry.entityName}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>
                        {entry.previousScore} → {entry.newScore}
                      </span>
                      <span className={`font-medium ${iconColor}`}>
                        {entry.adjustment > 0 ? '+' : ''}
                        {entry.adjustment}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="text-right text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimestamp(entry.timestamp)}</span>
                      </div>
                      <div className="text-xs">by {entry.performedBy}</div>
                    </div>

                    <button
                      onClick={() =>
                        setExpandedEntry(isExpanded ? null : entry.id)
                      }
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                    </button>

                    {showActions &&
                      onRevert &&
                      entry.type === 'manual' &&
                      !entry.isReverted && (
                        <button
                          onClick={() =>
                            onRevert(entry.relatedAdjustmentId || entry.id)
                          }
                          className="p-1 text-orange-600 hover:text-orange-700 transition-colors"
                          title="Revert this adjustment"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-gray-200"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Type:</span>
                          <span className="ml-2 font-medium capitalize">
                            {entry.type}{' '}
                            {entry.type === 'manual' ? 'Adjustment' : 'Score'}
                          </span>
                        </div>

                        {entry.questionId && (
                          <div>
                            <span className="text-gray-600">Question:</span>
                            <span className="ml-2 font-medium">
                              {entry.questionText || entry.questionId}
                            </span>
                          </div>
                        )}

                        <div className="md:col-span-2">
                          <span className="text-gray-600">Reason:</span>
                          <p className="ml-2 font-medium bg-gray-50 p-2 rounded mt-1">
                            {entry.reason}
                          </p>
                        </div>

                        {entry.isReverted && (
                          <div className="md:col-span-2">
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="w-4 h-4 text-orange-600" />
                                <span className="text-orange-800 text-sm font-medium">
                                  This adjustment has been reverted
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredHistory.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <h4 className="text-lg font-medium mb-2">No History Found</h4>
            <p>No score adjustments match your current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

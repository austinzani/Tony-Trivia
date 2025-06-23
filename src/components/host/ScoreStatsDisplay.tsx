import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  User,
  Edit3,
  RotateCcw,
  Target,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { type ScoreStatsDisplayProps } from '../../types/scoreManagement';

export function ScoreStatsDisplay({
  stats,
  showDetailed = false,
  className = '',
}: ScoreStatsDisplayProps) {
  // Calculate percentages
  const manualAdjustmentRate =
    stats.totalAdjustments > 0
      ? (stats.manualAdjustments / stats.totalAdjustments) * 100
      : 0;

  const revertRate =
    stats.manualAdjustments > 0
      ? (stats.revertedAdjustments / stats.manualAdjustments) * 100
      : 0;

  // Stats cards configuration
  const statCards = [
    {
      label: 'Total Adjustments',
      value: stats.totalAdjustments,
      icon: Edit3,
      color: 'blue',
      description: 'All score changes made',
    },
    {
      label: 'Manual Changes',
      value: stats.manualAdjustments,
      percentage: manualAdjustmentRate,
      icon: User,
      color: 'purple',
      description: 'Host-initiated adjustments',
    },
    {
      label: 'Automatic Scores',
      value: stats.automaticScores,
      icon: Activity,
      color: 'green',
      description: 'System-generated scores',
    },
    {
      label: 'Reverted Changes',
      value: stats.revertedAdjustments,
      percentage: revertRate,
      icon: RotateCcw,
      color: 'orange',
      description: 'Adjustments that were undone',
    },
  ];

  const impactCards = [
    {
      label: 'Teams Affected',
      value: stats.teamsAffected,
      icon: Users,
      color: 'blue',
    },
    {
      label: 'Players Affected',
      value: stats.playersAffected,
      icon: User,
      color: 'green',
    },
    {
      label: 'Questions Modified',
      value: stats.questionsAffected,
      icon: Target,
      color: 'purple',
    },
  ];

  // Get color classes for card types
  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50',
        icon: 'text-blue-600',
        border: 'border-blue-200',
        text: 'text-blue-900',
      },
      purple: {
        bg: 'bg-purple-50',
        icon: 'text-purple-600',
        border: 'border-purple-200',
        text: 'text-purple-900',
      },
      green: {
        bg: 'bg-green-50',
        icon: 'text-green-600',
        border: 'border-green-200',
        text: 'text-green-900',
      },
      orange: {
        bg: 'bg-orange-50',
        icon: 'text-orange-600',
        border: 'border-orange-200',
        text: 'text-orange-900',
      },
      red: {
        bg: 'bg-red-50',
        icon: 'text-red-600',
        border: 'border-red-200',
        text: 'text-red-900',
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className={`score-stats-display ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <BarChart3 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Score Management Statistics
          </h3>
          <p className="text-sm text-gray-600">
            Overview of scoring activity and adjustments
          </p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, index) => {
          const colors = getColorClasses(stat.color);
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${colors.bg} ${colors.border} border rounded-lg p-4`}
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${colors.icon}`} />
                {stat.percentage !== undefined && (
                  <span className={`text-xs ${colors.text} font-medium`}>
                    {stat.percentage.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <p className={`text-2xl font-bold ${colors.text}`}>
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-xs font-medium text-gray-700">
                  {stat.label}
                </p>
                {showDetailed && (
                  <p className="text-xs text-gray-600">{stat.description}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Impact Stats */}
      {showDetailed && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {impactCards.map((stat, index) => {
            const colors = getColorClasses(stat.color);
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (statCards.length + index) * 0.1 }}
                className={`${colors.bg} ${colors.border} border rounded-lg p-4`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-white`}>
                    <stat.icon className={`w-4 h-4 ${colors.icon}`} />
                  </div>
                  <div>
                    <p className={`text-lg font-bold ${colors.text}`}>
                      {stat.value}
                    </p>
                    <p className="text-xs font-medium text-gray-700">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detailed Analysis */}
      {showDetailed && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Adjustment Analysis */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
              Adjustment Analysis
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Average Adjustment
                </span>
                <span
                  className={`text-sm font-medium ${
                    stats.averageAdjustment > 0
                      ? 'text-green-600'
                      : stats.averageAdjustment < 0
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}
                >
                  {stats.averageAdjustment > 0 ? '+' : ''}
                  {stats.averageAdjustment.toFixed(1)} pts
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Largest Increase</span>
                <span className="text-sm font-medium text-green-600">
                  +{stats.largestPositiveAdjustment} pts
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Largest Decrease</span>
                <span className="text-sm font-medium text-red-600">
                  {stats.largestNegativeAdjustment} pts
                </span>
              </div>
            </div>
          </div>

          {/* Quality Metrics */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="w-4 h-4 mr-2 text-purple-600" />
              Quality Metrics
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Revert Rate</span>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-sm font-medium ${
                      revertRate > 20
                        ? 'text-red-600'
                        : revertRate > 10
                          ? 'text-yellow-600'
                          : 'text-green-600'
                    }`}
                  >
                    {revertRate.toFixed(1)}%
                  </span>
                  {revertRate > 20 && (
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Manual vs Auto Ratio
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.manualAdjustments}:{stats.automaticScores}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Coverage</span>
                <span className="text-sm font-medium text-blue-600">
                  {stats.teamsAffected + stats.playersAffected} entities
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts */}
      {showDetailed && revertRate > 15 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6"
        >
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">
                High Revert Rate Detected
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                {revertRate.toFixed(1)}% of manual adjustments have been
                reverted. Consider reviewing scoring criteria or providing
                additional host training.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* No Data State */}
      {stats.totalAdjustments === 0 && (
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <h4 className="text-lg font-medium mb-2">No Score Adjustments Yet</h4>
          <p>Statistics will appear here once score adjustments are made.</p>
        </div>
      )}
    </div>
  );
}

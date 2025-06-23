import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Lock,
  Unlock,
  AlertTriangle,
  Target,
  Timer,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import type { AnswerStatistics } from '../../types/answerManagement';

interface AnswerStatsDashboardProps {
  statistics: AnswerStatistics;
  className?: string;
}

const AnswerStatsDashboard: React.FC<AnswerStatsDashboardProps> = ({
  statistics,
  className = '',
}) => {
  // Calculate percentages
  const approvalRate =
    statistics.total > 0 ? (statistics.approved / statistics.total) * 100 : 0;
  const rejectionRate =
    statistics.total > 0 ? (statistics.rejected / statistics.total) * 100 : 0;
  const pendingRate =
    statistics.total > 0 ? (statistics.pending / statistics.total) * 100 : 0;
  const lockRate =
    statistics.total > 0 ? (statistics.locked / statistics.total) * 100 : 0;

  // Format average review time
  const formatReviewTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  // Get trend indicator
  const getTrendIcon = (value: number, threshold: number = 50) => {
    const TrendIcon =
      value > threshold ? TrendingUp : value < threshold ? TrendingDown : Minus;
    const color =
      value > threshold
        ? 'text-green-600'
        : value < threshold
          ? 'text-red-600'
          : 'text-gray-600';
    return <TrendIcon className={`w-4 h-4 ${color}`} />;
  };

  const statCards = [
    {
      title: 'Total Submissions',
      value: statistics.total,
      icon: Target,
      color: 'bg-blue-50 text-blue-700',
      iconColor: 'text-blue-600',
      trend: null,
    },
    {
      title: 'Pending Review',
      value: statistics.pending,
      percentage: pendingRate,
      icon: Clock,
      color: 'bg-yellow-50 text-yellow-700',
      iconColor: 'text-yellow-600',
      trend: getTrendIcon(pendingRate, 30),
    },
    {
      title: 'Approved',
      value: statistics.approved,
      percentage: approvalRate,
      icon: CheckCircle,
      color: 'bg-green-50 text-green-700',
      iconColor: 'text-green-600',
      trend: getTrendIcon(approvalRate, 70),
    },
    {
      title: 'Rejected',
      value: statistics.rejected,
      percentage: rejectionRate,
      icon: XCircle,
      color: 'bg-red-50 text-red-700',
      iconColor: 'text-red-600',
      trend: getTrendIcon(100 - rejectionRate, 80),
    },
    {
      title: 'Needs Review',
      value: statistics.needsReview,
      icon: AlertTriangle,
      color: 'bg-orange-50 text-orange-700',
      iconColor: 'text-orange-600',
      trend: null,
    },
    {
      title: 'Locked',
      value: statistics.locked,
      percentage: lockRate,
      icon: Lock,
      color: 'bg-gray-50 text-gray-700',
      iconColor: 'text-gray-600',
      trend: null,
    },
  ];

  return (
    <div className={`answer-stats-dashboard ${className}`}>
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${stat.color} rounded-lg p-4 border border-opacity-20`}
            >
              <div className="flex items-start justify-between mb-2">
                <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                {stat.trend && (
                  <div className="flex items-center space-x-1">
                    {stat.trend}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  {stat.value.toLocaleString()}
                </div>
                <div className="text-sm font-medium opacity-80">
                  {stat.title}
                </div>
                {typeof stat.percentage === 'number' && (
                  <div className="text-xs opacity-70">
                    {stat.percentage.toFixed(1)}% of total
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Review Performance */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center space-x-2 mb-3">
            <Timer className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Review Performance</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg. Review Time</span>
              <span className="font-medium text-gray-900">
                {formatReviewTime(statistics.averageReviewTime)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Review Rate</span>
              <span className="font-medium text-gray-900">
                {statistics.total > 0
                  ? `${(((statistics.approved + statistics.rejected) / statistics.total) * 100).toFixed(1)}%`
                  : '0%'}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    statistics.total > 0
                      ? ((statistics.approved + statistics.rejected) /
                          statistics.total) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Quality Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center space-x-2 mb-3">
            <BarChart3 className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Quality Metrics</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Approval Rate</span>
              <span className="font-medium text-green-700">
                {approvalRate.toFixed(1)}%
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Conflicts</span>
              <span className="font-medium text-orange-700">
                {statistics.conflictCount}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Auto-Approved</span>
              <span className="font-medium text-blue-700">
                {statistics.autoApproved}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Security Status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center space-x-2 mb-3">
            <Lock className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Security Status</h3>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Locked</span>
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-orange-600" />
                <span className="font-medium text-gray-900">
                  {statistics.locked}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Unlocked</span>
              <div className="flex items-center space-x-2">
                <Unlock className="w-4 h-4 text-green-600" />
                <span className="font-medium text-gray-900">
                  {statistics.unlocked}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Lock Rate</span>
              <span className="font-medium text-gray-900">
                {lockRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Progress Overview */}
      {statistics.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-4"
        >
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>Review Progress Overview</span>
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Review Progress</span>
              <span>
                {statistics.approved + statistics.rejected} of{' '}
                {statistics.total} reviewed
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="flex h-3 rounded-full overflow-hidden">
                <div
                  className="bg-green-500 transition-all duration-500"
                  style={{ width: `${approvalRate}%` }}
                />
                <div
                  className="bg-red-500 transition-all duration-500"
                  style={{ width: `${rejectionRate}%` }}
                />
                <div
                  className="bg-yellow-400 transition-all duration-500"
                  style={{ width: `${pendingRate}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>Approved ({statistics.approved})</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span>Rejected ({statistics.rejected})</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                  <span>Pending ({statistics.pending})</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export { AnswerStatsDashboard };

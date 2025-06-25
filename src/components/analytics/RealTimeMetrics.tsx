import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Users, Target, Zap, TrendingUp } from 'lucide-react';
import { RealTimeAnalytics } from '../../types/analytics';

interface RealTimeMetricsProps {
  data: RealTimeAnalytics;
}

const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({ data }) => {
  const metrics = [
    {
      label: 'Active Games',
      value: data.activeGames,
      icon: Activity,
      color: 'electric',
      pulse: true
    },
    {
      label: 'Active Players',
      value: data.activePlayers,
      icon: Users,
      color: 'plasma'
    },
    {
      label: 'Questions/Hour',
      value: data.questionsAnsweredLastHour.toLocaleString(),
      icon: Target,
      color: 'success'
    },
    {
      label: 'Avg Response Time',
      value: `${data.averageResponseTimeLast10Min.toFixed(1)}s`,
      icon: Zap,
      color: 'warning'
    },
    {
      label: 'Server Load',
      value: `${data.currentServerLoad}%`,
      icon: TrendingUp,
      color: data.currentServerLoad > 80 ? 'danger' : data.currentServerLoad > 60 ? 'warning' : 'success'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'electric':
        return 'bg-electric-100 text-electric-700 border-electric-200';
      case 'plasma':
        return 'bg-plasma-100 text-plasma-700 border-plasma-200';
      case 'success':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'danger':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-electric-600" />
          Real-Time Metrics
        </h2>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-4 rounded-lg border ${getColorClasses(metric.color)}`}
            >
              {metric.pulse && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                </div>
              )}
              <Icon className="w-5 h-5 mb-2" />
              <div className="text-2xl font-bold">{metric.value}</div>
              <div className="text-xs opacity-75">{metric.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Live Game Status */}
      {data.liveGameStatus.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Active Games</h3>
          <div className="space-y-2">
            {data.liveGameStatus.slice(0, 3).map(game => (
              <motion.div
                key={game.gameId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    game.status === 'active' ? 'bg-green-500' :
                    game.status === 'paused' ? 'bg-yellow-500' :
                    'bg-orange-500'
                  } animate-pulse`}></div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">{game.gameName}</div>
                    <div className="text-xs text-gray-600">Round {game.currentRound}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-electric-600">{game.playerCount} players</div>
                  {game.status === 'ending_soon' && (
                    <div className="text-xs text-orange-600">Ending soon</div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeMetrics;
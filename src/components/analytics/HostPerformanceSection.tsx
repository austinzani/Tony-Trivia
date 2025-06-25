import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Trophy, Users, Star, Calendar, TrendingUp, Award } from 'lucide-react';
import { HostPerformanceMetrics } from '../../types/analytics';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface HostPerformanceSectionProps {
  data: HostPerformanceMetrics[];
  compact?: boolean;
}

const HostPerformanceSection: React.FC<HostPerformanceSectionProps> = ({ data, compact = false }) => {
  const [selectedHost, setSelectedHost] = useState(data[0]?.hostId || '');
  const currentHost = data.find(h => h.hostId === selectedHost) || data[0];

  if (!currentHost) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-center text-gray-600">No host data available</p>
      </div>
    );
  }

  const categoryData = {
    labels: currentHost.popularCategories.map(c => c.category),
    datasets: [{
      data: currentHost.popularCategories.map(c => c.timesSelected),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  const performanceTrend = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Games Hosted',
      data: [8, 12, 10, 15],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    }
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const getRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < fullStars 
                ? 'text-yellow-500 fill-current' 
                : i === fullStars && hasHalfStar
                ? 'text-yellow-500 fill-current opacity-50'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-electric-600" />
            Host Performance
          </h3>
        </div>
        
        <div className="space-y-4">
          {data.slice(0, 3).map(host => (
            <div key={host.hostId} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{host.hostName}</div>
                <div className="text-sm text-gray-600">{host.totalGamesHosted} games</div>
              </div>
              <div className="text-right">
                {getRatingStars(host.averageGameRating)}
                <div className="text-xs text-gray-600">{host.playerSatisfactionScore}% satisfaction</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Host Selector */}
      {data.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Host
          </label>
          <select
            value={selectedHost}
            onChange={(e) => setSelectedHost(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
          >
            {data.map(host => (
              <option key={host.hostId} value={host.hostId}>
                {host.hostName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Host Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <Trophy className="w-8 h-8 text-electric-600 mb-3" />
          <div className="text-2xl font-bold text-gray-900">{currentHost.totalGamesHosted}</div>
          <div className="text-sm text-gray-600">Games Hosted</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <Star className="w-8 h-8 text-yellow-500 mb-3" />
          <div className="text-2xl font-bold text-gray-900">{currentHost.averageGameRating.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Avg Rating</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <Users className="w-8 h-8 text-plasma-600 mb-3" />
          <div className="text-2xl font-bold text-gray-900">{currentHost.averagePlayersPerGame.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Avg Players</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <Award className="w-8 h-8 text-green-600 mb-3" />
          <div className="text-2xl font-bold text-gray-900">{currentHost.playerSatisfactionScore}%</div>
          <div className="text-sm text-gray-600">Satisfaction</div>
        </motion.div>
      </div>

      {/* Performance Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Popular Categories</h4>
          <div className="h-64">
            <Doughnut data={categoryData} options={chartOptions} />
          </div>
        </motion.div>

        {/* Hosting Patterns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-electric-600" />
            Hosting Patterns
          </h4>
          <div className="space-y-4">
            <div>
              <div className="text-sm text-gray-600 mb-2">Preferred Time Slots</div>
              {currentHost.hostingPatterns.preferredTimeSlots.map((slot, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 mb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">{slot.dayOfWeek}</div>
                      <div className="text-sm text-gray-600">{slot.timeRange}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-electric-600">{slot.frequency}</div>
                      <div className="text-xs text-gray-600">games</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Avg Game Length</span>
                <span className="font-semibold">{currentHost.hostingPatterns.averageGameLength} min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Avg Rounds/Game</span>
                <span className="font-semibold">{currentHost.hostingPatterns.averageRoundsPerGame}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Performance Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Activity Trend
          </h4>
          <div className="h-48">
            <Line data={performanceTrend} options={lineOptions} />
          </div>
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              <span className="font-semibold">87.5%</span> increase in hosting activity over the last month
            </p>
          </div>
        </motion.div>
      </div>

      {/* Additional Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-r from-electric-50 to-plasma-50 rounded-lg p-6 border border-electric-200"
      >
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Completion Rate</div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-electric-600">{currentHost.gameCompletionRate}%</div>
              <div className="text-xs text-green-600 font-medium">+5%</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-gradient-to-r from-electric-500 to-plasma-500 h-2 rounded-full"
                style={{ width: `${currentHost.gameCompletionRate}%` }}
              />
            </div>
          </div>
          
          <div className="bg-white/80 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Player Retention</div>
            <div className="text-2xl font-bold text-plasma-600">78%</div>
            <div className="text-xs text-gray-500 mt-1">Players return for more games</div>
          </div>
          
          <div className="bg-white/80 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Engagement Score</div>
            <div className="text-2xl font-bold text-green-600">92/100</div>
            <div className="text-xs text-gray-500 mt-1">Above platform average</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HostPerformanceSection;
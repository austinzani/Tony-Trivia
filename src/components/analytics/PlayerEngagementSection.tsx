import React from 'react';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Award, Target, Calendar, Activity } from 'lucide-react';
import { PlayerEngagementMetrics } from '../../types/analytics';
import { Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface PlayerEngagementSectionProps {
  data: PlayerEngagementMetrics;
  compact?: boolean;
}

const PlayerEngagementSection: React.FC<PlayerEngagementSectionProps> = ({ data, compact = false }) => {
  const retentionData = {
    labels: ['Day 1', 'Day 7', 'Day 30'],
    datasets: [{
      data: [data.playerRetention.day1, data.playerRetention.day7, data.playerRetention.day30],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(168, 85, 247, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  const categoryEngagementData = {
    labels: data.engagementByCategory.map(c => c.category),
    datasets: [{
      label: 'Engagement Rate',
      data: data.engagementByCategory.map(c => c.engagementRate),
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgba(59, 130, 246, 1)',
      pointBackgroundColor: 'rgba(59, 130, 246, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  // Generate heatmap visualization
  const renderHeatmap = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    return (
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="flex gap-1">
            <div className="w-12"></div>
            {hours.map(hour => (
              <div key={hour} className="w-6 text-xs text-gray-500 text-center">
                {hour}
              </div>
            ))}
          </div>
          {days.map((day, dayIndex) => (
            <div key={day} className="flex gap-1 mt-1">
              <div className="w-12 text-xs text-gray-600 flex items-center">{day}</div>
              {hours.map(hour => {
                const dataPoint = data.playerActivityHeatmap.find(
                  d => d.dayOfWeek === dayIndex && d.hour === hour
                );
                const intensity = dataPoint?.intensity || 0;
                const opacity = intensity / 100;
                
                return (
                  <div
                    key={`${day}-${hour}`}
                    className="w-6 h-6 rounded"
                    style={{
                      backgroundColor: `rgba(59, 130, 246, ${opacity})`,
                      border: '1px solid rgba(0, 0, 0, 0.05)'
                    }}
                    title={`${day} ${hour}:00 - ${intensity.toFixed(0)}% activity`}
                  />
                );
              })}
            </div>
          ))}
        </div>
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
            <Users className="w-5 h-5 text-plasma-600" />
            Player Engagement
          </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{data.totalUniquePlayers}</div>
            <div className="text-sm text-gray-600">Unique Players</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{data.returningPlayersRate}%</div>
            <div className="text-sm text-gray-600">Return Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{data.averageGamesPerPlayer}</div>
            <div className="text-sm text-gray-600">Games/Player</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{data.playerRetention.day7}%</div>
            <div className="text-sm text-gray-600">7-Day Retention</div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <Users className="w-8 h-8 text-plasma-600" />
            <span className="text-xs font-medium text-green-600">+15%</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.totalUniquePlayers}</div>
          <div className="text-sm text-gray-600">Unique Players</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="w-8 h-8 text-electric-600" />
            <span className="text-xs font-medium text-green-600">+8%</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.returningPlayersRate}%</div>
          <div className="text-sm text-gray-600">Return Rate</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <Award className="w-8 h-8 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.averageGamesPerPlayer}</div>
          <div className="text-sm text-gray-600">Avg Games/Player</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <Target className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{data.playerRetention.day1}%</div>
          <div className="text-sm text-gray-600">Day 1 Retention</div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Retention Funnel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Player Retention</h4>
          <div className="h-64">
            <Doughnut data={retentionData} options={chartOptions} />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Day 1</span>
              <span className="font-semibold text-green-600">{data.playerRetention.day1}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Day 7</span>
              <span className="font-semibold text-electric-600">{data.playerRetention.day7}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Day 30</span>
              <span className="font-semibold text-plasma-600">{data.playerRetention.day30}%</span>
            </div>
          </div>
        </motion.div>

        {/* Category Engagement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Category Engagement</h4>
          <div className="h-64">
            <Radar data={categoryEngagementData} options={radarOptions} />
          </div>
          <div className="mt-4">
            <div className="text-sm text-gray-600">Top Category:</div>
            <div className="font-semibold text-electric-600">
              {data.engagementByCategory.reduce((prev, current) => 
                prev.engagementRate > current.engagementRate ? prev : current
              ).category}
            </div>
          </div>
        </motion.div>

        {/* Top Performers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h4>
          <div className="space-y-3">
            {data.engagementByCategory.map((category, index) => (
              <div key={category.category} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{category.category}</span>
                  <span className="text-gray-600">{category.engagementRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${category.engagementRate}%` }}
                    transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                    className="bg-gradient-to-r from-electric-500 to-plasma-500 h-2 rounded-full"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  Avg Score: {category.averageScore}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Activity Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-electric-600" />
          Player Activity Heatmap
        </h4>
        <div className="mb-4 text-sm text-gray-600">
          Showing player activity intensity by day and hour (darker = more active)
        </div>
        {renderHeatmap()}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-electric-100 rounded"></div>
            <span className="text-gray-600">Low Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-electric-600 rounded"></div>
            <span className="text-gray-600">High Activity</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PlayerEngagementSection;
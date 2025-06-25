import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Clock, Users, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { GamePerformanceAnalytics } from '../../types/analytics';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface GamePerformanceSectionProps {
  data: GamePerformanceAnalytics;
  compact?: boolean;
}

const GamePerformanceSection: React.FC<GamePerformanceSectionProps> = ({ data, compact = false }) => {
  const stats = [
    {
      label: 'Total Games',
      value: data.totalGames,
      icon: Trophy,
      color: 'electric',
      change: '+12%'
    },
    {
      label: 'Avg Players/Game',
      value: data.averagePlayersPerGame.toFixed(1),
      icon: Users,
      color: 'plasma',
      change: '+5%'
    },
    {
      label: 'Avg Duration',
      value: `${Math.round(data.averageGameDuration)} min`,
      icon: Clock,
      color: 'success'
    },
    {
      label: 'Completion Rate',
      value: `${data.completionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: data.completionRate > 80 ? 'success' : 'warning',
      change: data.completionRate > 80 ? '+3%' : '-2%'
    }
  ];

  const timeOfDayChartData = {
    labels: Array.from({ length: 24 }, (_, i) => {
      const hour = i === 0 ? 12 : i > 12 ? i - 12 : i;
      const period = i < 12 ? 'AM' : 'PM';
      return `${hour}${period}`;
    }),
    datasets: [
      {
        label: 'Games Started',
        data: data.gamesByTimeOfDay.map(d => d.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const dayOfWeekChartData = {
    labels: data.gamesByDayOfWeek.map(d => d.day),
    datasets: [
      {
        label: 'Games Played',
        data: data.gamesByDayOfWeek.map(d => d.count),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(75, 85, 99, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ]
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
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
            <Trophy className="w-5 h-5 text-electric-600" />
            Game Performance
          </h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {stats.slice(0, 4).map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
                {stat.change && (
                  <div className={`text-xs font-medium ${
                    stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  stat.color === 'electric' ? 'bg-electric-100' :
                  stat.color === 'plasma' ? 'bg-plasma-100' :
                  stat.color === 'success' ? 'bg-green-100' :
                  'bg-yellow-100'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    stat.color === 'electric' ? 'text-electric-600' :
                    stat.color === 'plasma' ? 'text-plasma-600' :
                    stat.color === 'success' ? 'text-green-600' :
                    'text-yellow-600'
                  }`} />
                </div>
                {stat.change && (
                  <span className={`text-xs font-medium ${
                    stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Games by Time of Day */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-electric-600" />
            Games by Time of Day
          </h4>
          <div className="h-64">
            <Line data={timeOfDayChartData} options={chartOptions} />
          </div>
          <div className="mt-4 p-3 bg-electric-50 rounded-lg">
            <p className="text-sm text-electric-700">
              Peak activity at <span className="font-semibold">{data.peakPlayersTime.hour}:00</span> with 
              <span className="font-semibold"> {data.peakPlayersTime.playerCount}</span> games
            </p>
          </div>
        </motion.div>

        {/* Games by Day of Week */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-plasma-600" />
            Games by Day of Week
          </h4>
          <div className="h-64">
            <Bar data={dayOfWeekChartData} options={chartOptions} />
          </div>
          <div className="mt-4 p-3 bg-plasma-50 rounded-lg">
            <p className="text-sm text-plasma-700">
              Most popular day: <span className="font-semibold">{data.peakPlayersTime.dayOfWeek}</span>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Additional Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-electric-50 to-plasma-50 rounded-lg p-6 border border-electric-200"
      >
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-electric-600" />
          Key Insights
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/80 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Abandonment Rate</div>
            <div className="text-xl font-bold text-red-600">{data.abandonmentRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-500 mt-1">
              {data.abandonmentRate < 10 ? 'Excellent retention' : 'Needs attention'}
            </div>
          </div>
          <div className="bg-white/80 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Avg Game Length</div>
            <div className="text-xl font-bold text-electric-600">{Math.round(data.averageGameDuration)} min</div>
            <div className="text-xs text-gray-500 mt-1">
              {data.averageGameDuration > 30 ? 'Full engagement' : 'Quick games'}
            </div>
          </div>
          <div className="bg-white/80 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Player Capacity</div>
            <div className="text-xl font-bold text-plasma-600">
              {((data.averagePlayersPerGame / 20) * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Room utilization</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GamePerformanceSection;
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter
} from 'recharts';
import { 
  TrendingUp, 
  BarChart3, 
  Target, 
  Clock, 
  Brain,
  Trophy,
  Calendar,
  Activity
} from 'lucide-react';
import { statisticsService, type PerformanceChart } from '../../services/statisticsService';

interface PerformanceChartsProps {
  userId: string;
  timeFrame?: 'week' | 'month' | 'quarter';
  height?: number;
}

interface ChartData {
  performance: PerformanceChart[];
  categoryBreakdown: Array<{
    category: string;
    value: number;
    games: number;
    color: string;
  }>;
  difficultyStats: Array<{
    difficulty: string;
    accuracy: number;
    averageScore: number;
    responseTime: number;
  }>;
  trendAnalysis: Array<{
    period: string;
    scores: number;
    rank: number;
    games: number;
  }>;
}

const COLORS = {
  electric: '#3b82f6',
  plasma: '#a855f7',
  energyGreen: '#06d6a0',
  energyOrange: '#ff6b35',
  energyYellow: '#ffd23f',
  energyRed: '#ef476f',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444'
};

const CATEGORY_COLORS = [
  COLORS.electric,
  COLORS.plasma, 
  COLORS.energyGreen,
  COLORS.energyOrange,
  COLORS.energyYellow,
  COLORS.energyRed,
  COLORS.success,
  COLORS.warning
];

export function PerformanceCharts({ 
  userId, 
  timeFrame = 'month', 
  height = 300 
}: PerformanceChartsProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState<'performance' | 'categories' | 'difficulty' | 'trends'>('performance');

  useEffect(() => {
    loadChartData();
  }, [userId, timeFrame]);

  const loadChartData = async () => {
    setIsLoading(true);
    try {
      const [performanceData, categoryData, userStats] = await Promise.all([
        statisticsService.getPerformanceChart(userId, timeFrame),
        statisticsService.getCategoryPerformance(userId),
        statisticsService.getUserStatistics(userId)
      ]);

      // Transform category data for pie chart
      const categoryBreakdown = categoryData.map((cat, index) => ({
        category: cat.category,
        value: cat.average_score,
        games: cat.games_played,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
      }));

      // Mock difficulty stats (would come from database)
      const difficultyStats = [
        { difficulty: 'Easy', accuracy: 85, averageScore: 120, responseTime: 12 },
        { difficulty: 'Medium', accuracy: 72, averageScore: 95, responseTime: 18 },
        { difficulty: 'Hard', accuracy: 58, averageScore: 75, responseTime: 25 }
      ];

      // Generate trend analysis (weekly aggregates)
      const trendAnalysis = generateTrendData(performanceData);

      setChartData({
        performance: performanceData,
        categoryBreakdown,
        difficultyStats,
        trendAnalysis
      });
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTrendData = (performance: PerformanceChart[]) => {
    // Group by week and calculate averages
    const weeklyData = performance.reduce((acc, game) => {
      const week = getWeekKey(new Date(game.date));
      if (!acc[week]) {
        acc[week] = { scores: [], ranks: [], count: 0 };
      }
      acc[week].scores.push(game.score);
      acc[week].ranks.push(game.rank);
      acc[week].count++;
      return acc;
    }, {} as Record<string, { scores: number[]; ranks: number[]; count: number }>);

    return Object.entries(weeklyData).map(([week, data]) => ({
      period: week,
      scores: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
      rank: Math.round(data.ranks.reduce((a, b) => a + b, 0) / data.ranks.length),
      games: data.count
    }));
  };

  const getWeekKey = (date: Date) => {
    const year = date.getFullYear();
    const week = Math.ceil(date.getDate() / 7);
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    return `${month} W${week}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 text-center">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No chart data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Type Selector */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-white/20">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'performance', label: 'Performance Trends', icon: TrendingUp },
            { key: 'categories', label: 'Category Breakdown', icon: Target },
            { key: 'difficulty', label: 'Difficulty Analysis', icon: Brain },
            { key: 'trends', label: 'Weekly Trends', icon: Calendar }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSelectedChart(key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                selectedChart === key
                  ? 'bg-electric-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Trends Chart */}
      {selectedChart === 'performance' && (
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20"
        >
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-electric-600" />
            <h3 className="text-xl font-bold text-electric-700">Performance Over Time</h3>
          </div>
          
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData.performance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                stroke="#6b7280"
              />
              <YAxis stroke="#6b7280" />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke={COLORS.electric} 
                strokeWidth={3}
                dot={{ fill: COLORS.electric, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: COLORS.electric }}
              />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke={COLORS.energyGreen} 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: COLORS.energyGreen, strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="flex flex-wrap justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-electric-500 rounded-full"></div>
              <span className="text-gray-600">Score</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-energy-green rounded-full"></div>
              <span className="text-gray-600">Accuracy %</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Category Breakdown Chart */}
      {selectedChart === 'categories' && (
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20"
        >
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-electric-600" />
            <h3 className="text-xl font-bold text-electric-700">Performance by Category</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div>
              <ResponsiveContainer width="100%" height={height}>
                <PieChart>
                  <Pie
                    data={chartData.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ category, value }) => `${category}: ${Math.round(value)}`}
                  >
                    {chartData.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div>
              <ResponsiveContainer width="100%" height={height}>
                <BarChart data={chartData.categoryBreakdown} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" stroke="#6b7280" />
                  <YAxis dataKey="category" type="category" stroke="#6b7280" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill={COLORS.plasma} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* Difficulty Analysis Chart */}
      {selectedChart === 'difficulty' && (
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20"
        >
          <div className="flex items-center gap-2 mb-6">
            <Brain className="w-5 h-5 text-electric-600" />
            <h3 className="text-xl font-bold text-electric-700">Performance by Difficulty</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div>
              <ResponsiveContainer width="100%" height={height}>
                <RadarChart data={chartData.difficultyStats}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="difficulty" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name="Accuracy"
                    dataKey="accuracy"
                    stroke={COLORS.electric}
                    fill={COLORS.electric}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Multi-metric Bar Chart */}
            <div>
              <ResponsiveContainer width="100%" height={height}>
                <BarChart data={chartData.difficultyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="difficulty" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="accuracy" fill={COLORS.energyGreen} name="Accuracy %" />
                  <Bar dataKey="averageScore" fill={COLORS.electric} name="Avg Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Difficulty Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {chartData.difficultyStats.map((stat, index) => (
              <div key={stat.difficulty} className="bg-gray-50 rounded-lg p-4 text-center">
                <h4 className="font-semibold text-gray-900 mb-2">{stat.difficulty}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Accuracy:</span>
                    <span className="font-medium">{stat.accuracy}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Score:</span>
                    <span className="font-medium">{stat.averageScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response:</span>
                    <span className="font-medium">{stat.responseTime}s</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Weekly Trends Chart */}
      {selectedChart === 'trends' && (
        <motion.div
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20"
        >
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="w-5 h-5 text-electric-600" />
            <h3 className="text-xl font-bold text-electric-700">Weekly Trends Analysis</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Area Chart for Scores */}
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-3">Score Progression</h4>
              <ResponsiveContainer width="100%" height={height - 50}>
                <AreaChart data={chartData.trendAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="scores"
                    stroke={COLORS.electric}
                    fill={COLORS.electric}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Scatter Plot for Rank vs Games */}
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-3">Rank Consistency</h4>
              <ResponsiveContainer width="100%" height={height - 50}>
                <ScatterChart data={chartData.trendAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="games" name="Games Played" stroke="#6b7280" />
                  <YAxis dataKey="rank" name="Average Rank" stroke="#6b7280" reversed />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-3 shadow-lg">
                            <p className="font-medium text-gray-900">{data.period}</p>
                            <p className="text-sm text-electric-600">Games: {data.games}</p>
                            <p className="text-sm text-plasma-600">Avg Rank: {data.rank}</p>
                            <p className="text-sm text-energy-green">Avg Score: {data.scores}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter 
                    dataKey="rank" 
                    fill={COLORS.plasma}
                    r={6}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trend Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-electric-50 rounded-lg p-4 text-center">
              <Activity className="w-8 h-8 text-electric-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Total Weeks</p>
              <p className="text-xl font-bold text-electric-700">{chartData.trendAnalysis.length}</p>
            </div>
            <div className="bg-energy-green/10 rounded-lg p-4 text-center">
              <Trophy className="w-8 h-8 text-energy-green mx-auto mb-2" />
              <p className="text-sm text-gray-600">Best Week</p>
              <p className="text-xl font-bold text-energy-green">
                {Math.max(...chartData.trendAnalysis.map(t => t.scores))}
              </p>
            </div>
            <div className="bg-plasma-50 rounded-lg p-4 text-center">
              <Target className="w-8 h-8 text-plasma-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Best Rank</p>
              <p className="text-xl font-bold text-plasma-700">
                #{Math.min(...chartData.trendAnalysis.map(t => t.rank))}
              </p>
            </div>
            <div className="bg-energy-orange/10 rounded-lg p-4 text-center">
              <Clock className="w-8 h-8 text-energy-orange mx-auto mb-2" />
              <p className="text-sm text-gray-600">Total Games</p>
              <p className="text-xl font-bold text-energy-orange">
                {chartData.trendAnalysis.reduce((sum, t) => sum + t.games, 0)}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default PerformanceCharts;
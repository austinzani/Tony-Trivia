import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  Trophy, 
  Calendar, 
  TrendingUp,
  User,
  Users,
  Filter,
  Download,
  Share2,
  Settings,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { statisticsService, type UserStatistics } from '../services/statisticsService';
import StatisticsDashboard from '../components/statistics/StatisticsDashboard';
import PerformanceCharts from '../components/statistics/PerformanceCharts';
import GameHistoryTable from '../components/statistics/GameHistoryTable';
import AchievementsBadges from '../components/statistics/AchievementsBadges';

interface StatisticsPageProps {
  userId?: string;
  embedded?: boolean;
}

type TabKey = 'dashboard' | 'charts' | 'history' | 'achievements' | 'compare';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
  description: string;
  component: React.ReactNode;
}

export default function Statistics({ userId: propUserId, embedded = false }: StatisticsPageProps) {
  const { user } = useAuth();
  const userId = propUserId || user?.id;
  
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [userStats, setUserStats] = useState<UserStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [showExportOptions, setShowExportOptions] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserStatistics();
    }
  }, [userId]);

  const loadUserStatistics = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const stats = await statisticsService.getUserStatistics(userId);
      setUserStats(stats);
    } catch (error) {
      console.error('Failed to load user statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: TabConfig[] = [
    {
      key: 'dashboard',
      label: 'Overview',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Comprehensive performance overview and key metrics',
      component: userId ? (
        <StatisticsDashboard 
          userId={userId} 
          timeFrame={timeFrame}
          showExportOptions={showExportOptions}
        />
      ) : null
    },
    {
      key: 'charts',
      label: 'Analytics',
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Detailed charts and performance trends over time',
      component: userId ? (
        <PerformanceCharts 
          userId={userId} 
          timeFrame={timeFrame}
        />
      ) : null
    },
    {
      key: 'history',
      label: 'Game History',
      icon: <Calendar className="w-5 h-5" />,
      description: 'Complete record of all your trivia game sessions',
      component: userId ? (
        <GameHistoryTable 
          userId={userId}
          showFilters={true}
          showExport={showExportOptions}
        />
      ) : null
    },
    {
      key: 'achievements',
      label: 'Achievements',
      icon: <Trophy className="w-5 h-5" />,
      description: 'Badges, milestones, and XP progression tracking',
      component: userId ? (
        <AchievementsBadges 
          userId={userId}
          userStats={userStats}
          showLocked={true}
        />
      ) : null
    }
  ];

  const handleExportData = () => {
    // Implementation for exporting statistics data
    console.log('Exporting statistics data...');
  };

  const handleShareStats = () => {
    // Implementation for sharing statistics
    console.log('Sharing statistics...');
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-electric-50 via-white to-plasma-50 flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center border border-white/20">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-6">
            Please sign in to view your trivia statistics and performance data.
          </p>
          <button className="btn-game-primary">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-electric-50 via-white to-plasma-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            {/* Header Skeleton */}
            <div className="bg-white/80 rounded-2xl p-6 shadow-lg">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
            
            {/* Tab Navigation Skeleton */}
            <div className="bg-white/80 rounded-xl p-4 shadow-lg">
              <div className="flex gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 rounded-lg w-24"></div>
                ))}
              </div>
            </div>
            
            {/* Content Skeleton */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
              <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentTab = tabs.find(tab => tab.key === activeTab);

  return (
    <div className={`${embedded ? '' : 'min-h-screen bg-gradient-to-br from-electric-50 via-white to-plasma-50'} ${embedded ? '' : 'p-4'}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        {!embedded && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent mb-2">
                  📊 Statistics Center
                </h1>
                <p className="text-gray-600 text-lg">
                  Track your trivia performance, analyze trends, and celebrate achievements
                </p>
                
                {userStats && (
                  <div className="flex items-center gap-6 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-electric-500 rounded-full"></div>
                      <span className="text-gray-600">Level {userStats.current_level}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-energy-yellow rounded-full"></div>
                      <span className="text-gray-600">{userStats.current_league} League</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-energy-green rounded-full"></div>
                      <span className="text-gray-600">{userStats.total_games_played} Games Played</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Time Frame Selector */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Time Frame:</label>
                  <select
                    value={timeFrame}
                    onChange={(e) => setTimeFrame(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-transparent bg-white text-sm"
                  >
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="quarter">Last Quarter</option>
                    <option value="year">Last Year</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowExportOptions(!showExportOptions)}
                    className={`p-2 rounded-lg transition-colors ${
                      showExportOptions 
                        ? 'bg-electric-500 text-white' 
                        : 'text-gray-600 hover:text-electric-600 hover:bg-electric-50'
                    }`}
                    title="Export Options"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={handleExportData}
                    className="p-2 text-gray-600 hover:text-electric-600 hover:bg-electric-50 rounded-lg transition-colors"
                    title="Export Data"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={handleShareStats}
                    className="p-2 text-gray-600 hover:text-electric-600 hover:bg-electric-50 rounded-lg transition-colors"
                    title="Share Statistics"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-white/20"
        >
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? 'bg-electric-500 text-white shadow-md transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-electric-600'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {activeTab === tab.key && (
                  <ChevronRight className="w-4 h-4 ml-1" />
                )}
              </button>
            ))}
          </div>
          
          {/* Current Tab Description */}
          {currentTab && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 pt-4 border-t border-gray-200"
            >
              <p className="text-gray-600 text-sm">{currentTab.description}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {currentTab && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentTab.component}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Stats Footer */}
        {!embedded && userStats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20"
          >
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Stats Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div className="bg-electric-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-electric-600">{userStats.total_wins}</div>
                  <div className="text-sm text-gray-600">Total Wins</div>
                </div>
                <div className="bg-energy-green/10 rounded-lg p-3">
                  <div className="text-2xl font-bold text-energy-green">{Math.round(userStats.overall_accuracy || 0)}%</div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </div>
                <div className="bg-plasma-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-plasma-600">{userStats.current_win_streak}</div>
                  <div className="text-sm text-gray-600">Win Streak</div>
                </div>
                <div className="bg-energy-yellow/20 rounded-lg p-3">
                  <div className="text-2xl font-bold text-orange-600">{userStats.total_xp}</div>
                  <div className="text-sm text-gray-600">Total XP</div>
                </div>
                <div className="bg-energy-orange/10 rounded-lg p-3">
                  <div className="text-2xl font-bold text-energy-orange">#{userStats.global_rank || '?'}</div>
                  <div className="text-sm text-gray-600">Global Rank</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
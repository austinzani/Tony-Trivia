import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  Clock,
  Zap,
  Brain,
  Award,
  Calendar,
  Star,
  BarChart3,
  Activity,
  Users,
  Medal,
  Crown,
  Filter,
  Download,
  RefreshCw,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { statisticsService, type UserStatistics, type GameHistoryEntry, type CategoryPerformance } from '../../services/statisticsService';
import { useAuth } from '../../contexts/AuthContext';

interface StatisticsDashboardProps {
  userId?: string;
  timeFrame?: 'week' | 'month' | 'quarter' | 'year';
  showExportOptions?: boolean;
  showComparison?: boolean;
}

interface StatCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color: string;
  description?: string;
}

interface PerformanceMetric {
  label: string;
  value: number;
  maxValue: number;
  color: 'electric' | 'plasma' | 'energy-green' | 'energy-orange' | 'energy-yellow';
  icon: string;
  trend?: number;
}

export function StatisticsDashboard({
  userId: propUserId,
  timeFrame = 'month',
  showExportOptions = false,
  showComparison = false
}: StatisticsDashboardProps) {
  const { user } = useAuth();
  const userId = propUserId || user?.id;
  
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState(timeFrame);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'categories' | 'achievements'>('overview');
  const [showDetailedView, setShowDetailedView] = useState(false);

  useEffect(() => {
    if (userId) {
      loadStatistics();
    }
  }, [userId, selectedTimeFrame]);

  const loadStatistics = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const [statsData, historyData, categoryData] = await Promise.all([
        statisticsService.getUserStatistics(userId),
        statisticsService.getUserGameHistory(userId, 10, 0, { timeFrame: selectedTimeFrame }),
        statisticsService.getCategoryPerformance(userId)
      ]);

      setStatistics(statsData);
      setGameHistory(historyData.data);
      setCategoryPerformance(categoryData);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatCards = (stats: UserStatistics): StatCard[] => [
    {
      title: 'Games Played',
      value: stats.total_games_played,
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-gradient-to-r from-electric-400 to-electric-600',
      subtitle: `${stats.total_wins} wins`,
      description: 'Total trivia games completed'
    },
    {
      title: 'Win Rate',
      value: `${Math.round((stats.total_wins / Math.max(stats.total_games_played, 1)) * 100)}%`,
      icon: <Trophy className="w-5 h-5" />,
      trend: getTrendDirection(stats.performance_trend),
      trendValue: '+5%',
      color: 'bg-gradient-to-r from-energy-yellow to-yellow-500',
      description: 'Percentage of games won'
    },
    {
      title: 'Average Score',
      value: Math.round(stats.average_score).toLocaleString(),
      icon: <Target className="w-5 h-5" />,
      trend: 'up',
      trendValue: '+85',
      color: 'bg-gradient-to-r from-energy-green to-green-500',
      subtitle: `Best: ${stats.highest_score}`,
      description: 'Average points per game'
    },
    {
      title: 'Accuracy',
      value: `${Math.round(stats.overall_accuracy || 0)}%`,
      icon: <Brain className="w-5 h-5" />,
      trend: 'up',
      trendValue: '+3%',
      color: 'bg-gradient-to-r from-plasma-400 to-plasma-600',
      description: 'Correct answer percentage'
    },
    {
      title: 'Response Time',
      value: `${stats.average_response_time?.toFixed(1) || 0}s`,
      icon: <Zap className="w-5 h-5" />,
      trend: 'down',
      trendValue: '-1.2s',
      color: 'bg-gradient-to-r from-energy-orange to-orange-500',
      subtitle: 'Average',
      description: 'Average time to answer'
    },
    {
      title: 'Current Streak',
      value: stats.current_win_streak,
      icon: <Award className="w-5 h-5" />,
      color: 'bg-gradient-to-r from-pink-400 to-pink-600',
      subtitle: `Best: ${stats.longest_win_streak}`,
      description: 'Current winning streak'
    }
  ];

  const getPerformanceMetrics = (stats: UserStatistics): PerformanceMetric[] => [
    {
      label: 'Level Progress',
      value: stats.total_xp % 1000, // Simplified XP calculation
      maxValue: 1000,
      color: 'electric',
      icon: '⚡',
      trend: 15
    },
    {
      label: 'Weekly Goals',
      value: stats.games_this_week,
      maxValue: 7,
      color: 'plasma',
      icon: '📅',
    },
    {
      label: 'Monthly Goals',
      value: stats.games_this_month,
      maxValue: 20,
      color: 'energy-green',
      icon: '📆',
    },
    {
      label: 'League Progress',
      value: getLeagueProgress(stats.current_league),
      maxValue: 100,
      color: 'energy-yellow',
      icon: '👑',
    }
  ];

  const getTrendDirection = (trend: string): 'up' | 'down' | 'stable' => {
    switch (trend) {
      case 'improving': return 'up';
      case 'declining': return 'down';
      default: return 'stable';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-energy-green" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-energy-red" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLeagueProgress = (league: string): number => {
    const leagues = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master'];
    const index = leagues.indexOf(league);
    return ((index + 1) / leagues.length) * 100;
  };

  const getLeagueIcon = (league: string) => {
    const icons = {
      Bronze: '🥉',
      Silver: '🥈',
      Gold: '🥇',
      Platinum: '💎',
      Diamond: '💎',
      Master: '👑'
    };
    return icons[league as keyof typeof icons] || '🥉';
  };

  const getRankBadgeColor = (rank: number | null, totalTeams: number | null) => {
    if (!rank || !totalTeams) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (rank <= 3) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (rank <= totalTeams / 2) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded-lg w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600 mb-2">No Statistics Available</h3>
          <p className="text-gray-500 mb-6">
            Play some games to see your performance statistics!
          </p>
          <button
            onClick={loadStatistics}
            className="btn-game-primary inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent mb-2">
              📊 Performance Dashboard
            </h1>
            <p className="text-gray-600">
              Track your trivia journey and celebrate your achievements
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Tab Navigation */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {['overview', 'history', 'categories', 'achievements'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-white text-electric-700 shadow-sm'
                      : 'text-gray-600 hover:text-electric-600'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Time Frame Selector */}
            <select
              value={selectedTimeFrame}
              onChange={(e) => setSelectedTimeFrame(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-transparent bg-white"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>

            {showExportOptions && (
              <div className="flex items-center gap-2">
                <button
                  className="p-2 text-gray-600 hover:text-electric-600 hover:bg-electric-50 rounded-lg transition-colors"
                  title="Export Statistics"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={loadStatistics}
                  className="p-2 text-gray-600 hover:text-electric-600 hover:bg-electric-50 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Level and League Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Current Level */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-electric-500 to-plasma-600 rounded-2xl p-6 text-white shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold opacity-90">Current Level</h3>
                    <div className="text-3xl font-bold">{statistics.current_level}</div>
                  </div>
                  <div className="text-4xl">⚡</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm opacity-90">
                    <span>XP Progress</span>
                    <span>{statistics.total_xp} XP</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <motion.div
                      className="bg-white rounded-full h-2"
                      initial={{ width: 0 }}
                      animate={{ width: `${(statistics.total_xp % 1000) / 10}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* League Status */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-energy-yellow to-orange-400 rounded-2xl p-6 text-gray-900 shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold opacity-90">League</h3>
                    <div className="text-2xl font-bold">{statistics.current_league}</div>
                  </div>
                  <div className="text-4xl">{getLeagueIcon(statistics.current_league)}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm opacity-90">
                    <span>Rank</span>
                    <span>#{statistics.league_rank || 'Unranked'}</span>
                  </div>
                  {statistics.global_rank && (
                    <div className="flex justify-between text-sm opacity-90">
                      <span>Global</span>
                      <span>#{statistics.global_rank}</span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Achievements Summary */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-plasma-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold opacity-90">Achievements</h3>
                    <div className="text-3xl font-bold">{statistics.total_wins}</div>
                  </div>
                  <div className="text-4xl">🏆</div>
                </div>
                <div className="space-y-1 text-sm opacity-90">
                  <div>🥇 {statistics.total_wins} Wins</div>
                  <div>🥉 {statistics.total_podium_finishes} Podiums</div>
                  <div>⚡ {statistics.teams_captained} Teams Led</div>
                </div>
              </motion.div>
            </div>

            {/* Key Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getStatCards(statistics).map((card, index) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${card.color} text-white shadow-lg`}>
                      {card.icon}
                    </div>
                    {card.trend && (
                      <div className="flex items-center gap-1">
                        {getTrendIcon(card.trend)}
                        <span
                          className={`text-sm font-medium ${
                            card.trend === 'up'
                              ? 'text-energy-green'
                              : card.trend === 'down'
                                ? 'text-energy-red'
                                : 'text-gray-600'
                          }`}
                        >
                          {card.trendValue}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
                    {card.subtitle && (
                      <p className="text-sm text-gray-500">{card.subtitle}</p>
                    )}
                    {card.description && (
                      <p className="text-xs text-gray-400 mt-2">{card.description}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Performance Progress Bars */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20"
            >
              <h3 className="text-xl font-bold text-electric-700 mb-6 flex items-center gap-2">
                📈 Progress Tracking
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getPerformanceMetrics(statistics).map((metric, index) => (
                  <div key={metric.label} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <span>{metric.icon}</span>
                        {metric.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-600">
                          {metric.value}/{metric.maxValue}
                        </span>
                        {metric.trend && (
                          <span className="text-xs text-energy-green font-medium">
                            +{metric.trend}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          metric.color === 'electric' ? 'bg-gradient-to-r from-electric-400 to-electric-600' :
                          metric.color === 'plasma' ? 'bg-gradient-to-r from-plasma-400 to-plasma-600' :
                          metric.color === 'energy-green' ? 'bg-gradient-to-r from-energy-green to-green-500' :
                          metric.color === 'energy-yellow' ? 'bg-gradient-to-r from-energy-yellow to-yellow-500' :
                          'bg-gradient-to-r from-energy-orange to-orange-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(metric.value / metric.maxValue) * 100}%` }}
                        transition={{ duration: 1, delay: index * 0.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Recent Game History */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-electric-700 flex items-center gap-2">
                  🎮 Recent Games
                </h3>
                <button
                  onClick={() => setShowDetailedView(!showDetailedView)}
                  className="text-electric-600 hover:text-electric-700 font-medium flex items-center gap-1"
                >
                  {showDetailedView ? 'Show Less' : 'Show More'}
                  {showDetailedView ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>

              <div className="space-y-4">
                {gameHistory.length > 0 ? (
                  gameHistory.slice(0, showDetailedView ? gameHistory.length : 5).map((game, index) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium border ${getRankBadgeColor(game.final_rank, game.total_teams)}`}
                        >
                          #{game.final_rank || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{game.game_name}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{new Date(game.game_started_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{game.correct_answers}/{game.questions_answered} correct</span>
                            <span>•</span>
                            <span>{Math.round(game.accuracy_percentage || 0)}% accuracy</span>
                            {game.team_name && (
                              <>
                                <span>•</span>
                                <span className="text-electric-600">{game.team_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-lg">
                          {game.final_score.toLocaleString()}
                        </p>
                        {game.average_response_time && (
                          <p className="text-sm text-gray-600">
                            {game.average_response_time.toFixed(1)}s avg
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No games in your history yet</p>
                    <p className="text-gray-500">Play some trivia to see your performance!</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'categories' && (
          <motion.div
            key="categories"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Category Performance */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-electric-700 mb-6 flex items-center gap-2">
                📚 Category Performance
              </h3>
              
              {categoryPerformance.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryPerformance.map((category, index) => (
                    <motion.div
                      key={category.category}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">{category.category}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Games</span>
                          <span className="font-medium">{category.games_played}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Avg Score</span>
                          <span className="font-medium">{Math.round(category.average_score)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Win Rate</span>
                          <span className="font-medium">{Math.round(category.win_rate * 100)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Accuracy</span>
                          <span className="font-medium">{Math.round(category.accuracy)}%</span>
                        </div>
                      </div>
                      
                      {/* Visual indicator for strength */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-full rounded-full ${
                              category.accuracy >= 80 ? 'bg-energy-green' :
                              category.accuracy >= 60 ? 'bg-energy-yellow' :
                              'bg-energy-orange'
                            }`}
                            style={{ width: `${category.accuracy}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No category data yet</p>
                  <p className="text-gray-500">Play games across different categories to see your strengths!</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'achievements' && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Achievements and Milestones */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-electric-700 mb-6 flex items-center gap-2">
                🏆 Achievements & Milestones
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Placeholder achievement badges */}
                {[
                  { name: 'First Win', icon: '🏆', unlocked: statistics.total_wins > 0 },
                  { name: 'Speed Demon', icon: '⚡', unlocked: (statistics.fastest_ever_response || 0) < 5 },
                  { name: 'Knowledge Master', icon: '🧠', unlocked: statistics.total_games_played >= 50 },
                  { name: 'Team Captain', icon: '👑', unlocked: statistics.teams_captained > 0 },
                  { name: 'Streak Master', icon: '🔥', unlocked: statistics.longest_win_streak >= 5 },
                  { name: 'Perfect Round', icon: '💯', unlocked: (statistics.overall_accuracy || 0) === 100 },
                  { name: 'Trivia Veteran', icon: '🎖️', unlocked: statistics.total_games_played >= 100 },
                  { name: 'League Champion', icon: '👑', unlocked: statistics.current_league === 'Master' }
                ].map((achievement, index) => (
                  <motion.div
                    key={achievement.name}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`text-center p-4 rounded-xl border-2 transition-all ${
                      achievement.unlocked
                        ? 'bg-gradient-to-br from-energy-yellow/20 to-orange-100 border-energy-yellow'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className={`text-4xl mb-2 ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                      {achievement.icon}
                    </div>
                    <p className={`text-sm font-medium ${
                      achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {achievement.name}
                    </p>
                    {achievement.unlocked && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-energy-green rounded-full flex items-center justify-center text-white text-xs"
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StatisticsDashboard;
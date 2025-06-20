import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Trophy,
  Target,
  Clock,
  Users,
  Star,
  Calendar,
  Award,
  Zap,
  Brain,
  Activity,
  Filter,
  Download,
  Share2,
  RefreshCw,
} from 'lucide-react';

interface GameResult {
  id: string;
  game_room_name: string;
  date: string;
  final_score: number;
  final_rank: number;
  total_teams: number;
  rounds_played: number;
  correct_answers: number;
  total_questions: number;
  average_response_time: number;
  points_earned: number;
}

interface TeamStats {
  total_games: number;
  wins: number;
  podium_finishes: number; // Top 3
  average_score: number;
  average_rank: number;
  total_points: number;
  accuracy_rate: number;
  average_response_time: number;
  favorite_categories: string[];
  best_performance: GameResult;
  recent_trend: 'improving' | 'declining' | 'stable';
  streak_wins: number;
  streak_podiums: number;
}

interface TeamStatisticsProps {
  teamId: string;
  teamName: string;
  timeFrame?: 'week' | 'month' | 'quarter' | 'all';
  showExportOptions?: boolean;
}

type StatCard = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color: string;
};

export function TeamStatistics({
  teamId,
  teamName,
  timeFrame = 'month',
  showExportOptions = true,
}: TeamStatisticsProps) {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [gameHistory, setGameHistory] = useState<GameResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState(timeFrame);
  const [showDetailedHistory, setShowDetailedHistory] = useState(false);

  // Mock data for demo - in real app this would come from API
  const mockStats: TeamStats = {
    total_games: 15,
    wins: 4,
    podium_finishes: 8,
    average_score: 847,
    average_rank: 2.3,
    total_points: 12705,
    accuracy_rate: 0.73,
    average_response_time: 18.5,
    favorite_categories: ['Science', 'History', 'Sports'],
    best_performance: {
      id: 'game-1',
      game_room_name: 'Friday Night Trivia',
      date: '2024-01-15',
      final_score: 1250,
      final_rank: 1,
      total_teams: 8,
      rounds_played: 5,
      correct_answers: 18,
      total_questions: 25,
      average_response_time: 12.3,
      points_earned: 1250,
    },
    recent_trend: 'improving',
    streak_wins: 2,
    streak_podiums: 5,
  };

  const mockGameHistory: GameResult[] = [
    {
      id: 'game-1',
      game_room_name: 'Friday Night Trivia',
      date: '2024-01-15',
      final_score: 1250,
      final_rank: 1,
      total_teams: 8,
      rounds_played: 5,
      correct_answers: 18,
      total_questions: 25,
      average_response_time: 12.3,
      points_earned: 1250,
    },
    {
      id: 'game-2',
      game_room_name: 'Weekend Warriors',
      date: '2024-01-12',
      final_score: 980,
      final_rank: 2,
      total_teams: 6,
      rounds_played: 4,
      correct_answers: 15,
      total_questions: 20,
      average_response_time: 15.8,
      points_earned: 980,
    },
    {
      id: 'game-3',
      game_room_name: 'Midweek Madness',
      date: '2024-01-10',
      final_score: 750,
      final_rank: 3,
      total_teams: 10,
      rounds_played: 4,
      correct_answers: 12,
      total_questions: 20,
      average_response_time: 22.1,
      points_earned: 750,
    },
  ];

  useEffect(() => {
    loadTeamStatistics();
  }, [teamId, selectedTimeFrame]);

  const loadTeamStatistics = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStats(mockStats);
      setGameHistory(mockGameHistory);
    } catch (error) {
      console.error('Failed to load team statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatCards = (stats: TeamStats): StatCard[] => [
    {
      title: 'Total Games',
      value: stats.total_games,
      icon: <Calendar className="w-5 h-5" />,
      color: 'bg-blue-500',
      subtitle: `${stats.wins} wins`,
    },
    {
      title: 'Win Rate',
      value: `${Math.round((stats.wins / stats.total_games) * 100)}%`,
      icon: <Trophy className="w-5 h-5" />,
      trend:
        stats.recent_trend === 'improving'
          ? 'up'
          : stats.recent_trend === 'declining'
            ? 'down'
            : 'stable',
      trendValue: '+12%',
      color: 'bg-yellow-500',
    },
    {
      title: 'Average Score',
      value: Math.round(stats.average_score).toLocaleString(),
      icon: <Target className="w-5 h-5" />,
      trend: 'up',
      trendValue: '+85',
      color: 'bg-green-500',
      subtitle: `Rank ${stats.average_rank}`,
    },
    {
      title: 'Accuracy',
      value: `${Math.round(stats.accuracy_rate * 100)}%`,
      icon: <Brain className="w-5 h-5" />,
      trend: 'up',
      trendValue: '+5%',
      color: 'bg-purple-500',
    },
    {
      title: 'Response Time',
      value: `${stats.average_response_time}s`,
      icon: <Zap className="w-5 h-5" />,
      trend: 'down',
      trendValue: '-2.3s',
      color: 'bg-orange-500',
      subtitle: 'Average',
    },
    {
      title: 'Podium Streak',
      value: stats.streak_podiums,
      icon: <Award className="w-5 h-5" />,
      color: 'bg-pink-500',
      subtitle: 'Top 3 finishes',
    },
  ];

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRankBadgeColor = (rank: number, totalTeams: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (rank <= 3) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (rank <= totalTeams / 2)
      return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const handleExportStats = () => {
    // Implementation for exporting statistics
    console.log('Exporting team statistics...');
  };

  const handleShareStats = () => {
    // Implementation for sharing statistics
    console.log('Sharing team statistics...');
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            No Statistics Available
          </h3>
          <p className="text-gray-500">
            Play some games to see your team's performance stats!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Team Statistics
            </h2>
            <p className="text-gray-600">
              Performance insights for{' '}
              <span className="font-semibold text-blue-600">{teamName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Frame Selector */}
            <select
              value={selectedTimeFrame}
              onChange={e => setSelectedTimeFrame(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="all">All Time</option>
            </select>

            {showExportOptions && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportStats}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Export Statistics"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={handleShareStats}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Share Statistics"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={loadTeamStatistics}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getStatCards(stats).map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.color} text-white`}>
                {card.icon}
              </div>
              {card.trend && (
                <div className="flex items-center gap-1">
                  {getTrendIcon(card.trend)}
                  <span
                    className={`text-sm font-medium ${
                      card.trend === 'up'
                        ? 'text-green-600'
                        : card.trend === 'down'
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {card.trendValue}
                  </span>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {card.value}
              </p>
              {card.subtitle && (
                <p className="text-sm text-gray-500">{card.subtitle}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Best Performance Highlight */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-lg p-6 border border-yellow-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-500 text-white rounded-lg">
            <Star className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Best Performance</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Game</p>
            <p className="font-semibold text-gray-900">
              {stats.best_performance.game_room_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Score</p>
            <p className="font-semibold text-gray-900">
              {stats.best_performance.final_score.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Rank</p>
            <p className="font-semibold text-gray-900">
              #{stats.best_performance.final_rank} of{' '}
              {stats.best_performance.total_teams}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Date</p>
            <p className="font-semibold text-gray-900">
              {new Date(stats.best_performance.date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Game History */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Recent Games</h3>
          <button
            onClick={() => setShowDetailedHistory(!showDetailedHistory)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {showDetailedHistory ? 'Show Less' : 'Show More'}
          </button>
        </div>

        <div className="space-y-4">
          {gameHistory
            .slice(0, showDetailedHistory ? gameHistory.length : 3)
            .map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getRankBadgeColor(game.final_rank, game.total_teams)}`}
                  >
                    #{game.final_rank}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {game.game_room_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(game.date).toLocaleDateString()} •{' '}
                      {game.correct_answers}/{game.total_questions} correct
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {game.final_score.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {game.average_response_time.toFixed(1)}s avg
                  </p>
                </div>
              </motion.div>
            ))}
        </div>

        {gameHistory.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No games played yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

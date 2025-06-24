import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Trophy,
  Target,
  Clock,
  Users,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Eye,
  Download,
  Star,
  Award,
  Zap
} from 'lucide-react';
import { statisticsService, type GameHistoryEntry } from '../../services/statisticsService';

interface GameHistoryTableProps {
  userId: string;
  limit?: number;
  showFilters?: boolean;
  showExport?: boolean;
  compact?: boolean;
}

interface FilterOptions {
  timeFrame: 'week' | 'month' | 'quarter' | 'year' | 'all';
  category: string;
  minScore: number | null;
  sortBy: 'date' | 'score' | 'rank' | 'accuracy';
  sortOrder: 'asc' | 'desc';
  searchTerm: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export function GameHistoryTable({
  userId,
  limit = 20,
  showFilters = true,
  showExport = true,
  compact = false
}: GameHistoryTableProps) {
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<GameHistoryEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: limit
  });

  const [filters, setFilters] = useState<FilterOptions>({
    timeFrame: 'month',
    category: '',
    minScore: null,
    sortBy: 'date',
    sortOrder: 'desc',
    searchTerm: ''
  });

  const [showFilterPanel, setShowFilterPanel] = useState(false);

  useEffect(() => {
    loadGameHistory();
  }, [userId, filters.timeFrame, filters.category, filters.minScore, filters.sortBy, filters.sortOrder, pagination.currentPage]);

  const loadGameHistory = async () => {
    setIsLoading(true);
    try {
      const offset = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const { data, count } = await statisticsService.getUserGameHistory(
        userId,
        pagination.itemsPerPage,
        offset,
        {
          timeFrame: filters.timeFrame === 'all' ? undefined : filters.timeFrame,
          category: filters.category || undefined,
          minScore: filters.minScore || undefined
        }
      );

      setGameHistory(data);
      setPagination(prev => ({
        ...prev,
        totalItems: count,
        totalPages: Math.ceil(count / pagination.itemsPerPage)
      }));
    } catch (error) {
      console.error('Failed to load game history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort the data client-side for search and custom sorting
  const filteredAndSortedGames = useMemo(() => {
    let filtered = gameHistory;

    // Apply search filter
    if (filters.searchTerm) {
      filtered = filtered.filter(game =>
        game.game_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        game.team_name?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'date':
          aValue = new Date(a.game_started_at).getTime();
          bValue = new Date(b.game_started_at).getTime();
          break;
        case 'score':
          aValue = a.final_score;
          bValue = b.final_score;
          break;
        case 'rank':
          aValue = a.final_rank || Infinity;
          bValue = b.final_rank || Infinity;
          break;
        case 'accuracy':
          aValue = a.accuracy_percentage || 0;
          bValue = b.accuracy_percentage || 0;
          break;
        default:
          return 0;
      }

      if (filters.sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filtered;
  }, [gameHistory, filters.searchTerm, filters.sortBy, filters.sortOrder]);

  const getRankBadgeColor = (rank: number | null, totalTeams: number | null) => {
    if (!rank || !totalTeams) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    if (rank === 1) return 'bg-gradient-to-r from-energy-yellow to-yellow-500 text-gray-900 border-yellow-300';
    if (rank <= 3) return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300';
    if (rank <= totalTeams / 2) return 'bg-gradient-to-r from-energy-green/20 to-green-100 text-green-800 border-green-200';
    return 'bg-gradient-to-r from-energy-red/20 to-red-100 text-red-800 border-red-200';
  };

  const getAccuracyBadgeColor = (accuracy: number | null) => {
    if (!accuracy) return 'bg-gray-100 text-gray-600';
    if (accuracy >= 90) return 'bg-energy-green text-white';
    if (accuracy >= 75) return 'bg-energy-yellow text-gray-900';
    if (accuracy >= 60) return 'bg-energy-orange text-white';
    return 'bg-energy-red text-white';
  };

  const formatDuration = (startDate: string, endDate: string | null) => {
    if (!endDate) return '—';
    const duration = new Date(endDate).getTime() - new Date(startDate).getTime();
    const minutes = Math.floor(duration / 60000);
    return `${minutes}m`;
  };

  const formatResponseTime = (time: number | null) => {
    if (!time) return '—';
    return `${time.toFixed(1)}s`;
  };

  const handleSort = (column: FilterOptions['sortBy']) => {
    if (filters.sortBy === column) {
      setFilters(prev => ({
        ...prev,
        sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        sortBy: column,
        sortOrder: column === 'rank' ? 'asc' : 'desc'
      }));
    }
  };

  const SortIcon = ({ column }: { column: FilterOptions['sortBy'] }) => {
    if (filters.sortBy !== column) {
      return <ArrowUpDown className="w-4 h-4 opacity-40" />;
    }
    return filters.sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-electric-600" /> : 
      <ChevronDown className="w-4 h-4 text-electric-600" />;
  };

  const GameDetailsModal = ({ game }: { game: GameHistoryEntry }) => (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowDetails(false)}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{game.game_name}</h2>
            <button
              onClick={() => setShowDetails(false)}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Game Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-energy-yellow" />
                Game Summary
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Final Score</span>
                  <span className="font-bold text-electric-600 text-lg">{game.final_score.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Final Rank</span>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getRankBadgeColor(game.final_rank, game.total_teams)}`}>
                    #{game.final_rank} of {game.total_teams}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Team</span>
                  <span className="font-medium text-plasma-600">{game.team_name || 'Solo'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{formatDuration(game.game_started_at, game.game_ended_at)}</span>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-energy-green" />
                Performance
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Questions Answered</span>
                  <span className="font-medium">{game.questions_answered}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Correct Answers</span>
                  <span className="font-medium text-energy-green">{game.correct_answers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Accuracy</span>
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getAccuracyBadgeColor(game.accuracy_percentage)}`}>
                    {Math.round(game.accuracy_percentage || 0)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Response Time</span>
                  <span className="font-medium">{formatResponseTime(game.average_response_time)}</span>
                </div>
                {game.fastest_response_time && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fastest Response</span>
                    <span className="font-medium text-energy-orange">{formatResponseTime(game.fastest_response_time)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Round Breakdown */}
          {game.round_breakdown && Object.keys(game.round_breakdown).length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-plasma-600" />
                Round Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(game.round_breakdown).map(([round, data]: [string, any]) => (
                  <div key={round} className="bg-plasma-50 rounded-lg p-3 text-center">
                    <div className="font-semibold text-plasma-700">{round}</div>
                    <div className="text-sm text-gray-600">Score: {data.score || 0}</div>
                    <div className="text-sm text-gray-600">Rank: #{data.rank || '?'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements */}
          {game.achievements_earned && game.achievements_earned.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-energy-yellow" />
                Achievements Earned
              </h3>
              <div className="flex flex-wrap gap-2">
                {game.achievements_earned.map((achievement, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-energy-yellow text-gray-900 rounded-full text-sm font-medium"
                  >
                    🏆 {achievement}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-electric-700 mb-2 flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Game History
            </h2>
            <p className="text-gray-600">
              Detailed performance records from your trivia journey
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search games..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-transparent bg-white w-48"
              />
            </div>

            {/* Filter Toggle */}
            {showFilters && (
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  showFilterPanel
                    ? 'bg-electric-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            )}

            {/* Export */}
            {showExport && (
              <button className="flex items-center gap-2 px-4 py-2 bg-plasma-500 text-white rounded-lg hover:bg-plasma-600 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilterPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Frame</label>
                  <select
                    value={filters.timeFrame}
                    onChange={(e) => setFilters(prev => ({ ...prev, timeFrame: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-transparent"
                  >
                    <option value="week">Last Week</option>
                    <option value="month">Last Month</option>
                    <option value="quarter">Last Quarter</option>
                    <option value="year">Last Year</option>
                    <option value="all">All Time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    <option value="Science">Science</option>
                    <option value="History">History</option>
                    <option value="Sports">Sports</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Geography">Geography</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Score</label>
                  <input
                    type="number"
                    placeholder="e.g. 500"
                    value={filters.minScore || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, minScore: e.target.value ? parseInt(e.target.value) : null }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-') as [FilterOptions['sortBy'], FilterOptions['sortOrder']];
                      setFilters(prev => ({ ...prev, sortBy, sortOrder }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-transparent"
                  >
                    <option value="date-desc">Date (Newest First)</option>
                    <option value="date-asc">Date (Oldest First)</option>
                    <option value="score-desc">Score (Highest First)</option>
                    <option value="score-asc">Score (Lowest First)</option>
                    <option value="rank-asc">Rank (Best First)</option>
                    <option value="rank-desc">Rank (Worst First)</option>
                    <option value="accuracy-desc">Accuracy (Highest First)</option>
                    <option value="accuracy-asc">Accuracy (Lowest First)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden">
        {filteredAndSortedGames.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-electric-50 border-b border-electric-100">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <button
                        onClick={() => handleSort('date')}
                        className="flex items-center gap-2 font-medium text-gray-700 hover:text-electric-600 transition-colors"
                      >
                        Game
                        <SortIcon column="date" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleSort('score')}
                        className="flex items-center gap-2 font-medium text-gray-700 hover:text-electric-600 transition-colors"
                      >
                        Score
                        <SortIcon column="score" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleSort('rank')}
                        className="flex items-center gap-2 font-medium text-gray-700 hover:text-electric-600 transition-colors"
                      >
                        Rank
                        <SortIcon column="rank" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleSort('accuracy')}
                        className="flex items-center gap-2 font-medium text-gray-700 hover:text-electric-600 transition-colors"
                      >
                        Accuracy
                        <SortIcon column="accuracy" />
                      </button>
                    </th>
                    <th className="px-6 py-4 text-center">Performance</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAndSortedGames.map((game, index) => (
                    <motion.tr
                      key={game.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{game.game_name}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(game.game_started_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                            {game.team_name && (
                              <>
                                <span className="mx-2">•</span>
                                <span className="text-electric-600">{game.team_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-bold text-lg text-gray-900">
                          {game.final_score.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRankBadgeColor(game.final_rank, game.total_teams)}`}>
                          #{game.final_rank} of {game.total_teams}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAccuracyBadgeColor(game.accuracy_percentage)}`}>
                          {Math.round(game.accuracy_percentage || 0)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-sm text-gray-600">
                          <div>{game.correct_answers}/{game.questions_answered} correct</div>
                          <div>{formatResponseTime(game.average_response_time)} avg</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedGame(game);
                            setShowDetails(true);
                          }}
                          className="p-2 text-gray-600 hover:text-electric-600 hover:bg-electric-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4 p-4">
              {filteredAndSortedGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-gray-50 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{game.game_name}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(game.game_started_at).toLocaleDateString()}
                      </p>
                      {game.team_name && (
                        <p className="text-sm text-electric-600">{game.team_name}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRankBadgeColor(game.final_rank, game.total_teams)}`}>
                      #{game.final_rank}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-gray-900">{game.final_score.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Score</div>
                    </div>
                    <div>
                      <div className={`text-sm font-medium px-2 py-1 rounded ${getAccuracyBadgeColor(game.accuracy_percentage)}`}>
                        {Math.round(game.accuracy_percentage || 0)}%
                      </div>
                      <div className="text-xs text-gray-600">Accuracy</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{game.correct_answers}/{game.questions_answered}</div>
                      <div className="text-xs text-gray-600">Correct</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedGame(game);
                      setShowDetails(true);
                    }}
                    className="w-full py-2 bg-electric-500 text-white rounded-lg hover:bg-electric-600 transition-colors font-medium"
                  >
                    View Details
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                  {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                  {pagination.totalItems} games
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <span className="px-3 py-1 bg-electric-500 text-white rounded-lg font-medium">
                    {pagination.currentPage}
                  </span>
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No games found</h3>
            <p className="text-gray-500">
              {filters.searchTerm || filters.category || filters.minScore
                ? 'Try adjusting your filters to see more results.'
                : 'Play some trivia games to see your history here!'}
            </p>
          </div>
        )}
      </div>

      {/* Game Details Modal */}
      <AnimatePresence>
        {showDetails && selectedGame && (
          <GameDetailsModal game={selectedGame} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default GameHistoryTable;
import { useState, useEffect, useCallback } from 'react';
import { statisticsService, type UserStatistics, type GameHistoryEntry, type CategoryPerformance, type LeaderboardEntry } from '../services/statisticsService';

export interface UseStatisticsOptions {
  userId?: string;
  autoLoad?: boolean;
  refreshInterval?: number;
}

export interface UseStatisticsReturn {
  statistics: UserStatistics | null;
  gameHistory: GameHistoryEntry[];
  categoryPerformance: CategoryPerformance[];
  isLoading: boolean;
  error: string | null;
  refreshStatistics: () => Promise<void>;
  loadGameHistory: (options?: {
    limit?: number;
    offset?: number;
    timeFrame?: 'week' | 'month' | 'quarter' | 'year';
    category?: string;
    minScore?: number;
  }) => Promise<void>;
  recordGame: (gameData: any) => Promise<void>;
}

export function useStatistics({
  userId,
  autoLoad = true,
  refreshInterval
}: UseStatisticsOptions = {}): UseStatisticsReturn {
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatistics = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [statsData, historyData, categoryData] = await Promise.all([
        statisticsService.getUserStatistics(userId),
        statisticsService.getUserGameHistory(userId, 20),
        statisticsService.getCategoryPerformance(userId)
      ]);

      setStatistics(statsData);
      setGameHistory(historyData.data);
      setCategoryPerformance(categoryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
      console.error('Error loading statistics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const loadGameHistory = useCallback(async (options: {
    limit?: number;
    offset?: number;
    timeFrame?: 'week' | 'month' | 'quarter' | 'year';
    category?: string;
    minScore?: number;
  } = {}) => {
    if (!userId) return;

    try {
      const { data } = await statisticsService.getUserGameHistory(
        userId,
        options.limit || 20,
        options.offset || 0,
        {
          timeFrame: options.timeFrame,
          category: options.category,
          minScore: options.minScore
        }
      );
      
      if (options.offset === 0) {
        setGameHistory(data);
      } else {
        setGameHistory(prev => [...prev, ...data]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load game history');
      console.error('Error loading game history:', err);
    }
  }, [userId]);

  const recordGame = useCallback(async (gameData: {
    gameRoomId: string;
    teamId: string;
    gameName: string;
    gameStartedAt: string;
    gameEndedAt: string;
    finalScore: number;
    finalRank: number;
    totalTeams: number;
    roundsPlayed: number;
    questionsAnswered: number;
    correctAnswers: number;
    averageResponseTime?: number;
    categoryStats?: Record<string, any>;
    difficultyStats?: Record<string, any>;
    roundBreakdown?: Record<string, any>;
    achievementsEarned?: string[];
  }) => {
    if (!userId) return;

    try {
      await statisticsService.recordGameHistory({
        ...gameData,
        userId
      });

      // Refresh statistics after recording a game
      await refreshStatistics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record game');
      console.error('Error recording game:', err);
    }
  }, [userId, refreshStatistics]);

  // Auto-load statistics when userId changes
  useEffect(() => {
    if (autoLoad && userId) {
      refreshStatistics();
    }
  }, [autoLoad, userId, refreshStatistics]);

  // Set up refresh interval if specified
  useEffect(() => {
    if (refreshInterval && userId) {
      const interval = setInterval(refreshStatistics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, userId, refreshStatistics]);

  return {
    statistics,
    gameHistory,
    categoryPerformance,
    isLoading,
    error,
    refreshStatistics,
    loadGameHistory,
    recordGame
  };
}

export interface UseLeaderboardOptions {
  type?: 'weekly' | 'monthly' | 'all_time';
  category?: string;
  limit?: number;
  autoRefresh?: boolean;
}

export interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  userRanking: {
    global: number | null;
    weekly: number | null;
    monthly: number | null;
    categoryRank: { category: string; rank: number } | null;
  } | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLeaderboard({
  type = 'all_time',
  category,
  limit = 50,
  autoRefresh = false
}: UseLeaderboardOptions = {}): UseLeaderboardReturn {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRanking, setUserRanking] = useState<UseLeaderboardReturn['userRanking']>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let leaderboardData: LeaderboardEntry[];

      if (category) {
        leaderboardData = await statisticsService.getCategoryLeaderboard(category, type, limit);
      } else {
        leaderboardData = await statisticsService.getGlobalLeaderboard(type, limit);
      }

      setLeaderboard(leaderboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      console.error('Error loading leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [type, category, limit]);

  // Load leaderboard data
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refresh, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refresh]);

  return {
    leaderboard,
    userRanking,
    isLoading,
    error,
    refresh
  };
}

export interface UseAchievementsOptions {
  userId?: string;
  autoLoad?: boolean;
}

export interface UseAchievementsReturn {
  achievements: any[];
  recentAchievements: any[];
  totalPoints: number;
  unlockedCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAchievements({
  userId,
  autoLoad = true
}: UseAchievementsOptions = {}): UseAchievementsReturn {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const recentData = await statisticsService.getRecentAchievements(userId, 10);
      setRecentAchievements(recentData);
      // TODO: Load all achievements when that endpoint is available
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load achievements');
      console.error('Error loading achievements:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (autoLoad && userId) {
      refresh();
    }
  }, [autoLoad, userId, refresh]);

  const totalPoints = achievements.reduce((sum, achievement) => 
    sum + (achievement.unlocked ? achievement.points : 0), 0
  );
  
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return {
    achievements,
    recentAchievements,
    totalPoints,
    unlockedCount,
    isLoading,
    error,
    refresh
  };
}
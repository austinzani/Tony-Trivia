import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

export interface GameHistoryEntry {
  id: string;
  game_name: string;
  game_started_at: string;
  game_ended_at: string | null;
  game_duration_minutes: number | null;
  final_score: number;
  final_rank: number | null;
  total_teams: number | null;
  rounds_played: number;
  questions_answered: number;
  correct_answers: number;
  incorrect_answers: number;
  accuracy_percentage: number | null;
  average_response_time: number | null;
  fastest_response_time: number | null;
  slowest_response_time: number | null;
  category_stats: Record<string, any>;
  difficulty_stats: Record<string, any>;
  round_breakdown: Record<string, any>;
  achievements_earned: string[];
  team_name?: string;
}

export interface UserStatistics {
  id: string;
  user_id: string;
  total_games_played: number;
  total_wins: number;
  total_podium_finishes: number;
  total_points_earned: number;
  average_score: number;
  highest_score: number;
  average_rank: number | null;
  best_rank: number | null;
  total_questions_answered: number;
  total_correct_answers: number;
  overall_accuracy: number | null;
  average_response_time: number | null;
  fastest_ever_response: number | null;
  current_win_streak: number;
  longest_win_streak: number;
  current_podium_streak: number;
  longest_podium_streak: number;
  total_play_time_minutes: number;
  games_this_week: number;
  games_this_month: number;
  favorite_category: string | null;
  category_win_rates: Record<string, number>;
  difficulty_performance: Record<string, any>;
  current_league: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master';
  league_rank: number | null;
  global_rank: number | null;
  peak_league: string;
  total_xp: number;
  current_level: number;
  teams_captained: number;
  recent_scores: number[];
  recent_ranks: number[];
  performance_trend: 'improving' | 'declining' | 'stable';
  last_game_at: string | null;
}

export interface TeamStatistics {
  id: string;
  team_id: string;
  team_name: string;
  captain_id: string | null;
  member_count: number;
  final_score: number;
  final_rank: number | null;
  total_teams: number | null;
  rounds_completed: number;
  questions_answered: number;
  correct_answers: number;
  team_accuracy: number | null;
  unanimous_answers: number;
  split_decisions: number;
  captain_override_count: number;
  average_response_time: number | null;
  round_scores: number[];
  category_performance: Record<string, any>;
  game_started_at: string | null;
  game_duration_minutes: number | null;
}

export interface LeaderboardEntry {
  user_id?: string;
  team_id?: string;
  username?: string;
  display_name?: string;
  team_name?: string;
  score: number;
  rank: number;
  games_played?: number;
  win_rate?: number;
  accuracy?: number;
  average_response_time?: number;
  metadata?: Record<string, any>;
}

export interface CategoryPerformance {
  category: string;
  games_played: number;
  average_score: number;
  win_rate: number;
  accuracy: number;
  total_questions: number;
  correct_answers: number;
}

export interface PerformanceChart {
  date: string;
  score: number;
  rank: number;
  accuracy: number;
  response_time: number;
}

class StatisticsService {
  /**
   * Get comprehensive user statistics
   */
  async getUserStatistics(userId: string): Promise<UserStatistics | null> {
    const { data, error } = await supabase
      .from('user_statistics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user statistics:', error);
      return null;
    }

    return data;
  }

  /**
   * Get user's game history with pagination
   */
  async getUserGameHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0,
    filters?: {
      timeFrame?: 'week' | 'month' | 'quarter' | 'year';
      category?: string;
      minScore?: number;
    }
  ): Promise<{ data: GameHistoryEntry[]; count: number }> {
    let query = supabase
      .from('game_history')
      .select(`
        *,
        teams!inner(name)
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('game_started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filters?.timeFrame) {
      const now = new Date();
      const startDate = new Date();
      
      switch (filters.timeFrame) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      query = query.gte('game_started_at', startDate.toISOString());
    }

    if (filters?.minScore) {
      query = query.gte('final_score', filters.minScore);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching game history:', error);
      return { data: [], count: 0 };
    }

    // Transform data to include team name
    const transformedData = data?.map(game => ({
      ...game,
      team_name: (game as any).teams?.name
    })) || [];

    return { data: transformedData, count: count || 0 };
  }

  /**
   * Get team statistics for a specific game
   */
  async getTeamStatistics(teamId: string, gameRoomId?: string): Promise<TeamStatistics[]> {
    let query = supabase
      .from('team_statistics')
      .select('*')
      .eq('team_id', teamId)
      .order('game_started_at', { ascending: false });

    if (gameRoomId) {
      query = query.eq('game_room_id', gameRoomId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching team statistics:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get category performance breakdown
   */
  async getCategoryPerformance(userId: string): Promise<CategoryPerformance[]> {
    const { data, error } = await supabase.rpc('get_user_category_performance', {
      user_id: userId
    });

    if (error) {
      console.error('Error fetching category performance:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get performance chart data for trends
   */
  async getPerformanceChart(
    userId: string,
    timeFrame: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<PerformanceChart[]> {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeFrame) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
    }

    const { data, error } = await supabase
      .from('game_history')
      .select(`
        game_started_at,
        final_score,
        final_rank,
        accuracy_percentage,
        average_response_time
      `)
      .eq('user_id', userId)
      .gte('game_started_at', startDate.toISOString())
      .order('game_started_at', { ascending: true });

    if (error) {
      console.error('Error fetching performance chart data:', error);
      return [];
    }

    return (data || []).map(game => ({
      date: game.game_started_at,
      score: game.final_score,
      rank: game.final_rank || 0,
      accuracy: game.accuracy_percentage || 0,
      response_time: game.average_response_time || 0
    }));
  }

  /**
   * Get global leaderboard
   */
  async getGlobalLeaderboard(
    type: 'weekly' | 'monthly' | 'all_time' = 'all_time',
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase.rpc('get_global_leaderboard', {
      leaderboard_type: type,
      entry_limit: limit
    });

    if (error) {
      console.error('Error fetching global leaderboard:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get category-specific leaderboard
   */
  async getCategoryLeaderboard(
    category: string,
    type: 'weekly' | 'monthly' | 'all_time' = 'all_time',
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase.rpc('get_category_leaderboard', {
      category_name: category,
      leaderboard_type: type,
      entry_limit: limit
    });

    if (error) {
      console.error('Error fetching category leaderboard:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get team leaderboard
   */
  async getTeamLeaderboard(
    type: 'weekly' | 'monthly' | 'all_time' = 'all_time',
    limit: number = 50
  ): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase.rpc('get_team_leaderboard', {
      leaderboard_type: type,
      entry_limit: limit
    });

    if (error) {
      console.error('Error fetching team leaderboard:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get user's ranking position in different leaderboards
   */
  async getUserRankings(userId: string): Promise<{
    global: number | null;
    weekly: number | null;
    monthly: number | null;
    favoriteCategory: { category: string; rank: number } | null;
  }> {
    const { data, error } = await supabase.rpc('get_user_rankings', {
      user_id: userId
    });

    if (error) {
      console.error('Error fetching user rankings:', error);
      return {
        global: null,
        weekly: null,
        monthly: null,
        favoriteCategory: null
      };
    }

    return data || {
      global: null,
      weekly: null,
      monthly: null,
      favoriteCategory: null
    };
  }

  /**
   * Get recent achievements for a user
   */
  async getRecentAchievements(userId: string, limit: number = 10) {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent achievements:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Record a completed game in the history
   */
  async recordGameHistory(gameData: {
    gameRoomId: string;
    teamId: string;
    userId: string;
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
  }) {
    const { data, error } = await supabase
      .from('game_history')
      .insert({
        game_room_id: gameData.gameRoomId,
        team_id: gameData.teamId,
        user_id: gameData.userId,
        game_name: gameData.gameName,
        game_started_at: gameData.gameStartedAt,
        game_ended_at: gameData.gameEndedAt,
        game_duration_minutes: Math.round(
          (new Date(gameData.gameEndedAt).getTime() - new Date(gameData.gameStartedAt).getTime()) / 60000
        ),
        final_score: gameData.finalScore,
        final_rank: gameData.finalRank,
        total_teams: gameData.totalTeams,
        rounds_played: gameData.roundsPlayed,
        questions_answered: gameData.questionsAnswered,
        correct_answers: gameData.correctAnswers,
        incorrect_answers: gameData.questionsAnswered - gameData.correctAnswers,
        average_response_time: gameData.averageResponseTime,
        category_stats: gameData.categoryStats || {},
        difficulty_stats: gameData.difficultyStats || {},
        round_breakdown: gameData.roundBreakdown || {},
        achievements_earned: gameData.achievementsEarned || []
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording game history:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update user statistics after a game
   */
  async updateUserStatistics(userId: string, gameData: {
    finalScore: number;
    finalRank: number;
    totalTeams: number;
    questionsAnswered: number;
    correctAnswers: number;
    gameDurationMinutes: number;
    averageResponseTime?: number;
    fastestResponse?: number;
  }) {
    // This would typically be handled by database triggers,
    // but we can also have a manual update function for immediate updates
    const { data, error } = await supabase.rpc('update_user_statistics', {
      user_id: userId,
      game_data: gameData
    });

    if (error) {
      console.error('Error updating user statistics:', error);
      throw error;
    }

    return data;
  }

  /**
   * Calculate XP and level progression
   */
  calculateXP(gameData: {
    finalScore: number;
    finalRank: number;
    totalTeams: number;
    accuracy: number;
    questionsAnswered: number;
  }): number {
    let xp = 0;
    
    // Base XP for participation
    xp += 10;
    
    // Score-based XP
    xp += Math.floor(gameData.finalScore / 10);
    
    // Rank-based bonus
    if (gameData.finalRank === 1) {
      xp += 50; // Winner bonus
    } else if (gameData.finalRank <= 3) {
      xp += 25; // Podium bonus
    } else if (gameData.finalRank <= gameData.totalTeams / 2) {
      xp += 10; // Above average bonus
    }
    
    // Accuracy bonus
    if (gameData.accuracy >= 90) {
      xp += 20;
    } else if (gameData.accuracy >= 75) {
      xp += 10;
    }
    
    // Question volume bonus
    xp += Math.floor(gameData.questionsAnswered / 5);
    
    return Math.max(xp, 10); // Minimum 10 XP per game
  }

  /**
   * Calculate level from total XP
   */
  calculateLevel(totalXP: number): { level: number; xpForNextLevel: number } {
    // XP required: 100 for level 2, then increases by 150 each level
    let level = 1;
    let xpRequired = 0;
    
    while (totalXP >= xpRequired + (100 + (level - 1) * 150)) {
      xpRequired += 100 + (level - 1) * 150;
      level++;
    }
    
    const xpForNextLevel = (100 + (level - 1) * 150) - (totalXP - xpRequired);
    
    return { level, xpForNextLevel };
  }

  /**
   * Determine league based on performance metrics
   */
  calculateLeague(stats: {
    totalGames: number;
    winRate: number;
    averageScore: number;
    totalXP: number;
  }): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' {
    if (stats.totalGames < 5) return 'Bronze';
    
    const { level } = this.calculateLevel(stats.totalXP);
    
    if (level >= 50 && stats.winRate >= 0.6 && stats.averageScore >= 800) {
      return 'Master';
    } else if (level >= 40 && stats.winRate >= 0.5 && stats.averageScore >= 700) {
      return 'Diamond';
    } else if (level >= 30 && stats.winRate >= 0.4 && stats.averageScore >= 600) {
      return 'Platinum';
    } else if (level >= 20 && stats.winRate >= 0.3 && stats.averageScore >= 500) {
      return 'Gold';
    } else if (level >= 10 && stats.winRate >= 0.2 && stats.averageScore >= 400) {
      return 'Silver';
    } else {
      return 'Bronze';
    }
  }
}

export const statisticsService = new StatisticsService();
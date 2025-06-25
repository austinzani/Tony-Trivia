import { useState, useEffect, useCallback } from 'react';
import { AnalyticsFilters, AnalyticsDashboardData } from '../types/analytics';
import { supabase } from '../lib/supabase';

export const useAnalytics = (filters: AnalyticsFilters) => {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Calculate date range based on filters
      const now = new Date();
      let startDate = new Date();
      
      switch (filters.timeRange) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'custom':
          if (filters.customDateRange) {
            startDate = filters.customDateRange.start;
          }
          break;
      }

      // Fetch game performance data
      const gamePerformance = await fetchGamePerformance(startDate, now, filters);
      
      // Fetch player engagement metrics
      const playerEngagement = await fetchPlayerEngagement(startDate, now, filters);
      
      // Fetch question analytics
      const questionAnalytics = await fetchQuestionAnalytics(startDate, now, filters);
      
      // Fetch host performance metrics
      const hostPerformance = await fetchHostPerformance(startDate, now, filters);
      
      // Fetch administrative insights
      const administrativeInsights = await fetchAdministrativeInsights(startDate, now);
      
      // Fetch team performance
      const teamPerformance = await fetchTeamPerformance(startDate, now, filters);
      
      // Fetch category performance
      const categoryPerformance = await fetchCategoryPerformance(startDate, now, filters);
      
      // Fetch real-time analytics
      const realTimeAnalytics = await fetchRealTimeAnalytics();

      setData({
        gamePerformance,
        playerEngagement,
        questionAnalytics,
        hostPerformance,
        administrativeInsights,
        teamPerformance,
        categoryPerformance,
        realTimeAnalytics,
        lastUpdated: new Date()
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const refetch = useCallback(() => {
    return fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  return { data, loading, error, refetch };
};

// Helper functions for fetching specific analytics data

async function fetchGamePerformance(startDate: Date, endDate: Date, filters: AnalyticsFilters) {
  const { data: games, error } = await supabase
    .from('game_rooms')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (error) throw error;

  // Calculate analytics
  const totalGames = games?.length || 0;
  const completedGames = games?.filter(g => g.status === 'finished').length || 0;
  const abandonedGames = totalGames - completedGames;

  // Calculate average players and duration
  const avgPlayers = games?.reduce((sum, g) => sum + (g.current_players || 0), 0) / totalGames || 0;
  const avgDuration = games?.reduce((sum, g) => {
    if (g.started_at && g.ended_at) {
      return sum + (new Date(g.ended_at).getTime() - new Date(g.started_at).getTime());
    }
    return sum;
  }, 0) / completedGames / 1000 / 60 || 0; // Convert to minutes

  // Group games by hour and day
  const gamesByHour = Array(24).fill(0);
  const gamesByDay = Array(7).fill(0);

  games?.forEach(game => {
    const date = new Date(game.created_at);
    gamesByHour[date.getHours()]++;
    gamesByDay[date.getDay()]++;
  });

  return {
    totalGames,
    averagePlayersPerGame: avgPlayers,
    averageGameDuration: avgDuration,
    completionRate: (completedGames / totalGames) * 100 || 0,
    abandonmentRate: (abandonedGames / totalGames) * 100 || 0,
    peakPlayersTime: {
      hour: gamesByHour.indexOf(Math.max(...gamesByHour)),
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
        gamesByDay.indexOf(Math.max(...gamesByDay))
      ],
      playerCount: Math.max(...gamesByHour)
    },
    gamesByTimeOfDay: gamesByHour.map((count, hour) => ({ hour, count })),
    gamesByDayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      .map((day, index) => ({ day, count: gamesByDay[index] }))
  };
}

async function fetchPlayerEngagement(startDate: Date, endDate: Date, filters: AnalyticsFilters) {
  // This would fetch actual player data from the database
  // For now, returning mock data
  return {
    totalUniquePlayers: 1250,
    returningPlayersRate: 68.5,
    averageGamesPerPlayer: 3.2,
    playerRetention: {
      day1: 85,
      day7: 62,
      day30: 45
    },
    engagementByCategory: [
      { category: 'Science', engagementRate: 78, averageScore: 850 },
      { category: 'History', engagementRate: 72, averageScore: 820 },
      { category: 'Sports', engagementRate: 85, averageScore: 890 },
      { category: 'Entertainment', engagementRate: 90, averageScore: 920 }
    ],
    playerActivityHeatmap: generateHeatmapData()
  };
}

async function fetchQuestionAnalytics(startDate: Date, endDate: Date, filters: AnalyticsFilters) {
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (questionsError) throw questionsError;

  const { data: answers, error: answersError } = await supabase
    .from('answers')
    .select('*')
    .gte('submitted_at', startDate.toISOString())
    .lte('submitted_at', endDate.toISOString());

  if (answersError) throw answersError;

  // Calculate question analytics
  const questionStats = questions?.map(q => {
    const questionAnswers = answers?.filter(a => a.question_id === q.id) || [];
    const correctAnswers = questionAnswers.filter(a => a.is_correct).length;
    const correctRate = (correctAnswers / questionAnswers.length) * 100 || 0;
    const avgResponseTime = questionAnswers.reduce((sum, a) => sum + a.time_taken, 0) / questionAnswers.length || 0;

    return {
      ...q,
      correctRate,
      avgResponseTime,
      totalAttempts: questionAnswers.length
    };
  }) || [];

  // Sort by difficulty
  const sortedByDifficulty = [...questionStats].sort((a, b) => a.correctRate - b.correctRate);

  return {
    totalQuestions: questions?.length || 0,
    questionsByCategory: groupByCategory(questionStats),
    difficultyDistribution: {
      easy: questions?.filter(q => q.difficulty === 'easy').length || 0,
      medium: questions?.filter(q => q.difficulty === 'medium').length || 0,
      hard: questions?.filter(q => q.difficulty === 'hard').length || 0
    },
    averageResponseTimeByDifficulty: {
      easy: calculateAvgByDifficulty(questionStats, 'easy'),
      medium: calculateAvgByDifficulty(questionStats, 'medium'),
      hard: calculateAvgByDifficulty(questionStats, 'hard')
    },
    mostDifficultQuestions: sortedByDifficulty.slice(0, 5).map(q => ({
      id: q.id,
      questionText: q.question_text,
      category: q.category,
      correctRate: q.correctRate,
      averageResponseTime: q.avgResponseTime
    })),
    easiestQuestions: sortedByDifficulty.slice(-5).reverse().map(q => ({
      id: q.id,
      questionText: q.question_text,
      category: q.category,
      correctRate: q.correctRate,
      averageResponseTime: q.avgResponseTime
    }))
  };
}

async function fetchHostPerformance(startDate: Date, endDate: Date, filters: AnalyticsFilters) {
  // This would fetch actual host performance data
  // For now, returning mock data for multiple hosts
  return [
    {
      hostId: 'host-1',
      hostName: 'John Doe',
      totalGamesHosted: 45,
      averageGameRating: 4.7,
      playerSatisfactionScore: 92,
      averagePlayersPerGame: 12.5,
      gameCompletionRate: 95,
      popularCategories: [
        { category: 'Science', timesSelected: 18 },
        { category: 'History', timesSelected: 15 },
        { category: 'Sports', timesSelected: 12 }
      ],
      hostingPatterns: {
        preferredTimeSlots: [
          { dayOfWeek: 'Friday', timeRange: '7PM-9PM', frequency: 8 },
          { dayOfWeek: 'Saturday', timeRange: '8PM-10PM', frequency: 12 }
        ],
        averageGameLength: 45,
        averageRoundsPerGame: 5
      }
    }
  ];
}

async function fetchAdministrativeInsights(startDate: Date, endDate: Date) {
  // This would fetch actual administrative data
  // For now, returning mock data
  return {
    platformHealth: {
      status: 'healthy' as const,
      uptime: 99.9,
      errorRate: 0.02,
      averageResponseTime: 245
    },
    userGrowth: {
      newUsersToday: 23,
      newUsersThisWeek: 142,
      newUsersThisMonth: 587,
      growthRate: 12.5,
      churnRate: 3.2
    },
    revenue: {
      totalRevenue: 45230,
      revenueByPeriod: generateRevenueTrend(),
      averageRevenuePerUser: 12.50,
      topRevenueGames: [
        { gameId: 'game-1', gameName: 'Friday Night Trivia', revenue: 2340 },
        { gameId: 'game-2', gameName: 'Science Bowl', revenue: 1890 },
        { gameId: 'game-3', gameName: 'History Challenge', revenue: 1560 }
      ]
    },
    systemUsage: {
      peakConcurrentUsers: 342,
      averageDailyActiveUsers: 185,
      serverLoad: 42,
      databaseSize: 2.4
    }
  };
}

async function fetchTeamPerformance(startDate: Date, endDate: Date, filters: AnalyticsFilters) {
  // This would fetch actual team performance data
  // For now, returning mock data
  return [
    {
      teamId: 'team-1',
      teamName: 'The Brainiacs',
      gamesPlayed: 23,
      winRate: 78.3,
      averageScore: 920,
      averageResponseTime: 8.5,
      strongestCategories: ['Science', 'Geography'],
      weakestCategories: ['Entertainment'],
      performanceTrend: 'improving' as const,
      teamChemistryScore: 88
    }
  ];
}

async function fetchCategoryPerformance(startDate: Date, endDate: Date, filters: AnalyticsFilters) {
  // This would fetch actual category performance data
  // For now, returning mock data
  return [
    {
      category: 'Science',
      totalQuestions: 245,
      averageCorrectRate: 68.5,
      averageResponseTime: 12.3,
      popularityScore: 85,
      difficultyBalance: {
        easy: 30,
        medium: 50,
        hard: 20
      },
      topPerformingTeams: [
        { teamId: 'team-1', teamName: 'The Brainiacs', correctRate: 92 },
        { teamId: 'team-2', teamName: 'Quiz Masters', correctRate: 88 }
      ]
    }
  ];
}

async function fetchRealTimeAnalytics() {
  // This would fetch actual real-time data
  // For now, returning mock data
  return {
    activeGames: 12,
    activePlayers: 142,
    questionsAnsweredLastHour: 1832,
    averageResponseTimeLast10Min: 9.2,
    currentServerLoad: 38,
    liveGameStatus: [
      {
        gameId: 'game-live-1',
        gameName: 'Friday Night Special',
        playerCount: 24,
        currentRound: 3,
        status: 'active' as const
      },
      {
        gameId: 'game-live-2',
        gameName: 'Quick Quiz',
        playerCount: 8,
        currentRound: 5,
        status: 'ending_soon' as const
      }
    ]
  };
}

// Helper functions
function generateHeatmapData() {
  const data = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      data.push({
        dayOfWeek: day,
        hour,
        intensity: Math.random() * 100
      });
    }
  }
  return data;
}

function generateRevenueTrend() {
  const data = [];
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      amount: 1000 + Math.random() * 500
    });
  }
  return data;
}

function groupByCategory(questions: any[]) {
  const categories: { [key: string]: any } = {};
  
  questions.forEach(q => {
    if (!categories[q.category]) {
      categories[q.category] = {
        category: q.category,
        count: 0,
        totalCorrectRate: 0
      };
    }
    categories[q.category].count++;
    categories[q.category].totalCorrectRate += q.correctRate;
  });

  return Object.values(categories).map(c => ({
    category: c.category,
    count: c.count,
    averageCorrectRate: c.totalCorrectRate / c.count
  }));
}

function calculateAvgByDifficulty(questions: any[], difficulty: string) {
  const filtered = questions.filter(q => q.difficulty === difficulty);
  if (filtered.length === 0) return 0;
  return filtered.reduce((sum, q) => sum + q.avgResponseTime, 0) / filtered.length;
}
// Analytics types for Tony Trivia Advanced Analytics Dashboard

// Time range options for analytics filtering
export type TimeRange = '24h' | '7d' | '30d' | '90d' | 'custom';

// Game performance analytics
export interface GamePerformanceAnalytics {
  totalGames: number;
  averagePlayersPerGame: number;
  averageGameDuration: number;
  completionRate: number;
  abandonmentRate: number;
  peakPlayersTime: {
    hour: number;
    dayOfWeek: string;
    playerCount: number;
  };
  gamesByTimeOfDay: Array<{
    hour: number;
    count: number;
  }>;
  gamesByDayOfWeek: Array<{
    day: string;
    count: number;
  }>;
}

// Player engagement metrics
export interface PlayerEngagementMetrics {
  totalUniquePlayers: number;
  returningPlayersRate: number;
  averageGamesPerPlayer: number;
  playerRetention: {
    day1: number;
    day7: number;
    day30: number;
  };
  engagementByCategory: Array<{
    category: string;
    engagementRate: number;
    averageScore: number;
  }>;
  playerActivityHeatmap: Array<{
    dayOfWeek: number;
    hour: number;
    intensity: number;
  }>;
}

// Question analytics
export interface QuestionAnalytics {
  totalQuestions: number;
  questionsByCategory: Array<{
    category: string;
    count: number;
    averageCorrectRate: number;
  }>;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  averageResponseTimeByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  mostDifficultQuestions: Array<{
    id: string;
    questionText: string;
    category: string;
    correctRate: number;
    averageResponseTime: number;
  }>;
  easiestQuestions: Array<{
    id: string;
    questionText: string;
    category: string;
    correctRate: number;
    averageResponseTime: number;
  }>;
}

// Host performance metrics
export interface HostPerformanceMetrics {
  hostId: string;
  hostName: string;
  totalGamesHosted: number;
  averageGameRating: number;
  playerSatisfactionScore: number;
  averagePlayersPerGame: number;
  gameCompletionRate: number;
  popularCategories: Array<{
    category: string;
    timesSelected: number;
  }>;
  hostingPatterns: {
    preferredTimeSlots: Array<{
      dayOfWeek: string;
      timeRange: string;
      frequency: number;
    }>;
    averageGameLength: number;
    averageRoundsPerGame: number;
  };
}

// Administrative insights
export interface AdministrativeInsights {
  platformHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    errorRate: number;
    averageResponseTime: number;
  };
  userGrowth: {
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    growthRate: number;
    churnRate: number;
  };
  revenue: {
    totalRevenue: number;
    revenueByPeriod: Array<{
      date: string;
      amount: number;
    }>;
    averageRevenuePerUser: number;
    topRevenueGames: Array<{
      gameId: string;
      gameName: string;
      revenue: number;
    }>;
  };
  systemUsage: {
    peakConcurrentUsers: number;
    averageDailyActiveUsers: number;
    serverLoad: number;
    databaseSize: number;
  };
}

// Team performance analytics
export interface TeamPerformanceAnalytics {
  teamId: string;
  teamName: string;
  gamesPlayed: number;
  winRate: number;
  averageScore: number;
  averageResponseTime: number;
  strongestCategories: string[];
  weakestCategories: string[];
  performanceTrend: 'improving' | 'declining' | 'stable';
  teamChemistryScore: number;
}

// Category performance analytics
export interface CategoryPerformanceAnalytics {
  category: string;
  totalQuestions: number;
  averageCorrectRate: number;
  averageResponseTime: number;
  popularityScore: number;
  difficultyBalance: {
    easy: number;
    medium: number;
    hard: number;
  };
  topPerformingTeams: Array<{
    teamId: string;
    teamName: string;
    correctRate: number;
  }>;
}

// Real-time analytics
export interface RealTimeAnalytics {
  activeGames: number;
  activePlayers: number;
  questionsAnsweredLastHour: number;
  averageResponseTimeLast10Min: number;
  currentServerLoad: number;
  liveGameStatus: Array<{
    gameId: string;
    gameName: string;
    playerCount: number;
    currentRound: number;
    status: 'active' | 'paused' | 'ending_soon';
  }>;
}

// Export data formats
export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf' | 'excel';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeCharts: boolean;
  includedMetrics: string[];
}

// Dashboard filter options
export interface AnalyticsFilters {
  timeRange: TimeRange;
  customDateRange?: {
    start: Date;
    end: Date;
  };
  categories?: string[];
  difficulty?: ('easy' | 'medium' | 'hard')[];
  hostIds?: string[];
  minGames?: number;
  gameStatus?: ('completed' | 'abandoned')[];
}

// Aggregated dashboard data
export interface AnalyticsDashboardData {
  gamePerformance: GamePerformanceAnalytics;
  playerEngagement: PlayerEngagementMetrics;
  questionAnalytics: QuestionAnalytics;
  hostPerformance: HostPerformanceMetrics[];
  administrativeInsights: AdministrativeInsights;
  teamPerformance: TeamPerformanceAnalytics[];
  categoryPerformance: CategoryPerformanceAnalytics[];
  realTimeAnalytics: RealTimeAnalytics;
  lastUpdated: Date;
}
export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  isGuest: boolean;
  createdAt: string;
  lastActive: string;
  
  // Gamification
  level: number;
  xp: number;
  xpToNextLevel: number;
  
  // Stats
  stats: UserStats;
  
  // Achievements
  achievements: Achievement[];
  
  // Settings
  settings: UserSettings;
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number;
  highestScore: number;
  averageScore: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
  totalPlayTime: number; // in minutes
  favoriteCategory?: string;
  
  // Weekly/Monthly stats
  weeklyGames: number;
  monthlyGames: number;
  
  // Additional stats
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  
  // Ranking
  globalRank?: number;
  leagueRank?: number;
  league: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'games' | 'score' | 'streak' | 'special' | 'social' | 'milestone' | 'performance';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'uncommon';
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  target?: number;
  xpReward: number;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  soundEnabled: boolean;
  animationsEnabled: boolean;
  notificationsEnabled: boolean;
  autoJoinNextGame: boolean;
  showInLeaderboards: boolean;
  allowFriendRequests: boolean;
  preferredDifficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  language: string;
}

export interface AvatarOption {
  id: string;
  name: string;
  url: string;
  category: 'default' | 'gaming' | 'animals' | 'abstract' | 'custom';
  unlockRequirement?: {
    type: 'level' | 'achievement' | 'games' | 'score';
    value: number | string;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface ProfileUpdateData {
  displayName?: string;
  username?: string;
  avatarUrl?: string;
  settings?: Partial<UserSettings>;
}

// XP and Level calculations
export const XP_REQUIREMENTS = {
  BASE_XP: 100,
  MULTIPLIER: 1.5,
  MAX_LEVEL: 100
};

export const XP_REWARDS = {
  GAME_COMPLETION: 10,
  GAME_WIN: 25,
  HIGH_SCORE: 50,
  PERFECT_SCORE: 100,
  ACHIEVEMENT_UNLOCK: 75,
  DAILY_LOGIN: 5,
  WEEKLY_LOGIN: 25
};

// Helper functions
export const calculateXPForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return Math.floor(XP_REQUIREMENTS.BASE_XP * Math.pow(XP_REQUIREMENTS.MULTIPLIER, level - 1));
};

export const calculateLevelFromXP = (totalXP: number): { level: number; currentXP: number; xpToNext: number } => {
  let level = 1;
  let xpUsed = 0;
  
  while (level < XP_REQUIREMENTS.MAX_LEVEL) {
    const xpForNextLevel = calculateXPForLevel(level + 1);
    if (totalXP < xpUsed + xpForNextLevel) {
      break;
    }
    xpUsed += xpForNextLevel;
    level++;
  }
  
  const currentXP = totalXP - xpUsed;
  const xpToNext = level < XP_REQUIREMENTS.MAX_LEVEL ? calculateXPForLevel(level + 1) - currentXP : 0;
  
  return { level, currentXP, xpToNext };
};

export const getLeagueFromStats = (stats: UserStats): UserStats['league'] => {
  const { gamesPlayed, winRate, averageScore } = stats;
  
  if (gamesPlayed < 10) return 'Bronze';
  
  const score = (winRate * 0.4) + (averageScore / 100 * 0.4) + (Math.min(gamesPlayed / 100, 1) * 0.2);
  
  if (score >= 0.9) return 'Master';
  if (score >= 0.8) return 'Diamond';
  if (score >= 0.7) return 'Platinum';
  if (score >= 0.6) return 'Gold';
  if (score >= 0.4) return 'Silver';
  return 'Bronze';
}; 
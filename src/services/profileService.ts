import type { UserProfile, UserStats, Achievement } from '../types/profile';

// XP and Level calculations
export const LEVEL_XP_REQUIREMENTS = [
  0,     // Level 1
  100,   // Level 2
  250,   // Level 3
  450,   // Level 4
  700,   // Level 5
  1000,  // Level 6
  1350,  // Level 7
  1750,  // Level 8
  2200,  // Level 9
  2700,  // Level 10
  3250,  // Level 11
  3850,  // Level 12
  4500,  // Level 13
  5200,  // Level 14
  5950,  // Level 15
  6750,  // Level 16
  7600,  // Level 17
  8500,  // Level 18
  9450,  // Level 19
  10450, // Level 20
];

export const XP_REWARDS = {
  GAME_COMPLETED: 25,
  GAME_WON: 50,
  HIGH_SCORE: 75,
  PERFECT_ROUND: 100,
  ACHIEVEMENT_UNLOCKED: 150,
  DAILY_LOGIN: 10,
  STREAK_BONUS: 20,
  FIRST_GAME: 50,
};

export class ProfileService {
  // Calculate level and XP to next level
  static calculateLevel(totalXP: number): { level: number; xp: number; xpToNextLevel: number } {
    let level = 1;
    let remainingXP = totalXP;

    // Find current level
    for (let i = 1; i < LEVEL_XP_REQUIREMENTS.length; i++) {
      const xpNeeded = LEVEL_XP_REQUIREMENTS[i];
      if (remainingXP >= xpNeeded) {
        remainingXP -= xpNeeded;
        level = i + 1;
      } else {
        break;
      }
    }

    // Calculate XP to next level
    const nextLevelIndex = Math.min(level, LEVEL_XP_REQUIREMENTS.length - 1);
    const xpToNextLevel = LEVEL_XP_REQUIREMENTS[nextLevelIndex] || 1000;

    return {
      level,
      xp: remainingXP,
      xpToNextLevel
    };
  }

  // Award XP and check for level up
  static awardXP(currentProfile: UserProfile, xpAmount: number, reason: string): {
    updatedProfile: UserProfile;
    leveledUp: boolean;
    newLevel?: number;
  } {
    const oldLevel = currentProfile.level;
    const newTotalXP = this.getTotalXP(currentProfile) + xpAmount;
    const levelData = this.calculateLevel(newTotalXP);

    const updatedProfile: UserProfile = {
      ...currentProfile,
      level: levelData.level,
      xp: levelData.xp,
      xpToNextLevel: levelData.xpToNextLevel
    };

    return {
      updatedProfile,
      leveledUp: levelData.level > oldLevel,
      newLevel: levelData.level > oldLevel ? levelData.level : undefined
    };
  }

  // Get total XP from level and current XP
  static getTotalXP(profile: UserProfile): number {
    let totalXP = profile.xp;
    
    // Add XP from all previous levels
    for (let i = 1; i < profile.level; i++) {
      totalXP += LEVEL_XP_REQUIREMENTS[i] || 0;
    }

    return totalXP;
  }

  // Check and unlock achievements
  static checkAchievements(profile: UserProfile, gameData?: {
    gamesPlayed?: number;
    score?: number;
    won?: boolean;
    perfectRound?: boolean;
  }): Achievement[] {
    const newAchievements: Achievement[] = [];
    const stats = profile.stats;

    // Define achievement conditions
    const achievementChecks = [
      {
        id: 'first-game',
        condition: stats.gamesPlayed >= 1,
        achievement: {
          id: 'first-game',
          name: 'First Steps',
          description: 'Play your first game',
          icon: '🎮',
          category: 'milestone',
          rarity: 'common',
          xpReward: 50,
          unlockedAt: new Date().toISOString()
        }
      },
      {
        id: 'high-scorer',
        condition: stats.highestScore >= 1000,
        achievement: {
          id: 'high-scorer',
          name: 'High Scorer',
          description: 'Score 1000 points in a single game',
          icon: '🎯',
          category: 'performance',
          rarity: 'uncommon',
          xpReward: 100,
          unlockedAt: new Date().toISOString()
        }
      },
      {
        id: 'regular-player',
        condition: stats.gamesPlayed >= 10,
        achievement: {
          id: 'regular-player',
          name: 'Regular Player',
          description: 'Play 10 games',
          icon: '🏃',
          category: 'milestone',
          rarity: 'common',
          xpReward: 75,
          unlockedAt: new Date().toISOString()
        }
      },
      {
        id: 'winner',
        condition: stats.gamesWon >= 1,
        achievement: {
          id: 'winner',
          name: 'Victory!',
          description: 'Win your first game',
          icon: '🏆',
          category: 'performance',
          rarity: 'uncommon',
          xpReward: 100,
          unlockedAt: new Date().toISOString()
        }
      },
      {
        id: 'streak-master',
        condition: stats.currentStreak >= 5,
        achievement: {
          id: 'streak-master',
          name: 'Streak Master',
          description: 'Win 5 games in a row',
          icon: '🔥',
          category: 'performance',
          rarity: 'rare',
          xpReward: 200,
          unlockedAt: new Date().toISOString()
        }
      },
      {
        id: 'perfectionist',
        condition: gameData?.perfectRound === true,
        achievement: {
          id: 'perfectionist',
          name: 'Perfect Round',
          description: 'Answer every question correctly in a round',
          icon: '💎',
          category: 'performance',
          rarity: 'epic',
          xpReward: 300,
          unlockedAt: new Date().toISOString()
        }
      }
    ];

    // Check each achievement
    achievementChecks.forEach(({ id, condition, achievement }) => {
      const alreadyUnlocked = profile.achievements.some(a => a.id === id && a.unlockedAt);
      if (condition && !alreadyUnlocked) {
        newAchievements.push(achievement as Achievement);
      }
    });

    return newAchievements;
  }

  // Update stats after a game
  static updateStatsAfterGame(profile: UserProfile, gameResult: {
    score: number;
    won: boolean;
    category: string;
    playTime: number;
    perfectRound?: boolean;
  }): UserProfile {
    const stats = profile.stats;
    const newGamesPlayed = stats.gamesPlayed + 1;
    const newGamesWon = stats.gamesWon + (gameResult.won ? 1 : 0);
    const newTotalScore = stats.totalScore + gameResult.score;
    const newHighestScore = Math.max(stats.highestScore, gameResult.score);
    const newAverageScore = newTotalScore / newGamesPlayed;
    const newWinRate = newGamesWon / newGamesPlayed;
    const newCurrentStreak = gameResult.won ? stats.currentStreak + 1 : 0;
    const newLongestStreak = Math.max(stats.longestStreak, newCurrentStreak);
    const newTotalPlayTime = stats.totalPlayTime + gameResult.playTime;

    const updatedStats: UserStats = {
      ...stats,
      gamesPlayed: newGamesPlayed,
      gamesWon: newGamesWon,
      totalScore: newTotalScore,
      highestScore: newHighestScore,
      averageScore: Math.round(newAverageScore),
      winRate: Number(newWinRate.toFixed(3)),
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      totalPlayTime: newTotalPlayTime,
      favoriteCategory: gameResult.category, // Simplified - in real app, track all categories
      weeklyGames: stats.weeklyGames + 1,
      monthlyGames: stats.monthlyGames + 1
    };

    return {
      ...profile,
      stats: updatedStats,
      lastActive: new Date().toISOString()
    };
  }

  // Create mock profile data
  static createMockProfile(isGuest: boolean = false): UserProfile {
    const baseStats: UserStats = {
      gamesPlayed: isGuest ? 3 : 27,
      gamesWon: isGuest ? 1 : 18,
      totalScore: isGuest ? 850 : 12450,
      highestScore: isGuest ? 420 : 1850,
      averageScore: isGuest ? 283 : 461,
      winRate: isGuest ? 0.333 : 0.667,
      currentStreak: isGuest ? 0 : 3,
      longestStreak: isGuest ? 1 : 7,
      totalPlayTime: isGuest ? 45 : 340,
      favoriteCategory: 'Science',
      weeklyGames: isGuest ? 3 : 8,
      monthlyGames: isGuest ? 3 : 27,
      questionsAnswered: isGuest ? 45 : 540,
      correctAnswers: isGuest ? 28 : 378,
      accuracy: isGuest ? 0.622 : 0.7
    };

    const totalXP = isGuest ? 125 : 2150;
    const levelData = this.calculateLevel(totalXP);

    const achievements: Achievement[] = [
      {
        id: 'first-game',
        name: 'First Steps',
        description: 'Play your first game',
        icon: '🎮',
        category: 'milestone',
        rarity: 'common',
        xpReward: 50,
        unlockedAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'high-scorer',
        name: 'High Scorer',
        description: 'Score 1000 points in a single game',
        icon: '🎯',
        category: 'performance',
        rarity: 'uncommon',
        xpReward: 100,
        unlockedAt: isGuest ? undefined : new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'regular-player',
        name: 'Regular Player',
        description: 'Play 10 games',
        icon: '🏃',
        category: 'milestone',
        rarity: 'common',
        xpReward: 75,
        unlockedAt: isGuest ? undefined : new Date(Date.now() - 86400000 * 5).toISOString(),
        progress: isGuest ? 3 : undefined,
        target: isGuest ? 10 : undefined
      },
      {
        id: 'winner',
        name: 'Victory!',
        description: 'Win your first game',
        icon: '🏆',
        category: 'performance',
        rarity: 'uncommon',
        xpReward: 100,
        unlockedAt: new Date(Date.now() - 86400000 * 1).toISOString()
      },
      {
        id: 'streak-master',
        name: 'Streak Master',
        description: 'Win 5 games in a row',
        icon: '🔥',
        category: 'performance',
        rarity: 'rare',
        xpReward: 200,
        unlockedAt: isGuest ? undefined : new Date(Date.now() - 86400000 * 3).toISOString(),
        progress: isGuest ? 1 : undefined,
        target: isGuest ? 5 : undefined
      },
      {
        id: 'perfectionist',
        name: 'Perfect Round',
        description: 'Answer every question correctly in a round',
        icon: '💎',
        category: 'performance',
        rarity: 'epic',
        xpReward: 300,
        progress: isGuest ? 0 : 2,
        target: 1
      }
    ];

    return {
      id: isGuest ? 'guest-123' : 'user-456',
      username: isGuest ? 'SmartWizard42' : 'TriviaChamp2024',
      displayName: isGuest ? 'Smart Wizard' : 'Trivia Champion',
      email: isGuest ? undefined : 'player@example.com',
      avatarUrl: isGuest ? '🧙‍♂️' : '🏆',
      isGuest,
      createdAt: new Date(Date.now() - 86400000 * (isGuest ? 2 : 30)).toISOString(),
      lastActive: new Date().toISOString(),
      level: levelData.level,
      xp: levelData.xp,
      xpToNextLevel: levelData.xpToNextLevel,
      stats: baseStats,
      achievements,
      settings: {
        theme: 'dark',
        soundEnabled: true,
        animationsEnabled: true,
        notificationsEnabled: true,
        autoJoinNextGame: false,
        showInLeaderboards: true,
        allowFriendRequests: true,
        preferredDifficulty: 'medium',
        language: 'en'
      }
    };
  }

  // Simulate profile updates
  static async updateProfile(profileId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    // In a real app, this would make an API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demo, just return updated mock data
    const currentProfile = this.createMockProfile(profileId.includes('guest'));
    return {
      ...currentProfile,
      ...updates,
      lastActive: new Date().toISOString()
    };
  }

  // Simulate avatar upload
  static async uploadAvatar(file: File): Promise<string> {
    // In a real app, this would upload to cloud storage
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return a mock URL
    return `https://example.com/avatars/${Date.now()}-${file.name}`;
  }
}

export default ProfileService; 
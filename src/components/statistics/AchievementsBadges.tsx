import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Star,
  Award,
  Crown,
  Target,
  Zap,
  Brain,
  Clock,
  Users,
  Medal,
  Flame,
  Shield,
  Sparkles,
  Lock,
  Info,
  Calendar
} from 'lucide-react';
import { statisticsService, type UserStatistics } from '../../services/statisticsService';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'performance' | 'participation' | 'social' | 'special';
  requirement: {
    type: string;
    value: number;
    current?: number;
  };
  unlocked: boolean;
  unlockedAt?: string;
  points: number;
  progress?: number; // 0-100
}

interface AchievementsBadgesProps {
  userId: string;
  userStats: UserStatistics | null;
  showLocked?: boolean;
  compact?: boolean;
  maxDisplay?: number;
}

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'requirement'>[] = [
  // Performance Achievements
  {
    id: 'first_win',
    name: 'First Victory',
    description: 'Win your first trivia game',
    icon: <Trophy className="w-6 h-6" />,
    rarity: 'common',
    category: 'performance',
    points: 50
  },
  {
    id: 'perfect_round',
    name: 'Perfect Round',
    description: 'Answer all questions correctly in a single round',
    icon: <Target className="w-6 h-6" />,
    rarity: 'rare',
    category: 'performance',
    points: 100
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Average response time under 5 seconds',
    icon: <Zap className="w-6 h-6" />,
    rarity: 'epic',
    category: 'performance',
    points: 200
  },
  {
    id: 'trivia_master',
    name: 'Trivia Master',
    description: 'Maintain 90%+ accuracy over 50 games',
    icon: <Brain className="w-6 h-6" />,
    rarity: 'legendary',
    category: 'performance',
    points: 500
  },
  {
    id: 'winning_streak_5',
    name: 'Hot Streak',
    description: 'Win 5 games in a row',
    icon: <Flame className="w-6 h-6" />,
    rarity: 'rare',
    category: 'performance',
    points: 150
  },
  {
    id: 'winning_streak_10',
    name: 'Unstoppable',
    description: 'Win 10 games in a row',
    icon: <Crown className="w-6 h-6" />,
    rarity: 'epic',
    category: 'performance',
    points: 300
  },
  {
    id: 'high_scorer',
    name: 'High Scorer',
    description: 'Score over 1000 points in a single game',
    icon: <Star className="w-6 h-6" />,
    rarity: 'rare',
    category: 'performance',
    points: 100
  },
  {
    id: 'comeback_king',
    name: 'Comeback King',
    description: 'Win after being in last place',
    icon: <Shield className="w-6 h-6" />,
    rarity: 'epic',
    category: 'performance',
    points: 250
  },

  // Participation Achievements
  {
    id: 'games_10',
    name: 'Getting Started',
    description: 'Play 10 trivia games',
    icon: <Medal className="w-6 h-6" />,
    rarity: 'common',
    category: 'participation',
    points: 25
  },
  {
    id: 'games_50',
    name: 'Trivia Enthusiast',
    description: 'Play 50 trivia games',
    icon: <Award className="w-6 h-6" />,
    rarity: 'common',
    category: 'participation',
    points: 75
  },
  {
    id: 'games_100',
    name: 'Trivia Veteran',
    description: 'Play 100 trivia games',
    icon: <Trophy className="w-6 h-6" />,
    rarity: 'rare',
    category: 'participation',
    points: 200
  },
  {
    id: 'games_250',
    name: 'Trivia Legend',
    description: 'Play 250 trivia games',
    icon: <Crown className="w-6 h-6" />,
    rarity: 'epic',
    category: 'participation',
    points: 400
  },
  {
    id: 'weekly_warrior',
    name: 'Weekly Warrior',
    description: 'Play every day for a week',
    icon: <Calendar className="w-6 h-6" />,
    rarity: 'rare',
    category: 'participation',
    points: 150
  },

  // Social Achievements
  {
    id: 'team_captain',
    name: 'Team Captain',
    description: 'Lead a team to victory',
    icon: <Users className="w-6 h-6" />,
    rarity: 'common',
    category: 'social',
    points: 100
  },
  {
    id: 'team_leader',
    name: 'Team Leader',
    description: 'Captain 10 different teams',
    icon: <Crown className="w-6 h-6" />,
    rarity: 'rare',
    category: 'social',
    points: 200
  },
  {
    id: 'team_builder',
    name: 'Team Builder',
    description: 'Play with 25 different teammates',
    icon: <Users className="w-6 h-6" />,
    rarity: 'epic',
    category: 'social',
    points: 250
  },

  // Special Achievements
  {
    id: 'league_master',
    name: 'League Master',
    description: 'Reach Master League',
    icon: <Crown className="w-6 h-6" />,
    rarity: 'legendary',
    category: 'special',
    points: 1000
  },
  {
    id: 'category_expert',
    name: 'Category Expert',
    description: 'Achieve 95%+ accuracy in any category',
    icon: <Brain className="w-6 h-6" />,
    rarity: 'epic',
    category: 'special',
    points: 300
  },
  {
    id: 'lightning_fast',
    name: 'Lightning Fast',
    description: 'Answer a question in under 2 seconds',
    icon: <Zap className="w-6 h-6" />,
    rarity: 'rare',
    category: 'special',
    points: 150
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete a game with 100% accuracy',
    icon: <Sparkles className="w-6 h-6" />,
    rarity: 'epic',
    category: 'special',
    points: 200
  }
];

const RARITY_CONFIGS = {
  common: {
    bgGradient: 'from-gray-100 to-gray-200',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-800',
    badgeColor: 'bg-gray-500',
    glowColor: 'shadow-gray-200'
  },
  rare: {
    bgGradient: 'from-blue-100 to-blue-200',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-900',
    badgeColor: 'bg-blue-500',
    glowColor: 'shadow-blue-200'
  },
  epic: {
    bgGradient: 'from-purple-100 to-purple-200',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-900',
    badgeColor: 'bg-purple-500',
    glowColor: 'shadow-purple-200'
  },
  legendary: {
    bgGradient: 'from-yellow-100 to-orange-200',
    borderColor: 'border-yellow-400',
    textColor: 'text-orange-900',
    badgeColor: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    glowColor: 'shadow-yellow-300'
  }
};

export function AchievementsBadges({
  userId,
  userStats,
  showLocked = true,
  compact = false,
  maxDisplay
}: AchievementsBadgesProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | Achievement['category']>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (userStats) {
      const processedAchievements = ACHIEVEMENT_DEFINITIONS.map(achievementDef => {
        const { unlocked, requirement, progress } = checkAchievementStatus(achievementDef, userStats);
        
        return {
          ...achievementDef,
          unlocked,
          requirement,
          progress,
          unlockedAt: unlocked ? new Date().toISOString() : undefined // Mock unlock date
        };
      });

      setAchievements(processedAchievements);
    }
  }, [userStats]);

  const checkAchievementStatus = (
    achievement: Omit<Achievement, 'unlocked' | 'unlockedAt' | 'requirement'>,
    stats: UserStatistics
  ): { unlocked: boolean; requirement: Achievement['requirement']; progress: number } => {
    let unlocked = false;
    let current = 0;
    let target = 0;
    let requirementType = '';

    switch (achievement.id) {
      case 'first_win':
        current = stats.total_wins;
        target = 1;
        requirementType = 'wins';
        unlocked = stats.total_wins >= 1;
        break;
      
      case 'perfect_round':
        current = stats.overall_accuracy || 0;
        target = 100;
        requirementType = 'accuracy';
        unlocked = (stats.overall_accuracy || 0) === 100;
        break;
      
      case 'speed_demon':
        current = stats.average_response_time || 0;
        target = 5;
        requirementType = 'response_time';
        unlocked = (stats.average_response_time || Infinity) < 5;
        break;
      
      case 'trivia_master':
        current = Math.min(stats.total_games_played, 50);
        target = 50;
        requirementType = 'games_with_accuracy';
        unlocked = stats.total_games_played >= 50 && (stats.overall_accuracy || 0) >= 90;
        break;
      
      case 'winning_streak_5':
        current = stats.current_win_streak;
        target = 5;
        requirementType = 'win_streak';
        unlocked = stats.longest_win_streak >= 5;
        break;
      
      case 'winning_streak_10':
        current = stats.current_win_streak;
        target = 10;
        requirementType = 'win_streak';
        unlocked = stats.longest_win_streak >= 10;
        break;
      
      case 'high_scorer':
        current = stats.highest_score;
        target = 1000;
        requirementType = 'high_score';
        unlocked = stats.highest_score >= 1000;
        break;
      
      case 'games_10':
        current = stats.total_games_played;
        target = 10;
        requirementType = 'games_played';
        unlocked = stats.total_games_played >= 10;
        break;
      
      case 'games_50':
        current = stats.total_games_played;
        target = 50;
        requirementType = 'games_played';
        unlocked = stats.total_games_played >= 50;
        break;
      
      case 'games_100':
        current = stats.total_games_played;
        target = 100;
        requirementType = 'games_played';
        unlocked = stats.total_games_played >= 100;
        break;
      
      case 'games_250':
        current = stats.total_games_played;
        target = 250;
        requirementType = 'games_played';
        unlocked = stats.total_games_played >= 250;
        break;
      
      case 'team_captain':
        current = stats.teams_captained;
        target = 1;
        requirementType = 'teams_captained';
        unlocked = stats.teams_captained >= 1;
        break;
      
      case 'team_leader':
        current = stats.teams_captained;
        target = 10;
        requirementType = 'teams_captained';
        unlocked = stats.teams_captained >= 10;
        break;
      
      case 'league_master':
        current = stats.current_league === 'Master' ? 1 : 0;
        target = 1;
        requirementType = 'league';
        unlocked = stats.current_league === 'Master';
        break;
      
      case 'lightning_fast':
        current = stats.fastest_ever_response || 0;
        target = 2;
        requirementType = 'fastest_response';
        unlocked = (stats.fastest_ever_response || Infinity) < 2;
        break;
      
      case 'perfectionist':
        current = stats.overall_accuracy || 0;
        target = 100;
        requirementType = 'perfect_game';
        unlocked = (stats.overall_accuracy || 0) === 100;
        break;

      default:
        current = 0;
        target = 1;
        requirementType = 'unknown';
        unlocked = false;
    }

    const progress = target > 0 ? Math.min((current / target) * 100, 100) : 0;

    return {
      unlocked,
      requirement: {
        type: requirementType,
        value: target,
        current
      },
      progress
    };
  };

  const filteredAchievements = achievements.filter(achievement => {
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) {
      return false;
    }
    if (!showLocked && !achievement.unlocked) {
      return false;
    }
    return true;
  });

  const displayedAchievements = maxDisplay 
    ? filteredAchievements.slice(0, maxDisplay)
    : filteredAchievements;

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalPoints = achievements.filter(a => a.unlocked).reduce((sum, a) => sum + a.points, 0);

  const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
    const rarityConfig = RARITY_CONFIGS[achievement.rarity];
    
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative cursor-pointer transition-all duration-300 ${
          achievement.unlocked 
            ? `bg-gradient-to-br ${rarityConfig.bgGradient} border-2 ${rarityConfig.borderColor} ${rarityConfig.glowColor} shadow-lg`
            : 'bg-gray-100 border-2 border-gray-200 opacity-60'
        } rounded-xl p-4 ${compact ? 'p-3' : 'p-4'}`}
        onClick={() => {
          setSelectedAchievement(achievement);
          setShowModal(true);
        }}
      >
        {/* Rarity Badge */}
        <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold text-white ${rarityConfig.badgeColor}`}>
          {achievement.rarity.toUpperCase()}
        </div>

        {/* Lock Icon for Locked Achievements */}
        {!achievement.unlocked && (
          <div className="absolute top-2 left-2 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
            <Lock className="w-3 h-3 text-white" />
          </div>
        )}

        {/* Achievement Icon */}
        <div className={`mb-3 ${achievement.unlocked ? rarityConfig.textColor : 'text-gray-400'} text-center`}>
          {achievement.icon}
        </div>

        {/* Achievement Name */}
        <h3 className={`font-bold text-center mb-2 ${compact ? 'text-sm' : 'text-lg'} ${
          achievement.unlocked ? rarityConfig.textColor : 'text-gray-500'
        }`}>
          {achievement.name}
        </h3>

        {/* Points */}
        <div className="text-center">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            achievement.unlocked 
              ? 'bg-energy-yellow text-gray-900'
              : 'bg-gray-300 text-gray-600'
          }`}>
            {achievement.points} XP
          </span>
        </div>

        {/* Progress Bar for Unlocked Achievements */}
        {!achievement.unlocked && achievement.progress !== undefined && achievement.progress > 0 && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-electric-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${achievement.progress}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <div className="text-xs text-gray-600 text-center mt-1">
              {Math.round(achievement.progress)}% complete
            </div>
          </div>
        )}

        {/* Unlock Animation */}
        {achievement.unlocked && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 1] }}
            transition={{ duration: 0.6 }}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Sparkles className="w-8 h-8 text-energy-yellow" />
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const AchievementModal = ({ achievement }: { achievement: Achievement }) => (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setShowModal(false)}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`bg-gradient-to-br ${RARITY_CONFIGS[achievement.rarity].bgGradient} rounded-t-2xl p-6 text-center`}>
          <div className="w-16 h-16 mx-auto mb-4 text-4xl bg-white rounded-full flex items-center justify-center shadow-lg">
            {achievement.icon}
          </div>
          <h2 className={`text-2xl font-bold ${RARITY_CONFIGS[achievement.rarity].textColor} mb-2`}>
            {achievement.name}
          </h2>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold text-white ${RARITY_CONFIGS[achievement.rarity].badgeColor}`}>
            {achievement.rarity.toUpperCase()}
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 text-center mb-4">{achievement.description}</p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Requirement
            </h4>
            <div className="text-sm text-gray-600">
              {achievement.requirement.type}: {achievement.requirement.current || 0} / {achievement.requirement.value}
            </div>
            
            {!achievement.unlocked && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-electric-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${achievement.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-2xl font-bold text-energy-yellow">{achievement.points}</div>
              <div className="text-xs text-gray-600">XP Points</div>
            </div>
            
            <div className="text-center">
              <div className={`text-lg font-bold ${achievement.unlocked ? 'text-energy-green' : 'text-gray-400'}`}>
                {achievement.unlocked ? '✓ Unlocked' : '🔒 Locked'}
              </div>
              {achievement.unlocked && achievement.unlockedAt && (
                <div className="text-xs text-gray-600">
                  {new Date(achievement.unlockedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setShowModal(false)}
            className="w-full mt-4 py-2 bg-electric-500 text-white rounded-lg hover:bg-electric-600 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-electric-700 mb-2 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-energy-yellow" />
              Achievements & Badges
            </h2>
            <p className="text-gray-600">
              Unlock achievements and earn XP by playing trivia games
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-electric-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-electric-600">{unlockedCount}</div>
              <div className="text-xs text-gray-600">Unlocked</div>
            </div>
            <div className="bg-energy-yellow/20 rounded-lg p-3">
              <div className="text-2xl font-bold text-orange-600">{totalPoints}</div>
              <div className="text-xs text-gray-600">Total XP</div>
            </div>
            <div className="bg-plasma-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-plasma-600">{Math.round((unlockedCount / achievements.length) * 100)}%</div>
              <div className="text-xs text-gray-600">Complete</div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mt-4">
          {['all', 'performance', 'participation', 'social', 'special'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-electric-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className={`grid gap-4 ${
        compact 
          ? 'grid-cols-3 md:grid-cols-6 lg:grid-cols-8' 
          : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
      }`}>
        {displayedAchievements.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
          >
            <AchievementCard achievement={achievement} />
          </motion.div>
        ))}
      </div>

      {/* Show More Button */}
      {maxDisplay && filteredAchievements.length > maxDisplay && (
        <div className="text-center">
          <button className="px-6 py-3 bg-electric-500 text-white rounded-lg hover:bg-electric-600 transition-colors font-medium">
            Show All {filteredAchievements.length} Achievements
          </button>
        </div>
      )}

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-xl">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No achievements found</h3>
          <p className="text-gray-500">
            {selectedCategory !== 'all' 
              ? `No ${selectedCategory} achievements match your filters.`
              : 'Start playing to unlock your first achievements!'}
          </p>
        </div>
      )}

      {/* Achievement Details Modal */}
      <AnimatePresence>
        {showModal && selectedAchievement && (
          <AchievementModal achievement={selectedAchievement} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default AchievementsBadges;
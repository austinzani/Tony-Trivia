import React from 'react';
import { motion } from 'framer-motion';
import type { UserStats, Achievement } from '../types/profile';

interface StatsDisplayProps {
  stats: UserStats;
  achievements: Achievement[];
  level: number;
  xp: number;
  xpToNextLevel: number;
}

const ProgressBar: React.FC<{
  label: string;
  value: number;
  maxValue: number;
  color: 'electric' | 'plasma' | 'success' | 'warning';
  showPercentage?: boolean;
  icon?: string;
}> = ({ label, value, maxValue, color, showPercentage = true, icon }) => {
  const percentage = Math.min((value / maxValue) * 100, 100);

  const colorClasses = {
    electric: 'from-electric-400 to-electric-600',
    plasma: 'from-plasma-400 to-plasma-600',
    success: 'from-green-400 to-green-600',
    warning: 'from-yellow-400 to-yellow-600',
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {label}
        </span>
        {showPercentage && (
          <span className="text-sm font-bold text-gray-600">
            {value}/{maxValue}
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${colorClasses[color]} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: string;
  color: 'electric' | 'plasma' | 'success' | 'warning';
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => {
  const colorClasses = {
    electric: 'from-electric-400 to-electric-600',
    plasma: 'from-plasma-400 to-plasma-600',
    success: 'from-green-400 to-green-600',
    warning: 'from-yellow-400 to-yellow-600',
  };

  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div
          className={`w-10 h-10 rounded-lg bg-gradient-to-r ${colorClasses[color]} flex items-center justify-center text-white text-xl`}
        >
          {icon}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-800">{value}</div>
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
        </div>
      </div>
      <div className="text-sm font-medium text-gray-600">{title}</div>
    </motion.div>
  );
};

const AchievementBadge: React.FC<{
  achievement: Achievement;
  isUnlocked: boolean;
}> = ({ achievement, isUnlocked }) => {
  const rarityColors = {
    common: 'from-gray-400 to-gray-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-yellow-600',
  };

  return (
    <motion.div
      className={`relative w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
        isUnlocked
          ? `bg-gradient-to-r ${rarityColors[achievement.rarity]} text-white shadow-lg`
          : 'bg-gray-200 text-gray-400'
      }`}
      whileHover={{ scale: 1.1 }}
      transition={{ type: 'spring', stiffness: 300 }}
      title={`${achievement.name}: ${achievement.description}`}
    >
      {achievement.icon}
      {isUnlocked && (
        <motion.div
          className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          ✓
        </motion.div>
      )}
    </motion.div>
  );
};

const LeagueBadge: React.FC<{ league: UserStats['league']; rank?: number }> = ({
  league,
  rank,
}) => {
  const leagueConfig = {
    Bronze: { color: 'from-amber-600 to-amber-800', icon: '🥉' },
    Silver: { color: 'from-gray-400 to-gray-600', icon: '🥈' },
    Gold: { color: 'from-yellow-400 to-yellow-600', icon: '🥇' },
    Platinum: { color: 'from-cyan-400 to-cyan-600', icon: '💎' },
    Diamond: { color: 'from-blue-400 to-blue-600', icon: '💎' },
    Master: { color: 'from-purple-400 to-purple-600', icon: '👑' },
  };

  const config = leagueConfig[league];

  return (
    <motion.div
      className={`bg-gradient-to-r ${config.color} rounded-xl p-4 text-white text-center shadow-lg`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="text-3xl mb-2">{config.icon}</div>
      <div className="font-bold text-lg">{league}</div>
      {rank && <div className="text-sm opacity-90">Rank #{rank}</div>}
    </motion.div>
  );
};

export default function StatsDisplay({
  stats,
  achievements,
  level,
  xp,
  xpToNextLevel,
}: StatsDisplayProps) {
  const unlockedAchievements = achievements.filter(a => a.unlockedAt);
  const lockedAchievements = achievements.filter(a => !a.unlockedAt);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Level and XP Progress */}
      <motion.div
        variants={itemVariants}
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold bg-gradient-to-r from-electric-600 to-plasma-600 bg-clip-text text-transparent">
            Level {level}
          </h3>
          <div className="text-right">
            <div className="text-sm text-gray-600">XP to Next Level</div>
            <div className="text-lg font-bold text-plasma-600">
              {xpToNextLevel}
            </div>
          </div>
        </div>
        <ProgressBar
          label="Experience Points"
          value={xp}
          maxValue={xp + xpToNextLevel}
          color="electric"
          icon="⚡"
        />
      </motion.div>

      {/* League and Ranking */}
      <motion.div variants={itemVariants}>
        <h3 className="text-xl font-bold text-electric-700 mb-4">
          🏆 League & Ranking
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <LeagueBadge league={stats.league} rank={stats.leagueRank} />
          {stats.globalRank && (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/20 shadow-lg text-center">
              <div className="text-2xl mb-2">🌍</div>
              <div className="font-bold text-lg text-gray-800">Global Rank</div>
              <div className="text-2xl font-bold text-electric-600">
                #{stats.globalRank}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Key Stats Grid */}
      <motion.div variants={itemVariants}>
        <h3 className="text-xl font-bold text-electric-700 mb-4">
          📊 Game Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Games Played"
            value={stats.gamesPlayed}
            icon="🎮"
            color="electric"
          />
          <StatCard
            title="Win Rate"
            value={`${Math.round(stats.winRate * 100)}%`}
            icon="🏆"
            color="success"
          />
          <StatCard
            title="High Score"
            value={stats.highestScore}
            icon="🎯"
            color="plasma"
          />
          <StatCard
            title="Current Streak"
            value={stats.currentStreak}
            icon="🔥"
            color="warning"
            subtitle={`Best: ${stats.longestStreak}`}
          />
        </div>
      </motion.div>

      {/* Detailed Progress Bars */}
      <motion.div
        variants={itemVariants}
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
      >
        <h3 className="text-xl font-bold text-electric-700 mb-6">
          📈 Progress Tracking
        </h3>
        <div className="space-y-6">
          <ProgressBar
            label="Weekly Games"
            value={stats.weeklyGames}
            maxValue={21} // 3 games per day target
            color="electric"
            icon="📅"
          />
          <ProgressBar
            label="Monthly Games"
            value={stats.monthlyGames}
            maxValue={90} // 3 games per day target
            color="plasma"
            icon="📆"
          />
          <ProgressBar
            label="Average Score Progress"
            value={stats.averageScore}
            maxValue={100}
            color="success"
            icon="📊"
            showPercentage={false}
          />
        </div>
      </motion.div>

      {/* Achievements Section */}
      <motion.div variants={itemVariants}>
        <h3 className="text-xl font-bold text-electric-700 mb-4">
          🏅 Achievements ({unlockedAchievements.length}/{achievements.length})
        </h3>

        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-3">
              ✨ Unlocked
            </h4>
            <div className="flex flex-wrap gap-3">
              {unlockedAchievements.map(achievement => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Locked Achievements (Preview) */}
        {lockedAchievements.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-700 mb-3">
              🔒 Locked
            </h4>
            <div className="flex flex-wrap gap-3">
              {lockedAchievements.slice(0, 8).map(achievement => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={false}
                />
              ))}
              {lockedAchievements.length > 8 && (
                <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                  +{lockedAchievements.length - 8}
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Additional Stats */}
      <motion.div
        variants={itemVariants}
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl"
      >
        <h3 className="text-xl font-bold text-electric-700 mb-4">
          ⏱️ Time & Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl mb-2">⏰</div>
            <div className="text-lg font-bold text-gray-800">
              {Math.round(stats.totalPlayTime / 60)}h
            </div>
            <div className="text-sm text-gray-600">Total Play Time</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-lg font-bold text-gray-800">
              {stats.averageScore}
            </div>
            <div className="text-sm text-gray-600">Average Score</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-lg font-bold text-gray-800">
              {stats.favoriteCategory || 'Mixed'}
            </div>
            <div className="text-sm text-gray-600">Favorite Category</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Star, Zap } from 'lucide-react';

interface MobileScoreDisplayProps {
  score: number;
  previousScore?: number;
  rank?: number;
  totalPlayers?: number;
  showAnimation?: boolean;
  variant?: 'compact' | 'full' | 'leaderboard';
  className?: string;
}

const MobileScoreDisplay: React.FC<MobileScoreDisplayProps> = ({
  score,
  previousScore,
  rank,
  totalPlayers,
  showAnimation = true,
  variant = 'full',
  className = '',
}) => {
  const scoreChange = previousScore !== undefined ? score - previousScore : 0;
  const hasImproved = scoreChange > 0;

  const renderCompact = () => (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="bg-gradient-to-r from-electric-500 to-plasma-500 text-white px-3 py-1.5 rounded-full font-bold text-sm sm:text-base">
        {score.toLocaleString()}
      </div>
      {scoreChange !== 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`text-xs sm:text-sm font-semibold ${
            hasImproved ? 'text-victory' : 'text-defeat'
          }`}
        >
          {hasImproved ? '+' : ''}{scoreChange}
        </motion.div>
      )}
    </div>
  );

  const renderFull = () => (
    <motion.div
      initial={showAnimation ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-electric-500 to-plasma-600 rounded-card p-4 sm:p-6 text-white shadow-electric-lg ${className}`}
    >
      {/* Score Label */}
      <div className="text-xs sm:text-sm font-medium opacity-90 mb-1">
        Your Score
      </div>

      {/* Main Score */}
      <div className="flex items-baseline gap-3 mb-3">
        <motion.div
          key={score}
          initial={showAnimation ? { scale: 0.8 } : false}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-3xl sm:text-display-lg font-black"
        >
          {score.toLocaleString()}
        </motion.div>
        
        {scoreChange !== 0 && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center gap-1 text-sm sm:text-base font-semibold ${
              hasImproved ? 'text-energy-green' : 'text-energy-red'
            }`}
          >
            <TrendingUp className={`w-4 h-4 ${hasImproved ? '' : 'rotate-180'}`} />
            {hasImproved ? '+' : ''}{scoreChange}
          </motion.div>
        )}
      </div>

      {/* Rank */}
      {rank && totalPlayers && (
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <Trophy className="w-4 h-4 text-energy-yellow" />
          <span className="font-medium">
            Rank #{rank} of {totalPlayers}
          </span>
        </div>
      )}

      {/* Achievement Badges */}
      {score >= 1000 && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="absolute -top-2 -right-2"
        >
          <div className="bg-energy-yellow text-electric-900 rounded-full p-2 shadow-lg">
            <Star className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const renderLeaderboard = () => (
    <motion.div
      initial={showAnimation ? { opacity: 0, x: -20 } : false}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 5 }}
      className={`flex items-center justify-between p-3 sm:p-4 bg-white rounded-game border-2 ${
        rank === 1 ? 'border-energy-yellow bg-gradient-to-r from-energy-yellow/10 to-transparent' :
        rank === 2 ? 'border-gray-300 bg-gradient-to-r from-gray-200/50 to-transparent' :
        rank === 3 ? 'border-orange-400 bg-gradient-to-r from-orange-100/50 to-transparent' :
        'border-gray-200'
      } ${className}`}
    >
      <div className="flex items-center gap-3">
        {/* Rank Badge */}
        <div className={`
          w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold
          ${rank === 1 ? 'bg-energy-yellow text-electric-900' :
            rank === 2 ? 'bg-gray-300 text-gray-700' :
            rank === 3 ? 'bg-orange-400 text-white' :
            'bg-gray-100 text-gray-600'}
        `}>
          {rank}
        </div>

        {/* Score */}
        <div>
          <div className="font-semibold text-gray-900 text-sm sm:text-base">
            {score.toLocaleString()} pts
          </div>
          {scoreChange !== 0 && (
            <div className={`text-xs font-medium ${
              hasImproved ? 'text-victory' : 'text-defeat'
            }`}>
              {hasImproved ? '+' : ''}{scoreChange}
            </div>
          )}
        </div>
      </div>

      {/* Special Badges */}
      <div className="flex items-center gap-2">
        {rank === 1 && <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-energy-yellow" />}
        {scoreChange > 100 && <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-electric-500" />}
      </div>
    </motion.div>
  );

  switch (variant) {
    case 'compact':
      return renderCompact();
    case 'leaderboard':
      return renderLeaderboard();
    case 'full':
    default:
      return renderFull();
  }
};

export default MobileScoreDisplay;
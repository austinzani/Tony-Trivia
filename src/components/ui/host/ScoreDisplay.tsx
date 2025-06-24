import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface ScoreDisplayProps {
  score: number;
  previousScore?: number;
  teamName?: string;
  position?: number;
  variant?: 'default' | 'compact' | 'large' | 'leaderboard';
  showTrend?: boolean;
  animate?: boolean;
  className?: string;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  previousScore,
  teamName,
  position,
  variant = 'default',
  showTrend = true,
  animate = true,
  className,
}) => {
  const scoreDiff = previousScore !== undefined ? score - previousScore : 0;
  const trend = scoreDiff > 0 ? 'up' : scoreDiff < 0 ? 'down' : 'neutral';

  const variants = {
    default: {
      container: 'bg-gradient-to-r from-electric-500 to-plasma-600 text-white p-4 rounded-game shadow-electric',
      score: 'text-display-lg',
      team: 'text-sm opacity-90',
    },
    compact: {
      container: 'bg-white border-2 border-electric-200 text-electric-700 p-3 rounded-lg',
      score: 'text-xl',
      team: 'text-xs',
    },
    large: {
      container: 'bg-gradient-to-br from-electric-600 via-plasma-600 to-electric-700 text-white p-8 rounded-xl shadow-electric-lg',
      score: 'text-display-xl',
      team: 'text-lg',
    },
    leaderboard: {
      container: cn(
        'bg-white p-3 rounded-lg border-2 transition-all',
        position === 1 ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50' : 'border-gray-200'
      ),
      score: 'text-2xl',
      team: 'text-sm',
    },
  };

  const trendIcons = {
    up: <TrendingUp className="w-5 h-5 text-energy-green" />,
    down: <TrendingDown className="w-5 h-5 text-energy-red" />,
    neutral: <Minus className="w-5 h-5 text-gray-400" />,
  };

  const positionColors = {
    1: 'bg-yellow-500 text-white',
    2: 'bg-gray-400 text-white',
    3: 'bg-orange-600 text-white',
  };

  return (
    <motion.div
      className={cn(
        'text-center relative',
        variants[variant].container,
        className
      )}
      initial={animate ? { scale: 0.9, opacity: 0 } : undefined}
      animate={animate ? { scale: 1, opacity: 1 } : undefined}
      transition={{ duration: 0.3 }}
    >
      {position && variant === 'leaderboard' && (
        <div
          className={cn(
            'absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
            positionColors[position as keyof typeof positionColors] || 'bg-electric-200 text-electric-700'
          )}
        >
          {position}
        </div>
      )}

      {teamName && (
        <div className={cn('font-medium mb-1', variants[variant].team)}>
          {teamName}
        </div>
      )}

      <motion.div
        className={cn('font-bold font-mono', variants[variant].score)}
        animate={animate && scoreDiff !== 0 ? { scale: [1, 1.2, 1] } : undefined}
        transition={{ duration: 0.6 }}
      >
        {score.toLocaleString()}
      </motion.div>

      {showTrend && scoreDiff !== 0 && (
        <motion.div
          className="flex items-center justify-center gap-1 mt-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {trendIcons[trend]}
          <span
            className={cn(
              'text-sm font-semibold',
              trend === 'up' ? 'text-energy-green' : 'text-energy-red'
            )}
          >
            {scoreDiff > 0 ? '+' : ''}{scoreDiff}
          </span>
        </motion.div>
      )}

      {variant === 'large' && (
        <Trophy className="absolute top-4 right-4 w-8 h-8 opacity-20" />
      )}
    </motion.div>
  );
};

export default ScoreDisplay;
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../utils/cn';

export interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'default' | 'gradient' | 'striped' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = false,
  variant = 'default',
  size = 'md',
  animate = true,
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const containerSizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const fillVariants = {
    default: 'bg-electric-500',
    gradient: 'bg-gradient-to-r from-electric-500 to-energy-green',
    striped: cn(
      'bg-electric-500',
      'bg-[length:1rem_1rem]',
      'bg-gradient-to-r from-transparent via-white/20 to-transparent',
      animate && 'animate-[slide_1s_linear_infinite]'
    ),
    success: 'bg-victory',
    warning: 'bg-energy-yellow',
    danger: 'bg-energy-red',
  };

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          {showPercentage && (
            <span className="text-sm font-semibold text-gray-900">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div
        className={cn(
          'w-full bg-gray-200 rounded-full overflow-hidden',
          containerSizes[size]
        )}
      >
        <motion.div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            fillVariants[variant]
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={animate ? { duration: 0.5, ease: 'easeOut' } : { duration: 0 }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
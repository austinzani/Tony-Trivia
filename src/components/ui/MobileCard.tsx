import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface MobileCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: 'default' | 'game' | 'team' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  active?: boolean;
  className?: string;
}

const MobileCard: React.FC<MobileCardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  interactive = false,
  active = false,
  className = '',
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'default':
        return 'bg-white border border-gray-200';
      case 'game':
        return 'bg-white border border-electric-100 shadow-game';
      case 'team':
        return 'bg-gradient-to-br from-white to-blue-50/30 border-2 border-transparent';
      case 'elevated':
        return 'bg-white shadow-game-hover';
      default:
        return '';
    }
  };

  const getPaddingClasses = () => {
    switch (padding) {
      case 'none':
        return '';
      case 'sm':
        return 'p-3 sm:p-4';
      case 'md':
        return 'p-4 sm:p-6';
      case 'lg':
        return 'p-6 sm:p-8';
      default:
        return '';
    }
  };

  const activeClasses = active
    ? 'border-electric-500 shadow-[0_0_0_2px_rgba(59,130,246,0.2)]'
    : '';

  const interactiveClasses = interactive
    ? 'cursor-pointer transition-all duration-200 hover:shadow-game-hover active:scale-[0.98]'
    : '';

  return (
    <motion.div
      {...props}
      className={`
        ${getVariantClasses()}
        ${getPaddingClasses()}
        ${activeClasses}
        ${interactiveClasses}
        rounded-card
        ${className}
      `}
      initial={interactive ? { opacity: 0, y: 20 } : false}
      animate={interactive ? { opacity: 1, y: 0 } : false}
      whileHover={interactive ? { y: -2 } : {}}
      whileTap={interactive ? { scale: 0.98 } : {}}
    >
      {children}
    </motion.div>
  );
};

export default MobileCard;
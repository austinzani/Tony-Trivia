import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface BadgeProps extends HTMLMotionProps<"span"> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'new' | 'victory';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  animate?: boolean;
  children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  icon: Icon,
  animate = false,
  className,
  children,
  ...props
}) => {
  const baseStyles = cn(
    'inline-flex items-center gap-1.5 font-semibold rounded-full',
    'text-xs uppercase tracking-wider'
  );

  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-electric-100 text-electric-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    new: cn(
      'bg-energy-yellow text-electric-900',
      animate && 'animate-badge-glow'
    ),
    victory: 'bg-victory text-white',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[0.625rem]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <motion.span
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      initial={animate ? { opacity: 0, scale: 0.5, rotate: -10 } : undefined}
      animate={animate ? { opacity: 1, scale: 1, rotate: 0 } : undefined}
      transition={{ duration: 0.6, type: 'spring', stiffness: 300 }}
      {...props}
    >
      {Icon && <Icon className={iconSizes[size]} />}
      {children}
    </motion.span>
  );
};

export default Badge;
import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'size' | 'variant'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon: Icon,
      iconPosition = 'left',
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center font-semibold transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-game',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      fullWidth && 'w-full'
    );

    const variants = {
      primary: cn(
        'bg-gradient-to-r from-electric-500 to-plasma-500 text-white',
        'hover:from-electric-600 hover:to-plasma-600',
        'focus:ring-electric-500 shadow-electric hover:shadow-electric-lg',
        'active:transform active:scale-[0.98]'
      ),
      secondary: cn(
        'bg-white text-electric-700 border-2 border-electric-200',
        'hover:bg-electric-50 hover:border-electric-400',
        'focus:ring-electric-500 shadow-sm hover:shadow-md'
      ),
      danger: cn(
        'bg-energy-red text-white',
        'hover:bg-red-600',
        'focus:ring-red-500 shadow-sm hover:shadow-md'
      ),
      success: cn(
        'bg-victory text-white',
        'hover:bg-green-600',
        'focus:ring-green-500 shadow-sm hover:shadow-md'
      ),
      warning: cn(
        'bg-energy-yellow text-electric-900',
        'hover:bg-yellow-400',
        'focus:ring-yellow-500 shadow-yellow'
      ),
      ghost: cn(
        'bg-transparent text-electric-600',
        'hover:bg-electric-50',
        'focus:ring-electric-500'
      ),
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
      xl: 'px-8 py-4 text-xl gap-3',
    };

    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-7 h-7',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        whileHover={{ y: -2 }}
        whileTap={{ y: 0 }}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {loading ? (
          <>
            <motion.div
              className={cn('rounded-full border-2 border-current border-t-transparent', iconSizes[size])}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {Icon && iconPosition === 'left' && (
              <Icon className={iconSizes[size]} />
            )}
            {children}
            {Icon && iconPosition === 'right' && (
              <Icon className={iconSizes[size]} />
            )}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
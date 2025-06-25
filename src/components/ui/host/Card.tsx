import React from 'react';
import { motion } from 'framer-motion';
import { ComponentProps } from 'react';
import { cn } from '../../../utils/cn';

export interface CardProps extends ComponentProps<typeof motion.div> {
  variant?: 'default' | 'game' | 'team' | 'elevated' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  active?: boolean;
  children: React.ReactNode;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hover = false,
      active = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = 'rounded-card transition-all duration-300';

    const variants = {
      default: cn(
        'bg-white border border-gray-200',
        hover && 'hover:shadow-md hover:border-electric-300'
      ),
      game: cn(
        'bg-white shadow-game border border-electric-100',
        hover && 'hover:shadow-game-hover hover:transform hover:-translate-y-1 hover:border-electric-300',
        active && 'border-electric-500 shadow-electric'
      ),
      team: cn(
        'bg-gradient-to-br from-white to-blue-50 border-2',
        active ? 'border-electric-500 bg-gradient-to-br from-electric-50 to-blue-100' : 'border-transparent'
      ),
      elevated: cn(
        'bg-white shadow-lg',
        hover && 'hover:shadow-xl'
      ),
      gradient: cn(
        'bg-gradient-to-br from-electric-500 to-plasma-600 text-white shadow-electric',
        hover && 'hover:shadow-electric-lg'
      ),
    };

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-6',
      lg: 'p-8',
      xl: 'p-10',
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          paddings[padding],
          className
        )}
        whileHover={hover ? { scale: 1.02 } : undefined}
        transition={{ duration: 0.2 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// Card Header Component
export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn('mb-4 pb-4 border-b border-gray-200', className)}>
    {children}
  </div>
);

// Card Title Component
export const CardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <h3 className={cn('text-xl font-bold text-gray-900', className)}>
    {children}
  </h3>
);

// Card Content Component
export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn('space-y-4', className)}>{children}</div>
);

// Card Footer Component
export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn('mt-4 pt-4 border-t border-gray-200', className)}>
    {children}
  </div>
);

export default Card;
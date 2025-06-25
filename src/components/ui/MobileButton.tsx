import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MobileButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'full';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const MobileButton: React.FC<MobileButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-electric-500 to-plasma-500 text-white shadow-electric hover:shadow-electric-lg';
      case 'secondary':
        return 'bg-white text-electric-700 border-2 border-electric-200 hover:border-electric-400 hover:shadow-game';
      case 'danger':
        return 'bg-energy-red text-white shadow-md hover:shadow-lg';
      case 'success':
        return 'bg-victory text-white shadow-md hover:shadow-lg';
      default:
        return '';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-2 text-sm min-h-[36px]';
      case 'md':
        return 'px-4 py-2.5 text-base min-h-[44px]';
      case 'lg':
        return 'px-6 py-3 text-lg min-h-[52px]';
      case 'full':
        return 'px-6 py-3 text-lg min-h-[52px] w-full';
      default:
        return '';
    }
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      {...props}
      disabled={isDisabled}
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${fullWidth || size === 'full' ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        relative inline-flex items-center justify-center
        font-semibold rounded-game
        transition-all duration-200
        touch-feedback
        focus:outline-none focus:ring-4 focus:ring-electric-500/30
        ${className}
      `}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      aria-disabled={isDisabled}
      aria-busy={loading}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
        </div>
      )}
      
      <span className={`inline-flex items-center gap-2 ${loading ? 'invisible' : ''}`}>
        {Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
        {children}
        {Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
      </span>
    </motion.button>
  );
};

export default MobileButton;
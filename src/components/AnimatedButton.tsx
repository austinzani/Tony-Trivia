import { motion } from 'framer-motion';
import { ReactNode, forwardRef, ComponentProps } from 'react';
import { clsx } from 'clsx';

export interface AnimatedButtonProps
  extends Omit<ComponentProps<typeof motion.button>, 'children'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
}

const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      fullWidth = false,
      icon,
      iconPosition = 'left',
      className,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    // Base styles for all buttons
    const baseStyles = clsx(
      'relative inline-flex items-center justify-center',
      'font-medium rounded-game transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'overflow-hidden',
      {
        'w-full': fullWidth,
        'cursor-not-allowed opacity-60': isDisabled,
        'cursor-pointer': !isDisabled,
      }
    );

    // Variant-specific styles
    const variantStyles = {
      primary: clsx(
        'bg-gradient-to-br from-electric-500 to-plasma-500',
        'text-white shadow-electric',
        'hover:shadow-electric-lg focus:ring-electric-500',
        'border border-transparent',
        !isDisabled && 'hover:from-electric-600 hover:to-plasma-600'
      ),
      secondary: clsx(
        'bg-white/90 text-electric-700 border-2 border-electric-200',
        'hover:bg-white hover:border-electric-400 hover:shadow-game',
        'focus:ring-electric-500',
        !isDisabled && 'hover:text-electric-800'
      ),
      ghost: clsx(
        'bg-transparent text-electric-600 border border-transparent',
        'hover:bg-electric-50 hover:text-electric-700',
        'focus:ring-electric-500',
        'shadow-none'
      ),
      danger: clsx(
        'bg-gradient-to-br from-energy-red to-defeat',
        'text-white shadow-[0_4px_12px_rgba(239,71,111,0.3)]',
        'hover:shadow-[0_6px_16px_rgba(239,71,111,0.4)] focus:ring-energy-red',
        'border border-transparent',
        !isDisabled && 'hover:from-red-600 hover:to-red-600'
      ),
      success: clsx(
        'bg-gradient-to-br from-energy-green to-victory',
        'text-white shadow-[0_4px_12px_rgba(6,214,160,0.3)]',
        'hover:shadow-[0_6px_16px_rgba(6,214,160,0.4)] focus:ring-energy-green',
        'border border-transparent',
        !isDisabled && 'hover:from-green-600 hover:to-green-600'
      ),
    };

    // Size-specific styles
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2.5 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
      xl: 'px-8 py-4 text-xl gap-3',
    };

    // Animation variants
    const buttonVariants = {
      initial: {
        opacity: 0,
        y: 20,
        scale: 0.95,
      },
      animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: 0.3,
          ease: [0.68, -0.55, 0.265, 1.55], // bounce easing
        },
      },
      hover: {
        y: -2,
        transition: {
          duration: 0.2,
          ease: 'easeOut',
        },
      },
      tap: {
        y: 0,
        scale: 0.98,
        transition: {
          duration: 0.1,
          ease: 'easeInOut',
        },
      },
      loading: {
        scale: [1, 1.05, 1],
        transition: {
          duration: 1,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      },
    };

    // Icon animation variants
    const iconVariants = {
      initial: { scale: 0, rotate: -180 },
      animate: {
        scale: 1,
        rotate: 0,
        transition: {
          delay: 0.2,
          duration: 0.4,
          ease: [0.68, -0.55, 0.265, 1.55],
        },
      },
      hover: {
        scale: 1.1,
        transition: { duration: 0.2 },
      },
    };

    // Loading spinner component
    const LoadingSpinner = () => (
      <motion.div
        className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    );

    return (
      <motion.button
        ref={ref}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={isDisabled}
        variants={buttonVariants}
        initial="initial"
        animate={loading ? 'loading' : 'animate'}
        whileHover={!isDisabled ? 'hover' : undefined}
        whileTap={!isDisabled ? 'tap' : undefined}
        {...props}
      >
        {/* Background glow effect for primary and gradient buttons */}
        {(variant === 'primary' ||
          variant === 'danger' ||
          variant === 'success') && (
          <motion.div
            className="absolute inset-0 rounded-game opacity-0"
            style={{
              background:
                variant === 'primary'
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(168, 85, 247, 0.3))'
                  : variant === 'danger'
                    ? 'linear-gradient(135deg, rgba(239, 71, 111, 0.3), rgba(239, 68, 68, 0.3))'
                    : 'linear-gradient(135deg, rgba(6, 214, 160, 0.3), rgba(16, 185, 129, 0.3))',
            }}
            whileHover={{ opacity: 1, scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Content wrapper */}
        <motion.div
          className="relative z-10 flex items-center justify-center gap-inherit"
          variants={{
            initial: { opacity: 0.8 },
            animate: { opacity: 1 },
            hover: { opacity: 1 },
          }}
        >
          {/* Left icon */}
          {icon && iconPosition === 'left' && !loading && (
            <motion.span variants={iconVariants} className="flex-shrink-0">
              {icon}
            </motion.span>
          )}

          {/* Loading spinner */}
          {loading && (
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-shrink-0"
            >
              <LoadingSpinner />
            </motion.span>
          )}

          {/* Button text */}
          <motion.span
            className={clsx('relative', {
              'opacity-70': loading,
            })}
            variants={{
              initial: { y: 4, opacity: 0 },
              animate: {
                y: 0,
                opacity: 1,
                transition: { delay: 0.1, duration: 0.3 },
              },
            }}
          >
            {loading && typeof children === 'string'
              ? `${children}...`
              : children}
          </motion.span>

          {/* Right icon */}
          {icon && iconPosition === 'right' && !loading && (
            <motion.span variants={iconVariants} className="flex-shrink-0">
              {icon}
            </motion.span>
          )}
        </motion.div>

        {/* Ripple effect overlay */}
        <motion.div
          className="absolute inset-0 rounded-game pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
            opacity: 0,
          }}
          whileTap={{
            opacity: [0, 1, 0],
            scale: [0.8, 1.2, 1.4],
            transition: { duration: 0.4, ease: 'easeOut' },
          }}
        />
      </motion.button>
    );
  }
);

AnimatedButton.displayName = 'AnimatedButton';

export { AnimatedButton };
export default AnimatedButton;

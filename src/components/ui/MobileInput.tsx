import React, { forwardRef } from 'react';
import { LucideIcon, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  variant?: 'default' | 'game';
}

const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(({
  label,
  error,
  hint,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = true,
  variant = 'default',
  className = '',
  disabled,
  ...props
}, ref) => {
  const hasError = !!error;
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'game':
        return `
          border-2 border-electric-200
          focus:border-electric-500 focus:ring-4 focus:ring-electric-500/20
          bg-gradient-to-r from-white to-blue-50/30
        `;
      default:
        return `
          border border-gray-300
          focus:border-electric-500 focus:ring-4 focus:ring-electric-500/20
          bg-white
        `;
    }
  };

  const getErrorClasses = () => {
    if (hasError) {
      return 'border-energy-red focus:border-energy-red focus:ring-energy-red/20';
    }
    return '';
  };

  return (
    <div className={`mobile-form-group ${fullWidth ? 'w-full' : ''} ${className}`}>
      {/* Label */}
      {label && (
        <label className="mobile-label block font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {Icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon className="w-5 h-5" />
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          {...props}
          disabled={disabled}
          className={`
            mobile-input w-full
            ${getVariantClasses()}
            ${getErrorClasses()}
            ${Icon && iconPosition === 'left' ? 'pl-10' : ''}
            ${Icon && iconPosition === 'right' ? 'pr-10' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
            rounded-game
            font-medium
            transition-all duration-200
            focus:outline-none
            touch-feedback
          `}
        />

        {/* Right Icon */}
        {Icon && iconPosition === 'right' && !hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <Icon className="w-5 h-5" />
          </div>
        )}

        {/* Error Icon */}
        {hasError && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-energy-red pointer-events-none">
            <AlertCircle className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Error/Hint Message */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-2 text-sm text-energy-red font-medium"
          >
            {error}
          </motion.p>
        )}
        {hint && !error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-2 text-sm text-gray-500"
          >
            {hint}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});

MobileInput.displayName = 'MobileInput';

export default MobileInput;
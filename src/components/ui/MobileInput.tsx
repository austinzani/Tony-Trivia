import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: boolean;
  errorMessage?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ label, error, errorMessage, icon, fullWidth = true, className = '', ...props }, ref) => {
    const inputClasses = `
      w-full px-4 py-3 text-base
      bg-white
      border-2 rounded-game
      ${error ? 'border-energy-red' : 'border-gray-200'}
      focus:outline-none focus:ring-4
      ${error ? 'focus:ring-energy-red/20 focus:border-energy-red' : 'focus:ring-electric-500/20 focus:border-electric-500'}
      placeholder:text-gray-400
      transition-all duration-200
      ${icon ? 'pl-12' : ''}
      ${className}
    `;

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label 
            htmlFor={props.id || props.name}
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          
          <motion.input
            ref={ref}
            className={inputClasses}
            whileFocus={{ scale: 1.01 }}
            aria-invalid={error}
            aria-describedby={error && errorMessage ? `${props.id || props.name}-error` : undefined}
            {...props}
          />
        </div>
        
        {error && errorMessage && (
          <motion.p
            id={`${props.id || props.name}-error`}
            role="alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-energy-red font-medium"
          >
            {errorMessage}
          </motion.p>
        )}
      </div>
    );
  }
);

MobileInput.displayName = 'MobileInput';

export default MobileInput;
import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface MobileSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options: Option[];
  error?: boolean;
  errorMessage?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const MobileSelect = forwardRef<HTMLSelectElement, MobileSelectProps>(
  ({ 
    label, 
    options, 
    error, 
    errorMessage, 
    fullWidth = true, 
    size = 'md',
    icon,
    className = '', 
    ...props 
  }, ref) => {
    const getSizeClasses = () => {
      switch (size) {
        case 'sm':
          return 'px-3 py-2 pr-10 text-sm';
        case 'md':
          return 'px-4 py-3 pr-12 text-base';
        case 'lg':
          return 'px-4 py-3.5 pr-12 text-lg';
        default:
          return 'px-4 py-3 pr-12 text-base';
      }
    };

    const selectClasses = `
      w-full
      ${getSizeClasses()}
      bg-white
      border-2 rounded-game
      ${error ? 'border-energy-red' : 'border-gray-200'}
      focus:outline-none focus:ring-4
      ${error ? 'focus:ring-energy-red/20 focus:border-energy-red' : 'focus:ring-electric-500/20 focus:border-electric-500'}
      appearance-none
      cursor-pointer
      transition-all duration-200
      ${icon ? 'pl-12' : ''}
      ${className}
    `;

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}
          
          <motion.select
            ref={ref}
            className={selectClasses}
            whileFocus={{ scale: 1.01 }}
            {...props}
          >
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </motion.select>

          {/* Custom chevron icon */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <ChevronDown className={`
              ${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}
            `} />
          </div>
        </div>
        
        {error && errorMessage && (
          <motion.p
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

MobileSelect.displayName = 'MobileSelect';

export default MobileSelect;
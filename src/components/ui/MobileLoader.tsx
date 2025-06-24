import React from 'react';
import { motion } from 'framer-motion';

interface MobileLoaderProps {
  variant?: 'spinner' | 'dots' | 'game';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const MobileLoader: React.FC<MobileLoaderProps> = ({
  variant = 'spinner',
  size = 'md',
  color = 'primary',
  text,
  fullScreen = false,
  className = '',
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-6 h-6';
      case 'md':
        return 'w-8 h-8';
      case 'lg':
        return 'w-12 h-12';
      default:
        return 'w-8 h-8';
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'primary':
        return 'border-electric-600';
      case 'white':
        return 'border-white';
      case 'gray':
        return 'border-gray-600';
      default:
        return 'border-electric-600';
    }
  };

  const renderSpinner = () => (
    <div className={`${getSizeClasses()} ${getColorClasses()} border-2 border-t-transparent rounded-full animate-spin`} />
  );

  const renderDots = () => {
    const dotColor = color === 'primary' ? 'bg-electric-600' : color === 'white' ? 'bg-white' : 'bg-gray-600';
    
    return (
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={`w-2 h-2 rounded-full ${dotColor}`}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: index * 0.15,
            }}
          />
        ))}
      </div>
    );
  };

  const renderGameLoader = () => (
    <div className="relative">
      <motion.div
        className="w-16 h-16 rounded-full bg-gradient-to-r from-electric-500 to-plasma-500"
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <motion.div
        className="absolute inset-2 bg-white rounded-full"
        animate={{
          scale: [1, 0.8, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
        }}
      />
      <motion.div
        className="absolute inset-4 bg-gradient-to-r from-electric-500 to-plasma-500 rounded-full"
        animate={{
          rotate: -360,
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );

  const content = (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {variant === 'spinner' && renderSpinner()}
      {variant === 'dots' && renderDots()}
      {variant === 'game' && renderGameLoader()}
      
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`text-sm font-medium ${
            color === 'primary' ? 'text-gray-700' : 
            color === 'white' ? 'text-white' : 
            'text-gray-500'
          }`}
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default MobileLoader;
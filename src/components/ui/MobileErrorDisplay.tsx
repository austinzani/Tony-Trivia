import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, WifiOff, RefreshCw, Home, HelpCircle } from 'lucide-react';
import MobileButton from './MobileButton';
import MobileCard from './MobileCard';

interface MobileErrorDisplayProps {
  error: Error | string;
  errorType?: 'network' | 'server' | 'client' | 'unknown';
  onRetry?: () => void;
  onGoHome?: () => void;
  onHelp?: () => void;
  fullScreen?: boolean;
  playful?: boolean;
  className?: string;
}

const MobileErrorDisplay: React.FC<MobileErrorDisplayProps> = ({
  error,
  errorType = 'unknown',
  onRetry,
  onGoHome,
  onHelp,
  fullScreen = false,
  playful = true,
  className = '',
}) => {
  const errorMessage = typeof error === 'string' ? error : error.message;

  const getErrorConfig = () => {
    switch (errorType) {
      case 'network':
        return {
          icon: WifiOff,
          title: playful ? 'Oops! Lost Connection' : 'Network Error',
          message: playful 
            ? "Looks like your internet took a little break. Let's try reconnecting!"
            : 'Unable to connect to the server. Please check your internet connection.',
          color: 'text-energy-orange',
          bgColor: 'bg-energy-orange/10',
          borderColor: 'border-energy-orange/20',
        };
      case 'server':
        return {
          icon: AlertTriangle,
          title: playful ? 'Hmm, Something Got Mixed Up' : 'Server Error',
          message: playful
            ? "Our servers are having a moment. Give us a sec to sort things out!"
            : 'The server encountered an error. Please try again later.',
          color: 'text-energy-red',
          bgColor: 'bg-energy-red/10',
          borderColor: 'border-energy-red/20',
        };
      case 'client':
        return {
          icon: HelpCircle,
          title: playful ? "That Didn't Work As Expected" : 'Application Error',
          message: playful
            ? "Something went sideways. Let's give it another shot!"
            : 'An error occurred in the application. Please try again.',
          color: 'text-electric-600',
          bgColor: 'bg-electric-100',
          borderColor: 'border-electric-200',
        };
      default:
        return {
          icon: AlertTriangle,
          title: playful ? 'Oops! Hit a Snag' : 'Error',
          message: errorMessage || (playful
            ? "Something unexpected happened. Let's try that again!"
            : 'An unexpected error occurred. Please try again.'),
          color: 'text-gray-700',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200',
        };
    }
  };

  const config = getErrorConfig();
  const Icon = config.icon;

  const content = (
    <MobileCard
      variant="default"
      padding="lg"
      className={`${config.bgColor} border ${config.borderColor} ${className}`}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full ${config.bgColor} mb-4 sm:mb-6`}
        >
          <Icon className={`w-8 h-8 sm:w-10 sm:h-10 ${config.color}`} />
        </motion.div>

        {/* Title */}
        <h3 className={`text-lg sm:text-xl font-bold ${config.color} mb-2 sm:mb-3`}>
          {config.title}
        </h3>

        {/* Message */}
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-sm mx-auto">
          {config.message}
        </p>

        {/* Actions */}
        <div className="space-y-3 sm:space-y-0 sm:flex sm:gap-3 sm:justify-center">
          {onRetry && (
            <MobileButton
              variant="primary"
              size="md"
              icon={RefreshCw}
              onClick={onRetry}
              className="w-full sm:w-auto"
            >
              Try Again
            </MobileButton>
          )}
          
          {onGoHome && (
            <MobileButton
              variant="secondary"
              size="md"
              icon={Home}
              onClick={onGoHome}
              className="w-full sm:w-auto"
            >
              Go Home
            </MobileButton>
          )}

          {onHelp && (
            <MobileButton
              variant="secondary"
              size="md"
              icon={HelpCircle}
              onClick={onHelp}
              className="w-full sm:w-auto"
            >
              Get Help
            </MobileButton>
          )}
        </div>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && errorMessage && (
          <details className="mt-6 text-left">
            <summary className="text-xs text-gray-500 cursor-pointer">
              Technical Details
            </summary>
            <pre className="mt-2 p-3 bg-gray-900 text-gray-100 text-xs rounded overflow-x-auto">
              {errorMessage}
            </pre>
          </details>
        )}
      </motion.div>
    </MobileCard>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center p-4 safe-padding-top safe-padding-bottom">
        {content}
      </div>
    );
  }

  return content;
};

export default MobileErrorDisplay;
import React, { useState, useEffect } from 'react';
import { AnimatedButton } from './AnimatedButton';
import {
  errorMessageService,
  type UserFriendlyError,
  type ErrorCategory,
} from '../services/errorMessageService';

interface ErrorDisplayProps {
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center';
  maxErrors?: number;
  className?: string;
}

const ErrorNotification: React.FC<{
  error: UserFriendlyError;
  onDismiss: (id: string) => void;
}> = ({ error, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    if (!error.dismissible) return;

    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(error.id);
    }, 300); // Match animation duration
  };

  const getSeverityColors = () => {
    switch (error.context.severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getProgressBarColor = () => {
    switch (error.context.severity) {
      case 'critical':
      case 'error':
        return 'bg-red-400';
      case 'warning':
        return 'bg-yellow-400';
      case 'info':
        return 'bg-blue-400';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div
      className={`
        relative max-w-sm w-full shadow-lg rounded-lg border-2 p-4 mb-3 
        transform transition-all duration-300 ease-in-out
        ${getSeverityColors()}
        ${
          isVisible && !isLeaving
            ? 'translate-x-0 opacity-100 scale-100'
            : 'translate-x-full opacity-0 scale-95'
        }
        ${isLeaving ? '-translate-x-full opacity-0' : ''}
      `}
    >
      {/* Auto-hide progress bar */}
      {error.autoHide && (
        <div
          className={`absolute bottom-0 left-0 h-1 rounded-b-lg ${getProgressBarColor()}`}
          style={{
            width: '100%',
            animation: `shrink ${error.autoHide}ms linear forwards`,
          }}
        />
      )}

      {/* Dismiss button */}
      {error.dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 
                     transition-colors duration-200 focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-gray-300 rounded"
          aria-label="Dismiss error"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}

      {/* Error content */}
      <div className="pr-6">
        {/* Header */}
        <div className="flex items-start mb-2">
          {error.icon && (
            <span className="text-lg mr-3 flex-shrink-0" aria-hidden="true">
              {error.icon}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm leading-5 truncate">
              {error.title}
            </h4>
          </div>
        </div>

        {/* Message */}
        <p className="text-sm leading-5 mb-3">{error.message}</p>

        {/* Suggestion */}
        {error.suggestion && (
          <p className="text-xs leading-4 opacity-80 mb-3">
            💡 {error.suggestion}
          </p>
        )}

        {/* Action button */}
        {error.action && (
          <div className="mt-3">
            <AnimatedButton
              onClick={error.action.handler}
              size="small"
              variant="secondary"
              className="text-xs"
            >
              {error.action.label}
            </AnimatedButton>
          </div>
        )}

        {/* Timestamp (for debugging/development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 text-xs opacity-50">
            {error.timestamp.toLocaleTimeString()}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  position = 'top-right',
  maxErrors = 5,
  className = '',
}) => {
  const [errors, setErrors] = useState<UserFriendlyError[]>([]);

  useEffect(() => {
    const unsubscribe = errorMessageService.subscribe(newErrors => {
      // Limit the number of errors displayed
      setErrors(newErrors.slice(-maxErrors));
    });

    // Get initial errors
    setErrors(errorMessageService.getErrors().slice(-maxErrors));

    return unsubscribe;
  }, [maxErrors]);

  const handleDismissError = (errorId: string) => {
    errorMessageService.dismissError(errorId);
  };

  if (errors.length === 0) {
    return null;
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <div
      className={`
        fixed z-50 pointer-events-none
        ${getPositionClasses()}
        ${className}
      `}
      role="alert"
      aria-live="polite"
      aria-atomic="false"
    >
      <div className="pointer-events-auto">
        {errors.map(error => (
          <ErrorNotification
            key={error.id}
            error={error}
            onDismiss={handleDismissError}
          />
        ))}
      </div>
    </div>
  );
};

// Hook for using error display
export const useErrorDisplay = () => {
  return {
    showError: errorMessageService.showError.bind(errorMessageService),
    showNetworkError:
      errorMessageService.showNetworkError.bind(errorMessageService),
    showAuthError: errorMessageService.showAuthError.bind(errorMessageService),
    showGameError: errorMessageService.showGameError.bind(errorMessageService),
    showValidationError:
      errorMessageService.showValidationError.bind(errorMessageService),
    showSystemError:
      errorMessageService.showSystemError.bind(errorMessageService),
    showInfo: errorMessageService.showInfo.bind(errorMessageService),
    showSuccess: errorMessageService.showSuccess.bind(errorMessageService),
    dismissError: errorMessageService.dismissError.bind(errorMessageService),
    clearAll: errorMessageService.clearAll.bind(errorMessageService),
    clearByCategory:
      errorMessageService.clearByCategory.bind(errorMessageService),
  };
};

export default ErrorDisplay;

import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { AnimatedButton } from './AnimatedButton';

interface ConnectionStatusProps {
  showWhenOnline?: boolean;
  className?: string;
}

export function ConnectionStatus({
  showWhenOnline = false,
  className = '',
}: ConnectionStatusProps) {
  const networkStatus = useNetworkStatus({
    retryInterval: 2000,
    maxRetries: 5,
    onOnline: () => {
      console.log('🎉 Connection restored!');
    },
    onOffline: () => {
      console.log('📡 Connection lost...');
    },
  });

  const { isOnline, isReconnecting, retryCount, lastChecked, retry } =
    networkStatus;

  // Don't show anything when online (unless explicitly requested)
  if (isOnline && !showWhenOnline) {
    return null;
  }

  // Online status (only shown when showWhenOnline is true)
  if (isOnline) {
    return (
      <div className={`fixed top-4 right-4 z-50 ${className}`}>
        <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse"></div>
          <span>Connected</span>
          {lastChecked && (
            <span className="opacity-75 text-xs">
              {lastChecked.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Offline/Reconnecting status
  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className="bg-white border border-red-200 rounded-lg shadow-xl p-4 max-w-sm">
        {/* Status indicator */}
        <div className="flex items-center space-x-3 mb-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isReconnecting ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
            }`}
          ></div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {isReconnecting ? 'Reconnecting...' : 'Connection Lost'}
            </h3>
            <p className="text-sm text-gray-600">
              {isReconnecting
                ? `Attempt ${retryCount}/5`
                : 'Check your internet connection'}
            </p>
          </div>
        </div>

        {/* Progress indicator for reconnecting */}
        {isReconnecting && (
          <div className="mb-3">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300 animate-pulse"
                style={{ width: `${(retryCount / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Last checked timestamp */}
        {lastChecked && (
          <p className="text-xs text-gray-500 mb-3">
            Last checked: {lastChecked.toLocaleTimeString()}
          </p>
        )}

        {/* Action buttons */}
        <div className="flex space-x-2">
          <AnimatedButton
            variant="primary"
            size="sm"
            onClick={retry}
            disabled={isReconnecting}
            className="flex-1"
          >
            {isReconnecting ? (
              <div className="flex items-center justify-center space-x-1">
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Retrying...</span>
              </div>
            ) : (
              <span>🔄 Retry Now</span>
            )}
          </AnimatedButton>

          <AnimatedButton
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="flex-1"
          >
            🔃 Refresh Page
          </AnimatedButton>
        </div>

        {/* Tips for offline mode */}
        {!isReconnecting && (
          <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
            <p className="font-medium mb-1">💡 Offline Tips:</p>
            <ul className="space-y-1">
              <li>• Check your WiFi or mobile data</li>
              <li>• Move closer to your router</li>
              <li>• Try refreshing the page</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default ConnectionStatus;

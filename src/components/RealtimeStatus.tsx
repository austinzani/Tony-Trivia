import React from 'react';

interface ConnectionStatus {
  gameRoom: boolean;
  teams: boolean;
  gameState: boolean;
  teamAnswers: boolean;
}

interface RealtimeStatusProps {
  connectionStatus: ConnectionStatus;
  showDetails?: boolean;
  className?: string;
}

export default function RealtimeStatus({
  connectionStatus,
  showDetails = false,
  className = '',
}: RealtimeStatusProps) {
  const allConnected = Object.values(connectionStatus).every(status => status);
  const someConnected = Object.values(connectionStatus).some(status => status);
  const noneConnected = Object.values(connectionStatus).every(
    status => !status
  );

  const getStatusColor = () => {
    if (allConnected) return 'text-green-600';
    if (someConnected) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (allConnected) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      );
    }

    if (someConnected) {
      return (
        <svg
          className="w-4 h-4 animate-pulse"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      );
    }

    return (
      <svg
        className="w-4 h-4 animate-ping"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  const getStatusText = () => {
    if (allConnected) return 'Connected';
    if (someConnected) return 'Connecting...';
    return 'Disconnected';
  };

  const getDetailedStatus = () => {
    return [
      { name: 'Game Room', connected: connectionStatus.gameRoom },
      { name: 'Teams', connected: connectionStatus.teams },
      { name: 'Game State', connected: connectionStatus.gameState },
      { name: 'Team Answers', connected: connectionStatus.teamAnswers },
    ];
  };

  if (!showDetails) {
    return (
      <div
        className={`flex items-center space-x-2 ${getStatusColor()} ${className}`}
      >
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">Real-time Status</h3>
        <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="text-sm font-medium">{getStatusText()}</span>
        </div>
      </div>

      <div className="space-y-2">
        {getDetailedStatus().map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{item.name}</span>
            <div className="flex items-center space-x-1">
              {item.connected ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">Connected</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-red-600">Disconnected</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {noneConnected && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-xs text-red-800">
            Real-time features are currently unavailable. Check your internet
            connection.
          </p>
        </div>
      )}

      {someConnected && !allConnected && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-yellow-800">
            Some real-time features may be limited. Reconnecting...
          </p>
        </div>
      )}

      {allConnected && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
          <p className="text-xs text-green-800">
            All real-time features are active and working normally.
          </p>
        </div>
      )}
    </div>
  );
}

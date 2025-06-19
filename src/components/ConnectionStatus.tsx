import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface ConnectionState {
  isOnline: boolean;
  supabaseConnected: boolean;
  realtimeConnected: boolean;
  lastPing?: Date;
  reconnectAttempts: number;
}

interface ConnectionStatusProps {
  gameRoomId?: string;
  showDetails?: boolean;
  className?: string;
  onConnectionChange?: (connected: boolean) => void;
}

export default function ConnectionStatus({
  gameRoomId,
  showDetails = false,
  className = '',
  onConnectionChange,
}: ConnectionStatusProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    isOnline: navigator.onLine,
    supabaseConnected: false,
    realtimeConnected: false,
    reconnectAttempts: 0,
  });

  const [isReconnecting, setIsReconnecting] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  // Monitor browser online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setConnectionState(prev => ({
        ...prev,
        isOnline: false,
        supabaseConnected: false,
        realtimeConnected: false,
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor Supabase realtime connection
  useEffect(() => {
    const handleRealtimeOpen = () => {
      setConnectionState(prev => ({
        ...prev,
        realtimeConnected: true,
        reconnectAttempts: 0,
      }));
      setIsReconnecting(false);
    };

    const handleRealtimeClose = () => {
      setConnectionState(prev => ({
        ...prev,
        realtimeConnected: false,
        reconnectAttempts: prev.reconnectAttempts + 1,
      }));
      setIsReconnecting(true);
    };

    const handleRealtimeError = (error: any) => {
      console.error('Realtime connection error:', error);
      setConnectionState(prev => ({
        ...prev,
        realtimeConnected: false,
      }));
    };

    // Set up realtime connection listeners
    supabase.realtime.onOpen(handleRealtimeOpen);
    supabase.realtime.onClose(handleRealtimeClose);
    supabase.realtime.onError(handleRealtimeError);

    return () => {
      // Cleanup listeners (if Supabase provides a way to remove them)
    };
  }, []);

  // Test Supabase connection periodically
  useEffect(() => {
    const testConnection = async () => {
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        const isConnected = !error;

        setConnectionState(prev => ({
          ...prev,
          supabaseConnected: isConnected,
          lastPing: new Date(),
        }));
      } catch (err) {
        setConnectionState(prev => ({
          ...prev,
          supabaseConnected: false,
          lastPing: new Date(),
        }));
      }
    };

    // Test immediately
    testConnection();

    // Test every 30 seconds
    const interval = setInterval(testConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  // Notify parent component of connection changes
  useEffect(() => {
    const isFullyConnected =
      connectionState.isOnline &&
      connectionState.supabaseConnected &&
      connectionState.realtimeConnected;

    onConnectionChange?.(isFullyConnected);

    // Show status bar when there are connection issues
    setShowStatus(!isFullyConnected || showDetails);
  }, [connectionState, onConnectionChange, showDetails]);

  const getStatusColor = () => {
    if (!connectionState.isOnline) return 'bg-red-500';
    if (
      !connectionState.supabaseConnected ||
      !connectionState.realtimeConnected
    ) {
      return isReconnecting ? 'bg-yellow-500' : 'bg-red-500';
    }
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!connectionState.isOnline) return 'Offline';
    if (isReconnecting) return 'Reconnecting...';
    if (!connectionState.supabaseConnected) return 'Database disconnected';
    if (!connectionState.realtimeConnected) return 'Real-time disconnected';
    return 'Connected';
  };

  const getStatusIcon = () => {
    if (!connectionState.isOnline) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 6.707 6.293a1 1 0 00-1.414 1.414L8.586 11l-3.293 3.293a1 1 0 001.414 1.414L10 12.414l3.293 3.293a1 1 0 001.414-1.414L11.414 11l3.293-3.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    }

    if (isReconnecting) {
      return (
        <svg
          className="w-4 h-4 animate-spin"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
            clipRule="evenodd"
          />
        </svg>
      );
    }

    if (
      !connectionState.supabaseConnected ||
      !connectionState.realtimeConnected
    ) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  if (!showStatus) {
    return null;
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${className}`}>
      <div
        className={`${getStatusColor()} text-white px-4 py-2 text-sm transition-colors`}
      >
        <div className="flex items-center justify-center space-x-2">
          <span className="text-white">{getStatusIcon()}</span>
          <span>{getStatusText()}</span>

          {showDetails && (
            <div className="flex items-center space-x-4 ml-4 text-xs">
              <span
                className={`flex items-center space-x-1 ${connectionState.isOnline ? 'text-green-200' : 'text-red-200'}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${connectionState.isOnline ? 'bg-green-200' : 'bg-red-200'}`}
                ></span>
                <span>Internet</span>
              </span>

              <span
                className={`flex items-center space-x-1 ${connectionState.supabaseConnected ? 'text-green-200' : 'text-red-200'}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${connectionState.supabaseConnected ? 'bg-green-200' : 'bg-red-200'}`}
                ></span>
                <span>Database</span>
              </span>

              <span
                className={`flex items-center space-x-1 ${connectionState.realtimeConnected ? 'text-green-200' : 'text-red-200'}`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${connectionState.realtimeConnected ? 'bg-green-200' : 'bg-red-200'}`}
                ></span>
                <span>Real-time</span>
              </span>

              {connectionState.lastPing && (
                <span className="text-gray-200">
                  Last ping: {connectionState.lastPing.toLocaleTimeString()}
                </span>
              )}

              {connectionState.reconnectAttempts > 0 && (
                <span className="text-yellow-200">
                  Attempts: {connectionState.reconnectAttempts}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

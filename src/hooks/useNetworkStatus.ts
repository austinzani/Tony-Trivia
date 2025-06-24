import { useState, useEffect, useCallback, useRef } from 'react';

export interface NetworkStatusOptions {
  retryInterval?: number;
  maxRetries?: number;
  onOnline?: () => void;
  onOffline?: () => void;
  pingUrl?: string;
}

export interface NetworkStatus {
  isOnline: boolean;
  isReconnecting: boolean;
  retryCount: number;
  lastChecked: Date | null;
  retry: () => void;
}

export function useNetworkStatus(options: NetworkStatusOptions = {}): NetworkStatus {
  const {
    retryInterval = 3000,
    maxRetries = 5,
    onOnline,
    onOffline,
    pingUrl = '/api/health' // Can be any endpoint that returns quickly
  } = options;

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Enhanced connectivity check that actually tests the connection
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      // Try to fetch a lightweight endpoint with a timeout
      const response = await fetch(pingUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: abortControllerRef.current.signal,
      });

      setLastChecked(new Date());
      return response.ok;
    } catch (error) {
      setLastChecked(new Date());
      
      // Don't treat aborted requests as offline
      if (error instanceof Error && error.name === 'AbortError') {
        return isOnline; // Return current state
      }
      
      console.warn('Network connectivity check failed:', error);
      return false;
    }
  }, [pingUrl, isOnline]);

  // Handle going online
  const handleOnline = useCallback(async () => {
    console.log('Browser reports online, verifying connection...');
    
    const actuallyOnline = await checkConnectivity();
    
    if (actuallyOnline) {
      setIsOnline(true);
      setIsReconnecting(false);
      setRetryCount(0);
      onOnline?.();
      console.log('✅ Connection restored');
    } else {
      // Browser says online but we can't actually connect
      console.log('❌ Browser online but connection failed, starting retry...');
      startRetryProcess();
    }
  }, [checkConnectivity, onOnline]);

  // Handle going offline
  const handleOffline = useCallback(() => {
    console.log('❌ Connection lost');
    setIsOnline(false);
    setIsReconnecting(false);
    setRetryCount(0);
    onOffline?.();
    
    // Clear any pending retries
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, [onOffline]);

  // Retry mechanism
  const startRetryProcess = useCallback(() => {
    if (retryCount >= maxRetries) {
      console.log('🔄 Maximum retry attempts reached');
      setIsReconnecting(false);
      return;
    }

    setIsReconnecting(true);
    setRetryCount(prev => prev + 1);

    retryTimeoutRef.current = setTimeout(async () => {
      console.log(`🔄 Retry attempt ${retryCount + 1}/${maxRetries}`);
      
      const isConnected = await checkConnectivity();
      
      if (isConnected) {
        setIsOnline(true);
        setIsReconnecting(false);
        setRetryCount(0);
        onOnline?.();
        console.log('✅ Connection restored after retry');
      } else {
        // Continue retrying
        startRetryProcess();
      }
    }, retryInterval);
  }, [retryCount, maxRetries, retryInterval, checkConnectivity, onOnline]);

  // Manual retry function
  const retry = useCallback(() => {
    setRetryCount(0);
    startRetryProcess();
  }, [startRetryProcess]);

  // Handle network events and periodic checks
  useEffect(() => {
    // Initial connectivity check
    checkConnectivity().then(setIsOnline);

    // Listen to browser online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connectivity check when online
    const intervalId = setInterval(async () => {
      if (navigator.onLine && isOnline) {
        const stillOnline = await checkConnectivity();
        if (!stillOnline) {
          handleOffline();
        }
      }
    }, 30000); // Check every 30 seconds when online

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [handleOnline, handleOffline, checkConnectivity, isOnline]);

  // Start retry process when we detect we're offline but browser thinks we're online
  useEffect(() => {
    if (navigator.onLine && !isOnline && !isReconnecting && retryCount === 0) {
      startRetryProcess();
    }
  }, [isOnline, isReconnecting, retryCount, startRetryProcess]);

  return {
    isOnline,
    isReconnecting,
    retryCount,
    lastChecked,
    retry,
  };
} 
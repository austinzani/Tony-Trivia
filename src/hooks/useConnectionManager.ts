import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ConnectionManager, 
  connectionManager as globalConnectionManager,
  type ConnectionStatus,
  type ConnectionEvent,
  type ConnectionOptions 
} from '../services/connectionManager';

export interface UseConnectionManagerOptions extends ConnectionOptions {
  useGlobalInstance?: boolean;
  onStatusChange?: (status: ConnectionStatus) => void;
  onError?: (error: Error) => void;
  onReconnected?: () => void;
  onDisconnected?: () => void;
}

export interface UseConnectionManagerReturn {
  // Status
  status: ConnectionStatus;
  isConnected: boolean;
  isReconnecting: boolean;
  hasError: boolean;
  
  // Connection info
  reconnectAttempts: number;
  subscriptionCount: number;
  lastHeartbeat: Date | null;
  uptime: number | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  forceReconnect: () => Promise<void>;
  
  // Subscription management
  subscribe: (
    table: string,
    callback: (payload: any) => void,
    filter?: string,
    event?: string
  ) => Promise<string>;
  unsubscribe: (subscriptionId: string) => Promise<void>;
  
  // Diagnostics
  getActiveSubscriptions: () => Array<{
    id: string;
    table: string;
    filter?: string;
    isActive: boolean;
  }>;
  
  // Event history
  events: ConnectionEvent[];
  clearEvents: () => void;
}

export function useConnectionManager(
  options: UseConnectionManagerOptions = {}
): UseConnectionManagerReturn {
  const {
    useGlobalInstance = true,
    onStatusChange,
    onError,
    onReconnected,
    onDisconnected,
    ...connectionOptions
  } = options;

  // State
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null);
  const [uptime, setUptime] = useState<number | null>(null);
  const [events, setEvents] = useState<ConnectionEvent[]>([]);

  // Connection manager instance
  const connectionManagerRef = useRef<ConnectionManager | null>(null);

  // Initialize connection manager
  useEffect(() => {
    if (useGlobalInstance) {
      connectionManagerRef.current = globalConnectionManager;
    } else {
      connectionManagerRef.current = new ConnectionManager(connectionOptions);
    }

    // Get initial status
    const manager = connectionManagerRef.current;
    const initialStatus = manager.getStatus();
    setStatus(initialStatus);

    const connectionInfo = manager.getConnectionInfo();
    setReconnectAttempts(connectionInfo.reconnectAttempts);
    setSubscriptionCount(connectionInfo.subscriptionCount);
    setLastHeartbeat(connectionInfo.lastHeartbeat);
    setUptime(connectionInfo.uptime);

    return () => {
      // Only destroy if we created our own instance
      if (!useGlobalInstance && connectionManagerRef.current) {
        connectionManagerRef.current.destroy();
      }
    };
  }, [useGlobalInstance]);

  // Event listener for connection events
  useEffect(() => {
    const manager = connectionManagerRef.current;
    if (!manager) return;

    const handleConnectionEvent = (event: ConnectionEvent) => {
      // Add to events history (keep last 50 events)
      setEvents(prev => {
        const newEvents = [...prev, event].slice(-50);
        return newEvents;
      });

      // Handle specific event types
      switch (event.type) {
        case 'status-change':
          if (event.status) {
            setStatus(event.status);
            onStatusChange?.(event.status);

            // Trigger specific callbacks
            if (event.status === 'connected' && event.data?.oldStatus !== 'connected') {
              onReconnected?.();
            } else if (event.status === 'disconnected' && event.data?.oldStatus === 'connected') {
              onDisconnected?.();
            }
          }
          break;

        case 'error':
          if (event.error) {
            onError?.(event.error);
          }
          break;

        case 'heartbeat':
          if (event.data?.timestamp) {
            setLastHeartbeat(new Date(event.data.timestamp));
          }
          break;
      }

      // Update connection info
      const connectionInfo = manager.getConnectionInfo();
      setReconnectAttempts(connectionInfo.reconnectAttempts);
      setSubscriptionCount(connectionInfo.subscriptionCount);
      setUptime(connectionInfo.uptime);
    };

    const removeListener = manager.addEventListener(handleConnectionEvent);

    return removeListener;
  }, [onStatusChange, onError, onReconnected, onDisconnected]);

  // Update uptime periodically
  useEffect(() => {
    if (!lastHeartbeat) return;

    const interval = setInterval(() => {
      setUptime(Date.now() - lastHeartbeat.getTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [lastHeartbeat]);

  // Action handlers
  const connect = useCallback(async () => {
    if (!connectionManagerRef.current) throw new Error('Connection manager not initialized');
    await connectionManagerRef.current.connect();
  }, []);

  const disconnect = useCallback(async () => {
    if (!connectionManagerRef.current) throw new Error('Connection manager not initialized');
    await connectionManagerRef.current.disconnect();
  }, []);

  const forceReconnect = useCallback(async () => {
    if (!connectionManagerRef.current) throw new Error('Connection manager not initialized');
    await connectionManagerRef.current.forceReconnect();
  }, []);

  const subscribe = useCallback(async (
    table: string,
    callback: (payload: any) => void,
    filter?: string,
    event: string = '*'
  ) => {
    if (!connectionManagerRef.current) throw new Error('Connection manager not initialized');
    return await connectionManagerRef.current.subscribe(table, callback, filter, event);
  }, []);

  const unsubscribe = useCallback(async (subscriptionId: string) => {
    if (!connectionManagerRef.current) throw new Error('Connection manager not initialized');
    await connectionManagerRef.current.unsubscribe(subscriptionId);
  }, []);

  const getActiveSubscriptions = useCallback(() => {
    if (!connectionManagerRef.current) return [];
    return connectionManagerRef.current.getActiveSubscriptions();
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Computed values
  const isConnected = status === 'connected';
  const isReconnecting = status === 'reconnecting';
  const hasError = status === 'error';

  return {
    // Status
    status,
    isConnected,
    isReconnecting,
    hasError,
    
    // Connection info
    reconnectAttempts,
    subscriptionCount,
    lastHeartbeat,
    uptime,
    
    // Actions
    connect,
    disconnect,
    forceReconnect,
    
    // Subscription management
    subscribe,
    unsubscribe,
    
    // Diagnostics
    getActiveSubscriptions,
    
    // Event history
    events,
    clearEvents,
  };
}

// Hook specifically for real-time subscriptions
export function useRealtimeSubscription(
  table: string,
  callback: (payload: any) => void,
  filter?: string,
  event: string = '*',
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const { subscribe, unsubscribe, isConnected } = useConnectionManager();
  const subscriptionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !isConnected) return;

    let mounted = true;

    const setupSubscription = async () => {
      try {
        const subscriptionId = await subscribe(table, callback, filter, event);
        
        if (mounted) {
          subscriptionIdRef.current = subscriptionId;
        } else {
          // Component unmounted while subscription was being set up
          await unsubscribe(subscriptionId);
        }
      } catch (error) {
        console.error('Failed to setup subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      mounted = false;
      
      if (subscriptionIdRef.current) {
        unsubscribe(subscriptionIdRef.current).catch(error => {
          console.error('Failed to cleanup subscription:', error);
        });
        subscriptionIdRef.current = null;
      }
    };
  }, [enabled, isConnected, table, filter, event, subscribe, unsubscribe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionIdRef.current) {
        unsubscribe(subscriptionIdRef.current).catch(error => {
          console.error('Failed to cleanup subscription on unmount:', error);
        });
      }
    };
  }, [unsubscribe]);

  return {
    isSubscribed: subscriptionIdRef.current !== null,
    subscriptionId: subscriptionIdRef.current,
  };
}

export default useConnectionManager; 
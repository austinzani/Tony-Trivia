import { useEffect, useState, useCallback, useRef } from 'react';
import { channelSubscriptionService } from '../services/channelSubscriptionService';
import type { 
  RoomSubscriptionOptions, 
  TeamSubscriptionOptions, 
  HostSubscriptionOptions,
  SubscriptionGroup 
} from '../services/channelSubscriptionService';

// Hook state interface
interface SubscriptionState {
  isConnected: boolean;
  isSubscribing: boolean;
  subscriptionId: string | null;
  error: string | null;
  metrics: any;
}

// Room subscription hook
export function useRoomSubscription(options: RoomSubscriptionOptions | null) {
  const [state, setState] = useState<SubscriptionState>({
    isConnected: false,
    isSubscribing: false,
    subscriptionId: null,
    error: null,
    metrics: null,
  });

  const subscriptionIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  const subscribe = useCallback(async () => {
    if (!options || state.isSubscribing) return;

    setState(prev => ({ ...prev, isSubscribing: true, error: null }));

    try {
      // Initialize service if not already done
      if (!isInitializedRef.current) {
        await channelSubscriptionService.initialize();
        isInitializedRef.current = true;
      }

      const subscriptionId = await channelSubscriptionService.subscribeToRoom(options);
      subscriptionIdRef.current = subscriptionId;

      setState(prev => ({
        ...prev,
        isConnected: true,
        isSubscribing: false,
        subscriptionId,
        metrics: channelSubscriptionService.getMetrics(),
      }));

      console.log(`Room subscription established: ${subscriptionId}`);
    } catch (error) {
      console.error('Failed to subscribe to room:', error);
      setState(prev => ({
        ...prev,
        isConnected: false,
        isSubscribing: false,
        error: error instanceof Error ? error.message : 'Subscription failed',
      }));
    }
  }, [options, state.isSubscribing]);

  const unsubscribe = useCallback(async () => {
    if (!subscriptionIdRef.current) return;

    try {
      await channelSubscriptionService.unsubscribe(subscriptionIdRef.current);
      subscriptionIdRef.current = null;

      setState(prev => ({
        ...prev,
        isConnected: false,
        subscriptionId: null,
        metrics: channelSubscriptionService.getMetrics(),
      }));

      console.log('Room subscription cleaned up');
    } catch (error) {
      console.error('Failed to unsubscribe from room:', error);
    }
  }, []);

  // Subscribe when options are provided
  useEffect(() => {
    if (options) {
      subscribe();
    }

    return () => {
      if (subscriptionIdRef.current) {
        unsubscribe();
      }
    };
  }, [options?.roomId]); // Re-subscribe when roomId changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionIdRef.current) {
        channelSubscriptionService.unsubscribe(subscriptionIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    reconnect: subscribe,
  };
}

// Team subscription hook
export function useTeamSubscription(options: TeamSubscriptionOptions | null) {
  const [state, setState] = useState<SubscriptionState>({
    isConnected: false,
    isSubscribing: false,
    subscriptionId: null,
    error: null,
    metrics: null,
  });

  const subscriptionIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  const subscribe = useCallback(async () => {
    if (!options || state.isSubscribing) return;

    setState(prev => ({ ...prev, isSubscribing: true, error: null }));

    try {
      // Initialize service if not already done
      if (!isInitializedRef.current) {
        await channelSubscriptionService.initialize();
        isInitializedRef.current = true;
      }

      const subscriptionId = await channelSubscriptionService.subscribeToTeam(options);
      subscriptionIdRef.current = subscriptionId;

      setState(prev => ({
        ...prev,
        isConnected: true,
        isSubscribing: false,
        subscriptionId,
        metrics: channelSubscriptionService.getMetrics(),
      }));

      console.log(`Team subscription established: ${subscriptionId}`);
    } catch (error) {
      console.error('Failed to subscribe to team:', error);
      setState(prev => ({
        ...prev,
        isConnected: false,
        isSubscribing: false,
        error: error instanceof Error ? error.message : 'Subscription failed',
      }));
    }
  }, [options, state.isSubscribing]);

  const unsubscribe = useCallback(async () => {
    if (!subscriptionIdRef.current) return;

    try {
      await channelSubscriptionService.unsubscribe(subscriptionIdRef.current);
      subscriptionIdRef.current = null;

      setState(prev => ({
        ...prev,
        isConnected: false,
        subscriptionId: null,
        metrics: channelSubscriptionService.getMetrics(),
      }));

      console.log('Team subscription cleaned up');
    } catch (error) {
      console.error('Failed to unsubscribe from team:', error);
    }
  }, []);

  // Subscribe when options are provided
  useEffect(() => {
    if (options) {
      subscribe();
    }

    return () => {
      if (subscriptionIdRef.current) {
        unsubscribe();
      }
    };
  }, [options?.teamId]); // Re-subscribe when teamId changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionIdRef.current) {
        channelSubscriptionService.unsubscribe(subscriptionIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    reconnect: subscribe,
  };
}

// Host subscription hook
export function useHostSubscription(options: HostSubscriptionOptions | null) {
  const [state, setState] = useState<SubscriptionState>({
    isConnected: false,
    isSubscribing: false,
    subscriptionId: null,
    error: null,
    metrics: null,
  });

  const subscriptionIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  const subscribe = useCallback(async () => {
    if (!options || state.isSubscribing) return;

    setState(prev => ({ ...prev, isSubscribing: true, error: null }));

    try {
      // Initialize service if not already done
      if (!isInitializedRef.current) {
        await channelSubscriptionService.initialize();
        isInitializedRef.current = true;
      }

      const subscriptionId = await channelSubscriptionService.subscribeToHostNotifications(options);
      subscriptionIdRef.current = subscriptionId;

      setState(prev => ({
        ...prev,
        isConnected: true,
        isSubscribing: false,
        subscriptionId,
        metrics: channelSubscriptionService.getMetrics(),
      }));

      console.log(`Host subscription established: ${subscriptionId}`);
    } catch (error) {
      console.error('Failed to subscribe to host notifications:', error);
      setState(prev => ({
        ...prev,
        isConnected: false,
        isSubscribing: false,
        error: error instanceof Error ? error.message : 'Subscription failed',
      }));
    }
  }, [options, state.isSubscribing]);

  const unsubscribe = useCallback(async () => {
    if (!subscriptionIdRef.current) return;

    try {
      await channelSubscriptionService.unsubscribe(subscriptionIdRef.current);
      subscriptionIdRef.current = null;

      setState(prev => ({
        ...prev,
        isConnected: false,
        subscriptionId: null,
        metrics: channelSubscriptionService.getMetrics(),
      }));

      console.log('Host subscription cleaned up');
    } catch (error) {
      console.error('Failed to unsubscribe from host notifications:', error);
    }
  }, []);

  // Subscribe when options are provided
  useEffect(() => {
    if (options) {
      subscribe();
    }

    return () => {
      if (subscriptionIdRef.current) {
        unsubscribe();
      }
    };
  }, [options?.roomId, options?.hostId]); // Re-subscribe when roomId or hostId changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscriptionIdRef.current) {
        channelSubscriptionService.unsubscribe(subscriptionIdRef.current);
      }
    };
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    reconnect: subscribe,
  };
}

// Combined subscription hook for components that need multiple contexts
export function useMultipleSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Map<string, SubscriptionGroup>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);

  const initialize = useCallback(async () => {
    if (isInitialized) return;

    try {
      await channelSubscriptionService.initialize();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize subscription service:', error);
    }
  }, [isInitialized]);

  const addRoomSubscription = useCallback(async (options: RoomSubscriptionOptions) => {
    if (!isInitialized) await initialize();

    try {
      const subscriptionId = await channelSubscriptionService.subscribeToRoom(options);
      const group = channelSubscriptionService.getSubscriptionGroup(subscriptionId);
      
      if (group) {
        setSubscriptions(prev => new Map(prev).set(subscriptionId, group));
      }

      return subscriptionId;
    } catch (error) {
      console.error('Failed to add room subscription:', error);
      throw error;
    }
  }, [isInitialized, initialize]);

  const addTeamSubscription = useCallback(async (options: TeamSubscriptionOptions) => {
    if (!isInitialized) await initialize();

    try {
      const subscriptionId = await channelSubscriptionService.subscribeToTeam(options);
      const group = channelSubscriptionService.getSubscriptionGroup(subscriptionId);
      
      if (group) {
        setSubscriptions(prev => new Map(prev).set(subscriptionId, group));
      }

      return subscriptionId;
    } catch (error) {
      console.error('Failed to add team subscription:', error);
      throw error;
    }
  }, [isInitialized, initialize]);

  const addHostSubscription = useCallback(async (options: HostSubscriptionOptions) => {
    if (!isInitialized) await initialize();

    try {
      const subscriptionId = await channelSubscriptionService.subscribeToHostNotifications(options);
      const group = channelSubscriptionService.getSubscriptionGroup(subscriptionId);
      
      if (group) {
        setSubscriptions(prev => new Map(prev).set(subscriptionId, group));
      }

      return subscriptionId;
    } catch (error) {
      console.error('Failed to add host subscription:', error);
      throw error;
    }
  }, [isInitialized, initialize]);

  const removeSubscription = useCallback(async (subscriptionId: string) => {
    try {
      await channelSubscriptionService.unsubscribe(subscriptionId);
      setSubscriptions(prev => {
        const newMap = new Map(prev);
        newMap.delete(subscriptionId);
        return newMap;
      });
    } catch (error) {
      console.error('Failed to remove subscription:', error);
      throw error;
    }
  }, []);

  const clearAllSubscriptions = useCallback(async () => {
    try {
      for (const subscriptionId of subscriptions.keys()) {
        await channelSubscriptionService.unsubscribe(subscriptionId);
      }
      setSubscriptions(new Map());
    } catch (error) {
      console.error('Failed to clear all subscriptions:', error);
      throw error;
    }
  }, [subscriptions]);

  const getMetrics = useCallback(() => {
    return channelSubscriptionService.getMetrics();
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllSubscriptions();
    };
  }, []);

  return {
    subscriptions: Array.from(subscriptions.values()),
    isInitialized,
    addRoomSubscription,
    addTeamSubscription,
    addHostSubscription,
    removeSubscription,
    clearAllSubscriptions,
    getMetrics,
  };
}

// Subscription metrics hook for monitoring
export function useSubscriptionMetrics() {
  const [metrics, setMetrics] = useState(channelSubscriptionService.getMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(channelSubscriptionService.getMetrics());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return metrics;
} 
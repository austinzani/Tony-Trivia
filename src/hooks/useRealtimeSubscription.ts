import { useState, useEffect, useCallback, useRef } from 'react';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '../services/supabase';
import { supabase } from '../services/supabase';

interface SubscriptionConfig {
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  schema?: string;
}

interface SubscriptionState {
  isConnected: boolean;
  isSubscribed: boolean;
  error: Error | null;
  lastUpdate: Date | null;
}

interface UseRealtimeSubscriptionReturn {
  state: SubscriptionState;
  reconnect: () => void;
  unsubscribe: () => void;
}

export function useRealtimeSubscription(
  config: SubscriptionConfig,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void,
  dependencies: any[] = []
): UseRealtimeSubscriptionReturn {
  const [state, setState] = useState<SubscriptionState>({
    isConnected: false,
    isSubscribed: false,
    error: null,
    lastUpdate: null,
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;
  const reconnectAttempts = useRef(0);

  // Memoize the callback to prevent unnecessary re-subscriptions
  const memoizedCallback = useCallback(callback, dependencies);

  const updateState = useCallback((updates: Partial<SubscriptionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const subscribe = useCallback(async () => {
    try {
      cleanup();

      const channelName = `${config.table}_${config.filter || 'all'}_${Date.now()}`;
      const channel = supabase.channel(channelName);

      // Build the subscription
      let subscription = channel.on(
        'postgres_changes',
        {
          event: config.event || '*',
          schema: config.schema || 'public',
          table: config.table,
          ...(config.filter && { filter: config.filter }),
        },
        (payload) => {
          updateState({ lastUpdate: new Date() });
          memoizedCallback(payload);
        }
      );

      // Subscribe and handle the result
      const subscriptionResult = await channel.subscribe((status, err) => {
        console.log(`Subscription status for ${config.table}:`, status);
        
        if (status === 'SUBSCRIBED') {
          updateState({
            isSubscribed: true,
            isConnected: true,
            error: null,
          });
          reconnectAttempts.current = 0;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`Subscription error for ${config.table}:`, err);
          updateState({
            isSubscribed: false,
            isConnected: false,
            error: err || new Error(`Subscription ${status.toLowerCase()}`),
          });
          
          // Attempt reconnection with exponential backoff
          if (reconnectAttempts.current < maxReconnectAttempts) {
            const delay = Math.pow(2, reconnectAttempts.current) * 1000; // Exponential backoff
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current++;
              console.log(`Reconnection attempt ${reconnectAttempts.current} for ${config.table}`);
              subscribe();
            }, delay);
          }
        } else if (status === 'CLOSED') {
          updateState({
            isSubscribed: false,
            isConnected: false,
            error: null,
          });
        }
      });

      channelRef.current = channel;

    } catch (error) {
      console.error(`Error setting up subscription for ${config.table}:`, error);
      updateState({
        isSubscribed: false,
        isConnected: false,
        error: error as Error,
      });
    }
  }, [config.table, config.event, config.filter, config.schema, memoizedCallback, cleanup, updateState]);

  const reconnect = useCallback(() => {
    reconnectAttempts.current = 0;
    subscribe();
  }, [subscribe]);

  const unsubscribe = useCallback(() => {
    cleanup();
    updateState({
      isSubscribed: false,
      isConnected: false,
      error: null,
    });
  }, [cleanup, updateState]);

  // Set up subscription on mount and config changes
  useEffect(() => {
    subscribe();
    return cleanup;
  }, [subscribe, cleanup]);

  // Monitor global connection state
  useEffect(() => {
    const handleConnect = () => {
      console.log('Supabase realtime connected');
      updateState({ isConnected: true });
    };

    const handleDisconnect = () => {
      console.log('Supabase realtime disconnected');
      updateState({ isConnected: false });
    };

    const handleError = (error: any) => {
      console.error('Supabase realtime error:', error);
      updateState({ error: new Error(error.message || 'Realtime connection error') });
    };

    // Listen to global realtime events
    supabase.realtime.onOpen(handleConnect);
    supabase.realtime.onClose(handleDisconnect);
    supabase.realtime.onError(handleError);

    return () => {
      // Note: Supabase doesn't provide off methods for global events
      // The cleanup will happen when the component unmounts
    };
  }, [updateState]);

  return {
    state,
    reconnect,
    unsubscribe,
  };
}

// Specialized hook for game room subscriptions
export function useGameRoomSubscription(
  roomId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  return useRealtimeSubscription(
    {
      table: 'game_rooms',
      event: '*',
      filter: `id=eq.${roomId}`,
    },
    callback,
    [roomId]
  );
}

// Specialized hook for team subscriptions
export function useTeamSubscription(
  roomId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  return useRealtimeSubscription(
    {
      table: 'teams',
      event: '*',
      filter: `game_room_id=eq.${roomId}`,
    },
    callback,
    [roomId]
  );
}

// Specialized hook for game state subscriptions
export function useGameStateSubscription(
  roomId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  return useRealtimeSubscription(
    {
      table: 'game_state',
      event: '*',
      filter: `game_room_id=eq.${roomId}`,
    },
    callback,
    [roomId]
  );
}

// Specialized hook for team answers subscriptions
export function useTeamAnswersSubscription(
  roomId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  return useRealtimeSubscription(
    {
      table: 'team_answers',
      event: '*',
      filter: `game_round_id=in.(select id from game_rounds where game_room_id = '${roomId}')`,
    },
    callback,
    [roomId]
  );
}

// Specialized hook for questions subscriptions
export function useQuestionsSubscription(
  roundId: string,
  callback: (payload: RealtimePostgresChangesPayload<any>) => void
) {
  return useRealtimeSubscription(
    {
      table: 'questions',
      event: '*',
      filter: `game_round_id=eq.${roundId}`,
    },
    callback,
    [roundId]
  );
} 
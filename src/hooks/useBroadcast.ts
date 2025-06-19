import { useState, useEffect, useCallback, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

// Game event types
interface GameStartedEvent {
  type: 'game_started';
  payload: {
    gameRoomId: string;
    startedAt: string;
    hostId: string;
  };
}

interface QuestionPresentedEvent {
  type: 'question_presented';
  payload: {
    questionId: string;
    roundId: string;
    question: {
      text: string;
      type: 'standard' | 'picture' | 'wager' | 'lightning';
      difficulty: number;
      points: number;
      media_url?: string;
    };
    timeLimit: number;
    presentedAt: string;
  };
}

interface RoundStartedEvent {
  type: 'round_started';
  payload: {
    roundId: string;
    roundNumber: number;
    roundType: 'standard' | 'picture' | 'wager' | 'lightning';
    startedAt: string;
  };
}

interface AnswersLockedEvent {
  type: 'answers_locked';
  payload: {
    questionId: string;
    lockedAt: string;
  };
}

interface ScoresUpdatedEvent {
  type: 'scores_updated';
  payload: {
    gameRoomId: string;
    scores: Array<{
      teamId: string;
      teamName: string;
      score: number;
    }>;
    updatedAt: string;
  };
}

interface GamePausedEvent {
  type: 'game_paused';
  payload: {
    gameRoomId: string;
    pausedAt: string;
    reason?: string;
  };
}

interface GameResumedEvent {
  type: 'game_resumed';
  payload: {
    gameRoomId: string;
    resumedAt: string;
  };
}

interface GameEndedEvent {
  type: 'game_ended';
  payload: {
    gameRoomId: string;
    endedAt: string;
    finalScores: Array<{
      teamId: string;
      teamName: string;
      score: number;
      rank: number;
    }>;
  };
}

type GameEvent = 
  | GameStartedEvent 
  | QuestionPresentedEvent 
  | RoundStartedEvent
  | AnswersLockedEvent 
  | ScoresUpdatedEvent 
  | GamePausedEvent 
  | GameResumedEvent 
  | GameEndedEvent;

interface UseBroadcastReturn {
  sendEvent: (event: GameEvent) => Promise<void>;
  isConnected: boolean;
  error: Error | null;
}

interface UseBroadcastListenerReturn {
  events: GameEvent[];
  lastEvent: GameEvent | null;
  isConnected: boolean;
  error: Error | null;
  clearEvents: () => void;
}

// Hook for sending broadcast events (typically used by game hosts)
export function useBroadcast(gameRoomId?: string): UseBroadcastReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const sendEvent = useCallback(async (event: GameEvent) => {
    if (!channelRef.current || !isConnected) {
      throw new Error('Not connected to broadcast channel');
    }

    try {
      const response = await channelRef.current.send({
        type: 'broadcast',
        event: event.type,
        payload: {
          ...event.payload,
          timestamp: new Date().toISOString()
        }
      });

      if (response !== 'ok') {
        throw new Error('Failed to send broadcast event');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to send event');
      setError(error);
      throw error;
    }
  }, [isConnected]);

  useEffect(() => {
    if (!gameRoomId) {
      setIsConnected(false);
      setError(null);
      return;
    }

    const channelName = `broadcast:game_room:${gameRoomId}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        setError(null);
      } else if (status === 'CHANNEL_ERROR') {
        setIsConnected(false);
        setError(new Error('Failed to connect to broadcast channel'));
      } else if (status === 'TIMED_OUT') {
        setIsConnected(false);
        setError(new Error('Broadcast connection timed out'));
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
      setError(null);
    };
  }, [gameRoomId]);

  return {
    sendEvent,
    isConnected,
    error
  };
}

// Hook for listening to broadcast events (used by all game participants)
export function useBroadcastListener(
  gameRoomId?: string,
  eventTypes?: GameEvent['type'][]
): UseBroadcastListenerReturn {
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [lastEvent, setLastEvent] = useState<GameEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const clearEvents = useCallback(() => {
    setEvents([]);
    setLastEvent(null);
  }, []);

  const handleBroadcastEvent = useCallback((event: any) => {
    try {
      const gameEvent: GameEvent = {
        type: event.event,
        payload: event.payload
      };

      // Filter by event types if specified
      if (eventTypes && !eventTypes.includes(gameEvent.type)) {
        return;
      }

      setEvents(prev => [...prev, gameEvent]);
      setLastEvent(gameEvent);
    } catch (err) {
      console.error('Error handling broadcast event:', err);
      setError(err instanceof Error ? err : new Error('Failed to handle broadcast event'));
    }
  }, [eventTypes]);

  useEffect(() => {
    if (!gameRoomId) {
      setEvents([]);
      setLastEvent(null);
      setIsConnected(false);
      setError(null);
      return;
    }

    const channelName = `broadcast:game_room:${gameRoomId}`;
    const channel = supabase.channel(channelName);
    channelRef.current = channel;

    // Listen to all broadcast events
    channel.on('broadcast', { event: '*' }, handleBroadcastEvent);

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        setError(null);
      } else if (status === 'CHANNEL_ERROR') {
        setIsConnected(false);
        setError(new Error('Failed to connect to broadcast channel'));
      } else if (status === 'TIMED_OUT') {
        setIsConnected(false);
        setError(new Error('Broadcast connection timed out'));
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setEvents([]);
      setLastEvent(null);
      setIsConnected(false);
      setError(null);
    };
  }, [gameRoomId, handleBroadcastEvent]);

  return {
    events,
    lastEvent,
    isConnected,
    error,
    clearEvents
  };
}

// Convenience hooks for specific event types
export function useGameEvents(gameRoomId?: string) {
  return useBroadcastListener(gameRoomId, [
    'game_started',
    'game_paused', 
    'game_resumed',
    'game_ended'
  ]);
}

export function useQuestionEvents(gameRoomId?: string) {
  return useBroadcastListener(gameRoomId, [
    'question_presented',
    'answers_locked'
  ]);
}

export function useScoreEvents(gameRoomId?: string) {
  return useBroadcastListener(gameRoomId, [
    'scores_updated'
  ]);
}

export function useRoundEvents(gameRoomId?: string) {
  return useBroadcastListener(gameRoomId, [
    'round_started'
  ]);
} 
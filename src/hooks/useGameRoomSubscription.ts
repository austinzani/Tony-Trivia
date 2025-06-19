import { useCallback, useEffect } from 'react';
import type { RealtimePostgresChangesPayload } from '../services/supabase';
import { supabase } from '../services/supabase';
import { useRealtimeSubscription } from './useRealtimeSubscription';

interface GameRoom {
  id: string;
  code: string;
  name: string;
  host_id: string;
  max_teams: number;
  is_public: boolean;
  status: 'lobby' | 'active' | 'paused' | 'finished';
  settings: Record<string, any>;
  created_at: string;
  started_at?: string;
  ended_at?: string;
}

interface UseGameRoomSubscriptionProps {
  roomId?: string;
  onGameRoomChange?: (gameRoom: GameRoom) => void;
  onGameRoomDelete?: (roomId: string) => void;
}

export function useGameRoomSubscription({
  roomId,
  onGameRoomChange,
  onGameRoomDelete
}: UseGameRoomSubscriptionProps) {
  const handleGameRoomUpdate = useCallback((payload: RealtimePostgresChangesPayload<GameRoom>) => {
    switch (payload.eventType) {
      case 'UPDATE':
        if (payload.new && onGameRoomChange) {
          onGameRoomChange(payload.new);
        }
        break;
      case 'DELETE':
        if (payload.old && onGameRoomDelete) {
          onGameRoomDelete(payload.old.id);
        }
        break;
    }
  }, [onGameRoomChange, onGameRoomDelete]);

  return useRealtimeSubscription(
    {
      table: 'game_rooms',
      event: '*',
      filter: roomId ? `id=eq.${roomId}` : undefined,
      schema: 'public'
    },
    handleGameRoomUpdate,
    [roomId]
  );
}

interface UseTeamSubscriptionProps {
  gameRoomId?: string;
  onTeamChange?: (team: any) => void;
  onTeamInsert?: (team: any) => void;
  onTeamDelete?: (teamId: string) => void;
}

export function useTeamSubscription({
  gameRoomId,
  onTeamChange,
  onTeamInsert,
  onTeamDelete
}: UseTeamSubscriptionProps) {
  const handleTeamUpdate = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new && onTeamInsert) {
          onTeamInsert(payload.new);
        }
        break;
      case 'UPDATE':
        if (payload.new && onTeamChange) {
          onTeamChange(payload.new);
        }
        break;
      case 'DELETE':
        if (payload.old && onTeamDelete) {
          onTeamDelete(payload.old.id);
        }
        break;
    }
  }, [onTeamChange, onTeamInsert, onTeamDelete]);

  return useRealtimeSubscription(
    {
      table: 'teams',
      event: '*',
      filter: gameRoomId ? `game_room_id=eq.${gameRoomId}` : undefined,
      schema: 'public'
    },
    handleTeamUpdate,
    [gameRoomId]
  );
}

interface UseGameStateSubscriptionProps {
  gameRoomId?: string;
  onGameStateChange?: (gameState: any) => void;
}

export function useGameStateSubscription({
  gameRoomId,
  onGameStateChange
}: UseGameStateSubscriptionProps) {
  const handleGameStateUpdate = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new && onGameStateChange) {
      onGameStateChange(payload.new);
    }
  }, [onGameStateChange]);

  return useRealtimeSubscription(
    {
      table: 'game_state',
      event: '*',
      filter: gameRoomId ? `game_room_id=eq.${gameRoomId}` : undefined,
      schema: 'public'
    },
    handleGameStateUpdate,
    [gameRoomId]
  );
}

interface UseTeamAnswersSubscriptionProps {
  gameRoomId?: string;
  onAnswerSubmitted?: (answer: any) => void;
  onAnswerUpdated?: (answer: any) => void;
}

export function useTeamAnswersSubscription({
  gameRoomId,
  onAnswerSubmitted,
  onAnswerUpdated
}: UseTeamAnswersSubscriptionProps) {
  const handleAnswerUpdate = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new && onAnswerSubmitted) {
          onAnswerSubmitted(payload.new);
        }
        break;
      case 'UPDATE':
        if (payload.new && onAnswerUpdated) {
          onAnswerUpdated(payload.new);
        }
        break;
    }
  }, [onAnswerSubmitted, onAnswerUpdated]);

  return useRealtimeSubscription(
    {
      table: 'team_answers',
      event: '*',
      filter: gameRoomId ? `team_id=in.(select id from teams where game_room_id='${gameRoomId}')` : undefined,
      schema: 'public'
    },
    handleAnswerUpdate,
    [gameRoomId]
  );
}

// Export all hooks
export {
  useGameRoomSubscription as default,
  useTeamSubscription,
  useGameStateSubscription,
  useTeamAnswersSubscription
}; 
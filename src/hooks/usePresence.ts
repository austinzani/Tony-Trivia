import { useState, useEffect, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '../services/supabase';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

interface UserPresence {
  user_id: string;
  username: string;
  team_id?: string;
  role?: 'host' | 'player';
  joined_at: string;
  last_seen: string;
}

interface PresenceState {
  [key: string]: UserPresence[];
}

interface UsePresenceReturn {
  onlineUsers: PresenceState;
  userCount: number;
  isConnected: boolean;
  error: Error | null;
  joinRoom: () => Promise<void>;
  leaveRoom: () => void;
}

export function usePresence(gameRoomId?: string): UsePresenceReturn {
  const { user, profile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<PresenceState>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const hasJoinedRef = useRef(false);

  const userCount = Object.keys(onlineUsers).length;

  const joinRoom = useCallback(async () => {
    if (!gameRoomId || !user || !profile || hasJoinedRef.current) {
      return;
    }

    try {
      const presenceData: UserPresence = {
        user_id: user.id,
        username: profile.display_name || profile.username || 'Anonymous',
        joined_at: new Date().toISOString(),
        last_seen: new Date().toISOString()
      };

      if (channelRef.current) {
        await channelRef.current.track(presenceData);
        hasJoinedRef.current = true;
      }
    } catch (err) {
      console.error('Error joining room presence:', err);
      setError(err instanceof Error ? err : new Error('Failed to join room'));
    }
  }, [gameRoomId, user, profile]);

  const leaveRoom = useCallback(() => {
    if (channelRef.current && hasJoinedRef.current) {
      channelRef.current.untrack();
      hasJoinedRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!gameRoomId) {
      setOnlineUsers({});
      setIsConnected(false);
      setError(null);
      return;
    }

    const channelName = `presence:game_room:${gameRoomId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user?.id || 'anonymous'
        }
      }
    });

    channelRef.current = channel;

    // Handle presence sync
    channel.on('presence', { event: 'sync' }, () => {
      const newState = channel.presenceState<UserPresence>();
      setOnlineUsers(newState);
      setIsConnected(true);
      setError(null);
    });

    // Handle user joins
    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User joined:', key, newPresences);
    });

    // Handle user leaves
    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User left:', key, leftPresences);
    });

    // Subscribe to the channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        setError(null);
        // Auto-join if user is authenticated
        if (user && profile) {
          await joinRoom();
        }
      } else if (status === 'CHANNEL_ERROR') {
        setIsConnected(false);
        setError(new Error('Failed to connect to presence channel'));
      } else if (status === 'TIMED_OUT') {
        setIsConnected(false);
        setError(new Error('Connection timed out'));
      }
    });

    // Cleanup function
    return () => {
      leaveRoom();
      channel.unsubscribe();
      channelRef.current = null;
      hasJoinedRef.current = false;
      setOnlineUsers({});
      setIsConnected(false);
      setError(null);
    };
  }, [gameRoomId, user, profile, joinRoom, leaveRoom]);

  // Update last_seen periodically
  useEffect(() => {
    if (!isConnected || !hasJoinedRef.current || !user || !profile) {
      return;
    }

    const interval = setInterval(() => {
      if (channelRef.current) {
        const presenceData: UserPresence = {
          user_id: user.id,
          username: profile.display_name || profile.username || 'Anonymous',
          joined_at: new Date().toISOString(), // This should be the original join time in a real app
          last_seen: new Date().toISOString()
        };

        channelRef.current.track(presenceData);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, user, profile]);

  return {
    onlineUsers,
    userCount,
    isConnected,
    error,
    joinRoom,
    leaveRoom
  };
}

// Hook for getting online users list in a more convenient format
export function useOnlineUsersList(gameRoomId?: string) {
  const { onlineUsers, userCount, isConnected, error } = usePresence(gameRoomId);

  const usersList = Object.entries(onlineUsers).flatMap(([key, presences]) =>
    presences.map(presence => ({
      key,
      ...presence
    }))
  );

  const sortedUsers = usersList.sort((a, b) => {
    // Sort by role (host first), then by join time
    if (a.role === 'host' && b.role !== 'host') return -1;
    if (b.role === 'host' && a.role !== 'host') return 1;
    return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
  });

  return {
    users: sortedUsers,
    userCount,
    isConnected,
    error
  };
} 
import { useState, useEffect, useCallback, useRef } from 'react';
import { enhancedPresenceService, type EnhancedUserPresence, type PresenceEvent, type PresenceMetrics } from '../services/enhancedPresenceService';
import { useAuth } from './useAuth';

interface UseEnhancedPresenceOptions {
  contextType: 'room' | 'team';
  contextId: string;
  userRole?: 'host' | 'player' | 'spectator' | 'guest';
  autoJoin?: boolean;
  enableMetrics?: boolean;
}

interface UseEnhancedPresenceReturn {
  // Presence State
  users: EnhancedUserPresence[];
  onlineUsers: EnhancedUserPresence[];
  currentUser: EnhancedUserPresence | null;
  userCount: number;
  onlineCount: number;
  
  // Metrics
  metrics: PresenceMetrics | null;
  
  // Connection State
  isConnected: boolean;
  sessionId: string | null;
  error: Error | null;
  
  // Actions
  joinPresence: (role?: 'host' | 'player' | 'spectator' | 'guest') => Promise<void>;
  leavePresence: () => Promise<void>;
  updateStatus: (status: EnhancedUserPresence['status']) => Promise<void>;
  updateActivity: (activity: EnhancedUserPresence['current_activity']) => Promise<void>;
  updateTeam: (teamId: string, teamName: string) => Promise<void>;
  
  // Event Handlers
  onUserJoined: (callback: (user: EnhancedUserPresence) => void) => () => void;
  onUserLeft: (callback: (user: EnhancedUserPresence) => void) => () => void;
  onStatusChanged: (callback: (user: EnhancedUserPresence, previousData: Partial<EnhancedUserPresence>) => void) => () => void;
  
  // Utility Functions
  getUserByRole: (role: string) => EnhancedUserPresence[];
  getUsersByStatus: (status: string) => EnhancedUserPresence[];
  getUsersByActivity: (activity: string) => EnhancedUserPresence[];
  isUserOnline: (userId: string) => boolean;
  getUserPresence: (userId: string) => EnhancedUserPresence | null;
}

export function useEnhancedPresence({
  contextType,
  contextId,
  userRole = 'player',
  autoJoin = true,
  enableMetrics = true
}: UseEnhancedPresenceOptions): UseEnhancedPresenceReturn {
  const { user, profile } = useAuth();
  
  // State
  const [users, setUsers] = useState<EnhancedUserPresence[]>([]);
  const [metrics, setMetrics] = useState<PresenceMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  // Refs
  const eventUnsubscribeRef = useRef<(() => void) | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Computed values
  const onlineUsers = users.filter(u => ['online', 'away', 'busy', 'in_game'].includes(u.status));
  const currentUser = users.find(u => u.user_id === user?.id) || null;
  const userCount = users.length;
  const onlineCount = onlineUsers.length;

  // Join presence
  const joinPresence = useCallback(async (role: 'host' | 'player' | 'spectator' | 'guest' = userRole) => {
    if (!user || !profile || !contextId) {
      throw new Error('User not authenticated or context not provided');
    }

    try {
      setError(null);
      
      const userPresence: Omit<EnhancedUserPresence, 'joined_at' | 'last_seen' | 'session_id' | 'device_info'> = {
        user_id: user.id,
        username: profile.display_name || profile.username || 'Anonymous',
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        role,
        status: 'online',
        current_activity: 'lobby',
        network_quality: 'good'
      };

      const newSessionId = await enhancedPresenceService.joinPresence(
        contextType,
        contextId,
        userPresence
      );

      setSessionId(newSessionId);
      setIsConnected(true);

      // Set up event listener
      const unsubscribe = enhancedPresenceService.onPresenceEvent(
        contextType,
        contextId,
        handlePresenceEvent
      );
      eventUnsubscribeRef.current = unsubscribe;

      // Set up metrics polling if enabled
      if (enableMetrics) {
        metricsIntervalRef.current = setInterval(() => {
          const newMetrics = enhancedPresenceService.getPresenceMetrics(contextType, contextId);
          setMetrics(newMetrics);
        }, 5000); // Update metrics every 5 seconds
      }

      // Initial state sync
      syncPresenceState();
    } catch (err) {
      console.error('Failed to join presence:', err);
      setError(err instanceof Error ? err : new Error('Failed to join presence'));
      throw err;
    }
  }, [user, profile, contextId, contextType, userRole, enableMetrics]);

  // Leave presence
  const leavePresence = useCallback(async () => {
    if (!sessionId) return;

    try {
      setError(null);
      
      await enhancedPresenceService.leavePresence(contextType, contextId, sessionId);
      
      // Clean up
      if (eventUnsubscribeRef.current) {
        eventUnsubscribeRef.current();
        eventUnsubscribeRef.current = null;
      }
      
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
        metricsIntervalRef.current = null;
      }
      
      setIsConnected(false);
      setSessionId(null);
      setUsers([]);
      setMetrics(null);
    } catch (err) {
      console.error('Failed to leave presence:', err);
      setError(err instanceof Error ? err : new Error('Failed to leave presence'));
    }
  }, [sessionId, contextType, contextId]);

  // Update status
  const updateStatus = useCallback(async (status: EnhancedUserPresence['status']) => {
    if (!sessionId) throw new Error('Not connected to presence');
    
    try {
      await enhancedPresenceService.updatePresence(contextType, contextId, sessionId, { status });
    } catch (err) {
      console.error('Failed to update status:', err);
      throw err;
    }
  }, [sessionId, contextType, contextId]);

  // Update activity
  const updateActivity = useCallback(async (activity: EnhancedUserPresence['current_activity']) => {
    if (!sessionId) throw new Error('Not connected to presence');
    
    try {
      await enhancedPresenceService.updatePresence(contextType, contextId, sessionId, { current_activity: activity });
    } catch (err) {
      console.error('Failed to update activity:', err);
      throw err;
    }
  }, [sessionId, contextType, contextId]);

  // Update team
  const updateTeam = useCallback(async (teamId: string, teamName: string) => {
    if (!sessionId) throw new Error('Not connected to presence');
    
    try {
      await enhancedPresenceService.updatePresence(contextType, contextId, sessionId, { 
        team_id: teamId, 
        team_name: teamName 
      });
    } catch (err) {
      console.error('Failed to update team:', err);
      throw err;
    }
  }, [sessionId, contextType, contextId]);

  // Event handlers
  const onUserJoined = useCallback((callback: (user: EnhancedUserPresence) => void) => {
    return enhancedPresenceService.onPresenceEvent(contextType, contextId, (event) => {
      if (event.type === 'user_joined') {
        callback(event.presence_data);
      }
    });
  }, [contextType, contextId]);

  const onUserLeft = useCallback((callback: (user: EnhancedUserPresence) => void) => {
    return enhancedPresenceService.onPresenceEvent(contextType, contextId, (event) => {
      if (event.type === 'user_left') {
        callback(event.presence_data);
      }
    });
  }, [contextType, contextId]);

  const onStatusChanged = useCallback((callback: (user: EnhancedUserPresence, previousData: Partial<EnhancedUserPresence>) => void) => {
    return enhancedPresenceService.onPresenceEvent(contextType, contextId, (event) => {
      if (event.type === 'status_changed' && event.previous_data) {
        callback(event.presence_data, event.previous_data);
      }
    });
  }, [contextType, contextId]);

  // Utility functions
  const getUserByRole = useCallback((role: string) => {
    return users.filter(user => user.role === role);
  }, [users]);

  const getUsersByStatus = useCallback((status: string) => {
    return users.filter(user => user.status === status);
  }, [users]);

  const getUsersByActivity = useCallback((activity: string) => {
    return users.filter(user => user.current_activity === activity);
  }, [users]);

  const isUserOnline = useCallback((userId: string) => {
    const user = users.find(u => u.user_id === userId);
    return user ? ['online', 'away', 'busy', 'in_game'].includes(user.status) : false;
  }, [users]);

  const getUserPresence = useCallback((userId: string) => {
    return users.find(u => u.user_id === userId) || null;
  }, [users]);

  // Handle presence events
  const handlePresenceEvent = useCallback((event: PresenceEvent) => {
    syncPresenceState();
  }, []);

  // Sync presence state
  const syncPresenceState = useCallback(() => {
    const currentUsers = enhancedPresenceService.getPresenceState(contextType, contextId);
    setUsers(currentUsers);
    
    if (enableMetrics) {
      const currentMetrics = enhancedPresenceService.getPresenceMetrics(contextType, contextId);
      setMetrics(currentMetrics);
    }
  }, [contextType, contextId, enableMetrics]);

  // Auto-join effect
  useEffect(() => {
    if (autoJoin && user && profile && contextId && !isConnected) {
      joinPresence().catch(console.error);
    }
  }, [autoJoin, user, profile, contextId, isConnected, joinPresence]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (eventUnsubscribeRef.current) {
        eventUnsubscribeRef.current();
      }
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, []);

  // Auto-leave on unmount or context change
  useEffect(() => {
    return () => {
      if (isConnected) {
        leavePresence().catch(console.error);
      }
    };
  }, [isConnected, leavePresence]);

  return {
    // State
    users,
    onlineUsers,
    currentUser,
    userCount,
    onlineCount,
    metrics,
    isConnected,
    sessionId,
    error,
    
    // Actions
    joinPresence,
    leavePresence,
    updateStatus,
    updateActivity,
    updateTeam,
    
    // Event Handlers
    onUserJoined,
    onUserLeft,
    onStatusChanged,
    
    // Utilities
    getUserByRole,
    getUsersByStatus,
    getUsersByActivity,
    isUserOnline,
    getUserPresence
  };
} 
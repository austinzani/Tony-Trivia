import { useState, useEffect, useCallback, useRef } from 'react';
import type { RealtimeChannel } from '../services/supabase';
import { supabase } from '../services/supabase';
import { useAuth } from './useAuth';

interface TeamMemberStatus {
  user_id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  role: 'captain' | 'member';
  status: 'online' | 'away' | 'offline' | 'in_game' | 'ready';
  team_id: string;
  joined_at: string;
  last_seen: string;
  current_activity?: 'browsing' | 'in_game' | 'idle';
  game_room_id?: string;
  device_info?: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser?: string;
  };
}

interface TeamActivity {
  id: string;
  type: 'member_joined' | 'member_left' | 'status_changed' | 'role_changed' | 'game_joined' | 'game_left';
  user_id: string;
  username: string;
  team_id: string;
  timestamp: string;
  metadata?: {
    old_status?: string;
    new_status?: string;
    old_role?: string;
    new_role?: string;
    game_room_id?: string;
  };
}

interface TeamPresenceState {
  [user_id: string]: TeamMemberStatus;
}

interface UseTeamPresenceReturn {
  teamMembers: TeamPresenceState;
  memberCount: number;
  onlineCount: number;
  activities: TeamActivity[];
  isConnected: boolean;
  error: Error | null;
  updateStatus: (status: TeamMemberStatus['status']) => Promise<void>;
  updateActivity: (activity: TeamMemberStatus['current_activity']) => Promise<void>;
  joinTeamPresence: () => Promise<void>;
  leaveTeamPresence: () => void;
  getTeamMemberStatus: (userId: string) => TeamMemberStatus | null;
  getOnlineMembers: () => TeamMemberStatus[];
  getActiveMembersInGame: (gameRoomId: string) => TeamMemberStatus[];
}

export function useTeamPresence(teamId?: string): UseTeamPresenceReturn {
  const { user, profile } = useAuth();
  const [teamMembers, setTeamMembers] = useState<TeamPresenceState>({});
  const [activities, setActivities] = useState<TeamActivity[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const activityChannelRef = useRef<RealtimeChannel | null>(null);
  const hasJoinedRef = useRef(false);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const memberCount = Object.keys(teamMembers).length;
  const onlineCount = Object.values(teamMembers).filter(
    member => ['online', 'away', 'in_game', 'ready'].includes(member.status)
  ).length;

  // Get device info
  const getDeviceInfo = useCallback(() => {
    const userAgent = navigator.userAgent;
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    let browser = 'unknown';

    // Detect device type
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      deviceType = 'tablet';
    } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      deviceType = 'mobile';
    }

    // Detect browser
    if (userAgent.includes('Chrome')) browser = 'chrome';
    else if (userAgent.includes('Firefox')) browser = 'firefox';
    else if (userAgent.includes('Safari')) browser = 'safari';
    else if (userAgent.includes('Edge')) browser = 'edge';

    return { type: deviceType, browser };
  }, []);

  // Update member status
  const updateStatus = useCallback(async (status: TeamMemberStatus['status']) => {
    if (!presenceChannelRef.current || !user || !profile || !teamId) return;

    try {
      const memberData: TeamMemberStatus = {
        user_id: user.id,
        username: profile.display_name || profile.username || 'Anonymous',
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        role: 'member', // This would be fetched from team data in real app
        status,
        team_id: teamId,
        joined_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        device_info: getDeviceInfo()
      };

      await presenceChannelRef.current.track(memberData);

      // Record status change activity
      const activity: TeamActivity = {
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'status_changed',
        user_id: user.id,
        username: memberData.username,
        team_id: teamId,
        timestamp: new Date().toISOString(),
        metadata: {
          new_status: status
        }
      };

      // Send activity to activity channel
      if (activityChannelRef.current) {
        await activityChannelRef.current.send({
          type: 'broadcast',
          event: 'team_activity',
          payload: activity
        });
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err instanceof Error ? err : new Error('Failed to update status'));
    }
  }, [teamId, user, profile, getDeviceInfo]);

  // Update current activity
  const updateActivity = useCallback(async (activity: TeamMemberStatus['current_activity']) => {
    if (!presenceChannelRef.current || !user || !profile || !teamId) return;

    try {
      const currentMember = teamMembers[user.id];
      if (!currentMember) return;

      const updatedMember: TeamMemberStatus = {
        ...currentMember,
        current_activity: activity,
        last_seen: new Date().toISOString()
      };

      await presenceChannelRef.current.track(updatedMember);
    } catch (err) {
      console.error('Error updating activity:', err);
    }
  }, [teamId, user, profile, teamMembers]);

  // Join team presence
  const joinTeamPresence = useCallback(async () => {
    if (!teamId || !user || !profile || hasJoinedRef.current) return;

    try {
      const memberData: TeamMemberStatus = {
        user_id: user.id,
        username: profile.display_name || profile.username || 'Anonymous',
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        role: 'member', // This would be fetched from team data in real app
        status: 'online',
        team_id: teamId,
        joined_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        current_activity: 'browsing',
        device_info: getDeviceInfo()
      };

      if (presenceChannelRef.current) {
        await presenceChannelRef.current.track(memberData);
        hasJoinedRef.current = true;

        // Send join activity
        const activity: TeamActivity = {
          id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'member_joined',
          user_id: user.id,
          username: memberData.username,
          team_id: teamId,
          timestamp: new Date().toISOString()
        };

        if (activityChannelRef.current) {
          await activityChannelRef.current.send({
            type: 'broadcast',
            event: 'team_activity',
            payload: activity
          });
        }
      }
    } catch (err) {
      console.error('Error joining team presence:', err);
      setError(err instanceof Error ? err : new Error('Failed to join team presence'));
    }
  }, [teamId, user, profile, getDeviceInfo]);

  // Leave team presence
  const leaveTeamPresence = useCallback(() => {
    if (presenceChannelRef.current && hasJoinedRef.current && user && teamId) {
      // Send leave activity before untracking
      const activity: TeamActivity = {
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'member_left',
        user_id: user.id,
        username: profile?.display_name || profile?.username || 'Anonymous',
        team_id: teamId,
        timestamp: new Date().toISOString()
      };

      if (activityChannelRef.current) {
        activityChannelRef.current.send({
          type: 'broadcast',
          event: 'team_activity',
          payload: activity
        });
      }

      presenceChannelRef.current.untrack();
      hasJoinedRef.current = false;
    }
  }, [user, profile, teamId]);

  // Get team member status
  const getTeamMemberStatus = useCallback((userId: string): TeamMemberStatus | null => {
    return teamMembers[userId] || null;
  }, [teamMembers]);

  // Get online members
  const getOnlineMembers = useCallback((): TeamMemberStatus[] => {
    return Object.values(teamMembers).filter(
      member => ['online', 'away', 'in_game', 'ready'].includes(member.status)
    );
  }, [teamMembers]);

  // Get active members in specific game
  const getActiveMembersInGame = useCallback((gameRoomId: string): TeamMemberStatus[] => {
    return Object.values(teamMembers).filter(
      member => member.game_room_id === gameRoomId && member.status === 'in_game'
    );
  }, [teamMembers]);

  // Set up presence channel
  useEffect(() => {
    if (!teamId) {
      setTeamMembers({});
      setActivities([]);
      setIsConnected(false);
      setError(null);
      return;
    }

    const presenceChannelName = `team_presence:${teamId}`;
    const activityChannelName = `team_activity:${teamId}`;

    // Create presence channel
    const presenceChannel = supabase.channel(presenceChannelName, {
      config: {
        presence: {
          key: user?.id || 'anonymous'
        }
      }
    });

    // Create activity channel
    const activityChannel = supabase.channel(activityChannelName);

    presenceChannelRef.current = presenceChannel;
    activityChannelRef.current = activityChannel;

    // Handle presence sync
    presenceChannel.on('presence', { event: 'sync' }, () => {
      const newState = presenceChannel.presenceState<TeamMemberStatus>();
      const flattenedState: TeamPresenceState = {};
      
      Object.entries(newState).forEach(([key, presences]) => {
        if (presences.length > 0) {
          // Use the most recent presence data
          flattenedState[key] = presences[presences.length - 1];
        }
      });

      setTeamMembers(flattenedState);
      setIsConnected(true);
      setError(null);
    });

    // Handle member joins
    presenceChannel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('Team member joined:', key, newPresences);
    });

    // Handle member leaves
    presenceChannel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('Team member left:', key, leftPresences);
    });

    // Handle team activities
    activityChannel.on('broadcast', { event: 'team_activity' }, ({ payload }) => {
      const activity = payload as TeamActivity;
      setActivities(prev => [activity, ...prev.slice(0, 49)]); // Keep last 50 activities
    });

    // Subscribe to channels
    Promise.all([
      presenceChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
          if (user && profile) {
            await joinTeamPresence();
          }
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setError(new Error('Failed to connect to team presence'));
        }
      }),
      activityChannel.subscribe()
    ]);

    // Cleanup function
    return () => {
      leaveTeamPresence();
      presenceChannel.unsubscribe();
      activityChannel.unsubscribe();
      presenceChannelRef.current = null;
      activityChannelRef.current = null;
      hasJoinedRef.current = false;
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      
      setTeamMembers({});
      setActivities([]);
      setIsConnected(false);
      setError(null);
    };
  }, [teamId, user, profile, joinTeamPresence, leaveTeamPresence]);

  // Heartbeat to update last_seen
  useEffect(() => {
    if (!isConnected || !hasJoinedRef.current || !user || !profile || !teamId) {
      return;
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (presenceChannelRef.current && teamMembers[user.id]) {
        const updatedMember: TeamMemberStatus = {
          ...teamMembers[user.id],
          last_seen: new Date().toISOString()
        };

        presenceChannelRef.current.track(updatedMember);
      }
    }, 30000); // Update every 30 seconds

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [isConnected, user, profile, teamId, teamMembers]);

  // Auto-detect away status based on page visibility
  useEffect(() => {
    if (!isConnected || !hasJoinedRef.current) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateStatus('away');
      } else {
        updateStatus('online');
      }
    };

    const handleBeforeUnload = () => {
      updateStatus('offline');
      leaveTeamPresence();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isConnected, updateStatus, leaveTeamPresence]);

  return {
    teamMembers,
    memberCount,
    onlineCount,
    activities,
    isConnected,
    error,
    updateStatus,
    updateActivity,
    joinTeamPresence,
    leaveTeamPresence,
    getTeamMemberStatus,
    getOnlineMembers,
    getActiveMembersInGame
  };
} 
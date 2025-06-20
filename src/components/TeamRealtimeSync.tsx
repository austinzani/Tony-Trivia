import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Activity,
  Zap,
} from 'lucide-react';
import { useTeamPresence } from '../hooks/useTeamPresence';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase';
import type { RealtimeChannel } from '../services/supabase';

interface TeamRealtimeSyncProps {
  teamId: string;
  gameRoomId?: string;
  onTeamUpdate?: (team: any) => void;
  onMemberUpdate?: (members: any[]) => void;
  onActivityUpdate?: (activities: any[]) => void;
  showConnectionStatus?: boolean;
  enableBroadcast?: boolean;
  className?: string;
}

interface SyncStatus {
  connected: boolean;
  lastSync: Date | null;
  syncErrors: number;
  reconnectAttempts: number;
  latency: number;
  memberCount: number;
  activeMembers: number;
}

interface BroadcastMessage {
  type:
    | 'team_update'
    | 'member_join'
    | 'member_leave'
    | 'status_change'
    | 'activity'
    | 'ping';
  payload: any;
  timestamp: string;
  sender_id: string;
  team_id: string;
}

export const TeamRealtimeSync: React.FC<TeamRealtimeSyncProps> = ({
  teamId,
  gameRoomId,
  onTeamUpdate,
  onMemberUpdate,
  onActivityUpdate,
  showConnectionStatus = true,
  enableBroadcast = true,
  className = '',
}) => {
  const { user } = useAuth();
  const {
    members,
    activities,
    connectionStatus,
    updateMemberStatus,
    broadcastActivity,
  } = useTeamPresence(teamId);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    connected: false,
    lastSync: null,
    syncErrors: 0,
    reconnectAttempts: 0,
    latency: 0,
    memberCount: 0,
    activeMembers: 0,
  });

  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastPingTime, setLastPingTime] = useState<number>(0);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize real-time synchronization
  useEffect(() => {
    if (!teamId || !user) return;

    const initializeSync = async () => {
      try {
        // Create dedicated sync channel for this team
        const channel = supabase.channel(`team-sync:${teamId}`, {
          config: {
            presence: { key: user.id },
            broadcast: { self: true },
          },
        });

        channelRef.current = channel;

        // Handle presence updates (member join/leave)
        channel
          .on('presence', { event: 'sync' }, () => {
            const presenceState = channel.presenceState();
            const memberIds = Object.keys(presenceState);

            setSyncStatus(prev => ({
              ...prev,
              memberCount: memberIds.length,
              activeMembers: memberIds.length,
              lastSync: new Date(),
              connected: true,
            }));

            // Notify parent component of member updates
            if (onMemberUpdate) {
              const memberData = memberIds.map(id => presenceState[id][0]);
              onMemberUpdate(memberData);
            }
          })
          .on('presence', { event: 'join' }, ({ key, newPresences }) => {
            console.log('Member joined:', key, newPresences);

            // Broadcast member join activity
            if (enableBroadcast && key !== user.id) {
              broadcastMessage({
                type: 'member_join',
                payload: { user_id: key, joined_at: new Date().toISOString() },
                timestamp: new Date().toISOString(),
                sender_id: user.id,
                team_id: teamId,
              });
            }
          })
          .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
            console.log('Member left:', key, leftPresences);

            // Broadcast member leave activity
            if (enableBroadcast && key !== user.id) {
              broadcastMessage({
                type: 'member_leave',
                payload: { user_id: key, left_at: new Date().toISOString() },
                timestamp: new Date().toISOString(),
                sender_id: user.id,
                team_id: teamId,
              });
            }
          });

        // Handle broadcast messages
        if (enableBroadcast) {
          channel.on('broadcast', { event: 'team_message' }, ({ payload }) => {
            handleBroadcastMessage(payload);
          });

          channel.on('broadcast', { event: 'ping' }, ({ payload }) => {
            if (payload.sender_id !== user.id) {
              // Respond to ping
              channel.send({
                type: 'broadcast',
                event: 'pong',
                payload: {
                  original_timestamp: payload.timestamp,
                  response_timestamp: Date.now(),
                  sender_id: user.id,
                },
              });
            }
          });

          channel.on('broadcast', { event: 'pong' }, ({ payload }) => {
            if (payload.sender_id !== user.id) {
              const latency = Date.now() - payload.original_timestamp;
              setSyncStatus(prev => ({ ...prev, latency }));
            }
          });
        }

        // Subscribe to channel
        const subscriptionStatus = await channel.subscribe(async status => {
          if (status === 'SUBSCRIBED') {
            setSyncStatus(prev => ({
              ...prev,
              connected: true,
              syncErrors: 0,
              reconnectAttempts: 0,
            }));

            // Track presence with user info
            await channel.track({
              user_id: user.id,
              username:
                user.username || user.email?.split('@')[0] || 'Anonymous',
              status: 'online',
              joined_at: new Date().toISOString(),
              team_id: teamId,
              game_room_id: gameRoomId,
            });

            // Start ping interval for latency monitoring
            if (enableBroadcast) {
              startPingInterval();
            }

            setIsReconnecting(false);
          } else if (status === 'CHANNEL_ERROR') {
            setSyncStatus(prev => ({
              ...prev,
              connected: false,
              syncErrors: prev.syncErrors + 1,
            }));

            attemptReconnect();
          } else if (status === 'TIMED_OUT') {
            setSyncStatus(prev => ({
              ...prev,
              connected: false,
            }));

            attemptReconnect();
          }
        });
      } catch (error) {
        console.error('Failed to initialize team sync:', error);
        setSyncStatus(prev => ({
          ...prev,
          connected: false,
          syncErrors: prev.syncErrors + 1,
        }));
      }
    };

    initializeSync();

    return () => {
      cleanup();
    };
  }, [teamId, user?.id, gameRoomId]);

  // Cleanup function
  const cleanup = () => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  // Start ping interval for latency monitoring
  const startPingInterval = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }

    pingIntervalRef.current = setInterval(() => {
      if (channelRef.current && enableBroadcast) {
        const timestamp = Date.now();
        setLastPingTime(timestamp);

        channelRef.current.send({
          type: 'broadcast',
          event: 'ping',
          payload: {
            timestamp,
            sender_id: user?.id,
          },
        });
      }
    }, 30000); // Ping every 30 seconds
  };

  // Handle broadcast messages
  const handleBroadcastMessage = (message: BroadcastMessage) => {
    console.log('Received broadcast message:', message);

    switch (message.type) {
      case 'team_update':
        if (onTeamUpdate) {
          onTeamUpdate(message.payload);
        }
        break;

      case 'member_join':
      case 'member_leave':
      case 'status_change':
        // Handle member updates
        if (onMemberUpdate) {
          // Trigger member list refresh
          onMemberUpdate(members);
        }
        break;

      case 'activity':
        if (onActivityUpdate) {
          onActivityUpdate([...activities, message.payload]);
        }
        break;
    }
  };

  // Broadcast message to all team members
  const broadcastMessage = (message: BroadcastMessage) => {
    if (channelRef.current && enableBroadcast) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'team_message',
        payload: message,
      });
    }
  };

  // Attempt reconnection
  const attemptReconnect = () => {
    if (isReconnecting) return;

    setIsReconnecting(true);
    setSyncStatus(prev => ({
      ...prev,
      reconnectAttempts: prev.reconnectAttempts + 1,
    }));

    const delay = Math.min(
      1000 * Math.pow(2, syncStatus.reconnectAttempts),
      30000
    );

    reconnectTimeoutRef.current = setTimeout(() => {
      if (channelRef.current) {
        channelRef.current.subscribe();
      }
    }, delay);
  };

  // Manual reconnect
  const handleManualReconnect = () => {
    cleanup();
    setSyncStatus(prev => ({
      ...prev,
      reconnectAttempts: 0,
      syncErrors: 0,
    }));

    // Re-initialize after a short delay
    setTimeout(() => {
      if (teamId && user) {
        // Trigger re-initialization by updating a dependency
      }
    }, 1000);
  };

  // Update sync status based on connection status
  useEffect(() => {
    setSyncStatus(prev => ({
      ...prev,
      connected: connectionStatus.connected,
      memberCount: members.length,
      activeMembers: members.filter(
        m => m.status === 'online' || m.status === 'in_game'
      ).length,
    }));
  }, [connectionStatus.connected, members]);

  if (!showConnectionStatus) {
    return null;
  }

  return (
    <div className={`team-realtime-sync ${className}`}>
      <AnimatePresence>
        {syncStatus.connected ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg"
          >
            <Wifi className="w-4 h-4" />
            <span className="text-sm font-medium">Live Sync Active</span>
            <div className="flex items-center space-x-2 text-xs text-green-500">
              <Users className="w-3 h-3" />
              <span>
                {syncStatus.activeMembers}/{syncStatus.memberCount}
              </span>
              {syncStatus.latency > 0 && (
                <>
                  <Zap className="w-3 h-3" />
                  <span>{syncStatus.latency}ms</span>
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              {isReconnecting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {isReconnecting ? 'Reconnecting...' : 'Connection Lost'}
              </span>
              {syncStatus.syncErrors > 0 && (
                <span className="text-xs">
                  ({syncStatus.syncErrors} errors)
                </span>
              )}
            </div>

            {!isReconnecting && (
              <button
                onClick={handleManualReconnect}
                className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded transition-colors"
              >
                Retry
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync Status Details (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 text-xs text-gray-500 space-y-1">
          <div>
            Last Sync: {syncStatus.lastSync?.toLocaleTimeString() || 'Never'}
          </div>
          <div>Reconnect Attempts: {syncStatus.reconnectAttempts}</div>
          <div>Sync Errors: {syncStatus.syncErrors}</div>
          {syncStatus.latency > 0 && <div>Latency: {syncStatus.latency}ms</div>}
        </div>
      )}
    </div>
  );
};

// Hook for easier integration
export function useTeamRealtimeSync(
  teamId: string,
  gameRoomId: string,
  callbacks: Omit<TeamRealtimeSyncProps, 'teamId' | 'gameRoomId'>
) {
  return (
    <TeamRealtimeSync teamId={teamId} gameRoomId={gameRoomId} {...callbacks} />
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Circle,
  Crown,
  Gamepad2,
  Eye,
  UserPlus,
  Wifi,
  WifiOff,
  Monitor,
  Smartphone,
  Tablet,
  Clock,
  Activity,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
} from 'lucide-react';
import { useEnhancedPresence } from '../hooks/useEnhancedPresence';
import type { EnhancedUserPresence } from '../services/enhancedPresenceService';

interface EnhancedPresenceDisplayProps {
  contextType: 'room' | 'team';
  contextId: string;
  userRole?: 'host' | 'player' | 'spectator' | 'guest';
  showMetrics?: boolean;
  showUserDetails?: boolean;
  compact?: boolean;
  className?: string;
}

interface PresenceUserCardProps {
  user: EnhancedUserPresence;
  isCurrentUser: boolean;
  showDetails: boolean;
  compact: boolean;
}

export function EnhancedPresenceDisplay({
  contextType,
  contextId,
  userRole = 'player',
  showMetrics = true,
  showUserDetails = true,
  compact = false,
  className = '',
}: EnhancedPresenceDisplayProps) {
  const {
    users,
    onlineUsers,
    currentUser,
    userCount,
    onlineCount,
    metrics,
    isConnected,
    error,
    onUserJoined,
    onUserLeft,
    onStatusChanged,
  } = useEnhancedPresence({
    contextType,
    contextId,
    userRole,
    autoJoin: true,
    enableMetrics: showMetrics,
  });

  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const [showActivity, setShowActivity] = useState(false);

  // Handle user events
  useEffect(() => {
    const unsubscribeJoin = onUserJoined(user => {
      setRecentActivity(prev =>
        [`${user.username} joined`, ...prev].slice(0, 5)
      );
    });

    const unsubscribeLeave = onUserLeft(user => {
      setRecentActivity(prev => [`${user.username} left`, ...prev].slice(0, 5));
    });

    const unsubscribeStatus = onStatusChanged((user, previous) => {
      if (previous.status && previous.status !== user.status) {
        setRecentActivity(prev =>
          [`${user.username} is now ${user.status}`, ...prev].slice(0, 5)
        );
      }
    });

    return () => {
      unsubscribeJoin();
      unsubscribeLeave();
      unsubscribeStatus();
    };
  }, [onUserJoined, onUserLeft, onStatusChanged]);

  if (error) {
    return (
      <div
        className={`bg-red-50 border border-red-200 rounded-xl p-4 ${className}`}
      >
        <div className="flex items-center space-x-2 text-red-700">
          <WifiOff className="w-5 h-5" />
          <span className="font-medium">Connection Error</span>
        </div>
        <p className="text-red-600 text-sm mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span className="font-semibold">
                {contextType === 'room' ? 'Game Room' : 'Team'} Presence
              </span>
            </div>
            <ConnectionStatusIndicator isConnected={isConnected} />
          </div>

          <div className="flex items-center space-x-4 text-sm">
            <span className="flex items-center space-x-1">
              <Circle className="w-2 h-2 fill-current" />
              <span>{onlineCount} online</span>
            </span>
            <span>{userCount} total</span>
          </div>
        </div>

        {/* Metrics Bar (if enabled and not compact) */}
        {showMetrics && metrics && !compact && (
          <div className="mt-3 grid grid-cols-4 gap-4 text-xs">
            <div className="text-center">
              <div className="font-semibold">
                {metrics.peak_concurrent_users}
              </div>
              <div className="opacity-90">Peak Users</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">
                {Math.round(metrics.average_session_duration / 60000)}m
              </div>
              <div className="opacity-90">Avg Session</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{metrics.by_role.host || 0}</div>
              <div className="opacity-90">Hosts</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">
                {metrics.by_status.in_game || 0}
              </div>
              <div className="opacity-90">In Game</div>
            </div>
          </div>
        )}
      </div>

      {/* Users List */}
      <div className="p-4">
        {users.length === 0 ? (
          <PresenceSkeletonLoader compact={compact} />
        ) : (
          <div className={`space-y-${compact ? '2' : '3'}`}>
            <AnimatePresence>
              {users.map(user => (
                <motion.div
                  key={user.session_id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <PresenceUserCard
                    user={user}
                    isCurrentUser={user.user_id === currentUser?.user_id}
                    showDetails={showUserDetails}
                    compact={compact}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Activity Feed */}
        {!compact && recentActivity.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowActivity(!showActivity)}
              className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <Activity className="w-4 h-4" />
              <span>Recent Activity</span>
            </button>

            <AnimatePresence>
              {showActivity && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 space-y-1"
                >
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-xs text-gray-500 pl-6"
                    >
                      {activity}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function PresenceUserCard({
  user,
  isCurrentUser,
  showDetails,
  compact,
}: PresenceUserCardProps) {
  const statusColors = {
    online: 'text-green-500 bg-green-100',
    away: 'text-yellow-500 bg-yellow-100',
    busy: 'text-red-500 bg-red-100',
    offline: 'text-gray-500 bg-gray-100',
    in_game: 'text-purple-500 bg-purple-100',
  };

  const roleIcons = {
    host: Crown,
    player: Gamepad2,
    spectator: Eye,
    guest: UserPlus,
  };

  const deviceIcons = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Tablet,
  };

  const networkIcons = {
    excellent: SignalHigh,
    good: Signal,
    poor: SignalMedium,
    offline: SignalLow,
  };

  const RoleIcon = roleIcons[user.role];
  const DeviceIcon = deviceIcons[user.device_info.type];
  const NetworkIcon = networkIcons[user.network_quality || 'good'];

  return (
    <div
      className={`
      ${isCurrentUser ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}
      border rounded-lg p-${compact ? '2' : '3'} transition-all duration-200 hover:shadow-md
    `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="relative">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover`}
              />
            ) : (
              <div
                className={`
                ${compact ? 'w-8 h-8' : 'w-10 h-10'} 
                rounded-full bg-gradient-to-br from-blue-400 to-purple-500 
                flex items-center justify-center text-white font-semibold text-sm
              `}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Status Indicator */}
            <div
              className={`
              absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white
              ${statusColors[user.status]?.replace('text-', 'bg-').replace('bg-', 'bg-') || 'bg-gray-500'}
            `}
            />
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span
                className={`font-medium ${compact ? 'text-sm' : 'text-base'} text-gray-900 truncate`}
              >
                {user.display_name || user.username}
              </span>

              <RoleIcon
                className={`w-4 h-4 ${user.role === 'host' ? 'text-yellow-500' : 'text-gray-400'}`}
              />

              {isCurrentUser && (
                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                  You
                </span>
              )}
            </div>

            {showDetails && !compact && (
              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                <span className="capitalize">{user.status}</span>
                <span className="capitalize">{user.current_activity}</span>
                {user.team_name && (
                  <span className="text-blue-600">Team: {user.team_name}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status and Device Info */}
        <div className="flex items-center space-x-2">
          {showDetails && (
            <>
              <DeviceIcon className="w-4 h-4 text-gray-400" />
              <NetworkIcon
                className={`w-4 h-4 ${
                  user.network_quality === 'excellent'
                    ? 'text-green-500'
                    : user.network_quality === 'good'
                      ? 'text-blue-500'
                      : user.network_quality === 'poor'
                        ? 'text-yellow-500'
                        : 'text-red-500'
                }`}
              />
            </>
          )}

          <div
            className={`
            ${compact ? 'w-2 h-2' : 'w-3 h-3'} 
            rounded-full ${statusColors[user.status]?.replace('text-', 'bg-').replace('bg-', 'bg-') || 'bg-gray-500'}
          `}
          />
        </div>
      </div>

      {/* Extended Info (non-compact) */}
      {showDetails && !compact && (
        <div className="mt-2 pt-2 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Online {getTimeAgo(user.last_seen)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="capitalize">{user.device_info.browser}</span>
            <span>on {user.device_info.os}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ConnectionStatusIndicator({ isConnected }: { isConnected: boolean }) {
  return (
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      className="flex items-center space-x-1"
    >
      {isConnected ? (
        <>
          <Wifi className="w-4 h-4 text-green-300" />
          <span className="text-xs text-green-200">Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-red-300" />
          <span className="text-xs text-red-200">Disconnected</span>
        </>
      )}
    </motion.div>
  );
}

function PresenceSkeletonLoader({ compact }: { compact: boolean }) {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className="bg-gray-50 border border-gray-200 rounded-lg p-3 animate-pulse"
        >
          <div className="flex items-center space-x-3">
            <div
              className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} bg-gray-300 rounded-full`}
            />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-1/4" />
              {!compact && <div className="h-3 bg-gray-300 rounded w-1/3" />}
            </div>
            <div className="w-3 h-3 bg-gray-300 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Wifi,
  WifiOff,
  Circle,
  Clock,
  Gamepad2,
  Coffee,
  Moon,
  Zap,
  Activity,
  Eye,
  EyeOff,
  Settings,
  Filter,
  RefreshCw,
  Signal,
  Smartphone,
  Monitor,
  Tablet,
  Chrome,
  Firefox,
  Safari,
  Globe,
} from 'lucide-react';
import { useTeamPresence } from '../hooks/useTeamPresence';
import { useAuth } from '../hooks/useAuth';

interface TeamStatusTrackerProps {
  teamId: string;
  teamName: string;
  showActivities?: boolean;
  showDeviceInfo?: boolean;
  autoRefresh?: boolean;
  compactMode?: boolean;
  className?: string;
}

interface StatusConfig {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  label: string;
}

export function TeamStatusTracker({
  teamId,
  teamName,
  showActivities = true,
  showDeviceInfo = false,
  autoRefresh = true,
  compactMode = false,
  className = '',
}: TeamStatusTrackerProps) {
  const { user } = useAuth();
  const {
    teamMembers,
    memberCount,
    onlineCount,
    activities,
    isConnected,
    error,
    updateStatus,
    updateActivity,
    getOnlineMembers,
    getActiveMembersInGame,
  } = useTeamPresence(teamId);

  const [showSettings, setShowSettings] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'online' | 'offline'
  >('all');
  const [activityFilter, setActivityFilter] = useState<
    'all' | 'status' | 'game'
  >('all');
  const [currentUserStatus, setCurrentUserStatus] = useState<
    'online' | 'away' | 'offline' | 'in_game' | 'ready'
  >('online');

  const statusConfigs: Record<string, StatusConfig> = {
    online: {
      icon: <Circle className="w-3 h-3 fill-current" />,
      color: 'text-green-500',
      bgColor: 'bg-green-100',
      label: 'Online',
    },
    away: {
      icon: <Moon className="w-3 h-3" />,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100',
      label: 'Away',
    },
    offline: {
      icon: <Circle className="w-3 h-3" />,
      color: 'text-gray-400',
      bgColor: 'bg-gray-100',
      label: 'Offline',
    },
    in_game: {
      icon: <Gamepad2 className="w-3 h-3" />,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100',
      label: 'In Game',
    },
    ready: {
      icon: <Zap className="w-3 h-3" />,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100',
      label: 'Ready',
    },
  };

  const getDeviceIcon = (deviceType: string, browser?: string) => {
    const iconClass = 'w-3 h-3';

    switch (deviceType) {
      case 'mobile':
        return <Smartphone className={iconClass} />;
      case 'tablet':
        return <Tablet className={iconClass} />;
      default:
        return <Monitor className={iconClass} />;
    }
  };

  const getBrowserIcon = (browser?: string) => {
    const iconClass = 'w-3 h-3';

    switch (browser) {
      case 'chrome':
        return <Chrome className={iconClass} />;
      case 'firefox':
        return <Firefox className={iconClass} />;
      case 'safari':
        return <Safari className={iconClass} />;
      default:
        return <Globe className={iconClass} />;
    }
  };

  const formatLastSeen = (lastSeen: string) => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor(
      (now.getTime() - lastSeenDate.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getFilteredMembers = () => {
    const members = Object.values(teamMembers);

    switch (statusFilter) {
      case 'online':
        return members.filter(member =>
          ['online', 'away', 'in_game', 'ready'].includes(member.status)
        );
      case 'offline':
        return members.filter(member => member.status === 'offline');
      default:
        return members;
    }
  };

  const getFilteredActivities = () => {
    switch (activityFilter) {
      case 'status':
        return activities.filter(activity =>
          ['member_joined', 'member_left', 'status_changed'].includes(
            activity.type
          )
        );
      case 'game':
        return activities.filter(activity =>
          ['game_joined', 'game_left'].includes(activity.type)
        );
      default:
        return activities;
    }
  };

  const handleStatusChange = async (newStatus: typeof currentUserStatus) => {
    setCurrentUserStatus(newStatus);
    await updateStatus(newStatus);
  };

  const handleActivityChange = async (
    activity: 'browsing' | 'in_game' | 'idle'
  ) => {
    await updateActivity(activity);
  };

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // The hook handles real-time updates, but we can trigger UI refreshes here if needed
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredMembers = getFilteredMembers();
  const filteredActivities = getFilteredActivities();

  if (compactMode) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`p-1 rounded-full ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}
            >
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-600" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {onlineCount}/{memberCount} online
              </p>
              <p className="text-xs text-gray-500">{teamName}</p>
            </div>
          </div>

          <div className="flex -space-x-2">
            {filteredMembers.slice(0, 5).map(member => {
              const statusConfig = statusConfigs[member.status];
              return (
                <div
                  key={member.user_id}
                  className={`w-8 h-8 rounded-full border-2 border-white ${statusConfig.bgColor} flex items-center justify-center`}
                  title={`${member.username} - ${statusConfig.label}`}
                >
                  <span className="text-xs font-medium text-gray-700">
                    {member.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              );
            })}
            {filteredMembers.length > 5 && (
              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  +{filteredMembers.length - 5}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-lg ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}
          >
            {isConnected ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Team Status</h3>
            <p className="text-sm text-gray-600">
              {onlineCount} of {memberCount} members online
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e =>
              setStatusFilter(e.target.value as typeof statusFilter)
            }
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Members</option>
            <option value="online">Online Only</option>
            <option value="offline">Offline Only</option>
          </select>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Connection Status */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error.message}</p>
        </div>
      )}

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-gray-50 rounded-lg border"
          >
            <h4 className="font-medium text-gray-900 mb-3">Status Settings</h4>

            {/* Current User Status */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Status
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(statusConfigs).map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() =>
                      handleStatusChange(status as typeof currentUserStatus)
                    }
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentUserStatus === status
                        ? `${config.bgColor} ${config.color} border border-current`
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {config.icon}
                    <span>{config.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Display Options */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showDeviceInfo}
                  onChange={e => setShowDeviceInfo(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show device info</span>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team Members */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Team Members</h4>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          <AnimatePresence>
            {filteredMembers.map(member => {
              const statusConfig = statusConfigs[member.status];
              return (
                <motion.div
                  key={member.user_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {member.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      {/* Status indicator */}
                      <div
                        className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${statusConfig.bgColor} flex items-center justify-center`}
                      >
                        <div className={statusConfig.color}>
                          {statusConfig.icon}
                        </div>
                      </div>
                    </div>

                    {/* Member Info */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">
                          {member.username}
                        </p>
                        {member.role === 'captain' && (
                          <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Captain
                          </span>
                        )}
                        {member.user_id === user?.id && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span className={statusConfig.color}>
                          {statusConfig.label}
                        </span>
                        <span>•</span>
                        <span>{formatLastSeen(member.last_seen)}</span>
                        {member.current_activity && (
                          <>
                            <span>•</span>
                            <span className="capitalize">
                              {member.current_activity}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Device Info */}
                  {showDeviceInfo && member.device_info && (
                    <div className="flex items-center space-x-2 text-gray-500">
                      {getDeviceIcon(member.device_info.type)}
                      {getBrowserIcon(member.device_info.browser)}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredMembers.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No members found</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities */}
      {showActivities && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Recent Activity</h4>
            <select
              value={activityFilter}
              onChange={e =>
                setActivityFilter(e.target.value as typeof activityFilter)
              }
              className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Activity</option>
              <option value="status">Status Changes</option>
              <option value="game">Game Activity</option>
            </select>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            <AnimatePresence>
              {filteredActivities.slice(0, 10).map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-1 bg-blue-100 rounded-full mt-1">
                    <Activity className="w-3 h-3 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.username}</span>
                      {activity.type === 'member_joined' && ' joined the team'}
                      {activity.type === 'member_left' && ' left the team'}
                      {activity.type === 'status_changed' &&
                        ` changed status to ${activity.metadata?.new_status}`}
                      {activity.type === 'game_joined' && ' joined a game'}
                      {activity.type === 'game_left' && ' left the game'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatLastSeen(activity.timestamp)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredActivities.length === 0 && (
              <div className="text-center py-4">
                <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connection Status Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <Signal className="w-4 h-4" />
            <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            {isConnected && (
              <>
                <span>•</span>
                <span>Real-time updates active</span>
              </>
            )}
          </div>

          <div className="text-gray-500">
            {activities.length > 0 && (
              <span>
                Last activity: {formatLastSeen(activities[0].timestamp)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

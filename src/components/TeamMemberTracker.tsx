import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  MapPin,
  Activity,
  Clock,
  Gamepad2,
  Coffee,
  Moon,
  Zap,
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
  Navigation,
  Home,
  Play,
  Pause,
  Square,
  Circle,
  Wifi,
  WifiOff,
  Battery,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useTeamPresence } from '../hooks/useTeamPresence';
import { useAuth } from '../hooks/useAuth';

interface TeamMemberTrackerProps {
  teamId: string;
  gameRoomId?: string;
  showMemberLocations?: boolean;
  showDeviceInfo?: boolean;
  showActivityHistory?: boolean;
  compactMode?: boolean;
  refreshInterval?: number;
  maxActivities?: number;
  className?: string;
}

interface MemberLocation {
  user_id: string;
  current_page: string;
  page_title: string;
  last_activity: string;
  time_on_page: number;
  interactions: number;
  scroll_position?: number;
  viewport_size?: { width: number; height: number };
  is_focused: boolean;
  is_visible: boolean;
}

interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  screen_size: { width: number; height: number };
  connection_type?: 'wifi' | 'cellular' | 'ethernet';
  battery_level?: number;
  is_charging?: boolean;
  network_speed?: 'slow' | 'fast' | 'offline';
}

interface MemberActivity {
  id: string;
  user_id: string;
  type:
    | 'page_visit'
    | 'action'
    | 'interaction'
    | 'status_change'
    | 'game_event';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
  location?: string;
  duration?: number;
}

const LOCATION_ICONS: Record<string, React.ReactNode> = {
  '/dashboard': <Home className="w-3 h-3" />,
  '/game-room': <Gamepad2 className="w-3 h-3" />,
  '/team': <Users className="w-3 h-3" />,
  '/leaderboard': <Activity className="w-3 h-3" />,
  '/settings': <Settings className="w-3 h-3" />,
  default: <Navigation className="w-3 h-3" />,
};

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  desktop: <Monitor className="w-3 h-3" />,
  mobile: <Smartphone className="w-3 h-3" />,
  tablet: <Tablet className="w-3 h-3" />,
};

const BROWSER_ICONS: Record<string, React.ReactNode> = {
  chrome: <Chrome className="w-3 h-3" />,
  firefox: <Firefox className="w-3 h-3" />,
  safari: <Safari className="w-3 h-3" />,
  default: <Globe className="w-3 h-3" />,
};

export const TeamMemberTracker: React.FC<TeamMemberTrackerProps> = ({
  teamId,
  gameRoomId,
  showMemberLocations = true,
  showDeviceInfo = true,
  showActivityHistory = true,
  compactMode = false,
  refreshInterval = 5000,
  maxActivities = 20,
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

  const [memberLocations, setMemberLocations] = useState<
    Record<string, MemberLocation>
  >({});
  const [memberDevices, setMemberDevices] = useState<
    Record<string, DeviceInfo>
  >({});
  const [recentActivities, setRecentActivities] = useState<MemberActivity[]>(
    []
  );
  const [isTracking, setIsTracking] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');

  // Track current user's location and device info
  useEffect(() => {
    if (!user || !isTracking) return;

    const trackLocation = () => {
      const location: MemberLocation = {
        user_id: user.id,
        current_page: window.location.pathname,
        page_title: document.title,
        last_activity: new Date().toISOString(),
        time_on_page: Date.now() - (performance.timing?.navigationStart || 0),
        interactions: 0,
        scroll_position: window.scrollY,
        viewport_size: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        is_focused: document.hasFocus(),
        is_visible: !document.hidden,
      };

      setMemberLocations(prev => ({
        ...prev,
        [user.id]: location,
      }));

      // Broadcast location update
      broadcastActivity({
        type: 'location_update',
        payload: location,
        timestamp: new Date().toISOString(),
      });
    };

    const trackDevice = () => {
      const device: DeviceInfo = {
        type: getDeviceType(),
        os: getOS(),
        browser: getBrowser(),
        screen_size: {
          width: screen.width,
          height: screen.height,
        },
        connection_type: getConnectionType(),
        network_speed: getNetworkSpeed(),
      };

      // Add battery info if available
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          device.battery_level = Math.round(battery.level * 100);
          device.is_charging = battery.charging;

          setMemberDevices(prev => ({
            ...prev,
            [user.id]: device,
          }));
        });
      } else {
        setMemberDevices(prev => ({
          ...prev,
          [user.id]: device,
        }));
      }
    };

    // Initial tracking
    trackLocation();
    trackDevice();

    // Set up periodic tracking
    const locationInterval = setInterval(trackLocation, refreshInterval);
    const deviceInterval = setInterval(trackDevice, refreshInterval * 4); // Less frequent for device info

    // Track page visibility changes
    const handleVisibilityChange = () => {
      trackLocation();
    };

    // Track focus changes
    const handleFocusChange = () => {
      trackLocation();
    };

    // Track scroll position
    const handleScroll = () => {
      if (memberLocations[user.id]) {
        setMemberLocations(prev => ({
          ...prev,
          [user.id]: {
            ...prev[user.id],
            scroll_position: window.scrollY,
            last_activity: new Date().toISOString(),
          },
        }));
      }
    };

    // Track interactions
    const handleInteraction = () => {
      if (memberLocations[user.id]) {
        setMemberLocations(prev => ({
          ...prev,
          [user.id]: {
            ...prev[user.id],
            interactions: prev[user.id].interactions + 1,
            last_activity: new Date().toISOString(),
          },
        }));
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocusChange);
    window.addEventListener('blur', handleFocusChange);
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);

    return () => {
      clearInterval(locationInterval);
      clearInterval(deviceInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocusChange);
      window.removeEventListener('blur', handleFocusChange);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [user?.id, isTracking, refreshInterval]);

  // Process activities from team presence
  useEffect(() => {
    const processedActivities = activities
      .slice(-maxActivities)
      .map(activity => ({
        id: activity.id,
        user_id: activity.user_id,
        type: activity.type as MemberActivity['type'],
        description: activity.description,
        timestamp: activity.timestamp,
        metadata: activity.metadata,
        location: activity.location,
        duration: activity.duration,
      }));

    setRecentActivities(processedActivities);
  }, [activities, maxActivities]);

  // Utility functions for device detection
  const getDeviceType = (): DeviceInfo['type'] => {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (
      /mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(
        userAgent
      )
    )
      return 'mobile';
    return 'desktop';
  };

  const getOS = (): string => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  };

  const getBrowser = (): string => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'chrome';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Safari')) return 'safari';
    if (userAgent.includes('Edge')) return 'edge';
    return 'unknown';
  };

  const getConnectionType = (): DeviceInfo['connection_type'] => {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    if (connection) {
      if (connection.type === 'wifi') return 'wifi';
      if (connection.type === 'cellular') return 'cellular';
      if (connection.type === 'ethernet') return 'ethernet';
    }
    return undefined;
  };

  const getNetworkSpeed = (): DeviceInfo['network_speed'] => {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;
    if (connection && connection.effectiveType) {
      if (
        connection.effectiveType === 'slow-2g' ||
        connection.effectiveType === '2g'
      )
        return 'slow';
      if (connection.effectiveType === '3g') return 'fast';
      if (connection.effectiveType === '4g') return 'fast';
    }
    return undefined;
  };

  // Filter activities and members
  const filteredActivities = useMemo(() => {
    let filtered = recentActivities;

    if (activityFilter !== 'all') {
      filtered = filtered.filter(activity => activity.type === activityFilter);
    }

    if (memberFilter !== 'all') {
      filtered = filtered.filter(activity => activity.user_id === memberFilter);
    }

    return filtered.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [recentActivities, activityFilter, memberFilter]);

  const onlineMembers = members.filter(
    member => member.status === 'online' || member.status === 'in_game'
  );

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getLocationIcon = (path: string) => {
    return LOCATION_ICONS[path] || LOCATION_ICONS.default;
  };

  if (compactMode) {
    return (
      <div className={`team-member-tracker-compact ${className}`}>
        <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm border p-3">
          <div className="flex items-center space-x-1">
            <Circle
              className={`w-2 h-2 ${connectionStatus.connected ? 'text-green-500 fill-current' : 'text-red-500 fill-current'}`}
            />
            <span className="text-sm font-medium">
              {onlineMembers.length} online
            </span>
          </div>

          <div className="flex -space-x-1">
            {onlineMembers.slice(0, 5).map(member => (
              <div
                key={member.user_id}
                className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-medium"
                title={member.username}
              >
                {member.username.charAt(0).toUpperCase()}
              </div>
            ))}
            {onlineMembers.length > 5 && (
              <div className="w-6 h-6 bg-gray-400 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-medium">
                +{onlineMembers.length - 5}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`team-member-tracker ${className}`}>
      <div className="bg-white rounded-xl shadow-lg border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Team Tracker</h3>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Circle
                className={`w-2 h-2 ${connectionStatus.connected ? 'text-green-500 fill-current' : 'text-red-500 fill-current'}`}
              />
              <span>
                {onlineMembers.length} of {members.length} online
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100'}`}
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsTracking(!isTracking)}
              className={`p-2 rounded-lg transition-colors ${isTracking ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}
              title={isTracking ? 'Disable tracking' : 'Enable tracking'}
            >
              {isTracking ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b overflow-hidden"
            >
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Activity Type
                    </label>
                    <select
                      value={activityFilter}
                      onChange={e => setActivityFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="all">All Activities</option>
                      <option value="page_visit">Page Visits</option>
                      <option value="action">Actions</option>
                      <option value="interaction">Interactions</option>
                      <option value="status_change">Status Changes</option>
                      <option value="game_event">Game Events</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Team Member
                    </label>
                    <select
                      value={memberFilter}
                      onChange={e => setMemberFilter(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="all">All Members</option>
                      {members.map(member => (
                        <option key={member.user_id} value={member.user_id}>
                          {member.username}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 space-y-6">
          {/* Member Status Grid */}
          {showMemberLocations && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Member Locations
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {onlineMembers.map(member => {
                  const location = memberLocations[member.user_id];
                  const device = memberDevices[member.user_id];

                  return (
                    <motion.div
                      key={member.user_id}
                      layout
                      className="bg-gray-50 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm text-white font-medium">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              {member.username}
                            </div>
                            <div className="text-xs text-gray-500">
                              {member.role}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Circle
                            className={`w-2 h-2 fill-current ${
                              member.status === 'online'
                                ? 'text-green-500'
                                : member.status === 'in_game'
                                  ? 'text-blue-500'
                                  : member.status === 'away'
                                    ? 'text-yellow-500'
                                    : 'text-gray-400'
                            }`}
                          />
                        </div>
                      </div>

                      {location && (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            {getLocationIcon(location.current_page)}
                            <span className="truncate">
                              {location.page_title}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{formatTimeAgo(location.last_activity)}</span>
                            <div className="flex items-center space-x-1">
                              {location.is_focused ? (
                                <Eye className="w-3 h-3 text-green-500" />
                              ) : (
                                <EyeOff className="w-3 h-3 text-gray-400" />
                              )}
                              {location.is_visible ? (
                                <Circle className="w-2 h-2 fill-current text-green-500" />
                              ) : (
                                <Circle className="w-2 h-2 fill-current text-gray-400" />
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {showDeviceInfo && device && (
                        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t">
                          <div className="flex items-center space-x-1">
                            {DEVICE_ICONS[device.type]}
                            <span>{device.os}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {BROWSER_ICONS[device.browser] ||
                              BROWSER_ICONS.default}
                            {device.connection_type && (
                              <span className="capitalize">
                                {device.connection_type}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Activity History */}
          {showActivityHistory && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">
                  Recent Activity
                </h4>
                <span className="text-xs text-gray-500">
                  {filteredActivities.length} activities
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                <AnimatePresence>
                  {filteredActivities.map(activity => {
                    const member = members.find(
                      m => m.user_id === activity.user_id
                    );

                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg text-sm"
                      >
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-medium flex-shrink-0">
                          {member?.username.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-gray-900 truncate">
                            {activity.description}
                          </div>
                          <div className="text-xs text-gray-500">
                            {member?.username} •{' '}
                            {formatTimeAgo(activity.timestamp)}
                            {activity.location && ` • ${activity.location}`}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-xs text-gray-400">
                          {activity.type.replace('_', ' ')}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredActivities.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

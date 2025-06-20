import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Activity,
  Wifi,
  WifiOff,
  Crown,
  Shield,
  Settings,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Home,
  ArrowLeft,
  Play,
  Pause,
  Square,
  Circle,
} from 'lucide-react';
import { TeamStatusTracker } from '../components/TeamStatusTracker';
import { TeamRealtimeSync } from '../components/TeamRealtimeSync';
import { TeamMemberTracker } from '../components/TeamMemberTracker';

interface DemoTeamMember {
  user_id: string;
  username: string;
  full_name: string;
  role: 'captain' | 'member';
  status: 'online' | 'away' | 'offline' | 'in_game' | 'ready';
  team_id: string;
  joined_at: string;
  last_seen: string;
  current_activity?: 'browsing' | 'in_game' | 'idle';
  device_info?: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser?: string;
  };
}

interface DemoActivity {
  id: string;
  type:
    | 'member_joined'
    | 'member_left'
    | 'status_changed'
    | 'game_joined'
    | 'game_left';
  user_id: string;
  username: string;
  team_id: string;
  timestamp: string;
  description: string;
  metadata?: Record<string, any>;
}

const DEMO_TEAM_MEMBERS: DemoTeamMember[] = [
  {
    user_id: 'user-1',
    username: 'CaptainTrivia',
    full_name: 'Captain Trivia',
    role: 'captain',
    status: 'online',
    team_id: 'demo-team-1',
    joined_at: '2024-01-01T10:00:00Z',
    last_seen: new Date().toISOString(),
    current_activity: 'browsing',
    device_info: { type: 'desktop', browser: 'chrome' },
  },
  {
    user_id: 'user-2',
    username: 'QuizMaster2024',
    full_name: 'Quiz Master',
    role: 'member',
    status: 'in_game',
    team_id: 'demo-team-1',
    joined_at: '2024-01-01T10:15:00Z',
    last_seen: new Date(Date.now() - 5 * 60000).toISOString(),
    current_activity: 'in_game',
    device_info: { type: 'mobile', browser: 'safari' },
  },
  {
    user_id: 'user-3',
    username: 'BrainiacBob',
    full_name: 'Brainiac Bob',
    role: 'member',
    status: 'away',
    team_id: 'demo-team-1',
    joined_at: '2024-01-01T10:30:00Z',
    last_seen: new Date(Date.now() - 15 * 60000).toISOString(),
    current_activity: 'idle',
    device_info: { type: 'tablet', browser: 'firefox' },
  },
  {
    user_id: 'user-4',
    username: 'TriviaNewbie',
    full_name: 'Trivia Newbie',
    role: 'member',
    status: 'ready',
    team_id: 'demo-team-1',
    joined_at: '2024-01-01T11:00:00Z',
    last_seen: new Date(Date.now() - 2 * 60000).toISOString(),
    current_activity: 'browsing',
    device_info: { type: 'desktop', browser: 'edge' },
  },
  {
    user_id: 'user-5',
    username: 'OfflinePlayer',
    full_name: 'Offline Player',
    role: 'member',
    status: 'offline',
    team_id: 'demo-team-1',
    joined_at: '2024-01-01T09:00:00Z',
    last_seen: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    current_activity: 'idle',
    device_info: { type: 'mobile', browser: 'chrome' },
  },
];

const DEMO_ACTIVITIES: DemoActivity[] = [
  {
    id: 'activity-1',
    type: 'member_joined',
    user_id: 'user-4',
    username: 'TriviaNewbie',
    team_id: 'demo-team-1',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    description: 'TriviaNewbie joined the team',
  },
  {
    id: 'activity-2',
    type: 'status_changed',
    user_id: 'user-2',
    username: 'QuizMaster2024',
    team_id: 'demo-team-1',
    timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
    description: 'QuizMaster2024 changed status to in_game',
    metadata: { new_status: 'in_game' },
  },
  {
    id: 'activity-3',
    type: 'game_joined',
    user_id: 'user-2',
    username: 'QuizMaster2024',
    team_id: 'demo-team-1',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
    description: 'QuizMaster2024 joined Game Room Alpha',
    metadata: { game_room_id: 'room-alpha' },
  },
  {
    id: 'activity-4',
    type: 'status_changed',
    user_id: 'user-3',
    username: 'BrainiacBob',
    team_id: 'demo-team-1',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    description: 'BrainiacBob changed status to away',
    metadata: { new_status: 'away' },
  },
  {
    id: 'activity-5',
    type: 'status_changed',
    user_id: 'user-4',
    username: 'TriviaNewbie',
    team_id: 'demo-team-1',
    timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
    description: 'TriviaNewbie changed status to ready',
    metadata: { new_status: 'ready' },
  },
];

export default function TeamRealtimeStatusDemo() {
  const [activeDemo, setActiveDemo] = useState<
    'status' | 'sync' | 'tracker' | 'overview'
  >('overview');
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'reconnecting'
  >('connected');
  const [demoMembers, setDemoMembers] = useState(DEMO_TEAM_MEMBERS);
  const [demoActivities, setDemoActivities] = useState(DEMO_ACTIVITIES);

  // Simulate real-time updates
  useEffect(() => {
    if (!isSimulationRunning) return;

    const interval = setInterval(() => {
      // Randomly update member status
      const randomMember =
        demoMembers[Math.floor(Math.random() * demoMembers.length)];
      const statuses = ['online', 'away', 'in_game', 'ready'];
      const newStatus = statuses[
        Math.floor(Math.random() * statuses.length)
      ] as DemoTeamMember['status'];

      if (randomMember.status !== newStatus) {
        setDemoMembers(prev =>
          prev.map(member =>
            member.user_id === randomMember.user_id
              ? {
                  ...member,
                  status: newStatus,
                  last_seen: new Date().toISOString(),
                }
              : member
          )
        );

        // Add activity
        const newActivity: DemoActivity = {
          id: `activity-${Date.now()}`,
          type: 'status_changed',
          user_id: randomMember.user_id,
          username: randomMember.username,
          team_id: 'demo-team-1',
          timestamp: new Date().toISOString(),
          description: `${randomMember.username} changed status to ${newStatus}`,
          metadata: { new_status: newStatus },
        };

        setDemoActivities(prev => [newActivity, ...prev.slice(0, 19)]);
      }
    }, 3000 / simulationSpeed);

    return () => clearInterval(interval);
  }, [isSimulationRunning, simulationSpeed, demoMembers]);

  // Simulate connection issues
  const simulateConnectionIssue = () => {
    setConnectionStatus('disconnected');
    setTimeout(() => {
      setConnectionStatus('reconnecting');
      setTimeout(() => {
        setConnectionStatus('connected');
      }, 2000);
    }, 1000);
  };

  const onlineMembers = demoMembers.filter(member =>
    ['online', 'away', 'in_game', 'ready'].includes(member.status)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-3">
                <Activity className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Real-time Team Status Demo
                  </h1>
                  <p className="text-sm text-gray-600">
                    Interactive demonstration of live team tracking features
                  </p>
                </div>
              </div>
            </div>

            {/* Demo Controls */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Circle
                  className={`w-3 h-3 fill-current ${
                    connectionStatus === 'connected'
                      ? 'text-green-500'
                      : connectionStatus === 'reconnecting'
                        ? 'text-yellow-500'
                        : 'text-red-500'
                  }`}
                />
                <span className="text-sm text-gray-600 capitalize">
                  {connectionStatus}
                </span>
              </div>

              <button
                onClick={() => setIsSimulationRunning(!isSimulationRunning)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isSimulationRunning
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {isSimulationRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause Simulation</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Start Simulation</span>
                  </>
                )}
              </button>

              <button
                onClick={simulateConnectionIssue}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition-colors"
              >
                <WifiOff className="w-4 h-4" />
                <span>Simulate Disconnect</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: Home },
              { id: 'status', label: 'Status Tracker', icon: Users },
              { id: 'sync', label: 'Realtime Sync', icon: Wifi },
              { id: 'tracker', label: 'Member Tracker', icon: Activity },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveDemo(tab.id as typeof activeDemo)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeDemo === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Demo Content */}
        <motion.div
          key={activeDemo}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeDemo === 'overview' && (
            <div className="space-y-8">
              {/* Feature Overview */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Real-time Team Status Tracking
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Live Member Status
                    </h3>
                    <p className="text-gray-600">
                      Track team members' online status, current activity, and
                      device information in real-time
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wifi className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      WebSocket Sync
                    </h3>
                    <p className="text-gray-600">
                      Instant synchronization across all connected clients with
                      automatic reconnection
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Activity Tracking
                    </h3>
                    <p className="text-gray-600">
                      Monitor member activities, page visits, and interactions
                      with detailed analytics
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Members
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {demoMembers.length}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Online Now
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {onlineMembers.length}
                      </p>
                    </div>
                    <Circle className="w-8 h-8 text-green-600 fill-current" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        In Game
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {demoMembers.filter(m => m.status === 'in_game').length}
                      </p>
                    </div>
                    <Play className="w-8 h-8 text-blue-600" />
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Recent Activities
                      </p>
                      <p className="text-2xl font-bold text-purple-600">
                        {demoActivities.length}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>

              {/* Live Demo Controls */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Interactive Demo Controls
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Simulation Speed
                    </label>
                    <select
                      value={simulationSpeed}
                      onChange={e => setSimulationSpeed(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value={0.5}>0.5x (Slow)</option>
                      <option value={1}>1x (Normal)</option>
                      <option value={2}>2x (Fast)</option>
                      <option value={5}>5x (Very Fast)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Connection Status
                    </label>
                    <div className="flex items-center space-x-2">
                      <Circle
                        className={`w-3 h-3 fill-current ${
                          connectionStatus === 'connected'
                            ? 'text-green-500'
                            : connectionStatus === 'reconnecting'
                              ? 'text-yellow-500'
                              : 'text-red-500'
                        }`}
                      />
                      <span className="text-sm capitalize">
                        {connectionStatus}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Simulation Status
                    </label>
                    <div className="flex items-center space-x-2">
                      {isSimulationRunning ? (
                        <Play className="w-3 h-3 text-green-500" />
                      ) : (
                        <Pause className="w-3 h-3 text-gray-500" />
                      )}
                      <span className="text-sm">
                        {isSimulationRunning ? 'Running' : 'Paused'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeDemo === 'status' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Team Status Tracker Component
                </h2>
                <p className="text-gray-600 mb-6">
                  This component provides a comprehensive view of team member
                  status, activities, and real-time updates with filtering and
                  customization options.
                </p>
              </div>

              <TeamStatusTracker
                teamId="demo-team-1"
                teamName="Tony Trivia Demo Team"
                showActivities={true}
                showDeviceInfo={true}
                autoRefresh={true}
                compactMode={false}
              />
            </div>
          )}

          {activeDemo === 'sync' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Real-time Sync Component
                </h2>
                <p className="text-gray-600 mb-6">
                  This component manages WebSocket connections, handles
                  real-time synchronization, and provides connection status
                  monitoring with automatic reconnection.
                </p>
              </div>

              <TeamRealtimeSync
                teamId="demo-team-1"
                gameRoomId="demo-room-1"
                showConnectionStatus={true}
                enableBroadcast={true}
              />

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Connection Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Features</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li>• WebSocket connection management</li>
                      <li>• Automatic reconnection with exponential backoff</li>
                      <li>• Ping/pong latency monitoring</li>
                      <li>• Broadcast message handling</li>
                      <li>• Presence state synchronization</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Status Indicators
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <Circle className="w-3 h-3 fill-current text-green-500" />
                        <span>Connected - Real-time sync active</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-3 h-3 text-yellow-500" />
                        <span>
                          Reconnecting - Attempting to restore connection
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Circle className="w-3 h-3 fill-current text-red-500" />
                        <span>Disconnected - No real-time updates</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeDemo === 'tracker' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Member Tracker Component
                </h2>
                <p className="text-gray-600 mb-6">
                  Advanced member tracking with location monitoring, device
                  information, activity history, and detailed analytics for team
                  coordination.
                </p>
              </div>

              <TeamMemberTracker
                teamId="demo-team-1"
                gameRoomId="demo-room-1"
                showMemberLocations={true}
                showDeviceInfo={true}
                showActivityHistory={true}
                compactMode={false}
                refreshInterval={5000}
                maxActivities={20}
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

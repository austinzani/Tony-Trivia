import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Settings,
  Eye,
  EyeOff,
  Crown,
  Gamepad2,
  Activity,
  BarChart3,
} from 'lucide-react';
import { EnhancedPresenceDisplay } from './EnhancedPresenceDisplay';
import { useEnhancedPresence } from '../hooks/useEnhancedPresence';

interface PresenceSystemDemoProps {
  className?: string;
}

export function PresenceSystemDemo({
  className = '',
}: PresenceSystemDemoProps) {
  const [demoRoom] = useState('demo-room-123');
  const [demoTeam] = useState('demo-team-456');
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<'both' | 'room' | 'team'>('both');
  const [compactMode, setCompactMode] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);

  const roomPresence = useEnhancedPresence({
    contextType: 'room',
    contextId: demoRoom,
    userRole: 'player',
    autoJoin: viewMode === 'both' || viewMode === 'room',
    enableMetrics: showMetrics,
  });

  const teamPresence = useEnhancedPresence({
    contextType: 'team',
    contextId: demoTeam,
    userRole: 'player',
    autoJoin: viewMode === 'both' || viewMode === 'team',
    enableMetrics: showMetrics,
  });

  const handleStatusChange = async (
    presence: typeof roomPresence,
    status: 'online' | 'away' | 'busy' | 'offline' | 'in_game'
  ) => {
    try {
      await presence.updateStatus(status);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleActivityChange = async (
    presence: typeof roomPresence,
    activity: 'lobby' | 'in_game' | 'reviewing' | 'browsing' | 'idle'
  ) => {
    try {
      await presence.updateActivity(activity);
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Enhanced Presence System Demo
            </h1>
            <p className="text-blue-100">
              Real-time user presence tracking with comprehensive UI components
            </p>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>

        {/* Demo Controls */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/20"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  View Mode
                </label>
                <select
                  value={viewMode}
                  onChange={e => setViewMode(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white"
                >
                  <option value="both" style={{ color: 'black' }}>
                    Both Room & Team
                  </option>
                  <option value="room" style={{ color: 'black' }}>
                    Room Only
                  </option>
                  <option value="team" style={{ color: 'black' }}>
                    Team Only
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={compactMode}
                    onChange={e => setCompactMode(e.target.checked)}
                    className="rounded"
                  />
                  <span>Compact Mode</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showDetails}
                    onChange={e => setShowDetails(e.target.checked)}
                    className="rounded"
                  />
                  <span>Show Details</span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showMetrics}
                    onChange={e => setShowMetrics(e.target.checked)}
                    className="rounded"
                  />
                  <span>Show Metrics</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Room Status Controls */}
        {(viewMode === 'both' || viewMode === 'room') && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Room Status Controls
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['online', 'away', 'busy', 'in_game'] as const).map(
                    status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(roomPresence, status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          roomPresence.currentUser?.status === status
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['lobby', 'in_game', 'reviewing', 'browsing'] as const).map(
                    activity => (
                      <button
                        key={activity}
                        onClick={() =>
                          handleActivityChange(roomPresence, activity)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          roomPresence.currentUser?.current_activity ===
                          activity
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {activity.replace('_', ' ')}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Status Controls */}
        {(viewMode === 'both' || viewMode === 'team') && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Gamepad2 className="w-5 h-5 mr-2 text-purple-600" />
              Team Status Controls
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['online', 'away', 'busy', 'in_game'] as const).map(
                    status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(teamPresence, status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          teamPresence.currentUser?.status === status
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Actions
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      teamPresence.updateTeam('team-alpha', 'Team Alpha')
                    }
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200 transition-colors"
                  >
                    Join Team Alpha
                  </button>
                  <button
                    onClick={() =>
                      teamPresence.updateTeam('team-beta', 'Team Beta')
                    }
                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium hover:bg-orange-200 transition-colors"
                  >
                    Join Team Beta
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Presence Displays */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Room Presence */}
        {(viewMode === 'both' || viewMode === 'room') && (
          <EnhancedPresenceDisplay
            contextType="room"
            contextId={demoRoom}
            userRole="player"
            showMetrics={showMetrics}
            showUserDetails={showDetails}
            compact={compactMode}
            className="h-fit"
          />
        )}

        {/* Team Presence */}
        {(viewMode === 'both' || viewMode === 'team') && (
          <EnhancedPresenceDisplay
            contextType="team"
            contextId={demoTeam}
            userRole="player"
            showMetrics={showMetrics}
            showUserDetails={showDetails}
            compact={compactMode}
            className="h-fit"
          />
        )}
      </div>

      {/* System Statistics */}
      {showMetrics && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
            System Statistics
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {viewMode === 'both' || viewMode === 'room'
                  ? roomPresence.onlineCount
                  : 0}
              </div>
              <div className="text-sm text-blue-700">Room Online</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {viewMode === 'both' || viewMode === 'team'
                  ? teamPresence.onlineCount
                  : 0}
              </div>
              <div className="text-sm text-purple-700">Team Online</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {roomPresence.isConnected && teamPresence.isConnected
                  ? '✓'
                  : '✗'}
              </div>
              <div className="text-sm text-green-700">Connection</div>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {roomPresence.metrics?.peak_concurrent_users || 0}
              </div>
              <div className="text-sm text-orange-700">Peak Users</div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Showcase */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          ✨ Features Demonstrated
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <ul className="space-y-2">
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Real-time presence synchronization</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>Automatic heartbeat mechanism</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span>Activity detection & idle status</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span>Device & network quality indicators</span>
            </li>
          </ul>
          <ul className="space-y-2">
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span>Skeleton loading states</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span>Tony Trivia style guide compliance</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
              <span>Animated presence changes</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
              <span>Performance metrics tracking</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

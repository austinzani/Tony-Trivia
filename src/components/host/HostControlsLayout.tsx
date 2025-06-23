import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  Settings,
  Users,
  Trophy,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  MessageSquare,
  Monitor,
  Shield,
  Activity,
  Gamepad2,
  Target,
  Zap,
} from 'lucide-react';
import { useGameController } from '../../hooks/useGameController';
import { useNotifications } from '../../hooks/useNotifications';
import { GameFlowControls } from './GameFlowControls';
import { AnswerManagementInterface } from './AnswerManagementInterface';
import { ScoreManagementInterface } from './ScoreManagementInterface';
import { NotificationSystem, NotificationBell } from './NotificationSystem';

interface HostControlsLayoutProps {
  gameId: string;
  className?: string;
}

type HostTabType =
  | 'game-flow'
  | 'answer-management'
  | 'score-management'
  | 'leaderboard'
  | 'notifications'
  | 'settings';

interface TabConfig {
  id: HostTabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}

const hostTabs: TabConfig[] = [
  {
    id: 'game-flow',
    label: 'Game Flow',
    icon: Gamepad2,
    color: 'electric',
    description: 'Control game progression and flow',
  },
  {
    id: 'answer-management',
    label: 'Answers',
    icon: CheckCircle,
    color: 'plasma',
    description: 'Review and manage team answers',
  },
  {
    id: 'score-management',
    label: 'Scoring',
    icon: Target,
    color: 'energy-orange',
    description: 'Manage scores and point allocations',
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard',
    icon: Trophy,
    color: 'victory',
    description: 'View real-time team rankings',
  },
  {
    id: 'notifications',
    label: 'Activity',
    icon: Activity,
    color: 'energy-yellow',
    description: 'Monitor game events and activity',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    color: 'neutral',
    description: 'Configure game settings',
  },
];

export function HostControlsLayout({
  gameId,
  className = '',
}: HostControlsLayoutProps) {
  const [activeTab, setActiveTab] = useState<HostTabType>('game-flow');
  const [isMinimized, setIsMinimized] = useState(false);

  const { state, isInitialized, isActive, isPaused, currentPhase, error } =
    useGameController(gameId);

  const { unreadCount, hasNewNotifications } = useNotifications(gameId);

  // Auto-focus on answer management when answers come in
  useEffect(() => {
    // This would be connected to real-time answer submissions
    // For now, just a placeholder for the structure
  }, []);

  const getStatusColor = () => {
    if (error) return 'bg-red-500';
    if (!isInitialized) return 'bg-gray-400';
    if (isPaused) return 'bg-yellow-500';
    if (isActive) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (!isInitialized) return 'Initializing';
    if (isPaused) return 'Paused';
    if (isActive) return 'Active';
    return 'Ready';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`host-controls-layout ${className}`}
    >
      {/* Header with Game Status */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white p-6 rounded-t-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <Monitor className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Host Controls</h1>
              <p className="text-blue-100 text-sm">Game ID: {gameId}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Game Status Indicator */}
            <div className="flex items-center space-x-2 bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm">
              <div
                className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}
              />
              <span className="font-medium">{getStatusText()}</span>
            </div>

            {/* Current Phase */}
            <div className="text-right">
              <div className="text-sm text-blue-100">Current Phase</div>
              <div className="font-semibold capitalize">
                {currentPhase?.replace(/_/g, ' ') || 'Not Started'}
              </div>
            </div>

            {/* Notification Bell */}
            <div className="bg-white/20 rounded-lg backdrop-blur-sm">
              <NotificationBell
                unreadCount={unreadCount}
                hasNewNotifications={hasNewNotifications}
                soundsEnabled={true} // This will be connected to preferences
                onClick={() => setActiveTab('notifications')}
                size="md"
                variant="minimal"
                className="text-white hover:text-blue-100"
              />
            </div>

            {/* Minimize Toggle */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              <Zap className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white shadow-lg"
          >
            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-0 overflow-x-auto">
                {hostTabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        flex items-center space-x-2 px-6 py-4 whitespace-nowrap font-medium text-sm
                        transition-all duration-200 border-b-2 relative group
                        ${
                          isActive
                            ? 'text-blue-600 border-blue-600 bg-blue-50'
                            : 'text-gray-600 border-transparent hover:text-blue-500 hover:border-blue-300'
                        }
                      `}
                    >
                      <Icon
                        className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'}`}
                      />
                      <span>{tab.label}</span>

                      {/* Active Tab Indicator */}
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg"
                          style={{ zIndex: -1 }}
                        />
                      )}

                      {/* Notification Badge */}
                      {tab.id === 'notifications' && unreadCount > 0 && (
                        <div className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[16px] h-4 flex items-center justify-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                      )}
                      {tab.id === 'answer-management' && (
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6 min-h-[600px]">
              {/* Primary Control Area (3/4 width on desktop) */}
              <div className="lg:col-span-3">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-gray-50 rounded-xl p-6 h-full"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {hostTabs.find(tab => tab.id === activeTab)?.label}
                      </h2>
                      <p className="text-gray-600 text-sm">
                        {
                          hostTabs.find(tab => tab.id === activeTab)
                            ?.description
                        }
                      </p>
                    </div>

                    {/* Quick Actions Handled by Tab Components */}
                    <div className="flex items-center space-x-2">
                      {/* Reserved for future quick actions */}
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="space-y-4">
                    {activeTab === 'game-flow' && (
                      <GameFlowControls gameId={gameId} />
                    )}

                    {activeTab === 'answer-management' && (
                      <AnswerManagementInterface
                        gameId={gameId}
                        currentQuestionId={
                          gameState?.currentQuestion?.question.id
                        }
                        currentRoundId={
                          gameState?.rounds?.[gameState.currentRound - 1]?.id
                        }
                      />
                    )}

                    {activeTab === 'score-management' && (
                      <ScoreManagementInterface
                        gameId={gameId}
                        onScoreChanged={adjustment => {
                          console.log('Score adjustment made:', adjustment);
                        }}
                        onError={error => {
                          console.error('Score management error:', error);
                        }}
                      />
                    )}

                    {activeTab === 'notifications' && (
                      <div className="bg-white rounded-lg p-4">
                        <div className="text-center text-gray-600">
                          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <h3 className="text-lg font-medium mb-2">
                            Notification Center
                          </h3>
                          <p className="text-sm mb-4">
                            The notification center is available through the
                            bell icon in the header. Toast notifications will
                            appear automatically for important events.
                          </p>
                          <p className="text-xs text-gray-500">
                            Click the bell icon above to open the full
                            notification center with filtering, search, and
                            preference settings.
                          </p>
                        </div>
                      </div>
                    )}

                    {activeTab !== 'game-flow' &&
                      activeTab !== 'answer-management' &&
                      activeTab !== 'score-management' &&
                      activeTab !== 'notifications' && (
                        <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-300">
                          <p className="text-gray-500 text-center">
                            {activeTab.charAt(0).toUpperCase() +
                              activeTab.slice(1).replace('-', ' ')}{' '}
                            content will be implemented here
                          </p>
                        </div>
                      )}
                  </div>
                </motion.div>
              </div>

              {/* Real-time Leaderboard Sidebar (1/4 width on desktop) */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 h-full border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center">
                      <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                      Live Leaderboard
                    </h3>
                    <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                      Real-time
                    </div>
                  </div>

                  {/* Leaderboard Content Placeholder */}
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(position => (
                      <div
                        key={position}
                        className={`
                          flex items-center justify-between p-3 rounded-lg
                          ${
                            position === 1
                              ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300'
                              : 'bg-white border border-gray-200'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`
                            w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                            ${position === 1 ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'}
                          `}
                          >
                            {position}
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              Team {position}
                            </div>
                            <div className="text-xs text-gray-500">
                              4 members
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">
                            {100 - position * 15}
                          </div>
                          <div className="text-xs text-gray-500">pts</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Stats */}
                  <div className="mt-6 pt-4 border-t border-purple-200">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-white p-2 rounded">
                        <div className="text-lg font-bold text-blue-600">5</div>
                        <div className="text-xs text-gray-500">Teams</div>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <div className="text-lg font-bold text-green-600">
                          20
                        </div>
                        <div className="text-xs text-gray-500">Players</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-md"
          >
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">Error</span>
            </div>
            <p className="mt-1 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification System - Toast notifications and modal */}
      <NotificationSystem
        gameId={gameId}
        bellSize="md"
        bellVariant="default"
        maxToastCount={3}
        toastPosition="top-right"
      />
    </motion.div>
  );
}

export default HostControlsLayout;

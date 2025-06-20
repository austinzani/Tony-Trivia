import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Crown,
  Play,
  Pause,
  Trophy,
  Clock,
  Zap,
  Target,
  CheckCircle,
  AlertCircle,
  Settings,
  RefreshCw,
  Gamepad2,
  Radio,
  MessageSquare,
  Star,
} from 'lucide-react';
import { EnhancedGameRoom } from '../components/EnhancedGameRoom';
import { TeamGameInterface } from '../components/TeamGameInterface';

interface DemoState {
  gameRoomId: string;
  teamId: string;
  gameStatus: 'lobby' | 'active' | 'paused' | 'finished';
  currentView: 'room' | 'team_interface' | 'both';
  simulationMode: 'manual' | 'auto';
  demoScenario: 'team_formation' | 'game_ready' | 'active_game' | 'post_game';
}

interface SimulationEvent {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

export default function TeamGameIntegrationDemo() {
  const [demoState, setDemoState] = useState<DemoState>({
    gameRoomId: 'demo-room-123',
    teamId: 'demo-team-alpha',
    gameStatus: 'lobby',
    currentView: 'both',
    simulationMode: 'manual',
    demoScenario: 'team_formation',
  });

  const [simulationEvents, setSimulationEvents] = useState<SimulationEvent[]>(
    []
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Demo scenarios
  const scenarios = {
    team_formation: {
      title: 'Team Formation & Setup',
      description:
        'Demonstrates team creation, member joining, and captain assignment',
      steps: [
        'Create game room',
        'Form teams',
        'Assign team captains',
        'Configure team settings',
        'Invite team members',
      ],
    },
    game_ready: {
      title: 'Game Readiness Check',
      description:
        'Shows team readiness verification and game start preparation',
      steps: [
        'Check team member status',
        'Verify all teams ready',
        'Display readiness indicators',
        'Handle unready members',
        'Enable game start',
      ],
    },
    active_game: {
      title: 'Active Game Play',
      description:
        'Real-time gameplay with team coordination and answer submission',
      steps: [
        'Present question to teams',
        'Start question timer',
        'Enable answer submission',
        'Track team responses',
        'Update scores and rankings',
      ],
    },
    post_game: {
      title: 'Post-Game Analysis',
      description: 'Team performance review and statistics',
      steps: [
        'Display final leaderboard',
        'Show team statistics',
        'Review answer history',
        'Generate team reports',
        'Plan next game session',
      ],
    },
  };

  // Simulation controls
  const startSimulation = async (scenario: keyof typeof scenarios) => {
    setIsSimulating(true);
    setCurrentStep(0);
    setSimulationEvents([]);
    setDemoState(prev => ({ ...prev, demoScenario: scenario }));

    const steps = scenarios[scenario].steps;

    for (let i = 0; i < steps.length; i++) {
      const event: SimulationEvent = {
        id: `event-${Date.now()}-${i}`,
        type: scenario,
        description: steps[i],
        timestamp: new Date().toISOString(),
        status: 'pending',
      };

      setSimulationEvents(prev => [...prev, event]);
      setCurrentStep(i);

      // Simulate step execution
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSimulationEvents(prev =>
        prev.map(e => (e.id === event.id ? { ...e, status: 'completed' } : e))
      );

      // Update demo state based on scenario
      if (scenario === 'active_game' && i === 2) {
        setDemoState(prev => ({ ...prev, gameStatus: 'active' }));
      }
    }

    setIsSimulating(false);
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setSimulationEvents([]);
    setCurrentStep(0);
  };

  // Mock data for demonstration
  const mockGameData = {
    gameRoom: {
      id: demoState.gameRoomId,
      code: 'DEMO123',
      name: 'Tony Trivia Demo Room',
      status: demoState.gameStatus,
      host_id: 'demo-host',
    },
    teams: [
      {
        id: 'team-alpha',
        name: 'Team Alpha',
        score: 150,
        memberCount: 3,
        readyMembers: 2,
      },
      {
        id: 'team-beta',
        name: 'Team Beta',
        score: 130,
        memberCount: 4,
        readyMembers: 4,
      },
      {
        id: 'team-gamma',
        name: 'Team Gamma',
        score: 95,
        memberCount: 2,
        readyMembers: 1,
      },
    ],
    currentQuestion:
      demoState.gameStatus === 'active'
        ? {
            id: 'demo-question-1',
            text: 'What is the capital city of Australia?',
            timeLimit: 30,
            category: 'Geography',
            difficulty: 'medium',
          }
        : null,
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Team-Game Integration Demo
            </h1>
            <p className="text-xl text-gray-600 mt-2">
              Experience seamless team management and game room integration
            </p>
          </div>

          {/* Demo Controls */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* View Controls */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Demo Configuration
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current View
                    </label>
                    <div className="flex space-x-2">
                      {(['room', 'team_interface', 'both'] as const).map(
                        view => (
                          <button
                            key={view}
                            onClick={() =>
                              setDemoState(prev => ({
                                ...prev,
                                currentView: view,
                              }))
                            }
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              demoState.currentView === view
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {view === 'room'
                              ? 'Game Room'
                              : view === 'team_interface'
                                ? 'Team Interface'
                                : 'Both Views'}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Game Status
                    </label>
                    <div className="flex space-x-2">
                      {(['lobby', 'active', 'paused', 'finished'] as const).map(
                        status => (
                          <button
                            key={status}
                            onClick={() =>
                              setDemoState(prev => ({
                                ...prev,
                                gameStatus: status,
                              }))
                            }
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                              demoState.gameStatus === status
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Scenario Controls */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Demo Scenarios
                </h3>

                <div className="space-y-3">
                  {Object.entries(scenarios).map(([key, scenario]) => (
                    <div key={key} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {scenario.title}
                        </h4>
                        <button
                          onClick={() =>
                            startSimulation(key as keyof typeof scenarios)
                          }
                          disabled={isSimulating}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          {isSimulating && demoState.demoScenario === key
                            ? 'Running...'
                            : 'Start'}
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">
                        {scenario.description}
                      </p>
                    </div>
                  ))}
                </div>

                {isSimulating && (
                  <button
                    onClick={stopSimulation}
                    className="mt-3 w-full bg-red-600 text-white px-4 py-2 rounded font-medium hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <Pause className="w-4 h-4" />
                    Stop Simulation
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Simulation Status */}
          {simulationEvents.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Radio className="w-5 h-5 text-blue-500" />
                Simulation Progress
              </h3>

              <div className="space-y-2">
                {simulationEvents.map((event, index) => (
                  <div
                    key={event.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      event.status === 'completed'
                        ? 'bg-green-50'
                        : event.status === 'failed'
                          ? 'bg-red-50'
                          : index === currentStep
                            ? 'bg-blue-50'
                            : 'bg-gray-50'
                    }`}
                  >
                    {event.status === 'completed' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : event.status === 'failed' ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : index === currentStep ? (
                      <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : (
                      <Clock className="w-5 h-5 text-gray-400" />
                    )}

                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {event.description}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    </div>

                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        event.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : event.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : index === currentStep
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {event.status === 'pending' && index === currentStep
                        ? 'Running'
                        : event.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Demo Content */}
        <div className="space-y-8">
          {/* Enhanced Game Room Demo */}
          {(demoState.currentView === 'room' ||
            demoState.currentView === 'both') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Gamepad2 className="w-6 h-6 text-blue-500" />
                  Enhanced Game Room
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Room ID: {demoState.gameRoomId}</span>
                  <span>•</span>
                  <span className="capitalize">
                    Status: {demoState.gameStatus}
                  </span>
                </div>
              </div>

              <EnhancedGameRoom
                gameRoomId={demoState.gameRoomId}
                className="border-2 border-dashed border-gray-200 rounded-lg p-4"
              />
            </motion.div>
          )}

          {/* Team Game Interface Demo */}
          {(demoState.currentView === 'team_interface' ||
            demoState.currentView === 'both') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-6 h-6 text-purple-500" />
                  Team Game Interface
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Team ID: {demoState.teamId}</span>
                  <span>•</span>
                  <span>3 Members</span>
                </div>
              </div>

              <TeamGameInterface
                teamId={demoState.teamId}
                gameRoomId={demoState.gameRoomId}
                className="border-2 border-dashed border-gray-200 rounded-lg p-4"
              />
            </motion.div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Integration Features
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Real-time Team Coordination
              </h3>
              <p className="text-blue-700 text-sm">
                Live member status tracking, readiness verification, and team
                communication
              </p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <Target className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Seamless Game Integration
              </h3>
              <p className="text-green-700 text-sm">
                Unified game room and team interfaces with synchronized state
                management
              </p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <Crown className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                Advanced Team Management
              </h3>
              <p className="text-purple-700 text-sm">
                Captain dashboards, member analytics, and comprehensive team
                controls
              </p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
              <Zap className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Live Game Events
              </h3>
              <p className="text-yellow-700 text-sm">
                Real-time event broadcasting, score updates, and activity
                tracking
              </p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
              <Trophy className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Competitive Leaderboards
              </h3>
              <p className="text-red-700 text-sm">
                Dynamic rankings, team statistics, and performance analytics
              </p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg">
              <Settings className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                Flexible Configuration
              </h3>
              <p className="text-indigo-700 text-sm">
                Customizable team settings, game rules, and integration options
              </p>
            </div>
          </div>
        </div>

        {/* Technical Implementation Notes */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Technical Implementation Highlights
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Real-time Architecture
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• WebSocket-based presence tracking</li>
                <li>• Supabase real-time subscriptions</li>
                <li>• Event-driven state synchronization</li>
                <li>• Automatic reconnection handling</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Team Management
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Role-based access control</li>
                <li>• Captain dashboard integration</li>
                <li>• Member activity monitoring</li>
                <li>• Team statistics and analytics</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                Game Integration
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Unified game state management</li>
                <li>• Team readiness verification</li>
                <li>• Answer submission coordination</li>
                <li>• Score and ranking updates</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                User Experience
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Responsive design patterns</li>
                <li>• Smooth animations and transitions</li>
                <li>• Intuitive navigation flows</li>
                <li>• Comprehensive error handling</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

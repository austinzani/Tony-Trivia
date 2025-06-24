import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Crown,
  Play,
  Pause,
  Settings,
  Trophy,
  Clock,
  Zap,
  Star,
  BarChart3,
  MessageSquare,
  Shield,
  AlertCircle,
  CheckCircle,
  Loader2,
  Radio,
} from 'lucide-react';
import { TeamFormationWorkflow } from './TeamFormationWorkflow';
import { TeamCaptainDashboard } from './TeamCaptainDashboard';
import { TeamStatusTracker } from './TeamStatusTracker';
import { TeamRealtimeSync } from './TeamRealtimeSync';
import { ConnectionStatus } from './ConnectionStatus';
import { RealtimeStatus } from './RealtimeStatus';
import { ChatWindow } from './chat';
import { useGameState } from '../hooks/useGameState';
import { useAuth } from '../hooks/useAuth';
import { useTeamPresence } from '../hooks/useTeamPresence';

interface EnhancedGameRoomProps {
  gameRoomId: string;
  className?: string;
}

type TabType = 'overview' | 'teams' | 'captain' | 'status' | 'chat';

interface GameEvent {
  id: string;
  type:
    | 'game_started'
    | 'question_presented'
    | 'answer_submitted'
    | 'scores_updated'
    | 'team_joined'
    | 'team_created';
  payload: any;
  timestamp: string;
  userId?: string;
  teamId?: string;
}

export function EnhancedGameRoom({
  gameRoomId,
  className = '',
}: EnhancedGameRoomProps) {
  const { user } = useAuth();
  const {
    gameRoom,
    teams,
    gameState,
    userTeam,
    isHost,
    loading,
    error,
    connectionStatus,
    joinGame,
    createTeam,
    joinTeam,
    leaveTeam,
    startGame,
    submitAnswer,
    refreshData,
  } = useGameState(gameRoomId);

  const {
    members: teamMembers,
    activities: teamActivities,
    connectionState,
    updateStatus,
    broadcastActivity,
  } = useTeamPresence(userTeam?.id || '');

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [showTeamChat, setShowTeamChat] = useState(false);
  const [gameReadyCheck, setGameReadyCheck] = useState<Record<string, boolean>>(
    {}
  );

  // Auto-switch to captain tab if user becomes a team captain
  useEffect(() => {
    if (
      userTeam &&
      teamMembers.some(
        member => member.user_id === user?.id && member.role === 'captain'
      )
    ) {
      // Don't auto-switch if already on captain tab
      if (activeTab === 'overview' || activeTab === 'teams') {
        setActiveTab('captain');
      }
    }
  }, [userTeam, teamMembers, user?.id, activeTab]);

  // Handle game events
  const handleGameEvent = useCallback(
    (event: GameEvent) => {
      setEvents(prev => [...prev, event].slice(-20)); // Keep last 20 events

      // Broadcast team activity for relevant events
      if (userTeam && event.teamId === userTeam.id) {
        broadcastActivity({
          type: 'game_event',
          description: `Game event: ${event.type}`,
          metadata: { eventType: event.type, payload: event.payload },
        });
      }
    },
    [userTeam, broadcastActivity]
  );

  // Enhanced team creation with captain assignment
  const handleCreateTeam = async (teamData: any) => {
    const result = await createTeam(teamData.name);

    if (result.success) {
      // Broadcast team creation activity
      broadcastActivity({
        type: 'team_created',
        description: `Created team "${teamData.name}"`,
        metadata: { teamName: teamData.name },
      });

      handleGameEvent({
        id: `team_created_${Date.now()}`,
        type: 'team_created',
        payload: { teamName: teamData.name, teamId: result.error }, // Assuming result contains team ID
        timestamp: new Date().toISOString(),
        userId: user?.id,
        teamId: result.error,
      });
    }

    return result;
  };

  // Enhanced team joining with status update
  const handleJoinTeam = async (teamId: string) => {
    const result = await joinTeam(teamId);

    if (result.success) {
      const team = teams.find(t => t.id === teamId);

      // Update presence status to indicate team membership
      updateStatus('online');

      // Broadcast team join activity
      broadcastActivity({
        type: 'team_joined',
        description: `Joined team "${team?.name}"`,
        metadata: { teamId, teamName: team?.name },
      });

      handleGameEvent({
        id: `team_joined_${Date.now()}`,
        type: 'team_joined',
        payload: { teamId, teamName: team?.name, userId: user?.id },
        timestamp: new Date().toISOString(),
        userId: user?.id,
        teamId,
      });
    }

    return result;
  };

  // Enhanced game start with team readiness check
  const handleStartGame = async () => {
    if (!isHost) return;

    // Check if all teams are ready
    const teamsWithMembers = teams.filter(
      team =>
        teamMembers.filter(member => member.team_id === team.id).length > 0
    );

    if (teamsWithMembers.length === 0) {
      alert('Cannot start game: No teams have members');
      return;
    }

    // Check team readiness (all online members)
    const unreadyTeams = teamsWithMembers.filter(team => {
      const teamMemberIds = teamMembers
        .filter(member => member.team_id === team.id)
        .map(member => member.user_id);

      return teamMemberIds.some(
        memberId =>
          !teamMembers.find(
            m => m.user_id === memberId && m.status === 'online'
          )
      );
    });

    if (unreadyTeams.length > 0) {
      const confirmStart = confirm(
        `Some teams have offline members. Start anyway?\n\nUnready teams: ${unreadyTeams.map(t => t.name).join(', ')}`
      );
      if (!confirmStart) return;
    }

    const result = await startGame();

    if (result.success) {
      handleGameEvent({
        id: `game_started_${Date.now()}`,
        type: 'game_started',
        payload: { gameRoomId, startedBy: user?.id },
        timestamp: new Date().toISOString(),
        userId: user?.id,
      });

      // Update all team members status to in_game
      updateStatus('in_game');
    }
  };

  // Team readiness check
  const checkTeamReadiness = () => {
    const readiness: Record<string, boolean> = {};

    teams.forEach(team => {
      const teamMemberIds = teamMembers
        .filter(member => member.team_id === team.id)
        .map(member => member.user_id);

      const onlineMembers = teamMemberIds.filter(memberId =>
        teamMembers.find(
          m => m.user_id === memberId && ['online', 'ready'].includes(m.status)
        )
      );

      readiness[team.id] =
        teamMemberIds.length > 0 &&
        onlineMembers.length === teamMemberIds.length;
    });

    setGameReadyCheck(readiness);
  };

  // Check team readiness when teams or members change
  useEffect(() => {
    checkTeamReadiness();
  }, [teams, teamMembers]);

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'teams', label: 'Teams', icon: Users },
    ...(userTeam &&
    teamMembers.some(m => m.user_id === user?.id && m.role === 'captain')
      ? [{ id: 'captain', label: 'Captain', icon: Crown }]
      : []),
    ...(userTeam ? [{ id: 'status', label: 'Live Status', icon: Radio }] : []),
    ...(userTeam
      ? [{ id: 'chat', label: 'Team Chat', icon: MessageSquare }]
      : []),
  ];

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-96 ${className}`}>
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
          <p className="text-gray-600">Loading game room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}
      >
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Error loading game room
            </h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={refreshData}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ConnectionStatus
          gameRoomId={gameRoomId}
          showDetails={true}
          onConnectionChange={() => {}}
        />
        {userTeam && (
          <TeamRealtimeSync
            teamId={userTeam.id}
            gameRoomId={gameRoomId}
            showControls={true}
          />
        )}
      </div>

      {/* Game Room Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {gameRoom?.name}
              {isHost && <Crown className="w-5 h-5 text-yellow-500" />}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
              <span>
                Room Code:{' '}
                <span className="font-mono font-semibold">
                  {gameRoom?.code}
                </span>
              </span>
              <span>•</span>
              <span>
                Status: <span className="capitalize">{gameRoom?.status}</span>
              </span>
              <span>•</span>
              <span>{teams.length} Teams</span>
            </div>
          </div>

          <RealtimeStatus
            connectionStatus={{
              gameRoom: connectionStatus.gameRoom,
              teams: connectionStatus.teams,
              gameState: connectionStatus.gameState,
              teamAnswers: connectionStatus.teamAnswers,
            }}
            showDetails={true}
            className="w-64"
          />
        </div>

        {/* Game Status Indicator */}
        {gameState && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {gameState.status === 'lobby' && (
                  <Users className="w-5 h-5 text-blue-500" />
                )}
                {gameState.status === 'active' && (
                  <Zap className="w-5 h-5 text-green-500" />
                )}
                {gameState.status === 'paused' && (
                  <Pause className="w-5 h-5 text-yellow-500" />
                )}
                {gameState.status === 'finished' && (
                  <Trophy className="w-5 h-5 text-purple-500" />
                )}

                <span className="font-medium capitalize">
                  {gameState.status}
                </span>

                {gameState.current_question_id && (
                  <span className="text-sm text-gray-600">
                    • Question Active
                  </span>
                )}
              </div>

              {/* Host Controls */}
              {isHost && gameRoom?.status === 'lobby' && (
                <button
                  onClick={handleStartGame}
                  disabled={teams.length === 0}
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start Game
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <OverviewTab
                gameRoom={gameRoom}
                teams={teams}
                gameState={gameState}
                events={events}
                gameReadyCheck={gameReadyCheck}
                isHost={isHost}
                userTeam={userTeam}
              />
            )}

            {activeTab === 'teams' && (
              <TeamsTab
                gameRoomId={gameRoomId}
                gameRoomName={gameRoom?.name || ''}
                teams={teams}
                userTeam={userTeam}
                onCreateTeam={handleCreateTeam}
                onJoinTeam={handleJoinTeam}
                onLeaveTeam={leaveTeam}
              />
            )}

            {activeTab === 'captain' && userTeam && (
              <CaptainTab teamId={userTeam.id} gameRoomId={gameRoomId} />
            )}

            {activeTab === 'status' && userTeam && (
              <StatusTab teamId={userTeam.id} gameRoomId={gameRoomId} />
            )}

            {activeTab === 'chat' && userTeam && (
              <ChatTab teamId={userTeam.id} gameRoomId={gameRoomId} />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({
  gameRoom,
  teams,
  gameState,
  events,
  gameReadyCheck,
  isHost,
  userTeam,
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Game Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Teams</p>
              <p className="text-2xl font-bold text-blue-900">{teams.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Ready Teams</p>
              <p className="text-2xl font-bold text-green-900">
                {Object.values(gameReadyCheck).filter(Boolean).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Game Status</p>
              <p className="text-lg font-bold text-purple-900 capitalize">
                {gameState?.status || 'Lobby'}
              </p>
            </div>
            {gameState?.status === 'active' ? (
              <Zap className="w-8 h-8 text-purple-500" />
            ) : (
              <Clock className="w-8 h-8 text-purple-500" />
            )}
          </div>
        </div>
      </div>

      {/* Team Readiness Status */}
      {teams.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Team Readiness
          </h3>
          <div className="space-y-2">
            {teams.map(team => (
              <div key={team.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{team.name}</span>
                <div className="flex items-center gap-2">
                  {gameReadyCheck[team.id] ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-green-600">Ready</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs text-yellow-600">Waiting</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Events */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Recent Activity
        </h3>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {events
            .slice(-5)
            .reverse()
            .map((event: GameEvent, index: number) => (
              <div
                key={index}
                className="text-sm text-gray-600 p-2 bg-gray-50 rounded"
              >
                <span className="font-medium capitalize">
                  {event.type.replace('_', ' ')}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          {events.length === 0 && (
            <p className="text-gray-500 text-sm">No recent activity</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Teams Tab Component
function TeamsTab({
  gameRoomId,
  gameRoomName,
  teams,
  userTeam,
  onCreateTeam,
  onJoinTeam,
  onLeaveTeam,
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <TeamFormationWorkflow
        gameRoomId={gameRoomId}
        gameRoomName={gameRoomName}
        onTeamCreated={onCreateTeam}
        onTeamJoined={onJoinTeam}
        onTeamLeft={onLeaveTeam}
      />
    </motion.div>
  );
}

// Captain Tab Component
function CaptainTab({
  teamId,
  gameRoomId,
}: {
  teamId: string;
  gameRoomId: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <TeamCaptainDashboard teamId={teamId} gameRoomId={gameRoomId} />
    </motion.div>
  );
}

// Status Tab Component
function StatusTab({
  teamId,
  gameRoomId,
}: {
  teamId: string;
  gameRoomId: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <TeamStatusTracker
        teamId={teamId}
        gameRoomId={gameRoomId}
        showControls={true}
        viewMode="full"
      />
    </motion.div>
  );
}

// Chat Tab Component
function ChatTab({
  teamId,
  gameRoomId,
}: {
  teamId: string;
  gameRoomId: string;
}) {
  const { user } = useAuth();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      <div className="flex justify-center">
        <ChatWindow 
          gameRoomId={gameRoomId} 
          teamId={teamId}
          className="w-full max-w-2xl"
        />
      </div>
    </motion.div>
  );
}

export default EnhancedGameRoom;

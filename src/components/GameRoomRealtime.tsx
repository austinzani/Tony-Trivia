import React, { useEffect, useState } from 'react';
import { useGameState } from '../hooks/useGameState';
import { usePresence, useOnlineUsersList } from '../hooks/usePresence';
import { useBroadcast, useBroadcastListener } from '../hooks/useBroadcast';
import RealtimeStatus from './RealtimeStatus';
import ConnectionStatus from './ConnectionStatus';

interface GameRoomRealtimeProps {
  gameRoomId: string;
  className?: string;
}

export default function GameRoomRealtime({
  gameRoomId,
  className = '',
}: GameRoomRealtimeProps) {
  const [isConnected, setIsConnected] = useState(false);

  // Game state with real-time updates
  const {
    gameRoom,
    teams,
    gameState,
    userTeam,
    isHost,
    loading,
    error,
    connectionStatus,
    createTeam,
    joinTeam,
    startGame,
    submitAnswer,
  } = useGameState(gameRoomId);

  // Presence tracking
  const { users: onlineUsers, userCount } = useOnlineUsersList(gameRoomId);

  // Broadcast system
  const { sendEvent: broadcastEvent, isConnected: broadcastConnected } =
    useBroadcast(gameRoomId);
  const { events, lastEvent } = useBroadcastListener(gameRoomId);

  // Handle game events
  useEffect(() => {
    if (!lastEvent) return;

    switch (lastEvent.type) {
      case 'game_started':
        console.log('Game started!', lastEvent.payload);
        // Show notification or update UI
        break;

      case 'question_presented':
        console.log('New question presented!', lastEvent.payload);
        // Start timer, show question
        break;

      case 'answers_locked':
        console.log('Answers locked!', lastEvent.payload);
        // Disable answer input
        break;

      case 'scores_updated':
        console.log('Scores updated!', lastEvent.payload);
        // Update score display
        break;

      case 'game_ended':
        console.log('Game ended!', lastEvent.payload);
        // Show final scores
        break;
    }
  }, [lastEvent]);

  // Example host actions
  const handleStartGame = async () => {
    if (!isHost) return;

    const result = await startGame();
    if (result.success) {
      // Broadcast game start event
      await broadcastEvent({
        type: 'game_started',
        payload: {
          gameRoomId,
          startedAt: new Date().toISOString(),
          hostId: gameRoom?.host_id || '',
        },
      });
    }
  };

  const handlePresentQuestion = async (questionData: any) => {
    if (!isHost) return;

    await broadcastEvent({
      type: 'question_presented',
      payload: {
        questionId: questionData.id,
        roundId: questionData.roundId,
        question: {
          text: questionData.text,
          type: questionData.type,
          difficulty: questionData.difficulty,
          points: questionData.points,
          media_url: questionData.media_url,
        },
        timeLimit: questionData.timeLimit,
        presentedAt: new Date().toISOString(),
      },
    });
  };

  const handleUpdateScores = async (scores: any[]) => {
    if (!isHost) return;

    await broadcastEvent({
      type: 'scores_updated',
      payload: {
        gameRoomId,
        scores,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  // Example player actions
  const handleCreateTeam = async (teamName: string) => {
    const result = await createTeam(teamName);
    if (!result.success) {
      console.error('Failed to create team:', result.error);
    }
  };

  const handleJoinTeam = async (teamId: string) => {
    const result = await joinTeam(teamId);
    if (!result.success) {
      console.error('Failed to join team:', result.error);
    }
  };

  const handleSubmitAnswer = async (questionId: string, answer: string) => {
    const result = await submitAnswer(questionId, answer);
    if (!result.success) {
      console.error('Failed to submit answer:', result.error);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game room...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-red-400 mr-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-red-800">
              Error loading game room
            </h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Connection Status */}
      <ConnectionStatus
        gameRoomId={gameRoomId}
        showDetails={true}
        onConnectionChange={setIsConnected}
      />

      {/* Game Room Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {gameRoom?.name}
            </h1>
            <p className="text-sm text-gray-600">Room Code: {gameRoom?.code}</p>
            <p className="text-sm text-gray-600">Status: {gameRoom?.status}</p>
          </div>

          <RealtimeStatus
            connectionStatus={connectionStatus}
            showDetails={true}
            className="w-64"
          />
        </div>

        {/* Online Users */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            Online ({userCount})
          </h3>
          <div className="flex flex-wrap gap-2">
            {onlineUsers.map((user, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  user.role === 'host'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {user.role === 'host' && (
                  <svg
                    className="w-3 h-3 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {user.username}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Teams Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Teams</h2>
          {!userTeam && (
            <button
              onClick={() => handleCreateTeam(`Team ${teams.length + 1}`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Create Team
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => (
            <div key={team.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{team.name}</h3>
                <span className="text-sm text-gray-600">
                  Score: {team.score}
                </span>
              </div>

              {!userTeam && (
                <button
                  onClick={() => handleJoinTeam(team.id)}
                  className="w-full bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200"
                >
                  Join Team
                </button>
              )}

              {userTeam?.id === team.id && (
                <span className="text-xs text-green-600 font-medium">
                  Your Team
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Host Controls */}
      {isHost && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Host Controls
          </h2>

          <div className="flex space-x-4">
            {gameRoom?.status === 'lobby' && (
              <button
                onClick={handleStartGame}
                disabled={!broadcastConnected || teams.length === 0}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:bg-gray-400"
              >
                Start Game
              </button>
            )}

            <button
              onClick={() =>
                handleUpdateScores(
                  teams.map(team => ({
                    teamId: team.id,
                    teamName: team.name,
                    score: team.score,
                  }))
                )
              }
              disabled={!broadcastConnected}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400"
            >
              Update Scores
            </button>
          </div>
        </div>
      )}

      {/* Recent Events */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Events
        </h2>

        <div className="space-y-2 max-h-32 overflow-y-auto">
          {events
            .slice(-5)
            .reverse()
            .map((event, index) => (
              <div
                key={index}
                className="text-sm text-gray-600 p-2 bg-gray-50 rounded"
              >
                <span className="font-medium">
                  {event.type.replace('_', ' ')}
                </span>
                {event.type === 'game_started' && ' - Game has begun!'}
                {event.type === 'question_presented' &&
                  ` - New question: ${event.payload.question?.text?.substring(0, 50)}...`}
                {event.type === 'scores_updated' && ' - Team scores updated'}
              </div>
            ))}

          {events.length === 0 && (
            <p className="text-gray-500 text-sm">No events yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

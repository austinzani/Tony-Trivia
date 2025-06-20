import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  FastForward,
  Clock,
  Users,
  Trophy,
  AlertCircle,
  CheckCircle,
  Settings,
  BarChart3,
  Timer,
  Activity,
} from 'lucide-react';
import {
  useGameController,
  useGameProgression,
  useGameControllerEvents,
  useGameControllerMetrics,
  useGamePhase,
} from '../../hooks/useGameController';
import { GameProgressionPhase } from '../../types/gameController';

interface GameControllerProps {
  gameId: string;
  className?: string;
}

// Main Game Controller Component
export function GameController({
  gameId,
  className = '',
}: GameControllerProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div
      className={`game-controller bg-white rounded-lg shadow-lg p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Game Controller</h2>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
        >
          <Settings className="w-4 h-4 mr-1" />
          {showAdvanced ? 'Simple' : 'Advanced'}
        </button>
      </div>

      <div className="space-y-6">
        <GameControlPanel gameId={gameId} />
        <GameProgressionDisplay gameId={gameId} />

        {showAdvanced && (
          <>
            <GamePhaseManager gameId={gameId} />
            <GameMetricsPanel gameId={gameId} />
            <GameEventLog gameId={gameId} />
          </>
        )}
      </div>
    </div>
  );
}

// Game Control Panel
export function GameControlPanel({ gameId }: { gameId: string }) {
  const {
    isInitialized,
    isActive,
    isPaused,
    currentPhase,
    canAdvance,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    advancePhase,
    skipQuestion,
    error,
    clearError,
  } = useGameController(gameId);

  const handleStartGame = async () => {
    try {
      await startGame();
    } catch (err) {
      console.error('Failed to start game:', err);
    }
  };

  const handlePauseGame = async () => {
    try {
      await pauseGame('User requested pause');
    } catch (err) {
      console.error('Failed to pause game:', err);
    }
  };

  const handleResumeGame = async () => {
    try {
      await resumeGame();
    } catch (err) {
      console.error('Failed to resume game:', err);
    }
  };

  const handleEndGame = async () => {
    if (window.confirm('Are you sure you want to end the game?')) {
      try {
        await endGame();
      } catch (err) {
        console.error('Failed to end game:', err);
      }
    }
  };

  const handleAdvancePhase = async () => {
    try {
      await advancePhase();
    } catch (err) {
      console.error('Failed to advance phase:', err);
    }
  };

  const handleSkipQuestion = async () => {
    if (window.confirm('Are you sure you want to skip this question?')) {
      try {
        await skipQuestion();
      } catch (err) {
        console.error('Failed to skip question:', err);
      }
    }
  };

  return (
    <div className="game-control-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Game Controls</h3>
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isActive
                ? 'bg-green-500'
                : isPaused
                  ? 'bg-yellow-500'
                  : 'bg-gray-300'
            }`}
          />
          <span className="text-sm text-gray-600">
            {isActive ? 'Active' : isPaused ? 'Paused' : 'Inactive'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
            <button
              onClick={clearError}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {!isInitialized && (
          <div className="col-span-full">
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-md">
              <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mr-2" />
              <span className="text-gray-600">Initializing...</span>
            </div>
          </div>
        )}

        {isInitialized && !isActive && (
          <button
            onClick={handleStartGame}
            className="flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Game
          </button>
        )}

        {isActive && !isPaused && (
          <button
            onClick={handlePauseGame}
            className="flex items-center justify-center px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
          >
            <Pause className="w-4 h-4 mr-2" />
            Pause
          </button>
        )}

        {isPaused && (
          <button
            onClick={handleResumeGame}
            className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <Play className="w-4 h-4 mr-2" />
            Resume
          </button>
        )}

        {isActive && (
          <button
            onClick={handleEndGame}
            className="flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            <Square className="w-4 h-4 mr-2" />
            End Game
          </button>
        )}

        {canAdvance && (
          <button
            onClick={handleAdvancePhase}
            className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            <FastForward className="w-4 h-4 mr-2" />
            Next Phase
          </button>
        )}

        {currentPhase === GameProgressionPhase.ANSWER_COLLECTION && (
          <button
            onClick={handleSkipQuestion}
            className="flex items-center justify-center px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Skip Question
          </button>
        )}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <div className="text-sm text-gray-600">
          <strong>Current Phase:</strong> {formatPhase(currentPhase)}
        </div>
      </div>
    </div>
  );
}

// Game Progression Display
export function GameProgressionDisplay({ gameId }: { gameId: string }) {
  const {
    currentPhase,
    isActive,
    currentQuestionIndex,
    totalQuestions,
    questionsAnswered,
    currentRoundIndex,
    totalRounds,
    roundsCompleted,
    questionProgress,
    roundProgress,
    overallProgress,
    estimatedTimeRemaining,
    averageAnswerTime,
  } = useGameProgression(gameId);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className="game-progression-display">
      <h3 className="text-lg font-semibold mb-4">Game Progress</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Overall Progress */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Activity className="w-5 h-5 text-blue-500 mr-2" />
            <span className="font-medium text-blue-900">Overall Progress</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {overallProgress.toFixed(1)}%
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Question Progress */}
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="font-medium text-green-900">Questions</span>
          </div>
          <div className="text-2xl font-bold text-green-900">
            {questionsAnswered} / {totalQuestions}
          </div>
          <div className="w-full bg-green-200 rounded-full h-2 mt-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${questionProgress}%` }}
            />
          </div>
        </div>

        {/* Round Progress */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center mb-2">
            <Trophy className="w-5 h-5 text-purple-500 mr-2" />
            <span className="font-medium text-purple-900">Rounds</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {roundsCompleted} / {totalRounds}
          </div>
          <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${roundProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Current Round:</span>
            <span className="font-medium">Round {currentRoundIndex + 1}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Current Question:</span>
            <span className="font-medium">
              Question {currentQuestionIndex + 1}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Phase:</span>
            <span className="font-medium">{formatPhase(currentPhase)}</span>
          </div>
        </div>

        <div className="space-y-3">
          {estimatedTimeRemaining > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Est. Time Remaining:</span>
              <span className="font-medium">
                {formatTime(estimatedTimeRemaining)}
              </span>
            </div>
          )}
          {averageAnswerTime > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Avg. Answer Time:</span>
              <span className="font-medium">
                {formatTime(averageAnswerTime)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span
              className={`font-medium ${
                isActive ? 'text-green-600' : 'text-gray-600'
              }`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Game Phase Manager
export function GamePhaseManager({ gameId }: { gameId: string }) {
  const { currentPhase, isTransitioning, canAdvance, nextPhase, advancePhase } =
    useGamePhase(gameId);

  const phases = Object.values(GameProgressionPhase);
  const currentPhaseIndex = phases.indexOf(currentPhase);

  return (
    <div className="game-phase-manager">
      <h3 className="text-lg font-semibold mb-4">Phase Manager</h3>

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600">Phase Progress</span>
          <span className="text-sm text-gray-600">
            {currentPhaseIndex + 1} / {phases.length}
          </span>
        </div>

        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${((currentPhaseIndex + 1) / phases.length) * 100}%`,
              }}
            />
          </div>

          {isTransitioning && (
            <div className="absolute inset-0 bg-blue-200 rounded-full animate-pulse" />
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-600">Current Phase</div>
          <div className="font-medium">{formatPhase(currentPhase)}</div>
        </div>

        {nextPhase && (
          <div className="text-center p-3 bg-blue-50 rounded-md">
            <div className="text-sm text-gray-600">Next Phase</div>
            <div className="font-medium">{formatPhase(nextPhase)}</div>
          </div>
        )}

        <div className="text-center p-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-600">Status</div>
          <div className="font-medium">
            {isTransitioning
              ? 'Transitioning...'
              : canAdvance
                ? 'Ready'
                : 'Waiting'}
          </div>
        </div>
      </div>

      {canAdvance && !isTransitioning && (
        <button
          onClick={advancePhase}
          className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          <FastForward className="w-4 h-4 mr-2" />
          Advance to Next Phase
        </button>
      )}
    </div>
  );
}

// Game Metrics Panel
export function GameMetricsPanel({ gameId }: { gameId: string }) {
  const {
    metrics,
    engagementScore,
    performanceInsights,
    totalPhaseTransitions,
    averagePhaseTransitionTime,
    errorCount,
    pauseCount,
    averageResponseTime,
    completionRate,
  } = useGameControllerMetrics(gameId);

  return (
    <div className="game-metrics-panel">
      <h3 className="text-lg font-semibold mb-4">Game Metrics</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-900">
            {engagementScore.toFixed(1)}
          </div>
          <div className="text-sm text-blue-700">Engagement Score</div>
        </div>

        <div className="bg-green-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-900">
            {(completionRate * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-green-700">Completion Rate</div>
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-900">
            {totalPhaseTransitions}
          </div>
          <div className="text-sm text-yellow-700">Phase Transitions</div>
        </div>

        <div className="bg-red-50 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-900">{errorCount}</div>
          <div className="text-sm text-red-700">Errors</div>
        </div>
      </div>

      {performanceInsights.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium mb-2">Performance Insights</h4>
          <div className="space-y-2">
            {performanceInsights.map((insight, index) => (
              <div
                key={index}
                className="flex items-start p-2 bg-yellow-50 rounded-md"
              >
                <AlertCircle className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-yellow-800">{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Avg. Response Time:</span>
            <span className="font-medium">
              {(averageResponseTime / 1000).toFixed(1)}s
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Avg. Transition Time:</span>
            <span className="font-medium">
              {averagePhaseTransitionTime.toFixed(0)}ms
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Pause Count:</span>
            <span className="font-medium">{pauseCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Error Count:</span>
            <span className="font-medium">{errorCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Game Event Log
export function GameEventLog({ gameId }: { gameId: string }) {
  const { events, clearEvents } = useGameControllerEvents(gameId);
  const [maxEvents, setMaxEvents] = useState(10);

  const displayEvents = events.slice(-maxEvents);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'initialized':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'started':
        return <Play className="w-4 h-4 text-green-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'resumed':
        return <Play className="w-4 h-4 text-blue-500" />;
      case 'ended':
        return <Square className="w-4 h-4 text-red-500" />;
      case 'phase_changed':
        return <FastForward className="w-4 h-4 text-blue-500" />;
      case 'error_occurred':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="game-event-log">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Event Log</h3>
        <div className="flex items-center space-x-2">
          <select
            value={maxEvents}
            onChange={e => setMaxEvents(Number(e.target.value))}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            <option value={5}>5 events</option>
            <option value={10}>10 events</option>
            <option value={25}>25 events</option>
            <option value={50}>50 events</option>
          </select>
          <button
            onClick={clearEvents}
            className="text-sm px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
        {displayEvents.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No events yet</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayEvents.map((event, index) => (
              <div
                key={`${event.timestamp}-${index}`}
                className="p-3 hover:bg-gray-50"
              >
                <div className="flex items-start space-x-3">
                  {getEventIcon(event.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {event.type
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {event.data?.message && (
                      <p className="text-sm text-gray-600 mt-1">
                        {event.data.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Utility function to format phase names
function formatPhase(phase: GameProgressionPhase): string {
  return phase
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

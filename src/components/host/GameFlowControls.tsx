import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  FastForward,
  Clock,
  CheckCircle,
  AlertTriangle,
  Target,
  Trophy,
  Zap,
  Timer,
  Users,
  Activity,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { useGameController } from '../../hooks/useGameController';
import { GameProgressionPhase } from '../../types/gameController';
import '../../styles/gameflow.css';

interface GameFlowControlsProps {
  gameId: string;
  className?: string;
}

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

// Stylized confirmation dialog component
function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  variant = 'warning',
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const variantStyles = {
    danger: {
      gradient: 'from-red-500 to-pink-500',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      confirmBg: 'bg-red-500 hover:bg-red-600',
    },
    warning: {
      gradient: 'from-yellow-500 to-orange-500',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      confirmBg: 'bg-yellow-500 hover:bg-yellow-600',
    },
    success: {
      gradient: 'from-green-500 to-emerald-500',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      confirmBg: 'bg-green-500 hover:bg-green-600',
    },
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div
              className={`bg-gradient-to-r ${styles.gradient} p-6 text-white`}
            >
              <div className="flex items-center space-x-3">
                <div className={`${styles.iconBg} p-2 rounded-lg`}>
                  <AlertTriangle className={`w-6 h-6 ${styles.iconColor}`} />
                </div>
                <h3 className="text-xl font-bold">{title}</h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {message}
              </p>

              {/* Action buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 px-4 py-3 ${styles.confirmBg} text-white rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Progress ring component
function ProgressRing({
  progress,
  size = 60,
  strokeWidth = 4,
  children,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90 absolute inset-0"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="text-blue-500 transition-all duration-300 ease-out"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

export function GameFlowControls({
  gameId,
  className = '',
}: GameFlowControlsProps) {
  const {
    state,
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

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant?: 'danger' | 'warning' | 'success';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => {},
  });

  const [isLoading, setIsLoading] = useState(false);

  // Calculate progress based on game state
  const gameProgress = state
    ? (state.roundProgression.roundsCompleted /
        state.roundProgression.totalRounds) *
      100
    : 0;

  const questionProgress = state
    ? (state.questionProgression.questionsAnswered /
        state.questionProgression.totalQuestions) *
      100
    : 0;

  const showConfirmDialog = (config: typeof confirmDialog) => {
    setConfirmDialog({ ...config, isOpen: true });
  };

  const hideConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleStartGame = () => {
    showConfirmDialog({
      title: 'Start Game',
      message:
        'Ready to begin the trivia showdown? Once started, all players will see the first question!',
      confirmText: 'Start Game!',
      variant: 'success',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await startGame();
        } catch (err) {
          console.error('Failed to start game:', err);
        } finally {
          setIsLoading(false);
          hideConfirmDialog();
        }
      },
    });
  };

  const handlePauseGame = () => {
    showConfirmDialog({
      title: 'Pause Game',
      message:
        'This will pause the current question timer and freeze the game state. Players will see a pause indicator.',
      confirmText: 'Pause Game',
      variant: 'warning',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await pauseGame('Host paused the game');
        } catch (err) {
          console.error('Failed to pause game:', err);
        } finally {
          setIsLoading(false);
          hideConfirmDialog();
        }
      },
    });
  };

  const handleEndGame = () => {
    showConfirmDialog({
      title: 'End Game',
      message:
        'This will permanently end the current game and show final results. This action cannot be undone!',
      confirmText: 'End Game',
      variant: 'danger',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await endGame();
        } catch (err) {
          console.error('Failed to end game:', err);
        } finally {
          setIsLoading(false);
          hideConfirmDialog();
        }
      },
    });
  };

  const handleSkipQuestion = () => {
    showConfirmDialog({
      title: 'Skip Question',
      message:
        'This will move to the next question without waiting for answers. No points will be awarded for the current question.',
      confirmText: 'Skip Question',
      variant: 'warning',
      onConfirm: async () => {
        setIsLoading(true);
        try {
          await skipQuestion();
        } catch (err) {
          console.error('Failed to skip question:', err);
        } finally {
          setIsLoading(false);
          hideConfirmDialog();
        }
      },
    });
  };

  const handleAdvancePhase = async () => {
    setIsLoading(true);
    try {
      await advancePhase();
    } catch (err) {
      console.error('Failed to advance phase:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhase = (phase: GameProgressionPhase) => {
    return phase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getPhaseColor = (phase: GameProgressionPhase) => {
    switch (phase) {
      case GameProgressionPhase.PRE_GAME:
        return 'text-blue-600 bg-blue-100';
      case GameProgressionPhase.QUESTION_DISPLAY:
      case GameProgressionPhase.ANSWER_COLLECTION:
        return 'text-green-600 bg-green-100';
      case GameProgressionPhase.SCORING:
      case GameProgressionPhase.ANSWER_REVIEW:
        return 'text-yellow-600 bg-yellow-100';
      case GameProgressionPhase.ROUND_RESULTS:
      case GameProgressionPhase.FINAL_RESULTS:
        return 'text-purple-600 bg-purple-100';
      case GameProgressionPhase.ERROR_STATE:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`game-flow-controls ${className}`}>
      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="mb-6 p-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold">Game Error</h4>
                  <p className="text-red-100">{error}</p>
                </div>
              </div>
              <button
                onClick={clearError}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Current Phase */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600">Current Phase</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-center space-x-3">
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${getPhaseColor(currentPhase || GameProgressionPhase.INITIALIZATION)}`}
            >
              {formatPhase(currentPhase || GameProgressionPhase.INITIALIZATION)}
            </div>
            {(isActive || isPaused) && (
              <div
                className={`w-3 h-3 rounded-full ${
                  isPaused
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-green-500 animate-pulse'
                }`}
              />
            )}
          </div>
        </div>

        {/* Round Progress */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600">
              Round Progress
            </h3>
            <Trophy className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-center space-x-4">
            <ProgressRing progress={gameProgress} size={50} strokeWidth={4}>
              <span className="text-sm font-bold text-gray-700">
                {state?.roundProgression.roundsCompleted || 0}/
                {state?.roundProgression.totalRounds || 0}
              </span>
            </ProgressRing>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {Math.round(gameProgress)}%
              </div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>
        </div>

        {/* Question Progress */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-600">
              Question Progress
            </h3>
            <Target className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex items-center space-x-4">
            <ProgressRing progress={questionProgress} size={50} strokeWidth={4}>
              <span className="text-sm font-bold text-gray-700">
                {state?.questionProgression.questionsAnswered || 0}/
                {state?.questionProgression.totalQuestions || 0}
              </span>
            </ProgressRing>
            <div>
              <div className="text-lg font-bold text-gray-900">
                {Math.round(questionProgress)}%
              </div>
              <div className="text-sm text-gray-500">Answered</div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Controls */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <Zap className="w-6 h-6 mr-2 text-blue-500" />
          Game Controls
        </h3>

        {!isInitialized && (
          <div className="flex items-center justify-center p-8 bg-white/50 rounded-xl border-2 border-dashed border-gray-300">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
              <div className="text-lg font-medium text-gray-700">
                Initializing Game Controller...
              </div>
              <div className="text-sm text-gray-500">
                Setting up game state and dependencies
              </div>
            </div>
          </div>
        )}

        {isInitialized && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Start/Resume Game */}
            {(!isActive || isPaused) && (
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={isPaused ? resumeGame : handleStartGame}
                disabled={isLoading}
                className="flex flex-col items-center p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="bg-white/20 p-3 rounded-lg mb-3 group-hover:bg-white/30 transition-colors">
                  <Play className="w-8 h-8" />
                </div>
                <span className="text-lg font-bold">
                  {isPaused ? 'Resume Game' : 'Start Game'}
                </span>
                <span className="text-green-100 text-sm">
                  {isPaused ? 'Continue where left off' : 'Begin the trivia'}
                </span>
              </motion.button>
            )}

            {/* Pause Game */}
            {isActive && !isPaused && (
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePauseGame}
                disabled={isLoading}
                className="flex flex-col items-center p-6 bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="bg-white/20 p-3 rounded-lg mb-3 group-hover:bg-white/30 transition-colors">
                  <Pause className="w-8 h-8" />
                </div>
                <span className="text-lg font-bold">Pause Game</span>
                <span className="text-yellow-100 text-sm">
                  Freeze current state
                </span>
              </motion.button>
            )}

            {/* Advance Phase */}
            {canAdvance && (
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAdvancePhase}
                disabled={isLoading}
                className="flex flex-col items-center p-6 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="bg-white/20 p-3 rounded-lg mb-3 group-hover:bg-white/30 transition-colors">
                  <ArrowRight className="w-8 h-8" />
                </div>
                <span className="text-lg font-bold">Advance Phase</span>
                <span className="text-blue-100 text-sm">
                  Move to next stage
                </span>
              </motion.button>
            )}

            {/* Skip Question */}
            {isActive &&
              (currentPhase === GameProgressionPhase.QUESTION_DISPLAY ||
                currentPhase === GameProgressionPhase.ANSWER_COLLECTION) && (
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSkipQuestion}
                  disabled={isLoading}
                  className="flex flex-col items-center p-6 bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="bg-white/20 p-3 rounded-lg mb-3 group-hover:bg-white/30 transition-colors">
                    <SkipForward className="w-8 h-8" />
                  </div>
                  <span className="text-lg font-bold">Skip Question</span>
                  <span className="text-gray-100 text-sm">
                    Move to next question
                  </span>
                </motion.button>
              )}

            {/* End Game */}
            {isActive && (
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleEndGame}
                disabled={isLoading}
                className="flex flex-col items-center p-6 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="bg-white/20 p-3 rounded-lg mb-3 group-hover:bg-white/30 transition-colors">
                  <Square className="w-8 h-8" />
                </div>
                <span className="text-lg font-bold">End Game</span>
                <span className="text-red-100 text-sm">
                  Finish and show results
                </span>
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl"
          >
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
              <div className="text-lg font-medium text-gray-700">
                Processing...
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={hideConfirmDialog}
      />
    </div>
  );
}

export default GameFlowControls;

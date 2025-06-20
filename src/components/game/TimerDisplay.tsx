import React, { useEffect, useState } from 'react';
import {
  GameTimer,
  TimerPhase,
  TimerEventType,
  TimerEvent,
} from '../../services/gameTimer';
import {
  Clock,
  Play,
  Pause,
  Square,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';

export interface TimerDisplayProps {
  timer: GameTimer;
  size?: 'small' | 'medium' | 'large';
  variant?: 'minimal' | 'standard' | 'detailed';
  showControls?: boolean;
  showProgress?: boolean;
  showMilliseconds?: boolean;
  className?: string;
  onExpired?: () => void;
  onWarning?: () => void;
  onCritical?: () => void;
}

export interface TimerDisplayState {
  timeRemaining: number;
  phase: TimerPhase;
  isRunning: boolean;
  isPaused: boolean;
  isExpired: boolean;
  progress: number;
  formattedTime: string;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timer,
  size = 'medium',
  variant = 'standard',
  showControls = false,
  showProgress = true,
  showMilliseconds = false,
  className = '',
  onExpired,
  onWarning,
  onCritical,
}) => {
  const [state, setState] = useState<TimerDisplayState>(() => {
    const timerState = timer.getState();
    return {
      timeRemaining: timerState.timeRemaining,
      phase: timerState.phase,
      isRunning: timerState.isRunning,
      isPaused: timerState.isPaused,
      isExpired: timerState.isExpired,
      progress: timerState.progress,
      formattedTime: timer.formatTime(showMilliseconds),
    };
  });

  useEffect(() => {
    const updateState = () => {
      const timerState = timer.getState();
      setState({
        timeRemaining: timerState.timeRemaining,
        phase: timerState.phase,
        isRunning: timerState.isRunning,
        isPaused: timerState.isPaused,
        isExpired: timerState.isExpired,
        progress: timerState.progress,
        formattedTime: timer.formatTime(showMilliseconds),
      });
    };

    const handleTimerEvent = (event: TimerEvent) => {
      updateState();

      // Trigger callbacks
      switch (event.type) {
        case TimerEventType.EXPIRED:
          onExpired?.();
          break;
        case TimerEventType.WARNING:
          onWarning?.();
          break;
        case TimerEventType.CRITICAL:
          onCritical?.();
          break;
      }
    };

    // Subscribe to timer events
    timer.addEventListener(TimerEventType.TICK, handleTimerEvent);
    timer.addEventListener(TimerEventType.STARTED, handleTimerEvent);
    timer.addEventListener(TimerEventType.PAUSED, handleTimerEvent);
    timer.addEventListener(TimerEventType.RESUMED, handleTimerEvent);
    timer.addEventListener(TimerEventType.STOPPED, handleTimerEvent);
    timer.addEventListener(TimerEventType.RESET, handleTimerEvent);
    timer.addEventListener(TimerEventType.EXPIRED, handleTimerEvent);
    timer.addEventListener(TimerEventType.WARNING, handleTimerEvent);
    timer.addEventListener(TimerEventType.CRITICAL, handleTimerEvent);

    // Initial state update
    updateState();

    return () => {
      // Cleanup event listeners
      timer.removeEventListener(TimerEventType.TICK, handleTimerEvent);
      timer.removeEventListener(TimerEventType.STARTED, handleTimerEvent);
      timer.removeEventListener(TimerEventType.PAUSED, handleTimerEvent);
      timer.removeEventListener(TimerEventType.RESUMED, handleTimerEvent);
      timer.removeEventListener(TimerEventType.STOPPED, handleTimerEvent);
      timer.removeEventListener(TimerEventType.RESET, handleTimerEvent);
      timer.removeEventListener(TimerEventType.EXPIRED, handleTimerEvent);
      timer.removeEventListener(TimerEventType.WARNING, handleTimerEvent);
      timer.removeEventListener(TimerEventType.CRITICAL, handleTimerEvent);
    };
  }, [timer, showMilliseconds, onExpired, onWarning, onCritical]);

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          container: 'p-2',
          time: 'text-lg font-semibold',
          icon: 'w-4 h-4',
          progress: 'h-1',
          controls: 'space-x-1',
        };
      case 'large':
        return {
          container: 'p-6',
          time: 'text-4xl font-bold',
          icon: 'w-8 h-8',
          progress: 'h-3',
          controls: 'space-x-3',
        };
      default: // medium
        return {
          container: 'p-4',
          time: 'text-2xl font-bold',
          icon: 'w-6 h-6',
          progress: 'h-2',
          controls: 'space-x-2',
        };
    }
  };

  const getPhaseClasses = () => {
    switch (state.phase) {
      case TimerPhase.CRITICAL:
        return {
          container: 'bg-red-50 border-red-200 animate-pulse',
          time: 'text-red-600',
          progress: 'bg-red-500',
          icon: 'text-red-500',
        };
      case TimerPhase.WARNING:
        return {
          container: 'bg-yellow-50 border-yellow-200',
          time: 'text-yellow-600',
          progress: 'bg-yellow-500',
          icon: 'text-yellow-500',
        };
      case TimerPhase.EXPIRED:
        return {
          container: 'bg-gray-50 border-gray-300',
          time: 'text-gray-500',
          progress: 'bg-gray-400',
          icon: 'text-gray-500',
        };
      default: // NORMAL
        return {
          container: 'bg-white border-gray-200',
          time: 'text-gray-900',
          progress: 'bg-blue-500',
          icon: 'text-gray-700',
        };
    }
  };

  const sizeClasses = getSizeClasses();
  const phaseClasses = getPhaseClasses();

  const handleStart = () => timer.start();
  const handlePause = () => timer.pause();
  const handleResume = () => timer.resume();
  const handleStop = () => timer.stop();
  const handleReset = () => timer.reset();

  const renderMinimal = () => (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <Clock className={`${sizeClasses.icon} ${phaseClasses.icon}`} />
      <span className={`${sizeClasses.time} ${phaseClasses.time} tabular-nums`}>
        {state.formattedTime}
      </span>
    </div>
  );

  const renderStandard = () => (
    <div
      className={`border rounded-lg ${sizeClasses.container} ${phaseClasses.container} ${className}`}
    >
      <div className="flex items-center justify-center space-x-2 mb-2">
        <Clock className={`${sizeClasses.icon} ${phaseClasses.icon}`} />
        <span
          className={`${sizeClasses.time} ${phaseClasses.time} tabular-nums`}
        >
          {state.formattedTime}
        </span>
        {state.phase === TimerPhase.CRITICAL && (
          <AlertTriangle
            className={`${sizeClasses.icon} text-red-500 animate-bounce`}
          />
        )}
      </div>

      {showProgress && (
        <div className="w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`${sizeClasses.progress} ${phaseClasses.progress} transition-all duration-300 ease-out`}
            style={{ width: `${state.progress}%` }}
          />
        </div>
      )}

      {showControls && (
        <div
          className={`flex items-center justify-center mt-3 ${sizeClasses.controls}`}
        >
          {!state.isRunning || state.isPaused ? (
            <button
              onClick={state.isPaused ? handleResume : handleStart}
              className="flex items-center justify-center w-8 h-8 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors"
              aria-label={state.isPaused ? 'Resume timer' : 'Start timer'}
              disabled={state.isExpired}
            >
              <Play className="w-4 h-4 ml-0.5" />
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center justify-center w-8 h-8 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full transition-colors"
              aria-label="Pause timer"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleStop}
            className="flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
            aria-label="Stop timer"
            disabled={!state.isRunning}
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={handleReset}
            className="flex items-center justify-center w-8 h-8 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors"
            aria-label="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  const renderDetailed = () => (
    <div
      className={`border rounded-lg ${sizeClasses.container} ${phaseClasses.container} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className={`${sizeClasses.icon} ${phaseClasses.icon}`} />
          <span className="text-sm font-medium text-gray-600">
            {state.isExpired
              ? 'Time Expired'
              : state.isPaused
                ? 'Paused'
                : state.isRunning
                  ? 'Running'
                  : 'Stopped'}
          </span>
        </div>
        {state.phase === TimerPhase.CRITICAL && (
          <AlertTriangle
            className={`${sizeClasses.icon} text-red-500 animate-bounce`}
          />
        )}
      </div>

      {/* Time Display */}
      <div className="text-center mb-4">
        <div
          className={`${sizeClasses.time} ${phaseClasses.time} tabular-nums`}
        >
          {state.formattedTime}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {Math.round(state.progress)}% elapsed
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`${sizeClasses.progress} ${phaseClasses.progress} transition-all duration-300 ease-out`}
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0:00</span>
            <span>{timer.formatTime()}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      {showControls && (
        <div
          className={`flex items-center justify-center ${sizeClasses.controls}`}
        >
          {!state.isRunning || state.isPaused ? (
            <button
              onClick={state.isPaused ? handleResume : handleStart}
              className="flex items-center space-x-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
              disabled={state.isExpired}
            >
              <Play className="w-4 h-4" />
              <span>{state.isPaused ? 'Resume' : 'Start'}</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="flex items-center space-x-1 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition-colors"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={handleStop}
            className="flex items-center space-x-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
            disabled={!state.isRunning}
          >
            <Square className="w-4 h-4" />
            <span>Stop</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center space-x-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      )}

      {/* Phase Indicator */}
      <div className="mt-3 text-center">
        <span
          className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
            state.phase === TimerPhase.CRITICAL
              ? 'bg-red-100 text-red-800'
              : state.phase === TimerPhase.WARNING
                ? 'bg-yellow-100 text-yellow-800'
                : state.phase === TimerPhase.EXPIRED
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-blue-100 text-blue-800'
          }`}
        >
          {state.phase.charAt(0).toUpperCase() + state.phase.slice(1)}
        </span>
      </div>
    </div>
  );

  switch (variant) {
    case 'minimal':
      return renderMinimal();
    case 'detailed':
      return renderDetailed();
    default:
      return renderStandard();
  }
};

export default TimerDisplay;

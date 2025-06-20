import { useState, useEffect, useCallback, useRef } from 'react';
import { GameTimer, TimerConfiguration, TimerState, TimerEventType, TimerEvent, TimerPhase } from '../services/gameTimer';

export interface UseTimerOptions extends Partial<TimerConfiguration> {
  onExpired?: () => void;
  onWarning?: () => void;
  onCritical?: () => void;
  onTick?: (timeRemaining: number) => void;
  onStart?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  enableSoundEffects?: boolean;
  soundUrls?: {
    warning?: string;
    critical?: string;
    expired?: string;
    tick?: string;
  };
}

export interface UseTimerReturn {
  // Timer state
  timeRemaining: number;
  formattedTime: string;
  progress: number;
  phase: TimerPhase;
  isRunning: boolean;
  isPaused: boolean;
  isExpired: boolean;
  
  // Timer controls
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: (newDuration?: number) => void;
  addTime: (seconds: number) => void;
  subtractTime: (seconds: number) => void;
  
  // Timer instance
  timer: GameTimer;
  
  // Configuration
  updateConfiguration: (config: Partial<TimerConfiguration>) => void;
}

export function useTimer(duration: number, options: UseTimerOptions = {}): UseTimerReturn {
  const {
    onExpired,
    onWarning,
    onCritical,
    onTick,
    onStart,
    onPause,
    onResume,
    onStop,
    onReset,
    enableSoundEffects = true,
    soundUrls = {},
    ...timerConfig
  } = options;

  // Create timer instance
  const timerRef = useRef<GameTimer | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Initialize timer
  if (!timerRef.current) {
    timerRef.current = new GameTimer({
      duration,
      ...timerConfig
    });
  }

  const timer = timerRef.current;

  // State
  const [state, setState] = useState<TimerState>(() => timer.getState());
  const [formattedTime, setFormattedTime] = useState<string>(() => timer.formatTime());

  // Initialize audio elements
  useEffect(() => {
    if (enableSoundEffects) {
      const defaultSounds = {
        warning: '/sounds/timer-warning.mp3',
        critical: '/sounds/timer-critical.mp3',
        expired: '/sounds/timer-expired.mp3',
        tick: '/sounds/timer-tick.mp3',
        ...soundUrls
      };

      Object.entries(defaultSounds).forEach(([key, url]) => {
        if (url && !audioRefs.current[key]) {
          const audio = new Audio(url);
          audio.preload = 'auto';
          audio.volume = 0.7;
          audioRefs.current[key] = audio;
        }
      });
    }

    return () => {
      // Cleanup audio elements
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioRefs.current = {};
    };
  }, [enableSoundEffects, soundUrls]);

  // Play sound effect
  const playSound = useCallback((soundKey: string) => {
    if (enableSoundEffects && audioRefs.current[soundKey]) {
      const audio = audioRefs.current[soundKey];
      audio.currentTime = 0;
      audio.play().catch(error => {
        console.warn(`Failed to play ${soundKey} sound:`, error);
      });
    }
  }, [enableSoundEffects]);

  // Update state from timer
  const updateState = useCallback(() => {
    const newState = timer.getState();
    const newFormattedTime = timer.formatTime();
    
    setState(newState);
    setFormattedTime(newFormattedTime);
  }, [timer]);

  // Timer event handler
  const handleTimerEvent = useCallback((event: TimerEvent) => {
    updateState();

    // Handle callbacks and sound effects
    switch (event.type) {
      case TimerEventType.STARTED:
        onStart?.();
        break;
        
      case TimerEventType.PAUSED:
        onPause?.();
        break;
        
      case TimerEventType.RESUMED:
        onResume?.();
        break;
        
      case TimerEventType.STOPPED:
        onStop?.();
        break;
        
      case TimerEventType.RESET:
        onReset?.();
        break;
        
      case TimerEventType.TICK:
        onTick?.(event.timeRemaining);
        if (event.timeRemaining <= 10 && event.timeRemaining > 0) {
          playSound('tick');
        }
        break;
        
      case TimerEventType.WARNING:
        onWarning?.();
        playSound('warning');
        break;
        
      case TimerEventType.CRITICAL:
        onCritical?.();
        playSound('critical');
        break;
        
      case TimerEventType.EXPIRED:
        onExpired?.();
        playSound('expired');
        break;
    }
  }, [onExpired, onWarning, onCritical, onTick, onStart, onPause, onResume, onStop, onReset, playSound, updateState]);

  // Set up event listeners
  useEffect(() => {
    const eventTypes = [
      TimerEventType.STARTED,
      TimerEventType.PAUSED,
      TimerEventType.RESUMED,
      TimerEventType.STOPPED,
      TimerEventType.RESET,
      TimerEventType.TICK,
      TimerEventType.WARNING,
      TimerEventType.CRITICAL,
      TimerEventType.EXPIRED
    ];

    eventTypes.forEach(eventType => {
      timer.addEventListener(eventType, handleTimerEvent);
    });

    // Initial state update
    updateState();

    return () => {
      eventTypes.forEach(eventType => {
        timer.removeEventListener(eventType, handleTimerEvent);
      });
    };
  }, [timer, handleTimerEvent, updateState]);

  // Control functions
  const start = useCallback(() => {
    timer.start();
  }, [timer]);

  const pause = useCallback(() => {
    timer.pause();
  }, [timer]);

  const resume = useCallback(() => {
    timer.resume();
  }, [timer]);

  const stop = useCallback(() => {
    timer.stop();
  }, [timer]);

  const reset = useCallback((newDuration?: number) => {
    timer.reset(newDuration);
  }, [timer]);

  const addTime = useCallback((seconds: number) => {
    timer.addTime(seconds);
  }, [timer]);

  const subtractTime = useCallback((seconds: number) => {
    timer.subtractTime(seconds);
  }, [timer]);

  const updateConfiguration = useCallback((config: Partial<TimerConfiguration>) => {
    // Create new timer with updated configuration
    const currentState = timer.getState();
    const newTimer = new GameTimer({
      ...timer.getConfiguration(),
      ...config
    });

    // If timer was running, preserve the time remaining
    if (currentState.isRunning || currentState.isPaused) {
      newTimer.reset(currentState.timeRemaining);
      if (currentState.isRunning && !currentState.isPaused) {
        newTimer.start();
      } else if (currentState.isPaused) {
        newTimer.start();
        newTimer.pause();
      }
    }

    timerRef.current = newTimer;
  }, [timer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timer.destroy();
    };
  }, [timer]);

  return {
    // State
    timeRemaining: state.timeRemaining,
    formattedTime,
    progress: state.progress,
    phase: state.phase,
    isRunning: state.isRunning,
    isPaused: state.isPaused,
    isExpired: state.isExpired,
    
    // Controls
    start,
    pause,
    resume,
    stop,
    reset,
    addTime,
    subtractTime,
    
    // Timer instance
    timer,
    
    // Configuration
    updateConfiguration
  };
}

// Specialized hooks for different timer types
export function useQuestionTimer(
  duration: number, 
  options: UseTimerOptions = {}
): UseTimerReturn {
  return useTimer(duration, {
    warningThreshold: Math.min(10, duration * 0.3),
    criticalThreshold: Math.min(5, duration * 0.15),
    precision: 100,
    enableSound: true,
    ...options
  });
}

export function useRoundTimer(
  duration: number,
  options: UseTimerOptions = {}
): UseTimerReturn {
  return useTimer(duration, {
    warningThreshold: Math.min(30, duration * 0.1),
    criticalThreshold: Math.min(10, duration * 0.05),
    precision: 1000,
    enableSound: true,
    ...options
  });
}

export function useGameTimer(
  duration: number,
  options: UseTimerOptions = {}
): UseTimerReturn {
  return useTimer(duration, {
    warningThreshold: Math.min(300, duration * 0.05),
    criticalThreshold: Math.min(60, duration * 0.02),
    precision: 5000,
    enableSound: false,
    ...options
  });
}

// Hook for managing multiple timers
export interface UseMultipleTimersOptions {
  timers: { [key: string]: { duration: number; options?: UseTimerOptions } };
  onAnyExpired?: (timerId: string) => void;
  onAllExpired?: () => void;
}

export interface UseMultipleTimersReturn {
  timers: { [key: string]: UseTimerReturn };
  startAll: () => void;
  pauseAll: () => void;
  resumeAll: () => void;
  stopAll: () => void;
  resetAll: () => void;
  getActiveTimers: () => string[];
  getExpiredTimers: () => string[];
  allExpired: boolean;
  anyRunning: boolean;
}

export function useMultipleTimers(options: UseMultipleTimersOptions): UseMultipleTimersReturn {
  const { timers: timerConfigs, onAnyExpired, onAllExpired } = options;
  
  // Create timer hooks for each configuration
  const timers: { [key: string]: UseTimerReturn } = {};
  const expiredTimers = useRef<Set<string>>(new Set());

  Object.entries(timerConfigs).forEach(([key, config]) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    timers[key] = useTimer(config.duration, {
      ...config.options,
      onExpired: () => {
        config.options?.onExpired?.();
        expiredTimers.current.add(key);
        onAnyExpired?.(key);
        
        // Check if all timers are expired
        if (expiredTimers.current.size === Object.keys(timerConfigs).length) {
          onAllExpired?.();
        }
      }
    });
  });

  const startAll = useCallback(() => {
    Object.values(timers).forEach(timer => timer.start());
  }, [timers]);

  const pauseAll = useCallback(() => {
    Object.values(timers).forEach(timer => timer.pause());
  }, [timers]);

  const resumeAll = useCallback(() => {
    Object.values(timers).forEach(timer => timer.resume());
  }, [timers]);

  const stopAll = useCallback(() => {
    Object.values(timers).forEach(timer => timer.stop());
  }, [timers]);

  const resetAll = useCallback(() => {
    Object.values(timers).forEach(timer => timer.reset());
    expiredTimers.current.clear();
  }, [timers]);

  const getActiveTimers = useCallback(() => {
    return Object.entries(timers)
      .filter(([, timer]) => timer.isRunning)
      .map(([key]) => key);
  }, [timers]);

  const getExpiredTimers = useCallback(() => {
    return Object.entries(timers)
      .filter(([, timer]) => timer.isExpired)
      .map(([key]) => key);
  }, [timers]);

  const allExpired = Object.values(timers).every(timer => timer.isExpired);
  const anyRunning = Object.values(timers).some(timer => timer.isRunning);

  return {
    timers,
    startAll,
    pauseAll,
    resumeAll,
    stopAll,
    resetAll,
    getActiveTimers,
    getExpiredTimers,
    allExpired,
    anyRunning
  };
} 
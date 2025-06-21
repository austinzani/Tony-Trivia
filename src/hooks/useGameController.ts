import { useState, useEffect, useCallback, useRef } from 'react';
import { GameController } from '../services/gameController';
import { GameStateManager } from '../services/gameStateManager';
import { RoundManager } from '../services/roundManager';
import { ScoreManager } from '../services/scoreManager';
import { SpecialRoundManager } from '../services/specialRoundManager';
import { AnswerSubmissionManager } from '../services/answerSubmissionManager';
import { GameTimer } from '../services/gameTimer';
import {
  type GameControllerState,
  type GameControllerOptions,
  type GameControllerEvent,
  GameControllerEventType,
  GameProgressionPhase,
  type AdvanceOptions
} from '../types/gameController';
import type { GameState } from '../types/game';

// Create a default initial game state
const createInitialGameState = (gameId: string): GameState => ({
  id: gameId,
  roomId: `room-${gameId}`,
  hostId: 'host-1',
  configuration: {
    id: `config-${gameId}`,
    name: 'Default Game',
    description: 'A default trivia game',
    settings: {
      maxRounds: 3,
      questionsPerRound: 10,
      defaultTimeLimit: 60,
      allowTeams: true,
      maxTeamSize: 6,
      maxTeams: 20,
      pointSystem: 'last-call',
      enableSpecialRounds: true,
      enableWagerRounds: true,
      enableBonusRounds: true,
      autoAdvance: false,
      showCorrectAnswers: true,
      allowAnswerChanges: false,
      enableHints: false,
      difficulty: 'medium'
    },
    rounds: [],
    categories: ['General Knowledge'],
    createdBy: 'host-1',
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  phase: 'pre-game',
  currentRound: 0,
  currentQuestion: undefined,
  rounds: [],
  completedRounds: 0,
  totalQuestions: 0,
  answeredQuestions: 0,
  players: {},
  teams: {},
  usedPointValues: {},
  timers: {},
  isActive: false,
  isPaused: false,
  isComplete: false,
  events: [],
  connectedPlayers: [],
  lastUpdated: new Date().toISOString()
});

// Main hook for game controller management
export function useGameController(
  gameId: string,
  options: Partial<GameControllerOptions> = {}
) {
  const [controllerState, setControllerState] = useState<GameControllerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<GameControllerEvent[]>([]);
  
  const controllerRef = useRef<GameController | null>(null);
  const gameStateManagerRef = useRef<GameStateManager | null>(null);
  const roundManagerRef = useRef<RoundManager | null>(null);
  const scoreManagerRef = useRef<ScoreManager | null>(null);
  const specialRoundManagerRef = useRef<SpecialRoundManager | null>(null);
  const answerSubmissionManagerRef = useRef<AnswerSubmissionManager | null>(null);
  const gameTimerRef = useRef<GameTimer | null>(null);

  // Initialize game controller and dependencies
  const initializeController = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create initial game state
      const initialState = createInitialGameState(gameId);

      // Initialize all required services
      gameStateManagerRef.current = new GameStateManager(initialState);
      roundManagerRef.current = new RoundManager();
      scoreManagerRef.current = new ScoreManager();
      specialRoundManagerRef.current = new SpecialRoundManager(
        roundManagerRef.current,
        scoreManagerRef.current
      );
      answerSubmissionManagerRef.current = new AnswerSubmissionManager();
      gameTimerRef.current = new GameTimer();

      // Create controller with default options
      const defaultOptions: GameControllerOptions = {
        gameId,
        configuration: {
          totalRounds: 3,
          questionsPerRound: 10,
          allowSkipQuestions: true,
          allowPause: true,
          autoAdvanceQuestions: false,
          autoAdvanceRounds: false,
          questionTimeLimit: 60,
          roundTimeLimit: 600,
          intermissionDuration: 30,
          showResults: true,
          enableSpecialRounds: true,
          specialRoundFrequency: 3,
          enableMetrics: true,
          saveProgress: true
        },
        ...options
      };

      controllerRef.current = new GameController(
        gameStateManagerRef.current,
        roundManagerRef.current,
        scoreManagerRef.current,
        specialRoundManagerRef.current,
        answerSubmissionManagerRef.current,
        gameTimerRef.current,
        defaultOptions
      );

      // Setup event listeners
      const eventTypes: GameControllerEventType[] = [
        'initialized',
        'started',
        'paused',
        'resumed',
        'ended',
        'phase_changed',
        'question_advanced',
        'round_completed',
        'special_round_started',
        'error_occurred',
        'metrics_updated'
      ];

      eventTypes.forEach(eventType => {
        controllerRef.current?.addEventListener(eventType, (event) => {
          setEvents(prev => [...prev.slice(-49), event]); // Keep last 50 events
          
          if (eventType === 'error_occurred') {
            setError(event.data?.message || 'An error occurred');
          }
        });
      });

      // Initialize the controller
      await controllerRef.current.initialize();
      
      // Update state
      setControllerState(controllerRef.current.getState());
      setIsLoading(false);

    } catch (err) {
      console.error('Failed to initialize game controller:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize game controller');
      setIsLoading(false);
    }
  }, [gameId, options]);

  // Initialize on mount
  useEffect(() => {
    initializeController();

    return () => {
      controllerRef.current?.destroy();
    };
  }, [initializeController]);

  // Update state when controller state changes
  useEffect(() => {
    if (!controllerRef.current) return;

    const updateState = () => {
      setControllerState(controllerRef.current!.getState());
    };

    // Update state on phase changes
    controllerRef.current.addEventListener('phase_changed', updateState);
    controllerRef.current.addEventListener('metrics_updated', updateState);

    return () => {
      controllerRef.current?.removeEventListener('phase_changed', updateState);
      controllerRef.current?.removeEventListener('metrics_updated', updateState);
    };
  }, [controllerRef.current]);

  // Control functions
  const startGame = useCallback(async () => {
    if (!controllerRef.current) throw new Error('Controller not initialized');
    await controllerRef.current.startGame();
  }, []);

  const pauseGame = useCallback(async (reason?: string) => {
    if (!controllerRef.current) throw new Error('Controller not initialized');
    await controllerRef.current.pauseGame(reason);
  }, []);

  const resumeGame = useCallback(async () => {
    if (!controllerRef.current) throw new Error('Controller not initialized');
    await controllerRef.current.resumeGame();
  }, []);

  const endGame = useCallback(async () => {
    if (!controllerRef.current) throw new Error('Controller not initialized');
    await controllerRef.current.endGame();
  }, []);

  const advancePhase = useCallback(async (options: AdvanceOptions = {}) => {
    if (!controllerRef.current) throw new Error('Controller not initialized');
    await controllerRef.current.advancePhase(options);
  }, []);

  const skipQuestion = useCallback(async () => {
    if (!controllerRef.current) throw new Error('Controller not initialized');
    await controllerRef.current.skipQuestion();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    // State
    state: controllerState,
    isLoading,
    error,
    events,
    
    // Status checks
    isInitialized: controllerState?.isInitialized ?? false,
    isActive: controllerState?.isActive ?? false,
    isPaused: controllerState?.isPaused ?? false,
    isComplete: controllerState?.isComplete ?? false,
    
    // Current state
    currentPhase: controllerState?.currentPhase ?? 'pre_game',
    currentRound: controllerState?.currentRound ?? 0,
    currentQuestion: controllerState?.currentQuestion ?? 0,
    totalRounds: controllerState?.totalRounds ?? 0,
    totalQuestions: controllerState?.totalQuestions ?? 0,
    
    // Control functions
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    advancePhase,
    skipQuestion,
    
    // Utility functions
    clearError,
    clearEvents,
    reinitialize: initializeController,
    
    // Direct access to managers (for advanced usage)
    gameStateManager: gameStateManagerRef.current,
    roundManager: roundManagerRef.current,
    scoreManager: scoreManagerRef.current,
    specialRoundManager: specialRoundManagerRef.current,
    answerSubmissionManager: answerSubmissionManagerRef.current,
    gameTimer: gameTimerRef.current
  };
}

// Hook for monitoring game progression
export function useGameProgression(gameId: string) {
  const { state, currentPhase, isActive } = useGameController(gameId);
  
  const progression = state?.progression;
  const questionProgression = state?.questionProgression;
  const roundProgression = state?.roundProgression;
  const metrics = state?.metrics;

  return {
    // Current state
    currentPhase,
    isActive,
    isTransitioning: progression?.isTransitioning ?? false,
    
    // Question progression
    currentQuestionIndex: questionProgression?.currentQuestionIndex ?? 0,
    totalQuestions: questionProgression?.totalQuestions ?? 0,
    questionsAnswered: questionProgression?.questionsAnswered ?? 0,
    questionsRemaining: questionProgression?.questionsRemaining ?? 0,
    isLastQuestion: questionProgression?.isLastQuestion ?? false,
    
    // Round progression
    currentRoundIndex: roundProgression?.currentRoundIndex ?? 0,
    totalRounds: roundProgression?.totalRounds ?? 0,
    roundsCompleted: roundProgression?.roundsCompleted ?? 0,
    roundsRemaining: roundProgression?.roundsRemaining ?? 0,
    isLastRound: roundProgression?.isLastRound ?? false,
    currentRoundType: roundProgression?.currentRoundType ?? 'regular',
    
    // Progress percentages
    questionProgress: questionProgression?.totalQuestions 
      ? (questionProgression.questionsAnswered / questionProgression.totalQuestions) * 100 
      : 0,
    roundProgress: roundProgression?.totalRounds 
      ? (roundProgression.roundsCompleted / roundProgression.totalRounds) * 100 
      : 0,
    overallProgress: progression && questionProgression && roundProgression
      ? ((roundProgression.roundsCompleted * questionProgression.totalQuestions + questionProgression.questionsAnswered) / 
         (roundProgression.totalRounds * questionProgression.totalQuestions)) * 100
      : 0,
    
    // Timing information
    phaseStartTime: progression?.phaseStartTime,
    gameStartTime: metrics?.gameStartTime,
    estimatedTimeRemaining: calculateEstimatedTimeRemaining(state),
    
    // Metrics
    averageAnswerTime: questionProgression?.averageAnswerTime ?? 0,
    totalPhaseTransitions: metrics?.totalPhaseTransitions ?? 0,
    errorCount: metrics?.errorCount ?? 0
  };
}

// Hook for game controller events
export function useGameControllerEvents(
  gameId: string,
  eventTypes?: GameControllerEventType[]
) {
  const { events } = useGameController(gameId);
  
  const filteredEvents = eventTypes 
    ? events.filter(event => eventTypes.includes(event.type))
    : events;

  const getEventsByType = useCallback((type: GameControllerEventType) => {
    return events.filter(event => event.type === type);
  }, [events]);

  const getLatestEvent = useCallback((type?: GameControllerEventType) => {
    const eventsToSearch = type ? getEventsByType(type) : events;
    return eventsToSearch[eventsToSearch.length - 1] || null;
  }, [events, getEventsByType]);

  const hasEventOccurred = useCallback((type: GameControllerEventType) => {
    return events.some(event => event.type === type);
  }, [events]);

  return {
    events: filteredEvents,
    allEvents: events,
    getEventsByType,
    getLatestEvent,
    hasEventOccurred,
    eventCount: filteredEvents.length,
    totalEventCount: events.length
  };
}

// Hook for game controller metrics
export function useGameControllerMetrics(gameId: string) {
  const { state } = useGameController(gameId);
  const metrics = state?.metrics;

  const calculateEngagementScore = useCallback(() => {
    if (!metrics?.participantEngagement) return 0;
    
    const { completionRate, averageResponseTime } = metrics.participantEngagement;
    const responseTimeScore = Math.max(0, 100 - (averageResponseTime / 1000) * 2); // Penalize slow responses
    
    return (completionRate * 0.7) + (responseTimeScore * 0.3);
  }, [metrics]);

  const getPerformanceInsights = useCallback(() => {
    if (!metrics) return [];

    const insights: string[] = [];

    if (metrics.errorCount > 3) {
      insights.push('High error rate detected - consider reviewing game configuration');
    }

    if (metrics.pauseCount > 2) {
      insights.push('Multiple pauses detected - participants may need more time');
    }

    if (metrics.participantEngagement.completionRate < 0.7) {
      insights.push('Low completion rate - consider reducing difficulty or time pressure');
    }

    if (metrics.averagePhaseTransitionTime > 5000) {
      insights.push('Slow phase transitions - consider optimizing game flow');
    }

    return insights;
  }, [metrics]);

  return {
    metrics,
    engagementScore: calculateEngagementScore(),
    performanceInsights: getPerformanceInsights(),
    
    // Quick access to key metrics
    gameStartTime: metrics?.gameStartTime,
    totalPhaseTransitions: metrics?.totalPhaseTransitions ?? 0,
    averagePhaseTransitionTime: metrics?.averagePhaseTransitionTime ?? 0,
    errorCount: metrics?.errorCount ?? 0,
    pauseCount: metrics?.pauseCount ?? 0,
    totalPauseDuration: metrics?.totalPauseDuration ?? 0,
    
    // Engagement metrics
    averageResponseTime: metrics?.participantEngagement.averageResponseTime ?? 0,
    completionRate: metrics?.participantEngagement.completionRate ?? 0,
    dropoffPoints: metrics?.participantEngagement.dropoffPoints ?? [],
    
    // Phase timing
    longestPhase: metrics?.longestPhase,
    shortestPhase: metrics?.shortestPhase
  };
}

// Utility function to calculate estimated time remaining
function calculateEstimatedTimeRemaining(state: GameControllerState | null): number {
  if (!state) return 0;

  const { questionProgression, roundProgression, metrics } = state;
  
  if (!questionProgression || !roundProgression || !metrics) return 0;

  const questionsRemaining = questionProgression.questionsRemaining;
  const roundsRemaining = roundProgression.roundsRemaining;
  const averageQuestionTime = questionProgression.averageAnswerTime || 60000; // Default to 60 seconds

  // Estimate based on remaining questions and average time per question
  const estimatedQuestionTime = questionsRemaining * averageQuestionTime;
  
  // Add buffer for round transitions and special rounds
  const roundTransitionBuffer = roundsRemaining * 30000; // 30 seconds per round transition
  
  return estimatedQuestionTime + roundTransitionBuffer;
}

// Hook for phase-specific functionality
export function useGamePhase(gameId: string, targetPhase?: GameProgressionPhase) {
  const { currentPhase, state, advancePhase } = useGameController(gameId);
  
  const isCurrentPhase = targetPhase ? currentPhase === targetPhase : true;
  const progression = state?.progression;

  const canEnterPhase = useCallback((phase: GameProgressionPhase) => {
    // This would typically check with the controller's validation logic
    // For now, we'll do basic checks
    const phaseOrder = Object.values(GameProgressionPhase);
    const currentIndex = phaseOrder.indexOf(currentPhase);
    const targetIndex = phaseOrder.indexOf(phase);
    
    return targetIndex >= currentIndex;
  }, [currentPhase]);

  const advanceToPhase = useCallback(async (phase: GameProgressionPhase) => {
    if (!canEnterPhase(phase)) {
      throw new Error(`Cannot advance to ${phase} from ${currentPhase}`);
    }
    
    // Advance step by step to the target phase
    while (currentPhase !== phase) {
      await advancePhase();
    }
  }, [currentPhase, canEnterPhase, advancePhase]);

  return {
    currentPhase,
    isCurrentPhase,
    isTransitioning: progression?.isTransitioning ?? false,
    canAdvance: progression?.canAdvance ?? false,
    autoAdvance: progression?.autoAdvance ?? false,
    nextPhase: progression?.nextPhase,
    phaseStartTime: progression?.phaseStartTime,
    
    // Phase control
    canEnterPhase,
    advanceToPhase,
    advancePhase
  };
} 
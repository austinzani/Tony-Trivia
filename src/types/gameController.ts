import type { GameState } from './game';
import type { SpecialRound, SpecialRoundType } from './specialRounds';

// Game Progression Types
export enum GameProgressionPhase {
  INITIALIZATION = 'initialization',
  PRE_GAME = 'pre_game',
  ROUND_INTRO = 'round_intro',
  QUESTION_DISPLAY = 'question_display',
  ANSWER_COLLECTION = 'answer_collection',
  ANSWER_REVIEW = 'answer_review',
  SCORING = 'scoring',
  ROUND_RESULTS = 'round_results',
  SPECIAL_ROUND = 'special_round',
  INTERMISSION = 'intermission',
  FINAL_RESULTS = 'final_results',
  GAME_COMPLETE = 'game_complete',
  ERROR_STATE = 'error_state'
}

export enum TransitionTrigger {
  AUTOMATIC = 'automatic',
  USER_ACTION = 'user_action',
  TIMER_EXPIRY = 'timer_expiry',
  ADMIN_OVERRIDE = 'admin_override',
  ERROR_RECOVERY = 'error_recovery'
}

export interface GameProgressionState {
  currentPhase: GameProgressionPhase;
  previousPhase: GameProgressionPhase | null;
  phaseStartTime: Date;
  phaseTimeLimit?: number; // seconds
  isTransitioning: boolean;
  transitionStartTime?: Date;
  transitionDuration: number; // milliseconds
  canAdvance: boolean;
  autoAdvance: boolean;
  nextPhase: GameProgressionPhase | null;
}

export interface PhaseTransition {
  fromPhase: GameProgressionPhase;
  toPhase: GameProgressionPhase;
  trigger: TransitionTrigger;
  timestamp: Date;
  duration: number; // milliseconds
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface GameFlowConfiguration {
  // Round Configuration
  totalRounds: number;
  questionsPerRound: number;
  enableSpecialRounds: boolean;
  specialRoundFrequency: number; // every N rounds
  allowSkipQuestions: boolean;
  
  // Timing Configuration
  questionTimeLimit: number; // seconds
  answerReviewTime: number; // seconds
  roundIntroTime: number; // seconds
  intermissionTime: number; // seconds
  autoAdvanceDelay: number; // milliseconds
  
  // Progression Rules
  requireAllAnswers: boolean;
  allowEarlyAdvance: boolean;
  enablePauseResume: boolean;
  maxGameDuration: number; // minutes
  
  // Error Handling
  maxRetries: number;
  errorRecoveryMode: 'auto' | 'manual';
  fallbackToManualControl: boolean;
}

export interface QuestionProgressionState {
  currentQuestionIndex: number;
  totalQuestions: number;
  questionsAnswered: number;
  questionsSkipped: number;
  questionsRemaining: number;
  averageAnswerTime: number; // seconds
  isLastQuestion: boolean;
  canSkip: boolean;
  canGoBack: boolean;
}

export interface RoundProgressionState {
  currentRoundIndex: number;
  totalRounds: number;
  roundsCompleted: number;
  roundsRemaining: number;
  currentRoundType: 'regular' | 'special';
  specialRoundType?: SpecialRoundType;
  isLastRound: boolean;
  roundStartTime: Date;
  estimatedRoundDuration: number; // seconds
  actualRoundDuration?: number; // seconds
}

export interface GameProgressionMetrics {
  gameStartTime: Date;
  gameEndTime?: Date;
  totalGameDuration?: number; // seconds
  totalPhaseTransitions: number;
  averagePhaseTransitionTime: number; // milliseconds
  longestPhase: {
    phase: GameProgressionPhase;
    duration: number; // seconds
  };
  shortestPhase: {
    phase: GameProgressionPhase;
    duration: number; // seconds
  };
  errorCount: number;
  pauseCount: number;
  totalPauseDuration: number; // seconds
  participantEngagement: {
    averageResponseTime: number; // seconds
    completionRate: number; // percentage
    dropoffPoints: GameProgressionPhase[];
  };
}

export interface GameControllerEvent {
  type: GameControllerEventType;
  timestamp: Date;
  gameId: string;
  data?: Record<string, any>;
  phase?: GameProgressionPhase;
  round?: number;
  question?: number;
  error?: string;
}

export enum GameControllerEventType {
  GAME_INITIALIZED = 'game_initialized',
  GAME_STARTED = 'game_started',
  GAME_PAUSED = 'game_paused',
  GAME_RESUMED = 'game_resumed',
  GAME_ENDED = 'game_ended',
  PHASE_TRANSITION_STARTED = 'phase_transition_started',
  PHASE_TRANSITION_COMPLETED = 'phase_transition_completed',
  PHASE_TRANSITION_FAILED = 'phase_transition_failed',
  ROUND_STARTED = 'round_started',
  ROUND_COMPLETED = 'round_completed',
  QUESTION_DISPLAYED = 'question_displayed',
  QUESTION_ANSWERED = 'question_answered',
  QUESTION_SKIPPED = 'question_skipped',
  SPECIAL_ROUND_STARTED = 'special_round_started',
  SPECIAL_ROUND_COMPLETED = 'special_round_completed',
  SCORING_COMPLETED = 'scoring_completed',
  ERROR_OCCURRED = 'error_occurred',
  RECOVERY_ATTEMPTED = 'recovery_attempted',
  MANUAL_OVERRIDE = 'manual_override'
}

export interface GameControllerOptions {
  gameId: string;
  configuration: GameFlowConfiguration;
  enableEventLogging: boolean;
  enableMetrics: boolean;
  debugMode: boolean;
  strictMode: boolean; // Enforce all validation rules
  performanceMode: boolean; // Optimize for performance over features
}

export interface AdvanceOptions {
  force?: boolean;
  skipValidation?: boolean;
  customTransitionTime?: number;
  triggerType?: TransitionTrigger;
  metadata?: Record<string, any>;
}

export interface PauseResumeState {
  isPaused: boolean;
  pauseStartTime?: Date;
  pauseReason?: string;
  pauseCount: number;
  totalPauseDuration: number; // seconds
  canResume: boolean;
  autoResumeAfter?: number; // seconds
}

export interface ErrorState {
  hasError: boolean;
  errorType?: string;
  errorMessage?: string;
  errorPhase?: GameProgressionPhase;
  errorTimestamp?: Date;
  recoveryAttempts: number;
  canRecover: boolean;
  recoveryStrategy?: 'retry' | 'skip' | 'restart' | 'manual';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canProceed: boolean;
  suggestedAction?: string;
}

export interface PhaseValidationContext {
  currentPhase: GameProgressionPhase;
  targetPhase: GameProgressionPhase;
  gameState: GameState;
  progressionState: GameProgressionState;
  questionState: QuestionProgressionState;
  roundState: RoundProgressionState;
  configuration: GameFlowConfiguration;
}

export interface GameControllerState {
  gameId: string;
  isInitialized: boolean;
  isActive: boolean;
  progression: GameProgressionState;
  questionProgression: QuestionProgressionState;
  roundProgression: RoundProgressionState;
  pauseResume: PauseResumeState;
  error: ErrorState;
  metrics: GameProgressionMetrics;
  configuration: GameFlowConfiguration;
  transitionHistory: PhaseTransition[];
  eventLog: GameControllerEvent[];
}

// Phase Handler Types
export interface PhaseHandler {
  phase: GameProgressionPhase;
  canEnter: (context: PhaseValidationContext) => ValidationResult;
  onEnter: (context: PhaseValidationContext) => Promise<void>;
  onExit: (context: PhaseValidationContext) => Promise<void>;
  getNextPhase: (context: PhaseValidationContext) => GameProgressionPhase | null;
  getTimeLimit: (context: PhaseValidationContext) => number | undefined;
  shouldAutoAdvance: (context: PhaseValidationContext) => boolean;
}

export interface PhaseHandlerRegistry {
  [phase: string]: PhaseHandler;
}

// Export utility types
export type GameControllerEventListener = (event: GameControllerEvent) => void;
export type PhaseTransitionCallback = (transition: PhaseTransition) => void;
export type ProgressionUpdateCallback = (state: GameControllerState) => void; 
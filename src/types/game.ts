// Game State Management Types for Tony Trivia

export type GamePhase = 
  | 'pre-game'
  | 'round-intro'
  | 'question-selection'
  | 'question-display'
  | 'answer-submission'
  | 'answer-review'
  | 'scoring'
  | 'round-complete'
  | 'game-complete'
  | 'paused';

export type RoundType = 
  | 'standard'
  | 'picture'
  | 'audio'
  | 'video'
  | 'wager'
  | 'bonus'
  | 'lightning';

export type QuestionType = 
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'multiple-choice'
  | 'true-false';

export type PointValue = 1 | 2 | 3 | 4 | 5 | 6;

export type GameDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  category: string;
  difficulty: GameDifficulty;
  correctAnswer: string;
  alternativeAnswers?: string[];
  mediaUrl?: string;
  mediaType?: 'image' | 'audio' | 'video';
  altText?: string; // Alternative text for images (accessibility)
  transcript?: string; // Transcript for audio/video content (accessibility)
  captions?: string; // Captions for video content (accessibility)
  timeLimit?: number; // in seconds
  points?: PointValue; // for pre-assigned point questions
  explanation?: string;
  source?: string;
  tags?: string[];
  options?: string[]; // For multiple-choice questions
  createdAt: string;
  updatedAt: string;
}

export interface Round {
  id: string;
  number: number;
  type: RoundType;
  name: string;
  description?: string;
  availablePointValues: PointValue[];
  questions: Question[];
  timeLimit?: number; // overall round time limit
  maxQuestions?: number;
  specialRules?: Record<string, any>;
  isComplete: boolean;
  startedAt?: string;
  completedAt?: string;
}

export interface PlayerAnswer {
  playerId: string;
  teamId?: string;
  questionId: string;
  answer: string;
  pointValue: PointValue;
  submittedAt: string;
  isCorrect?: boolean;
  pointsEarned?: number;
  responseTime?: number; // in milliseconds
}

export interface PlayerScore {
  playerId: string;
  teamId?: string;
  totalPoints: number;
  roundScores: Record<number, number>;
  correctAnswers: number;
  totalAnswers: number;
  averageResponseTime: number;
  pointsBreakdown: Record<PointValue, number>;
}

export interface TeamScore {
  teamId: string;
  totalPoints: number;
  roundScores: Record<number, number>;
  memberScores: Record<string, PlayerScore>;
  correctAnswers: number;
  totalAnswers: number;
  averageResponseTime: number;
  pointsBreakdown: Record<PointValue, number>;
}

export interface GameSettings {
  maxRounds: number;
  questionsPerRound: number;
  defaultTimeLimit: number; // in seconds
  allowTeams: boolean;
  maxTeamSize: number;
  maxTeams: number;
  pointSystem: 'last-call' | 'standard' | 'custom';
  enableSpecialRounds: boolean;
  enableWagerRounds: boolean;
  enableBonusRounds: boolean;
  autoAdvance: boolean;
  showCorrectAnswers: boolean;
  allowAnswerChanges: boolean;
  enableHints: boolean;
  difficulty: GameDifficulty;
}

export interface GameConfiguration {
  id: string;
  name: string;
  description?: string;
  settings: GameSettings;
  rounds: Round[];
  categories: string[];
  createdBy: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveQuestion {
  question: Question;
  roundNumber: number;
  questionNumber: number;
  startedAt: string;
  timeLimit: number;
  submissions: PlayerAnswer[];
  isLocked: boolean;
  revealedAt?: string;
}

export interface GameTimer {
  id: string;
  type: 'question' | 'round' | 'game';
  duration: number; // in seconds
  remaining: number;
  isActive: boolean;
  isPaused: boolean;
  startedAt?: string;
  pausedAt?: string;
  endedAt?: string;
}

export interface GameEvent {
  id: string;
  type: 'game-started' | 'round-started' | 'question-presented' | 'answer-submitted' | 
        'question-ended' | 'round-ended' | 'game-ended' | 'player-joined' | 
        'player-left' | 'team-formed' | 'score-updated' | 'timer-warning' | 
        'timer-expired' | 'game-paused' | 'game-resumed';
  gameId: string;
  playerId?: string;
  teamId?: string;
  questionId?: string;
  roundNumber?: number;
  data?: Record<string, any>;
  timestamp: string;
}

export interface GameState {
  // Basic game info
  id: string;
  roomId: string;
  hostId: string;
  configuration: GameConfiguration;
  
  // Current state
  phase: GamePhase;
  currentRound: number;
  currentQuestion?: ActiveQuestion;
  
  // Progress tracking
  rounds: Round[];
  completedRounds: number;
  totalQuestions: number;
  answeredQuestions: number;
  
  // Participants
  players: Record<string, PlayerScore>;
  teams: Record<string, TeamScore>;
  
  // Point tracking per round
  usedPointValues: Record<number, Record<string, PointValue[]>>; // round -> playerId/teamId -> used points
  
  // Timing
  timers: Record<string, GameTimer>;
  
  // Game flow
  isActive: boolean;
  isPaused: boolean;
  isComplete: boolean;
  
  // Events and history
  events: GameEvent[];
  
  // Metadata
  startedAt?: string;
  pausedAt?: string;
  resumedAt?: string;
  completedAt?: string;
  
  // Real-time state
  connectedPlayers: string[];
  lastUpdated: string;
}

export interface GameStateUpdate {
  type: 'phase-change' | 'score-update' | 'timer-update' | 'player-action' | 
        'question-change' | 'round-change' | 'game-event';
  gameId: string;
  data: Partial<GameState>;
  timestamp: string;
}

export interface GameAction {
  type: 'start-game' | 'pause-game' | 'resume-game' | 'end-game' | 
        'start-round' | 'end-round' | 'present-question' | 'submit-answer' | 
        'lock-answers' | 'reveal-answers' | 'advance-question' | 'skip-question' |
        'update-timer' | 'add-player' | 'remove-player' | 'form-team' | 
        'update-settings';
  gameId: string;
  playerId?: string;
  teamId?: string;
  payload?: Record<string, any>;
  timestamp: string;
}

// Utility types for state management
export type GameStateSlice<T extends keyof GameState> = Pick<GameState, T>;
export type GameStatePartial = Partial<GameState>;
export type GameStateRequired<T extends keyof GameState> = Required<Pick<GameState, T>>;

// Validation and constraints
export const GAME_CONSTRAINTS = {
  MIN_PLAYERS: 1,
  MAX_PLAYERS: 50,
  MIN_TEAMS: 1,
  MAX_TEAMS: 20,
  MIN_TEAM_SIZE: 1,
  MAX_TEAM_SIZE: 6,
  MIN_ROUNDS: 1,
  MAX_ROUNDS: 10,
  MIN_QUESTIONS_PER_ROUND: 1,
  MAX_QUESTIONS_PER_ROUND: 20,
  MIN_TIME_LIMIT: 10, // seconds
  MAX_TIME_LIMIT: 300, // 5 minutes
  LAST_CALL_ROUND_1_POINTS: [1, 3, 5] as const,
  LAST_CALL_ROUND_2_POINTS: [2, 4, 6] as const,
} as const;

// Type guards for runtime validation
export function isValidGamePhase(phase: string): phase is GamePhase {
  const validPhases: GamePhase[] = [
    'pre-game', 'round-intro', 'question-selection', 'question-display',
    'answer-submission', 'answer-review', 'scoring', 'round-complete',
    'game-complete', 'paused'
  ];
  return validPhases.includes(phase as GamePhase);
}

export function isValidPointValue(value: number): value is PointValue {
  return [1, 2, 3, 4, 5, 6].includes(value);
}

export function isValidRoundType(type: string): type is RoundType {
  const validTypes: RoundType[] = [
    'standard', 'picture', 'audio', 'video', 'wager', 'bonus', 'lightning'
  ];
  return validTypes.includes(type as RoundType);
}

export function isValidQuestionType(type: string): type is QuestionType {
  const validTypes: QuestionType[] = [
    'text', 'image', 'audio', 'video', 'multiple-choice', 'true-false'
  ];
  return validTypes.includes(type as QuestionType);
} 
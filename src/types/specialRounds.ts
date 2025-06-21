import type { Question, Round } from './game';

// Special Round Types
export const SpecialRoundType = {
  WAGER: 'wager',
  PICTURE: 'picture',
  BONUS: 'bonus',
  LIGHTNING: 'lightning',
  FINAL_JEOPARDY: 'final_jeopardy',
  AUDIO: 'audio',
  VIDEO: 'video',
  TEAM_CHALLENGE: 'team_challenge'
} as const;

export type SpecialRoundType = typeof SpecialRoundType[keyof typeof SpecialRoundType];

// Wager Round Types
export interface WagerRoundSettings {
  minWager: number;
  maxWager: number;
  allowZeroWager: boolean;
  wagerTimeLimit: number; // seconds
  questionTimeLimit: number; // seconds
  defaultWager?: number;
  wagerMultiplier?: number;
}

export interface WagerSubmission {
  participantId: string;
  wagerAmount: number;
  submittedAt: Date;
  isLocked: boolean;
}

export interface WagerRound extends Round {
  type: 'wager';
  specialType: typeof SpecialRoundType.WAGER;
  settings: WagerRoundSettings;
  wagerSubmissions: Map<string, WagerSubmission>;
  wagerPhase: WagerPhase;
  currentWagerDeadline?: Date;
}

export const WagerPhase = {
  INSTRUCTIONS: 'instructions',
  WAGER_SUBMISSION: 'wager_submission',
  QUESTION_DISPLAY: 'question_display',
  ANSWER_SUBMISSION: 'answer_submission',
  RESULTS: 'results'
} as const;

export type WagerPhase = typeof WagerPhase[keyof typeof WagerPhase];

// Picture Round Types
export interface PictureRoundSettings {
  imageQuality: 'low' | 'medium' | 'high';
  allowZoom: boolean;
  showImagePreview: boolean;
  imageDisplayTime?: number; // seconds, 0 = unlimited
  preloadImages: boolean;
  imageTransitions: boolean;
}

export interface PictureQuestion extends Question {
  imageUrl: string;
  imageAlt: string;
  imageCaption?: string;
  thumbnailUrl?: string;
  imageMetadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

export interface PictureRound extends Round {
  type: 'picture';
  specialType: typeof SpecialRoundType.PICTURE;
  settings: PictureRoundSettings;
  questions: PictureQuestion[];
  imageLoadingStatus: Map<string, ImageLoadStatus>;
}

export const ImageLoadStatus = {
  PENDING: 'pending',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error'
} as const;

export type ImageLoadStatus = typeof ImageLoadStatus[keyof typeof ImageLoadStatus];

// Bonus Round Types
export interface BonusRoundSettings {
  bonusMultiplier: number;
  streakBonus: boolean;
  streakBonusThreshold: number;
  streakBonusPoints: number;
  timeBonus: boolean;
  timeBonusThreshold: number; // seconds
  timeBonusMultiplier: number;
  perfectRoundBonus: number;
  eliminationMode: boolean;
  eliminationThreshold: number; // incorrect answers before elimination
}

export interface BonusRound extends Round {
  type: 'bonus';
  specialType: typeof SpecialRoundType.BONUS;
  settings: BonusRoundSettings;
  participantStatus: Map<string, BonusParticipantStatus>;
  bonusScores: Map<string, BonusScore>;
}

export interface BonusParticipantStatus {
  participantId: string;
  isActive: boolean;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  isEliminated: boolean;
  eliminatedAt?: Date;
  bonusMultiplier: number;
}

export interface BonusScore {
  participantId: string;
  baseScore: number;
  bonusPoints: number;
  streakBonus: number;
  timeBonus: number;
  perfectRoundBonus: number;
  totalBonus: number;
  finalScore: number;
}

// Lightning Round Types
export interface LightningRoundSettings {
  questionTimeLimit: number; // seconds per question
  totalTimeLimit: number; // total round time
  autoAdvance: boolean;
  showRunningScore: boolean;
  pointsPerCorrect: number;
  penaltyPerIncorrect: number;
  questionCount: number;
}

export interface LightningRound extends Round {
  type: 'lightning';
  specialType: typeof SpecialRoundType.LIGHTNING;
  settings: LightningRoundSettings;
  startTime?: Date;
  endTime?: Date;
  currentQuestionIndex: number;
  participantProgress: Map<string, LightningProgress>;
}

export interface LightningProgress {
  participantId: string;
  questionsAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  currentScore: number;
  timeRemaining: number;
  isComplete: boolean;
  completedAt?: Date;
}

// Audio Round Types
export interface AudioRoundSettings {
  audioQuality: 'low' | 'medium' | 'high';
  allowReplay: boolean;
  maxReplays: number;
  autoPlay: boolean;
  showWaveform: boolean;
  showPlaybackControls: boolean;
  preloadAudio: boolean;
}

export interface AudioQuestion extends Question {
  audioUrl: string;
  audioDuration: number; // seconds
  audioFormat: string;
  audioTranscript?: string;
  audioMetadata?: {
    bitrate: number;
    sampleRate: number;
    channels: number;
    size: number;
  };
}

export interface AudioRound extends Round {
  type: 'audio';
  specialType: typeof SpecialRoundType.AUDIO;
  settings: AudioRoundSettings;
  questions: AudioQuestion[];
  audioLoadingStatus: Map<string, AudioLoadStatus>;
  playbackStatus: Map<string, AudioPlaybackStatus>;
}

export const AudioLoadStatus = {
  PENDING: 'pending',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error'
} as const;

export type AudioLoadStatus = typeof AudioLoadStatus[keyof typeof AudioLoadStatus];

export interface AudioPlaybackStatus {
  questionId: string;
  participantId: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playCount: number;
  lastPlayedAt?: Date;
}

// Video Round Types
export interface VideoRoundSettings {
  videoQuality: 'low' | 'medium' | 'high';
  allowReplay: boolean;
  maxReplays: number;
  autoPlay: boolean;
  showControls: boolean;
  allowSeek: boolean;
  preloadVideo: boolean;
  showSubtitles: boolean;
}

export interface VideoQuestion extends Question {
  videoUrl: string;
  videoDuration: number; // seconds
  videoFormat: string;
  thumbnailUrl?: string;
  subtitleUrl?: string;
  videoMetadata?: {
    width: number;
    height: number;
    bitrate: number;
    frameRate: number;
    size: number;
  };
}

export interface VideoRound extends Round {
  type: 'video';
  specialType: typeof SpecialRoundType.VIDEO;
  settings: VideoRoundSettings;
  questions: VideoQuestion[];
  videoLoadingStatus: Map<string, VideoLoadStatus>;
  playbackStatus: Map<string, VideoPlaybackStatus>;
}

export const VideoLoadStatus = {
  PENDING: 'pending',
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error'
} as const;

export type VideoLoadStatus = typeof VideoLoadStatus[keyof typeof VideoLoadStatus];

export interface VideoPlaybackStatus {
  questionId: string;
  participantId: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playCount: number;
  lastPlayedAt?: Date;
}

// Team Challenge Round Types
export interface TeamChallengeSettings {
  requiresTeams: boolean;
  minTeamSize: number;
  maxTeamSize: number;
  allowIndividualParticipation: boolean;
  teamBonusMultiplier: number;
  collaborativeAnswering: boolean;
  teamCaptainOnly: boolean;
  discussionTimeLimit: number; // seconds
}

export interface TeamChallengeRound extends Round {
  type: 'standard'; // Team challenges use standard type but with special settings
  specialType: typeof SpecialRoundType.TEAM_CHALLENGE;
  settings: TeamChallengeSettings;
  teamSubmissions: Map<string, TeamSubmission>;
  discussionPhase: boolean;
  discussionDeadline?: Date;
}

export interface TeamSubmission {
  teamId: string;
  captainId: string;
  answer: string;
  submittedAt: Date;
  discussionLog?: DiscussionEntry[];
}

export interface DiscussionEntry {
  participantId: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'vote' | 'suggestion';
}

// Union types for special rounds
export type SpecialRound = 
  | WagerRound 
  | PictureRound 
  | BonusRound 
  | LightningRound 
  | AudioRound 
  | VideoRound 
  | TeamChallengeRound;

export type SpecialQuestion = 
  | PictureQuestion 
  | AudioQuestion 
  | VideoQuestion;

// Event types
export interface SpecialRoundEvent {
  type: SpecialRoundEventType;
  roundId: string;
  specialType: SpecialRoundType;
  timestamp: Date;
  participantId?: string;
  teamId?: string;
  data?: any;
}

export const SpecialRoundEventType = {
  ROUND_STARTED: 'special_round_started',
  ROUND_ENDED: 'special_round_ended',
  PHASE_CHANGED: 'special_phase_changed',
  WAGER_SUBMITTED: 'wager_submitted',
  WAGER_LOCKED: 'wager_locked',
  IMAGE_LOADED: 'image_loaded',
  IMAGE_ERROR: 'image_error',
  AUDIO_LOADED: 'audio_loaded',
  AUDIO_PLAYED: 'audio_played',
  VIDEO_LOADED: 'video_loaded',
  VIDEO_PLAYED: 'video_played',
  BONUS_ACHIEVED: 'bonus_achieved',
  PARTICIPANT_ELIMINATED: 'participant_eliminated',
  STREAK_BONUS: 'streak_bonus',
  TIME_BONUS: 'time_bonus',
  PERFECT_ROUND_BONUS: 'perfect_round_bonus',
  TEAM_DISCUSSION_STARTED: 'team_discussion_started',
  TEAM_DISCUSSION_ENDED: 'team_discussion_ended',
  LIGHTNING_COMPLETED: 'lightning_completed'
} as const;

export type SpecialRoundEventType = typeof SpecialRoundEventType[keyof typeof SpecialRoundEventType];

// Configuration and validation types
export interface SpecialRoundConfig {
  specialType: SpecialRoundType;
  enabled: boolean;
  settings: WagerRoundSettings | PictureRoundSettings | BonusRoundSettings | 
           LightningRoundSettings | AudioRoundSettings | VideoRoundSettings | 
           TeamChallengeSettings;
  customRules?: SpecialRoundRule[];
}

export interface SpecialRoundRule {
  id: string;
  name: string;
  description: string;
  condition: string; // JavaScript expression
  action: string; // JavaScript expression
  priority: number;
  enabled: boolean;
}

export interface SpecialRoundValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SpecialRoundMetrics {
  roundId: string;
  specialType: SpecialRoundType;
  participantCount: number;
  completionRate: number;
  averageScore: number;
  averageTime: number;
  errorCount: number;
  engagementScore: number;
} 
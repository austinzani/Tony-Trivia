// Score Management Types for Tony Trivia Host Controls

export interface ScoreAdjustment {
  id: string;
  type: 'question' | 'total' | 'bonus' | 'penalty';
  entityId: string; // teamId or playerId
  entityType: 'team' | 'player';
  questionId?: string;
  previousScore: number;
  newScore: number;
  adjustment: number; // difference
  reason: string;
  adjustedBy: string; // hostId
  timestamp: Date;
  isReverted?: boolean;
  revertedAt?: Date;
  revertedBy?: string;
}

export interface ScoreOverrideData {
  entityId: string;
  entityType: 'team' | 'player';
  entityName: string;
  currentScore: number;
  newScore: number;
  adjustment: number;
  reason: string;
  questionId?: string;
  questionText?: string;
}

export interface QuestionScoreData {
  questionId: string;
  questionText: string;
  correctAnswer: string;
  currentScore: number;
  maxPossibleScore: number;
  isCorrect: boolean;
  submissionTime?: Date;
  originalAnswer?: string;
}

export interface ScoreHistoryEntry {
  id: string;
  timestamp: Date;
  type: 'automatic' | 'manual' | 'bonus' | 'penalty' | 'revert';
  entityId: string;
  entityType: 'team' | 'player';
  entityName: string;
  previousScore: number;
  newScore: number;
  adjustment: number;
  reason: string;
  performedBy: string;
  questionId?: string;
  questionText?: string;
  isReverted?: boolean;
  relatedAdjustmentId?: string;
}

export interface ScoreManagementFilters {
  entityType?: 'team' | 'player' | 'all';
  entityId?: string;
  adjustmentType?: 'automatic' | 'manual' | 'all';
  timeRange?: {
    start: Date;
    end: Date;
  };
  showReverted?: boolean;
  questionId?: string;
}

export interface ScoreManagementStats {
  totalAdjustments: number;
  manualAdjustments: number;
  automaticScores: number;
  revertedAdjustments: number;
  averageAdjustment: number;
  largestPositiveAdjustment: number;
  largestNegativeAdjustment: number;
  teamsAffected: number;
  playersAffected: number;
  questionsAffected: number;
}

export interface ScoreValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestedScore?: number;
  maxAllowedScore?: number;
  minAllowedScore?: number;
}

export interface BulkScoreOperation {
  id: string;
  type: 'add' | 'subtract' | 'set' | 'reset';
  entities: {
    id: string;
    type: 'team' | 'player';
    name: string;
  }[];
  adjustment: number;
  reason: string;
  performedBy: string;
  timestamp: Date;
  results: {
    entityId: string;
    success: boolean;
    error?: string;
    previousScore: number;
    newScore: number;
  }[];
}

export type ScoreDisplayMode = 'total' | 'by-question' | 'by-round' | 'history';

export interface ScoreManagementActions {
  adjustScore: (data: ScoreOverrideData) => Promise<void>;
  revertAdjustment: (adjustmentId: string, reason: string) => Promise<void>;
  bulkAdjustment: (operation: Omit<BulkScoreOperation, 'id' | 'timestamp' | 'results'>) => Promise<void>;
  validateScoreChange: (entityId: string, newScore: number) => Promise<ScoreValidationResult>;
  getScoreHistory: (filters?: ScoreManagementFilters) => Promise<ScoreHistoryEntry[]>;
  exportScoreData: (format: 'csv' | 'json') => Promise<string>;
  resetAllScores: (reason: string) => Promise<void>;
}

export interface ScoreManagementState {
  currentEntity: {
    id: string;
    type: 'team' | 'player';
    name: string;
    totalScore: number;
    questionScores: QuestionScoreData[];
  } | null;
  displayMode: ScoreDisplayMode;
  filters: ScoreManagementFilters;
  history: ScoreHistoryEntry[];
  stats: ScoreManagementStats;
  adjustments: ScoreAdjustment[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date;
}

export interface ScoreManagementContextType {
  state: ScoreManagementState;
  actions: ScoreManagementActions;
  refreshData: () => Promise<void>;
  selectEntity: (entityId: string, entityType: 'team' | 'player') => void;
  setDisplayMode: (mode: ScoreDisplayMode) => void;
  updateFilters: (filters: Partial<ScoreManagementFilters>) => void;
}

// Component Props Interfaces
export interface ScoreManagementInterfaceProps {
  gameId: string;
  className?: string;
  onScoreChanged?: (adjustment: ScoreAdjustment) => void;
  onError?: (error: string) => void;
}

export interface ScoreAdjustmentControlsProps {
  entityId: string;
  entityType: 'team' | 'player';
  entityName: string;
  currentScore: number;
  onAdjust: (data: ScoreOverrideData) => void;
  disabled?: boolean;
  maxScore?: number;
  minScore?: number;
}

export interface ScoreHistoryDisplayProps {
  history: ScoreHistoryEntry[];
  filters: ScoreManagementFilters;
  onFilterChange: (filters: Partial<ScoreManagementFilters>) => void;
  onRevert?: (adjustmentId: string) => void;
  showActions?: boolean;
}

export interface ScoreConfirmationDialogProps {
  isOpen: boolean;
  data: ScoreOverrideData;
  onConfirm: () => void;
  onCancel: () => void;
  validationResult?: ScoreValidationResult;
}

export interface QuestionScoreCardProps {
  questionData: QuestionScoreData;
  entityType: 'team' | 'player';
  onScoreChange: (questionId: string, newScore: number, reason: string) => void;
  canEdit?: boolean;
}

export interface ScoreStatsDisplayProps {
  stats: ScoreManagementStats;
  showDetailed?: boolean;
  className?: string;
} 
import type { AnswerSubmission } from '../services/answerSubmissionManager';

// Enhanced answer submission with management status
export interface ManagedAnswerSubmission extends AnswerSubmission {
  reviewStatus: AnswerReviewStatus;
  reviewedAt?: Date;
  reviewedBy?: string; // host ID
  hostFeedback?: string;
  isCorrect?: boolean;
  pointsAwarded?: number;
  hasConflict?: boolean; // For cases where automatic scoring conflicts
}

export type AnswerReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs-review' | 'auto-approved';

export interface AnswerReviewAction {
  submissionId: string;
  action: 'approve' | 'reject' | 'needs-review';
  feedback?: string;
  pointsAwarded?: number;
  reviewedBy: string;
  reviewedAt: Date;
}

export interface BulkAnswerAction {
  submissionIds: string[];
  action: 'approve' | 'reject' | 'lock' | 'unlock';
  feedback?: string;
  reviewedBy: string;
  reviewedAt: Date;
}

export interface AnswerFilterOptions {
  status?: AnswerReviewStatus | 'all';
  teamId?: string | 'all';
  questionId?: string | 'all';
  roundId?: string | 'all';
  isLocked?: boolean | 'all';
  hasConflict?: boolean | 'all';
  searchTerm?: string;
}

export interface AnswerSortOptions {
  field: 'submittedAt' | 'reviewedAt' | 'teamName' | 'questionNumber' | 'pointValue' | 'reviewStatus';
  direction: 'asc' | 'desc';
}

export interface AnswerManagementState {
  submissions: ManagedAnswerSubmission[];
  filteredSubmissions: ManagedAnswerSubmission[];
  selectedSubmissions: Set<string>;
  filterOptions: AnswerFilterOptions;
  sortOptions: AnswerSortOptions;
  isLoading: boolean;
  error: string | null;
  bulkActionInProgress: boolean;
}

export interface AnswerStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  needsReview: number;
  autoApproved: number;
  locked: number;
  unlocked: number;
  averageReviewTime: number; // in seconds
  conflictCount: number;
}

export interface TeamSubmissionSummary {
  teamId: string;
  teamName: string;
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  lockedSubmissions: number;
  averagePointValue: number;
  lastSubmissionAt?: Date;
  submissionRate: number; // percentage of questions answered
}

export interface QuestionSubmissionSummary {
  questionId: string;
  questionText: string;
  questionNumber: number;
  roundNumber: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  averagePointValue: number;
  mostCommonAnswer: string;
  conflictCount: number;
  submissionRate: number; // percentage of teams that submitted
}

// Event types for real-time updates
export interface AnswerManagementEvent {
  type: AnswerManagementEventType;
  submissionId: string;
  submission?: ManagedAnswerSubmission;
  action?: AnswerReviewAction;
  timestamp: Date;
  userId: string;
}

export const AnswerManagementEventType = {
  SUBMISSION_REVIEWED: 'submission_reviewed',
  SUBMISSION_BULK_ACTION: 'submission_bulk_action',
  SUBMISSION_LOCKED: 'submission_locked',
  SUBMISSION_UNLOCKED: 'submission_unlocked',
  SUBMISSION_UPDATED: 'submission_updated',
  REVIEW_CONFLICT_DETECTED: 'review_conflict_detected',
  SCORING_COMPLETED: 'scoring_completed'
} as const;

export type AnswerManagementEventType = typeof AnswerManagementEventType[keyof typeof AnswerManagementEventType];

export type AnswerManagementEventListener = (event: AnswerManagementEvent) => void;

// Utility types for component props
export interface AnswerManagementProps {
  gameId: string;
  currentQuestionId?: string;
  currentRoundId?: string;
  onSubmissionReviewed?: (action: AnswerReviewAction) => void;
  onBulkAction?: (action: BulkAnswerAction) => void;
  onSubmissionSelected?: (submissionIds: string[]) => void;
  className?: string;
}

export interface AnswerSubmissionCardProps {
  submission: ManagedAnswerSubmission;
  teamName: string;
  questionText: string;
  questionNumber: number;
  isSelected?: boolean;
  showActions?: boolean;
  showTeamInfo?: boolean;
  showTimestamp?: boolean;
  onReview?: (action: AnswerReviewAction) => void;
  onSelect?: (submissionId: string, selected: boolean) => void;
  onLockToggle?: (submissionId: string) => void;
  className?: string;
}

export interface AnswerFilterControlsProps {
  filterOptions: AnswerFilterOptions;
  sortOptions: AnswerSortOptions;
  statistics: AnswerStatistics;
  teams: { id: string; name: string }[];
  questions: { id: string; text: string; number: number }[];
  onFilterChange: (filters: Partial<AnswerFilterOptions>) => void;
  onSortChange: (sort: AnswerSortOptions) => void;
  onClearFilters: () => void;
  className?: string;
}

export interface BulkActionControlsProps {
  selectedCount: number;
  isActionInProgress: boolean;
  onBulkAction: (action: BulkAnswerAction) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  className?: string;
} 
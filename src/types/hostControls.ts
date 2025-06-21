// Host Controls Types for Tony Trivia

export type HostTabType = 
  | 'game-flow' 
  | 'answer-management' 
  | 'score-management' 
  | 'leaderboard' 
  | 'notifications'
  | 'settings';

export type HostActionType =
  | 'start-game'
  | 'pause-game'
  | 'resume-game'
  | 'end-game'
  | 'next-question'
  | 'next-round'
  | 'skip-question'
  | 'lock-answers'
  | 'unlock-answers'
  | 'approve-answer'
  | 'reject-answer'
  | 'override-score'
  | 'adjust-timer'
  | 'show-results';

export type HostNotificationType =
  | 'answer-submitted'
  | 'time-warning'
  | 'time-expired'
  | 'team-joined'
  | 'team-left'
  | 'connection-lost'
  | 'connection-restored'
  | 'error-occurred'
  | 'round-complete';

export interface HostControlsState {
  activeTab: HostTabType;
  gameId: string;
  isMinimized: boolean;
  pendingActions: HostActionType[];
  notifications: HostNotification[];
  lastUpdated: Date;
}

export interface HostNotification {
  id: string;
  type: HostNotificationType;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionRequired?: boolean;
  relatedTeamId?: string;
  relatedPlayerId?: string;
  relatedQuestionId?: string;
}

export interface HostAction {
  type: HostActionType;
  label: string;
  description: string;
  icon: string;
  category: HostTabType;
  requiresConfirmation: boolean;
  isDestructive: boolean;
  isEnabled: boolean;
  shortcut?: string;
}

export interface TabConfig {
  id: HostTabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  badge?: number | string;
  isActive?: boolean;
  hasNotifications?: boolean;
}

export interface HostControlsLayoutProps {
  gameId: string;
  className?: string;
  initialTab?: HostTabType;
  onTabChange?: (tab: HostTabType) => void;
  onAction?: (action: HostActionType) => void;
  onNotificationRead?: (notificationId: string) => void;
}

export interface QuickAction {
  id: string;
  type: HostActionType;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  isEnabled: boolean;
  onClick: () => void;
}

export interface GameStatusInfo {
  phase: string;
  isActive: boolean;
  isPaused: boolean;
  hasError: boolean;
  participantCount: number;
  teamCount: number;
  currentRound?: number;
  currentQuestion?: number;
  timeRemaining?: number;
}

export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  position: number;
  score: number;
  memberCount: number;
  isCurrentUserTeam?: boolean;
  trend?: 'up' | 'down' | 'same';
}

export interface HostDashboardMetrics {
  totalGames: number;
  averageGameDuration: number;
  totalParticipants: number;
  averageTeamSize: number;
  popularCategories: string[];
  successRate: number;
}

// Host Permissions
export type HostPermission =
  | 'control-game-flow'
  | 'manage-answers'
  | 'override-scores'
  | 'manage-teams'
  | 'view-analytics'
  | 'configure-settings'
  | 'broadcast-messages';

export interface HostRole {
  id: string;
  name: string;
  permissions: HostPermission[];
  canDelegate: boolean;
}

// Real-time Updates
export interface HostControlsUpdate {
  type: 'state-change' | 'notification' | 'metrics-update' | 'error';
  gameId: string;
  data: any;
  timestamp: Date;
}

export interface HostControlsContextType {
  state: HostControlsState;
  actions: {
    setActiveTab: (tab: HostTabType) => void;
    executeAction: (action: HostActionType) => Promise<void>;
    addNotification: (notification: Omit<HostNotification, 'id' | 'timestamp'>) => void;
    markNotificationRead: (notificationId: string) => void;
    clearNotifications: () => void;
    toggleMinimized: () => void;
  };
  gameStatus: GameStatusInfo;
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
}

// Form Types for Host Actions
export interface ScoreOverrideForm {
  teamId: string;
  questionId?: string;
  newScore: number;
  reason: string;
}

export interface TimerAdjustmentForm {
  newDuration: number;
  reason: string;
}

export interface BroadcastMessageForm {
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  targetTeams?: string[];
  duration?: number;
}

export interface GameSettingsForm {
  timeLimit: number;
  maxTeams: number;
  allowLateJoins: boolean;
  showCorrectAnswers: boolean;
  enableHints: boolean;
  categories: string[];
}

// Validation Types
export interface HostActionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  canProceed: boolean;
  requiresConfirmation: boolean;
}

export interface HostControlsError {
  code: string;
  message: string;
  action?: HostActionType;
  gameId: string;
  timestamp: Date;
  isRecoverable: boolean;
} 
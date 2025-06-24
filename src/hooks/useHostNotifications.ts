import { useState, useEffect, useCallback, useRef } from 'react';

// Basic types for now - will be replaced with actual imports
interface HostGameNotification {
  id: string;
  type: string;
  message: string;
  timestamp: Date;
}

interface ReviewRequest {
  id: string;
  teamId: string;
  teamName: string;
  questionId: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface GameControlAlert {
  id: string;
  type: string;
  message: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  resolvedAt?: Date;
  resolvedBy?: string;
}

interface PerformanceAlert {
  id: string;
  type: string;
  metric: string;
  value: number;
  resolved: boolean;
  resolvedAt?: Date;
}

interface HostAlertConfig {
  enableAnswerReviewAlerts: boolean;
  enableScoreDisputeAlerts: boolean;
  autoApproveThreshold: number;
  escalationTimeout: number;
  enableGameProgressAlerts: boolean;
  enablePerformanceAlerts: boolean;
}

// Hook state interfaces
export interface HostNotificationState {
  notifications: HostGameNotification[];
  pendingReviews: ReviewRequest[];
  escalatedReviews: ReviewRequest[];
  gameControlAlerts: GameControlAlert[];
  performanceAlerts: PerformanceAlert[];
  reviewQueueLength: number;
  isConnected: boolean;
  lastUpdated: Date | null;
}

export interface HostNotificationActions {
  // Review management
  submitAnswerForReview: (
    teamId: string,
    teamName: string,
    questionId: string,
    questionText: string,
    submittedAnswer: string,
    expectedAnswer: string,
    pointValue: number,
    confidence: 'low' | 'medium' | 'high'
  ) => Promise<ReviewRequest>;
  
  reviewAnswer: (
    reviewId: string,
    decision: 'approved' | 'rejected',
    reviewNotes?: string,
    pointOverride?: number
  ) => Promise<ReviewRequest | null>;
  
  // Utility actions
  clearNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  markReviewAsRead: (reviewId: string) => void;
  resolveGameControlAlert: (alertId: string) => void;
  resolvePerformanceAlert: (alertId: string) => void;
}

export interface UseHostNotificationsOptions {
  gameId: string;
  enabled?: boolean;
  config?: Partial<HostAlertConfig>;
  onNotification?: (notification: HostGameNotification) => void;
  onReviewRequest?: (request: ReviewRequest) => void;
  onGameControlAlert?: (alert: GameControlAlert) => void;
  onPerformanceAlert?: (alert: PerformanceAlert) => void;
}

export interface UseHostNotificationsReturn {
  state: HostNotificationState;
  actions: HostNotificationActions;
  isLoading: boolean;
  error: string | null;
}

/**
 * Main hook for host notifications
 * Provides comprehensive notification management for game hosts
 */
export function useHostNotifications({
  gameId,
  enabled = true,
  config = {},
  onNotification,
  onReviewRequest,
  onGameControlAlert,
  onPerformanceAlert
}: UseHostNotificationsOptions): UseHostNotificationsReturn {
  // State
  const [state, setState] = useState<HostNotificationState>({
    notifications: [],
    pendingReviews: [],
    escalatedReviews: [],
    gameControlAlerts: [],
    performanceAlerts: [],
    reviewQueueLength: 0,
    isConnected: false,
    lastUpdated: null,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize service
  useEffect(() => {
    if (!enabled || !gameId) {
      setIsLoading(false);
      return;
    }
    
    // Placeholder initialization
    setIsLoading(false);
    setState(prev => ({ ...prev, isConnected: true }));
  }, [enabled, gameId]);
  
  // Actions
  const actions: HostNotificationActions = {
    submitAnswerForReview: useCallback(async (
      teamId: string,
      teamName: string,
      questionId: string,
      questionText: string,
      submittedAnswer: string,
      expectedAnswer: string,
      pointValue: number,
      confidence: 'low' | 'medium' | 'high'
    ) => {
      // Placeholder implementation
      const request: ReviewRequest = {
        id: `review-${Date.now()}`,
        teamId,
        teamName,
        questionId,
        status: 'pending'
      };
      
      setState(prev => ({
        ...prev,
        pendingReviews: [...prev.pendingReviews, request],
        reviewQueueLength: prev.reviewQueueLength + 1,
        lastUpdated: new Date(),
      }));
      
      return request;
    }, []),
    
    reviewAnswer: useCallback(async (
      reviewId: string,
      decision: 'approved' | 'rejected',
      reviewNotes?: string,
      pointOverride?: number
    ) => {
      // Placeholder implementation
      setState(prev => ({
        ...prev,
        pendingReviews: prev.pendingReviews.filter(r => r.id !== reviewId),
        reviewQueueLength: Math.max(0, prev.reviewQueueLength - 1),
        lastUpdated: new Date(),
      }));
      
      return null;
    }, []),
    
    clearNotification: useCallback((notificationId: string) => {
      setState(prev => ({
        ...prev,
        notifications: prev.notifications.filter(n => n.id !== notificationId),
        lastUpdated: new Date(),
      }));
    }, []),
    
    clearAllNotifications: useCallback(() => {
      setState(prev => ({
        ...prev,
        notifications: [],
        lastUpdated: new Date(),
      }));
    }, []),
    
    markReviewAsRead: useCallback((reviewId: string) => {
      console.log(`Marking review ${reviewId} as read`);
    }, []),
    
    resolveGameControlAlert: useCallback((alertId: string) => {
      setState(prev => ({
        ...prev,
        gameControlAlerts: prev.gameControlAlerts.filter(alert => alert.id !== alertId),
        lastUpdated: new Date(),
      }));
    }, []),
    
    resolvePerformanceAlert: useCallback((alertId: string) => {
      setState(prev => ({
        ...prev,
        performanceAlerts: prev.performanceAlerts.filter(alert => alert.id !== alertId),
        lastUpdated: new Date(),
      }));
    }, []),
  };
  
  return {
    state,
    actions,
    isLoading,
    error,
  };
}

/**
 * Simplified hook for basic host notifications
 */
export function useBasicHostNotifications(gameId: string, enabled = true) {
  const { state, actions, isLoading, error } = useHostNotifications({
    gameId,
    enabled,
  });
  
  return {
    notifications: state.notifications,
    pendingReviews: state.pendingReviews,
    reviewQueueLength: state.reviewQueueLength,
    isConnected: state.isConnected,
    submitAnswerForReview: actions.submitAnswerForReview,
    reviewAnswer: actions.reviewAnswer,
    clearNotification: actions.clearNotification,
    isLoading,
    error,
  };
}

/**
 * Hook specifically for review management
 */
export function useReviewManagement(gameId: string, enabled = true) {
  const { state, actions, isLoading, error } = useHostNotifications({
    gameId,
    enabled,
    config: {
      enableAnswerReviewAlerts: true,
      enableScoreDisputeAlerts: true,
      autoApproveThreshold: 0.85,
      escalationTimeout: 3, // 3 minutes for faster escalation
    },
  });
  
  const [selectedReview, setSelectedReview] = useState<ReviewRequest | null>(null);
  
  const selectReview = useCallback((review: ReviewRequest) => {
    setSelectedReview(review);
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedReview(null);
  }, []);
  
  const approveSelectedReview = useCallback(async (reviewNotes?: string, pointOverride?: number) => {
    if (!selectedReview) return null;
    
    const result = await actions.reviewAnswer(
      selectedReview.id,
      'approved',
      reviewNotes,
      pointOverride
    );
    
    setSelectedReview(null);
    return result;
  }, [selectedReview, actions.reviewAnswer]);
  
  const rejectSelectedReview = useCallback(async (reviewNotes?: string) => {
    if (!selectedReview) return null;
    
    const result = await actions.reviewAnswer(
      selectedReview.id,
      'rejected',
      reviewNotes
    );
    
    setSelectedReview(null);
    return result;
  }, [selectedReview, actions.reviewAnswer]);
  
  return {
    // State
    pendingReviews: state.pendingReviews,
    escalatedReviews: state.escalatedReviews,
    reviewQueueLength: state.reviewQueueLength,
    selectedReview,
    
    // Actions
    selectReview,
    clearSelection,
    approveSelectedReview,
    rejectSelectedReview,
    submitAnswerForReview: actions.submitAnswerForReview,
    
    // Status
    isLoading,
    error,
  };
}

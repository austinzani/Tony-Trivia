import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  EnhancedHostNotificationService, 
  createEnhancedHostNotificationService,
  getNotificationUrgency,
  formatNotificationMessage,
  requiresImmediateAttention
} from '../services/enhancedHostNotificationService';
import type { 
  HostGameNotification, 
  ReviewRequest, 
  GameControlAlert, 
  PerformanceAlert, 
  HostAlertConfig 
} from '../services/hostNotificationService';

/**
 * Enhanced Host Notifications State
 */
export interface EnhancedHostNotificationsState {
  // Connection status
  isConnected: boolean;
  isInitializing: boolean;
  error: string | null;

  // Notifications
  notifications: HostGameNotification[];
  unreadCount: number;
  urgentCount: number;

  // Reviews
  pendingReviews: ReviewRequest[];
  escalatedReviews: ReviewRequest[];
  reviewQueueLength: number;

  // Alerts
  gameControlAlerts: GameControlAlert[];
  performanceAlerts: PerformanceAlert[];
  activeAlertsCount: number;

  // Metrics
  subscriptionMetrics?: {
    totalChannels: number;
    activeChannels: number;
    averageLatency: number;
    connectionAttempts: number;
    eventCount: number;
  };

  // Configuration
  config: HostAlertConfig;
}

/**
 * Enhanced Host Notifications Actions
 */
export interface EnhancedHostNotificationsActions {
  // Initialization
  initialize: () => Promise<void>;
  dispose: () => Promise<void>;

  // Notification management
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  dismissNotification: (notificationId: string) => void;

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

  // Configuration
  updateConfig: (newConfig: Partial<HostAlertConfig>) => void;

  // Utility
  getFormattedMessage: (notification: HostGameNotification) => string;
  requiresAttention: (notification: HostGameNotification) => boolean;
  refreshState: () => void;
}

/**
 * Enhanced Host Notifications Hook Options
 */
export interface UseEnhancedHostNotificationsOptions {
  gameId: string;
  hostId: string;
  config?: Partial<HostAlertConfig>;
  autoInitialize?: boolean;
  maxNotifications?: number;
  enableSounds?: boolean;
  enableVisualAlerts?: boolean;
}

/**
 * Enhanced Host Notifications Hook
 * Provides comprehensive host notification management with real-time updates
 */
export function useEnhancedHostNotifications(
  options: UseEnhancedHostNotificationsOptions
): EnhancedHostNotificationsState & { actions: EnhancedHostNotificationsActions } {
  const {
    gameId,
    hostId,
    config = {},
    autoInitialize = true,
    maxNotifications = 100,
    enableSounds = true,
    enableVisualAlerts = true
  } = options;

  // Service reference
  const serviceRef = useRef<EnhancedHostNotificationService | null>(null);

  // State
  const [state, setState] = useState<EnhancedHostNotificationsState>({
    isConnected: false,
    isInitializing: false,
    error: null,
    notifications: [],
    unreadCount: 0,
    urgentCount: 0,
    pendingReviews: [],
    escalatedReviews: [],
    reviewQueueLength: 0,
    gameControlAlerts: [],
    performanceAlerts: [],
    activeAlertsCount: 0,
    config: {
      reviewTimeoutMinutes: 5,
      escalationThreshold: 3,
      autoEscalateAfterMinutes: 10,
      maxConcurrentReviews: 10,
      enablePerformanceAlerts: true,
      performanceThresholds: {
        responseTime: 1000,
        errorRate: 0.05,
        concurrentUsers: 100
      },
      ...config
    }
  });

  // Notification storage for read state tracking
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());

  /**
   * Initialize the service
   */
  const initialize = useCallback(async (): Promise<void> => {
    if (serviceRef.current || state.isInitializing) return;

    setState(prev => ({ ...prev, isInitializing: true, error: null }));

    try {
      const service = createEnhancedHostNotificationService(gameId, hostId, config);
      serviceRef.current = service;

      // Set up event handlers
      service.setEventHandlers({
        onConnectionChange: (isConnected) => {
          setState(prev => ({ ...prev, isConnected, isInitializing: false }));
        },
        onNotificationReceived: (notification) => {
          setState(prev => {
            const newNotifications = [notification, ...prev.notifications].slice(0, maxNotifications);
            const unreadCount = newNotifications.filter(n => !readNotifications.has(n.id)).length;
            const urgentCount = newNotifications.filter(n => requiresImmediateAttention(n) && !readNotifications.has(n.id)).length;

            return {
              ...prev,
              notifications: newNotifications,
              unreadCount,
              urgentCount
            };
          });

          // Play sound for urgent notifications
          if (enableSounds && requiresImmediateAttention(notification)) {
            playNotificationSound('urgent');
          } else if (enableSounds) {
            playNotificationSound('normal');
          }

          // Show visual alert for critical notifications
          if (enableVisualAlerts && notification.priority === 'critical') {
            showVisualAlert(notification);
          }
        },
        onReviewReceived: (review) => {
          setState(prev => ({
            ...prev,
            pendingReviews: [review, ...prev.pendingReviews],
            reviewQueueLength: prev.reviewQueueLength + 1
          }));

          if (enableSounds) {
            playNotificationSound('review');
          }
        },
        onAlertReceived: (alert) => {
          setState(prev => ({
            ...prev,
            gameControlAlerts: [alert, ...prev.gameControlAlerts],
            activeAlertsCount: prev.activeAlertsCount + 1
          }));

          if (enableSounds && alert.urgency === 'critical') {
            playNotificationSound('urgent');
          }
        },
        onPerformanceAlertReceived: (alert) => {
          setState(prev => ({
            ...prev,
            performanceAlerts: [alert, ...prev.performanceAlerts]
          }));
        }
      });

      await service.initialize();

      // Update state with initial service state
      refreshState();

    } catch (error) {
      console.error('Failed to initialize enhanced host notifications:', error);
      setState(prev => ({
        ...prev,
        isInitializing: false,
        error: error instanceof Error ? error.message : 'Failed to initialize notifications'
      }));
    }
  }, [gameId, hostId, config, maxNotifications, enableSounds, enableVisualAlerts, readNotifications]);

  /**
   * Dispose of the service
   */
  const dispose = useCallback(async (): Promise<void> => {
    if (serviceRef.current) {
      await serviceRef.current.dispose();
      serviceRef.current = null;
    }
    setState(prev => ({ ...prev, isConnected: false, isInitializing: false }));
  }, []);

  /**
   * Refresh state from service
   */
  const refreshState = useCallback((): void => {
    if (!serviceRef.current) return;

    const serviceState = serviceRef.current.getState();
    setState(prev => ({
      ...prev,
      pendingReviews: serviceState.pendingReviews,
      escalatedReviews: serviceState.escalatedReviews,
      reviewQueueLength: serviceState.reviewQueueLength,
      gameControlAlerts: serviceState.gameControlAlerts,
      performanceAlerts: serviceState.performanceAlerts,
      activeAlertsCount: serviceState.gameControlAlerts.length + serviceState.performanceAlerts.length,
      subscriptionMetrics: serviceState.subscriptionMetrics,
      config: serviceState.config
    }));
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback((notificationId: string): void => {
    setReadNotifications(prev => new Set([...prev, notificationId]));
    setState(prev => {
      const unreadCount = prev.notifications.filter(n => !readNotifications.has(n.id) && n.id !== notificationId).length;
      const urgentCount = prev.notifications.filter(n => 
        requiresImmediateAttention(n) && !readNotifications.has(n.id) && n.id !== notificationId
      ).length;
      
      return { ...prev, unreadCount, urgentCount };
    });
  }, [readNotifications]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback((): void => {
    const allIds = state.notifications.map(n => n.id);
    setReadNotifications(new Set(allIds));
    setState(prev => ({ ...prev, unreadCount: 0, urgentCount: 0 }));
  }, [state.notifications]);

  /**
   * Clear all notifications
   */
  const clearNotifications = useCallback((): void => {
    setState(prev => ({
      ...prev,
      notifications: [],
      unreadCount: 0,
      urgentCount: 0
    }));
    setReadNotifications(new Set());
  }, []);

  /**
   * Dismiss a specific notification
   */
  const dismissNotification = useCallback((notificationId: string): void => {
    setState(prev => {
      const newNotifications = prev.notifications.filter(n => n.id !== notificationId);
      const unreadCount = newNotifications.filter(n => !readNotifications.has(n.id)).length;
      const urgentCount = newNotifications.filter(n => requiresImmediateAttention(n) && !readNotifications.has(n.id)).length;
      
      return {
        ...prev,
        notifications: newNotifications,
        unreadCount,
        urgentCount
      };
    });
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(notificationId);
      return newSet;
    });
  }, [readNotifications]);

  /**
   * Submit answer for review
   */
  const submitAnswerForReview = useCallback(async (
    teamId: string,
    teamName: string,
    questionId: string,
    questionText: string,
    submittedAnswer: string,
    expectedAnswer: string,
    pointValue: number,
    confidence: 'low' | 'medium' | 'high'
  ): Promise<ReviewRequest> => {
    if (!serviceRef.current) {
      throw new Error('Service not initialized');
    }

    const review = await serviceRef.current.submitAnswerForReview(
      teamId,
      teamName,
      questionId,
      questionText,
      submittedAnswer,
      expectedAnswer,
      pointValue,
      confidence
    );

    refreshState();
    return review;
  }, [refreshState]);

  /**
   * Review an answer
   */
  const reviewAnswer = useCallback(async (
    reviewId: string,
    decision: 'approved' | 'rejected',
    reviewNotes?: string,
    pointOverride?: number
  ): Promise<ReviewRequest | null> => {
    if (!serviceRef.current) {
      throw new Error('Service not initialized');
    }

    const review = await serviceRef.current.reviewAnswer(reviewId, decision, reviewNotes, pointOverride);
    refreshState();
    return review;
  }, [refreshState]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<HostAlertConfig>): void => {
    if (!serviceRef.current) return;

    serviceRef.current.updateConfig(newConfig);
    setState(prev => ({ ...prev, config: { ...prev.config, ...newConfig } }));
  }, []);

  /**
   * Get formatted message
   */
  const getFormattedMessage = useCallback((notification: HostGameNotification): string => {
    return formatNotificationMessage(notification);
  }, []);

  /**
   * Check if notification requires attention
   */
  const requiresAttention = useCallback((notification: HostGameNotification): boolean => {
    return requiresImmediateAttention(notification);
  }, []);

  // Auto-initialize
  useEffect(() => {
    if (autoInitialize && gameId && hostId) {
      initialize();
    }

    return () => {
      dispose();
    };
  }, [autoInitialize, gameId, hostId, initialize, dispose]);

  // Update unread counts when readNotifications changes
  useEffect(() => {
    const unreadCount = state.notifications.filter(n => !readNotifications.has(n.id)).length;
    const urgentCount = state.notifications.filter(n => 
      requiresImmediateAttention(n) && !readNotifications.has(n.id)
    ).length;
    
    setState(prev => ({ ...prev, unreadCount, urgentCount }));
  }, [readNotifications, state.notifications]);

  return {
    ...state,
    actions: {
      initialize,
      dispose,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      dismissNotification,
      submitAnswerForReview,
      reviewAnswer,
      updateConfig,
      getFormattedMessage,
      requiresAttention,
      refreshState
    }
  };
}

/**
 * Utility function to play notification sounds
 */
function playNotificationSound(type: 'normal' | 'urgent' | 'review'): void {
  try {
    const audio = new Audio();
    switch (type) {
      case 'urgent':
        audio.src = '/sounds/urgent-notification.wav';
        break;
      case 'review':
        audio.src = '/sounds/review-notification.wav';
        break;
      default:
        audio.src = '/sounds/notification.wav';
    }
    audio.volume = 0.5;
    audio.play().catch(console.warn);
  } catch (error) {
    console.warn('Failed to play notification sound:', error);
  }
}

/**
 * Utility function to show visual alerts
 */
function showVisualAlert(notification: HostGameNotification): void {
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/notification-icon.png',
        badge: '/icons/badge-icon.png',
        tag: notification.id,
        requireInteraction: requiresImmediateAttention(notification)
      });
    }
  } catch (error) {
    console.warn('Failed to show visual alert:', error);
  }
}

/**
 * Hook for requesting notification permissions
 */
export function useNotificationPermissions() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  return { permission, requestPermission };
} 
import { v4 as uuidv4 } from 'uuid';
import { HostNotificationService, type HostGameNotification, type ReviewRequest, type GameControlAlert, type PerformanceAlert, type HostAlertConfig } from './hostNotificationService';
import { ChannelSubscriptionService } from './channelSubscriptionService';
import { RealtimeChannelManager } from './realtimeChannelManager';
import type { HostSubscriptionOptions } from './channelSubscriptionService';

/**
 * Enhanced Host Notification Service
 * Integrates the existing host notification system with real-time subscriptions
 * Provides seamless real-time notifications for game hosts with enhanced features
 */
export class EnhancedHostNotificationService {
  private hostNotificationService: HostNotificationService;
  private channelSubscriptionService: ChannelSubscriptionService;
  private channelManager: RealtimeChannelManager;
  private subscriptionId: string | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  // Event handlers
  private onConnectionChange?: (isConnected: boolean) => void;
  private onNotificationReceived?: (notification: HostGameNotification) => void;
  private onReviewReceived?: (review: ReviewRequest) => void;
  private onAlertReceived?: (alert: GameControlAlert) => void;
  private onPerformanceAlertReceived?: (alert: PerformanceAlert) => void;

  constructor(
    private gameId: string,
    private hostId: string,
    private config: Partial<HostAlertConfig> = {}
  ) {
    this.hostNotificationService = new HostNotificationService(gameId, hostId, config);
    this.channelSubscriptionService = ChannelSubscriptionService.getInstance();
    this.channelManager = RealtimeChannelManager.getInstance();
  }

  /**
   * Initialize the enhanced host notification system
   */
  async initialize(): Promise<void> {
    try {
      await this.setupRealtimeSubscriptions();
      await this.setupNotificationHandlers();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.onConnectionChange?.(true);
    } catch (error) {
      console.error('Failed to initialize enhanced host notifications:', error);
      this.handleConnectionError(error);
    }
  }

  /**
   * Set up real-time subscriptions for host notifications
   */
  private async setupRealtimeSubscriptions(): Promise<void> {
    const subscriptionOptions: HostSubscriptionOptions = {
      roomId: this.gameId,
      hostId: this.hostId,
      onReviewRequest: this.handleReviewRequest.bind(this),
      onGameControl: this.handleGameControlAlert.bind(this),
      onAdminNotification: this.handleAdminNotification.bind(this),
      onEmergencyAlert: this.handleEmergencyAlert.bind(this),
      enableOfflineQueue: true,
      queuePriority: 'high'
    };

    this.subscriptionId = await this.channelSubscriptionService.subscribeToHostNotifications(subscriptionOptions);
  }

  /**
   * Set up notification handlers to bridge real-time events with the host notification service
   */
  private async setupNotificationHandlers(): Promise<void> {
    // Subscribe to host notification service events
    this.hostNotificationService.subscribe(this.handleHostNotification.bind(this));
    this.hostNotificationService.subscribeToReviews(this.handleReviewUpdate.bind(this));
    this.hostNotificationService.subscribeToAlerts(this.handleAlertUpdate.bind(this));
  }

  /**
   * Handle incoming review requests from real-time subscriptions
   */
  private async handleReviewRequest(payload: any): Promise<void> {
    try {
      const {
        teamId,
        teamName,
        questionId,
        questionText,
        submittedAnswer,
        expectedAnswer,
        pointValue,
        confidence
      } = payload;

      const reviewRequest = await this.hostNotificationService.submitAnswerForReview(
        teamId,
        teamName,
        questionId,
        questionText,
        submittedAnswer,
        expectedAnswer,
        pointValue,
        confidence
      );

      this.onReviewReceived?.(reviewRequest);
    } catch (error) {
      console.error('Error handling review request:', error);
      await this.createErrorNotification('Failed to process review request', error);
    }
  }

  /**
   * Handle game control alerts from real-time subscriptions
   */
  private async handleGameControlAlert(payload: any): Promise<void> {
    try {
      const alert = await this.hostNotificationService.createGameControlAlert(
        payload.type,
        payload.title,
        payload.message,
        payload.suggestedAction,
        payload.urgency,
        payload.gamePhase,
        payload.contextData
      );

      this.onAlertReceived?.(alert);
    } catch (error) {
      console.error('Error handling game control alert:', error);
      await this.createErrorNotification('Failed to process game control alert', error);
    }
  }

  /**
   * Handle admin notifications from real-time subscriptions
   */
  private async handleAdminNotification(payload: any): Promise<void> {
    try {
      // Create host notification for admin messages
      const notification: HostGameNotification = {
        id: uuidv4(),
        type: 'admin',
        title: payload.title || 'Admin Notification',
        message: payload.message,
        timestamp: new Date(),
        priority: payload.priority || 'medium',
        hostOnly: true,
        gameId: this.gameId,
        permissions: payload.permissions,
        contextData: payload.contextData
      };

      this.onNotificationReceived?.(notification);
    } catch (error) {
      console.error('Error handling admin notification:', error);
      await this.createErrorNotification('Failed to process admin notification', error);
    }
  }

  /**
   * Handle emergency alerts from real-time subscriptions
   */
  private async handleEmergencyAlert(payload: any): Promise<void> {
    try {
      const performanceAlert = await this.hostNotificationService.reportPerformanceIssue(
        payload.type,
        payload.metric,
        payload.value,
        payload.threshold,
        payload.impact
      );

      this.onPerformanceAlertReceived?.(performanceAlert);

      // Also create urgent notification
      const notification: HostGameNotification = {
        id: uuidv4(),
        type: 'emergency',
        title: 'Emergency Alert',
        message: payload.message,
        timestamp: new Date(),
        priority: 'critical',
        hostOnly: true,
        gameId: this.gameId,
        escalationLevel: 'critical',
        contextData: payload
      };

      this.onNotificationReceived?.(notification);
    } catch (error) {
      console.error('Error handling emergency alert:', error);
      await this.createErrorNotification('Failed to process emergency alert', error);
    }
  }

  /**
   * Handle notifications from the host notification service
   */
  private handleHostNotification(notification: HostGameNotification): void {
    this.onNotificationReceived?.(notification);
  }

  /**
   * Handle review updates from the host notification service
   */
  private handleReviewUpdate(review: ReviewRequest): void {
    this.onReviewReceived?.(review);
  }

  /**
   * Handle alert updates from the host notification service
   */
  private handleAlertUpdate(alert: GameControlAlert): void {
    this.onAlertReceived?.(alert);
  }

  /**
   * Handle connection errors and implement reconnection logic
   */
  private async handleConnectionError(error: any): Promise<void> {
    this.isConnected = false;
    this.onConnectionChange?.(false);

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(async () => {
        try {
          await this.initialize();
        } catch (reconnectError) {
          console.error('Reconnection attempt failed:', reconnectError);
          await this.handleConnectionError(reconnectError);
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      await this.createErrorNotification('Connection lost', 'Unable to reconnect to notification system');
    }
  }

  /**
   * Create an error notification
   */
  private async createErrorNotification(title: string, error: any): Promise<void> {
    const notification: HostGameNotification = {
      id: uuidv4(),
      type: 'error',
      title,
      message: typeof error === 'string' ? error : error?.message || 'Unknown error occurred',
      timestamp: new Date(),
      priority: 'high',
      hostOnly: true,
      gameId: this.gameId,
      escalationLevel: 'urgent'
    };

    this.onNotificationReceived?.(notification);
  }

  /**
   * Submit an answer for review (enhanced with real-time broadcasting)
   */
  async submitAnswerForReview(
    teamId: string,
    teamName: string,
    questionId: string,
    questionText: string,
    submittedAnswer: string,
    expectedAnswer: string,
    pointValue: number,
    confidence: 'low' | 'medium' | 'high'
  ): Promise<ReviewRequest> {
    const review = await this.hostNotificationService.submitAnswerForReview(
      teamId,
      teamName,
      questionId,
      questionText,
      submittedAnswer,
      expectedAnswer,
      pointValue,
      confidence
    );

    // Broadcast review status to team
    await this.broadcastReviewStatus(teamId, review);

    return review;
  }

  /**
   * Review an answer (enhanced with real-time broadcasting)
   */
  async reviewAnswer(
    reviewId: string,
    decision: 'approved' | 'rejected',
    reviewNotes?: string,
    pointOverride?: number
  ): Promise<ReviewRequest | null> {
    const review = await this.hostNotificationService.reviewAnswer(
      reviewId,
      decision,
      reviewNotes,
      pointOverride
    );

    if (review) {
      // Broadcast review decision to team
      await this.broadcastReviewDecision(review, decision);
    }

    return review;
  }

  /**
   * Broadcast review status to team
   */
  private async broadcastReviewStatus(teamId: string, review: ReviewRequest): Promise<void> {
    try {
      await this.channelManager.broadcast(`team:${teamId}`, 'review_status_update', {
        reviewId: review.id,
        status: review.status,
        questionId: review.questionId,
        submittedAt: review.submittedAt,
        priority: review.priority
      });
    } catch (error) {
      console.error('Failed to broadcast review status:', error);
    }
  }

  /**
   * Broadcast review decision to team
   */
  private async broadcastReviewDecision(review: ReviewRequest, decision: 'approved' | 'rejected'): Promise<void> {
    try {
      await this.channelManager.broadcast(`team:${review.teamId}`, 'review_decision', {
        reviewId: review.id,
        decision,
        questionId: review.questionId,
        pointValue: review.pointValue,
        reviewNotes: review.reviewNotes,
        reviewedAt: review.reviewedAt,
        reviewedBy: review.reviewedBy
      });
    } catch (error) {
      console.error('Failed to broadcast review decision:', error);
    }
  }

  /**
   * Get current notification state
   */
  getState() {
    return {
      isConnected: this.isConnected,
      pendingReviews: this.hostNotificationService.getPendingReviews(),
      escalatedReviews: this.hostNotificationService.getEscalatedReviews(),
      gameControlAlerts: this.hostNotificationService.getActiveGameControlAlerts(),
      performanceAlerts: this.hostNotificationService.getUnresolvedPerformanceAlerts(),
      reviewQueueLength: this.hostNotificationService.getReviewQueueLength(),
      config: this.hostNotificationService.getConfig(),
      subscriptionMetrics: this.channelManager.getMetrics()
    };
  }

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: {
    onConnectionChange?: (isConnected: boolean) => void;
    onNotificationReceived?: (notification: HostGameNotification) => void;
    onReviewReceived?: (review: ReviewRequest) => void;
    onAlertReceived?: (alert: GameControlAlert) => void;
    onPerformanceAlertReceived?: (alert: PerformanceAlert) => void;
  }): void {
    this.onConnectionChange = handlers.onConnectionChange;
    this.onNotificationReceived = handlers.onNotificationReceived;
    this.onReviewReceived = handlers.onReviewReceived;
    this.onAlertReceived = handlers.onAlertReceived;
    this.onPerformanceAlertReceived = handlers.onPerformanceAlertReceived;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<HostAlertConfig>): void {
    this.hostNotificationService.updateConfig(newConfig);
  }

  /**
   * Dispose of all resources and clean up
   */
  async dispose(): Promise<void> {
    if (this.subscriptionId) {
      await this.channelSubscriptionService.unsubscribe(this.subscriptionId);
      this.subscriptionId = null;
    }

    this.hostNotificationService.dispose();
    this.isConnected = false;
    this.onConnectionChange?.(false);
  }
}

/**
 * Factory function to create an enhanced host notification service
 */
export function createEnhancedHostNotificationService(
  gameId: string,
  hostId: string,
  config?: Partial<HostAlertConfig>
): EnhancedHostNotificationService {
  return new EnhancedHostNotificationService(gameId, hostId, config);
}

/**
 * Utility function to determine notification urgency based on type
 */
export function getNotificationUrgency(type: string): 'low' | 'medium' | 'high' | 'critical' {
  switch (type) {
    case 'emergency':
    case 'critical_error':
    case 'security_alert':
      return 'critical';
    case 'review_escalated':
    case 'game_control':
    case 'performance_degraded':
      return 'high';
    case 'answer_review':
    case 'score_dispute':
    case 'team_activity':
      return 'medium';
    default:
      return 'low';
  }
}

/**
 * Utility function to format notification message for display
 */
export function formatNotificationMessage(notification: HostGameNotification): string {
  const timestamp = notification.timestamp.toLocaleTimeString();
  const priority = notification.priority.toUpperCase();
  return `[${timestamp}] ${priority}: ${notification.message}`;
}

/**
 * Utility function to determine if a notification requires immediate attention
 */
export function requiresImmediateAttention(notification: HostGameNotification): boolean {
  return notification.priority === 'critical' || 
         notification.escalationLevel === 'critical' ||
         notification.type === 'emergency';
} 
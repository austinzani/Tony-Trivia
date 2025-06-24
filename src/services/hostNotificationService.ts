import { v4 as uuidv4 } from 'uuid';
import type { 
  GameNotification, 
  NotificationPreferences, 
  TeamSubmissionStatus,
  HostNotification,
  HostNotificationType,
  HostPermission
} from '../types/hostControls';

// Host-specific notification types
export interface HostGameNotification extends GameNotification {
  hostOnly: true;
  gameId: string;
  permissions?: HostPermission[];
  reviewRequired?: boolean;
  escalationLevel?: 'normal' | 'urgent' | 'critical';
  relatedTeamId?: string;
  relatedQuestionId?: string;
  relatedRoundId?: string;
  contextData?: Record<string, any>;
}

export interface ReviewRequest {
  id: string;
  type: 'answer_review' | 'score_dispute' | 'technical_issue' | 'team_complaint';
  teamId: string;
  teamName: string;
  questionId?: string;
  questionText?: string;
  submittedAnswer?: string;
  expectedAnswer?: string;
  pointValue?: number;
  confidence?: 'low' | 'medium' | 'high';
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  reviewNotes?: string;
  escalationReason?: string;
}

export interface HostNotificationQueue {
  id: string;
  notifications: HostGameNotification[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  processedAt?: Date;
  status: 'queued' | 'processing' | 'completed' | 'failed';
}

export interface HostAlertConfig {
  enableAnswerReviewAlerts: boolean;
  enableScoreDisputeAlerts: boolean;
  enableTechnicalIssueAlerts: boolean;
  enableTeamActivityAlerts: boolean;
  enableGameProgressAlerts: boolean;
  enableConnectionAlerts: boolean;
  enablePerformanceAlerts: boolean;
  autoApproveThreshold?: number; // Auto-approve answers with confidence >= threshold
  escalationTimeout: number; // Minutes before escalating unreviewed items
  soundAlerts: boolean;
  visualAlerts: boolean;
  emailAlerts: boolean;
  slackAlerts: boolean;
}

export interface GameControlAlert {
  id: string;
  type: 'phase_transition_required' | 'timer_adjustment_needed' | 'manual_intervention_required';
  title: string;
  message: string;
  suggestedAction: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  gamePhase: string;
  contextData: Record<string, any>;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface PerformanceAlert {
  id: string;
  type: 'high_latency' | 'connection_issues' | 'server_overload' | 'database_slow';
  metric: string;
  value: number;
  threshold: number;
  impact: 'minimal' | 'moderate' | 'significant' | 'severe';
  gameId: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

// Default host alert configuration
const DEFAULT_HOST_ALERT_CONFIG: HostAlertConfig = {
  enableAnswerReviewAlerts: true,
  enableScoreDisputeAlerts: true,
  enableTechnicalIssueAlerts: true,
  enableTeamActivityAlerts: true,
  enableGameProgressAlerts: true,
  enableConnectionAlerts: true,
  enablePerformanceAlerts: true,
  autoApproveThreshold: 0.9, // Auto-approve high confidence answers
  escalationTimeout: 5, // 5 minutes
  soundAlerts: true,
  visualAlerts: true,
  emailAlerts: false,
  slackAlerts: false,
};

/**
 * Host Notification Service
 * Provides specialized notification management for game hosts with enhanced features
 * for reviewing answers, managing disputes, and monitoring game health
 */
export class HostNotificationService {
  private gameId: string;
  private hostId: string;
  private config: HostAlertConfig;
  private reviewQueue: ReviewRequest[] = [];
  private notificationQueue: HostNotificationQueue[] = [];
  private gameControlAlerts: GameControlAlert[] = [];
  private performanceAlerts: PerformanceAlert[] = [];
  private subscribers: Map<string, (notification: HostGameNotification) => void> = new Map();
  private reviewSubscribers: Map<string, (request: ReviewRequest) => void> = new Map();
  private alertSubscribers: Map<string, (alert: GameControlAlert) => void> = new Map();

  constructor(gameId: string, hostId: string, config: Partial<HostAlertConfig> = {}) {
    this.gameId = gameId;
    this.hostId = hostId;
    this.config = { ...DEFAULT_HOST_ALERT_CONFIG, ...config };
    
    this.initializeEscalationTimer();
  }

  // Subscription management
  subscribe(callback: (notification: HostGameNotification) => void): string {
    const id = uuidv4();
    this.subscribers.set(id, callback);
    return id;
  }

  subscribeToReviews(callback: (request: ReviewRequest) => void): string {
    const id = uuidv4();
    this.reviewSubscribers.set(id, callback);
    return id;
  }

  subscribeToAlerts(callback: (alert: GameControlAlert) => void): string {
    const id = uuidv4();
    this.alertSubscribers.set(id, callback);
    return id;
  }

  unsubscribe(subscriptionId: string): void {
    this.subscribers.delete(subscriptionId);
    this.reviewSubscribers.delete(subscriptionId);
    this.alertSubscribers.delete(subscriptionId);
  }

  // Answer review management
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
    const reviewRequest: ReviewRequest = {
      id: uuidv4(),
      type: 'answer_review',
      teamId,
      teamName,
      questionId,
      questionText,
      submittedAnswer,
      expectedAnswer,
      pointValue,
      confidence,
      description: `Review answer "${submittedAnswer}" for question "${questionText}"`,
      priority: this.calculateReviewPriority(confidence, pointValue),
      submittedAt: new Date(),
      status: 'pending',
    };

    // Check for auto-approval
    if (this.shouldAutoApprove(confidence, submittedAnswer, expectedAnswer)) {
      reviewRequest.status = 'approved';
      reviewRequest.reviewedAt = new Date();
      reviewRequest.reviewedBy = 'auto-approval';
      reviewRequest.reviewNotes = 'Automatically approved based on high confidence and answer similarity';
    } else {
      this.reviewQueue.push(reviewRequest);
      
      // Notify subscribers
      this.reviewSubscribers.forEach(callback => callback(reviewRequest));
      
      // Create host notification
      if (this.config.enableAnswerReviewAlerts) {
        await this.createHostNotification({
          type: 'answer_submitted',
          title: 'Answer Review Required',
          message: `${teamName} submitted an answer that needs review`,
          priority: reviewRequest.priority,
          reviewRequired: true,
          relatedTeamId: teamId,
          relatedQuestionId: questionId,
          contextData: {
            submittedAnswer,
            expectedAnswer,
            confidence,
            pointValue,
          },
        });
      }
    }

    return reviewRequest;
  }

  async reviewAnswer(
    reviewId: string,
    decision: 'approved' | 'rejected',
    reviewNotes?: string,
    pointOverride?: number
  ): Promise<ReviewRequest | null> {
    const reviewIndex = this.reviewQueue.findIndex(r => r.id === reviewId);
    if (reviewIndex === -1) return null;

    const review = this.reviewQueue[reviewIndex];
    review.status = decision;
    review.reviewedAt = new Date();
    review.reviewedBy = this.hostId;
    review.reviewNotes = reviewNotes;

    if (pointOverride !== undefined) {
      review.pointValue = pointOverride;
    }

    // Remove from queue
    this.reviewQueue.splice(reviewIndex, 1);

    // Notify team and update scores
    await this.notifyTeamOfReviewDecision(review, decision);

    return review;
  }

  // Score dispute management
  async handleScoreDispute(
    teamId: string,
    teamName: string,
    questionId: string,
    currentScore: number,
    requestedScore: number,
    reason: string
  ): Promise<ReviewRequest> {
    const disputeRequest: ReviewRequest = {
      id: uuidv4(),
      type: 'score_dispute',
      teamId,
      teamName,
      questionId,
      description: reason,
      priority: 'high',
      submittedAt: new Date(),
      status: 'pending',
      contextData: {
        currentScore,
        requestedScore,
        reason,
      },
    };

    this.reviewQueue.push(disputeRequest);
    
    if (this.config.enableScoreDisputeAlerts) {
      await this.createHostNotification({
        type: 'answer_submitted', // Using existing type for now
        title: 'Score Dispute',
        message: `${teamName} is disputing their score for a question`,
        priority: 'high',
        reviewRequired: true,
        relatedTeamId: teamId,
        relatedQuestionId: questionId,
        contextData: disputeRequest.contextData,
      });
    }

    this.reviewSubscribers.forEach(callback => callback(disputeRequest));
    return disputeRequest;
  }

  // Technical issue reporting
  async reportTechnicalIssue(
    teamId: string,
    teamName: string,
    issueType: 'connection' | 'ui_bug' | 'submission_failed' | 'other',
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<ReviewRequest> {
    const issueRequest: ReviewRequest = {
      id: uuidv4(),
      type: 'technical_issue',
      teamId,
      teamName,
      description,
      priority: severity,
      submittedAt: new Date(),
      status: 'pending',
      contextData: {
        issueType,
        severity,
      },
    };

    this.reviewQueue.push(issueRequest);
    
    if (this.config.enableTechnicalIssueAlerts) {
      await this.createHostNotification({
        type: 'error_occurred',
        title: 'Technical Issue Reported',
        message: `${teamName} reported a ${issueType} issue`,
        priority: severity,
        reviewRequired: true,
        relatedTeamId: teamId,
        contextData: issueRequest.contextData,
      });
    }

    this.reviewSubscribers.forEach(callback => callback(issueRequest));
    return issueRequest;
  }

  // Game control alerts
  async createGameControlAlert(
    type: 'phase_transition_required' | 'timer_adjustment_needed' | 'manual_intervention_required',
    title: string,
    message: string,
    suggestedAction: string,
    urgency: 'low' | 'medium' | 'high' | 'critical',
    gamePhase: string,
    contextData: Record<string, any> = {}
  ): Promise<GameControlAlert> {
    const alert: GameControlAlert = {
      id: uuidv4(),
      type,
      title,
      message,
      suggestedAction,
      urgency,
      gamePhase,
      contextData,
      createdAt: new Date(),
    };

    this.gameControlAlerts.push(alert);
    this.alertSubscribers.forEach(callback => callback(alert));

    // Create corresponding notification
    await this.createHostNotification({
      type: 'error_occurred',
      title,
      message,
      priority: urgency,
      reviewRequired: true,
      contextData: {
        alertType: type,
        suggestedAction,
        gamePhase,
        ...contextData,
      },
    });

    return alert;
  }

  // Performance monitoring
  async reportPerformanceIssue(
    type: 'high_latency' | 'connection_issues' | 'server_overload' | 'database_slow',
    metric: string,
    value: number,
    threshold: number,
    impact: 'minimal' | 'moderate' | 'significant' | 'severe'
  ): Promise<PerformanceAlert> {
    const alert: PerformanceAlert = {
      id: uuidv4(),
      type,
      metric,
      value,
      threshold,
      impact,
      gameId: this.gameId,
      timestamp: new Date(),
      resolved: false,
    };

    this.performanceAlerts.push(alert);

    if (this.config.enablePerformanceAlerts && impact !== 'minimal') {
      await this.createHostNotification({
        type: 'error_occurred',
        title: 'Performance Issue Detected',
        message: `${metric} is ${value} (threshold: ${threshold})`,
        priority: impact === 'severe' ? 'critical' : impact === 'significant' ? 'high' : 'medium',
        contextData: {
          type,
          metric,
          value,
          threshold,
          impact,
        },
      });
    }

    return alert;
  }

  // Utility methods
  private async createHostNotification(
    data: Omit<HostGameNotification, 'id' | 'timestamp' | 'hostOnly' | 'gameId'>
  ): Promise<HostGameNotification> {
    const notification: HostGameNotification = {
      ...data,
      id: uuidv4(),
      timestamp: new Date(),
      hostOnly: true,
      gameId: this.gameId,
      sound: this.config.soundAlerts,
      autoClose: data.priority !== 'critical',
      duration: this.getNotificationDuration(data.priority),
    };

    // Notify all subscribers
    this.subscribers.forEach(callback => callback(notification));

    return notification;
  }

  private shouldAutoApprove(
    confidence: 'low' | 'medium' | 'high',
    submittedAnswer: string,
    expectedAnswer: string
  ): boolean {
    if (!this.config.autoApproveThreshold) return false;

    const confidenceScore = confidence === 'high' ? 0.9 : confidence === 'medium' ? 0.7 : 0.5;
    
    // Simple similarity check (in production, use more sophisticated matching)
    const similarity = this.calculateAnswerSimilarity(submittedAnswer, expectedAnswer);
    
    return confidenceScore >= this.config.autoApproveThreshold && similarity > 0.8;
  }

  private calculateAnswerSimilarity(answer1: string, answer2: string): number {
    const clean1 = answer1.toLowerCase().trim();
    const clean2 = answer2.toLowerCase().trim();
    
    if (clean1 === clean2) return 1.0;
    
    // Simple Levenshtein distance approximation
    const maxLength = Math.max(clean1.length, clean2.length);
    if (maxLength === 0) return 1.0;
    
    let matches = 0;
    for (let i = 0; i < Math.min(clean1.length, clean2.length); i++) {
      if (clean1[i] === clean2[i]) matches++;
    }
    
    return matches / maxLength;
  }

  private calculateReviewPriority(
    confidence: 'low' | 'medium' | 'high',
    pointValue: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (pointValue >= 5 && confidence === 'low') return 'high';
    if (pointValue >= 3) return 'medium';
    return 'low';
  }

  private getNotificationDuration(priority: string): number {
    switch (priority) {
      case 'critical': return 0; // No auto-close
      case 'high': return 10000; // 10 seconds
      case 'medium': return 7000; // 7 seconds
      case 'low': return 5000; // 5 seconds
      default: return 5000;
    }
  }

  private async notifyTeamOfReviewDecision(
    review: ReviewRequest,
    decision: 'approved' | 'rejected'
  ): Promise<void> {
    // This would typically send a notification back to the team
    // For now, we'll just log it
    console.log(`Review decision for team ${review.teamName}: ${decision}`, review);
  }

  private initializeEscalationTimer(): void {
    // Check for items that need escalation every minute
    setInterval(() => {
      const now = new Date();
      const escalationThreshold = this.config.escalationTimeout * 60 * 1000; // Convert to milliseconds

      this.reviewQueue.forEach(async (review) => {
        if (review.status === 'pending' && 
            now.getTime() - review.submittedAt.getTime() > escalationThreshold) {
          
          review.status = 'escalated';
          review.escalationReason = `No review after ${this.config.escalationTimeout} minutes`;
          
          await this.createHostNotification({
            type: 'error_occurred',
            title: 'Review Escalated',
            message: `Review for ${review.teamName} has been escalated due to timeout`,
            priority: 'critical',
            reviewRequired: true,
            relatedTeamId: review.teamId,
            relatedQuestionId: review.questionId,
          });
        }
      });
    }, 60000); // Check every minute
  }

  // Getters for current state
  getPendingReviews(): ReviewRequest[] {
    return this.reviewQueue.filter(r => r.status === 'pending');
  }

  getEscalatedReviews(): ReviewRequest[] {
    return this.reviewQueue.filter(r => r.status === 'escalated');
  }

  getActiveGameControlAlerts(): GameControlAlert[] {
    return this.gameControlAlerts.filter(a => !a.resolvedAt);
  }

  getUnresolvedPerformanceAlerts(): PerformanceAlert[] {
    return this.performanceAlerts.filter(a => !a.resolved);
  }

  getReviewQueueLength(): number {
    return this.getPendingReviews().length;
  }

  getConfig(): HostAlertConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<HostAlertConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Cleanup
  dispose(): void {
    this.subscribers.clear();
    this.reviewSubscribers.clear();
    this.alertSubscribers.clear();
    this.reviewQueue = [];
    this.notificationQueue = [];
    this.gameControlAlerts = [];
    this.performanceAlerts = [];
  }
}

// Factory function for creating host notification service
export function createHostNotificationService(
  gameId: string,
  hostId: string,
  config?: Partial<HostAlertConfig>
): HostNotificationService {
  return new HostNotificationService(gameId, hostId, config);
}

// Utility functions
export function isHostNotification(notification: GameNotification): notification is HostGameNotification {
  return 'hostOnly' in notification && notification.hostOnly === true;
}

export function getReviewPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'text-red-600 bg-red-50';
    case 'high': return 'text-orange-600 bg-orange-50';
    case 'medium': return 'text-yellow-600 bg-yellow-50';
    case 'low': return 'text-blue-600 bg-blue-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

export function formatReviewTimeRemaining(submittedAt: Date, escalationTimeout: number): string {
  const now = new Date();
  const elapsed = now.getTime() - submittedAt.getTime();
  const remaining = (escalationTimeout * 60 * 1000) - elapsed;
  
  if (remaining <= 0) return 'Escalated';
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
} 
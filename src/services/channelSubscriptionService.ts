import type { RealtimePostgresChangesPayload } from './supabase';
import { RealtimeChannelManager } from './realtimeChannelManager';
import type { GameEvent } from '../hooks/useBroadcast';
import type { RealtimeChannel } from './supabase';

// Context-specific subscription types
export interface RoomSubscriptionOptions {
  roomId: string;
  userId?: string;
  onGameStateUpdate?: (payload: any) => void;
  onTeamUpdate?: (payload: any) => void;
  onQuestionUpdate?: (payload: any) => void;
  onTimerUpdate?: (payload: any) => void;
  onLeaderboardUpdate?: (payload: any) => void;
}

export interface TeamSubscriptionOptions {
  teamId: string;
  roomId: string;
  userId?: string;
  onAnswerSubmitted?: (payload: any) => void;
  onAnswerReviewed?: (payload: any) => void;
  onMemberUpdate?: (payload: any) => void;
  onTeamStatusUpdate?: (payload: any) => void;
}

export interface HostSubscriptionOptions {
  roomId: string;
  hostId: string;
  onAnswerPendingReview?: (payload: any) => void;
  onGameControlRequest?: (payload: any) => void;
  onAdminNotification?: (payload: any) => void;
  onEmergencyAlert?: (payload: any) => void;
}

export interface SubscriptionGroup {
  id: string;
  context: 'room' | 'team' | 'host';
  subscriptions: Map<string, RealtimeChannel>;
  isActive: boolean;
  createdAt: Date;
  lastActivity: Date;
}

// Notification queue for offline hosts
export interface QueuedNotification {
  id: string;
  type: 'answer_review' | 'game_control' | 'admin' | 'emergency';
  payload: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  roomId: string;
  hostId: string;
}

class ChannelSubscriptionService {
  private static instance: ChannelSubscriptionService;
  private channelManager: RealtimeChannelManager;
  private subscriptionGroups = new Map<string, SubscriptionGroup>();
  private notificationQueue = new Map<string, QueuedNotification[]>();
  private isInitialized = false;

  constructor() {
    this.channelManager = new RealtimeChannelManager();
  }

  public static getInstance(): ChannelSubscriptionService {
    if (!ChannelSubscriptionService.instance) {
      ChannelSubscriptionService.instance = new ChannelSubscriptionService();
    }
    return ChannelSubscriptionService.instance;
  }

  /**
   * Initialize the subscription service
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.channelManager.initialize();
    this.isInitialized = true;

    console.log('ChannelSubscriptionService initialized');
  }

  /**
   * Subscribe to room-level updates
   */
  public async subscribeToRoom(options: RoomSubscriptionOptions): Promise<string> {
    const groupId = `room-${options.roomId}`;
    
    if (this.subscriptionGroups.has(groupId)) {
      console.warn(`Already subscribed to room ${options.roomId}`);
      return groupId;
    }

    const subscriptions = new Map<string, RealtimeChannel>();

    try {
      // Game state updates
      if (options.onGameStateUpdate) {
        const gameStateChannel = await this.channelManager.subscribeToTable({
          tableName: 'game_rooms',
          filter: `id=eq.${options.roomId}`,
          onUpdate: options.onGameStateUpdate,
          onInsert: options.onGameStateUpdate,
        });
        subscriptions.set('game_state', gameStateChannel);
      }

      // Team updates
      if (options.onTeamUpdate) {
        const teamChannel = await this.channelManager.subscribeToTable({
          tableName: 'teams',
          filter: `room_id=eq.${options.roomId}`,
          onUpdate: options.onTeamUpdate,
          onInsert: options.onTeamUpdate,
          onDelete: options.onTeamUpdate,
        });
        subscriptions.set('teams', teamChannel);
      }

      // Question updates
      if (options.onQuestionUpdate) {
        const questionChannel = await this.channelManager.subscribeToBroadcast({
          channelName: `room-questions:${options.roomId}`,
          eventHandlers: {
            question_started: options.onQuestionUpdate,
            question_ended: options.onQuestionUpdate,
            question_updated: options.onQuestionUpdate,
          },
        });
        subscriptions.set('questions', questionChannel);
      }

      // Timer updates
      if (options.onTimerUpdate) {
        const timerChannel = await this.channelManager.subscribeToBroadcast({
          channelName: `room-timer:${options.roomId}`,
          eventHandlers: {
            timer_started: options.onTimerUpdate,
            timer_paused: options.onTimerUpdate,
            timer_resumed: options.onTimerUpdate,
            timer_ended: options.onTimerUpdate,
            timer_tick: options.onTimerUpdate,
          },
        });
        subscriptions.set('timer', timerChannel);
      }

      // Leaderboard updates
      if (options.onLeaderboardUpdate) {
        const leaderboardChannel = await this.channelManager.subscribeToBroadcast({
          channelName: `room-leaderboard:${options.roomId}`,
          eventHandlers: {
            scores_updated: options.onLeaderboardUpdate,
            leaderboard_changed: options.onLeaderboardUpdate,
          },
        });
        subscriptions.set('leaderboard', leaderboardChannel);
      }

      // Create subscription group
      const group: SubscriptionGroup = {
        id: groupId,
        context: 'room',
        subscriptions,
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      this.subscriptionGroups.set(groupId, group);
      console.log(`Subscribed to room ${options.roomId} with ${subscriptions.size} channels`);

      return groupId;
    } catch (error) {
      // Cleanup on error
      for (const channel of subscriptions.values()) {
        await this.channelManager.unsubscribeChannel(channel);
      }
      throw new Error(`Failed to subscribe to room ${options.roomId}: ${error}`);
    }
  }

  /**
   * Subscribe to team-level updates
   */
  public async subscribeToTeam(options: TeamSubscriptionOptions): Promise<string> {
    const groupId = `team-${options.teamId}`;
    
    if (this.subscriptionGroups.has(groupId)) {
      console.warn(`Already subscribed to team ${options.teamId}`);
      return groupId;
    }

    const subscriptions = new Map<string, RealtimeChannel>();

    try {
      // Answer submissions
      if (options.onAnswerSubmitted) {
        const answersChannel = await this.channelManager.subscribeToTable({
          tableName: 'team_answers',
          filter: `team_id=eq.${options.teamId}`,
          onInsert: options.onAnswerSubmitted,
          onUpdate: options.onAnswerSubmitted,
        });
        subscriptions.set('answers', answersChannel);
      }

      // Answer reviews
      if (options.onAnswerReviewed) {
        const reviewChannel = await this.channelManager.subscribeToBroadcast({
          channelName: `team-reviews:${options.teamId}`,
          eventHandlers: {
            answer_reviewed: options.onAnswerReviewed,
            score_awarded: options.onAnswerReviewed,
          },
        });
        subscriptions.set('reviews', reviewChannel);
      }

      // Team member updates
      if (options.onMemberUpdate) {
        const membersChannel = await this.channelManager.subscribeToTable({
          tableName: 'team_members',
          filter: `team_id=eq.${options.teamId}`,
          onInsert: options.onMemberUpdate,
          onUpdate: options.onMemberUpdate,
          onDelete: options.onMemberUpdate,
        });
        subscriptions.set('members', membersChannel);
      }

      // Team status updates
      if (options.onTeamStatusUpdate) {
        const statusChannel = await this.channelManager.subscribeToBroadcast({
          channelName: `team-status:${options.teamId}`,
          eventHandlers: {
            team_ready: options.onTeamStatusUpdate,
            team_not_ready: options.onTeamStatusUpdate,
            captain_changed: options.onTeamStatusUpdate,
          },
        });
        subscriptions.set('status', statusChannel);
      }

      // Create subscription group
      const group: SubscriptionGroup = {
        id: groupId,
        context: 'team',
        subscriptions,
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      this.subscriptionGroups.set(groupId, group);
      console.log(`Subscribed to team ${options.teamId} with ${subscriptions.size} channels`);

      return groupId;
    } catch (error) {
      // Cleanup on error
      for (const channel of subscriptions.values()) {
        await this.channelManager.unsubscribeChannel(channel);
      }
      throw new Error(`Failed to subscribe to team ${options.teamId}: ${error}`);
    }
  }

  /**
   * Subscribe to host-only notifications
   */
  public async subscribeToHostNotifications(options: HostSubscriptionOptions): Promise<string> {
    const groupId = `host-${options.roomId}`;
    
    if (this.subscriptionGroups.has(groupId)) {
      console.warn(`Already subscribed to host notifications for room ${options.roomId}`);
      return groupId;
    }

    const subscriptions = new Map<string, RealtimeChannel>();

    try {
      // Answer review notifications
      if (options.onAnswerPendingReview) {
        const reviewNotificationsChannel = await this.channelManager.subscribeToBroadcast({
          channelName: `host-reviews:${options.roomId}`,
          eventHandlers: {
            answer_pending_review: (payload) => {
              this.handleHostNotification('answer_review', payload, options.roomId, options.hostId);
              options.onAnswerPendingReview?.(payload);
            },
          },
        });
        subscriptions.set('review_notifications', reviewNotificationsChannel);
      }

      // Game control requests
      if (options.onGameControlRequest) {
        const gameControlChannel = await this.channelManager.subscribeToBroadcast({
          channelName: `host-control:${options.roomId}`,
          eventHandlers: {
            pause_request: options.onGameControlRequest,
            resume_request: options.onGameControlRequest,
            skip_question: options.onGameControlRequest,
            end_game_request: options.onGameControlRequest,
          },
        });
        subscriptions.set('game_control', gameControlChannel);
      }

      // Administrative notifications
      if (options.onAdminNotification) {
        const adminChannel = await this.channelManager.subscribeToBroadcast({
          channelName: `host-admin:${options.roomId}`,
          eventHandlers: {
            team_dispute: (payload) => {
              this.handleHostNotification('admin', payload, options.roomId, options.hostId);
              options.onAdminNotification?.(payload);
            },
            technical_issue: (payload) => {
              this.handleHostNotification('admin', payload, options.roomId, options.hostId);
              options.onAdminNotification?.(payload);
            },
          },
        });
        subscriptions.set('admin', adminChannel);
      }

      // Emergency alerts
      if (options.onEmergencyAlert) {
        const emergencyChannel = await this.channelManager.subscribeToBroadcast({
          channelName: `host-emergency:${options.roomId}`,
          eventHandlers: {
            emergency_stop: (payload) => {
              this.handleHostNotification('emergency', payload, options.roomId, options.hostId, 'urgent');
              options.onEmergencyAlert?.(payload);
            },
            system_error: (payload) => {
              this.handleHostNotification('emergency', payload, options.roomId, options.hostId, 'high');
              options.onEmergencyAlert?.(payload);
            },
          },
        });
        subscriptions.set('emergency', emergencyChannel);
      }

      // Create subscription group
      const group: SubscriptionGroup = {
        id: groupId,
        context: 'host',
        subscriptions,
        isActive: true,
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      this.subscriptionGroups.set(groupId, group);
      console.log(`Subscribed to host notifications for room ${options.roomId} with ${subscriptions.size} channels`);

      // Process any queued notifications for this host
      await this.processQueuedNotifications(options.hostId);

      return groupId;
    } catch (error) {
      // Cleanup on error
      for (const channel of subscriptions.values()) {
        await this.channelManager.unsubscribeChannel(channel);
      }
      throw new Error(`Failed to subscribe to host notifications for room ${options.roomId}: ${error}`);
    }
  }

  /**
   * Handle host notifications with queuing for offline hosts
   */
  private handleHostNotification(
    type: QueuedNotification['type'],
    payload: any,
    roomId: string,
    hostId: string,
    priority: QueuedNotification['priority'] = 'medium'
  ): void {
    const notification: QueuedNotification = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      payload,
      timestamp: new Date(),
      priority,
      roomId,
      hostId,
    };

    // Check if host is currently connected
    const hostGroupId = `host-${roomId}`;
    const hostGroup = this.subscriptionGroups.get(hostGroupId);
    
    if (!hostGroup || !hostGroup.isActive) {
      // Queue notification for later delivery
      if (!this.notificationQueue.has(hostId)) {
        this.notificationQueue.set(hostId, []);
      }
      
      const queue = this.notificationQueue.get(hostId)!;
      queue.push(notification);
      
      // Keep only the most recent 100 notifications per host
      if (queue.length > 100) {
        queue.splice(0, queue.length - 100);
      }
      
      console.log(`Queued ${type} notification for offline host ${hostId}`);
    }
  }

  /**
   * Process queued notifications when a host reconnects
   */
  private async processQueuedNotifications(hostId: string): Promise<void> {
    const queue = this.notificationQueue.get(hostId);
    if (!queue || queue.length === 0) return;

    console.log(`Processing ${queue.length} queued notifications for host ${hostId}`);

    // Sort by priority and timestamp
    const sortedNotifications = queue.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp.getTime() - b.timestamp.getTime();
    });

    // Process notifications (in a real implementation, you might want to 
    // batch these or provide a summary for large numbers of notifications)
    for (const notification of sortedNotifications) {
      console.log(`Processing queued ${notification.type} notification:`, notification);
      // Here you would trigger the appropriate callback or send a summary notification
    }

    // Clear the queue
    this.notificationQueue.delete(hostId);
  }

  /**
   * Unsubscribe from a subscription group
   */
  public async unsubscribe(groupId: string): Promise<void> {
    const group = this.subscriptionGroups.get(groupId);
    if (!group) {
      console.warn(`Subscription group ${groupId} not found`);
      return;
    }

    try {
      // Unsubscribe from all channels in the group
      for (const channel of group.subscriptions.values()) {
        await this.channelManager.unsubscribeChannel(channel);
      }

      // Mark group as inactive and remove
      group.isActive = false;
      this.subscriptionGroups.delete(groupId);

      console.log(`Unsubscribed from group ${groupId} with ${group.subscriptions.size} channels`);
    } catch (error) {
      console.error(`Error unsubscribing from group ${groupId}:`, error);
      throw error;
    }
  }

  /**
   * Get active subscription groups
   */
  public getActiveSubscriptions(): SubscriptionGroup[] {
    return Array.from(this.subscriptionGroups.values()).filter(group => group.isActive);
  }

  /**
   * Get subscription group by ID
   */
  public getSubscriptionGroup(groupId: string): SubscriptionGroup | undefined {
    return this.subscriptionGroups.get(groupId);
  }

  /**
   * Get channel manager metrics
   */
  public getMetrics() {
    return this.channelManager.getMetrics();
  }

  /**
   * Cleanup all subscriptions
   */
  public async cleanup(): Promise<void> {
    const activeGroups = Array.from(this.subscriptionGroups.keys());
    
    for (const groupId of activeGroups) {
      await this.unsubscribe(groupId);
    }

    this.subscriptionGroups.clear();
    this.notificationQueue.clear();
    
    await this.channelManager.dispose();
    this.isInitialized = false;

    console.log('ChannelSubscriptionService cleaned up');
  }
}

// Export singleton instance
export const channelSubscriptionService = ChannelSubscriptionService.getInstance();
export default channelSubscriptionService; 
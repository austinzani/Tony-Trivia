import { supabase } from '../lib/supabase';
import type { ScheduledGame, ScheduledGameParticipant } from '../types/database';

export interface GameNotification {
  id: string;
  type: 'game_reminder' | 'game_invitation' | 'game_cancelled' | 'game_starting' | 'rsvp_update';
  gameId: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export class ScheduledGameNotificationService {
  private static notificationHandlers: Map<string, (notification: GameNotification) => void> = new Map();

  /**
   * Subscribe to notifications for a user
   */
  static subscribeToNotifications(userId: string, handler: (notification: GameNotification) => void) {
    this.notificationHandlers.set(userId, handler);

    // Subscribe to realtime notifications
    const channel = supabase
      .channel(`game-notifications:${userId}`)
      .on('broadcast', { event: 'notification' }, ({ payload }) => {
        if (payload.userId === userId) {
          handler(payload as GameNotification);
        }
      })
      .subscribe();

    return () => {
      this.notificationHandlers.delete(userId);
      channel.unsubscribe();
    };
  }

  /**
   * Send game invitation notifications
   */
  static async sendGameInvitations(
    game: ScheduledGame,
    participants: string[]
  ): Promise<void> {
    const notifications = participants.map(userId => ({
      type: 'game_invitation' as const,
      gameId: game.id,
      userId,
      title: 'Game Invitation',
      message: `You've been invited to "${game.title}" on ${new Date(game.scheduled_for).toLocaleDateString()}`,
      read: false,
      createdAt: new Date().toISOString()
    }));

    // Broadcast notifications
    for (const notification of notifications) {
      await supabase.channel('game-notifications').send({
        type: 'broadcast',
        event: 'notification',
        payload: notification
      });
    }

    // Store notifications in database (if you have a notifications table)
    // await supabase.from('notifications').insert(notifications);
  }

  /**
   * Send game reminder notifications
   */
  static async sendGameReminders(
    game: ScheduledGame,
    participants: ScheduledGameParticipant[],
    minutesBefore: number
  ): Promise<void> {
    const acceptedParticipants = participants.filter(p => p.rsvp_status === 'accepted');
    
    const notifications = acceptedParticipants.map(participant => ({
      type: 'game_reminder' as const,
      gameId: game.id,
      userId: participant.user_id,
      title: 'Game Starting Soon',
      message: `"${game.title}" starts in ${minutesBefore} minutes!`,
      read: false,
      createdAt: new Date().toISOString()
    }));

    // Broadcast notifications
    for (const notification of notifications) {
      await supabase.channel('game-notifications').send({
        type: 'broadcast',
        event: 'notification',
        payload: notification
      });
    }

    // Update reminder sent status
    await supabase
      .from('scheduled_game_reminders')
      .update({ sent_at: new Date().toISOString() })
      .eq('scheduled_game_id', game.id)
      .eq('time_before_minutes', minutesBefore);
  }

  /**
   * Send game cancelled notification
   */
  static async sendGameCancelledNotification(
    game: ScheduledGame,
    participants: ScheduledGameParticipant[]
  ): Promise<void> {
    const notifications = participants
      .filter(p => p.rsvp_status !== 'declined')
      .map(participant => ({
        type: 'game_cancelled' as const,
        gameId: game.id,
        userId: participant.user_id,
        title: 'Game Cancelled',
        message: `"${game.title}" scheduled for ${new Date(game.scheduled_for).toLocaleDateString()} has been cancelled`,
        read: false,
        createdAt: new Date().toISOString()
      }));

    // Broadcast notifications
    for (const notification of notifications) {
      await supabase.channel('game-notifications').send({
        type: 'broadcast',
        event: 'notification',
        payload: notification
      });
    }
  }

  /**
   * Send game starting notification
   */
  static async sendGameStartingNotification(
    game: ScheduledGame,
    participants: ScheduledGameParticipant[]
  ): Promise<void> {
    const acceptedParticipants = participants.filter(p => p.rsvp_status === 'accepted');
    
    const notifications = acceptedParticipants.map(participant => ({
      type: 'game_starting' as const,
      gameId: game.id,
      userId: participant.user_id,
      title: 'Game Starting Now!',
      message: `"${game.title}" is starting now! Click to join.`,
      read: false,
      createdAt: new Date().toISOString()
    }));

    // Broadcast notifications
    for (const notification of notifications) {
      await supabase.channel('game-notifications').send({
        type: 'broadcast',
        event: 'notification',
        payload: notification
      });
    }
  }

  /**
   * Send RSVP update notification to host
   */
  static async sendRsvpUpdateNotification(
    game: ScheduledGame,
    participant: ScheduledGameParticipant,
    userName: string
  ): Promise<void> {
    const statusText = participant.rsvp_status === 'accepted' ? 'will attend' :
                      participant.rsvp_status === 'declined' ? 'cannot attend' :
                      'might attend';

    const notification = {
      type: 'rsvp_update' as const,
      gameId: game.id,
      userId: game.host_id,
      title: 'RSVP Update',
      message: `${userName} ${statusText} "${game.title}"`,
      read: false,
      createdAt: new Date().toISOString()
    };

    // Broadcast notification
    await supabase.channel('game-notifications').send({
      type: 'broadcast',
      event: 'notification',
      payload: notification
    });
  }

  /**
   * Check and send pending reminders
   */
  static async checkAndSendReminders(): Promise<void> {
    const now = new Date();
    
    // Get scheduled games with pending reminders
    const { data: games, error } = await supabase
      .from('scheduled_games')
      .select(`
        *,
        scheduled_game_reminders!inner(
          id,
          time_before_minutes,
          sent_at
        ),
        scheduled_game_participants(*)
      `)
      .eq('status', 'scheduled')
      .is('scheduled_game_reminders.sent_at', null)
      .gte('scheduled_for', now.toISOString());

    if (error || !games) return;

    // Check each game for reminders that should be sent
    for (const game of games) {
      const gameTime = new Date(game.scheduled_for);
      const minutesUntilGame = Math.floor((gameTime.getTime() - now.getTime()) / (1000 * 60));

      for (const reminder of game.scheduled_game_reminders) {
        if (minutesUntilGame <= reminder.time_before_minutes && !reminder.sent_at) {
          await this.sendGameReminders(
            game,
            game.scheduled_game_participants,
            reminder.time_before_minutes
          );
        }
      }
    }
  }

  /**
   * Format notification for display
   */
  static formatNotification(notification: GameNotification): {
    icon: string;
    color: string;
    timeAgo: string;
  } {
    const icons = {
      game_reminder: '⏰',
      game_invitation: '✉️',
      game_cancelled: '❌',
      game_starting: '🎮',
      rsvp_update: '👥'
    };

    const colors = {
      game_reminder: 'text-energy-yellow',
      game_invitation: 'text-electric-600',
      game_cancelled: 'text-energy-red',
      game_starting: 'text-energy-green',
      rsvp_update: 'text-plasma-600'
    };

    // Calculate time ago
    const createdAt = new Date(notification.createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let timeAgo: string;
    if (diffMins < 1) {
      timeAgo = 'just now';
    } else if (diffMins < 60) {
      timeAgo = `${diffMins}m ago`;
    } else if (diffHours < 24) {
      timeAgo = `${diffHours}h ago`;
    } else {
      timeAgo = `${diffDays}d ago`;
    }

    return {
      icon: icons[notification.type] || '📢',
      color: colors[notification.type] || 'text-gray-600',
      timeAgo
    };
  }
}
import { supabase } from '../lib/supabase';
import type { 
  ScheduledGame, 
  ScheduledGameParticipant, 
  ScheduledGameReminder,
  GameSettings 
} from '../types/database';

export class ScheduledGamesService {
  /**
   * Create a new scheduled game
   */
  static async createScheduledGame(data: {
    title: string;
    description?: string;
    scheduled_for: string;
    duration_minutes?: number;
    max_players?: number;
    settings?: GameSettings;
    recurring_pattern?: 'none' | 'daily' | 'weekly' | 'monthly';
    recurring_end_date?: string;
  }): Promise<ScheduledGame> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      throw new Error('User must be authenticated to create scheduled games');
    }

    const { data: scheduledGame, error } = await supabase
      .from('scheduled_games')
      .insert({
        host_id: session.session.user.id,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return scheduledGame;
  }

  /**
   * Get all scheduled games for the current user (as host or participant)
   */
  static async getUserScheduledGames(
    filter?: 'hosting' | 'participating' | 'all'
  ): Promise<ScheduledGame[]> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      throw new Error('User must be authenticated');
    }

    let query = supabase
      .from('scheduled_games')
      .select('*')
      .order('scheduled_for', { ascending: true });

    if (filter === 'hosting') {
      query = query.eq('host_id', session.session.user.id);
    } else if (filter === 'participating') {
      // Get games where user is a participant
      const { data: participations } = await supabase
        .from('scheduled_game_participants')
        .select('scheduled_game_id')
        .eq('user_id', session.session.user.id);

      if (participations) {
        const gameIds = participations.map(p => p.scheduled_game_id);
        query = query.in('id', gameIds);
      }
    } else {
      // Get all games (hosting + participating)
      const { data: participations } = await supabase
        .from('scheduled_game_participants')
        .select('scheduled_game_id')
        .eq('user_id', session.session.user.id);

      if (participations) {
        const gameIds = participations.map(p => p.scheduled_game_id);
        query = query.or(
          `host_id.eq.${session.session.user.id},id.in.(${gameIds.join(',')})`
        );
      } else {
        query = query.eq('host_id', session.session.user.id);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get a specific scheduled game by ID
   */
  static async getScheduledGame(id: string): Promise<ScheduledGame> {
    const { data, error } = await supabase
      .from('scheduled_games')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a scheduled game
   */
  static async updateScheduledGame(
    id: string, 
    updates: Partial<ScheduledGame>
  ): Promise<ScheduledGame> {
    const { data, error } = await supabase
      .from('scheduled_games')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Cancel a scheduled game
   */
  static async cancelScheduledGame(id: string): Promise<void> {
    const { error } = await supabase
      .from('scheduled_games')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Delete a scheduled game
   */
  static async deleteScheduledGame(id: string): Promise<void> {
    const { error } = await supabase
      .from('scheduled_games')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Invite participants to a scheduled game
   */
  static async inviteParticipants(
    gameId: string, 
    userIds: string[]
  ): Promise<void> {
    const participants = userIds.map(userId => ({
      scheduled_game_id: gameId,
      user_id: userId,
      rsvp_status: 'invited' as const
    }));

    const { error } = await supabase
      .from('scheduled_game_participants')
      .insert(participants);

    if (error) throw error;
  }

  /**
   * Update RSVP status for a participant
   */
  static async updateRsvpStatus(
    gameId: string,
    status: 'accepted' | 'declined' | 'tentative',
    teamPreference?: string
  ): Promise<void> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user) {
      throw new Error('User must be authenticated');
    }

    const { error } = await supabase
      .from('scheduled_game_participants')
      .update({
        rsvp_status: status,
        responded_at: new Date().toISOString(),
        team_preference: teamPreference
      })
      .eq('scheduled_game_id', gameId)
      .eq('user_id', session.session.user.id);

    if (error) throw error;
  }

  /**
   * Get participants for a scheduled game
   */
  static async getGameParticipants(
    gameId: string
  ): Promise<ScheduledGameParticipant[]> {
    const { data, error } = await supabase
      .from('scheduled_game_participants')
      .select('*')
      .eq('scheduled_game_id', gameId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Create reminders for a scheduled game
   */
  static async createGameReminders(
    gameId: string,
    reminders: Array<{
      reminder_type: 'email' | 'push' | 'in_app';
      time_before_minutes: number;
    }>
  ): Promise<void> {
    const reminderData = reminders.map(reminder => ({
      scheduled_game_id: gameId,
      ...reminder
    }));

    const { error } = await supabase
      .from('scheduled_game_reminders')
      .insert(reminderData);

    if (error) throw error;
  }

  /**
   * Get upcoming games (within the next 7 days)
   */
  static async getUpcomingGames(): Promise<ScheduledGame[]> {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('scheduled_games')
      .select('*')
      .gte('scheduled_for', now.toISOString())
      .lte('scheduled_for', nextWeek.toISOString())
      .eq('status', 'scheduled')
      .order('scheduled_for', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Check and start scheduled games that are due
   */
  static async checkAndStartScheduledGames(): Promise<void> {
    const now = new Date();
    
    // Find games that should start now (within a 5-minute window)
    const { data: gamesToStart, error } = await supabase
      .from('scheduled_games')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now.toISOString())
      .gte('scheduled_for', new Date(now.getTime() - 5 * 60 * 1000).toISOString());

    if (error) throw error;

    // Update status for games that should start
    for (const game of gamesToStart || []) {
      await this.updateScheduledGame(game.id, { status: 'in_progress' });
    }
  }

  /**
   * Get games by date range for calendar view
   */
  static async getGamesByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<ScheduledGame[]> {
    const { data, error } = await supabase
      .from('scheduled_games')
      .select('*')
      .gte('scheduled_for', startDate.toISOString())
      .lte('scheduled_for', endDate.toISOString())
      .order('scheduled_for', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}
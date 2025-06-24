import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Types for real-time updates
export interface GameRoomUpdate {
  id: string;
  status: 'lobby' | 'active' | 'paused' | 'finished';
  current_round_id?: string;
  current_question_id?: string;
  settings: Record<string, any>;
  started_at?: string;
  ended_at?: string;
  last_updated: string;
}

export interface TeamUpdate {
  id: string;
  room_id: string;
  name: string;
  score: number;
  member_count: number;
  captain_id?: string;
  last_activity?: string;
}

export interface TeamAnswerUpdate {
  id: string;
  team_id: string;
  question_id: string;
  answer_text: string;
  point_value: number;
  submitted_at: string;
  submitted_by: string;
  is_reviewed?: boolean;
  points_awarded?: number;
}

export interface GameStateUpdate {
  id: string;
  game_room_id: string;
  status: 'lobby' | 'active' | 'paused' | 'question_active' | 'reviewing' | 'finished';
  current_round_id?: string;
  current_question_id?: string;
  question_start_time?: string;
  question_end_time?: string;
  time_remaining?: number;
  metadata: Record<string, any>;
}

export interface QuestionUpdate {
  id: string;
  game_round_id: string;
  question_text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  time_limit: number;
  media_url?: string;
  is_active: boolean;
  started_at?: string;
}

export interface LeaderboardUpdate {
  game_room_id: string;
  teams: Array<{
    team_id: string;
    team_name: string;
    total_score: number;
    rank: number;
    member_count: number;
  }>;
  updated_at: string;
}

// Room-level update handlers
export class RoomLevelUpdateHandlers {
  /**
   * Handle game room status changes (lobby → active → finished)
   */
  static handleGameRoomUpdate(
    payload: RealtimePostgresChangesPayload<any>,
    callbacks: {
      onStatusChange?: (update: GameRoomUpdate) => void;
      onSettingsChange?: (update: GameRoomUpdate) => void;
      onGameStart?: (update: GameRoomUpdate) => void;
      onGameEnd?: (update: GameRoomUpdate) => void;
    }
  ) {
    if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
      const newData = payload.new as GameRoomUpdate;
      const oldData = payload.old as GameRoomUpdate;

      // Status changes
      if (newData.status !== oldData.status) {
        callbacks.onStatusChange?.(newData);

        // Specific status transitions
        if (oldData.status === 'lobby' && newData.status === 'active') {
          callbacks.onGameStart?.(newData);
        } else if (newData.status === 'finished') {
          callbacks.onGameEnd?.(newData);
        }
      }

      // Settings changes
      if (JSON.stringify(newData.settings) !== JSON.stringify(oldData.settings)) {
        callbacks.onSettingsChange?.(newData);
      }
    }
  }

  /**
   * Handle game state changes (phases, questions, timing)
   */
  static handleGameStateUpdate(
    payload: RealtimePostgresChangesPayload<any>,
    callbacks: {
      onPhaseChange?: (update: GameStateUpdate) => void;
      onQuestionChange?: (update: GameStateUpdate) => void;
      onTimerUpdate?: (update: GameStateUpdate) => void;
      onRoundChange?: (update: GameStateUpdate) => void;
    }
  ) {
    if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
      const newData = payload.new as GameStateUpdate;
      const oldData = payload.old as GameStateUpdate;

      // Phase changes
      if (newData.status !== oldData.status) {
        callbacks.onPhaseChange?.(newData);
      }

      // Question changes
      if (newData.current_question_id !== oldData.current_question_id) {
        callbacks.onQuestionChange?.(newData);
      }

      // Round changes
      if (newData.current_round_id !== oldData.current_round_id) {
        callbacks.onRoundChange?.(newData);
      }

      // Timer updates
      if (newData.time_remaining !== oldData.time_remaining) {
        callbacks.onTimerUpdate?.(newData);
      }
    }
  }

  /**
   * Handle team roster changes (teams joining/leaving)
   */
  static handleTeamRosterUpdate(
    payload: RealtimePostgresChangesPayload<any>,
    callbacks: {
      onTeamJoined?: (team: TeamUpdate) => void;
      onTeamLeft?: (team: TeamUpdate) => void;
      onTeamUpdated?: (team: TeamUpdate) => void;
      onMemberCountChange?: (team: TeamUpdate) => void;
    }
  ) {
    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new) {
          callbacks.onTeamJoined?.(payload.new as TeamUpdate);
        }
        break;

      case 'DELETE':
        if (payload.old) {
          callbacks.onTeamLeft?.(payload.old as TeamUpdate);
        }
        break;

      case 'UPDATE':
        if (payload.new && payload.old) {
          const newData = payload.new as TeamUpdate;
          const oldData = payload.old as TeamUpdate;

          callbacks.onTeamUpdated?.(newData);

          // Member count changes
          if (newData.member_count !== oldData.member_count) {
            callbacks.onMemberCountChange?.(newData);
          }
        }
        break;
    }
  }

  /**
   * Handle leaderboard updates
   */
  static async handleLeaderboardUpdate(
    gameRoomId: string,
    callbacks: {
      onLeaderboardUpdate?: (leaderboard: LeaderboardUpdate) => void;
      onScoreChange?: (leaderboard: LeaderboardUpdate) => void;
      onRankChange?: (leaderboard: LeaderboardUpdate) => void;
    }
  ) {
    try {
      // Fetch current leaderboard data
      const { data, error } = await supabase
        .rpc('get_leaderboard', { room_id: gameRoomId });

      if (error) throw error;

      const leaderboardUpdate: LeaderboardUpdate = {
        game_room_id: gameRoomId,
        teams: data || [],
        updated_at: new Date().toISOString(),
      };

      callbacks.onLeaderboardUpdate?.(leaderboardUpdate);
      callbacks.onScoreChange?.(leaderboardUpdate);
      callbacks.onRankChange?.(leaderboardUpdate);
    } catch (error) {
      console.error('Error handling leaderboard update:', error);
    }
  }
}

// Team-level update handlers
export class TeamLevelUpdateHandlers {
  /**
   * Handle team answer submissions
   */
  static handleAnswerSubmission(
    payload: RealtimePostgresChangesPayload<any>,
    callbacks: {
      onAnswerSubmitted?: (answer: TeamAnswerUpdate) => void;
      onAnswerUpdated?: (answer: TeamAnswerUpdate) => void;
      onAnswerReviewed?: (answer: TeamAnswerUpdate) => void;
      onPointsAwarded?: (answer: TeamAnswerUpdate) => void;
    }
  ) {
    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new) {
          const answerData = payload.new as TeamAnswerUpdate;
          callbacks.onAnswerSubmitted?.(answerData);
        }
        break;

      case 'UPDATE':
        if (payload.new && payload.old) {
          const newData = payload.new as TeamAnswerUpdate;
          const oldData = payload.old as TeamAnswerUpdate;

          callbacks.onAnswerUpdated?.(newData);

          // Review status changes
          if (newData.is_reviewed && !oldData.is_reviewed) {
            callbacks.onAnswerReviewed?.(newData);
          }

          // Points awarded changes
          if (newData.points_awarded !== oldData.points_awarded) {
            callbacks.onPointsAwarded?.(newData);
          }
        }
        break;
    }
  }

  /**
   * Handle team member activity
   */
  static handleMemberActivity(
    payload: RealtimePostgresChangesPayload<any>,
    callbacks: {
      onMemberJoined?: (member: any) => void;
      onMemberLeft?: (member: any) => void;
      onMemberStatusChange?: (member: any) => void;
      onCaptainChange?: (member: any) => void;
    }
  ) {
    switch (payload.eventType) {
      case 'INSERT':
        if (payload.new) {
          callbacks.onMemberJoined?.(payload.new);
        }
        break;

      case 'DELETE':
        if (payload.old) {
          callbacks.onMemberLeft?.(payload.old);
        }
        break;

      case 'UPDATE':
        if (payload.new && payload.old) {
          const newData = payload.new;
          const oldData = payload.old;

          callbacks.onMemberStatusChange?.(newData);

          // Captain changes
          if (newData.role === 'captain' && oldData.role !== 'captain') {
            callbacks.onCaptainChange?.(newData);
          }
        }
        break;
    }
  }

  /**
   * Handle team score updates
   */
  static handleTeamScoreUpdate(
    payload: RealtimePostgresChangesPayload<any>,
    callbacks: {
      onScoreUpdate?: (scoreData: any) => void;
      onRankChange?: (scoreData: any) => void;
      onBonusAwarded?: (scoreData: any) => void;
    }
  ) {
    if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
      const newData = payload.new;
      const oldData = payload.old;

      callbacks.onScoreUpdate?.(newData);

      // Rank changes
      if (newData.current_rank !== oldData.current_rank) {
        callbacks.onRankChange?.(newData);
      }

      // Bonus points
      if (newData.bonus_points && newData.bonus_points !== oldData.bonus_points) {
        callbacks.onBonusAwarded?.(newData);
      }
    }
  }

  /**
   * Handle team readiness status
   */
  static handleTeamReadiness(
    teamId: string,
    callbacks: {
      onReadinessChange?: (readiness: any) => void;
      onAllMembersReady?: (teamId: string) => void;
      onMemberNotReady?: (teamId: string) => void;
    }
  ) {
    // This would typically be called from a broadcast event or member status update
    return async (readinessData: any) => {
      callbacks.onReadinessChange?.(readinessData);

      if (readinessData.allMembersReady) {
        callbacks.onAllMembersReady?.(teamId);
      } else if (readinessData.hasUnreadyMembers) {
        callbacks.onMemberNotReady?.(teamId);
      }
    };
  }
}

// Utility functions for data transformation
export class UpdateDataTransformers {
  /**
   * Transform raw database update to GameRoomUpdate
   */
  static transformGameRoomUpdate(payload: RealtimePostgresChangesPayload<any>): GameRoomUpdate | null {
    if (!payload.new) return null;

    return {
      id: payload.new.id,
      status: payload.new.status,
      current_round_id: payload.new.current_round_id,
      current_question_id: payload.new.current_question_id,
      settings: payload.new.settings || {},
      started_at: payload.new.started_at,
      ended_at: payload.new.ended_at,
      last_updated: new Date().toISOString(),
    };
  }

  /**
   * Transform raw database update to TeamUpdate
   */
  static transformTeamUpdate(payload: RealtimePostgresChangesPayload<any>): TeamUpdate | null {
    if (!payload.new) return null;

    return {
      id: payload.new.id,
      room_id: payload.new.room_id || payload.new.game_room_id,
      name: payload.new.name,
      score: payload.new.score || 0,
      member_count: payload.new.member_count || 0,
      captain_id: payload.new.captain_id,
      last_activity: new Date().toISOString(),
    };
  }

  /**
   * Transform raw database update to TeamAnswerUpdate
   */
  static transformTeamAnswerUpdate(payload: RealtimePostgresChangesPayload<any>): TeamAnswerUpdate | null {
    if (!payload.new) return null;

    return {
      id: payload.new.id,
      team_id: payload.new.team_id,
      question_id: payload.new.question_id,
      answer_text: payload.new.answer_text || payload.new.answer,
      point_value: payload.new.point_value,
      submitted_at: payload.new.submitted_at,
      submitted_by: payload.new.submitted_by,
      is_reviewed: payload.new.is_reviewed,
      points_awarded: payload.new.points_awarded,
    };
  }

  /**
   * Transform raw database update to GameStateUpdate
   */
  static transformGameStateUpdate(payload: RealtimePostgresChangesPayload<any>): GameStateUpdate | null {
    if (!payload.new) return null;

    return {
      id: payload.new.id,
      game_room_id: payload.new.game_room_id,
      status: payload.new.status,
      current_round_id: payload.new.current_round_id,
      current_question_id: payload.new.current_question_id,
      question_start_time: payload.new.question_start_time,
      question_end_time: payload.new.question_end_time,
      time_remaining: payload.new.time_remaining,
      metadata: payload.new.metadata || {},
    };
  }

  /**
   * Calculate time remaining for a question
   */
  static calculateTimeRemaining(questionStartTime?: string, timeLimit?: number): number {
    if (!questionStartTime || !timeLimit) return 0;

    const startTime = new Date(questionStartTime).getTime();
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
    const remaining = Math.max(0, timeLimit - elapsedSeconds);

    return remaining;
  }

  /**
   * Determine if an update represents a significant change
   */
  static isSignificantChange(
    newData: any,
    oldData: any,
    significantFields: string[]
  ): boolean {
    return significantFields.some(field => {
      const newValue = newData[field];
      const oldValue = oldData[field];

      if (typeof newValue === 'object' && typeof oldValue === 'object') {
        return JSON.stringify(newValue) !== JSON.stringify(oldValue);
      }

      return newValue !== oldValue;
    });
  }
}

// Performance optimization utilities
export class UpdatePerformanceOptimizer {
  private static updateCache = new Map<string, any>();
  private static cacheTimestamps = new Map<string, number>();
  private static readonly CACHE_TTL = 1000; // 1 second

  /**
   * Debounce rapid updates to prevent excessive re-renders
   */
  static debounceUpdate<T>(
    key: string,
    data: T,
    callback: (data: T) => void,
    delay: number = 100
  ): void {
    const cacheKey = `debounce_${key}`;
    
    // Clear existing timeout
    const existingTimeout = this.updateCache.get(cacheKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      callback(data);
      this.updateCache.delete(cacheKey);
    }, delay);

    this.updateCache.set(cacheKey, timeout);
  }

  /**
   * Cache updates to prevent duplicate processing
   */
  static shouldProcessUpdate(key: string, data: any): boolean {
    const now = Date.now();
    const cacheKey = `cache_${key}`;
    const timestampKey = `timestamp_${key}`;

    const cachedData = this.updateCache.get(cacheKey);
    const timestamp = this.cacheTimestamps.get(timestampKey) || 0;

    // Check if cache is still valid
    if (now - timestamp < this.CACHE_TTL) {
      // Compare data to see if it's actually different
      if (JSON.stringify(cachedData) === JSON.stringify(data)) {
        return false; // Skip duplicate update
      }
    }

    // Update cache
    this.updateCache.set(cacheKey, data);
    this.cacheTimestamps.set(timestampKey, now);

    return true; // Process the update
  }

  /**
   * Batch multiple updates together
   */
  static batchUpdates<T>(
    updates: T[],
    callback: (batched: T[]) => void,
    maxBatchSize: number = 10,
    maxDelay: number = 50
  ): void {
    const batchKey = 'batch_updates';
    let currentBatch = this.updateCache.get(batchKey) || [];
    
    currentBatch.push(...updates);

    // Process immediately if batch is full
    if (currentBatch.length >= maxBatchSize) {
      callback(currentBatch);
      this.updateCache.delete(batchKey);
      return;
    }

    // Store batch and set timer
    this.updateCache.set(batchKey, currentBatch);

    // Clear existing timer
    const existingTimer = this.updateCache.get(`${batchKey}_timer`);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      const finalBatch = this.updateCache.get(batchKey) || [];
      if (finalBatch.length > 0) {
        callback(finalBatch);
      }
      this.updateCache.delete(batchKey);
      this.updateCache.delete(`${batchKey}_timer`);
    }, maxDelay);

    this.updateCache.set(`${batchKey}_timer`, timer);
  }

  /**
   * Clear all caches
   */
  static clearCache(): void {
    // Clear timeouts
    this.updateCache.forEach((value, key) => {
      if (key.includes('timer') || key.includes('debounce')) {
        clearTimeout(value);
      }
    });

    this.updateCache.clear();
    this.cacheTimestamps.clear();
  }
}

// Export all handlers and utilities
export {
  RoomLevelUpdateHandlers,
  TeamLevelUpdateHandlers,
  UpdateDataTransformers,
  UpdatePerformanceOptimizer,
}; 
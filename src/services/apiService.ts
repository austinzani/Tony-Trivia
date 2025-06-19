import type { PostgrestError, PostgrestResponse } from './supabase';
import { supabase } from './supabase';

// Database table types
export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface GameRoom {
  id: string;
  name: string;
  description?: string;
  host_id: string;
  max_teams: number;
  is_active: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  game_room_id: string;
  color?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'captain' | 'member';
  joined_at: string;
}

export interface GameRound {
  id: string;
  game_room_id: string;
  round_number: number;
  name?: string;
  is_active: boolean;
  started_at?: string;
  ended_at?: string;
  settings: Record<string, any>;
  created_at: string;
}

export interface Question {
  id: string;
  game_round_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'text' | 'true_false';
  options?: string[];
  correct_answer: string;
  points: number;
  time_limit?: number;
  media_url?: string;
  explanation?: string;
  order_index: number;
  created_at: string;
}

export interface TeamAnswer {
  id: string;
  team_id: string;
  question_id: string;
  answer_text: string;
  is_correct: boolean;
  points_earned: number;
  submitted_at: string;
}

export interface TeamPointUsage {
  id: string;
  team_id: string;
  question_id: string;
  points_used: number;
  usage_type: '1_point' | '3_point' | '5_point';
  used_at: string;
}

export interface GameState {
  id: string;
  game_room_id: string;
  current_round_id?: string;
  current_question_id?: string;
  state: 'waiting' | 'active' | 'paused' | 'finished';
  data: Record<string, any>;
  updated_at: string;
}

// API response types
export type ApiResponse<T> = {
  data: T | null;
  error: PostgrestError | null;
  count?: number;
};

export type ApiListResponse<T> = {
  data: T[] | null;
  error: PostgrestError | null;
  count?: number;
};

// Query options
export interface QueryOptions {
  select?: string;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
  filters?: Record<string, any>;
}

// Generic API service class
export class ApiService {
  // Generic CRUD operations
  static async get<T>(
    table: string,
    id: string,
    options?: { select?: string }
  ): Promise<ApiResponse<T>> {
    try {
      let query = supabase.from(table).select(options?.select || '*').eq('id', id);
      
      const { data, error } = await query.single();
      return { data, error };
    } catch (error) {
      return { data: null, error: error as PostgrestError };
    }
  }

  static async list<T>(
    table: string,
    options?: QueryOptions
  ): Promise<ApiListResponse<T>> {
    try {
      let query = supabase.from(table).select(options?.select || '*', { count: 'exact' });

      // Apply filters
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            query = query.in(key, value);
          } else if (typeof value === 'object' && value !== null) {
            // Handle complex filters like gte, lte, etc.
            Object.entries(value).forEach(([operator, operatorValue]) => {
              switch (operator) {
                case 'gte':
                  query = query.gte(key, operatorValue);
                  break;
                case 'lte':
                  query = query.lte(key, operatorValue);
                  break;
                case 'lt':
                  query = query.lt(key, operatorValue);
                  break;
                case 'gt':
                  query = query.gt(key, operatorValue);
                  break;
                case 'like':
                  query = query.like(key, operatorValue);
                  break;
                case 'ilike':
                  query = query.ilike(key, operatorValue);
                  break;
                case 'neq':
                  query = query.neq(key, operatorValue);
                  break;
                default:
                  query = query.eq(key, operatorValue);
              }
            });
          } else {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (options?.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending ?? true });
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;
      return { data, error, count: count || 0 };
    } catch (error) {
      return { data: null, error: error as PostgrestError, count: 0 };
    }
  }

  static async create<T>(
    table: string,
    data: Partial<T>,
    options?: { select?: string }
  ): Promise<ApiResponse<T>> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select(options?.select || '*')
        .single();

      return { data: result, error };
    } catch (error) {
      return { data: null, error: error as PostgrestError };
    }
  }

  static async update<T>(
    table: string,
    id: string,
    data: Partial<T>,
    options?: { select?: string }
  ): Promise<ApiResponse<T>> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select(options?.select || '*')
        .single();

      return { data: result, error };
    } catch (error) {
      return { data: null, error: error as PostgrestError };
    }
  }

  static async delete(table: string, id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.from(table).delete().eq('id', id);
      return { data: null, error };
    } catch (error) {
      return { data: null, error: error as PostgrestError };
    }
  }

  // Batch operations
  static async createMany<T>(
    table: string,
    data: Partial<T>[],
    options?: { select?: string }
  ): Promise<ApiListResponse<T>> {
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select(options?.select || '*');

      return { data: result, error };
    } catch (error) {
      return { data: null, error: error as PostgrestError };
    }
  }

  static async updateMany<T>(
    table: string,
    updates: { id: string; data: Partial<T> }[],
    options?: { select?: string }
  ): Promise<ApiListResponse<T>> {
    try {
      // Supabase doesn't support batch updates directly, so we'll do them sequentially
      const results: T[] = [];
      let lastError: PostgrestError | null = null;

      for (const update of updates) {
        const { data, error } = await this.update<T>(table, update.id, update.data, options);
        if (error) {
          lastError = error;
          break;
        }
        if (data) results.push(data);
      }

      return { data: lastError ? null : results, error: lastError };
    } catch (error) {
      return { data: null, error: error as PostgrestError };
    }
  }

  static async deleteMany(table: string, ids: string[]): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.from(table).delete().in('id', ids);
      return { data: null, error };
    } catch (error) {
      return { data: null, error: error as PostgrestError };
    }
  }

  // Advanced queries
  static async count(table: string, filters?: Record<string, any>): Promise<number> {
    try {
      let query = supabase.from(table).select('*', { count: 'exact', head: true });

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { count } = await query;
      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  static async exists(table: string, filters: Record<string, any>): Promise<boolean> {
    const count = await this.count(table, filters);
    return count > 0;
  }
}

// Specific API services for each table
export class ProfilesApi {
  static async getProfile(id: string): Promise<ApiResponse<Profile>> {
    return ApiService.get<Profile>('profiles', id);
  }

  static async updateProfile(id: string, data: Partial<Profile>): Promise<ApiResponse<Profile>> {
    return ApiService.update<Profile>('profiles', id, data);
  }

  static async searchProfiles(query: string, limit: number = 10): Promise<ApiListResponse<Profile>> {
    return ApiService.list<Profile>('profiles', {
      filters: { username: { ilike: `%${query}%` } },
      limit,
      order: { column: 'username', ascending: true }
    });
  }
}

export class GameRoomsApi {
  static async getGameRoom(id: string): Promise<ApiResponse<GameRoom>> {
    return ApiService.get<GameRoom>('game_rooms', id);
  }

  static async listGameRooms(options?: {
    isActive?: boolean;
    hostId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiListResponse<GameRoom>> {
    const filters: Record<string, any> = {};
    if (options?.isActive !== undefined) filters.is_active = options.isActive;
    if (options?.hostId) filters.host_id = options.hostId;

    return ApiService.list<GameRoom>('game_rooms', {
      filters,
      limit: options?.limit,
      offset: options?.offset,
      order: { column: 'created_at', ascending: false }
    });
  }

  static async createGameRoom(data: Omit<GameRoom, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<GameRoom>> {
    return ApiService.create<GameRoom>('game_rooms', data);
  }

  static async updateGameRoom(id: string, data: Partial<GameRoom>): Promise<ApiResponse<GameRoom>> {
    return ApiService.update<GameRoom>('game_rooms', id, data);
  }

  static async deleteGameRoom(id: string): Promise<ApiResponse<null>> {
    return ApiService.delete('game_rooms', id);
  }
}

export class TeamsApi {
  static async getTeam(id: string): Promise<ApiResponse<Team>> {
    return ApiService.get<Team>('teams', id, {
      select: '*, team_members(*, profiles(username, full_name))'
    });
  }

  static async listTeamsByGameRoom(gameRoomId: string): Promise<ApiListResponse<Team>> {
    return ApiService.list<Team>('teams', {
      filters: { game_room_id: gameRoomId },
      select: '*, team_members(*, profiles(username, full_name))',
      order: { column: 'created_at', ascending: true }
    });
  }

  static async createTeam(data: Omit<Team, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Team>> {
    return ApiService.create<Team>('teams', data);
  }

  static async updateTeam(id: string, data: Partial<Team>): Promise<ApiResponse<Team>> {
    return ApiService.update<Team>('teams', id, data);
  }

  static async deleteTeam(id: string): Promise<ApiResponse<null>> {
    return ApiService.delete('teams', id);
  }

  static async addTeamMember(teamId: string, userId: string, role: 'captain' | 'member' = 'member'): Promise<ApiResponse<TeamMember>> {
    return ApiService.create<TeamMember>('team_members', {
      team_id: teamId,
      user_id: userId,
      role
    });
  }

  static async removeTeamMember(teamId: string, userId: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      return { data: null, error };
    } catch (error) {
      return { data: null, error: error as PostgrestError };
    }
  }
}

export class GameRoundsApi {
  static async getGameRound(id: string): Promise<ApiResponse<GameRound>> {
    return ApiService.get<GameRound>('game_rounds', id, {
      select: '*, questions(*)'
    });
  }

  static async listGameRounds(gameRoomId: string): Promise<ApiListResponse<GameRound>> {
    return ApiService.list<GameRound>('game_rounds', {
      filters: { game_room_id: gameRoomId },
      order: { column: 'round_number', ascending: true }
    });
  }

  static async createGameRound(data: Omit<GameRound, 'id' | 'created_at'>): Promise<ApiResponse<GameRound>> {
    return ApiService.create<GameRound>('game_rounds', data);
  }

  static async updateGameRound(id: string, data: Partial<GameRound>): Promise<ApiResponse<GameRound>> {
    return ApiService.update<GameRound>('game_rounds', id, data);
  }

  static async deleteGameRound(id: string): Promise<ApiResponse<null>> {
    return ApiService.delete('game_rounds', id);
  }
}

export class QuestionsApi {
  static async getQuestion(id: string): Promise<ApiResponse<Question>> {
    return ApiService.get<Question>('questions', id);
  }

  static async listQuestions(gameRoundId: string): Promise<ApiListResponse<Question>> {
    return ApiService.list<Question>('questions', {
      filters: { game_round_id: gameRoundId },
      order: { column: 'order_index', ascending: true }
    });
  }

  static async createQuestion(data: Omit<Question, 'id' | 'created_at'>): Promise<ApiResponse<Question>> {
    return ApiService.create<Question>('questions', data);
  }

  static async createQuestions(questions: Omit<Question, 'id' | 'created_at'>[]): Promise<ApiListResponse<Question>> {
    return ApiService.createMany<Question>('questions', questions);
  }

  static async updateQuestion(id: string, data: Partial<Question>): Promise<ApiResponse<Question>> {
    return ApiService.update<Question>('questions', id, data);
  }

  static async deleteQuestion(id: string): Promise<ApiResponse<null>> {
    return ApiService.delete('questions', id);
  }
}

export class TeamAnswersApi {
  static async getTeamAnswer(id: string): Promise<ApiResponse<TeamAnswer>> {
    return ApiService.get<TeamAnswer>('team_answers', id);
  }

  static async listTeamAnswers(filters: {
    teamId?: string;
    questionId?: string;
    gameRoundId?: string;
  }): Promise<ApiListResponse<TeamAnswer>> {
    const queryFilters: Record<string, any> = {};
    if (filters.teamId) queryFilters.team_id = filters.teamId;
    if (filters.questionId) queryFilters.question_id = filters.questionId;

    let select = '*, teams(name), questions(question_text, correct_answer, points)';
    if (filters.gameRoundId) {
      select = '*, teams(name), questions!inner(question_text, correct_answer, points, game_round_id)';
      queryFilters['questions.game_round_id'] = filters.gameRoundId;
    }

    return ApiService.list<TeamAnswer>('team_answers', {
      filters: queryFilters,
      select,
      order: { column: 'submitted_at', ascending: false }
    });
  }

  static async submitAnswer(data: Omit<TeamAnswer, 'id' | 'submitted_at'>): Promise<ApiResponse<TeamAnswer>> {
    return ApiService.create<TeamAnswer>('team_answers', data);
  }

  static async updateAnswer(id: string, data: Partial<TeamAnswer>): Promise<ApiResponse<TeamAnswer>> {
    return ApiService.update<TeamAnswer>('team_answers', id, data);
  }
}

export class GameStateApi {
  static async getGameState(gameRoomId: string): Promise<ApiResponse<GameState>> {
    try {
      const { data, error } = await supabase
        .from('game_state')
        .select('*')
        .eq('game_room_id', gameRoomId)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error: error as PostgrestError };
    }
  }

  static async updateGameState(gameRoomId: string, data: Partial<GameState>): Promise<ApiResponse<GameState>> {
    try {
      const { data: result, error } = await supabase
        .from('game_state')
        .upsert({ game_room_id: gameRoomId, ...data })
        .select('*')
        .single();

      return { data: result, error };
    } catch (error) {
      return { data: null, error: error as PostgrestError };
    }
  }
}

// Utility functions
export const apiUtils = {
  // Format error messages
  formatError: (error: PostgrestError | null): string => {
    if (!error) return '';
    return error.message || 'An unexpected error occurred';
  },

  // Check if response has data
  hasData: <T>(response: ApiResponse<T> | ApiListResponse<T>): boolean => {
    return !!response.data && !response.error;
  },

  // Extract data safely
  extractData: <T>(response: ApiResponse<T>): T | null => {
    return response.error ? null : response.data;
  },

  extractListData: <T>(response: ApiListResponse<T>): T[] => {
    return response.error || !response.data ? [] : response.data;
  },

  // Pagination helpers
  calculateOffset: (page: number, limit: number): number => {
    return (page - 1) * limit;
  },

  calculateTotalPages: (total: number, limit: number): number => {
    return Math.ceil(total / limit);
  }
};

export default ApiService; 
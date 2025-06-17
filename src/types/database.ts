// Database table types for Tony Trivia

export interface GameRoom {
  id: string;
  code: string;
  name: string;
  description?: string;
  host_id: string;
  status: 'waiting' | 'active' | 'paused' | 'finished';
  max_players: number;
  current_players: number;
  settings: GameSettings;
  created_at: string;
  started_at?: string;
  ended_at?: string;
}

export interface GameSettings {
  rounds: number;
  time_per_question: number;
  categories: string[];
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  enable_chat: boolean;
  enable_hints: boolean;
  point_system: 'standard' | 'wager' | 'custom';
}

export interface Team {
  id: string;
  room_id: string;
  name: string;
  captain_id?: string;
  members: TeamMember[];
  score: number;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  display_name: string;
  joined_at: string;
  is_captain: boolean;
}

export interface Question {
  id: string;
  room_id: string;
  round: number;
  category: string;
  question_text: string;
  correct_answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  time_limit: number;
  hints?: string[];
  created_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  team_id: string;
  answer_text: string;
  is_correct: boolean;
  points_awarded: number;
  submitted_at: string;
  time_taken: number;
}

export interface GameStats {
  id: string;
  room_id: string;
  team_id: string;
  total_questions: number;
  correct_answers: number;
  total_points: number;
  average_time: number;
  created_at: string;
}

// User profile extending Supabase auth user
export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  games_played: number;
  games_won: number;
  total_points: number;
  created_at: string;
  updated_at: string;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Real-time event types
export interface GameEvent {
  type: 'game_started' | 'game_ended' | 'question_started' | 'question_ended' | 'team_joined' | 'team_left';
  room_id: string;
  data: any;
  timestamp: string;
} 
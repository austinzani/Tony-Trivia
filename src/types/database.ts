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

// Chat message types
export interface ChatMessage {
  id: string;
  game_room_id: string;
  user_id: string;
  team_id?: string;
  message: string;
  message_type: 'text' | 'emoji' | 'system' | 'game_event';
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  // Client-side enriched data
  user?: {
    display_name: string;
    avatar_url?: string;
  };
  team?: {
    name: string;
    color?: string;
  };
}

// Real-time event types
export interface GameEvent {
  type: 'game_started' | 'game_ended' | 'question_started' | 'question_ended' | 'team_joined' | 'team_left' | 'chat_message';
  room_id: string;
  data: any;
  timestamp: string;
}

// Scheduled Games types
export interface ScheduledGame {
  id: string;
  host_id: string;
  room_id?: string;
  title: string;
  description?: string;
  scheduled_for: string;
  duration_minutes: number;
  max_players: number;
  settings: GameSettings;
  recurring_pattern?: 'none' | 'daily' | 'weekly' | 'monthly';
  recurring_end_date?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  reminder_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduledGameParticipant {
  id: string;
  scheduled_game_id: string;
  user_id: string;
  rsvp_status: 'invited' | 'accepted' | 'declined' | 'tentative';
  team_preference?: string;
  notified_at?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduledGameReminder {
  id: string;
  scheduled_game_id: string;
  reminder_type: 'email' | 'push' | 'in_app';
  time_before_minutes: number;
  sent_at?: string;
  created_at: string;
}

// Tournament types
export interface Tournament {
  id: string;
  host_id: string;
  room_id?: string;
  name: string;
  description?: string;
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss';
  status: 'draft' | 'registration_open' | 'in_progress' | 'completed' | 'cancelled';
  max_teams: number;
  min_teams: number;
  current_round: number;
  total_rounds?: number;
  start_date?: string;
  end_date?: string;
  settings: TournamentSettings;
  created_at: string;
  updated_at: string;
}

export interface TournamentSettings {
  points_per_win?: number;
  points_per_draw?: number;
  points_per_loss?: number;
  tiebreaker_rules?: string[];
  match_settings?: {
    rounds_per_match?: number;
    time_per_round?: number;
    categories?: string[];
  };
  advancement_rules?: {
    teams_per_group?: number;
    teams_advancing?: number;
  };
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  team_id: string;
  seed?: number;
  status: 'registered' | 'checked_in' | 'active' | 'eliminated' | 'withdrawn';
  final_position?: number;
  stats: TournamentParticipantStats;
  registered_at: string;
  eliminated_at?: string;
  // Client-side enriched data
  team?: Team;
}

export interface TournamentParticipantStats {
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  points_scored: number;
  points_conceded: number;
  highest_score?: number;
  lowest_score?: number;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  bracket_position?: string;
  team1_id?: string;
  team2_id?: string;
  winner_id?: string;
  loser_id?: string;
  team1_score: number;
  team2_score: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'bye';
  game_room_id?: string;
  scheduled_time?: string;
  started_at?: string;
  completed_at?: string;
  match_data: any;
  created_at: string;
  updated_at: string;
  // Client-side enriched data
  team1?: TournamentParticipant;
  team2?: TournamentParticipant;
}

export interface TournamentRound {
  id: string;
  tournament_id: string;
  round_number: number;
  name?: string;
  status: 'upcoming' | 'in_progress' | 'completed';
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface TournamentStanding {
  id: string;
  tournament_id: string;
  participant_id: string;
  position: number;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  matches_drawn: number;
  points_for: number;
  points_against: number;
  points_difference: number;
  tournament_points: number;
  tiebreaker_score: number;
  updated_at: string;
  // Client-side enriched data
  participant?: TournamentParticipant;
}

export interface TournamentHistory {
  id: string;
  tournament_id: string;
  participant_id?: string;
  event_type: string;
  event_data: any;
  created_at: string;
} 
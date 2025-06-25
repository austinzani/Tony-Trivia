// TypeScript types for Custom Question Sets feature

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type VisibilityLevel = 'private' | 'public' | 'shared';
export type PermissionLevel = 'view' | 'edit' | 'duplicate';

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionSet {
  id: string;
  host_id: string;
  title: string;
  description?: string;
  is_public: boolean;
  visibility_level: VisibilityLevel;
  question_count: number;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
  questions?: CustomQuestion[];
  shared_info?: SharedQuestionSetInfo;
}

export interface CustomQuestion {
  id: string;
  question_set_id: string;
  text: string;
  type: QuestionType;
  options: string[]; // For multiple choice, empty array for other types
  correct_answer: string;
  explanation?: string;
  points: number;
  time_limit: number; // in seconds
  difficulty: QuestionDifficulty;
  category?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionSetTag {
  id: string;
  question_set_id: string;
  tag_id: string;
  created_at: string;
  tag?: Tag;
}

export interface SharedQuestionSet {
  id: string;
  question_set_id: string;
  shared_with_user_id: string;
  shared_by_user_id: string;
  permission_level: PermissionLevel;
  created_at: string;
  question_set?: QuestionSet;
  shared_with_user?: {
    id: string;
    email: string;
    display_name?: string;
  };
  shared_by_user?: {
    id: string;
    email: string;
    display_name?: string;
  };
}

export interface SharedQuestionSetInfo {
  shared_by_user_id?: string;
  shared_by_user_name?: string;
  permission_level?: PermissionLevel;
  shared_at?: string;
}

// Form types for creating/editing
export interface CreateQuestionSetData {
  title: string;
  description?: string;
  is_public?: boolean;
  visibility_level?: VisibilityLevel;
  tag_ids?: string[];
}

export interface UpdateQuestionSetData extends Partial<CreateQuestionSetData> {
  id: string;
}

export interface CreateCustomQuestionData {
  question_set_id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  points?: number;
  time_limit?: number;
  difficulty?: QuestionDifficulty;
  category?: string;
  order_index?: number;
}

export interface UpdateCustomQuestionData extends Partial<CreateCustomQuestionData> {
  id: string;
}

export interface CreateTagData {
  name: string;
  color?: string;
}

export interface ShareQuestionSetData {
  question_set_id: string;
  shared_with_user_id: string;
  permission_level: PermissionLevel;
}

// Filter and search types
export interface QuestionSetFilters {
  search?: string;
  tag_ids?: string[];
  visibility_level?: VisibilityLevel;
  difficulty?: QuestionDifficulty;
  category?: string;
  is_public?: boolean;
  created_after?: string;
  created_before?: string;
  min_questions?: number;
  max_questions?: number;
}

export interface QuestionSetSortOptions {
  field: 'title' | 'created_at' | 'updated_at' | 'question_count';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface QuestionSetListResponse {
  question_sets: QuestionSet[];
  total_count: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Import/Export types
export interface QuestionSetExportData {
  metadata: {
    title: string;
    description?: string;
    created_at: string;
    question_count: number;
    export_version: string;
    tags: string[];
  };
  questions: ExportQuestion[];
}

export interface ExportQuestion {
  text: string;
  type: QuestionType;
  options: string[];
  correct_answer: string;
  explanation?: string;
  points: number;
  time_limit: number;
  difficulty: QuestionDifficulty;
  category?: string;
}

export interface ImportValidationError {
  field: string;
  message: string;
  question_index?: number;
}

export interface ImportValidationResult {
  is_valid: boolean;
  errors: ImportValidationError[];
  warnings: ImportValidationError[];
  questions_count: number;
}

// API Response types
export interface QuestionSetApiResponse {
  success: boolean;
  data?: QuestionSet;
  error?: string;
}

export interface QuestionSetListApiResponse {
  success: boolean;
  data?: QuestionSetListResponse;
  error?: string;
}

export interface CustomQuestionApiResponse {
  success: boolean;
  data?: CustomQuestion;
  error?: string;
}

export interface TagApiResponse {
  success: boolean;
  data?: Tag[];
  error?: string;
}

export interface ShareApiResponse {
  success: boolean;
  data?: SharedQuestionSet;
  error?: string;
}

export interface ImportApiResponse {
  success: boolean;
  data?: {
    question_set: QuestionSet;
    questions_imported: number;
    validation_result: ImportValidationResult;
  };
  error?: string;
}

// UI State types
export interface QuestionSetFormState {
  title: string;
  description: string;
  is_public: boolean;
  visibility_level: VisibilityLevel;
  selected_tag_ids: string[];
  questions: CreateCustomQuestionData[];
}

export interface QuestionFormState {
  text: string;
  type: QuestionType;
  options: string[];
  correct_answer: string;
  explanation: string;
  points: number;
  time_limit: number;
  difficulty: QuestionDifficulty;
  category: string;
}

export interface QuestionSetListState {
  question_sets: QuestionSet[];
  total_count: number;
  current_page: number;
  is_loading: boolean;
  error: string | null;
  filters: QuestionSetFilters;
  sort_options: QuestionSetSortOptions;
}

// Game Integration types
export interface GameQuestionSetConfig {
  question_set_id: string;
  shuffle_questions: boolean;
  time_limit_override?: number;
  points_multiplier?: number;
  max_questions?: number;
}

export interface QuestionSetStats {
  total_games_played: number;
  average_score: number;
  most_difficult_question_id?: string;
  easiest_question_id?: string;
  category_performance: Record<string, {
    total_questions: number;
    average_score: number;
  }>;
}

// Utility types
export type QuestionSetWithStats = QuestionSet & {
  stats?: QuestionSetStats;
};

export type CustomQuestionWithIndex = CustomQuestion & {
  display_index: number;
};

export type TagWithUsageCount = Tag & {
  usage_count: number;
};
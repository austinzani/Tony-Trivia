import { supabase } from '../lib/supabase';
import type  {
  QuestionSet,
  CustomQuestion,
  Tag,
  SharedQuestionSet,
  CreateQuestionSetData,
  UpdateQuestionSetData,
  CreateCustomQuestionData,
  UpdateCustomQuestionData,
  CreateTagData,
  ShareQuestionSetData,
  QuestionSetFilters,
  QuestionSetSortOptions,
  PaginationOptions,
  QuestionSetListResponse,
  QuestionSetExportData,
  ImportValidationResult,
  QuestionSetStats,
  QuestionType
} from '../types/questionSets';

export class QuestionSetService {
  // Question Set CRUD operations
  static async createQuestionSet(data: CreateQuestionSetData): Promise<QuestionSet> {
    const { data: result, error } = await supabase
      .from('question_sets')
      .insert({
        title: data.title,
        description: data.description,
        is_public: data.is_public || false,
        visibility_level: data.visibility_level || 'private',
        host_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create question set: ${error.message}`);

    // Add tags if provided
    if (data.tag_ids && data.tag_ids.length > 0) {
      await this.addTagsToQuestionSet(result.id, data.tag_ids);
    }

    return await this.getQuestionSetById(result.id);
  }

  static async updateQuestionSet(data: UpdateQuestionSetData): Promise<QuestionSet> {
    const { error } = await supabase
      .from('question_sets')
      .update({
        title: data.title,
        description: data.description,
        is_public: data.is_public,
        visibility_level: data.visibility_level,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id);

    if (error) throw new Error(`Failed to update question set: ${error.message}`);

    // Update tags if provided
    if (data.tag_ids !== undefined) {
      await this.updateQuestionSetTags(data.id, data.tag_ids);
    }

    return await this.getQuestionSetById(data.id);
  }

  static async getQuestionSetById(id: string): Promise<QuestionSet> {
    const { data: questionSet, error } = await supabase
      .from('question_sets')
      .select(`
        *,
        question_set_tags (
          tag:tags (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(`Failed to fetch question set: ${error.message}`);

    // Transform the data to include tags array
    const tags = questionSet.question_set_tags?.map((qst: any) => qst.tag) || [];
    
    return {
      ...questionSet,
      tags
    };
  }

  static async getQuestionSets(
    filters: QuestionSetFilters = {},
    sort: QuestionSetSortOptions = { field: 'created_at', direction: 'desc' },
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<QuestionSetListResponse> {
    let query = supabase
      .from('question_sets')
      .select(`
        *,
        question_set_tags (
          tag:tags (*)
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.is_public !== undefined) {
      query = query.eq('is_public', filters.is_public);
    }

    if (filters.visibility_level) {
      query = query.eq('visibility_level', filters.visibility_level);
    }

    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after);
    }

    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before);
    }

    if (filters.min_questions) {
      query = query.gte('question_count', filters.min_questions);
    }

    if (filters.max_questions) {
      query = query.lte('question_count', filters.max_questions);
    }

    // Apply sorting
    query = query.order(sort.field, { ascending: sort.direction === 'asc' });

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit;
    query = query.range(offset, offset + pagination.limit - 1);

    const { data: questionSets, error, count } = await query;

    if (error) throw new Error(`Failed to fetch question sets: ${error.message}`);

    // Transform data to include tags
    const transformedQuestionSets = questionSets?.map((qs: any) => ({
      ...qs,
      tags: qs.question_set_tags?.map((qst: any) => qst.tag) || []
    })) || [];

    return {
      question_sets: transformedQuestionSets,
      total_count: count || 0,
      page: pagination.page,
      limit: pagination.limit,
      has_more: (count || 0) > offset + pagination.limit
    };
  }

  static async deleteQuestionSet(id: string): Promise<void> {
    const { error } = await supabase
      .from('question_sets')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete question set: ${error.message}`);
  }

  static async duplicateQuestionSet(id: string, newTitle?: string): Promise<QuestionSet> {
    // Get original question set with questions
    const originalSet = await this.getQuestionSetWithQuestions(id);
    
    // Create new question set
    const newSet = await this.createQuestionSet({
      title: newTitle || `${originalSet.title} (Copy)`,
      description: originalSet.description,
      is_public: false, // Copies are private by default
      visibility_level: 'private'
    });

    // Copy all questions
    if (originalSet.questions && originalSet.questions.length > 0) {
      const questionsToCreate = originalSet.questions.map(q => ({
        question_set_id: newSet.id,
        text: q.text,
        type: q.type,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        points: q.points,
        time_limit: q.time_limit,
        difficulty: q.difficulty,
        category: q.category,
        order_index: q.order_index
      }));

      await this.createMultipleQuestions(questionsToCreate);
    }

    return await this.getQuestionSetById(newSet.id);
  }

  // Custom Questions CRUD operations
  static async createCustomQuestion(data: CreateCustomQuestionData): Promise<CustomQuestion> {
    const { data: result, error } = await supabase
      .from('custom_questions')
      .insert({
        question_set_id: data.question_set_id,
        text: data.text,
        type: data.type,
        options: data.options || [],
        correct_answer: data.correct_answer,
        explanation: data.explanation,
        points: data.points || 1,
        time_limit: data.time_limit || 30,
        difficulty: data.difficulty || 'medium',
        category: data.category,
        order_index: data.order_index || 0
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create question: ${error.message}`);
    return result;
  }

  static async createMultipleQuestions(questions: CreateCustomQuestionData[]): Promise<CustomQuestion[]> {
    const { data: result, error } = await supabase
      .from('custom_questions')
      .insert(questions.map(q => ({
        question_set_id: q.question_set_id,
        text: q.text,
        type: q.type,
        options: q.options || [],
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        points: q.points || 1,
        time_limit: q.time_limit || 30,
        difficulty: q.difficulty || 'medium',
        category: q.category,
        order_index: q.order_index || 0
      })))
      .select();

    if (error) throw new Error(`Failed to create questions: ${error.message}`);
    return result;
  }

  static async updateCustomQuestion(data: UpdateCustomQuestionData): Promise<CustomQuestion> {
    const { data: result, error } = await supabase
      .from('custom_questions')
      .update({
        text: data.text,
        type: data.type,
        options: data.options,
        correct_answer: data.correct_answer,
        explanation: data.explanation,
        points: data.points,
        time_limit: data.time_limit,
        difficulty: data.difficulty,
        category: data.category,
        order_index: data.order_index,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update question: ${error.message}`);
    return result;
  }

  static async getQuestionsBySetId(questionSetId: string): Promise<CustomQuestion[]> {
    const { data: questions, error } = await supabase
      .from('custom_questions')
      .select('*')
      .eq('question_set_id', questionSetId)
      .order('order_index');

    if (error) throw new Error(`Failed to fetch questions: ${error.message}`);
    return questions || [];
  }

  static async getQuestionSetWithQuestions(id: string): Promise<QuestionSet & { questions: CustomQuestion[] }> {
    const questionSet = await this.getQuestionSetById(id);
    const questions = await this.getQuestionsBySetId(id);
    
    return {
      ...questionSet,
      questions
    };
  }

  static async deleteCustomQuestion(id: string): Promise<void> {
    const { error } = await supabase
      .from('custom_questions')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete question: ${error.message}`);
  }

  static async reorderQuestions(questionSetId: string, questionIds: string[]): Promise<void> {
    const updates = questionIds.map((id, index) => ({
      id,
      order_index: index
    }));

    for (const update of updates) {
      await supabase
        .from('custom_questions')
        .update({ order_index: update.order_index })
        .eq('id', update.id);
    }
  }

  // Tags operations
  static async getAllTags(): Promise<Tag[]> {
    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .order('name');

    if (error) throw new Error(`Failed to fetch tags: ${error.message}`);
    return tags || [];
  }

  static async createTag(data: CreateTagData): Promise<Tag> {
    const { data: result, error } = await supabase
      .from('tags')
      .insert({
        name: data.name,
        color: data.color || '#3B82F6'
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create tag: ${error.message}`);
    return result;
  }

  static async addTagsToQuestionSet(questionSetId: string, tagIds: string[]): Promise<void> {
    const tagsToAdd = tagIds.map(tagId => ({
      question_set_id: questionSetId,
      tag_id: tagId
    }));

    const { error } = await supabase
      .from('question_set_tags')
      .insert(tagsToAdd);

    if (error) throw new Error(`Failed to add tags to question set: ${error.message}`);
  }

  static async updateQuestionSetTags(questionSetId: string, tagIds: string[]): Promise<void> {
    // Remove existing tags
    await supabase
      .from('question_set_tags')
      .delete()
      .eq('question_set_id', questionSetId);

    // Add new tags
    if (tagIds.length > 0) {
      await this.addTagsToQuestionSet(questionSetId, tagIds);
    }
  }

  // Sharing operations
  static async shareQuestionSet(data: ShareQuestionSetData): Promise<SharedQuestionSet> {
    const { data: result, error } = await supabase
      .from('shared_question_sets')
      .insert({
        question_set_id: data.question_set_id,
        shared_with_user_id: data.shared_with_user_id,
        shared_by_user_id: (await supabase.auth.getUser()).data.user?.id,
        permission_level: data.permission_level
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to share question set: ${error.message}`);
    return result;
  }

  static async getSharedQuestionSets(): Promise<SharedQuestionSet[]> {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    const { data: shares, error } = await supabase
      .from('shared_question_sets')
      .select(`
        *,
        question_set:question_sets (*),
        shared_by_user:users!shared_by_user_id (id, email)
      `)
      .eq('shared_with_user_id', userId);

    if (error) throw new Error(`Failed to fetch shared question sets: ${error.message}`);
    return shares || [];
  }

  static async updateSharePermission(shareId: string, permissionLevel: string): Promise<void> {
    const { error } = await supabase
      .from('shared_question_sets')
      .update({ permission_level: permissionLevel })
      .eq('id', shareId);

    if (error) throw new Error(`Failed to update share permission: ${error.message}`);
  }

  static async removeShare(shareId: string): Promise<void> {
    const { error } = await supabase
      .from('shared_question_sets')
      .delete()
      .eq('id', shareId);

    if (error) throw new Error(`Failed to remove share: ${error.message}`);
  }

  // Import/Export operations
  static async exportQuestionSet(id: string): Promise<QuestionSetExportData> {
    const questionSet = await this.getQuestionSetWithQuestions(id);
    
    return {
      metadata: {
        title: questionSet.title,
        description: questionSet.description,
        created_at: questionSet.created_at,
        question_count: questionSet.question_count,
        export_version: '1.0',
        tags: questionSet.tags?.map(t => t.name) || []
      },
      questions: questionSet.questions?.map(q => ({
        text: q.text,
        type: q.type,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        points: q.points,
        time_limit: q.time_limit,
        difficulty: q.difficulty,
        category: q.category
      })) || []
    };
  }

  static validateImportData(data: any): ImportValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    // Validate metadata
    if (!data.metadata) {
      errors.push({ field: 'metadata', message: 'Missing metadata section' });
    } else {
      if (!data.metadata.title) {
        errors.push({ field: 'metadata.title', message: 'Title is required' });
      }
    }

    // Validate questions
    if (!data.questions || !Array.isArray(data.questions)) {
      errors.push({ field: 'questions', message: 'Questions must be an array' });
    } else {
      data.questions.forEach((question: any, index: number) => {
        if (!question.text) {
          errors.push({ 
            field: 'text', 
            message: 'Question text is required', 
            question_index: index 
          });
        }

        if (!question.correct_answer) {
          errors.push({ 
            field: 'correct_answer', 
            message: 'Correct answer is required', 
            question_index: index 
          });
        }

        const validTypes: QuestionType[] = ['multiple_choice', 'true_false', 'short_answer', 'fill_blank'];
        if (!question.type || !validTypes.includes(question.type)) {
          errors.push({ 
            field: 'type', 
            message: 'Invalid question type', 
            question_index: index 
          });
        }

        if (question.type === 'multiple_choice' && (!question.options || question.options.length < 2)) {
          errors.push({ 
            field: 'options', 
            message: 'Multiple choice questions need at least 2 options', 
            question_index: index 
          });
        }
      });
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      questions_count: data.questions?.length || 0
    };
  }

  static async importQuestionSet(importData: QuestionSetExportData, title?: string): Promise<QuestionSet> {
    const validation = this.validateImportData(importData);
    if (!validation.is_valid) {
      throw new Error(`Import validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Create question set
    const questionSet = await this.createQuestionSet({
      title: title || importData.metadata.title,
      description: importData.metadata.description,
      is_public: false,
      visibility_level: 'private'
    });

    // Create questions
    const questionsToCreate = importData.questions.map((q, index) => ({
      question_set_id: questionSet.id,
      text: q.text,
      type: q.type,
      options: q.options || [],
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      points: q.points || 1,
      time_limit: q.time_limit || 30,
      difficulty: q.difficulty || 'medium',
      category: q.category,
      order_index: index
    }));

    await this.createMultipleQuestions(questionsToCreate);

    return await this.getQuestionSetById(questionSet.id);
  }

  // Statistics operations
  static async getQuestionSetStats(id: string): Promise<QuestionSetStats> {
    // This would integrate with your existing game statistics
    // For now, returning mock data structure
    return {
      total_games_played: 0,
      average_score: 0,
      category_performance: {}
    };
  }

  // Search operations
  static async searchQuestionSets(
    query: string,
    filters: QuestionSetFilters = {}
  ): Promise<QuestionSet[]> {
    const searchFilters = {
      ...filters,
      search: query
    };

    const result = await this.getQuestionSets(
      searchFilters,
      { field: 'created_at', direction: 'desc' },
      { page: 1, limit: 50 }
    );

    return result.question_sets;
  }

  static async getPublicQuestionSets(
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<QuestionSetListResponse> {
    return await this.getQuestionSets(
      { is_public: true },
      { field: 'created_at', direction: 'desc' },
      pagination
    );
  }
}
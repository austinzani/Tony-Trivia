import { useState, useEffect, useCallback } from 'react';
import { 
  QuestionSet, 
  CustomQuestion,
  Tag,
  QuestionSetFilters, 
  QuestionSetSortOptions,
  PaginationOptions,
  QuestionSetListResponse,
  CreateQuestionSetData,
  UpdateQuestionSetData,
  CreateCustomQuestionData,
  UpdateCustomQuestionData
} from '../types/questionSets';
import { QuestionSetService } from '../services/questionSetService';

interface UseQuestionSetsOptions {
  autoLoad?: boolean;
  defaultFilters?: QuestionSetFilters;
  defaultSort?: QuestionSetSortOptions;
  defaultPageSize?: number;
}

interface UseQuestionSetsReturn {
  // State
  questionSets: QuestionSet[];
  currentQuestionSet: QuestionSet | null;
  tags: Tag[];
  loading: boolean;
  error: string | null;
  
  // Pagination
  currentPage: number;
  totalCount: number;
  hasMore: boolean;
  
  // Actions
  loadQuestionSets: (filters?: QuestionSetFilters, sort?: QuestionSetSortOptions, page?: number) => Promise<void>;
  loadQuestionSet: (id: string) => Promise<QuestionSet | null>;
  createQuestionSet: (data: CreateQuestionSetData) => Promise<QuestionSet>;
  updateQuestionSet: (data: UpdateQuestionSetData) => Promise<QuestionSet>;
  duplicateQuestionSet: (id: string, newTitle?: string) => Promise<QuestionSet>;
  deleteQuestionSet: (id: string) => Promise<void>;
  exportQuestionSet: (id: string) => Promise<void>;
  importQuestionSet: (file: File) => Promise<QuestionSet>;
  
  // Question management
  addQuestion: (questionSetId: string, question: CreateCustomQuestionData) => Promise<CustomQuestion>;
  updateQuestion: (question: UpdateCustomQuestionData) => Promise<CustomQuestion>;
  deleteQuestion: (questionId: string) => Promise<void>;
  reorderQuestions: (questionSetId: string, questionIds: string[]) => Promise<void>;
  
  // Tags
  loadTags: () => Promise<void>;
  createTag: (name: string, color?: string) => Promise<Tag>;
  
  // Search and filtering
  searchQuestionSets: (query: string, filters?: QuestionSetFilters) => Promise<void>;
  applyFilters: (filters: QuestionSetFilters) => void;
  applySorting: (sort: QuestionSetSortOptions) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  
  // Utilities
  clearError: () => void;
  resetPagination: () => void;
}

export const useQuestionSets = (options: UseQuestionSetsOptions = {}): UseQuestionSetsReturn => {
  const {
    autoLoad = true,
    defaultFilters = {},
    defaultSort = { field: 'created_at', direction: 'desc' },
    defaultPageSize = 20
  } = options;

  // State
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [currentQuestionSet, setCurrentQuestionSet] = useState<QuestionSet | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Filter and sort state
  const [filters, setFilters] = useState<QuestionSetFilters>(defaultFilters);
  const [sortOptions, setSortOptions] = useState<QuestionSetSortOptions>(defaultSort);

  // Load question sets
  const loadQuestionSets = useCallback(async (
    customFilters?: QuestionSetFilters,
    customSort?: QuestionSetSortOptions,
    page: number = 1
  ) => {
    try {
      setLoading(true);
      setError(null);

      const actualFilters = customFilters || filters;
      const actualSort = customSort || sortOptions;
      const pagination: PaginationOptions = { page, limit: defaultPageSize };

      const result = await QuestionSetService.getQuestionSets(
        actualFilters,
        actualSort,
        pagination
      );

      if (page === 1) {
        setQuestionSets(result.question_sets);
      } else {
        setQuestionSets(prev => [...prev, ...result.question_sets]);
      }

      setCurrentPage(page);
      setTotalCount(result.total_count);
      setHasMore(result.has_more);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question sets');
      console.error('Failed to load question sets:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, sortOptions, defaultPageSize]);

  // Load single question set
  const loadQuestionSet = useCallback(async (id: string): Promise<QuestionSet | null> => {
    try {
      setLoading(true);
      setError(null);

      const questionSet = await QuestionSetService.getQuestionSetWithQuestions(id);
      setCurrentQuestionSet(questionSet);
      return questionSet;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question set');
      console.error('Failed to load question set:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create question set
  const createQuestionSet = useCallback(async (data: CreateQuestionSetData): Promise<QuestionSet> => {
    try {
      setLoading(true);
      setError(null);

      const newQuestionSet = await QuestionSetService.createQuestionSet(data);
      
      // Add to the beginning of the list if it matches current filters
      setQuestionSets(prev => [newQuestionSet, ...prev]);
      setTotalCount(prev => prev + 1);
      
      return newQuestionSet;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create question set';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update question set
  const updateQuestionSet = useCallback(async (data: UpdateQuestionSetData): Promise<QuestionSet> => {
    try {
      setLoading(true);
      setError(null);

      const updatedQuestionSet = await QuestionSetService.updateQuestionSet(data);
      
      // Update in the list
      setQuestionSets(prev => 
        prev.map(qs => qs.id === data.id ? updatedQuestionSet : qs)
      );
      
      // Update current if it's the same one
      if (currentQuestionSet?.id === data.id) {
        setCurrentQuestionSet(updatedQuestionSet);
      }
      
      return updatedQuestionSet;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update question set';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentQuestionSet]);

  // Duplicate question set
  const duplicateQuestionSet = useCallback(async (id: string, newTitle?: string): Promise<QuestionSet> => {
    try {
      setLoading(true);
      setError(null);

      const duplicatedQuestionSet = await QuestionSetService.duplicateQuestionSet(id, newTitle);
      
      // Add to the beginning of the list
      setQuestionSets(prev => [duplicatedQuestionSet, ...prev]);
      setTotalCount(prev => prev + 1);
      
      return duplicatedQuestionSet;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate question set';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete question set
  const deleteQuestionSet = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await QuestionSetService.deleteQuestionSet(id);
      
      // Remove from the list
      setQuestionSets(prev => prev.filter(qs => qs.id !== id));
      setTotalCount(prev => prev - 1);
      
      // Clear current if it's the same one
      if (currentQuestionSet?.id === id) {
        setCurrentQuestionSet(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete question set';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentQuestionSet]);

  // Export question set
  const exportQuestionSet = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const questionSet = questionSets.find(qs => qs.id === id) || currentQuestionSet;
      if (!questionSet) {
        throw new Error('Question set not found');
      }

      const exportData = await QuestionSetService.exportQuestionSet(id);
      
      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${questionSet.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export question set';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [questionSets, currentQuestionSet]);

  // Import question set
  const importQuestionSet = useCallback(async (file: File): Promise<QuestionSet> => {
    try {
      setLoading(true);
      setError(null);

      const text = await file.text();
      const importData = JSON.parse(text);
      
      const importedQuestionSet = await QuestionSetService.importQuestionSet(importData);
      
      // Add to the beginning of the list
      setQuestionSets(prev => [importedQuestionSet, ...prev]);
      setTotalCount(prev => prev + 1);
      
      return importedQuestionSet;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import question set';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Question management
  const addQuestion = useCallback(async (
    questionSetId: string, 
    question: CreateCustomQuestionData
  ): Promise<CustomQuestion> => {
    try {
      setLoading(true);
      setError(null);

      const newQuestion = await QuestionSetService.createCustomQuestion(question);
      
      // Update question count in the list
      setQuestionSets(prev => 
        prev.map(qs => 
          qs.id === questionSetId 
            ? { ...qs, question_count: qs.question_count + 1 }
            : qs
        )
      );
      
      return newQuestion;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add question';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuestion = useCallback(async (question: UpdateCustomQuestionData): Promise<CustomQuestion> => {
    try {
      setLoading(true);
      setError(null);

      const updatedQuestion = await QuestionSetService.updateCustomQuestion(question);
      return updatedQuestion;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update question';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteQuestion = useCallback(async (questionId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await QuestionSetService.deleteCustomQuestion(questionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete question';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const reorderQuestions = useCallback(async (
    questionSetId: string, 
    questionIds: string[]
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      await QuestionSetService.reorderQuestions(questionSetId, questionIds);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder questions';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Tags
  const loadTags = useCallback(async (): Promise<void> => {
    try {
      const allTags = await QuestionSetService.getAllTags();
      setTags(allTags);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  }, []);

  const createTag = useCallback(async (name: string, color?: string): Promise<Tag> => {
    try {
      const newTag = await QuestionSetService.createTag({ name, color });
      setTags(prev => [...prev, newTag]);
      return newTag;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tag';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Search and filtering
  const searchQuestionSets = useCallback(async (
    query: string, 
    customFilters?: QuestionSetFilters
  ): Promise<void> => {
    const searchFilters = { ...filters, ...customFilters, search: query };
    setFilters(searchFilters);
    await loadQuestionSets(searchFilters, sortOptions, 1);
  }, [filters, sortOptions, loadQuestionSets]);

  const applyFilters = useCallback((newFilters: QuestionSetFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const applySorting = useCallback((newSort: QuestionSetSortOptions) => {
    setSortOptions(newSort);
    setCurrentPage(1);
  }, []);

  const loadMore = useCallback(async (): Promise<void> => {
    if (hasMore && !loading) {
      await loadQuestionSets(filters, sortOptions, currentPage + 1);
    }
  }, [hasMore, loading, filters, sortOptions, currentPage, loadQuestionSets]);

  const refresh = useCallback(async (): Promise<void> => {
    setCurrentPage(1);
    await loadQuestionSets(filters, sortOptions, 1);
  }, [filters, sortOptions, loadQuestionSets]);

  // Utilities
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setTotalCount(0);
    setHasMore(false);
  }, []);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadQuestionSets();
      loadTags();
    }
  }, [autoLoad, loadQuestionSets, loadTags]);

  // Reload when filters or sorting changes
  useEffect(() => {
    if (autoLoad) {
      loadQuestionSets(filters, sortOptions, 1);
    }
  }, [filters, sortOptions]);

  return {
    // State
    questionSets,
    currentQuestionSet,
    tags,
    loading,
    error,
    
    // Pagination
    currentPage,
    totalCount,
    hasMore,
    
    // Actions
    loadQuestionSets,
    loadQuestionSet,
    createQuestionSet,
    updateQuestionSet,
    duplicateQuestionSet,
    deleteQuestionSet,
    exportQuestionSet,
    importQuestionSet,
    
    // Question management
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    
    // Tags
    loadTags,
    createTag,
    
    // Search and filtering
    searchQuestionSets,
    applyFilters,
    applySorting,
    loadMore,
    refresh,
    
    // Utilities
    clearError,
    resetPagination
  };
};
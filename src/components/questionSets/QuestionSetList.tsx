import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Share, 
  Download, 
  Upload,
  MoreVertical,
  Edit,
  Trash2,
  Copy,
  Eye,
  Users
} from 'lucide-react';
import type { QuestionSet, QuestionSetFilters, QuestionSetSortOptions } from '../../types/questionSets';
import { QuestionSetService } from '../../services/questionSetService';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/host/Card';
import Button from '../ui/host/Button';
import Badge from '../ui/host/Badge';
import { cn } from '../../utils/cn';

interface QuestionSetListProps {
  onCreateNew: () => void;
  onEditQuestionSet: (questionSet: QuestionSet) => void;
  onViewQuestionSet: (questionSet: QuestionSet) => void;
  className?: string;
}

type ViewMode = 'grid' | 'list';

export const QuestionSetList: React.FC<QuestionSetListProps> = ({
  onCreateNew,
  onEditQuestionSet,
  onViewQuestionSet,
  className
}) => {
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<QuestionSetFilters>({});
  const [sortOptions, setSortOptions] = useState<QuestionSetSortOptions>({
    field: 'created_at',
    direction: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadQuestionSets = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchFilters = {
        ...filters,
        ...(searchQuery && { search: searchQuery })
      };

      const result = await QuestionSetService.getQuestionSets(
        searchFilters,
        sortOptions,
        { page: currentPage, limit: 20 }
      );

      if (currentPage === 1) {
        setQuestionSets(result.question_sets);
      } else {
        setQuestionSets(prev => [...prev, ...result.question_sets]);
      }

      setTotalCount(result.total_count);
      setHasMore(result.has_more);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question sets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadQuestionSets();
  }, [searchQuery, filters, sortOptions]);

  useEffect(() => {
    if (currentPage > 1) {
      loadQuestionSets();
    }
  }, [currentPage]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFilter = (newFilters: Partial<QuestionSetFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleSort = (field: QuestionSetSortOptions['field']) => {
    setSortOptions(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const handleDuplicate = async (questionSet: QuestionSet) => {
    try {
      await QuestionSetService.duplicateQuestionSet(questionSet.id);
      loadQuestionSets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate question set');
    }
  };

  const handleDelete = async (questionSet: QuestionSet) => {
    if (!confirm(`Are you sure you want to delete "${questionSet.title}"?`)) {
      return;
    }

    try {
      await QuestionSetService.deleteQuestionSet(questionSet.id);
      loadQuestionSets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question set');
    }
  };

  const handleExport = async (questionSet: QuestionSet) => {
    try {
      const exportData = await QuestionSetService.exportQuestionSet(questionSet.id);
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
      setError(err instanceof Error ? err.message : 'Failed to export question set');
    }
  };

  const QuestionSetCard: React.FC<{ questionSet: QuestionSet }> = ({ questionSet }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        viewMode === 'grid' ? 'col-span-1' : 'col-span-full'
      )}
    >
      <Card
        variant="default"
        hover
        className="group cursor-pointer"
        onClick={() => onViewQuestionSet(questionSet)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                {questionSet.title}
              </CardTitle>
              {questionSet.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {questionSet.description}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-1 ml-2">
              {questionSet.is_public && (
                <Badge variant="primary" size="sm">
                  <Users className="w-3 h-3 mr-1" />
                  Public
                </Badge>
              )}
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implement dropdown menu
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{questionSet.question_count} questions</span>
              <span>•</span>
              <span>{new Date(questionSet.created_at).toLocaleDateString()}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              {questionSet.tags?.slice(0, 2).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="default"
                  size="sm"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                >
                  {tag.name}
                </Badge>
              ))}
              {questionSet.tags && questionSet.tags.length > 2 && (
                <Badge variant="default" size="sm" className="text-gray-500">
                  +{questionSet.tags.length - 2}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditQuestionSet(questionSet);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicate(questionSet);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Copy className="w-4 h-4 mr-1" />
                Duplicate
              </Button>
            </div>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleExport(questionSet);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // TODO: Implement share functionality
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Share className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Sets</h1>
          <p className="text-gray-600 mt-1">
            Create and manage your custom trivia questions
          </p>
        </div>
        <Button onClick={onCreateNew} className="flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Create Question Set
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search question sets..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500 focus:border-electric-500"
          />
        </div>
        
        <Button
          variant="ghost"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(showFilters && "bg-gray-100")}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>

        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-none border-none"
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-none border-none"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 p-4 rounded-lg space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <select
                  value={filters.visibility_level || ''}
                  onChange={(e) => handleFilter({ 
                    visibility_level: e.target.value as any || undefined 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500"
                >
                  <option value="">All</option>
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                  <option value="shared">Shared</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Count
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.min_questions || ''}
                    onChange={(e) => handleFilter({ 
                      min_questions: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.max_questions || ''}
                    onChange={(e) => handleFilter({ 
                      max_questions: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortOptions.field}
                  onChange={(e) => handleSort(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-electric-500"
                >
                  <option value="created_at">Date Created</option>
                  <option value="updated_at">Last Modified</option>
                  <option value="title">Title</option>
                  <option value="question_count">Question Count</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Question Sets Grid */}
      <div className={cn(
        "grid gap-4",
        viewMode === 'grid' 
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
          : "grid-cols-1"
      )}>
        <AnimatePresence>
          {questionSets.map((questionSet) => (
            <QuestionSetCard 
              key={questionSet.id} 
              questionSet={questionSet} 
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Loading State */}
      {loading && questionSets.length === 0 && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-500 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading question sets...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && questionSets.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No question sets found
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by creating your first custom question set.
          </p>
          <Button onClick={onCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Create Question Set
          </Button>
        </div>
      )}

      {/* Load More */}
      {hasMore && !loading && (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}

      {/* Stats */}
      {totalCount > 0 && (
        <div className="text-center text-sm text-gray-500">
          Showing {questionSets.length} of {totalCount} question sets
        </div>
      )}
    </div>
  );
};
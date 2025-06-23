import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Lock,
  Unlock,
  AlertTriangle,
  BarChart3,
  Grid3X3,
  List,
  ChevronDown,
  Users,
  Target,
  Eye,
  MessageSquare,
  Calendar,
  SortAsc,
  SortDesc,
  RefreshCw,
  Download,
  Settings,
} from 'lucide-react';
import { useGameController } from '../../hooks/useGameController';
import { useAnswerSubmission } from '../../hooks/useAnswerSubmission';
import type {
  AnswerManagementProps,
  ManagedAnswerSubmission,
  AnswerReviewAction,
  BulkAnswerAction,
  AnswerFilterOptions,
  AnswerSortOptions,
  AnswerStatistics,
  AnswerManagementState,
} from '../../types/answerManagement';
import { AnswerSubmissionCard } from './AnswerSubmissionCard';
import { AnswerFilterControls } from './AnswerFilterControls';
import { BulkActionControls } from './BulkActionControls';
import { AnswerStatsDashboard } from './AnswerStatsDashboard';
import '../../styles/gameflow.css';

const AnswerManagementInterface: React.FC<AnswerManagementProps> = ({
  gameId,
  currentQuestionId,
  currentRoundId,
  onSubmissionReviewed,
  onBulkAction,
  onSubmissionSelected,
  className = '',
}) => {
  // Game state and submission management
  const { gameState, isLoading: gameLoading } = useGameController({ gameId });
  const roundManager = gameState?.roundManager;

  const {
    submissionManager,
    submissions,
    isLoading: submissionsLoading,
    lockSubmission,
    unlockSubmission,
  } = useAnswerSubmission(roundManager!, {
    participantId: 'host', // Host context
    enableValidation: false, // Hosts can override validation
  });

  // Component state
  const [state, setState] = useState<AnswerManagementState>({
    submissions: [],
    filteredSubmissions: [],
    selectedSubmissions: new Set(),
    filterOptions: {
      status: 'all',
      teamId: 'all',
      questionId: currentQuestionId || 'all',
      roundId: currentRoundId || 'all',
      isLocked: 'all',
      hasConflict: 'all',
      searchTerm: '',
    },
    sortOptions: {
      field: 'submittedAt',
      direction: 'desc',
    },
    isLoading: false,
    error: null,
    bulkActionInProgress: false,
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showStats, setShowStats] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Convert submissions to managed submissions with review status
  const managedSubmissions = useMemo(() => {
    return submissions.map(
      (submission): ManagedAnswerSubmission => ({
        ...submission,
        reviewStatus: 'pending', // Default status - would come from backend in real app
        reviewedAt: undefined,
        reviewedBy: undefined,
        hostFeedback: undefined,
        isCorrect: undefined,
        pointsAwarded: undefined,
        hasConflict: false,
      })
    );
  }, [submissions]);

  // Get team and question info from game state
  const teamsMap = useMemo(() => {
    if (!gameState?.teams) return new Map();
    return new Map(
      Object.entries(gameState.teams).map(([id, team]) => [id, team])
    );
  }, [gameState?.teams]);

  const questionsMap = useMemo(() => {
    if (!gameState?.rounds) return new Map();
    const questions = new Map();
    gameState.rounds.forEach(round => {
      round.questions.forEach((question, index) => {
        questions.set(question.id, {
          ...question,
          questionNumber: index + 1,
          roundNumber: round.number,
        });
      });
    });
    return questions;
  }, [gameState?.rounds]);

  // Filter and sort submissions
  const filteredAndSortedSubmissions = useMemo(() => {
    let filtered = [...managedSubmissions];

    // Apply filters
    const { filterOptions } = state;

    if (filterOptions.status && filterOptions.status !== 'all') {
      filtered = filtered.filter(
        sub => sub.reviewStatus === filterOptions.status
      );
    }

    if (filterOptions.teamId && filterOptions.teamId !== 'all') {
      filtered = filtered.filter(
        sub => sub.participantId === filterOptions.teamId
      );
    }

    if (filterOptions.questionId && filterOptions.questionId !== 'all') {
      filtered = filtered.filter(
        sub => sub.questionId === filterOptions.questionId
      );
    }

    if (filterOptions.roundId && filterOptions.roundId !== 'all') {
      filtered = filtered.filter(sub => sub.roundId === filterOptions.roundId);
    }

    if (typeof filterOptions.isLocked === 'boolean') {
      filtered = filtered.filter(
        sub => sub.isLocked === filterOptions.isLocked
      );
    }

    if (typeof filterOptions.hasConflict === 'boolean') {
      filtered = filtered.filter(
        sub => sub.hasConflict === filterOptions.hasConflict
      );
    }

    if (filterOptions.searchTerm) {
      const searchTerm = filterOptions.searchTerm.toLowerCase();
      filtered = filtered.filter(
        sub =>
          sub.answer.toLowerCase().includes(searchTerm) ||
          (teamsMap.get(sub.participantId)?.teamId || '')
            .toLowerCase()
            .includes(searchTerm) ||
          (questionsMap.get(sub.questionId)?.text || '')
            .toLowerCase()
            .includes(searchTerm)
      );
    }

    // Apply sorting
    const { sortOptions } = state;
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortOptions.field) {
        case 'submittedAt':
          aValue = new Date(a.submittedAt).getTime();
          bValue = new Date(b.submittedAt).getTime();
          break;
        case 'reviewedAt':
          aValue = a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0;
          bValue = b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0;
          break;
        case 'teamName':
          aValue = teamsMap.get(a.participantId)?.teamId || '';
          bValue = teamsMap.get(b.participantId)?.teamId || '';
          break;
        case 'questionNumber':
          aValue = questionsMap.get(a.questionId)?.questionNumber || 0;
          bValue = questionsMap.get(b.questionId)?.questionNumber || 0;
          break;
        case 'pointValue':
          aValue = a.pointValue;
          bValue = b.pointValue;
          break;
        case 'reviewStatus':
          aValue = a.reviewStatus;
          bValue = b.reviewStatus;
          break;
        default:
          aValue = a.submittedAt;
          bValue = b.submittedAt;
      }

      if (aValue < bValue) return sortOptions.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOptions.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    managedSubmissions,
    state.filterOptions,
    state.sortOptions,
    teamsMap,
    questionsMap,
  ]);

  // Calculate statistics
  const statistics = useMemo((): AnswerStatistics => {
    const submissions = managedSubmissions;
    const total = submissions.length;
    const pending = submissions.filter(
      s => s.reviewStatus === 'pending'
    ).length;
    const approved = submissions.filter(
      s => s.reviewStatus === 'approved'
    ).length;
    const rejected = submissions.filter(
      s => s.reviewStatus === 'rejected'
    ).length;
    const needsReview = submissions.filter(
      s => s.reviewStatus === 'needs-review'
    ).length;
    const autoApproved = submissions.filter(
      s => s.reviewStatus === 'auto-approved'
    ).length;
    const locked = submissions.filter(s => s.isLocked).length;
    const unlocked = submissions.filter(s => !s.isLocked).length;
    const conflictCount = submissions.filter(s => s.hasConflict).length;

    // Calculate average review time
    const reviewedSubmissions = submissions.filter(
      s => s.reviewedAt && s.submittedAt
    );
    const totalReviewTime = reviewedSubmissions.reduce((sum, s) => {
      if (s.reviewedAt && s.submittedAt) {
        return (
          sum +
          (new Date(s.reviewedAt).getTime() - new Date(s.submittedAt).getTime())
        );
      }
      return sum;
    }, 0);
    const averageReviewTime =
      reviewedSubmissions.length > 0
        ? totalReviewTime / reviewedSubmissions.length / 1000
        : 0;

    return {
      total,
      pending,
      approved,
      rejected,
      needsReview,
      autoApproved,
      locked,
      unlocked,
      averageReviewTime,
      conflictCount,
    };
  }, [managedSubmissions]);

  // Event handlers
  const handleFilterChange = useCallback(
    (filters: Partial<AnswerFilterOptions>) => {
      setState(prev => ({
        ...prev,
        filterOptions: { ...prev.filterOptions, ...filters },
      }));
    },
    []
  );

  const handleSortChange = useCallback((sort: AnswerSortOptions) => {
    setState(prev => ({
      ...prev,
      sortOptions: sort,
    }));
  }, []);

  const handleSubmissionReview = useCallback(
    async (action: AnswerReviewAction) => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Update submission status locally (in real app, this would be handled by backend)
        const updatedSubmissions = managedSubmissions.map(sub =>
          sub.submissionId === action.submissionId
            ? {
                ...sub,
                reviewStatus:
                  action.action === 'approve'
                    ? ('approved' as const)
                    : action.action === 'reject'
                      ? ('rejected' as const)
                      : ('needs-review' as const),
                reviewedAt: action.reviewedAt,
                reviewedBy: action.reviewedBy,
                hostFeedback: action.feedback,
                pointsAwarded: action.pointsAwarded,
              }
            : sub
        );

        // Call parent callback
        onSubmissionReviewed?.(action);

        // Remove from selected if it was selected
        setState(prev => {
          const newSelected = new Set(prev.selectedSubmissions);
          newSelected.delete(action.submissionId);
          return {
            ...prev,
            selectedSubmissions: newSelected,
            isLoading: false,
          };
        });
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to review submission',
        }));
      }
    },
    [managedSubmissions, onSubmissionReviewed]
  );

  const handleBulkAction = useCallback(
    async (action: BulkAnswerAction) => {
      try {
        setState(prev => ({
          ...prev,
          bulkActionInProgress: true,
          error: null,
        }));

        // Handle lock/unlock actions
        if (action.action === 'lock') {
          action.submissionIds.forEach(id => lockSubmission(id));
        } else if (action.action === 'unlock') {
          action.submissionIds.forEach(id => unlockSubmission(id));
        }

        // Call parent callback
        onBulkAction?.(action);

        // Clear selections
        setState(prev => ({
          ...prev,
          selectedSubmissions: new Set(),
          bulkActionInProgress: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          bulkActionInProgress: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to perform bulk action',
        }));
      }
    },
    [lockSubmission, unlockSubmission, onBulkAction]
  );

  const handleSubmissionSelect = useCallback(
    (submissionId: string, selected: boolean) => {
      setState(prev => {
        const newSelected = new Set(prev.selectedSubmissions);
        if (selected) {
          newSelected.add(submissionId);
        } else {
          newSelected.delete(submissionId);
        }
        return {
          ...prev,
          selectedSubmissions: newSelected,
        };
      });
    },
    []
  );

  const handleSelectAll = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedSubmissions: new Set(
        filteredAndSortedSubmissions.map(s => s.submissionId)
      ),
    }));
  }, [filteredAndSortedSubmissions]);

  const handleSelectNone = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedSubmissions: new Set(),
    }));
  }, []);

  const handleLockToggle = useCallback(
    (submissionId: string) => {
      const submission = managedSubmissions.find(
        s => s.submissionId === submissionId
      );
      if (submission) {
        if (submission.isLocked) {
          unlockSubmission(submissionId);
        } else {
          lockSubmission(submissionId);
        }
      }
    },
    [managedSubmissions, lockSubmission, unlockSubmission]
  );

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    // In real app, this would refetch data from backend
  }, []);

  const handleClearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filterOptions: {
        status: 'all',
        teamId: 'all',
        questionId: 'all',
        roundId: 'all',
        isLocked: 'all',
        hasConflict: 'all',
        searchTerm: '',
      },
    }));
  }, []);

  // Update state when props change
  useEffect(() => {
    setState(prev => ({
      ...prev,
      submissions: managedSubmissions,
      filteredSubmissions: filteredAndSortedSubmissions,
    }));
  }, [managedSubmissions, filteredAndSortedSubmissions]);

  // Notify parent of selection changes
  useEffect(() => {
    onSubmissionSelected?.(Array.from(state.selectedSubmissions));
  }, [state.selectedSubmissions, onSubmissionSelected]);

  const isLoading = gameLoading || submissionsLoading || state.isLoading;

  return (
    <div className={`answer-management-interface ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Target className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Answer Management
            </h2>
          </div>
          {statistics.total > 0 && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{statistics.total} submissions</span>
              <span>•</span>
              <span className="text-yellow-600">
                {statistics.pending} pending
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Stats Toggle */}
          <button
            onClick={() => setShowStats(!showStats)}
            className={`p-2 rounded-lg transition-colors ${
              showStats
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <AnswerStatsDashboard statistics={statistics} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Sort Controls */}
      <div className="mb-6">
        <AnswerFilterControls
          filterOptions={state.filterOptions}
          sortOptions={state.sortOptions}
          statistics={statistics}
          teams={Array.from(teamsMap.values()).map(team => ({
            id: team.teamId,
            name: team.teamId,
          }))}
          questions={Array.from(questionsMap.values()).map(q => ({
            id: q.id,
            text: q.text,
            number: q.questionNumber,
          }))}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          onClearFilters={handleClearFilters}
        />
      </div>

      {/* Bulk Action Controls */}
      {state.selectedSubmissions.size > 0 && (
        <div className="mb-6">
          <BulkActionControls
            selectedCount={state.selectedSubmissions.size}
            isActionInProgress={state.bulkActionInProgress}
            onBulkAction={handleBulkAction}
            onSelectAll={handleSelectAll}
            onSelectNone={handleSelectNone}
          />
        </div>
      )}

      {/* Error Display */}
      {state.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-800">{state.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Display */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-gray-600">Loading submissions...</p>
            </div>
          </div>
        ) : filteredAndSortedSubmissions.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600 mb-2">No submissions found</p>
            <p className="text-gray-500">
              {managedSubmissions.length === 0
                ? 'No answers have been submitted yet.'
                : 'Try adjusting your filters to see more submissions.'}
            </p>
            {managedSubmissions.length > 0 && (
              <button
                onClick={handleClearFilters}
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4'
                : 'space-y-3'
            }
          >
            <AnimatePresence>
              {filteredAndSortedSubmissions.map(submission => (
                <motion.div
                  key={submission.submissionId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <AnswerSubmissionCard
                    submission={submission}
                    teamName={
                      teamsMap.get(submission.participantId)?.teamId ||
                      'Unknown Team'
                    }
                    questionText={
                      questionsMap.get(submission.questionId)?.text ||
                      'Unknown Question'
                    }
                    questionNumber={
                      questionsMap.get(submission.questionId)?.questionNumber ||
                      0
                    }
                    isSelected={state.selectedSubmissions.has(
                      submission.submissionId
                    )}
                    showActions={true}
                    showTeamInfo={true}
                    showTimestamp={true}
                    onReview={handleSubmissionReview}
                    onSelect={handleSubmissionSelect}
                    onLockToggle={handleLockToggle}
                    className={viewMode === 'list' ? 'list-view' : ''}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Load More / Pagination could go here */}
      {filteredAndSortedSubmissions.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Showing {filteredAndSortedSubmissions.length} of {statistics.total}{' '}
            submissions
          </p>
        </div>
      )}
    </div>
  );
};

export { AnswerManagementInterface };

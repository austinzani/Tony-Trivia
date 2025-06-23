import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter,
  Search,
  SortAsc,
  SortDesc,
  X,
  ChevronDown,
  Users,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock,
  BarChart3,
} from 'lucide-react';
import type {
  AnswerFilterControlsProps,
  AnswerFilterOptions,
  AnswerSortOptions,
  AnswerReviewStatus,
} from '../../types/answerManagement';

const AnswerFilterControls: React.FC<AnswerFilterControlsProps> = ({
  filterOptions,
  sortOptions,
  statistics,
  teams,
  questions,
  onFilterChange,
  onSortChange,
  onClearFilters,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState(
    filterOptions.searchTerm || ''
  );

  // Status options with counts
  const statusOptions = [
    {
      value: 'all',
      label: 'All Statuses',
      count: statistics.total,
      icon: BarChart3,
    },
    {
      value: 'pending',
      label: 'Pending',
      count: statistics.pending,
      icon: Clock,
    },
    {
      value: 'approved',
      label: 'Approved',
      count: statistics.approved,
      icon: CheckCircle,
    },
    {
      value: 'rejected',
      label: 'Rejected',
      count: statistics.rejected,
      icon: XCircle,
    },
    {
      value: 'needs-review',
      label: 'Needs Review',
      count: statistics.needsReview,
      icon: AlertTriangle,
    },
    {
      value: 'auto-approved',
      label: 'Auto-Approved',
      count: statistics.autoApproved,
      icon: CheckCircle,
    },
  ];

  // Lock status options
  const lockOptions = [
    { value: 'all', label: 'All', count: statistics.total },
    { value: true, label: 'Locked', count: statistics.locked },
    { value: false, label: 'Unlocked', count: statistics.unlocked },
  ];

  // Sort field options
  const sortFields = [
    { value: 'submittedAt', label: 'Submitted Time' },
    { value: 'reviewedAt', label: 'Reviewed Time' },
    { value: 'teamName', label: 'Team Name' },
    { value: 'questionNumber', label: 'Question Number' },
    { value: 'pointValue', label: 'Point Value' },
    { value: 'reviewStatus', label: 'Review Status' },
  ];

  // Calculate active filter count
  const activeFilterCount = [
    filterOptions.status !== 'all',
    filterOptions.teamId !== 'all',
    filterOptions.questionId !== 'all',
    filterOptions.roundId !== 'all',
    typeof filterOptions.isLocked === 'boolean',
    typeof filterOptions.hasConflict === 'boolean',
    filterOptions.searchTerm,
  ].filter(Boolean).length;

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      onFilterChange({ searchTerm: value });
    },
    [onFilterChange]
  );

  const handleFilterChange = useCallback(
    (key: keyof AnswerFilterOptions, value: any) => {
      onFilterChange({ [key]: value });
    },
    [onFilterChange]
  );

  const handleSortFieldChange = useCallback(
    (field: AnswerSortOptions['field']) => {
      onSortChange({ ...sortOptions, field });
    },
    [sortOptions, onSortChange]
  );

  const handleSortDirectionToggle = useCallback(() => {
    onSortChange({
      ...sortOptions,
      direction: sortOptions.direction === 'asc' ? 'desc' : 'asc',
    });
  }, [sortOptions, onSortChange]);

  const handleClearAll = useCallback(() => {
    setSearchInput('');
    onClearFilters();
  }, [onClearFilters]);

  return (
    <div
      className={`answer-filter-controls bg-white rounded-lg border border-gray-200 ${className}`}
    >
      {/* Main Filter Bar */}
      <div className="p-4">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search answers, teams, questions..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              {searchInput && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Status Filters */}
          <div className="flex items-center space-x-2">
            {statusOptions.slice(1, 4).map(option => {
              const Icon = option.icon;
              const isActive = filterOptions.status === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() =>
                    handleFilterChange(
                      'status',
                      isActive ? 'all' : option.value
                    )
                  }
                  className={`
                    flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${
                      isActive
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{option.label}</span>
                  <span className="text-xs bg-white px-1.5 py-0.5 rounded-full">
                    {option.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <select
              value={sortOptions.field}
              onChange={e =>
                handleSortFieldChange(
                  e.target.value as AnswerSortOptions['field']
                )
              }
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {sortFields.map(field => (
                <option key={field.value} value={field.value}>
                  Sort by {field.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleSortDirectionToggle}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title={`Sort ${sortOptions.direction === 'asc' ? 'descending' : 'ascending'}`}
            >
              {sortOptions.direction === 'asc' ? (
                <SortAsc className="w-4 h-4 text-gray-700" />
              ) : (
                <SortDesc className="w-4 h-4 text-gray-700" />
              )}
            </button>
          </div>

          {/* Expand/Collapse Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
              flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors
              ${isExpanded ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
            `}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Clear Filters */}
          {activeFilterCount > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200"
          >
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Status
                  </label>
                  <select
                    value={filterOptions.status || 'all'}
                    onChange={e => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label} ({option.count})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Team Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team
                  </label>
                  <select
                    value={filterOptions.teamId || 'all'}
                    onChange={e => handleFilterChange('teamId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Teams</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question
                  </label>
                  <select
                    value={filterOptions.questionId || 'all'}
                    onChange={e =>
                      handleFilterChange('questionId', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Questions</option>
                    {questions.map(question => (
                      <option key={question.id} value={question.id}>
                        Q{question.number}: {question.text.substring(0, 30)}...
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lock Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lock Status
                  </label>
                  <select
                    value={
                      filterOptions.isLocked === true
                        ? 'true'
                        : filterOptions.isLocked === false
                          ? 'false'
                          : 'all'
                    }
                    onChange={e => {
                      const value =
                        e.target.value === 'all'
                          ? 'all'
                          : e.target.value === 'true';
                      handleFilterChange('isLocked', value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    {lockOptions.map(option => (
                      <option
                        key={String(option.value)}
                        value={String(option.value)}
                      >
                        {option.label} ({option.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Additional Filters */}
              <div className="flex items-center space-x-6">
                {/* Conflict Filter */}
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filterOptions.hasConflict === true}
                    onChange={e =>
                      handleFilterChange(
                        'hasConflict',
                        e.target.checked ? true : 'all'
                      )
                    }
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Show conflicts only
                    <span className="ml-1 text-xs text-gray-500">
                      ({statistics.conflictCount})
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && !isExpanded && (
        <div className="px-4 pb-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Active filters:</span>
            <div className="flex items-center space-x-1">
              {filterOptions.status !== 'all' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Status: {filterOptions.status}
                </span>
              )}
              {filterOptions.teamId !== 'all' && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Team:{' '}
                  {teams.find(t => t.id === filterOptions.teamId)?.name ||
                    filterOptions.teamId}
                </span>
              )}
              {filterOptions.searchTerm && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                  Search: {filterOptions.searchTerm}
                </span>
              )}
              {typeof filterOptions.isLocked === 'boolean' && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                  {filterOptions.isLocked ? 'Locked' : 'Unlocked'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { AnswerFilterControls };

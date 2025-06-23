import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  ScoreHistoryEntry,
  ScoreAdjustment,
} from '../../types/scoreManagement';
import {
  Trophy,
  Users,
  User,
  History,
  BarChart3,
  Filter,
  Search,
  Plus,
  Minus,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Download,
  RefreshCw,
} from 'lucide-react';
import { useScoreManager } from '../../hooks/useScoreManager';
import { useTeamFormation } from '../../hooks/useTeamFormation';
import type {
  ScoreManagementInterfaceProps,
  ScoreDisplayMode,
  ScoreManagementFilters,
  ScoreOverrideData,
} from '../../types/scoreManagement';
import { ScoreAdjustmentControls } from './ScoreAdjustmentControls';
import { ScoreHistoryDisplay } from './ScoreHistoryDisplay';
import { ScoreConfirmationDialog } from './ScoreConfirmationDialog';
import { QuestionScoreCard } from './QuestionScoreCard';
import { ScoreStatsDisplay } from './ScoreStatsDisplay';

export function ScoreManagementInterface({
  gameId,
  className = '',
  onScoreChanged,
  onError,
}: ScoreManagementInterfaceProps) {
  // State management
  const [displayMode, setDisplayMode] = useState<ScoreDisplayMode>('total');
  const [selectedEntity, setSelectedEntity] = useState<{
    id: string;
    type: 'team' | 'player';
    name: string;
  } | null>(null);
  const [filters, setFilters] = useState<ScoreManagementFilters>({
    entityType: 'all',
    adjustmentType: 'all',
    showReverted: false,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmationData, setConfirmationData] =
    useState<ScoreOverrideData | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Hooks
  const {
    scoreManager,
    playerScores,
    teamScores,
    leaderboard,
    isLoading: scoreLoading,
    error: scoreError,
  } = useScoreManager(gameId);
  const { teams, isLoading: teamsLoading, loadTeams } = useTeamFormation();

  // Load teams when gameId changes
  useEffect(() => {
    if (gameId) {
      loadTeams(gameId);
    }
  }, [gameId, loadTeams]);

  // Create score data structure for compatibility
  const scoreData = useMemo(
    () => ({
      teamScores: Object.fromEntries(teamScores),
      playerScores: Object.fromEntries(playerScores),
    }),
    [teamScores, playerScores]
  );

  // Extract players from teams
  const players = useMemo(() => {
    const allPlayers: Array<{
      id: string;
      username: string;
      email: string;
      teamId?: string;
    }> = [];
    teams.forEach(team => {
      team.team_members?.forEach(member => {
        allPlayers.push({
          id: member.user_id,
          username:
            member.profiles?.username ||
            member.profiles?.full_name ||
            'Unknown',
          email: member.profiles?.username || member.user_id,
          teamId: team.id,
        });
      });
    });
    return allPlayers;
  }, [teams]);

  // Score adjustment functions
  const adjustScore = useCallback(
    async (data: ScoreOverrideData) => {
      if (data.entityType === 'team') {
        const currentScore = teamScores.get(data.entityId);
        if (currentScore) {
          await scoreManager.updateTeamScore(data.entityId, {
            totalScore: data.newScore,
          });
        }
      } else {
        const currentScore = playerScores.get(data.entityId);
        if (currentScore) {
          await scoreManager.updatePlayerScore(data.entityId, {
            totalScore: data.newScore,
          });
        }
      }
    },
    [scoreManager, teamScores, playerScores]
  );

  const revertAdjustment = useCallback(
    async (adjustmentId: string, reason: string) => {
      // This would need to be implemented in the score manager
      console.log('Revert adjustment:', adjustmentId, reason);
    },
    []
  );

  // Mock score history and adjustments for now
  const scoreHistory: ScoreHistoryEntry[] = [];
  const adjustments: ScoreAdjustment[] = [];

  const isLoading = scoreLoading || teamsLoading;
  const error = scoreError;

  // Combined entities list for search and display
  const allEntities = useMemo(() => {
    const teamEntities = teams.map(team => ({
      id: team.id,
      type: 'team' as const,
      name: team.name,
      memberCount: team.team_members?.length || 0,
      score: scoreData.teamScores[team.id]?.totalScore || 0,
    }));

    const playerEntities = players.map(player => ({
      id: player.id,
      type: 'player' as const,
      name: player.username || player.email,
      teamName: teams.find(t =>
        t.team_members?.some(m => m.user_id === player.id)
      )?.name,
      score: scoreData.playerScores[player.id]?.totalScore || 0,
    }));

    return [...teamEntities, ...playerEntities];
  }, [teams, players, scoreData]);

  // Filtered entities based on search and filters
  const filteredEntities = useMemo(() => {
    let filtered = allEntities;

    // Apply type filter
    if (filters.entityType && filters.entityType !== 'all') {
      filtered = filtered.filter(entity => entity.type === filters.entityType);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        entity =>
          entity.name.toLowerCase().includes(term) ||
          ('teamName' in entity &&
            entity.teamName?.toLowerCase().includes(term))
      );
    }

    // Sort by score (descending)
    filtered.sort((a, b) => b.score - a.score);

    return filtered;
  }, [allEntities, filters.entityType, searchTerm]);

  // Handle score adjustment confirmation
  const handleScoreAdjustment = useCallback(
    async (data: ScoreOverrideData) => {
      try {
        await adjustScore(data);

        // Create adjustment record for callback
        const adjustment: ScoreAdjustment = {
          id: `adj_${Date.now()}`,
          type: data.questionId ? 'question' : 'total',
          entityId: data.entityId,
          entityType: data.entityType,
          questionId: data.questionId,
          previousScore: data.currentScore,
          newScore: data.newScore,
          adjustment: data.adjustment,
          reason: data.reason,
          adjustedBy: 'current-host', // TODO: Get from auth context
          timestamp: new Date(),
        };

        onScoreChanged?.(adjustment);
        setConfirmationData(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to adjust score';
        onError?.(errorMessage);
      }
    },
    [adjustScore, onScoreChanged, onError]
  );

  // Handle revert adjustment
  const handleRevertAdjustment = useCallback(
    async (adjustmentId: string) => {
      try {
        await revertAdjustment(adjustmentId, 'Manual revert by host');
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to revert adjustment';
        onError?.(errorMessage);
      }
    },
    [revertAdjustment, onError]
  );

  // Display mode configurations
  const displayModes: Array<{
    mode: ScoreDisplayMode;
    label: string;
    icon: React.ElementType;
    description: string;
  }> = [
    {
      mode: 'total',
      label: 'Total Scores',
      icon: Trophy,
      description: 'View overall scores',
    },
    {
      mode: 'by-question',
      label: 'By Question',
      icon: BarChart3,
      description: 'Individual question scores',
    },
    {
      mode: 'by-round',
      label: 'By Round',
      icon: Users,
      description: 'Round-by-round breakdown',
    },
    {
      mode: 'history',
      label: 'History',
      icon: History,
      description: 'Score change history',
    },
  ];

  // Get selected entity score data
  const selectedEntityData = useMemo(() => {
    if (!selectedEntity) return null;

    const entityData =
      selectedEntity.type === 'team'
        ? scoreData.teamScores[selectedEntity.id]
        : scoreData.playerScores[selectedEntity.id];

    return entityData
      ? {
          ...selectedEntity,
          totalScore: entityData.totalScore,
          questionScores: entityData.questionScores || [],
        }
      : null;
  }, [selectedEntity, scoreData]);

  return (
    <div className={`score-management-interface space-y-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex flex-col space-y-4">
        {/* Title and Quick Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Score Management
              </h2>
              <p className="text-gray-600">Adjust scores and track changes</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowStats(!showStats)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                showStats
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`px-3 py-2 rounded-lg transition-colors ${
                showHistory
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <History className="w-4 h-4" />
            </button>
            <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Display Mode Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {displayModes.map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setDisplayMode(mode)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                displayMode === mode
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{label}</span>
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search teams or players..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filters.entityType || 'all'}
            onChange={e =>
              setFilters(prev => ({
                ...prev,
                entityType: e.target.value as 'team' | 'player' | 'all',
              }))
            }
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Entities</option>
            <option value="team">Teams Only</option>
            <option value="player">Players Only</option>
          </select>
        </div>
      </div>

      {/* Stats Display */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <ScoreStatsDisplay
              stats={{
                totalAdjustments: adjustments.length,
                manualAdjustments: adjustments.filter(
                  a => a.adjustedBy !== 'system'
                ).length,
                automaticScores: adjustments.filter(
                  a => a.adjustedBy === 'system'
                ).length,
                revertedAdjustments: adjustments.filter(a => a.isReverted)
                  .length,
                averageAdjustment:
                  adjustments.reduce(
                    (sum, a) => sum + Math.abs(a.adjustment),
                    0
                  ) / adjustments.length || 0,
                largestPositiveAdjustment: Math.max(
                  ...adjustments.map(a => a.adjustment),
                  0
                ),
                largestNegativeAdjustment: Math.min(
                  ...adjustments.map(a => a.adjustment),
                  0
                ),
                teamsAffected: new Set(
                  adjustments
                    .filter(a => a.entityType === 'team')
                    .map(a => a.entityId)
                ).size,
                playersAffected: new Set(
                  adjustments
                    .filter(a => a.entityType === 'player')
                    .map(a => a.entityId)
                ).size,
                questionsAffected: new Set(
                  adjustments.filter(a => a.questionId).map(a => a.questionId)
                ).size,
              }}
              showDetailed={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entity List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">
              {filters.entityType === 'team'
                ? 'Teams'
                : filters.entityType === 'player'
                  ? 'Players'
                  : 'Teams & Players'}
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredEntities.map(entity => (
                <div
                  key={`${entity.type}-${entity.id}`}
                  onClick={() => setSelectedEntity(entity)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedEntity?.id === entity.id &&
                    selectedEntity?.type === entity.type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {entity.type === 'team' ? (
                        <Users className="w-5 h-5 text-blue-600" />
                      ) : (
                        <User className="w-5 h-5 text-green-600" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {entity.name}
                        </p>
                        {entity.type === 'team' && (
                          <p className="text-sm text-gray-500">
                            {entity.memberCount} members
                          </p>
                        )}
                        {'teamName' in entity && entity.teamName && (
                          <p className="text-sm text-gray-500">
                            Team: {entity.teamName}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {entity.score}
                      </p>
                      <p className="text-xs text-gray-500">points</p>
                    </div>
                  </div>
                </div>
              ))}

              {filteredEntities.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No entities found</p>
                  <p className="text-sm">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Score Management Panel */}
        <div className="lg:col-span-2">
          {selectedEntityData ? (
            <div className="space-y-6">
              {/* Entity Header */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-3 rounded-lg ${
                        selectedEntityData.type === 'team'
                          ? 'bg-blue-100'
                          : 'bg-green-100'
                      }`}
                    >
                      {selectedEntityData.type === 'team' ? (
                        <Users
                          className={`w-6 h-6 ${selectedEntityData.type === 'team' ? 'text-blue-600' : 'text-green-600'}`}
                        />
                      ) : (
                        <User
                          className={`w-6 h-6 ${selectedEntityData.type === 'team' ? 'text-blue-600' : 'text-green-600'}`}
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {selectedEntityData.name}
                      </h3>
                      <p className="text-gray-600 capitalize">
                        {selectedEntityData.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">
                      {selectedEntityData.totalScore}
                    </p>
                    <p className="text-gray-600">Total Points</p>
                  </div>
                </div>

                {/* Score Adjustment Controls */}
                <ScoreAdjustmentControls
                  entityId={selectedEntityData.id}
                  entityType={selectedEntityData.type}
                  entityName={selectedEntityData.name}
                  currentScore={selectedEntityData.totalScore}
                  onAdjust={setConfirmationData}
                  disabled={isLoading}
                />
              </div>

              {/* Question Scores */}
              {displayMode === 'by-question' &&
                selectedEntityData.questionScores.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">
                      Question Scores
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedEntityData.questionScores.map(questionScore => (
                        <QuestionScoreCard
                          key={questionScore.questionId}
                          questionData={questionScore}
                          entityType={selectedEntityData.type}
                          onScoreChange={(questionId, newScore, reason) => {
                            setConfirmationData({
                              entityId: selectedEntityData.id,
                              entityType: selectedEntityData.type,
                              entityName: selectedEntityData.name,
                              currentScore: questionScore.currentScore,
                              newScore,
                              adjustment: newScore - questionScore.currentScore,
                              reason,
                              questionId,
                              questionText: questionScore.questionText,
                            });
                          }}
                          canEdit={true}
                        />
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Select an Entity
              </h3>
              <p className="text-gray-600">
                Choose a team or player from the list to manage their scores
              </p>
            </div>
          )}
        </div>
      </div>

      {/* History Display */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <ScoreHistoryDisplay
              history={scoreHistory}
              filters={filters}
              onFilterChange={newFilters =>
                setFilters(prev => ({ ...prev, ...newFilters }))
              }
              onRevert={handleRevertAdjustment}
              showActions={true}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      {confirmationData && (
        <ScoreConfirmationDialog
          isOpen={true}
          data={confirmationData}
          onConfirm={() => handleScoreAdjustment(confirmationData)}
          onCancel={() => setConfirmationData(null)}
        />
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span className="text-gray-900">Updating scores...</span>
          </div>
        </div>
      )}
    </div>
  );
}

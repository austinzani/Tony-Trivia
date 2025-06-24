import { useEffect, useCallback, useRef, useState } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { 
  TeamLevelUpdateHandlers, 
  UpdateDataTransformers, 
  UpdatePerformanceOptimizer,
  TeamAnswerUpdate,
  TeamUpdate,
  TeamMemberUpdate,
  TeamScoreUpdate
} from '../services/realtimeUpdateHandlers';
import { useTeamSubscription } from './useChannelSubscriptions';

// Types for team update callbacks
export interface TeamUpdateCallbacks {
  // Answer submission callbacks
  onAnswerSubmitted?: (answer: TeamAnswerUpdate) => void;
  onAnswerReviewed?: (answer: TeamAnswerUpdate) => void;
  onAnswerScored?: (answer: TeamAnswerUpdate) => void;
  onAnswerStatusChange?: (answer: TeamAnswerUpdate) => void;
  
  // Team member callbacks
  onMemberJoined?: (member: TeamMemberUpdate) => void;
  onMemberLeft?: (member: TeamMemberUpdate) => void;
  onCaptainChanged?: (member: TeamMemberUpdate) => void;
  onMemberActivity?: (member: TeamMemberUpdate) => void;
  
  // Team status callbacks
  onTeamStatusChange?: (team: TeamUpdate) => void;
  onReadinessChange?: (team: TeamUpdate) => void;
  onTeamNameChange?: (team: TeamUpdate) => void;
  
  // Score callbacks
  onScoreUpdate?: (score: TeamScoreUpdate) => void;
  onRankChange?: (score: TeamScoreUpdate) => void;
  onPointsAwarded?: (score: TeamScoreUpdate) => void;
}

export interface TeamUpdateState {
  currentTeam: TeamUpdate | null;
  teamAnswers: TeamAnswerUpdate[];
  teamMembers: TeamMemberUpdate[];
  currentScore: TeamScoreUpdate | null;
  lastActivity: string | null;
  answerCount: number;
  memberCount: number;
  updateCount: number;
}

/**
 * Enhanced hook for handling team-level real-time updates
 */
export function useEnhancedTeamUpdates(
  teamId: string,
  callbacks: TeamUpdateCallbacks = {},
  options: {
    enablePerformanceOptimization?: boolean;
    debounceDelay?: number;
    trackAnswerHistory?: boolean;
    trackMemberActivity?: boolean;
  } = {}
) {
  const { 
    enablePerformanceOptimization = true, 
    debounceDelay = 100,
    trackAnswerHistory = true,
    trackMemberActivity = true
  } = options;

  // State for tracking updates
  const [updateState, setUpdateState] = useState<TeamUpdateState>({
    currentTeam: null,
    teamAnswers: [],
    teamMembers: [],
    currentScore: null,
    lastActivity: null,
    answerCount: 0,
    memberCount: 0,
    updateCount: 0,
  });

  // Refs for stable callback references
  const callbacksRef = useRef(callbacks);
  const updateCountRef = useRef(0);

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Answer submission update handler
  const handleAnswerUpdate = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    const transformedUpdate = UpdateDataTransformers.transformTeamAnswerUpdate(payload);
    if (!transformedUpdate) return;

    // Performance optimization
    if (enablePerformanceOptimization) {
      const shouldProcess = UpdatePerformanceOptimizer.shouldProcessUpdate(
        `team_answer_${teamId}_${transformedUpdate.id}`,
        transformedUpdate
      );
      if (!shouldProcess) return;
    }

    const processUpdate = (update: TeamAnswerUpdate) => {
      setUpdateState(prev => {
        let updatedAnswers = [...prev.teamAnswers];

        switch (payload.eventType) {
          case 'INSERT':
            if (trackAnswerHistory) {
              updatedAnswers.push(update);
            } else {
              // Keep only the latest answer
              updatedAnswers = [update];
            }
            break;
          case 'UPDATE':
            const index = updatedAnswers.findIndex(answer => answer.id === update.id);
            if (index !== -1) {
              updatedAnswers[index] = update;
            } else if (trackAnswerHistory) {
              updatedAnswers.push(update);
            }
            break;
          case 'DELETE':
            updatedAnswers = updatedAnswers.filter(answer => answer.id !== update.id);
            break;
        }

        return {
          ...prev,
          teamAnswers: updatedAnswers,
          answerCount: updatedAnswers.length,
          lastActivity: new Date().toISOString(),
          updateCount: ++updateCountRef.current,
        };
      });

      // Call handlers
      TeamLevelUpdateHandlers.handleAnswerSubmission(payload, {
        onAnswerSubmitted: callbacksRef.current.onAnswerSubmitted,
        onAnswerReviewed: callbacksRef.current.onAnswerReviewed,
        onAnswerScored: callbacksRef.current.onAnswerScored,
        onAnswerStatusChange: callbacksRef.current.onAnswerStatusChange,
      });
    };

    if (enablePerformanceOptimization) {
      UpdatePerformanceOptimizer.debounceUpdate(
        `team_answer_update_${teamId}_${transformedUpdate.id}`,
        transformedUpdate,
        processUpdate,
        debounceDelay
      );
    } else {
      processUpdate(transformedUpdate);
    }
  }, [teamId, enablePerformanceOptimization, debounceDelay, trackAnswerHistory]);

  // Team member update handler
  const handleMemberUpdate = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    const transformedUpdate = UpdateDataTransformers.transformTeamMemberUpdate(payload);
    if (!transformedUpdate) return;

    // Performance optimization
    if (enablePerformanceOptimization) {
      const shouldProcess = UpdatePerformanceOptimizer.shouldProcessUpdate(
        `team_member_${teamId}_${transformedUpdate.id}`,
        transformedUpdate
      );
      if (!shouldProcess) return;
    }

    const processUpdate = (update: TeamMemberUpdate) => {
      setUpdateState(prev => {
        let updatedMembers = [...prev.teamMembers];

        switch (payload.eventType) {
          case 'INSERT':
            updatedMembers.push(update);
            break;
          case 'UPDATE':
            const index = updatedMembers.findIndex(member => member.id === update.id);
            if (index !== -1) {
              updatedMembers[index] = update;
            }
            break;
          case 'DELETE':
            updatedMembers = updatedMembers.filter(member => member.id !== update.id);
            break;
        }

        return {
          ...prev,
          teamMembers: updatedMembers,
          memberCount: updatedMembers.length,
          lastActivity: trackMemberActivity ? new Date().toISOString() : prev.lastActivity,
          updateCount: ++updateCountRef.current,
        };
      });

      // Call handlers
      TeamLevelUpdateHandlers.handleTeamMemberActivity(payload, {
        onMemberJoined: callbacksRef.current.onMemberJoined,
        onMemberLeft: callbacksRef.current.onMemberLeft,
        onCaptainChanged: callbacksRef.current.onCaptainChanged,
        onMemberActivity: callbacksRef.current.onMemberActivity,
      });
    };

    if (enablePerformanceOptimization) {
      UpdatePerformanceOptimizer.debounceUpdate(
        `team_member_update_${teamId}_${transformedUpdate.id}`,
        transformedUpdate,
        processUpdate,
        debounceDelay
      );
    } else {
      processUpdate(transformedUpdate);
    }
  }, [teamId, enablePerformanceOptimization, debounceDelay, trackMemberActivity]);

  // Team status update handler
  const handleTeamStatusUpdate = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    const transformedUpdate = UpdateDataTransformers.transformTeamUpdate(payload);
    if (!transformedUpdate) return;

    // Performance optimization
    if (enablePerformanceOptimization) {
      const shouldProcess = UpdatePerformanceOptimizer.shouldProcessUpdate(
        `team_status_${teamId}`,
        transformedUpdate
      );
      if (!shouldProcess) return;
    }

    const processUpdate = (update: TeamUpdate) => {
      setUpdateState(prev => ({
        ...prev,
        currentTeam: update,
        lastActivity: new Date().toISOString(),
        updateCount: ++updateCountRef.current,
      }));

      // Call handlers
      TeamLevelUpdateHandlers.handleTeamStatusUpdate(payload, {
        onTeamStatusChange: callbacksRef.current.onTeamStatusChange,
        onReadinessChange: callbacksRef.current.onReadinessChange,
        onTeamNameChange: callbacksRef.current.onTeamNameChange,
      });
    };

    if (enablePerformanceOptimization) {
      UpdatePerformanceOptimizer.debounceUpdate(
        `team_status_update_${teamId}`,
        transformedUpdate,
        processUpdate,
        debounceDelay
      );
    } else {
      processUpdate(transformedUpdate);
    }
  }, [teamId, enablePerformanceOptimization, debounceDelay]);

  // Team score update handler
  const handleScoreUpdate = useCallback(async () => {
    if (enablePerformanceOptimization) {
      const shouldProcess = UpdatePerformanceOptimizer.shouldProcessUpdate(
        `team_score_${teamId}`,
        { timestamp: Date.now() }
      );
      if (!shouldProcess) return;
    }

    const processScoreUpdate = async () => {
      await TeamLevelUpdateHandlers.handleTeamScoreUpdate(teamId, {
        onScoreUpdate: (score) => {
          setUpdateState(prev => ({
            ...prev,
            currentScore: score,
            lastActivity: new Date().toISOString(),
            updateCount: ++updateCountRef.current,
          }));
          callbacksRef.current.onScoreUpdate?.(score);
        },
        onRankChange: callbacksRef.current.onRankChange,
        onPointsAwarded: callbacksRef.current.onPointsAwarded,
      });
    };

    if (enablePerformanceOptimization) {
      UpdatePerformanceOptimizer.debounceUpdate(
        `team_score_update_${teamId}`,
        {},
        processScoreUpdate,
        debounceDelay * 1.5 // Slightly longer delay for score updates
      );
    } else {
      await processScoreUpdate();
    }
  }, [teamId, enablePerformanceOptimization, debounceDelay]);

  // Subscribe to team updates using the subscription hook
  const { isLoading, error, isConnected } = useTeamSubscription(teamId, {
    onAnswerUpdate: handleAnswerUpdate,
    onMemberUpdate: handleMemberUpdate,
    onTeamUpdate: handleTeamStatusUpdate,
    onScoreUpdate: handleScoreUpdate,
    onStatusChange: handleTeamStatusUpdate,
  });

  // Cleanup performance optimizer on unmount
  useEffect(() => {
    return () => {
      if (enablePerformanceOptimization) {
        UpdatePerformanceOptimizer.clearCache();
      }
    };
  }, [enablePerformanceOptimization]);

  // Manual refresh functions
  const refreshScore = useCallback(() => {
    handleScoreUpdate();
  }, [handleScoreUpdate]);

  const refreshTeamData = useCallback(() => {
    // Trigger a refresh of all team data
    handleScoreUpdate();
  }, [handleScoreUpdate]);

  // Get latest answer
  const getLatestAnswer = useCallback(() => {
    if (updateState.teamAnswers.length === 0) return null;
    return updateState.teamAnswers.reduce((latest, current) => 
      new Date(current.submitted_at) > new Date(latest.submitted_at) ? current : latest
    );
  }, [updateState.teamAnswers]);

  // Get answers for specific question
  const getAnswersForQuestion = useCallback((questionId: string) => {
    return updateState.teamAnswers.filter(answer => answer.question_id === questionId);
  }, [updateState.teamAnswers]);

  // Get team member by user ID
  const getMember = useCallback((userId: string) => {
    return updateState.teamMembers.find(member => member.user_id === userId) || null;
  }, [updateState.teamMembers]);

  // Check if user is team captain
  const isCaptain = useCallback((userId: string) => {
    return updateState.currentTeam?.captain_id === userId;
  }, [updateState.currentTeam]);

  // Get team captain
  const getCaptain = useCallback(() => {
    if (!updateState.currentTeam?.captain_id) return null;
    return getMember(updateState.currentTeam.captain_id);
  }, [updateState.currentTeam, getMember]);

  // Check if team is ready
  const isTeamReady = useCallback(() => {
    return updateState.currentTeam?.is_ready === true;
  }, [updateState.currentTeam]);

  // Get current team rank
  const getCurrentRank = useCallback(() => {
    return updateState.currentScore?.current_rank || null;
  }, [updateState.currentScore]);

  // Get total points
  const getTotalPoints = useCallback(() => {
    return updateState.currentScore?.total_score || 0;
  }, [updateState.currentScore]);

  // Check if answer was submitted for question
  const hasAnsweredQuestion = useCallback((questionId: string) => {
    return updateState.teamAnswers.some(answer => 
      answer.question_id === questionId && answer.status !== 'draft'
    );
  }, [updateState.teamAnswers]);

  return {
    // State
    ...updateState,
    
    // Connection status
    isLoading,
    error,
    isConnected,
    
    // Utility functions
    refreshScore,
    refreshTeamData,
    getLatestAnswer,
    getAnswersForQuestion,
    getMember,
    isCaptain,
    getCaptain,
    isTeamReady,
    getCurrentRank,
    getTotalPoints,
    hasAnsweredQuestion,
    
    // Performance metrics
    updateCount: updateState.updateCount,
    lastActivity: updateState.lastActivity,
  };
}

/**
 * Simplified hook for basic team updates
 */
export function useBasicTeamUpdates(teamId: string) {
  return useEnhancedTeamUpdates(teamId, {}, {
    enablePerformanceOptimization: false,
    trackAnswerHistory: false,
    trackMemberActivity: false,
  });
}

/**
 * Hook optimized for answer submission tracking
 */
export function useAnswerTrackingUpdates(
  teamId: string,
  callbacks: Pick<TeamUpdateCallbacks, 'onAnswerSubmitted' | 'onAnswerReviewed' | 'onAnswerScored'> = {}
) {
  return useEnhancedTeamUpdates(teamId, callbacks, {
    enablePerformanceOptimization: true,
    debounceDelay: 50, // Fast response for answers
    trackAnswerHistory: true,
    trackMemberActivity: false,
  });
}

/**
 * Hook focused on team member management
 */
export function useTeamMemberUpdates(
  teamId: string,
  callbacks: Pick<TeamUpdateCallbacks, 'onMemberJoined' | 'onMemberLeft' | 'onCaptainChanged'> = {}
) {
  return useEnhancedTeamUpdates(teamId, callbacks, {
    enablePerformanceOptimization: true,
    debounceDelay: 100,
    trackAnswerHistory: false,
    trackMemberActivity: true,
  });
}

/**
 * Hook for score and ranking updates
 */
export function useTeamScoreUpdates(
  teamId: string,
  onScoreChange?: (score: TeamScoreUpdate) => void
) {
  return useEnhancedTeamUpdates(teamId, {
    onScoreUpdate: onScoreChange,
    onRankChange: onScoreChange,
    onPointsAwarded: onScoreChange,
  }, {
    enablePerformanceOptimization: true,
    debounceDelay: 150, // Moderate delay for scores
    trackAnswerHistory: false,
    trackMemberActivity: false,
  });
} 
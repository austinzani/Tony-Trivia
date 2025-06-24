import { useEffect, useCallback, useRef, useState } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { 
  RoomLevelUpdateHandlers, 
  UpdateDataTransformers, 
  UpdatePerformanceOptimizer,
  GameRoomUpdate,
  GameStateUpdate,
  TeamUpdate,
  LeaderboardUpdate
} from '../services/realtimeUpdateHandlers';
import { ChannelSubscriptionService } from '../services/channelSubscriptionService';
import { useRoomSubscription } from './useChannelSubscriptions';

// Types for room update callbacks
export interface RoomUpdateCallbacks {
  // Game room callbacks
  onGameStatusChange?: (update: GameRoomUpdate) => void;
  onGameSettingsChange?: (update: GameRoomUpdate) => void;
  onGameStart?: (update: GameRoomUpdate) => void;
  onGameEnd?: (update: GameRoomUpdate) => void;
  
  // Game state callbacks
  onPhaseChange?: (update: GameStateUpdate) => void;
  onQuestionChange?: (update: GameStateUpdate) => void;
  onTimerUpdate?: (update: GameStateUpdate) => void;
  onRoundChange?: (update: GameStateUpdate) => void;
  
  // Team roster callbacks
  onTeamJoined?: (team: TeamUpdate) => void;
  onTeamLeft?: (team: TeamUpdate) => void;
  onTeamUpdated?: (team: TeamUpdate) => void;
  onMemberCountChange?: (team: TeamUpdate) => void;
  
  // Leaderboard callbacks
  onLeaderboardUpdate?: (leaderboard: LeaderboardUpdate) => void;
  onScoreChange?: (leaderboard: LeaderboardUpdate) => void;
  onRankChange?: (leaderboard: LeaderboardUpdate) => void;
}

export interface RoomUpdateState {
  currentGameRoom: GameRoomUpdate | null;
  currentGameState: GameStateUpdate | null;
  teams: TeamUpdate[];
  leaderboard: LeaderboardUpdate | null;
  lastUpdate: string | null;
  updateCount: number;
}

/**
 * Enhanced hook for handling room-level real-time updates
 */
export function useEnhancedRoomUpdates(
  roomId: string,
  callbacks: RoomUpdateCallbacks = {},
  options: {
    enablePerformanceOptimization?: boolean;
    debounceDelay?: number;
    batchUpdates?: boolean;
  } = {}
) {
  const { 
    enablePerformanceOptimization = true, 
    debounceDelay = 100,
    batchUpdates = true 
  } = options;

  // State for tracking updates
  const [updateState, setUpdateState] = useState<RoomUpdateState>({
    currentGameRoom: null,
    currentGameState: null,
    teams: [],
    leaderboard: null,
    lastUpdate: null,
    updateCount: 0,
  });

  // Refs for stable callback references
  const callbacksRef = useRef(callbacks);
  const updateCountRef = useRef(0);

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  // Game room update handler
  const handleGameRoomUpdate = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    const transformedUpdate = UpdateDataTransformers.transformGameRoomUpdate(payload);
    if (!transformedUpdate) return;

    // Performance optimization
    if (enablePerformanceOptimization) {
      const shouldProcess = UpdatePerformanceOptimizer.shouldProcessUpdate(
        `game_room_${roomId}`,
        transformedUpdate
      );
      if (!shouldProcess) return;
    }

    const processUpdate = (update: GameRoomUpdate) => {
      setUpdateState(prev => ({
        ...prev,
        currentGameRoom: update,
        lastUpdate: new Date().toISOString(),
        updateCount: ++updateCountRef.current,
      }));

      // Call handlers
      RoomLevelUpdateHandlers.handleGameRoomUpdate(payload, {
        onStatusChange: callbacksRef.current.onGameStatusChange,
        onSettingsChange: callbacksRef.current.onGameSettingsChange,
        onGameStart: callbacksRef.current.onGameStart,
        onGameEnd: callbacksRef.current.onGameEnd,
      });
    };

    if (enablePerformanceOptimization) {
      UpdatePerformanceOptimizer.debounceUpdate(
        `game_room_update_${roomId}`,
        transformedUpdate,
        processUpdate,
        debounceDelay
      );
    } else {
      processUpdate(transformedUpdate);
    }
  }, [roomId, enablePerformanceOptimization, debounceDelay]);

  // Game state update handler
  const handleGameStateUpdate = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    const transformedUpdate = UpdateDataTransformers.transformGameStateUpdate(payload);
    if (!transformedUpdate) return;

    // Performance optimization
    if (enablePerformanceOptimization) {
      const shouldProcess = UpdatePerformanceOptimizer.shouldProcessUpdate(
        `game_state_${roomId}`,
        transformedUpdate
      );
      if (!shouldProcess) return;
    }

    const processUpdate = (update: GameStateUpdate) => {
      setUpdateState(prev => ({
        ...prev,
        currentGameState: update,
        lastUpdate: new Date().toISOString(),
        updateCount: ++updateCountRef.current,
      }));

      // Call handlers
      RoomLevelUpdateHandlers.handleGameStateUpdate(payload, {
        onPhaseChange: callbacksRef.current.onPhaseChange,
        onQuestionChange: callbacksRef.current.onQuestionChange,
        onTimerUpdate: callbacksRef.current.onTimerUpdate,
        onRoundChange: callbacksRef.current.onRoundChange,
      });
    };

    if (enablePerformanceOptimization) {
      UpdatePerformanceOptimizer.debounceUpdate(
        `game_state_update_${roomId}`,
        transformedUpdate,
        processUpdate,
        debounceDelay
      );
    } else {
      processUpdate(transformedUpdate);
    }
  }, [roomId, enablePerformanceOptimization, debounceDelay]);

  // Team roster update handler
  const handleTeamRosterUpdate = useCallback((payload: RealtimePostgresChangesPayload<any>) => {
    const transformedUpdate = UpdateDataTransformers.transformTeamUpdate(payload);
    if (!transformedUpdate) return;

    // Performance optimization
    if (enablePerformanceOptimization) {
      const shouldProcess = UpdatePerformanceOptimizer.shouldProcessUpdate(
        `team_roster_${roomId}_${transformedUpdate.id}`,
        transformedUpdate
      );
      if (!shouldProcess) return;
    }

    const processUpdate = (update: TeamUpdate) => {
      setUpdateState(prev => {
        let updatedTeams = [...prev.teams];

        switch (payload.eventType) {
          case 'INSERT':
            updatedTeams.push(update);
            break;
          case 'UPDATE':
            const index = updatedTeams.findIndex(team => team.id === update.id);
            if (index !== -1) {
              updatedTeams[index] = update;
            }
            break;
          case 'DELETE':
            updatedTeams = updatedTeams.filter(team => team.id !== update.id);
            break;
        }

        return {
          ...prev,
          teams: updatedTeams,
          lastUpdate: new Date().toISOString(),
          updateCount: ++updateCountRef.current,
        };
      });

      // Call handlers
      RoomLevelUpdateHandlers.handleTeamRosterUpdate(payload, {
        onTeamJoined: callbacksRef.current.onTeamJoined,
        onTeamLeft: callbacksRef.current.onTeamLeft,
        onTeamUpdated: callbacksRef.current.onTeamUpdated,
        onMemberCountChange: callbacksRef.current.onMemberCountChange,
      });
    };

    if (enablePerformanceOptimization) {
      UpdatePerformanceOptimizer.debounceUpdate(
        `team_roster_update_${roomId}_${transformedUpdate.id}`,
        transformedUpdate,
        processUpdate,
        debounceDelay
      );
    } else {
      processUpdate(transformedUpdate);
    }
  }, [roomId, enablePerformanceOptimization, debounceDelay]);

  // Leaderboard update handler
  const handleLeaderboardUpdate = useCallback(async () => {
    if (enablePerformanceOptimization) {
      const shouldProcess = UpdatePerformanceOptimizer.shouldProcessUpdate(
        `leaderboard_${roomId}`,
        { timestamp: Date.now() }
      );
      if (!shouldProcess) return;
    }

    const processLeaderboardUpdate = async () => {
      await RoomLevelUpdateHandlers.handleLeaderboardUpdate(roomId, {
        onLeaderboardUpdate: (leaderboard) => {
          setUpdateState(prev => ({
            ...prev,
            leaderboard,
            lastUpdate: new Date().toISOString(),
            updateCount: ++updateCountRef.current,
          }));
          callbacksRef.current.onLeaderboardUpdate?.(leaderboard);
        },
        onScoreChange: callbacksRef.current.onScoreChange,
        onRankChange: callbacksRef.current.onRankChange,
      });
    };

    if (enablePerformanceOptimization) {
      UpdatePerformanceOptimizer.debounceUpdate(
        `leaderboard_update_${roomId}`,
        {},
        processLeaderboardUpdate,
        debounceDelay * 2 // Longer delay for leaderboard updates
      );
    } else {
      await processLeaderboardUpdate();
    }
  }, [roomId, enablePerformanceOptimization, debounceDelay]);

  // Subscribe to room updates using the subscription hook
  const { isLoading, error, isConnected } = useRoomSubscription(roomId, {
    onGameRoomUpdate: handleGameRoomUpdate,
    onGameStateUpdate: handleGameStateUpdate,
    onTeamUpdate: handleTeamRosterUpdate,
    onLeaderboardUpdate: handleLeaderboardUpdate,
    onQuestionUpdate: () => {
      // Trigger leaderboard update when questions change
      handleLeaderboardUpdate();
    },
    onTimerUpdate: handleGameStateUpdate,
  });

  // Cleanup performance optimizer on unmount
  useEffect(() => {
    return () => {
      if (enablePerformanceOptimization) {
        UpdatePerformanceOptimizer.clearCache();
      }
    };
  }, [enablePerformanceOptimization]);

  // Manual refresh function
  const refreshLeaderboard = useCallback(() => {
    handleLeaderboardUpdate();
  }, [handleLeaderboardUpdate]);

  // Get specific team data
  const getTeam = useCallback((teamId: string) => {
    return updateState.teams.find(team => team.id === teamId) || null;
  }, [updateState.teams]);

  // Get team count
  const getTeamCount = useCallback(() => {
    return updateState.teams.length;
  }, [updateState.teams]);

  // Check if game is active
  const isGameActive = useCallback(() => {
    return updateState.currentGameRoom?.status === 'active' || 
           updateState.currentGameState?.status === 'active';
  }, [updateState.currentGameRoom, updateState.currentGameState]);

  // Get current question time remaining
  const getTimeRemaining = useCallback(() => {
    if (!updateState.currentGameState?.question_start_time) return 0;
    
    return UpdateDataTransformers.calculateTimeRemaining(
      updateState.currentGameState.question_start_time,
      updateState.currentGameState.time_remaining
    );
  }, [updateState.currentGameState]);

  return {
    // State
    ...updateState,
    
    // Connection status
    isLoading,
    error,
    isConnected,
    
    // Utility functions
    refreshLeaderboard,
    getTeam,
    getTeamCount,
    isGameActive,
    getTimeRemaining,
    
    // Performance metrics
    updateCount: updateState.updateCount,
    lastUpdate: updateState.lastUpdate,
  };
}

/**
 * Simplified hook for basic room updates
 */
export function useBasicRoomUpdates(roomId: string) {
  return useEnhancedRoomUpdates(roomId, {}, {
    enablePerformanceOptimization: false,
    batchUpdates: false,
  });
}

/**
 * Hook optimized for high-frequency updates
 */
export function useHighFrequencyRoomUpdates(
  roomId: string, 
  callbacks: RoomUpdateCallbacks = {}
) {
  return useEnhancedRoomUpdates(roomId, callbacks, {
    enablePerformanceOptimization: true,
    debounceDelay: 50, // Faster debounce
    batchUpdates: true,
  });
}

/**
 * Hook for leaderboard-focused updates
 */
export function useLeaderboardUpdates(
  roomId: string,
  onLeaderboardChange?: (leaderboard: LeaderboardUpdate) => void
) {
  return useEnhancedRoomUpdates(roomId, {
    onLeaderboardUpdate: onLeaderboardChange,
    onScoreChange: onLeaderboardChange,
    onRankChange: onLeaderboardChange,
  }, {
    enablePerformanceOptimization: true,
    debounceDelay: 200, // Slower for leaderboard
  });
} 
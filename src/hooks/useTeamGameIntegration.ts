import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { useTeamPresence } from './useTeamPresence';
import { 
  teamGameIntegration,
  type GameTeamState,
  type TeamGameEvent,
  type GameReadinessCheck,
} from '../services/teamGameIntegration';

interface UseTeamGameIntegrationProps {
  teamId: string;
  gameRoomId: string;
  enabled?: boolean;
}

interface UseTeamGameIntegrationReturn {
  // State
  gameTeamState: GameTeamState | null;
  teamEvents: TeamGameEvent[];
  readinessCheck: GameReadinessCheck | null;
  leaderboard: Array<{
    teamId: string;
    teamName: string;
    score: number;
    rank: number;
    memberCount: number;
    onlineMembers: number;
    lastActivity: string;
  }>;
  
  // Status
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  
  // Actions
  updateReadiness: (isReady: boolean) => Promise<boolean>;
  submitAnswer: (questionId: string, answer: string, pointValue?: number) => Promise<{ success: boolean; error?: string }>;
  refreshGameState: () => Promise<void>;
  clearEvents: () => void;
  
  // Team coordination
  isTeamReady: boolean;
  readyMemberCount: number;
  totalMemberCount: number;
  unreadyMembers: string[];
  
  // Game integration
  canSubmitAnswer: boolean;
  hasSubmittedAnswer: boolean;
  currentQuestion: GameTeamState['currentQuestion'];
  teamAnswer: GameTeamState['teamAnswer'];
  teamScore: number;
  teamRank: number;
}

export function useTeamGameIntegration({
  teamId,
  gameRoomId,
  enabled = true,
}: UseTeamGameIntegrationProps): UseTeamGameIntegrationReturn {
  const { user } = useAuth();
  const { members, updateStatus, broadcastActivity } = useTeamPresence(teamId);
  
  // State
  const [gameTeamState, setGameTeamState] = useState<GameTeamState | null>(null);
  const [teamEvents, setTeamEvents] = useState<TeamGameEvent[]>([]);
  const [readinessCheck, setReadinessCheck] = useState<GameReadinessCheck | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Refs
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial game state
  const loadGameState = useCallback(async () => {
    if (!enabled || !teamId || !gameRoomId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const state = await teamGameIntegration.getTeamGameState(teamId, gameRoomId);
      setGameTeamState(state);
      
      // Load readiness check for this team's game room
      const allTeamsReadiness = await teamGameIntegration.checkGameReadiness(gameRoomId);
      const teamReadiness = allTeamsReadiness.find(check => check.teamId === teamId);
      setReadinessCheck(teamReadiness || null);
      
      // Load leaderboard
      const leaderboardData = await teamGameIntegration.getTeamLeaderboard(gameRoomId);
      setLeaderboard(leaderboardData);
      
    } catch (err) {
      console.error('Error loading game state:', err);
      setError(err instanceof Error ? err.message : 'Failed to load game state');
    } finally {
      setIsLoading(false);
    }
  }, [teamId, gameRoomId, enabled]);

  // Handle team game events
  const handleTeamGameEvent = useCallback((event: TeamGameEvent) => {
    console.log('Team game event received:', event);
    
    setTeamEvents(prev => [...prev, event].slice(-50)); // Keep last 50 events
    
    // Update game state based on event type
    switch (event.type) {
      case 'member_ready':
      case 'member_unready':
        // Refresh readiness check
        teamGameIntegration.checkGameReadiness(gameRoomId).then(checks => {
          const teamCheck = checks.find(check => check.teamId === teamId);
          setReadinessCheck(teamCheck || null);
        });
        break;
        
      case 'answer_submitted':
        // Update game state to reflect answer submission
        setGameTeamState(prev => prev ? {
          ...prev,
          teamAnswer: {
            answer: event.payload.answer,
            pointValue: event.payload.pointValue,
            submittedAt: event.timestamp,
            submittedBy: event.payload.submittedBy,
          }
        } : null);
        break;
        
      case 'score_updated':
        // Update team score
        setGameTeamState(prev => prev ? {
          ...prev,
          score: event.payload.totalScore || prev.score + event.payload.points,
        } : null);
        
        // Refresh leaderboard
        teamGameIntegration.getTeamLeaderboard(gameRoomId).then(setLeaderboard);
        break;
        
      case 'question_started':
        // Refresh game state for new question
        loadGameState();
        break;
        
      case 'question_ended':
        // Clear current question
        setGameTeamState(prev => prev ? {
          ...prev,
          currentQuestion: undefined,
          teamAnswer: undefined,
        } : null);
        break;
    }
    
    // Broadcast activity to team presence
    broadcastActivity({
      type: 'game_event',
      description: `Game event: ${event.type.replace('_', ' ')}`,
      metadata: { 
        eventType: event.type, 
        payload: event.payload,
        gameRoomId,
      }
    });
  }, [teamId, gameRoomId, loadGameState, broadcastActivity]);

  // Subscribe to team game events
  useEffect(() => {
    if (!enabled || !teamId || !gameRoomId) return;
    
    const unsubscribe = teamGameIntegration.subscribeToTeamGameEvents(
      gameRoomId,
      teamId,
      handleTeamGameEvent
    );
    
    unsubscribeRef.current = unsubscribe;
    setIsConnected(true);
    
    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [teamId, gameRoomId, enabled, handleTeamGameEvent]);

  // Load initial data
  useEffect(() => {
    loadGameState();
  }, [loadGameState]);

  // Set up periodic refresh for game state
  useEffect(() => {
    if (!enabled || !teamId || !gameRoomId) return;
    
    // Refresh every 30 seconds during active game
    refreshIntervalRef.current = setInterval(() => {
      if (gameTeamState?.status === 'active') {
        loadGameState();
      }
    }, 30000);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [enabled, teamId, gameRoomId, gameTeamState?.status, loadGameState]);

  // Update member readiness
  const updateReadiness = useCallback(async (isReady: boolean) => {
    if (!user?.id || !teamId || !gameRoomId) return false;
    
    try {
      const success = await teamGameIntegration.updateMemberReadiness(
        teamId,
        gameRoomId,
        user.id,
        isReady
      );
      
      if (success) {
        // Update local presence status
        updateStatus(isReady ? 'ready' : 'online');
        
        // Refresh readiness check
        const checks = await teamGameIntegration.checkGameReadiness(gameRoomId);
        const teamCheck = checks.find(check => check.teamId === teamId);
        setReadinessCheck(teamCheck || null);
      }
      
      return success;
    } catch (error) {
      console.error('Error updating readiness:', error);
      return false;
    }
  }, [user?.id, teamId, gameRoomId, updateStatus]);

  // Submit team answer
  const submitAnswer = useCallback(async (
    questionId: string, 
    answer: string, 
    pointValue: number = 1
  ) => {
    if (!user?.id || !teamId || !gameRoomId) {
      return { success: false, error: 'Missing required information' };
    }
    
    try {
      const result = await teamGameIntegration.submitTeamAnswer(
        teamId,
        gameRoomId,
        questionId,
        answer,
        pointValue,
        user.id
      );
      
      if (result.success) {
        // Update local game state
        setGameTeamState(prev => prev ? {
          ...prev,
          teamAnswer: {
            answer,
            pointValue,
            submittedAt: new Date().toISOString(),
            submittedBy: user.email || user.id,
          }
        } : null);
      }
      
      return result;
    } catch (error) {
      console.error('Error submitting answer:', error);
      return { success: false, error: 'Failed to submit answer' };
    }
  }, [user, teamId, gameRoomId]);

  // Clear events
  const clearEvents = useCallback(() => {
    setTeamEvents([]);
  }, []);

  // Refresh game state
  const refreshGameState = useCallback(async () => {
    await loadGameState();
  }, [loadGameState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Computed values
  const isTeamReady = readinessCheck?.isReady || false;
  const readyMemberCount = readinessCheck?.readyMembers || 0;
  const totalMemberCount = readinessCheck?.totalMembers || 0;
  const unreadyMembers = readinessCheck?.memberStatuses
    .filter(member => !member.isReady)
    .map(member => member.username) || [];
  
  const canSubmitAnswer = Boolean(
    gameTeamState?.currentQuestion && 
    !gameTeamState?.teamAnswer &&
    gameTeamState?.status === 'active'
  );
  
  const hasSubmittedAnswer = Boolean(gameTeamState?.teamAnswer);
  const currentQuestion = gameTeamState?.currentQuestion;
  const teamAnswer = gameTeamState?.teamAnswer;
  const teamScore = gameTeamState?.score || 0;
  const teamRank = gameTeamState?.rank || 0;

  return {
    // State
    gameTeamState,
    teamEvents,
    readinessCheck,
    leaderboard,
    
    // Status
    isLoading,
    error,
    isConnected,
    
    // Actions
    updateReadiness,
    submitAnswer,
    refreshGameState,
    clearEvents,
    
    // Team coordination
    isTeamReady,
    readyMemberCount,
    totalMemberCount,
    unreadyMembers,
    
    // Game integration
    canSubmitAnswer,
    hasSubmittedAnswer,
    currentQuestion,
    teamAnswer,
    teamScore,
    teamRank,
  };
} 
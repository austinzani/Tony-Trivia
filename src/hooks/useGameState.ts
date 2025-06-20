import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { 
  useGameRoomSubscription, 
  useTeamSubscription, 
  useGameStateSubscription,
  useTeamAnswersSubscription 
} from './useRealtimeSubscription';
import { useAuth } from './useAuth';
import { 
  GameState, 
  GameAction, 
  GameEvent, 
  GameStateUpdate,
  GamePhase,
  ActiveQuestion,
  PlayerScore,
  TeamScore,
  Round,
  PointValue
} from '../types/game';
import { GameStateManager } from '../services/gameStateManager';

interface GameRoom {
  id: string;
  code: string;
  name: string;
  host_id: string;
  max_teams: number;
  is_public: boolean;
  status: 'lobby' | 'active' | 'paused' | 'finished';
  settings: Record<string, any>;
  created_at: string;
  started_at?: string;
  ended_at?: string;
}

interface Team {
  id: string;
  game_room_id: string;
  name: string;
  score: number;
  created_at: string;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'captain' | 'member';
  joined_at: string;
}

interface GameState {
  id: string;
  game_room_id: string;
  current_round_id?: string;
  current_question_id?: string;
  status: 'lobby' | 'active' | 'paused' | 'question_active' | 'reviewing' | 'finished';
  question_start_time?: string;
  question_end_time?: string;
  last_updated: string;
  metadata: Record<string, any>;
}

interface GameRound {
  id: string;
  game_room_id: string;
  round_number: number;
  round_type: 'standard' | 'picture' | 'wager' | 'lightning';
  time_limit: number;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  status: 'pending' | 'active' | 'completed';
  started_at?: string;
  ended_at?: string;
  created_at: string;
}

interface Question {
  id: string;
  game_round_id: string;
  question_order: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_text: string;
  correct_answer: string;
  incorrect_answers: string[];
  media_url?: string;
  points: number;
  time_limit: number;
  created_at: string;
}

interface TeamAnswer {
  id: string;
  team_id: string;
  question_id: string;
  game_round_id: string;
  answer: string;
  is_correct?: boolean;
  points_earned: number;
  submitted_at: string;
  submitted_by: string;
}

export interface UseGameStateReturn {
  // State
  gameState: GameState | null;
  phase: GamePhase | null;
  currentRound: Round | null;
  currentQuestion: ActiveQuestion | null;
  isLoading: boolean;
  error: string | null;
  
  // Computed values
  isGameActive: boolean;
  isGamePaused: boolean;
  isGameComplete: boolean;
  canSubmitAnswers: boolean;
  timeRemaining: number;
  
  // Player/Team data
  playerScore: PlayerScore | null;
  teamScore: TeamScore | null;
  leaderboard: (PlayerScore | TeamScore)[];
  
  // Actions
  startGame: () => Promise<void>;
  pauseGame: () => Promise<void>;
  resumeGame: () => Promise<void>;
  endGame: () => Promise<void>;
  
  // Round actions
  startRound: () => Promise<void>;
  endRound: () => Promise<void>;
  
  // Question actions
  presentQuestion: (questionId: string) => Promise<void>;
  submitAnswer: (answer: string, pointValue: PointValue) => Promise<void>;
  lockAnswers: () => Promise<void>;
  revealAnswers: () => Promise<void>;
  advanceQuestion: () => Promise<void>;
  skipQuestion: () => Promise<void>;
  
  // Player management
  addPlayer: (playerId: string, teamId?: string) => Promise<void>;
  removePlayer: (playerId: string) => Promise<void>;
  
  // Team management
  formTeam: (teamId: string, playerIds: string[]) => Promise<void>;
  
  // Utility
  refresh: () => void;
  reset: () => void;
}

export interface UseGameStateOptions {
  gameId?: string;
  playerId?: string;
  teamId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useGameState(
  initialState?: GameState,
  options: UseGameStateOptions = {}
): UseGameStateReturn {
  const {
    gameId,
    playerId,
    teamId,
    autoRefresh = true,
    refreshInterval = 1000
  } = options;

  const { user } = useAuth();
  
  // State
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(initialState || null);
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [teamAnswers, setTeamAnswers] = useState<TeamAnswer[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Refs
  const gameManagerRef = useRef<GameStateManager | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const stateListenerRef = useRef<(() => void) | null>(null);
  const eventListenerRef = useRef<(() => void) | null>(null);

  // Real-time subscription callbacks
  const handleGameRoomUpdate = useCallback((payload: any) => {
    console.log('Game room update:', payload);
    if (payload.eventType === 'UPDATE' && payload.new) {
      setGameRoom(payload.new);
    } else if (payload.eventType === 'DELETE') {
      setGameRoom(null);
    }
  }, []);

  const handleTeamUpdate = useCallback((payload: any) => {
    console.log('Team update:', payload);
    if (payload.eventType === 'INSERT' && payload.new) {
      setTeams(prev => [...prev, payload.new]);
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      setTeams(prev => prev.map(team => 
        team.id === payload.new.id ? payload.new : team
      ));
    } else if (payload.eventType === 'DELETE' && payload.old) {
      setTeams(prev => prev.filter(team => team.id !== payload.old.id));
    }
  }, []);

  const handleGameStateUpdate = useCallback((payload: any) => {
    console.log('Game state update:', payload);
    if (payload.eventType === 'UPDATE' && payload.new) {
      setGameState(payload.new);
    } else if (payload.eventType === 'INSERT' && payload.new) {
      setGameState(payload.new);
    }
  }, []);

  const handleTeamAnswerUpdate = useCallback((payload: any) => {
    console.log('Team answer update:', payload);
    if (payload.eventType === 'INSERT' && payload.new) {
      setTeamAnswers(prev => [...prev, payload.new]);
    } else if (payload.eventType === 'UPDATE' && payload.new) {
      setTeamAnswers(prev => prev.map(answer => 
        answer.id === payload.new.id ? payload.new : answer
      ));
    }
  }, []);

  // Set up real-time subscriptions
  const gameRoomSub = useGameRoomSubscription(gameId || '', handleGameRoomUpdate);
  const teamSub = useTeamSubscription(gameId || '', handleTeamUpdate);
  const gameStateSub = useGameStateSubscription(gameId || '', handleGameStateUpdate);
  const teamAnswersSub = useTeamAnswersSubscription(gameId || '', handleTeamAnswerUpdate);

  // Initialize game manager
  useEffect(() => {
    if (initialState && !gameManagerRef.current) {
      try {
        gameManagerRef.current = new GameStateManager(initialState);
        setGameState(initialState);
        
        // Set up state listener
        stateListenerRef.current = gameManagerRef.current.addStateListener(
          (update: GameStateUpdate) => {
            setGameState(prev => prev ? { ...prev, ...update.data } : null);
          }
        );
        
        // Set up event listener
        eventListenerRef.current = gameManagerRef.current.addEventListener(
          (event: GameEvent) => {
            console.log('Game event:', event);
            
            // Handle specific events
            switch (event.type) {
              case 'timer-warning':
                // Could trigger UI notifications
                break;
              case 'timer-expired':
                setTimeRemaining(0);
                break;
              case 'game-ended':
                if (event.data?.error) {
                  setError(event.data.error);
                }
                break;
            }
          }
        );
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize game');
      }
    }
  }, [initialState]);

  // Timer updates
  useEffect(() => {
    if (gameState?.currentQuestion && autoRefresh) {
      const updateTimer = () => {
        const questionTimer = Object.values(gameState.timers).find(
          timer => timer.type === 'question' && timer.isActive
        );
        
        if (questionTimer) {
          setTimeRemaining(questionTimer.remaining);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      
      return () => clearInterval(interval);
    }
  }, [gameState?.currentQuestion, gameState?.timers, autoRefresh]);

  // Auto-refresh game state
  useEffect(() => {
    if (autoRefresh && gameState?.isActive) {
      refreshIntervalRef.current = setInterval(() => {
        if (gameManagerRef.current) {
          const currentState = gameManagerRef.current.getState();
          setGameState(currentState);
        }
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, gameState?.isActive]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (stateListenerRef.current) {
        stateListenerRef.current();
      }
      if (eventListenerRef.current) {
        eventListenerRef.current();
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (gameManagerRef.current) {
        gameManagerRef.current.destroy();
      }
    };
  }, []);

  // Action handlers
  const executeAction = useCallback(async (action: Omit<GameAction, 'gameId' | 'timestamp'>) => {
    if (!gameManagerRef.current || !gameState) {
      throw new Error('Game not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      await gameManagerRef.current.executeAction({
        ...action,
        gameId: gameState.id,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Action failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [gameState]);

  // Game lifecycle actions
  const startGame = useCallback(() => executeAction({ type: 'start-game' }), [executeAction]);
  const pauseGame = useCallback(() => executeAction({ type: 'pause-game' }), [executeAction]);
  const resumeGame = useCallback(() => executeAction({ type: 'resume-game' }), [executeAction]);
  const endGame = useCallback(() => executeAction({ type: 'end-game' }), [executeAction]);

  // Round actions
  const startRound = useCallback(() => executeAction({ type: 'start-round' }), [executeAction]);
  const endRound = useCallback(() => executeAction({ type: 'end-round' }), [executeAction]);

  // Question actions
  const presentQuestion = useCallback(
    (questionId: string) => executeAction({ 
      type: 'present-question', 
      payload: { questionId } 
    }), 
    [executeAction]
  );

  const submitAnswer = useCallback(
    (answer: string, pointValue: PointValue) => executeAction({
      type: 'submit-answer',
      playerId,
      teamId,
      payload: { playerId, teamId, answer, pointValue }
    }),
    [executeAction, playerId, teamId]
  );

  const lockAnswers = useCallback(() => executeAction({ type: 'lock-answers' }), [executeAction]);
  const revealAnswers = useCallback(() => executeAction({ type: 'reveal-answers' }), [executeAction]);
  const advanceQuestion = useCallback(() => executeAction({ type: 'advance-question' }), [executeAction]);
  const skipQuestion = useCallback(() => executeAction({ type: 'skip-question' }), [executeAction]);

  // Player management
  const addPlayer = useCallback(
    (playerIdToAdd: string, teamIdToAdd?: string) => executeAction({
      type: 'add-player',
      playerId: playerIdToAdd,
      payload: { playerId: playerIdToAdd, teamId: teamIdToAdd }
    }),
    [executeAction]
  );

  const removePlayer = useCallback(
    (playerIdToRemove: string) => executeAction({
      type: 'remove-player',
      playerId: playerIdToRemove,
      payload: { playerId: playerIdToRemove }
    }),
    [executeAction]
  );

  // Team management
  const formTeam = useCallback(
    (teamIdToForm: string, playerIds: string[]) => executeAction({
      type: 'form-team',
      payload: { teamId: teamIdToForm, playerIds }
    }),
    [executeAction]
  );

  // Utility functions
  const refresh = useCallback(() => {
    if (gameManagerRef.current) {
      const currentState = gameManagerRef.current.getState();
      setGameState(currentState);
    }
  }, []);

  const reset = useCallback(() => {
    setGameState(null);
    setError(null);
    setIsLoading(false);
    setTimeRemaining(0);
    
    if (gameManagerRef.current) {
      gameManagerRef.current.destroy();
      gameManagerRef.current = null;
    }
  }, []);

  // Computed values
  const phase = gameState?.phase || null;
  const currentRound = gameState ? gameManagerRef.current?.getCurrentRound() || null : null;
  const currentQuestion = gameState?.currentQuestion || null;
  const isGameActive = gameState?.isActive || false;
  const isGamePaused = gameState?.isPaused || false;
  const isGameComplete = gameState?.isComplete || false;
  const canSubmitAnswers = phase === 'answer-submission' && !currentQuestion?.isLocked;
  
  // Player/Team scores
  const playerScore = playerId && gameState ? gameState.players[playerId] || null : null;
  const teamScore = teamId && gameState ? gameState.teams[teamId] || null : null;
  
  // Leaderboard
  const leaderboard = gameState ? [
    ...Object.values(gameState.players),
    ...Object.values(gameState.teams)
  ].sort((a, b) => b.totalPoints - a.totalPoints) : [];

  return {
    // State
    gameState,
    phase,
    currentRound,
    currentQuestion,
    isLoading,
    error,
    
    // Computed values
    isGameActive,
    isGamePaused,
    isGameComplete,
    canSubmitAnswers,
    timeRemaining,
    
    // Player/Team data
    playerScore,
    teamScore,
    leaderboard,
    
    // Actions
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    
    // Round actions
    startRound,
    endRound,
    
    // Question actions
    presentQuestion,
    submitAnswer,
    lockAnswers,
    revealAnswers,
    advanceQuestion,
    skipQuestion,
    
    // Player management
    addPlayer,
    removePlayer,
    
    // Team management
    formTeam,
    
    // Utility
    refresh,
    reset
  };
} 
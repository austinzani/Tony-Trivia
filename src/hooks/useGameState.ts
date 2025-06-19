import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { 
  useGameRoomSubscription, 
  useTeamSubscription, 
  useGameStateSubscription,
  useTeamAnswersSubscription 
} from './useRealtimeSubscription';
import { useAuth } from './useAuth';

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

interface UseGameStateReturn {
  // Data
  gameRoom: GameRoom | null;
  teams: Team[];
  gameState: GameState | null;
  currentRound: GameRound | null;
  currentQuestion: Question | null;
  teamAnswers: TeamAnswer[];
  userTeam: Team | null;
  isHost: boolean;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Real-time connection status
  connectionStatus: {
    gameRoom: boolean;
    teams: boolean;
    gameState: boolean;
    teamAnswers: boolean;
  };
  
  // Actions
  joinGame: (roomCode: string) => Promise<{ success: boolean; error?: string }>;
  createTeam: (teamName: string) => Promise<{ success: boolean; error?: string }>;
  joinTeam: (teamId: string) => Promise<{ success: boolean; error?: string }>;
  leaveTeam: () => Promise<{ success: boolean; error?: string }>;
  startGame: () => Promise<{ success: boolean; error?: string }>;
  submitAnswer: (questionId: string, answer: string) => Promise<{ success: boolean; error?: string }>;
  
  // Utilities
  refreshData: () => Promise<void>;
}

export function useGameState(roomId?: string): UseGameStateReturn {
  const { user } = useAuth();
  
  // State
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [teamAnswers, setTeamAnswers] = useState<TeamAnswer[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const gameRoomSub = useGameRoomSubscription(roomId || '', handleGameRoomUpdate);
  const teamSub = useTeamSubscription(roomId || '', handleTeamUpdate);
  const gameStateSub = useGameStateSubscription(roomId || '', handleGameStateUpdate);
  const teamAnswersSub = useTeamAnswersSubscription(roomId || '', handleTeamAnswerUpdate);

  // Connection status
  const connectionStatus = useMemo(() => ({
    gameRoom: gameRoomSub.state.isConnected,
    teams: teamSub.state.isConnected,
    gameState: gameStateSub.state.isConnected,
    teamAnswers: teamAnswersSub.state.isConnected,
  }), [
    gameRoomSub.state.isConnected,
    teamSub.state.isConnected,
    gameStateSub.state.isConnected,
    teamAnswersSub.state.isConnected,
  ]);

  // Derived state
  const userTeam = useMemo(() => {
    if (!user || !teams.length || !teamMembers.length) return null;
    
    const userMembership = teamMembers.find(member => member.user_id === user.id);
    if (!userMembership) return null;
    
    return teams.find(team => team.id === userMembership.team_id) || null;
  }, [user, teams, teamMembers]);

  const isHost = useMemo(() => {
    return user && gameRoom ? gameRoom.host_id === user.id : false;
  }, [user, gameRoom]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!roomId) return;

    try {
      setLoading(true);
      setError(null);

      // Load game room
      const { data: roomData, error: roomError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) throw roomError;
      setGameRoom(roomData);

      // Load teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('game_room_id', roomId)
        .order('created_at');

      if (teamsError) throw teamsError;
      setTeams(teamsData || []);

      // Load team members
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .in('team_id', (teamsData || []).map(team => team.id));

      if (membersError) throw membersError;
      setTeamMembers(membersData || []);

      // Load game state
      const { data: stateData, error: stateError } = await supabase
        .from('game_state')
        .select('*')
        .eq('game_room_id', roomId)
        .single();

      if (stateError && stateError.code !== 'PGRST116') throw stateError;
      setGameState(stateData);

      // Load current round if exists
      if (stateData?.current_round_id) {
        const { data: roundData, error: roundError } = await supabase
          .from('game_rounds')
          .select('*')
          .eq('id', stateData.current_round_id)
          .single();

        if (roundError) throw roundError;
        setCurrentRound(roundData);
      }

      // Load current question if exists
      if (stateData?.current_question_id) {
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .select('*')
          .eq('id', stateData.current_question_id)
          .single();

        if (questionError) throw questionError;
        setCurrentQuestion(questionData);
      }

    } catch (err) {
      console.error('Error loading game data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load game data');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Load data when roomId changes
  useEffect(() => {
    if (roomId) {
      loadInitialData();
    }
  }, [roomId, loadInitialData]);

  // Actions
  const joinGame = useCallback(async (roomCode: string) => {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('code', roomCode.toUpperCase())
        .single();

      if (error) {
        return { success: false, error: 'Game not found' };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to join game' };
    }
  }, []);

  const createTeam = useCallback(async (teamName: string) => {
    if (!user || !roomId) {
      return { success: false, error: 'User not authenticated or no room ID' };
    }

    try {
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert([{
          game_room_id: roomId,
          name: teamName,
        }])
        .select()
        .single();

      if (teamError) throw teamError;

      // Add user to team as captain
      const { error: memberError } = await supabase
        .from('team_members')
        .insert([{
          team_id: teamData.id,
          user_id: user.id,
          role: 'captain',
        }]);

      if (memberError) throw memberError;

      return { success: true };
    } catch (err) {
      console.error('Error creating team:', err);
      return { success: false, error: 'Failed to create team' };
    }
  }, [user, roomId]);

  const joinTeam = useCallback(async (teamId: string) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const { error } = await supabase
        .from('team_members')
        .insert([{
          team_id: teamId,
          user_id: user.id,
          role: 'member',
        }]);

      if (error) throw error;

      return { success: true };
    } catch (err) {
      console.error('Error joining team:', err);
      return { success: false, error: 'Failed to join team' };
    }
  }, [user]);

  const leaveTeam = useCallback(async () => {
    if (!user || !userTeam) {
      return { success: false, error: 'No team to leave' };
    }

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', userTeam.id)
        .eq('user_id', user.id);

      if (error) throw error;

      return { success: true };
    } catch (err) {
      console.error('Error leaving team:', err);
      return { success: false, error: 'Failed to leave team' };
    }
  }, [user, userTeam]);

  const startGame = useCallback(async () => {
    if (!isHost || !roomId) {
      return { success: false, error: 'Only the host can start the game' };
    }

    try {
      // Update game room status
      const { error: roomError } = await supabase
        .from('game_rooms')
        .update({ 
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .eq('id', roomId);

      if (roomError) throw roomError;

      // Create or update game state
      const { error: stateError } = await supabase
        .from('game_state')
        .upsert([{
          game_room_id: roomId,
          status: 'active',
        }]);

      if (stateError) throw stateError;

      return { success: true };
    } catch (err) {
      console.error('Error starting game:', err);
      return { success: false, error: 'Failed to start game' };
    }
  }, [isHost, roomId]);

  const submitAnswer = useCallback(async (questionId: string, answer: string) => {
    if (!user || !userTeam || !currentRound) {
      return { success: false, error: 'Cannot submit answer' };
    }

    try {
      const { error } = await supabase
        .from('team_answers')
        .insert([{
          team_id: userTeam.id,
          question_id: questionId,
          game_round_id: currentRound.id,
          answer,
          submitted_by: user.id,
        }]);

      if (error) throw error;

      return { success: true };
    } catch (err) {
      console.error('Error submitting answer:', err);
      return { success: false, error: 'Failed to submit answer' };
    }
  }, [user, userTeam, currentRound]);

  const refreshData = useCallback(async () => {
    await loadInitialData();
  }, [loadInitialData]);

  return {
    // Data
    gameRoom,
    teams,
    gameState,
    currentRound,
    currentQuestion,
    teamAnswers,
    userTeam,
    isHost,
    
    // Loading states
    loading,
    error,
    
    // Real-time connection status
    connectionStatus,
    
    // Actions
    joinGame,
    createTeam,
    joinTeam,
    leaveTeam,
    startGame,
    submitAnswer,
    
    // Utilities
    refreshData,
  };
} 
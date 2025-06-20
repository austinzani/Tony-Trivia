import { useState, useCallback, useEffect, useRef } from 'react';
import { TeamsApi } from '../services/apiService';
import { useAuth } from './useAuth';
import { supabase } from '../services/supabase';

interface TeamFormationData {
  name: string;
  maxMembers: number;
  color: string;
  description?: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: 'captain' | 'member';
  joined_at: string;
  profiles?: {
    username: string;
    full_name?: string;
    avatar_url?: string;
  };
}

interface Team {
  id: string;
  name: string;
  game_room_id: string;
  color?: string;
  description?: string;
  score?: number;
  created_at: string;
  team_members?: TeamMember[];
}

interface UseTeamFormationReturn {
  // State
  teams: Team[];
  userTeam: Team | null;
  existingTeamNames: string[];
  isLoading: boolean;
  error: string | null;

  // Team Formation Actions
  createTeam: (teamData: TeamFormationData, gameRoomId: string) => Promise<{ success: boolean; error?: string; team?: Team }>;
  joinTeam: (teamId: string) => Promise<{ success: boolean; error?: string }>;
  leaveTeam: (teamId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Team Management Actions
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<{ success: boolean; error?: string }>;
  removeMember: (teamId: string, memberId: string) => Promise<{ success: boolean; error?: string }>;
  promoteMember: (teamId: string, memberId: string) => Promise<{ success: boolean; error?: string }>;
  
  // Data Management
  loadTeams: (gameRoomId: string) => Promise<void>;
  refreshTeams: () => Promise<void>;
  
  // Validation
  validateTeamName: (name: string, gameRoomId: string) => Promise<{ isValid: boolean; error?: string }>;
  canJoinTeam: (team: Team) => boolean;
  canManageTeam: (team: Team) => boolean;
}

export function useTeamFormation(): UseTeamFormationReturn {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentGameRoomId, setCurrentGameRoomId] = useState<string | null>(null);
  const realtimeChannelRef = useRef<any>(null);

  // Derived state
  const userTeam = teams.find(team => 
    team.team_members?.some(member => member.user_id === user?.id)
  ) || null;

  const existingTeamNames = teams.map(team => team.name);

  // Load teams for a game room
  const loadTeams = useCallback(async (gameRoomId: string) => {
    if (!gameRoomId) return;
    
    setIsLoading(true);
    setError(null);
    setCurrentGameRoomId(gameRoomId);

    try {
      const response = await TeamsApi.listTeamsByGameRoom(gameRoomId);
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to load teams');
      }

      setTeams(response.data || []);
      
      // Setup real-time sync after loading teams
      if (gameRoomId !== currentGameRoomId) {
        setupRealtimeSync(gameRoomId);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load teams';
      setError(errorMessage);
      console.error('Error loading teams:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Real-time team updates with optimistic UI updates
  const setupRealtimeSync = useCallback((gameRoomId: string) => {
    if (realtimeChannelRef.current) {
      realtimeChannelRef.current.unsubscribe();
    }

    const channel = supabase.channel(`teams:${gameRoomId}`);
    
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'teams',
        filter: `game_room_id=eq.${gameRoomId}`
      }, (payload) => {
        console.log('Team created:', payload.new);
        setTeams(prev => {
          const exists = prev.find(t => t.id === payload.new.id);
          if (exists) return prev;
          return [...prev, payload.new];
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'teams',
        filter: `game_room_id=eq.${gameRoomId}`
      }, (payload) => {
        console.log('Team updated:', payload.new);
        setTeams(prev => prev.map(team => 
          team.id === payload.new.id ? { ...team, ...payload.new } : team
        ));
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'teams',
        filter: `game_room_id=eq.${gameRoomId}`
      }, (payload) => {
        console.log('Team deleted:', payload.old);
        setTeams(prev => prev.filter(team => team.id !== payload.old.id));
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'team_members'
      }, (payload) => {
        console.log('Team member change detected:', payload);
        // For member changes, we need to reload to get the full member data with profiles
        // Use a simple API call to avoid circular dependencies
        setTimeout(async () => {
          try {
            const response = await TeamsApi.listTeamsByGameRoom(gameRoomId);
            if (!response.error && response.data) {
              setTeams(response.data);
            }
          } catch (err) {
            console.error('Error refreshing teams after member change:', err);
          }
        }, 100);
      })
      .subscribe((status) => {
        console.log(`Team realtime subscription status: ${status}`);
      });

    realtimeChannelRef.current = channel;
  }, []);

  // Cleanup real-time subscription on unmount
  useEffect(() => {
    return () => {
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.unsubscribe();
        realtimeChannelRef.current = null;
      }
    };
  }, []);

  // Refresh teams
  const refreshTeams = useCallback(async () => {
    if (currentGameRoomId) {
      await loadTeams(currentGameRoomId);
    }
  }, [currentGameRoomId, loadTeams]);

  // Validate team name
  const validateTeamName = useCallback(async (name: string, gameRoomId: string) => {
    if (!name.trim()) {
      return { isValid: false, error: 'Team name is required' };
    }

    if (name.length < 2) {
      return { isValid: false, error: 'Team name must be at least 2 characters' };
    }

    if (name.length > 30) {
      return { isValid: false, error: 'Team name must be less than 30 characters' };
    }

    // Check for profanity (basic implementation)
    const profanityWords = ['damn', 'hell', 'stupid', 'idiot']; // Add more as needed
    const containsProfanity = profanityWords.some(word => 
      name.toLowerCase().includes(word.toLowerCase())
    );

    if (containsProfanity) {
      return { isValid: false, error: 'Team name contains inappropriate language' };
    }

    // Check if name already exists
    if (existingTeamNames.includes(name.trim())) {
      return { isValid: false, error: 'This team name is already taken' };
    }

    return { isValid: true };
  }, [existingTeamNames]);

  // Create team
  const createTeam = useCallback(async (teamData: TeamFormationData, gameRoomId: string) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Validate team name
    const validation = await validateTeamName(teamData.name, gameRoomId);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create team
      const teamResponse = await TeamsApi.createTeam({
        name: teamData.name.trim(),
        game_room_id: gameRoomId,
        color: teamData.color,
        score: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (teamResponse.error || !teamResponse.data) {
        throw new Error(teamResponse.error?.message || 'Failed to create team');
      }

      const newTeam = teamResponse.data;

      // Add creator as team captain
      const memberResponse = await TeamsApi.addTeamMember(newTeam.id, user.id, 'captain');

      if (memberResponse.error) {
        // If adding member fails, we should clean up the team
        await TeamsApi.deleteTeam(newTeam.id);
        throw new Error(memberResponse.error.message || 'Failed to add user to team');
      }

      // Refresh teams to get updated data
      await refreshTeams();

      return { 
        success: true, 
        team: {
          ...newTeam,
          team_members: [{
            id: memberResponse.data!.id,
            user_id: user.id,
            team_id: newTeam.id,
            role: 'captain' as const,
            joined_at: new Date().toISOString(),
            profiles: {
              username: user.user_metadata?.username || user.email?.split('@')[0] || 'Unknown',
              full_name: user.user_metadata?.full_name,
              avatar_url: user.user_metadata?.avatar_url,
            }
          }]
        }
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create team';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user, validateTeamName, refreshTeams]);

  // Join team
  const joinTeam = useCallback(async (teamId: string) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    if (userTeam) {
      return { success: false, error: 'You are already on a team. Leave your current team first.' };
    }

    const team = teams.find(t => t.id === teamId);
    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    if (!canJoinTeam(team)) {
      return { success: false, error: 'Cannot join this team (it may be full)' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await TeamsApi.addTeamMember(teamId, user.id, 'member');

      if (response.error) {
        throw new Error(response.error.message || 'Failed to join team');
      }

      // Refresh teams to get updated data
      await refreshTeams();

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join team';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user, userTeam, teams, refreshTeams]);

  // Leave team
  const leaveTeam = useCallback(async (teamId: string) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const team = teams.find(t => t.id === teamId);
    if (!team) {
      return { success: false, error: 'Team not found' };
    }

    const userMember = team.team_members?.find(m => m.user_id === user.id);
    if (!userMember) {
      return { success: false, error: 'You are not a member of this team' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await TeamsApi.removeTeamMember(teamId, user.id);

      if (response.error) {
        throw new Error(response.error.message || 'Failed to leave team');
      }

      // If the user was the last member, delete the team
      const remainingMembers = team.team_members?.filter(m => m.user_id !== user.id) || [];
      if (remainingMembers.length === 0) {
        await TeamsApi.deleteTeam(teamId);
      }

      // Refresh teams to get updated data
      await refreshTeams();

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave team';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user, teams, refreshTeams]);

  // Update team
  const updateTeam = useCallback(async (teamId: string, updates: Partial<Team>) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const team = teams.find(t => t.id === teamId);
    if (!team || !canManageTeam(team)) {
      return { success: false, error: 'You do not have permission to manage this team' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await TeamsApi.updateTeam(teamId, updates);

      if (response.error) {
        throw new Error(response.error.message || 'Failed to update team');
      }

      // Refresh teams to get updated data
      await refreshTeams();

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update team';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user, teams, refreshTeams]);

  // Remove member
  const removeMember = useCallback(async (teamId: string, memberId: string) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const team = teams.find(t => t.id === teamId);
    if (!team || !canManageTeam(team)) {
      return { success: false, error: 'You do not have permission to manage this team' };
    }

    const member = team.team_members?.find(m => m.id === memberId);
    if (!member) {
      return { success: false, error: 'Member not found' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await TeamsApi.removeTeamMember(teamId, member.user_id);

      if (response.error) {
        throw new Error(response.error.message || 'Failed to remove member');
      }

      // Refresh teams to get updated data
      await refreshTeams();

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove member';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user, teams, refreshTeams]);

  // Promote member
  const promoteMember = useCallback(async (teamId: string, memberId: string) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const team = teams.find(t => t.id === teamId);
    if (!team || !canManageTeam(team)) {
      return { success: false, error: 'You do not have permission to manage this team' };
    }

    const member = team.team_members?.find(m => m.id === memberId);
    if (!member) {
      return { success: false, error: 'Member not found' };
    }

    if (member.role === 'captain') {
      return { success: false, error: 'Member is already a captain' };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Remove old member record
      await TeamsApi.removeTeamMember(teamId, member.user_id);
      
      // Add new captain record
      const response = await TeamsApi.addTeamMember(teamId, member.user_id, 'captain');

      if (response.error) {
        throw new Error(response.error.message || 'Failed to promote member');
      }

      // Refresh teams to get updated data
      await refreshTeams();

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to promote member';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user, teams, refreshTeams]);

  // Utility functions
  const canJoinTeam = useCallback((team: Team) => {
    if (!user || userTeam) return false;
    
    const memberCount = team.team_members?.length || 0;
    const maxMembers = 6; // Default max, could be configurable
    
    return memberCount < maxMembers;
  }, [user, userTeam]);

  const canManageTeam = useCallback((team: Team) => {
    if (!user) return false;
    
    const userMember = team.team_members?.find(m => m.user_id === user.id);
    return userMember?.role === 'captain';
  }, [user]);

  return {
    // State
    teams,
    userTeam,
    existingTeamNames,
    isLoading,
    error,

    // Team Formation Actions
    createTeam,
    joinTeam,
    leaveTeam,
    
    // Team Management Actions
    updateTeam,
    removeMember,
    promoteMember,
    
    // Data Management
    loadTeams,
    refreshTeams,
    
    // Validation
    validateTeamName,
    canJoinTeam,
    canManageTeam,
  };
} 
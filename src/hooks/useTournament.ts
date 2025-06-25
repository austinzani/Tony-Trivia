import { useState, useEffect, useCallback } from 'react';
import { TournamentService } from '../services/tournamentService';
import type { 
  Tournament, 
  TournamentParticipant, 
  TournamentMatch,
  TournamentStanding 
} from '../types/database';

interface UseTournamentOptions {
  tournamentId: string;
  autoRefresh?: boolean;
}

export function useTournament({ tournamentId, autoRefresh = true }: UseTournamentOptions) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [matches, setMatches] = useState<TournamentMatch[]>([]);
  const [standings, setStandings] = useState<TournamentStanding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTournamentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [tournamentData, participantsData, matchesData] = await Promise.all([
        TournamentService.getTournament(tournamentId),
        TournamentService.getParticipants(tournamentId),
        TournamentService.getMatches(tournamentId)
      ]);

      setTournament(tournamentData);
      setParticipants(participantsData);
      setMatches(matchesData);

      // Load standings for round-robin tournaments
      if (tournamentData?.format === 'round_robin') {
        const standingsData = await TournamentService.getStandings(tournamentId);
        setStandings(standingsData);
      }
    } catch (err) {
      setError('Failed to load tournament data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    loadTournamentData();

    if (autoRefresh) {
      const subscription = TournamentService.subscribeTournamentUpdates(
        tournamentId,
        () => loadTournamentData()
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [tournamentId, autoRefresh, loadTournamentData]);

  const updateTournamentStatus = async (status: Tournament['status']) => {
    if (!tournament) return false;

    try {
      const success = await TournamentService.updateTournamentStatus(tournamentId, status);
      if (success) {
        setTournament({ ...tournament, status });
        
        // Generate brackets/schedule when starting
        if (status === 'in_progress') {
          if (tournament.format === 'single_elimination') {
            await TournamentService.generateSingleEliminationBracket(tournamentId);
          } else if (tournament.format === 'round_robin') {
            await TournamentService.generateRoundRobinSchedule(tournamentId);
          }
          await loadTournamentData();
        }
      }
      return success;
    } catch (err) {
      console.error('Error updating tournament status:', err);
      return false;
    }
  };

  const registerTeam = async (teamId: string, seed?: number) => {
    try {
      const participant = await TournamentService.registerTeam(tournamentId, teamId, seed);
      if (participant) {
        await loadTournamentData();
        return participant;
      }
      return null;
    } catch (err) {
      console.error('Error registering team:', err);
      return null;
    }
  };

  const updateMatchResult = async (
    matchId: string, 
    result: {
      team1Score: number;
      team2Score: number;
      winnerId?: string;
      loserId?: string;
    }
  ) => {
    try {
      const success = await TournamentService.updateMatchResult(matchId, result);
      if (success) {
        await loadTournamentData();
      }
      return success;
    } catch (err) {
      console.error('Error updating match result:', err);
      return false;
    }
  };

  const getCurrentRoundMatches = () => {
    if (!tournament || !matches.length) return [];
    return matches.filter(m => m.round === tournament.current_round);
  };

  const getUpcomingMatches = () => {
    return matches.filter(m => m.status === 'scheduled').slice(0, 5);
  };

  const getRecentMatches = () => {
    return matches
      .filter(m => m.status === 'completed')
      .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())
      .slice(0, 5);
  };

  const canStartTournament = () => {
    return tournament?.status === 'registration_open' && 
           participants.length >= (tournament.min_teams || 2);
  };

  const getTournamentProgress = () => {
    if (!tournament || !tournament.total_rounds) return 0;
    return (tournament.current_round / tournament.total_rounds) * 100;
  };

  return {
    tournament,
    participants,
    matches,
    standings,
    loading,
    error,
    refresh: loadTournamentData,
    updateTournamentStatus,
    registerTeam,
    updateMatchResult,
    getCurrentRoundMatches,
    getUpcomingMatches,
    getRecentMatches,
    canStartTournament,
    getTournamentProgress
  };
}
import { useState, useEffect, useCallback } from 'react';
import { ScheduledGamesService } from '../services/scheduledGamesService';
import type { 
  ScheduledGame, 
  ScheduledGameParticipant,
  GameSettings 
} from '../types/database';

export function useScheduledGames() {
  const [scheduledGames, setScheduledGames] = useState<ScheduledGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's scheduled games
  const fetchScheduledGames = useCallback(async (
    filter?: 'hosting' | 'participating' | 'all'
  ) => {
    setLoading(true);
    setError(null);
    try {
      const games = await ScheduledGamesService.getUserScheduledGames(filter);
      setScheduledGames(games);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch scheduled games');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new scheduled game
  const createScheduledGame = useCallback(async (gameData: {
    title: string;
    description?: string;
    scheduled_for: string;
    duration_minutes?: number;
    max_players?: number;
    settings?: GameSettings;
    recurring_pattern?: 'none' | 'daily' | 'weekly' | 'monthly';
    recurring_end_date?: string;
  }) => {
    setError(null);
    try {
      const newGame = await ScheduledGamesService.createScheduledGame(gameData);
      setScheduledGames(prev => [...prev, newGame]);
      return newGame;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create scheduled game');
      throw err;
    }
  }, []);

  // Update a scheduled game
  const updateScheduledGame = useCallback(async (
    id: string, 
    updates: Partial<ScheduledGame>
  ) => {
    setError(null);
    try {
      const updatedGame = await ScheduledGamesService.updateScheduledGame(id, updates);
      setScheduledGames(prev => 
        prev.map(game => game.id === id ? updatedGame : game)
      );
      return updatedGame;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update scheduled game');
      throw err;
    }
  }, []);

  // Cancel a scheduled game
  const cancelScheduledGame = useCallback(async (id: string) => {
    setError(null);
    try {
      await ScheduledGamesService.cancelScheduledGame(id);
      setScheduledGames(prev => 
        prev.map(game => 
          game.id === id ? { ...game, status: 'cancelled' as const } : game
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel scheduled game');
      throw err;
    }
  }, []);

  // Delete a scheduled game
  const deleteScheduledGame = useCallback(async (id: string) => {
    setError(null);
    try {
      await ScheduledGamesService.deleteScheduledGame(id);
      setScheduledGames(prev => prev.filter(game => game.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete scheduled game');
      throw err;
    }
  }, []);

  // Invite participants to a game
  const inviteParticipants = useCallback(async (
    gameId: string, 
    userIds: string[]
  ) => {
    setError(null);
    try {
      await ScheduledGamesService.inviteParticipants(gameId, userIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite participants');
      throw err;
    }
  }, []);

  // Update RSVP status
  const updateRsvpStatus = useCallback(async (
    gameId: string,
    status: 'accepted' | 'declined' | 'tentative',
    teamPreference?: string
  ) => {
    setError(null);
    try {
      await ScheduledGamesService.updateRsvpStatus(gameId, status, teamPreference);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update RSVP status');
      throw err;
    }
  }, []);

  // Get upcoming games
  const fetchUpcomingGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const games = await ScheduledGamesService.getUpcomingGames();
      return games;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch upcoming games');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get games for a date range (for calendar view)
  const fetchGamesByDateRange = useCallback(async (
    startDate: Date,
    endDate: Date
  ) => {
    setLoading(true);
    setError(null);
    try {
      const games = await ScheduledGamesService.getGamesByDateRange(startDate, endDate);
      return games;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch games by date range');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check for games to start automatically
  useEffect(() => {
    const checkInterval = setInterval(async () => {
      try {
        await ScheduledGamesService.checkAndStartScheduledGames();
      } catch (err) {
        console.error('Error checking scheduled games:', err);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, []);

  return {
    scheduledGames,
    loading,
    error,
    fetchScheduledGames,
    createScheduledGame,
    updateScheduledGame,
    cancelScheduledGame,
    deleteScheduledGame,
    inviteParticipants,
    updateRsvpStatus,
    fetchUpcomingGames,
    fetchGamesByDateRange
  };
}

// Hook for managing a single scheduled game
export function useScheduledGame(gameId: string) {
  const [game, setGame] = useState<ScheduledGame | null>(null);
  const [participants, setParticipants] = useState<ScheduledGameParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch game details
  const fetchGameDetails = useCallback(async () => {
    if (!gameId) return;
    
    setLoading(true);
    setError(null);
    try {
      const [gameData, participantsData] = await Promise.all([
        ScheduledGamesService.getScheduledGame(gameId),
        ScheduledGamesService.getGameParticipants(gameId)
      ]);
      setGame(gameData);
      setParticipants(participantsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch game details');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchGameDetails();
  }, [fetchGameDetails]);

  return {
    game,
    participants,
    loading,
    error,
    refetch: fetchGameDetails
  };
}
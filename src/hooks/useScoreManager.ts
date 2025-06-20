import { useState, useEffect, useCallback, useMemo } from 'react';
import { ScoreManager, PlayerScore, TeamScore, LeaderboardEntry, ScoreEvent } from '../services/scoreManager';

export interface UseScoreManagerReturn {
  // State
  scoreManager: ScoreManager;
  playerScores: Map<string, PlayerScore>;
  teamScores: Map<string, TeamScore>;
  leaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
  
  // Computed values
  totalPlayers: number;
  totalTeams: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  
  // Actions
  calculateScore: (playerId: string, questionId: string, isCorrect: boolean, pointValue: number) => Promise<void>;
  updatePlayerScore: (playerId: string, score: Partial<PlayerScore>) => Promise<void>;
  updateTeamScore: (teamId: string, score: Partial<TeamScore>) => Promise<void>;
  recalculateAllScores: () => Promise<void>;
  resetScores: () => Promise<void>;
  exportScores: () => string;
  importScores: (data: string) => Promise<void>;
  
  // Event handlers
  onScoreUpdate?: (event: ScoreEvent) => void;
  onLeaderboardUpdate?: (leaderboard: LeaderboardEntry[]) => void;
}

export const useScoreManager = (
  gameId: string,
  onScoreUpdate?: (event: ScoreEvent) => void,
  onLeaderboardUpdate?: (leaderboard: LeaderboardEntry[]) => void
): UseScoreManagerReturn => {
  const [scoreManager] = useState(() => new ScoreManager(gameId));
  const [playerScores, setPlayerScores] = useState<Map<string, PlayerScore>>(new Map());
  const [teamScores, setTeamScores] = useState<Map<string, TeamScore>>(new Map());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup event listeners
  useEffect(() => {
    const handleScoreUpdate = (event: ScoreEvent) => {
      setPlayerScores(new Map(scoreManager.getPlayerScores()));
      setTeamScores(new Map(scoreManager.getTeamScores()));
      setLeaderboard([...scoreManager.getLeaderboard()]);
      onScoreUpdate?.(event);
    };

    const handleLeaderboardUpdate = () => {
      const newLeaderboard = scoreManager.getLeaderboard();
      setLeaderboard([...newLeaderboard]);
      onLeaderboardUpdate?.(newLeaderboard);
    };

    scoreManager.addEventListener('scoreUpdated', handleScoreUpdate);
    scoreManager.addEventListener('scoreRecalculated', handleScoreUpdate);
    scoreManager.addEventListener('scoresReset', handleScoreUpdate);
    scoreManager.addEventListener('leaderboardUpdated', handleLeaderboardUpdate);

    // Initial data load
    setPlayerScores(new Map(scoreManager.getPlayerScores()));
    setTeamScores(new Map(scoreManager.getTeamScores()));
    setLeaderboard([...scoreManager.getLeaderboard()]);

    return () => {
      scoreManager.removeEventListener('scoreUpdated', handleScoreUpdate);
      scoreManager.removeEventListener('scoreRecalculated', handleScoreUpdate);
      scoreManager.removeEventListener('scoresReset', handleScoreUpdate);
      scoreManager.removeEventListener('leaderboardUpdated', handleLeaderboardUpdate);
    };
  }, [scoreManager, onScoreUpdate, onLeaderboardUpdate]);

  // Computed values
  const computedValues = useMemo(() => {
    const scores = Array.from(playerScores.values()).map(p => p.totalScore);
    
    return {
      totalPlayers: playerScores.size,
      totalTeams: teamScores.size,
      averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0
    };
  }, [playerScores, teamScores]);

  // Actions
  const calculateScore = useCallback(async (
    playerId: string,
    questionId: string,
    isCorrect: boolean,
    pointValue: number
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await scoreManager.calculateScore(playerId, questionId, isCorrect, pointValue);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate score');
    } finally {
      setIsLoading(false);
    }
  }, [scoreManager]);

  const updatePlayerScore = useCallback(async (
    playerId: string,
    score: Partial<PlayerScore>
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await scoreManager.updatePlayerScore(playerId, score);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update player score');
    } finally {
      setIsLoading(false);
    }
  }, [scoreManager]);

  const updateTeamScore = useCallback(async (
    teamId: string,
    score: Partial<TeamScore>
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await scoreManager.updateTeamScore(teamId, score);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team score');
    } finally {
      setIsLoading(false);
    }
  }, [scoreManager]);

  const recalculateAllScores = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await scoreManager.recalculateAllScores();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recalculate scores');
    } finally {
      setIsLoading(false);
    }
  }, [scoreManager]);

  const resetScores = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await scoreManager.resetScores();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset scores');
    } finally {
      setIsLoading(false);
    }
  }, [scoreManager]);

  const exportScores = useCallback(() => {
    return scoreManager.exportScores();
  }, [scoreManager]);

  const importScores = useCallback(async (data: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await scoreManager.importScores(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import scores');
    } finally {
      setIsLoading(false);
    }
  }, [scoreManager]);

  return {
    // State
    scoreManager,
    playerScores,
    teamScores,
    leaderboard,
    isLoading,
    error,
    
    // Computed values
    ...computedValues,
    
    // Actions
    calculateScore,
    updatePlayerScore,
    updateTeamScore,
    recalculateAllScores,
    resetScores,
    exportScores,
    importScores,
    
    // Event handlers
    onScoreUpdate,
    onLeaderboardUpdate
  };
};

export interface UsePlayerScoreReturn {
  playerScore: PlayerScore | null;
  isLoading: boolean;
  error: string | null;
  updateScore: (score: Partial<PlayerScore>) => Promise<void>;
  recalculateScore: () => Promise<void>;
}

export const usePlayerScore = (
  scoreManager: ScoreManager,
  playerId: string
): UsePlayerScoreReturn => {
  const [playerScore, setPlayerScore] = useState<PlayerScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update player score when scores change
  useEffect(() => {
    const updatePlayerScore = () => {
      const score = scoreManager.getPlayerScore(playerId);
      setPlayerScore(score);
    };

    scoreManager.addEventListener('scoreUpdated', updatePlayerScore);
    scoreManager.addEventListener('scoreRecalculated', updatePlayerScore);
    scoreManager.addEventListener('scoresReset', updatePlayerScore);

    // Initial load
    updatePlayerScore();

    return () => {
      scoreManager.removeEventListener('scoreUpdated', updatePlayerScore);
      scoreManager.removeEventListener('scoreRecalculated', updatePlayerScore);
      scoreManager.removeEventListener('scoresReset', updatePlayerScore);
    };
  }, [scoreManager, playerId]);

  const updateScore = useCallback(async (score: Partial<PlayerScore>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await scoreManager.updatePlayerScore(playerId, score);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update score');
    } finally {
      setIsLoading(false);
    }
  }, [scoreManager, playerId]);

  const recalculateScore = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await scoreManager.recalculatePlayerScore(playerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recalculate score');
    } finally {
      setIsLoading(false);
    }
  }, [scoreManager, playerId]);

  return {
    playerScore,
    isLoading,
    error,
    updateScore,
    recalculateScore
  };
};

export interface UseTeamScoreReturn {
  teamScore: TeamScore | null;
  isLoading: boolean;
  error: string | null;
  updateScore: (score: Partial<TeamScore>) => Promise<void>;
  recalculateScore: () => Promise<void>;
}

export const useTeamScore = (
  scoreManager: ScoreManager,
  teamId: string
): UseTeamScoreReturn => {
  const [teamScore, setTeamScore] = useState<TeamScore | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update team score when scores change
  useEffect(() => {
    const updateTeamScore = () => {
      const score = scoreManager.getTeamScore(teamId);
      setTeamScore(score);
    };

    scoreManager.addEventListener('scoreUpdated', updateTeamScore);
    scoreManager.addEventListener('scoreRecalculated', updateTeamScore);
    scoreManager.addEventListener('scoresReset', updateTeamScore);

    // Initial load
    updateTeamScore();

    return () => {
      scoreManager.removeEventListener('scoreUpdated', updateTeamScore);
      scoreManager.removeEventListener('scoreRecalculated', updateTeamScore);
      scoreManager.removeEventListener('scoresReset', updateTeamScore);
    };
  }, [scoreManager, teamId]);

  const updateScore = useCallback(async (score: Partial<TeamScore>) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await scoreManager.updateTeamScore(teamId, score);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update team score');
    } finally {
      setIsLoading(false);
    }
  }, [scoreManager, teamId]);

  const recalculateScore = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await scoreManager.recalculateTeamScore(teamId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to recalculate team score');
    } finally {
      setIsLoading(false);
    }
  }, [scoreManager, teamId]);

  return {
    teamScore,
    isLoading,
    error,
    updateScore,
    recalculateScore
  };
};

export interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  playerLeaderboard: LeaderboardEntry[];
  teamLeaderboard: LeaderboardEntry[];
  isLoading: boolean;
  error: string | null;
  refreshLeaderboard: () => Promise<void>;
}

export const useLeaderboard = (
  scoreManager: ScoreManager
): UseLeaderboardReturn => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update leaderboard when scores change
  useEffect(() => {
    const updateLeaderboard = () => {
      const newLeaderboard = scoreManager.getLeaderboard();
      setLeaderboard([...newLeaderboard]);
    };

    scoreManager.addEventListener('leaderboardUpdated', updateLeaderboard);
    scoreManager.addEventListener('scoreUpdated', updateLeaderboard);
    scoreManager.addEventListener('scoreRecalculated', updateLeaderboard);

    // Initial load
    updateLeaderboard();

    return () => {
      scoreManager.removeEventListener('leaderboardUpdated', updateLeaderboard);
      scoreManager.removeEventListener('scoreUpdated', updateLeaderboard);
      scoreManager.removeEventListener('scoreRecalculated', updateLeaderboard);
    };
  }, [scoreManager]);

  // Computed leaderboards
  const playerLeaderboard = useMemo(() => {
    return leaderboard.filter(entry => entry.type === 'player');
  }, [leaderboard]);

  const teamLeaderboard = useMemo(() => {
    return leaderboard.filter(entry => entry.type === 'team');
  }, [leaderboard]);

  const refreshLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await scoreManager.updateLeaderboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [scoreManager]);

  return {
    leaderboard,
    playerLeaderboard,
    teamLeaderboard,
    isLoading,
    error,
    refreshLeaderboard
  };
}; 
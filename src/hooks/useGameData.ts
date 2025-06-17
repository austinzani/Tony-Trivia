import { useQuery } from '@tanstack/react-query';

interface Game {
  id: string;
  name: string;
  code: string;
  status: 'waiting' | 'active' | 'finished';
  playerCount: number;
  maxPlayers: number;
  host: string;
}

// Mock API function to simulate data fetching
const fetchGames = async (): Promise<Game[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock data
  return [
    {
      id: '1',
      name: 'Friday Night Trivia',
      code: 'FNT123',
      status: 'waiting',
      playerCount: 5,
      maxPlayers: 20,
      host: 'Alex Johnson',
    },
    {
      id: '2',
      name: 'Science Quiz',
      code: 'SCI456',
      status: 'active',
      playerCount: 12,
      maxPlayers: 15,
      host: 'Dr. Smith',
    },
    {
      id: '3',
      name: 'History Challenge',
      code: 'HST789',
      status: 'finished',
      playerCount: 8,
      maxPlayers: 10,
      host: 'Prof. Wilson',
    },
  ];
};

// React Query hook for fetching games
export function useGameData() {
  return useQuery({
    queryKey: ['games'],
    queryFn: fetchGames,
    staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for live data
  });
}

// Hook for fetching a specific game by ID
export function useGameById(gameId: string) {
  return useQuery({
    queryKey: ['game', gameId],
    queryFn: async () => {
      const games = await fetchGames();
      const game = games.find(g => g.id === gameId);
      if (!game) {
        throw new Error('Game not found');
      }
      return game;
    },
    enabled: !!gameId, // Only run query if gameId is provided
  });
} 
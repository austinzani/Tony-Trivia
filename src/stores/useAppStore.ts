import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  isHost: boolean;
}

interface Game {
  id: string;
  code: string;
  name: string;
  hostId: string;
  maxPlayers: number;
  currentPlayers: number;
  status: 'waiting' | 'active' | 'finished';
}

interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  
  // Game state
  currentGame: Game | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  actions: {
    // User actions
    setUser: (user: User) => void;
    logout: () => void;
    
    // Game actions
    setCurrentGame: (game: Game) => void;
    clearCurrentGame: () => void;
    
    // UI actions
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  currentGame: null,
  isLoading: false,
  error: null,
  
  // Actions
  actions: {
    // User actions
    setUser: (user: User) => {
      set({ 
        user, 
        isAuthenticated: true,
        error: null 
      });
    },
    
    logout: () => {
      set({ 
        user: null, 
        isAuthenticated: false,
        currentGame: null,
        error: null 
      });
    },
    
    // Game actions
    setCurrentGame: (game: Game) => {
      set({ 
        currentGame: game,
        error: null 
      });
    },
    
    clearCurrentGame: () => {
      set({ currentGame: null });
    },
    
    // UI actions
    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },
    
    setError: (error: string | null) => {
      set({ error });
    },
    
    clearError: () => {
      set({ error: null });
    }
  }
}));

// Selector hooks for better performance
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useCurrentGame = () => useAppStore((state) => state.currentGame);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useError = () => useAppStore((state) => state.error);
export const useAppActions = () => useAppStore((state) => state.actions); 
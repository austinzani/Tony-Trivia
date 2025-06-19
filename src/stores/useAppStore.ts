import { create } from 'zustand';
import type { GuestUser } from '../types/guest';

interface User {
  id: string;
  name: string;
  isHost: boolean;
  isGuest?: boolean;
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
  user: User | GuestUser | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  
  // Game state
  currentGame: Game | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Guest-specific state
  showGuestPrompt: boolean;
  guestPromptContext: 'game-end' | 'achievement' | 'session-expiring' | null;
  
  // Actions
  actions: {
    // User actions
    setUser: (user: User) => void;
    setGuestUser: (guestUser: GuestUser) => void;
    logout: () => void;
    
    // Game actions
    setCurrentGame: (game: Game) => void;
    clearCurrentGame: () => void;
    
    // UI actions
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    
    // Guest actions
    showGuestRegistrationPrompt: (context: 'game-end' | 'achievement' | 'session-expiring') => void;
    hideGuestRegistrationPrompt: () => void;
    convertGuestToUser: (user: User) => void;
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isGuest: false,
  currentGame: null,
  isLoading: false,
  error: null,
  showGuestPrompt: false,
  guestPromptContext: null,
  
  // Actions
  actions: {
    // User actions
    setUser: (user: User) => {
      set({ 
        user, 
        isAuthenticated: true,
        isGuest: false,
        error: null 
      });
    },
    
    setGuestUser: (guestUser: GuestUser) => {
      set({ 
        user: guestUser, 
        isAuthenticated: true,
        isGuest: true,
        error: null 
      });
    },
    
    logout: () => {
      set({ 
        user: null, 
        isAuthenticated: false,
        isGuest: false,
        currentGame: null,
        error: null,
        showGuestPrompt: false,
        guestPromptContext: null
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
    },
    
    // Guest actions
    showGuestRegistrationPrompt: (context: 'game-end' | 'achievement' | 'session-expiring') => {
      set({ 
        showGuestPrompt: true,
        guestPromptContext: context
      });
    },
    
    hideGuestRegistrationPrompt: () => {
      set({ 
        showGuestPrompt: false,
        guestPromptContext: null
      });
    },
    
    convertGuestToUser: (user: User) => {
      set({ 
        user, 
        isAuthenticated: true,
        isGuest: false,
        showGuestPrompt: false,
        guestPromptContext: null,
        error: null 
      });
    }
  }
}));

// Selector hooks for better performance
export const useUser = () => useAppStore((state) => state.user);
export const useIsAuthenticated = () => useAppStore((state) => state.isAuthenticated);
export const useIsGuest = () => useAppStore((state) => state.isGuest);
export const useCurrentGame = () => useAppStore((state) => state.currentGame);
export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useError = () => useAppStore((state) => state.error);
export const useGuestPrompt = () => useAppStore((state) => ({ 
  show: state.showGuestPrompt, 
  context: state.guestPromptContext 
}));
export const useAppActions = () => useAppStore((state) => state.actions); 
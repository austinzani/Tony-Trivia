import { useEffect, useState, useCallback } from 'react';
import { guestAuthService } from '../services/guestAuth';
import type { GuestUser, GuestSession } from '../types/guest';
import { useAppActions } from '../stores/useAppStore';

export function useGuestAuth() {
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);
  const [loading, setLoading] = useState(false);
  const { setGuestUser, logout, showGuestRegistrationPrompt } = useAppActions();

  // Initialize guest session on mount
  useEffect(() => {
    const initializeGuestSession = () => {
      const existingSession = guestAuthService.getCurrentGuestSession();
      if (existingSession) {
        setGuestSession(existingSession);
        setGuestUser(existingSession.user);
        
        // Check if session is expiring soon
        if (guestAuthService.isSessionExpiringSoon()) {
          showGuestRegistrationPrompt('session-expiring');
        }
      }
    };

    initializeGuestSession();
  }, [setGuestUser, showGuestRegistrationPrompt]);

  // Create a new guest user session
  const createGuestSession = useCallback(async (customUsername?: string) => {
    setLoading(true);
    try {
      // Generate random username if none provided
      const username = customUsername || guestAuthService.generateRandomUsername();
      
      // Create guest session
      const session = guestAuthService.createGuestSession(username);
      
      setGuestSession(session);
      setGuestUser(session.user);
      
      return { success: true, user: session.user };
    } catch (error) {
      console.error('Error creating guest session:', error);
      return { success: false, error: 'Failed to create guest session' };
    } finally {
      setLoading(false);
    }
  }, [setGuestUser]);

  // Update guest user data
  const updateGuestUser = useCallback((updates: Partial<GuestUser>) => {
    const success = guestAuthService.updateGuestUser(updates);
    if (success) {
      const updatedSession = guestAuthService.getCurrentGuestSession();
      if (updatedSession) {
        setGuestSession(updatedSession);
        setGuestUser(updatedSession.user);
      }
    }
    return success;
  }, [setGuestUser]);

  // Update guest game data
  const updateGuestGameData = useCallback((gameData: Partial<GuestUser['gameData']>) => {
    const success = guestAuthService.updateGuestGameData(gameData);
    if (success) {
      const updatedSession = guestAuthService.getCurrentGuestSession();
      if (updatedSession) {
        setGuestSession(updatedSession);
        setGuestUser(updatedSession.user);
      }
    }
    return success;
  }, [setGuestUser]);

  // Extend guest session
  const extendGuestSession = useCallback(() => {
    const success = guestAuthService.extendGuestSession();
    if (success) {
      const updatedSession = guestAuthService.getCurrentGuestSession();
      if (updatedSession) {
        setGuestSession(updatedSession);
      }
    }
    return success;
  }, []);

  // Clear guest session and logout
  const clearGuestSession = useCallback(() => {
    guestAuthService.clearGuestSession();
    setGuestSession(null);
    logout();
  }, [logout]);

  // Get guest data for account conversion
  const getGuestDataForConversion = useCallback(() => {
    return guestAuthService.getGuestDataForConversion();
  }, []);

  // Check if current user is a guest
  const isGuestUser = useCallback((user: any): user is GuestUser => {
    return guestAuthService.isGuestUser(user);
  }, []);

  // Get session time remaining
  const getSessionTimeRemaining = useCallback(() => {
    return guestAuthService.getSessionTimeRemaining();
  }, []);

  // Check if session is expiring soon
  const isSessionExpiringSoon = useCallback(() => {
    return guestAuthService.isSessionExpiringSoon();
  }, []);

  // Record game completion for guest
  const recordGuestGameCompletion = useCallback((score: number) => {
    if (!guestSession) return false;

    const currentGameData = guestSession.user.gameData || {
      gamesPlayed: 0,
      totalScore: 0,
      achievements: []
    };

    const updatedGameData = {
      gamesPlayed: currentGameData.gamesPlayed + 1,
      totalScore: currentGameData.totalScore + score,
      achievements: currentGameData.achievements
    };

    // Add achievements based on performance
    const newAchievements = [...currentGameData.achievements];
    
    if (score > 80 && !newAchievements.includes('high-scorer')) {
      newAchievements.push('high-scorer');
    }
    
    if (updatedGameData.gamesPlayed === 1 && !newAchievements.includes('first-game')) {
      newAchievements.push('first-game');
    }
    
    if (updatedGameData.gamesPlayed >= 5 && !newAchievements.includes('regular-player')) {
      newAchievements.push('regular-player');
    }

    updatedGameData.achievements = newAchievements;

    const success = updateGuestGameData(updatedGameData);
    
    // Show registration prompt after game completion
    if (success && updatedGameData.gamesPlayed >= 2) {
      showGuestRegistrationPrompt('game-end');
    }
    
    return success;
  }, [guestSession, updateGuestGameData, showGuestRegistrationPrompt]);

  return {
    // State
    guestSession,
    loading,
    
    // Actions
    createGuestSession,
    updateGuestUser,
    updateGuestGameData,
    extendGuestSession,
    clearGuestSession,
    recordGuestGameCompletion,
    
    // Utilities
    getGuestDataForConversion,
    isGuestUser,
    getSessionTimeRemaining,
    isSessionExpiringSoon,
  };
} 
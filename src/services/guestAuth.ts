import { v4 as uuidv4 } from 'uuid';
import type { GuestUser, GuestSession } from '../types/guest';

// Re-export types for convenience
export type { GuestUser, GuestSession };

const GUEST_SESSION_KEY = 'tony-trivia-guest-session';
const GUEST_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Guest authentication service
export const guestAuthService = {
  // Create a new guest user
  createGuestUser(customUsername?: string): GuestUser {
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const defaultUsername = customUsername || `Player${randomSuffix}`;
    
    const guestUser: GuestUser = {
      id: `guest_${uuidv4()}`,
      username: defaultUsername,
      displayName: defaultUsername,
      isGuest: true,
      createdAt: new Date().toISOString(),
      sessionId: uuidv4(),
      gameData: {
        gamesPlayed: 0,
        totalScore: 0,
        achievements: []
      }
    };

    return guestUser;
  },

  // Create and store a guest session
  createGuestSession(customUsername?: string): GuestSession {
    const guestUser = this.createGuestUser(customUsername);
    const expiresAt = new Date(Date.now() + GUEST_SESSION_DURATION).toISOString();
    
    const session: GuestSession = {
      user: guestUser,
      expiresAt,
      isActive: true
    };

    // Store in localStorage
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
    
    return session;
  },

  // Get current guest session
  getCurrentGuestSession(): GuestSession | null {
    try {
      const sessionData = localStorage.getItem(GUEST_SESSION_KEY);
      if (!sessionData) return null;

      const session: GuestSession = JSON.parse(sessionData);
      
      // Check if session is expired
      if (new Date(session.expiresAt) < new Date()) {
        this.clearGuestSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error getting guest session:', error);
      this.clearGuestSession();
      return null;
    }
  },

  // Update guest user data (for game progress)
  updateGuestUser(updates: Partial<GuestUser>): boolean {
    try {
      const session = this.getCurrentGuestSession();
      if (!session) return false;

      const updatedUser = { ...session.user, ...updates };
      const updatedSession = { ...session, user: updatedUser };

      localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(updatedSession));
      return true;
    } catch (error) {
      console.error('Error updating guest user:', error);
      return false;
    }
  },

  // Update guest game data
  updateGuestGameData(gameData: Partial<GuestUser['gameData']>): boolean {
    try {
      const session = this.getCurrentGuestSession();
      if (!session) return false;

      const updatedGameData = { ...session.user.gameData, ...gameData };
      const updatedUser = { ...session.user, gameData: updatedGameData };
      const updatedSession = { ...session, user: updatedUser };

      localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(updatedSession));
      return true;
    } catch (error) {
      console.error('Error updating guest game data:', error);
      return false;
    }
  },

  // Clear guest session
  clearGuestSession(): void {
    localStorage.removeItem(GUEST_SESSION_KEY);
  },

  // Check if user is a guest
  isGuestUser(user: any): user is GuestUser {
    return user && user.isGuest === true;
  },

  // Extend guest session (reset expiration)
  extendGuestSession(): boolean {
    try {
      const session = this.getCurrentGuestSession();
      if (!session) return false;

      const extendedSession = {
        ...session,
        expiresAt: new Date(Date.now() + GUEST_SESSION_DURATION).toISOString()
      };

      localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(extendedSession));
      return true;
    } catch (error) {
      console.error('Error extending guest session:', error);
      return false;
    }
  },

  // Get guest data for account conversion
  getGuestDataForConversion(): GuestUser['gameData'] | null {
    const session = this.getCurrentGuestSession();
    return session?.user.gameData || null;
  },

  // Generate fun random usernames for guests
  generateRandomUsername(): string {
    const adjectives = [
      'Smart', 'Quick', 'Clever', 'Bright', 'Sharp', 'Witty', 'Genius', 'Brainy',
      'Swift', 'Keen', 'Wise', 'Savvy', 'Crafty', 'Nimble', 'Slick', 'Ace'
    ];
    
    const nouns = [
      'Player', 'Gamer', 'Trivia', 'Master', 'Champion', 'Expert', 'Pro', 'Star',
      'Wizard', 'Ninja', 'Hero', 'Legend', 'Brain', 'Genius', 'Scholar', 'Sage'
    ];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 999) + 1;

    return `${adjective}${noun}${number}`;
  },

  // Get session time remaining (in minutes)
  getSessionTimeRemaining(): number {
    const session = this.getCurrentGuestSession();
    if (!session) return 0;

    const now = new Date().getTime();
    const expires = new Date(session.expiresAt).getTime();
    const remaining = expires - now;

    return Math.max(0, Math.floor(remaining / (1000 * 60))); // Convert to minutes
  },

  // Check if session is about to expire (within 30 minutes)
  isSessionExpiringSoon(): boolean {
    return this.getSessionTimeRemaining() <= 30;
  }
}; 
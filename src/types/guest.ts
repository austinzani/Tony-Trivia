export interface GuestUser {
  id: string;
  username: string;
  displayName: string;
  isGuest: true;
  createdAt: string;
  sessionId: string;
  gameData?: {
    gamesPlayed: number;
    totalScore: number;
    achievements: string[];
  };
}

export interface GuestSession {
  user: GuestUser;
  expiresAt: string;
  isActive: boolean;
} 
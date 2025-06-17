// Game utility functions

/**
 * Generate a random game code
 * @param length - Length of the code (default: 6)
 * @returns Random alphanumeric game code
 */
export function generateGameCode(length: number = 6): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * Calculate score based on time taken and question difficulty
 * @param isCorrect - Whether the answer is correct
 * @param timeTaken - Time taken to answer (in seconds)
 * @param timeLimit - Total time allowed (in seconds)
 * @param basePoints - Base points for the question
 * @returns Calculated score
 */
export function calculateScore(
  isCorrect: boolean,
  timeTaken: number,
  timeLimit: number,
  basePoints: number
): number {
  if (!isCorrect) return 0;
  
  // Time bonus: faster answers get more points
  const timeRatio = Math.max(0, (timeLimit - timeTaken) / timeLimit);
  const timeBonus = Math.floor(basePoints * 0.5 * timeRatio);
  
  return basePoints + timeBonus;
}

/**
 * Format time in seconds to MM:SS format
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Get difficulty color for UI display
 * @param difficulty - Question difficulty
 * @returns CSS color class
 */
export function getDifficultyColor(difficulty: 'easy' | 'medium' | 'hard'): string {
  switch (difficulty) {
    case 'easy':
      return 'text-green-600 bg-green-100';
    case 'medium':
      return 'text-yellow-600 bg-yellow-100';
    case 'hard':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

/**
 * Validate game settings
 * @param settings - Game settings object
 * @returns Validation result with errors
 */
export function validateGameSettings(settings: {
  rounds: number;
  timePerQuestion: number;
  maxPlayers: number;
  categories: string[];
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (settings.rounds < 1 || settings.rounds > 10) {
    errors.push('Rounds must be between 1 and 10');
  }
  
  if (settings.timePerQuestion < 10 || settings.timePerQuestion > 300) {
    errors.push('Time per question must be between 10 and 300 seconds');
  }
  
  if (settings.maxPlayers < 2 || settings.maxPlayers > 50) {
    errors.push('Max players must be between 2 and 50');
  }
  
  if (settings.categories.length === 0) {
    errors.push('At least one category must be selected');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generate team name suggestions
 * @param existingNames - Array of already taken team names
 * @returns Array of suggested team names
 */
export function generateTeamNameSuggestions(existingNames: string[] = []): string[] {
  const suggestions = [
    'Quiz Masters',
    'Brain Busters',
    'Knowledge Knights',
    'Trivia Titans',
    'Smart Squad',
    'Answer Aces',
    'Fact Finders',
    'Wisdom Warriors',
    'Clever Crew',
    'Mental Giants',
    'Think Tank',
    'IQ Heroes',
    'Brainy Bunch',
    'Quiz Wizards',
    'Fact Force',
  ];
  
  return suggestions
    .filter(name => !existingNames.includes(name))
    .slice(0, 5);
}

/**
 * Check if a game code is valid format
 * @param code - Game code to validate
 * @returns Whether the code is valid
 */
export function isValidGameCode(code: string): boolean {
  const gameCodeRegex = /^[A-Z0-9]{6}$/;
  return gameCodeRegex.test(code);
}

/**
 * Get game status display info
 * @param status - Game status
 * @returns Display information for the status
 */
export function getGameStatusInfo(status: 'waiting' | 'active' | 'paused' | 'finished'): {
  label: string;
  color: string;
  icon: string;
} {
  switch (status) {
    case 'waiting':
      return { label: 'Waiting for Players', color: 'text-blue-600 bg-blue-100', icon: '⏳' };
    case 'active':
      return { label: 'Game in Progress', color: 'text-green-600 bg-green-100', icon: '🎮' };
    case 'paused':
      return { label: 'Game Paused', color: 'text-yellow-600 bg-yellow-100', icon: '⏸️' };
    case 'finished':
      return { label: 'Game Finished', color: 'text-gray-600 bg-gray-100', icon: '🏁' };
    default:
      return { label: 'Unknown', color: 'text-gray-600 bg-gray-100', icon: '❓' };
  }
} 
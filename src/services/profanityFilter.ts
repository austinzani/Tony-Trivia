import { Filter } from 'bad-words';
import { sanitizeText } from '../utils/security';

/**
 * Enhanced Profanity Filter Service for Tony Trivia
 * 
 * Provides comprehensive profanity filtering with custom word lists,
 * severity levels, and integration with the existing security system.
 */

export interface ProfanityCheckResult {
  isClean: boolean;
  filteredText: string;
  violations: string[];
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  suggestions?: string[];
}

export interface ProfanityFilterOptions {
  enableWhitelist?: boolean;
  enableGameSpecificFilter?: boolean;
  enableStrictMode?: boolean;
  customReplacements?: Record<string, string>;
  allowPartialMatches?: boolean;
}

/**
 * Custom word lists for game-specific content
 */
const GAME_SPECIFIC_INAPPROPRIATE_WORDS = [
  // Cheating-related terms
  'cheat', 'hack', 'exploit', 'glitch', 'bot', 'script', 'aimbot',
  
  // Harassment terms (game-specific)
  'noob', 'scrub', 'trash', 'ez', 'rekt', 'pwned', 'git gud',
  
  // Inappropriate team names
  'winner', 'champion', 'best', 'unbeatable', 'gods', 'legends',
  'quiz', 'trivia', 'knowledge', 'smart', 'genius', 'brain',
  
  // Meta gaming terms that might be confusing
  'host', 'admin', 'moderator', 'system', 'server', 'official'
];

const WHITELIST_WORDS = [
  // Common words that might be false positives
  'class', 'classic', 'assignment', 'association', 'assessment',
  'bass', 'grass', 'glass', 'pass', 'mass', 'compass',
  'analyze', 'analysis', 'final', 'finals', 'penalty',
  'specialist', 'specialist', 'basement', 'document',
  
  // Game-related terms that should be allowed
  'score', 'point', 'points', 'team', 'teams', 'player', 'players',
  'question', 'questions', 'answer', 'answers', 'round', 'rounds',
  'trivia', 'quiz', 'knowledge', 'game', 'games', 'fun', 'challenge'
];

/**
 * Positive alternatives for common inappropriate words
 */
const POSITIVE_ALTERNATIVES: Record<string, string[]> = {
  'losers': ['challengers', 'competitors', 'players', 'team'],
  'stupid': ['learning', 'thinking', 'growing', 'trying'],
  'dumb': ['new', 'fresh', 'beginner', 'starter'],
  'idiots': ['thinkers', 'players', 'team', 'crew'],
  'noobs': ['newcomers', 'starters', 'beginners', 'fresh'],
  'trash': ['recyclable', 'eco-friendly', 'green', 'sustainable'],
  'worst': ['developing', 'improving', 'growing', 'learning'],
  'suck': ['improving', 'practicing', 'learning', 'developing'],
  'fail': ['learning', 'trying', 'attempting', 'practicing']
};

class ProfanityFilterService {
  private filter: Filter;
  private gameSpecificFilter: Filter;
  private isInitialized = false;

  constructor() {
    this.initializeFilters();
  }

  /**
   * Initialize the profanity filters with custom configurations
   */
  private initializeFilters(): void {
    try {
      // Main profanity filter
      this.filter = new Filter();
      
      // Add whitelist words (words that should NOT be filtered)
      this.filter.removeWords(...WHITELIST_WORDS);
      
      // Game-specific filter for milder content
      this.gameSpecificFilter = new Filter({ list: GAME_SPECIFIC_INAPPROPRIATE_WORDS });
      
      // Customize replacement character
      this.filter.replaceWord = (word: string) => {
        return '*'.repeat(Math.min(word.length, 4));
      };

      this.gameSpecificFilter.replaceWord = (word: string) => {
        return '[filtered]';
      };

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize profanity filters:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Comprehensive profanity check with detailed results
   */
  checkText(
    text: string, 
    options: ProfanityFilterOptions = {}
  ): ProfanityCheckResult {
    const {
      enableWhitelist = true,
      enableGameSpecificFilter = true,
      enableStrictMode = false,
      customReplacements = {},
      allowPartialMatches = false
    } = options;

    if (!this.isInitialized) {
      console.warn('Profanity filter not initialized, allowing text through');
      return {
        isClean: true,
        filteredText: text,
        violations: [],
        severity: 'none'
      };
    }

    // First sanitize the text
    const sanitizedText = sanitizeText(text);
    if (!sanitizedText || sanitizedText.trim().length === 0) {
      return {
        isClean: false,
        filteredText: '',
        violations: ['Empty or invalid text'],
        severity: 'moderate'
      };
    }

    const violations: string[] = [];
    let filteredText = sanitizedText;
    let severity: ProfanityCheckResult['severity'] = 'none';

    // Check for profanity using bad-words library
    const hasProfanity = this.filter.isProfane(sanitizedText);
    if (hasProfanity) {
      violations.push('Contains inappropriate language');
      filteredText = this.filter.clean(filteredText);
      severity = 'severe';
    }

    // Check game-specific inappropriate content
    if (enableGameSpecificFilter) {
      const hasGameViolations = this.gameSpecificFilter.isProfane(sanitizedText);
      if (hasGameViolations) {
        violations.push('Contains game-inappropriate content');
        filteredText = this.gameSpecificFilter.clean(filteredText);
        if (severity === 'none') severity = 'mild';
      }
    }

    // Apply custom replacements
    Object.entries(customReplacements).forEach(([word, replacement]) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(filteredText)) {
        filteredText = filteredText.replace(regex, replacement);
        if (violations.length === 0) {
          violations.push('Contains custom filtered content');
          severity = 'mild';
        }
      }
    });

    // Check for partial matches in strict mode
    if (enableStrictMode && allowPartialMatches) {
      const strictViolations = this.checkStrictMode(sanitizedText);
      violations.push(...strictViolations);
      if (strictViolations.length > 0 && severity === 'none') {
        severity = 'moderate';
      }
    }

    // Generate suggestions for inappropriate content
    const suggestions = this.generateSuggestions(sanitizedText, violations);

    return {
      isClean: violations.length === 0,
      filteredText,
      violations,
      severity,
      suggestions
    };
  }

  /**
   * Quick check if text is clean (boolean only)
   */
  isClean(text: string, options: ProfanityFilterOptions = {}): boolean {
    return this.checkText(text, options).isClean;
  }

  /**
   * Get filtered version of text
   */
  filterText(text: string, options: ProfanityFilterOptions = {}): string {
    return this.checkText(text, options).filteredText;
  }

  /**
   * Strict mode checking for subtle inappropriate content
   */
  private checkStrictMode(text: string): string[] {
    const violations: string[] = [];
    const lowerText = text.toLowerCase();

    // Check for repeated characters (spam)
    if (/(.)\1{4,}/.test(text)) {
      violations.push('Contains excessive repeated characters');
    }

    // Check for excessive caps
    if (text.length > 3 && text === text.toUpperCase() && /[A-Z]/.test(text)) {
      violations.push('Contains excessive capital letters');
    }

    // Check for numbers replacing letters (l33t speak detection)
    const leetPatterns = [
      /[4@]ss/i, /[3e]gg/i, /[0o]rn/i, /[1l]ck/i, /[5s]hit/i
    ];
    
    for (const pattern of leetPatterns) {
      if (pattern.test(lowerText)) {
        violations.push('Contains disguised inappropriate content');
        break;
      }
    }

    // Check for multiple spaces or special characters (obfuscation)
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{3,}/.test(text)) {
      violations.push('Contains excessive special characters');
    }

    return violations;
  }

  /**
   * Generate positive alternatives for flagged content
   */
  private generateSuggestions(text: string, violations: string[]): string[] | undefined {
    if (violations.length === 0) return undefined;

    const suggestions: string[] = [];
    const lowerText = text.toLowerCase();

    // Find words that have alternatives
    Object.entries(POSITIVE_ALTERNATIVES).forEach(([word, alternatives]) => {
      if (lowerText.includes(word)) {
        suggestions.push(...alternatives.slice(0, 2)); // Limit to 2 suggestions per word
      }
    });

    // Generic suggestions based on violation type
    if (violations.some(v => v.includes('inappropriate language'))) {
      suggestions.push('Try using positive language', 'Consider a more family-friendly approach');
    }

    if (violations.some(v => v.includes('game-inappropriate'))) {
      suggestions.push('Pick a more creative team name', 'Try something more original');
    }

    if (violations.some(v => v.includes('excessive'))) {
      suggestions.push('Try a simpler approach', 'Keep it short and sweet');
    }

    // Remove duplicates and limit to 3 suggestions
    return [...new Set(suggestions)].slice(0, 3);
  }

  /**
   * Validate team name specifically
   */
  validateTeamName(teamName: string): ProfanityCheckResult {
    // Team names have specific requirements
    const result = this.checkText(teamName, {
      enableGameSpecificFilter: true,
      enableStrictMode: true,
      allowPartialMatches: true
    });

    // Additional team name validations
    if (teamName.length < 2) {
      result.violations.push('Team name too short');
      result.isClean = false;
      result.severity = 'moderate';
    }

    if (teamName.length > 30) {
      result.violations.push('Team name too long');
      result.isClean = false;
      result.severity = 'mild';
    }

    // Check for admin/system impersonation
    const adminTerms = ['admin', 'moderator', 'host', 'system', 'official', 'staff'];
    const lowerName = teamName.toLowerCase();
    
    if (adminTerms.some(term => lowerName.includes(term))) {
      result.violations.push('Cannot impersonate system roles');
      result.isClean = false;
      result.severity = 'severe';
    }

    return result;
  }

  /**
   * Validate chat message specifically
   */
  validateChatMessage(message: string): ProfanityCheckResult {
    // Chat messages are more lenient but still filtered
    return this.checkText(message, {
      enableGameSpecificFilter: false, // Allow competitive banter
      enableStrictMode: false,
      allowPartialMatches: false
    });
  }

  /**
   * Add custom words to filter
   */
  addCustomWords(words: string[]): void {
    if (!this.isInitialized) return;
    
    try {
      this.filter.addWords(...words);
    } catch (error) {
      console.error('Failed to add custom words:', error);
    }
  }

  /**
   * Remove words from filter (whitelist)
   */
  removeWords(words: string[]): void {
    if (!this.isInitialized) return;
    
    try {
      this.filter.removeWords(...words);
    } catch (error) {
      console.error('Failed to remove words:', error);
    }
  }

  /**
   * Get statistics about filtering
   */
  getFilterStats(): {
    totalWordsFiltered: number;
    customWordsCount: number;
    whitelistCount: number;
  } {
    return {
      totalWordsFiltered: this.filter?.list?.length || 0,
      customWordsCount: GAME_SPECIFIC_INAPPROPRIATE_WORDS.length,
      whitelistCount: WHITELIST_WORDS.length
    };
  }
}

// Create and export singleton instance
export const profanityFilter = new ProfanityFilterService();

export default profanityFilter; 
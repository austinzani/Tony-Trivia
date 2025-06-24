import DOMPurify from 'dompurify';
import validator from 'validator';
import { z } from 'zod';

// ==========================================
// SANITIZATION UTILITIES
// ==========================================

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed - plain text only
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Sanitize user input for display names, team names, etc.
 */
export function sanitizeUserInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>\"'&]/g, '') // Remove potentially dangerous characters
    .substring(0, 100); // Limit length
}

/**
 * Sanitize text for answers and messages
 */
export function sanitizeText(input: string, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  
  return sanitized.trim().substring(0, maxLength);
}

/**
 * Sanitize file names for uploads
 */
export function sanitizeFileName(fileName: string): string {
  if (typeof fileName !== 'string') return 'file';
  
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
}

// ==========================================
// VALIDATION SCHEMAS
// ==========================================

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
  // Allow letters, numbers, spaces, and common punctuation
  DISPLAY_NAME: /^[a-zA-Z0-9\s\-_'.]+$/,
  
  // Team names - letters, numbers, spaces, and safe symbols
  TEAM_NAME: /^[a-zA-Z0-9\s\-_!?]+$/,
  
  // Game room codes - alphanumeric only
  GAME_CODE: /^[A-Z0-9]{6}$/,
  
  // Answer text - allow most characters but not scripts
  ANSWER_TEXT: /^[a-zA-Z0-9\s\-_.,!?'"()]+$/,
  
  // URLs for avatars
  URL: /^https?:\/\/.+/,
} as const;

/**
 * Enhanced profanity filter integration
 * Uses the comprehensive profanity filtering service
 */
import { profanityFilter } from '../services/profanityFilter';

export function containsProfanity(text: string): boolean {
  if (typeof text !== 'string') return false;
  
  return !profanityFilter.isClean(text);
}

export function filterProfanity(text: string): string {
  if (typeof text !== 'string') return '';
  
  return profanityFilter.filterText(text);
}

/**
 * Enhanced profanity check with detailed results
 */
export function checkProfanity(text: string) {
  if (typeof text !== 'string') return { isClean: true, violations: [] };
  
  return profanityFilter.checkText(text);
}

/**
 * Validate team name with comprehensive checks
 */
export function validateTeamNameProfanity(teamName: string) {
  if (typeof teamName !== 'string') return { isClean: false, violations: ['Invalid input'] };
  
  return profanityFilter.validateTeamName(teamName);
}

/**
 * Validate chat message with appropriate filtering
 */
export function validateChatMessageProfanity(message: string) {
  if (typeof message !== 'string') return { isClean: false, violations: ['Invalid input'] };
  
  return profanityFilter.validateChatMessage(message);
}

// ==========================================
// ZOD VALIDATION SCHEMAS
// ==========================================

/**
 * Enhanced validation schemas with security measures
 */
export const SecuritySchemas = {
  // User display name
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .min(2, 'Display name must be at least 2 characters')
    .max(30, 'Display name must be less than 30 characters')
    .regex(ValidationPatterns.DISPLAY_NAME, 'Display name contains invalid characters')
    .refine(name => {
      const check = checkProfanity(name);
      return check.isClean;
    }, 'Display name contains inappropriate content')
    .transform(sanitizeUserInput),

  // Team name - uses enhanced validation
  teamName: z
    .string()
    .min(1, 'Team name is required')
    .regex(ValidationPatterns.TEAM_NAME, 'Team name contains invalid characters')
    .refine(name => {
      const validation = validateTeamNameProfanity(name);
      return validation.isClean;
    }, data => {
      const validation = validateTeamNameProfanity(data);
      return { message: validation.violations[0] || 'Team name contains inappropriate content' };
    })
    .transform(sanitizeUserInput),

  // Game room name
  gameRoomName: z
    .string()
    .min(1, 'Game room name is required')
    .min(3, 'Game room name must be at least 3 characters')
    .max(50, 'Game room name must be less than 50 characters')
    .regex(ValidationPatterns.DISPLAY_NAME, 'Game room name contains invalid characters')
    .refine(name => {
      const check = checkProfanity(name);
      return check.isClean;
    }, 'Game room name contains inappropriate content')
    .transform(sanitizeUserInput),

  // Answer text
  answerText: z
    .string()
    .min(1, 'Answer is required')
    .max(500, 'Answer is too long')
    .regex(ValidationPatterns.ANSWER_TEXT, 'Answer contains invalid characters')
    .transform(text => sanitizeText(text, 500)),

  // Game code
  gameCode: z
    .string()
    .min(6, 'Game code must be 6 characters')
    .max(6, 'Game code must be 6 characters')
    .regex(ValidationPatterns.GAME_CODE, 'Game code must contain only uppercase letters and numbers')
    .transform(code => code.toUpperCase()),

  // Email validation
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long')
    .refine(email => validator.isEmail(email), 'Invalid email format')
    .transform(email => email.toLowerCase().trim()),

  // Password validation
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password is too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  // URL validation for avatars
  avatarUrl: z
    .string()
    .url('Invalid URL format')
    .regex(ValidationPatterns.URL, 'URL must use HTTP or HTTPS')
    .refine(url => validator.isURL(url, { protocols: ['http', 'https'] }), 'Invalid URL'),

  // Chat message - uses enhanced validation
  chatMessage: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(280, 'Message is too long')
    .refine(msg => {
      const validation = validateChatMessageProfanity(msg);
      return validation.isClean;
    }, data => {
      const validation = validateChatMessageProfanity(data);
      return { message: validation.violations[0] || 'Message contains inappropriate content' };
    })
    .transform(text => sanitizeText(text, 280)),
} as const;

// ==========================================
// RATE LIMITING UTILITIES
// ==========================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private cache = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.cache.get(key);

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.cache.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemainingRequests(key: string): number {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  getResetTime(key: string): number {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return 0;
    }
    return entry.resetTime;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Create rate limiters for different actions
export const rateLimiters = {
  // Answer submissions: 10 per minute
  answerSubmission: new RateLimiter(10, 60 * 1000),
  
  // Team creation: 3 per 5 minutes
  teamCreation: new RateLimiter(3, 5 * 60 * 1000),
  
  // Game room creation: 5 per 10 minutes
  gameRoomCreation: new RateLimiter(5, 10 * 60 * 1000),
  
  // Chat messages: 30 per minute
  chatMessage: new RateLimiter(30, 60 * 1000),
  
  // Login attempts: 5 per 15 minutes
  loginAttempt: new RateLimiter(5, 15 * 60 * 1000),
} as const;

// ==========================================
// SECURITY VALIDATION HELPER
// ==========================================

/**
 * Comprehensive security validation for form data
 */
export function validateSecurely<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  rateLimitKey?: string,
  rateLimiter?: RateLimiter
): { success: true; data: T } | { success: false; error: string } {
  try {
    // Check rate limiting first
    if (rateLimitKey && rateLimiter && !rateLimiter.isAllowed(rateLimitKey)) {
      return {
        success: false,
        error: 'Too many requests. Please try again later.',
      };
    }

    // Validate with Zod schema
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const errors = result.error.issues.map(issue => issue.message).join(', ');
      return {
        success: false,
        error: errors,
      };
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error('Security validation error:', error);
    return {
      success: false,
      error: 'Validation failed. Please check your input.',
    };
  }
}

// ==========================================
// EXPORTS
// ==========================================

export default {
  sanitizeHtml,
  sanitizeUserInput,
  sanitizeText,
  sanitizeFileName,
  containsProfanity,
  filterProfanity,
  ValidationPatterns,
  SecuritySchemas,
  rateLimiters,
  validateSecurely,
}; 
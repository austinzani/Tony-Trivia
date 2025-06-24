import { rateLimiters, validateSecurely } from '../utils/security';
import { z } from 'zod';

interface ApiCall {
  method: string;
  endpoint: string;
  data?: any;
  userId?: string;
}

interface RateLimitConfig {
  key: string;
  limiter: typeof rateLimiters[keyof typeof rateLimiters];
  message?: string;
}

/**
 * Rate limiting configurations for different API endpoints
 */
const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Answer submissions
  'POST:/api/answers': {
    key: 'answer_submission',
    limiter: rateLimiters.answerSubmission,
    message: 'Too many answer submissions. Please wait before submitting again.',
  },
  
  // Team creation
  'POST:/api/teams': {
    key: 'team_creation',
    limiter: rateLimiters.teamCreation,
    message: 'Team creation limit reached. Please wait before creating another team.',
  },
  
  // Game room creation
  'POST:/api/game-rooms': {
    key: 'game_room_creation',
    limiter: rateLimiters.gameRoomCreation,
    message: 'Game room creation limit reached. Please wait before creating another room.',
  },
  
  // Chat messages
  'POST:/api/chat': {
    key: 'chat_message',
    limiter: rateLimiters.chatMessage,
    message: 'Too many messages. Please slow down.',
  },
  
  // Login attempts
  'POST:/api/auth/login': {
    key: 'login_attempt',
    limiter: rateLimiters.loginAttempt,
    message: 'Too many login attempts. Please wait before trying again.',
  },
};

/**
 * Generate a rate limit key based on the API call and user
 */
function generateRateLimitKey(call: ApiCall, baseKey: string): string {
  const { method, endpoint, userId } = call;
  
  // Use IP address simulation (in a real app, you'd get this from headers)
  const clientId = userId || `client_${Date.now() % 1000000}`;
  
  return `${baseKey}:${method}:${endpoint}:${clientId}`;
}

/**
 * Check if an API call is rate limited
 */
export function checkRateLimit(call: ApiCall): {
  allowed: boolean;
  error?: string;
  remainingRequests?: number;
  resetTime?: number;
} {
  const configKey = `${call.method}:${call.endpoint}`;
  const config = RATE_LIMIT_CONFIGS[configKey];
  
  if (!config) {
    // No rate limiting configured for this endpoint
    return { allowed: true };
  }
  
  const rateLimitKey = generateRateLimitKey(call, config.key);
  
  if (!config.limiter.isAllowed(rateLimitKey)) {
    return {
      allowed: false,
      error: config.message || 'Rate limit exceeded',
      remainingRequests: config.limiter.getRemainingRequests(rateLimitKey),
      resetTime: config.limiter.getResetTime(rateLimitKey),
    };
  }
  
  return {
    allowed: true,
    remainingRequests: config.limiter.getRemainingRequests(rateLimitKey),
    resetTime: config.limiter.getResetTime(rateLimitKey),
  };
}

/**
 * Rate limiting middleware for API calls
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  endpoint: string,
  method: string = 'POST'
): T {
  return (async (...args: Parameters<T>) => {
    // Extract user ID if available (this would typically come from auth context)
    const userId = getCurrentUserId();
    
    const call: ApiCall = {
      method,
      endpoint,
      data: args[0],
      userId,
    };
    
    const rateLimitResult = checkRateLimit(call);
    
    if (!rateLimitResult.allowed) {
      throw new Error(rateLimitResult.error || 'Rate limit exceeded');
    }
    
    try {
      const result = await apiFunction(...args);
      return result;
    } catch (error) {
      // Log the error but don't affect rate limiting
      console.error(`API call failed for ${method} ${endpoint}:`, error);
      throw error;
    }
  }) as T;
}

/**
 * Get current user ID (placeholder - replace with actual auth implementation)
 */
function getCurrentUserId(): string | undefined {
  // In a real implementation, this would get the user ID from:
  // - Auth context
  // - JWT token
  // - Session storage
  // For now, return undefined to use IP-based rate limiting
  return undefined;
}

/**
 * Rate limiting decorator for service methods
 */
export function RateLimit(endpoint: string, method: string = 'POST') {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = withRateLimit(originalMethod, endpoint, method);
    
    return descriptor;
  };
}

/**
 * Bulk rate limit check for multiple endpoints
 */
export function checkBulkRateLimit(calls: ApiCall[]): {
  allowed: boolean;
  failedCalls: Array<{
    call: ApiCall;
    error: string;
  }>;
} {
  const failedCalls: Array<{ call: ApiCall; error: string }> = [];
  
  for (const call of calls) {
    const result = checkRateLimit(call);
    if (!result.allowed) {
      failedCalls.push({
        call,
        error: result.error || 'Rate limit exceeded',
      });
    }
  }
  
  return {
    allowed: failedCalls.length === 0,
    failedCalls,
  };
}

/**
 * Get rate limit status for all configured endpoints
 */
export function getRateLimitStatus(userId?: string): Record<string, {
  remainingRequests: number;
  resetTime: number;
  isLimited: boolean;
}> {
  const status: Record<string, any> = {};
  
  Object.entries(RATE_LIMIT_CONFIGS).forEach(([endpoint, config]) => {
    const rateLimitKey = generateRateLimitKey(
      { method: 'GET', endpoint: '/status', userId },
      config.key
    );
    
    const remainingRequests = config.limiter.getRemainingRequests(rateLimitKey);
    const resetTime = config.limiter.getResetTime(rateLimitKey);
    
    status[endpoint] = {
      remainingRequests,
      resetTime,
      isLimited: remainingRequests === 0,
    };
  });
  
  return status;
}

/**
 * Clear all rate limits (useful for testing)
 */
export function clearAllRateLimits(): void {
  Object.values(rateLimiters).forEach(limiter => {
    limiter.clear();
  });
}

export default {
  checkRateLimit,
  withRateLimit,
  RateLimit,
  checkBulkRateLimit,
  getRateLimitStatus,
  clearAllRateLimits,
}; 
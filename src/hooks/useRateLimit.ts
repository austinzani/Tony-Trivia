import { useCallback, useRef, useState, useEffect } from 'react';
import throttle from 'lodash.throttle';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  throttleMs?: number;
  onRateLimit?: (remainingTime: number) => void;
}

interface RateLimitState {
  isAllowed: boolean;
  remainingRequests: number;
  resetTime: number;
  isThrottled: boolean;
}

/**
 * React hook for client-side rate limiting with throttling
 */
export function useRateLimit(
  action: (...args: any[]) => Promise<any> | any,
  options: RateLimitOptions
): [(...args: any[]) => Promise<void>, RateLimitState] {
  const {
    maxRequests,
    windowMs,
    throttleMs = 1000,
    onRateLimit,
  } = options;

  const requestsRef = useRef<number[]>([]);
  const [state, setState] = useState<RateLimitState>({
    isAllowed: true,
    remainingRequests: maxRequests,
    resetTime: 0,
    isThrottled: false,
  });

  // Clean old requests from the window
  const cleanOldRequests = useCallback(() => {
    const now = Date.now();
    requestsRef.current = requestsRef.current.filter(
      timestamp => now - timestamp < windowMs
    );
  }, [windowMs]);

  // Check if request is allowed
  const isRequestAllowed = useCallback(() => {
    cleanOldRequests();
    return requestsRef.current.length < maxRequests;
  }, [maxRequests, cleanOldRequests]);

  // Update state
  const updateState = useCallback(() => {
    cleanOldRequests();
    const now = Date.now();
    const remainingRequests = Math.max(0, maxRequests - requestsRef.current.length);
    const oldestRequest = requestsRef.current[0];
    const resetTime = oldestRequest ? oldestRequest + windowMs : 0;

    setState({
      isAllowed: remainingRequests > 0,
      remainingRequests,
      resetTime,
      isThrottled: false,
    });
  }, [maxRequests, windowMs, cleanOldRequests]);

  // Throttled action
  const throttledAction = useCallback(
    throttle(
      async (...args: any[]) => {
        setState(prev => ({ ...prev, isThrottled: true }));
        
        if (!isRequestAllowed()) {
          const resetTime = requestsRef.current[0] + windowMs;
          const remainingTime = Math.max(0, resetTime - Date.now());
          
          onRateLimit?.(remainingTime);
          setState(prev => ({ 
            ...prev, 
            isThrottled: false,
            isAllowed: false 
          }));
          return;
        }

        // Record the request
        requestsRef.current.push(Date.now());
        
        try {
          await action(...args);
        } finally {
          setState(prev => ({ ...prev, isThrottled: false }));
          updateState();
        }
      },
      throttleMs,
      { leading: true, trailing: false }
    ),
    [action, throttleMs, isRequestAllowed, onRateLimit, windowMs, updateState]
  );

  // Update state on mount and periodically
  useEffect(() => {
    updateState();
    const interval = setInterval(updateState, 1000);
    return () => clearInterval(interval);
  }, [updateState]);

  return [throttledAction, state];
}

/**
 * Specialized hook for answer submissions
 */
export function useAnswerSubmissionRateLimit(
  submitAction: (answer: string) => Promise<void>
) {
  return useRateLimit(submitAction, {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    throttleMs: 2000, // 2 second throttle
    onRateLimit: (remainingTime) => {
      console.warn(`Rate limited. Try again in ${Math.ceil(remainingTime / 1000)} seconds`);
    },
  });
}

/**
 * Specialized hook for chat messages
 */
export function useChatRateLimit(
  sendMessage: (message: string) => Promise<void>
) {
  return useRateLimit(sendMessage, {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    throttleMs: 1000, // 1 second throttle
    onRateLimit: (remainingTime) => {
      console.warn(`Too many messages. Try again in ${Math.ceil(remainingTime / 1000)} seconds`);
    },
  });
}

/**
 * Specialized hook for team/game creation
 */
export function useCreationRateLimit(
  createAction: (...args: any[]) => Promise<void>
) {
  return useRateLimit(createAction, {
    maxRequests: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes
    throttleMs: 3000, // 3 second throttle
    onRateLimit: (remainingTime) => {
      console.warn(`Creation rate limited. Try again in ${Math.ceil(remainingTime / 1000)} seconds`);
    },
  });
}

/**
 * Specialized hook for API requests
 */
export function useApiRateLimit(
  apiCall: (...args: any[]) => Promise<any>
) {
  return useRateLimit(apiCall, {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    throttleMs: 100, // 100ms throttle
    onRateLimit: (remainingTime) => {
      console.warn(`API rate limited. Try again in ${Math.ceil(remainingTime / 1000)} seconds`);
    },
  });
}

export default useRateLimit; 
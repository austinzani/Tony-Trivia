import { supabase } from '../services/supabase';

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  retryOn?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export interface NetworkAwareApiOptions extends RetryOptions {
  timeout?: number;
  abortSignal?: AbortSignal;
}

// Default retry conditions
const defaultShouldRetry = (error: any): boolean => {
  // Retry on network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  // Retry on specific HTTP status codes
  if (error.status) {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status);
  }
  
  // Retry on Supabase connection errors
  if (error.message) {
    const retryableMessages = [
      'network',
      'timeout',
      'connection',
      'unreachable',
      'disconnected'
    ];
    
    return retryableMessages.some(msg => 
      error.message.toLowerCase().includes(msg)
    );
  }
  
  return false;
};

// Exponential backoff delay calculation
const calculateDelay = (
  attempt: number, 
  baseDelay: number, 
  exponential: boolean
): number => {
  if (!exponential) return baseDelay;
  
  // Exponential backoff with jitter
  const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
  const jitter = Math.random() * 1000; // Add 0-1000ms jitter
  
  return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
};

// Generic retry wrapper
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    retryOn = defaultShouldRetry,
    onRetry
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt > maxRetries) {
        break;
      }
      
      // Check if we should retry this error
      if (!retryOn(error)) {
        break;
      }
      
      // Calculate delay and notify retry callback
      const delay = calculateDelay(attempt, retryDelay, exponentialBackoff);
      onRetry?.(attempt, error);
      
      console.warn(
        `API call failed (attempt ${attempt}/${maxRetries + 1}), retrying in ${delay}ms:`,
        error
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Network-aware Supabase wrapper
export class NetworkAwareSupabase {
  static async query<T>(
    queryBuilder: any,
    options: NetworkAwareApiOptions = {}
  ): Promise<T> {
    return withRetry(async () => {
      const result = await queryBuilder;
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data;
    }, options);
  }
  
  static async rpc(
    functionName: string,
    params: any = {},
    options: NetworkAwareApiOptions = {}
  ): Promise<any> {
    return withRetry(async () => {
      const result = await supabase.rpc(functionName, params);
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data;
    }, options);
  }
  
  static async storage(
    operation: () => Promise<any>,
    options: NetworkAwareApiOptions = {}
  ): Promise<any> {
    return withRetry(async () => {
      const result = await operation();
      
      if (result.error) {
        throw result.error;
      }
      
      return result.data;
    }, options);
  }
}

// React Query integration
export const createNetworkAwareQuery = (
  queryFn: () => Promise<any>,
  options: NetworkAwareApiOptions = {}
) => {
  return () => withRetry(queryFn, {
    maxRetries: 2,
    retryDelay: 2000,
    exponentialBackoff: true,
    onRetry: (attempt, error) => {
      console.log(`Query retry attempt ${attempt}:`, error.message);
    },
    ...options
  });
};

// Optimistic update utilities
export class OptimisticUpdateManager {
  private pendingUpdates = new Map<string, any>();
  
  async executeWithOptimisticUpdate<T>(
    key: string,
    optimisticData: T,
    operation: () => Promise<T>,
    rollbackCallback?: (data: T) => void
  ): Promise<T> {
    try {
      // Store the optimistic update
      this.pendingUpdates.set(key, optimisticData);
      
      // Execute the operation with retry logic
      const result = await withRetry(operation, {
        maxRetries: 3,
        onRetry: (attempt, error) => {
          console.log(`Optimistic update retry ${attempt} for ${key}:`, error);
        }
      });
      
      // Clear the pending update on success
      this.pendingUpdates.delete(key);
      
      return result;
    } catch (error) {
      // Rollback the optimistic update
      const pendingData = this.pendingUpdates.get(key);
      this.pendingUpdates.delete(key);
      
      if (pendingData && rollbackCallback) {
        rollbackCallback(pendingData);
      }
      
      throw error;
    }
  }
  
  getPendingUpdate<T>(key: string): T | undefined {
    return this.pendingUpdates.get(key);
  }
  
  hasPendingUpdate(key: string): boolean {
    return this.pendingUpdates.has(key);
  }
}

// Global instance
export const optimisticUpdateManager = new OptimisticUpdateManager();

// Helper for React Query mutations with network awareness
export const createNetworkAwareMutation = (
  mutationFn: (variables: any) => Promise<any>,
  options: NetworkAwareApiOptions = {}
) => {
  return (variables: any) => withRetry(
    () => mutationFn(variables),
    {
      maxRetries: 2,
      retryDelay: 1000,
      exponentialBackoff: true,
      ...options
    }
  );
}; 
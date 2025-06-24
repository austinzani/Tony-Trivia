import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Performance-optimized Supabase client configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Optimize token refresh
    refreshToken: {
      retryDelayMultiplier: 2,
      maxRetryCount: 3,
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 20, // Increased from 10 for better throughput
      heartbeatIntervalMs: 30000, // 30 seconds for better connection management
      reconnectAfterMs: 1000, // Quick reconnection for better UX
    },
    // Enable compression for large payloads
    encode: (payload, callback) => {
      // Basic payload optimization - could be enhanced with compression
      const optimized = JSON.stringify(payload);
      callback(optimized);
    },
    decode: (payload, callback) => {
      try {
        const decoded = JSON.parse(payload);
        callback(decoded);
      } catch (error) {
        console.error('Failed to decode realtime payload:', error);
        callback(null);
      }
    },
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      // Performance headers
      'Cache-Control': 'max-age=60', // Basic caching for static queries
      'Prefer': 'return=representation', // Get full response for better caching
    },
  },
});

// Query performance optimization utilities
export class QueryOptimizer {
  private static queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private static readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Enhanced query builder with automatic optimization
  static optimizedQuery(table: string) {
    return {
      select: (columns: string = '*', options?: { cache?: boolean; ttl?: number }) => {
        const cacheKey = `${table}:${columns}`;
        
        return {
          // Add performance hints to queries
          single: async () => {
            if (options?.cache) {
              const cached = this.getFromCache(cacheKey);
              if (cached) return { data: cached, error: null };
            }

            const query = supabase
              .from(table)
              .select(columns)
              .limit(1)
              .single();

            const result = await query;

            if (options?.cache && result.data) {
              this.setCache(cacheKey, result.data, options.ttl);
            }

            return result;
          },
          
          // Optimized list queries with built-in pagination
          list: async (filters?: any, limit = 50, offset = 0) => {
            const filterKey = filters ? JSON.stringify(filters) : '';
            const listCacheKey = `${cacheKey}:list:${filterKey}:${limit}:${offset}`;
            
            if (options?.cache) {
              const cached = this.getFromCache(listCacheKey);
              if (cached) return { data: cached, error: null };
            }

            let query = supabase
              .from(table)
              .select(columns, { count: 'exact' })
              .range(offset, offset + limit - 1);

            // Apply filters efficiently
            if (filters) {
              Object.entries(filters).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                  query = query.in(key, value);
                } else {
                  query = query.eq(key, value);
                }
              });
            }

            const result = await query;

            if (options?.cache && result.data) {
              this.setCache(listCacheKey, result.data, options.ttl);
            }

            return result;
          },
        };
      },
    };
  }

  // Cache management
  private static setCache(key: string, data: any, ttl = this.DEFAULT_CACHE_TTL) {
    this.queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private static getFromCache(key: string) {
    const cached = this.queryCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.queryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  static clearCache(pattern?: string) {
    if (pattern) {
      for (const key of this.queryCache.keys()) {
        if (key.includes(pattern)) {
          this.queryCache.delete(key);
        }
      }
    } else {
      this.queryCache.clear();
    }
  }

  // Database hints for better performance
  static getPerformanceHints() {
    return {
      // Suggest indexes for common queries
      suggestedIndexes: [
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_rooms_host_active ON game_rooms(host_id, is_active);',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teams_game_room ON teams(game_room_id);',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_user ON team_members(user_id);',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_answers_team_question ON team_answers(team_id, question_id);',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_round_order ON questions(game_round_id, order_index);',
        'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_game_state_room ON game_state(game_room_id);',
      ],
      // RLS policy optimizations
      rslOptimizations: [
        'Add policies that use indexed columns',
        'Use security definer functions for complex queries',
        'Implement row-level security with indexed predicates',
      ],
    };
  }
}

// Performance monitoring for database queries
export class DatabaseMetrics {
  private static queryTimes = new Map<string, number[]>();
  
  static startTimer(queryId: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      
      if (!this.queryTimes.has(queryId)) {
        this.queryTimes.set(queryId, []);
      }
      
      const times = this.queryTimes.get(queryId)!;
      times.push(duration);
      
      // Keep only last 100 measurements
      if (times.length > 100) {
        times.shift();
      }
      
      // Log slow queries
      if (duration > 1000) { // > 1 second
        console.warn(`Slow query detected: ${queryId} took ${duration.toFixed(2)}ms`);
      }
    };
  }
  
  static getQueryStats(queryId: string) {
    const times = this.queryTimes.get(queryId) || [];
    if (times.length === 0) return null;
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    return { avg, min, max, count: times.length };
  }
  
  static getAllStats() {
    const stats: Record<string, any> = {};
    for (const [queryId, times] of this.queryTimes.entries()) {
      stats[queryId] = this.getQueryStats(queryId);
    }
    return stats;
  }
}

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Export types for use throughout the app
export type { 
  User, 
  Session, 
  AuthError,
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  PostgrestError,
  PostgrestResponse
} from '@supabase/supabase-js'; 
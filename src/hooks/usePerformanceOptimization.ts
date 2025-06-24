import { useState, useEffect, useCallback, useRef } from 'react';
import {
  realtimeOptimizer,
  measurePerformance,
  createOptimizedHandler,
  type PerformanceMetrics,
  type DeltaData,
  type ConflictResolutionStrategy,
  type DebounceConfig,
  type ThrottleConfig
} from '../services/realtimePerformanceOptimizer';

interface UsePerformanceOptimizationOptions {
  enableMetrics?: boolean;
  enableCaching?: boolean;
  enableDeltaSync?: boolean;
  metricsUpdateInterval?: number;
  autoOptimize?: boolean;
}

interface UsePerformanceOptimizationReturn {
  // Metrics
  metrics: PerformanceMetrics | null;
  healthScore: number;
  cacheStats: { size: number; hitRate: number; entries: number };
  
  // Optimization functions
  debounce: <T extends (...args: any[]) => any>(
    key: string,
    func: T,
    config: DebounceConfig
  ) => (...args: Parameters<T>) => void;
  
  throttle: <T extends (...args: any[]) => any>(
    key: string,
    func: T,
    config: ThrottleConfig
  ) => (...args: Parameters<T>) => boolean;
  
  // Caching
  setCache: <T>(key: string, data: T, ttl?: number, priority?: number) => void;
  getCache: <T>(key: string) => T | null;
  invalidateCache: (key: string) => void;
  clearCache: () => void;
  
  // Delta synchronization
  createDelta: (
    entityId: string,
    type: DeltaData['type'],
    entity: string,
    changes: Record<string, any>,
    previous?: Record<string, any>
  ) => DeltaData;
  
  applyDelta: (delta: DeltaData, currentState: any) => any;
  optimizeDeltas: (deltas: DeltaData[]) => DeltaData[];
  
  // Conflict resolution
  setConflictResolver: (entity: string, strategy: ConflictResolutionStrategy) => void;
  resolveConflict: (entity: string, localData: any, remoteData: any, baseData?: any) => any;
  
  // Performance monitoring
  recordLatency: (duration: number) => void;
  recordEvent: (bytes?: number) => void;
  recordReconnection: () => void;
  recordPacketDrop: () => void;
  measurePerformance: <T>(name: string, fn: () => T | Promise<T>) => T | Promise<T>;
  createOptimizedHandler: <T extends (...args: any[]) => any>(
    key: string,
    handler: T,
    options: {
      debounce?: DebounceConfig;
      throttle?: ThrottleConfig;
      cache?: { ttl?: number; priority?: number };
    }
  ) => T;
  
  // State
  isOptimizationEnabled: boolean;
  optimizationLevel: 'low' | 'medium' | 'high' | 'aggressive';
  
  // Controls
  enableOptimization: () => void;
  disableOptimization: () => void;
  setOptimizationLevel: (level: 'low' | 'medium' | 'high' | 'aggressive') => void;
  resetMetrics: () => void;
}

export function usePerformanceOptimization(
  options: UsePerformanceOptimizationOptions = {}
): UsePerformanceOptimizationReturn {
  const {
    enableMetrics = true,
    enableCaching = true,
    enableDeltaSync = true,
    metricsUpdateInterval = 5000,
    autoOptimize = true
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [healthScore, setHealthScore] = useState(100);
  const [cacheStats, setCacheStats] = useState({ size: 0, hitRate: 0, entries: 0 });
  const [isOptimizationEnabled, setIsOptimizationEnabled] = useState(autoOptimize);
  const [optimizationLevel, setOptimizationLevel] = useState<'low' | 'medium' | 'high' | 'aggressive'>('medium');
  
  const metricsIntervalRef = useRef<NodeJS.Timeout>();
  const deltasRef = useRef<Map<string, DeltaData[]>>(new Map());

  // Performance monitoring setup
  useEffect(() => {
    if (!enableMetrics) return;

    const updateMetrics = () => {
      const currentMetrics = realtimeOptimizer.getMetrics();
      const currentHealthScore = realtimeOptimizer.getHealthScore();
      const currentCacheStats = realtimeOptimizer.getCacheStats();
      
      setMetrics(currentMetrics);
      setHealthScore(currentHealthScore);
      setCacheStats(currentCacheStats);
    };

    // Initial update
    updateMetrics();

    // Set up interval
    metricsIntervalRef.current = setInterval(updateMetrics, metricsUpdateInterval);

    // Listen for metrics updates from the optimizer
    const handleMetricsUpdate = (updatedMetrics: PerformanceMetrics) => {
      setMetrics(updatedMetrics);
      setHealthScore(realtimeOptimizer.getHealthScore());
      setCacheStats(realtimeOptimizer.getCacheStats());
    };

    realtimeOptimizer.on('metrics-updated', handleMetricsUpdate);

    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
      realtimeOptimizer.off('metrics-updated', handleMetricsUpdate);
    };
  }, [enableMetrics, metricsUpdateInterval]);

  // Delta synchronization setup
  useEffect(() => {
    if (!enableDeltaSync) return;

    const handleDeltasReady = ({ key, deltas }: { key: string; deltas: DeltaData[] }) => {
      deltasRef.current.set(key, deltas);
    };

    const handleConflictDetected = (conflictData: any) => {
      console.warn('Conflict detected:', conflictData);
      // Could emit an event for UI handling
    };

    realtimeOptimizer.on('deltas-ready', handleDeltasReady);
    realtimeOptimizer.on('conflict-detected', handleConflictDetected);

    return () => {
      realtimeOptimizer.off('deltas-ready', handleDeltasReady);
      realtimeOptimizer.off('conflict-detected', handleConflictDetected);
    };
  }, [enableDeltaSync]);

  // Auto-optimization based on performance
  useEffect(() => {
    if (!autoOptimize || !metrics) return;

    const currentHealth = healthScore;
    
    if (currentHealth < 30) {
      setOptimizationLevel('aggressive');
    } else if (currentHealth < 50) {
      setOptimizationLevel('high');
    } else if (currentHealth < 70) {
      setOptimizationLevel('medium');
    } else {
      setOptimizationLevel('low');
    }
  }, [autoOptimize, healthScore, metrics]);

  // Optimization functions with level-based configuration
  const getOptimizationConfig = useCallback(() => {
    switch (optimizationLevel) {
      case 'low':
        return {
          debounceDelay: 100,
          throttleLimit: 50,
          throttleWindow: 1000,
          cacheTtl: 300000, // 5 minutes
          cacheSize: 500
        };
      case 'medium':
        return {
          debounceDelay: 200,
          throttleLimit: 30,
          throttleWindow: 1000,
          cacheTtl: 600000, // 10 minutes
          cacheSize: 750
        };
      case 'high':
        return {
          debounceDelay: 300,
          throttleLimit: 20,
          throttleWindow: 1000,
          cacheTtl: 900000, // 15 minutes
          cacheSize: 1000
        };
      case 'aggressive':
        return {
          debounceDelay: 500,
          throttleLimit: 10,
          throttleWindow: 1000,
          cacheTtl: 1800000, // 30 minutes
          cacheSize: 1000
        };
    }
  }, [optimizationLevel]);

  // Debounce function with optimization level
  const debounce = useCallback(<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    config?: DebounceConfig
  ): (...args: Parameters<T>) => void => {
    if (!isOptimizationEnabled) return func;
    
    const optimConfig = getOptimizationConfig();
    const finalConfig = config || { delay: optimConfig.debounceDelay };
    
    return realtimeOptimizer.debounce(key, func, finalConfig);
  }, [isOptimizationEnabled, getOptimizationConfig]);

  // Throttle function with optimization level
  const throttle = useCallback(<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    config?: ThrottleConfig
  ): (...args: Parameters<T>) => boolean => {
    if (!isOptimizationEnabled) {
      return (...args: Parameters<T>) => {
        func(...args);
        return true;
      };
    }
    
    const optimConfig = getOptimizationConfig();
    const finalConfig = config || {
      limit: optimConfig.throttleLimit,
      window: optimConfig.throttleWindow
    };
    
    return realtimeOptimizer.throttle(key, func, finalConfig);
  }, [isOptimizationEnabled, getOptimizationConfig]);

  // Caching functions
  const setCache = useCallback(<T>(
    key: string,
    data: T,
    ttl?: number,
    priority = 1
  ): void => {
    if (!enableCaching) return;
    
    const optimConfig = getOptimizationConfig();
    realtimeOptimizer.setCache(key, data, ttl || optimConfig.cacheTtl, priority);
  }, [enableCaching, getOptimizationConfig]);

  const getCache = useCallback(<T>(key: string): T | null => {
    if (!enableCaching) return null;
    return realtimeOptimizer.getCache<T>(key);
  }, [enableCaching]);

  const invalidateCache = useCallback((key: string): void => {
    realtimeOptimizer.invalidateCache(key);
  }, []);

  const clearCache = useCallback((): void => {
    realtimeOptimizer.clearCache();
  }, []);

  // Delta functions
  const createDelta = useCallback((
    entityId: string,
    type: DeltaData['type'],
    entity: string,
    changes: Record<string, any>,
    previous?: Record<string, any>
  ): DeltaData => {
    return realtimeOptimizer.createDelta(entityId, type, entity, changes, previous);
  }, []);

  const applyDelta = useCallback((delta: DeltaData, currentState: any): any => {
    return realtimeOptimizer.applyDelta(delta, currentState);
  }, []);

  const optimizeDeltas = useCallback((deltas: DeltaData[]): DeltaData[] => {
    return realtimeOptimizer.optimizeDeltas(deltas);
  }, []);

  // Conflict resolution
  const setConflictResolver = useCallback((
    entity: string,
    strategy: ConflictResolutionStrategy
  ): void => {
    realtimeOptimizer.setConflictResolver(entity, strategy);
  }, []);

  const resolveConflict = useCallback((
    entity: string,
    localData: any,
    remoteData: any,
    baseData?: any
  ): any => {
    return realtimeOptimizer.resolveConflict(entity, localData, remoteData, baseData);
  }, []);

  // Performance monitoring
  const recordLatency = useCallback((duration: number): void => {
    realtimeOptimizer.recordLatency(duration);
  }, []);

  const recordEvent = useCallback((bytes?: number): void => {
    realtimeOptimizer.recordEvent(bytes);
  }, []);

  const recordReconnection = useCallback((): void => {
    realtimeOptimizer.recordReconnection();
  }, []);

  const recordPacketDrop = useCallback((): void => {
    realtimeOptimizer.recordPacketDrop();
  }, []);

  // Control functions
  const enableOptimization = useCallback((): void => {
    setIsOptimizationEnabled(true);
  }, []);

  const disableOptimization = useCallback((): void => {
    setIsOptimizationEnabled(false);
  }, []);

  const changeOptimizationLevel = useCallback((level: 'low' | 'medium' | 'high' | 'aggressive'): void => {
    setOptimizationLevel(level);
  }, []);

  const resetMetrics = useCallback((): void => {
    // Reset metrics in the optimizer
    realtimeOptimizer.dispose();
    // Note: The optimizer will reinitialize itself
  }, []);

  // Performance measurement wrapper
  const performanceMeasure = useCallback(<T>(
    name: string,
    fn: () => T | Promise<T>
  ): T | Promise<T> => {
    return measurePerformance(name, fn);
  }, []);

  // Optimized handler creator
  const optimizedHandler = useCallback(<T extends (...args: any[]) => any>(
    key: string,
    handler: T,
    optimOptions?: {
      debounce?: DebounceConfig;
      throttle?: ThrottleConfig;
      cache?: { ttl?: number; priority?: number };
    }
  ): T => {
    if (!isOptimizationEnabled) return handler;
    
    return createOptimizedHandler(key, handler, optimOptions || {});
  }, [isOptimizationEnabled]);

  return {
    // Metrics
    metrics,
    healthScore,
    cacheStats,
    
    // Optimization functions
    debounce,
    throttle,
    
    // Caching
    setCache,
    getCache,
    invalidateCache,
    clearCache,
    
    // Delta synchronization
    createDelta,
    applyDelta,
    optimizeDeltas,
    
    // Conflict resolution
    setConflictResolver,
    resolveConflict,
    
    // Performance monitoring
    recordLatency,
    recordEvent,
    recordReconnection,
    recordPacketDrop,
    measurePerformance: performanceMeasure,
    createOptimizedHandler: optimizedHandler,
    
    // State
    isOptimizationEnabled,
    optimizationLevel,
    
    // Controls
    enableOptimization,
    disableOptimization,
    setOptimizationLevel: changeOptimizationLevel,
    resetMetrics
  };
}

// Specialized hooks for common use cases
export function useOptimizedRealTimeUpdates(contextId: string) {
  const optimizer = usePerformanceOptimization({
    enableMetrics: true,
    enableCaching: true,
    enableDeltaSync: true,
    autoOptimize: true
  });

  const optimizedUpdateHandler = useCallback((update: any) => {
    return optimizer.createOptimizedHandler(
      `realtime-update-${contextId}`,
      (data: any) => {
        // Handle the update
        console.log('Optimized update:', data);
      },
      {
        debounce: { delay: 100 },
        throttle: { limit: 20, window: 1000 }
      }
    )(update);
  }, [contextId, optimizer]);

  return {
    ...optimizer,
    optimizedUpdateHandler
  };
}

export function useOptimizedPresenceTracking(roomId: string) {
  const optimizer = usePerformanceOptimization({
    enableMetrics: true,
    enableCaching: true,
    autoOptimize: true
  });

  const cacheKey = `presence-${roomId}`;
  
  const getCachedPresence = useCallback(() => {
    return optimizer.getCache(cacheKey);
  }, [optimizer, cacheKey]);

  const setCachedPresence = useCallback((presence: any) => {
    optimizer.setCache(cacheKey, presence, 30000); // 30 second cache
  }, [optimizer, cacheKey]);

  const optimizedPresenceHandler = useCallback((presence: any) => {
    return optimizer.createOptimizedHandler(
      `presence-${roomId}`,
      (data: any) => {
        setCachedPresence(data);
      },
      {
        debounce: { delay: 500 }, // Longer debounce for presence
        cache: { ttl: 30000, priority: 2 }
      }
    )(presence);
  }, [roomId, optimizer, setCachedPresence]);

  return {
    ...optimizer,
    getCachedPresence,
    setCachedPresence,
    optimizedPresenceHandler
  };
} 
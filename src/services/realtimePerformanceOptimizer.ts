import { EventEmitter } from 'events';

// Performance monitoring interfaces
export interface PerformanceMetrics {
  latency: {
    average: number;
    min: number;
    max: number;
    p95: number;
    p99: number;
    samples: number[];
  };
  throughput: {
    eventsPerSecond: number;
    bytesPerSecond: number;
    peakEvents: number;
    totalEvents: number;
  };
  memory: {
    cacheSize: number;
    bufferSize: number;
    totalAllocated: number;
    gcCollections: number;
  };
  network: {
    reconnections: number;
    dropRate: number;
    bandwidth: number;
    quality: 'excellent' | 'good' | 'poor' | 'critical';
  };
  optimization: {
    debouncedEvents: number;
    throttledEvents: number;
    cachedHits: number;
    deltasApplied: number;
    conflictsResolved: number;
  };
}

export interface DeltaData {
  id: string;
  timestamp: number;
  type: 'create' | 'update' | 'delete';
  entity: string;
  changes: Record<string, any>;
  previous?: Record<string, any>;
  version: number;
  checksum: string;
}

export interface ConflictResolutionStrategy {
  strategy: 'last_write_wins' | 'merge' | 'user_choice' | 'custom';
  priority?: number;
  customResolver?: (local: any, remote: any, base?: any) => any;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  version: number;
  priority: number;
}

export interface DebounceConfig {
  delay: number;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}

export interface ThrottleConfig {
  limit: number;
  window: number; // milliseconds
  burst?: number;
}

class RealtimePerformanceOptimizer extends EventEmitter {
  private metrics: PerformanceMetrics;
  private cache = new Map<string, CacheEntry>();
  private debouncers = new Map<string, NodeJS.Timeout>();
  private throttlers = new Map<string, { count: number; window: number; lastReset: number }>();
  private deltaBuffer = new Map<string, DeltaData[]>();
  private conflictResolvers = new Map<string, ConflictResolutionStrategy>();
  private performanceObserver?: PerformanceObserver;
  private isMonitoring = false;
  
  // Configuration
  private readonly maxCacheSize = 1000;
  private readonly maxBufferSize = 500;
  private readonly defaultTtl = 300000; // 5 minutes
  private readonly metricsUpdateInterval = 5000; // 5 seconds
  private readonly deltaFlushInterval = 1000; // 1 second
  private readonly conflictRetryLimit = 3;

  constructor() {
    super();
    this.metrics = this.initializeMetrics();
    this.setupPerformanceMonitoring();
    this.startMetricsCollection();
    this.startDeltaFlushing();
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      latency: {
        average: 0,
        min: Infinity,
        max: 0,
        p95: 0,
        p99: 0,
        samples: []
      },
      throughput: {
        eventsPerSecond: 0,
        bytesPerSecond: 0,
        peakEvents: 0,
        totalEvents: 0
      },
      memory: {
        cacheSize: 0,
        bufferSize: 0,
        totalAllocated: 0,
        gcCollections: 0
      },
      network: {
        reconnections: 0,
        dropRate: 0,
        bandwidth: 0,
        quality: 'excellent'
      },
      optimization: {
        debouncedEvents: 0,
        throttledEvents: 0,
        cachedHits: 0,
        deltasApplied: 0,
        conflictsResolved: 0
      }
    };
  }

  private setupPerformanceMonitoring(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.name.startsWith('realtime-')) {
            this.recordLatency(entry.duration);
          }
        }
      });

      this.performanceObserver.observe({ entryTypes: ['measure'] });
      this.isMonitoring = true;
    }
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      this.updateThroughputMetrics();
      this.updateMemoryMetrics();
      this.updateNetworkQuality();
      this.emit('metrics-updated', this.metrics);
    }, this.metricsUpdateInterval);
  }

  private startDeltaFlushing(): void {
    setInterval(() => {
      this.flushDeltas();
    }, this.deltaFlushInterval);
  }

  // Debouncing implementation
  public debounce<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    config: DebounceConfig
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const existing = this.debouncers.get(key);
      if (existing) {
        clearTimeout(existing);
        this.metrics.optimization.debouncedEvents++;
      }

      const timeout = setTimeout(() => {
        func(...args);
        this.debouncers.delete(key);
      }, config.delay);

      this.debouncers.set(key, timeout);
    };
  }

  // Throttling implementation
  public throttle<T extends (...args: any[]) => any>(
    key: string,
    func: T,
    config: ThrottleConfig
  ): (...args: Parameters<T>) => boolean {
    return (...args: Parameters<T>) => {
      const now = Date.now();
      const throttler = this.throttlers.get(key) || {
        count: 0,
        window: now,
        lastReset: now
      };

      // Reset window if expired
      if (now - throttler.lastReset >= config.window) {
        throttler.count = 0;
        throttler.lastReset = now;
      }

      // Check if under limit
      if (throttler.count < config.limit) {
        throttler.count++;
        this.throttlers.set(key, throttler);
        func(...args);
        return true;
      }

      this.metrics.optimization.throttledEvents++;
      return false;
    };
  }

  // Caching layer implementation
  public setCache<T>(key: string, data: T, ttl?: number, priority = 1): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl,
      hits: 0,
      version: 1,
      priority
    };

    // Evict if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictCache();
    }

    this.cache.set(key, entry);
    this.updateMemoryMetrics();
  }

  public getCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T>;
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    this.metrics.optimization.cachedHits++;
    return entry.data;
  }

  public invalidateCache(key: string): void {
    this.cache.delete(key);
  }

  public clearCache(): void {
    this.cache.clear();
    this.updateMemoryMetrics();
  }

  private evictCache(): void {
    // LRU eviction with priority consideration
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => {
      const [, entryA] = a;
      const [, entryB] = b;
      
      // Lower priority gets evicted first
      if (entryA.priority !== entryB.priority) {
        return entryA.priority - entryB.priority;
      }
      
      // Then by least recently used (by hits and timestamp)
      const scoreA = entryA.hits / (Date.now() - entryA.timestamp);
      const scoreB = entryB.hits / (Date.now() - entryB.timestamp);
      return scoreA - scoreB;
    });

    // Remove lowest priority/least used entries
    const toRemove = Math.floor(this.maxCacheSize * 0.2);
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  // Delta synchronization implementation
  public createDelta(
    entityId: string,
    type: DeltaData['type'],
    entity: string,
    changes: Record<string, any>,
    previous?: Record<string, any>
  ): DeltaData {
    const delta: DeltaData = {
      id: `${entityId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      entity,
      changes,
      previous,
      version: 1,
      checksum: this.generateChecksum(changes)
    };

    // Buffer delta for batch processing
    const bufferKey = `${entity}_${entityId}`;
    const buffer = this.deltaBuffer.get(bufferKey) || [];
    buffer.push(delta);
    
    if (buffer.length > this.maxBufferSize) {
      buffer.shift(); // Remove oldest
    }
    
    this.deltaBuffer.set(bufferKey, buffer);
    
    return delta;
  }

  public applyDelta(delta: DeltaData, currentState: any): any {
    try {
      let newState = { ...currentState };

      switch (delta.type) {
        case 'create':
          newState = { ...delta.changes };
          break;
        case 'update':
          newState = { ...currentState, ...delta.changes };
          break;
        case 'delete':
          return null;
      }

      this.metrics.optimization.deltasApplied++;
      return newState;
    } catch (error) {
      console.error('Failed to apply delta:', error);
      return currentState;
    }
  }

  public optimizeDeltas(deltas: DeltaData[]): DeltaData[] {
    // Group by entity and sort by timestamp
    const grouped = new Map<string, DeltaData[]>();
    
    deltas.forEach(delta => {
      const key = `${delta.entity}_${delta.id.split('_')[0]}`;
      const group = grouped.get(key) || [];
      group.push(delta);
      grouped.set(key, group);
    });

    const optimized: DeltaData[] = [];

    // Optimize each group
    grouped.forEach(group => {
      group.sort((a, b) => a.timestamp - b.timestamp);
      
      // Merge consecutive updates
      let merged = group[0];
      for (let i = 1; i < group.length; i++) {
        const current = group[i];
        if (merged.type === 'update' && current.type === 'update') {
          merged = {
            ...merged,
            changes: { ...merged.changes, ...current.changes },
            timestamp: current.timestamp,
            checksum: this.generateChecksum({ ...merged.changes, ...current.changes })
          };
        } else {
          optimized.push(merged);
          merged = current;
        }
      }
      optimized.push(merged);
    });

    return optimized;
  }

  private flushDeltas(): void {
    for (const [key, deltas] of this.deltaBuffer.entries()) {
      if (deltas.length > 0) {
        const optimized = this.optimizeDeltas(deltas);
        this.emit('deltas-ready', { key, deltas: optimized });
        this.deltaBuffer.set(key, []);
      }
    }
  }

  // Conflict resolution
  public setConflictResolver(
    entity: string,
    strategy: ConflictResolutionStrategy
  ): void {
    this.conflictResolvers.set(entity, strategy);
  }

  public resolveConflict(
    entity: string,
    localData: any,
    remoteData: any,
    baseData?: any
  ): any {
    const resolver = this.conflictResolvers.get(entity) || {
      strategy: 'last_write_wins'
    };

    try {
      let resolved: any;

      switch (resolver.strategy) {
        case 'last_write_wins':
          resolved = remoteData.timestamp > localData.timestamp ? remoteData : localData;
          break;
        
        case 'merge':
          resolved = this.mergeData(localData, remoteData, baseData);
          break;
        
        case 'user_choice':
          this.emit('conflict-detected', { entity, localData, remoteData, baseData });
          return null; // Will be resolved by user input
        
        case 'custom':
          if (resolver.customResolver) {
            resolved = resolver.customResolver(localData, remoteData, baseData);
          } else {
            resolved = remoteData; // Fallback
          }
          break;
        
        default:
          resolved = remoteData;
      }

      this.metrics.optimization.conflictsResolved++;
      return resolved;
    } catch (error) {
      console.error('Conflict resolution failed:', error);
      return remoteData; // Safe fallback
    }
  }

  private mergeData(local: any, remote: any, base?: any): any {
    // Three-way merge implementation
    const merged = { ...local };

    for (const key in remote) {
      if (remote.hasOwnProperty(key)) {
        const localValue = local[key];
        const remoteValue = remote[key];
        const baseValue = base?.[key];

        if (localValue === remoteValue) {
          // No conflict
          merged[key] = localValue;
        } else if (localValue === baseValue) {
          // Remote changed, local didn't
          merged[key] = remoteValue;
        } else if (remoteValue === baseValue) {
          // Local changed, remote didn't
          merged[key] = localValue;
        } else {
          // Both changed - need resolution strategy
          if (typeof localValue === 'object' && typeof remoteValue === 'object') {
            merged[key] = this.mergeData(localValue, remoteValue, baseValue);
          } else {
            // Use timestamp or priority to resolve
            merged[key] = remote.timestamp > local.timestamp ? remoteValue : localValue;
          }
        }
      }
    }

    return merged;
  }

  // Performance monitoring
  public recordLatency(duration: number): void {
    this.metrics.latency.samples.push(duration);
    
    // Keep only last 1000 samples
    if (this.metrics.latency.samples.length > 1000) {
      this.metrics.latency.samples.shift();
    }

    this.updateLatencyStats();
  }

  public recordEvent(bytes?: number): void {
    this.metrics.throughput.totalEvents++;
    if (bytes) {
      this.metrics.throughput.bytesPerSecond += bytes;
    }
  }

  public recordReconnection(): void {
    this.metrics.network.reconnections++;
  }

  public recordPacketDrop(): void {
    this.metrics.network.dropRate++;
  }

  private updateLatencyStats(): void {
    const samples = this.metrics.latency.samples;
    if (samples.length === 0) return;

    const sorted = [...samples].sort((a, b) => a - b);
    
    this.metrics.latency.average = samples.reduce((a, b) => a + b) / samples.length;
    this.metrics.latency.min = Math.min(...samples);
    this.metrics.latency.max = Math.max(...samples);
    this.metrics.latency.p95 = sorted[Math.floor(sorted.length * 0.95)];
    this.metrics.latency.p99 = sorted[Math.floor(sorted.length * 0.99)];
  }

  private updateThroughputMetrics(): void {
    const now = Date.now();
    const windowSize = this.metricsUpdateInterval / 1000; // Convert to seconds
    
    this.metrics.throughput.eventsPerSecond = this.metrics.throughput.totalEvents / windowSize;
    this.metrics.throughput.bytesPerSecond = this.metrics.throughput.bytesPerSecond / windowSize;
    
    if (this.metrics.throughput.eventsPerSecond > this.metrics.throughput.peakEvents) {
      this.metrics.throughput.peakEvents = this.metrics.throughput.eventsPerSecond;
    }

    // Reset counters for next window
    this.metrics.throughput.totalEvents = 0;
    this.metrics.throughput.bytesPerSecond = 0;
  }

  private updateMemoryMetrics(): void {
    this.metrics.memory.cacheSize = this.cache.size;
    this.metrics.memory.bufferSize = Array.from(this.deltaBuffer.values())
      .reduce((total, buffer) => total + buffer.length, 0);
    
    if (typeof performance !== 'undefined' && performance.memory) {
      this.metrics.memory.totalAllocated = performance.memory.usedJSHeapSize;
    }
  }

  private updateNetworkQuality(): void {
    const avgLatency = this.metrics.latency.average;
    const dropRate = this.metrics.network.dropRate;

    if (avgLatency < 50 && dropRate < 0.01) {
      this.metrics.network.quality = 'excellent';
    } else if (avgLatency < 100 && dropRate < 0.05) {
      this.metrics.network.quality = 'good';
    } else if (avgLatency < 200 && dropRate < 0.1) {
      this.metrics.network.quality = 'poor';
    } else {
      this.metrics.network.quality = 'critical';
    }
  }

  private generateChecksum(data: any): string {
    // Simple checksum implementation
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  // Public API methods
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getCacheStats(): { size: number; hitRate: number; entries: number } {
    const totalHits = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hits, 0);
    return {
      size: this.cache.size,
      hitRate: totalHits / Math.max(this.metrics.optimization.cachedHits, 1),
      entries: this.cache.size
    };
  }

  public getHealthScore(): number {
    const latencyScore = Math.max(0, 100 - (this.metrics.latency.average / 2));
    const throughputScore = Math.min(100, this.metrics.throughput.eventsPerSecond * 10);
    const qualityScore = {
      excellent: 100,
      good: 80,
      poor: 50,
      critical: 20
    }[this.metrics.network.quality];

    return (latencyScore + throughputScore + qualityScore) / 3;
  }

  public dispose(): void {
    this.debouncers.forEach(timeout => clearTimeout(timeout));
    this.debouncers.clear();
    this.throttlers.clear();
    this.cache.clear();
    this.deltaBuffer.clear();
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    this.removeAllListeners();
  }
}

// Export singleton instance
export const realtimeOptimizer = new RealtimePerformanceOptimizer();

// Export utility functions
export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now();
  performance.mark(`${name}-start`);
  
  const result = fn();
  
  if (result instanceof Promise) {
    return result.finally(() => {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    });
  } else {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    return result;
  }
}

export function createOptimizedHandler<T extends (...args: any[]) => any>(
  key: string,
  handler: T,
  options: {
    debounce?: DebounceConfig;
    throttle?: ThrottleConfig;
    cache?: { ttl?: number; priority?: number };
  }
): T {
  let optimizedHandler = handler;

  if (options.debounce) {
    optimizedHandler = realtimeOptimizer.debounce(key, optimizedHandler, options.debounce) as T;
  }

  if (options.throttle) {
    const throttled = realtimeOptimizer.throttle(key, optimizedHandler, options.throttle);
    optimizedHandler = ((...args: any[]) => {
      if (!throttled(...args)) {
        console.warn(`Handler ${key} throttled`);
      }
    }) as T;
  }

  return optimizedHandler;
}

// Export types
export type {
  PerformanceMetrics,
  DeltaData,
  ConflictResolutionStrategy,
  CacheEntry,
  DebounceConfig,
  ThrottleConfig
}; 
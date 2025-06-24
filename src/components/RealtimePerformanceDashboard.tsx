import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Zap,
  Database,
  Wifi,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Gauge,
  Users,
  Timer,
  HardDrive,
  Signal,
} from 'lucide-react';
import { usePerformanceOptimization } from '../hooks/usePerformanceOptimization';
import type { PerformanceMetrics } from '../services/realtimePerformanceOptimizer';

interface RealtimePerformanceDashboardProps {
  isVisible?: boolean;
  position?:
    | 'bottom-right'
    | 'bottom-left'
    | 'top-right'
    | 'top-left'
    | 'center';
  compact?: boolean;
  autoHide?: boolean;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'critical';
  icon: React.ComponentType<any>;
  description?: string;
  onClick?: () => void;
}

export function RealtimePerformanceDashboard({
  isVisible = true,
  position = 'bottom-right',
  compact = false,
  autoHide = true,
  className = '',
}: RealtimePerformanceDashboardProps) {
  const {
    metrics,
    healthScore,
    cacheStats,
    isOptimizationEnabled,
    optimizationLevel,
    enableOptimization,
    disableOptimization,
    setOptimizationLevel,
    resetMetrics,
  } = usePerformanceOptimization({
    enableMetrics: true,
    autoOptimize: true,
  });

  const [isExpanded, setIsExpanded] = useState(!compact);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-hide when performance is good
  useEffect(() => {
    if (autoHide && healthScore > 90 && isExpanded) {
      const timer = setTimeout(() => setIsExpanded(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [autoHide, healthScore, isExpanded]);

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    center: 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusIcon = (score: number) => {
    if (score >= 80) return CheckCircle;
    if (score >= 40) return AlertTriangle;
    return XCircle;
  };

  const formatLatency = (latency: number): string => {
    if (latency < 1) return '<1ms';
    if (latency < 1000) return `${Math.round(latency)}ms`;
    return `${(latency / 1000).toFixed(1)}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  if (!isVisible || !metrics) return null;

  const StatusIcon = getStatusIcon(healthScore);

  return (
    <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden min-w-96"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Activity className="w-5 h-5" />
                  <span className="font-semibold">Real-time Performance</span>
                </div>

                <div className="flex items-center space-x-2">
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(healthScore)}`}
                  >
                    {healthScore}% Health
                  </div>

                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-1 hover:bg-white/20 rounded"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1 hover:bg-white/20 rounded"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Settings Panel */}
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-white/20"
                  >
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="block mb-2">Optimization</label>
                        <button
                          onClick={
                            isOptimizationEnabled
                              ? disableOptimization
                              : enableOptimization
                          }
                          className={`w-full px-3 py-1 rounded text-xs font-medium ${
                            isOptimizationEnabled
                              ? 'bg-green-500 text-white'
                              : 'bg-white/20 text-white'
                          }`}
                        >
                          {isOptimizationEnabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>

                      <div>
                        <label className="block mb-2">Level</label>
                        <select
                          value={optimizationLevel}
                          onChange={e =>
                            setOptimizationLevel(e.target.value as any)
                          }
                          className="w-full px-2 py-1 bg-white/20 border border-white/30 rounded text-xs text-white"
                        >
                          <option value="low" style={{ color: 'black' }}>
                            Low
                          </option>
                          <option value="medium" style={{ color: 'black' }}>
                            Medium
                          </option>
                          <option value="high" style={{ color: 'black' }}>
                            High
                          </option>
                          <option value="aggressive" style={{ color: 'black' }}>
                            Aggressive
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <label className="flex items-center space-x-2 text-xs">
                        <input
                          type="checkbox"
                          checked={autoRefresh}
                          onChange={e => setAutoRefresh(e.target.checked)}
                          className="rounded"
                        />
                        <span>Auto Refresh</span>
                      </label>

                      <button
                        onClick={resetMetrics}
                        className="flex items-center space-x-1 px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-xs"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Metrics Grid */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <MetricCard
                  title="Avg Latency"
                  value={formatLatency(metrics.latency.average)}
                  trend={metrics.latency.average < 100 ? 'stable' : 'up'}
                  status={
                    metrics.latency.average < 100
                      ? 'good'
                      : metrics.latency.average < 200
                        ? 'warning'
                        : 'critical'
                  }
                  icon={Clock}
                  description="Average response time"
                  onClick={() => setSelectedMetric('latency')}
                />

                <MetricCard
                  title="Throughput"
                  value={metrics.throughput.eventsPerSecond.toFixed(1)}
                  unit="eps"
                  trend="stable"
                  status="good"
                  icon={TrendingUp}
                  description="Events per second"
                  onClick={() => setSelectedMetric('throughput')}
                />

                <MetricCard
                  title="Cache Hits"
                  value={cacheStats.hitRate.toFixed(1)}
                  unit="%"
                  trend={cacheStats.hitRate > 80 ? 'up' : 'down'}
                  status={
                    cacheStats.hitRate > 80
                      ? 'good'
                      : cacheStats.hitRate > 60
                        ? 'warning'
                        : 'critical'
                  }
                  icon={Database}
                  description="Cache hit ratio"
                  onClick={() => setSelectedMetric('cache')}
                />

                <MetricCard
                  title="Quality"
                  value={metrics.network.quality}
                  trend="stable"
                  status={
                    metrics.network.quality === 'excellent'
                      ? 'good'
                      : metrics.network.quality === 'good'
                        ? 'warning'
                        : 'critical'
                  }
                  icon={Signal}
                  description="Network quality"
                  onClick={() => setSelectedMetric('network')}
                />
              </div>

              {/* Detailed Metrics */}
              <AnimatePresence>
                {selectedMetric && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-50 rounded-lg p-3 mb-4"
                  >
                    {selectedMetric === 'latency' && (
                      <LatencyDetails metrics={metrics} />
                    )}
                    {selectedMetric === 'throughput' && (
                      <ThroughputDetails metrics={metrics} />
                    )}
                    {selectedMetric === 'cache' && (
                      <CacheDetails cacheStats={cacheStats} metrics={metrics} />
                    )}
                    {selectedMetric === 'network' && (
                      <NetworkDetails metrics={metrics} />
                    )}

                    <button
                      onClick={() => setSelectedMetric(null)}
                      className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                    >
                      Close Details
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                <div className="text-center">
                  <div className="font-medium">
                    {metrics.optimization.debouncedEvents}
                  </div>
                  <div>Debounced</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">
                    {metrics.optimization.throttledEvents}
                  </div>
                  <div>Throttled</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">
                    {metrics.optimization.deltasApplied}
                  </div>
                  <div>Deltas</div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsExpanded(true)}
            className={`
              ${getHealthColor(healthScore)} 
              p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200
              flex items-center space-x-2
            `}
          >
            <StatusIcon className="w-5 h-5" />
            {!compact && (
              <span className="text-sm font-medium">{healthScore}%</span>
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetricCard({
  title,
  value,
  unit,
  trend,
  status,
  icon: Icon,
  description,
  onClick,
}: MetricCardProps) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    stable: 'text-gray-400',
  };

  const statusColors = {
    good: 'border-green-200 bg-green-50',
    warning: 'border-yellow-200 bg-yellow-50',
    critical: 'border-red-200 bg-red-50',
  };

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Gauge;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        ${statusColors[status || 'good']}
        border rounded-lg p-3 cursor-pointer transition-all duration-200
        hover:shadow-md
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-4 h-4 text-gray-600" />
        <TrendIcon className={`w-3 h-3 ${trendColors[trend || 'stable']}`} />
      </div>

      <div className="space-y-1">
        <div className="text-lg font-bold text-gray-900">
          {value}
          {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
        </div>
        <div className="text-xs text-gray-600">{title}</div>
        {description && (
          <div className="text-xs text-gray-500">{description}</div>
        )}
      </div>
    </motion.div>
  );
}

function LatencyDetails({ metrics }: { metrics: PerformanceMetrics }) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-gray-900">Latency Breakdown</h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-600">Min:</span>
          <span className="ml-2 font-medium">
            {metrics.latency.min.toFixed(1)}ms
          </span>
        </div>
        <div>
          <span className="text-gray-600">Max:</span>
          <span className="ml-2 font-medium">
            {metrics.latency.max.toFixed(1)}ms
          </span>
        </div>
        <div>
          <span className="text-gray-600">P95:</span>
          <span className="ml-2 font-medium">
            {metrics.latency.p95.toFixed(1)}ms
          </span>
        </div>
        <div>
          <span className="text-gray-600">P99:</span>
          <span className="ml-2 font-medium">
            {metrics.latency.p99.toFixed(1)}ms
          </span>
        </div>
      </div>
      <div className="text-xs text-gray-500">
        {metrics.latency.samples.length} samples collected
      </div>
    </div>
  );
}

function ThroughputDetails({ metrics }: { metrics: PerformanceMetrics }) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-gray-900">Throughput Metrics</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Events/sec:</span>
          <span className="font-medium">
            {metrics.throughput.eventsPerSecond.toFixed(1)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Peak Events:</span>
          <span className="font-medium">{metrics.throughput.peakEvents}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Events:</span>
          <span className="font-medium">{metrics.throughput.totalEvents}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Bytes/sec:</span>
          <span className="font-medium">
            {metrics.throughput.bytesPerSecond.toFixed(0)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CacheDetails({
  cacheStats,
  metrics,
}: {
  cacheStats: { size: number; hitRate: number; entries: number };
  metrics: PerformanceMetrics;
}) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-gray-900">Cache Performance</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Hit Rate:</span>
          <span className="font-medium">{cacheStats.hitRate.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Cache Size:</span>
          <span className="font-medium">{cacheStats.size} items</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Memory Size:</span>
          <span className="font-medium">{metrics.memory.cacheSize}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Hits:</span>
          <span className="font-medium">{metrics.optimization.cachedHits}</span>
        </div>
      </div>
    </div>
  );
}

function NetworkDetails({ metrics }: { metrics: PerformanceMetrics }) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium text-gray-900">Network Status</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Quality:</span>
          <span className="font-medium capitalize">
            {metrics.network.quality}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Reconnections:</span>
          <span className="font-medium">{metrics.network.reconnections}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Drop Rate:</span>
          <span className="font-medium">
            {(metrics.network.dropRate * 100).toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Bandwidth:</span>
          <span className="font-medium">
            {metrics.network.bandwidth.toFixed(1)} Mbps
          </span>
        </div>
      </div>
    </div>
  );
}

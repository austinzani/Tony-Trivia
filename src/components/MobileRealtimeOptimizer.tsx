import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Battery,
  Wifi,
  WifiOff,
  Signal,
  Volume2,
  VolumeX,
  Settings,
  Minimize2,
  Maximize2,
  RotateCcw,
  Pause,
  Play,
  AlertTriangle,
} from 'lucide-react';

// Types for mobile optimization
interface MobileOptimizationSettings {
  // Performance settings
  reducedAnimations: boolean;
  batteryOptimization: boolean;
  dataCompression: boolean;
  backgroundSync: boolean;

  // UI settings
  compactMode: boolean;
  hapticFeedback: boolean;
  soundEnabled: boolean;
  autoHideControls: boolean;

  // Connection settings
  adaptiveQuality: boolean;
  offlineMode: boolean;
  reconnectStrategy: 'aggressive' | 'conservative' | 'adaptive';

  // Touch settings
  touchSensitivity: 'low' | 'medium' | 'high';
  gestureEnabled: boolean;
  swipeActions: boolean;
}

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isLowEnd: boolean;
  batteryLevel: number | null;
  isCharging: boolean | null;
  connectionType: string;
  isOnline: boolean;
  orientation: 'portrait' | 'landscape';
  screenSize: { width: number; height: number };
  pixelRatio: number;
}

interface NetworkQuality {
  level: 'excellent' | 'good' | 'fair' | 'poor';
  latency: number;
  bandwidth: number;
  stability: number;
  score: number;
}

interface TouchGesture {
  type: 'tap' | 'swipe' | 'pinch' | 'long-press';
  direction?: 'up' | 'down' | 'left' | 'right';
  startPoint: { x: number; y: number };
  endPoint?: { x: number; y: number };
  duration: number;
  force?: number;
}

// Default mobile settings
const DEFAULT_MOBILE_SETTINGS: MobileOptimizationSettings = {
  reducedAnimations: false,
  batteryOptimization: true,
  dataCompression: true,
  backgroundSync: true,
  compactMode: false,
  hapticFeedback: true,
  soundEnabled: true,
  autoHideControls: true,
  adaptiveQuality: true,
  offlineMode: false,
  reconnectStrategy: 'adaptive',
  touchSensitivity: 'medium',
  gestureEnabled: true,
  swipeActions: true,
};

// Device detection utilities
const detectDevice = (): DeviceInfo => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      userAgent
    );
  const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);

  // Low-end device detection (simplified)
  const isLowEnd =
    navigator.hardwareConcurrency <= 2 ||
    (navigator as any).deviceMemory <= 2 ||
    window.screen.width <= 480;

  return {
    isMobile,
    isTablet,
    isLowEnd,
    batteryLevel: null,
    isCharging: null,
    connectionType: (navigator as any).connection?.effectiveType || 'unknown',
    isOnline: navigator.onLine,
    orientation:
      window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
    screenSize: { width: window.innerWidth, height: window.innerHeight },
    pixelRatio: window.devicePixelRatio || 1,
  };
};

// Network quality assessment
const assessNetworkQuality = (
  latency: number,
  bandwidth: number,
  stability: number
): NetworkQuality => {
  let level: NetworkQuality['level'];
  let score = 0;

  // Latency scoring (0-40 points)
  if (latency < 50) score += 40;
  else if (latency < 100) score += 30;
  else if (latency < 200) score += 20;
  else if (latency < 500) score += 10;

  // Bandwidth scoring (0-40 points)
  if (bandwidth > 10) score += 40;
  else if (bandwidth > 5) score += 30;
  else if (bandwidth > 2) score += 20;
  else if (bandwidth > 1) score += 10;

  // Stability scoring (0-20 points)
  score += Math.round(stability * 20);

  // Determine level
  if (score >= 80) level = 'excellent';
  else if (score >= 60) level = 'good';
  else if (score >= 40) level = 'fair';
  else level = 'poor';

  return { level, latency, bandwidth, stability, score };
};

// Touch gesture detection
const useTouchGestures = (
  onGesture: (gesture: TouchGesture) => void,
  sensitivity: 'low' | 'medium' | 'high' = 'medium'
) => {
  const [touchStart, setTouchStart] = useState<{
    x: number;
    y: number;
    time: number;
  } | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);

  const sensitivityThresholds = {
    low: { swipe: 100, longPress: 800 },
    medium: { swipe: 50, longPress: 500 },
    high: { swipe: 30, longPress: 300 },
  };

  const thresholds = sensitivityThresholds[sensitivity];

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const startPoint = { x: touch.clientX, y: touch.clientY };
      const startTime = Date.now();

      setTouchStart({ ...startPoint, time: startTime });
      setIsLongPress(false);

      // Long press detection
      const longPressTimer = setTimeout(() => {
        setIsLongPress(true);
        onGesture({
          type: 'long-press',
          startPoint,
          duration: Date.now() - startTime,
          force: (touch as any).force || 1,
        });
      }, thresholds.longPress);

      return () => clearTimeout(longPressTimer);
    },
    [onGesture, thresholds.longPress]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart || isLongPress) return;

      const touch = e.changedTouches[0];
      const endPoint = { x: touch.clientX, y: touch.clientY };
      const duration = Date.now() - touchStart.time;

      const deltaX = endPoint.x - touchStart.x;
      const deltaY = endPoint.y - touchStart.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance < 10 && duration < 300) {
        // Tap gesture
        onGesture({
          type: 'tap',
          startPoint: touchStart,
          endPoint,
          duration,
          force: (touch as any).force || 1,
        });
      } else if (distance > thresholds.swipe) {
        // Swipe gesture
        let direction: 'up' | 'down' | 'left' | 'right';

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        onGesture({
          type: 'swipe',
          direction,
          startPoint: touchStart,
          endPoint,
          duration,
          force: (touch as any).force || 1,
        });
      }

      setTouchStart(null);
    },
    [touchStart, isLongPress, onGesture, thresholds.swipe]
  );

  return { handleTouchStart, handleTouchEnd };
};

// Battery optimization hook
const useBatteryOptimization = () => {
  const [batteryInfo, setBatteryInfo] = useState<{
    level: number | null;
    charging: boolean | null;
    chargingTime: number | null;
    dischargingTime: number | null;
  }>({
    level: null,
    charging: null,
    chargingTime: null,
    dischargingTime: null,
  });

  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBatteryInfo = () => {
          setBatteryInfo({
            level: battery.level,
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime,
          });
        };

        updateBatteryInfo();

        battery.addEventListener('chargingchange', updateBatteryInfo);
        battery.addEventListener('levelchange', updateBatteryInfo);

        return () => {
          battery.removeEventListener('chargingchange', updateBatteryInfo);
          battery.removeEventListener('levelchange', updateBatteryInfo);
        };
      });
    }
  }, []);

  const shouldOptimizeForBattery = useMemo(() => {
    if (batteryInfo.level === null) return false;
    return batteryInfo.level < 0.2 && !batteryInfo.charging;
  }, [batteryInfo]);

  return { batteryInfo, shouldOptimizeForBattery };
};

// Main mobile optimizer component
export const MobileRealtimeOptimizer: React.FC<{
  roomId?: string;
  onSettingsChange?: (settings: MobileOptimizationSettings) => void;
  className?: string;
}> = ({ roomId, onSettingsChange, className = '' }) => {
  const [settings, setSettings] = useState<MobileOptimizationSettings>(
    DEFAULT_MOBILE_SETTINGS
  );
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(detectDevice());
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>({
    level: 'good',
    latency: 100,
    bandwidth: 5,
    stability: 0.8,
    score: 70,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lastGesture, setLastGesture] = useState<TouchGesture | null>(null);
  const [optimizationLevel, setOptimizationLevel] = useState<
    'none' | 'light' | 'aggressive'
  >('light');

  const { batteryInfo, shouldOptimizeForBattery } = useBatteryOptimization();

  // Touch gesture handling
  const handleGesture = useCallback(
    (gesture: TouchGesture) => {
      setLastGesture(gesture);

      // Handle swipe actions
      if (settings.swipeActions && gesture.type === 'swipe') {
        switch (gesture.direction) {
          case 'up':
            setIsExpanded(true);
            break;
          case 'down':
            setIsExpanded(false);
            break;
          case 'left':
            // Previous action
            break;
          case 'right':
            // Next action
            break;
        }
      }

      // Haptic feedback
      if (settings.hapticFeedback && 'vibrate' in navigator) {
        const patterns = {
          tap: [10],
          swipe: [20, 10, 20],
          'long-press': [50],
          pinch: [15, 5, 15],
        };

        navigator.vibrate(patterns[gesture.type] || [10]);
      }
    },
    [settings.swipeActions, settings.hapticFeedback]
  );

  const { handleTouchStart, handleTouchEnd } = useTouchGestures(
    handleGesture,
    settings.touchSensitivity
  );

  // Update device info on resize/orientation change
  useEffect(() => {
    const updateDeviceInfo = () => {
      setDeviceInfo(detectDevice());
    };

    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  // Network quality monitoring
  useEffect(() => {
    const measureNetworkQuality = async () => {
      const startTime = performance.now();

      try {
        // Simple latency test using a small image
        const img = new Image();
        img.src = '/favicon.ico?' + Math.random();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          setTimeout(reject, 5000); // 5 second timeout
        });

        const latency = performance.now() - startTime;

        // Estimate bandwidth (simplified)
        const connection = (navigator as any).connection;
        const bandwidth = connection?.downlink || 5;

        // Stability based on recent measurements (simplified)
        const stability = Math.random() * 0.3 + 0.7; // Placeholder

        const quality = assessNetworkQuality(latency, bandwidth, stability);
        setNetworkQuality(quality);
      } catch (error) {
        // Fallback for poor connection
        setNetworkQuality({
          level: 'poor',
          latency: 1000,
          bandwidth: 0.5,
          stability: 0.3,
          score: 20,
        });
      }
    };

    // Initial measurement
    measureNetworkQuality();

    // Periodic measurements
    const interval = setInterval(measureNetworkQuality, 10000);

    return () => clearInterval(interval);
  }, []);

  // Auto-adjust settings based on conditions
  useEffect(() => {
    let newLevel: typeof optimizationLevel = 'none';
    const updates: Partial<MobileOptimizationSettings> = {};

    // Battery optimization
    if (shouldOptimizeForBattery) {
      newLevel = 'aggressive';
      updates.reducedAnimations = true;
      updates.backgroundSync = false;
      updates.dataCompression = true;
    }

    // Low-end device optimization
    if (deviceInfo.isLowEnd) {
      newLevel = newLevel === 'none' ? 'light' : 'aggressive';
      updates.reducedAnimations = true;
      updates.compactMode = true;
    }

    // Poor network optimization
    if (networkQuality.level === 'poor') {
      newLevel = newLevel === 'none' ? 'light' : 'aggressive';
      updates.dataCompression = true;
      updates.adaptiveQuality = true;
      updates.reconnectStrategy = 'conservative';
    }

    if (Object.keys(updates).length > 0) {
      setSettings(prev => ({ ...prev, ...updates }));
      onSettingsChange?.({ ...settings, ...updates });
    }

    setOptimizationLevel(newLevel);
  }, [
    shouldOptimizeForBattery,
    deviceInfo.isLowEnd,
    networkQuality.level,
    settings,
    onSettingsChange,
  ]);

  // Settings update handler
  const updateSetting = useCallback(
    <K extends keyof MobileOptimizationSettings>(
      key: K,
      value: MobileOptimizationSettings[K]
    ) => {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      onSettingsChange?.(newSettings);
    },
    [settings, onSettingsChange]
  );

  // Get optimization status color
  const getOptimizationColor = () => {
    switch (optimizationLevel) {
      case 'none':
        return 'text-green-600';
      case 'light':
        return 'text-yellow-600';
      case 'aggressive':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Get network quality color
  const getNetworkQualityColor = () => {
    switch (networkQuality.level) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'fair':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div
      className={`mobile-realtime-optimizer ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Compact Status Bar */}
      <motion.div
        className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-50 to-purple-50 
                   border border-blue-200 rounded-lg shadow-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Device Status */}
        <div className="flex items-center space-x-2">
          <Smartphone className="h-4 w-4 text-blue-600" />

          {/* Battery */}
          {batteryInfo.level !== null && (
            <div className="flex items-center space-x-1">
              <Battery
                className={`h-3 w-3 ${
                  batteryInfo.charging
                    ? 'text-green-600'
                    : batteryInfo.level < 0.2
                      ? 'text-red-600'
                      : 'text-gray-600'
                }`}
              />
              <span className="text-xs text-gray-600">
                {Math.round(batteryInfo.level * 100)}%
              </span>
            </div>
          )}

          {/* Network */}
          <div className="flex items-center space-x-1">
            {deviceInfo.isOnline ? (
              <Wifi className={`h-3 w-3 ${getNetworkQualityColor()}`} />
            ) : (
              <WifiOff className="h-3 w-3 text-red-600" />
            )}
            <Signal className={`h-3 w-3 ${getNetworkQualityColor()}`} />
          </div>

          {/* Sound */}
          {settings.soundEnabled ? (
            <Volume2 className="h-3 w-3 text-blue-600" />
          ) : (
            <VolumeX className="h-3 w-3 text-gray-400" />
          )}
        </div>

        {/* Optimization Level */}
        <div className="flex items-center space-x-2">
          <div
            className={`flex items-center space-x-1 ${getOptimizationColor()}`}
          >
            <AlertTriangle className="h-3 w-3" />
            <span className="text-xs font-medium capitalize">
              {optimizationLevel}
            </span>
          </div>

          {/* Controls */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1 rounded-full hover:bg-blue-100 transition-colors"
          >
            {isPaused ? (
              <Play className="h-3 w-3 text-blue-600" />
            ) : (
              <Pause className="h-3 w-3 text-blue-600" />
            )}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-full hover:bg-blue-100 transition-colors"
          >
            {isExpanded ? (
              <Minimize2 className="h-3 w-3 text-blue-600" />
            ) : (
              <Maximize2 className="h-3 w-3 text-blue-600" />
            )}
          </button>
        </div>
      </motion.div>

      {/* Expanded Settings Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="mt-3 p-4 bg-white border border-blue-200 rounded-lg shadow-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-4">
              {/* Performance Settings */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                  <Settings className="h-4 w-4 mr-2 text-blue-600" />
                  Performance
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Reduced Animations
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.reducedAnimations}
                      onChange={e =>
                        updateSetting('reducedAnimations', e.target.checked)
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Battery Optimization
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.batteryOptimization}
                      onChange={e =>
                        updateSetting('batteryOptimization', e.target.checked)
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Data Compression
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.dataCompression}
                      onChange={e =>
                        updateSetting('dataCompression', e.target.checked)
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              {/* UI Settings */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  Interface
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Compact Mode</span>
                    <input
                      type="checkbox"
                      checked={settings.compactMode}
                      onChange={e =>
                        updateSetting('compactMode', e.target.checked)
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Haptic Feedback
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.hapticFeedback}
                      onChange={e =>
                        updateSetting('hapticFeedback', e.target.checked)
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sound Enabled</span>
                    <input
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={e =>
                        updateSetting('soundEnabled', e.target.checked)
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              {/* Touch Settings */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">
                  Touch & Gestures
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Touch Sensitivity
                    </span>
                    <select
                      value={settings.touchSensitivity}
                      onChange={e =>
                        updateSetting('touchSensitivity', e.target.value as any)
                      }
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>

                  <label className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Swipe Actions</span>
                    <input
                      type="checkbox"
                      checked={settings.swipeActions}
                      onChange={e =>
                        updateSetting('swipeActions', e.target.checked)
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              {/* Status Information */}
              <div className="pt-3 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-gray-500">Device</div>
                    <div className="font-medium">
                      {deviceInfo.isMobile
                        ? 'Mobile'
                        : deviceInfo.isTablet
                          ? 'Tablet'
                          : 'Desktop'}
                      {deviceInfo.isLowEnd && ' (Low-end)'}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500">Network</div>
                    <div
                      className={`font-medium capitalize ${getNetworkQualityColor()}`}
                    >
                      {networkQuality.level}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500">Orientation</div>
                    <div className="font-medium capitalize">
                      {deviceInfo.orientation}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500">Last Gesture</div>
                    <div className="font-medium">
                      {lastGesture
                        ? `${lastGesture.type}${lastGesture.direction ? ` ${lastGesture.direction}` : ''}`
                        : 'None'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gesture Hint (for first-time users) */}
      {settings.gestureEnabled && (
        <motion.div
          className="mt-2 text-xs text-center text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          Swipe up/down to expand/collapse • Long press for options
        </motion.div>
      )}
    </div>
  );
};

// Mobile-optimized real-time event display
export const MobileRealtimeEventDisplay: React.FC<{
  events: any[];
  compact?: boolean;
  maxVisible?: number;
  className?: string;
}> = ({ events, compact = false, maxVisible = 3, className = '' }) => {
  const [visibleEvents, setVisibleEvents] = useState(
    events.slice(0, maxVisible)
  );

  useEffect(() => {
    setVisibleEvents(events.slice(0, maxVisible));
  }, [events, maxVisible]);

  if (compact) {
    return (
      <div className={`mobile-event-display-compact ${className}`}>
        <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
          <div className="flex-1 text-sm text-gray-700">
            {visibleEvents.length > 0 ? (
              <span>{visibleEvents[0].data?.message || 'Recent activity'}</span>
            ) : (
              <span>No recent activity</span>
            )}
          </div>
          {visibleEvents.length > 1 && (
            <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
              +{visibleEvents.length - 1}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`mobile-event-display ${className}`}>
      <AnimatePresence mode="popLayout">
        {visibleEvents.map((event, index) => (
          <motion.div
            key={event.id}
            className="p-3 mb-2 bg-white border border-blue-200 rounded-lg shadow-sm"
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.9 }}
            transition={{
              duration: 0.3,
              delay: index * 0.1,
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
            layout
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">
                  {event.data?.message || 'Event occurred'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
              </div>

              <div
                className={`w-2 h-2 rounded-full ${
                  event.priority === 'critical'
                    ? 'bg-red-500'
                    : event.priority === 'high'
                      ? 'bg-orange-500'
                      : event.priority === 'medium'
                        ? 'bg-blue-500'
                        : 'bg-gray-400'
                }`}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MobileRealtimeOptimizer;

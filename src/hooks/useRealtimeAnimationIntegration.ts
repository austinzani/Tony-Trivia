import { useEffect, useCallback, useState } from 'react';
import { useRealtimeAnimations, type RealtimeEvent } from '@/components/RealtimeAnimationSystem';
import { useRealtimeChannelManager } from './useRealtimeChannelManager';
import { useEnhancedPresence } from './useEnhancedPresence';
import { usePerformanceOptimization } from './usePerformanceOptimization';

// Types for real-time event mapping
interface GameEvent {
  type: string;
  payload: any;
  metadata?: {
    roomId?: string;
    teamId?: string;
    userId?: string;
    timestamp?: number;
  };
}

interface AnimationSettings {
  enabled: boolean;
  intensity: 'subtle' | 'normal' | 'dramatic';
  enableParticles: boolean;
  enablePulse: boolean;
  maxVisibleEvents: number;
  eventFilters: {
    [key: string]: boolean;
  };
}

// Default animation settings
const DEFAULT_ANIMATION_SETTINGS: AnimationSettings = {
  enabled: true,
  intensity: 'normal',
  enableParticles: true,
  enablePulse: true,
  maxVisibleEvents: 5,
  eventFilters: {
    answer_submitted: true,
    team_joined: true,
    game_started: true,
    score_updated: true,
    notification: true,
    presence_change: true
  }
};

// Event priority mapping
const getEventPriority = (eventType: string, payload: any): RealtimeEvent['priority'] => {
  switch (eventType) {
    case 'game_started':
    case 'game_ended':
    case 'round_started':
      return 'critical';
    
    case 'team_joined':
    case 'team_left':
    case 'answer_submitted':
    case 'score_updated':
      return 'high';
    
    case 'notification':
    case 'presence_change':
      return 'medium';
    
    case 'user_activity':
    case 'heartbeat':
      return 'low';
    
    default:
      // Check payload for priority hints
      if (payload?.priority) {
        return payload.priority;
      }
      return 'medium';
  }
};

// Event message generation
const generateEventMessage = (eventType: string, payload: any): string => {
  switch (eventType) {
    case 'answer_submitted':
      return `${payload.teamName || 'A team'} submitted an answer for ${payload.pointValue || 1} point${payload.pointValue !== 1 ? 's' : ''}!`;
    
    case 'team_joined':
      return `Team "${payload.teamName || 'New Team'}" joined the game!`;
    
    case 'team_left':
      return `Team "${payload.teamName || 'A team'}" left the game`;
    
    case 'game_started':
      return `🎮 Game "${payload.gameName || 'Trivia Night'}" has started!`;
    
    case 'game_ended':
      return `🏁 Game has ended! Check the final leaderboard.`;
    
    case 'round_started':
      return `🔥 Round ${payload.roundNumber || 'Next'} has begun!`;
    
    case 'score_updated':
      return `🏆 Leaderboard updated! ${payload.teamName || 'A team'} now has ${payload.newScore || 0} points.`;
    
    case 'notification':
      return payload.message || 'New notification received';
    
    case 'presence_change':
      const status = payload.status || 'unknown';
      const userName = payload.userName || 'Someone';
      if (status === 'online') {
        return `👋 ${userName} joined the room`;
      } else if (status === 'offline') {
        return `👋 ${userName} left the room`;
      } else {
        return `👤 ${userName} is now ${status}`;
      }
    
    case 'question_presented':
      return `❓ New question: "${payload.questionText?.substring(0, 50) || 'Question available'}${payload.questionText?.length > 50 ? '...' : ''}"`;
    
    case 'time_warning':
      return `⏰ ${payload.timeRemaining || 30} seconds remaining!`;
    
    case 'answers_locked':
      return `🔒 Answer submission time has ended`;
    
    case 'results_revealed':
      return `📊 Results revealed! Correct answer: ${payload.correctAnswer || 'See results'}`;
    
    default:
      return payload.message || `${eventType.replace('_', ' ')} event occurred`;
  }
};

// Map game events to animation events
const mapGameEventToAnimationEvent = (gameEvent: GameEvent): RealtimeEvent | null => {
  const { type, payload, metadata } = gameEvent;
  
  // Map event types
  let animationType: RealtimeEvent['type'];
  
  switch (type) {
    case 'postgres_changes':
      // Handle database changes
      if (payload.table === 'teams' && payload.eventType === 'INSERT') {
        animationType = 'team_joined';
      } else if (payload.table === 'team_answers' && payload.eventType === 'INSERT') {
        animationType = 'answer_submitted';
      } else if (payload.table === 'game_rooms' && payload.new?.status === 'active') {
        animationType = 'game_started';
      } else if (payload.table === 'leaderboard' || payload.eventType === 'UPDATE') {
        animationType = 'score_updated';
      } else {
        return null; // Skip unmapped database events
      }
      break;
    
    case 'broadcast':
      // Handle broadcast events
      const eventType = payload.event || payload.type;
      switch (eventType) {
        case 'game_started':
        case 'round_started':
          animationType = 'game_started';
          break;
        case 'answer_submitted':
          animationType = 'answer_submitted';
          break;
        case 'team_joined':
          animationType = 'team_joined';
          break;
        case 'score_updated':
        case 'leaderboard_updated':
          animationType = 'score_updated';
          break;
        case 'notification':
          animationType = 'notification';
          break;
        default:
          animationType = 'notification';
      }
      break;
    
    case 'presence':
      animationType = 'presence_change';
      break;
    
    default:
      // Direct mapping for known types
      if (['answer_submitted', 'team_joined', 'game_started', 'score_updated', 'notification'].includes(type)) {
        animationType = type as RealtimeEvent['type'];
      } else {
        animationType = 'notification';
      }
  }
  
  const priority = getEventPriority(type, payload);
  const message = generateEventMessage(type, payload);
  
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: animationType,
    data: {
      message,
      originalPayload: payload,
      metadata
    },
    timestamp: metadata?.timestamp || Date.now(),
    priority
  };
};

// Main integration hook
export const useRealtimeAnimationIntegration = (
  roomId?: string,
  initialSettings: Partial<AnimationSettings> = {}
) => {
  const [settings, setSettings] = useState<AnimationSettings>({
    ...DEFAULT_ANIMATION_SETTINGS,
    ...initialSettings
  });
  
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [eventStats, setEventStats] = useState({
    totalEvents: 0,
    eventsByType: {} as Record<string, number>,
    lastEventTime: null as number | null
  });

  // Use existing hooks
  const { events: animationEvents, addEvent, clearEvents } = useRealtimeAnimations();
  const { subscribe, unsubscribe, isConnected } = useRealtimeChannelManager();
  const { presenceData } = useEnhancedPresence(roomId || '');
  const { metrics: performanceMetrics } = usePerformanceOptimization();

  // Handle real-time events and convert to animations
  const handleRealtimeEvent = useCallback((event: GameEvent) => {
    if (!settings.enabled) return;

    // Store the game event
    setGameEvents(prev => [...prev.slice(-50), event]); // Keep last 50 events

    // Update stats
    setEventStats(prev => ({
      totalEvents: prev.totalEvents + 1,
      eventsByType: {
        ...prev.eventsByType,
        [event.type]: (prev.eventsByType[event.type] || 0) + 1
      },
      lastEventTime: Date.now()
    }));

    // Convert to animation event
    const animationEvent = mapGameEventToAnimationEvent(event);
    
    if (animationEvent && settings.eventFilters[animationEvent.type]) {
      // Adjust priority based on performance
      let adjustedPriority = animationEvent.priority;
      
      if (performanceMetrics.healthScore < 0.7) {
        // Reduce animation intensity when performance is poor
        if (adjustedPriority === 'critical') adjustedPriority = 'high';
        if (adjustedPriority === 'high') adjustedPriority = 'medium';
      }

      addEvent(animationEvent.type, animationEvent.data, adjustedPriority);
    }
  }, [settings, addEvent, performanceMetrics.healthScore]);

  // Subscribe to real-time channels when roomId is available
  useEffect(() => {
    if (!roomId || !settings.enabled) return;

    const subscriptions: string[] = [];

    // Subscribe to game room events
    const gameRoomChannel = `game-room:${roomId}`;
    subscribe(gameRoomChannel, {
      postgresChanges: {
        event: '*',
        schema: 'public',
        table: 'game_rooms',
        filter: `id=eq.${roomId}`
      },
      callback: (payload) => {
        handleRealtimeEvent({
          type: 'postgres_changes',
          payload: { ...payload, table: 'game_rooms' },
          metadata: { roomId, timestamp: Date.now() }
        });
      }
    });
    subscriptions.push(gameRoomChannel);

    // Subscribe to team events
    const teamsChannel = `teams:${roomId}`;
    subscribe(teamsChannel, {
      postgresChanges: {
        event: '*',
        schema: 'public',
        table: 'teams',
        filter: `room_id=eq.${roomId}`
      },
      callback: (payload) => {
        handleRealtimeEvent({
          type: 'postgres_changes',
          payload: { ...payload, table: 'teams' },
          metadata: { roomId, timestamp: Date.now() }
        });
      }
    });
    subscriptions.push(teamsChannel);

    // Subscribe to answer events
    const answersChannel = `answers:${roomId}`;
    subscribe(answersChannel, {
      postgresChanges: {
        event: '*',
        schema: 'public',
        table: 'team_answers'
      },
      callback: (payload) => {
        handleRealtimeEvent({
          type: 'postgres_changes',
          payload: { ...payload, table: 'team_answers' },
          metadata: { roomId, timestamp: Date.now() }
        });
      }
    });
    subscriptions.push(answersChannel);

    // Subscribe to broadcast events
    const broadcastChannel = `broadcast:${roomId}`;
    subscribe(broadcastChannel, {
      broadcast: { event: '*' },
      callback: (payload) => {
        handleRealtimeEvent({
          type: 'broadcast',
          payload,
          metadata: { roomId, timestamp: Date.now() }
        });
      }
    });
    subscriptions.push(broadcastChannel);

    // Cleanup subscriptions
    return () => {
      subscriptions.forEach(channel => unsubscribe(channel));
    };
  }, [roomId, settings.enabled, subscribe, unsubscribe, handleRealtimeEvent]);

  // Handle presence changes
  useEffect(() => {
    if (!presenceData || !settings.enabled || !settings.eventFilters.presence_change) return;

    // Convert presence data to events (simplified)
    Object.entries(presenceData).forEach(([userId, presence]) => {
      if (presence && typeof presence === 'object' && 'status' in presence) {
        const event: GameEvent = {
          type: 'presence',
          payload: {
            userId,
            status: presence.status,
            userName: presence.userName || `User ${userId.slice(0, 8)}`
          },
          metadata: { roomId, userId, timestamp: Date.now() }
        };
        
        // Debounce presence events to avoid spam
        setTimeout(() => handleRealtimeEvent(event), 100);
      }
    });
  }, [presenceData, settings.enabled, settings.eventFilters.presence_change, handleRealtimeEvent, roomId]);

  // Settings management
  const updateSettings = useCallback((newSettings: Partial<AnimationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const toggleEventFilter = useCallback((eventType: string) => {
    setSettings(prev => ({
      ...prev,
      eventFilters: {
        ...prev.eventFilters,
        [eventType]: !prev.eventFilters[eventType]
      }
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_ANIMATION_SETTINGS);
  }, []);

  // Manual event triggering for testing
  const triggerTestEvent = useCallback((
    type: RealtimeEvent['type'],
    customData?: any,
    priority?: RealtimeEvent['priority']
  ) => {
    const testEvent: GameEvent = {
      type,
      payload: {
        message: `Test ${type.replace('_', ' ')} event`,
        ...customData
      },
      metadata: { roomId, timestamp: Date.now() }
    };
    
    handleRealtimeEvent(testEvent);
  }, [handleRealtimeEvent, roomId]);

  // Performance-aware settings adjustment
  useEffect(() => {
    if (!settings.enabled) return;

    const healthScore = performanceMetrics.healthScore;
    
    // Auto-adjust settings based on performance
    if (healthScore < 0.5) {
      // Poor performance - reduce animations
      setSettings(prev => ({
        ...prev,
        intensity: 'subtle',
        enableParticles: false,
        maxVisibleEvents: 3
      }));
    } else if (healthScore < 0.7) {
      // Moderate performance - normal animations
      setSettings(prev => ({
        ...prev,
        intensity: 'normal',
        enableParticles: false,
        maxVisibleEvents: 4
      }));
    } else if (healthScore > 0.9) {
      // Excellent performance - full animations
      setSettings(prev => ({
        ...prev,
        intensity: 'dramatic',
        enableParticles: true,
        maxVisibleEvents: 6
      }));
    }
  }, [performanceMetrics.healthScore, settings.enabled]);

  return {
    // Animation system
    animationEvents,
    clearEvents,
    
    // Settings
    settings,
    updateSettings,
    toggleEventFilter,
    resetSettings,
    
    // Event management
    gameEvents: gameEvents.slice(-10), // Return last 10 for display
    eventStats,
    
    // Testing
    triggerTestEvent,
    
    // Status
    isConnected,
    isEnabled: settings.enabled,
    
    // Performance
    performanceMetrics,
    
    // Computed properties
    activeFilters: Object.entries(settings.eventFilters)
      .filter(([_, enabled]) => enabled)
      .map(([type]) => type),
    
    totalActiveEvents: animationEvents.length
  };
};

// Helper hook for simple animation integration
export const useSimpleRealtimeAnimations = (roomId?: string) => {
  const integration = useRealtimeAnimationIntegration(roomId, {
    intensity: 'normal',
    enableParticles: true,
    enablePulse: true,
    maxVisibleEvents: 3
  });

  return {
    events: integration.animationEvents,
    settings: {
      intensity: integration.settings.intensity,
      enableParticles: integration.settings.enableParticles,
      enablePulse: integration.settings.enablePulse,
      maxVisibleEvents: integration.settings.maxVisibleEvents
    },
    isConnected: integration.isConnected,
    triggerTestEvent: integration.triggerTestEvent
  };
};

export default useRealtimeAnimationIntegration; 
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';

// Animation types for different real-time events
export interface RealtimeEvent {
  id: string;
  type:
    | 'answer_submitted'
    | 'team_joined'
    | 'game_started'
    | 'score_updated'
    | 'notification'
    | 'presence_change';
  data: any;
  timestamp: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AnimationConfig {
  duration: number;
  delay?: number;
  easing: string;
  intensity: 'subtle' | 'normal' | 'dramatic';
}

// Animation variants for different event types
const animationVariants = {
  // Answer submission animations
  answerSubmitted: {
    initial: { scale: 1, opacity: 1 },
    animate: {
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1],
      boxShadow: [
        '0 0 0px rgba(59, 130, 246, 0)',
        '0 0 20px rgba(59, 130, 246, 0.5)',
        '0 0 0px rgba(59, 130, 246, 0)',
      ],
    },
    exit: { scale: 0.95, opacity: 0 },
    transition: { duration: 0.6, ease: 'easeInOut' },
  },

  // Team joined animations
  teamJoined: {
    initial: { x: -100, opacity: 0, scale: 0.8 },
    animate: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 25,
        duration: 0.5,
      },
    },
    exit: { x: 100, opacity: 0, scale: 0.8 },
  },

  // Game started animations
  gameStarted: {
    initial: { scale: 0, rotate: -180, opacity: 0 },
    animate: {
      scale: [0, 1.2, 1],
      rotate: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
        times: [0, 0.6, 1],
      },
    },
    exit: { scale: 0, opacity: 0 },
  },

  // Score updated animations
  scoreUpdated: {
    initial: { y: -20, opacity: 0 },
    animate: {
      y: [0, -10, 0],
      opacity: 1,
      color: ['#3B82F6', '#10B981', '#3B82F6'],
      transition: { duration: 0.4, ease: 'easeInOut' },
    },
    exit: { y: 20, opacity: 0 },
  },

  // Notification animations
  notification: {
    initial: { x: 300, opacity: 0 },
    animate: {
      x: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 400, damping: 30 },
    },
    exit: {
      x: 300,
      opacity: 0,
      transition: { duration: 0.3 },
    },
  },

  // Presence change animations
  presenceChange: {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' },
    },
    exit: { scale: 0.8, opacity: 0 },
  },
};

// Color schemes for different event types (following Tony Trivia Style Guide)
const eventColors = {
  answer_submitted: {
    primary: 'from-blue-500 to-purple-600',
    accent: 'text-blue-600',
    glow: 'shadow-blue-500/25',
  },
  team_joined: {
    primary: 'from-green-500 to-emerald-600',
    accent: 'text-green-600',
    glow: 'shadow-green-500/25',
  },
  game_started: {
    primary: 'from-purple-500 to-pink-600',
    accent: 'text-purple-600',
    glow: 'shadow-purple-500/25',
  },
  score_updated: {
    primary: 'from-orange-500 to-red-600',
    accent: 'text-orange-600',
    glow: 'shadow-orange-500/25',
  },
  notification: {
    primary: 'from-indigo-500 to-blue-600',
    accent: 'text-indigo-600',
    glow: 'shadow-indigo-500/25',
  },
  presence_change: {
    primary: 'from-gray-500 to-slate-600',
    accent: 'text-gray-600',
    glow: 'shadow-gray-500/25',
  },
};

// Individual animated event component
interface AnimatedEventProps {
  event: RealtimeEvent;
  onComplete?: () => void;
  config?: Partial<AnimationConfig>;
}

const AnimatedEvent: React.FC<AnimatedEventProps> = ({
  event,
  onComplete,
  config = {},
}) => {
  const controls = useAnimation();
  const colors = eventColors[event.type];
  const variants = animationVariants[event.type];

  useEffect(() => {
    const animate = async () => {
      await controls.start('animate');
      if (onComplete) {
        setTimeout(onComplete, config.duration || 1000);
      }
    };
    animate();
  }, [controls, onComplete, config.duration]);

  const getEventIcon = () => {
    switch (event.type) {
      case 'answer_submitted':
        return '✅';
      case 'team_joined':
        return '👥';
      case 'game_started':
        return '🎮';
      case 'score_updated':
        return '🏆';
      case 'notification':
        return '🔔';
      case 'presence_change':
        return '👤';
      default:
        return '📢';
    }
  };

  return (
    <motion.div
      initial="initial"
      animate={controls}
      exit="exit"
      variants={variants}
      className={cn(
        'relative p-4 rounded-lg bg-gradient-to-r shadow-lg',
        colors.primary,
        colors.glow,
        'text-white font-medium'
      )}
    >
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{getEventIcon()}</span>
        <div>
          <p className="font-semibold">
            {event.type.replace('_', ' ').toUpperCase()}
          </p>
          <p className="text-sm opacity-90">
            {event.data.message || 'Event occurred'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// Floating animation effects for background ambiance
const FloatingParticles: React.FC<{ active: boolean }> = ({ active }) => {
  const particles = Array.from({ length: 20 }, (_, i) => i);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {active &&
          particles.map(particle => (
            <motion.div
              key={particle}
              initial={{
                x: Math.random() * window.innerWidth,
                y: window.innerHeight + 20,
                opacity: 0,
                scale: 0,
              }}
              animate={{
                y: -20,
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                rotate: 360,
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                delay: Math.random() * 2,
                repeat: Infinity,
                repeatDelay: Math.random() * 5 + 3,
              }}
              className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
            />
          ))}
      </AnimatePresence>
    </div>
  );
};

// Pulse effect for critical events
const PulseEffect: React.FC<{ active: boolean; intensity: number }> = ({
  active,
  intensity,
}) => {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{
            scale: [0, 2, 0],
            opacity: [0.8, 0.3, 0],
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            duration: 1,
            repeat: intensity,
            ease: 'easeOut',
          }}
          className="fixed inset-0 pointer-events-none"
        >
          <div className="absolute inset-0 bg-gradient-radial from-blue-500/20 to-transparent" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Main realtime animation system component
interface RealtimeAnimationSystemProps {
  events: RealtimeEvent[];
  onEventComplete?: (eventId: string) => void;
  maxVisibleEvents?: number;
  animationIntensity?: 'subtle' | 'normal' | 'dramatic';
  enableParticles?: boolean;
  enablePulse?: boolean;
}

export const RealtimeAnimationSystem: React.FC<
  RealtimeAnimationSystemProps
> = ({
  events,
  onEventComplete,
  maxVisibleEvents = 5,
  animationIntensity = 'normal',
  enableParticles = true,
  enablePulse = true,
}) => {
  const [visibleEvents, setVisibleEvents] = useState<RealtimeEvent[]>([]);
  const [pulseActive, setPulseActive] = useState(false);
  const [particlesActive, setParticlesActive] = useState(false);

  // Handle new events
  useEffect(() => {
    if (events.length > 0) {
      const latestEvents = events.slice(-maxVisibleEvents);
      setVisibleEvents(latestEvents);

      // Trigger effects for high priority events
      const hasCriticalEvent = latestEvents.some(
        e => e.priority === 'critical'
      );
      const hasHighPriorityEvent = latestEvents.some(
        e => e.priority === 'high'
      );

      if (hasCriticalEvent && enablePulse) {
        setPulseActive(true);
        setTimeout(() => setPulseActive(false), 2000);
      }

      if (hasHighPriorityEvent && enableParticles) {
        setParticlesActive(true);
        setTimeout(() => setParticlesActive(false), 3000);
      }
    }
  }, [events, maxVisibleEvents, enablePulse, enableParticles]);

  const handleEventComplete = useCallback(
    (eventId: string) => {
      setVisibleEvents(prev => prev.filter(e => e.id !== eventId));
      onEventComplete?.(eventId);
    },
    [onEventComplete]
  );

  const getAnimationConfig = (): AnimationConfig => {
    switch (animationIntensity) {
      case 'subtle':
        return { duration: 300, easing: 'ease-out', intensity: 'subtle' };
      case 'dramatic':
        return { duration: 800, easing: 'ease-in-out', intensity: 'dramatic' };
      default:
        return { duration: 500, easing: 'ease-in-out', intensity: 'normal' };
    }
  };

  return (
    <>
      {/* Floating particles effect */}
      <FloatingParticles active={particlesActive} />

      {/* Pulse effect for critical events */}
      <PulseEffect
        active={pulseActive}
        intensity={animationIntensity === 'dramatic' ? 3 : 2}
      />

      {/* Event notifications container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        <AnimatePresence mode="popLayout">
          {visibleEvents.map(event => (
            <AnimatedEvent
              key={event.id}
              event={event}
              onComplete={() => handleEventComplete(event.id)}
              config={getAnimationConfig()}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};

// Hook for managing realtime animations
export const useRealtimeAnimations = () => {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const eventIdRef = useRef(0);

  const addEvent = useCallback(
    (
      type: RealtimeEvent['type'],
      data: any,
      priority: RealtimeEvent['priority'] = 'medium'
    ) => {
      const event: RealtimeEvent = {
        id: `event-${eventIdRef.current++}`,
        type,
        data,
        timestamp: Date.now(),
        priority,
      };

      setEvents(prev => [...prev, event]);

      // Auto-remove events after a delay based on priority
      const delay =
        priority === 'critical' ? 5000 : priority === 'high' ? 4000 : 3000;
      setTimeout(() => {
        setEvents(prev => prev.filter(e => e.id !== event.id));
      }, delay);
    },
    []
  );

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  const removeEvent = useCallback((eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId));
  }, []);

  return {
    events,
    addEvent,
    clearEvents,
    removeEvent,
  };
};

// Component for testing animations
export const RealtimeAnimationDemo: React.FC = () => {
  const { events, addEvent, clearEvents } = useRealtimeAnimations();
  const [intensity, setIntensity] = useState<'subtle' | 'normal' | 'dramatic'>(
    'normal'
  );
  const [particlesEnabled, setParticlesEnabled] = useState(true);
  const [pulseEnabled, setPulseEnabled] = useState(true);

  const testEvents = [
    {
      type: 'answer_submitted' as const,
      data: { message: 'Team Alpha submitted an answer!' },
      priority: 'medium' as const,
    },
    {
      type: 'team_joined' as const,
      data: { message: 'New team "Quiz Masters" joined!' },
      priority: 'high' as const,
    },
    {
      type: 'game_started' as const,
      data: { message: 'Game has started!' },
      priority: 'critical' as const,
    },
    {
      type: 'score_updated' as const,
      data: { message: 'Leaderboard updated!' },
      priority: 'medium' as const,
    },
    {
      type: 'notification' as const,
      data: { message: 'Host notification received' },
      priority: 'low' as const,
    },
    {
      type: 'presence_change' as const,
      data: { message: 'User status changed' },
      priority: 'low' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Real-time Animation System Demo
          </h1>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Animation Intensity
              </label>
              <select
                value={intensity}
                onChange={e => setIntensity(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="subtle">Subtle</option>
                <option value="normal">Normal</option>
                <option value="dramatic">Dramatic</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={particlesEnabled}
                  onChange={e => setParticlesEnabled(e.target.checked)}
                  className="mr-2"
                />
                Enable Particles
              </label>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={pulseEnabled}
                  onChange={e => setPulseEnabled(e.target.checked)}
                  className="mr-2"
                />
                Enable Pulse Effects
              </label>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {testEvents.map((testEvent, index) => (
              <button
                key={index}
                onClick={() =>
                  addEvent(testEvent.type, testEvent.data, testEvent.priority)
                }
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors',
                  'bg-gradient-to-r hover:scale-105 transform transition-transform',
                  eventColors[testEvent.type].primary,
                  'text-white shadow-lg'
                )}
              >
                {testEvent.type.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={clearEvents}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Clear All Events
            </button>

            <button
              onClick={() => {
                testEvents.forEach((testEvent, index) => {
                  setTimeout(() => {
                    addEvent(
                      testEvent.type,
                      testEvent.data,
                      testEvent.priority
                    );
                  }, index * 500);
                });
              }}
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Demo Sequence
            </button>
          </div>

          {/* Event Stats */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Current Events</h3>
            <p className="text-gray-600">Active events: {events.length}</p>
            {events.length > 0 && (
              <div className="mt-2 space-y-1">
                {events.slice(-3).map(event => (
                  <div key={event.id} className="text-sm text-gray-500">
                    {event.type} - {event.priority} priority
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animation System */}
      <RealtimeAnimationSystem
        events={events}
        animationIntensity={intensity}
        enableParticles={particlesEnabled}
        enablePulse={pulseEnabled}
        maxVisibleEvents={5}
      />
    </div>
  );
};

export default RealtimeAnimationSystem;

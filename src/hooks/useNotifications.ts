import { useState, useCallback, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { 
  GameNotification, 
  NotificationPreferences, 
  NotificationState, 
  NotificationActions,
  TeamSubmissionStatus 
} from '../types/hostControls';
import { useBroadcastListener } from './useBroadcast';
import { useGameController } from './useGameController';

// Default notification preferences
const DEFAULT_PREFERENCES: NotificationPreferences = {
  enableSounds: true,
  soundVolume: 0.7,
  autoCloseToasts: true,
  defaultToastDuration: 5000,
  showTeamSubmissionIndicators: true,
  enableTimeWarnings: true,
  timeWarningThresholds: [30, 10, 5], // seconds
  enableAnswerSubmissionAlerts: true,
  enableRoundProgressAlerts: true,
};

// Sound manager for notification sounds
class NotificationSoundManager {
  private audioContext: AudioContext | null = null;
  private soundBuffers: Map<string, AudioBuffer> = new Map();
  
  constructor() {
    this.initializeAudioContext();
    this.preloadSounds();
  }
  
  private async initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not supported:', error);
    }
  }
  
  private async preloadSounds() {
    if (!this.audioContext) return;
    
    const sounds = {
      'answer_submitted': this.generateTone(800, 0.15, 'sine'),
      'time_warning': this.generateTone(1000, 0.25, 'triangle'),
      'time_expired': this.generateTone(600, 0.5, 'sawtooth'),
      'round_complete': this.generateTone([800, 1000, 1200], 0.3, 'sine'),
      'error': this.generateTone(400, 0.3, 'square'),
      'info': this.generateTone(600, 0.2, 'sine'),
    };
    
    for (const [type, buffer] of Object.entries(sounds)) {
      this.soundBuffers.set(type, buffer);
    }
  }
  
  private generateTone(
    frequency: number | number[], 
    duration: number, 
    type: OscillatorType = 'sine'
  ): AudioBuffer {
    if (!this.audioContext) {
      return new AudioBuffer({ numberOfChannels: 1, length: 1, sampleRate: 44100 });
    }
    
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    
    const frequencies = Array.isArray(frequency) ? frequency : [frequency];
    
    for (let i = 0; i < length; i++) {
      const time = i / sampleRate;
      let sample = 0;
      
      frequencies.forEach((freq, index) => {
        const envelope = Math.exp(-time * 3); // Exponential decay
        sample += Math.sin(2 * Math.PI * freq * time) * envelope / frequencies.length;
      });
      
      data[i] = sample * 0.3; // Volume adjustment
    }
    
    return buffer;
  }
  
  async playSound(type: string, volume: number = 0.7) {
    if (!this.audioContext || !this.soundBuffers.has(type)) return;
    
    try {
      const buffer = this.soundBuffers.get(type)!;
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start();
    } catch (error) {
      console.warn('Failed to play notification sound:', error);
    }
  }
}

// Main notification hook
export function useNotifications(gameId: string): NotificationState & NotificationActions {
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [teamSubmissionStatuses, setTeamSubmissionStatuses] = useState<Record<string, TeamSubmissionStatus>>({});
  
  const soundManagerRef = useRef<NotificationSoundManager | null>(null);
  const { events: broadcastEvents } = useBroadcastListener(gameId);
  const { state: gameState, events: gameEvents } = useGameController(gameId);
  
  // Initialize sound manager
  useEffect(() => {
    soundManagerRef.current = new NotificationSoundManager();
  }, []);
  
  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.metadata?.read).length;
  
  // Add notification function
  const addNotification = useCallback((notificationData: Omit<GameNotification, 'id' | 'timestamp'>) => {
    const notification: GameNotification = {
      ...notificationData,
      id: uuidv4(),
      timestamp: new Date(),
      metadata: { read: false, ...notificationData.metadata },
    };
    
    setNotifications(prev => [notification, ...prev.slice(0, 99)]); // Keep last 100
    
    // Play sound if enabled
    if (notification.sound && preferences.enableSounds && soundManagerRef.current) {
      soundManagerRef.current.playSound(notification.type, preferences.soundVolume);
    }
    
    // Auto-close if configured
    if (notification.autoClose !== false && preferences.autoCloseToasts) {
      const duration = notification.duration || preferences.defaultToastDuration;
      setTimeout(() => {
        removeNotification(notification.id);
      }, duration);
    }
  }, [preferences]);
  
  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  
  // Mark as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id 
        ? { ...n, metadata: { ...n.metadata, read: true } }
        : n
    ));
  }, []);
  
  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ 
      ...n, 
      metadata: { ...n.metadata, read: true } 
    })));
  }, []);
  
  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);
  
  // Update preferences
  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, []);
  
  // Update team submission status
  const updateTeamSubmissionStatus = useCallback((teamId: string, status: Partial<TeamSubmissionStatus>) => {
    setTeamSubmissionStatuses(prev => ({
      ...prev,
      [teamId]: { ...prev[teamId], ...status }
    }));
  }, []);
  
  // Reset team submission statuses
  const resetTeamSubmissionStatuses = useCallback(() => {
    setTeamSubmissionStatuses({});
  }, []);
  
  // Handle broadcast events
  useEffect(() => {
    if (!broadcastEvents.length) return;
    
    const latestEvent = broadcastEvents[broadcastEvents.length - 1];
    
    switch (latestEvent.type) {
      case 'question_presented':
        if (preferences.enableRoundProgressAlerts) {
          addNotification({
            type: 'info',
            title: 'New Question',
            message: `Question ${latestEvent.payload.questionId} has been presented`,
            priority: 'medium',
            sound: true,
            autoClose: true,
            duration: 3000,
          });
        }
        // Reset team submission statuses for new question
        resetTeamSubmissionStatuses();
        break;
        
      case 'round_started':
        if (preferences.enableRoundProgressAlerts) {
          addNotification({
            type: 'info',
            title: 'Round Started',
            message: `Round ${latestEvent.payload.roundNumber} (${latestEvent.payload.roundType}) has begun`,
            priority: 'medium',
            sound: true,
            autoClose: true,
            duration: 4000,
          });
        }
        break;
        
      case 'answers_locked':
        addNotification({
          type: 'time_expired',
          title: 'Answers Locked',
          message: 'Time has expired. All answers are now locked.',
          priority: 'high',
          sound: true,
          autoClose: true,
          duration: 5000,
        });
        break;
        
      case 'scores_updated':
        if (preferences.enableRoundProgressAlerts) {
          addNotification({
            type: 'round_complete',
            title: 'Scores Updated',
            message: 'Team scores have been updated',
            priority: 'medium',
            sound: true,
            autoClose: true,
            duration: 3000,
          });
        }
        break;
    }
  }, [broadcastEvents, preferences, addNotification, resetTeamSubmissionStatuses]);
  
  // Handle game controller events
  useEffect(() => {
    if (!gameEvents.length) return;
    
    const latestEvent = gameEvents[gameEvents.length - 1];
    
    switch (latestEvent.type) {
      case 'error_occurred':
        addNotification({
          type: 'error',
          title: 'Game Error',
          message: latestEvent.error || 'An error occurred during the game',
          priority: 'critical',
          sound: true,
          autoClose: false,
          actionRequired: true,
        });
        break;
        
      case 'phase_transition_completed':
        if (preferences.enableRoundProgressAlerts) {
          addNotification({
            type: 'info',
            title: 'Phase Change',
            message: `Game phase changed to ${latestEvent.phase?.replace(/_/g, ' ')}`,
            priority: 'low',
            sound: false,
            autoClose: true,
            duration: 2000,
          });
        }
        break;
    }
  }, [gameEvents, preferences, addNotification]);
  
  // Handle timer warnings from game state
  useEffect(() => {
    if (!gameState?.timers || !preferences.enableTimeWarnings) return;
    
    // Check for time warnings based on current timers
    Object.entries(gameState.timers).forEach(([timerId, timer]) => {
      if (!timer.isActive) return;
      
      const timeRemaining = Math.max(0, timer.duration - timer.elapsed);
      
      preferences.timeWarningThresholds.forEach(threshold => {
        if (Math.abs(timeRemaining - threshold) < 0.5) { // Within 0.5 seconds
          addNotification({
            type: 'time_warning',
            title: 'Time Warning',
            message: `${threshold} seconds remaining`,
            priority: threshold <= 10 ? 'high' : 'medium',
            sound: true,
            autoClose: true,
            duration: 2000,
          });
        }
      });
    });
  }, [gameState?.timers, preferences, addNotification]);
  
  return {
    notifications,
    unreadCount,
    isNotificationCenterOpen,
    preferences,
    teamSubmissionStatuses,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    updatePreferences,
    updateTeamSubmissionStatus,
    resetTeamSubmissionStatuses,
  };
}

// Utility hook for simulating answer submissions (for testing)
export function useAnswerSubmissionSimulator(gameId: string) {
  const { updateTeamSubmissionStatus, addNotification } = useNotifications(gameId);
  
  const simulateAnswerSubmission = useCallback((
    teamId: string, 
    teamName: string, 
    confidence: 'low' | 'medium' | 'high' = 'medium',
    pointValue: number = 5
  ) => {
    // Update team submission status
    updateTeamSubmissionStatus(teamId, {
      teamId,
      teamName,
      hasSubmitted: true,
      submissionTime: new Date(),
      confidence,
      pointValue,
      isLocked: false,
    });
    
    // Add notification
    addNotification({
      type: 'answer_submitted',
      title: 'Answer Submitted',
      message: `${teamName} submitted their answer (${pointValue} points, ${confidence} confidence)`,
      teamId,
      teamName,
      priority: 'medium',
      sound: true,
      autoClose: true,
      duration: 4000,
    });
  }, [updateTeamSubmissionStatus, addNotification]);
  
  return { simulateAnswerSubmission };
} 
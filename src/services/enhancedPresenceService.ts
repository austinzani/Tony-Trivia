import { RealtimeChannelManager } from './realtimeChannelManager';
import { supabase } from './supabase';

export interface EnhancedUserPresence {
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  role: 'host' | 'player' | 'spectator' | 'guest';
  status: 'online' | 'away' | 'busy' | 'offline' | 'in_game';
  team_id?: string;
  team_name?: string;
  game_room_id?: string;
  joined_at: string;
  last_seen: string;
  current_activity: 'lobby' | 'in_game' | 'reviewing' | 'browsing' | 'idle';
  device_info: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os?: string;
  };
  network_quality?: 'excellent' | 'good' | 'poor' | 'offline';
  session_id: string;
}

export interface PresenceMetrics {
  total_users: number;
  online_users: number;
  by_role: Record<string, number>;
  by_status: Record<string, number>;
  by_activity: Record<string, number>;
  average_session_duration: number;
  peak_concurrent_users: number;
}

export interface PresenceEvent {
  type: 'user_joined' | 'user_left' | 'status_changed' | 'activity_changed';
  user_id: string;
  username: string;
  timestamp: string;
  presence_data: EnhancedUserPresence;
  previous_data?: Partial<EnhancedUserPresence>;
}

export class EnhancedPresenceService {
  private static instance: EnhancedPresenceService;
  private channelManager = RealtimeChannelManager.getInstance();
  private presenceStates = new Map<string, Map<string, EnhancedUserPresence>>();
  private presenceMetrics = new Map<string, PresenceMetrics>();
  private eventCallbacks = new Map<string, Set<(event: PresenceEvent) => void>>();
  private heartbeatIntervals = new Map<string, NodeJS.Timeout>();
  private activityDetectors = new Map<string, () => void>();
  private sessionStartTimes = new Map<string, number>();

  private constructor() {}

  static getInstance(): EnhancedPresenceService {
    if (!EnhancedPresenceService.instance) {
      EnhancedPresenceService.instance = new EnhancedPresenceService();
    }
    return EnhancedPresenceService.instance;
  }

  // Join presence for a specific context (room or team)
  async joinPresence(
    contextType: 'room' | 'team',
    contextId: string,
    userPresence: Omit<EnhancedUserPresence, 'joined_at' | 'last_seen' | 'session_id' | 'device_info'>
  ): Promise<string> {
    const channelName = `presence:${contextType}:${contextId}`;
    const sessionId = this.generateSessionId();
    const deviceInfo = this.getDeviceInfo();

    const fullPresence: EnhancedUserPresence = {
      ...userPresence,
      joined_at: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      session_id: sessionId,
      device_info: deviceInfo,
      network_quality: 'good' // Will be updated by network monitoring
    };

    try {
      // Subscribe to presence channel through our channel manager
      const subscriptionId = await this.channelManager.subscribeToPresence(
        channelName,
        fullPresence,
        {
          onSync: (presences) => this.handlePresenceSync(channelName, presences),
          onJoin: (presences) => this.handlePresenceJoin(channelName, presences),
          onLeave: (presences) => this.handlePresenceLeave(channelName, presences)
        }
      );

      // Initialize presence state
      if (!this.presenceStates.has(channelName)) {
        this.presenceStates.set(channelName, new Map());
      }

      // Set up heartbeat
      this.setupHeartbeat(channelName, sessionId, fullPresence);

      // Set up activity detection
      this.setupActivityDetection(channelName, sessionId);

      // Record session start
      this.sessionStartTimes.set(`${channelName}:${sessionId}`, Date.now());

      return subscriptionId;
    } catch (error) {
      console.error('Failed to join presence:', error);
      throw error;
    }
  }

  // Leave presence
  async leavePresence(contextType: 'room' | 'team', contextId: string, sessionId: string): Promise<void> {
    const channelName = `presence:${contextType}:${contextId}`;
    
    try {
      // Clean up heartbeat
      const heartbeatKey = `${channelName}:${sessionId}`;
      const heartbeat = this.heartbeatIntervals.get(heartbeatKey);
      if (heartbeat) {
        clearInterval(heartbeat);
        this.heartbeatIntervals.delete(heartbeatKey);
      }

      // Clean up activity detector
      const detector = this.activityDetectors.get(heartbeatKey);
      if (detector) {
        document.removeEventListener('mousemove', detector);
        document.removeEventListener('keypress', detector);
        document.removeEventListener('click', detector);
        this.activityDetectors.delete(heartbeatKey);
      }

      // Remove from presence state
      const presenceState = this.presenceStates.get(channelName);
      if (presenceState) {
        presenceState.delete(sessionId);
      }

      // Calculate session duration for metrics
      const sessionStartKey = `${channelName}:${sessionId}`;
      const sessionStart = this.sessionStartTimes.get(sessionStartKey);
      if (sessionStart) {
        const duration = Date.now() - sessionStart;
        this.updateSessionMetrics(channelName, duration);
        this.sessionStartTimes.delete(sessionStartKey);
      }

      // Unsubscribe from channel
      await this.channelManager.unsubscribe(channelName);
    } catch (error) {
      console.error('Failed to leave presence:', error);
      throw error;
    }
  }

  // Update user presence
  async updatePresence(
    contextType: 'room' | 'team',
    contextId: string,
    sessionId: string,
    updates: Partial<Pick<EnhancedUserPresence, 'status' | 'current_activity' | 'team_id' | 'team_name' | 'game_room_id'>>
  ): Promise<void> {
    const channelName = `presence:${contextType}:${contextId}`;
    const presenceState = this.presenceStates.get(channelName);
    const currentPresence = presenceState?.get(sessionId);

    if (!currentPresence) {
      throw new Error('User not found in presence state');
    }

    const previousData = { ...currentPresence };
    const updatedPresence: EnhancedUserPresence = {
      ...currentPresence,
      ...updates,
      last_seen: new Date().toISOString()
    };

    try {
      // Update through channel manager
      await this.channelManager.updatePresence(channelName, updatedPresence);

      // Update local state
      presenceState?.set(sessionId, updatedPresence);

      // Emit presence change event
      this.emitPresenceEvent(channelName, {
        type: 'status_changed',
        user_id: updatedPresence.user_id,
        username: updatedPresence.username,
        timestamp: new Date().toISOString(),
        presence_data: updatedPresence,
        previous_data: previousData
      });
    } catch (error) {
      console.error('Failed to update presence:', error);
      throw error;
    }
  }

  // Get presence state for a context
  getPresenceState(contextType: 'room' | 'team', contextId: string): EnhancedUserPresence[] {
    const channelName = `presence:${contextType}:${contextId}`;
    const presenceState = this.presenceStates.get(channelName);
    return presenceState ? Array.from(presenceState.values()) : [];
  }

  // Get presence metrics
  getPresenceMetrics(contextType: 'room' | 'team', contextId: string): PresenceMetrics | null {
    const channelName = `presence:${contextType}:${contextId}`;
    return this.presenceMetrics.get(channelName) || null;
  }

  // Subscribe to presence events
  onPresenceEvent(
    contextType: 'room' | 'team',
    contextId: string,
    callback: (event: PresenceEvent) => void
  ): () => void {
    const channelName = `presence:${contextType}:${contextId}`;
    
    if (!this.eventCallbacks.has(channelName)) {
      this.eventCallbacks.set(channelName, new Set());
    }
    
    this.eventCallbacks.get(channelName)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.eventCallbacks.get(channelName)?.delete(callback);
    };
  }

  // Private methods
  private handlePresenceSync(channelName: string, presences: Record<string, any>): void {
    const presenceState = this.presenceStates.get(channelName) || new Map();
    
    // Clear existing state
    presenceState.clear();
    
    // Add all current presences
    Object.entries(presences).forEach(([key, presence]) => {
      if (Array.isArray(presence) && presence.length > 0) {
        presenceState.set(key, presence[0] as EnhancedUserPresence);
      }
    });
    
    this.presenceStates.set(channelName, presenceState);
    this.updatePresenceMetrics(channelName);
  }

  private handlePresenceJoin(channelName: string, presences: any[]): void {
    const presenceState = this.presenceStates.get(channelName) || new Map();
    
    presences.forEach((presence) => {
      const userPresence = presence as EnhancedUserPresence;
      presenceState.set(userPresence.session_id, userPresence);
      
      this.emitPresenceEvent(channelName, {
        type: 'user_joined',
        user_id: userPresence.user_id,
        username: userPresence.username,
        timestamp: new Date().toISOString(),
        presence_data: userPresence
      });
    });
    
    this.presenceStates.set(channelName, presenceState);
    this.updatePresenceMetrics(channelName);
  }

  private handlePresenceLeave(channelName: string, presences: any[]): void {
    const presenceState = this.presenceStates.get(channelName) || new Map();
    
    presences.forEach((presence) => {
      const userPresence = presence as EnhancedUserPresence;
      presenceState.delete(userPresence.session_id);
      
      this.emitPresenceEvent(channelName, {
        type: 'user_left',
        user_id: userPresence.user_id,
        username: userPresence.username,
        timestamp: new Date().toISOString(),
        presence_data: userPresence
      });
    });
    
    this.presenceStates.set(channelName, presenceState);
    this.updatePresenceMetrics(channelName);
  }

  private setupHeartbeat(channelName: string, sessionId: string, presence: EnhancedUserPresence): void {
    const heartbeatKey = `${channelName}:${sessionId}`;
    
    const interval = setInterval(async () => {
      try {
        const updatedPresence = {
          ...presence,
          last_seen: new Date().toISOString(),
          network_quality: await this.checkNetworkQuality()
        };
        
        await this.channelManager.updatePresence(channelName, updatedPresence);
        
        // Update local state
        const presenceState = this.presenceStates.get(channelName);
        if (presenceState) {
          presenceState.set(sessionId, updatedPresence);
        }
      } catch (error) {
        console.warn('Heartbeat failed:', error);
      }
    }, 30000); // 30 second heartbeat
    
    this.heartbeatIntervals.set(heartbeatKey, interval);
  }

  private setupActivityDetection(channelName: string, sessionId: string): void {
    const heartbeatKey = `${channelName}:${sessionId}`;
    let lastActivity = Date.now();
    let currentStatus = 'online';
    
    const detector = () => {
      lastActivity = Date.now();
      if (currentStatus !== 'online') {
        currentStatus = 'online';
        this.updatePresence('room', channelName.split(':')[2], sessionId, { status: 'online' });
      }
    };
    
    // Check for inactivity
    const inactivityChecker = setInterval(() => {
      const inactive = Date.now() - lastActivity;
      
      if (inactive > 300000 && currentStatus !== 'away') { // 5 minutes
        currentStatus = 'away';
        this.updatePresence('room', channelName.split(':')[2], sessionId, { status: 'away' });
      } else if (inactive > 1800000 && currentStatus !== 'offline') { // 30 minutes
        currentStatus = 'offline';
        this.updatePresence('room', channelName.split(':')[2], sessionId, { status: 'offline' });
      }
    }, 60000); // Check every minute
    
    document.addEventListener('mousemove', detector);
    document.addEventListener('keypress', detector);
    document.addEventListener('click', detector);
    
    this.activityDetectors.set(heartbeatKey, () => {
      clearInterval(inactivityChecker);
    });
  }

  private emitPresenceEvent(channelName: string, event: PresenceEvent): void {
    const callbacks = this.eventCallbacks.get(channelName);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in presence event callback:', error);
        }
      });
    }
  }

  private updatePresenceMetrics(channelName: string): void {
    const presenceState = this.presenceStates.get(channelName);
    if (!presenceState) return;

    const users = Array.from(presenceState.values());
    const metrics: PresenceMetrics = {
      total_users: users.length,
      online_users: users.filter(u => ['online', 'away', 'busy', 'in_game'].includes(u.status)).length,
      by_role: {},
      by_status: {},
      by_activity: {},
      average_session_duration: 0,
      peak_concurrent_users: Math.max(users.length, this.presenceMetrics.get(channelName)?.peak_concurrent_users || 0)
    };

    // Count by categories
    users.forEach(user => {
      metrics.by_role[user.role] = (metrics.by_role[user.role] || 0) + 1;
      metrics.by_status[user.status] = (metrics.by_status[user.status] || 0) + 1;
      metrics.by_activity[user.current_activity] = (metrics.by_activity[user.current_activity] || 0) + 1;
    });

    this.presenceMetrics.set(channelName, metrics);
  }

  private updateSessionMetrics(channelName: string, duration: number): void {
    const metrics = this.presenceMetrics.get(channelName);
    if (metrics) {
      // Simple running average for now
      metrics.average_session_duration = (metrics.average_session_duration + duration) / 2;
      this.presenceMetrics.set(channelName, metrics);
    }
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo(): EnhancedUserPresence['device_info'] {
    const userAgent = navigator.userAgent;
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    let browser = 'unknown';
    let os = 'unknown';

    // Detect device type
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      deviceType = 'tablet';
    } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      deviceType = 'mobile';
    }

    // Detect browser
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // Detect OS
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('iOS')) os = 'iOS';
    else if (userAgent.includes('Android')) os = 'Android';

    return { type: deviceType, browser, os };
  }

  private async checkNetworkQuality(): Promise<EnhancedUserPresence['network_quality']> {
    if (!navigator.onLine) return 'offline';
    
    try {
      const start = Date.now();
      const response = await fetch('/ping', { method: 'HEAD', cache: 'no-cache' });
      const latency = Date.now() - start;
      
      if (latency < 100) return 'excellent';
      if (latency < 300) return 'good';
      return 'poor';
    } catch {
      return 'poor';
    }
  }
}

export const enhancedPresenceService = EnhancedPresenceService.getInstance(); 
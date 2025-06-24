import { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export interface ConnectionOptions {
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  exponentialBackoff?: boolean;
  heartbeatInterval?: number;
  timeoutDuration?: number;
}

export interface ConnectionEvent {
  type: 'status-change' | 'message' | 'error' | 'heartbeat';
  status?: ConnectionStatus;
  data?: any;
  error?: Error;
  timestamp: Date;
}

export interface ChannelSubscription {
  id: string;
  channel: RealtimeChannel;
  table: string;
  filter?: string;
  callback: (payload: any) => void;
  isActive: boolean;
}

export class ConnectionManager {
  private status: ConnectionStatus = 'disconnected';
  private subscriptions: Map<string, ChannelSubscription> = new Map();
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastHeartbeat: Date | null = null;
  private eventListeners: Set<(event: ConnectionEvent) => void> = new Set();
  
  private options: Required<ConnectionOptions> = {
    autoReconnect: true,
    maxReconnectAttempts: 10,
    reconnectInterval: 3000,
    exponentialBackoff: true,
    heartbeatInterval: 30000,
    timeoutDuration: 60000,
  };

  constructor(options: ConnectionOptions = {}) {
    this.options = { ...this.options, ...options };
    this.setupRealtimeListeners();
    this.startHeartbeat();
  }

  // Event listener management
  addEventListener(callback: (event: ConnectionEvent) => void): () => void {
    this.eventListeners.add(callback);
    return () => this.eventListeners.delete(callback);
  }

  private emitEvent(event: Omit<ConnectionEvent, 'timestamp'>): void {
    const fullEvent: ConnectionEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.eventListeners.forEach(callback => {
      try {
        callback(fullEvent);
      } catch (error) {
        console.error('Error in connection event callback:', error);
      }
    });
  }

  // Setup Supabase realtime listeners
  private setupRealtimeListeners(): void {
    // Listen to realtime connection events
    supabase.realtime.onOpen(() => {
      this.handleConnectionOpen();
    });

    supabase.realtime.onClose(() => {
      this.handleConnectionClose();
    });

    supabase.realtime.onError((error: any) => {
      this.handleConnectionError(error);
    });
  }

  // Connection event handlers
  private handleConnectionOpen(): void {
    console.log('✅ Realtime connection established');
    
    this.setStatus('connected');
    this.reconnectAttempts = 0;
    this.clearReconnectTimer();
    this.lastHeartbeat = new Date();
    
    // Reestablish subscriptions
    this.reestablishSubscriptions();
  }

  private handleConnectionClose(): void {
    console.log('❌ Realtime connection closed');
    
    this.setStatus('disconnected');
    
    if (this.options.autoReconnect && this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      this.setStatus('error');
      this.emitEvent({
        type: 'error',
        error: new Error('Max reconnection attempts reached'),
      });
    }
  }

  private handleConnectionError(error: any): void {
    console.error('🚨 Realtime connection error:', error);
    
    this.setStatus('error');
    this.emitEvent({
      type: 'error',
      error: error instanceof Error ? error : new Error(String(error)),
    });
    
    // Trigger reconnection if auto-reconnect is enabled
    if (this.options.autoReconnect) {
      this.scheduleReconnect();
    }
  }

  // Status management
  private setStatus(newStatus: ConnectionStatus): void {
    if (this.status !== newStatus) {
      const oldStatus = this.status;
      this.status = newStatus;
      
      console.log(`🔄 Connection status: ${oldStatus} → ${newStatus}`);
      
      this.emitEvent({
        type: 'status-change',
        status: newStatus,
        data: { oldStatus, newStatus },
      });
    }
  }

  // Reconnection logic
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return; // Already scheduled
    }

    this.reconnectAttempts++;
    this.setStatus('reconnecting');

    const delay = this.calculateReconnectDelay();
    
    console.log(
      `🔄 Scheduling reconnection attempt ${this.reconnectAttempts}/${this.options.maxReconnectAttempts} in ${delay}ms`
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.attemptReconnect();
    }, delay);
  }

  private calculateReconnectDelay(): number {
    if (!this.options.exponentialBackoff) {
      return this.options.reconnectInterval;
    }

    // Exponential backoff with jitter
    const exponentialDelay = this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    const jitter = Math.random() * 1000; // Add 0-1000ms jitter
    
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  private async attemptReconnect(): Promise<void> {
    try {
      console.log(`🔌 Attempting to reconnect (attempt ${this.reconnectAttempts})`);
      
      // First, disconnect existing connection
      await this.disconnect();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to reconnect
      await this.connect();
      
    } catch (error) {
      console.error('Reconnection attempt failed:', error);
      
      if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
        this.scheduleReconnect();
      } else {
        this.setStatus('error');
        this.emitEvent({
          type: 'error',
          error: new Error('Failed to reconnect after maximum attempts'),
        });
      }
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Subscription management
  async subscribe(
    table: string,
    callback: (payload: any) => void,
    filter?: string,
    event: string = '*'
  ): Promise<string> {
    const subscriptionId = `${table}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const channel = supabase
        .channel(`subscription-${subscriptionId}`)
        .on(
          'postgres_changes',
          {
            event: event as any,
            schema: 'public',
            table,
            filter,
          },
          (payload) => {
            this.emitEvent({
              type: 'message',
              data: { subscriptionId, payload },
            });
            
            try {
              callback(payload);
            } catch (error) {
              console.error('Error in subscription callback:', error);
              this.emitEvent({
                type: 'error',
                error: error instanceof Error ? error : new Error(String(error)),
              });
            }
          }
        )
        .subscribe((status, error) => {
          if (error) {
            console.error(`Subscription error for ${table}:`, error);
            this.emitEvent({
              type: 'error',
              error: error instanceof Error ? error : new Error(String(error)),
            });
          } else {
            console.log(`✅ Subscribed to ${table} (${subscriptionId}): ${status}`);
          }
        });

      const subscription: ChannelSubscription = {
        id: subscriptionId,
        channel,
        table,
        filter,
        callback,
        isActive: true,
      };

      this.subscriptions.set(subscriptionId, subscription);
      
      return subscriptionId;
      
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  }

  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    
    if (subscription) {
      try {
        await supabase.removeChannel(subscription.channel);
        subscription.isActive = false;
        this.subscriptions.delete(subscriptionId);
        
        console.log(`✅ Unsubscribed from ${subscription.table} (${subscriptionId})`);
      } catch (error) {
        console.error('Failed to unsubscribe:', error);
        throw error;
      }
    }
  }

  private async reestablishSubscriptions(): Promise<void> {
    console.log('🔄 Reestablishing subscriptions...');
    
    const subscriptionsToReestablish = Array.from(this.subscriptions.values())
      .filter(sub => sub.isActive);

    for (const subscription of subscriptionsToReestablish) {
      try {
        // Remove old subscription
        await supabase.removeChannel(subscription.channel);
        
        // Create new subscription with same parameters
        const newSubscriptionId = await this.subscribe(
          subscription.table,
          subscription.callback,
          subscription.filter
        );
        
        // Update the subscription ID
        this.subscriptions.delete(subscription.id);
        
        console.log(`✅ Reestablished subscription for ${subscription.table}`);
        
      } catch (error) {
        console.error(`Failed to reestablish subscription for ${subscription.table}:`, error);
        subscription.isActive = false;
      }
    }
  }

  // Heartbeat mechanism
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.options.heartbeatInterval);
  }

  private async sendHeartbeat(): Promise<void> {
    if (this.status !== 'connected') {
      return;
    }

    try {
      // Simple ping to test connection
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        throw error;
      }

      this.lastHeartbeat = new Date();
      
      this.emitEvent({
        type: 'heartbeat',
        data: { timestamp: this.lastHeartbeat },
      });

    } catch (error) {
      console.warn('Heartbeat failed:', error);
      
      // Check if we should trigger reconnection
      if (this.lastHeartbeat) {
        const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeat.getTime();
        
        if (timeSinceLastHeartbeat > this.options.timeoutDuration) {
          console.warn('Connection timeout detected, triggering reconnection');
          this.handleConnectionError(new Error('Connection timeout'));
        }
      }
    }
  }

  // Public API methods
  async connect(): Promise<void> {
    if (this.status === 'connected' || this.status === 'connecting') {
      return;
    }

    this.setStatus('connecting');
    
    try {
      // Force a connection test
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        throw error;
      }

      // Connection successful
      this.setStatus('connected');
      this.lastHeartbeat = new Date();
      
    } catch (error) {
      this.setStatus('error');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.setStatus('disconnected');
    this.clearReconnectTimer();
    
    // Unsubscribe from all channels
    const unsubscribePromises = Array.from(this.subscriptions.values()).map(
      sub => supabase.removeChannel(sub.channel)
    );
    
    await Promise.allSettled(unsubscribePromises);
    
    // Clear subscriptions
    this.subscriptions.clear();
  }

  // Status and diagnostics
  getStatus(): ConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === 'connected';
  }

  getConnectionInfo(): {
    status: ConnectionStatus;
    reconnectAttempts: number;
    subscriptionCount: number;
    lastHeartbeat: Date | null;
    uptime: number | null;
  } {
    return {
      status: this.status,
      reconnectAttempts: this.reconnectAttempts,
      subscriptionCount: this.subscriptions.size,
      lastHeartbeat: this.lastHeartbeat,
      uptime: this.lastHeartbeat ? Date.now() - this.lastHeartbeat.getTime() : null,
    };
  }

  getActiveSubscriptions(): Array<{
    id: string;
    table: string;
    filter?: string;
    isActive: boolean;
  }> {
    return Array.from(this.subscriptions.values()).map(sub => ({
      id: sub.id,
      table: sub.table,
      filter: sub.filter,
      isActive: sub.isActive,
    }));
  }

  // Force reconnection
  async forceReconnect(): Promise<void> {
    console.log('🔄 Forcing reconnection...');
    this.reconnectAttempts = 0;
    await this.attemptReconnect();
  }

  // Cleanup
  destroy(): void {
    this.clearReconnectTimer();
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    this.disconnect();
    this.eventListeners.clear();
  }
}

// Global instance for the app
export const connectionManager = new ConnectionManager();

export default ConnectionManager; 
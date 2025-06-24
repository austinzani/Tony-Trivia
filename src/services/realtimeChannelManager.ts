import type { RealtimeChannel, RealtimePostgresChangesPayload } from './supabase';
import { supabase } from './supabase';

export interface ChannelSubscription {
  id: string;
  channel: RealtimeChannel;
  type: 'postgres' | 'broadcast' | 'presence';
  table?: string;
  filter?: string;
  event?: string;
  callback: (payload: any) => void;
  createdAt: Date;
  lastActivity?: Date;
  connectionAttempts: number;
  isActive: boolean;
}

export interface ChannelMetrics {
  totalChannels: number;
  activeChannels: number;
  averageLatency: number;
  connectionAttempts: number;
  lastReconnectTime?: Date;
  eventCount: number;
}

class RealtimeChannelManager {
  private subscriptions = new Map<string, ChannelSubscription>();
  private metrics: ChannelMetrics = {
    totalChannels: 0,
    activeChannels: 0,
    averageLatency: 0,
    connectionAttempts: 0,
    eventCount: 0,
  };
  private performanceObserver?: PerformanceObserver;
  private latencyMeasurements: number[] = [];
  private maxLatencyMeasurements = 100;

  constructor() {
    this.initializePerformanceMonitoring();
    this.setupGlobalRealtimeListeners();
  }

  private initializePerformanceMonitoring() {
    if (typeof PerformanceObserver !== 'undefined') {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.startsWith('realtime-')) {
            this.latencyMeasurements.push(entry.duration);
            if (this.latencyMeasurements.length > this.maxLatencyMeasurements) {
              this.latencyMeasurements.shift();
            }
            this.updateAverageLatency();
          }
        }
      });
      this.performanceObserver.observe({ entryTypes: ['measure'] });
    }
  }

  private setupGlobalRealtimeListeners() {
    supabase.realtime.onOpen(() => {
      console.log('🔌 Realtime connection opened');
      this.metrics.lastReconnectTime = new Date();
      this.resubscribeAll();
    });

    supabase.realtime.onClose(() => {
      console.log('🔌 Realtime connection closed');
      this.markAllInactive();
    });

    supabase.realtime.onError((error) => {
      console.error('🔌 Realtime connection error:', error);
      this.metrics.connectionAttempts++;
    });
  }

  private updateAverageLatency() {
    if (this.latencyMeasurements.length > 0) {
      const sum = this.latencyMeasurements.reduce((a, b) => a + b, 0);
      this.metrics.averageLatency = sum / this.latencyMeasurements.length;
    }
  }

  private markAllInactive() {
    for (const subscription of this.subscriptions.values()) {
      subscription.isActive = false;
    }
    this.updateActiveChannelCount();
  }

  private async resubscribeAll() {
    console.log('♻️ Resubscribing to all channels...');
    for (const subscription of this.subscriptions.values()) {
      if (!subscription.isActive) {
        await this.resubscribeChannel(subscription);
      }
    }
  }

  private async resubscribeChannel(subscription: ChannelSubscription) {
    try {
      subscription.connectionAttempts++;
      const newChannel = this.createChannel(subscription);
      
      await newChannel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          subscription.isActive = true;
          subscription.channel = newChannel;
          this.updateActiveChannelCount();
          console.log(`✅ Resubscribed to channel: ${subscription.id}`);
        }
      });
    } catch (error) {
      console.error(`❌ Failed to resubscribe to channel ${subscription.id}:`, error);
    }
  }

  private createChannel(subscription: ChannelSubscription): RealtimeChannel {
    const channelName = `${subscription.type}:${subscription.id}:${Date.now()}`;
    const channel = supabase.channel(channelName);

    if (subscription.type === 'postgres' && subscription.table) {
      channel.on(
        'postgres_changes',
        {
          event: subscription.event || '*',
          schema: 'public',
          table: subscription.table,
          ...(subscription.filter && { filter: subscription.filter }),
        },
        (payload) => {
          this.handleChannelEvent(subscription, payload);
        }
      );
    } else if (subscription.type === 'broadcast') {
      channel.on('broadcast', { event: subscription.event || '*' }, (payload) => {
        this.handleChannelEvent(subscription, payload);
      });
    } else if (subscription.type === 'presence') {
      channel.on('presence', { event: '*' }, (payload) => {
        this.handleChannelEvent(subscription, payload);
      });
    }

    return channel;
  }

  private handleChannelEvent(subscription: ChannelSubscription, payload: any) {
    const startTime = performance.now();
    
    subscription.lastActivity = new Date();
    this.metrics.eventCount++;
    
    // Call the user's callback
    subscription.callback(payload);
    
    // Measure callback execution time
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Record performance measurement
    if (typeof performance.mark !== 'undefined') {
      performance.mark(`realtime-${subscription.id}-start`);
      performance.mark(`realtime-${subscription.id}-end`);
      performance.measure(
        `realtime-${subscription.id}`,
        `realtime-${subscription.id}-start`,
        `realtime-${subscription.id}-end`
      );
    }
  }

  private updateActiveChannelCount() {
    this.metrics.activeChannels = Array.from(this.subscriptions.values()).filter(
      (sub) => sub.isActive
    ).length;
  }

  private generateSubscriptionId(type: string, identifier: string): string {
    return `${type}_${identifier}_${Date.now()}`;
  }

  public async subscribeToTable(
    table: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void,
    options: {
      event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
      filter?: string;
      id?: string;
    } = {}
  ): Promise<string> {
    const id = options.id || this.generateSubscriptionId('postgres', table);
    
    if (this.subscriptions.has(id)) {
      console.warn(`⚠️ Subscription with ID ${id} already exists`);
      return id;
    }

    const subscription: ChannelSubscription = {
      id,
      channel: this.createChannel({
        id,
        type: 'postgres',
        table,
        event: options.event,
        filter: options.filter,
        callback,
      } as ChannelSubscription),
      type: 'postgres',
      table,
      event: options.event,
      filter: options.filter,
      callback,
      createdAt: new Date(),
      connectionAttempts: 0,
      isActive: false,
    };

    this.subscriptions.set(id, subscription);
    this.metrics.totalChannels++;

    try {
      await subscription.channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          subscription.isActive = true;
          this.updateActiveChannelCount();
          console.log(`✅ Subscribed to table: ${table} with ID: ${id}`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          subscription.isActive = false;
          this.updateActiveChannelCount();
          console.error(`❌ Subscription failed for ${table}: ${status}`);
        }
      });
    } catch (error) {
      console.error(`❌ Failed to subscribe to table ${table}:`, error);
      this.subscriptions.delete(id);
      this.metrics.totalChannels--;
      throw error;
    }

    return id;
  }

  public async subscribeToBroadcast(
    channelName: string,
    callback: (payload: any) => void,
    options: {
      event?: string;
      id?: string;
    } = {}
  ): Promise<string> {
    const id = options.id || this.generateSubscriptionId('broadcast', channelName);
    
    if (this.subscriptions.has(id)) {
      console.warn(`⚠️ Subscription with ID ${id} already exists`);
      return id;
    }

    const subscription: ChannelSubscription = {
      id,
      channel: this.createChannel({
        id,
        type: 'broadcast',
        event: options.event,
        callback,
      } as ChannelSubscription),
      type: 'broadcast',
      event: options.event,
      callback,
      createdAt: new Date(),
      connectionAttempts: 0,
      isActive: false,
    };

    this.subscriptions.set(id, subscription);
    this.metrics.totalChannels++;

    try {
      await subscription.channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          subscription.isActive = true;
          this.updateActiveChannelCount();
          console.log(`✅ Subscribed to broadcast: ${channelName} with ID: ${id}`);
        }
      });
    } catch (error) {
      console.error(`❌ Failed to subscribe to broadcast ${channelName}:`, error);
      this.subscriptions.delete(id);
      this.metrics.totalChannels--;
      throw error;
    }

    return id;
  }

  public async subscribeToPresence(
    channelName: string,
    presenceData: any,
    callbacks: {
      onSync?: (presences: Record<string, any>) => void;
      onJoin?: (presences: any[]) => void;
      onLeave?: (presences: any[]) => void;
    },
    options: {
      presenceKey?: string;
      id?: string;
    } = {}
  ): Promise<string> {
    const id = options.id || this.generateSubscriptionId('presence', channelName);
    
    if (this.subscriptions.has(id)) {
      console.warn(`⚠️ Subscription with ID ${id} already exists`);
      return id;
    }

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: options.presenceKey || 'default'
        }
      }
    });

    const subscription: ChannelSubscription = {
      id,
      channel,
      type: 'presence',
      callback: (payload) => {}, // Dummy callback for interface compatibility
      createdAt: new Date(),
      connectionAttempts: 0,
      isActive: false,
    };

    // Add presence event listeners
    channel.on('presence', { event: 'sync' }, () => {
      if (callbacks.onSync) {
        callbacks.onSync(channel.presenceState());
      }
    });

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      if (callbacks.onJoin) {
        callbacks.onJoin(newPresences);
      }
    });

    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      if (callbacks.onLeave) {
        callbacks.onLeave(leftPresences);
      }
    });

    this.subscriptions.set(id, subscription);
    this.metrics.totalChannels++;

    try {
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          subscription.isActive = true;
          this.updateActiveChannelCount();
          
          // Track presence data
          await channel.track(presenceData);
          
          console.log(`✅ Subscribed to presence: ${channelName} with ID: ${id}`);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          subscription.isActive = false;
          this.updateActiveChannelCount();
          console.error(`❌ Presence subscription failed for ${channelName}: ${status}`);
        }
      });
    } catch (error) {
      console.error(`❌ Failed to subscribe to presence ${channelName}:`, error);
      this.subscriptions.delete(id);
      this.metrics.totalChannels--;
      throw error;
    }

    return id;
  }

  public async updatePresence(channelId: string, presenceData: any): Promise<void> {
    const subscription = this.subscriptions.get(channelId);
    if (!subscription || subscription.type !== 'presence') {
      throw new Error(`No presence subscription found with ID: ${channelId}`);
    }

    try {
      await subscription.channel.track(presenceData);
    } catch (error) {
      console.error(`❌ Failed to update presence for ${channelId}:`, error);
      throw error;
    }
  }

  public unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      console.warn(`⚠️ No subscription found with ID: ${subscriptionId}`);
      return;
    }

    try {
      subscription.channel.unsubscribe();
      this.subscriptions.delete(subscriptionId);
      this.metrics.totalChannels--;
      this.updateActiveChannelCount();
      console.log(`🗑️ Unsubscribed from: ${subscriptionId}`);
    } catch (error) {
      console.error(`❌ Error unsubscribing from ${subscriptionId}:`, error);
    }
  }

  public unsubscribeAll(): void {
    console.log('🗑️ Unsubscribing from all channels...');
    for (const subscriptionId of this.subscriptions.keys()) {
      this.unsubscribe(subscriptionId);
    }
  }

  public getSubscription(subscriptionId: string): ChannelSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  public getAllSubscriptions(): ChannelSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  public getMetrics(): ChannelMetrics {
    return { ...this.metrics };
  }

  public getChannelHealth(): {
    subscriptionId: string;
    isActive: boolean;
    lastActivity?: Date;
    connectionAttempts: number;
    age: number; // in minutes
  }[] {
    const now = new Date();
    return Array.from(this.subscriptions.values()).map((sub) => ({
      subscriptionId: sub.id,
      isActive: sub.isActive,
      lastActivity: sub.lastActivity,
      connectionAttempts: sub.connectionAttempts,
      age: (now.getTime() - sub.createdAt.getTime()) / (1000 * 60),
    }));
  }

  public dispose(): void {
    this.unsubscribeAll();
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// Export singleton instance
export const channelManager = new RealtimeChannelManager();

// Export types and utilities
export type { ChannelSubscription, ChannelMetrics };

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    channelManager.dispose();
  });
} 
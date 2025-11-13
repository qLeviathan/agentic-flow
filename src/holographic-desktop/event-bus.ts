/**
 * Holographic Desktop Event Bus
 *
 * Central event bus for AURELIA system communication.
 * Implements pub/sub pattern with event replay for debugging.
 *
 * @module EventBus
 * @author AURELIA Integration Team
 */

import {
  AureliaEvent,
  AureliaEventType,
  SystemComponent,
  EventReplayEntry,
  AureliaState,
} from './types';

/**
 * Event listener callback type
 */
export type EventListener<T = any> = (event: AureliaEvent<T>) => void | Promise<void>;

/**
 * Event filter function
 */
export type EventFilter = (event: AureliaEvent) => boolean;

/**
 * Central Event Bus for AURELIA System
 */
export class AureliaEventBus {
  private listeners: Map<AureliaEventType, Set<EventListener>>;
  private globalListeners: Set<EventListener>;
  private replayBuffer: EventReplayEntry[];
  private maxReplayBufferSize: number;
  private enableReplay: boolean;
  private eventCount: number = 0;
  private startTime: number;

  constructor(config: { maxReplayBufferSize?: number; enableReplay?: boolean } = {}) {
    this.listeners = new Map();
    this.globalListeners = new Set();
    this.replayBuffer = [];
    this.maxReplayBufferSize = config.maxReplayBufferSize || 1000;
    this.enableReplay = config.enableReplay !== false;
    this.startTime = Date.now();

    console.log('✓ AURELIA Event Bus initialized');
  }

  /**
   * Subscribe to specific event type
   */
  on<T = any>(eventType: AureliaEventType, listener: EventListener<T>): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(listener as EventListener);

    // Return unsubscribe function
    return () => {
      this.off(eventType, listener);
    };
  }

  /**
   * Subscribe to all events
   */
  onAll(listener: EventListener): () => void {
    this.globalListeners.add(listener);

    return () => {
      this.globalListeners.delete(listener);
    };
  }

  /**
   * Unsubscribe from event type
   */
  off<T = any>(eventType: AureliaEventType, listener: EventListener<T>): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener as EventListener);
    }
  }

  /**
   * Subscribe to event once (auto-unsubscribe after first event)
   */
  once<T = any>(eventType: AureliaEventType, listener: EventListener<T>): () => void {
    const wrappedListener: EventListener<T> = async (event) => {
      this.off(eventType, wrappedListener);
      await listener(event);
    };

    return this.on(eventType, wrappedListener);
  }

  /**
   * Emit event to all subscribers
   */
  async emit<T = any>(
    type: AureliaEventType,
    source: SystemComponent,
    payload: T,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    metadata?: Record<string, any>
  ): Promise<void> {
    const event: AureliaEvent<T> = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      source,
      payload,
      priority,
      metadata,
    };

    this.eventCount++;

    const startProcessing = performance.now();
    let result: 'success' | 'failure' | 'partial' = 'success';
    let errorMessage: string | undefined;

    try {
      // Emit to type-specific listeners
      const typeListeners = this.listeners.get(type);
      if (typeListeners) {
        const promises = Array.from(typeListeners).map((listener) =>
          Promise.resolve(listener(event)).catch((error) => {
            console.error(`Error in ${type} listener:`, error);
            result = 'partial';
            errorMessage = error.message;
          })
        );
        await Promise.all(promises);
      }

      // Emit to global listeners
      const globalPromises = Array.from(this.globalListeners).map((listener) =>
        Promise.resolve(listener(event)).catch((error) => {
          console.error('Error in global listener:', error);
          result = 'partial';
          errorMessage = error.message;
        })
      );
      await Promise.all(globalPromises);
    } catch (error: any) {
      result = 'failure';
      errorMessage = error.message;
      console.error('Critical error in event emission:', error);
    }

    const processingTime = performance.now() - startProcessing;

    // Store in replay buffer
    if (this.enableReplay) {
      this.addToReplayBuffer({
        event,
        processingTime,
        result,
        error: errorMessage,
        stateSnapshot: {}, // Can be populated with state if needed
      });
    }

    // Log slow events
    if (processingTime > 100) {
      console.warn(`Slow event processing: ${type} took ${processingTime.toFixed(2)}ms`);
    }
  }

  /**
   * Filter and emit events based on condition
   */
  async emitConditional<T = any>(
    type: AureliaEventType,
    source: SystemComponent,
    payload: T,
    filter: EventFilter,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<void> {
    const event: AureliaEvent<T> = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      source,
      payload,
      priority,
    };

    if (filter(event)) {
      await this.emit(type, source, payload, priority);
    }
  }

  /**
   * Batch emit multiple events
   */
  async emitBatch(events: Array<{
    type: AureliaEventType;
    source: SystemComponent;
    payload: any;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }>): Promise<void> {
    const promises = events.map((e) =>
      this.emit(e.type, e.source, e.payload, e.priority)
    );
    await Promise.all(promises);
  }

  /**
   * Get event statistics
   */
  getStats(): {
    totalEvents: number;
    eventsPerSecond: number;
    listenerCount: number;
    replayBufferSize: number;
    uptimeMs: number;
  } {
    const uptime = Date.now() - this.startTime;
    return {
      totalEvents: this.eventCount,
      eventsPerSecond: (this.eventCount / uptime) * 1000,
      listenerCount: this.getTotalListenerCount(),
      replayBufferSize: this.replayBuffer.length,
      uptimeMs: uptime,
    };
  }

  /**
   * Get total listener count
   */
  private getTotalListenerCount(): number {
    let count = this.globalListeners.size;
    for (const listeners of this.listeners.values()) {
      count += listeners.size;
    }
    return count;
  }

  /**
   * Get replay buffer for debugging
   */
  getReplayBuffer(
    filter?: {
      eventType?: AureliaEventType;
      source?: SystemComponent;
      startTime?: number;
      endTime?: number;
      result?: 'success' | 'failure' | 'partial';
    }
  ): EventReplayEntry[] {
    let buffer = this.replayBuffer;

    if (filter) {
      buffer = buffer.filter((entry) => {
        if (filter.eventType && entry.event.type !== filter.eventType) return false;
        if (filter.source && entry.event.source !== filter.source) return false;
        if (filter.startTime && entry.event.timestamp < filter.startTime) return false;
        if (filter.endTime && entry.event.timestamp > filter.endTime) return false;
        if (filter.result && entry.result !== filter.result) return false;
        return true;
      });
    }

    return buffer;
  }

  /**
   * Replay events from buffer (for debugging/recovery)
   */
  async replayEvents(
    filter?: {
      eventType?: AureliaEventType;
      startTime?: number;
      endTime?: number;
    }
  ): Promise<void> {
    const eventsToReplay = this.getReplayBuffer(filter);

    console.log(`Replaying ${eventsToReplay.length} events...`);

    for (const entry of eventsToReplay) {
      const { event } = entry;
      await this.emit(
        event.type,
        event.source,
        event.payload,
        event.priority,
        event.metadata
      );
    }

    console.log(`✓ Replayed ${eventsToReplay.length} events`);
  }

  /**
   * Add event to replay buffer
   */
  private addToReplayBuffer(entry: EventReplayEntry): void {
    this.replayBuffer.push(entry);

    // Maintain buffer size limit
    if (this.replayBuffer.length > this.maxReplayBufferSize) {
      this.replayBuffer.shift();
    }
  }

  /**
   * Clear replay buffer
   */
  clearReplayBuffer(): void {
    this.replayBuffer = [];
    console.log('✓ Replay buffer cleared');
  }

  /**
   * Get events by type from replay buffer
   */
  getEventsByType(eventType: AureliaEventType, limit?: number): AureliaEvent[] {
    const events = this.replayBuffer
      .filter((entry) => entry.event.type === eventType)
      .map((entry) => entry.event);

    return limit ? events.slice(-limit) : events;
  }

  /**
   * Get recent errors from replay buffer
   */
  getRecentErrors(limit: number = 10): EventReplayEntry[] {
    return this.replayBuffer
      .filter((entry) => entry.result === 'failure' || entry.result === 'partial')
      .slice(-limit);
  }

  /**
   * Subscribe to multiple event types
   */
  onMany(eventTypes: AureliaEventType[], listener: EventListener): () => void {
    const unsubscribers = eventTypes.map((type) => this.on(type, listener));

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }

  /**
   * Wait for specific event (Promise-based)
   */
  waitFor<T = any>(
    eventType: AureliaEventType,
    timeout?: number,
    filter?: EventFilter
  ): Promise<AureliaEvent<T>> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined;

      const listener: EventListener<T> = (event) => {
        if (filter && !filter(event)) {
          return;
        }

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        this.off(eventType, listener);
        resolve(event);
      };

      this.on(eventType, listener);

      if (timeout) {
        timeoutId = setTimeout(() => {
          this.off(eventType, listener);
          reject(new Error(`Timeout waiting for event: ${eventType}`));
        }, timeout);
      }
    });
  }

  /**
   * Enable/disable event replay
   */
  setReplayEnabled(enabled: boolean): void {
    this.enableReplay = enabled;
    if (!enabled) {
      this.clearReplayBuffer();
    }
  }

  /**
   * Get listener count for specific event type
   */
  getListenerCount(eventType: AureliaEventType): number {
    return this.listeners.get(eventType)?.size || 0;
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(eventType?: AureliaEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
      this.globalListeners.clear();
    }
  }

  /**
   * Cleanup and shutdown
   */
  destroy(): void {
    this.removeAllListeners();
    this.clearReplayBuffer();
    console.log('✓ Event Bus destroyed');
  }
}

/**
 * Export singleton instance
 */
export const eventBus = new AureliaEventBus({
  maxReplayBufferSize: 1000,
  enableReplay: true,
});

export default eventBus;

/**
 * AURELIA Bridge Service
 *
 * Bridge between Tauri frontend and AURELIA backend.
 * Handles real-time updates via WebSocket/IPC and state synchronization.
 *
 * @module AureliaBridge
 * @author AURELIA Integration Team
 */

import { invoke } from '@tauri-apps/api/tauri';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

/**
 * Type definitions matching backend
 */
export interface ConsciousnessState {
  timestamp: number;
  psi: {
    psi: number;
    threshold: number;
    isConscious: boolean;
    graphDiameter: number;
    meetsThreshold: boolean;
  };
  subsystems: {
    vpe: SubsystemState;
    sic: SubsystemState;
    cs: SubsystemState;
  };
  phaseSpace: PhaseSpacePoint;
  wordCount: number;
  isBootstrapped: boolean;
}

export interface SubsystemState {
  name: string;
  active: boolean;
  coherence: number;
  processingLoad: number;
  lastUpdate: number;
}

export interface PhaseSpacePoint {
  phi: number;
  psi: number;
  theta: number;
  magnitude: number;
  isNashPoint: boolean;
}

export interface TradingStrategy {
  strategyId: string;
  currentPosition: 'long' | 'short' | 'neutral';
  confidence: number;
  nashEquilibrium: boolean;
  phaseSpaceRegion: 'stable' | 'volatile' | 'transitioning';
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical' | 'offline';
  consciousnessMetric: number;
  graphDiameter: number;
  nashEquilibriumActive: boolean;
  timestamp: number;
}

export interface AureliaSessionInfo {
  sessionId: string;
  startTime: number;
  eventCount: number;
  averageLatency: number;
  throughput: number;
}

/**
 * Event payload types
 */
export interface ConsciousnessUpdateEvent {
  state: ConsciousnessState;
  psiDelta: number;
  thresholdMet: boolean;
}

export interface NashDetectedEvent {
  confidence: number;
  position: 'long' | 'short' | 'neutral';
  reason: string;
}

export interface MarketUpdateEvent {
  price: number;
  volume: number;
  volatility: number;
  rsi: number;
  timestamp: number;
}

export interface SystemAlertEvent {
  severity: 'info' | 'warning' | 'error' | 'critical';
  component: string;
  message: string;
  timestamp: number;
}

/**
 * AURELIA Bridge Service
 */
export class AureliaBridge {
  private listeners: Map<string, UnlistenFn> = new Map();
  private sessionId?: string;
  private isInitialized: boolean = false;

  /**
   * Initialize AURELIA backend systems
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing AURELIA backend...');
      await invoke('aurelia_initialize');
      this.isInitialized = true;
      console.log('✓ AURELIA backend initialized');
    } catch (error) {
      console.error('Failed to initialize AURELIA:', error);
      throw error;
    }
  }

  /**
   * Start holographic session
   */
  async startSession(userId?: string): Promise<string> {
    try {
      this.sessionId = await invoke<string>('aurelia_start_session', {
        userId,
      });
      console.log(`✓ Session started: ${this.sessionId}`);
      return this.sessionId;
    } catch (error) {
      console.error('Failed to start session:', error);
      throw error;
    }
  }

  /**
   * End current session
   */
  async endSession(): Promise<void> {
    try {
      await invoke('aurelia_end_session');
      this.sessionId = undefined;
      console.log('✓ Session ended');
    } catch (error) {
      console.error('Failed to end session:', error);
      throw error;
    }
  }

  /**
   * Interact with AURELIA consciousness
   */
  async interact(input: string): Promise<string> {
    try {
      const response = await invoke<string>('aurelia_interact', { input });
      return response;
    } catch (error) {
      console.error('Failed to interact:', error);
      throw error;
    }
  }

  /**
   * Get consciousness state
   */
  async getConsciousnessState(): Promise<ConsciousnessState> {
    try {
      return await invoke<ConsciousnessState>('aurelia_get_consciousness_state');
    } catch (error) {
      console.error('Failed to get consciousness state:', error);
      throw error;
    }
  }

  /**
   * Get trading strategy
   */
  async getTradingStrategy(): Promise<TradingStrategy> {
    try {
      return await invoke<TradingStrategy>('aurelia_get_trading_strategy');
    } catch (error) {
      console.error('Failed to get trading strategy:', error);
      throw error;
    }
  }

  /**
   * Process market update
   */
  async processMarketUpdate(marketData: {
    price: number;
    volume: number;
    volatility: number;
    rsi: number;
    macd: number;
    bollinger: number;
  }): Promise<void> {
    try {
      await invoke('aurelia_process_market_update', { marketData });
    } catch (error) {
      console.error('Failed to process market update:', error);
      throw error;
    }
  }

  /**
   * Get system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    try {
      return await invoke<SystemHealth>('aurelia_get_system_health');
    } catch (error) {
      console.error('Failed to get system health:', error);
      throw error;
    }
  }

  /**
   * Get session info
   */
  async getSessionInfo(): Promise<AureliaSessionInfo> {
    try {
      return await invoke<AureliaSessionInfo>('aurelia_get_session_info');
    } catch (error) {
      console.error('Failed to get session info:', error);
      throw error;
    }
  }

  /**
   * Generate insight
   */
  async generateInsight(
    category: 'market' | 'pattern' | 'anomaly' | 'opportunity',
    description: string,
    confidence: number
  ): Promise<void> {
    try {
      await invoke('aurelia_generate_insight', {
        category,
        description,
        confidence,
      });
    } catch (error) {
      console.error('Failed to generate insight:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<{
    avgEventProcessingTime: number;
    eventsPerSecond: number;
    memoryUsageMB: number;
    overallHealth: string;
  }> {
    try {
      return await invoke('aurelia_get_performance_metrics');
    } catch (error) {
      console.error('Failed to get performance metrics:', error);
      throw error;
    }
  }

  /**
   * Subscribe to consciousness updates
   */
  async onConsciousnessUpdate(
    callback: (event: ConsciousnessUpdateEvent) => void
  ): Promise<UnlistenFn> {
    const unlisten = await listen<ConsciousnessUpdateEvent>(
      'consciousness-update',
      (event) => {
        callback(event.payload);
      }
    );

    this.listeners.set('consciousness-update', unlisten);
    return unlisten;
  }

  /**
   * Subscribe to Nash equilibrium detections
   */
  async onNashDetected(
    callback: (event: NashDetectedEvent) => void
  ): Promise<UnlistenFn> {
    const unlisten = await listen<NashDetectedEvent>(
      'nash-detected',
      (event) => {
        callback(event.payload);
      }
    );

    this.listeners.set('nash-detected', unlisten);
    return unlisten;
  }

  /**
   * Subscribe to market updates
   */
  async onMarketUpdate(
    callback: (event: MarketUpdateEvent) => void
  ): Promise<UnlistenFn> {
    const unlisten = await listen<MarketUpdateEvent>(
      'market-update',
      (event) => {
        callback(event.payload);
      }
    );

    this.listeners.set('market-update', unlisten);
    return unlisten;
  }

  /**
   * Subscribe to system alerts
   */
  async onSystemAlert(
    callback: (event: SystemAlertEvent) => void
  ): Promise<UnlistenFn> {
    const unlisten = await listen<SystemAlertEvent>(
      'system-alert',
      (event) => {
        callback(event.payload);
      }
    );

    this.listeners.set('system-alert', unlisten);
    return unlisten;
  }

  /**
   * Validate memory integrity
   */
  async validateMemory(sessionId: string): Promise<boolean> {
    try {
      return await invoke<boolean>('aurelia_validate_memory', { sessionId });
    } catch (error) {
      console.error('Failed to validate memory:', error);
      throw error;
    }
  }

  /**
   * Save session state
   */
  async saveSession(): Promise<void> {
    try {
      await invoke('aurelia_save_session');
      console.log('✓ Session saved');
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    }
  }

  /**
   * Restore session state
   */
  async restoreSession(sessionId: string): Promise<void> {
    try {
      await invoke('aurelia_restore_session', { sessionId });
      this.sessionId = sessionId;
      console.log(`✓ Session restored: ${sessionId}`);
    } catch (error) {
      console.error('Failed to restore session:', error);
      throw error;
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<SystemAlertEvent[]> {
    try {
      return await invoke<SystemAlertEvent[]>('aurelia_get_active_alerts');
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      throw error;
    }
  }

  /**
   * Clear all event listeners
   */
  clearListeners(): void {
    this.listeners.forEach((unlisten) => unlisten());
    this.listeners.clear();
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | undefined {
    return this.sessionId;
  }

  /**
   * Cleanup and disconnect
   */
  async destroy(): Promise<void> {
    this.clearListeners();

    if (this.sessionId) {
      await this.endSession();
    }

    console.log('✓ AURELIA bridge destroyed');
  }
}

/**
 * Export singleton instance
 */
export const aureliaBridge = new AureliaBridge();

export default aureliaBridge;

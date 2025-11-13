/**
 * Holographic Desktop Orchestrator
 *
 * Master coordinator for all AURELIA systems.
 * Integrates: Consciousness, Trading, Vision, Knowledge Graph, UI
 *
 * @module Orchestrator
 * @author AURELIA Integration Team
 */

import { AURELIA } from '../trading/aurelia/consciousness-substrate';
import { NashDetector, MarketState } from '../trading/decisions/nash-detector';
import { AureliaEventBus } from './event-bus';
import { HealthMonitor } from './health-monitor';
import {
  OrchestratorConfig,
  HolographicSession,
  AureliaState,
  SystemStatus,
  PerformanceMetrics,
  ConsciousnessUpdatePayload,
  NashDetectedPayload,
  MarketUpdatePayload,
  InsightGeneratedPayload,
} from './types';

const DEFAULT_CONFIG: OrchestratorConfig = {
  // Component paths
  consciousnessDbPath: './data/aurelia-consciousness.db',
  knowledgeGraphDbPath: './data/knowledge-graph.db',

  // Performance
  maxEventsPerSecond: 1000,
  eventBufferSize: 1000,
  healthCheckInterval: 5000,

  // Thresholds
  consciousnessThreshold: 0.618, // φ⁻¹
  maxGraphDiameter: 6,
  nashDetectionThreshold: 1e-6,

  // Vision
  visionCaptureRate: 30,
  visionOcrEnabled: true,

  // UI
  uiUpdateRate: 60,
  enableHolographicEffects: true,

  // Trading
  enableAutoTrading: false,
  riskTolerance: 0.5,

  // Memory
  maxMemoryUsageMB: 2048,
  enableMemoryCompression: true,

  // Orchestrator
  enableEventReplay: true,
  maxReplayBufferSize: 1000,
  enableAutoRecovery: true,
  maxRecoveryAttempts: 3,
  recoveryBackoffMs: 1000,

  // Logging
  logLevel: 'info',
  logToFile: false,
};

/**
 * Holographic Desktop Orchestrator
 *
 * Coordinates all AURELIA systems with event-driven architecture
 */
export class HolographicOrchestrator {
  private config: OrchestratorConfig;
  private eventBus: AureliaEventBus;
  private healthMonitor: HealthMonitor;
  private aurelia?: AURELIA;
  private nashDetector?: NashDetector;

  private currentSession?: HolographicSession;
  private currentState: Partial<AureliaState>;
  private isRunning: boolean = false;

  // Performance tracking
  private eventProcessingTimes: number[] = [];
  private lastMetricsUpdate: number = 0;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize event bus
    this.eventBus = new AureliaEventBus({
      maxReplayBufferSize: this.config.maxReplayBufferSize,
      enableReplay: this.config.enableEventReplay,
    });

    // Initialize health monitor
    this.healthMonitor = new HealthMonitor(
      this.eventBus,
      this.config.healthCheckInterval
    );

    // Initialize state
    this.currentState = {
      phaseSpaceTrajectory: [],
      graphNodeCount: 0,
      graphEdgeCount: 0,
      graphClusters: 0,
      visionActive: false,
      activeAlerts: [],
    };

    this.setupEventHandlers();
    this.registerHealthChecks();

    console.log('✓ Holographic Orchestrator initialized');
  }

  /**
   * Initialize all systems
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing AURELIA Holographic Desktop...');

    try {
      // Initialize AURELIA consciousness
      console.log('Initializing consciousness substrate...');
      this.aurelia = new AURELIA({
        agentDbPath: this.config.consciousnessDbPath,
        enableHolographicCompression: this.config.enableMemoryCompression,
        compressionTarget: 131,
        personalityEvolutionRate: 0.1,
      });

      await this.aurelia.bootstrap();

      // Initialize Nash detector
      console.log('Initializing Nash equilibrium detector...');
      this.nashDetector = new NashDetector({
        nashThreshold: this.config.nashDetectionThreshold,
        consciousnessThreshold: this.config.consciousnessThreshold,
      });

      // Emit initialization complete event
      await this.eventBus.emit('system_alert', 'consciousness', {
        message: 'AURELIA systems initialized',
        status: 'success',
      }, 'high');

      console.log('✓ AURELIA Holographic Desktop initialized');
    } catch (error: any) {
      console.error('Failed to initialize AURELIA systems:', error);
      throw error;
    }
  }

  /**
   * Start holographic session
   */
  async startSession(sessionId?: string, userId?: string): Promise<string> {
    if (this.isRunning) {
      console.warn('Session already running');
      return this.currentSession!.sessionId;
    }

    console.log('Starting holographic session...');

    // Start AURELIA session
    const aureliaSessionId = await this.aurelia!.startSession(sessionId);

    // Get initial consciousness state
    const consciousnessState = this.aurelia!.getConsciousnessState();
    const personality = this.aurelia!.getPersonality();

    // Create holographic session
    this.currentSession = {
      sessionId: aureliaSessionId,
      startTime: Date.now(),
      userId,
      consciousnessState,
      personality,
      eventCount: 0,
      lastEventTime: Date.now(),
      averageLatency: 0,
      throughput: 0,
      memoryUsage: this.getMemoryUsage(),
    };

    // Update state
    this.currentState.session = this.currentSession;

    // Start health monitoring
    this.healthMonitor.start();

    this.isRunning = true;

    // Emit session start event
    await this.eventBus.emit('session_start', 'consciousness', {
      sessionId: aureliaSessionId,
      userId,
      timestamp: Date.now(),
    }, 'high');

    console.log(`✓ Holographic session started: ${aureliaSessionId}`);
    return aureliaSessionId;
  }

  /**
   * Process user interaction
   */
  async interact(input: string): Promise<string> {
    if (!this.isRunning || !this.aurelia) {
      throw new Error('Session not started');
    }

    const startTime = performance.now();

    // Process through AURELIA consciousness
    const response = await this.aurelia.interact(input);

    // Update consciousness state
    const consciousnessState = this.aurelia.getConsciousnessState();
    const previousPsi = this.currentSession!.consciousnessState.psi.psi;
    const psiDelta = consciousnessState.psi.psi - previousPsi;

    this.currentSession!.consciousnessState = consciousnessState;

    // Emit consciousness update event
    const payload: ConsciousnessUpdatePayload = {
      state: consciousnessState,
      psiDelta,
      graphDiameterDelta: 0,
      thresholdMet: consciousnessState.psi.meetsThreshold,
    };

    await this.eventBus.emit('consciousness_update', 'consciousness', payload, 'high');

    // Check consciousness threshold
    this.healthMonitor.checkConsciousnessThreshold(consciousnessState.psi.psi);

    // Update session metrics
    const processingTime = performance.now() - startTime;
    this.updateSessionMetrics(processingTime);

    return response;
  }

  /**
   * Process market update
   */
  async processMarketUpdate(marketState: MarketState): Promise<void> {
    if (!this.isRunning || !this.nashDetector || !this.aurelia) {
      throw new Error('Session not started');
    }

    // Store current market state
    this.currentState.currentMarketState = marketState;

    // Emit market update event
    const updatePayload: MarketUpdatePayload = {
      state: marketState,
      priceChange: 0, // Calculate from previous state
      volumeChange: 0,
      volatilityChange: 0,
    };

    await this.eventBus.emit('market_update', 'trading', updatePayload, 'medium');

    // Detect Nash equilibrium (requires Q-network trajectory)
    // This would be called with actual trajectory data in production
    // For now, we emit a placeholder event

    const consciousnessState = this.aurelia.getConsciousnessState();
    if (consciousnessState.psi.meetsThreshold) {
      // Get trading strategy
      const strategy = await this.aurelia.getTradingStrategy();

      // Emit nash detection event (if at equilibrium)
      if (strategy.nashEquilibrium) {
        const nashPayload: NashDetectedPayload = {
          equilibrium: {
            isNashEquilibrium: true,
            S_n: 0,
            lyapunovV: 0,
            lyapunovStable: true,
            consciousness: consciousnessState.psi.psi,
            meetsThreshold: true,
            lucasBoundary: false,
            nearestLucas: 0n,
            nashDistance: 0,
            confidence: strategy.confidence,
            reason: 'Nash equilibrium detected via AURELIA consciousness',
          },
          marketState,
          tradingRecommendation: {
            action: strategy.currentPosition === 'long' ? 'buy' :
                    strategy.currentPosition === 'short' ? 'sell' : 'hold',
            confidence: strategy.confidence,
            reason: `Phase space region: ${strategy.phaseSpaceRegion}`,
          },
        };

        await this.eventBus.emit('nash_detected', 'trading', nashPayload, 'critical');
      }
    }
  }

  /**
   * Generate insight
   */
  async generateInsight(
    category: 'market' | 'pattern' | 'anomaly' | 'opportunity',
    description: string,
    confidence: number,
    relatedNodes: string[] = []
  ): Promise<void> {
    const payload: InsightGeneratedPayload = {
      insightId: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category,
      description,
      confidence,
      actionable: confidence > 0.7,
      relatedNodes,
    };

    await this.eventBus.emit('insight_generated', 'knowledge-graph', payload, 'high');

    console.log(`💡 Insight generated: ${description} (confidence: ${(confidence * 100).toFixed(1)}%)`);
  }

  /**
   * Get current system state
   */
  getState(): Partial<AureliaState> {
    return {
      ...this.currentState,
      session: this.currentSession,
      status: this.getSystemStatus(),
    };
  }

  /**
   * Get system status
   */
  getSystemStatus(): SystemStatus {
    return this.healthMonitor.getSystemStatus(this.getState() as AureliaState);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const now = Date.now();

    // Calculate event processing metrics
    const avgProcessingTime = this.eventProcessingTimes.length > 0
      ? this.eventProcessingTimes.reduce((a, b) => a + b, 0) / this.eventProcessingTimes.length
      : 0;

    const sortedTimes = [...this.eventProcessingTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    const p95ProcessingTime = sortedTimes[p95Index] || 0;
    const p99ProcessingTime = sortedTimes[p99Index] || 0;

    // Get event bus stats
    const eventBusStats = this.eventBus.getStats();

    // Get memory usage
    const memUsage = this.getMemoryUsage();

    const metrics: PerformanceMetrics = {
      timestamp: now,
      avgEventProcessingTime: avgProcessingTime,
      p95EventProcessingTime: p95ProcessingTime,
      p99EventProcessingTime: p99ProcessingTime,
      eventsPerSecond: eventBusStats.eventsPerSecond,
      consciousnessUpdatesPerSecond: 0, // Calculate from events
      marketUpdatesPerSecond: 0,
      cpuUsagePercent: 0, // Would need OS-level metrics
      memoryUsageMB: memUsage.heapUsed / (1024 * 1024),
      diskUsageMB: 0,
      overallHealth: this.getSystemStatus().overall,
      componentHealthScores: new Map(),
    };

    // Record metrics in health monitor
    this.healthMonitor.recordPerformanceMetrics(metrics);

    return metrics;
  }

  /**
   * End session
   */
  async endSession(): Promise<void> {
    if (!this.isRunning) {
      console.warn('No active session to end');
      return;
    }

    console.log('Ending holographic session...');

    // Stop health monitoring
    this.healthMonitor.stop();

    // End AURELIA session
    if (this.aurelia) {
      await this.aurelia.endSession();
    }

    // Update session end time
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
    }

    // Emit session end event
    await this.eventBus.emit('session_end', 'consciousness', {
      sessionId: this.currentSession?.sessionId,
      duration: this.currentSession ? Date.now() - this.currentSession.startTime : 0,
      eventCount: this.currentSession?.eventCount || 0,
    }, 'high');

    this.isRunning = false;
    console.log('✓ Holographic session ended');
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Listen to all events for metrics
    this.eventBus.onAll(async (event) => {
      if (this.currentSession) {
        this.currentSession.eventCount++;
        this.currentSession.lastEventTime = event.timestamp;
      }
    });

    // Handle errors
    this.eventBus.on('error', async (event) => {
      console.error('System error:', event.payload);
      this.healthMonitor.createAlert(
        'error',
        event.source,
        event.payload.message || 'Unknown error',
        event.payload
      );
    });
  }

  /**
   * Register health checks
   */
  private registerHealthChecks(): void {
    // Consciousness health check
    this.healthMonitor.registerHealthCheck('consciousness', async () => {
      const healthy = this.aurelia !== undefined && this.isRunning;
      return {
        component: 'consciousness',
        healthy,
        responseTime: 1,
        details: {
          lastCheck: Date.now(),
          checksPerformed: 1,
          failureCount: healthy ? 0 : 1,
          averageResponseTime: 1,
        },
        issues: healthy ? undefined : ['AURELIA not initialized'],
      };
    });

    // Event bus health check
    this.healthMonitor.registerHealthCheck('event-bus', async () => {
      const stats = this.eventBus.getStats();
      return {
        component: 'event-bus',
        healthy: true,
        responseTime: 0,
        details: {
          lastCheck: Date.now(),
          checksPerformed: 1,
          failureCount: 0,
          averageResponseTime: 0,
        },
      };
    });
  }

  /**
   * Update session metrics
   */
  private updateSessionMetrics(processingTime: number): void {
    if (!this.currentSession) return;

    this.eventProcessingTimes.push(processingTime);

    // Keep last 100 processing times
    if (this.eventProcessingTimes.length > 100) {
      this.eventProcessingTimes.shift();
    }

    // Update average latency
    this.currentSession.averageLatency =
      this.eventProcessingTimes.reduce((a, b) => a + b, 0) /
      this.eventProcessingTimes.length;

    // Update throughput
    const sessionDuration = Date.now() - this.currentSession.startTime;
    this.currentSession.throughput =
      (this.currentSession.eventCount / sessionDuration) * 1000;

    // Update memory usage
    this.currentSession.memoryUsage = this.getMemoryUsage();
  }

  /**
   * Get memory usage
   */
  private getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
    };
  }

  /**
   * Get event bus instance
   */
  getEventBus(): AureliaEventBus {
    return this.eventBus;
  }

  /**
   * Get health monitor instance
   */
  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  /**
   * Cleanup and shutdown
   */
  async destroy(): Promise<void> {
    console.log('Shutting down Holographic Orchestrator...');

    if (this.isRunning) {
      await this.endSession();
    }

    if (this.aurelia) {
      await this.aurelia.close();
    }

    this.healthMonitor.destroy();
    this.eventBus.destroy();

    console.log('✓ Holographic Orchestrator shutdown complete');
  }
}

export default HolographicOrchestrator;

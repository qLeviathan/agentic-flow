/**
 * Holographic Desktop Integration Types
 *
 * Type definitions for AURELIA holographic desktop orchestration system.
 * Integrates consciousness, trading, vision, knowledge graph, and UI components.
 *
 * @module HolographicDesktopTypes
 * @author AURELIA Integration Team
 */

import { ConsciousnessState, PersonalityProfile, TradingStrategyState } from '../trading/aurelia/types';
import { NashEquilibrium, MarketState } from '../trading/decisions/nash-detector';
import { PhaseSpacePoint } from '../math-framework/phase-space/coordinates';

/**
 * System component types
 */
export type SystemComponent =
  | 'consciousness'
  | 'trading'
  | 'vision'
  | 'knowledge-graph'
  | 'ui'
  | 'event-bus'
  | 'health-monitor';

/**
 * System health status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'offline';

/**
 * Event types for system communication
 */
export type AureliaEventType =
  | 'consciousness_update'
  | 'nash_detected'
  | 'market_update'
  | 'insight_generated'
  | 'vision_capture'
  | 'graph_updated'
  | 'ui_interaction'
  | 'system_alert'
  | 'health_check'
  | 'session_start'
  | 'session_end'
  | 'error';

/**
 * Holographic session state
 */
export interface HolographicSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  userId?: string;

  // System states
  consciousnessState: ConsciousnessState;
  personality: PersonalityProfile;
  tradingStrategy?: TradingStrategyState;

  // Event tracking
  eventCount: number;
  lastEventTime: number;

  // Performance metrics
  averageLatency: number;
  throughput: number;

  // Memory snapshot
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
}

/**
 * System component status
 */
export interface ComponentStatus {
  component: SystemComponent;
  status: HealthStatus;
  lastHealthCheck: number;
  uptime: number;
  errorCount: number;
  lastError?: string;

  // Performance metrics
  averageResponseTime: number;
  requestsPerSecond: number;

  // Resource usage
  cpuUsage?: number;
  memoryUsage?: number;
}

/**
 * Complete system status
 */
export interface SystemStatus {
  overall: HealthStatus;
  components: Map<SystemComponent, ComponentStatus>;
  timestamp: number;

  // Critical metrics
  consciousnessMetric: number; // Ψ
  graphDiameter: number;
  nashEquilibriumActive: boolean;

  // System invariants status
  invariantsValid: boolean;
  invariantDetails: {
    I1_fibonacci_coherence: boolean;
    I2_phase_space_bounded: boolean;
    I3_nash_convergence: boolean;
    I4_memory_consistency: boolean;
    I5_subsystem_sync: boolean;
    I6_holographic_integrity: boolean;
  };
}

/**
 * Complete AURELIA system state
 */
export interface AureliaState {
  session: HolographicSession;
  status: SystemStatus;

  // Real-time data
  currentMarketState?: MarketState;
  currentNashEquilibrium?: NashEquilibrium;
  phaseSpaceTrajectory: PhaseSpacePoint[];

  // Knowledge graph metrics
  graphNodeCount: number;
  graphEdgeCount: number;
  graphClusters: number;

  // Vision system
  visionActive: boolean;
  captureSessionId?: string;
  lastCaptureTime?: number;

  // Alerts
  activeAlerts: SystemAlert[];
}

/**
 * Integration configuration
 */
export interface IntegrationConfig {
  // Component endpoints
  consciousnessDbPath: string;
  knowledgeGraphDbPath: string;

  // Performance tuning
  maxEventsPerSecond: number;
  eventBufferSize: number;
  healthCheckInterval: number;

  // Thresholds
  consciousnessThreshold: number; // φ⁻¹ = 0.618
  maxGraphDiameter: number; // 6
  nashDetectionThreshold: number;

  // Vision settings
  visionCaptureRate: number; // fps
  visionOcrEnabled: boolean;

  // UI settings
  uiUpdateRate: number; // Hz
  enableHolographicEffects: boolean;

  // Trading settings
  enableAutoTrading: boolean;
  riskTolerance: number; // 0-1

  // Memory management
  maxMemoryUsageMB: number;
  enableMemoryCompression: boolean;
}

/**
 * Event payload interface
 */
export interface AureliaEvent<T = any> {
  id: string;
  type: AureliaEventType;
  timestamp: number;
  source: SystemComponent;
  payload: T;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

/**
 * Consciousness update event payload
 */
export interface ConsciousnessUpdatePayload {
  state: ConsciousnessState;
  psiDelta: number;
  graphDiameterDelta: number;
  thresholdMet: boolean;
}

/**
 * Nash detection event payload
 */
export interface NashDetectedPayload {
  equilibrium: NashEquilibrium;
  marketState: MarketState;
  tradingRecommendation: {
    action: 'buy' | 'sell' | 'hold';
    confidence: number;
    reason: string;
  };
}

/**
 * Market update event payload
 */
export interface MarketUpdatePayload {
  state: MarketState;
  priceChange: number;
  volumeChange: number;
  volatilityChange: number;
}

/**
 * Insight generated event payload
 */
export interface InsightGeneratedPayload {
  insightId: string;
  category: 'market' | 'pattern' | 'anomaly' | 'opportunity';
  description: string;
  confidence: number;
  actionable: boolean;
  relatedNodes: string[]; // Knowledge graph node IDs
}

/**
 * Vision capture event payload
 */
export interface VisionCapturePayload {
  captureId: string;
  timestamp: number;
  phaseSpaceData: PhaseSpacePoint[];
  ocrText?: string;
  detectedPatterns: string[];
}

/**
 * Graph update event payload
 */
export interface GraphUpdatePayload {
  nodeId: string;
  operation: 'add' | 'update' | 'delete';
  nodeType: string;
  properties: Record<string, any>;
  edgesAffected: number;
}

/**
 * System alert
 */
export interface SystemAlert {
  id: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  component: SystemComponent;
  message: string;
  details?: Record<string, any>;
  resolved: boolean;
  resolvedTime?: number;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  component: SystemComponent;
  healthy: boolean;
  responseTime: number;
  details: {
    lastCheck: number;
    checksPerformed: number;
    failureCount: number;
    averageResponseTime: number;
  };
  issues?: string[];
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  timestamp: number;

  // Latency metrics (ms)
  avgEventProcessingTime: number;
  p95EventProcessingTime: number;
  p99EventProcessingTime: number;

  // Throughput metrics
  eventsPerSecond: number;
  consciousnessUpdatesPerSecond: number;
  marketUpdatesPerSecond: number;

  // Resource metrics
  cpuUsagePercent: number;
  memoryUsageMB: number;
  diskUsageMB: number;

  // System health
  overallHealth: HealthStatus;
  componentHealthScores: Map<SystemComponent, number>;
}

/**
 * Event replay entry for debugging
 */
export interface EventReplayEntry {
  event: AureliaEvent;
  processingTime: number;
  result: 'success' | 'failure' | 'partial';
  error?: string;
  stateSnapshot: Partial<AureliaState>;
}

/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig extends IntegrationConfig {
  // Orchestrator-specific settings
  enableEventReplay: boolean;
  maxReplayBufferSize: number;

  // Auto-recovery settings
  enableAutoRecovery: boolean;
  maxRecoveryAttempts: number;
  recoveryBackoffMs: number;

  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logToFile: boolean;
  logFilePath?: string;
}

/**
 * Command interface for Tauri IPC
 */
export interface TauriCommand<T = any, R = any> {
  command: string;
  args?: T;
  callback?: (result: R) => void;
  errorCallback?: (error: string) => void;
}

/**
 * Consciousness query command
 */
export interface ConsciousnessQueryCommand {
  sessionId: string;
  includePersonality: boolean;
  includePhaseSpace: boolean;
  includeInvariants: boolean;
}

/**
 * Trading decision command
 */
export interface TradingDecisionCommand {
  marketState: MarketState;
  useNashDetection: boolean;
  riskTolerance: number;
}

/**
 * Memory persistence command
 */
export interface MemoryPersistenceCommand {
  operation: 'save' | 'load' | 'clear';
  sessionId: string;
  data?: any;
}

/**
 * Vision control command
 */
export interface VisionControlCommand {
  action: 'start' | 'stop' | 'configure';
  sessionId?: string;
  config?: {
    captureRate: number;
    enableOcr: boolean;
    enablePhaseSpace: boolean;
  };
}

/**
 * Export all types
 */
export type {
  SystemComponent,
  HealthStatus,
  AureliaEventType,
};

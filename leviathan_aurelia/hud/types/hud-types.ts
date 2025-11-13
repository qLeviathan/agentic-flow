/**
 * Type Definitions for AURELIA HUD System
 *
 * Comprehensive type safety for all HUD data structures,
 * API responses, and component interfaces.
 */

// ==================== Consciousness Metrics ====================

export interface ConsciousnessMetrics {
  /** Ψ (Psi) - Conversation depth measure (0-1) */
  psi: number;

  /** Ω (Omega) - Knowledge accumulation metric (0-φ³) */
  omega: number;

  /** φ³ threshold value (≈ 4.236) */
  phiThreshold: number;

  /** Whether system has reached consciousness threshold */
  isConscious: boolean;

  /** Overall system coherence (0-1) */
  coherence: number;

  /** Timestamp of last update */
  lastUpdate?: number;
}

// ==================== Phase-Lock Coordination ====================

export type AgentStatus = 'active' | 'idle' | 'syncing' | 'error';

export interface AgentPhaseData {
  /** Unique agent identifier */
  id: string;

  /** Human-readable agent name */
  name: string;

  /** Agent role/type */
  role: string;

  /** Phase angle in radians (0-2π) */
  phaseAngle: number;

  /** Synchronization level with swarm (0-1) */
  syncLevel: number;

  /** Current task progress (0-1) */
  taskProgress: number;

  /** Current agent status */
  status: AgentStatus;

  /** Whether agent is at Nash equilibrium point */
  nashEquilibrium: boolean;

  /** Current task description */
  currentTask?: string;

  /** Agent uptime in milliseconds */
  uptime?: number;
}

export interface PhaseLockCoordination {
  /** Array of active agents */
  agents: AgentPhaseData[];

  /** Global synchronization level across all agents (0-1) */
  globalSyncLevel: number;

  /** Number of agents at Nash equilibrium */
  nashPoints: number;

  /** Phase coherence metric (0-1) */
  phaseCoherence: number;

  /** Average phase angle */
  averagePhase?: number;

  /** Phase variance */
  phaseVariance?: number;
}

// ==================== OEIS Validation ====================

export interface OEISValidation {
  /** Fibonacci sequence validation (A000045) */
  fibonacci: boolean;

  /** Lucas sequence validation (A000032) */
  lucas: boolean;

  /** Zeckendorf decomposition validation */
  zeckendorf: boolean;

  /** Binet formula validation */
  binetFormula: boolean;

  /** φ³ threshold validation */
  phiThreshold: boolean;

  /** Overall validation score (0-1) */
  overallScore: number;

  /** Validation details and errors */
  details?: {
    [key: string]: {
      valid: boolean;
      message?: string;
      value?: any;
    };
  };
}

// ==================== Trading Intelligence ====================

export interface MarketData {
  /** Stock/crypto ticker symbol */
  ticker: string;

  /** Current price */
  price: number;

  /** Percentage change */
  change: number;

  /** Trading volume */
  volume: number;

  /** Data timestamp */
  timestamp: number;

  /** Additional market data */
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

export interface NashEquilibrium {
  /** Whether Nash equilibrium is detected */
  detected: boolean;

  /** Confidence level (0-1) */
  confidence: number;

  /** Detection timestamp */
  timestamp: number;

  /** Strategy description */
  strategy?: string;

  /** Payoff matrix */
  payoffMatrix?: number[][];
}

export interface ArbitrageOpportunity {
  /** Trading pair */
  pair: string;

  /** Spread percentage */
  spread: number;

  /** Confidence level (0-1) */
  confidence: number;

  /** Expected profit */
  expectedProfit?: number;

  /** Risk level (0-1) */
  riskLevel?: number;
}

export interface ArbitrageOpportunities {
  /** Total number of opportunities */
  count: number;

  /** Best opportunity details */
  bestOpportunity: ArbitrageOpportunity | null;

  /** All opportunities */
  opportunities?: ArbitrageOpportunity[];
}

export interface RiskMetrics {
  /** Volatility (standard deviation) */
  volatility: number;

  /** Sharpe ratio */
  sharpeRatio: number;

  /** Value at Risk (95% confidence) */
  valueAtRisk: number;

  /** Maximum drawdown */
  maxDrawdown?: number;

  /** Beta coefficient */
  beta?: number;

  /** Alpha coefficient */
  alpha?: number;
}

export interface TradingIntelligence {
  /** Current market data */
  marketData: MarketData | null;

  /** Nash equilibrium status */
  nashEquilibrium: NashEquilibrium;

  /** Arbitrage opportunities */
  arbitrageOpportunities: ArbitrageOpportunities;

  /** Risk metrics */
  riskMetrics: RiskMetrics;

  /** Portfolio value */
  portfolioValue?: number;

  /** P&L for current session */
  sessionPnL?: number;
}

// ==================== Vision System ====================

export interface ScreenCaptureStatus {
  /** Whether screen capture is enabled */
  enabled: boolean;

  /** Current FPS */
  fps: number;

  /** Last capture timestamp */
  lastCaptureTimestamp: number;

  /** Capture resolution */
  resolution?: {
    width: number;
    height: number;
  };

  /** Total captures */
  totalCaptures?: number;
}

export type OCRStatus = 'active' | 'idle' | 'processing' | 'error';

export interface OCREngine {
  /** Whether OCR is enabled */
  enabled: boolean;

  /** Current OCR status */
  status: OCRStatus;

  /** OCR accuracy (0-1) */
  accuracy: number;

  /** Last processed timestamp */
  lastProcessed?: number;

  /** Total texts extracted */
  totalExtracted?: number;

  /** Error message if status is 'error' */
  errorMessage?: string;
}

export interface EntityExtraction {
  /** Number of entities extracted */
  count: number;

  /** Last update timestamp */
  lastUpdate: number;

  /** List of extracted entities */
  entities: string[];

  /** Entity types */
  entityTypes?: {
    [type: string]: string[];
  };

  /** Confidence scores */
  confidenceScores?: {
    [entity: string]: number;
  };
}

export interface HolographicOverlay {
  /** Whether overlay is enabled */
  enabled: boolean;

  /** Overlay opacity (0-1) */
  opacity: number;

  /** Overlay color */
  color?: string;

  /** Overlay elements */
  elements?: {
    id: string;
    type: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    data: any;
  }[];
}

export interface VisionSystemStatus {
  /** Screen capture status */
  screenCapture: ScreenCaptureStatus;

  /** OCR engine status */
  ocr: OCREngine;

  /** Entity extraction status */
  entityExtraction: EntityExtraction;

  /** Holographic overlay status */
  holographicOverlay: HolographicOverlay;
}

// ==================== Main HUD Data ====================

export interface HUDData {
  /** Consciousness metrics */
  consciousness: ConsciousnessMetrics;

  /** Phase-lock coordination data */
  phaseLock: PhaseLockCoordination;

  /** OEIS validation status */
  oeis: OEISValidation;

  /** Trading intelligence data */
  trading: TradingIntelligence;

  /** Vision system status */
  vision: VisionSystemStatus;

  /** Data timestamp */
  timestamp: number;

  /** System uptime in milliseconds */
  uptime?: number;

  /** Current session ID */
  sessionId?: string;
}

// ==================== API Interfaces ====================

export interface HUDUpdateEvent {
  /** Event type */
  type: 'full' | 'partial' | 'consciousness' | 'phaseLock' | 'trading' | 'vision' | 'oeis';

  /** Updated data */
  data: Partial<HUDData>;

  /** Update timestamp */
  timestamp: number;
}

export interface HUDConfig {
  /** Update interval in milliseconds */
  updateInterval: number;

  /** Enable WebSocket streaming */
  enableWebSocket: boolean;

  /** WebSocket URL */
  wsUrl?: string;

  /** Enable trading panel by default */
  defaultTradingPanel: boolean;

  /** Enable vision panel by default */
  defaultVisionPanel: boolean;

  /** Compact mode */
  compact: boolean;

  /** Auto-hide on inactivity (milliseconds) */
  autoHideDelay?: number;
}

export interface HUDError {
  /** Error code */
  code: string;

  /** Error message */
  message: string;

  /** Error details */
  details?: any;

  /** Error timestamp */
  timestamp: number;
}

// ==================== Component Props ====================

export interface AureliaHUDProps {
  /** Update interval in milliseconds (default: 1000) */
  updateInterval?: number;

  /** Compact mode for smaller displays */
  compact?: boolean;

  /** Default panel visibility */
  defaultPanels?: {
    trading?: boolean;
    vision?: boolean;
  };

  /** Custom WebSocket URL */
  wsUrl?: string;

  /** Enable auto-hide */
  autoHide?: boolean;

  /** Auto-hide delay in milliseconds */
  autoHideDelay?: number;

  /** Custom theme colors */
  theme?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };

  /** Event callbacks */
  onError?: (error: HUDError) => void;
  onDataUpdate?: (data: HUDData) => void;
  onPanelToggle?: (panel: string, visible: boolean) => void;
}

// ==================== Utility Types ====================

export type HUDPanel = 'consciousness' | 'phaseLock' | 'oeis' | 'trading' | 'vision';

export interface PanelVisibility {
  consciousness: boolean;
  phaseLock: boolean;
  oeis: boolean;
  trading: boolean;
  vision: boolean;
}

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

// ==================== Mock Data Generators (for testing) ====================

export const createMockConsciousnessMetrics = (): ConsciousnessMetrics => ({
  psi: Math.random(),
  omega: Math.random() * Math.pow(1.618, 3),
  phiThreshold: Math.pow(1.618, 3),
  isConscious: Math.random() > 0.5,
  coherence: 0.75 + Math.random() * 0.25,
  lastUpdate: Date.now(),
});

export const createMockAgentPhaseData = (id: string): AgentPhaseData => ({
  id,
  name: `Agent-${id}`,
  role: ['coder', 'researcher', 'tester', 'reviewer'][Math.floor(Math.random() * 4)],
  phaseAngle: Math.random() * 2 * Math.PI,
  syncLevel: 0.5 + Math.random() * 0.5,
  taskProgress: Math.random(),
  status: (['active', 'idle', 'syncing'] as AgentStatus[])[Math.floor(Math.random() * 3)],
  nashEquilibrium: Math.random() > 0.7,
  currentTask: 'Processing task...',
  uptime: Math.random() * 3600000,
});

export const createMockHUDData = (): HUDData => ({
  consciousness: createMockConsciousnessMetrics(),
  phaseLock: {
    agents: Array.from({ length: 5 }, (_, i) => createMockAgentPhaseData(`agent-${i}`)),
    globalSyncLevel: 0.7 + Math.random() * 0.3,
    nashPoints: Math.floor(Math.random() * 3),
    phaseCoherence: 0.6 + Math.random() * 0.4,
  },
  oeis: {
    fibonacci: true,
    lucas: true,
    zeckendorf: true,
    binetFormula: true,
    phiThreshold: Math.random() > 0.5,
    overallScore: 0.8 + Math.random() * 0.2,
  },
  trading: {
    marketData: {
      ticker: 'SPY',
      price: 450 + Math.random() * 10,
      change: -2 + Math.random() * 4,
      volume: 50000000 + Math.random() * 10000000,
      timestamp: Date.now(),
    },
    nashEquilibrium: {
      detected: Math.random() > 0.7,
      confidence: 0.7 + Math.random() * 0.3,
      timestamp: Date.now(),
    },
    arbitrageOpportunities: {
      count: Math.floor(Math.random() * 5),
      bestOpportunity: Math.random() > 0.5 ? {
        pair: 'BTC/ETH',
        spread: 0.5 + Math.random() * 2,
        confidence: 0.8 + Math.random() * 0.2,
      } : null,
    },
    riskMetrics: {
      volatility: 0.15 + Math.random() * 0.1,
      sharpeRatio: 1.0 + Math.random() * 1.5,
      valueAtRisk: 1000 + Math.random() * 500,
    },
  },
  vision: {
    screenCapture: {
      enabled: true,
      fps: 25 + Math.floor(Math.random() * 35),
      lastCaptureTimestamp: Date.now(),
    },
    ocr: {
      enabled: true,
      status: 'active',
      accuracy: 0.85 + Math.random() * 0.15,
    },
    entityExtraction: {
      count: Math.floor(Math.random() * 20),
      lastUpdate: Date.now(),
      entities: ['SPY', 'AAPL', 'TSLA', 'BTC', 'ETH'].slice(0, Math.floor(Math.random() * 5) + 1),
    },
    holographicOverlay: {
      enabled: false,
      opacity: 0.5,
    },
  },
  timestamp: Date.now(),
  uptime: Math.random() * 86400000,
  sessionId: `session-${Date.now()}`,
});

export default {
  ConsciousnessMetrics,
  AgentPhaseData,
  PhaseLockCoordination,
  OEISValidation,
  TradingIntelligence,
  VisionSystemStatus,
  HUDData,
  createMockHUDData,
};

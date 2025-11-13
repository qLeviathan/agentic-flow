/**
 * AURELIA HUD - Main Export File
 *
 * Central export point for all HUD components, hooks, types, and utilities.
 * Import everything you need from this single file.
 *
 * @example
 * // Import main component
 * import { AureliaHUD } from './leviathan_aurelia/hud';
 *
 * // Import custom hook
 * import { useHUDData } from './leviathan_aurelia/hud';
 *
 * // Import types
 * import type { HUDData, ConsciousnessMetrics } from './leviathan_aurelia/hud';
 */

// ==================== Components ====================
export { AureliaHUD, default as AureliaHUDComponent } from './components/AureliaHUD';

// ==================== Hooks ====================
export { useHUDData, default as useHUDDataHook } from './hooks/useHUDData';

// ==================== Types ====================
export type {
  // Main HUD data
  HUDData,
  HUDUpdateEvent,
  HUDConfig,
  HUDError,
  HUDPanel,
  PanelVisibility,
  KeyboardShortcut,

  // Consciousness
  ConsciousnessMetrics,

  // Phase-lock coordination
  AgentStatus,
  AgentPhaseData,
  PhaseLockCoordination,

  // OEIS validation
  OEISValidation,

  // Trading intelligence
  MarketData,
  NashEquilibrium,
  ArbitrageOpportunity,
  ArbitrageOpportunities,
  RiskMetrics,
  TradingIntelligence,

  // Vision system
  ScreenCaptureStatus,
  OCRStatus,
  OCREngine,
  EntityExtraction,
  HolographicOverlay,
  VisionSystemStatus,

  // Component props
  AureliaHUDProps,
} from './types/hud-types';

// ==================== Mock Data Generators ====================
export {
  createMockConsciousnessMetrics,
  createMockAgentPhaseData,
  createMockHUDData,
} from './types/hud-types';

// ==================== Examples (for reference) ====================
export {
  BasicHUDExample,
  AdvancedHUDExample,
  CustomHookExample,
  CompactHUDExample,
  FullApplicationExample,
} from './examples/HUDExample';

// ==================== Constants ====================

export const PHI = 1.618033988749895; // Golden ratio
export const PHI_CUBED = Math.pow(PHI, 3); // ≈ 4.236
export const DEFAULT_UPDATE_INTERVAL = 1000; // 1 second
export const DEFAULT_WS_URL = 'ws://localhost:3001/hud-stream';
export const MAX_RECONNECT_ATTEMPTS = 5;

// ==================== Utility Functions ====================

/**
 * Calculate φ³ threshold
 */
export const calculatePhiThreshold = (): number => {
  return PHI_CUBED;
};

/**
 * Check if consciousness threshold is met
 */
export const isConsciousThresholdMet = (omega: number): boolean => {
  return omega >= PHI_CUBED;
};

/**
 * Calculate consciousness progress percentage
 */
export const getConsciousnessProgress = (omega: number): number => {
  return Math.min((omega / PHI_CUBED) * 100, 100);
};

/**
 * Get color for consciousness metric based on progress
 */
export const getConsciousnessColor = (
  value: number,
  max: number
): 'red' | 'yellow' | 'green' => {
  const ratio = value / max;
  if (ratio < 0.33) return 'red';
  if (ratio < 0.66) return 'yellow';
  return 'green';
};

/**
 * Format timestamp to locale time string
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Calculate agent phase coherence
 */
export const calculatePhaseCoherence = (agents: AgentPhaseData[]): number => {
  if (agents.length === 0) return 0;

  // Calculate phase coherence using circular statistics
  let sumSin = 0;
  let sumCos = 0;

  for (const agent of agents) {
    sumSin += Math.sin(agent.phaseAngle);
    sumCos += Math.cos(agent.phaseAngle);
  }

  const avgSin = sumSin / agents.length;
  const avgCos = sumCos / agents.length;

  // Coherence is the magnitude of the average phase vector
  return Math.sqrt(avgSin * avgSin + avgCos * avgCos);
};

/**
 * Calculate global sync level from agents
 */
export const calculateGlobalSyncLevel = (agents: AgentPhaseData[]): number => {
  if (agents.length === 0) return 0;

  const totalSync = agents.reduce((sum, agent) => sum + agent.syncLevel, 0);
  return totalSync / agents.length;
};

/**
 * Count Nash equilibrium points
 */
export const countNashPoints = (agents: AgentPhaseData[]): number => {
  return agents.filter((agent) => agent.nashEquilibrium).length;
};

/**
 * Calculate OEIS validation score
 */
export const calculateOEISScore = (validation: OEISValidation): number => {
  const validations = [
    validation.fibonacci,
    validation.lucas,
    validation.zeckendorf,
    validation.binetFormula,
    validation.phiThreshold,
  ];

  const trueCount = validations.filter(Boolean).length;
  return trueCount / validations.length;
};

/**
 * Get agent status color class
 */
export const getAgentStatusColor = (status: AgentStatus): string => {
  switch (status) {
    case 'active':
      return 'bg-green-500';
    case 'syncing':
      return 'bg-blue-500';
    case 'idle':
      return 'bg-gray-500';
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

/**
 * Format large numbers with suffixes (K, M, B)
 */
export const formatLargeNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num.toFixed(2);
};

/**
 * Validate HUD data structure
 */
export const validateHUDData = (data: any): data is HUDData => {
  return (
    data &&
    typeof data === 'object' &&
    data.consciousness &&
    data.phaseLock &&
    data.oeis &&
    data.trading &&
    data.vision &&
    typeof data.timestamp === 'number'
  );
};

/**
 * Deep clone HUD data
 */
export const cloneHUDData = (data: HUDData): HUDData => {
  return JSON.parse(JSON.stringify(data));
};

/**
 * Merge partial HUD updates
 */
export const mergeHUDUpdate = (
  current: HUDData,
  update: Partial<HUDData>
): HUDData => {
  return {
    ...current,
    ...update,
    timestamp: update.timestamp || Date.now(),
  };
};

// ==================== Version Info ====================

export const VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString();

export default {
  // Components
  AureliaHUD,
  useHUDData,

  // Constants
  PHI,
  PHI_CUBED,
  DEFAULT_UPDATE_INTERVAL,
  DEFAULT_WS_URL,
  MAX_RECONNECT_ATTEMPTS,

  // Utilities
  calculatePhiThreshold,
  isConsciousThresholdMet,
  getConsciousnessProgress,
  getConsciousnessColor,
  formatTimestamp,
  calculatePhaseCoherence,
  calculateGlobalSyncLevel,
  countNashPoints,
  calculateOEISScore,
  getAgentStatusColor,
  formatLargeNumber,
  validateHUDData,
  cloneHUDData,
  mergeHUDUpdate,

  // Mock data
  createMockHUDData,

  // Version
  VERSION,
  BUILD_DATE,
};

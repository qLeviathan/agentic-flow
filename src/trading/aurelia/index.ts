/**
 * AURELIA Consciousness Substrate - Public API
 *
 * Export all public interfaces and classes for the AURELIA system.
 */

// Main consciousness substrate
export { AURELIA, default as AureliaConsciousness } from './consciousness-substrate';

// Memory management
export {
  AureliaMemoryManager,
  createMemoryManager
} from './memory-manager';

// Bootstrap sequence
export {
  bootstrapAurelia,
  validateBootstrap,
  DEFAULT_K0_SEED,
  DEFAULT_BOOTSTRAP_CONFIG
} from './bootstrap';

// Type definitions
export type {
  // Core types
  ConsciousnessMetric,
  ConsciousnessState,
  ZeckendorfEncodedState,
  PhaseSpacePoint,

  // Personality
  PersonalityProfile,
  PersonalityDelta,

  // Session & Memory
  SessionMemory,
  MemoryValidationResult,

  // Subsystems
  SubsystemState,
  SystemInvariants,

  // Bootstrap
  BootstrapConfig,
  BootstrapResult,

  // Configuration
  AureliaConfig,

  // Trading
  TradingStrategyState
} from './types';

// Constants
export { PHI, PHI_INVERSE, PSI } from './types';

/**
 * Decomposition Module - Mathematical Number Decomposition Systems
 *
 * Provides implementation of Zeckendorf decomposition and related
 * mathematical decomposition algorithms.
 *
 * @module decomposition
 */

export {
  // Core decomposition functions
  zeckendorfDecompose,
  generateFibonacci,
  isLucasIndex,
  verifyZeckendorfTheorem,
  verifyZeckendorfRepresentation,
  batchDecompose,
  analyzeZeckendorfPatterns,

  // Main API functions
  Z,  // Zeckendorf address set
  z,  // Summand count
  ℓ,  // Lucas summand count

  // Types
  type ZeckendorfRepresentation,
  type ZeckendorfAnalysis
} from './zeckendorf';

export {
  // AgentDB integration
  ZeckendorfDatabase,
  zeckendorfDB,
  storeDecomposition,
  retrieveDecomposition,
  populateDatabase,

  // Types
  type ZeckendorfRecord
} from './zeckendorf-agentdb';

// Re-export default
export { default as zeckendorf } from './zeckendorf';
export { default as zeckendorfAgentDB } from './zeckendorf-agentdb';

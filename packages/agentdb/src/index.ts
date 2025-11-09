/**
 * AgentDB - Main Entry Point
 *
 * Frontier Memory Features with MCP Integration:
 * - Causal reasoning and memory graphs
 * - Reflexion memory with self-critique
 * - Skill library with automated learning
 * - Vector search with embeddings
 * - Reinforcement learning (9 algorithms)
 */

// Core controllers
export { CausalMemoryGraph } from './controllers/CausalMemoryGraph.js';
export { CausalRecall } from './controllers/CausalRecall.js';
export { ExplainableRecall } from './controllers/ExplainableRecall.js';
export { NightlyLearner } from './controllers/NightlyLearner.js';
export {
  ReflexionMemory,
  type Episode,
  type EpisodeWithEmbedding,
  type EpisodeWithOEIS,
  type ReflexionQuery
} from './controllers/ReflexionMemory.js';
export {
  SkillLibrary,
  type Skill,
  type SkillWithOEIS,
  type SkillLink,
  type SkillQuery
} from './controllers/SkillLibrary.js';
export { LearningSystem } from './controllers/LearningSystem.js';
export { ReasoningBank } from './controllers/ReasoningBank.js';

// Embedding services
export { EmbeddingService } from './controllers/EmbeddingService.js';
export { EnhancedEmbeddingService } from './controllers/EnhancedEmbeddingService.js';

// WASM acceleration
export { WASMVectorSearch } from './controllers/WASMVectorSearch.js';

// Database utilities
export { createDatabase } from './db-fallback.js';

// Optimizations
export { BatchOperations } from './optimizations/BatchOperations.js';
export { QueryOptimizer } from './optimizations/QueryOptimizer.js';

// Security and Validation
export {
  validateTableName,
  validateColumnName,
  validatePragmaCommand,
  buildSafeWhereClause,
  buildSafeSetClause,
  ValidationError,
  // OEIS sequence validation
  validateSequence,
  validateSequencePattern,
  extractSequencesFromText,
  calculateSequenceSimilarity,
  detectSequencePattern,
  type OEISSequencePattern
} from './security/input-validation.js';

// OEIS Integration
export * from './oeis/index.js';

// OEIS Integration - Migrations
export {
  applyOEISMigration,
  rollbackOEISMigration,
  isOEISMigrationApplied,
  getOEISMigrationInfo
} from './migrations/add-oeis-support.js';

// Re-export all controllers for convenience
export * from './controllers/index.js';

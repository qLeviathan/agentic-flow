/**
 * Math Framework - Main Export
 * Comprehensive mathematical framework with AgentDB integration
 */

// Memory and AgentDB integration
export * from './memory';

// Sequence computations
export * from './sequences/fibonacci-lucas';

// Phase space calculations
export * from './phase-space/coordinates';

// Pattern recognition
export * from './neural/pattern-recognition';

// Re-export main class for convenience
export { MathFrameworkMemory, createMathFrameworkMemory } from './memory/agentdb-integration';

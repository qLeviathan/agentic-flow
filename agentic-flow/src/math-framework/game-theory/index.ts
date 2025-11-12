/**
 * Game Theory Nash Equilibrium Solver - Level 7
 *
 * Complete implementation of Nash equilibrium computation with:
 * - Multi-player game support
 * - Pure and mixed strategy equilibria
 * - Behrend-Kimberling divergence analysis
 * - Game tensor construction
 * - AgentDB memory persistence
 *
 * @module game-theory
 */

export * from './types.js';
export * from './nash-solver.js';
export * from './agentdb-integration.js';

import { NashSolver, defaultCostFunctions } from './nash-solver.js';
import { NashMemoryManager, createNashMemoryManager } from './agentdb-integration.js';

export {
  NashSolver,
  defaultCostFunctions,
  NashMemoryManager,
  createNashMemoryManager
};

/**
 * Quick-start factory function
 */
export async function createGameTheorySolver(config?: {
  dbPath?: string;
  maxIterations?: number;
  epsilon?: number;
  enableBKAnalysis?: boolean;
}) {
  const solver = new NashSolver({
    maxIterations: config?.maxIterations,
    epsilon: config?.epsilon,
    enableBKAnalysis: config?.enableBKAnalysis
  });

  const memory = await createNashMemoryManager(config?.dbPath);

  return {
    solver,
    memory
  };
}

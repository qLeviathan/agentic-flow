/**
 * Math Framework API
 * Comprehensive TypeScript API for mathematical framework operations
 *
 * This class provides a unified interface to:
 * - Fibonacci and Lucas sequences
 * - Zeckendorf decomposition
 * - Behrend-Kimberling divergence
 * - Nash equilibrium detection
 * - Phase space analysis
 * - Neural network training with Q-matrices
 */

import { fibonacci as fibBigInt } from '../math-framework/sequences/fibonacci';
import { fibonacci, lucas, calculateS, findNashPoints as findNashRange } from '../math-framework/sequences/fibonacci-lucas';
import { zeckendorfDecompose, type ZeckendorfRepresentation } from '../math-framework/decomposition/zeckendorf';
import {
  analyzeBKTheorem,
  findNashEquilibria,
  type BKAnalysis,
  type BKPoint
} from '../math-framework/divergence/behrend-kimberling';
import {
  calculateCoordinates,
  generateTrajectory,
  findNashPoints as findPhaseNash,
  analyzePhaseSpace,
  type PhaseSpaceCoordinates,
  type TrajectoryPoint,
  type NashPoint as PhaseNashPoint,
  type PhaseSpaceAnalysis
} from '../math-framework/phase-space';
import { QNetwork, Matrix, type QNetworkConfig, type TrainingResult } from '../math-framework/neural/q-network';

/**
 * Game state for neural network training
 */
export interface GameState {
  state: number[];
  action?: number;
  reward?: number;
  nextState?: number[];
}

/**
 * Neural network training options
 */
export interface NeuralTrainingOptions {
  maxSteps?: number;
  learningRate?: number;
  lambda?: number;
  verbose?: boolean;
  callback?: (iteration: number, loss: number, S_n: number) => void;
}

/**
 * Nash equilibrium point
 */
export interface NashPoint {
  n: number;
  S: number;
  isNash: boolean;
  metadata?: any;
}

/**
 * Main Math Framework Class
 *
 * Provides unified API for all mathematical operations
 */
export class MathFramework {
  private neuralNetwork?: QNetwork;

  /**
   * Compute Fibonacci number F(n)
   * Uses optimized algorithm with memoization
   *
   * @param n - Index (non-negative integer)
   * @returns Fibonacci number as bigint
   *
   * @example
   * ```typescript
   * const f100 = mf.fibonacci(100);
   * console.log(f100); // 354224848179261915075n
   * ```
   */
  fibonacci(n: number): bigint {
    if (!Number.isInteger(n) || n < 0) {
      throw new Error('n must be a non-negative integer');
    }
    return fibBigInt(n);
  }

  /**
   * Compute Lucas number L(n)
   *
   * @param n - Index (non-negative integer)
   * @returns Lucas number
   *
   * @example
   * ```typescript
   * const l10 = mf.lucas(10);
   * console.log(l10); // 123
   * ```
   */
  lucas(n: number): number {
    if (!Number.isInteger(n) || n < 0) {
      throw new Error('n must be a non-negative integer');
    }
    return lucas(n);
  }

  /**
   * Compute Zeckendorf decomposition
   * Decomposes n into unique sum of non-consecutive Fibonacci numbers
   *
   * @param n - Positive integer to decompose
   * @returns Zeckendorf representation
   *
   * @example
   * ```typescript
   * const zeck = mf.zeckendorf(42);
   * console.log(zeck.representation);
   * // "42 = F9=34 + F7=13 + F4=5"
   * ```
   */
  zeckendorf(n: number): ZeckendorfRepresentation {
    return zeckendorfDecompose(n);
  }

  /**
   * Compute Behrend-Kimberling divergence S(n)
   * S(n) = V(n) - U(n) where:
   * - V(n) = Σₖ₌₀ⁿ z(k) (cumulative Zeckendorf counts)
   * - U(n) = Σₖ₌₀ⁿ ℓ(k) (cumulative Lucas counts)
   *
   * Nash equilibrium occurs when S(n) = 0
   *
   * @param n - Index
   * @returns Divergence value S(n)
   *
   * @example
   * ```typescript
   * const s10 = mf.divergence(10);
   * console.log(s10); // 0 (Nash equilibrium at n=10)
   * ```
   */
  divergence(n: number): number {
    if (!Number.isInteger(n) || n < 0) {
      throw new Error('n must be a non-negative integer');
    }
    return calculateS(n);
  }

  /**
   * Find all Nash equilibrium points up to n
   * Nash points are where S(n) = 0
   *
   * @param n - Maximum index to search
   * @param tolerance - Tolerance for S(n) = 0 (default: 1e-10)
   * @returns Array of Nash equilibrium indices
   *
   * @example
   * ```typescript
   * const nash = mf.findNashPoints(100);
   * console.log(nash); // [0, 10, 28, ...]
   * ```
   */
  findNashPoints(n: number, tolerance: number = 1e-10): number[] {
    if (!Number.isInteger(n) || n < 0) {
      throw new Error('n must be a non-negative integer');
    }
    return findNashRange(0, n, tolerance);
  }

  /**
   * Analyze Behrend-Kimberling theorem for range [0, n]
   * Verifies that S(n) = 0 ⟺ n+1 = Lₘ (Lucas number)
   *
   * @param n - Maximum index
   * @returns Complete B-K analysis with Nash equilibria
   *
   * @example
   * ```typescript
   * const analysis = mf.analyzeBKTheorem(100);
   * console.log(analysis.theoremVerified); // true
   * console.log(analysis.nashEquilibria.length); // Number of Nash points
   * ```
   */
  analyzeBKTheorem(n: number): BKAnalysis {
    return analyzeBKTheorem(n);
  }

  /**
   * Compute phase space coordinates
   * Based on Riemann zeta zeros and Zeckendorf decomposition
   *
   * @param n - Index
   * @returns Phase space coordinates {phi, psi, theta, magnitude}
   *
   * @example
   * ```typescript
   * const coords = mf.phaseSpace(50);
   * console.log(`φ(50) = ${coords.phi}`);
   * console.log(`ψ(50) = ${coords.psi}`);
   * console.log(`θ(50) = ${coords.theta}`);
   * ```
   */
  phaseSpace(n: number): PhaseSpaceCoordinates {
    return calculateCoordinates(n);
  }

  /**
   * Generate phase space trajectory
   * Computes coordinates for range [start, end] with given step
   *
   * @param start - Starting index
   * @param end - Ending index
   * @param step - Step size (default: 1)
   * @returns Array of trajectory points
   *
   * @example
   * ```typescript
   * const trajectory = mf.phaseTrajectory(1, 100, 1);
   * // Plot trajectory in phase space
   * ```
   */
  phaseTrajectory(start: number, end: number, step: number = 1): TrajectoryPoint[] {
    return generateTrajectory(start, end, step);
  }

  /**
   * Analyze phase space for range
   * Provides comprehensive analysis including Nash points
   *
   * @param start - Starting index
   * @param end - Ending index
   * @param step - Step size
   * @returns Phase space analysis
   */
  analyzePhaseSpace(start: number, end: number, step: number = 1): PhaseSpaceAnalysis {
    return analyzePhaseSpace(start, end, step);
  }

  /**
   * Create and configure neural network
   * Implements Q-matrix evolution with Nash convergence
   *
   * @param config - Network configuration
   * @returns QNetwork instance
   *
   * @example
   * ```typescript
   * const nn = mf.createNeuralNetwork({
   *   layers: [4, 8, 4],
   *   learningRate: 0.01,
   *   lambda: 0.1
   * });
   * ```
   */
  createNeuralNetwork(config: QNetworkConfig): QNetwork {
    this.neuralNetwork = new QNetwork(config);
    return this.neuralNetwork;
  }

  /**
   * Train neural network on game state
   * Automatically converges to Nash equilibrium
   *
   * @param gameState - Training data (state, action, reward)
   * @param options - Training options
   * @returns Training result with Nash convergence info
   *
   * @example
   * ```typescript
   * const result = await mf.train(gameState, {
   *   maxSteps: 1000,
   *   verbose: true
   * });
   * console.log(`Converged to Nash: ${result.convergedToNash}`);
   * ```
   */
  async train(
    gameState: GameState | GameState[],
    options: NeuralTrainingOptions = {}
  ): Promise<TrainingResult> {
    if (!this.neuralNetwork) {
      throw new Error('Neural network not initialized. Call createNeuralNetwork() first.');
    }

    // Convert game state to training data
    const states = Array.isArray(gameState) ? gameState : [gameState];

    // Convert to Matrix format
    const X = states.map(s => {
      const data = new Float64Array(s.state);
      return new Matrix(s.state.length, 1, data);
    });

    // Generate target outputs (for supervised learning)
    // In RL, this would be Q-values or policy outputs
    const Y = states.map(s => {
      const target = s.nextState || s.state;
      const data = new Float64Array(target);
      return new Matrix(target.length, 1, data);
    });

    // Train network
    const result = this.neuralNetwork.train(X, Y, {
      verbose: options.verbose,
      callback: options.callback
    });

    return result;
  }

  /**
   * Get current neural network instance
   */
  getNeuralNetwork(): QNetwork | undefined {
    return this.neuralNetwork;
  }

  /**
   * Batch compute multiple operations
   * Useful for analysis and visualization
   *
   * @param n - Maximum index
   * @returns Complete mathematical profile
   *
   * @example
   * ```typescript
   * const profile = mf.computeProfile(100);
   * console.log(profile.fibonacci);
   * console.log(profile.nashPoints);
   * ```
   */
  computeProfile(n: number): {
    range: number;
    fibonacci: bigint[];
    lucas: number[];
    divergence: number[];
    nashPoints: number[];
    phaseSpace: PhaseSpaceCoordinates[];
  } {
    const fibonacci: bigint[] = [];
    const lucas: number[] = [];
    const divergence: number[] = [];
    const phaseSpace: PhaseSpaceCoordinates[] = [];

    for (let i = 0; i <= n; i++) {
      fibonacci.push(this.fibonacci(i));
      lucas.push(this.lucas(i));
      divergence.push(this.divergence(i));
      phaseSpace.push(this.phaseSpace(i));
    }

    const nashPoints = this.findNashPoints(n);

    return {
      range: n,
      fibonacci,
      lucas,
      divergence,
      nashPoints,
      phaseSpace
    };
  }

  /**
   * Verify mathematical properties
   * Checks consistency and correctness
   *
   * @param n - Range to verify
   * @returns Verification results
   */
  verify(n: number): {
    bkTheoremVerified: boolean;
    nashPointsConsistent: boolean;
    zeckendorfValid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Verify B-K theorem
    const bkAnalysis = this.analyzeBKTheorem(n);
    const bkTheoremVerified = bkAnalysis.theoremVerified;

    if (!bkTheoremVerified) {
      violations.push(`B-K theorem violated: ${bkAnalysis.violations.length} violations found`);
    }

    // Verify Nash points consistency
    const nashPoints = this.findNashPoints(n);
    const nashPointsConsistent = nashPoints.length === bkAnalysis.nashEquilibria.length;

    if (!nashPointsConsistent) {
      violations.push(`Nash points inconsistent: ${nashPoints.length} vs ${bkAnalysis.nashEquilibria.length}`);
    }

    // Verify Zeckendorf decompositions
    let zeckendorfValid = true;
    for (let i = 1; i <= Math.min(n, 100); i++) {
      try {
        const zeck = this.zeckendorf(i);
        if (!zeck.isValid) {
          zeckendorfValid = false;
          violations.push(`Zeckendorf decomposition invalid for n=${i}`);
          break;
        }
      } catch (error) {
        zeckendorfValid = false;
        violations.push(`Zeckendorf error at n=${i}: ${error}`);
        break;
      }
    }

    return {
      bkTheoremVerified,
      nashPointsConsistent,
      zeckendorfValid,
      violations
    };
  }

  /**
   * Export data for visualization
   * Generates JSON data suitable for plotting
   *
   * @param n - Range
   * @returns JSON data
   */
  exportVisualizationData(n: number): string {
    const profile = this.computeProfile(n);

    return JSON.stringify({
      meta: {
        range: n,
        generatedAt: new Date().toISOString(),
        framework: 'math-framework'
      },
      data: {
        fibonacci: profile.fibonacci.map(f => f.toString()),
        lucas: profile.lucas,
        divergence: profile.divergence,
        nashPoints: profile.nashPoints,
        phaseSpace: profile.phaseSpace
      }
    }, null, 2);
  }
}

/**
 * Create MathFramework instance
 *
 * @example
 * ```typescript
 * import { createMathFramework } from './api/framework';
 *
 * const mf = createMathFramework();
 * const f100 = mf.fibonacci(100);
 * ```
 */
export function createMathFramework(): MathFramework {
  return new MathFramework();
}

// Export as default
export default MathFramework;

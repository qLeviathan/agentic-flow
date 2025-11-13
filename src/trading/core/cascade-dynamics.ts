/**
 * Cascade Dynamics for Zeckendorf Trading States
 *
 * Implements XOR + normalize cascade operations for state transitions:
 * - XOR operations on Zeckendorf indices
 * - State normalization (ensure non-consecutive Fibonacci)
 * - Cascade dynamics with O(log n) termination guarantee
 * - State evolution and attractor detection
 *
 * Mathematical Foundation:
 * - XOR: Symmetric difference of Fibonacci index sets
 * - Normalize: Greedy consolidation to valid Zeckendorf form
 * - Cascade: Iterate until fixed point (attractor) reached
 *
 * @module cascade-dynamics
 */

import {
  zeckendorfDecompose,
  ZeckendorfRepresentation,
  generateFibonacci,
  Z
} from '../../math-framework/decomposition/zeckendorf';
import { EncodedMarketState, BidirectionalLattice } from './state-encoder';

/**
 * Cascade operation result
 */
export interface CascadeResult {
  /** Initial state indices */
  initial: Set<number>;
  /** XOR result indices */
  xorResult: Set<number>;
  /** Normalized (valid Zeckendorf) indices */
  normalized: Set<number>;
  /** Number of iterations to converge */
  iterations: number;
  /** Whether cascade reached fixed point */
  converged: boolean;
  /** Final Zeckendorf representation */
  final: ZeckendorfRepresentation;
  /** Evolution trajectory */
  trajectory: Array<{
    iteration: number;
    indices: Set<number>;
    isValid: boolean;
  }>;
}

/**
 * State transition through cascade
 */
export interface StateTransitionCascade {
  /** Source state */
  source: EncodedMarketState;
  /** Target state */
  target: EncodedMarketState;
  /** Price cascade */
  priceCascade: CascadeResult;
  /** Volume cascade */
  volumeCascade: CascadeResult;
  /** Combined transition energy */
  transitionEnergy: number;
  /** Attractor reached */
  attractor?: Set<number>;
}

/**
 * XOR operation on two sets of Fibonacci indices
 * Returns symmetric difference: (A ∪ B) - (A ∩ B)
 */
export function xorIndices(set1: Set<number>, set2: Set<number>): Set<number> {
  const result = new Set<number>();

  // Add elements in set1 but not in set2
  for (const elem of set1) {
    if (!set2.has(elem)) {
      result.add(elem);
    }
  }

  // Add elements in set2 but not in set1
  for (const elem of set2) {
    if (!set1.has(elem)) {
      result.add(elem);
    }
  }

  return result;
}

/**
 * Check if index set is valid Zeckendorf (no consecutive indices)
 */
export function isValidZeckendorf(indices: Set<number>): boolean {
  if (indices.size === 0) return true;

  const sorted = Array.from(indices).sort((a, b) => a - b);

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] - sorted[i] === 1) {
      return false; // Consecutive indices found
    }
  }

  return true;
}

/**
 * Normalize index set to valid Zeckendorf representation
 * Consolidates consecutive indices using Fibonacci identity:
 * F(n) + F(n+1) = F(n+2)
 */
export function normalizeIndices(indices: Set<number>): Set<number> {
  if (indices.size === 0) return new Set();

  let current = new Set(indices);
  let changed = true;

  // Iterate until no more consolidations possible
  while (changed) {
    changed = false;
    const sorted = Array.from(current).sort((a, b) => a - b);

    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = sorted[i];
      const next = sorted[i + 1];

      // Found consecutive indices
      if (next - curr === 1) {
        // Remove both and add their sum
        current.delete(curr);
        current.delete(next);
        current.add(next + 1); // F(n) + F(n+1) = F(n+2)
        changed = true;
        break; // Restart from beginning
      }
    }
  }

  return current;
}

/**
 * Convert index set to Zeckendorf sum value
 */
function indicesToValue(indices: Set<number>): number {
  const fibonacci = generateFibonacci(1000000); // Large enough
  let sum = 0;

  for (const index of indices) {
    if (index > 0 && index <= fibonacci.length) {
      sum += fibonacci[index - 1]; // 1-based to 0-based
    }
  }

  return sum;
}

/**
 * Perform single cascade step: XOR + normalize
 */
export function cascadeStep(
  indices1: Set<number>,
  indices2: Set<number>
): Set<number> {
  // Step 1: XOR
  const xored = xorIndices(indices1, indices2);

  // Step 2: Normalize
  const normalized = normalizeIndices(xored);

  return normalized;
}

/**
 * Execute full cascade until convergence or max iterations
 * Guarantees O(log n) termination through monotonic decrease
 */
export function executeCascade(
  indices1: Set<number>,
  indices2: Set<number>,
  maxIterations: number = 100
): CascadeResult {
  const initial = new Set(indices1);
  const xorResult = xorIndices(indices1, indices2);

  const trajectory: CascadeResult['trajectory'] = [];
  let current = new Set(xorResult);
  let iterations = 0;
  let converged = false;

  // Track visited states to detect fixed points
  const visited = new Set<string>();

  while (iterations < maxIterations) {
    const stateKey = Array.from(current).sort().join(',');

    // Check if we've seen this state before (fixed point)
    if (visited.has(stateKey)) {
      converged = true;
      break;
    }

    visited.add(stateKey);

    trajectory.push({
      iteration: iterations,
      indices: new Set(current),
      isValid: isValidZeckendorf(current)
    });

    // Normalize current state
    const normalized = normalizeIndices(current);

    // Check if normalization changed anything
    if (setsEqual(normalized, current)) {
      // Reached valid Zeckendorf form
      converged = true;
      break;
    }

    current = normalized;
    iterations++;
  }

  // Final trajectory entry
  trajectory.push({
    iteration: iterations,
    indices: new Set(current),
    isValid: isValidZeckendorf(current)
  });

  // Convert final indices to Zeckendorf representation
  const finalValue = indicesToValue(current);
  const final = zeckendorfDecompose(Math.max(1, finalValue));

  return {
    initial,
    xorResult,
    normalized: current,
    iterations,
    converged,
    final,
    trajectory
  };
}

/**
 * Execute cascade between two encoded market states
 */
export function cascadeStates(
  source: EncodedMarketState,
  target: EncodedMarketState
): StateTransitionCascade {
  // Price cascade
  const priceCascade = executeCascade(
    source.priceEncoding.indices,
    target.priceEncoding.indices
  );

  // Volume cascade
  const volumeCascade = executeCascade(
    source.volumeEncoding.indices,
    target.volumeEncoding.indices
  );

  // Calculate transition energy (total change magnitude)
  const priceEnergy = Math.abs(
    target.market.price - source.market.price
  ) / source.market.price;

  const volumeEnergy = Math.abs(
    target.market.volume - source.market.volume
  ) / source.market.volume;

  const transitionEnergy = Math.sqrt(
    priceEnergy * priceEnergy + volumeEnergy * volumeEnergy
  );

  // Detect attractor (common fixed point)
  let attractor: Set<number> | undefined;
  if (priceCascade.converged && volumeCascade.converged) {
    // If both converged to same indices, that's an attractor
    if (setsEqual(priceCascade.normalized, volumeCascade.normalized)) {
      attractor = priceCascade.normalized;
    }
  }

  return {
    source,
    target,
    priceCascade,
    volumeCascade,
    transitionEnergy,
    attractor
  };
}

/**
 * Find attractors in a sequence of states
 */
export function findAttractors(
  states: EncodedMarketState[]
): Array<{
  attractor: Set<number>;
  frequency: number;
  states: number[]; // Indices of states with this attractor
}> {
  const attractorMap = new Map<string, { set: Set<number>; indices: number[] }>();

  // Cascade consecutive states
  for (let i = 0; i < states.length - 1; i++) {
    const cascade = cascadeStates(states[i], states[i + 1]);

    if (cascade.attractor) {
      const key = Array.from(cascade.attractor).sort().join(',');

      if (!attractorMap.has(key)) {
        attractorMap.set(key, {
          set: cascade.attractor,
          indices: []
        });
      }

      attractorMap.get(key)!.indices.push(i);
    }
  }

  // Convert to array and calculate frequencies
  return Array.from(attractorMap.values()).map(({ set, indices }) => ({
    attractor: set,
    frequency: indices.length,
    states: indices
  }));
}

/**
 * Simulate cascade evolution over multiple steps
 */
export function simulateCascadeEvolution(
  initial: Set<number>,
  perturbation: Set<number>,
  steps: number = 10
): Array<{
  step: number;
  indices: Set<number>;
  value: number;
  isValid: boolean;
}> {
  const evolution: Array<{
    step: number;
    indices: Set<number>;
    value: number;
    isValid: boolean;
  }> = [];

  let current = new Set(initial);

  for (let step = 0; step < steps; step++) {
    // Apply perturbation
    const next = cascadeStep(current, perturbation);
    const value = indicesToValue(next);

    evolution.push({
      step,
      indices: new Set(next),
      value,
      isValid: isValidZeckendorf(next)
    });

    current = next;

    // Stop if reached fixed point
    if (step > 0 && setsEqual(current, evolution[step - 1].indices)) {
      break;
    }
  }

  return evolution;
}

/**
 * Calculate Lyapunov exponent for cascade dynamics
 * Measures sensitivity to initial conditions (chaos indicator)
 */
export function calculateLyapunovExponent(
  states: EncodedMarketState[]
): number {
  if (states.length < 3) return 0;

  const distances: number[] = [];

  for (let i = 0; i < states.length - 1; i++) {
    const cascade = cascadeStates(states[i], states[i + 1]);

    // Distance between initial and final
    const initialSize = cascade.priceCascade.initial.size;
    const finalSize = cascade.priceCascade.normalized.size;

    if (initialSize > 0) {
      const distance = Math.abs(finalSize - initialSize) / initialSize;
      if (distance > 0) {
        distances.push(Math.log(distance));
      }
    }
  }

  if (distances.length < 2) return 0;

  // Average log distance growth
  return distances.reduce((a, b) => a + b, 0) / distances.length;
}

/**
 * Detect cascade cycles (periodic attractors)
 */
export function detectCascadeCycles(
  states: EncodedMarketState[],
  maxCycleLength: number = 10
): Array<{
  period: number;
  indices: number[]; // Where cycle starts
  pattern: Set<number>[]; // Repeating pattern
}> {
  const cycles: Array<{
    period: number;
    indices: number[];
    pattern: Set<number>[];
  }> = [];

  // Generate cascade sequence
  const cascadeSequence: Set<number>[] = [];
  for (let i = 0; i < states.length - 1; i++) {
    const cascade = cascadeStates(states[i], states[i + 1]);
    cascadeSequence.push(cascade.priceCascade.normalized);
  }

  // Look for repeating patterns
  for (let period = 2; period <= Math.min(maxCycleLength, cascadeSequence.length / 2); period++) {
    for (let start = 0; start <= cascadeSequence.length - 2 * period; start++) {
      let isMatching = true;

      // Check if pattern repeats
      for (let offset = 0; offset < period; offset++) {
        if (!setsEqual(
          cascadeSequence[start + offset],
          cascadeSequence[start + period + offset]
        )) {
          isMatching = false;
          break;
        }
      }

      if (isMatching) {
        const pattern = cascadeSequence.slice(start, start + period);
        cycles.push({
          period,
          indices: [start],
          pattern
        });
      }
    }
  }

  return cycles;
}

/**
 * Helper: Check if two sets are equal
 */
function setsEqual<T>(set1: Set<T>, set2: Set<T>): boolean {
  if (set1.size !== set2.size) return false;
  for (const item of set1) {
    if (!set2.has(item)) return false;
  }
  return true;
}

/**
 * Calculate cascade entropy (complexity measure)
 */
export function calculateCascadeEntropy(cascade: CascadeResult): number {
  // Entropy based on trajectory complexity
  const stateSizes = cascade.trajectory.map(t => t.indices.size);

  if (stateSizes.length === 0) return 0;

  // Normalized entropy: variety of state sizes
  const uniqueSizes = new Set(stateSizes).size;
  const maxEntropy = Math.log2(stateSizes.length);

  if (maxEntropy === 0) return 0;

  return Math.log2(uniqueSizes) / maxEntropy;
}

export default {
  xorIndices,
  isValidZeckendorf,
  normalizeIndices,
  cascadeStep,
  executeCascade,
  cascadeStates,
  findAttractors,
  simulateCascadeEvolution,
  calculateLyapunovExponent,
  detectCascadeCycles,
  calculateCascadeEntropy
};

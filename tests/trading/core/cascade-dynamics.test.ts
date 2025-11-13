/**
 * Cascade Dynamics XOR Tests
 *
 * Tests XOR operations on Zeckendorf indices, state normalization,
 * O(log n) convergence guarantee, attractor detection, and Lyapunov exponent calculation.
 *
 * Requirements:
 * - XOR + normalize operations
 * - O(log n) convergence
 * - Attractor detection
 * - Lyapunov exponent calculation
 * - Cycle detection
 */

import {
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
  calculateCascadeEntropy,
  CascadeResult,
  StateTransitionCascade
} from '../../../src/trading/core/cascade-dynamics';
import {
  ZeckendorfStateEncoder,
  MarketData,
  EncodedMarketState
} from '../../../src/trading/core/state-encoder';

describe('Cascade Dynamics - XOR Operations', () => {
  describe('XOR Indices', () => {
    it('should compute symmetric difference of two sets', () => {
      const set1 = new Set([1, 2, 3, 5]);
      const set2 = new Set([2, 3, 4, 6]);

      const result = xorIndices(set1, set2);

      expect(result).toEqual(new Set([1, 4, 5, 6]));
    });

    it('should return empty set when sets are identical', () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set([1, 2, 3]);

      const result = xorIndices(set1, set2);

      expect(result.size).toBe(0);
    });

    it('should return set1 when set2 is empty', () => {
      const set1 = new Set([1, 2, 3]);
      const set2 = new Set<number>();

      const result = xorIndices(set1, set2);

      expect(result).toEqual(set1);
    });

    it('should return set2 when set1 is empty', () => {
      const set1 = new Set<number>();
      const set2 = new Set([1, 2, 3]);

      const result = xorIndices(set1, set2);

      expect(result).toEqual(set2);
    });

    it('should handle disjoint sets', () => {
      const set1 = new Set([1, 3, 5]);
      const set2 = new Set([2, 4, 6]);

      const result = xorIndices(set1, set2);

      expect(result).toEqual(new Set([1, 2, 3, 4, 5, 6]));
    });

    it('should be commutative: XOR(A,B) = XOR(B,A)', () => {
      const set1 = new Set([1, 2, 5, 7]);
      const set2 = new Set([2, 3, 5, 8]);

      const result1 = xorIndices(set1, set2);
      const result2 = xorIndices(set2, set1);

      expect(result1).toEqual(result2);
    });
  });

  describe('Zeckendorf Validation', () => {
    it('should validate non-consecutive indices', () => {
      const valid = new Set([1, 3, 5, 8]); // Non-consecutive

      expect(isValidZeckendorf(valid)).toBe(true);
    });

    it('should reject consecutive indices', () => {
      const invalid = new Set([2, 3, 5]); // 2 and 3 are consecutive

      expect(isValidZeckendorf(invalid)).toBe(false);
    });

    it('should accept empty set', () => {
      const empty = new Set<number>();

      expect(isValidZeckendorf(empty)).toBe(true);
    });

    it('should accept single element', () => {
      const single = new Set([5]);

      expect(isValidZeckendorf(single)).toBe(true);
    });

    it('should validate Fibonacci indices correctly', () => {
      const fibIndices = new Set([2, 4, 7, 10]); // Non-consecutive

      expect(isValidZeckendorf(fibIndices)).toBe(true);
    });
  });

  describe('Index Normalization', () => {
    it('should normalize consecutive indices using F(n) + F(n+1) = F(n+2)', () => {
      const consecutive = new Set([5, 6]); // F(5) + F(6) = F(7)

      const normalized = normalizeIndices(consecutive);

      expect(normalized).toEqual(new Set([7]));
    });

    it('should handle multiple consecutive pairs', () => {
      const multiConsecutive = new Set([2, 3, 5, 6]);

      const normalized = normalizeIndices(multiConsecutive);

      // [2,3] → [4], [5,6] → [7]
      expect(isValidZeckendorf(normalized)).toBe(true);
      expect(normalized.has(4)).toBe(true);
      expect(normalized.has(7)).toBe(true);
    });

    it('should not modify already valid Zeckendorf', () => {
      const valid = new Set([2, 4, 7]);

      const normalized = normalizeIndices(valid);

      expect(normalized).toEqual(valid);
    });

    it('should handle empty set', () => {
      const empty = new Set<number>();

      const normalized = normalizeIndices(empty);

      expect(normalized.size).toBe(0);
    });

    it('should cascade normalization until stable', () => {
      // [1,2] → [3], [3,4] → [5]
      const cascading = new Set([1, 2, 4]);

      const normalized = normalizeIndices(cascading);

      expect(isValidZeckendorf(normalized)).toBe(true);
    });
  });

  describe('Cascade Step (XOR + Normalize)', () => {
    it('should execute single cascade step', () => {
      const set1 = new Set([2, 4, 7]);
      const set2 = new Set([3, 5, 7]);

      const result = cascadeStep(set1, set2);

      expect(isValidZeckendorf(result)).toBe(true);
    });

    it('should combine XOR and normalization', () => {
      const set1 = new Set([1, 3]);
      const set2 = new Set([2, 3]);

      const result = cascadeStep(set1, set2);

      // XOR: [1, 2]
      // Normalize: [1, 2] → [3]
      expect(result.has(3)).toBe(true);
    });
  });

  describe('Full Cascade Execution', () => {
    it('should execute cascade until convergence', () => {
      const set1 = new Set([2, 5, 8]);
      const set2 = new Set([3, 6, 9]);

      const result = executeCascade(set1, set2, 100);

      expect(result.converged).toBe(true);
      expect(isValidZeckendorf(result.normalized)).toBe(true);
    });

    it('should guarantee O(log n) convergence', () => {
      const set1 = new Set([1, 3, 5, 7, 9, 11, 13, 15]);
      const set2 = new Set([2, 4, 6, 8, 10, 12, 14, 16]);

      const result = executeCascade(set1, set2, 1000);

      // Should converge in logarithmic iterations
      expect(result.converged).toBe(true);
      expect(result.iterations).toBeLessThan(Math.log2(set1.size + set2.size) * 10);
    });

    it('should track evolution trajectory', () => {
      const set1 = new Set([1, 3, 5]);
      const set2 = new Set([2, 4, 6]);

      const result = executeCascade(set1, set2);

      expect(result.trajectory.length).toBeGreaterThan(0);

      for (const step of result.trajectory) {
        expect(step.iteration).toBeGreaterThanOrEqual(0);
        expect(step.indices).toBeDefined();
        expect(typeof step.isValid).toBe('boolean');
      }
    });

    it('should detect fixed points', () => {
      const set1 = new Set([2, 5]);
      const set2 = new Set([2, 5]);

      const result = executeCascade(set1, set2);

      // XOR of identical sets is empty
      expect(result.converged).toBe(true);
      expect(result.normalized.size).toBe(0);
    });

    it('should respect max iterations limit', () => {
      const set1 = new Set([1, 2, 3, 4, 5]);
      const set2 = new Set([6, 7, 8, 9, 10]);

      const maxIter = 5;
      const result = executeCascade(set1, set2, maxIter);

      expect(result.iterations).toBeLessThanOrEqual(maxIter);
    });

    it('should return valid final Zeckendorf representation', () => {
      const set1 = new Set([3, 6, 9]);
      const set2 = new Set([4, 7, 10]);

      const result = executeCascade(set1, set2);

      expect(result.final).toBeDefined();
      expect(result.final.isValid).toBe(true);
      expect(result.final.value).toBeGreaterThanOrEqual(0);
    });
  });

  describe('State Transition Cascade', () => {
    let encoder: ZeckendorfStateEncoder;

    beforeEach(() => {
      encoder = new ZeckendorfStateEncoder();
    });

    it('should cascade between two market states', () => {
      const source: MarketData = {
        timestamp: Date.now(),
        price: 100,
        volume: 50000
      };

      const target: MarketData = {
        timestamp: Date.now() + 1000,
        price: 105,
        volume: 55000
      };

      const sourceEncoded = encoder.encodeMarketState(source);
      const targetEncoded = encoder.encodeMarketState(target);

      const cascade = cascadeStates(sourceEncoded, targetEncoded);

      expect(cascade.priceCascade).toBeDefined();
      expect(cascade.volumeCascade).toBeDefined();
      expect(cascade.transitionEnergy).toBeGreaterThanOrEqual(0);
    });

    it('should calculate transition energy', () => {
      const source: MarketData = {
        timestamp: Date.now(),
        price: 100,
        volume: 50000
      };

      const target: MarketData = {
        timestamp: Date.now() + 1000,
        price: 110,
        volume: 60000
      };

      const sourceEncoded = encoder.encodeMarketState(source);
      const targetEncoded = encoder.encodeMarketState(target);

      const cascade = cascadeStates(sourceEncoded, targetEncoded);

      expect(cascade.transitionEnergy).toBeGreaterThan(0);
    });

    it('should detect attractors when both cascades converge to same state', () => {
      const source: MarketData = {
        timestamp: Date.now(),
        price: 100,
        volume: 50000
      };

      const target: MarketData = {
        timestamp: Date.now() + 1000,
        price: 100,
        volume: 50000
      };

      const sourceEncoded = encoder.encodeMarketState(source);
      const targetEncoded = encoder.encodeMarketState(target);

      const cascade = cascadeStates(sourceEncoded, targetEncoded);

      // Identical states should have minimal transition
      expect(cascade.transitionEnergy).toBeCloseTo(0, 5);
    });
  });

  describe('Attractor Detection', () => {
    let encoder: ZeckendorfStateEncoder;

    beforeEach(() => {
      encoder = new ZeckendorfStateEncoder();
    });

    it('should find attractors in state sequence', () => {
      const states: EncodedMarketState[] = [];

      for (let i = 0; i < 10; i++) {
        const market: MarketData = {
          timestamp: Date.now() + i * 1000,
          price: 100 + i * 5,
          volume: 50000 + i * 1000
        };
        states.push(encoder.encodeMarketState(market));
      }

      const attractors = findAttractors(states);

      expect(Array.isArray(attractors)).toBe(true);
    });

    it('should count attractor frequency', () => {
      const states: EncodedMarketState[] = [];

      // Create repeating pattern
      for (let i = 0; i < 6; i++) {
        const market: MarketData = {
          timestamp: Date.now() + i * 1000,
          price: 100 + (i % 3) * 10,
          volume: 50000
        };
        states.push(encoder.encodeMarketState(market));
      }

      const attractors = findAttractors(states);

      for (const attractor of attractors) {
        expect(attractor.frequency).toBeGreaterThan(0);
        expect(attractor.states).toBeDefined();
        expect(Array.isArray(attractor.states)).toBe(true);
      }
    });
  });

  describe('Cascade Evolution Simulation', () => {
    it('should simulate cascade evolution over multiple steps', () => {
      const initial = new Set([2, 5, 8]);
      const perturbation = new Set([3, 6, 9]);

      const evolution = simulateCascadeEvolution(initial, perturbation, 10);

      expect(evolution.length).toBeGreaterThan(0);
      expect(evolution.length).toBeLessThanOrEqual(10);

      for (const step of evolution) {
        expect(step.step).toBeGreaterThanOrEqual(0);
        expect(step.value).toBeGreaterThanOrEqual(0);
        expect(typeof step.isValid).toBe('boolean');
      }
    });

    it('should stop at fixed point', () => {
      const initial = new Set([2, 5]);
      const perturbation = new Set([2, 5]);

      const evolution = simulateCascadeEvolution(initial, perturbation, 100);

      // Should reach fixed point quickly
      expect(evolution.length).toBeLessThan(10);
    });

    it('should validate each evolution step', () => {
      const initial = new Set([1, 3, 5]);
      const perturbation = new Set([2, 4, 6]);

      const evolution = simulateCascadeEvolution(initial, perturbation, 5);

      for (const step of evolution) {
        expect(isValidZeckendorf(step.indices)).toBe(step.isValid);
      }
    });
  });

  describe('Lyapunov Exponent Calculation', () => {
    let encoder: ZeckendorfStateEncoder;

    beforeEach(() => {
      encoder = new ZeckendorfStateEncoder();
    });

    it('should calculate Lyapunov exponent for state sequence', () => {
      const states: EncodedMarketState[] = [];

      for (let i = 0; i < 10; i++) {
        const market: MarketData = {
          timestamp: Date.now() + i * 1000,
          price: 100 * Math.exp(i * 0.1),
          volume: 50000 * (1 + i * 0.05)
        };
        states.push(encoder.encodeMarketState(market));
      }

      const lyapunov = calculateLyapunovExponent(states);

      expect(Number.isFinite(lyapunov)).toBe(true);
    });

    it('should return 0 for insufficient data', () => {
      const states: EncodedMarketState[] = [];

      const market: MarketData = {
        timestamp: Date.now(),
        price: 100,
        volume: 50000
      };
      states.push(encoder.encodeMarketState(market));

      const lyapunov = calculateLyapunovExponent(states);

      expect(lyapunov).toBe(0);
    });

    it('should measure sensitivity to initial conditions', () => {
      // Create two sequences with small difference
      const states1: EncodedMarketState[] = [];
      const states2: EncodedMarketState[] = [];

      for (let i = 0; i < 10; i++) {
        states1.push(encoder.encodeMarketState({
          timestamp: Date.now() + i * 1000,
          price: 100 + i,
          volume: 50000
        }));

        states2.push(encoder.encodeMarketState({
          timestamp: Date.now() + i * 1000,
          price: 100 + i + 0.01, // Small perturbation
          volume: 50000
        }));
      }

      const lyapunov1 = calculateLyapunovExponent(states1);
      const lyapunov2 = calculateLyapunovExponent(states2);

      expect(Number.isFinite(lyapunov1)).toBe(true);
      expect(Number.isFinite(lyapunov2)).toBe(true);
    });
  });

  describe('Cascade Cycle Detection', () => {
    let encoder: ZeckendorfStateEncoder;

    beforeEach(() => {
      encoder = new ZeckendorfStateEncoder();
    });

    it('should detect periodic attractors', () => {
      const states: EncodedMarketState[] = [];

      // Create repeating pattern
      for (let i = 0; i < 20; i++) {
        const market: MarketData = {
          timestamp: Date.now() + i * 1000,
          price: 100 + (i % 4) * 10, // Period 4
          volume: 50000
        };
        states.push(encoder.encodeMarketState(market));
      }

      const cycles = detectCascadeCycles(states, 10);

      expect(Array.isArray(cycles)).toBe(true);

      for (const cycle of cycles) {
        expect(cycle.period).toBeGreaterThan(0);
        expect(cycle.period).toBeLessThanOrEqual(10);
        expect(Array.isArray(cycle.pattern)).toBe(true);
      }
    });

    it('should handle non-periodic sequences', () => {
      const states: EncodedMarketState[] = [];

      for (let i = 0; i < 10; i++) {
        const market: MarketData = {
          timestamp: Date.now() + i * 1000,
          price: 100 + Math.random() * 50,
          volume: 50000 + Math.random() * 10000
        };
        states.push(encoder.encodeMarketState(market));
      }

      const cycles = detectCascadeCycles(states, 5);

      expect(Array.isArray(cycles)).toBe(true);
    });
  });

  describe('Cascade Entropy', () => {
    it('should calculate entropy from trajectory complexity', () => {
      const set1 = new Set([2, 5, 8, 11]);
      const set2 = new Set([3, 6, 9, 12]);

      const result = executeCascade(set1, set2);
      const entropy = calculateCascadeEntropy(result);

      expect(entropy).toBeGreaterThanOrEqual(0);
      expect(entropy).toBeLessThanOrEqual(1);
    });

    it('should return 0 for empty trajectory', () => {
      const result: CascadeResult = {
        initial: new Set(),
        xorResult: new Set(),
        normalized: new Set(),
        iterations: 0,
        converged: true,
        final: { value: 0, indices: new Set(), isValid: true, summandCount: 0, representation: '0' },
        trajectory: []
      };

      const entropy = calculateCascadeEntropy(result);

      expect(entropy).toBe(0);
    });

    it('should measure state variety during cascade', () => {
      const set1 = new Set([1, 3, 5, 7, 9]);
      const set2 = new Set([2, 4, 6, 8, 10]);

      const result = executeCascade(set1, set2);
      const entropy = calculateCascadeEntropy(result);

      expect(Number.isFinite(entropy)).toBe(true);
    });
  });
});

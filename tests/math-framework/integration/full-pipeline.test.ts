/**
 * Integration Tests for Full Mathematical Framework Pipeline
 *
 * Tests end-to-end integration of all components:
 * - Sequences → Decomposition → Divergence → Nash → Neural
 * - Cross-level dependencies and data flow
 * - Complete mathematical framework consistency
 */

import { describe, it, expect } from '@jest/globals';
import {
  fibonacci,
  lucas,
  fibonacciSequence,
  lucasSequence,
  FibonacciLucasRelations
} from '../../../src/math-framework/sequences/fibonacci';

import {
  zeckendorfDecompose,
  Z,
  z,
  batchDecompose
} from '../../../src/math-framework/decomposition/zeckendorf';

import {
  computeV,
  computeU,
  computeS,
  analyzeBKTheorem,
  findNashEquilibria
} from '../../../src/math-framework/divergence/behrend-kimberling';

import {
  QNetwork,
  Matrix,
  type QNetworkConfig
} from '../../../src/math-framework/neural/q-network';

describe('Full Pipeline Integration', () => {
  describe('Sequences → Decomposition Pipeline', () => {
    it('should generate sequences and decompose each number', () => {
      const n = 20;
      const fibSeq = fibonacciSequence(n);

      // Decompose each Fibonacci number
      for (let i = 1; i <= n; i++) {
        const fibValue = Number(fibSeq[i]);
        const decomp = zeckendorfDecompose(fibValue);

        // Every Fibonacci number should have a single-term decomposition (itself)
        expect(decomp.summandCount).toBe(1);
        expect(decomp.isValid).toBe(true);
        expect(decomp.values[0]).toBe(fibValue);
      }
    });

    it('should decompose range and verify all are valid', () => {
      const numbers = Array.from({ length: 50 }, (_, i) => i + 1);
      const decompositions = batchDecompose(numbers);

      expect(decompositions).toHaveLength(50);

      for (const decomp of decompositions) {
        expect(decomp.isValid).toBe(true);

        // Verify sum equals original
        const sum = decomp.values.reduce((a, b) => a + b, 0);
        expect(sum).toBe(decomp.n);

        // Verify no consecutive indices
        const indices = Array.from(decomp.indices).sort((a, b) => a - b);
        for (let i = 0; i < indices.length - 1; i++) {
          expect(indices[i + 1] - indices[i]).toBeGreaterThan(1);
        }
      }
    });

    it('should maintain relationships across sequences', () => {
      const parallel = FibonacciLucasRelations.parallelSequences(15);

      for (const { n, fibonacci: fn, lucas: ln } of parallel) {
        if (n > 0) {
          // Verify Lucas-Fibonacci relationship
          const fn_minus_1 = fibonacci(n - 1);
          const fn_plus_1 = fibonacci(n + 1);
          expect(ln).toBe(fn_minus_1 + fn_plus_1);
        }
      }
    });
  });

  describe('Decomposition → Divergence Pipeline', () => {
    it('should compute divergence from decomposition counts', () => {
      const n = 50;

      // Get Zeckendorf counts for range
      const zCounts = Array.from({ length: n + 1 }, (_, i) => z(BigInt(i)));

      // Verify cumulative V matches
      let cumulativeZ = 0;
      for (let i = 0; i <= n; i++) {
        cumulativeZ += zCounts[i];
        const v = computeV(i);
        expect(v).toBe(cumulativeZ);
      }
    });

    it('should maintain B-K inequality across range', () => {
      const analysis = analyzeBKTheorem(100);

      for (const point of analysis.points) {
        // S(n) = V(n) - U(n) ≥ 0
        expect(point.S).toBeGreaterThanOrEqual(0);
        expect(point.S).toBe(point.V - point.U);

        // d(n) = z(n) - ℓ(n)
        expect(point.d).toBe(point.z_n - point.l_n);
      }
    });

    it('should identify Nash points consistently', () => {
      const n = 100;
      const equilibria = findNashEquilibria(n);
      const analysis = analyzeBKTheorem(n);

      expect(equilibria.length).toBe(analysis.nashEquilibria.length);

      // All equilibria should have S(n) = 0
      for (const nashN of equilibria) {
        const s = computeS(nashN);
        expect(s).toBe(0);
      }

      // Nash points should match Lucas predictions
      expect(analysis.nashEquilibria.length).toBe(analysis.lucasPoints.length);
    });
  });

  describe('Divergence → Nash → Neural Pipeline', () => {
    it('should train neural network on Nash equilibrium detection', () => {
      // Generate training data from B-K analysis
      const analysis = analyzeBKTheorem(30);

      const X: Matrix[] = [];
      const Y: Matrix[] = [];

      for (const point of analysis.points) {
        // Input: [n, V(n), U(n)]
        const input = Matrix.from2D([[point.n], [point.V], [point.U]]);
        X.push(input);

        // Output: [isNash ? 1 : 0]
        const output = Matrix.from2D([[point.isNashEquilibrium ? 1 : 0]]);
        Y.push(output);
      }

      // Train network
      const config: QNetworkConfig = {
        layers: [3, 4, 1],
        activations: ['tanh', 'sigmoid'],
        learningRate: 0.1,
        lambda: 0.1,
        maxIterations: 200,
        nashThreshold: 0.01
      };

      const network = new QNetwork(config);
      const result = network.train(X, Y, { verbose: false });

      // Network should converge
      expect(result.iterations).toBeGreaterThan(0);
      expect(result.finalLoss).toBeLessThan(result.trajectories[0].loss);

      // Test prediction
      const testPoint = analysis.points[10];
      const testInput = Matrix.from2D([[testPoint.n], [testPoint.V], [testPoint.U]]);
      const prediction = network.predict(testInput);

      expect(prediction.rows).toBe(1);
      expect(prediction.cols).toBe(1);
    });

    it('should converge faster with S(n) regularization', () => {
      const analysis = analyzeBKTheorem(20);

      const X: Matrix[] = [];
      const Y: Matrix[] = [];

      for (const point of analysis.points.slice(0, 15)) {
        const input = Matrix.from2D([[point.S], [point.d]]);
        X.push(input);

        const output = Matrix.from2D([[point.isNashEquilibrium ? 1 : 0]]);
        Y.push(output);
      }

      // Network without regularization
      const config1: QNetworkConfig = {
        layers: [2, 3, 1],
        lambda: 0,
        maxIterations: 200
      };

      const network1 = new QNetwork(config1);
      const result1 = network1.train(X, Y, { verbose: false });

      // Network with S(n) regularization
      const config2: QNetworkConfig = {
        layers: [2, 3, 1],
        lambda: 0.5,
        maxIterations: 200,
        nashThreshold: 0.01
      };

      const network2 = new QNetwork(config2);
      const result2 = network2.train(X, Y, { verbose: false });

      // Regularized network should have better Nash properties
      expect(result2.finalS_n).toBeLessThanOrEqual(result1.finalS_n);
    });
  });

  describe('End-to-End: Fibonacci → Nash → Neural', () => {
    it('should process complete pipeline for small dataset', () => {
      // Step 1: Generate Fibonacci sequence
      const fibSeq = fibonacciSequence(20);
      expect(fibSeq).toHaveLength(21);

      // Step 2: Decompose each number
      const decompositions = fibSeq.slice(1, 15).map(fn =>
        zeckendorfDecompose(Number(fn))
      );
      expect(decompositions.every(d => d.isValid)).toBe(true);

      // Step 3: Analyze B-K theorem
      const analysis = analyzeBKTheorem(20);
      expect(analysis.theoremVerified).toBe(true);
      expect(analysis.nashEquilibria.length).toBeGreaterThan(0);

      // Step 4: Train neural network
      const X: Matrix[] = [];
      const Y: Matrix[] = [];

      for (const point of analysis.points) {
        X.push(Matrix.from2D([[point.n]]));
        Y.push(Matrix.from2D([[point.S]]));
      }

      const network = new QNetwork({
        layers: [1, 3, 1],
        maxIterations: 100
      });

      const result = network.train(X, Y, { verbose: false });

      expect(result.iterations).toBeGreaterThan(0);
      expect(result.trajectories.length).toBeGreaterThan(0);
    });

    it('should maintain mathematical consistency across all levels', () => {
      const n = 30;

      // Level 1-3: Sequences
      const fibSeq = fibonacciSequence(n);
      const lucSeq = lucasSequence(n);

      // Level 4: Decomposition
      const decomps = Array.from({ length: n }, (_, i) =>
        zeckendorfDecompose(i + 1)
      );

      // Level 5: Divergence
      const analysis = analyzeBKTheorem(n);

      // Verify consistency
      expect(fibSeq).toHaveLength(n + 1);
      expect(lucSeq).toHaveLength(n + 1);
      expect(decomps).toHaveLength(n);
      expect(analysis.points).toHaveLength(n + 1);

      // Verify all decompositions are valid
      expect(decomps.every(d => d.isValid)).toBe(true);

      // Verify theorem
      expect(analysis.theoremVerified).toBe(true);
      expect(analysis.violations).toHaveLength(0);

      // Verify Nash points
      for (const nash of analysis.nashEquilibria) {
        expect(nash.S).toBe(0);
        expect(nash.isLucasPrediction).toBe(true);
      }
    });
  });

  describe('Cross-Level Dependencies', () => {
    it('should handle dependencies correctly', () => {
      // Fibonacci → Lucas (Level 2 depends on Level 1)
      for (let n = 1; n <= 20; n++) {
        const lucasN = lucas(n);
        const fn_minus_1 = fibonacci(n - 1);
        const fn_plus_1 = fibonacci(n + 1);
        expect(lucasN).toBe(fn_minus_1 + fn_plus_1);
      }

      // Decomposition → Sequences (Level 4 depends on Level 1)
      const decomp = zeckendorfDecompose(10);
      for (const value of decomp.values) {
        // Each value should be a Fibonacci number
        let isFib = false;
        for (let i = 0; i <= 20; i++) {
          if (Number(fibonacci(i)) === value) {
            isFib = true;
            break;
          }
        }
        expect(isFib).toBe(true);
      }

      // Divergence → Decomposition (Level 5 depends on Level 4)
      const v10 = computeV(10);
      let manualSum = 0;
      for (let i = 0; i <= 10; i++) {
        manualSum += z(BigInt(i));
      }
      expect(v10).toBe(manualSum);
    });

    it('should propagate changes correctly', () => {
      // If Fibonacci changes, decomposition should change
      const fibN = fibonacci(10);
      const decomp = zeckendorfDecompose(Number(fibN));

      // Fibonacci numbers decompose to themselves
      expect(decomp.summandCount).toBe(1);
      expect(decomp.values[0]).toBe(Number(fibN));

      // If decomposition changes, divergence should change
      const z10 = z(BigInt(10));
      const v10 = computeV(10);

      // V includes z(10) in its sum
      const v9 = computeV(9);
      expect(v10).toBe(v9 + z10);
    });
  });

  describe('Data Flow Validation', () => {
    it('should maintain data integrity through pipeline', () => {
      const n = 25;

      // Generate base data
      const fibSeq = fibonacciSequence(n);
      const lucSeq = lucasSequence(n);

      // Process through decomposition
      const decomps = [];
      for (let i = 1; i <= n; i++) {
        const d = zeckendorfDecompose(i);
        decomps.push(d);

        // Verify each decomposition
        const sum = d.values.reduce((a, b) => a + b, 0);
        expect(sum).toBe(i);
      }

      // Process through divergence
      const analysis = analyzeBKTheorem(n);

      // Verify data flow
      for (let i = 0; i <= n; i++) {
        const point = analysis.points[i];

        // Point should correspond to index
        expect(point.n).toBe(i);

        // V should be cumulative z
        let expectedV = 0;
        for (let k = 0; k <= i; k++) {
          expectedV += z(BigInt(k));
        }
        expect(point.V).toBe(expectedV);

        // S should be V - U
        expect(point.S).toBe(point.V - point.U);
      }
    });

    it('should handle batch operations correctly', () => {
      const numbers = Array.from({ length: 50 }, (_, i) => i + 1);

      // Batch decompose
      const start1 = Date.now();
      const batchResults = batchDecompose(numbers);
      const duration1 = Date.now() - start1;

      // Individual decompose
      const start2 = Date.now();
      const individualResults = numbers.map(n => zeckendorfDecompose(n));
      const duration2 = Date.now() - start2;

      // Results should match
      expect(batchResults).toHaveLength(individualResults.length);
      for (let i = 0; i < batchResults.length; i++) {
        expect(batchResults[i].n).toBe(individualResults[i].n);
        expect(batchResults[i].summandCount).toBe(individualResults[i].summandCount);
      }

      // Batch should be competitive
      expect(duration1).toBeLessThan(duration2 * 2);
    });
  });

  describe('System-Wide Consistency', () => {
    it('should maintain all invariants across full system', () => {
      const n = 40;

      // Generate all data
      const fibSeq = fibonacciSequence(n);
      const lucSeq = lucasSequence(n);
      const analysis = analyzeBKTheorem(n);

      // Invariant 1: Fibonacci recurrence
      for (let i = 2; i <= n; i++) {
        expect(fibSeq[i]).toBe(fibSeq[i-1] + fibSeq[i-2]);
      }

      // Invariant 2: Lucas recurrence
      for (let i = 2; i <= n; i++) {
        expect(lucSeq[i]).toBe(lucSeq[i-1] + lucSeq[i-2]);
      }

      // Invariant 3: Zeckendorf uniqueness
      for (let i = 1; i <= n; i++) {
        const decomp = zeckendorfDecompose(i);
        expect(decomp.isValid).toBe(true);
      }

      // Invariant 4: B-K inequality
      for (const point of analysis.points) {
        expect(point.S).toBeGreaterThanOrEqual(0);
      }

      // Invariant 5: Nash equivalence
      for (const point of analysis.points) {
        expect(point.isNashEquilibrium).toBe(point.S === 0);
        expect(point.isNashEquilibrium).toBe(point.isLucasPrediction);
      }

      // Invariant 6: Theorem verification
      expect(analysis.theoremVerified).toBe(true);
      expect(analysis.violations).toHaveLength(0);
    });

    it('should scale efficiently across all components', () => {
      const start = Date.now();

      // Full pipeline for n=100
      const fibSeq = fibonacciSequence(100);
      const decomps = batchDecompose(Array.from({ length: 50 }, (_, i) => i + 1));
      const analysis = analyzeBKTheorem(100);

      // Simple neural network
      const X = [Matrix.from2D([[1], [2], [3]])];
      const Y = [Matrix.from2D([[2]])];
      const network = new QNetwork({ layers: [3, 2, 1], maxIterations: 50 });
      network.train(X, Y, { verbose: false });

      const duration = Date.now() - start;

      expect(fibSeq).toHaveLength(101);
      expect(decomps).toHaveLength(50);
      expect(analysis.points).toHaveLength(101);
      expect(duration).toBeLessThan(5000); // Should complete in < 5s
    });
  });
});

describe('Error Propagation and Recovery', () => {
  it('should handle errors gracefully across pipeline', () => {
    // Invalid decomposition should not crash analysis
    expect(() => zeckendorfDecompose(-1)).toThrow();
    expect(() => zeckendorfDecompose(0)).toThrow();

    // Invalid inputs should be caught early
    expect(() => fibonacci(-1)).toThrow();
    expect(() => lucas(-1)).toThrow();

    // System should continue working after error
    const fibN = fibonacci(10);
    expect(fibN).toBe(55n);
  });

  it('should maintain consistency after partial failures', () => {
    const analysis = analyzeBKTheorem(20);

    // Even if we can't compute one point, others should be valid
    const validPoints = analysis.points.filter(p => p.S >= 0);
    expect(validPoints.length).toBe(analysis.points.length);
  });
});

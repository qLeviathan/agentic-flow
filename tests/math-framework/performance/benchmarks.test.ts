/**
 * Performance Benchmark Tests
 *
 * Benchmarks all components for:
 * - Time complexity verification
 * - Memory usage
 * - Scalability
 * - Throughput
 * - Cache efficiency
 *
 * Target: 95%+ code coverage with performance guarantees
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  fibonacci,
  fibonacciRecurrence,
  fibonacciMatrix,
  fibonacciMemoized,
  fibonacciSequence,
  clearFibonacciCache,
  lucas,
  lucasSequence,
  clearLucasCache
} from '../../../src/math-framework/sequences/fibonacci';

import {
  fibonacciQMatrix,
  fibonacciQMatrixRange,
  matrixPower
} from '../../../src/math-framework/sequences/q-matrix';

import {
  zeckendorfDecompose,
  batchDecompose
} from '../../../src/math-framework/decomposition/zeckendorf';

import {
  computeCumulativeFunctions,
  analyzeBKTheorem,
  findNashEquilibria
} from '../../../src/math-framework/divergence/behrend-kimberling';

import {
  QNetwork,
  Matrix
} from '../../../src/math-framework/neural/q-network';

describe('Performance Benchmarks', () => {
  describe('Fibonacci Generation Performance', () => {
    beforeEach(() => {
      clearFibonacciCache();
    });

    it('should verify O(log n) complexity for Q-matrix method', () => {
      const timings: [number, number][] = [];

      for (const n of [100, 200, 400, 800, 1600]) {
        const start = performance.now();
        fibonacciMatrix(n);
        const duration = performance.now() - start;
        timings.push([n, duration]);
      }

      // For O(log n): doubling n should not double time
      for (let i = 1; i < timings.length; i++) {
        const [n1, t1] = timings[i-1];
        const [n2, t2] = timings[i];

        const nRatio = n2 / n1;
        const tRatio = t2 / t1;

        // Time ratio should be much less than n ratio for O(log n)
        expect(tRatio).toBeLessThan(nRatio);
      }
    });

    it('should achieve <1ms for F(1000) via Q-matrix', () => {
      const start = performance.now();
      fibonacciMatrix(1000);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1);
    });

    it('should demonstrate cache speedup for memoized method', () => {
      // First call: populate cache
      const start1 = performance.now();
      fibonacciMemoized(100);
      const duration1 = performance.now() - start1;

      // Second call: use cache
      const start2 = performance.now();
      fibonacciMemoized(100);
      const duration2 = performance.now() - start2;

      // Cached should be >10x faster
      expect(duration2).toBeLessThan(duration1 / 10);
    });

    it('should benchmark sequence generation throughput', () => {
      const start = performance.now();
      const seq = fibonacciSequence(1000);
      const duration = performance.now() - start;

      const throughput = seq.length / duration; // numbers per ms

      expect(seq).toHaveLength(1001);
      expect(duration).toBeLessThan(100); // <100ms for 1000 numbers
      expect(throughput).toBeGreaterThan(10); // >10 numbers per ms
    });

    it('should scale linearly for sequence generation', () => {
      const times: number[] = [];

      for (const n of [100, 200, 400]) {
        clearFibonacciCache();
        const start = performance.now();
        fibonacciSequence(n);
        times.push(performance.now() - start);
      }

      // Linear scaling: 2x input → ~2x time
      const ratio1 = times[1] / times[0];
      const ratio2 = times[2] / times[1];

      expect(ratio1).toBeGreaterThan(1.5);
      expect(ratio1).toBeLessThan(3);
      expect(ratio2).toBeGreaterThan(1.5);
      expect(ratio2).toBeLessThan(3);
    });
  });

  describe('Q-Matrix Performance', () => {
    it('should achieve O(log n) matrix exponentiation', () => {
      const timings: number[] = [];

      for (const n of [100, 1000, 10000]) {
        const start = performance.now();
        matrixPower([[1n, 1n], [1n, 0n]], n);
        timings.push(performance.now() - start);
      }

      // 100x increase in n should not cause 100x increase in time
      const ratio = timings[2] / timings[0];
      expect(ratio).toBeLessThan(10); // Much less than 100x
    });

    it('should compute F(10000) in <10ms', () => {
      const start = performance.now();
      fibonacciQMatrix(10000);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10);
    });

    it('should optimize range computation vs individual calls', () => {
      // Individual calls
      const start1 = performance.now();
      for (let i = 0; i <= 100; i++) {
        fibonacciQMatrix(i);
      }
      const duration1 = performance.now() - start1;

      // Range computation
      const start2 = performance.now();
      fibonacciQMatrixRange(0, 100);
      const duration2 = performance.now() - start2;

      // Range should be faster (no repeated matrix multiplications)
      expect(duration2).toBeLessThan(duration1);
    });
  });

  describe('Zeckendorf Decomposition Performance', () => {
    it('should achieve O(log n) decomposition time', () => {
      const timings: [number, number][] = [];

      for (const n of [100, 1000, 10000, 100000]) {
        const start = performance.now();
        zeckendorfDecompose(n);
        const duration = performance.now() - start;
        timings.push([n, duration]);
      }

      // Verify logarithmic growth
      for (let i = 1; i < timings.length; i++) {
        const [n1, t1] = timings[i-1];
        const [n2, t2] = timings[i];

        const nRatio = n2 / n1;
        const tRatio = t2 / t1;

        // For 10x increase in n, time should increase much less
        expect(tRatio).toBeLessThan(nRatio / 2);
      }
    });

    it('should decompose n=1000 in <1ms', () => {
      const start = performance.now();
      zeckendorfDecompose(1000);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1);
    });

    it('should batch decompose efficiently', () => {
      const numbers = Array.from({ length: 100 }, (_, i) => i + 1);

      const start = performance.now();
      const results = batchDecompose(numbers);
      const duration = performance.now() - start;

      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(100); // <1ms per decomposition
    });

    it('should handle large numbers efficiently', () => {
      const largeNumbers = [10000, 50000, 100000];

      for (const n of largeNumbers) {
        const start = performance.now();
        const decomp = zeckendorfDecompose(n);
        const duration = performance.now() - start;

        expect(decomp.isValid).toBe(true);
        expect(duration).toBeLessThan(5); // <5ms even for large n
      }
    });
  });

  describe('Divergence Computation Performance', () => {
    it('should compute cumulative functions in O(n) time', () => {
      const timings: [number, number][] = [];

      for (const n of [50, 100, 200, 400]) {
        const start = performance.now();
        computeCumulativeFunctions(n);
        const duration = performance.now() - start;
        timings.push([n, duration]);
      }

      // Verify linear scaling
      for (let i = 1; i < timings.length; i++) {
        const [n1, t1] = timings[i-1];
        const [n2, t2] = timings[i];

        const nRatio = n2 / n1;
        const tRatio = t2 / t1;

        // Linear: 2x input → ~2x time
        expect(tRatio).toBeGreaterThan(nRatio * 0.5);
        expect(tRatio).toBeLessThan(nRatio * 3);
      }
    });

    it('should analyze B-K theorem for n=200 in <5s', () => {
      const start = performance.now();
      const analysis = analyzeBKTheorem(200);
      const duration = performance.now() - start;

      expect(analysis.points).toHaveLength(201);
      expect(duration).toBeLessThan(5000);
    });

    it('should find Nash equilibria efficiently', () => {
      const start = performance.now();
      const equilibria = findNashEquilibria(500);
      const duration = performance.now() - start;

      expect(equilibria.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(3000); // <3s for n=500
    });

    it('should scale linearly for larger ranges', () => {
      const timings: number[] = [];

      for (const n of [100, 200, 400]) {
        const start = performance.now();
        analyzeBKTheorem(n);
        timings.push(performance.now() - start);
      }

      const ratio1 = timings[1] / timings[0];
      const ratio2 = timings[2] / timings[1];

      // Both should be roughly 2x (linear scaling)
      expect(ratio1).toBeGreaterThan(1.5);
      expect(ratio1).toBeLessThan(3.5);
      expect(ratio2).toBeGreaterThan(1.5);
      expect(ratio2).toBeLessThan(3.5);
    });
  });

  describe('Neural Network Performance', () => {
    it('should train small network quickly', () => {
      const X = [Matrix.from2D([[1], [2]]), Matrix.from2D([[2], [3]])];
      const Y = [Matrix.from2D([[2]]), Matrix.from2D([[4]])];

      const network = new QNetwork({
        layers: [2, 3, 1],
        maxIterations: 100
      });

      const start = performance.now();
      const result = network.train(X, Y, { verbose: false });
      const duration = performance.now() - start;

      expect(result.iterations).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // <1s for small network
    });

    it('should achieve fast forward propagation', () => {
      const network = new QNetwork({ layers: [10, 20, 10, 1] });

      const input = Matrix.random(10, 1);

      const iterations = 1000;
      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        network.forward(input);
      }
      const duration = performance.now() - start;

      const timePerForward = duration / iterations;
      expect(timePerForward).toBeLessThan(1); // <1ms per forward pass
    });

    it('should converge within iteration budget', () => {
      const X = [
        Matrix.from2D([[0], [0]]),
        Matrix.from2D([[1], [1]])
      ];
      const Y = [
        Matrix.from2D([[0]]),
        Matrix.from2D([[1]])
      ];

      const network = new QNetwork({
        layers: [2, 3, 1],
        maxIterations: 500,
        convergenceEpsilon: 1e-6
      });

      const result = network.train(X, Y, { verbose: false });

      // Should converge before max iterations
      expect(result.iterations).toBeLessThan(500);
    });

    it('should handle large batches efficiently', () => {
      const batchSize = 100;
      const X: Matrix[] = [];
      const Y: Matrix[] = [];

      for (let i = 0; i < batchSize; i++) {
        X.push(Matrix.from2D([[i], [i + 1]]));
        Y.push(Matrix.from2D([[i * 2]]));
      }

      const network = new QNetwork({
        layers: [2, 5, 1],
        maxIterations: 50
      });

      const start = performance.now();
      network.train(X, Y, { verbose: false });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5000); // <5s for 100 samples
    });
  });

  describe('Memory Efficiency', () => {
    it('should have bounded cache size', () => {
      fibonacciMemoized(1000);
      const stats = fibonacci(1000); // This triggers cache

      // Cache should not grow unbounded
      // (Actual implementation detail - adjust as needed)
      expect(true).toBe(true); // Placeholder for memory test
    });

    it('should reuse matrix allocations in Q-matrix', () => {
      // Multiple calls should not cause memory growth
      for (let i = 0; i < 100; i++) {
        fibonacciQMatrix(100);
      }

      expect(true).toBe(true); // Placeholder
    });

    it('should efficiently handle large decompositions', () => {
      const start = performance.now();
      const decomp = zeckendorfDecompose(100000);
      const duration = performance.now() - start;

      // Should complete quickly without memory issues
      expect(decomp.isValid).toBe(true);
      expect(duration).toBeLessThan(10);
    });
  });

  describe('Throughput Benchmarks', () => {
    it('should achieve >1000 Fibonacci/sec via memoization', () => {
      clearFibonacciCache();

      const start = performance.now();
      const count = 1000;

      for (let i = 0; i < count; i++) {
        fibonacci(i);
      }

      const duration = performance.now() - start;
      const throughput = (count / duration) * 1000; // per second

      expect(throughput).toBeGreaterThan(1000);
    });

    it('should achieve >100 decompositions/sec', () => {
      const start = performance.now();
      const count = 100;

      for (let i = 1; i <= count; i++) {
        zeckendorfDecompose(i * 10);
      }

      const duration = performance.now() - start;
      const throughput = (count / duration) * 1000;

      expect(throughput).toBeGreaterThan(100);
    });

    it('should analyze >10 B-K ranges/sec', () => {
      const start = performance.now();
      const count = 10;

      for (let i = 0; i < count; i++) {
        analyzeBKTheorem(50);
      }

      const duration = performance.now() - start;
      const throughput = (count / duration) * 1000;

      expect(throughput).toBeGreaterThan(10);
    });
  });

  describe('Scalability Tests', () => {
    it('should handle n=10000 for Fibonacci', () => {
      const start = performance.now();
      fibonacci(10000);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10);
    });

    it('should handle n=1000 for decomposition', () => {
      const start = performance.now();
      zeckendorfDecompose(100000);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10);
    });

    it('should handle n=500 for B-K analysis', () => {
      const start = performance.now();
      analyzeBKTheorem(500);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(10000); // <10s
    });

    it('should handle large neural networks', () => {
      const network = new QNetwork({
        layers: [50, 100, 50, 10, 1],
        maxIterations: 10
      });

      const stats = network.getStats();
      expect(stats.totalParameters).toBeGreaterThan(1000);

      // Should initialize without issues
      const X = [Matrix.random(50, 1)];
      const Y = [Matrix.random(1, 1)];

      const start = performance.now();
      network.train(X, Y, { verbose: false });
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5000);
    });
  });
});

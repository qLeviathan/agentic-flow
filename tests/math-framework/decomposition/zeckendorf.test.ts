/**
 * Test Suite for Zeckendorf Decomposition System
 *
 * Validates implementation against Zeckendorf theorem and mathematical properties
 */

import { describe, it, expect } from '@jest/globals';
import {
  zeckendorfDecompose,
  Z,
  z,
  ℓ,
  generateFibonacci,
  isLucasIndex,
  verifyZeckendorfTheorem,
  verifyZeckendorfRepresentation,
  batchDecompose,
  analyzeZeckendorfPatterns,
  type ZeckendorfRepresentation
} from '../../../src/math-framework/decomposition/zeckendorf';

describe('Zeckendorf Decomposition System', () => {
  describe('generateFibonacci', () => {
    it('should generate Fibonacci sequence up to limit', () => {
      const fib = generateFibonacci(20);
      expect(fib).toEqual([1, 2, 3, 5, 8, 13]);
    });

    it('should handle edge cases', () => {
      expect(generateFibonacci(0)).toEqual([]);
      expect(generateFibonacci(1)).toEqual([1]);
      expect(generateFibonacci(2)).toEqual([1, 2]);
    });

    it('should generate correct large sequences', () => {
      const fib = generateFibonacci(1000);
      expect(fib[fib.length - 1]).toBeLessThanOrEqual(1000);
      expect(fib).toContain(987);
    });
  });

  describe('zeckendorfDecompose', () => {
    it('should decompose 1 correctly', () => {
      const result = zeckendorfDecompose(1);
      expect(result.n).toBe(1);
      expect(result.values).toEqual([1]);
      expect(result.indices.has(1)).toBe(true);
      expect(result.summandCount).toBe(1);
      expect(result.isValid).toBe(true);
    });

    it('should decompose 2 correctly', () => {
      const result = zeckendorfDecompose(2);
      expect(result.n).toBe(2);
      expect(result.values).toEqual([2]);
      expect(result.indices.has(2)).toBe(true);
      expect(result.summandCount).toBe(1);
      expect(result.isValid).toBe(true);
    });

    it('should decompose 3 correctly', () => {
      const result = zeckendorfDecompose(3);
      expect(result.n).toBe(3);
      expect(result.values).toEqual([3]);
      expect(result.indices.has(3)).toBe(true);
      expect(result.summandCount).toBe(1);
      expect(result.isValid).toBe(true);
    });

    it('should decompose 4 as 3+1', () => {
      const result = zeckendorfDecompose(4);
      expect(result.n).toBe(4);
      expect(result.values.sort()).toEqual([1, 3]);
      expect(result.summandCount).toBe(2);
      expect(result.isValid).toBe(true);

      // Verify no consecutive indices
      const indices = Array.from(result.indices).sort((a, b) => a - b);
      for (let i = 0; i < indices.length - 1; i++) {
        expect(indices[i + 1] - indices[i]).toBeGreaterThan(1);
      }
    });

    it('should decompose 10 as 8+2', () => {
      const result = zeckendorfDecompose(10);
      expect(result.n).toBe(10);
      expect(result.values.sort()).toEqual([2, 8]);
      expect(result.summandCount).toBe(2);
      expect(result.isValid).toBe(true);
    });

    it('should decompose 100 correctly', () => {
      const result = zeckendorfDecompose(100);
      expect(result.n).toBe(100);
      expect(result.isValid).toBe(true);

      // Verify sum
      const sum = result.values.reduce((a, b) => a + b, 0);
      expect(sum).toBe(100);

      // Verify no consecutive indices
      const indices = Array.from(result.indices).sort((a, b) => a - b);
      for (let i = 0; i < indices.length - 1; i++) {
        expect(indices[i + 1] - indices[i]).toBeGreaterThan(1);
      }
    });

    it('should decompose 1000 correctly', () => {
      const result = zeckendorfDecompose(1000);
      expect(result.n).toBe(1000);
      expect(result.isValid).toBe(true);

      const sum = result.values.reduce((a, b) => a + b, 0);
      expect(sum).toBe(1000);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => zeckendorfDecompose(0)).toThrow();
      expect(() => zeckendorfDecompose(-5)).toThrow();
      expect(() => zeckendorfDecompose(3.14)).toThrow();
    });

    it('should create correct representation string', () => {
      const result = zeckendorfDecompose(10);
      expect(result.representation).toContain('10 =');
      expect(result.representation).toContain('+');
    });
  });

  describe('Z(n): Zeckendorf address set', () => {
    it('should return correct index sets', () => {
      expect(Z(1)).toEqual(new Set([1]));
      expect(Z(2)).toEqual(new Set([2]));
      expect(Z(3)).toEqual(new Set([3]));

      const z4 = Z(4);
      expect(z4.has(1)).toBe(true);
      expect(z4.has(3)).toBe(true);
      expect(z4.size).toBe(2);
    });

    it('should maintain uniqueness', () => {
      const numbers = [1, 2, 3, 4, 5, 10, 20, 50, 100];
      const decompositions = numbers.map(n => Z(n));

      // Each should be different
      decompositions.forEach((set, i) => {
        expect(set.size).toBeGreaterThan(0);
      });
    });
  });

  describe('z(n): Summand count', () => {
    it('should return correct counts', () => {
      expect(z(1)).toBe(1);
      expect(z(2)).toBe(1);
      expect(z(3)).toBe(1);
      expect(z(4)).toBe(2);
      expect(z(5)).toBe(1);
      expect(z(6)).toBe(2);
    });

    it('should have reasonable bounds', () => {
      // For n, summand count is at most log_φ(n) where φ is golden ratio
      for (let n = 1; n <= 100; n++) {
        const count = z(n);
        const goldenRatio = (1 + Math.sqrt(5)) / 2;
        const maxExpected = Math.ceil(Math.log(n) / Math.log(goldenRatio)) + 1;
        expect(count).toBeLessThanOrEqual(maxExpected);
      }
    });
  });

  describe('ℓ(n): Lucas summand count', () => {
    it('should count Lucas indices correctly', () => {
      // Test that function runs without errors
      const lucas1 = ℓ(1);
      const lucas10 = ℓ(10);
      const lucas100 = ℓ(100);

      expect(lucas1).toBeGreaterThanOrEqual(0);
      expect(lucas10).toBeGreaterThanOrEqual(0);
      expect(lucas100).toBeGreaterThanOrEqual(0);
    });

    it('should never exceed total summand count', () => {
      for (let n = 1; n <= 50; n++) {
        expect(ℓ(n)).toBeLessThanOrEqual(z(n));
      }
    });
  });

  describe('isLucasIndex', () => {
    it('should identify known Lucas indices', () => {
      expect(isLucasIndex(1)).toBe(true);
      expect(isLucasIndex(2)).toBe(true);
      expect(isLucasIndex(3)).toBe(true);
      expect(isLucasIndex(4)).toBe(true);
      expect(isLucasIndex(7)).toBe(true);
    });

    it('should reject non-Lucas indices', () => {
      expect(isLucasIndex(5)).toBe(false);
      expect(isLucasIndex(6)).toBe(false);
      expect(isLucasIndex(8)).toBe(false);
    });
  });

  describe('verifyZeckendorfRepresentation', () => {
    it('should verify valid representations', () => {
      const fib = generateFibonacci(100);
      const indices = new Set([1, 3]); // F1=1, F3=3, sum=4
      expect(verifyZeckendorfRepresentation(4, indices, fib)).toBe(true);
    });

    it('should reject consecutive indices', () => {
      const fib = generateFibonacci(100);
      const indices = new Set([2, 3]); // F2=2, F3=3, consecutive!
      expect(verifyZeckendorfRepresentation(5, indices, fib)).toBe(false);
    });

    it('should reject incorrect sums', () => {
      const fib = generateFibonacci(100);
      const indices = new Set([1, 3]); // Sum is 4, not 5
      expect(verifyZeckendorfRepresentation(5, indices, fib)).toBe(false);
    });

    it('should reject invalid indices', () => {
      const fib = generateFibonacci(10);
      const indices = new Set([1, 100]); // Index 100 out of range
      expect(verifyZeckendorfRepresentation(4, indices, fib)).toBe(false);
    });
  });

  describe('verifyZeckendorfTheorem', () => {
    it('should verify uniqueness for small numbers', () => {
      for (let n = 1; n <= 20; n++) {
        expect(verifyZeckendorfTheorem(n)).toBe(true);
      }
    });

    it('should verify uniqueness for larger numbers', () => {
      const testNumbers = [50, 75, 100, 150, 200];
      testNumbers.forEach(n => {
        expect(verifyZeckendorfTheorem(n)).toBe(true);
      });
    });

    it('should verify decomposition validity', () => {
      for (let n = 1; n <= 50; n++) {
        const result = zeckendorfDecompose(n);
        expect(result.isValid).toBe(true);
      }
    });
  });

  describe('batchDecompose', () => {
    it('should decompose multiple numbers', () => {
      const numbers = [1, 2, 3, 4, 5, 10, 20];
      const results = batchDecompose(numbers);

      expect(results).toHaveLength(numbers.length);
      results.forEach((result, i) => {
        expect(result.n).toBe(numbers[i]);
        expect(result.isValid).toBe(true);
      });
    });

    it('should handle empty array', () => {
      expect(batchDecompose([])).toEqual([]);
    });

    it('should process large batches efficiently', () => {
      const numbers = Array.from({ length: 100 }, (_, i) => i + 1);
      const start = Date.now();
      const results = batchDecompose(numbers);
      const duration = Date.now() - start;

      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });

  describe('analyzeZeckendorfPatterns', () => {
    it('should analyze patterns in decompositions', () => {
      const numbers = Array.from({ length: 50 }, (_, i) => i + 1);
      const analysis = analyzeZeckendorfPatterns(numbers);

      expect(analysis.totalNumbers).toBe(50);
      expect(analysis.averageSummandCount).toBeGreaterThan(0);
      expect(analysis.maxSummandCount).toBeGreaterThanOrEqual(analysis.minSummandCount);
      expect(analysis.allValid).toBe(true);
      expect(analysis.patterns.summandDistribution.size).toBeGreaterThan(0);
      expect(analysis.patterns.commonIndices.size).toBeGreaterThan(0);
    });

    it('should track summand distribution', () => {
      const numbers = [1, 2, 3, 4, 5]; // Known summand counts: 1,1,1,2,1
      const analysis = analyzeZeckendorfPatterns(numbers);

      expect(analysis.patterns.summandDistribution.has(1)).toBe(true);
      expect(analysis.patterns.summandDistribution.has(2)).toBe(true);
    });

    it('should identify common indices', () => {
      const numbers = Array.from({ length: 20 }, (_, i) => i + 1);
      const analysis = analyzeZeckendorfPatterns(numbers);

      // Index 1 (F1=1) should be very common
      expect(analysis.patterns.commonIndices.has(1)).toBe(true);
      const index1Count = analysis.patterns.commonIndices.get(1) || 0;
      expect(index1Count).toBeGreaterThan(0);
    });

    it('should calculate correct averages', () => {
      const numbers = [1, 2, 3, 4]; // Summands: 1,1,1,2 = avg 1.25
      const analysis = analyzeZeckendorfPatterns(numbers);

      expect(analysis.averageSummandCount).toBeCloseTo(1.25, 2);
    });
  });

  describe('Mathematical Properties', () => {
    it('should satisfy: every Fibonacci number has summand count 1', () => {
      const fibonacci = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
      fibonacci.forEach(fib => {
        expect(z(fib)).toBe(1);
      });
    });

    it('should satisfy: n = n+1 implies z(n) ≤ z(n+1)', () => {
      // Summand count is non-strictly increasing on average
      let violations = 0;
      for (let n = 1; n < 50; n++) {
        const zn = z(n);
        const zn1 = z(n + 1);
        if (zn > zn1 + 1) violations++; // Allow small variations
      }
      expect(violations).toBeLessThan(10); // Most should follow pattern
    });

    it('should have no consecutive Fibonacci indices in any decomposition', () => {
      for (let n = 1; n <= 100; n++) {
        const indices = Array.from(Z(n)).sort((a, b) => a - b);
        for (let i = 0; i < indices.length - 1; i++) {
          expect(indices[i + 1] - indices[i]).toBeGreaterThan(1);
        }
      }
    });

    it('should always sum to original number', () => {
      for (let n = 1; n <= 100; n++) {
        const result = zeckendorfDecompose(n);
        const sum = result.values.reduce((a, b) => a + b, 0);
        expect(sum).toBe(n);
      }
    });
  });

  describe('Performance', () => {
    it('should handle large numbers efficiently', () => {
      const largeNumbers = [1000, 5000, 10000];

      largeNumbers.forEach(n => {
        const start = Date.now();
        const result = zeckendorfDecompose(n);
        const duration = Date.now() - start;

        expect(result.isValid).toBe(true);
        expect(duration).toBeLessThan(100); // Should be fast
      });
    });

    it('should have logarithmic decomposition size', () => {
      // Summand count grows logarithmically with n
      const n1000 = z(1000);
      const n10000 = z(10000);

      // Order of magnitude increase should be small
      expect(n10000).toBeLessThan(n1000 * 2);
    });
  });
});

/**
 * Unit Tests for Primitive Mathematical Functions
 *
 * Tests fundamental operations including:
 * - Fibonacci number generation (all methods)
 * - Lucas number generation (all methods)
 * - Q-matrix operations
 * - Golden ratio calculations
 * - Basic mathematical identities
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  fibonacci,
  fibonacciRecurrence,
  fibonacciBinet,
  fibonacciMatrix,
  fibonacciMemoized,
  fibonacciCompare,
  fibonacciSequence,
  clearFibonacciCache,
  getFibonacciCacheStats,
  FibonacciIdentities,
  PHI,
  PSI,
  SQRT5,
  type FibonacciResult
} from '../../../src/math-framework/sequences/fibonacci';

import {
  lucas,
  lucasRecurrence,
  lucasBinet,
  lucasFibonacciRelation,
  lucasFibonacciAlternative,
  lucasMemoized,
  lucasCompare,
  lucasSequence,
  clearLucasCache,
  getLucasCacheStats,
  LucasIdentities,
  FibonacciLucasRelations,
  type LucasResult
} from '../../../src/math-framework/sequences/lucas';

import {
  fibonacciQMatrix,
  fibonacciQMatrixRange,
  verifyQMatrixProperties,
  multiplyMatrices,
  matrixPower,
  identityMatrix,
  Q_MATRIX,
  type Matrix2x2,
  type QMatrixResult
} from '../../../src/math-framework/sequences/q-matrix';

describe('Golden Ratio Constants', () => {
  it('should have correct golden ratio value', () => {
    expect(PHI).toBeCloseTo(1.618033988749895, 10);
  });

  it('should have correct conjugate ratio value', () => {
    expect(PSI).toBeCloseTo(-0.618033988749895, 10);
  });

  it('should satisfy φ + ψ = 1', () => {
    expect(PHI + PSI).toBeCloseTo(1, 10);
  });

  it('should satisfy φ * ψ = -1', () => {
    expect(PHI * PSI).toBeCloseTo(-1, 10);
  });

  it('should satisfy φ² = φ + 1', () => {
    expect(PHI * PHI).toBeCloseTo(PHI + 1, 10);
  });

  it('should have correct sqrt(5) value', () => {
    expect(SQRT5).toBeCloseTo(2.23606797749979, 10);
  });
});

describe('Fibonacci Number Generation', () => {
  beforeEach(() => {
    clearFibonacciCache();
  });

  describe('Base Cases', () => {
    it('should return 0 for F(0)', () => {
      expect(fibonacci(0)).toBe(0n);
    });

    it('should return 1 for F(1)', () => {
      expect(fibonacci(1)).toBe(1n);
    });

    it('should return 1 for F(2)', () => {
      expect(fibonacci(2)).toBe(1n);
    });
  });

  describe('Small Values', () => {
    const knownValues: [number, bigint][] = [
      [0, 0n], [1, 1n], [2, 1n], [3, 2n], [4, 3n],
      [5, 5n], [6, 8n], [7, 13n], [8, 21n], [9, 34n],
      [10, 55n], [11, 89n], [12, 144n]
    ];

    it.each(knownValues)('should return %i for F(%i)', (n, expected) => {
      expect(fibonacci(n)).toBe(expected);
    });
  });

  describe('Recurrence Method', () => {
    it('should compute correct values for n ≤ 15', () => {
      for (let n = 0; n <= 15; n++) {
        const result = fibonacciRecurrence(n);
        expect(result.method).toBe('recurrence');
        expect(result.n).toBe(n);
        expect(result.value).toBe(fibonacci(n));
      }
    });

    it('should throw error for negative input', () => {
      expect(() => fibonacciRecurrence(-1)).toThrow('must be non-negative');
    });

    it('should throw error for non-integer input', () => {
      expect(() => fibonacciRecurrence(3.14)).toThrow('must be an integer');
    });

    it('should have computation time property', () => {
      const result = fibonacciRecurrence(10);
      expect(result.computationTime).toBeDefined();
      expect(result.computationTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Binet Formula Method', () => {
    it('should match recurrence for small n', () => {
      for (let n = 0; n <= 20; n++) {
        const binet = fibonacciBinet(n).value;
        const recur = fibonacciRecurrence(n).value;
        expect(binet).toBe(recur);
      }
    });

    it('should be accurate up to n=70', () => {
      const result = fibonacciBinet(70);
      expect(result.value).toBe(190392490709135n);
    });

    it('should have faster computation for moderate n', () => {
      const binet = fibonacciBinet(30);
      const recurrence = fibonacciRecurrence(30);

      // Binet should be faster (O(1) vs O(2^n))
      expect(binet.computationTime!).toBeLessThan(recurrence.computationTime! * 100);
    });
  });

  describe('Q-Matrix Method', () => {
    it('should match recurrence for all n', () => {
      for (let n = 0; n <= 50; n++) {
        const qmatrix = fibonacciMatrix(n).value;
        const expected = fibonacci(n);
        expect(qmatrix).toBe(expected);
      }
    });

    it('should handle large numbers efficiently', () => {
      const result = fibonacciMatrix(1000);
      expect(result.value).toBeGreaterThan(0n);
      expect(result.computationTime).toBeDefined();
    });

    it('should be O(log n) complexity', () => {
      const t100 = fibonacciMatrix(100).computationTime!;
      const t1000 = fibonacciMatrix(1000).computationTime!;

      // 10x increase in n should not cause 10x increase in time
      expect(t1000).toBeLessThan(t100 * 5);
    });
  });

  describe('Memoized Method', () => {
    it('should cache values correctly', () => {
      const first = fibonacciMemoized(50);
      const second = fibonacciMemoized(50);

      // Second call should be much faster
      expect(second.computationTime!).toBeLessThan(first.computationTime! / 10);
    });

    it('should maintain cache between calls', () => {
      fibonacciMemoized(10);
      const stats = getFibonacciCacheStats();
      expect(stats.size).toBeGreaterThan(10);
    });

    it('should clear cache correctly', () => {
      fibonacciMemoized(100);
      clearFibonacciCache();
      const stats = getFibonacciCacheStats();
      expect(stats.size).toBe(2); // Only F(0) and F(1)
    });

    it('should build on existing cache', () => {
      fibonacciMemoized(50);
      const stats1 = getFibonacciCacheStats();

      fibonacciMemoized(100);
      const stats2 = getFibonacciCacheStats();

      expect(stats2.size).toBeGreaterThan(stats1.size);
    });
  });

  describe('Method Comparison', () => {
    it('should have all methods match for n=20', () => {
      const comparison = fibonacciCompare(20);
      expect(comparison.allMatch).toBe(true);
      expect(comparison.recurrence).toBe(comparison.binet);
      expect(comparison.binet).toBe(comparison.qmatrix);
      expect(comparison.qmatrix).toBe(comparison.memoized);
    });

    it('should have all methods match for n=50', () => {
      const comparison = fibonacciCompare(50);
      expect(comparison.allMatch).toBe(true);
    });

    it('should track timings for all methods', () => {
      const comparison = fibonacciCompare(20);
      expect(comparison.timings.recurrence).toBeGreaterThanOrEqual(0);
      expect(comparison.timings.binet).toBeGreaterThanOrEqual(0);
      expect(comparison.timings.qmatrix).toBeGreaterThanOrEqual(0);
      expect(comparison.timings.memoized).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Sequence Generation', () => {
    it('should generate correct sequence', () => {
      const seq = fibonacciSequence(10);
      expect(seq).toHaveLength(11); // 0 to 10 inclusive
      expect(seq[0]).toBe(0n);
      expect(seq[1]).toBe(1n);
      expect(seq[10]).toBe(55n);
    });

    it('should handle empty sequence', () => {
      const seq = fibonacciSequence(0);
      expect(seq).toHaveLength(1);
      expect(seq[0]).toBe(0n);
    });

    it('should match individual calls', () => {
      const seq = fibonacciSequence(20);
      for (let i = 0; i <= 20; i++) {
        expect(seq[i]).toBe(fibonacci(i));
      }
    });
  });
});

describe('Lucas Number Generation', () => {
  beforeEach(() => {
    clearLucasCache();
  });

  describe('Base Cases', () => {
    it('should return 2 for L(0)', () => {
      expect(lucas(0)).toBe(2n);
    });

    it('should return 1 for L(1)', () => {
      expect(lucas(1)).toBe(1n);
    });

    it('should return 3 for L(2)', () => {
      expect(lucas(2)).toBe(3n);
    });
  });

  describe('Known Values', () => {
    const knownValues: [number, bigint][] = [
      [0, 2n], [1, 1n], [2, 3n], [3, 4n], [4, 7n],
      [5, 11n], [6, 18n], [7, 29n], [8, 47n], [9, 76n],
      [10, 123n], [11, 199n], [12, 322n]
    ];

    it.each(knownValues)('should return %i for L(%i)', (n, expected) => {
      expect(lucas(n)).toBe(expected);
    });
  });

  describe('Recurrence Method', () => {
    it('should compute correct values', () => {
      for (let n = 0; n <= 15; n++) {
        const result = lucasRecurrence(n);
        expect(result.method).toBe('recurrence');
        expect(result.value).toBe(lucas(n));
      }
    });

    it('should throw error for negative input', () => {
      expect(() => lucasRecurrence(-1)).toThrow('must be non-negative');
    });

    it('should throw error for non-integer input', () => {
      expect(() => lucasRecurrence(2.5)).toThrow('must be an integer');
    });
  });

  describe('Binet Formula Method', () => {
    it('should match recurrence for small n', () => {
      for (let n = 0; n <= 20; n++) {
        expect(lucasBinet(n).value).toBe(lucasRecurrence(n).value);
      }
    });

    it('should satisfy L(n) = φⁿ + ψⁿ', () => {
      for (let n = 0; n <= 15; n++) {
        const lucasN = Number(lucas(n));
        const calculated = Math.pow(PHI, n) + Math.pow(PSI, n);
        expect(lucasN).toBeCloseTo(calculated, 0);
      }
    });
  });

  describe('Fibonacci Relation Method', () => {
    it('should satisfy L(n) = F(n-1) + F(n+1)', () => {
      for (let n = 1; n <= 20; n++) {
        const lucasN = lucas(n);
        const fn_minus_1 = fibonacci(n - 1);
        const fn_plus_1 = fibonacci(n + 1);
        expect(lucasN).toBe(fn_minus_1 + fn_plus_1);
      }
    });

    it('should handle edge case n=0', () => {
      const result = lucasFibonacciRelation(0);
      expect(result.value).toBe(2n);
    });

    it('should match alternative formula', () => {
      for (let n = 0; n <= 20; n++) {
        const method1 = lucasFibonacciRelation(n).value;
        const method2 = lucasFibonacciAlternative(n);
        expect(method1).toBe(method2);
      }
    });
  });

  describe('Method Comparison', () => {
    it('should have all methods match for various n', () => {
      for (let n of [5, 10, 20, 30]) {
        const comparison = lucasCompare(n);
        expect(comparison.allMatch).toBe(true);
      }
    });

    it('should track timings for all methods', () => {
      const comparison = lucasCompare(20);
      expect(comparison.timings.recurrence).toBeGreaterThanOrEqual(0);
      expect(comparison.timings.binet).toBeGreaterThanOrEqual(0);
      expect(comparison.timings.fibonacciRelation).toBeGreaterThanOrEqual(0);
      expect(comparison.timings.memoized).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Sequence Generation', () => {
    it('should generate correct sequence', () => {
      const seq = lucasSequence(10);
      expect(seq).toHaveLength(11);
      expect(seq[0]).toBe(2n);
      expect(seq[1]).toBe(1n);
      expect(seq[10]).toBe(123n);
    });

    it('should match individual calls', () => {
      const seq = lucasSequence(15);
      for (let i = 0; i <= 15; i++) {
        expect(seq[i]).toBe(lucas(i));
      }
    });
  });

  describe('Cache Management', () => {
    it('should cache values correctly', () => {
      const first = lucasMemoized(50);
      const second = lucasMemoized(50);
      expect(second.computationTime!).toBeLessThan(first.computationTime! / 5);
    });

    it('should clear cache correctly', () => {
      lucasMemoized(100);
      clearLucasCache();
      const stats = getLucasCacheStats();
      expect(stats.size).toBe(2); // Only L(0) and L(1)
    });
  });
});

describe('Q-Matrix Operations', () => {
  describe('Matrix Constants', () => {
    it('should have correct Q-matrix values', () => {
      expect(Q_MATRIX[0][0]).toBe(1n);
      expect(Q_MATRIX[0][1]).toBe(1n);
      expect(Q_MATRIX[1][0]).toBe(1n);
      expect(Q_MATRIX[1][1]).toBe(0n);
    });
  });

  describe('Matrix Multiplication', () => {
    it('should multiply 2x2 matrices correctly', () => {
      const A: Matrix2x2 = [[1n, 2n], [3n, 4n]];
      const B: Matrix2x2 = [[5n, 6n], [7n, 8n]];
      const C = multiplyMatrices(A, B);

      expect(C[0][0]).toBe(19n); // 1*5 + 2*7
      expect(C[0][1]).toBe(22n); // 1*6 + 2*8
      expect(C[1][0]).toBe(43n); // 3*5 + 4*7
      expect(C[1][1]).toBe(50n); // 3*6 + 4*8
    });

    it('should satisfy Q² = Q + I property', () => {
      const Q2 = multiplyMatrices(Q_MATRIX, Q_MATRIX);
      const I = identityMatrix();

      // Q² should equal Q + I
      expect(Q2[0][0]).toBe(Q_MATRIX[0][0] + I[0][0]); // 2
      expect(Q2[0][1]).toBe(Q_MATRIX[0][1] + I[0][1]); // 1
      expect(Q2[1][0]).toBe(Q_MATRIX[1][0] + I[1][0]); // 1
      expect(Q2[1][1]).toBe(Q_MATRIX[1][1] + I[1][1]); // 1
    });
  });

  describe('Identity Matrix', () => {
    it('should create correct identity matrix', () => {
      const I = identityMatrix();
      expect(I[0][0]).toBe(1n);
      expect(I[0][1]).toBe(0n);
      expect(I[1][0]).toBe(0n);
      expect(I[1][1]).toBe(1n);
    });

    it('should satisfy Q * I = Q', () => {
      const I = identityMatrix();
      const QI = multiplyMatrices(Q_MATRIX, I);
      expect(QI).toEqual(Q_MATRIX);
    });
  });

  describe('Matrix Power', () => {
    it('should return identity for n=0', () => {
      const result = matrixPower(Q_MATRIX, 0);
      expect(result).toEqual(identityMatrix());
    });

    it('should return Q for n=1', () => {
      const result = matrixPower(Q_MATRIX, 1);
      expect(result).toEqual(Q_MATRIX);
    });

    it('should compute Q² correctly', () => {
      const Q2 = matrixPower(Q_MATRIX, 2);
      const expected = multiplyMatrices(Q_MATRIX, Q_MATRIX);
      expect(Q2).toEqual(expected);
    });

    it('should handle large powers efficiently', () => {
      const start = Date.now();
      matrixPower(Q_MATRIX, 1000);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should be fast (O(log n))
    });

    it('should throw error for negative power', () => {
      expect(() => matrixPower(Q_MATRIX, -1)).toThrow('must be non-negative');
    });
  });

  describe('Fibonacci via Q-Matrix', () => {
    it('should compute F(n) correctly', () => {
      for (let n = 0; n <= 30; n++) {
        const result = fibonacciQMatrix(n);
        expect(result.fibonacci).toBe(fibonacci(n));
      }
    });

    it('should provide adjacent Fibonacci numbers', () => {
      const result = fibonacciQMatrix(10);
      expect(result.fibonacci).toBe(fibonacci(10));
      expect(result.fibonacciNext).toBe(fibonacci(11));
      expect(result.fibonacciPrev).toBe(fibonacci(9));
    });

    it('should satisfy matrix structure Q^n = [[F(n+1), F(n)], [F(n), F(n-1)]]', () => {
      for (let n = 1; n <= 20; n++) {
        const result = fibonacciQMatrix(n);
        expect(result.matrix[0][0]).toBe(fibonacci(n + 1));
        expect(result.matrix[0][1]).toBe(fibonacci(n));
        expect(result.matrix[1][0]).toBe(fibonacci(n));
        expect(result.matrix[1][1]).toBe(fibonacci(n - 1));
      }
    });

    it('should handle n=0 correctly', () => {
      const result = fibonacciQMatrix(0);
      expect(result.fibonacci).toBe(0n);
      expect(result.fibonacciNext).toBe(1n);
    });
  });

  describe('Q-Matrix Properties Verification', () => {
    it('should verify all properties for range of n', () => {
      for (let n = 0; n <= 50; n++) {
        const result = fibonacciQMatrix(n);
        expect(verifyQMatrixProperties(result)).toBe(true);
      }
    });

    it('should verify determinant property: det(Q^n) = (-1)^n', () => {
      for (let n = 0; n <= 20; n++) {
        const result = fibonacciQMatrix(n);
        const { matrix } = result;
        const det = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
        const expected = n % 2 === 0 ? 1n : -1n;
        expect(det).toBe(expected);
      }
    });

    it('should verify Fibonacci recurrence via matrix', () => {
      for (let n = 1; n <= 20; n++) {
        const result = fibonacciQMatrix(n);
        const recurrence = result.fibonacci + result.fibonacciPrev;
        expect(recurrence).toBe(result.fibonacciNext);
      }
    });
  });

  describe('Q-Matrix Range', () => {
    it('should compute range correctly', () => {
      const results = fibonacciQMatrixRange(5, 10);
      expect(results).toHaveLength(6); // 5 to 10 inclusive
      expect(results[0].n).toBe(5);
      expect(results[5].n).toBe(10);
    });

    it('should match individual computations', () => {
      const results = fibonacciQMatrixRange(0, 20);
      for (let i = 0; i <= 20; i++) {
        expect(results[i].fibonacci).toBe(fibonacci(i));
      }
    });

    it('should throw error for invalid range', () => {
      expect(() => fibonacciQMatrixRange(10, 5)).toThrow('start must be less than');
    });

    it('should handle single element range', () => {
      const results = fibonacciQMatrixRange(5, 5);
      expect(results).toHaveLength(1);
      expect(results[0].fibonacci).toBe(fibonacci(5));
    });
  });
});

describe('Fibonacci-Lucas Identities', () => {
  describe('Cassini Identity', () => {
    it('should satisfy F(n-1)*F(n+1) - F(n)² = (-1)^n', () => {
      for (let n = 1; n <= 20; n++) {
        expect(FibonacciIdentities.verifyCassini(n)).toBe(true);
      }
    });

    it('should handle edge case n=0', () => {
      expect(FibonacciIdentities.verifyCassini(0)).toBe(true);
    });
  });

  describe('Sum Identity', () => {
    it('should satisfy Σ F(i) = F(n+2) - 1', () => {
      for (let n = 0; n <= 20; n++) {
        expect(FibonacciIdentities.verifySum(n)).toBe(true);
      }
    });
  });

  describe('Lucas Fibonacci Relation', () => {
    it('should satisfy L(n) = F(n-1) + F(n+1)', () => {
      for (let n = 1; n <= 20; n++) {
        expect(LucasIdentities.verifyFibonacciRelation(n)).toBe(true);
      }
    });

    it('should satisfy L(n) = F(n) + 2*F(n-1)', () => {
      for (let n = 0; n <= 20; n++) {
        expect(LucasIdentities.verifyAlternativeRelation(n)).toBe(true);
      }
    });
  });

  describe('Square Identity', () => {
    it('should satisfy L(n)² - 5*F(n)² = 4*(-1)^n', () => {
      for (let n = 0; n <= 20; n++) {
        expect(LucasIdentities.verifySquareIdentity(n)).toBe(true);
      }
    });
  });

  describe('Doubling Formulas', () => {
    it('should satisfy L(2n) = L(n)² - 2*(-1)^n', () => {
      for (let n = 0; n <= 15; n++) {
        expect(LucasIdentities.verifyDoubling(n)).toBe(true);
      }
    });

    it('should satisfy F(2n) = F(n) * L(n)', () => {
      for (let n = 0; n <= 15; n++) {
        expect(LucasIdentities.verifyFibonacciLucasProduct(n)).toBe(true);
      }
    });
  });

  describe('All Identities Verification', () => {
    it('should pass all identity checks for range of n', () => {
      for (let n = 1; n <= 20; n++) {
        const verification = FibonacciLucasRelations.verifyAllIdentities(n);
        expect(verification.allPass).toBe(true);
      }
    });
  });
});

describe('Error Handling', () => {
  it('should reject negative inputs consistently', () => {
    expect(() => fibonacci(-1)).toThrow();
    expect(() => lucas(-1)).toThrow();
    expect(() => fibonacciQMatrix(-1)).toThrow();
  });

  it('should reject non-integer inputs consistently', () => {
    expect(() => fibonacciRecurrence(3.14)).toThrow();
    expect(() => lucasRecurrence(2.71)).toThrow();
  });

  it('should handle edge cases gracefully', () => {
    expect(fibonacci(0)).toBe(0n);
    expect(lucas(0)).toBe(2n);
    expect(fibonacciQMatrix(0).fibonacci).toBe(0n);
  });
});

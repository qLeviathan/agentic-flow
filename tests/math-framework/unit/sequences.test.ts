/**
 * Unit Tests for Sequence Operations
 *
 * Tests advanced sequence operations including:
 * - Sequence generation and manipulation
 * - Batch operations
 * - Parallel sequence processing
 * - Sequence relationships and patterns
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  fibonacci,
  fibonacciSequence,
  clearFibonacciCache
} from '../../../src/math-framework/sequences/fibonacci';

import {
  lucas,
  lucasSequence,
  clearLucasCache,
  FibonacciLucasRelations
} from '../../../src/math-framework/sequences/lucas';

import {
  fibonacciQMatrixRange,
  type QMatrixResult
} from '../../../src/math-framework/sequences/q-matrix';

describe('Fibonacci Sequence Operations', () => {
  beforeEach(() => {
    clearFibonacciCache();
  });

  describe('Sequence Generation', () => {
    it('should generate correct sequence length', () => {
      const seq = fibonacciSequence(100);
      expect(seq).toHaveLength(101); // 0 to 100 inclusive
    });

    it('should start with correct values', () => {
      const seq = fibonacciSequence(10);
      expect(seq[0]).toBe(0n);
      expect(seq[1]).toBe(1n);
      expect(seq[2]).toBe(1n);
    });

    it('should follow recurrence relation', () => {
      const seq = fibonacciSequence(50);
      for (let i = 2; i < seq.length; i++) {
        expect(seq[i]).toBe(seq[i-1] + seq[i-2]);
      }
    });

    it('should handle edge cases', () => {
      expect(fibonacciSequence(0)).toHaveLength(1);
      expect(fibonacciSequence(1)).toHaveLength(2);
    });

    it('should be monotonically increasing for n > 0', () => {
      const seq = fibonacciSequence(30);
      for (let i = 1; i < seq.length; i++) {
        expect(seq[i]).toBeGreaterThan(seq[i-1]);
      }
    });
  });

  describe('Sequence Growth', () => {
    it('should exhibit exponential growth', () => {
      const seq = fibonacciSequence(20);
      // F(20) / F(10) should be approximately φ^10
      const ratio = Number(seq[20]) / Number(seq[10]);
      const phi = (1 + Math.sqrt(5)) / 2;
      const expectedRatio = Math.pow(phi, 10);
      expect(ratio).toBeCloseTo(expectedRatio, 0);
    });

    it('should satisfy growth bound F(n) ≥ φ^(n-2)', () => {
      const seq = fibonacciSequence(30);
      const phi = (1 + Math.sqrt(5)) / 2;

      for (let n = 2; n < seq.length; n++) {
        const lowerBound = Math.pow(phi, n - 2);
        expect(Number(seq[n])).toBeGreaterThanOrEqual(lowerBound * 0.99); // Allow small tolerance
      }
    });
  });

  describe('Sequence Ratios', () => {
    it('should converge to golden ratio', () => {
      const seq = fibonacciSequence(50);
      const phi = (1 + Math.sqrt(5)) / 2;

      // Check last few ratios converge to φ
      for (let i = 45; i < 50; i++) {
        const ratio = Number(seq[i+1]) / Number(seq[i]);
        expect(ratio).toBeCloseTo(phi, 3);
      }
    });

    it('should have alternating convergence', () => {
      const seq = fibonacciSequence(20);
      const phi = (1 + Math.sqrt(5)) / 2;

      const ratios = [];
      for (let i = 1; i < seq.length - 1; i++) {
        ratios.push(Number(seq[i+1]) / Number(seq[i]));
      }

      // Ratios should oscillate around φ and converge
      expect(ratios[ratios.length - 1]).toBeCloseTo(phi, 3);
    });
  });
});

describe('Lucas Sequence Operations', () => {
  beforeEach(() => {
    clearLucasCache();
  });

  describe('Sequence Generation', () => {
    it('should generate correct sequence length', () => {
      const seq = lucasSequence(50);
      expect(seq).toHaveLength(51);
    });

    it('should start with L(0)=2, L(1)=1', () => {
      const seq = lucasSequence(10);
      expect(seq[0]).toBe(2n);
      expect(seq[1]).toBe(1n);
    });

    it('should follow recurrence relation', () => {
      const seq = lucasSequence(30);
      for (let i = 2; i < seq.length; i++) {
        expect(seq[i]).toBe(seq[i-1] + seq[i-2]);
      }
    });

    it('should be monotonically increasing for n > 1', () => {
      const seq = lucasSequence(20);
      for (let i = 2; i < seq.length; i++) {
        expect(seq[i]).toBeGreaterThan(seq[i-1]);
      }
    });
  });

  describe('Lucas-Fibonacci Relationships', () => {
    it('should satisfy L(n) = F(n-1) + F(n+1)', () => {
      const lucasSeq = lucasSequence(20);

      for (let n = 1; n <= 20; n++) {
        const fn_minus_1 = fibonacci(n - 1);
        const fn_plus_1 = fibonacci(n + 1);
        expect(lucasSeq[n]).toBe(fn_minus_1 + fn_plus_1);
      }
    });

    it('should satisfy L(n) = F(n) + 2*F(n-1)', () => {
      const lucasSeq = lucasSequence(20);

      for (let n = 0; n <= 20; n++) {
        const fn = fibonacci(n);
        const fn_minus_1 = n > 0 ? fibonacci(n - 1) : 0n;
        expect(lucasSeq[n]).toBe(fn + 2n * fn_minus_1);
      }
    });

    it('should have ratio converge to φ', () => {
      const seq = lucasSequence(50);
      const phi = (1 + Math.sqrt(5)) / 2;

      for (let i = 45; i < 50; i++) {
        const ratio = Number(seq[i+1]) / Number(seq[i]);
        expect(ratio).toBeCloseTo(phi, 3);
      }
    });
  });
});

describe('Parallel Sequence Processing', () => {
  beforeEach(() => {
    clearFibonacciCache();
    clearLucasCache();
  });

  describe('Fibonacci-Lucas Parallel Generation', () => {
    it('should generate both sequences efficiently', () => {
      const parallel = FibonacciLucasRelations.parallelSequences(20);

      expect(parallel).toHaveLength(21);

      for (let i = 0; i <= 20; i++) {
        expect(parallel[i].n).toBe(i);
        expect(parallel[i].fibonacci).toBe(fibonacci(i));
        expect(parallel[i].lucas).toBe(lucas(i));
      }
    });

    it('should maintain relationships in parallel data', () => {
      const parallel = FibonacciLucasRelations.parallelSequences(15);

      for (let i = 1; i < parallel.length; i++) {
        const fn_minus_1 = parallel[i-1].fibonacci;
        const fn_plus_1 = i < parallel.length - 1 ? parallel[i+1].fibonacci : fibonacci(i+1);
        const lucasN = parallel[i].lucas;

        expect(lucasN).toBe(fn_minus_1 + fn_plus_1);
      }
    });

    it('should handle large ranges efficiently', () => {
      const start = Date.now();
      const parallel = FibonacciLucasRelations.parallelSequences(100);
      const duration = Date.now() - start;

      expect(parallel).toHaveLength(101);
      expect(duration).toBeLessThan(1000); // Should complete quickly
    });
  });

  describe('Q-Matrix Range Operations', () => {
    it('should generate range efficiently', () => {
      const range = fibonacciQMatrixRange(0, 50);

      expect(range).toHaveLength(51);
      expect(range[0].n).toBe(0);
      expect(range[50].n).toBe(50);
    });

    it('should maintain matrix properties across range', () => {
      const range = fibonacciQMatrixRange(5, 15);

      for (const result of range) {
        const { matrix, fibonacci, fibonacciNext, fibonacciPrev, n } = result;

        if (n > 0) {
          expect(matrix[0][1]).toBe(fibonacci);
          expect(matrix[0][0]).toBe(fibonacciNext);
          expect(matrix[1][1]).toBe(fibonacciPrev);
        }
      }
    });

    it('should be more efficient than individual calls', () => {
      const start1 = Date.now();
      fibonacciQMatrixRange(0, 100);
      const duration1 = Date.now() - start1;

      const start2 = Date.now();
      for (let i = 0; i <= 100; i++) {
        fibonacci(i);
      }
      const duration2 = Date.now() - start2;

      // Range operation should be competitive or better
      expect(duration1).toBeLessThan(duration2 * 2);
    });
  });
});

describe('Sequence Pattern Detection', () => {
  describe('Even/Odd Patterns', () => {
    it('should have F(3n) divisible by 2', () => {
      for (let n = 1; n <= 10; n++) {
        const f3n = fibonacci(3 * n);
        expect(f3n % 2n).toBe(0n);
      }
    });

    it('should have F(4n) divisible by 3', () => {
      for (let n = 1; n <= 10; n++) {
        const f4n = fibonacci(4 * n);
        expect(f4n % 3n).toBe(0n);
      }
    });

    it('should have L(n) odd iff n is odd', () => {
      const lucasSeq = lucasSequence(20);

      for (let n = 0; n <= 20; n++) {
        const isLucasOdd = lucasSeq[n] % 2n === 1n;
        const isNOdd = n % 2 === 1;
        expect(isLucasOdd).toBe(isNOdd);
      }
    });
  });

  describe('Divisibility Patterns', () => {
    it('should have F(n) | F(kn) for all k', () => {
      const n = 5;
      const fn = fibonacci(n);

      for (let k = 1; k <= 10; k++) {
        const fkn = fibonacci(k * n);
        expect(fkn % fn).toBe(0n);
      }
    });

    it('should satisfy gcd(F(m), F(n)) = F(gcd(m,n))', () => {
      function gcd(a: bigint, b: bigint): bigint {
        while (b !== 0n) {
          [a, b] = [b, a % b];
        }
        return a;
      }

      const testCases: [number, number][] = [
        [12, 18], [15, 20], [21, 14], [30, 45]
      ];

      for (const [m, n] of testCases) {
        const fm = fibonacci(m);
        const fn = fibonacci(n);
        const gcdMN = Math.floor(Number(gcd(BigInt(m), BigInt(n))));
        const fGcd = fibonacci(gcdMN);

        expect(gcd(fm, fn)).toBe(fGcd);
      }
    });
  });

  describe('Sum Patterns', () => {
    it('should have sum of first n Fibonacci = F(n+2) - 1', () => {
      for (let n = 1; n <= 20; n++) {
        let sum = 0n;
        for (let i = 0; i <= n; i++) {
          sum += fibonacci(i);
        }
        expect(sum).toBe(fibonacci(n + 2) - 1n);
      }
    });

    it('should have sum of odd-indexed Fibonacci = F(2n)', () => {
      for (let n = 1; n <= 10; n++) {
        let sum = 0n;
        for (let i = 1; i <= 2*n; i += 2) {
          sum += fibonacci(i);
        }
        expect(sum).toBe(fibonacci(2 * n));
      }
    });

    it('should have sum of even-indexed Fibonacci = F(2n+1) - 1', () => {
      for (let n = 1; n <= 10; n++) {
        let sum = 0n;
        for (let i = 0; i <= 2*n; i += 2) {
          sum += fibonacci(i);
        }
        expect(sum).toBe(fibonacci(2 * n + 1) - 1n);
      }
    });
  });

  describe('Square Patterns', () => {
    it('should have F(n)² + F(n+1)² = F(2n+1)', () => {
      for (let n = 1; n <= 15; n++) {
        const fn = fibonacci(n);
        const fn1 = fibonacci(n + 1);
        const sum = fn * fn + fn1 * fn1;
        expect(sum).toBe(fibonacci(2 * n + 1));
      }
    });

    it('should have L(n)² = L(2n) + 2*(-1)^n', () => {
      for (let n = 0; n <= 15; n++) {
        const lucasN = lucas(n);
        const lucas2n = lucas(2 * n);
        const left = lucasN * lucasN;
        const right = lucas2n + BigInt(2 * (n % 2 === 0 ? 1 : -1));
        expect(left).toBe(right);
      }
    });
  });
});

describe('Sequence Performance', () => {
  it('should generate long sequences efficiently', () => {
    const start = Date.now();
    const seq = fibonacciSequence(1000);
    const duration = Date.now() - start;

    expect(seq).toHaveLength(1001);
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });

  it('should handle concurrent sequence operations', () => {
    const start = Date.now();

    const fibSeq = fibonacciSequence(100);
    const lucSeq = lucasSequence(100);
    const qRange = fibonacciQMatrixRange(0, 100);

    const duration = Date.now() - start;

    expect(fibSeq).toHaveLength(101);
    expect(lucSeq).toHaveLength(101);
    expect(qRange).toHaveLength(101);
    expect(duration).toBeLessThan(2000);
  });

  it('should cache intermediate results', () => {
    const first = fibonacciSequence(50);
    const start = Date.now();
    const second = fibonacciSequence(100);
    const duration = Date.now() - start;

    // Second call should benefit from cached values
    expect(second).toHaveLength(101);
    expect(duration).toBeLessThan(100);
  });
});

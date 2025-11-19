/**
 * Test suite for integer-only symbolic arithmetic
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  SymbolicArithmetic,
  FibonacciLucas,
  HyperbolicGeometry,
  QNumbers
} from '../../src/tensor-nlp/core/symbolic-arithmetic';

describe('SymbolicArithmetic', () => {
  describe('Basic Operations', () => {
    it('should create symbolic numbers', () => {
      const num = SymbolicArithmetic.create(1, 2, 3);
      expect(num.rational).toBe(1);
      expect(num.phi_coef).toBe(2);
      expect(num.sqrt5_coef).toBe(3);
    });

    it('should add symbolic numbers', () => {
      const a = SymbolicArithmetic.create(1, 2, 3);
      const b = SymbolicArithmetic.create(4, 5, 6);
      const result = SymbolicArithmetic.add(a, b);

      expect(result.rational).toBe(5);
      expect(result.phi_coef).toBe(7);
      expect(result.sqrt5_coef).toBe(9);
    });

    it('should subtract symbolic numbers', () => {
      const a = SymbolicArithmetic.create(10, 8, 6);
      const b = SymbolicArithmetic.create(4, 3, 2);
      const result = SymbolicArithmetic.subtract(a, b);

      expect(result.rational).toBe(6);
      expect(result.phi_coef).toBe(5);
      expect(result.sqrt5_coef).toBe(4);
    });

    it('should multiply by scalar', () => {
      const num = SymbolicArithmetic.create(1, 2, 3);
      const result = SymbolicArithmetic.scalarMultiply(num, 5);

      expect(result.rational).toBe(5);
      expect(result.phi_coef).toBe(10);
      expect(result.sqrt5_coef).toBe(15);
    });

    it('should check equality', () => {
      const a = SymbolicArithmetic.create(1, 2, 3);
      const b = SymbolicArithmetic.create(1, 2, 3);
      const c = SymbolicArithmetic.create(1, 2, 4);

      expect(SymbolicArithmetic.equals(a, b)).toBe(true);
      expect(SymbolicArithmetic.equals(a, c)).toBe(false);
    });

    it('should check for zero', () => {
      const zero = SymbolicArithmetic.create(0, 0, 0);
      const nonZero = SymbolicArithmetic.create(1, 0, 0);

      expect(SymbolicArithmetic.isZero(zero)).toBe(true);
      expect(SymbolicArithmetic.isZero(nonZero)).toBe(false);
    });
  });

  describe('Golden Ratio and Conjugate', () => {
    it('should represent φ symbolically', () => {
      const phi = SymbolicArithmetic.phi();
      // 2φ = 1 + √5
      expect(phi.rational).toBe(1);
      expect(phi.sqrt5_coef).toBe(1);
    });

    it('should represent ψ symbolically', () => {
      const psi = SymbolicArithmetic.psi();
      // 2ψ = 1 - √5
      expect(psi.rational).toBe(1);
      expect(psi.sqrt5_coef).toBe(-1);
    });
  });
});

describe('FibonacciLucas', () => {
  beforeEach(() => {
    FibonacciLucas.clearCache();
  });

  describe('Sequence Generation', () => {
    it('should compute Fibonacci numbers correctly', () => {
      expect(FibonacciLucas.fibonacci(0)).toBe(0);
      expect(FibonacciLucas.fibonacci(1)).toBe(1);
      expect(FibonacciLucas.fibonacci(2)).toBe(1);
      expect(FibonacciLucas.fibonacci(3)).toBe(2);
      expect(FibonacciLucas.fibonacci(4)).toBe(3);
      expect(FibonacciLucas.fibonacci(5)).toBe(5);
      expect(FibonacciLucas.fibonacci(6)).toBe(8);
      expect(FibonacciLucas.fibonacci(10)).toBe(55);
    });

    it('should compute Lucas numbers correctly', () => {
      expect(FibonacciLucas.lucas(0)).toBe(2);
      expect(FibonacciLucas.lucas(1)).toBe(1);
      expect(FibonacciLucas.lucas(2)).toBe(3);
      expect(FibonacciLucas.lucas(3)).toBe(4);
      expect(FibonacciLucas.lucas(4)).toBe(7);
      expect(FibonacciLucas.lucas(5)).toBe(11);
      expect(FibonacciLucas.lucas(6)).toBe(18);
    });

    it('should return F_n, L_n pairs', () => {
      const pair5 = FibonacciLucas.pair(5);
      expect(pair5.F).toBe(5);
      expect(pair5.L).toBe(11);
    });
  });

  describe('Cassini Identity', () => {
    it('should verify Cassini identity for various n', () => {
      // L_n² - 5·F_n² = 4·(-1)^n
      for (let n = 0; n <= 10; n++) {
        expect(FibonacciLucas.verifyCassini(n)).toBe(true);
      }
    });

    it('should compute Cassini identity manually for n=5', () => {
      const F_5 = FibonacciLucas.fibonacci(5);  // 5
      const L_5 = FibonacciLucas.lucas(5);      // 11

      const left = L_5 * L_5 - 5 * F_5 * F_5;
      const right = 4 * (-1);  // n=5 is odd

      expect(left).toBe(right);
      expect(left).toBe(-4);
    });
  });

  describe('Binet Formulas (Integer-Only)', () => {
    it('should compute F_{i+j} using Binet addition', () => {
      // F_7 = F_3 + F_6 using Binet
      const F_7_direct = FibonacciLucas.fibonacci(7);
      const F_7_binet = FibonacciLucas.fibonacciAdd(3, 4);

      expect(F_7_binet).toBe(F_7_direct);
      expect(F_7_direct).toBe(13);
    });

    it('should compute L_{i+j} using Binet addition', () => {
      const L_7_direct = FibonacciLucas.lucas(7);
      const L_7_binet = FibonacciLucas.lucasAdd(3, 4);

      expect(L_7_binet).toBe(L_7_direct);
      expect(L_7_direct).toBe(29);
    });

    it('should compute F_{i-j} using Binet subtraction', () => {
      const F_3_direct = FibonacciLucas.fibonacci(3);
      const F_3_binet = FibonacciLucas.fibonacciSubtract(7, 4);

      expect(F_3_binet).toBe(F_3_direct);
      expect(F_3_direct).toBe(2);
    });
  });

  describe('Zeckendorf Representation', () => {
    it('should decompose into non-adjacent Fibonacci numbers', () => {
      // 20 = 13 + 5 + 2 = F_7 + F_5 + F_3
      const zeck20 = FibonacciLucas.zeckendorf(20);
      expect(zeck20).toEqual([3, 5, 7]);

      // Verify sum
      const sum = zeck20.reduce((s, idx) => s + FibonacciLucas.fibonacci(idx), 0);
      expect(sum).toBe(20);
    });

    it('should ensure non-adjacent property', () => {
      for (let n = 1; n <= 50; n++) {
        const zeck = FibonacciLucas.zeckendorf(n);

        // Check non-adjacency
        for (let i = 0; i < zeck.length - 1; i++) {
          expect(zeck[i + 1] - zeck[i]).toBeGreaterThanOrEqual(2);
        }

        // Verify sum
        const sum = zeck.reduce((s, idx) => s + FibonacciLucas.fibonacci(idx), 0);
        expect(sum).toBe(n);
      }
    });

    it('should handle zero', () => {
      expect(FibonacciLucas.zeckendorf(0)).toEqual([]);
    });

    it('should handle Fibonacci numbers themselves', () => {
      expect(FibonacciLucas.zeckendorf(8)).toEqual([6]);  // F_6 = 8
      expect(FibonacciLucas.zeckendorf(13)).toEqual([7]); // F_7 = 13
    });
  });

  describe('Phase Angle', () => {
    it('should return 0 for even n (θ = 0)', () => {
      expect(FibonacciLucas.phaseAngle(0)).toBe(0);
      expect(FibonacciLucas.phaseAngle(2)).toBe(0);
      expect(FibonacciLucas.phaseAngle(4)).toBe(0);
    });

    it('should return 1 for odd n (θ = π)', () => {
      expect(FibonacciLucas.phaseAngle(1)).toBe(1);
      expect(FibonacciLucas.phaseAngle(3)).toBe(1);
      expect(FibonacciLucas.phaseAngle(5)).toBe(1);
    });

    it('should compute phase parity correctly', () => {
      expect(FibonacciLucas.phaseParity(0)).toBe(1);   // (-1)^0 = 1
      expect(FibonacciLucas.phaseParity(1)).toBe(-1);  // (-1)^1 = -1
      expect(FibonacciLucas.phaseParity(2)).toBe(1);   // (-1)^2 = 1
      expect(FibonacciLucas.phaseParity(3)).toBe(-1);  // (-1)^3 = -1
    });
  });
});

describe('HyperbolicGeometry', () => {
  describe('Poincaré Disk Positions', () => {
    it('should compute shell positions as rationals', () => {
      const pos5 = HyperbolicGeometry.shellPosition(5);
      expect(pos5.numerator).toBe(5);     // F_5
      expect(pos5.denominator).toBe(11);  // L_5

      // r_5 = 5/11 ≈ 0.4545
    });

    it('should approach golden ratio conjugate as k increases', () => {
      // r_k = F_k / L_k → ψ ≈ 0.618 as k → ∞
      const pos10 = HyperbolicGeometry.shellPosition(10);
      const ratio = pos10.numerator / pos10.denominator;

      // Should be close to 1/φ ≈ 0.618
      expect(ratio).toBeGreaterThan(0.5);
      expect(ratio).toBeLessThan(0.7);
    });
  });

  describe('Phase Regimes', () => {
    it('should classify shells into phase regimes', () => {
      expect(HyperbolicGeometry.getPhaseRegime(2)).toBe('QUANTUM');
      expect(HyperbolicGeometry.getPhaseRegime(5)).toBe('INTERMEDIATE');
      expect(HyperbolicGeometry.getPhaseRegime(7)).toBe('CLASSICAL');
      expect(HyperbolicGeometry.getPhaseRegime(10)).toBe('SATURATED');
    });
  });

  describe('Path Lengths', () => {
    it('should compute path length using Zeckendorf', () => {
      const length = HyperbolicGeometry.pathLength(2, 12);
      // Δ = 10, Zeckendorf(10) = [3, 5], path = F_3 + F_5 = 2 + 5 = 7
      expect(length).toBeGreaterThan(0);
    });
  });
});

describe('QNumbers', () => {
  describe('Q-Algebra', () => {
    it('should have discriminant φ - ψ = √5', () => {
      const disc = QNumbers.discriminant();
      expect(disc.sqrt5_coef).toBe(1);
      expect(disc.rational).toBe(0);
      expect(disc.phi_coef).toBe(0);
    });

    it('should have trace φ + ψ = 1', () => {
      const trace = QNumbers.trace();
      expect(trace.rational).toBe(1);
      expect(trace.phi_coef).toBe(0);
      expect(trace.sqrt5_coef).toBe(0);
    });

    it('should have determinant φ·ψ = -1', () => {
      const det = QNumbers.determinant();
      expect(det.rational).toBe(-1);
      expect(det.phi_coef).toBe(0);
      expect(det.sqrt5_coef).toBe(0);
    });

    it('should compute q-integers as Fibonacci numbers', () => {
      expect(QNumbers.qInteger(5)).toBe(5);   // [5]_φ = F_5 = 5
      expect(QNumbers.qInteger(7)).toBe(13);  // [7]_φ = F_7 = 13
    });

    it('should compute q-factorials', () => {
      // [3]_φ! = [1]_φ · [2]_φ · [3]_φ = 1 · 1 · 2 = 2
      expect(QNumbers.qFactorial(3)).toBe(2);

      // [4]_φ! = 1 · 1 · 2 · 3 = 6
      expect(QNumbers.qFactorial(4)).toBe(6);
    });
  });
});

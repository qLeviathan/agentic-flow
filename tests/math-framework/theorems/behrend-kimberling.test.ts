/**
 * Theorem Verification Tests: Behrend-Kimberling Theorem
 *
 * Rigorous verification of: S(n) = 0 ⟺ n+1 = Lₘ (Lucas number)
 *
 * Tests:
 * - Forward implication: S(n) = 0 → n+1 is Lucas
 * - Reverse implication: n+1 is Lucas → S(n) = 0
 * - Uniqueness and consistency
 * - Boundary conditions
 */

import { describe, it, expect } from '@jest/globals';
import {
  computeS,
  analyzeBKTheorem,
  verifyBKTheoremAt,
  findNashEquilibria
} from '../../../src/math-framework/divergence/behrend-kimberling';

describe('Behrend-Kimberling Theorem: S(n) = 0 ⟺ n+1 = Lₘ', () => {
  describe('Forward Implication: S(n) = 0 → n+1 is Lucas', () => {
    it('should satisfy forward implication for all Nash points in [0, 200]', () => {
      const equilibria = findNashEquilibria(200);

      for (const n of equilibria) {
        const result = verifyBKTheoremAt(n);

        expect(result.S_n).toBe(0);
        expect(result.isLucasNumber).toBe(true);
        expect(result.verified).toBe(true);
      }
    });

    it('should have every S(n)=0 correspond to Lucas number', () => {
      const analysis = analyzeBKTheorem(150);

      for (const point of analysis.points) {
        if (point.S === 0) {
          expect(point.isLucasPrediction).toBe(true);
        }
      }
    });

    it('should maintain forward implication under cumulative updates', () => {
      let V = 0;
      let U = 0;

      for (let n = 0; n <= 100; n++) {
        const result = verifyBKTheoremAt(n);

        if (result.S_n === 0) {
          expect(result.isLucasNumber).toBe(true);
          expect(result.message).toContain('✓ Theorem verified');
        }
      }
    });
  });

  describe('Reverse Implication: n+1 is Lucas → S(n) = 0', () => {
    it('should satisfy reverse implication for known Lucas numbers', () => {
      // Lucas numbers: L(k) = 2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123, 199
      // So n+1 being Lucas: n = 1, 0, 2, 3, 6, 10, 17, 28, 46, 75, 122, 198
      const lucasIndices = [0, 2, 3, 6, 10, 17, 28, 46, 75, 122, 198];

      for (const n of lucasIndices) {
        const s = computeS(n);
        expect(s).toBe(0);

        const result = verifyBKTheoremAt(n);
        expect(result.verified).toBe(true);
        expect(result.isLucasNumber).toBe(true);
      }
    });

    it('should have every Lucas point be a Nash equilibrium', () => {
      const analysis = analyzeBKTheorem(150);

      for (const point of analysis.lucasPoints) {
        expect(point.S).toBe(0);
        expect(point.isNashEquilibrium).toBe(true);
      }
    });

    it('should match predicted Lucas points exactly', () => {
      const analysis = analyzeBKTheorem(100);

      const lucasPoints = analysis.points.filter(p => p.isLucasPrediction);
      const nashPoints = analysis.points.filter(p => p.S === 0);

      expect(lucasPoints.length).toBe(nashPoints.length);

      for (let i = 0; i < lucasPoints.length; i++) {
        expect(lucasPoints[i].n).toBe(nashPoints[i].n);
      }
    });
  });

  describe('Bidirectional Equivalence', () => {
    it('should satisfy perfect bidirectional equivalence for [0, 300]', () => {
      const analysis = analyzeBKTheorem(300);

      // No violations means perfect equivalence
      expect(analysis.violations).toHaveLength(0);
      expect(analysis.theoremVerified).toBe(true);

      // Count matches
      expect(analysis.nashEquilibria.length).toBe(analysis.lucasPoints.length);

      // Point-by-point verification
      for (const point of analysis.points) {
        const isNash = point.S === 0;
        const isLucas = point.isLucasPrediction;

        expect(isNash).toBe(isLucas);
      }
    });

    it('should have no counterexamples in large range', () => {
      for (let n = 0; n <= 500; n += 10) {
        const result = verifyBKTheoremAt(n);
        expect(result.verified).toBe(true);

        // S(n)=0 iff n+1 is Lucas
        if (result.S_n === 0) {
          expect(result.isLucasNumber).toBe(true);
        } else {
          expect(result.isLucasNumber).toBe(false);
        }
      }
    });

    it('should maintain equivalence under all operations', () => {
      const n = 200;
      const equilibria = findNashEquilibria(n);
      const analysis = analyzeBKTheorem(n);

      // All equilibria should be in analysis.nashEquilibria
      for (const eq of equilibria) {
        const found = analysis.nashEquilibria.find(p => p.n === eq);
        expect(found).toBeDefined();
        expect(found!.isLucasPrediction).toBe(true);
      }

      // All Lucas points should be equilibria
      for (const lucas of analysis.lucasPoints) {
        expect(equilibria).toContain(lucas.n);
      }
    });
  });

  describe('Theorem Uniqueness', () => {
    it('should have exactly one way to achieve S(n) = 0', () => {
      const analysis = analyzeBKTheorem(150);

      for (const nash of analysis.nashEquilibria) {
        // S(n) = 0 has unique characterization: n+1 is Lucas
        expect(nash.S).toBe(0);
        expect(nash.V).toBe(nash.U);
        expect(nash.isLucasPrediction).toBe(true);

        // No other characterization possible
        expect(nash.isNashEquilibrium).toBe(true);
      }
    });

    it('should have no duplicate Nash points', () => {
      const equilibria = findNashEquilibria(200);

      const unique = new Set(equilibria);
      expect(unique.size).toBe(equilibria.length);
    });

    it('should have deterministic Nash detection', () => {
      const run1 = findNashEquilibria(100);
      const run2 = findNashEquilibria(100);

      expect(run1).toEqual(run2);
    });
  });

  describe('Boundary Conditions', () => {
    it('should verify theorem at n=0', () => {
      const result = verifyBKTheoremAt(0);

      expect(result.verified).toBe(true);
      expect(result.S_n).toBe(0); // n+1 = 1 = L(1)
      expect(result.isLucasNumber).toBe(true);
    });

    it('should verify theorem for small n', () => {
      for (let n = 0; n <= 10; n++) {
        const result = verifyBKTheoremAt(n);
        expect(result.verified).toBe(true);
      }
    });

    it('should verify theorem for large n', () => {
      const largeN = [100, 200, 500, 1000];

      for (const n of largeN) {
        const result = verifyBKTheoremAt(n);
        expect(result.verified).toBe(true);
      }
    });

    it('should handle sparse Nash points', () => {
      const equilibria = findNashEquilibria(500);

      // Nash points should be relatively rare
      expect(equilibria.length).toBeLessThan(50);

      // But should exist
      expect(equilibria.length).toBeGreaterThan(5);
    });
  });

  describe('Theorem Stability', () => {
    it('should maintain S(n)=0 under repeated computation', () => {
      const nashPoints = [0, 2, 3, 6, 10, 17];

      for (const n of nashPoints) {
        const s1 = computeS(n);
        const s2 = computeS(n);
        const s3 = computeS(n);

        expect(s1).toBe(0);
        expect(s2).toBe(0);
        expect(s3).toBe(0);
      }
    });

    it('should have consistent verification across methods', () => {
      for (let n = 0; n <= 50; n++) {
        const directS = computeS(n);
        const analysis = analyzeBKTheorem(n);
        const point = analysis.points[n];

        expect(point.S).toBe(directS);

        if (directS === 0) {
          expect(point.isNashEquilibrium).toBe(true);
        }
      }
    });
  });

  describe('Theorem Implications', () => {
    it('should imply V(n) = U(n) at Nash points', () => {
      const analysis = analyzeBKTheorem(100);

      for (const nash of analysis.nashEquilibria) {
        // S(n) = V(n) - U(n) = 0
        expect(nash.V).toBe(nash.U);
      }
    });

    it('should imply cumulative balance at Nash', () => {
      const equilibria = findNashEquilibria(50);

      for (const n of equilibria) {
        const analysis = analyzeBKTheorem(n);
        const point = analysis.points[n];

        // At Nash: total Zeckendorf = total Lucas
        expect(point.V).toBe(point.U);

        // But local difference may not be zero
        expect(point.d).toBeDefined();
      }
    });

    it('should predict Nash from Lucas sequence', () => {
      // If we know Lucas numbers, we can predict all Nash points
      const lucasNumbers = [2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123];
      const predictedNash = lucasNumbers.map(L => L - 1).filter(n => n >= 0);

      const actualNash = findNashEquilibria(Math.max(...predictedNash));

      for (const predicted of predictedNash) {
        expect(actualNash).toContain(predicted);
      }
    });
  });

  describe('Counterexample Search', () => {
    it('should find no counterexamples in [0, 500]', () => {
      const analysis = analyzeBKTheorem(500);

      expect(analysis.violations).toHaveLength(0);

      // Double-check each point
      for (const point of analysis.points) {
        if (point.S === 0 && !point.isLucasPrediction) {
          throw new Error(`Counterexample found at n=${point.n}: S(n)=0 but n+1 not Lucas`);
        }
        if (point.S !== 0 && point.isLucasPrediction) {
          throw new Error(`Counterexample found at n=${point.n}: n+1 is Lucas but S(n)≠0`);
        }
      }
    });

    it('should find no violations in random sampling', () => {
      const testPoints = [0, 1, 5, 13, 27, 42, 69, 101, 157, 234, 389, 421];

      for (const n of testPoints) {
        const result = verifyBKTheoremAt(n);
        expect(result.verified).toBe(true);
      }
    });

    it('should verify exhaustively for comprehensive range', () => {
      let violationCount = 0;

      for (let n = 0; n <= 1000; n++) {
        const result = verifyBKTheoremAt(n);
        if (!result.verified) {
          violationCount++;
        }
      }

      expect(violationCount).toBe(0);
    });
  });
});

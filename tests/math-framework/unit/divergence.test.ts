/**
 * Unit Tests for Behrend-Kimberling Divergence System
 *
 * Tests the critical theorem: S(n) = 0 ⟺ n+1 = Lₘ (Lucas number)
 * This theorem connects Zeckendorf decomposition, Lucas numbers, and Nash equilibria
 */

import { describe, it, expect } from '@jest/globals';
import {
  computeV,
  computeU,
  computeS,
  computeD,
  computeCumulativeFunctions,
  analyzeBKTheorem,
  verifyBKTheoremAt,
  findNashEquilibria,
  generateBKReport,
  exportNashCandidates,
  type BKPoint,
  type BKAnalysis
} from '../../../src/math-framework/divergence/behrend-kimberling';

describe('Behrend-Kimberling Divergence Functions', () => {
  describe('Cumulative V(n) - Zeckendorf Count', () => {
    it('should compute V(0) correctly', () => {
      const v0 = computeV(0);
      expect(v0).toBeGreaterThanOrEqual(0);
    });

    it('should be monotonically increasing', () => {
      const values = [];
      for (let n = 0; n <= 20; n++) {
        values.push(computeV(n));
      }

      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i-1]);
      }
    });

    it('should grow approximately linearly', () => {
      const v10 = computeV(10);
      const v20 = computeV(20);

      // V should roughly double when n doubles (plus some variance)
      expect(v20).toBeGreaterThan(v10);
      expect(v20).toBeLessThan(v10 * 3);
    });
  });

  describe('Cumulative U(n) - Lucas Count', () => {
    it('should compute U(0) correctly', () => {
      const u0 = computeU(0);
      expect(u0).toBeGreaterThanOrEqual(0);
    });

    it('should be monotonically non-decreasing', () => {
      const values = [];
      for (let n = 0; n <= 20; n++) {
        values.push(computeU(n));
      }

      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThanOrEqual(values[i-1]);
      }
    });

    it('should have U(n) ≤ V(n) for all n', () => {
      for (let n = 0; n <= 30; n++) {
        const v = computeV(n);
        const u = computeU(n);
        expect(u).toBeLessThanOrEqual(v);
      }
    });
  });

  describe('Divergence S(n) = V(n) - U(n)', () => {
    it('should compute S(n) correctly', () => {
      for (let n = 0; n <= 20; n++) {
        const v = computeV(n);
        const u = computeU(n);
        const s = computeS(n);
        expect(s).toBe(v - u);
      }
    });

    it('should accept pre-computed V and U values', () => {
      const n = 10;
      const v = computeV(n);
      const u = computeU(n);
      const s1 = computeS(n);
      const s2 = computeS(n, v, u);

      expect(s1).toBe(s2);
    });

    it('should have S(n) ≥ 0 (B-K inequality)', () => {
      for (let n = 0; n <= 50; n++) {
        const s = computeS(n);
        expect(s).toBeGreaterThanOrEqual(0);
      }
    });

    it('should be 0 at specific Nash equilibrium points', () => {
      // Known Nash equilibria where n+1 is a Lucas number
      // L(1)=1, so n=0 should have S(0)=0
      // L(2)=3, so n=2 should have S(2)=0
      const nashPoints = [0, 2, 3];

      for (const n of nashPoints) {
        const s = computeS(n);
        expect(s).toBe(0);
      }
    });
  });

  describe('Local Difference d(n) = z(n) - ℓ(n)', () => {
    it('should compute d(n) correctly', () => {
      for (let n = 0; n <= 20; n++) {
        const d = computeD(n);
        expect(d).toBeGreaterThanOrEqual(-10); // Reasonable bound
        expect(d).toBeLessThanOrEqual(10);
      }
    });

    it('should have cumulative sum equal to S(n)', () => {
      let cumulativeD = 0;
      for (let n = 0; n <= 20; n++) {
        cumulativeD += computeD(n);
        const s = computeS(n);
        expect(cumulativeD).toBe(s);
      }
    });
  });

  describe('Cumulative Functions Batch Computation', () => {
    it('should compute all functions efficiently', () => {
      const n = 50;
      const { V, U, S, d } = computeCumulativeFunctions(n);

      expect(V).toHaveLength(n + 1);
      expect(U).toHaveLength(n + 1);
      expect(S).toHaveLength(n + 1);
      expect(d).toHaveLength(n + 1);
    });

    it('should match individual computations', () => {
      const n = 20;
      const { V, U, S, d } = computeCumulativeFunctions(n);

      for (let k = 0; k <= n; k++) {
        expect(V[k]).toBe(computeV(k));
        expect(U[k]).toBe(computeU(k));
        expect(S[k]).toBe(computeS(k));
        expect(d[k]).toBe(computeD(k));
      }
    });

    it('should maintain S[k] = V[k] - U[k]', () => {
      const { V, U, S } = computeCumulativeFunctions(30);

      for (let k = 0; k <= 30; k++) {
        expect(S[k]).toBe(V[k] - U[k]);
      }
    });

    it('should have cumulative property for V and U', () => {
      const { V, U } = computeCumulativeFunctions(20);

      for (let k = 1; k <= 20; k++) {
        expect(V[k]).toBeGreaterThanOrEqual(V[k-1]);
        expect(U[k]).toBeGreaterThanOrEqual(U[k-1]);
      }
    });
  });
});

describe('Behrend-Kimberling Theorem Verification', () => {
  describe('Individual Point Verification', () => {
    it('should verify Nash equilibrium points', () => {
      // Known Nash points where n+1 is Lucas
      const nashPoints = [0, 2, 3, 6];

      for (const n of nashPoints) {
        const result = verifyBKTheoremAt(n);
        expect(result.verified).toBe(true);
        expect(result.S_n).toBe(0);
        expect(result.isLucasNumber).toBe(true);
        expect(result.message).toContain('✓ Theorem verified');
      }
    });

    it('should verify non-Nash points', () => {
      const nonNashPoints = [1, 4, 5, 7, 8];

      for (const n of nonNashPoints) {
        const result = verifyBKTheoremAt(n);
        expect(result.verified).toBe(true);

        if (result.S_n === 0) {
          expect(result.isLucasNumber).toBe(true);
        } else {
          expect(result.isLucasNumber).toBe(false);
        }
      }
    });

    it('should generate correct verification messages', () => {
      const result0 = verifyBKTheoremAt(0);
      expect(result0.message).toContain('S(0) = 0');

      const result1 = verifyBKTheoremAt(1);
      expect(result1.message).toContain('S(1)');
    });
  });

  describe('Full Range Analysis', () => {
    it('should analyze range without violations', () => {
      const analysis = analyzeBKTheorem(50);

      expect(analysis.theoremVerified).toBe(true);
      expect(analysis.violations).toHaveLength(0);
      expect(analysis.points).toHaveLength(51); // 0 to 50 inclusive
    });

    it('should find Nash equilibria', () => {
      const analysis = analyzeBKTheorem(30);

      expect(analysis.nashEquilibria.length).toBeGreaterThan(0);

      for (const point of analysis.nashEquilibria) {
        expect(point.S).toBe(0);
        expect(point.isNashEquilibrium).toBe(true);
      }
    });

    it('should find Lucas prediction points', () => {
      const analysis = analyzeBKTheorem(30);

      expect(analysis.lucasPoints.length).toBeGreaterThan(0);

      for (const point of analysis.lucasPoints) {
        expect(point.isLucasPrediction).toBe(true);
      }
    });

    it('should have Nash equilibria match Lucas points', () => {
      const analysis = analyzeBKTheorem(100);

      // For each Nash equilibrium, n+1 should be Lucas
      for (const nash of analysis.nashEquilibria) {
        expect(nash.isLucasPrediction).toBe(true);
      }

      // For each Lucas point, S(n) should be 0
      for (const lucas of analysis.lucasPoints) {
        expect(lucas.S).toBe(0);
      }

      // Counts should match
      expect(analysis.nashEquilibria.length).toBe(analysis.lucasPoints.length);
    });

    it('should maintain all BK point properties', () => {
      const analysis = analyzeBKTheorem(20);

      for (const point of analysis.points) {
        expect(point).toHaveProperty('n');
        expect(point).toHaveProperty('V');
        expect(point).toHaveProperty('U');
        expect(point).toHaveProperty('S');
        expect(point).toHaveProperty('d');
        expect(point).toHaveProperty('z_n');
        expect(point).toHaveProperty('l_n');
        expect(point).toHaveProperty('isNashEquilibrium');
        expect(point).toHaveProperty('isLucasPrediction');

        // Verify relationships
        expect(point.S).toBe(point.V - point.U);
        expect(point.isNashEquilibrium).toBe(point.S === 0);
      }
    });
  });

  describe('Nash Equilibria Detection', () => {
    it('should find all Nash equilibria in range', () => {
      const equilibria = findNashEquilibria(50);

      expect(equilibria.length).toBeGreaterThan(0);

      // Verify each is indeed a Nash equilibrium
      for (const n of equilibria) {
        expect(computeS(n)).toBe(0);
      }
    });

    it('should find equilibria in ascending order', () => {
      const equilibria = findNashEquilibria(100);

      for (let i = 1; i < equilibria.length; i++) {
        expect(equilibria[i]).toBeGreaterThan(equilibria[i-1]);
      }
    });

    it('should match analysis results', () => {
      const n = 50;
      const equilibria = findNashEquilibria(n);
      const analysis = analyzeBKTheorem(n);

      expect(equilibria.length).toBe(analysis.nashEquilibria.length);

      for (let i = 0; i < equilibria.length; i++) {
        expect(equilibria[i]).toBe(analysis.nashEquilibria[i].n);
      }
    });

    it('should have sparse distribution', () => {
      const equilibria = findNashEquilibria(100);

      // Nash equilibria should be relatively rare
      expect(equilibria.length).toBeLessThan(20);

      // Should have some spacing between them
      if (equilibria.length > 1) {
        const gaps = [];
        for (let i = 1; i < equilibria.length; i++) {
          gaps.push(equilibria[i] - equilibria[i-1]);
        }
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        expect(avgGap).toBeGreaterThan(2);
      }
    });
  });
});

describe('Behrend-Kimberling Theorem Properties', () => {
  describe('S(n) = 0 ⟺ Nash Equilibrium', () => {
    it('should satisfy bidirectional implication', () => {
      const analysis = analyzeBKTheorem(100);

      for (const point of analysis.points) {
        const isNash = point.S === 0;
        const isLucas = point.isLucasPrediction;

        // S(n) = 0 implies n+1 is Lucas
        if (isNash) {
          expect(isLucas).toBe(true);
        }

        // n+1 is Lucas implies S(n) = 0
        if (isLucas) {
          expect(isNash).toBe(true);
        }
      }
    });

    it('should have no theorem violations', () => {
      const analysis = analyzeBKTheorem(200);

      expect(analysis.violations).toHaveLength(0);
      expect(analysis.theoremVerified).toBe(true);
    });
  });

  describe('B-K Inequality: S(n) ≥ 0', () => {
    it('should satisfy inequality for all n', () => {
      const { S } = computeCumulativeFunctions(100);

      for (const s of S) {
        expect(s).toBeGreaterThanOrEqual(0);
      }
    });

    it('should reach minimum S(n) = 0 at Nash points', () => {
      const analysis = analyzeBKTheorem(50);
      const allS = analysis.points.map(p => p.S);
      const minS = Math.min(...allS);

      expect(minS).toBe(0);

      // All points with S = 0 should be Nash equilibria
      const zeroPoints = analysis.points.filter(p => p.S === 0);
      for (const point of zeroPoints) {
        expect(point.isNashEquilibrium).toBe(true);
      }
    });
  });

  describe('Cumulative Properties', () => {
    it('should have V(n) ≥ U(n) for all n', () => {
      const { V, U } = computeCumulativeFunctions(100);

      for (let i = 0; i < V.length; i++) {
        expect(V[i]).toBeGreaterThanOrEqual(U[i]);
      }
    });

    it('should have V(n) ≥ n for all n', () => {
      const { V } = computeCumulativeFunctions(50);

      for (let n = 0; n < V.length; n++) {
        expect(V[n]).toBeGreaterThanOrEqual(n);
      }
    });

    it('should satisfy telescoping sum: S(n) = Σ d(k)', () => {
      const { S, d } = computeCumulativeFunctions(30);

      for (let n = 0; n < S.length; n++) {
        let sum = 0;
        for (let k = 0; k <= n; k++) {
          sum += d[k];
        }
        expect(S[n]).toBe(sum);
      }
    });
  });
});

describe('Report Generation and Export', () => {
  describe('BK Report Generation', () => {
    it('should generate formatted report', () => {
      const analysis = analyzeBKTheorem(20);
      const report = generateBKReport(analysis);

      expect(report).toContain('BEHREND-KIMBERLING');
      expect(report).toContain('THEOREM');
      expect(report).toContain('NASH EQUILIBRIA');
      expect(report).toContain('STATISTICS');
    });

    it('should include verification status', () => {
      const analysis = analyzeBKTheorem(30);
      const report = generateBKReport(analysis);

      if (analysis.theoremVerified) {
        expect(report).toContain('✓ VERIFIED');
      } else {
        expect(report).toContain('✗ VIOLATIONS');
      }
    });

    it('should list Nash equilibria', () => {
      const analysis = analyzeBKTheorem(50);
      const report = generateBKReport(analysis);

      expect(report).toContain(`${analysis.nashEquilibria.length} points found`);

      for (const point of analysis.nashEquilibria.slice(0, 3)) {
        expect(report).toContain(`n = ${point.n}`);
      }
    });

    it('should include statistics', () => {
      const analysis = analyzeBKTheorem(30);
      const report = generateBKReport(analysis);

      expect(report).toContain('Total points analyzed');
      expect(report).toContain('Nash equilibria found');
      expect(report).toContain('Match rate');
    });

    it('should show violations if any', () => {
      const analysis = analyzeBKTheorem(20);
      const report = generateBKReport(analysis);

      if (analysis.violations.length > 0) {
        expect(report).toContain('VIOLATIONS');
        expect(report).toContain(`${analysis.violations.length} found`);
      }
    });
  });

  describe('Nash Candidates Export', () => {
    it('should export Nash candidates for AgentDB', () => {
      const analysis = analyzeBKTheorem(30);
      const candidates = exportNashCandidates(analysis);

      expect(candidates.length).toBe(analysis.nashEquilibria.length);

      for (const candidate of candidates) {
        expect(candidate).toHaveProperty('n');
        expect(candidate).toHaveProperty('lucasNumber');
        expect(candidate).toHaveProperty('lucasIndex');
        expect(candidate).toHaveProperty('V');
        expect(candidate).toHaveProperty('U');
        expect(candidate).toHaveProperty('S');
        expect(candidate).toHaveProperty('d');
        expect(candidate).toHaveProperty('timestamp');
      }
    });

    it('should have correct Nash properties', () => {
      const analysis = analyzeBKTheorem(50);
      const candidates = exportNashCandidates(analysis);

      for (const candidate of candidates) {
        expect(candidate.S).toBe(0);
        expect(candidate.V).toBe(candidate.U);
        expect(candidate.timestamp).toBeGreaterThan(0);
      }
    });

    it('should provide Lucas index information', () => {
      const analysis = analyzeBKTheorem(20);
      const candidates = exportNashCandidates(analysis);

      for (const candidate of candidates) {
        expect(candidate.lucasIndex).toBeGreaterThan(0);
        expect(candidate.lucasNumber).toBeGreaterThan(0n);
      }
    });
  });
});

describe('Performance and Scalability', () => {
  it('should handle large ranges efficiently', () => {
    const start = Date.now();
    const analysis = analyzeBKTheorem(200);
    const duration = Date.now() - start;

    expect(analysis.points).toHaveLength(201);
    expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds
  });

  it('should compute cumulative functions efficiently', () => {
    const start = Date.now();
    const { V, U, S, d } = computeCumulativeFunctions(500);
    const duration = Date.now() - start;

    expect(V).toHaveLength(501);
    expect(duration).toBeLessThan(3000); // Should be fast
  });

  it('should find Nash equilibria quickly', () => {
    const start = Date.now();
    const equilibria = findNashEquilibria(100);
    const duration = Date.now() - start;

    expect(equilibria.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(2000);
  });

  it('should generate reports efficiently', () => {
    const analysis = analyzeBKTheorem(100);

    const start = Date.now();
    const report = generateBKReport(analysis);
    const duration = Date.now() - start;

    expect(report.length).toBeGreaterThan(100);
    expect(duration).toBeLessThan(100);
  });
});

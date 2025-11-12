/**
 * Behrend-Kimberling Theorem Validator
 *
 * CRITICAL THEOREM:
 * S(n) = 0 ⟺ n+1 = Lₘ (Lucas number)
 *
 * Where:
 * - V(n) = Σₖ₌₀ⁿ z(k) - Cumulative Zeckendorf count
 * - U(n) = Σₖ₌₀ⁿ ℓ(k) - Cumulative Lucas count
 * - S(n) = V(n) - U(n) - B-K divergence
 * - d(n) = z(n) - ℓ(n) - Local difference
 *
 * Nash Equilibrium: Points where S(n) = 0 represent equilibrium states
 */

import { z, computeZeckendorfCounts } from '../sequences/zeckendorf';
import { ℓ, computeLucasCounts, isLucasNumber, findLucasIndex } from '../sequences/lucas-repr';

export interface BKPoint {
  n: number;
  V: number;           // Cumulative Zeckendorf
  U: number;           // Cumulative Lucas
  S: number;           // Divergence S(n) = V(n) - U(n)
  d: number;           // Local difference d(n) = z(n) - ℓ(n)
  z_n: number;         // z(n)
  l_n: number;         // ℓ(n)
  isNashEquilibrium: boolean;  // S(n) = 0
  isLucasPrediction: boolean;  // n+1 is Lucas number
}

export interface BKAnalysis {
  points: BKPoint[];
  nashEquilibria: BKPoint[];
  lucasPoints: BKPoint[];
  theoremVerified: boolean;
  violations: BKPoint[];
}

/**
 * Compute V(n) = Σₖ₌₀ⁿ z(k)
 * Cumulative sum of Zeckendorf counts
 */
export function computeV(n: number): number {
  let sum = 0;
  for (let k = 0; k <= n; k++) {
    sum += z(BigInt(k));
  }
  return sum;
}

/**
 * Compute U(n) = Σₖ₌₀ⁿ ℓ(k)
 * Cumulative sum of Lucas counts
 */
export function computeU(n: number): number {
  let sum = 0;
  for (let k = 0; k <= n; k++) {
    sum += ℓ(BigInt(k));
  }
  return sum;
}

/**
 * Compute S(n) = V(n) - U(n)
 * B-K divergence
 */
export function computeS(n: number, V?: number, U?: number): number {
  const v = V !== undefined ? V : computeV(n);
  const u = U !== undefined ? U : computeU(n);
  return v - u;
}

/**
 * Compute d(n) = z(n) - ℓ(n)
 * Local difference
 */
export function computeD(n: number): number {
  return z(BigInt(n)) - ℓ(BigInt(n));
}

/**
 * Efficient cumulative computation of V and U
 * Computes all values from 0 to n in one pass
 */
export function computeCumulativeFunctions(n: number): {
  V: number[];
  U: number[];
  S: number[];
  d: number[];
} {
  const z_values = computeZeckendorfCounts(n);
  const l_values = computeLucasCounts(n);

  const V: number[] = new Array(n + 1);
  const U: number[] = new Array(n + 1);
  const S: number[] = new Array(n + 1);
  const d: number[] = new Array(n + 1);

  // Initialize
  V[0] = z_values[0];
  U[0] = l_values[0];
  S[0] = V[0] - U[0];
  d[0] = z_values[0] - l_values[0];

  // Cumulative sums
  for (let k = 1; k <= n; k++) {
    V[k] = V[k - 1] + z_values[k];
    U[k] = U[k - 1] + l_values[k];
    S[k] = V[k] - U[k];
    d[k] = z_values[k] - l_values[k];
  }

  return { V, U, S, d };
}

/**
 * Analyze B-K theorem for range [0, n]
 * Returns complete analysis with Nash equilibria detection
 */
export function analyzeBKTheorem(n: number): BKAnalysis {
  const { V, U, S, d } = computeCumulativeFunctions(n);
  const z_values = computeZeckendorfCounts(n);
  const l_values = computeLucasCounts(n);

  const points: BKPoint[] = [];
  const nashEquilibria: BKPoint[] = [];
  const lucasPoints: BKPoint[] = [];
  const violations: BKPoint[] = [];

  for (let k = 0; k <= n; k++) {
    // Check if k+1 is a Lucas number
    const isLucasNum = isLucasNumber(BigInt(k + 1));
    const isNash = S[k] === 0;

    const point: BKPoint = {
      n: k,
      V: V[k],
      U: U[k],
      S: S[k],
      d: d[k],
      z_n: z_values[k],
      l_n: l_values[k],
      isNashEquilibrium: isNash,
      isLucasPrediction: isLucasNum
    };

    points.push(point);

    if (isNash) {
      nashEquilibria.push(point);
    }

    if (isLucasNum) {
      lucasPoints.push(point);
    }

    // Check for theorem violation: S(n)=0 but n+1 is not Lucas, or vice versa
    if (isNash !== isLucasNum) {
      violations.push(point);
    }
  }

  return {
    points,
    nashEquilibria,
    lucasPoints,
    theoremVerified: violations.length === 0,
    violations
  };
}

/**
 * Verify Behrend-Kimberling theorem for a specific point
 * Returns true if S(n) = 0 ⟺ n+1 = Lₘ
 */
export function verifyBKTheoremAt(n: number): {
  verified: boolean;
  S_n: number;
  isLucasNumber: boolean;
  message: string;
} {
  const S_n = computeS(n);
  const isLucasNum = isLucasNumber(BigInt(n + 1));
  const verified = (S_n === 0) === isLucasNum;

  let message: string;
  if (verified) {
    if (S_n === 0) {
      const lucasIndex = findLucasIndex(BigInt(n + 1));
      message = `✓ Theorem verified: S(${n}) = 0 and ${n + 1} = L(${lucasIndex})`;
    } else {
      message = `✓ Theorem verified: S(${n}) = ${S_n} ≠ 0 and ${n + 1} is not a Lucas number`;
    }
  } else {
    if (S_n === 0 && !isLucasNum) {
      message = `✗ VIOLATION: S(${n}) = 0 but ${n + 1} is NOT a Lucas number!`;
    } else {
      const lucasIndex = findLucasIndex(BigInt(n + 1));
      message = `✗ VIOLATION: S(${n}) = ${S_n} ≠ 0 but ${n + 1} = L(${lucasIndex}) is a Lucas number!`;
    }
  }

  return { verified, S_n, isLucasNumber: isLucasNum, message };
}

/**
 * Find all Nash equilibria (S(n) = 0) in range [0, n]
 */
export function findNashEquilibria(n: number): number[] {
  const { S } = computeCumulativeFunctions(n);
  const equilibria: number[] = [];

  for (let k = 0; k <= n; k++) {
    if (S[k] === 0) {
      equilibria.push(k);
    }
  }

  return equilibria;
}

/**
 * Generate B-K report as formatted string
 */
export function generateBKReport(analysis: BKAnalysis): string {
  const lines: string[] = [];

  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('         BEHREND-KIMBERLING THEOREM ANALYSIS REPORT');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Range: [0, ${analysis.points.length - 1}]`);
  lines.push(`Theorem Status: ${analysis.theoremVerified ? '✓ VERIFIED' : '✗ VIOLATIONS FOUND'}`);
  lines.push('');

  // Nash Equilibria
  lines.push('─────────────────────────────────────────────────────────────');
  lines.push(`NASH EQUILIBRIA (S(n) = 0): ${analysis.nashEquilibria.length} points found`);
  lines.push('─────────────────────────────────────────────────────────────');

  for (const point of analysis.nashEquilibria) {
    const lucasIndex = findLucasIndex(BigInt(point.n + 1));
    lines.push(`  n = ${point.n}: S(${point.n}) = 0, ${point.n + 1} = L(${lucasIndex})`);
    lines.push(`    V(${point.n}) = ${point.V}, U(${point.n}) = ${point.U}`);
    lines.push(`    z(${point.n}) = ${point.z_n}, ℓ(${point.n}) = ${point.l_n}, d(${point.n}) = ${point.d}`);
    lines.push('');
  }

  // Violations
  if (analysis.violations.length > 0) {
    lines.push('─────────────────────────────────────────────────────────────');
    lines.push(`THEOREM VIOLATIONS: ${analysis.violations.length} found`);
    lines.push('─────────────────────────────────────────────────────────────');

    for (const point of analysis.violations) {
      lines.push(`  n = ${point.n}:`);
      lines.push(`    S(${point.n}) = ${point.S} ${point.isNashEquilibrium ? '= 0' : '≠ 0'}`);
      lines.push(`    ${point.n + 1} ${point.isLucasPrediction ? 'IS' : 'IS NOT'} a Lucas number`);
      lines.push('');
    }
  }

  // Statistics
  lines.push('─────────────────────────────────────────────────────────────');
  lines.push('STATISTICS');
  lines.push('─────────────────────────────────────────────────────────────');
  lines.push(`  Total points analyzed: ${analysis.points.length}`);
  lines.push(`  Nash equilibria found: ${analysis.nashEquilibria.length}`);
  lines.push(`  Lucas prediction points: ${analysis.lucasPoints.length}`);
  lines.push(`  Match rate: ${(analysis.nashEquilibria.length / Math.max(analysis.lucasPoints.length, 1) * 100).toFixed(2)}%`);

  lines.push('═══════════════════════════════════════════════════════════════');

  return lines.join('\n');
}

/**
 * Export Nash equilibria data for AgentDB storage
 */
export function exportNashCandidates(analysis: BKAnalysis): Array<{
  n: number;
  lucasNumber: bigint;
  lucasIndex: number;
  V: number;
  U: number;
  S: number;
  d: number;
  timestamp: number;
}> {
  return analysis.nashEquilibria.map(point => ({
    n: point.n,
    lucasNumber: BigInt(point.n + 1),
    lucasIndex: findLucasIndex(BigInt(point.n + 1)),
    V: point.V,
    U: point.U,
    S: point.S,
    d: point.d,
    timestamp: Date.now()
  }));
}

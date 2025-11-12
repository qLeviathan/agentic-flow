/**
 * Fibonacci and Lucas sequence computations
 * Using golden ratio relationships for efficient calculation
 */

const PHI = (1 + Math.sqrt(5)) / 2;  // φ ≈ 1.618033988749895
const PSI = (1 - Math.sqrt(5)) / 2;  // ψ ≈ -0.618033988749895
const SQRT5 = Math.sqrt(5);

/**
 * Calculate Fibonacci number F(n) using Binet's formula
 * F(n) = (φ^n - ψ^n) / √5
 */
export function fibonacci(n: number): number {
  if (n === 0) return 0;
  if (n === 1) return 1;

  // Use Binet's formula for efficiency
  return Math.round((Math.pow(PHI, n) - Math.pow(PSI, n)) / SQRT5);
}

/**
 * Calculate Lucas number L(n)
 * L(n) = φ^n + ψ^n
 */
export function lucas(n: number): number {
  if (n === 0) return 2;
  if (n === 1) return 1;

  return Math.round(Math.pow(PHI, n) + Math.pow(PSI, n));
}

/**
 * Calculate Z(n) = φ^n + ψ^n (same as Lucas)
 */
export function calculateZ(n: number): number {
  return Math.pow(PHI, n) + Math.pow(PSI, n);
}

/**
 * Calculate S(n) = 2F(n) - L(n)
 * When S(n) = 0, we have a Nash equilibrium
 */
export function calculateS(n: number): number {
  const F = fibonacci(n);
  const L = lucas(n);
  return 2 * F - L;
}

/**
 * Check if n is a Nash equilibrium point (S(n) = 0)
 */
export function isNashPoint(n: number, tolerance: number = 1e-10): boolean {
  const S = calculateS(n);
  return Math.abs(S) < tolerance;
}

/**
 * Find Nash equilibrium points in a range
 */
export function findNashPoints(start: number, end: number, tolerance: number = 1e-10): number[] {
  const nashPoints: number[] = [];

  for (let n = start; n <= end; n++) {
    if (isNashPoint(n, tolerance)) {
      nashPoints.push(n);
    }
  }

  return nashPoints;
}

/**
 * Calculate convergence rate for optimization
 * Measures how quickly S(n) approaches 0
 */
export function calculateConvergenceRate(n: number, steps: number = 5): number {
  const values: number[] = [];

  for (let i = 0; i < steps; i++) {
    values.push(Math.abs(calculateS(n + i)));
  }

  // Calculate rate of change
  let totalChange = 0;
  for (let i = 1; i < values.length; i++) {
    const change = Math.abs(values[i] - values[i - 1]);
    totalChange += change;
  }

  return totalChange / (steps - 1);
}

/**
 * Generate sequence values efficiently
 */
export function generateSequence(n: number): {
  F: number;
  L: number;
  Z: number;
  S: number;
} {
  const F = fibonacci(n);
  const L = lucas(n);
  const Z = calculateZ(n);
  const S = 2 * F - L;

  return { F, L, Z, S };
}

/**
 * Batch compute values for multiple indices (optimized)
 */
export function batchCompute(indices: number[]): Array<{
  n: number;
  F: number;
  L: number;
  Z: number;
  S: number;
}> {
  return indices.map(n => ({
    n,
    ...generateSequence(n)
  }));
}

/**
 * Constants and utilities
 */
export const GOLDEN_RATIO = PHI;
export const CONJUGATE_RATIO = PSI;

export { PHI, PSI, SQRT5 };

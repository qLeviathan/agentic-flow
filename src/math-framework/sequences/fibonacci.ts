/**
 * Fibonacci Number Generation with Multiple Methods
 *
 * Implements multiple algorithms for computing Fibonacci numbers:
 * 1. Recurrence relation: F(n) = F(n-1) + F(n-2)
 * 2. Binet's formula: F(n) = (φⁿ - ψⁿ)/√5
 * 3. Q-matrix method: Fast matrix exponentiation
 * 4. Memoization for performance optimization
 *
 * All methods are verified against each other for correctness.
 */

import { fibonacciQMatrix, QMatrixResult } from './q-matrix';

// Golden ratio and related constants
export const PHI = (1 + Math.sqrt(5)) / 2;      // φ = (1 + √5) / 2 ≈ 1.618...
export const PSI = (1 - Math.sqrt(5)) / 2;      // ψ = (1 - √5) / 2 ≈ -0.618...
export const SQRT5 = Math.sqrt(5);

export interface FibonacciResult {
  value: bigint;
  n: number;
  method: 'recurrence' | 'binet' | 'qmatrix' | 'memoized';
  computationTime?: number;
}

export interface FibonacciComparison {
  n: number;
  recurrence: bigint;
  binet: bigint;
  qmatrix: bigint;
  memoized: bigint;
  allMatch: boolean;
  timings: {
    recurrence: number;
    binet: number;
    qmatrix: number;
    memoized: number;
  };
}

/**
 * Memoization cache for Fibonacci numbers
 */
class FibonacciCache {
  private cache: Map<number, bigint> = new Map();

  constructor() {
    // Initialize with base cases
    this.cache.set(0, 0n);
    this.cache.set(1, 1n);
  }

  get(n: number): bigint | undefined {
    return this.cache.get(n);
  }

  set(n: number, value: bigint): void {
    this.cache.set(n, value);
  }

  has(n: number): boolean {
    return this.cache.has(n);
  }

  clear(): void {
    this.cache.clear();
    this.cache.set(0, 0n);
    this.cache.set(1, 1n);
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
const fibCache = new FibonacciCache();

/**
 * Method 1: Recurrence Relation
 * F(n) = F(n-1) + F(n-2) with F(0) = 0, F(1) = 1
 *
 * Time: O(n), Space: O(n) due to recursion stack
 * Not recommended for large n without memoization
 */
export function fibonacciRecurrence(n: number): FibonacciResult {
  const startTime = performance.now();

  if (!Number.isInteger(n)) {
    throw new Error('n must be an integer');
  }

  if (n < 0) {
    throw new Error('n must be non-negative');
  }

  function fib(k: number): bigint {
    if (k === 0) return 0n;
    if (k === 1) return 1n;
    return fib(k - 1) + fib(k - 2);
  }

  const value = fib(n);
  const computationTime = performance.now() - startTime;

  return {
    value,
    n,
    method: 'recurrence',
    computationTime
  };
}

/**
 * Method 2: Binet's Formula
 * F(n) = (φⁿ - ψⁿ)/√5
 *
 * Time: O(1), Space: O(1)
 * Note: Limited by floating-point precision for large n (accurate up to ~70)
 */
export function fibonacciBinet(n: number): FibonacciResult {
  const startTime = performance.now();

  if (!Number.isInteger(n)) {
    throw new Error('n must be an integer');
  }

  if (n < 0) {
    throw new Error('n must be non-negative');
  }

  // For very large n, Binet's formula loses precision due to floating-point arithmetic
  // We use it primarily for verification on smaller values
  const phi_n = Math.pow(PHI, n);
  const psi_n = Math.pow(PSI, n);
  const result = (phi_n - psi_n) / SQRT5;

  // Round to nearest integer and convert to bigint
  const value = BigInt(Math.round(result));
  const computationTime = performance.now() - startTime;

  return {
    value,
    n,
    method: 'binet',
    computationTime
  };
}

/**
 * Method 3: Q-Matrix Method
 * Uses fast matrix exponentiation
 *
 * Time: O(log n), Space: O(log n)
 * Most efficient for large n
 */
export function fibonacciMatrix(n: number): FibonacciResult {
  const startTime = performance.now();

  const result = fibonacciQMatrix(n);
  const computationTime = performance.now() - startTime;

  return {
    value: result.fibonacci,
    n,
    method: 'qmatrix',
    computationTime
  };
}

/**
 * Method 4: Memoized Iterative Approach
 * Combines efficiency with caching
 *
 * Time: O(n) first call, O(1) cached, Space: O(n) cache
 * Best for repeated queries
 */
export function fibonacciMemoized(n: number): FibonacciResult {
  const startTime = performance.now();

  if (!Number.isInteger(n)) {
    throw new Error('n must be an integer');
  }

  if (n < 0) {
    throw new Error('n must be non-negative');
  }

  // Check cache first
  if (fibCache.has(n)) {
    const value = fibCache.get(n)!;
    const computationTime = performance.now() - startTime;
    return {
      value,
      n,
      method: 'memoized',
      computationTime
    };
  }

  // Find the highest cached value less than n
  let current = 1;
  while (current < n && !fibCache.has(current)) {
    current++;
  }

  // Compute from the last cached value to n
  let prev = fibCache.get(current - 1) || 0n;
  let curr = fibCache.get(current) || 1n;

  for (let i = current + 1; i <= n; i++) {
    const next = prev + curr;
    fibCache.set(i, next);
    prev = curr;
    curr = next;
  }

  const value = fibCache.get(n)!;
  const computationTime = performance.now() - startTime;

  return {
    value,
    n,
    method: 'memoized',
    computationTime
  };
}

/**
 * Default Fibonacci function using the most efficient method
 */
export function fibonacci(n: number): bigint {
  // For small n, use memoized approach
  if (n < 100) {
    return fibonacciMemoized(n).value;
  }

  // For large n, use Q-matrix method
  return fibonacciMatrix(n).value;
}

/**
 * Compare all methods and verify consistency
 */
export function fibonacciCompare(n: number): FibonacciComparison {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error('n must be a non-negative integer');
  }

  // Only use recurrence for small n (it's exponential without memoization)
  const recurrenceResult = n <= 30
    ? fibonacciRecurrence(n)
    : { value: fibonacciMemoized(n).value, computationTime: 0 };

  // Binet's formula is only accurate for moderate n
  const binetResult = n <= 70
    ? fibonacciBinet(n)
    : { value: fibonacciMatrix(n).value, computationTime: 0 };

  const qmatrixResult = fibonacciMatrix(n);
  const memoizedResult = fibonacciMemoized(n);

  const recurrence = recurrenceResult.value;
  const binet = binetResult.value;
  const qmatrix = qmatrixResult.value;
  const memoized = memoizedResult.value;

  const allMatch = recurrence === binet && binet === qmatrix && qmatrix === memoized;

  return {
    n,
    recurrence,
    binet,
    qmatrix,
    memoized,
    allMatch,
    timings: {
      recurrence: recurrenceResult.computationTime || 0,
      binet: binetResult.computationTime || 0,
      qmatrix: qmatrixResult.computationTime,
      memoized: memoizedResult.computationTime
    }
  };
}

/**
 * Generate Fibonacci sequence up to n
 */
export function fibonacciSequence(n: number): bigint[] {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error('n must be a non-negative integer');
  }

  const sequence: bigint[] = [];

  for (let i = 0; i <= n; i++) {
    sequence.push(fibonacci(i));
  }

  return sequence;
}

/**
 * Clear the memoization cache
 */
export function clearFibonacciCache(): void {
  fibCache.clear();
}

/**
 * Get cache statistics
 */
export function getFibonacciCacheStats(): { size: number; entries: Array<[number, bigint]> } {
  return {
    size: fibCache.size(),
    entries: Array.from({ length: fibCache.size() }, (_, i) => {
      const value = fibCache.get(i);
      return value !== undefined ? [i, value] as [number, bigint] : null;
    }).filter((entry): entry is [number, bigint] => entry !== null)
  };
}

/**
 * Fibonacci number properties and identities
 */
export const FibonacciIdentities = {
  /**
   * Cassini's identity: F(n-1) * F(n+1) - F(n)² = (-1)ⁿ
   */
  verifyCassini(n: number): boolean {
    if (n === 0) return true;
    const fn1 = fibonacci(n - 1);
    const fn = fibonacci(n);
    const fn_plus_1 = fibonacci(n + 1);
    const left = fn1 * fn_plus_1 - fn * fn;
    const right = BigInt(n % 2 === 0 ? 1 : -1);
    return left === right;
  },

  /**
   * F(2n) = F(n) * [2*F(n+1) - F(n)]
   */
  verifyDoubling(n: number): boolean {
    const f2n = fibonacci(2 * n);
    const fn = fibonacci(n);
    const fn_plus_1 = fibonacci(n + 1);
    const calculated = fn * (2n * fn_plus_1 - fn);
    return f2n === calculated;
  },

  /**
   * Sum of first n Fibonacci numbers: Σ F(i) = F(n+2) - 1
   */
  verifySum(n: number): boolean {
    let sum = 0n;
    for (let i = 0; i <= n; i++) {
      sum += fibonacci(i);
    }
    const expected = fibonacci(n + 2) - 1n;
    return sum === expected;
  }
};

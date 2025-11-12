/**
 * Lucas Number Generation
 *
 * Lucas numbers are closely related to Fibonacci numbers:
 * L(n) = L(n-1) + L(n-2) with L(0) = 2, L(1) = 1
 *
 * Key formulas:
 * 1. Recurrence: L(n) = L(n-1) + L(n-2)
 * 2. Binet-like formula: L(n) = φⁿ + ψⁿ
 * 3. Relation to Fibonacci: L(n) = F(n-1) + F(n+1)
 * 4. Alternative: L(n) = F(n) + 2*F(n-1)
 */

import { fibonacci, PHI, PSI } from './fibonacci';

export interface LucasResult {
  value: bigint;
  n: number;
  method: 'recurrence' | 'binet' | 'fibonacci-relation' | 'memoized';
  computationTime?: number;
}

export interface LucasComparison {
  n: number;
  recurrence: bigint;
  binet: bigint;
  fibonacciRelation: bigint;
  memoized: bigint;
  allMatch: boolean;
  timings: {
    recurrence: number;
    binet: number;
    fibonacciRelation: number;
    memoized: number;
  };
}

/**
 * Memoization cache for Lucas numbers
 */
class LucasCache {
  private cache: Map<number, bigint> = new Map();

  constructor() {
    // Initialize with base cases: L(0) = 2, L(1) = 1
    this.cache.set(0, 2n);
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
    this.cache.set(0, 2n);
    this.cache.set(1, 1n);
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
const lucasCache = new LucasCache();

/**
 * Method 1: Recurrence Relation
 * L(n) = L(n-1) + L(n-2) with L(0) = 2, L(1) = 1
 *
 * Time: O(n), Space: O(n)
 */
export function lucasRecurrence(n: number): LucasResult {
  const startTime = performance.now();

  if (!Number.isInteger(n)) {
    throw new Error('n must be an integer');
  }

  if (n < 0) {
    throw new Error('n must be non-negative');
  }

  function lucas(k: number): bigint {
    if (k === 0) return 2n;
    if (k === 1) return 1n;
    return lucas(k - 1) + lucas(k - 2);
  }

  const value = lucas(n);
  const computationTime = performance.now() - startTime;

  return {
    value,
    n,
    method: 'recurrence',
    computationTime
  };
}

/**
 * Method 2: Binet-like Formula
 * L(n) = φⁿ + ψⁿ
 *
 * Time: O(1), Space: O(1)
 * Note: Limited by floating-point precision for large n
 */
export function lucasBinet(n: number): LucasResult {
  const startTime = performance.now();

  if (!Number.isInteger(n)) {
    throw new Error('n must be an integer');
  }

  if (n < 0) {
    throw new Error('n must be non-negative');
  }

  const phi_n = Math.pow(PHI, n);
  const psi_n = Math.pow(PSI, n);
  const result = phi_n + psi_n;

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
 * Method 3: Fibonacci Relation
 * L(n) = F(n-1) + F(n+1)
 *
 * Time: O(log n) using Q-matrix, Space: O(log n)
 */
export function lucasFibonacciRelation(n: number): LucasResult {
  const startTime = performance.now();

  if (!Number.isInteger(n)) {
    throw new Error('n must be an integer');
  }

  if (n < 0) {
    throw new Error('n must be non-negative');
  }

  // Special case for n = 0
  if (n === 0) {
    const computationTime = performance.now() - startTime;
    return {
      value: 2n,
      n: 0,
      method: 'fibonacci-relation',
      computationTime
    };
  }

  // L(n) = F(n-1) + F(n+1)
  const fn_minus_1 = fibonacci(n - 1);
  const fn_plus_1 = fibonacci(n + 1);
  const value = fn_minus_1 + fn_plus_1;
  const computationTime = performance.now() - startTime;

  return {
    value,
    n,
    method: 'fibonacci-relation',
    computationTime
  };
}

/**
 * Alternative Fibonacci Relation:
 * L(n) = F(n) + 2*F(n-1)
 */
export function lucasFibonacciAlternative(n: number): bigint {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('n must be a non-negative integer');
  }

  if (n === 0) return 2n;

  const fn = fibonacci(n);
  const fn_minus_1 = fibonacci(n - 1);
  return fn + 2n * fn_minus_1;
}

/**
 * Method 4: Memoized Iterative Approach
 *
 * Time: O(n) first call, O(1) cached, Space: O(n)
 */
export function lucasMemoized(n: number): LucasResult {
  const startTime = performance.now();

  if (!Number.isInteger(n)) {
    throw new Error('n must be an integer');
  }

  if (n < 0) {
    throw new Error('n must be non-negative');
  }

  // Check cache first
  if (lucasCache.has(n)) {
    const value = lucasCache.get(n)!;
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
  while (current < n && !lucasCache.has(current)) {
    current++;
  }

  // Compute from the last cached value to n
  let prev = lucasCache.get(current - 1) || 2n;
  let curr = lucasCache.get(current) || 1n;

  for (let i = current + 1; i <= n; i++) {
    const next = prev + curr;
    lucasCache.set(i, next);
    prev = curr;
    curr = next;
  }

  const value = lucasCache.get(n)!;
  const computationTime = performance.now() - startTime;

  return {
    value,
    n,
    method: 'memoized',
    computationTime
  };
}

/**
 * Default Lucas function using the most efficient method
 */
export function lucas(n: number): bigint {
  // Use memoized approach for best performance with repeated queries
  return lucasMemoized(n).value;
}

/**
 * Compare all methods and verify consistency
 */
export function lucasCompare(n: number): LucasComparison {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error('n must be a non-negative integer');
  }

  // Only use recurrence for small n
  const recurrenceResult = n <= 30
    ? lucasRecurrence(n)
    : { value: lucasMemoized(n).value, computationTime: 0 };

  // Binet's formula is only accurate for moderate n
  const binetResult = n <= 70
    ? lucasBinet(n)
    : { value: lucasFibonacciRelation(n).value, computationTime: 0 };

  const fibonacciRelationResult = lucasFibonacciRelation(n);
  const memoizedResult = lucasMemoized(n);

  const recurrence = recurrenceResult.value;
  const binet = binetResult.value;
  const fibonacciRelation = fibonacciRelationResult.value;
  const memoized = memoizedResult.value;

  const allMatch = recurrence === binet &&
                   binet === fibonacciRelation &&
                   fibonacciRelation === memoized;

  return {
    n,
    recurrence,
    binet,
    fibonacciRelation,
    memoized,
    allMatch,
    timings: {
      recurrence: recurrenceResult.computationTime || 0,
      binet: binetResult.computationTime || 0,
      fibonacciRelation: fibonacciRelationResult.computationTime,
      memoized: memoizedResult.computationTime
    }
  };
}

/**
 * Generate Lucas sequence up to n
 */
export function lucasSequence(n: number): bigint[] {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error('n must be a non-negative integer');
  }

  const sequence: bigint[] = [];

  for (let i = 0; i <= n; i++) {
    sequence.push(lucas(i));
  }

  return sequence;
}

/**
 * Clear the memoization cache
 */
export function clearLucasCache(): void {
  lucasCache.clear();
}

/**
 * Get cache statistics
 */
export function getLucasCacheStats(): { size: number; entries: Array<[number, bigint]> } {
  return {
    size: lucasCache.size(),
    entries: Array.from({ length: lucasCache.size() }, (_, i) => {
      const value = lucasCache.get(i);
      return value !== undefined ? [i, value] as [number, bigint] : null;
    }).filter((entry): entry is [number, bigint] => entry !== null)
  };
}

/**
 * Lucas number properties and relationships
 */
export const LucasIdentities = {
  /**
   * Verify L(n) = F(n-1) + F(n+1)
   */
  verifyFibonacciRelation(n: number): boolean {
    if (n === 0) return lucas(0) === 2n;
    const lucasN = lucas(n);
    const fn_minus_1 = fibonacci(n - 1);
    const fn_plus_1 = fibonacci(n + 1);
    return lucasN === fn_minus_1 + fn_plus_1;
  },

  /**
   * Verify L(n) = F(n) + 2*F(n-1)
   */
  verifyAlternativeRelation(n: number): boolean {
    const lucasN = lucas(n);
    const calculated = lucasFibonacciAlternative(n);
    return lucasN === calculated;
  },

  /**
   * Verify L(n)² - 5*F(n)² = 4*(-1)ⁿ
   */
  verifySquareIdentity(n: number): boolean {
    const lucasN = lucas(n);
    const fibN = fibonacci(n);
    const left = lucasN * lucasN - 5n * fibN * fibN;
    const right = BigInt(4 * (n % 2 === 0 ? 1 : -1));
    return left === right;
  },

  /**
   * Verify L(2n) = L(n)² - 2*(-1)ⁿ
   */
  verifyDoubling(n: number): boolean {
    const lucas2n = lucas(2 * n);
    const lucasN = lucas(n);
    const right = lucasN * lucasN - BigInt(2 * (n % 2 === 0 ? 1 : -1));
    return lucas2n === right;
  },

  /**
   * Verify F(2n) = F(n) * L(n)
   */
  verifyFibonacciLucasProduct(n: number): boolean {
    const fib2n = fibonacci(2 * n);
    const fibN = fibonacci(n);
    const lucasN = lucas(n);
    return fib2n === fibN * lucasN;
  }
};

/**
 * Relationship utilities between Fibonacci and Lucas numbers
 */
export const FibonacciLucasRelations = {
  /**
   * Compute both Fibonacci and Lucas efficiently
   */
  computeBoth(n: number): { fibonacci: bigint; lucas: bigint } {
    return {
      fibonacci: fibonacci(n),
      lucas: lucas(n)
    };
  },

  /**
   * Generate parallel sequences
   */
  parallelSequences(n: number): Array<{ n: number; fibonacci: bigint; lucas: bigint }> {
    const sequences: Array<{ n: number; fibonacci: bigint; lucas: bigint }> = [];

    for (let i = 0; i <= n; i++) {
      sequences.push({
        n: i,
        fibonacci: fibonacci(i),
        lucas: lucas(i)
      });
    }

    return sequences;
  },

  /**
   * Verify all major identities for a given n
   */
  verifyAllIdentities(n: number): {
    n: number;
    fibonacciRelation: boolean;
    alternativeRelation: boolean;
    squareIdentity: boolean;
    doublingFormula: boolean;
    fibonacciLucasProduct: boolean;
    allPass: boolean;
  } {
    const fibRel = LucasIdentities.verifyFibonacciRelation(n);
    const altRel = LucasIdentities.verifyAlternativeRelation(n);
    const sqId = LucasIdentities.verifySquareIdentity(n);
    const dbl = LucasIdentities.verifyDoubling(n);
    const prod = LucasIdentities.verifyFibonacciLucasProduct(n);

    return {
      n,
      fibonacciRelation: fibRel,
      alternativeRelation: altRel,
      squareIdentity: sqId,
      doublingFormula: dbl,
      fibonacciLucasProduct: prod,
      allPass: fibRel && altRel && sqId && dbl && prod
    };
  }
};

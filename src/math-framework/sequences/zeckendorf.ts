/**
 * Zeckendorf Representation
 *
 * Every positive integer has a unique representation as a sum of
 * non-consecutive Fibonacci numbers (Zeckendorf's theorem).
 *
 * z(n) = number of terms in Zeckendorf representation of n
 */

import { fibonacci } from './fibonacci';

export interface ZeckendorfRepresentation {
  terms: bigint[];      // The Fibonacci numbers used
  indices: number[];    // Indices of the Fibonacci numbers
  count: number;        // z(n) - number of terms
}

/**
 * Get Zeckendorf representation of a number
 * Uses greedy algorithm: repeatedly subtract largest Fibonacci ≤ remaining value
 */
export function getZeckendorfRepresentation(n: bigint): ZeckendorfRepresentation {
  if (n <= 0n) {
    return { terms: [], indices: [], count: 0 };
  }

  const terms: bigint[] = [];
  const indices: number[] = [];
  let remaining = n;

  // Find the largest Fibonacci number ≤ n
  let maxIndex = 0;
  while (fibonacci(maxIndex + 1) <= n) {
    maxIndex++;
  }

  // Greedy algorithm: work backwards from largest Fibonacci
  for (let i = maxIndex; i >= 2 && remaining > 0n; i--) {
    const fib = fibonacci(i);
    if (fib <= remaining) {
      terms.push(fib);
      indices.push(i);
      remaining -= fib;
    }
  }

  return {
    terms,
    indices,
    count: terms.length
  };
}

/**
 * Get z(n) - the count of terms in Zeckendorf representation
 */
export function z(n: bigint): number {
  return getZeckendorfRepresentation(n).count;
}

/**
 * Compute z(k) for all k from 0 to n
 * Returns array where result[k] = z(k)
 */
export function computeZeckendorfCounts(n: number): number[] {
  const counts: number[] = new Array(n + 1);

  for (let k = 0; k <= n; k++) {
    counts[k] = z(BigInt(k));
  }

  return counts;
}

/**
 * Verify Zeckendorf representation is valid:
 * 1. Terms are non-consecutive Fibonacci numbers
 * 2. Terms sum to the original number
 */
export function verifyZeckendorfRepresentation(
  n: bigint,
  repr: ZeckendorfRepresentation
): boolean {
  // Check sum
  const sum = repr.terms.reduce((acc, term) => acc + term, 0n);
  if (sum !== n) return false;

  // Check non-consecutive indices
  for (let i = 0; i < repr.indices.length - 1; i++) {
    if (repr.indices[i] - repr.indices[i + 1] < 2) {
      return false;
    }
  }

  // Check all terms are Fibonacci numbers
  for (let i = 0; i < repr.terms.length; i++) {
    if (fibonacci(repr.indices[i]) !== repr.terms[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Get detailed Zeckendorf representation as string
 * Example: "100 = F(9) + F(6) + F(4) = 55 + 21 + 13 + 8 + 3"
 */
export function zeckendorfToString(n: bigint): string {
  const repr = getZeckendorfRepresentation(n);

  if (repr.count === 0) {
    return `${n} = 0`;
  }

  const fibTerms = repr.indices.map((idx, i) => `F(${idx})`).join(' + ');
  const values = repr.terms.map(t => t.toString()).join(' + ');

  return `${n} = ${fibTerms} = ${values}`;
}

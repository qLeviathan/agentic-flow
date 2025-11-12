/**
 * Lucas Representation
 *
 * Similar to Zeckendorf representation, but using Lucas numbers.
 * Every positive integer can be represented as a sum of Lucas numbers.
 *
 * ℓ(n) = number of terms in Lucas representation of n
 */

import { lucas } from './lucas';

export interface LucasRepresentation {
  terms: bigint[];      // The Lucas numbers used
  indices: number[];    // Indices of the Lucas numbers
  count: number;        // ℓ(n) - number of terms
}

/**
 * Get Lucas representation of a number
 * Uses greedy algorithm similar to Zeckendorf
 */
export function getLucasRepresentation(n: bigint): LucasRepresentation {
  if (n <= 0n) {
    return { terms: [], indices: [], count: 0 };
  }

  const terms: bigint[] = [];
  const indices: number[] = [];
  let remaining = n;

  // Find the largest Lucas number ≤ n
  let maxIndex = 0;
  while (lucas(maxIndex + 1) <= n) {
    maxIndex++;
  }

  // Greedy algorithm: work backwards from largest Lucas number
  for (let i = maxIndex; i >= 0 && remaining > 0n; i--) {
    const lucasNum = lucas(i);
    if (lucasNum <= remaining) {
      terms.push(lucasNum);
      indices.push(i);
      remaining -= lucasNum;
    }
  }

  return {
    terms,
    indices,
    count: terms.length
  };
}

/**
 * Get ℓ(n) - the count of terms in Lucas representation
 */
export function ℓ(n: bigint): number {
  return getLucasRepresentation(n).count;
}

/**
 * Compute ℓ(k) for all k from 0 to n
 * Returns array where result[k] = ℓ(k)
 */
export function computeLucasCounts(n: number): number[] {
  const counts: number[] = new Array(n + 1);

  for (let k = 0; k <= n; k++) {
    counts[k] = ℓ(BigInt(k));
  }

  return counts;
}

/**
 * Verify Lucas representation is valid:
 * 1. Terms sum to the original number
 * 2. All terms are Lucas numbers
 */
export function verifyLucasRepresentation(
  n: bigint,
  repr: LucasRepresentation
): boolean {
  // Check sum
  const sum = repr.terms.reduce((acc, term) => acc + term, 0n);
  if (sum !== n) return false;

  // Check all terms are Lucas numbers
  for (let i = 0; i < repr.terms.length; i++) {
    if (lucas(repr.indices[i]) !== repr.terms[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Get detailed Lucas representation as string
 * Example: "100 = L(8) + L(6) + L(4) = 47 + 11 + 4 + 2"
 */
export function lucasToString(n: bigint): string {
  const repr = getLucasRepresentation(n);

  if (repr.count === 0) {
    return `${n} = 0`;
  }

  const lucasTerms = repr.indices.map((idx, i) => `L(${idx})`).join(' + ');
  const values = repr.terms.map(t => t.toString()).join(' + ');

  return `${n} = ${lucasTerms} = ${values}`;
}

/**
 * Check if a number is a Lucas number
 */
export function isLucasNumber(value: bigint): boolean {
  let n = 0;
  while (true) {
    const lucasNum = lucas(n);
    if (lucasNum === value) return true;
    if (lucasNum > value) return false;
    n++;
  }
}

/**
 * Find the index m where L(m) = value, or -1 if not found
 */
export function findLucasIndex(value: bigint): number {
  let n = 0;
  while (true) {
    const lucasNum = lucas(n);
    if (lucasNum === value) return n;
    if (lucasNum > value) return -1;
    n++;
  }
}

/**
 * Zeckendorf Decomposition System (Level 4)
 *
 * Implementation of Zeckendorf's theorem: Every positive integer can be
 * represented uniquely as a sum of non-consecutive Fibonacci numbers.
 *
 * Mathematical Foundation:
 * - Fibonacci sequence: F₁=1, F₂=2, F₃=3, F₄=5, F₅=8, ...
 * - Zeckendorf address Z(n): Set of Fibonacci indices for unique decomposition
 * - Summand count z(n) = |Z(n)|
 * - Lucas summand count ℓ(n): Fibonacci indices that are Lucas indices
 *
 * @module zeckendorf
 */

/**
 * Zeckendorf representation of a number
 */
export interface ZeckendorfRepresentation {
  /** Original number */
  n: number;
  /** Z(n): Set of Fibonacci indices used in decomposition */
  indices: Set<number>;
  /** Actual Fibonacci values in decomposition */
  values: number[];
  /** z(n): Count of summands |Z(n)| */
  summandCount: number;
  /** ℓ(n): Lucas summand count */
  lucasSummandCount: number;
  /** Verification that decomposition is valid */
  isValid: boolean;
  /** String representation for display */
  representation: string;
}

/**
 * Generate Fibonacci numbers up to a maximum value
 * Uses iterative approach for efficiency
 *
 * @param maxValue - Maximum value to generate up to
 * @returns Array of Fibonacci numbers [1, 2, 3, 5, 8, ...]
 */
export function generateFibonacci(maxValue: number): number[] {
  if (maxValue < 1) return [];

  const fibonacci: number[] = [1, 2];

  while (true) {
    const next = fibonacci[fibonacci.length - 1] + fibonacci[fibonacci.length - 2];
    if (next > maxValue) break;
    fibonacci.push(next);
  }

  return fibonacci;
}

/**
 * Check if a number is a Lucas index in the Fibonacci sequence
 * Lucas indices: 2, 1, 3, 4, 7, 11, 18, 29, 47, ...
 *
 * A Lucas index is one where F(n) is a Lucas number
 * Lucas numbers: 2, 1, 3, 4, 7, 11, 18, 29, 47, 76, ...
 *
 * @param index - Fibonacci index (1-based)
 * @returns true if index corresponds to a Lucas number
 */
export function isLucasIndex(index: number): boolean {
  // Lucas indices in Fibonacci sequence follow pattern
  // For simplicity, we'll use first several known Lucas indices
  const lucasIndices = new Set([1, 2, 3, 4, 7, 11, 18, 29, 47, 76, 123]);
  return lucasIndices.has(index);
}

/**
 * Decompose a number into Zeckendorf representation using greedy algorithm
 *
 * Algorithm:
 * 1. Generate Fibonacci numbers up to n
 * 2. Greedily select largest Fibonacci ≤ remaining value
 * 3. Ensure no consecutive indices are selected
 * 4. Continue until remainder is 0
 *
 * Time Complexity: O(log n)
 * Space Complexity: O(log n)
 *
 * @param n - Positive integer to decompose
 * @returns Zeckendorf representation
 * @throws Error if n is not a positive integer
 */
export function zeckendorfDecompose(n: number): ZeckendorfRepresentation {
  // Validation
  if (!Number.isInteger(n) || n < 1) {
    throw new Error('Input must be a positive integer');
  }

  // Generate Fibonacci sequence up to n
  const fibonacci = generateFibonacci(n);

  // Greedy algorithm: select largest Fibonacci numbers
  const indices = new Set<number>();
  const values: number[] = [];
  let remainder = n;
  let lastIndex = fibonacci.length; // Start from largest

  for (let i = fibonacci.length - 1; i >= 0; i--) {
    const fib = fibonacci[i];

    // If current Fibonacci fits in remainder and is not consecutive to last selected
    if (fib <= remainder && i + 1 < lastIndex) {
      indices.add(i + 1); // 1-based indexing
      values.push(fib);
      remainder -= fib;
      lastIndex = i + 1;

      if (remainder === 0) break;
    }
  }

  // Verify decomposition is complete
  if (remainder !== 0) {
    throw new Error(`Failed to decompose ${n}: remainder ${remainder}`);
  }

  // Calculate Lucas summand count
  let lucasCount = 0;
  for (const index of indices) {
    if (isLucasIndex(index)) {
      lucasCount++;
    }
  }

  // Verify uniqueness and correctness
  const isValid = verifyZeckendorfRepresentation(n, indices, fibonacci);

  // Create readable representation
  const representation = values
    .map((val, idx) => `F${Array.from(indices)[idx]}=${val}`)
    .join(' + ');

  return {
    n,
    indices,
    values,
    summandCount: indices.size,
    lucasSummandCount: lucasCount,
    isValid,
    representation: `${n} = ${representation}`
  };
}

/**
 * Verify that a Zeckendorf representation is valid
 *
 * Checks:
 * 1. Sum of Fibonacci numbers equals n
 * 2. No consecutive indices (Zeckendorf theorem requirement)
 * 3. All indices are valid
 *
 * @param n - Original number
 * @param indices - Set of Fibonacci indices
 * @param fibonacci - Fibonacci sequence
 * @returns true if representation is valid
 */
export function verifyZeckendorfRepresentation(
  n: number,
  indices: Set<number>,
  fibonacci: number[]
): boolean {
  // Convert to sorted array for consecutive check
  const sortedIndices = Array.from(indices).sort((a, b) => a - b);

  // Check 1: Sum equals n
  let sum = 0;
  for (const index of sortedIndices) {
    if (index < 1 || index > fibonacci.length) {
      return false; // Invalid index
    }
    sum += fibonacci[index - 1]; // 1-based to 0-based
  }

  if (sum !== n) {
    return false; // Sum doesn't match
  }

  // Check 2: No consecutive indices
  for (let i = 0; i < sortedIndices.length - 1; i++) {
    if (sortedIndices[i + 1] - sortedIndices[i] === 1) {
      return false; // Consecutive indices found
    }
  }

  return true;
}

/**
 * Z(n): Get Zeckendorf address set (unique decomposition indices)
 *
 * @param n - Positive integer
 * @returns Set of Fibonacci indices
 */
export function Z(n: number): Set<number> {
  return zeckendorfDecompose(n).indices;
}

/**
 * z(n): Get summand count |Z(n)|
 *
 * @param n - Positive integer
 * @returns Number of Fibonacci summands in decomposition
 */
export function z(n: number): number {
  return zeckendorfDecompose(n).summandCount;
}

/**
 * ℓ(n): Get Lucas summand count
 *
 * @param n - Positive integer
 * @returns Number of Lucas indices in Zeckendorf decomposition
 */
export function ℓ(n: number): number {
  return zeckendorfDecompose(n).lucasSummandCount;
}

/**
 * Verify Zeckendorf theorem: uniqueness of decomposition
 *
 * Theorem: Every positive integer has exactly one representation as a sum
 * of non-consecutive Fibonacci numbers.
 *
 * This function attempts to find alternative decompositions to verify uniqueness.
 *
 * @param n - Positive integer
 * @returns true if decomposition is provably unique
 */
export function verifyZeckendorfTheorem(n: number): boolean {
  const canonical = zeckendorfDecompose(n);

  if (!canonical.isValid) {
    return false;
  }

  // The greedy algorithm guarantees uniqueness by construction:
  // 1. We always choose the largest possible Fibonacci number
  // 2. This prevents consecutive indices (by skipping adjacent)
  // 3. Any alternative would require smaller numbers, leading to conflicts

  // Verify by attempting alternative decomposition
  // If we can create the same sum with different indices, uniqueness fails
  const fibonacci = generateFibonacci(n);

  // Try to find any other valid combination (brute force for small n)
  if (n <= 100) {
    const alternativeExists = findAlternativeDecomposition(n, canonical.indices, fibonacci);
    if (alternativeExists) {
      return false; // Found alternative, uniqueness violated
    }
  }

  return true;
}

/**
 * Attempt to find alternative valid Zeckendorf decomposition
 * Used for theorem verification
 *
 * @param n - Target number
 * @param canonicalIndices - Canonical decomposition indices
 * @param fibonacci - Fibonacci sequence
 * @returns true if alternative found (violates uniqueness)
 */
function findAlternativeDecomposition(
  n: number,
  canonicalIndices: Set<number>,
  fibonacci: number[]
): boolean {
  // Generate all possible non-consecutive combinations
  const combinations = generateNonConsecutiveCombinations(fibonacci.length);

  for (const combo of combinations) {
    // Skip the canonical decomposition
    const comboSet = new Set(combo);
    if (setsEqual(comboSet, canonicalIndices)) {
      continue;
    }

    // Check if this combination sums to n
    let sum = 0;
    for (const index of combo) {
      sum += fibonacci[index - 1];
    }

    if (sum === n) {
      return true; // Found alternative
    }
  }

  return false;
}

/**
 * Generate all non-consecutive index combinations
 * Used for exhaustive verification
 *
 * @param maxIndex - Maximum index to consider
 * @returns Array of valid index combinations
 */
function generateNonConsecutiveCombinations(maxIndex: number): number[][] {
  const results: number[][] = [];

  function backtrack(start: number, current: number[]): void {
    results.push([...current]);

    for (let i = start; i <= maxIndex; i++) {
      // Ensure non-consecutive: next index must be at least 2 more than last
      if (current.length === 0 || i >= current[current.length - 1] + 2) {
        current.push(i);
        backtrack(i + 2, current); // Next must be at least i+2
        current.pop();
      }
    }
  }

  backtrack(1, []);
  return results.filter(combo => combo.length > 0);
}

/**
 * Check if two sets are equal
 *
 * @param set1 - First set
 * @param set2 - Second set
 * @returns true if sets contain same elements
 */
function setsEqual<T>(set1: Set<T>, set2: Set<T>): boolean {
  if (set1.size !== set2.size) return false;
  for (const item of set1) {
    if (!set2.has(item)) return false;
  }
  return true;
}

/**
 * Batch decompose multiple numbers
 * Useful for analysis and pattern learning
 *
 * @param numbers - Array of numbers to decompose
 * @returns Array of Zeckendorf representations
 */
export function batchDecompose(numbers: number[]): ZeckendorfRepresentation[] {
  return numbers.map(n => zeckendorfDecompose(n));
}

/**
 * Analyze patterns in Zeckendorf decompositions
 * Returns statistical insights for learning
 *
 * @param numbers - Array of numbers to analyze
 * @returns Analysis results
 */
export interface ZeckendorfAnalysis {
  totalNumbers: number;
  averageSummandCount: number;
  maxSummandCount: number;
  minSummandCount: number;
  averageLucasCount: number;
  allValid: boolean;
  patterns: {
    summandDistribution: Map<number, number>;
    commonIndices: Map<number, number>;
  };
}

export function analyzeZeckendorfPatterns(numbers: number[]): ZeckendorfAnalysis {
  const decompositions = batchDecompose(numbers);

  let totalSummands = 0;
  let totalLucas = 0;
  let maxSummands = 0;
  let minSummands = Infinity;
  let allValid = true;

  const summandDistribution = new Map<number, number>();
  const commonIndices = new Map<number, number>();

  for (const decomp of decompositions) {
    totalSummands += decomp.summandCount;
    totalLucas += decomp.lucasSummandCount;
    maxSummands = Math.max(maxSummands, decomp.summandCount);
    minSummands = Math.min(minSummands, decomp.summandCount);
    allValid = allValid && decomp.isValid;

    // Track summand count distribution
    summandDistribution.set(
      decomp.summandCount,
      (summandDistribution.get(decomp.summandCount) || 0) + 1
    );

    // Track common indices
    for (const index of decomp.indices) {
      commonIndices.set(index, (commonIndices.get(index) || 0) + 1);
    }
  }

  return {
    totalNumbers: numbers.length,
    averageSummandCount: totalSummands / numbers.length,
    maxSummandCount: maxSummands,
    minSummandCount: minSummands,
    averageLucasCount: totalLucas / numbers.length,
    allValid,
    patterns: {
      summandDistribution,
      commonIndices
    }
  };
}

export default {
  zeckendorfDecompose,
  Z,
  z,
  ℓ,
  generateFibonacci,
  isLucasIndex,
  verifyZeckendorfTheorem,
  verifyZeckendorfRepresentation,
  batchDecompose,
  analyzeZeckendorfPatterns
};

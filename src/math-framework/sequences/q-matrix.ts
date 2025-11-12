/**
 * Q-Matrix Method for Fibonacci Computation
 *
 * The Q-matrix method uses matrix exponentiation to compute Fibonacci numbers:
 * Q = [[1, 1], [1, 0]]
 * Q^n = [[F(n+1), F(n)], [F(n), F(n-1)]]
 *
 * This method is efficient for computing large Fibonacci numbers using
 * fast matrix exponentiation (O(log n) complexity).
 */

export type Matrix2x2 = [[bigint, bigint], [bigint, bigint]];

export interface QMatrixResult {
  matrix: Matrix2x2;
  fibonacci: bigint;
  fibonacciNext: bigint;
  fibonacciPrev: bigint;
  n: number;
}

/**
 * The fundamental Q-matrix for Fibonacci computation
 */
export const Q_MATRIX: Matrix2x2 = [
  [1n, 1n],
  [1n, 0n]
];

/**
 * Multiply two 2x2 matrices
 */
export function multiplyMatrices(a: Matrix2x2, b: Matrix2x2): Matrix2x2 {
  return [
    [
      a[0][0] * b[0][0] + a[0][1] * b[1][0],
      a[0][0] * b[0][1] + a[0][1] * b[1][1]
    ],
    [
      a[1][0] * b[0][0] + a[1][1] * b[1][0],
      a[1][0] * b[0][1] + a[1][1] * b[1][1]
    ]
  ];
}

/**
 * Compute the identity matrix
 */
export function identityMatrix(): Matrix2x2 {
  return [
    [1n, 0n],
    [0n, 1n]
  ];
}

/**
 * Fast matrix exponentiation using binary exponentiation
 * Computes matrix^n in O(log n) time
 */
export function matrixPower(matrix: Matrix2x2, n: number): Matrix2x2 {
  if (n < 0) {
    throw new Error('Matrix power must be non-negative');
  }

  if (n === 0) {
    return identityMatrix();
  }

  if (n === 1) {
    return matrix;
  }

  // Binary exponentiation
  let result = identityMatrix();
  let base = matrix;
  let exponent = n;

  while (exponent > 0) {
    if (exponent % 2 === 1) {
      result = multiplyMatrices(result, base);
    }
    base = multiplyMatrices(base, base);
    exponent = Math.floor(exponent / 2);
  }

  return result;
}

/**
 * Compute Fibonacci number using Q-matrix method
 * Returns the complete matrix result for verification
 */
export function fibonacciQMatrix(n: number): QMatrixResult {
  if (!Number.isInteger(n)) {
    throw new Error('n must be an integer');
  }

  if (n < 0) {
    throw new Error('n must be non-negative');
  }

  if (n === 0) {
    return {
      matrix: identityMatrix(),
      fibonacci: 0n,
      fibonacciNext: 1n,
      fibonacciPrev: -1n,
      n: 0
    };
  }

  const qn = matrixPower(Q_MATRIX, n);

  // Q^n = [[F(n+1), F(n)], [F(n), F(n-1)]]
  return {
    matrix: qn,
    fibonacci: qn[0][1],        // F(n)
    fibonacciNext: qn[0][0],    // F(n+1)
    fibonacciPrev: qn[1][1],    // F(n-1)
    n
  };
}

/**
 * Compute multiple consecutive Fibonacci numbers efficiently
 * Returns an array of results for verification
 */
export function fibonacciQMatrixRange(start: number, end: number): QMatrixResult[] {
  if (start > end) {
    throw new Error('start must be less than or equal to end');
  }

  const results: QMatrixResult[] = [];

  // Compute Q^start once
  let currentMatrix = start === 0 ? identityMatrix() : matrixPower(Q_MATRIX, start);

  for (let i = start; i <= end; i++) {
    results.push({
      matrix: currentMatrix,
      fibonacci: i === 0 ? 0n : currentMatrix[0][1],
      fibonacciNext: i === 0 ? 1n : currentMatrix[0][0],
      fibonacciPrev: i === 0 ? -1n : currentMatrix[1][1],
      n: i
    });

    // Q^(n+1) = Q^n * Q
    if (i < end) {
      currentMatrix = multiplyMatrices(currentMatrix, Q_MATRIX);
    }
  }

  return results;
}

/**
 * Verify Q-matrix properties
 * Returns true if the matrix satisfies all Fibonacci properties
 */
export function verifyQMatrixProperties(result: QMatrixResult): boolean {
  const { matrix, fibonacci, fibonacciNext, fibonacciPrev, n } = result;

  // Verify matrix structure: Q^n = [[F(n+1), F(n)], [F(n), F(n-1)]]
  if (matrix[0][1] !== fibonacci) return false;
  if (matrix[0][0] !== fibonacciNext) return false;
  if (n > 0 && matrix[1][1] !== fibonacciPrev) return false;
  if (n > 0 && matrix[1][0] !== fibonacci) return false;

  // Verify Fibonacci recurrence: F(n+1) = F(n) + F(n-1)
  if (n > 0 && fibonacciNext !== fibonacci + fibonacciPrev) return false;

  // Verify determinant property: det(Q^n) = (-1)^n
  const determinant = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];
  const expectedDeterminant = n % 2 === 0 ? 1n : -1n;
  if (determinant !== expectedDeterminant) return false;

  return true;
}

/**
 * Get Fibonacci number using Q-matrix (simple interface)
 */
export function getFibonacci(n: number): bigint {
  return fibonacciQMatrix(n).fibonacci;
}

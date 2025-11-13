/**
 * MathematicalValidators - Validators for common mathematical sequences
 *
 * Provides specialized validators for well-known integer sequences:
 * - Fibonacci numbers
 * - Prime numbers
 * - Factorials
 * - Powers (squares, cubes, powers of 2, etc.)
 * - Triangular numbers
 * - And more...
 */

export interface MathValidationResult {
  isValid: boolean;
  confidence: number;
  formula?: string;
  matchedTerms?: number;
  error?: string;
}

/**
 * Mathematical sequence validators
 */
export class MathematicalValidators {
  /**
   * Check if sequence is Fibonacci (A000045)
   * F(n) = F(n-1) + F(n-2), F(0) = 0, F(1) = 1
   */
  isFibonacci(sequence: number[]): MathValidationResult {
    if (sequence.length < 3) {
      return { isValid: false, confidence: 0, error: 'Too short' };
    }

    // Check if it starts with 0, 1 or 1, 1
    const startsCorrectly =
      (sequence[0] === 0 && sequence[1] === 1) ||
      (sequence[0] === 1 && sequence[1] === 1);

    if (!startsCorrectly && sequence.length > 2) {
      // Check if it's a shifted Fibonacci
      const isShifted = this.checkFibonacciProperty(sequence);
      if (isShifted.matchedTerms >= sequence.length - 2) {
        return {
          isValid: true,
          confidence: isShifted.matchedTerms / (sequence.length - 2),
          formula: 'F(n) = F(n-1) + F(n-2)',
          matchedTerms: isShifted.matchedTerms,
        };
      }
      return { isValid: false, confidence: 0 };
    }

    const result = this.checkFibonacciProperty(sequence);

    return {
      isValid: result.matchedTerms === sequence.length - 2,
      confidence: result.matchedTerms / Math.max(1, sequence.length - 2),
      formula: 'F(n) = F(n-1) + F(n-2), F(0) = 0, F(1) = 1',
      matchedTerms: result.matchedTerms,
    };
  }

  private checkFibonacciProperty(sequence: number[]): { matchedTerms: number } {
    let matchedTerms = 0;
    for (let i = 2; i < sequence.length; i++) {
      if (sequence[i] === sequence[i - 1] + sequence[i - 2]) {
        matchedTerms++;
      }
    }
    return { matchedTerms };
  }

  /**
   * Check if sequence is prime numbers (A000040)
   */
  isPrime(sequence: number[]): MathValidationResult {
    let matchedTerms = 0;

    for (const num of sequence) {
      if (this.isPrimeNumber(num)) {
        matchedTerms++;
      }
    }

    const confidence = matchedTerms / sequence.length;

    return {
      isValid: confidence === 1.0,
      confidence,
      formula: 'Prime numbers: divisible only by 1 and themselves',
      matchedTerms,
    };
  }

  private isPrimeNumber(n: number): boolean {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;

    const sqrt = Math.sqrt(n);
    for (let i = 3; i <= sqrt; i += 2) {
      if (n % i === 0) return false;
    }
    return true;
  }

  /**
   * Check if sequence is factorials (A000142)
   * F(n) = n! = n × (n-1) × ... × 2 × 1
   */
  isFactorial(sequence: number[]): MathValidationResult {
    let matchedTerms = 0;
    let expectedFactorial = 1;
    let n = 0;

    for (const num of sequence) {
      if (n === 0 && num === 1) {
        matchedTerms++;
      } else {
        expectedFactorial *= n;
        if (num === expectedFactorial) {
          matchedTerms++;
        }
      }
      n++;
    }

    const confidence = matchedTerms / sequence.length;

    return {
      isValid: confidence === 1.0,
      confidence,
      formula: 'n! = n × (n-1) × ... × 2 × 1',
      matchedTerms,
    };
  }

  /**
   * Check if sequence is perfect squares (A000290)
   * S(n) = n²
   */
  isSquare(sequence: number[]): MathValidationResult {
    let matchedTerms = 0;

    for (let i = 0; i < sequence.length; i++) {
      if (sequence[i] === i * i) {
        matchedTerms++;
      }
    }

    const confidence = matchedTerms / sequence.length;

    return {
      isValid: confidence === 1.0,
      confidence,
      formula: 'n²',
      matchedTerms,
    };
  }

  /**
   * Check if sequence is perfect cubes (A000578)
   * C(n) = n³
   */
  isCube(sequence: number[]): MathValidationResult {
    let matchedTerms = 0;

    for (let i = 0; i < sequence.length; i++) {
      if (sequence[i] === i * i * i) {
        matchedTerms++;
      }
    }

    const confidence = matchedTerms / sequence.length;

    return {
      isValid: confidence === 1.0,
      confidence,
      formula: 'n³',
      matchedTerms,
    };
  }

  /**
   * Check if sequence is powers of 2 (A000079)
   * P(n) = 2^n
   */
  isPowerOf2(sequence: number[]): MathValidationResult {
    let matchedTerms = 0;

    for (let i = 0; i < sequence.length; i++) {
      if (sequence[i] === Math.pow(2, i)) {
        matchedTerms++;
      }
    }

    const confidence = matchedTerms / sequence.length;

    return {
      isValid: confidence === 1.0,
      confidence,
      formula: '2^n',
      matchedTerms,
    };
  }

  /**
   * Check if sequence is powers of 3 (A000244)
   * P(n) = 3^n
   */
  isPowerOf3(sequence: number[]): MathValidationResult {
    let matchedTerms = 0;

    for (let i = 0; i < sequence.length; i++) {
      if (sequence[i] === Math.pow(3, i)) {
        matchedTerms++;
      }
    }

    const confidence = matchedTerms / sequence.length;

    return {
      isValid: confidence === 1.0,
      confidence,
      formula: '3^n',
      matchedTerms,
    };
  }

  /**
   * Check if sequence is triangular numbers (A000217)
   * T(n) = n(n+1)/2
   */
  isTriangular(sequence: number[]): MathValidationResult {
    let matchedTerms = 0;

    for (let i = 0; i < sequence.length; i++) {
      const expected = (i * (i + 1)) / 2;
      if (sequence[i] === expected) {
        matchedTerms++;
      }
    }

    const confidence = matchedTerms / sequence.length;

    return {
      isValid: confidence === 1.0,
      confidence,
      formula: 'T(n) = n(n+1)/2',
      matchedTerms,
    };
  }

  /**
   * Check if sequence is even numbers (A005843)
   * E(n) = 2n
   */
  isEven(sequence: number[]): MathValidationResult {
    let matchedTerms = 0;

    for (let i = 0; i < sequence.length; i++) {
      if (sequence[i] === 2 * i) {
        matchedTerms++;
      }
    }

    const confidence = matchedTerms / sequence.length;

    return {
      isValid: confidence === 1.0,
      confidence,
      formula: '2n',
      matchedTerms,
    };
  }

  /**
   * Check if sequence is odd numbers (A005408)
   * O(n) = 2n + 1
   */
  isOdd(sequence: number[]): MathValidationResult {
    let matchedTerms = 0;

    for (let i = 0; i < sequence.length; i++) {
      if (sequence[i] === 2 * i + 1) {
        matchedTerms++;
      }
    }

    const confidence = matchedTerms / sequence.length;

    return {
      isValid: confidence === 1.0,
      confidence,
      formula: '2n + 1',
      matchedTerms,
    };
  }

  /**
   * Check if sequence is non-negative integers (A001477)
   * I(n) = n
   */
  isNonNegativeIntegers(sequence: number[]): MathValidationResult {
    let matchedTerms = 0;

    for (let i = 0; i < sequence.length; i++) {
      if (sequence[i] === i) {
        matchedTerms++;
      }
    }

    const confidence = matchedTerms / sequence.length;

    return {
      isValid: confidence === 1.0,
      confidence,
      formula: 'n',
      matchedTerms,
    };
  }

  /**
   * Check if sequence is perfect numbers (A000396)
   * A number is perfect if it equals the sum of its proper divisors
   */
  isPerfectNumber(n: number): boolean {
    if (n <= 1) return false;

    let sum = 1; // 1 is always a divisor
    const sqrt = Math.sqrt(n);

    for (let i = 2; i <= sqrt; i++) {
      if (n % i === 0) {
        sum += i;
        if (i !== n / i) {
          sum += n / i;
        }
      }
    }

    return sum === n;
  }

  isPerfect(sequence: number[]): MathValidationResult {
    let matchedTerms = 0;

    for (const num of sequence) {
      if (this.isPerfectNumber(num)) {
        matchedTerms++;
      }
    }

    const confidence = matchedTerms / sequence.length;

    return {
      isValid: confidence === 1.0,
      confidence,
      formula: 'n = sum of proper divisors',
      matchedTerms,
    };
  }

  /**
   * Check if sequence follows arithmetic progression
   * A(n) = a + nd
   */
  isArithmeticProgression(sequence: number[]): MathValidationResult {
    if (sequence.length < 2) {
      return { isValid: false, confidence: 0, error: 'Too short' };
    }

    const commonDiff = sequence[1] - sequence[0];
    let matchedTerms = 1; // First term always matches

    for (let i = 1; i < sequence.length; i++) {
      const expectedDiff = sequence[i] - sequence[i - 1];
      if (expectedDiff === commonDiff) {
        matchedTerms++;
      }
    }

    const confidence = matchedTerms / sequence.length;

    return {
      isValid: confidence === 1.0,
      confidence,
      formula: `a(n) = ${sequence[0]} + ${commonDiff}n`,
      matchedTerms,
    };
  }

  /**
   * Check if sequence follows geometric progression
   * G(n) = a × r^n
   */
  isGeometricProgression(sequence: number[]): MathValidationResult {
    if (sequence.length < 2) {
      return { isValid: false, confidence: 0, error: 'Too short' };
    }

    if (sequence[0] === 0) {
      return { isValid: false, confidence: 0, error: 'Cannot start with 0' };
    }

    const commonRatio = sequence[1] / sequence[0];
    let matchedTerms = 1; // First term always matches

    for (let i = 1; i < sequence.length; i++) {
      if (sequence[i - 1] === 0) {
        continue;
      }
      const expectedRatio = sequence[i] / sequence[i - 1];
      if (Math.abs(expectedRatio - commonRatio) < 0.0001) {
        matchedTerms++;
      }
    }

    const confidence = matchedTerms / sequence.length;

    return {
      isValid: confidence === 1.0,
      confidence,
      formula: `a(n) = ${sequence[0]} × ${commonRatio}^n`,
      matchedTerms,
    };
  }

  /**
   * Check if sequence is Catalan numbers (A000108)
   * C(n) = (2n)! / ((n+1)! × n!)
   */
  isCatalan(sequence: number[]): MathValidationResult {
    const catalan = [1, 1, 2, 5, 14, 42, 132, 429, 1430, 4862, 16796, 58786];
    let matchedTerms = 0;

    for (let i = 0; i < Math.min(sequence.length, catalan.length); i++) {
      if (sequence[i] === catalan[i]) {
        matchedTerms++;
      }
    }

    const confidence = matchedTerms / sequence.length;

    return {
      isValid: confidence === 1.0,
      confidence,
      formula: 'C(n) = (2n)! / ((n+1)! × n!)',
      matchedTerms,
    };
  }

  /**
   * Check if all numbers in sequence are composite (A002808)
   */
  isComposite(sequence: number[]): MathValidationResult {
    let matchedTerms = 0;

    for (const num of sequence) {
      if (num > 1 && !this.isPrimeNumber(num)) {
        matchedTerms++;
      }
    }

    const confidence = matchedTerms / sequence.length;

    return {
      isValid: confidence === 1.0,
      confidence,
      formula: 'Composite numbers: not prime',
      matchedTerms,
    };
  }
}

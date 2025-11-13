/**
 * MathematicalValidators Tests
 *
 * Comprehensive tests for all mathematical sequence validators.
 * Tests positive cases, negative cases, edge cases, and boundary conditions.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { MathematicalValidators, type MathValidationResult } from '../../src/oeis/MathematicalValidators.js';

describe('MathematicalValidators', () => {
  let validators: MathematicalValidators;

  beforeAll(() => {
    validators = new MathematicalValidators();
  });

  describe('Fibonacci Sequence', () => {
    it('should validate standard Fibonacci sequence starting with 0,1', () => {
      const sequence = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34];
      const result = validators.isFibonacci(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.formula).toContain('F(n-1) + F(n-2)');
      expect(result.matchedTerms).toBe(8);
    });

    it('should validate Fibonacci sequence starting with 1,1', () => {
      const sequence = [1, 1, 2, 3, 5, 8, 13, 21];
      const result = validators.isFibonacci(sequence);

      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should validate long Fibonacci sequence', () => {
      const sequence = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377];
      const result = validators.isFibonacci(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    it('should reject non-Fibonacci sequence', () => {
      const sequence = [1, 2, 3, 4, 5, 6, 7, 8];
      const result = validators.isFibonacci(sequence);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should reject sequence that is too short', () => {
      const sequence = [0, 1];
      const result = validators.isFibonacci(sequence);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.error).toBe('Too short');
    });

    it('should handle shifted Fibonacci sequence', () => {
      const sequence = [1, 2, 3, 5, 8, 13, 21];
      const result = validators.isFibonacci(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should reject partially correct Fibonacci', () => {
      const sequence = [0, 1, 1, 2, 3, 5, 8, 14]; // Last term is wrong
      const result = validators.isFibonacci(sequence);

      expect(result.isValid).toBe(false);
    });

    it('should handle empty sequence', () => {
      const sequence: number[] = [];
      const result = validators.isFibonacci(sequence);

      expect(result.isValid).toBe(false);
    });
  });

  describe('Prime Numbers', () => {
    it('should validate sequence of prime numbers', () => {
      const sequence = [2, 3, 5, 7, 11, 13, 17, 19, 23];
      const result = validators.isPrime(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.matchedTerms).toBe(9);
    });

    it('should reject non-prime numbers', () => {
      const sequence = [1, 4, 6, 8, 9, 10];
      const result = validators.isPrime(sequence);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should handle mixed prime and composite', () => {
      const sequence = [2, 3, 4, 5]; // 4 is not prime
      const result = validators.isPrime(sequence);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0.75);
      expect(result.matchedTerms).toBe(3);
    });

    it('should validate large primes', () => {
      const sequence = [97, 101, 103, 107, 109, 113];
      const result = validators.isPrime(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    it('should reject 1 as prime', () => {
      const sequence = [1, 2, 3, 5];
      const result = validators.isPrime(sequence);

      expect(result.isValid).toBe(false);
    });

    it('should reject negative numbers', () => {
      const sequence = [-2, -3, -5];
      const result = validators.isPrime(sequence);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should reject 0', () => {
      const sequence = [0, 2, 3, 5];
      const result = validators.isPrime(sequence);

      expect(result.isValid).toBe(false);
    });
  });

  describe('Factorial Sequence', () => {
    it('should validate factorial sequence', () => {
      const sequence = [1, 1, 2, 6, 24, 120, 720];
      const result = validators.isFactorial(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.formula).toBe('n! = n × (n-1) × ... × 2 × 1');
    });

    it('should validate longer factorial sequence', () => {
      const sequence = [1, 1, 2, 6, 24, 120, 720, 5040];
      const result = validators.isFactorial(sequence);

      expect(result.isValid).toBe(true);
    });

    it('should reject non-factorial sequence', () => {
      const sequence = [1, 2, 3, 4, 5];
      const result = validators.isFactorial(sequence);

      expect(result.isValid).toBe(false);
    });

    it('should reject partially correct factorial', () => {
      const sequence = [1, 1, 2, 6, 24, 125]; // Last term wrong
      const result = validators.isFactorial(sequence);

      expect(result.isValid).toBe(false);
    });
  });

  describe('Perfect Squares', () => {
    it('should validate square sequence', () => {
      const sequence = [0, 1, 4, 9, 16, 25, 36, 49, 64];
      const result = validators.isSquare(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.formula).toBe('n²');
    });

    it('should validate long square sequence', () => {
      const sequence = [0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 100];
      const result = validators.isSquare(sequence);

      expect(result.isValid).toBe(true);
    });

    it('should reject non-square sequence', () => {
      const sequence = [1, 2, 3, 4, 5];
      const result = validators.isSquare(sequence);

      expect(result.isValid).toBe(false);
    });

    it('should reject sequence with one wrong element', () => {
      const sequence = [0, 1, 4, 9, 16, 26]; // 26 instead of 25
      const result = validators.isSquare(sequence);

      expect(result.isValid).toBe(false);
    });
  });

  describe('Perfect Cubes', () => {
    it('should validate cube sequence', () => {
      const sequence = [0, 1, 8, 27, 64, 125];
      const result = validators.isCube(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.formula).toBe('n³');
    });

    it('should reject non-cube sequence', () => {
      const sequence = [1, 2, 3, 4, 5];
      const result = validators.isCube(sequence);

      expect(result.isValid).toBe(false);
    });

    it('should validate longer cube sequence', () => {
      const sequence = [0, 1, 8, 27, 64, 125, 216, 343];
      const result = validators.isCube(sequence);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Powers of 2', () => {
    it('should validate powers of 2', () => {
      const sequence = [1, 2, 4, 8, 16, 32, 64, 128];
      const result = validators.isPowerOf2(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.formula).toBe('2^n');
    });

    it('should reject non-powers of 2', () => {
      const sequence = [1, 2, 3, 4, 5];
      const result = validators.isPowerOf2(sequence);

      expect(result.isValid).toBe(false);
    });

    it('should validate long sequence', () => {
      const sequence = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
      const result = validators.isPowerOf2(sequence);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Powers of 3', () => {
    it('should validate powers of 3', () => {
      const sequence = [1, 3, 9, 27, 81, 243];
      const result = validators.isPowerOf3(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.formula).toBe('3^n');
    });

    it('should reject non-powers of 3', () => {
      const sequence = [1, 2, 3, 4, 5];
      const result = validators.isPowerOf3(sequence);

      expect(result.isValid).toBe(false);
    });

    it('should validate longer sequence', () => {
      const sequence = [1, 3, 9, 27, 81, 243, 729];
      const result = validators.isPowerOf3(sequence);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Triangular Numbers', () => {
    it('should validate triangular sequence', () => {
      const sequence = [0, 1, 3, 6, 10, 15, 21, 28];
      const result = validators.isTriangular(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.formula).toBe('T(n) = n(n+1)/2');
    });

    it('should reject non-triangular sequence', () => {
      const sequence = [1, 2, 3, 4, 5];
      const result = validators.isTriangular(sequence);

      expect(result.isValid).toBe(false);
    });

    it('should validate longer sequence', () => {
      const sequence = [0, 1, 3, 6, 10, 15, 21, 28, 36, 45];
      const result = validators.isTriangular(sequence);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Even Numbers', () => {
    it('should validate even sequence', () => {
      const sequence = [0, 2, 4, 6, 8, 10, 12];
      const result = validators.isEven(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.formula).toBe('2n');
    });

    it('should reject sequence with odd numbers', () => {
      const sequence = [0, 2, 4, 5, 8];
      const result = validators.isEven(sequence);

      expect(result.isValid).toBe(false);
    });

    it('should reject all odd numbers', () => {
      const sequence = [1, 3, 5, 7, 9];
      const result = validators.isEven(sequence);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
    });
  });

  describe('Odd Numbers', () => {
    it('should validate odd sequence', () => {
      const sequence = [1, 3, 5, 7, 9, 11, 13];
      const result = validators.isOdd(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.formula).toBe('2n + 1');
    });

    it('should reject sequence with even numbers', () => {
      const sequence = [1, 3, 4, 7, 9];
      const result = validators.isOdd(sequence);

      expect(result.isValid).toBe(false);
    });

    it('should reject all even numbers', () => {
      const sequence = [0, 2, 4, 6, 8];
      const result = validators.isOdd(sequence);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
    });
  });

  describe('Non-negative Integers', () => {
    it('should validate integer sequence', () => {
      const sequence = [0, 1, 2, 3, 4, 5, 6, 7];
      const result = validators.isNonNegativeIntegers(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.formula).toBe('n');
    });

    it('should reject non-sequential integers', () => {
      const sequence = [0, 1, 2, 4, 5];
      const result = validators.isNonNegativeIntegers(sequence);

      expect(result.isValid).toBe(false);
    });

    it('should reject sequence starting at wrong index', () => {
      const sequence = [1, 2, 3, 4];
      const result = validators.isNonNegativeIntegers(sequence);

      expect(result.isValid).toBe(false);
    });
  });

  describe('Perfect Numbers', () => {
    it('should validate known perfect numbers', () => {
      const sequence = [6, 28, 496];
      const result = validators.isPerfect(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.formula).toBe('n = sum of proper divisors');
    });

    it('should reject non-perfect numbers', () => {
      const sequence = [1, 2, 3, 4, 5];
      const result = validators.isPerfect(sequence);

      expect(result.isValid).toBe(false);
    });

    it('should handle mixed sequence', () => {
      const sequence = [6, 7, 28];
      const result = validators.isPerfect(sequence);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(2/3);
    });

    it('should reject zero and negative numbers', () => {
      const sequence = [0, -1, -6];
      const result = validators.isPerfect(sequence);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
    });
  });

  describe('Arithmetic Progression', () => {
    it('should detect arithmetic progression with positive difference', () => {
      const sequence = [5, 10, 15, 20, 25, 30];
      const result = validators.isArithmeticProgression(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.formula).toContain('5');
    });

    it('should detect arithmetic progression with negative difference', () => {
      const sequence = [10, 7, 4, 1, -2];
      const result = validators.isArithmeticProgression(sequence);

      expect(result.isValid).toBe(true);
      expect(result.formula).toContain('-3');
    });

    it('should detect constant sequence', () => {
      const sequence = [5, 5, 5, 5, 5];
      const result = validators.isArithmeticProgression(sequence);

      expect(result.isValid).toBe(true);
      expect(result.formula).toContain('+ 0n');
    });

    it('should reject non-arithmetic sequence', () => {
      const sequence = [1, 2, 4, 7, 11];
      const result = validators.isArithmeticProgression(sequence);

      expect(result.isValid).toBe(false);
    });

    it('should reject sequence that is too short', () => {
      const sequence = [5];
      const result = validators.isArithmeticProgression(sequence);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Too short');
    });
  });

  describe('Geometric Progression', () => {
    it('should detect geometric progression with integer ratio', () => {
      const sequence = [2, 6, 18, 54, 162];
      const result = validators.isGeometricProgression(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    it('should detect geometric progression with decimal ratio', () => {
      const sequence = [100, 50, 25, 12.5, 6.25];
      const result = validators.isGeometricProgression(sequence);

      expect(result.isValid).toBe(true);
    });

    it('should reject non-geometric sequence', () => {
      const sequence = [1, 2, 3, 4, 5];
      const result = validators.isGeometricProgression(sequence);

      expect(result.isValid).toBe(false);
    });

    it('should reject sequence starting with 0', () => {
      const sequence = [0, 2, 4, 8];
      const result = validators.isGeometricProgression(sequence);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Cannot start with 0');
    });

    it('should reject sequence that is too short', () => {
      const sequence = [5];
      const result = validators.isGeometricProgression(sequence);

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Too short');
    });

    it('should handle negative ratios', () => {
      const sequence = [2, -6, 18, -54];
      const result = validators.isGeometricProgression(sequence);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Catalan Numbers', () => {
    it('should validate Catalan sequence', () => {
      const sequence = [1, 1, 2, 5, 14, 42, 132];
      const result = validators.isCatalan(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.formula).toBe('C(n) = (2n)! / ((n+1)! × n!)');
    });

    it('should validate longer Catalan sequence', () => {
      const sequence = [1, 1, 2, 5, 14, 42, 132, 429, 1430];
      const result = validators.isCatalan(sequence);

      expect(result.isValid).toBe(true);
    });

    it('should reject non-Catalan sequence', () => {
      const sequence = [1, 2, 3, 4, 5];
      const result = validators.isCatalan(sequence);

      expect(result.isValid).toBe(false);
    });

    it('should handle partial Catalan match', () => {
      const sequence = [1, 1, 2, 5, 15]; // 15 instead of 14
      const result = validators.isCatalan(sequence);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBeLessThan(1.0);
    });
  });

  describe('Composite Numbers', () => {
    it('should validate composite sequence', () => {
      const sequence = [4, 6, 8, 9, 10, 12];
      const result = validators.isComposite(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.formula).toBe('Composite numbers: not prime');
    });

    it('should reject sequence with primes', () => {
      const sequence = [4, 5, 6, 8];
      const result = validators.isComposite(sequence);

      expect(result.isValid).toBe(false);
    });

    it('should reject all primes', () => {
      const sequence = [2, 3, 5, 7, 11];
      const result = validators.isComposite(sequence);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should reject 1', () => {
      const sequence = [1, 4, 6, 8];
      const result = validators.isComposite(sequence);

      expect(result.isValid).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single-element sequences appropriately', () => {
      expect(validators.isFibonacci([1])).toHaveProperty('isValid', false);
      expect(validators.isPrime([2])).toHaveProperty('isValid', true);
      expect(validators.isSquare([0])).toHaveProperty('isValid', true);
      expect(validators.isPowerOf2([1])).toHaveProperty('isValid', true);
    });

    it('should handle very large numbers', () => {
      const largeSequence = [1000000, 1000001, 1000002, 1000003];
      const result = validators.isNonNegativeIntegers(largeSequence);

      expect(result.isValid).toBe(false);
    });

    it('should handle sequences with negative numbers', () => {
      const sequence = [-5, -3, -1, 1, 3];
      const result = validators.isArithmeticProgression(sequence);

      expect(result.isValid).toBe(true);
    });

    it('should handle sequences with decimals in arithmetic progression', () => {
      const sequence = [1.5, 3.0, 4.5, 6.0];
      const result = validators.isArithmeticProgression(sequence);

      expect(result.isValid).toBe(true);
    });

    it('should handle very long sequences efficiently', () => {
      const longSequence = Array.from({ length: 1000 }, (_, i) => i);
      const start = Date.now();
      const result = validators.isNonNegativeIntegers(longSequence);
      const duration = Date.now() - start;

      expect(result.isValid).toBe(true);
      expect(duration).toBeLessThan(100); // Should be fast
    });
  });
});

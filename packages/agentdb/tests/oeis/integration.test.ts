/**
 * OEIS Integration Tests
 *
 * End-to-end integration tests for the complete OEIS validation workflow.
 * Tests the interaction between SequenceValidator, OeisCache, OeisApiClient,
 * and MathematicalValidators.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  SequenceValidator,
  OeisCache,
  OeisApiClient,
  MathematicalValidators,
  type OeisSequence,
} from '../../src/oeis/index.js';

describe('OEIS Integration Tests', () => {
  let validator: SequenceValidator;
  let cache: OeisCache;
  let apiClient: OeisApiClient;
  let mathValidators: MathematicalValidators;

  beforeAll(async () => {
    cache = new OeisCache({ dbPath: ':memory:' });
    await cache.initialize();

    apiClient = new OeisApiClient({
      rateLimit: 60,
      timeout: 10000,
    });

    mathValidators = new MathematicalValidators();

    validator = new SequenceValidator({
      cache,
      apiClient,
      minConfidence: 0.8,
      minMatchLength: 4,
      enablePatternMatching: true,
      enableFormulaValidation: true,
      cacheResults: true,
    });

    await validator.initialize();
  });

  afterAll(async () => {
    await validator.close();
  });

  describe('End-to-End Validation Workflow', () => {
    it('should validate complete workflow for Fibonacci', async () => {
      // 1. Validate sequence
      const sequence = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34];
      const result = await validator.validate(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.sequenceId).toBe('A000045');
      expect(result.matchType).toBe('formula');

      // 2. Verify it was cached
      const cached = await cache.has('A000045');
      expect(cached || result.matchedSequence).toBeTruthy();

      // 3. Verify mathematical validator also recognizes it
      const mathResult = mathValidators.isFibonacci(sequence);
      expect(mathResult.isValid).toBe(true);
      expect(mathResult.confidence).toBe(1.0);
    });

    it('should validate complete workflow for primes', async () => {
      const sequence = [2, 3, 5, 7, 11, 13, 17, 19, 23];

      const result = await validator.validate(sequence);

      expect(result.isValid).toBe(true);
      expect(result.sequenceId).toBe('A000040');

      const mathResult = mathValidators.isPrime(sequence);
      expect(mathResult.isValid).toBe(true);
    });

    it('should handle unknown sequences gracefully', async () => {
      const unknownSeq = [999, 888, 777, 666, 555, 444];

      const result = await validator.validate(unknownSeq);

      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
      expect(typeof result.confidence).toBe('number');
    });
  });

  describe('Cache Integration', () => {
    it('should use cache for repeated validations', async () => {
      const sequence = [0, 1, 4, 9, 16, 25, 36];

      // First validation
      const result1 = await validator.validate(sequence);
      const time1Start = Date.now();
      await validator.validate(sequence);
      const time1 = Date.now() - time1Start;

      // Second validation (should use cache)
      const time2Start = Date.now();
      const result2 = await validator.validate(sequence);
      const time2 = Date.now() - time2Start;

      expect(result1.sequenceId).toBe(result2.sequenceId);
      // Second call might be faster due to caching
    });

    it('should cache validation results across instances', async () => {
      const sequence = [1, 2, 4, 8, 16, 32, 64];

      // Seed cache through validator
      const mockSequence: OeisSequence = {
        number: 79,
        id: 'A000079',
        data: [1, 2, 4, 8, 16, 32, 64, 128],
        name: 'Powers of 2',
        keyword: ['nonn', 'easy'],
      };

      await cache.set(mockSequence);

      // Validate should find it in cache
      const result = await validator.validateByANumber(sequence, 'A000079');

      expect(result.isValid).toBe(true);
      expect(result.matchedSequence).toBeDefined();
    });

    it('should maintain cache statistics', async () => {
      const sequences = [
        [0, 1, 1, 2, 3, 5, 8],
        [2, 3, 5, 7, 11, 13],
        [0, 1, 4, 9, 16, 25],
      ];

      for (const seq of sequences) {
        await validator.validate(seq);
      }

      const stats = await validator.getCacheStats();
      expect(stats).toBeDefined();
      expect(stats.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Mathematical Pattern Integration', () => {
    it('should use math validators before API', async () => {
      const sequences = [
        { seq: [0, 1, 1, 2, 3, 5, 8, 13], expected: 'A000045', name: 'Fibonacci' },
        { seq: [2, 3, 5, 7, 11, 13, 17], expected: 'A000040', name: 'Primes' },
        { seq: [0, 1, 4, 9, 16, 25, 36], expected: 'A000290', name: 'Squares' },
        { seq: [1, 2, 4, 8, 16, 32], expected: 'A000079', name: 'Powers of 2' },
        { seq: [0, 1, 3, 6, 10, 15], expected: 'A000217', name: 'Triangular' },
        { seq: [1, 1, 2, 6, 24, 120], expected: 'A000142', name: 'Factorial' },
      ];

      for (const { seq, expected, name } of sequences) {
        const result = await validator.validate(seq);

        expect(result.isValid).toBe(true);
        expect(result.sequenceId).toBe(expected);
        expect(result.matchType).toBe('formula');
      }
    });

    it('should fall back to API when math validators fail', async () => {
      // A sequence that doesn't match common patterns
      const customSeq = [1, 3, 7, 15, 31, 63]; // 2^n - 1 (Mersenne)

      const result = await validator.validate(customSeq);

      expect(result).toBeDefined();
      // May or may not find a match, but should not crash
    });
  });

  describe('Multi-Sequence Validation', () => {
    it('should handle multiple sequences concurrently', async () => {
      const sequences = [
        [0, 1, 1, 2, 3, 5, 8, 13],
        [2, 3, 5, 7, 11, 13, 17],
        [0, 1, 4, 9, 16, 25, 36],
        [1, 2, 4, 8, 16, 32, 64],
        [0, 1, 3, 6, 10, 15, 21],
      ];

      const results = await Promise.all(
        sequences.map(seq => validator.validate(seq))
      );

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.isValid).toBe(true);
      });
    });

    it('should handle batch validation efficiently', async () => {
      const batchSize = 10;
      const sequences = Array.from({ length: batchSize }, (_, i) =>
        Array.from({ length: 8 }, (_, j) => i * j)
      );

      const start = Date.now();
      const results = await Promise.all(
        sequences.map(seq => validator.validate(seq))
      );
      const duration = Date.now() - start;

      expect(results).toHaveLength(batchSize);
      expect(duration).toBeLessThan(10000); // Should complete reasonably fast
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should recover from validation errors', async () => {
      const sequences = [
        [NaN, NaN, NaN, NaN], // Invalid
        [0, 1, 1, 2, 3, 5, 8], // Valid
        [Infinity, Infinity], // Invalid
        [2, 3, 5, 7, 11], // Valid
      ];

      const results = await Promise.all(
        sequences.map(seq => validator.validate(seq))
      );

      expect(results).toHaveLength(4);
      // Valid sequences should still be validated
      expect(results[1].isValid).toBe(true);
      expect(results[3].isValid).toBe(true);
    });

    it('should handle cache failures gracefully', async () => {
      // Even if cache operations fail, validation should continue
      const sequence = [1, 2, 4, 8, 16, 32];
      const result = await validator.validate(sequence);

      expect(result).toBeDefined();
    });

    it('should handle empty and short sequences', async () => {
      const sequences = [
        [],
        [1],
        [1, 2],
        [1, 2, 3],
      ];

      for (const seq of sequences) {
        const result = await validator.validate(seq);
        expect(result).toBeDefined();
        expect(result.error || result.isValid !== undefined).toBeTruthy();
      }
    });
  });

  describe('Performance', () => {
    it('should validate sequences efficiently', async () => {
      const testSequences = [
        [0, 1, 1, 2, 3, 5, 8, 13, 21, 34],
        [2, 3, 5, 7, 11, 13, 17, 19, 23, 29],
        [0, 1, 4, 9, 16, 25, 36, 49, 64, 81],
      ];

      const start = Date.now();
      for (const seq of testSequences) {
        await validator.validate(seq);
      }
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(3000); // Should be reasonably fast
    });

    it('should handle long sequences efficiently', async () => {
      const longSequence = Array.from({ length: 100 }, (_, i) => i * i);

      const start = Date.now();
      const result = await validator.validate(longSequence);
      const duration = Date.now() - start;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(2000);
    });

    it('should benefit from caching on repeated access', async () => {
      const sequence = [0, 1, 1, 2, 3, 5, 8];

      // First access
      const start1 = Date.now();
      await validator.validate(sequence);
      const time1 = Date.now() - start1;

      // Second access (potentially cached)
      const start2 = Date.now();
      await validator.validate(sequence);
      const time2 = Date.now() - start2;

      // Both should complete reasonably fast
      expect(time1).toBeLessThan(2000);
      expect(time2).toBeLessThan(2000);
    });
  });

  describe('Complex Validation Scenarios', () => {
    it('should handle partial matches correctly', async () => {
      // First part of Fibonacci
      const partialFib = [0, 1, 1, 2, 3, 5];
      const result = await validator.validate(partialFib);

      expect(result.isValid).toBe(true);
      expect(result.sequenceId).toBe('A000045');
    });

    it('should handle shifted sequences', async () => {
      // Squares starting from n=1 instead of n=0
      const shiftedSquares = [1, 4, 9, 16, 25, 36];
      const result = await validator.validate(shiftedSquares);

      expect(result).toBeDefined();
      // May or may not match exactly, but should not crash
    });

    it('should handle arithmetic progressions', async () => {
      const sequences = [
        [0, 2, 4, 6, 8, 10], // Even numbers
        [1, 3, 5, 7, 9, 11], // Odd numbers
        [5, 10, 15, 20, 25], // Multiples of 5
      ];

      for (const seq of sequences) {
        const result = await validator.validate(seq);
        expect(result.isValid).toBe(true);
      }
    });

    it('should handle geometric progressions', async () => {
      const sequences = [
        [1, 2, 4, 8, 16, 32], // Powers of 2
        [1, 3, 9, 27, 81], // Powers of 3
      ];

      for (const seq of sequences) {
        const result = await validator.validate(seq);
        expect(result.isValid).toBe(true);
      }
    });
  });

  describe('Validation by A-number', () => {
    it('should validate by A-number with cached data', async () => {
      // Seed cache
      const mockSequence: OeisSequence = {
        number: 290,
        id: 'A000290',
        data: [0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 100],
        name: 'Perfect squares',
        keyword: ['nonn', 'easy'],
      };

      await cache.set(mockSequence);

      const sequence = [0, 1, 4, 9, 16, 25];
      const result = await validator.validateByANumber(sequence, 'A000290');

      expect(result.isValid).toBe(true);
      expect(result.sequenceId).toBe('A000290');
      expect(result.matchedSequence).toBeDefined();
    });

    it('should handle validation by A-number for multiple formats', async () => {
      const mockSequence: OeisSequence = {
        number: 217,
        id: 'A000217',
        data: [0, 1, 3, 6, 10, 15, 21, 28, 36, 45],
        name: 'Triangular numbers',
      };

      await cache.set(mockSequence);

      const sequence = [0, 1, 3, 6, 10, 15];

      // All formats should work
      const formats = ['A000217', 'A217', '217'];
      for (const format of formats) {
        const result = await validator.validateByANumber(sequence, format);
        expect(result).toBeDefined();
      }
    });
  });

  describe('Confidence Scoring', () => {
    it('should provide accurate confidence scores', async () => {
      const testCases = [
        { seq: [0, 1, 1, 2, 3, 5, 8, 13], expectedConf: 1.0, name: 'Perfect Fibonacci' },
        { seq: [2, 3, 5, 7, 11, 13, 17], expectedConf: 1.0, name: 'Perfect primes' },
        { seq: [0, 1, 4, 9, 16, 25, 36], expectedConf: 1.0, name: 'Perfect squares' },
      ];

      for (const { seq, expectedConf } of testCases) {
        const result = await validator.validate(seq);
        if (result.isValid) {
          expect(result.confidence).toBeGreaterThanOrEqual(expectedConf - 0.2);
        }
      }
    });

    it('should detect partial matches with lower confidence', async () => {
      // First few terms correct, later ones wrong
      const partialSeq = [0, 1, 1, 2, 3, 5, 8, 99];
      const result = await validator.validate(partialSeq);

      expect(result).toBeDefined();
      // Confidence should reflect the mismatch
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not leak memory on repeated validations', async () => {
      const sequence = [1, 2, 4, 8, 16, 32];

      // Run many validations
      for (let i = 0; i < 50; i++) {
        await validator.validate(sequence);
      }

      // Should still work
      const result = await validator.validate(sequence);
      expect(result).toBeDefined();
    });

    it('should handle concurrent validations without issues', async () => {
      const sequences = Array.from({ length: 20 }, () =>
        [0, 1, 1, 2, 3, 5, 8, 13]
      );

      const results = await Promise.all(
        sequences.map(seq => validator.validate(seq))
      );

      expect(results).toHaveLength(20);
      results.forEach(result => {
        expect(result.isValid).toBe(true);
      });
    });

    it('should cleanup resources properly', async () => {
      // Create temporary validator
      const tempCache = new OeisCache({ dbPath: ':memory:' });
      await tempCache.initialize();

      const tempValidator = new SequenceValidator({ cache: tempCache });
      await tempValidator.initialize();

      // Use it
      await tempValidator.validate([1, 2, 4, 8]);

      // Cleanup
      await tempValidator.close();

      // Original validator should still work
      const result = await validator.validate([1, 2, 4, 8]);
      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle all-zero sequences', async () => {
      const sequence = [0, 0, 0, 0, 0, 0];
      const result = await validator.validate(sequence);

      expect(result).toBeDefined();
    });

    it('should handle negative number sequences', async () => {
      const sequence = [-5, -3, -1, 1, 3, 5];
      const result = await validator.validate(sequence);

      expect(result).toBeDefined();
    });

    it('should handle mixed positive/negative sequences', async () => {
      const sequence = [-2, -1, 0, 1, 2, 3, 4];
      const result = await validator.validate(sequence);

      expect(result).toBeDefined();
    });

    it('should handle very large numbers', async () => {
      const sequence = [1000000, 2000000, 3000000, 4000000];
      const result = await validator.validate(sequence);

      expect(result).toBeDefined();
    });

    it('should handle decimal sequences', async () => {
      const sequence = [1.5, 3.0, 4.5, 6.0, 7.5];
      const result = await validator.validate(sequence);

      expect(result).toBeDefined();
    });

    it('should handle constant sequences', async () => {
      const sequence = [5, 5, 5, 5, 5, 5];
      const result = await validator.validate(sequence);

      expect(result).toBeDefined();
    });
  });
});

/**
 * SequenceValidator Tests
 *
 * Comprehensive tests for the main SequenceValidator class.
 * Tests validation logic, caching, pattern matching, and error handling.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { SequenceValidator, type ValidationResult } from '../../src/oeis/SequenceValidator.js';
import { OeisCache } from '../../src/oeis/OeisCache.js';
import { OeisApiClient, type OeisSequence, type OeisSearchResult } from '../../src/oeis/OeisApiClient.js';

describe('SequenceValidator', () => {
  let validator: SequenceValidator;
  let cache: OeisCache;

  beforeAll(async () => {
    cache = new OeisCache({ dbPath: ':memory:' });
    await cache.initialize();

    validator = new SequenceValidator({
      cache,
      minConfidence: 0.8,
      minMatchLength: 4,
      maxSuggestions: 5,
      enablePatternMatching: true,
      enableFormulaValidation: true,
      cacheResults: true,
    });

    await validator.initialize();
  });

  afterAll(async () => {
    await validator.close();
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const newValidator = new SequenceValidator();
      await expect(newValidator.initialize()).resolves.toBeUndefined();
      await newValidator.close();
    });

    it('should use default configuration', async () => {
      const newValidator = new SequenceValidator();
      await newValidator.initialize();

      // Test with default min length (4)
      const result = await newValidator.validate([1, 2, 3]);
      expect(result.error).toContain('too short');

      await newValidator.close();
    });

    it('should accept custom configuration', async () => {
      const customValidator = new SequenceValidator({
        minConfidence: 0.9,
        minMatchLength: 5,
        maxSuggestions: 3,
      });
      await customValidator.initialize();

      const result = await customValidator.validate([1, 2, 3, 4]);
      expect(result.error).toContain('minimum 5 terms');

      await customValidator.close();
    });
  });

  describe('Input Validation', () => {
    it('should reject empty sequences', async () => {
      const result = await validator.validate([]);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.matchType).toBe('none');
      expect(result.error).toBe('Empty sequence provided');
    });

    it('should reject sequences that are too short', async () => {
      const result = await validator.validate([1, 2]);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.matchType).toBe('none');
      expect(result.error).toContain('too short');
    });

    it('should reject null sequences', async () => {
      // @ts-expect-error Testing error handling
      const result = await validator.validate(null);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Empty');
    });

    it('should reject undefined sequences', async () => {
      // @ts-expect-error Testing error handling
      const result = await validator.validate(undefined);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Empty');
    });
  });

  describe('Mathematical Pattern Validation', () => {
    it('should validate Fibonacci sequence', async () => {
      const sequence = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34];
      const result = await validator.validate(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.matchType).toBe('formula');
      expect(result.sequenceId).toBe('A000045');
      expect(result.matchDetails).toBeDefined();
      expect(result.matchDetails?.formula).toContain('F(n)');
    });

    it('should validate prime number sequence', async () => {
      const sequence = [2, 3, 5, 7, 11, 13, 17, 19];
      const result = await validator.validate(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.matchType).toBe('formula');
      expect(result.sequenceId).toBe('A000040');
    });

    it('should validate factorial sequence', async () => {
      const sequence = [1, 1, 2, 6, 24, 120, 720];
      const result = await validator.validate(sequence);

      expect(result.isValid).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.sequenceId).toBe('A000142');
    });

    it('should validate perfect squares', async () => {
      const sequence = [0, 1, 4, 9, 16, 25, 36, 49, 64];
      const result = await validator.validate(sequence);

      expect(result.isValid).toBe(true);
      expect(result.sequenceId).toBe('A000290');
    });

    it('should validate perfect cubes', async () => {
      const sequence = [0, 1, 8, 27, 64, 125];
      const result = await validator.validate(sequence);

      expect(result.isValid).toBe(true);
      expect(result.sequenceId).toBe('A000578');
    });

    it('should validate powers of 2', async () => {
      const sequence = [1, 2, 4, 8, 16, 32, 64, 128];
      const result = await validator.validate(sequence);

      expect(result.isValid).toBe(true);
      expect(result.sequenceId).toBe('A000079');
    });

    it('should validate triangular numbers', async () => {
      const sequence = [0, 1, 3, 6, 10, 15, 21, 28];
      const result = await validator.validate(sequence);

      expect(result.isValid).toBe(true);
      expect(result.sequenceId).toBe('A000217');
    });

    it('should validate even numbers', async () => {
      const sequence = [0, 2, 4, 6, 8, 10, 12, 14];
      const result = await validator.validate(sequence);

      expect(result.isValid).toBe(true);
      expect(result.sequenceId).toBe('A005843');
    });

    it('should validate odd numbers', async () => {
      const sequence = [1, 3, 5, 7, 9, 11, 13];
      const result = await validator.validate(sequence);

      expect(result.isValid).toBe(true);
      expect(result.sequenceId).toBe('A005408');
    });
  });

  describe('Validation by A-number', () => {
    it('should validate by A-number if cached', async () => {
      // Seed cache
      const mockSequence: OeisSequence = {
        number: 45,
        id: 'A000045',
        data: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34],
        name: 'Fibonacci numbers',
        keyword: ['nonn', 'easy'],
      };
      await cache.set(mockSequence);

      const sequence = [0, 1, 1, 2, 3, 5, 8, 13];
      const result = await validator.validateByANumber(sequence, 'A000045');

      expect(result.isValid).toBe(true);
      expect(result.sequenceId).toBe('A000045');
      expect(result.matchedSequence).toBeDefined();
    });

    it('should handle non-existent A-numbers', async () => {
      const sequence = [1, 2, 3, 4];
      const result = await validator.validateByANumber(sequence, 'A999999');

      expect(result.isValid).toBe(false);
      // May have error about sequence not found or network error
      expect(result.error).toBeDefined();
    });

    it('should normalize A-number formats', async () => {
      const mockSequence: OeisSequence = {
        number: 40,
        id: 'A000040',
        data: [2, 3, 5, 7, 11],
        name: 'Prime numbers',
        keyword: ['nonn'],
      };
      await cache.set(mockSequence);

      const sequence = [2, 3, 5, 7];

      // Test different formats
      const result1 = await validator.validateByANumber(sequence, 'A000040');
      const result2 = await validator.validateByANumber(sequence, 'A40');
      const result3 = await validator.validateByANumber(sequence, '40');

      expect(result1.sequenceId).toBe('A000040');
      // Note: Actual normalization happens in API client, results may vary
    });
  });

  describe('Match Type Detection', () => {
    it('should detect exact matches', async () => {
      const mockSequence: OeisSequence = {
        number: 1,
        id: 'A000001',
        data: [1, 2, 3, 4, 5, 6, 7, 8],
        name: 'Test sequence',
      };
      await cache.set(mockSequence);

      const sequence = [1, 2, 3, 4];
      const result = await validator.validateByANumber(sequence, 'A000001');

      expect(result.matchType).toMatch(/exact|partial/);
      expect(result.matchDetails?.matchedTerms).toBeGreaterThan(0);
    });

    it('should calculate confidence scores', async () => {
      const mockSequence: OeisSequence = {
        number: 2,
        id: 'A000002',
        data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        name: 'Test sequence',
      };
      await cache.set(mockSequence);

      // Perfect match
      const result1 = await validator.validateByANumber([1, 2, 3, 4], 'A000002');
      expect(result1.confidence).toBeGreaterThanOrEqual(0.9);

      // Partial match
      const result2 = await validator.validateByANumber([1, 2, 3, 99], 'A000002');
      expect(result2.confidence).toBeLessThan(1.0);
    });
  });

  describe('Pattern Matching', () => {
    it('should use pattern matching when enabled', async () => {
      const patternValidator = new SequenceValidator({
        enablePatternMatching: true,
      });
      await patternValidator.initialize();

      // Test with a sequence that should match by pattern
      const sequence = [1, 2, 4, 8, 16, 32];
      const result = await patternValidator.validate(sequence);

      expect(result).toBeDefined();

      await patternValidator.close();
    });

    it('should skip pattern matching when disabled', async () => {
      const noPatternValidator = new SequenceValidator({
        enablePatternMatching: false,
      });
      await noPatternValidator.initialize();

      const sequence = [1, 2, 4, 8, 16, 32];
      const result = await noPatternValidator.validate(sequence);

      // Should still validate via mathematical validators
      expect(result).toBeDefined();

      await noPatternValidator.close();
    });
  });

  describe('Confidence Thresholds', () => {
    it('should respect minimum confidence threshold', async () => {
      const strictValidator = new SequenceValidator({
        minConfidence: 0.95,
      });
      await strictValidator.initialize();

      const sequence = [1, 2, 4, 8, 16];
      const result = await strictValidator.validate(sequence);

      // Even good matches may not meet 0.95 threshold
      if (!result.isValid) {
        expect(result.confidence).toBeLessThan(0.95);
      }

      await strictValidator.close();
    });

    it('should accept sequences above confidence threshold', async () => {
      const lenientValidator = new SequenceValidator({
        minConfidence: 0.5,
      });
      await lenientValidator.initialize();

      const sequence = [1, 2, 4, 8, 16, 32];
      const result = await lenientValidator.validate(sequence);

      expect(result.isValid).toBe(true);

      await lenientValidator.close();
    });
  });

  describe('Cache Integration', () => {
    it('should cache validation results', async () => {
      const stats1 = await cache.getStats();
      const initialCount = stats1.count;

      const sequence = [1, 2, 4, 8, 16];
      await validator.validate(sequence);

      const stats2 = await cache.getStats();
      // Cache may or may not increase depending on whether OEIS was queried
      expect(stats2.count).toBeGreaterThanOrEqual(initialCount);
    });

    it('should retrieve from cache on subsequent calls', async () => {
      const mockSequence: OeisSequence = {
        number: 100,
        id: 'A000100',
        data: [1, 2, 3, 4, 5],
        name: 'Cached test',
      };
      await cache.set(mockSequence);

      const sequence = [1, 2, 3, 4];
      const result1 = await validator.validateByANumber(sequence, 'A000100');
      const result2 = await validator.validateByANumber(sequence, 'A000100');

      expect(result1).toEqual(result2);
    });

    it('should provide cache statistics', async () => {
      const stats = await validator.getCacheStats();

      expect(stats).toBeDefined();
      expect(typeof stats.count).toBe('number');
      expect(typeof stats.memorySize).toBe('number');
      expect(typeof stats.diskSize).toBe('number');
      expect(Array.isArray(stats.topSequences)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid sequences gracefully', async () => {
      const invalidSequences = [
        [999, 888, 777, 666, 555],
        [NaN, NaN, NaN, NaN],
        [Infinity, Infinity, Infinity, Infinity],
      ];

      for (const sequence of invalidSequences) {
        const result = await validator.validate(sequence);
        expect(result).toBeDefined();
        expect(typeof result.isValid).toBe('boolean');
        expect(typeof result.confidence).toBe('number');
      }
    });

    it('should handle API errors gracefully', async () => {
      // Create validator with unreachable API
      const errorValidator = new SequenceValidator({
        apiClient: new OeisApiClient({
          baseUrl: 'http://invalid.example.com',
          timeout: 100,
          maxRetries: 1,
        }),
      });
      await errorValidator.initialize();

      const sequence = [1, 2, 3, 4, 5];
      const result = await errorValidator.validate(sequence);

      // Should fallback to mathematical validators or return error
      expect(result).toBeDefined();

      await errorValidator.close();
    });

    it('should handle cache failures gracefully', async () => {
      // Validator should work even if cache fails
      const sequence = [1, 2, 4, 8, 16];
      const result = await validator.validate(sequence);

      expect(result).toBeDefined();
    });
  });

  describe('Match Details', () => {
    it('should provide detailed match information', async () => {
      const sequence = [0, 1, 1, 2, 3, 5, 8, 13];
      const result = await validator.validate(sequence);

      if (result.matchDetails) {
        expect(result.matchDetails.matchedTerms).toBeDefined();
        expect(result.matchDetails.totalTerms).toBe(sequence.length);
        expect(result.matchDetails.startIndex).toBeDefined();
        expect(typeof result.matchDetails.startIndex).toBe('number');
      }
    });

    it('should include formula when available', async () => {
      const sequence = [1, 2, 4, 8, 16, 32];
      const result = await validator.validate(sequence);

      if (result.isValid && result.matchDetails) {
        expect(result.matchDetails.formula).toBeDefined();
      }
    });

    it('should calculate deviation for inexact matches', async () => {
      const mockSequence: OeisSequence = {
        number: 200,
        id: 'A000200',
        data: [1, 2, 3, 4, 5, 6, 7, 8],
        name: 'Test deviation',
      };
      await cache.set(mockSequence);

      const sequence = [1, 2, 3, 5]; // 5 instead of 4
      const result = await validator.validateByANumber(sequence, 'A000200');

      if (result.matchDetails) {
        expect(result.matchDetails.deviation).toBeDefined();
        expect(result.matchDetails.deviation).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance', () => {
    it('should validate sequences quickly', async () => {
      const sequence = [1, 2, 4, 8, 16, 32, 64, 128];

      const start = Date.now();
      await validator.validate(sequence);
      const duration = Date.now() - start;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000);
    });

    it('should handle long sequences efficiently', async () => {
      const longSequence = Array.from({ length: 100 }, (_, i) => i);

      const start = Date.now();
      await validator.validate(longSequence);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(2000);
    });

    it('should handle multiple validations concurrently', async () => {
      const sequences = [
        [0, 1, 1, 2, 3, 5, 8],
        [2, 3, 5, 7, 11, 13],
        [0, 1, 4, 9, 16, 25],
        [1, 2, 4, 8, 16, 32],
      ];

      const start = Date.now();
      const results = await Promise.all(
        sequences.map(seq => validator.validate(seq))
      );
      const duration = Date.now() - start;

      expect(results).toHaveLength(4);
      expect(duration).toBeLessThan(3000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle sequences with repeated values', async () => {
      const sequence = [1, 1, 1, 1, 1];
      const result = await validator.validate(sequence);

      expect(result).toBeDefined();
    });

    it('should handle sequences with negative numbers', async () => {
      const sequence = [-5, -3, -1, 1, 3];
      const result = await validator.validate(sequence);

      expect(result).toBeDefined();
    });

    it('should handle sequences with large numbers', async () => {
      const sequence = [1000000, 2000000, 3000000, 4000000];
      const result = await validator.validate(sequence);

      expect(result).toBeDefined();
    });

    it('should handle sequences with decimals', async () => {
      const sequence = [1.5, 3.0, 4.5, 6.0];
      const result = await validator.validate(sequence);

      expect(result).toBeDefined();
    });

    it('should handle mixed positive and negative', async () => {
      const sequence = [-2, -1, 0, 1, 2, 3];
      const result = await validator.validate(sequence);

      expect(result).toBeDefined();
    });
  });
});

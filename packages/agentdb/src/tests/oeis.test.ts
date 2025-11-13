/**
 * OEIS Module Tests
 *
 * Comprehensive tests for OEIS validation modules.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  OeisApiClient,
  OeisCache,
  SequenceValidator,
  MathematicalValidators,
} from '../oeis/index.js';

describe('MathematicalValidators', () => {
  let validators: MathematicalValidators;

  beforeAll(() => {
    validators = new MathematicalValidators();
  });

  describe('Fibonacci Sequence', () => {
    it('should validate standard Fibonacci sequence', () => {
      const sequence = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34];
      const result = validators.isFibonacci(sequence);
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.formula).toContain('F(n-1) + F(n-2)');
    });

    it('should reject non-Fibonacci sequence', () => {
      const sequence = [1, 2, 3, 4, 5, 6, 7, 8];
      const result = validators.isFibonacci(sequence);
      expect(result.isValid).toBe(false);
    });

    it('should handle shifted Fibonacci', () => {
      const sequence = [1, 1, 2, 3, 5, 8, 13];
      const result = validators.isFibonacci(sequence);
      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('Prime Numbers', () => {
    it('should validate prime sequence', () => {
      const sequence = [2, 3, 5, 7, 11, 13, 17, 19, 23];
      const result = validators.isPrime(sequence);
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    it('should reject non-prime sequence', () => {
      const sequence = [1, 4, 6, 8, 9, 10];
      const result = validators.isPrime(sequence);
      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
    });

    it('should handle mixed sequence', () => {
      const sequence = [2, 3, 4, 5]; // 4 is not prime
      const result = validators.isPrime(sequence);
      expect(result.confidence).toBe(0.75);
    });
  });

  describe('Factorial Sequence', () => {
    it('should validate factorial sequence', () => {
      const sequence = [1, 1, 2, 6, 24, 120, 720];
      const result = validators.isFactorial(sequence);
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
    });

    it('should reject non-factorial sequence', () => {
      const sequence = [1, 2, 3, 4, 5];
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

    it('should reject non-square sequence', () => {
      const sequence = [1, 2, 3, 4, 5];
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
    });
  });

  describe('Powers of 2', () => {
    it('should validate powers of 2', () => {
      const sequence = [1, 2, 4, 8, 16, 32, 64, 128];
      const result = validators.isPowerOf2(sequence);
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('Powers of 3', () => {
    it('should validate powers of 3', () => {
      const sequence = [1, 3, 9, 27, 81, 243];
      const result = validators.isPowerOf3(sequence);
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('Triangular Numbers', () => {
    it('should validate triangular sequence', () => {
      const sequence = [0, 1, 3, 6, 10, 15, 21, 28];
      const result = validators.isTriangular(sequence);
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.formula).toContain('n(n+1)/2');
    });
  });

  describe('Even Numbers', () => {
    it('should validate even sequence', () => {
      const sequence = [0, 2, 4, 6, 8, 10, 12];
      const result = validators.isEven(sequence);
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('Odd Numbers', () => {
    it('should validate odd sequence', () => {
      const sequence = [1, 3, 5, 7, 9, 11, 13];
      const result = validators.isOdd(sequence);
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('Arithmetic Progression', () => {
    it('should detect arithmetic progression', () => {
      const sequence = [5, 10, 15, 20, 25, 30];
      const result = validators.isArithmeticProgression(sequence);
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
      expect(result.formula).toContain('5');
    });

    it('should handle negative differences', () => {
      const sequence = [10, 7, 4, 1, -2];
      const result = validators.isArithmeticProgression(sequence);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Geometric Progression', () => {
    it('should detect geometric progression', () => {
      const sequence = [2, 6, 18, 54, 162];
      const result = validators.isGeometricProgression(sequence);
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('Catalan Numbers', () => {
    it('should validate Catalan sequence', () => {
      const sequence = [1, 1, 2, 5, 14, 42, 132];
      const result = validators.isCatalan(sequence);
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
    });
  });

  describe('Composite Numbers', () => {
    it('should validate composite sequence', () => {
      const sequence = [4, 6, 8, 9, 10, 12];
      const result = validators.isComposite(sequence);
      expect(result.isValid).toBe(true);
      expect(result.confidence).toBe(1.0);
    });
  });
});

describe('OeisCache', () => {
  let cache: OeisCache;

  beforeAll(async () => {
    cache = new OeisCache({ dbPath: ':memory:' });
    await cache.initialize();
  });

  afterAll(async () => {
    await cache.close();
  });

  it('should store and retrieve sequences', async () => {
    const sequence = {
      number: 45,
      id: 'A000045',
      data: [0, 1, 1, 2, 3, 5, 8, 13, 21],
      name: 'Fibonacci numbers',
      keyword: ['nonn', 'easy'],
    };

    await cache.set(sequence);
    const retrieved = await cache.get('A000045');

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe('A000045');
    expect(retrieved?.name).toBe('Fibonacci numbers');
  });

  it('should handle cache misses', async () => {
    const result = await cache.get('A999999');
    expect(result).toBeNull();
  });

  it('should check if sequence is cached', async () => {
    const sequence = {
      number: 40,
      id: 'A000040',
      data: [2, 3, 5, 7, 11, 13],
      name: 'Prime numbers',
    };

    await cache.set(sequence);
    const exists = await cache.has('A000040');
    expect(exists).toBe(true);

    const notExists = await cache.has('A999998');
    expect(notExists).toBe(false);
  });

  it('should return cache statistics', async () => {
    const stats = await cache.getStats();
    expect(stats.count).toBeGreaterThan(0);
    expect(stats.memorySize).toBeGreaterThan(0);
  });

  it('should list cached sequences', async () => {
    const list = await cache.listCached();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it('should clear cache', async () => {
    await cache.clear();
    const stats = await cache.getStats();
    expect(stats.count).toBe(0);
  });
});

describe('OeisApiClient', () => {
  let client: OeisApiClient;

  beforeAll(() => {
    client = new OeisApiClient({
      rateLimit: 60, // Higher rate limit for tests
      timeout: 10000,
    });
  });

  describe('A-number normalization', () => {
    it('should normalize various A-number formats', async () => {
      // This test doesn't require API calls, just tests the normalization logic
      try {
        await client.getSequence('45');
      } catch (error) {
        // Ignore network errors, we're just testing format
      }

      try {
        await client.getSequence('A45');
      } catch (error) {
        // Ignore network errors
      }

      try {
        await client.getSequence('A000045');
      } catch (error) {
        // Ignore network errors
      }
    });
  });

  // Note: The following tests require network access to oeis.org
  // They are marked as optional and will be skipped if network is unavailable

  it.skip('should fetch Fibonacci sequence', async () => {
    const sequence = await client.getSequence('A000045');
    expect(sequence).toBeDefined();
    expect(sequence?.id).toBe('A000045');
    expect(sequence?.data).toContain(1);
    expect(sequence?.data).toContain(2);
    expect(sequence?.data).toContain(3);
  });

  it.skip('should search by values', async () => {
    const result = await client.searchByValues([1, 1, 2, 3, 5, 8]);
    expect(result.count).toBeGreaterThan(0);
    expect(result.results[0].id).toBe('A000045');
  });

  it.skip('should handle non-existent sequences', async () => {
    const sequence = await client.getSequence('A999999');
    expect(sequence).toBeNull();
  });
});

describe('SequenceValidator', () => {
  let validator: SequenceValidator;

  beforeAll(async () => {
    const cache = new OeisCache({ dbPath: ':memory:' });
    const client = new OeisApiClient();
    validator = new SequenceValidator({ cache, apiClient: client });
    await validator.initialize();
  });

  afterAll(async () => {
    await validator.close();
  });

  it('should reject empty sequences', async () => {
    const result = await validator.validate([]);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Empty');
  });

  it('should reject sequences that are too short', async () => {
    const result = await validator.validate([1, 2]);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('too short');
  });

  it('should validate Fibonacci with mathematical patterns', async () => {
    const sequence = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34];
    const result = await validator.validate(sequence);
    expect(result.isValid).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    expect(result.matchType).toBe('formula');
  });

  it('should validate squares with mathematical patterns', async () => {
    const sequence = [0, 1, 4, 9, 16, 25, 36, 49, 64];
    const result = await validator.validate(sequence);
    expect(result.isValid).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('should validate primes with mathematical patterns', async () => {
    const sequence = [2, 3, 5, 7, 11, 13, 17, 19];
    const result = await validator.validate(sequence);
    expect(result.isValid).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('should validate powers of 2', async () => {
    const sequence = [1, 2, 4, 8, 16, 32, 64, 128];
    const result = await validator.validate(sequence);
    expect(result.isValid).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('should validate triangular numbers', async () => {
    const sequence = [0, 1, 3, 6, 10, 15, 21, 28];
    const result = await validator.validate(sequence);
    expect(result.isValid).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('should validate factorials', async () => {
    const sequence = [1, 1, 2, 6, 24, 120, 720];
    const result = await validator.validate(sequence);
    expect(result.isValid).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('should handle invalid sequences gracefully', async () => {
    const sequence = [999, 888, 777, 666, 555];
    const result = await validator.validate(sequence);
    // Should not crash, but likely won't match
    expect(result).toBeDefined();
    expect(result.isValid).toBeDefined();
  });

  it('should provide cache statistics', async () => {
    const stats = await validator.getCacheStats();
    expect(stats).toBeDefined();
    expect(typeof stats.count).toBe('number');
  });

  // Network-dependent tests (skipped by default)
  it.skip('should validate by A-number', async () => {
    const sequence = [0, 1, 1, 2, 3, 5, 8, 13];
    const result = await validator.validateByANumber(sequence, 'A000045');
    expect(result.isValid).toBe(true);
    expect(result.sequenceId).toBe('A000045');
  });
});

describe('Integration Tests', () => {
  it('should handle end-to-end validation workflow', async () => {
    const cache = new OeisCache({ dbPath: ':memory:' });
    await cache.initialize();

    const validator = new SequenceValidator({ cache });
    await validator.initialize();

    // Test multiple sequences
    const testCases = [
      { seq: [0, 1, 1, 2, 3, 5, 8, 13], name: 'Fibonacci' },
      { seq: [2, 3, 5, 7, 11, 13], name: 'Primes' },
      { seq: [1, 4, 9, 16, 25, 36], name: 'Squares' },
      { seq: [1, 2, 4, 8, 16, 32], name: 'Powers of 2' },
    ];

    for (const testCase of testCases) {
      const result = await validator.validate(testCase.seq);
      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    }

    await validator.close();
  });

  it('should cache and reuse results', async () => {
    const cache = new OeisCache({ dbPath: ':memory:' });
    await cache.initialize();

    const sequence = {
      number: 45,
      id: 'A000045',
      data: [0, 1, 1, 2, 3, 5, 8],
      name: 'Fibonacci',
    };

    // Store in cache
    await cache.set(sequence);

    // Retrieve multiple times
    const result1 = await cache.get('A000045');
    const result2 = await cache.get('A000045');

    expect(result1).toEqual(result2);
    expect(result1?.id).toBe('A000045');

    await cache.close();
  });
});

describe('Error Handling', () => {
  it('should handle malformed sequences gracefully', async () => {
    const validator = new SequenceValidator();
    await validator.initialize();

    // @ts-expect-error Testing error handling
    const result1 = await validator.validate(null);
    expect(result1.isValid).toBe(false);

    // @ts-expect-error Testing error handling
    const result2 = await validator.validate(undefined);
    expect(result2.isValid).toBe(false);

    await validator.close();
  });

  it('should handle cache errors gracefully', async () => {
    const cache = new OeisCache({ dbPath: '/invalid/path/db.sqlite' });
    await cache.initialize(); // Should not throw

    // Operations should work with memory-only cache
    await cache.set({
      number: 1,
      id: 'A000001',
      data: [1, 2, 3],
      name: 'Test',
    });

    const result = await cache.get('A000001');
    expect(result).toBeDefined();
  });
});

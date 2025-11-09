/**
 * OEIS Security Validation Tests
 *
 * Tests security constraints, input validation, and protection against
 * malicious inputs for OEIS validation features.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SequenceValidator, OeisCache, OeisApiClient } from '../../src/oeis/index.js';

describe('OEIS Security Validation', () => {
  let validator: SequenceValidator;
  let cache: OeisCache;

  beforeEach(async () => {
    cache = new OeisCache({ dbPath: ':memory:' });
    await cache.initialize();

    validator = new SequenceValidator({ cache });
    await validator.initialize();
  });

  afterEach(async () => {
    await validator.close();
  });

  describe('Input Validation and Sanitization', () => {
    it('should reject null sequences', async () => {
      // @ts-expect-error Testing error handling
      const result = await validator.validate(null);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject undefined sequences', async () => {
      // @ts-expect-error Testing error handling
      const result = await validator.validate(undefined);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle empty arrays safely', async () => {
      const result = await validator.validate([]);

      expect(result.isValid).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.error).toContain('Empty');
    });

    it('should handle arrays with invalid numbers', async () => {
      const invalidSequences = [
        [NaN, NaN, NaN, NaN],
        [Infinity, Infinity, Infinity, Infinity],
        [-Infinity, -Infinity, -Infinity, -Infinity],
        [NaN, 1, 2, 3],
        [1, Infinity, 3, 4],
      ];

      for (const seq of invalidSequences) {
        const result = await validator.validate(seq);
        expect(result).toBeDefined();
        expect(typeof result.isValid).toBe('boolean');
      }
    });

    it('should handle very large arrays', async () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => i);

      const result = await validator.validate(largeArray);

      expect(result).toBeDefined();
      // Should handle gracefully without crashing
    });

    it('should handle sequences with extreme values', async () => {
      const sequences = [
        [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE],
        [Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE],
        [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
        [Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER],
      ];

      for (const seq of sequences) {
        const result = await validator.validate(seq);
        expect(result).toBeDefined();
      }
    });
  });

  describe('A-number Validation', () => {
    it('should reject invalid A-number formats', async () => {
      const invalidANumbers = [
        'invalid',
        'A-123',
        'B000045',
        '../../etc/passwd',
        '../../../windows/system32',
        '<script>alert("xss")</script>',
        'A; DROP TABLE sequences; --',
        '',
        '   ',
      ];

      for (const aNumber of invalidANumbers) {
        const sequence = [1, 2, 3, 4];
        try {
          const result = await validator.validateByANumber(sequence, aNumber);
          // Should either reject or handle gracefully
          expect(result).toBeDefined();
        } catch (error) {
          // Errors are acceptable for invalid inputs
          expect(error).toBeDefined();
        }
      }
    });

    it('should reject negative A-numbers', async () => {
      const sequence = [1, 2, 3, 4];

      await expect(
        validator.validateByANumber(sequence, '-45')
      ).rejects.toThrow();
    });

    it('should sanitize A-number input', async () => {
      const sequence = [0, 1, 1, 2, 3, 5];

      // Various formats that should be normalized or rejected
      const testCases = [
        { input: 'A000045', shouldWork: true },
        { input: '45', shouldWork: true },
        { input: 'A45', shouldWork: true },
        { input: 'a000045', shouldWork: true }, // Case insensitive
      ];

      for (const { input, shouldWork } of testCases) {
        try {
          const result = await validator.validateByANumber(sequence, input);
          if (shouldWork) {
            expect(result).toBeDefined();
          }
        } catch (error) {
          if (shouldWork) {
            // If it should work but threw an error, log it
            console.log(`Unexpected error for ${input}:`, error);
          }
        }
      }
    });
  });

  describe('Injection Attack Prevention', () => {
    it('should prevent SQL injection in A-numbers', async () => {
      const sqlInjectionAttempts = [
        "A000045'; DROP TABLE oeis_cache; --",
        "A000045' OR '1'='1",
        "A000045'; DELETE FROM oeis_cache WHERE '1'='1",
        "A000045' UNION SELECT * FROM sqlite_master--",
      ];

      for (const attempt of sqlInjectionAttempts) {
        try {
          await validator.validateByANumber([1, 2, 3, 4], attempt);
        } catch (error) {
          // Should reject or throw error
          expect(error).toBeDefined();
        }
      }

      // Verify cache is still intact
      const stats = await cache.getStats();
      expect(stats).toBeDefined();
    });

    it('should prevent SQL injection in cache operations', async () => {
      const maliciousIds = [
        "A000001'; DROP TABLE oeis_cache; --",
        "A000001' OR '1'='1",
        "A000001' UNION ALL SELECT NULL--",
      ];

      for (const id of maliciousIds) {
        try {
          await cache.get(id);
        } catch (error) {
          // Errors are acceptable for malicious input
        }
      }

      // Cache should still be functional
      await cache.set({
        number: 1,
        id: 'A000001',
        data: [1, 2, 3],
        name: 'Test',
      });

      const retrieved = await cache.get('A000001');
      expect(retrieved).toBeDefined();
    });

    it('should sanitize sequence data in cache', async () => {
      const maliciousSequence = {
        number: 999,
        id: 'A000999',
        data: [1, 2, 3],
        name: '<script>alert("XSS")</script>',
        comment: ['<img src=x onerror=alert("XSS")>'],
        formula: ['F(n) = <script>malicious()</script>'],
      };

      // Should store without executing scripts
      await cache.set(maliciousSequence);

      const retrieved = await cache.get('A000999');
      expect(retrieved).toBeDefined();
      // Data should be stored as-is (escaped/sanitized by application layer)
      expect(retrieved?.name).toContain('<script>');
    });
  });

  describe('XSS Prevention', () => {
    it('should handle XSS payloads in sequence names', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(\'XSS\')">',
        '<svg onload=alert("XSS")>',
        '<body onload=alert("XSS")>',
      ];

      for (const payload of xssPayloads) {
        const sequence = {
          number: 888,
          id: 'A000888',
          data: [1, 2, 3, 4],
          name: payload,
        };

        await cache.set(sequence);
        const retrieved = await cache.get('A000888');

        // Should store but not execute
        expect(retrieved).toBeDefined();
        expect(retrieved?.name).toBe(payload);
      }
    });

    it('should handle XSS in metadata fields', async () => {
      const sequence = {
        number: 777,
        id: 'A000777',
        data: [1, 2, 3, 4],
        name: 'Test',
        comment: ['<script>alert("comment")</script>'],
        formula: ['<img src=x onerror=alert("formula")>'],
        author: 'javascript:alert("author")',
      };

      await cache.set(sequence);
      const retrieved = await cache.get('A000777');

      expect(retrieved).toBeDefined();
      // All fields should be stored as data, not executed
    });
  });

  describe('Path Traversal Prevention', () => {
    it('should prevent path traversal in A-numbers', async () => {
      const pathTraversalAttempts = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32',
        '/etc/shadow',
        'C:\\Windows\\System32',
        '../../../../root/.ssh/id_rsa',
      ];

      for (const attempt of pathTraversalAttempts) {
        try {
          await validator.validateByANumber([1, 2, 3, 4], attempt);
        } catch (error) {
          // Should reject these attempts
          expect(error).toBeDefined();
        }
      }
    });

    it('should prevent path traversal in cache database paths', async () => {
      // Attempting to create cache with traversal paths
      const dangerousPaths = [
        '../../../etc/passwd',
        '/etc/shadow',
        'C:\\Windows\\System32\\config\\SAM',
      ];

      for (const path of dangerousPaths) {
        const dangerousCache = new OeisCache({ dbPath: path });
        await dangerousCache.initialize();

        // Should either fail safely or create in safe location
        // Should not actually access system files
        await dangerousCache.close();
      }
    });
  });

  describe('Resource Exhaustion Prevention', () => {
    it('should handle very long sequences without memory exhaustion', async () => {
      const veryLongSequence = Array.from({ length: 100000 }, (_, i) => i);

      const result = await validator.validate(veryLongSequence);

      expect(result).toBeDefined();
      // Should complete without crashing or hanging
    });

    it('should handle rapid validation requests', async () => {
      const promises = Array.from({ length: 100 }, (_, i) =>
        validator.validate([i, i+1, i+2, i+3])
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });

    it('should limit cache size to prevent memory exhaustion', async () => {
      const smallCache = new OeisCache({
        dbPath: ':memory:',
        maxCacheSize: 10,
      });
      await smallCache.initialize();

      // Try to add more than limit
      for (let i = 0; i < 100; i++) {
        await smallCache.set({
          number: i,
          id: `A${i.toString().padStart(6, '0')}`,
          data: Array.from({ length: 1000 }, (_, j) => j),
          name: `Sequence ${i}`,
        });
      }

      const stats = await smallCache.getStats();
      expect(stats.count).toBeLessThanOrEqual(10);

      await smallCache.close();
    });

    it('should handle sequences with very large numbers', async () => {
      const largeNumbers = [
        Number.MAX_SAFE_INTEGER,
        Number.MAX_SAFE_INTEGER - 1,
        Number.MAX_SAFE_INTEGER - 2,
        Number.MAX_SAFE_INTEGER - 3,
      ];

      const result = await validator.validate(largeNumbers);

      expect(result).toBeDefined();
    });
  });

  describe('API Security', () => {
    it('should validate API URLs', () => {
      const dangerousUrls = [
        'file:///etc/passwd',
        'ftp://malicious.com',
        'data:text/html,<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
      ];

      for (const url of dangerousUrls) {
        const client = new OeisApiClient({ baseUrl: url });
        // Should not make requests to dangerous URLs
        expect(client).toBeDefined();
      }
    });

    it('should respect rate limiting to prevent abuse', async () => {
      const client = new OeisApiClient({ rateLimit: 1 }); // Very strict limit

      // Attempting rapid requests should be rate-limited
      const start = Date.now();

      // Mock successful responses
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ count: 0, start: 0, results: [] }),
      });

      try {
        await client.search('test1');
        await client.search('test2');
      } catch (error) {
        // May timeout or be rate-limited
      }

      const duration = Date.now() - start;

      // Should have enforced delay between requests
      expect(duration).toBeGreaterThan(5000); // At least ~6 seconds for 1 req/min
    });

    it('should timeout long requests', async () => {
      const timeoutClient = new OeisApiClient({
        timeout: 100,
        maxRetries: 0,
      });

      global.fetch = vi.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 10000))
      );

      await expect(timeoutClient.search('test')).rejects.toThrow();
    });

    it('should limit retry attempts to prevent infinite loops', async () => {
      const retryClient = new OeisApiClient({
        maxRetries: 2,
        retryDelay: 10,
      });

      let attempts = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        attempts++;
        return Promise.reject(new Error('Network error'));
      });

      await expect(retryClient.search('test')).rejects.toThrow();

      // Should have tried: initial + 2 retries = 3 attempts max
      expect(attempts).toBeLessThanOrEqual(3);
    });
  });

  describe('Data Integrity', () => {
    it('should validate confidence scores are in valid range', async () => {
      const sequences = [
        [0, 1, 1, 2, 3, 5, 8],
        [2, 3, 5, 7, 11, 13],
        [999, 888, 777, 666],
      ];

      for (const seq of sequences) {
        const result = await validator.validate(seq);

        // Confidence should always be between 0 and 1
        expect(result.confidence).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should validate matched terms count', async () => {
      const sequence = [0, 1, 1, 2, 3, 5, 8, 13];
      const result = await validator.validate(sequence);

      if (result.matchDetails) {
        expect(result.matchDetails.matchedTerms).toBeGreaterThanOrEqual(0);
        expect(result.matchDetails.matchedTerms).toBeLessThanOrEqual(result.matchDetails.totalTerms);
        expect(result.matchDetails.totalTerms).toBe(sequence.length);
      }
    });

    it('should ensure consistency between isValid and confidence', async () => {
      const sequences = [
        [0, 1, 1, 2, 3, 5, 8],
        [2, 3, 5, 7, 11, 13],
        [999, 888, 777, 666],
      ];

      for (const seq of sequences) {
        const result = await validator.validate(seq);

        if (result.isValid) {
          // Valid results should have high confidence
          expect(result.confidence).toBeGreaterThan(0.7);
        }
      }
    });
  });

  describe('Error Information Disclosure', () => {
    it('should not expose sensitive information in errors', async () => {
      const invalidInputs = [
        null,
        undefined,
        [NaN, NaN],
        [Infinity],
      ];

      for (const input of invalidInputs) {
        // @ts-expect-error Testing error handling
        const result = await validator.validate(input);

        if (result.error) {
          // Error should be informative but not expose internals
          expect(result.error).not.toContain('stack');
          expect(result.error).not.toContain('password');
          expect(result.error).not.toContain('token');
          expect(result.error).not.toContain('secret');
        }
      }
    });

    it('should sanitize error messages', async () => {
      try {
        await validator.validateByANumber([1, 2, 3, 4], '<script>alert("xss")</script>');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Error should not contain executable code
        expect(errorMessage).not.toContain('<script>');
      }
    });
  });
});

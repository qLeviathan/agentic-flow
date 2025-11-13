/**
 * OeisApiClient Tests
 *
 * Comprehensive tests for OEIS API client with mocked HTTP requests.
 * Tests rate limiting, retry logic, error handling, and API parsing.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OeisApiClient, OeisApiError, type OeisSequence, type OeisSearchResult } from '../../src/oeis/OeisApiClient.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('OeisApiClient', () => {
  let client: OeisApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new OeisApiClient({
      rateLimit: 60, // High rate for tests
      timeout: 5000,
      maxRetries: 2,
      retryDelay: 100,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultClient = new OeisApiClient();
      expect(defaultClient).toBeDefined();
    });

    it('should initialize with custom configuration', () => {
      const customClient = new OeisApiClient({
        baseUrl: 'https://custom.oeis.org',
        rateLimit: 30,
        timeout: 10000,
        maxRetries: 5,
        retryDelay: 2000,
      });
      expect(customClient).toBeDefined();
    });
  });

  describe('A-number Normalization', () => {
    it('should normalize integer A-number', async () => {
      const mockResponse: OeisSearchResult = {
        count: 1,
        start: 0,
        results: [{
          number: 45,
          id: 'A000045',
          data: [0, 1, 1, 2, 3, 5],
          name: 'Fibonacci',
        }],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getSequence('45');
      expect(result?.id).toBe('A000045');
    });

    it('should normalize A-prefixed number', async () => {
      const mockResponse: OeisSearchResult = {
        count: 1,
        start: 0,
        results: [{
          number: 45,
          id: 'A000045',
          data: [0, 1, 1, 2, 3, 5],
          name: 'Fibonacci',
        }],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getSequence('A45');
      expect(result?.id).toBe('A000045');
    });

    it('should normalize full A-number', async () => {
      const mockResponse: OeisSearchResult = {
        count: 1,
        start: 0,
        results: [{
          number: 45,
          id: 'A000045',
          data: [0, 1, 1, 2, 3, 5],
          name: 'Fibonacci',
        }],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getSequence('A000045');
      expect(result?.id).toBe('A000045');
    });

    it('should reject invalid A-numbers', async () => {
      await expect(client.getSequence('invalid')).rejects.toThrow(OeisApiError);
      await expect(client.getSequence('A-123')).rejects.toThrow(OeisApiError);
      await expect(client.getSequence('')).rejects.toThrow(OeisApiError);
    });

    it('should reject negative A-numbers', async () => {
      await expect(client.getSequence('-45')).rejects.toThrow(OeisApiError);
    });
  });

  describe('Search Functionality', () => {
    it('should search by query string', async () => {
      const mockResponse: OeisSearchResult = {
        count: 3,
        start: 0,
        results: [
          { number: 1, id: 'A000001', data: [1, 2, 3], name: 'Test 1' },
          { number: 2, id: 'A000002', data: [2, 3, 4], name: 'Test 2' },
          { number: 3, id: 'A000003', data: [3, 4, 5], name: 'Test 3' },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.search('fibonacci');
      expect(result.count).toBe(3);
      expect(result.results).toHaveLength(3);
    });

    it('should search by values', async () => {
      const mockResponse: OeisSearchResult = {
        count: 1,
        start: 0,
        results: [{
          number: 45,
          id: 'A000045',
          data: [0, 1, 1, 2, 3, 5, 8],
          name: 'Fibonacci',
        }],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.searchByValues([0, 1, 1, 2, 3, 5]);
      expect(result.count).toBe(1);
      expect(result.results[0].id).toBe('A000045');
    });

    it('should handle pagination with start parameter', async () => {
      const mockResponse: OeisSearchResult = {
        count: 100,
        start: 10,
        results: [
          { number: 11, id: 'A000011', data: [1], name: 'Test 11' },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.search('test', 10);
      expect(result.start).toBe(10);
    });

    it('should handle empty search results', async () => {
      const mockResponse: OeisSearchResult = {
        count: 0,
        start: 0,
        results: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.search('nonexistent');
      expect(result.count).toBe(0);
      expect(result.results).toHaveLength(0);
    });
  });

  describe('Get Sequence', () => {
    it('should retrieve sequence by A-number', async () => {
      const mockResponse: OeisSearchResult = {
        count: 1,
        start: 0,
        results: [{
          number: 40,
          id: 'A000040',
          data: [2, 3, 5, 7, 11],
          name: 'Prime numbers',
          keyword: ['nonn'],
        }],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getSequence('A000040');
      expect(result).toBeDefined();
      expect(result?.id).toBe('A000040');
      expect(result?.name).toBe('Prime numbers');
    });

    it('should return null for non-existent sequences', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await client.getSequence('A999999');
      expect(result).toBeNull();
    });

    it('should include all sequence metadata', async () => {
      const mockResponse: OeisSearchResult = {
        count: 1,
        start: 0,
        results: [{
          number: 45,
          id: 'A000045',
          data: [0, 1, 1, 2, 3, 5, 8],
          name: 'Fibonacci numbers',
          comment: ['Comment 1', 'Comment 2'],
          formula: ['F(n) = F(n-1) + F(n-2)'],
          keyword: ['nonn', 'easy'],
          offset: '0,3',
          author: 'Example Author',
          references: ['Reference 1'],
          links: ['Link 1'],
          crossrefs: ['A000001'],
        }],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.getSequence('A000045');
      expect(result).toBeDefined();
      expect(result?.comment).toEqual(['Comment 1', 'Comment 2']);
      expect(result?.formula).toEqual(['F(n) = F(n-1) + F(n-2)']);
      expect(result?.keyword).toEqual(['nonn', 'easy']);
      expect(result?.crossrefs).toEqual(['A000001']);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limit', async () => {
      const fastClient = new OeisApiClient({ rateLimit: 10 }); // 10 req/min = 6000ms between
      const mockResponse: OeisSearchResult = {
        count: 1,
        start: 0,
        results: [{ number: 1, id: 'A000001', data: [1], name: 'Test' }],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const start = Date.now();
      await fastClient.search('test1');
      await fastClient.search('test2');
      const duration = Date.now() - start;

      // Second request should be delayed by rate limit
      expect(duration).toBeGreaterThan(5000); // ~6000ms delay
    });

    it('should queue requests properly', async () => {
      const mockResponse: OeisSearchResult = {
        count: 1,
        start: 0,
        results: [{ number: 1, id: 'A000001', data: [1], name: 'Test' }],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const promises = [
        client.search('test1'),
        client.search('test2'),
        client.search('test3'),
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on failure', async () => {
      let attempts = 0;
      (global.fetch as any).mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ count: 1, start: 0, results: [] }),
        });
      });

      const result = await client.search('test');
      expect(attempts).toBe(3);
      expect(result).toBeDefined();
    });

    it('should respect maxRetries', async () => {
      const retryClient = new OeisApiClient({ maxRetries: 1, retryDelay: 50 });

      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(retryClient.search('test')).rejects.toThrow();
    });

    it('should apply exponential backoff', async () => {
      const retryClient = new OeisApiClient({ maxRetries: 2, retryDelay: 100 });
      let attempts = 0;

      (global.fetch as any).mockImplementation(() => {
        attempts++;
        return Promise.reject(new Error('Network error'));
      });

      const start = Date.now();
      await expect(retryClient.search('test')).rejects.toThrow();
      const duration = Date.now() - start;

      // Should have delays: 100ms (first retry), 200ms (second retry)
      expect(duration).toBeGreaterThan(250);
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout long requests', async () => {
      const timeoutClient = new OeisApiClient({ timeout: 100, maxRetries: 0 });

      (global.fetch as any).mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ count: 0, start: 0, results: [] }),
        }), 5000))
      );

      await expect(timeoutClient.search('test')).rejects.toThrow();
    });

    it('should complete fast requests before timeout', async () => {
      const timeoutClient = new OeisApiClient({ timeout: 5000 });

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ count: 0, start: 0, results: [] }),
      });

      await expect(timeoutClient.search('test')).resolves.toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw OeisApiError on HTTP errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(client.search('test')).rejects.toThrow(OeisApiError);
    });

    it('should include status code in errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
      });

      try {
        await client.search('test');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(OeisApiError);
        if (error instanceof OeisApiError) {
          expect(error.statusCode).toBe(403);
          expect(error.code).toBe('HTTP_ERROR');
        }
      }
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network failure'));

      await expect(client.search('test')).rejects.toThrow();
    });

    it('should handle invalid JSON responses', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); },
      });

      await expect(client.search('test')).rejects.toThrow();
    });

    it('should handle abort errors', async () => {
      const abortClient = new OeisApiClient({ timeout: 10 });

      (global.fetch as any).mockImplementation(() =>
        new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          }, 50);
        })
      );

      await expect(abortClient.search('test')).rejects.toThrow();
    });
  });

  describe('Utility Methods', () => {
    it('should parse sequence data', () => {
      const sequence: OeisSequence = {
        number: 45,
        id: 'A000045',
        data: [0, 1, 1, 2, 3, 5, 8],
        name: 'Fibonacci',
      };

      const data = client.parseSequenceData(sequence);
      expect(data).toEqual([0, 1, 1, 2, 3, 5, 8]);
    });

    it('should return empty array for missing data', () => {
      const sequence: OeisSequence = {
        number: 1,
        id: 'A000001',
        data: [],
        name: 'Test',
      };

      const data = client.parseSequenceData(sequence);
      expect(data).toEqual([]);
    });

    it('should get formulas', () => {
      const sequence: OeisSequence = {
        number: 45,
        id: 'A000045',
        data: [0, 1, 1],
        name: 'Fibonacci',
        formula: ['F(n) = F(n-1) + F(n-2)', 'G.f.: x/(1-x-x^2)'],
      };

      const formulas = client.getFormulas(sequence);
      expect(formulas).toHaveLength(2);
      expect(formulas[0]).toContain('F(n)');
    });

    it('should detect finite sequences', () => {
      const finite: OeisSequence = {
        number: 1,
        id: 'A000001',
        data: [1, 2, 3],
        name: 'Finite',
        keyword: ['fini'],
      };

      const infinite: OeisSequence = {
        number: 2,
        id: 'A000002',
        data: [1, 2, 3],
        name: 'Infinite',
        keyword: ['nonn'],
      };

      expect(client.isFiniteSequence(finite)).toBe(true);
      expect(client.isFiniteSequence(infinite)).toBe(false);
    });

    it('should detect easy sequences', () => {
      const easy: OeisSequence = {
        number: 45,
        id: 'A000045',
        data: [0, 1, 1],
        name: 'Easy',
        keyword: ['nonn', 'easy'],
      };

      const hard: OeisSequence = {
        number: 1,
        id: 'A000001',
        data: [1],
        name: 'Hard',
        keyword: ['nonn', 'hard'],
      };

      expect(client.isEasySequence(easy)).toBe(true);
      expect(client.isEasySequence(hard)).toBe(false);
    });

    it('should get cross-references', () => {
      const sequence: OeisSequence = {
        number: 45,
        id: 'A000045',
        data: [0, 1, 1],
        name: 'Fibonacci',
        crossrefs: ['A000032', 'A000108'],
      };

      const refs = client.getCrossReferences(sequence);
      expect(refs).toEqual(['A000032', 'A000108']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty query strings', async () => {
      const mockResponse: OeisSearchResult = {
        count: 0,
        start: 0,
        results: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.search('');
      expect(result).toBeDefined();
    });

    it('should handle very long query strings', async () => {
      const longQuery = 'a'.repeat(1000);
      const mockResponse: OeisSearchResult = {
        count: 0,
        start: 0,
        results: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(client.search(longQuery)).resolves.toBeDefined();
    });

    it('should handle special characters in queries', async () => {
      const specialQuery = 'test & special=chars';
      const mockResponse: OeisSearchResult = {
        count: 0,
        start: 0,
        results: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await expect(client.search(specialQuery)).resolves.toBeDefined();
    });

    it('should handle empty value arrays', async () => {
      const mockResponse: OeisSearchResult = {
        count: 0,
        start: 0,
        results: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.searchByValues([]);
      expect(result).toBeDefined();
    });

    it('should handle large value arrays', async () => {
      const largeArray = Array.from({ length: 100 }, (_, i) => i);
      const mockResponse: OeisSearchResult = {
        count: 0,
        start: 0,
        results: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await client.searchByValues(largeArray);
      expect(result).toBeDefined();
    });

    it('should handle sequences with missing optional fields', () => {
      const minimal: OeisSequence = {
        number: 1,
        id: 'A000001',
        data: [1, 2, 3],
        name: 'Minimal',
      };

      expect(client.getFormulas(minimal)).toEqual([]);
      expect(client.getCrossReferences(minimal)).toEqual([]);
      expect(client.isFiniteSequence(minimal)).toBe(false);
      expect(client.isEasySequence(minimal)).toBe(false);
    });
  });
});

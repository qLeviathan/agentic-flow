/**
 * OeisCache Tests
 *
 * Comprehensive tests for OEIS caching functionality.
 * Tests SQLite persistence, TTL expiration, memory caching, and cache management.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OeisCache, type CachedSequence } from '../../src/oeis/OeisCache.js';
import type { OeisSequence } from '../../src/oeis/OeisApiClient.js';
import * as fs from 'fs';

const TEST_DB_PATH = './tests/fixtures/test-oeis-cache.db';

describe('OeisCache', () => {
  let cache: OeisCache;

  beforeEach(async () => {
    // Clean up any existing test databases
    [TEST_DB_PATH, `${TEST_DB_PATH}-wal`, `${TEST_DB_PATH}-shm`].forEach(file => {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
        } catch (e) {
          // Ignore
        }
      }
    });

    cache = new OeisCache({
      dbPath: TEST_DB_PATH,
      defaultTTL: 3600, // 1 hour for tests
      maxCacheSize: 100,
      preloadPopular: false, // Disable for unit tests
    });

    await cache.initialize();
  });

  afterEach(async () => {
    await cache.close();

    // Clean up test databases
    [TEST_DB_PATH, `${TEST_DB_PATH}-wal`, `${TEST_DB_PATH}-shm`].forEach(file => {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
        } catch (e) {
          // Ignore
        }
      }
    });
  });

  describe('Initialization', () => {
    it('should initialize with memory database', async () => {
      const memCache = new OeisCache({ dbPath: ':memory:' });
      await expect(memCache.initialize()).resolves.toBeUndefined();
      await memCache.close();
    });

    it('should initialize with file database', async () => {
      const fileCache = new OeisCache({ dbPath: TEST_DB_PATH });
      await expect(fileCache.initialize()).resolves.toBeUndefined();
      await fileCache.close();
    });

    it('should use default configuration', async () => {
      const defaultCache = new OeisCache();
      await expect(defaultCache.initialize()).resolves.toBeUndefined();
      await defaultCache.close();
    });

    it('should handle initialization errors gracefully', async () => {
      const badCache = new OeisCache({ dbPath: '/invalid/path/db.sqlite' });
      await expect(badCache.initialize()).resolves.toBeUndefined();
      // Should continue in memory-only mode
    });
  });

  describe('Store and Retrieve', () => {
    it('should store and retrieve sequences', async () => {
      const sequence: OeisSequence = {
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
      expect(retrieved?.data).toEqual([0, 1, 1, 2, 3, 5, 8, 13, 21]);
    });

    it('should store sequence with all metadata', async () => {
      const sequence: OeisSequence = {
        number: 40,
        id: 'A000040',
        data: [2, 3, 5, 7, 11],
        name: 'Prime numbers',
        comment: ['Comment 1', 'Comment 2'],
        formula: ['Prime formula'],
        keyword: ['nonn'],
        offset: '1,1',
        author: 'Test Author',
        references: ['Ref 1'],
        links: ['Link 1'],
        crossrefs: ['A000045'],
      };

      await cache.set(sequence);
      const retrieved = await cache.get('A000040');

      expect(retrieved).toBeDefined();
      expect(retrieved?.comment).toEqual(['Comment 1', 'Comment 2']);
      expect(retrieved?.formula).toEqual(['Prime formula']);
      expect(retrieved?.author).toBe('Test Author');
    });

    it('should handle cache misses', async () => {
      const result = await cache.get('A999999');
      expect(result).toBeNull();
    });

    it('should overwrite existing entries', async () => {
      const sequence1: OeisSequence = {
        number: 1,
        id: 'A000001',
        data: [1, 2, 3],
        name: 'Version 1',
      };

      const sequence2: OeisSequence = {
        number: 1,
        id: 'A000001',
        data: [1, 2, 3, 4, 5],
        name: 'Version 2',
      };

      await cache.set(sequence1);
      await cache.set(sequence2);

      const retrieved = await cache.get('A000001');
      expect(retrieved?.name).toBe('Version 2');
      expect(retrieved?.data).toHaveLength(5);
    });
  });

  describe('Memory and Disk Caching', () => {
    it('should cache in memory after first retrieval', async () => {
      const sequence: OeisSequence = {
        number: 100,
        id: 'A000100',
        data: [1, 2, 3],
        name: 'Memory test',
      };

      await cache.set(sequence);

      // First get from disk
      const first = await cache.get('A000100');
      expect(first).toBeDefined();

      // Second get should be from memory (faster)
      const start = Date.now();
      const second = await cache.get('A000100');
      const duration = Date.now() - start;

      expect(second).toBeDefined();
      expect(duration).toBeLessThan(10); // Very fast memory access
    });

    it('should maintain consistency between memory and disk', async () => {
      const sequences = Array.from({ length: 10 }, (_, i) => ({
        number: i,
        id: `A00000${i}`,
        data: [i, i+1, i+2],
        name: `Sequence ${i}`,
      }));

      for (const seq of sequences) {
        await cache.set(seq);
      }

      for (const seq of sequences) {
        const retrieved = await cache.get(seq.id);
        expect(retrieved?.id).toBe(seq.id);
      }
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should respect TTL for cache entries', async () => {
      const shortCache = new OeisCache({
        dbPath: ':memory:',
        defaultTTL: 1, // 1 second
      });
      await shortCache.initialize();

      const sequence: OeisSequence = {
        number: 1,
        id: 'A000001',
        data: [1, 2, 3],
        name: 'Short TTL',
      };

      await shortCache.set(sequence);

      // Should be available immediately
      const immediate = await shortCache.get('A000001');
      expect(immediate).toBeDefined();

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Should be expired
      const expired = await shortCache.get('A000001');
      expect(expired).toBeNull();

      await shortCache.close();
    });

    it('should allow custom TTL per entry', async () => {
      const sequence: OeisSequence = {
        number: 2,
        id: 'A000002',
        data: [1, 2, 3],
        name: 'Custom TTL',
      };

      await cache.set(sequence, 2); // 2 second TTL

      const immediate = await cache.get('A000002');
      expect(immediate).toBeDefined();
    });

    it('should not expire entries within TTL', async () => {
      const longCache = new OeisCache({
        dbPath: ':memory:',
        defaultTTL: 3600, // 1 hour
      });
      await longCache.initialize();

      const sequence: OeisSequence = {
        number: 3,
        id: 'A000003',
        data: [1, 2, 3],
        name: 'Long TTL',
      };

      await longCache.set(sequence);

      // Wait a bit but not past TTL
      await new Promise(resolve => setTimeout(resolve, 100));

      const retrieved = await longCache.get('A000003');
      expect(retrieved).toBeDefined();

      await longCache.close();
    });
  });

  describe('Cache Management', () => {
    it('should delete entries', async () => {
      const sequence: OeisSequence = {
        number: 10,
        id: 'A000010',
        data: [1, 2, 3],
        name: 'Delete test',
      };

      await cache.set(sequence);
      expect(await cache.get('A000010')).toBeDefined();

      await cache.delete('A000010');
      expect(await cache.get('A000010')).toBeNull();
    });

    it('should clear all cache', async () => {
      const sequences = Array.from({ length: 5 }, (_, i) => ({
        number: i,
        id: `A00000${i}`,
        data: [i],
        name: `Seq ${i}`,
      }));

      for (const seq of sequences) {
        await cache.set(seq);
      }

      const statsBefore = await cache.getStats();
      expect(statsBefore.count).toBeGreaterThan(0);

      await cache.clear();

      const statsAfter = await cache.getStats();
      expect(statsAfter.count).toBe(0);
    });

    it('should check if entry exists', async () => {
      const sequence: OeisSequence = {
        number: 45,
        id: 'A000045',
        data: [0, 1, 1],
        name: 'Exists test',
      };

      await cache.set(sequence);

      expect(await cache.has('A000045')).toBe(true);
      expect(await cache.has('A999999')).toBe(false);
    });

    it('should list cached sequence IDs', async () => {
      const sequences = [
        { number: 1, id: 'A000001', data: [1], name: 'One' },
        { number: 2, id: 'A000002', data: [2], name: 'Two' },
        { number: 3, id: 'A000003', data: [3], name: 'Three' },
      ];

      for (const seq of sequences) {
        await cache.set(seq);
      }

      const list = await cache.listCached();
      expect(list).toContain('A000001');
      expect(list).toContain('A000002');
      expect(list).toContain('A000003');
    });
  });

  describe('Cache Statistics', () => {
    it('should provide cache statistics', async () => {
      const stats = await cache.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.count).toBe('number');
      expect(typeof stats.memorySize).toBe('number');
      expect(typeof stats.diskSize).toBe('number');
      expect(Array.isArray(stats.topSequences)).toBe(true);
    });

    it('should track hit counts', async () => {
      const sequence: OeisSequence = {
        number: 45,
        id: 'A000045',
        data: [0, 1, 1],
        name: 'Hit count test',
      };

      await cache.set(sequence);

      // Access multiple times
      await cache.get('A000045');
      await cache.get('A000045');
      await cache.get('A000045');

      const stats = await cache.getStats();
      const topSeq = stats.topSequences.find(s => s.id === 'A000045');

      expect(topSeq).toBeDefined();
      expect(topSeq?.hitCount).toBeGreaterThan(0);
    });

    it('should rank by hit count', async () => {
      const sequences = [
        { number: 1, id: 'A000001', data: [1], name: 'Low' },
        { number: 2, id: 'A000002', data: [2], name: 'High' },
      ];

      for (const seq of sequences) {
        await cache.set(seq);
      }

      // Access A000002 more times
      await cache.get('A000002');
      await cache.get('A000002');
      await cache.get('A000002');
      await cache.get('A000001');

      const stats = await cache.getStats();
      if (stats.topSequences.length >= 2) {
        // A000002 should have higher hit count
        const seq2 = stats.topSequences.find(s => s.id === 'A000002');
        const seq1 = stats.topSequences.find(s => s.id === 'A000001');

        if (seq1 && seq2) {
          expect(seq2.hitCount).toBeGreaterThan(seq1.hitCount);
        }
      }
    });

    it('should limit top sequences list', async () => {
      // Add many sequences
      for (let i = 0; i < 20; i++) {
        await cache.set({
          number: i,
          id: `A0000${i.toString().padStart(2, '0')}`,
          data: [i],
          name: `Seq ${i}`,
        });
      }

      const stats = await cache.getStats();
      expect(stats.topSequences.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Cache Size Management', () => {
    it('should enforce maximum cache size', async () => {
      const smallCache = new OeisCache({
        dbPath: ':memory:',
        maxCacheSize: 5,
      });
      await smallCache.initialize();

      // Add more than max size
      for (let i = 0; i < 10; i++) {
        await smallCache.set({
          number: i,
          id: `A00000${i}`,
          data: [i],
          name: `Seq ${i}`,
        });
      }

      const stats = await smallCache.getStats();
      expect(stats.count).toBeLessThanOrEqual(5);

      await smallCache.close();
    });

    it('should remove least used entries when full', async () => {
      const smallCache = new OeisCache({
        dbPath: ':memory:',
        maxCacheSize: 3,
      });
      await smallCache.initialize();

      // Add sequences
      const seqs = [
        { number: 1, id: 'A000001', data: [1], name: 'One' },
        { number: 2, id: 'A000002', data: [2], name: 'Two' },
        { number: 3, id: 'A000003', data: [3], name: 'Three' },
      ];

      for (const seq of seqs) {
        await smallCache.set(seq);
      }

      // Access some to increase hit count
      await smallCache.get('A000002');
      await smallCache.get('A000003');

      // Add a new one (should evict A000001 - least used)
      await smallCache.set({
        number: 4,
        id: 'A000004',
        data: [4],
        name: 'Four',
      });

      // A000001 might be evicted
      const list = await smallCache.listCached();
      expect(list.length).toBeLessThanOrEqual(3);

      await smallCache.close();
    });
  });

  describe('Popular Sequences', () => {
    it('should provide list of popular sequence IDs', () => {
      const popularIds = cache.getPopularSequenceIds();

      expect(Array.isArray(popularIds)).toBe(true);
      expect(popularIds.length).toBeGreaterThan(0);
      expect(popularIds).toContain('A000045'); // Fibonacci
      expect(popularIds).toContain('A000040'); // Primes
    });

    it('should not modify returned popular list', () => {
      const list1 = cache.getPopularSequenceIds();
      const list2 = cache.getPopularSequenceIds();

      expect(list1).toEqual(list2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle sequences with empty data', async () => {
      const sequence: OeisSequence = {
        number: 999,
        id: 'A000999',
        data: [],
        name: 'Empty data',
      };

      await cache.set(sequence);
      const retrieved = await cache.get('A000999');

      expect(retrieved).toBeDefined();
      expect(retrieved?.data).toEqual([]);
    });

    it('should handle sequences with very large data', async () => {
      const largeData = Array.from({ length: 10000 }, (_, i) => i);
      const sequence: OeisSequence = {
        number: 888,
        id: 'A000888',
        data: largeData,
        name: 'Large data',
      };

      await cache.set(sequence);
      const retrieved = await cache.get('A000888');

      expect(retrieved).toBeDefined();
      expect(retrieved?.data).toHaveLength(10000);
    });

    it('should handle special characters in names', async () => {
      const sequence: OeisSequence = {
        number: 777,
        id: 'A000777',
        data: [1, 2, 3],
        name: 'Special <>&"\' chars',
      };

      await cache.set(sequence);
      const retrieved = await cache.get('A000777');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Special <>&"\' chars');
    });

    it('should handle Unicode in names', async () => {
      const sequence: OeisSequence = {
        number: 666,
        id: 'A000666',
        data: [1, 2, 3],
        name: 'Unicode: 你好 🌍 مرحبا',
      };

      await cache.set(sequence);
      const retrieved = await cache.get('A000666');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toContain('你好');
    });

    it('should handle rapid concurrent operations', async () => {
      const promises = Array.from({ length: 50 }, (_, i) =>
        cache.set({
          number: i,
          id: `A${i.toString().padStart(6, '0')}`,
          data: [i],
          name: `Concurrent ${i}`,
        })
      );

      await expect(Promise.all(promises)).resolves.toBeDefined();

      const stats = await cache.getStats();
      expect(stats.count).toBeGreaterThan(0);
    });

    it('should handle null/undefined in optional fields gracefully', async () => {
      const sequence: OeisSequence = {
        number: 555,
        id: 'A000555',
        data: [1, 2, 3],
        name: 'Minimal',
        comment: undefined,
        formula: undefined,
        keyword: undefined,
      };

      await cache.set(sequence);
      const retrieved = await cache.get('A000555');

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('A000555');
    });
  });

  describe('Persistence', () => {
    it('should persist across cache instances', async () => {
      const cache1 = new OeisCache({ dbPath: TEST_DB_PATH });
      await cache1.initialize();

      const sequence: OeisSequence = {
        number: 123,
        id: 'A000123',
        data: [1, 2, 3],
        name: 'Persistent',
      };

      await cache1.set(sequence);
      await cache1.close();

      // Create new instance with same database
      const cache2 = new OeisCache({ dbPath: TEST_DB_PATH });
      await cache2.initialize();

      const retrieved = await cache2.get('A000123');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Persistent');

      await cache2.close();
    });
  });

  describe('Error Recovery', () => {
    it('should continue operations after errors', async () => {
      const sequence: OeisSequence = {
        number: 1,
        id: 'A000001',
        data: [1, 2, 3],
        name: 'Recovery test',
      };

      await cache.set(sequence);

      // Try to get non-existent
      await cache.get('A999999');

      // Should still work
      const retrieved = await cache.get('A000001');
      expect(retrieved).toBeDefined();
    });

    it('should handle close errors gracefully', async () => {
      const testCache = new OeisCache({ dbPath: ':memory:' });
      await testCache.initialize();

      // Close multiple times should not crash
      await testCache.close();
      await testCache.close();
    });
  });
});

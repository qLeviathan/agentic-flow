/**
 * OeisCache - SQLite-based caching for OEIS sequences
 *
 * Provides persistent caching of OEIS sequence data with TTL support.
 * Preloads popular sequences for fast validation.
 */

import { createDatabase } from '../db-fallback.js';
import type { OeisSequence } from './OeisApiClient.js';
import type { Database } from 'better-sqlite3';

export interface CacheConfig {
  dbPath?: string;
  defaultTTL?: number;      // Default TTL in seconds
  maxCacheSize?: number;    // Max cached entries
  preloadPopular?: boolean; // Preload popular sequences
}

export interface CachedSequence {
  id: string;
  data: string;             // JSON stringified OeisSequence
  timestamp: number;
  ttl: number;
  hitCount: number;
}

/**
 * Popular OEIS sequences to preload
 */
const POPULAR_SEQUENCES = [
  'A000045',  // Fibonacci
  'A000040',  // Primes
  'A000142',  // Factorials
  'A000290',  // Squares (n^2)
  'A000079',  // Powers of 2
  'A000244',  // Powers of 3
  'A000351',  // Powers of 5
  'A000578',  // Cubes (n^3)
  'A001477',  // Non-negative integers
  'A001478',  // Negative integers
  'A000217',  // Triangular numbers
  'A000396',  // Perfect numbers
  'A000668',  // Mersenne primes
  'A001358',  // Semiprimes
  'A002808',  // Composite numbers
  'A005843',  // Even numbers
  'A005408',  // Odd numbers
  'A000110',  // Bell numbers
  'A000108',  // Catalan numbers
  'A000041',  // Partition function
];

/**
 * SQLite-based cache for OEIS sequences
 */
export class OeisCache {
  private db: Database | null = null;
  private config: Required<CacheConfig>;
  private memoryCache: Map<string, OeisSequence> = new Map();

  constructor(config: CacheConfig = {}) {
    this.config = {
      dbPath: config.dbPath || ':memory:',
      defaultTTL: config.defaultTTL || 86400,        // 24 hours
      maxCacheSize: config.maxCacheSize || 10000,
      preloadPopular: config.preloadPopular ?? true,
    };
  }

  /**
   * Initialize the cache database
   */
  async initialize(): Promise<void> {
    try {
      this.db = await createDatabase(this.config.dbPath);
      this.createTables();

      if (this.config.preloadPopular) {
        await this.preloadPopularSequences();
      }

      console.log('✅ OEIS cache initialized');
    } catch (error) {
      console.warn('⚠️  Failed to initialize OEIS cache:', error);
      // Continue without persistent cache (memory-only mode)
    }
  }

  /**
   * Create cache tables
   */
  private createTables(): void {
    if (!this.db) return;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS oeis_cache (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        ttl INTEGER NOT NULL,
        hit_count INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_oeis_cache_timestamp
        ON oeis_cache(timestamp);

      CREATE INDEX IF NOT EXISTS idx_oeis_cache_hit_count
        ON oeis_cache(hit_count DESC);
    `);
  }

  /**
   * Get sequence from cache
   */
  async get(id: string): Promise<OeisSequence | null> {
    // Check memory cache first
    if (this.memoryCache.has(id)) {
      return this.memoryCache.get(id)!;
    }

    // Check database cache
    if (!this.db) return null;

    try {
      const stmt = this.db.prepare(`
        SELECT id, data, timestamp, ttl, hit_count
        FROM oeis_cache
        WHERE id = ?
      `);

      const row = stmt.get(id) as CachedSequence | undefined;

      if (!row) return null;

      // Check if expired
      const now = Date.now() / 1000;
      if (now - row.timestamp > row.ttl) {
        // Expired, remove from cache
        this.delete(id);
        return null;
      }

      // Update hit count
      this.db.prepare(`
        UPDATE oeis_cache
        SET hit_count = hit_count + 1
        WHERE id = ?
      `).run(id);

      // Parse and cache in memory
      const sequence = JSON.parse(row.data) as OeisSequence;
      this.memoryCache.set(id, sequence);

      return sequence;
    } catch (error) {
      console.warn(`Failed to get sequence ${id} from cache:`, error);
      return null;
    }
  }

  /**
   * Set sequence in cache
   */
  async set(sequence: OeisSequence, ttl?: number): Promise<void> {
    const id = sequence.id;
    const cacheData = JSON.stringify(sequence);
    const timestamp = Date.now() / 1000;
    const cacheTTL = ttl || this.config.defaultTTL;

    // Store in memory cache
    this.memoryCache.set(id, sequence);

    // Store in database
    if (!this.db) return;

    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO oeis_cache (id, data, timestamp, ttl, hit_count)
        VALUES (?, ?, ?, ?, COALESCE((SELECT hit_count FROM oeis_cache WHERE id = ?), 0))
      `);

      stmt.run(id, cacheData, timestamp, cacheTTL, id);

      // Cleanup if cache is too large
      await this.cleanupIfNeeded();
    } catch (error) {
      console.warn(`Failed to cache sequence ${id}:`, error);
    }
  }

  /**
   * Delete sequence from cache
   */
  async delete(id: string): Promise<void> {
    this.memoryCache.delete(id);

    if (!this.db) return;

    try {
      this.db.prepare('DELETE FROM oeis_cache WHERE id = ?').run(id);
    } catch (error) {
      console.warn(`Failed to delete sequence ${id} from cache:`, error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();

    if (!this.db) return;

    try {
      this.db.prepare('DELETE FROM oeis_cache').run();
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    count: number;
    memorySize: number;
    diskSize: number;
    topSequences: Array<{ id: string; hitCount: number }>;
  }> {
    if (!this.db) {
      return {
        count: this.memoryCache.size,
        memorySize: this.memoryCache.size,
        diskSize: 0,
        topSequences: [],
      };
    }

    try {
      const countRow = this.db.prepare('SELECT COUNT(*) as count FROM oeis_cache').get() as { count: number };

      const topRows = this.db.prepare(`
        SELECT id, hit_count as hitCount
        FROM oeis_cache
        ORDER BY hit_count DESC
        LIMIT 10
      `).all() as Array<{ id: string; hitCount: number }>;

      return {
        count: countRow.count,
        memorySize: this.memoryCache.size,
        diskSize: countRow.count,
        topSequences: topRows,
      };
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
      return {
        count: this.memoryCache.size,
        memorySize: this.memoryCache.size,
        diskSize: 0,
        topSequences: [],
      };
    }
  }

  /**
   * Cleanup expired entries and enforce size limit
   */
  private async cleanupIfNeeded(): Promise<void> {
    if (!this.db) return;

    try {
      const now = Date.now() / 1000;

      // Remove expired entries
      this.db.prepare(`
        DELETE FROM oeis_cache
        WHERE timestamp + ttl < ?
      `).run(now);

      // Check total count
      const countRow = this.db.prepare('SELECT COUNT(*) as count FROM oeis_cache').get() as { count: number };

      if (countRow.count > this.config.maxCacheSize) {
        // Remove least frequently used entries
        const toRemove = countRow.count - this.config.maxCacheSize;
        this.db.prepare(`
          DELETE FROM oeis_cache
          WHERE id IN (
            SELECT id FROM oeis_cache
            ORDER BY hit_count ASC, timestamp ASC
            LIMIT ?
          )
        `).run(toRemove);
      }
    } catch (error) {
      console.warn('Failed to cleanup cache:', error);
    }
  }

  /**
   * Preload popular sequences (stub for initial implementation)
   */
  private async preloadPopularSequences(): Promise<void> {
    // This will be populated by the validator when it fetches popular sequences
    // For now, we just ensure the cache is ready
    console.log(`📦 Cache ready for ${POPULAR_SEQUENCES.length} popular sequences`);
  }

  /**
   * Check if sequence is cached
   */
  async has(id: string): Promise<boolean> {
    if (this.memoryCache.has(id)) {
      return true;
    }

    if (!this.db) return false;

    try {
      const stmt = this.db.prepare(`
        SELECT 1 FROM oeis_cache
        WHERE id = ? AND timestamp + ttl > ?
      `);
      const now = Date.now() / 1000;
      const row = stmt.get(id, now);
      return !!row;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get list of cached sequence IDs
   */
  async listCached(): Promise<string[]> {
    if (!this.db) {
      return Array.from(this.memoryCache.keys());
    }

    try {
      const rows = this.db.prepare('SELECT id FROM oeis_cache').all() as Array<{ id: string }>;
      return rows.map(row => row.id);
    } catch (error) {
      console.warn('Failed to list cached sequences:', error);
      return Array.from(this.memoryCache.keys());
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      try {
        this.db.close();
        this.db = null;
      } catch (error) {
        console.warn('Failed to close cache database:', error);
      }
    }
  }

  /**
   * Get popular sequences list
   */
  getPopularSequenceIds(): string[] {
    return [...POPULAR_SEQUENCES];
  }
}

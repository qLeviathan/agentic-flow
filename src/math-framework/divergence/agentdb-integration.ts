/**
 * AgentDB Integration for Behrend-Kimberling Theorem
 *
 * Stores Nash equilibrium candidates and patterns in AgentDB
 * for persistent memory and pattern learning.
 */

import { analyzeBKTheorem, exportNashCandidates, type BKAnalysis } from './behrend-kimberling';

export interface NashMemoryEntry {
  key: string;
  n: number;
  lucasNumber: string;  // BigInt as string for JSON
  lucasIndex: number;
  V: number;
  U: number;
  S: number;
  d: number;
  verified: boolean;
  timestamp: number;
  metadata: {
    category: 'nash-equilibrium';
    theorem: 'behrend-kimberling';
    range?: number;
  };
}

export interface PatternLearningData {
  nashSequence: number[];
  lucasSequence: number[];
  divergencePattern: number[];
  localDifferencePattern: number[];
  statistics: {
    totalPoints: number;
    nashCount: number;
    lucasCount: number;
    matchRate: number;
    theoremVerified: boolean;
  };
}

/**
 * Store Nash equilibria in AgentDB memory
 * Returns memory keys for stored entries
 */
export async function storeNashEquilibria(
  analysis: BKAnalysis,
  memoryStore: (key: string, data: any) => Promise<void>
): Promise<string[]> {
  const candidates = exportNashCandidates(analysis);
  const keys: string[] = [];

  for (const candidate of candidates) {
    const entry: NashMemoryEntry = {
      key: `bk-nash-${candidate.n}`,
      n: candidate.n,
      lucasNumber: candidate.lucasNumber.toString(),
      lucasIndex: candidate.lucasIndex,
      V: candidate.V,
      U: candidate.U,
      S: candidate.S,
      d: candidate.d,
      verified: true,
      timestamp: candidate.timestamp,
      metadata: {
        category: 'nash-equilibrium',
        theorem: 'behrend-kimberling'
      }
    };

    await memoryStore(entry.key, entry);
    keys.push(entry.key);
  }

  return keys;
}

/**
 * Store complete B-K analysis for pattern learning
 */
export async function storeAnalysisPattern(
  analysis: BKAnalysis,
  memoryStore: (key: string, data: any) => Promise<void>
): Promise<string> {
  const patternData: PatternLearningData = {
    nashSequence: analysis.nashEquilibria.map(p => p.n),
    lucasSequence: analysis.lucasPoints.map(p => p.n),
    divergencePattern: analysis.points.map(p => p.S),
    localDifferencePattern: analysis.points.map(p => p.d),
    statistics: {
      totalPoints: analysis.points.length,
      nashCount: analysis.nashEquilibria.length,
      lucasCount: analysis.lucasPoints.length,
      matchRate: analysis.nashEquilibria.length / Math.max(analysis.lucasPoints.length, 1),
      theoremVerified: analysis.theoremVerified
    }
  };

  const key = `bk-pattern-${Date.now()}`;
  await memoryStore(key, {
    key,
    pattern: patternData,
    metadata: {
      category: 'pattern-learning',
      theorem: 'behrend-kimberling',
      range: analysis.points.length - 1
    },
    timestamp: Date.now()
  });

  return key;
}

/**
 * Batch store analysis with all Nash candidates
 * Returns all memory keys created
 */
export async function batchStoreAnalysis(
  n: number,
  memoryStore: (key: string, data: any) => Promise<void>
): Promise<{
  nashKeys: string[];
  patternKey: string;
  summary: {
    totalNashPoints: number;
    range: number;
    verified: boolean;
  };
}> {
  // Compute analysis
  const analysis = analyzeBKTheorem(n);

  // Store Nash equilibria
  const nashKeys = await storeNashEquilibria(analysis, memoryStore);

  // Store pattern
  const patternKey = await storeAnalysisPattern(analysis, memoryStore);

  return {
    nashKeys,
    patternKey,
    summary: {
      totalNashPoints: nashKeys.length,
      range: n,
      verified: analysis.theoremVerified
    }
  };
}

/**
 * Retrieve Nash equilibria from memory
 */
export async function retrieveNashEquilibria(
  memoryRetrieve: (key: string) => Promise<any>,
  range?: number
): Promise<NashMemoryEntry[]> {
  const entries: NashMemoryEntry[] = [];

  // If range specified, try to retrieve all in range
  if (range !== undefined) {
    for (let n = 0; n <= range; n++) {
      try {
        const entry = await memoryRetrieve(`bk-nash-${n}`);
        if (entry) {
          entries.push(entry);
        }
      } catch (e) {
        // Entry doesn't exist, skip
      }
    }
  }

  return entries;
}

/**
 * Create AgentDB-compatible memory operations
 * This provides a simple interface that can be adapted to actual AgentDB API
 */
export class BKMemoryManager {
  private storage: Map<string, any> = new Map();

  /**
   * Store data in memory
   */
  async store(key: string, data: any): Promise<void> {
    this.storage.set(key, JSON.parse(JSON.stringify(data)));
  }

  /**
   * Retrieve data from memory
   */
  async retrieve(key: string): Promise<any> {
    return this.storage.get(key);
  }

  /**
   * Store complete B-K analysis
   */
  async storeAnalysis(n: number): Promise<{
    nashKeys: string[];
    patternKey: string;
    summary: any;
  }> {
    return batchStoreAnalysis(n, this.store.bind(this));
  }

  /**
   * Retrieve all Nash equilibria
   */
  async getNashEquilibria(range?: number): Promise<NashMemoryEntry[]> {
    return retrieveNashEquilibria(this.retrieve.bind(this), range);
  }

  /**
   * Get all stored keys
   */
  getKeys(): string[] {
    return Array.from(this.storage.keys());
  }

  /**
   * Get storage statistics
   */
  getStats(): {
    totalEntries: number;
    nashEntries: number;
    patternEntries: number;
  } {
    const keys = this.getKeys();
    return {
      totalEntries: keys.length,
      nashEntries: keys.filter(k => k.startsWith('bk-nash-')).length,
      patternEntries: keys.filter(k => k.startsWith('bk-pattern-')).length
    };
  }

  /**
   * Clear all memory
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * Export all memory as JSON
   */
  exportJSON(): string {
    const data: Record<string, any> = {};
    for (const [key, value] of this.storage.entries()) {
      data[key] = value;
    }
    return JSON.stringify(data, null, 2);
  }
}

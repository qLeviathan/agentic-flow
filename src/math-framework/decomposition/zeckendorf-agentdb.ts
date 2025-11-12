/**
 * AgentDB Integration for Zeckendorf Decomposition Learning
 *
 * Stores and learns from Zeckendorf decompositions for pattern recognition
 * and optimization using AgentDB's vector database capabilities.
 *
 * @module zeckendorf-agentdb
 */

import {
  zeckendorfDecompose,
  analyzeZeckendorfPatterns,
  type ZeckendorfRepresentation
} from './zeckendorf';

/**
 * Zeckendorf decomposition record for AgentDB storage
 */
export interface ZeckendorfRecord {
  id: string;
  number: number;
  indices: number[];
  summandCount: number;
  lucasCount: number;
  representation: string;
  timestamp: number;
  metadata: {
    isValid: boolean;
    fibValues: number[];
    computationTime?: number;
  };
}

/**
 * AgentDB storage interface for Zeckendorf decompositions
 */
export class ZeckendorfDatabase {
  private records: Map<number, ZeckendorfRecord>;
  private vectorEmbeddings: Map<string, number[]>;

  constructor() {
    this.records = new Map();
    this.vectorEmbeddings = new Map();
  }

  /**
   * Store a Zeckendorf decomposition in the database
   *
   * @param decomposition - Zeckendorf representation to store
   * @returns Record ID
   */
  store(decomposition: ZeckendorfRepresentation): string {
    const id = `zeckendorf_${decomposition.n}_${Date.now()}`;

    const record: ZeckendorfRecord = {
      id,
      number: decomposition.n,
      indices: Array.from(decomposition.indices),
      summandCount: decomposition.summandCount,
      lucasCount: decomposition.lucasSummandCount,
      representation: decomposition.representation,
      timestamp: Date.now(),
      metadata: {
        isValid: decomposition.isValid,
        fibValues: decomposition.values
      }
    };

    this.records.set(decomposition.n, record);

    // Create vector embedding for similarity search
    const embedding = this.createEmbedding(decomposition);
    this.vectorEmbeddings.set(id, embedding);

    return id;
  }

  /**
   * Retrieve a decomposition by number
   *
   * @param n - Number to retrieve decomposition for
   * @returns Zeckendorf record or undefined
   */
  retrieve(n: number): ZeckendorfRecord | undefined {
    return this.records.get(n);
  }

  /**
   * Find similar decompositions using vector similarity
   *
   * @param n - Reference number
   * @param k - Number of similar results to return
   * @returns Array of similar decompositions
   */
  findSimilar(n: number, k: number = 5): ZeckendorfRecord[] {
    const targetDecomp = zeckendorfDecompose(n);
    const targetEmbedding = this.createEmbedding(targetDecomp);

    const similarities: Array<{ record: ZeckendorfRecord; similarity: number }> = [];

    for (const [id, embedding] of this.vectorEmbeddings.entries()) {
      const similarity = this.cosineSimilarity(targetEmbedding, embedding);
      const record = Array.from(this.records.values()).find(r => r.id === id);

      if (record && record.number !== n) {
        similarities.push({ record, similarity });
      }
    }

    // Sort by similarity and return top k
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, k).map(s => s.record);
  }

  /**
   * Batch store multiple decompositions
   *
   * @param numbers - Array of numbers to decompose and store
   * @returns Array of record IDs
   */
  batchStore(numbers: number[]): string[] {
    const start = Date.now();
    const ids: string[] = [];

    for (const n of numbers) {
      const decomposition = zeckendorfDecompose(n);
      const id = this.store(decomposition);
      ids.push(id);
    }

    const duration = Date.now() - start;
    console.log(`Stored ${numbers.length} decompositions in ${duration}ms`);

    return ids;
  }

  /**
   * Analyze stored patterns for learning
   *
   * @returns Pattern analysis
   */
  analyzeStoredPatterns() {
    const numbers = Array.from(this.records.keys());
    return analyzeZeckendorfPatterns(numbers);
  }

  /**
   * Create vector embedding for decomposition
   * Encodes structural properties for similarity search
   *
   * @param decomposition - Zeckendorf representation
   * @returns Embedding vector
   */
  private createEmbedding(decomposition: ZeckendorfRepresentation): number[] {
    const embedding: number[] = [];

    // Encode summand count (normalized)
    embedding.push(decomposition.summandCount / 10);

    // Encode Lucas count (normalized)
    embedding.push(decomposition.lucasSummandCount / 10);

    // Encode index distribution (first 10 possible indices)
    for (let i = 1; i <= 10; i++) {
      embedding.push(decomposition.indices.has(i) ? 1 : 0);
    }

    // Encode relative sizes of Fibonacci values
    const maxValue = Math.max(...decomposition.values);
    for (let i = 0; i < 5; i++) {
      if (i < decomposition.values.length) {
        embedding.push(decomposition.values[i] / maxValue);
      } else {
        embedding.push(0);
      }
    }

    // Encode number magnitude (log scale)
    embedding.push(Math.log10(decomposition.n + 1) / 5);

    return embedding;
  }

  /**
   * Calculate cosine similarity between two vectors
   *
   * @param a - First vector
   * @param b - Second vector
   * @returns Similarity score (0-1)
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (normA * normB);
  }

  /**
   * Export database to JSON for persistence
   *
   * @returns JSON string of database state
   */
  export(): string {
    const data = {
      records: Array.from(this.records.entries()),
      embeddings: Array.from(this.vectorEmbeddings.entries()),
      metadata: {
        exportDate: new Date().toISOString(),
        recordCount: this.records.size
      }
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import database from JSON
   *
   * @param json - JSON string to import
   */
  import(json: string): void {
    const data = JSON.parse(json);

    this.records = new Map(data.records);
    this.vectorEmbeddings = new Map(data.embeddings);

    console.log(`Imported ${this.records.size} records`);
  }

  /**
   * Get database statistics
   *
   * @returns Statistics object
   */
  getStats() {
    const numbers = Array.from(this.records.keys());
    const analysis = analyzeZeckendorfPatterns(numbers);

    return {
      totalRecords: this.records.size,
      numberRange: {
        min: Math.min(...numbers),
        max: Math.max(...numbers)
      },
      patterns: analysis,
      storageSize: {
        records: this.records.size,
        embeddings: this.vectorEmbeddings.size
      }
    };
  }

  /**
   * Clear all stored data
   */
  clear(): void {
    this.records.clear();
    this.vectorEmbeddings.clear();
  }
}

/**
 * Global singleton instance for convenience
 */
export const zeckendorfDB = new ZeckendorfDatabase();

/**
 * Quick store helper function
 *
 * @param n - Number to decompose and store
 * @returns Record ID
 */
export function storeDecomposition(n: number): string {
  const decomposition = zeckendorfDecompose(n);
  return zeckendorfDB.store(decomposition);
}

/**
 * Quick retrieve helper function
 *
 * @param n - Number to retrieve
 * @returns Zeckendorf record or undefined
 */
export function retrieveDecomposition(n: number): ZeckendorfRecord | undefined {
  return zeckendorfDB.retrieve(n);
}

/**
 * Populate database with range of numbers for learning
 *
 * @param start - Start of range
 * @param end - End of range
 * @returns Number of records stored
 */
export function populateDatabase(start: number, end: number): number {
  const numbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const ids = zeckendorfDB.batchStore(numbers);
  return ids.length;
}

export default {
  ZeckendorfDatabase,
  zeckendorfDB,
  storeDecomposition,
  retrieveDecomposition,
  populateDatabase
};

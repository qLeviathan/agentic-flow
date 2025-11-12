/**
 * AgentDB Integration for Phase Space Pattern Storage
 * Stores phase space trajectories, Nash points, and patterns for recognition
 */

import {
  PhaseSpacePattern,
  TrajectoryPoint,
  NashPoint,
  PhaseSpaceCoordinates,
  PhaseSpaceAnalysis
} from './types';

/**
 * AgentDB configuration interface
 */
interface AgentDBConfig {
  dbPath: string;
  collectionName: string;
  embeddingDimension: number;
  distanceMetric: 'cosine' | 'euclidean' | 'manhattan';
}

/**
 * Pattern vector representation for AgentDB
 */
interface PatternVector {
  id: string;
  vector: number[];
  metadata: Record<string, any>;
}

/**
 * Phase Space Storage Manager
 */
export class PhaseSpaceStorage {
  private config: AgentDBConfig;
  private db: any = null; // AgentDB instance
  private initialized: boolean = false;

  constructor(config: Partial<AgentDBConfig> = {}) {
    this.config = {
      dbPath: config.dbPath || './data/phase-space.agentdb',
      collectionName: config.collectionName || 'phase_patterns',
      embeddingDimension: config.embeddingDimension || 128,
      distanceMetric: config.distanceMetric || 'cosine'
    };
  }

  /**
   * Initialize AgentDB connection
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Dynamic import of AgentDB (assuming it's available)
      const AgentDB = await import('agentdb').catch(() => null);

      if (!AgentDB) {
        console.warn('AgentDB not found. Using mock storage.');
        this.db = new MockStorage();
      } else {
        this.db = new AgentDB.Database({
          path: this.config.dbPath,
          dimension: this.config.embeddingDimension,
          metric: this.config.distanceMetric
        });

        await this.db.createCollection(this.config.collectionName);
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize AgentDB:', error);
      this.db = new MockStorage();
      this.initialized = true;
    }
  }

  /**
   * Store a phase space pattern
   */
  async storePattern(pattern: PhaseSpacePattern): Promise<string> {
    await this.initialize();

    const vector = this.encodePattern(pattern);
    const metadata = this.extractMetadata(pattern);

    try {
      await this.db.insert({
        id: pattern.id,
        vector,
        metadata
      });

      return pattern.id;
    } catch (error) {
      console.error('Failed to store pattern:', error);
      throw error;
    }
  }

  /**
   * Retrieve a pattern by ID
   */
  async getPattern(id: string): Promise<PhaseSpacePattern | null> {
    await this.initialize();

    try {
      const result = await this.db.get(id);
      if (!result) return null;

      return this.decodePattern(result);
    } catch (error) {
      console.error('Failed to retrieve pattern:', error);
      return null;
    }
  }

  /**
   * Find similar patterns using vector similarity search
   */
  async findSimilarPatterns(
    pattern: PhaseSpacePattern,
    topK: number = 5
  ): Promise<{ pattern: PhaseSpacePattern; similarity: number }[]> {
    await this.initialize();

    const vector = this.encodePattern(pattern);

    try {
      const results = await this.db.search({
        vector,
        k: topK,
        collection: this.config.collectionName
      });

      return results.map((result: any) => ({
        pattern: this.decodePattern(result),
        similarity: result.score || result.distance
      }));
    } catch (error) {
      console.error('Failed to search patterns:', error);
      return [];
    }
  }

  /**
   * Store Nash point analysis
   */
  async storeNashPoints(
    nashPoints: NashPoint[],
    patternId: string
  ): Promise<void> {
    await this.initialize();

    const data = {
      id: `nash-${patternId}`,
      patternId,
      nashPoints: nashPoints.map(np => ({
        n: np.n,
        phi: np.coordinates.phi,
        psi: np.coordinates.psi,
        theta: np.coordinates.theta,
        stabilityIndex: np.stabilityIndex,
        flow: np.surroundingFlow
      })),
      timestamp: Date.now()
    };

    try {
      await this.db.insertMetadata(data);
    } catch (error) {
      console.error('Failed to store Nash points:', error);
    }
  }

  /**
   * Query patterns by characteristics
   */
  async queryByCharacteristics(criteria: {
    minChaos?: number;
    maxChaos?: number;
    hasPeriodicity?: boolean;
    minConvergence?: number;
    maxConvergence?: number;
  }): Promise<PhaseSpacePattern[]> {
    await this.initialize();

    try {
      const results = await this.db.query({
        collection: this.config.collectionName,
        filter: (pattern: any) => {
          const chars = pattern.metadata.characteristics;

          if (criteria.minChaos !== undefined && chars.chaosIndicator < criteria.minChaos) {
            return false;
          }
          if (criteria.maxChaos !== undefined && chars.chaosIndicator > criteria.maxChaos) {
            return false;
          }
          if (criteria.hasPeriodicity !== undefined &&
              (chars.periodicity !== null) !== criteria.hasPeriodicity) {
            return false;
          }
          if (criteria.minConvergence !== undefined &&
              chars.convergenceRate < criteria.minConvergence) {
            return false;
          }
          if (criteria.maxConvergence !== undefined &&
              chars.convergenceRate > criteria.maxConvergence) {
            return false;
          }

          return true;
        }
      });

      return results.map((r: any) => this.decodePattern(r));
    } catch (error) {
      console.error('Failed to query patterns:', error);
      return [];
    }
  }

  /**
   * Get statistics about stored patterns
   */
  async getStatistics(): Promise<{
    totalPatterns: number;
    avgChaos: number;
    avgConvergence: number;
    periodicPatterns: number;
    nashPointsTotal: number;
  }> {
    await this.initialize();

    try {
      const allPatterns = await this.db.getAll(this.config.collectionName);

      const stats = {
        totalPatterns: allPatterns.length,
        avgChaos: 0,
        avgConvergence: 0,
        periodicPatterns: 0,
        nashPointsTotal: 0
      };

      if (allPatterns.length === 0) return stats;

      let chaosSum = 0;
      let convergenceSum = 0;

      for (const pattern of allPatterns) {
        const chars = pattern.metadata.characteristics;
        chaosSum += chars.chaosIndicator;
        convergenceSum += chars.convergenceRate;
        if (chars.periodicity !== null) {
          stats.periodicPatterns++;
        }
        stats.nashPointsTotal += pattern.metadata.nashPointsCount || 0;
      }

      stats.avgChaos = chaosSum / allPatterns.length;
      stats.avgConvergence = convergenceSum / allPatterns.length;

      return stats;
    } catch (error) {
      console.error('Failed to get statistics:', error);
      return {
        totalPatterns: 0,
        avgChaos: 0,
        avgConvergence: 0,
        periodicPatterns: 0,
        nashPointsTotal: 0
      };
    }
  }

  /**
   * Encode pattern into vector representation
   */
  private encodePattern(pattern: PhaseSpacePattern): number[] {
    const vector: number[] = [];

    // Encode trajectory features
    const phiValues = pattern.trajectory.map(t => t.coordinates.phi);
    const psiValues = pattern.trajectory.map(t => t.coordinates.psi);
    const thetaValues = pattern.trajectory.map(t => t.coordinates.theta);

    // Statistical features
    vector.push(
      this.mean(phiValues),
      this.std(phiValues),
      this.mean(psiValues),
      this.std(psiValues),
      this.mean(thetaValues),
      this.std(thetaValues)
    );

    // Characteristics
    vector.push(
      pattern.characteristics.chaosIndicator,
      pattern.characteristics.lyapunovExponent,
      pattern.characteristics.convergenceRate,
      pattern.characteristics.periodicity || -1
    );

    // Nash points features
    vector.push(
      pattern.nashPoints.length,
      pattern.nashPoints.filter(np => np.surroundingFlow === 'attractive').length,
      pattern.nashPoints.filter(np => np.surroundingFlow === 'repulsive').length
    );

    // Pad or truncate to embedding dimension
    while (vector.length < this.config.embeddingDimension) {
      vector.push(0);
    }

    return vector.slice(0, this.config.embeddingDimension);
  }

  /**
   * Extract metadata from pattern
   */
  private extractMetadata(pattern: PhaseSpacePattern): Record<string, any> {
    return {
      id: pattern.id,
      created: pattern.metadata.created,
      nRange: pattern.metadata.nRange,
      totalPoints: pattern.metadata.totalPoints,
      nashPointsCount: pattern.nashPoints.length,
      characteristics: pattern.characteristics
    };
  }

  /**
   * Decode stored data back to pattern
   */
  private decodePattern(data: any): PhaseSpacePattern {
    return data.metadata as PhaseSpacePattern;
  }

  /**
   * Calculate mean of array
   */
  private mean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private std(values: number[]): number {
    const avg = this.mean(values);
    const squareDiffs = values.map(v => (v - avg) ** 2);
    return Math.sqrt(this.mean(squareDiffs));
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db && this.db.close) {
      await this.db.close();
    }
    this.initialized = false;
  }
}

/**
 * Mock storage for when AgentDB is not available
 */
class MockStorage {
  private data: Map<string, any> = new Map();

  async insert(item: any): Promise<void> {
    this.data.set(item.id, item);
  }

  async get(id: string): Promise<any> {
    return this.data.get(id);
  }

  async search(options: any): Promise<any[]> {
    return Array.from(this.data.values()).slice(0, options.k);
  }

  async getAll(): Promise<any[]> {
    return Array.from(this.data.values());
  }

  async insertMetadata(data: any): Promise<void> {
    this.data.set(data.id, data);
  }

  async query(options: any): Promise<any[]> {
    const all = Array.from(this.data.values());
    if (options.filter) {
      return all.filter(options.filter);
    }
    return all;
  }

  async close(): Promise<void> {
    this.data.clear();
  }
}

/**
 * Utility function to create a storage instance
 */
export function createPhaseSpaceStorage(
  config?: Partial<AgentDBConfig>
): PhaseSpaceStorage {
  return new PhaseSpaceStorage(config);
}

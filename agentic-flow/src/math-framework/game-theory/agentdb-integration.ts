/**
 * AgentDB Integration for Nash Equilibrium Solver
 *
 * Stores and retrieves Nash equilibria in AgentDB with semantic search
 * and memory persistence capabilities.
 */

import { NashEquilibrium, NashMemoryEntry, Game, BKAnalysis } from './types.js';

/**
 * AgentDB Nash Memory Manager
 *
 * Handles storage, retrieval, and querying of Nash equilibria
 * using AgentDB's vector database capabilities.
 */
export class NashMemoryManager {
  private dbPath: string;
  private db: any; // AgentDB instance
  private initialized: boolean = false;

  constructor(dbPath: string = './agentdb.db') {
    this.dbPath = dbPath;
  }

  /**
   * Initialize AgentDB connection and schema
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Import AgentDB dynamically
      const { createDatabase } = await import('agentdb');
      this.db = await createDatabase(this.dbPath);

      // Create Nash equilibrium tables
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS nash_equilibria (
          id TEXT PRIMARY KEY,
          game_id TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          type TEXT NOT NULL, -- 'pure' or 'mixed'
          profile_json TEXT NOT NULL, -- JSON serialized profile
          payoffs_json TEXT NOT NULL, -- JSON serialized payoffs
          verified INTEGER NOT NULL,
          bk_divergence REAL NOT NULL,
          is_strict INTEGER NOT NULL,
          stability REAL NOT NULL,
          metadata_json TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_nash_game_id ON nash_equilibria(game_id);
        CREATE INDEX IF NOT EXISTS idx_nash_timestamp ON nash_equilibria(timestamp);
        CREATE INDEX IF NOT EXISTS idx_nash_bk_divergence ON nash_equilibria(bk_divergence);

        CREATE TABLE IF NOT EXISTS nash_bk_analysis (
          equilibrium_id TEXT PRIMARY KEY,
          score REAL NOT NULL,
          is_equilibrium INTEGER NOT NULL,
          divergence REAL NOT NULL,
          utility_component REAL NOT NULL,
          distance_component REAL NOT NULL,
          penalty_component REAL NOT NULL,
          FOREIGN KEY (equilibrium_id) REFERENCES nash_equilibria(id)
        );

        CREATE TABLE IF NOT EXISTS nash_search_metadata (
          equilibrium_id TEXT PRIMARY KEY,
          algorithm TEXT NOT NULL,
          compute_time REAL NOT NULL,
          space_explored INTEGER NOT NULL,
          FOREIGN KEY (equilibrium_id) REFERENCES nash_equilibria(id)
        );

        CREATE TABLE IF NOT EXISTS game_definitions (
          game_id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          num_players INTEGER NOT NULL,
          definition_json TEXT NOT NULL, -- JSON serialized game
          created_at INTEGER NOT NULL
        );
      `);

      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize NashMemoryManager: ${error}`);
    }
  }

  /**
   * Store Nash equilibrium in AgentDB
   */
  async storeEquilibrium(
    gameId: string,
    equilibrium: NashEquilibrium,
    bkAnalysis: BKAnalysis,
    searchMetadata: {
      algorithm: string;
      computeTime: number;
      spaceExplored: number;
    }
  ): Promise<void> {
    await this.initialize();

    const insertEquilibrium = this.db.prepare(`
      INSERT OR REPLACE INTO nash_equilibria (
        id, game_id, timestamp, type, profile_json, payoffs_json,
        verified, bk_divergence, is_strict, stability, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertEquilibrium.run(
      equilibrium.id,
      gameId,
      equilibrium.timestamp,
      equilibrium.type,
      JSON.stringify(equilibrium.profile),
      JSON.stringify(equilibrium.payoffs),
      equilibrium.verified ? 1 : 0,
      equilibrium.bkDivergence,
      equilibrium.isStrict ? 1 : 0,
      equilibrium.stability,
      JSON.stringify(equilibrium.metadata)
    );

    // Store BK analysis
    const insertBK = this.db.prepare(`
      INSERT OR REPLACE INTO nash_bk_analysis (
        equilibrium_id, score, is_equilibrium, divergence,
        utility_component, distance_component, penalty_component
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertBK.run(
      equilibrium.id,
      bkAnalysis.score,
      bkAnalysis.isEquilibrium ? 1 : 0,
      bkAnalysis.divergence,
      bkAnalysis.components.utilityComponent,
      bkAnalysis.components.distanceComponent,
      bkAnalysis.components.penaltyComponent
    );

    // Store search metadata
    const insertMetadata = this.db.prepare(`
      INSERT OR REPLACE INTO nash_search_metadata (
        equilibrium_id, algorithm, compute_time, space_explored
      ) VALUES (?, ?, ?, ?)
    `);

    insertMetadata.run(
      equilibrium.id,
      searchMetadata.algorithm,
      searchMetadata.computeTime,
      searchMetadata.spaceExplored
    );
  }

  /**
   * Store game definition
   */
  async storeGame(game: Game): Promise<void> {
    await this.initialize();

    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO game_definitions (
        game_id, name, description, num_players, definition_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      game.id,
      game.name,
      game.description || '',
      game.players.length,
      JSON.stringify(game),
      Date.now()
    );
  }

  /**
   * Retrieve equilibrium by ID
   */
  async getEquilibrium(equilibriumId: string): Promise<NashMemoryEntry | null> {
    await this.initialize();

    const row = this.db.prepare(`
      SELECT
        e.*,
        b.score, b.is_equilibrium, b.divergence,
        b.utility_component, b.distance_component, b.penalty_component,
        m.algorithm, m.compute_time, m.space_explored
      FROM nash_equilibria e
      LEFT JOIN nash_bk_analysis b ON e.id = b.equilibrium_id
      LEFT JOIN nash_search_metadata m ON e.id = m.equilibrium_id
      WHERE e.id = ?
    `).get(equilibriumId);

    if (!row) return null;

    return this.rowToMemoryEntry(row);
  }

  /**
   * Find all equilibria for a game
   */
  async findEquilibria(gameId: string): Promise<NashMemoryEntry[]> {
    await this.initialize();

    const rows = this.db.prepare(`
      SELECT
        e.*,
        b.score, b.is_equilibrium, b.divergence,
        b.utility_component, b.distance_component, b.penalty_component,
        m.algorithm, m.compute_time, m.space_explored
      FROM nash_equilibria e
      LEFT JOIN nash_bk_analysis b ON e.id = b.equilibrium_id
      LEFT JOIN nash_search_metadata m ON e.id = m.equilibrium_id
      WHERE e.game_id = ?
      ORDER BY e.timestamp DESC
    `).all(gameId);

    return rows.map(row => this.rowToMemoryEntry(row));
  }

  /**
   * Find equilibria by criteria
   */
  async queryEquilibria(criteria: {
    gameId?: string;
    type?: 'pure' | 'mixed';
    verified?: boolean;
    minStability?: number;
    maxBKDivergence?: number;
    isStrict?: boolean;
    limit?: number;
  }): Promise<NashMemoryEntry[]> {
    await this.initialize();

    let sql = `
      SELECT
        e.*,
        b.score, b.is_equilibrium, b.divergence,
        b.utility_component, b.distance_component, b.penalty_component,
        m.algorithm, m.compute_time, m.space_explored
      FROM nash_equilibria e
      LEFT JOIN nash_bk_analysis b ON e.id = b.equilibrium_id
      LEFT JOIN nash_search_metadata m ON e.id = m.equilibrium_id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (criteria.gameId) {
      sql += ' AND e.game_id = ?';
      params.push(criteria.gameId);
    }

    if (criteria.type) {
      sql += ' AND e.type = ?';
      params.push(criteria.type);
    }

    if (criteria.verified !== undefined) {
      sql += ' AND e.verified = ?';
      params.push(criteria.verified ? 1 : 0);
    }

    if (criteria.minStability !== undefined) {
      sql += ' AND e.stability >= ?';
      params.push(criteria.minStability);
    }

    if (criteria.maxBKDivergence !== undefined) {
      sql += ' AND e.bk_divergence <= ?';
      params.push(criteria.maxBKDivergence);
    }

    if (criteria.isStrict !== undefined) {
      sql += ' AND e.is_strict = ?';
      params.push(criteria.isStrict ? 1 : 0);
    }

    sql += ' ORDER BY e.timestamp DESC';

    if (criteria.limit) {
      sql += ' LIMIT ?';
      params.push(criteria.limit);
    }

    const rows = this.db.prepare(sql).all(...params);
    return rows.map(row => this.rowToMemoryEntry(row));
  }

  /**
   * Get statistics for a game
   */
  async getGameStats(gameId: string): Promise<{
    totalEquilibria: number;
    pureCount: number;
    mixedCount: number;
    avgStability: number;
    avgBKDivergence: number;
    strictCount: number;
  }> {
    await this.initialize();

    const row = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN type = 'pure' THEN 1 ELSE 0 END) as pure_count,
        SUM(CASE WHEN type = 'mixed' THEN 1 ELSE 0 END) as mixed_count,
        AVG(stability) as avg_stability,
        AVG(bk_divergence) as avg_bk_divergence,
        SUM(CASE WHEN is_strict = 1 THEN 1 ELSE 0 END) as strict_count
      FROM nash_equilibria
      WHERE game_id = ?
    `).get(gameId);

    return {
      totalEquilibria: row.total || 0,
      pureCount: row.pure_count || 0,
      mixedCount: row.mixed_count || 0,
      avgStability: row.avg_stability || 0,
      avgBKDivergence: row.avg_bk_divergence || 0,
      strictCount: row.strict_count || 0
    };
  }

  /**
   * Delete equilibria for a game
   */
  async deleteGameEquilibria(gameId: string): Promise<number> {
    await this.initialize();

    const result = this.db.prepare(`
      DELETE FROM nash_equilibria WHERE game_id = ?
    `).run(gameId);

    return result.changes;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.initialized = false;
    }
  }

  // ===== Private Helpers =====

  private rowToMemoryEntry(row: any): NashMemoryEntry {
    return {
      gameId: row.game_id,
      equilibrium: {
        id: row.id,
        timestamp: row.timestamp,
        profile: JSON.parse(row.profile_json),
        type: row.type,
        payoffs: JSON.parse(row.payoffs_json),
        verified: row.verified === 1,
        bkDivergence: row.bk_divergence,
        isStrict: row.is_strict === 1,
        stability: row.stability,
        metadata: row.metadata_json ? JSON.parse(row.metadata_json) : undefined
      },
      bkAnalysis: {
        score: row.score,
        isEquilibrium: row.is_equilibrium === 1,
        divergence: row.divergence,
        components: {
          utilityComponent: row.utility_component,
          distanceComponent: row.distance_component,
          penaltyComponent: row.penalty_component
        }
      },
      searchMetadata: {
        algorithm: row.algorithm,
        computeTime: row.compute_time,
        spaceExplored: row.space_explored
      }
    };
  }
}

/**
 * Convenience function to create and initialize memory manager
 */
export async function createNashMemoryManager(dbPath?: string): Promise<NashMemoryManager> {
  const manager = new NashMemoryManager(dbPath);
  await manager.initialize();
  return manager;
}

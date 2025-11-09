/**
 * ReflexionMemory - Episodic Replay Memory System
 *
 * Implements reflexion-style episodic replay for agent self-improvement.
 * Stores self-critiques and outcomes, retrieves relevant past experiences.
 *
 * Based on: "Reflexion: Language Agents with Verbal Reinforcement Learning"
 * https://arxiv.org/abs/2303.11366
 */

// Database type from db-fallback
type Database = any;
import { EmbeddingService } from './EmbeddingService.js';
import {
  extractSequencesFromText,
  detectSequencePattern,
  validateSequence,
  calculateSequenceSimilarity,
  type OEISSequencePattern
} from '../security/input-validation.js';

export interface Episode {
  id?: number;
  ts?: number;
  sessionId: string;
  task: string;
  input?: string;
  output?: string;
  critique?: string;
  reward: number;
  success: boolean;
  latencyMs?: number;
  tokensUsed?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface EpisodeWithEmbedding extends Episode {
  embedding?: Float32Array;
  similarity?: number;
}

/**
 * Episode with OEIS sequence validation results
 */
export interface EpisodeWithOEIS extends Episode {
  oeisPatterns?: OEISSequencePattern[];
  sequenceValidation?: {
    hasSequences: boolean;
    sequenceCount: number;
    validated: boolean;
    validationErrors?: string[];
  };
}

export interface ReflexionQuery {
  task: string;
  currentState?: string;
  k?: number; // Top-k to retrieve
  minReward?: number;
  onlyFailures?: boolean;
  onlySuccesses?: boolean;
  timeWindowDays?: number;
}

export class ReflexionMemory {
  private db: Database;
  private embedder: EmbeddingService;

  constructor(db: Database, embedder: EmbeddingService) {
    this.db = db;
    this.embedder = embedder;
  }

  /**
   * Store a new episode with its critique and outcome
   */
  async storeEpisode(episode: Episode): Promise<number> {
    const stmt = this.db.prepare(`
      INSERT INTO episodes (
        session_id, task, input, output, critique, reward, success,
        latency_ms, tokens_used, tags, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const tags = episode.tags ? JSON.stringify(episode.tags) : null;
    const metadata = episode.metadata ? JSON.stringify(episode.metadata) : null;

    const result = stmt.run(
      episode.sessionId,
      episode.task,
      episode.input || null,
      episode.output || null,
      episode.critique || null,
      episode.reward,
      episode.success ? 1 : 0,
      episode.latencyMs || null,
      episode.tokensUsed || null,
      tags,
      metadata
    );

    const episodeId = result.lastInsertRowid as number;

    // Generate and store embedding
    const text = this.buildEpisodeText(episode);
    const embedding = await this.embedder.embed(text);

    this.storeEmbedding(episodeId, embedding);

    return episodeId;
  }

  /**
   * Retrieve relevant past episodes for a new task attempt
   */
  async retrieveRelevant(query: ReflexionQuery): Promise<EpisodeWithEmbedding[]> {
    const {
      task,
      currentState = '',
      k = 5,
      minReward,
      onlyFailures = false,
      onlySuccesses = false,
      timeWindowDays
    } = query;

    // Generate query embedding
    const queryText = currentState ? `${task}\n${currentState}` : task;
    const queryEmbedding = await this.embedder.embed(queryText);

    // Build SQL filters
    const filters: string[] = [];
    const params: any[] = [];

    if (minReward !== undefined) {
      filters.push('e.reward >= ?');
      params.push(minReward);
    }

    if (onlyFailures) {
      filters.push('e.success = 0');
    }

    if (onlySuccesses) {
      filters.push('e.success = 1');
    }

    if (timeWindowDays) {
      filters.push('e.ts > strftime("%s", "now") - ?');
      params.push(timeWindowDays * 86400);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    // Retrieve all candidates
    const stmt = this.db.prepare(`
      SELECT
        e.*,
        ee.embedding
      FROM episodes e
      JOIN episode_embeddings ee ON e.id = ee.episode_id
      ${whereClause}
      ORDER BY e.reward DESC
    `);

    const rows = stmt.all(...params) as any[];

    // Calculate similarities
    const episodes: EpisodeWithEmbedding[] = rows.map(row => {
      const embedding = this.deserializeEmbedding(row.embedding);
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);

      return {
        id: row.id,
        ts: row.ts,
        sessionId: row.session_id,
        task: row.task,
        input: row.input,
        output: row.output,
        critique: row.critique,
        reward: row.reward,
        success: row.success === 1,
        latencyMs: row.latency_ms,
        tokensUsed: row.tokens_used,
        tags: row.tags ? JSON.parse(row.tags) : undefined,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
        embedding,
        similarity
      };
    });

    // Sort by similarity and return top-k
    episodes.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    return episodes.slice(0, k);
  }

  /**
   * Get statistics for a task
   */
  getTaskStats(task: string, timeWindowDays?: number): {
    totalAttempts: number;
    successRate: number;
    avgReward: number;
    avgLatency: number;
    improvementTrend: number;
  } {
    const windowFilter = timeWindowDays
      ? `AND ts > strftime('%s', 'now') - ${timeWindowDays * 86400}`
      : '';

    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        AVG(CASE WHEN success = 1 THEN 1.0 ELSE 0.0 END) as success_rate,
        AVG(reward) as avg_reward,
        AVG(latency_ms) as avg_latency
      FROM episodes
      WHERE task = ? ${windowFilter}
    `);

    const stats = stmt.get(task) as any;

    // Calculate improvement trend (recent vs older)
    const trendStmt = this.db.prepare(`
      SELECT
        AVG(CASE
          WHEN ts > strftime('%s', 'now') - ${7 * 86400} THEN reward
        END) as recent_reward,
        AVG(CASE
          WHEN ts <= strftime('%s', 'now') - ${7 * 86400} THEN reward
        END) as older_reward
      FROM episodes
      WHERE task = ? ${windowFilter}
    `);

    const trend = trendStmt.get(task) as any;
    const improvementTrend = trend.recent_reward && trend.older_reward
      ? (trend.recent_reward - trend.older_reward) / trend.older_reward
      : 0;

    return {
      totalAttempts: stats.total || 0,
      successRate: stats.success_rate || 0,
      avgReward: stats.avg_reward || 0,
      avgLatency: stats.avg_latency || 0,
      improvementTrend
    };
  }

  /**
   * Build critique summary from similar failed episodes
   */
  async getCritiqueSummary(query: ReflexionQuery): Promise<string> {
    const failures = await this.retrieveRelevant({
      ...query,
      onlyFailures: true,
      k: 3
    });

    if (failures.length === 0) {
      return 'No prior failures found for this task.';
    }

    const critiques = failures
      .filter(ep => ep.critique)
      .map((ep, i) => `${i + 1}. ${ep.critique} (reward: ${ep.reward.toFixed(2)})`)
      .join('\n');

    return `Prior failures and lessons learned:\n${critiques}`;
  }

  /**
   * Get successful strategies for a task
   */
  async getSuccessStrategies(query: ReflexionQuery): Promise<string> {
    const successes = await this.retrieveRelevant({
      ...query,
      onlySuccesses: true,
      minReward: 0.7,
      k: 3
    });

    if (successes.length === 0) {
      return 'No successful strategies found for this task.';
    }

    const strategies = successes
      .map((ep, i) => {
        const approach = ep.output?.substring(0, 200) || 'No output recorded';
        return `${i + 1}. Approach (reward ${ep.reward.toFixed(2)}): ${approach}...`;
      })
      .join('\n');

    return `Successful strategies:\n${strategies}`;
  }

  /**
   * Prune low-quality episodes based on TTL and quality threshold
   */
  pruneEpisodes(config: {
    minReward?: number;
    maxAgeDays?: number;
    keepMinPerTask?: number;
  }): number {
    const { minReward = 0.3, maxAgeDays = 30, keepMinPerTask = 5 } = config;

    // Keep high-reward episodes and minimum per task
    const stmt = this.db.prepare(`
      DELETE FROM episodes
      WHERE id IN (
        SELECT id FROM (
          SELECT
            id,
            reward,
            ts,
            ROW_NUMBER() OVER (PARTITION BY task ORDER BY reward DESC) as rank
          FROM episodes
          WHERE reward < ?
            AND ts < strftime('%s', 'now') - ?
        ) WHERE rank > ?
      )
    `);

    const result = stmt.run(minReward, maxAgeDays * 86400, keepMinPerTask);
    return result.changes;
  }

  // ========================================================================
  // Private Helper Methods
  // ========================================================================

  private buildEpisodeText(episode: Episode): string {
    const parts = [episode.task];
    if (episode.critique) parts.push(episode.critique);
    if (episode.output) parts.push(episode.output);
    return parts.join('\n');
  }

  private storeEmbedding(episodeId: number, embedding: Float32Array): void {
    const stmt = this.db.prepare(`
      INSERT INTO episode_embeddings (episode_id, embedding)
      VALUES (?, ?)
    `);

    stmt.run(episodeId, this.serializeEmbedding(embedding));
  }

  private serializeEmbedding(embedding: Float32Array): Buffer {
    // Handle empty/null embeddings
    if (!embedding || !embedding.buffer) {
      return Buffer.alloc(0);
    }
    return Buffer.from(embedding.buffer);
  }

  private deserializeEmbedding(buffer: Buffer): Float32Array {
    return new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
  }

  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // ========================================================================
  // OEIS Sequence Validation
  // ========================================================================

  /**
   * Validate episode output for numeric sequences
   * Detects and validates OEIS-compatible sequences in the episode output
   *
   * @param episode - The episode to validate
   * @returns Validation results with detected sequences
   *
   * @example
   * const validation = validateEpisodeSequences(episode);
   * // Returns: { hasSequences: true, patterns: [...], validated: true }
   */
  validateEpisodeSequences(episode: Episode): {
    hasSequences: boolean;
    patterns: OEISSequencePattern[];
    validated: boolean;
    validationErrors: string[];
  } {
    const patterns: OEISSequencePattern[] = [];
    const validationErrors: string[] = [];
    let hasSequences = false;

    // Analyze output for sequences
    if (episode.output) {
      try {
        const sequences = extractSequencesFromText(episode.output, {
          minLength: 3,
          maxLength: 50,
          allowNegative: true
        });

        hasSequences = sequences.length > 0;

        for (const sequence of sequences) {
          try {
            // Validate sequence
            const validatedSeq = validateSequence(sequence, {
              minLength: 3,
              maxLength: 50,
              allowNegative: true,
              allowFloats: false
            });

            // Detect pattern
            const patternInfo = detectSequencePattern(validatedSeq);

            patterns.push({
              sequence: validatedSeq,
              confidence: patternInfo ? patternInfo.confidence : 0.5,
              source: 'episode-output',
              metadata: {
                episodeId: episode.id,
                sessionId: episode.sessionId,
                task: episode.task,
                patternType: patternInfo?.type,
                description: patternInfo?.description,
                reward: episode.reward,
                success: episode.success
              }
            });
          } catch (error) {
            validationErrors.push(`Invalid sequence: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      } catch (error) {
        validationErrors.push(`Sequence extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Also check critique for sequences (might contain expected outputs)
    if (episode.critique) {
      try {
        const critiqueSequences = extractSequencesFromText(episode.critique, {
          minLength: 3,
          maxLength: 30,
          allowNegative: true
        });

        for (const sequence of critiqueSequences) {
          try {
            const validatedSeq = validateSequence(sequence);
            patterns.push({
              sequence: validatedSeq,
              confidence: 0.6,
              source: 'episode-critique',
              metadata: {
                episodeId: episode.id,
                task: episode.task
              }
            });
          } catch (error) {
            // Skip invalid critique sequences
          }
        }
      } catch (error) {
        // Skip critique validation errors
      }
    }

    return {
      hasSequences,
      patterns,
      validated: validationErrors.length === 0,
      validationErrors
    };
  }

  /**
   * Store episode with automatic OEIS sequence validation
   * Extends the standard storeEpisode to include sequence validation
   *
   * @param episode - The episode to store
   * @returns Episode ID and validation results
   *
   * @example
   * const result = await storeEpisodeWithValidation(episode);
   * // Returns: { episodeId: 123, validation: {...} }
   */
  async storeEpisodeWithValidation(episode: Episode): Promise<{
    episodeId: number;
    validation: {
      hasSequences: boolean;
      patterns: OEISSequencePattern[];
      validated: boolean;
    };
  }> {
    // Validate sequences before storing
    const validation = this.validateEpisodeSequences(episode);

    // Add validation results to metadata
    const enhancedMetadata = {
      ...(episode.metadata || {}),
      sequenceValidation: {
        hasSequences: validation.hasSequences,
        sequenceCount: validation.patterns.length,
        validated: validation.validated,
        validationErrors: validation.validationErrors
      },
      oeisPatterns: validation.patterns
    };

    // Store episode with enhanced metadata
    const episodeId = await this.storeEpisode({
      ...episode,
      metadata: enhancedMetadata
    });

    return {
      episodeId,
      validation: {
        hasSequences: validation.hasSequences,
        patterns: validation.patterns,
        validated: validation.validated
      }
    };
  }

  /**
   * Get episodes that match a specific OEIS sequence
   * Useful for finding episodes that generated specific numeric sequences
   *
   * @param targetSequence - The sequence to search for
   * @param options - Search options
   * @returns Episodes with matching sequences
   *
   * @example
   * const episodes = getEpisodesWithOeisMatch([1, 1, 2, 3, 5, 8], {
   *   minSimilarity: 0.8,
   *   onlySuccesses: true
   * });
   */
  getEpisodesWithOeisMatch(
    targetSequence: number[],
    options: {
      minSimilarity?: number;
      minReward?: number;
      onlySuccesses?: boolean;
      timeWindowDays?: number;
      limit?: number;
    } = {}
  ): EpisodeWithOEIS[] {
    const {
      minSimilarity = 0.7,
      minReward = 0.0,
      onlySuccesses = false,
      timeWindowDays,
      limit = 10
    } = options;

    // Validate target sequence
    const validatedSequence = validateSequence(targetSequence, {
      minLength: 3,
      maxLength: 100
    });

    // Build query filters
    const filters: string[] = ['reward >= ?'];
    const params: any[] = [minReward];

    if (onlySuccesses) {
      filters.push('success = 1');
    }

    if (timeWindowDays) {
      filters.push('ts > strftime("%s", "now") - ?');
      params.push(timeWindowDays * 86400);
    }

    // Query episodes with OEIS patterns
    filters.push('metadata IS NOT NULL');
    filters.push('json_extract(metadata, "$.sequenceValidation.hasSequences") = true');

    const whereClause = filters.join(' AND ');

    const stmt = this.db.prepare(`
      SELECT * FROM episodes
      WHERE ${whereClause}
      ORDER BY reward DESC, ts DESC
    `);

    const rows = stmt.all(...params) as any[];
    const matchingEpisodes: (EpisodeWithOEIS & { similarity: number })[] = [];

    for (const row of rows) {
      const episode: Episode = {
        id: row.id,
        ts: row.ts,
        sessionId: row.session_id,
        task: row.task,
        input: row.input,
        output: row.output,
        critique: row.critique,
        reward: row.reward,
        success: row.success === 1,
        latencyMs: row.latency_ms,
        tokensUsed: row.tokens_used,
        tags: row.tags ? JSON.parse(row.tags) : undefined,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined
      };

      const metadata = episode.metadata || {};
      const oeisPatterns = metadata.oeisPatterns || [];

      // Calculate best similarity match
      let bestSimilarity = 0;
      const matchedPatterns: OEISSequencePattern[] = [];

      for (const pattern of oeisPatterns) {
        const similarity = calculateSequenceSimilarity(
          validatedSequence,
          pattern.sequence
        );

        if (similarity >= minSimilarity) {
          matchedPatterns.push(pattern);
          bestSimilarity = Math.max(bestSimilarity, similarity);
        }
      }

      if (matchedPatterns.length > 0) {
        matchingEpisodes.push({
          ...episode,
          oeisPatterns: matchedPatterns,
          sequenceValidation: metadata.sequenceValidation,
          similarity: bestSimilarity
        });
      }
    }

    // Sort by similarity and return top matches
    matchingEpisodes.sort((a, b) => b.similarity - a.similarity);
    return matchingEpisodes.slice(0, limit);
  }

  /**
   * Get statistics about OEIS sequences in episodes
   * Useful for understanding what types of sequences are being generated
   *
   * @param options - Filter options
   * @returns Statistics about sequences in episodes
   *
   * @example
   * const stats = getSequenceStats({ onlySuccesses: true });
   * // Returns: { totalEpisodes: 500, episodesWithSequences: 45, commonPatterns: [...] }
   */
  getSequenceStats(options: {
    onlySuccesses?: boolean;
    minReward?: number;
    timeWindowDays?: number;
  } = {}): {
    totalEpisodes: number;
    episodesWithSequences: number;
    totalSequences: number;
    patternsByType: Record<string, number>;
    averageConfidence: number;
    topSequences: Array<{ sequence: number[]; count: number; avgReward: number }>;
  } {
    const { onlySuccesses = false, minReward = 0.0, timeWindowDays } = options;

    // Build filters
    const filters: string[] = ['reward >= ?'];
    const params: any[] = [minReward];

    if (onlySuccesses) {
      filters.push('success = 1');
    }

    if (timeWindowDays) {
      filters.push('ts > strftime("%s", "now") - ?');
      params.push(timeWindowDays * 86400);
    }

    const whereClause = filters.join(' AND ');

    // Get total episodes
    const totalStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM episodes WHERE ${whereClause}
    `);
    const totalEpisodes = (totalStmt.get(...params) as any).count;

    // Get episodes with sequences
    const seqFilters = [...filters, 'metadata IS NOT NULL', 'json_extract(metadata, "$.sequenceValidation.hasSequences") = true'];
    const seqWhereClause = seqFilters.join(' AND ');

    const seqStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM episodes WHERE ${seqWhereClause}
    `);
    const episodesWithSequences = (seqStmt.get(...params) as any).count;

    // Get all patterns
    const patternsStmt = this.db.prepare(`
      SELECT metadata, reward FROM episodes WHERE ${seqWhereClause}
    `);
    const rows = patternsStmt.all(...params) as any[];

    let totalSequences = 0;
    let totalConfidence = 0;
    const patternsByType: Record<string, number> = {};
    const sequenceMap = new Map<string, { count: number; totalReward: number }>();

    for (const row of rows) {
      const metadata = JSON.parse(row.metadata);
      const patterns = metadata.oeisPatterns || [];

      for (const pattern of patterns) {
        totalSequences++;
        totalConfidence += pattern.confidence || 0.5;

        // Count by type
        const patternType = pattern.metadata?.patternType || 'unknown';
        patternsByType[patternType] = (patternsByType[patternType] || 0) + 1;

        // Track sequence frequency and reward
        const seqKey = JSON.stringify(pattern.sequence);
        const existing = sequenceMap.get(seqKey) || { count: 0, totalReward: 0 };
        sequenceMap.set(seqKey, {
          count: existing.count + 1,
          totalReward: existing.totalReward + row.reward
        });
      }
    }

    // Get top sequences
    const topSequences = Array.from(sequenceMap.entries())
      .map(([seqKey, data]) => ({
        sequence: JSON.parse(seqKey),
        count: data.count,
        avgReward: data.totalReward / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalEpisodes,
      episodesWithSequences,
      totalSequences,
      patternsByType,
      averageConfidence: totalSequences > 0 ? totalConfidence / totalSequences : 0,
      topSequences
    };
  }

  /**
   * Batch validate sequences for existing episodes
   * Useful for retroactively adding sequence validation to historical episodes
   *
   * @param options - Processing options
   * @returns Statistics about validation results
   *
   * @example
   * const stats = await batchValidateSequences({ batchSize: 100 });
   * // Returns: { processed: 100, validated: 87, sequencesFound: 23 }
   */
  async batchValidateSequences(options: {
    batchSize?: number;
    minReward?: number;
    onlySuccesses?: boolean;
  } = {}): Promise<{
    processed: number;
    validated: number;
    sequencesFound: number;
    errors: number;
  }> {
    const { batchSize = 100, minReward = 0.5, onlySuccesses = true } = options;

    // Build filters
    const filters: string[] = ['reward >= ?'];
    const params: any[] = [minReward];

    if (onlySuccesses) {
      filters.push('success = 1');
    }

    // Only process episodes without validation
    filters.push('(metadata IS NULL OR json_extract(metadata, "$.sequenceValidation") IS NULL)');

    const whereClause = filters.join(' AND ');

    const stmt = this.db.prepare(`
      SELECT * FROM episodes
      WHERE ${whereClause}
      ORDER BY reward DESC, ts DESC
      LIMIT ?
    `);

    const rows = stmt.all(...params, batchSize) as any[];

    let processed = 0;
    let validated = 0;
    let sequencesFound = 0;
    let errors = 0;

    for (const row of rows) {
      processed++;

      try {
        const episode: Episode = {
          id: row.id,
          ts: row.ts,
          sessionId: row.session_id,
          task: row.task,
          input: row.input,
          output: row.output,
          critique: row.critique,
          reward: row.reward,
          success: row.success === 1,
          latencyMs: row.latency_ms,
          tokensUsed: row.tokens_used,
          tags: row.tags ? JSON.parse(row.tags) : undefined,
          metadata: row.metadata ? JSON.parse(row.metadata) : undefined
        };

        // Validate sequences
        const validation = this.validateEpisodeSequences(episode);

        if (validation.validated) {
          validated++;
          sequencesFound += validation.patterns.length;

          // Update episode metadata
          const enhancedMetadata = {
            ...(episode.metadata || {}),
            sequenceValidation: {
              hasSequences: validation.hasSequences,
              sequenceCount: validation.patterns.length,
              validated: validation.validated,
              validationErrors: validation.validationErrors
            },
            oeisPatterns: validation.patterns,
            batchValidated: true,
            validatedAt: Date.now()
          };

          const updateStmt = this.db.prepare(`
            UPDATE episodes SET metadata = ? WHERE id = ?
          `);
          updateStmt.run(JSON.stringify(enhancedMetadata), episode.id);
        }
      } catch (error) {
        errors++;
        console.warn(`Failed to validate episode ${row.id}:`, error);
      }
    }

    return {
      processed,
      validated,
      sequencesFound,
      errors
    };
  }
}

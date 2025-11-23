/**
 * AgentDB Music Database - Vector storage for music patterns and learning
 * Manages embeddings for genres, moods, patterns, and user preferences
 */

const { AgentDB } = require('@antiwork/agentdb');
const path = require('path');

class MusicAgentDB {
  constructor(config = {}) {
    this.dbPath = config.dbPath || path.join(__dirname, '../../data/music-agentdb');
    this.db = null;
    this.collections = {
      patterns: 'music_patterns',
      preferences: 'user_preferences',
      beats: 'beat_templates',
      melodies: 'melody_progressions',
      progress: 'learning_progress'
    };
    this.embeddingDimension = config.embeddingDimension || 384;
  }

  /**
   * Initialize AgentDB with music-specific collections
   */
  async initialize() {
    try {
      this.db = new AgentDB({
        path: this.dbPath,
        dimension: this.embeddingDimension,
        quantization: 'binary', // 32x memory reduction for large pattern libraries
        index: 'hnsw' // 150x faster similarity search
      });

      await this.db.connect();

      // Create collections for each agent domain
      await this.createCollections();

      console.log('✅ MusicAgentDB initialized successfully');
      return this.db;
    } catch (error) {
      console.error('❌ Failed to initialize MusicAgentDB:', error);
      throw error;
    }
  }

  /**
   * Create specialized collections for music data
   */
  async createCollections() {
    const collections = [
      {
        name: this.collections.patterns,
        schema: {
          id: 'string',
          genre: 'string',
          mood: 'string',
          tempo: 'number',
          key: 'string',
          timeSignature: 'string',
          complexity: 'number',
          tags: 'array',
          embedding: 'vector'
        }
      },
      {
        name: this.collections.preferences,
        schema: {
          userId: 'string',
          patternId: 'string',
          rating: 'number',
          timestamp: 'number',
          context: 'object',
          embedding: 'vector'
        }
      },
      {
        name: this.collections.beats,
        schema: {
          id: 'string',
          name: 'string',
          pattern: 'array',
          style: 'string',
          complexity: 'number',
          successRate: 'number',
          embedding: 'vector'
        }
      },
      {
        name: this.collections.melodies,
        schema: {
          id: 'string',
          notes: 'array',
          scale: 'string',
          key: 'string',
          progression: 'array',
          harmonicFunction: 'string',
          embedding: 'vector'
        }
      },
      {
        name: this.collections.progress,
        schema: {
          userId: 'string',
          skill: 'string',
          level: 'number',
          accuracy: 'number',
          completedLessons: 'array',
          strengths: 'array',
          weaknesses: 'array',
          embedding: 'vector'
        }
      }
    ];

    for (const collection of collections) {
      try {
        await this.db.createCollection(collection.name, collection.schema);
        console.log(`✅ Created collection: ${collection.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️  Collection ${collection.name} already exists`);
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Generate embedding for music concept using semantic encoding
   */
  async generateEmbedding(concept) {
    // Using transformer-based embedding generation
    // In production, integrate with OpenAI, Cohere, or local model
    const { embed } = require('@antiwork/agentdb/embeddings');

    const text = typeof concept === 'string'
      ? concept
      : JSON.stringify(concept);

    return await embed(text, { dimension: this.embeddingDimension });
  }

  /**
   * Store music pattern with vector embedding
   */
  async storePattern(pattern) {
    const embedding = await this.generateEmbedding({
      genre: pattern.genre,
      mood: pattern.mood,
      complexity: pattern.complexity,
      tags: pattern.tags
    });

    return await this.db.insert(this.collections.patterns, {
      ...pattern,
      embedding
    });
  }

  /**
   * Find similar patterns using vector similarity search
   */
  async findSimilarPatterns(query, limit = 10) {
    const queryEmbedding = await this.generateEmbedding(query);

    const results = await this.db.search(this.collections.patterns, {
      vector: queryEmbedding,
      limit,
      metric: 'cosine'
    });

    return results.map(r => ({
      ...r.data,
      similarity: r.score
    }));
  }

  /**
   * Store user preference for learning
   */
  async storeUserPreference(userId, patternId, rating, context = {}) {
    const pattern = await this.db.get(this.collections.patterns, patternId);

    const embedding = await this.generateEmbedding({
      pattern: pattern.data,
      rating,
      context
    });

    return await this.db.insert(this.collections.preferences, {
      userId,
      patternId,
      rating,
      timestamp: Date.now(),
      context,
      embedding
    });
  }

  /**
   * Get personalized recommendations based on user history
   */
  async getRecommendations(userId, limit = 5) {
    // Get user's preferences
    const preferences = await this.db.query(this.collections.preferences, {
      userId,
      rating: { $gte: 4 } // Only highly rated
    });

    if (preferences.length === 0) {
      // Cold start - return popular patterns
      return await this.getPopularPatterns(limit);
    }

    // Average embeddings of liked patterns
    const avgEmbedding = this.averageEmbeddings(
      preferences.map(p => p.embedding)
    );

    // Find similar patterns
    const similar = await this.db.search(this.collections.patterns, {
      vector: avgEmbedding,
      limit: limit * 2 // Get more for filtering
    });

    // Filter out already used patterns
    const usedPatternIds = new Set(preferences.map(p => p.patternId));
    return similar
      .filter(s => !usedPatternIds.has(s.id))
      .slice(0, limit)
      .map(r => ({
        ...r.data,
        relevanceScore: r.score
      }));
  }

  /**
   * Average multiple embeddings for collaborative filtering
   */
  averageEmbeddings(embeddings) {
    if (embeddings.length === 0) return null;

    const dimension = embeddings[0].length;
    const avg = new Array(dimension).fill(0);

    for (const emb of embeddings) {
      for (let i = 0; i < dimension; i++) {
        avg[i] += emb[i];
      }
    }

    for (let i = 0; i < dimension; i++) {
      avg[i] /= embeddings.length;
    }

    return avg;
  }

  /**
   * Get popular patterns (fallback for cold start)
   */
  async getPopularPatterns(limit = 5) {
    // Query patterns with high success rates or ratings
    return await this.db.query(this.collections.patterns, {
      limit,
      sort: { complexity: 1 } // Start with simpler patterns
    });
  }

  /**
   * Store beat template with success metrics
   */
  async storeBeat(beat) {
    const embedding = await this.generateEmbedding({
      style: beat.style,
      pattern: beat.pattern,
      complexity: beat.complexity
    });

    return await this.db.insert(this.collections.beats, {
      ...beat,
      successRate: beat.successRate || 0,
      embedding
    });
  }

  /**
   * Find complementary beats
   */
  async findComplementaryBeats(currentBeat, limit = 5) {
    const queryEmbedding = await this.generateEmbedding(currentBeat);

    return await this.db.search(this.collections.beats, {
      vector: queryEmbedding,
      limit,
      metric: 'cosine',
      filter: {
        complexity: { $lte: currentBeat.complexity + 1 }
      }
    });
  }

  /**
   * Store melody progression
   */
  async storeMelody(melody) {
    const embedding = await this.generateEmbedding({
      scale: melody.scale,
      key: melody.key,
      progression: melody.progression,
      harmonicFunction: melody.harmonicFunction
    });

    return await this.db.insert(this.collections.melodies, {
      ...melody,
      embedding
    });
  }

  /**
   * Find harmonizing melodies
   */
  async findHarmonizingMelodies(melody, limit = 5) {
    const queryEmbedding = await this.generateEmbedding(melody);

    return await this.db.search(this.collections.melodies, {
      vector: queryEmbedding,
      limit,
      metric: 'cosine',
      filter: {
        key: melody.key // Must be in compatible key
      }
    });
  }

  /**
   * Update student progress
   */
  async updateProgress(userId, progressData) {
    const embedding = await this.generateEmbedding({
      skill: progressData.skill,
      level: progressData.level,
      strengths: progressData.strengths,
      weaknesses: progressData.weaknesses
    });

    // Check if progress exists
    const existing = await this.db.query(this.collections.progress, {
      userId,
      skill: progressData.skill
    });

    if (existing.length > 0) {
      return await this.db.update(this.collections.progress, existing[0].id, {
        ...progressData,
        embedding
      });
    }

    return await this.db.insert(this.collections.progress, {
      userId,
      ...progressData,
      embedding
    });
  }

  /**
   * Get student's current progress
   */
  async getProgress(userId) {
    return await this.db.query(this.collections.progress, { userId });
  }

  /**
   * Find similar students for peer learning
   */
  async findSimilarStudents(userId, limit = 5) {
    const progress = await this.getProgress(userId);
    if (progress.length === 0) return [];

    const avgEmbedding = this.averageEmbeddings(
      progress.map(p => p.embedding)
    );

    return await this.db.search(this.collections.progress, {
      vector: avgEmbedding,
      limit: limit + 1 // +1 to exclude self
    }).then(results =>
      results
        .filter(r => r.data.userId !== userId)
        .slice(0, limit)
    );
  }

  /**
   * Close database connection
   */
  async close() {
    if (this.db) {
      await this.db.close();
      console.log('✅ MusicAgentDB connection closed');
    }
  }
}

module.exports = { MusicAgentDB };

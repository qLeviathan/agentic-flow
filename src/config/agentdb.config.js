/**
 * Zordic Music Studio - AgentDB Configuration
 *
 * Database configuration for vector storage, pattern similarity search,
 * and agent learning data.
 */

export const agentDBConfig = {
  // Connection settings
  connection: {
    host: process.env.AGENTDB_HOST || 'localhost',
    port: parseInt(process.env.AGENTDB_PORT || '8001', 10),
    database: 'zordic_music_studio',
    username: process.env.AGENTDB_USER || 'admin',
    password: process.env.AGENTDB_PASSWORD,
    ssl: process.env.NODE_ENV === 'production',

    // Connection pool
    pool: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
    },

    // Retry configuration
    retry: {
      attempts: 3,
      backoff: 'exponential',
      initialDelay: 1000,
      maxDelay: 10000,
    }
  },

  // Collection schemas
  collections: {
    // Beat patterns collection
    beat_patterns: {
      dimension: 768,
      indexType: 'HNSW',
      distanceMetric: 'cosine',

      // HNSW parameters
      hnsw: {
        M: 16,                          // Connections per layer
        efConstruction: 200,            // Build-time quality
        efSearch: 50,                   // Search-time quality
      },

      // Quantization for memory efficiency
      quantization: {
        enabled: true,
        bits: 4,                        // 4-bit quantization (32x reduction)
        scalarType: 'float32',
      },

      // Schema definition
      schema: {
        id: 'string',
        name: 'string',
        created_at: 'timestamp',
        updated_at: 'timestamp',
        user_id: 'string',
        is_public: 'boolean',
        bpm: 'number',
        time_signature: 'string',
        genre: 'string[]',
        complexity: 'number',
        duration_bars: 'number',
        sequence: 'json',
        instruments: 'string[]',
        groove_type: 'string',
        embedding: 'vector<768>',
        tags: 'string[]',
        usage_count: 'number',
        rating: 'number',
      },

      // Indexes for fast filtering
      indexes: [
        { field: 'user_id', type: 'btree' },
        { field: 'genre', type: 'gin' },
        { field: 'bpm', type: 'btree' },
        { field: 'created_at', type: 'btree' },
        { field: 'rating', type: 'btree' },
        { field: 'is_public', type: 'btree' },
      ]
    },

    // Melody patterns collection
    melody_patterns: {
      dimension: 512,
      indexType: 'HNSW',
      distanceMetric: 'cosine',

      hnsw: {
        M: 12,
        efConstruction: 150,
        efSearch: 40,
      },

      quantization: {
        enabled: true,
        bits: 8,                        // 8-bit (8x reduction)
        scalarType: 'float32',
      },

      schema: {
        id: 'string',
        name: 'string',
        created_at: 'timestamp',
        user_id: 'string',
        key: 'string',
        scale: 'string',
        octave_range: 'number[]',
        interval_complexity: 'number',
        notes: 'json',
        duration_bars: 'number',
        contour: 'string',
        motif_type: 'string',
        embedding: 'vector<512>',
        emotion: 'string[]',
        genre: 'string[]',
        usage_count: 'number',
      },

      indexes: [
        { field: 'user_id', type: 'btree' },
        { field: 'key', type: 'btree' },
        { field: 'scale', type: 'btree' },
        { field: 'genre', type: 'gin' },
      ]
    },

    // Harmony patterns collection
    harmony_patterns: {
      dimension: 384,
      indexType: 'HNSW',
      distanceMetric: 'cosine',

      hnsw: {
        M: 12,
        efConstruction: 150,
        efSearch: 40,
      },

      quantization: {
        enabled: true,
        bits: 8,
        scalarType: 'float32',
      },

      schema: {
        id: 'string',
        name: 'string',
        created_at: 'timestamp',
        key: 'string',
        progression: 'string[]',
        chords: 'json',
        cadence_type: 'string',
        tension_curve: 'number[]',
        voice_leading: 'json',
        embedding: 'vector<384>',
        mood: 'string[]',
        complexity: 'number',
      },

      indexes: [
        { field: 'key', type: 'btree' },
        { field: 'cadence_type', type: 'btree' },
      ]
    },

    // User preferences collection
    user_preferences: {
      dimension: 256,
      indexType: 'Flat',               // Exact search for small collection
      distanceMetric: 'cosine',

      quantization: {
        enabled: true,
        bits: 8,
        scalarType: 'float32',
      },

      schema: {
        user_id: 'string',
        last_updated: 'timestamp',
        favorite_genres: 'string[]',
        favorite_bpms: 'number[]',
        preferred_keys: 'string[]',
        created_patterns: 'string[]',
        liked_patterns: 'string[]',
        interaction_weights: 'json',
        skill_level: 'number',
        learning_pace: 'string',
        completed_lessons: 'string[]',
        embedding: 'vector<256>',
      },

      indexes: [
        { field: 'user_id', type: 'btree', unique: true },
        { field: 'skill_level', type: 'btree' },
      ]
    },

    // Visual templates collection
    visual_templates: {
      dimension: 1024,
      indexType: 'HNSW',
      distanceMetric: 'cosine',

      hnsw: {
        M: 16,
        efConstruction: 200,
        efSearch: 50,
      },

      quantization: {
        enabled: false,                 // Full precision for visuals
        bits: null,
        scalarType: 'float32',
      },

      schema: {
        id: 'string',
        name: 'string',
        created_at: 'timestamp',
        effect_type: 'string',
        color_palette: 'string[]',
        animation_style: 'string',
        audio_reactive: 'boolean',
        frequency_range: 'number[]',
        intensity_mapping: 'string',
        keyframes: 'json',
        embedding: 'vector<1024>',
        tags: 'string[]',
        mood: 'string[]',
      },

      indexes: [
        { field: 'effect_type', type: 'btree' },
        { field: 'audio_reactive', type: 'btree' },
      ]
    },

    // Learning traces collection (ReasoningBank)
    learning_traces: {
      dimension: 512,
      indexType: 'IVF',                 // Inverted File for batch queries
      distanceMetric: 'euclidean',      // Better for learning similarity

      ivf: {
        nlist: 100,                     // Number of clusters
        nprobe: 10,                     // Clusters to search
      },

      quantization: {
        enabled: true,
        bits: 8,
        scalarType: 'float32',
      },

      schema: {
        trace_id: 'string',
        agent_type: 'string',
        timestamp: 'timestamp',
        task_description: 'string',
        actions_taken: 'json',
        context_state: 'json',
        success: 'boolean',
        quality_score: 'number',
        user_feedback: 'number',
        reward_signal: 'number',
        predicted_outcome: 'number',
        actual_outcome: 'number',
        embedding: 'vector<512>',
      },

      indexes: [
        { field: 'agent_type', type: 'btree' },
        { field: 'success', type: 'btree' },
        { field: 'timestamp', type: 'btree' },
      ]
    },

    // Collaboration sessions collection
    collaboration_sessions: {
      dimension: 384,
      indexType: 'Flat',
      distanceMetric: 'cosine',

      quantization: {
        enabled: false,
        bits: null,
        scalarType: 'float32',
      },

      schema: {
        session_id: 'string',
        project_id: 'string',
        created_at: 'timestamp',
        expires_at: 'timestamp',
        participants: 'json',
        max_participants: 'number',
        current_state: 'json',
        operation_log: 'json',
        version_vector: 'json',
        conflicts_resolved: 'number',
        embedding: 'vector<384>',
      },

      indexes: [
        { field: 'session_id', type: 'btree', unique: true },
        { field: 'project_id', type: 'btree' },
        { field: 'expires_at', type: 'btree' },
      ]
    },

    // Educational content collection
    educational_content: {
      dimension: 512,
      indexType: 'HNSW',
      distanceMetric: 'cosine',

      hnsw: {
        M: 12,
        efConstruction: 150,
        efSearch: 40,
      },

      quantization: {
        enabled: true,
        bits: 8,
        scalarType: 'float32',
      },

      schema: {
        lesson_id: 'string',
        title: 'string',
        category: 'string',
        description: 'string',
        difficulty_level: 'number',
        prerequisites: 'string[]',
        objectives: 'string[]',
        skills_taught: 'string[]',
        estimated_duration: 'number',
        steps: 'json',
        examples: 'string[]',
        exercises: 'json',
        embedding: 'vector<512>',
        completion_rate: 'number',
        average_rating: 'number',
      },

      indexes: [
        { field: 'category', type: 'btree' },
        { field: 'difficulty_level', type: 'btree' },
      ]
    },

    // Agent memory collection
    agent_memory: {
      dimension: 768,
      indexType: 'HNSW',
      distanceMetric: 'cosine',

      hnsw: {
        M: 16,
        efConstruction: 200,
        efSearch: 50,
      },

      quantization: {
        enabled: true,
        bits: 8,
        scalarType: 'float32',
      },

      schema: {
        memory_id: 'string',
        agent_id: 'string',
        agent_type: 'string',
        user_id: 'string',
        memory_type: 'string',
        content: 'string',
        context: 'json',
        created_at: 'timestamp',
        last_accessed: 'timestamp',
        access_count: 'number',
        importance: 'number',
        related_patterns: 'string[]',
        related_memories: 'string[]',
        embedding: 'vector<768>',
        ttl: 'number',
      },

      indexes: [
        { field: 'agent_id', type: 'btree' },
        { field: 'user_id', type: 'btree' },
        { field: 'memory_type', type: 'btree' },
        { field: 'importance', type: 'btree' },
      ]
    }
  },

  // Performance optimization
  performance: {
    // Caching
    cache: {
      enabled: true,
      provider: 'redis',
      maxSize: '2GB',
      ttl: 3600,                        // 1 hour

      // Cache strategies per collection
      strategies: {
        beat_patterns: 'LRU',           // Least Recently Used
        user_preferences: 'LFU',        // Least Frequently Used
        learning_traces: 'TTL',         // Time-based
      }
    },

    // Batch operations
    batching: {
      enabled: true,
      maxBatchSize: 1000,
      batchTimeout: 100,                // milliseconds
    },

    // Query optimization
    queryOptimization: {
      autoExplain: process.env.NODE_ENV === 'development',
      slowQueryThreshold: 1000,         // Log queries >1s
      maxResultsWithoutPagination: 100,
    }
  },

  // Backup and recovery
  backup: {
    enabled: process.env.NODE_ENV === 'production',
    schedule: '0 2 * * *',              // Daily at 2 AM
    destination: 's3://zordic-backups/agentdb',
    retention: 30,                      // days
    compression: true,
  },

  // Monitoring and logging
  monitoring: {
    enabled: true,

    metrics: {
      collectInterval: 60000,           // 1 minute
      exportTo: 'cloudwatch',

      tracked: [
        'query_latency',
        'insert_throughput',
        'cache_hit_rate',
        'disk_usage',
        'memory_usage',
        'connection_pool_utilization',
      ]
    },

    logging: {
      level: process.env.LOG_LEVEL || 'info',
      slowQueryLog: true,
      errorLog: true,
      queryLog: process.env.NODE_ENV === 'development',
    }
  }
};

// Helper function to get collection config
export const getCollectionConfig = (collectionName) => {
  return agentDBConfig.collections[collectionName];
};

// Helper function to get all collection names
export const getCollectionNames = () => {
  return Object.keys(agentDBConfig.collections);
};

// Environment-specific overrides
export const getAgentDBConfig = (environment = 'development') => {
  const config = { ...agentDBConfig };

  switch (environment) {
    case 'development':
      config.connection.host = 'localhost';
      config.performance.cache.enabled = false;
      config.backup.enabled = false;
      config.monitoring.logging.level = 'debug';
      break;

    case 'staging':
      config.connection.host = process.env.AGENTDB_HOST || 'staging-agentdb';
      config.performance.cache.maxSize = '1GB';
      config.backup.enabled = true;
      config.backup.retention = 7;
      break;

    case 'production':
      config.connection.host = process.env.AGENTDB_HOST || 'prod-agentdb';
      config.connection.ssl = true;
      config.performance.cache.maxSize = '4GB';
      config.backup.enabled = true;
      break;

    default:
      break;
  }

  return config;
};

export default agentDBConfig;

/**
 * Zordic Music Studio - Agent Configuration
 *
 * Defines the fleet of specialized music agents and their coordination settings.
 * Each agent has specific responsibilities and learns from user interactions.
 */

export const agentFleetConfig = {
  // Global settings
  fleetName: 'zordic-music-studio',
  maxConcurrentAgents: 7,
  coordinationProtocol: 'mesh',         // mesh | hierarchical | adaptive
  learningEnabled: true,
  memoryPersistence: true,

  // Individual agent configurations
  agents: {
    // Pattern Learning & Recommendation Agent
    pattern_agent: {
      id: 'pattern-agent-v1',
      type: 'music-pattern',
      enabled: true,

      // Learning configuration
      learning: {
        embeddingDimension: 768,
        learningRate: 0.1,
        batchSize: 32,
        updateFrequency: 'immediate',   // immediate | batched | scheduled
      },

      // Recommendation settings
      recommendations: {
        defaultLimit: 10,
        diversityWeight: 0.3,           // 0-1, higher = more diverse
        popularityWeight: 0.2,
        recencyWeight: 0.1,
        personalPreferenceWeight: 0.5,
      },

      // Performance
      performance: {
        cacheRecommendations: true,
        cacheTTL: 3600,                 // 1 hour
        maxQueryLatency: 500,           // milliseconds
      },

      // AgentDB integration
      database: {
        collections: ['user_preferences', 'beat_patterns', 'melody_patterns'],
        indexType: 'HNSW',
        quantization: '8bit',
      }
    },

    // Beat Generation & Rhythm Agent
    beat_agent: {
      id: 'beat-agent-v1',
      type: 'rhythm-generator',
      enabled: true,

      // Generation parameters
      generation: {
        defaultBpm: 120,
        bpmRange: [60, 200],
        defaultTimeSignature: '4/4',
        supportedTimeSignatures: ['4/4', '3/4', '6/8', '7/8'],
        maxTracks: 8,
        defaultDurationBars: 4,
      },

      // Pattern library
      patterns: {
        preloadCommonGenres: ['hip-hop', 'trap', 'lo-fi', 'house', 'techno'],
        markovChainOrder: 2,
        temperature: 0.7,               // Randomness (0-1)
      },

      // Groove and humanization
      humanization: {
        timingVariance: 0.01,           // ±10ms
        velocityVariance: 0.1,          // ±10%
        applySwing: true,
        swingAmount: 0.15,              // 0-1
      },

      // AgentDB integration
      database: {
        collections: ['beat_patterns', 'learning_traces'],
        indexType: 'HNSW',
        quantization: '4bit',           // Aggressive for large collection
      },

      // Communication
      subscribesTo: ['user.beat_request', 'melody.created'],
      publishesTo: ['beat.created', 'beat.variation_suggested']
    },

    // Melody Composition Agent
    melody_agent: {
      id: 'melody-agent-v1',
      type: 'melody-composer',
      enabled: true,

      // Composition parameters
      composition: {
        defaultOctaveRange: [3, 5],
        defaultScale: 'major',
        supportedScales: ['major', 'minor', 'dorian', 'mixolydian', 'pentatonic'],
        maxInterval: 12,                // Maximum leap in semitones
        preferStepwise: true,
      },

      // Melody generation
      generation: {
        contourTypes: ['arch', 'inverted_arch', 'ascending', 'descending', 'wave'],
        motifLength: 4,                 // bars
        allowRepeats: true,
        applyRhythmicVariation: true,
      },

      // AgentDB integration
      database: {
        collections: ['melody_patterns'],
        indexType: 'HNSW',
        quantization: '8bit',
      },

      // Communication
      subscribesTo: ['beat.created', 'harmony.progression_created'],
      publishesTo: ['melody.created', 'melody.harmonized']
    },

    // Harmony & Chord Progression Agent
    harmony_agent: {
      id: 'harmony-agent-v1',
      type: 'harmony-generator',
      enabled: true,

      // Progression generation
      progressions: {
        defaultKey: 'C',
        supportedKeys: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],  // Major keys
        defaultStyle: 'pop',
        supportedStyles: ['classical', 'jazz', 'pop', 'electronic'],
      },

      // Voice leading
      voiceLeading: {
        enabled: true,
        style: 'smooth',                // smooth | varied
        voiceRange: [48, 72],           // C3 to C5 (MIDI notes)
        maxVoiceLeap: 7,                // semitones
      },

      // Markov chain for progressions
      markov: {
        order: 1,
        loadCommonProgressions: true,
      },

      // AgentDB integration
      database: {
        collections: ['harmony_patterns'],
        indexType: 'HNSW',
        quantization: '8bit',
      },

      // Communication
      subscribesTo: ['beat.created', 'melody.created'],
      publishesTo: ['harmony.progression_created', 'harmony.tension_analysis']
    },

    // Visual Effects & Synchronization Agent
    visual_agent: {
      id: 'visual-agent-v1',
      type: 'visual-sync',
      enabled: true,

      // Rendering configuration
      rendering: {
        targetFPS: 60,
        canvasResolution: 'auto',       // auto | 720p | 1080p | 4k
        useWebGL: true,
        enableAntialiasing: true,
      },

      // Effect types
      effects: {
        waveform: { enabled: true, color: 'rainbow', thickness: 2 },
        spectrum: { enabled: true, bars: 64, style: 'bars' },
        particles: { enabled: true, maxParticles: 500 },
        geometry: { enabled: true, shapes: ['cube', 'sphere', 'torus'] },
      },

      // Audio binding
      audioSync: {
        analysisFFTSize: 2048,
        smoothingTimeConstant: 0.8,
        frequencyBands: {
          bass: [20, 250],
          mids: [250, 4000],
          highs: [4000, 20000],
        },
      },

      // AgentDB integration
      database: {
        collections: ['visual_templates'],
        indexType: 'HNSW',
        quantization: null,             // Full precision for visuals
      },

      // Communication
      subscribesTo: ['beat.created', 'melody.created', 'audio.playback'],
      publishesTo: ['visual.rendered', 'visual.effect_applied']
    },

    // Educational Guidance & Teacher Agent
    teacher_agent: {
      id: 'teacher-agent-v1',
      type: 'educator',
      enabled: true,

      // Curriculum
      curriculum: {
        totalLessons: 50,
        difficultyLevels: 5,
        adaptivePacing: true,
        prerequisiteEnforcement: true,
      },

      // Assessment
      assessment: {
        skillCategories: ['rhythm', 'melody', 'harmony', 'composition', 'technical'],
        assessmentFrequency: 'after_lesson',  // after_lesson | weekly | on_demand
        provideDetailedFeedback: true,
      },

      // Feedback generation
      feedback: {
        toneStyle: 'encouraging',       // encouraging | neutral | challenging
        suggestionLimit: 3,
        includeExamples: true,
      },

      // AgentDB integration
      database: {
        collections: ['educational_content', 'learning_traces'],
        indexType: 'HNSW',
        quantization: '8bit',
      },

      // Communication
      subscribesTo: ['user.lesson_completed', 'user.project_saved'],
      publishesTo: ['teacher.feedback', 'teacher.next_lesson', 'teacher.achievement_unlocked']
    },

    // Collaboration & Multi-User Coordination Agent
    collaboration_agent: {
      id: 'collaboration-agent-v1',
      type: 'multi-user-sync',
      enabled: true,

      // Session management
      sessions: {
        maxParticipants: 4,
        allowPublicSessions: false,
        sessionTimeout: 3600,           // 1 hour
        autoSaveInterval: 30,           // seconds
      },

      // Conflict resolution
      conflictResolution: {
        strategy: 'crdt',               // crdt | ot | lock
        mergePriority: 'timestamp',     // timestamp | user_role
        versionTracking: true,
      },

      // Real-time sync
      realtime: {
        syncInterval: 100,              // milliseconds
        operationBufferSize: 1000,
        compressionEnabled: true,
      },

      // Roles & permissions
      roles: {
        owner: { edit: true, delete: true, invite: true, export: true },
        editor: { edit: true, delete: false, invite: false, export: true },
        viewer: { edit: false, delete: false, invite: false, export: false },
      },

      // AgentDB integration
      database: {
        collections: ['collaboration_sessions'],
        indexType: 'Flat',              // Small, exact search
        quantization: null,
      },

      // Communication
      subscribesTo: ['user.operation', 'session.state_change'],
      publishesTo: ['session.sync', 'session.conflict_resolved', 'session.user_joined']
    }
  },

  // Coordination settings
  coordination: {
    // Message bus configuration
    messageBus: {
      type: 'redis',                    // redis | rabbitmq | kafka
      pubSubChannels: [
        'beat.*',
        'melody.*',
        'harmony.*',
        'visual.*',
        'teacher.*',
        'session.*',
        'user.*'
      ],
      messageQueueing: true,
      messagePersistence: true,
      messageRetention: 86400,          // 24 hours
    },

    // Shared memory
    sharedMemory: {
      enabled: true,
      provider: 'agentdb',              // agentdb | redis
      namespace: 'swarm/zordic',
      ttl: 3600,                        // 1 hour
      syncInterval: 1000,               // 1 second
    },

    // Task orchestration
    taskQueue: {
      enabled: true,
      maxConcurrentTasks: 50,
      taskTimeout: 30000,               // 30 seconds
      retryAttempts: 3,
      retryBackoff: 'exponential',
    },

    // Health monitoring
    monitoring: {
      enabled: true,
      healthCheckInterval: 30000,       // 30 seconds
      autoRestart: true,
      alertOnFailure: true,
      metricsCollection: true,
    }
  },

  // Learning & adaptation
  learning: {
    // ReasoningBank integration
    reasoningBank: {
      enabled: true,
      traceCollection: 'learning_traces',
      memoryDistillation: true,
      patternRecognition: true,
      verdictJudgment: true,
    },

    // Neural training
    neural: {
      enabled: true,
      models: ['decision-transformer', 'q-learning', 'actor-critic'],
      trainingFrequency: 'daily',       // hourly | daily | weekly
      minSamplesForTraining: 100,
    },

    // Pattern library updates
    patternLibrary: {
      autoUpdate: true,
      userContributions: true,
      qualityThreshold: 4.0,            // Minimum rating (0-5)
      moderationRequired: false,
    }
  }
};

// Export individual agent configs for easier access
export const patternAgentConfig = agentFleetConfig.agents.pattern_agent;
export const beatAgentConfig = agentFleetConfig.agents.beat_agent;
export const melodyAgentConfig = agentFleetConfig.agents.melody_agent;
export const harmonyAgentConfig = agentFleetConfig.agents.harmony_agent;
export const visualAgentConfig = agentFleetConfig.agents.visual_agent;
export const teacherAgentConfig = agentFleetConfig.agents.teacher_agent;
export const collaborationAgentConfig = agentFleetConfig.agents.collaboration_agent;

// Environment-specific overrides
export const getAgentConfig = (environment = 'development') => {
  const config = { ...agentFleetConfig };

  switch (environment) {
    case 'development':
      // Development overrides
      config.coordination.monitoring.alertOnFailure = false;
      config.learning.neural.trainingFrequency = 'manual';
      break;

    case 'staging':
      // Staging overrides
      config.maxConcurrentAgents = 5;
      config.learning.neural.minSamplesForTraining = 50;
      break;

    case 'production':
      // Production overrides (use defaults)
      break;

    default:
      break;
  }

  return config;
};

export default agentFleetConfig;

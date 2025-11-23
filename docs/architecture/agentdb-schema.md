# Zordic Music Studio - AgentDB Schema Design

## Overview

This document defines the AgentDB vector database schema for storing and retrieving musical patterns, user preferences, and agent learning data. AgentDB provides 150x faster vector similarity search compared to traditional databases.

---

## Schema Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENTDB COLLECTIONS                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Beat Patterns   │  │ Melody Patterns  │  │ Harmony Patterns │
│  Collection      │  │  Collection      │  │  Collection      │
│                  │  │                  │  │                  │
│  768-dim vectors │  │  512-dim vectors │  │  384-dim vectors │
│  HNSW Index      │  │  HNSW Index      │  │  HNSW Index      │
└──────────────────┘  └──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  User Prefs      │  │ Visual Templates │  │ Learning Traces  │
│  Collection      │  │  Collection      │  │  Collection      │
│                  │  │                  │  │                  │
│  256-dim vectors │  │  1024-dim vectors│  │  512-dim vectors │
│  Flat Index      │  │  HNSW Index      │  │  IVF Index       │
└──────────────────┘  └──────────────────┘  └──────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Collab Sessions  │  │ Educational      │  │ Agent Memory     │
│ Collection       │  │ Content Coll.    │  │ Collection       │
│                  │  │                  │  │                  │
│  384-dim vectors │  │  512-dim vectors │  │  768-dim vectors │
│  Flat Index      │  │  HNSW Index      │  │  HNSW Index      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Collection Schemas

### 1. Beat Patterns Collection

**Purpose**: Store rhythmic patterns and drum sequences for beat recommendations and learning.

```typescript
interface BeatPattern {
  // Metadata
  id: string;                          // UUID v4
  name: string;                        // User-friendly name
  created_at: number;                  // Unix timestamp
  updated_at: number;                  // Unix timestamp
  user_id: string;                     // Creator ID
  is_public: boolean;                  // Shareable flag

  // Musical Properties
  bpm: number;                         // Tempo (60-200)
  time_signature: string;              // "4/4", "3/4", etc.
  genre: string[];                     // ["hip-hop", "trap", "lo-fi"]
  complexity: number;                  // 1-10 scale
  duration_bars: number;               // Pattern length

  // Pattern Data
  sequence: DrumHit[];                 // Array of drum hits
  instruments: string[];               // ["kick", "snare", "hi-hat"]
  groove_type: string;                 // "straight", "swing", "shuffle"

  // Vector Embedding (768 dimensions)
  embedding: number[];                 // Semantic representation

  // Metadata
  tags: string[];                      // ["energetic", "minimal", "808"]
  usage_count: number;                 // Popularity metric
  rating: number;                      // 0-5 stars

  // AgentDB Specific
  quantization?: "4bit" | "8bit";      // Optional compression
  distance_metric: "cosine" | "euclidean" | "dot";
}

interface DrumHit {
  instrument: string;                  // "kick", "snare", etc.
  time: number;                        // Position in beats
  velocity: number;                    // 0-127 (MIDI velocity)
  probability: number;                 // 0-1 (for generative)
}
```

**Indexing Strategy**:
- HNSW (Hierarchical Navigable Small World) index
- M = 16 (connections per layer)
- efConstruction = 200
- efSearch = 50
- Distance: Cosine similarity

**Example Usage**:
```javascript
// Store a beat pattern
await agentDB.collection('beat_patterns').insert({
  name: "Lo-fi Hip Hop Beat #42",
  bpm: 85,
  time_signature: "4/4",
  genre: ["lo-fi", "hip-hop"],
  sequence: [...],
  embedding: [...768 dimensions...],
  tags: ["chill", "jazzy", "vinyl"],
  distance_metric: "cosine"
});

// Find similar beats
const similar = await agentDB.collection('beat_patterns').search({
  vector: userBeatEmbedding,
  limit: 10,
  filter: { bpm: { $gte: 80, $lte: 95 }, genre: "lo-fi" }
});
```

---

### 2. Melody Patterns Collection

**Purpose**: Store melodic sequences for composition assistance and harmony generation.

```typescript
interface MelodyPattern {
  // Metadata
  id: string;
  name: string;
  created_at: number;
  user_id: string;

  // Musical Properties
  key: string;                         // "C", "Am", "F#m"
  scale: string;                       // "major", "minor", "dorian"
  octave_range: [number, number];      // [3, 5]
  interval_complexity: number;         // 1-10

  // Pattern Data
  notes: Note[];                       // Note sequence
  duration_bars: number;
  contour: string;                     // "ascending", "arch", "wave"
  motif_type: string;                  // "question-answer", "sequence"

  // Vector Embedding (512 dimensions)
  embedding: number[];

  // Metadata
  emotion: string[];                   // ["happy", "energetic"]
  genre: string[];
  usage_count: number;

  // AgentDB Specific
  distance_metric: "cosine";
}

interface Note {
  pitch: number;                       // MIDI note number (0-127)
  duration: number;                    // In beats
  velocity: number;                    // 0-127
  start_time: number;                  // Position in beats
}
```

**Indexing Strategy**:
- HNSW index (faster search)
- M = 12
- efConstruction = 150
- Distance: Cosine similarity

---

### 3. Harmony Patterns Collection

**Purpose**: Store chord progressions and harmonic relationships.

```typescript
interface HarmonyPattern {
  // Metadata
  id: string;
  name: string;
  created_at: number;

  // Musical Properties
  key: string;
  progression: string[];               // ["I", "V", "vi", "IV"]
  chords: Chord[];
  cadence_type: string;                // "authentic", "plagal", "deceptive"

  // Pattern Data
  tension_curve: number[];             // Harmonic tension over time
  voice_leading: VoiceLeading[];

  // Vector Embedding (384 dimensions)
  embedding: number[];

  // Metadata
  mood: string[];                      // ["uplifting", "nostalgic"]
  complexity: number;

  distance_metric: "cosine";
}

interface Chord {
  root: string;                        // "C", "F#"
  quality: string;                     // "major", "minor7", "sus4"
  inversion: number;                   // 0, 1, 2
  duration: number;                    // In beats
  voicing: number[];                   // Actual MIDI notes
}
```

---

### 4. User Preferences Collection

**Purpose**: Store user-specific preferences and style embeddings for personalization.

```typescript
interface UserPreferences {
  // Identity
  user_id: string;
  last_updated: number;

  // Musical Preferences
  favorite_genres: string[];
  favorite_bpms: number[];             // Preferred tempo ranges
  preferred_keys: string[];

  // Interaction History
  created_patterns: string[];          // Pattern IDs
  liked_patterns: string[];
  interaction_weights: {
    beat_weight: number;               // 0-1
    melody_weight: number;
    harmony_weight: number;
  };

  // Learning Profile
  skill_level: number;                 // 1-10
  learning_pace: string;               // "slow", "medium", "fast"
  completed_lessons: string[];

  // Vector Embedding (256 dimensions)
  // Represents aggregate musical taste
  embedding: number[];

  // AgentDB Specific
  distance_metric: "cosine";
  quantization: "8bit";                // Reduce memory footprint
}
```

**Indexing Strategy**:
- Flat index (small collection, exact search)
- Distance: Cosine similarity

---

### 5. Visual Templates Collection

**Purpose**: Store visual effect patterns synced with audio.

```typescript
interface VisualTemplate {
  // Metadata
  id: string;
  name: string;
  created_at: number;

  // Visual Properties
  effect_type: string;                 // "particles", "waveform", "spectrum"
  color_palette: string[];             // Hex colors
  animation_style: string;             // "smooth", "pulsing", "reactive"

  // Sync Parameters
  audio_reactive: boolean;
  frequency_range: [number, number];   // Hz
  intensity_mapping: string;           // "amplitude", "frequency", "onset"

  // Pattern Data
  keyframes: Keyframe[];

  // Vector Embedding (1024 dimensions)
  // Combines visual aesthetics + audio sync
  embedding: number[];

  // Metadata
  tags: string[];
  mood: string[];

  distance_metric: "cosine";
}

interface Keyframe {
  time: number;                        // Normalized 0-1
  properties: {
    scale?: number;
    rotation?: number;
    opacity?: number;
    color?: string;
  };
}
```

---

### 6. Learning Traces Collection

**Purpose**: Store agent learning trajectories for ReasoningBank adaptive learning.

```typescript
interface LearningTrace {
  // Identity
  trace_id: string;
  agent_type: string;                  // "beat", "melody", "harmony"
  timestamp: number;

  // Trajectory Data
  task_description: string;
  actions_taken: Action[];
  context_state: Record<string, any>;

  // Outcome
  success: boolean;
  quality_score: number;               // 0-1
  user_feedback: number;               // 0-5 stars

  // Learning Data
  reward_signal: number;
  predicted_outcome: number;
  actual_outcome: number;

  // Vector Embedding (512 dimensions)
  // Represents the task-action-outcome pattern
  embedding: number[];

  // AgentDB Specific
  distance_metric: "euclidean";        // Better for learning similarity
}

interface Action {
  type: string;                        // "generate_beat", "adjust_tempo"
  parameters: Record<string, any>;
  timestamp: number;
}
```

**Indexing Strategy**:
- IVF (Inverted File) index for fast approximate search
- nlist = 100 (number of clusters)
- nprobe = 10 (clusters to search)

---

### 7. Collaboration Sessions Collection

**Purpose**: Store real-time collaboration state for multi-user sessions.

```typescript
interface CollaborationSession {
  // Session Identity
  session_id: string;
  project_id: string;
  created_at: number;
  expires_at: number;

  // Participants
  participants: Participant[];
  max_participants: number;            // Default: 4

  // Session State
  current_state: ProjectState;
  operation_log: Operation[];          // CRDT operations

  // Synchronization
  version_vector: Record<string, number>;  // Causal consistency
  conflicts_resolved: number;

  // Vector Embedding (384 dimensions)
  // Represents session activity pattern
  embedding: number[];

  distance_metric: "cosine";
}

interface Participant {
  user_id: string;
  role: "owner" | "editor" | "viewer";
  joined_at: number;
  cursor_position?: { track: number; beat: number };
}

interface Operation {
  op_id: string;
  user_id: string;
  timestamp: number;
  type: string;                        // "insert", "delete", "modify"
  data: any;
}
```

---

### 8. Educational Content Collection

**Purpose**: Store curriculum lessons and tutorial content.

```typescript
interface EducationalContent {
  // Identity
  lesson_id: string;
  title: string;
  category: string;                    // "basics", "rhythm", "melody"

  // Content
  description: string;
  difficulty_level: number;            // 1-10
  prerequisites: string[];             // Lesson IDs

  // Learning Objectives
  objectives: string[];
  skills_taught: string[];
  estimated_duration: number;          // Minutes

  // Content Data
  steps: LessonStep[];
  examples: string[];                  // Pattern IDs
  exercises: Exercise[];

  // Vector Embedding (512 dimensions)
  embedding: number[];

  // Metadata
  completion_rate: number;             // % of users who complete
  average_rating: number;

  distance_metric: "cosine";
}

interface LessonStep {
  order: number;
  instruction: string;
  interactive: boolean;
  validation?: (userInput: any) => boolean;
}

interface Exercise {
  prompt: string;
  solution_pattern_id?: string;
  hints: string[];
}
```

---

### 9. Agent Memory Collection

**Purpose**: Store agent-specific memories for context and personalization.

```typescript
interface AgentMemory {
  // Identity
  memory_id: string;
  agent_id: string;
  agent_type: string;                  // "beat", "melody", etc.
  user_id: string;

  // Memory Content
  memory_type: string;                 // "preference", "correction", "success"
  content: string;
  context: Record<string, any>;

  // Temporal
  created_at: number;
  last_accessed: number;
  access_count: number;
  importance: number;                  // 0-1 (for memory consolidation)

  // Associations
  related_patterns: string[];
  related_memories: string[];

  // Vector Embedding (768 dimensions)
  embedding: number[];

  // AgentDB Specific
  distance_metric: "cosine";
  ttl?: number;                        // Optional expiry (seconds)
}
```

---

## AgentDB Configuration

### Database Initialization

```javascript
const { AgentDB } = require('agentdb');

const db = new AgentDB({
  host: process.env.AGENTDB_HOST || 'localhost',
  port: process.env.AGENTDB_PORT || 8001,
  database: 'zordic_music_studio',

  // Performance Optimization
  quantization: {
    enabled: true,
    default_bits: 8,                   // 8-bit quantization (8x memory reduction)
    collections: {
      'beat_patterns': 4,              // 4-bit for large collections (32x reduction)
      'user_preferences': 8
    }
  },

  // HNSW Parameters
  hnsw: {
    M: 16,                             // Connections per layer
    efConstruction: 200,               // Construction time quality
    efSearch: 50                       // Search time quality
  },

  // Caching
  cache: {
    enabled: true,
    maxSize: '2GB',
    ttl: 3600                          // 1 hour
  },

  // Connection Pool
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000
  }
});
```

### Collection Creation

```javascript
// Create Beat Patterns collection
await db.createCollection('beat_patterns', {
  dimension: 768,
  indexType: 'HNSW',
  distanceMetric: 'cosine',
  quantization: '4bit',
  schema: {
    id: 'string',
    name: 'string',
    bpm: 'number',
    genre: 'string[]',
    embedding: 'vector<768>',
    created_at: 'timestamp'
  },
  indexes: [
    { field: 'user_id', type: 'btree' },
    { field: 'genre', type: 'gin' },
    { field: 'bpm', type: 'btree' },
    { field: 'created_at', type: 'btree' }
  ]
});

// Create with auto-optimization
await db.createCollection('melody_patterns', {
  dimension: 512,
  indexType: 'auto',                   // Auto-select best index
  autoOptimize: true,                  // Enable auto-tuning
  schema: { /* ... */ }
});
```

---

## Vector Embedding Generation

### Beat Pattern Embeddings

```javascript
class BeatEmbedder {
  constructor(model = 'music-pattern-v1') {
    this.model = model;
    this.dimension = 768;
  }

  async embed(beatPattern) {
    // Extract features
    const features = {
      rhythmicDensity: this.calculateDensity(beatPattern),
      syncopation: this.calculateSyncopation(beatPattern),
      timbreDistribution: this.getTimbreDistribution(beatPattern),
      grooveSignature: this.extractGroove(beatPattern),
      spectralCentroid: this.calculateSpectralFeatures(beatPattern)
    };

    // Generate embedding (simplified)
    // In production, use a trained neural network
    const embedding = await this.neuralEncode(features);

    return embedding; // 768-dimensional vector
  }

  calculateDensity(pattern) {
    const totalHits = pattern.sequence.length;
    const maxPossibleHits = pattern.duration_bars * 16; // 16th notes
    return totalHits / maxPossibleHits;
  }

  calculateSyncopation(pattern) {
    // Measure off-beat emphasis
    let syncopationScore = 0;
    pattern.sequence.forEach(hit => {
      const beatPosition = hit.time % 1;
      if (beatPosition === 0.5 || beatPosition === 0.75) {
        syncopationScore += hit.velocity / 127;
      }
    });
    return syncopationScore;
  }

  // ... more feature extraction methods
}
```

### Melody Pattern Embeddings

```javascript
class MelodyEmbedder {
  constructor() {
    this.dimension = 512;
  }

  async embed(melodyPattern) {
    const features = {
      intervalPattern: this.extractIntervals(melodyPattern),
      contour: this.analyzeContour(melodyPattern),
      rhythmicPattern: this.extractRhythm(melodyPattern),
      harmonicContent: this.analyzeHarmonics(melodyPattern),
      tessitura: this.calculateTessitura(melodyPattern)
    };

    return await this.neuralEncode(features);
  }

  extractIntervals(pattern) {
    const intervals = [];
    for (let i = 1; i < pattern.notes.length; i++) {
      intervals.push(pattern.notes[i].pitch - pattern.notes[i-1].pitch);
    }
    return intervals;
  }

  analyzeContour(pattern) {
    // Direction changes, peak points, overall shape
    const pitches = pattern.notes.map(n => n.pitch);
    const contour = {
      peaks: this.findPeaks(pitches),
      valleys: this.findValleys(pitches),
      overallDirection: this.getOverallDirection(pitches)
    };
    return contour;
  }

  // ... more methods
}
```

---

## Query Patterns

### 1. Find Similar Beats

```javascript
// User creates a beat, find similar ones
const userBeat = { /* ... */ };
const embedding = await beatEmbedder.embed(userBeat);

const similar = await db.collection('beat_patterns').search({
  vector: embedding,
  limit: 10,
  filter: {
    bpm: { $gte: userBeat.bpm - 10, $lte: userBeat.bpm + 10 },
    genre: { $in: userBeat.genre }
  },
  includeDistance: true
});

// Results sorted by similarity
similar.forEach(result => {
  console.log(`${result.name}: ${result.distance} similarity`);
});
```

### 2. Personalized Recommendations

```javascript
// Get user preferences embedding
const userPrefs = await db.collection('user_preferences')
  .findOne({ user_id: userId });

// Find patterns matching user taste
const recommendations = await db.collection('beat_patterns').search({
  vector: userPrefs.embedding,
  limit: 20,
  filter: {
    is_public: true,
    user_id: { $ne: userId }  // Exclude user's own patterns
  }
});
```

### 3. Pattern Completion

```javascript
// User has partial melody, find completions
const partialMelody = { /* first 4 bars */ };
const embedding = await melodyEmbedder.embed(partialMelody);

const completions = await db.collection('melody_patterns').search({
  vector: embedding,
  limit: 5,
  filter: {
    key: partialMelody.key,
    duration_bars: { $gte: 8 }  // At least 8 bars total
  }
});
```

### 4. Learning from History

```javascript
// Find successful patterns from agent learning
const successfulTraces = await db.collection('learning_traces').search({
  vector: currentTaskEmbedding,
  limit: 10,
  filter: {
    agent_type: 'beat',
    success: true,
    quality_score: { $gte: 0.8 }
  }
});

// Apply learned strategies
const bestStrategy = successfulTraces[0];
await agent.applyStrategy(bestStrategy.actions_taken);
```

### 5. Hybrid Search (Vector + Full-Text)

```javascript
// Combine semantic search with metadata filtering
const results = await db.collection('beat_patterns').hybridSearch({
  // Vector similarity
  vector: queryEmbedding,
  vectorWeight: 0.7,

  // Text search
  text: "lo-fi chill beats",
  textFields: ['name', 'tags'],
  textWeight: 0.3,

  // Filters
  filter: {
    bpm: { $gte: 70, $lte: 90 },
    rating: { $gte: 4.0 }
  },

  limit: 15
});
```

---

## Performance Optimization

### Quantization Strategy

```javascript
// Collection-specific quantization
const quantizationConfig = {
  // High-traffic, large collections: aggressive quantization
  'beat_patterns': {
    bits: 4,                           // 32x memory reduction
    expectedQueries: 1000000           // Per day
  },

  // Medium traffic: moderate quantization
  'melody_patterns': {
    bits: 8,                           // 8x memory reduction
    expectedQueries: 500000
  },

  // Low traffic, small collections: no quantization
  'user_preferences': {
    bits: null,                        // Full precision
    expectedQueries: 50000
  }
};
```

### Indexing Strategy

```javascript
// HNSW for large collections with frequent searches
await db.collection('beat_patterns').createIndex({
  type: 'HNSW',
  M: 16,                               // 16 connections per layer
  efConstruction: 200,                 // Build quality
  efSearch: 50                         // Search quality
});

// IVF for moderate collections with batch queries
await db.collection('learning_traces').createIndex({
  type: 'IVF',
  nlist: 100,                          // Number of clusters
  nprobe: 10                           // Clusters to search
});

// Flat for small collections requiring exact search
await db.collection('user_preferences').createIndex({
  type: 'Flat'                         // Brute-force exact search
});
```

### Caching Strategy

```javascript
// Cache frequently accessed patterns
const cacheConfig = {
  hotPatterns: {
    maxSize: '1GB',
    ttl: 3600,                         // 1 hour
    evictionPolicy: 'LRU'
  },

  userPreferences: {
    maxSize: '256MB',
    ttl: 1800,                         // 30 minutes
    evictionPolicy: 'LFU'
  }
};
```

---

## Data Migration

```javascript
// Migration script for schema updates
async function migrateV1toV2() {
  const oldCollection = db.collection('patterns_v1');
  const newCollection = db.collection('beat_patterns_v2');

  // Batch processing
  const batchSize = 1000;
  let offset = 0;

  while (true) {
    const batch = await oldCollection.find({
      limit: batchSize,
      offset: offset
    });

    if (batch.length === 0) break;

    // Transform and re-embed
    const transformed = await Promise.all(
      batch.map(async (doc) => ({
        ...doc,
        embedding: await beatEmbedder.embed(doc),
        schema_version: 2
      }))
    );

    // Bulk insert
    await newCollection.insertMany(transformed);

    offset += batchSize;
  }
}
```

---

## Monitoring & Analytics

```javascript
// Collection statistics
const stats = await db.collection('beat_patterns').stats();
console.log({
  documentCount: stats.count,
  avgVectorSize: stats.avgEmbeddingSize,
  indexSize: stats.indexSize,
  diskUsage: stats.diskUsage,
  queryLatency: {
    p50: stats.latency.p50,
    p95: stats.latency.p95,
    p99: stats.latency.p99
  }
});

// Query performance monitoring
await db.collection('beat_patterns').search({
  vector: embedding,
  limit: 10,
  explain: true                        // Get query execution plan
});
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-21
**Database Team**

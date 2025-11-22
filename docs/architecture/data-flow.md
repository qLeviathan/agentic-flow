# Zordic Music Studio - Data Flow & Communication Protocols

## Overview

This document describes how data flows through the Zordic Music Studio system, including agent communication, real-time collaboration, pattern learning, and visual-audio synchronization.

---

## High-Level Data Flow

```
┌─────────────┐
│   User      │
│  Interface  │
└──────┬──────┘
       │
       │ User Actions (clicks, drags, MIDI input)
       ▼
┌─────────────────────────────────────────────────────┐
│           Frontend State Manager                    │
│           (Zustand/Redux)                           │
└──────┬──────────────────────────────────┬───────────┘
       │                                  │
       │ API Calls                       │ WebSocket Events
       ▼                                  ▼
┌─────────────────┐              ┌─────────────────────┐
│   API Gateway   │              │  WebSocket Server   │
│   (REST)        │              │  (Socket.io)        │
└────────┬────────┘              └──────────┬──────────┘
         │                                  │
         │ Commands                         │ Real-time Events
         ▼                                  ▼
┌──────────────────────────────────────────────────────┐
│           Agent Orchestration Engine                 │
│           (Event Bus + Task Queue)                   │
└──────────────────────┬───────────────────────────────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
┌────────────┐  ┌────────────┐  ┌────────────┐
│   Beat     │  │  Melody    │  │  Harmony   │
│   Agent    │  │  Agent     │  │  Agent     │
└─────┬──────┘  └─────┬──────┘  └─────┬──────┘
      │               │               │
      └───────────────┼───────────────┘
                      │
                      │ Vector Operations
                      ▼
┌──────────────────────────────────────────────────────┐
│              AgentDB Vector Database                 │
│  - Pattern Storage    - Similarity Search            │
│  - Learning Traces    - Recommendations              │
└──────────────────────────────────────────────────────┘
```

---

## 1. Agent Communication via AgentDB

### Message Passing Architecture

Agents communicate through a combination of:
1. **Shared Memory** (AgentDB Memory Collection)
2. **Event Bus** (Redis Pub/Sub)
3. **Direct Vector Search** (Pattern similarity)

```
┌──────────────────────────────────────────────────────────┐
│              Agent Communication Flow                     │
└──────────────────────────────────────────────────────────┘

     ┌──────────────┐
     │ Beat Agent   │
     └──────┬───────┘
            │
            │ 1. Store beat pattern in AgentDB
            │    { type: "beat", embedding: [...] }
            ▼
     ┌──────────────────┐
     │   AgentDB        │
     │   Memory Store   │
     └──────┬───────────┘
            │
            │ 2. Publish event to Redis
            │    "beat.created" { pattern_id: "xyz" }
            ▼
     ┌──────────────────┐
     │   Event Bus      │
     │   (Redis Pub/Sub)│
     └──────┬───────────┘
            │
            ├──────────────────┬──────────────────┐
            │                  │                  │
            ▼                  ▼                  ▼
     ┌──────────┐       ┌──────────┐      ┌──────────┐
     │ Melody   │       │ Harmony  │      │ Visual   │
     │ Agent    │       │ Agent    │      │ Agent    │
     └────┬─────┘       └────┬─────┘      └────┬─────┘
          │                  │                  │
          │ 3. Query AgentDB for beat pattern  │
          │    and generate complementary      │
          │    content                         │
          ▼                  ▼                  ▼
     ┌────────────────────────────────────────────┐
     │        AgentDB Vector Search               │
     │  search({ vector: beatEmbedding, ... })    │
     └────────────────────────────────────────────┘
```

### Communication Protocol

```typescript
// Message format for agent communication
interface AgentMessage {
  // Routing
  from: string;                        // Source agent ID
  to?: string | string[];              // Target agent(s), undefined = broadcast
  topic: string;                       // "beat.created", "melody.updated"

  // Content
  type: "command" | "query" | "notification" | "response";
  payload: {
    pattern_id?: string;
    action?: string;
    data?: any;
    context?: Record<string, any>;
  };

  // Metadata
  timestamp: number;
  correlation_id: string;              // For request-response tracking
  priority: number;                    // 0-10 (10 = highest)

  // AgentDB Integration
  memory_key?: string;                 // Store this message in shared memory
  vector?: number[];                   // Semantic embedding for similarity
}
```

### Example: Beat Agent → Melody Agent Communication

```javascript
// Beat Agent creates a pattern
class BeatAgent {
  async createPattern(userInput) {
    // 1. Generate beat pattern
    const beatPattern = await this.generateBeat(userInput);

    // 2. Store in AgentDB
    const embedding = await this.embedder.embed(beatPattern);
    await agentDB.collection('beat_patterns').insert({
      ...beatPattern,
      embedding
    });

    // 3. Publish event
    await this.eventBus.publish('beat.created', {
      type: 'notification',
      from: this.id,
      topic: 'beat.created',
      payload: {
        pattern_id: beatPattern.id,
        bpm: beatPattern.bpm,
        key: beatPattern.key,
        duration: beatPattern.duration_bars
      },
      memory_key: `swarm/beat/${beatPattern.id}`,
      timestamp: Date.now()
    });

    return beatPattern;
  }
}

// Melody Agent listens and responds
class MelodyAgent {
  constructor() {
    this.eventBus.subscribe('beat.created', this.onBeatCreated.bind(this));
  }

  async onBeatCreated(message) {
    // 1. Retrieve beat pattern from AgentDB
    const beatPattern = await agentDB.collection('beat_patterns')
      .findOne({ id: message.payload.pattern_id });

    // 2. Find complementary melodic patterns
    const similarMelodies = await agentDB.collection('melody_patterns').search({
      vector: beatPattern.embedding,
      limit: 5,
      filter: {
        key: beatPattern.key,
        duration_bars: beatPattern.duration_bars
      }
    });

    // 3. Generate melody suggestion
    const melodySuggestion = await this.composeMelody(
      beatPattern,
      similarMelodies
    );

    // 4. Store and notify
    const melodyEmbedding = await this.embedder.embed(melodySuggestion);
    await agentDB.collection('melody_patterns').insert({
      ...melodySuggestion,
      embedding: melodyEmbedding,
      beat_pattern_id: beatPattern.id
    });

    await this.eventBus.publish('melody.suggested', {
      type: 'notification',
      from: this.id,
      payload: {
        melody_id: melodySuggestion.id,
        beat_pattern_id: beatPattern.id
      },
      correlation_id: message.correlation_id
    });
  }
}
```

---

## 2. Real-Time Collaboration Protocol

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│           Real-Time Collaboration Flow                      │
└────────────────────────────────────────────────────────────┘

User A                          User B                  User C
  │                               │                       │
  │ 1. Edit track 1              │                       │
  ├─────────────────────────────►│                       │
  │ WebSocket: { op: "insert",   │                       │
  │   track: 1, data: {...} }    │                       │
  │                              │                       │
  │                              ▼                       │
  │                    ┌──────────────────┐             │
  │                    │  WebSocket       │             │
  │                    │  Server          │             │
  │                    │  (Socket.io)     │             │
  │                    └────────┬─────────┘             │
  │                             │                       │
  │                             │ 2. Validate & order   │
  │                             │    operations (OT)    │
  │                             ▼                       │
  │                    ┌──────────────────┐             │
  │                    │  Collaboration   │             │
  │                    │  Agent           │             │
  │                    └────────┬─────────┘             │
  │                             │                       │
  │                             │ 3. Apply CRDT merge   │
  │                             │                       │
  │                             ▼                       │
  │                    ┌──────────────────┐             │
  │                    │  Redis           │             │
  │                    │  (Session State) │             │
  │                    └────────┬─────────┘             │
  │                             │                       │
  │                             │ 4. Broadcast to all   │
  │    ┌────────────────────────┼─────────────┐        │
  │    │                        │             │        │
  │    ▼                        ▼             ▼        ▼
  │ ┌────────┐              ┌────────┐     ┌────────┐
  │ │ User A │              │ User B │     │ User C │
  │ │ (self) │              │        │     │        │
  │ └────────┘              └────────┘     └────────┘
  │
  │ 5. Update local state
  │
```

### CRDT-Based Synchronization

We use Conflict-free Replicated Data Types (CRDTs) for conflict resolution:

```typescript
// Project state using CRDT
interface ProjectCRDT {
  tracks: GArray<Track>;               // Grow-only array of tracks
  operations: VersionVector;           // Causal consistency
  tombstones: Set<string>;             // Deleted items
}

// Operation format
interface CollaborativeOperation {
  // Identity
  op_id: string;                       // UUID
  user_id: string;
  session_id: string;

  // Operation type
  type: "insert" | "delete" | "update";

  // Target
  path: string[];                      // ["tracks", 0, "notes", 5]

  // Data
  value?: any;

  // Ordering (for OT)
  version_vector: Record<string, number>;
  timestamp: number;

  // Parent operation (for conflict resolution)
  parent_op_id?: string;
}

// CRDT merge function
class CollaborationAgent {
  mergeOperations(local: Operation[], remote: Operation[]): Operation[] {
    // 1. Build dependency graph
    const graph = this.buildOpGraph([...local, ...remote]);

    // 2. Topological sort for causal order
    const ordered = this.topologicalSort(graph);

    // 3. Apply operational transformation
    let state = this.initialState;
    for (const op of ordered) {
      state = this.applyOperation(state, op);
    }

    return ordered;
  }

  applyOperation(state: ProjectState, op: Operation): ProjectState {
    switch (op.type) {
      case "insert":
        return this.handleInsert(state, op);
      case "delete":
        return this.handleDelete(state, op);
      case "update":
        return this.handleUpdate(state, op);
    }
  }

  // Conflict resolution: Last-Write-Wins with version vectors
  resolveConflict(op1: Operation, op2: Operation): Operation {
    const v1 = op1.version_vector;
    const v2 = op2.version_vector;

    // Compare version vectors
    if (this.happensBefore(v1, v2)) return op2;
    if (this.happensBefore(v2, v1)) return op1;

    // Concurrent operations - use timestamp tiebreaker
    return op1.timestamp > op2.timestamp ? op1 : op2;
  }

  happensBefore(v1: VersionVector, v2: VersionVector): boolean {
    for (const [user, version] of Object.entries(v1)) {
      if ((v2[user] || 0) < version) return false;
    }
    return true;
  }
}
```

### WebSocket Event Protocol

```typescript
// Client → Server events
enum ClientEvents {
  // Session management
  JOIN_SESSION = "session:join",
  LEAVE_SESSION = "session:leave",

  // Operations
  OPERATION = "op:execute",
  UNDO = "op:undo",
  REDO = "op:redo",

  // Awareness (cursor, selection)
  CURSOR_MOVE = "awareness:cursor",
  SELECTION_CHANGE = "awareness:selection",

  // Audio
  PLAY = "audio:play",
  STOP = "audio:stop",
  SYNC_PLAYHEAD = "audio:sync"
}

// Server → Client events
enum ServerEvents {
  // Session
  SESSION_JOINED = "session:joined",
  USER_JOINED = "session:user_joined",
  USER_LEFT = "session:user_left",

  // Operations
  OPERATION_APPLIED = "op:applied",
  OPERATION_REJECTED = "op:rejected",
  STATE_SYNC = "state:sync",

  // Awareness
  USER_CURSOR = "awareness:user_cursor",
  USER_SELECTION = "awareness:user_selection",

  // Audio
  PLAYBACK_SYNC = "audio:playback_sync"
}

// Example: Multi-user cursor tracking
socket.on(ClientEvents.CURSOR_MOVE, async (data) => {
  const { user_id, track, beat, timestamp } = data;

  // Update in Redis for fast access
  await redis.setex(
    `session:${session_id}:cursor:${user_id}`,
    30,  // TTL: 30 seconds
    JSON.stringify({ track, beat, timestamp })
  );

  // Broadcast to other users
  socket.to(session_id).emit(ServerEvents.USER_CURSOR, {
    user_id,
    track,
    beat,
    color: getUserColor(user_id)
  });
});
```

---

## 3. Pattern Learning & Recommendation System

### Learning Pipeline

```
┌────────────────────────────────────────────────────────────┐
│              Pattern Learning Pipeline                      │
└────────────────────────────────────────────────────────────┘

1. User Interaction
   │
   ├─ Creates beat
   ├─ Likes/dislikes pattern
   ├─ Completes/abandons project
   └─ Provides explicit feedback
   │
   ▼
2. Feature Extraction
   │
   ├─ Musical features (rhythm, melody, harmony)
   ├─ User behavior (click patterns, time spent)
   └─ Context (time of day, project type)
   │
   ▼
3. Embedding Generation
   │
   ├─ Pattern Agent: Encode to 768-dim vector
   └─ Store in AgentDB with metadata
   │
   ▼
4. Learning Trace Storage
   │
   ├─ Task: "Create lo-fi beat"
   ├─ Actions: [generate, adjust_tempo, add_snare, ...]
   ├─ Outcome: Success (user saved project)
   └─ Reward: +1.0
   │
   ▼
5. Pattern Recognition
   │
   ├─ Query similar successful traces
   ├─ Extract common action sequences
   └─ Update agent strategy
   │
   ▼
6. Recommendation Generation
   │
   ├─ User starts new project
   ├─ Query AgentDB for similar users/patterns
   ├─ Rank by relevance + diversity
   └─ Present top 10 suggestions
```

### Recommendation Algorithm

```typescript
class PatternRecommender {
  async recommendPatterns(userId: string, context: Context): Promise<Pattern[]> {
    // 1. Get user preference embedding
    const userPrefs = await agentDB.collection('user_preferences')
      .findOne({ user_id: userId });

    if (!userPrefs) {
      // Cold start: popular patterns
      return this.getPopularPatterns(context);
    }

    // 2. Collaborative filtering: find similar users
    const similarUsers = await agentDB.collection('user_preferences').search({
      vector: userPrefs.embedding,
      limit: 50,
      filter: { user_id: { $ne: userId } }
    });

    // 3. Content-based filtering: find similar patterns
    const similarPatterns = await agentDB.collection('beat_patterns').search({
      vector: userPrefs.embedding,
      limit: 100,
      filter: {
        is_public: true,
        rating: { $gte: 3.5 }
      }
    });

    // 4. Hybrid scoring
    const scoredPatterns = similarPatterns.map(pattern => {
      // Similarity score (0-1)
      const similarityScore = 1 - pattern.distance;

      // Popularity score (0-1)
      const popularityScore = Math.log(pattern.usage_count + 1) / 10;

      // Diversity penalty (avoid filter bubble)
      const diversityScore = this.calculateDiversity(
        pattern,
        userPrefs.favorite_genres
      );

      // Recency score
      const age = Date.now() - pattern.created_at;
      const recencyScore = Math.exp(-age / (30 * 24 * 60 * 60 * 1000)); // 30 day decay

      // Weighted combination
      const totalScore =
        0.5 * similarityScore +
        0.2 * popularityScore +
        0.2 * diversityScore +
        0.1 * recencyScore;

      return { ...pattern, score: totalScore };
    });

    // 5. Sort and return top N
    return scoredPatterns
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  calculateDiversity(pattern: Pattern, userGenres: string[]): number {
    // Reward patterns with genres user hasn't explored much
    const novelGenres = pattern.genre.filter(g => !userGenres.includes(g));
    return novelGenres.length / pattern.genre.length;
  }

  async getPopularPatterns(context: Context): Promise<Pattern[]> {
    // For new users: trending + highly rated
    return agentDB.collection('beat_patterns').find({
      filter: {
        is_public: true,
        rating: { $gte: 4.0 },
        created_at: { $gte: Date.now() - 90 * 24 * 60 * 60 * 1000 } // Last 90 days
      },
      sort: { usage_count: -1 },
      limit: 10
    });
  }
}
```

### Adaptive Learning with ReasoningBank

```typescript
class AdaptiveLearningAgent {
  async learnFromInteraction(trace: LearningTrace) {
    // 1. Store trace in AgentDB
    const embedding = await this.embedTrace(trace);
    await agentDB.collection('learning_traces').insert({
      ...trace,
      embedding
    });

    // 2. Find similar past experiences
    const similarTraces = await agentDB.collection('learning_traces').search({
      vector: embedding,
      limit: 20,
      filter: {
        agent_type: trace.agent_type
      }
    });

    // 3. Analyze what worked
    const successfulTraces = similarTraces.filter(t => t.success);
    const failedTraces = similarTraces.filter(t => !t.success);

    // 4. Extract patterns
    const successPatterns = this.extractActionPatterns(successfulTraces);
    const failurePatterns = this.extractActionPatterns(failedTraces);

    // 5. Update agent strategy
    await this.updateStrategy({
      encourage: successPatterns,
      avoid: failurePatterns,
      confidence: successfulTraces.length / similarTraces.length
    });

    // 6. Train neural model (if enough data)
    if (similarTraces.length >= 100) {
      await this.trainNeuralPredictor(similarTraces);
    }
  }

  extractActionPatterns(traces: LearningTrace[]): ActionPattern[] {
    // Find common action sequences
    const sequences: Map<string, number> = new Map();

    for (const trace of traces) {
      const actions = trace.actions_taken.map(a => a.type).join(' → ');
      sequences.set(actions, (sequences.get(actions) || 0) + 1);
    }

    // Return patterns that appear in >30% of traces
    const threshold = traces.length * 0.3;
    return Array.from(sequences.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([sequence, count]) => ({
        sequence: sequence.split(' → '),
        frequency: count / traces.length
      }));
  }
}
```

---

## 4. Visual-Audio Synchronization Pipeline

### Synchronization Architecture

```
┌────────────────────────────────────────────────────────────┐
│         Visual-Audio Synchronization Flow                   │
└────────────────────────────────────────────────────────────┘

Audio Timeline (Web Audio API)
    │
    │ Sample-accurate timing
    ▼
┌──────────────────┐
│  Audio Context   │──► currentTime (seconds)
│  (48kHz)         │──► Transport (play/pause/seek)
└────────┬─────────┘
         │
         │ Schedule events ahead (100ms buffer)
         ▼
┌──────────────────────────────────────────┐
│  Audio Event Queue                       │
│  - Note on/off events                    │
│  - Parameter changes                     │
│  - Beat/bar markers                      │
└────────┬─────────────────────────────────┘
         │
         │ Emit timing events
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌────────────┐      ┌────────────┐    ┌────────────┐
│ Visual     │      │ UI Update  │    │ Collab     │
│ Agent      │      │ (React)    │    │ Sync       │
└─────┬──────┘      └─────┬──────┘    └─────┬──────┘
      │                   │                  │
      │ Request visual    │ Update playhead  │ Broadcast
      │ effects for beat  │ position         │ position
      ▼                   ▼                  ▼
┌────────────────────────────────────────────────────┐
│  Rendering Pipeline (Canvas/WebGL)                 │
│  - 60 FPS rendering loop                           │
│  - Interpolate between audio events                │
│  - Apply visual effects                            │
└────────────────────────────────────────────────────┘
```

### Sample-Accurate Synchronization

```typescript
class AudioVisualSynchronizer {
  private audioContext: AudioContext;
  private visualEngine: VisualEngine;
  private eventQueue: AudioEvent[] = [];

  constructor() {
    this.audioContext = new AudioContext({ sampleRate: 48000 });
    this.visualEngine = new VisualEngine({ fps: 60 });

    // Start rendering loop
    this.startRenderLoop();
  }

  // Schedule audio events
  scheduleAudioEvent(event: AudioEvent) {
    const scheduleTime = this.audioContext.currentTime + 0.1; // 100ms lookahead

    // Schedule in Web Audio API
    event.node.start(scheduleTime);

    // Add to visual event queue
    this.eventQueue.push({
      ...event,
      scheduledTime: scheduleTime,
      visualTrigger: true
    });

    // Query Visual Agent for effects
    this.requestVisualEffects(event);
  }

  async requestVisualEffects(audioEvent: AudioEvent) {
    // 1. Create context embedding
    const context = {
      instrument: audioEvent.instrument,
      velocity: audioEvent.velocity,
      frequency: audioEvent.frequency,
      timestamp: audioEvent.scheduledTime
    };

    const embedding = await this.embedContext(context);

    // 2. Query AgentDB for matching visual templates
    const visualTemplates = await agentDB.collection('visual_templates').search({
      vector: embedding,
      limit: 3,
      filter: {
        effect_type: this.getEffectType(audioEvent)
      }
    });

    // 3. Request Visual Agent to render
    await eventBus.publish('visual.render', {
      type: 'command',
      from: 'audio-sync',
      to: 'visual',
      payload: {
        templates: visualTemplates,
        audioEvent: audioEvent,
        timing: {
          start: audioEvent.scheduledTime,
          duration: audioEvent.duration
        }
      }
    });
  }

  // Rendering loop (60 FPS)
  startRenderLoop() {
    const animate = (timestamp: number) => {
      const audioTime = this.audioContext.currentTime;

      // Process events scheduled for this frame
      const currentEvents = this.eventQueue.filter(e =>
        e.scheduledTime <= audioTime &&
        e.scheduledTime + e.duration >= audioTime
      );

      // Render visual effects
      this.visualEngine.render(currentEvents, audioTime);

      // Clean up past events
      this.eventQueue = this.eventQueue.filter(e =>
        e.scheduledTime + e.duration >= audioTime
      );

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
}

// Visual Agent responds to render requests
class VisualAgent {
  constructor() {
    eventBus.subscribe('visual.render', this.onRenderRequest.bind(this));
  }

  async onRenderRequest(message: AgentMessage) {
    const { templates, audioEvent, timing } = message.payload;

    // Select best template
    const template = templates[0]; // Highest similarity

    // Generate visual effect
    const visualEffect = this.generateEffect(template, audioEvent);

    // Schedule rendering
    this.scheduleVisualEffect(visualEffect, timing);
  }

  generateEffect(template: VisualTemplate, audio: AudioEvent): VisualEffect {
    return {
      type: template.effect_type,

      // Map audio properties to visual
      scale: this.mapVelocityToScale(audio.velocity),
      color: this.mapFrequencyToColor(audio.frequency),
      position: this.mapInstrumentToPosition(audio.instrument),

      // Animation
      animation: template.animation_style,
      keyframes: template.keyframes,

      // Timing
      duration: audio.duration,
      easing: 'ease-out'
    };
  }

  mapVelocityToScale(velocity: number): number {
    // MIDI velocity 0-127 → scale 0.5-2.0
    return 0.5 + (velocity / 127) * 1.5;
  }

  mapFrequencyToColor(frequency: number): string {
    // Map frequency to hue (20Hz = red, 20kHz = purple)
    const minFreq = 20;
    const maxFreq = 20000;
    const hue = ((Math.log(frequency) - Math.log(minFreq)) /
                 (Math.log(maxFreq) - Math.log(minFreq))) * 360;

    return `hsl(${hue}, 70%, 60%)`;
  }
}
```

### Multi-User Audio Sync

```typescript
class CollaborativeAudioSync {
  async syncPlayback(sessionId: string) {
    // 1. Elect conductor (lowest latency user)
    const conductor = await this.electConductor(sessionId);

    // 2. Conductor broadcasts timing
    if (this.isLocalUser(conductor)) {
      setInterval(() => {
        const timing = {
          currentTime: this.audioContext.currentTime,
          isPlaying: this.transport.isPlaying,
          bpm: this.transport.bpm,
          timestamp: performance.now()
        };

        socket.emit('audio:conductor_sync', timing);
      }, 100); // Every 100ms
    }

    // 3. Other users adjust their clocks
    socket.on('audio:conductor_sync', (timing) => {
      const latency = performance.now() - timing.timestamp;
      const adjustedTime = timing.currentTime + (latency / 1000);

      // Smooth adjustment (avoid clicks)
      this.smoothAdjustClock(adjustedTime);
    });
  }

  smoothAdjustClock(targetTime: number) {
    const currentTime = this.audioContext.currentTime;
    const diff = targetTime - currentTime;

    // If difference > 50ms, jump immediately
    if (Math.abs(diff) > 0.05) {
      this.transport.seek(targetTime);
    } else {
      // Small differences: adjust playback rate slightly
      const adjustmentFactor = 1 + (diff * 0.1);
      this.transport.playbackRate = adjustmentFactor;

      // Return to normal after 1 second
      setTimeout(() => {
        this.transport.playbackRate = 1.0;
      }, 1000);
    }
  }
}
```

---

## 5. Data Persistence & Caching Strategy

### Layered Caching

```
┌────────────────────────────────────────────────────────────┐
│                   Data Access Layers                        │
└────────────────────────────────────────────────────────────┘

Request
  │
  ▼
┌──────────────────┐
│  L1: In-Memory   │  (Hot data, <1ms latency)
│  Cache           │  - User preferences
│  (256 MB)        │  - Active session state
└────────┬─────────┘
         │ Cache miss
         ▼
┌──────────────────┐
│  L2: Redis       │  (Warm data, <10ms latency)
│  Cache           │  - Pattern library
│  (2 GB)          │  - Popular templates
└────────┬─────────┘
         │ Cache miss
         ▼
┌──────────────────┐
│  L3: AgentDB     │  (Vector search, <50ms latency)
│  Vector DB       │  - Pattern similarity
│  (100 GB)        │  - Recommendations
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  L4: PostgreSQL  │  (Relational data, <100ms latency)
│  Database        │  - User accounts
│  (500 GB)        │  - Project metadata
└──────────────────┘
```

### Cache Invalidation

```typescript
class CacheManager {
  async invalidatePattern(patternId: string) {
    // 1. Remove from L1 (in-memory)
    this.memoryCache.delete(`pattern:${patternId}`);

    // 2. Remove from L2 (Redis)
    await redis.del(`pattern:${patternId}`);

    // 3. Invalidate dependent caches
    await this.invalidateRecommendations(patternId);

    // 4. Notify other servers (if clustered)
    await this.broadcastInvalidation(patternId);
  }

  async invalidateRecommendations(patternId: string) {
    // Find all users who have this pattern in recommendations
    const affectedUsers = await this.findAffectedUsers(patternId);

    for (const userId of affectedUsers) {
      await redis.del(`recommendations:${userId}`);
    }
  }
}
```

---

## 6. Error Handling & Resilience

### Circuit Breaker Pattern

```typescript
class AgentCircuitBreaker {
  private failures: Map<string, number> = new Map();
  private readonly threshold = 5;
  private readonly timeout = 30000; // 30 seconds

  async call(agentId: string, operation: () => Promise<any>) {
    // Check if circuit is open
    if (this.isOpen(agentId)) {
      throw new Error(`Circuit breaker open for agent ${agentId}`);
    }

    try {
      const result = await operation();
      this.onSuccess(agentId);
      return result;
    } catch (error) {
      this.onFailure(agentId);
      throw error;
    }
  }

  isOpen(agentId: string): boolean {
    return (this.failures.get(agentId) || 0) >= this.threshold;
  }

  onSuccess(agentId: string) {
    this.failures.delete(agentId);
  }

  onFailure(agentId: string) {
    const count = (this.failures.get(agentId) || 0) + 1;
    this.failures.set(agentId, count);

    if (count >= this.threshold) {
      // Open circuit, reset after timeout
      setTimeout(() => {
        this.failures.delete(agentId);
      }, this.timeout);
    }
  }
}
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-21
**Architecture Team**

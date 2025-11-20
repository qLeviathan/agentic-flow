# AgentDB for Tauri OS - Developer Quick Reference

**Version:** 1.0
**Last Updated:** 2025-11-20
**Target Audience:** OS Developers, App Developers

---

## Quick Start

### Installation

```bash
# Add AgentDB to Tauri project
npm install agentdb@latest

# Or use in Rust
cargo add agentdb
```

### Basic Usage

```typescript
import { AgentDB } from 'agentdb';

// Initialize OS-level AgentDB instance
const db = new AgentDB({
  path: '~/.tauri-os/agentdb/system.db',
  dimensions: 1536,
  metric: 'cosine',
  quantization: 'uint8',  // 4x memory reduction
  hnsw: true              // 150x faster search
});

await db.initialize();
```

---

## Core Patterns

### 1. Application Memory

**Give your app persistent semantic memory:**

```typescript
class AppMemory {
  private db: AgentDB;
  private appId: string;

  // Store memory
  async remember(key: string, data: any, context?: string) {
    const embedding = await this.embedder.embed(
      context || JSON.stringify(data)
    );

    await this.db.insert({
      id: `${this.appId}/${key}`,
      vector: embedding,
      metadata: { key, data, timestamp: Date.now() }
    });
  }

  // Retrieve memory
  async recall(query: string, k: number = 5) {
    const queryEmbedding = await this.embedder.embed(query);
    return await this.db.search({
      vector: queryEmbedding,
      k,
      filters: { appId: this.appId }
    });
  }
}

// Usage
const memory = new AppMemory(db, 'vscode');

// Store debugging session
await memory.remember('auth-debug-2024-11-20', {
  problem: 'JWT timeout',
  solution: 'Increased expiry to 24h',
  success: true
}, 'Fixed authentication timeout by changing JWT configuration');

// Recall similar issues
const pastSolutions = await memory.recall('authentication timeout issues');
```

### 2. File Search

**Semantic file indexing:**

```typescript
class FileSearch {
  private db: AgentDB;

  async indexFile(filepath: string, content: string) {
    const embedding = await this.embedder.embed(content);

    await this.db.insert({
      id: `file://${filepath}`,
      vector: embedding,
      metadata: {
        path: filepath,
        name: path.basename(filepath),
        extension: path.extname(filepath),
        indexed: Date.now()
      }
    });
  }

  async search(query: string, filters?: any) {
    const queryEmbedding = await this.embedder.embed(query);
    return await this.db.search({
      vector: queryEmbedding,
      k: 50,
      filters,
      minSimilarity: 0.7
    });
  }
}

// Usage
const fileSearch = new FileSearch(db);

// Index directory
for await (const file of walk('/path/to/code')) {
  const content = await fs.readFile(file, 'utf-8');
  await fileSearch.indexFile(file, content);
}

// Search by meaning
const results = await fileSearch.search(
  'Python script for parsing JSON API responses'
);
```

### 3. Reflexion Memory (Learning from Experience)

**Store and learn from episodes:**

```typescript
import { ReflexionMemory } from 'agentdb';

const reflexion = new ReflexionMemory(db, embedder);

// Store successful debugging session
await reflexion.storeEpisode({
  sessionId: 'debug-session-123',
  task: 'fix_auth_timeout',
  input: 'Users logging out after 1 hour',
  output: 'Changed JWT_EXPIRY from 3600 to 86400',
  critique: 'Increasing JWT expiry resolved the issue. Should document this in config.',
  reward: 0.95,
  success: true,
  latencyMs: 1800,
  tokensUsed: 350
});

// Retrieve similar past experiences
const pastExperiences = await reflexion.retrieveRelevant({
  task: 'authentication timeout problems',
  k: 10,
  onlySuccesses: true,
  minReward: 0.8
});

// Learn from failures
const failures = await reflexion.retrieveRelevant({
  task: 'authentication',
  onlyFailures: true
});
```

### 4. Skill Library (Pattern Consolidation)

**Build reusable skills from successful patterns:**

```typescript
import { SkillLibrary } from 'agentdb';

const skills = new SkillLibrary(db, embedder);

// Create a skill
await skills.createSkill({
  name: 'batch_database_operations',
  description: 'Use transactions for bulk database inserts',
  implementation: `
    db.transaction(() => {
      items.forEach(item => stmt.run(item));
    })();
  `,
  successRate: 0.95,
  category: 'performance'
});

// Search for applicable skills
const applicableSkills = await skills.search(
  'optimize database performance',
  5
);

// Auto-consolidate from episodes
await skills.consolidateFromEpisodes({
  minOccurrences: 3,
  minReward: 0.7,
  timePeriodDays: 7
});
```

### 5. Causal Reasoning

**Learn cause-and-effect relationships:**

```typescript
import { CausalMemoryGraph } from 'agentdb';

const causal = new CausalMemoryGraph(db);

// Record causal relationship
await causal.addEdge({
  from: 'enable_hnsw_indexing',
  to: 'vector_search_speedup',
  uplift: 0.98,  // 98% performance improvement
  confidence: 0.95,
  evidenceCount: 50
});

// Query effects of an action
const effects = await causal.query({
  intervention: 'enable_hnsw_indexing',
  depth: 2
});

// Discover patterns automatically
const discovered = await causal.discoverPatterns({
  minOccurrences: 3,
  minUplift: 0.6,
  confidenceThreshold: 0.7
});
```

### 6. Predictive Actions (Reinforcement Learning)

**Use RL to predict user actions:**

```typescript
import { LearningSystem } from 'agentdb';

const learning = new LearningSystem(db, embedder);

// Start a learning session
const sessionId = await learning.startSession(
  'user-123',
  'q-learning',  // or: sarsa, dqn, ppo, decision-transformer, etc.
  {
    learningRate: 0.01,
    discountFactor: 0.99,
    explorationRate: 0.1
  }
);

// Record user actions for learning
await learning.recordExperience({
  sessionId,
  state: 'opened_terminal_at_9am',
  action: 'loaded_last_session',
  reward: 1.0,  // Positive outcome
  nextState: 'started_coding',
  success: true
});

// Predict next action
const prediction = await learning.predict({
  sessionId,
  state: 'opened_terminal_at_9am'
});
// Returns: { action: 'load_last_session', confidence: 0.87 }

// Train the model
await learning.train(sessionId, {
  epochs: 100,
  batchSize: 32
});
```

### 7. Nightly Learner (Auto-Optimization)

**Discover system optimizations automatically:**

```typescript
import { NightlyLearner } from 'agentdb';

const learner = new NightlyLearner(db, embedder);

// Run nightly optimization (background process)
const optimizations = await learner.discoverPatterns({
  minOccurrences: 3,
  minUplift: 0.6,
  confidenceThreshold: 0.7,
  dryRun: false  // Set to true to preview without applying
});

// Results might include:
// - "Defragmenting SSD at 3am improves boot time by 15%"
// - "Preloading browser cache reduces page load by 40%"
// - "Suspending background apps during gaming improves FPS by 25%"
```

### 8. QUIC Synchronization (Multi-Device)

**Sync memories across devices:**

```typescript
import { QUICClient, QUICServer } from 'agentdb';

// Server (hub device)
const server = new QUICServer({
  port: 4433,
  certificate: loadCertificate(),
  privateKey: loadPrivateKey()
});

await server.start();

// Client (other devices)
const client = new QUICClient({
  serverUrl: 'quic://hub.local:4433',
  certificate: loadClientCertificate(),
  db: localAgentDB
});

await client.connect();

// Sync automatically runs in background
// Incremental sync every 5 seconds
// Full reconciliation every 7 days
```

---

## OS Service Integration

### Rust FFI (for OS Core)

```rust
// src-tauri/src/agentdb_service.rs

use agentdb::{AgentDB, SearchRequest, MemoryEntry};

#[tauri::command]
pub async fn os_memory_store(
    key: String,
    data: serde_json::Value
) -> Result<String, String> {
    let db = get_os_agentdb();
    let id = db.insert(MemoryEntry {
        key,
        data,
        metadata: None
    }).await
        .map_err(|e| e.to_string())?;
    Ok(id)
}

#[tauri::command]
pub async fn os_memory_search(
    query: String,
    k: Option<usize>
) -> Result<Vec<SearchResult>, String> {
    let db = get_os_agentdb();
    let results = db.search(SearchRequest {
        query,
        k: k.unwrap_or(10),
        filters: None
    }).await
        .map_err(|e| e.to_string())?;
    Ok(results)
}

#[tauri::command]
pub async fn os_predict_action(
    context: String
) -> Result<ActionPrediction, String> {
    let learning = get_learning_system();
    learning.predict(context).await
        .map_err(|e| e.to_string())
}
```

### Tauri Frontend (for App Developers)

```typescript
// App can access OS intelligence via Tauri IPC
import { invoke } from '@tauri-apps/api/tauri';

// Store memory
await invoke('os_memory_store', {
  key: 'last-project',
  data: { path: '/path/to/project', openFiles: [...] }
});

// Search memories
const results = await invoke('os_memory_search', {
  query: 'last coding project',
  k: 5
});

// Get predictions
const prediction = await invoke('os_predict_action', {
  context: 'user opened terminal at 9am'
});
```

---

## Performance Optimization

### 1. Use Batch Operations

```typescript
// ❌ Slow: Individual inserts
for (const item of items) {
  await db.insert(item);
}

// ✅ Fast: Batch insert (141x faster)
await db.insertBatch(items);
```

### 2. Enable HNSW Indexing

```typescript
// 150x faster search for large datasets
const db = new AgentDB({
  hnsw: {
    enabled: true,
    M: 16,              // Connections per layer
    efConstruction: 200, // Build quality
    efSearch: 100        // Search quality
  }
});
```

### 3. Use Quantization

```typescript
// 4x memory reduction with 8-bit quantization
const db = new AgentDB({
  quantization: 'uint8'  // or 'uint4' for 8x reduction
});
```

### 4. Cache Queries

```typescript
import { QueryOptimizer } from 'agentdb/optimizations';

const optimizer = new QueryOptimizer(db, {
  maxSize: 1000,
  ttl: 60000  // 1 minute cache
});

// Queries are automatically cached
const results = optimizer.query('SELECT * FROM memories WHERE ...');
```

---

## Common Use Cases

### 1. IDE with Memory

```typescript
class IntelligentIDE {
  private memory: AppMemory;

  async onFileSave(filepath: string, content: string) {
    // Remember successful code patterns
    await this.memory.remember(`code/${filepath}`, {
      filepath,
      content,
      language: this.detectLanguage(filepath),
      patterns: this.extractPatterns(content)
    }, content);
  }

  async onDebugSuccess(problem: string, solution: string) {
    // Store debugging episode
    await this.reflexion.storeEpisode({
      task: `debug/${problem}`,
      input: problem,
      output: solution,
      reward: 1.0,
      success: true
    });
  }

  async suggestFix(error: string) {
    // Recall similar past solutions
    const pastFixes = await this.memory.recall(
      `how to fix ${error}`
    );
    return pastFixes[0]?.metadata.solution;
  }
}
```

### 2. Terminal with Context

```typescript
class IntelligentTerminal {
  async onCommandExecute(cmd: string, exitCode: number) {
    // Learn from command outcomes
    await this.learning.recordExperience({
      state: this.getCurrentContext(),
      action: cmd,
      reward: exitCode === 0 ? 1.0 : 0.0,
      success: exitCode === 0
    });
  }

  async suggestCommand(context: string) {
    // Predict useful command based on context
    const prediction = await this.learning.predict({
      state: context
    });
    return prediction.action;
  }

  async onSessionStart() {
    // Check if there are learned patterns for this time/context
    const patterns = await this.skills.search(
      `terminal startup ${this.getCurrentTime()}`
    );

    if (patterns.length > 0) {
      // Apply learned startup sequence
      this.executeStartupSequence(patterns[0].implementation);
    }
  }
}
```

### 3. File Manager with Smart Search

```typescript
class IntelligentFileManager {
  private fileSearch: FileSearch;

  async searchFiles(query: string) {
    // Semantic search across indexed files
    return await this.fileSearch.search(query);
  }

  async onFileAccess(filepath: string, context: string) {
    // Record access pattern for learning
    await this.reflexion.storeEpisode({
      task: 'file_access',
      input: context,
      output: filepath,
      reward: 0.8,
      success: true
    });

    // Update causal graph
    await this.causal.addEdge({
      from: `context/${context}`,
      to: `file/${filepath}`,
      uplift: 0.7,
      confidence: 0.9
    });
  }

  async suggestFiles(context: string) {
    // Predict relevant files based on context
    const effects = await this.causal.query({
      intervention: `context/${context}`,
      depth: 1
    });

    return effects
      .filter(e => e.uplift > 0.5)
      .map(e => e.to.replace('file/', ''));
  }
}
```

---

## Best Practices

### 1. Use Descriptive Keys

```typescript
// ❌ Bad: Generic keys
await db.insert({ id: 'item1', ... });

// ✅ Good: Descriptive, hierarchical keys
await db.insert({ id: 'app/vscode/project/auth-service/session-2024-11-20', ... });
```

### 2. Store Rich Context

```typescript
// ❌ Bad: Minimal context
await reflexion.storeEpisode({
  task: 'fix_bug',
  success: true
});

// ✅ Good: Detailed critique and context
await reflexion.storeEpisode({
  task: 'fix_authentication_timeout_in_jwt_middleware',
  input: 'Users reporting logout after 1 hour',
  output: 'Changed JWT_EXPIRY from 3600 to 86400 in config/auth.js',
  critique: 'JWT token expiry was too short. Increasing to 24h resolved the issue. Should add warning in logs when token is about to expire.',
  reward: 0.95,
  success: true,
  metadata: {
    files_changed: ['config/auth.js'],
    lines_changed: 1,
    test_results: 'all_passed'
  }
});
```

### 3. Set Appropriate Rewards

```typescript
// Reward scale guidelines:
// 0.0 - 0.3: Failed or very poor outcome
// 0.3 - 0.5: Partial success
// 0.5 - 0.7: Successful but suboptimal
// 0.7 - 0.9: Good success
// 0.9 - 1.0: Excellent outcome

await reflexion.storeEpisode({
  reward: 0.95,  // Excellent: Fast, correct, no side effects
  // vs
  reward: 0.6    // Okay: Works but slow or has issues
});
```

### 4. Prune Regularly

```typescript
// Clean up old, low-quality data
await reflexion.prune({
  maxAgeDays: 90,      // Remove episodes older than 90 days
  minReward: 0.5       // Remove low-quality episodes
});

await skills.prune({
  minUses: 3,          // Remove unused skills
  minSuccessRate: 0.4, // Remove unsuccessful patterns
  maxAgeDays: 60
});
```

### 5. Monitor Performance

```typescript
// Get database statistics
const stats = await db.getStats();
console.log({
  totalMemories: stats.count,
  diskUsageMB: stats.sizeMB,
  avgSearchLatency: stats.avgQueryTimeMs,
  cacheHitRate: stats.cacheHitRate
});

// Set up alerts
if (stats.sizeMB > 1000) {
  console.warn('AgentDB exceeding 1GB, consider pruning');
}

if (stats.avgQueryTimeMs > 50) {
  console.warn('Search latency high, consider enabling HNSW');
}
```

---

## Troubleshooting

### Issue: Slow Search

```typescript
// Solution 1: Enable HNSW indexing
db.config.hnsw.enabled = true;

// Solution 2: Use quantization
db.config.quantization = 'uint8';

// Solution 3: Reduce search space with filters
const results = await db.search({
  query: 'authentication',
  filters: {
    timestamp: { $gte: Date.now() - 86400000 }  // Last 24 hours only
  }
});
```

### Issue: High Memory Usage

```typescript
// Solution 1: Use 4-bit quantization (8x reduction)
db.config.quantization = 'uint4';

// Solution 2: Prune old data
await db.prune({ maxAgeDays: 30 });

// Solution 3: Use per-app databases instead of one global
const appDB = new AgentDB({ path: `~/.tauri-os/agentdb/apps/${appId}.db` });
```

### Issue: Poor Predictions

```typescript
// Solution 1: Need more training data
// Collect at least 100-1000 examples before expecting good predictions

// Solution 2: Adjust learning rate
await learning.updateConfig({
  learningRate: 0.001  // Lower for more stable learning
});

// Solution 3: Use confidence thresholds
const prediction = await learning.predict({ state: context });
if (prediction.confidence > 0.85) {
  // Only act on high-confidence predictions
  await executeAction(prediction.action);
}
```

---

## API Reference

### Core AgentDB

```typescript
class AgentDB {
  constructor(config: AgentDBConfig);
  initialize(): Promise<void>;
  insert(entry: MemoryEntry): Promise<string>;
  insertBatch(entries: MemoryEntry[]): Promise<string[]>;
  search(request: SearchRequest): Promise<SearchResult[]>;
  delete(id: string): Promise<void>;
  getStats(): Promise<DatabaseStats>;
}
```

### Reflexion Memory

```typescript
class ReflexionMemory {
  storeEpisode(episode: Episode): Promise<number>;
  retrieveRelevant(query: ReflexionQuery): Promise<Episode[]>;
  getCritiqueSummary(task: string): Promise<string>;
  prune(options: PruneOptions): Promise<number>;
}
```

### Skill Library

```typescript
class SkillLibrary {
  createSkill(skill: Skill): Promise<number>;
  search(query: string, k: number): Promise<Skill[]>;
  consolidateFromEpisodes(options: ConsolidateOptions): Promise<Skill[]>;
  prune(options: PruneOptions): Promise<number>;
}
```

### Causal Memory Graph

```typescript
class CausalMemoryGraph {
  addEdge(edge: CausalEdge): Promise<void>;
  query(request: CausalQuery): Promise<CausalEdge[]>;
  discoverPatterns(options: DiscoveryOptions): Promise<CausalEdge[]>;
}
```

### Learning System

```typescript
class LearningSystem {
  startSession(userId: string, type: string, config: LearningConfig): Promise<string>;
  recordExperience(experience: Experience): Promise<void>;
  predict(request: PredictRequest): Promise<ActionPrediction>;
  train(sessionId: string, options: TrainOptions): Promise<TrainingResult>;
}
```

---

## Resources

**Documentation:**
- Full Analysis: `/docs/AGENTDB_OS_LEVEL_ANALYSIS.md`
- Executive Summary: `/docs/AGENTDB_TAURI_OS_EXECUTIVE_SUMMARY.md`

**Source Code:**
- Package: `/packages/agentdb/`
- Swarm Integration: `/src/swarm/`

**Examples:**
- Benchmarks: `/packages/agentdb/benchmarks/`
- Tests: `/packages/agentdb/tests/`

**Architecture:**
- QUIC Sync: `/packages/agentdb/docs/QUIC-ARCHITECTURE.md`
- Frontier Memory: `/packages/agentdb/docs/FRONTIER_MEMORY_GUIDE.md`
- Performance: `/packages/agentdb/benchmarks/PERFORMANCE_REPORT.md`

---

**Last Updated:** 2025-11-20
**Version:** 1.0
**Maintainer:** Code Quality Analyzer

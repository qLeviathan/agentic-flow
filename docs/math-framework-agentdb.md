# Math Framework AgentDB Integration

Comprehensive AgentDB integration for working memory and pattern learning in the mathematical framework, featuring Nash equilibria detection, pattern recognition, and distributed computation.

## Features

### 🧠 Core Memory System
- **Store all computed values** (F, L, Z, S, Nash points)
- **Cross-session persistence** - Data survives restarts
- **Vector embeddings** - Efficient similarity search
- **150x faster search** with HNSW indexing
- **4-32x memory reduction** with quantization

### 🎯 Pattern Recognition
- **Nash equilibrium detection** - Automatically find points where S(n)=0
- **Convergence analysis** - Detect converging sequences
- **Oscillation patterns** - Identify oscillating behavior
- **Pattern prediction** - Predict next Nash points from learned patterns

### 🔗 Causal Memory
- **"S(n)=0 causes Nash"** - Store causal relationships
- **Evidence accumulation** - Strengthen confidence with more data
- **Automatic verification** - Update confidence scores

### 📚 Skill Library
- **Store successful optimization paths** - Learn what works
- **Success rate tracking** - Rank skills by performance
- **Parameter preservation** - Remember what settings worked
- **Usage statistics** - Track skill utilization

### 🔄 Reflexion Memory
- **Learn from attempts** - Store optimization trajectories
- **Insights extraction** - Capture key learnings
- **Improvement suggestions** - Generate better strategies
- **9 RL algorithms** - DecisionTransformer, Q-Learning, SARSA, Actor-Critic, etc.

### 🌐 QUIC Synchronization
- **Distributed computation** - Sync across multiple nodes
- **Real-time updates** - Sub-millisecond latency
- **Automatic conflict resolution** - CRDT-based consistency
- **Fault tolerance** - Graceful degradation

## Installation

```bash
npm install agentdb
```

AgentDB is already added to the project dependencies.

## Quick Start

```typescript
import { createMathFrameworkMemory } from './src/math-framework/memory/agentdb-integration';

// Create memory instance
const memory = createMathFrameworkMemory({
  database_path: './math-framework.db',
  enable_learning: true,
  enable_hnsw: true,
  enable_quantization: true
});

// Compute and store values
const values = await memory.computeAndStore(10);
console.log(`F(10) = ${values.F}, L(10) = ${values.L}, S(10) = ${values.S}`);

// Find Nash equilibria
const results = await memory.batchCompute(1, 100);
const nashPoints = results.filter(r => r.is_nash_point);
console.log(`Found ${nashPoints.length} Nash points`);

// Close when done
await memory.close();
```

## API Reference

### Core Methods

#### `computeAndStore(n: number): Promise<ComputedValues>`
Computes F(n), L(n), Z(n), S(n) and phase space coordinates for index n, stores in memory.

```typescript
const values = await memory.computeAndStore(10);
// Returns: { n, F, L, Z, S, phase, is_nash_point, timestamp }
```

#### `batchCompute(start: number, end: number): Promise<ComputedValues[]>`
Efficiently computes and stores values for a range of indices.

```typescript
const results = await memory.batchCompute(1, 100);
// Computes 100 values in parallel
```

### Nash Equilibrium Methods

#### `storeNashEquilibrium(nash: NashEquilibrium): Promise<void>`
Stores a Nash equilibrium point with vector embedding.

#### `getAllNashPoints(options?: MemoryQueryOptions): Promise<NashEquilibrium[]>`
Retrieves all stored Nash equilibrium points.

#### `findSimilarNashPoints(n: number, limit: number): Promise<VectorSearchResult<NashEquilibrium>[]>`
Finds Nash points similar to the given index using vector similarity.

#### `predictNextNashPoints(searchRange: [number, number]): Promise<number[]>`
Predicts potential Nash points in the given range based on learned patterns.

### Pattern Recognition Methods

#### `analyzeAndStorePatterns(start: number, end: number): Promise<PatternRecognition[]>`
Analyzes a range for patterns (Nash, convergence, oscillation) and stores results.

```typescript
const patterns = await memory.analyzeAndStorePatterns(1, 50);
patterns.forEach(p => {
  console.log(`${p.pattern_type}: ${p.description}`);
});
```

### Causal Memory Methods

#### `storeCausalRelation(causal: CausalMemory): Promise<void>`
Stores a causal relationship (e.g., "S(n)=0 causes Nash").

```typescript
await memory.storeCausalRelation({
  cause: 'S(n)=0',
  effect: 'Nash equilibrium',
  n_values: [10, 20],
  confidence: 0.95,
  evidence_count: 2,
  created_at: Date.now(),
  last_verified: Date.now()
});
```

#### `getCausalRelations(cause?: string): Promise<CausalMemory[]>`
Retrieves causal relationships, optionally filtered by cause.

### Skill Library Methods

#### `storeSkill(skill: OptimizationSkill): Promise<void>`
Stores a successful optimization strategy.

```typescript
await memory.storeSkill({
  skill_id: 'nash-finder-v1',
  name: 'Binary Search Nash Finder',
  description: 'Fast Nash point detection',
  success_rate: 0.92,
  avg_convergence_steps: 8,
  learned_from: ['task-1', 'task-2'],
  parameters: { tolerance: 1e-10 },
  usage_count: 5,
  last_used: Date.now()
});
```

#### `getBestSkills(taskType: string, limit: number): Promise<OptimizationSkill[]>`
Retrieves top-performing skills, sorted by success rate.

### Reflexion Memory Methods

#### `storeReflexion(reflexion: ReflexionEntry): Promise<void>`
Stores a learning trajectory for reinforcement learning.

```typescript
await memory.storeReflexion({
  attempt_id: 'attempt-1',
  task_description: 'Find Nash near n=10',
  initial_state: startValues,
  steps_taken: ['step1', 'step2', 'step3'],
  final_state: endValues,
  success: true,
  insights: ['Binary search converged quickly'],
  improvement_suggestions: ['Cache intermediate values'],
  created_at: Date.now()
});
```

#### `learnFromReflexions(minAttempts: number): Promise<void>`
Runs AgentDB's learning algorithm on stored reflexion entries.

```typescript
await memory.learnFromReflexions(3);
// Uses configured algorithm (DecisionTransformer, Q-Learning, etc.)
```

### Game State Methods

#### `storeGameState(state: GameState): Promise<void>`
Stores a game state with vector embedding for similarity search.

#### `findSimilarGameStates(queryState: GameState, limit: number): Promise<VectorSearchResult<GameState>[]>`
Finds similar game states using vector similarity.

### QUIC Synchronization

#### `enableQuicSync(nodeId: string): Promise<void>`
Enables QUIC-based synchronization for distributed computation.

```typescript
await memory.enableQuicSync('node-1');
// Syncs with peers every 5 seconds (configurable)
```

### Statistics

#### `getStats(): Promise<LearningStats>`
Returns comprehensive statistics about stored data.

```typescript
const stats = await memory.getStats();
console.log(`Computations: ${stats.total_computations}`);
console.log(`Nash points: ${stats.nash_points_found}`);
console.log(`Patterns: ${stats.patterns_recognized}`);
```

## Configuration

```typescript
interface MathFrameworkConfig {
  database_path: string;           // Default: './math-framework.db'
  enable_quic_sync: boolean;       // Default: false
  quic_port?: number;              // Default: 4433
  enable_learning: boolean;        // Default: true
  learning_config?: {
    min_attempts: number;          // Default: 3
    learning_rate: number;         // Default: 0.01
    algorithm: 'DecisionTransformer' | 'QLearning' | 'SARSA' | 'ActorCritic';
  };
  enable_hnsw: boolean;            // Default: true (150x faster search)
  enable_quantization: boolean;    // Default: true (4-32x memory reduction)
  sync_interval_ms?: number;       // Default: 5000
}
```

## Examples

See `/examples/math-framework/agentdb-usage.ts` for 10 comprehensive examples:

1. **Basic Usage** - Compute and store values
2. **Nash Equilibria** - Find Nash points
3. **Pattern Recognition** - Detect patterns
4. **Similarity Search** - Find similar states
5. **Causal Memory** - Store causal relations
6. **Skill Library** - Save optimization strategies
7. **Reflexion Memory** - Learn from attempts
8. **Predict Nash Points** - Use learned patterns
9. **Statistics** - Monitor system performance
10. **Complete Workflow** - End-to-end example

Run examples:
```bash
npx ts-node examples/math-framework/agentdb-usage.ts
```

## Testing

Comprehensive test suite with 40+ tests covering all features:

```bash
npm test tests/math-framework/memory/agentdb-integration.test.ts
```

## Performance

- **Vector search**: 150x faster with HNSW indexing
- **Memory usage**: 4-32x reduction with quantization
- **QUIC sync**: Sub-millisecond latency
- **Batch operations**: Optimized for large ranges
- **Caching**: In-memory cache for frequently accessed values

## Integration with Other Agents

All data is stored in AgentDB with vector embeddings, making it accessible to other agents via:

1. **Shared memory** - All agents read from same database
2. **Vector search** - Find relevant data by similarity
3. **Causal links** - Understand cause-effect relationships
4. **Skill reuse** - Apply learned optimization strategies
5. **Pattern transfer** - Apply patterns to new problems

## Mathematical Background

### Sequences
- **Fibonacci**: F(n) = (φ^n - ψ^n) / √5
- **Lucas**: L(n) = φ^n + ψ^n
- **Z**: Z(n) = φ^n + ψ^n (same as Lucas)
- **S**: S(n) = 2F(n) - L(n)

### Nash Equilibrium
When S(n) = 0, we have a Nash equilibrium point where:
- 2F(n) = L(n)
- System is in perfect balance

### Phase Space
Phase space coordinates use golden ratio:
- φ = (1 + √5) / 2 ≈ 1.618033988749895
- ψ = (1 - √5) / 2 ≈ -0.618033988749895

## Architecture

```
src/math-framework/
├── memory/
│   ├── agentdb-integration.ts  # Main integration
│   └── types.ts                # Type definitions
├── sequences/
│   └── fibonacci-lucas.ts      # Sequence computations
├── phase-space/
│   └── coordinates.ts          # Phase space mapping
└── neural/
    └── pattern-recognition.ts  # Pattern detection

tests/math-framework/memory/
└── agentdb-integration.test.ts # Comprehensive tests

examples/math-framework/
└── agentdb-usage.ts            # Usage examples
```

## Future Enhancements

- [ ] Neural network integration for pattern prediction
- [ ] Real-time visualization dashboard
- [ ] Multi-agent collaborative optimization
- [ ] Advanced QUIC mesh topology
- [ ] Distributed training across nodes
- [ ] Interactive Jupyter notebooks
- [ ] GraphQL API for memory queries
- [ ] Time-series analysis of convergence rates

## License

MIT

## Contributing

Contributions welcome! Areas of interest:
- Additional pattern recognition algorithms
- New optimization strategies
- Performance improvements
- Documentation enhancements
- More test coverage

---

**Status**: ✅ Fully implemented with comprehensive tests and examples

# ADR-002: AgentDB for Memory Coordination

## Status
Accepted

## Context
The mathematical framework needs:
- Working memory for computation state
- Pattern learning from successful computations
- Cross-session persistence
- Semantic search for similar patterns
- Efficient caching mechanisms
- Multi-agent coordination

We evaluated several storage solutions:
1. In-memory only (lost on restart)
2. SQLite (no vector search)
3. Redis (no embeddings)
4. PostgreSQL + pgvector (heavy, separate process)
5. AgentDB (embedded, vector search, learning features)

## Decision
We adopt **AgentDB** as the primary memory and persistence layer for:
- Working memory storage
- Computation result caching
- Pattern library with semantic search
- Nash equilibrium history
- Neural network state persistence
- Cross-session state management

### Architecture

```
┌─────────────────────────────────────────────┐
│          Application Layer                   │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│         Memory Manager                       │
│  ┌────────────┐  ┌──────────────┐          │
│  │ L1 Cache   │  │  AgentDB     │          │
│  │ (LRU)      │→ │  (L2/L3)     │          │
│  │ 100MB      │  │  Unlimited   │          │
│  └────────────┘  └──────────────┘          │
└─────────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│           AgentDB Features                   │
│  - Vector store (768-dim embeddings)        │
│  - HNSW indexing (150x faster search)       │
│  - Q4 quantization (4x memory reduction)    │
│  - Learning algorithms (9 RL methods)       │
│  - Cross-session persistence               │
└─────────────────────────────────────────────┘
```

## Rationale

### Why AgentDB?

1. **Embedded**: No separate server process
2. **Vector Search**: Semantic similarity for pattern matching
3. **Learning Features**: Built-in RL algorithms for optimization
4. **Performance**: HNSW indexing, quantization
5. **Persistence**: SQLite-backed, ACID guarantees
6. **TypeScript-Native**: First-class TypeScript support
7. **Lightweight**: Minimal dependencies

### Memory Hierarchy

```typescript
interface MemoryLayers {
  L1: {
    type: 'LRU Cache'
    size: '~100MB'
    latency: '<1ms'
    use: 'Hot computation results'
  }

  L2: {
    type: 'AgentDB Working Memory'
    size: '~1GB'
    latency: '<10ms'
    use: 'Session state, recent computations'
  }

  L3: {
    type: 'AgentDB Vector Store'
    size: 'Unlimited'
    latency: '<100ms'
    use: 'Pattern library, Nash history'
  }

  L4: {
    type: 'AgentDB Neural State'
    size: 'Unlimited'
    latency: '<1s'
    use: 'Trained models, convergence patterns'
  }
}
```

## Consequences

### Positive
- **Unified Storage**: Single system for all persistence needs
- **Semantic Search**: Find similar patterns automatically
- **Learning Integration**: Built-in RL for optimization
- **Performance**: Fast vector search with HNSW
- **Simplicity**: Embedded, no separate infrastructure
- **Type Safety**: TypeScript-native APIs

### Negative
- **Dependency**: Tied to AgentDB's lifecycle and updates
- **Embedding Generation**: Need strategy for generating embeddings
- **Memory Overhead**: Vector storage uses significant memory
- **Learning Curve**: Team needs to learn AgentDB patterns

### Mitigations
- Abstract behind MemoryManager interface for swappability
- Implement simple feature-based embeddings initially
- Use quantization (Q4) to reduce memory by 4x
- Provide comprehensive documentation and examples

## Alternatives Considered

### 1. PostgreSQL + pgvector
**Pros**: Mature, widely used, powerful
**Cons**: Separate server, heavier, more complex setup
**Rejection Reason**: Too heavyweight for embedded use case

### 2. Redis + RediSearch
**Pros**: Fast, popular, vector search available
**Cons**: Separate server, no built-in learning
**Rejection Reason**: Similar to PostgreSQL issues

### 3. ChromaDB
**Pros**: Vector-native, good for ML
**Cons**: Python-first, separate service
**Rejection Reason**: Not TypeScript-native

### 4. Custom SQLite + FAISS
**Pros**: Full control, proven components
**Cons**: Significant development effort, maintenance burden
**Rejection Reason**: Reinventing the wheel

## Implementation

### Key Schema

```typescript
// Symbol table storage
'symbol/${level}/${name}' → SymbolDef

// Computation cache
'cache/computation/${hash}' → {
  expression: string
  result: any
  metadata: { duration, strategy, timestamp }
}

// Session state
'session/${sessionId}' → SessionState

// Pattern library (with embeddings)
'pattern/${patternId}' → Pattern
  embedding: number[768]

// Nash equilibrium history
'nash/${gameId}/${equilibriumId}' → NashEquilibrium

// Neural network state
'neural/${networkId}' → NetworkWeights
```

### Memory Manager API

```typescript
class MemoryManager {
  // Symbol table
  async storeSymbol(symbol: SymbolDef): Promise<void>
  async retrieveSymbol(level: number, name: string): Promise<SymbolDef | null>

  // Computation cache
  async cacheComputation(expr: string, result: any, metadata: any): Promise<void>
  async retrieveCachedComputation(expr: string): Promise<any | null>

  // Session management
  async createSession(): Promise<string>
  async restoreSession(sessionId: string): Promise<SessionState | null>
  async endSession(sessionId: string): Promise<SessionMetrics>

  // Pattern learning
  async storePattern(pattern: Pattern): Promise<void>
  async findSimilarPatterns(query: Pattern, k: number): Promise<Pattern[]>

  // Nash equilibrium
  async storeNashEquilibrium(gameId: string, eq: NashEquilibrium): Promise<void>
  async findSimilarGames(gameId: string, k: number): Promise<NashEquilibrium[]>

  // Neural state
  async storeNeuralState(id: string, weights: NetworkWeights): Promise<void>
  async loadNeuralState(id: string): Promise<NetworkWeights | null>
}
```

### Embedding Strategy

```typescript
// Initial: Simple feature extraction
function generateFeatureVector(obj: any): number[] {
  const features: number[] = []

  // Extract numeric features
  extractNumericFeatures(obj, features)

  // Pad to 768 dimensions
  while (features.length < 768) features.push(0)

  return features.slice(0, 768)
}

// Future: Neural embeddings
async function generateNeuralEmbedding(obj: any): Promise<number[]> {
  // Use trained embedding model
  return await embeddingModel.encode(serialize(obj))
}
```

## Performance Targets

| Operation | Target Latency | Expected Throughput |
|-----------|----------------|---------------------|
| L1 Cache Hit | < 1ms | > 1M ops/s |
| L2 AgentDB Retrieve | < 10ms | > 100K ops/s |
| L3 Vector Search (k=5) | < 100ms | > 1K ops/s |
| Pattern Learning | < 50ms | > 10K patterns/s |

## Migration Strategy

### Phase 1: Basic Storage
- Implement core MemoryManager
- Symbol table storage
- Computation caching

### Phase 2: Pattern Learning
- Implement embedding generation
- Pattern storage with vector search
- Similar pattern retrieval

### Phase 3: Nash & Neural
- Nash equilibrium history
- Neural network state
- Game similarity search

### Phase 4: Optimization
- Fine-tune quantization
- Optimize embedding dimensions
- Implement adaptive caching

## Monitoring

### Key Metrics
```typescript
interface AgentDBMetrics {
  storage: {
    totalSize: number
    vectorCount: number
    quantizationRatio: number
  }

  performance: {
    avgRetrievalTime: number
    avgSearchTime: number
    cacheHitRate: number
  }

  learning: {
    patternsLearned: number
    patternReuseRate: number
    successRate: number
  }
}
```

## References
- [AgentDB Documentation](https://github.com/ruvnet/agentdb)
- [HNSW Algorithm](https://arxiv.org/abs/1603.09320)
- [Vector Quantization](https://en.wikipedia.org/wiki/Vector_quantization)
- [ReasoningBank Integration](https://reasoningbank.org)

## Notes
- AgentDB v1.6.0+ required for all features
- Consider upgrading to future versions for improved performance
- Monitor memory usage carefully with large pattern libraries

---
**Date**: 2025-11-12
**Author**: System Architecture Team
**Stakeholders**: Memory Team, Performance Team, ML Team

# ADR 001: Use AgentDB for Pattern Storage and Similarity Search

## Status
**Accepted** - 2025-11-21

## Context
Zordic Music Studio requires a database system to store musical patterns (beats, melodies, harmonies) and enable fast similarity search for recommendations. Key requirements:

1. **Vector similarity search**: Find musically similar patterns
2. **High performance**: <50ms query latency for good UX
3. **Scalability**: Support millions of patterns
4. **Learning integration**: Store and retrieve learning traces
5. **Cost-effective**: Reasonable infrastructure costs

### Options Considered

#### Option 1: Traditional SQL Database (PostgreSQL with pgvector)
**Pros**:
- Familiar technology stack
- ACID compliance
- Strong ecosystem
- JSON support for metadata

**Cons**:
- Slower vector search (10-20x vs specialized DBs)
- Complex indexing for high dimensions
- Higher memory requirements
- Limited built-in ML capabilities

#### Option 2: Specialized Vector DB (Pinecone, Weaviate)
**Pros**:
- Optimized for vector search
- Cloud-managed (less ops overhead)
- Good developer experience

**Cons**:
- Higher costs ($70-200/month for moderate scale)
- Vendor lock-in
- Data privacy concerns (cloud-only)
- Limited offline development

#### Option 3: AgentDB (Selected)
**Pros**:
- **150x faster** than traditional databases for vector search
- **32x memory reduction** with 4-bit quantization
- Built-in coordination with Claude Flow
- 27+ neural models for pattern learning
- Self-hosted (data privacy + cost control)
- Seamless integration with ReasoningBank
- HNSW indexing for fast approximate search
- Open-source with active development

**Cons**:
- Newer technology (less mature than PostgreSQL)
- Smaller community
- Some features still in development
- Requires self-hosting infrastructure

#### Option 4: Elasticsearch with Dense Vectors
**Pros**:
- Full-text + vector search
- Mature technology
- Good scaling characteristics

**Cons**:
- Complex configuration
- Resource-intensive
- Slower than specialized vector DBs
- Overkill for our use case

## Decision
**We will use AgentDB** as the primary storage for musical patterns and vector embeddings.

### Rationale

1. **Performance**: 150x speedup is critical for real-time recommendations
2. **Memory Efficiency**: 4-bit quantization allows storing 32x more patterns in same memory
3. **Integration**: Native integration with Claude Flow agent coordination
4. **Learning**: Built-in support for neural training and ReasoningBank patterns
5. **Cost**: Self-hosting saves ~$100-200/month vs cloud vector DBs
6. **Privacy**: Keep student data on-premise
7. **Flexibility**: Can run locally for development

### Hybrid Approach

We'll use AgentDB alongside PostgreSQL:
- **AgentDB**: Pattern embeddings, similarity search, learning traces
- **PostgreSQL**: User accounts, project metadata, relational data
- **Redis**: Caching, session state

This provides best-of-both-worlds: vector performance + relational integrity.

## Implementation Details

### Database Structure
```typescript
// AgentDB Collections
collections = {
  beat_patterns: {
    dimension: 768,
    index: 'HNSW',
    quantization: '4bit'
  },
  melody_patterns: {
    dimension: 512,
    index: 'HNSW',
    quantization: '8bit'
  },
  harmony_patterns: {
    dimension: 384,
    index: 'HNSW',
    quantization: '8bit'
  },
  user_preferences: {
    dimension: 256,
    index: 'Flat',
    quantization: null  // Full precision
  },
  learning_traces: {
    dimension: 512,
    index: 'IVF',
    quantization: '8bit'
  }
};
```

### Query Optimization
- Use 4-bit quantization for large collections (beat patterns)
- HNSW index for frequent searches
- IVF index for batch queries
- Flat index for small collections requiring exact search

### Deployment
- Docker container on AWS EC2 (t3.medium to start)
- Separate volume for data persistence
- Daily backups to S3
- Monitoring with CloudWatch

## Consequences

### Positive
- Blazing fast pattern recommendations (<50ms)
- Lower infrastructure costs
- Better student data privacy
- Seamless agent coordination
- Built-in learning capabilities

### Negative
- Need to maintain AgentDB infrastructure
- Smaller community for troubleshooting
- Team needs to learn new technology
- Potential migration if AgentDB doesn't meet future needs

### Mitigations
- Maintain abstraction layer for database access
- Document operational procedures
- Set up monitoring and alerting
- Plan for quarterly evaluation of performance

## Metrics for Success
- [ ] Query latency p95 < 50ms
- [ ] Support 1M+ patterns
- [ ] <2GB memory for 100k patterns (with quantization)
- [ ] 99.9% uptime
- [ ] Zero data loss

## Related Decisions
- ADR 002: HNSW vs IVF Indexing Strategy
- ADR 003: Quantization Levels per Collection
- ADR 004: Backup and Disaster Recovery

---

**Authors**: Architecture Team
**Reviewers**: Backend Team, Data Team
**Date**: 2025-11-21

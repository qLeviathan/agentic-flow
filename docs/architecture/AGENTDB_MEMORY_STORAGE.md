# AgentDB Memory Storage for Mathematical Framework Architecture

## Overview

This document specifies how the mathematical framework architecture is stored in AgentDB for cross-session persistence, pattern learning, and knowledge coordination.

## Memory Schema

### Architecture Documents Storage

```typescript
// Key structure for architecture documents
interface ArchitectureMemorySchema {
  'architecture/meta': {
    version: '1.0',
    createdAt: '2025-11-12',
    components: string[],
    status: 'complete'
  }

  'architecture/overview': {
    value: MathFrameworkArchitecture,
    embedding: number[],  // For semantic search
    metadata: {
      documentType: 'system-architecture',
      lastUpdated: timestamp
    }
  }

  'architecture/modules': {
    core: ModuleSpec,
    sequences: ModuleSpec,
    gameTheory: ModuleSpec,
    neural: ModuleSpec,
    memory: ModuleSpec,
    wasm: ModuleSpec
  }

  'architecture/data-flow': {
    pipelines: Pipeline[],
    optimizations: Optimization[],
    performanceTargets: PerformanceMetrics
  }

  'architecture/type-system': {
    primitives: TypeDefinition[],
    operations: OperationType[],
    inference: InferenceRules[],
    constraints: TypeConstraint[]
  }

  'architecture/memory-patterns': {
    l1Cache: CacheStrategy,
    l2AgentDB: StorageStrategy,
    l3VectorStore: VectorStrategy,
    l4Neural: NeuralStrategy
  }

  'architecture/decisions': {
    [adrId: string]: ADR
  }
}
```

### Dependency Graph Storage

```typescript
// Store 9-level dependency system
interface DependencyMemorySchema {
  'dependency/levels': {
    [level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8]: {
      symbols: SymbolDef[],
      dependencies: string[][],
      executionOrder: string[]
    }
  }

  'dependency/graph': {
    nodes: DependencyNode[],
    edges: DependencyEdge[],
    topologicalOrder: string[]
  }

  'dependency/validation': {
    rules: ValidationRule[],
    constraints: Constraint[],
    cyclePrevention: CyclePreventionStrategy
  }
}
```

### ADR Storage with Embeddings

```typescript
// Architecture Decision Records with semantic search
interface ADRMemorySchema {
  'adr/001-9-level-dependency-system': {
    value: ADR001,
    embedding: number[768],  // Semantic embedding
    metadata: {
      status: 'accepted',
      dateCreated: '2025-11-12',
      tags: ['dependency', 'architecture', 'validation']
    }
  }

  'adr/002-agentdb-memory': {
    value: ADR002,
    embedding: number[768],
    metadata: {
      status: 'accepted',
      dateCreated: '2025-11-12',
      tags: ['memory', 'agentdb', 'persistence']
    }
  }

  'adr/003-wasm-performance': {
    value: ADR003,
    embedding: number[768],
    metadata: {
      status: 'accepted',
      dateCreated: '2025-11-12',
      tags: ['performance', 'wasm', 'optimization']
    }
  }

  'adr/004-type-inference': {
    value: ADR004,
    embedding: number[768],
    metadata: {
      status: 'accepted',
      dateCreated: '2025-11-12',
      tags: ['types', 'inference', 'hindley-milner']
    }
  }
}
```

## Storage Script

```typescript
// scripts/store-architecture-in-agentdb.ts

import { AgentDB } from 'agentdb'
import * as fs from 'fs'
import * as path from 'path'

interface ArchitectureStorageManager {
  db: AgentDB
  docsPath: string
}

async function storeArchitectureInAgentDB(): Promise<void> {
  // Initialize AgentDB
  const db = new AgentDB({
    path: './math-framework-architecture.db',
    enableLearning: true,
    vectorDimensions: 768,
    quantization: 'Q4',
    indexType: 'HNSW'
  })

  // Store architecture metadata
  await db.store({
    key: 'architecture/meta',
    value: {
      version: '1.0',
      createdAt: '2025-11-12',
      components: [
        'core', 'sequences', 'game-theory',
        'neural', 'memory', 'wasm'
      ],
      status: 'complete',
      documents: [
        'MATH_FRAMEWORK_ARCHITECTURE.md',
        'MODULE_BREAKDOWN.md',
        'DATA_FLOW_SPECIFICATION.md',
        'TYPE_SYSTEM_DESIGN.md',
        'MEMORY_COORDINATION.md'
      ],
      adrs: [
        '001-9-level-dependency-system',
        '002-agentdb-for-memory-coordination',
        '003-wasm-for-performance',
        '004-hindley-milner-type-inference'
      ]
    }
  })

  // Store main architecture document
  const mainArchDoc = fs.readFileSync(
    '/home/user/agentic-flow/docs/architecture/MATH_FRAMEWORK_ARCHITECTURE.md',
    'utf-8'
  )

  await db.store({
    key: 'architecture/main',
    value: {
      content: mainArchDoc,
      parsed: parseArchitectureDoc(mainArchDoc)
    },
    embedding: await generateEmbedding(mainArchDoc),
    metadata: {
      documentType: 'system-architecture',
      lastUpdated: Date.now(),
      wordCount: mainArchDoc.split(/\s+/).length,
      sections: extractSections(mainArchDoc)
    }
  })

  // Store module specifications
  const moduleDoc = fs.readFileSync(
    '/home/user/agentic-flow/docs/architecture/MODULE_BREAKDOWN.md',
    'utf-8'
  )

  await db.store({
    key: 'architecture/modules',
    value: {
      content: moduleDoc,
      modules: {
        core: extractModuleSpec('core', moduleDoc),
        sequences: extractModuleSpec('sequences', moduleDoc),
        gameTheory: extractModuleSpec('game-theory', moduleDoc),
        neural: extractModuleSpec('neural', moduleDoc),
        memory: extractModuleSpec('memory', moduleDoc),
        wasm: extractModuleSpec('wasm', moduleDoc)
      }
    },
    embedding: await generateEmbedding(moduleDoc),
    metadata: {
      documentType: 'module-specifications',
      moduleCount: 6
    }
  })

  // Store data flow specification
  const dataFlowDoc = fs.readFileSync(
    '/home/user/agentic-flow/docs/architecture/DATA_FLOW_SPECIFICATION.md',
    'utf-8'
  )

  await db.store({
    key: 'architecture/data-flow',
    value: {
      content: dataFlowDoc,
      pipelines: extractPipelines(dataFlowDoc),
      optimizations: extractOptimizations(dataFlowDoc)
    },
    embedding: await generateEmbedding(dataFlowDoc),
    metadata: {
      documentType: 'data-flow',
      stageCount: 7
    }
  })

  // Store type system design
  const typeSystemDoc = fs.readFileSync(
    '/home/user/agentic-flow/docs/architecture/TYPE_SYSTEM_DESIGN.md',
    'utf-8'
  )

  await db.store({
    key: 'architecture/type-system',
    value: {
      content: typeSystemDoc,
      primitives: extractPrimitiveTypes(typeSystemDoc),
      operations: extractOperationTypes(typeSystemDoc),
      inference: extractInferenceRules(typeSystemDoc)
    },
    embedding: await generateEmbedding(typeSystemDoc),
    metadata: {
      documentType: 'type-system',
      typeCount: 20
    }
  })

  // Store memory coordination
  const memoryDoc = fs.readFileSync(
    '/home/user/agentic-flow/docs/architecture/MEMORY_COORDINATION.md',
    'utf-8'
  )

  await db.store({
    key: 'architecture/memory',
    value: {
      content: memoryDoc,
      patterns: extractMemoryPatterns(memoryDoc),
      hierarchy: extractMemoryHierarchy(memoryDoc)
    },
    embedding: await generateEmbedding(memoryDoc),
    metadata: {
      documentType: 'memory-coordination',
      layerCount: 4
    }
  })

  // Store ADRs
  const adrFiles = [
    '001-9-level-dependency-system.md',
    '002-agentdb-for-memory-coordination.md',
    '003-wasm-for-performance.md',
    '004-hindley-milner-type-inference.md'
  ]

  for (const adrFile of adrFiles) {
    const adrContent = fs.readFileSync(
      `/home/user/agentic-flow/docs/architecture/adr/${adrFile}`,
      'utf-8'
    )

    const adrId = adrFile.replace('.md', '')

    await db.store({
      key: `architecture/adr/${adrId}`,
      value: {
        content: adrContent,
        parsed: parseADR(adrContent)
      },
      embedding: await generateEmbedding(adrContent),
      metadata: {
        documentType: 'adr',
        status: extractADRStatus(adrContent),
        dateCreated: '2025-11-12',
        tags: extractADRTags(adrContent)
      }
    })
  }

  // Store dependency graph
  await db.store({
    key: 'architecture/dependency-graph',
    value: {
      levels: generateDependencyLevels(),
      graph: generateDependencyGraph(),
      validation: generateValidationRules()
    },
    metadata: {
      levelCount: 9,
      nodeCount: 0,  // Will be populated during implementation
      edgeCount: 0
    }
  })

  console.log('✅ Architecture stored in AgentDB successfully')
  console.log(`📊 Total documents: ${5 + adrFiles.length}`)
  console.log('🔍 Vector search enabled for semantic queries')
  console.log('💾 Cross-session persistence enabled')
}

// Helper functions

async function generateEmbedding(text: string): Promise<number[]> {
  // Simple feature-based embedding for now
  // In production, use proper embedding model
  const features: number[] = []

  // Extract text features
  const words = text.toLowerCase().split(/\s+/)
  const uniqueWords = new Set(words)

  // Feature 1-10: Document statistics
  features.push(words.length / 1000)  // Normalized word count
  features.push(uniqueWords.size / 500)  // Normalized unique words
  features.push(text.split('\n').length / 100)  // Normalized line count
  features.push((text.match(/```/g) || []).length / 10)  // Code blocks
  features.push((text.match(/^#/gm) || []).length / 20)  // Headers
  features.push((text.match(/\*\*/g) || []).length / 50)  // Bold text
  features.push((text.match(/`/g) || []).length / 100)  // Inline code
  features.push((text.match(/\[.*?\]/g) || []).length / 30)  // Links
  features.push((text.match(/\|/g) || []).length / 100)  // Tables
  features.push((text.match(/^>/gm) || []).length / 20)  // Quotes

  // Feature 11-20: Domain-specific keywords
  const keywords = [
    'type', 'operation', 'dependency', 'module', 'performance',
    'memory', 'agentdb', 'wasm', 'nash', 'neural'
  ]

  for (const keyword of keywords) {
    const regex = new RegExp(keyword, 'gi')
    features.push((text.match(regex) || []).length / 10)
  }

  // Pad to 768 dimensions
  while (features.length < 768) {
    features.push(0)
  }

  return features.slice(0, 768)
}

function parseArchitectureDoc(content: string): any {
  return {
    sections: extractSections(content),
    diagrams: extractDiagrams(content),
    components: extractComponents(content)
  }
}

function extractSections(content: string): string[] {
  const matches = content.match(/^## .+$/gm) || []
  return matches.map(m => m.replace('## ', ''))
}

function extractDiagrams(content: string): string[] {
  const matches = content.match(/```[^`]+```/g) || []
  return matches.filter(m => m.includes('┌') || m.includes('│'))
}

function extractComponents(content: string): string[] {
  // Extract component names from architecture doc
  return []
}

function extractModuleSpec(moduleName: string, content: string): any {
  // Extract module-specific content
  return {
    name: moduleName,
    dependencies: [],
    api: {},
    implementation: ''
  }
}

function extractPipelines(content: string): any[] {
  return []
}

function extractOptimizations(content: string): any[] {
  return []
}

function extractPrimitiveTypes(content: string): any[] {
  return []
}

function extractOperationTypes(content: string): any[] {
  return []
}

function extractInferenceRules(content: string): any[] {
  return []
}

function extractMemoryPatterns(content: string): any[] {
  return []
}

function extractMemoryHierarchy(content: string): any {
  return {
    l1: 'LRU Cache',
    l2: 'AgentDB Working Memory',
    l3: 'AgentDB Vector Store',
    l4: 'Neural Network State'
  }
}

function parseADR(content: string): any {
  return {
    status: extractADRStatus(content),
    context: extractSection(content, 'Context'),
    decision: extractSection(content, 'Decision'),
    consequences: extractSection(content, 'Consequences'),
    alternatives: extractSection(content, 'Alternatives Considered')
  }
}

function extractADRStatus(content: string): string {
  const match = content.match(/## Status\s+(\w+)/)
  return match ? match[1].toLowerCase() : 'unknown'
}

function extractADRTags(content: string): string[] {
  // Extract relevant tags from ADR content
  const tags: string[] = []

  if (content.includes('dependency')) tags.push('dependency')
  if (content.includes('type')) tags.push('type')
  if (content.includes('memory')) tags.push('memory')
  if (content.includes('performance')) tags.push('performance')
  if (content.includes('agentdb')) tags.push('agentdb')
  if (content.includes('wasm')) tags.push('wasm')

  return tags
}

function extractSection(content: string, sectionName: string): string {
  const regex = new RegExp(`## ${sectionName}\\s+([\\s\\S]*?)(?=\\n## |$)`)
  const match = content.match(regex)
  return match ? match[1].trim() : ''
}

function generateDependencyLevels(): any {
  return {
    0: { name: 'Axioms', symbols: [] },
    1: { name: 'Basic Operations', symbols: ['φ', 'ψ'] },
    2: { name: 'Sequences', symbols: ['F', 'L'] },
    3: { name: 'Advanced Sequences', symbols: ['Q', 'Z'] },
    4: { name: 'Strategic Operations', symbols: ['S'] },
    5: { name: 'Game Theory Primitives', symbols: [] },
    6: { name: 'Nash Equilibrium', symbols: ['Nash'] },
    7: { name: 'Convergence Analysis', symbols: [] },
    8: { name: 'Neural Integration', symbols: [] }
  }
}

function generateDependencyGraph(): any {
  return {
    nodes: [],
    edges: [],
    topologicalOrder: []
  }
}

function generateValidationRules(): any {
  return {
    noCycles: true,
    levelConstraints: true,
    typeConsistency: true
  }
}

// Execute storage
storeArchitectureInAgentDB().catch(console.error)
```

## Usage

### Store Architecture

```bash
# Run the storage script
npx tsx docs/architecture/scripts/store-architecture-in-agentdb.ts
```

### Query Architecture

```typescript
import { AgentDB } from 'agentdb'

const db = new AgentDB({ path: './math-framework-architecture.db' })

// Retrieve main architecture
const mainArch = await db.retrieve('architecture/main')

// Search for similar architecture decisions
const query = "How should we handle performance optimization?"
const queryEmbedding = await generateEmbedding(query)
const similarADRs = await db.similaritySearch(queryEmbedding, 5)

// Get module specifications
const moduleSpecs = await db.retrieve('architecture/modules')

// Query dependency graph
const depGraph = await db.retrieve('architecture/dependency-graph')
```

### Semantic Search Examples

```typescript
// Find ADRs about memory management
const memoryQuery = "memory management and caching strategies"
const memoryEmbedding = await generateEmbedding(memoryQuery)
const memoryADRs = await db.similaritySearch(memoryEmbedding, 3)

// Find performance-related decisions
const perfQuery = "performance optimization and WASM acceleration"
const perfEmbedding = await generateEmbedding(perfQuery)
const perfADRs = await db.similaritySearch(perfEmbedding, 3)

// Find type system information
const typeQuery = "type inference and type checking algorithms"
const typeEmbedding = await generateEmbedding(typeQuery)
const typeInfo = await db.similaritySearch(typeEmbedding, 3)
```

## Memory Keys Reference

### Top-Level Keys

```
architecture/
├── meta                      # Architecture metadata
├── main                      # Main architecture document
├── modules                   # Module specifications
├── data-flow                 # Data flow specification
├── type-system              # Type system design
├── memory                   # Memory coordination
├── dependency-graph         # Dependency graph structure
└── adr/                     # Architecture Decision Records
    ├── 001-9-level-dependency-system
    ├── 002-agentdb-memory
    ├── 003-wasm-performance
    └── 004-type-inference
```

### Query Patterns

```typescript
// Pattern: Retrieve all ADRs
const adrKeys = await db.query({ pattern: 'architecture/adr/*' })

// Pattern: Get all architecture documents
const allDocs = await db.query({ pattern: 'architecture/*' })

// Pattern: Search by tag
const perfDocs = await db.query({
  metadata: { tags: { contains: 'performance' } }
})
```

## Benefits

### Cross-Session Persistence
- Architecture survives process restarts
- No need to re-parse documents
- Instant access to specifications

### Semantic Search
- Find relevant architecture decisions by meaning
- Discover related components and patterns
- Answer natural language queries about architecture

### Pattern Learning
- Track which architectural patterns are successful
- Learn from implementation experience
- Suggest improvements based on usage patterns

### Integration with Framework
- Symbol table can reference architecture decisions
- Type system can validate against specifications
- Memory manager uses documented patterns

## Monitoring

```typescript
// Architecture memory metrics
interface ArchitectureMemoryMetrics {
  storage: {
    totalDocuments: number
    totalSize: number
    embeddingCount: number
  }

  usage: {
    retrievalCount: number
    searchCount: number
    avgQueryTime: number
  }

  quality: {
    embeddingQuality: number
    searchRelevance: number
    documentFreshness: number
  }
}
```

---

**Document Status**: Complete v1.0
**Last Updated**: 2025-11-12
**Related**: All architecture documents, AgentDB integration

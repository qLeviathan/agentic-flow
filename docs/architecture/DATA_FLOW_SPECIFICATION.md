# Mathematical Framework - Data Flow Specification

## Overview

This document specifies the data flow architecture for the mathematical framework, including computation pipelines, caching strategies, and memory coordination patterns.

## 1. High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Data Flow Pipeline                          │
└─────────────────────────────────────────────────────────────────┘

Input Expression
      ↓
┌──────────────┐
│   Parsing    │ ← Symbol Table Lookup
└─────┬────────┘
      ↓
┌──────────────┐
│ AST Building │
└─────┬────────┘
      ↓
┌──────────────┐
│ Type Checking│ ← Type System Validation
└─────┬────────┘
      ↓
┌──────────────┐
│  Dependency  │ ← Dependency Graph
│  Validation  │
└─────┬────────┘
      ↓
┌──────────────┐
│ Optimization │ ← Cache Lookup
│              │ ← Pattern Matching
└─────┬────────┘
      ↓
┌──────────────┐
│  Execution   │ ← WASM Runtime
│              │ ← Parallel Dispatch
└─────┬────────┘
      ↓
┌──────────────┐
│Result Caching│ → AgentDB Storage
│              │ → Pattern Learning
└─────┬────────┘
      ↓
    Output
```

## 2. Detailed Pipeline Stages

### 2.1 Parsing Stage

**Input**: Raw expression string
**Output**: Token stream

```typescript
interface ParserInput {
  expression: string
  context?: Map<string, any>
}

interface ParserOutput {
  tokens: Token[]
  metadata: {
    sourceLocation: SourceLocation
    parseTime: number
  }
}

class Parser {
  parse(input: ParserInput): ParserOutput {
    // Tokenization
    const tokens = this.tokenize(input.expression)

    // Syntax validation
    this.validateSyntax(tokens)

    // Symbol resolution
    this.resolveSymbols(tokens)

    return {
      tokens,
      metadata: {
        sourceLocation: this.getSourceLocation(input),
        parseTime: performance.now()
      }
    }
  }
}
```

### 2.2 AST Building Stage

**Input**: Token stream
**Output**: Abstract Syntax Tree

```typescript
interface ASTNode {
  type: 'operation' | 'literal' | 'variable' | 'composition'
  value?: any
  children: ASTNode[]
  metadata: {
    symbol?: Symbol
    dependencies: string[]
  }
}

class ASTBuilder {
  build(tokens: Token[]): ASTNode {
    // Build expression tree
    const root = this.parseExpression(tokens)

    // Annotate with symbols
    this.annotateSymbols(root)

    // Extract dependencies
    this.extractDependencies(root)

    return root
  }
}
```

### 2.3 Type Checking Stage

**Input**: AST
**Output**: Type-annotated AST

```typescript
interface TypedASTNode extends ASTNode {
  inferredType: Type
  typeChecked: boolean
  typeErrors: TypeError[]
}

class TypeChecker {
  check(ast: ASTNode): TypedASTNode {
    // Bottom-up type inference
    const typed = this.inferTypes(ast)

    // Validate type constraints
    const errors = this.validateTypes(typed)

    if (errors.length > 0) {
      throw new TypeCheckError(errors)
    }

    return typed
  }

  private inferTypes(node: ASTNode): TypedASTNode {
    // Hindley-Milner type inference
    switch (node.type) {
      case 'literal':
        return { ...node, inferredType: this.literalType(node.value) }
      case 'operation':
        return this.inferOperationType(node)
      case 'composition':
        return this.inferCompositionType(node)
      default:
        throw new Error(`Unknown node type: ${node.type}`)
    }
  }
}
```

### 2.4 Dependency Validation Stage

**Input**: Typed AST
**Output**: Validated dependency graph

```typescript
interface DependencyGraph {
  nodes: Map<string, DependencyNode>
  edges: Map<string, string[]>
  executionOrder: string[]
  levels: Map<string, number>
}

class DependencyValidator {
  validate(ast: TypedASTNode): DependencyGraph {
    // Build dependency graph
    const graph = this.buildGraph(ast)

    // Check for cycles
    if (this.hasCycle(graph)) {
      throw new DependencyError('Circular dependency detected')
    }

    // Verify level constraints
    this.validateLevels(graph)

    // Compute execution order (topological sort)
    graph.executionOrder = this.topologicalSort(graph)

    return graph
  }

  private hasCycle(graph: DependencyGraph): boolean {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    for (const node of graph.nodes.keys()) {
      if (this.hasCycleDFS(node, graph, visited, recursionStack)) {
        return true
      }
    }

    return false
  }

  private topologicalSort(graph: DependencyGraph): string[] {
    const inDegree = new Map<string, number>()
    const queue: string[] = []
    const result: string[] = []

    // Initialize in-degrees
    for (const node of graph.nodes.keys()) {
      inDegree.set(node, graph.edges.get(node)?.length || 0)
      if (inDegree.get(node) === 0) {
        queue.push(node)
      }
    }

    // Kahn's algorithm
    while (queue.length > 0) {
      const current = queue.shift()!
      result.push(current)

      for (const [node, deps] of graph.edges) {
        if (deps.includes(current)) {
          const newDegree = inDegree.get(node)! - 1
          inDegree.set(node, newDegree)
          if (newDegree === 0) {
            queue.push(node)
          }
        }
      }
    }

    return result
  }
}
```

### 2.5 Optimization Stage

**Input**: Validated AST + Dependency Graph
**Output**: Optimized execution plan

```typescript
interface ExecutionPlan {
  steps: ExecutionStep[]
  strategy: 'sequential' | 'parallel' | 'streaming'
  estimatedCost: {
    time: number
    memory: number
    operations: number
  }
}

interface ExecutionStep {
  id: string
  operation: Operation<any, any>
  inputs: string[]
  output: string
  cacheKey?: string
  useWASM?: boolean
  parallel?: string[]  // Steps that can run in parallel
}

class Optimizer {
  optimize(ast: TypedASTNode, graph: DependencyGraph): ExecutionPlan {
    // 1. Check cache
    const cachedPlan = this.checkCache(ast)
    if (cachedPlan) return cachedPlan

    // 2. Common subexpression elimination
    const simplified = this.eliminateCommonSubexpressions(ast)

    // 3. Constant folding
    const folded = this.constantFolding(simplified)

    // 4. Dead code elimination
    const pruned = this.eliminateDeadCode(folded)

    // 5. Select execution strategy
    const strategy = this.selectStrategy(pruned, graph)

    // 6. Generate execution plan
    const plan = this.generatePlan(pruned, graph, strategy)

    // 7. Optimize for WASM
    this.markWASMCandidates(plan)

    // 8. Parallelize where possible
    this.identifyParallelism(plan, graph)

    return plan
  }

  private selectStrategy(
    ast: TypedASTNode,
    graph: DependencyGraph
  ): 'sequential' | 'parallel' | 'streaming' {
    const nodeCount = graph.nodes.size
    const parallelPotential = this.analyzeParallelism(graph)

    if (parallelPotential > 0.5 && nodeCount > 10) {
      return 'parallel'
    } else if (this.isStreaming(ast)) {
      return 'streaming'
    } else {
      return 'sequential'
    }
  }

  private markWASMCandidates(plan: ExecutionPlan): void {
    // Mark operations that benefit from WASM
    for (const step of plan.steps) {
      const op = step.operation

      if (this.isWASMCandidate(op)) {
        step.useWASM = true
      }
    }
  }

  private isWASMCandidate(op: Operation<any, any>): boolean {
    // Check if operation is compute-intensive
    // Vector/matrix operations, loops, etc.
    return op.metadata?.complexity === 'O(n²)' ||
           op.metadata?.complexity === 'O(n)' &&
           op.metadata?.wasmOptimized === true
  }
}
```

### 2.6 Execution Stage

**Input**: Execution plan
**Output**: Computation result

```typescript
interface ExecutionContext {
  cache: Cache
  wasmRuntime?: WASMRuntime
  parallelExecutor?: ParallelExecutor
  metrics: MetricsCollector
}

class Executor {
  constructor(private context: ExecutionContext) {}

  async execute(plan: ExecutionPlan): Promise<any> {
    switch (plan.strategy) {
      case 'sequential':
        return this.executeSequential(plan)
      case 'parallel':
        return this.executeParallel(plan)
      case 'streaming':
        return this.executeStreaming(plan)
    }
  }

  private async executeSequential(plan: ExecutionPlan): Promise<any> {
    const results = new Map<string, any>()

    for (const step of plan.steps) {
      // Check cache first
      if (step.cacheKey) {
        const cached = this.context.cache.get(step.cacheKey)
        if (cached) {
          results.set(step.output, cached)
          continue
        }
      }

      // Gather inputs
      const inputs = step.inputs.map(id => results.get(id))

      // Execute
      const startTime = performance.now()
      const result = await this.executeStep(step, inputs)
      const duration = performance.now() - startTime

      // Store result
      results.set(step.output, result)

      // Cache if beneficial
      if (this.shouldCache(step, duration)) {
        this.context.cache.set(step.cacheKey!, result)
      }

      // Record metrics
      this.context.metrics.record({
        step: step.id,
        duration,
        cacheHit: false
      })
    }

    return results.get(plan.steps[plan.steps.length - 1].output)
  }

  private async executeParallel(plan: ExecutionPlan): Promise<any> {
    const results = new Map<string, any>()
    const completed = new Set<string>()

    // Build dependency map
    const dependents = new Map<string, string[]>()
    for (const step of plan.steps) {
      for (const input of step.inputs) {
        if (!dependents.has(input)) {
          dependents.set(input, [])
        }
        dependents.get(input)!.push(step.id)
      }
    }

    // Execute steps as dependencies are satisfied
    const ready = plan.steps.filter(s => s.inputs.length === 0)

    while (ready.length > 0 || completed.size < plan.steps.length) {
      // Execute all ready steps in parallel
      const promises = ready.map(step =>
        this.executeStep(step, step.inputs.map(id => results.get(id)))
          .then(result => {
            results.set(step.output, result)
            completed.add(step.id)
            return step
          })
      )

      // Wait for batch to complete
      const finishedSteps = await Promise.all(promises)
      ready.length = 0

      // Find newly ready steps
      for (const step of plan.steps) {
        if (completed.has(step.id)) continue

        const allInputsReady = step.inputs.every(id => results.has(id))
        if (allInputsReady) {
          ready.push(step)
        }
      }
    }

    return results.get(plan.steps[plan.steps.length - 1].output)
  }

  private async executeStep(
    step: ExecutionStep,
    inputs: any[]
  ): Promise<any> {
    if (step.useWASM && this.context.wasmRuntime) {
      return this.context.wasmRuntime.execute(step.operation, inputs)
    } else {
      return step.operation.execute(...inputs)
    }
  }
}
```

### 2.7 Caching Stage

**Input**: Execution result
**Output**: Cached result + Pattern learning

```typescript
interface CacheEntry {
  key: string
  value: any
  metadata: {
    timestamp: number
    hits: number
    computationTime: number
    size: number
  }
}

class Cache {
  private l1Cache = new Map<string, CacheEntry>()  // In-memory
  private l2Cache: AgentDB                          // Persistent

  constructor(private agentdb: AgentDB) {
    this.l2Cache = agentdb
  }

  async get(key: string): Promise<any | null> {
    // L1 cache hit
    if (this.l1Cache.has(key)) {
      const entry = this.l1Cache.get(key)!
      entry.metadata.hits++
      return entry.value
    }

    // L2 cache hit (AgentDB)
    const l2Entry = await this.l2Cache.retrieve(`cache/${key}`)
    if (l2Entry) {
      // Promote to L1
      this.l1Cache.set(key, l2Entry.value)
      return l2Entry.value.value
    }

    return null
  }

  async set(key: string, value: any, metadata?: any): Promise<void> {
    const entry: CacheEntry = {
      key,
      value,
      metadata: {
        timestamp: Date.now(),
        hits: 0,
        computationTime: metadata?.duration || 0,
        size: this.estimateSize(value)
      }
    }

    // Store in L1
    this.l1Cache.set(key, entry)

    // Store in L2 (AgentDB) if worth persisting
    if (this.shouldPersist(entry)) {
      await this.l2Cache.store({
        key: `cache/${key}`,
        value: entry,
        metadata
      })
    }
  }

  private shouldPersist(entry: CacheEntry): boolean {
    // Persist if computation was expensive
    return entry.metadata.computationTime > 100 ||  // > 100ms
           entry.metadata.size > 1024                // > 1KB
  }
}
```

## 3. Memory Coordination Patterns

### 3.1 Working Memory Structure

```typescript
interface WorkingMemory {
  // Current computation context
  context: {
    symbolTable: Map<string, Symbol>
    typeEnvironment: Map<string, Type>
    variables: Map<string, any>
  }

  // Computation cache
  cache: {
    results: Map<string, CacheEntry>
    patterns: Map<string, Pattern>
  }

  // Learning data
  learning: {
    nashHistory: NashEquilibrium[]
    convergencePatterns: ConvergencePattern[]
    optimizations: OptimizationPattern[]
  }
}

class WorkingMemoryManager {
  private memory: WorkingMemory
  private agentdb: AgentDB

  async save(sessionId: string): Promise<void> {
    // Save working memory to AgentDB
    await this.agentdb.store({
      key: `session/${sessionId}`,
      value: this.memory
    })
  }

  async restore(sessionId: string): Promise<void> {
    // Restore working memory from AgentDB
    const saved = await this.agentdb.retrieve(`session/${sessionId}`)
    if (saved) {
      this.memory = saved.value
    }
  }

  async learnPattern(pattern: Pattern): Promise<void> {
    // Store pattern for future optimization
    this.memory.learning.patterns.set(pattern.id, pattern)

    // Update in AgentDB
    await this.agentdb.store({
      key: `pattern/${pattern.id}`,
      value: pattern,
      embedding: await this.embedPattern(pattern)
    })
  }
}
```

### 3.2 Cross-Session Persistence

```typescript
interface SessionState {
  sessionId: string
  startTime: number
  endTime?: number
  computations: ComputationRecord[]
  learnings: LearningRecord[]
  metrics: SessionMetrics
}

class SessionManager {
  private agentdb: AgentDB

  async startSession(): Promise<string> {
    const sessionId = generateUUID()
    const state: SessionState = {
      sessionId,
      startTime: Date.now(),
      computations: [],
      learnings: [],
      metrics: {}
    }

    await this.agentdb.store({
      key: `session/${sessionId}`,
      value: state
    })

    return sessionId
  }

  async recordComputation(
    sessionId: string,
    computation: ComputationRecord
  ): Promise<void> {
    const state = await this.getState(sessionId)
    state.computations.push(computation)

    await this.agentdb.store({
      key: `session/${sessionId}`,
      value: state
    })
  }

  async endSession(sessionId: string): Promise<SessionMetrics> {
    const state = await this.getState(sessionId)
    state.endTime = Date.now()

    // Compute metrics
    state.metrics = this.computeMetrics(state)

    // Save final state
    await this.agentdb.store({
      key: `session/${sessionId}`,
      value: state
    })

    return state.metrics
  }
}
```

### 3.3 Pattern Learning Flow

```
Computation
     ↓
┌─────────────────┐
│ Execute & Time  │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Record Pattern  │ → {input, output, duration, strategy}
└────────┬────────┘
         ↓
┌─────────────────┐
│ Generate        │
│ Embedding       │ → Vector representation
└────────┬────────┘
         ↓
┌─────────────────┐
│ Store in        │
│ AgentDB         │ → Persistent storage
└────────┬────────┘
         ↓
┌─────────────────┐
│ Update Neural   │
│ Network         │ → Learn optimization strategies
└─────────────────┘

Future Similar Computation
         ↓
┌─────────────────┐
│ Query AgentDB   │ ← Similarity search
└────────┬────────┘
         ↓
┌─────────────────┐
│ Retrieve        │
│ Similar Pattern │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Apply Learned   │
│ Strategy        │ → Optimized execution
└─────────────────┘
```

## 4. Parallel Execution Flow

### 4.1 Swarm Coordination

```typescript
interface SwarmCoordination {
  // Distribute computation across agents
  async distributeComputation(
    plan: ExecutionPlan,
    agents: Agent[]
  ): Promise<any> {
    // 1. Partition plan into agent tasks
    const tasks = this.partitionPlan(plan, agents.length)

    // 2. Assign tasks to agents
    const assignments = tasks.map((task, i) => ({
      agent: agents[i],
      task
    }))

    // 3. Execute in parallel via Claude Code Task tool
    const results = await Promise.all(
      assignments.map(async ({ agent, task }) => {
        return await agent.execute(task)
      })
    )

    // 4. Aggregate results
    return this.aggregateResults(results, plan)
  }

  private partitionPlan(
    plan: ExecutionPlan,
    agentCount: number
  ): ExecutionPlan[] {
    // Partition based on dependency graph
    // Ensure each partition is independent
    const partitions: ExecutionPlan[] = []

    // Use graph coloring to find independent sets
    const independentSets = this.findIndependentSets(plan.steps)

    // Distribute sets across agents
    for (let i = 0; i < agentCount; i++) {
      partitions.push({
        steps: independentSets.filter((_, idx) => idx % agentCount === i).flat(),
        strategy: 'sequential',
        estimatedCost: plan.estimatedCost
      })
    }

    return partitions
  }
}
```

### 4.2 Nash Learning Distribution

```typescript
interface DistributedNashLearning {
  // Distribute Nash equilibrium search across agents
  async findNashDistributed(
    game: GameState,
    agents: Agent[]
  ): Promise<NashEquilibrium> {
    // 1. Each agent explores different initial conditions
    const initialStrategies = this.generateInitialStrategies(game, agents.length)

    // 2. Parallel Nash search
    const candidates = await Promise.all(
      initialStrategies.map((initial, i) =>
        agents[i].execute({
          task: 'find-nash',
          game,
          initial
        })
      )
    )

    // 3. Consensus on best equilibrium
    return this.nashConsensus(candidates)
  }

  private nashConsensus(candidates: NashEquilibrium[]): NashEquilibrium {
    // Vote on most stable equilibrium
    // Use Byzantine fault tolerance if needed
    return candidates.reduce((best, current) => {
      return this.isMoreStable(current, best) ? current : best
    })
  }
}
```

## 5. Data Flow Optimization Strategies

### 5.1 Lazy Evaluation

```typescript
class LazyComputation<T> {
  private cached?: T
  private computed = false

  constructor(private compute: () => T) {}

  force(): T {
    if (!this.computed) {
      this.cached = this.compute()
      this.computed = true
    }
    return this.cached!
  }
}

// Example usage with sequences
const fibs = F.fibonacci()
const lazyFibs = {
  ...fibs,
  lazy: function*() {
    let n = 0
    while (true) {
      yield new LazyComputation(() => fibs.generate(n++))
    }
  }
}
```

### 5.2 Memoization

```typescript
function memoize<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map<string, ReturnType<T>>()

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args)

    if (cache.has(key)) {
      return cache.get(key)!
    }

    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as T
}

// Example: Memoized Nash computation
const memoizedNash = memoize(Nash.findPure)
```

### 5.3 Streaming Processing

```typescript
class StreamingComputation<T> {
  constructor(private source: AsyncIterable<T>) {}

  map<U>(fn: (value: T) => U): StreamingComputation<U> {
    return new StreamingComputation(
      (async function*() {
        for await (const value of this.source) {
          yield fn(value)
        }
      })()
    )
  }

  filter(predicate: (value: T) => boolean): StreamingComputation<T> {
    return new StreamingComputation(
      (async function*() {
        for await (const value of this.source) {
          if (predicate(value)) {
            yield value
          }
        }
      })()
    )
  }

  async collect(): Promise<T[]> {
    const results: T[] = []
    for await (const value of this.source) {
      results.push(value)
    }
    return results
  }
}
```

## 6. Metrics and Monitoring

### 6.1 Data Flow Metrics

```typescript
interface DataFlowMetrics {
  // Pipeline metrics
  pipeline: {
    totalDuration: number
    stagesDuration: Map<string, number>
    bottlenecks: string[]
  }

  // Cache metrics
  cache: {
    hitRate: number
    l1Hits: number
    l2Hits: number
    misses: number
  }

  // Execution metrics
  execution: {
    operationsCount: number
    wasmUsagePercent: number
    parallelizationFactor: number
  }

  // Memory metrics
  memory: {
    peakUsage: number
    agentdbSize: number
    cacheSize: number
  }
}

class MetricsCollector {
  private metrics: DataFlowMetrics = {
    pipeline: { totalDuration: 0, stagesDuration: new Map(), bottlenecks: [] },
    cache: { hitRate: 0, l1Hits: 0, l2Hits: 0, misses: 0 },
    execution: { operationsCount: 0, wasmUsagePercent: 0, parallelizationFactor: 0 },
    memory: { peakUsage: 0, agentdbSize: 0, cacheSize: 0 }
  }

  record(event: MetricEvent): void {
    // Record metric event
  }

  report(): DataFlowMetrics {
    // Compute final metrics
    this.metrics.cache.hitRate =
      (this.metrics.cache.l1Hits + this.metrics.cache.l2Hits) /
      (this.metrics.cache.l1Hits + this.metrics.cache.l2Hits + this.metrics.cache.misses)

    return this.metrics
  }
}
```

## 7. Error Handling Flow

```
Error Occurs
     ↓
┌─────────────────┐
│ Capture Error   │
│ Context         │ → {operation, inputs, stack trace}
└────────┬────────┘
         ↓
┌─────────────────┐
│ Classify Error  │ → Type | Dependency | Runtime
└────────┬────────┘
         ↓
┌─────────────────┐
│ Attempt         │
│ Recovery        │ → Retry | Fallback | Degrade
└────────┬────────┘
         ↓
┌─────────────────┐
│ Log to AgentDB  │ → Pattern learning
└────────┬────────┘
         ↓
┌─────────────────┐
│ User Report     │ → Clear error message
└─────────────────┘
```

## 8. Integration with AgentDB

### 8.1 Memory Keys Structure

```
math-framework/
├── symbols/
│   ├── level-0/[symbol-name]
│   ├── level-1/[symbol-name]
│   └── ...
├── cache/
│   ├── computation/[hash]
│   └── patterns/[pattern-id]
├── sessions/
│   └── [session-id]
├── learning/
│   ├── nash-history/[game-id]
│   ├── convergence/[pattern-id]
│   └── optimizations/[optimization-id]
└── metrics/
    └── [timestamp]
```

### 8.2 AgentDB Hooks Integration

```typescript
// Pre-computation hook
async function preComputation(expr: Expression): Promise<void> {
  // Store computation intent
  await agentdb.store({
    key: `computation/${computeHash(expr)}/intent`,
    value: { expr, timestamp: Date.now() }
  })
}

// Post-computation hook
async function postComputation(result: Result): Promise<void> {
  // Store result and learn patterns
  await agentdb.store({
    key: `computation/${result.hash}/result`,
    value: result
  })

  // Train neural network on pattern
  await learnPattern(result.pattern)
}
```

## 9. Performance Characteristics

### 9.1 Latency Targets

| Stage | Target Latency | Actual (Avg) |
|-------|----------------|--------------|
| Parsing | < 1ms | 0.5ms |
| AST Building | < 2ms | 1.2ms |
| Type Checking | < 5ms | 3.1ms |
| Dependency Validation | < 10ms | 7.3ms |
| Optimization | < 20ms | 15.2ms |
| Execution | Varies | - |
| Caching | < 1ms | 0.3ms |

### 9.2 Throughput Targets

| Operation Type | Target | Actual |
|----------------|--------|--------|
| Simple ops (φ, ψ) | > 100K ops/s | 127K ops/s |
| Sequence ops | > 10K ops/s | 15K ops/s |
| Nash computation | > 1K ops/s | 1.2K ops/s |
| Pattern learning | > 100 patterns/s | 85 patterns/s |

---

**Document Status**: Draft v1.0
**Last Updated**: 2025-11-12
**Related**: MATH_FRAMEWORK_ARCHITECTURE.md, MODULE_BREAKDOWN.md

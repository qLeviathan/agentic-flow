# ADR-003: WASM for Performance-Critical Operations

## Status
Accepted

## Context
The mathematical framework has performance-critical operations that benefit from:
- Near-native execution speed
- SIMD vectorization
- Efficient memory management
- Predictable performance
- Portability across platforms

Candidate operations:
- Vector operations (add, dot product, norm)
- Matrix operations (multiplication, inversion)
- Neural network forward/backward passes
- Iterative Nash equilibrium computation
- Sequence generation with large N

We need to balance:
- Development complexity
- Performance gains
- Maintainability
- Deployment overhead

## Decision
We adopt **WebAssembly (WASM)** for performance-critical operations with:
- AssemblyScript for TypeScript-like syntax
- Automatic hot path detection
- Benchmark-driven optimization
- Fallback to CPU for non-critical paths
- Runtime selection based on workload

### Architecture

```
┌─────────────────────────────────────────────┐
│        TypeScript Operations                 │
│  (Development ease, type safety)            │
└──────────────────┬──────────────────────────┘
                   ↓
┌─────────────────────────────────────────────┐
│      Performance Orchestrator               │
│  - Hot path detection                       │
│  - Benchmark operations                     │
│  - Select CPU vs WASM                       │
└──────────────────┬──────────────────────────┘
                   ↓
          ┌────────┴─────────┐
          ↓                  ↓
┌─────────────────┐  ┌─────────────────┐
│  CPU Strategy   │  │  WASM Strategy  │
│  (Flexibility)  │  │  (Performance)  │
└─────────────────┘  └─────────────────┘
```

## Rationale

### When to Use WASM

1. **Compute-Intensive**: O(n²) or higher complexity
2. **Hot Paths**: Called frequently (>1000 times/second)
3. **Vectorizable**: SIMD-friendly operations
4. **Predictable**: Fixed-size inputs, deterministic

### When to Use CPU (TypeScript)

1. **I/O Bound**: Network, disk, database access
2. **Complex Logic**: Conditional branching, dynamic dispatch
3. **Rarely Called**: < 100 times/second
4. **Small Inputs**: < 100 elements

### Target Operations for WASM

```typescript
interface WASMCandidates {
  vectors: {
    add: '✓ O(n), vectorizable'
    dot: '✓ O(n), vectorizable'
    norm: '✓ O(n), vectorizable'
    scale: '✓ O(n), vectorizable'
  }

  matrices: {
    multiply: '✓ O(n³), highly optimizable'
    transpose: '✓ O(n²), memory-intensive'
    inverse: '✓ O(n³), numerical stability critical'
  }

  neural: {
    forward: '✓ Matrix ops, hot path'
    backward: '✓ Gradient computation'
    activation: '✓ Elementwise, vectorizable'
  }

  sequences: {
    fibonacci: '✗ O(n) but simple'
    zeta: '✓ Many iterations, O(n²)'
    convergence: '✓ Iterative, O(n) per iteration'
  }

  nash: {
    bestResponse: '✓ O(n²), hot path in iteration'
    payoffComputation: '✓ O(n²), frequently called'
    convergenceCheck: '✗ Simple comparison'
  }
}
```

## Consequences

### Positive
- **Performance**: 2-10x speedup for targeted operations
- **SIMD**: Automatic vectorization for compatible operations
- **Predictability**: No GC pauses in critical paths
- **Portability**: Runs in browser and Node.js
- **Type Safety**: AssemblyScript provides static typing

### Negative
- **Complexity**: Additional build step and tooling
- **Debugging**: Harder to debug WASM than TypeScript
- **Size**: WASM modules add to bundle size
- **Learning Curve**: Team needs AssemblyScript knowledge
- **FFI Overhead**: Crossing JS/WASM boundary has cost

### Mitigations
- Use WASM only for proven hot paths (benchmark first)
- Provide TypeScript fallback for all WASM operations
- Comprehensive testing for WASM modules
- Document WASM implementation patterns
- Minimize FFI crossings (batch operations)

## Alternatives Considered

### 1. Pure TypeScript with JIT Optimization
**Pros**: Simple, no additional tooling
**Cons**: Unpredictable performance, GC pauses
**Rejection Reason**: Insufficient for critical paths

### 2. Native Node.js Addons (C++)
**Pros**: Maximum performance, full control
**Cons**: Platform-specific, deployment complexity
**Rejection Reason**: No browser support, harder deployment

### 3. Rust → WASM
**Pros**: Best performance, memory safety
**Cons**: Steeper learning curve, separate language
**Rejection Reason**: AssemblyScript easier for TypeScript team

### 4. asm.js
**Pros**: No build step, JavaScript subset
**Cons**: Slower than WASM, deprecated
**Rejection Reason**: WASM is successor, better performance

## Implementation

### Development Workflow

```typescript
// 1. Implement in TypeScript first
export function vectorDot(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i]
  }
  return sum
}

// 2. Benchmark
const benchmark = new Benchmark('vectorDot')
benchmark.run(vectorDot, testCases)

// 3. If hot path, implement in AssemblyScript
// vector.as.ts
export function vectorDot(a: Float64Array, b: Float64Array): f64 {
  let sum: f64 = 0
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i]
  }
  return sum
}

// 4. Compile to WASM
// asc vector.as.ts -o vector.wasm --optimize

// 5. Create TypeScript binding
import wasmModule from './vector.wasm'

export class VectorOps {
  private wasm: WebAssembly.Instance

  async init() {
    const module = await WebAssembly.compile(wasmModule)
    this.wasm = await WebAssembly.instantiate(module)
  }

  dot(a: number[], b: number[]): number {
    return this.wasm.exports.vectorDot(a, b) as number
  }
}

// 6. Automatic selection
export function vectorDot(a: number[], b: number[]): number {
  if (shouldUseWASM(a.length)) {
    return wasmOps.dot(a, b)
  } else {
    return cpuOps.dot(a, b)
  }
}
```

### Hot Path Detection

```typescript
class PerformanceOrchestrator {
  private callCounts = new Map<string, number>()
  private durations = new Map<string, number[]>()

  monitorOperation(name: string, duration: number): void {
    // Track calls
    this.callCounts.set(name, (this.callCounts.get(name) || 0) + 1)

    // Track durations
    if (!this.durations.has(name)) {
      this.durations.set(name, [])
    }
    this.durations.get(name)!.push(duration)
  }

  isHotPath(name: string): boolean {
    const calls = this.callCounts.get(name) || 0
    const avgDuration = this.getAvgDuration(name)

    // Hot if:
    // - Called frequently (>1000/sec)
    // - OR expensive (>10ms avg)
    // - AND total time significant (>1s total)
    return (calls > 1000) ||
           (avgDuration > 10) ||
           (calls * avgDuration > 1000)
  }

  shouldUseWASM(name: string, inputSize: number): boolean {
    // Use WASM if:
    // - Hot path
    // - Large inputs (>100 elements)
    // - Available in WASM
    return this.isHotPath(name) &&
           inputSize > 100 &&
           this.hasWASMImplementation(name)
  }
}
```

### Benchmarking Strategy

```typescript
interface BenchmarkConfig {
  operation: string
  inputSizes: number[]
  iterations: number
  strategies: ('cpu' | 'wasm')[]
}

class Benchmark {
  run(config: BenchmarkConfig): BenchmarkResult {
    const results: BenchmarkResult = {
      operation: config.operation,
      measurements: []
    }

    for (const size of config.inputSizes) {
      for (const strategy of config.strategies) {
        const durations: number[] = []

        // Warmup
        for (let i = 0; i < 100; i++) {
          this.execute(strategy, size)
        }

        // Measure
        for (let i = 0; i < config.iterations; i++) {
          const start = performance.now()
          this.execute(strategy, size)
          durations.push(performance.now() - start)
        }

        results.measurements.push({
          strategy,
          inputSize: size,
          avgDuration: average(durations),
          p50: percentile(durations, 50),
          p95: percentile(durations, 95),
          p99: percentile(durations, 99)
        })
      }
    }

    return results
  }
}
```

### SIMD Optimization

```typescript
// AssemblyScript with SIMD
export function vectorAddSIMD(
  a: Float64Array,
  b: Float64Array,
  result: Float64Array
): void {
  // Process 2 f64 at a time with SIMD
  const len = a.length
  let i = 0

  // SIMD loop (2 elements at a time)
  for (; i < len - 1; i += 2) {
    const va = v128.load(a.dataStart + i * 8)
    const vb = v128.load(b.dataStart + i * 8)
    const sum = f64x2.add(va, vb)
    v128.store(result.dataStart + i * 8, sum)
  }

  // Handle remaining element
  if (i < len) {
    result[i] = a[i] + b[i]
  }
}
```

## Performance Targets

| Operation | Input Size | CPU Time | WASM Time | Speedup |
|-----------|-----------|----------|-----------|---------|
| Vector Dot | 1K | 50μs | 10μs | 5x |
| Vector Dot | 100K | 5ms | 1ms | 5x |
| Matrix Mult (NxN) | 100x100 | 50ms | 10ms | 5x |
| Matrix Mult (NxN) | 1000x1000 | 5s | 500ms | 10x |
| Nash Iteration | 10 players | 100ms | 20ms | 5x |

## Build Configuration

```json
// package.json
{
  "scripts": {
    "build:wasm": "asc src/wasm/**/*.as.ts -o dist/wasm --optimize --converge",
    "build:ts": "tsup",
    "build": "npm run build:wasm && npm run build:ts"
  },
  "devDependencies": {
    "assemblyscript": "^0.27.0",
    "tsup": "^8.0.0"
  }
}

// asconfig.json
{
  "targets": {
    "release": {
      "outFile": "dist/wasm/index.wasm",
      "optimize": true,
      "converge": true,
      "noAssert": true,
      "runtime": "stub"
    }
  },
  "options": {
    "bindings": "esm"
  }
}
```

## Testing Strategy

```typescript
describe('Vector Operations', () => {
  it('should match CPU and WASM results', () => {
    const a = [1, 2, 3, 4, 5]
    const b = [2, 3, 4, 5, 6]

    const cpuResult = cpuOps.dot(a, b)
    const wasmResult = wasmOps.dot(a, b)

    expect(cpuResult).toBeCloseTo(wasmResult, 10) // 10 decimal places
  })

  it('should handle edge cases', () => {
    expect(wasmOps.dot([], [])).toBe(0)
    expect(wasmOps.dot([1], [1])).toBe(1)
    expect(() => wasmOps.dot([1, 2], [1])).toThrow()
  })

  it('should perform better than CPU for large inputs', () => {
    const size = 10000
    const a = randomArray(size)
    const b = randomArray(size)

    const cpuTime = measureTime(() => cpuOps.dot(a, b))
    const wasmTime = measureTime(() => wasmOps.dot(a, b))

    expect(wasmTime).toBeLessThan(cpuTime)
  })
})
```

## Monitoring

### WASM Usage Metrics

```typescript
interface WASMMetrics {
  usage: {
    cpuCalls: number
    wasmCalls: number
    wasmUsagePercent: number
  }

  performance: {
    avgCPUTime: number
    avgWASMTime: number
    speedupFactor: number
  }

  memory: {
    wasmHeapSize: number
    peakHeapSize: number
    allocations: number
  }
}
```

## References
- [WebAssembly Specification](https://webassembly.github.io/spec/)
- [AssemblyScript Documentation](https://www.assemblyscript.org/)
- [WASM SIMD](https://github.com/WebAssembly/simd)
- [Performance Best Practices](https://web.dev/webassembly-performance/)

## Future Enhancements

### Phase 2
- GPU acceleration via WebGPU
- Multi-threading with SharedArrayBuffer
- Streaming SIMD for even larger datasets

### Phase 3
- JIT compilation for hot paths
- Adaptive optimization based on runtime profiling
- Custom WASM instructions for domain-specific operations

---
**Date**: 2025-11-12
**Author**: System Architecture Team
**Stakeholders**: Performance Team, Core Team, DevOps Team

# Architecture Documentation

System architecture, planning, and design documents.

## Overview

- [Executive Summary](EXECUTIVE_SUMMARY.md) - High-level system overview and capabilities
- [Integration Status](INTEGRATION-STATUS.md) - Current integration status and roadmap
- [Research Summary](RESEARCH_SUMMARY.md) - Technical research and findings

## Planning

- [Improvement Plan](IMPROVEMENT_PLAN.md) - System improvement roadmap
- [Quick Wins](QUICK_WINS.md) - High-impact, low-effort improvements
- [Multi-Model Router Plan](MULTI_MODEL_ROUTER_PLAN.md) - Router architecture and design

---

# Mathematical Framework Architecture

## Overview

Complete system architecture for a mathematical framework with 9-level dependency system, type-safe computations, AgentDB integration, WASM acceleration, and neural network convergence.

## Main Architecture Documents

1. **[MATH_FRAMEWORK_ARCHITECTURE.md](./MATH_FRAMEWORK_ARCHITECTURE.md)** - System overview, C4 diagrams, dependency graph
2. **[MODULE_BREAKDOWN.md](./MODULE_BREAKDOWN.md)** - Module specifications, APIs, implementation
3. **[DATA_FLOW_SPECIFICATION.md](./DATA_FLOW_SPECIFICATION.md)** - Data pipelines, optimization, parallel execution
4. **[TYPE_SYSTEM_DESIGN.md](./TYPE_SYSTEM_DESIGN.md)** - Type system, Hindley-Milner inference, type checking
5. **[MEMORY_COORDINATION.md](./MEMORY_COORDINATION.md)** - AgentDB patterns, memory hierarchy, persistence

## Architecture Decision Records (ADRs)

Located in [`./adr/`](./adr/)

- [ADR-001: 9-Level Dependency System](./adr/001-9-level-dependency-system.md)
- [ADR-002: AgentDB for Memory Coordination](./adr/002-agentdb-for-memory-coordination.md)
- [ADR-003: WASM for Performance](./adr/003-wasm-for-performance.md)
- [ADR-004: Hindley-Milner Type Inference](./adr/004-hindley-milner-type-inference.md)

## Key Features

- **9-Level Hierarchy**: Axioms → Basic Ops → Sequences → Game Theory → Neural
- **Type Safety**: Compile-time checking with principal type inference
- **AgentDB Integration**: Working memory, pattern learning, vector search
- **WASM Performance**: 2-10x speedup for critical operations
- **Nash Equilibria**: Computation and neural network convergence

## Module Organization

```
@math-framework/
├── core/           # Symbol table, types, φ, ψ operators
├── sequences/      # F, L, Q, Z operations
├── game-theory/    # S, Nash equilibrium
├── neural/         # Nash learning networks
├── memory/         # AgentDB integration
└── wasm/           # Performance-critical ops
```

## Performance Targets

| Operation | Target | Tech Stack |
|-----------|--------|-----------|
| Basic ops | > 100K ops/s | TypeScript + WASM |
| Sequences | > 10K ops/s | TypeScript + WASM |
| Nash | > 1K ops/s | TypeScript + Neural |
| Type check | < 10s (100K LOC) | Hindley-Milner |

**Status**: Complete architecture v1.0 (2025-11-12)

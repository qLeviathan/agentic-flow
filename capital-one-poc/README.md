# Phi System - Capital One POC

Standalone Rust system with Tokio async runtime and WASM containerization for on-premise deployment.

## Overview

Phi System is a pure Rust implementation featuring:

- **Tokio Async Runtime** - High-performance multi-threaded task execution
- **WASM Compilation** - Web deployment via WebAssembly
- **AgentDB-Equivalent Memory** - Episode storage, skill extraction, causal discovery
- **Zero External Dependencies** - Fully self-contained for on-premise deployment
- **Production-Ready** - Type-safe, comprehensive error handling, tested

## Architecture

```
phi-system/
├── phi-runtime    # Tokio async task execution
├── phi-memory     # AgentDB-equivalent memory system
├── phi-wasm       # WebAssembly bindings
└── phi-cli        # Command line interface
```

## Quick Start

### Build

```bash
cd capital-one-poc

# Build all crates
cargo build --release

# Run CLI
cargo run --bin phi -- info
```

### Run Examples

```bash
# Basic runtime operations
cargo run --example basic_runtime

# Memory operations (episodes, skills, causality)
cargo run --example memory_operations

# Full system integration
cargo run --example full_system

# WASM compatibility demo
cargo run --example wasm_demo
```

### CLI Usage

```bash
# Show system info
phi info

# Runtime operations
phi runtime spawn --id task1 --duration 100
phi runtime parallel --count 10
phi runtime timeout --seconds 5

# Memory operations
phi memory store --id ep1 --context "login" --action "authenticate"
phi memory query --pattern "login"
phi memory extract-skills
phi memory discover-causality
phi memory stats

# Run examples
phi example --name basic
phi example --name parallel
phi example --name memory
phi example --name full
```

## Core Features

### 1. Tokio Async Runtime (`phi-runtime`)

High-performance async task execution:

```rust
use phi_runtime::{PhiRuntime, TaskId};

let runtime = PhiRuntime::new();

// Spawn single task
runtime.spawn(TaskId("task1".into()), || async {
    Ok("Task completed".to_string())
}).await?;

// Parallel execution
let tasks = vec![
    || async { Ok("Task A".to_string()) },
    || async { Ok("Task B".to_string()) },
];
let results = runtime.parallel(tasks).await;

// Execute with timeout
runtime.execute_with_timeout(
    Duration::from_secs(5),
    || async { Ok("Done".to_string()) }
).await?;
```

### 2. AgentDB-Equivalent Memory (`phi-memory`)

Episode storage, reflexion learning, causal discovery:

```rust
use phi_memory::{Episode, Outcome, PhiMemory};

let memory = PhiMemory::new();

// Store episode
let episode = Episode {
    id: "ep1".to_string(),
    context: "user_action".to_string(),
    action: "login".to_string(),
    outcome: Outcome::Success("authenticated".to_string()),
    // ...
};
memory.store_episode(episode).await?;

// Extract skills (reflexion learning)
let skills = memory.extract_skills().await?;

// Discover causal relationships
let edges = memory.discover_causality().await?;

// Latent-N encoding
let encoded = memory.encode_latent("key", data).await?;
let decoded = memory.decode_latent("key").await?;
```

### 3. WASM Bindings (`phi-wasm`)

WebAssembly compilation for web deployment:

```rust
use phi_wasm::{WasmRuntime, WasmMemory, PhiSystem};

// In JavaScript/TypeScript
const system = new PhiSystem();
await system.executeAndStore("task1", "context", "action");
const stats = await system.getSystemInfo();
```

Build for WASM:

```bash
# Install wasm-pack
cargo install wasm-pack

# Build WASM package
cd crates/phi-wasm
wasm-pack build --target web
```

## Docker Deployment

### Single Container

```bash
docker build -f docker/Dockerfile -t phi-system .
docker run phi-system info
docker run phi-system runtime parallel --count 10
```

### Docker Compose (Multi-Worker)

```bash
docker-compose -f docker/docker-compose.yml up
```

Deploys:
- 1 main system container
- 3 worker containers running parallel tasks
- Shared network for inter-container communication

### Docker Swarm (Production)

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker/swarm-stack.yml phi-stack

# Scale workers
docker service scale phi-stack_phi-worker=10

# Check status
docker stack services phi-stack
```

Features:
- 1 manager node
- 5 worker nodes (scalable)
- Resource limits and reservations
- Health checks and auto-restart
- Rolling updates

## Benchmarks

Run performance benchmarks:

```bash
# Runtime benchmarks
cargo bench --bench runtime_bench

# Memory benchmarks
cargo bench --bench memory_bench
```

Benchmark categories:
- Task spawning (single, parallel)
- Timeout execution
- Episode storage and querying
- Skill extraction
- Latent encoding/decoding

## Testing

```bash
# Run all tests
cargo test

# Run with output
cargo test -- --nocapture

# Test specific crate
cargo test -p phi-runtime
cargo test -p phi-memory
cargo test -p phi-wasm

# WASM tests
cd crates/phi-wasm
wasm-pack test --node
```

## Code Style

This codebase follows "golf-style" principles:

- Clean, concise, maintainable
- No `.unwrap()` in production code
- Comprehensive error handling with `Result<T>`
- Type-safe with strict compiler checks
- Well-documented with rustdoc comments
- Comprehensive test coverage

## Memory System Details

### Episode Storage

Episodes represent discrete interactions or experiences:

```rust
pub struct Episode {
    pub id: String,
    pub timestamp: u64,
    pub context: String,
    pub action: String,
    pub outcome: Outcome,
    pub metadata: HashMap<String, String>,
}
```

### Skill Extraction (Reflexion Learning)

Automatically extracts behavioral patterns from successful episodes:

```rust
pub struct Skill {
    pub id: String,
    pub name: String,
    pub pattern: Vec<String>,
    pub confidence: f64,
    pub usage_count: u64,
}
```

### Causal Discovery

Discovers cause-effect relationships from temporal sequences:

```rust
pub struct CausalEdge {
    pub from: String,
    pub to: String,
    pub strength: f64,
    pub confidence: f64,
}
```

### Latent-N Encoding

Efficient memory compression for long-term storage:

```rust
pub struct LatentMemory {
    pub encoding: Vec<f32>,
    pub metadata: HashMap<String, String>,
    pub compression_ratio: f64,
}
```

## Performance Characteristics

- **Task Spawning**: Sub-millisecond overhead
- **Parallel Execution**: Linear scaling up to CPU core count
- **Episode Storage**: O(1) insertion via DashMap
- **Episode Query**: O(n) pattern matching (optimizable with indexing)
- **Skill Extraction**: O(n) with pattern grouping
- **Latent Encoding**: O(n) compression/decompression

## Security Considerations

For production deployment:

1. **No hardcoded secrets** - All configuration via environment variables
2. **Input validation** - All external inputs validated before processing
3. **Error handling** - No panic in production code paths
4. **Resource limits** - Configurable task limits and timeouts
5. **Audit logging** - All operations logged for compliance

## On-Premise Deployment

This system is designed for on-premise deployment:

- **No external API calls** - Fully self-contained
- **No telemetry** - Zero data sent externally
- **Configurable storage** - Local disk or network storage
- **Air-gap compatible** - No internet required after build
- **Docker/K8s ready** - Standard container deployment

## Future Enhancements

Potential extensions (not currently implemented):

- Persistent episode storage (SQLite, PostgreSQL)
- Advanced indexing for faster queries
- Distributed memory across multiple nodes
- Neural network integration for skill prediction
- GraphQL API for external integrations
- Real-time monitoring dashboard

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:

- GitHub Issues: [Project Repository]
- Internal Support: [Contact Information]

---

Built with Rust 🦀 | Powered by Tokio ⚡ | WASM Ready 🌐

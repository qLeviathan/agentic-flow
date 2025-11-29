# Comprehensive Cargo Crates Categorization

This document catalogs all 43 Rust crates (Cargo packages) in the agentic-flow repository, organized by project and category.

---

## Summary Statistics

| Category | Crate Count |
|----------|-------------|
| Agent Booster | 3 |
| ReasoningBank | 6 |
| Aurelia Standalone | 7 |
| Capital One POC | 5 |
| Climate Prediction | 7 |
| CRISPR-Cas13 Pipeline | 7 |
| Tauri Anthropic App | 2 |
| Root-Level Crates | 3 |
| Rights Preserving Platform | 1 |
| **Total** | **43** |

---

## 1. Agent Booster Workspace

**Purpose**: Fast code editing library using tree-sitter and similarity matching for AI agent performance optimization.

### 1.1 `agent-booster`
- **Path**: `agent-booster/crates/agent-booster`
- **Description**: Core code editing library with tree-sitter parsing and similarity matching
- **Category**: Code Analysis / Text Processing
- **Key Dependencies**:
  - `tree-sitter` (0.22) - Incremental parsing
  - `tree-sitter-javascript` (0.21) - JS/TS parsing
  - `tree-sitter-typescript` (0.21) - TypeScript parsing
  - `strsim` (0.11) - String similarity algorithms
  - `regex` (1.10) - Regular expressions
- **Features**:
  - `tree-sitter-parser` - Full AST parsing
  - `lite-parser` - Lightweight fallback for WASM

### 1.2 `agent-booster-native`
- **Path**: `agent-booster/crates/agent-booster-native`
- **Description**: Node.js native addon for agent-booster (N-API bindings)
- **Category**: FFI / Native Bindings
- **Key Dependencies**:
  - `napi` (2.16) - Node.js addon API
  - `napi-derive` (2.16) - Procedural macros for N-API
- **Output**: `cdylib` for Node.js

### 1.3 `agent-booster-wasm`
- **Path**: `agent-booster/crates/agent-booster-wasm`
- **Description**: WebAssembly bindings for agent-booster (browser/Node)
- **Category**: WASM / Web Platform
- **Key Dependencies**:
  - `wasm-bindgen` (0.2) - Rust-to-JS bindings
  - `serde-wasm-bindgen` (0.6) - Serde for WASM
  - `console_error_panic_hook` (0.1) - Better panic messages
- **Output**: `cdylib` + `rlib`

---

## 2. ReasoningBank Workspace

**Purpose**: AI reasoning engine with pattern matching, similarity scoring, persistent storage, and MCP server implementation.

### 2.1 `reasoningbank-core`
- **Path**: `reasoningbank/crates/reasoningbank-core`
- **Description**: Core reasoning engine with pattern matching and similarity scoring
- **Category**: AI / Machine Learning Core
- **Key Dependencies**:
  - `ndarray` (0.15) - N-dimensional arrays for ML
  - `ordered-float` (4.2) - Ordered floating-point for comparisons
  - `uuid` (1.6) - Unique identifiers

### 2.2 `reasoningbank-storage`
- **Path**: `reasoningbank/crates/reasoningbank-storage`
- **Description**: Persistent storage layer with SQLite and IndexedDB (WASM) support
- **Category**: Database / Persistence
- **Key Dependencies**:
  - `rusqlite` (0.31) - SQLite bindings (native)
  - `parking_lot` (0.12) - Synchronization primitives
  - `web-sys` - IndexedDB for WASM
- **Features**: `wasm-adapters` for browser storage

### 2.3 `reasoningbank-learning`
- **Path**: `reasoningbank/crates/reasoningbank-learning`
- **Description**: Machine learning and adaptive learning algorithms
- **Category**: AI / Machine Learning
- **Key Dependencies**:
  - Uses `reasoningbank-core` and `reasoningbank-storage`
  - `tokio` (1.0) - Async runtime

### 2.4 `reasoningbank-network`
- **Path**: `reasoningbank/crates/reasoningbank-network`
- **Description**: QUIC-based networking layer with 0-RTT and stream multiplexing (Neural Bus)
- **Category**: Networking / Transport
- **Key Dependencies**:
  - `quinn` (0.10) - QUIC implementation
  - `rustls` (0.21) - TLS implementation
  - `rcgen` (0.12) - Certificate generation
  - `ed25519-dalek` (2) - Cryptographic signatures
  - `prost` (0.13) - Protocol Buffers

### 2.5 `reasoningbank-mcp`
- **Path**: `reasoningbank/crates/reasoningbank-mcp`
- **Description**: Model Context Protocol (MCP) server with reasoning tools and resources
- **Category**: API / Protocol Server
- **Key Dependencies**:
  - All other reasoningbank crates
  - `async-trait` (0.1) - Async trait support

### 2.6 `reasoningbank-wasm`
- **Path**: `reasoningbank/crates/reasoningbank-wasm`
- **Description**: WASM bindings for browser and Node.js environments
- **Category**: WASM / Web Platform
- **Key Dependencies**:
  - `wasm-bindgen` (0.2) - JS bindings
  - `web-sys` - Browser APIs (IndexedDB)
  - `console_error_panic_hook` (0.1)
- **Output**: `cdylib` + `rlib`

---

## 3. Aurelia Standalone

**Purpose**: Autonomous trading system with Fibonacci/phi-based mathematics, physics simulation, and holographic memory.

### 3.1 `aurelia` (Root Package)
- **Path**: `aurelia_standalone/`
- **Description**: Autonomous Recursive Entity with Logarithmic Intelligence Architecture
- **Category**: Trading / Finance / AI
- **Key Dependencies**:
  - `wasmtime` (16.0), `wasmer` (4.2) - WASM runtimes
  - `tauri` (2.0.0-beta) - Desktop framework
  - `egui` (0.24), `eframe` (0.24) - Pure Rust GUI
  - `quinn` (0.10) - QUIC networking
  - `burn` (0.14) - ML framework
  - `sqlx` (0.7) - Database access

### 3.2 `phi-core`
- **Path**: `aurelia_standalone/crates/phi-core`
- **Description**: φ-arithmetic and Zeckendorf bit cascade engine (integer-only math)
- **Category**: Mathematics / Algorithms
- **Key Dependencies**:
  - `num-bigint` (0.4) - Big integer support
  - `num-integer` (0.1), `num-traits` (0.2) - Integer math

### 3.3 `cosmos-physics`
- **Path**: `aurelia_standalone/crates/cosmos-physics`
- **Description**: NVIDIA Cosmos integration for physics simulation
- **Category**: Physics / Simulation / ML
- **Key Dependencies**:
  - `image` (0.24) - Image processing
  - `opencv` (0.88) - Computer vision
  - `pyo3` (0.20) - Python interop for Cosmos models
  - `rayon` (1.8) - Parallel processing

### 3.4 `holographic-memory`
- **Path**: `aurelia_standalone/crates/holographic-memory`
- **Description**: Infinite memory compression via recursive φ-identities (NOT database)
- **Category**: Memory / Compression
- **Key Dependencies**:
  - `phi-core` - Phi-based math
  - `rayon` (1.8) - Parallel processing
  - WASM support via `wasm-bindgen`

### 3.5 `macro-field`
- **Path**: `aurelia_standalone/crates/macro-field`
- **Description**: Macroeconomic φ-field model with game theory decision integration
- **Category**: Economics / Game Theory
- **Key Dependencies**:
  - `reqwest` (0.11) - HTTP client for FRED API
  - `chrono` (0.4) - Date/time handling
  - `phi-core` - Phi math integration

### 3.6 `backtesting`
- **Path**: `aurelia_standalone/crates/backtesting`
- **Description**: Enhanced backtesting framework with Fibonacci/Lucas logic and Latent-N tracking
- **Category**: Finance / Testing
- **Key Dependencies**:
  - `phi-core`, `holographic-memory`
  - `csv` (1.3) - CSV parsing
  - `chrono` (0.4) - Time series

### 3.7 `webull-integration`
- **Path**: `aurelia_standalone/crates/webull-integration`
- **Description**: Webull API integration for live/co-trading with Latent-N encoding
- **Category**: Trading / API Integration
- **Key Dependencies**:
  - `reqwest` (0.11) - HTTP with cookies
  - `tokio-tungstenite` (0.21) - WebSocket for real-time data
  - `governor` (0.6) - Rate limiting
  - `sha2`, `hmac`, `base64` - API authentication

---

## 4. Capital One POC Workspace

**Purpose**: Proof-of-concept for Capital One with φ-based runtime, memory system, and CLI/TUI interfaces.

### 4.1 `capital-one-poc` (Root)
- **Path**: `capital-one-poc/`
- **Description**: Root package with examples for runtime and memory operations
- **Category**: Demo / POC

### 4.2 `phi-runtime`
- **Path**: `capital-one-poc/crates/phi-runtime`
- **Description**: φ-based async runtime for task scheduling
- **Category**: Runtime / Scheduler
- **Key Dependencies**:
  - `tokio` (1.40) - Async runtime
  - `futures` (0.3), `async-trait` (0.1)

### 4.3 `phi-memory`
- **Path**: `capital-one-poc/crates/phi-memory`
- **Description**: High-performance concurrent memory store
- **Category**: Memory / Data Structures
- **Key Dependencies**:
  - `dashmap` (6.0) - Concurrent hashmap
  - `async-trait` (0.1)

### 4.4 `phi-wasm`
- **Path**: `capital-one-poc/crates/phi-wasm`
- **Description**: WASM bindings for phi-runtime and phi-memory
- **Category**: WASM / Web Platform
- **Key Dependencies**:
  - `wasm-bindgen` (0.2)
  - `js-sys` (0.3), `web-sys` (0.3)

### 4.5 `phi-cli`
- **Path**: `capital-one-poc/crates/phi-cli`
- **Description**: Command-line interface with TUI dashboard
- **Category**: CLI / TUI
- **Key Dependencies**:
  - `clap` (4.5) - CLI argument parsing
  - `ratatui` (0.27) - Terminal UI framework
  - `crossterm` (0.28) - Terminal control
  - `colored` (2.1) - Colored output

---

## 5. Climate Prediction Workspace

**Purpose**: ML-based climate prediction system with data ingestion, physics models, and REST API.

### 5.1 `climate-core`
- **Path**: `examples/climate-prediction/crates/climate-core`
- **Description**: Core data types and traits for climate prediction
- **Category**: Core / Data Models
- **Key Dependencies**:
  - `ndarray` (0.16) - N-dimensional arrays
  - `chrono` (0.4) - Time handling

### 5.2 `climate-data`
- **Path**: `examples/climate-prediction/crates/climate-data`
- **Description**: Data ingestion from ERA5, NOAA, and cloud sources
- **Category**: Data Ingestion / ETL
- **Key Dependencies**:
  - `reqwest` (0.12) - HTTP client
  - `moka` (0.12) - Caching
  - `governor` (0.6) - Rate limiting
  - `rusoto_s3` (0.48) - AWS S3 access
  - `validator` (0.18) - Data validation

### 5.3 `climate-models`
- **Path**: `examples/climate-prediction/crates/climate-models`
- **Description**: ML models using Candle framework for climate prediction
- **Category**: Machine Learning
- **Key Dependencies**:
  - `candle-core` (0.8), `candle-nn` (0.8) - ML framework
  - `ndarray-stats` (0.6) - Statistical operations
  - `linfa` (0.7) - ML toolkit

### 5.4 `climate-physics`
- **Path**: `examples/climate-prediction/crates/climate-physics`
- **Description**: Physics equations for atmospheric and oceanic simulation
- **Category**: Physics / Simulation
- **Key Dependencies**:
  - `ndarray` (0.16), `ndarray-stats` (0.6)
  - `approx` (0.5) - Approximate comparisons

### 5.5 `climate-api`
- **Path**: `examples/climate-prediction/crates/climate-api`
- **Description**: REST API server using Axum
- **Category**: API / Web Server
- **Key Dependencies**:
  - `axum` (0.7) - Web framework
  - `hyper` (1.5) - HTTP server
  - `tower` (0.4) - Service composition
  - `config` (0.14) - Configuration management

### 5.6 `climate-cli`
- **Path**: `examples/climate-prediction/crates/climate-cli`
- **Description**: Command-line interface for climate predictions
- **Category**: CLI
- **Key Dependencies**:
  - `clap` (4.5) - CLI parsing
  - All climate-* crates

---

## 6. CRISPR-Cas13 Pipeline Workspace

**Purpose**: High-performance bioinformatics pipeline for CRISPR-Cas13 off-target analysis and immune response profiling.

### 6.1 `crispr-cas13-pipeline` (Root)
- **Path**: `agentic-flow/examples/crispr-cas13-pipeline/`
- **Description**: Main pipeline orchestration with distributed computing
- **Category**: Bioinformatics / Pipeline
- **Key Dependencies**:
  - `bio` (2.0), `rust-htslib` (0.47) - Bioinformatics libs
  - `ndarray` (0.16) - Scientific computing
  - `rdkafka` (0.36) - Kafka for distributed computing
  - `redis` (0.27) - Caching/pub-sub
  - `sqlx` (0.8), `mongodb` (3.1) - Databases

### 6.2 `data-models`
- **Path**: `agentic-flow/examples/crispr-cas13-pipeline/crates/data-models`
- **Description**: Shared data structures (sequences, targets, immune markers)
- **Category**: Data Models
- **Key Dependencies**:
  - `uuid` (1.10), `chrono` (0.4)
  - `serde` (1.0)

### 6.3 `alignment-engine`
- **Path**: `agentic-flow/examples/crispr-cas13-pipeline/crates/alignment-engine`
- **Description**: Read alignment engine using rust-htslib
- **Category**: Bioinformatics / Alignment
- **Key Dependencies**:
  - `rust-htslib` (0.47) - HTS file reading
  - `bio` (2.0) - Bioinformatics algorithms
  - `needletail` (0.5) - FASTA/FASTQ parsing
  - `rayon` (1.8) - Parallel processing

### 6.4 `offtarget-predictor`
- **Path**: `agentic-flow/examples/crispr-cas13-pipeline/crates/offtarget-predictor`
- **Description**: ML-based off-target prediction for CRISPR-Cas13
- **Category**: Machine Learning / Prediction
- **Key Dependencies**:
  - `ndarray` (0.16) - Numerical arrays
  - `rayon` (1.8) - Parallelism

### 6.5 `immune-analyzer`
- **Path**: `agentic-flow/examples/crispr-cas13-pipeline/crates/immune-analyzer`
- **Description**: Immune response analysis for primate models
- **Category**: Bioinformatics / Analysis
- **Key Dependencies**:
  - `ndarray` (0.16)
  - `rayon` (1.8)

### 6.6 `api-service`
- **Path**: `agentic-flow/examples/crispr-cas13-pipeline/crates/api-service`
- **Description**: REST API with JWT auth for pipeline access
- **Category**: API / Web Server
- **Key Dependencies**:
  - `axum` (0.7), `tower` (0.5)
  - `jsonwebtoken` (9.2) - JWT authentication
  - `sqlx` (0.8), `mongodb` (3.1)

### 6.7 `processing-orchestrator`
- **Path**: `agentic-flow/examples/crispr-cas13-pipeline/crates/processing-orchestrator`
- **Description**: Job orchestration with Kafka message processing
- **Category**: Orchestration / Distributed Systems
- **Key Dependencies**:
  - `rdkafka` (0.36) - Kafka client
  - All analysis crates

---

## 7. Tauri Anthropic App

**Purpose**: Desktop application for Claude AI integration with secure API key management.

### 7.1 `tauri-anthropic-app` (Main)
- **Path**: `tauri-anthropic-app/src-tauri/`
- **Description**: Desktop app with Claude API, keychain storage, and WASM modules
- **Category**: Desktop App / AI Integration
- **Key Dependencies**:
  - `tauri` (1.5) - Desktop framework
  - `reqwest` (0.11) - HTTP for Anthropic API
  - `keyring` (2.3) - Secure credential storage
  - `eventsource-stream` (0.2) - SSE streaming
  - `reasoningbank-wasm`, `agent-booster-wasm`, `math-framework-wasm` - Performance modules
  - `lru` (0.12) - Caching

### 7.2 `tauri-anthropic-app` (Security Config)
- **Path**: `tauri-anthropic-app/docs/security-configs/Cargo.toml`
- **Description**: Security-hardened configuration template
- **Category**: Security / Configuration
- **Key Dependencies**:
  - `secrecy` (0.8) - Secret management with zeroization
  - `zeroize` (1.7) - Memory zeroing
  - `validator` (0.18) - Input validation

---

## 8. Root-Level Crates

### 8.1 `agentic-flow-quic`
- **Path**: `crates/agentic-flow-quic/`
- **Description**: High-performance QUIC transport layer with WASM support
- **Category**: Networking / Transport
- **Key Dependencies**:
  - `quinn` (0.11) - QUIC protocol
  - `rustls` (0.23) - TLS with ring
  - `rcgen` (0.13) - Certificate generation
- **Features**: `client`, `server`, `wasm`
- **Output**: `cdylib` + `rlib`

### 8.2 `math-framework-wasm`
- **Path**: `crates/math-framework-wasm/`
- **Description**: WASM bindings for mathematical framework (Fibonacci, etc.)
- **Category**: Mathematics / WASM
- **Key Dependencies**:
  - `num-bigint` (0.4) - Big integers for Fibonacci
  - `num-traits` (0.2) - Numeric traits
  - `wasm-bindgen` (0.2)
- **Output**: `cdylib` + `rlib`

---

## 9. Rights Preserving Platform

### 9.1 `rights-preserving-platform`
- **Path**: `examples/rights-preserving-platform/`
- **Description**: AI governance, auditing, and rights-preserving oversight with differential privacy
- **Category**: AI Governance / Privacy / Compliance
- **Key Dependencies**:
  - `axum` (0.7) - Web framework with WebSocket
  - `sqlx` (0.8), `redis` (0.27) - Databases
  - `jsonwebtoken` (9.3), `bcrypt` (0.15) - Auth
  - `ring` (0.17), `sha2` (0.10) - Cryptography
  - `rand_distr` (0.4) - Differential privacy noise
  - `rdkafka` (0.36) - Message queue
  - `prometheus` (0.13) - Metrics
  - `ndarray` (0.16) - Fairness metrics

---

## Dependency Categories Summary

### Core Infrastructure
| Dependency | Version | Used By |
|------------|---------|---------|
| `tokio` | 1.35-1.40 | All async crates |
| `serde`/`serde_json` | 1.0 | All crates |
| `anyhow`/`thiserror` | 1.0 | All crates |
| `tracing` | 0.1 | Most crates |

### WASM/Web Platform
| Dependency | Version | Purpose |
|------------|---------|---------|
| `wasm-bindgen` | 0.2 | Rust-to-JS bindings |
| `js-sys` | 0.3 | JS standard library |
| `web-sys` | 0.3 | Web APIs |
| `console_error_panic_hook` | 0.1 | Better WASM panics |

### Networking
| Dependency | Version | Purpose |
|------------|---------|---------|
| `quinn` | 0.10-0.11 | QUIC transport |
| `rustls` | 0.21-0.23 | TLS |
| `reqwest` | 0.11-0.12 | HTTP client |
| `axum` | 0.7 | Web framework |

### Machine Learning
| Dependency | Version | Purpose |
|------------|---------|---------|
| `ndarray` | 0.15-0.16 | N-dimensional arrays |
| `candle-core/nn` | 0.8 | ML framework |
| `burn` | 0.14 | ML framework |
| `linfa` | 0.7 | ML toolkit |

### Bioinformatics
| Dependency | Version | Purpose |
|------------|---------|---------|
| `bio` | 2.0 | Bioinformatics algorithms |
| `rust-htslib` | 0.47 | HTS file formats |
| `needletail` | 0.5 | FASTA/FASTQ parsing |

### Code Analysis
| Dependency | Version | Purpose |
|------------|---------|---------|
| `tree-sitter` | 0.22 | Incremental parsing |
| `regex` | 1.10 | Pattern matching |
| `strsim` | 0.11 | String similarity |

---

## Build Profiles

All projects use optimized release profiles:

```toml
[profile.release]
opt-level = 3          # Maximum optimization
lto = true/"fat"       # Link-time optimization
codegen-units = 1      # Single codegen unit
strip = true           # Strip symbols
panic = "abort"        # Smaller binary (some projects)
```

WASM builds additionally use:
- `opt-level = "z"` - Size optimization
- `wasm-opt` with SIMD/bulk-memory features

---

*Generated by swarm analysis of agentic-flow repository*

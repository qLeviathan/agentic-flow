# Agentic Flow - Claude Code Configuration

> **The First AI Agent Framework That Gets Smarter AND Faster Every Time It Runs**

## Project Identity

- **Name**: agentic-flow
- **Version**: 2.0.0
- **Description**: Multi-agent coordination framework with QUIC transport
- **Author**: qLeviathan (rUv)
- **License**: MIT

---

## CRITICAL RULES

### 1. Concurrent Execution (GOLDEN RULE)

**"1 MESSAGE = ALL RELATED OPERATIONS"**

```javascript
// CORRECT: Everything in ONE message
Task("researcher", "...", "researcher")
Task("coder", "...", "coder")
Task("tester", "...", "tester")
TodoWrite { todos: [...8-10 items...] }
Write "src/file1.ts"
Write "src/file2.ts"

// WRONG: Spread across multiple messages
Message 1: Task("researcher")
Message 2: Task("coder")
Message 3: TodoWrite { todos: [1 item] }
```

### 2. File Organization

**NEVER save to root folder. Use:**
| Directory | Purpose |
|-----------|---------|
| `/src` | Source code |
| `/tests` | Test files |
| `/docs` | Documentation |
| `/config` | Configuration |
| `/scripts` | Utility scripts |
| `/examples` | Example code |

### 3. Agent Execution

- **Task tool (Claude Code)**: PRIMARY method for spawning agents
- **MCP tools**: ONLY for coordination setup, not execution

---

## Build & Test Commands

### Core Commands
```bash
npm run build          # TypeScript compilation
npm run test           # Run Jest tests
npm run lint           # ESLint
npm run typecheck      # TypeScript type checking
```

### Aurelia Trading System Tests
```bash
npm run test:aurelia              # Full validation suite
npm run test:aurelia:bootstrap    # Bootstrap tests
npm run test:aurelia:encoder      # State encoder tests
npm run test:aurelia:cascade      # Cascade dynamics tests
npm run test:aurelia:data         # Data tests
npm run test:aurelia:nash         # Nash equilibrium tests
npm run test:aurelia:integration  # Full system integration
npm run test:aurelia:invariants   # Consciousness validation
npm run test:aurelia:coverage     # Full coverage report
```

### Demos & Visualization
```bash
npm run demo:phase-space    # Phase space visualization
npm run demo:mvd            # MVD server demo
npm run mvd:server          # Start MVD server
npm run mvd:serve           # Serve on port 3000
npm run graph:generate      # Dependency graph (DOT)
npm run graph:render        # Render graph
npm run graph:svg           # SVG output
npm run graph:pdf           # PDF output
```

### Benchmarking
```bash
npm run bench:quic      # QUIC transport benchmarks
npm run bench:report    # Generate benchmark report
npm run profile         # Profile with 0x
```

---

## Core Components

| Component | Purpose | Performance |
|-----------|---------|-------------|
| **Agent Booster** | Ultra-fast local code transforms (Rust/WASM) | 352x faster, $0 cost |
| **AgentDB** | Memory with causal reasoning & skill learning | p95 <50ms, 80% hit |
| **ReasoningBank** | Persistent learning memory system | 46% faster execution |
| **Multi-Model Router** | Cost optimization across 100+ LLMs | 85-99% cost savings |
| **QUIC Transport** | Ultra-low latency agent communication | 50-70% faster than TCP |

### AgentDB CLI
```bash
npx agentdb init [db-path]                    # Initialize database
npx agentdb stats                             # Database statistics
npx agentdb vector-search <db> <vector>       # Similarity search
npx agentdb export/import                     # Backup/restore

# Reflexion (Episode Memory)
npx agentdb reflexion store <session> <task> <reward> <success> [critique]
npx agentdb reflexion retrieve <task> --k 10 --synthesize-context

# Skills
npx agentdb skill create <name> <description>
npx agentdb skill search <query>
npx agentdb skill consolidate                 # Auto-create from episodes

# Causal Learning
npx agentdb causal add-edge <cause> <effect> <uplift>
npx agentdb learner run                       # Discover patterns

# QUIC Sync (Multi-Agent)
npx agentdb sync start-server --port 4433
npx agentdb sync connect <host> <port>
npx agentdb sync push/pull --server <host:port>
```

---

## Agent Ecosystem (80+)

### Core Development
`coder`, `reviewer`, `tester`, `planner`, `researcher`

### Swarm Coordination
`hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`, `collective-intelligence-coordinator`, `swarm-memory-manager`

### Consensus & Distributed
`byzantine-coordinator`, `raft-manager`, `gossip-coordinator`, `crdt-synchronizer`, `quorum-manager`, `security-manager`, `performance-benchmarker`

### Hive Mind
`queen-coordinator`, `scout-explorer`, `worker-specialist`

### GitHub Integration
`github-modes`, `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`, `workflow-automation`, `project-board-sync`, `repo-architect`, `multi-repo-swarm`, `release-swarm`, `swarm-pr`, `swarm-issue`, `sync-coordinator`

### SPARC Methodology
`sparc-coord`, `sparc-coder`, `specification`, `pseudocode`, `architecture`, `refinement`

### Goal Planning
`goal-planner`, `code-goal-planner`

### Reasoning & Learning
`adaptive-learner`, `pattern-matcher`, `memory-optimizer`, `context-synthesizer`, `experience-curator`, `reasoning-optimized`

### Specialized Development
`backend-dev`, `mobile-dev`, `ml-developer`, `cicd-engineer`, `api-docs`, `system-architect`, `code-analyzer`, `base-template-generator`

### Testing & Validation
`tdd-london-swarm`, `production-validator`

### Optimization
`benchmark-suite`, `load-balancer`, `performance-monitor`, `resource-allocator`, `topology-optimizer`, `perf-analyzer`

### Flow-Nexus Cloud
`flow-nexus-app-store`, `flow-nexus-authentication`, `flow-nexus-challenges`, `flow-nexus-neural`, `flow-nexus-payments`, `flow-nexus-sandbox`, `flow-nexus-swarm`, `flow-nexus-user-tools`, `flow-nexus-workflow`

---

## Skills (25)

| Skill | Purpose |
|-------|---------|
| `agentdb-advanced` | QUIC sync, multi-db, custom metrics |
| `agentdb-learning` | 9 RL algorithms (Decision Transformer, Q-Learning, etc.) |
| `agentdb-memory-patterns` | Session memory, long-term storage |
| `agentdb-optimization` | Quantization, HNSW indexing, caching |
| `agentdb-vector-search` | Semantic search, RAG systems |
| `flow-nexus-neural` | Distributed neural training |
| `flow-nexus-platform` | Auth, sandboxes, deployments |
| `flow-nexus-swarm` | Cloud swarm deployment |
| `github-code-review` | AI-powered code review |
| `github-multi-repo` | Cross-repo synchronization |
| `github-project-management` | Issue tracking, sprints |
| `github-release-management` | Versioning, deployment |
| `github-workflow-automation` | CI/CD pipelines |
| `hive-mind-advanced` | Multi-agent consensus |
| `hooks-automation` | Pre/post task hooks |
| `pair-programming` | Driver/navigator modes |
| `performance-analysis` | Bottleneck detection |
| `reasoningbank-agentdb` | Trajectory tracking, verdicts |
| `reasoningbank-intelligence` | Adaptive learning |
| `skill-builder` | Create custom skills |
| `sparc-methodology` | Development phases |
| `stream-chain` | Multi-agent pipelines |
| `swarm-advanced` | Complex distributed workflows |
| `swarm-orchestration` | Parallel task execution |
| `verification-quality` | 0.95 accuracy threshold |

---

## Subprojects

### Aurelia Trading System (`/aurelia_standalone`, `/src/trading`)
Consciousness-based trading system with:
- Phase space dynamics & cascade modeling
- Nash equilibrium decision making
- State encoding & prediction
- Mathematical validation framework

### Capital One POC (`/capital-one-poc`)
Pure Rust implementation for on-premise deployment:
- Tokio async runtime
- WASM compilation
- AgentDB-equivalent memory
- Zero external dependencies

### Zordic Music Studio (`/zordic-music-studio`)
AI-powered music education platform:
- Beat maker, melody composer, harmony generator
- 7 AI agents (Pattern, Beat, Melody, Harmony, Visual, Teacher, Collaboration)
- 10-week curriculum with 20 lessons
- Built on Tone.js, p5.js, Tonal.js, Three.js

### ReasoningBank (`/reasoningbank`)
Adaptive self-learning reasoning system:
- Pattern recognition & storage
- Similarity matching (cosine, euclidean)
- Strategy optimization
- QUIC neural bus
- MCP integration

---

## SPARC Methodology

### Workflow Phases
1. **Specification** - Requirements analysis
2. **Pseudocode** - Algorithm design
3. **Architecture** - System design
4. **Refinement** - TDD implementation
5. **Completion** - Integration

### Commands
```bash
npx claude-flow sparc modes                    # List modes
npx claude-flow sparc run <mode> "<task>"      # Run mode
npx claude-flow sparc tdd "<feature>"          # TDD workflow
npx claude-flow sparc batch <modes> "<task>"   # Parallel execution
npx claude-flow sparc pipeline "<task>"        # Full pipeline
```

---

## MCP Tools (213 Total)

### Claude-Flow (101 tools)
- **Swarm**: `swarm_init`, `agent_spawn`, `task_orchestrate`
- **Memory**: `memory_store`, `memory_retrieve`, `memory_usage`
- **Neural**: `neural_train`, `neural_patterns`, `neural_status`
- **GitHub**: `github_swarm`, `repo_analyze`, `pr_enhance`, `code_review`
- **Performance**: `benchmark_run`, `swarm_monitor`, `features_detect`

### Flow-Nexus (96 tools)
- **Sandboxes**: `sandbox_create`, `sandbox_execute` (cloud execution)
- **Templates**: `template_list`, `template_deploy`
- **Real-time**: `execution_stream_subscribe`, `realtime_subscribe`
- **Storage**: `storage_upload`, `storage_list`

### Setup
```bash
claude mcp add claude-flow npx claude-flow@alpha mcp start
claude mcp add flow-nexus npx flow-nexus@latest mcp start  # Optional
```

---

## Hooks Configuration

### Pre-Tool Hooks
- **Bash**: Safety validation, resource preparation
- **Write/Edit**: Auto-assign agents, load context

### Post-Tool Hooks
- **Bash**: Track metrics, store results
- **Write/Edit**: Auto-format, update memory

### Session Hooks
- **PreCompact**: Review CLAUDE.md guidance
- **Stop**: Generate summary, persist state, export metrics

---

## Agent Coordination Protocol

Every spawned agent should use hooks:

```bash
# BEFORE work
npx claude-flow@alpha hooks pre-task --description "[task]"
npx claude-flow@alpha hooks session-restore --session-id "swarm-[id]"

# DURING work
npx claude-flow@alpha hooks post-edit --file "[file]" --memory-key "swarm/[agent]/[step]"
npx claude-flow@alpha hooks notify --message "[what was done]"

# AFTER work
npx claude-flow@alpha hooks post-task --task-id "[task]"
npx claude-flow@alpha hooks session-end --export-metrics true
```

---

## Environment Variables

```bash
# API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENROUTER_API_KEY=sk-or-v1-...

# Claude Flow
CLAUDE_FLOW_HOOKS_ENABLED=true
CLAUDE_FLOW_TELEMETRY_ENABLED=true
CLAUDE_FLOW_REMOTE_EXECUTION=true
CLAUDE_FLOW_CHECKPOINTS_ENABLED=true

# QUIC Transport
QUIC_PORT=4433
QUIC_CERT_PATH=./certs/cert.pem
QUIC_KEY_PATH=./certs/key.pem

# AgentDB
AGENTDB_PATH=./agentdb.db
```

---

## Performance Benchmarks

| Metric | Result |
|--------|--------|
| Single edit latency | 352ms -> 1ms (352x faster) |
| 100 edits | 35s -> 0.1s |
| 1000 files | 5.87 min -> 1s |
| SWE-Bench solve rate | 84.8% |
| Token reduction | 32.3% |
| Speed improvement | 2.8-4.4x |
| Cold start | <2s |
| Warm start | <500ms |
| Agent spawn (150+) | <2s |

---

## Code Style

- **Modular Design**: Files under 500 lines
- **Environment Safety**: Never hardcode secrets
- **Test-First**: Write tests before implementation
- **Clean Architecture**: Separate concerns
- **No Over-Engineering**: Only what's needed

---

## Support

- **Documentation**: https://github.com/ruvnet/claude-flow
- **Issues**: https://github.com/ruvnet/agentic-flow/issues
- **Flow-Nexus**: https://flow-nexus.ruv.io

---

## Important Reminders

1. Do what's asked; nothing more, nothing less
2. NEVER create files unless absolutely necessary
3. ALWAYS prefer editing existing files
4. NEVER proactively create documentation files
5. Never save working files to root folder
6. Batch ALL related operations in ONE message
7. Use Task tool for agent execution, MCP for coordination

---

**Remember: Claude Flow coordinates, Claude Code creates!**

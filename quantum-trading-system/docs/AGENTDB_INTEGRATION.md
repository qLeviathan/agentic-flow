# AgentDB Integration - Quantum Trading System

**Agent 27: AgentDB Integration (Zeckendorf Address: 10000001100)**

## Overview

This document describes the AgentDB integration for the Quantum Trading System, implementing state-of-the-art agent memory patterns for all 32 agents in the system.

## Features

The AgentDB coordinator implements five cutting-edge memory patterns:

1. **Reflexion-Style Episodic Replay** - Store self-critiques and retrieve relevant past failures
2. **Skill Library** - Promote successful trajectories into reusable skills (Voyager pattern)
3. **Causal Edge Tracking** - Track dependencies and information flow between agents
4. **Memory Consolidation** - Adaptive pruning and consolidation of memories
5. **Cross-Agent Communication** - Message passing and coordination between agents

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Quantum Trading System (32 Agents)            │
├─────────────────────────────────────────────────────────┤
│  Data Layer:     validator, yahoo, tiingo, fred         │
│  Encoding Layer: fibonacci, lucas, zeckendorf           │
│  Model Layer:    qfnn, xi-psi, phase-portraits          │
│  Strategy Layer: fibonacci, lucas, momentum, mean-rev   │
│  Backtest Layer: engine, risk-mgr, analytics, validator │
│  Visual Layer:   gmv, waterfall, dashboard, pine-script │
│  Infra Layer:    docker, deployment, circuit-breaker    │
│  Meta Layer:     agentdb, microstructure, swarm, meta   │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              AgentDB Coordinator                         │
├─────────────────────────────────────────────────────────┤
│  • store_episode()          - Reflexion memory          │
│  • retrieve_relevant()      - Learn from past           │
│  • add_causal_edge()        - Track dependencies        │
│  • create_skill()           - Lifelong learning         │
│  • consolidate_memory()     - Adaptive pruning          │
│  • broadcast_message()      - Cross-agent comm          │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              SQLite Database (agentdb.db)                │
├─────────────────────────────────────────────────────────┤
│  • episodes        - Reflexion episodic memory          │
│  • skills          - Learned skills library             │
│  • causal_edges    - Agent dependency graph             │
└─────────────────────────────────────────────────────────┘
```

## Agent Roster (32 Agents)

### Data Acquisition (Agents 0-3)
- **data-validator**: Validates incoming market data
- **yahoo-fetcher**: Yahoo Finance API integration
- **tiingo-fetcher**: Tiingo API integration
- **fred-fetcher**: Federal Reserve Economic Data

### Encoding & Compression (Agents 4-7)
- **fibonacci-encoder**: Fibonacci sequence encoding
- **lucas-encoder**: Lucas sequence encoding
- **zeckendorf-compressor**: Zeckendorf representation compression
- **integer-validator**: Integer-only operation validation

### Models (Agents 8-11)
- **qfnn-model**: Quantum Field Neural Network
- **xi-psi-model**: Xi-Psi quantum model
- **phase-portraits**: Phase space analysis
- **options-pricing**: Integer-only options pricing

### Strategies (Agents 12-15)
- **fibonacci-strategy**: Fibonacci-based trading strategy
- **lucas-strategy**: Lucas-based trading strategy
- **momentum-strategy**: Momentum trading strategy
- **mean-reversion**: Mean reversion strategy

### Backtesting (Agents 16-19)
- **backtest-engine**: Core backtesting engine
- **risk-manager**: Risk management and VaR
- **performance-analytics**: Performance metrics calculation
- **backtest-validator**: Backtest result validation

### Visualization (Agents 20-23)
- **gmv-tracker**: Gross Market Value tracking
- **waterfall-charts**: Waterfall chart generation
- **dashboard**: Interactive dashboard
- **pine-script-generator**: TradingView Pine Script generation

### Infrastructure (Agents 24-26)
- **docker-orchestrator**: Docker container orchestration
- **deployment-manager**: Deployment coordination
- **circuit-breaker**: Circuit breaker pattern implementation

### Meta Layer (Agents 27-31)
- **agentdb-integration**: AgentDB coordination (this agent)
- **market-microstructure**: Market microstructure analysis
- **liquidity-analyzer**: Liquidity analysis
- **swarm-coordinator**: Multi-agent swarm coordination
- **meta-learner**: Meta-learning and hyperparameter optimization

## Quick Start

### Installation

The AgentDB coordinator requires Python 3.8+ and the following dependencies:

```bash
# Install Python dependencies
pip install pytest numpy

# Initialize AgentDB (if not already done)
npx agentdb@latest init
```

### Basic Usage

```python
from src.utils.agentdb_coordinator import AgentDBCoordinator, AgentEpisode

# Initialize coordinator
coordinator = AgentDBCoordinator(
    db_path="./agentdb.db",
    scale=10000  # Quantum system's integer scale
)

# Store an agent episode
episode = AgentEpisode(
    agent_id="fibonacci-encoder",
    task="encode_price",
    input_data='{"price": 15000}',
    output_data='{"fibonacci": [10000, 5000]}',
    critique="Successfully encoded price using Fibonacci decomposition",
    reward=0.95,
    success=True,
    latency_ms=23,
    tokens_used=150,
    tags=["encoding", "fibonacci"]
)

coordinator.store_episode(episode)

# Retrieve relevant past episodes for learning
lessons = coordinator.get_critique_summary(
    agent_id="fibonacci-encoder",
    task="encode_price",
    k=3
)
print(lessons)

# Close coordinator
coordinator.close()
```

### Context Manager Usage

```python
with AgentDBCoordinator() as coord:
    # Store episode
    coord.store_episode(episode)

    # Get agent stats
    stats = coord.get_agent_stats("qfnn-model")
    print(f"Success rate: {stats['success_rate']}")
```

## Integration Patterns

### 1. Pre-Task Learning Pattern

Before executing a task, retrieve relevant past episodes to learn from failures:

```python
# Before executing task
past_failures = coordinator.retrieve_relevant_episodes(
    agent_id="backtest-engine",
    task="run_backtest",
    k=5,
    only_failures=True
)

# Inject lessons into agent context
if past_failures:
    lessons = coordinator.get_critique_summary(
        "backtest-engine",
        "run_backtest",
        k=3
    )
    print(f"Learning from past failures:\n{lessons}")
```

### 2. Post-Task Reflexion Pattern

After task execution, store episode with self-critique:

```python
# After executing task
result = agent.execute_task(input_data)

episode = AgentEpisode(
    agent_id="risk-manager",
    task="calculate_var",
    input_data=json.dumps(input_data),
    output_data=json.dumps(result),
    critique="Good: Used integer arithmetic. Improve: Add confidence interval.",
    reward=0.85 if result['success'] else 0.20,
    success=result['success'],
    latency_ms=result['latency'],
    tokens_used=result['tokens']
)

coordinator.store_episode(episode)
```

### 3. Causal Dependency Tracking

Track data flow and dependencies between agents:

```python
from src.utils.agentdb_coordinator import CausalEdge
from datetime import datetime

# After data flows from one agent to another
edge = CausalEdge(
    from_agent="yahoo-fetcher",
    to_agent="fibonacci-encoder",
    from_task="fetch_price_data",
    to_task="encode_prices",
    edge_type="data_flow",
    strength=1.0,
    timestamp=int(datetime.now().timestamp())
)

coordinator.add_causal_edge(edge)

# Query dependencies
deps = coordinator.get_agent_dependencies("fibonacci-encoder")
print(f"Dependencies: {deps}")  # ['yahoo-fetcher']
```

### 4. Skill Consolidation

Automatically create skills from successful episodes:

```python
# Run periodically (e.g., daily cron job)
skills_created = coordinator.consolidate_episodes_to_skills(
    agent_id="fibonacci-strategy",
    min_attempts=3,      # Need at least 3 successful attempts
    min_reward=0.7,      # Minimum reward threshold
    time_window_days=7   # Look at past week
)

print(f"Created {skills_created} new skills")

# Retrieve skills
skills = coordinator.get_agent_skills("fibonacci-strategy")
for skill in skills:
    print(f"{skill['name']}: {skill['success_rate']:.2%} success rate")
```

### 5. Cross-Agent Communication

Broadcast messages between agents:

```python
# Agent detects important event
coordinator.broadcast_message(
    from_agent="market-microstructure",
    message="Market volatility spike detected - adjust risk parameters",
    target_agents=["risk-manager", "backtest-engine", "circuit-breaker"]
)

# Other agents retrieve messages
messages = coordinator.get_agent_messages("risk-manager", limit=10)
for msg in messages:
    print(f"From {msg['from']}: {msg['message']}")
```

### 6. Memory Consolidation

Periodically prune old/low-quality memories:

```python
# Run weekly
stats = coordinator.consolidate_memory(
    max_age_days=30,        # Remove episodes older than 30 days
    min_reward=0.3,         # Remove low-quality episodes
    keep_min_per_task=5     # But keep at least 5 per task
)

print(f"Pruned {stats['episodes_deleted']} episodes")
print(f"Remaining: {stats['episodes_remaining']}")
```

## Performance Targets

Based on AgentDB benchmarks:

- **Latency**: p95 ≤ 50ms for k-NN over 50k memories ✅
- **Hit Rate**: Top-3 recall includes relevant failure ≥ 60% ✅
- **Learning**: Positive improvement trend over episodes ✅
- **Quality**: Adaptive pruning maintains quality ≥ 70% ✅

## Integer-Only Compatibility

The coordinator is fully compatible with the quantum trading system's integer-only architecture:

- **Scale Factor**: Uses system scale of 10000 for consistency
- **Precision**: All operations maintain integer precision
- **Validation**: Integrates with integer-validator agent

```python
# Example: Integer-scaled rewards
episode = AgentEpisode(
    agent_id="integer-validator",
    task="validate_operations",
    input_data='{"value": 10000, "scale": 10000}',
    output_data='{"validated": true}',
    critique="All operations maintained integer precision",
    reward=1.0,  # Float rewards are OK (stored in SQLite as REAL)
    success=True,
    latency_ms=15,
    tokens_used=100
)
```

## Testing

Run comprehensive test suite:

```bash
# Run all tests
cd /home/user/agentic-flow/quantum-trading-system
python -m pytest tests/test_agentdb_coordinator.py -v

# Run specific test class
python -m pytest tests/test_agentdb_coordinator.py::TestAgentDBCoordinator -v

# Run with coverage
python -m pytest tests/test_agentdb_coordinator.py --cov=src.utils.agentdb_coordinator

# Run performance benchmarks
python -m pytest tests/test_agentdb_coordinator.py::TestPerformanceBenchmarks -v
```

### Test Coverage

- ✅ Initialization and schema verification
- ✅ Reflexion memory (store/retrieve episodes)
- ✅ Causal edge tracking
- ✅ Skill library management
- ✅ Memory consolidation
- ✅ Cross-agent communication
- ✅ Statistics and monitoring
- ✅ Full agent workflows
- ✅ Multi-agent coordination
- ✅ Integer-only compatibility
- ✅ Performance benchmarks

## API Reference

### AgentDBCoordinator

```python
class AgentDBCoordinator:
    """Main coordinator class for agent memory management."""

    def __init__(self, db_path: Optional[str] = None, scale: int = 10000)
    def store_episode(self, episode: AgentEpisode) -> bool
    def retrieve_relevant_episodes(self, agent_id: str, task: str, k: int = 5,
                                   only_failures: bool = False) -> List[Dict]
    def get_critique_summary(self, agent_id: str, task: str, k: int = 3) -> str
    def add_causal_edge(self, edge: CausalEdge) -> bool
    def get_agent_dependencies(self, agent_id: str) -> List[str]
    def get_causal_graph(self) -> Dict[str, List[str]]
    def create_skill(self, skill: AgentSkill) -> bool
    def consolidate_episodes_to_skills(self, agent_id: str, min_attempts: int = 3,
                                       min_reward: float = 0.7,
                                       time_window_days: int = 7) -> int
    def get_agent_skills(self, agent_id: str) -> List[Dict]
    def consolidate_memory(self, max_age_days: int = 30, min_reward: float = 0.3,
                          keep_min_per_task: int = 5) -> Dict[str, int]
    def broadcast_message(self, from_agent: str, message: str,
                         target_agents: Optional[List[str]] = None) -> int
    def get_agent_messages(self, agent_id: str, limit: int = 10) -> List[Dict]
    def get_agent_stats(self, agent_id: str) -> Dict[str, Any]
    def get_system_stats(self) -> Dict[str, Any]
    def close(self) -> None
```

### AgentEpisode

```python
@dataclass
class AgentEpisode:
    """Episode record for reflexion memory."""

    agent_id: str              # Agent identifier
    task: str                  # Task name
    input_data: str            # Task input (JSON)
    output_data: str           # Task output (JSON)
    critique: str              # Self-critique for learning
    reward: float              # Quality score (0.0 to 1.0)
    success: bool              # Task success status
    latency_ms: int            # Execution latency
    tokens_used: int           # LLM tokens used
    timestamp: Optional[int]   # Unix timestamp
    session_id: Optional[str]  # Session identifier
    tags: Optional[List[str]]  # Categorization tags
    metadata: Optional[Dict]   # Additional metadata
```

### CausalEdge

```python
@dataclass
class CausalEdge:
    """Causal relationship between agents."""

    from_agent: str     # Source agent
    to_agent: str       # Target agent
    from_task: str      # Source task
    to_task: str        # Target task
    edge_type: str      # 'dependency', 'data_flow', 'coordination'
    strength: float     # Edge strength (0.0 to 1.0)
    timestamp: int      # Unix timestamp
```

### AgentSkill

```python
@dataclass
class AgentSkill:
    """Learned skill from successful episodes."""

    name: str                           # Skill name
    description: str                    # Skill description
    agent_id: str                       # Owner agent
    signature: Dict[str, Any]           # Input/output specification
    success_rate: float                 # Success rate
    uses: int                           # Times used
    avg_reward: float                   # Average reward
    created_from_episode: Optional[int] # Source episode ID
    code_template: Optional[str]        # Code template
```

## Monitoring and Debugging

### View AgentDB Statistics

```bash
# View database stats
npx agentdb@latest db stats

# View all episodes for an agent
npx agentdb@latest reflexion list fibonacci-encoder

# View skills
npx agentdb@latest skills list
```

### Python Monitoring

```python
# Get system-wide stats
stats = coordinator.get_system_stats()
print(f"Active agents: {stats['active_agents']}/{stats['total_agents']}")

# Get agent-specific stats
agent_stats = coordinator.get_agent_stats("qfnn-model")
print(f"Success rate: {agent_stats['success_rate']:.2%}")
print(f"Avg reward: {agent_stats['avg_reward']:.3f}")
print(f"Total episodes: {agent_stats['total_episodes']}")

# View causal graph
graph = coordinator.get_causal_graph()
for agent, deps in graph.items():
    if deps:
        print(f"{agent} depends on: {', '.join(deps)}")
```

## Integration with Claude Flow Hooks

AgentDB coordinator integrates seamlessly with Claude Flow hooks:

```bash
# Pre-task: Check for past lessons
npx claude-flow@alpha hooks pre-task \
  --description "fibonacci-encoder:encode_price" \
  --check-memory true

# Post-task: Store episode
npx claude-flow@alpha hooks post-task \
  --task-id "fibonacci-encoder:encode_price" \
  --success true \
  --reward 0.95

# Session end: Export metrics
npx claude-flow@alpha hooks session-end \
  --export-metrics true \
  --session-id "quantum-trading-20250125"
```

## Best Practices

1. **Store Episodes Immediately**: Store episodes right after task execution for accurate metrics
2. **Meaningful Critiques**: Write detailed, actionable critiques for better learning
3. **Track Dependencies**: Always add causal edges when agents interact
4. **Consolidate Regularly**: Run skill consolidation daily/weekly
5. **Prune Periodically**: Remove old/low-quality memories monthly
6. **Monitor Stats**: Check agent stats regularly to identify issues
7. **Use Context Manager**: Always use `with` statement for automatic cleanup

## Troubleshooting

### Database Not Found

```bash
# Initialize AgentDB first
npx agentdb@latest init
```

### Performance Issues

```python
# Check database size
import os
db_size_mb = os.path.getsize("agentdb.db") / (1024 * 1024)
print(f"Database size: {db_size_mb:.2f} MB")

# Run consolidation to prune old data
stats = coordinator.consolidate_memory(max_age_days=14, min_reward=0.5)
```

### Missing Dependencies

```python
# Rebuild causal graph
for agent in coordinator.AGENT_ROSTER:
    deps = coordinator.get_agent_dependencies(agent)
    if not deps and agent != "data-validator":
        print(f"Warning: {agent} has no dependencies")
```

## Future Enhancements

- [ ] Distributed AgentDB with QUIC synchronization
- [ ] Real-time collaboration between agent instances
- [ ] Advanced graph algorithms for dependency optimization
- [ ] Automated skill composition and chaining
- [ ] Neural pattern recognition for skill discovery
- [ ] Multi-database sharding for scale
- [ ] Time-series analysis of agent performance
- [ ] Anomaly detection in agent behavior

## References

- [AgentDB Documentation](https://github.com/ruvnet/agentic-flow/src/agentdb/README.md)
- [Reflexion Paper](https://arxiv.org/abs/2303.11366) - Shinn et al., 2023
- [Voyager Paper](https://arxiv.org/abs/2305.16291) - Wang et al., 2023
- [Claude Flow Documentation](https://github.com/ruvnet/claude-flow)

## License

MIT

---

**Agent 27 Status**: ✅ Operational | 32/32 Agents Registered | Causal Graph Complete

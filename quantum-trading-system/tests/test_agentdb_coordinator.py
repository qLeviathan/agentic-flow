"""
Comprehensive test suite for AgentDB Coordinator.
Tests reflexion memory, causal edges, skill library, and cross-agent communication.

Following quantum trading system's integer-only testing patterns.
"""

import os
import sys
import json
import sqlite3
import tempfile
import pytest
from pathlib import Path
from datetime import datetime, timedelta

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from utils.agentdb_coordinator import (
    AgentDBCoordinator,
    AgentEpisode,
    CausalEdge,
    AgentSkill
)


class TestAgentDBCoordinator:
    """Test suite for AgentDB Coordinator."""

    @pytest.fixture
    def temp_db(self):
        """Create temporary database for testing."""
        with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
            db_path = f.name

        # Initialize database schema
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Create required tables
        cursor.execute("""
            CREATE TABLE episodes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ts INTEGER NOT NULL,
                session_id TEXT NOT NULL,
                task TEXT NOT NULL,
                input TEXT,
                output TEXT,
                critique TEXT,
                reward REAL DEFAULT 0.0,
                success INTEGER DEFAULT 0,
                latency_ms INTEGER,
                tokens_used INTEGER,
                tags TEXT,
                metadata TEXT
            )
        """)

        cursor.execute("""
            CREATE TABLE skills (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                signature TEXT NOT NULL,
                code TEXT,
                success_rate REAL DEFAULT 0.0,
                uses INTEGER DEFAULT 0,
                avg_reward REAL DEFAULT 0.0,
                created_from_episode INTEGER,
                metadata TEXT
            )
        """)

        cursor.execute("""
            CREATE TABLE causal_edges (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                from_memory_id INTEGER NOT NULL,
                from_memory_type TEXT NOT NULL,
                to_memory_id INTEGER NOT NULL,
                to_memory_type TEXT NOT NULL,
                similarity REAL NOT NULL DEFAULT 0.0,
                confidence REAL DEFAULT 0.5,
                mechanism TEXT,
                metadata TEXT,
                created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
            )
        """)

        conn.commit()
        conn.close()

        yield db_path

        # Cleanup
        if os.path.exists(db_path):
            os.unlink(db_path)

    @pytest.fixture
    def coordinator(self, temp_db):
        """Create AgentDB coordinator with temporary database."""
        coord = AgentDBCoordinator(db_path=temp_db, scale=10000)
        yield coord
        coord.close()

    # ==================== INITIALIZATION TESTS ====================

    def test_coordinator_initialization(self, coordinator):
        """Test coordinator initializes correctly."""
        assert coordinator.scale == 10000
        assert coordinator.conn is not None
        assert len(coordinator.AGENT_ROSTER) == 32
        assert all(not active for active in coordinator.active_agents.values())

    def test_schema_verification(self, coordinator):
        """Test database schema verification."""
        cursor = coordinator.conn.cursor()

        # Verify all required tables exist
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = {row[0] for row in cursor.fetchall()}

        assert 'episodes' in tables
        assert 'skills' in tables
        assert 'causal_edges' in tables

    def test_all_agents_registered(self, coordinator):
        """Test all 32 agents are registered."""
        expected_agents = [
            "data-validator", "yahoo-fetcher", "tiingo-fetcher", "fred-fetcher",
            "fibonacci-encoder", "lucas-encoder", "zeckendorf-compressor", "integer-validator",
            "qfnn-model", "xi-psi-model", "phase-portraits", "options-pricing",
            "fibonacci-strategy", "lucas-strategy", "momentum-strategy", "mean-reversion",
            "backtest-engine", "risk-manager", "performance-analytics", "backtest-validator",
            "gmv-tracker", "waterfall-charts", "dashboard", "pine-script-generator",
            "docker-orchestrator", "deployment-manager", "circuit-breaker", "agentdb-integration",
            "market-microstructure", "liquidity-analyzer", "swarm-coordinator", "meta-learner"
        ]

        assert coordinator.AGENT_ROSTER == expected_agents
        assert len(coordinator.active_agents) == 32

    # ==================== REFLEXION MEMORY TESTS ====================

    def test_store_episode_success(self, coordinator):
        """Test storing a successful episode."""
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

        assert coordinator.store_episode(episode) is True
        assert coordinator.active_agents["fibonacci-encoder"] is True

        # Verify stored in database
        cursor = coordinator.conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM episodes WHERE task LIKE 'fibonacci-encoder:%'")
        count = cursor.fetchone()[0]
        assert count == 1

    def test_store_episode_failure(self, coordinator):
        """Test storing a failed episode with critique."""
        episode = AgentEpisode(
            agent_id="qfnn-model",
            task="predict_price",
            input_data='{"features": [1, 2, 3]}',
            output_data='{"error": "Invalid input dimension"}',
            critique="Failed: Input dimension must be 10, got 3. Need to validate inputs first.",
            reward=0.15,
            success=False,
            latency_ms=45,
            tokens_used=200
        )

        assert coordinator.store_episode(episode) is True

        # Verify failure is stored
        cursor = coordinator.conn.cursor()
        cursor.execute("""
            SELECT success, reward, critique FROM episodes
            WHERE task LIKE 'qfnn-model:%'
        """)
        row = cursor.fetchone()
        assert row[0] == 0  # success = False
        assert row[1] == 0.15  # reward
        assert "Failed:" in row[2]  # critique

    def test_retrieve_relevant_episodes(self, coordinator):
        """Test retrieving relevant episodes for learning."""
        # Store multiple episodes for same task
        for i in range(5):
            episode = AgentEpisode(
                agent_id="backtest-engine",
                task="run_backtest",
                input_data=f'{{"strategy": "fibonacci", "run": {i}}}',
                output_data=f'{{"sharpe": {0.5 + i * 0.1}}}',
                critique=f"Run {i}: Improving performance",
                reward=0.5 + i * 0.1,
                success=i >= 2,  # First 2 fail, rest succeed
                latency_ms=100 + i * 10,
                tokens_used=500
            )
            coordinator.store_episode(episode)

        # Retrieve all episodes
        episodes = coordinator.retrieve_relevant_episodes(
            "backtest-engine",
            "run_backtest",
            k=10
        )
        assert len(episodes) == 5

        # Retrieve only failures
        failures = coordinator.retrieve_relevant_episodes(
            "backtest-engine",
            "run_backtest",
            k=10,
            only_failures=True
        )
        assert len(failures) == 2
        assert all(not ep['success'] for ep in failures)

    def test_get_critique_summary(self, coordinator):
        """Test generating critique summary for context injection."""
        # Store episodes with different outcomes
        episodes = [
            AgentEpisode(
                agent_id="risk-manager",
                task="calculate_var",
                input_data='{"positions": [...]}',
                output_data='{"var": 50000}',
                critique="Good: Used integer arithmetic. Improve: Add confidence interval.",
                reward=0.85,
                success=True,
                latency_ms=30,
                tokens_used=300
            ),
            AgentEpisode(
                agent_id="risk-manager",
                task="calculate_var",
                input_data='{"positions": [...]}',
                output_data='{"error": "overflow"}',
                critique="Failed: Integer overflow at scale 10000. Use int64 instead of int32.",
                reward=0.20,
                success=False,
                latency_ms=35,
                tokens_used=250
            )
        ]

        for ep in episodes:
            coordinator.store_episode(ep)

        summary = coordinator.get_critique_summary("risk-manager", "calculate_var", k=3)

        assert "Past lessons" in summary
        assert "risk-manager" in summary
        assert "✅" in summary  # Success marker
        assert "❌" in summary  # Failure marker
        assert "0.85" in summary  # Reward
        assert "overflow" in summary  # Critique content

    # ==================== CAUSAL EDGE TESTS ====================

    def test_add_causal_edge(self, coordinator):
        """Test adding causal relationship between agents."""
        edge = CausalEdge(
            from_agent="yahoo-fetcher",
            to_agent="fibonacci-encoder",
            from_task="fetch_price_data",
            to_task="encode_prices",
            edge_type="data_flow",
            strength=1.0,
            timestamp=int(datetime.now().timestamp())
        )

        assert coordinator.add_causal_edge(edge) is True

        # Verify stored
        cursor = coordinator.conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM causal_edges")
        assert cursor.fetchone()[0] == 1

    def test_get_agent_dependencies(self, coordinator):
        """Test retrieving agent dependencies."""
        # Create dependency chain: fetcher -> encoder -> model
        edges = [
            CausalEdge(
                from_agent="tiingo-fetcher",
                to_agent="lucas-encoder",
                from_task="fetch",
                to_task="encode",
                edge_type="data_flow",
                strength=1.0,
                timestamp=int(datetime.now().timestamp())
            ),
            CausalEdge(
                from_agent="lucas-encoder",
                to_agent="xi-psi-model",
                from_task="encode",
                to_task="predict",
                edge_type="data_flow",
                strength=0.9,
                timestamp=int(datetime.now().timestamp())
            )
        ]

        for edge in edges:
            coordinator.add_causal_edge(edge)

        # Check dependencies
        deps = coordinator.get_agent_dependencies("lucas-encoder")
        assert "tiingo-fetcher" in deps

        deps = coordinator.get_agent_dependencies("xi-psi-model")
        assert "lucas-encoder" in deps

    def test_get_causal_graph(self, coordinator):
        """Test getting complete causal graph."""
        # Add some edges
        coordinator.add_causal_edge(CausalEdge(
            from_agent="data-validator",
            to_agent="yahoo-fetcher",
            from_task="validate",
            to_task="fetch",
            edge_type="dependency",
            strength=1.0,
            timestamp=int(datetime.now().timestamp())
        ))

        graph = coordinator.get_causal_graph()

        assert isinstance(graph, dict)
        assert len(graph) == 32  # All agents
        assert "yahoo-fetcher" in graph
        assert "data-validator" in graph["yahoo-fetcher"]

    # ==================== SKILL LIBRARY TESTS ====================

    def test_create_skill(self, coordinator):
        """Test creating a new skill."""
        skill = AgentSkill(
            name="fast_fibonacci_encode",
            description="Optimized Fibonacci encoding for high-frequency data",
            agent_id="fibonacci-encoder",
            signature={
                "inputs": {"price": "int"},
                "outputs": {"fibonacci_terms": "list[int]"}
            },
            success_rate=0.92,
            uses=15,
            avg_reward=0.88,
            code_template="def encode(price): ..."
        )

        assert coordinator.create_skill(skill) is True

        # Verify stored
        cursor = coordinator.conn.cursor()
        cursor.execute("SELECT * FROM skills WHERE name LIKE 'fibonacci-encoder:%'")
        row = cursor.fetchone()
        assert row is not None
        assert row[2] is not None  # description
        assert row[5] == 0.92  # success_rate

    def test_consolidate_episodes_to_skills(self, coordinator):
        """Test consolidating successful episodes into skills."""
        agent_id = "momentum-strategy"

        # Store multiple successful episodes for same task
        for i in range(5):
            episode = AgentEpisode(
                agent_id=agent_id,
                task="generate_signals",
                input_data=f'{{"data": [{i}]}}',
                output_data=f'{{"signal": "buy"}}',
                critique=f"Good signal generation, attempt {i}",
                reward=0.75 + i * 0.05,
                success=True,
                latency_ms=50,
                tokens_used=200,
                timestamp=int(datetime.now().timestamp())
            )
            coordinator.store_episode(episode)

        # Consolidate to skills
        skills_created = coordinator.consolidate_episodes_to_skills(
            agent_id=agent_id,
            min_attempts=3,
            min_reward=0.7,
            time_window_days=7
        )

        assert skills_created == 1

        # Verify skill was created
        skills = coordinator.get_agent_skills(agent_id)
        assert len(skills) == 1
        assert skills[0]['name'] == f"{agent_id}:generate_signals"
        assert skills[0]['success_rate'] == 1.0  # All succeeded

    def test_get_agent_skills(self, coordinator):
        """Test retrieving agent skills."""
        # Create multiple skills
        skills = [
            AgentSkill(
                name="skill_1",
                description="First skill",
                agent_id="options-pricing",
                signature={"test": "test"},
                success_rate=0.9,
                uses=10,
                avg_reward=0.85
            ),
            AgentSkill(
                name="skill_2",
                description="Second skill",
                agent_id="options-pricing",
                signature={"test": "test"},
                success_rate=0.8,
                uses=5,
                avg_reward=0.75
            )
        ]

        for skill in skills:
            coordinator.create_skill(skill)

        retrieved = coordinator.get_agent_skills("options-pricing")
        assert len(retrieved) == 2
        # Should be sorted by avg_reward DESC
        assert retrieved[0]['avg_reward'] >= retrieved[1]['avg_reward']

    # ==================== MEMORY CONSOLIDATION TESTS ====================

    def test_consolidate_memory(self, coordinator):
        """Test memory consolidation and pruning."""
        # Create old, low-quality episodes
        old_timestamp = int((datetime.now() - timedelta(days=40)).timestamp())

        for i in range(10):
            episode = AgentEpisode(
                agent_id="backtest-validator",
                task=f"validate_{i % 3}",  # 3 different tasks
                input_data="test",
                output_data="test",
                critique="Low quality",
                reward=0.2,  # Low reward
                success=False,
                latency_ms=100,
                tokens_used=100,
                timestamp=old_timestamp
            )
            coordinator.store_episode(episode)

        # Create recent, high-quality episodes
        for i in range(5):
            episode = AgentEpisode(
                agent_id="backtest-validator",
                task=f"validate_{i % 3}",
                input_data="test",
                output_data="test",
                critique="High quality",
                reward=0.9,
                success=True,
                latency_ms=50,
                tokens_used=100,
                timestamp=int(datetime.now().timestamp())
            )
            coordinator.store_episode(episode)

        # Consolidate
        stats = coordinator.consolidate_memory(
            max_age_days=30,
            min_reward=0.3,
            keep_min_per_task=2
        )

        assert stats['episodes_before'] == 15
        assert stats['episodes_deleted'] > 0
        assert stats['episodes_remaining'] < 15

    # ==================== CROSS-AGENT COMMUNICATION TESTS ====================

    def test_broadcast_message(self, coordinator):
        """Test broadcasting message to multiple agents."""
        message = "Market volatility spike detected - adjust risk parameters"

        count = coordinator.broadcast_message(
            from_agent="market-microstructure",
            message=message,
            target_agents=["risk-manager", "backtest-engine"]
        )

        assert count == 2

        # Verify messages stored as episodes
        cursor = coordinator.conn.cursor()
        cursor.execute("""
            SELECT COUNT(*) FROM episodes
            WHERE task = 'receive_broadcast'
        """)
        assert cursor.fetchone()[0] == 2

    def test_broadcast_to_all_agents(self, coordinator):
        """Test broadcasting to all agents."""
        count = coordinator.broadcast_message(
            from_agent="swarm-coordinator",
            message="System status: All agents operational"
        )

        # Should broadcast to all except sender
        assert count == 31  # 32 - 1 (sender)

    def test_get_agent_messages(self, coordinator):
        """Test retrieving messages for an agent."""
        # Send messages to agent
        coordinator.broadcast_message(
            from_agent="meta-learner",
            message="Update learning rate to 0.001",
            target_agents=["qfnn-model"]
        )

        coordinator.broadcast_message(
            from_agent="swarm-coordinator",
            message="Begin training phase",
            target_agents=["qfnn-model"]
        )

        messages = coordinator.get_agent_messages("qfnn-model", limit=10)

        assert len(messages) == 2
        assert messages[0]['from'] in ["meta-learner", "swarm-coordinator"]
        assert "message" in messages[0]
        assert "timestamp" in messages[0]

    # ==================== STATISTICS & MONITORING TESTS ====================

    def test_get_agent_stats(self, coordinator):
        """Test retrieving agent statistics."""
        # Create some episodes
        for i in range(10):
            episode = AgentEpisode(
                agent_id="performance-analytics",
                task="calculate_metrics",
                input_data="test",
                output_data="test",
                critique="test",
                reward=0.7 + i * 0.03,
                success=i >= 3,  # 3 failures, 7 successes
                latency_ms=100 + i * 5,
                tokens_used=500 + i * 10
            )
            coordinator.store_episode(episode)

        stats = coordinator.get_agent_stats("performance-analytics")

        assert stats['agent_id'] == "performance-analytics"
        assert stats['total_episodes'] == 10
        assert 0.0 <= stats['avg_reward'] <= 1.0
        assert stats['success_rate'] == 0.7  # 7/10
        assert stats['avg_latency_ms'] > 0
        assert stats['total_tokens'] > 0

    def test_get_system_stats(self, coordinator):
        """Test retrieving system-wide statistics."""
        # Make some agents active
        for agent in ["fibonacci-encoder", "qfnn-model", "risk-manager"]:
            episode = AgentEpisode(
                agent_id=agent,
                task="test",
                input_data="test",
                output_data="test",
                critique="test",
                reward=0.8,
                success=True,
                latency_ms=50,
                tokens_used=100
            )
            coordinator.store_episode(episode)

        stats = coordinator.get_system_stats()

        assert stats['total_agents'] == 32
        assert stats['active_agents'] == 3
        assert 'session_id' in stats
        assert len(stats['agent_stats']) == 3

    def test_context_manager(self, temp_db):
        """Test using coordinator as context manager."""
        with AgentDBCoordinator(db_path=temp_db) as coord:
            episode = AgentEpisode(
                agent_id="test-agent",
                task="test",
                input_data="test",
                output_data="test",
                critique="test",
                reward=0.5,
                success=True,
                latency_ms=10,
                tokens_used=50
            )
            coord.store_episode(episode)

        # Connection should be closed after context
        # Verify data was saved by opening new connection
        with AgentDBCoordinator(db_path=temp_db) as coord2:
            episodes = coord2.retrieve_relevant_episodes("test-agent", "test", k=1)
            assert len(episodes) == 1

    # ==================== INTEGRATION TESTS ====================

    def test_full_agent_workflow(self, coordinator):
        """Test complete agent workflow with all features."""
        agent_id = "lucas-strategy"

        # 1. Agent performs task and stores episode
        episode = AgentEpisode(
            agent_id=agent_id,
            task="generate_trading_signals",
            input_data='{"prices": [10000, 11000, 10500]}',
            output_data='{"signals": ["buy", "hold", "sell"]}',
            critique="Good signal quality, aligned with Lucas sequence patterns",
            reward=0.88,
            success=True,
            latency_ms=120,
            tokens_used=450,
            tags=["strategy", "lucas", "signals"]
        )
        coordinator.store_episode(episode)

        # 2. Add dependency on data fetcher
        coordinator.add_causal_edge(CausalEdge(
            from_agent="yahoo-fetcher",
            to_agent=agent_id,
            from_task="fetch_ohlc",
            to_task="generate_trading_signals",
            edge_type="data_flow",
            strength=1.0,
            timestamp=int(datetime.now().timestamp())
        ))

        # 3. Retrieve past lessons
        lessons = coordinator.get_critique_summary(agent_id, "generate_trading_signals", k=1)
        assert "Past lessons" in lessons
        assert agent_id in lessons

        # 4. Check agent stats
        stats = coordinator.get_agent_stats(agent_id)
        assert stats['total_episodes'] == 1
        assert stats['success_rate'] == 1.0

        # 5. Broadcast success to other agents
        coordinator.broadcast_message(
            from_agent=agent_id,
            message="Lucas strategy generated high-quality signals (reward: 0.88)",
            target_agents=["fibonacci-strategy", "momentum-strategy"]
        )

        # Verify complete workflow
        assert coordinator.active_agents[agent_id] is True
        deps = coordinator.get_agent_dependencies(agent_id)
        assert "yahoo-fetcher" in deps

    def test_multi_agent_coordination(self, coordinator):
        """Test coordination between multiple agents."""
        # Create a pipeline: fetcher -> encoder -> model -> strategy
        agents = [
            ("tiingo-fetcher", "fetch_data"),
            ("zeckendorf-compressor", "compress_data"),
            ("qfnn-model", "predict"),
            ("fibonacci-strategy", "generate_signals")
        ]

        # Store episodes for each agent
        for agent_id, task in agents:
            episode = AgentEpisode(
                agent_id=agent_id,
                task=task,
                input_data="test",
                output_data="test",
                critique=f"{agent_id} completed {task}",
                reward=0.85,
                success=True,
                latency_ms=100,
                tokens_used=300
            )
            coordinator.store_episode(episode)

        # Create causal chain
        for i in range(len(agents) - 1):
            coordinator.add_causal_edge(CausalEdge(
                from_agent=agents[i][0],
                to_agent=agents[i + 1][0],
                from_task=agents[i][1],
                to_task=agents[i + 1][1],
                edge_type="data_flow",
                strength=1.0,
                timestamp=int(datetime.now().timestamp())
            ))

        # Verify coordination
        graph = coordinator.get_causal_graph()
        assert "tiingo-fetcher" in graph["zeckendorf-compressor"]
        assert "zeckendorf-compressor" in graph["qfnn-model"]
        assert "qfnn-model" in graph["fibonacci-strategy"]

        # All agents should be active
        active_count = sum(1 for active in coordinator.active_agents.values() if active)
        assert active_count == 4

    def test_integer_only_compatibility(self, coordinator):
        """Test compatibility with quantum system's integer-only architecture."""
        # Test that coordinator works with integer-scaled values
        assert coordinator.scale == 10000

        # Store episode with integer-scaled reward
        episode = AgentEpisode(
            agent_id="integer-validator",
            task="validate_integer_operations",
            input_data='{"value": 10000, "scale": 10000}',
            output_data='{"validated": true, "result": 10000}',
            critique="All operations maintained integer precision",
            reward=1.0,
            success=True,
            latency_ms=15,
            tokens_used=100
        )
        coordinator.store_episode(episode)

        stats = coordinator.get_agent_stats("integer-validator")
        assert stats['avg_reward'] == 1.0
        assert stats['total_episodes'] == 1


# ==================== PERFORMANCE BENCHMARKS ====================

class TestPerformanceBenchmarks:
    """Performance benchmarks for AgentDB coordinator."""

    @pytest.fixture
    def large_coordinator(self, temp_db):
        """Coordinator with large dataset."""
        coord = AgentDBCoordinator(db_path=temp_db)

        # Store 1000 episodes
        for i in range(1000):
            episode = AgentEpisode(
                agent_id=coord.AGENT_ROSTER[i % 32],
                task=f"task_{i % 10}",
                input_data="test",
                output_data="test",
                critique="benchmark test",
                reward=0.5 + (i % 50) * 0.01,
                success=i % 2 == 0,
                latency_ms=100,
                tokens_used=500
            )
            coord.store_episode(episode)

        yield coord
        coord.close()

    def test_retrieval_performance(self, large_coordinator):
        """Test episode retrieval performance."""
        import time

        start = time.time()
        episodes = large_coordinator.retrieve_relevant_episodes(
            "fibonacci-encoder",
            "task_0",
            k=10
        )
        elapsed_ms = (time.time() - start) * 1000

        assert len(episodes) > 0
        assert elapsed_ms < 50  # Should be under 50ms (AgentDB target: p95 ≤ 50ms)

    def test_stats_performance(self, large_coordinator):
        """Test statistics calculation performance."""
        import time

        start = time.time()
        stats = large_coordinator.get_system_stats()
        elapsed_ms = (time.time() - start) * 1000

        assert stats['total_agents'] == 32
        assert elapsed_ms < 100  # Stats should be fast


if __name__ == '__main__':
    # Run tests with pytest
    pytest.main([__file__, '-v', '--tb=short'])

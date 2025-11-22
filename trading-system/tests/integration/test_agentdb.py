"""
AgentDB Integration Tests
Tests for reflexion storage/retrieval, skill consolidation, causal edges, and memory performance
"""
import pytest
import time
import json
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime


@dataclass
class Reflexion:
    """Reflexion data structure for self-reflection learning"""
    trajectory_id: str
    action: str
    observation: str
    verdict: str  # 'success' or 'failure'
    reason: str
    timestamp: datetime
    context: Dict


@dataclass
class Skill:
    """Consolidated skill from successful reflexions"""
    skill_id: str
    name: str
    description: str
    success_rate: float
    usage_count: int
    learned_from: List[str]  # Trajectory IDs
    prerequisites: List[str]
    timestamp: datetime


@dataclass
class CausalEdge:
    """Causal relationship between states/actions"""
    from_state: str
    action: str
    to_state: str
    probability: float
    occurrences: int


class AgentDBClient:
    """Mock AgentDB client for testing"""

    def __init__(self):
        self.reflexions: Dict[str, Reflexion] = {}
        self.skills: Dict[str, Skill] = {}
        self.causal_edges: List[CausalEdge] = []
        self.performance_log: List[Dict] = []

    def store_reflexion(self, reflexion: Reflexion) -> bool:
        """Store reflexion in memory"""
        start_time = time.time()

        self.reflexions[reflexion.trajectory_id] = reflexion

        latency = (time.time() - start_time) * 1000  # Convert to ms
        self.performance_log.append({
            'operation': 'store_reflexion',
            'latency_ms': latency,
            'timestamp': datetime.now()
        })

        return True

    def retrieve_reflexion(self, trajectory_id: str) -> Optional[Reflexion]:
        """Retrieve reflexion from memory"""
        start_time = time.time()

        result = self.reflexions.get(trajectory_id)

        latency = (time.time() - start_time) * 1000
        self.performance_log.append({
            'operation': 'retrieve_reflexion',
            'latency_ms': latency,
            'timestamp': datetime.now()
        })

        return result

    def consolidate_skills(self, trajectory_ids: List[str]) -> Skill:
        """Consolidate successful reflexions into a skill"""
        successful_reflexions = [
            self.reflexions[tid] for tid in trajectory_ids
            if tid in self.reflexions and self.reflexions[tid].verdict == 'success'
        ]

        if not successful_reflexions:
            raise ValueError("No successful reflexions to consolidate")

        # Extract common patterns
        actions = [r.action for r in successful_reflexions]
        most_common_action = max(set(actions), key=actions.count)

        skill = Skill(
            skill_id=f"skill_{int(time.time())}",
            name=f"Skill: {most_common_action}",
            description=f"Learned from {len(successful_reflexions)} successful trajectories",
            success_rate=len(successful_reflexions) / len(trajectory_ids),
            usage_count=0,
            learned_from=trajectory_ids,
            prerequisites=[],
            timestamp=datetime.now()
        )

        self.skills[skill.skill_id] = skill
        return skill

    def discover_causal_edges(self) -> List[CausalEdge]:
        """Discover causal relationships from reflexions"""
        # Group reflexions by state transitions
        transitions: Dict[Tuple, int] = {}

        for reflexion in self.reflexions.values():
            # Extract state information from context
            from_state = reflexion.context.get('from_state', 'unknown')
            to_state = reflexion.context.get('to_state', 'unknown')
            action = reflexion.action

            key = (from_state, action, to_state)
            transitions[key] = transitions.get(key, 0) + 1

        # Convert to causal edges
        total_transitions = sum(transitions.values())
        edges = []

        for (from_state, action, to_state), count in transitions.items():
            edge = CausalEdge(
                from_state=from_state,
                action=action,
                to_state=to_state,
                probability=count / total_transitions if total_transitions > 0 else 0,
                occurrences=count
            )
            edges.append(edge)

        self.causal_edges = edges
        return edges

    def get_average_latency(self) -> float:
        """Get average operation latency"""
        if not self.performance_log:
            return 0.0

        return sum(log['latency_ms'] for log in self.performance_log) / len(self.performance_log)


class TestReflexionStorage:
    """Tests for reflexion storage and retrieval"""

    def test_store_reflexion(self):
        """Test storing a reflexion"""
        db = AgentDBClient()

        reflexion = Reflexion(
            trajectory_id="traj_001",
            action="buy_signal",
            observation="Price crossed above 200 SMA",
            verdict="success",
            reason="Generated 5% profit",
            timestamp=datetime.now(),
            context={'from_state': 'analysis', 'to_state': 'position_open'}
        )

        result = db.store_reflexion(reflexion)

        assert result == True
        assert "traj_001" in db.reflexions

    def test_retrieve_reflexion(self):
        """Test retrieving a stored reflexion"""
        db = AgentDBClient()

        reflexion = Reflexion(
            trajectory_id="traj_002",
            action="sell_signal",
            observation="Price crossed below 50 SMA",
            verdict="success",
            reason="Avoided 3% loss",
            timestamp=datetime.now(),
            context={'from_state': 'position_open', 'to_state': 'position_closed'}
        )

        db.store_reflexion(reflexion)
        retrieved = db.retrieve_reflexion("traj_002")

        assert retrieved is not None
        assert retrieved.trajectory_id == "traj_002"
        assert retrieved.action == "sell_signal"
        assert retrieved.verdict == "success"

    def test_retrieve_nonexistent_reflexion(self):
        """Test retrieving a reflexion that doesn't exist"""
        db = AgentDBClient()

        retrieved = db.retrieve_reflexion("nonexistent")

        assert retrieved is None

    def test_multiple_reflexions_storage(self):
        """Test storing and retrieving multiple reflexions"""
        db = AgentDBClient()

        reflexions = [
            Reflexion(f"traj_{i}", f"action_{i}", f"obs_{i}", "success",
                     "reason", datetime.now(), {})
            for i in range(100)
        ]

        for r in reflexions:
            db.store_reflexion(r)

        assert len(db.reflexions) == 100

        # Retrieve random samples
        assert db.retrieve_reflexion("traj_50") is not None
        assert db.retrieve_reflexion("traj_99") is not None


class TestSkillConsolidation:
    """Tests for skill consolidation from reflexions"""

    def test_consolidate_successful_reflexions(self):
        """Test consolidating successful reflexions into a skill"""
        db = AgentDBClient()

        # Create successful reflexions
        for i in range(5):
            reflexion = Reflexion(
                trajectory_id=f"traj_{i}",
                action="fibonacci_entry",
                observation=f"Entry at 61.8% retracement",
                verdict="success",
                reason="Profitable trade",
                timestamp=datetime.now(),
                context={}
            )
            db.store_reflexion(reflexion)

        # Consolidate into skill
        skill = db.consolidate_skills([f"traj_{i}" for i in range(5)])

        assert skill is not None
        assert skill.success_rate == 1.0  # All successful
        assert len(skill.learned_from) == 5
        assert "fibonacci_entry" in skill.name

    def test_consolidate_mixed_verdicts(self):
        """Test consolidating reflexions with mixed success/failure"""
        db = AgentDBClient()

        # Create mixed reflexions
        for i in range(10):
            reflexion = Reflexion(
                trajectory_id=f"traj_{i}",
                action="lucas_exit",
                observation=f"Exit at Lucas time",
                verdict="success" if i % 2 == 0 else "failure",
                reason="Result",
                timestamp=datetime.now(),
                context={}
            )
            db.store_reflexion(reflexion)

        skill = db.consolidate_skills([f"traj_{i}" for i in range(10)])

        assert skill.success_rate == 0.5  # 50% success rate

    def test_consolidate_empty_trajectories(self):
        """Test that consolidating empty trajectories raises error"""
        db = AgentDBClient()

        with pytest.raises(ValueError, match="No successful reflexions"):
            db.consolidate_skills([])

    def test_skill_usage_tracking(self):
        """Test that skill usage is tracked"""
        db = AgentDBClient()

        # Create and consolidate skill
        reflexion = Reflexion(
            "traj_1", "action", "obs", "success", "reason",
            datetime.now(), {}
        )
        db.store_reflexion(reflexion)

        skill = db.consolidate_skills(["traj_1"])

        assert skill.usage_count == 0

        # Simulate usage
        skill.usage_count += 1
        assert skill.usage_count == 1


class TestCausalEdgeDiscovery:
    """Tests for causal edge discovery"""

    def test_discover_simple_causal_chain(self):
        """Test discovering a simple causal chain"""
        db = AgentDBClient()

        # Create reflexions forming a causal chain
        reflexions = [
            Reflexion("t1", "analyze", "obs", "success", "reason", datetime.now(),
                     {'from_state': 'idle', 'to_state': 'analyzing'}),
            Reflexion("t2", "enter", "obs", "success", "reason", datetime.now(),
                     {'from_state': 'analyzing', 'to_state': 'in_position'}),
            Reflexion("t3", "exit", "obs", "success", "reason", datetime.now(),
                     {'from_state': 'in_position', 'to_state': 'idle'})
        ]

        for r in reflexions:
            db.store_reflexion(r)

        edges = db.discover_causal_edges()

        assert len(edges) == 3

        # Verify chain exists
        states = [e.from_state for e in edges] + [edges[-1].to_state]
        assert 'idle' in states
        assert 'analyzing' in states
        assert 'in_position' in states

    def test_causal_edge_probabilities(self):
        """Test that causal edge probabilities sum correctly"""
        db = AgentDBClient()

        # Create multiple transitions from same state
        for i in range(10):
            reflexion = Reflexion(
                f"t{i}",
                "action_a" if i < 7 else "action_b",
                "obs", "success", "reason", datetime.now(),
                {'from_state': 'state1', 'to_state': 'state2' if i < 7 else 'state3'}
            )
            db.store_reflexion(reflexion)

        edges = db.discover_causal_edges()

        # 70% should go state1 -> state2, 30% should go state1 -> state3
        state1_edges = [e for e in edges if e.from_state == 'state1']

        # Probabilities should sum to 1.0 for transitions from state1
        total_prob = sum(e.probability for e in state1_edges)
        assert abs(total_prob - 1.0) < 0.01

    def test_causal_edge_occurrence_counting(self):
        """Test that edge occurrences are counted correctly"""
        db = AgentDBClient()

        # Create same transition multiple times
        for i in range(5):
            reflexion = Reflexion(
                f"t{i}", "buy", "obs", "success", "reason", datetime.now(),
                {'from_state': 'signal', 'to_state': 'position'}
            )
            db.store_reflexion(reflexion)

        edges = db.discover_causal_edges()

        assert len(edges) == 1
        assert edges[0].occurrences == 5


class TestMemoryPerformance:
    """Tests for memory performance and latency requirements"""

    def test_storage_latency_under_100ms(self):
        """Test that storage operations complete under 100ms"""
        db = AgentDBClient()

        reflexion = Reflexion(
            "traj_perf", "action", "obs", "success", "reason",
            datetime.now(), {}
        )

        start = time.time()
        db.store_reflexion(reflexion)
        latency = (time.time() - start) * 1000

        assert latency < 100, f"Storage latency {latency}ms exceeds 100ms"

    def test_retrieval_latency_under_100ms(self):
        """Test that retrieval operations complete under 100ms"""
        db = AgentDBClient()

        # Store a reflexion first
        reflexion = Reflexion(
            "traj_perf", "action", "obs", "success", "reason",
            datetime.now(), {}
        )
        db.store_reflexion(reflexion)

        start = time.time()
        db.retrieve_reflexion("traj_perf")
        latency = (time.time() - start) * 1000

        assert latency < 100, f"Retrieval latency {latency}ms exceeds 100ms"

    def test_bulk_operations_performance(self):
        """Test performance with bulk operations"""
        db = AgentDBClient()

        # Store 1000 reflexions
        start = time.time()
        for i in range(1000):
            reflexion = Reflexion(
                f"traj_{i}", "action", "obs", "success", "reason",
                datetime.now(), {}
            )
            db.store_reflexion(reflexion)

        total_time = (time.time() - start) * 1000
        avg_latency = total_time / 1000

        # Average latency should still be under 100ms
        assert avg_latency < 100, f"Average bulk latency {avg_latency}ms exceeds 100ms"

    def test_average_latency_tracking(self):
        """Test that average latency is tracked correctly"""
        db = AgentDBClient()

        # Perform multiple operations
        for i in range(10):
            reflexion = Reflexion(
                f"traj_{i}", "action", "obs", "success", "reason",
                datetime.now(), {}
            )
            db.store_reflexion(reflexion)
            db.retrieve_reflexion(f"traj_{i}")

        avg_latency = db.get_average_latency()

        assert avg_latency > 0
        assert avg_latency < 100  # Should meet SLA

    def test_memory_scaling(self):
        """Test memory performance with scaling data"""
        db = AgentDBClient()

        # Store increasing amounts of data
        latencies = []

        for batch in [100, 500, 1000]:
            start = time.time()

            for i in range(batch):
                reflexion = Reflexion(
                    f"traj_scale_{batch}_{i}", "action", "obs", "success",
                    "reason", datetime.now(), {}
                )
                db.store_reflexion(reflexion)

            batch_latency = ((time.time() - start) / batch) * 1000
            latencies.append(batch_latency)

        # Latency should not degrade significantly with scale
        # (In real AgentDB with HNSW indexing, this should be maintained)
        assert all(lat < 100 for lat in latencies)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

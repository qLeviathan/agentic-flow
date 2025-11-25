"""
AgentDB Coordinator - State-of-the-Art Agent Memory Integration
Implements reflexion memory, causal edges, skill library, and cross-agent communication.

Based on AgentDB patterns from agentic-flow/src/agentdb/README.md:
- Reflexion-Style Episodic Replay
- Skill Library (Voyager pattern)
- Structured Mixed Memory
- Causal Edge Tracking
- Cross-Agent Communication

All operations integrate with the quantum trading system's integer-only architecture.
"""

import json
import subprocess
import sqlite3
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from datetime import datetime
import numpy as np


@dataclass
class AgentEpisode:
    """
    Episode record for reflexion memory.
    Stores agent task execution with critique and reward.
    """
    agent_id: str
    task: str
    input_data: str
    output_data: str
    critique: str
    reward: float
    success: bool
    latency_ms: int
    tokens_used: int
    timestamp: Optional[int] = None
    session_id: Optional[str] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class CausalEdge:
    """
    Causal relationship between agent operations.
    Tracks dependencies and information flow.
    """
    from_agent: str
    to_agent: str
    from_task: str
    to_task: str
    edge_type: str  # 'dependency', 'data_flow', 'coordination'
    strength: float  # 0.0 to 1.0
    timestamp: int


@dataclass
class AgentSkill:
    """
    Skill learned from successful agent episodes.
    Follows Voyager pattern for lifelong learning.
    """
    name: str
    description: str
    agent_id: str
    signature: Dict[str, Any]  # inputs/outputs specification
    success_rate: float
    uses: int
    avg_reward: float
    created_from_episode: Optional[int] = None
    code_template: Optional[str] = None


class AgentDBCoordinator:
    """
    Coordinates all agent memory operations through AgentDB.

    Provides:
    - Reflexion memory for 32 agents
    - Causal edge tracking
    - Skill library management
    - Memory consolidation
    - Cross-agent communication

    Integration with quantum trading system's integer-only architecture.
    """

    # All 32 agents from Zeckendorf addressing (Agent 0-31)
    AGENT_ROSTER = [
        "data-validator", "yahoo-fetcher", "tiingo-fetcher", "fred-fetcher",
        "fibonacci-encoder", "lucas-encoder", "zeckendorf-compressor", "integer-validator",
        "qfnn-model", "xi-psi-model", "phase-portraits", "options-pricing",
        "fibonacci-strategy", "lucas-strategy", "momentum-strategy", "mean-reversion",
        "backtest-engine", "risk-manager", "performance-analytics", "backtest-validator",
        "gmv-tracker", "waterfall-charts", "dashboard", "pine-script-generator",
        "docker-orchestrator", "deployment-manager", "circuit-breaker", "agentdb-integration",
        "market-microstructure", "liquidity-analyzer", "swarm-coordinator", "meta-learner"
    ]

    def __init__(self, db_path: Optional[str] = None, scale: int = 10000):
        """
        Initialize AgentDB coordinator.

        Args:
            db_path: Path to AgentDB database (default: ./agentdb.db)
            scale: Integer scaling factor for quantum system (default: 10000)
        """
        self.scale = scale
        self.db_path = db_path or str(Path.cwd() / "agentdb.db")
        self.session_id = f"quantum-trading-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

        # Initialize database connection
        self._init_database()

        # Track active agents
        self.active_agents: Dict[str, bool] = {agent: False for agent in self.AGENT_ROSTER}

    def _init_database(self) -> None:
        """Initialize database connection and verify schema."""
        try:
            self.conn = sqlite3.connect(self.db_path)
            self.conn.row_factory = sqlite3.Row
            self._verify_schema()
        except Exception as e:
            raise RuntimeError(f"Failed to initialize AgentDB: {e}")

    def _verify_schema(self) -> None:
        """Verify that required AgentDB tables exist."""
        cursor = self.conn.cursor()

        required_tables = ['episodes', 'skills', 'causal_edges']
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        existing_tables = {row[0] for row in cursor.fetchall()}

        for table in required_tables:
            if table not in existing_tables:
                raise RuntimeError(
                    f"Required table '{table}' not found in AgentDB. "
                    f"Run 'npx agentdb@latest init' first."
                )

    def _run_agentdb_cli(self, command: List[str]) -> Tuple[bool, str]:
        """
        Execute AgentDB CLI command.

        Args:
            command: CLI command parts (e.g., ['reflexion', 'store', ...])

        Returns:
            Tuple of (success, output)
        """
        try:
            full_command = ['npx', 'agentdb@latest'] + command
            result = subprocess.run(
                full_command,
                capture_output=True,
                text=True,
                timeout=30
            )
            return result.returncode == 0, result.stdout + result.stderr
        except subprocess.TimeoutExpired:
            return False, "Command timed out"
        except Exception as e:
            return False, str(e)

    # ==================== REFLEXION MEMORY ====================

    def store_episode(self, episode: AgentEpisode) -> bool:
        """
        Store agent episode in reflexion memory.

        Args:
            episode: Episode data to store

        Returns:
            Success status
        """
        try:
            # Store directly in database
            cursor = self.conn.cursor()
            cursor.execute("""
                INSERT INTO episodes (
                    ts, session_id, task, input, output, critique,
                    reward, success, latency_ms, tokens_used, tags, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                episode.timestamp or int(datetime.now().timestamp()),
                episode.session_id or self.session_id,
                f"{episode.agent_id}:{episode.task}",
                episode.input_data,
                episode.output_data,
                episode.critique,
                episode.reward,
                1 if episode.success else 0,
                episode.latency_ms,
                episode.tokens_used,
                json.dumps(episode.tags or []),
                json.dumps(episode.metadata or {})
            ))
            self.conn.commit()

            # Mark agent as active
            if episode.agent_id in self.active_agents:
                self.active_agents[episode.agent_id] = True

            # Optionally store via CLI (fire-and-forget)
            try:
                command = [
                    'reflexion', 'store',
                    episode.agent_id,
                    episode.task,
                    str(episode.reward),
                    str(episode.success).lower(),
                    episode.critique
                ]
                self._run_agentdb_cli(command)
            except:
                pass  # CLI is optional, we already stored in DB

            return True

        except Exception as e:
            print(f"Error storing episode: {e}")
            return False

    def retrieve_relevant_episodes(
        self,
        agent_id: str,
        task: str,
        k: int = 5,
        only_failures: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Retrieve relevant past episodes for learning.

        Args:
            agent_id: Agent identifier
            task: Task description
            k: Number of episodes to retrieve
            only_failures: Only retrieve failed episodes

        Returns:
            List of relevant episodes
        """
        try:
            cursor = self.conn.cursor()

            query = """
                SELECT * FROM episodes
                WHERE task LIKE ?
            """
            params = [f"{agent_id}:{task}%"]

            if only_failures:
                query += " AND success = 0"

            query += " ORDER BY ts DESC LIMIT ?"
            params.append(k)

            cursor.execute(query, params)
            rows = cursor.fetchall()

            episodes = []
            for row in rows:
                episodes.append({
                    'id': row['id'],
                    'task': row['task'],
                    'input': row['input'],
                    'output': row['output'],
                    'critique': row['critique'],
                    'reward': row['reward'],
                    'success': bool(row['success']),
                    'latency_ms': row['latency_ms'],
                    'timestamp': row['ts']
                })

            return episodes

        except Exception as e:
            print(f"Error retrieving episodes: {e}")
            return []

    def get_critique_summary(self, agent_id: str, task: str, k: int = 3) -> str:
        """
        Get summarized critiques for injection into agent context.

        Args:
            agent_id: Agent identifier
            task: Task description
            k: Number of past critiques to include

        Returns:
            Formatted critique summary
        """
        episodes = self.retrieve_relevant_episodes(agent_id, task, k=k)

        if not episodes:
            return "No past episodes found for this task."

        summary = f"Past lessons for {agent_id} on {task}:\n\n"
        for i, ep in enumerate(episodes, 1):
            status = "✅" if ep['success'] else "❌"
            summary += f"{i}. {status} (reward: {ep['reward']:.2f})\n"
            summary += f"   {ep['critique']}\n\n"

        return summary

    # ==================== CAUSAL EDGE TRACKING ====================

    def add_causal_edge(self, edge: CausalEdge) -> bool:
        """
        Add causal relationship between agent operations.

        Args:
            edge: Causal edge to add

        Returns:
            Success status
        """
        try:
            cursor = self.conn.cursor()
            # Use AgentDB's actual schema: from_memory_id, from_memory_type, etc.
            cursor.execute("""
                INSERT INTO causal_edges (
                    from_memory_id, from_memory_type,
                    to_memory_id, to_memory_type,
                    similarity, confidence, mechanism, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                0,  # Abstract causal relationship (not tied to specific memory)
                'agent_task',  # Custom type for agent tasks
                0,  # Abstract causal relationship
                'agent_task',  # Custom type for agent tasks
                edge.strength,  # Use strength as similarity score
                edge.strength,  # Use strength as confidence
                f"{edge.from_agent}:{edge.from_task} -> {edge.to_agent}:{edge.to_task}",
                json.dumps({
                    'edge_type': edge.edge_type,
                    'timestamp': edge.timestamp,
                    'from_agent': edge.from_agent,
                    'from_task': edge.from_task,
                    'to_agent': edge.to_agent,
                    'to_task': edge.to_task
                })
            ))
            self.conn.commit()
            return True

        except Exception as e:
            print(f"Error adding causal edge: {e}")
            return False

    def get_agent_dependencies(self, agent_id: str) -> List[str]:
        """
        Get list of agents that this agent depends on.

        Args:
            agent_id: Agent identifier

        Returns:
            List of dependency agent IDs
        """
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                SELECT DISTINCT metadata FROM causal_edges
                WHERE mechanism LIKE ?
                ORDER BY confidence DESC
            """, (f"%-> {agent_id}:%",))

            dependencies = []
            for row in cursor.fetchall():
                try:
                    metadata = json.loads(row[0])
                    from_agent = metadata.get('from_agent')
                    if from_agent and from_agent not in dependencies:
                        dependencies.append(from_agent)
                except:
                    pass

            return dependencies

        except Exception as e:
            print(f"Error getting dependencies: {e}")
            return []

    def get_causal_graph(self) -> Dict[str, List[str]]:
        """
        Get complete causal graph of all agent interactions.

        Returns:
            Dictionary mapping agents to their dependencies
        """
        graph = {agent: [] for agent in self.AGENT_ROSTER}

        for agent in self.AGENT_ROSTER:
            graph[agent] = self.get_agent_dependencies(agent)

        return graph

    # ==================== SKILL LIBRARY ====================

    def create_skill(self, skill: AgentSkill) -> bool:
        """
        Create new skill from successful episodes.

        Args:
            skill: Skill data to store

        Returns:
            Success status
        """
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                INSERT INTO skills (
                    name, description, signature, code, success_rate,
                    uses, avg_reward, created_from_episode, metadata
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                f"{skill.agent_id}:{skill.name}",
                skill.description,
                json.dumps(skill.signature),
                skill.code_template or "",
                skill.success_rate,
                skill.uses,
                skill.avg_reward,
                skill.created_from_episode,
                json.dumps({'agent_id': skill.agent_id})
            ))
            self.conn.commit()
            return True

        except Exception as e:
            print(f"Error creating skill: {e}")
            return False

    def consolidate_episodes_to_skills(
        self,
        agent_id: str,
        min_attempts: int = 3,
        min_reward: float = 0.7,
        time_window_days: int = 7
    ) -> int:
        """
        Consolidate high-performing episodes into reusable skills.

        Args:
            agent_id: Agent identifier
            min_attempts: Minimum number of attempts required
            min_reward: Minimum average reward threshold
            time_window_days: Time window for episode selection

        Returns:
            Number of skills created
        """
        try:
            cursor = self.conn.cursor()

            # Find tasks with multiple successful attempts
            cutoff_time = int(datetime.now().timestamp()) - (time_window_days * 86400)

            cursor.execute("""
                SELECT
                    task,
                    COUNT(*) as attempts,
                    AVG(reward) as avg_reward,
                    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successes
                FROM episodes
                WHERE task LIKE ?
                    AND ts > ?
                    AND reward >= ?
                GROUP BY task
                HAVING attempts >= ?
                    AND avg_reward >= ?
            """, (
                f"{agent_id}:%",
                cutoff_time,
                min_reward,
                min_attempts,
                min_reward
            ))

            skills_created = 0
            for row in cursor.fetchall():
                task_name = row[0].split(':')[1] if ':' in row[0] else row[0]
                success_rate = row[3] / row[1]  # successes / attempts

                # Check if skill already exists
                cursor.execute(
                    "SELECT id FROM skills WHERE name = ?",
                    (f"{agent_id}:{task_name}",)
                )
                if cursor.fetchone():
                    continue  # Skip if skill already exists

                skill = AgentSkill(
                    name=task_name,
                    description=f"Learned skill for {task_name}",
                    agent_id=agent_id,
                    signature={
                        'task': task_name,
                        'min_reward': min_reward,
                        'success_rate': success_rate
                    },
                    success_rate=success_rate,
                    uses=0,
                    avg_reward=row[2]
                )

                if self.create_skill(skill):
                    skills_created += 1

            return skills_created

        except Exception as e:
            print(f"Error consolidating episodes: {e}")
            return 0

    def get_agent_skills(self, agent_id: str) -> List[Dict[str, Any]]:
        """
        Get all skills for a specific agent.

        Args:
            agent_id: Agent identifier

        Returns:
            List of agent skills
        """
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                SELECT * FROM skills
                WHERE name LIKE ?
                ORDER BY avg_reward DESC
            """, (f"{agent_id}:%",))

            skills = []
            for row in cursor.fetchall():
                skills.append({
                    'id': row['id'],
                    'name': row['name'],
                    'description': row['description'],
                    'signature': json.loads(row['signature']),
                    'success_rate': row['success_rate'],
                    'uses': row['uses'],
                    'avg_reward': row['avg_reward']
                })

            return skills

        except Exception as e:
            print(f"Error getting skills: {e}")
            return []

    # ==================== MEMORY CONSOLIDATION ====================

    def consolidate_memory(
        self,
        max_age_days: int = 30,
        min_reward: float = 0.3,
        keep_min_per_task: int = 5
    ) -> Dict[str, int]:
        """
        Consolidate and prune old/low-quality memories.

        Args:
            max_age_days: Maximum age for episodes to keep
            min_reward: Minimum reward threshold
            keep_min_per_task: Minimum episodes to keep per task

        Returns:
            Dictionary with pruning statistics
        """
        try:
            cursor = self.conn.cursor()
            cutoff_time = int(datetime.now().timestamp()) - (max_age_days * 86400)

            # Count before pruning
            cursor.execute("SELECT COUNT(*) FROM episodes")
            before_count = cursor.fetchone()[0]

            # Delete old, low-quality episodes while keeping minimum per task
            cursor.execute("""
                DELETE FROM episodes
                WHERE id IN (
                    SELECT id FROM (
                        SELECT
                            id,
                            task,
                            ROW_NUMBER() OVER (PARTITION BY task ORDER BY reward DESC) as rn
                        FROM episodes
                        WHERE ts < ? AND reward < ?
                    )
                    WHERE rn > ?
                )
            """, (cutoff_time, min_reward, keep_min_per_task))

            deleted_episodes = cursor.rowcount

            # Prune low-performing skills
            cursor.execute("""
                DELETE FROM skills
                WHERE success_rate < 0.4 AND uses < 3
            """)

            deleted_skills = cursor.rowcount

            self.conn.commit()

            return {
                'episodes_before': before_count,
                'episodes_deleted': deleted_episodes,
                'skills_deleted': deleted_skills,
                'episodes_remaining': before_count - deleted_episodes
            }

        except Exception as e:
            print(f"Error consolidating memory: {e}")
            return {}

    # ==================== CROSS-AGENT COMMUNICATION ====================

    def broadcast_message(
        self,
        from_agent: str,
        message: str,
        target_agents: Optional[List[str]] = None
    ) -> int:
        """
        Broadcast message from one agent to others.

        Args:
            from_agent: Source agent ID
            message: Message content
            target_agents: List of target agents (None = all agents)

        Returns:
            Number of agents messaged
        """
        targets = target_agents or [a for a in self.AGENT_ROSTER if a != from_agent]

        for target in targets:
            edge = CausalEdge(
                from_agent=from_agent,
                to_agent=target,
                from_task="broadcast",
                to_task="receive",
                edge_type="communication",
                strength=1.0,
                timestamp=int(datetime.now().timestamp())
            )
            self.add_causal_edge(edge)

            # Store as episode for retrieval
            episode = AgentEpisode(
                agent_id=target,
                task="receive_broadcast",
                input_data=f"from:{from_agent}",
                output_data=message,
                critique=f"Message received from {from_agent}",
                reward=1.0,
                success=True,
                latency_ms=0,
                tokens_used=0,
                tags=['broadcast', 'communication']
            )
            self.store_episode(episode)

        return len(targets)

    def get_agent_messages(self, agent_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get recent messages sent to an agent.

        Args:
            agent_id: Agent identifier
            limit: Maximum number of messages

        Returns:
            List of messages
        """
        episodes = self.retrieve_relevant_episodes(
            agent_id,
            "receive_broadcast",
            k=limit
        )

        messages = []
        for ep in episodes:
            if ep['input'].startswith('from:'):
                from_agent = ep['input'].split(':')[1]
                messages.append({
                    'from': from_agent,
                    'message': ep['output'],
                    'timestamp': ep['timestamp']
                })

        return messages

    # ==================== STATISTICS & MONITORING ====================

    def get_agent_stats(self, agent_id: str) -> Dict[str, Any]:
        """
        Get comprehensive statistics for an agent.

        Args:
            agent_id: Agent identifier

        Returns:
            Dictionary of agent statistics
        """
        try:
            cursor = self.conn.cursor()

            # Episode statistics
            cursor.execute("""
                SELECT
                    COUNT(*) as total_episodes,
                    AVG(reward) as avg_reward,
                    SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successes,
                    AVG(latency_ms) as avg_latency,
                    SUM(tokens_used) as total_tokens
                FROM episodes
                WHERE task LIKE ?
            """, (f"{agent_id}:%",))

            ep_stats = cursor.fetchone()

            # Skill statistics
            cursor.execute("""
                SELECT COUNT(*) as total_skills, AVG(success_rate) as avg_skill_rate
                FROM skills
                WHERE name LIKE ?
            """, (f"{agent_id}:%",))

            skill_stats = cursor.fetchone()

            # Dependency statistics
            dependencies = self.get_agent_dependencies(agent_id)

            return {
                'agent_id': agent_id,
                'active': self.active_agents.get(agent_id, False),
                'total_episodes': ep_stats[0] or 0,
                'avg_reward': round(ep_stats[1] or 0.0, 3),
                'success_rate': round((ep_stats[2] or 0) / max(ep_stats[0] or 1, 1), 3),
                'avg_latency_ms': round(ep_stats[3] or 0, 2),
                'total_tokens': ep_stats[4] or 0,
                'total_skills': skill_stats[0] or 0,
                'avg_skill_rate': round(skill_stats[1] or 0.0, 3),
                'dependencies': dependencies
            }

        except Exception as e:
            print(f"Error getting agent stats: {e}")
            return {}

    def get_system_stats(self) -> Dict[str, Any]:
        """
        Get system-wide statistics for all agents.

        Returns:
            Dictionary of system statistics
        """
        active_count = sum(1 for active in self.active_agents.values() if active)

        agent_stats = {
            agent: self.get_agent_stats(agent)
            for agent in self.AGENT_ROSTER
            if self.active_agents[agent]
        }

        return {
            'total_agents': len(self.AGENT_ROSTER),
            'active_agents': active_count,
            'session_id': self.session_id,
            'agent_stats': agent_stats
        }

    def close(self) -> None:
        """Close database connection."""
        if hasattr(self, 'conn'):
            self.conn.close()

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()

#!/usr/bin/env python3
"""
AgentDB Integration Demo - Quantum Trading System
Demonstrates all 32 agents working with reflexion memory, causal edges, and skill library.

Run: python docs/examples/agentdb_demo.py
"""

import sys
from pathlib import Path
from datetime import datetime
import json

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'src'))

from utils.agentdb_coordinator import (
    AgentDBCoordinator,
    AgentEpisode,
    CausalEdge,
    AgentSkill
)


def demo_full_pipeline():
    """Demonstrate complete trading pipeline with all agents."""

    print("=" * 80)
    print("AgentDB Integration Demo - Quantum Trading System")
    print("=" * 80)
    print()

    # Initialize coordinator
    with AgentDBCoordinator(scale=10000) as coord:

        print("📊 Initializing AgentDB Coordinator...")
        print(f"   Database: {coord.db_path}")
        print(f"   Scale: {coord.scale}")
        print(f"   Total Agents: {len(coord.AGENT_ROSTER)}")
        print()

        # ==================== DATA LAYER ====================
        print("🔄 Phase 1: Data Acquisition")
        print("-" * 80)

        # Agent 0: Data Validator
        validator_episode = AgentEpisode(
            agent_id="data-validator",
            task="validate_market_data",
            input_data='{"source": "yahoo", "ticker": "AAPL"}',
            output_data='{"valid": true, "issues": []}',
            critique="Validation passed: All price data within bounds, no missing values",
            reward=1.0,
            success=True,
            latency_ms=12,
            tokens_used=80
        )
        coord.store_episode(validator_episode)
        print("   ✅ Agent 0 (data-validator): Validated market data (reward: 1.0)")

        # Agent 1: Yahoo Fetcher
        yahoo_episode = AgentEpisode(
            agent_id="yahoo-fetcher",
            task="fetch_ohlc",
            input_data='{"ticker": "AAPL", "period": "1d"}',
            output_data='{"open": 17500, "high": 18000, "low": 17300, "close": 17800}',
            critique="Successfully fetched OHLC data with 10000 scale factor",
            reward=0.95,
            success=True,
            latency_ms=234,
            tokens_used=120
        )
        coord.store_episode(yahoo_episode)
        coord.add_causal_edge(CausalEdge(
            from_agent="data-validator",
            to_agent="yahoo-fetcher",
            from_task="validate_market_data",
            to_task="fetch_ohlc",
            edge_type="dependency",
            strength=1.0,
            timestamp=int(datetime.now().timestamp())
        ))
        print("   ✅ Agent 1 (yahoo-fetcher): Fetched OHLC data (reward: 0.95)")

        # Agent 2: Tiingo Fetcher
        tiingo_episode = AgentEpisode(
            agent_id="tiingo-fetcher",
            task="fetch_historical",
            input_data='{"ticker": "AAPL", "days": 30}',
            output_data='{"records": 30, "avg_price": 17500}',
            critique="Retrieved 30 days of historical data, integer-only format",
            reward=0.93,
            success=True,
            latency_ms=456,
            tokens_used=150
        )
        coord.store_episode(tiingo_episode)
        print("   ✅ Agent 2 (tiingo-fetcher): Fetched historical data (reward: 0.93)")

        # Agent 3: FRED Fetcher
        fred_episode = AgentEpisode(
            agent_id="fred-fetcher",
            task="fetch_interest_rates",
            input_data='{"series": "DFF"}',
            output_data='{"rate": 525}',  # 5.25% as 525 (scaled by 100, not 10000)
            critique="Federal funds rate retrieved and scaled correctly",
            reward=0.98,
            success=True,
            latency_ms=312,
            tokens_used=100
        )
        coord.store_episode(fred_episode)
        print("   ✅ Agent 3 (fred-fetcher): Fetched interest rates (reward: 0.98)")

        print()

        # ==================== ENCODING LAYER ====================
        print("🔢 Phase 2: Encoding & Compression")
        print("-" * 80)

        # Agent 4: Fibonacci Encoder
        fib_episode = AgentEpisode(
            agent_id="fibonacci-encoder",
            task="encode_price",
            input_data='{"price": 17800}',
            output_data='{"fibonacci": [10946, 6765, 89]}',
            critique="Efficiently decomposed price into Fibonacci terms",
            reward=0.92,
            success=True,
            latency_ms=18,
            tokens_used=90
        )
        coord.store_episode(fib_episode)
        coord.add_causal_edge(CausalEdge(
            from_agent="yahoo-fetcher",
            to_agent="fibonacci-encoder",
            from_task="fetch_ohlc",
            to_task="encode_price",
            edge_type="data_flow",
            strength=1.0,
            timestamp=int(datetime.now().timestamp())
        ))
        print("   ✅ Agent 4 (fibonacci-encoder): Encoded price (reward: 0.92)")

        # Agent 5: Lucas Encoder
        lucas_episode = AgentEpisode(
            agent_id="lucas-encoder",
            task="encode_volatility",
            input_data='{"volatility": 250}',  # 2.5% as 250
            output_data='{"lucas": [199, 47, 4]}',
            critique="Lucas sequence encoding maintains integer precision",
            reward=0.90,
            success=True,
            latency_ms=15,
            tokens_used=85
        )
        coord.store_episode(lucas_episode)
        print("   ✅ Agent 5 (lucas-encoder): Encoded volatility (reward: 0.90)")

        # Agent 6: Zeckendorf Compressor
        zeck_episode = AgentEpisode(
            agent_id="zeckendorf-compressor",
            task="compress_timeseries",
            input_data='{"prices": [17500, 17600, 17800, 17700]}',
            output_data='{"compressed_size": 156, "original_size": 512}',
            critique="Achieved 69.5% compression ratio using Zeckendorf representation",
            reward=0.88,
            success=True,
            latency_ms=45,
            tokens_used=200
        )
        coord.store_episode(zeck_episode)
        print("   ✅ Agent 6 (zeckendorf-compressor): Compressed data (reward: 0.88)")

        # Agent 7: Integer Validator
        int_val_episode = AgentEpisode(
            agent_id="integer-validator",
            task="validate_operations",
            input_data='{"operations": ["add", "mul", "div"], "scale": 10000}',
            output_data='{"all_valid": true, "overflow_checks": "passed"}',
            critique="All operations maintain integer precision, no overflow detected",
            reward=1.0,
            success=True,
            latency_ms=8,
            tokens_used=60
        )
        coord.store_episode(int_val_episode)
        print("   ✅ Agent 7 (integer-validator): Validated operations (reward: 1.0)")

        print()

        # ==================== MODEL LAYER ====================
        print("🧠 Phase 3: Model Predictions")
        print("-" * 80)

        # Agent 8: QFNN Model
        qfnn_episode = AgentEpisode(
            agent_id="qfnn-model",
            task="predict_price",
            input_data='{"features": [10946, 6765, 89, 199, 47]}',
            output_data='{"prediction": 18200, "confidence": 8500}',
            critique="Quantum field neural network prediction with 85% confidence",
            reward=0.87,
            success=True,
            latency_ms=156,
            tokens_used=450
        )
        coord.store_episode(qfnn_episode)
        coord.add_causal_edge(CausalEdge(
            from_agent="fibonacci-encoder",
            to_agent="qfnn-model",
            from_task="encode_price",
            to_task="predict_price",
            edge_type="data_flow",
            strength=0.95,
            timestamp=int(datetime.now().timestamp())
        ))
        print("   ✅ Agent 8 (qfnn-model): Predicted price (reward: 0.87)")

        # Agent 9: Xi-Psi Model
        xi_psi_episode = AgentEpisode(
            agent_id="xi-psi-model",
            task="quantum_state_evolution",
            input_data='{"state": [10000, 0, 0, 0]}',
            output_data='{"evolved_state": [7071, 7071, 0, 0]}',
            critique="Successfully evolved quantum state with unitary transformation",
            reward=0.91,
            success=True,
            latency_ms=234,
            tokens_used=380
        )
        coord.store_episode(xi_psi_episode)
        print("   ✅ Agent 9 (xi-psi-model): Evolved quantum state (reward: 0.91)")

        # Agent 10: Phase Portraits
        phase_episode = AgentEpisode(
            agent_id="phase-portraits",
            task="analyze_phase_space",
            input_data='{"trajectory": [[10000, 0], [7071, 7071]]}',
            output_data='{"attractor_type": "stable_spiral", "lyapunov": -150}',
            critique="Detected stable spiral attractor in phase space",
            reward=0.84,
            success=True,
            latency_ms=178,
            tokens_used=320
        )
        coord.store_episode(phase_episode)
        print("   ✅ Agent 10 (phase-portraits): Analyzed phase space (reward: 0.84)")

        # Agent 11: Options Pricing
        options_episode = AgentEpisode(
            agent_id="options-pricing",
            task="price_call_option",
            input_data='{"spot": 17800, "strike": 18000, "days": 30}',
            output_data='{"premium": 456}',  # $4.56 as 456
            critique="Integer-only Black-Scholes approximation, no floating point",
            reward=0.89,
            success=True,
            latency_ms=89,
            tokens_used=280
        )
        coord.store_episode(options_episode)
        print("   ✅ Agent 11 (options-pricing): Priced option (reward: 0.89)")

        print()

        # ==================== STRATEGY LAYER ====================
        print("📈 Phase 4: Trading Strategies")
        print("-" * 80)

        # Agent 12: Fibonacci Strategy
        fib_strat_episode = AgentEpisode(
            agent_id="fibonacci-strategy",
            task="generate_signals",
            input_data='{"price": 17800, "support": 16180, "resistance": 19090}',
            output_data='{"signal": "buy", "confidence": 7800}',
            critique="Buy signal at Fibonacci support level, 78% confidence",
            reward=0.86,
            success=True,
            latency_ms=67,
            tokens_used=220
        )
        coord.store_episode(fib_strat_episode)
        coord.add_causal_edge(CausalEdge(
            from_agent="qfnn-model",
            to_agent="fibonacci-strategy",
            from_task="predict_price",
            to_task="generate_signals",
            edge_type="data_flow",
            strength=0.9,
            timestamp=int(datetime.now().timestamp())
        ))
        print("   ✅ Agent 12 (fibonacci-strategy): Generated signals (reward: 0.86)")

        # Create skill from successful strategy
        fib_skill = AgentSkill(
            name="fibonacci_support_buy",
            description="Buy at Fibonacci support levels with high confidence",
            agent_id="fibonacci-strategy",
            signature={
                "inputs": {"price": "int", "support": "int"},
                "outputs": {"signal": "str", "confidence": "int"}
            },
            success_rate=0.86,
            uses=1,
            avg_reward=0.86
        )
        coord.create_skill(fib_skill)
        print("   📚 Created skill: fibonacci_support_buy")

        # Agent 13: Lucas Strategy
        lucas_strat_episode = AgentEpisode(
            agent_id="lucas-strategy",
            task="momentum_analysis",
            input_data='{"prices": [17500, 17600, 17800, 17700]}',
            output_data='{"momentum": 200, "signal": "hold"}',
            critique="Positive momentum but below threshold for action",
            reward=0.75,
            success=True,
            latency_ms=54,
            tokens_used=190
        )
        coord.store_episode(lucas_strat_episode)
        print("   ✅ Agent 13 (lucas-strategy): Analyzed momentum (reward: 0.75)")

        # Agent 14: Momentum Strategy
        momentum_episode = AgentEpisode(
            agent_id="momentum-strategy",
            task="calculate_rsi",
            input_data='{"prices": [17500, 17600, 17800, 17700]}',
            output_data='{"rsi": 5800}',  # 58.00 as 5800
            critique="RSI at 58, neutral zone - no strong signal",
            reward=0.72,
            success=True,
            latency_ms=43,
            tokens_used=170
        )
        coord.store_episode(momentum_episode)
        print("   ✅ Agent 14 (momentum-strategy): Calculated RSI (reward: 0.72)")

        # Agent 15: Mean Reversion
        mean_rev_episode = AgentEpisode(
            agent_id="mean-reversion",
            task="detect_mean_reversion",
            input_data='{"price": 17800, "mean": 17500, "std": 300}',
            output_data='{"z_score": 100, "signal": "neutral"}',
            critique="Z-score = 1.0, within normal range",
            reward=0.78,
            success=True,
            latency_ms=38,
            tokens_used=150
        )
        coord.store_episode(mean_rev_episode)
        print("   ✅ Agent 15 (mean-reversion): Detected mean reversion (reward: 0.78)")

        print()

        # ==================== BACKTEST LAYER ====================
        print("🔬 Phase 5: Backtesting & Risk")
        print("-" * 80)

        # Agent 16: Backtest Engine
        backtest_episode = AgentEpisode(
            agent_id="backtest-engine",
            task="run_backtest",
            input_data='{"strategy": "fibonacci", "period": "30d"}',
            output_data='{"sharpe": 1820, "total_return": 1250}',  # Sharpe 1.82, return 12.5%
            critique="Strong Sharpe ratio of 1.82, positive returns",
            reward=0.91,
            success=True,
            latency_ms=2345,
            tokens_used=1200
        )
        coord.store_episode(backtest_episode)
        coord.add_causal_edge(CausalEdge(
            from_agent="fibonacci-strategy",
            to_agent="backtest-engine",
            from_task="generate_signals",
            to_task="run_backtest",
            edge_type="dependency",
            strength=1.0,
            timestamp=int(datetime.now().timestamp())
        ))
        print("   ✅ Agent 16 (backtest-engine): Ran backtest (reward: 0.91)")

        # Agent 17: Risk Manager
        risk_episode = AgentEpisode(
            agent_id="risk-manager",
            task="calculate_var",
            input_data='{"positions": [17800, -5000], "confidence": 9500}',
            output_data='{"var_95": 2340}',  # 95% VaR = $234.00
            critique="Value at Risk calculated with 95% confidence using integer arithmetic",
            reward=0.94,
            success=True,
            latency_ms=123,
            tokens_used=350
        )
        coord.store_episode(risk_episode)
        print("   ✅ Agent 17 (risk-manager): Calculated VaR (reward: 0.94)")

        # Agent 18: Performance Analytics
        perf_episode = AgentEpisode(
            agent_id="performance-analytics",
            task="calculate_metrics",
            input_data='{"returns": [120, -50, 180, 90]}',
            output_data='{"sharpe": 1650, "sortino": 2100, "max_dd": -450}',
            critique="Comprehensive metrics: Sharpe 1.65, Sortino 2.1, MaxDD -4.5%",
            reward=0.89,
            success=True,
            latency_ms=234,
            tokens_used=480
        )
        coord.store_episode(perf_episode)
        print("   ✅ Agent 18 (performance-analytics): Calculated metrics (reward: 0.89)")

        # Agent 19: Backtest Validator
        val_episode = AgentEpisode(
            agent_id="backtest-validator",
            task="validate_results",
            input_data='{"backtest_id": "bt_001", "trades": 150}',
            output_data='{"valid": true, "warnings": []}',
            critique="Validation passed: No look-ahead bias, sufficient trades",
            reward=0.96,
            success=True,
            latency_ms=89,
            tokens_used=280
        )
        coord.store_episode(val_episode)
        print("   ✅ Agent 19 (backtest-validator): Validated results (reward: 0.96)")

        print()

        # ==================== VISUALIZATION LAYER ====================
        print("📊 Phase 6: Visualization")
        print("-" * 80)

        # Agent 20-23: Visualization agents
        viz_agents = [
            ("gmv-tracker", "track_gmv", 0.87),
            ("waterfall-charts", "generate_waterfall", 0.84),
            ("dashboard", "render_dashboard", 0.92),
            ("pine-script-generator", "generate_script", 0.88)
        ]

        for agent_id, task, reward in viz_agents:
            episode = AgentEpisode(
                agent_id=agent_id,
                task=task,
                input_data='{"data": "..."}',
                output_data='{"generated": true}',
                critique=f"Successfully completed {task}",
                reward=reward,
                success=True,
                latency_ms=156,
                tokens_used=300
            )
            coord.store_episode(episode)
            print(f"   ✅ Agent {20 + viz_agents.index((agent_id, task, reward))} ({agent_id}): {task} (reward: {reward})")

        print()

        # ==================== INFRASTRUCTURE LAYER ====================
        print("🛠️ Phase 7: Infrastructure")
        print("-" * 80)

        # Agent 24-26: Infrastructure agents
        infra_agents = [
            ("docker-orchestrator", "orchestrate_containers", 0.93),
            ("deployment-manager", "deploy_services", 0.90),
            ("circuit-breaker", "monitor_health", 0.95)
        ]

        for agent_id, task, reward in infra_agents:
            episode = AgentEpisode(
                agent_id=agent_id,
                task=task,
                input_data='{"config": "..."}',
                output_data='{"status": "operational"}',
                critique=f"Infrastructure task {task} completed successfully",
                reward=reward,
                success=True,
                latency_ms=234,
                tokens_used=200
            )
            coord.store_episode(episode)
            print(f"   ✅ Agent {24 + infra_agents.index((agent_id, task, reward))} ({agent_id}): {task} (reward: {reward})")

        print()

        # ==================== META LAYER ====================
        print("🤖 Phase 8: Meta Layer")
        print("-" * 80)

        # Agent 27: AgentDB Integration (this agent!)
        agentdb_episode = AgentEpisode(
            agent_id="agentdb-integration",
            task="coordinate_memory",
            input_data='{"agents": 32, "episodes": 32}',
            output_data='{"coordination": "complete", "causal_edges": 8}',
            critique="Successfully coordinated memory for all 32 agents",
            reward=1.0,
            success=True,
            latency_ms=345,
            tokens_used=800
        )
        coord.store_episode(agentdb_episode)
        print("   ✅ Agent 27 (agentdb-integration): Coordinated memory (reward: 1.0)")

        # Agent 28-31: Remaining meta agents
        meta_agents = [
            ("market-microstructure", "analyze_orderbook", 0.86),
            ("liquidity-analyzer", "measure_liquidity", 0.83),
            ("swarm-coordinator", "coordinate_swarm", 0.94),
            ("meta-learner", "optimize_hyperparams", 0.89)
        ]

        for agent_id, task, reward in meta_agents:
            episode = AgentEpisode(
                agent_id=agent_id,
                task=task,
                input_data='{"meta": "..."}',
                output_data='{"result": "..."}',
                critique=f"Meta task {task} completed",
                reward=reward,
                success=True,
                latency_ms=456,
                tokens_used=600
            )
            coord.store_episode(episode)
            print(f"   ✅ Agent {28 + meta_agents.index((agent_id, task, reward))} ({agent_id}): {task} (reward: {reward})")

        print()
        print("=" * 80)

        # Broadcast completion message
        coord.broadcast_message(
            from_agent="agentdb-integration",
            message="All 32 agents operational - pipeline complete"
        )

        # Get system statistics
        print("📊 System Statistics")
        print("-" * 80)
        stats = coord.get_system_stats()
        print(f"   Total Agents: {stats['total_agents']}")
        print(f"   Active Agents: {stats['active_agents']}")
        print(f"   Session ID: {stats['session_id']}")
        print()

        # Show causal graph summary
        print("🔗 Causal Graph Summary")
        print("-" * 80)
        graph = coord.get_causal_graph()
        agents_with_deps = {agent: deps for agent, deps in graph.items() if deps}
        print(f"   Agents with dependencies: {len(agents_with_deps)}")
        for agent, deps in list(agents_with_deps.items())[:5]:  # Show first 5
            print(f"   {agent} ← {', '.join(deps)}")
        if len(agents_with_deps) > 5:
            print(f"   ... and {len(agents_with_deps) - 5} more")
        print()

        # Show top performing agents
        print("🏆 Top Performing Agents")
        print("-" * 80)
        agent_rewards = []
        for agent in coord.AGENT_ROSTER:
            agent_stats = coord.get_agent_stats(agent)
            if agent_stats.get('total_episodes', 0) > 0:
                agent_rewards.append((agent, agent_stats['avg_reward']))

        agent_rewards.sort(key=lambda x: x[1], reverse=True)
        for i, (agent, reward) in enumerate(agent_rewards[:5], 1):
            print(f"   {i}. {agent}: {reward:.3f}")
        print()

        # Show skills created
        print("📚 Skills Library")
        print("-" * 80)
        all_skills = 0
        for agent in coord.AGENT_ROSTER:
            skills = coord.get_agent_skills(agent)
            all_skills += len(skills)
            if skills:
                for skill in skills:
                    print(f"   {skill['name']}: {skill['success_rate']:.1%} success rate")

        if all_skills == 0:
            print("   No skills created yet. Run consolidation to create skills.")
        print()

        print("=" * 80)
        print("✅ Demo Complete - All 32 agents operational with AgentDB integration")
        print("=" * 80)


if __name__ == '__main__':
    demo_full_pipeline()

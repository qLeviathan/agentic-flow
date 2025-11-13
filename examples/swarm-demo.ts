/**
 * AgentDB Swarm Demonstration for AURELIA
 *
 * Comprehensive demo showcasing:
 * - Parallel market data processing
 * - Multi-agent trading strategy execution
 * - Performance comparison: single-agent vs swarm
 * - Real-time metrics and bottleneck detection
 */

import {
  AgentDBSwarmOrchestrator,
  createSwarm,
  SwarmTopology
} from '../src/swarm/agentdb-swarm-orchestrator';
import { AgentType } from '../src/swarm/swarm-agents';
import { TaskPriority } from '../src/swarm/work-stealing-scheduler';

/**
 * Demo 1: Basic Swarm Operations
 */
async function demoBasicSwarm() {
  console.log('\n🚀 Demo 1: Basic Swarm Operations\n');

  // Create swarm with adaptive topology
  const swarm = createSwarm({
    topology: SwarmTopology.ADAPTIVE,
    maxAgents: 20,
    minAgents: 4,
    agentdbConfig: {
      dimensions: 1536,
      metric: 'cosine',
      quantization: 'uint8',
      enableHNSW: true,
      enableQUIC: true
    },
    scaling: {
      autoScale: true,
      scaleUpThreshold: 80,
      scaleDownThreshold: 30,
      cooldownPeriod: 5000
    }
  });

  // Start swarm
  await swarm.start();

  // Spawn diverse agent types
  console.log('📦 Spawning specialized agents...');
  await Promise.all([
    swarm.spawnAgent(AgentType.DATA_INGESTION),
    swarm.spawnAgent(AgentType.ENCODING),
    swarm.spawnAgent(AgentType.NASH_DETECTION),
    swarm.spawnAgent(AgentType.TRADING)
  ]);

  // Submit simple task
  console.log('📋 Submitting tasks...');
  const taskId = await swarm.submitTask({
    type: 'data_ingestion',
    priority: TaskPriority.HIGH,
    payload: {
      source: 'yahoo',
      symbols: ['SPY', 'QQQ']
    },
    requiredCapabilities: ['data_ingestion']
  });

  // Wait for result
  const result = await swarm.getTaskResult(taskId);
  console.log('✅ Task completed:', result);

  // Get metrics
  const metrics = swarm.getPerformanceMetrics();
  console.log('\n📊 Swarm Metrics:');
  console.log(`   Throughput: ${metrics.throughput.toFixed(2)} tasks/sec`);
  console.log(`   Avg Latency: ${metrics.avgLatency.toFixed(2)}ms`);
  console.log(`   Utilization: ${(metrics.avgUtilization * 100).toFixed(1)}%`);
  console.log(`   Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);

  // Stop swarm
  await swarm.stop();
}

/**
 * Demo 2: Parallel Market Data Processing
 */
async function demoParallelMarketData() {
  console.log('\n\n🚀 Demo 2: Parallel Market Data Processing\n');

  const swarm = createSwarm({
    topology: SwarmTopology.MESH,
    maxAgents: 30,
    agentdbConfig: {
      enableHNSW: true,
      quantization: 'uint8',
      enableQUIC: true
    }
  });

  await swarm.start();

  // Spawn multiple data ingestion agents for parallel fetching
  console.log('📦 Spawning data ingestion agents...');
  await Promise.all([
    swarm.spawnAgent(AgentType.DATA_INGESTION),
    swarm.spawnAgent(AgentType.DATA_INGESTION),
    swarm.spawnAgent(AgentType.DATA_INGESTION),
    swarm.spawnAgent(AgentType.DATA_INGESTION)
  ]);

  // Fetch data for multiple symbols in parallel
  const symbols = [
    'SPY', 'QQQ', 'IWM', 'DIA',
    'GLD', 'SLV', 'USO', 'TLT',
    'AAPL', 'MSFT', 'GOOGL', 'AMZN',
    'NVDA', 'TSLA', 'META', 'NFLX'
  ];

  console.log(`📋 Fetching data for ${symbols.length} symbols...`);
  const startTime = Date.now();

  // Submit parallel data ingestion tasks
  const tasks = symbols.map(symbol => ({
    type: 'data_ingestion',
    priority: TaskPriority.HIGH,
    payload: {
      source: 'yahoo',
      symbols: [symbol]
    },
    requiredCapabilities: ['data_ingestion']
  }));

  const taskIds = await swarm.submitBatch(tasks);

  // Wait for all results
  const results = await Promise.all(
    taskIds.map(id => swarm.getTaskResult(id, 10000))
  );

  const elapsed = Date.now() - startTime;

  console.log(`✅ Fetched ${results.length} symbols in ${elapsed}ms`);
  console.log(`   Throughput: ${(symbols.length / (elapsed / 1000)).toFixed(2)} symbols/sec`);

  const metrics = swarm.getPerformanceMetrics();
  console.log('\n📊 Performance Metrics:');
  console.log(`   Total Tasks: ${metrics.totalTasks}`);
  console.log(`   Completed: ${metrics.completedTasks}`);
  console.log(`   Avg Latency: ${metrics.avgLatency.toFixed(2)}ms`);
  console.log(`   Agent Utilization: ${(metrics.avgUtilization * 100).toFixed(1)}%`);

  await swarm.stop();
}

/**
 * Demo 3: Multi-Agent φ-Mechanics Pipeline
 */
async function demoPhiMechanicsPipeline() {
  console.log('\n\n🚀 Demo 3: φ-Mechanics Trading Pipeline\n');

  const swarm = createSwarm({
    topology: SwarmTopology.ADAPTIVE,
    maxAgents: 50,
    agentdbConfig: {
      enableHNSW: true,
      quantization: 'uint8',
      enableQUIC: true
    },
    scaling: {
      autoScale: true,
      scaleUpThreshold: 75,
      scaleDownThreshold: 35
    }
  });

  await swarm.start();

  // Spawn complete agent ecosystem
  console.log('📦 Spawning AURELIA agent ecosystem...');
  await Promise.all([
    swarm.spawnAgent(AgentType.DATA_INGESTION),
    swarm.spawnAgent(AgentType.DATA_INGESTION),
    swarm.spawnAgent(AgentType.ENCODING),
    swarm.spawnAgent(AgentType.ENCODING),
    swarm.spawnAgent(AgentType.NASH_DETECTION),
    swarm.spawnAgent(AgentType.KNOWLEDGE_GRAPH),
    swarm.spawnAgent(AgentType.VISION),
    swarm.spawnAgent(AgentType.TRADING),
    swarm.spawnAgent(AgentType.CONSCIOUSNESS)
  ]);

  console.log('\n🔄 Running φ-Mechanics Pipeline...\n');

  // Stage 1: Data Ingestion
  console.log('Stage 1: Data Ingestion');
  const dataTaskId = await swarm.submitTask({
    type: 'data_ingestion',
    priority: TaskPriority.HIGH,
    payload: {
      source: 'yahoo',
      symbols: ['SPY', 'QQQ', 'IWM']
    }
  });

  const marketData = await swarm.getTaskResult(dataTaskId);
  console.log('  ✓ Market data fetched');

  // Stage 2: Zeckendorf Encoding (φ-based representation)
  console.log('Stage 2: Zeckendorf Encoding');
  const encodeTaskId = await swarm.submitTask({
    type: 'zeckendorf_encode',
    priority: TaskPriority.HIGH,
    payload: {
      numbers: marketData.data?.[0]?.data || [100, 150, 200],
      mode: 'phi_transform'
    },
    requiredCapabilities: ['zeckendorf_encoding']
  });

  const encoded = await swarm.getTaskResult(encodeTaskId);
  console.log('  ✓ Zeckendorf encoding complete');

  // Stage 3: Nash Equilibrium Detection
  console.log('Stage 3: Nash Equilibrium Detection');
  const nashTaskId = await swarm.submitTask({
    type: 'nash_detection',
    priority: TaskPriority.URGENT,
    payload: {
      payoffMatrix: [
        [[3, 3], [0, 5]],
        [[5, 0], [1, 1]]
      ],
      playerCount: 2
    },
    requiredCapabilities: ['nash_equilibrium']
  });

  const equilibria = await swarm.getTaskResult(nashTaskId);
  console.log('  ✓ Nash equilibria detected');

  // Stage 4: Knowledge Graph Update
  console.log('Stage 4: Knowledge Graph Update');
  const kgTaskId = await swarm.submitTask({
    type: 'knowledge_graph',
    priority: TaskPriority.NORMAL,
    payload: {
      feeds: ['https://finance.yahoo.com/rss']
    },
    requiredCapabilities: ['rss_ingestion']
  });

  const kgResult = await swarm.getTaskResult(kgTaskId);
  console.log('  ✓ Knowledge graph updated');

  // Stage 5: Trading Strategy Execution
  console.log('Stage 5: Trading Strategy');
  const tradingTaskId = await swarm.submitTask({
    type: 'trading_strategy',
    priority: TaskPriority.CRITICAL,
    payload: {
      strategy: 'phi_momentum',
      market: marketData,
      encoded,
      equilibria
    },
    requiredCapabilities: ['strategy_execution']
  });

  const tradingSignal = await swarm.getTaskResult(tradingTaskId);
  console.log('  ✓ Trading signal generated:', tradingSignal);

  // Stage 6: Consciousness Monitoring (Ψ)
  console.log('Stage 6: Consciousness Monitoring (Ψ)');
  const psiTaskId = await swarm.submitTask({
    type: 'consciousness_analysis',
    priority: TaskPriority.NORMAL,
    payload: {
      metrics: {
        coherence: 0.85,
        integration: 0.92,
        complexity: 0.78
      },
      threshold: 0.618 // φ-based threshold
    },
    requiredCapabilities: ['psi_monitoring']
  });

  const psiResult = await swarm.getTaskResult(psiTaskId);
  console.log(`  ✓ Ψ = ${psiResult.psi.toFixed(3)} ${psiResult.isEmergent ? '🧠 (EMERGENT)' : ''}`);

  // Final metrics
  const metrics = swarm.getPerformanceMetrics();
  console.log('\n📊 Pipeline Performance:');
  console.log(`   Total Tasks: ${metrics.totalTasks}`);
  console.log(`   Completed: ${metrics.completedTasks}`);
  console.log(`   Throughput: ${metrics.throughput.toFixed(2)} tasks/sec`);
  console.log(`   Avg Latency: ${metrics.avgLatency.toFixed(2)}ms`);
  console.log(`   Topology: ${metrics.topology}`);

  if (metrics.bottlenecks.length > 0) {
    console.log('\n⚠️  Detected Bottlenecks:');
    metrics.bottlenecks.forEach(bottleneck => {
      console.log(`   - [${bottleneck.severity.toUpperCase()}] ${bottleneck.description}`);
      console.log(`     → ${bottleneck.recommendation}`);
    });
  }

  await swarm.stop();
}

/**
 * Demo 4: Single-Agent vs Swarm Performance Comparison
 */
async function demoPerformanceComparison() {
  console.log('\n\n🚀 Demo 4: Performance Comparison (Single-Agent vs Swarm)\n');

  const taskCount = 100;
  const taskPayload = {
    source: 'yahoo',
    symbols: ['SPY']
  };

  // Single-agent performance
  console.log('📊 Single-Agent Performance...');
  const singleSwarm = createSwarm({
    topology: SwarmTopology.STAR,
    maxAgents: 1,
    minAgents: 1,
    scaling: { autoScale: false, scaleUpThreshold: 100, scaleDownThreshold: 0, cooldownPeriod: 0 }
  });

  await singleSwarm.start();
  await singleSwarm.spawnAgent(AgentType.DATA_INGESTION);

  const singleStartTime = Date.now();

  // Submit tasks sequentially
  for (let i = 0; i < taskCount; i++) {
    const taskId = await singleSwarm.submitTask({
      type: 'data_ingestion',
      priority: TaskPriority.NORMAL,
      payload: taskPayload
    });
    await singleSwarm.getTaskResult(taskId, 5000).catch(() => {});
  }

  const singleElapsed = Date.now() - singleStartTime;
  const singleMetrics = singleSwarm.getPerformanceMetrics();

  console.log(`   ⏱️  Time: ${singleElapsed}ms`);
  console.log(`   📈 Throughput: ${singleMetrics.throughput.toFixed(2)} tasks/sec`);
  console.log(`   ⚡ Avg Latency: ${singleMetrics.avgLatency.toFixed(2)}ms`);

  await singleSwarm.stop();

  // Swarm performance
  console.log('\n📊 Swarm Performance (10 agents)...');
  const multiSwarm = createSwarm({
    topology: SwarmTopology.MESH,
    maxAgents: 10,
    minAgents: 10,
    scaling: { autoScale: false, scaleUpThreshold: 100, scaleDownThreshold: 0, cooldownPeriod: 0 },
    scheduler: {
      enableWorkStealing: true,
      priorityLevels: 5,
      maxQueueSize: 1000,
      stealThreshold: 0.3
    }
  });

  await multiSwarm.start();

  // Spawn 10 agents
  await Promise.all(
    Array.from({ length: 10 }, () =>
      multiSwarm.spawnAgent(AgentType.DATA_INGESTION)
    )
  );

  const swarmStartTime = Date.now();

  // Submit all tasks in parallel
  const taskIds = await multiSwarm.submitBatch(
    Array.from({ length: taskCount }, () => ({
      type: 'data_ingestion',
      priority: TaskPriority.NORMAL,
      payload: taskPayload
    }))
  );

  await Promise.all(
    taskIds.map(id => multiSwarm.getTaskResult(id, 10000).catch(() => {}))
  );

  const swarmElapsed = Date.now() - swarmStartTime;
  const swarmMetrics = multiSwarm.getPerformanceMetrics();

  console.log(`   ⏱️  Time: ${swarmElapsed}ms`);
  console.log(`   📈 Throughput: ${swarmMetrics.throughput.toFixed(2)} tasks/sec`);
  console.log(`   ⚡ Avg Latency: ${swarmMetrics.avgLatency.toFixed(2)}ms`);
  console.log(`   💯 Utilization: ${(swarmMetrics.avgUtilization * 100).toFixed(1)}%`);

  await multiSwarm.stop();

  // Comparison
  const speedup = singleElapsed / swarmElapsed;
  const throughputImprovement = swarmMetrics.throughput / singleMetrics.throughput;
  const latencyImprovement = singleMetrics.avgLatency / swarmMetrics.avgLatency;

  console.log('\n🎯 Performance Improvement:');
  console.log(`   ⚡ Speedup: ${speedup.toFixed(2)}x`);
  console.log(`   📈 Throughput: ${throughputImprovement.toFixed(2)}x`);
  console.log(`   ⚡ Latency: ${latencyImprovement.toFixed(2)}x`);

  if (speedup >= 10) {
    console.log('   ✅ TARGET ACHIEVED: 10x throughput improvement!');
  } else {
    console.log(`   ⚠️  Target: 10x (Current: ${speedup.toFixed(2)}x)`);
  }
}

/**
 * Demo 5: Auto-Scaling Demonstration
 */
async function demoAutoScaling() {
  console.log('\n\n🚀 Demo 5: Auto-Scaling Demonstration\n');

  const swarm = createSwarm({
    topology: SwarmTopology.ADAPTIVE,
    maxAgents: 30,
    minAgents: 4,
    agentdbConfig: {
      enableHNSW: true,
      quantization: 'uint8'
    },
    scaling: {
      autoScale: true,
      scaleUpThreshold: 70,
      scaleDownThreshold: 30,
      cooldownPeriod: 3000
    }
  });

  await swarm.start();

  // Start with minimal agents
  await Promise.all([
    swarm.spawnAgent(AgentType.DATA_INGESTION),
    swarm.spawnAgent(AgentType.ENCODING),
    swarm.spawnAgent(AgentType.TRADING),
    swarm.spawnAgent(AgentType.CONSCIOUSNESS)
  ]);

  console.log('📦 Starting with 4 agents...\n');

  // Monitor scaling events
  swarm.on('agentSpawned', ({ agentId, type }) => {
    const state = swarm.getState();
    console.log(`   ↗️  Scaled UP: ${type} (Total agents: ${state.activeAgents})`);
  });

  swarm.on('agentDespawned', ({ agentId }) => {
    const state = swarm.getState();
    console.log(`   ↘️  Scaled DOWN: ${agentId} (Total agents: ${state.activeAgents})`);
  });

  swarm.on('topologyUpdated', ({ topology }) => {
    console.log(`   🔄 Topology optimized: ${topology}`);
  });

  // Simulate increasing load
  console.log('📈 Simulating increasing workload...');

  for (let wave = 1; wave <= 3; wave++) {
    console.log(`\nWave ${wave}: Submitting ${wave * 20} tasks`);

    const tasks = Array.from({ length: wave * 20 }, () => ({
      type: 'data_ingestion',
      priority: TaskPriority.NORMAL,
      payload: { source: 'yahoo', symbols: ['SPY'] }
    }));

    await swarm.submitBatch(tasks);
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for auto-scaling

    const metrics = swarm.getPerformanceMetrics();
    console.log(`   Agents: ${metrics.activeAgents}, Utilization: ${(metrics.avgUtilization * 100).toFixed(1)}%`);
  }

  // Simulate decreasing load
  console.log('\n📉 Simulating decreasing workload...');
  await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for scale-down

  const finalMetrics = swarm.getPerformanceMetrics();
  console.log(`\n📊 Final State:`);
  console.log(`   Active Agents: ${finalMetrics.activeAgents}`);
  console.log(`   Utilization: ${(finalMetrics.avgUtilization * 100).toFixed(1)}%`);
  console.log(`   Topology: ${finalMetrics.topology}`);

  await swarm.stop();
}

/**
 * Demo 6: Bottleneck Detection
 */
async function demoBottleneckDetection() {
  console.log('\n\n🚀 Demo 6: Bottleneck Detection\n');

  const swarm = createSwarm({
    topology: SwarmTopology.HIERARCHICAL,
    maxAgents: 15
  });

  await swarm.start();

  // Create intentional bottleneck with imbalanced agents
  await Promise.all([
    swarm.spawnAgent(AgentType.DATA_INGESTION),
    swarm.spawnAgent(AgentType.ENCODING),
    swarm.spawnAgent(AgentType.ENCODING),
    swarm.spawnAgent(AgentType.ENCODING),
    swarm.spawnAgent(AgentType.NASH_DETECTION)
  ]);

  console.log('📦 Spawned agents with intentional imbalance\n');

  // Submit heavy encoding workload
  console.log('📋 Submitting encoding-heavy workload...');
  const tasks = Array.from({ length: 50 }, (_, i) => ({
    type: i % 5 === 0 ? 'data_ingestion' : 'zeckendorf_encode',
    priority: TaskPriority.NORMAL,
    payload: { numbers: [100, 200, 300] }
  }));

  await swarm.submitBatch(tasks);

  // Wait and check for bottlenecks
  await new Promise(resolve => setTimeout(resolve, 3000));

  const metrics = swarm.getPerformanceMetrics();

  console.log('\n📊 Performance Analysis:');
  console.log(`   Throughput: ${metrics.throughput.toFixed(2)} tasks/sec`);
  console.log(`   Avg Latency: ${metrics.avgLatency.toFixed(2)}ms`);

  if (metrics.bottlenecks.length > 0) {
    console.log('\n⚠️  Detected Bottlenecks:');
    metrics.bottlenecks.forEach((bottleneck, i) => {
      console.log(`\n   ${i + 1}. [${bottleneck.severity.toUpperCase()}] ${bottleneck.type}`);
      console.log(`      Description: ${bottleneck.description}`);
      console.log(`      Recommendation: ${bottleneck.recommendation}`);
      if (bottleneck.affectedAgents) {
        console.log(`      Affected: ${bottleneck.affectedAgents.join(', ')}`);
      }
    });
  } else {
    console.log('\n✅ No bottlenecks detected');
  }

  await swarm.stop();
}

/**
 * Run all demos
 */
async function runAllDemos() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     AgentDB Swarm Demonstration for AURELIA φ-Mechanics      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  try {
    await demoBasicSwarm();
    await demoParallelMarketData();
    await demoPhiMechanicsPipeline();
    await demoPerformanceComparison();
    await demoAutoScaling();
    await demoBottleneckDetection();

    console.log('\n\n✅ All demos completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Demo error:', error);
    process.exit(1);
  }
}

/**
 * Main entry point
 */
if (require.main === module) {
  runAllDemos()
    .then(() => {
      console.log('🎉 AgentDB Swarm Demo Complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

// Export demos for selective running
export {
  demoBasicSwarm,
  demoParallelMarketData,
  demoPhiMechanicsPipeline,
  demoPerformanceComparison,
  demoAutoScaling,
  demoBottleneckDetection,
  runAllDemos
};

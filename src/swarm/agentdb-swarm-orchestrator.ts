/**
 * AgentDB Swarm Orchestrator for AURELIA
 *
 * High-performance distributed agent coordination using AgentDB for shared memory,
 * dynamic topology optimization, and parallel task execution with work-stealing.
 *
 * Performance Targets:
 * - 10x throughput vs single-agent
 * - <5ms inter-agent communication latency
 * - >80% agent utilization
 * - Linear scaling up to 100 agents
 */

import { AgentDB } from 'agentdb';
import { EventEmitter } from 'events';
import { SwarmAgent, AgentType, AgentRole, AgentConfig } from './swarm-agents';
import { WorkStealingScheduler, Task, TaskPriority } from './work-stealing-scheduler';
import { AgentDBCoordinator, CoordinationMessage, ConsensusProposal } from './agentdb-coordination';
import { SwarmMetrics, AgentMetrics, SwarmPerformance } from './swarm-metrics';

/**
 * Swarm topology types for different coordination patterns
 */
export enum SwarmTopology {
  MESH = 'mesh',           // Peer-to-peer, all agents connected
  HIERARCHICAL = 'hierarchical', // Tree structure with coordinators
  STAR = 'star',           // Central coordinator hub
  RING = 'ring',           // Circular topology for consensus
  ADAPTIVE = 'adaptive'    // Dynamic topology based on workload
}

/**
 * Swarm configuration
 */
export interface SwarmConfig {
  topology: SwarmTopology;
  maxAgents: number;
  minAgents: number;
  agentdbConfig: {
    dimensions: number;
    metric: 'cosine' | 'euclidean' | 'dotproduct';
    quantization?: 'uint8' | 'uint4';
    enableHNSW: boolean;
    enableQUIC: boolean;
  };
  scheduler: {
    workStealingEnabled: boolean;
    priorityLevels: number;
    maxQueueSize: number;
    stealThreshold: number;
  };
  coordination: {
    consensusProtocol: 'raft' | 'pbft' | 'gossip';
    quorumSize: number;
    heartbeatInterval: number;
    maxLatency: number;
  };
  scaling: {
    autoScale: boolean;
    scaleUpThreshold: number;   // Utilization % to scale up
    scaleDownThreshold: number; // Utilization % to scale down
    cooldownPeriod: number;     // ms between scaling operations
  };
}

/**
 * Swarm state
 */
export interface SwarmState {
  id: string;
  topology: SwarmTopology;
  agents: Map<string, SwarmAgent>;
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  uptime: number;
  lastScalingOperation: number;
}

/**
 * AgentDB Swarm Orchestrator
 *
 * Manages distributed agent coordination with:
 * - Dynamic topology optimization
 * - Work-stealing task distribution
 * - AgentDB-backed shared memory
 * - Real-time performance monitoring
 * - Auto-scaling based on load
 */
export class AgentDBSwarmOrchestrator extends EventEmitter {
  private config: SwarmConfig;
  private state: SwarmState;
  private agentdb: AgentDB;
  private scheduler: WorkStealingScheduler;
  private coordinator: AgentDBCoordinator;
  private metrics: SwarmMetrics;
  private agents: Map<string, SwarmAgent>;
  private running: boolean;
  private startTime: number;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(config: Partial<SwarmConfig> = {}) {
    super();

    // Default configuration
    this.config = {
      topology: config.topology || SwarmTopology.ADAPTIVE,
      maxAgents: config.maxAgents || 100,
      minAgents: config.minAgents || 4,
      agentdbConfig: {
        dimensions: 1536, // OpenAI embedding size
        metric: 'cosine',
        quantization: 'uint8',
        enableHNSW: true,
        enableQUIC: true,
        ...config.agentdbConfig
      },
      scheduler: {
        workStealingEnabled: true,
        priorityLevels: 5,
        maxQueueSize: 10000,
        stealThreshold: 0.3,
        ...config.scheduler
      },
      coordination: {
        consensusProtocol: 'raft',
        quorumSize: 3,
        heartbeatInterval: 1000,
        maxLatency: 5,
        ...config.coordination
      },
      scaling: {
        autoScale: true,
        scaleUpThreshold: 80,
        scaleDownThreshold: 30,
        cooldownPeriod: 30000,
        ...config.scaling
      }
    };

    this.agents = new Map();
    this.running = false;
    this.startTime = Date.now();

    // Initialize state
    this.state = {
      id: `swarm-${Date.now()}`,
      topology: this.config.topology,
      agents: this.agents,
      activeAgents: 0,
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      uptime: 0,
      lastScalingOperation: 0
    };

    // Initialize AgentDB with optimizations
    this.agentdb = new AgentDB({
      dimensions: this.config.agentdbConfig.dimensions,
      metric: this.config.agentdbConfig.metric,
      quantization: this.config.agentdbConfig.quantization,
      hnsw: this.config.agentdbConfig.enableHNSW ? {
        efConstruction: 200,
        m: 16
      } : undefined
    });

    // Initialize components
    this.scheduler = new WorkStealingScheduler({
      enableWorkStealing: this.config.scheduler.workStealingEnabled,
      priorityLevels: this.config.scheduler.priorityLevels,
      maxQueueSize: this.config.scheduler.maxQueueSize,
      stealThreshold: this.config.scheduler.stealThreshold
    });

    this.coordinator = new AgentDBCoordinator(this.agentdb, {
      protocol: this.config.coordination.consensusProtocol,
      quorumSize: this.config.coordination.quorumSize,
      heartbeatInterval: this.config.coordination.heartbeatInterval
    });

    this.metrics = new SwarmMetrics(this.state.id);

    this.setupEventHandlers();
  }

  /**
   * Start the swarm orchestrator
   */
  async start(): Promise<void> {
    if (this.running) {
      throw new Error('Swarm already running');
    }

    console.log(`🚀 Starting AgentDB Swarm Orchestrator (${this.state.id})`);
    console.log(`   Topology: ${this.config.topology}`);
    console.log(`   Max Agents: ${this.config.maxAgents}`);
    console.log(`   AgentDB: HNSW=${this.config.agentdbConfig.enableHNSW}, Quantization=${this.config.agentdbConfig.quantization}`);

    this.running = true;
    this.startTime = Date.now();

    // Start coordinator
    await this.coordinator.start();

    // Start scheduler
    this.scheduler.start();

    // Spawn initial agents based on topology
    await this.spawnInitialAgents();

    // Start monitoring
    this.startMonitoring();

    this.emit('started', { swarmId: this.state.id, topology: this.config.topology });
  }

  /**
   * Stop the swarm orchestrator
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    console.log(`🛑 Stopping AgentDB Swarm Orchestrator (${this.state.id})`);

    this.running = false;

    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Stop all agents
    await Promise.all(
      Array.from(this.agents.values()).map(agent => agent.stop())
    );

    // Stop scheduler
    this.scheduler.stop();

    // Stop coordinator
    await this.coordinator.stop();

    const finalMetrics = this.getPerformanceMetrics();
    console.log(`📊 Final Metrics:`, finalMetrics);

    this.emit('stopped', { swarmId: this.state.id, metrics: finalMetrics });
  }

  /**
   * Spawn a new agent with specified role
   */
  async spawnAgent(type: AgentType, config?: Partial<AgentConfig>): Promise<SwarmAgent> {
    if (this.agents.size >= this.config.maxAgents) {
      throw new Error(`Maximum agent limit (${this.config.maxAgents}) reached`);
    }

    const agentId = `agent-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const agent = new SwarmAgent({
      id: agentId,
      type,
      swarmId: this.state.id,
      agentdb: this.agentdb,
      coordinator: this.coordinator,
      scheduler: this.scheduler,
      ...config
    });

    // Register agent
    this.agents.set(agentId, agent);
    this.state.activeAgents = this.agents.size;

    // Start agent
    await agent.start();

    // Update topology
    await this.updateTopology();

    this.emit('agentSpawned', { agentId, type });
    console.log(`✨ Spawned ${type} agent: ${agentId}`);

    return agent;
  }

  /**
   * Remove an agent from the swarm
   */
  async despawnAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    await agent.stop();
    this.agents.delete(agentId);
    this.state.activeAgents = this.agents.size;

    await this.updateTopology();

    this.emit('agentDespawned', { agentId });
    console.log(`🗑️  Despawned agent: ${agentId}`);
  }

  /**
   * Submit a task to the swarm
   */
  async submitTask<T = any>(task: Omit<Task<T>, 'id' | 'status' | 'createdAt'>): Promise<string> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const fullTask: Task<T> = {
      id: taskId,
      status: 'pending',
      createdAt: Date.now(),
      ...task
    };

    await this.scheduler.submitTask(fullTask);
    this.state.totalTasks++;

    this.emit('taskSubmitted', { taskId, type: task.type });

    return taskId;
  }

  /**
   * Get task result
   */
  async getTaskResult<T = any>(taskId: string, timeout: number = 30000): Promise<T> {
    return this.scheduler.waitForTask<T>(taskId, timeout);
  }

  /**
   * Submit multiple tasks in parallel
   */
  async submitBatch<T = any>(tasks: Array<Omit<Task<T>, 'id' | 'status' | 'createdAt'>>): Promise<string[]> {
    const taskIds = await Promise.all(
      tasks.map(task => this.submitTask(task))
    );

    this.emit('batchSubmitted', { count: tasks.length, taskIds });

    return taskIds;
  }

  /**
   * Get swarm performance metrics
   */
  getPerformanceMetrics(): SwarmPerformance {
    const agentMetrics = Array.from(this.agents.values()).map(agent =>
      this.metrics.getAgentMetrics(agent.getId())
    );

    const avgUtilization = agentMetrics.reduce((sum, m) => sum + m.utilization, 0) / agentMetrics.length || 0;
    const avgLatency = agentMetrics.reduce((sum, m) => sum + m.avgLatency, 0) / agentMetrics.length || 0;

    return this.metrics.getSwarmPerformance({
      uptime: Date.now() - this.startTime,
      totalAgents: this.agents.size,
      activeAgents: this.state.activeAgents,
      totalTasks: this.state.totalTasks,
      completedTasks: this.state.completedTasks,
      failedTasks: this.state.failedTasks,
      avgUtilization,
      avgLatency,
      topology: this.state.topology
    });
  }

  /**
   * Get current swarm state
   */
  getState(): SwarmState {
    return {
      ...this.state,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Optimize topology based on workload patterns
   */
  async optimizeTopology(): Promise<SwarmTopology> {
    const metrics = this.getPerformanceMetrics();
    const currentTopology = this.state.topology;

    // Adaptive topology selection based on workload
    let newTopology = currentTopology;

    if (this.config.topology === SwarmTopology.ADAPTIVE) {
      const taskRate = metrics.throughput;
      const agentCount = this.agents.size;
      const avgLatency = metrics.avgLatency;

      // High task rate + many agents → MESH for parallelism
      if (taskRate > 100 && agentCount > 20) {
        newTopology = SwarmTopology.MESH;
      }
      // High latency + hierarchical tasks → HIERARCHICAL
      else if (avgLatency > 10 && metrics.taskCompletionRate < 0.7) {
        newTopology = SwarmTopology.HIERARCHICAL;
      }
      // Consensus-heavy workload → RING
      else if (this.coordinator.getConsensusRate() > 10) {
        newTopology = SwarmTopology.RING;
      }
      // Default to STAR for simplicity
      else {
        newTopology = SwarmTopology.STAR;
      }

      if (newTopology !== currentTopology) {
        console.log(`🔄 Topology optimization: ${currentTopology} → ${newTopology}`);
        await this.updateTopology(newTopology);
      }
    }

    return newTopology;
  }

  /**
   * Auto-scale agents based on utilization
   */
  private async autoScale(): Promise<void> {
    if (!this.config.scaling.autoScale) {
      return;
    }

    const now = Date.now();
    const timeSinceLastScale = now - this.state.lastScalingOperation;

    if (timeSinceLastScale < this.config.scaling.cooldownPeriod) {
      return; // Cooldown period
    }

    const metrics = this.getPerformanceMetrics();
    const avgUtilization = metrics.avgUtilization * 100;

    // Scale up if utilization is high
    if (avgUtilization > this.config.scaling.scaleUpThreshold &&
        this.agents.size < this.config.maxAgents) {

      const agentsToSpawn = Math.min(
        Math.ceil(this.agents.size * 0.25), // Spawn 25% more agents
        this.config.maxAgents - this.agents.size
      );

      console.log(`📈 Auto-scaling UP: spawning ${agentsToSpawn} agents (utilization: ${avgUtilization.toFixed(1)}%)`);

      // Spawn diverse agent types
      const types = Object.values(AgentType);
      await Promise.all(
        Array.from({ length: agentsToSpawn }, (_, i) =>
          this.spawnAgent(types[i % types.length] as AgentType)
        )
      );

      this.state.lastScalingOperation = now;
    }
    // Scale down if utilization is low
    else if (avgUtilization < this.config.scaling.scaleDownThreshold &&
             this.agents.size > this.config.minAgents) {

      const agentsToDespawn = Math.min(
        Math.ceil(this.agents.size * 0.2), // Remove 20% of agents
        this.agents.size - this.config.minAgents
      );

      console.log(`📉 Auto-scaling DOWN: removing ${agentsToDespawn} agents (utilization: ${avgUtilization.toFixed(1)}%)`);

      // Remove least utilized agents
      const agentsByUtilization = Array.from(this.agents.values())
        .sort((a, b) => {
          const aUtil = this.metrics.getAgentMetrics(a.getId()).utilization;
          const bUtil = this.metrics.getAgentMetrics(b.getId()).utilization;
          return aUtil - bUtil;
        });

      await Promise.all(
        agentsByUtilization
          .slice(0, agentsToDespawn)
          .map(agent => this.despawnAgent(agent.getId()))
      );

      this.state.lastScalingOperation = now;
    }
  }

  /**
   * Spawn initial agents based on topology
   */
  private async spawnInitialAgents(): Promise<void> {
    const initialAgentCount = Math.max(this.config.minAgents, 8);

    // Spawn diverse agent types
    const agentTypes = [
      AgentType.DATA_INGESTION,
      AgentType.ENCODING,
      AgentType.NASH_DETECTION,
      AgentType.KNOWLEDGE_GRAPH,
      AgentType.VISION,
      AgentType.TRADING,
      AgentType.CONSCIOUSNESS,
      AgentType.COORDINATION
    ];

    const agents = await Promise.all(
      Array.from({ length: initialAgentCount }, (_, i) =>
        this.spawnAgent(agentTypes[i % agentTypes.length])
      )
    );

    console.log(`✅ Spawned ${agents.length} initial agents`);
  }

  /**
   * Update network topology
   */
  private async updateTopology(newTopology?: SwarmTopology): Promise<void> {
    if (newTopology) {
      this.state.topology = newTopology;
    }

    const topology = this.state.topology;
    const agentIds = Array.from(this.agents.keys());

    // Update coordinator topology
    await this.coordinator.updateTopology(topology, agentIds);

    this.emit('topologyUpdated', { topology });
  }

  /**
   * Start performance monitoring
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      // Update metrics
      this.agents.forEach(agent => {
        this.metrics.recordAgentActivity(agent.getId(), {
          tasksProcessed: agent.getTasksProcessed(),
          avgLatency: agent.getAvgLatency(),
          utilization: agent.getUtilization(),
          errors: agent.getErrors()
        });
      });

      // Check for auto-scaling
      this.autoScale().catch(err =>
        console.error('Auto-scaling error:', err)
      );

      // Optimize topology if adaptive
      if (this.config.topology === SwarmTopology.ADAPTIVE) {
        this.optimizeTopology().catch(err =>
          console.error('Topology optimization error:', err)
        );
      }

      // Emit metrics
      const metrics = this.getPerformanceMetrics();
      this.emit('metricsUpdate', metrics);

    }, this.config.coordination.heartbeatInterval);
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.scheduler.on('taskCompleted', (taskId: string) => {
      this.state.completedTasks++;
      this.emit('taskCompleted', { taskId });
    });

    this.scheduler.on('taskFailed', (taskId: string, error: Error) => {
      this.state.failedTasks++;
      this.emit('taskFailed', { taskId, error });
    });

    this.coordinator.on('consensusReached', (proposal: ConsensusProposal) => {
      this.emit('consensusReached', proposal);
    });

    this.coordinator.on('agentFailed', (agentId: string) => {
      console.warn(`⚠️  Agent ${agentId} failed, attempting recovery...`);
      this.despawnAgent(agentId).then(() => {
        // Spawn replacement if needed
        if (this.agents.size < this.config.minAgents) {
          const failedAgent = this.agents.get(agentId);
          const type = failedAgent?.getType() || AgentType.COORDINATION;
          this.spawnAgent(type);
        }
      });
    });
  }
}

/**
 * Factory function for quick swarm creation
 */
export function createSwarm(config?: Partial<SwarmConfig>): AgentDBSwarmOrchestrator {
  return new AgentDBSwarmOrchestrator(config);
}

/**
 * Export types
 */
export type {
  SwarmConfig,
  SwarmState,
  AgentConfig
};

/**
 * Swarm Metrics and Performance Monitoring
 *
 * Real-time tracking of:
 * - Agent utilization and throughput
 * - Task completion rates and latency percentiles
 * - Bottleneck detection
 * - Resource usage
 * - Network topology efficiency
 */

import { EventEmitter } from 'events';

/**
 * Agent performance metrics
 */
export interface AgentMetrics {
  agentId: string;
  tasksProcessed: number;
  tasksSucceeded: number;
  tasksFailed: number;
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  utilization: number;
  throughput: number; // tasks per second
  errors: number;
  uptime: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

/**
 * Task performance metrics
 */
export interface TaskMetrics {
  taskId: string;
  type: string;
  priority: number;
  latency: number;
  queueTime: number;
  executionTime: number;
  retries: number;
  success: boolean;
}

/**
 * Swarm-wide performance metrics
 */
export interface SwarmPerformance {
  swarmId: string;
  uptime: number;
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  avgUtilization: number;
  avgLatency: number;
  throughput: number;
  successRate: number;
  topology: string;
  bottlenecks: Bottleneck[];
  resourceUsage: ResourceUsage;
}

/**
 * Bottleneck detection
 */
export interface Bottleneck {
  type: 'agent' | 'task_type' | 'resource' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedAgents?: string[];
  recommendation: string;
  detectedAt: number;
}

/**
 * Resource usage metrics
 */
export interface ResourceUsage {
  totalMemory: number;
  usedMemory: number;
  totalCPU: number;
  usedCPU: number;
  networkBandwidth: number;
  agentdbSize: number;
  messageQueueSize: number;
}

/**
 * Latency histogram for percentile calculations
 */
class LatencyHistogram {
  private buckets: number[];
  private values: number[];
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.buckets = [];
    this.values = [];
    this.maxSize = maxSize;
  }

  record(latency: number): void {
    this.values.push(latency);

    // Keep only recent values
    if (this.values.length > this.maxSize) {
      this.values.shift();
    }
  }

  getPercentile(percentile: number): number {
    if (this.values.length === 0) return 0;

    const sorted = [...this.values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  getAverage(): number {
    if (this.values.length === 0) return 0;
    return this.values.reduce((sum, v) => sum + v, 0) / this.values.length;
  }

  clear(): void {
    this.values = [];
  }
}

/**
 * Swarm Metrics Tracker
 */
export class SwarmMetrics extends EventEmitter {
  private swarmId: string;
  private agentMetrics: Map<string, {
    tasksProcessed: number;
    tasksSucceeded: number;
    tasksFailed: number;
    latencies: LatencyHistogram;
    errors: number;
    startTime: number;
    lastUpdate: number;
  }>;
  private taskMetrics: Map<string, TaskMetrics>;
  private bottlenecks: Bottleneck[];
  private monitoringInterval?: NodeJS.Timeout;

  constructor(swarmId: string) {
    super();

    this.swarmId = swarmId;
    this.agentMetrics = new Map();
    this.taskMetrics = new Map();
    this.bottlenecks = [];
  }

  /**
   * Record agent activity
   */
  recordAgentActivity(agentId: string, data: {
    tasksProcessed: number;
    avgLatency: number;
    utilization: number;
    errors: number;
  }): void {
    let metrics = this.agentMetrics.get(agentId);

    if (!metrics) {
      metrics = {
        tasksProcessed: 0,
        tasksSucceeded: 0,
        tasksFailed: 0,
        latencies: new LatencyHistogram(),
        errors: 0,
        startTime: Date.now(),
        lastUpdate: Date.now()
      };
      this.agentMetrics.set(agentId, metrics);
    }

    metrics.tasksProcessed = data.tasksProcessed;
    metrics.errors = data.errors;
    metrics.latencies.record(data.avgLatency);
    metrics.lastUpdate = Date.now();
  }

  /**
   * Record task completion
   */
  recordTaskCompletion(taskMetrics: TaskMetrics): void {
    this.taskMetrics.set(taskMetrics.taskId, taskMetrics);

    const agentMetrics = Array.from(this.agentMetrics.values());
    if (agentMetrics.length > 0) {
      const agent = agentMetrics[0]; // Simplified - would track per-agent
      if (taskMetrics.success) {
        agent.tasksSucceeded++;
      } else {
        agent.tasksFailed++;
      }
    }

    // Detect bottlenecks
    this.detectBottlenecks();
  }

  /**
   * Get metrics for specific agent
   */
  getAgentMetrics(agentId: string): AgentMetrics {
    const metrics = this.agentMetrics.get(agentId);

    if (!metrics) {
      return {
        agentId,
        tasksProcessed: 0,
        tasksSucceeded: 0,
        tasksFailed: 0,
        avgLatency: 0,
        p50Latency: 0,
        p95Latency: 0,
        p99Latency: 0,
        utilization: 0,
        throughput: 0,
        errors: 0,
        uptime: 0
      };
    }

    const uptime = Date.now() - metrics.startTime;
    const throughput = metrics.tasksProcessed / (uptime / 1000);

    return {
      agentId,
      tasksProcessed: metrics.tasksProcessed,
      tasksSucceeded: metrics.tasksSucceeded,
      tasksFailed: metrics.tasksFailed,
      avgLatency: metrics.latencies.getAverage(),
      p50Latency: metrics.latencies.getPercentile(50),
      p95Latency: metrics.latencies.getPercentile(95),
      p99Latency: metrics.latencies.getPercentile(99),
      utilization: 0, // Would be calculated from current tasks
      throughput,
      errors: metrics.errors,
      uptime
    };
  }

  /**
   * Get swarm-wide performance metrics
   */
  getSwarmPerformance(state: {
    uptime: number;
    totalAgents: number;
    activeAgents: number;
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    avgUtilization: number;
    avgLatency: number;
    topology: string;
  }): SwarmPerformance {
    const throughput = state.completedTasks / (state.uptime / 1000);
    const successRate = state.completedTasks / (state.completedTasks + state.failedTasks) || 1;

    return {
      swarmId: this.swarmId,
      uptime: state.uptime,
      totalAgents: state.totalAgents,
      activeAgents: state.activeAgents,
      totalTasks: state.totalTasks,
      completedTasks: state.completedTasks,
      failedTasks: state.failedTasks,
      avgUtilization: state.avgUtilization,
      avgLatency: state.avgLatency,
      throughput,
      successRate,
      topology: state.topology,
      bottlenecks: this.bottlenecks,
      resourceUsage: this.getResourceUsage()
    };
  }

  /**
   * Detect performance bottlenecks
   */
  private detectBottlenecks(): void {
    this.bottlenecks = [];

    // Detect high latency agents
    this.agentMetrics.forEach((metrics, agentId) => {
      const avgLatency = metrics.latencies.getAverage();

      if (avgLatency > 100) {
        this.bottlenecks.push({
          type: 'agent',
          severity: avgLatency > 500 ? 'critical' : avgLatency > 200 ? 'high' : 'medium',
          description: `Agent ${agentId} has high average latency: ${avgLatency.toFixed(2)}ms`,
          affectedAgents: [agentId],
          recommendation: 'Consider reducing agent workload or optimizing task processing',
          detectedAt: Date.now()
        });
      }
    });

    // Detect high error rates
    this.agentMetrics.forEach((metrics, agentId) => {
      const errorRate = metrics.errors / metrics.tasksProcessed;

      if (errorRate > 0.1 && metrics.tasksProcessed > 10) {
        this.bottlenecks.push({
          type: 'agent',
          severity: errorRate > 0.3 ? 'critical' : 'high',
          description: `Agent ${agentId} has high error rate: ${(errorRate * 100).toFixed(1)}%`,
          affectedAgents: [agentId],
          recommendation: 'Investigate agent errors and consider restarting or replacing agent',
          detectedAt: Date.now()
        });
      }
    });

    // Detect task type bottlenecks
    const tasksByType = new Map<string, TaskMetrics[]>();
    this.taskMetrics.forEach(task => {
      const tasks = tasksByType.get(task.type) || [];
      tasks.push(task);
      tasksByType.set(task.type, tasks);
    });

    tasksByType.forEach((tasks, type) => {
      const avgLatency = tasks.reduce((sum, t) => sum + t.latency, 0) / tasks.length;

      if (avgLatency > 200) {
        this.bottlenecks.push({
          type: 'task_type',
          severity: avgLatency > 1000 ? 'critical' : 'medium',
          description: `Task type "${type}" has high average latency: ${avgLatency.toFixed(2)}ms`,
          recommendation: 'Consider optimizing task processing or increasing parallel workers',
          detectedAt: Date.now()
        });
      }
    });

    // Emit bottleneck events
    if (this.bottlenecks.length > 0) {
      this.emit('bottlenecksDetected', this.bottlenecks);
    }
  }

  /**
   * Get resource usage metrics
   */
  private getResourceUsage(): ResourceUsage {
    // Simplified - would integrate with actual system metrics
    return {
      totalMemory: 16384, // MB
      usedMemory: 4096,
      totalCPU: 100, // %
      usedCPU: 45,
      networkBandwidth: 1000, // Mbps
      agentdbSize: 1024, // MB
      messageQueueSize: 150
    };
  }

  /**
   * Get task metrics by type
   */
  getTaskMetricsByType(): Map<string, {
    count: number;
    avgLatency: number;
    successRate: number;
  }> {
    const metricsByType = new Map<string, TaskMetrics[]>();

    this.taskMetrics.forEach(task => {
      const tasks = metricsByType.get(task.type) || [];
      tasks.push(task);
      metricsByType.set(task.type, tasks);
    });

    const result = new Map<string, { count: number; avgLatency: number; successRate: number }>();

    metricsByType.forEach((tasks, type) => {
      const count = tasks.length;
      const avgLatency = tasks.reduce((sum, t) => sum + t.latency, 0) / count;
      const successRate = tasks.filter(t => t.success).length / count;

      result.set(type, { count, avgLatency, successRate });
    });

    return result;
  }

  /**
   * Get bottlenecks
   */
  getBottlenecks(): Bottleneck[] {
    return this.bottlenecks;
  }

  /**
   * Clear metrics
   */
  clear(): void {
    this.agentMetrics.clear();
    this.taskMetrics.clear();
    this.bottlenecks = [];
  }

  /**
   * Export metrics for persistence
   */
  export(): any {
    return {
      swarmId: this.swarmId,
      agents: Array.from(this.agentMetrics.entries()).map(([id, metrics]) => ({
        agentId: id,
        ...this.getAgentMetrics(id)
      })),
      tasks: Array.from(this.taskMetrics.values()),
      bottlenecks: this.bottlenecks,
      timestamp: Date.now()
    };
  }
}

/**
 * Performance comparison utilities
 */
export class PerformanceComparator {
  /**
   * Compare single-agent vs swarm performance
   */
  static comparePerformance(singleAgent: {
    throughput: number;
    latency: number;
    successRate: number;
  }, swarm: SwarmPerformance): {
    throughputImprovement: number;
    latencyImprovement: number;
    efficiencyGain: number;
  } {
    const throughputImprovement = swarm.throughput / singleAgent.throughput;
    const latencyImprovement = singleAgent.latency / swarm.avgLatency;
    const efficiencyGain = (swarm.successRate / singleAgent.successRate) * throughputImprovement;

    return {
      throughputImprovement,
      latencyImprovement,
      efficiencyGain
    };
  }

  /**
   * Calculate ideal agent count based on workload
   */
  static calculateIdealAgentCount(workload: {
    tasksPerSecond: number;
    avgTaskLatency: number;
    targetUtilization: number;
  }): number {
    const tasksPerAgent = (1000 / workload.avgTaskLatency) * workload.targetUtilization;
    return Math.ceil(workload.tasksPerSecond / tasksPerAgent);
  }
}

/**
 * Work-Stealing Scheduler for AgentDB Swarm
 *
 * High-performance task distribution with:
 * - Load-balanced work stealing
 * - Priority-based scheduling
 * - Deadlock prevention
 * - Backpressure management
 *
 * Based on the Cilk work-stealing algorithm with adaptations for
 * distributed agent systems.
 */

import { EventEmitter } from 'events';

/**
 * Task priority levels
 */
export enum TaskPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  URGENT = 3,
  CRITICAL = 4
}

/**
 * Task status
 */
export enum TaskStatus {
  PENDING = 'pending',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Task definition
 */
export interface Task<T = any> {
  id: string;
  type: string;
  priority: TaskPriority;
  payload: T;
  requiredCapabilities?: string[];
  timeout?: number;
  retries?: number;
  maxRetries?: number;
  dependencies?: string[];
  status: TaskStatus;
  assignedTo?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: any;
  error?: Error;
}

/**
 * Work queue for each priority level
 */
class PriorityQueue<T> {
  private queues: Map<TaskPriority, T[]>;
  private size: number;

  constructor() {
    this.queues = new Map();
    this.size = 0;

    // Initialize queues for each priority
    Object.values(TaskPriority)
      .filter(v => typeof v === 'number')
      .forEach(priority => {
        this.queues.set(priority as TaskPriority, []);
      });
  }

  enqueue(item: T, priority: TaskPriority): void {
    const queue = this.queues.get(priority)!;
    queue.push(item);
    this.size++;
  }

  dequeue(): T | undefined {
    // Dequeue from highest priority first
    for (let p = TaskPriority.CRITICAL; p >= TaskPriority.LOW; p--) {
      const queue = this.queues.get(p)!;
      if (queue.length > 0) {
        this.size--;
        return queue.shift();
      }
    }
    return undefined;
  }

  peek(): T | undefined {
    for (let p = TaskPriority.CRITICAL; p >= TaskPriority.LOW; p--) {
      const queue = this.queues.get(p)!;
      if (queue.length > 0) {
        return queue[0];
      }
    }
    return undefined;
  }

  steal(): T | undefined {
    // Steal from lowest priority first (opposite of dequeue)
    for (let p = TaskPriority.LOW; p <= TaskPriority.CRITICAL; p++) {
      const queue = this.queues.get(p)!;
      if (queue.length > 0) {
        this.size--;
        return queue.pop(); // Take from end for LIFO work-stealing
      }
    }
    return undefined;
  }

  getSize(): number {
    return this.size;
  }

  isEmpty(): boolean {
    return this.size === 0;
  }

  clear(): void {
    this.queues.forEach(queue => queue.length = 0);
    this.size = 0;
  }
}

/**
 * Agent work queue
 */
interface AgentQueue {
  agentId: string;
  queue: PriorityQueue<Task>;
  capabilities: string[];
  utilization: number;
  lastSteal: number;
}

/**
 * Scheduler configuration
 */
export interface SchedulerConfig {
  enableWorkStealing: boolean;
  priorityLevels: number;
  maxQueueSize: number;
  stealThreshold: number;     // Utilization threshold to trigger stealing
  stealCooldown?: number;     // ms between steal attempts
  taskTimeout?: number;       // Default task timeout
  maxRetries?: number;        // Default max retries
}

/**
 * Task request options
 */
export interface TaskRequestOptions {
  capabilities?: string[];
  maxPriority?: TaskPriority;
  timeout?: number;
}

/**
 * Work-Stealing Scheduler
 *
 * Manages task distribution across agents with load balancing and work stealing.
 */
export class WorkStealingScheduler extends EventEmitter {
  private config: SchedulerConfig;
  private globalQueue: PriorityQueue<Task>;
  private agentQueues: Map<string, AgentQueue>;
  private tasks: Map<string, Task>;
  private taskWaiters: Map<string, Array<{ resolve: (result: any) => void; reject: (error: Error) => void }>>;
  private running: boolean;
  private schedulingInterval?: NodeJS.Timeout;

  constructor(config: Partial<SchedulerConfig> = {}) {
    super();

    this.config = {
      enableWorkStealing: true,
      priorityLevels: 5,
      maxQueueSize: 10000,
      stealThreshold: 0.3,
      stealCooldown: 100,
      taskTimeout: 60000,
      maxRetries: 3,
      ...config
    };

    this.globalQueue = new PriorityQueue<Task>();
    this.agentQueues = new Map();
    this.tasks = new Map();
    this.taskWaiters = new Map();
    this.running = false;
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;

    // Start work-stealing loop
    if (this.config.enableWorkStealing) {
      this.schedulingInterval = setInterval(() => {
        this.performWorkStealing();
      }, this.config.stealCooldown || 100);
    }

    this.emit('started');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;

    if (this.schedulingInterval) {
      clearInterval(this.schedulingInterval);
    }

    // Cancel all pending tasks
    this.tasks.forEach(task => {
      if (task.status === TaskStatus.PENDING || task.status === TaskStatus.ASSIGNED) {
        task.status = TaskStatus.CANCELLED;
        this.emit('taskCancelled', task.id);
      }
    });

    this.emit('stopped');
  }

  /**
   * Register an agent
   */
  registerAgent(agentId: string, capabilities: string[] = []): void {
    if (!this.agentQueues.has(agentId)) {
      this.agentQueues.set(agentId, {
        agentId,
        queue: new PriorityQueue<Task>(),
        capabilities,
        utilization: 0,
        lastSteal: 0
      });

      this.emit('agentRegistered', agentId);
    }
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId: string): void {
    const agentQueue = this.agentQueues.get(agentId);
    if (agentQueue) {
      // Move tasks back to global queue
      while (!agentQueue.queue.isEmpty()) {
        const task = agentQueue.queue.dequeue();
        if (task) {
          task.status = TaskStatus.PENDING;
          task.assignedTo = undefined;
          this.globalQueue.enqueue(task, task.priority);
        }
      }

      this.agentQueues.delete(agentId);
      this.emit('agentUnregistered', agentId);
    }
  }

  /**
   * Submit a task
   */
  async submitTask<T = any>(task: Task<T>): Promise<void> {
    if (this.tasks.size >= this.config.maxQueueSize) {
      throw new Error('Task queue is full');
    }

    // Set defaults
    task.maxRetries = task.maxRetries ?? this.config.maxRetries;
    task.timeout = task.timeout ?? this.config.taskTimeout;
    task.retries = task.retries ?? 0;

    this.tasks.set(task.id, task);
    this.globalQueue.enqueue(task, task.priority);

    this.emit('taskSubmitted', task.id);

    // Try to assign immediately
    this.assignTasks();
  }

  /**
   * Request a task (called by agents)
   */
  async requestTask(agentId: string, options: TaskRequestOptions = {}): Promise<Task | null> {
    const agentQueue = this.agentQueues.get(agentId);
    if (!agentQueue) {
      throw new Error(`Agent ${agentId} not registered`);
    }

    // First, check agent's local queue
    let task = this.findMatchingTask(agentQueue.queue, options);

    if (task) {
      task.status = TaskStatus.IN_PROGRESS;
      task.startedAt = Date.now();
      this.updateUtilization();
      return task;
    }

    // If local queue is empty, try global queue
    task = this.findMatchingTask(this.globalQueue, options);

    if (task) {
      task.status = TaskStatus.ASSIGNED;
      task.assignedTo = agentId;
      agentQueue.queue.enqueue(task, task.priority);

      task.status = TaskStatus.IN_PROGRESS;
      task.startedAt = Date.now();
      this.updateUtilization();
      return task;
    }

    // If still nothing, try work stealing
    if (this.config.enableWorkStealing) {
      task = await this.stealTask(agentId, options);
      if (task) {
        task.status = TaskStatus.IN_PROGRESS;
        task.startedAt = Date.now();
        this.updateUtilization();
        return task;
      }
    }

    return null;
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string, result: any): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.status = TaskStatus.COMPLETED;
    task.completedAt = Date.now();
    task.result = result;

    this.updateUtilization();
    this.emit('taskCompleted', taskId, result);

    // Resolve any waiters
    const waiters = this.taskWaiters.get(taskId);
    if (waiters) {
      waiters.forEach(w => w.resolve(result));
      this.taskWaiters.delete(taskId);
    }

    // Process dependent tasks
    this.processDependents(taskId);
  }

  /**
   * Fail a task
   */
  async failTask(taskId: string, error: Error): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.error = error;
    task.retries = (task.retries || 0) + 1;

    // Retry if possible
    if (task.retries < (task.maxRetries || 0)) {
      task.status = TaskStatus.PENDING;
      task.assignedTo = undefined;
      this.globalQueue.enqueue(task, task.priority);

      this.emit('taskRetrying', taskId, task.retries);
      this.assignTasks();
    } else {
      task.status = TaskStatus.FAILED;
      task.completedAt = Date.now();

      this.updateUtilization();
      this.emit('taskFailed', taskId, error);

      // Reject any waiters
      const waiters = this.taskWaiters.get(taskId);
      if (waiters) {
        waiters.forEach(w => w.reject(error));
        this.taskWaiters.delete(taskId);
      }
    }
  }

  /**
   * Wait for task completion
   */
  async waitForTask<T = any>(taskId: string, timeout: number = 30000): Promise<T> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status === TaskStatus.COMPLETED) {
      return task.result;
    }

    if (task.status === TaskStatus.FAILED) {
      throw task.error || new Error('Task failed');
    }

    return new Promise<T>((resolve, reject) => {
      const waiters = this.taskWaiters.get(taskId) || [];
      waiters.push({ resolve, reject });
      this.taskWaiters.set(taskId, waiters);

      // Timeout
      setTimeout(() => {
        const index = waiters.findIndex(w => w.resolve === resolve);
        if (index !== -1) {
          waiters.splice(index, 1);
          reject(new Error(`Task ${taskId} timeout`));
        }
      }, timeout);
    });
  }

  /**
   * Get scheduler statistics
   */
  getStats() {
    const agentStats = Array.from(this.agentQueues.values()).map(aq => ({
      agentId: aq.agentId,
      queueSize: aq.queue.getSize(),
      utilization: aq.utilization,
      capabilities: aq.capabilities
    }));

    const tasksByStatus = {
      pending: 0,
      assigned: 0,
      in_progress: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    };

    this.tasks.forEach(task => {
      tasksByStatus[task.status]++;
    });

    return {
      globalQueueSize: this.globalQueue.getSize(),
      totalTasks: this.tasks.size,
      tasksByStatus,
      agents: agentStats,
      avgUtilization: agentStats.reduce((sum, a) => sum + a.utilization, 0) / agentStats.length || 0
    };
  }

  /**
   * Assign tasks from global queue to agents
   */
  private assignTasks(): void {
    const agents = Array.from(this.agentQueues.values())
      .sort((a, b) => a.queue.getSize() - b.queue.getSize()); // Least loaded first

    for (const agent of agents) {
      while (!this.globalQueue.isEmpty() && agent.queue.getSize() < 10) {
        const task = this.globalQueue.dequeue();
        if (task && this.isCapable(agent, task)) {
          task.status = TaskStatus.ASSIGNED;
          task.assignedTo = agent.agentId;
          agent.queue.enqueue(task, task.priority);
        } else if (task) {
          // Put back if agent not capable
          this.globalQueue.enqueue(task, task.priority);
          break;
        }
      }
    }
  }

  /**
   * Perform work stealing
   */
  private performWorkStealing(): void {
    const agents = Array.from(this.agentQueues.values());

    // Find underutilized agents (victims)
    const victims = agents.filter(a =>
      a.utilization < this.config.stealThreshold &&
      Date.now() - a.lastSteal > (this.config.stealCooldown || 100)
    );

    // Find overloaded agents (thieves)
    const thieves = agents.filter(a =>
      a.utilization > 0.8 && a.queue.getSize() > 5
    );

    for (const victim of victims) {
      for (const thief of thieves) {
        const stolenTask = thief.queue.steal();
        if (stolenTask && this.isCapable(victim, stolenTask)) {
          stolenTask.assignedTo = victim.agentId;
          victim.queue.enqueue(stolenTask, stolenTask.priority);
          victim.lastSteal = Date.now();

          this.emit('taskStolen', {
            taskId: stolenTask.id,
            from: thief.agentId,
            to: victim.agentId
          });
          break;
        }
      }
    }
  }

  /**
   * Steal a task for an agent
   */
  private async stealTask(agentId: string, options: TaskRequestOptions): Promise<Task | null> {
    const agents = Array.from(this.agentQueues.values())
      .filter(a => a.agentId !== agentId && a.queue.getSize() > 1)
      .sort((a, b) => b.queue.getSize() - a.queue.getSize()); // Most loaded first

    for (const targetAgent of agents) {
      const task = targetAgent.queue.steal();
      if (task && this.isCapable(this.agentQueues.get(agentId)!, task)) {
        task.assignedTo = agentId;
        this.agentQueues.get(agentId)!.lastSteal = Date.now();

        this.emit('taskStolen', {
          taskId: task.id,
          from: targetAgent.agentId,
          to: agentId
        });

        return task;
      } else if (task) {
        // Put back if not capable
        targetAgent.queue.enqueue(task, task.priority);
      }
    }

    return null;
  }

  /**
   * Find matching task in queue
   */
  private findMatchingTask(queue: PriorityQueue<Task>, options: TaskRequestOptions): Task | null {
    const task = queue.dequeue();
    if (!task) {
      return null;
    }

    // Check capabilities
    if (options.capabilities && task.requiredCapabilities) {
      const hasCapabilities = task.requiredCapabilities.every(cap =>
        options.capabilities!.includes(cap)
      );
      if (!hasCapabilities) {
        queue.enqueue(task, task.priority);
        return null;
      }
    }

    return task;
  }

  /**
   * Check if agent is capable of handling task
   */
  private isCapable(agent: AgentQueue, task: Task): boolean {
    if (!task.requiredCapabilities || task.requiredCapabilities.length === 0) {
      return true;
    }

    return task.requiredCapabilities.every(cap =>
      agent.capabilities.includes(cap)
    );
  }

  /**
   * Update agent utilization metrics
   */
  private updateUtilization(): void {
    this.agentQueues.forEach(agent => {
      const inProgress = Array.from(this.tasks.values()).filter(t =>
        t.assignedTo === agent.agentId && t.status === TaskStatus.IN_PROGRESS
      ).length;

      agent.utilization = inProgress / 10; // Assume max 10 concurrent tasks
    });
  }

  /**
   * Process tasks dependent on completed task
   */
  private processDependents(completedTaskId: string): void {
    this.tasks.forEach(task => {
      if (task.dependencies?.includes(completedTaskId)) {
        const index = task.dependencies.indexOf(completedTaskId);
        task.dependencies.splice(index, 1);

        // If all dependencies resolved, make available
        if (task.dependencies.length === 0 && task.status === TaskStatus.PENDING) {
          this.globalQueue.enqueue(task, task.priority);
          this.assignTasks();
        }
      }
    });
  }
}

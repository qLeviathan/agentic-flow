import { AgentDBManager } from '../services/agentdb-manager.js';
import { logger } from '../utils/logger.js';

export interface SwarmTask<T = any> {
  taskId: string;
  data: any;
  analyzer?: any;
  result?: T;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  assignedAgent?: string;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

export interface SwarmAgent {
  id: string;
  type: 'frame-analyzer' | 'text-analyzer' | 'insight-generator';
  status: 'idle' | 'busy';
  tasksCompleted: number;
  currentTask?: string;
}

export class SwarmCoordinator {
  private agents: Map<string, SwarmAgent> = new Map();
  private tasks: Map<string, SwarmTask> = new Map();
  private db: AgentDBManager | null = null;
  private maxAgents: number = 8;

  async initialize(db: AgentDBManager): Promise<void> {
    this.db = db;

    // Spawn initial agent swarm
    await this.spawnAgents();

    logger.info(`🐝 Swarm initialized with ${this.agents.size} agents`);
  }

  private async spawnAgents(): Promise<void> {
    // Create frame analyzer agents (parallel processing)
    for (let i = 0; i < 5; i++) {
      this.agents.set(`frame-analyzer-${i}`, {
        id: `frame-analyzer-${i}`,
        type: 'frame-analyzer',
        status: 'idle',
        tasksCompleted: 0,
      });
    }

    // Create text analyzer agents
    for (let i = 0; i < 2; i++) {
      this.agents.set(`text-analyzer-${i}`, {
        id: `text-analyzer-${i}`,
        type: 'text-analyzer',
        status: 'idle',
        tasksCompleted: 0,
      });
    }

    // Create insight generator
    this.agents.set('insight-generator-0', {
      id: 'insight-generator-0',
      type: 'insight-generator',
      status: 'idle',
      tasksCompleted: 0,
    });
  }

  async spawnAnalysisSwarm(options: {
    videoId: string;
    analysisType: string;
    maxFrames: number;
  }): Promise<string> {
    const swarmTaskId = `swarm-${options.videoId}-${Date.now()}`;

    // Store swarm task in AgentDB
    if (this.db) {
      await this.db.storeSwarmTask(swarmTaskId, {
        videoId: options.videoId,
        analysisType: options.analysisType,
        maxFrames: options.maxFrames,
        status: 'initialized',
        timestamp: new Date().toISOString(),
      });
    }

    logger.info(`🐝 Spawned analysis swarm: ${swarmTaskId}`);
    return swarmTaskId;
  }

  async distributeTask<T>(taskType: string, tasks: any[]): Promise<T[]> {
    logger.info(`📋 Distributing ${tasks.length} tasks across swarm...`);

    // Create task entries
    tasks.forEach((task) => {
      this.tasks.set(task.taskId, {
        ...task,
        status: 'pending',
      });
    });

    // Simulate parallel processing with agent pool
    const results: T[] = [];
    const concurrency = this.maxAgents;

    for (let i = 0; i < tasks.length; i += concurrency) {
      const batch = tasks.slice(i, i + concurrency);

      const batchResults = await Promise.all(
        batch.map(async (task) => {
          const agent = this.assignAgent('frame-analyzer');

          if (agent) {
            agent.status = 'busy';
            agent.currentTask = task.taskId;

            this.updateTaskStatus(task.taskId, 'processing', agent.id);

            try {
              // Execute the actual analysis
              const result = await task.analyzer.analyzeFrame(task.data);

              this.updateTaskStatus(task.taskId, 'completed', agent.id);
              agent.status = 'idle';
              agent.tasksCompleted++;
              agent.currentTask = undefined;

              return result;
            } catch (error) {
              this.updateTaskStatus(task.taskId, 'failed', agent.id, String(error));
              agent.status = 'idle';
              agent.currentTask = undefined;
              throw error;
            }
          }
          return null;
        })
      );

      results.push(...batchResults.filter((r): r is T => r !== null));

      logger.info(`✅ Completed batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(tasks.length / concurrency)}`);
    }

    logger.info(`🎉 All ${tasks.length} tasks completed`);
    return results;
  }

  private assignAgent(type: string): SwarmAgent | undefined {
    for (const [, agent] of this.agents) {
      if (agent.type.startsWith(type) && agent.status === 'idle') {
        return agent;
      }
    }
    return undefined;
  }

  private updateTaskStatus(
    taskId: string,
    status: SwarmTask['status'],
    agentId?: string,
    error?: string
  ): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.status = status;
      if (agentId) task.assignedAgent = agentId;
      if (status === 'processing') task.startTime = new Date();
      if (status === 'completed' || status === 'failed') task.endTime = new Date();
      if (error) task.error = error;
    }
  }

  async generateInsights(analysis: any): Promise<any> {
    logger.info('🧠 Generating swarm intelligence insights...');

    const insights = {
      videoSummary: this.generateVideoSummary(analysis),
      keyMoments: this.extractKeyMoments(analysis),
      visualPatterns: this.analyzeVisualPatterns(analysis),
      textHighlights: this.extractTextHighlights(analysis),
      recommendations: this.generateRecommendations(analysis),
    };

    // Store insights in AgentDB for future learning
    if (this.db) {
      await this.db.storeInsights(analysis.videoInfo.id, insights);
    }

    return insights;
  }

  private generateVideoSummary(analysis: any): string {
    return `Analyzed video: ${analysis.videoInfo.title} (${analysis.videoInfo.duration}s). ` +
           `Found ${analysis.frameAnalysis?.length || 0} frames with visual content. ` +
           `Transcript contains ${analysis.textAnalysis?.keywords?.length || 0} key topics.`;
  }

  private extractKeyMoments(analysis: any): any[] {
    if (!analysis.frameAnalysis) return [];

    // Find frames with significant changes or important content
    return analysis.frameAnalysis
      .filter((frame: any) =>
        frame.faces.length > 0 ||
        frame.text.length > 3 ||
        frame.objects.length > 5
      )
      .slice(0, 10)
      .map((frame: any) => ({
        timestamp: frame.timestamp,
        reason: this.determineKeyMomentReason(frame),
        preview: `Frame ${frame.frameIndex}`,
      }));
  }

  private determineKeyMomentReason(frame: any): string {
    if (frame.faces.length > 0) return 'Face detected';
    if (frame.text.length > 3) return 'Text overlay';
    if (frame.objects.length > 5) return 'Complex scene';
    return 'Visual interest';
  }

  private analyzeVisualPatterns(analysis: any): any {
    if (!analysis.frameAnalysis) return {};

    const totalFrames = analysis.frameAnalysis.length;
    const framesWithFaces = analysis.frameAnalysis.filter((f: any) => f.faces.length > 0).length;
    const framesWithText = analysis.frameAnalysis.filter((f: any) => f.text.length > 0).length;

    return {
      faceAppearanceRate: (framesWithFaces / totalFrames) * 100,
      textOverlayRate: (framesWithText / totalFrames) * 100,
      averageObjectsPerFrame:
        analysis.frameAnalysis.reduce((sum: number, f: any) => sum + f.objects.length, 0) / totalFrames,
    };
  }

  private extractTextHighlights(analysis: any): string[] {
    return analysis.textAnalysis?.keywords || [];
  }

  private generateRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];

    if (analysis.frameAnalysis?.some((f: any) => f.text.length > 5)) {
      recommendations.push('Video contains significant text overlays - good for educational content');
    }

    if (analysis.frameAnalysis?.some((f: any) => f.faces.length > 2)) {
      recommendations.push('Multiple faces detected - appears to be interview or group discussion');
    }

    if (analysis.textAnalysis?.sentiment === 'positive') {
      recommendations.push('Positive sentiment detected in transcript');
    }

    return recommendations;
  }

  getSwarmStatus(): any {
    const agentsByStatus = {
      idle: 0,
      busy: 0,
    };

    this.agents.forEach((agent) => {
      agentsByStatus[agent.status]++;
    });

    const tasksByStatus = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    this.tasks.forEach((task) => {
      tasksByStatus[task.status]++;
    });

    return {
      agents: {
        total: this.agents.size,
        ...agentsByStatus,
      },
      tasks: tasksByStatus,
    };
  }

  async shutdown(): Promise<void> {
    logger.info('🛑 Shutting down swarm coordinator...');
    this.agents.clear();
    this.tasks.clear();
  }
}

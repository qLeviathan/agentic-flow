import { createVectorDB } from 'agentdb';
import { logger } from '../utils/logger.js';

export class AgentDBManager {
  private db: any = null;
  private dbPath: string = '';

  async initialize(dbPath: string = './youtube-vision-memory.db'): Promise<void> {
    this.dbPath = dbPath;

    try {
      // Initialize AgentDB with frontier memory features
      this.db = await createVectorDB({
        path: dbPath,
        enableReflexion: true,
        enableSkillLibrary: true,
        enableCausalMemory: true,
      });

      logger.info(`💾 AgentDB initialized at ${dbPath}`);

      // Initialize schema for video analyses
      await this.initializeSchema();
    } catch (error) {
      logger.error(`AgentDB initialization failed: ${error}`);
      throw error;
    }
  }

  private async initializeSchema(): Promise<void> {
    // AgentDB automatically creates necessary tables
    // We just store analyses as vectors with metadata
    logger.info('✅ AgentDB schema ready');
  }

  async storeAnalysis(videoId: string, analysis: any): Promise<void> {
    try {
      // Create embedding from analysis content
      const embedding = await this.createEmbedding(JSON.stringify(analysis));

      await this.db.insert({
        embedding,
        metadata: {
          type: 'video_analysis',
          videoId,
          title: analysis.videoInfo.title,
          duration: analysis.videoInfo.duration,
          timestamp: analysis.timestamp,
          frameCount: analysis.frameAnalysis?.length || 0,
          hasTranscript: !!analysis.transcript?.text,
          sentiment: analysis.textAnalysis?.sentiment,
          keywords: analysis.textAnalysis?.keywords,
        },
        tags: ['video', 'analysis', videoId],
      });

      logger.info(`✅ Stored analysis for video ${videoId} in AgentDB`);
    } catch (error) {
      logger.error(`Failed to store analysis: ${error}`);
      throw error;
    }
  }

  async searchAnalyses(query: string, limit: number = 5): Promise<any[]> {
    try {
      const queryEmbedding = await this.createEmbedding(query);

      const results = await this.db.search({
        query: queryEmbedding,
        k: limit,
        filters: { type: 'video_analysis' },
        minSimilarity: 0.7,
      });

      logger.info(`🔍 Found ${results.length} matching analyses`);
      return results;
    } catch (error) {
      logger.error(`Search failed: ${error}`);
      return [];
    }
  }

  async storeSwarmTask(taskId: string, taskData: any): Promise<void> {
    try {
      const embedding = await this.createEmbedding(JSON.stringify(taskData));

      await this.db.insert({
        embedding,
        metadata: {
          type: 'swarm_task',
          taskId,
          ...taskData,
        },
        tags: ['swarm', 'task', taskData.videoId],
      });

      logger.info(`✅ Stored swarm task ${taskId} in AgentDB`);
    } catch (error) {
      logger.error(`Failed to store swarm task: ${error}`);
    }
  }

  async storeInsights(videoId: string, insights: any): Promise<void> {
    try {
      const embedding = await this.createEmbedding(JSON.stringify(insights));

      await this.db.insert({
        embedding,
        metadata: {
          type: 'insights',
          videoId,
          ...insights,
        },
        tags: ['insights', videoId],
      });

      // Store as a skill in AgentDB skill library
      if (this.db.skill) {
        await this.db.skill.create({
          name: `insights_${videoId}`,
          description: insights.videoSummary,
          parameters: { videoId },
          implementation: JSON.stringify(insights),
          category: 'video_analysis',
        });
      }

      logger.info(`✅ Stored insights for video ${videoId} in AgentDB`);
    } catch (error) {
      logger.error(`Failed to store insights: ${error}`);
    }
  }

  private async createEmbedding(text: string): Promise<number[]> {
    // Simplified embedding generation
    // In production, use a proper embedding model (OpenAI, Cohere, etc.)

    // For now, create a simple hash-based embedding
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);

    words.forEach((word, index) => {
      const hash = this.hashString(word);
      embedding[hash % embedding.length] += 1;
    });

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map((val) => val / (magnitude || 1));
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  async close(): Promise<void> {
    if (this.db && this.db.close) {
      await this.db.close();
      logger.info('💾 AgentDB closed');
    }
  }
}

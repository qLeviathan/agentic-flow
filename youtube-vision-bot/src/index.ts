#!/usr/bin/env node

import { SwarmCoordinator } from './agents/swarm-coordinator.js';
import { YouTubeService } from './services/youtube-service.js';
import { VisionAnalyzer } from './services/vision-analyzer.js';
import { AgentDBManager } from './services/agentdb-manager.js';
import { logger } from './utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

interface AnalysisOptions {
  videoUrl: string;
  analysisType?: 'full' | 'quick' | 'frames-only' | 'text-only';
  maxFrames?: number;
  saveFrames?: boolean;
}

export class YouTubeVisionBot {
  private swarm: SwarmCoordinator;
  private youtube: YouTubeService;
  private vision: VisionAnalyzer;
  private db: AgentDBManager;

  constructor() {
    this.swarm = new SwarmCoordinator();
    this.youtube = new YouTubeService();
    this.vision = new VisionAnalyzer();
    this.db = new AgentDBManager();
  }

  async initialize(): Promise<void> {
    logger.info('🚀 Initializing YouTube Vision Bot...');

    // Initialize AgentDB swarm database
    await this.db.initialize('./youtube-vision-memory.db');
    logger.info('✅ AgentDB initialized');

    // Initialize swarm coordination
    await this.swarm.initialize(this.db);
    logger.info('✅ Swarm coordinator initialized');

    // Initialize vision analyzer
    await this.vision.initialize();
    logger.info('✅ Computer vision initialized');

    logger.info('🎉 YouTube Vision Bot ready!');
  }

  async analyzeVideo(options: AnalysisOptions): Promise<any> {
    const { videoUrl, analysisType = 'full', maxFrames = 30, saveFrames = false } = options;

    logger.info(`🎬 Starting analysis for: ${videoUrl}`);
    logger.info(`📊 Analysis type: ${analysisType}`);

    try {
      // Step 1: Fetch video metadata and transcript
      const videoInfo = await this.youtube.getVideoInfo(videoUrl);
      const transcript = await this.youtube.getTranscript(videoUrl);

      logger.info(`📝 Video: ${videoInfo.title}`);
      logger.info(`⏱️  Duration: ${videoInfo.duration}s`);

      // Step 2: Spawn agent swarm for parallel analysis
      const swarmTaskId = await this.swarm.spawnAnalysisSwarm({
        videoId: videoInfo.id,
        analysisType,
        maxFrames,
      });

      // Step 3: Extract and analyze frames
      let frameAnalysis = null;
      if (analysisType === 'full' || analysisType === 'frames-only') {
        const frames = await this.youtube.extractFrames(videoUrl, maxFrames, saveFrames);
        logger.info(`🖼️  Extracted ${frames.length} frames`);

        // Parallel frame analysis using swarm
        frameAnalysis = await this.vision.analyzeFrames(frames, this.swarm);
        logger.info('✅ Frame analysis complete');
      }

      // Step 4: Analyze transcript with NLP
      let textAnalysis = null;
      if (analysisType === 'full' || analysisType === 'text-only') {
        textAnalysis = await this.vision.analyzeText(transcript);
        logger.info('✅ Text analysis complete');
      }

      // Step 5: Combine results and store in AgentDB
      const fullAnalysis = {
        videoInfo,
        transcript,
        frameAnalysis,
        textAnalysis,
        swarmTaskId,
        timestamp: new Date().toISOString(),
      };

      // Store analysis in AgentDB for future pattern learning
      await this.db.storeAnalysis(videoInfo.id, fullAnalysis);
      logger.info('💾 Analysis stored in AgentDB');

      // Step 6: Generate insights using swarm intelligence
      const insights = await this.swarm.generateInsights(fullAnalysis);
      logger.info('🧠 Swarm insights generated');

      return {
        ...fullAnalysis,
        insights,
      };

    } catch (error) {
      logger.error(`❌ Analysis failed: ${error}`);
      throw error;
    }
  }

  async queryPastAnalyses(query: string, limit: number = 5): Promise<any[]> {
    return this.db.searchAnalyses(query, limit);
  }

  async shutdown(): Promise<void> {
    logger.info('🛑 Shutting down YouTube Vision Bot...');
    await this.swarm.shutdown();
    await this.db.close();
    logger.info('👋 Goodbye!');
  }
}

// CLI usage
async function main() {
  const bot = new YouTubeVisionBot();

  try {
    await bot.initialize();

    // Example: Analyze a video
    const videoUrl = process.argv[2] || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    const results = await bot.analyzeVideo({
      videoUrl,
      analysisType: 'full',
      maxFrames: 30,
      saveFrames: true,
    });

    console.log('\n📊 Analysis Results:');
    console.log(JSON.stringify(results, null, 2));

    await bot.shutdown();
  } catch (error) {
    logger.error(`Fatal error: ${error}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default YouTubeVisionBot;

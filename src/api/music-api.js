/**
 * Music Framework REST API
 * Provides HTTP endpoints for music agent interactions
 */

const express = require('express');
const { MusicAgentDB } = require('../agentdb/music-db');
const { PatternLearningAgent } = require('../agents/pattern-learning-agent');
const { BeatCoordinatorAgent } = require('../agents/beat-coordinator-agent');
const { MelodyAgent } = require('../agents/melody-agent');
const { TeacherAgent } = require('../agents/teacher-agent');
const { AgentFleetCoordinator } = require('../fleet/agent-coordinator');

class MusicAPI {
  constructor(config = {}) {
    this.app = express();
    this.port = config.port || 3000;
    this.db = null;
    this.agents = {};
    this.coordinator = null;

    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      next();
    });

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`📥 ${req.method} ${req.path}`);
      next();
    });

    // Error handling
    this.app.use((err, req, res, next) => {
      console.error('❌ API Error:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    });
  }

  /**
   * Initialize database and agents
   */
  async initialize() {
    try {
      // Initialize AgentDB
      this.db = new MusicAgentDB({
        dbPath: process.env.MUSIC_DB_PATH || './data/music-agentdb'
      });
      await this.db.initialize();

      // Initialize agents
      this.agents.patternLearning = new PatternLearningAgent(this.db);
      this.agents.beatCoordinator = new BeatCoordinatorAgent(this.db);
      this.agents.melody = new MelodyAgent(this.db);
      this.agents.teacher = new TeacherAgent(this.db);

      // Initialize fleet coordinator
      this.coordinator = new AgentFleetCoordinator(this.db);

      // Register agents with coordinator
      this.coordinator.registerAgent('pattern-learning-agent', this.agents.patternLearning, ['pattern_recommendation', 'music_creation']);
      this.coordinator.registerAgent('beat-coordinator-agent', this.agents.beatCoordinator, ['beat_suggestion', 'music_creation']);
      this.coordinator.registerAgent('melody-agent', this.agents.melody, ['melody_generation', 'music_creation']);
      this.coordinator.registerAgent('teacher-agent', this.agents.teacher, ['student_assessment', 'learning_path']);

      console.log('✅ Music API initialized successfully');

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Music API:', error);
      throw error;
    }
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    });

    // Fleet status
    this.app.get('/fleet/status', (req, res) => {
      const status = this.coordinator.getFleetStatus();
      const stats = this.coordinator.getStatistics();

      res.json({
        success: true,
        fleet: status,
        statistics: stats
      });
    });

    // ===== Pattern Learning Agent Routes =====

    // Get personalized recommendations
    this.app.get('/patterns/recommendations/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const { limit = 5 } = req.query;

        const result = await this.agents.patternLearning.getRecommendations(userId, {
          limit: parseInt(limit)
        });

        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Learn from user creation
    this.app.post('/patterns/learn', async (req, res) => {
      try {
        const { userId, creation } = req.body;

        if (!userId || !creation) {
          return res.status(400).json({
            success: false,
            error: 'userId and creation are required'
          });
        }

        const result = await this.agents.patternLearning.learnFromCreation(userId, creation);

        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Rate a pattern
    this.app.post('/patterns/rate', async (req, res) => {
      try {
        const { userId, patternId, rating, feedback } = req.body;

        if (!userId || !patternId || rating === undefined) {
          return res.status(400).json({
            success: false,
            error: 'userId, patternId, and rating are required'
          });
        }

        const result = await this.agents.patternLearning.ratePattern(
          userId,
          patternId,
          rating,
          feedback
        );

        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Find similar styles
    this.app.post('/patterns/similar', async (req, res) => {
      try {
        const { query, limit = 10 } = req.body;

        if (!query) {
          return res.status(400).json({
            success: false,
            error: 'query is required'
          });
        }

        const result = await this.agents.patternLearning.findSimilarStyles(query, limit);

        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ===== Beat Coordinator Agent Routes =====

    // Get beat suggestions
    this.app.post('/beats/suggest', async (req, res) => {
      try {
        const context = req.body;

        const result = await this.agents.beatCoordinator.suggestArrangement(context);

        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Learn beat combination
    this.app.post('/beats/learn', async (req, res) => {
      try {
        const { beatData, performance } = req.body;

        if (!beatData) {
          return res.status(400).json({
            success: false,
            error: 'beatData is required'
          });
        }

        const result = await this.agents.beatCoordinator.learnBeatCombination(
          beatData,
          performance || {}
        );

        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get beat templates
    this.app.get('/beats/templates/:style', async (req, res) => {
      try {
        const { style } = req.params;
        const { limit = 10 } = req.query;

        const result = await this.agents.beatCoordinator.getBeatTemplates(
          style,
          parseInt(limit)
        );

        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Update beat performance
    this.app.put('/beats/:beatId/performance', async (req, res) => {
      try {
        const { beatId } = req.params;
        const { performance } = req.body;

        if (!performance || performance.rating === undefined) {
          return res.status(400).json({
            success: false,
            error: 'performance.rating is required'
          });
        }

        const result = await this.agents.beatCoordinator.updateBeatPerformance(
          beatId,
          performance
        );

        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ===== Melody Agent Routes =====

    // Generate complementary melody
    this.app.post('/melody/generate', async (req, res) => {
      try {
        const { existingTrack, options } = req.body;

        const result = await this.agents.melody.generateComplementaryMelody(
          existingTrack,
          options || {}
        );

        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Suggest chord progression
    this.app.post('/melody/chord-progression', async (req, res) => {
      try {
        const context = req.body;

        const result = this.agents.melody.suggestChordProgression(context);

        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Learn melody
    this.app.post('/melody/learn', async (req, res) => {
      try {
        const { melodyData, performance } = req.body;

        if (!melodyData) {
          return res.status(400).json({
            success: false,
            error: 'melodyData is required'
          });
        }

        const result = await this.agents.melody.learnMelody(
          melodyData,
          performance || {}
        );

        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ===== Teacher Agent Routes =====

    // Assess student performance
    this.app.post('/student/assess', async (req, res) => {
      try {
        const { userId, taskData } = req.body;

        if (!userId || !taskData) {
          return res.status(400).json({
            success: false,
            error: 'userId and taskData are required'
          });
        }

        const result = await this.agents.teacher.assessPerformance(userId, taskData);

        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get student report
    this.app.get('/student/:userId/report', async (req, res) => {
      try {
        const { userId } = req.params;

        const result = await this.agents.teacher.getStudentReport(userId);

        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Get learning path suggestions
    this.app.get('/student/:userId/next-steps', async (req, res) => {
      try {
        const { userId } = req.params;
        const { skill, level } = req.query;

        if (!skill || !level) {
          return res.status(400).json({
            success: false,
            error: 'skill and level query parameters are required'
          });
        }

        const result = await this.agents.teacher.suggestNextSteps(
          userId,
          skill,
          parseFloat(level)
        );

        res.json({
          success: true,
          nextSteps: result
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ===== Multi-Agent Coordination Routes =====

    // Create music with multiple agents
    this.app.post('/create/music', async (req, res) => {
      try {
        const { userId, context } = req.body;

        if (!userId) {
          return res.status(400).json({
            success: false,
            error: 'userId is required'
          });
        }

        // Route to multiple agents
        const result = await this.coordinator.routeRequest(
          'music_creation',
          {
            method: 'createMusic',
            params: { userId, context }
          },
          {
            multiAgent: true,
            priority: 'high'
          }
        );

        res.json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Resolve conflicting suggestions
    this.app.post('/resolve/conflict', async (req, res) => {
      try {
        const { suggestions, context } = req.body;

        if (!suggestions || !Array.isArray(suggestions)) {
          return res.status(400).json({
            success: false,
            error: 'suggestions array is required'
          });
        }

        const result = await this.coordinator.resolveConflict(suggestions, context || {});

        res.json({
          success: true,
          resolution: result
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // ===== Agent Status Routes =====

    this.app.get('/agents/status', async (req, res) => {
      try {
        const statuses = await Promise.all([
          this.agents.patternLearning.getStatus(),
          this.agents.beatCoordinator.getStatus(),
          this.agents.melody.getStatus(),
          this.agents.teacher.getStatus()
        ]);

        res.json({
          success: true,
          agents: statuses
        });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  /**
   * Start API server
   */
  async start() {
    await this.initialize();

    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`🚀 Music API listening on port ${this.port}`);
        resolve(this.server);
      });
    });
  }

  /**
   * Stop API server
   */
  async stop() {
    if (this.server) {
      await new Promise((resolve) => {
        this.server.close(resolve);
      });

      if (this.db) {
        await this.db.close();
      }

      console.log('✅ Music API stopped');
    }
  }
}

module.exports = { MusicAPI };

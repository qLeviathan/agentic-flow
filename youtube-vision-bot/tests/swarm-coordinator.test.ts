import { SwarmCoordinator } from '../src/agents/swarm-coordinator';
import { AgentDBManager } from '../src/services/agentdb-manager';

describe('SwarmCoordinator', () => {
  let coordinator: SwarmCoordinator;
  let db: AgentDBManager;

  beforeEach(async () => {
    coordinator = new SwarmCoordinator();
    db = new AgentDBManager();
    await db.initialize('./test-memory.db');
    await coordinator.initialize(db);
  });

  afterEach(async () => {
    await coordinator.shutdown();
    await db.close();
  });

  describe('initialize', () => {
    it('should spawn agents on initialization', async () => {
      const status = coordinator.getSwarmStatus();

      expect(status.agents.total).toBeGreaterThan(0);
      expect(status.agents.idle).toBe(status.agents.total);
      expect(status.agents.busy).toBe(0);
    });
  });

  describe('spawnAnalysisSwarm', () => {
    it('should create swarm task', async () => {
      const taskId = await coordinator.spawnAnalysisSwarm({
        videoId: 'test-video',
        analysisType: 'full',
        maxFrames: 30,
      });

      expect(taskId).toBeTruthy();
      expect(taskId).toContain('swarm-test-video');
    });
  });

  describe('distributeTask', () => {
    it('should distribute tasks across agents', async () => {
      const mockTasks = [
        { taskId: 'task-1', data: { index: 0 } },
        { taskId: 'task-2', data: { index: 1 } },
        { taskId: 'task-3', data: { index: 2 } },
      ];

      // Mock analyzer
      const mockAnalyzer = {
        analyzeFrame: jest.fn().mockResolvedValue({ success: true }),
      };

      mockTasks.forEach((task) => {
        task['analyzer'] = mockAnalyzer;
      });

      const results = await coordinator.distributeTask('test', mockTasks);

      expect(results.length).toBe(mockTasks.length);
      expect(mockAnalyzer.analyzeFrame).toHaveBeenCalledTimes(mockTasks.length);
    });
  });

  describe('generateInsights', () => {
    it('should generate insights from analysis', async () => {
      const mockAnalysis = {
        videoInfo: {
          id: 'test-video',
          title: 'Test Video',
          duration: 120,
        },
        frameAnalysis: [
          {
            frameIndex: 0,
            timestamp: 0,
            faces: [{ confidence: 0.9, boundingBox: {} }],
            text: [],
            objects: [],
          },
        ],
        textAnalysis: {
          keywords: ['test', 'video', 'analysis'],
          sentiment: 'positive',
        },
      };

      const insights = await coordinator.generateInsights(mockAnalysis);

      expect(insights).toBeDefined();
      expect(insights.videoSummary).toBeTruthy();
      expect(insights.keyMoments).toBeDefined();
      expect(insights.visualPatterns).toBeDefined();
      expect(insights.recommendations).toBeDefined();
    });
  });

  describe('getSwarmStatus', () => {
    it('should return swarm status', () => {
      const status = coordinator.getSwarmStatus();

      expect(status.agents).toBeDefined();
      expect(status.agents.total).toBeGreaterThan(0);
      expect(status.tasks).toBeDefined();
    });
  });
});

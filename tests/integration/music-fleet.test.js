/**
 * Integration Tests for Music Agent Fleet
 */

const { MusicAgentDB } = require('../../src/agentdb/music-db');
const { PatternLearningAgent } = require('../../src/agents/pattern-learning-agent');
const { BeatCoordinatorAgent } = require('../../src/agents/beat-coordinator-agent');
const { MelodyAgent } = require('../../src/agents/melody-agent');
const { TeacherAgent } = require('../../src/agents/teacher-agent');
const { AgentFleetCoordinator } = require('../../src/fleet/agent-coordinator');

describe('Music Agent Fleet Integration Tests', () => {
  let db;
  let agents;
  let coordinator;

  beforeAll(async () => {
    // Initialize database with test configuration
    db = new MusicAgentDB({
      dbPath: './test-data/music-agentdb-test',
      embeddingDimension: 384
    });

    await db.initialize();

    // Initialize agents
    agents = {
      patternLearning: new PatternLearningAgent(db),
      beatCoordinator: new BeatCoordinatorAgent(db),
      melody: new MelodyAgent(db),
      teacher: new TeacherAgent(db)
    };

    // Initialize coordinator
    coordinator = new AgentFleetCoordinator(db);

    // Register agents
    coordinator.registerAgent('pattern-learning-agent', agents.patternLearning, ['pattern_recommendation']);
    coordinator.registerAgent('beat-coordinator-agent', agents.beatCoordinator, ['beat_suggestion']);
    coordinator.registerAgent('melody-agent', agents.melody, ['melody_generation']);
    coordinator.registerAgent('teacher-agent', agents.teacher, ['student_assessment']);
  });

  afterAll(async () => {
    await db.close();
  });

  describe('AgentDB Initialization', () => {
    test('should initialize with correct collections', async () => {
      expect(db.db).toBeDefined();
      expect(db.collections.patterns).toBe('music_patterns');
      expect(db.collections.preferences).toBe('user_preferences');
      expect(db.collections.beats).toBe('beat_templates');
      expect(db.collections.melodies).toBe('melody_progressions');
      expect(db.collections.progress).toBe('learning_progress');
    });

    test('should store and retrieve music pattern', async () => {
      const pattern = {
        id: 'test_pattern_1',
        genre: 'rock',
        mood: 'energetic',
        tempo: 120,
        key: 'C',
        timeSignature: '4/4',
        complexity: 5,
        tags: ['beginner', 'classic']
      };

      const result = await db.storePattern(pattern);
      expect(result).toBeDefined();

      // Find similar patterns
      const similar = await db.findSimilarPatterns({
        genre: 'rock',
        mood: 'energetic'
      }, 5);

      expect(similar.length).toBeGreaterThan(0);
      expect(similar[0].genre).toBe('rock');
    });
  });

  describe('Pattern Learning Agent', () => {
    const userId = 'test_user_1';

    test('should learn from user creation', async () => {
      const creation = {
        genre: 'electronic',
        mood: 'chill',
        tempo: 95,
        key: 'Am',
        timeSignature: '4/4',
        tracks: [{ name: 'Bass' }, { name: 'Synth' }],
        sessionTime: 300
      };

      const result = await agents.patternLearning.learnFromCreation(userId, creation);

      expect(result.success).toBe(true);
      expect(result.patternId).toBeDefined();
    });

    test('should provide recommendations for user', async () => {
      const result = await agents.patternLearning.getRecommendations(userId, { limit: 3 });

      expect(result.success).toBe(true);
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('should rate pattern and store preference', async () => {
      const result = await agents.patternLearning.ratePattern(
        userId,
        'test_pattern_1',
        5,
        { comment: 'Great pattern!' }
      );

      expect(result.success).toBe(true);
    });

    test('should find similar styles', async () => {
      const result = await agents.patternLearning.findSimilarStyles({
        genre: 'rock',
        mood: 'upbeat'
      }, 5);

      expect(result.success).toBe(true);
      expect(result.patterns).toBeDefined();
    });

    test('should build user profile', async () => {
      const recommendations = await agents.patternLearning.getRecommendations(userId);

      expect(recommendations.userProfile).toBeDefined();
      if (recommendations.userProfile) {
        expect(recommendations.userProfile.totalCreations).toBeGreaterThan(0);
      }
    });
  });

  describe('Beat Coordinator Agent', () => {
    test('should suggest beat arrangements', async () => {
      const context = {
        genre: 'rock',
        mood: 'energetic',
        tempo: 120,
        complexity: 5
      };

      const result = await agents.beatCoordinator.suggestArrangement(context);

      expect(result.success).toBe(true);
      expect(result.arrangements).toBeDefined();
      expect(result.arrangements.length).toBeGreaterThan(0);
      expect(result.arrangements[0].pattern).toBeDefined();
    });

    test('should learn beat combination', async () => {
      const beatData = {
        name: 'Custom Rock Beat',
        pattern: [1, 0, 1, 0, 1, 0, 1, 0],
        style: 'rock',
        complexity: 4,
        tempo: 120,
        timeSignature: '4/4'
      };

      const performance = {
        rating: 0.8,
        userRating: 4,
        completionRate: 1.0
      };

      const result = await agents.beatCoordinator.learnBeatCombination(beatData, performance);

      expect(result.success).toBe(true);
      expect(result.beatId).toBeDefined();
    });

    test('should get beat templates by style', async () => {
      const result = await agents.beatCoordinator.getBeatTemplates('rock', 5);

      expect(result.success).toBe(true);
      expect(result.templates).toBeDefined();
    });

    test('should analyze beat complexity', () => {
      const pattern = [1, 0, 0, 1, 1, 0, 1, 0]; // Syncopated pattern

      const metrics = agents.beatCoordinator.analyzeBeatComplexity(pattern);

      expect(metrics.density).toBeDefined();
      expect(metrics.syncopation).toBeDefined();
      expect(metrics.variation).toBeDefined();
      expect(metrics.complexity).toBeGreaterThan(0);
      expect(metrics.complexity).toBeLessThanOrEqual(10);
    });
  });

  describe('Melody Agent', () => {
    test('should generate complementary melody', async () => {
      const existingTrack = {
        notes: [
          { note: 'C', midiNote: 60, duration: 1.0 },
          { note: 'E', midiNote: 64, duration: 1.0 }
        ]
      };

      const options = {
        key: 'C',
        scale: 'major',
        length: 8,
        complexity: 5,
        harmonic_role: 'harmony'
      };

      const result = await agents.melody.generateComplementaryMelody(existingTrack, options);

      expect(result.success).toBe(true);
      expect(result.melody).toBeDefined();
      expect(result.melody.length).toBe(8);
      expect(result.metadata.key).toBe('C');
      expect(result.metadata.scale).toBe('major');
    });

    test('should suggest chord progression', () => {
      const context = {
        genre: 'pop',
        mood: 'uplifting',
        key: 'C',
        length: 4
      };

      const result = agents.melody.suggestChordProgression(context);

      expect(result.success).toBe(true);
      expect(result.progression).toBeDefined();
      expect(result.progression.chords).toBeDefined();
      expect(result.progression.key).toBe('C');
    });

    test('should learn melody', async () => {
      const melodyData = {
        notes: [
          { note: 'C', midiNote: 60, duration: 1.0 },
          { note: 'D', midiNote: 62, duration: 1.0 },
          { note: 'E', midiNote: 64, duration: 1.0 },
          { note: 'F', midiNote: 65, duration: 1.0 }
        ],
        scale: 'major',
        key: 'C',
        progression: [1, 4, 5, 1],
        harmonicFunction: 'melody'
      };

      const performance = {
        rating: 0.9
      };

      const result = await agents.melody.learnMelody(melodyData, performance);

      expect(result.success).toBe(true);
      expect(result.melodyId).toBeDefined();
    });

    test('should get scale notes correctly', () => {
      const scaleNotes = agents.melody.getScaleNotes('C', 'major');

      expect(scaleNotes).toBeDefined();
      expect(scaleNotes.length).toBe(7);
      expect(scaleNotes[0].note).toBe('C');
      expect(scaleNotes[0].midiNote).toBe(60);
    });

    test('should analyze melody complexity', () => {
      const melody = [
        { midiNote: 60 }, // C
        { midiNote: 64 }, // E
        { midiNote: 67 }, // G
        { midiNote: 72 }, // C (octave)
        { midiNote: 60 }  // C
      ];

      const complexity = agents.melody.analyzeMelodyComplexity(melody);

      expect(complexity).toBeGreaterThan(0);
      expect(complexity).toBeLessThanOrEqual(10);
    });
  });

  describe('Teacher Agent', () => {
    const studentId = 'test_student_1';

    test('should assess student performance', async () => {
      const taskData = {
        skill: 'rhythm_basic',
        taskId: 'lesson_quarter_notes',
        score: 0.85,
        timeSpent: 240,
        mistakes: [
          { type: 'timing', severity: 'minor' }
        ],
        completion: 1.0
      };

      const result = await agents.teacher.assessPerformance(studentId, taskData);

      expect(result.success).toBe(true);
      expect(result.assessment).toBeDefined();
      expect(result.assessment.accuracy).toBeGreaterThan(0);
      expect(result.assessment.newLevel).toBeGreaterThan(result.assessment.previousLevel);
      expect(result.assessment.feedback).toBeDefined();
      expect(result.assessment.nextSteps).toBeDefined();
    });

    test('should generate student report', async () => {
      const result = await agents.teacher.getStudentReport(studentId);

      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();
      expect(result.report.userId).toBe(studentId);
      expect(result.report.skills).toBeDefined();
    });

    test('should suggest next steps', async () => {
      const result = await agents.teacher.suggestNextSteps(studentId, 'rhythm_basic', 45);

      expect(Array.isArray(result)).toBe(true);
    });

    test('should adapt difficulty based on performance', () => {
      const newDifficulty = agents.teacher.adaptDifficulty(5, 95);
      expect(newDifficulty).toBeGreaterThan(5);

      const reducedDifficulty = agents.teacher.adaptDifficulty(5, 55);
      expect(reducedDifficulty).toBeLessThan(5);

      const maintainedDifficulty = agents.teacher.adaptDifficulty(5, 75);
      expect(maintainedDifficulty).toBe(5);
    });
  });

  describe('Fleet Coordination', () => {
    test('should register all agents', () => {
      const status = coordinator.getFleetStatus();

      expect(status.totalAgents).toBe(4);
      expect(status.agents).toBeDefined();
      expect(status.agents.length).toBe(4);
    });

    test('should route request to appropriate agent', async () => {
      const result = await coordinator.routeRequest(
        'pattern_recommendation',
        {
          method: 'getRecommendations',
          params: ['test_user_1', { limit: 3 }]
        },
        { priority: 'high' }
      );

      expect(result.success).toBe(true);
      expect(result.requestId).toBeDefined();
      expect(result.result).toBeDefined();
    });

    test('should execute multi-agent request', async () => {
      const result = await coordinator.routeRequest(
        'music_creation',
        {
          method: 'getStatus',
          params: []
        },
        {
          multiAgent: true,
          priority: 'medium'
        }
      );

      expect(result.success).toBe(true);
      expect(result.result.allResults).toBeDefined();
    });

    test('should resolve conflicts by confidence', async () => {
      const suggestions = [
        { id: 1, value: 'suggestion_1', confidence: 0.6 },
        { id: 2, value: 'suggestion_2', confidence: 0.9 },
        { id: 3, value: 'suggestion_3', confidence: 0.7 }
      ];

      const result = await coordinator.resolveConflict(suggestions, {
        strategy: 'confidence'
      });

      expect(result.winner).toBeDefined();
      expect(result.winner.confidence).toBe(0.9);
      expect(result.method).toBe('confidence');
    });

    test('should resolve conflicts by voting', async () => {
      const suggestions = [
        { id: 1, value: 'option_a' },
        { id: 2, value: 'option_a' },
        { id: 3, value: 'option_b' }
      ];

      const result = await coordinator.resolveConflict(suggestions, {
        strategy: 'voting'
      });

      expect(result.winner).toBeDefined();
      expect(result.votes).toBe(2);
      expect(result.method).toBe('voting');
    });

    test('should get fleet statistics', () => {
      const stats = coordinator.getStatistics();

      expect(stats.totalRequests).toBeGreaterThan(0);
      expect(stats.successRate).toBeDefined();
      expect(stats.averageResponseTime).toBeDefined();
    });

    test('should handle agent status updates', async () => {
      const status = await agents.patternLearning.getStatus();

      expect(status.agentId).toBe('pattern-learning-agent');
      expect(status.status).toBe('active');
      expect(status.statistics).toBeDefined();
    });
  });

  describe('End-to-End User Journey', () => {
    const journeyUserId = 'journey_user_1';

    test('Complete user learning journey', async () => {
      // 1. Student starts learning
      const assessment1 = await agents.teacher.assessPerformance(journeyUserId, {
        skill: 'rhythm_basic',
        taskId: 'lesson_1',
        score: 0.7,
        timeSpent: 300,
        mistakes: [],
        completion: 1.0
      });

      expect(assessment1.success).toBe(true);

      // 2. Student creates music
      const creation = await agents.patternLearning.learnFromCreation(journeyUserId, {
        genre: 'electronic',
        mood: 'upbeat',
        tempo: 128,
        key: 'Am',
        timeSignature: '4/4',
        tracks: [{ name: 'Kick' }]
      });

      expect(creation.success).toBe(true);

      // 3. Get personalized recommendations
      const recommendations = await agents.patternLearning.getRecommendations(journeyUserId, {
        limit: 5
      });

      expect(recommendations.success).toBe(true);
      expect(recommendations.recommendations.length).toBeGreaterThan(0);

      // 4. Generate complementary beat
      const beat = await agents.beatCoordinator.suggestArrangement({
        genre: 'electronic',
        tempo: 128,
        complexity: 5
      });

      expect(beat.success).toBe(true);

      // 5. Generate melody
      const melody = await agents.melody.generateComplementaryMelody(null, {
        key: 'Am',
        scale: 'minor',
        length: 16,
        complexity: 5
      });

      expect(melody.success).toBe(true);

      // 6. Assess improved performance
      const assessment2 = await agents.teacher.assessPerformance(journeyUserId, {
        skill: 'rhythm_basic',
        taskId: 'lesson_2',
        score: 0.9,
        timeSpent: 200,
        mistakes: [],
        completion: 1.0
      });

      expect(assessment2.success).toBe(true);
      expect(assessment2.assessment.newLevel).toBeGreaterThan(assessment1.assessment.newLevel);

      // 7. Get final report
      const report = await agents.teacher.getStudentReport(journeyUserId);

      expect(report.success).toBe(true);
      expect(report.report.skills.length).toBeGreaterThan(0);
      expect(report.report.totalLessonsCompleted).toBe(2);
    });
  });
});

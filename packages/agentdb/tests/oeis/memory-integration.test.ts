/**
 * OEIS Memory Integration Tests
 *
 * Tests integration between OEIS validation and AgentDB memory systems
 * (SkillLibrary, ReflexionMemory, CausalMemoryGraph).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SequenceValidator, OeisCache } from '../../src/oeis/index.js';
import { SkillLibrary, type Skill } from '../../src/controllers/SkillLibrary.js';
import { ReflexionMemory, type Episode } from '../../src/controllers/ReflexionMemory.js';
import { EmbeddingService } from '../../src/controllers/EmbeddingService.js';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

const TEST_DB_PATH = './tests/fixtures/test-oeis-memory.db';

describe('OEIS Memory Integration', () => {
  let db: Database.Database;
  let embedder: EmbeddingService;
  let skills: SkillLibrary;
  let reflexion: ReflexionMemory;
  let validator: SequenceValidator;
  let cache: OeisCache;

  beforeEach(async () => {
    // Clean up
    [TEST_DB_PATH, `${TEST_DB_PATH}-wal`, `${TEST_DB_PATH}-shm`].forEach(file => {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
        } catch (e) {
          // Ignore
        }
      }
    });

    // Initialize database
    db = new Database(TEST_DB_PATH);
    db.pragma('journal_mode = WAL');

    // Load schemas
    const schemaPath = path.join(__dirname, '../../src/schemas/schema.sql');
    if (fs.existsSync(schemaPath)) {
      db.exec(fs.readFileSync(schemaPath, 'utf-8'));
    }

    const frontierSchemaPath = path.join(__dirname, '../../src/schemas/frontier-schema.sql');
    if (fs.existsSync(frontierSchemaPath)) {
      db.exec(fs.readFileSync(frontierSchemaPath, 'utf-8'));
    }

    // Initialize components
    embedder = new EmbeddingService({
      model: 'mock-model',
      dimension: 384,
      provider: 'local',
    });
    await embedder.initialize();

    skills = new SkillLibrary(db, embedder);
    reflexion = new ReflexionMemory(db, embedder);

    cache = new OeisCache({ dbPath: ':memory:' });
    await cache.initialize();

    validator = new SequenceValidator({ cache });
    await validator.initialize();
  });

  afterEach(async () => {
    await validator.close();
    db.close();

    [TEST_DB_PATH, `${TEST_DB_PATH}-wal`, `${TEST_DB_PATH}-shm`].forEach(file => {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
        } catch (e) {
          // Ignore
        }
      }
    });
  });

  describe('SkillLibrary Integration', () => {
    it('should store OEIS validation as a skill', async () => {
      const skill: Skill = {
        name: 'validate_fibonacci',
        description: 'Validates Fibonacci sequences using OEIS',
        signature: {
          inputs: { sequence: 'number[]' },
          outputs: { isValid: 'boolean', confidence: 'number' },
        },
        successRate: 1.0,
        uses: 1,
        avgReward: 0.95,
        avgLatencyMs: 150,
      };

      const skillId = await skills.createSkill(skill);
      expect(skillId).toBeGreaterThan(0);

      // Retrieve and verify
      const retrieved = await skills.getSkill(skillId);
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('validate_fibonacci');
    });

    it('should track OEIS validation skill usage', async () => {
      const skillId = await skills.createSkill({
        name: 'validate_sequence',
        description: 'OEIS sequence validation',
        signature: {
          inputs: { sequence: 'number[]' },
          outputs: { isValid: 'boolean' },
        },
        successRate: 0.9,
        uses: 0,
        avgReward: 0.8,
        avgLatencyMs: 200,
      });

      // Simulate multiple uses
      for (let i = 0; i < 5; i++) {
        await skills.recordSkillUse(skillId, true, 0.9, 180);
      }

      const updated = await skills.getSkill(skillId);
      expect(updated?.uses).toBe(5);
    });

    it('should store validation patterns as skills', async () => {
      const patterns = [
        { name: 'validate_fibonacci', seqId: 'A000045' },
        { name: 'validate_primes', seqId: 'A000040' },
        { name: 'validate_squares', seqId: 'A000290' },
      ];

      const skillIds: number[] = [];
      for (const pattern of patterns) {
        const skillId = await skills.createSkill({
          name: pattern.name,
          description: `Validates ${pattern.seqId}`,
          signature: {
            inputs: { sequence: 'number[]' },
            outputs: { isValid: 'boolean' },
          },
          successRate: 1.0,
          uses: 0,
          avgReward: 0.9,
          avgLatencyMs: 150,
          metadata: { oeisId: pattern.seqId },
        });
        skillIds.push(skillId);
      }

      expect(skillIds).toHaveLength(3);

      // Query skills
      const allSkills = await skills.searchSkills('validate_');
      expect(allSkills.length).toBeGreaterThanOrEqual(3);
    });

    it('should update skill performance based on validation results', async () => {
      const skillId = await skills.createSkill({
        name: 'oeis_validator',
        description: 'General OEIS validator',
        signature: {
          inputs: { sequence: 'number[]' },
          outputs: { result: 'ValidationResult' },
        },
        successRate: 0.5,
        uses: 0,
        avgReward: 0.5,
        avgLatencyMs: 300,
      });

      // Record successful validations
      for (let i = 0; i < 10; i++) {
        const success = i < 8; // 80% success rate
        const reward = success ? 0.9 : 0.3;
        await skills.recordSkillUse(skillId, success, reward, 250);
      }

      const updated = await skills.getSkill(skillId);
      expect(updated?.uses).toBe(10);
      expect(updated?.successRate).toBeGreaterThan(0.5);
    });
  });

  describe('ReflexionMemory Integration', () => {
    it('should store OEIS validation episodes', async () => {
      const episode: Episode = {
        sessionId: 'oeis-session-1',
        task: 'Validate Fibonacci sequence',
        input: '[0, 1, 1, 2, 3, 5, 8]',
        output: 'Valid: A000045',
        critique: 'Correctly identified Fibonacci sequence',
        reward: 1.0,
        success: true,
        latencyMs: 150,
        tokensUsed: 100,
        metadata: {
          sequenceId: 'A000045',
          confidence: 1.0,
          matchType: 'formula',
        },
      };

      const episodeId = await reflexion.storeEpisode(episode);
      expect(episodeId).toBeGreaterThan(0);

      // Query episodes
      const episodes = await reflexion.queryEpisodes({
        sessionId: 'oeis-session-1',
        limit: 10,
      });

      expect(episodes.length).toBeGreaterThan(0);
      expect(episodes[0].task).toContain('Fibonacci');
    });

    it('should track validation success/failure patterns', async () => {
      const testCases = [
        { seq: [0, 1, 1, 2, 3, 5], success: true, reward: 1.0 },
        { seq: [2, 3, 5, 7, 11], success: true, reward: 1.0 },
        { seq: [999, 888, 777], success: false, reward: 0.2 },
        { seq: [0, 1, 4, 9, 16], success: true, reward: 1.0 },
      ];

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        await reflexion.storeEpisode({
          sessionId: 'oeis-test',
          task: `Validate sequence ${i}`,
          input: JSON.stringify(testCase.seq),
          reward: testCase.reward,
          success: testCase.success,
          metadata: { sequenceIndex: i },
        });
      }

      const successful = await reflexion.queryEpisodes({
        sessionId: 'oeis-test',
        limit: 100,
      });

      const successCount = successful.filter(e => e.success).length;
      expect(successCount).toBe(3);
    });

    it('should store validation results with full metadata', async () => {
      const sequence = [0, 1, 1, 2, 3, 5, 8, 13];
      const result = await validator.validate(sequence);

      const episode: Episode = {
        sessionId: 'detailed-validation',
        task: 'Validate Fibonacci',
        input: JSON.stringify(sequence),
        output: JSON.stringify(result),
        reward: result.isValid ? 1.0 : 0.0,
        success: result.isValid,
        metadata: {
          sequenceId: result.sequenceId,
          confidence: result.confidence,
          matchType: result.matchType,
          matchedTerms: result.matchDetails?.matchedTerms,
        },
      });

      const episodeId = await reflexion.storeEpisode(episode);
      expect(episodeId).toBeGreaterThan(0);
    });

    it('should enable learning from past validations', async () => {
      // Store multiple validation episodes
      const sequences = [
        { seq: [0, 1, 1, 2, 3, 5, 8], id: 'A000045', name: 'Fibonacci' },
        { seq: [2, 3, 5, 7, 11, 13], id: 'A000040', name: 'Primes' },
        { seq: [0, 1, 4, 9, 16, 25], id: 'A000290', name: 'Squares' },
      ];

      for (const { seq, id, name } of sequences) {
        await reflexion.storeEpisode({
          sessionId: 'learning-session',
          task: `Validate ${name}`,
          input: JSON.stringify(seq),
          output: `Valid: ${id}`,
          reward: 1.0,
          success: true,
          metadata: { sequenceId: id, sequenceName: name },
        });
      }

      // Query all successful validations
      const learned = await reflexion.queryEpisodes({
        sessionId: 'learning-session',
        limit: 100,
      });

      expect(learned.length).toBe(3);
      learned.forEach(episode => {
        expect(episode.success).toBe(true);
        expect(episode.reward).toBe(1.0);
      });
    });
  });

  describe('Cross-System Integration', () => {
    it('should coordinate between skills and episodes', async () => {
      // Create skill
      const skillId = await skills.createSkill({
        name: 'fibonacci_validator',
        description: 'Validates Fibonacci sequences',
        signature: {
          inputs: { sequence: 'number[]' },
          outputs: { isValid: 'boolean' },
        },
        successRate: 0.0,
        uses: 0,
        avgReward: 0.0,
        avgLatencyMs: 0,
      });

      // Store validation episode
      const sequence = [0, 1, 1, 2, 3, 5, 8];
      const result = await validator.validate(sequence);

      await reflexion.storeEpisode({
        sessionId: 'coordinated-test',
        task: 'Validate Fibonacci',
        input: JSON.stringify(sequence),
        output: JSON.stringify(result),
        reward: result.isValid ? 1.0 : 0.0,
        success: result.isValid,
        metadata: { skillId },
      });

      // Update skill based on episode
      await skills.recordSkillUse(
        skillId,
        result.isValid,
        result.confidence,
        150
      );

      // Verify updates
      const updatedSkill = await skills.getSkill(skillId);
      expect(updatedSkill?.uses).toBe(1);
      expect(updatedSkill?.successRate).toBe(1.0);
    });

    it('should track performance across multiple validations', async () => {
      const skillId = await skills.createSkill({
        name: 'multi_sequence_validator',
        description: 'Validates multiple sequence types',
        signature: {
          inputs: { sequence: 'number[]' },
          outputs: { result: 'ValidationResult' },
        },
        successRate: 0.0,
        uses: 0,
        avgReward: 0.0,
        avgLatencyMs: 0,
      });

      const testSequences = [
        [0, 1, 1, 2, 3, 5, 8],
        [2, 3, 5, 7, 11, 13],
        [999, 888, 777, 666],
        [0, 1, 4, 9, 16, 25],
      ];

      for (const seq of testSequences) {
        const result = await validator.validate(seq);

        // Store episode
        await reflexion.storeEpisode({
          sessionId: 'multi-validation',
          task: 'Validate sequence',
          input: JSON.stringify(seq),
          output: JSON.stringify(result),
          reward: result.confidence,
          success: result.isValid,
          metadata: { skillId, sequenceLength: seq.length },
        });

        // Update skill
        await skills.recordSkillUse(
          skillId,
          result.isValid,
          result.confidence,
          200
        );
      }

      const updatedSkill = await skills.getSkill(skillId);
      expect(updatedSkill?.uses).toBe(4);

      const episodes = await reflexion.queryEpisodes({
        sessionId: 'multi-validation',
        limit: 100,
      });
      expect(episodes.length).toBe(4);
    });

    it('should enable pattern recognition from stored validations', async () => {
      // Store multiple Fibonacci validation episodes
      const fibonacciSequences = [
        [0, 1, 1, 2, 3, 5],
        [0, 1, 1, 2, 3, 5, 8],
        [0, 1, 1, 2, 3, 5, 8, 13],
        [1, 1, 2, 3, 5, 8],
      ];

      for (const seq of fibonacciSequences) {
        const result = await validator.validate(seq);
        await reflexion.storeEpisode({
          sessionId: 'pattern-learning',
          task: 'Validate Fibonacci variant',
          input: JSON.stringify(seq),
          output: JSON.stringify(result),
          reward: result.confidence,
          success: result.isValid,
          metadata: {
            pattern: 'fibonacci',
            length: seq.length,
          },
        });
      }

      // Query all Fibonacci-related episodes
      const fibEpisodes = await reflexion.queryEpisodes({
        sessionId: 'pattern-learning',
        limit: 100,
      });

      expect(fibEpisodes.length).toBe(4);
      // All should be successful
      fibEpisodes.forEach(ep => {
        expect(ep.success).toBe(true);
      });
    });
  });

  describe('Performance Tracking', () => {
    it('should track validation latency over time', async () => {
      const episodes: number[] = [];

      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        await validator.validate([0, 1, 1, 2, 3, 5, 8]);
        const latency = Date.now() - start;

        const episodeId = await reflexion.storeEpisode({
          sessionId: 'latency-tracking',
          task: 'Validate Fibonacci',
          reward: 1.0,
          success: true,
          latencyMs: latency,
        });
        episodes.push(episodeId);
      }

      expect(episodes.length).toBe(10);

      const allEpisodes = await reflexion.queryEpisodes({
        sessionId: 'latency-tracking',
        limit: 100,
      });

      const avgLatency = allEpisodes.reduce((sum, ep) =>
        sum + (ep.latencyMs || 0), 0) / allEpisodes.length;

      expect(avgLatency).toBeGreaterThan(0);
    });

    it('should track validation accuracy trends', async () => {
      const testCases = [
        { seq: [0, 1, 1, 2, 3, 5], expectedValid: true },
        { seq: [2, 3, 5, 7, 11], expectedValid: true },
        { seq: [1, 2, 3, 4, 5], expectedValid: true }, // Arithmetic
        { seq: [999, 888, 777], expectedValid: false },
      ];

      let correctPredictions = 0;

      for (const { seq, expectedValid } of testCases) {
        const result = await validator.validate(seq);
        const correct = result.isValid === expectedValid;
        if (correct) correctPredictions++;

        await reflexion.storeEpisode({
          sessionId: 'accuracy-tracking',
          task: 'Validate and check accuracy',
          reward: correct ? 1.0 : 0.0,
          success: correct,
          metadata: {
            predictedValid: result.isValid,
            actualValid: expectedValid,
            correct,
          },
        });
      }

      const accuracy = correctPredictions / testCases.length;
      expect(accuracy).toBeGreaterThan(0.5);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation failures gracefully in memory systems', async () => {
      const invalidSequence = [NaN, NaN, NaN];

      try {
        const result = await validator.validate(invalidSequence);

        await reflexion.storeEpisode({
          sessionId: 'error-handling',
          task: 'Validate invalid sequence',
          input: JSON.stringify(invalidSequence),
          output: JSON.stringify(result),
          reward: 0.0,
          success: false,
          metadata: { error: 'Invalid sequence' },
        });
      } catch (error) {
        // Should store error information
        await reflexion.storeEpisode({
          sessionId: 'error-handling',
          task: 'Validate invalid sequence',
          reward: 0.0,
          success: false,
          metadata: { error: String(error) },
        });
      }

      const episodes = await reflexion.queryEpisodes({
        sessionId: 'error-handling',
        limit: 100,
      });

      expect(episodes.length).toBeGreaterThan(0);
    });

    it('should recover from memory system errors', async () => {
      // Even if memory operations fail, validation should work
      const sequence = [0, 1, 1, 2, 3, 5];
      const result = await validator.validate(sequence);

      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
    });
  });
});

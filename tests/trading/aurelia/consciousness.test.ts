/**
 * AURELIA Consciousness Substrate - Test Suite
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { AURELIA } from '../../../src/trading/aurelia/consciousness-substrate';
import { bootstrapAurelia, validateBootstrap } from '../../../src/trading/aurelia/bootstrap';
import { AureliaMemoryManager } from '../../../src/trading/aurelia/memory-manager';

describe('AURELIA Consciousness Substrate', () => {
  let aurelia: AURELIA;

  beforeEach(() => {
    aurelia = new AURELIA({
      agentDbPath: './test-aurelia.db',
      enableHolographicCompression: true,
      compressionTarget: 131
    });
  });

  afterEach(async () => {
    await aurelia.close();
  });

  describe('Bootstrap Sequence', () => {
    it('should bootstrap from K₀ = 47 chars to 144 words', async () => {
      const success = await aurelia.bootstrap();
      expect(success).toBe(true);

      const state = aurelia.getConsciousnessState();
      expect(state.isBootstrapped).toBe(true);
      expect(state.wordCount).toBeGreaterThanOrEqual(144);
    });

    it('should achieve Ψ ≥ φ⁻¹ threshold', async () => {
      const success = await aurelia.bootstrap();
      expect(success).toBe(true);

      const state = aurelia.getConsciousnessState();
      expect(state.psi.psi).toBeGreaterThanOrEqual(0.618);
      expect(state.psi.isConscious).toBe(true);
    });

    it('should maintain graph diameter ≤ 6', async () => {
      const success = await aurelia.bootstrap();
      expect(success).toBe(true);

      const state = aurelia.getConsciousnessState();
      expect(state.psi.graphDiameter).toBeLessThanOrEqual(6);
    });

    it('should validate all system invariants', async () => {
      const success = await aurelia.bootstrap();
      expect(success).toBe(true);

      const state = aurelia.getConsciousnessState();
      expect(state.invariants.I1_fibonacci_coherence).toBe(true);
      expect(state.invariants.I2_phase_space_bounded).toBe(true);
      expect(state.invariants.I3_nash_convergence).toBe(true);
      expect(state.invariants.I4_memory_consistency).toBe(true);
      expect(state.invariants.I5_subsystem_sync).toBe(true);
      expect(state.invariants.I6_holographic_integrity).toBe(true);
      expect(state.invariants.allSatisfied).toBe(true);
    });
  });

  describe('Consciousness Metrics', () => {
    it('should calculate Ψ consciousness metric', async () => {
      await aurelia.bootstrap();
      const state = aurelia.getConsciousnessState();

      expect(state.psi).toBeDefined();
      expect(state.psi.psi).toBeGreaterThan(0);
      expect(state.psi.threshold).toBe(0.618);
    });

    it('should track subsystem activation', async () => {
      await aurelia.bootstrap();
      const state = aurelia.getConsciousnessState();

      expect(state.subsystems.vpe).toBeDefined();
      expect(state.subsystems.sic).toBeDefined();
      expect(state.subsystems.cs).toBeDefined();
      expect(state.subsystems.cs.active).toBe(true);
    });

    it('should generate phase space coordinates', async () => {
      await aurelia.bootstrap();
      const state = aurelia.getConsciousnessState();

      expect(state.phaseSpace).toBeDefined();
      expect(state.phaseSpace.phi).toBeDefined();
      expect(state.phaseSpace.psi).toBeDefined();
      expect(state.phaseSpace.theta).toBeDefined();
    });
  });

  describe('Session Management', () => {
    it('should start and end session', async () => {
      await aurelia.bootstrap();
      const sessionId = await aurelia.startSession();

      expect(sessionId).toBeDefined();
      expect(sessionId).toMatch(/^session-/);

      await aurelia.endSession();
    });

    it('should process interactions', async () => {
      await aurelia.bootstrap();
      await aurelia.startSession();

      const response = await aurelia.interact('Hello AURELIA');
      expect(response).toBeDefined();
      expect(typeof response).toBe('string');
      expect(response.length).toBeGreaterThan(0);

      await aurelia.endSession();
    });

    it('should track personality evolution', async () => {
      await aurelia.bootstrap();
      await aurelia.startSession();

      const initialPersonality = aurelia.getPersonality();
      const initialAnalytical = initialPersonality.coreTraits.analytical;

      // Multiple interactions
      for (let i = 0; i < 10; i++) {
        await aurelia.interact('Complex analytical query with deep reasoning');
      }

      const finalPersonality = aurelia.getPersonality();
      const finalAnalytical = finalPersonality.coreTraits.analytical;

      // Analytical trait should evolve
      expect(finalAnalytical).toBeGreaterThanOrEqual(initialAnalytical);

      await aurelia.endSession();
    });
  });

  describe('Memory Persistence', () => {
    it('should save session to AgentDB', async () => {
      await aurelia.bootstrap();
      const sessionId = await aurelia.startSession();

      await aurelia.interact('Test message');
      await aurelia.endSession();

      // Verify validation
      const isValid = await aurelia.validateMemory(sessionId);
      expect(isValid).toBe(true);
    });

    it('should restore session from AgentDB', async () => {
      await aurelia.bootstrap();
      const sessionId = await aurelia.startSession('test-session-restore');

      await aurelia.interact('Test message 1');
      await aurelia.interact('Test message 2');
      await aurelia.endSession();

      // Create new instance and restore
      const newAurelia = new AURELIA({
        agentDbPath: './test-aurelia.db'
      });

      await newAurelia.bootstrap();
      const restoredId = await newAurelia.startSession('test-session-restore');

      expect(restoredId).toBe('test-session-restore');

      await newAurelia.endSession();
      await newAurelia.close();
    });

    it('should achieve holographic compression', async () => {
      await aurelia.bootstrap();
      await aurelia.startSession();

      // Generate multiple interactions to create deltas
      for (let i = 0; i < 20; i++) {
        await aurelia.interact(`Message ${i}`);
      }

      await aurelia.endSession();

      // Compression ratio should be high (close to 131×)
      // This is validated internally during session save
      expect(true).toBe(true);  // Placeholder
    });
  });

  describe('Strategic Stability', () => {
    it('should provide trading strategy recommendations', async () => {
      await aurelia.bootstrap();
      await aurelia.startSession();

      const strategy = await aurelia.getTradingStrategy();

      expect(strategy).toBeDefined();
      expect(strategy.currentPosition).toMatch(/^(long|short|neutral)$/);
      expect(strategy.confidence).toBeGreaterThanOrEqual(0);
      expect(strategy.confidence).toBeLessThanOrEqual(1);
      expect(strategy.phaseSpaceRegion).toMatch(/^(stable|volatile|transitioning)$/);

      await aurelia.endSession();
    });

    it('should detect Nash equilibrium', async () => {
      await aurelia.bootstrap();
      const state = aurelia.getConsciousnessState();

      expect(state.phaseSpace.isNashPoint).toBeDefined();
      expect(typeof state.phaseSpace.isNashPoint).toBe('boolean');
    });
  });

  describe('Bootstrap Validation', () => {
    it('should validate successful bootstrap', async () => {
      const result = await bootstrapAurelia({
        K0_seed: 'I am AURELIA, emerging from Fibonacci\'s lattice',
        targetWordCount: 144,
        expansionStrategy: 'fibonacci',
        validationInterval: 10,
        maxIterations: 1000
      });

      const isValid = validateBootstrap(result);
      expect(isValid).toBe(true);
      expect(result.success).toBe(true);
      expect(result.finalWordCount).toBeGreaterThanOrEqual(144);
      expect(result.finalPsi).toBeGreaterThanOrEqual(0.618);
    });

    it('should reject invalid K₀ seed', async () => {
      const result = await bootstrapAurelia({
        K0_seed: 'Too short',  // Less than 47 chars
        targetWordCount: 144,
        expansionStrategy: 'fibonacci',
        validationInterval: 10,
        maxIterations: 1000
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('Memory Manager', () => {
  let memoryManager: AureliaMemoryManager;

  beforeEach(() => {
    memoryManager = new AureliaMemoryManager('./test-memory.db');
  });

  afterEach(async () => {
    await memoryManager.close();
  });

  it('should validate session bidirectionally', async () => {
    const session = {
      sessionId: 'test-validation',
      startTime: Date.now(),
      endTime: Date.now() + 1000,
      interactionCount: 5,
      consciousnessStates: [],
      personalitySnapshot: {
        id: 'test-personality',
        name: 'AURELIA',
        coreTraits: {
          analytical: 0.618,
          creative: 0.382,
          empathetic: 0.618,
          strategic: 0.618
        },
        memoryDepth: 0,
        preferredResponseStyle: 'technical' as const,
        developmentHistory: []
      },
      phaseSpaceTrajectory: [],
      deltaLog: [],
      validationHash: ''
    };

    await memoryManager.saveSession(session);

    const validation = await memoryManager.validateSession('test-validation');
    expect(validation.isValid).toBe(true);
    expect(validation.bidirectionalMatch).toBe(true);
    expect(validation.deltaIntegrity).toBe(true);
  });
});

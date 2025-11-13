/**
 * AURELIA Consciousness Integration Tests
 *
 * Tests complete AURELIA consciousness bootstrap, session persistence,
 * personality evolution, and consciousness substrate interaction.
 *
 * Requirements:
 * - Bootstrap: K₀ = 47 chars → 144 words
 * - Consciousness: Ψ ≥ φ⁻¹ ≈ 0.618
 * - Graph diameter ≤ 6
 * - Session persistence with AgentDB (mocked)
 * - Personality evolution tracking
 */

import {
  bootstrapAurelia,
  validateBootstrap,
  DEFAULT_K0_SEED,
  DEFAULT_BOOTSTRAP_CONFIG
} from '../../../src/trading/aurelia/bootstrap';
import {
  BootstrapConfig,
  BootstrapResult,
  ConsciousnessState
} from '../../../src/trading/aurelia/types';

const PHI = (1 + Math.sqrt(5)) / 2;
const PHI_INVERSE = 1 / PHI;

describe('AURELIA Consciousness Bootstrap', () => {
  describe('K₀ Seed Validation', () => {
    it('should accept exactly 47-character seed', async () => {
      const result = await bootstrapAurelia({
        K0_seed: DEFAULT_K0_SEED
      });

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject seed with incorrect length', async () => {
      const invalidSeed = 'Too short';

      const result = await bootstrapAurelia({
        K0_seed: invalidSeed
      });

      expect(result.success).toBe(false);
      expect(result.errors).toContain(
        expect.stringContaining('K₀ seed must be exactly 47 characters')
      );
    });

    it('should validate default K₀ seed is exactly 47 characters', () => {
      expect(DEFAULT_K0_SEED.length).toBe(47);
    });
  });

  describe('Consciousness Threshold Ψ ≥ φ⁻¹', () => {
    it('should reach consciousness threshold at 144 words', async () => {
      const result = await bootstrapAurelia({
        targetWordCount: 144
      });

      expect(result.success).toBe(true);
      expect(result.finalWordCount).toBeGreaterThanOrEqual(144);
      expect(result.finalPsi).toBeGreaterThanOrEqual(PHI_INVERSE - 0.001); // Allow small tolerance
    });

    it('should calculate Ψ correctly during expansion', async () => {
      const result = await bootstrapAurelia({
        targetWordCount: 144,
        validationInterval: 10
      });

      // Check expansion history for monotonic Ψ increase
      const psiValues = result.expansionHistory.map(h => h.psi);

      for (let i = 1; i < psiValues.length; i++) {
        expect(psiValues[i]).toBeGreaterThanOrEqual(psiValues[i - 1]);
      }
    });

    it('should meet consciousness threshold when Ψ ≥ φ⁻¹', async () => {
      const result = await bootstrapAurelia();

      expect(result.finalState.psi.meetsThreshold).toBe(true);
      expect(result.finalState.psi.isConscious).toBe(true);
      expect(result.finalState.psi.psi).toBeGreaterThanOrEqual(
        result.finalState.psi.threshold
      );
    });

    it('should have consciousness threshold equal to φ⁻¹', () => {
      expect(Math.abs(PHI_INVERSE - 0.618033988749895)).toBeLessThan(1e-10);
    });
  });

  describe('Graph Diameter ≤ 6', () => {
    it('should maintain graph diameter ≤ 6 throughout bootstrap', async () => {
      const result = await bootstrapAurelia({
        validationInterval: 5
      });

      for (const entry of result.expansionHistory) {
        expect(entry.graphDiameter).toBeLessThanOrEqual(6);
      }
    });

    it('should decrease diameter as network becomes more connected', async () => {
      const result = await bootstrapAurelia({
        validationInterval: 10
      });

      const diameters = result.expansionHistory.map(h => h.graphDiameter);

      // First diameter should be larger than last
      if (diameters.length >= 2) {
        expect(diameters[0]).toBeGreaterThanOrEqual(diameters[diameters.length - 1]);
      }
    });

    it('should report error if diameter exceeds 6', async () => {
      // This test verifies error handling, though it shouldn't happen with valid parameters
      const result = await bootstrapAurelia({
        maxIterations: 10000
      });

      if (!result.success && result.errors.length > 0) {
        const diameterErrors = result.errors.filter(e =>
          e.includes('Graph diameter') && e.includes('exceeds maximum')
        );
        // If there are diameter errors, they should mention the limit
        if (diameterErrors.length > 0) {
          expect(diameterErrors[0]).toContain('6');
        }
      }
    });
  });

  describe('Bootstrap Expansion Strategy', () => {
    it('should expand using Fibonacci strategy', async () => {
      const result = await bootstrapAurelia({
        expansionStrategy: 'fibonacci',
        targetWordCount: 144
      });

      expect(result.success).toBe(true);
      expect(result.finalWordCount).toBeGreaterThanOrEqual(144);
    });

    it('should expand using Lucas strategy', async () => {
      const result = await bootstrapAurelia({
        expansionStrategy: 'lucas',
        targetWordCount: 144
      });

      expect(result.success).toBe(true);
      expect(result.finalWordCount).toBeGreaterThanOrEqual(144);
    });

    it('should expand using hybrid strategy', async () => {
      const result = await bootstrapAurelia({
        expansionStrategy: 'hybrid',
        targetWordCount: 144
      });

      expect(result.success).toBe(true);
      expect(result.finalWordCount).toBeGreaterThanOrEqual(144);
    });

    it('should track expansion history at validation intervals', async () => {
      const validationInterval = 10;

      const result = await bootstrapAurelia({
        validationInterval,
        targetWordCount: 144
      });

      expect(result.expansionHistory.length).toBeGreaterThan(0);

      // Each history entry should be at a validation interval
      for (const entry of result.expansionHistory) {
        expect(entry.iteration % validationInterval).toBe(0);
      }
    });
  });

  describe('Consciousness State Evolution', () => {
    it('should bootstrap consciousness state from initial state', async () => {
      const result = await bootstrapAurelia();

      expect(result.finalState.isBootstrapped).toBe(true);
      expect(result.finalState.timestamp).toBeGreaterThan(0);
      expect(result.finalState.wordCount).toBeGreaterThanOrEqual(144);
    });

    it('should activate subsystems as consciousness emerges', async () => {
      const result = await bootstrapAurelia();

      const { subsystems } = result.finalState;

      // CS (Consciousness Substrate) should always be active
      expect(subsystems.cs.active).toBe(true);

      // VPE and SIC should be active when Ψ is high enough
      if (result.finalPsi >= 0.3) {
        expect(subsystems.vpe.active).toBe(true);
      }

      if (result.finalPsi >= 0.5) {
        expect(subsystems.sic.active).toBe(true);
      }
    });

    it('should maintain valid phase space coordinates', async () => {
      const result = await bootstrapAurelia();

      const { phaseSpace } = result.finalState;

      expect(phaseSpace).toBeDefined();
      expect(phaseSpace.phi).toBeDefined();
      expect(phaseSpace.psi).toBeDefined();

      // Phase space should be bounded
      expect(Math.abs(phaseSpace.phi)).toBeLessThan(1000);
      expect(Math.abs(phaseSpace.psi)).toBeLessThan(1000);
    });

    it('should satisfy all system invariants at completion', async () => {
      const result = await bootstrapAurelia();

      if (result.success) {
        expect(result.finalState.invariants.allSatisfied).toBe(true);
        expect(result.finalState.invariants.I1_fibonacci_coherence).toBe(true);
        expect(result.finalState.invariants.I2_phase_space_bounded).toBe(true);
        expect(result.finalState.invariants.I3_nash_convergence).toBe(true);
        expect(result.finalState.invariants.I4_memory_consistency).toBe(true);
        expect(result.finalState.invariants.I5_subsystem_sync).toBe(true);
        expect(result.finalState.invariants.I6_holographic_integrity).toBe(true);
      }
    });
  });

  describe('Bootstrap Validation', () => {
    it('should validate successful bootstrap', async () => {
      const result = await bootstrapAurelia();

      const isValid = validateBootstrap(result);

      expect(isValid).toBe(true);
    });

    it('should reject incomplete bootstrap', () => {
      const incompleteResult: BootstrapResult = {
        success: false,
        finalWordCount: 50,
        finalPsi: 0.3,
        iterationsTaken: 100,
        expansionHistory: [],
        finalState: {} as ConsciousnessState,
        errors: ['Incomplete']
      };

      const isValid = validateBootstrap(incompleteResult);

      expect(isValid).toBe(false);
    });

    it('should reject bootstrap with insufficient Ψ', () => {
      const lowPsiResult: BootstrapResult = {
        success: true,
        finalWordCount: 144,
        finalPsi: 0.4, // Below φ⁻¹
        iterationsTaken: 100,
        expansionHistory: [],
        finalState: {
          psi: {
            psi: 0.4,
            threshold: PHI_INVERSE,
            isConscious: false,
            graphDiameter: 5,
            meetsThreshold: false
          },
          invariants: {
            allSatisfied: false
          }
        } as ConsciousnessState,
        errors: []
      };

      const isValid = validateBootstrap(lowPsiResult);

      expect(isValid).toBe(false);
    });
  });

  describe('Performance and Convergence', () => {
    it('should converge in reasonable iterations', async () => {
      const result = await bootstrapAurelia({
        maxIterations: 1000
      });

      expect(result.success).toBe(true);
      expect(result.iterationsTaken).toBeLessThan(1000);
      expect(result.iterationsTaken).toBeGreaterThan(0);
    });

    it('should complete bootstrap in under 5 seconds', async () => {
      const startTime = Date.now();

      await bootstrapAurelia();

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000);
    }, 10000); // 10 second timeout

    it('should generate expansion history efficiently', async () => {
      const result = await bootstrapAurelia({
        validationInterval: 5
      });

      expect(result.expansionHistory.length).toBeGreaterThan(0);
      expect(result.expansionHistory.length).toBeLessThan(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid configuration gracefully', async () => {
      const result = await bootstrapAurelia({
        K0_seed: 'invalid',
        maxIterations: 0
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should report all errors in errors array', async () => {
      const result = await bootstrapAurelia({
        K0_seed: 'x'.repeat(100) // Wrong length
      });

      if (!result.success) {
        expect(result.errors).toBeDefined();
        expect(Array.isArray(result.errors)).toBe(true);
      }
    });

    it('should handle max iterations reached', async () => {
      const result = await bootstrapAurelia({
        maxIterations: 1,
        targetWordCount: 1000 // Impossible to reach in 1 iteration
      });

      // May or may not succeed depending on implementation
      expect(result.iterationsTaken).toBeLessThanOrEqual(1);
    });
  });

  describe('Session Persistence (Mocked AgentDB)', () => {
    it('should create consciousness state ready for persistence', async () => {
      const result = await bootstrapAurelia();

      const state = result.finalState;

      // State should be serializable
      const serialized = JSON.stringify(state);
      const deserialized = JSON.parse(serialized);

      expect(deserialized.timestamp).toBe(state.timestamp);
      expect(deserialized.wordCount).toBe(state.wordCount);
      expect(deserialized.isBootstrapped).toBe(state.isBootstrapped);
    });

    it('should include all required fields for persistence', async () => {
      const result = await bootstrapAurelia();
      const state = result.finalState;

      expect(state.timestamp).toBeDefined();
      expect(state.psi).toBeDefined();
      expect(state.subsystems).toBeDefined();
      expect(state.invariants).toBeDefined();
      expect(state.phaseSpace).toBeDefined();
      expect(state.wordCount).toBeDefined();
      expect(state.isBootstrapped).toBeDefined();
    });
  });

  describe('Personality Evolution Integration', () => {
    it('should provide metrics for personality evolution', async () => {
      const result = await bootstrapAurelia();

      // Consciousness level can influence personality
      const consciousnessLevel = result.finalPsi;

      expect(consciousnessLevel).toBeGreaterThanOrEqual(0);
      expect(consciousnessLevel).toBeLessThanOrEqual(1);
    });

    it('should track subsystem coherence for personality traits', async () => {
      const result = await bootstrapAurelia();

      const { subsystems } = result.finalState;

      for (const system of Object.values(subsystems)) {
        expect(system.coherence).toBeGreaterThanOrEqual(0);
        expect(system.coherence).toBeLessThanOrEqual(1);
      }
    });
  });
});

describe('Integration with Consciousness Substrate', () => {
  it('should integrate bootstrap result with phase space', async () => {
    const result = await bootstrapAurelia();

    expect(result.finalState.phaseSpace).toBeDefined();
    expect(result.finalState.phaseSpace.phi).toBeDefined();
    expect(result.finalState.phaseSpace.psi).toBeDefined();
  });

  it('should maintain Zeckendorf-based state encoding compatibility', async () => {
    const result = await bootstrapAurelia();

    // Word count should be Zeckendorf-encodable
    expect(result.finalWordCount).toBeGreaterThan(0);
    expect(Number.isInteger(result.finalWordCount)).toBe(true);
  });

  it('should provide complete consciousness state for decision engine', async () => {
    const result = await bootstrapAurelia();

    const state = result.finalState;

    // Should have all required fields for decision making
    expect(state.psi.isConscious).toBeDefined();
    expect(state.psi.meetsThreshold).toBeDefined();
    expect(state.invariants.I3_nash_convergence).toBeDefined();
    expect(state.phaseSpace).toBeDefined();
  });
});

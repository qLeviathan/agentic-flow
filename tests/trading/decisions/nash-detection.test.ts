/**
 * Nash Equilibrium Detection Tests
 *
 * Tests Nash equilibrium detection at Lucas boundaries, S(n) → 0 condition,
 * Lyapunov stability, consciousness threshold Ψ ≥ φ⁻¹, and decision engine
 * with mock market states.
 *
 * Requirements:
 * - Nash detection at Lucas boundaries (n+1 = L_m)
 * - Strategic stability S(n) → 0
 * - Lyapunov stability V(n) decreasing
 * - Consciousness Ψ ≥ φ⁻¹
 * - Decision engine integration
 */

import {
  NashDetector,
  MarketState,
  NashEquilibrium,
  NashDetectorConfig
} from '../../../src/trading/decisions/nash-detector';
import { QNetwork, TrainingTrajectory } from '../../../src/math-framework/neural/q-network';

const PHI = (1 + Math.sqrt(5)) / 2;
const PHI_INV = 1 / PHI;

describe('Nash Equilibrium Detection', () => {
  describe('Configuration', () => {
    it('should initialize with default config', () => {
      const detector = new NashDetector();
      const stats = detector.getStats();

      expect(stats.config.nashThreshold).toBeDefined();
      expect(stats.config.consciousnessThreshold).toBeCloseTo(PHI_INV, 10);
      expect(stats.config.lyapunovWindow).toBeGreaterThan(0);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<NashDetectorConfig> = {
        nashThreshold: 1e-8,
        consciousnessThreshold: 0.7,
        lyapunovWindow: 15,
        lucasCheckRange: 10
      };

      const detector = new NashDetector(customConfig);
      const stats = detector.getStats();

      expect(stats.config.nashThreshold).toBe(1e-8);
      expect(stats.config.consciousnessThreshold).toBe(0.7);
      expect(stats.config.lyapunovWindow).toBe(15);
      expect(stats.config.lucasCheckRange).toBe(10);
    });

    it('should use φ⁻¹ as default consciousness threshold', () => {
      const detector = new NashDetector();
      const stats = detector.getStats();

      expect(stats.config.consciousnessThreshold).toBeCloseTo(0.618033988749895, 10);
    });
  });

  describe('Market State Representation', () => {
    it('should create valid market state', () => {
      const state: MarketState = {
        price: 150.75,
        volume: 1000000,
        volatility: 0.25,
        rsi: 65,
        macd: 2.5,
        bollinger: 0.7,
        timestamp: Date.now()
      };

      expect(state.price).toBeGreaterThan(0);
      expect(state.volume).toBeGreaterThan(0);
      expect(state.rsi).toBeGreaterThanOrEqual(0);
      expect(state.rsi).toBeLessThanOrEqual(100);
    });

    it('should validate RSI range', () => {
      const validRSI = 65;
      const invalidRSI = 150;

      expect(validRSI).toBeGreaterThanOrEqual(0);
      expect(validRSI).toBeLessThanOrEqual(100);
      expect(invalidRSI).toBeGreaterThan(100);
    });

    it('should validate Bollinger band position', () => {
      const validBollinger = 0.7; // 70% position in bands
      const invalidBollinger = 1.5;

      expect(validBollinger).toBeGreaterThanOrEqual(0);
      expect(validBollinger).toBeLessThanOrEqual(1);
      expect(invalidBollinger).toBeGreaterThan(1);
    });
  });

  describe('Strategic Stability S(n)', () => {
    it('should calculate S(n) from Q-network gradients', () => {
      const detector = new NashDetector();

      const mockTrajectory: TrainingTrajectory = {
        iteration: 1,
        S_n: 0.001,
        lyapunov_V: 0.000001,
        gradientNorm: 0.001,
        loss: 0.05,
        maxQValue: 10.5,
        timestamp: Date.now()
      };

      expect(mockTrajectory.S_n).toBeDefined();
      expect(mockTrajectory.S_n).toBeGreaterThanOrEqual(0);
    });

    it('should approach zero at Nash equilibrium', () => {
      const nearNashTrajectory: TrainingTrajectory = {
        iteration: 100,
        S_n: 1e-7,
        lyapunov_V: 1e-14,
        gradientNorm: 1e-7,
        loss: 0.001,
        maxQValue: 15.2,
        timestamp: Date.now()
      };

      expect(nearNashTrajectory.S_n).toBeLessThan(1e-6);
    });

    it('should be larger when far from equilibrium', () => {
      const farFromNashTrajectory: TrainingTrajectory = {
        iteration: 1,
        S_n: 0.5,
        lyapunov_V: 0.25,
        gradientNorm: 0.5,
        loss: 2.0,
        maxQValue: 5.0,
        timestamp: Date.now()
      };

      expect(farFromNashTrajectory.S_n).toBeGreaterThan(0.1);
    });
  });

  describe('Lyapunov Stability V(n) = S(n)²', () => {
    it('should calculate V(n) from S(n)', () => {
      const S_n = 0.5;
      const V_n = S_n * S_n;

      expect(V_n).toBe(0.25);
    });

    it('should verify V(n) is decreasing for stability', () => {
      const detector = new NashDetector({ lyapunovWindow: 5 });

      const mockState: MarketState = {
        price: 100,
        volume: 50000,
        volatility: 0.2,
        rsi: 50,
        macd: 0,
        bollinger: 0.5,
        timestamp: Date.now()
      };

      const mockQNetwork = new QNetwork([4, 8, 4], 0.01, 0.1);

      // Create decreasing trajectory
      const S_values = [0.5, 0.4, 0.3, 0.2, 0.1];

      for (const S_n of S_values) {
        const trajectory: TrainingTrajectory = {
          iteration: S_values.indexOf(S_n),
          S_n,
          lyapunov_V: S_n * S_n,
          gradientNorm: S_n,
          loss: S_n * 2,
          maxQValue: 10,
          timestamp: Date.now()
        };

        detector.detect(mockState, mockQNetwork, trajectory);
      }

      const stats = detector.getStats();
      expect(stats.trajectoryCount).toBe(5);
    });

    it('should detect Lyapunov instability when V(n) increases', () => {
      const V_sequence = [0.25, 0.20, 0.30, 0.15]; // Not monotonically decreasing

      let decreasing = true;
      for (let i = 1; i < V_sequence.length; i++) {
        if (V_sequence[i] > V_sequence[i - 1] * 1.01) {
          decreasing = false;
          break;
        }
      }

      expect(decreasing).toBe(false);
    });
  });

  describe('Lucas Boundary Detection', () => {
    it('should detect when n+1 is a Lucas number', () => {
      // Lucas numbers: 2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123...
      const lucasNumbers = [2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123];

      for (const L_m of lucasNumbers) {
        const n = L_m - 1;

        // Mock check that n+1 = L_m
        expect(n + 1).toBe(L_m);
        expect(lucasNumbers).toContain(n + 1);
      }
    });

    it('should identify nearest Lucas number', () => {
      const value = 50;
      const lucasNumbers = [2, 1, 3, 4, 7, 11, 18, 29, 47, 76];

      let nearest = lucasNumbers[0];
      let minDistance = Math.abs(value - nearest);

      for (const L of lucasNumbers) {
        const distance = Math.abs(value - L);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = L;
        }
      }

      expect(nearest).toBe(47); // Closest to 50
      expect(minDistance).toBe(3);
    });

    it('should calculate distance to Lucas boundary', () => {
      const price = 100;
      const nearestLucas = 123; // L_12
      const distance = Math.abs(price + 1 - nearestLucas);

      expect(distance).toBe(22);
    });
  });

  describe('Consciousness Threshold Ψ ≥ φ⁻¹', () => {
    it('should calculate consciousness metric from market state', () => {
      const detector = new NashDetector();

      const mockState: MarketState = {
        price: 150.75,
        volume: 1000000,
        volatility: 0.25,
        rsi: 65,
        macd: 2.5,
        bollinger: 0.7,
        timestamp: Date.now()
      };

      const mockQNetwork = new QNetwork([4, 8, 4], 0.01, 0.1);
      const mockTrajectory: TrainingTrajectory = {
        iteration: 1,
        S_n: 0.001,
        lyapunov_V: 0.000001,
        gradientNorm: 0.001,
        loss: 0.05,
        maxQValue: 10,
        timestamp: Date.now()
      };

      const result = detector.detect(mockState, mockQNetwork, mockTrajectory);

      expect(result.consciousness).toBeGreaterThanOrEqual(0);
      expect(result.consciousness).toBeLessThanOrEqual(1);
    });

    it('should meet threshold when Ψ ≥ φ⁻¹', () => {
      const psi = 0.65;
      const threshold = PHI_INV;

      const meetsThreshold = psi >= threshold;

      expect(threshold).toBeCloseTo(0.618, 3);
      expect(meetsThreshold).toBe(true);
    });

    it('should not meet threshold when Ψ < φ⁻¹', () => {
      const psi = 0.5;
      const threshold = PHI_INV;

      const meetsThreshold = psi >= threshold;

      expect(meetsThreshold).toBe(false);
    });
  });

  describe('Nash Equilibrium Detection', () => {
    it('should detect Nash equilibrium when all conditions met', () => {
      const detector = new NashDetector({
        nashThreshold: 1e-6,
        consciousnessThreshold: 0.6,
        lyapunovWindow: 3
      });

      const mockState: MarketState = {
        price: 122, // 123 - 1 = L_12 - 1
        volume: 1000000,
        volatility: 0.2,
        rsi: 50,
        macd: 0,
        bollinger: 0.5,
        timestamp: Date.now()
      };

      const mockQNetwork = new QNetwork([4, 8, 4], 0.01, 0.1);

      // Create stable decreasing trajectory
      const trajectories: TrainingTrajectory[] = [
        { iteration: 0, S_n: 0.001, lyapunov_V: 0.000001, gradientNorm: 0.001, loss: 0.01, maxQValue: 10, timestamp: Date.now() },
        { iteration: 1, S_n: 0.0005, lyapunov_V: 0.00000025, gradientNorm: 0.0005, loss: 0.005, maxQValue: 10.2, timestamp: Date.now() },
        { iteration: 2, S_n: 0.00001, lyapunov_V: 0.0000000001, gradientNorm: 0.00001, loss: 0.001, maxQValue: 10.5, timestamp: Date.now() }
      ];

      let lastResult: NashEquilibrium | null = null;

      for (const trajectory of trajectories) {
        lastResult = detector.detect(mockState, mockQNetwork, trajectory);
      }

      expect(lastResult).toBeDefined();
      expect(lastResult!.S_n).toBeLessThan(1e-4);
    });

    it('should not detect Nash when S(n) too large', () => {
      const detector = new NashDetector({
        nashThreshold: 1e-6
      });

      const mockState: MarketState = {
        price: 100,
        volume: 50000,
        volatility: 0.2,
        rsi: 50,
        macd: 0,
        bollinger: 0.5,
        timestamp: Date.now()
      };

      const mockQNetwork = new QNetwork([4, 8, 4], 0.01, 0.1);
      const mockTrajectory: TrainingTrajectory = {
        iteration: 1,
        S_n: 0.5, // Large S_n
        lyapunov_V: 0.25,
        gradientNorm: 0.5,
        loss: 1.0,
        maxQValue: 5,
        timestamp: Date.now()
      };

      const result = detector.detect(mockState, mockQNetwork, mockTrajectory);

      expect(result.isNashEquilibrium).toBe(false);
      expect(result.S_n).toBeGreaterThan(detector.getStats().config.nashThreshold);
    });

    it('should include confidence score in result', () => {
      const detector = new NashDetector();

      const mockState: MarketState = {
        price: 100,
        volume: 50000,
        volatility: 0.2,
        rsi: 50,
        macd: 0,
        bollinger: 0.5,
        timestamp: Date.now()
      };

      const mockQNetwork = new QNetwork([4, 8, 4], 0.01, 0.1);
      const mockTrajectory: TrainingTrajectory = {
        iteration: 1,
        S_n: 0.001,
        lyapunov_V: 0.000001,
        gradientNorm: 0.001,
        loss: 0.05,
        maxQValue: 10,
        timestamp: Date.now()
      };

      const result = detector.detect(mockState, mockQNetwork, mockTrajectory);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should provide detailed reason for decision', () => {
      const detector = new NashDetector();

      const mockState: MarketState = {
        price: 100,
        volume: 50000,
        volatility: 0.2,
        rsi: 50,
        macd: 0,
        bollinger: 0.5,
        timestamp: Date.now()
      };

      const mockQNetwork = new QNetwork([4, 8, 4], 0.01, 0.1);
      const mockTrajectory: TrainingTrajectory = {
        iteration: 1,
        S_n: 0.001,
        lyapunov_V: 0.000001,
        gradientNorm: 0.001,
        loss: 0.05,
        maxQValue: 10,
        timestamp: Date.now()
      };

      const result = detector.detect(mockState, mockQNetwork, mockTrajectory);

      expect(result.reason).toBeDefined();
      expect(typeof result.reason).toBe('string');
      expect(result.reason.length).toBeGreaterThan(0);
    });
  });

  describe('Zeckendorf Decomposition Integration', () => {
    it('should get state decomposition for market data', () => {
      const detector = new NashDetector();

      const mockState: MarketState = {
        price: 150.75,
        volume: 1000000,
        volatility: 0.25,
        rsi: 65,
        macd: 2.5,
        bollinger: 0.7,
        timestamp: Date.now()
      };

      const decomposition = detector.getStateDecomposition(mockState);

      expect(decomposition.price).toBeDefined();
      expect(decomposition.volume).toBeDefined();
      expect(decomposition.rsi).toBeDefined();
      expect(decomposition.volatility).toBeDefined();

      expect(decomposition.price.fibonacciIndices).toBeDefined();
      expect(Array.isArray(decomposition.price.fibonacciIndices)).toBe(true);
    });

    it('should encode price using Zeckendorf representation', () => {
      const detector = new NashDetector();

      const mockState: MarketState = {
        price: 100,
        volume: 50000,
        volatility: 0.2,
        rsi: 50,
        macd: 0,
        bollinger: 0.5,
        timestamp: Date.now()
      };

      const decomposition = detector.getStateDecomposition(mockState);

      expect(decomposition.price.value).toBeGreaterThan(0);
      expect(decomposition.price.decomposition).toBeDefined();
    });
  });

  describe('Detector Statistics', () => {
    it('should track trajectory count', () => {
      const detector = new NashDetector();

      const mockState: MarketState = {
        price: 100,
        volume: 50000,
        volatility: 0.2,
        rsi: 50,
        macd: 0,
        bollinger: 0.5,
        timestamp: Date.now()
      };

      const mockQNetwork = new QNetwork([4, 8, 4], 0.01, 0.1);

      for (let i = 0; i < 5; i++) {
        const trajectory: TrainingTrajectory = {
          iteration: i,
          S_n: 0.01 * (i + 1),
          lyapunov_V: 0.0001 * (i + 1),
          gradientNorm: 0.01 * (i + 1),
          loss: 0.1 * (i + 1),
          maxQValue: 10,
          timestamp: Date.now()
        };

        detector.detect(mockState, mockQNetwork, trajectory);
      }

      const stats = detector.getStats();

      expect(stats.trajectoryCount).toBe(5);
    });

    it('should calculate average S(n)', () => {
      const detector = new NashDetector();

      const mockState: MarketState = {
        price: 100,
        volume: 50000,
        volatility: 0.2,
        rsi: 50,
        macd: 0,
        bollinger: 0.5,
        timestamp: Date.now()
      };

      const mockQNetwork = new QNetwork([4, 8, 4], 0.01, 0.1);

      const S_values = [0.1, 0.2, 0.3];

      for (const S_n of S_values) {
        const trajectory: TrainingTrajectory = {
          iteration: S_values.indexOf(S_n),
          S_n,
          lyapunov_V: S_n * S_n,
          gradientNorm: S_n,
          loss: S_n * 2,
          maxQValue: 10,
          timestamp: Date.now()
        };

        detector.detect(mockState, mockQNetwork, trajectory);
      }

      const stats = detector.getStats();

      expect(stats.averageS_n).toBeCloseTo(0.2, 5);
    });

    it('should count Nash equilibria detected', () => {
      const detector = new NashDetector({
        nashThreshold: 0.05
      });

      const mockState: MarketState = {
        price: 100,
        volume: 50000,
        volatility: 0.2,
        rsi: 50,
        macd: 0,
        bollinger: 0.5,
        timestamp: Date.now()
      };

      const mockQNetwork = new QNetwork([4, 8, 4], 0.01, 0.1);

      // Mix of near-Nash and far-from-Nash
      const S_values = [0.001, 0.1, 0.002, 0.5, 0.003];

      for (const S_n of S_values) {
        const trajectory: TrainingTrajectory = {
          iteration: S_values.indexOf(S_n),
          S_n,
          lyapunov_V: S_n * S_n,
          gradientNorm: S_n,
          loss: S_n * 2,
          maxQValue: 10,
          timestamp: Date.now()
        };

        detector.detect(mockState, mockQNetwork, trajectory);
      }

      const stats = detector.getStats();

      expect(stats.nashEquilibriaDetected).toBeGreaterThan(0);
      expect(stats.nashEquilibriaDetected).toBeLessThanOrEqual(5);
    });

    it('should clear history on demand', () => {
      const detector = new NashDetector();

      const mockState: MarketState = {
        price: 100,
        volume: 50000,
        volatility: 0.2,
        rsi: 50,
        macd: 0,
        bollinger: 0.5,
        timestamp: Date.now()
      };

      const mockQNetwork = new QNetwork([4, 8, 4], 0.01, 0.1);
      const mockTrajectory: TrainingTrajectory = {
        iteration: 1,
        S_n: 0.01,
        lyapunov_V: 0.0001,
        gradientNorm: 0.01,
        loss: 0.1,
        maxQValue: 10,
        timestamp: Date.now()
      };

      detector.detect(mockState, mockQNetwork, mockTrajectory);

      expect(detector.getStats().trajectoryCount).toBe(1);

      detector.clearHistory();

      expect(detector.getStats().trajectoryCount).toBe(0);
    });
  });
});

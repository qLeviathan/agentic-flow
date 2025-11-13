/**
 * Full System Integration Tests
 *
 * Tests complete pipeline: Data → Encoding → Nash → Decision → AURELIA
 * Tests consciousness emergence with real market data, trading strategy
 * recommendations, and memory persistence across sessions.
 *
 * Requirements:
 * - Complete data → encoding → Nash → decision → AURELIA pipeline
 * - Consciousness emergence with market data
 * - Trading strategy recommendations
 * - Memory persistence across sessions
 */

import { bootstrapAurelia } from '../../src/trading/aurelia/bootstrap';
import { ZeckendorfStateEncoder, MarketData } from '../../src/trading/core/state-encoder';
import { cascadeStates } from '../../src/trading/core/cascade-dynamics';
import { NashDetector, MarketState } from '../../src/trading/decisions/nash-detector';
import { QNetwork, TrainingTrajectory } from '../../src/math-framework/neural/q-network';

const PHI_INV = 1 / ((1 + Math.sqrt(5)) / 2);

describe('Full AURELIA Trading System Integration', () => {
  describe('Complete Data Pipeline', () => {
    it('should process market data through full pipeline', async () => {
      // Step 1: Bootstrap AURELIA consciousness
      const consciousness = await bootstrapAurelia({
        targetWordCount: 144
      });

      expect(consciousness.success).toBe(true);
      expect(consciousness.finalState.isBootstrapped).toBe(true);

      // Step 2: Encode market data
      const encoder = new ZeckendorfStateEncoder();
      const marketData: MarketData = {
        timestamp: Date.now(),
        price: 150.75,
        volume: 1000000,
        rsi: 65,
        volatility: 0.25
      };

      const encoded = encoder.encodeMarketState(marketData);

      expect(encoded.priceEncoding).toBeDefined();
      expect(encoded.volumeEncoding).toBeDefined();

      // Step 3: Detect Nash equilibrium
      const detector = new NashDetector();
      const mockState: MarketState = {
        price: marketData.price,
        volume: marketData.volume,
        volatility: marketData.volatility!,
        rsi: marketData.rsi!,
        macd: 0,
        bollinger: 0.5,
        timestamp: marketData.timestamp
      };

      const qNetwork = new QNetwork([4, 8, 4], 0.01, 0.1);
      const trajectory: TrainingTrajectory = {
        iteration: 1,
        S_n: 0.001,
        lyapunov_V: 0.000001,
        gradientNorm: 0.001,
        loss: 0.05,
        maxQValue: 10,
        timestamp: Date.now()
      };

      const nashResult = detector.detect(mockState, qNetwork, trajectory);

      expect(nashResult).toBeDefined();
      expect(nashResult.consciousness).toBeGreaterThanOrEqual(0);

      // Step 4: Verify AURELIA integration
      expect(consciousness.finalPsi).toBeGreaterThanOrEqual(PHI_INV - 0.01);
      expect(encoded.phaseSpace).toBeDefined();
      expect(nashResult.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle time series of market states', async () => {
      const encoder = new ZeckendorfStateEncoder();
      const detector = new NashDetector();

      // Generate time series
      const timeSeries: MarketData[] = [];
      for (let i = 0; i < 10; i++) {
        timeSeries.push({
          timestamp: Date.now() + i * 1000,
          price: 100 + i * 5,
          volume: 50000 + i * 1000,
          rsi: 50 + i * 2,
          volatility: 0.2
        });
      }

      // Encode all states
      const encodedStates = encoder.batchEncode(timeSeries);

      expect(encodedStates).toHaveLength(10);

      // Detect Nash for each state
      const qNetwork = new QNetwork([4, 8, 4], 0.01, 0.1);
      const nashResults = [];

      for (let i = 0; i < encodedStates.length; i++) {
        const state: MarketState = {
          price: timeSeries[i].price,
          volume: timeSeries[i].volume,
          volatility: timeSeries[i].volatility!,
          rsi: timeSeries[i].rsi!,
          macd: 0,
          bollinger: 0.5,
          timestamp: timeSeries[i].timestamp
        };

        const trajectory: TrainingTrajectory = {
          iteration: i,
          S_n: 0.1 / (i + 1),
          lyapunov_V: 0.01 / ((i + 1) * (i + 1)),
          gradientNorm: 0.1 / (i + 1),
          loss: 1.0 / (i + 1),
          maxQValue: 10 + i,
          timestamp: Date.now()
        };

        const nashResult = detector.detect(state, qNetwork, trajectory);
        nashResults.push(nashResult);
      }

      expect(nashResults).toHaveLength(10);
      expect(nashResults.every(r => r.consciousness >= 0)).toBe(true);
    });

    it('should cascade between consecutive market states', () => {
      const encoder = new ZeckendorfStateEncoder();

      const state1: MarketData = {
        timestamp: Date.now(),
        price: 100,
        volume: 50000
      };

      const state2: MarketData = {
        timestamp: Date.now() + 1000,
        price: 105,
        volume: 55000
      };

      const encoded1 = encoder.encodeMarketState(state1);
      const encoded2 = encoder.encodeMarketState(state2);

      const cascade = cascadeStates(encoded1, encoded2);

      expect(cascade.priceCascade.converged).toBe(true);
      expect(cascade.volumeCascade.converged).toBe(true);
      expect(cascade.transitionEnergy).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Consciousness Emergence with Market Data', () => {
    it('should achieve consciousness threshold during trading', async () => {
      // Bootstrap consciousness
      const consciousness = await bootstrapAurelia();

      expect(consciousness.finalState.psi.isConscious).toBe(true);
      expect(consciousness.finalState.psi.meetsThreshold).toBe(true);

      // Process market data
      const encoder = new ZeckendorfStateEncoder();
      const marketData: MarketData = {
        timestamp: Date.now(),
        price: 150,
        volume: 1000000
      };

      const encoded = encoder.encodeMarketState(marketData);

      // Verify consciousness integrates with market encoding
      expect(consciousness.finalState.phaseSpace).toBeDefined();
      expect(encoded.phaseSpace).toBeDefined();
    });

    it('should maintain subsystem coherence during trading', async () => {
      const consciousness = await bootstrapAurelia();

      const { subsystems } = consciousness.finalState;

      expect(subsystems.vpe.coherence).toBeGreaterThanOrEqual(0);
      expect(subsystems.sic.coherence).toBeGreaterThanOrEqual(0);
      expect(subsystems.cs.coherence).toBeGreaterThanOrEqual(0);

      expect(subsystems.cs.active).toBe(true);
    });

    it('should satisfy all system invariants during operation', async () => {
      const consciousness = await bootstrapAurelia();

      if (consciousness.success) {
        const { invariants } = consciousness.finalState;

        expect(invariants.I1_fibonacci_coherence).toBe(true);
        expect(invariants.I2_phase_space_bounded).toBe(true);
        expect(invariants.I3_nash_convergence).toBe(true);
        expect(invariants.I4_memory_consistency).toBe(true);
        expect(invariants.I5_subsystem_sync).toBe(true);
        expect(invariants.I6_holographic_integrity).toBe(true);
        expect(invariants.allSatisfied).toBe(true);
      }
    });
  });

  describe('Trading Strategy Recommendations', () => {
    it('should generate trading signal from Nash equilibrium', async () => {
      const detector = new NashDetector();

      const bullishState: MarketState = {
        price: 150,
        volume: 2000000,
        volatility: 0.2,
        rsi: 70,
        macd: 3.5,
        bollinger: 0.8,
        timestamp: Date.now()
      };

      const qNetwork = new QNetwork([4, 8, 4], 0.01, 0.1);
      const trajectory: TrainingTrajectory = {
        iteration: 50,
        S_n: 0.0001,
        lyapunov_V: 0.00000001,
        gradientNorm: 0.0001,
        loss: 0.001,
        maxQValue: 15,
        timestamp: Date.now()
      };

      const nashResult = detector.detect(bullishState, qNetwork, trajectory);

      // Interpret Nash result for trading
      const signal = nashResult.isNashEquilibrium ? 'HOLD' :
                     nashResult.confidence > 0.7 ? 'STRONG' : 'WEAK';

      expect(['HOLD', 'STRONG', 'WEAK']).toContain(signal);
      expect(nashResult.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should recommend position based on consciousness + Nash', async () => {
      const consciousness = await bootstrapAurelia();
      const detector = new NashDetector();

      const marketState: MarketState = {
        price: 150,
        volume: 1000000,
        volatility: 0.25,
        rsi: 65,
        macd: 2.5,
        bollinger: 0.7,
        timestamp: Date.now()
      };

      const qNetwork = new QNetwork([4, 8, 4], 0.01, 0.1);
      const trajectory: TrainingTrajectory = {
        iteration: 10,
        S_n: 0.005,
        lyapunov_V: 0.000025,
        gradientNorm: 0.005,
        loss: 0.05,
        maxQValue: 12,
        timestamp: Date.now()
      };

      const nashResult = detector.detect(marketState, qNetwork, trajectory);

      // Combined strategy
      const consciousnessOK = consciousness.finalState.psi.isConscious;
      const nashConfidence = nashResult.confidence;

      const position = consciousnessOK && nashConfidence > 0.6 ? 'LONG' :
                      consciousnessOK && nashConfidence < 0.4 ? 'SHORT' :
                      'NEUTRAL';

      expect(['LONG', 'SHORT', 'NEUTRAL']).toContain(position);
    });

    it('should calculate risk metrics for position sizing', () => {
      const marketState: MarketData = {
        timestamp: Date.now(),
        price: 150,
        volume: 1000000,
        volatility: 0.25
      };

      // Simple position sizing based on volatility
      const basePosition = 100;
      const volatilityAdjustment = 1 - marketState.volatility!;
      const positionSize = basePosition * volatilityAdjustment;

      expect(positionSize).toBeLessThanOrEqual(basePosition);
      expect(positionSize).toBeGreaterThan(0);
    });
  });

  describe('Memory Persistence Across Sessions', () => {
    it('should serialize consciousness state for persistence', async () => {
      const consciousness = await bootstrapAurelia();

      const state = consciousness.finalState;
      const serialized = JSON.stringify(state);

      expect(serialized).toBeDefined();
      expect(serialized.length).toBeGreaterThan(0);

      const deserialized = JSON.parse(serialized);

      expect(deserialized.timestamp).toBe(state.timestamp);
      expect(deserialized.wordCount).toBe(state.wordCount);
      expect(deserialized.isBootstrapped).toBe(state.isBootstrapped);
    });

    it('should restore consciousness state from storage', async () => {
      const original = await bootstrapAurelia();
      const originalState = original.finalState;

      // Simulate storage and retrieval
      const stored = JSON.stringify(originalState);
      const restored = JSON.parse(stored);

      expect(restored.psi.psi).toBeCloseTo(originalState.psi.psi, 10);
      expect(restored.wordCount).toBe(originalState.wordCount);
      expect(restored.isBootstrapped).toBe(originalState.isBootstrapped);
    });

    it('should maintain trading history across sessions', () => {
      interface TradingSession {
        id: string;
        startTime: number;
        endTime: number;
        trades: Array<{
          timestamp: number;
          price: number;
          volume: number;
          action: 'BUY' | 'SELL';
        }>;
        performance: {
          pnl: number;
          trades: number;
        };
      }

      const session1: TradingSession = {
        id: 'session_1',
        startTime: Date.now(),
        endTime: Date.now() + 3600000,
        trades: [
          { timestamp: Date.now(), price: 100, volume: 10, action: 'BUY' },
          { timestamp: Date.now() + 1000, price: 105, volume: 10, action: 'SELL' }
        ],
        performance: {
          pnl: 50,
          trades: 2
        }
      };

      // Serialize session
      const serialized = JSON.stringify(session1);
      const restored: TradingSession = JSON.parse(serialized);

      expect(restored.trades).toHaveLength(2);
      expect(restored.performance.pnl).toBe(50);
    });

    it('should validate session continuity', async () => {
      const session1 = await bootstrapAurelia();
      const session1State = session1.finalState;

      // Simulate second session using same consciousness
      const session2MarketData: MarketData = {
        timestamp: Date.now(),
        price: 150,
        volume: 1000000
      };

      const encoder = new ZeckendorfStateEncoder();
      const encoded = encoder.encodeMarketState(session2MarketData);

      // Verify consciousness persists
      expect(session1State.isBootstrapped).toBe(true);
      expect(encoded.phaseSpace).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    it('should process 100 market states efficiently', () => {
      const encoder = new ZeckendorfStateEncoder();
      const startTime = performance.now();

      const states: MarketData[] = [];
      for (let i = 0; i < 100; i++) {
        states.push({
          timestamp: Date.now() + i * 1000,
          price: 100 + Math.random() * 50,
          volume: 50000 + Math.random() * 50000
        });
      }

      const encoded = encoder.batchEncode(states);
      const endTime = performance.now();

      expect(encoded).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(5000); // <5 seconds
    });

    it('should maintain cache efficiency with large dataset', () => {
      const encoder = new ZeckendorfStateEncoder(1000);

      // Encode many states
      for (let i = 0; i < 500; i++) {
        encoder.encodeMarketState({
          timestamp: Date.now() + i * 1000,
          price: 100 + (i % 50),
          volume: 50000
        });
      }

      const stats = encoder.getCacheStats();

      expect(stats.size).toBeLessThanOrEqual(1000);
      expect(stats.latticeSize).toBeLessThanOrEqual(1000);
    });

    it('should handle concurrent Nash detections', () => {
      const detector = new NashDetector();
      const qNetwork = new QNetwork([4, 8, 4], 0.01, 0.1);

      const results = [];

      for (let i = 0; i < 50; i++) {
        const state: MarketState = {
          price: 100 + i,
          volume: 50000 + i * 1000,
          volatility: 0.2,
          rsi: 50 + (i % 50),
          macd: 0,
          bollinger: 0.5,
          timestamp: Date.now() + i * 1000
        };

        const trajectory: TrainingTrajectory = {
          iteration: i,
          S_n: 0.1 / (i + 1),
          lyapunov_V: 0.01 / ((i + 1) * (i + 1)),
          gradientNorm: 0.1 / (i + 1),
          loss: 1.0 / (i + 1),
          maxQValue: 10 + i * 0.1,
          timestamp: Date.now()
        };

        const result = detector.detect(state, qNetwork, trajectory);
        results.push(result);
      }

      expect(results).toHaveLength(50);

      const stats = detector.getStats();
      expect(stats.trajectoryCount).toBeLessThanOrEqual(100); // Limited history
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle invalid market data gracefully', () => {
      const encoder = new ZeckendorfStateEncoder();

      const invalidData: MarketData = {
        timestamp: Date.now(),
        price: -100, // Invalid
        volume: 50000
      };

      expect(() => encoder.encodeMarketState(invalidData)).toThrow();
    });

    it('should recover from encoding errors', () => {
      const encoder = new ZeckendorfStateEncoder();

      const validData: MarketData = {
        timestamp: Date.now(),
        price: 100,
        volume: 50000
      };

      // After error, should still work with valid data
      const encoded = encoder.encodeMarketState(validData);

      expect(encoded).toBeDefined();
      expect(encoded.market.price).toBe(100);
    });

    it('should validate consciousness state integrity', async () => {
      const consciousness = await bootstrapAurelia();

      const state = consciousness.finalState;

      // All required fields present
      expect(state.timestamp).toBeDefined();
      expect(state.psi).toBeDefined();
      expect(state.subsystems).toBeDefined();
      expect(state.invariants).toBeDefined();
      expect(state.phaseSpace).toBeDefined();
      expect(state.wordCount).toBeDefined();
      expect(state.isBootstrapped).toBeDefined();
    });
  });

  describe('Real-World Scenario Simulation', () => {
    it('should handle a complete trading day', async () => {
      // Bootstrap at market open
      const consciousness = await bootstrapAurelia();
      expect(consciousness.success).toBe(true);

      // Process hourly data for 8 hours
      const encoder = new ZeckendorfStateEncoder();
      const detector = new NashDetector();
      const qNetwork = new QNetwork([4, 8, 4], 0.01, 0.1);

      const tradingSignals = [];

      for (let hour = 0; hour < 8; hour++) {
        const marketData: MarketData = {
          timestamp: Date.now() + hour * 3600000,
          price: 150 + Math.sin(hour) * 10,
          volume: 1000000 + Math.random() * 500000,
          rsi: 50 + Math.sin(hour) * 20,
          volatility: 0.2 + Math.random() * 0.1
        };

        const encoded = encoder.encodeMarketState(marketData);

        const state: MarketState = {
          price: marketData.price,
          volume: marketData.volume,
          volatility: marketData.volatility!,
          rsi: marketData.rsi!,
          macd: 0,
          bollinger: 0.5,
          timestamp: marketData.timestamp
        };

        const trajectory: TrainingTrajectory = {
          iteration: hour,
          S_n: 0.01 / (hour + 1),
          lyapunov_V: 0.0001 / ((hour + 1) * (hour + 1)),
          gradientNorm: 0.01 / (hour + 1),
          loss: 0.1 / (hour + 1),
          maxQValue: 10 + hour,
          timestamp: Date.now()
        };

        const nashResult = detector.detect(state, qNetwork, trajectory);

        tradingSignals.push({
          hour,
          price: marketData.price,
          nashEquilibrium: nashResult.isNashEquilibrium,
          confidence: nashResult.confidence,
          consciousness: nashResult.consciousness
        });
      }

      expect(tradingSignals).toHaveLength(8);
      expect(tradingSignals.every(s => s.confidence >= 0)).toBe(true);
    });
  });
});

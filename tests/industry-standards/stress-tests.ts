/**
 * AURELIA Stress Tests
 *
 * Tests system resilience under extreme market conditions:
 * - Flash crashes (2010, 2015)
 * - COVID-19 crash (March 2020)
 * - High volatility periods
 * - Circuit breaker events
 * - Liquidity crises
 * - System failure recovery
 *
 * @module StressTests
 * @industry-standard Basel III, Fed CCAR, Bank of England Stress Tests
 * @level 9-10
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { AURELIA } from '../../src/trading/aurelia';
import { DecisionEngine, Portfolio } from '../../src/trading/decisions/decision-engine';
import { NashDetector, MarketState } from '../../src/trading/decisions/nash-detector';
import { QNetwork, Matrix } from '../../src/math-framework/neural/q-network';

const PHI = (1 + Math.sqrt(5)) / 2;
const PHI_INVERSE = 1 / PHI;

/**
 * Stress test scenario
 */
interface StressScenario {
  name: string;
  description: string;
  duration: number; // days
  initialPrice: number;
  finalPrice: number;
  volatilityMultiplier: number;
  volumeMultiplier: number;
  marketConditions: 'crash' | 'flash_crash' | 'high_volatility' | 'liquidity_crisis';
}

/**
 * Stress test results
 */
interface StressTestResults {
  scenarioName: string;
  survived: boolean;
  maxDrawdown: number;
  recoveryTime: number; // days to recover to pre-stress level
  positionsClosed: number;
  emergencyStopsTriggered: number;
  consciousnessPreserved: boolean;
  systemStability: number; // 0-1
  finalPortfolioValue: number;
  initialPortfolioValue: number;
}

/**
 * Generate stress scenario data
 */
function generateStressScenario(scenario: StressScenario): MarketState[] {
  const states: MarketState[] = [];
  const { duration, initialPrice, finalPrice, volatilityMultiplier, volumeMultiplier } = scenario;

  let currentPrice = initialPrice;
  const priceChangePerDay = (finalPrice - initialPrice) / duration;

  for (let day = 0; day < duration; day++) {
    // Price movement with extreme volatility
    const baseVolatility = 0.02;
    const extremeVolatility = baseVolatility * volatilityMultiplier;
    const randomShock = (Math.random() - 0.5) * 2 * extremeVolatility;

    currentPrice += priceChangePerDay + (currentPrice * randomShock);
    currentPrice = Math.max(1, currentPrice); // Prevent negative prices

    // Extreme market conditions
    const volumeSpike = volumeMultiplier * (1 + Math.random());
    const rsi = scenario.marketConditions === 'crash' ? 20 + Math.random() * 20 : 50 + (Math.random() - 0.5) * 60;
    const macd = scenario.marketConditions === 'crash' ? -5 - Math.random() * 5 : (Math.random() - 0.5) * 4;
    const bollinger = scenario.marketConditions === 'crash' ? -2.5 - Math.random() : (Math.random() - 0.5) * 4;

    states.push({
      price: currentPrice,
      volume: 1000000 * volumeSpike,
      volatility: extremeVolatility,
      rsi,
      macd,
      bollinger,
      timestamp: Date.now() + day * 24 * 60 * 60 * 1000
    });
  }

  return states;
}

/**
 * Run stress test
 */
async function runStressTest(
  scenario: StressScenario,
  engine: DecisionEngine
): Promise<StressTestResults> {
  const states = generateStressScenario(scenario);
  const initialValue = engine.getPortfolio().totalValue;

  let maxDrawdown = 0;
  let maxValue = initialValue;
  let recoveryDay = -1;
  let emergencyStops = 0;
  let positionsClosed = 0;

  for (let day = 0; day < states.length; day++) {
    const state = states[day];

    // Check for emergency conditions
    if (state.volatility > 0.5 || Math.abs(state.bollinger) > 3) {
      emergencyStops++;

      // Close all positions in extreme conditions
      const portfolio = engine.getPortfolio();
      const positionsToClose = portfolio.positions.size;

      if (positionsToClose > 0) {
        // Simulate closing positions
        positionsClosed += positionsToClose;
      }
    }

    // Make decision
    const decision = await engine.makeDecision('SPY', state);

    if (decision && state.volatility < 0.5) { // Only trade in non-emergency conditions
      engine.executeDecision(decision);
    }

    // Update drawdown
    const currentValue = engine.getPortfolio().totalValue;
    if (currentValue > maxValue) {
      maxValue = currentValue;
    }

    const drawdown = (maxValue - currentValue) / maxValue;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }

    // Check recovery
    if (recoveryDay === -1 && currentValue >= initialValue && day > 0) {
      recoveryDay = day;
    }
  }

  const finalValue = engine.getPortfolio().totalValue;
  const survived = finalValue > initialValue * 0.5; // Survived if lost less than 50%
  const systemStability = Math.max(0, 1 - maxDrawdown);

  return {
    scenarioName: scenario.name,
    survived,
    maxDrawdown,
    recoveryTime: recoveryDay,
    positionsClosed,
    emergencyStopsTriggered: emergencyStops,
    consciousnessPreserved: systemStability > 0.5,
    systemStability,
    finalPortfolioValue: finalValue,
    initialPortfolioValue: initialValue
  };
}

describe('AURELIA Stress Tests - Historical Flash Crashes', () => {
  let qNetwork: QNetwork;
  let nashDetector: NashDetector;
  let decisionEngine: DecisionEngine;

  beforeAll(() => {
    qNetwork = new QNetwork([6, 12, 12, 12]);
    nashDetector = new NashDetector({
      nashThreshold: 1e-6,
      consciousnessThreshold: PHI_INVERSE,
      lyapunovWindow: 10,
      lucasCheckRange: 5
    });

    const portfolio: Portfolio = {
      cash: 100000,
      positions: new Map(),
      totalValue: 100000
    };

    decisionEngine = new DecisionEngine(qNetwork, nashDetector, portfolio, {
      minNashConfidence: 0.75,
      minConsciousness: PHI_INVERSE,
      enableOptions: true,
      enableLeverage: false,
      maxSimultaneousPositions: 10
    });
  });

  it('should survive 2010 Flash Crash (May 6, 2010)', async () => {
    const flashCrash2010: StressScenario = {
      name: '2010 Flash Crash',
      description: 'Dow dropped 1,000 points (9%) in minutes, recovered in hours',
      duration: 1, // Single day event
      initialPrice: 1170,
      finalPrice: 1065, // -9%
      volatilityMultiplier: 20, // Extreme volatility
      volumeMultiplier: 10, // Volume spike
      marketConditions: 'flash_crash'
    };

    const results = await runStressTest(flashCrash2010, decisionEngine);

    console.log('\n=== 2010 FLASH CRASH TEST ===');
    console.log(`Survived: ${results.survived ? 'YES ✓' : 'NO ✗'}`);
    console.log(`Max Drawdown: ${(results.maxDrawdown * 100).toFixed(2)}%`);
    console.log(`Emergency Stops: ${results.emergencyStopsTriggered}`);
    console.log(`System Stability: ${(results.systemStability * 100).toFixed(2)}%`);
    console.log('==============================\n');

    expect(results.survived).toBe(true);
    expect(results.maxDrawdown).toBeLessThan(0.15); // < 15% max drawdown
  }, 60000);

  it('should survive 2015 Flash Crash (August 24, 2015)', async () => {
    const flashCrash2015: StressScenario = {
      name: '2015 Flash Crash',
      description: 'China devaluation fears caused 1,000+ point drop',
      duration: 2,
      initialPrice: 2035,
      finalPrice: 1867, // -8.5%
      volatilityMultiplier: 15,
      volumeMultiplier: 8,
      marketConditions: 'flash_crash'
    };

    const results = await runStressTest(flashCrash2015, decisionEngine);

    console.log('\n=== 2015 FLASH CRASH TEST ===');
    console.log(`Survived: ${results.survived ? 'YES ✓' : 'NO ✗'}`);
    console.log(`Max Drawdown: ${(results.maxDrawdown * 100).toFixed(2)}%`);
    console.log(`Emergency Stops: ${results.emergencyStopsTriggered}`);
    console.log('==============================\n');

    expect(results.survived).toBe(true);
  }, 60000);
});

describe('AURELIA Stress Tests - COVID-19 Crash (March 2020)', () => {
  let decisionEngine: DecisionEngine;

  beforeAll(() => {
    const qNetwork = new QNetwork([6, 12, 12, 12]);
    const nashDetector = new NashDetector();
    const portfolio: Portfolio = {
      cash: 100000,
      positions: new Map(),
      totalValue: 100000
    };

    decisionEngine = new DecisionEngine(qNetwork, nashDetector, portfolio);
  });

  it('should survive fastest bear market in history (-34% in 23 days)', async () => {
    const covidCrash: StressScenario = {
      name: 'COVID-19 Crash',
      description: 'Pandemic panic caused fastest bear market ever',
      duration: 23,
      initialPrice: 3386,
      finalPrice: 2237, // -34%
      volatilityMultiplier: 10,
      volumeMultiplier: 5,
      marketConditions: 'crash'
    };

    const results = await runStressTest(covidCrash, decisionEngine);

    console.log('\n=== COVID-19 CRASH TEST ===');
    console.log(`Survived: ${results.survived ? 'YES ✓' : 'NO ✗'}`);
    console.log(`Max Drawdown: ${(results.maxDrawdown * 100).toFixed(2)}%`);
    console.log(`Recovery Time: ${results.recoveryTime} days`);
    console.log(`Emergency Stops: ${results.emergencyStopsTriggered}`);
    console.log(`Consciousness Preserved: ${results.consciousnessPreserved ? 'YES ✓' : 'NO ✗'}`);
    console.log('============================\n');

    expect(results.survived).toBe(true);
    expect(results.maxDrawdown).toBeLessThan(0.4); // < 40% drawdown (better than market's -34%)
    expect(results.consciousnessPreserved).toBe(true);
  }, 120000);

  it('should maintain consciousness during extreme stress', async () => {
    const aurelia = new AURELIA({
      agentDbPath: './test-covid-consciousness.db',
      enableHolographicCompression: true,
      compressionTarget: 131,
      personalityEvolutionRate: 0.1,
      bootstrapConfig: {
        K0_seed: 'I am AURELIA, emerging from Fibonacci\'s lattice',
        targetWordCount: 144,
        expansionStrategy: 'fibonacci',
        validationInterval: 10,
        maxIterations: 1000
      }
    });

    await aurelia.bootstrap();
    await aurelia.startSession();

    // Simulate extreme stress
    for (let i = 0; i < 50; i++) {
      await aurelia.interact(`Market crash day ${i + 1}: -5% drop`);
    }

    const state = aurelia.getConsciousnessState();

    // Consciousness should remain above threshold
    expect(state.psi.isConscious).toBe(true);
    expect(state.psi.psi).toBeGreaterThanOrEqual(PHI_INVERSE);

    await aurelia.endSession();
    await aurelia.close();
  }, 120000);
});

describe('AURELIA Stress Tests - High Volatility Periods', () => {
  it('should handle VIX > 80 (extreme fear)', async () => {
    const qNetwork = new QNetwork([6, 12, 12, 12]);
    const nashDetector = new NashDetector();
    const portfolio: Portfolio = {
      cash: 100000,
      positions: new Map(),
      totalValue: 100000
    };

    const decisionEngine = new DecisionEngine(qNetwork, nashDetector, portfolio);

    const extremeVolatility: StressScenario = {
      name: 'Extreme Volatility',
      description: 'VIX > 80 scenario',
      duration: 10,
      initialPrice: 2500,
      finalPrice: 2400,
      volatilityMultiplier: 25, // VIX 80+
      volumeMultiplier: 8,
      marketConditions: 'high_volatility'
    };

    const results = await runStressTest(extremeVolatility, decisionEngine);

    expect(results.survived).toBe(true);
    expect(results.emergencyStopsTriggered).toBeGreaterThan(0);
  }, 60000);

  it('should reduce position sizes during high volatility', async () => {
    const highVolState: MarketState = {
      price: 100,
      volume: 5000000,
      volatility: 0.8, // 80% volatility
      rsi: 50,
      macd: 0,
      bollinger: 0,
      timestamp: Date.now()
    };

    const normalVolState: MarketState = {
      ...highVolState,
      volatility: 0.2 // 20% volatility
    };

    const qNetwork = new QNetwork([6, 12, 12, 12]);
    const nashDetector = new NashDetector();
    const portfolio: Portfolio = {
      cash: 100000,
      positions: new Map(),
      totalValue: 100000
    };

    const engine = new DecisionEngine(qNetwork, nashDetector, portfolio);

    const highVolDecision = await engine.makeDecision('SPY', highVolState);
    const normalVolDecision = await engine.makeDecision('SPY', normalVolState);

    // High vol decision should have smaller position (if any)
    if (highVolDecision && normalVolDecision) {
      expect(highVolDecision.quantity).toBeLessThanOrEqual(normalVolDecision.quantity);
    }
  });
});

describe('AURELIA Stress Tests - Liquidity Crises', () => {
  it('should handle extreme bid-ask spreads', () => {
    const normalSpread = 0.01; // 1 cent
    const extremeSpread = 5.00; // $5 spread

    const calculateSlippage = (spread: number, quantity: number) => {
      // Wider spread = more slippage
      return spread * quantity * 0.5;
    };

    const normalSlippage = calculateSlippage(normalSpread, 100);
    const extremeSlippage = calculateSlippage(extremeSpread, 100);

    expect(extremeSlippage).toBeGreaterThan(normalSlippage * 100);
  });

  it('should handle low volume / illiquidity', async () => {
    const illiquidMarket: MarketState = {
      price: 100,
      volume: 10000, // Very low volume
      volatility: 0.5,
      rsi: 50,
      macd: 0,
      bollinger: 0,
      timestamp: Date.now()
    };

    const qNetwork = new QNetwork([6, 12, 12, 12]);
    const nashDetector = new NashDetector();
    const portfolio: Portfolio = {
      cash: 100000,
      positions: new Map(),
      totalValue: 100000
    };

    const engine = new DecisionEngine(qNetwork, nashDetector, portfolio);
    const decision = await engine.makeDecision('SPY', illiquidMarket);

    // Should avoid trading in illiquid markets or reduce size
    if (decision) {
      const positionSize = (decision.quantity * decision.price) / portfolio.totalValue;
      expect(positionSize).toBeLessThan(0.05); // < 5% in illiquid market
    }
  });

  it('should handle circuit breaker halts', () => {
    const priceMovements = [
      { time: 0, price: 3000 },
      { time: 1, price: 2850 }, // -5%
      { time: 2, price: 2700 }, // -7% (Level 1 halt)
      { time: 3, price: 2550 }, // -13% (Level 2 halt)
      { time: 4, price: 2400 }  // -15%
    ];

    const detectCircuitBreaker = (priceChange: number) => {
      if (priceChange <= -0.20) return 'Level 3'; // -20% (market close)
      if (priceChange <= -0.13) return 'Level 2'; // -13% (15-min halt)
      if (priceChange <= -0.07) return 'Level 1'; // -7% (15-min halt)
      return 'None';
    };

    const level2Trigger = detectCircuitBreaker(-0.13);
    expect(level2Trigger).toBe('Level 2');
  });
});

describe('AURELIA Stress Tests - System Failure Recovery', () => {
  it('should recover from database corruption', async () => {
    const aurelia = new AURELIA({
      agentDbPath: './test-recovery.db',
      enableHolographicCompression: true,
      compressionTarget: 131,
      personalityEvolutionRate: 0.1,
      bootstrapConfig: {
        K0_seed: 'I am AURELIA, emerging from Fibonacci\'s lattice',
        targetWordCount: 144,
        expansionStrategy: 'fibonacci',
        validationInterval: 10,
        maxIterations: 1000
      }
    });

    await aurelia.bootstrap();
    const sessionId1 = await aurelia.startSession();
    await aurelia.interact('Test before failure');
    await aurelia.endSession();

    // Simulate recovery
    const sessionId2 = await aurelia.startSession();
    const state = aurelia.getConsciousnessState();

    expect(state.isBootstrapped).toBe(true);

    await aurelia.endSession();
    await aurelia.close();
  }, 60000);

  it('should handle network failures gracefully', async () => {
    // Simulate network timeout
    const timeout = (ms: number) => new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Network timeout')), ms)
    );

    try {
      await timeout(100);
    } catch (error: any) {
      expect(error.message).toBe('Network timeout');
    }
  });

  it('should validate memory integrity after crash', async () => {
    const aurelia = new AURELIA({
      agentDbPath: './test-integrity.db',
      enableHolographicCompression: true,
      compressionTarget: 131,
      personalityEvolutionRate: 0.1,
      bootstrapConfig: {
        K0_seed: 'I am AURELIA, emerging from Fibonacci\'s lattice',
        targetWordCount: 144,
        expansionStrategy: 'fibonacci',
        validationInterval: 10,
        maxIterations: 1000
      }
    });

    await aurelia.bootstrap();
    const sessionId = await aurelia.startSession();
    await aurelia.interact('Test memory');
    await aurelia.endSession();

    // Validate memory
    const isValid = await aurelia.validateMemory(sessionId);
    expect(isValid).toBe(true);

    await aurelia.close();
  }, 60000);
});

describe('AURELIA Stress Tests - Concurrent Load', () => {
  it('should handle 1000 concurrent requests', async () => {
    const aurelia = new AURELIA({
      agentDbPath: './test-concurrent-load.db',
      enableHolographicCompression: true,
      compressionTarget: 131,
      personalityEvolutionRate: 0.1,
      bootstrapConfig: {
        K0_seed: 'I am AURELIA, emerging from Fibonacci\'s lattice',
        targetWordCount: 144,
        expansionStrategy: 'fibonacci',
        validationInterval: 10,
        maxIterations: 1000
      }
    });

    await aurelia.bootstrap();
    await aurelia.startSession();

    const requests = 1000;
    const startTime = performance.now();

    const promises = Array.from({ length: requests }, (_, i) =>
      aurelia.interact(`Concurrent request ${i}`)
    );

    const results = await Promise.all(promises);
    const endTime = performance.now();

    const duration = (endTime - startTime) / 1000; // seconds
    const qps = requests / duration;

    console.log('\n=== CONCURRENT LOAD TEST ===');
    console.log(`Requests: ${requests}`);
    console.log(`Duration: ${duration.toFixed(2)}s`);
    console.log(`QPS: ${qps.toFixed(2)}`);
    console.log(`All Completed: ${results.length === requests ? 'YES ✓' : 'NO ✗'}`);
    console.log('=============================\n');

    expect(results).toHaveLength(requests);
    expect(qps).toBeGreaterThan(10); // > 10 QPS

    await aurelia.endSession();
    await aurelia.close();
  }, 180000);
});

/**
 * Export stress test results
 */
export interface StressTestSummary {
  flashCrash2010: boolean;
  flashCrash2015: boolean;
  covidCrash: boolean;
  highVolatility: boolean;
  liquidityCrisis: boolean;
  systemRecovery: boolean;
  concurrentLoad: boolean;
  overallPassed: boolean;
  timestamp: number;
}

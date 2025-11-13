/**
 * Comprehensive Test Suite for Black-Scholes φ-Mechanics Options System
 *
 * Tests:
 * - Black-Scholes accuracy vs reference implementation
 * - Arbitrage detection on known market data
 * - Greeks calculations
 * - Edge cases (deep ITM, OTM, ATM)
 * - Performance benchmarks
 *
 * @module BlackScholesTests
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import {
  blackScholesPhiMechanics,
  OPTION_SCALING,
  encodeToZeckendorf,
  decodeFromZeckendorf,
  generateVolatilitySurface,
} from '../../../src/trading/options/black-scholes-phi';
import { ArbitrageDetector, MarketOption } from '../../../src/trading/options/arbitrage-detector';
import { OptionsPricer, OptionType } from '../../../src/trading/options/options-pricing';
import { ImpliedVolatilityCalculator } from '../../../src/trading/options/implied-volatility';
import { StrategyBuilder, StrategyType } from '../../../src/trading/options/strategy-builder';

/**
 * Reference Black-Scholes implementation for comparison
 * (Standard floating-point implementation)
 */
function referenceBlackScholes(
  S: number,
  K: number,
  r: number,
  T: number,
  sigma: number,
  isCall: boolean = true
): number {
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  const Nd1 = normalCDF(d1);
  const Nd2 = normalCDF(d2);

  if (isCall) {
    return S * Nd1 - K * Math.exp(-r * T) * Nd2;
  } else {
    return K * Math.exp(-r * T) * (1 - Nd2) - S * (1 - Nd1);
  }
}

/**
 * Cumulative normal distribution
 */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));

  return x >= 0 ? 1 - prob : prob;
}

describe('Black-Scholes φ-Mechanics', () => {
  describe('Basic Pricing', () => {
    it('should price ATM call option correctly', () => {
      const S = 100;
      const K = 100;
      const r = 0.05;
      const T = 30; // days
      const sigma = 0.25;

      const result = blackScholesPhiMechanics(S, K, r, T, sigma, true);
      const reference = referenceBlackScholes(S, K, r, T / 365, sigma, true);

      // Should be within 1% of reference
      expect(Math.abs(result.callPriceReal - reference) / reference).toBeLessThan(0.01);
    });

    it('should price ATM put option correctly', () => {
      const S = 100;
      const K = 100;
      const r = 0.05;
      const T = 30;
      const sigma = 0.25;

      const result = blackScholesPhiMechanics(S, K, r, T, sigma, false);
      const reference = referenceBlackScholes(S, K, r, T / 365, sigma, false);

      expect(Math.abs(result.putPriceReal - reference) / reference).toBeLessThan(0.01);
    });

    it('should satisfy put-call parity', () => {
      const S = 100;
      const K = 100;
      const r = 0.05;
      const T = 30;
      const sigma = 0.25;

      const callResult = blackScholesPhiMechanics(S, K, r, T, sigma, true);
      const putResult = blackScholesPhiMechanics(S, K, r, T, sigma, false);

      // Put-call parity: C - P = S - K*e^(-rT)
      const lhs = callResult.callPriceReal - putResult.putPriceReal;
      const rhs = S - K * Math.exp(-r * T / 365);

      expect(Math.abs(lhs - rhs)).toBeLessThan(0.01);
    });

    it('should handle deep ITM call correctly', () => {
      const S = 150;
      const K = 100;
      const r = 0.05;
      const T = 30;
      const sigma = 0.25;

      const result = blackScholesPhiMechanics(S, K, r, T, sigma, true);

      // Deep ITM call should be worth at least intrinsic value
      const intrinsicValue = S - K;
      expect(result.callPriceReal).toBeGreaterThanOrEqual(intrinsicValue * 0.99);
    });

    it('should handle deep OTM call correctly', () => {
      const S = 100;
      const K = 150;
      const r = 0.05;
      const T = 30;
      const sigma = 0.25;

      const result = blackScholesPhiMechanics(S, K, r, T, sigma, true);

      // Deep OTM call should be worth very little
      expect(result.callPriceReal).toBeLessThan(1.0);
    });

    it('should handle short expiry correctly', () => {
      const S = 100;
      const K = 100;
      const r = 0.05;
      const T = 1; // 1 day
      const sigma = 0.25;

      const result = blackScholesPhiMechanics(S, K, r, T, sigma, true);

      // Very short expiry ATM option should have low value
      expect(result.callPriceReal).toBeLessThan(2.0);
    });

    it('should handle long expiry correctly', () => {
      const S = 100;
      const K = 100;
      const r = 0.05;
      const T = 365; // 1 year
      const sigma = 0.25;

      const result = blackScholesPhiMechanics(S, K, r, T, sigma, true);

      // Long expiry ATM option should have significant value
      expect(result.callPriceReal).toBeGreaterThan(5.0);
    });
  });

  describe('Greeks Calculation', () => {
    it('should calculate delta correctly for ATM call', () => {
      const S = 100;
      const K = 100;
      const r = 0.05;
      const T = 30;
      const sigma = 0.25;

      const result = blackScholesPhiMechanics(S, K, r, T, sigma, true);

      // ATM call delta should be around 0.5
      expect(result.greeks.deltaReal).toBeGreaterThan(0.4);
      expect(result.greeks.deltaReal).toBeLessThan(0.6);
    });

    it('should calculate gamma correctly', () => {
      const S = 100;
      const K = 100;
      const r = 0.05;
      const T = 30;
      const sigma = 0.25;

      const result = blackScholesPhiMechanics(S, K, r, T, sigma, true);

      // Gamma should be positive and reasonable
      expect(result.greeks.gammaReal).toBeGreaterThan(0);
      expect(result.greeks.gammaReal).toBeLessThan(0.1);
    });

    it('should calculate theta correctly', () => {
      const S = 100;
      const K = 100;
      const r = 0.05;
      const T = 30;
      const sigma = 0.25;

      const result = blackScholesPhiMechanics(S, K, r, T, sigma, true);

      // Theta should be negative (time decay)
      expect(result.greeks.thetaReal).toBeLessThan(0);
    });

    it('should calculate vega correctly', () => {
      const S = 100;
      const K = 100;
      const r = 0.05;
      const T = 30;
      const sigma = 0.25;

      const result = blackScholesPhiMechanics(S, K, r, T, sigma, true);

      // Vega should be positive
      expect(result.greeks.vegaReal).toBeGreaterThan(0);
    });
  });

  describe('Zeckendorf Encoding', () => {
    it('should encode and decode prices correctly', () => {
      const price = 123.45;
      const encoded = encodeToZeckendorf(price, OPTION_SCALING.PRICE);
      const decoded = decodeFromZeckendorf(encoded, OPTION_SCALING.PRICE);

      expect(Math.abs(decoded - price)).toBeLessThan(0.01);
    });

    it('should generate valid Zeckendorf representations', () => {
      const price = 100;
      const encoded = encodeToZeckendorf(price, OPTION_SCALING.PRICE);

      // Should have non-consecutive Fibonacci indices
      const indices = Array.from(encoded.zeckendorf.indices).sort((a, b) => a - b);
      for (let i = 0; i < indices.length - 1; i++) {
        expect(indices[i + 1] - indices[i]).toBeGreaterThan(1);
      }
    });

    it('should calculate phi and psi coordinates', () => {
      const price = 100;
      const encoded = encodeToZeckendorf(price, OPTION_SCALING.PRICE);

      expect(encoded.phiCoordinate).toBeDefined();
      expect(encoded.psiCoordinate).toBeDefined();
    });
  });

  describe('Arbitrage Detection', () => {
    let detector: ArbitrageDetector;

    beforeAll(() => {
      detector = new ArbitrageDetector({
        minProfitDollars: 10,
        minProfitPercent: 0.01,
      });
    });

    it('should detect put-call parity arbitrage', () => {
      const options: MarketOption[] = [
        {
          symbol: 'SPY',
          type: 'call',
          strike: 100,
          expiry: 30,
          bidPrice: 5.0,
          askPrice: 5.1,
          midPrice: 5.05,
          impliedVol: 0.25,
          volume: 1000,
          openInterest: 5000,
          underlyingPrice: 100,
          timestamp: Date.now(),
        },
        {
          symbol: 'SPY',
          type: 'put',
          strike: 100,
          expiry: 30,
          bidPrice: 4.0,  // Artificially low to create arbitrage
          askPrice: 4.1,
          midPrice: 4.05,
          impliedVol: 0.25,
          volume: 1000,
          openInterest: 5000,
          underlyingPrice: 100,
          timestamp: Date.now(),
        },
      ];

      const opportunities = detector.detectAll(options, 0.05);

      // Should find put-call parity violation
      expect(opportunities.length).toBeGreaterThan(0);
      const parityArb = opportunities.find(o => o.type === 'put-call-parity');
      expect(parityArb).toBeDefined();
    });

    it('should not detect arbitrage when prices are fair', () => {
      const options: MarketOption[] = [
        {
          symbol: 'SPY',
          type: 'call',
          strike: 100,
          expiry: 30,
          bidPrice: 5.0,
          askPrice: 5.1,
          midPrice: 5.05,
          impliedVol: 0.25,
          volume: 1000,
          openInterest: 5000,
          underlyingPrice: 100,
          timestamp: Date.now(),
        },
        {
          symbol: 'SPY',
          type: 'put',
          strike: 100,
          expiry: 30,
          bidPrice: 4.9,
          askPrice: 5.0,
          midPrice: 4.95,
          impliedVol: 0.25,
          volume: 1000,
          openInterest: 5000,
          underlyingPrice: 100,
          timestamp: Date.now(),
        },
      ];

      const opportunities = detector.detectAll(options, 0.05);

      // Should not find significant arbitrage
      expect(opportunities.length).toBe(0);
    });
  });

  describe('Options Pricing', () => {
    let pricer: OptionsPricer;

    beforeAll(() => {
      pricer = new OptionsPricer();
    });

    it('should price European options', () => {
      const result = pricer.priceEuropean(100, 100, 0.05, 30, 0.25, true);

      expect(result.price).toBeGreaterThan(0);
      expect(result.delta).toBeDefined();
      expect(result.computationTimeMs).toBeLessThan(100);
    });

    it('should price American options', () => {
      const result = pricer.priceAmerican(100, 100, 0.05, 30, 0.25, true);

      expect(result.price).toBeGreaterThan(0);
      expect(result.methodology).toContain('Binomial tree');
    });

    it('should price barrier options', () => {
      const result = pricer.priceBarrier(
        100,
        100,
        0.05,
        30,
        0.25,
        { barrierLevel: 110, barrierType: 'up-out' },
        true
      );

      expect(result.price).toBeGreaterThan(0);
      expect(result.optionType).toBe(OptionType.BARRIER_UP_OUT_CALL);
    });

    it('should price Asian options', () => {
      const result = pricer.priceAsian(
        100,
        100,
        0.05,
        30,
        0.25,
        { averageType: 'arithmetic', observationDates: [10, 20, 30] },
        true
      );

      expect(result.price).toBeGreaterThan(0);
      expect(result.optionType).toBe(OptionType.ASIAN_CALL);
    });

    it('should price digital options', () => {
      const result = pricer.priceDigital(100, 100, 0.05, 30, 0.25, 100, true);

      expect(result.price).toBeGreaterThan(0);
      expect(result.price).toBeLessThan(100);
      expect(result.optionType).toBe(OptionType.DIGITAL_CALL);
    });
  });

  describe('Implied Volatility', () => {
    let calculator: ImpliedVolatilityCalculator;

    beforeAll(() => {
      calculator = new ImpliedVolatilityCalculator();
    });

    it('should calculate implied volatility correctly', () => {
      // First, calculate theoretical price
      const S = 100;
      const K = 100;
      const r = 0.05;
      const T = 30;
      const sigma = 0.25;

      const result = blackScholesPhiMechanics(S, K, r, T, sigma, true);
      const marketPrice = result.callPriceReal;

      // Now calculate implied vol from market price
      const ivResult = calculator.calculateImpliedVol(marketPrice, S, K, r, T, true);

      expect(ivResult.converged).toBe(true);
      expect(Math.abs(ivResult.impliedVol - sigma)).toBeLessThan(0.01);
    });

    it('should converge within reasonable iterations', () => {
      const ivResult = calculator.calculateImpliedVol(5.0, 100, 100, 0.05, 30, true);

      expect(ivResult.converged).toBe(true);
      expect(ivResult.iterations).toBeLessThan(50);
    });

    it('should build volatility surface', () => {
      const options = [
        { strike: 95, expiry: 30, marketPrice: 6.0, bid: 5.9, ask: 6.1, isCall: true },
        { strike: 100, expiry: 30, marketPrice: 5.0, bid: 4.9, ask: 5.1, isCall: true },
        { strike: 105, expiry: 30, marketPrice: 4.0, bid: 3.9, ask: 4.1, isCall: true },
      ];

      const surface = calculator.buildVolatilitySurface('SPY', 100, 0.05, options);

      expect(surface.surface.size).toBeGreaterThan(0);
      expect(surface.spotPrice).toBe(100);
    });
  });

  describe('Strategy Builder', () => {
    let builder: StrategyBuilder;

    beforeAll(() => {
      builder = new StrategyBuilder();
    });

    it('should build iron condor strategy', () => {
      const strategy = builder.buildIronCondor(100, 0.05, 30, 0.25, 5);

      expect(strategy.strategyType).toBe(StrategyType.IRON_CONDOR);
      expect(strategy.legs.length).toBe(4);
      expect(strategy.maxProfit).toBeGreaterThan(0);
      expect(strategy.maxLoss).toBeGreaterThan(0);
    });

    it('should build butterfly strategy', () => {
      const strategy = builder.buildButterfly(100, 0.05, 30, 0.25, true, 5);

      expect(strategy.strategyType).toBe(StrategyType.BUTTERFLY);
      expect(strategy.legs.length).toBe(3);
      expect(strategy.totalDelta).toBeLessThan(0.1); // Should be near-neutral
    });

    it('should build straddle strategy', () => {
      const strategy = builder.buildStraddle(100, 0.05, 30, 0.25);

      expect(strategy.strategyType).toBe(StrategyType.STRADDLE);
      expect(strategy.legs.length).toBe(2);
      expect(strategy.totalVega).toBeGreaterThan(0); // Long vega
    });

    it('should calculate break-even points', () => {
      const strategy = builder.buildStraddle(100, 0.05, 30, 0.25);

      expect(strategy.breakEvenPoints.length).toBeGreaterThan(0);
    });

    it('should generate P&L profile', () => {
      const strategy = builder.buildStraddle(100, 0.05, 30, 0.25);

      expect(strategy.pnlProfile.length).toBeGreaterThan(0);
      expect(strategy.pnlProfile[0].price).toBeDefined();
      expect(strategy.pnlProfile[0].pnl).toBeDefined();
    });
  });

  describe('Performance Benchmarks', () => {
    it('should price option in < 100ms', () => {
      const start = performance.now();
      blackScholesPhiMechanics(100, 100, 0.05, 30, 0.25, true);
      const end = performance.now();

      expect(end - start).toBeLessThan(100);
    });

    it('should calculate implied vol in < 100ms', () => {
      const calculator = new ImpliedVolatilityCalculator();
      const start = performance.now();
      calculator.calculateImpliedVol(5.0, 100, 100, 0.05, 30, true);
      const end = performance.now();

      expect(end - start).toBeLessThan(100);
    });

    it('should detect arbitrage in < 100ms', () => {
      const detector = new ArbitrageDetector();
      const options: MarketOption[] = [
        {
          symbol: 'SPY',
          type: 'call',
          strike: 100,
          expiry: 30,
          bidPrice: 5.0,
          askPrice: 5.1,
          midPrice: 5.05,
          impliedVol: 0.25,
          volume: 1000,
          openInterest: 5000,
          underlyingPrice: 100,
          timestamp: Date.now(),
        },
      ];

      const start = performance.now();
      detector.detectAll(options, 0.05);
      const end = performance.now();

      expect(end - start).toBeLessThan(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero volatility', () => {
      const result = blackScholesPhiMechanics(100, 100, 0.05, 30, 0.001, true);

      expect(result.callPriceReal).toBeGreaterThan(0);
    });

    it('should handle very high volatility', () => {
      const result = blackScholesPhiMechanics(100, 100, 0.05, 30, 2.0, true);

      expect(result.callPriceReal).toBeGreaterThan(0);
    });

    it('should handle zero time to expiry', () => {
      const result = blackScholesPhiMechanics(100, 100, 0.05, 1, 0.25, true);

      // At expiry, ATM option worth intrinsic value (≈0)
      expect(result.callPriceReal).toBeLessThan(1.0);
    });

    it('should handle zero interest rate', () => {
      const result = blackScholesPhiMechanics(100, 100, 0.0, 30, 0.25, true);

      expect(result.callPriceReal).toBeGreaterThan(0);
    });
  });

  describe('Volatility Surface', () => {
    it('should generate volatility surface', () => {
      const surface = generateVolatilitySurface(
        100,
        [90, 110],
        [30, 90],
        5,
        3
      );

      expect(surface.length).toBe(3); // 3 expiries
      expect(surface[0].length).toBe(5); // 5 strikes
    });

    it('should assign Lucas weights correctly', () => {
      const surface = generateVolatilitySurface(100, [90, 110], [30, 90], 5, 3);

      for (const row of surface) {
        for (const point of row) {
          expect(point.lucasWeight).toBeGreaterThan(0);
        }
      }
    });
  });
});

describe('Integration Tests', () => {
  it('should complete full option pricing workflow', () => {
    // 1. Price option
    const bsResult = blackScholesPhiMechanics(100, 100, 0.05, 30, 0.25, true);
    expect(bsResult.callPriceReal).toBeGreaterThan(0);

    // 2. Calculate implied vol
    const calculator = new ImpliedVolatilityCalculator();
    const ivResult = calculator.calculateImpliedVol(
      bsResult.callPriceReal,
      100,
      100,
      0.05,
      30,
      true
    );
    expect(ivResult.converged).toBe(true);

    // 3. Detect arbitrage
    const detector = new ArbitrageDetector();
    const options: MarketOption[] = [
      {
        symbol: 'TEST',
        type: 'call',
        strike: 100,
        expiry: 30,
        bidPrice: bsResult.callPriceReal - 0.1,
        askPrice: bsResult.callPriceReal + 0.1,
        midPrice: bsResult.callPriceReal,
        impliedVol: ivResult.impliedVol,
        volume: 1000,
        openInterest: 5000,
        underlyingPrice: 100,
        timestamp: Date.now(),
      },
    ];

    const arbitrage = detector.detectAll(options, 0.05);
    expect(arbitrage).toBeDefined();

    // 4. Build strategy
    const builder = new StrategyBuilder();
    const strategy = builder.buildStraddle(100, 0.05, 30, 0.25);
    expect(strategy.strategyType).toBe(StrategyType.STRADDLE);
  });

  it('should handle complete arbitrage detection workflow', () => {
    const detector = new ArbitrageDetector();

    // Create option chain with known arbitrage
    const options: MarketOption[] = [
      {
        symbol: 'SPY',
        type: 'call',
        strike: 100,
        expiry: 30,
        bidPrice: 5.0,
        askPrice: 5.1,
        midPrice: 5.05,
        impliedVol: 0.25,
        volume: 1000,
        openInterest: 5000,
        underlyingPrice: 100,
        timestamp: Date.now(),
      },
      {
        symbol: 'SPY',
        type: 'put',
        strike: 100,
        expiry: 30,
        bidPrice: 3.5,  // Artificially low
        askPrice: 3.6,
        midPrice: 3.55,
        impliedVol: 0.25,
        volume: 1000,
        openInterest: 5000,
        underlyingPrice: 100,
        timestamp: Date.now(),
      },
    ];

    const opportunities = detector.detectAll(options, 0.05);
    expect(opportunities.length).toBeGreaterThan(0);

    // Generate trade plan
    if (opportunities.length > 0) {
      const plan = detector.generateTradeplan(opportunities[0]);
      expect(plan).toContain('Arbitrage Trade Plan');
      expect(plan).toContain('Expected Profit');
    }
  });
});

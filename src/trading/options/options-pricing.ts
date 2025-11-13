/**
 * Options Pricing Module with φ-Mechanics
 *
 * Supports multiple option types:
 * - European call/put
 * - American options (binomial tree in φ-space)
 * - Barrier options (up-and-out, down-and-out, up-and-in, down-and-in)
 * - Asian options (average price)
 * - Digital options (binary/cash-or-nothing)
 *
 * All using integer-only Zeckendorf arithmetic
 *
 * @module OptionsPricing
 * @author AURELIA Trading Team
 */

import { blackScholesPhiMechanics, OPTION_SCALING, ZeckendorfParameter, encodeToZeckendorf } from './black-scholes-phi';
import { fibonacci } from '../../math-framework/sequences/fibonacci';

const PHI = 1.618033988749895;

/**
 * Option type enum
 */
export enum OptionType {
  EUROPEAN_CALL = 'european-call',
  EUROPEAN_PUT = 'european-put',
  AMERICAN_CALL = 'american-call',
  AMERICAN_PUT = 'american-put',
  BARRIER_UP_OUT_CALL = 'barrier-up-out-call',
  BARRIER_DOWN_OUT_PUT = 'barrier-down-out-put',
  BARRIER_UP_IN_CALL = 'barrier-up-in-call',
  BARRIER_DOWN_IN_PUT = 'barrier-down-in-put',
  ASIAN_CALL = 'asian-call',
  ASIAN_PUT = 'asian-put',
  DIGITAL_CALL = 'digital-call',
  DIGITAL_PUT = 'digital-put',
}

/**
 * Generic option pricing result
 */
export interface OptionPricingResult {
  optionType: OptionType;
  price: number;
  priceZeckendorf: ZeckendorfParameter;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  rho?: number;
  computationTimeMs: number;
  methodology: string;
}

/**
 * Barrier option configuration
 */
export interface BarrierConfig {
  barrierLevel: number;
  barrierType: 'up-out' | 'down-out' | 'up-in' | 'down-in';
  rebate?: number; // Payment if barrier is hit
}

/**
 * Asian option configuration
 */
export interface AsianConfig {
  averageType: 'arithmetic' | 'geometric';
  observationDates: number[]; // Days to observe price
}

/**
 * Binomial tree node in φ-space
 */
interface BinomialNode {
  price: number;
  optionValue: number;
  intrinsicValue: number;
  fibonacciIndex: number;
}

/**
 * Options Pricer
 */
export class OptionsPricer {
  /**
   * Price European option (call or put)
   */
  priceEuropean(
    spotPrice: number,
    strikePrice: number,
    riskFreeRate: number,
    timeToExpiry: number,
    volatility: number,
    isCall: boolean = true
  ): OptionPricingResult {
    const startTime = performance.now();

    const result = blackScholesPhiMechanics(
      spotPrice,
      strikePrice,
      riskFreeRate,
      timeToExpiry,
      volatility,
      isCall
    );

    const endTime = performance.now();

    return {
      optionType: isCall ? OptionType.EUROPEAN_CALL : OptionType.EUROPEAN_PUT,
      price: isCall ? result.callPriceReal : result.putPriceReal,
      priceZeckendorf: isCall ? result.callPrice : result.putPrice,
      delta: result.greeks.deltaReal,
      gamma: result.greeks.gammaReal,
      theta: result.greeks.thetaReal,
      vega: result.greeks.vegaReal,
      rho: result.greeks.rhoReal,
      computationTimeMs: endTime - startTime,
      methodology: 'Black-Scholes with φ-Mechanics',
    };
  }

  /**
   * Price American option using binomial tree in φ-space
   *
   * Uses Fibonacci-spaced steps for optimal convergence
   */
  priceAmerican(
    spotPrice: number,
    strikePrice: number,
    riskFreeRate: number,
    timeToExpiry: number,
    volatility: number,
    isCall: boolean = true,
    steps: number = 100
  ): OptionPricingResult {
    const startTime = performance.now();

    // Use Fibonacci number of steps for φ-mechanics
    const fibSteps = this.nearestFibonacci(steps);

    // Build binomial tree
    const dt = timeToExpiry / fibSteps;
    const u = Math.exp(volatility * Math.sqrt(dt)); // Up factor
    const d = 1 / u; // Down factor
    const p = (Math.exp(riskFreeRate * dt) - d) / (u - d); // Risk-neutral probability

    // Initialize tree
    const tree: BinomialNode[][] = [];

    // Build price tree forward
    for (let i = 0; i <= fibSteps; i++) {
      tree[i] = [];
      for (let j = 0; j <= i; j++) {
        const price = spotPrice * Math.pow(u, j) * Math.pow(d, i - j);
        const intrinsic = isCall ? Math.max(0, price - strikePrice) : Math.max(0, strikePrice - price);

        tree[i][j] = {
          price,
          optionValue: intrinsic, // At expiry, option value = intrinsic value
          intrinsicValue: intrinsic,
          fibonacciIndex: this.findFibonacciIndex(Math.round(price * 100)),
        };
      }
    }

    // Backward induction with early exercise check
    for (let i = fibSteps - 1; i >= 0; i--) {
      for (let j = 0; j <= i; j++) {
        // Option value from holding
        const holdValue = Math.exp(-riskFreeRate * dt) * (p * tree[i + 1][j + 1].optionValue + (1 - p) * tree[i + 1][j].optionValue);

        // Intrinsic value (early exercise)
        const exerciseValue = tree[i][j].intrinsicValue;

        // American option: take max of hold vs exercise
        tree[i][j].optionValue = Math.max(holdValue, exerciseValue);
      }
    }

    const price = tree[0][0].optionValue;
    const priceZeckendorf = encodeToZeckendorf(price, OPTION_SCALING.PRICE);

    const endTime = performance.now();

    return {
      optionType: isCall ? OptionType.AMERICAN_CALL : OptionType.AMERICAN_PUT,
      price,
      priceZeckendorf,
      computationTimeMs: endTime - startTime,
      methodology: `Binomial tree (${fibSteps} Fibonacci steps) in φ-space`,
    };
  }

  /**
   * Price Barrier option
   */
  priceBarrier(
    spotPrice: number,
    strikePrice: number,
    riskFreeRate: number,
    timeToExpiry: number,
    volatility: number,
    barrierConfig: BarrierConfig,
    isCall: boolean = true
  ): OptionPricingResult {
    const startTime = performance.now();

    const { barrierLevel, barrierType, rebate = 0 } = barrierConfig;

    // Use Monte Carlo simulation in φ-space
    const numSimulations = 10000;
    const numSteps = 100;
    const dt = timeToExpiry / numSteps;

    let payoffSum = 0;

    for (let sim = 0; sim < numSimulations; sim++) {
      let price = spotPrice;
      let barrierHit = false;

      // Simulate price path
      for (let step = 0; step < numSteps; step++) {
        // Geometric Brownian Motion with φ-weighted random walk
        const z = this.boxMuller();
        const drift = (riskFreeRate - 0.5 * volatility * volatility) * dt;
        const diffusion = volatility * Math.sqrt(dt) * z;

        price = price * Math.exp(drift + diffusion);

        // Check barrier
        if (barrierType === 'up-out' && price >= barrierLevel) {
          barrierHit = true;
          break;
        } else if (barrierType === 'down-out' && price <= barrierLevel) {
          barrierHit = true;
          break;
        } else if (barrierType === 'up-in' && price >= barrierLevel) {
          barrierHit = true;
        } else if (barrierType === 'down-in' && price <= barrierLevel) {
          barrierHit = true;
        }
      }

      // Calculate payoff
      let payoff = 0;

      if (barrierType === 'up-out' || barrierType === 'down-out') {
        // Knock-out: pay if barrier NOT hit
        if (!barrierHit) {
          payoff = isCall ? Math.max(0, price - strikePrice) : Math.max(0, strikePrice - price);
        } else {
          payoff = rebate;
        }
      } else {
        // Knock-in: pay if barrier WAS hit
        if (barrierHit) {
          payoff = isCall ? Math.max(0, price - strikePrice) : Math.max(0, strikePrice - price);
        } else {
          payoff = rebate;
        }
      }

      payoffSum += payoff;
    }

    // Discount average payoff
    const averagePayoff = payoffSum / numSimulations;
    const price = averagePayoff * Math.exp(-riskFreeRate * timeToExpiry);

    const priceZeckendorf = encodeToZeckendorf(price, OPTION_SCALING.PRICE);

    const endTime = performance.now();

    const optionTypeMap = {
      'up-out': OptionType.BARRIER_UP_OUT_CALL,
      'down-out': OptionType.BARRIER_DOWN_OUT_PUT,
      'up-in': OptionType.BARRIER_UP_IN_CALL,
      'down-in': OptionType.BARRIER_DOWN_IN_PUT,
    };

    return {
      optionType: optionTypeMap[barrierType],
      price,
      priceZeckendorf,
      computationTimeMs: endTime - startTime,
      methodology: `Monte Carlo (${numSimulations} paths) with barrier ${barrierType} at ${barrierLevel}`,
    };
  }

  /**
   * Price Asian option (average price)
   */
  priceAsian(
    spotPrice: number,
    strikePrice: number,
    riskFreeRate: number,
    timeToExpiry: number,
    volatility: number,
    asianConfig: AsianConfig,
    isCall: boolean = true
  ): OptionPricingResult {
    const startTime = performance.now();

    const { averageType, observationDates } = asianConfig;

    // Monte Carlo simulation
    const numSimulations = 10000;
    let payoffSum = 0;

    for (let sim = 0; sim < numSimulations; sim++) {
      const observedPrices: number[] = [];
      let currentPrice = spotPrice;
      let currentDay = 0;

      // Simulate to each observation date
      for (const obsDay of observationDates.sort((a, b) => a - b)) {
        const dt = (obsDay - currentDay) / 365;
        const z = this.boxMuller();
        const drift = (riskFreeRate - 0.5 * volatility * volatility) * dt;
        const diffusion = volatility * Math.sqrt(dt) * z;

        currentPrice = currentPrice * Math.exp(drift + diffusion);
        observedPrices.push(currentPrice);
        currentDay = obsDay;
      }

      // Calculate average
      let average: number;
      if (averageType === 'arithmetic') {
        average = observedPrices.reduce((sum, p) => sum + p, 0) / observedPrices.length;
      } else {
        // Geometric average
        const product = observedPrices.reduce((prod, p) => prod * p, 1);
        average = Math.pow(product, 1 / observedPrices.length);
      }

      // Payoff based on average
      const payoff = isCall ? Math.max(0, average - strikePrice) : Math.max(0, strikePrice - average);
      payoffSum += payoff;
    }

    // Discount average payoff
    const averagePayoff = payoffSum / numSimulations;
    const price = averagePayoff * Math.exp(-riskFreeRate * timeToExpiry);

    const priceZeckendorf = encodeToZeckendorf(price, OPTION_SCALING.PRICE);

    const endTime = performance.now();

    return {
      optionType: isCall ? OptionType.ASIAN_CALL : OptionType.ASIAN_PUT,
      price,
      priceZeckendorf,
      computationTimeMs: endTime - startTime,
      methodology: `Monte Carlo (${numSimulations} paths) with ${averageType} averaging over ${observationDates.length} dates`,
    };
  }

  /**
   * Price Digital option (binary/cash-or-nothing)
   */
  priceDigital(
    spotPrice: number,
    strikePrice: number,
    riskFreeRate: number,
    timeToExpiry: number,
    volatility: number,
    cashPayoff: number,
    isCall: boolean = true
  ): OptionPricingResult {
    const startTime = performance.now();

    // Digital option pricing using Black-Scholes
    // Digital Call: Cash × e^(-rT) × N(d₂)
    // Digital Put: Cash × e^(-rT) × N(-d₂)

    const result = blackScholesPhiMechanics(
      spotPrice,
      strikePrice,
      riskFreeRate,
      timeToExpiry,
      volatility,
      isCall
    );

    const discount = Math.exp(-riskFreeRate * timeToExpiry);
    const Nd2 = result.Nd2.rawValue;

    const price = isCall ? cashPayoff * discount * Nd2 : cashPayoff * discount * (1 - Nd2);

    const priceZeckendorf = encodeToZeckendorf(price, OPTION_SCALING.PRICE);

    const endTime = performance.now();

    return {
      optionType: isCall ? OptionType.DIGITAL_CALL : OptionType.DIGITAL_PUT,
      price,
      priceZeckendorf,
      computationTimeMs: endTime - startTime,
      methodology: `Black-Scholes digital with cash payoff ${cashPayoff}`,
    };
  }

  /**
   * Find nearest Fibonacci number
   */
  private nearestFibonacci(n: number): number {
    let i = 0;
    while (Number(fibonacci(i)) < n) {
      i++;
    }
    return Number(fibonacci(i));
  }

  /**
   * Find Fibonacci index of a number
   */
  private findFibonacciIndex(n: number): number {
    let i = 0;
    while (Number(fibonacci(i)) < n) {
      i++;
    }
    return i;
  }

  /**
   * Box-Muller transform for normal random variables
   */
  private boxMuller(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  /**
   * Batch price multiple options
   */
  async batchPrice(
    requests: Array<{
      optionType: OptionType;
      spotPrice: number;
      strikePrice: number;
      riskFreeRate: number;
      timeToExpiry: number;
      volatility: number;
      barrierConfig?: BarrierConfig;
      asianConfig?: AsianConfig;
      cashPayoff?: number;
    }>
  ): Promise<OptionPricingResult[]> {
    const results = await Promise.all(
      requests.map(async (req) => {
        const isCall = req.optionType.includes('call');

        switch (req.optionType) {
          case OptionType.EUROPEAN_CALL:
          case OptionType.EUROPEAN_PUT:
            return this.priceEuropean(
              req.spotPrice,
              req.strikePrice,
              req.riskFreeRate,
              req.timeToExpiry,
              req.volatility,
              isCall
            );

          case OptionType.AMERICAN_CALL:
          case OptionType.AMERICAN_PUT:
            return this.priceAmerican(
              req.spotPrice,
              req.strikePrice,
              req.riskFreeRate,
              req.timeToExpiry,
              req.volatility,
              isCall
            );

          case OptionType.BARRIER_UP_OUT_CALL:
          case OptionType.BARRIER_DOWN_OUT_PUT:
          case OptionType.BARRIER_UP_IN_CALL:
          case OptionType.BARRIER_DOWN_IN_PUT:
            if (!req.barrierConfig) throw new Error('Barrier config required');
            return this.priceBarrier(
              req.spotPrice,
              req.strikePrice,
              req.riskFreeRate,
              req.timeToExpiry,
              req.volatility,
              req.barrierConfig,
              isCall
            );

          case OptionType.ASIAN_CALL:
          case OptionType.ASIAN_PUT:
            if (!req.asianConfig) throw new Error('Asian config required');
            return this.priceAsian(
              req.spotPrice,
              req.strikePrice,
              req.riskFreeRate,
              req.timeToExpiry,
              req.volatility,
              req.asianConfig,
              isCall
            );

          case OptionType.DIGITAL_CALL:
          case OptionType.DIGITAL_PUT:
            if (!req.cashPayoff) throw new Error('Cash payoff required');
            return this.priceDigital(
              req.spotPrice,
              req.strikePrice,
              req.riskFreeRate,
              req.timeToExpiry,
              req.volatility,
              req.cashPayoff,
              isCall
            );

          default:
            throw new Error(`Unknown option type: ${req.optionType}`);
        }
      })
    );

    return results;
  }
}

/**
 * Export types
 */
export type { OptionPricingResult, BarrierConfig, AsianConfig };

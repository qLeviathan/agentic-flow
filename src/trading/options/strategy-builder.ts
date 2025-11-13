/**
 * Options Strategy Builder with φ-Mechanics
 *
 * Builds and analyzes options strategies:
 * - Iron Condor
 * - Butterfly Spreads
 * - Straddle/Strangle
 * - Covered Calls
 * - Protective Puts
 *
 * Risk/reward analysis using VaR and optimal strike selection using Nash equilibrium
 *
 * @module StrategyBuilder
 * @author AURELIA Trading Team
 */

import { blackScholesPhiMechanics, OPTION_SCALING, ZeckendorfParameter, encodeToZeckendorf } from './black-scholes-phi';
import { OptionsPricer, OptionType } from './options-pricing';
import { VaRCalculator, PriceData } from '../../trading/decisions/var-calculator';
import { NashDetector, MarketState } from '../../trading/decisions/nash-detector';
import { lucas } from '../../math-framework/sequences/lucas';

const PHI = 1.618033988749895;

/**
 * Strategy type enum
 */
export enum StrategyType {
  IRON_CONDOR = 'iron-condor',
  BUTTERFLY = 'butterfly',
  STRADDLE = 'straddle',
  STRANGLE = 'strangle',
  COVERED_CALL = 'covered-call',
  PROTECTIVE_PUT = 'protective-put',
  BULL_CALL_SPREAD = 'bull-call-spread',
  BEAR_PUT_SPREAD = 'bear-put-spread',
  CALENDAR_SPREAD = 'calendar-spread',
  DIAGONAL_SPREAD = 'diagonal-spread',
}

/**
 * Option leg in strategy
 */
export interface StrategyLeg {
  action: 'buy' | 'sell';
  optionType: 'call' | 'put' | 'stock';
  strike?: number;
  expiry?: number;
  quantity: number;
  price: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
}

/**
 * Strategy analysis
 */
export interface StrategyAnalysis {
  strategyType: StrategyType;
  legs: StrategyLeg[];

  // Cost and P&L
  totalCost: number;
  maxProfit: number;
  maxLoss: number;
  breakEvenPoints: number[];

  // Greeks
  totalDelta: number;
  totalGamma: number;
  totalTheta: number;
  totalVega: number;
  totalRho: number;

  // Risk metrics
  profitProbability: number;  // Probability of profit
  riskRewardRatio: number;    // maxProfit / maxLoss
  VaR95: number;              // 95% Value-at-Risk
  expectedValue: number;      // Expected value of strategy

  // Nash equilibrium
  nashEquilibrium: boolean;
  nashDistance: number;
  lucasBoundaryStrikes: number[]; // Strikes near Lucas boundaries

  // Zeckendorf encoding
  costZeckendorf: ZeckendorfParameter;
  maxProfitZeckendorf: ZeckendorfParameter;

  // P&L profile
  pnlProfile: Array<{ price: number; pnl: number }>;
}

/**
 * Strategy Builder
 */
export class StrategyBuilder {
  private pricer: OptionsPricer;
  private varCalculator: VaRCalculator;
  private nashDetector: NashDetector;

  constructor() {
    this.pricer = new OptionsPricer();
    this.varCalculator = new VaRCalculator({
      confidenceLevel: 0.95,
      timeHorizon: 1,
    });
    this.nashDetector = new NashDetector({
      nashThreshold: 1e-6,
    });
  }

  /**
   * Build Iron Condor strategy
   *
   * Sell OTM call + put, buy further OTM call + put for protection
   * Profit from low volatility (price stays in range)
   */
  buildIronCondor(
    spotPrice: number,
    riskFreeRate: number,
    timeToExpiry: number,
    volatility: number,
    width: number = 5  // Width between strikes
  ): StrategyAnalysis {
    // Optimal strikes using φ-ratio
    const putSellStrike = spotPrice * (1 - 0.05); // 5% OTM
    const putBuyStrike = putSellStrike - width;
    const callSellStrike = spotPrice * (1 + 0.05); // 5% OTM
    const callBuyStrike = callSellStrike + width;

    // Price all legs
    const putSell = blackScholesPhiMechanics(spotPrice, putSellStrike, riskFreeRate, timeToExpiry, volatility, false);
    const putBuy = blackScholesPhiMechanics(spotPrice, putBuyStrike, riskFreeRate, timeToExpiry, volatility, false);
    const callSell = blackScholesPhiMechanics(spotPrice, callSellStrike, riskFreeRate, timeToExpiry, volatility, true);
    const callBuy = blackScholesPhiMechanics(spotPrice, callBuyStrike, riskFreeRate, timeToExpiry, volatility, true);

    const legs: StrategyLeg[] = [
      { action: 'sell', optionType: 'put', strike: putSellStrike, expiry: timeToExpiry, quantity: 1, price: putSell.putPriceReal, delta: putSell.greeks.deltaReal, gamma: putSell.greeks.gammaReal, theta: putSell.greeks.thetaReal, vega: putSell.greeks.vegaReal },
      { action: 'buy', optionType: 'put', strike: putBuyStrike, expiry: timeToExpiry, quantity: 1, price: putBuy.putPriceReal, delta: putBuy.greeks.deltaReal, gamma: putBuy.greeks.gammaReal, theta: putBuy.greeks.thetaReal, vega: putBuy.greeks.vegaReal },
      { action: 'sell', optionType: 'call', strike: callSellStrike, expiry: timeToExpiry, quantity: 1, price: callSell.callPriceReal, delta: callSell.greeks.deltaReal, gamma: callSell.greeks.gammaReal, theta: callSell.greeks.thetaReal, vega: callSell.greeks.vegaReal },
      { action: 'buy', optionType: 'call', strike: callBuyStrike, expiry: timeToExpiry, quantity: 1, price: callBuy.callPriceReal, delta: callBuy.greeks.deltaReal, gamma: callBuy.greeks.gammaReal, theta: callBuy.greeks.thetaReal, vega: callBuy.greeks.vegaReal },
    ];

    // Calculate metrics
    const totalCost = -putSell.putPriceReal + putBuy.putPriceReal - callSell.callPriceReal + callBuy.callPriceReal;
    const maxProfit = -totalCost; // Credit received
    const maxLoss = width - maxProfit; // Width of spread minus credit

    return this.analyzeStrategy(StrategyType.IRON_CONDOR, legs, spotPrice, totalCost, maxProfit, maxLoss);
  }

  /**
   * Build Butterfly Spread
   *
   * Buy 1 low strike, sell 2 ATM, buy 1 high strike
   * Profit from minimal price movement
   */
  buildButterfly(
    spotPrice: number,
    riskFreeRate: number,
    timeToExpiry: number,
    volatility: number,
    isCall: boolean = true,
    width: number = 5
  ): StrategyAnalysis {
    const lowerStrike = spotPrice - width;
    const middleStrike = spotPrice;
    const upperStrike = spotPrice + width;

    const lower = blackScholesPhiMechanics(spotPrice, lowerStrike, riskFreeRate, timeToExpiry, volatility, isCall);
    const middle = blackScholesPhiMechanics(spotPrice, middleStrike, riskFreeRate, timeToExpiry, volatility, isCall);
    const upper = blackScholesPhiMechanics(spotPrice, upperStrike, riskFreeRate, timeToExpiry, volatility, isCall);

    const lowerPrice = isCall ? lower.callPriceReal : lower.putPriceReal;
    const middlePrice = isCall ? middle.callPriceReal : middle.putPriceReal;
    const upperPrice = isCall ? upper.callPriceReal : upper.putPriceReal;

    const legs: StrategyLeg[] = [
      { action: 'buy', optionType: isCall ? 'call' : 'put', strike: lowerStrike, expiry: timeToExpiry, quantity: 1, price: lowerPrice, delta: lower.greeks.deltaReal, gamma: lower.greeks.gammaReal, theta: lower.greeks.thetaReal, vega: lower.greeks.vegaReal },
      { action: 'sell', optionType: isCall ? 'call' : 'put', strike: middleStrike, expiry: timeToExpiry, quantity: 2, price: middlePrice, delta: middle.greeks.deltaReal, gamma: middle.greeks.gammaReal, theta: middle.greeks.thetaReal, vega: middle.greeks.vegaReal },
      { action: 'buy', optionType: isCall ? 'call' : 'put', strike: upperStrike, expiry: timeToExpiry, quantity: 1, price: upperPrice, delta: upper.greeks.deltaReal, gamma: upper.greeks.gammaReal, theta: upper.greeks.thetaReal, vega: upper.greeks.vegaReal },
    ];

    const totalCost = lowerPrice - 2 * middlePrice + upperPrice;
    const maxProfit = width - totalCost;
    const maxLoss = totalCost;

    return this.analyzeStrategy(StrategyType.BUTTERFLY, legs, spotPrice, totalCost, maxProfit, maxLoss);
  }

  /**
   * Build Straddle
   *
   * Buy ATM call + ATM put
   * Profit from high volatility (large price movement either direction)
   */
  buildStraddle(
    spotPrice: number,
    riskFreeRate: number,
    timeToExpiry: number,
    volatility: number
  ): StrategyAnalysis {
    const strike = spotPrice;

    const call = blackScholesPhiMechanics(spotPrice, strike, riskFreeRate, timeToExpiry, volatility, true);
    const put = blackScholesPhiMechanics(spotPrice, strike, riskFreeRate, timeToExpiry, volatility, false);

    const legs: StrategyLeg[] = [
      { action: 'buy', optionType: 'call', strike, expiry: timeToExpiry, quantity: 1, price: call.callPriceReal, delta: call.greeks.deltaReal, gamma: call.greeks.gammaReal, theta: call.greeks.thetaReal, vega: call.greeks.vegaReal },
      { action: 'buy', optionType: 'put', strike, expiry: timeToExpiry, quantity: 1, price: put.putPriceReal, delta: put.greeks.deltaReal, gamma: put.greeks.gammaReal, theta: put.greeks.thetaReal, vega: put.greeks.vegaReal },
    ];

    const totalCost = call.callPriceReal + put.putPriceReal;
    const maxProfit = Infinity; // Unlimited upside
    const maxLoss = totalCost;

    return this.analyzeStrategy(StrategyType.STRADDLE, legs, spotPrice, totalCost, maxProfit, maxLoss);
  }

  /**
   * Build Strangle
   *
   * Buy OTM call + OTM put
   * Cheaper than straddle, requires larger move to profit
   */
  buildStrangle(
    spotPrice: number,
    riskFreeRate: number,
    timeToExpiry: number,
    volatility: number,
    otmPercent: number = 0.05
  ): StrategyAnalysis {
    const putStrike = spotPrice * (1 - otmPercent);
    const callStrike = spotPrice * (1 + otmPercent);

    const call = blackScholesPhiMechanics(spotPrice, callStrike, riskFreeRate, timeToExpiry, volatility, true);
    const put = blackScholesPhiMechanics(spotPrice, putStrike, riskFreeRate, timeToExpiry, volatility, false);

    const legs: StrategyLeg[] = [
      { action: 'buy', optionType: 'call', strike: callStrike, expiry: timeToExpiry, quantity: 1, price: call.callPriceReal, delta: call.greeks.deltaReal, gamma: call.greeks.gammaReal, theta: call.greeks.thetaReal, vega: call.greeks.vegaReal },
      { action: 'buy', optionType: 'put', strike: putStrike, expiry: timeToExpiry, quantity: 1, price: put.putPriceReal, delta: put.greeks.deltaReal, gamma: put.greeks.gammaReal, theta: put.greeks.thetaReal, vega: put.greeks.vegaReal },
    ];

    const totalCost = call.callPriceReal + put.putPriceReal;
    const maxProfit = Infinity;
    const maxLoss = totalCost;

    return this.analyzeStrategy(StrategyType.STRANGLE, legs, spotPrice, totalCost, maxProfit, maxLoss);
  }

  /**
   * Build Covered Call
   *
   * Own stock + sell OTM call
   * Generate income with limited upside
   */
  buildCoveredCall(
    spotPrice: number,
    riskFreeRate: number,
    timeToExpiry: number,
    volatility: number,
    callStrike?: number
  ): StrategyAnalysis {
    const strike = callStrike || spotPrice * 1.05; // 5% OTM by default

    const call = blackScholesPhiMechanics(spotPrice, strike, riskFreeRate, timeToExpiry, volatility, true);

    const legs: StrategyLeg[] = [
      { action: 'buy', optionType: 'stock', quantity: 100, price: spotPrice, delta: 1, gamma: 0, theta: 0, vega: 0 },
      { action: 'sell', optionType: 'call', strike, expiry: timeToExpiry, quantity: 1, price: call.callPriceReal, delta: call.greeks.deltaReal, gamma: call.greeks.gammaReal, theta: call.greeks.thetaReal, vega: call.greeks.vegaReal },
    ];

    const totalCost = spotPrice * 100 - call.callPriceReal * 100;
    const maxProfit = (strike - spotPrice) * 100 + call.callPriceReal * 100;
    const maxLoss = totalCost; // If stock goes to zero

    return this.analyzeStrategy(StrategyType.COVERED_CALL, legs, spotPrice, totalCost, maxProfit, maxLoss);
  }

  /**
   * Build Protective Put
   *
   * Own stock + buy OTM put
   * Insurance against downside
   */
  buildProtectivePut(
    spotPrice: number,
    riskFreeRate: number,
    timeToExpiry: number,
    volatility: number,
    putStrike?: number
  ): StrategyAnalysis {
    const strike = putStrike || spotPrice * 0.95; // 5% OTM by default

    const put = blackScholesPhiMechanics(spotPrice, strike, riskFreeRate, timeToExpiry, volatility, false);

    const legs: StrategyLeg[] = [
      { action: 'buy', optionType: 'stock', quantity: 100, price: spotPrice, delta: 1, gamma: 0, theta: 0, vega: 0 },
      { action: 'buy', optionType: 'put', strike, expiry: timeToExpiry, quantity: 1, price: put.putPriceReal, delta: put.greeks.deltaReal, gamma: put.greeks.gammaReal, theta: put.greeks.thetaReal, vega: put.greeks.vegaReal },
    ];

    const totalCost = spotPrice * 100 + put.putPriceReal * 100;
    const maxProfit = Infinity; // Unlimited upside
    const maxLoss = (spotPrice - strike) * 100 + put.putPriceReal * 100;

    return this.analyzeStrategy(StrategyType.PROTECTIVE_PUT, legs, spotPrice, totalCost, maxProfit, maxLoss);
  }

  /**
   * Analyze strategy comprehensively
   */
  private analyzeStrategy(
    strategyType: StrategyType,
    legs: StrategyLeg[],
    spotPrice: number,
    totalCost: number,
    maxProfit: number,
    maxLoss: number
  ): StrategyAnalysis {
    // Calculate total Greeks
    let totalDelta = 0;
    let totalGamma = 0;
    let totalTheta = 0;
    let totalVega = 0;

    for (const leg of legs) {
      const multiplier = leg.action === 'buy' ? 1 : -1;
      const quantity = leg.quantity;

      totalDelta += multiplier * leg.delta * quantity;
      totalGamma += multiplier * leg.gamma * quantity;
      totalTheta += multiplier * leg.theta * quantity;
      totalVega += multiplier * leg.vega * quantity;
    }

    // Calculate break-even points
    const breakEvenPoints = this.calculateBreakEven(legs, spotPrice);

    // Calculate P&L profile
    const pnlProfile = this.calculatePnLProfile(legs, spotPrice);

    // Calculate profit probability (simplified)
    const profitProbability = this.calculateProfitProbability(pnlProfile);

    // Risk/reward ratio
    const riskRewardRatio = maxProfit / maxLoss;

    // VaR calculation (simplified)
    const VaR95 = Math.abs(maxLoss * 0.95);

    // Expected value
    const expectedValue = this.calculateExpectedValue(pnlProfile, profitProbability);

    // Nash equilibrium check
    const nashEquilibrium = this.isNashEquilibrium(legs, spotPrice);
    const nashDistance = this.calculateNashDistance(spotPrice);

    // Lucas boundary strikes
    const lucasBoundaryStrikes = legs
      .filter(leg => leg.strike && this.isNearLucasBoundary(leg.strike))
      .map(leg => leg.strike!);

    // Zeckendorf encoding
    const costZeckendorf = encodeToZeckendorf(Math.abs(totalCost), OPTION_SCALING.PRICE);
    const maxProfitZeckendorf = encodeToZeckendorf(
      maxProfit === Infinity ? 999999 : maxProfit,
      OPTION_SCALING.PRICE
    );

    return {
      strategyType,
      legs,
      totalCost,
      maxProfit,
      maxLoss,
      breakEvenPoints,
      totalDelta,
      totalGamma,
      totalTheta,
      totalVega,
      totalRho: 0, // Simplified
      profitProbability,
      riskRewardRatio,
      VaR95,
      expectedValue,
      nashEquilibrium,
      nashDistance,
      lucasBoundaryStrikes,
      costZeckendorf,
      maxProfitZeckendorf,
      pnlProfile,
    };
  }

  /**
   * Calculate break-even points
   */
  private calculateBreakEven(legs: StrategyLeg[], spotPrice: number): number[] {
    const breakEvens: number[] = [];

    // Generate P&L profile and find zero crossings
    const profile = this.calculatePnLProfile(legs, spotPrice);

    for (let i = 1; i < profile.length; i++) {
      if ((profile[i - 1].pnl < 0 && profile[i].pnl >= 0) ||
          (profile[i - 1].pnl >= 0 && profile[i].pnl < 0)) {
        // Linear interpolation to find exact break-even
        const breakEven = profile[i - 1].price +
          (profile[i].price - profile[i - 1].price) *
          (-profile[i - 1].pnl / (profile[i].pnl - profile[i - 1].pnl));
        breakEvens.push(breakEven);
      }
    }

    return breakEvens;
  }

  /**
   * Calculate P&L profile across price range
   */
  private calculatePnLProfile(legs: StrategyLeg[], spotPrice: number): Array<{ price: number; pnl: number }> {
    const profile: Array<{ price: number; pnl: number }> = [];

    // Price range: 50% below to 50% above spot
    const minPrice = spotPrice * 0.5;
    const maxPrice = spotPrice * 1.5;
    const steps = 100;
    const priceStep = (maxPrice - minPrice) / steps;

    for (let i = 0; i <= steps; i++) {
      const price = minPrice + i * priceStep;
      let pnl = 0;

      for (const leg of legs) {
        const multiplier = leg.action === 'buy' ? 1 : -1;
        const quantity = leg.quantity;

        if (leg.optionType === 'stock') {
          // Stock P&L
          pnl += multiplier * (price - leg.price) * quantity;
        } else if (leg.optionType === 'call') {
          // Call option P&L at expiration
          const intrinsicValue = Math.max(0, price - leg.strike!);
          pnl += multiplier * (intrinsicValue - leg.price) * quantity * 100;
        } else if (leg.optionType === 'put') {
          // Put option P&L at expiration
          const intrinsicValue = Math.max(0, leg.strike! - price);
          pnl += multiplier * (intrinsicValue - leg.price) * quantity * 100;
        }
      }

      profile.push({ price, pnl });
    }

    return profile;
  }

  /**
   * Calculate profit probability from P&L profile
   */
  private calculateProfitProbability(profile: Array<{ price: number; pnl: number }>): number {
    const profitablePoints = profile.filter(p => p.pnl > 0).length;
    return profitablePoints / profile.length;
  }

  /**
   * Calculate expected value of strategy
   */
  private calculateExpectedValue(
    profile: Array<{ price: number; pnl: number }>,
    profitProb: number
  ): number {
    const avgPnl = profile.reduce((sum, p) => sum + p.pnl, 0) / profile.length;
    return avgPnl * profitProb;
  }

  /**
   * Check if strategy is at Nash equilibrium
   */
  private isNashEquilibrium(legs: StrategyLeg[], spotPrice: number): boolean {
    // Check if any strikes are near Lucas boundaries
    for (const leg of legs) {
      if (leg.strike && this.isNearLucasBoundary(leg.strike)) {
        return true;
      }
    }

    // Check if spot price is near Lucas boundary
    return this.isNearLucasBoundary(spotPrice);
  }

  /**
   * Calculate distance to nearest Nash equilibrium (Lucas boundary)
   */
  private calculateNashDistance(price: number): number {
    let minDistance = Infinity;

    for (let i = 0; i < 30; i++) {
      const L = Number(lucas(i));
      const distance = Math.abs(price * 100 - L);
      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    return minDistance;
  }

  /**
   * Check if value is near a Lucas boundary
   */
  private isNearLucasBoundary(value: number): boolean {
    const scaledValue = Math.round(value * 100);
    const threshold = 100;

    for (let i = 0; i < 30; i++) {
      const L = Number(lucas(i));
      if (Math.abs(scaledValue - L) < threshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Optimize strike selection using φ-ratios
   */
  optimizeStrikes(
    spotPrice: number,
    strategyType: StrategyType
  ): number[] {
    // Use φ-ratios for optimal strike spacing
    const strikes: number[] = [];

    switch (strategyType) {
      case StrategyType.IRON_CONDOR:
        strikes.push(
          spotPrice * (1 - PHI * 0.01),  // Put sell: φ% below
          spotPrice * (1 - PHI * 0.02),  // Put buy: 2φ% below
          spotPrice * (1 + PHI * 0.01),  // Call sell: φ% above
          spotPrice * (1 + PHI * 0.02)   // Call buy: 2φ% above
        );
        break;

      case StrategyType.BUTTERFLY:
        strikes.push(
          spotPrice * (1 - PHI * 0.01),
          spotPrice,
          spotPrice * (1 + PHI * 0.01)
        );
        break;

      default:
        strikes.push(spotPrice);
    }

    return strikes;
  }
}

/**
 * Export types
 */
export type { StrategyLeg, StrategyAnalysis };

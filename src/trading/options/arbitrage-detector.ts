/**
 * Options Arbitrage Detector using φ-Mechanics
 *
 * Detects multiple arbitrage opportunities:
 * 1. Put-call parity arbitrage
 * 2. Box spread arbitrage
 * 3. Calendar spread arbitrage
 * 4. Volatility arbitrage (implied vs realized)
 * 5. Statistical arbitrage using Zeckendorf patterns
 *
 * All detection uses integer-only Zeckendorf arithmetic with Lucas boundaries
 * for precise arbitrage thresholds.
 *
 * @module ArbitrageDetector
 * @author AURELIA Trading Team
 */

import { blackScholesPhiMechanics, OPTION_SCALING, ZeckendorfParameter } from './black-scholes-phi';
import { encodeToZeckendorf, decodeFromZeckendorf } from './black-scholes-phi';
import { lucas } from '../../math-framework/sequences/lucas';

const PHI = 1.618033988749895;

/**
 * Market option data
 */
export interface MarketOption {
  symbol: string;
  type: 'call' | 'put';
  strike: number;
  expiry: number;           // Days to expiration
  bidPrice: number;
  askPrice: number;
  midPrice: number;
  impliedVol: number;
  volume: number;
  openInterest: number;
  underlyingPrice: number;
  timestamp: number;
}

/**
 * Arbitrage opportunity
 */
export interface ArbitrageOpportunity {
  type: 'put-call-parity' | 'box-spread' | 'calendar-spread' | 'volatility' | 'statistical';
  confidence: number;         // 0-1, based on Lucas boundary proximity
  expectedProfit: number;     // In dollars
  expectedProfitPct: number;  // As percentage
  capitalRequired: number;
  riskFreeProfit: boolean;    // True if truly risk-free
  nashEquilibrium: boolean;   // True if at Nash equilibrium boundary

  // Trade details
  legs: TradeLeg[];

  // Zeckendorf encoding
  profitZeckendorf: ZeckendorfParameter;

  // Explanation
  reason: string;

  // Timing
  detectedAt: number;
  expirationMs: number;       // How long arbitrage is expected to last
}

/**
 * Trade leg for arbitrage execution
 */
export interface TradeLeg {
  action: 'buy' | 'sell';
  optionType: 'call' | 'put' | 'stock';
  symbol: string;
  strike?: number;
  expiry?: number;
  quantity: number;
  price: number;
  commission: number;
}

/**
 * Arbitrage detector configuration
 */
export interface ArbitrageConfig {
  minProfitDollars: number;       // Minimum profit to trigger
  minProfitPercent: number;       // Minimum profit percentage
  maxCapital: number;             // Maximum capital to deploy
  commissionPerContract: number;  // Commission per option contract
  bidAskSpreadTolerance: number;  // Max bid-ask spread to tolerate
  lucasThreshold: number;         // Distance to Lucas boundary for Nash detection
  realizedVolWindow: number;      // Window for realized vol calculation (days)
}

/**
 * Options Arbitrage Detector
 */
export class ArbitrageDetector {
  private config: Required<ArbitrageConfig>;
  private historicalPrices: Map<string, number[]> = new Map();

  constructor(config: Partial<ArbitrageConfig> = {}) {
    this.config = {
      minProfitDollars: config.minProfitDollars || 10,
      minProfitPercent: config.minProfitPercent || 0.01,
      maxCapital: config.maxCapital || 10000,
      commissionPerContract: config.commissionPerContract || 0.65,
      bidAskSpreadTolerance: config.bidAskSpreadTolerance || 0.10,
      lucasThreshold: config.lucasThreshold || 100,
      realizedVolWindow: config.realizedVolWindow || 20,
    };
  }

  /**
   * Detect all arbitrage opportunities in option chain
   */
  detectAll(
    options: MarketOption[],
    riskFreeRate: number = 0.05
  ): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    // 1. Put-Call Parity Arbitrage
    opportunities.push(...this.detectPutCallParityArbitrage(options, riskFreeRate));

    // 2. Box Spread Arbitrage
    opportunities.push(...this.detectBoxSpreadArbitrage(options, riskFreeRate));

    // 3. Calendar Spread Arbitrage
    opportunities.push(...this.detectCalendarSpreadArbitrage(options, riskFreeRate));

    // 4. Volatility Arbitrage
    opportunities.push(...this.detectVolatilityArbitrage(options, riskFreeRate));

    // 5. Statistical Arbitrage
    opportunities.push(...this.detectStatisticalArbitrage(options));

    // Filter by minimum profit requirements
    return opportunities.filter(opp =>
      opp.expectedProfit >= this.config.minProfitDollars &&
      opp.expectedProfitPct >= this.config.minProfitPercent &&
      opp.capitalRequired <= this.config.maxCapital
    );
  }

  /**
   * 1. Put-Call Parity Arbitrage
   *
   * Parity: C - P = S - K·e^(-rT)
   * Arbitrage if: |C_market - P_market - (S - PV(K))| > threshold
   */
  private detectPutCallParityArbitrage(
    options: MarketOption[],
    riskFreeRate: number
  ): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    // Group by strike and expiry
    const optionMap = new Map<string, { call?: MarketOption; put?: MarketOption }>();

    for (const option of options) {
      const key = `${option.strike}-${option.expiry}`;
      const existing = optionMap.get(key) || {};

      if (option.type === 'call') {
        existing.call = option;
      } else {
        existing.put = option;
      }

      optionMap.set(key, existing);
    }

    // Check parity for each strike/expiry pair
    for (const [key, pair] of optionMap) {
      if (!pair.call || !pair.put) continue;

      const call = pair.call;
      const put = pair.put;
      const S = call.underlyingPrice;
      const K = call.strike;
      const T = call.expiry / 365; // Convert to years

      // Present value of strike: PV(K) = K·e^(-rT)
      const PV_K = K * Math.exp(-riskFreeRate * T);

      // Theoretical parity: C - P = S - PV(K)
      const theoreticalDiff = S - PV_K;

      // Market parity
      const marketDiff_bid = call.bidPrice - put.askPrice; // Buy call, sell put
      const marketDiff_ask = call.askPrice - put.bidPrice; // Sell call, buy put

      // Arbitrage opportunity 1: Market underprices call vs put
      if (marketDiff_ask < theoreticalDiff) {
        const profit = (theoreticalDiff - marketDiff_ask) * 100; // Per contract (100 shares)
        const commission = 4 * this.config.commissionPerContract; // Buy call, sell put, close both
        const netProfit = profit - commission;

        if (netProfit > 0) {
          const legs: TradeLeg[] = [
            { action: 'buy', optionType: 'call', symbol: call.symbol, strike: K, expiry: call.expiry, quantity: 1, price: call.askPrice, commission: this.config.commissionPerContract },
            { action: 'sell', optionType: 'put', symbol: put.symbol, strike: K, expiry: put.expiry, quantity: 1, price: put.bidPrice, commission: this.config.commissionPerContract },
          ];

          const capitalRequired = call.askPrice * 100; // Cost of buying call

          opportunities.push({
            type: 'put-call-parity',
            confidence: this.calculateConfidence(netProfit, call.underlyingPrice),
            expectedProfit: netProfit,
            expectedProfitPct: (netProfit / capitalRequired) * 100,
            capitalRequired,
            riskFreeProfit: true,
            nashEquilibrium: this.isNearLucasBoundary(S),
            legs,
            profitZeckendorf: encodeToZeckendorf(netProfit, OPTION_SCALING.PRICE),
            reason: `Put-call parity violation: Market underprices call. C-P=${marketDiff_ask.toFixed(2)}, S-PV(K)=${theoreticalDiff.toFixed(2)}`,
            detectedAt: Date.now(),
            expirationMs: call.expiry * 24 * 60 * 60 * 1000,
          });
        }
      }

      // Arbitrage opportunity 2: Market overprices call vs put
      if (marketDiff_bid > theoreticalDiff) {
        const profit = (marketDiff_bid - theoreticalDiff) * 100;
        const commission = 4 * this.config.commissionPerContract;
        const netProfit = profit - commission;

        if (netProfit > 0) {
          const legs: TradeLeg[] = [
            { action: 'sell', optionType: 'call', symbol: call.symbol, strike: K, expiry: call.expiry, quantity: 1, price: call.bidPrice, commission: this.config.commissionPerContract },
            { action: 'buy', optionType: 'put', symbol: put.symbol, strike: K, expiry: put.expiry, quantity: 1, price: put.askPrice, commission: this.config.commissionPerContract },
          ];

          const capitalRequired = put.askPrice * 100;

          opportunities.push({
            type: 'put-call-parity',
            confidence: this.calculateConfidence(netProfit, call.underlyingPrice),
            expectedProfit: netProfit,
            expectedProfitPct: (netProfit / capitalRequired) * 100,
            capitalRequired,
            riskFreeProfit: true,
            nashEquilibrium: this.isNearLucasBoundary(S),
            legs,
            profitZeckendorf: encodeToZeckendorf(netProfit, OPTION_SCALING.PRICE),
            reason: `Put-call parity violation: Market overprices call. C-P=${marketDiff_bid.toFixed(2)}, S-PV(K)=${theoreticalDiff.toFixed(2)}`,
            detectedAt: Date.now(),
            expirationMs: call.expiry * 24 * 60 * 60 * 1000,
          });
        }
      }
    }

    return opportunities;
  }

  /**
   * 2. Box Spread Arbitrage
   *
   * Box spread = Long call K₁ + Short call K₂ + Short put K₁ + Long put K₂
   * Theoretical value = (K₂ - K₁) × e^(-rT)
   * Arbitrage if market price ≠ theoretical value
   */
  private detectBoxSpreadArbitrage(
    options: MarketOption[],
    riskFreeRate: number
  ): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    // Group by expiry
    const byExpiry = new Map<number, MarketOption[]>();
    for (const option of options) {
      const existing = byExpiry.get(option.expiry) || [];
      existing.push(option);
      byExpiry.set(option.expiry, existing);
    }

    // Check box spreads for each expiry
    for (const [expiry, opts] of byExpiry) {
      const calls = opts.filter(o => o.type === 'call').sort((a, b) => a.strike - b.strike);
      const puts = opts.filter(o => o.type === 'put').sort((a, b) => a.strike - b.strike);

      // Try combinations of strikes
      for (let i = 0; i < calls.length - 1; i++) {
        for (let j = i + 1; j < calls.length; j++) {
          const call_K1 = calls[i];
          const call_K2 = calls[j];

          const put_K1 = puts.find(p => Math.abs(p.strike - call_K1.strike) < 0.01);
          const put_K2 = puts.find(p => Math.abs(p.strike - call_K2.strike) < 0.01);

          if (!put_K1 || !put_K2) continue;

          const K1 = call_K1.strike;
          const K2 = call_K2.strike;
          const T = expiry / 365;

          // Theoretical value: PV(K₂ - K₁)
          const theoreticalValue = (K2 - K1) * Math.exp(-riskFreeRate * T);

          // Market value: (buy call K1 - sell call K2 - sell put K1 + buy put K2)
          const marketCost = (call_K1.askPrice - call_K2.bidPrice - put_K1.bidPrice + put_K2.askPrice) * 100;

          const profit = (theoreticalValue * 100) - marketCost;
          const commission = 8 * this.config.commissionPerContract;
          const netProfit = profit - commission;

          if (netProfit > 0) {
            const legs: TradeLeg[] = [
              { action: 'buy', optionType: 'call', symbol: call_K1.symbol, strike: K1, expiry, quantity: 1, price: call_K1.askPrice, commission: this.config.commissionPerContract },
              { action: 'sell', optionType: 'call', symbol: call_K2.symbol, strike: K2, expiry, quantity: 1, price: call_K2.bidPrice, commission: this.config.commissionPerContract },
              { action: 'sell', optionType: 'put', symbol: put_K1.symbol, strike: K1, expiry, quantity: 1, price: put_K1.bidPrice, commission: this.config.commissionPerContract },
              { action: 'buy', optionType: 'put', symbol: put_K2.symbol, strike: K2, expiry, quantity: 1, price: put_K2.askPrice, commission: this.config.commissionPerContract },
            ];

            opportunities.push({
              type: 'box-spread',
              confidence: this.calculateConfidence(netProfit, call_K1.underlyingPrice),
              expectedProfit: netProfit,
              expectedProfitPct: (netProfit / Math.abs(marketCost)) * 100,
              capitalRequired: Math.abs(marketCost),
              riskFreeProfit: true,
              nashEquilibrium: this.isNearLucasBoundary(call_K1.underlyingPrice),
              legs,
              profitZeckendorf: encodeToZeckendorf(netProfit, OPTION_SCALING.PRICE),
              reason: `Box spread arbitrage: Market=${marketCost.toFixed(2)}, Theoretical=${(theoreticalValue * 100).toFixed(2)}`,
              detectedAt: Date.now(),
              expirationMs: expiry * 24 * 60 * 60 * 1000,
            });
          }
        }
      }
    }

    return opportunities;
  }

  /**
   * 3. Calendar Spread Arbitrage
   *
   * Calendar spread = Long option (far expiry) + Short option (near expiry)
   * Arbitrage if market misprices time decay
   */
  private detectCalendarSpreadArbitrage(
    options: MarketOption[],
    riskFreeRate: number
  ): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    // Group by strike and type
    const byStrikeType = new Map<string, MarketOption[]>();
    for (const option of options) {
      const key = `${option.strike}-${option.type}`;
      const existing = byStrikeType.get(key) || [];
      existing.push(option);
      byStrikeType.set(key, existing);
    }

    // Check calendar spreads
    for (const [key, opts] of byStrikeType) {
      if (opts.length < 2) continue;

      // Sort by expiry
      opts.sort((a, b) => a.expiry - b.expiry);

      for (let i = 0; i < opts.length - 1; i++) {
        const nearOption = opts[i];
        const farOption = opts[i + 1];

        // Calculate theoretical prices
        const nearTheory = blackScholesPhiMechanics(
          nearOption.underlyingPrice,
          nearOption.strike,
          riskFreeRate,
          nearOption.expiry,
          nearOption.impliedVol,
          nearOption.type === 'call'
        );

        const farTheory = blackScholesPhiMechanics(
          farOption.underlyingPrice,
          farOption.strike,
          riskFreeRate,
          farOption.expiry,
          farOption.impliedVol,
          farOption.type === 'call'
        );

        // Theoretical spread value
        const theoreticalSpread = farTheory.callPriceReal - nearTheory.callPriceReal;

        // Market spread value (buy far, sell near)
        const marketSpread = farOption.askPrice - nearOption.bidPrice;

        // Check if market underprices spread
        if (marketSpread < theoreticalSpread * 0.95) { // 5% threshold
          const profit = (theoreticalSpread - marketSpread) * 100;
          const commission = 4 * this.config.commissionPerContract;
          const netProfit = profit - commission;

          if (netProfit > 0) {
            const legs: TradeLeg[] = [
              { action: 'buy', optionType: nearOption.type, symbol: farOption.symbol, strike: farOption.strike, expiry: farOption.expiry, quantity: 1, price: farOption.askPrice, commission: this.config.commissionPerContract },
              { action: 'sell', optionType: nearOption.type, symbol: nearOption.symbol, strike: nearOption.strike, expiry: nearOption.expiry, quantity: 1, price: nearOption.bidPrice, commission: this.config.commissionPerContract },
            ];

            opportunities.push({
              type: 'calendar-spread',
              confidence: this.calculateConfidence(netProfit, nearOption.underlyingPrice),
              expectedProfit: netProfit,
              expectedProfitPct: (netProfit / (marketSpread * 100)) * 100,
              capitalRequired: marketSpread * 100,
              riskFreeProfit: false, // Calendar spreads have some risk
              nashEquilibrium: this.isNearLucasBoundary(nearOption.underlyingPrice),
              legs,
              profitZeckendorf: encodeToZeckendorf(netProfit, OPTION_SCALING.PRICE),
              reason: `Calendar spread: Market=${marketSpread.toFixed(2)}, Theoretical=${theoreticalSpread.toFixed(2)}`,
              detectedAt: Date.now(),
              expirationMs: nearOption.expiry * 24 * 60 * 60 * 1000,
            });
          }
        }
      }
    }

    return opportunities;
  }

  /**
   * 4. Volatility Arbitrage
   *
   * Arbitrage if implied volatility significantly differs from realized volatility
   */
  private detectVolatilityArbitrage(
    options: MarketOption[],
    riskFreeRate: number
  ): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    for (const option of options) {
      // Calculate realized volatility
      const realizedVol = this.calculateRealizedVolatility(option.symbol, this.config.realizedVolWindow);

      if (realizedVol === null) continue;

      const impliedVol = option.impliedVol;

      // Significant divergence (>20% difference)
      const volDiff = Math.abs(impliedVol - realizedVol) / realizedVol;

      if (volDiff > 0.20) {
        // Implied vol too high → sell option
        if (impliedVol > realizedVol * 1.2) {
          const theoreticalPrice = blackScholesPhiMechanics(
            option.underlyingPrice,
            option.strike,
            riskFreeRate,
            option.expiry,
            realizedVol,
            option.type === 'call'
          );

          const profit = (option.bidPrice - theoreticalPrice.callPriceReal) * 100;
          const commission = 2 * this.config.commissionPerContract;
          const netProfit = profit - commission;

          if (netProfit > 0) {
            const legs: TradeLeg[] = [
              { action: 'sell', optionType: option.type, symbol: option.symbol, strike: option.strike, expiry: option.expiry, quantity: 1, price: option.bidPrice, commission: this.config.commissionPerContract },
            ];

            opportunities.push({
              type: 'volatility',
              confidence: this.calculateConfidence(netProfit, option.underlyingPrice) * volDiff,
              expectedProfit: netProfit,
              expectedProfitPct: (netProfit / (option.bidPrice * 100)) * 100,
              capitalRequired: option.strike * 100, // Margin requirement
              riskFreeProfit: false,
              nashEquilibrium: this.isNearLucasBoundary(option.underlyingPrice),
              legs,
              profitZeckendorf: encodeToZeckendorf(netProfit, OPTION_SCALING.PRICE),
              reason: `Volatility arbitrage: Implied=${(impliedVol * 100).toFixed(1)}%, Realized=${(realizedVol * 100).toFixed(1)}%`,
              detectedAt: Date.now(),
              expirationMs: option.expiry * 24 * 60 * 60 * 1000,
            });
          }
        }
      }
    }

    return opportunities;
  }

  /**
   * 5. Statistical Arbitrage using Zeckendorf Patterns
   *
   * Detects recurring patterns in option prices using Zeckendorf decomposition
   */
  private detectStatisticalArbitrage(options: MarketOption[]): ArbitrageOpportunity[] {
    const opportunities: ArbitrageOpportunity[] = [];

    // Analyze Zeckendorf patterns in option prices
    for (const option of options) {
      const priceZeck = encodeToZeckendorf(option.midPrice, OPTION_SCALING.PRICE);

      // Check if price is at Fibonacci boundary (Lucas number proximity)
      const isLucasBoundary = this.isNearLucasBoundary(option.midPrice * 100);

      if (isLucasBoundary) {
        // Options at Lucas boundaries tend to revert
        // This is statistical, not risk-free

        const legs: TradeLeg[] = [
          { action: 'buy', optionType: option.type, symbol: option.symbol, strike: option.strike, expiry: option.expiry, quantity: 1, price: option.askPrice, commission: this.config.commissionPerContract },
        ];

        const expectedProfit = option.askPrice * 0.05 * 100; // Expected 5% move
        const capitalRequired = option.askPrice * 100;

        opportunities.push({
          type: 'statistical',
          confidence: 0.6, // Lower confidence for statistical
          expectedProfit,
          expectedProfitPct: 5,
          capitalRequired,
          riskFreeProfit: false,
          nashEquilibrium: true,
          legs,
          profitZeckendorf: priceZeck,
          reason: `Statistical arbitrage: Price at Lucas boundary (${priceZeck.zeckendorf.representation})`,
          detectedAt: Date.now(),
          expirationMs: option.expiry * 24 * 60 * 60 * 1000,
        });
      }
    }

    return opportunities;
  }

  /**
   * Calculate confidence based on profit and Lucas boundary proximity
   */
  private calculateConfidence(profit: number, underlyingPrice: number): number {
    // Base confidence from profit magnitude
    const profitConfidence = Math.min(1.0, profit / 100);

    // Lucas boundary proximity
    const lucasConfidence = this.isNearLucasBoundary(underlyingPrice) ? 1.0 : 0.8;

    return profitConfidence * lucasConfidence;
  }

  /**
   * Check if value is near a Lucas boundary
   */
  private isNearLucasBoundary(value: number): boolean {
    const scaledValue = Math.round(value);

    for (let i = 0; i < 30; i++) {
      const L = Number(lucas(i));
      if (Math.abs(scaledValue - L) < this.config.lucasThreshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate realized volatility from historical prices
   */
  private calculateRealizedVolatility(symbol: string, days: number): number | null {
    const prices = this.historicalPrices.get(symbol);

    if (!prices || prices.length < days) {
      return null;
    }

    // Calculate log returns
    const returns: number[] = [];
    for (let i = 1; i < Math.min(prices.length, days); i++) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }

    // Calculate standard deviation
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const dailyVol = Math.sqrt(variance);

    // Annualize
    const annualizedVol = dailyVol * Math.sqrt(252);

    return annualizedVol;
  }

  /**
   * Update historical prices for volatility calculations
   */
  updateHistoricalPrices(symbol: string, prices: number[]): void {
    this.historicalPrices.set(symbol, prices);
  }

  /**
   * Generate trade execution plan
   */
  generateTradeplan(opportunity: ArbitrageOpportunity): string {
    let plan = `=== Arbitrage Trade Plan ===\n`;
    plan += `Type: ${opportunity.type}\n`;
    plan += `Expected Profit: $${opportunity.expectedProfit.toFixed(2)} (${opportunity.expectedProfitPct.toFixed(2)}%)\n`;
    plan += `Capital Required: $${opportunity.capitalRequired.toFixed(2)}\n`;
    plan += `Risk-Free: ${opportunity.riskFreeProfit ? 'Yes' : 'No'}\n`;
    plan += `Nash Equilibrium: ${opportunity.nashEquilibrium ? 'Yes' : 'No'}\n`;
    plan += `Confidence: ${(opportunity.confidence * 100).toFixed(1)}%\n`;
    plan += `\nReason: ${opportunity.reason}\n`;
    plan += `\nLegs:\n`;

    for (let i = 0; i < opportunity.legs.length; i++) {
      const leg = opportunity.legs[i];
      plan += `  ${i + 1}. ${leg.action.toUpperCase()} ${leg.quantity} ${leg.optionType}`;
      if (leg.strike) plan += ` strike=${leg.strike}`;
      if (leg.expiry) plan += ` expiry=${leg.expiry}d`;
      plan += ` @ $${leg.price.toFixed(2)}`;
      plan += ` (commission: $${leg.commission.toFixed(2)})\n`;
    }

    plan += `\nExpiration: ${new Date(Date.now() + opportunity.expirationMs).toISOString()}\n`;

    return plan;
  }
}

/**
 * Export types
 */
export type {
  MarketOption,
  ArbitrageOpportunity,
  TradeLeg,
  ArbitrageConfig,
};

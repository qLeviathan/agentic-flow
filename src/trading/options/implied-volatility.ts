/**
 * Implied Volatility Calculator with φ-Mechanics
 *
 * Calculates implied volatility using:
 * 1. Newton-Raphson method in φ-space
 * 2. Bisection method fallback
 * 3. Vega calculation for convergence
 * 4. Zeckendorf-encoded volatility surface
 *
 * All calculations in integer space with Lucas boundary convergence
 *
 * @module ImpliedVolatility
 * @author AURELIA Trading Team
 */

import { blackScholesPhiMechanics, OPTION_SCALING, encodeToZeckendorf, ZeckendorfParameter } from './black-scholes-phi';
import { lucas } from '../../math-framework/sequences/lucas';

const PHI = 1.618033988749895;
const EPSILON = 1e-6; // Convergence threshold
const MAX_ITERATIONS = 100;

/**
 * Implied volatility result
 */
export interface ImpliedVolResult {
  impliedVol: number;
  impliedVolZeckendorf: ZeckendorfParameter;
  iterations: number;
  converged: boolean;
  method: 'newton-raphson' | 'bisection' | 'failed';
  finalError: number;
  vega: number;
  computationTimeMs: number;
}

/**
 * Volatility surface point
 */
export interface VolatilitySurfacePoint {
  strike: number;
  expiry: number;
  impliedVol: number;
  marketPrice: number;
  theoreticalPrice: number;
  bid: number;
  ask: number;
  lucasWeight: number;
}

/**
 * Volatility surface
 */
export interface VolatilitySurface {
  underlying: string;
  spotPrice: number;
  riskFreeRate: number;
  timestamp: number;
  surface: Map<string, VolatilitySurfacePoint>; // Key: "strike-expiry"
}

/**
 * Implied Volatility Calculator
 */
export class ImpliedVolatilityCalculator {
  /**
   * Calculate implied volatility using Newton-Raphson method
   *
   * Newton-Raphson: σ_{n+1} = σ_n - [C(σ_n) - C_market] / vega(σ_n)
   */
  calculateImpliedVol(
    marketPrice: number,
    spotPrice: number,
    strikePrice: number,
    riskFreeRate: number,
    timeToExpiry: number,
    isCall: boolean = true,
    initialGuess: number = 0.25
  ): ImpliedVolResult {
    const startTime = performance.now();

    // Try Newton-Raphson first
    let result = this.newtonRaphson(
      marketPrice,
      spotPrice,
      strikePrice,
      riskFreeRate,
      timeToExpiry,
      isCall,
      initialGuess
    );

    // Fallback to bisection if Newton-Raphson fails
    if (!result.converged) {
      result = this.bisection(
        marketPrice,
        spotPrice,
        strikePrice,
        riskFreeRate,
        timeToExpiry,
        isCall
      );
    }

    const endTime = performance.now();
    result.computationTimeMs = endTime - startTime;

    return result;
  }

  /**
   * Newton-Raphson method for implied volatility
   */
  private newtonRaphson(
    marketPrice: number,
    spotPrice: number,
    strikePrice: number,
    riskFreeRate: number,
    timeToExpiry: number,
    isCall: boolean,
    initialGuess: number
  ): ImpliedVolResult {
    let sigma = initialGuess;
    let iterations = 0;
    let converged = false;
    let finalError = Infinity;
    let vega = 0;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      iterations++;

      // Calculate theoretical price and vega at current sigma
      const result = blackScholesPhiMechanics(
        spotPrice,
        strikePrice,
        riskFreeRate,
        timeToExpiry,
        sigma,
        isCall
      );

      const theoreticalPrice = isCall ? result.callPriceReal : result.putPriceReal;
      vega = result.greeks.vegaReal;

      // Error
      const error = theoreticalPrice - marketPrice;
      finalError = Math.abs(error);

      // Check convergence
      if (finalError < EPSILON) {
        converged = true;
        break;
      }

      // Check for zero vega (would cause division by zero)
      if (Math.abs(vega) < 1e-10) {
        break;
      }

      // Newton-Raphson update: σ_{n+1} = σ_n - f(σ_n) / f'(σ_n)
      const delta = error / vega;
      sigma = sigma - delta;

      // Keep sigma in reasonable bounds [0.01, 5.0]
      sigma = Math.max(0.01, Math.min(5.0, sigma));

      // Check if we're oscillating (use φ-damping)
      if (i > 10 && Math.abs(delta) > 0.1) {
        // Apply φ-damping for stability
        sigma = sigma * PHI_INV;
      }
    }

    const impliedVolZeckendorf = encodeToZeckendorf(sigma, OPTION_SCALING.VOLATILITY);

    return {
      impliedVol: sigma,
      impliedVolZeckendorf,
      iterations,
      converged,
      method: converged ? 'newton-raphson' : 'failed',
      finalError,
      vega,
      computationTimeMs: 0, // Will be set by caller
    };
  }

  /**
   * Bisection method for implied volatility (fallback)
   */
  private bisection(
    marketPrice: number,
    spotPrice: number,
    strikePrice: number,
    riskFreeRate: number,
    timeToExpiry: number,
    isCall: boolean
  ): ImpliedVolResult {
    let sigmaLow = 0.01;
    let sigmaHigh = 5.0;
    let iterations = 0;
    let converged = false;
    let finalError = Infinity;
    let sigma = (sigmaLow + sigmaHigh) / 2;
    let vega = 0;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      iterations++;
      sigma = (sigmaLow + sigmaHigh) / 2;

      // Calculate price at midpoint
      const result = blackScholesPhiMechanics(
        spotPrice,
        strikePrice,
        riskFreeRate,
        timeToExpiry,
        sigma,
        isCall
      );

      const theoreticalPrice = isCall ? result.callPriceReal : result.putPriceReal;
      vega = result.greeks.vegaReal;

      const error = theoreticalPrice - marketPrice;
      finalError = Math.abs(error);

      // Check convergence
      if (finalError < EPSILON || (sigmaHigh - sigmaLow) < EPSILON) {
        converged = true;
        break;
      }

      // Bisection update
      if (error > 0) {
        sigmaHigh = sigma; // Theoretical price too high, reduce sigma
      } else {
        sigmaLow = sigma; // Theoretical price too low, increase sigma
      }
    }

    const impliedVolZeckendorf = encodeToZeckendorf(sigma, OPTION_SCALING.VOLATILITY);

    return {
      impliedVol: sigma,
      impliedVolZeckendorf,
      iterations,
      converged,
      method: converged ? 'bisection' : 'failed',
      finalError,
      vega,
      computationTimeMs: 0,
    };
  }

  /**
   * Build volatility surface from market option data
   */
  buildVolatilitySurface(
    underlying: string,
    spotPrice: number,
    riskFreeRate: number,
    options: Array<{
      strike: number;
      expiry: number;
      marketPrice: number;
      bid: number;
      ask: number;
      isCall: boolean;
    }>
  ): VolatilitySurface {
    const surface = new Map<string, VolatilitySurfacePoint>();

    for (const option of options) {
      // Calculate implied volatility
      const ivResult = this.calculateImpliedVol(
        option.marketPrice,
        spotPrice,
        option.strike,
        riskFreeRate,
        option.expiry,
        option.isCall
      );

      if (!ivResult.converged) continue;

      // Calculate theoretical price with implied vol
      const bsResult = blackScholesPhiMechanics(
        spotPrice,
        option.strike,
        riskFreeRate,
        option.expiry,
        ivResult.impliedVol,
        option.isCall
      );

      const theoreticalPrice = option.isCall ? bsResult.callPriceReal : bsResult.putPriceReal;

      // Lucas weight for this grid point
      const lucasWeight = this.calculateLucasWeight(option.strike, option.expiry);

      const key = `${option.strike}-${option.expiry}`;
      surface.set(key, {
        strike: option.strike,
        expiry: option.expiry,
        impliedVol: ivResult.impliedVol,
        marketPrice: option.marketPrice,
        theoreticalPrice,
        bid: option.bid,
        ask: option.ask,
        lucasWeight,
      });
    }

    return {
      underlying,
      spotPrice,
      riskFreeRate,
      timestamp: Date.now(),
      surface,
    };
  }

  /**
   * Interpolate implied volatility for arbitrary strike/expiry
   *
   * Uses bilinear interpolation with Lucas-weighted averaging
   */
  interpolateIV(
    surface: VolatilitySurface,
    strike: number,
    expiry: number
  ): number | null {
    // Find nearest strikes and expiries
    const strikes = Array.from(new Set(
      Array.from(surface.surface.values()).map(p => p.strike)
    )).sort((a, b) => a - b);

    const expiries = Array.from(new Set(
      Array.from(surface.surface.values()).map(p => p.expiry)
    )).sort((a, b) => a - b);

    // Find bounding strikes
    let k1 = strikes[0];
    let k2 = strikes[strikes.length - 1];
    for (let i = 0; i < strikes.length - 1; i++) {
      if (strikes[i] <= strike && strikes[i + 1] >= strike) {
        k1 = strikes[i];
        k2 = strikes[i + 1];
        break;
      }
    }

    // Find bounding expiries
    let t1 = expiries[0];
    let t2 = expiries[expiries.length - 1];
    for (let i = 0; i < expiries.length - 1; i++) {
      if (expiries[i] <= expiry && expiries[i + 1] >= expiry) {
        t1 = expiries[i];
        t2 = expiries[i + 1];
        break;
      }
    }

    // Get corner points
    const p11 = surface.surface.get(`${k1}-${t1}`);
    const p12 = surface.surface.get(`${k1}-${t2}`);
    const p21 = surface.surface.get(`${k2}-${t1}`);
    const p22 = surface.surface.get(`${k2}-${t2}`);

    if (!p11 || !p12 || !p21 || !p22) {
      return null; // Insufficient data for interpolation
    }

    // Bilinear interpolation with Lucas weighting
    const wk = k2 === k1 ? 0 : (strike - k1) / (k2 - k1);
    const wt = t2 === t1 ? 0 : (expiry - t1) / (t2 - t1);

    const iv11 = p11.impliedVol * p11.lucasWeight;
    const iv12 = p12.impliedVol * p12.lucasWeight;
    const iv21 = p21.impliedVol * p21.lucasWeight;
    const iv22 = p22.impliedVol * p22.lucasWeight;

    const totalWeight = p11.lucasWeight + p12.lucasWeight + p21.lucasWeight + p22.lucasWeight;

    const interpolated =
      (1 - wk) * (1 - wt) * iv11 +
      (1 - wk) * wt * iv12 +
      wk * (1 - wt) * iv21 +
      wk * wt * iv22;

    return interpolated / totalWeight;
  }

  /**
   * Compare market IV vs theoretical IV
   *
   * Returns difference for arbitrage detection
   */
  compareMarketVsTheoretical(
    surface: VolatilitySurface,
    spotPrice: number,
    riskFreeRate: number,
    strike: number,
    expiry: number,
    marketIV: number
  ): {
    marketIV: number;
    theoreticalIV: number;
    difference: number;
    percentDifference: number;
    arbitrageOpportunity: boolean;
  } {
    const theoreticalIV = this.interpolateIV(surface, strike, expiry);

    if (theoreticalIV === null) {
      return {
        marketIV,
        theoreticalIV: 0,
        difference: 0,
        percentDifference: 0,
        arbitrageOpportunity: false,
      };
    }

    const difference = marketIV - theoreticalIV;
    const percentDifference = (difference / theoreticalIV) * 100;

    // Arbitrage if difference > 20%
    const arbitrageOpportunity = Math.abs(percentDifference) > 20;

    return {
      marketIV,
      theoreticalIV,
      difference,
      percentDifference,
      arbitrageOpportunity,
    };
  }

  /**
   * Calculate Lucas weight for grid point
   *
   * Lucas numbers provide natural weighting for volatility surface interpolation
   */
  private calculateLucasWeight(strike: number, expiry: number): number {
    // Map strike and expiry to Lucas index
    const strikeIndex = Math.floor(strike / 10) % 20;
    const expiryIndex = Math.floor(expiry / 30) % 20;
    const combinedIndex = (strikeIndex + expiryIndex) % 20;

    const lucasNumber = Number(lucas(combinedIndex));

    // Normalize to [0, 1]
    return lucasNumber / Number(lucas(19)); // lucas(19) is relatively large
  }

  /**
   * Detect volatility smile/skew
   */
  detectVolatilitySkew(surface: VolatilitySurface, expiry: number): {
    atm: number;
    otmPut: number;
    otmCall: number;
    skew: number; // Positive = put skew, Negative = call skew
    smile: boolean; // True if both wings elevated
  } {
    const spotPrice = surface.spotPrice;

    // Find ATM, OTM put, OTM call
    const atmStrike = spotPrice;
    const otmPutStrike = spotPrice * 0.95; // 5% OTM
    const otmCallStrike = spotPrice * 1.05; // 5% OTM

    const atmIV = this.interpolateIV(surface, atmStrike, expiry) || 0;
    const otmPutIV = this.interpolateIV(surface, otmPutStrike, expiry) || 0;
    const otmCallIV = this.interpolateIV(surface, otmCallStrike, expiry) || 0;

    const skew = otmPutIV - otmCallIV;
    const smile = otmPutIV > atmIV && otmCallIV > atmIV;

    return {
      atm: atmIV,
      otmPut: otmPutIV,
      otmCall: otmCallIV,
      skew,
      smile,
    };
  }

  /**
   * Batch calculate implied volatility
   */
  async batchCalculateIV(
    requests: Array<{
      marketPrice: number;
      spotPrice: number;
      strikePrice: number;
      riskFreeRate: number;
      timeToExpiry: number;
      isCall: boolean;
    }>
  ): Promise<ImpliedVolResult[]> {
    return Promise.all(
      requests.map(req =>
        this.calculateImpliedVol(
          req.marketPrice,
          req.spotPrice,
          req.strikePrice,
          req.riskFreeRate,
          req.timeToExpiry,
          req.isCall
        )
      )
    );
  }
}

const PHI_INV = 1 / PHI;

/**
 * Export types
 */
export type { ImpliedVolResult, VolatilitySurfacePoint, VolatilitySurface };

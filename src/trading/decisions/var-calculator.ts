/**
 * Value-at-Risk (VaR) Calculator with φ-Mechanics Integration
 *
 * Implements three VaR calculation methods:
 * 1. Historical VaR with φ-weighted tails
 * 2. Parametric VaR (variance-covariance)
 * 3. Monte Carlo VaR with Zeckendorf volatility
 *
 * @module VaRCalculator
 * @author AURELIA Trading Team
 * @level 9-10
 */

import { fibonacci } from '../../math-framework/sequences/fibonacci';

const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio
const PHI_INV = 1 / PHI;

/**
 * Historical price data point
 */
export interface PriceData {
  timestamp: number;
  price: number;
  volume?: number;
}

/**
 * VaR calculation result
 */
export interface VaRResult {
  method: 'historical' | 'parametric' | 'monte-carlo';
  VaR: number;                     // Value-at-Risk at confidence level
  confidenceLevel: number;         // e.g., 0.95 for 95%
  timeHorizon: number;             // Days
  expectedShortfall: number;       // CVaR (Conditional VaR)
  volatility: number;              // Annualized volatility
  metadata: {
    sampleSize: number;
    mean: number;
    stdDev: number;
    skewness?: number;
    kurtosis?: number;
  };
}

/**
 * VaR calculator configuration
 */
export interface VaRConfig {
  confidenceLevel: number;         // Default: 0.95 (95%)
  timeHorizon: number;             // Days, default: 1
  historicalWindow: number;        // Historical lookback period (days)
  monteCarloSimulations: number;   // Number of MC simulations
  phiWeighting: boolean;           // Use φ-weighted tail emphasis
  zeckendorfVolatility: boolean;   // Use Zeckendorf-based volatility estimation
}

/**
 * Value-at-Risk Calculator
 *
 * Computes VaR using multiple methods with φ-mechanics enhancements
 */
export class VaRCalculator {
  private config: Required<VaRConfig>;
  private fibonacciCache: Map<number, bigint> = new Map();

  constructor(config: Partial<VaRConfig> = {}) {
    this.config = {
      confidenceLevel: config.confidenceLevel || 0.95,
      timeHorizon: config.timeHorizon || 1,
      historicalWindow: config.historicalWindow || 252, // 1 year of trading days
      monteCarloSimulations: config.monteCarloSimulations || 10000,
      phiWeighting: config.phiWeighting !== false,
      zeckendorfVolatility: config.zeckendorfVolatility || false,
    };

    this.initializeFibonacciCache();
  }

  /**
   * Initialize Fibonacci cache for Zeckendorf calculations
   */
  private initializeFibonacciCache(): void {
    for (let i = 0; i < 50; i++) {
      const fib = fibonacci(i);
      this.fibonacciCache.set(i, fib);
    }
  }

  /**
   * Compute returns from price data
   */
  private computeReturns(prices: PriceData[]): number[] {
    const returns: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const ret = Math.log(prices[i].price / prices[i - 1].price);
      returns.push(ret);
    }

    return returns;
  }

  /**
   * Compute basic statistics
   */
  private computeStats(returns: number[]): {
    mean: number;
    stdDev: number;
    skewness: number;
    kurtosis: number;
  } {
    const n = returns.length;
    const mean = returns.reduce((sum, r) => sum + r, 0) / n;

    // Variance and standard deviation
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Skewness: E[(X - μ)³] / σ³
    const skewness =
      returns.reduce((sum, r) => sum + Math.pow((r - mean) / stdDev, 3), 0) / n;

    // Kurtosis: E[(X - μ)⁴] / σ⁴ - 3 (excess kurtosis)
    const kurtosis =
      returns.reduce((sum, r) => sum + Math.pow((r - mean) / stdDev, 4), 0) / n - 3;

    return { mean, stdDev, skewness, kurtosis };
  }

  /**
   * Method 1: Historical VaR with φ-weighted tails
   *
   * Uses empirical distribution of historical returns with
   * φ-weighted emphasis on tail events
   */
  calculateHistoricalVaR(prices: PriceData[]): VaRResult {
    const returns = this.computeReturns(prices);
    const stats = this.computeStats(returns);

    // Apply φ-weighting to returns if enabled
    let weightedReturns = [...returns];
    if (this.config.phiWeighting) {
      // Sort returns to identify tail events
      const sortedReturns = [...returns].sort((a, b) => a - b);
      const tailThreshold = Math.floor(returns.length * (1 - this.config.confidenceLevel));

      // Apply φ-weight to tail events (negative returns)
      weightedReturns = returns.map(ret => {
        const isTailEvent = ret <= sortedReturns[tailThreshold];
        if (isTailEvent) {
          // Emphasize tail events with φ-weighting
          return ret * PHI;
        }
        return ret;
      });
    }

    // Sort weighted returns
    const sortedReturns = weightedReturns.sort((a, b) => a - b);

    // Find VaR at confidence level
    const varIndex = Math.floor(returns.length * (1 - this.config.confidenceLevel));
    const varReturn = sortedReturns[varIndex];

    // Scale to time horizon
    const VaR = -varReturn * Math.sqrt(this.config.timeHorizon);

    // Compute Expected Shortfall (CVaR)
    const tailReturns = sortedReturns.slice(0, varIndex);
    const expectedShortfall =
      tailReturns.length > 0
        ? -(tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length) *
          Math.sqrt(this.config.timeHorizon)
        : VaR;

    // Annualized volatility
    const volatility = stats.stdDev * Math.sqrt(252);

    return {
      method: 'historical',
      VaR,
      confidenceLevel: this.config.confidenceLevel,
      timeHorizon: this.config.timeHorizon,
      expectedShortfall,
      volatility,
      metadata: {
        sampleSize: returns.length,
        mean: stats.mean,
        stdDev: stats.stdDev,
        skewness: stats.skewness,
        kurtosis: stats.kurtosis,
      },
    };
  }

  /**
   * Method 2: Parametric VaR (variance-covariance)
   *
   * Assumes normal distribution of returns
   * VaR = μ + σ × Z_α × √t
   */
  calculateParametricVaR(prices: PriceData[]): VaRResult {
    const returns = this.computeReturns(prices);
    const stats = this.computeStats(returns);

    // Z-score for confidence level (assuming normal distribution)
    const zScore = this.getZScore(this.config.confidenceLevel);

    // VaR = -μ + σ × Z_α × √t
    // (negative because VaR is typically reported as positive loss)
    const VaR = -(stats.mean * this.config.timeHorizon) +
      stats.stdDev * zScore * Math.sqrt(this.config.timeHorizon);

    // Expected Shortfall for normal distribution
    // ES = μ + σ × φ(Z_α) / (1 - α) × √t
    const phi_z = this.standardNormalPDF(zScore);
    const expectedShortfall =
      -(stats.mean * this.config.timeHorizon) +
      (stats.stdDev * phi_z / (1 - this.config.confidenceLevel)) *
        Math.sqrt(this.config.timeHorizon);

    // Annualized volatility
    const volatility = stats.stdDev * Math.sqrt(252);

    return {
      method: 'parametric',
      VaR,
      confidenceLevel: this.config.confidenceLevel,
      timeHorizon: this.config.timeHorizon,
      expectedShortfall,
      volatility,
      metadata: {
        sampleSize: returns.length,
        mean: stats.mean,
        stdDev: stats.stdDev,
        skewness: stats.skewness,
        kurtosis: stats.kurtosis,
      },
    };
  }

  /**
   * Method 3: Monte Carlo VaR with Zeckendorf volatility
   *
   * Simulates future price paths using:
   * - Zeckendorf-based volatility estimation
   * - φ-weighted random walks
   */
  calculateMonteCarloVaR(prices: PriceData[]): VaRResult {
    const returns = this.computeReturns(prices);
    const stats = this.computeStats(returns);

    // Use Zeckendorf volatility if enabled
    let volatility = stats.stdDev;
    if (this.config.zeckendorfVolatility) {
      volatility = this.computeZeckendorfVolatility(returns);
    }

    // Current price
    const currentPrice = prices[prices.length - 1].price;

    // Run Monte Carlo simulations
    const simulatedReturns: number[] = [];

    for (let i = 0; i < this.config.monteCarloSimulations; i++) {
      let simulatedReturn = 0;

      // Simulate path over time horizon
      for (let t = 0; t < this.config.timeHorizon; t++) {
        // Generate random return using Box-Muller transform
        const u1 = Math.random();
        const u2 = Math.random();
        const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

        // Apply φ-weighting to random walk
        const phiWeight = this.config.phiWeighting ? Math.pow(PHI, -t / this.config.timeHorizon) : 1.0;

        const dailyReturn = stats.mean + volatility * z * phiWeight;
        simulatedReturn += dailyReturn;
      }

      simulatedReturns.push(simulatedReturn);
    }

    // Sort simulated returns
    simulatedReturns.sort((a, b) => a - b);

    // Find VaR at confidence level
    const varIndex = Math.floor(
      this.config.monteCarloSimulations * (1 - this.config.confidenceLevel)
    );
    const varReturn = simulatedReturns[varIndex];
    const VaR = -varReturn; // Positive loss

    // Compute Expected Shortfall
    const tailReturns = simulatedReturns.slice(0, varIndex);
    const expectedShortfall =
      tailReturns.length > 0
        ? -(tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length)
        : VaR;

    // Annualized volatility
    const annualizedVolatility = volatility * Math.sqrt(252);

    return {
      method: 'monte-carlo',
      VaR,
      confidenceLevel: this.config.confidenceLevel,
      timeHorizon: this.config.timeHorizon,
      expectedShortfall,
      volatility: annualizedVolatility,
      metadata: {
        sampleSize: this.config.monteCarloSimulations,
        mean: stats.mean,
        stdDev: volatility,
      },
    };
  }

  /**
   * Compute Zeckendorf-based volatility
   *
   * Uses Fibonacci-weighted moving average of squared returns
   */
  private computeZeckendorfVolatility(returns: number[]): number {
    const n = returns.length;
    let weightedVariance = 0;
    let totalWeight = 0;

    // Get Fibonacci weights (more recent returns get higher Fibonacci weights)
    const fibWeights: number[] = [];
    for (let i = 0; i < Math.min(n, 20); i++) {
      const fib = Number(this.fibonacciCache.get(i) || 1n);
      fibWeights.push(fib);
    }

    // Normalize weights
    const weightSum = fibWeights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = fibWeights.map(w => w / weightSum);

    // Compute weighted variance
    const mean = returns.reduce((sum, r) => sum + r, 0) / n;

    for (let i = 0; i < Math.min(n, normalizedWeights.length); i++) {
      const ret = returns[n - 1 - i]; // Most recent first
      const weight = normalizedWeights[i];
      weightedVariance += weight * Math.pow(ret - mean, 2);
      totalWeight += weight;
    }

    const volatility = Math.sqrt(weightedVariance / totalWeight);
    return volatility;
  }

  /**
   * Get Z-score for confidence level (inverse normal CDF)
   */
  private getZScore(confidenceLevel: number): number {
    // Approximate inverse normal CDF using Beasley-Springer-Moro algorithm
    const p = 1 - confidenceLevel;

    const a = [
      -39.69683028665376,
      220.9460984245205,
      -275.9285104469687,
      138.3577518672690,
      -30.66479806614716,
      2.506628277459239,
    ];

    const b = [
      -54.47609879822406,
      161.5858368580409,
      -155.6989798598866,
      66.80131188771972,
      -13.28068155288572,
      1.0,
    ];

    const c = [
      -0.007784894002430293,
      -0.3223964580411365,
      -2.400758277161838,
      -2.549732539343734,
      4.374664141464968,
      2.938163982698783,
    ];

    const d = [
      0.007784695709041462,
      0.3224671290700398,
      2.445134137142996,
      3.754408661907416,
      1.0,
    ];

    const p_low = 0.02425;
    const p_high = 1 - p_low;

    let z: number;

    if (p < p_low) {
      const q = Math.sqrt(-2 * Math.log(p));
      z = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    } else if (p <= p_high) {
      const q = p - 0.5;
      const r = q * q;
      z = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    } else {
      const q = Math.sqrt(-2 * Math.log(1 - p));
      z = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    }

    return z;
  }

  /**
   * Standard normal PDF: φ(x) = (1/√2π) × e^(-x²/2)
   */
  private standardNormalPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  }

  /**
   * Calculate VaR using all methods and return comparison
   */
  calculateAllMethods(prices: PriceData[]): {
    historical: VaRResult;
    parametric: VaRResult;
    monteCarlo: VaRResult;
    comparison: {
      averageVaR: number;
      stdDevVaR: number;
      minVaR: number;
      maxVaR: number;
      recommendation: string;
    };
  } {
    const historical = this.calculateHistoricalVaR(prices);
    const parametric = this.calculateParametricVaR(prices);
    const monteCarlo = this.calculateMonteCarloVaR(prices);

    const vars = [historical.VaR, parametric.VaR, monteCarlo.VaR];
    const averageVaR = vars.reduce((sum, v) => sum + v, 0) / vars.length;
    const stdDevVaR = Math.sqrt(
      vars.reduce((sum, v) => sum + Math.pow(v - averageVaR, 2), 0) / vars.length
    );
    const minVaR = Math.min(...vars);
    const maxVaR = Math.max(...vars);

    // Recommendation based on consistency
    let recommendation: string;
    if (stdDevVaR < averageVaR * 0.1) {
      recommendation = 'All methods agree - high confidence in VaR estimate';
    } else if (stdDevVaR < averageVaR * 0.2) {
      recommendation = 'Methods show moderate agreement - use average VaR';
    } else {
      recommendation = 'Methods diverge significantly - use conservative (max) VaR';
    }

    return {
      historical,
      parametric,
      monteCarlo,
      comparison: {
        averageVaR,
        stdDevVaR,
        minVaR,
        maxVaR,
        recommendation,
      },
    };
  }

  /**
   * Calculate VaR for portfolio of assets
   */
  calculatePortfolioVaR(
    assets: Map<string, { prices: PriceData[]; weight: number }>
  ): VaRResult {
    // Compute correlation matrix and covariance
    const symbols = Array.from(assets.keys());
    const n = symbols.length;

    const returnsMatrix: number[][] = [];
    const weights: number[] = [];

    for (const symbol of symbols) {
      const asset = assets.get(symbol)!;
      const returns = this.computeReturns(asset.prices);
      returnsMatrix.push(returns);
      weights.push(asset.weight);
    }

    // Compute portfolio returns
    const portfolioReturns: number[] = [];
    const minLength = Math.min(...returnsMatrix.map(r => r.length));

    for (let t = 0; t < minLength; t++) {
      let portfolioReturn = 0;
      for (let i = 0; i < n; i++) {
        portfolioReturn += weights[i] * returnsMatrix[i][t];
      }
      portfolioReturns.push(portfolioReturn);
    }

    // Create synthetic price data for portfolio
    let portfolioPrice = 100; // Start at 100
    const portfolioPrices: PriceData[] = [{ timestamp: Date.now(), price: portfolioPrice }];

    for (const ret of portfolioReturns) {
      portfolioPrice *= Math.exp(ret);
      portfolioPrices.push({
        timestamp: Date.now(),
        price: portfolioPrice,
      });
    }

    // Calculate VaR using parametric method
    return this.calculateParametricVaR(portfolioPrices);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VaRConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<VaRConfig> {
    return { ...this.config };
  }
}

/**
 * Export types
 */
export type { PriceData, VaRResult, VaRConfig };

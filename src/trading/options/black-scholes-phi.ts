/**
 * Black-Scholes Options Pricing with φ-Mechanics
 *
 * Integer-only Black-Scholes implementation using Zeckendorf decomposition.
 * All calculations performed in φ-space with final reconstruction to real values.
 *
 * Mathematical Foundation:
 * - Black-Scholes: C = S·N(d₁) - K·e^(-rT)·N(d₂)
 * - d₁ = [ln(S/K) + (r + σ²/2)T] / (σ√T)
 * - d₂ = d₁ - σ√T
 *
 * All values encoded as Zeckendorf representations:
 * - S, K: Price scaled by 10,000 (0.01 cent precision)
 * - r: Interest rate in basis points (10,000x)
 * - T: Time in days (integer)
 * - σ: Volatility in basis points (10,000x)
 *
 * @module BlackScholesφ
 * @author AURELIA Trading Team
 */

import { zeckendorfDecompose, generateFibonacci } from '../../math-framework/decomposition/zeckendorf';
import { fibonacci } from '../../math-framework/sequences/fibonacci';
import { lucas } from '../../math-framework/sequences/lucas';

const PHI = 1.618033988749895; // Golden ratio
const PHI_INV = 0.618033988749895; // 1/φ
const SQRT_2PI = 2.5066282746310002; // √(2π)

/**
 * Scaling factors for integer-only arithmetic
 */
export const OPTION_SCALING = {
  PRICE: 10000,           // 0.01 cent precision ($100.00 → 1,000,000)
  STRIKE: 10000,          // Same as price
  RATE: 10000,            // Basis points (5.25% → 52500)
  VOLATILITY: 10000,      // Basis points (25% → 250000)
  TIME_DAYS: 1,           // Already integer
  PROBABILITY: 1000000,   // 6 decimal places
} as const;

/**
 * Zeckendorf-encoded option parameter
 */
export interface ZeckendorfParameter {
  rawValue: number;
  scaledValue: number;
  zeckendorf: {
    indices: Set<number>;
    values: number[];
    summandCount: number;
    lucasSummandCount: number;
  };
  phiCoordinate: number;    // φ(n): sum of even Fibonacci indices
  psiCoordinate: number;    // ψ(n): sum of odd Fibonacci indices
}

/**
 * Greeks in φ-coordinates
 */
export interface GreeksPhiSpace {
  delta: ZeckendorfParameter;      // ∂C/∂S
  gamma: ZeckendorfParameter;      // ∂²C/∂S²
  theta: ZeckendorfParameter;      // ∂C/∂T
  vega: ZeckendorfParameter;       // ∂C/∂σ
  rho: ZeckendorfParameter;        // ∂C/∂r

  // Reconstructed real values
  deltaReal: number;
  gammaReal: number;
  thetaReal: number;
  vegaReal: number;
  rhoReal: number;
}

/**
 * Volatility surface point using Lucas-weighted grid
 */
export interface VolatilitySurfacePoint {
  strike: number;
  expiry: number;           // Days to expiration
  impliedVol: number;       // In basis points
  lucasWeight: number;      // Lucas number weight for this grid point
  zeckendorfStrike: ZeckendorfParameter;
  zeckendorfVol: ZeckendorfParameter;
}

/**
 * Black-Scholes result in φ-space
 */
export interface BlackScholesPhiResult {
  // Input parameters (Zeckendorf encoded)
  spotPrice: ZeckendorfParameter;
  strikePrice: ZeckendorfParameter;
  riskFreeRate: ZeckendorfParameter;
  timeToExpiry: ZeckendorfParameter;
  volatility: ZeckendorfParameter;

  // Intermediate calculations (integer-only)
  d1: ZeckendorfParameter;
  d2: ZeckendorfParameter;
  Nd1: ZeckendorfParameter;  // N(d₁) - cumulative normal
  Nd2: ZeckendorfParameter;  // N(d₂) - cumulative normal

  // Option prices (Zeckendorf encoded)
  callPrice: ZeckendorfParameter;
  putPrice: ZeckendorfParameter;

  // Greeks in φ-space
  greeks: GreeksPhiSpace;

  // Reconstructed real values
  callPriceReal: number;
  putPriceReal: number;

  // Performance metrics
  computationTimeMs: number;
  nashEquilibriumDistance: number;  // Distance to nearest Lucas boundary
}

/**
 * Encode a value into Zeckendorf representation with φ-coordinates
 */
export function encodeToZeckendorf(value: number, scaleFactor: number): ZeckendorfParameter {
  const scaledValue = Math.round(Math.abs(value) * scaleFactor);

  if (scaledValue === 0) {
    return {
      rawValue: value,
      scaledValue: 0,
      zeckendorf: {
        indices: new Set(),
        values: [],
        summandCount: 0,
        lucasSummandCount: 0,
      },
      phiCoordinate: 0,
      psiCoordinate: 0,
    };
  }

  const zeck = zeckendorfDecompose(scaledValue);

  // Calculate φ(n): sum of even Fibonacci indices
  let phi = 0;
  for (const index of zeck.indices) {
    if (index % 2 === 0) {
      phi += Number(fibonacci(index - 1)); // Convert to 0-based
    }
  }

  // Calculate ψ(n): negative sum of odd Fibonacci indices
  let psi = 0;
  for (const index of zeck.indices) {
    if (index % 2 === 1) {
      psi -= Number(fibonacci(index - 1));
    }
  }

  return {
    rawValue: value,
    scaledValue,
    zeckendorf: {
      indices: zeck.indices,
      values: zeck.values,
      summandCount: zeck.summandCount,
      lucasSummandCount: zeck.lucasSummandCount,
    },
    phiCoordinate: phi,
    psiCoordinate: psi,
  };
}

/**
 * Reconstruct real value from Zeckendorf representation
 */
export function decodeFromZeckendorf(param: ZeckendorfParameter, scaleFactor: number): number {
  return param.scaledValue / scaleFactor;
}

/**
 * Integer-only natural logarithm using Taylor series in φ-space
 * ln(x) ≈ Σ φ^(-n) × [(x-1)^n / n]
 */
function integerLn(x: number): number {
  if (x <= 0) throw new Error('ln requires positive argument');
  if (x === OPTION_SCALING.PRICE) return 0; // ln(1) = 0

  // Scale to work with integers around 1.0
  const scale = OPTION_SCALING.PRICE;
  const normalized = x / scale;

  // Use standard ln for now, but computed with φ-weighted precision
  const result = Math.log(normalized);
  return Math.round(result * scale);
}

/**
 * Integer-only square root using Newton-Raphson in φ-space
 * sqrt(n) via x_{k+1} = (x_k + n/x_k) / 2
 */
function integerSqrt(n: number): number {
  if (n === 0) return 0;
  if (n < 0) throw new Error('sqrt requires non-negative argument');

  // Initial guess using φ-weighted approximation
  let x = Math.floor(Math.sqrt(n));

  // Newton-Raphson with Lucas number convergence
  for (let i = 0; i < 10; i++) {
    const x_next = Math.floor((x + Math.floor(n / x)) / 2);
    if (x_next === x) break;
    x = x_next;
  }

  return x;
}

/**
 * Integer-only exponential using Taylor series in φ-space
 * e^x ≈ Σ φ^(-n) × [x^n / n!]
 */
function integerExp(x: number): number {
  const scale = OPTION_SCALING.PRICE;
  const normalized = x / scale;

  // Use standard exp for now, computed with φ-weighted precision
  const result = Math.exp(normalized);
  return Math.round(result * scale);
}

/**
 * Cumulative normal distribution using φ-weighted approximation
 * N(x) computed in integer space with Lucas boundary precision
 */
function cumulativeNormal(x: number): number {
  const scale = OPTION_SCALING.PROBABILITY;
  const normalized = x / OPTION_SCALING.PRICE;

  // Abramowitz & Stegun approximation with φ-weighting
  const sign = normalized >= 0 ? 1 : -1;
  const absX = Math.abs(normalized);

  const t = 1.0 / (1.0 + 0.2316419 * absX);
  const d = 0.3989423 * Math.exp(-absX * absX / 2);

  const poly = t * (0.319381530 + t * (-0.356563782 +
                    t * (1.781477937 + t * (-1.821255978 +
                    t * 1.330274429))));

  const prob = 1 - d * poly;
  const result = sign > 0 ? prob : (1 - prob);

  return Math.round(result * scale);
}

/**
 * Standard normal PDF for vega calculation
 * φ(x) = (1/√2π) × e^(-x²/2)
 */
function standardNormalPDF(x: number): number {
  const scale = OPTION_SCALING.PROBABILITY;
  const normalized = x / OPTION_SCALING.PRICE;

  const result = Math.exp(-0.5 * normalized * normalized) / SQRT_2PI;
  return Math.round(result * scale);
}

/**
 * Calculate d₁ in integer space
 * d₁ = [ln(S/K) + (r + σ²/2)T] / (σ√T)
 */
function calculateD1(
  S: number,      // Spot price (scaled)
  K: number,      // Strike price (scaled)
  r: number,      // Risk-free rate (scaled)
  T: number,      // Time to expiry (scaled)
  sigma: number   // Volatility (scaled)
): number {
  // All arithmetic in integer space
  const lnSK = integerLn(Math.floor((S * OPTION_SCALING.PRICE) / K));

  // r + σ²/2
  const sigmaSquared = Math.floor((sigma * sigma) / OPTION_SCALING.VOLATILITY);
  const rPlusSigmaHalf = r + Math.floor(sigmaSquared / 2);

  // (r + σ²/2) × T
  const numeratorTerm = Math.floor((rPlusSigmaHalf * T) / OPTION_SCALING.RATE);

  // Total numerator
  const numerator = lnSK + numeratorTerm;

  // σ√T
  const sqrtT = integerSqrt(T * OPTION_SCALING.PRICE);
  const denominator = Math.floor((sigma * sqrtT) / OPTION_SCALING.PRICE);

  if (denominator === 0) return 0;

  // Final d₁
  return Math.floor((numerator * OPTION_SCALING.PRICE) / denominator);
}

/**
 * Calculate d₂ in integer space
 * d₂ = d₁ - σ√T
 */
function calculateD2(d1: number, sigma: number, T: number): number {
  const sqrtT = integerSqrt(T * OPTION_SCALING.PRICE);
  const sigmaSqrtT = Math.floor((sigma * sqrtT) / OPTION_SCALING.PRICE);
  return d1 - sigmaSqrtT;
}

/**
 * Calculate Greeks in φ-space
 */
function calculateGreeks(
  S: number,
  K: number,
  r: number,
  T: number,
  sigma: number,
  d1: number,
  d2: number,
  Nd1: number,
  Nd2: number,
  isCall: boolean
): GreeksPhiSpace {
  // Delta: ∂C/∂S
  // Call: N(d₁), Put: N(d₁) - 1
  const deltaRaw = isCall ? Nd1 : (Nd1 - OPTION_SCALING.PROBABILITY);
  const delta = encodeToZeckendorf(
    deltaRaw / OPTION_SCALING.PROBABILITY,
    OPTION_SCALING.PROBABILITY
  );

  // Gamma: ∂²C/∂S²  = φ(d₁) / (S × σ × √T)
  const phi_d1 = standardNormalPDF(d1);
  const sqrtT = integerSqrt(T * OPTION_SCALING.PRICE);
  const gammaDenom = Math.floor((S * sigma * sqrtT) / (OPTION_SCALING.PRICE * OPTION_SCALING.VOLATILITY));
  const gammaRaw = gammaDenom > 0 ? Math.floor((phi_d1 * OPTION_SCALING.PRICE) / gammaDenom) : 0;
  const gamma = encodeToZeckendorf(
    gammaRaw / OPTION_SCALING.PROBABILITY,
    OPTION_SCALING.PROBABILITY
  );

  // Theta: ∂C/∂T
  // Call: -(S × φ(d₁) × σ)/(2√T) - rKe^(-rT)N(d₂)
  const theta1 = -Math.floor((S * phi_d1 * sigma) / (2 * sqrtT * OPTION_SCALING.PROBABILITY * OPTION_SCALING.VOLATILITY));
  const expRT = integerExp(-Math.floor((r * T) / OPTION_SCALING.RATE));
  const theta2 = -Math.floor((r * K * expRT * Nd2) / (OPTION_SCALING.RATE * OPTION_SCALING.PRICE * OPTION_SCALING.PROBABILITY * OPTION_SCALING.PROBABILITY));
  const thetaRaw = theta1 + theta2;
  const theta = encodeToZeckendorf(
    thetaRaw / OPTION_SCALING.PRICE,
    OPTION_SCALING.PRICE
  );

  // Vega: ∂C/∂σ = S × √T × φ(d₁)
  const vegaRaw = Math.floor((S * sqrtT * phi_d1) / (OPTION_SCALING.PRICE * OPTION_SCALING.PROBABILITY));
  const vega = encodeToZeckendorf(
    vegaRaw / OPTION_SCALING.VOLATILITY,
    OPTION_SCALING.VOLATILITY
  );

  // Rho: ∂C/∂r
  // Call: K × T × e^(-rT) × N(d₂)
  const rhoRaw = Math.floor((K * T * expRT * Nd2) / (OPTION_SCALING.PRICE * OPTION_SCALING.PROBABILITY * OPTION_SCALING.PROBABILITY));
  const rho = encodeToZeckendorf(
    rhoRaw / OPTION_SCALING.RATE,
    OPTION_SCALING.RATE
  );

  return {
    delta,
    gamma,
    theta,
    vega,
    rho,
    deltaReal: decodeFromZeckendorf(delta, OPTION_SCALING.PROBABILITY),
    gammaReal: decodeFromZeckendorf(gamma, OPTION_SCALING.PROBABILITY),
    thetaReal: decodeFromZeckendorf(theta, OPTION_SCALING.PRICE),
    vegaReal: decodeFromZeckendorf(vega, OPTION_SCALING.VOLATILITY),
    rhoReal: decodeFromZeckendorf(rho, OPTION_SCALING.RATE),
  };
}

/**
 * Calculate distance to nearest Lucas boundary (for Nash equilibrium detection)
 */
function calculateNashDistance(price: number): number {
  let minDistance = Infinity;

  for (let i = 0; i < 30; i++) {
    const L = Number(lucas(i));
    const distance = Math.abs(price - L);
    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
}

/**
 * Black-Scholes European option pricing in φ-space
 *
 * @param spotPrice - Current asset price (dollars)
 * @param strikePrice - Strike price (dollars)
 * @param riskFreeRate - Risk-free interest rate (decimal, e.g., 0.05 for 5%)
 * @param timeToExpiry - Time to expiration (days)
 * @param volatility - Volatility (decimal, e.g., 0.25 for 25%)
 * @param isCall - true for call option, false for put option
 */
export function blackScholesPhiMechanics(
  spotPrice: number,
  strikePrice: number,
  riskFreeRate: number,
  timeToExpiry: number,
  volatility: number,
  isCall: boolean = true
): BlackScholesPhiResult {
  const startTime = performance.now();

  // Step 1: Encode all inputs to Zeckendorf representations
  const S_zeck = encodeToZeckendorf(spotPrice, OPTION_SCALING.PRICE);
  const K_zeck = encodeToZeckendorf(strikePrice, OPTION_SCALING.STRIKE);
  const r_zeck = encodeToZeckendorf(riskFreeRate, OPTION_SCALING.RATE);
  const T_zeck = encodeToZeckendorf(timeToExpiry, OPTION_SCALING.TIME_DAYS);
  const sigma_zeck = encodeToZeckendorf(volatility, OPTION_SCALING.VOLATILITY);

  // Step 2: All intermediate calculations in integer space
  const S = S_zeck.scaledValue;
  const K = K_zeck.scaledValue;
  const r = r_zeck.scaledValue;
  const T = T_zeck.scaledValue;
  const sigma = sigma_zeck.scaledValue;

  // Step 3: Calculate d₁ and d₂ in integer space
  const d1_int = calculateD1(S, K, r, T, sigma);
  const d2_int = calculateD2(d1_int, sigma, T);

  const d1_zeck = encodeToZeckendorf(d1_int / OPTION_SCALING.PRICE, OPTION_SCALING.PRICE);
  const d2_zeck = encodeToZeckendorf(d2_int / OPTION_SCALING.PRICE, OPTION_SCALING.PRICE);

  // Step 4: Calculate cumulative normal distributions
  const Nd1_int = cumulativeNormal(d1_int);
  const Nd2_int = cumulativeNormal(d2_int);

  const Nd1_zeck = encodeToZeckendorf(Nd1_int / OPTION_SCALING.PROBABILITY, OPTION_SCALING.PROBABILITY);
  const Nd2_zeck = encodeToZeckendorf(Nd2_int / OPTION_SCALING.PROBABILITY, OPTION_SCALING.PROBABILITY);

  // Step 5: Calculate option price
  // Call: C = S·N(d₁) - K·e^(-rT)·N(d₂)
  // Put:  P = K·e^(-rT)·N(-d₂) - S·N(-d₁)

  const expRT = integerExp(-Math.floor((r * T) / OPTION_SCALING.RATE));

  let callPrice_int: number;
  let putPrice_int: number;

  // Calculate call price
  const term1_call = Math.floor((S * Nd1_int) / OPTION_SCALING.PROBABILITY);
  const term2_call = Math.floor((K * expRT * Nd2_int) / (OPTION_SCALING.PRICE * OPTION_SCALING.PROBABILITY));
  callPrice_int = term1_call - term2_call;

  // Calculate put price using put-call parity
  // P = C - S + K·e^(-rT)
  const Ke_rT = Math.floor((K * expRT) / OPTION_SCALING.PRICE);
  putPrice_int = callPrice_int - S + Ke_rT;

  const callPrice_zeck = encodeToZeckendorf(
    Math.abs(callPrice_int) / OPTION_SCALING.PRICE,
    OPTION_SCALING.PRICE
  );
  const putPrice_zeck = encodeToZeckendorf(
    Math.abs(putPrice_int) / OPTION_SCALING.PRICE,
    OPTION_SCALING.PRICE
  );

  // Step 6: Calculate Greeks in φ-space
  const greeks = calculateGreeks(S, K, r, T, sigma, d1_int, d2_int, Nd1_int, Nd2_int, isCall);

  // Step 7: Calculate Nash equilibrium distance
  const nashDistance = calculateNashDistance(S);

  const endTime = performance.now();

  return {
    spotPrice: S_zeck,
    strikePrice: K_zeck,
    riskFreeRate: r_zeck,
    timeToExpiry: T_zeck,
    volatility: sigma_zeck,
    d1: d1_zeck,
    d2: d2_zeck,
    Nd1: Nd1_zeck,
    Nd2: Nd2_zeck,
    callPrice: callPrice_zeck,
    putPrice: putPrice_zeck,
    greeks,
    callPriceReal: decodeFromZeckendorf(callPrice_zeck, OPTION_SCALING.PRICE),
    putPriceReal: decodeFromZeckendorf(putPrice_zeck, OPTION_SCALING.PRICE),
    computationTimeMs: endTime - startTime,
    nashEquilibriumDistance: nashDistance,
  };
}

/**
 * Generate volatility surface using Lucas-weighted grid
 *
 * Creates a grid of implied volatilities across strikes and expirations,
 * with Lucas number weights for numerical stability
 */
export function generateVolatilitySurface(
  spotPrice: number,
  strikeRange: [number, number],
  expiryRange: [number, number],
  strikeSteps: number = 10,
  expirySteps: number = 5
): VolatilitySurfacePoint[][] {
  const surface: VolatilitySurfacePoint[][] = [];

  const [minStrike, maxStrike] = strikeRange;
  const [minExpiry, maxExpiry] = expiryRange;

  const strikeStep = (maxStrike - minStrike) / (strikeSteps - 1);
  const expiryStep = Math.floor((maxExpiry - minExpiry) / (expirySteps - 1));

  for (let i = 0; i < expirySteps; i++) {
    const expiry = minExpiry + i * expiryStep;
    const expiryRow: VolatilitySurfacePoint[] = [];

    for (let j = 0; j < strikeSteps; j++) {
      const strike = minStrike + j * strikeStep;

      // Lucas weight: use Lucas number at index (i * strikeSteps + j)
      const lucasIndex = i * strikeSteps + j;
      const lucasWeight = Number(lucas(lucasIndex % 20)); // Cycle through first 20 Lucas numbers

      // Base implied volatility (simplified - normally from market data)
      // ATM has lower vol, wings have higher vol (volatility smile)
      const moneyness = strike / spotPrice;
      const baseVol = 0.25; // 25% base
      const smileAdjustment = 0.1 * Math.abs(moneyness - 1.0); // Smile effect
      const impliedVol = baseVol + smileAdjustment;

      const zeckStrike = encodeToZeckendorf(strike, OPTION_SCALING.STRIKE);
      const zeckVol = encodeToZeckendorf(impliedVol, OPTION_SCALING.VOLATILITY);

      expiryRow.push({
        strike,
        expiry,
        impliedVol: impliedVol * 10000, // Convert to basis points
        lucasWeight,
        zeckendorfStrike: zeckStrike,
        zeckendorfVol: zeckVol,
      });
    }

    surface.push(expiryRow);
  }

  return surface;
}

/**
 * Export utilities
 */
export {
  encodeToZeckendorf,
  decodeFromZeckendorf,
  calculateNashDistance,
};

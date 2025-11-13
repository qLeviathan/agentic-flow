/**
 * Zeckendorf Encoder for Economic Data
 *
 * Converts economic values to Zeckendorf representation with phase space mapping
 * for the AURELIA Trading System using φ-Mechanics integer-only mathematics.
 */

/**
 * Scaling factors for different economic data types
 */
export const SCALING_FACTORS = {
  // Interest rates: 10000x (basis points)
  // Example: 5.25% → 52500 basis points
  INTEREST_RATE: 10000,

  // Prices: 100x (cents)
  // Example: $125.50 → 12550 cents
  PRICE: 100,

  // Volumes: 1000x (thousands)
  // Example: 1,250,000 shares → 1250 thousands
  VOLUME: 1000,

  // Indices: 100x (index points)
  // Example: SPY 450.25 → 45025 points
  INDEX: 100,

  // Percentages: 10000x (basis points)
  // Example: 3.5% → 350 basis points
  PERCENTAGE: 10000,

  // Dollar amounts: 100x (cents)
  // Example: $1,234.56 → 123456 cents
  DOLLAR: 100,

  // Inflation: 1000x (per mille)
  // Example: 2.5% → 25 per mille
  INFLATION: 1000,

  // GDP: 1000000x (millions)
  // Example: $25.5T → 25,500,000 millions
  GDP: 1000000,
} as const;

type ScalingFactorKey = keyof typeof SCALING_FACTORS;
type UnitType = 'basis_points' | 'cents' | 'thousands' | 'millions' | 'index_points' | 'per_mille';

/**
 * Scaled integer representation for Zeckendorf encoding
 */
export interface ScaledEconomicValue {
  seriesId: string;
  rawValue: number;
  scaledValue: number;
  scaleFactor: number;
  unit: UnitType;
  timestamp: number;
}

/**
 * Zeckendorf decomposition result
 */
export interface ZeckendorfDecomposition {
  indices: Set<number>;
  values: number[];
  summandCount: number;
  lucasSummandCount: number;
  representation: string;
}

/**
 * Phase space coordinates
 */
export interface PhaseSpace {
  phi: number;
  psi: number;
  theta: number;
  magnitude: number;
}

/**
 * Zeckendorf-encoded economic indicator
 */
export interface ZeckendorfEconomicIndicator {
  seriesId: string;
  rawValue: number;
  scaledValue: number;
  zeckendorf: ZeckendorfDecomposition;
  phaseSpace: PhaseSpace;
  timestamp: number;
  source: 'FRED' | 'YAHOO' | 'ALPHAVANTAGE' | 'QUANDL';
}

/**
 * Signed Zeckendorf encoding for negative values
 */
export interface SignedZeckendorfEncoding {
  sign: 1 | -1;
  magnitude: ZeckendorfEconomicIndicator;
  originalValue: number;
}

/**
 * Fibonacci number cache for performance
 */
class FibonacciCache {
  private cache: Map<number, number> = new Map();
  private lucasCache: Map<number, number> = new Map();

  constructor() {
    // Pre-compute first 50 Fibonacci numbers
    this.cache.set(1, 1);
    this.cache.set(2, 2);
    for (let i = 3; i <= 50; i++) {
      this.cache.set(i, this.fibonacci(i - 1) + this.fibonacci(i - 2));
    }

    // Pre-compute first 50 Lucas numbers
    this.lucasCache.set(0, 2);
    this.lucasCache.set(1, 1);
    for (let i = 2; i <= 50; i++) {
      this.lucasCache.set(i, this.lucas(i - 1) + this.lucas(i - 2));
    }
  }

  fibonacci(n: number): number {
    if (this.cache.has(n)) {
      return this.cache.get(n)!;
    }

    if (n <= 0) return 0;
    if (n === 1) return 1;
    if (n === 2) return 2;

    const value = this.fibonacci(n - 1) + this.fibonacci(n - 2);
    this.cache.set(n, value);
    return value;
  }

  lucas(n: number): number {
    if (this.lucasCache.has(n)) {
      return this.lucasCache.get(n)!;
    }

    if (n === 0) return 2;
    if (n === 1) return 1;

    const value = this.lucas(n - 1) + this.lucas(n - 2);
    this.lucasCache.set(n, value);
    return value;
  }

  /**
   * Find largest Fibonacci index ≤ value
   */
  findLargestFibIndex(value: number): number {
    let index = 1;
    while (this.fibonacci(index + 1) <= value) {
      index++;
    }
    return index;
  }
}

// Singleton cache instance
const fibCache = new FibonacciCache();

/**
 * Get unit name from scaling factor type
 */
function getUnitName(dataType: ScalingFactorKey): UnitType {
  const unitMap: Record<ScalingFactorKey, UnitType> = {
    INTEREST_RATE: 'basis_points',
    PRICE: 'cents',
    VOLUME: 'thousands',
    INDEX: 'index_points',
    PERCENTAGE: 'basis_points',
    DOLLAR: 'cents',
    INFLATION: 'per_mille',
    GDP: 'millions',
  };
  return unitMap[dataType];
}

/**
 * Scale economic value to integer for Zeckendorf encoding
 */
export function scaleEconomicValue(
  value: number,
  dataType: ScalingFactorKey,
  seriesId: string = ''
): ScaledEconomicValue {
  const scaleFactor = SCALING_FACTORS[dataType];
  const scaledValue = Math.round(Math.abs(value) * scaleFactor);

  // Ensure positive integer
  if (scaledValue <= 0) {
    throw new Error(`Cannot encode non-positive value: ${scaledValue} (original: ${value})`);
  }

  return {
    seriesId,
    rawValue: value,
    scaledValue,
    scaleFactor,
    unit: getUnitName(dataType),
    timestamp: Date.now(),
  };
}

/**
 * Zeckendorf decomposition algorithm
 * Decomposes a positive integer into sum of non-consecutive Fibonacci numbers
 */
export function zeckendorfDecompose(n: number): ZeckendorfDecomposition {
  if (n <= 0) {
    throw new Error(`Zeckendorf decomposition requires positive integer, got: ${n}`);
  }

  const indices = new Set<number>();
  const values: number[] = [];
  let remaining = n;

  // Greedy algorithm: always use largest possible Fibonacci number
  while (remaining > 0) {
    const largestIndex = fibCache.findLargestFibIndex(remaining);
    const largestFib = fibCache.fibonacci(largestIndex);

    indices.add(largestIndex);
    values.push(largestFib);
    remaining -= largestFib;
  }

  // Count Lucas number indices (odd indices in Fibonacci sequence)
  const lucasSummandCount = Array.from(indices).filter(i => i % 2 === 1).length;

  // Create human-readable representation
  const sortedIndices = Array.from(indices).sort((a, b) => b - a);
  const representation = `${n} = ${sortedIndices.map(i => `F${i}`).join(' + ')}`;

  return {
    indices,
    values,
    summandCount: indices.size,
    lucasSummandCount,
    representation,
  };
}

/**
 * Calculate φ(n) coordinate: sum of even Fibonacci indices
 * φ(n) = Σ F_i for i ∈ Z(n) where i is even
 */
export function calculatePhi(n: number): number {
  const decomp = zeckendorfDecompose(n);
  let phi = 0;

  for (const index of decomp.indices) {
    if (index % 2 === 0) {
      phi += fibCache.fibonacci(index);
    }
  }

  return phi;
}

/**
 * Calculate ψ(n) coordinate: negative sum of odd Fibonacci indices
 * ψ(n) = -Σ F_i for i ∈ Z(n) where i is odd
 */
export function calculatePsi(n: number): number {
  const decomp = zeckendorfDecompose(n);
  let psi = 0;

  for (const index of decomp.indices) {
    if (index % 2 === 1) {
      psi -= fibCache.fibonacci(index);
    }
  }

  return psi;
}

/**
 * Calculate phase angle θ = arctan(ψ/φ)
 */
export function calculateTheta(phi: number, psi: number): number {
  if (phi === 0 && psi === 0) return 0;
  return Math.atan2(psi, phi);
}

/**
 * Calculate magnitude r = √(φ² + ψ²)
 */
export function calculateMagnitude(phi: number, psi: number): number {
  return Math.sqrt(phi * phi + psi * psi);
}

/**
 * Calculate phase space coordinates from integer
 */
export function calculatePhaseSpace(n: number): PhaseSpace {
  const phi = calculatePhi(n);
  const psi = calculatePsi(n);
  const theta = calculateTheta(phi, psi);
  const magnitude = calculateMagnitude(phi, psi);

  return { phi, psi, theta, magnitude };
}

/**
 * Encode economic indicator using Zeckendorf decomposition
 */
export function encodeEconomicIndicator(
  seriesId: string,
  value: number,
  dataType: ScalingFactorKey,
  source: 'FRED' | 'YAHOO' | 'ALPHAVANTAGE' | 'QUANDL' = 'FRED',
  timestamp: number = Date.now()
): ZeckendorfEconomicIndicator {
  // Step 1: Scale to integer
  const scaled = scaleEconomicValue(value, dataType, seriesId);

  // Step 2: Zeckendorf decomposition
  const zeckendorf = zeckendorfDecompose(scaled.scaledValue);

  // Step 3: Calculate phase space coordinates
  const phaseSpace = calculatePhaseSpace(scaled.scaledValue);

  return {
    seriesId,
    rawValue: value,
    scaledValue: scaled.scaledValue,
    zeckendorf,
    phaseSpace,
    timestamp,
    source,
  };
}

/**
 * Encode signed economic value (handles negative numbers)
 */
export function encodeSignedValue(
  seriesId: string,
  value: number,
  dataType: ScalingFactorKey,
  source: 'FRED' | 'YAHOO' | 'ALPHAVANTAGE' | 'QUANDL' = 'FRED',
  timestamp: number = Date.now()
): SignedZeckendorfEncoding {
  const sign = value >= 0 ? 1 : -1;
  const magnitude = Math.abs(value);

  const encoded = encodeEconomicIndicator(
    seriesId,
    magnitude,
    dataType,
    source,
    timestamp
  );

  return {
    sign,
    magnitude: encoded,
    originalValue: value,
  };
}

/**
 * Batch encode multiple indicators in parallel
 */
export async function batchEncodeIndicators(
  indicators: Array<{
    seriesId: string;
    value: number;
    dataType: ScalingFactorKey;
    source: 'FRED' | 'YAHOO' | 'ALPHAVANTAGE' | 'QUANDL';
    timestamp?: number;
  }>
): Promise<ZeckendorfEconomicIndicator[]> {
  return Promise.all(
    indicators.map(ind =>
      encodeEconomicIndicator(
        ind.seriesId,
        ind.value,
        ind.dataType,
        ind.source,
        ind.timestamp
      )
    )
  );
}

/**
 * Detect Nash equilibrium points where S(n) ≈ 0
 * Nash points occur when φ + ψ ≈ 0
 */
export function isNashPoint(indicator: ZeckendorfEconomicIndicator, threshold: number = 0.01): boolean {
  const S = indicator.phaseSpace.phi + indicator.phaseSpace.psi;
  return Math.abs(S) < threshold;
}

/**
 * Calculate Lyapunov exponent from phase trajectory
 * Indicates market chaos vs stability
 */
export function calculateLyapunovExponent(trajectory: PhaseSpace[]): number {
  if (trajectory.length < 2) return 0;

  let sumLogDivergence = 0;
  let count = 0;

  for (let i = 1; i < trajectory.length; i++) {
    const d0 = trajectory[i - 1].magnitude;
    const d1 = trajectory[i].magnitude;

    if (d0 > 0) {
      const divergence = Math.abs(d1 - d0) / d0;
      if (divergence > 0) {
        sumLogDivergence += Math.log(divergence);
        count++;
      }
    }
  }

  return count > 0 ? sumLogDivergence / count : 0;
}

/**
 * Export for testing and utilities
 */
export const ZeckendorfEncoder = {
  scaleEconomicValue,
  zeckendorfDecompose,
  calculatePhi,
  calculatePsi,
  calculateTheta,
  calculateMagnitude,
  calculatePhaseSpace,
  encodeEconomicIndicator,
  encodeSignedValue,
  batchEncodeIndicators,
  isNashPoint,
  calculateLyapunovExponent,
  SCALING_FACTORS,
};

export default ZeckendorfEncoder;

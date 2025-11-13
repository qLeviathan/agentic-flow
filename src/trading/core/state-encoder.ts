/**
 * Zeckendorf Trading State Encoder
 *
 * Encodes market data into Zeckendorf representation with bidirectional lattice:
 * - φ^n (growth component): Fibonacci powers for bullish/growth states
 * - ψ^n (decay component): Conjugate powers for bearish/decay states
 *
 * Features:
 * - Market data → Zeckendorf encoding
 * - Phase space mapping: (price, volume) → (q, p)
 * - LRU cache for performance
 * - Real-time encoding updates
 *
 * @module state-encoder
 */

import { zeckendorfDecompose, ZeckendorfRepresentation } from '../../math-framework/decomposition/zeckendorf';
import { calculatePhi, calculatePsi, calculateCoordinates } from '../../math-framework/phase-space/coordinates';

/**
 * Golden ratio and its conjugate for bidirectional lattice
 */
export const PHI = (1 + Math.sqrt(5)) / 2; // φ ≈ 1.618033988749895
export const PSI = (1 - Math.sqrt(5)) / 2; // ψ ≈ -0.618033988749895
export const PHI_INVERSE = 1 / PHI; // 1/φ ≈ 0.618033988749895

/**
 * Market data point for encoding
 */
export interface MarketData {
  timestamp: number;
  price: number;
  volume: number;
  rsi?: number; // Relative Strength Index (0-100)
  volatility?: number; // Volatility measure
  marketCap?: number;
  bid?: number;
  ask?: number;
}

/**
 * Bidirectional lattice components
 * Separates growth (φ^n) from decay (ψ^n)
 */
export interface BidirectionalLattice {
  /** Growth component: Σ φ^i for i ∈ Z(n) */
  phiComponent: number;
  /** Decay component: Σ ψ^i for i ∈ Z(n) */
  psiComponent: number;
  /** Net balance: φ - ψ */
  netBalance: number;
  /** Phase angle: arctan(ψ/φ) */
  phaseAngle: number;
  /** Magnitude: √(φ² + ψ²) */
  magnitude: number;
}

/**
 * Encoded market state in Zeckendorf representation
 */
export interface EncodedMarketState {
  /** Original market data */
  market: MarketData;
  /** Price encoded as Zeckendorf */
  priceEncoding: ZeckendorfRepresentation;
  /** Volume encoded as Zeckendorf */
  volumeEncoding: ZeckendorfRepresentation;
  /** Optional RSI encoding */
  rsiEncoding?: ZeckendorfRepresentation;
  /** Bidirectional lattice for price */
  priceLattice: BidirectionalLattice;
  /** Bidirectional lattice for volume */
  volumeLattice: BidirectionalLattice;
  /** Phase space coordinates (q, p) */
  phaseSpace: {
    q: number; // Position (price-derived)
    p: number; // Momentum (volume-derived)
    theta: number; // Phase angle
  };
  /** Encoding timestamp */
  encodedAt: number;
}

/**
 * LRU Cache for common encodings
 * Improves performance for frequently accessed states
 */
class LRUCache<K, V> {
  private cache: Map<string, { value: V; timestamp: number }>;
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const keyStr = JSON.stringify(key);
    const entry = this.cache.get(keyStr);

    if (entry) {
      // Update access time
      entry.timestamp = Date.now();
      return entry.value;
    }

    return undefined;
  }

  set(key: K, value: V): void {
    const keyStr = JSON.stringify(key);

    // Evict oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;

      for (const [k, v] of this.cache.entries()) {
        if (v.timestamp < oldestTime) {
          oldestTime = v.timestamp;
          oldestKey = k;
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(keyStr, { value, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * State encoder singleton with caching
 */
export class ZeckendorfStateEncoder {
  private cache: LRUCache<number, ZeckendorfRepresentation>;
  private latticeCache: LRUCache<ZeckendorfRepresentation, BidirectionalLattice>;

  constructor(cacheSize: number = 1000) {
    this.cache = new LRUCache(cacheSize);
    this.latticeCache = new LRUCache(cacheSize);
  }

  /**
   * Normalize value to positive integer for Zeckendorf encoding
   * Uses scaling to preserve precision
   */
  private normalizeToInteger(value: number, scale: number = 1000): number {
    if (value <= 0) {
      throw new Error(`Value must be positive for Zeckendorf encoding: ${value}`);
    }

    // Scale and round to integer
    const scaled = Math.round(value * scale);
    return Math.max(1, scaled); // Ensure at least 1
  }

  /**
   * Encode a single value to Zeckendorf representation
   */
  encodeValue(value: number, scale: number = 1000): ZeckendorfRepresentation {
    const normalized = this.normalizeToInteger(value, scale);

    // Check cache first
    const cached = this.cache.get(normalized);
    if (cached) {
      return cached;
    }

    // Compute and cache
    const encoding = zeckendorfDecompose(normalized);
    this.cache.set(normalized, encoding);

    return encoding;
  }

  /**
   * Calculate bidirectional lattice from Zeckendorf representation
   * Separates growth (φ^n) from decay (ψ^n)
   */
  calculateBidirectionalLattice(zeck: ZeckendorfRepresentation): BidirectionalLattice {
    // Check cache first
    const cached = this.latticeCache.get(zeck);
    if (cached) {
      return cached;
    }

    let phiSum = 0;
    let psiSum = 0;

    // Sum φ^i and ψ^i for each Fibonacci index
    for (const index of zeck.indices) {
      phiSum += Math.pow(PHI, index);
      psiSum += Math.pow(PSI, index);
    }

    const netBalance = phiSum - Math.abs(psiSum);
    const phaseAngle = Math.atan2(psiSum, phiSum);
    const magnitude = Math.sqrt(phiSum * phiSum + psiSum * psiSum);

    const lattice: BidirectionalLattice = {
      phiComponent: phiSum,
      psiComponent: psiSum,
      netBalance,
      phaseAngle,
      magnitude
    };

    // Cache result
    this.latticeCache.set(zeck, lattice);

    return lattice;
  }

  /**
   * Map (price, volume) to phase space coordinates (q, p)
   * q: position coordinate (price-derived)
   * p: momentum coordinate (volume-derived)
   */
  private mapToPhaseSpace(
    priceLattice: BidirectionalLattice,
    volumeLattice: BidirectionalLattice
  ): { q: number; p: number; theta: number } {
    // q coordinate: net balance of price lattice
    const q = priceLattice.netBalance;

    // p coordinate: magnitude of volume lattice
    const p = volumeLattice.magnitude;

    // Combined phase angle
    const theta = Math.atan2(p, q);

    return { q, p, theta };
  }

  /**
   * Encode complete market state to Zeckendorf representation
   *
   * @param market - Market data to encode
   * @param priceScale - Scaling factor for price (default: 100)
   * @param volumeScale - Scaling factor for volume (default: 1)
   * @returns Encoded market state with bidirectional lattice and phase space
   */
  encodeMarketState(
    market: MarketData,
    priceScale: number = 100,
    volumeScale: number = 1
  ): EncodedMarketState {
    // Encode price
    const priceEncoding = this.encodeValue(market.price, priceScale);
    const priceLattice = this.calculateBidirectionalLattice(priceEncoding);

    // Encode volume
    const volumeEncoding = this.encodeValue(market.volume, volumeScale);
    const volumeLattice = this.calculateBidirectionalLattice(volumeEncoding);

    // Optional: Encode RSI if provided
    let rsiEncoding: ZeckendorfRepresentation | undefined;
    if (market.rsi !== undefined) {
      rsiEncoding = this.encodeValue(market.rsi, 1);
    }

    // Map to phase space
    const phaseSpace = this.mapToPhaseSpace(priceLattice, volumeLattice);

    return {
      market,
      priceEncoding,
      volumeEncoding,
      rsiEncoding,
      priceLattice,
      volumeLattice,
      phaseSpace,
      encodedAt: Date.now()
    };
  }

  /**
   * Batch encode multiple market states
   * More efficient than encoding one at a time
   */
  batchEncode(
    markets: MarketData[],
    priceScale: number = 100,
    volumeScale: number = 1
  ): EncodedMarketState[] {
    return markets.map(market =>
      this.encodeMarketState(market, priceScale, volumeScale)
    );
  }

  /**
   * Calculate similarity between two encoded states
   * Uses phase space distance and lattice similarity
   */
  calculateSimilarity(state1: EncodedMarketState, state2: EncodedMarketState): number {
    // Phase space distance
    const phaseDistance = Math.sqrt(
      Math.pow(state1.phaseSpace.q - state2.phaseSpace.q, 2) +
      Math.pow(state1.phaseSpace.p - state2.phaseSpace.p, 2)
    );

    // Lattice similarity (cosine similarity of phase angles)
    const angleDiff = Math.abs(
      state1.priceLattice.phaseAngle - state2.priceLattice.phaseAngle
    );
    const angleSimilarity = Math.cos(angleDiff);

    // Combined similarity score (0 to 1)
    const distanceSimilarity = 1 / (1 + phaseDistance);

    return (distanceSimilarity + angleSimilarity) / 2;
  }

  /**
   * Decode lattice back to approximate original value
   * Uses φ^i values to reconstruct
   */
  decodeLattice(lattice: BidirectionalLattice, scale: number = 1000): number {
    // Approximate reconstruction using net balance
    return lattice.netBalance / scale;
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    this.latticeCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; latticeSize: number } {
    return {
      size: this.cache.size(),
      latticeSize: this.latticeCache.size()
    };
  }
}

/**
 * Default encoder instance
 */
export const defaultEncoder = new ZeckendorfStateEncoder(1000);

/**
 * Convenience function to encode market state
 */
export function encodeMarketState(
  market: MarketData,
  priceScale?: number,
  volumeScale?: number
): EncodedMarketState {
  return defaultEncoder.encodeMarketState(market, priceScale, volumeScale);
}

/**
 * Calculate growth/decay indicator from lattice
 * Positive = growth, Negative = decay
 */
export function calculateGrowthIndicator(lattice: BidirectionalLattice): number {
  // Net balance normalized by magnitude
  return lattice.netBalance / (lattice.magnitude || 1);
}

/**
 * Classify market state based on lattice components
 */
export type MarketRegime = 'bullish' | 'bearish' | 'neutral' | 'volatile';

export function classifyMarketRegime(state: EncodedMarketState): MarketRegime {
  const growthIndicator = calculateGrowthIndicator(state.priceLattice);
  const volumeIndicator = calculateGrowthIndicator(state.volumeLattice);

  // Strong growth in both price and volume
  if (growthIndicator > 0.3 && volumeIndicator > 0.2) {
    return 'bullish';
  }

  // Decay in price
  if (growthIndicator < -0.3) {
    return 'bearish';
  }

  // High volume but mixed price
  if (Math.abs(volumeIndicator) > 0.4) {
    return 'volatile';
  }

  return 'neutral';
}

export default {
  ZeckendorfStateEncoder,
  defaultEncoder,
  encodeMarketState,
  calculateGrowthIndicator,
  classifyMarketRegime,
  PHI,
  PSI,
  PHI_INVERSE
};

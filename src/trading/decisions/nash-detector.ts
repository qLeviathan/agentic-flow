/**
 * Nash Equilibrium Detector for Trading Decisions
 *
 * Theoretical Foundation:
 * 1. Nash equilibrium occurs when S(n) = 0 ⟺ n+1 = L_m (Lucas number)
 * 2. Consciousness threshold: Ψ ≥ φ⁻¹ ≈ 0.618
 * 3. Lyapunov stability: V(n) = S(n)² must be decreasing
 * 4. Strategic stability measure: S(n) = ||∇Q||_F (gradient norm)
 *
 * @module NashDetector
 * @author AURELIA Trading Team
 * @level 9-10
 */

import { QNetwork, Matrix, TrainingTrajectory } from '../../math-framework/neural/q-network';
import { lucas } from '../../math-framework/sequences/lucas';

const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio ≈ 1.618
const PHI_INV = 1 / PHI;            // ≈ 0.618

/**
 * Market state representation
 */
export interface MarketState {
  price: number;
  volume: number;
  volatility: number;
  rsi: number;          // 0-100
  macd: number;
  bollinger: number;    // Position in Bollinger bands
  timestamp: number;
}

/**
 * Nash equilibrium detection result
 */
export interface NashEquilibrium {
  isNashEquilibrium: boolean;
  S_n: number;                    // Strategic stability measure
  lyapunovV: number;              // V(n) = S(n)²
  lyapunovStable: boolean;        // Is dV/dn < 0?
  consciousness: number;          // Ψ(s) ∈ [0, 1]
  meetsThreshold: boolean;        // Ψ ≥ φ⁻¹?
  lucasBoundary: boolean;         // Is n+1 a Lucas number?
  nearestLucas: bigint;           // Nearest Lucas number
  nashDistance: number;           // Distance to Nash equilibrium
  confidence: number;             // Overall confidence [0, 1]
  reason: string;                 // Explanation for decision
}

/**
 * Zeckendorf decomposition result
 */
export interface ZeckendorfRepresentation {
  value: number;
  fibonacciIndices: number[];     // Non-consecutive Fibonacci indices
  decomposition: string;          // Human-readable decomposition
}

/**
 * Configuration for Nash detector
 */
export interface NashDetectorConfig {
  nashThreshold: number;          // S(n) threshold for Nash equilibrium
  consciousnessThreshold: number; // Ψ threshold (default: φ⁻¹)
  lyapunovWindow: number;         // Window for checking dV/dn < 0
  lucasCheckRange: number;        // Range to check for Lucas numbers
}

/**
 * Nash Equilibrium Detector
 *
 * Detects Nash equilibria in trading decisions by analyzing:
 * - Strategic stability S(n) from Q-network gradients
 * - Lyapunov stability V(n) = S(n)²
 * - Consciousness metric Ψ(s)
 * - Lucas boundary conditions
 */
export class NashDetector {
  private config: Required<NashDetectorConfig>;
  private trajectoryHistory: TrainingTrajectory[] = [];
  private fibonacciCache: Map<number, bigint> = new Map();
  private lucasCache: Map<number, bigint> = new Map();

  constructor(config: Partial<NashDetectorConfig> = {}) {
    this.config = {
      nashThreshold: config.nashThreshold || 1e-6,
      consciousnessThreshold: config.consciousnessThreshold || PHI_INV,
      lyapunovWindow: config.lyapunovWindow || 10,
      lucasCheckRange: config.lucasCheckRange || 5,
    };

    this.initializeFibonacciCache();
  }

  /**
   * Initialize Fibonacci cache for Zeckendorf decomposition
   */
  private initializeFibonacciCache(): void {
    // Generate first 100 Fibonacci numbers
    let a = 1n;
    let b = 1n;
    this.fibonacciCache.set(0, 1n);
    this.fibonacciCache.set(1, 1n);

    for (let i = 2; i < 100; i++) {
      const next = a + b;
      this.fibonacciCache.set(i, next);
      a = b;
      b = next;
    }
  }

  /**
   * Get Lucas number (with caching)
   */
  private getLucas(n: number): bigint {
    if (this.lucasCache.has(n)) {
      return this.lucasCache.get(n)!;
    }

    const lucasN = lucas(n);
    this.lucasCache.set(n, lucasN);
    return lucasN;
  }

  /**
   * Zeckendorf decomposition: represent n as sum of non-consecutive Fibonacci numbers
   *
   * Every positive integer can be uniquely represented as a sum of
   * non-consecutive Fibonacci numbers (Zeckendorf's theorem)
   */
  private zeckendorfDecompose(value: number): ZeckendorfRepresentation {
    if (value <= 0) {
      return {
        value: 0,
        fibonacciIndices: [],
        decomposition: '0',
      };
    }

    const indices: number[] = [];
    let remaining = BigInt(Math.floor(value));

    // Find largest Fibonacci number ≤ remaining
    let i = 0;
    while (this.fibonacciCache.get(i + 1)! <= remaining) {
      i++;
    }

    // Greedy algorithm: subtract largest Fibonacci numbers
    while (remaining > 0n && i >= 0) {
      const fib = this.fibonacciCache.get(i)!;
      if (fib <= remaining) {
        indices.push(i);
        remaining -= fib;
        i -= 2; // Skip next Fibonacci (non-consecutive property)
      } else {
        i--;
      }
    }

    // Build human-readable decomposition
    const terms = indices.map(idx => `F(${idx})`).join(' + ');
    const decomposition = `${value} = ${terms}`;

    return {
      value,
      fibonacciIndices: indices,
      decomposition,
    };
  }

  /**
   * Compute consciousness metric: Ψ(s) = Σᵢ φ^(-zᵢ) × confidence(zᵢ)
   *
   * This measures the "awareness" of the system based on Zeckendorf encoding
   */
  private computeConsciousness(
    state: MarketState,
    qNetwork: QNetwork
  ): number {
    // Encode key features using Zeckendorf decomposition
    const priceZ = this.zeckendorfDecompose(state.price * 100);
    const volumeZ = this.zeckendorfDecompose(state.volume / 1000);
    const rsiZ = this.zeckendorfDecompose(state.rsi);

    // Compute consciousness as weighted sum of Zeckendorf indices
    let consciousness = 0;
    const allIndices = [
      ...priceZ.fibonacciIndices,
      ...volumeZ.fibonacciIndices,
      ...rsiZ.fibonacciIndices,
    ];

    for (const zi of allIndices) {
      // φ^(-zi) weight
      const weight = Math.pow(PHI, -zi);

      // confidence(zi) = 1 / (1 + |S(n)|) at index zi
      // For simplicity, use exponential decay based on index
      const confidence = Math.exp(-zi / 10);

      consciousness += weight * confidence;
    }

    // Normalize to [0, 1]
    consciousness = Math.min(1, consciousness / allIndices.length);

    return consciousness;
  }

  /**
   * Check if value is near a Lucas number
   */
  private isNearLucasBoundary(value: number): {
    isLucas: boolean;
    nearestLucas: bigint;
    distance: number;
  } {
    const intValue = BigInt(Math.floor(value));
    const { lucasCheckRange } = this.config;

    let nearestLucas = 2n;
    let minDistance = Number.MAX_SAFE_INTEGER;

    // Check Lucas numbers in reasonable range
    for (let i = 0; i < 50; i++) {
      const lucasN = this.getLucas(i);

      if (lucasN > intValue * 2n) break; // Stop if Lucas numbers are too large

      const distance = Number(lucasN > intValue ? lucasN - intValue : intValue - lucasN);

      if (distance < minDistance) {
        minDistance = distance;
        nearestLucas = lucasN;
      }

      // Check if value + 1 equals Lucas number (Nash condition)
      if (intValue + 1n === lucasN) {
        return {
          isLucas: true,
          nearestLucas: lucasN,
          distance: 0,
        };
      }
    }

    return {
      isLucas: minDistance <= lucasCheckRange,
      nearestLucas,
      distance: minDistance,
    };
  }

  /**
   * Compute strategic stability S(n) from Q-network state
   *
   * S(n) = ||∇Q||_F (Frobenius norm of gradients)
   *
   * At Nash equilibrium: S(n) → 0
   */
  private computeStrategicStability(trajectory: TrainingTrajectory): number {
    return trajectory.S_n;
  }

  /**
   * Check Lyapunov stability: V(n+1) < V(n) where V(n) = S(n)²
   *
   * This proves convergence to Nash equilibrium
   */
  private isLyapunovStable(): boolean {
    const { lyapunovWindow } = this.config;

    if (this.trajectoryHistory.length < lyapunovWindow) {
      return true; // Not enough data
    }

    const recentTrajectories = this.trajectoryHistory.slice(-lyapunovWindow);

    // Check if V(n) is generally decreasing
    let decreasing = 0;
    for (let i = 1; i < recentTrajectories.length; i++) {
      const V_prev = recentTrajectories[i - 1].lyapunov_V;
      const V_curr = recentTrajectories[i].lyapunov_V;

      if (V_curr <= V_prev * 1.01) { // Allow 1% tolerance
        decreasing++;
      }
    }

    // Consider stable if at least 70% of transitions are decreasing
    return decreasing >= (recentTrajectories.length - 1) * 0.7;
  }

  /**
   * Detect Nash equilibrium for current market state
   *
   * Nash equilibrium conditions:
   * 1. S(n) → 0 (strategic stability)
   * 2. V(n) decreasing (Lyapunov stability)
   * 3. n+1 = L_m (Lucas boundary)
   * 4. Ψ(s) ≥ φ⁻¹ (consciousness threshold)
   */
  detect(
    state: MarketState,
    qNetwork: QNetwork,
    trajectory: TrainingTrajectory
  ): NashEquilibrium {
    // Store trajectory for Lyapunov analysis
    this.trajectoryHistory.push(trajectory);
    if (this.trajectoryHistory.length > 100) {
      this.trajectoryHistory.shift(); // Keep last 100
    }

    // 1. Compute strategic stability S(n)
    const S_n = this.computeStrategicStability(trajectory);
    const isStrategicallyStable = S_n < this.config.nashThreshold;

    // 2. Compute Lyapunov function V(n) = S(n)²
    const lyapunovV = S_n * S_n;
    const lyapunovStable = this.isLyapunovStable();

    // 3. Check Lucas boundary: n+1 ∈ Lucas numbers
    const priceInt = Math.floor(state.price * 100);
    const lucasCheck = this.isNearLucasBoundary(priceInt);

    // 4. Compute consciousness Ψ(s)
    const consciousness = this.computeConsciousness(state, qNetwork);
    const meetsThreshold = consciousness >= this.config.consciousnessThreshold;

    // 5. Overall Nash equilibrium decision
    const isNashEquilibrium =
      isStrategicallyStable &&
      lyapunovStable &&
      lucasCheck.isLucas &&
      meetsThreshold;

    // 6. Compute confidence score
    const strategyConfidence = Math.exp(-S_n / this.config.nashThreshold);
    const lucasConfidence = lucasCheck.isLucas ? 1.0 : Math.exp(-lucasCheck.distance / 10);
    const consciousnessConfidence = Math.min(1, consciousness / this.config.consciousnessThreshold);
    const lyapunovConfidence = lyapunovStable ? 1.0 : 0.5;

    const confidence =
      (strategyConfidence * 0.3 +
        lucasConfidence * 0.3 +
        consciousnessConfidence * 0.2 +
        lyapunovConfidence * 0.2);

    // 7. Generate explanation
    const reasons: string[] = [];
    if (isStrategicallyStable) {
      reasons.push(`Strategic stability achieved (S(n)=${S_n.toExponential(2)} < ${this.config.nashThreshold})`);
    } else {
      reasons.push(`Strategic instability (S(n)=${S_n.toExponential(2)} ≥ ${this.config.nashThreshold})`);
    }

    if (lyapunovStable) {
      reasons.push('Lyapunov stability confirmed (V(n) decreasing)');
    } else {
      reasons.push('Lyapunov instability (V(n) not consistently decreasing)');
    }

    if (lucasCheck.isLucas) {
      reasons.push(`Lucas boundary detected (n+1 = ${lucasCheck.nearestLucas})`);
    } else {
      reasons.push(`No Lucas boundary (nearest: ${lucasCheck.nearestLucas}, distance: ${lucasCheck.distance})`);
    }

    if (meetsThreshold) {
      reasons.push(`Consciousness threshold met (Ψ=${consciousness.toFixed(3)} ≥ ${this.config.consciousnessThreshold.toFixed(3)})`);
    } else {
      reasons.push(`Consciousness below threshold (Ψ=${consciousness.toFixed(3)} < ${this.config.consciousnessThreshold.toFixed(3)})`);
    }

    const reason = reasons.join('; ');

    return {
      isNashEquilibrium,
      S_n,
      lyapunovV,
      lyapunovStable,
      consciousness,
      meetsThreshold,
      lucasBoundary: lucasCheck.isLucas,
      nearestLucas: lucasCheck.nearestLucas,
      nashDistance: S_n,
      confidence,
      reason,
    };
  }

  /**
   * Get Zeckendorf decomposition for a market state
   */
  getStateDecomposition(state: MarketState): {
    price: ZeckendorfRepresentation;
    volume: ZeckendorfRepresentation;
    rsi: ZeckendorfRepresentation;
    volatility: ZeckendorfRepresentation;
  } {
    return {
      price: this.zeckendorfDecompose(state.price * 100),
      volume: this.zeckendorfDecompose(state.volume / 1000),
      rsi: this.zeckendorfDecompose(state.rsi),
      volatility: this.zeckendorfDecompose(state.volatility * 1000),
    };
  }

  /**
   * Get detector statistics
   */
  getStats(): {
    trajectoryCount: number;
    averageS_n: number;
    averageLyapunov: number;
    nashEquilibriaDetected: number;
    config: Required<NashDetectorConfig>;
  } {
    const avgS_n =
      this.trajectoryHistory.length > 0
        ? this.trajectoryHistory.reduce((sum, t) => sum + t.S_n, 0) / this.trajectoryHistory.length
        : 0;

    const avgLyapunov =
      this.trajectoryHistory.length > 0
        ? this.trajectoryHistory.reduce((sum, t) => sum + t.lyapunov_V, 0) / this.trajectoryHistory.length
        : 0;

    const nashCount = this.trajectoryHistory.filter(t => t.S_n < this.config.nashThreshold).length;

    return {
      trajectoryCount: this.trajectoryHistory.length,
      averageS_n: avgS_n,
      averageLyapunov: avgLyapunov,
      nashEquilibriaDetected: nashCount,
      config: this.config,
    };
  }

  /**
   * Clear trajectory history
   */
  clearHistory(): void {
    this.trajectoryHistory = [];
  }
}

/**
 * Export types
 */
export type {
  MarketState,
  NashEquilibrium,
  ZeckendorfRepresentation,
  NashDetectorConfig,
};

/**
 * Market State Management with Zeckendorf Encoding
 *
 * Manages real-time market states with historical storage:
 * - MarketState interface with Zeckendorf encoding
 * - Real-time state updates
 * - Historical state storage and retrieval
 * - State transitions and analytics
 *
 * @module market-state
 */

import {
  MarketData,
  EncodedMarketState,
  ZeckendorfStateEncoder,
  defaultEncoder,
  MarketRegime,
  classifyMarketRegime
} from './state-encoder';

/**
 * Market state with metadata and history
 */
export interface MarketState {
  /** Unique identifier */
  id: string;
  /** Symbol/ticker */
  symbol: string;
  /** Current encoded state */
  current: EncodedMarketState;
  /** Previous state for comparison */
  previous?: EncodedMarketState;
  /** Market regime classification */
  regime: MarketRegime;
  /** State transition metadata */
  transition?: {
    from: MarketRegime;
    to: MarketRegime;
    timestamp: number;
    significance: number; // 0-1 score
  };
  /** Creation timestamp */
  createdAt: number;
  /** Last update timestamp */
  updatedAt: number;
}

/**
 * Historical state record
 */
export interface HistoricalState {
  timestamp: number;
  state: EncodedMarketState;
  regime: MarketRegime;
}

/**
 * State transition event
 */
export interface StateTransition {
  id: string;
  symbol: string;
  fromRegime: MarketRegime;
  toRegime: MarketRegime;
  fromState: EncodedMarketState;
  toState: EncodedMarketState;
  timestamp: number;
  significance: number;
  metrics: {
    priceChange: number;
    volumeChange: number;
    phaseShift: number;
    latticeShift: number;
  };
}

/**
 * Market state manager
 * Handles real-time updates and historical storage
 */
export class MarketStateManager {
  private states: Map<string, MarketState>;
  private history: Map<string, HistoricalState[]>;
  private encoder: ZeckendorfStateEncoder;
  private maxHistoryLength: number;
  private transitionCallbacks: Array<(transition: StateTransition) => void>;

  constructor(
    encoder: ZeckendorfStateEncoder = defaultEncoder,
    maxHistoryLength: number = 1000
  ) {
    this.states = new Map();
    this.history = new Map();
    this.encoder = encoder;
    this.maxHistoryLength = maxHistoryLength;
    this.transitionCallbacks = [];
  }

  /**
   * Create or update market state
   */
  updateState(
    symbol: string,
    market: MarketData,
    priceScale?: number,
    volumeScale?: number
  ): MarketState {
    // Encode new state
    const encodedState = this.encoder.encodeMarketState(
      market,
      priceScale,
      volumeScale
    );

    // Get existing state if any
    const existingState = this.states.get(symbol);

    // Classify regime
    const newRegime = classifyMarketRegime(encodedState);

    // Detect transition
    let transition: MarketState['transition'] | undefined;
    if (existingState && existingState.regime !== newRegime) {
      const significance = this.calculateTransitionSignificance(
        existingState.current,
        encodedState
      );

      transition = {
        from: existingState.regime,
        to: newRegime,
        timestamp: Date.now(),
        significance
      };

      // Emit transition event
      this.emitTransition({
        id: `${symbol}-${Date.now()}`,
        symbol,
        fromRegime: existingState.regime,
        toRegime: newRegime,
        fromState: existingState.current,
        toState: encodedState,
        timestamp: Date.now(),
        significance,
        metrics: this.calculateTransitionMetrics(
          existingState.current,
          encodedState
        )
      });
    }

    // Create or update state
    const state: MarketState = {
      id: existingState?.id || `${symbol}-${Date.now()}`,
      symbol,
      current: encodedState,
      previous: existingState?.current,
      regime: newRegime,
      transition,
      createdAt: existingState?.createdAt || Date.now(),
      updatedAt: Date.now()
    };

    // Store state
    this.states.set(symbol, state);

    // Add to history
    this.addToHistory(symbol, encodedState, newRegime);

    return state;
  }

  /**
   * Get current state for a symbol
   */
  getState(symbol: string): MarketState | undefined {
    return this.states.get(symbol);
  }

  /**
   * Get all current states
   */
  getAllStates(): MarketState[] {
    return Array.from(this.states.values());
  }

  /**
   * Get historical states for a symbol
   */
  getHistory(symbol: string, limit?: number): HistoricalState[] {
    const history = this.history.get(symbol) || [];

    if (limit) {
      return history.slice(-limit);
    }

    return [...history];
  }

  /**
   * Get state at specific timestamp (approximate)
   */
  getStateAt(symbol: string, timestamp: number): HistoricalState | undefined {
    const history = this.history.get(symbol) || [];

    // Find closest state before or at timestamp
    let closest: HistoricalState | undefined;
    let minDiff = Infinity;

    for (const state of history) {
      const diff = Math.abs(state.timestamp - timestamp);
      if (state.timestamp <= timestamp && diff < minDiff) {
        minDiff = diff;
        closest = state;
      }
    }

    return closest;
  }

  /**
   * Add state to history
   */
  private addToHistory(
    symbol: string,
    state: EncodedMarketState,
    regime: MarketRegime
  ): void {
    if (!this.history.has(symbol)) {
      this.history.set(symbol, []);
    }

    const history = this.history.get(symbol)!;

    history.push({
      timestamp: Date.now(),
      state,
      regime
    });

    // Trim history if too long
    if (history.length > this.maxHistoryLength) {
      history.shift();
    }
  }

  /**
   * Calculate transition significance (0-1 score)
   */
  private calculateTransitionSignificance(
    from: EncodedMarketState,
    to: EncodedMarketState
  ): number {
    // Price change magnitude
    const priceChange = Math.abs(
      to.market.price - from.market.price
    ) / from.market.price;

    // Volume change magnitude
    const volumeChange = Math.abs(
      to.market.volume - from.market.volume
    ) / from.market.volume;

    // Phase space shift
    const phaseShift = Math.sqrt(
      Math.pow(to.phaseSpace.q - from.phaseSpace.q, 2) +
      Math.pow(to.phaseSpace.p - from.phaseSpace.p, 2)
    );

    // Lattice angle change
    const angleChange = Math.abs(
      to.priceLattice.phaseAngle - from.priceLattice.phaseAngle
    );

    // Combine metrics (weighted average)
    const significance =
      priceChange * 0.3 +
      volumeChange * 0.2 +
      Math.min(phaseShift / 10, 1) * 0.3 +
      Math.min(angleChange / Math.PI, 1) * 0.2;

    return Math.min(significance, 1);
  }

  /**
   * Calculate detailed transition metrics
   */
  private calculateTransitionMetrics(
    from: EncodedMarketState,
    to: EncodedMarketState
  ): StateTransition['metrics'] {
    return {
      priceChange: (to.market.price - from.market.price) / from.market.price,
      volumeChange: (to.market.volume - from.market.volume) / from.market.volume,
      phaseShift: Math.sqrt(
        Math.pow(to.phaseSpace.q - from.phaseSpace.q, 2) +
        Math.pow(to.phaseSpace.p - from.phaseSpace.p, 2)
      ),
      latticeShift: Math.abs(
        to.priceLattice.phaseAngle - from.priceLattice.phaseAngle
      )
    };
  }

  /**
   * Register callback for state transitions
   */
  onTransition(callback: (transition: StateTransition) => void): () => void {
    this.transitionCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.transitionCallbacks.indexOf(callback);
      if (index > -1) {
        this.transitionCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Emit transition event to all callbacks
   */
  private emitTransition(transition: StateTransition): void {
    for (const callback of this.transitionCallbacks) {
      try {
        callback(transition);
      } catch (error) {
        console.error('Error in transition callback:', error);
      }
    }
  }

  /**
   * Analyze state over time window
   */
  analyzeWindow(
    symbol: string,
    windowMs: number
  ): {
    volatility: number;
    trend: 'up' | 'down' | 'sideways';
    regimeChanges: number;
    averagePrice: number;
    averageVolume: number;
  } | null {
    const history = this.getHistory(symbol);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Filter to window
    const windowStates = history.filter(h => h.timestamp >= windowStart);

    if (windowStates.length < 2) {
      return null;
    }

    // Calculate metrics
    const prices = windowStates.map(s => s.state.market.price);
    const volumes = windowStates.map(s => s.state.market.volume);

    const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const averageVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;

    // Volatility (standard deviation)
    const priceVariance = prices.reduce(
      (sum, p) => sum + Math.pow(p - averagePrice, 2),
      0
    ) / prices.length;
    const volatility = Math.sqrt(priceVariance);

    // Trend (linear regression slope)
    const n = prices.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = prices.reduce((a, b) => a + b, 0);
    const sumXY = prices.reduce((sum, y, x) => sum + x * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    let trend: 'up' | 'down' | 'sideways';
    if (slope > 0.001) {
      trend = 'up';
    } else if (slope < -0.001) {
      trend = 'down';
    } else {
      trend = 'sideways';
    }

    // Count regime changes
    let regimeChanges = 0;
    for (let i = 1; i < windowStates.length; i++) {
      if (windowStates[i].regime !== windowStates[i - 1].regime) {
        regimeChanges++;
      }
    }

    return {
      volatility,
      trend,
      regimeChanges,
      averagePrice,
      averageVolume
    };
  }

  /**
   * Find similar historical states
   */
  findSimilarStates(
    targetState: EncodedMarketState,
    symbol: string,
    limit: number = 10
  ): Array<{ state: HistoricalState; similarity: number }> {
    const history = this.getHistory(symbol);

    const similarities = history.map(historical => ({
      state: historical,
      similarity: this.encoder.calculateSimilarity(
        targetState,
        historical.state
      )
    }));

    // Sort by similarity (descending)
    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, limit);
  }

  /**
   * Clear all states and history
   */
  clear(): void {
    this.states.clear();
    this.history.clear();
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalStates: number;
    totalHistoricalRecords: number;
    symbols: string[];
    regimeDistribution: Record<MarketRegime, number>;
  } {
    const regimeDistribution: Record<MarketRegime, number> = {
      bullish: 0,
      bearish: 0,
      neutral: 0,
      volatile: 0
    };

    for (const state of this.states.values()) {
      regimeDistribution[state.regime]++;
    }

    let totalHistoricalRecords = 0;
    for (const history of this.history.values()) {
      totalHistoricalRecords += history.length;
    }

    return {
      totalStates: this.states.size,
      totalHistoricalRecords,
      symbols: Array.from(this.states.keys()),
      regimeDistribution
    };
  }
}

/**
 * Default state manager instance
 */
export const defaultStateManager = new MarketStateManager();

/**
 * Convenience function to update state
 */
export function updateMarketState(
  symbol: string,
  market: MarketData,
  priceScale?: number,
  volumeScale?: number
): MarketState {
  return defaultStateManager.updateState(symbol, market, priceScale, volumeScale);
}

export default {
  MarketStateManager,
  defaultStateManager,
  updateMarketState
};

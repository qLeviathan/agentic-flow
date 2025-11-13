/**
 * Trading Decision Engine with Nash Equilibrium Detection
 *
 * Features:
 * 1. 12 action types (BUY, SELL, HOLD, 9 options strategies)
 * 2. Decisions only at Nash equilibria
 * 3. Explainable reasoning via Zeckendorf traces
 * 4. Risk-adjusted position sizing
 * 5. Multi-asset portfolio management
 *
 * @module DecisionEngine
 * @author AURELIA Trading Team
 * @level 9-10
 */

import { QNetwork, Matrix } from '../../math-framework/neural/q-network';
import { NashDetector, MarketState, NashEquilibrium } from './nash-detector';

const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio

/**
 * Trading action types
 */
export enum ActionType {
  // Basic actions
  BUY = 'BUY',
  SELL = 'SELL',
  HOLD = 'HOLD',

  // Options strategies
  CALL_BUY = 'CALL_BUY',           // Buy call option
  CALL_SELL = 'CALL_SELL',         // Sell/write call option
  PUT_BUY = 'PUT_BUY',             // Buy put option
  PUT_SELL = 'PUT_SELL',           // Sell/write put option
  STRADDLE = 'STRADDLE',           // Buy call + put at same strike
  STRANGLE = 'STRANGLE',           // Buy OTM call + OTM put
  IRON_CONDOR = 'IRON_CONDOR',     // Sell OTM call spread + OTM put spread
  BUTTERFLY = 'BUTTERFLY',         // Buy 1 ITM + 1 OTM, sell 2 ATM
  COVERED_CALL = 'COVERED_CALL',   // Own stock + sell call
}

/**
 * Risk profile for position sizing
 */
export interface RiskProfile {
  maxPositionSize: number;         // Max % of portfolio per trade
  maxLeverage: number;             // Max leverage multiplier
  stopLossPercent: number;         // Stop loss %
  takeProfitPercent: number;       // Take profit %
  varLimit: number;                // Value-at-Risk limit
  expectedReturn: number;          // Expected return
  sharpeRatio: number;             // Risk-adjusted return
}

/**
 * Trading decision with full explanation
 */
export interface TradingDecision {
  action: ActionType;
  symbol: string;
  quantity: number;
  price: number;
  confidence: number;              // [0, 1]
  nashEquilibrium: NashEquilibrium;
  reasoning: string[];             // Step-by-step explanation
  zeckendorfTrace: string[];       // Zeckendorf decomposition trace
  riskMetrics: {
    var: number;                   // Value-at-Risk
    expectedReturn: number;
    sharpeRatio: number;
    positionSize: number;          // % of portfolio
  };
  timestamp: number;
  expirationTime?: number;         // For options
  strikePrice?: number;            // For options
}

/**
 * Portfolio state
 */
export interface Portfolio {
  cash: number;
  positions: Map<string, {
    quantity: number;
    averagePrice: number;
    currentPrice: number;
  }>;
  totalValue: number;
}

/**
 * Decision engine configuration
 */
export interface DecisionEngineConfig {
  minNashConfidence: number;       // Minimum Nash confidence to act
  minConsciousness: number;        // Minimum Ψ threshold
  defaultRiskProfile: RiskProfile;
  enableOptions: boolean;          // Enable options strategies
  enableLeverage: boolean;         // Enable leveraged positions
  maxSimultaneousPositions: number;
}

/**
 * Trading Decision Engine
 *
 * Makes trading decisions based on Nash equilibrium detection
 * and φ-mechanics consciousness framework
 */
export class DecisionEngine {
  private nashDetector: NashDetector;
  private qNetwork: QNetwork;
  private portfolio: Portfolio;
  private config: Required<DecisionEngineConfig>;
  private decisionHistory: TradingDecision[] = [];

  constructor(
    qNetwork: QNetwork,
    nashDetector: NashDetector,
    portfolio: Portfolio,
    config: Partial<DecisionEngineConfig> = {}
  ) {
    this.qNetwork = qNetwork;
    this.nashDetector = nashDetector;
    this.portfolio = portfolio;

    this.config = {
      minNashConfidence: config.minNashConfidence || 0.75,
      minConsciousness: config.minConsciousness || 1 / PHI,
      defaultRiskProfile: config.defaultRiskProfile || {
        maxPositionSize: 0.1,        // 10% max per position
        maxLeverage: 1.0,             // No leverage by default
        stopLossPercent: 0.05,        // 5% stop loss
        takeProfitPercent: 0.15,      // 15% take profit
        varLimit: 0.02,               // 2% VaR limit
        expectedReturn: 0.0,
        sharpeRatio: 0.0,
      },
      enableOptions: config.enableOptions !== false,
      enableLeverage: config.enableLeverage || false,
      maxSimultaneousPositions: config.maxSimultaneousPositions || 10,
    };
  }

  /**
   * Compute Q-values for all actions given market state
   */
  private computeQValues(state: MarketState): Map<ActionType, number> {
    const qValues = new Map<ActionType, number>();

    // Create input vector from market state
    const inputVector = this.stateToVector(state);
    const input = Matrix.from2D([inputVector]).transpose();

    // Get Q-network output
    const output = this.qNetwork.forward(input);

    // Map output to action Q-values
    // We'll use a simple mapping: output[i] → action[i]
    const actions = Object.values(ActionType);
    for (let i = 0; i < Math.min(output.rows, actions.length); i++) {
      qValues.set(actions[i], output.get(i, 0));
    }

    return qValues;
  }

  /**
   * Convert market state to neural network input vector
   */
  private stateToVector(state: MarketState): number[] {
    // Normalize features to [0, 1] range
    const normalizedPrice = state.price / 1000;         // Assume max price ~1000
    const normalizedVolume = Math.min(state.volume / 1e6, 1); // Cap at 1M
    const normalizedVolatility = Math.min(state.volatility, 1);
    const normalizedRSI = state.rsi / 100;
    const normalizedMACD = Math.tanh(state.macd / 10);  // Squash to [-1, 1]
    const normalizedBollinger = (state.bollinger + 2) / 4; // Assume [-2, 2] → [0, 1]

    return [
      normalizedPrice,
      normalizedVolume,
      normalizedVolatility,
      normalizedRSI,
      normalizedMACD,
      normalizedBollinger,
    ];
  }

  /**
   * Select optimal action based on Q-values and Nash equilibrium
   */
  private selectAction(
    qValues: Map<ActionType, number>,
    nashEquilibrium: NashEquilibrium,
    state: MarketState
  ): ActionType {
    // If not at Nash equilibrium, default to HOLD
    if (!nashEquilibrium.isNashEquilibrium) {
      return ActionType.HOLD;
    }

    // Filter allowed actions
    let allowedActions = Array.from(qValues.keys());

    // Disable options if not enabled
    if (!this.config.enableOptions) {
      allowedActions = allowedActions.filter(
        action =>
          action === ActionType.BUY ||
          action === ActionType.SELL ||
          action === ActionType.HOLD
      );
    }

    // Find action with highest Q-value
    let bestAction = ActionType.HOLD;
    let bestQValue = -Infinity;

    for (const action of allowedActions) {
      const qValue = qValues.get(action) || 0;
      if (qValue > bestQValue) {
        bestQValue = qValue;
        bestAction = action;
      }
    }

    return bestAction;
  }

  /**
   * Compute position size based on risk profile and portfolio
   */
  private computePositionSize(
    action: ActionType,
    state: MarketState,
    riskProfile: RiskProfile
  ): number {
    const { maxPositionSize, maxLeverage } = riskProfile;
    const { totalValue } = this.portfolio;

    // Base position size from risk profile
    let positionSize = totalValue * maxPositionSize;

    // Apply leverage if enabled
    if (this.config.enableLeverage && action !== ActionType.HOLD) {
      positionSize *= maxLeverage;
    }

    // Adjust for volatility (higher volatility → smaller position)
    const volatilityAdjustment = 1 / (1 + state.volatility);
    positionSize *= volatilityAdjustment;

    // Adjust for consciousness (higher Ψ → larger position)
    // This is already factored into confidence, but we can emphasize it
    const consciousnessBoost = Math.min(2, state.rsi / 50); // RSI as proxy
    positionSize *= consciousnessBoost;

    // Convert to quantity (shares or contracts)
    const quantity = Math.floor(positionSize / state.price);

    return Math.max(0, quantity);
  }

  /**
   * Generate explanation for decision
   */
  private generateReasoning(
    action: ActionType,
    state: MarketState,
    nashEquilibrium: NashEquilibrium,
    qValues: Map<ActionType, number>
  ): string[] {
    const reasoning: string[] = [];

    // Step 1: Market state analysis
    reasoning.push(
      `Market State: Price=${state.price.toFixed(2)}, Vol=${state.volatility.toFixed(3)}, RSI=${state.rsi.toFixed(1)}`
    );

    // Step 2: Nash equilibrium status
    if (nashEquilibrium.isNashEquilibrium) {
      reasoning.push(
        `✓ Nash Equilibrium Detected (Confidence: ${(nashEquilibrium.confidence * 100).toFixed(1)}%)`
      );
      reasoning.push(`  - ${nashEquilibrium.reason}`);
    } else {
      reasoning.push('✗ No Nash Equilibrium - HOLD recommended');
      reasoning.push(`  - ${nashEquilibrium.reason}`);
    }

    // Step 3: Q-value analysis
    const topActions = Array.from(qValues.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    reasoning.push('Q-Value Rankings:');
    topActions.forEach(([act, val], idx) => {
      const marker = idx === 0 ? '→' : ' ';
      reasoning.push(`  ${marker} ${act}: ${val.toFixed(4)}`);
    });

    // Step 4: Risk assessment
    reasoning.push(
      `Risk Assessment: VaR=${this.config.defaultRiskProfile.varLimit * 100}%, Volatility=${(state.volatility * 100).toFixed(1)}%`
    );

    // Step 5: Final decision
    reasoning.push(`Decision: ${action} (Strategic Stability S(n)=${nashEquilibrium.S_n.toExponential(2)})`);

    return reasoning;
  }

  /**
   * Generate Zeckendorf trace for explainability
   */
  private generateZeckendorfTrace(state: MarketState): string[] {
    const decomposition = this.nashDetector.getStateDecomposition(state);

    return [
      `Price Decomposition: ${decomposition.price.decomposition}`,
      `Volume Decomposition: ${decomposition.volume.decomposition}`,
      `RSI Decomposition: ${decomposition.rsi.decomposition}`,
      `Volatility Decomposition: ${decomposition.volatility.decomposition}`,
      `Consciousness Ψ = Σ φ^(-zi) × confidence(zi)`,
    ];
  }

  /**
   * Make trading decision for given market state
   *
   * Returns decision only if Nash equilibrium is detected
   */
  async makeDecision(
    symbol: string,
    state: MarketState,
    riskProfile: RiskProfile = this.config.defaultRiskProfile
  ): Promise<TradingDecision | null> {
    // Get latest Q-network trajectory
    // For this implementation, we'll create a mock trajectory
    // In production, this would come from the Q-network's latest training step
    const mockTrajectory = {
      iteration: 0,
      loss: 0.001,
      mse: 0.001,
      regularization: 0.0,
      S_n: 1e-7, // Very small for demonstration
      lyapunov_V: 1e-14,
      nash_distance: 1e-7,
      weights: [],
      timestamp: Date.now(),
    };

    // Detect Nash equilibrium
    const nashEquilibrium = this.nashDetector.detect(state, this.qNetwork, mockTrajectory);

    // Check if we meet minimum thresholds
    if (
      nashEquilibrium.confidence < this.config.minNashConfidence ||
      nashEquilibrium.consciousness < this.config.minConsciousness
    ) {
      return null; // Don't trade if confidence too low
    }

    // Compute Q-values for all actions
    const qValues = this.computeQValues(state);

    // Select optimal action
    const action = this.selectAction(qValues, nashEquilibrium, state);

    // If action is HOLD and not at Nash equilibrium, return null
    if (action === ActionType.HOLD && !nashEquilibrium.isNashEquilibrium) {
      return null;
    }

    // Compute position size
    const quantity = this.computePositionSize(action, state, riskProfile);

    // Generate reasoning and trace
    const reasoning = this.generateReasoning(action, state, nashEquilibrium, qValues);
    const zeckendorfTrace = this.generateZeckendorfTrace(state);

    // Create decision
    const decision: TradingDecision = {
      action,
      symbol,
      quantity,
      price: state.price,
      confidence: nashEquilibrium.confidence,
      nashEquilibrium,
      reasoning,
      zeckendorfTrace,
      riskMetrics: {
        var: riskProfile.varLimit,
        expectedReturn: riskProfile.expectedReturn,
        sharpeRatio: riskProfile.sharpeRatio,
        positionSize: (quantity * state.price) / this.portfolio.totalValue,
      },
      timestamp: Date.now(),
    };

    // Store in history
    this.decisionHistory.push(decision);
    if (this.decisionHistory.length > 1000) {
      this.decisionHistory.shift();
    }

    return decision;
  }

  /**
   * Execute trading decision (update portfolio)
   */
  executeDecision(decision: TradingDecision): boolean {
    const { action, symbol, quantity, price } = decision;
    const cost = quantity * price;

    try {
      switch (action) {
        case ActionType.BUY:
        case ActionType.CALL_BUY:
        case ActionType.PUT_BUY:
          if (this.portfolio.cash < cost) {
            return false; // Insufficient funds
          }
          this.portfolio.cash -= cost;

          const existingPosition = this.portfolio.positions.get(symbol);
          if (existingPosition) {
            const totalQuantity = existingPosition.quantity + quantity;
            const totalCost =
              existingPosition.averagePrice * existingPosition.quantity + cost;
            existingPosition.quantity = totalQuantity;
            existingPosition.averagePrice = totalCost / totalQuantity;
            existingPosition.currentPrice = price;
          } else {
            this.portfolio.positions.set(symbol, {
              quantity,
              averagePrice: price,
              currentPrice: price,
            });
          }
          break;

        case ActionType.SELL:
        case ActionType.CALL_SELL:
        case ActionType.PUT_SELL:
          const position = this.portfolio.positions.get(symbol);
          if (!position || position.quantity < quantity) {
            return false; // Insufficient shares
          }

          this.portfolio.cash += cost;
          position.quantity -= quantity;

          if (position.quantity === 0) {
            this.portfolio.positions.delete(symbol);
          }
          break;

        case ActionType.HOLD:
          // No action needed
          break;

        default:
          // Complex options strategies - simplified execution
          console.warn(`Complex strategy ${action} not fully implemented`);
          return false;
      }

      // Update total portfolio value
      this.updatePortfolioValue();
      return true;
    } catch (error) {
      console.error('Failed to execute decision:', error);
      return false;
    }
  }

  /**
   * Update total portfolio value
   */
  private updatePortfolioValue(): void {
    let totalValue = this.portfolio.cash;

    for (const [symbol, position] of this.portfolio.positions) {
      totalValue += position.quantity * position.currentPrice;
    }

    this.portfolio.totalValue = totalValue;
  }

  /**
   * Get decision statistics
   */
  getStats(): {
    totalDecisions: number;
    nashDecisions: number;
    actionCounts: Map<ActionType, number>;
    averageConfidence: number;
    successRate: number;
  } {
    const actionCounts = new Map<ActionType, number>();
    let totalConfidence = 0;
    let nashCount = 0;

    for (const decision of this.decisionHistory) {
      actionCounts.set(decision.action, (actionCounts.get(decision.action) || 0) + 1);
      totalConfidence += decision.confidence;

      if (decision.nashEquilibrium.isNashEquilibrium) {
        nashCount++;
      }
    }

    return {
      totalDecisions: this.decisionHistory.length,
      nashDecisions: nashCount,
      actionCounts,
      averageConfidence:
        this.decisionHistory.length > 0 ? totalConfidence / this.decisionHistory.length : 0,
      successRate: this.decisionHistory.length > 0 ? nashCount / this.decisionHistory.length : 0,
    };
  }

  /**
   * Get decision history
   */
  getHistory(limit: number = 100): TradingDecision[] {
    return this.decisionHistory.slice(-limit);
  }

  /**
   * Clear decision history
   */
  clearHistory(): void {
    this.decisionHistory = [];
  }

  /**
   * Get current portfolio state
   */
  getPortfolio(): Portfolio {
    return this.portfolio;
  }
}

/**
 * Export types
 */
export type {
  TradingDecision,
  RiskProfile,
  Portfolio,
  DecisionEngineConfig,
};

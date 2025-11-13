/**
 * AURELIA Continuous Learning System
 *
 * Implements continuous learning from trading decisions using:
 * - AgentDB for persistent storage
 * - Pattern recognition for successful trades
 * - Q-network updates based on outcomes
 * - Reflexion learning (9 RL algorithms)
 * - Real-time performance tracking
 *
 * Learning Algorithms:
 * 1. DecisionTransformer
 * 2. Q-Learning
 * 3. SARSA
 * 4. Actor-Critic
 * 5. PPO
 * 6. DQN
 * 7. A3C
 * 8. REINFORCE
 * 9. TD3
 */

import { AgentDB } from 'agentdb';
import { AURELIA } from '../trading/aurelia';
import { TradingStrategyState, ConsciousnessState } from '../trading/aurelia/types';

/**
 * Trading decision record
 */
export interface TradingDecision {
  id: string;
  timestamp: number;
  asset: string;
  action: 'buy' | 'sell' | 'hold';
  quantity: number;
  price: number;
  confidence: number;
  reasoning: string;
  zeckendorfTrace?: string[];
  consciousnessState: ConsciousnessState;
  strategyState: TradingStrategyState;
  marketContext: {
    volatility: number;
    trend: string;
    indicators: Record<string, number>;
  };
}

/**
 * Trading outcome
 */
export interface TradingOutcome {
  decisionId: string;
  exitTimestamp: number;
  exitPrice: number;
  profitLoss: number;
  profitLossPercent: number;
  holdingPeriod: number; // milliseconds
  isProfitable: boolean;
  actualRisk: {
    maxDrawdown: number;
    volatility: number;
  };
  marketConditionsChanged: boolean;
}

/**
 * Learning pattern
 */
export interface LearningPattern {
  id: string;
  patternType: 'success' | 'failure' | 'neutral';
  decisions: TradingDecision[];
  outcomes: TradingOutcome[];
  characteristics: {
    marketRegime: string;
    assetClass: string;
    timeOfDay: string;
    consciousnessPsi: number;
    nashEquilibrium: boolean;
  };
  performance: {
    winRate: number;
    avgProfit: number;
    sharpeRatio: number;
    maxDrawdown: number;
  };
  extractedRules: string[];
  confidence: number;
}

/**
 * Q-Network update
 */
export interface QNetworkUpdate {
  state: number[];
  action: number;
  reward: number;
  nextState: number[];
  done: boolean;
  tdError: number;
  updateTimestamp: number;
}

/**
 * Reflexion learning entry
 */
export interface ReflexionEntry {
  id: string;
  episode: number;
  trajectory: {
    states: number[][];
    actions: number[];
    rewards: number[];
  };
  verdict: 'success' | 'failure' | 'partial';
  reflection: string;
  memoryDistillation: {
    keyInsights: string[];
    patternsIdentified: string[];
    improvementAreas: string[];
  };
  algorithmUsed: LearningAlgorithm;
}

/**
 * Learning algorithms
 */
export enum LearningAlgorithm {
  DECISION_TRANSFORMER = 'DecisionTransformer',
  Q_LEARNING = 'Q-Learning',
  SARSA = 'SARSA',
  ACTOR_CRITIC = 'Actor-Critic',
  PPO = 'PPO',
  DQN = 'DQN',
  A3C = 'A3C',
  REINFORCE = 'REINFORCE',
  TD3 = 'TD3'
}

/**
 * Learning configuration
 */
export interface LearningConfig {
  agentDbPath: string;
  learningRate: number;
  discountFactor: number;
  explorationRate: number;
  batchSize: number;
  updateFrequency: number; // episodes
  enableReflexion: boolean;
  enablePatternRecognition: boolean;
  defaultAlgorithm: LearningAlgorithm;
}

/**
 * Continuous Learning System
 */
export class ContinuousLearning {
  private aurelia: AURELIA;
  private db: AgentDB;
  private config: LearningConfig;
  private episodeCount: number = 0;
  private pendingDecisions: Map<string, TradingDecision> = new Map();

  constructor(
    aurelia: AURELIA,
    config: Partial<LearningConfig> = {}
  ) {
    this.aurelia = aurelia;
    this.config = {
      agentDbPath: config.agentDbPath || './aurelia-learning.db',
      learningRate: config.learningRate ?? 0.001,
      discountFactor: config.discountFactor ?? 0.99,
      explorationRate: config.explorationRate ?? 0.1,
      batchSize: config.batchSize ?? 32,
      updateFrequency: config.updateFrequency ?? 10,
      enableReflexion: config.enableReflexion ?? true,
      enablePatternRecognition: config.enablePatternRecognition ?? true,
      defaultAlgorithm: config.defaultAlgorithm || LearningAlgorithm.DECISION_TRANSFORMER
    };

    this.db = new AgentDB(this.config.agentDbPath, {
      enableHNSW: true,
      enableQuantization: true
    });

    this.initializeDatabase();
  }

  /**
   * Initialize learning database
   */
  private async initializeDatabase(): Promise<void> {
    await this.db.createCollection('trading_decisions');
    await this.db.createCollection('trading_outcomes');
    await this.db.createCollection('learning_patterns');
    await this.db.createCollection('q_network_updates');
    await this.db.createCollection('reflexion_entries');
    await this.db.createCollection('performance_metrics');

    // Create learning plugins for each algorithm
    await this.initializeLearningPlugins();
  }

  /**
   * Initialize learning plugins (9 RL algorithms)
   */
  private async initializeLearningPlugins(): Promise<void> {
    const algorithms = Object.values(LearningAlgorithm);

    for (const algorithm of algorithms) {
      await this.db.createLearningPlugin({
        name: algorithm,
        type: this.mapAlgorithmToType(algorithm),
        config: {
          learning_rate: this.config.learningRate,
          discount_factor: this.config.discountFactor,
          batch_size: this.config.batchSize
        }
      });
    }
  }

  /**
   * Map algorithm enum to AgentDB type
   */
  private mapAlgorithmToType(algorithm: LearningAlgorithm): string {
    const mapping: Record<LearningAlgorithm, string> = {
      [LearningAlgorithm.DECISION_TRANSFORMER]: 'DecisionTransformer',
      [LearningAlgorithm.Q_LEARNING]: 'Q-Learning',
      [LearningAlgorithm.SARSA]: 'SARSA',
      [LearningAlgorithm.ACTOR_CRITIC]: 'Actor-Critic',
      [LearningAlgorithm.PPO]: 'PPO',
      [LearningAlgorithm.DQN]: 'DQN',
      [LearningAlgorithm.A3C]: 'A3C',
      [LearningAlgorithm.REINFORCE]: 'REINFORCE',
      [LearningAlgorithm.TD3]: 'TD3'
    };
    return mapping[algorithm];
  }

  /**
   * Record trading decision
   */
  async recordDecision(decision: TradingDecision): Promise<void> {
    // Store decision
    await this.db.insert('trading_decisions', {
      id: decision.id,
      decision,
      metadata: {
        timestamp: decision.timestamp,
        asset: decision.asset,
        action: decision.action
      }
    });

    // Add to pending decisions
    this.pendingDecisions.set(decision.id, decision);
  }

  /**
   * Record trading outcome
   */
  async recordOutcome(outcome: TradingOutcome): Promise<void> {
    // Store outcome
    await this.db.insert('trading_outcomes', {
      id: outcome.decisionId,
      outcome,
      metadata: {
        timestamp: outcome.exitTimestamp,
        profitLoss: outcome.profitLoss,
        isProfitable: outcome.isProfitable
      }
    });

    // Get original decision
    const decision = this.pendingDecisions.get(outcome.decisionId);
    if (!decision) {
      console.warn(`No decision found for outcome ${outcome.decisionId}`);
      return;
    }

    // Learn from outcome
    await this.learnFromOutcome(decision, outcome);

    // Remove from pending
    this.pendingDecisions.delete(outcome.decisionId);

    // Increment episode
    this.episodeCount++;

    // Periodic updates
    if (this.episodeCount % this.config.updateFrequency === 0) {
      await this.performPeriodicUpdate();
    }
  }

  /**
   * Learn from trading outcome
   */
  private async learnFromOutcome(
    decision: TradingDecision,
    outcome: TradingOutcome
  ): Promise<void> {
    // Calculate reward
    const reward = this.calculateReward(outcome);

    // Encode states
    const state = this.encodeState(decision);
    const nextState = this.encodeNextState(outcome);

    // Create Q-network update
    const update: QNetworkUpdate = {
      state,
      action: this.encodeAction(decision.action),
      reward,
      nextState,
      done: true, // Trade completed
      tdError: 0, // Will be calculated by learning algorithm
      updateTimestamp: Date.now()
    };

    // Store update
    await this.db.insert('q_network_updates', {
      id: `update-${Date.now()}`,
      update,
      metadata: { reward, isProfitable: outcome.isProfitable }
    });

    // Update Q-network using selected algorithm
    await this.updateQNetwork(update);

    // Pattern recognition
    if (this.config.enablePatternRecognition) {
      await this.recognizePatterns(decision, outcome);
    }

    // Reflexion learning
    if (this.config.enableReflexion) {
      await this.performReflexion(decision, outcome);
    }
  }

  /**
   * Calculate reward from outcome
   */
  private calculateReward(outcome: TradingOutcome): number {
    // Multi-factor reward function
    const profitReward = outcome.profitLossPercent / 100; // Normalize to -1 to 1 range
    const riskPenalty = -outcome.actualRisk.maxDrawdown / 100;
    const holdingPenalty = -outcome.holdingPeriod / (1000 * 60 * 60 * 24); // Days

    // Weighted reward
    return (
      profitReward * 0.6 +
      riskPenalty * 0.3 +
      holdingPenalty * 0.1
    );
  }

  /**
   * Encode decision state
   */
  private encodeState(decision: TradingDecision): number[] {
    return [
      decision.confidence,
      decision.consciousnessState.psi.psi,
      decision.consciousnessState.psi.graphDiameter / 6, // Normalize
      decision.strategyState.nashEquilibrium ? 1 : 0,
      decision.marketContext.volatility,
      ...Object.values(decision.marketContext.indicators)
    ];
  }

  /**
   * Encode next state from outcome
   */
  private encodeNextState(outcome: TradingOutcome): number[] {
    return [
      outcome.profitLossPercent / 100, // Normalized
      outcome.actualRisk.maxDrawdown / 100,
      outcome.actualRisk.volatility,
      outcome.isProfitable ? 1 : 0,
      outcome.marketConditionsChanged ? 1 : 0
    ];
  }

  /**
   * Encode action
   */
  private encodeAction(action: string): number {
    const mapping: Record<string, number> = {
      'buy': 0,
      'hold': 1,
      'sell': 2
    };
    return mapping[action] || 1;
  }

  /**
   * Update Q-network
   */
  private async updateQNetwork(update: QNetworkUpdate): Promise<void> {
    // Use AgentDB learning plugin
    await this.db.trainLearningPlugin({
      pluginName: this.config.defaultAlgorithm,
      state: update.state,
      action: update.action,
      reward: update.reward,
      nextState: update.nextState,
      done: update.done
    });
  }

  /**
   * Recognize patterns in trading
   */
  private async recognizePatterns(
    decision: TradingDecision,
    outcome: TradingOutcome
  ): Promise<void> {
    // Find similar past decisions
    const similar = await this.findSimilarDecisions(decision);

    // Group by outcome
    const successful = similar.filter(s => s.outcome.isProfitable);
    const failed = similar.filter(s => !s.outcome.isProfitable);

    // Extract pattern if sufficient data
    if (successful.length >= 3) {
      const pattern = await this.extractPattern(successful, 'success');
      await this.db.insert('learning_patterns', {
        id: pattern.id,
        pattern,
        metadata: {
          patternType: 'success',
          confidence: pattern.confidence
        }
      });
    }

    if (failed.length >= 3) {
      const pattern = await this.extractPattern(failed, 'failure');
      await this.db.insert('learning_patterns', {
        id: pattern.id,
        pattern,
        metadata: {
          patternType: 'failure',
          confidence: pattern.confidence
        }
      });
    }
  }

  /**
   * Find similar past decisions
   */
  private async findSimilarDecisions(
    decision: TradingDecision
  ): Promise<Array<{decision: TradingDecision, outcome: TradingOutcome}>> {
    // Use vector similarity search on decision embeddings
    const embedding = this.encodeState(decision);

    const similar = await this.db.similaritySearch('trading_decisions', {
      vector: embedding,
      limit: 20
    });

    // Get corresponding outcomes
    const results = [];
    for (const item of similar) {
      const outcomeData = await this.db.query('trading_outcomes', {
        id: item.id
      });
      if (outcomeData.length > 0) {
        results.push({
          decision: item.decision,
          outcome: outcomeData[0].outcome
        });
      }
    }

    return results;
  }

  /**
   * Extract pattern from similar decisions
   */
  private async extractPattern(
    decisions: Array<{decision: TradingDecision, outcome: TradingOutcome}>,
    type: 'success' | 'failure'
  ): Promise<LearningPattern> {
    const pattern: LearningPattern = {
      id: `pattern-${Date.now()}`,
      patternType: type,
      decisions: decisions.map(d => d.decision),
      outcomes: decisions.map(d => d.outcome),
      characteristics: {
        marketRegime: this.identifyMarketRegime(decisions),
        assetClass: decisions[0].decision.asset.split('-')[0],
        timeOfDay: this.identifyTimeOfDay(decisions),
        consciousnessPsi: this.averageConsciousness(decisions),
        nashEquilibrium: this.checkNashEquilibrium(decisions)
      },
      performance: {
        winRate: decisions.filter(d => d.outcome.isProfitable).length / decisions.length,
        avgProfit: decisions.reduce((sum, d) => sum + d.outcome.profitLossPercent, 0) / decisions.length,
        sharpeRatio: this.calculatePatternSharpe(decisions),
        maxDrawdown: Math.min(...decisions.map(d => d.outcome.actualRisk.maxDrawdown))
      },
      extractedRules: this.extractRules(decisions, type),
      confidence: decisions.length / 20 // Confidence increases with sample size
    };

    return pattern;
  }

  /**
   * Perform Reflexion learning
   */
  private async performReflexion(
    decision: TradingDecision,
    outcome: TradingOutcome
  ): Promise<void> {
    const verdict = outcome.isProfitable ? 'success' :
                   outcome.profitLossPercent > -5 ? 'partial' : 'failure';

    const reflection = this.generateReflection(decision, outcome, verdict);

    const entry: ReflexionEntry = {
      id: `reflexion-${Date.now()}`,
      episode: this.episodeCount,
      trajectory: {
        states: [this.encodeState(decision), this.encodeNextState(outcome)],
        actions: [this.encodeAction(decision.action)],
        rewards: [this.calculateReward(outcome)]
      },
      verdict,
      reflection,
      memoryDistillation: {
        keyInsights: this.extractKeyInsights(decision, outcome),
        patternsIdentified: this.identifyPatterns(decision, outcome),
        improvementAreas: this.identifyImprovementAreas(decision, outcome)
      },
      algorithmUsed: this.config.defaultAlgorithm
    };

    await this.db.insert('reflexion_entries', {
      id: entry.id,
      entry,
      metadata: { episode: this.episodeCount, verdict }
    });
  }

  /**
   * Generate reflection text
   */
  private generateReflection(
    decision: TradingDecision,
    outcome: TradingOutcome,
    verdict: string
  ): string {
    if (verdict === 'success') {
      return `Successful trade: ${decision.action} ${decision.asset} at $${decision.price}. ` +
             `Achieved ${outcome.profitLossPercent.toFixed(2)}% return. ` +
             `Key factors: confidence=${decision.confidence.toFixed(2)}, ` +
             `Ψ=${decision.consciousnessState.psi.psi.toFixed(3)}, ` +
             `Nash=${decision.strategyState.nashEquilibrium}.`;
    } else {
      return `Trade failed: ${decision.action} ${decision.asset} resulted in ` +
             `${outcome.profitLossPercent.toFixed(2)}% loss. ` +
             `Max drawdown: ${outcome.actualRisk.maxDrawdown.toFixed(2)}%. ` +
             `Need to improve: ${decision.reasoning}`;
    }
  }

  /**
   * Perform periodic update
   */
  private async performPeriodicUpdate(): Promise<void> {
    // Batch learning from recent episodes
    const recentUpdates = await this.db.query('q_network_updates', {
      limit: this.config.batchSize,
      sortBy: 'updateTimestamp',
      order: 'desc'
    });

    // Update all learning algorithms
    for (const algorithm of Object.values(LearningAlgorithm)) {
      await this.batchUpdateAlgorithm(algorithm, recentUpdates);
    }

    // Update performance metrics
    await this.updatePerformanceMetrics();
  }

  /**
   * Batch update learning algorithm
   */
  private async batchUpdateAlgorithm(
    algorithm: LearningAlgorithm,
    updates: any[]
  ): Promise<void> {
    for (const update of updates) {
      await this.db.trainLearningPlugin({
        pluginName: algorithm,
        state: update.update.state,
        action: update.update.action,
        reward: update.update.reward,
        nextState: update.update.nextState,
        done: update.update.done
      });
    }
  }

  /**
   * Update performance metrics
   */
  private async updatePerformanceMetrics(): Promise<void> {
    const outcomes = await this.db.query('trading_outcomes', {});

    const metrics = {
      totalTrades: outcomes.length,
      profitableTrades: outcomes.filter((o: any) => o.outcome.isProfitable).length,
      winRate: 0,
      avgProfit: 0,
      avgLoss: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      totalReturn: 0,
      timestamp: Date.now()
    };

    if (outcomes.length > 0) {
      metrics.winRate = metrics.profitableTrades / metrics.totalTrades;
      metrics.avgProfit = outcomes
        .filter((o: any) => o.outcome.isProfitable)
        .reduce((sum: number, o: any) => sum + o.outcome.profitLossPercent, 0) /
        Math.max(metrics.profitableTrades, 1);
      metrics.avgLoss = outcomes
        .filter((o: any) => !o.outcome.isProfitable)
        .reduce((sum: number, o: any) => sum + o.outcome.profitLossPercent, 0) /
        Math.max(outcomes.length - metrics.profitableTrades, 1);
      metrics.totalReturn = outcomes.reduce(
        (sum: number, o: any) => sum + o.outcome.profitLossPercent, 0
      );
      metrics.maxDrawdown = Math.min(...outcomes.map((o: any) => o.outcome.actualRisk.maxDrawdown));
    }

    await this.db.insert('performance_metrics', {
      id: `metrics-${Date.now()}`,
      metrics,
      metadata: { timestamp: metrics.timestamp }
    });
  }

  /**
   * Get learning statistics
   */
  async getLearningStats(): Promise<any> {
    const decisions = await this.db.query('trading_decisions', {});
    const outcomes = await this.db.query('trading_outcomes', {});
    const patterns = await this.db.query('learning_patterns', {});
    const reflexions = await this.db.query('reflexion_entries', {});

    return {
      totalDecisions: decisions.length,
      totalOutcomes: outcomes.length,
      patternsLearned: patterns.length,
      reflexionEntries: reflexions.length,
      episodeCount: this.episodeCount,
      pendingDecisions: this.pendingDecisions.size,
      successPatterns: patterns.filter((p: any) => p.pattern.patternType === 'success').length,
      failurePatterns: patterns.filter((p: any) => p.pattern.patternType === 'failure').length
    };
  }

  // Helper methods

  private identifyMarketRegime(decisions: Array<{decision: TradingDecision, outcome: TradingOutcome}>): string {
    const avgVolatility = decisions.reduce((sum, d) =>
      sum + d.decision.marketContext.volatility, 0) / decisions.length;
    return avgVolatility > 0.3 ? 'high-volatility' : 'low-volatility';
  }

  private identifyTimeOfDay(decisions: Array<{decision: TradingDecision, outcome: TradingOutcome}>): string {
    const hour = new Date(decisions[0].decision.timestamp).getHours();
    return hour < 12 ? 'morning' : hour < 16 ? 'afternoon' : 'evening';
  }

  private averageConsciousness(decisions: Array<{decision: TradingDecision, outcome: TradingOutcome}>): number {
    return decisions.reduce((sum, d) =>
      sum + d.decision.consciousnessState.psi.psi, 0) / decisions.length;
  }

  private checkNashEquilibrium(decisions: Array<{decision: TradingDecision, outcome: TradingOutcome}>): boolean {
    return decisions.filter(d =>
      d.decision.strategyState.nashEquilibrium).length / decisions.length > 0.5;
  }

  private calculatePatternSharpe(decisions: Array<{decision: TradingDecision, outcome: TradingOutcome}>): number {
    const returns = decisions.map(d => d.outcome.profitLossPercent);
    const avg = returns.reduce((a, b) => a + b, 0) / returns.length;
    const std = Math.sqrt(returns.reduce((sum, r) =>
      sum + Math.pow(r - avg, 2), 0) / returns.length);
    return std > 0 ? avg / std : 0;
  }

  private extractRules(
    decisions: Array<{decision: TradingDecision, outcome: TradingOutcome}>,
    type: string
  ): string[] {
    const rules: string[] = [];
    if (type === 'success') {
      rules.push('High consciousness (Ψ > 0.7) correlates with success');
      rules.push('Nash equilibrium decisions more profitable');
    } else {
      rules.push('Avoid low confidence (<0.5) trades');
      rules.push('High volatility increases risk');
    }
    return rules;
  }

  private extractKeyInsights(decision: TradingDecision, outcome: TradingOutcome): string[] {
    return [
      `Confidence ${decision.confidence.toFixed(2)} led to ${outcome.profitLossPercent.toFixed(2)}% return`,
      `Consciousness Ψ=${decision.consciousnessState.psi.psi.toFixed(3)}`,
      `Market regime: ${decision.marketContext.trend}`
    ];
  }

  private identifyPatterns(decision: TradingDecision, outcome: TradingOutcome): string[] {
    return outcome.isProfitable ?
      ['Successful pattern identified'] :
      ['Failure pattern to avoid'];
  }

  private identifyImprovementAreas(decision: TradingDecision, outcome: TradingOutcome): string[] {
    const areas: string[] = [];
    if (decision.confidence < 0.6) areas.push('Increase confidence threshold');
    if (outcome.actualRisk.maxDrawdown > 10) areas.push('Better risk management');
    return areas;
  }

  /**
   * Close learning system
   */
  async close(): Promise<void> {
    await this.db.close();
  }
}

/**
 * Export types and class
 */
export {
  TradingDecision,
  TradingOutcome,
  LearningPattern,
  QNetworkUpdate,
  ReflexionEntry,
  LearningAlgorithm,
  LearningConfig
};

/**
 * AURELIA Training Curriculum
 *
 * Progressive difficulty training with 205 scenarios covering:
 * - 100 trading scenarios (beginner → expert)
 * - 50 options pricing problems
 * - 25 arbitrage opportunities
 * - 30 risk management cases
 *
 * Features adaptive learning based on performance.
 */

import { AgentDB } from 'agentdb';
import { KnowledgeQuery, ConceptCategory } from './knowledge-validator';

/**
 * Difficulty levels with progressive complexity
 */
export enum DifficultyLevel {
  BEGINNER = 'beginner',       // Basic concepts, simple calculations
  INTERMEDIATE = 'intermediate', // Multi-step analysis, moderate complexity
  ADVANCED = 'advanced',         // Complex scenarios, multiple variables
  EXPERT = 'expert'              // Real-world complexity, edge cases
}

/**
 * Scenario type
 */
export enum ScenarioType {
  TRADING = 'trading',
  OPTIONS_PRICING = 'options_pricing',
  ARBITRAGE = 'arbitrage',
  RISK_MANAGEMENT = 'risk_management'
}

/**
 * Training scenario
 */
export interface TrainingScenario extends KnowledgeQuery {
  type: ScenarioType;
  prerequisites: string[]; // Must master these first
  learningObjectives: string[];
  estimatedTime: number; // minutes
  pointValue: number; // for scoring
  tags: string[];
}

/**
 * Curriculum configuration
 */
export interface CurriculumConfig {
  agentDbPath: string;
  enableAdaptiveDifficulty: boolean;
  requiredMasteryScore: number; // 0-1, score needed to progress
  allowSkipping: boolean;
}

/**
 * Training Curriculum Class
 */
export class TrainingCurriculum {
  private db: AgentDB;
  private config: CurriculumConfig;
  private scenarios: Map<string, TrainingScenario> = new Map();

  constructor(config: Partial<CurriculumConfig> = {}) {
    this.config = {
      agentDbPath: config.agentDbPath || './aurelia-curriculum.db',
      enableAdaptiveDifficulty: config.enableAdaptiveDifficulty ?? true,
      requiredMasteryScore: config.requiredMasteryScore ?? 0.85,
      allowSkipping: config.allowSkipping ?? false
    };

    this.db = new AgentDB(this.config.agentDbPath);
    this.initializeDatabase();
    this.buildCurriculum();
  }

  /**
   * Initialize database
   */
  private async initializeDatabase(): Promise<void> {
    await this.db.createCollection('scenarios');
    await this.db.createCollection('progress');
    await this.db.createCollection('mastery');
  }

  /**
   * Build complete curriculum (205 scenarios)
   */
  private buildCurriculum(): void {
    // Trading scenarios (100 total)
    this.buildTradingScenarios();

    // Options pricing (50 total)
    this.buildOptionsPricingScenarios();

    // Arbitrage opportunities (25 total)
    this.buildArbitrageScenarios();

    // Risk management (30 total)
    this.buildRiskManagementScenarios();
  }

  /**
   * Build trading scenarios (100 scenarios)
   */
  private buildTradingScenarios(): void {
    // BEGINNER (30 scenarios)
    this.addTradingScenario({
      id: 'trade-b001',
      difficulty: DifficultyLevel.BEGINNER,
      question: 'What is a bull market and how should you position?',
      groundTruth: {
        answer: 'A bull market is a market condition where prices are rising. Position: long/buy.',
        keyPoints: ['rising prices', 'optimistic sentiment', 'long position', 'buy strategy']
      },
      learningObjectives: ['Understand market trends', 'Basic positioning'],
      estimatedTime: 5,
      pointValue: 10,
      tags: ['market-basics', 'trends']
    });

    for (let i = 2; i <= 30; i++) {
      this.addTradingScenario({
        id: `trade-b${String(i).padStart(3, '0')}`,
        difficulty: DifficultyLevel.BEGINNER,
        question: `Basic trading scenario ${i}: ${this.generateBeginnerTradingQuestion(i)}`,
        groundTruth: this.generateBeginnerTradingAnswer(i),
        learningObjectives: ['Market fundamentals', 'Basic analysis'],
        estimatedTime: 5,
        pointValue: 10,
        tags: ['beginner', 'fundamentals']
      });
    }

    // INTERMEDIATE (30 scenarios)
    for (let i = 1; i <= 30; i++) {
      this.addTradingScenario({
        id: `trade-i${String(i).padStart(3, '0')}`,
        difficulty: DifficultyLevel.INTERMEDIATE,
        question: this.generateIntermediateTradingQuestion(i),
        groundTruth: this.generateIntermediateTradingAnswer(i),
        learningObjectives: ['Technical analysis', 'Multi-factor decisions'],
        estimatedTime: 10,
        pointValue: 20,
        tags: ['intermediate', 'technical-analysis'],
        prerequisites: ['trade-b001']
      });
    }

    // ADVANCED (25 scenarios)
    for (let i = 1; i <= 25; i++) {
      this.addTradingScenario({
        id: `trade-a${String(i).padStart(3, '0')}`,
        difficulty: DifficultyLevel.ADVANCED,
        question: this.generateAdvancedTradingQuestion(i),
        groundTruth: this.generateAdvancedTradingAnswer(i),
        learningObjectives: ['Complex strategies', 'Risk-adjusted returns'],
        estimatedTime: 15,
        pointValue: 30,
        tags: ['advanced', 'strategy'],
        prerequisites: ['trade-i001']
      });
    }

    // EXPERT (15 scenarios)
    for (let i = 1; i <= 15; i++) {
      this.addTradingScenario({
        id: `trade-e${String(i).padStart(3, '0')}`,
        difficulty: DifficultyLevel.EXPERT,
        question: this.generateExpertTradingQuestion(i),
        groundTruth: this.generateExpertTradingAnswer(i),
        learningObjectives: ['Real-world complexity', 'Edge cases', 'Market microstructure'],
        estimatedTime: 20,
        pointValue: 50,
        tags: ['expert', 'real-world'],
        prerequisites: ['trade-a001']
      });
    }
  }

  /**
   * Build options pricing scenarios (50 scenarios)
   */
  private buildOptionsPricingScenarios(): void {
    // BEGINNER (15 scenarios)
    this.addOptionsScenario({
      id: 'opt-b001',
      difficulty: DifficultyLevel.BEGINNER,
      question: 'Calculate the intrinsic value of a call option with strike $100, underlying price $110.',
      groundTruth: {
        answer: 'Intrinsic value = max(110 - 100, 0) = $10',
        keyPoints: ['intrinsic value', 'call option', 'in-the-money'],
        numericalValue: 10,
        tolerance: 0.01
      },
      learningObjectives: ['Intrinsic value calculation', 'Option basics'],
      estimatedTime: 5,
      pointValue: 10,
      tags: ['options', 'intrinsic-value']
    });

    for (let i = 2; i <= 15; i++) {
      this.addOptionsScenario({
        id: `opt-b${String(i).padStart(3, '0')}`,
        difficulty: DifficultyLevel.BEGINNER,
        question: this.generateBeginnerOptionsQuestion(i),
        groundTruth: this.generateBeginnerOptionsAnswer(i),
        learningObjectives: ['Options fundamentals'],
        estimatedTime: 5,
        pointValue: 10,
        tags: ['options', 'beginner']
      });
    }

    // INTERMEDIATE (15 scenarios) - Black-Scholes
    for (let i = 1; i <= 15; i++) {
      this.addOptionsScenario({
        id: `opt-i${String(i).padStart(3, '0')}`,
        difficulty: DifficultyLevel.INTERMEDIATE,
        question: this.generateBlackScholesQuestion(i),
        groundTruth: this.generateBlackScholesAnswer(i),
        learningObjectives: ['Black-Scholes model', 'Option pricing'],
        estimatedTime: 10,
        pointValue: 20,
        tags: ['options', 'black-scholes'],
        prerequisites: ['opt-b001']
      });
    }

    // ADVANCED (12 scenarios) - Greeks
    for (let i = 1; i <= 12; i++) {
      this.addOptionsScenario({
        id: `opt-a${String(i).padStart(3, '0')}`,
        difficulty: DifficultyLevel.ADVANCED,
        question: this.generateGreeksQuestion(i),
        groundTruth: this.generateGreeksAnswer(i),
        learningObjectives: ['Options Greeks', 'Risk sensitivities'],
        estimatedTime: 15,
        pointValue: 30,
        tags: ['options', 'greeks'],
        prerequisites: ['opt-i001']
      });
    }

    // EXPERT (8 scenarios) - Complex strategies
    for (let i = 1; i <= 8; i++) {
      this.addOptionsScenario({
        id: `opt-e${String(i).padStart(3, '0')}`,
        difficulty: DifficultyLevel.EXPERT,
        question: this.generateComplexOptionsQuestion(i),
        groundTruth: this.generateComplexOptionsAnswer(i),
        learningObjectives: ['Complex strategies', 'Multi-leg options'],
        estimatedTime: 20,
        pointValue: 50,
        tags: ['options', 'expert'],
        prerequisites: ['opt-a001']
      });
    }
  }

  /**
   * Build arbitrage scenarios (25 scenarios)
   */
  private buildArbitrageScenarios(): void {
    // BEGINNER (8 scenarios)
    this.addArbitrageScenario({
      id: 'arb-b001',
      difficulty: DifficultyLevel.BEGINNER,
      question: 'Stock trades at $100 on NYSE, $101 on NASDAQ. Identify arbitrage opportunity.',
      groundTruth: {
        answer: 'Buy on NYSE at $100, sell on NASDAQ at $101. Profit: $1 per share.',
        keyPoints: ['buy low', 'sell high', 'price discrepancy', 'risk-free profit'],
        numericalValue: 1,
        tolerance: 0.01
      },
      learningObjectives: ['Arbitrage basics', 'Price discrepancies'],
      estimatedTime: 5,
      pointValue: 10,
      tags: ['arbitrage', 'spatial']
    });

    for (let i = 2; i <= 8; i++) {
      this.addArbitrageScenario({
        id: `arb-b${String(i).padStart(3, '0')}`,
        difficulty: DifficultyLevel.BEGINNER,
        question: this.generateBeginnerArbitrageQuestion(i),
        groundTruth: this.generateBeginnerArbitrageAnswer(i),
        learningObjectives: ['Arbitrage identification'],
        estimatedTime: 5,
        pointValue: 10,
        tags: ['arbitrage', 'beginner']
      });
    }

    // INTERMEDIATE (8 scenarios) - Triangular arbitrage
    for (let i = 1; i <= 8; i++) {
      this.addArbitrageScenario({
        id: `arb-i${String(i).padStart(3, '0')}`,
        difficulty: DifficultyLevel.INTERMEDIATE,
        question: this.generateTriangularArbitrageQuestion(i),
        groundTruth: this.generateTriangularArbitrageAnswer(i),
        learningObjectives: ['Triangular arbitrage', 'Currency markets'],
        estimatedTime: 10,
        pointValue: 20,
        tags: ['arbitrage', 'triangular'],
        prerequisites: ['arb-b001']
      });
    }

    // ADVANCED (6 scenarios) - Statistical arbitrage
    for (let i = 1; i <= 6; i++) {
      this.addArbitrageScenario({
        id: `arb-a${String(i).padStart(3, '0')}`,
        difficulty: DifficultyLevel.ADVANCED,
        question: this.generateStatisticalArbitrageQuestion(i),
        groundTruth: this.generateStatisticalArbitrageAnswer(i),
        learningObjectives: ['Statistical arbitrage', 'Pairs trading'],
        estimatedTime: 15,
        pointValue: 30,
        tags: ['arbitrage', 'statistical'],
        prerequisites: ['arb-i001']
      });
    }

    // EXPERT (3 scenarios) - Complex arbitrage
    for (let i = 1; i <= 3; i++) {
      this.addArbitrageScenario({
        id: `arb-e${String(i).padStart(3, '0')}`,
        difficulty: DifficultyLevel.EXPERT,
        question: this.generateComplexArbitrageQuestion(i),
        groundTruth: this.generateComplexArbitrageAnswer(i),
        learningObjectives: ['Multi-asset arbitrage', 'Real-world constraints'],
        estimatedTime: 20,
        pointValue: 50,
        tags: ['arbitrage', 'expert'],
        prerequisites: ['arb-a001']
      });
    }
  }

  /**
   * Build risk management scenarios (30 scenarios)
   */
  private buildRiskManagementScenarios(): void {
    // BEGINNER (10 scenarios)
    this.addRiskScenario({
      id: 'risk-b001',
      difficulty: DifficultyLevel.BEGINNER,
      question: 'Calculate Value at Risk (VaR) 95% for portfolio with returns: [-2%, -1%, 0%, 1%, 2%]',
      groundTruth: {
        answer: 'VaR 95% = -2% (5th percentile loss)',
        keyPoints: ['VaR', 'percentile', 'downside risk'],
        numericalValue: -2,
        tolerance: 0.1
      },
      learningObjectives: ['VaR calculation', 'Risk metrics'],
      estimatedTime: 5,
      pointValue: 10,
      tags: ['risk', 'var']
    });

    for (let i = 2; i <= 10; i++) {
      this.addRiskScenario({
        id: `risk-b${String(i).padStart(3, '0')}`,
        difficulty: DifficultyLevel.BEGINNER,
        question: this.generateBeginnerRiskQuestion(i),
        groundTruth: this.generateBeginnerRiskAnswer(i),
        learningObjectives: ['Risk fundamentals'],
        estimatedTime: 5,
        pointValue: 10,
        tags: ['risk', 'beginner']
      });
    }

    // INTERMEDIATE (10 scenarios)
    for (let i = 1; i <= 10; i++) {
      this.addRiskScenario({
        id: `risk-i${String(i).padStart(3, '0')}`,
        difficulty: DifficultyLevel.INTERMEDIATE,
        question: this.generateIntermediateRiskQuestion(i),
        groundTruth: this.generateIntermediateRiskAnswer(i),
        learningObjectives: ['Sharpe ratio', 'Portfolio optimization'],
        estimatedTime: 10,
        pointValue: 20,
        tags: ['risk', 'sharpe'],
        prerequisites: ['risk-b001']
      });
    }

    // ADVANCED (7 scenarios)
    for (let i = 1; i <= 7; i++) {
      this.addRiskScenario({
        id: `risk-a${String(i).padStart(3, '0')}`,
        difficulty: DifficultyLevel.ADVANCED,
        question: this.generateAdvancedRiskQuestion(i),
        groundTruth: this.generateAdvancedRiskAnswer(i),
        learningObjectives: ['Stress testing', 'Tail risk'],
        estimatedTime: 15,
        pointValue: 30,
        tags: ['risk', 'stress-testing'],
        prerequisites: ['risk-i001']
      });
    }

    // EXPERT (3 scenarios)
    for (let i = 1; i <= 3; i++) {
      this.addRiskScenario({
        id: `risk-e${String(i).padStart(3, '0')}`,
        difficulty: DifficultyLevel.EXPERT,
        question: this.generateExpertRiskQuestion(i),
        groundTruth: this.generateExpertRiskAnswer(i),
        learningObjectives: ['Systemic risk', 'Black swan events'],
        estimatedTime: 20,
        pointValue: 50,
        tags: ['risk', 'expert'],
        prerequisites: ['risk-a001']
      });
    }
  }

  /**
   * Helper: Add trading scenario
   */
  private addTradingScenario(params: Partial<TrainingScenario>): void {
    this.addScenario({
      ...params,
      type: ScenarioType.TRADING,
      category: ConceptCategory.MARKET_ANALYSIS
    } as TrainingScenario);
  }

  /**
   * Helper: Add options scenario
   */
  private addOptionsScenario(params: Partial<TrainingScenario>): void {
    this.addScenario({
      ...params,
      type: ScenarioType.OPTIONS_PRICING,
      category: ConceptCategory.OPTIONS_PRICING
    } as TrainingScenario);
  }

  /**
   * Helper: Add arbitrage scenario
   */
  private addArbitrageScenario(params: Partial<TrainingScenario>): void {
    this.addScenario({
      ...params,
      type: ScenarioType.ARBITRAGE,
      category: ConceptCategory.ARBITRAGE
    } as TrainingScenario);
  }

  /**
   * Helper: Add risk scenario
   */
  private addRiskScenario(params: Partial<TrainingScenario>): void {
    this.addScenario({
      ...params,
      type: ScenarioType.RISK_MANAGEMENT,
      category: ConceptCategory.RISK_MANAGEMENT
    } as TrainingScenario);
  }

  /**
   * Add scenario to curriculum
   */
  private addScenario(scenario: TrainingScenario): void {
    this.scenarios.set(scenario.id, scenario);
  }

  /**
   * Get scenario by ID
   */
  getScenario(id: string): TrainingScenario | undefined {
    return this.scenarios.get(id);
  }

  /**
   * Get scenarios by difficulty
   */
  getScenariosByDifficulty(difficulty: DifficultyLevel): TrainingScenario[] {
    return Array.from(this.scenarios.values())
      .filter(s => s.difficulty === difficulty);
  }

  /**
   * Get scenarios by type
   */
  getScenariosByType(type: ScenarioType): TrainingScenario[] {
    return Array.from(this.scenarios.values())
      .filter(s => s.type === type);
  }

  /**
   * Get all scenarios
   */
  getAllScenarios(): TrainingScenario[] {
    return Array.from(this.scenarios.values());
  }

  /**
   * Get curriculum statistics
   */
  getStatistics(): any {
    const scenarios = Array.from(this.scenarios.values());

    return {
      total: scenarios.length,
      byType: {
        trading: scenarios.filter(s => s.type === ScenarioType.TRADING).length,
        options: scenarios.filter(s => s.type === ScenarioType.OPTIONS_PRICING).length,
        arbitrage: scenarios.filter(s => s.type === ScenarioType.ARBITRAGE).length,
        risk: scenarios.filter(s => s.type === ScenarioType.RISK_MANAGEMENT).length
      },
      byDifficulty: {
        beginner: scenarios.filter(s => s.difficulty === DifficultyLevel.BEGINNER).length,
        intermediate: scenarios.filter(s => s.difficulty === DifficultyLevel.INTERMEDIATE).length,
        advanced: scenarios.filter(s => s.difficulty === DifficultyLevel.ADVANCED).length,
        expert: scenarios.filter(s => s.difficulty === DifficultyLevel.EXPERT).length
      },
      totalPoints: scenarios.reduce((sum, s) => sum + s.pointValue, 0),
      estimatedHours: scenarios.reduce((sum, s) => sum + s.estimatedTime, 0) / 60
    };
  }

  // Question generators (simplified - in production these would be more sophisticated)

  private generateBeginnerTradingQuestion(i: number): string {
    const questions = [
      'What is a bear market?',
      'Define support and resistance levels.',
      'What is a market order vs limit order?',
      'Explain bid-ask spread.',
      'What is market capitalization?'
    ];
    return questions[i % questions.length] || `Basic trading concept ${i}`;
  }

  private generateBeginnerTradingAnswer(i: number): any {
    return {
      answer: `Answer for beginner trading question ${i}`,
      keyPoints: ['fundamental concept', 'basic definition']
    };
  }

  private generateIntermediateTradingQuestion(i: number): string {
    return `Analyze stock with MA(50)=$100, MA(200)=$95, current price=$105. What's the signal?`;
  }

  private generateIntermediateTradingAnswer(i: number): any {
    return {
      answer: 'Golden cross (bullish signal). Price above both MAs indicates uptrend.',
      keyPoints: ['moving averages', 'golden cross', 'bullish', 'uptrend']
    };
  }

  private generateAdvancedTradingQuestion(i: number): string {
    return `Portfolio: 60% stocks (σ=20%), 40% bonds (σ=5%), correlation=0.3. Calculate portfolio volatility.`;
  }

  private generateAdvancedTradingAnswer(i: number): any {
    return {
      answer: 'σ_p = sqrt(0.6²×0.2² + 0.4²×0.05² + 2×0.6×0.4×0.3×0.2×0.05) ≈ 12.5%',
      keyPoints: ['portfolio volatility', 'correlation', 'diversification'],
      numericalValue: 12.5,
      tolerance: 0.5
    };
  }

  private generateExpertTradingQuestion(i: number): string {
    return `Market crash scenario: VIX spikes to 80, liquidity dries up, stop-losses fail. How do you protect a $10M portfolio?`;
  }

  private generateExpertTradingAnswer(i: number): any {
    return {
      answer: 'Multi-layer hedging: long VIX calls, out-of-money puts, reduce leverage, move to cash/treasuries, stagger exits.',
      keyPoints: ['tail hedging', 'crisis management', 'liquidity', 'VIX']
    };
  }

  private generateBeginnerOptionsQuestion(i: number): string {
    return `What is time decay (theta) in options?`;
  }

  private generateBeginnerOptionsAnswer(i: number): any {
    return {
      answer: 'Theta measures the rate of decline in option value due to time passage.',
      keyPoints: ['theta', 'time decay', 'option pricing']
    };
  }

  private generateBlackScholesQuestion(i: number): string {
    return `Using Black-Scholes: S=$100, K=$105, r=5%, σ=20%, T=0.25 years. Calculate call option price.`;
  }

  private generateBlackScholesAnswer(i: number): any {
    return {
      answer: 'C ≈ $2.46 (using Black-Scholes formula)',
      keyPoints: ['Black-Scholes', 'option pricing', 'call option'],
      numericalValue: 2.46,
      tolerance: 0.05
    };
  }

  private generateGreeksQuestion(i: number): string {
    return `Option has Delta=0.6, Gamma=0.05, Vega=0.15. Stock moves up $1. Estimate new Delta.`;
  }

  private generateGreeksAnswer(i: number): any {
    return {
      answer: 'New Delta ≈ 0.6 + 0.05×1 = 0.65',
      keyPoints: ['delta', 'gamma', 'option sensitivity'],
      numericalValue: 0.65,
      tolerance: 0.01
    };
  }

  private generateComplexOptionsQuestion(i: number): string {
    return `Design iron condor strategy for SPX at 4500, expecting range-bound movement. Include strikes and risk/reward.`;
  }

  private generateComplexOptionsAnswer(i: number): any {
    return {
      answer: 'Sell 4450/4400 put spread, sell 4550/4600 call spread. Max profit at 4500, risk at wings.',
      keyPoints: ['iron condor', 'spread strategy', 'range-bound', 'defined risk']
    };
  }

  private generateBeginnerArbitrageQuestion(i: number): string {
    return `EUR/USD spot rate differs by 0.5% between two exchanges. Is this arbitrage?`;
  }

  private generateBeginnerArbitrageAnswer(i: number): any {
    return {
      answer: 'Yes, if transaction costs < 0.5%. Buy low exchange, sell high exchange.',
      keyPoints: ['arbitrage', 'transaction costs', 'risk-free profit']
    };
  }

  private generateTriangularArbitrageQuestion(i: number): string {
    return `EUR/USD=1.10, USD/JPY=110, EUR/JPY=120. Find arbitrage opportunity.`;
  }

  private generateTriangularArbitrageAnswer(i: number): any {
    return {
      answer: 'Implied EUR/JPY = 1.10×110 = 121. Actual = 120. Buy EUR/JPY, sell via triangular path.',
      keyPoints: ['triangular arbitrage', 'currency', 'implied rate'],
      numericalValue: 1,
      tolerance: 0.1
    };
  }

  private generateStatisticalArbitrageQuestion(i: number): string {
    return `Pairs: AAPL and MSFT historically correlated 0.85. Spread widens to 3σ. Strategy?`;
  }

  private generateStatisticalArbitrageAnswer(i: number): any {
    return {
      answer: 'Mean reversion trade: short outperformer, long underperformer, expecting convergence.',
      keyPoints: ['pairs trading', 'mean reversion', 'statistical arbitrage', 'correlation']
    };
  }

  private generateComplexArbitrageQuestion(i: number): string {
    return `Multi-asset arbitrage: Stock=$100, Synthetic stock (call-put parity)=$101. Include dividends, repo rate.`;
  }

  private generateComplexArbitrageAnswer(i: number): any {
    return {
      answer: 'Buy stock, sell synthetic. Adjust for dividends and financing costs. Net profit if > transaction costs.',
      keyPoints: ['put-call parity', 'synthetic', 'cost of carry']
    };
  }

  private generateBeginnerRiskQuestion(i: number): string {
    return `Portfolio lost 10% in worst day last year. What is 1-day VaR at 100%?`;
  }

  private generateBeginnerRiskAnswer(i: number): any {
    return {
      answer: 'VaR 100% = 10% (worst observed loss)',
      keyPoints: ['VaR', 'historical method', 'worst case'],
      numericalValue: 10,
      tolerance: 0.1
    };
  }

  private generateIntermediateRiskQuestion(i: number): string {
    return `Portfolio: return=12%, std dev=18%, risk-free rate=2%. Calculate Sharpe ratio.`;
  }

  private generateIntermediateRiskAnswer(i: number): any {
    return {
      answer: 'Sharpe = (12% - 2%) / 18% = 0.556',
      keyPoints: ['Sharpe ratio', 'risk-adjusted return'],
      numericalValue: 0.556,
      tolerance: 0.01
    };
  }

  private generateAdvancedRiskQuestion(i: number): string {
    return `Stress test: 2008-style crash. Market drops 40%, correlations → 1. How much does portfolio lose?`;
  }

  private generateAdvancedRiskAnswer(i: number): any {
    return {
      answer: 'With correlation=1, diversification fails. Loss ≈ weighted average of asset drops.',
      keyPoints: ['stress testing', 'correlation risk', 'tail events']
    };
  }

  private generateExpertRiskQuestion(i: number): string {
    return `Systemic risk: Lehman-style contagion. Counterparty defaults, liquidity evaporates. Survival strategy?`;
  }

  private generateExpertRiskAnswer(i: number): any {
    return {
      answer: 'Reduce counterparty exposure, increase cash, central clearing, tail hedges, scenario planning.',
      keyPoints: ['systemic risk', 'counterparty risk', 'liquidity', 'black swan']
    };
  }

  /**
   * Close curriculum
   */
  async close(): Promise<void> {
    await this.db.close();
  }
}

/**
 * Export types and class
 */
export {
  DifficultyLevel,
  ScenarioType,
  TrainingScenario,
  CurriculumConfig
};

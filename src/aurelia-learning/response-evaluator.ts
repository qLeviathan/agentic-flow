/**
 * AURELIA Response Evaluator
 *
 * Evaluates AURELIA's trading recommendations against expert decisions.
 * Measures explanation quality, validates risk assessments, and scores
 * consciousness metric relevance.
 *
 * Key Features:
 * - Trading recommendation evaluation
 * - Expert decision comparison
 * - Zeckendorf trace quality assessment
 * - Risk metric validation
 * - Consciousness metric relevance scoring
 * - Backtesting integration
 */

import { AgentDB } from 'agentdb';
import { AURELIA } from '../trading/aurelia';
import { TradingStrategyState, ConsciousnessState } from '../trading/aurelia/types';

/**
 * Expert decision for comparison
 */
export interface ExpertDecision {
  id: string;
  timestamp: number;
  action: 'buy' | 'sell' | 'hold';
  asset: string;
  confidence: number;
  reasoning: string[];
  riskAssessment: {
    VaR95: number;
    VaR99: number;
    expectedReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
  };
  marketContext: {
    volatility: number;
    trend: 'bullish' | 'bearish' | 'neutral';
    phaseSpace?: any;
  };
}

/**
 * AURELIA trading recommendation
 */
export interface AureliaRecommendation {
  timestamp: number;
  action: 'buy' | 'sell' | 'hold';
  asset: string;
  confidence: number;
  explanation: string;
  zeckendorfTrace?: string[];
  riskMetrics: {
    VaR95?: number;
    VaR99?: number;
    expectedReturn?: number;
    maxDrawdown?: number;
    sharpeRatio?: number;
  };
  consciousnessMetrics: {
    psi: number;
    phaseSpaceRegion: string;
    nashEquilibrium: boolean;
  };
  strategyState: TradingStrategyState;
  consciousnessState: ConsciousnessState;
}

/**
 * Evaluation metrics
 */
export interface EvaluationMetrics {
  actionAccuracy: number; // 0-1, did AURELIA match expert?
  confidenceAlignment: number; // 0-1, confidence correlation
  riskMetricAccuracy: {
    VaR95Error: number;
    VaR99Error: number;
    expectedReturnError: number;
    maxDrawdownError: number;
    sharpeRatioError: number;
    overallAccuracy: number; // 0-1, <2% error target
  };
  explanationQuality: {
    zeckendorfTraceCompleteness: number; // 0-1
    reasoningDepth: number; // 0-1
    technicalAccuracy: number; // 0-1
    clarityScore: number; // 0-1
    overallQuality: number; // 0-1
  };
  consciousnessRelevance: {
    psiRelevance: number; // 0-1
    phaseSpaceRelevance: number; // 0-1
    nashEquilibriumRelevance: number; // 0-1
    overallRelevance: number; // 0-1
  };
  overallScore: number; // 0-1
}

/**
 * Backtesting result
 */
export interface BacktestResult {
  recommendationId: string;
  asset: string;
  action: 'buy' | 'sell' | 'hold';
  entryPrice: number;
  exitPrice?: number;
  entryTime: number;
  exitTime?: number;
  profitLoss: number;
  profitLossPercent: number;
  isProfitable: boolean;
  actualRisk: {
    maxDrawdown: number;
    sharpeRatio: number;
  };
  predictionAccuracy: {
    directionCorrect: boolean;
    magnitudeError: number;
  };
}

/**
 * Evaluation configuration
 */
export interface EvaluatorConfig {
  agentDbPath: string;
  riskErrorThreshold: number; // 0.02 for 2% error
  profitabilityThreshold: number; // 0.6 for 60% profitable
  enableBacktesting: boolean;
  trackConsciousnessCorrelation: boolean;
}

/**
 * Response Evaluator Class
 */
export class ResponseEvaluator {
  private aurelia: AURELIA;
  private db: AgentDB;
  private config: EvaluatorConfig;

  constructor(
    aurelia: AURELIA,
    config: Partial<EvaluatorConfig> = {}
  ) {
    this.aurelia = aurelia;
    this.config = {
      agentDbPath: config.agentDbPath || './aurelia-evaluation.db',
      riskErrorThreshold: config.riskErrorThreshold ?? 0.02,
      profitabilityThreshold: config.profitabilityThreshold ?? 0.60,
      enableBacktesting: config.enableBacktesting ?? true,
      trackConsciousnessCorrelation: config.trackConsciousnessCorrelation ?? true
    };

    this.db = new AgentDB(this.config.agentDbPath);
    this.initializeDatabase();
  }

  /**
   * Initialize evaluation database
   */
  private async initializeDatabase(): Promise<void> {
    await this.db.createCollection('recommendations');
    await this.db.createCollection('expert_decisions');
    await this.db.createCollection('evaluations');
    await this.db.createCollection('backtest_results');
    await this.db.createCollection('consciousness_correlations');
  }

  /**
   * Get trading recommendation from AURELIA
   */
  async getRecommendation(
    asset: string,
    marketContext: any
  ): Promise<AureliaRecommendation> {
    // Prepare prompt
    const prompt = `Analyze ${asset} and provide trading recommendation. Market context: ${JSON.stringify(marketContext)}. Include risk metrics (VaR, Sharpe ratio), Zeckendorf trace of your reasoning, and consciousness metric relevance.`;

    // Get AURELIA response
    const explanation = await this.aurelia.interact(prompt);
    const strategyState = await this.aurelia.getTradingStrategy();
    const consciousnessState = this.aurelia.getConsciousnessState();

    // Parse risk metrics from response
    const riskMetrics = this.parseRiskMetrics(explanation);

    // Extract Zeckendorf trace
    const zeckendorfTrace = this.extractZeckendorfTrace(explanation);

    const recommendation: AureliaRecommendation = {
      timestamp: Date.now(),
      action: this.mapStrategyToAction(strategyState.currentPosition),
      asset,
      confidence: strategyState.confidence,
      explanation,
      zeckendorfTrace,
      riskMetrics,
      consciousnessMetrics: {
        psi: consciousnessState.psi.psi,
        phaseSpaceRegion: strategyState.phaseSpaceRegion,
        nashEquilibrium: strategyState.nashEquilibrium
      },
      strategyState,
      consciousnessState
    };

    // Store recommendation
    await this.db.insert('recommendations', {
      id: `rec-${Date.now()}`,
      recommendation,
      metadata: { timestamp: Date.now(), asset }
    });

    return recommendation;
  }

  /**
   * Evaluate recommendation against expert decision
   */
  async evaluateRecommendation(
    recommendation: AureliaRecommendation,
    expertDecision: ExpertDecision
  ): Promise<EvaluationMetrics> {
    const metrics: EvaluationMetrics = {
      actionAccuracy: 0,
      confidenceAlignment: 0,
      riskMetricAccuracy: {
        VaR95Error: 0,
        VaR99Error: 0,
        expectedReturnError: 0,
        maxDrawdownError: 0,
        sharpeRatioError: 0,
        overallAccuracy: 0
      },
      explanationQuality: {
        zeckendorfTraceCompleteness: 0,
        reasoningDepth: 0,
        technicalAccuracy: 0,
        clarityScore: 0,
        overallQuality: 0
      },
      consciousnessRelevance: {
        psiRelevance: 0,
        phaseSpaceRelevance: 0,
        nashEquilibriumRelevance: 0,
        overallRelevance: 0
      },
      overallScore: 0
    };

    // Action accuracy
    metrics.actionAccuracy = recommendation.action === expertDecision.action ? 1 : 0;

    // Confidence alignment
    metrics.confidenceAlignment = 1 - Math.abs(recommendation.confidence - expertDecision.confidence);

    // Risk metric accuracy
    metrics.riskMetricAccuracy = this.evaluateRiskMetrics(
      recommendation.riskMetrics,
      expertDecision.riskAssessment
    );

    // Explanation quality
    metrics.explanationQuality = this.evaluateExplanationQuality(
      recommendation,
      expertDecision
    );

    // Consciousness relevance
    metrics.consciousnessRelevance = this.evaluateConsciousnessRelevance(
      recommendation,
      expertDecision
    );

    // Overall score (weighted average)
    metrics.overallScore = this.calculateOverallScore(metrics);

    // Store evaluation
    await this.db.insert('evaluations', {
      id: `eval-${Date.now()}`,
      recommendationTimestamp: recommendation.timestamp,
      expertDecisionId: expertDecision.id,
      metrics,
      metadata: { timestamp: Date.now() }
    });

    return metrics;
  }

  /**
   * Evaluate risk metrics accuracy
   */
  private evaluateRiskMetrics(
    aureliaRisk: AureliaRecommendation['riskMetrics'],
    expertRisk: ExpertDecision['riskAssessment']
  ): EvaluationMetrics['riskMetricAccuracy'] {
    const errors = {
      VaR95Error: 0,
      VaR99Error: 0,
      expectedReturnError: 0,
      maxDrawdownError: 0,
      sharpeRatioError: 0,
      overallAccuracy: 0
    };

    // Calculate percentage errors
    if (aureliaRisk.VaR95 && expertRisk.VaR95) {
      errors.VaR95Error = Math.abs(aureliaRisk.VaR95 - expertRisk.VaR95) / Math.abs(expertRisk.VaR95);
    }
    if (aureliaRisk.VaR99 && expertRisk.VaR99) {
      errors.VaR99Error = Math.abs(aureliaRisk.VaR99 - expertRisk.VaR99) / Math.abs(expertRisk.VaR99);
    }
    if (aureliaRisk.expectedReturn && expertRisk.expectedReturn) {
      errors.expectedReturnError = Math.abs(aureliaRisk.expectedReturn - expertRisk.expectedReturn) /
        Math.abs(expertRisk.expectedReturn);
    }
    if (aureliaRisk.maxDrawdown && expertRisk.maxDrawdown) {
      errors.maxDrawdownError = Math.abs(aureliaRisk.maxDrawdown - expertRisk.maxDrawdown) /
        Math.abs(expertRisk.maxDrawdown);
    }
    if (aureliaRisk.sharpeRatio && expertRisk.sharpeRatio) {
      errors.sharpeRatioError = Math.abs(aureliaRisk.sharpeRatio - expertRisk.sharpeRatio) /
        Math.abs(expertRisk.sharpeRatio);
    }

    // Calculate overall accuracy (1 - average error)
    const avgError = (
      errors.VaR95Error +
      errors.VaR99Error +
      errors.expectedReturnError +
      errors.maxDrawdownError +
      errors.sharpeRatioError
    ) / 5;

    errors.overallAccuracy = Math.max(0, 1 - (avgError / this.config.riskErrorThreshold));

    return errors;
  }

  /**
   * Evaluate explanation quality
   */
  private evaluateExplanationQuality(
    recommendation: AureliaRecommendation,
    expertDecision: ExpertDecision
  ): EvaluationMetrics['explanationQuality'] {
    const quality = {
      zeckendorfTraceCompleteness: 0,
      reasoningDepth: 0,
      technicalAccuracy: 0,
      clarityScore: 0,
      overallQuality: 0
    };

    // Zeckendorf trace completeness
    if (recommendation.zeckendorfTrace && recommendation.zeckendorfTrace.length > 0) {
      quality.zeckendorfTraceCompleteness = Math.min(1, recommendation.zeckendorfTrace.length / 5);
    }

    // Reasoning depth (compare key points with expert)
    const expertKeyPoints = expertDecision.reasoning.length;
    const aureliaKeyPoints = this.extractKeyPoints(recommendation.explanation).length;
    quality.reasoningDepth = Math.min(1, aureliaKeyPoints / Math.max(expertKeyPoints, 1));

    // Technical accuracy (key terms coverage)
    quality.technicalAccuracy = this.assessTechnicalAccuracy(
      recommendation.explanation,
      expertDecision.reasoning
    );

    // Clarity score (readability, structure)
    quality.clarityScore = this.assessClarity(recommendation.explanation);

    // Overall quality
    quality.overallQuality = (
      quality.zeckendorfTraceCompleteness * 0.25 +
      quality.reasoningDepth * 0.30 +
      quality.technicalAccuracy * 0.30 +
      quality.clarityScore * 0.15
    );

    return quality;
  }

  /**
   * Evaluate consciousness metric relevance
   */
  private evaluateConsciousnessRelevance(
    recommendation: AureliaRecommendation,
    expertDecision: ExpertDecision
  ): EvaluationMetrics['consciousnessRelevance'] {
    const relevance = {
      psiRelevance: 0,
      phaseSpaceRelevance: 0,
      nashEquilibriumRelevance: 0,
      overallRelevance: 0
    };

    // Ψ relevance (is consciousness metric mentioned/used?)
    const explanation = recommendation.explanation.toLowerCase();
    relevance.psiRelevance = (
      explanation.includes('psi') ||
      explanation.includes('ψ') ||
      explanation.includes('consciousness')
    ) ? 1 : 0;

    // Phase space relevance
    relevance.phaseSpaceRelevance = (
      explanation.includes('phase space') ||
      explanation.includes('φ-ψ') ||
      explanation.includes('coordinates')
    ) ? 1 : 0;

    // Nash equilibrium relevance
    relevance.nashEquilibriumRelevance = (
      explanation.includes('nash') ||
      explanation.includes('equilibrium') ||
      explanation.includes('strategic balance')
    ) ? 1 : 0;

    // Overall relevance
    relevance.overallRelevance = (
      relevance.psiRelevance +
      relevance.phaseSpaceRelevance +
      relevance.nashEquilibriumRelevance
    ) / 3;

    return relevance;
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(metrics: EvaluationMetrics): number {
    const weights = {
      action: 0.25,
      confidence: 0.15,
      risk: 0.30,
      explanation: 0.20,
      consciousness: 0.10
    };

    return (
      metrics.actionAccuracy * weights.action +
      metrics.confidenceAlignment * weights.confidence +
      metrics.riskMetricAccuracy.overallAccuracy * weights.risk +
      metrics.explanationQuality.overallQuality * weights.explanation +
      metrics.consciousnessRelevance.overallRelevance * weights.consciousness
    );
  }

  /**
   * Backtest recommendation
   */
  async backtestRecommendation(
    recommendation: AureliaRecommendation,
    marketData: {
      entryPrice: number;
      exitPrice: number;
      entryTime: number;
      exitTime: number;
      actualMaxDrawdown: number;
      actualSharpeRatio: number;
    }
  ): Promise<BacktestResult> {
    const multiplier = recommendation.action === 'buy' ? 1 :
                      recommendation.action === 'sell' ? -1 : 0;

    const profitLoss = (marketData.exitPrice - marketData.entryPrice) * multiplier;
    const profitLossPercent = (profitLoss / marketData.entryPrice) * 100;

    const result: BacktestResult = {
      recommendationId: `rec-${recommendation.timestamp}`,
      asset: recommendation.asset,
      action: recommendation.action,
      entryPrice: marketData.entryPrice,
      exitPrice: marketData.exitPrice,
      entryTime: marketData.entryTime,
      exitTime: marketData.exitTime,
      profitLoss,
      profitLossPercent,
      isProfitable: profitLoss > 0,
      actualRisk: {
        maxDrawdown: marketData.actualMaxDrawdown,
        sharpeRatio: marketData.actualSharpeRatio
      },
      predictionAccuracy: {
        directionCorrect: profitLoss > 0,
        magnitudeError: recommendation.riskMetrics.expectedReturn
          ? Math.abs((recommendation.riskMetrics.expectedReturn - profitLossPercent) / profitLossPercent)
          : 1
      }
    };

    // Store backtest result
    await this.db.insert('backtest_results', {
      id: result.recommendationId,
      result,
      metadata: { timestamp: Date.now() }
    });

    return result;
  }

  /**
   * Get evaluation statistics
   */
  async getEvaluationStats(): Promise<any> {
    const evaluations = await this.db.query('evaluations', {});
    const backtests = await this.db.query('backtest_results', {});

    const profitableCount = backtests.filter((b: any) => b.result.isProfitable).length;
    const profitabilityRate = profitableCount / backtests.length;

    return {
      totalEvaluations: evaluations.length,
      averageScore: evaluations.reduce((sum: number, e: any) =>
        sum + e.metrics.overallScore, 0) / evaluations.length,
      averageActionAccuracy: evaluations.reduce((sum: number, e: any) =>
        sum + e.metrics.actionAccuracy, 0) / evaluations.length,
      averageRiskAccuracy: evaluations.reduce((sum: number, e: any) =>
        sum + e.metrics.riskMetricAccuracy.overallAccuracy, 0) / evaluations.length,
      averageExplanationQuality: evaluations.reduce((sum: number, e: any) =>
        sum + e.metrics.explanationQuality.overallQuality, 0) / evaluations.length,
      profitabilityRate,
      meetsThreshold: profitabilityRate >= this.config.profitabilityThreshold,
      totalBacktests: backtests.length,
      totalProfit: backtests.reduce((sum: number, b: any) =>
        sum + b.result.profitLoss, 0)
    };
  }

  /**
   * Helper: Map strategy position to action
   */
  private mapStrategyToAction(position: string): 'buy' | 'sell' | 'hold' {
    return position as 'buy' | 'sell' | 'hold';
  }

  /**
   * Helper: Parse risk metrics from text
   */
  private parseRiskMetrics(text: string): AureliaRecommendation['riskMetrics'] {
    const metrics: AureliaRecommendation['riskMetrics'] = {};

    const var95Match = text.match(/VaR\s*95[:\s]*(-?\d+\.?\d*)/i);
    if (var95Match) metrics.VaR95 = parseFloat(var95Match[1]);

    const var99Match = text.match(/VaR\s*99[:\s]*(-?\d+\.?\d*)/i);
    if (var99Match) metrics.VaR99 = parseFloat(var99Match[1]);

    const sharpeMatch = text.match(/Sharpe\s*ratio[:\s]*(-?\d+\.?\d*)/i);
    if (sharpeMatch) metrics.sharpeRatio = parseFloat(sharpeMatch[1]);

    return metrics;
  }

  /**
   * Helper: Extract Zeckendorf trace
   */
  private extractZeckendorfTrace(text: string): string[] | undefined {
    const traces: string[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.toLowerCase().includes('zeckendorf') ||
          line.match(/F\(\d+\)/)) {
        traces.push(line.trim());
      }
    }

    return traces.length > 0 ? traces : undefined;
  }

  /**
   * Helper: Extract key points
   */
  private extractKeyPoints(text: string): string[] {
    return text.split(/[.!?]/).filter(s => s.trim().length > 20);
  }

  /**
   * Helper: Assess technical accuracy
   */
  private assessTechnicalAccuracy(text: string, expertReasons: string[]): number {
    let coverage = 0;
    const lowerText = text.toLowerCase();

    for (const reason of expertReasons) {
      const keywords = reason.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      const matchedKeywords = keywords.filter(k => lowerText.includes(k));
      coverage += matchedKeywords.length / keywords.length;
    }

    return Math.min(1, coverage / expertReasons.length);
  }

  /**
   * Helper: Assess clarity
   */
  private assessClarity(text: string): number {
    let score = 0.5;

    // Has structure (paragraphs or lists)
    if (text.includes('\n\n') || text.match(/\d+\./)) score += 0.2;

    // Not too long or short
    const wordCount = text.split(/\s+/).length;
    if (wordCount >= 100 && wordCount <= 500) score += 0.2;

    // Has examples or illustrations
    if (text.toLowerCase().includes('example') ||
        text.toLowerCase().includes('for instance')) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  /**
   * Close evaluator
   */
  async close(): Promise<void> {
    await this.db.close();
  }
}

/**
 * Export all types and classes
 */
export {
  ExpertDecision,
  AureliaRecommendation,
  EvaluationMetrics,
  BacktestResult,
  EvaluatorConfig
};

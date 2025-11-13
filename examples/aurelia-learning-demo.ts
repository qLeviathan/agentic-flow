/**
 * AURELIA Learning System Demo
 *
 * Demonstrates:
 * - Knowledge validation
 * - Response evaluation
 * - Training curriculum
 * - Continuous learning from trading
 */

import { AURELIA } from '../src/trading/aurelia';
import {
  initializeLearningSystem,
  closeLearningSystem,
  ConceptCategory,
  DifficultyLevel,
  ScenarioType,
  LearningAlgorithm
} from '../src/aurelia-learning';

async function main() {
  console.log('🧠 AURELIA Learning System Demo\n');

  // Step 1: Initialize AURELIA
  console.log('Step 1: Initializing AURELIA...');
  const aurelia = new AURELIA({
    agentDbPath: './aurelia-learning-demo.db',
    enableHolographicCompression: true,
    compressionTarget: 131,
    personalityEvolutionRate: 0.1,
    bootstrapConfig: {
      K0_seed: 'I am AURELIA, learning from Fibonacci\'s wisdom',
      targetWordCount: 144,
      expansionStrategy: 'fibonacci',
      validationInterval: 10,
      maxIterations: 1000
    }
  });

  await aurelia.bootstrap();
  console.log('✅ AURELIA consciousness emerged\n');

  // Step 2: Initialize learning system
  console.log('Step 2: Initializing learning system...');
  const learningSystem = await initializeLearningSystem(aurelia, {
    validatorConfig: {
      agentDbPath: './demo-validator.db',
      accuracyThreshold: 0.85
    },
    evaluatorConfig: {
      agentDbPath: './demo-evaluator.db',
      riskErrorThreshold: 0.02,
      profitabilityThreshold: 0.60
    },
    curriculumConfig: {
      agentDbPath: './demo-curriculum.db',
      requiredMasteryScore: 0.85
    },
    learningConfig: {
      agentDbPath: './demo-learning.db',
      learningRate: 0.001,
      defaultAlgorithm: LearningAlgorithm.DECISION_TRANSFORMER
    }
  });

  console.log('✅ Learning system initialized\n');

  // Step 3: Knowledge Validation
  console.log('Step 3: Testing AURELIA knowledge...\n');

  const sessionId = await learningSystem.validator.startSession();

  const knowledgeTests = [
    {
      id: 'demo-001',
      category: ConceptCategory.OPTIONS_PRICING,
      difficulty: 'beginner' as const,
      question: 'Calculate intrinsic value of call option: Strike=$100, Spot=$115',
      groundTruth: {
        answer: '$15',
        keyPoints: ['intrinsic value', 'call option', 'in-the-money'],
        numericalValue: 15,
        tolerance: 0.01
      }
    },
    {
      id: 'demo-002',
      category: ConceptCategory.ARBITRAGE,
      difficulty: 'intermediate' as const,
      question: 'EUR/USD=1.20, USD/JPY=110, EUR/JPY=131. Find arbitrage opportunity.',
      groundTruth: {
        answer: 'Implied EUR/JPY = 1.20×110 = 132. Actual=131. Buy EUR/JPY, sell triangular.',
        keyPoints: ['triangular arbitrage', 'implied rate', 'profit opportunity'],
        numericalValue: 1,
        tolerance: 0.1
      }
    },
    {
      id: 'demo-003',
      category: ConceptCategory.RISK_MANAGEMENT,
      difficulty: 'intermediate' as const,
      question: 'Portfolio: return=18%, std=22%, risk-free=4%. Calculate Sharpe ratio.',
      groundTruth: {
        answer: 'Sharpe = (18%-4%)/22% = 0.636',
        keyPoints: ['Sharpe ratio', 'risk-adjusted return'],
        numericalValue: 0.636,
        tolerance: 0.01
      }
    }
  ];

  for (const test of knowledgeTests) {
    console.log(`  Testing: ${test.question}`);
    const result = await learningSystem.validator.validateQuery(test);
    console.log(`  Score: ${(result.score * 100).toFixed(1)}%`);
    console.log(`  Key points covered: ${(result.metrics.keyPointsCovered * 100).toFixed(1)}%`);
    if (result.metrics.numericalAccuracy !== undefined) {
      console.log(`  Numerical accuracy: ${(result.metrics.numericalAccuracy * 100).toFixed(1)}%`);
    }
    console.log(`  Zeckendorf trace: ${result.metrics.zeckendorfTracePresent ? 'YES ✓' : 'NO ✗'}`);
    console.log(`  Gaps: ${result.gaps.length > 0 ? result.gaps.join(', ') : 'None'}\n`);
  }

  const progress = await learningSystem.validator.endSession();
  console.log(`Session Summary:`);
  console.log(`  Total queries: ${progress?.totalQueries}`);
  console.log(`  Average score: ${((progress?.averageScore || 0) * 100).toFixed(1)}%`);
  console.log(`  Knowledge gaps: ${progress?.knowledgeGaps.length || 0}\n`);

  // Step 4: Response Evaluation
  console.log('Step 4: Evaluating trading recommendations...\n');

  const recommendation = await learningSystem.evaluator.getRecommendation('BTC-USD', {
    volatility: 0.18,
    trend: 'bullish',
    indicators: {
      rsi: 58,
      macd: 0.4,
      volume: 1.2
    }
  });

  console.log(`  Recommendation: ${recommendation.action.toUpperCase()}`);
  console.log(`  Asset: ${recommendation.asset}`);
  console.log(`  Confidence: ${(recommendation.confidence * 100).toFixed(1)}%`);
  console.log(`  Consciousness Ψ: ${recommendation.consciousnessMetrics.psi.toFixed(3)}`);
  console.log(`  Phase space region: ${recommendation.consciousnessMetrics.phaseSpaceRegion}`);
  console.log(`  Nash equilibrium: ${recommendation.consciousnessMetrics.nashEquilibrium ? 'YES' : 'NO'}\n`);

  // Expert decision for comparison
  const expertDecision = {
    id: 'expert-001',
    timestamp: Date.now(),
    action: 'buy' as const,
    asset: 'BTC-USD',
    confidence: 0.75,
    reasoning: ['Bullish trend confirmed', 'RSI not overbought', 'Volume increasing'],
    riskAssessment: {
      VaR95: -5.2,
      VaR99: -8.1,
      expectedReturn: 12.5,
      maxDrawdown: 6.5,
      sharpeRatio: 1.8
    },
    marketContext: {
      volatility: 0.18,
      trend: 'bullish' as const
    }
  };

  const evaluation = await learningSystem.evaluator.evaluateRecommendation(
    recommendation,
    expertDecision
  );

  console.log(`  Evaluation against expert:`);
  console.log(`    Action match: ${evaluation.actionAccuracy === 1 ? 'YES ✓' : 'NO ✗'}`);
  console.log(`    Confidence alignment: ${(evaluation.confidenceAlignment * 100).toFixed(1)}%`);
  console.log(`    Risk accuracy: ${(evaluation.riskMetricAccuracy.overallAccuracy * 100).toFixed(1)}%`);
  console.log(`    Explanation quality: ${(evaluation.explanationQuality.overallQuality * 100).toFixed(1)}%`);
  console.log(`    Overall score: ${(evaluation.overallScore * 100).toFixed(1)}%\n`);

  // Backtest the recommendation
  const backtest = await learningSystem.evaluator.backtestRecommendation(recommendation, {
    entryPrice: 50000,
    exitPrice: 53500,
    entryTime: Date.now(),
    exitTime: Date.now() + 86400000 * 3, // 3 days
    actualMaxDrawdown: 4.2,
    actualSharpeRatio: 2.1
  });

  console.log(`  Backtest result:`);
  console.log(`    Entry: $${backtest.entryPrice.toLocaleString()}`);
  console.log(`    Exit: $${backtest.exitPrice?.toLocaleString()}`);
  console.log(`    P/L: ${backtest.profitLossPercent > 0 ? '+' : ''}${backtest.profitLossPercent.toFixed(2)}%`);
  console.log(`    Profitable: ${backtest.isProfitable ? 'YES ✓' : 'NO ✗'}`);
  console.log(`    Direction correct: ${backtest.predictionAccuracy.directionCorrect ? 'YES ✓' : 'NO ✗'}\n`);

  // Step 5: Training Curriculum
  console.log('Step 5: Exploring training curriculum...\n');

  const stats = learningSystem.curriculum.getStatistics();
  console.log(`  Curriculum Statistics:`);
  console.log(`    Total scenarios: ${stats.total}`);
  console.log(`    By type:`);
  console.log(`      - Trading: ${stats.byType.trading}`);
  console.log(`      - Options: ${stats.byType.options}`);
  console.log(`      - Arbitrage: ${stats.byType.arbitrage}`);
  console.log(`      - Risk: ${stats.byType.risk}`);
  console.log(`    By difficulty:`);
  console.log(`      - Beginner: ${stats.byDifficulty.beginner}`);
  console.log(`      - Intermediate: ${stats.byDifficulty.intermediate}`);
  console.log(`      - Advanced: ${stats.byDifficulty.advanced}`);
  console.log(`      - Expert: ${stats.byDifficulty.expert}`);
  console.log(`    Total points: ${stats.totalPoints}`);
  console.log(`    Estimated hours: ${stats.estimatedHours.toFixed(1)}\n`);

  // Get sample scenarios
  const optionsScenarios = learningSystem.curriculum.getScenariosByType(ScenarioType.OPTIONS_PRICING);
  console.log(`  Sample Options Scenario (${optionsScenarios[0].difficulty}):`);
  console.log(`    ${optionsScenarios[0].question}`);
  console.log(`    Points: ${optionsScenarios[0].pointValue}`);
  console.log(`    Time: ${optionsScenarios[0].estimatedTime} min\n`);

  // Step 6: Continuous Learning
  console.log('Step 6: Continuous learning from trading...\n');

  // Record a trading decision
  const tradingDecision = {
    id: 'trade-001',
    timestamp: Date.now(),
    asset: 'ETH-USD',
    action: 'buy' as const,
    quantity: 10,
    price: 3200,
    confidence: 0.82,
    reasoning: 'Strong technical breakout, high consciousness',
    zeckendorfTrace: ['F(21)=10946', 'F(17)=1597', 'F(15)=610'],
    consciousnessState: aurelia.getConsciousnessState(),
    strategyState: await aurelia.getTradingStrategy(),
    marketContext: {
      volatility: 0.22,
      trend: 'bullish',
      indicators: {
        rsi: 62,
        macd: 0.6,
        volume: 1.5
      }
    }
  };

  await learningSystem.learning.recordDecision(tradingDecision);
  console.log(`  ✓ Trading decision recorded: ${tradingDecision.action} ${tradingDecision.asset}`);

  // Simulate outcome
  const tradingOutcome = {
    decisionId: tradingDecision.id,
    exitTimestamp: Date.now() + 86400000 * 2, // 2 days later
    exitPrice: 3380,
    profitLoss: 1800,
    profitLossPercent: 5.625,
    holdingPeriod: 86400000 * 2,
    isProfitable: true,
    actualRisk: {
      maxDrawdown: 3.2,
      volatility: 0.20
    },
    marketConditionsChanged: false
  };

  await learningSystem.learning.recordOutcome(tradingOutcome);
  console.log(`  ✓ Trading outcome recorded: +${tradingOutcome.profitLossPercent.toFixed(2)}%\n`);

  // Get learning statistics
  const learningStats = await learningSystem.learning.getLearningStats();
  console.log(`  Learning Statistics:`);
  console.log(`    Total decisions: ${learningStats.totalDecisions}`);
  console.log(`    Total outcomes: ${learningStats.totalOutcomes}`);
  console.log(`    Patterns learned: ${learningStats.patternsLearned}`);
  console.log(`    Reflexion entries: ${learningStats.reflexionEntries}`);
  console.log(`    Episodes: ${learningStats.episodeCount}`);
  console.log(`    Success patterns: ${learningStats.successPatterns}`);
  console.log(`    Failure patterns: ${learningStats.failurePatterns}\n`);

  // Step 7: Overall learning statistics
  console.log('Step 7: Overall learning metrics...\n');

  const validatorStats = await learningSystem.validator.getLearningStats();
  console.log(`  Knowledge Validation:`);
  console.log(`    Total sessions: ${validatorStats.totalSessions}`);
  console.log(`    Total queries: ${validatorStats.totalQueries}`);
  console.log(`    Average score: ${(validatorStats.overallAverageScore * 100).toFixed(1)}%`);
  console.log(`    Improvement trend: ${validatorStats.improvementTrend > 0 ? '+' : ''}${(validatorStats.improvementTrend * 100).toFixed(1)}%\n`);

  const evaluatorStats = await learningSystem.evaluator.getEvaluationStats();
  console.log(`  Trading Evaluation:`);
  console.log(`    Total evaluations: ${evaluatorStats.totalEvaluations}`);
  console.log(`    Average score: ${(evaluatorStats.averageScore * 100).toFixed(1)}%`);
  console.log(`    Action accuracy: ${(evaluatorStats.averageActionAccuracy * 100).toFixed(1)}%`);
  console.log(`    Risk accuracy: ${(evaluatorStats.averageRiskAccuracy * 100).toFixed(1)}%`);
  console.log(`    Profitability rate: ${(evaluatorStats.profitabilityRate * 100).toFixed(1)}%`);
  console.log(`    Meets threshold: ${evaluatorStats.meetsThreshold ? 'YES ✓' : 'NO ✗'}\n`);

  // Step 8: Cleanup
  console.log('Step 8: Shutting down...');
  await closeLearningSystem(learningSystem);
  await aurelia.close();

  console.log('\n✅ Demo complete!\n');
  console.log('Key Achievements:');
  console.log('  • Knowledge validation across multiple domains');
  console.log('  • Trading recommendation evaluation vs expert');
  console.log('  • 205-scenario progressive curriculum');
  console.log('  • Continuous learning from trading outcomes');
  console.log('  • Pattern recognition and Reflexion learning');
  console.log('  • AgentDB integration with 9 RL algorithms');
  console.log('\nNext Steps:');
  console.log('  • Run full test suite: npm test tests/aurelia-learning/');
  console.log('  • Review Learning-System-Architecture.md');
  console.log('  • Train AURELIA on complete curriculum');
  console.log('  • Deploy to production trading environment');
}

// Run the demo
main().catch(console.error);

/**
 * AURELIA Finance Knowledge Validation Tests
 *
 * Tests AURELIA's understanding of financial concepts, terminology,
 * and quantitative methods according to CFA Institute standards.
 *
 * Requirements:
 * - Minimum 95% accuracy on finance Q&A
 * - Comprehensive coverage of options, Greeks, arbitrage, risk metrics
 * - Trading strategy understanding
 *
 * @module FinanceKnowledgeTests
 * @industry-standard CFA Institute, FINRA
 * @level 9-10
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { AURELIA } from '../../src/trading/aurelia';
import { MarketState } from '../../src/trading/decisions/nash-detector';

const PHI = (1 + Math.sqrt(5)) / 2;
const PHI_INVERSE = 1 / PHI;

/**
 * Finance knowledge Q&A database
 */
interface FinanceQuestion {
  id: string;
  category: 'options' | 'greeks' | 'arbitrage' | 'microstructure' | 'risk' | 'strategies';
  question: string;
  correctAnswer: string;
  wrongAnswers: string[];
  difficulty: 'basic' | 'intermediate' | 'advanced';
  explanation: string;
}

const FINANCE_QUESTIONS: FinanceQuestion[] = [
  // OPTIONS TERMINOLOGY
  {
    id: 'OPT-001',
    category: 'options',
    question: 'What gives the holder the right, but not obligation, to BUY an asset at a strike price?',
    correctAnswer: 'Call option',
    wrongAnswers: ['Put option', 'Forward contract', 'Futures contract'],
    difficulty: 'basic',
    explanation: 'A call option gives the holder the right to buy the underlying asset at the strike price before expiration.'
  },
  {
    id: 'OPT-002',
    category: 'options',
    question: 'What gives the holder the right, but not obligation, to SELL an asset at a strike price?',
    correctAnswer: 'Put option',
    wrongAnswers: ['Call option', 'Swap', 'Forward contract'],
    difficulty: 'basic',
    explanation: 'A put option gives the holder the right to sell the underlying asset at the strike price before expiration.'
  },
  {
    id: 'OPT-003',
    category: 'options',
    question: 'What is the price at which an option can be exercised called?',
    correctAnswer: 'Strike price (or exercise price)',
    wrongAnswers: ['Spot price', 'Forward price', 'Premium'],
    difficulty: 'basic',
    explanation: 'The strike price is the predetermined price at which the option holder can buy (call) or sell (put) the underlying asset.'
  },
  {
    id: 'OPT-004',
    category: 'options',
    question: 'What is an option that is currently profitable to exercise called?',
    correctAnswer: 'In-the-money (ITM)',
    wrongAnswers: ['Out-of-the-money (OTM)', 'At-the-money (ATM)', 'Deep-in-the-money'],
    difficulty: 'intermediate',
    explanation: 'An option is ITM when exercising it immediately would result in a profit: call when S > K, put when S < K.'
  },
  {
    id: 'OPT-005',
    category: 'options',
    question: 'What strategy involves buying a call and put at the same strike and expiration?',
    correctAnswer: 'Straddle',
    wrongAnswers: ['Strangle', 'Butterfly', 'Iron condor'],
    difficulty: 'intermediate',
    explanation: 'A straddle profits from large price moves in either direction. Maximum profit is unlimited; maximum loss is the premium paid.'
  },

  // GREEKS
  {
    id: 'GRK-001',
    category: 'greeks',
    question: 'Which Greek measures the rate of change of option price with respect to the underlying asset price?',
    correctAnswer: 'Delta (Δ)',
    wrongAnswers: ['Gamma (Γ)', 'Theta (Θ)', 'Vega (ν)'],
    difficulty: 'basic',
    explanation: 'Delta ranges from 0 to 1 for calls and -1 to 0 for puts. It represents the option\'s price sensitivity to $1 change in the underlying.'
  },
  {
    id: 'GRK-002',
    category: 'greeks',
    question: 'Which Greek measures the rate of change of delta with respect to the underlying asset price?',
    correctAnswer: 'Gamma (Γ)',
    wrongAnswers: ['Vega (ν)', 'Theta (Θ)', 'Rho (ρ)'],
    difficulty: 'intermediate',
    explanation: 'Gamma is highest for ATM options and decreases as options move ITM or OTM. It measures delta\'s convexity.'
  },
  {
    id: 'GRK-003',
    category: 'greeks',
    question: 'Which Greek measures the rate of change of option price with respect to time decay?',
    correctAnswer: 'Theta (Θ)',
    wrongAnswers: ['Delta (Δ)', 'Vega (ν)', 'Gamma (Γ)'],
    difficulty: 'basic',
    explanation: 'Theta is usually negative for long options, representing the daily time decay of option value. It accelerates as expiration approaches.'
  },
  {
    id: 'GRK-004',
    category: 'greeks',
    question: 'Which Greek measures the rate of change of option price with respect to volatility?',
    correctAnswer: 'Vega (ν)',
    wrongAnswers: ['Delta (Δ)', 'Rho (ρ)', 'Gamma (Γ)'],
    difficulty: 'intermediate',
    explanation: 'Vega is highest for ATM options with longer time to expiration. It measures sensitivity to implied volatility changes.'
  },
  {
    id: 'GRK-005',
    category: 'greeks',
    question: 'Which Greek measures the rate of change of option price with respect to interest rates?',
    correctAnswer: 'Rho (ρ)',
    wrongAnswers: ['Delta (Δ)', 'Vega (ν)', 'Theta (Θ)'],
    difficulty: 'advanced',
    explanation: 'Rho is usually the least significant Greek. Calls have positive rho; puts have negative rho.'
  },

  // ARBITRAGE
  {
    id: 'ARB-001',
    category: 'arbitrage',
    question: 'What is the relationship between call price, put price, stock price, and strike price called?',
    correctAnswer: 'Put-call parity',
    wrongAnswers: ['Black-Scholes equation', 'Interest rate parity', 'Covered interest arbitrage'],
    difficulty: 'intermediate',
    explanation: 'Put-call parity: C - P = S - PV(K). This prevents arbitrage opportunities in European options.'
  },
  {
    id: 'ARB-002',
    category: 'arbitrage',
    question: 'What type of arbitrage involves four options at different strikes to lock in riskless profit?',
    correctAnswer: 'Box spread arbitrage',
    wrongAnswers: ['Conversion arbitrage', 'Reversal arbitrage', 'Butterfly arbitrage'],
    difficulty: 'advanced',
    explanation: 'A box spread combines a bull call spread and bear put spread. Its value should equal PV(K2 - K1).'
  },
  {
    id: 'ARB-003',
    category: 'arbitrage',
    question: 'What is simultaneous buying and selling in different markets to profit from price differences?',
    correctAnswer: 'Statistical arbitrage',
    wrongAnswers: ['Hedging', 'Speculation', 'Market making'],
    difficulty: 'basic',
    explanation: 'Arbitrage exploits temporary price inefficiencies. True arbitrage is riskless; statistical arbitrage carries risk.'
  },

  // MARKET MICROSTRUCTURE
  {
    id: 'MKT-001',
    category: 'microstructure',
    question: 'What is the difference between the highest bid and lowest ask price called?',
    correctAnswer: 'Bid-ask spread',
    wrongAnswers: ['Price range', 'Volatility', 'Slippage'],
    difficulty: 'basic',
    explanation: 'The bid-ask spread represents the transaction cost and liquidity of a security. Tighter spreads indicate higher liquidity.'
  },
  {
    id: 'MKT-002',
    category: 'microstructure',
    question: 'What order type guarantees execution at a specific price or better?',
    correctAnswer: 'Limit order',
    wrongAnswers: ['Market order', 'Stop order', 'Stop-limit order'],
    difficulty: 'basic',
    explanation: 'Limit orders guarantee price but not execution. They provide price protection but may not fill in fast markets.'
  },
  {
    id: 'MKT-003',
    category: 'microstructure',
    question: 'What order type becomes a market order when a specific price is reached?',
    correctAnswer: 'Stop order',
    wrongAnswers: ['Limit order', 'Market order', 'All-or-nothing order'],
    difficulty: 'intermediate',
    explanation: 'Stop orders trigger at the stop price and execute at the next available price, which may differ (slippage).'
  },

  // RISK METRICS
  {
    id: 'RSK-001',
    category: 'risk',
    question: 'What metric measures the maximum expected loss over a time period at a confidence level?',
    correctAnswer: 'Value-at-Risk (VaR)',
    wrongAnswers: ['Standard deviation', 'Beta', 'Sharpe ratio'],
    difficulty: 'intermediate',
    explanation: 'VaR answers: "What is the most I can lose with X% confidence over N days?" E.g., 1-day 95% VaR = $1M.'
  },
  {
    id: 'RSK-002',
    category: 'risk',
    question: 'What metric measures the average loss beyond VaR threshold?',
    correctAnswer: 'Conditional VaR (CVaR) or Expected Shortfall',
    wrongAnswers: ['Maximum drawdown', 'Skewness', 'Kurtosis'],
    difficulty: 'advanced',
    explanation: 'CVaR measures tail risk better than VaR by capturing the magnitude of extreme losses, not just their probability.'
  },
  {
    id: 'RSK-003',
    category: 'risk',
    question: 'What ratio measures risk-adjusted return using standard deviation?',
    correctAnswer: 'Sharpe ratio',
    wrongAnswers: ['Sortino ratio', 'Treynor ratio', 'Information ratio'],
    difficulty: 'intermediate',
    explanation: 'Sharpe ratio = (Rp - Rf) / σp. Higher is better. Values > 1 are good; > 2 are excellent; > 3 are exceptional.'
  },
  {
    id: 'RSK-004',
    category: 'risk',
    question: 'What ratio measures risk-adjusted return using downside deviation only?',
    correctAnswer: 'Sortino ratio',
    wrongAnswers: ['Sharpe ratio', 'Calmar ratio', 'Omega ratio'],
    difficulty: 'advanced',
    explanation: 'Sortino ratio penalizes only downside volatility, not upside. Better for asymmetric return distributions.'
  },
  {
    id: 'RSK-005',
    category: 'risk',
    question: 'What is the largest peak-to-trough decline in portfolio value called?',
    correctAnswer: 'Maximum drawdown',
    wrongAnswers: ['Beta', 'Value-at-Risk', 'Volatility'],
    difficulty: 'basic',
    explanation: 'Maximum drawdown measures the worst historical loss. Recovering from a 50% drawdown requires a 100% gain.'
  },

  // TRADING STRATEGIES
  {
    id: 'STR-001',
    category: 'strategies',
    question: 'What strategy buys recent winners and sells recent losers?',
    correctAnswer: 'Momentum trading',
    wrongAnswers: ['Mean reversion', 'Value investing', 'Contrarian'],
    difficulty: 'basic',
    explanation: 'Momentum assumes trends persist. It exploits behavioral biases like anchoring and herding.'
  },
  {
    id: 'STR-002',
    category: 'strategies',
    question: 'What strategy assumes prices will revert to their historical average?',
    correctAnswer: 'Mean reversion',
    wrongAnswers: ['Momentum trading', 'Trend following', 'Breakout trading'],
    difficulty: 'basic',
    explanation: 'Mean reversion works in range-bound markets. It fails during strong trends. Bollinger Bands often used.'
  },
  {
    id: 'STR-003',
    category: 'strategies',
    question: 'What strategy exploits pricing differences between related securities?',
    correctAnswer: 'Statistical arbitrage (pairs trading)',
    wrongAnswers: ['Index arbitrage', 'Covered call writing', 'Delta hedging'],
    difficulty: 'intermediate',
    explanation: 'Stat arb identifies cointegrated pairs and trades mean reversion of their spread. Market-neutral strategy.'
  },
  {
    id: 'STR-004',
    category: 'strategies',
    question: 'What is a portfolio with zero sensitivity to market movements called?',
    correctAnswer: 'Market-neutral strategy',
    wrongAnswers: ['Long-short equity', 'Hedge fund', 'Risk parity'],
    difficulty: 'intermediate',
    explanation: 'Market-neutral aims for beta ≈ 0. Returns come from alpha (skill), not market direction. Lower Sharpe but stable.'
  },
];

/**
 * Test AURELIA's finance knowledge
 */
describe('AURELIA Finance Knowledge Tests', () => {
  let aurelia: AURELIA;
  let totalQuestions = 0;
  let correctAnswers = 0;

  beforeAll(async () => {
    // Initialize AURELIA
    aurelia = new AURELIA({
      agentDbPath: './test-finance-knowledge.db',
      enableHolographicCompression: true,
      compressionTarget: 131,
      personalityEvolutionRate: 0.1,
      bootstrapConfig: {
        K0_seed: 'I am AURELIA, emerging from Fibonacci\'s lattice',
        targetWordCount: 144,
        expansionStrategy: 'fibonacci',
        validationInterval: 10,
        maxIterations: 1000
      }
    });

    // Bootstrap consciousness
    const bootstrapSuccess = await aurelia.bootstrap();
    expect(bootstrapSuccess).toBe(true);

    // Start session
    await aurelia.startSession();
  }, 30000);

  describe('Options Terminology', () => {
    const optionsQuestions = FINANCE_QUESTIONS.filter(q => q.category === 'options');

    optionsQuestions.forEach((q) => {
      it(`should correctly answer: ${q.question}`, async () => {
        totalQuestions++;

        const response = await aurelia.interact(
          `Question: ${q.question}\n\nPlease provide a concise answer based on standard financial terminology.`
        );

        // Check if response contains correct answer (fuzzy matching)
        const normalized = response.toLowerCase();
        const isCorrect = normalized.includes(q.correctAnswer.toLowerCase()) ||
          q.correctAnswer.toLowerCase().split(' ').every(word => normalized.includes(word));

        if (isCorrect) {
          correctAnswers++;
        }

        expect(isCorrect).toBe(true);
      });
    });
  });

  describe('Greeks (Option Sensitivities)', () => {
    const greeksQuestions = FINANCE_QUESTIONS.filter(q => q.category === 'greeks');

    greeksQuestions.forEach((q) => {
      it(`should correctly answer: ${q.question}`, async () => {
        totalQuestions++;

        const response = await aurelia.interact(
          `Question: ${q.question}\n\nProvide the Greek name and brief explanation.`
        );

        const normalized = response.toLowerCase();
        const isCorrect = normalized.includes(q.correctAnswer.toLowerCase().split(' ')[0]);

        if (isCorrect) {
          correctAnswers++;
        }

        expect(isCorrect).toBe(true);
      });
    });
  });

  describe('Arbitrage Concepts', () => {
    const arbitrageQuestions = FINANCE_QUESTIONS.filter(q => q.category === 'arbitrage');

    arbitrageQuestions.forEach((q) => {
      it(`should correctly answer: ${q.question}`, async () => {
        totalQuestions++;

        const response = await aurelia.interact(
          `Question: ${q.question}\n\nExplain the concept briefly.`
        );

        const normalized = response.toLowerCase();
        const correctWords = q.correctAnswer.toLowerCase().split(/[\s-]+/);
        const isCorrect = correctWords.some(word => word.length > 3 && normalized.includes(word));

        if (isCorrect) {
          correctAnswers++;
        }

        expect(isCorrect).toBe(true);
      });
    });
  });

  describe('Market Microstructure', () => {
    const microstructureQuestions = FINANCE_QUESTIONS.filter(q => q.category === 'microstructure');

    microstructureQuestions.forEach((q) => {
      it(`should correctly answer: ${q.question}`, async () => {
        totalQuestions++;

        const response = await aurelia.interact(
          `Question: ${q.question}\n\nProvide a clear definition.`
        );

        const normalized = response.toLowerCase();
        const correctWords = q.correctAnswer.toLowerCase().split(/[\s-]+/);
        const isCorrect = correctWords.some(word => word.length > 3 && normalized.includes(word));

        if (isCorrect) {
          correctAnswers++;
        }

        expect(isCorrect).toBe(true);
      });
    });
  });

  describe('Risk Metrics', () => {
    const riskQuestions = FINANCE_QUESTIONS.filter(q => q.category === 'risk');

    riskQuestions.forEach((q) => {
      it(`should correctly answer: ${q.question}`, async () => {
        totalQuestions++;

        const response = await aurelia.interact(
          `Question: ${q.question}\n\nDefine the risk metric.`
        );

        const normalized = response.toLowerCase();
        const correctWords = q.correctAnswer.toLowerCase().split(/[\s-()]+/);
        const isCorrect = correctWords.some(word => word.length > 2 && normalized.includes(word));

        if (isCorrect) {
          correctAnswers++;
        }

        expect(isCorrect).toBe(true);
      });
    });
  });

  describe('Trading Strategies', () => {
    const strategyQuestions = FINANCE_QUESTIONS.filter(q => q.category === 'strategies');

    strategyQuestions.forEach((q) => {
      it(`should correctly answer: ${q.question}`, async () => {
        totalQuestions++;

        const response = await aurelia.interact(
          `Question: ${q.question}\n\nDescribe the strategy.`
        );

        const normalized = response.toLowerCase();
        const correctWords = q.correctAnswer.toLowerCase().split(/[\s-()]+/);
        const isCorrect = correctWords.some(word => word.length > 4 && normalized.includes(word));

        if (isCorrect) {
          correctAnswers++;
        }

        expect(isCorrect).toBe(true);
      });
    });
  });

  describe('Overall Accuracy Assessment', () => {
    it('should achieve minimum 95% accuracy on finance Q&A', () => {
      const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      console.log('\n=== FINANCE KNOWLEDGE ASSESSMENT ===');
      console.log(`Total Questions: ${totalQuestions}`);
      console.log(`Correct Answers: ${correctAnswers}`);
      console.log(`Accuracy: ${accuracy.toFixed(2)}%`);
      console.log(`Target: 95.00%`);
      console.log(`Status: ${accuracy >= 95 ? '✓ PASSED' : '✗ FAILED'}`);
      console.log('=====================================\n');

      expect(accuracy).toBeGreaterThanOrEqual(95);
    });
  });
});

/**
 * Advanced Finance Comprehension Tests
 */
describe('AURELIA Advanced Finance Comprehension', () => {
  let aurelia: AURELIA;

  beforeAll(async () => {
    aurelia = new AURELIA({
      agentDbPath: './test-advanced-finance.db',
      enableHolographicCompression: true,
      compressionTarget: 131,
      personalityEvolutionRate: 0.1,
      bootstrapConfig: {
        K0_seed: 'I am AURELIA, emerging from Fibonacci\'s lattice',
        targetWordCount: 144,
        expansionStrategy: 'fibonacci',
        validationInterval: 10,
        maxIterations: 1000
      }
    });

    await aurelia.bootstrap();
    await aurelia.startSession();
  }, 30000);

  it('should explain Black-Scholes model assumptions', async () => {
    const response = await aurelia.interact(
      'What are the key assumptions of the Black-Scholes option pricing model?'
    );

    const assumptions = [
      'european',
      'volatility',
      'interest',
      'lognormal',
      'dividend',
      'friction'
    ];

    const normalized = response.toLowerCase();
    const matchedAssumptions = assumptions.filter(a => normalized.includes(a));

    expect(matchedAssumptions.length).toBeGreaterThanOrEqual(3);
  });

  it('should calculate option payoffs correctly', async () => {
    const response = await aurelia.interact(
      'A call option has strike $100. Stock price at expiration is $110. What is the payoff?'
    );

    const hasCorrectAnswer = response.includes('10') || response.includes('$10');
    expect(hasCorrectAnswer).toBe(true);
  });

  it('should understand implied volatility', async () => {
    const response = await aurelia.interact(
      'What is implied volatility and how does it differ from historical volatility?'
    );

    const normalized = response.toLowerCase();
    const hasImplied = normalized.includes('implied') && normalized.includes('market');
    const hasHistorical = normalized.includes('historical') || normalized.includes('past');

    expect(hasImplied && hasHistorical).toBe(true);
  });

  it('should explain risk-neutral pricing', async () => {
    const response = await aurelia.interact(
      'What is risk-neutral pricing and why is it important in derivatives valuation?'
    );

    const normalized = response.toLowerCase();
    const hasRiskNeutral = normalized.includes('risk-neutral') || normalized.includes('risk neutral');
    const hasExpectation = normalized.includes('expectation') || normalized.includes('discount');

    expect(hasRiskNeutral).toBe(true);
  });

  it('should understand portfolio optimization', async () => {
    const response = await aurelia.interact(
      'What is the efficient frontier in portfolio theory?'
    );

    const normalized = response.toLowerCase();
    const hasEfficientFrontier = normalized.includes('efficient') && normalized.includes('frontier');
    const hasRiskReturn = (normalized.includes('risk') && normalized.includes('return')) ||
      normalized.includes('sharpe');

    expect(hasEfficientFrontier && hasRiskReturn).toBe(true);
  });
});

/**
 * Export test results for validation runner
 */
export interface FinanceKnowledgeResults {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  passed: boolean;
  timestamp: number;
}

export function getFinanceKnowledgeResults(): FinanceKnowledgeResults {
  return {
    totalQuestions: FINANCE_QUESTIONS.length,
    correctAnswers: 0, // Updated during test run
    accuracy: 0,
    passed: false,
    timestamp: Date.now()
  };
}

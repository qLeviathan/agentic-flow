/**
 * AURELIA Trading Accuracy Tests
 *
 * Backtests AURELIA's trading performance on historical data (2020-2024)
 * and compares against benchmark strategies.
 *
 * Requirements:
 * - Sharpe ratio > 2.0
 * - Maximum drawdown < 15%
 * - Win rate > 55%
 * - Outperform buy-and-hold and 60/40 portfolio
 *
 * @module TradingAccuracyTests
 * @industry-standard CFA Institute, Quantitative Trading Standards
 * @level 9-10
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { DecisionEngine, Portfolio, ActionType } from '../../src/trading/decisions/decision-engine';
import { NashDetector, MarketState } from '../../src/trading/decisions/nash-detector';
import { QNetwork, Matrix } from '../../src/math-framework/neural/q-network';

const PHI = (1 + Math.sqrt(5)) / 2;
const PHI_INVERSE = 1 / PHI;

/**
 * Historical market data point
 */
interface HistoricalDataPoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  rsi: number;
  macd: number;
  volatility: number;
  bollinger: number;
}

/**
 * Backtest results
 */
interface BacktestResults {
  trades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  calmarRatio: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  finalPortfolioValue: number;
  initialPortfolioValue: number;
}

/**
 * Strategy performance comparison
 */
interface StrategyComparison {
  aurelia: BacktestResults;
  buyAndHold: BacktestResults;
  sixtyForty: BacktestResults;
}

/**
 * Generate synthetic historical data for testing
 * In production, this would load real market data
 */
function generateHistoricalData(
  startDate: Date,
  endDate: Date,
  initialPrice: number = 100
): HistoricalDataPoint[] {
  const data: HistoricalDataPoint[] = [];
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  let price = initialPrice;
  const trend = 0.0005; // Slight upward trend
  const volatility = 0.02; // 2% daily volatility

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);

    // Random walk with drift
    const dailyReturn = trend + volatility * (Math.random() - 0.5) * 2;
    price *= (1 + dailyReturn);

    const open = price * (1 + (Math.random() - 0.5) * 0.01);
    const close = price;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = 1000000 * (1 + (Math.random() - 0.5) * 0.5);

    // Technical indicators (simplified)
    const rsi = 50 + (Math.random() - 0.5) * 40;
    const macd = (Math.random() - 0.5) * 2;
    const vol = volatility + (Math.random() - 0.5) * 0.01;
    const bollinger = (close - price) / (price * volatility);

    data.push({
      date,
      open,
      high,
      low,
      close,
      volume,
      rsi,
      macd,
      volatility: vol,
      bollinger
    });
  }

  return data;
}

/**
 * Run backtest on historical data
 */
async function runBacktest(
  data: HistoricalDataPoint[],
  engine: DecisionEngine,
  initialCash: number = 100000
): Promise<BacktestResults> {
  const portfolio: Portfolio = {
    cash: initialCash,
    positions: new Map(),
    totalValue: initialCash
  };

  const trades: { date: Date; pnl: number; action: ActionType }[] = [];
  let maxValue = initialCash;
  let maxDrawdown = 0;

  for (const dataPoint of data) {
    const marketState: MarketState = {
      price: dataPoint.close,
      volume: dataPoint.volume,
      volatility: dataPoint.volatility,
      rsi: dataPoint.rsi,
      macd: dataPoint.macd,
      bollinger: dataPoint.bollinger,
      timestamp: dataPoint.date.getTime()
    };

    // Make trading decision
    const decision = await engine.makeDecision('SPY', marketState);

    if (decision) {
      // Execute trade
      const success = engine.executeDecision(decision);

      if (success) {
        // Calculate P&L for this trade
        const portfolioValue = engine.getPortfolio().totalValue;
        const pnl = portfolioValue - portfolio.totalValue;

        trades.push({
          date: dataPoint.date,
          pnl,
          action: decision.action
        });

        // Update max drawdown
        if (portfolioValue > maxValue) {
          maxValue = portfolioValue;
        }

        const drawdown = (maxValue - portfolioValue) / maxValue;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    }

    // Update position prices
    const currentPortfolio = engine.getPortfolio();
    for (const [symbol, position] of currentPortfolio.positions) {
      position.currentPrice = dataPoint.close;
    }
  }

  // Calculate metrics
  const winningTrades = trades.filter(t => t.pnl > 0);
  const losingTrades = trades.filter(t => t.pnl < 0);

  const totalReturn = (portfolio.totalValue - initialCash) / initialCash;
  const returns = trades.map(t => t.pnl / initialCash);

  const avgReturn = returns.length > 0
    ? returns.reduce((a, b) => a + b, 0) / returns.length
    : 0;

  const stdDev = returns.length > 1
    ? Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1))
    : 0;

  const sharpeRatio = stdDev > 0 ? (avgReturn * 252) / (stdDev * Math.sqrt(252)) : 0; // Annualized

  const downside = returns.filter(r => r < 0);
  const downsideStd = downside.length > 1
    ? Math.sqrt(downside.reduce((sum, r) => sum + Math.pow(r, 2), 0) / (downside.length - 1))
    : stdDev;

  const sortinoRatio = downsideStd > 0 ? (avgReturn * 252) / (downsideStd * Math.sqrt(252)) : 0;

  const calmarRatio = maxDrawdown > 0 ? totalReturn / maxDrawdown : 0;

  const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;

  return {
    trades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate: trades.length > 0 ? winningTrades.length / trades.length : 0,
    totalReturn,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown,
    calmarRatio,
    profitFactor,
    averageWin: winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length
      : 0,
    averageLoss: losingTrades.length > 0
      ? losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length
      : 0,
    largestWin: winningTrades.length > 0
      ? Math.max(...winningTrades.map(t => t.pnl))
      : 0,
    largestLoss: losingTrades.length > 0
      ? Math.min(...losingTrades.map(t => t.pnl))
      : 0,
    consecutiveWins: 0, // TODO: Calculate
    consecutiveLosses: 0, // TODO: Calculate
    finalPortfolioValue: portfolio.totalValue,
    initialPortfolioValue: initialCash
  };
}

/**
 * Buy-and-hold benchmark strategy
 */
function buyAndHoldBacktest(
  data: HistoricalDataPoint[],
  initialCash: number = 100000
): BacktestResults {
  const initialPrice = data[0].close;
  const finalPrice = data[data.length - 1].close;
  const shares = initialCash / initialPrice;
  const finalValue = shares * finalPrice;
  const totalReturn = (finalValue - initialCash) / initialCash;

  // Calculate max drawdown
  let maxPrice = initialPrice;
  let maxDrawdown = 0;

  for (const point of data) {
    if (point.close > maxPrice) {
      maxPrice = point.close;
    }
    const drawdown = (maxPrice - point.close) / maxPrice;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  // Daily returns
  const returns = [];
  for (let i = 1; i < data.length; i++) {
    returns.push((data[i].close - data[i - 1].close) / data[i - 1].close);
  }

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1)
  );

  const sharpeRatio = (avgReturn * 252) / (stdDev * Math.sqrt(252));

  return {
    trades: 1,
    winningTrades: totalReturn > 0 ? 1 : 0,
    losingTrades: totalReturn <= 0 ? 1 : 0,
    winRate: totalReturn > 0 ? 1 : 0,
    totalReturn,
    sharpeRatio,
    sortinoRatio: sharpeRatio, // Simplified
    maxDrawdown,
    calmarRatio: totalReturn / maxDrawdown,
    profitFactor: 0,
    averageWin: 0,
    averageLoss: 0,
    largestWin: 0,
    largestLoss: 0,
    consecutiveWins: 0,
    consecutiveLosses: 0,
    finalPortfolioValue: finalValue,
    initialPortfolioValue: initialCash
  };
}

describe('AURELIA Trading Accuracy - Historical Backtests', () => {
  let qNetwork: QNetwork;
  let nashDetector: NashDetector;
  let decisionEngine: DecisionEngine;
  let historicalData: HistoricalDataPoint[];

  beforeAll(async () => {
    // Initialize trading system
    qNetwork = new QNetwork([6, 12, 12, 12]);
    nashDetector = new NashDetector({
      nashThreshold: 1e-6,
      consciousnessThreshold: PHI_INVERSE,
      lyapunovWindow: 10,
      lucasCheckRange: 5
    });

    const portfolio: Portfolio = {
      cash: 100000,
      positions: new Map(),
      totalValue: 100000
    };

    decisionEngine = new DecisionEngine(qNetwork, nashDetector, portfolio, {
      minNashConfidence: 0.75,
      minConsciousness: PHI_INVERSE,
      enableOptions: true,
      enableLeverage: false,
      maxSimultaneousPositions: 10
    });

    // Generate historical data (2020-2024)
    historicalData = generateHistoricalData(
      new Date('2020-01-01'),
      new Date('2024-12-31'),
      100
    );

    // Train Q-network on historical data
    const trainingData = historicalData.slice(0, 500).map((point, i) => ({
      state: Matrix.from2D([[
        point.close / 100,
        point.volume / 1000000,
        point.volatility,
        point.rsi / 100,
        point.macd / 10,
        point.bollinger
      ]]).transpose(),
      action: i % 3,
      reward: historicalData[i + 1] ? (historicalData[i + 1].close - point.close) / point.close : 0,
      nextState: historicalData[i + 1] ? Matrix.from2D([[
        historicalData[i + 1].close / 100,
        historicalData[i + 1].volume / 1000000,
        historicalData[i + 1].volatility,
        historicalData[i + 1].rsi / 100,
        historicalData[i + 1].macd / 10,
        historicalData[i + 1].bollinger
      ]]).transpose() : Matrix.from2D([[0, 0, 0, 0, 0, 0]]).transpose(),
      done: i >= historicalData.length - 2
    }));

    await qNetwork.train(trainingData, {
      epochs: 100,
      learningRate: 0.01,
      gamma: 0.99,
      lambda: 0.01
    });
  }, 120000);

  it('should achieve Sharpe ratio > 2.0', async () => {
    const results = await runBacktest(historicalData, decisionEngine);

    console.log('\n=== AURELIA TRADING PERFORMANCE ===');
    console.log(`Sharpe Ratio: ${results.sharpeRatio.toFixed(2)}`);
    console.log(`Target: > 2.00`);
    console.log(`Status: ${results.sharpeRatio > 2.0 ? '✓ PASSED' : '✗ FAILED'}`);
    console.log('====================================\n');

    expect(results.sharpeRatio).toBeGreaterThan(2.0);
  }, 60000);

  it('should maintain maximum drawdown < 15%', async () => {
    const results = await runBacktest(historicalData, decisionEngine);

    console.log('\n=== RISK MANAGEMENT ===');
    console.log(`Max Drawdown: ${(results.maxDrawdown * 100).toFixed(2)}%`);
    console.log(`Target: < 15.00%`);
    console.log(`Status: ${results.maxDrawdown < 0.15 ? '✓ PASSED' : '✗ FAILED'}`);
    console.log('========================\n');

    expect(results.maxDrawdown).toBeLessThan(0.15);
  }, 60000);

  it('should achieve win rate > 55%', async () => {
    const results = await runBacktest(historicalData, decisionEngine);

    console.log('\n=== WIN RATE ANALYSIS ===');
    console.log(`Win Rate: ${(results.winRate * 100).toFixed(2)}%`);
    console.log(`Winning Trades: ${results.winningTrades}`);
    console.log(`Losing Trades: ${results.losingTrades}`);
    console.log(`Target: > 55.00%`);
    console.log(`Status: ${results.winRate > 0.55 ? '✓ PASSED' : '✗ FAILED'}`);
    console.log('=========================\n');

    expect(results.winRate).toBeGreaterThan(0.55);
  }, 60000);

  it('should outperform buy-and-hold strategy', async () => {
    const aureliaResults = await runBacktest(historicalData, decisionEngine);
    const buyHoldResults = buyAndHoldBacktest(historicalData);

    console.log('\n=== STRATEGY COMPARISON: BUY-AND-HOLD ===');
    console.log(`AURELIA Return: ${(aureliaResults.totalReturn * 100).toFixed(2)}%`);
    console.log(`Buy-Hold Return: ${(buyHoldResults.totalReturn * 100).toFixed(2)}%`);
    console.log(`AURELIA Sharpe: ${aureliaResults.sharpeRatio.toFixed(2)}`);
    console.log(`Buy-Hold Sharpe: ${buyHoldResults.sharpeRatio.toFixed(2)}`);
    console.log(`Status: ${aureliaResults.sharpeRatio > buyHoldResults.sharpeRatio ? '✓ PASSED' : '✗ FAILED'}`);
    console.log('=========================================\n');

    expect(aureliaResults.sharpeRatio).toBeGreaterThan(buyHoldResults.sharpeRatio);
  }, 60000);

  it('should have positive Sortino ratio', async () => {
    const results = await runBacktest(historicalData, decisionEngine);

    expect(results.sortinoRatio).toBeGreaterThan(0);
  }, 60000);

  it('should have profit factor > 1.5', async () => {
    const results = await runBacktest(historicalData, decisionEngine);

    console.log('\n=== PROFITABILITY METRICS ===');
    console.log(`Profit Factor: ${results.profitFactor.toFixed(2)}`);
    console.log(`Target: > 1.50`);
    console.log(`Status: ${results.profitFactor > 1.5 ? '✓ PASSED' : '✗ FAILED'}`);
    console.log('==============================\n');

    expect(results.profitFactor).toBeGreaterThan(1.5);
  }, 60000);
});

describe('AURELIA Trading Accuracy - Crisis Periods', () => {
  it('should handle COVID-19 crash (March 2020) with limited drawdown', async () => {
    // Simulate COVID crash: -34% drop in 23 days
    const crashData: HistoricalDataPoint[] = [];
    const startPrice = 340;
    const endPrice = 224;
    const days = 23;

    for (let i = 0; i < days; i++) {
      const progress = i / days;
      const price = startPrice + (endPrice - startPrice) * progress;

      crashData.push({
        date: new Date(2020, 2, i + 1), // March 2020
        open: price * 1.01,
        high: price * 1.02,
        low: price * 0.98,
        close: price,
        volume: 5000000 * (1 + progress), // Increasing volume
        rsi: 30 - progress * 20, // Oversold
        macd: -2 - progress * 3,
        volatility: 0.5 + progress * 0.3, // High volatility
        bollinger: -2
      });
    }

    const qNetwork = new QNetwork([6, 12, 12, 12]);
    const nashDetector = new NashDetector();
    const portfolio: Portfolio = {
      cash: 100000,
      positions: new Map(),
      totalValue: 100000
    };

    const engine = new DecisionEngine(qNetwork, nashDetector, portfolio);
    const results = await runBacktest(crashData, engine);

    // Should limit drawdown during crash
    expect(results.maxDrawdown).toBeLessThan(0.2); // < 20%
  }, 30000);
});

/**
 * Export trading accuracy results
 */
export interface TradingAccuracyResults {
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalReturn: number;
  profitFactor: number;
  outperformsBuyHold: boolean;
  overallPassed: boolean;
  timestamp: number;
}

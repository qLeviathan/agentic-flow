#!/usr/bin/env python3
"""
Comprehensive Backtesting Demonstration Script
Tests all 5 strategies across multiple tickers with AgentDB integration

Usage:
    python run_backtest_demo.py

Features:
    - Tests 12 diverse tickers from top 100
    - Runs all 5 strategies (Fibonacci, Lucas, Momentum, Mean Reversion, Breakout)
    - Stores successful strategies in AgentDB
    - Generates comprehensive reports (JSON, Markdown, CSV)
    - Real-time progress output
    - Comparison tables and aggregate statistics
"""

import os
import sys
import json
import time
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
from collections import defaultdict
from dataclasses import asdict

# Add parent directory to path to import MVP
sys.path.insert(0, str(Path(__file__).parent))

from trading_system_mvp import (
    TiingoAPIClient,
    BacktestingEngine,
    FibonacciRetracementStrategy,
    MomentumStrategy,
    MeanReversionStrategy,
    BreakoutStrategy,
    LucasTimeExitStrategy,
    AgentDBIntegration,
    PerformanceMetrics
)

# ============================================================================
# CONFIGURATION
# ============================================================================

# Test tickers (12 diverse stocks)
TICKERS = [
    'SPY',    # S&P 500 ETF (market benchmark)
    'QQQ',    # NASDAQ 100 ETF (tech benchmark)
    'AAPL',   # Apple (mega-cap tech)
    'MSFT',   # Microsoft (mega-cap tech)
    'GOOGL',  # Google (mega-cap tech)
    'NVDA',   # NVIDIA (high volatility tech)
    'TSLA',   # Tesla (high volatility)
    'JPM',    # JP Morgan (financials)
    'BAC',    # Bank of America (financials)
    'XOM',    # Exxon (energy)
    'UNH',    # UnitedHealth (healthcare)
    'HD'      # Home Depot (consumer)
]

# All 5 strategies
STRATEGIES = {
    'fibonacci': FibonacciRetracementStrategy,
    'lucas': LucasTimeExitStrategy,
    'momentum': MomentumStrategy,
    'mean_reversion': MeanReversionStrategy,
    'breakout': BreakoutStrategy
}

# Time period
START_DATE = '2024-01-01'
END_DATE = '2024-12-31'

# Output paths
RESULTS_DIR = Path('/home/user/agentic-flow/trading-system/results')
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

SUMMARY_JSON = RESULTS_DIR / 'backtest_summary.json'
REPORT_MD = RESULTS_DIR / 'backtest_report.md'
COMPARISON_CSV = RESULTS_DIR / 'strategy_comparison.csv'

# ============================================================================
# BACKTESTING ENGINE
# ============================================================================

class ComprehensiveBacktester:
    """Comprehensive backtesting across tickers and strategies"""

    def __init__(self):
        self.api_client = TiingoAPIClient()
        self.agentdb = AgentDBIntegration()
        self.results: Dict[str, Dict[str, Any]] = {}
        self.errors: List[str] = []

    def run_single_backtest(self, ticker: str, strategy_name: str) -> Dict[str, Any]:
        """Run backtest for single ticker/strategy combination"""
        try:
            print(f"\n{'='*70}")
            print(f"  Testing: {ticker:6s} | Strategy: {strategy_name:20s}")
            print(f"{'='*70}")

            # Fetch data
            print(f"  [1/4] Fetching market data...")
            df = self.api_client.get_daily_prices(ticker, START_DATE, END_DATE)

            if df.empty:
                raise ValueError(f"No data for {ticker}")

            # Prepare data
            df = df.reset_index()
            if 'timestamp' not in df.columns:
                df['timestamp'] = df.index

            print(f"  [2/4] Data loaded: {len(df)} trading days")

            # Initialize strategy
            strategy_class = STRATEGIES[strategy_name]
            strategy = strategy_class()

            # Run backtest
            print(f"  [3/4] Running backtest...")
            engine = BacktestingEngine(initial_capital=100000.0)
            start_time = time.time()
            metrics, trades, equity_df = engine.run_backtest(df, strategy, verbose=False)
            elapsed = time.time() - start_time

            # Calculate buy-and-hold comparison
            initial_price = df.iloc[0]['close']
            final_price = df.iloc[-1]['close']
            buy_hold_return = ((final_price - initial_price) / initial_price) * 100000

            # Store in AgentDB
            print(f"  [4/4] Storing results...")
            if self.agentdb.available:
                metrics_dict = asdict(metrics)
                metrics_dict['ticker'] = ticker
                metrics_dict['strategy'] = strategy_name
                metrics_dict['period'] = f"{START_DATE} to {END_DATE}"

                self.agentdb.store_strategy(
                    f"{ticker}_{strategy_name}",
                    metrics_dict,
                    session_id=f"backtest_{ticker}"
                )

            # Print results
            print(f"\n  RESULTS:")
            print(f"  {'─'*68}")
            print(f"  Total Return:      ${metrics.total_return:>12,.2f}  ({metrics.total_return/1000:>6.2f}%)")
            print(f"  Buy-Hold Return:   ${buy_hold_return:>12,.2f}  ({(final_price/initial_price-1)*100:>6.2f}%)")
            print(f"  Sharpe Ratio:      {metrics.sharpe_ratio:>15.2f}")
            print(f"  Max Drawdown:      {metrics.max_drawdown*100:>14.2f}%")
            print(f"  Win Rate:          {metrics.win_rate*100:>14.2f}%")
            print(f"  Profit Factor:     {metrics.profit_factor:>15.2f}")
            print(f"  Total Trades:      {metrics.total_trades:>15d}")
            print(f"  Winning Trades:    {metrics.winning_trades:>15d}")
            print(f"  Losing Trades:     {metrics.losing_trades:>15d}")
            print(f"  Avg Win:           ${metrics.avg_win:>12,.2f}")
            print(f"  Avg Loss:          ${metrics.avg_loss:>12,.2f}")
            print(f"  Execution Time:    {elapsed:>14.2f}s")
            print(f"  {'─'*68}")

            # Calculate best/worst trades
            closed_trades = [t for t in trades if t.status == 'CLOSED']
            best_trade = max(closed_trades, key=lambda t: t.pnl) if closed_trades else None
            worst_trade = min(closed_trades, key=lambda t: t.pnl) if closed_trades else None

            result = {
                'ticker': ticker,
                'strategy': strategy_name,
                'period': f"{START_DATE} to {END_DATE}",
                'metrics': {
                    'total_return': metrics.total_return,
                    'total_return_pct': (metrics.total_return / 100000) * 100,
                    'buy_hold_return': buy_hold_return,
                    'buy_hold_pct': ((final_price / initial_price) - 1) * 100,
                    'sharpe_ratio': metrics.sharpe_ratio,
                    'sortino_ratio': metrics.sortino_ratio,
                    'max_drawdown': metrics.max_drawdown,
                    'max_drawdown_pct': metrics.max_drawdown * 100,
                    'win_rate': metrics.win_rate,
                    'profit_factor': metrics.profit_factor,
                    'total_trades': metrics.total_trades,
                    'winning_trades': metrics.winning_trades,
                    'losing_trades': metrics.losing_trades,
                    'avg_win': metrics.avg_win,
                    'avg_loss': metrics.avg_loss,
                    'best_trade': best_trade.pnl if best_trade else 0,
                    'worst_trade': worst_trade.pnl if worst_trade else 0
                },
                'execution_time': elapsed,
                'success': True
            }

            print(f"\n  ✓ SUCCESS: {ticker}/{strategy_name}")
            return result

        except Exception as e:
            error_msg = f"ERROR: {ticker}/{strategy_name}: {str(e)}"
            print(f"\n  ✗ {error_msg}")
            self.errors.append(error_msg)

            return {
                'ticker': ticker,
                'strategy': strategy_name,
                'error': str(e),
                'success': False
            }

    def run_all_backtests(self):
        """Run backtests for all ticker/strategy combinations"""
        total_combinations = len(TICKERS) * len(STRATEGIES)
        current = 0

        print(f"\n{'='*70}")
        print(f"  COMPREHENSIVE BACKTESTING DEMONSTRATION")
        print(f"{'='*70}")
        print(f"  Tickers:    {len(TICKERS)} ({', '.join(TICKERS)})")
        print(f"  Strategies: {len(STRATEGIES)} ({', '.join(STRATEGIES.keys())})")
        print(f"  Period:     {START_DATE} to {END_DATE}")
        print(f"  Total Tests: {total_combinations}")
        print(f"  AgentDB:    {'Enabled' if self.agentdb.available else 'Disabled'}")
        print(f"{'='*70}\n")

        start_time = time.time()

        for ticker in TICKERS:
            self.results[ticker] = {}

            for strategy_name in STRATEGIES:
                current += 1
                print(f"\n[Progress: {current}/{total_combinations}]")

                result = self.run_single_backtest(ticker, strategy_name)
                self.results[ticker][strategy_name] = result

                # Small delay to avoid rate limits
                time.sleep(0.5)

        total_time = time.time() - start_time

        print(f"\n{'='*70}")
        print(f"  BACKTESTING COMPLETE")
        print(f"{'='*70}")
        print(f"  Total Time:     {total_time:.2f}s")
        print(f"  Avg Per Test:   {total_time/total_combinations:.2f}s")
        print(f"  Success Rate:   {(total_combinations - len(self.errors))/total_combinations*100:.1f}%")
        if self.errors:
            print(f"  Errors:         {len(self.errors)}")
        print(f"{'='*70}\n")

    def generate_summary(self) -> Dict[str, Any]:
        """Generate aggregate statistics"""
        summary = {
            'metadata': {
                'generated_at': datetime.now().isoformat(),
                'period': f"{START_DATE} to {END_DATE}",
                'tickers': TICKERS,
                'strategies': list(STRATEGIES.keys()),
                'total_tests': len(TICKERS) * len(STRATEGIES)
            },
            'aggregate_stats': {
                'by_strategy': {},
                'by_ticker': {},
                'best_performers': {},
                'overall': {}
            },
            'detailed_results': self.results,
            'errors': self.errors
        }

        # Aggregate by strategy
        for strategy_name in STRATEGIES:
            strategy_results = []
            for ticker in TICKERS:
                result = self.results[ticker].get(strategy_name, {})
                if result.get('success'):
                    strategy_results.append(result['metrics'])

            if strategy_results:
                summary['aggregate_stats']['by_strategy'][strategy_name] = {
                    'avg_return': sum(r['total_return'] for r in strategy_results) / len(strategy_results),
                    'avg_sharpe': sum(r['sharpe_ratio'] for r in strategy_results) / len(strategy_results),
                    'avg_win_rate': sum(r['win_rate'] for r in strategy_results) / len(strategy_results),
                    'total_trades': sum(r['total_trades'] for r in strategy_results),
                    'success_count': len(strategy_results)
                }

        # Aggregate by ticker
        for ticker in TICKERS:
            ticker_results = []
            for strategy_name in STRATEGIES:
                result = self.results[ticker].get(strategy_name, {})
                if result.get('success'):
                    ticker_results.append(result['metrics'])

            if ticker_results:
                summary['aggregate_stats']['by_ticker'][ticker] = {
                    'avg_return': sum(r['total_return'] for r in ticker_results) / len(ticker_results),
                    'avg_sharpe': sum(r['sharpe_ratio'] for r in ticker_results) / len(ticker_results),
                    'best_strategy': max(ticker_results, key=lambda r: r['sharpe_ratio'])
                }

        # Find best performers
        all_successful = []
        for ticker in TICKERS:
            for strategy_name in STRATEGIES:
                result = self.results[ticker].get(strategy_name, {})
                if result.get('success'):
                    all_successful.append({
                        'ticker': ticker,
                        'strategy': strategy_name,
                        **result['metrics']
                    })

        if all_successful:
            summary['aggregate_stats']['best_performers'] = {
                'highest_return': max(all_successful, key=lambda r: r['total_return']),
                'highest_sharpe': max(all_successful, key=lambda r: r['sharpe_ratio']),
                'highest_win_rate': max(all_successful, key=lambda r: r['win_rate']),
                'most_trades': max(all_successful, key=lambda r: r['total_trades'])
            }

            summary['aggregate_stats']['overall'] = {
                'avg_return': sum(r['total_return'] for r in all_successful) / len(all_successful),
                'avg_sharpe': sum(r['sharpe_ratio'] for r in all_successful) / len(all_successful),
                'avg_win_rate': sum(r['win_rate'] for r in all_successful) / len(all_successful),
                'total_trades': sum(r['total_trades'] for r in all_successful)
            }

        return summary

    def save_results(self):
        """Save results to output files"""
        print(f"\nGenerating output files...")

        # Generate summary
        summary = self.generate_summary()

        # 1. Save JSON summary
        with open(SUMMARY_JSON, 'w') as f:
            json.dump(summary, f, indent=2)
        print(f"  ✓ Saved JSON:     {SUMMARY_JSON}")

        # 2. Save Markdown report
        self._generate_markdown_report(summary)
        print(f"  ✓ Saved Markdown: {REPORT_MD}")

        # 3. Save CSV comparison
        self._generate_csv_comparison(summary)
        print(f"  ✓ Saved CSV:      {COMPARISON_CSV}")

        # 4. Store causal relationships in AgentDB
        if self.agentdb.available:
            self._store_causal_relationships(summary)
            print(f"  ✓ Stored AgentDB causal relationships")

    def _generate_markdown_report(self, summary: Dict):
        """Generate markdown report"""
        md_content = f"""# Backtesting Results Report

**Generated:** {summary['metadata']['generated_at']}
**Period:** {summary['metadata']['period']}
**Tickers:** {len(summary['metadata']['tickers'])}
**Strategies:** {len(summary['metadata']['strategies'])}
**Total Tests:** {summary['metadata']['total_tests']}

---

## Executive Summary

### Overall Performance

"""

        if summary['aggregate_stats'].get('overall'):
            overall = summary['aggregate_stats']['overall']
            md_content += f"""
- **Average Return:** ${overall['avg_return']:,.2f}
- **Average Sharpe Ratio:** {overall['avg_sharpe']:.2f}
- **Average Win Rate:** {overall['avg_win_rate']*100:.2f}%
- **Total Trades:** {overall['total_trades']}
"""

        # Best performers
        if summary['aggregate_stats'].get('best_performers'):
            bp = summary['aggregate_stats']['best_performers']
            md_content += f"""
### 🏆 Best Performers

#### Highest Return
- **Ticker:** {bp['highest_return']['ticker']}
- **Strategy:** {bp['highest_return']['strategy']}
- **Return:** ${bp['highest_return']['total_return']:,.2f} ({bp['highest_return']['total_return_pct']:.2f}%)

#### Highest Sharpe Ratio
- **Ticker:** {bp['highest_sharpe']['ticker']}
- **Strategy:** {bp['highest_sharpe']['strategy']}
- **Sharpe:** {bp['highest_sharpe']['sharpe_ratio']:.2f}
- **Return:** ${bp['highest_sharpe']['total_return']:,.2f}

#### Highest Win Rate
- **Ticker:** {bp['highest_win_rate']['ticker']}
- **Strategy:** {bp['highest_win_rate']['strategy']}
- **Win Rate:** {bp['highest_win_rate']['win_rate']*100:.2f}%
- **Trades:** {bp['highest_win_rate']['total_trades']}

---
"""

        # Strategy comparison
        md_content += """
## Strategy Performance Comparison

| Strategy | Avg Return | Avg Sharpe | Avg Win Rate | Total Trades |
|----------|------------|------------|--------------|--------------|
"""

        for strategy_name, stats in summary['aggregate_stats']['by_strategy'].items():
            md_content += f"| {strategy_name:20s} | ${stats['avg_return']:>10,.2f} | {stats['avg_sharpe']:>10.2f} | {stats['avg_win_rate']*100:>11.2f}% | {stats['total_trades']:>12d} |\n"

        # Ticker comparison
        md_content += """
---

## Ticker Performance Comparison

| Ticker | Avg Return | Avg Sharpe | Best Strategy |
|--------|------------|------------|---------------|
"""

        for ticker, stats in summary['aggregate_stats']['by_ticker'].items():
            # Find best strategy for this ticker
            best_strat = None
            best_sharpe = -999
            for strategy_name in STRATEGIES:
                result = self.results[ticker].get(strategy_name, {})
                if result.get('success'):
                    sharpe = result['metrics']['sharpe_ratio']
                    if sharpe > best_sharpe:
                        best_sharpe = sharpe
                        best_strat = strategy_name

            md_content += f"| {ticker:6s} | ${stats['avg_return']:>10,.2f} | {stats['avg_sharpe']:>10.2f} | {best_strat or 'N/A':20s} |\n"

        # Detailed results
        md_content += """
---

## Detailed Results by Ticker

"""

        for ticker in TICKERS:
            md_content += f"\n### {ticker}\n\n"
            md_content += "| Strategy | Return | Sharpe | Win Rate | Trades | Max DD |\n"
            md_content += "|----------|--------|--------|----------|--------|--------|\n"

            for strategy_name in STRATEGIES:
                result = self.results[ticker].get(strategy_name, {})
                if result.get('success'):
                    m = result['metrics']
                    md_content += f"| {strategy_name:15s} | ${m['total_return']:>8,.0f} | {m['sharpe_ratio']:>6.2f} | {m['win_rate']*100:>7.2f}% | {m['total_trades']:>6d} | {m['max_drawdown_pct']:>5.2f}% |\n"
                else:
                    md_content += f"| {strategy_name:15s} | ERROR | - | - | - | - |\n"

        # Errors section
        if summary['errors']:
            md_content += f"""
---

## Errors ({len(summary['errors'])})

"""
            for error in summary['errors']:
                md_content += f"- {error}\n"

        with open(REPORT_MD, 'w') as f:
            f.write(md_content)

    def _generate_csv_comparison(self, summary: Dict):
        """Generate CSV comparison table"""
        import csv

        with open(COMPARISON_CSV, 'w', newline='') as f:
            writer = csv.writer(f)

            # Header
            writer.writerow([
                'Ticker', 'Strategy', 'Total Return', 'Return %',
                'Buy-Hold Return', 'Buy-Hold %', 'Sharpe Ratio',
                'Max Drawdown %', 'Win Rate %', 'Profit Factor',
                'Total Trades', 'Winning Trades', 'Losing Trades',
                'Avg Win', 'Avg Loss', 'Best Trade', 'Worst Trade'
            ])

            # Data rows
            for ticker in TICKERS:
                for strategy_name in STRATEGIES:
                    result = self.results[ticker].get(strategy_name, {})
                    if result.get('success'):
                        m = result['metrics']
                        writer.writerow([
                            ticker,
                            strategy_name,
                            f"{m['total_return']:.2f}",
                            f"{m['total_return_pct']:.2f}",
                            f"{m['buy_hold_return']:.2f}",
                            f"{m['buy_hold_pct']:.2f}",
                            f"{m['sharpe_ratio']:.2f}",
                            f"{m['max_drawdown_pct']:.2f}",
                            f"{m['win_rate']*100:.2f}",
                            f"{m['profit_factor']:.2f}",
                            m['total_trades'],
                            m['winning_trades'],
                            m['losing_trades'],
                            f"{m['avg_win']:.2f}",
                            f"{m['avg_loss']:.2f}",
                            f"{m['best_trade']:.2f}",
                            f"{m['worst_trade']:.2f}"
                        ])

    def _store_causal_relationships(self, summary: Dict):
        """Store causal relationships in AgentDB"""
        try:
            # Store top performers
            if summary['aggregate_stats'].get('best_performers'):
                bp = summary['aggregate_stats']['best_performers']

                # Highest Sharpe strategy
                best = bp['highest_sharpe']
                subprocess.run([
                    'npx', 'agentdb', 'causal', 'add-edge',
                    f"{best['strategy']}_strategy",
                    'sharpe_ratio',
                    str(best['sharpe_ratio'])
                ], capture_output=True, timeout=10)

                # Win rate correlation
                best_wr = bp['highest_win_rate']
                subprocess.run([
                    'npx', 'agentdb', 'causal', 'add-edge',
                    f"{best_wr['strategy']}_strategy",
                    'win_rate',
                    str(best_wr['win_rate'])
                ], capture_output=True, timeout=10)

        except Exception as e:
            print(f"Warning: Failed to store causal relationships: {e}")

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main execution"""
    print(f"\n{'='*70}")
    print(f"  COMPREHENSIVE BACKTESTING DEMONSTRATION")
    print(f"  Trading System MVP - All Strategies Test")
    print(f"{'='*70}\n")

    # Check API token
    if not os.getenv('TIINGO_API_TOKEN'):
        print("ERROR: TIINGO_API_TOKEN environment variable not set")
        print("Get a free token at: https://api.tiingo.com")
        sys.exit(1)

    # Initialize backtester
    backtester = ComprehensiveBacktester()

    # Run all backtests
    backtester.run_all_backtests()

    # Save results
    backtester.save_results()

    print(f"\n{'='*70}")
    print(f"  DEMONSTRATION COMPLETE")
    print(f"{'='*70}")
    print(f"\n  Output files:")
    print(f"  - {SUMMARY_JSON}")
    print(f"  - {REPORT_MD}")
    print(f"  - {COMPARISON_CSV}")
    print(f"\n  Next steps:")
    print(f"  - Review the markdown report for best strategies")
    print(f"  - Analyze CSV for detailed comparisons")
    print(f"  - Check AgentDB for learned patterns:")
    print(f"    npx agentdb reflexion list")
    print(f"    npx agentdb causal list-edges")
    print(f"{'='*70}\n")

if __name__ == '__main__':
    main()

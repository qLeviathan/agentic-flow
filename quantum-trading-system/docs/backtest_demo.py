#!/usr/bin/env python3
"""
Comprehensive Backtesting Demo - Agent 17 (Zeckendorf: 10000100)

Demonstrates the full capabilities of the integer-only backtesting engine
including performance metrics, trade analysis, and result export.
"""

import sys
from pathlib import Path

# Add parent directory for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from backtesting.backtest_engine import BacktestEngine
from strategies.fibonacci_strategy import FibonacciRetracementStrategy


def generate_realistic_price_data(bars: int = 200) -> list:
    """
    Generate realistic price data with trends and pullbacks.

    Args:
        bars: Number of price bars

    Returns:
        List of prices in cents
    """
    import random
    random.seed(42)  # Reproducible results

    prices = []
    base_price = 10000  # $100.00
    trend = 50  # Upward trend

    for i in range(bars):
        # Add trend
        price = base_price + i * trend

        # Add Fibonacci-like oscillations (pullbacks)
        if i % 21 < 13:  # Fibonacci numbers
            oscillation = (i % 13) * 80 - 400
        else:
            oscillation = -600  # Deeper pullback

        # Add random noise
        noise = random.randint(-100, 100)

        final_price = price + oscillation + noise
        prices.append(max(5000, final_price))  # Floor at $50

    return prices


def run_comprehensive_backtest():
    """
    Run comprehensive backtest demonstration.
    """
    print("=" * 80)
    print("COMPREHENSIVE BACKTESTING DEMONSTRATION")
    print("Agent 17: Backtesting Engine (Zeckendorf: 10000100)")
    print("=" * 80)
    print()

    # Generate price data
    print("[1] Generating Historical Price Data")
    price_data = generate_realistic_price_data(bars=200)
    print(f"    Generated {len(price_data)} price bars")
    print(f"    Price Range: ${min(price_data)/100:.2f} - ${max(price_data)/100:.2f}")
    print(f"    Start Price: ${price_data[0]/100:.2f}")
    print(f"    End Price: ${price_data[-1]/100:.2f}")
    print()

    # Initialize strategy
    print("[2] Initializing Fibonacci Retracement Strategy")
    strategy = FibonacciRetracementStrategy(max_position_cents=1000000)  # $10,000 max position
    strategy_summary = strategy.get_strategy_summary()
    print(f"    Strategy: {strategy_summary['strategy']}")
    print(f"    Entry Levels: {', '.join(strategy_summary['configuration']['entry_levels'])}")
    print(f"    Stop Loss: {strategy_summary['configuration']['stop_loss_ratio']}")
    print()

    # Initialize backtesting engine
    print("[3] Initializing Backtesting Engine")
    engine = BacktestEngine(
        initial_capital_cents=10000000,  # $100,000
        commission_cents=100,  # $1.00 per trade
        slippage_cents=10  # 10 cents slippage
    )
    print(f"    Initial Capital: ${engine.initial_capital_cents / 100:,.2f}")
    print(f"    Commission: ${engine.commission_cents / 100:.2f} per trade")
    print(f"    Slippage: ${engine.slippage_cents / 100:.2f} per trade")
    print()

    # Run backtest
    print("[4] Running Backtest...")
    print("    Processing price data...")
    result = engine.run_backtest(
        price_data=price_data,
        strategy=strategy,
        strategy_name="Fibonacci Retracement Strategy",
        lookback_period=20
    )
    print(f"    ✅ Backtest Complete!")
    print()

    # Display comprehensive results
    print("=" * 80)
    print("BACKTEST RESULTS")
    print("=" * 80)
    print()

    results_dict = result.to_dict()

    # Summary
    print("[5] Trading Summary")
    summary = results_dict['summary']
    print(f"    Strategy: {summary['strategy_name']}")
    print(f"    Total Trades: {summary['total_trades']}")
    print(f"    Winning Trades: {summary['winning_trades']}")
    print(f"    Losing Trades: {summary['losing_trades']}")
    print(f"    Win Rate: {summary['win_rate_percent']}")
    print()

    # P&L Analysis
    print("[6] Profit & Loss Analysis")
    pnl = results_dict['pnl']
    print(f"    Total P&L: {pnl['total_pnl']}")
    print(f"    Gross Profit: {pnl['gross_profit']}")
    print(f"    Gross Loss: {pnl['gross_loss']}")
    print(f"    Average Win: {pnl['average_win']}")
    print(f"    Average Loss: {pnl['average_loss']}")
    print(f"    Largest Win: {pnl['largest_win']}")
    print(f"    Largest Loss: {pnl['largest_loss']}")
    print()

    # Risk Metrics
    print("[7] Risk-Adjusted Performance Metrics")
    risk = results_dict['risk_metrics']
    print(f"    Sharpe Ratio: {risk['sharpe_ratio']}")
    print(f"    Sortino Ratio: {risk['sortino_ratio']}")
    print(f"    Profit Factor: {risk['profit_factor']}")
    print(f"    Max Drawdown: {risk['max_drawdown']} ({risk['max_drawdown_percent']})")
    print()

    # Capital
    print("[8] Capital Management")
    capital = results_dict['capital']
    print(f"    Initial Capital: {capital['initial']}")
    print(f"    Final Capital: {capital['final']}")
    print(f"    Peak Capital: {capital['peak']}")
    print(f"    Total Return: {capital['return_percent']}")
    print()

    # Trade Analysis
    print("[9] Trade Analysis")
    analysis = engine.get_trade_analysis(result)
    if 'note' not in analysis:
        print(f"    Max Consecutive Wins: {analysis['max_consecutive_wins']}")
        print(f"    Max Consecutive Losses: {analysis['max_consecutive_losses']}")
        print(f"    Average Trade P&L: {analysis['average_trade_pnl']}")
        print(f"    Risk/Reward Ratio: {analysis['risk_reward_ratio']}")
    else:
        print(f"    {analysis['note']}")
    print()

    # Trade Log Sample
    if result.total_trades > 0:
        print("[10] Trade Log Sample (First 5 Trades)")
        for i, trade in enumerate(result.trades[:5]):
            trade_dict = trade.to_dict()
            print(f"    Trade #{trade_dict['trade_id']}: {trade_dict['action']} @ {trade_dict['price_dollars']}")
            if trade_dict['action'] == 'BUY':
                print(f"        Signal: {trade_dict.get('entry_signal', 'N/A')}")
            else:
                print(f"        Exit: {trade_dict.get('exit_signal', 'N/A')}")
                print(f"        P&L: {trade_dict['pnl_dollars']}")
        print()

    # Equity Curve Sample
    print("[11] Equity Curve Summary")
    if len(result.equity_curve) > 0:
        print(f"    Starting Equity: ${result.equity_curve[0] / 100:,.2f}")
        print(f"    Peak Equity: ${max(result.equity_curve) / 100:,.2f}")
        print(f"    Final Equity: ${result.equity_curve[-1] / 100:,.2f}")
        print(f"    Equity Curve Points: {len(result.equity_curve)}")
    print()

    # Export results
    print("[12] Exporting Results")
    output_path = Path(__file__).parent / "backtest_results.json"
    engine.export_results(result, str(output_path))
    print(f"    ✅ Results exported to: {output_path}")
    print()

    print("=" * 80)
    print("DEMONSTRATION COMPLETE")
    print("=" * 80)
    print()
    print("Key Features Demonstrated:")
    print("  ✅ Integer-only arithmetic (cent precision)")
    print("  ✅ Comprehensive P&L tracking")
    print("  ✅ Sharpe & Sortino ratios")
    print("  ✅ Maximum drawdown analysis")
    print("  ✅ Trade logging and analysis")
    print("  ✅ Equity curve tracking")
    print("  ✅ Commission and slippage modeling")
    print("  ✅ Strategy integration (Fibonacci)")
    print()


if __name__ == "__main__":
    run_comprehensive_backtest()

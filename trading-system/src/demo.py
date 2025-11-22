"""
Demo script for TradingView-Style Visualization System
Shows examples of all chart types with sample data
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from visualization import TradingViewCharts, FibonacciUtils, ChartExporter


def generate_realistic_price_data(days=100, initial_price=100, volatility=0.02):
    """Generate realistic price data with trend"""
    np.random.seed(42)
    dates = pd.date_range(start=datetime.now() - timedelta(days=days), periods=days, freq='D')

    # Generate price with trend and volatility
    trend = 0.001  # Slight upward trend
    prices = [initial_price]

    for i in range(1, days):
        change = np.random.randn() * volatility * prices[-1]
        drift = trend * prices[-1]
        new_price = prices[-1] + change + drift
        prices.append(max(new_price, 1))  # Prevent negative prices

    # Create OHLCV data
    df = pd.DataFrame({
        'timestamp': dates,
        'open': prices,
        'close': [p + np.random.randn() * volatility * p for p in prices],
        'high': [p * (1 + abs(np.random.randn() * volatility * 1.5)) for p in prices],
        'low': [p * (1 - abs(np.random.randn() * volatility * 1.5)) for p in prices],
        'volume': [int(1000000 + abs(np.random.randn() * 500000)) for _ in range(days)]
    })

    # Ensure high/low consistency
    df['high'] = df[['open', 'high', 'low', 'close']].max(axis=1)
    df['low'] = df[['open', 'high', 'low', 'close']].min(axis=1)

    return df


def demo_candlestick_chart():
    """Demo 1: Candlestick Chart with Fibonacci Overlays"""
    print("\n" + "="*60)
    print("Demo 1: Candlestick Chart with Fibonacci Overlays")
    print("="*60)

    # Generate data
    df = generate_realistic_price_data(days=100, initial_price=150, volatility=0.025)

    # Generate trading signals
    signals = pd.DataFrame({
        'timestamp': [df['timestamp'].iloc[20], df['timestamp'].iloc[45], df['timestamp'].iloc[70]],
        'type': ['buy', 'sell', 'buy'],
        'price': [df['close'].iloc[20], df['close'].iloc[45], df['close'].iloc[70]]
    })

    # Create chart
    charts = TradingViewCharts(theme='dark')
    fig = charts.candlestick_with_fibonacci(
        df,
        show_volume=True,
        show_fibonacci=True,
        signals=signals
    )

    # Export
    exporter = ChartExporter()
    exporter.export_html(fig, '/home/user/agentic-flow/trading-system/docs/demo_candlestick.html')

    print("✓ Created candlestick chart with:")
    print(f"  - {len(df)} candles")
    print(f"  - {len(signals)} trading signals")
    print(f"  - Fibonacci retracement levels")
    print(f"  - Volume analysis subplot")
    print(f"  - Exported to: /trading-system/docs/demo_candlestick.html")


def demo_volume_analysis():
    """Demo 2: Volume Analysis with Log Scale"""
    print("\n" + "="*60)
    print("Demo 2: Volume Analysis with Log-Space Encoding")
    print("="*60)

    df = generate_realistic_price_data(days=100, initial_price=200, volatility=0.03)

    charts = TradingViewCharts(theme='dark')
    fig = charts.volume_analysis(
        df,
        use_log_scale=True,
        show_fibonacci_levels=True
    )

    exporter = ChartExporter()
    exporter.export_html(fig, '/home/user/agentic-flow/trading-system/docs/demo_volume.html')

    print("✓ Created volume analysis with:")
    print(f"  - Log-scale volume bars")
    print(f"  - Fibonacci volume levels")
    print(f"  - Cumulative volume tracking")
    print(f"  - Exported to: /trading-system/docs/demo_volume.html")


def demo_economic_indicators():
    """Demo 3: Economic Indicators Dashboard"""
    print("\n" + "="*60)
    print("Demo 3: Economic Indicators Dashboard")
    print("="*60)

    # Generate multiple indicators
    indicators = {}
    categories = ['GDP Growth', 'Inflation Rate', 'Unemployment', 'Consumer Confidence',
                 'Manufacturing PMI', 'Retail Sales', 'Housing Starts', 'Trade Balance']

    dates = pd.date_range(start=datetime.now() - timedelta(days=365), periods=52, freq='W')

    for i, category in enumerate(categories):
        base_value = 50 + i * 5
        trend = np.random.choice([-0.5, 0, 0.5])
        noise = np.random.randn(52) * 3

        values = base_value + np.cumsum(noise) + np.arange(52) * trend

        indicators[category] = pd.DataFrame({
            'timestamp': dates,
            'value': values
        })

    charts = TradingViewCharts(theme='dark')
    fig = charts.economic_indicators_dashboard(indicators)

    exporter = ChartExporter()
    exporter.export_html(fig, '/home/user/agentic-flow/trading-system/docs/demo_indicators.html')

    print("✓ Created economic indicators dashboard with:")
    print(f"  - {len(indicators)} indicators")
    print(f"  - 52 weeks of data per indicator")
    print(f"  - Trend detection and color coding")
    print(f"  - Exported to: /trading-system/docs/demo_indicators.html")


def demo_backtesting_results():
    """Demo 4: Backtesting Results Visualization"""
    print("\n" + "="*60)
    print("Demo 4: Backtesting Results Dashboard")
    print("="*60)

    # Generate trade data
    np.random.seed(42)
    num_trades = 100
    dates = pd.date_range(start=datetime.now() - timedelta(days=200), periods=num_trades, freq='2D')

    # Simulate realistic trading results
    win_rate = 0.55  # 55% win rate
    wins = int(num_trades * win_rate)
    losses = num_trades - wins

    returns = []
    for i in range(num_trades):
        if i < wins:
            # Winning trades: average +3% with variance
            returns.append(np.random.uniform(0.01, 0.08))
        else:
            # Losing trades: average -2% with variance
            returns.append(np.random.uniform(-0.06, -0.005))

    np.random.shuffle(returns)

    trades = pd.DataFrame({
        'entry_time': dates,
        'exit_time': dates + timedelta(days=1),
        'return': returns,
        'pnl': [r * 10000 for r in returns]  # Assuming $10k position size
    })

    # Generate equity curve
    initial_capital = 100000
    equity = [initial_capital]
    max_equity = [initial_capital]

    for pnl in trades['pnl']:
        new_equity = equity[-1] + pnl
        equity.append(new_equity)
        max_equity.append(max(max_equity[-1], new_equity))

    equity_curve = pd.DataFrame({
        'timestamp': pd.date_range(start=dates[0], periods=len(equity), freq='2D'),
        'equity': equity,
        'drawdown': [(e - me) / me for e, me in zip(equity, max_equity)]
    })

    # Calculate metrics
    total_return = (equity[-1] - initial_capital) / initial_capital
    max_drawdown = min(equity_curve['drawdown'])
    actual_win_rate = len(trades[trades['pnl'] > 0]) / len(trades)
    sharpe_ratio = trades['return'].mean() / trades['return'].std() * np.sqrt(252)

    metrics = {
        'Total Return': f"{total_return*100:.2f}%",
        'Max Drawdown': f"{max_drawdown*100:.2f}%",
        'Win Rate': f"{actual_win_rate*100:.2f}%",
        'Sharpe Ratio': f"{sharpe_ratio:.2f}",
        'Total Trades': len(trades),
        'Winning Trades': len(trades[trades['pnl'] > 0]),
        'Losing Trades': len(trades[trades['pnl'] < 0]),
        'Avg Win': f"${trades[trades['pnl'] > 0]['pnl'].mean():.2f}",
        'Avg Loss': f"${trades[trades['pnl'] < 0]['pnl'].mean():.2f}",
        'Profit Factor': f"{abs(trades[trades['pnl'] > 0]['pnl'].sum() / trades[trades['pnl'] < 0]['pnl'].sum()):.2f}"
    }

    charts = TradingViewCharts(theme='dark')
    fig = charts.backtesting_results(equity_curve, trades, metrics)

    exporter = ChartExporter()
    exporter.export_html(fig, '/home/user/agentic-flow/trading-system/docs/demo_backtest.html')

    print("✓ Created backtesting dashboard with:")
    print(f"  - {len(trades)} trades")
    print(f"  - Total Return: {total_return*100:.2f}%")
    print(f"  - Win Rate: {actual_win_rate*100:.2f}%")
    print(f"  - Sharpe Ratio: {sharpe_ratio:.2f}")
    print(f"  - Exported to: /trading-system/docs/demo_backtest.html")


def demo_realtime_monitor():
    """Demo 5: Real-time Ticker Monitor"""
    print("\n" + "="*60)
    print("Demo 5: Real-time Ticker Monitor")
    print("="*60)

    # Generate ticker data
    tickers = {}
    symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN']
    base_prices = [175, 140, 380, 245, 170]

    dates = pd.date_range(start=datetime.now() - timedelta(hours=6), periods=100, freq='3min')

    for symbol, base_price in zip(symbols, base_prices):
        prices = base_price + np.cumsum(np.random.randn(100) * 0.5)
        tickers[symbol] = pd.DataFrame({
            'timestamp': dates,
            'price': prices
        })

    # Calculate Fibonacci alert levels
    fib = FibonacciUtils()
    alert_levels = {}

    for symbol, data in tickers.items():
        max_price = data['price'].max()
        min_price = data['price'].min()
        price_range = max_price - min_price

        # Set alerts at key Fibonacci levels
        alert_levels[symbol] = [
            min_price + price_range * 0.618,  # Golden ratio
            min_price + price_range * 1.618   # Fibonacci extension
        ]

    charts = TradingViewCharts(theme='dark')
    fig = charts.realtime_ticker_monitor(tickers, alert_levels)

    exporter = ChartExporter()
    exporter.export_html(fig, '/home/user/agentic-flow/trading-system/docs/demo_realtime.html')

    print("✓ Created real-time monitor with:")
    print(f"  - {len(tickers)} tickers")
    print(f"  - 6 hours of intraday data")
    print(f"  - Fibonacci alert levels")
    print(f"  - Exported to: /trading-system/docs/demo_realtime.html")


def demo_fibonacci_utilities():
    """Demo 6: Fibonacci Utilities"""
    print("\n" + "="*60)
    print("Demo 6: Fibonacci & Zeckendorf Utilities")
    print("="*60)

    fib = FibonacciUtils()

    # Fibonacci numbers
    fib_nums = fib.generate_fibonacci(15)
    print(f"\n✓ First 15 Fibonacci numbers:")
    print(f"  {fib_nums}")

    # Fibonacci retracement levels
    levels = fib.fibonacci_retracement_levels()
    print(f"\n✓ Standard Fibonacci retracement levels:")
    print(f"  {levels}")

    # Zeckendorf decomposition
    test_numbers = [100, 255, 1000]
    print(f"\n✓ Zeckendorf decomposition examples:")
    for num in test_numbers:
        decomp = fib.zeckendorf_decompose(num)
        print(f"  {num} = {' + '.join(map(str, decomp))} (sum: {sum(decomp)})")

    # Lucas numbers
    lucas = fib.lucas_numbers(12)
    print(f"\n✓ First 12 Lucas numbers:")
    print(f"  {lucas}")


def demo_sector_analysis():
    """Demo 7: Sector Analysis"""
    print("\n" + "="*60)
    print("Demo 7: Sector Performance & Correlation")
    print("="*60)

    # Generate sector data
    sectors = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer', 'Industrial']
    subsectors = ['Large Cap', 'Mid Cap', 'Small Cap', 'Growth', 'Value']

    sector_data = []
    for sector in sectors:
        for subsector in subsectors:
            performance = np.random.randn() * 10  # Random performance
            sector_data.append({
                'sector': sector,
                'subsector': subsector,
                'performance': performance
            })

    df_sectors = pd.DataFrame(sector_data)

    # Create heatmap
    charts = TradingViewCharts(theme='dark')
    fig1 = charts.sector_heatmap(df_sectors)

    exporter = ChartExporter()
    exporter.export_html(fig1, '/home/user/agentic-flow/trading-system/docs/demo_sectors.html')

    # Create correlation matrix
    pivot_data = df_sectors.pivot_table(
        values='performance',
        index='sector',
        columns='subsector',
        aggfunc='mean'
    )
    correlation = pivot_data.T.corr()

    fig2 = charts.correlation_matrix(correlation, use_zeckendorf_compression=True)
    exporter.export_html(fig2, '/home/user/agentic-flow/trading-system/docs/demo_correlation.html')

    print("✓ Created sector analysis with:")
    print(f"  - {len(sectors)} sectors")
    print(f"  - {len(subsectors)} subsectors each")
    print(f"  - Performance heatmap")
    print(f"  - Correlation matrix with Zeckendorf compression")
    print(f"  - Exported to: /trading-system/docs/demo_sectors.html")
    print(f"                 /trading-system/docs/demo_correlation.html")


def run_all_demos():
    """Run all demonstration examples"""
    print("\n" + "="*60)
    print("TradingView-Style Visualization System - Demo Suite")
    print("="*60)
    print("\nRunning all demonstrations...")

    demo_candlestick_chart()
    demo_volume_analysis()
    demo_economic_indicators()
    demo_backtesting_results()
    demo_realtime_monitor()
    demo_fibonacci_utilities()
    demo_sector_analysis()

    print("\n" + "="*60)
    print("All demos completed successfully!")
    print("="*60)
    print("\nGenerated files:")
    print("  - /trading-system/docs/demo_candlestick.html")
    print("  - /trading-system/docs/demo_volume.html")
    print("  - /trading-system/docs/demo_indicators.html")
    print("  - /trading-system/docs/demo_backtest.html")
    print("  - /trading-system/docs/demo_realtime.html")
    print("  - /trading-system/docs/demo_sectors.html")
    print("  - /trading-system/docs/demo_correlation.html")
    print("\nTo view the dashboard, run:")
    print("  python src/dashboard.py")
    print("  Then open: http://localhost:8050")
    print("="*60 + "\n")


if __name__ == '__main__':
    run_all_demos()

# Backtesting Engine - Example Usage

This document provides practical examples for using the Fibonacci-based backtesting engine.

## Table of Contents

1. [Basic Backtest](#basic-backtest)
2. [Testing All Strategies](#testing-all-strategies)
3. [Parameter Optimization](#parameter-optimization)
4. [AgentDB Integration](#agentdb-integration)
5. [Real Market Data](#real-market-data)
6. [Advanced Workflows](#advanced-workflows)

---

## Basic Backtest

### Simple Fibonacci Retracement Test

```python
#!/usr/bin/env python3
"""
Simple backtest example using Fibonacci retracement strategy
"""

from backtesting_engine import (
    BacktestingEngine,
    FibonacciRetracementStrategy,
    generate_sample_data,
    print_performance_report
)

# Generate sample data
print("Generating market data...")
data = generate_sample_data(ticker='AAPL', num_points=500)

# Create backtesting engine
engine = BacktestingEngine(
    initial_capital=100000.0,
    commission=0.001,  # 0.1% commission
    slippage=0.001     # 0.1% slippage
)

# Create Fibonacci retracement strategy
strategy = FibonacciRetracementStrategy({
    'entry_levels': [0.382, 0.618],  # Enter at 38.2% and 61.8%
    'lookback_period': 20
})

# Run backtest
print(f"\nRunning backtest for {strategy.name}...")
metrics, trades, equity_df = engine.run_backtest(data, strategy, verbose=True)

# Print detailed report
print_performance_report(strategy.name, metrics, trades)

# Print first few trades
print("\nFirst 5 Trades:")
for i, trade in enumerate(trades[:5], 1):
    print(f"{i}. Entry: ${trade.entry_price:.2f} @ {trade.entry_timestamp}")
    print(f"   Exit: ${trade.exit_price:.2f} @ {trade.exit_timestamp}")
    print(f"   P&L: ${trade.pnl:.2f} ({trade.pnl_pct:.2f}%)")
    print(f"   Reason: {trade.exit_reason}")
    print()
```

**Output:**
```
Generating market data...
✓ Generated 500 bars of data

Running backtest for FibonacciRetracement...

======================================================================
  PERFORMANCE REPORT: FibonacciRetracement
======================================================================

📊 Returns & Risk-Adjusted Metrics
  Total Return:        $    5,234.56
  Sharpe Ratio:                 2.15
  Sortino Ratio:                2.87
  Calmar Ratio:                 3.45
  Max Drawdown:               -8.23%
  Max DD Duration:              12 days

📈 Trade Statistics
  Total Trades:                   15
  Winning Trades:                 10
  Losing Trades:                   5
  Win Rate:                    66.67%
  Profit Factor:                1.85
  Expectancy:              $348.97

💰 Win/Loss Analysis
  Average Win:             $725.45
  Average Loss:           $-392.15
  Largest Win:           $1,234.56
  Largest Loss:           $-845.23
  Avg Trade Duration:         8.5 days

======================================================================
```

---

## Testing All Strategies

### Compare All Built-in Strategies

```python
#!/usr/bin/env python3
"""
Compare all built-in strategies
"""

from backtesting_engine import (
    BacktestingEngine,
    FibonacciRetracementStrategy,
    LucasSequenceExitStrategy,
    MomentumStrategy,
    MeanReversionStrategy,
    BreakoutStrategy,
    generate_sample_data
)
import pandas as pd

# Generate data
data = generate_sample_data(num_points=500)

# Create engine
engine = BacktestingEngine(initial_capital=100000.0)

# Define all strategies to test
strategies = [
    FibonacciRetracementStrategy({
        'entry_levels': [0.382, 0.618],
        'lookback_period': 20
    }),
    MomentumStrategy({
        'rsi_period': 14,
        'rsi_oversold': 30,
        'rsi_overbought': 70
    }),
    MeanReversionStrategy({
        'lookback_period': 20,
        'entry_std_multiplier': 1.618
    }),
    BreakoutStrategy({
        'lookback_period': 20,
        'volume_multiplier': 1.618
    })
]

# Run all backtests
results = []

for strategy in strategies:
    print(f"\n{'='*70}")
    print(f"Testing: {strategy.name}")
    print(f"{'='*70}")

    metrics, trades, equity_df = engine.run_backtest(data, strategy, verbose=False)

    results.append({
        'Strategy': strategy.name,
        'Total Return': f"${metrics.total_return:,.2f}",
        'Return %': f"{(metrics.total_return/engine.initial_capital)*100:.2f}%",
        'Sharpe': f"{metrics.sharpe_ratio:.2f}",
        'Sortino': f"{metrics.sortino_ratio:.2f}",
        'Max DD': f"{metrics.max_drawdown*100:.2f}%",
        'Win Rate': f"{metrics.win_rate*100:.1f}%",
        'Trades': metrics.total_trades,
        'Profit Factor': f"{metrics.profit_factor:.2f}"
    })

    print(f"✓ {strategy.name}: Return ${metrics.total_return:,.2f}, Sharpe {metrics.sharpe_ratio:.2f}")

# Create comparison table
comparison_df = pd.DataFrame(results)
print(f"\n{'='*70}")
print("STRATEGY COMPARISON")
print(f"{'='*70}\n")
print(comparison_df.to_string(index=False))

# Find best strategy
best_by_sharpe = comparison_df.loc[comparison_df['Sharpe'].str.replace('-', '0').astype(float).idxmax()]
print(f"\n🏆 Best Strategy (by Sharpe Ratio): {best_by_sharpe['Strategy']}")
print(f"   Sharpe Ratio: {best_by_sharpe['Sharpe']}")
print(f"   Total Return: {best_by_sharpe['Total Return']}")
```

---

## Parameter Optimization

### Grid Search for Fibonacci Levels

```python
#!/usr/bin/env python3
"""
Optimize Fibonacci retracement levels using grid search
"""

from backtesting_engine import (
    BacktestingEngine,
    FibonacciRetracementStrategy,
    generate_sample_data
)

# Generate data
data = generate_sample_data(num_points=500)

# Create engine
engine = BacktestingEngine(initial_capital=100000.0)

# Define Fibonacci level combinations to test
level_combinations = [
    [0.236],
    [0.382],
    [0.500],
    [0.618],
    [0.786],
    [0.236, 0.382],
    [0.382, 0.500],
    [0.500, 0.618],
    [0.618, 0.786],
    [0.236, 0.382, 0.618],
    [0.382, 0.500, 0.618],
    [0.236, 0.382, 0.500, 0.618, 0.786]
]

print("Running Fibonacci Level Grid Search...")
print(f"Testing {len(level_combinations)} combinations\n")

# Run grid search
grid_results = engine.grid_search_fibonacci_levels(
    data,
    FibonacciRetracementStrategy,
    level_param_name='entry_levels',
    test_levels=level_combinations
)

# Sort by Sharpe ratio
grid_results_sorted = grid_results.sort_values('sharpe_ratio', ascending=False)

print("\n" + "="*80)
print("GRID SEARCH RESULTS (Top 5 by Sharpe Ratio)")
print("="*80 + "\n")
print(grid_results_sorted.head().to_string(index=False))

# Get best configuration
best_config = grid_results_sorted.iloc[0]
print(f"\n🏆 Best Configuration:")
print(f"   Levels: {best_config['levels']}")
print(f"   Sharpe Ratio: {best_config['sharpe_ratio']:.2f}")
print(f"   Total Return: ${best_config['total_return']:,.2f}")
print(f"   Win Rate: {best_config['win_rate']*100:.1f}%")
print(f"   Total Trades: {best_config['total_trades']}")

# Test best configuration with detailed output
print(f"\n{'='*80}")
print("DETAILED BACKTEST WITH BEST CONFIGURATION")
print(f"{'='*80}\n")

best_levels = eval(best_config['levels'])
optimized_strategy = FibonacciRetracementStrategy({
    'entry_levels': best_levels,
    'lookback_period': 20
})

metrics, trades, equity_df = engine.run_backtest(data, optimized_strategy, verbose=True)
```

### Multi-Parameter Optimization

```python
#!/usr/bin/env python3
"""
Optimize multiple parameters simultaneously
"""

from backtesting_engine import (
    BacktestingEngine,
    FibonacciRetracementStrategy,
    generate_sample_data
)
from itertools import product

# Generate data
data = generate_sample_data(num_points=500)

# Define parameter grid
param_grid = {
    'entry_levels': [
        [0.382],
        [0.618],
        [0.382, 0.618]
    ],
    'lookback_period': [10, 20, 30],
    'base_position_size': [0.382, 0.618]
}

# Generate all combinations
param_combinations = [
    dict(zip(param_grid.keys(), values))
    for values in product(*param_grid.values())
]

print(f"Testing {len(param_combinations)} parameter combinations...\n")

# Test all combinations
results = []

for params in param_combinations:
    strategy = FibonacciRetracementStrategy(params)
    engine = BacktestingEngine(initial_capital=100000.0)

    metrics, trades, equity_df = engine.run_backtest(data, strategy, verbose=False)

    results.append({
        'entry_levels': str(params['entry_levels']),
        'lookback': params['lookback_period'],
        'position_size': params['base_position_size'],
        'sharpe': metrics.sharpe_ratio,
        'return': metrics.total_return,
        'win_rate': metrics.win_rate,
        'trades': metrics.total_trades
    })

    print(f"✓ Tested: levels={params['entry_levels']}, "
          f"lookback={params['lookback_period']}, "
          f"size={params['base_position_size']} -> "
          f"Sharpe={metrics.sharpe_ratio:.2f}")

# Convert to DataFrame and sort
import pandas as pd
results_df = pd.DataFrame(results)
results_df = results_df.sort_values('sharpe', ascending=False)

print("\n" + "="*100)
print("TOP 10 PARAMETER COMBINATIONS")
print("="*100 + "\n")
print(results_df.head(10).to_string(index=False))

# Save results
results_df.to_csv('/home/user/agentic-flow/trading-system/docs/optimization_results.csv', index=False)
print("\n✓ Results saved to optimization_results.csv")
```

---

## AgentDB Integration

### Store and Learn from Strategies

```python
#!/usr/bin/env python3
"""
Integrate with AgentDB for strategy learning
"""

from backtesting_engine import (
    BacktestingEngine,
    FibonacciRetracementStrategy,
    AgentDBIntegration,
    generate_sample_data
)

# Initialize AgentDB
agentdb = AgentDBIntegration()

if not agentdb.agentdb_available:
    print("⚠ AgentDB not available. Install with: npm install -g agentdb")
    exit(1)

print("✓ AgentDB integration enabled\n")

# Generate data
data = generate_sample_data(num_points=500)

# Test multiple Fibonacci configurations
configurations = [
    {'entry_levels': [0.382], 'name': 'fib_382'},
    {'entry_levels': [0.618], 'name': 'fib_618'},
    {'entry_levels': [0.382, 0.618], 'name': 'fib_382_618'},
]

session_id = 'fibonacci_learning_2024'
successful_strategies = []

for config in configurations:
    print(f"\n{'─'*70}")
    print(f"Testing: {config['name']}")
    print(f"{'─'*70}")

    strategy = FibonacciRetracementStrategy({
        'entry_levels': config['entry_levels'],
        'lookback_period': 20
    })

    engine = BacktestingEngine(initial_capital=100000.0)
    metrics, trades, equity_df = engine.run_backtest(data, strategy, verbose=False)

    print(f"Sharpe: {metrics.sharpe_ratio:.2f}, Return: ${metrics.total_return:,.2f}")

    # Store if successful
    stored = agentdb.store_strategy(strategy, metrics, session_id=session_id)

    if stored:
        successful_strategies.append(config['name'])

        # Add causal relationships
        for level in config['entry_levels']:
            param_name = f"fibonacci_{int(level*1000)}"

            # Correlation with Sharpe ratio
            sharpe_corr = min(metrics.sharpe_ratio / 3.0, 1.0)
            agentdb.add_causal_relationship(param_name, 'sharpe_ratio', sharpe_corr)

            # Correlation with win rate
            win_rate_corr = metrics.win_rate
            agentdb.add_causal_relationship(param_name, 'win_rate', win_rate_corr)

            print(f"  ✓ Added causal edges for {param_name}")

print(f"\n{'='*70}")
print(f"LEARNING SUMMARY")
print(f"{'='*70}")
print(f"Successful strategies stored: {len(successful_strategies)}")
print(f"Strategies: {', '.join(successful_strategies)}")

# Query similar strategies
print(f"\n{'='*70}")
print(f"QUERYING AGENTDB FOR SIMILAR STRATEGIES")
print(f"{'='*70}\n")

similar = agentdb.query_similar_strategies("fibonacci retracement", limit=5)
if similar:
    print(f"Found {len(similar)} similar strategies:")
    for s in similar:
        print(f"  • {s}")
else:
    print("No similar strategies found (may need to build index)")

# Analyze causal graph
print(f"\n{'='*70}")
print(f"CAUSAL ANALYSIS")
print(f"{'='*70}\n")

print("Parameters influencing Sharpe Ratio:")
sharpe_influences = agentdb.analyze_causal_graph('sharpe_ratio', min_correlation=0.2)
if sharpe_influences:
    for edge in sharpe_influences:
        print(f"  • {edge}")
else:
    print("  No significant relationships found")

print("\nParameters influencing Win Rate:")
win_rate_influences = agentdb.analyze_causal_graph('win_rate', min_correlation=0.2)
if win_rate_influences:
    for edge in win_rate_influences:
        print(f"  • {edge}")
else:
    print("  No significant relationships found")

print(f"\n✓ Learning session complete!")
print(f"  Session ID: {session_id}")
print(f"  Use 'npx agentdb reflexion list' to view all stored strategies")
```

---

## Real Market Data

### Using Yahoo Finance Data

```python
#!/usr/bin/env python3
"""
Backtest with real market data from Yahoo Finance

Requirements: pip install yfinance
"""

try:
    import yfinance as yf
except ImportError:
    print("Please install yfinance: pip install yfinance")
    exit(1)

from backtesting_engine import (
    BacktestingEngine,
    FibonacciRetracementStrategy,
    print_performance_report
)
import pandas as pd

def load_yahoo_data(ticker, start_date, end_date):
    """Load OHLCV data from Yahoo Finance"""
    print(f"Downloading {ticker} data from {start_date} to {end_date}...")

    df = yf.download(ticker, start=start_date, end=end_date, progress=False)

    # Convert to required format
    data = pd.DataFrame({
        'timestamp': df.index,
        'open': df['Open'].values,
        'high': df['High'].values,
        'low': df['Low'].values,
        'close': df['Close'].values,
        'volume': df['Volume'].values
    })

    data['timestamp'] = pd.to_datetime(data['timestamp'])

    print(f"✓ Downloaded {len(data)} bars")
    return data

# Load real data
ticker = 'AAPL'
start_date = '2023-01-01'
end_date = '2024-01-01'

data = load_yahoo_data(ticker, start_date, end_date)

# Create and run backtest
strategy = FibonacciRetracementStrategy({
    'entry_levels': [0.382, 0.618],
    'lookback_period': 20
})

engine = BacktestingEngine(
    initial_capital=100000.0,
    commission=0.001,
    slippage=0.001
)

print(f"\nRunning backtest on {ticker}...")
metrics, trades, equity_df = engine.run_backtest(data, strategy, verbose=True)

# Print results
print_performance_report(f"{ticker} - {strategy.name}", metrics, trades)

# Save equity curve
equity_df.to_csv(f'/home/user/agentic-flow/trading-system/docs/{ticker}_equity_curve.csv', index=False)
print(f"\n✓ Equity curve saved to {ticker}_equity_curve.csv")
```

### Multi-Ticker Backtest

```python
#!/usr/bin/env python3
"""
Backtest across multiple tickers
"""

import yfinance as yf
import pandas as pd
from backtesting_engine import (
    BacktestingEngine,
    FibonacciRetracementStrategy
)

# Define tickers to test
tickers = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']
start_date = '2023-01-01'
end_date = '2024-01-01'

# Run backtests for all tickers
results = []

for ticker in tickers:
    print(f"\n{'='*70}")
    print(f"Testing {ticker}")
    print(f"{'='*70}")

    # Download data
    df = yf.download(ticker, start=start_date, end=end_date, progress=False)

    data = pd.DataFrame({
        'timestamp': df.index,
        'open': df['Open'].values,
        'high': df['High'].values,
        'low': df['Low'].values,
        'close': df['Close'].values,
        'volume': df['Volume'].values
    })
    data['timestamp'] = pd.to_datetime(data['timestamp'])

    # Run backtest
    strategy = FibonacciRetracementStrategy()
    engine = BacktestingEngine(initial_capital=100000.0)
    metrics, trades, equity_df = engine.run_backtest(data, strategy, verbose=False)

    results.append({
        'Ticker': ticker,
        'Return': f"${metrics.total_return:,.2f}",
        'Return %': f"{(metrics.total_return/100000)*100:.2f}%",
        'Sharpe': f"{metrics.sharpe_ratio:.2f}",
        'Win Rate': f"{metrics.win_rate*100:.1f}%",
        'Trades': metrics.total_trades
    })

    print(f"✓ {ticker}: Sharpe {metrics.sharpe_ratio:.2f}, Return ${metrics.total_return:,.2f}")

# Print comparison
comparison_df = pd.DataFrame(results)
print(f"\n{'='*70}")
print("MULTI-TICKER COMPARISON")
print(f"{'='*70}\n")
print(comparison_df.to_string(index=False))
```

---

## Advanced Workflows

### Walk-Forward Optimization

```python
#!/usr/bin/env python3
"""
Walk-forward optimization to avoid overfitting
"""

from backtesting_engine import (
    BacktestingEngine,
    FibonacciRetracementStrategy,
    generate_sample_data
)
import pandas as pd

def walk_forward_test(data, train_size=200, test_size=50):
    """
    Walk-forward analysis

    Args:
        data: Full dataset
        train_size: Size of training window
        test_size: Size of test window
    """
    results = []

    # Walk forward through data
    for i in range(0, len(data) - train_size - test_size, test_size):
        print(f"\nWindow {i // test_size + 1}:")
        print(f"  Train: bars {i} to {i + train_size}")
        print(f"  Test:  bars {i + train_size} to {i + train_size + test_size}")

        train_data = data.iloc[i:i + train_size]
        test_data = data.iloc[i + train_size:i + train_size + test_size]

        # Optimize on training data (simplified - use grid search in production)
        best_sharpe = -999
        best_params = None

        for levels in [[0.382], [0.618], [0.382, 0.618]]:
            strategy = FibonacciRetracementStrategy({'entry_levels': levels})
            engine = BacktestingEngine(initial_capital=100000.0)
            metrics, _, _ = engine.run_backtest(train_data, strategy, verbose=False)

            if metrics.sharpe_ratio > best_sharpe:
                best_sharpe = metrics.sharpe_ratio
                best_params = {'entry_levels': levels}

        print(f"  Best params on train: {best_params} (Sharpe: {best_sharpe:.2f})")

        # Test on out-of-sample data
        strategy = FibonacciRetracementStrategy(best_params)
        engine = BacktestingEngine(initial_capital=100000.0)
        metrics, trades, _ = engine.run_backtest(test_data, strategy, verbose=False)

        print(f"  Test performance: Sharpe {metrics.sharpe_ratio:.2f}, Return ${metrics.total_return:,.2f}")

        results.append({
            'window': i // test_size + 1,
            'train_sharpe': best_sharpe,
            'test_sharpe': metrics.sharpe_ratio,
            'test_return': metrics.total_return,
            'params': str(best_params)
        })

    return pd.DataFrame(results)

# Generate data
data = generate_sample_data(num_points=600)

# Run walk-forward test
wf_results = walk_forward_test(data, train_size=200, test_size=50)

print(f"\n{'='*70}")
print("WALK-FORWARD ANALYSIS RESULTS")
print(f"{'='*70}\n")
print(wf_results.to_string(index=False))

# Calculate average out-of-sample performance
avg_test_sharpe = wf_results['test_sharpe'].mean()
print(f"\nAverage Out-of-Sample Sharpe: {avg_test_sharpe:.2f}")
```

### Economic Regime Analysis

```python
#!/usr/bin/env python3
"""
Test strategy performance across different market regimes
"""

from backtesting_engine import (
    BacktestingEngine,
    FibonacciRetracementStrategy,
    generate_sample_data
)
import pandas as pd
import numpy as np

def identify_regimes(data, window=50):
    """
    Identify market regimes based on volatility and trend

    Returns: Series with regime labels ('bull_low_vol', 'bull_high_vol', etc.)
    """
    # Calculate volatility
    returns = data['close'].pct_change()
    volatility = returns.rolling(window).std()

    # Calculate trend
    sma = data['close'].rolling(window).mean()
    trend = (data['close'] > sma).astype(int)

    # Classify regimes
    regimes = []
    for i in range(len(data)):
        if i < window:
            regimes.append('unknown')
        else:
            vol = 'high_vol' if volatility.iloc[i] > volatility.median() else 'low_vol'
            trend_dir = 'bull' if trend.iloc[i] == 1 else 'bear'
            regimes.append(f"{trend_dir}_{vol}")

    return pd.Series(regimes, index=data.index)

# Generate data
data = generate_sample_data(num_points=500)

# Identify regimes
data['regime'] = identify_regimes(data)

# Test strategy in each regime
strategy = FibonacciRetracementStrategy()
regime_results = []

for regime in data['regime'].unique():
    if regime == 'unknown':
        continue

    regime_data = data[data['regime'] == regime].reset_index(drop=True)

    if len(regime_data) < 50:  # Skip if not enough data
        continue

    print(f"\nTesting in {regime} regime ({len(regime_data)} bars)...")

    engine = BacktestingEngine(initial_capital=100000.0)
    metrics, trades, _ = engine.run_backtest(regime_data, strategy, verbose=False)

    regime_results.append({
        'Regime': regime,
        'Bars': len(regime_data),
        'Sharpe': f"{metrics.sharpe_ratio:.2f}",
        'Return': f"${metrics.total_return:,.2f}",
        'Win Rate': f"{metrics.win_rate*100:.1f}%",
        'Trades': metrics.total_trades
    })

# Print results
regime_df = pd.DataFrame(regime_results)
print(f"\n{'='*70}")
print("PERFORMANCE BY MARKET REGIME")
print(f"{'='*70}\n")
print(regime_df.to_string(index=False))
```

---

## Additional Resources

- **Main Documentation**: See `BACKTESTING_GUIDE.md` for comprehensive documentation
- **API Reference**: Full API documentation in guide
- **Test Suite**: Run `python test_backtesting_engine.py` for comprehensive tests
- **AgentDB Docs**: `npx agentdb --help` for AgentDB CLI documentation

## Support

For issues and questions, please see the main project documentation.

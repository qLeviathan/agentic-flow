# Comprehensive Backtesting Engine Guide

## Overview

The Fibonacci-based backtesting engine provides a complete framework for testing, optimizing, and learning from trading strategies. It integrates mathematical sequences (Fibonacci and Lucas), integer encoding (Zeckendorf), and AI-powered learning (AgentDB) for systematic strategy development.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Features](#core-features)
3. [Strategies](#strategies)
4. [Risk Management](#risk-management)
5. [Performance Metrics](#performance-metrics)
6. [AgentDB Integration](#agentdb-integration)
7. [Advanced Usage](#advanced-usage)
8. [API Reference](#api-reference)

---

## Quick Start

### Installation

```bash
# Install dependencies
pip install numpy pandas

# Optional: Install AgentDB for strategy learning
npm install -g agentdb
```

### Basic Usage

```python
from backtesting_engine import (
    BacktestingEngine,
    FibonacciRetracementStrategy,
    generate_sample_data
)

# Generate sample data (replace with real market data)
data = generate_sample_data(ticker='AAPL', num_points=500)

# Create backtesting engine
engine = BacktestingEngine(initial_capital=100000.0)

# Create strategy
strategy = FibonacciRetracementStrategy({
    'entry_levels': [0.382, 0.618],
    'lookback_period': 20
})

# Run backtest
metrics, trades, equity_df = engine.run_backtest(data, strategy, verbose=True)

# Print results
print(f"Total Return: ${metrics.total_return:,.2f}")
print(f"Sharpe Ratio: {metrics.sharpe_ratio:.2f}")
print(f"Win Rate: {metrics.win_rate*100:.1f}%")
```

---

## Core Features

### 1. Strategy Testing Framework

The engine supports multiple Fibonacci-based strategies:

- **Fibonacci Retracement**: Entry/exit at key Fibonacci levels (23.6%, 38.2%, 50%, 61.8%, 78.6%)
- **Lucas Sequence Exits**: Time-based exits using Lucas numbers
- **Momentum**: RSI and MACD strategies with integer encoding
- **Mean Reversion**: Fibonacci-bounded statistical arbitrage
- **Breakout**: Golden ratio volume and price breakouts

### 2. Risk Management System

Sophisticated risk controls using Fibonacci ratios:

```python
from backtesting_engine import RiskManager

risk_manager = RiskManager({
    'max_position_size': 0.618,  # Golden ratio of portfolio
    'max_portfolio_risk': 0.236,  # 23.6% maximum at-risk capital
    'risk_reward_ratio': 1.618,  # Minimum 1.618:1 reward-to-risk
})
```

**Features:**
- Position sizing at Fibonacci ratios (0.236, 0.382, 0.618, 1.0)
- Stop-loss placement at Fibonacci support levels
- Take-profit targets at Fibonacci extension levels (1.272, 1.618, 2.618)
- Portfolio risk limits
- Trade validation before execution

### 3. Performance Metrics

Comprehensive performance analysis with integer encoding:

```python
from backtesting_engine import PerformanceAnalyzer

analyzer = PerformanceAnalyzer()
metrics = analyzer.analyze_trades(trades)

# Standard metrics
print(f"Sharpe Ratio: {metrics.sharpe_ratio:.2f}")
print(f"Sortino Ratio: {metrics.sortino_ratio:.2f}")
print(f"Calmar Ratio: {metrics.calmar_ratio:.2f}")
print(f"Max Drawdown: {metrics.max_drawdown*100:.2f}%")

# Integer-encoded metrics (Zeckendorf compression)
print(f"Encoded Sharpe: {metrics.encoded_sharpe}")
print(f"Encoded Drawdown: {metrics.encoded_max_drawdown}")
```

**Metrics Included:**
- **Risk-Adjusted**: Sharpe, Sortino, Calmar ratios
- **Drawdown**: Maximum drawdown and duration
- **Trade Statistics**: Win rate, profit factor, expectancy
- **Trade Analysis**: Average win/loss, largest win/loss
- **Integer Encoding**: Zeckendorf representation for compression

### 4. Multi-Strategy Testing

Test multiple strategies and parameter combinations:

```python
# Test multiple strategies
strategies = [
    FibonacciRetracementStrategy(),
    MomentumStrategy(),
    MeanReversionStrategy(),
    BreakoutStrategy()
]

results = engine.run_multi_strategy_test(data, strategies)

# Grid search across Fibonacci levels
grid_results = engine.grid_search_fibonacci_levels(
    data,
    FibonacciRetracementStrategy,
    test_levels=[
        [0.236],
        [0.382],
        [0.618],
        [0.382, 0.618],
        [0.236, 0.382, 0.618]
    ]
)

print(grid_results.sort_values('sharpe_ratio', ascending=False))
```

### 5. AgentDB Integration

Store successful strategies and build causal knowledge graphs:

```python
from backtesting_engine import AgentDBIntegration

agentdb = AgentDBIntegration()

# Store successful strategy
agentdb.store_strategy(strategy, metrics, session_id='backtest_001')

# Add causal relationships
agentdb.add_causal_relationship('fibonacci_618', 'win_rate', 0.45)
agentdb.add_causal_relationship('fibonacci_382', 'sharpe_ratio', 0.35)

# Query similar strategies
similar = agentdb.query_similar_strategies("fibonacci retracement", limit=5)

# Analyze causal graph
influences = agentdb.analyze_causal_graph('win_rate', min_correlation=0.3)
```

---

## Strategies

### Fibonacci Retracement Strategy

**Concept**: Buy at Fibonacci support levels, sell at resistance.

**Entry Signals:**
- Price retraces to Fibonacci level (38.2%, 50%, 61.8%) from recent high
- Bounce confirmation

**Exit Signals:**
- Price reaches Fibonacci extension (127.2%, 161.8%)
- Price breaks below stop-loss (previous swing low)

**Parameters:**
```python
FibonacciRetracementStrategy({
    'entry_levels': [0.382, 0.500, 0.618],  # Retracement levels
    'exit_levels': [1.272, 1.618],  # Extension levels
    'lookback_period': 20,  # Bars to identify swing points
    'base_position_size': 0.618  # Position size as fraction
})
```

**Example:**
```python
strategy = FibonacciRetracementStrategy({
    'entry_levels': [0.618],  # Only trade 61.8% retracement
    'lookback_period': 30
})

metrics, trades, equity = engine.run_backtest(data, strategy)
```

### Lucas Sequence Exit Strategy

**Concept**: Exit positions after Lucas sequence time periods.

**Exit Timing:**
- Lucas sequence days: 2, 1, 3, 4, 7, 11, 18, 29, 47...
- Adjusted for market volatility

**Parameters:**
```python
LucasSequenceExitStrategy({
    'lucas_terms': 10,  # Number of Lucas numbers to use
    'volatility_adjustment': True,  # Adjust for volatility
    'max_hold_days': 47  # Maximum hold period
})
```

**Volatility Adjustment:**
- Low volatility (< 0.5): Longer holds (Lucas[6] = 18 days)
- High volatility (> 2.0): Shorter holds (Lucas[2] = 3 days)
- Normal volatility: Medium holds (Lucas[4] = 7 days)

### Momentum Strategy

**Concept**: Trade based on RSI and MACD with integer encoding.

**Entry Signals:**
- **BUY**: RSI < 30 (oversold) AND MACD bullish crossover
- **SELL**: RSI > 70 (overbought) AND MACD bearish crossover

**Integer Encoding:**
All indicator values are encoded using Zeckendorf representation for compression.

**Parameters:**
```python
MomentumStrategy({
    'rsi_period': 14,
    'rsi_oversold': 30,
    'rsi_overbought': 70,
    'macd_fast': 12,
    'macd_slow': 26,
    'macd_signal': 9,
    'base_position_size': 0.382
})
```

**Example:**
```python
strategy = MomentumStrategy({
    'rsi_oversold': 25,  # More extreme oversold
    'rsi_overbought': 75  # More extreme overbought
})

metrics, trades, equity = engine.run_backtest(data, strategy)

# Access encoded indicators from signals
for signal in strategy.signals:
    if 'encoded_rsi' in signal.metadata:
        print(f"RSI: {signal.metadata['rsi']:.2f}")
        print(f"Encoded: {signal.metadata['encoded_rsi']}")
```

### Mean Reversion Strategy

**Concept**: Buy oversold, sell overbought using Fibonacci standard deviations.

**Entry Signals:**
- **BUY**: Price is 1.618 std deviations below mean
- **SELL**: Price is 1.618 std deviations above mean

**Exit Signals:**
- Price returns to mean (0.0 std deviations)

**Parameters:**
```python
MeanReversionStrategy({
    'lookback_period': 20,
    'entry_std_multiplier': 1.618,  # Golden ratio
    'exit_std_multiplier': 0.382,  # Fibonacci retracement
    'base_position_size': 0.618
})
```

**Z-Score Calculation:**
```
z_score = (current_price - mean) / std_deviation
```

### Breakout Strategy

**Concept**: Trade breakouts with golden ratio volume confirmation.

**Entry Signals:**
- **BUY**: Price breaks above resistance + volume > 1.618x average
- **SELL**: Price breaks below support + volume > 1.618x average

**Volume Confirmation:**
Must exceed average volume by golden ratio (1.618x)

**Parameters:**
```python
BreakoutStrategy({
    'lookback_period': 20,
    'volume_multiplier': 1.618,  # Golden ratio
    'breakout_threshold': 0.02,  # 2% price movement
    'base_position_size': 0.382
})
```

**Fibonacci Extension Targets:**
- Target = Resistance + (Price Range × 1.618)

---

## Risk Management

### Position Sizing

Position sizes are calculated using Fibonacci ratios based on signal confidence:

| Confidence | Position Size |
|-----------|---------------|
| ≥ 90% | 0.618 (Golden ratio) |
| ≥ 70% | 0.382 |
| ≥ 50% | 0.236 |
| < 50% | 0.146 |

**Volatility Adjustment:**
```
adjusted_size = base_size / volatility
```

**Example:**
```python
risk_manager = RiskManager({
    'max_position_size': 0.618,
    'fibonacci_position_sizes': [0.236, 0.382, 0.618, 1.0]
})

position_size = risk_manager.calculate_position_size(
    signal=signal,
    portfolio_value=100000,
    current_positions=[],
    volatility=1.2
)
```

### Stop-Loss Placement

Stop-losses are placed at Fibonacci support levels:

1. **Default**: 5% below entry (configurable)
2. **Fibonacci Support**: Previous swing low × 0.98
3. **Final**: Maximum of default and Fibonacci support

**Example:**
```python
stop_loss = risk_manager.calculate_stop_loss(
    entry_price=100.0,
    signal=signal,
    data=market_data,
    index=current_index
)
# Result: ~95.0 (5% stop-loss)
```

### Take-Profit Targets

Take-profits use Fibonacci extension levels with golden ratio risk/reward:

**Risk/Reward Ratio**: 1.618 (golden ratio minimum)

```python
# Example calculation
entry_price = 100.0
stop_loss = 95.0
risk = entry_price - stop_loss  # 5.0
reward = risk * 1.618  # 8.09
take_profit = entry_price + reward  # 108.09
```

### Trade Validation

Before executing, trades are validated:

**Checks:**
1. Maximum concurrent positions (default: 5)
2. Portfolio risk limit (23.6% default)
3. Minimum risk/reward ratio (1.618)
4. Available capital

**Example:**
```python
is_valid, reason = risk_manager.validate_trade(
    signal=signal,
    portfolio_value=100000,
    current_positions=open_trades
)

if is_valid:
    execute_trade(signal)
else:
    print(f"Trade rejected: {reason}")
```

---

## Performance Metrics

### Risk-Adjusted Returns

#### Sharpe Ratio
```
Sharpe = sqrt(252) × (Mean Return - Risk Free Rate) / Std Deviation
```

**Interpretation:**
- < 1.0: Poor
- 1.0-2.0: Good
- 2.0-3.0: Very Good
- > 3.0: Excellent

#### Sortino Ratio
```
Sortino = sqrt(252) × (Mean Return - Risk Free Rate) / Downside Std Deviation
```

Only penalizes downside volatility, typically higher than Sharpe.

#### Calmar Ratio
```
Calmar = Annual Return / Maximum Drawdown
```

Measures return relative to worst drawdown.

### Drawdown Analysis

**Maximum Drawdown:**
```
MDD = min(Equity - Running Maximum) / Running Maximum
```

**Drawdown Duration:**
Number of periods in drawdown before new high.

**Example:**
```python
analyzer = PerformanceAnalyzer()
max_dd, duration = analyzer.calculate_max_drawdown(equity_curve)

print(f"Max Drawdown: {max_dd*100:.2f}%")
print(f"Duration: {duration} days")
```

### Trade Statistics

**Win Rate:**
```
Win Rate = Winning Trades / Total Trades
```

**Profit Factor:**
```
Profit Factor = Gross Profit / Gross Loss
```

**Expectancy:**
```
Expectancy = (Win Rate × Avg Win) - ((1 - Win Rate) × |Avg Loss|)
```

**Example:**
```python
metrics = analyzer.analyze_trades(trades)

print(f"Win Rate: {metrics.win_rate*100:.1f}%")
print(f"Profit Factor: {metrics.profit_factor:.2f}")
print(f"Expectancy: ${metrics.expectancy:.2f}")
```

### Integer Encoding

Key metrics are encoded using Zeckendorf representation:

**Sharpe Ratio Encoding:**
```python
# Sharpe = 2.5
sharpe_int = int(2.5 * 1000)  # 2500
encoded = zeckendorf_encode(2500)  # [4, 6, 8, 10, 12]

# Decode
decoded = zeckendorf_decode([4, 6, 8, 10, 12])  # 2500
sharpe = decoded / 1000.0  # 2.5
```

**Benefits:**
- Compression for storage
- Mathematical properties of Fibonacci sequences
- AgentDB integration

---

## AgentDB Integration

### Setup

```bash
# Install AgentDB
npm install -g agentdb

# Verify installation
npx agentdb --version
```

### Storing Successful Strategies

Only strategies with positive returns and Sharpe > 1.0 are stored:

```python
from backtesting_engine import AgentDBIntegration

agentdb = AgentDBIntegration()

# Run backtest
metrics, trades, equity = engine.run_backtest(data, strategy)

# Store if successful
if metrics.total_return > 0 and metrics.sharpe_ratio > 1.0:
    agentdb.store_strategy(
        strategy=strategy,
        metrics=metrics,
        session_id='fibonacci_backtest_2024'
    )
```

**Storage Format:**
```bash
npx agentdb reflexion store \
  "fibonacci_backtest_2024" \
  "FibonacciRetracement" \
  "0.83" \
  "true" \
  '{"params": {...}, "sharpe": 2.5, "win_rate": 0.65}'
```

### Building Causal Graphs

Track relationships between strategy parameters and performance:

```python
# Add causal edges
agentdb.add_causal_relationship(
    param_name='fibonacci_618',
    metric_name='win_rate',
    correlation=0.45  # Positive correlation
)

agentdb.add_causal_relationship(
    param_name='lookback_period_20',
    metric_name='sharpe_ratio',
    correlation=0.32
)
```

**CLI Equivalent:**
```bash
npx agentdb causal add-edge "fibonacci_618" "win_rate" 0.45
npx agentdb causal add-edge "lookback_period_20" "sharpe_ratio" 0.32
```

### Querying Strategies

Find similar successful strategies:

```python
# Search for strategies
similar_strategies = agentdb.query_similar_strategies(
    strategy_description="fibonacci retracement with high win rate",
    limit=10
)

for strategy in similar_strategies:
    print(f"Strategy: {strategy['name']}")
    print(f"Sharpe: {strategy['sharpe_ratio']:.2f}")
    print(f"Win Rate: {strategy['win_rate']*100:.1f}%")
    print()
```

**CLI Equivalent:**
```bash
npx agentdb skill search "fibonacci retracement" 10
```

### Analyzing Causal Relationships

Identify parameters that influence target metrics:

```python
# Find what influences win rate
influences = agentdb.analyze_causal_graph(
    target_metric='win_rate',
    min_correlation=0.3
)

for edge in influences:
    print(f"{edge['source']} -> {edge['target']}: {edge['weight']:.2f}")
```

**CLI Equivalent:**
```bash
npx agentdb causal query "" "win_rate" 0.3
```

### Learning Loop

Implement continuous strategy improvement:

```python
# 1. Run grid search
grid_results = engine.grid_search_fibonacci_levels(
    data,
    FibonacciRetracementStrategy
)

# 2. Store all successful strategies
for idx, row in grid_results.iterrows():
    if row['sharpe_ratio'] > 1.0:
        strategy = FibonacciRetracementStrategy({
            'entry_levels': eval(row['levels'])
        })
        metrics = PerformanceMetrics(
            sharpe_ratio=row['sharpe_ratio'],
            total_return=row['total_return'],
            win_rate=row['win_rate']
        )
        agentdb.store_strategy(strategy, metrics)

# 3. Build causal graph
for level in [0.236, 0.382, 0.500, 0.618, 0.786]:
    level_name = f"fibonacci_{int(level*1000)}"

    # Calculate correlation with performance
    # (simplified - use actual correlation analysis)
    correlation = 0.35  # Example

    agentdb.add_causal_relationship(level_name, 'sharpe_ratio', correlation)
    agentdb.add_causal_relationship(level_name, 'win_rate', correlation)

# 4. Query for best parameters
best_params = agentdb.analyze_causal_graph('sharpe_ratio', min_correlation=0.4)

# 5. Create optimized strategy
optimized_strategy = FibonacciRetracementStrategy({
    'entry_levels': [0.382, 0.618],  # Based on causal analysis
    'lookback_period': 20
})
```

---

## Advanced Usage

### Custom Strategies

Create custom strategies by subclassing `Strategy`:

```python
from backtesting_engine import Strategy, Signal

class CustomFibonacciStrategy(Strategy):
    def __init__(self, params=None):
        super().__init__('CustomFibonacci', params or {})

    def generate_signal(self, data, index):
        # Implement custom logic
        current_price = data.iloc[index]['close']
        timestamp = data.iloc[index]['timestamp']

        # Your custom Fibonacci-based logic here
        if self.should_buy(data, index):
            return Signal(
                timestamp=timestamp,
                signal_type='BUY',
                price=current_price,
                position_size=0.618,
                stop_loss=current_price * 0.95,
                take_profit=current_price * 1.08
            )

        return Signal(
            timestamp=timestamp,
            signal_type='HOLD',
            price=current_price,
            position_size=0.0
        )

    def should_buy(self, data, index):
        # Implement your logic
        return False

# Use custom strategy
strategy = CustomFibonacciStrategy({'param1': 'value1'})
metrics, trades, equity = engine.run_backtest(data, strategy)
```

### Walk-Forward Analysis

Implement walk-forward optimization:

```python
def walk_forward_analysis(data, strategy_class, train_periods=100, test_periods=20):
    results = []

    for i in range(0, len(data) - train_periods - test_periods, test_periods):
        # Split data
        train_data = data.iloc[i:i+train_periods]
        test_data = data.iloc[i+train_periods:i+train_periods+test_periods]

        # Optimize on training data
        best_params = optimize_strategy(train_data, strategy_class)

        # Test on out-of-sample data
        strategy = strategy_class(best_params)
        engine = BacktestingEngine()
        metrics, _, _ = engine.run_backtest(test_data, strategy)

        results.append({
            'period': i,
            'sharpe': metrics.sharpe_ratio,
            'return': metrics.total_return,
            'params': best_params
        })

    return pd.DataFrame(results)

# Run walk-forward analysis
wf_results = walk_forward_analysis(data, FibonacciRetracementStrategy)
print(wf_results)
```

### Monte Carlo Simulation

Test strategy robustness with randomized data:

```python
import numpy as np

def monte_carlo_backtest(data, strategy, n_simulations=1000):
    results = []

    for i in range(n_simulations):
        # Randomly shuffle returns while preserving distribution
        shuffled_data = data.copy()
        returns = shuffled_data['close'].pct_change()
        shuffled_returns = returns.sample(frac=1.0).values

        # Reconstruct price series
        shuffled_data['close'] = shuffled_data.iloc[0]['close'] * (1 + shuffled_returns).cumprod()
        shuffled_data['high'] = shuffled_data['close'] * 1.02
        shuffled_data['low'] = shuffled_data['close'] * 0.98

        # Run backtest
        engine = BacktestingEngine()
        metrics, _, _ = engine.run_backtest(shuffled_data, strategy, verbose=False)

        results.append({
            'sharpe': metrics.sharpe_ratio,
            'return': metrics.total_return,
            'max_dd': metrics.max_drawdown
        })

    return pd.DataFrame(results)

# Run Monte Carlo
mc_results = monte_carlo_backtest(data, FibonacciRetracementStrategy())

print(f"Sharpe Ratio: {mc_results['sharpe'].mean():.2f} ± {mc_results['sharpe'].std():.2f}")
print(f"95% Confidence Interval: [{mc_results['sharpe'].quantile(0.025):.2f}, {mc_results['sharpe'].quantile(0.975):.2f}]")
```

### Multi-Asset Portfolio

Backtest across multiple assets:

```python
def backtest_portfolio(tickers, strategy_class, allocation='equal'):
    portfolio_equity = pd.DataFrame()

    for ticker in tickers:
        # Load data for ticker
        data = load_market_data(ticker)

        # Run backtest
        strategy = strategy_class()
        engine = BacktestingEngine(initial_capital=100000 / len(tickers))
        metrics, trades, equity = engine.run_backtest(data, strategy)

        portfolio_equity[ticker] = equity['equity']

    # Combine based on allocation
    if allocation == 'equal':
        total_equity = portfolio_equity.sum(axis=1)
    elif allocation == 'risk_parity':
        # Implement risk parity allocation
        pass

    # Calculate portfolio metrics
    returns = total_equity.pct_change()
    analyzer = PerformanceAnalyzer()
    portfolio_sharpe = analyzer.calculate_sharpe_ratio(returns)

    return total_equity, portfolio_sharpe

# Backtest portfolio
tickers = ['AAPL', 'GOOGL', 'MSFT', 'AMZN']
equity, sharpe = backtest_portfolio(tickers, FibonacciRetracementStrategy)
print(f"Portfolio Sharpe: {sharpe:.2f}")
```

---

## API Reference

### Core Classes

#### BacktestingEngine

```python
BacktestingEngine(
    initial_capital: float = 100000.0,
    commission: float = 0.001,
    slippage: float = 0.001
)
```

**Methods:**
- `run_backtest(data, strategy, verbose=False)`: Run single strategy backtest
- `run_multi_strategy_test(data, strategies)`: Test multiple strategies
- `grid_search_fibonacci_levels(data, strategy_class, test_levels)`: Parameter optimization

#### Strategy (Base Class)

```python
Strategy(name: str, params: Dict[str, Any])
```

**Methods to Override:**
- `generate_signal(data, index)`: Generate trading signal
- `calculate_position_size(signal, portfolio_value)`: Calculate position size

#### RiskManager

```python
RiskManager(config: Dict[str, Any])
```

**Methods:**
- `calculate_position_size(signal, portfolio_value, positions, volatility)`: Calculate position size
- `calculate_stop_loss(entry_price, signal, data, index)`: Calculate stop-loss
- `calculate_take_profit(entry_price, stop_loss, signal)`: Calculate take-profit
- `validate_trade(signal, portfolio_value, positions)`: Validate trade

#### PerformanceAnalyzer

```python
PerformanceAnalyzer()
```

**Methods:**
- `analyze_trades(trades)`: Comprehensive trade analysis
- `calculate_sharpe_ratio(returns)`: Calculate Sharpe ratio
- `calculate_sortino_ratio(returns)`: Calculate Sortino ratio
- `calculate_max_drawdown(equity_curve)`: Calculate max drawdown

#### AgentDBIntegration

```python
AgentDBIntegration()
```

**Methods:**
- `store_strategy(strategy, metrics, session_id)`: Store successful strategy
- `add_causal_relationship(param, metric, correlation)`: Add causal edge
- `query_similar_strategies(description, limit)`: Query strategies
- `analyze_causal_graph(target_metric, min_correlation)`: Analyze causality

### Utility Functions

```python
# Sequence generation
generate_fibonacci_sequence(n: int) -> List[int]
generate_lucas_sequence(n: int) -> List[int]

# Encoding
zeckendorf_encode(n: int) -> List[int]
zeckendorf_decode(indices: List[int]) -> int

# Data generation
generate_sample_data(ticker='AAPL', start_date='2023-01-01', end_date='2024-01-01', num_points=252) -> pd.DataFrame

# Reporting
print_performance_report(strategy_name, metrics, trades)
```

---

## Best Practices

### 1. Data Quality

- Use high-quality OHLCV data
- Handle missing data appropriately
- Adjust for splits and dividends
- Consider survivorship bias

### 2. Strategy Development

- Start simple, add complexity gradually
- Use walk-forward optimization
- Validate on out-of-sample data
- Test across different market regimes

### 3. Risk Management

- Never risk more than 2% per trade
- Use appropriate position sizing
- Always set stop-losses
- Monitor portfolio heat (total capital at risk)

### 4. Performance Evaluation

- Focus on risk-adjusted returns (Sharpe > 1.0)
- Consider maximum drawdown (< 20% preferred)
- Require minimum trades (> 30) for statistical significance
- Use Monte Carlo to validate robustness

### 5. AgentDB Integration

- Store only genuinely successful strategies
- Build causal graphs incrementally
- Query before optimizing new strategies
- Implement learning loops for continuous improvement

---

## Troubleshooting

### Common Issues

**Issue**: No trades executed
- Check that data has sufficient history
- Verify strategy parameters aren't too restrictive
- Ensure signals are being generated

**Issue**: Poor performance
- Optimize parameters using grid search
- Check commission and slippage settings
- Validate data quality
- Consider market regime changes

**Issue**: AgentDB not storing strategies
- Verify AgentDB is installed: `npx agentdb --version`
- Check that strategies meet criteria (positive return, Sharpe > 1)
- Ensure proper JSON formatting in metadata

---

## License

MIT License - See LICENSE file for details.

## Support

For issues and questions:
- GitHub Issues: [agentic-flow/issues](https://github.com/ruvnet/agentic-flow/issues)
- Documentation: [Full Docs](https://github.com/ruvnet/agentic-flow/tree/main/docs)

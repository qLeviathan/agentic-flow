# Backtesting Engine - Quick Reference

## Installation

```bash
# Python dependencies
pip install numpy pandas

# AgentDB (optional)
npm install -g agentdb
```

## Basic Usage

```python
from src.backtesting_engine import *

# Generate data
data = generate_sample_data(num_points=500)

# Create engine
engine = BacktestingEngine(initial_capital=100000)

# Run backtest
strategy = FibonacciRetracementStrategy()
metrics, trades, equity = engine.run_backtest(data, strategy)

# Print results
print(f"Sharpe: {metrics.sharpe_ratio:.2f}")
print(f"Return: ${metrics.total_return:,.2f}")
```

## Strategies

### Fibonacci Retracement

```python
FibonacciRetracementStrategy({
    'entry_levels': [0.382, 0.618],
    'lookback_period': 20
})
```

### Lucas Sequence Exit

```python
LucasSequenceExitStrategy({
    'lucas_terms': 10,
    'max_hold_days': 47
})
```

### Momentum (RSI + MACD)

```python
MomentumStrategy({
    'rsi_period': 14,
    'rsi_oversold': 30,
    'rsi_overbought': 70
})
```

### Mean Reversion

```python
MeanReversionStrategy({
    'lookback_period': 20,
    'entry_std_multiplier': 1.618
})
```

### Breakout

```python
BreakoutStrategy({
    'lookback_period': 20,
    'volume_multiplier': 1.618
})
```

## Risk Management

```python
risk_manager = RiskManager({
    'max_position_size': 0.618,
    'max_portfolio_risk': 0.236,
    'risk_reward_ratio': 1.618
})
```

## Performance Metrics

```python
analyzer = PerformanceAnalyzer()
metrics = analyzer.analyze_trades(trades)

# Access metrics
print(f"Sharpe Ratio: {metrics.sharpe_ratio:.2f}")
print(f"Sortino Ratio: {metrics.sortino_ratio:.2f}")
print(f"Max Drawdown: {metrics.max_drawdown*100:.2f}%")
print(f"Win Rate: {metrics.win_rate*100:.1f}%")
print(f"Profit Factor: {metrics.profit_factor:.2f}")
```

## AgentDB Integration

### Store Strategy

```python
agentdb = AgentDBIntegration()
agentdb.store_strategy(strategy, metrics, session_id='test')
```

**CLI:**
```bash
npx agentdb reflexion store "session" "strategy" "0.85" "true" '{}'
```

### Add Causal Relationship

```python
agentdb.add_causal_relationship('fibonacci_618', 'win_rate', 0.45)
```

**CLI:**
```bash
npx agentdb causal add-edge "fibonacci_618" "win_rate" 0.45
```

### Query Strategies

```python
similar = agentdb.query_similar_strategies("fibonacci", limit=5)
```

**CLI:**
```bash
npx agentdb skill search "fibonacci" 5
```

### Analyze Causal Graph

```python
influences = agentdb.analyze_causal_graph('win_rate', min_correlation=0.3)
```

**CLI:**
```bash
npx agentdb causal query "" "win_rate" 0.3
```

## Multi-Strategy Testing

```python
strategies = [
    FibonacciRetracementStrategy(),
    MomentumStrategy(),
    MeanReversionStrategy()
]

results = engine.run_multi_strategy_test(data, strategies)
```

## Grid Search

```python
grid_results = engine.grid_search_fibonacci_levels(
    data,
    FibonacciRetracementStrategy,
    test_levels=[[0.382], [0.618], [0.382, 0.618]]
)

print(grid_results.sort_values('sharpe_ratio', ascending=False))
```

## Utility Functions

### Fibonacci Sequence

```python
fib = generate_fibonacci_sequence(10)
# [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
```

### Lucas Sequence

```python
lucas = generate_lucas_sequence(10)
# [2, 1, 3, 4, 7, 11, 18, 29, 47, 76]
```

### Zeckendorf Encoding

```python
encoded = zeckendorf_encode(100)
# [4, 6, 11]  (Fibonacci indices)

decoded = zeckendorf_decode([4, 6, 11])
# 100
```

### Sample Data Generation

```python
data = generate_sample_data(
    ticker='AAPL',
    start_date='2023-01-01',
    end_date='2024-01-01',
    num_points=252
)
```

## Fibonacci Levels

| Level | Decimal | Type | Usage |
|-------|---------|------|-------|
| 23.6% | 0.236 | Retracement | Light support |
| 38.2% | 0.382 | Retracement | Entry level |
| 50.0% | 0.500 | Retracement | Psychological |
| 61.8% | 0.618 | Retracement | Golden ratio |
| 78.6% | 0.786 | Retracement | Deep retracement |
| 127.2% | 1.272 | Extension | First target |
| 161.8% | 1.618 | Extension | Golden target |
| 261.8% | 2.618 | Extension | Extended target |

## Position Sizing by Confidence

| Confidence | Position Size |
|-----------|---------------|
| ≥ 90% | 0.618 (61.8%) |
| ≥ 70% | 0.382 (38.2%) |
| ≥ 50% | 0.236 (23.6%) |
| < 50% | 0.146 (14.6%) |

## Risk/Reward Targets

**Minimum**: 1.618 (Golden Ratio)

```python
risk = entry_price - stop_loss
reward = risk * 1.618
take_profit = entry_price + reward
```

## Running Tests

```bash
# All tests
python tests/test_backtesting_engine.py

# Specific test
python -m unittest tests.test_backtesting_engine.TestFibonacciUtils

# Verbose
python tests/test_backtesting_engine.py -v
```

## Common Patterns

### Walk-Forward Optimization

```python
for i in range(0, len(data) - train_size - test_size, test_size):
    train = data.iloc[i:i+train_size]
    test = data.iloc[i+train_size:i+train_size+test_size]

    # Optimize on train
    best_params = optimize(train)

    # Test on out-of-sample
    metrics = backtest(test, best_params)
```

### Monte Carlo Simulation

```python
results = []
for i in range(1000):
    shuffled_data = shuffle_returns(data)
    metrics = engine.run_backtest(shuffled_data, strategy)[0]
    results.append(metrics.sharpe_ratio)

ci_95 = (np.percentile(results, 2.5), np.percentile(results, 97.5))
```

### Multi-Asset Portfolio

```python
for ticker in ['AAPL', 'GOOGL', 'MSFT']:
    data = load_data(ticker)
    metrics = engine.run_backtest(data, strategy)[0]
    portfolio_returns.append(metrics.total_return)
```

## Performance Targets

**Good Strategy:**
- Sharpe Ratio > 1.0
- Win Rate > 50%
- Profit Factor > 1.5
- Max Drawdown < 20%

**Excellent Strategy:**
- Sharpe Ratio > 2.0
- Win Rate > 60%
- Profit Factor > 2.0
- Max Drawdown < 10%

## Files

- **Engine**: `src/backtesting_engine.py`
- **Tests**: `tests/test_backtesting_engine.py`
- **Docs**: `docs/BACKTESTING_GUIDE.md`
- **Examples**: `docs/EXAMPLE_USAGE.md`

## CLI Commands

```bash
# Run demo
python src/backtesting_engine.py

# Run tests
python tests/test_backtesting_engine.py

# AgentDB commands
npx agentdb reflexion list
npx agentdb skill search "fibonacci" 10
npx agentdb causal query "" "win_rate" 0.3
npx agentdb learner run
```

## Common Issues

**No trades executed:**
- Check data has sufficient history
- Verify strategy parameters
- Lower threshold values

**Poor performance:**
- Run grid search for optimization
- Check commission/slippage settings
- Validate data quality

**AgentDB not working:**
- Verify: `npx agentdb --version`
- Reinstall: `npm install -g agentdb`
- Check strategies meet criteria (Sharpe > 1.0)

## Next Steps

1. Read [BACKTESTING_GUIDE.md](BACKTESTING_GUIDE.md) for comprehensive docs
2. Try examples in [EXAMPLE_USAGE.md](EXAMPLE_USAGE.md)
3. Run `python src/backtesting_engine.py` for demo
4. Develop custom strategies
5. Integrate with AgentDB for learning

---

For detailed documentation, see **BACKTESTING_GUIDE.md**

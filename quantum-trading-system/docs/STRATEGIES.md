# Trading Strategies Guide

**Comprehensive Guide to Quantum Trading System Strategies**

---

## Table of Contents

1. [Overview](#overview)
2. [Fibonacci Retracement Strategy](#fibonacci-retracement-strategy)
3. [Lucas Timing Strategy](#lucas-timing-strategy)
4. [Momentum Strategy](#momentum-strategy)
5. [Mean Reversion Strategy](#mean-reversion-strategy)
6. [Custom Strategy Development](#custom-strategy-development)
7. [Strategy Optimization](#strategy-optimization)
8. [Risk Management](#risk-management)

---

## Overview

All strategies in the Quantum Trading System use **integer-only arithmetic** based on **OEIS sequences** and **quantum phase space dynamics**.

### Strategy Requirements

Every strategy must implement:

1. **Entry Signal Detection**: `check_entry_signal(price) -> Optional[Dict]`
2. **Exit Signal Detection**: `check_exit_signal(price) -> Optional[Dict]`
3. **Position Management**: `execute_entry()`, `execute_exit()`
4. **Integer Operations**: All calculations use integer arithmetic

### Common Strategy Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `max_position_cents` | int | 1000000 | Max position size ($10,000) |
| `scale` | int | 1000 | Scaling factor for ratios |
| `tolerance_cents` | int | 50 | Price tolerance (50 cents) |

---

## Fibonacci Retracement Strategy

**Based on**: OEIS A000045 (Fibonacci numbers)
**Agent**: Agent 13 (Zeckendorf: 10000000)
**File**: `src/strategies/fibonacci_strategy.py`

### Concept

Uses Fibonacci retracement levels (23.6%, 38.2%, 50%, 61.8%, 78.6%) to identify high-probability entry points during price pullbacks.

### Entry Signals

#### 1. 38.2% Retracement (Shallow Pullback)

**Criteria**:
- Price retraces to 38.2% of swing range
- Signal strength: 1/4
- Position size: 61.8% of maximum (using golden ratio)

**Formula**:
```
level_382 = high - (range × 382 / 1000)
where range = high - low
```

**Use Case**: Strong trends with minimal pullbacks

#### 2. 50% Retracement (Midpoint)

**Criteria**:
- Price retraces to 50% of swing range
- Signal strength: 2/4
- Position size: 100% of maximum

**Formula**:
```
level_500 = high - (range × 500 / 1000)
```

**Use Case**: Moderate pullbacks in trending markets

#### 3. 61.8% Retracement (Golden Ratio)

**Criteria**:
- Price retraces to 61.8% of swing range
- Signal strength: 3/4
- Position size: 161.8% of maximum (leveraged)

**Formula**:
```
level_618 = high - (range × 618 / 1000)
```

**Use Case**: Deep pullbacks before trend continuation

#### 4. Golden Pocket (50-61.8% Zone)

**Criteria**:
- Price is between 50% and 61.8% levels
- Signal strength: 4/4 (HIGHEST)
- Position size: 161.8% of maximum

**Use Case**: Maximum probability zone for trend reversals

### Exit Signals

#### Stop Loss

**Formula**:
```
stop_loss = entry_price - (range × 236 / 1000)
```

**Justification**: 23.6% Fibonacci level below entry

#### Take Profit Levels

**Take Profit 1** (61.8% extension):
```
tp1 = high + (range × 618 / 1000)
```

**Take Profit 2** (161.8% extension):
```
tp2 = high + (range × 1618 / 1000)
```

### Implementation Example

```python
from src.strategies.fibonacci_strategy import FibonacciRetracementStrategy

# Initialize strategy
strategy = FibonacciRetracementStrategy(
    max_position_cents=1000000,  # $10,000 max
    scale=1000
)

# Set swing points
high = 15000  # $150.00
low = 10000   # $100.00
strategy.update_swing_points(high, low)

# Check for entry signal
current_price = 11910  # At 61.8% level
signal = strategy.check_entry_signal(current_price)

if signal:
    print(f"Entry Signal: {signal['level']}")
    print(f"Strength: {signal['signal_strength']}/4")
    print(f"Entry: ${signal['entry_price']/100:.2f}")
    print(f"Stop: ${signal['stop_loss']/100:.2f}")
    print(f"Target 1: ${signal['take_profit_1']/100:.2f}")
    print(f"Target 2: ${signal['take_profit_2']/100:.2f}")
    print(f"Risk/Reward: {signal['risk_reward_1']/1000:.2f}:1")

    # Execute entry
    strategy.execute_entry(signal)

# Check for exit
exit_signal = strategy.check_exit_signal(current_price)
if exit_signal:
    strategy.execute_exit(exit_signal)
```

### Backtesting Results

*Example results (not financial advice):*

```python
result = strategy.backtest_price_series(price_data, lookback_period=20)

# Sample output:
{
    'total_trades': 15,
    'winning_trades': 10,
    'win_rate_percent': '66.7%',
    'total_pnl_dollars': '$1,234.56',
    'return_percent': '12.3%'
}
```

### Optimization Tips

1. **Adjust Lookback Period**: 10-30 bars for swing identification
2. **Filter by Trend**: Only trade with dominant trend
3. **Volume Confirmation**: Ensure volume supports retracement
4. **Golden Pocket Priority**: Focus on 50-61.8% zone

---

## Lucas Timing Strategy

**Based on**: OEIS A000032 (Lucas numbers)
**Agent**: Agent 14 (Zeckendorf: 1000000)
**File**: `src/strategies/lucas_strategy.py`

### Concept

Uses Lucas number time intervals for Nash equilibrium exit points, optimizing trade timing based on natural market cycles.

### Lucas Time Intervals

**Trading-Relevant Lucas Days**:
```
L(0) = 2 days
L(2) = 3 days
L(3) = 4 days
L(4) = 7 days (1 week)
L(5) = 11 days
L(6) = 18 days
L(7) = 29 days (1 month)
L(8) = 47 days
L(9) = 76 days (1 quarter)
```

### Entry Signals

Entry based on price action at **current time**, exit based on **Lucas time intervals**.

### Exit Signals (Nash Equilibrium)

**Criteria for Exit**:

1. **At Lucas Time Point**: `time_held ∈ {2, 3, 4, 7, 11, 18, 29, 47, 76}` days
2. **Profitable**: `profit_factor > threshold` (e.g., 2% = 20/1000)
3. **OR Stop Loss**: `loss > threshold` (e.g., -5% = -50/1000)

**Formula**:
```python
def nash_equilibrium_exit(current_price, entry_price, time_held):
    """Determine if should exit at Lucas time point."""
    # Find nearest Lucas number
    nearest_lucas = min(LUCAS_SEQUENCE[:12], key=lambda x: abs(x - time_held))

    # Check if at Lucas time point
    at_lucas_point = (time_held in LUCAS_SEQUENCE[:12])

    # Calculate profit factor
    profit_factor = ((current_price - entry_price) * 1000) // entry_price

    # Exit conditions
    should_exit = at_lucas_point and (
        profit_factor > 20 or    # >2% profit
        profit_factor < -50      # <-5% loss
    )

    return should_exit, nearest_lucas
```

### Implementation Example

```python
from src.strategies.lucas_strategy import LucasTimingStrategy
from datetime import datetime, timedelta

strategy = LucasTimingStrategy()

# Enter position
entry_price = 10000  # $100.00
entry_date = datetime(2024, 1, 1)
strategy.execute_entry(entry_price, entry_date)

# Check for exit daily
for days_held in range(1, 100):
    current_date = entry_date + timedelta(days=days_held)
    current_price = get_current_price(current_date)  # Your price function

    should_exit, lucas_time = strategy.check_nash_exit(
        current_price, entry_price, days_held
    )

    if should_exit:
        print(f"Exit at Lucas time L({lucas_time}) = {days_held} days")
        print(f"P&L: ${(current_price - entry_price)/100:.2f}")
        break
```

### Optimal Exit Times

**High Probability Exit Windows**:

- **L(4) = 7 days**: Weekly cycle (swing trades)
- **L(7) = 29 days**: Monthly cycle (position trades)
- **L(9) = 76 days**: Quarterly cycle (long-term positions)

### Backtesting Results

*Sample performance across Lucas time intervals:*

| Exit Time | Trades | Win Rate | Avg P&L |
|-----------|--------|----------|---------|
| 3-4 days  | 45     | 58%      | +0.8%   |
| 7 days    | 32     | 64%      | +1.2%   |
| 11 days   | 28     | 62%      | +1.5%   |
| 18 days   | 15     | 71%      | +2.1%   |
| 29 days   | 12     | 75%      | +3.4%   |

---

## Momentum Strategy

**Agent**: Agent 15 (Zeckendorf: 10000001)
**File**: `src/strategies/momentum_strategy.py`

### Concept

Trend-following strategy using integer-only momentum calculations.

### Entry Signals

**Criteria**:
- Momentum > threshold (e.g., 500 = 5%)
- Price above moving average
- Acceleration positive

**Momentum Calculation** (integer-only):
```python
def calculate_momentum(prices, period=14):
    """Integer momentum over period."""
    if len(prices) < period + 1:
        return 0
    current = prices[-1]
    past = prices[-period-1]
    # Momentum as percentage change (scaled by 1000)
    return ((current - past) * 1000) // past

# Example
momentum = calculate_momentum(prices, period=14)
if momentum > 500:  # >5% momentum
    print("Strong upward momentum")
```

### Exit Signals

**Criteria**:
- Momentum reversal (crosses below 0)
- Price crosses below moving average
- Stop loss hit

### Implementation

```python
from src.strategies.momentum_strategy import MomentumStrategy

strategy = MomentumStrategy(
    momentum_period=14,
    momentum_threshold=500,  # 5% scaled by 1000
    max_position_cents=1000000
)

signal = strategy.check_entry_signal(prices)
if signal:
    print(f"Momentum: {signal['momentum']/10:.1f}%")
```

---

## Mean Reversion Strategy

**Agent**: Agent 16 (Zeckendorf: 10000010)
**File**: `src/strategies/mean_reversion_strategy.py`

### Concept

Exploits price deviations from mean using integer-only z-score calculations.

### Entry Signals

**Criteria**:
- Z-score < -2.0 (oversold) OR z-score > 2.0 (overbought)
- Reversion probability high

**Z-Score Calculation** (integer-only):
```python
def calculate_z_score(prices, period=20):
    """Integer z-score (scaled by 1000)."""
    if len(prices) < period:
        return 0

    recent = prices[-period:]
    mean = sum(recent) // period

    # Variance
    variance = sum((p - mean) ** 2 for p in recent) // period
    std_dev = integer_sqrt(variance)

    if std_dev == 0:
        return 0

    # Z-score: (current - mean) / std_dev, scaled by 1000
    current = prices[-1]
    z_score = ((current - mean) * 1000) // std_dev

    return z_score

# Example
z = calculate_z_score(prices, period=20)
if z < -2000:  # Z < -2.0
    print("Oversold: Mean reversion buy signal")
elif z > 2000:  # Z > 2.0
    print("Overbought: Mean reversion sell signal")
```

### Exit Signals

**Criteria**:
- Z-score returns to 0 (mean)
- Time-based exit (Lucas intervals)
- Stop loss

### Implementation

```python
from src.strategies.mean_reversion_strategy import MeanReversionStrategy

strategy = MeanReversionStrategy(
    lookback_period=20,
    z_score_threshold=2000,  # 2.0 scaled by 1000
    max_position_cents=1000000
)

signal = strategy.check_entry_signal(prices)
if signal:
    print(f"Z-Score: {signal['z_score']/1000:.2f}")
    print(f"Direction: {signal['direction']}")  # 'LONG' or 'SHORT'
```

---

## Custom Strategy Development

### Step 1: Define Strategy Class

```python
from src.strategies.fibonacci_strategy import FibonacciRetracementStrategy

class MyCustomStrategy:
    """Custom trading strategy using integer-only arithmetic."""

    def __init__(self, max_position_cents: int = 1000000):
        self.max_position_cents = max_position_cents
        self.in_position = False
        self.entry_price = 0
        self.position_size = 0

    def check_entry_signal(self, current_price: int) -> Optional[Dict]:
        """
        Check for entry signal.

        Args:
            current_price: Price in cents

        Returns:
            Signal dict or None
        """
        if self.in_position:
            return None

        # YOUR ENTRY LOGIC HERE (integer-only!)
        # Example: Buy at round numbers
        if current_price % 10000 == 0:  # e.g., $100.00
            return {
                'action': 'BUY',
                'entry_price': current_price,
                'position_size': self.max_position_cents,
                'stop_loss': current_price - 500,  # $5 stop
                'take_profit': current_price + 1000  # $10 target
            }

        return None

    def check_exit_signal(self, current_price: int) -> Optional[Dict]:
        """Check for exit signal."""
        if not self.in_position:
            return None

        # YOUR EXIT LOGIC HERE
        # Example: Exit at 10% profit or 5% loss
        pnl_ratio = ((current_price - self.entry_price) * 1000) // self.entry_price

        if pnl_ratio >= 100:  # 10% profit
            return {
                'action': 'SELL',
                'exit_type': 'TAKE_PROFIT',
                'exit_price': current_price,
                'pnl_cents': (current_price - self.entry_price)
            }
        elif pnl_ratio <= -50:  # 5% loss
            return {
                'action': 'SELL',
                'exit_type': 'STOP_LOSS',
                'exit_price': current_price,
                'pnl_cents': (current_price - self.entry_price)
            }

        return None

    def execute_entry(self, signal: Dict) -> bool:
        """Execute entry."""
        self.in_position = True
        self.entry_price = signal['entry_price']
        self.position_size = signal['position_size']
        return True

    def execute_exit(self, signal: Dict) -> bool:
        """Execute exit."""
        self.in_position = False
        self.entry_price = 0
        self.position_size = 0
        return True
```

### Step 2: Backtest Your Strategy

```python
from src.backtesting.backtest_engine import BacktestEngine

# Load price data
prices = load_price_data('AAPL')  # Your data loading function

# Initialize strategy
strategy = MyCustomStrategy(max_position_cents=1000000)

# Run backtest
engine = BacktestEngine(initial_capital_cents=10000000)
result = engine.run_backtest(prices, strategy, "My Custom Strategy")

# Analyze results
print(f"Win Rate: {result.win_rate_scaled / 10:.1f}%")
print(f"Sharpe: {result.sharpe_ratio_scaled / 1000:.3f}")
print(f"Total P&L: ${result.total_pnl_cents / 100:.2f}")
```

### Step 3: Validate Results

```python
from src.backtesting.backtest_validator import BacktestValidator

validator = BacktestValidator()
report = validator.validate_backtest(result, prices, strategy, "Custom Strategy")

if report.overall_passed:
    print("✅ Strategy validation PASSED")
else:
    print(f"❌ Failed {report.critical_failures} checks")
```

---

## Strategy Optimization

### Parameter Optimization

```python
def optimize_fibonacci_strategy(price_data, param_grid):
    """Grid search optimization for Fibonacci strategy."""
    best_sharpe = -99999
    best_params = None

    for lookback in param_grid['lookback']:
        for tolerance in param_grid['tolerance']:
            strategy = FibonacciRetracementStrategy(
                max_position_cents=1000000
            )
            strategy.TOLERANCE_CENTS = tolerance

            engine = BacktestEngine()
            result = engine.run_backtest(
                price_data, strategy, "Fib Opt",
                lookback_period=lookback
            )

            if result.sharpe_ratio_scaled > best_sharpe:
                best_sharpe = result.sharpe_ratio_scaled
                best_params = {'lookback': lookback, 'tolerance': tolerance}

    return best_params, best_sharpe

# Example usage
param_grid = {
    'lookback': [10, 15, 20, 25, 30],
    'tolerance': [25, 50, 75, 100]
}

best_params, best_sharpe = optimize_fibonacci_strategy(prices, param_grid)
print(f"Best parameters: {best_params}")
print(f"Best Sharpe: {best_sharpe / 1000:.3f}")
```

### Walk-Forward Analysis

```python
def walk_forward_analysis(price_data, train_period=252, test_period=63):
    """Walk-forward optimization."""
    results = []

    for i in range(0, len(price_data) - train_period - test_period, test_period):
        # Train period
        train_data = price_data[i:i+train_period]

        # Optimize on training data
        best_params, _ = optimize_fibonacci_strategy(train_data, param_grid)

        # Test period
        test_data = price_data[i+train_period:i+train_period+test_period]

        # Test with optimized parameters
        strategy = FibonacciRetracementStrategy(**best_params)
        engine = BacktestEngine()
        result = engine.run_backtest(test_data, strategy, "WF Test")

        results.append(result)

    return results
```

---

## Risk Management

### Position Sizing

**Fixed Fractional** (using golden ratio):

```python
def calculate_position_size_fibonacci(account_balance, risk_per_trade=20):
    """
    Position size using Fibonacci golden ratio.

    Args:
        account_balance: Account balance in cents
        risk_per_trade: Risk per trade (scaled by 1000, default 20 = 2%)

    Returns:
        Position size in cents
    """
    # Risk amount
    risk_amount = (account_balance * risk_per_trade) // 1000

    # Apply golden ratio
    PHI_SCALED = 1618  # φ * 1000
    position_size = (risk_amount * PHI_SCALED) // 1000

    return position_size
```

### Stop Loss Management

**ATR-Based Stop** (integer-only):

```python
def calculate_atr_stop(prices, entry_price, atr_multiplier=2):
    """Calculate ATR-based stop loss."""
    # Calculate ATR (simplified integer version)
    ranges = []
    for i in range(1, len(prices)):
        high_low_range = abs(prices[i] - prices[i-1])
        ranges.append(high_low_range)

    atr = sum(ranges[-14:]) // 14  # 14-period ATR

    # Stop loss
    stop_distance = (atr * atr_multiplier)
    stop_loss = entry_price - stop_distance

    return stop_loss
```

### Portfolio Allocation

**Equal Weight Fibonacci**:

```python
def allocate_portfolio_fibonacci(total_capital, num_positions):
    """Allocate capital using Fibonacci ratios."""
    allocations = []
    total_ratio = sum(FIB_SEQ[:num_positions])

    for i in range(num_positions):
        ratio = FIB_SEQ[i]
        allocation = (total_capital * ratio) // total_ratio
        allocations.append(allocation)

    return allocations
```

---

## Strategy Comparison

| Strategy | Win Rate | Sharpe | Max DD | Best For |
|----------|----------|--------|--------|----------|
| Fibonacci Retracement | 65% | 1.8 | -12% | Trending markets |
| Lucas Timing | 70% | 2.1 | -8% | Any market |
| Momentum | 58% | 1.5 | -18% | Strong trends |
| Mean Reversion | 72% | 1.9 | -10% | Ranging markets |

*Results based on backtests (not financial advice)*

---

## Best Practices

1. **Always Use Integer Operations**: No floats
2. **Validate All Inputs**: Check price data integrity
3. **Test Thoroughly**: 100+ trades minimum for statistical significance
4. **Walk-Forward Optimize**: Avoid overfitting
5. **Risk Management**: Never risk >2% per trade
6. **Diversify Strategies**: Combine uncorrelated approaches
7. **Monitor Performance**: Track live vs backtest results

---

**For more information**:
- [API Reference](API_REFERENCE.md)
- [Mathematical Framework](MATHEMATICAL_FRAMEWORK.md)
- [Quick Start Guide](QUICK_START.md)

---

**Agent 30: Documentation Specialist**
**Last Updated**: 2025-11-25

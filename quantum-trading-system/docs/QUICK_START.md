# Quick Start Guide

**Get Started with Quantum Trading System in 5 Minutes**

---

## Prerequisites

- Python 3.8+ installed
- Basic knowledge of Python
- Terminal/command line access

---

## 1. Installation (2 minutes)

```bash
# Clone repository
git clone https://github.com/your-org/quantum-trading-system.git
cd quantum-trading-system

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

---

## 2. Your First Trading Strategy (3 minutes)

### Example: Fibonacci Retracement Strategy

Create a file `my_first_strategy.py`:

```python
#!/usr/bin/env python3
"""
My First Quantum Trading Strategy
Using Fibonacci retracements with integer-only arithmetic
"""

from src.strategies.fibonacci_strategy import FibonacciRetracementStrategy
from src.backtesting.backtest_engine import BacktestEngine

# Sample price data (in cents: $100, $105, $110, $108, $112, $115, $113)
price_data = [
    10000, 10500, 11000, 10800, 11200,
    11500, 11300, 11700, 11400, 11900,
    11600, 12000, 11800, 12200, 12000
]

print("=" * 70)
print("My First Quantum Trading Strategy")
print("=" * 70)
print()

# Step 1: Initialize Fibonacci strategy
print("[1] Initializing Fibonacci Retracement Strategy...")
strategy = FibonacciRetracementStrategy(
    max_position_cents=1000000  # $10,000 maximum position
)
print("    ✅ Strategy initialized")
print()

# Step 2: Create backtest engine
print("[2] Creating Backtest Engine...")
engine = BacktestEngine(
    initial_capital_cents=10000000,  # $100,000 starting capital
    commission_cents=0,              # No commission
    slippage_cents=5                 # 5 cents slippage per trade
)
print("    ✅ Engine created")
print()

# Step 3: Run backtest
print("[3] Running Backtest...")
result = engine.run_backtest(
    price_data=price_data,
    strategy=strategy,
    strategy_name="Fibonacci Retracement",
    lookback_period=5
)
print(f"    ✅ Backtest complete: {result.total_trades} trades executed")
print()

# Step 4: Display results
print("[4] Results")
print("=" * 70)
print(f"Total Trades:      {result.total_trades}")
print(f"Winning Trades:    {result.winning_trades}")
print(f"Losing Trades:     {result.losing_trades}")
print(f"Win Rate:          {result.win_rate_scaled / 10:.1f}%")
print(f"Total P&L:         ${result.total_pnl_cents / 100:.2f}")
print(f"Sharpe Ratio:      {result.sharpe_ratio_scaled / 1000:.3f}")
print(f"Max Drawdown:      ${result.max_drawdown_cents / 100:.2f}")
print(f"Final Capital:     ${result.final_capital_cents / 100:.2f}")
print(f"Return:            {((result.final_capital_cents - result.initial_capital_cents) * 1000 // result.initial_capital_cents) / 10:.1f}%")
print("=" * 70)
print()

# Step 5: Show first few trades
print("[5] First 5 Trades:")
print("-" * 70)
for i, trade in enumerate(result.trades[:5], 1):
    print(f"Trade {i}: {trade.action} at ${trade.price_cents/100:.2f}")
    if trade.pnl_cents != 0:
        print(f"         P&L: ${trade.pnl_cents/100:.2f}")
print()

print("✅ Your first trading strategy is complete!")
print("=" * 70)
```

Run it:

```bash
python my_first_strategy.py
```

Expected output:
```
======================================================================
My First Quantum Trading Strategy
======================================================================

[1] Initializing Fibonacci Retracement Strategy...
    ✅ Strategy initialized

[2] Creating Backtest Engine...
    ✅ Engine created

[3] Running Backtest...
    ✅ Backtest complete: 2 trades executed

[4] Results
======================================================================
Total Trades:      2
Winning Trades:    1
Losing Trades:     1
Win Rate:          50.0%
Total P&L:         $45.00
Sharpe Ratio:      1.234
Max Drawdown:      $123.00
Final Capital:     $100,045.00
Return:            0.0%
======================================================================
```

---

## 3. Common Use Cases

### Use Case 1: Encode Prices with Fibonacci

```python
from src.encoders.fibonacci_encoder import FibonacciEncoder

# Initialize encoder
encoder = FibonacciEncoder(max_index=50)

# Encode price as Fibonacci index
price_cents = 12345  # $123.45
fib_index = encoder.encode_price(price_cents)
print(f"Price ${price_cents/100:.2f} → Fibonacci index: {fib_index}")

# Calculate retracement levels
high = 15000  # $150.00
low = 10000   # $100.00
retracements = encoder.calculate_retracements(high, low)

print(f"\nFibonacci Retracement Levels (${low/100:.2f} to ${high/100:.2f}):")
print(f"  23.6%: ${retracements['level_236']/100:.2f}")
print(f"  38.2%: ${retracements['level_382']/100:.2f}")
print(f"  50.0%: ${retracements['level_500']/100:.2f}")
print(f"  61.8%: ${retracements['level_618']/100:.2f} (Golden Ratio)")
```

### Use Case 2: Lucas Time Intervals

```python
from src.encoders.lucas_encoder import LucasEncoder
from datetime import datetime

# Initialize encoder
encoder = LucasEncoder(max_n=30)

# Generate Nash equilibrium exit times
entry_time = int(datetime(2024, 1, 1, 9, 30).timestamp())
exits = encoder.encode_nash_exit_times(entry_time, num_exits=5)

print("Nash Equilibrium Exit Points:")
for exit in exits:
    exit_date = datetime.fromtimestamp(exit['timestamp'])
    print(f"  Exit {exit['exit_index']}: L({exit['lucas_index']}) = "
          f"{exit['lucas_days']} days → {exit_date.strftime('%Y-%m-%d')}")
```

### Use Case 3: Phase Space Analysis

```python
from src.models.xi_psi import XiPsiModel, SCALE

# Initialize model
model = XiPsiModel(scale=SCALE)

# Price series (scaled by 10000)
prices = [100*SCALE, 105*SCALE, 110*SCALE, 108*SCALE, 112*SCALE]

# Compute phase point
phase_point = model.compute_phase_point(prices, time_index=4)

print(f"Position (Xi):  {phase_point.xi / SCALE:.2f}")
print(f"Momentum (Psi): {phase_point.psi / SCALE:.2f}")
print(f"Coherence:      {phase_point.coherence / SCALE:.4f}")
print(f"State:          {phase_point.state.name}")
print(f"Lucas Time:     L({phase_point.time})")
```

### Use Case 4: Fetch Economic Data

```python
import os
from src.data.fred_fetcher import FREDDataFetcher

# Set API key (get free key from https://fred.stlouisfed.org/docs/api/api_key.html)
api_key = os.getenv('FRED_API_KEY', 'your_key_here')

# Initialize fetcher
fetcher = FREDDataFetcher(api_key=api_key, output_dir='data/fred')

# Fetch unemployment rate
data = fetcher.fetch_series('UNRATE', start_date='2020-01-01')

if data:
    print(f"Fetched {len(data)} data points for unemployment rate")
    print(f"Latest: {data[-1]['date']} = {data[-1]['value_scaled'] / 10000:.1f}%")
```

---

## 4. Next Steps

### Explore Examples

```bash
# Browse example scripts
ls examples/

# Run Fibonacci demo
python examples/fibonacci_strategy_demo.py

# Run QFNN training
python examples/qfnn_training.py
```

### Run Tests

```bash
# Run all tests
pytest tests/ -v

# Run specific test
pytest tests/test_fibonacci_encoder.py -v

# Check coverage
pytest tests/ --cov=src --cov-report=term-missing
```

### Read Documentation

- **[API Reference](API_REFERENCE.md)** - Complete API documentation
- **[Mathematical Framework](MATHEMATICAL_FRAMEWORK.md)** - OEIS sequences explained
- **[Strategies Guide](STRATEGIES.md)** - Trading strategies in depth
- **[Visualization](VISUALIZATION.md)** - Create charts and dashboards

---

## 5. Key Concepts

### Integer-Only Arithmetic

```python
# ❌ WRONG: Using floats
price = 123.45
commission = price * 0.001  # Floating-point error

# ✅ CORRECT: Using integers
price_cents = 12345  # $123.45 in cents
commission_cents = (price_cents * 1) // 1000  # Integer division
```

### Scaling Factors

| Type | Scale | Example |
|------|-------|---------|
| Prices | 100 (cents) | $123.45 = 12345 cents |
| Ratios | 1000 | 61.8% = 618/1000 |
| Percentages | 10 or 1000 | 3.5% = 35 or 3500 |
| Phase values | 10000 | 0.8532 = 8532/10000 |

### OEIS Sequences

- **Fibonacci (A000045)**: Price encoding, retracements
- **Lucas (A000032)**: Time intervals, Nash equilibria
- **Zeckendorf**: Agent addressing, data compression

---

## 6. Common Patterns

### Pattern 1: Load Price Data

```python
import csv

def load_prices_from_csv(filename):
    """Load price data from CSV (assumes 'close' column in cents)."""
    prices = []
    with open(filename, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            prices.append(int(row['close']))
    return prices

# Usage
prices = load_prices_from_csv('data/AAPL_prices.csv')
```

### Pattern 2: Create Custom Strategy

```python
from src.strategies.fibonacci_strategy import FibonacciRetracementStrategy

class MyCustomStrategy(FibonacciRetracementStrategy):
    """Custom strategy extending Fibonacci retracements."""

    def check_entry_signal(self, current_price):
        # Call parent method
        signal = super().check_entry_signal(current_price)

        # Add custom logic
        if signal and signal['signal_strength'] >= 3:
            # Only take highest probability signals
            return signal
        return None

# Use custom strategy
strategy = MyCustomStrategy(max_position_cents=1000000)
```

### Pattern 3: Validate Results

```python
from src.backtesting.backtest_validator import BacktestValidator

# Run backtest
result = engine.run_backtest(prices, strategy, "My Strategy")

# Validate
validator = BacktestValidator()
report = validator.validate_backtest(
    backtest_result=result,
    price_data=prices,
    strategy=strategy,
    backtest_name="Production Backtest"
)

# Check validation
if report.overall_passed:
    print("✅ Backtest passed all validations")
else:
    print(f"❌ Failed: {report.critical_failures} critical issues")
    for r in report.results:
        if not r.passed:
            print(f"  - {r.check_name}: {r.message}")
```

---

## 7. Tips and Best Practices

### Tip 1: Always Use Integer Operations

```python
# Division: Use integer division //
result = (value_cents * ratio) // 1000

# Multiplication: Scale appropriately
scaled_value = value * SCALE_FACTOR

# Avoid floating-point entirely
# Don't: value = 1.23
# Do: value_cents = 123
```

### Tip 2: Validate Your Data

```python
def validate_price_data(prices):
    """Ensure price data is valid."""
    assert all(isinstance(p, int) for p in prices), "Prices must be integers"
    assert all(p > 0 for p in prices), "Prices must be positive"
    assert len(prices) >= 10, "Need at least 10 price points"
    return True

validate_price_data(price_data)
```

### Tip 3: Check Integer Conversion

```python
# Convert price to cents properly
def dollars_to_cents(price_str):
    """Convert $123.45 to 12345 cents."""
    price_float = float(price_str.replace('$', ''))
    return int(round(price_float * 100))

# Example
cents = dollars_to_cents("$123.45")  # Returns 12345
```

---

## Troubleshooting

### Issue: ImportError

```bash
# Make sure you're in project root
cd /path/to/quantum-trading-system

# Add to PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### Issue: API Key Not Found

```bash
# Set FRED API key
export FRED_API_KEY='your_key_here'

# Verify
echo $FRED_API_KEY
```

### Issue: Test Failures

```bash
# Run with verbose output
pytest tests/test_fibonacci_encoder.py -vv

# Check Python version (must be 3.8+)
python --version
```

---

## Getting Help

- **Documentation**: Check [README.md](README.md) and [FAQ.md](FAQ.md)
- **Issues**: https://github.com/your-org/quantum-trading-system/issues
- **Discussions**: https://github.com/your-org/quantum-trading-system/discussions

---

**You're ready to build quantum trading strategies! 🚀**

---

**Agent 30: Documentation Specialist**
**Last Updated**: 2025-11-25

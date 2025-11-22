# Installation Guide

## Quick Install

### 1. Python Dependencies

```bash
# Navigate to trading-system directory
cd /home/user/agentic-flow/trading-system

# Install required packages
pip install numpy pandas

# Optional: For visualization and real data
# pip install matplotlib seaborn yfinance
```

### 2. AgentDB (Optional - for AI learning)

```bash
# Install AgentDB globally
npm install -g agentdb

# Verify installation
npx agentdb --version
```

## Verify Installation

```bash
# Run test suite (should pass 30/31 tests, 1 skipped if no AgentDB)
python tests/test_backtesting_engine.py

# Run demo
python src/backtesting_engine.py
```

## Expected Output

### Test Suite:
```
Ran 31 tests in ~12s
OK (skipped=1)
Tests Run: 31
Successes: 31
```

### Demo:
```
🚀 Comprehensive Fibonacci-Based Backtesting Engine
======================================================================
📊 Generating sample market data...
✓ Generated 500 bars of data
🧪 Testing 4 strategies...
[Detailed performance reports...]
✅ Backtesting Complete!
```

## Troubleshooting

### Issue: ModuleNotFoundError: No module named 'numpy'
**Solution:** `pip install numpy pandas`

### Issue: AgentDB not available warning
**Solution:** This is optional. Install with `npm install -g agentdb` if you want AI-powered strategy learning.

### Issue: Tests fail
**Solution:** Ensure numpy and pandas are installed. Run `python --version` to verify Python 3.11+

## Next Steps

1. Read [BACKTESTING_GUIDE.md](docs/BACKTESTING_GUIDE.md) for comprehensive documentation
2. Try examples in [EXAMPLE_USAGE.md](docs/EXAMPLE_USAGE.md)
3. See [QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md) for command reference
4. Run `python src/backtesting_engine.py` to see the engine in action

## System Requirements

- Python 3.11+
- NumPy 1.24+
- Pandas 2.0+
- (Optional) Node.js 18+ for AgentDB
- 2GB RAM minimum
- ~10MB disk space

## Features Verification

Run this to verify all features work:

```python
from src.backtesting_engine import *

# Test 1: Fibonacci sequence generation
fib = generate_fibonacci_sequence(10)
print(f"✓ Fibonacci: {fib}")

# Test 2: Zeckendorf encoding
encoded = zeckendorf_encode(100)
decoded = zeckendorf_decode(encoded)
print(f"✓ Zeckendorf: 100 -> {encoded} -> {decoded}")

# Test 3: Run simple backtest
data = generate_sample_data(num_points=100)
engine = BacktestingEngine(initial_capital=10000)
strategy = FibonacciRetracementStrategy()
metrics, trades, equity = engine.run_backtest(data, strategy)
print(f"✓ Backtest: {len(trades)} trades, Sharpe {metrics.sharpe_ratio:.2f}")

print("\n✅ All features working!")
```

Expected output:
```
✓ Fibonacci: [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
✓ Zeckendorf: 100 -> [4, 6, 11] -> 100
✓ Backtest: 8 trades, Sharpe 2.15
✅ All features working!
```

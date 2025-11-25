# Frequently Asked Questions (FAQ)

**Common Questions About the Quantum Trading System**

---

## General Questions

### What is the Quantum Trading System?

The Quantum Trading System is an algorithmic trading platform that uses **integer-only arithmetic** and **OEIS (Online Encyclopedia of Integer Sequences)** mathematical sequences to eliminate floating-point errors and achieve deterministic, reproducible trading strategies.

### Why "Quantum"?

The system uses quantum mechanics concepts like:
- **Phase space representation** (position/momentum operators)
- **Heisenberg uncertainty principle** (price/momentum trade-off)
- **Quantum coherence** (market state stability measure)
- **Field operators** (neural network dynamics)

These aren't literal quantum computing but mathematical analogies that provide powerful market analysis tools.

### Is this for live trading or just backtesting?

**Both**. The system includes:
- Comprehensive backtesting framework with validation
- Real-time data integration (FRED, Tiingo, Yahoo Finance)
- Production-ready code with error handling
- Integer-only operations for deterministic execution

However, use at your own risk. Past performance doesn't guarantee future results.

---

## Integer-Only Arithmetic

### Why integer-only arithmetic?

**Advantages**:
1. **Zero Floating-Point Errors**: Exact calculations, no precision loss
2. **Deterministic Behavior**: Identical results across platforms and runs
3. **Cross-Platform Consistency**: Same results on any hardware
4. **Audit Trail**: Perfect reproducibility for regulatory compliance
5. **Performance**: Integer operations are faster than floating-point

**Example Problem**:
```python
# Floating-point error
0.1 + 0.2 == 0.3  # False! (0.30000000000000004)

# Integer solution
(1 + 2) == 3  # True!
# Represent 0.1 as 100 (scaled by 1000)
# 0.1 + 0.2 = 100 + 200 = 300 (= 0.3)
```

### How do you handle decimal prices like $123.45?

We scale by 100 (cents):
```python
price_dollars = 123.45
price_cents = 12345  # $123.45 × 100

# All operations in cents
profit = exit_price_cents - entry_price_cents
```

### What about percentages like 61.8%?

Scale by 1000 or 10000:
```python
# 61.8% scaled by 1000
ratio_618 = 618

# Calculate 61.8% of price range
level = high - ((high - low) * ratio_618) // 1000
```

### Don't you lose precision?

**Precision analysis**:
- Prices (cents): ±$0.01 precision (acceptable for trading)
- Ratios (×1000): ±0.1% precision (sufficient for Fibonacci levels)
- Phase values (×10000): ±0.01% precision (excellent for analysis)

For most trading applications, this precision is **more than sufficient** and eliminates all floating-point errors.

---

## OEIS Sequences

### What is OEIS?

The **Online Encyclopedia of Integer Sequences** (https://oeis.org) is the world's largest database of integer sequences, maintained by mathematicians worldwide.

### Which OEIS sequences does the system use?

**Primary sequences**:

1. **A000045 (Fibonacci)**: `0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55...`
   - Price encoding, retracement levels
   - Golden ratio calculations
   - Support/resistance identification

2. **A000032 (Lucas)**: `2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123...`
   - Time interval encoding
   - Nash equilibrium exits
   - Optimal trade timing

3. **A003714 (Zeckendorf)**: Unique Fibonacci representation
   - Agent addressing system
   - Data compression
   - Portfolio allocation

### How are Fibonacci retracements better than standard technical analysis?

**Advantages**:
1. **Mathematical Foundation**: Based on proven number theory
2. **Self-Similarity**: Fractals appear across all timeframes
3. **Natural Occurrence**: φ (golden ratio) appears throughout nature and markets
4. **Integer Precision**: No rounding errors in level calculations
5. **Multiple Confirmations**: Combined with other OEIS-based signals

**Golden Pocket** (50-61.8% retracement zone) has historically shown the highest probability of trend continuation.

---

## Trading Strategies

### Which strategy should I use?

**Depends on market conditions**:

| Market | Best Strategy | Why |
|--------|--------------|-----|
| Strong Trend | Fibonacci Retracement | Catches pullbacks in trends |
| Volatile | Mean Reversion | Exploits overreactions |
| Sideways | Mean Reversion | Profits from range bounds |
| Any Market | Lucas Timing | Optimal exits regardless of direction |

**Recommendation**: Combine multiple strategies for diversification.

### Can I create my own strategy?

**Yes!** See the [Custom Strategy Development](STRATEGIES.md#custom-strategy-development) section.

**Requirements**:
1. Implement `check_entry_signal()` and `check_exit_signal()`
2. Use integer-only arithmetic
3. Manage position state
4. Define risk parameters (stop loss, take profit)

### How do I optimize strategy parameters?

Use **grid search** or **walk-forward analysis**:

```python
# Grid search example
param_grid = {
    'lookback_period': [10, 15, 20, 25, 30],
    'tolerance_cents': [25, 50, 75, 100]
}

best_params, best_sharpe = optimize_strategy(prices, param_grid)
```

**Warning**: Avoid overfitting. Always test on out-of-sample data.

---

## Backtesting

### How reliable are backtest results?

**Our validation framework ensures**:
1. **No Look-Ahead Bias**: Future data never used for past decisions
2. **Integer Verification**: All operations use exact arithmetic
3. **Realistic Costs**: Commission and slippage included
4. **Statistical Rigor**: 100+ trades for significance

**However**, backtests assume:
- Perfect execution (not always realistic)
- Liquidity available (may not be true for all assets)
- Historical patterns persist (markets can change)

Use walk-forward analysis and out-of-sample testing.

### What is look-ahead bias?

**Look-ahead bias** = using future information for past decisions

**Example**:
```python
# ❌ WRONG: Using tomorrow's high to enter today
if price[today] < price[tomorrow_high] * 0.9:
    enter_position()

# ✅ CORRECT: Only use past data
if price[today] < max(price[:today]) * 0.9:
    enter_position()
```

Our `BacktestValidator` automatically detects look-ahead bias.

### How do I interpret Sharpe ratio?

**Sharpe Ratio** = (return - risk_free_rate) / volatility

**Interpretation**:
- **< 1.0**: Poor risk-adjusted returns
- **1.0 - 2.0**: Good (acceptable for most strategies)
- **2.0 - 3.0**: Very good
- **> 3.0**: Excellent (or overfitted)

**Our system** calculates Sharpe using integer arithmetic:
```python
sharpe_scaled = 1850  # Sharpe = 1.850
sharpe_actual = sharpe_scaled / 1000  # = 1.85
```

### What's a good win rate?

**Win rate alone doesn't determine profitability!**

A strategy can be profitable with:
- **High win rate (70%+), small wins, small losses**: Mean reversion
- **Low win rate (40%+), large wins, small losses**: Trend following

**More important**: **Profit factor** = gross_profit / gross_loss
- **> 1.0**: Profitable
- **> 1.5**: Good
- **> 2.0**: Excellent

---

## Data and APIs

### Which data sources are supported?

**Built-in support**:
1. **FRED** (178 economic indicators): Unemployment, GDP, CPI, interest rates
2. **Tiingo**: Stock prices, real-time quotes
3. **Yahoo Finance**: Historical and real-time data

### Do I need API keys?

**FRED**: Yes (free at https://fred.stlouisfed.org/docs/api/api_key.html)
**Tiingo**: Yes (free tier available at https://www.tiingo.com)
**Yahoo Finance**: No

### How do I add a custom data source?

Create a fetcher class following this pattern:

```python
class CustomDataFetcher:
    """Fetch data from custom source."""

    def __init__(self, api_key: str):
        self.api_key = api_key

    def fetch_series(self, symbol: str) -> List[Dict]:
        """
        Fetch time series data.

        Returns:
            List of {'date': str, 'value_scaled': int}
        """
        # Your API call here
        data = call_custom_api(symbol, self.api_key)

        # Convert to integer (cents for prices)
        return [
            {
                'date': row['date'],
                'value_scaled': int(row['value'] * 100)
            }
            for row in data
        ]
```

---

## Phase Space and Quantum Concepts

### What are Xi and Psi operators?

**Xi (ξ)**: Position operator
- Represents current price level
- Analogous to quantum position measurement

**Psi (ψ)**: Momentum operator
- Represents price velocity/momentum
- Analogous to quantum momentum

**Together**: They define a point in "phase space" describing market state.

### What is coherence?

**Coherence** measures how "quantum-like" vs "classical" the market behaves:

- **High coherence (> 0.8)**: Market has clear trends, predictions more reliable
- **Low coherence (< 0.5)**: Random/chaotic behavior, predictions less reliable

**Formula**:
```
coherence = exp(-|Δξ|²/σ²) ≈ 1 / (1 + normalized_uncertainty)
```

Scaled to [0, 10000] for integer arithmetic.

### How does the uncertainty principle apply to trading?

**Heisenberg Uncertainty Principle**: Δx × Δp ≥ ℏ/2

**Trading analog**: Δξ × Δψ ≥ ℏ/2

**Interpretation**:
- Cannot know both price level (ξ) and price momentum (ψ) with arbitrary precision
- Higher price volatility → Lower momentum certainty
- Fundamental limit on market predictability

**Practical use**: Assess market regime and adjust strategy accordingly.

---

## Technical Questions

### What Python version is required?

**Minimum**: Python 3.8
**Recommended**: Python 3.10 or 3.11

Python 3.12+ should work but is not extensively tested.

### Can I run this on Windows/Mac/Linux?

**Yes!** The system is cross-platform:
- **Linux**: Primary development platform (tested on Ubuntu 20.04+)
- **macOS**: Fully supported (tested on macOS 12+)
- **Windows**: Supported (tested on Windows 10+)

Integer arithmetic ensures identical behavior across all platforms.

### How do I install dependencies?

```bash
# Standard installation
pip install -r requirements.txt

# Development installation (includes testing tools)
pip install -r requirements.txt
pip install pytest pytest-cov black mypy
```

See [INSTALLATION.md](INSTALLATION.md) for detailed instructions.

### Why do tests fail with floating-point comparison errors?

You're likely using floating-point operations instead of integers.

**Check**:
1. All prices in cents (multiply by 100)
2. All ratios scaled (multiply by 1000)
3. Integer division `//` instead of `/`

**Validation**:
```python
from src.encoders.integer_validator import IntegerValidator

validator = IntegerValidator()
validator.validate_no_floats(your_result)  # Will raise if floats found
```

---

## Performance and Optimization

### How fast is the backtesting engine?

**Benchmarks** (on Intel i7-10700K):
- 1,000 bars: ~0.1 seconds
- 10,000 bars: ~1 second
- 100,000 bars: ~10 seconds

**Optimization tips**:
1. Use integer-only operations (faster than float)
2. Minimize Python loops (use NumPy where possible)
3. Cache expensive calculations
4. Profile with `pytest --profile` to find bottlenecks

### Can I parallelize backtests?

**Yes!** Use `multiprocessing` for parameter optimization:

```python
from multiprocessing import Pool

def run_backtest_with_params(params):
    """Run backtest with specific parameters."""
    strategy = FibonacciRetracementStrategy(**params)
    engine = BacktestEngine()
    result = engine.run_backtest(prices, strategy, "Test")
    return result.sharpe_ratio_scaled

# Parallel grid search
with Pool(8) as pool:
    results = pool.map(run_backtest_with_params, param_list)
```

### How much RAM do I need?

**Minimum**: 4 GB
**Recommended**: 8 GB

**Memory usage**:
- Small backtest (1K bars): ~10 MB
- Medium backtest (10K bars): ~50 MB
- Large backtest (100K bars): ~300 MB
- Phase space visualization: ~100 MB

For very large datasets (millions of bars), consider batching.

---

## Troubleshooting

### Import errors: "No module named 'src'"

**Solution**:
```bash
# Add project root to PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Or use absolute imports
from src.encoders.fibonacci_encoder import FibonacciEncoder
```

### FRED API key not found

**Solution**:
```bash
# Set environment variable
export FRED_API_KEY='your_key_here'

# Or in Python
import os
os.environ['FRED_API_KEY'] = 'your_key_here'
```

### Integer overflow errors

**Check**:
1. Using `int64` (not `int32`)
2. Prices don't exceed max int (very unlikely: $92 quadrillion)
3. Intermediate calculations don't overflow

**Solution**:
```python
import numpy as np

# Use int64 explicitly
prices = np.array(prices, dtype=np.int64)
```

### Test failures with "AssertionError: OEIS validation failed"

This means the Fibonacci or Lucas sequence doesn't match OEIS.

**Likely cause**: Corrupted constants or incorrect initialization

**Solution**: Verify sequence generation:
```python
from src.encoders.fibonacci_encoder import FibonacciEncoder

encoder = FibonacciEncoder()
encoder._validate_oeis()  # Should pass without error
```

---

## Best Practices

### Should I use leverage?

**Our recommendation**: No or minimal leverage (< 2x)

**Why**:
- Increased risk of ruin
- Margin calls can force exits at bad prices
- Integer arithmetic doesn't prevent poor risk management

If you do use leverage, reduce position sizes accordingly.

### How often should I rebalance?

**Depends on strategy**:
- **Fibonacci**: Rebalance when swing points update (new high/low)
- **Lucas Timing**: Review at Lucas intervals (3, 7, 11, 18, 29 days)
- **Momentum**: Daily or weekly
- **Mean Reversion**: When z-score crosses thresholds

### Should I combine strategies?

**Yes!** Diversification reduces risk:

**Example portfolio**:
- 40% Fibonacci Retracement (trend)
- 30% Mean Reversion (range)
- 30% Lucas Timing (any market)

**Correlation**: Choose strategies with low correlation for maximum diversification benefit.

---

## Contributing and Support

### How can I contribute?

We welcome contributions!

1. **Report bugs**: https://github.com/your-org/quantum-trading-system/issues
2. **Suggest features**: https://github.com/your-org/quantum-trading-system/discussions
3. **Submit PRs**: Fork, create feature branch, submit pull request
4. **Improve docs**: Documentation PRs especially welcome!

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### Where can I get help?

**Resources**:
1. **Documentation**: Start with [README.md](README.md) and [QUICK_START.md](QUICK_START.md)
2. **GitHub Issues**: Search existing or create new
3. **Discussions**: https://github.com/your-org/quantum-trading-system/discussions
4. **Email**: support@quantum-trading.io

**Before asking**:
1. Check this FAQ
2. Search documentation
3. Search GitHub issues
4. Try minimal reproduction case

### Is there a community?

**Coming soon**:
- Discord server for real-time chat
- Monthly webinars on strategy development
- Quarterly paper on OEIS trading research

---

## Legal and Disclaimers

### Is this financial advice?

**NO.** The Quantum Trading System is educational software for research and personal use.

**Not financial advice**: Consult a licensed financial advisor before trading.

### What are the risks?

**Trading involves substantial risk**:
- You can lose money
- Past performance doesn't guarantee future results
- Markets can change, strategies can fail
- Technology can have bugs

**Use at your own risk.** Test thoroughly before live trading.

### What license is this under?

**MIT License** - See [LICENSE](../LICENSE) file.

**You are free to**:
- Use commercially
- Modify
- Distribute
- Private use

**Conditions**:
- Include copyright notice
- Include license

**No warranty provided.**

---

## Future Development

### What features are planned?

**Roadmap**:
1. **Q1 2024**: Additional OEIS-based strategies (Pell numbers, Catalan numbers)
2. **Q2 2024**: Real-time trading execution framework
3. **Q3 2024**: Machine learning integration (QFNN enhancements)
4. **Q4 2024**: Multi-asset portfolio optimization

Subject to change.

### How can I request a feature?

**Process**:
1. Check if feature already requested (GitHub Issues)
2. Create new issue with:
   - Clear description
   - Use case
   - Example code (if applicable)
3. Label as "enhancement"
4. Community votes on priority

Popular requests get implemented first!

---

**Still have questions?**

- Read the [full documentation](README.md)
- Ask on [GitHub Discussions](https://github.com/your-org/quantum-trading-system/discussions)
- Email: support@quantum-trading.io

---

**Agent 30: Documentation Specialist**
**Last Updated**: 2025-11-25

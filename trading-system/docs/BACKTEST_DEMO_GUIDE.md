# Comprehensive Backtesting Demo Guide

## Overview

The `run_backtest_demo.py` script runs a comprehensive backtesting demonstration that:
- Tests **12 diverse tickers** across different sectors
- Runs **all 5 trading strategies**
- Generates **detailed performance reports**
- Stores successful strategies in **AgentDB**
- Provides **real-time progress output**

## Quick Start

```bash
# Make sure TIINGO_API_TOKEN is set
export TIINGO_API_TOKEN="your_token_here"

# Run the demonstration
cd /home/user/agentic-flow/trading-system
python run_backtest_demo.py
```

## What Gets Tested

### Tickers (12 stocks)

| Ticker | Name | Category | Why Included |
|--------|------|----------|--------------|
| SPY | S&P 500 ETF | Benchmark | Market baseline |
| QQQ | NASDAQ 100 | Benchmark | Tech sector baseline |
| AAPL | Apple | Mega-cap Tech | Large stable tech |
| MSFT | Microsoft | Mega-cap Tech | Large stable tech |
| GOOGL | Google | Mega-cap Tech | Large stable tech |
| NVDA | NVIDIA | High Vol Tech | High volatility |
| TSLA | Tesla | High Vol Auto | Very high volatility |
| JPM | JP Morgan | Financials | Banking sector |
| BAC | Bank of America | Financials | Banking sector |
| XOM | Exxon Mobil | Energy | Energy sector |
| UNH | UnitedHealth | Healthcare | Healthcare sector |
| HD | Home Depot | Consumer | Consumer/retail |

### Strategies (5 total)

1. **Fibonacci Retracement**
   - Uses 0.382, 0.500, 0.618 levels
   - Entry at retracement levels
   - Stop loss at swing low
   - Take profit at resistance + 0.618 extension

2. **Lucas Time Exit**
   - Time-based exits using Lucas sequence
   - Nash equilibrium detection
   - Optimal holding periods

3. **Momentum (RSI + MACD)**
   - RSI oversold/overbought
   - MACD crossovers
   - Combined signal confirmation

4. **Mean Reversion**
   - Fibonacci-based bands (1.618 std dev)
   - Z-score entry signals
   - Mean reversion exits

5. **Breakout**
   - Volume surge detection (1.618x avg)
   - Resistance/support breakouts
   - Golden ratio profit targets

## Output Files

### 1. JSON Summary (`backtest_summary.json`)

Complete data structure with:
- Metadata (timestamps, configuration)
- Aggregate statistics by strategy and ticker
- Best performers across all dimensions
- Detailed results for every test
- Error logs

### 2. Markdown Report (`backtest_report.md`)

Human-readable report with:
- Executive summary
- 🏆 Best performers (highest return, Sharpe, win rate)
- Strategy comparison table
- Ticker comparison table
- Detailed results by ticker
- Error summary

### 3. CSV Comparison (`strategy_comparison.csv`)

Spreadsheet-compatible data:
- All ticker/strategy combinations
- Complete metrics (return, Sharpe, drawdown, etc.)
- Buy-and-hold comparison
- Trade statistics
- Import into Excel/Google Sheets for further analysis

## Key Metrics Explained

### Performance Metrics

- **Total Return**: Dollar profit/loss (starting capital: $100,000)
- **Return %**: Percentage return on capital
- **Buy-Hold Return**: What you would have made just buying and holding
- **Sharpe Ratio**: Risk-adjusted return (>1.0 is good, >2.0 is excellent)
- **Sortino Ratio**: Like Sharpe but only counts downside volatility
- **Max Drawdown**: Largest peak-to-trough decline

### Trading Metrics

- **Win Rate**: Percentage of profitable trades
- **Profit Factor**: Gross profit / gross loss (>1.5 is good)
- **Total Trades**: Number of completed trades
- **Avg Win/Loss**: Average profit per winning/losing trade
- **Best/Worst Trade**: Largest single trade P&L

## Progress Output

During execution, you'll see:

```
[Progress: 5/60]
======================================================================
  Testing: AAPL   | Strategy: fibonacci
======================================================================
  [1/4] Fetching market data...
  [2/4] Data loaded: 252 trading days
  [3/4] Running backtest...
  [4/4] Storing results...

  RESULTS:
  ────────────────────────────────────────────────────────────────────
  Total Return:      $    12,345.67  ( 12.35%)
  Buy-Hold Return:   $     8,234.56  (  8.23%)
  Sharpe Ratio:                2.15
  Max Drawdown:               -8.45%
  Win Rate:                   62.50%
  Profit Factor:               2.34
  Total Trades:                  48
  Winning Trades:                30
  Losing Trades:                 18
  Avg Win:           $       534.12
  Avg Loss:          $      -287.45
  Execution Time:             2.34s
  ────────────────────────────────────────────────────────────────────

  ✓ SUCCESS: AAPL/fibonacci
```

## Expected Runtime

- **Per test**: ~2-5 seconds
- **Total (60 tests)**: ~3-8 minutes
- Includes:
  - Data fetching (cached after first fetch per ticker)
  - Backtest computation
  - AgentDB storage
  - Rate limit delays

## AgentDB Integration

The demo automatically stores successful strategies in AgentDB:

### What Gets Stored

1. **Reflexion Memory**
   - Strategy name and ticker
   - Performance metrics
   - Verdict score (based on Sharpe ratio)
   - Full trajectory data

2. **Causal Relationships**
   - Strategy → Sharpe ratio correlations
   - Strategy → Win rate correlations

### Accessing Stored Data

```bash
# List all stored strategies
npx agentdb reflexion list

# View specific backtest session
npx agentdb reflexion recall backtest_AAPL

# List causal relationships
npx agentdb causal list-edges

# Create skill from best strategy
npx agentdb skill create "fibonacci_trading" \
  "Uses 0.618 golden ratio levels for entry/exit"
```

## Analyzing Results

### Find Best Strategy Overall

```bash
# Open the markdown report
cat results/backtest_report.md | less

# Or use jq to query JSON
jq '.aggregate_stats.best_performers.highest_sharpe' results/backtest_summary.json
```

### Find Best Strategy for Specific Ticker

```bash
# Example: Best strategy for AAPL
jq '.detailed_results.AAPL' results/backtest_summary.json
```

### Compare Strategies

```bash
# View strategy comparison table
jq '.aggregate_stats.by_strategy' results/backtest_summary.json

# Or open CSV in Excel/Google Sheets
# File: results/strategy_comparison.csv
```

### Export for Further Analysis

```python
import pandas as pd
import json

# Load results
with open('results/backtest_summary.json') as f:
    summary = json.load(f)

# Load CSV for detailed analysis
df = pd.read_csv('results/strategy_comparison.csv')

# Filter for high Sharpe strategies
top_strategies = df[df['Sharpe Ratio'] > 2.0]

# Group by strategy
by_strategy = df.groupby('Strategy')['Total Return'].mean()
print(by_strategy.sort_values(ascending=False))
```

## Customization

### Change Tickers

Edit `TICKERS` list in `run_backtest_demo.py`:

```python
TICKERS = [
    'AAPL', 'MSFT', 'GOOGL',  # Your custom list
    'AMZN', 'META', 'NFLX'
]
```

### Change Time Period

Edit date constants:

```python
START_DATE = '2024-01-01'
END_DATE = '2024-12-31'
```

### Adjust Strategy Parameters

Strategies use default parameters. To customize, edit the strategy initialization:

```python
# Example: More aggressive Fibonacci levels
fibonacci_strategy = FibonacciRetracementStrategy({
    'entry_levels': [0.236, 0.382, 0.500, 0.618, 0.786],
    'lookback_period': 30,
    'base_position_size': 0.8
})
```

## Troubleshooting

### "No TIINGO_API_TOKEN"

```bash
# Set environment variable
export TIINGO_API_TOKEN="your_token_here"

# Or add to ~/.bashrc for persistence
echo 'export TIINGO_API_TOKEN="your_token_here"' >> ~/.bashrc
source ~/.bashrc
```

### "Rate limit exceeded"

- Free Tiingo accounts have limits
- Script includes 0.5s delays between tests
- If you hit limits, wait 1 hour or upgrade Tiingo plan

### "No data for ticker"

- Some tickers may have limited historical data
- Check if ticker is valid
- Try different date range

### AgentDB Not Available

```bash
# Install AgentDB
npm install -g agentdb

# Verify installation
npx agentdb --version
```

## Next Steps After Running

1. **Review Markdown Report**
   - Identify best strategies
   - Look for consistent performers
   - Note which strategies work best for which tickers

2. **Analyze CSV Data**
   - Import to spreadsheet
   - Create charts/graphs
   - Run statistical analysis

3. **Refine Strategies**
   - Use insights to tune parameters
   - Test refined strategies on out-of-sample data
   - Combine best elements from multiple strategies

4. **Deploy Top Performers**
   - Paper trade best strategies
   - Monitor live performance
   - Adjust based on real-world results

## Example Analysis Workflow

```bash
# 1. Run the demo
python run_backtest_demo.py

# 2. View summary
cat results/backtest_report.md

# 3. Find best overall strategy
jq -r '.aggregate_stats.best_performers.highest_sharpe |
  "Best: \(.ticker) with \(.strategy) - Sharpe: \(.sharpe_ratio)"' \
  results/backtest_summary.json

# 4. Review that strategy's performance across all tickers
BEST_STRATEGY="fibonacci"  # Replace with result from step 3
jq --arg strategy "$BEST_STRATEGY" '
  .detailed_results | to_entries[] |
  select(.value[$strategy].success) |
  "\(.key): \(.value[$strategy].metrics.sharpe_ratio)"' \
  results/backtest_summary.json

# 5. Store top strategies in AgentDB for future use
npx agentdb reflexion list | grep "✓"
```

## Performance Expectations

Based on 2024 market conditions, you might expect:

- **SPY/QQQ**: Moderate returns, lower volatility
- **Mega-cap tech**: Good Fibonacci/mean reversion performance
- **High volatility (NVDA/TSLA)**: Breakout strategies may excel
- **Financials/Energy**: Momentum strategies often work well
- **Overall**: Sharpe ratios 1.0-2.5 for good strategies

## Support

For issues or questions:
1. Check logs: `logs/trading_system.log`
2. Review errors in JSON summary
3. Verify API token and internet connection
4. Check Tiingo API status: https://api.tiingo.com/status

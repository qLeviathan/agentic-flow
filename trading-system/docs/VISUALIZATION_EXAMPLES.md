# Visualization Examples

## 📊 Complete Code Examples for Dashboard Generation

This guide provides ready-to-use code examples for creating all visualization types in the trading system.

---

## 🚀 Basic Usage

### Example 1: Generate Complete Dashboard

```python
#!/usr/bin/env python3
"""Generate complete trading dashboard"""

from generate_visualizations import DashboardGenerator, Config

# Initialize generator
generator = DashboardGenerator(theme='dark')

# Generate main dashboard with all tabs
dashboard_path = generator.generate_main_dashboard()

# Export individual charts
generator.export_individual_charts()

print(f"Dashboard created: {dashboard_path}")
print(f"Open in browser: file://{Config.DASHBOARD_HTML.absolute()}")
```

---

## 📈 Individual Chart Examples

### Example 2: Fibonacci Effectiveness Heatmap

```python
from generate_visualizations import DashboardGenerator

gen = DashboardGenerator()

# Create Fibonacci effectiveness heatmap
fig = gen.create_fibonacci_effectiveness_heatmap()

# Display interactively
fig.show()

# Save as HTML
fig.write_html('fibonacci_heatmap.html')

# Save as PNG (requires kaleido)
fig.write_image('fibonacci_heatmap.png', width=1920, height=1080)
```

**Output**: Heatmap showing which Fibonacci levels (0.236, 0.382, 0.618, etc.) perform best for each strategy.

---

### Example 3: Sector Performance Heatmap

```python
from generate_visualizations import DashboardGenerator

gen = DashboardGenerator()

# Create sector performance heatmap
fig = gen.create_sector_performance_heatmap()

# Customize and save
fig.update_layout(title='Sector Analysis - Q4 2024')
fig.write_html('sector_performance.html')
```

**Output**: Heatmap showing strategy performance across different market sectors.

---

### Example 4: Correlation Matrix with Zeckendorf

```python
from generate_visualizations import DashboardGenerator

gen = DashboardGenerator()

# Create correlation matrix
fig = gen.create_correlation_matrix()

# Display with Zeckendorf decomposition in tooltips
fig.show()
```

**Output**: Correlation matrix with hover tooltips showing Zeckendorf representation of correlation values.

---

### Example 5: Lucas Timing Analysis

```python
from generate_visualizations import DashboardGenerator

gen = DashboardGenerator()

# Create Lucas timing scatter plot
fig = gen.create_lucas_timing_analysis()

# Highlight Lucas number exits
fig.show()
```

**Output**: Scatter plot showing trade duration vs. return, with Lucas number exits highlighted.

---

### Example 6: Individual Ticker Analysis

```python
from generate_visualizations import DashboardGenerator

gen = DashboardGenerator()

# Analyze specific ticker
ticker = 'AAPL'
fig = gen.create_ticker_analysis(ticker)

# Save comprehensive ticker report
fig.write_html(f'{ticker}_comprehensive_analysis.html')
```

**Output**: 6-panel dashboard with equity curves, drawdowns, trade distribution, Fibonacci levels, metrics, and timeline for the specific ticker.

---

## 🎨 Custom Chart Creation

### Example 7: Custom Candlestick Chart

```python
import pandas as pd
import numpy as np
from src.visualization import TradingViewCharts

# Create sample price data
dates = pd.date_range(start='2024-01-01', periods=100, freq='D')
price_data = pd.DataFrame({
    'timestamp': dates,
    'open': 100 + np.cumsum(np.random.randn(100) * 2),
    'high': 105 + np.cumsum(np.random.randn(100) * 2),
    'low': 95 + np.cumsum(np.random.randn(100) * 2),
    'close': 100 + np.cumsum(np.random.randn(100) * 2),
    'volume': np.random.randint(1000000, 5000000, 100)
})

# Create signals
signals = pd.DataFrame({
    'timestamp': dates[[10, 30, 50, 70]],
    'type': ['buy', 'sell', 'buy', 'sell'],
    'price': [105, 110, 108, 115]
})

# Generate chart
charts = TradingViewCharts(theme='dark')
fig = charts.candlestick_with_fibonacci(
    df=price_data,
    show_volume=True,
    show_fibonacci=True,
    signals=signals
)

fig.show()
```

**Output**: Professional candlestick chart with Fibonacci levels, volume, and entry/exit signals.

---

### Example 8: Volume Analysis with Fibonacci Levels

```python
from src.visualization import TradingViewCharts
import pandas as pd
import numpy as np

# Sample data
dates = pd.date_range(start='2024-01-01', periods=100, freq='D')
df = pd.DataFrame({
    'timestamp': dates,
    'volume': np.random.randint(1000000, 10000000, 100),
    'close': 100 + np.cumsum(np.random.randn(100)),
    'open': 100 + np.cumsum(np.random.randn(100))
})

# Create volume analysis
charts = TradingViewCharts(theme='dark')
fig = charts.volume_analysis(
    df=df,
    use_log_scale=True,
    show_fibonacci_levels=True
)

fig.show()
```

**Output**: Dual-panel chart showing volume distribution and cumulative volume with Fibonacci reference levels.

---

### Example 9: Economic Indicators Dashboard

```python
from src.visualization import TradingViewCharts
import pandas as pd
import numpy as np

# Sample economic indicators
dates = pd.date_range(start='2024-01-01', periods=100, freq='D')

indicators_data = {
    'GDP Growth': pd.DataFrame({
        'timestamp': dates,
        'value': np.random.normal(2.5, 0.5, 100)
    }),
    'Unemployment': pd.DataFrame({
        'timestamp': dates,
        'value': np.random.normal(4.0, 0.3, 100)
    }),
    'Inflation': pd.DataFrame({
        'timestamp': dates,
        'value': np.random.normal(3.0, 0.8, 100)
    }),
    'Interest Rate': pd.DataFrame({
        'timestamp': dates,
        'value': np.random.normal(5.5, 0.2, 100)
    })
}

# Create dashboard
charts = TradingViewCharts(theme='dark')
fig = charts.economic_indicators_dashboard(
    indicators_data=indicators_data
)

fig.show()
```

**Output**: Multi-panel dashboard showing economic indicators with trend coloring.

---

### Example 10: Backtesting Results Dashboard

```python
from src.visualization import TradingViewCharts
import pandas as pd
import numpy as np

# Sample equity curve
dates = pd.date_range(start='2024-01-01', periods=252, freq='D')
returns = np.random.normal(0.001, 0.02, 252)
equity = 10000 * (1 + returns).cumprod()
running_max = np.maximum.accumulate(equity)
drawdown = (equity - running_max) / running_max

equity_curve = pd.DataFrame({
    'timestamp': dates,
    'equity': equity,
    'drawdown': drawdown
})

# Sample trades
num_trades = 50
trade_dates = np.sort(np.random.choice(252, num_trades * 2, replace=False))

trades = []
for i in range(0, len(trade_dates) - 1, 2):
    entry_idx = trade_dates[i]
    exit_idx = trade_dates[i + 1]

    entry_price = 100 + np.random.randn() * 10
    exit_price = entry_price * (1 + np.random.normal(0.01, 0.05))

    pnl = (exit_price - entry_price) * 100
    ret = (exit_price - entry_price) / entry_price

    trades.append({
        'entry_time': dates[entry_idx],
        'exit_time': dates[exit_idx],
        'pnl': pnl,
        'return': ret
    })

trades_df = pd.DataFrame(trades)

# Metrics
metrics = {
    'Total Return': '47.3%',
    'Sharpe Ratio': '2.15',
    'Max Drawdown': '-12.4%',
    'Win Rate': '68.3%',
    'Total Trades': len(trades),
    'Avg Trade': f"{trades_df['return'].mean() * 100:.2f}%"
}

# Create backtesting dashboard
charts = TradingViewCharts(theme='dark')
fig = charts.backtesting_results(
    equity_curve=equity_curve,
    trades=trades_df,
    metrics=metrics
)

fig.show()
```

**Output**: Comprehensive 6-panel backtesting dashboard with equity curve, drawdown, returns distribution, cumulative returns, win/loss ratio, and metrics table.

---

## 🔧 Advanced Customization

### Example 11: Custom Theme Colors

```python
from src.visualization import TradingViewCharts

# Create custom theme
charts = TradingViewCharts(theme='dark')

# Override colors
charts.colors = {
    'background': '#0A0E1A',      # Darker background
    'paper': '#141820',           # Darker panels
    'text': '#E8E9ED',            # Lighter text
    'grid': '#1E2230',            # Subtle grid
    'bullish': '#00D084',         # Brighter green
    'bearish': '#FF4976',         # Brighter red
    'volume': '#5B8FF9',          # Different blue
    'fibonacci': ['#FF6B9D', '#FFC371', '#FFD700', '#7ED321', '#4A90E2', '#B620E0'],
    'signal_buy': '#00D084',
    'signal_sell': '#FF4976'
}

# Use custom theme
fig = charts.candlestick_with_fibonacci(df)
fig.show()
```

---

### Example 12: Export in Multiple Formats

```python
from generate_visualizations import DashboardGenerator

gen = DashboardGenerator()
fig = gen.create_overview_dashboard()

# Export as HTML (interactive)
fig.write_html('overview_interactive.html', include_plotlyjs='cdn')

# Export as PNG (static, high-res)
fig.write_image('overview_hires.png', width=3840, height=2160)

# Export as SVG (vector, scalable)
fig.write_image('overview_vector.svg', format='svg')

# Export as PDF (for reports)
fig.write_image('overview_report.pdf', format='pdf')

# Export as JSON (for data interchange)
import json
with open('overview_data.json', 'w') as f:
    json.dump(fig.to_dict(), f, indent=2)
```

---

### Example 13: Real-Time Data Integration

```python
from generate_visualizations import DataLoader, DashboardGenerator
import time

# Custom data loader for real-time data
class RealtimeDataLoader(DataLoader):
    def load_live_backtest_results(self, ticker, strategy):
        """Load live backtesting results"""
        # This would connect to your live trading system
        # For example, query a database or API
        import requests

        response = requests.get(f'http://api.example.com/backtest/{ticker}/{strategy}')
        return response.json()

# Generate dashboard with live data
loader = RealtimeDataLoader()
gen = DashboardGenerator()

# Update dashboard every 60 seconds
while True:
    # Reload data
    gen.backtest_results = loader.load_backtest_results()

    # Regenerate dashboard
    gen.generate_main_dashboard()

    print(f"Dashboard updated at {time.strftime('%H:%M:%S')}")

    # Wait 60 seconds
    time.sleep(60)
```

---

### Example 14: Custom Fibonacci Levels

```python
from src.visualization import TradingViewCharts, FibonacciUtils

# Create custom Fibonacci utility
class CustomFibonacci(FibonacciUtils):
    @staticmethod
    def fibonacci_retracement_levels():
        # Add custom levels
        return [0.0, 0.191, 0.236, 0.382, 0.5, 0.618, 0.707, 0.786, 1.0, 1.272, 1.414, 1.618, 2.0]

# Use custom levels
charts = TradingViewCharts(theme='dark')
charts.fib_utils = CustomFibonacci()

# Generate chart with custom Fibonacci levels
fig = charts.candlestick_with_fibonacci(df, show_fibonacci=True)
fig.show()
```

---

### Example 15: Programmatic Dashboard Manipulation

```python
from generate_visualizations import DashboardGenerator
import plotly.graph_objects as go

gen = DashboardGenerator()

# Create base overview
fig = gen.create_overview_dashboard()

# Add custom annotation
fig.add_annotation(
    text="⚠️ High Volatility Period",
    xref="paper", yref="paper",
    x=0.5, y=0.95,
    showarrow=False,
    font=dict(size=16, color='orange'),
    bgcolor='rgba(255, 165, 0, 0.2)',
    borderpad=10
)

# Add custom shape (highlight region)
fig.add_vrect(
    x0="2024-03-01", x1="2024-03-31",
    fillcolor="red", opacity=0.1,
    layer="below", line_width=0,
    annotation_text="Market Correction",
    annotation_position="top left"
)

# Update layout
fig.update_layout(
    title=dict(
        text='Trading System Overview - Custom Analysis',
        font=dict(size=24, color='#26A69A')
    )
)

fig.show()
```

---

## 📊 Data Format Examples

### Example 16: Prepare Data for Visualization

```python
import pandas as pd
import json

# Prepare backtest results in correct format
backtest_results = {
    'AAPL_fibonacci_retracement': {
        'ticker': 'AAPL',
        'strategy': 'fibonacci_retracement',
        'equity_curve': [
            {'timestamp': '2024-01-01', 'equity': 10000.0, 'drawdown': 0.0},
            {'timestamp': '2024-01-02', 'equity': 10050.0, 'drawdown': 0.0},
            {'timestamp': '2024-01-03', 'equity': 10025.0, 'drawdown': -0.0025},
            # ... more data
        ],
        'trades': [
            {
                'entry_time': '2024-01-15',
                'exit_time': '2024-02-01',
                'entry_price': 150.0,
                'exit_price': 155.0,
                'pnl': 500.0,
                'return': 0.0333,
                'fibonacci_level': 0.618
            },
            # ... more trades
        ],
        'metrics': {
            'Total Return': '47.3%',
            'Sharpe Ratio': '2.15',
            'Max Drawdown': '-12.4%',
            'Win Rate': '68.3%',
            'Total Trades': 127,
            'Winning Trades': 87,
            'Losing Trades': 40,
            'Avg Trade': '1.8%'
        }
    }
}

# Save to file
with open('results/backtest_results.json', 'w') as f:
    json.dump(backtest_results, f, indent=2)

# Load and visualize
from generate_visualizations import DashboardGenerator

gen = DashboardGenerator()
gen.generate_main_dashboard()
```

---

### Example 17: Convert CSV to Dashboard Format

```python
import pandas as pd
import json

# Load CSV results
trades_df = pd.read_csv('results/trades.csv')
equity_df = pd.read_csv('results/equity.csv')

# Convert to dashboard format
backtest_results = {}

for ticker in trades_df['ticker'].unique():
    for strategy in trades_df['strategy'].unique():
        # Filter data
        ticker_trades = trades_df[
            (trades_df['ticker'] == ticker) &
            (trades_df['strategy'] == strategy)
        ]

        ticker_equity = equity_df[
            (equity_df['ticker'] == ticker) &
            (equity_df['strategy'] == strategy)
        ]

        # Calculate metrics
        winning_trades = ticker_trades[ticker_trades['pnl'] > 0]
        total_return = (ticker_equity['equity'].iloc[-1] - ticker_equity['equity'].iloc[0]) / ticker_equity['equity'].iloc[0]

        # Format
        key = f"{ticker}_{strategy}"
        backtest_results[key] = {
            'ticker': ticker,
            'strategy': strategy,
            'equity_curve': ticker_equity.to_dict('records'),
            'trades': ticker_trades.to_dict('records'),
            'metrics': {
                'Total Return': f"{total_return * 100:.1f}%",
                'Total Trades': len(ticker_trades),
                'Winning Trades': len(winning_trades),
                'Losing Trades': len(ticker_trades) - len(winning_trades),
                'Win Rate': f"{len(winning_trades) / len(ticker_trades) * 100:.1f}%"
            }
        }

# Save
with open('results/backtest_results.json', 'w') as f:
    json.dump(backtest_results, f, indent=2)
```

---

## 🎯 Complete Workflow Example

### Example 18: End-to-End Visualization Pipeline

```python
#!/usr/bin/env python3
"""
Complete end-to-end visualization pipeline
"""

from generate_visualizations import (
    Config,
    DataLoader,
    DashboardGenerator
)
import json

# Step 1: Ensure directories exist
Config.ensure_directories()

# Step 2: Load data
print("Loading data...")
loader = DataLoader()
tickers_metadata = loader.load_tickers_metadata()
backtest_results = loader.load_backtest_results()
agentdb_data = loader.load_agentdb_data()

print(f"Loaded {len(backtest_results)} backtest results")
print(f"Loaded {len(tickers_metadata.get('tickers', []))} tickers")

# Step 3: Generate dashboard
print("\nGenerating dashboard...")
generator = DashboardGenerator(theme='dark')

# Main dashboard
dashboard_path = generator.generate_main_dashboard()

# Step 4: Export individual charts
print("\nExporting charts...")
generator.export_individual_charts()

# Step 5: Generate performance summary
summary = generator.generate_performance_summary()
print(summary)

# Step 6: Save summary to file
with open(Config.VIZ_DIR / 'performance_summary.txt', 'w') as f:
    f.write(summary)

# Step 7: Generate metadata file
metadata = {
    'generated_at': str(pd.Timestamp.now()),
    'num_tickers': len(set(r.get('ticker', '') for r in backtest_results.values())),
    'num_strategies': len(Config.STRATEGIES),
    'num_results': len(backtest_results),
    'dashboard_path': str(dashboard_path),
    'charts_directory': str(Config.CHARTS_DIR)
}

with open(Config.VIZ_DIR / 'metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)

print("\n✅ Visualization pipeline complete!")
print(f"📊 Dashboard: {dashboard_path}")
print(f"📁 Charts: {Config.CHARTS_DIR}")
print(f"📄 Summary: {Config.VIZ_DIR / 'performance_summary.txt'}")
```

---

## 🚀 Quick Reference

### Generate Dashboard
```bash
python3 generate_visualizations.py
```

### Open Dashboard in Browser
```bash
# Linux/Mac
xdg-open visualizations/dashboard.html

# Or directly
firefox visualizations/dashboard.html
```

### Generate with Custom Data
```python
from generate_visualizations import DashboardGenerator

gen = DashboardGenerator()
gen.backtest_results = your_data
gen.generate_main_dashboard()
```

---

**More examples:** See `VISUALIZATION_GUIDE.md` for detailed documentation.

**Generated by Agentic Flow Trading System**

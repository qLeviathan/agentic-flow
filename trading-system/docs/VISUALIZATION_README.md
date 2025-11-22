# TradingView-Style Visualization System

> Professional-grade interactive trading charts with Fibonacci analysis and Zeckendorf compression

## Overview

A comprehensive visualization system built with Python, Plotly, and Dash that delivers TradingView-quality charts for financial analysis. Features Fibonacci overlays, log-space volume encoding, economic indicator tracking, backtesting visualization, and real-time monitoring.

## Quick Start

### Installation

```bash
# Install all dependencies
pip install -r requirements.txt
```

### Run the Dashboard

```bash
# Navigate to trading-system directory
cd /home/user/agentic-flow/trading-system

# Start interactive dashboard
python src/dashboard.py

# Open browser to: http://localhost:8050
```

### Run Demos

```bash
# Generate all demo charts
python src/demo.py

# View generated charts in docs/ directory
```

## Features

### 📊 8 Chart Types

1. **Candlestick Charts** - OHLCV with Fibonacci retracement levels
2. **Volume Analysis** - Log-scale encoding with Fibonacci volume levels
3. **Economic Indicators** - Multi-indicator dashboard (255+ indicators)
4. **Sector Heatmap** - Performance visualization by sector
5. **Correlation Matrix** - With Zeckendorf compression
6. **Backtesting Results** - Equity curve, drawdown, trade analysis
7. **Real-time Monitor** - Live ticker tracking with alerts
8. **Regime Detection** - Bull/bear markets with Lucas time markers

### 🎨 Themes

- **Dark Theme** - Professional TradingView-style (default)
- **Light Theme** - Clean, bright interface
- One-click theme switching

### 📱 Responsive Design

- Desktop-optimized layouts
- Tablet-friendly controls
- Mobile-responsive views
- Touch-enabled interactions

### 💾 Export Formats

- **PNG** - High-resolution images (1920x1080)
- **SVG** - Scalable vector graphics
- **PDF** - Publication-ready documents
- **HTML** - Interactive standalone files
- **JSON** - Chart configuration data

## Dashboard Tabs

### 1. Price Chart
- Interactive candlestick charts
- Fibonacci retracement overlays
- Buy/sell signal markers
- Volume subplot
- Customizable controls

### 2. Volume Analysis
- Log-scale volume bars
- Fibonacci volume levels
- Cumulative volume tracking
- Accumulation/distribution patterns

### 3. Economic Indicators
- 12+ indicator categories
- Organized grid layout
- Trend detection
- Real-time status badges

### 4. Backtesting
- Equity curve visualization
- Drawdown analysis
- Trade distribution histogram
- Performance metrics table
- Win/loss statistics

### 5. Real-time Monitor
- Multi-ticker tracking
- Live price updates
- Fibonacci alert levels
- Status cards

### 6. Sector Analysis
- Performance heatmap
- Correlation matrix
- Cross-sector analysis
- Zeckendorf-compressed tooltips

## Code Examples

### Basic Chart Generation

```python
from src.visualization import TradingViewCharts
import pandas as pd

# Initialize
charts = TradingViewCharts(theme='dark')

# Create data
df = pd.DataFrame({
    'timestamp': pd.date_range('2024-01-01', periods=100, freq='D'),
    'open': [...],
    'high': [...],
    'low': [...],
    'close': [...],
    'volume': [...]
})

# Generate chart
fig = charts.candlestick_with_fibonacci(
    df,
    show_volume=True,
    show_fibonacci=True
)

# Display
fig.show()
```

### Fibonacci Utilities

```python
from src.visualization import FibonacciUtils

fib = FibonacciUtils()

# Generate Fibonacci numbers
nums = fib.generate_fibonacci(20)
# [1, 1, 2, 3, 5, 8, 13, 21, ...]

# Get retracement levels
levels = fib.fibonacci_retracement_levels()
# [0.0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.618]

# Zeckendorf decomposition
result = fib.zeckendorf_decompose(100)
# [89, 8, 3] (100 = 89 + 8 + 3)
```

### Export Charts

```python
from src.visualization import ChartExporter

exporter = ChartExporter()

# Export as PNG
exporter.export_png(fig, 'chart.png', width=1920, height=1080)

# Export as SVG
exporter.export_svg(fig, 'chart.svg')

# Export as interactive HTML
exporter.export_html(fig, 'chart.html')
```

### Volume Analysis

```python
# Create volume analysis chart
fig = charts.volume_analysis(
    df,
    use_log_scale=True,
    show_fibonacci_levels=True
)
```

### Backtesting Visualization

```python
# Visualize backtesting results
fig = charts.backtesting_results(
    equity_curve=equity_df,
    trades=trades_df,
    metrics={
        'Total Return': '45.2%',
        'Win Rate': '58.3%',
        'Sharpe Ratio': '1.85',
        'Max Drawdown': '-12.5%'
    }
)
```

### Real-time Monitor

```python
# Monitor multiple tickers
tickers = {
    'AAPL': aapl_df,
    'GOOGL': googl_df,
    'MSFT': msft_df
}

alert_levels = {
    'AAPL': [150.0, 175.0],
    'GOOGL': [2800.0, 3000.0]
}

fig = charts.realtime_ticker_monitor(tickers, alert_levels)
```

## File Structure

```
/trading-system/
├── src/
│   ├── __init__.py                 # Package initialization
│   ├── visualization.py            # Core visualization (892 lines)
│   ├── dashboard.py                # Web dashboard (631 lines)
│   └── demo.py                     # Demo examples (389 lines)
├── docs/
│   ├── VISUALIZATION_GUIDE.md      # Complete documentation
│   ├── QUICK_START.md              # Quick reference
│   ├── IMPLEMENTATION_SUMMARY.md   # Technical details
│   └── VISUALIZATION_README.md     # This file
└── requirements.txt                # Dependencies
```

## API Reference

### TradingViewCharts

Main visualization class with theme support.

**Constructor:**
```python
TradingViewCharts(theme='dark')  # or 'light'
```

**Methods:**

- `candlestick_with_fibonacci(df, show_volume=True, show_fibonacci=True, signals=None)`
- `volume_analysis(df, use_log_scale=True, show_fibonacci_levels=True)`
- `economic_indicators_dashboard(indicators_data, categories=None)`
- `sector_heatmap(sector_data)`
- `correlation_matrix(correlation_data, use_zeckendorf_compression=True)`
- `backtesting_results(equity_curve, trades, metrics)`
- `realtime_ticker_monitor(ticker_data, alert_levels=None)`
- `regime_detection_chart(df, regimes, lucas_markers=None)`

### FibonacciUtils

Mathematical utilities for Fibonacci analysis.

**Static Methods:**

- `generate_fibonacci(n)` - First n Fibonacci numbers
- `fibonacci_retracement_levels()` - Standard levels
- `zeckendorf_decompose(n)` - Fibonacci sum representation
- `lucas_numbers(n)` - Lucas sequence

### ChartExporter

Export charts to various formats.

**Static Methods:**

- `export_png(fig, filename, width=1920, height=1080)`
- `export_svg(fig, filename)`
- `export_pdf(fig, filename)`
- `export_html(fig, filename, include_plotlyjs='cdn')`
- `export_json(fig, filename)`

## Data Formats

### Price Data (OHLCV)

```python
pd.DataFrame({
    'timestamp': datetime,
    'open': float,
    'high': float,
    'low': float,
    'close': float,
    'volume': int
})
```

### Trading Signals

```python
pd.DataFrame({
    'timestamp': datetime,
    'type': 'buy' | 'sell',
    'price': float
})
```

### Economic Indicators

```python
{
    'indicator_name': pd.DataFrame({
        'timestamp': datetime,
        'value': float
    })
}
```

### Backtesting Data

```python
equity_curve = pd.DataFrame({
    'timestamp': datetime,
    'equity': float,
    'drawdown': float
})

trades = pd.DataFrame({
    'entry_time': datetime,
    'exit_time': datetime,
    'pnl': float,
    'return': float
})

metrics = {
    'Total Return': '45.2%',
    'Win Rate': '58.3%',
    'Sharpe Ratio': '1.85',
    ...
}
```

## Dashboard Controls

### Interactive Features
- **Zoom** - Click and drag to zoom into specific areas
- **Pan** - Shift + drag to pan across time
- **Hover** - Mouse over for detailed tooltips
- **Legend** - Click to show/hide data series
- **Reset** - Double-click to reset view

### Export Modal
1. Click "Export Charts" button
2. Select format (PNG/SVG/PDF/HTML)
3. Choose current view or all charts
4. Confirm export
5. Files saved to local directory

### Theme Switching
- Click "Dark" or "Light" buttons in header
- Instant theme change across all charts
- Maintains current data and settings

### Real-time Updates
- Toggle "Real-time Updates" switch
- Configurable refresh interval (default: 5 seconds)
- Simulated live data streaming
- Auto-refresh all charts

## Color Schemes

### Dark Theme (TradingView-Style)
- Background: `#131722`
- Paper: `#1E222D`
- Text: `#D1D4DC`
- Bullish: `#26A69A` (teal)
- Bearish: `#EF5350` (red)
- Volume: `#4A90E2` (blue)

### Light Theme
- Background: `#FFFFFF`
- Paper: `#F8F9FA`
- Text: `#2E3238`
- Bullish/Bearish: Same as dark
- Clean, professional appearance

## Performance

### Optimization
- Handles 10,000+ candles efficiently
- 255+ indicators simultaneously
- Real-time updates without lag
- WebGL rendering for complex charts
- Incremental data loading

### Scalability
- Large dataset support
- Efficient data structures (pandas)
- Lazy loading
- Cached calculations
- Responsive across devices

## Troubleshooting

### Import Errors

```bash
# Ensure dependencies are installed
pip install -r requirements.txt

# Check Python path
cd /home/user/agentic-flow/trading-system
python -c "from src.visualization import TradingViewCharts"
```

### Dashboard Not Starting

```bash
# Check port availability
# If 8050 is in use, specify different port:
python -c "from src.dashboard import TradingDashboard; TradingDashboard(port=8051).run()"
```

### Export Issues

```bash
# Install kaleido for image export
pip install kaleido

# Alternative: Use HTML export
fig.write_html('chart.html')
```

### Missing Data

Ensure your DataFrame has all required columns:
```python
required = ['timestamp', 'open', 'high', 'low', 'close', 'volume']
assert all(col in df.columns for col in required)
```

## Examples

See `/trading-system/src/demo.py` for complete examples:

- Candlestick charts with signals
- Volume analysis with patterns
- Economic indicator dashboards
- Backtesting visualization
- Real-time monitoring
- Sector analysis
- Fibonacci utilities

Run all demos:
```bash
python src/demo.py
```

## Documentation

- **Quick Start:** `docs/QUICK_START.md`
- **Full Guide:** `docs/VISUALIZATION_GUIDE.md`
- **Implementation:** `docs/IMPLEMENTATION_SUMMARY.md`
- **This README:** `docs/VISUALIZATION_README.md`

## Support

For detailed documentation and examples:
- Review demo script: `src/demo.py`
- Check visualization source: `src/visualization.py`
- Run dashboard: `python src/dashboard.py`
- Consult Plotly docs: https://plotly.com/python/

## Statistics

- **Total Lines:** 1,912 lines of code
- **Chart Types:** 8 comprehensive visualizations
- **Export Formats:** 5 (PNG/SVG/PDF/HTML/JSON)
- **Dashboard Tabs:** 6 interactive sections
- **Themes:** 2 (Dark/Light)
- **Demo Examples:** 7 complete demonstrations

## License

Part of the Fibonacci Trading System project.

---

**Ready to visualize your trading data!**

Start with: `python src/dashboard.py`

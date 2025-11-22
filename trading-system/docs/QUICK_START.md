# Quick Start Guide

## Installation

```bash
# Navigate to trading-system directory
cd /home/user/agentic-flow/trading-system

# Install dependencies
pip install -r requirements.txt

# For image export (optional)
pip install kaleido
```

## Run the Dashboard

```bash
# Start the interactive dashboard
python src/dashboard.py

# Access at: http://localhost:8050
```

The dashboard will start with:
- 6 interactive tabs
- Dark theme by default
- Sample data pre-loaded
- Real-time update capability

## Run Demos

```bash
# Generate all demo charts
python src/demo.py

# View generated HTML files in docs/ directory:
# - demo_candlestick.html
# - demo_volume.html
# - demo_indicators.html
# - demo_backtest.html
# - demo_realtime.html
# - demo_sectors.html
# - demo_correlation.html
```

## Using the Visualization Module

```python
from src.visualization import TradingViewCharts
import pandas as pd

# Initialize charts
charts = TradingViewCharts(theme='dark')

# Create your data
df = pd.DataFrame({
    'timestamp': [...],
    'open': [...],
    'high': [...],
    'low': [...],
    'close': [...],
    'volume': [...]
})

# Generate chart
fig = charts.candlestick_with_fibonacci(df, show_volume=True)

# Display
fig.show()

# Or export
fig.write_html('my_chart.html')
```

## Dashboard Features

### Tabs Available:
1. **Price Chart** - Candlestick with Fibonacci overlays
2. **Volume Analysis** - Log-scale volume with patterns
3. **Economic Indicators** - Multi-indicator dashboard
4. **Backtesting** - Strategy performance analysis
5. **Real-time Monitor** - Live ticker tracking
6. **Sector Analysis** - Heatmaps and correlations

### Controls:
- **Theme Toggle** - Switch between dark/light themes
- **Export Button** - Save charts as PNG/SVG/PDF/HTML
- **Real-time Toggle** - Enable live updates
- **Interactive Charts** - Zoom, pan, hover for details

## Chart Types

### 1. Candlestick Charts
```python
fig = charts.candlestick_with_fibonacci(
    df,
    show_volume=True,
    show_fibonacci=True,
    signals=signals_df
)
```

### 2. Volume Analysis
```python
fig = charts.volume_analysis(
    df,
    use_log_scale=True,
    show_fibonacci_levels=True
)
```

### 3. Economic Indicators
```python
indicators = {'GDP': df1, 'Inflation': df2}
fig = charts.economic_indicators_dashboard(indicators)
```

### 4. Backtesting Results
```python
fig = charts.backtesting_results(
    equity_curve,
    trades,
    metrics
)
```

### 5. Real-time Monitor
```python
tickers = {'AAPL': df1, 'GOOGL': df2}
alert_levels = {'AAPL': [150.0, 175.0]}
fig = charts.realtime_ticker_monitor(tickers, alert_levels)
```

### 6. Sector Heatmap
```python
fig = charts.sector_heatmap(sector_data)
```

### 7. Correlation Matrix
```python
fig = charts.correlation_matrix(
    correlation_data,
    use_zeckendorf_compression=True
)
```

## Fibonacci Utilities

```python
from src.visualization import FibonacciUtils

fib = FibonacciUtils()

# Generate Fibonacci numbers
numbers = fib.generate_fibonacci(20)

# Get retracement levels
levels = fib.fibonacci_retracement_levels()

# Zeckendorf decomposition
result = fib.zeckendorf_decompose(100)
# Returns: [89, 8, 3] (100 = 89 + 8 + 3)

# Lucas numbers for time markers
lucas = fib.lucas_numbers(10)
```

## Export Charts

```python
from src.visualization import ChartExporter

exporter = ChartExporter()

# PNG export (high resolution)
exporter.export_png(fig, 'chart.png', width=1920, height=1080)

# SVG export (vector graphics)
exporter.export_svg(fig, 'chart.svg')

# PDF export
exporter.export_pdf(fig, 'chart.pdf')

# HTML export (interactive)
exporter.export_html(fig, 'chart.html')

# JSON export (configuration)
exporter.export_json(fig, 'chart.json')
```

## Troubleshooting

### Import Error
```bash
# Ensure you're in the correct directory
cd /home/user/agentic-flow/trading-system

# Use proper import path
python -c "from src.visualization import TradingViewCharts"
```

### Dashboard Not Starting
```bash
# Check if port 8050 is available
# If not, use a different port:
python -c "from src.dashboard import TradingDashboard; TradingDashboard(port=8051).run()"
```

### Export Errors
```bash
# Install kaleido for image export
pip install kaleido

# Alternative: Use HTML export
fig.write_html('chart.html')
```

## Next Steps

1. Read the full documentation: `docs/VISUALIZATION_GUIDE.md`
2. Run the demo script: `python src/demo.py`
3. Start the dashboard: `python src/dashboard.py`
4. Customize for your data
5. Integrate with your trading system

## Support

For detailed API reference and examples, see:
- `/trading-system/docs/VISUALIZATION_GUIDE.md` - Complete documentation
- `/trading-system/src/demo.py` - Example implementations
- `/trading-system/src/visualization.py` - Source code with docstrings

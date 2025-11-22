# TradingView-Style Visualization System

High-quality interactive trading visualization system with Fibonacci overlays and Zeckendorf compression.

## Features

### 1. Candlestick Charts with Fibonacci Overlays
- **Interactive OHLCV Charts**: Professional candlestick charts with volume
- **Fibonacci Retracement Levels**: Automatic calculation at key levels (0.236, 0.382, 0.5, 0.618, 0.786, 1.618)
- **Support/Resistance Zones**: Visual identification of key price levels
- **Entry/Exit Signals**: Mark trading signals on the chart
- **Customizable Colors**: Bullish (green) and bearish (red) color schemes

### 2. Volume Analysis
- **Log-Space Encoding**: Logarithmic volume visualization for better pattern recognition
- **Fibonacci Volume Levels**: Volume-based support/resistance
- **Accumulation/Distribution**: Track institutional activity patterns
- **Cumulative Volume**: Running total with trend analysis
- **Color-Coded Bars**: Volume bars match price direction

### 3. Economic Indicator Dashboard
- **255+ Indicators**: Comprehensive economic data tracking
- **Category Organization**: Grouped by GDP, Inflation, Employment, Trade, etc.
- **Sector Heat Maps**: Visual performance comparison
- **Correlation Matrix**: Relationship analysis with Zeckendorf compression
- **Trend Detection**: Automatic bullish/bearish identification

### 4. Backtesting Results Visualization
- **Equity Curves**: Track portfolio performance over time
- **Drawdown Charts**: Visualize risk and recovery periods
- **Strategy Comparison**: Side-by-side performance analysis
- **Performance Metrics Dashboard**:
  - Total Return
  - Win Rate
  - Sharpe Ratio
  - Max Drawdown
  - Trade Statistics

### 5. Real-time Updates (Simulated)
- **Live Ticker Monitoring**: Track multiple assets simultaneously
- **Alert System**: Fibonacci-based price alerts
- **Regime Change Detection**: Lucas time markers for trend shifts
- **Auto-Refresh**: Configurable update intervals
- **Status Cards**: Quick overview of current prices

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# For image export functionality
pip install kaleido
```

## Quick Start

### Using the Visualization Module

```python
from visualization import TradingViewCharts, FibonacciUtils
import pandas as pd
import numpy as np

# Initialize charts
charts = TradingViewCharts(theme='dark')

# Create sample data
df = pd.DataFrame({
    'timestamp': pd.date_range('2024-01-01', periods=100, freq='D'),
    'open': 100 + np.cumsum(np.random.randn(100)),
    'high': 105 + np.cumsum(np.random.randn(100)),
    'low': 95 + np.cumsum(np.random.randn(100)),
    'close': 100 + np.cumsum(np.random.randn(100)),
    'volume': np.random.randint(1000000, 5000000, 100)
})

# Generate candlestick chart with Fibonacci
fig = charts.candlestick_with_fibonacci(
    df,
    show_volume=True,
    show_fibonacci=True
)

# Display or export
fig.show()
# Or export: fig.write_html('chart.html')
```

### Running the Dashboard

```bash
# Start the dashboard
python src/dashboard.py

# Access at http://localhost:8050
```

## Dashboard Features

### Theme Switching
- **Dark Theme**: Professional trading terminal appearance
- **Light Theme**: Clean, bright interface
- Toggle between themes with one click

### Responsive Design
- **Desktop**: Full-featured multi-panel layout
- **Tablet**: Optimized for touch interaction
- **Mobile**: Simplified single-column view

### Export Options
- **PNG**: High-resolution images (1920x1080)
- **SVG**: Vector graphics for presentations
- **PDF**: Publication-ready documents
- **HTML**: Interactive standalone files

### Interactive Controls
- **Zoom & Pan**: Investigate specific time periods
- **Hover Tooltips**: Detailed data on mouse-over
- **Legend Toggle**: Show/hide specific data series
- **Range Selector**: Quick time period selection

## Chart Types

### 1. Price Charts
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
indicators = {
    'GDP': gdp_df,
    'Inflation': inflation_df,
    'Employment': employment_df
}

fig = charts.economic_indicators_dashboard(indicators)
```

### 4. Sector Heatmap
```python
fig = charts.sector_heatmap(sector_data)
```

### 5. Correlation Matrix
```python
fig = charts.correlation_matrix(
    correlation_data,
    use_zeckendorf_compression=True
)
```

### 6. Backtesting Results
```python
fig = charts.backtesting_results(
    equity_curve,
    trades,
    metrics
)
```

### 7. Real-time Monitor
```python
tickers = {
    'AAPL': aapl_df,
    'GOOGL': googl_df
}

alert_levels = {
    'AAPL': [150.0, 175.0],
    'GOOGL': [2800.0, 3000.0]
}

fig = charts.realtime_ticker_monitor(tickers, alert_levels)
```

### 8. Regime Detection
```python
fig = charts.regime_detection_chart(
    df,
    regimes,
    lucas_markers=[5, 7, 12, 20, 33]
)
```

## Fibonacci Utilities

### Generate Fibonacci Numbers
```python
from visualization import FibonacciUtils

fib = FibonacciUtils()

# First 20 Fibonacci numbers
numbers = fib.generate_fibonacci(20)
# [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, ...]

# Standard retracement levels
levels = fib.fibonacci_retracement_levels()
# [0.0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.272, 1.618]
```

### Zeckendorf Decomposition
```python
# Decompose number into sum of non-consecutive Fibonacci numbers
result = fib.zeckendorf_decompose(100)
# [89, 8, 3] (100 = 89 + 8 + 3)
```

### Lucas Numbers
```python
# Generate Lucas numbers for time markers
lucas = fib.lucas_numbers(10)
# [2, 1, 3, 4, 7, 11, 18, 29, 47, 76]
```

## Exporting Charts

### Export to Image
```python
from visualization import ChartExporter

exporter = ChartExporter()

# PNG export
exporter.export_png(fig, 'chart.png', width=1920, height=1080)

# SVG export
exporter.export_svg(fig, 'chart.svg')

# PDF export
exporter.export_pdf(fig, 'chart.pdf')
```

### Export to HTML
```python
# Interactive HTML
exporter.export_html(fig, 'chart.html', include_plotlyjs='cdn')

# Standalone HTML (no internet required)
exporter.export_html(fig, 'chart_standalone.html', include_plotlyjs=True)
```

### Export Configuration
```python
# JSON export for reproducibility
exporter.export_json(fig, 'chart_config.json')
```

## Dashboard Tabs

### 1. Price Chart Tab
- Candlestick with Fibonacci overlays
- Volume subplot
- Buy/sell signals
- Interactive controls for toggling features

### 2. Volume Analysis Tab
- Volume bars with log scale
- Fibonacci volume levels
- Cumulative volume tracking
- Accumulation/distribution patterns

### 3. Economic Indicators Tab
- Multi-indicator dashboard
- Organized by category
- Trend visualization
- Real-time status badges

### 4. Backtesting Tab
- Equity curve analysis
- Drawdown visualization
- Trade distribution histogram
- Performance metrics table
- Win/loss ratio chart

### 5. Real-time Monitor Tab
- Live ticker prices
- Status cards for quick overview
- Fibonacci alert levels
- Multiple asset tracking

### 6. Sector Analysis Tab
- Sector performance heatmap
- Correlation matrix
- Zeckendorf-compressed tooltips
- Cross-sector analysis

## Customization

### Theme Colors
```python
# Dark theme colors
charts = TradingViewCharts(theme='dark')
# Background: #131722 (TradingView dark)
# Bullish: #26A69A (teal)
# Bearish: #EF5350 (red)

# Light theme colors
charts = TradingViewCharts(theme='light')
# Background: #FFFFFF
# Bullish: #26A69A (teal)
# Bearish: #EF5350 (red)
```

### Custom Fibonacci Levels
```python
# Modify retracement levels in your code
custom_levels = [0.0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.272, 1.414, 1.618, 2.618]

# Apply to chart generation
for level in custom_levels:
    price = high_price - (price_range * level)
    fig.add_hline(y=price, line_dash="dash")
```

## Performance Optimization

### Large Datasets
- Use `head_limit` parameter for initial display
- Implement data pagination for 10,000+ candles
- Enable WebGL for 3D charts

### Real-time Updates
- Adjust `update_interval` based on data frequency
- Use incremental updates instead of full reloads
- Cache unchanged data

### Export Optimization
- Use appropriate resolution for export format
- SVG for presentations (scalable)
- PNG for reports (specific size)
- HTML for interactive sharing

## Troubleshooting

### Chart Not Displaying
```python
# Ensure data has required columns
required_cols = ['timestamp', 'open', 'high', 'low', 'close', 'volume']
assert all(col in df.columns for col in required_cols)

# Check for NaN values
df = df.dropna()

# Verify timestamp format
df['timestamp'] = pd.to_datetime(df['timestamp'])
```

### Export Errors
```bash
# Install kaleido for image export
pip install kaleido

# If still failing, use HTML export
fig.write_html('chart.html')
```

### Dashboard Port Conflict
```python
# Change port if 8050 is in use
dashboard = TradingDashboard(theme='dark', port=8051)
```

## API Reference

### TradingViewCharts Class

#### Constructor
```python
TradingViewCharts(theme='dark')
```

#### Methods
- `candlestick_with_fibonacci(df, show_volume=True, show_fibonacci=True, signals=None)`
- `volume_analysis(df, use_log_scale=True, show_fibonacci_levels=True)`
- `economic_indicators_dashboard(indicators_data, categories=None)`
- `sector_heatmap(sector_data)`
- `correlation_matrix(correlation_data, use_zeckendorf_compression=True)`
- `backtesting_results(equity_curve, trades, metrics)`
- `realtime_ticker_monitor(ticker_data, alert_levels=None)`
- `regime_detection_chart(df, regimes, lucas_markers=None)`

### FibonacciUtils Class

#### Static Methods
- `generate_fibonacci(n)` - Generate first n Fibonacci numbers
- `fibonacci_retracement_levels()` - Standard retracement levels
- `zeckendorf_decompose(n)` - Decompose into Fibonacci sum
- `lucas_numbers(n)` - Generate Lucas sequence

### ChartExporter Class

#### Static Methods
- `export_png(fig, filename, width=1920, height=1080)`
- `export_svg(fig, filename)`
- `export_pdf(fig, filename)`
- `export_html(fig, filename, include_plotlyjs='cdn')`
- `export_json(fig, filename)`

## Examples

See the `/trading-system/examples` directory for:
- Complete trading strategy visualization
- Custom indicator implementation
- Multi-timeframe analysis
- Portfolio performance tracking
- Real-time data integration

## Support

For issues or questions:
- Check documentation in `/trading-system/docs`
- Review example code in `/trading-system/examples`
- Consult Plotly documentation: https://plotly.com/python/

## License

Part of the Fibonacci Trading System project.

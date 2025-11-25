# Waterfall Chart Visualization Module

**Agent 21** - Zeckendorf Address: `10000000100`
**Dependencies**: Agent 17
**Status**: ✅ Complete

## Overview

Professional-grade waterfall chart generator for trading system P&L analysis with TradingView-style aesthetics.

## Features

✨ **Multiple Chart Types**
- Cumulative P&L waterfall
- Strategy-by-strategy contribution
- GMV (Gross Market Value) tracking
- Combined interactive dashboard

🎨 **TradingView Aesthetic**
- Dark theme by default (light theme available)
- Professional color scheme
- Interactive zoom, pan, hover tooltips
- Responsive layouts

📊 **Chart Capabilities**
- Interactive Plotly visualizations
- HTML export (always available)
- PNG/PDF export (requires kaleido)
- Customizable dimensions
- Multiple data input formats (DataFrame or list of dicts)

## Quick Start

```python
from visualization import WaterfallChartGenerator

# Initialize generator
generator = WaterfallChartGenerator(theme='dark')

# Generate sample data
trades_df, strategy_totals, gmv_df = generator.generate_sample_data(
    num_trades=50,
    num_strategies=5,
    include_gmv=True
)

# Create cumulative waterfall
fig = generator.create_cumulative_waterfall(trades_df)
generator.save_chart(fig, 'cumulative_pnl.html')

# Create strategy contribution waterfall
fig2 = generator.create_strategy_contribution_waterfall(strategy_totals)
generator.save_chart(fig2, 'strategy_contribution.html')

# Create GMV tracking chart
fig3 = generator.create_gmv_tracking_chart(gmv_df)
generator.save_chart(fig3, 'gmv_tracking.html')

# Create combined dashboard
fig4 = generator.create_combined_dashboard(
    trades_df,
    strategy_totals,
    gmv_df
)
generator.save_chart(fig4, 'dashboard.html')
```

## Generated Charts

Run the demo to generate sample charts:

```bash
cd /home/user/agentic-flow/quantum-trading-system
python src/visualization/waterfall_charts.py
```

This creates 4 interactive HTML charts in `visualizations/charts/`:
1. `waterfall_cumulative.html` - Cumulative P&L over time
2. `waterfall_strategy.html` - Strategy contribution breakdown
3. `waterfall_gmv.html` - GMV tracking with cumulative P&L
4. `waterfall_dashboard.html` - Combined dashboard with all charts

## Testing

All tests passing (18/18):

```bash
pytest tests/test_waterfall_charts.py -v
```

**Test Coverage:**
- ✅ Initialization (dark/light themes)
- ✅ Cumulative waterfall creation
- ✅ Strategy contribution waterfall
- ✅ GMV tracking charts
- ✅ Combined dashboard
- ✅ Data format flexibility (DataFrame/list)
- ✅ Sample data generation
- ✅ Chart saving (HTML)
- ✅ Color scheme validation
- ✅ Empty data handling
- ✅ Large dataset handling
- ✅ Cumulative calculation accuracy
- ✅ Custom dimensions
- ✅ End-to-end workflow

## API Reference

### WaterfallChartGenerator

Main class for generating waterfall charts.

#### Methods

**`__init__(theme='dark')`**
- Initialize generator with color theme
- `theme`: 'dark' or 'light'

**`create_cumulative_waterfall(data, title, height, width)`**
- Create cumulative P&L waterfall chart
- `data`: DataFrame or list with 'timestamp', 'pnl', 'strategy'
- Returns: Plotly Figure

**`create_strategy_contribution_waterfall(strategy_data, title, height, width)`**
- Create strategy contribution waterfall
- `strategy_data`: Dict mapping strategy names to P&L values
- Returns: Plotly Figure

**`create_gmv_tracking_chart(data, title, height, width)`**
- Create GMV tracking chart with P&L
- `data`: DataFrame or list with 'timestamp', 'gmv', 'pnl'
- Returns: Plotly Figure

**`create_combined_dashboard(trades_data, strategy_totals, gmv_data, title, height, width)`**
- Create comprehensive dashboard with multiple charts
- Combines cumulative, strategy, and GMV charts
- Returns: Plotly Figure

**`save_chart(fig, output_path, format='html')`**
- Save chart to file
- `format`: 'html', 'png', 'jpg', 'svg', 'pdf'
- Returns: Path to saved file

**`generate_sample_data(num_trades, num_strategies, include_gmv)`** (static)
- Generate sample trading data for testing
- Returns: (trades_df, strategy_totals, gmv_df)

## Color Scheme

### Dark Theme (Default)
- **Positive P&L**: `#26A69A` (Teal)
- **Negative P&L**: `#EF5350` (Red)
- **Totals**: `#4A90E2` (Blue)
- **GMV**: `#FFD700` (Gold)
- **Background**: `#131722` (Dark)
- **Paper**: `#1E222D` (Dark Gray)

### Light Theme
- Same P&L colors
- **Background**: `#FFFFFF` (White)
- **Paper**: `#F8F9FA` (Light Gray)

## Data Format

### Trade Data (for cumulative waterfall)
```python
{
    'timestamp': '2024-01-01',  # datetime or string
    'pnl': 1250.50,             # float (positive or negative)
    'strategy': 'fibonacci_retracement'  # string
}
```

### Strategy Totals (for contribution waterfall)
```python
{
    'fibonacci_retracement': 15000.0,
    'lucas_timing': -2000.0,
    'momentum_integer': 8500.0
}
```

### GMV Data (for GMV tracking)
```python
{
    'timestamp': '2024-01-01',  # datetime or string
    'gmv': 105000.0,            # Gross Market Value
    'pnl': 1250.50              # P&L for the period
}
```

## Integration with Trading System

The waterfall charts integrate seamlessly with the quantum trading system:

1. **Read backtest results** from `results/` directory
2. **Extract trade data** and strategy performance
3. **Calculate GMV** from equity curves
4. **Generate waterfall charts** to visualize cumulative gains
5. **Export to HTML** for interactive analysis

Example integration:

```python
from pathlib import Path
import pandas as pd
from visualization import WaterfallChartGenerator

# Load backtest results
results_dir = Path('results')
trades = []
strategy_totals = {}

for result_file in results_dir.glob('*.json'):
    data = pd.read_json(result_file)
    # Extract trades and aggregate by strategy
    # ... processing logic ...

# Generate charts
generator = WaterfallChartGenerator()
fig = generator.create_combined_dashboard(
    trades_df,
    strategy_totals,
    gmv_df
)
generator.save_chart(fig, 'visualizations/charts/trading_waterfall.html')
```

## Dependencies

- `numpy` - Numerical computations
- `pandas` - Data manipulation
- `plotly` - Interactive charting
- `kaleido` - Static image export (optional)

## Performance

- Handles datasets up to 200+ trades efficiently
- Auto-sampling for large datasets (>20 trades in dashboard)
- Charts are ~4.7MB each (full Plotly.js embedded)
- Fast rendering in modern browsers

## Future Enhancements

Potential improvements:
- Real-time streaming charts
- Multi-currency support
- Benchmark comparison overlays
- Advanced filtering and drill-down
- Export to Excel with embedded charts
- Mobile-responsive layouts

## Author

**Agent 21** - Waterfall Charts Specialist
Zeckendorf Address: `10000000100`
Dependencies: Agent 17 (Data Infrastructure)

---

*Part of the Quantum Trading System - Integer-Only Framework*

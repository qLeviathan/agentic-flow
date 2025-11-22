# 📊 TradingView-Quality Visualization System

## Overview

Professional-grade trading visualization dashboard generator with TradingView aesthetics, Fibonacci analysis, and multi-ticker support.

## Quick Start

```bash
# Generate complete dashboard
python3 generate_visualizations.py

# View dashboard
# Open visualizations/dashboard.html in your browser
```

## Features

### 📈 Interactive Dashboard
- **Multi-ticker analysis** with tabbed interface
- **Dark theme** (TradingView professional aesthetic)
- **Interactive charts** with zoom, pan, hover tooltips
- **Export capabilities** (HTML, PNG, PDF)

### 🔢 Fibonacci Analysis
- **Retracement levels**: 0.236, 0.382, 0.5, 0.618, 0.786
- **Effectiveness heatmap**: Shows which levels work best
- **Strategy comparison**: Performance by Fibonacci level
- **Visual overlays**: On candlestick and price charts

### ⏰ Lucas Timing Analysis
- **Lucas sequence**: 2, 1, 3, 4, 7, 11, 18, 29, 47...
- **Timing accuracy**: Scatter plot of duration vs. return
- **Exit optimization**: Highlights Lucas number exits
- **Statistical validation**: Shows if timing improves performance

### 🔗 Advanced Features
- **Zeckendorf compression**: Correlation values as Fibonacci sums
- **Sector heatmaps**: Performance by sector and strategy
- **Correlation matrix**: Ticker correlations for diversification
- **AgentDB integration**: Historical strategy performance

## Dashboard Tabs

1. **Overview** - Portfolio performance, strategy comparison
2. **Fibonacci Analysis** - Level effectiveness heatmap
3. **Sector Performance** - Sector-strategy matrix
4. **Correlation** - Ticker correlations with Zeckendorf
5. **Lucas Timing** - Time-based exit analysis
6. **Individual Tickers** - Per-ticker comprehensive analysis

## Output Files

```
visualizations/
├── dashboard.html           # Interactive dashboard
└── charts/                  # Individual exports
    ├── overview.png
    ├── fibonacci_heatmap.png
    ├── sector_heatmap.png
    ├── correlation_matrix.png
    ├── lucas_timing.png
    └── {TICKER}_analysis.png
```

## Data Requirements

Place backtest results in `results/` directory:

**JSON Format:**
```json
{
  "TICKER_strategy": {
    "ticker": "AAPL",
    "strategy": "fibonacci_retracement",
    "equity_curve": [
      {"timestamp": "2024-01-01", "equity": 10000, "drawdown": 0}
    ],
    "trades": [
      {
        "entry_time": "2024-01-15",
        "exit_time": "2024-02-01",
        "entry_price": 150.0,
        "exit_price": 155.0,
        "pnl": 500.0,
        "return": 0.0333,
        "fibonacci_level": 0.618
      }
    ],
    "metrics": {
      "Total Return": "47.3%",
      "Sharpe Ratio": "2.15",
      "Max Drawdown": "-12.4%",
      "Win Rate": "68.3%"
    }
  }
}
```

## Performance Summary

Terminal displays ASCII summary:
```
╔══════════════════════════════════════════════════════╗
║          TRADING SYSTEM PERFORMANCE SUMMARY          ║
╠══════════════════════════════════════════════════════╣
║  Total Return:        +47.3%                         ║
║  Sharpe Ratio:        2.15                           ║
║  Max Drawdown:        -12.4%                         ║
║  Win Rate:            68.3%                          ║
║  Best Strategy:       Fibonacci Retracement (91.2%)  ║
║  Total Trades:        1,247                          ║
║  Avg Trade:           +1.8%                          ║
╚══════════════════════════════════════════════════════╝
```

## Dependencies

```bash
pip install plotly numpy pandas
```

**Optional (for PNG export):**
```bash
pip install kaleido
```

## Usage Examples

### Basic Usage
```python
from generate_visualizations import DashboardGenerator

gen = DashboardGenerator(theme='dark')
gen.generate_main_dashboard()
```

### Export Specific Chart
```python
fig = gen.create_fibonacci_effectiveness_heatmap()
fig.write_image('fibonacci.png', width=1920, height=1080)
```

### Custom Data
```python
gen.backtest_results = your_custom_data
gen.generate_main_dashboard()
```

## Documentation

- **Quick Start**: `docs/VISUALIZATION_QUICK_START.md`
- **Comprehensive Guide**: `docs/VISUALIZATION_GUIDE.md`
- **Code Examples**: `docs/VISUALIZATION_EXAMPLES.md`

## Chart Types

### Candlestick Charts
- OHLCV data with Fibonacci overlays
- Volume bars color-coded
- Entry/exit signal markers
- Interactive zoom and pan

### Equity Curves
- Multiple strategy comparison
- Drawdown visualization
- Fill-to-zero shading
- Hover tooltips

### Heatmaps
- Fibonacci level effectiveness
- Sector performance
- Color-coded (red=negative, green=positive)
- Text annotations

### Scatter Plots
- Lucas timing analysis
- Trade duration vs. return
- Marker customization
- Reference lines

## Customization

### Theme
```python
DashboardGenerator(theme='dark')  # or 'light'
```

### Chart Dimensions
```python
class Config:
    CHART_WIDTH = 1920
    CHART_HEIGHT = 1080
```

### Colors
```python
charts = TradingViewCharts(theme='dark')
charts.colors['bullish'] = '#00FF00'
```

## Integration

Works seamlessly with:
- `trading_system_mvp.py` - Main backtesting engine
- `src/backtesting_engine.py` - Backtesting framework
- `src/visualization.py` - Chart utilities
- AgentDB - Strategy history storage

## Troubleshooting

### No data available
- Run `python3 trading_system_mvp.py` first
- Or script generates sample data automatically

### Plotly not found
```bash
pip install plotly
```

### PNG export fails
- Install Chrome/Chromium for kaleido
- Or use HTML dashboard (fully functional)

## Performance Metrics

| Metric | Formula | Good Value |
|--------|---------|------------|
| Sharpe Ratio | (Return - RiskFree) / StdDev × √252 | > 2.0 |
| Win Rate | Wins / Total Trades × 100% | > 65% |
| Profit Factor | Gross Profits / Gross Losses | > 2.0 |
| Max Drawdown | Min(Equity - PeakEquity) / PeakEquity | < -10% |

## Advanced Features

### Zeckendorf Representation
Unique decomposition into non-consecutive Fibonacci numbers:
```
100 = 89 + 8 + 3 (Fibonacci indices: [4, 6, 11])
```

Visible in correlation matrix tooltips.

### Lucas Numbers
Natural time cycles for exit timing:
```
L₀=2, L₁=1, L₂=3, L₃=4, L₄=7, L₅=11, L₆=18...
```

Highlighted in scatter plots with star markers.

### Fibonacci Levels
Standard retracement levels:
```
0.0, 0.236, 0.382, 0.5, 0.618 (Golden Ratio), 0.786, 1.0, 1.272, 1.618
```

Overlaid on price charts as reference lines.

## Architecture

```
generate_visualizations.py
├── Config              - Configuration and paths
├── DataLoader          - Load backtest results, tickers, AgentDB
└── DashboardGenerator  - Generate all visualizations
    ├── create_overview_dashboard()
    ├── create_ticker_analysis()
    ├── create_fibonacci_effectiveness_heatmap()
    ├── create_sector_performance_heatmap()
    ├── create_correlation_matrix()
    ├── create_lucas_timing_analysis()
    └── generate_main_dashboard()
```

## Production Deployment

1. **Generate Results**: Run backtesting engine
2. **Create Dashboard**: `python3 generate_visualizations.py`
3. **Deploy HTML**: Upload `dashboard.html` to web server
4. **Share**: Send link or HTML file to stakeholders

## License

MIT License - See LICENSE file

---

**Generated by Agentic Flow Trading System**
*Powered by Fibonacci Mathematics and AI*

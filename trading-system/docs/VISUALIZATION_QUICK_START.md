# 📊 Visualization Quick Start Guide

## 5-Minute Setup

### 1. Install Dependencies
```bash
pip install plotly numpy pandas
```

### 2. Generate Dashboard
```bash
cd /home/user/agentic-flow/trading-system
python3 generate_visualizations.py
```

### 3. View Results
```bash
# Dashboard created at:
# visualizations/dashboard.html

# Open in browser (Linux)
xdg-open visualizations/dashboard.html

# Or use full path
firefox file:///home/user/agentic-flow/trading-system/visualizations/dashboard.html
```

---

## 📁 What You Get

```
visualizations/
├── dashboard.html          ← Main interactive dashboard
└── charts/                 ← Individual chart exports
    ├── overview.png
    ├── fibonacci_heatmap.png
    ├── sector_heatmap.png
    └── ...
```

---

## 🎨 Dashboard Tabs

| Tab | Description |
|-----|-------------|
| **📈 Overview** | Portfolio performance, strategy comparison, monthly returns |
| **🔢 Fibonacci Analysis** | Heatmap showing which Fibonacci levels work best |
| **🏢 Sector Performance** | Performance by sector and strategy |
| **🔗 Correlation** | Ticker correlation matrix with Zeckendorf compression |
| **⏰ Lucas Timing** | Trade duration vs. return with Lucas number highlights |
| **📊 AAPL, MSFT, etc.** | Individual ticker analysis (up to 5 tickers) |

---

## 🔢 Key Features

### Fibonacci Retracement Levels
Visualizes effectiveness of levels:
- **0.236** - Shallow retracement
- **0.382** - Common support/resistance
- **0.500** - Halfway point
- **0.618** - Golden ratio (most important)
- **0.786** - Deep retracement
- **1.000** - Full retracement

### Lucas Number Timing
Lucas sequence: **2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123...**

Dashboard shows if exits at Lucas number days perform better.

### Zeckendorf Compression
Every number as sum of non-consecutive Fibonacci numbers.

Example: `100 = 89 + 8 + 3`

Shown in correlation matrix tooltips.

---

## 📊 Performance Summary

Terminal output shows:
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

---

## 🎯 Common Tasks

### View Specific Ticker
Click on ticker tab (AAPL, MSFT, etc.) in dashboard

### Export Chart as Image
```python
from generate_visualizations import DashboardGenerator

gen = DashboardGenerator()
fig = gen.create_fibonacci_effectiveness_heatmap()
fig.write_image('my_chart.png', width=1920, height=1080)
```

### Use Light Theme
```python
from generate_visualizations import DashboardGenerator

gen = DashboardGenerator(theme='light')
gen.generate_main_dashboard()
```

### Add Your Own Data
Place backtest results JSON in `results/` directory:
```json
{
  "TICKER_strategy": {
    "ticker": "AAPL",
    "strategy": "fibonacci_retracement",
    "equity_curve": [...],
    "trades": [...],
    "metrics": {...}
  }
}
```

---

## 🐛 Quick Troubleshooting

### "plotly not found"
```bash
pip install plotly
```

### "No data available"
Dashboard generates sample data if no results exist.
Run backtesting first:
```bash
python3 trading_system_mvp.py
```

### PNG Export Fails
Install Chrome or skip PNG export:
```bash
# Install Chrome (if needed)
wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt-get update
sudo apt-get install google-chrome-stable

# Or just use HTML dashboard (still fully functional)
```

### Dashboard Not Opening
Use full file path:
```
file:///home/user/agentic-flow/trading-system/visualizations/dashboard.html
```

---

## 📈 Metrics Explained

| Metric | Good Value | Excellent Value |
|--------|-----------|-----------------|
| **Sharpe Ratio** | > 1.0 | > 2.0 |
| **Win Rate** | > 55% | > 65% |
| **Profit Factor** | > 1.5 | > 2.0 |
| **Max Drawdown** | < -20% | < -10% |
| **Total Return** | > 15%/yr | > 30%/yr |

---

## 🚀 Next Steps

1. **Analyze Results**: Review dashboard tabs to understand performance
2. **Optimize Strategies**: Focus on best-performing Fibonacci levels
3. **Diversify**: Use correlation matrix to build uncorrelated portfolio
4. **Risk Management**: Monitor drawdown charts, adjust position sizing
5. **Iterate**: Run more backtests, regenerate dashboard, compare

---

## 📚 More Documentation

- **Detailed Guide**: `docs/VISUALIZATION_GUIDE.md`
- **Code Examples**: `docs/VISUALIZATION_EXAMPLES.md`
- **Main README**: `README.md`
- **MVP Guide**: `MVP_README.md`

---

## 💡 Pro Tips

1. **Interactive Charts**: Hover over data points for detailed tooltips
2. **Zoom**: Click and drag to zoom into specific time periods
3. **Pan**: Hold shift and drag to pan across chart
4. **Reset**: Double-click to reset zoom
5. **Legend**: Click legend items to show/hide series
6. **Export**: Use browser print to PDF for reports

---

## 🎨 Customization

### Change Colors
Edit `generate_visualizations.py`:
```python
class Config:
    THEME = 'light'  # or 'dark'
```

### Add More Tickers to Tabs
Edit in `generate_main_dashboard()`:
```python
for ticker in tickers[:10]:  # Change 10 to more
    ticker_figs[ticker] = self.create_ticker_analysis(ticker)
```

### Modify Chart Size
```python
class Config:
    CHART_WIDTH = 3840   # 4K width
    CHART_HEIGHT = 2160  # 4K height
```

---

## ⚡ Performance Tips

- **Large Datasets**: Limit tickers to top 10-20 performers
- **Memory**: Close unused browser tabs when viewing dashboard
- **Speed**: Use sample data for testing, full data for production
- **Export**: PNG export is slow; use HTML for speed

---

## 📞 Support

**Issues?**
- Check `docs/VISUALIZATION_GUIDE.md` for detailed troubleshooting
- Review code examples in `docs/VISUALIZATION_EXAMPLES.md`
- Open GitHub issue if problem persists

---

**Generated by Agentic Flow Trading System**

*Happy Trading! 📈*

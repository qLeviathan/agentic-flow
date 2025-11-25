# Visualization Guide

**Creating Charts, Dashboards, and Visual Analytics**

---

## Table of Contents

1. [Overview](#overview)
2. [Phase Space Visualizations](#phase-space-visualizations)
3. [Backtest Dashboards](#backtest-dashboards)
4. [Performance Charts](#performance-charts)
5. [TradingView Integration](#tradingview-integration)
6. [Custom Visualizations](#custom-visualizations)

---

## Overview

The Quantum Trading System provides comprehensive visualization tools for:

- **Phase Space Dynamics**: Xi/Psi trajectories and coherence maps
- **Backtest Results**: Equity curves, drawdowns, trade distributions
- **Performance Analytics**: Sharpe ratios, win rates, P&L charts
- **TradingView Integration**: Pine Script generation for live charts

### Visualization Libraries

**Supported**:
- **Matplotlib**: Static charts (included)
- **Plotly**: Interactive HTML dashboards (included)
- **TradingView**: Pine Script export (included)
- **Custom**: Build your own with any Python visualization library

---

## Phase Space Visualizations

**Module**: `src.models.phase_portraits.py`

### Phase Space Trajectory

Visualize price dynamics in Xi/Psi phase space.

#### Create Trajectory Plot

```python
from src.models.xi_psi import XiPsiModel, SCALE
from src.models.phase_portraits import PhasePortraitVisualizer

# Initialize model
model = XiPsiModel(scale=SCALE)
prices = [100*SCALE, 105*SCALE, 110*SCALE, 108*SCALE, 112*SCALE]

# Evolve phase space
portrait = model.evolve_phase_space(prices, num_steps=len(prices))

# Create visualizer
viz = PhasePortraitVisualizer(scale=SCALE)

# Plot trajectory
viz.plot_trajectory(
    portrait=portrait,
    save_path='docs/phase_trajectory.png',
    title='Phase Space Trajectory',
    figsize=(12, 8)
)
```

**Output**: `docs/phase_trajectory.png`

**Features**:
- Xi (position) vs Psi (momentum) scatter plot
- Color-coded by coherence (hot = high, cold = low)
- Attractor points marked with stars
- Time evolution shown with arrows
- Separate time series plots for Xi and Psi

### Coherence Heatmap

Visualize quantum coherence across phase space.

```python
viz.plot_coherence_map(
    portrait=portrait,
    save_path='docs/coherence_map.png',
    title='Phase Space Coherence Map',
    grid_size=20
)
```

**Output**: `docs/coherence_map.png`

**Features**:
- 2D heatmap of coherence values
- Trajectory overlay in cyan
- Hot spots indicate stable regions
- Color bar showing coherence scale (0-1)

### State Distribution

Visualize phase state classifications over time.

```python
viz.plot_state_distribution(
    portrait=portrait,
    save_path='docs/state_distribution.png',
    title='Phase State Distribution'
)
```

**Output**: `docs/state_distribution.png`

**Features**:
- Pie chart of state distribution
- Time series of state evolution
- Lucas time axis
- Color coding: Bullish (green), Bearish (red), Ranging (yellow), Transitional (blue)

### Complete Phase Analysis

Generate all phase space visualizations at once:

```python
def create_complete_phase_analysis(prices, output_dir='docs'):
    """Generate all phase space visualizations."""
    import os

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Initialize model
    model = XiPsiModel(scale=SCALE)
    portrait = model.evolve_phase_space(prices, num_steps=len(prices))

    # Create visualizer
    viz = PhasePortraitVisualizer(scale=SCALE)

    # Generate all plots
    viz.plot_trajectory(portrait, f'{output_dir}/phase_trajectory.png')
    viz.plot_coherence_map(portrait, f'{output_dir}/coherence_map.png')
    viz.plot_state_distribution(portrait, f'{output_dir}/state_distribution.png')

    print(f"✅ Phase analysis complete: {output_dir}/")

# Usage
create_complete_phase_analysis(price_data, output_dir='results/phase_analysis')
```

---

## Backtest Dashboards

**Module**: `src.visualization.dashboard.py`

### Interactive HTML Dashboard

Create interactive Plotly dashboard with backtest results.

```python
from src.visualization.dashboard import create_backtest_dashboard
from src.backtesting.backtest_engine import BacktestEngine

# Run backtest
engine = BacktestEngine(initial_capital_cents=10000000)
result = engine.run_backtest(prices, strategy, "My Strategy")

# Create dashboard
create_backtest_dashboard(
    result=result,
    output_path='results/backtest_dashboard.html'
)

print("Dashboard created: results/backtest_dashboard.html")
# Open in browser to view interactive charts
```

**Dashboard Components**:

1. **Equity Curve**
   - Time series of account equity
   - Zoom and pan interactions
   - Hover tooltips with exact values

2. **Drawdown Chart**
   - Underwater equity curve
   - Maximum drawdown highlighted
   - Drawdown periods annotated

3. **Trade Distribution**
   - Win/loss histogram
   - P&L distribution
   - Statistical overlays

4. **Performance Metrics Table**
   - Total trades, win rate
   - Sharpe/Sortino ratios
   - Max drawdown, profit factor
   - All values formatted nicely

### Equity Curve (Matplotlib)

Create static equity curve chart:

```python
import matplotlib.pyplot as plt

def plot_equity_curve(result, save_path='equity_curve.png'):
    """Plot equity curve from backtest result."""
    plt.figure(figsize=(12, 6))

    # Convert to dollars
    equity_dollars = [e / 100 for e in result.equity_curve]

    plt.plot(equity_dollars, linewidth=2, color='#2E86AB')
    plt.title('Equity Curve', fontsize=16, fontweight='bold')
    plt.xlabel('Time (bars)', fontsize=12)
    plt.ylabel('Equity ($)', fontsize=12)
    plt.grid(True, alpha=0.3)

    # Add performance metrics
    final_equity = equity_dollars[-1]
    initial_equity = equity_dollars[0]
    total_return = ((final_equity - initial_equity) / initial_equity) * 100

    plt.text(
        0.02, 0.98,
        f'Final Equity: ${final_equity:,.2f}\n'
        f'Total Return: {total_return:.2f}%\n'
        f'Sharpe Ratio: {result.sharpe_ratio_scaled/1000:.3f}',
        transform=plt.gca().transAxes,
        verticalalignment='top',
        bbox=dict(boxstyle='round', facecolor='white', alpha=0.8)
    )

    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()

# Usage
plot_equity_curve(result, 'results/equity_curve.png')
```

### Drawdown Chart

```python
def plot_drawdown(result, save_path='drawdown.png'):
    """Plot drawdown chart."""
    plt.figure(figsize=(12, 6))

    # Calculate drawdown series
    equity = result.equity_curve
    peak = equity[0]
    drawdowns = []

    for e in equity:
        if e > peak:
            peak = e
        dd = (e - peak) / 100  # Convert to dollars
        drawdowns.append(dd)

    plt.fill_between(range(len(drawdowns)), drawdowns, 0,
                     color='#A23B72', alpha=0.6)
    plt.plot(drawdowns, linewidth=2, color='#A23B72')

    plt.title('Drawdown', fontsize=16, fontweight='bold')
    plt.xlabel('Time (bars)', fontsize=12)
    plt.ylabel('Drawdown ($)', fontsize=12)
    plt.grid(True, alpha=0.3)

    # Add max drawdown annotation
    max_dd_idx = drawdowns.index(min(drawdowns))
    max_dd_value = min(drawdowns)
    plt.annotate(
        f'Max DD: ${abs(max_dd_value):,.2f}',
        xy=(max_dd_idx, max_dd_value),
        xytext=(max_dd_idx, max_dd_value * 1.2),
        arrowprops=dict(arrowstyle='->', color='red', lw=2),
        fontsize=10,
        color='red',
        fontweight='bold'
    )

    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
```

---

## Performance Charts

### Win Rate and P&L Distribution

```python
def plot_trade_analysis(result, save_path='trade_analysis.png'):
    """Plot trade statistics."""
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))

    # 1. Win/Loss Pie Chart
    axes[0, 0].pie(
        [result.winning_trades, result.losing_trades],
        labels=['Winning', 'Losing'],
        colors=['#06D6A0', '#EF476F'],
        autopct='%1.1f%%',
        startangle=90
    )
    axes[0, 0].set_title('Win/Loss Distribution')

    # 2. P&L Histogram
    pnls = [t.pnl_cents / 100 for t in result.trades if t.action == 'SELL']
    axes[0, 1].hist(pnls, bins=20, color='#118AB2', alpha=0.7, edgecolor='black')
    axes[0, 1].axvline(0, color='red', linestyle='--', linewidth=2)
    axes[0, 1].set_title('P&L Distribution')
    axes[0, 1].set_xlabel('P&L ($)')
    axes[0, 1].set_ylabel('Frequency')

    # 3. Trade P&L Over Time
    cumulative_pnl = []
    cum_sum = 0
    for t in result.trades:
        if t.action == 'SELL':
            cum_sum += t.pnl_cents / 100
            cumulative_pnl.append(cum_sum)

    axes[1, 0].plot(cumulative_pnl, linewidth=2, color='#073B4C')
    axes[1, 0].set_title('Cumulative P&L')
    axes[1, 0].set_xlabel('Trade Number')
    axes[1, 0].set_ylabel('Cumulative P&L ($)')
    axes[1, 0].grid(True, alpha=0.3)

    # 4. Performance Metrics Table
    metrics_text = f"""
    Total Trades: {result.total_trades}
    Win Rate: {result.win_rate_scaled / 10:.1f}%
    Profit Factor: {result.profit_factor_scaled / 1000:.2f}
    Sharpe Ratio: {result.sharpe_ratio_scaled / 1000:.3f}
    Sortino Ratio: {result.sortino_ratio_scaled / 1000:.3f}
    Max Drawdown: ${result.max_drawdown_cents / 100:.2f}
    Total P&L: ${result.total_pnl_cents / 100:.2f}
    """

    axes[1, 1].text(0.1, 0.5, metrics_text, fontsize=12,
                   verticalalignment='center',
                   family='monospace')
    axes[1, 1].axis('off')

    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
```

### Rolling Sharpe Ratio

```python
def plot_rolling_sharpe(result, window=30, save_path='rolling_sharpe.png'):
    """Plot rolling Sharpe ratio."""
    # Calculate returns
    returns = []
    for i in range(1, len(result.equity_curve)):
        ret = ((result.equity_curve[i] - result.equity_curve[i-1]) * 1000) // result.equity_curve[i-1]
        returns.append(ret)

    # Calculate rolling Sharpe
    rolling_sharpe = []
    for i in range(window, len(returns)):
        window_returns = returns[i-window:i]
        mean_ret = sum(window_returns) // len(window_returns)
        variance = sum((r - mean_ret) ** 2 for r in window_returns) // len(window_returns)
        std_dev = int(variance ** 0.5)

        if std_dev > 0:
            sharpe = (mean_ret * 1000) // std_dev
        else:
            sharpe = 0

        rolling_sharpe.append(sharpe / 1000)  # Convert to float for plotting

    plt.figure(figsize=(12, 6))
    plt.plot(rolling_sharpe, linewidth=2, color='#F18F01')
    plt.axhline(0, color='black', linestyle='--', alpha=0.3)
    plt.axhline(1, color='green', linestyle='--', alpha=0.3, label='Sharpe = 1')
    plt.axhline(2, color='blue', linestyle='--', alpha=0.3, label='Sharpe = 2')

    plt.title(f'Rolling Sharpe Ratio ({window}-period)', fontsize=16, fontweight='bold')
    plt.xlabel('Time (bars)', fontsize=12)
    plt.ylabel('Sharpe Ratio', fontsize=12)
    plt.legend()
    plt.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()
```

---

## TradingView Integration

**Module**: `src.visualization.pine_script_generator.py`

### Generate Pine Script

Export Fibonacci levels to TradingView Pine Script:

```python
from src.visualization.pine_script_generator import PineScriptGenerator

# Initialize generator
generator = PineScriptGenerator()

# Generate Fibonacci retracement script
script = generator.generate_fibonacci_retracements(
    swing_high=150.00,
    swing_low=100.00,
    show_golden_pocket=True,
    show_extensions=True
)

# Save to file
with open('fib_retracements.pine', 'w') as f:
    f.write(script)

print("Pine Script saved: fib_retracements.pine")
print("Copy to TradingView: Chart > Pine Editor > Paste > Add to Chart")
```

**Generated Pine Script**:
```pine
//@version=5
indicator("Fibonacci Retracements", overlay=true)

// Swing points
swing_high = 150.00
swing_low = 100.00
range = swing_high - swing_low

// Retracement levels
level_236 = swing_high - (range * 0.236)
level_382 = swing_high - (range * 0.382)
level_500 = swing_high - (range * 0.500)
level_618 = swing_high - (range * 0.618)
level_786 = swing_high - (range * 0.786)

// Plot levels
plot(level_236, "23.6%", color=color.gray, linewidth=1)
plot(level_382, "38.2%", color=color.blue, linewidth=1)
plot(level_500, "50.0%", color=color.purple, linewidth=2)
plot(level_618, "61.8%", color=color.orange, linewidth=2)
plot(level_786, "78.6%", color=color.red, linewidth=1)

// Golden pocket
fill(plot(level_500, display=display.none), plot(level_618, display=display.none),
     color=color.new(color.yellow, 90), title="Golden Pocket")
```

### Lucas Time Markers

```python
script = generator.generate_lucas_time_markers(
    entry_date="2024-01-01",
    num_exits=5
)

with open('lucas_times.pine', 'w') as f:
    f.write(script)
```

**Features**:
- Vertical lines at Lucas time intervals
- Labels showing Lucas number
- Color-coded by interval length

---

## Custom Visualizations

### Create Custom Chart Class

```python
class CustomChartGenerator:
    """Generate custom trading charts."""

    def __init__(self, figsize=(12, 8)):
        self.figsize = figsize

    def plot_multi_timeframe(self, prices_dict, save_path='mtf.png'):
        """
        Plot multiple timeframes.

        Args:
            prices_dict: Dict of {timeframe: prices}
            save_path: Output file path
        """
        num_tf = len(prices_dict)
        fig, axes = plt.subplots(num_tf, 1, figsize=self.figsize)

        if num_tf == 1:
            axes = [axes]

        for idx, (tf, prices) in enumerate(prices_dict.items()):
            axes[idx].plot(prices, linewidth=2)
            axes[idx].set_title(f'{tf} Timeframe')
            axes[idx].grid(True, alpha=0.3)

        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()

    def plot_strategy_signals(self, prices, signals, save_path='signals.png'):
        """
        Plot price with entry/exit signals.

        Args:
            prices: List of prices
            signals: List of signal dicts
            save_path: Output path
        """
        plt.figure(figsize=self.figsize)

        # Plot prices
        plt.plot(prices, linewidth=2, color='black', label='Price')

        # Plot signals
        for signal in signals:
            if signal['action'] == 'BUY':
                plt.scatter(signal['timestamp'], signal['price'],
                           color='green', marker='^', s=200, label='Buy')
            elif signal['action'] == 'SELL':
                plt.scatter(signal['timestamp'], signal['price'],
                           color='red', marker='v', s=200, label='Sell')

        plt.title('Trading Signals', fontsize=16, fontweight='bold')
        plt.xlabel('Time')
        plt.ylabel('Price')
        plt.legend()
        plt.grid(True, alpha=0.3)

        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
```

### Example: Fibonacci Levels on Price Chart

```python
def plot_fibonacci_on_chart(prices, high_idx, low_idx, save_path='fib_chart.png'):
    """Plot Fibonacci retracements on price chart."""
    from src.encoders.fibonacci_encoder import FibonacciEncoder

    plt.figure(figsize=(14, 8))

    # Plot prices
    plt.plot(prices, linewidth=2, color='#2E86AB', label='Price')

    # Get swing points
    high = prices[high_idx]
    low = prices[low_idx]

    # Calculate retracements
    encoder = FibonacciEncoder()
    retracements = encoder.calculate_retracements(high, low)

    # Plot retracement levels
    colors = {
        'level_236': '#D3D3D3',
        'level_382': '#4A90E2',
        'level_500': '#9B59B6',
        'level_618': '#F39C12',
        'level_786': '#E74C3C'
    }

    for level_name, level_price in retracements.items():
        if 'golden_pocket' in level_name:
            continue
        color = colors.get(level_name, 'gray')
        ratio = level_name.split('_')[1]
        plt.axhline(level_price / 100, color=color, linestyle='--',
                   linewidth=2, alpha=0.7, label=f'{ratio[0]}.{ratio[1:]}%')

    # Mark swing points
    plt.scatter(high_idx, high / 100, color='green', s=300, marker='*',
               zorder=5, label='Swing High')
    plt.scatter(low_idx, low / 100, color='red', s=300, marker='*',
               zorder=5, label='Swing Low')

    # Highlight golden pocket
    pocket_high = retracements['golden_pocket_high'] / 100
    pocket_low = retracements['golden_pocket_low'] / 100
    plt.fill_between(range(len(prices)), pocket_low, pocket_high,
                     color='yellow', alpha=0.2, label='Golden Pocket')

    plt.title('Fibonacci Retracements', fontsize=16, fontweight='bold')
    plt.xlabel('Time (bars)', fontsize=12)
    plt.ylabel('Price ($)', fontsize=12)
    plt.legend(loc='best')
    plt.grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig(save_path, dpi=300, bbox_inches='tight')
    plt.close()

# Usage
plot_fibonacci_on_chart(
    prices=price_data,
    high_idx=50,
    low_idx=20,
    save_path='results/fib_on_chart.png'
)
```

---

## Best Practices

### Chart Design

1. **Clear Titles**: Use descriptive, bold titles
2. **Axis Labels**: Always label axes with units
3. **Legends**: Place legends where they don't obscure data
4. **Colors**: Use colorblind-friendly palettes
5. **Grid**: Add light grid for readability
6. **DPI**: Save at 300 DPI for publication quality

### Performance

1. **Limit Data Points**: Plot max 1000-2000 points for responsiveness
2. **Downsample**: Use binning for large datasets
3. **Cache Results**: Save generated charts, don't regenerate
4. **Batch Generation**: Create all charts in one script

### Interactivity

1. **Use Plotly**: For interactive HTML dashboards
2. **Add Tooltips**: Show exact values on hover
3. **Zoom/Pan**: Enable for detailed exploration
4. **Export Options**: Provide PNG/SVG download buttons

---

**For more information**:
- [Quick Start Guide](QUICK_START.md)
- [API Reference](API_REFERENCE.md)
- [Strategies Guide](STRATEGIES.md)

---

**Agent 30: Documentation Specialist**
**Last Updated**: 2025-11-25

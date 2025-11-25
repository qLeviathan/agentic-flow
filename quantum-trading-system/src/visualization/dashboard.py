"""
Interactive Dashboard - Agent 23 (Zeckendorf: 10000001000)

TradingView-style interactive dashboard for trading strategy analysis.
Provides comprehensive visualizations with real-time filtering and comparison.

Features:
- Selectable tickers and strategies
- Performance comparison charts
- Real-time filtering
- TradingView dark theme
- Export to PDF, PNG, HTML

All visualizations use integer-only arithmetic compatible data structures.
"""

from typing import Dict, List, Tuple, Optional, Any, Union
from dataclasses import dataclass
import json
from pathlib import Path
import sys

# Add parent directory for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    import plotly.graph_objects as go
    from plotly.subplots import make_subplots
    import plotly.express as px
    PLOTLY_AVAILABLE = True
except ImportError:
    PLOTLY_AVAILABLE = False
    print("Warning: plotly not installed. Install with: pip install plotly kaleido")

from backtesting.backtest_engine import BacktestResult, TradeLog
from backtesting.performance_analytics import PerformanceMetrics, DrawdownPeriod


# TradingView-style color scheme
TRADINGVIEW_THEME = {
    'background': '#131722',
    'paper': '#1E222D',
    'text': '#D1D4DC',
    'grid': '#363C4E',
    'green': '#089981',  # Bullish
    'red': '#F23645',    # Bearish
    'blue': '#2962FF',   # Primary
    'yellow': '#FFB74D', # Warning
    'purple': '#9C27B0', # Secondary
    'cyan': '#00BCD4',   # Info
}


@dataclass
class StrategyResult:
    """
    Container for strategy backtest results with metadata.
    """
    strategy_name: str
    ticker: str
    timeframe: str
    backtest_result: BacktestResult
    performance_metrics: PerformanceMetrics
    trade_logs: List[TradeLog]
    equity_curve: List[int]  # List of capital values in cents
    timestamps: List[int]    # Bar indices


class InteractiveDashboard:
    """
    Interactive TradingView-style dashboard for strategy analysis.

    Features:
    - Multi-ticker selection
    - Strategy performance comparison
    - Real-time filtering
    - Dark theme visualization
    - Export capabilities

    Example:
        >>> dashboard = InteractiveDashboard()
        >>> dashboard.add_strategy_result(strategy_result)
        >>> dashboard.create_performance_dashboard()
        >>> dashboard.export_html('dashboard.html')
    """

    def __init__(self, theme: Optional[Dict[str, str]] = None):
        """
        Initialize dashboard with optional custom theme.

        Args:
            theme: Custom color scheme (defaults to TradingView theme)
        """
        if not PLOTLY_AVAILABLE:
            raise ImportError(
                "plotly is required for dashboard. "
                "Install with: pip install plotly kaleido"
            )

        self.theme = theme or TRADINGVIEW_THEME
        self.strategy_results: Dict[str, StrategyResult] = {}
        self.selected_tickers: List[str] = []
        self.selected_strategies: List[str] = []
        self.current_figure: Optional[go.Figure] = None

    def add_strategy_result(
        self,
        strategy_name: str,
        ticker: str,
        timeframe: str,
        backtest_result: BacktestResult,
        performance_metrics: PerformanceMetrics,
        trade_logs: List[TradeLog],
        equity_curve: List[int],
        timestamps: Optional[List[int]] = None
    ) -> None:
        """
        Add a strategy result to the dashboard.

        Args:
            strategy_name: Name of the strategy
            ticker: Ticker symbol
            timeframe: Timeframe (e.g., '1D', '1H')
            backtest_result: Backtest results
            performance_metrics: Performance analytics
            trade_logs: List of trade executions
            equity_curve: Equity curve values in cents
            timestamps: Bar indices (generated if not provided)
        """
        if timestamps is None:
            timestamps = list(range(len(equity_curve)))

        key = f"{ticker}_{strategy_name}_{timeframe}"

        self.strategy_results[key] = StrategyResult(
            strategy_name=strategy_name,
            ticker=ticker,
            timeframe=timeframe,
            backtest_result=backtest_result,
            performance_metrics=performance_metrics,
            trade_logs=trade_logs,
            equity_curve=equity_curve,
            timestamps=timestamps
        )

        # Update selection lists
        if ticker not in self.selected_tickers:
            self.selected_tickers.append(ticker)
        if strategy_name not in self.selected_strategies:
            self.selected_strategies.append(strategy_name)

    def create_performance_dashboard(
        self,
        tickers: Optional[List[str]] = None,
        strategies: Optional[List[str]] = None,
        show_trades: bool = True
    ) -> go.Figure:
        """
        Create comprehensive performance dashboard.

        Args:
            tickers: List of tickers to display (all if None)
            strategies: List of strategies to display (all if None)
            show_trades: Whether to show individual trades

        Returns:
            Plotly figure with interactive dashboard
        """
        # Filter results
        filtered_results = self._filter_results(tickers, strategies)

        if not filtered_results:
            raise ValueError("No results match the filter criteria")

        # Create subplots
        fig = make_subplots(
            rows=3, cols=2,
            subplot_titles=(
                'Equity Curves Comparison',
                'Risk-Adjusted Returns',
                'Drawdown Analysis',
                'Win Rate & Profit Factor',
                'Trade Distribution',
                'Performance Metrics Heatmap'
            ),
            specs=[
                [{"type": "scatter"}, {"type": "bar"}],
                [{"type": "scatter"}, {"type": "bar"}],
                [{"type": "histogram"}, {"type": "indicator"}]
            ],
            vertical_spacing=0.12,
            horizontal_spacing=0.15
        )

        # Apply TradingView theme
        self._apply_theme(fig)

        # Plot equity curves
        self._plot_equity_curves(fig, filtered_results, show_trades, row=1, col=1)

        # Plot risk-adjusted returns
        self._plot_risk_adjusted_returns(fig, filtered_results, row=1, col=2)

        # Plot drawdown analysis
        self._plot_drawdown_analysis(fig, filtered_results, row=2, col=1)

        # Plot win rate and profit factor
        self._plot_win_profit_metrics(fig, filtered_results, row=2, col=2)

        # Plot trade distribution
        self._plot_trade_distribution(fig, filtered_results, row=3, col=1)

        # Add performance summary
        self._add_performance_summary(fig, filtered_results, row=3, col=2)

        # Update layout
        fig.update_layout(
            title={
                'text': 'Quantum Trading System - Performance Dashboard',
                'font': {'size': 24, 'color': self.theme['text']},
                'x': 0.5,
                'xanchor': 'center'
            },
            height=1400,
            showlegend=True,
            legend=dict(
                bgcolor=self.theme['paper'],
                bordercolor=self.theme['grid'],
                borderwidth=1,
                font=dict(color=self.theme['text'])
            ),
            hovermode='x unified'
        )

        self.current_figure = fig
        return fig

    def _filter_results(
        self,
        tickers: Optional[List[str]],
        strategies: Optional[List[str]]
    ) -> Dict[str, StrategyResult]:
        """Filter strategy results by tickers and strategies."""
        tickers = tickers or self.selected_tickers
        strategies = strategies or self.selected_strategies

        return {
            key: result
            for key, result in self.strategy_results.items()
            if result.ticker in tickers and result.strategy_name in strategies
        }

    def _apply_theme(self, fig: go.Figure) -> None:
        """Apply TradingView dark theme to figure."""
        fig.update_layout(
            plot_bgcolor=self.theme['background'],
            paper_bgcolor=self.theme['paper'],
            font=dict(color=self.theme['text'], family='Arial, sans-serif'),
        )

        fig.update_xaxes(
            gridcolor=self.theme['grid'],
            linecolor=self.theme['grid'],
            showgrid=True,
            zeroline=False
        )

        fig.update_yaxes(
            gridcolor=self.theme['grid'],
            linecolor=self.theme['grid'],
            showgrid=True,
            zeroline=False
        )

    def _plot_equity_curves(
        self,
        fig: go.Figure,
        results: Dict[str, StrategyResult],
        show_trades: bool,
        row: int,
        col: int
    ) -> None:
        """Plot equity curves with trade markers."""
        colors = [
            self.theme['blue'],
            self.theme['green'],
            self.theme['purple'],
            self.theme['cyan'],
            self.theme['yellow']
        ]

        for idx, (key, result) in enumerate(results.items()):
            color = colors[idx % len(colors)]

            # Convert equity curve from cents to dollars
            equity_dollars = [val / 100 for val in result.equity_curve]

            # Plot equity curve
            fig.add_trace(
                go.Scatter(
                    x=result.timestamps,
                    y=equity_dollars,
                    mode='lines',
                    name=f"{result.ticker} - {result.strategy_name}",
                    line=dict(color=color, width=2),
                    hovertemplate='<b>Bar %{x}</b><br>Capital: $%{y:,.2f}<extra></extra>'
                ),
                row=row, col=col
            )

            # Add trade markers if requested
            if show_trades:
                buy_trades = [t for t in result.trade_logs if t.action == 'BUY']
                sell_trades = [t for t in result.trade_logs if t.action == 'SELL']

                if buy_trades:
                    buy_x = [t.timestamp for t in buy_trades]
                    buy_y = [equity_dollars[min(t.timestamp, len(equity_dollars)-1)] for t in buy_trades]

                    fig.add_trace(
                        go.Scatter(
                            x=buy_x,
                            y=buy_y,
                            mode='markers',
                            name=f'Buy - {result.ticker}',
                            marker=dict(
                                symbol='triangle-up',
                                size=10,
                                color=self.theme['green'],
                                line=dict(width=1, color='white')
                            ),
                            showlegend=False,
                            hovertemplate='<b>BUY</b><br>Bar %{x}<br>Price: $%{y:,.2f}<extra></extra>'
                        ),
                        row=row, col=col
                    )

                if sell_trades:
                    sell_x = [t.timestamp for t in sell_trades]
                    sell_y = [equity_dollars[min(t.timestamp, len(equity_dollars)-1)] for t in sell_trades]

                    fig.add_trace(
                        go.Scatter(
                            x=sell_x,
                            y=sell_y,
                            mode='markers',
                            name=f'Sell - {result.ticker}',
                            marker=dict(
                                symbol='triangle-down',
                                size=10,
                                color=self.theme['red'],
                                line=dict(width=1, color='white')
                            ),
                            showlegend=False,
                            hovertemplate='<b>SELL</b><br>Bar %{x}<br>Price: $%{y:,.2f}<extra></extra>'
                        ),
                        row=row, col=col
                    )

        fig.update_xaxes(title_text="Time (bars)", row=row, col=col)
        fig.update_yaxes(title_text="Capital ($)", row=row, col=col)

    def _plot_risk_adjusted_returns(
        self,
        fig: go.Figure,
        results: Dict[str, StrategyResult],
        row: int,
        col: int
    ) -> None:
        """Plot risk-adjusted return metrics."""
        labels = []
        sharpe_values = []
        sortino_values = []
        calmar_values = []

        for key, result in results.items():
            label = f"{result.ticker}<br>{result.strategy_name}"
            labels.append(label)

            # Convert scaled values to decimal
            sharpe_values.append(result.performance_metrics.annualized_sharpe_scaled / 1000)
            sortino_values.append(result.performance_metrics.annualized_sortino_scaled / 1000)
            calmar_values.append(result.performance_metrics.calmar_ratio_scaled / 1000)

        # Add Sharpe ratio
        fig.add_trace(
            go.Bar(
                x=labels,
                y=sharpe_values,
                name='Sharpe Ratio',
                marker_color=self.theme['blue'],
                hovertemplate='<b>%{x}</b><br>Sharpe: %{y:.2f}<extra></extra>'
            ),
            row=row, col=col
        )

        # Add Sortino ratio
        fig.add_trace(
            go.Bar(
                x=labels,
                y=sortino_values,
                name='Sortino Ratio',
                marker_color=self.theme['green'],
                hovertemplate='<b>%{x}</b><br>Sortino: %{y:.2f}<extra></extra>'
            ),
            row=row, col=col
        )

        # Add Calmar ratio
        fig.add_trace(
            go.Bar(
                x=labels,
                y=calmar_values,
                name='Calmar Ratio',
                marker_color=self.theme['purple'],
                hovertemplate='<b>%{x}</b><br>Calmar: %{y:.2f}<extra></extra>'
            ),
            row=row, col=col
        )

        fig.update_xaxes(title_text="Strategy", row=row, col=col)
        fig.update_yaxes(title_text="Ratio", row=row, col=col)

    def _plot_drawdown_analysis(
        self,
        fig: go.Figure,
        results: Dict[str, StrategyResult],
        row: int,
        col: int
    ) -> None:
        """Plot drawdown analysis over time."""
        colors = [
            self.theme['red'],
            self.theme['yellow'],
            self.theme['purple'],
            self.theme['cyan'],
            self.theme['blue']
        ]

        for idx, (key, result) in enumerate(results.items()):
            color = colors[idx % len(colors)]

            # Calculate drawdown from equity curve
            equity_curve = result.equity_curve
            running_max = equity_curve[0]
            drawdowns = []

            for capital in equity_curve:
                running_max = max(running_max, capital)
                if running_max > 0:
                    drawdown_pct = ((running_max - capital) * 100) // running_max
                    drawdowns.append(-drawdown_pct)  # Negative for visual
                else:
                    drawdowns.append(0)

            fig.add_trace(
                go.Scatter(
                    x=result.timestamps,
                    y=drawdowns,
                    mode='lines',
                    name=f"{result.ticker} - {result.strategy_name}",
                    line=dict(color=color, width=2),
                    fill='tozeroy',
                    fillcolor=f'rgba{tuple(list(bytes.fromhex(color[1:])) + [51])}',  # 20% opacity
                    hovertemplate='<b>Bar %{x}</b><br>Drawdown: %{y}%<extra></extra>'
                ),
                row=row, col=col
            )

        fig.update_xaxes(title_text="Time (bars)", row=row, col=col)
        fig.update_yaxes(title_text="Drawdown (%)", row=row, col=col)

    def _plot_win_profit_metrics(
        self,
        fig: go.Figure,
        results: Dict[str, StrategyResult],
        row: int,
        col: int
    ) -> None:
        """Plot win rate and profit factor comparison."""
        labels = []
        win_rates = []
        profit_factors = []

        for key, result in results.items():
            label = f"{result.ticker}<br>{result.strategy_name}"
            labels.append(label)

            # Convert scaled values to percentages/decimals
            win_rates.append(result.backtest_result.win_rate_scaled / 10)  # To percentage
            profit_factors.append(result.performance_metrics.profit_factor_scaled / 1000)

        # Add win rate bars
        fig.add_trace(
            go.Bar(
                x=labels,
                y=win_rates,
                name='Win Rate (%)',
                marker_color=self.theme['green'],
                yaxis='y',
                hovertemplate='<b>%{x}</b><br>Win Rate: %{y:.1f}%<extra></extra>'
            ),
            row=row, col=col
        )

        # Add profit factor bars (on secondary axis)
        fig.add_trace(
            go.Bar(
                x=labels,
                y=profit_factors,
                name='Profit Factor',
                marker_color=self.theme['blue'],
                yaxis='y2',
                hovertemplate='<b>%{x}</b><br>Profit Factor: %{y:.2f}<extra></extra>'
            ),
            row=row, col=col
        )

        fig.update_xaxes(title_text="Strategy", row=row, col=col)
        fig.update_yaxes(title_text="Win Rate (%)", row=row, col=col)

    def _plot_trade_distribution(
        self,
        fig: go.Figure,
        results: Dict[str, StrategyResult],
        row: int,
        col: int
    ) -> None:
        """Plot trade P&L distribution histogram."""
        all_pnls = []
        strategy_labels = []

        for key, result in results.items():
            label = f"{result.ticker} - {result.strategy_name}"
            for trade in result.trade_logs:
                if trade.pnl_cents != 0:  # Skip neutral trades
                    all_pnls.append(trade.pnl_cents / 100)  # Convert to dollars
                    strategy_labels.append(label)

        if all_pnls:
            # Separate winning and losing trades
            wins = [pnl for pnl in all_pnls if pnl > 0]
            losses = [pnl for pnl in all_pnls if pnl < 0]

            if wins:
                fig.add_trace(
                    go.Histogram(
                        x=wins,
                        name='Winning Trades',
                        marker_color=self.theme['green'],
                        opacity=0.7,
                        nbinsx=20,
                        hovertemplate='P&L: $%{x:.2f}<br>Count: %{y}<extra></extra>'
                    ),
                    row=row, col=col
                )

            if losses:
                fig.add_trace(
                    go.Histogram(
                        x=losses,
                        name='Losing Trades',
                        marker_color=self.theme['red'],
                        opacity=0.7,
                        nbinsx=20,
                        hovertemplate='P&L: $%{x:.2f}<br>Count: %{y}<extra></extra>'
                    ),
                    row=row, col=col
                )

        fig.update_xaxes(title_text="P&L ($)", row=row, col=col)
        fig.update_yaxes(title_text="Trade Count", row=row, col=col)

    def _add_performance_summary(
        self,
        fig: go.Figure,
        results: Dict[str, StrategyResult],
        row: int,
        col: int
    ) -> None:
        """Add performance summary indicator."""
        # Calculate aggregate metrics
        total_trades = sum(r.backtest_result.total_trades for r in results.values())
        total_pnl = sum(r.backtest_result.total_pnl_cents for r in results.values())
        avg_sharpe = sum(
            r.performance_metrics.annualized_sharpe_scaled for r in results.values()
        ) // len(results) if results else 0

        summary_text = (
            f"<b>Portfolio Summary</b><br><br>"
            f"Total Strategies: {len(results)}<br>"
            f"Total Trades: {total_trades}<br>"
            f"Total P&L: ${total_pnl / 100:,.2f}<br>"
            f"Avg Sharpe: {avg_sharpe / 1000:.2f}"
        )

        fig.add_trace(
            go.Indicator(
                mode="number+delta",
                value=total_pnl / 100,
                title={"text": summary_text, "font": {"size": 14}},
                delta={'reference': 0, 'relative': False},
                number={'prefix': "$", 'font': {'size': 32}},
                domain={'x': [0, 1], 'y': [0, 1]}
            ),
            row=row, col=col
        )

    def create_strategy_comparison_table(
        self,
        tickers: Optional[List[str]] = None,
        strategies: Optional[List[str]] = None
    ) -> go.Figure:
        """
        Create comparison table of strategy metrics.

        Args:
            tickers: List of tickers to include
            strategies: List of strategies to include

        Returns:
            Plotly table figure
        """
        filtered_results = self._filter_results(tickers, strategies)

        if not filtered_results:
            raise ValueError("No results match the filter criteria")

        # Prepare table data
        headers = [
            'Ticker', 'Strategy', 'Total Trades', 'Win Rate',
            'Total P&L', 'Sharpe', 'Sortino', 'Max DD',
            'Profit Factor', 'Expectancy'
        ]

        rows = []
        for key, result in filtered_results.items():
            br = result.backtest_result
            pm = result.performance_metrics

            row = [
                result.ticker,
                result.strategy_name,
                br.total_trades,
                f"{br.win_rate_scaled / 10:.1f}%",
                f"${br.total_pnl_cents / 100:,.2f}",
                f"{pm.annualized_sharpe_scaled / 1000:.2f}",
                f"{pm.annualized_sortino_scaled / 1000:.2f}",
                f"{pm.max_drawdown_percent_scaled / 10:.1f}%",
                f"{pm.profit_factor_scaled / 1000:.2f}",
                f"${pm.expectancy_cents / 100:.2f}"
            ]
            rows.append(row)

        # Transpose for table
        cell_values = list(zip(*rows))

        fig = go.Figure(data=[go.Table(
            header=dict(
                values=headers,
                fill_color=self.theme['paper'],
                line_color=self.theme['grid'],
                font=dict(color=self.theme['text'], size=12),
                align='left'
            ),
            cells=dict(
                values=cell_values,
                fill_color=self.theme['background'],
                line_color=self.theme['grid'],
                font=dict(color=self.theme['text'], size=11),
                align='left',
                height=30
            )
        )])

        fig.update_layout(
            title={
                'text': 'Strategy Comparison Table',
                'font': {'size': 20, 'color': self.theme['text']},
                'x': 0.5,
                'xanchor': 'center'
            },
            paper_bgcolor=self.theme['paper'],
            plot_bgcolor=self.theme['background'],
            height=400
        )

        return fig

    def export_html(
        self,
        filepath: Union[str, Path],
        include_plotlyjs: bool = True
    ) -> None:
        """
        Export current dashboard to HTML file.

        Args:
            filepath: Output HTML file path
            include_plotlyjs: Whether to include plotly.js in HTML
        """
        if self.current_figure is None:
            raise ValueError("No dashboard created. Call create_performance_dashboard() first.")

        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)

        self.current_figure.write_html(
            str(filepath),
            include_plotlyjs=include_plotlyjs,
            config={'displayModeBar': True, 'displaylogo': False}
        )

        print(f"Dashboard exported to: {filepath}")

    def export_png(
        self,
        filepath: Union[str, Path],
        width: int = 1920,
        height: int = 1400
    ) -> None:
        """
        Export current dashboard to PNG image.

        Args:
            filepath: Output PNG file path
            width: Image width in pixels
            height: Image height in pixels

        Note:
            Requires kaleido: pip install kaleido
        """
        if self.current_figure is None:
            raise ValueError("No dashboard created. Call create_performance_dashboard() first.")

        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)

        try:
            self.current_figure.write_image(
                str(filepath),
                width=width,
                height=height,
                scale=2  # Higher quality
            )
            print(f"Dashboard exported to: {filepath}")
        except Exception as e:
            print(f"PNG export failed: {e}")
            print("Install kaleido with: pip install kaleido")

    def export_pdf(
        self,
        filepath: Union[str, Path],
        width: int = 11,  # inches
        height: int = 8.5  # inches
    ) -> None:
        """
        Export current dashboard to PDF.

        Args:
            filepath: Output PDF file path
            width: PDF width in inches
            height: PDF height in inches

        Note:
            Requires kaleido: pip install kaleido
        """
        if self.current_figure is None:
            raise ValueError("No dashboard created. Call create_performance_dashboard() first.")

        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)

        try:
            self.current_figure.write_image(
                str(filepath),
                width=width * 96,  # Convert to pixels (96 DPI)
                height=height * 96,
                format='pdf'
            )
            print(f"Dashboard exported to: {filepath}")
        except Exception as e:
            print(f"PDF export failed: {e}")
            print("Install kaleido with: pip install kaleido")

    def get_available_tickers(self) -> List[str]:
        """Get list of available tickers."""
        return sorted(list(set(
            result.ticker for result in self.strategy_results.values()
        )))

    def get_available_strategies(self) -> List[str]:
        """Get list of available strategies."""
        return sorted(list(set(
            result.strategy_name for result in self.strategy_results.values()
        )))

    def get_summary_statistics(
        self,
        tickers: Optional[List[str]] = None,
        strategies: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Get summary statistics for selected strategies.

        Args:
            tickers: List of tickers to include
            strategies: List of strategies to include

        Returns:
            Dictionary with aggregate statistics
        """
        filtered_results = self._filter_results(tickers, strategies)

        if not filtered_results:
            return {}

        total_trades = sum(r.backtest_result.total_trades for r in filtered_results.values())
        winning_trades = sum(r.backtest_result.winning_trades for r in filtered_results.values())
        total_pnl_cents = sum(r.backtest_result.total_pnl_cents for r in filtered_results.values())

        avg_sharpe = (
            sum(r.performance_metrics.annualized_sharpe_scaled for r in filtered_results.values())
            // len(filtered_results)
        )

        avg_sortino = (
            sum(r.performance_metrics.annualized_sortino_scaled for r in filtered_results.values())
            // len(filtered_results)
        )

        max_drawdown = max(
            r.performance_metrics.max_drawdown_percent_scaled
            for r in filtered_results.values()
        )

        return {
            'num_strategies': len(filtered_results),
            'total_trades': total_trades,
            'winning_trades': winning_trades,
            'win_rate_pct': (winning_trades * 1000 // total_trades) / 10 if total_trades > 0 else 0,
            'total_pnl': f"${total_pnl_cents / 100:,.2f}",
            'avg_sharpe': avg_sharpe / 1000,
            'avg_sortino': avg_sortino / 1000,
            'max_drawdown_pct': max_drawdown / 10,
        }


def create_sample_dashboard() -> InteractiveDashboard:
    """
    Create a sample dashboard with mock data for demonstration.

    Returns:
        Configured InteractiveDashboard instance
    """
    from backtesting.backtest_engine import BacktestResult
    from backtesting.performance_analytics import PerformanceMetrics

    dashboard = InteractiveDashboard()

    # Sample equity curve (growing from $10,000 to $15,000)
    equity_curve = [1000000 + i * 200 for i in range(100)]  # In cents

    # Sample trade logs
    sample_trades = [
        TradeLog(
            trade_id=i,
            timestamp=i * 2,
            action='BUY' if i % 2 == 0 else 'SELL',
            price_cents=15000 + (i * 50),
            position_size=10,
            strategy_name='Fibonacci',
            pnl_cents=10000 if i % 3 != 0 else -5000
        )
        for i in range(50)
    ]

    # Sample backtest result
    backtest_result = BacktestResult(
        total_trades=50,
        winning_trades=32,
        losing_trades=18,
        win_rate_scaled=640,  # 64%
        total_pnl_cents=500000,  # $5,000
        gross_profit_cents=800000,
        gross_loss_cents=300000,
        average_win_cents=25000,
        average_loss_cents=16666,
        largest_win_cents=100000,
        largest_loss_cents=50000,
        sharpe_ratio_scaled=1800,
        sortino_ratio_scaled=2200,
        profit_factor_scaled=2666,
        max_drawdown_cents=80000,
        max_drawdown_percent_scaled=80,
        final_capital_cents=1500000,
        initial_capital_cents=1000000,
        peak_capital_cents=1520000,
        trades=sample_trades,
        equity_curve=equity_curve,
        total_commission_cents=5000,
        strategy_name='Fibonacci'
    )

    # Sample performance metrics
    performance_metrics = PerformanceMetrics(
        sharpe_ratio_scaled=1800,
        annualized_sharpe_scaled=2854,
        sortino_ratio_scaled=2200,
        annualized_sortino_scaled=3492,
        max_drawdown_cents=80000,
        max_drawdown_percent_scaled=80,
        max_drawdown_duration_bars=15,
        average_drawdown_cents=30000,
        average_drawdown_duration_bars=5,
        calmar_ratio_scaled=6250,
        mar_ratio_scaled=6250,
        sterling_ratio_scaled=16666,
        win_rate_scaled=640,
        win_loss_ratio_scaled=1500,
        profit_factor_scaled=2666,
        gross_profit_cents=800000,
        gross_loss_cents=300000,
        expectancy_cents=10000,
        kelly_criterion_scaled=320,
        max_consecutive_wins=8,
        max_consecutive_losses=4,
        current_streak=2,
        median_win_cents=22000,
        median_loss_cents=14000,
        win_std_dev=8000,
        loss_std_dev=5000,
        average_recovery_bars=10,
        max_recovery_bars=25,
        total_return_percent_scaled=500,  # 50%
        annualized_return_scaled=1200  # 120%
    )

    # Add sample results
    dashboard.add_strategy_result(
        strategy_name='Fibonacci',
        ticker='AAPL',
        timeframe='1D',
        backtest_result=backtest_result,
        performance_metrics=performance_metrics,
        trade_logs=sample_trades,
        equity_curve=equity_curve
    )

    return dashboard


if __name__ == '__main__':
    # Demo usage
    print("Creating sample dashboard...")
    dashboard = create_sample_dashboard()

    print("\nGenerating performance dashboard...")
    fig = dashboard.create_performance_dashboard()

    print("\nExporting to HTML...")
    dashboard.export_html('/home/user/agentic-flow/quantum-trading-system/docs/sample_dashboard.html')

    print("\nDashboard created successfully!")
    print(f"Available tickers: {dashboard.get_available_tickers()}")
    print(f"Available strategies: {dashboard.get_available_strategies()}")

    summary = dashboard.get_summary_statistics()
    print(f"\nSummary Statistics:")
    for key, value in summary.items():
        print(f"  {key}: {value}")

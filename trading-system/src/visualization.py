"""
TradingView-Style Visualization System
High-quality interactive charts with Fibonacci overlays and Zeckendorf compression
"""

import numpy as np
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.express as px
from typing import List, Dict, Tuple, Optional, Union
from datetime import datetime, timedelta
import warnings

warnings.filterwarnings('ignore')


class FibonacciUtils:
    """Fibonacci and Zeckendorf utilities for trading analysis"""

    @staticmethod
    def generate_fibonacci(n: int) -> List[int]:
        """Generate first n Fibonacci numbers"""
        if n <= 0:
            return []
        elif n == 1:
            return [1]
        elif n == 2:
            return [1, 1]

        fib = [1, 1]
        for i in range(2, n):
            fib.append(fib[i-1] + fib[i-2])
        return fib

    @staticmethod
    def fibonacci_retracement_levels() -> List[float]:
        """Standard Fibonacci retracement levels"""
        return [0.0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.272, 1.618]

    @staticmethod
    def zeckendorf_decompose(n: int) -> List[int]:
        """Decompose number into Zeckendorf representation (sum of non-consecutive Fibonacci numbers)"""
        if n <= 0:
            return []

        # Generate Fibonacci numbers up to n
        fib = [1, 2]
        while fib[-1] < n:
            fib.append(fib[-1] + fib[-2])

        result = []
        for f in reversed(fib):
            if f <= n:
                result.append(f)
                n -= f

        return sorted(result)

    @staticmethod
    def lucas_numbers(n: int) -> List[int]:
        """Generate first n Lucas numbers for time markers"""
        if n <= 0:
            return []
        elif n == 1:
            return [2]
        elif n == 2:
            return [2, 1]

        lucas = [2, 1]
        for i in range(2, n):
            lucas.append(lucas[i-1] + lucas[i-2])
        return lucas


class TradingViewCharts:
    """TradingView-style chart generation with Plotly"""

    def __init__(self, theme: str = 'dark'):
        """
        Initialize chart generator

        Args:
            theme: 'dark' or 'light' theme
        """
        self.theme = theme
        self.fib_utils = FibonacciUtils()
        self._setup_theme()

    def _setup_theme(self):
        """Setup color schemes for themes"""
        if self.theme == 'dark':
            self.colors = {
                'background': '#131722',
                'paper': '#1E222D',
                'text': '#D1D4DC',
                'grid': '#2A2E39',
                'bullish': '#26A69A',
                'bearish': '#EF5350',
                'volume': '#4A90E2',
                'fibonacci': ['#FF6B6B', '#FFA500', '#FFD700', '#90EE90', '#4169E1', '#9370DB'],
                'signal_buy': '#26A69A',
                'signal_sell': '#EF5350'
            }
        else:
            self.colors = {
                'background': '#FFFFFF',
                'paper': '#F8F9FA',
                'text': '#2E3238',
                'grid': '#E1E3E8',
                'bullish': '#26A69A',
                'bearish': '#EF5350',
                'volume': '#4A90E2',
                'fibonacci': ['#FF6B6B', '#FFA500', '#FFD700', '#90EE90', '#4169E1', '#9370DB'],
                'signal_buy': '#26A69A',
                'signal_sell': '#EF5350'
            }

    def candlestick_with_fibonacci(
        self,
        df: pd.DataFrame,
        show_volume: bool = True,
        show_fibonacci: bool = True,
        signals: Optional[pd.DataFrame] = None
    ) -> go.Figure:
        """
        Create candlestick chart with Fibonacci overlays

        Args:
            df: DataFrame with columns ['timestamp', 'open', 'high', 'low', 'close', 'volume']
            show_volume: Show volume subplot
            show_fibonacci: Show Fibonacci retracement levels
            signals: Optional DataFrame with columns ['timestamp', 'type', 'price'] for entry/exit signals

        Returns:
            Plotly figure
        """
        # Create subplots
        rows = 2 if show_volume else 1
        row_heights = [0.7, 0.3] if show_volume else [1.0]

        fig = make_subplots(
            rows=rows,
            cols=1,
            shared_xaxes=True,
            vertical_spacing=0.03,
            row_heights=row_heights,
            subplot_titles=('Price Chart', 'Volume') if show_volume else ('Price Chart',)
        )

        # Candlestick chart
        candlestick = go.Candlestick(
            x=df['timestamp'],
            open=df['open'],
            high=df['high'],
            low=df['low'],
            close=df['close'],
            name='Price',
            increasing_line_color=self.colors['bullish'],
            decreasing_line_color=self.colors['bearish'],
            increasing_fillcolor=self.colors['bullish'],
            decreasing_fillcolor=self.colors['bearish']
        )
        fig.add_trace(candlestick, row=1, col=1)

        # Fibonacci retracement levels
        if show_fibonacci and len(df) > 0:
            high_price = df['high'].max()
            low_price = df['low'].min()
            price_range = high_price - low_price

            fib_levels = self.fib_utils.fibonacci_retracement_levels()

            for i, level in enumerate(fib_levels):
                price = high_price - (price_range * level)
                color = self.colors['fibonacci'][i % len(self.colors['fibonacci'])]

                fig.add_hline(
                    y=price,
                    line_dash="dash",
                    line_color=color,
                    line_width=1,
                    opacity=0.5,
                    annotation_text=f"Fib {level:.3f}",
                    annotation_position="right",
                    row=1, col=1
                )

        # Add entry/exit signals
        if signals is not None and len(signals) > 0:
            buy_signals = signals[signals['type'] == 'buy']
            sell_signals = signals[signals['type'] == 'sell']

            if len(buy_signals) > 0:
                fig.add_trace(
                    go.Scatter(
                        x=buy_signals['timestamp'],
                        y=buy_signals['price'],
                        mode='markers',
                        marker=dict(
                            symbol='triangle-up',
                            size=15,
                            color=self.colors['signal_buy'],
                            line=dict(width=2, color='white')
                        ),
                        name='Buy Signal',
                        hovertemplate='<b>Buy Signal</b><br>Price: %{y:.2f}<br>Time: %{x}<extra></extra>'
                    ),
                    row=1, col=1
                )

            if len(sell_signals) > 0:
                fig.add_trace(
                    go.Scatter(
                        x=sell_signals['timestamp'],
                        y=sell_signals['price'],
                        mode='markers',
                        marker=dict(
                            symbol='triangle-down',
                            size=15,
                            color=self.colors['signal_sell'],
                            line=dict(width=2, color='white')
                        ),
                        name='Sell Signal',
                        hovertemplate='<b>Sell Signal</b><br>Price: %{y:.2f}<br>Time: %{x}<extra></extra>'
                    ),
                    row=1, col=1
                )

        # Volume chart
        if show_volume:
            colors = [
                self.colors['bullish'] if close >= open_price else self.colors['bearish']
                for close, open_price in zip(df['close'], df['open'])
            ]

            volume_bar = go.Bar(
                x=df['timestamp'],
                y=df['volume'],
                name='Volume',
                marker_color=colors,
                opacity=0.7,
                hovertemplate='<b>Volume</b><br>%{y:,.0f}<br>%{x}<extra></extra>'
            )
            fig.add_trace(volume_bar, row=2, col=1)

        # Update layout
        fig.update_layout(
            title='TradingView-Style Price Chart with Fibonacci Levels',
            xaxis_title='Time',
            yaxis_title='Price',
            template='plotly_dark' if self.theme == 'dark' else 'plotly_white',
            hovermode='x unified',
            height=800,
            showlegend=True,
            xaxis_rangeslider_visible=False,
            plot_bgcolor=self.colors['background'],
            paper_bgcolor=self.colors['paper'],
            font=dict(color=self.colors['text'])
        )

        # Update axes
        fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor=self.colors['grid'])
        fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor=self.colors['grid'])

        return fig

    def volume_analysis(
        self,
        df: pd.DataFrame,
        use_log_scale: bool = True,
        show_fibonacci_levels: bool = True
    ) -> go.Figure:
        """
        Create volume analysis chart with log-space encoding

        Args:
            df: DataFrame with columns ['timestamp', 'volume', 'close', 'open']
            use_log_scale: Use logarithmic scale for volume
            show_fibonacci_levels: Show Fibonacci volume levels

        Returns:
            Plotly figure
        """
        fig = make_subplots(
            rows=2,
            cols=1,
            shared_xaxes=True,
            vertical_spacing=0.03,
            row_heights=[0.5, 0.5],
            subplot_titles=('Volume Distribution', 'Cumulative Volume')
        )

        # Volume bars with color coding
        colors = [
            self.colors['bullish'] if close >= open_price else self.colors['bearish']
            for close, open_price in zip(df['close'], df['open'])
        ]

        fig.add_trace(
            go.Bar(
                x=df['timestamp'],
                y=df['volume'],
                name='Volume',
                marker_color=colors,
                opacity=0.8,
                hovertemplate='<b>Volume</b><br>%{y:,.0f}<br>%{x}<extra></extra>'
            ),
            row=1, col=1
        )

        # Fibonacci volume levels
        if show_fibonacci_levels and len(df) > 0:
            max_volume = df['volume'].max()
            fib_levels = self.fib_utils.fibonacci_retracement_levels()

            for i, level in enumerate(fib_levels):
                volume_level = max_volume * level
                color = self.colors['fibonacci'][i % len(self.colors['fibonacci'])]

                fig.add_hline(
                    y=volume_level,
                    line_dash="dot",
                    line_color=color,
                    line_width=1,
                    opacity=0.5,
                    annotation_text=f"V-Fib {level:.2f}",
                    annotation_position="right",
                    row=1, col=1
                )

        # Cumulative volume
        cumulative_volume = df['volume'].cumsum()

        fig.add_trace(
            go.Scatter(
                x=df['timestamp'],
                y=cumulative_volume,
                mode='lines',
                name='Cumulative Volume',
                line=dict(color=self.colors['volume'], width=2),
                fill='tozeroy',
                fillcolor=f"rgba(74, 144, 226, 0.3)",
                hovertemplate='<b>Cumulative</b><br>%{y:,.0f}<br>%{x}<extra></extra>'
            ),
            row=2, col=1
        )

        # Update layout
        fig.update_layout(
            title='Volume Analysis with Fibonacci Levels',
            template='plotly_dark' if self.theme == 'dark' else 'plotly_white',
            hovermode='x unified',
            height=700,
            showlegend=True,
            plot_bgcolor=self.colors['background'],
            paper_bgcolor=self.colors['paper'],
            font=dict(color=self.colors['text'])
        )

        # Update y-axes
        if use_log_scale:
            fig.update_yaxes(type="log", row=1, col=1)

        fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor=self.colors['grid'])
        fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor=self.colors['grid'])

        return fig

    def economic_indicators_dashboard(
        self,
        indicators_data: Dict[str, pd.DataFrame],
        categories: Optional[List[str]] = None
    ) -> go.Figure:
        """
        Create economic indicators dashboard with organized categories

        Args:
            indicators_data: Dictionary mapping indicator names to DataFrames with ['timestamp', 'value']
            categories: Optional list of category names for organization

        Returns:
            Plotly figure
        """
        num_indicators = len(indicators_data)
        cols = 3
        rows = (num_indicators + cols - 1) // cols

        fig = make_subplots(
            rows=rows,
            cols=cols,
            subplot_titles=list(indicators_data.keys()),
            vertical_spacing=0.08,
            horizontal_spacing=0.05
        )

        indicator_names = list(indicators_data.keys())

        for idx, (name, data) in enumerate(indicators_data.items()):
            row = idx // cols + 1
            col = idx % cols + 1

            # Determine color based on trend
            if len(data) > 1:
                trend = data['value'].iloc[-1] - data['value'].iloc[0]
                color = self.colors['bullish'] if trend >= 0 else self.colors['bearish']
            else:
                color = self.colors['volume']

            fig.add_trace(
                go.Scatter(
                    x=data['timestamp'],
                    y=data['value'],
                    mode='lines',
                    name=name,
                    line=dict(color=color, width=2),
                    fill='tozeroy',
                    fillcolor=f"rgba{tuple(list(int(color.lstrip('#')[i:i+2], 16) for i in (0, 2, 4)) + [0.2])}",
                    showlegend=False,
                    hovertemplate=f'<b>{name}</b><br>%{{y:.2f}}<br>%{{x}}<extra></extra>'
                ),
                row=row, col=col
            )

        # Update layout
        fig.update_layout(
            title='Economic Indicators Dashboard (255 Indicators)',
            template='plotly_dark' if self.theme == 'dark' else 'plotly_white',
            height=300 * rows,
            showlegend=False,
            plot_bgcolor=self.colors['background'],
            paper_bgcolor=self.colors['paper'],
            font=dict(color=self.colors['text'], size=10)
        )

        fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor=self.colors['grid'])
        fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor=self.colors['grid'])

        return fig

    def sector_heatmap(
        self,
        sector_data: pd.DataFrame
    ) -> go.Figure:
        """
        Create sector performance heatmap

        Args:
            sector_data: DataFrame with columns ['sector', 'subsector', 'performance']

        Returns:
            Plotly figure
        """
        # Pivot data for heatmap
        pivot_data = sector_data.pivot_table(
            values='performance',
            index='sector',
            columns='subsector',
            aggfunc='mean'
        )

        fig = go.Figure(data=go.Heatmap(
            z=pivot_data.values,
            x=pivot_data.columns,
            y=pivot_data.index,
            colorscale='RdYlGn',
            hovertemplate='<b>%{y}</b><br>%{x}<br>Performance: %{z:.2f}%<extra></extra>',
            colorbar=dict(title='Performance %')
        ))

        fig.update_layout(
            title='Sector Performance Heat Map',
            template='plotly_dark' if self.theme == 'dark' else 'plotly_white',
            height=600,
            plot_bgcolor=self.colors['background'],
            paper_bgcolor=self.colors['paper'],
            font=dict(color=self.colors['text'])
        )

        return fig

    def correlation_matrix(
        self,
        correlation_data: pd.DataFrame,
        use_zeckendorf_compression: bool = True
    ) -> go.Figure:
        """
        Create correlation matrix with Zeckendorf compression visualization

        Args:
            correlation_data: Correlation matrix DataFrame
            use_zeckendorf_compression: Show Zeckendorf-compressed values in tooltips

        Returns:
            Plotly figure
        """
        # Create hover text with Zeckendorf decomposition
        if use_zeckendorf_compression:
            hover_text = []
            for i in range(len(correlation_data)):
                hover_row = []
                for j in range(len(correlation_data.columns)):
                    value = correlation_data.iloc[i, j]
                    # Convert correlation to integer for Zeckendorf (scale by 1000)
                    scaled_value = int(abs(value) * 1000)
                    zeck = self.fib_utils.zeckendorf_decompose(scaled_value)
                    hover_row.append(
                        f"{correlation_data.index[i]} vs {correlation_data.columns[j]}<br>"
                        f"Correlation: {value:.3f}<br>"
                        f"Zeckendorf: {zeck}"
                    )
                hover_text.append(hover_row)
        else:
            hover_text = None

        fig = go.Figure(data=go.Heatmap(
            z=correlation_data.values,
            x=correlation_data.columns,
            y=correlation_data.index,
            colorscale='RdBu',
            zmid=0,
            text=hover_text,
            hovertemplate='%{text}<extra></extra>' if hover_text else None,
            colorbar=dict(title='Correlation')
        ))

        fig.update_layout(
            title='Correlation Matrix with Zeckendorf Compression',
            template='plotly_dark' if self.theme == 'dark' else 'plotly_white',
            height=700,
            width=700,
            plot_bgcolor=self.colors['background'],
            paper_bgcolor=self.colors['paper'],
            font=dict(color=self.colors['text'])
        )

        return fig

    def backtesting_results(
        self,
        equity_curve: pd.DataFrame,
        trades: pd.DataFrame,
        metrics: Dict[str, float]
    ) -> go.Figure:
        """
        Create comprehensive backtesting results visualization

        Args:
            equity_curve: DataFrame with ['timestamp', 'equity', 'drawdown']
            trades: DataFrame with ['entry_time', 'exit_time', 'pnl', 'return']
            metrics: Dictionary of performance metrics

        Returns:
            Plotly figure
        """
        fig = make_subplots(
            rows=3,
            cols=2,
            subplot_titles=(
                'Equity Curve',
                'Drawdown Chart',
                'Trade Returns Distribution',
                'Cumulative Returns',
                'Win/Loss Ratio',
                'Performance Metrics'
            ),
            specs=[
                [{"type": "scatter"}, {"type": "scatter"}],
                [{"type": "histogram"}, {"type": "scatter"}],
                [{"type": "bar"}, {"type": "table"}]
            ],
            vertical_spacing=0.1,
            horizontal_spacing=0.1
        )

        # 1. Equity Curve
        fig.add_trace(
            go.Scatter(
                x=equity_curve['timestamp'],
                y=equity_curve['equity'],
                mode='lines',
                name='Equity',
                line=dict(color=self.colors['bullish'], width=2),
                fill='tozeroy',
                fillcolor=f"rgba(38, 166, 154, 0.2)",
                hovertemplate='<b>Equity</b><br>$%{y:,.2f}<br>%{x}<extra></extra>'
            ),
            row=1, col=1
        )

        # 2. Drawdown Chart
        fig.add_trace(
            go.Scatter(
                x=equity_curve['timestamp'],
                y=equity_curve['drawdown'] * 100,
                mode='lines',
                name='Drawdown',
                line=dict(color=self.colors['bearish'], width=2),
                fill='tozeroy',
                fillcolor=f"rgba(239, 83, 80, 0.2)",
                hovertemplate='<b>Drawdown</b><br>%{y:.2f}%<br>%{x}<extra></extra>'
            ),
            row=1, col=2
        )

        # 3. Trade Returns Distribution
        fig.add_trace(
            go.Histogram(
                x=trades['return'] * 100,
                nbinsx=30,
                name='Returns',
                marker_color=self.colors['volume'],
                opacity=0.7,
                hovertemplate='<b>Return Range</b><br>%{x:.2f}%<br>Count: %{y}<extra></extra>'
            ),
            row=2, col=1
        )

        # 4. Cumulative Returns
        cumulative_returns = (1 + trades['return']).cumprod() - 1
        fig.add_trace(
            go.Scatter(
                x=list(range(len(cumulative_returns))),
                y=cumulative_returns * 100,
                mode='lines',
                name='Cumulative Return',
                line=dict(color=self.colors['bullish'], width=2),
                hovertemplate='<b>Cumulative Return</b><br>%{y:.2f}%<br>Trade #%{x}<extra></extra>'
            ),
            row=2, col=2
        )

        # 5. Win/Loss Ratio
        wins = len(trades[trades['pnl'] > 0])
        losses = len(trades[trades['pnl'] < 0])

        fig.add_trace(
            go.Bar(
                x=['Wins', 'Losses'],
                y=[wins, losses],
                marker_color=[self.colors['bullish'], self.colors['bearish']],
                text=[wins, losses],
                textposition='auto',
                hovertemplate='<b>%{x}</b><br>Count: %{y}<extra></extra>'
            ),
            row=3, col=1
        )

        # 6. Performance Metrics Table
        metrics_df = pd.DataFrame(list(metrics.items()), columns=['Metric', 'Value'])

        fig.add_trace(
            go.Table(
                header=dict(
                    values=['<b>Metric</b>', '<b>Value</b>'],
                    fill_color=self.colors['grid'],
                    font=dict(color=self.colors['text'], size=12),
                    align='left'
                ),
                cells=dict(
                    values=[metrics_df['Metric'], metrics_df['Value']],
                    fill_color=self.colors['paper'],
                    font=dict(color=self.colors['text'], size=11),
                    align='left'
                )
            ),
            row=3, col=2
        )

        # Update layout
        fig.update_layout(
            title='Backtesting Results Dashboard',
            template='plotly_dark' if self.theme == 'dark' else 'plotly_white',
            height=1000,
            showlegend=False,
            plot_bgcolor=self.colors['background'],
            paper_bgcolor=self.colors['paper'],
            font=dict(color=self.colors['text'])
        )

        # Update axes
        fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor=self.colors['grid'])
        fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor=self.colors['grid'])

        return fig

    def realtime_ticker_monitor(
        self,
        ticker_data: Dict[str, pd.DataFrame],
        alert_levels: Optional[Dict[str, List[float]]] = None
    ) -> go.Figure:
        """
        Create real-time ticker monitoring dashboard

        Args:
            ticker_data: Dictionary mapping ticker symbols to DataFrames with ['timestamp', 'price']
            alert_levels: Optional dictionary mapping tickers to Fibonacci alert levels

        Returns:
            Plotly figure
        """
        num_tickers = len(ticker_data)

        fig = make_subplots(
            rows=num_tickers,
            cols=1,
            shared_xaxes=True,
            vertical_spacing=0.05,
            subplot_titles=list(ticker_data.keys())
        )

        for idx, (ticker, data) in enumerate(ticker_data.items(), 1):
            # Price line
            fig.add_trace(
                go.Scatter(
                    x=data['timestamp'],
                    y=data['price'],
                    mode='lines',
                    name=ticker,
                    line=dict(width=2),
                    hovertemplate=f'<b>{ticker}</b><br>Price: $%{{y:.2f}}<br>%{{x}}<extra></extra>'
                ),
                row=idx, col=1
            )

            # Add alert levels if provided
            if alert_levels and ticker in alert_levels:
                for level in alert_levels[ticker]:
                    fig.add_hline(
                        y=level,
                        line_dash="dash",
                        line_color="orange",
                        line_width=1,
                        opacity=0.6,
                        annotation_text=f"Alert: ${level:.2f}",
                        annotation_position="right",
                        row=idx, col=1
                    )

        # Update layout
        fig.update_layout(
            title='Real-Time Ticker Monitor with Fibonacci Alerts',
            template='plotly_dark' if self.theme == 'dark' else 'plotly_white',
            hovermode='x unified',
            height=300 * num_tickers,
            showlegend=False,
            plot_bgcolor=self.colors['background'],
            paper_bgcolor=self.colors['paper'],
            font=dict(color=self.colors['text'])
        )

        fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor=self.colors['grid'])
        fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor=self.colors['grid'])

        return fig

    def regime_detection_chart(
        self,
        df: pd.DataFrame,
        regimes: pd.Series,
        lucas_markers: Optional[List[int]] = None
    ) -> go.Figure:
        """
        Create regime detection chart with Lucas time markers

        Args:
            df: DataFrame with ['timestamp', 'close']
            regimes: Series with regime labels (e.g., 'bull', 'bear', 'neutral')
            lucas_markers: Optional list of Lucas number indices for time markers

        Returns:
            Plotly figure
        """
        fig = go.Figure()

        # Color map for regimes
        regime_colors = {
            'bull': self.colors['bullish'],
            'bear': self.colors['bearish'],
            'neutral': self.colors['volume']
        }

        # Plot price with regime-based coloring
        for regime in regimes.unique():
            mask = regimes == regime
            regime_df = df[mask]

            fig.add_trace(
                go.Scatter(
                    x=regime_df['timestamp'],
                    y=regime_df['close'],
                    mode='lines',
                    name=f'{regime.capitalize()} Regime',
                    line=dict(color=regime_colors.get(regime, self.colors['text']), width=2),
                    hovertemplate=f'<b>{regime.capitalize()}</b><br>Price: $%{{y:.2f}}<br>%{{x}}<extra></extra>'
                )
            )

        # Add Lucas number time markers
        if lucas_markers:
            lucas_nums = self.fib_utils.lucas_numbers(len(lucas_markers))
            for idx in lucas_markers:
                if idx < len(df):
                    fig.add_vline(
                        x=df['timestamp'].iloc[idx],
                        line_dash="dot",
                        line_color="yellow",
                        line_width=1,
                        opacity=0.5,
                        annotation_text=f"L{idx}",
                        annotation_position="top"
                    )

        # Update layout
        fig.update_layout(
            title='Market Regime Detection with Lucas Time Markers',
            xaxis_title='Time',
            yaxis_title='Price',
            template='plotly_dark' if self.theme == 'dark' else 'plotly_white',
            hovermode='x unified',
            height=600,
            showlegend=True,
            plot_bgcolor=self.colors['background'],
            paper_bgcolor=self.colors['paper'],
            font=dict(color=self.colors['text'])
        )

        fig.update_xaxes(showgrid=True, gridwidth=1, gridcolor=self.colors['grid'])
        fig.update_yaxes(showgrid=True, gridwidth=1, gridcolor=self.colors['grid'])

        return fig


class ChartExporter:
    """Export charts in various formats"""

    @staticmethod
    def export_png(fig: go.Figure, filename: str, width: int = 1920, height: int = 1080):
        """Export chart as PNG"""
        fig.write_image(filename, width=width, height=height)

    @staticmethod
    def export_svg(fig: go.Figure, filename: str):
        """Export chart as SVG"""
        fig.write_image(filename, format='svg')

    @staticmethod
    def export_pdf(fig: go.Figure, filename: str):
        """Export chart as PDF"""
        fig.write_image(filename, format='pdf')

    @staticmethod
    def export_html(fig: go.Figure, filename: str, include_plotlyjs: str = 'cdn'):
        """Export chart as interactive HTML"""
        fig.write_html(filename, include_plotlyjs=include_plotlyjs)

    @staticmethod
    def export_json(fig: go.Figure, filename: str):
        """Export chart configuration as JSON"""
        import json
        with open(filename, 'w') as f:
            json.dump(fig.to_dict(), f, indent=2)


# Example usage and testing
if __name__ == '__main__':
    # Generate sample data
    np.random.seed(42)
    dates = pd.date_range(start='2024-01-01', periods=100, freq='D')

    # Sample price data
    df_price = pd.DataFrame({
        'timestamp': dates,
        'open': 100 + np.cumsum(np.random.randn(100) * 2),
        'high': 105 + np.cumsum(np.random.randn(100) * 2),
        'low': 95 + np.cumsum(np.random.randn(100) * 2),
        'close': 100 + np.cumsum(np.random.randn(100) * 2),
        'volume': np.random.randint(1000000, 5000000, 100)
    })

    # Create visualizations
    charts = TradingViewCharts(theme='dark')

    # 1. Candlestick with Fibonacci
    fig1 = charts.candlestick_with_fibonacci(df_price, show_volume=True, show_fibonacci=True)

    # 2. Volume analysis
    fig2 = charts.volume_analysis(df_price, use_log_scale=True, show_fibonacci_levels=True)

    print("Visualization module loaded successfully!")
    print(f"Created {len(FibonacciUtils.generate_fibonacci(20))} Fibonacci numbers")
    print(f"Available chart types: candlestick, volume_analysis, economic_indicators, backtesting, realtime_monitor")

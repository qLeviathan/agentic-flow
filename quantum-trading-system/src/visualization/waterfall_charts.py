#!/usr/bin/env python3
"""
Waterfall Chart Generator for Trading System
============================================

Creates professional waterfall charts showing:
- Cumulative gains over time
- Strategy-by-strategy contribution to total P&L
- GMV (Gross Market Value) tracking
- Interactive Plotly visualizations
- Dark theme (TradingView aesthetic)

Features:
- Multiple chart types (cumulative, by-strategy, GMV)
- Interactive zoom, pan, and hover tooltips
- Export to HTML and static images
- Customizable color schemes
- Real-time performance tracking

Author: Agent 21 (Zeckendorf: 10000000100)
Dependencies: Agent 17
"""

import warnings
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any, Union
from datetime import datetime, timedelta
from collections import defaultdict

import numpy as np
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots

warnings.filterwarnings('ignore')


class WaterfallChartGenerator:
    """
    Generate waterfall charts for trading system performance analysis.

    Waterfall charts visualize cumulative changes over time, perfect for
    showing how different strategies contribute to overall portfolio performance.
    """

    # TradingView color scheme
    COLORS = {
        'positive': '#26A69A',  # Teal for gains
        'negative': '#EF5350',  # Red for losses
        'total': '#4A90E2',     # Blue for totals
        'gmv': '#FFD700',       # Gold for GMV
        'background': '#131722',
        'paper': '#1E222D',
        'text': '#D1D4DC',
        'grid': '#2A2E39'
    }

    def __init__(self, theme: str = 'dark'):
        """
        Initialize WaterfallChartGenerator.

        Args:
            theme: Color theme ('dark' or 'light')
        """
        self.theme = theme
        self._setup_theme()

    def _setup_theme(self):
        """Configure theme settings"""
        if self.theme == 'dark':
            self.template = 'plotly_dark'
        else:
            self.template = 'plotly_white'
            # Override colors for light theme
            self.COLORS.update({
                'background': '#FFFFFF',
                'paper': '#F8F9FA',
                'text': '#2E3238',
                'grid': '#E1E3E8'
            })

    def create_cumulative_waterfall(
        self,
        data: Union[pd.DataFrame, List[Dict[str, Any]]],
        title: str = "Cumulative P&L Waterfall",
        height: int = 600,
        width: Optional[int] = None
    ) -> go.Figure:
        """
        Create cumulative P&L waterfall chart.

        Args:
            data: DataFrame or list of dicts with 'timestamp', 'pnl', 'strategy' columns
            title: Chart title
            height: Chart height in pixels
            width: Chart width in pixels (None for auto)

        Returns:
            Plotly Figure object
        """
        # Convert to DataFrame if needed
        if isinstance(data, list):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        # Ensure timestamp is datetime
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])

        # Sort by timestamp
        df = df.sort_values('timestamp')

        # Calculate cumulative P&L
        df['cumulative_pnl'] = df['pnl'].cumsum()

        # Create waterfall data
        x_labels = []
        y_values = []
        text_values = []
        colors = []

        # Initial value (starting capital)
        x_labels.append('Start')
        y_values.append(0)
        text_values.append('$0')
        colors.append(self.COLORS['total'])

        cumulative = 0
        for idx, row in df.iterrows():
            pnl = row['pnl']
            cumulative += pnl

            # Determine label
            if 'strategy' in row:
                label = f"{row['strategy'][:15]}"
            elif 'timestamp' in row:
                label = row['timestamp'].strftime('%Y-%m-%d')
            else:
                label = f"Trade {idx}"

            x_labels.append(label)
            y_values.append(pnl)
            text_values.append(f"${pnl:,.0f}")

            # Color based on positive/negative
            if pnl >= 0:
                colors.append(self.COLORS['positive'])
            else:
                colors.append(self.COLORS['negative'])

        # Final total
        x_labels.append('Total')
        y_values.append(cumulative)
        text_values.append(f"${cumulative:,.0f}")
        colors.append(self.COLORS['total'])

        # Create waterfall chart
        fig = go.Figure()

        fig.add_trace(go.Waterfall(
            name="P&L",
            orientation="v",
            measure=["absolute"] + ["relative"] * (len(y_values) - 2) + ["total"],
            x=x_labels,
            y=y_values,
            text=text_values,
            textposition="outside",
            connector={"line": {"color": self.COLORS['grid'], "width": 2, "dash": "dot"}},
            decreasing={"marker": {"color": self.COLORS['negative']}},
            increasing={"marker": {"color": self.COLORS['positive']}},
            totals={"marker": {"color": self.COLORS['total']}}
        ))

        # Update layout
        fig.update_layout(
            title=title,
            template=self.template,
            height=height,
            width=width,
            showlegend=False,
            plot_bgcolor=self.COLORS['background'],
            paper_bgcolor=self.COLORS['paper'],
            font=dict(color=self.COLORS['text'], size=12),
            xaxis=dict(
                title="",
                tickangle=-45,
                gridcolor=self.COLORS['grid']
            ),
            yaxis=dict(
                title="P&L ($)",
                gridcolor=self.COLORS['grid']
            ),
            hovermode='x unified'
        )

        return fig

    def create_strategy_contribution_waterfall(
        self,
        strategy_data: Dict[str, float],
        title: str = "Strategy Contribution to Total P&L",
        height: int = 600,
        width: Optional[int] = None
    ) -> go.Figure:
        """
        Create waterfall chart showing each strategy's contribution.

        Args:
            strategy_data: Dict mapping strategy names to P&L values
            title: Chart title
            height: Chart height in pixels
            width: Chart width in pixels (None for auto)

        Returns:
            Plotly Figure object
        """
        # Sort strategies by P&L (largest to smallest)
        sorted_strategies = sorted(
            strategy_data.items(),
            key=lambda x: abs(x[1]),
            reverse=True
        )

        # Build waterfall data
        x_labels = ['Start']
        y_values = [0]
        text_values = ['$0']

        total_pnl = 0
        for strategy, pnl in sorted_strategies:
            total_pnl += pnl
            x_labels.append(strategy.replace('_', ' ').title())
            y_values.append(pnl)
            text_values.append(f"${pnl:,.0f}")

        # Add total
        x_labels.append('Total P&L')
        y_values.append(total_pnl)
        text_values.append(f"${total_pnl:,.0f}")

        # Create figure
        fig = go.Figure()

        fig.add_trace(go.Waterfall(
            name="Strategy P&L",
            orientation="v",
            measure=["absolute"] + ["relative"] * (len(y_values) - 2) + ["total"],
            x=x_labels,
            y=y_values,
            text=text_values,
            textposition="outside",
            connector={"line": {"color": self.COLORS['grid'], "width": 2, "dash": "dot"}},
            decreasing={"marker": {"color": self.COLORS['negative']}},
            increasing={"marker": {"color": self.COLORS['positive']}},
            totals={"marker": {"color": self.COLORS['total']}}
        ))

        # Update layout
        fig.update_layout(
            title=title,
            template=self.template,
            height=height,
            width=width,
            showlegend=False,
            plot_bgcolor=self.COLORS['background'],
            paper_bgcolor=self.COLORS['paper'],
            font=dict(color=self.COLORS['text'], size=12),
            xaxis=dict(
                title="Strategy",
                tickangle=-45,
                gridcolor=self.COLORS['grid']
            ),
            yaxis=dict(
                title="P&L Contribution ($)",
                gridcolor=self.COLORS['grid']
            ),
            hovermode='x unified'
        )

        return fig

    def create_gmv_tracking_chart(
        self,
        data: Union[pd.DataFrame, List[Dict[str, Any]]],
        title: str = "GMV (Gross Market Value) Tracking",
        height: int = 600,
        width: Optional[int] = None
    ) -> go.Figure:
        """
        Create chart tracking Gross Market Value over time.

        Args:
            data: DataFrame or list of dicts with 'timestamp', 'gmv', 'pnl' columns
            title: Chart title
            height: Chart height in pixels
            width: Chart width in pixels (None for auto)

        Returns:
            Plotly Figure object
        """
        # Convert to DataFrame if needed
        if isinstance(data, list):
            df = pd.DataFrame(data)
        else:
            df = data.copy()

        # Ensure timestamp is datetime
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df = df.sort_values('timestamp')

        # Create figure with secondary y-axis
        fig = make_subplots(
            rows=2, cols=1,
            subplot_titles=('GMV Over Time', 'Cumulative P&L'),
            vertical_spacing=0.15,
            row_heights=[0.6, 0.4]
        )

        # GMV line chart
        if 'gmv' in df.columns:
            fig.add_trace(
                go.Scatter(
                    x=df['timestamp'],
                    y=df['gmv'],
                    mode='lines',
                    name='GMV',
                    line=dict(color=self.COLORS['gmv'], width=3),
                    fill='tozeroy',
                    fillcolor=f"rgba(255, 215, 0, 0.1)",
                    hovertemplate='<b>GMV</b>: $%{y:,.0f}<br>Date: %{x}<extra></extra>'
                ),
                row=1, col=1
            )

        # Cumulative P&L
        if 'pnl' in df.columns:
            df['cumulative_pnl'] = df['pnl'].cumsum()

            fig.add_trace(
                go.Scatter(
                    x=df['timestamp'],
                    y=df['cumulative_pnl'],
                    mode='lines',
                    name='Cumulative P&L',
                    line=dict(color=self.COLORS['positive'], width=2),
                    fill='tozeroy',
                    fillcolor=f"rgba(38, 166, 154, 0.2)",
                    hovertemplate='<b>P&L</b>: $%{y:,.0f}<br>Date: %{x}<extra></extra>'
                ),
                row=2, col=1
            )

        # Update layout
        fig.update_layout(
            title=title,
            template=self.template,
            height=height,
            width=width,
            showlegend=True,
            plot_bgcolor=self.COLORS['background'],
            paper_bgcolor=self.COLORS['paper'],
            font=dict(color=self.COLORS['text'], size=12),
            hovermode='x unified'
        )

        # Update axes
        fig.update_xaxes(title_text="Date", gridcolor=self.COLORS['grid'], row=2, col=1)
        fig.update_yaxes(title_text="GMV ($)", gridcolor=self.COLORS['grid'], row=1, col=1)
        fig.update_yaxes(title_text="P&L ($)", gridcolor=self.COLORS['grid'], row=2, col=1)

        return fig

    def create_combined_dashboard(
        self,
        trades_data: Union[pd.DataFrame, List[Dict[str, Any]]],
        strategy_totals: Dict[str, float],
        gmv_data: Optional[Union[pd.DataFrame, List[Dict[str, Any]]]] = None,
        title: str = "Waterfall Analysis Dashboard",
        height: int = 1200,
        width: Optional[int] = None
    ) -> go.Figure:
        """
        Create comprehensive dashboard with multiple waterfall charts.

        Args:
            trades_data: Trade-level data with timestamps and P&L
            strategy_totals: Strategy-level aggregated P&L
            gmv_data: Optional GMV tracking data
            title: Dashboard title
            height: Total height in pixels
            width: Chart width in pixels (None for auto)

        Returns:
            Plotly Figure object
        """
        # Determine number of rows based on data availability
        num_rows = 3 if gmv_data is not None else 2

        # Create subplot layout
        fig = make_subplots(
            rows=num_rows,
            cols=1,
            subplot_titles=(
                'Cumulative P&L Waterfall',
                'Strategy Contribution',
                'GMV Tracking' if gmv_data is not None else None
            ),
            vertical_spacing=0.12,
            row_heights=[0.4, 0.35, 0.25] if num_rows == 3 else [0.5, 0.5]
        )

        # 1. Cumulative waterfall
        if isinstance(trades_data, list):
            df_trades = pd.DataFrame(trades_data)
        else:
            df_trades = trades_data.copy()

        if 'timestamp' in df_trades.columns:
            df_trades['timestamp'] = pd.to_datetime(df_trades['timestamp'])
            df_trades = df_trades.sort_values('timestamp')

        # Sample data to avoid overcrowding (take every Nth trade)
        max_trades = 20
        if len(df_trades) > max_trades:
            step = len(df_trades) // max_trades
            df_sampled = df_trades.iloc[::step].copy()
        else:
            df_sampled = df_trades.copy()

        # Build cumulative waterfall
        x_labels_cum = ['Start']
        y_values_cum = [0]
        cumulative = 0

        for idx, row in df_sampled.iterrows():
            pnl = row['pnl']
            cumulative += pnl
            label = row['timestamp'].strftime('%m/%d') if 'timestamp' in row else f"T{idx}"
            x_labels_cum.append(label)
            y_values_cum.append(pnl)

        x_labels_cum.append('Total')
        y_values_cum.append(cumulative)

        fig.add_trace(
            go.Waterfall(
                name="Cumulative P&L",
                orientation="v",
                measure=["absolute"] + ["relative"] * (len(y_values_cum) - 2) + ["total"],
                x=x_labels_cum,
                y=y_values_cum,
                textposition="outside",
                connector={"line": {"color": self.COLORS['grid'], "width": 1}},
                decreasing={"marker": {"color": self.COLORS['negative']}},
                increasing={"marker": {"color": self.COLORS['positive']}},
                totals={"marker": {"color": self.COLORS['total']}},
                showlegend=False
            ),
            row=1, col=1
        )

        # 2. Strategy contribution waterfall
        sorted_strategies = sorted(
            strategy_totals.items(),
            key=lambda x: abs(x[1]),
            reverse=True
        )

        x_labels_strat = ['Start']
        y_values_strat = [0]

        total_pnl = 0
        for strategy, pnl in sorted_strategies:
            total_pnl += pnl
            x_labels_strat.append(strategy.replace('_', ' ').title()[:20])
            y_values_strat.append(pnl)

        x_labels_strat.append('Total')
        y_values_strat.append(total_pnl)

        fig.add_trace(
            go.Waterfall(
                name="Strategy P&L",
                orientation="v",
                measure=["absolute"] + ["relative"] * (len(y_values_strat) - 2) + ["total"],
                x=x_labels_strat,
                y=y_values_strat,
                textposition="outside",
                connector={"line": {"color": self.COLORS['grid'], "width": 1}},
                decreasing={"marker": {"color": self.COLORS['negative']}},
                increasing={"marker": {"color": self.COLORS['positive']}},
                totals={"marker": {"color": self.COLORS['total']}},
                showlegend=False
            ),
            row=2, col=1
        )

        # 3. GMV tracking (if available)
        if gmv_data is not None:
            if isinstance(gmv_data, list):
                df_gmv = pd.DataFrame(gmv_data)
            else:
                df_gmv = gmv_data.copy()

            if 'timestamp' in df_gmv.columns:
                df_gmv['timestamp'] = pd.to_datetime(df_gmv['timestamp'])
                df_gmv = df_gmv.sort_values('timestamp')

            if 'gmv' in df_gmv.columns:
                fig.add_trace(
                    go.Scatter(
                        x=df_gmv['timestamp'],
                        y=df_gmv['gmv'],
                        mode='lines',
                        name='GMV',
                        line=dict(color=self.COLORS['gmv'], width=3),
                        fill='tozeroy',
                        fillcolor=f"rgba(255, 215, 0, 0.1)",
                        showlegend=True
                    ),
                    row=3, col=1
                )

        # Update layout
        fig.update_layout(
            title=title,
            template=self.template,
            height=height,
            width=width,
            showlegend=True if gmv_data is not None else False,
            plot_bgcolor=self.COLORS['background'],
            paper_bgcolor=self.COLORS['paper'],
            font=dict(color=self.COLORS['text'], size=11),
            hovermode='x unified'
        )

        # Update axes
        fig.update_xaxes(tickangle=-45, gridcolor=self.COLORS['grid'])
        fig.update_yaxes(title_text="P&L ($)", gridcolor=self.COLORS['grid'], row=1, col=1)
        fig.update_yaxes(title_text="P&L ($)", gridcolor=self.COLORS['grid'], row=2, col=1)

        if gmv_data is not None:
            fig.update_yaxes(title_text="GMV ($)", gridcolor=self.COLORS['grid'], row=3, col=1)

        return fig

    def save_chart(
        self,
        fig: go.Figure,
        output_path: Union[str, Path],
        format: str = 'html'
    ) -> str:
        """
        Save chart to file.

        Args:
            fig: Plotly Figure object
            output_path: Output file path
            format: Output format ('html', 'png', 'jpg', 'svg', 'pdf')

        Returns:
            Path to saved file
        """
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        if format == 'html':
            fig.write_html(str(output_path))
        else:
            # Requires kaleido
            try:
                fig.write_image(str(output_path), format=format)
            except Exception as e:
                raise RuntimeError(
                    f"Failed to export as {format}. "
                    "Install kaleido: pip install kaleido"
                ) from e

        return str(output_path)

    @staticmethod
    def generate_sample_data(
        num_trades: int = 50,
        num_strategies: int = 5,
        include_gmv: bool = True
    ) -> Tuple[pd.DataFrame, Dict[str, float], Optional[pd.DataFrame]]:
        """
        Generate sample trading data for testing.

        Args:
            num_trades: Number of sample trades
            num_strategies: Number of strategies
            include_gmv: Whether to include GMV data

        Returns:
            Tuple of (trades_df, strategy_totals, gmv_df)
        """
        np.random.seed(42)

        # Generate strategies
        strategies = [
            'fibonacci_retracement',
            'lucas_timing',
            'momentum_integer',
            'mean_reversion',
            'breakout_fibonacci'
        ][:num_strategies]

        # Generate trades
        dates = pd.date_range(start='2024-01-01', periods=num_trades, freq='D')
        trades = []

        for i, date in enumerate(dates):
            strategy = np.random.choice(strategies)
            pnl = np.random.normal(100, 500)  # Mean $100, std $500

            trades.append({
                'timestamp': date,
                'strategy': strategy,
                'pnl': pnl,
                'trade_id': i + 1
            })

        trades_df = pd.DataFrame(trades)

        # Calculate strategy totals
        strategy_totals = trades_df.groupby('strategy')['pnl'].sum().to_dict()

        # Generate GMV data if requested
        gmv_df = None
        if include_gmv:
            gmv_data = []
            initial_capital = 100000
            capital = initial_capital

            for i, date in enumerate(dates):
                # GMV increases with wins, decreases with losses
                pnl = trades_df[trades_df['timestamp'] == date]['pnl'].sum()
                capital += pnl

                # Add some volatility to GMV
                gmv = capital * (1 + np.random.normal(0, 0.02))

                gmv_data.append({
                    'timestamp': date,
                    'gmv': gmv,
                    'pnl': pnl,
                    'capital': capital
                })

            gmv_df = pd.DataFrame(gmv_data)

        return trades_df, strategy_totals, gmv_df


def main():
    """Demo waterfall chart generation"""
    print("=" * 70)
    print("Waterfall Chart Generator - Demo")
    print("=" * 70)

    # Initialize generator
    generator = WaterfallChartGenerator(theme='dark')

    # Generate sample data
    print("\nGenerating sample data...")
    trades_df, strategy_totals, gmv_df = generator.generate_sample_data(
        num_trades=50,
        num_strategies=5,
        include_gmv=True
    )

    print(f"  ✓ Generated {len(trades_df)} trades")
    print(f"  ✓ Generated {len(strategy_totals)} strategies")
    print(f"  ✓ Generated GMV tracking data")

    # Create output directory
    output_dir = Path(__file__).parent.parent.parent / 'visualizations' / 'charts'
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. Cumulative waterfall
    print("\nCreating cumulative P&L waterfall...")
    fig1 = generator.create_cumulative_waterfall(
        trades_df,
        title="Cumulative P&L Waterfall Chart"
    )
    path1 = generator.save_chart(
        fig1,
        output_dir / 'waterfall_cumulative.html'
    )
    print(f"  ✓ Saved to: {path1}")

    # 2. Strategy contribution waterfall
    print("\nCreating strategy contribution waterfall...")
    fig2 = generator.create_strategy_contribution_waterfall(
        strategy_totals,
        title="Strategy Contribution to Total P&L"
    )
    path2 = generator.save_chart(
        fig2,
        output_dir / 'waterfall_strategy.html'
    )
    print(f"  ✓ Saved to: {path2}")

    # 3. GMV tracking
    print("\nCreating GMV tracking chart...")
    fig3 = generator.create_gmv_tracking_chart(
        gmv_df,
        title="Gross Market Value Tracking"
    )
    path3 = generator.save_chart(
        fig3,
        output_dir / 'waterfall_gmv.html'
    )
    print(f"  ✓ Saved to: {path3}")

    # 4. Combined dashboard
    print("\nCreating combined dashboard...")
    fig4 = generator.create_combined_dashboard(
        trades_df,
        strategy_totals,
        gmv_df,
        title="Waterfall Analysis Dashboard"
    )
    path4 = generator.save_chart(
        fig4,
        output_dir / 'waterfall_dashboard.html'
    )
    print(f"  ✓ Saved to: {path4}")

    # Summary
    print("\n" + "=" * 70)
    print("✨ Waterfall Chart Generation Complete!")
    print("=" * 70)
    print(f"\n📊 Generated Charts:")
    print(f"  1. Cumulative P&L:       {output_dir / 'waterfall_cumulative.html'}")
    print(f"  2. Strategy Contribution: {output_dir / 'waterfall_strategy.html'}")
    print(f"  3. GMV Tracking:         {output_dir / 'waterfall_gmv.html'}")
    print(f"  4. Combined Dashboard:   {output_dir / 'waterfall_dashboard.html'}")
    print(f"\n💡 Open any HTML file in your browser to view interactive charts")
    print("=" * 70)


if __name__ == '__main__':
    main()

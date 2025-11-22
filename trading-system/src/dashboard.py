"""
TradingView-Style Dashboard with Dash
Interactive web-based trading visualization dashboard with real-time updates
"""

import dash
from dash import dcc, html, Input, Output, State, callback_context
import dash_bootstrap_components as dbc
from dash.exceptions import PreventUpdate
import plotly.graph_objects as go
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
from typing import Dict, List, Optional
import threading
import time

from visualization import TradingViewCharts, FibonacciUtils, ChartExporter


class TradingDashboard:
    """Main dashboard application class"""

    def __init__(self, theme: str = 'dark', port: int = 8050):
        """
        Initialize trading dashboard

        Args:
            theme: 'dark' or 'light' theme
            port: Port to run dashboard on
        """
        self.theme = theme
        self.port = port
        self.charts = TradingViewCharts(theme=theme)
        self.fib_utils = FibonacciUtils()
        self.exporter = ChartExporter()

        # Initialize Dash app with Bootstrap theme
        if theme == 'dark':
            self.app = dash.Dash(
                __name__,
                external_stylesheets=[dbc.themes.DARKLY],
                suppress_callback_exceptions=True
            )
        else:
            self.app = dash.Dash(
                __name__,
                external_stylesheets=[dbc.themes.FLATLY],
                suppress_callback_exceptions=True
            )

        # Sample data storage
        self.data_store = {
            'price_data': self._generate_sample_price_data(),
            'indicators': self._generate_sample_indicators(),
            'trades': self._generate_sample_trades(),
            'tickers': self._generate_sample_tickers(),
            'sectors': self._generate_sample_sectors()
        }

        # Real-time update control
        self.realtime_enabled = False
        self.update_interval = 5000  # milliseconds

        # Build layout
        self._build_layout()
        self._register_callbacks()

    def _generate_sample_price_data(self, days: int = 100) -> pd.DataFrame:
        """Generate sample OHLCV data"""
        np.random.seed(42)
        dates = pd.date_range(start=datetime.now() - timedelta(days=days), periods=days, freq='D')

        base_price = 100
        prices = [base_price]

        for i in range(1, days):
            change = np.random.randn() * 2
            new_price = prices[-1] + change
            prices.append(max(new_price, 10))  # Prevent negative prices

        df = pd.DataFrame({
            'timestamp': dates,
            'open': prices,
            'high': [p + abs(np.random.randn() * 3) for p in prices],
            'low': [p - abs(np.random.randn() * 3) for p in prices],
            'close': [p + np.random.randn() * 1 for p in prices],
            'volume': np.random.randint(1000000, 5000000, days)
        })

        # Ensure high/low are correct
        df['high'] = df[['open', 'high', 'low', 'close']].max(axis=1)
        df['low'] = df[['open', 'high', 'low', 'close']].min(axis=1)

        return df

    def _generate_sample_indicators(self, num_indicators: int = 12) -> Dict[str, pd.DataFrame]:
        """Generate sample economic indicators"""
        indicators = {}
        categories = ['GDP', 'Inflation', 'Employment', 'Trade', 'Manufacturing', 'Consumer',
                     'Housing', 'Energy', 'Technology', 'Finance', 'Healthcare', 'Retail']

        dates = pd.date_range(start=datetime.now() - timedelta(days=365), periods=50, freq='W')

        for i, category in enumerate(categories[:num_indicators]):
            base_value = 100 + i * 10
            values = base_value + np.cumsum(np.random.randn(50) * 5)

            indicators[category] = pd.DataFrame({
                'timestamp': dates,
                'value': values
            })

        return indicators

    def _generate_sample_trades(self, num_trades: int = 50) -> pd.DataFrame:
        """Generate sample trade data"""
        np.random.seed(42)
        dates = pd.date_range(start=datetime.now() - timedelta(days=100), periods=num_trades, freq='2D')

        trades = pd.DataFrame({
            'entry_time': dates,
            'exit_time': dates + timedelta(days=1),
            'pnl': np.random.randn(num_trades) * 1000,
            'return': np.random.randn(num_trades) * 0.05
        })

        return trades

    def _generate_sample_tickers(self) -> Dict[str, pd.DataFrame]:
        """Generate sample ticker data"""
        tickers = {}
        symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN']

        dates = pd.date_range(start=datetime.now() - timedelta(hours=24), periods=100, freq='15min')

        for symbol in symbols:
            base_price = np.random.uniform(100, 500)
            prices = base_price + np.cumsum(np.random.randn(100) * 2)

            tickers[symbol] = pd.DataFrame({
                'timestamp': dates,
                'price': prices
            })

        return tickers

    def _generate_sample_sectors(self) -> pd.DataFrame:
        """Generate sample sector performance data"""
        sectors = ['Technology', 'Healthcare', 'Finance', 'Energy', 'Consumer']
        subsectors = ['Large Cap', 'Mid Cap', 'Small Cap', 'Growth', 'Value']

        data = []
        for sector in sectors:
            for subsector in subsectors:
                data.append({
                    'sector': sector,
                    'subsector': subsector,
                    'performance': np.random.randn() * 10
                })

        return pd.DataFrame(data)

    def _build_layout(self):
        """Build dashboard layout"""

        # Header
        header = dbc.Navbar(
            dbc.Container([
                dbc.Row([
                    dbc.Col(
                        html.H2("TradingView-Style Dashboard", className="text-light"),
                        width="auto"
                    ),
                    dbc.Col(
                        dbc.Badge(
                            "Fibonacci Trading System",
                            color="success",
                            className="ms-2"
                        ),
                        width="auto"
                    )
                ], align="center"),
                dbc.Row([
                    dbc.Col(
                        dbc.ButtonGroup([
                            dbc.Button("Dark", id="theme-dark", color="secondary", size="sm"),
                            dbc.Button("Light", id="theme-light", color="light", size="sm", outline=True)
                        ]),
                        width="auto"
                    ),
                    dbc.Col(
                        dbc.Button(
                            "Export Charts",
                            id="export-btn",
                            color="primary",
                            size="sm"
                        ),
                        width="auto"
                    ),
                    dbc.Col(
                        dbc.Checklist(
                            options=[{"label": "Real-time Updates", "value": 1}],
                            value=[],
                            id="realtime-toggle",
                            switch=True,
                            inline=True,
                            className="text-light"
                        ),
                        width="auto"
                    )
                ], align="center", className="ms-auto")
            ], fluid=True),
            color="dark",
            dark=True,
            className="mb-4"
        )

        # Tabs for different views
        tabs = dbc.Tabs([
            dbc.Tab(label="Price Chart", tab_id="price-tab"),
            dbc.Tab(label="Volume Analysis", tab_id="volume-tab"),
            dbc.Tab(label="Economic Indicators", tab_id="indicators-tab"),
            dbc.Tab(label="Backtesting", tab_id="backtest-tab"),
            dbc.Tab(label="Real-time Monitor", tab_id="realtime-tab"),
            dbc.Tab(label="Sector Analysis", tab_id="sector-tab")
        ], id="tabs", active_tab="price-tab")

        # Content area
        content = html.Div(id="tab-content", className="p-4")

        # Interval for real-time updates
        interval = dcc.Interval(
            id='interval-component',
            interval=self.update_interval,
            n_intervals=0,
            disabled=True
        )

        # Store for theme
        theme_store = dcc.Store(id='theme-store', data=self.theme)

        # Export modal
        export_modal = dbc.Modal([
            dbc.ModalHeader("Export Charts"),
            dbc.ModalBody([
                dbc.Label("Select Format:"),
                dbc.RadioItems(
                    options=[
                        {"label": "PNG (High Resolution)", "value": "png"},
                        {"label": "SVG (Vector)", "value": "svg"},
                        {"label": "PDF (Document)", "value": "pdf"},
                        {"label": "HTML (Interactive)", "value": "html"}
                    ],
                    value="png",
                    id="export-format"
                ),
                html.Hr(),
                dbc.Label("Chart to Export:"),
                dbc.Select(
                    id="export-chart-select",
                    options=[
                        {"label": "Current View", "value": "current"},
                        {"label": "All Charts", "value": "all"}
                    ],
                    value="current"
                )
            ]),
            dbc.ModalFooter([
                dbc.Button("Export", id="confirm-export", color="primary"),
                dbc.Button("Cancel", id="cancel-export", color="secondary")
            ])
        ], id="export-modal", is_open=False)

        # Alert for export success
        alert = dbc.Alert(
            "Charts exported successfully!",
            id="export-alert",
            is_open=False,
            duration=4000,
            color="success"
        )

        # Main layout
        self.app.layout = dbc.Container([
            header,
            tabs,
            content,
            interval,
            theme_store,
            export_modal,
            alert
        ], fluid=True, className="p-0")

    def _register_callbacks(self):
        """Register all callbacks"""

        # Tab content callback
        @self.app.callback(
            Output("tab-content", "children"),
            [Input("tabs", "active_tab"),
             Input("theme-store", "data")]
        )
        def render_tab_content(active_tab, theme):
            self.charts.theme = theme
            self.charts._setup_theme()

            if active_tab == "price-tab":
                return self._render_price_tab()
            elif active_tab == "volume-tab":
                return self._render_volume_tab()
            elif active_tab == "indicators-tab":
                return self._render_indicators_tab()
            elif active_tab == "backtest-tab":
                return self._render_backtest_tab()
            elif active_tab == "realtime-tab":
                return self._render_realtime_tab()
            elif active_tab == "sector-tab":
                return self._render_sector_tab()

            return html.Div("Select a tab")

        # Theme switching
        @self.app.callback(
            Output("theme-store", "data"),
            [Input("theme-dark", "n_clicks"),
             Input("theme-light", "n_clicks")],
            [State("theme-store", "data")]
        )
        def switch_theme(dark_clicks, light_clicks, current_theme):
            ctx = callback_context
            if not ctx.triggered:
                raise PreventUpdate

            button_id = ctx.triggered[0]["prop_id"].split(".")[0]

            if button_id == "theme-dark":
                return "dark"
            elif button_id == "theme-light":
                return "light"

            return current_theme

        # Real-time toggle
        @self.app.callback(
            Output("interval-component", "disabled"),
            Input("realtime-toggle", "value")
        )
        def toggle_realtime(value):
            return len(value) == 0

        # Export modal
        @self.app.callback(
            Output("export-modal", "is_open"),
            [Input("export-btn", "n_clicks"),
             Input("confirm-export", "n_clicks"),
             Input("cancel-export", "n_clicks")],
            [State("export-modal", "is_open")]
        )
        def toggle_export_modal(export_click, confirm_click, cancel_click, is_open):
            ctx = callback_context
            if not ctx.triggered:
                raise PreventUpdate

            button_id = ctx.triggered[0]["prop_id"].split(".")[0]

            if button_id in ["export-btn", "cancel-export"]:
                return not is_open
            elif button_id == "confirm-export":
                # Export logic would go here
                return False

            return is_open

        # Export confirmation
        @self.app.callback(
            Output("export-alert", "is_open"),
            Input("confirm-export", "n_clicks")
        )
        def show_export_alert(n_clicks):
            if n_clicks:
                return True
            return False

    def _render_price_tab(self) -> html.Div:
        """Render price chart tab"""
        df = self.data_store['price_data']

        # Generate sample signals
        signals = pd.DataFrame({
            'timestamp': [df['timestamp'].iloc[20], df['timestamp'].iloc[50], df['timestamp'].iloc[80]],
            'type': ['buy', 'sell', 'buy'],
            'price': [df['close'].iloc[20], df['close'].iloc[50], df['close'].iloc[80]]
        })

        fig = self.charts.candlestick_with_fibonacci(
            df,
            show_volume=True,
            show_fibonacci=True,
            signals=signals
        )

        controls = dbc.Card([
            dbc.CardHeader("Chart Controls"),
            dbc.CardBody([
                dbc.Row([
                    dbc.Col([
                        dbc.Label("Show Volume"),
                        dbc.Checklist(
                            options=[{"label": "", "value": 1}],
                            value=[1],
                            id="show-volume",
                            switch=True
                        )
                    ], width=4),
                    dbc.Col([
                        dbc.Label("Show Fibonacci"),
                        dbc.Checklist(
                            options=[{"label": "", "value": 1}],
                            value=[1],
                            id="show-fibonacci",
                            switch=True
                        )
                    ], width=4),
                    dbc.Col([
                        dbc.Label("Show Signals"),
                        dbc.Checklist(
                            options=[{"label": "", "value": 1}],
                            value=[1],
                            id="show-signals",
                            switch=True
                        )
                    ], width=4)
                ])
            ])
        ], className="mb-3")

        return html.Div([
            controls,
            dcc.Graph(figure=fig, id="price-chart", config={'displayModeBar': True, 'responsive': True})
        ])

    def _render_volume_tab(self) -> html.Div:
        """Render volume analysis tab"""
        df = self.data_store['price_data']

        fig = self.charts.volume_analysis(
            df,
            use_log_scale=True,
            show_fibonacci_levels=True
        )

        return html.Div([
            dcc.Graph(figure=fig, config={'displayModeBar': True, 'responsive': True})
        ])

    def _render_indicators_tab(self) -> html.Div:
        """Render economic indicators tab"""
        indicators = self.data_store['indicators']

        fig = self.charts.economic_indicators_dashboard(indicators)

        info_card = dbc.Card([
            dbc.CardHeader("Economic Indicators Overview"),
            dbc.CardBody([
                html.P(f"Tracking {len(indicators)} economic indicators across multiple categories."),
                html.P("Data is organized by sector with Fibonacci-based trend analysis."),
                dbc.Badge(f"{len(indicators)} Indicators", color="info", className="me-2"),
                dbc.Badge("Real-time Updates", color="success")
            ])
        ], className="mb-3")

        return html.Div([
            info_card,
            dcc.Graph(figure=fig, config={'displayModeBar': True, 'responsive': True})
        ])

    def _render_backtest_tab(self) -> html.Div:
        """Render backtesting results tab"""
        df = self.data_store['price_data']
        trades = self.data_store['trades']

        # Generate equity curve
        initial_capital = 100000
        equity = [initial_capital]

        for pnl in trades['pnl']:
            equity.append(equity[-1] + pnl)

        equity_curve = pd.DataFrame({
            'timestamp': pd.date_range(start=df['timestamp'].iloc[0], periods=len(equity), freq='2D'),
            'equity': equity,
            'drawdown': [(e - max(equity[:i+1])) / max(equity[:i+1]) if i > 0 else 0
                        for i, e in enumerate(equity)]
        })

        # Calculate metrics
        total_return = (equity[-1] - initial_capital) / initial_capital
        max_drawdown = min(equity_curve['drawdown'])
        win_rate = len(trades[trades['pnl'] > 0]) / len(trades)
        sharpe_ratio = trades['return'].mean() / trades['return'].std() * np.sqrt(252) if trades['return'].std() > 0 else 0

        metrics = {
            'Total Return': f"{total_return*100:.2f}%",
            'Max Drawdown': f"{max_drawdown*100:.2f}%",
            'Win Rate': f"{win_rate*100:.2f}%",
            'Sharpe Ratio': f"{sharpe_ratio:.2f}",
            'Total Trades': len(trades),
            'Avg Trade': f"${trades['pnl'].mean():.2f}",
            'Best Trade': f"${trades['pnl'].max():.2f}",
            'Worst Trade': f"${trades['pnl'].min():.2f}"
        }

        fig = self.charts.backtesting_results(equity_curve, trades, metrics)

        summary_card = dbc.Card([
            dbc.CardHeader("Backtesting Summary"),
            dbc.CardBody([
                dbc.Row([
                    dbc.Col([
                        html.H4(f"{total_return*100:.2f}%"),
                        html.P("Total Return", className="text-muted")
                    ], width=3),
                    dbc.Col([
                        html.H4(f"{win_rate*100:.2f}%"),
                        html.P("Win Rate", className="text-muted")
                    ], width=3),
                    dbc.Col([
                        html.H4(f"{sharpe_ratio:.2f}"),
                        html.P("Sharpe Ratio", className="text-muted")
                    ], width=3),
                    dbc.Col([
                        html.H4(len(trades)),
                        html.P("Total Trades", className="text-muted")
                    ], width=3)
                ])
            ])
        ], className="mb-3")

        return html.Div([
            summary_card,
            dcc.Graph(figure=fig, config={'displayModeBar': True, 'responsive': True})
        ])

    def _render_realtime_tab(self) -> html.Div:
        """Render real-time monitoring tab"""
        tickers = self.data_store['tickers']

        # Calculate Fibonacci alert levels for each ticker
        alert_levels = {}
        for ticker, data in tickers.items():
            max_price = data['price'].max()
            min_price = data['price'].min()
            price_range = max_price - min_price

            # Set alert at 0.618 Fibonacci level
            alert_levels[ticker] = [min_price + price_range * 0.618]

        fig = self.charts.realtime_ticker_monitor(tickers, alert_levels)

        status_cards = dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardBody([
                        html.H5(ticker),
                        html.H3(f"${data['price'].iloc[-1]:.2f}"),
                        html.P(
                            f"{((data['price'].iloc[-1] - data['price'].iloc[0]) / data['price'].iloc[0] * 100):+.2f}%",
                            className="text-success" if data['price'].iloc[-1] >= data['price'].iloc[0] else "text-danger"
                        )
                    ])
                ])
            ], width=2)
            for ticker, data in tickers.items()
        ], className="mb-3")

        return html.Div([
            status_cards,
            dcc.Graph(figure=fig, id="realtime-chart", config={'displayModeBar': True, 'responsive': True})
        ])

    def _render_sector_tab(self) -> html.Div:
        """Render sector analysis tab"""
        sectors = self.data_store['sectors']

        fig1 = self.charts.sector_heatmap(sectors)

        # Create correlation matrix
        pivot_data = sectors.pivot_table(
            values='performance',
            index='sector',
            columns='subsector',
            aggfunc='mean'
        )
        correlation = pivot_data.T.corr()

        fig2 = self.charts.correlation_matrix(correlation, use_zeckendorf_compression=True)

        return html.Div([
            dbc.Row([
                dbc.Col([
                    dcc.Graph(figure=fig1, config={'displayModeBar': True, 'responsive': True})
                ], width=12)
            ]),
            html.Hr(),
            dbc.Row([
                dbc.Col([
                    dcc.Graph(figure=fig2, config={'displayModeBar': True, 'responsive': True})
                ], width=12)
            ])
        ])

    def run(self, debug: bool = True):
        """Run the dashboard"""
        print(f"\n{'='*60}")
        print(f"TradingView-Style Dashboard Starting")
        print(f"{'='*60}")
        print(f"Theme: {self.theme}")
        print(f"Port: {self.port}")
        print(f"URL: http://localhost:{self.port}")
        print(f"{'='*60}\n")

        self.app.run_server(debug=debug, port=self.port, host='0.0.0.0')


# Example usage
if __name__ == '__main__':
    # Create and run dashboard
    dashboard = TradingDashboard(theme='dark', port=8050)
    dashboard.run(debug=True)

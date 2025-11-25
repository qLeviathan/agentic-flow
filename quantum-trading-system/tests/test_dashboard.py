"""
Test Suite for Interactive Dashboard - Agent 23 (Zeckendorf: 10000001000)

Comprehensive tests for the TradingView-style dashboard.
Tests visualization creation, filtering, exports, and theme application.
"""

import pytest
import sys
from pathlib import Path
from typing import List

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from visualization.dashboard import (
    InteractiveDashboard,
    StrategyResult,
    TRADINGVIEW_THEME,
    create_sample_dashboard
)
from backtesting.backtest_engine import BacktestResult, TradeLog
from backtesting.performance_analytics import PerformanceMetrics

# Test fixtures


@pytest.fixture
def sample_backtest_result(sample_trade_logs, sample_equity_curve) -> BacktestResult:
    """Create sample backtest result for testing."""
    return BacktestResult(
        total_trades=100,
        winning_trades=60,
        losing_trades=40,
        win_rate_scaled=600,  # 60%
        total_pnl_cents=1000000,  # $10,000
        gross_profit_cents=1500000,
        gross_loss_cents=500000,
        average_win_cents=25000,
        average_loss_cents=12500,
        largest_win_cents=100000,
        largest_loss_cents=50000,
        sharpe_ratio_scaled=2000,
        sortino_ratio_scaled=2500,
        profit_factor_scaled=3000,
        max_drawdown_cents=150000,
        max_drawdown_percent_scaled=150,  # 15%
        final_capital_cents=2000000,
        initial_capital_cents=1000000,
        peak_capital_cents=2100000,
        trades=sample_trade_logs,
        equity_curve=sample_equity_curve,
        total_commission_cents=10000,
        strategy_name='TestStrategy'
    )


@pytest.fixture
def sample_performance_metrics() -> PerformanceMetrics:
    """Create sample performance metrics for testing."""
    return PerformanceMetrics(
        sharpe_ratio_scaled=2000,
        annualized_sharpe_scaled=3175,
        sortino_ratio_scaled=2500,
        annualized_sortino_scaled=3969,
        max_drawdown_cents=150000,
        max_drawdown_percent_scaled=150,
        max_drawdown_duration_bars=25,
        average_drawdown_cents=50000,
        average_drawdown_duration_bars=8,
        calmar_ratio_scaled=6666,
        mar_ratio_scaled=6666,
        sterling_ratio_scaled=20000,
        win_rate_scaled=600,
        win_loss_ratio_scaled=2000,
        profit_factor_scaled=3000,
        gross_profit_cents=1500000,
        gross_loss_cents=500000,
        expectancy_cents=10000,
        kelly_criterion_scaled=300,
        max_consecutive_wins=10,
        max_consecutive_losses=5,
        current_streak=3,
        median_win_cents=23000,
        median_loss_cents=11000,
        win_std_dev=9000,
        loss_std_dev=4000,
        average_recovery_bars=12,
        max_recovery_bars=30,
        total_return_percent_scaled=1000,  # 100%
        annualized_return_scaled=1500  # 150%
    )


@pytest.fixture
def sample_trade_logs() -> List[TradeLog]:
    """Create sample trade logs for testing."""
    trades = []
    for i in range(100):
        # Alternate between wins and losses
        pnl = 25000 if i % 5 != 0 else -12500

        trade = TradeLog(
            trade_id=i,
            timestamp=i * 5,
            action='BUY' if i % 2 == 0 else 'SELL',
            price_cents=10000 + (i * 10),
            position_size=10,
            strategy_name='TestStrategy',
            entry_signal='fib_cross' if i % 2 == 0 else None,
            exit_signal='target_hit' if i % 2 == 1 else None,
            pnl_cents=pnl,
            commission_cents=100,
            cumulative_pnl_cents=sum(
                25000 if j % 5 != 0 else -12500 for j in range(i + 1)
            )
        )
        trades.append(trade)

    return trades


@pytest.fixture
def sample_equity_curve() -> List[int]:
    """Create sample equity curve for testing."""
    initial_capital = 1000000  # $10,000 in cents
    equity = [initial_capital]

    for i in range(500):
        # Simulate growing equity with some drawdowns
        change = 2000 if i % 5 != 0 else -1000
        equity.append(equity[-1] + change)

    return equity


@pytest.fixture
def dashboard(
    sample_backtest_result,
    sample_performance_metrics,
    sample_trade_logs,
    sample_equity_curve
):
    """Create configured dashboard for testing."""
    dash = InteractiveDashboard()

    # Add multiple strategies for testing
    strategies = [
        ('AAPL', 'Fibonacci'),
        ('AAPL', 'MeanReversion'),
        ('MSFT', 'Fibonacci'),
        ('GOOGL', 'Momentum')
    ]

    for ticker, strategy in strategies:
        dash.add_strategy_result(
            strategy_name=strategy,
            ticker=ticker,
            timeframe='1D',
            backtest_result=sample_backtest_result,
            performance_metrics=sample_performance_metrics,
            trade_logs=sample_trade_logs,
            equity_curve=sample_equity_curve
        )

    return dash


# Test InteractiveDashboard initialization


def test_dashboard_initialization():
    """Test dashboard initializes with default theme."""
    dashboard = InteractiveDashboard()

    assert dashboard.theme == TRADINGVIEW_THEME
    assert dashboard.strategy_results == {}
    assert dashboard.selected_tickers == []
    assert dashboard.selected_strategies == []
    assert dashboard.current_figure is None


def test_dashboard_custom_theme():
    """Test dashboard initializes with custom theme."""
    custom_theme = {
        'background': '#FFFFFF',
        'paper': '#F0F0F0',
        'text': '#000000',
        'grid': '#CCCCCC',
        'green': '#00FF00',
        'red': '#FF0000',
        'blue': '#0000FF',
        'yellow': '#FFFF00',
        'purple': '#FF00FF',
        'cyan': '#00FFFF'
    }

    dashboard = InteractiveDashboard(theme=custom_theme)
    assert dashboard.theme == custom_theme


# Test adding strategy results


def test_add_strategy_result(
    sample_backtest_result,
    sample_performance_metrics,
    sample_trade_logs,
    sample_equity_curve
):
    """Test adding strategy result to dashboard."""
    dashboard = InteractiveDashboard()

    dashboard.add_strategy_result(
        strategy_name='Fibonacci',
        ticker='AAPL',
        timeframe='1D',
        backtest_result=sample_backtest_result,
        performance_metrics=sample_performance_metrics,
        trade_logs=sample_trade_logs,
        equity_curve=sample_equity_curve
    )

    assert len(dashboard.strategy_results) == 1
    assert 'AAPL_Fibonacci_1D' in dashboard.strategy_results
    assert 'AAPL' in dashboard.selected_tickers
    assert 'Fibonacci' in dashboard.selected_strategies


def test_add_multiple_strategies(dashboard):
    """Test adding multiple strategy results."""
    assert len(dashboard.strategy_results) == 4
    assert len(dashboard.selected_tickers) == 3  # AAPL, MSFT, GOOGL
    assert len(dashboard.selected_strategies) == 3  # Fibonacci, MeanReversion, Momentum


def test_strategy_result_key_format(
    sample_backtest_result,
    sample_performance_metrics,
    sample_trade_logs,
    sample_equity_curve
):
    """Test strategy result key generation."""
    dashboard = InteractiveDashboard()

    dashboard.add_strategy_result(
        strategy_name='TestStrategy',
        ticker='TEST',
        timeframe='4H',
        backtest_result=sample_backtest_result,
        performance_metrics=sample_performance_metrics,
        trade_logs=sample_trade_logs,
        equity_curve=sample_equity_curve
    )

    assert 'TEST_TestStrategy_4H' in dashboard.strategy_results


# Test filtering


def test_filter_by_ticker(dashboard):
    """Test filtering results by ticker."""
    filtered = dashboard._filter_results(tickers=['AAPL'], strategies=None)

    assert len(filtered) == 2  # Fibonacci and MeanReversion
    for result in filtered.values():
        assert result.ticker == 'AAPL'


def test_filter_by_strategy(dashboard):
    """Test filtering results by strategy."""
    filtered = dashboard._filter_results(tickers=None, strategies=['Fibonacci'])

    assert len(filtered) == 2  # AAPL and MSFT
    for result in filtered.values():
        assert result.strategy_name == 'Fibonacci'


def test_filter_by_both(dashboard):
    """Test filtering by both ticker and strategy."""
    filtered = dashboard._filter_results(
        tickers=['AAPL'],
        strategies=['Fibonacci']
    )

    assert len(filtered) == 1
    result = list(filtered.values())[0]
    assert result.ticker == 'AAPL'
    assert result.strategy_name == 'Fibonacci'


def test_filter_no_results(dashboard):
    """Test filtering with no matching results."""
    filtered = dashboard._filter_results(
        tickers=['NONEXISTENT'],
        strategies=['FAKE']
    )

    assert len(filtered) == 0


# Test dashboard creation


def test_create_performance_dashboard(dashboard):
    """Test creating performance dashboard."""
    try:
        fig = dashboard.create_performance_dashboard()

        assert fig is not None
        assert dashboard.current_figure is not None
        assert len(fig.data) > 0

        # Check that subplots were created
        assert hasattr(fig, 'layout')
        assert fig.layout.title.text == 'Quantum Trading System - Performance Dashboard'

    except ImportError:
        pytest.skip("Plotly not installed")


def test_create_dashboard_with_filters(dashboard):
    """Test creating dashboard with filters."""
    try:
        fig = dashboard.create_performance_dashboard(
            tickers=['AAPL'],
            strategies=['Fibonacci']
        )

        assert fig is not None
        assert len(fig.data) > 0

    except ImportError:
        pytest.skip("Plotly not installed")


def test_create_dashboard_without_trades(dashboard):
    """Test creating dashboard without trade markers."""
    try:
        fig = dashboard.create_performance_dashboard(show_trades=False)

        assert fig is not None
        assert len(fig.data) > 0

    except ImportError:
        pytest.skip("Plotly not installed")


def test_create_dashboard_empty_results():
    """Test creating dashboard with no results raises error."""
    dashboard = InteractiveDashboard()

    with pytest.raises(ValueError, match="No results match"):
        dashboard.create_performance_dashboard()


# Test comparison table


def test_create_comparison_table(dashboard):
    """Test creating strategy comparison table."""
    try:
        fig = dashboard.create_strategy_comparison_table()

        assert fig is not None
        assert len(fig.data) > 0
        assert fig.data[0].type == 'table'

    except ImportError:
        pytest.skip("Plotly not installed")


def test_comparison_table_with_filters(dashboard):
    """Test comparison table with filters."""
    try:
        fig = dashboard.create_strategy_comparison_table(
            tickers=['AAPL'],
            strategies=['Fibonacci']
        )

        assert fig is not None

    except ImportError:
        pytest.skip("Plotly not installed")


# Test theme application


def test_theme_application(dashboard):
    """Test TradingView theme is applied correctly."""
    try:
        fig = dashboard.create_performance_dashboard()

        assert fig.layout.plot_bgcolor == TRADINGVIEW_THEME['background']
        assert fig.layout.paper_bgcolor == TRADINGVIEW_THEME['paper']
        assert fig.layout.font.color == TRADINGVIEW_THEME['text']

    except ImportError:
        pytest.skip("Plotly not installed")


# Test getter methods


def test_get_available_tickers(dashboard):
    """Test getting available tickers."""
    tickers = dashboard.get_available_tickers()

    assert tickers == ['AAPL', 'GOOGL', 'MSFT']  # Sorted
    assert len(tickers) == 3


def test_get_available_strategies(dashboard):
    """Test getting available strategies."""
    strategies = dashboard.get_available_strategies()

    assert 'Fibonacci' in strategies
    assert 'MeanReversion' in strategies
    assert 'Momentum' in strategies
    assert len(strategies) == 3


def test_get_summary_statistics(dashboard):
    """Test getting summary statistics."""
    summary = dashboard.get_summary_statistics()

    assert summary['num_strategies'] == 4
    assert summary['total_trades'] == 400  # 100 * 4
    assert summary['winning_trades'] == 240  # 60 * 4
    assert 'total_pnl' in summary
    assert 'avg_sharpe' in summary
    assert 'avg_sortino' in summary
    assert 'max_drawdown_pct' in summary


def test_summary_statistics_with_filters(dashboard):
    """Test summary statistics with filters."""
    summary = dashboard.get_summary_statistics(
        tickers=['AAPL'],
        strategies=['Fibonacci']
    )

    assert summary['num_strategies'] == 1
    assert summary['total_trades'] == 100


def test_summary_statistics_empty():
    """Test summary statistics with no results."""
    dashboard = InteractiveDashboard()
    summary = dashboard.get_summary_statistics()

    assert summary == {}


# Test export functionality


def test_export_html_no_figure():
    """Test export HTML without creating dashboard raises error."""
    dashboard = InteractiveDashboard()

    with pytest.raises(ValueError, match="No dashboard created"):
        dashboard.export_html('/tmp/test.html')


def test_export_png_no_figure():
    """Test export PNG without creating dashboard raises error."""
    dashboard = InteractiveDashboard()

    with pytest.raises(ValueError, match="No dashboard created"):
        dashboard.export_png('/tmp/test.png')


def test_export_pdf_no_figure():
    """Test export PDF without creating dashboard raises error."""
    dashboard = InteractiveDashboard()

    with pytest.raises(ValueError, match="No dashboard created"):
        dashboard.export_pdf('/tmp/test.pdf')


def test_export_html(dashboard, tmp_path):
    """Test exporting dashboard to HTML."""
    try:
        dashboard.create_performance_dashboard()

        output_file = tmp_path / "test_dashboard.html"
        dashboard.export_html(output_file)

        assert output_file.exists()
        assert output_file.stat().st_size > 0

        # Check HTML content
        content = output_file.read_text()
        assert 'Quantum Trading System' in content
        assert 'plotly' in content.lower()

    except ImportError:
        pytest.skip("Plotly not installed")


def test_export_html_creates_directory(dashboard, tmp_path):
    """Test export HTML creates parent directories."""
    try:
        dashboard.create_performance_dashboard()

        output_file = tmp_path / "subdir" / "nested" / "dashboard.html"
        dashboard.export_html(output_file)

        assert output_file.exists()
        assert output_file.parent.exists()

    except ImportError:
        pytest.skip("Plotly not installed")


# Test sample dashboard creation


def test_create_sample_dashboard():
    """Test creating sample dashboard."""
    try:
        dashboard = create_sample_dashboard()

        assert len(dashboard.strategy_results) == 1
        assert len(dashboard.get_available_tickers()) == 1
        assert 'AAPL' in dashboard.get_available_tickers()
        assert 'Fibonacci' in dashboard.get_available_strategies()

    except ImportError:
        pytest.skip("Plotly not installed")


def test_sample_dashboard_can_create_figure():
    """Test sample dashboard can create performance figure."""
    try:
        dashboard = create_sample_dashboard()
        fig = dashboard.create_performance_dashboard()

        assert fig is not None
        assert len(fig.data) > 0

    except ImportError:
        pytest.skip("Plotly not installed")


# Test edge cases


def test_empty_equity_curve(
    sample_backtest_result,
    sample_performance_metrics,
    sample_trade_logs
):
    """Test handling empty equity curve."""
    dashboard = InteractiveDashboard()

    dashboard.add_strategy_result(
        strategy_name='Test',
        ticker='TEST',
        timeframe='1D',
        backtest_result=sample_backtest_result,
        performance_metrics=sample_performance_metrics,
        trade_logs=sample_trade_logs,
        equity_curve=[1000000]  # Single value
    )

    try:
        fig = dashboard.create_performance_dashboard()
        assert fig is not None
    except ImportError:
        pytest.skip("Plotly not installed")


def test_no_trades(
    sample_backtest_result,
    sample_performance_metrics,
    sample_equity_curve
):
    """Test handling no trades."""
    dashboard = InteractiveDashboard()

    dashboard.add_strategy_result(
        strategy_name='Test',
        ticker='TEST',
        timeframe='1D',
        backtest_result=sample_backtest_result,
        performance_metrics=sample_performance_metrics,
        trade_logs=[],  # No trades
        equity_curve=sample_equity_curve
    )

    try:
        fig = dashboard.create_performance_dashboard()
        assert fig is not None
    except ImportError:
        pytest.skip("Plotly not installed")


def test_auto_generated_timestamps(
    sample_backtest_result,
    sample_performance_metrics,
    sample_trade_logs
):
    """Test automatic timestamp generation."""
    dashboard = InteractiveDashboard()

    equity_curve = [1000000 + i * 1000 for i in range(100)]

    dashboard.add_strategy_result(
        strategy_name='Test',
        ticker='TEST',
        timeframe='1D',
        backtest_result=sample_backtest_result,
        performance_metrics=sample_performance_metrics,
        trade_logs=sample_trade_logs,
        equity_curve=equity_curve,
        timestamps=None  # Auto-generate
    )

    result = dashboard.strategy_results['TEST_Test_1D']
    assert result.timestamps == list(range(100))


# Performance tests


def test_large_dataset_performance(
    sample_backtest_result,
    sample_performance_metrics
):
    """Test dashboard handles large datasets efficiently."""
    dashboard = InteractiveDashboard()

    # Create large equity curve
    large_equity = [1000000 + i * 100 for i in range(10000)]

    # Create many trades
    large_trades = [
        TradeLog(
            trade_id=i,
            timestamp=i,
            action='BUY' if i % 2 == 0 else 'SELL',
            price_cents=10000 + i,
            position_size=10,
            strategy_name='Test',
            pnl_cents=100 if i % 2 == 0 else -50
        )
        for i in range(1000)
    ]

    dashboard.add_strategy_result(
        strategy_name='LargeTest',
        ticker='TEST',
        timeframe='1D',
        backtest_result=sample_backtest_result,
        performance_metrics=sample_performance_metrics,
        trade_logs=large_trades,
        equity_curve=large_equity
    )

    try:
        fig = dashboard.create_performance_dashboard()
        assert fig is not None
    except ImportError:
        pytest.skip("Plotly not installed")


# Integration tests


def test_full_workflow(dashboard, tmp_path):
    """Test complete dashboard workflow."""
    try:
        # Create dashboard
        fig = dashboard.create_performance_dashboard(
            tickers=['AAPL', 'MSFT'],
            strategies=['Fibonacci']
        )
        assert fig is not None

        # Create comparison table
        table = dashboard.create_strategy_comparison_table()
        assert table is not None

        # Get statistics (filtered by AAPL and MSFT with Fibonacci)
        summary = dashboard.get_summary_statistics(
            tickers=['AAPL', 'MSFT'],
            strategies=['Fibonacci']
        )
        assert summary['num_strategies'] == 2

        # Export HTML
        html_file = tmp_path / "dashboard.html"
        dashboard.export_html(html_file)
        assert html_file.exists()

    except ImportError:
        pytest.skip("Plotly not installed")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])

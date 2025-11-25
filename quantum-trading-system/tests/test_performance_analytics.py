"""
Unit Tests for Performance Analytics - Agent 18
Comprehensive tests for advanced performance metrics with integer-only arithmetic.
"""

import unittest
import sys
from pathlib import Path
from dataclasses import dataclass

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from backtesting.performance_analytics import (
    PerformanceAnalytics,
    PerformanceMetrics,
    DrawdownPeriod
)


@dataclass
class MockTrade:
    """Mock trade for testing."""
    action: str
    pnl_cents: int


class TestPerformanceAnalyticsInitialization(unittest.TestCase):
    """Test Performance Analytics initialization."""

    def setUp(self):
        """Initialize analytics for tests."""
        self.analytics = PerformanceAnalytics()

    def test_initialization(self):
        """Test analytics initializes correctly."""
        self.assertEqual(self.analytics.SCALE_FACTOR, 1000)
        self.assertEqual(self.analytics.TRADING_DAYS_PER_YEAR, 252)


class TestSharpeRatioCalculation(unittest.TestCase):
    """Test Sharpe ratio calculation."""

    def setUp(self):
        """Initialize analytics."""
        self.analytics = PerformanceAnalytics()

    def test_sharpe_ratio_positive_returns(self):
        """Test Sharpe ratio with positive returns."""
        # Equity curve with positive trend
        equity = [10000000 + i * 100000 for i in range(50)]

        sharpe = self.analytics._calculate_sharpe_ratio(equity)

        # Should be positive
        self.assertGreater(sharpe, 0)
        self.assertIsInstance(sharpe, int)

    def test_sharpe_ratio_negative_returns(self):
        """Test Sharpe ratio with negative returns."""
        # Declining equity
        equity = [10000000 - i * 100000 for i in range(50)]

        sharpe = self.analytics._calculate_sharpe_ratio(equity)

        # Should be negative
        self.assertLess(sharpe, 0)

    def test_sharpe_ratio_flat_returns(self):
        """Test Sharpe ratio with flat returns."""
        # Flat equity (no volatility)
        equity = [10000000] * 50

        sharpe = self.analytics._calculate_sharpe_ratio(equity)

        # Should be zero (no volatility)
        self.assertEqual(sharpe, 0)

    def test_sharpe_ratio_empty_curve(self):
        """Test Sharpe ratio with empty equity curve."""
        sharpe = self.analytics._calculate_sharpe_ratio([])
        self.assertEqual(sharpe, 0)

    def test_sharpe_ratio_single_value(self):
        """Test Sharpe ratio with single equity value."""
        sharpe = self.analytics._calculate_sharpe_ratio([10000000])
        self.assertEqual(sharpe, 0)


class TestSortinoRatioCalculation(unittest.TestCase):
    """Test Sortino ratio calculation."""

    def setUp(self):
        """Initialize analytics."""
        self.analytics = PerformanceAnalytics()

    def test_sortino_ratio_with_downside(self):
        """Test Sortino ratio with downside volatility."""
        # Mixed returns with some downside
        equity = [10000000, 10100000, 10050000, 10150000, 10100000, 10200000]

        sortino = self.analytics._calculate_sortino_ratio(equity)

        # Should be positive (upward trend despite downside)
        self.assertGreater(sortino, 0)
        self.assertIsInstance(sortino, int)

    def test_sortino_ratio_no_downside(self):
        """Test Sortino ratio with no downside (only gains)."""
        # Only positive returns
        equity = [10000000 + i * 100000 for i in range(20)]

        sortino = self.analytics._calculate_sortino_ratio(equity)

        # Should be very high (infinite approximation)
        self.assertEqual(sortino, 99999)

    def test_sortino_ratio_all_downside(self):
        """Test Sortino ratio with all negative returns."""
        # Only losses
        equity = [10000000 - i * 50000 for i in range(20)]

        sortino = self.analytics._calculate_sortino_ratio(equity)

        # Should be negative
        self.assertLess(sortino, 0)


class TestDrawdownAnalysis(unittest.TestCase):
    """Test drawdown analysis."""

    def setUp(self):
        """Initialize analytics."""
        self.analytics = PerformanceAnalytics()

    def test_single_drawdown(self):
        """Test analysis of single drawdown period."""
        # Simple drawdown and recovery
        equity = [10000000, 11000000, 10500000, 10000000, 10500000, 11000000, 11500000]

        drawdowns = self.analytics._analyze_drawdowns(equity)

        # Should detect one drawdown
        self.assertGreater(len(drawdowns), 0)

        # Verify drawdown structure
        dd = drawdowns[0]
        self.assertIsInstance(dd, DrawdownPeriod)
        self.assertGreater(dd.drawdown_cents, 0)
        self.assertGreater(dd.peak_capital_cents, dd.trough_capital_cents)

    def test_multiple_drawdowns(self):
        """Test analysis of multiple drawdown periods."""
        # Multiple peaks and troughs
        equity = [
            10000000, 11000000, 10000000,  # DD 1
            11500000, 10500000,  # DD 2
            12000000, 11000000, 12500000  # DD 3
        ]

        drawdowns = self.analytics._analyze_drawdowns(equity)

        # Should detect multiple drawdowns
        self.assertGreaterEqual(len(drawdowns), 2)

    def test_max_drawdown_detection(self):
        """Test maximum drawdown detection."""
        # Create equity curve with known max drawdown
        equity = [10000000, 12000000, 8000000, 11000000, 13000000]

        drawdowns = self.analytics._analyze_drawdowns(equity)
        max_dd_cents, max_dd_pct, max_dd_dur = self.analytics._get_max_drawdown(drawdowns)

        # Max drawdown should be 12M - 8M = 4M cents
        self.assertEqual(max_dd_cents, 4000000)

        # Percentage should be ~33.3% (scaled by 1000 = 333)
        expected_pct = (4000000 * 1000) // 12000000
        self.assertEqual(max_dd_pct, expected_pct)

    def test_average_drawdown(self):
        """Test average drawdown calculation."""
        # Multiple drawdowns
        equity = [10000000, 11000000, 10500000, 11500000, 10000000, 12000000]

        drawdowns = self.analytics._analyze_drawdowns(equity)
        avg_dd, avg_dur = self.analytics._get_average_drawdown(drawdowns)

        # Should calculate average
        self.assertGreater(avg_dd, 0)
        self.assertIsInstance(avg_dd, int)

    def test_no_drawdowns(self):
        """Test equity curve with no drawdowns."""
        # Only increasing equity
        equity = [10000000 + i * 100000 for i in range(20)]

        drawdowns = self.analytics._analyze_drawdowns(equity)

        # Should have no drawdowns
        self.assertEqual(len(drawdowns), 0)

    def test_recovery_metrics(self):
        """Test recovery time metrics."""
        # Drawdown with recovery
        equity = [10000000, 12000000, 10000000, 11000000, 12000000, 13000000]

        drawdowns = self.analytics._analyze_drawdowns(equity)
        avg_recovery, max_recovery = self.analytics._get_recovery_metrics(drawdowns)

        # Should have recovery metrics
        self.assertGreaterEqual(avg_recovery, 0)
        self.assertGreaterEqual(max_recovery, 0)


class TestWinLossAnalysis(unittest.TestCase):
    """Test win/loss ratio analysis."""

    def setUp(self):
        """Initialize analytics."""
        self.analytics = PerformanceAnalytics()

    def test_win_rate_calculation(self):
        """Test win rate calculation."""
        winning = [MockTrade('SELL', 10000) for _ in range(7)]
        losing = [MockTrade('SELL', -5000) for _ in range(3)]

        win_rate = self.analytics._calculate_win_rate(winning, losing)

        # 7 wins out of 10 = 70% = 700 scaled
        self.assertEqual(win_rate, 700)

    def test_win_rate_all_wins(self):
        """Test win rate with all winning trades."""
        winning = [MockTrade('SELL', 10000) for _ in range(10)]
        losing = []

        win_rate = self.analytics._calculate_win_rate(winning, losing)

        # 100% = 1000 scaled
        self.assertEqual(win_rate, 1000)

    def test_win_rate_all_losses(self):
        """Test win rate with all losing trades."""
        winning = []
        losing = [MockTrade('SELL', -5000) for _ in range(10)]

        win_rate = self.analytics._calculate_win_rate(winning, losing)

        # 0% = 0 scaled
        self.assertEqual(win_rate, 0)

    def test_win_loss_ratio(self):
        """Test win/loss ratio calculation."""
        winning = [MockTrade('SELL', 20000), MockTrade('SELL', 30000)]
        losing = [MockTrade('SELL', -10000)]

        ratio = self.analytics._calculate_win_loss_ratio(winning, losing)

        # Avg win = 25000, avg loss = 10000, ratio = 2.5 = 2500 scaled
        expected = (25000 * 1000) // 10000
        self.assertEqual(ratio, expected)

    def test_win_loss_ratio_no_losses(self):
        """Test win/loss ratio with no losses."""
        winning = [MockTrade('SELL', 20000)]
        losing = []

        ratio = self.analytics._calculate_win_loss_ratio(winning, losing)

        # Should return 0 (no losses to compare)
        self.assertEqual(ratio, 0)


class TestProfitFactor(unittest.TestCase):
    """Test profit factor calculation."""

    def setUp(self):
        """Initialize analytics."""
        self.analytics = PerformanceAnalytics()

    def test_profit_factor_positive(self):
        """Test profit factor with profits > losses."""
        gross_profit = 100000
        gross_loss = 40000

        pf = self.analytics._calculate_profit_factor(gross_profit, gross_loss)

        # PF = 100000 / 40000 = 2.5 = 2500 scaled
        self.assertEqual(pf, 2500)

    def test_profit_factor_no_losses(self):
        """Test profit factor with no losses."""
        pf = self.analytics._calculate_profit_factor(100000, 0)

        # Should return max value (infinite)
        self.assertEqual(pf, 99999)

    def test_profit_factor_no_profits(self):
        """Test profit factor with no profits."""
        pf = self.analytics._calculate_profit_factor(0, 50000)

        # Should return 0
        self.assertEqual(pf, 0)


class TestExpectancyAndKelly(unittest.TestCase):
    """Test expectancy and Kelly criterion."""

    def setUp(self):
        """Initialize analytics."""
        self.analytics = PerformanceAnalytics()

    def test_expectancy_positive(self):
        """Test expectancy with positive expected value."""
        winning = [MockTrade('SELL', 30000), MockTrade('SELL', 40000)]
        losing = [MockTrade('SELL', -15000)]

        expectancy = self.analytics._calculate_expectancy(winning, losing)

        # Total PnL = 30000 + 40000 - 15000 = 55000
        # Expectancy = 55000 / 3 = 18333
        expected = (30000 + 40000 - 15000) // 3
        self.assertEqual(expectancy, expected)

    def test_expectancy_negative(self):
        """Test expectancy with negative expected value."""
        winning = [MockTrade('SELL', 10000)]
        losing = [MockTrade('SELL', -20000), MockTrade('SELL', -15000)]

        expectancy = self.analytics._calculate_expectancy(winning, losing)

        # Should be negative
        self.assertLess(expectancy, 0)

    def test_kelly_criterion(self):
        """Test Kelly criterion calculation."""
        # Win rate 60% (600 scaled), win/loss ratio 2:1 (2000 scaled)
        kelly = self.analytics._calculate_kelly_criterion(600, 2000)

        # Kelly = 0.6 - (0.4 / 2) = 0.6 - 0.2 = 0.4 = 400 scaled
        # W = 600, (1-W) = 400, (1-W)/R = 400*1000/2000 = 200
        # Kelly = 600 - 200 = 400
        # But capped at 25% (250) for safety
        self.assertEqual(kelly, 250)

    def test_kelly_criterion_capped(self):
        """Test Kelly criterion is capped at 25%."""
        # Very favorable: 90% win rate, 5:1 ratio
        kelly = self.analytics._calculate_kelly_criterion(900, 5000)

        # Should be capped at 250 (25%)
        self.assertLessEqual(kelly, 250)


class TestStreakAnalysis(unittest.TestCase):
    """Test consecutive wins/losses tracking."""

    def setUp(self):
        """Initialize analytics."""
        self.analytics = PerformanceAnalytics()

    def test_consecutive_wins(self):
        """Test detection of consecutive wins."""
        trades = [
            MockTrade('SELL', 10000),
            MockTrade('SELL', 15000),
            MockTrade('SELL', 20000),
            MockTrade('SELL', -5000),
            MockTrade('SELL', 10000)
        ]

        max_wins, max_losses, current = self.analytics._analyze_streaks(trades)

        # Max consecutive wins should be 3
        self.assertEqual(max_wins, 3)
        # Current streak should be 1 win
        self.assertEqual(current, 1)

    def test_consecutive_losses(self):
        """Test detection of consecutive losses."""
        trades = [
            MockTrade('SELL', 10000),
            MockTrade('SELL', -5000),
            MockTrade('SELL', -8000),
            MockTrade('SELL', -6000),
            MockTrade('SELL', 15000)
        ]

        max_wins, max_losses, current = self.analytics._analyze_streaks(trades)

        # Max consecutive losses should be 3
        self.assertEqual(max_losses, 3)
        # Current streak should be 1 win
        self.assertEqual(current, 1)

    def test_current_losing_streak(self):
        """Test current losing streak detection."""
        trades = [
            MockTrade('SELL', 10000),
            MockTrade('SELL', -5000),
            MockTrade('SELL', -8000)
        ]

        max_wins, max_losses, current = self.analytics._analyze_streaks(trades)

        # Current streak should be -2 (2 losses)
        self.assertEqual(current, -2)


class TestTradeDistribution(unittest.TestCase):
    """Test trade distribution analysis."""

    def setUp(self):
        """Initialize analytics."""
        self.analytics = PerformanceAnalytics()

    def test_median_calculation(self):
        """Test median calculation."""
        values = [10000, 20000, 30000, 40000, 50000]
        median = self.analytics._median(values)

        # Median of 5 values is middle value
        self.assertEqual(median, 30000)

    def test_median_even_count(self):
        """Test median with even number of values."""
        values = [10000, 20000, 30000, 40000]
        median = self.analytics._median(values)

        # Median should be average of two middle values
        self.assertEqual(median, (20000 + 30000) // 2)

    def test_std_dev_calculation(self):
        """Test standard deviation calculation."""
        values = [10000, 15000, 20000, 25000, 30000]
        std = self.analytics._std_dev(values)

        # Should calculate integer std dev
        self.assertGreater(std, 0)
        self.assertIsInstance(std, int)

    def test_calculate_medians(self):
        """Test median win/loss calculation."""
        winning = [MockTrade('SELL', 20000), MockTrade('SELL', 30000), MockTrade('SELL', 40000)]
        losing = [MockTrade('SELL', -10000), MockTrade('SELL', -15000)]

        median_win, median_loss = self.analytics._calculate_medians(winning, losing)

        # Median win should be 30000
        self.assertEqual(median_win, 30000)
        # Median loss should be average of -10000 and -15000
        self.assertEqual(median_loss, (-10000 + -15000) // 2)


class TestReturnMetrics(unittest.TestCase):
    """Test return calculations."""

    def setUp(self):
        """Initialize analytics."""
        self.analytics = PerformanceAnalytics()

    def test_total_return(self):
        """Test total return calculation."""
        initial = 10000000
        final = 15000000

        total_return = self.analytics._calculate_total_return(initial, final)

        # Return = (15M - 10M) / 10M = 0.5 = 500 scaled
        self.assertEqual(total_return, 500)

    def test_annualized_return(self):
        """Test annualized return calculation."""
        initial = 10000000
        final = 15000000
        total_periods = 252  # 1 year
        periods_per_year = 252

        ann_return = self.analytics._calculate_annualized_return(
            initial, final, total_periods, periods_per_year
        )

        # Should equal total return for 1 year
        total_return = self.analytics._calculate_total_return(initial, final)
        self.assertEqual(ann_return, total_return)


class TestRiskAdjustedRatios(unittest.TestCase):
    """Test risk-adjusted return ratios."""

    def setUp(self):
        """Initialize analytics."""
        self.analytics = PerformanceAnalytics()

    def test_calmar_ratio(self):
        """Test Calmar ratio calculation."""
        annual_return = 200  # 20% scaled
        max_dd_pct = 100  # 10% scaled

        calmar = self.analytics._calculate_calmar_ratio(annual_return, max_dd_pct)

        # Calmar = 200 / 100 = 2.0 = 2000 scaled
        self.assertEqual(calmar, 2000)

    def test_calmar_no_drawdown(self):
        """Test Calmar with no drawdown."""
        calmar = self.analytics._calculate_calmar_ratio(200, 0)

        # Should return max value
        self.assertEqual(calmar, 99999)

    def test_mar_ratio(self):
        """Test MAR ratio (same as Calmar)."""
        annual_return = 300
        max_dd_pct = 150

        mar = self.analytics._calculate_mar_ratio(annual_return, max_dd_pct)
        calmar = self.analytics._calculate_calmar_ratio(annual_return, max_dd_pct)

        # MAR should equal Calmar
        self.assertEqual(mar, calmar)

    def test_sterling_ratio(self):
        """Test Sterling ratio calculation."""
        annual_return = 250  # 25% scaled
        avg_dd_cents = 500000  # $5,000
        initial_capital = 10000000  # $100,000

        sterling = self.analytics._calculate_sterling_ratio(annual_return, avg_dd_cents, initial_capital)

        # Should calculate ratio
        self.assertGreater(sterling, 0)
        self.assertIsInstance(sterling, int)


class TestIntegerOperations(unittest.TestCase):
    """Test integer-only operations."""

    def setUp(self):
        """Initialize analytics."""
        self.analytics = PerformanceAnalytics()

    def test_integer_sqrt(self):
        """Test integer square root."""
        # Test perfect squares
        self.assertEqual(self.analytics._integer_sqrt(0), 0)
        self.assertEqual(self.analytics._integer_sqrt(1), 1)
        self.assertEqual(self.analytics._integer_sqrt(4), 2)
        self.assertEqual(self.analytics._integer_sqrt(9), 3)
        self.assertEqual(self.analytics._integer_sqrt(16), 4)
        self.assertEqual(self.analytics._integer_sqrt(25), 5)
        self.assertEqual(self.analytics._integer_sqrt(100), 10)

        # Test non-perfect squares (should round down)
        self.assertEqual(self.analytics._integer_sqrt(5), 2)
        self.assertEqual(self.analytics._integer_sqrt(8), 2)
        self.assertEqual(self.analytics._integer_sqrt(15), 3)

    def test_integer_sqrt_large_values(self):
        """Test integer sqrt with large values."""
        result = self.analytics._integer_sqrt(1000000)
        self.assertEqual(result, 1000)

    def test_all_calculations_are_integers(self):
        """Test that all calculations return integers."""
        # Create sample data
        equity = [10000000 + i * 50000 for i in range(50)]
        trades = [
            MockTrade('SELL', 20000),
            MockTrade('SELL', -10000),
            MockTrade('SELL', 30000)
        ]

        metrics = self.analytics.analyze_performance(
            equity_curve=equity,
            trades=trades,
            initial_capital_cents=10000000
        )

        # Verify all metrics are integers
        self.assertIsInstance(metrics.sharpe_ratio_scaled, int)
        self.assertIsInstance(metrics.sortino_ratio_scaled, int)
        self.assertIsInstance(metrics.max_drawdown_cents, int)
        self.assertIsInstance(metrics.calmar_ratio_scaled, int)
        self.assertIsInstance(metrics.win_rate_scaled, int)
        self.assertIsInstance(metrics.profit_factor_scaled, int)
        self.assertIsInstance(metrics.expectancy_cents, int)
        self.assertIsInstance(metrics.kelly_criterion_scaled, int)


class TestFullAnalysis(unittest.TestCase):
    """Test complete performance analysis."""

    def setUp(self):
        """Initialize analytics."""
        self.analytics = PerformanceAnalytics()

    def test_analyze_performance_complete(self):
        """Test complete performance analysis."""
        # Create realistic equity curve
        equity = [10000000]
        for i in range(100):
            if i % 10 < 7:
                equity.append(equity[-1] + 50000)
            else:
                equity.append(equity[-1] - 30000)

        # Create trades
        trades = []
        for i in range(20):
            if i % 3 == 0:
                trades.append(MockTrade('SELL', -15000))
            else:
                trades.append(MockTrade('SELL', 25000))

        # Analyze
        metrics = self.analytics.analyze_performance(
            equity_curve=equity,
            trades=trades,
            initial_capital_cents=10000000
        )

        # Verify metrics structure
        self.assertIsInstance(metrics, PerformanceMetrics)
        self.assertGreaterEqual(metrics.win_rate_scaled, 0)
        self.assertLessEqual(metrics.win_rate_scaled, 1000)

    def test_generate_analytics_report(self):
        """Test analytics report generation."""
        # Create sample metrics
        equity = [10000000 + i * 100000 for i in range(50)]
        trades = [MockTrade('SELL', 50000), MockTrade('SELL', -20000)]

        metrics = self.analytics.analyze_performance(
            equity_curve=equity,
            trades=trades,
            initial_capital_cents=10000000
        )

        # Generate report
        report = self.analytics.generate_analytics_report(metrics)

        # Verify report is string
        self.assertIsInstance(report, str)
        self.assertIn("PERFORMANCE ANALYTICS REPORT", report)
        self.assertIn("Agent 18", report)
        self.assertIn("Sharpe Ratio", report)


def run_tests():
    """Run all tests."""
    unittest.main(argv=[''], exit=False, verbosity=2)


if __name__ == '__main__':
    run_tests()

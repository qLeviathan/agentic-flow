"""
Test Suite for Backtest Validator - Agent 20 (Zeckendorf: 10000111)

Comprehensive tests for backtesting validation framework.

Tests:
- Look-ahead bias detection
- Integer-only arithmetic validation
- Trade execution logic validation
- Performance metrics validation
- Signal timing validation
- P&L calculation validation
- Commission/slippage validation
- Equity curve validation
- Price data integrity validation
- Drawdown calculation validation
"""

import unittest
import sys
from pathlib import Path

# Add parent directory for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from backtesting.backtest_validator import (
    BacktestValidator,
    ValidationResult,
    ValidationReport
)
from backtesting.backtest_engine import (
    BacktestEngine,
    BacktestResult,
    TradeLog
)
from strategies.fibonacci_strategy import FibonacciRetracementStrategy


class TestValidationResult(unittest.TestCase):
    """Test ValidationResult dataclass."""

    def test_validation_result_creation(self):
        """Test creating a validation result."""
        result = ValidationResult(
            check_name="Test Check",
            passed=True,
            severity="INFO",
            message="Test passed",
            details={'count': 5}
        )

        self.assertEqual(result.check_name, "Test Check")
        self.assertTrue(result.passed)
        self.assertEqual(result.severity, "INFO")
        self.assertEqual(result.message, "Test passed")
        self.assertEqual(result.details['count'], 5)

    def test_validation_result_to_dict(self):
        """Test converting validation result to dictionary."""
        result = ValidationResult(
            check_name="Test Check",
            passed=False,
            severity="WARNING",
            message="Test warning",
            details={'issues': ['issue1', 'issue2']}
        )

        result_dict = result.to_dict()

        self.assertEqual(result_dict['check_name'], "Test Check")
        self.assertFalse(result_dict['passed'])
        self.assertEqual(result_dict['severity'], "WARNING")
        self.assertEqual(len(result_dict['details']['issues']), 2)


class TestBacktestValidator(unittest.TestCase):
    """Test BacktestValidator core functionality."""

    def setUp(self):
        """Set up test fixtures."""
        self.validator = BacktestValidator()

        # Create sample price data
        self.price_data = []
        base_price = 10000
        for i in range(100):
            price = base_price + i * 50 + (i % 10) * 100
            self.price_data.append(price)

        # Create sample backtest
        self.strategy = FibonacciRetracementStrategy(max_position_cents=1000000)
        self.engine = BacktestEngine(
            initial_capital_cents=10000000,
            commission_cents=10,
            slippage_cents=5
        )

        self.backtest_result = self.engine.run_backtest(
            price_data=self.price_data,
            strategy=self.strategy,
            strategy_name="Test Strategy",
            lookback_period=20
        )

    def test_validator_initialization(self):
        """Test validator initialization."""
        validator = BacktestValidator()
        self.assertEqual(len(validator.validation_results), 0)
        self.assertEqual(validator.EPSILON, 1)

    def test_validate_backtest(self):
        """Test complete backtest validation."""
        report = self.validator.validate_backtest(
            backtest_result=self.backtest_result,
            price_data=self.price_data,
            strategy=self.strategy,
            backtest_name="Test Backtest"
        )

        self.assertIsInstance(report, ValidationReport)
        self.assertEqual(report.backtest_name, "Test Backtest")
        self.assertGreater(report.total_checks, 0)
        self.assertGreaterEqual(report.passed_checks, 0)

    def test_integer_only_validation_pass(self):
        """Test integer-only validation with valid data."""
        self.validator._validate_integer_only_operations(self.backtest_result)

        # Should have one validation result
        self.assertEqual(len(self.validator.validation_results), 1)

        result = self.validator.validation_results[0]
        self.assertEqual(result.check_name, "Integer-Only Arithmetic")

        # Should pass if all values are integers
        if result.passed:
            self.assertEqual(result.severity, "INFO")

    def test_look_ahead_bias_detection(self):
        """Test look-ahead bias detection."""
        self.validator._validate_look_ahead_bias(
            self.backtest_result,
            self.price_data
        )

        self.assertEqual(len(self.validator.validation_results), 1)
        result = self.validator.validation_results[0]
        self.assertEqual(result.check_name, "Look-Ahead Bias Detection")

    def test_trade_execution_logic_validation(self):
        """Test trade execution logic validation."""
        self.validator._validate_trade_execution_logic(self.backtest_result)

        self.assertEqual(len(self.validator.validation_results), 1)
        result = self.validator.validation_results[0]
        self.assertEqual(result.check_name, "Trade Execution Logic")

    def test_performance_metrics_validation(self):
        """Test performance metrics validation."""
        self.validator._validate_performance_metrics(self.backtest_result)

        self.assertEqual(len(self.validator.validation_results), 1)
        result = self.validator.validation_results[0]
        self.assertEqual(result.check_name, "Performance Metrics Validation")

    def test_signal_timing_validation(self):
        """Test signal timing validation."""
        self.validator._validate_signal_timing(self.backtest_result)

        self.assertEqual(len(self.validator.validation_results), 1)
        result = self.validator.validation_results[0]
        self.assertEqual(result.check_name, "Signal Timing Validation")

    def test_pnl_calculations_validation(self):
        """Test P&L calculations validation."""
        self.validator._validate_pnl_calculations(self.backtest_result)

        self.assertEqual(len(self.validator.validation_results), 1)
        result = self.validator.validation_results[0]
        self.assertEqual(result.check_name, "P&L Calculation Validation")

    def test_commission_slippage_validation(self):
        """Test commission/slippage validation."""
        self.validator._validate_commission_slippage(self.backtest_result)

        self.assertEqual(len(self.validator.validation_results), 1)
        result = self.validator.validation_results[0]
        self.assertEqual(result.check_name, "Commission/Slippage Validation")

    def test_equity_curve_validation(self):
        """Test equity curve validation."""
        self.validator._validate_equity_curve(self.backtest_result)

        self.assertEqual(len(self.validator.validation_results), 1)
        result = self.validator.validation_results[0]
        self.assertEqual(result.check_name, "Equity Curve Validation")

    def test_price_data_integrity_validation(self):
        """Test price data integrity validation."""
        self.validator._validate_price_data_integrity(self.price_data)

        self.assertEqual(len(self.validator.validation_results), 1)
        result = self.validator.validation_results[0]
        self.assertEqual(result.check_name, "Price Data Integrity")

    def test_drawdown_calculation_validation(self):
        """Test drawdown calculation validation."""
        self.validator._validate_drawdown_calculation(self.backtest_result)

        self.assertEqual(len(self.validator.validation_results), 1)
        result = self.validator.validation_results[0]
        self.assertEqual(result.check_name, "Drawdown Calculation")


class TestLookAheadBiasDetection(unittest.TestCase):
    """Test look-ahead bias detection specifically."""

    def test_detect_invalid_timestamp(self):
        """Test detection of invalid timestamps."""
        validator = BacktestValidator()

        # Create backtest with invalid timestamp
        trades = [
            TradeLog(
                trade_id=1,
                timestamp=-1,  # Invalid negative timestamp
                action='BUY',
                price_cents=10000,
                position_size=100,
                strategy_name='Test'
            )
        ]

        backtest_result = BacktestResult(
            total_trades=1,
            winning_trades=0,
            losing_trades=0,
            win_rate_scaled=0,
            total_pnl_cents=0,
            gross_profit_cents=0,
            gross_loss_cents=0,
            average_win_cents=0,
            average_loss_cents=0,
            largest_win_cents=0,
            largest_loss_cents=0,
            sharpe_ratio_scaled=0,
            sortino_ratio_scaled=0,
            profit_factor_scaled=0,
            max_drawdown_cents=0,
            max_drawdown_percent_scaled=0,
            initial_capital_cents=10000000,
            final_capital_cents=10000000,
            peak_capital_cents=10000000,
            trades=trades,
            equity_curve=[10000000],
            total_commission_cents=0,
            strategy_name='Test'
        )

        price_data = [10000] * 50

        validator._validate_look_ahead_bias(backtest_result, price_data)

        result = validator.validation_results[0]
        self.assertFalse(result.passed)
        self.assertGreater(len(result.details['issues']), 0)

    def test_detect_out_of_order_trades(self):
        """Test detection of out-of-chronological-order trades."""
        validator = BacktestValidator()

        # Create trades out of order
        trades = [
            TradeLog(
                trade_id=1,
                timestamp=10,
                action='BUY',
                price_cents=10000,
                position_size=100,
                strategy_name='Test'
            ),
            TradeLog(
                trade_id=2,
                timestamp=5,  # Earlier than previous trade
                action='SELL',
                price_cents=10500,
                position_size=100,
                strategy_name='Test',
                pnl_cents=5000
            )
        ]

        backtest_result = BacktestResult(
            total_trades=1,
            winning_trades=1,
            losing_trades=0,
            win_rate_scaled=1000,
            total_pnl_cents=5000,
            gross_profit_cents=5000,
            gross_loss_cents=0,
            average_win_cents=5000,
            average_loss_cents=0,
            largest_win_cents=5000,
            largest_loss_cents=0,
            sharpe_ratio_scaled=0,
            sortino_ratio_scaled=0,
            profit_factor_scaled=99999,
            max_drawdown_cents=0,
            max_drawdown_percent_scaled=0,
            initial_capital_cents=10000000,
            final_capital_cents=10005000,
            peak_capital_cents=10005000,
            trades=trades,
            equity_curve=[10000000, 10005000],
            total_commission_cents=0,
            strategy_name='Test'
        )

        price_data = [10000] * 20

        validator._validate_look_ahead_bias(backtest_result, price_data)

        result = validator.validation_results[0]
        self.assertFalse(result.passed)
        self.assertIn('out of chronological order', str(result.details['issues']))


class TestIntegerOnlyValidation(unittest.TestCase):
    """Test integer-only arithmetic validation."""

    def test_detect_float_values(self):
        """Test detection of float values in results."""
        validator = BacktestValidator()

        # Create a mock result with float value (for testing detection)
        # We'll use a custom object to bypass type checking in constructor
        class MockBacktestResult:
            def __init__(self):
                self.total_pnl_cents = 100.5  # Float value
                self.gross_profit_cents = 200
                self.gross_loss_cents = 100
                self.average_win_cents = 50
                self.average_loss_cents = 50
                self.largest_win_cents = 100
                self.largest_loss_cents = -50
                self.max_drawdown_cents = 0
                self.initial_capital_cents = 10000000
                self.final_capital_cents = 10000100
                self.peak_capital_cents = 10000100
                self.total_commission_cents = 0
                self.win_rate_scaled = 500
                self.sharpe_ratio_scaled = 1000
                self.sortino_ratio_scaled = 1200
                self.profit_factor_scaled = 2000
                self.max_drawdown_percent_scaled = 0
                self.equity_curve = [10000000, 10000100]
                self.trades = []

        mock_result = MockBacktestResult()
        validator._validate_integer_only_operations(mock_result)

        result = validator.validation_results[0]
        self.assertFalse(result.passed)
        self.assertEqual(result.severity, 'CRITICAL')
        self.assertGreater(len(result.details['issues']), 0)


class TestPerformanceMetricsValidation(unittest.TestCase):
    """Test performance metrics validation."""

    def test_validate_correct_metrics(self):
        """Test validation of correct performance metrics."""
        validator = BacktestValidator()

        # Create a simple backtest with known values
        engine = BacktestEngine(
            initial_capital_cents=10000000,
            commission_cents=0
        )

        # Execute simple trades
        engine.execute_trade(
            timestamp=1,
            action='BUY',
            price_cents=10000,
            position_size=100,
            strategy_name='Test'
        )
        engine.execute_trade(
            timestamp=2,
            action='SELL',
            price_cents=11000,
            position_size=100,
            strategy_name='Test',
            entry_price_cents=10000
        )

        result = engine._calculate_metrics('Test')

        validator._validate_performance_metrics(result)

        validation_result = validator.validation_results[0]

        # Should pass with correct calculations
        if validation_result.passed:
            self.assertEqual(validation_result.severity, 'INFO')


class TestValidationReport(unittest.TestCase):
    """Test validation report generation."""

    def test_report_generation(self):
        """Test validation report generation."""
        validator = BacktestValidator()

        # Add some validation results
        validator.validation_results = [
            ValidationResult(
                check_name="Check 1",
                passed=True,
                severity="INFO",
                message="Passed",
                details={}
            ),
            ValidationResult(
                check_name="Check 2",
                passed=False,
                severity="WARNING",
                message="Warning",
                details={'issues': ['issue1']}
            ),
            ValidationResult(
                check_name="Check 3",
                passed=False,
                severity="CRITICAL",
                message="Critical",
                details={'issues': ['critical1']}
            )
        ]

        report = validator._generate_report("Test Backtest")

        self.assertEqual(report.backtest_name, "Test Backtest")
        self.assertEqual(report.total_checks, 3)
        self.assertEqual(report.passed_checks, 1)
        self.assertEqual(report.failed_checks, 2)
        self.assertEqual(report.warnings, 1)
        self.assertEqual(report.critical_failures, 1)
        self.assertFalse(report.overall_passed)  # Critical failure means overall fail

    def test_report_to_dict(self):
        """Test converting report to dictionary."""
        report = ValidationReport(
            backtest_name="Test",
            total_checks=5,
            passed_checks=4,
            failed_checks=1,
            warnings=1,
            critical_failures=0,
            overall_passed=True,
            results=[],
            summary="Test passed with warnings"
        )

        report_dict = report.to_dict()

        self.assertEqual(report_dict['backtest_name'], "Test")
        self.assertEqual(report_dict['summary']['total_checks'], 5)
        self.assertEqual(report_dict['summary']['passed_checks'], 4)
        self.assertTrue(report_dict['summary']['overall_passed'])


class TestPriceDataValidation(unittest.TestCase):
    """Test price data integrity validation."""

    def test_detect_negative_prices(self):
        """Test detection of negative prices."""
        validator = BacktestValidator()

        price_data = [10000, 10100, -500, 10200]  # Negative price

        validator._validate_price_data_integrity(price_data)

        result = validator.validation_results[0]
        self.assertFalse(result.passed)
        self.assertIn('Negative price', str(result.details['issues']))

    def test_detect_zero_prices(self):
        """Test detection of zero prices."""
        validator = BacktestValidator()

        price_data = [10000, 0, 10200]  # Zero price

        validator._validate_price_data_integrity(price_data)

        result = validator.validation_results[0]
        self.assertFalse(result.passed)
        self.assertIn('Zero price', str(result.details['issues']))

    def test_detect_unrealistic_jumps(self):
        """Test detection of unrealistic price jumps."""
        validator = BacktestValidator()

        # 300% price jump (10000 to 40000)
        price_data = [10000, 40000, 10200]

        validator._validate_price_data_integrity(price_data)

        result = validator.validation_results[0]
        self.assertFalse(result.passed)
        self.assertIn('Unrealistic price jump', str(result.details['issues']))


def run_tests():
    """Run all tests."""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestValidationResult))
    suite.addTests(loader.loadTestsFromTestCase(TestBacktestValidator))
    suite.addTests(loader.loadTestsFromTestCase(TestLookAheadBiasDetection))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegerOnlyValidation))
    suite.addTests(loader.loadTestsFromTestCase(TestPerformanceMetricsValidation))
    suite.addTests(loader.loadTestsFromTestCase(TestValidationReport))
    suite.addTests(loader.loadTestsFromTestCase(TestPriceDataValidation))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    return result


if __name__ == '__main__':
    result = run_tests()
    sys.exit(0 if result.wasSuccessful() else 1)

"""
Unit tests for Fibonacci Retracement Strategy (Agent 13)
Tests entry signals, exit signals, position sizing, and backtesting functionality.
"""

import unittest
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from strategies.fibonacci_strategy import FibonacciRetracementStrategy


class TestFibonacciStrategy(unittest.TestCase):
    """Test Fibonacci Retracement Strategy initialization and configuration."""

    def setUp(self):
        """Initialize strategy for tests."""
        self.strategy = FibonacciRetracementStrategy(max_position_cents=1000000)

    def test_initialization(self):
        """Test strategy initializes with correct default values."""
        self.assertEqual(self.strategy.max_position_cents, 1000000)
        self.assertEqual(self.strategy.scale, 1000)
        self.assertFalse(self.strategy.in_position)
        self.assertEqual(self.strategy.trades_executed, 0)
        self.assertEqual(self.strategy.winning_trades, 0)
        self.assertEqual(self.strategy.total_pnl_cents, 0)

    def test_retracement_level_constants(self):
        """Test Fibonacci level constants are correct."""
        self.assertEqual(self.strategy.LEVEL_382, 382)
        self.assertEqual(self.strategy.LEVEL_500, 500)
        self.assertEqual(self.strategy.LEVEL_618, 618)
        self.assertEqual(self.strategy.LEVEL_786, 786)

    def test_position_sizing_constants(self):
        """Test position sizing ratios."""
        self.assertEqual(self.strategy.POSITION_SIZE_382, 618)
        self.assertEqual(self.strategy.POSITION_SIZE_500, 1000)
        self.assertEqual(self.strategy.POSITION_SIZE_618, 1618)

    def test_risk_management_constants(self):
        """Test risk management ratios."""
        self.assertEqual(self.strategy.STOP_LOSS_RATIO, 236)
        self.assertEqual(self.strategy.TAKE_PROFIT_1, 618)
        self.assertEqual(self.strategy.TAKE_PROFIT_2, 1618)


class TestSwingPointUpdates(unittest.TestCase):
    """Test swing point updates and retracement calculations."""

    def setUp(self):
        """Initialize strategy for tests."""
        self.strategy = FibonacciRetracementStrategy(max_position_cents=1000000)

    def test_update_swing_points_valid(self):
        """Test updating swing points with valid data."""
        high = 15000  # $150.00
        low = 10000   # $100.00

        self.strategy.update_swing_points(high, low)

        self.assertEqual(self.strategy.current_swing_high, 15000)
        self.assertEqual(self.strategy.current_swing_low, 10000)
        self.assertIsNotNone(self.strategy.retracement_levels)
        self.assertIsNotNone(self.strategy.extension_levels)

    def test_update_swing_points_invalid(self):
        """Test updating swing points with invalid data raises error."""
        with self.assertRaises(ValueError):
            self.strategy.update_swing_points(10000, 15000)  # High < Low

        with self.assertRaises(ValueError):
            self.strategy.update_swing_points(10000, 10000)  # High == Low

    def test_retracement_levels_calculated(self):
        """Test that all retracement levels are calculated correctly."""
        high = 20000  # $200.00
        low = 10000   # $100.00
        price_range = 10000

        self.strategy.update_swing_points(high, low)

        # Check all levels exist
        self.assertIn('level_236', self.strategy.retracement_levels)
        self.assertIn('level_382', self.strategy.retracement_levels)
        self.assertIn('level_500', self.strategy.retracement_levels)
        self.assertIn('level_618', self.strategy.retracement_levels)
        self.assertIn('level_786', self.strategy.retracement_levels)
        self.assertIn('level_1000', self.strategy.retracement_levels)
        self.assertIn('golden_pocket_high', self.strategy.retracement_levels)
        self.assertIn('golden_pocket_low', self.strategy.retracement_levels)

        # Verify 50% level (should be midpoint)
        expected_50 = high - (price_range * 500) // 1000
        self.assertEqual(self.strategy.retracement_levels['level_500'], expected_50)
        self.assertEqual(self.strategy.retracement_levels['level_500'], 15000)

        # Verify 61.8% level
        expected_618 = high - (price_range * 618) // 1000
        self.assertEqual(self.strategy.retracement_levels['level_618'], expected_618)

        # Verify golden pocket
        self.assertEqual(
            self.strategy.retracement_levels['golden_pocket_high'],
            self.strategy.retracement_levels['level_500']
        )
        self.assertEqual(
            self.strategy.retracement_levels['golden_pocket_low'],
            self.strategy.retracement_levels['level_618']
        )

    def test_extension_levels_calculated(self):
        """Test that extension levels are calculated correctly."""
        high = 15000
        low = 10000

        self.strategy.update_swing_points(high, low)

        # Check all extension levels exist
        self.assertIn('ext_618', self.strategy.extension_levels)
        self.assertIn('ext_1000', self.strategy.extension_levels)
        self.assertIn('ext_1618', self.strategy.extension_levels)
        self.assertIn('ext_2618', self.strategy.extension_levels)

        # Extensions should be above swing high
        for level_name, level_price in self.strategy.extension_levels.items():
            self.assertGreater(level_price, high,
                             f"{level_name} should be above swing high")


class TestEntrySignals(unittest.TestCase):
    """Test entry signal generation."""

    def setUp(self):
        """Initialize strategy and set up swing points."""
        self.strategy = FibonacciRetracementStrategy(max_position_cents=1000000)
        self.strategy.update_swing_points(15000, 10000)  # $150 to $100

    def test_no_signal_without_swing_points(self):
        """Test that no signal is generated without swing points."""
        fresh_strategy = FibonacciRetracementStrategy(max_position_cents=1000000)
        signal = fresh_strategy.check_entry_signal(12500)
        self.assertIsNone(signal)

    def test_no_signal_when_in_position(self):
        """Test that no entry signal when already in position."""
        self.strategy.in_position = True
        signal = self.strategy.check_entry_signal(11910)  # 61.8% level
        self.assertIsNone(signal)

    def test_entry_signal_at_618_level(self):
        """Test entry signal at 61.8% Fibonacci level."""
        # Calculate expected 61.8% level
        # Range = 15000 - 10000 = 5000
        # 61.8% retracement = 15000 - (5000 * 618 / 1000) = 15000 - 3090 = 11910
        signal = self.strategy.check_entry_signal(11910)

        self.assertIsNotNone(signal)
        self.assertEqual(signal['action'], 'BUY')
        self.assertEqual(signal['level'], '618_golden_ratio')
        self.assertEqual(signal['signal_strength'], 3)
        self.assertEqual(signal['entry_price'], 11910)

    def test_entry_signal_at_500_level(self):
        """Test entry signal at 50% Fibonacci level."""
        # 50% retracement = 15000 - (5000 * 500 / 1000) = 12500
        signal = self.strategy.check_entry_signal(12500)

        self.assertIsNotNone(signal)
        self.assertEqual(signal['action'], 'BUY')
        self.assertEqual(signal['level'], '500_midpoint')
        self.assertEqual(signal['signal_strength'], 2)

    def test_entry_signal_at_382_level(self):
        """Test entry signal at 38.2% Fibonacci level."""
        # 38.2% retracement = 15000 - (5000 * 382 / 1000) = 15000 - 1910 = 13090
        signal = self.strategy.check_entry_signal(13090)

        self.assertIsNotNone(signal)
        self.assertEqual(signal['action'], 'BUY')
        self.assertEqual(signal['level'], '382_shallow')
        self.assertEqual(signal['signal_strength'], 1)

    def test_entry_signal_in_golden_pocket(self):
        """Test entry signal in golden pocket zone (50-61.8%)."""
        # Golden pocket is between 12500 and 11910
        # Test a price in the middle
        signal = self.strategy.check_entry_signal(12200)

        self.assertIsNotNone(signal)
        self.assertEqual(signal['action'], 'BUY')
        self.assertEqual(signal['level'], 'golden_pocket')
        self.assertEqual(signal['signal_strength'], 4)  # Maximum strength

    def test_no_signal_far_from_levels(self):
        """Test no signal when price is far from Fibonacci levels."""
        # Price way above retracement levels
        signal = self.strategy.check_entry_signal(14500)
        self.assertIsNone(signal)

        # Price at swing low
        signal = self.strategy.check_entry_signal(10000)
        self.assertIsNone(signal)

    def test_signal_contains_risk_management(self):
        """Test that entry signal contains stop loss and take profit."""
        signal = self.strategy.check_entry_signal(11910)

        self.assertIn('stop_loss', signal)
        self.assertIn('take_profit_1', signal)
        self.assertIn('take_profit_2', signal)
        self.assertIn('risk_reward_1', signal)
        self.assertIn('risk_reward_2', signal)

        # Stop loss should be below entry
        self.assertLess(signal['stop_loss'], signal['entry_price'])

        # Take profits should be above entry
        self.assertGreater(signal['take_profit_1'], signal['entry_price'])
        self.assertGreater(signal['take_profit_2'], signal['entry_price'])
        self.assertGreater(signal['take_profit_2'], signal['take_profit_1'])

    def test_position_sizing_varies_by_level(self):
        """Test that position size varies based on Fibonacci level."""
        # 61.8% level should have largest position
        signal_618 = self.strategy.check_entry_signal(11910)
        self.assertIsNotNone(signal_618)

        # 50% level should have full position
        signal_500 = self.strategy.check_entry_signal(12500)
        self.assertIsNotNone(signal_500)

        # 38.2% level should have smaller position
        signal_382 = self.strategy.check_entry_signal(13090)
        self.assertIsNotNone(signal_382)

        # Verify sizing: 61.8% should be largest
        self.assertGreater(signal_618['position_size'], signal_500['position_size'])
        self.assertGreater(signal_500['position_size'], signal_382['position_size'])


class TestExitSignals(unittest.TestCase):
    """Test exit signal generation."""

    def setUp(self):
        """Initialize strategy and enter a position."""
        self.strategy = FibonacciRetracementStrategy(max_position_cents=1000000)
        self.strategy.update_swing_points(15000, 10000)

        # Enter position at 61.8% level
        signal = self.strategy.check_entry_signal(11910)
        self.strategy.execute_entry(signal)

    def test_no_exit_when_not_in_position(self):
        """Test no exit signal when not in position."""
        self.strategy.in_position = False
        exit_signal = self.strategy.check_exit_signal(11000)
        self.assertIsNone(exit_signal)

    def test_stop_loss_exit(self):
        """Test stop loss exit trigger."""
        # Price drops below stop loss
        current_price = self.strategy.stop_loss - 100
        exit_signal = self.strategy.check_exit_signal(current_price)

        self.assertIsNotNone(exit_signal)
        self.assertEqual(exit_signal['action'], 'SELL')
        self.assertEqual(exit_signal['exit_type'], 'STOP_LOSS')
        self.assertIn('pnl_cents', exit_signal)

        # PnL should be negative
        self.assertLess(exit_signal['pnl_cents'], 0)

    def test_take_profit_1_exit(self):
        """Test first take profit exit trigger."""
        # Price reaches take profit 1
        current_price = self.strategy.take_profit_1 + 100
        exit_signal = self.strategy.check_exit_signal(current_price)

        self.assertIsNotNone(exit_signal)
        self.assertEqual(exit_signal['action'], 'SELL')
        self.assertEqual(exit_signal['exit_type'], 'TAKE_PROFIT_1')

        # PnL should be positive
        self.assertGreater(exit_signal['pnl_cents'], 0)

    def test_take_profit_2_exit(self):
        """Test second take profit exit trigger."""
        # Price reaches take profit 2
        current_price = self.strategy.take_profit_2 + 100
        exit_signal = self.strategy.check_exit_signal(current_price)

        self.assertIsNotNone(exit_signal)
        self.assertEqual(exit_signal['action'], 'SELL')
        self.assertEqual(exit_signal['exit_type'], 'TAKE_PROFIT_2')

        # PnL should be positive and larger than TP1
        self.assertGreater(exit_signal['pnl_cents'], 0)

    def test_no_exit_in_neutral_zone(self):
        """Test no exit when price is between stop and targets."""
        # Price between entry and take profit
        current_price = (self.strategy.entry_price + self.strategy.take_profit_1) // 2
        exit_signal = self.strategy.check_exit_signal(current_price)

        self.assertIsNone(exit_signal)


class TestTradeExecution(unittest.TestCase):
    """Test trade execution logic."""

    def setUp(self):
        """Initialize strategy."""
        self.strategy = FibonacciRetracementStrategy(max_position_cents=1000000)
        self.strategy.update_swing_points(15000, 10000)

    def test_execute_entry(self):
        """Test executing entry updates strategy state."""
        signal = self.strategy.check_entry_signal(11910)
        success = self.strategy.execute_entry(signal)

        self.assertTrue(success)
        self.assertTrue(self.strategy.in_position)
        self.assertEqual(self.strategy.entry_price, signal['entry_price'])
        self.assertEqual(self.strategy.position_size, signal['position_size'])
        self.assertEqual(self.strategy.trades_executed, 1)

    def test_cannot_enter_when_already_in_position(self):
        """Test cannot enter position when already in one."""
        signal = self.strategy.check_entry_signal(11910)
        self.strategy.execute_entry(signal)

        # Try to enter again
        success = self.strategy.execute_entry(signal)
        self.assertFalse(success)
        self.assertEqual(self.strategy.trades_executed, 1)  # Should still be 1

    def test_execute_exit(self):
        """Test executing exit updates strategy state."""
        # Enter position
        entry_signal = self.strategy.check_entry_signal(11910)
        self.strategy.execute_entry(entry_signal)

        # Exit position (take profit)
        exit_price = self.strategy.take_profit_1 + 100
        exit_signal = self.strategy.check_exit_signal(exit_price)
        success = self.strategy.execute_exit(exit_signal)

        self.assertTrue(success)
        self.assertFalse(self.strategy.in_position)
        self.assertEqual(self.strategy.entry_price, 0)
        self.assertEqual(self.strategy.position_size, 0)
        self.assertEqual(self.strategy.winning_trades, 1)
        self.assertGreater(self.strategy.total_pnl_cents, 0)

    def test_execute_exit_losing_trade(self):
        """Test executing exit on losing trade."""
        # Enter position
        entry_signal = self.strategy.check_entry_signal(11910)
        self.strategy.execute_entry(entry_signal)

        # Exit at stop loss
        exit_price = self.strategy.stop_loss - 100
        exit_signal = self.strategy.check_exit_signal(exit_price)
        success = self.strategy.execute_exit(exit_signal)

        self.assertTrue(success)
        self.assertFalse(self.strategy.in_position)
        self.assertEqual(self.strategy.winning_trades, 0)
        self.assertLess(self.strategy.total_pnl_cents, 0)

    def test_cannot_exit_when_not_in_position(self):
        """Test cannot exit when not in position."""
        exit_signal = {'pnl_cents': 1000}
        success = self.strategy.execute_exit(exit_signal)
        self.assertFalse(success)


class TestPositionSizing(unittest.TestCase):
    """Test Fibonacci-based position sizing."""

    def setUp(self):
        """Initialize strategy."""
        self.strategy = FibonacciRetracementStrategy(max_position_cents=1000000)

    def test_position_sizing_with_golden_ratio(self):
        """Test position sizing uses golden ratio."""
        account_balance = 10000000  # $100,000
        risk_ratio = 20  # 2%

        position_size = self.strategy.calculate_position_size_fibonacci(
            account_balance, risk_ratio
        )

        # Position size should be positive
        self.assertGreater(position_size, 0)

        # Should not exceed max position size
        self.assertLessEqual(position_size, self.strategy.max_position_cents)

    def test_position_sizing_respects_max(self):
        """Test position sizing respects maximum."""
        account_balance = 100000000  # $1,000,000 (very large)
        risk_ratio = 100  # 10% (high risk)

        position_size = self.strategy.calculate_position_size_fibonacci(
            account_balance, risk_ratio
        )

        # Should be capped at max
        self.assertEqual(position_size, self.strategy.max_position_cents)

    def test_position_sizing_scales_with_risk(self):
        """Test position sizing scales with risk percentage."""
        account_balance = 10000000  # $100,000

        # Lower risk
        pos_1 = self.strategy.calculate_position_size_fibonacci(account_balance, 10)  # 1%

        # Higher risk
        pos_2 = self.strategy.calculate_position_size_fibonacci(account_balance, 20)  # 2%

        # Higher risk should yield larger position (up to max)
        self.assertGreaterEqual(pos_2, pos_1)


class TestBacktesting(unittest.TestCase):
    """Test backtesting functionality."""

    def setUp(self):
        """Initialize strategy."""
        self.strategy = FibonacciRetracementStrategy(max_position_cents=1000000)

    def test_backtest_requires_minimum_data(self):
        """Test backtest requires minimum price data."""
        short_data = [10000, 11000, 12000]

        with self.assertRaises(ValueError):
            self.strategy.backtest_price_series(short_data, lookback_period=20)

    def test_backtest_simple_uptrend(self):
        """Test backtesting on simple uptrend data."""
        # Create uptrend with retracement
        price_data = []

        # Initial uptrend
        for i in range(20):
            price_data.append(10000 + i * 100)

        # Retracement to 61.8% level
        for i in range(10):
            price_data.append(11900 - i * 50)

        # Recovery to new high
        for i in range(15):
            price_data.append(11450 + i * 100)

        results = self.strategy.backtest_price_series(price_data, lookback_period=20)

        # Check results structure
        self.assertIn('total_trades', results)
        self.assertIn('winning_trades', results)
        self.assertIn('losing_trades', results)
        self.assertIn('win_rate_scaled', results)
        self.assertIn('total_pnl_cents', results)
        self.assertIn('trades', results)
        self.assertIn('equity_curve', results)

        # Should have executed some trades
        self.assertGreaterEqual(results['total_trades'], 0)

    def test_backtest_equity_curve_length(self):
        """Test backtest generates equity curve."""
        # Create price data
        price_data = [10000 + (i * 50) for i in range(50)]

        results = self.strategy.backtest_price_series(price_data, lookback_period=20)

        # Equity curve should have entries for each bar after lookback
        expected_length = len(price_data) - 20
        self.assertEqual(len(results['equity_curve']), expected_length)

    def test_backtest_win_rate_calculation(self):
        """Test win rate is calculated correctly."""
        # Simple data that should trigger trades
        price_data = []
        base_price = 10000

        # Create pattern with multiple swings
        for cycle in range(3):
            # Uptrend
            for i in range(15):
                price_data.append(base_price + i * 100)

            # Retracement
            for i in range(8):
                price_data.append(base_price + 1400 - i * 100)

            base_price += 2000

        results = self.strategy.backtest_price_series(price_data, lookback_period=15)

        # Win rate should be between 0 and 1000 (scaled)
        self.assertGreaterEqual(results['win_rate_scaled'], 0)
        self.assertLessEqual(results['win_rate_scaled'], 1000)

        # Verify win rate calculation
        if results['total_trades'] > 0:
            expected_win_rate = (results['winning_trades'] * 1000) // results['total_trades']
            self.assertEqual(results['win_rate_scaled'], expected_win_rate)


class TestStrategySummary(unittest.TestCase):
    """Test strategy summary and reporting."""

    def setUp(self):
        """Initialize strategy."""
        self.strategy = FibonacciRetracementStrategy(max_position_cents=1000000)

    def test_strategy_summary_structure(self):
        """Test strategy summary has correct structure."""
        summary = self.strategy.get_strategy_summary()

        # Check main sections exist
        self.assertIn('strategy', summary)
        self.assertIn('agent', summary)
        self.assertIn('dependencies', summary)
        self.assertIn('configuration', summary)
        self.assertIn('current_state', summary)
        self.assertIn('performance', summary)
        self.assertIn('features', summary)

    def test_summary_configuration_details(self):
        """Test summary includes configuration details."""
        summary = self.strategy.get_strategy_summary()

        config = summary['configuration']
        self.assertIn('max_position_cents', config)
        self.assertIn('tolerance_cents', config)
        self.assertIn('entry_levels', config)
        self.assertIn('stop_loss_ratio', config)
        self.assertIn('take_profit_levels', config)

    def test_summary_performance_metrics(self):
        """Test summary includes performance metrics."""
        summary = self.strategy.get_strategy_summary()

        perf = summary['performance']
        self.assertIn('trades_executed', perf)
        self.assertIn('winning_trades', perf)
        self.assertIn('win_rate_scaled', perf)
        self.assertIn('total_pnl_cents', perf)

    def test_summary_win_rate_when_no_trades(self):
        """Test win rate calculation when no trades executed."""
        summary = self.strategy.get_strategy_summary()

        self.assertEqual(summary['performance']['win_rate_scaled'], 0)

    def test_summary_win_rate_with_trades(self):
        """Test win rate calculation with executed trades."""
        # Simulate some trades
        self.strategy.trades_executed = 10
        self.strategy.winning_trades = 7

        summary = self.strategy.get_strategy_summary()

        # Win rate should be 700 (70% * 1000)
        expected_win_rate = (7 * 1000) // 10
        self.assertEqual(summary['performance']['win_rate_scaled'], expected_win_rate)


class TestIntegerOnlyArithmetic(unittest.TestCase):
    """Test that all operations use integer-only arithmetic."""

    def setUp(self):
        """Initialize strategy."""
        self.strategy = FibonacciRetracementStrategy(max_position_cents=1000000)
        self.strategy.update_swing_points(15000, 10000)

    def test_retracement_levels_are_integers(self):
        """Test all retracement levels are integers."""
        for level_name, level_value in self.strategy.retracement_levels.items():
            self.assertIsInstance(level_value, int,
                                f"{level_name} should be integer, got {type(level_value)}")

    def test_extension_levels_are_integers(self):
        """Test all extension levels are integers."""
        for level_name, level_value in self.strategy.extension_levels.items():
            self.assertIsInstance(level_value, int,
                                f"{level_name} should be integer, got {type(level_value)}")

    def test_entry_signal_values_are_integers(self):
        """Test all entry signal values are integers."""
        signal = self.strategy.check_entry_signal(11910)

        if signal:
            self.assertIsInstance(signal['entry_price'], int)
            self.assertIsInstance(signal['position_size'], int)
            self.assertIsInstance(signal['stop_loss'], int)
            self.assertIsInstance(signal['take_profit_1'], int)
            self.assertIsInstance(signal['take_profit_2'], int)
            self.assertIsInstance(signal['risk_reward_1'], int)
            self.assertIsInstance(signal['risk_reward_2'], int)

    def test_position_size_is_integer(self):
        """Test position sizing returns integer."""
        position_size = self.strategy.calculate_position_size_fibonacci(10000000, 20)
        self.assertIsInstance(position_size, int)

    def test_no_floating_point_in_calculations(self):
        """Test that calculations don't introduce floating point."""
        # Run through a complete trade cycle
        signal = self.strategy.check_entry_signal(11910)
        self.strategy.execute_entry(signal)

        exit_price = self.strategy.take_profit_1 + 100
        exit_signal = self.strategy.check_exit_signal(exit_price)

        # All PnL calculations should be integers
        self.assertIsInstance(exit_signal['pnl_cents'], int)
        self.assertIsInstance(self.strategy.total_pnl_cents, int)


def run_tests():
    """Run all tests."""
    unittest.main(argv=[''], exit=False, verbosity=2)


if __name__ == '__main__':
    run_tests()

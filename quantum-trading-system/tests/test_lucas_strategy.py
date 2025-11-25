"""
Test Suite for Lucas Timing Strategy
=====================================

Comprehensive tests for Lucas timing strategy with Nash equilibrium exits.
"""

import unittest
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.strategies.lucas_strategy import (
    LucasTimingStrategy,
    TradingSignal,
    PositionState,
    NashExitPoint,
    Position,
    LUCAS_SEQUENCE,
    SCALE
)


class TestLucasSequence(unittest.TestCase):
    """Test Lucas sequence generation."""

    def setUp(self):
        self.strategy = LucasTimingStrategy()

    def test_initial_lucas_values(self):
        """Test first Lucas numbers."""
        expected = [2, 1, 3, 4, 7, 11, 18, 29, 47, 76]
        for i, expected_val in enumerate(expected):
            self.assertEqual(self.strategy.get_lucas(i), expected_val)

    def test_lucas_sequence_extension(self):
        """Test extending Lucas sequence beyond initial values."""
        # Force extension
        l20 = self.strategy.get_lucas(20)
        self.assertIsInstance(l20, int)
        self.assertGreater(l20, 0)

        # Verify recurrence relation
        l19 = self.strategy.get_lucas(19)
        l18 = self.strategy.get_lucas(18)
        self.assertEqual(l20, l19 + l18)

    def test_lucas_integers_only(self):
        """Verify all Lucas numbers are integers."""
        for i in range(15):
            lucas_val = self.strategy.get_lucas(i)
            self.assertIsInstance(lucas_val, int)


class TestNashExitGeneration(unittest.TestCase):
    """Test Nash equilibrium exit point generation."""

    def setUp(self):
        self.strategy = LucasTimingStrategy(num_exit_points=5)
        self.entry_timestamp = int(datetime(2024, 1, 1, 9, 30).timestamp())
        self.entry_price = 50000 * SCALE

    def test_nash_exit_count(self):
        """Test correct number of exit points generated."""
        exits = self.strategy.generate_nash_exits(
            self.entry_timestamp,
            self.entry_price
        )
        self.assertEqual(len(exits), 5)

    def test_nash_exit_structure(self):
        """Test structure of Nash exit points."""
        exits = self.strategy.generate_nash_exits(
            self.entry_timestamp,
            self.entry_price
        )

        for exit_point in exits:
            self.assertIsInstance(exit_point, NashExitPoint)
            self.assertIsInstance(exit_point.exit_index, int)
            self.assertIsInstance(exit_point.lucas_index, int)
            self.assertIsInstance(exit_point.lucas_days, int)
            self.assertIsInstance(exit_point.timestamp, int)
            self.assertIsInstance(exit_point.probability_weight, int)
            self.assertIsInstance(exit_point.cumulative_weight, int)

    def test_nash_exit_lucas_timing(self):
        """Test exits follow Lucas sequence timing."""
        exits = self.strategy.generate_nash_exits(
            self.entry_timestamp,
            self.entry_price
        )

        # Expected Lucas days: L(2)=3, L(3)=4, L(4)=7, L(5)=11, L(6)=18
        expected_days = [3, 4, 7, 11, 18]

        for i, exit_point in enumerate(exits):
            self.assertEqual(exit_point.lucas_days, expected_days[i])
            self.assertEqual(exit_point.days_from_entry, expected_days[i])

    def test_nash_exit_timestamps_monotonic(self):
        """Test exit timestamps are monotonically increasing."""
        exits = self.strategy.generate_nash_exits(
            self.entry_timestamp,
            self.entry_price
        )

        for i in range(1, len(exits)):
            self.assertGreater(
                exits[i].timestamp,
                exits[i-1].timestamp,
                "Exit timestamps not monotonically increasing"
            )

    def test_nash_exit_timestamps_after_entry(self):
        """Test all exit timestamps are after entry."""
        exits = self.strategy.generate_nash_exits(
            self.entry_timestamp,
            self.entry_price
        )

        for exit_point in exits:
            self.assertGreater(exit_point.timestamp, self.entry_timestamp)

    def test_nash_exit_weights_sum_to_scale(self):
        """Test probability weights sum to SCALE (10000)."""
        exits = self.strategy.generate_nash_exits(
            self.entry_timestamp,
            self.entry_price
        )

        total_weight = sum(e.probability_weight for e in exits)
        # Allow small rounding error
        self.assertAlmostEqual(total_weight, SCALE, delta=50)

    def test_nash_exit_cumulative_weights(self):
        """Test cumulative weights are correct."""
        exits = self.strategy.generate_nash_exits(
            self.entry_timestamp,
            self.entry_price
        )

        cumulative = 0
        for exit_point in exits:
            cumulative += exit_point.probability_weight
            self.assertEqual(exit_point.cumulative_weight, cumulative)

        # Last cumulative should be close to SCALE
        self.assertAlmostEqual(exits[-1].cumulative_weight, SCALE, delta=50)

    def test_nash_exit_integers_only(self):
        """Verify all exit data are integers."""
        exits = self.strategy.generate_nash_exits(
            self.entry_timestamp,
            self.entry_price
        )

        for exit_point in exits:
            self.assertIsInstance(exit_point.exit_index, int)
            self.assertIsInstance(exit_point.lucas_index, int)
            self.assertIsInstance(exit_point.lucas_days, int)
            self.assertIsInstance(exit_point.timestamp, int)
            self.assertIsInstance(exit_point.probability_weight, int)
            self.assertIsInstance(exit_point.cumulative_weight, int)
            self.assertIsInstance(exit_point.days_from_entry, int)


class TestEntrySignalGeneration(unittest.TestCase):
    """Test entry signal generation."""

    def setUp(self):
        self.strategy = LucasTimingStrategy()
        self.current_timestamp = int(datetime.now().timestamp())
        self.current_price = 50000 * SCALE

    def test_entry_long_signal(self):
        """Test long entry signal generation."""
        market_data = {
            'momentum': 8000,  # Strong positive
            'volatility': 2000,  # Low
            'trend': 8000  # Strong uptrend
        }

        signal, confidence = self.strategy.generate_entry_signal(
            self.current_timestamp,
            self.current_price,
            market_data
        )

        self.assertEqual(signal, TradingSignal.ENTRY_LONG)
        self.assertGreaterEqual(confidence, self.strategy.confidence_threshold)

    def test_entry_short_signal(self):
        """Test short entry signal generation."""
        market_data = {
            'momentum': -8000,  # Strong negative
            'volatility': 2000,  # Low
            'trend': -8000  # Strong downtrend
        }

        signal, confidence = self.strategy.generate_entry_signal(
            self.current_timestamp,
            self.current_price,
            market_data
        )

        self.assertEqual(signal, TradingSignal.ENTRY_SHORT)
        self.assertGreaterEqual(confidence, self.strategy.confidence_threshold)

    def test_hold_signal_low_confidence(self):
        """Test hold signal when confidence is low."""
        market_data = {
            'momentum': 2000,  # Weak
            'volatility': 8000,  # High
            'trend': 1000  # Weak
        }

        signal, confidence = self.strategy.generate_entry_signal(
            self.current_timestamp,
            self.current_price,
            market_data
        )

        self.assertEqual(signal, TradingSignal.HOLD)
        self.assertLess(confidence, self.strategy.confidence_threshold)

    def test_no_entry_with_open_position(self):
        """Test no entry signal when position is open."""
        # Open a position
        market_data = {
            'momentum': 8000,
            'volatility': 2000,
            'trend': 8000
        }

        signal, _ = self.strategy.generate_entry_signal(
            self.current_timestamp,
            self.current_price,
            market_data
        )

        if signal == TradingSignal.ENTRY_LONG:
            self.strategy.open_position(
                self.current_timestamp,
                self.current_price,
                1 * SCALE,
                signal
            )

        # Try to generate another entry
        signal2, confidence2 = self.strategy.generate_entry_signal(
            self.current_timestamp + 100,
            self.current_price,
            market_data
        )

        self.assertEqual(signal2, TradingSignal.HOLD)
        self.assertEqual(confidence2, 0)

    def test_entry_signal_integers_only(self):
        """Verify entry signal returns integers."""
        market_data = {
            'momentum': 5000,
            'volatility': 3000,
            'trend': 6000
        }

        signal, confidence = self.strategy.generate_entry_signal(
            self.current_timestamp,
            self.current_price,
            market_data
        )

        self.assertIsInstance(confidence, int)
        self.assertGreaterEqual(confidence, 0)
        self.assertLessEqual(confidence, SCALE)


class TestPositionManagement(unittest.TestCase):
    """Test position opening and closing."""

    def setUp(self):
        self.strategy = LucasTimingStrategy()
        self.entry_timestamp = int(datetime(2024, 1, 1, 9, 30).timestamp())
        self.entry_price = 50000 * SCALE
        self.position_size = 1 * SCALE

    def test_open_long_position(self):
        """Test opening long position."""
        position = self.strategy.open_position(
            self.entry_timestamp,
            self.entry_price,
            self.position_size,
            TradingSignal.ENTRY_LONG
        )

        self.assertIsInstance(position, Position)
        self.assertEqual(position.state, PositionState.OPEN_LONG)
        self.assertEqual(position.entry_timestamp, self.entry_timestamp)
        self.assertEqual(position.entry_price, self.entry_price)
        self.assertEqual(position.position_size, self.position_size)
        self.assertGreater(len(position.nash_exits), 0)

    def test_open_short_position(self):
        """Test opening short position."""
        position = self.strategy.open_position(
            self.entry_timestamp,
            self.entry_price,
            self.position_size,
            TradingSignal.ENTRY_SHORT
        )

        self.assertEqual(position.state, PositionState.OPEN_SHORT)

    def test_position_stop_loss_take_profit(self):
        """Test stop loss and take profit levels."""
        position = self.strategy.open_position(
            self.entry_timestamp,
            self.entry_price,
            self.position_size,
            TradingSignal.ENTRY_LONG
        )

        # For long: stop loss < entry < take profit
        self.assertLess(position.stop_loss, self.entry_price)
        self.assertGreater(position.take_profit, self.entry_price)

        # Verify integer values
        self.assertIsInstance(position.stop_loss, int)
        self.assertIsInstance(position.take_profit, int)

    def test_close_position_profitable(self):
        """Test closing position with profit."""
        # Open position
        self.strategy.open_position(
            self.entry_timestamp,
            self.entry_price,
            self.position_size,
            TradingSignal.ENTRY_LONG
        )

        # Close with higher price
        exit_price = int(self.entry_price * 1.05)  # 5% profit
        exit_timestamp = self.entry_timestamp + (7 * 86400)  # 7 days later

        result = self.strategy.close_position(
            exit_timestamp,
            exit_price,
            TradingSignal.EXIT
        )

        self.assertGreater(result['pnl'], 0)
        self.assertGreater(result['return_pct'], 0)
        self.assertEqual(result['hold_days'], 7)

    def test_close_position_loss(self):
        """Test closing position with loss."""
        # Open position
        self.strategy.open_position(
            self.entry_timestamp,
            self.entry_price,
            self.position_size,
            TradingSignal.ENTRY_LONG
        )

        # Close with lower price
        exit_price = int(self.entry_price * 0.95)  # 5% loss
        exit_timestamp = self.entry_timestamp + (3 * 86400)

        result = self.strategy.close_position(
            exit_timestamp,
            exit_price,
            TradingSignal.STOP_LOSS
        )

        self.assertLess(result['pnl'], 0)
        self.assertLess(result['return_pct'], 0)

    def test_position_data_integers_only(self):
        """Verify all position data are integers."""
        position = self.strategy.open_position(
            self.entry_timestamp,
            self.entry_price,
            self.position_size,
            TradingSignal.ENTRY_LONG
        )

        self.assertIsInstance(position.entry_timestamp, int)
        self.assertIsInstance(position.entry_price, int)
        self.assertIsInstance(position.position_size, int)
        self.assertIsInstance(position.stop_loss, int)
        self.assertIsInstance(position.take_profit, int)


class TestExitConditions(unittest.TestCase):
    """Test exit condition checking."""

    def setUp(self):
        self.strategy = LucasTimingStrategy(num_exit_points=3)
        self.entry_timestamp = int(datetime(2024, 1, 1, 9, 30).timestamp())
        self.entry_price = 50000 * SCALE
        self.position_size = 1 * SCALE

    def test_stop_loss_trigger_long(self):
        """Test stop loss trigger for long position."""
        # Open long position
        position = self.strategy.open_position(
            self.entry_timestamp,
            self.entry_price,
            self.position_size,
            TradingSignal.ENTRY_LONG
        )

        # Price drops below stop loss
        current_price = position.stop_loss - 1000
        current_timestamp = self.entry_timestamp + 3600

        signal, exit_idx, _ = self.strategy.check_exit_conditions(
            current_timestamp,
            current_price
        )

        self.assertEqual(signal, TradingSignal.STOP_LOSS)

    def test_take_profit_trigger_long(self):
        """Test take profit trigger for long position."""
        # Open long position
        position = self.strategy.open_position(
            self.entry_timestamp,
            self.entry_price,
            self.position_size,
            TradingSignal.ENTRY_LONG
        )

        # Price rises above take profit
        current_price = position.take_profit + 1000
        current_timestamp = self.entry_timestamp + 3600

        signal, exit_idx, _ = self.strategy.check_exit_conditions(
            current_timestamp,
            current_price
        )

        self.assertEqual(signal, TradingSignal.TAKE_PROFIT)

    def test_lucas_timing_exit(self):
        """Test Lucas timing exit trigger."""
        # Open position
        position = self.strategy.open_position(
            self.entry_timestamp,
            self.entry_price,
            self.position_size,
            TradingSignal.ENTRY_LONG
        )

        # Move to first Lucas exit time (L(2) = 3 days)
        first_exit = position.nash_exits[0]
        current_timestamp = first_exit.timestamp + 1
        current_price = int(self.entry_price * 1.02)  # Small profit

        signal, exit_idx, exit_point = self.strategy.check_exit_conditions(
            current_timestamp,
            current_price
        )

        self.assertEqual(signal, TradingSignal.EXIT)
        self.assertEqual(exit_idx, 1)
        self.assertIsNotNone(exit_point)
        self.assertEqual(exit_point.exit_index, 1)

    def test_hold_between_exits(self):
        """Test hold signal between exit points."""
        # Open position
        self.strategy.open_position(
            self.entry_timestamp,
            self.entry_price,
            self.position_size,
            TradingSignal.ENTRY_LONG
        )

        # Time between entry and first exit
        current_timestamp = self.entry_timestamp + 86400  # 1 day later
        current_price = int(self.entry_price * 1.01)

        signal, exit_idx, exit_point = self.strategy.check_exit_conditions(
            current_timestamp,
            current_price
        )

        self.assertEqual(signal, TradingSignal.HOLD)

    def test_no_exit_without_position(self):
        """Test no exit signal without open position."""
        current_timestamp = self.entry_timestamp
        current_price = self.entry_price

        signal, exit_idx, exit_point = self.strategy.check_exit_conditions(
            current_timestamp,
            current_price
        )

        self.assertEqual(signal, TradingSignal.HOLD)


class TestIntegerValidation(unittest.TestCase):
    """Test integer-only arithmetic validation."""

    def setUp(self):
        self.strategy = LucasTimingStrategy()

    def test_validate_all_operations(self):
        """Test comprehensive integer validation."""
        validations = self.strategy.validate_integer_operations()

        self.assertTrue(validations['lucas_sequence_integers'])
        self.assertTrue(validations['scale_is_power_of_10'])
        self.assertTrue(validations['nash_exits_integers'])
        self.assertTrue(validations['entry_signal_integer'])
        self.assertTrue(validations['all_pass'])

    def test_scale_is_power_of_10(self):
        """Test scale factor is power of 10."""
        self.assertTrue(self.strategy._is_power_of_10(SCALE))
        self.assertTrue(self.strategy._is_power_of_10(100))
        self.assertTrue(self.strategy._is_power_of_10(1000))
        self.assertTrue(self.strategy._is_power_of_10(100000))

        self.assertFalse(self.strategy._is_power_of_10(123))
        self.assertFalse(self.strategy._is_power_of_10(9999))


class TestStrategyInfo(unittest.TestCase):
    """Test strategy metadata."""

    def setUp(self):
        self.strategy = LucasTimingStrategy(num_exit_points=5)

    def test_strategy_info_structure(self):
        """Test strategy info dictionary structure."""
        info = self.strategy.get_strategy_info()

        self.assertIn('name', info)
        self.assertIn('agent', info)
        self.assertIn('zeckendorf_address', info)
        self.assertIn('oeis_sequence', info)
        self.assertIn('num_exit_points', info)
        self.assertIn('lucas_days', info)
        self.assertIn('integer_only', info)
        self.assertIn('nash_equilibrium', info)

    def test_strategy_info_values(self):
        """Test strategy info values."""
        info = self.strategy.get_strategy_info()

        self.assertEqual(info['agent'], 'Agent 14')
        self.assertEqual(info['zeckendorf_address'], '10000001')
        self.assertEqual(info['oeis_sequence'], 'A000032')
        self.assertEqual(info['num_exit_points'], 5)
        self.assertTrue(info['integer_only'])
        self.assertTrue(info['nash_equilibrium'])

    def test_lucas_days_in_info(self):
        """Test Lucas days are correctly listed."""
        info = self.strategy.get_strategy_info()

        expected_days = [3, 4, 7, 11, 18]
        self.assertEqual(info['lucas_days'], expected_days)


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and error handling."""

    def setUp(self):
        self.strategy = LucasTimingStrategy()

    def test_invalid_entry_signal(self):
        """Test opening position with invalid signal."""
        with self.assertRaises(ValueError):
            self.strategy.open_position(
                int(datetime.now().timestamp()),
                50000 * SCALE,
                1 * SCALE,
                TradingSignal.HOLD  # Invalid for entry
            )

    def test_large_num_exit_points(self):
        """Test strategy with many exit points."""
        strategy = LucasTimingStrategy(num_exit_points=10)

        entry_timestamp = int(datetime.now().timestamp())
        entry_price = 50000 * SCALE

        exits = strategy.generate_nash_exits(entry_timestamp, entry_price)

        self.assertEqual(len(exits), 10)

        # All should be valid integers
        for exit_point in exits:
            self.assertIsInstance(exit_point.timestamp, int)
            self.assertGreater(exit_point.lucas_days, 0)

    def test_zero_market_data(self):
        """Test entry signal with zero market data."""
        market_data = {
            'momentum': 0,
            'volatility': 0,
            'trend': 0
        }

        signal, confidence = self.strategy.generate_entry_signal(
            int(datetime.now().timestamp()),
            50000 * SCALE,
            market_data
        )

        # Should return hold with low confidence
        self.assertEqual(signal, TradingSignal.HOLD)
        self.assertLess(confidence, self.strategy.confidence_threshold)


def run_tests():
    """Run all test suites with detailed output."""
    print("=" * 70)
    print("Lucas Timing Strategy Test Suite")
    print("=" * 70)

    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test cases
    suite.addTests(loader.loadTestsFromTestCase(TestLucasSequence))
    suite.addTests(loader.loadTestsFromTestCase(TestNashExitGeneration))
    suite.addTests(loader.loadTestsFromTestCase(TestEntrySignalGeneration))
    suite.addTests(loader.loadTestsFromTestCase(TestPositionManagement))
    suite.addTests(loader.loadTestsFromTestCase(TestExitConditions))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegerValidation))
    suite.addTests(loader.loadTestsFromTestCase(TestStrategyInfo))
    suite.addTests(loader.loadTestsFromTestCase(TestEdgeCases))

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Summary
    print("\n" + "=" * 70)
    print("Test Summary")
    print("=" * 70)
    print(f"Tests Run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")

    if result.wasSuccessful():
        print("\n✅ ALL TESTS PASSED - Lucas Timing Strategy Ready")
    else:
        print("\n❌ TESTS FAILED - Review failures above")

    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)

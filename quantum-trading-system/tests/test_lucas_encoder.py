"""
Test Suite for Lucas Number Encoder (OEIS A000032)
==================================================

Comprehensive tests for Lucas sequence generation, OEIS validation,
time encoding, and Nash equilibrium exit timing.
"""

import unittest
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.encoders.lucas_encoder import LucasEncoder


class TestLucasSequenceGeneration(unittest.TestCase):
    """Test Lucas sequence generation and basic properties."""

    def setUp(self):
        self.encoder = LucasEncoder(max_n=30)

    def test_initial_conditions(self):
        """Test L(0) = 2 and L(1) = 1."""
        self.assertEqual(self.encoder.get_lucas(0), 2)
        self.assertEqual(self.encoder.get_lucas(1), 1)

    def test_recurrence_relation(self):
        """Test L(n) = L(n-1) + L(n-2) for n >= 2."""
        for i in range(2, 20):
            expected = self.encoder.get_lucas(i-1) + self.encoder.get_lucas(i-2)
            actual = self.encoder.get_lucas(i)
            self.assertEqual(actual, expected,
                           f"L({i}) failed recurrence relation")

    def test_sequence_first_10_terms(self):
        """Test first 10 Lucas numbers explicitly."""
        expected = [2, 1, 3, 4, 7, 11, 18, 29, 47, 76]
        actual = [self.encoder.get_lucas(i) for i in range(10)]
        self.assertEqual(actual, expected)

    def test_integer_only(self):
        """Verify all Lucas numbers are integers."""
        for i in range(len(self.encoder.lucas_sequence)):
            self.assertIsInstance(self.encoder.lucas_sequence[i], int,
                                f"L({i}) is not an integer")

    def test_positive_values(self):
        """All Lucas numbers should be positive."""
        for i in range(len(self.encoder.lucas_sequence)):
            self.assertGreater(self.encoder.lucas_sequence[i], 0,
                             f"L({i}) is not positive")

    def test_monotonic_increase_after_l1(self):
        """Lucas sequence increases monotonically after L(1)."""
        for i in range(2, len(self.encoder.lucas_sequence)):
            self.assertGreater(self.encoder.lucas_sequence[i],
                             self.encoder.lucas_sequence[i-1],
                             f"L({i}) not greater than L({i-1})")


class TestOEISValidation(unittest.TestCase):
    """Test OEIS A000032 sequence validation."""

    def setUp(self):
        self.encoder = LucasEncoder(max_n=30)

    def test_oeis_first_30_match(self):
        """Verify first 30 Lucas numbers match OEIS A000032."""
        for i in range(len(LucasEncoder.OEIS_A000032)):
            expected = LucasEncoder.OEIS_A000032[i]
            actual = self.encoder.get_lucas(i)
            self.assertEqual(actual, expected,
                           f"OEIS mismatch at L({i}): got {actual}, expected {expected}")

    def test_oeis_info_structure(self):
        """Test OEIS info dictionary structure."""
        oeis_info = self.encoder.get_oeis_info()

        self.assertEqual(oeis_info['oeis_id'], 'A000032')
        self.assertIn('Lucas numbers', oeis_info['name'])
        self.assertTrue(oeis_info['match'])
        self.assertEqual(len(oeis_info['first_30_terms']), 30)

    def test_oeis_specific_values(self):
        """Test specific OEIS A000032 values."""
        # From OEIS database
        known_values = {
            0: 2,
            1: 1,
            5: 11,
            10: 123,
            15: 1364,
            20: 15127
        }

        for index, expected_value in known_values.items():
            actual_value = self.encoder.get_lucas(index)
            self.assertEqual(actual_value, expected_value,
                           f"L({index}) = {actual_value}, expected {expected_value}")


class TestTimeEncoding(unittest.TestCase):
    """Test time interval encoding using Lucas numbers."""

    def setUp(self):
        self.encoder = LucasEncoder(max_n=30)
        # Fixed timestamp: 2024-01-01 00:00:00 UTC
        self.base_timestamp = int(datetime(2024, 1, 1, 0, 0, 0).timestamp())

    def test_encode_time_interval_basic(self):
        """Test basic time interval encoding."""
        # L(2) = 3 days
        encoded = self.encoder.encode_time_interval(self.base_timestamp, lucas_index=2)
        expected_offset = 3 * 86400  # 3 days in seconds
        expected = self.base_timestamp + expected_offset

        self.assertEqual(encoded, expected)

    def test_encode_time_interval_integers(self):
        """Verify encoded timestamps are integers."""
        for i in range(10):
            encoded = self.encoder.encode_time_interval(self.base_timestamp, i)
            self.assertIsInstance(encoded, int,
                                f"Encoded timestamp for L({i}) is not integer")

    def test_encode_time_interval_lucas_days(self):
        """Test encoding with specific Lucas day values."""
        test_cases = [
            (2, 3),   # L(2) = 3 days
            (3, 4),   # L(3) = 4 days
            (4, 7),   # L(4) = 7 days
            (5, 11),  # L(5) = 11 days
            (6, 18),  # L(6) = 18 days
        ]

        for lucas_index, expected_days in test_cases:
            encoded = self.encoder.encode_time_interval(self.base_timestamp, lucas_index)
            actual_offset_days = (encoded - self.base_timestamp) // 86400
            self.assertEqual(actual_offset_days, expected_days,
                           f"L({lucas_index}) should add {expected_days} days")

    def test_encode_timestamp_series(self):
        """Test series generation with cumulative Lucas intervals."""
        series = self.encoder.encode_timestamp_series(self.base_timestamp, num_intervals=5)

        # Should have num_intervals + 1 timestamps (including start)
        self.assertEqual(len(series), 6)

        # All should be integers
        self.assertTrue(all(isinstance(ts, int) for ts in series))

        # Should be monotonically increasing
        for i in range(1, len(series)):
            self.assertGreater(series[i], series[i-1],
                             "Timestamp series not monotonically increasing")


class TestNashEquilibriumExits(unittest.TestCase):
    """Test Nash equilibrium exit timing generation."""

    def setUp(self):
        self.encoder = LucasEncoder(max_n=30)
        self.entry_timestamp = int(datetime(2024, 1, 1, 9, 30).timestamp())

    def test_nash_exits_structure(self):
        """Test structure of Nash exit data."""
        exits = self.encoder.encode_nash_exit_times(self.entry_timestamp, num_exits=5)

        self.assertEqual(len(exits), 5)

        for exit_data in exits:
            self.assertIn('exit_index', exit_data)
            self.assertIn('lucas_index', exit_data)
            self.assertIn('lucas_days', exit_data)
            self.assertIn('timestamp', exit_data)
            self.assertIn('days_from_entry', exit_data)

    def test_nash_exits_integer_only(self):
        """Verify all Nash exit values are integers."""
        exits = self.encoder.encode_nash_exit_times(self.entry_timestamp, num_exits=10)

        for exit_data in exits:
            self.assertIsInstance(exit_data['exit_index'], int)
            self.assertIsInstance(exit_data['lucas_index'], int)
            self.assertIsInstance(exit_data['lucas_days'], int)
            self.assertIsInstance(exit_data['timestamp'], int)
            self.assertIsInstance(exit_data['days_from_entry'], int)

    def test_nash_exits_timing_sequence(self):
        """Test Nash exit timing follows Lucas sequence."""
        exits = self.encoder.encode_nash_exit_times(self.entry_timestamp, num_exits=5)

        # Expected Lucas indices: 2, 3, 4, 5, 6
        # Expected Lucas values: 3, 4, 7, 11, 18
        expected_days = [3, 4, 7, 11, 18]

        for i, exit_data in enumerate(exits):
            self.assertEqual(exit_data['lucas_days'], expected_days[i],
                           f"Exit {i+1} should use {expected_days[i]} days")

    def test_nash_exits_monotonic(self):
        """Nash exit timestamps should be monotonically increasing."""
        exits = self.encoder.encode_nash_exit_times(self.entry_timestamp, num_exits=8)

        for i in range(1, len(exits)):
            self.assertGreater(exits[i]['timestamp'], exits[i-1]['timestamp'],
                             "Nash exit timestamps not monotonically increasing")

    def test_nash_exits_after_entry(self):
        """All Nash exits should be after entry time."""
        exits = self.encoder.encode_nash_exit_times(self.entry_timestamp, num_exits=5)

        for exit_data in exits:
            self.assertGreater(exit_data['timestamp'], self.entry_timestamp,
                             "Nash exit before entry time")


class TestLucasDayDecomposition(unittest.TestCase):
    """Test decomposition of target days into Lucas numbers."""

    def setUp(self):
        self.encoder = LucasEncoder(max_n=30)

    def test_decomposition_basic(self):
        """Test basic Lucas day decomposition."""
        # 11 = L(5)
        indices, achieved = self.encoder.get_lucas_day_multiples(11)
        lucas_values = [self.encoder.get_lucas(i) for i in indices]

        self.assertEqual(sum(lucas_values), 11)
        self.assertEqual(achieved, 11)

    def test_decomposition_composite(self):
        """Test decomposition of composite values."""
        # 100 should decompose into Lucas numbers
        indices, achieved = self.encoder.get_lucas_day_multiples(100)
        lucas_values = [self.encoder.get_lucas(i) for i in indices]

        # Should achieve close to 100
        self.assertGreaterEqual(achieved, 90)
        self.assertEqual(sum(lucas_values), achieved)

    def test_decomposition_zero(self):
        """Test decomposition of zero."""
        indices, achieved = self.encoder.get_lucas_day_multiples(0)

        self.assertEqual(len(indices), 0)
        self.assertEqual(achieved, 0)

    def test_decomposition_negative(self):
        """Test decomposition of negative value."""
        indices, achieved = self.encoder.get_lucas_day_multiples(-10)

        self.assertEqual(len(indices), 0)
        self.assertEqual(achieved, 0)


class TestIntegerValidation(unittest.TestCase):
    """Test integer-only arithmetic validation."""

    def setUp(self):
        self.encoder = LucasEncoder(max_n=30)

    def test_validate_integer_operations_all_pass(self):
        """Test that all integer validation checks pass."""
        validations = self.encoder.validate_integer_operations()

        self.assertTrue(validations['lucas_sequence_integers'])
        self.assertTrue(validations['oeis_match'])
        self.assertTrue(validations['no_floats'])
        self.assertTrue(validations['timestamp_integer'])
        self.assertTrue(validations['nash_exits_integers'])
        self.assertTrue(validations['all_pass'])

    def test_no_float_contamination(self):
        """Ensure no float operations contaminate integer values."""
        # Test various operations
        timestamp = 1700000000

        # Time encoding
        encoded = self.encoder.encode_time_interval(timestamp, 5)
        self.assertIsInstance(encoded, int)
        self.assertNotIsInstance(encoded, float)

        # Nash exits
        exits = self.encoder.encode_nash_exit_times(timestamp, 3)
        for exit_data in exits:
            for key, value in exit_data.items():
                if isinstance(value, (int, float)):
                    self.assertIsInstance(value, int,
                                        f"Float detected in exit_data['{key}']")


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and error handling."""

    def setUp(self):
        self.encoder = LucasEncoder(max_n=30)

    def test_max_n_limit(self):
        """Test accessing Lucas number at max_n boundary."""
        # Should work at max_n - 1
        lucas_val = self.encoder.get_lucas(29)
        self.assertIsInstance(lucas_val, int)

        # Should fail at max_n
        with self.assertRaises(IndexError):
            self.encoder.get_lucas(30)

    def test_negative_index(self):
        """Test negative Lucas index (Python negative indexing)."""
        # Python allows negative indexing
        last_lucas = self.encoder.get_lucas(-1)
        self.assertEqual(last_lucas, self.encoder.lucas_sequence[-1])

    def test_large_timestamp(self):
        """Test encoding with large timestamp values."""
        large_timestamp = 2147483647  # Max 32-bit int
        encoded = self.encoder.encode_time_interval(large_timestamp, 5)

        self.assertIsInstance(encoded, int)
        self.assertGreater(encoded, large_timestamp)

    def test_zero_exits(self):
        """Test Nash exits with zero exits requested."""
        exits = self.encoder.encode_nash_exit_times(1700000000, num_exits=0)
        self.assertEqual(len(exits), 0)


class TestPerformance(unittest.TestCase):
    """Test performance and efficiency."""

    def test_large_sequence_generation(self):
        """Test generating large Lucas sequence."""
        large_encoder = LucasEncoder(max_n=100)

        self.assertEqual(len(large_encoder.lucas_sequence), 100)

        # Verify last value is computed correctly
        l_99 = large_encoder.get_lucas(99)
        l_98 = large_encoder.get_lucas(98)
        l_97 = large_encoder.get_lucas(97)

        self.assertEqual(l_99, l_98 + l_97)

    def test_many_exits_generation(self):
        """Test generating many Nash exits."""
        encoder = LucasEncoder(max_n=50)
        exits = encoder.encode_nash_exit_times(1700000000, num_exits=30)

        self.assertEqual(len(exits), 30)

        # All should be valid
        for exit_data in exits:
            self.assertIsInstance(exit_data['timestamp'], int)


def run_tests():
    """Run all test suites with detailed output."""
    print("=" * 70)
    print("Lucas Encoder Test Suite (OEIS A000032)")
    print("=" * 70)

    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test cases
    suite.addTests(loader.loadTestsFromTestCase(TestLucasSequenceGeneration))
    suite.addTests(loader.loadTestsFromTestCase(TestOEISValidation))
    suite.addTests(loader.loadTestsFromTestCase(TestTimeEncoding))
    suite.addTests(loader.loadTestsFromTestCase(TestNashEquilibriumExits))
    suite.addTests(loader.loadTestsFromTestCase(TestLucasDayDecomposition))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegerValidation))
    suite.addTests(loader.loadTestsFromTestCase(TestEdgeCases))
    suite.addTests(loader.loadTestsFromTestCase(TestPerformance))

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
        print("\n✅ ALL TESTS PASSED - Lucas Encoder Ready for Production")
    else:
        print("\n❌ TESTS FAILED - Review failures above")

    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)

"""
Unit tests for Fibonacci Price Encoder (Agent 5)
Tests OEIS A000045 validation, price encoding, and retracement calculations.
"""

import unittest
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from encoders.fibonacci_encoder import FibonacciEncoder


class TestFibonacciSequence(unittest.TestCase):
    """Test Fibonacci sequence generation and OEIS A000045 validation."""

    def setUp(self):
        """Initialize encoder for tests."""
        self.encoder = FibonacciEncoder(max_index=50)

    def test_oeis_a000045_base_cases(self):
        """Test OEIS A000045 base cases: F(0) = 0, F(1) = 1."""
        self.assertEqual(self.encoder.get_fibonacci(0), 0, "F(0) should be 0")
        self.assertEqual(self.encoder.get_fibonacci(1), 1, "F(1) should be 1")

    def test_oeis_a000045_known_values(self):
        """Test known Fibonacci values from OEIS A000045."""
        known_values = {
            0: 0, 1: 1, 2: 1, 3: 2, 4: 3, 5: 5,
            6: 8, 7: 13, 8: 21, 9: 34, 10: 55,
            11: 89, 12: 144, 13: 233, 14: 377, 15: 610,
            20: 6765, 25: 75025, 30: 832040
        }

        for n, expected in known_values.items():
            if n <= self.encoder.max_index:
                actual = self.encoder.get_fibonacci(n)
                self.assertEqual(
                    actual, expected,
                    f"OEIS A000045 F({n}) = {expected}, got {actual}"
                )

    def test_fibonacci_recurrence_relation(self):
        """Test F(n) = F(n-1) + F(n-2) for all n."""
        for n in range(2, min(51, self.encoder.max_index + 1)):
            fn = self.encoder.get_fibonacci(n)
            fn_1 = self.encoder.get_fibonacci(n - 1)
            fn_2 = self.encoder.get_fibonacci(n - 2)

            self.assertEqual(
                fn, fn_1 + fn_2,
                f"Recurrence failed at n={n}: F({n}) = {fn}, F({n-1}) + F({n-2}) = {fn_1 + fn_2}"
            )

    def test_sequence_length(self):
        """Test that sequence has correct length."""
        encoder_25 = FibonacciEncoder(max_index=25)
        self.assertEqual(len(encoder_25.sequence), 26)  # 0 to 25 inclusive

    def test_out_of_range_indices(self):
        """Test that out-of-range indices raise ValueError."""
        with self.assertRaises(ValueError):
            self.encoder.get_fibonacci(-1)

        with self.assertRaises(ValueError):
            self.encoder.get_fibonacci(self.encoder.max_index + 1)


class TestPriceEncoding(unittest.TestCase):
    """Test price encoding and decoding."""

    def setUp(self):
        """Initialize encoder for tests."""
        self.encoder = FibonacciEncoder(max_index=50)

    def test_encode_zero_and_one(self):
        """Test edge cases: price = 0 and price = 1."""
        self.assertEqual(self.encoder.encode_price(0), 0)
        self.assertEqual(self.encoder.encode_price(1), 1)

    def test_encode_exact_fibonacci_numbers(self):
        """Test encoding exact Fibonacci numbers."""
        # F(6) = 8, should encode to index 6
        self.assertEqual(self.encoder.encode_price(8), 6)

        # F(10) = 55, should encode to index 10
        self.assertEqual(self.encoder.encode_price(55), 10)

        # F(15) = 610, should encode to index 15
        self.assertEqual(self.encoder.encode_price(610), 15)

    def test_encode_between_fibonacci_numbers(self):
        """Test encoding prices between Fibonacci numbers."""
        # 100 is between F(11)=89 and F(12)=144, should encode to 11
        idx = self.encoder.encode_price(100)
        self.assertEqual(idx, 11)
        self.assertLessEqual(self.encoder.get_fibonacci(idx), 100)

        # 500 is between F(14)=377 and F(15)=610, should encode to 14
        idx = self.encoder.encode_price(500)
        self.assertEqual(idx, 14)
        self.assertLessEqual(self.encoder.get_fibonacci(idx), 500)

    def test_encode_decode_roundtrip(self):
        """Test that encode->decode gives closest Fibonacci number."""
        prices = [10, 50, 100, 500, 1000, 5000, 10000]

        for price in prices:
            idx = self.encoder.encode_price(price)
            decoded = self.encoder.decode_price(idx)

            # Decoded should be <= original price
            self.assertLessEqual(decoded, price)

            # Decoded should be the largest Fibonacci number <= price
            if idx < self.encoder.max_index:
                next_fib = self.encoder.get_fibonacci(idx + 1)
                self.assertGreater(next_fib, price)

    def test_decode_valid_indices(self):
        """Test decoding valid Fibonacci indices."""
        self.assertEqual(self.encoder.decode_price(0), 0)
        self.assertEqual(self.encoder.decode_price(5), 5)
        self.assertEqual(self.encoder.decode_price(10), 55)


class TestFibonacciRetracements(unittest.TestCase):
    """Test Fibonacci retracement level calculations."""

    def setUp(self):
        """Initialize encoder for tests."""
        self.encoder = FibonacciEncoder(max_index=50)

    def test_retracement_calculation_integer_only(self):
        """Test that retracements use integer-only arithmetic."""
        high = 15000  # $150.00
        low = 10000   # $100.00

        retracements = self.encoder.calculate_retracements(high, low)

        # All values should be integers
        for level, price in retracements.items():
            self.assertIsInstance(price, int, f"{level} should be integer")

    def test_retracement_levels(self):
        """Test specific retracement level calculations."""
        high = 15000  # $150.00
        low = 10000   # $100.00
        price_range = 5000  # $50.00

        retracements = self.encoder.calculate_retracements(high, low)

        # 23.6% retracement: 15000 - (5000 × 236 / 1000) = 15000 - 1180 = 13820
        self.assertEqual(retracements['level_236'], 13820)

        # 38.2% retracement: 15000 - (5000 × 382 / 1000) = 15000 - 1910 = 13090
        self.assertEqual(retracements['level_382'], 13090)

        # 50.0% retracement: 15000 - (5000 × 500 / 1000) = 15000 - 2500 = 12500
        self.assertEqual(retracements['level_500'], 12500)

        # 61.8% retracement (GOLDEN RATIO): 15000 - (5000 × 618 / 1000) = 15000 - 3090 = 11910
        self.assertEqual(retracements['level_618'], 11910)

        # 78.6% retracement: 15000 - (5000 × 786 / 1000) = 15000 - 3930 = 11070
        self.assertEqual(retracements['level_786'], 11070)

        # 100% retracement: 15000 - (5000 × 1000 / 1000) = 10000
        self.assertEqual(retracements['level_1000'], 10000)

    def test_golden_pocket(self):
        """Test golden pocket zone (50-61.8% retracements)."""
        high = 20000  # $200.00
        low = 10000   # $100.00

        retracements = self.encoder.calculate_retracements(high, low)

        # Golden pocket high should equal 50% level
        self.assertEqual(retracements['golden_pocket_high'], retracements['level_500'])

        # Golden pocket low should equal 61.8% level
        self.assertEqual(retracements['golden_pocket_low'], retracements['level_618'])

        # Golden pocket should be a range
        self.assertGreater(retracements['golden_pocket_high'], retracements['golden_pocket_low'])

    def test_invalid_price_range(self):
        """Test that high <= low raises ValueError."""
        with self.assertRaises(ValueError):
            self.encoder.calculate_retracements(10000, 15000)

        with self.assertRaises(ValueError):
            self.encoder.calculate_retracements(10000, 10000)


class TestFibonacciExtensions(unittest.TestCase):
    """Test Fibonacci extension level calculations."""

    def setUp(self):
        """Initialize encoder for tests."""
        self.encoder = FibonacciEncoder(max_index=50)

    def test_extension_levels(self):
        """Test specific extension level calculations."""
        high = 15000  # $150.00
        low = 10000   # $100.00
        price_range = 5000  # $50.00

        extensions = self.encoder.calculate_extensions(high, low)

        # 0.618 extension: 15000 + (5000 × 618 / 1000) = 15000 + 3090 = 18090
        self.assertEqual(extensions['ext_618'], 18090)

        # 1.0 extension: 15000 + (5000 × 1000 / 1000) = 15000 + 5000 = 20000
        self.assertEqual(extensions['ext_1000'], 20000)

        # 1.618 extension (GOLDEN): 15000 + (5000 × 1618 / 1000) = 15000 + 8090 = 23090
        self.assertEqual(extensions['ext_1618'], 23090)

        # 2.618 extension: 15000 + (5000 × 2618 / 1000) = 15000 + 13090 = 28090
        self.assertEqual(extensions['ext_2618'], 28090)

    def test_extensions_integer_only(self):
        """Test that extensions use integer-only arithmetic."""
        high = 12345
        low = 6789

        extensions = self.encoder.calculate_extensions(high, low)

        for level, price in extensions.items():
            self.assertIsInstance(price, int, f"{level} should be integer")


class TestSupportResistance(unittest.TestCase):
    """Test support and resistance level finding."""

    def setUp(self):
        """Initialize encoder for tests."""
        self.encoder = FibonacciEncoder(max_index=50)

    def test_support_levels_below_price(self):
        """Test that support levels are below current price."""
        price = 10000  # $100.00
        support, resistance = self.encoder.find_support_resistance(price, levels=3)

        for level in support:
            self.assertLess(level, price, "Support should be below current price")

    def test_resistance_levels_above_price(self):
        """Test that resistance levels are above current price."""
        price = 10000  # $100.00
        support, resistance = self.encoder.find_support_resistance(price, levels=3)

        for level in resistance:
            self.assertGreater(level, price, "Resistance should be above current price")

    def test_requested_number_of_levels(self):
        """Test that correct number of levels is returned."""
        price = 5000
        support, resistance = self.encoder.find_support_resistance(price, levels=5)

        # Should return up to 5 levels (or less if at boundaries)
        self.assertLessEqual(len(support), 5)
        self.assertLessEqual(len(resistance), 5)

    def test_boundary_conditions(self):
        """Test support/resistance at sequence boundaries."""
        # At very low price, should have limited support
        price = 2  # Near F(3) = 2
        support, resistance = self.encoder.find_support_resistance(price, levels=5)
        self.assertLessEqual(len(support), 3)  # Limited support near bottom


class TestLogSpaceTransformation(unittest.TestCase):
    """Test log-space price transformations."""

    def setUp(self):
        """Initialize encoder for tests."""
        self.encoder = FibonacciEncoder(max_index=50)

    def test_log_space_integer_only(self):
        """Test that log-space transformation returns integers."""
        prices = [100, 1000, 10000, 50000]

        for price in prices:
            log_val = self.encoder.price_to_log_space(price)
            self.assertIsInstance(log_val, int, "Log-space value should be integer")
            self.assertGreater(log_val, 0, "Log-space value should be positive")

    def test_log_space_roundtrip(self):
        """Test log-space -> price roundtrip approximation."""
        prices = [1000, 5000, 10000]

        for price in prices:
            idx = self.encoder.encode_price(price)
            log_val = self.encoder.price_to_log_space(price)
            recovered = self.encoder.log_space_to_price(log_val, idx)

            # Should be approximately equal (within rounding error)
            error_pct = abs(recovered - price) / price
            self.assertLess(error_pct, 0.01, "Roundtrip error should be < 1%")


class TestGoldenRatio(unittest.TestCase):
    """Test golden ratio calculations."""

    def setUp(self):
        """Initialize encoder for tests."""
        self.encoder = FibonacciEncoder(max_index=50)

    def test_golden_ratio_approximation(self):
        """Test that F(n+1)/F(n) approximates φ ≈ 1.618034."""
        phi = self.encoder.calculate_golden_ratio()

        # φ × 1000000 ≈ 1618034
        expected = 1618034
        tolerance = 100  # Allow small error

        self.assertAlmostEqual(
            phi, expected, delta=tolerance,
            msg=f"Golden ratio should be ≈ {expected / 1000000:.6f}"
        )

    def test_golden_ratio_integer(self):
        """Test that golden ratio is returned as integer."""
        phi = self.encoder.calculate_golden_ratio()
        self.assertIsInstance(phi, int)


class TestTickerEncoding(unittest.TestCase):
    """Test encoding prices for multiple tickers."""

    def setUp(self):
        """Initialize encoder for tests."""
        self.encoder = FibonacciEncoder(max_index=50)

    def test_encode_single_ticker(self):
        """Test encoding a single ticker's price history."""
        ticker_data = {
            'AAPL': [15000, 15500, 16000, 15800, 15200]  # Prices in cents
        }

        results = self.encoder.encode_ticker_prices(ticker_data)

        self.assertIn('AAPL', results)
        aapl = results['AAPL']

        self.assertIn('current_price', aapl)
        self.assertIn('current_index', aapl)
        self.assertIn('retracements', aapl)
        self.assertIn('extensions', aapl)
        self.assertIn('support_resistance', aapl)

    def test_encode_multiple_tickers(self):
        """Test encoding multiple tickers."""
        ticker_data = {
            'AAPL': [15000, 16000, 15500],
            'GOOGL': [12000, 13000, 12500],
            'MSFT': [30000, 31000, 30500]
        }

        results = self.encoder.encode_ticker_prices(ticker_data)

        self.assertEqual(len(results), 3)
        for ticker in ticker_data.keys():
            self.assertIn(ticker, results)

    def test_empty_ticker_data(self):
        """Test handling of empty price lists."""
        ticker_data = {
            'EMPTY': []
        }

        results = self.encoder.encode_ticker_prices(ticker_data)
        self.assertNotIn('EMPTY', results)


class TestOEISValidation(unittest.TestCase):
    """Test OEIS A000045 validation export."""

    def setUp(self):
        """Initialize encoder for tests."""
        self.encoder = FibonacciEncoder(max_index=50)

    def test_validation_export(self):
        """Test OEIS validation export structure."""
        validation = self.encoder.export_oeis_validation()

        self.assertEqual(validation['sequence'], 'A000045')
        self.assertIn('Fibonacci', validation['name'])
        self.assertIn('first_50_terms', validation)
        self.assertIn('validation', validation)
        self.assertIn('golden_ratio', validation)

    def test_all_validations_pass(self):
        """Test that all OEIS validations pass."""
        validation = self.encoder.export_oeis_validation()

        self.assertTrue(validation['validation']['F(0)'])
        self.assertTrue(validation['validation']['F(1)'])
        self.assertTrue(validation['validation']['F(10)'])
        self.assertTrue(validation['validation']['recurrence_valid'])


class TestIntegerOnlyOperations(unittest.TestCase):
    """Verify that ALL operations use integer-only arithmetic."""

    def setUp(self):
        """Initialize encoder for tests."""
        self.encoder = FibonacciEncoder(max_index=50)

    def test_no_float_in_retracements(self):
        """Verify retracements produce only integers."""
        retracements = self.encoder.calculate_retracements(15000, 10000)

        for level, value in retracements.items():
            self.assertIsInstance(value, int)
            self.assertNotIsInstance(value, float)

    def test_no_float_in_extensions(self):
        """Verify extensions produce only integers."""
        extensions = self.encoder.calculate_extensions(15000, 10000)

        for level, value in extensions.items():
            self.assertIsInstance(value, int)
            self.assertNotIsInstance(value, float)

    def test_no_float_in_log_space(self):
        """Verify log-space transformations produce only integers."""
        log_val = self.encoder.price_to_log_space(10000)
        self.assertIsInstance(log_val, int)

    def test_no_float_in_golden_ratio(self):
        """Verify golden ratio calculation produces only integers."""
        phi = self.encoder.calculate_golden_ratio()
        self.assertIsInstance(phi, int)


def run_tests():
    """Run all test suites."""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test classes
    test_classes = [
        TestFibonacciSequence,
        TestPriceEncoding,
        TestFibonacciRetracements,
        TestFibonacciExtensions,
        TestSupportResistance,
        TestLogSpaceTransformation,
        TestGoldenRatio,
        TestTickerEncoding,
        TestOEISValidation,
        TestIntegerOnlyOperations,
    ]

    for test_class in test_classes:
        suite.addTests(loader.loadTestsFromTestCase(test_class))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)

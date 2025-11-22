"""
Comprehensive unit tests for integer-only mathematical framework.
Tests Fibonacci encoding, Lucas encoding, Zeckendorf compression, and OEIS validation.
"""

import unittest
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from mathematical_framework import (
    FibonacciPriceEncoder,
    LucasTimeEncoder,
    ZeckendorfCompressor,
    IntegerMathFramework,
    encode_price_fibonacci,
    encode_time_lucas,
    compress_zeckendorf,
    validate_oeis
)


class TestFibonacciPriceEncoder(unittest.TestCase):
    """Test Fibonacci price encoding functionality."""

    def setUp(self):
        """Initialize encoder for tests."""
        self.encoder = FibonacciPriceEncoder(max_index=50)

    def test_fibonacci_sequence_generation(self):
        """Test OEIS A000045 Fibonacci sequence generation."""
        # Known Fibonacci values
        expected = {
            0: 0, 1: 1, 2: 1, 3: 2, 4: 3, 5: 5,
            6: 8, 7: 13, 8: 21, 9: 34, 10: 55,
            15: 610, 20: 6765
        }

        for index, value in expected.items():
            self.assertEqual(
                self.encoder.get_fibonacci(index),
                value,
                f"F({index}) should equal {value}"
            )

    def test_price_encoding(self):
        """Test price to Fibonacci index encoding."""
        # Test cases: (price, expected_index_range)
        test_cases = [
            (0, 0),
            (1, 1),
            (8, 6),  # F(6) = 8
            (55, 10),  # F(10) = 55
            (100, 11),  # Between F(11)=89 and F(12)=144
        ]

        for price, expected_idx in test_cases:
            idx = self.encoder.encode_price(price)
            decoded = self.encoder.decode_price(idx)
            self.assertLessEqual(
                decoded, price,
                f"Decoded price {decoded} should be <= original {price}"
            )

    def test_support_resistance_levels(self):
        """Test Fibonacci support and resistance calculation."""
        price = 100
        support, resistance = self.encoder.find_support_resistance(price, levels=3)

        # Support levels should be below price
        for level in support:
            self.assertLess(level, price)

        # Resistance levels should be above price
        for level in resistance:
            self.assertGreater(level, price)

        # Should return requested number of levels (or less if at boundaries)
        self.assertLessEqual(len(support), 3)
        self.assertLessEqual(len(resistance), 3)

    def test_log_space_transformation(self):
        """Test price to log-space transformation."""
        prices = [10, 50, 100, 500, 1000]

        for price in prices:
            log_price = self.encoder.price_to_log_space(price)
            self.assertGreater(log_price, 0)
            self.assertIsInstance(log_price, int)

    def test_golden_ratio_approximation(self):
        """Test golden ratio calculation using Fibonacci ratios."""
        framework = IntegerMathFramework()
        phi_scaled = framework.calculate_golden_ratio_scaled(scale=1000000)

        # φ ≈ 1.618033988
        # Scaled: 1618033
        expected_phi = 1618033
        tolerance = 1000  # Allow small error

        self.assertAlmostEqual(
            phi_scaled,
            expected_phi,
            delta=tolerance,
            msg=f"Golden ratio approximation should be close to {expected_phi}"
        )


class TestLucasTimeEncoder(unittest.TestCase):
    """Test Lucas time encoding functionality."""

    def setUp(self):
        """Initialize encoder for tests."""
        self.encoder = LucasTimeEncoder(max_index=50)

    def test_lucas_sequence_generation(self):
        """Test OEIS A000032 Lucas sequence generation."""
        # Known Lucas values: L(n) = L(n-1) + L(n-2), L(0)=2, L(1)=1
        expected = {
            0: 2, 1: 1, 2: 3, 3: 4, 4: 7, 5: 11,
            6: 18, 7: 29, 8: 47, 9: 76, 10: 123
        }

        for index, value in expected.items():
            self.assertEqual(
                self.encoder.get_lucas(index),
                value,
                f"L({index}) should equal {value}"
            )

    def test_time_encoding(self):
        """Test time to Lucas index encoding."""
        test_cases = [
            (0, 0),
            (2, 1),  # L(0)=2, L(1)=1, largest index with L<=2 is 1
            (3, 2),  # L(2) = 3
            (100, 9),  # Between L(9)=76 and L(10)=123
        ]

        for time, expected_idx in test_cases:
            idx = self.encoder.encode_time(time)
            self.assertEqual(idx, expected_idx)

    def test_nash_equilibrium_detection(self):
        """Test Nash equilibrium point detection (L(n) mod 3 == 0)."""
        # Find indices where Lucas number is divisible by 3
        equilibrium_indices = []

        for i in range(20):
            if self.encoder.is_nash_equilibrium_point(i):
                equilibrium_indices.append(i)
                lucas_val = self.encoder.get_lucas(i)
                self.assertEqual(
                    lucas_val % 3,
                    0,
                    f"L({i})={lucas_val} should be divisible by 3"
                )

        # Should find at least some equilibrium points
        self.assertGreater(len(equilibrium_indices), 0)

    def test_next_equilibrium_time(self):
        """Test finding next Nash equilibrium time."""
        current_time = 10
        next_eq = self.encoder.next_equilibrium_time(current_time)

        if next_eq > 0:  # If equilibrium found
            self.assertGreater(next_eq, current_time)
            # Verify it's actually an equilibrium point
            eq_idx = self.encoder.encode_time(next_eq)
            self.assertTrue(self.encoder.is_nash_equilibrium_point(eq_idx))


class TestZeckendorfCompressor(unittest.TestCase):
    """Test Zeckendorf compression functionality."""

    def setUp(self):
        """Initialize compressor for tests."""
        self.compressor = ZeckendorfCompressor()

    def test_zeckendorf_compression(self):
        """Test OEIS A003714 Zeckendorf representation."""
        # Test cases: value -> expected properties
        test_values = [1, 2, 3, 5, 8, 13, 21, 50, 100, 255]

        for value in test_values:
            compressed = self.compressor.compress(value)
            decompressed = self.compressor.decompress(compressed)

            # Roundtrip should work
            self.assertEqual(
                decompressed,
                value,
                f"Roundtrip failed for {value}"
            )

            # Should be valid Zeckendorf (non-consecutive)
            self.assertTrue(
                self.compressor.is_valid_zeckendorf(compressed),
                f"Invalid Zeckendorf for {value}: {compressed}"
            )

    def test_non_consecutive_property(self):
        """Test that Zeckendorf representations are non-consecutive."""
        values = [10, 20, 30, 50, 100]

        for value in values:
            compressed = self.compressor.compress(value)

            # Check all pairs are non-consecutive
            for i in range(len(compressed) - 1):
                diff = compressed[i+1] - compressed[i]
                self.assertGreaterEqual(
                    diff,
                    2,
                    f"Consecutive indices found in {compressed} for value {value}"
                )

    def test_specific_zeckendorf_examples(self):
        """Test specific known Zeckendorf representations."""
        # 100 = F(11) + F(6) + F(4) = 89 + 8 + 3
        compressed_100 = self.compressor.compress(100)
        self.assertEqual(self.compressor.decompress(compressed_100), 100)

        # 50 = F(9) + F(6) = 34 + 13 + 3 = F(9) + F(7) + F(4)
        compressed_50 = self.compressor.compress(50)
        self.assertEqual(self.compressor.decompress(compressed_50), 50)

    def test_compression_ratio(self):
        """Test compression ratio calculation."""
        values = [10, 100, 1000, 10000]

        for value in values:
            ratio = self.compressor.compression_ratio(value)
            self.assertGreater(ratio, 0)
            self.assertIsInstance(ratio, float)

    def test_golf_score(self):
        """Test Golf score calculation (Eagle = optimal)."""
        # Fibonacci numbers should have optimal Golf scores
        fib_values = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89]

        for value in fib_values:
            score = self.compressor.golf_score(value)
            # Fibonacci numbers should compress to single index (under par)
            self.assertLessEqual(
                score,
                0,
                f"Fibonacci {value} should have par or better score"
            )

    def test_edge_cases(self):
        """Test edge cases for compression."""
        # Zero
        self.assertEqual(self.compressor.compress(0), [])
        self.assertEqual(self.compressor.decompress([]), 0)

        # One (F(1) or F(2))
        compressed_1 = self.compressor.compress(1)
        self.assertEqual(self.compressor.decompress(compressed_1), 1)


class TestIntegerMathFramework(unittest.TestCase):
    """Test unified mathematical framework."""

    def setUp(self):
        """Initialize framework for tests."""
        self.framework = IntegerMathFramework(max_index=50)

    def test_oeis_validation(self):
        """Test validation against OEIS sequences."""
        results = self.framework.validate_oeis_sequences()

        # All validations should pass
        self.assertTrue(results['A000045_fibonacci'], "Fibonacci validation failed")
        self.assertTrue(results['A000032_lucas'], "Lucas validation failed")
        self.assertTrue(results['A003714_zeckendorf'], "Zeckendorf validation failed")

    def test_encode_price_time(self):
        """Test combined price and time encoding."""
        price = 100
        time = 50

        price_idx, time_idx = self.framework.encode_price_time(price, time)

        self.assertIsInstance(price_idx, int)
        self.assertIsInstance(time_idx, int)
        self.assertGreaterEqual(price_idx, 0)
        self.assertGreaterEqual(time_idx, 0)

    def test_compress_data_array(self):
        """Test compression of data arrays."""
        data = [10, 20, 30, 40, 50]
        compressed = self.framework.compress_data(data)

        self.assertEqual(len(compressed), len(data))

        # Verify each can be decompressed
        for i, zeck in enumerate(compressed):
            decompressed = self.framework.zeckendorf.decompress(zeck)
            self.assertEqual(decompressed, data[i])

    def test_pattern_storage(self):
        """Test pattern storage and retrieval for AgentDB."""
        pattern_id = "test_pattern_001"
        pattern_data = {
            'price': 100,
            'time': 50,
            'signal': 'buy',
            'compressed': True
        }

        # Store pattern
        self.framework.store_pattern(pattern_id, pattern_data)

        # Retrieve pattern
        retrieved = self.framework.retrieve_pattern(pattern_id)
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved['data']['signal'], 'buy')

    def test_pattern_export_import(self):
        """Test JSON export/import of patterns."""
        # Store multiple patterns
        patterns = {
            'pattern_1': {'value': 100, 'time': 10},
            'pattern_2': {'value': 200, 'time': 20},
            'pattern_3': {'value': 300, 'time': 30}
        }

        for pid, data in patterns.items():
            self.framework.store_pattern(pid, data)

        # Export to JSON
        json_str = self.framework.export_patterns_json()
        self.assertIsInstance(json_str, str)

        # Create new framework and import
        new_framework = IntegerMathFramework()
        new_framework.import_patterns_json(json_str)

        # Verify patterns transferred
        for pid in patterns.keys():
            self.assertIsNotNone(new_framework.retrieve_pattern(pid))

    def test_integer_log_transform(self):
        """Test integer-only logarithmic transformation."""
        values = [10, 50, 100, 500, 1000]

        for value in values:
            transformed = self.framework.integer_log_transform(value)
            self.assertGreater(transformed, 0)
            self.assertIsInstance(transformed, int)

    def test_all_integer_operations(self):
        """Verify all operations use integer arithmetic only."""
        # Price encoding
        price_idx = self.framework.fib_encoder.encode_price(100)
        self.assertIsInstance(price_idx, int)

        # Time encoding
        time_idx = self.framework.lucas_encoder.encode_time(50)
        self.assertIsInstance(time_idx, int)

        # Compression
        compressed = self.framework.zeckendorf.compress(75)
        self.assertTrue(all(isinstance(x, int) for x in compressed))

        # Log transform
        log_val = self.framework.integer_log_transform(200)
        self.assertIsInstance(log_val, int)

        # Golden ratio
        phi = self.framework.calculate_golden_ratio_scaled()
        self.assertIsInstance(phi, int)


class TestConvenienceFunctions(unittest.TestCase):
    """Test convenience functions for direct usage."""

    def test_encode_price_fibonacci(self):
        """Test direct price encoding function."""
        idx = encode_price_fibonacci(100)
        self.assertIsInstance(idx, int)
        self.assertGreaterEqual(idx, 0)

    def test_encode_time_lucas(self):
        """Test direct time encoding function."""
        idx = encode_time_lucas(50)
        self.assertIsInstance(idx, int)
        self.assertGreaterEqual(idx, 0)

    def test_compress_zeckendorf(self):
        """Test direct Zeckendorf compression function."""
        compressed = compress_zeckendorf(100)
        self.assertIsInstance(compressed, list)
        self.assertTrue(all(isinstance(x, int) for x in compressed))

    def test_validate_oeis(self):
        """Test direct OEIS validation function."""
        results = validate_oeis()
        self.assertIsInstance(results, dict)
        self.assertTrue(all(results.values()), "All OEIS validations should pass")


class TestPerformanceAndEdgeCases(unittest.TestCase):
    """Test performance and edge cases."""

    def test_large_values(self):
        """Test framework with large values."""
        framework = IntegerMathFramework(max_index=100)

        # Large price
        large_price = 1000000
        price_idx = framework.fib_encoder.encode_price(large_price)
        self.assertGreater(price_idx, 0)

        # Large time
        large_time = 500000
        time_idx = framework.lucas_encoder.encode_time(large_time)
        self.assertGreater(time_idx, 0)

    def test_zero_and_negative_handling(self):
        """Test handling of zero and negative values."""
        framework = IntegerMathFramework()

        # Zero price
        self.assertEqual(framework.fib_encoder.encode_price(0), 0)

        # Zero time
        self.assertEqual(framework.lucas_encoder.encode_time(0), 0)

        # Zero compression
        self.assertEqual(framework.zeckendorf.compress(0), [])

    def test_sequential_operations(self):
        """Test sequence of operations maintains integer precision."""
        framework = IntegerMathFramework()

        # Encode -> Decode -> Encode cycle
        original_price = 12345
        idx1 = framework.fib_encoder.encode_price(original_price)
        decoded = framework.fib_encoder.decode_price(idx1)
        idx2 = framework.fib_encoder.encode_price(decoded)

        # Indices should be stable
        self.assertEqual(idx1, idx2)

    def test_compression_efficiency(self):
        """Test compression efficiency for various patterns."""
        compressor = ZeckendorfCompressor()

        # Powers of 2
        for i in range(1, 10):
            value = 2 ** i
            compressed = compressor.compress(value)
            ratio = compressor.compression_ratio(value)
            self.assertGreater(ratio, 0)

        # Fibonacci numbers (should compress optimally)
        fib = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89]
        for f in fib:
            score = compressor.golf_score(f)
            self.assertLessEqual(score, 0, f"Fibonacci {f} should have optimal score")


def run_all_tests():
    """Run all test suites."""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestFibonacciPriceEncoder))
    suite.addTests(loader.loadTestsFromTestCase(TestLucasTimeEncoder))
    suite.addTests(loader.loadTestsFromTestCase(TestZeckendorfCompressor))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegerMathFramework))
    suite.addTests(loader.loadTestsFromTestCase(TestConvenienceFunctions))
    suite.addTests(loader.loadTestsFromTestCase(TestPerformanceAndEdgeCases))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)

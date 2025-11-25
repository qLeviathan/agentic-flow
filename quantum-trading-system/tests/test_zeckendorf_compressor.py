"""
Unit tests for Zeckendorf Compressor (Agent 7)
OEIS A003714 - Fibbinary numbers validation
"""

import pytest
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from encoders.zeckendorf_compressor import ZeckendorfCompressor


class TestZeckendorfCompressor:
    """Test suite for Zeckendorf compression."""

    @pytest.fixture
    def compressor(self):
        """Create a compressor instance for testing."""
        return ZeckendorfCompressor()

    def test_initialization(self, compressor):
        """Test compressor initialization."""
        assert compressor.max_value == 10**9
        assert len(compressor.fibonacci_cache) > 0
        assert compressor.fibonacci_cache[0] == 1
        assert compressor.fibonacci_cache[1] == 2
        assert len(compressor.oeis_a003714_cache) == 1000

    def test_fibonacci_sequence(self, compressor):
        """Test Fibonacci sequence generation."""
        fibs = compressor.fibonacci_cache
        # Verify Fibonacci property: F(n) = F(n-1) + F(n-2)
        for i in range(2, min(10, len(fibs))):
            assert fibs[i] == fibs[i-1] + fibs[i-2]
        # Check first few values
        assert fibs[:6] == [1, 2, 3, 5, 8, 13]

    def test_oeis_a003714_generation(self, compressor):
        """Test OEIS A003714 (Fibbinary) sequence generation."""
        # First terms of A003714: 0, 1, 2, 4, 5, 8, 9, 10, 16, 17, 18, 20, 21
        expected_start = [0, 1, 2, 4, 5, 8, 9, 10, 16, 17, 18, 20, 21]
        actual_start = compressor.oeis_a003714_cache[:len(expected_start)]
        assert actual_start == expected_start

    def test_has_consecutive_ones(self, compressor):
        """Test consecutive ones detection."""
        # Numbers without consecutive 1's in binary
        assert not compressor._has_consecutive_ones(0)   # 0
        assert not compressor._has_consecutive_ones(1)   # 1
        assert not compressor._has_consecutive_ones(2)   # 10
        assert not compressor._has_consecutive_ones(4)   # 100
        assert not compressor._has_consecutive_ones(5)   # 101

        # Numbers with consecutive 1's in binary
        assert compressor._has_consecutive_ones(3)       # 11
        assert compressor._has_consecutive_ones(6)       # 110
        assert compressor._has_consecutive_ones(7)       # 111
        assert compressor._has_consecutive_ones(14)      # 1110

    def test_basic_encoding(self, compressor):
        """Test basic Zeckendorf encoding."""
        # Test cases with known Zeckendorf representations
        test_cases = [
            (1, "1"),           # F(0) = 1
            (2, "10"),          # F(1) = 2
            (3, "100"),         # F(2) = 3
            (4, "101"),         # F(2) + F(0) = 3 + 1
            (5, "1000"),        # F(3) = 5
        ]

        for n, expected in test_cases:
            encoded = compressor.encode(n)
            # Normalize: remove leading zeros for comparison
            encoded_normalized = encoded.lstrip('0') or '0'
            expected_normalized = expected.lstrip('0') or '0'
            assert encoded_normalized == expected_normalized, \
                f"Failed for n={n}: got {encoded}, expected {expected}"

    def test_encode_decode_roundtrip(self, compressor):
        """Test encoding and decoding preserve original values."""
        test_values = [1, 2, 3, 4, 5, 10, 20, 50, 100, 255, 1000]

        for n in test_values:
            encoded = compressor.encode(n)
            decoded = compressor.decode(encoded)
            assert decoded == n, f"Roundtrip failed for {n}: got {decoded}"

    def test_encode_invalid_input(self, compressor):
        """Test encoding with invalid inputs."""
        with pytest.raises(ValueError):
            compressor.encode(0)

        with pytest.raises(ValueError):
            compressor.encode(-1)

        with pytest.raises(ValueError):
            compressor.encode(10**10)  # Exceeds max_value

    def test_decode_invalid_input(self, compressor):
        """Test decoding with invalid inputs."""
        # Invalid characters
        with pytest.raises(ValueError):
            compressor.decode("102")

        with pytest.raises(ValueError):
            compressor.decode("abc")

        # Consecutive 1's (invalid Zeckendorf)
        with pytest.raises(ValueError):
            compressor.decode("110")

        with pytest.raises(ValueError):
            compressor.decode("1101")

    def test_no_consecutive_ones_property(self, compressor):
        """Test that all encodings have no consecutive 1's."""
        test_values = list(range(1, 101))

        for n in test_values:
            encoded = compressor.encode(n)
            assert '11' not in encoded, \
                f"Encoding of {n} has consecutive 1's: {encoded}"

    def test_encode_bytes(self, compressor):
        """Test byte encoding."""
        test_values = [1, 10, 100, 255]

        for n in test_values:
            encoded_bytes = compressor.encode_bytes(n)
            assert isinstance(encoded_bytes, bytes)
            assert len(encoded_bytes) > 0

    def test_compress_sequence(self, compressor):
        """Test sequence compression."""
        numbers = [1, 2, 3, 4, 5, 10, 20, 50, 100]
        result = compressor.compress_sequence(numbers)

        assert 'original_bits' in result
        assert 'compressed_bits' in result
        assert 'compression_ratio' in result
        assert 'space_saving' in result
        assert 'encoded_values' in result
        assert len(result['encoded_values']) == len(numbers)
        assert result['original_bits'] > 0
        assert result['compressed_bits'] > 0

    def test_get_bit_address(self, compressor):
        """Test bit addressing extraction."""
        # For n=20, expect indices for Fibonacci numbers that sum to 20
        # 20 = 13 + 5 + 2 = F(6) + F(3) + F(1)
        indices_20 = compressor.get_bit_address(20)
        assert len(indices_20) > 0
        assert all(isinstance(i, int) for i in indices_20)

        # Verify the sum
        total = sum(compressor.fibonacci_cache[i] for i in indices_20)
        assert total == 20

    def test_validate_oeis_a003714(self, compressor):
        """Test OEIS A003714 validation."""
        # All positive integers should produce valid Fibbinary encodings
        test_values = [1, 2, 4, 5, 8, 9, 10, 16, 17, 18, 20, 21]

        for n in test_values:
            assert compressor.validate_oeis_a003714(n), \
                f"Failed A003714 validation for {n}"

    def test_get_compression_stats(self, compressor):
        """Test compression statistics generation."""
        data = list(range(1, 51))
        stats = compressor.get_compression_stats(data)

        assert stats['dataset_size'] == 50
        assert stats['min_value'] == 1
        assert stats['max_value'] == 50
        assert stats['avg_value'] == 25.5
        assert 'compression_ratio' in stats
        assert 'space_saving_percent' in stats
        assert 'oeis_a003714_valid_count' in stats
        assert stats['oeis_a003714_valid_count'] == 50  # All should be valid

    def test_empty_dataset_stats(self, compressor):
        """Test statistics with empty dataset."""
        stats = compressor.get_compression_stats([])
        assert 'error' in stats

    def test_large_values(self, compressor):
        """Test compression with large values."""
        large_values = [10**3, 10**4, 10**5, 10**6]

        for n in large_values:
            encoded = compressor.encode(n)
            decoded = compressor.decode(encoded)
            assert decoded == n
            assert '11' not in encoded  # Valid Zeckendorf

    def test_compression_ratio_improvement(self, compressor):
        """Test that compression provides space savings for typical data."""
        # Test with trading-like data (prices in cents)
        prices = [10000, 10050, 10100, 10025, 10150, 10200, 10175]
        result = compressor.compress_sequence(prices)

        # For Fibonacci-friendly numbers, we expect some compression
        # or at least no significant expansion
        assert result['compression_ratio'] > 0.5, \
            "Compression ratio too low"

    def test_fibonacci_cache_boundary(self, compressor):
        """Test values near Fibonacci numbers."""
        # Values just before and after Fibonacci numbers
        fib_tests = [
            (12, 13),  # Just below F(6)=13
            (13, 13),  # Exactly F(6)=13
            (14, 13),  # Just above F(6)=13
        ]

        for n, expected_fib_nearby in fib_tests:
            encoded = compressor.encode(n)
            decoded = compressor.decode(encoded)
            assert decoded == n

    def test_agent_synchronization_addresses(self, compressor):
        """Test bit addresses for agent coordination."""
        # Agent 7 uses bit addresses for synchronization
        sync_values = [7, 14, 21, 28]  # Multiples of 7 (Agent 7's ID)

        for n in sync_values:
            indices = compressor.get_bit_address(n)
            assert len(indices) > 0
            # Verify indices are valid and sorted
            assert indices == sorted(indices, reverse=True)
            # Verify no consecutive indices (Zeckendorf property)
            for i in range(len(indices) - 1):
                assert indices[i] - indices[i+1] >= 2, \
                    f"Consecutive Fibonacci indices for {n}: {indices}"


class TestOEISA003714Integration:
    """Integration tests for OEIS A003714 sequence."""

    @pytest.fixture
    def compressor(self):
        return ZeckendorfCompressor()

    def test_first_100_fibbinary_numbers(self, compressor):
        """Verify first 100 terms of OEIS A003714."""
        # These should all be Fibbinary numbers (no consecutive 1's)
        for n in compressor.oeis_a003714_cache[:100]:
            assert not compressor._has_consecutive_ones(n)

    def test_non_fibbinary_numbers(self, compressor):
        """Test that non-Fibbinary numbers are correctly identified."""
        # Numbers with consecutive 1's: 3, 6, 7, 11, 12, 13, 14, 15, ...
        non_fibbinary = [3, 6, 7, 11, 12, 13, 14, 15]

        for n in non_fibbinary:
            assert n not in compressor.oeis_a003714_cache[:20]
            assert compressor._has_consecutive_ones(n)

    def test_fibbinary_encoding_consistency(self, compressor):
        """Test that Zeckendorf encodings are Fibbinary numbers."""
        test_values = list(range(1, 101))

        for n in test_values:
            encoded = compressor.encode(n)
            # Convert binary string to integer
            encoded_int = int(encoded, 2)
            # Check if it's a Fibbinary number
            assert not compressor._has_consecutive_ones(encoded_int), \
                f"Encoding {encoded} of {n} is not Fibbinary"


class TestCompressionEfficiency:
    """Tests focused on compression performance."""

    @pytest.fixture
    def compressor(self):
        return ZeckendorfCompressor()

    def test_compression_monotonic_sequence(self, compressor):
        """Test compression on monotonically increasing sequence."""
        data = list(range(1, 101))
        stats = compressor.get_compression_stats(data)

        assert stats['compression_ratio'] > 0
        assert stats['oeis_a003714_valid_percent'] == 100.0

    def test_compression_fibonacci_sequence(self, compressor):
        """Test compression on Fibonacci numbers themselves."""
        data = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89]
        stats = compressor.get_compression_stats(data)

        # Fibonacci numbers should compress very efficiently
        # (each is a single Fibonacci term)
        assert stats['compression_ratio'] > 0.5

    def test_compression_random_like_data(self, compressor):
        """Test compression on pseudo-random data."""
        # Trading prices: 10000 +/- random walk
        import random
        random.seed(42)
        base = 10000
        data = [base + random.randint(-1000, 1000) for _ in range(100)]

        stats = compressor.get_compression_stats(data)
        assert stats['dataset_size'] == 100
        assert stats['compression_ratio'] > 0


def test_cli_output(capsys, compressor=None):
    """Test command-line interface output."""
    if compressor is None:
        compressor = ZeckendorfCompressor()

    # Run main demo
    from encoders.zeckendorf_compressor import main
    main()

    captured = capsys.readouterr()
    assert "Zeckendorf Compressor" in captured.out
    assert "OEIS A003714" in captured.out
    assert "✅" in captured.out


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

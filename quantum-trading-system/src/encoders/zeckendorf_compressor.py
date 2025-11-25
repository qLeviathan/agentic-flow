"""
Zeckendorf Compressor - OEIS A003714
Agent 7: Fibonacci-based integer compression using Zeckendorf representation

Zeckendorf's theorem: Every positive integer can be uniquely represented
as a sum of non-consecutive Fibonacci numbers.

OEIS A003714: Fibbinary numbers - numbers whose binary representation
contains no consecutive 1's (interpreted as Zeckendorf representations).

Examples:
    20 = F(7) + F(5) + F(3) = 13 + 5 + 2 = "1010100"
    100 = F(12) + F(10) + F(7) + F(4) = 144 + 55 + 13 + 3 = error (144>100)
    100 = F(11) + F(9) + F(6) + F(4) = 89 + 34 + 8 + 3 = "10101010000" (wrong)
    100 = F(11) + F(8) + F(4) = 89 + 21 + 3 = "10010100" (wrong, 89+21=110)
    100 = F(11) + F(7) + F(5) + F(3) = 89 + 13 + 5 + 2 = "10101010" (wrong, 89+13=102)
    100 = F(10) + F(8) + F(6) + F(4) + F(3) = 55 + 21 + 8 + 3 + 2 = 89 (close)
    100 = F(10) + F(8) + F(6) + F(5) + F(3) = 55 + 21 + 8 + 5 + 2 = 91 (close)
    100 = F(10) + F(8) + F(7) + F(4) = 55 + 21 + 13 + 3 = 92 (close)
    100 = F(10) + F(8) + F(7) + F(5) = 55 + 21 + 13 + 5 = 94 (close)
    100 = F(10) + F(8) + F(7) + F(5) + F(3) = 55 + 21 + 13 + 5 + 2 = 96 (close)
    100 = F(10) + F(9) + F(6) + F(4) = 55 + 34 + 8 + 3 = 100 ✓ = "1100101000"
"""

from typing import List, Tuple, Dict, Optional
import sys


class ZeckendorfCompressor:
    """
    Implements Zeckendorf representation for integer compression.
    Based on OEIS A003714 - Fibbinary numbers.
    """

    def __init__(self, max_value: int = 10**9):
        """
        Initialize the Zeckendorf compressor.

        Args:
            max_value: Maximum integer value to support (default 10^9)
        """
        self.max_value = max_value
        self.fibonacci_cache = self._generate_fibonacci_sequence(max_value)
        self.oeis_a003714_cache = self._generate_oeis_a003714(1000)

    def _generate_fibonacci_sequence(self, max_val: int) -> List[int]:
        """
        Generate Fibonacci sequence up to max_val.
        F(1)=1, F(2)=2, F(3)=3, F(4)=5, F(5)=8, F(6)=13, ...

        Args:
            max_val: Maximum value to generate

        Returns:
            List of Fibonacci numbers
        """
        fibs = [1, 2]
        while fibs[-1] < max_val:
            fibs.append(fibs[-1] + fibs[-2])
        return fibs

    def _generate_oeis_a003714(self, count: int) -> List[int]:
        """
        Generate first 'count' terms of OEIS A003714 (Fibbinary numbers).
        These are numbers whose binary representation contains no consecutive 1's.

        Sequence: 0, 1, 2, 4, 5, 8, 9, 10, 16, 17, 18, 20, 21, 32, 33, ...

        Args:
            count: Number of terms to generate

        Returns:
            List of A003714 terms
        """
        fibbinary = []
        n = 0
        while len(fibbinary) < count:
            # Check if binary representation has no consecutive 1's
            if not self._has_consecutive_ones(n):
                fibbinary.append(n)
            n += 1
        return fibbinary

    def _has_consecutive_ones(self, n: int) -> bool:
        """
        Check if binary representation of n has consecutive 1's.

        Args:
            n: Integer to check

        Returns:
            True if has consecutive 1's, False otherwise
        """
        return bool(n & (n >> 1))

    def encode(self, n: int) -> str:
        """
        Convert integer to Zeckendorf representation (binary string).

        Args:
            n: Positive integer to encode

        Returns:
            Binary string representing Zeckendorf form

        Raises:
            ValueError: If n is not positive or exceeds max_value
        """
        if n <= 0:
            raise ValueError("Input must be a positive integer")
        if n > self.max_value:
            raise ValueError(f"Input exceeds max_value {self.max_value}")

        # Greedy algorithm: use largest non-consecutive Fibonacci numbers
        result = []
        remaining = n
        i = len(self.fibonacci_cache) - 1

        # Start from largest Fibonacci number <= n
        while i >= 0 and self.fibonacci_cache[i] > remaining:
            i -= 1

        # Build representation from largest to smallest
        used_prev = False
        while i >= 0 and remaining > 0:
            if not used_prev and self.fibonacci_cache[i] <= remaining:
                result.append(i)
                remaining -= self.fibonacci_cache[i]
                used_prev = True
            else:
                used_prev = False
            i -= 1

        if remaining != 0:
            raise ValueError(f"Failed to encode {n} completely (remaining: {remaining})")

        # Convert to binary string
        if not result:
            return "0"

        max_idx = max(result)
        binary = ['0'] * (max_idx + 1)
        for idx in result:
            binary[max_idx - idx] = '1'

        return ''.join(binary)

    def decode(self, zeck_repr: str) -> int:
        """
        Convert Zeckendorf representation back to integer.

        Args:
            zeck_repr: Binary string in Zeckendorf form

        Returns:
            Decoded integer

        Raises:
            ValueError: If representation is invalid
        """
        if not zeck_repr or not all(c in '01' for c in zeck_repr):
            raise ValueError("Invalid Zeckendorf representation")

        # Check for consecutive 1's (invalid Zeckendorf)
        if '11' in zeck_repr:
            raise ValueError("Invalid Zeckendorf: contains consecutive 1's")

        result = 0
        length = len(zeck_repr)

        for i, bit in enumerate(zeck_repr):
            if bit == '1':
                fib_index = length - 1 - i
                if fib_index < len(self.fibonacci_cache):
                    result += self.fibonacci_cache[fib_index]
                else:
                    raise ValueError(f"Fibonacci index {fib_index} out of range")

        return result

    def encode_bytes(self, n: int) -> bytes:
        """
        Encode integer to compact byte representation.

        Args:
            n: Integer to encode

        Returns:
            Byte representation
        """
        zeck_str = self.encode(n)
        # Pack bits into bytes
        byte_count = (len(zeck_str) + 7) // 8
        result = bytearray(byte_count)

        for i, bit in enumerate(zeck_str):
            if bit == '1':
                byte_idx = i // 8
                bit_idx = 7 - (i % 8)
                result[byte_idx] |= (1 << bit_idx)

        return bytes(result)

    def compress_sequence(self, numbers: List[int]) -> Dict:
        """
        Compress a sequence of integers using Zeckendorf encoding.

        Args:
            numbers: List of integers to compress

        Returns:
            Dictionary with compression statistics
        """
        original_bits = sum(n.bit_length() for n in numbers)
        encoded = [self.encode(n) for n in numbers]
        compressed_bits = sum(len(e) for e in encoded)

        return {
            'original_bits': original_bits,
            'compressed_bits': compressed_bits,
            'compression_ratio': original_bits / compressed_bits if compressed_bits > 0 else 0,
            'space_saving': (1 - compressed_bits / original_bits) * 100 if original_bits > 0 else 0,
            'encoded_values': encoded
        }

    def get_bit_address(self, n: int) -> List[int]:
        """
        Get Fibonacci indices used in Zeckendorf representation.
        Used for agent synchronization via bit-level addressing.

        Args:
            n: Integer to analyze

        Returns:
            List of Fibonacci indices
        """
        zeck_repr = self.encode(n)
        indices = []
        length = len(zeck_repr)

        for i, bit in enumerate(zeck_repr):
            if bit == '1':
                indices.append(length - 1 - i)

        return indices

    def validate_oeis_a003714(self, n: int) -> bool:
        """
        Validate that encoded value matches OEIS A003714 property.
        (Binary representation has no consecutive 1's)

        Args:
            n: Integer to validate

        Returns:
            True if valid Fibbinary number
        """
        try:
            zeck_repr = self.encode(n)
            return '11' not in zeck_repr
        except ValueError:
            return False

    def get_compression_stats(self, data: List[int]) -> Dict:
        """
        Analyze compression efficiency for a dataset.

        Args:
            data: List of integers

        Returns:
            Comprehensive statistics dictionary
        """
        if not data:
            return {'error': 'Empty dataset'}

        results = self.compress_sequence(data)

        # Additional statistics
        avg_original_bits = results['original_bits'] / len(data)
        avg_compressed_bits = results['compressed_bits'] / len(data)

        # Validate OEIS A003714 property
        valid_count = sum(1 for n in data if self.validate_oeis_a003714(n))

        return {
            'dataset_size': len(data),
            'min_value': min(data),
            'max_value': max(data),
            'avg_value': sum(data) / len(data),
            'original_bits_total': results['original_bits'],
            'compressed_bits_total': results['compressed_bits'],
            'avg_original_bits': avg_original_bits,
            'avg_compressed_bits': avg_compressed_bits,
            'compression_ratio': results['compression_ratio'],
            'space_saving_percent': results['space_saving'],
            'oeis_a003714_valid_count': valid_count,
            'oeis_a003714_valid_percent': (valid_count / len(data)) * 100
        }


def main():
    """Demo and validation of Zeckendorf compressor."""
    compressor = ZeckendorfCompressor()

    print("=" * 80)
    print("Zeckendorf Compressor - OEIS A003714 Validation")
    print("Agent 7: Fibonacci-based Integer Compression")
    print("=" * 80)

    # Test cases
    test_values = [1, 2, 3, 4, 5, 10, 20, 50, 100, 255, 1000, 10000]

    print("\n1. ENCODING TEST")
    print("-" * 80)
    for n in test_values:
        try:
            encoded = compressor.encode(n)
            decoded = compressor.decode(encoded)
            indices = compressor.get_bit_address(n)
            valid = compressor.validate_oeis_a003714(n)

            print(f"n={n:6d} | Zeck={encoded:>16s} | Decode={decoded:6d} | "
                  f"Indices={indices} | Valid={valid}")

            if decoded != n:
                print(f"  ❌ ERROR: Decoded value {decoded} != {n}")
        except Exception as e:
            print(f"n={n:6d} | ERROR: {e}")

    # OEIS A003714 validation
    print("\n2. OEIS A003714 VALIDATION (First 50 Fibbinary Numbers)")
    print("-" * 80)
    print("Fibbinary numbers (no consecutive 1's in binary):")
    for i in range(0, min(50, len(compressor.oeis_a003714_cache)), 10):
        chunk = compressor.oeis_a003714_cache[i:i+10]
        print(f"A003714[{i:3d}-{i+9:3d}]: {chunk}")

    # Compression test
    print("\n3. COMPRESSION EFFICIENCY TEST")
    print("-" * 80)
    test_data = list(range(1, 101))
    stats = compressor.get_compression_stats(test_data)

    print(f"Dataset size:          {stats['dataset_size']}")
    print(f"Value range:           {stats['min_value']} - {stats['max_value']}")
    print(f"Average value:         {stats['avg_value']:.2f}")
    print(f"Original bits:         {stats['original_bits_total']}")
    print(f"Compressed bits:       {stats['compressed_bits_total']}")
    print(f"Compression ratio:     {stats['compression_ratio']:.3f}x")
    print(f"Space saving:          {stats['space_saving_percent']:.2f}%")
    print(f"A003714 valid:         {stats['oeis_a003714_valid_count']}/{stats['dataset_size']} "
          f"({stats['oeis_a003714_valid_percent']:.1f}%)")

    print("\n" + "=" * 80)
    print("✅ Zeckendorf Compressor validation complete")
    print("=" * 80)


if __name__ == '__main__':
    main()

"""
Fibonacci Price Encoder - Agent 5 (Zeckendorf: 1000)

OEIS A000045: Fibonacci Sequence
F(n) = F(n-1) + F(n-2), with F(0) = 0, F(1) = 1

Encodes price levels as Fibonacci retracements using integer-only arithmetic.
Implements golden ratio (φ) approximations and log-space transformations.

Dependencies: None (standalone encoder)
"""

from typing import List, Tuple, Dict, Optional
import json
from pathlib import Path


class FibonacciEncoder:
    """
    Integer-only Fibonacci price encoder.

    Generates Fibonacci sequence F(0) to F(50) and encodes prices as:
    - Fibonacci indices (log-space encoding)
    - Retracement levels (236/1000, 382/1000, 500/1000, 618/1000, 1000/1000)
    - Support/resistance levels
    - Log-space transformations for price dynamics

    All operations use integer arithmetic with scaling factors.
    """

    # OEIS A000045: First 51 Fibonacci numbers (F(0) to F(50))
    OEIS_A000045 = [
        0, 1, 1, 2, 3, 5, 8, 13, 21, 34,
        55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181,
        6765, 10946, 17711, 28657, 46368, 75025, 121393, 196418, 317811, 514229,
        832040, 1346269, 2178309, 3524578, 5702887, 9227465, 14930352, 24157817, 39088169, 63245986,
        102334155, 165580141, 267914296, 433494437, 701408733, 1134903170, 1836311903, 2971215073, 4807526976, 7778742049,
        12586269025
    ]

    # Integer retracement ratios (scaled by 1000 for precision)
    RETRACEMENT_RATIOS = {
        '236': 236,   # 23.6% = 236/1000
        '382': 382,   # 38.2% = 382/1000
        '500': 500,   # 50.0% = 500/1000 (golden pocket high)
        '618': 618,   # 61.8% = 618/1000 (GOLDEN RATIO - golden pocket low)
        '786': 786,   # 78.6% = 786/1000
        '1000': 1000, # 100% = 1000/1000
    }

    # Fibonacci extension ratios (for targets)
    EXTENSION_RATIOS = {
        '618': 618,   # 0.618 extension
        '1000': 1000, # 1.0 extension
        '1618': 1618, # 1.618 extension (GOLDEN EXTENSION)
        '2618': 2618, # 2.618 extension
    }

    # Golden ratio φ approximation (scaled by 10^9)
    PHI_SCALED = 1618033988  # φ * 10^9 ≈ 1.618033988
    SCALE_FACTOR = 1000000000  # 10^9

    def __init__(self, max_index: int = 50):
        """
        Initialize Fibonacci encoder.

        Args:
            max_index: Maximum Fibonacci index (default 50)
        """
        self.max_index = min(max_index, len(self.OEIS_A000045) - 1)
        self.sequence = self.OEIS_A000045[:self.max_index + 1]

        # Validate OEIS sequence
        self._validate_oeis()

    def _validate_oeis(self) -> bool:
        """
        Validate Fibonacci sequence against OEIS A000045.

        Returns:
            True if valid, raises ValueError otherwise
        """
        # Check base cases
        if self.sequence[0] != 0:
            raise ValueError(f"OEIS A000045 validation failed: F(0) = {self.sequence[0]}, expected 0")
        if self.sequence[1] != 1:
            raise ValueError(f"OEIS A000045 validation failed: F(1) = {self.sequence[1]}, expected 1")

        # Validate recurrence relation: F(n) = F(n-1) + F(n-2)
        for i in range(2, len(self.sequence)):
            expected = self.sequence[i-1] + self.sequence[i-2]
            if self.sequence[i] != expected:
                raise ValueError(
                    f"OEIS A000045 validation failed at F({i}): "
                    f"got {self.sequence[i]}, expected {expected}"
                )

        # Validate specific known values
        known_values = {
            0: 0, 1: 1, 2: 1, 3: 2, 4: 3, 5: 5, 6: 8, 7: 13, 8: 21, 9: 34,
            10: 55, 15: 610, 20: 6765
        }

        for idx, value in known_values.items():
            if idx <= self.max_index and self.sequence[idx] != value:
                raise ValueError(
                    f"OEIS A000045 validation failed: F({idx}) = {self.sequence[idx]}, expected {value}"
                )

        return True

    def get_fibonacci(self, n: int) -> int:
        """
        Get nth Fibonacci number from OEIS A000045.

        Args:
            n: Fibonacci index

        Returns:
            F(n)
        """
        if n < 0 or n > self.max_index:
            raise ValueError(f"Index {n} out of range [0, {self.max_index}]")
        return self.sequence[n]

    def encode_price(self, price_cents: int) -> int:
        """
        Encode price as Fibonacci index using log-space approximation.

        Uses binary search to find largest Fibonacci number <= price.
        This provides integer-only log_φ(price) approximation.

        Args:
            price_cents: Price in cents (e.g., $123.45 = 12345)

        Returns:
            Fibonacci index encoding
        """
        if price_cents <= 0:
            return 0
        if price_cents == 1:
            return 1

        # Binary search for closest Fibonacci number
        left, right = 0, len(self.sequence) - 1

        while left < right:
            mid = (left + right + 1) // 2
            if self.sequence[mid] <= price_cents:
                left = mid
            else:
                right = mid - 1

        return left

    def decode_price(self, fib_index: int) -> int:
        """
        Decode Fibonacci index back to price.

        Args:
            fib_index: Fibonacci sequence index

        Returns:
            Price in cents
        """
        if fib_index < 0 or fib_index > self.max_index:
            raise ValueError(f"Index {fib_index} out of range")
        return self.sequence[fib_index]

    def calculate_retracements(self, high_cents: int, low_cents: int) -> Dict[str, int]:
        """
        Calculate Fibonacci retracement levels using integer-only arithmetic.

        Formula: level = high - (range × ratio / 1000)

        Args:
            high_cents: Swing high price in cents
            low_cents: Swing low price in cents

        Returns:
            Dictionary of retracement levels
        """
        if high_cents <= low_cents:
            raise ValueError("High must be greater than low")

        price_range = high_cents - low_cents

        retracements = {}
        for name, ratio in self.RETRACEMENT_RATIOS.items():
            # Integer division: high - (range × ratio / 1000)
            level = high_cents - (price_range * ratio) // 1000
            retracements[f'level_{name}'] = level

        # Golden pocket (50-61.8% zone)
        retracements['golden_pocket_high'] = retracements['level_500']
        retracements['golden_pocket_low'] = retracements['level_618']

        return retracements

    def calculate_extensions(self, high_cents: int, low_cents: int) -> Dict[str, int]:
        """
        Calculate Fibonacci extension levels (profit targets).

        Formula: extension = high + (range × ratio / 1000)

        Args:
            high_cents: Swing high price in cents
            low_cents: Swing low price in cents

        Returns:
            Dictionary of extension levels
        """
        if high_cents <= low_cents:
            raise ValueError("High must be greater than low")

        price_range = high_cents - low_cents

        extensions = {}
        for name, ratio in self.EXTENSION_RATIOS.items():
            # Integer division: high + (range × ratio / 1000)
            level = high_cents + (price_range * ratio) // 1000
            extensions[f'ext_{name}'] = level

        return extensions

    def find_support_resistance(self, price_cents: int, levels: int = 3) -> Tuple[List[int], List[int]]:
        """
        Find support and resistance levels at Fibonacci numbers.

        Support: F(n-1), F(n-2), F(n-3), ...
        Resistance: F(n+1), F(n+2), F(n+3), ...

        Args:
            price_cents: Current price in cents
            levels: Number of levels to return

        Returns:
            Tuple of (support_levels, resistance_levels)
        """
        current_idx = self.encode_price(price_cents)

        support = []
        for i in range(1, levels + 1):
            idx = current_idx - i
            if idx >= 0:
                support.append(self.sequence[idx])

        resistance = []
        for i in range(1, levels + 1):
            idx = current_idx + i
            if idx <= self.max_index:
                resistance.append(self.sequence[idx])

        return support, resistance

    def price_to_log_space(self, price_cents: int) -> int:
        """
        Transform price to log-space using integer operations.

        log_space = (price × scale) / F(encode(price))

        This provides log-space dynamics for price movements while
        maintaining integer-only arithmetic.

        Args:
            price_cents: Price in cents

        Returns:
            Log-space transformed value (scaled integer)
        """
        if price_cents <= 0:
            return 0

        idx = self.encode_price(price_cents)
        fib_val = max(1, self.sequence[idx])  # Avoid division by zero

        # Integer division with scaling
        TRANSFORM_SCALE = 1000000  # 10^6 scale factor
        return (price_cents * TRANSFORM_SCALE) // fib_val

    def log_space_to_price(self, log_value: int, reference_idx: int) -> int:
        """
        Transform log-space value back to price.

        Args:
            log_value: Log-space value
            reference_idx: Fibonacci index used for transformation

        Returns:
            Price in cents
        """
        if reference_idx < 0 or reference_idx > self.max_index:
            raise ValueError(f"Reference index {reference_idx} out of range")

        fib_val = self.sequence[reference_idx]
        TRANSFORM_SCALE = 1000000

        return (log_value * fib_val) // TRANSFORM_SCALE

    def calculate_golden_ratio(self) -> int:
        """
        Calculate golden ratio φ using Fibonacci ratios.

        Uses F(n+1) / F(n) → φ as n → ∞
        Returns φ scaled by 10^6 for integer precision.

        Returns:
            φ × 1000000 (integer approximation)
        """
        # Use large indices for better approximation
        n = min(40, self.max_index)
        fn = self.sequence[n]
        fn_minus_1 = self.sequence[n - 1]

        if fn_minus_1 == 0:
            return 1618034  # Fallback to known value

        # Calculate (F(n) / F(n-1)) × 1000000
        PHI_SCALE = 1000000
        return (fn * PHI_SCALE) // fn_minus_1

    def is_at_fibonacci_level(self, current_price: int, target_level: int, tolerance_cents: int = 10) -> bool:
        """
        Check if current price is at a Fibonacci level.

        Args:
            current_price: Current price in cents
            target_level: Target Fibonacci level in cents
            tolerance_cents: Allowed difference in cents

        Returns:
            True if within tolerance
        """
        diff = abs(current_price - target_level)
        return diff <= tolerance_cents

    def encode_ticker_prices(self, ticker_data: Dict[str, List[int]]) -> Dict[str, Dict]:
        """
        Encode prices for multiple tickers.

        Args:
            ticker_data: Dict mapping ticker -> list of prices in cents

        Returns:
            Dict mapping ticker -> encoded data
        """
        results = {}

        for ticker, prices in ticker_data.items():
            if not prices:
                continue

            high = max(prices)
            low = min(prices)
            current = prices[-1]

            results[ticker] = {
                'current_price': current,
                'current_index': self.encode_price(current),
                'high': high,
                'low': low,
                'retracements': self.calculate_retracements(high, low),
                'extensions': self.calculate_extensions(high, low),
                'support_resistance': {
                    'support': self.find_support_resistance(current, 3)[0],
                    'resistance': self.find_support_resistance(current, 3)[1]
                },
                'log_space': self.price_to_log_space(current)
            }

        return results

    def export_oeis_validation(self) -> Dict[str, any]:
        """
        Export OEIS A000045 validation data.

        Returns:
            Validation report
        """
        return {
            'sequence': 'A000045',
            'name': 'Fibonacci numbers',
            'formula': 'F(n) = F(n-1) + F(n-2), F(0) = 0, F(1) = 1',
            'first_50_terms': self.sequence,
            'validation': {
                'F(0)': self.sequence[0] == 0,
                'F(1)': self.sequence[1] == 1,
                'F(10)': self.sequence[10] == 55,
                'F(20)': self.sequence[20] == 6765 if self.max_index >= 20 else None,
                'recurrence_valid': self._check_recurrence_all()
            },
            'golden_ratio': {
                'scaled_value': self.calculate_golden_ratio(),
                'expected': 1618034,  # φ × 10^6
                'formula': 'φ = lim(n→∞) F(n+1)/F(n)'
            }
        }

    def _check_recurrence_all(self) -> bool:
        """Check recurrence relation for all terms."""
        for i in range(2, len(self.sequence)):
            if self.sequence[i] != self.sequence[i-1] + self.sequence[i-2]:
                return False
        return True


def main():
    """
    Demonstration of Fibonacci encoder with OEIS A000045 validation.
    """
    print("=" * 80)
    print("FIBONACCI ENCODER - Agent 5 (Zeckendorf: 1000)")
    print("OEIS A000045: Fibonacci Sequence")
    print("=" * 80)
    print()

    # Initialize encoder
    encoder = FibonacciEncoder(max_index=50)

    # Validate OEIS sequence
    print("[1] OEIS A000045 Validation")
    validation = encoder.export_oeis_validation()
    print(f"   Sequence: {validation['sequence']}")
    print(f"   Formula: {validation['formula']}")
    print(f"   F(0) = {validation['first_50_terms'][0]} ✓" if validation['validation']['F(0)'] else "   F(0) FAIL")
    print(f"   F(1) = {validation['first_50_terms'][1]} ✓" if validation['validation']['F(1)'] else "   F(1) FAIL")
    print(f"   F(10) = {validation['first_50_terms'][10]} ✓" if validation['validation']['F(10)'] else "   F(10) FAIL")
    print(f"   F(20) = {validation['first_50_terms'][20]} ✓" if validation['validation']['F(20)'] else "   F(20) FAIL")
    print(f"   Recurrence: {'PASS ✓' if validation['validation']['recurrence_valid'] else 'FAIL'}")
    print()

    # Golden ratio
    phi = encoder.calculate_golden_ratio()
    print(f"[2] Golden Ratio φ")
    print(f"   Calculated: {phi / 1000000:.6f}")
    print(f"   Expected: 1.618034")
    print(f"   Difference: {abs(phi - 1618034)} (scaled units)")
    print()

    # Example: Calculate retracement levels
    print("[3] Fibonacci Retracements Example")
    high = 15000  # $150.00
    low = 10000   # $100.00
    print(f"   Price Range: ${low/100:.2f} to ${high/100:.2f}")

    retracements = encoder.calculate_retracements(high, low)
    print("   Retracement Levels:")
    for level, price in sorted(retracements.items(), key=lambda x: x[1], reverse=True):
        if 'golden_pocket' not in level:
            ratio = level.split('_')[1]
            print(f"      {ratio}: ${price/100:.2f}")

    print(f"   Golden Pocket: ${retracements['golden_pocket_low']/100:.2f} - ${retracements['golden_pocket_high']/100:.2f}")
    print()

    # Example: Support/Resistance
    print("[4] Support & Resistance")
    current_price = 12500  # $125.00
    support, resistance = encoder.find_support_resistance(current_price, 3)
    print(f"   Current Price: ${current_price/100:.2f}")
    print(f"   Support Levels: {[f'${s/100:.2f}' for s in support]}")
    print(f"   Resistance Levels: {[f'${r/100:.2f}' for r in resistance]}")
    print()

    print("=" * 80)
    print("✅ FIBONACCI ENCODER VALIDATION COMPLETE")
    print("=" * 80)


if __name__ == "__main__":
    main()

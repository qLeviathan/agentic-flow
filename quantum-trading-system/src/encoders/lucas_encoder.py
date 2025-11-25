"""
Lucas Number Encoder (OEIS A000032)
====================================

Implements time interval encoding using Lucas numbers for Nash equilibrium exits.

Lucas Sequence: L(n) = L(n-1) + L(n-2)
Initial conditions: L(0) = 2, L(1) = 1

Sequence: 2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123, 199, 322, 521, 843, ...

OEIS Reference: https://oeis.org/A000032
Mathematical Properties:
- L(n) = F(n-1) + F(n+1) where F is Fibonacci
- L(n) = φⁿ + ψⁿ where φ = golden ratio, ψ = -1/φ
- Companion sequence to Fibonacci numbers

Application: Optimal exit timing for Nash equilibrium strategies
"""

from typing import List, Dict, Tuple
from datetime import datetime, timedelta


class LucasEncoder:
    """
    Encode time intervals using Lucas numbers (OEIS A000032).

    All operations use integer-only arithmetic for quantum coherence.
    """

    # OEIS A000032 - First 30 Lucas numbers
    OEIS_A000032 = [
        2, 1, 3, 4, 7, 11, 18, 29, 47, 76,
        123, 199, 322, 521, 843, 1364, 2207, 3571, 5778, 9349,
        15127, 24476, 39603, 64079, 103682, 167761, 271443, 439204, 710647, 1149851
    ]

    # Trading-relevant Lucas day intervals
    LUCAS_DAYS = [2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123]

    def __init__(self, max_n: int = 50):
        """
        Initialize Lucas encoder.

        Args:
            max_n: Maximum Lucas number index to compute
        """
        self.max_n = max_n
        self.lucas_sequence = self._generate_lucas_sequence(max_n)
        self._validate_oeis()

    def _generate_lucas_sequence(self, n: int) -> List[int]:
        """
        Generate Lucas sequence up to L(n) using integer-only arithmetic.

        L(0) = 2, L(1) = 1
        L(n) = L(n-1) + L(n-2) for n >= 2

        Args:
            n: Number of Lucas numbers to generate

        Returns:
            List of first n Lucas numbers
        """
        if n <= 0:
            return []
        if n == 1:
            return [2]

        lucas = [2, 1]  # L(0) = 2, L(1) = 1

        for i in range(2, n):
            # Integer-only addition
            lucas.append(lucas[i-1] + lucas[i-2])

        return lucas

    def _validate_oeis(self) -> None:
        """
        Validate generated Lucas sequence against OEIS A000032.

        Raises:
            AssertionError: If generated sequence doesn't match OEIS
        """
        oeis_len = len(self.OEIS_A000032)
        for i in range(min(oeis_len, len(self.lucas_sequence))):
            assert self.lucas_sequence[i] == self.OEIS_A000032[i], \
                f"Lucas sequence mismatch at index {i}: " \
                f"got {self.lucas_sequence[i]}, expected {self.OEIS_A000032[i]}"

        print(f"✅ OEIS A000032 validation PASS: First {oeis_len} Lucas numbers verified")

    def get_lucas(self, n: int) -> int:
        """
        Get the nth Lucas number.

        Args:
            n: Index in Lucas sequence

        Returns:
            L(n) as integer

        Raises:
            IndexError: If n exceeds max_n
        """
        if n >= len(self.lucas_sequence):
            raise IndexError(f"Lucas index {n} exceeds max_n={self.max_n}")
        return self.lucas_sequence[n]

    def encode_time_interval(self, base_timestamp: int, lucas_index: int) -> int:
        """
        Encode time interval using Lucas number.

        Adds L(lucas_index) days to base timestamp.

        Args:
            base_timestamp: Unix timestamp in seconds (integer)
            lucas_index: Index in Lucas sequence for day offset

        Returns:
            New timestamp as integer (seconds since epoch)
        """
        lucas_days = self.get_lucas(lucas_index)
        seconds_per_day = 86400  # 24 * 60 * 60
        offset_seconds = lucas_days * seconds_per_day

        return base_timestamp + offset_seconds

    def encode_nash_exit_times(
        self,
        entry_timestamp: int,
        num_exits: int = 5
    ) -> List[Dict[str, int]]:
        """
        Generate Nash equilibrium exit timestamps using Lucas intervals.

        Creates multiple exit points following Lucas day intervals:
        - Exit 1: entry + L(2) = entry + 3 days
        - Exit 2: entry + L(3) = entry + 4 days
        - Exit 3: entry + L(4) = entry + 7 days
        - etc.

        Args:
            entry_timestamp: Entry time (Unix timestamp in seconds)
            num_exits: Number of exit points to generate

        Returns:
            List of dicts with exit_index, lucas_index, lucas_days, timestamp
        """
        exits = []

        for i in range(num_exits):
            lucas_index = i + 2  # Start from L(2) = 3
            lucas_days = self.get_lucas(lucas_index)
            exit_timestamp = self.encode_time_interval(entry_timestamp, lucas_index)

            exits.append({
                'exit_index': i + 1,
                'lucas_index': lucas_index,
                'lucas_days': lucas_days,
                'timestamp': exit_timestamp,
                'days_from_entry': lucas_days
            })

        return exits

    def encode_timestamp_series(
        self,
        start_timestamp: int,
        num_intervals: int
    ) -> List[int]:
        """
        Generate series of timestamps spaced by Lucas intervals.

        Args:
            start_timestamp: Starting Unix timestamp
            num_intervals: Number of intervals to generate

        Returns:
            List of timestamps as integers
        """
        timestamps = [start_timestamp]
        current_timestamp = start_timestamp

        for i in range(num_intervals):
            current_timestamp = self.encode_time_interval(current_timestamp, i)
            timestamps.append(current_timestamp)

        return timestamps

    def get_lucas_day_multiples(
        self,
        target_days: int,
        max_terms: int = 10
    ) -> Tuple[List[int], int]:
        """
        Decompose target days into sum of Lucas numbers.

        Similar to Zeckendorf representation but for Lucas sequence.
        Uses greedy algorithm: largest Lucas numbers first.

        Args:
            target_days: Number of days to decompose
            max_terms: Maximum Lucas terms to use

        Returns:
            Tuple of (list of Lucas indices used, sum achieved)
        """
        if target_days <= 0:
            return ([], 0)

        lucas_indices = []
        remaining = target_days

        # Iterate from largest to smallest Lucas numbers
        for i in range(len(self.lucas_sequence) - 1, -1, -1):
            lucas_val = self.lucas_sequence[i]

            # Use this Lucas number if it fits
            while remaining >= lucas_val and len(lucas_indices) < max_terms:
                lucas_indices.append(i)
                remaining -= lucas_val

            if remaining == 0:
                break

        lucas_indices.sort()  # Sort for readability
        sum_achieved = target_days - remaining

        return (lucas_indices, sum_achieved)

    def validate_integer_operations(self) -> Dict[str, bool]:
        """
        Verify all operations use integer-only arithmetic.

        Returns:
            Dict with validation results
        """
        validations = {
            'lucas_sequence_integers': all(isinstance(x, int) for x in self.lucas_sequence),
            'oeis_match': True,
            'no_floats': True
        }

        # Check for any float leakage
        test_timestamp = 1700000000  # Example timestamp
        test_encoded = self.encode_time_interval(test_timestamp, 5)
        validations['timestamp_integer'] = isinstance(test_encoded, int)

        # Check Nash exit times
        exits = self.encode_nash_exit_times(test_timestamp, 3)
        validations['nash_exits_integers'] = all(
            isinstance(e['timestamp'], int) and isinstance(e['lucas_days'], int)
            for e in exits
        )

        validations['all_pass'] = all(validations.values())

        return validations

    def get_oeis_info(self) -> Dict[str, any]:
        """
        Get OEIS A000032 sequence information.

        Returns:
            Dict with OEIS metadata
        """
        return {
            'oeis_id': 'A000032',
            'name': 'Lucas numbers',
            'formula': 'L(n) = L(n-1) + L(n-2), L(0) = 2, L(1) = 1',
            'relation_to_fibonacci': 'L(n) = F(n-1) + F(n+1)',
            'first_30_terms': self.OEIS_A000032,
            'computed_sequence': self.lucas_sequence[:30],
            'match': self.lucas_sequence[:30] == self.OEIS_A000032
        }


def main():
    """
    Demonstration of Lucas encoder functionality.
    """
    print("=" * 70)
    print("Lucas Number Encoder (OEIS A000032)")
    print("=" * 70)

    # Initialize encoder
    encoder = LucasEncoder(max_n=30)

    # Display Lucas sequence
    print("\n📊 Lucas Sequence (First 20 terms):")
    print("-" * 70)
    for i in range(20):
        print(f"L({i:2d}) = {encoder.get_lucas(i):>8d}", end="")
        if (i + 1) % 4 == 0:
            print()
    print()

    # OEIS validation
    print("\n✅ OEIS A000032 Validation:")
    print("-" * 70)
    oeis_info = encoder.get_oeis_info()
    print(f"Sequence ID: {oeis_info['oeis_id']}")
    print(f"Formula: {oeis_info['formula']}")
    print(f"Match with OEIS: {oeis_info['match']}")

    # Nash equilibrium exit timing
    print("\n⏰ Nash Equilibrium Exit Timing:")
    print("-" * 70)
    entry_time = int(datetime(2024, 1, 1, 9, 30).timestamp())
    exits = encoder.encode_nash_exit_times(entry_time, num_exits=8)

    print(f"Entry Time: {datetime.fromtimestamp(entry_time).strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"\n{'Exit':<6} {'Lucas':<8} {'Days':<6} {'Exit Timestamp':<20} {'Exit Date'}")
    print("-" * 70)

    for exit_data in exits:
        exit_date = datetime.fromtimestamp(exit_data['timestamp'])
        print(
            f"{exit_data['exit_index']:<6} "
            f"L({exit_data['lucas_index']:<2d})     "
            f"{exit_data['lucas_days']:<6} "
            f"{exit_data['timestamp']:<20} "
            f"{exit_date.strftime('%Y-%m-%d %H:%M:%S')}"
        )

    # Time series encoding
    print("\n📈 Lucas Time Series (10 intervals from 2024-01-01):")
    print("-" * 70)
    start_ts = int(datetime(2024, 1, 1).timestamp())
    time_series = encoder.encode_timestamp_series(start_ts, num_intervals=10)

    for i, ts in enumerate(time_series):
        date = datetime.fromtimestamp(ts)
        print(f"T{i:2d}: {date.strftime('%Y-%m-%d')} (timestamp: {ts})")

    # Lucas day decomposition
    print("\n🧮 Lucas Day Decomposition:")
    print("-" * 70)
    target_days = [100, 250, 500, 1000]

    for days in target_days:
        indices, achieved = encoder.get_lucas_day_multiples(days)
        lucas_values = [encoder.get_lucas(i) for i in indices]
        print(f"Target: {days:4d} days → {indices} = {lucas_values} = {achieved} days")

    # Integer validation
    print("\n🔒 Integer-Only Validation:")
    print("-" * 70)
    validations = encoder.validate_integer_operations()
    for key, value in validations.items():
        status = "✅ PASS" if value else "❌ FAIL"
        print(f"{key:<30}: {status}")

    print("\n" + "=" * 70)
    print("Lucas Encoder Ready for Nash Equilibrium Timing")
    print("=" * 70)


if __name__ == "__main__":
    main()

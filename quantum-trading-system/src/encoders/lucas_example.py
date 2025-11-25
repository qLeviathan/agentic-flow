"""
Lucas Encoder Usage Examples
============================

Practical examples for using Lucas encoder (OEIS A000032) in quantum trading.
"""

from lucas_encoder import LucasEncoder
from datetime import datetime


def example_1_basic_nash_exits():
    """Example 1: Generate Nash equilibrium exit points for a trade."""
    print("=" * 70)
    print("Example 1: Nash Equilibrium Exit Strategy")
    print("=" * 70)

    encoder = LucasEncoder(max_n=30)

    # Entry: Market open on 2024-11-01 at 9:30 AM
    entry_time = datetime(2024, 11, 1, 9, 30)
    entry_timestamp = int(entry_time.timestamp())

    print(f"\n📊 Trade Entry: {entry_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Strategy: Use Lucas intervals for optimal exit timing\n")

    # Generate 6 exit points
    exits = encoder.encode_nash_exit_times(entry_timestamp, num_exits=6)

    print(f"{'Exit':<6} {'Lucas Days':<12} {'Exit Date':<20} {'Profit Target'}")
    print("-" * 70)

    profit_targets = [2, 3, 5, 8, 10, 12]  # Example profit percentages

    for exit_data, profit in zip(exits, profit_targets):
        exit_date = datetime.fromtimestamp(exit_data['timestamp'])
        print(
            f"{exit_data['exit_index']:<6} "
            f"L({exit_data['lucas_index']}) = {exit_data['lucas_days']:<5} "
            f"{exit_date.strftime('%Y-%m-%d %H:%M'):<20} "
            f"{profit}%"
        )

    print("\n💡 Strategy: Exit partial positions at each Lucas interval")
    print("   using predetermined profit targets.\n")


def example_2_time_series_analysis():
    """Example 2: Generate Lucas time series for pattern analysis."""
    print("=" * 70)
    print("Example 2: Lucas Time Series for Market Cycles")
    print("=" * 70)

    encoder = LucasEncoder(max_n=30)

    # Start: Beginning of 2024
    start_date = datetime(2024, 1, 1)
    start_timestamp = int(start_date.timestamp())

    print(f"\n📅 Analysis Period Starting: {start_date.strftime('%Y-%m-%d')}")
    print("Generating Lucas-based time intervals for cycle analysis\n")

    # Generate 12 time points
    time_series = encoder.encode_timestamp_series(start_timestamp, num_intervals=12)

    print(f"{'Interval':<10} {'Date':<15} {'Days Elapsed':<15} {'Lucas Index'}")
    print("-" * 70)

    for i, ts in enumerate(time_series):
        date = datetime.fromtimestamp(ts)
        days_elapsed = (ts - start_timestamp) // 86400
        print(
            f"T{i:<8} "
            f"{date.strftime('%Y-%m-%d'):<15} "
            f"{days_elapsed:<15} "
            f"L({i})"
        )

    print("\n💡 Use these dates to check for market cycle turning points.\n")


def example_3_day_decomposition():
    """Example 3: Decompose holding periods into Lucas numbers."""
    print("=" * 70)
    print("Example 3: Position Holding Period Optimization")
    print("=" * 70)

    encoder = LucasEncoder(max_n=30)

    # Common holding periods
    holding_periods = [30, 60, 90, 180, 365]

    print("\n🎯 Optimize holding periods using Lucas decomposition:\n")
    print(f"{'Target Days':<15} {'Lucas Composition':<40} {'Achieved'}")
    print("-" * 70)

    for days in holding_periods:
        indices, achieved = encoder.get_lucas_day_multiples(days)
        lucas_values = [encoder.get_lucas(i) for i in indices]

        composition = " + ".join([f"L({i})" for i in indices])
        values_str = " + ".join([str(v) for v in lucas_values])

        print(
            f"{days:<15} "
            f"{composition:<40} "
            f"{achieved} days"
        )
        print(f"{'':15} {values_str}")

    print("\n💡 Use Lucas decomposition to structure multi-exit strategies.\n")


def example_4_quarterly_strategy():
    """Example 4: Quarterly rebalancing with Lucas timing."""
    print("=" * 70)
    print("Example 4: Quarterly Rebalancing Strategy")
    print("=" * 70)

    encoder = LucasEncoder(max_n=30)

    # Q1 2024 start
    q1_start = datetime(2024, 1, 1, 9, 30)
    q1_timestamp = int(q1_start.timestamp())

    print(f"\n📊 Q1 2024 Strategy Start: {q1_start.strftime('%Y-%m-%d')}")
    print("Monthly review points using Lucas intervals:\n")

    # Target monthly reviews (~30 days apart)
    # L(7) = 29 days ≈ 1 month
    # L(8) = 47 days ≈ 1.5 months
    # L(9) = 76 days ≈ 2.5 months

    monthly_reviews = [
        (7, "Month 1 Review"),
        (8, "6-Week Review"),
        (9, "Quarter End Review")
    ]

    print(f"{'Review Point':<20} {'Lucas':<12} {'Days':<8} {'Review Date'}")
    print("-" * 70)

    for lucas_idx, description in monthly_reviews:
        lucas_days = encoder.get_lucas(lucas_idx)
        review_timestamp = encoder.encode_time_interval(q1_timestamp, lucas_idx)
        review_date = datetime.fromtimestamp(review_timestamp)

        print(
            f"{description:<20} "
            f"L({lucas_idx}) = {lucas_days:<5} "
            f"{lucas_days:<8} "
            f"{review_date.strftime('%Y-%m-%d')}"
        )

    print("\n💡 Natural review cadence aligned with Lucas intervals.\n")


def example_5_integer_validation():
    """Example 5: Verify integer-only operations."""
    print("=" * 70)
    print("Example 5: Integer-Only Arithmetic Validation")
    print("=" * 70)

    encoder = LucasEncoder(max_n=30)

    print("\n🔒 Quantum Coherence Requirement: NO FLOAT OPERATIONS")
    print("Running comprehensive integer validation...\n")

    validations = encoder.validate_integer_operations()

    print(f"{'Validation Check':<35} {'Status'}")
    print("-" * 70)

    for check, passed in validations.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{check:<35} {status}")

    if validations['all_pass']:
        print("\n✅ Integer-only validation COMPLETE")
        print("   Lucas encoder maintains quantum coherence!\n")
    else:
        print("\n❌ VALIDATION FAILED - Float contamination detected!\n")


def example_6_oeis_verification():
    """Example 6: OEIS A000032 sequence verification."""
    print("=" * 70)
    print("Example 6: OEIS A000032 Sequence Verification")
    print("=" * 70)

    encoder = LucasEncoder(max_n=30)

    print("\n📚 Lucas Numbers (OEIS A000032)")
    print("Formula: L(n) = L(n-1) + L(n-2), L(0) = 2, L(1) = 1\n")

    oeis_info = encoder.get_oeis_info()

    print(f"OEIS ID: {oeis_info['oeis_id']}")
    print(f"Sequence Name: {oeis_info['name']}")
    print(f"Relation to Fibonacci: {oeis_info['relation_to_fibonacci']}")
    print(f"Matches OEIS Database: {oeis_info['match']}\n")

    print("First 20 Lucas Numbers:")
    print("-" * 70)

    for i in range(20):
        lucas_val = encoder.get_lucas(i)
        print(f"L({i:2d}) = {lucas_val:>8d}", end="")
        if (i + 1) % 5 == 0:
            print()

    print("\n✅ OEIS A000032 verification complete\n")


def main():
    """Run all usage examples."""
    examples = [
        example_1_basic_nash_exits,
        example_2_time_series_analysis,
        example_3_day_decomposition,
        example_4_quarterly_strategy,
        example_5_integer_validation,
        example_6_oeis_verification
    ]

    for i, example in enumerate(examples, 1):
        example()
        if i < len(examples):
            input("\nPress Enter to continue to next example...")
            print("\n\n")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
Agent 7: Zeckendorf Compressor Integration Demo
Demonstrates coordination with Agents 5 (Fibonacci) and 6 (Lucas)
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'src'))

from encoders import ZeckendorfCompressor

def main():
    print("=" * 80)
    print("AGENT 7: ZECKENDORF COMPRESSOR INTEGRATION DEMO")
    print("OEIS A003714 - Fibbinary Numbers")
    print("=" * 80)

    compressor = ZeckendorfCompressor()

    # Demo 1: Agent Addressing
    print("\n1. AGENT ADDRESSING (Agents 5, 6, 7 Coordination)")
    print("-" * 80)

    agent_ids = [5, 6, 7, 10, 20]
    for agent_id in agent_ids:
        encoded = compressor.encode(agent_id)
        indices = compressor.get_bit_address(agent_id)
        fibonacci_terms = [compressor.fibonacci_cache[i] for i in indices]

        print(f"Agent {agent_id:2d}:")
        print(f"  Zeckendorf:      {encoded}")
        print(f"  Fibonacci terms: {' + '.join(map(str, fibonacci_terms))} = {sum(fibonacci_terms)}")
        print(f"  Indices:         {indices}")
        print()

    # Demo 2: Price Compression
    print("\n2. TRADING PRICE COMPRESSION")
    print("-" * 80)

    # Sample trading prices (in cents)
    prices = [10000, 10050, 10100, 10025, 10150, 10200, 10175, 10125]

    print(f"Original prices (cents): {prices}")
    print()

    for price in prices[:3]:  # Show first 3 in detail
        encoded = compressor.encode(price)
        indices = compressor.get_bit_address(price)
        fib_terms = [compressor.fibonacci_cache[i] for i in indices]

        print(f"${price/100:.2f} ({price} cents):")
        print(f"  Binary:      {bin(price)[2:].zfill(14)} (14 bits)")
        print(f"  Zeckendorf:  {encoded} ({len(encoded)} bits)")
        print(f"  Fibonacci:   {' + '.join(map(str, fib_terms))} = {sum(fib_terms)}")
        print()

    # Compression statistics
    stats = compressor.get_compression_stats(prices)
    print(f"Compression Statistics:")
    print(f"  Dataset size:        {stats['dataset_size']}")
    print(f"  Original bits:       {stats['original_bits_total']}")
    print(f"  Compressed bits:     {stats['compressed_bits_total']}")
    print(f"  Compression ratio:   {stats['compression_ratio']:.3f}x")
    print(f"  Space saving:        {stats['space_saving_percent']:.2f}%")
    print(f"  OEIS A003714 valid:  {stats['oeis_a003714_valid_count']}/{stats['dataset_size']}")

    # Demo 3: Fibonacci Number Optimal Compression
    print("\n3. FIBONACCI NUMBERS (Optimal Compression)")
    print("-" * 80)

    fibonacci_nums = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89]
    print(f"Fibonacci sequence: {fibonacci_nums}")
    print()

    for fib in fibonacci_nums[:5]:  # Show first 5
        encoded = compressor.encode(fib)
        print(f"F = {fib:2d} -> Zeckendorf: {encoded:>6s} ({len(encoded)} bit{'s' if len(encoded) > 1 else ''})")

    stats_fib = compressor.get_compression_stats(fibonacci_nums)
    print(f"\nFibonacci Compression:")
    print(f"  Original bits:    {stats_fib['original_bits_total']}")
    print(f"  Compressed bits:  {stats_fib['compressed_bits_total']}")
    print(f"  Compression:      {stats_fib['compression_ratio']:.2f}x")
    print(f"  Space saving:     {stats_fib['space_saving_percent']:.1f}%")

    # Demo 4: OEIS A003714 Validation
    print("\n4. OEIS A003714 VALIDATION (Fibbinary Numbers)")
    print("-" * 80)

    print("First 30 Fibbinary numbers (no consecutive 1's in binary):")
    fibbinary = compressor.oeis_a003714_cache[:30]
    for i in range(0, 30, 10):
        chunk = fibbinary[i:i+10]
        print(f"  [{i:2d}-{i+9:2d}]: {chunk}")

    print("\nValidation:")
    for n in [1, 5, 10, 20, 100]:
        is_valid = compressor.validate_oeis_a003714(n)
        encoded = compressor.encode(n)
        has_consecutive = '11' in encoded
        print(f"  n={n:3d}: Zeck={encoded:>16s}, Valid={is_valid}, Has consecutive 1's={has_consecutive}")

    # Demo 5: Byte Encoding
    print("\n5. BYTE-LEVEL ENCODING")
    print("-" * 80)

    test_values = [100, 1000, 10000]
    for val in test_values:
        encoded_str = compressor.encode(val)
        encoded_bytes = compressor.encode_bytes(val)

        print(f"Value: {val}")
        print(f"  Zeckendorf string: {encoded_str} ({len(encoded_str)} bits)")
        print(f"  Byte encoding:     {encoded_bytes.hex()} ({len(encoded_bytes)} bytes)")
        print()

    # Demo 6: Agent Synchronization Protocol
    print("\n6. AGENT SYNCHRONIZATION PROTOCOL")
    print("-" * 80)

    print("Agent coordination via Fibonacci bit addressing:\n")
    print("Agent 5 (Fibonacci): Provides sequence foundation")
    print(f"  Address: {compressor.encode(5)} = F{compressor.get_bit_address(5)}")
    print()
    print("Agent 6 (Lucas): Provides temporal coordination")
    print(f"  Address: {compressor.encode(6)} = F{compressor.get_bit_address(6)}")
    print()
    print("Agent 7 (Zeckendorf): Provides spatial bit addressing")
    print(f"  Address: {compressor.encode(7)} = F{compressor.get_bit_address(7)}")
    print()
    print("Combined space-time coordination protocol active ✅")

    print("\n" + "=" * 80)
    print("✅ Agent 7 Integration Demo Complete")
    print("=" * 80)


if __name__ == '__main__':
    main()

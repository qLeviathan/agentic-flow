#!/usr/bin/env python3
"""
Demo script for Tiingo Data Fetcher

This demonstrates how to use the integer-based Tiingo data fetcher
to download market data with pure integer pricing.

Usage:
    export TIINGO_API_TOKEN="your_token_here"
    python examples/demo_tiingo_fetcher.py

Author: Tiingo API Specialist
"""

import sys
import os

# Add src to path
sys.path.insert(0, '/home/user/agentic-flow/quantum-trading-system/src')

from data.tiingo_fetcher import TiingoDataFetcher, PRICE_MULTIPLIER


def demo_single_ticker():
    """Demo: Fetch data for a single ticker"""
    print("\n" + "="*60)
    print("DEMO 1: Fetch Single Ticker (AAPL)")
    print("="*60)

    fetcher = TiingoDataFetcher(
        output_dir="/home/user/agentic-flow/quantum-trading-system/data/tiingo_raw"
    )

    # Fetch last 30 days of AAPL data
    data = fetcher.fetch_daily_prices(
        'AAPL',
        start_date='2024-10-01',
        end_date='2024-11-24'
    )

    print(f"\nFetched {len(data)} days of data for AAPL")
    print(f"\nFirst record:")
    print(f"  Date: {data[0].date}")
    print(f"  Open: {data[0].open_price:,} (${data[0].open_price / PRICE_MULTIPLIER:.2f})")
    print(f"  High: {data[0].high_price:,} (${data[0].high_price / PRICE_MULTIPLIER:.2f})")
    print(f"  Low: {data[0].low_price:,} (${data[0].low_price / PRICE_MULTIPLIER:.2f})")
    print(f"  Close: {data[0].close_price:,} (${data[0].close_price / PRICE_MULTIPLIER:.2f})")
    print(f"  Volume: {data[0].volume:,}")

    # Save to CSV
    filepath = fetcher.save_to_csv('AAPL', data)
    print(f"\n✅ Saved to: {filepath}")


def demo_multiple_tickers():
    """Demo: Fetch data for multiple tickers"""
    print("\n" + "="*60)
    print("DEMO 2: Fetch Multiple Tickers (FAANG stocks)")
    print("="*60)

    fetcher = TiingoDataFetcher()

    tickers = ['META', 'AAPL', 'AMZN', 'NFLX', 'GOOGL']

    results = fetcher.fetch_multiple_tickers(
        tickers,
        start_date='2024-11-01',
        end_date='2024-11-24'
    )

    print("\nResults:")
    for ticker, data in results.items():
        if data:
            print(f"  {ticker}: {len(data)} days")
        else:
            print(f"  {ticker}: NO DATA")

    fetcher.print_summary()


def demo_integer_verification():
    """Demo: Verify all prices are integers"""
    print("\n" + "="*60)
    print("DEMO 3: Integer Verification")
    print("="*60)

    fetcher = TiingoDataFetcher()

    # Fetch data
    data = fetcher.fetch_daily_prices('SPY', start_date='2024-11-01', end_date='2024-11-05')

    print(f"\nVerifying {len(data)} records...")

    all_integers = True
    for record in data:
        # Check each price field
        for field in ['open_price', 'high_price', 'low_price', 'close_price', 'adj_close']:
            value = getattr(record, field)
            if not isinstance(value, int):
                print(f"❌ FLOAT FOUND: {field} = {value} (type: {type(value)})")
                all_integers = False

    if all_integers:
        print("✅ ALL PRICES ARE INTEGERS!")
        print(f"   Price multiplier: {PRICE_MULTIPLIER:,}x")
        print(f"   Precision: 4 decimal places")
    else:
        print("❌ FLOATS DETECTED - Integer conversion failed!")


def demo_data_quality():
    """Demo: Data quality verification"""
    print("\n" + "="*60)
    print("DEMO 4: Data Quality Verification")
    print("="*60)

    fetcher = TiingoDataFetcher()

    # Fetch a few tickers
    results = fetcher.fetch_multiple_tickers(
        ['SPY', 'QQQ', 'IWM'],
        start_date='2024-01-01',
        end_date='2024-11-24'
    )

    # Verify quality
    quality = fetcher.verify_data_quality(results, min_rows=200)

    print("\nQuality Report:")
    print(f"  Total Tickers: {quality['total_tickers']}")
    print(f"  With Data: {quality['tickers_with_data']}")
    print(f"  Insufficient Data: {len(quality['tickers_insufficient_data'])}")
    print(f"  All Integers: {'✅ YES' if quality['all_integers'] else '❌ NO'}")

    print("\nDate Ranges:")
    for ticker, info in quality['date_range'].items():
        print(f"  {ticker}: {info['start']} to {info['end']} ({info['count']} days)")


def demo_csv_export():
    """Demo: CSV export functionality"""
    print("\n" + "="*60)
    print("DEMO 5: CSV Export")
    print("="*60)

    fetcher = TiingoDataFetcher()

    # Fetch data
    results = fetcher.fetch_multiple_tickers(
        ['AAPL', 'MSFT'],
        start_date='2024-11-01',
        end_date='2024-11-24',
        save_individual=True
    )

    # Save combined CSV
    combined_file = fetcher.save_combined_csv(results, filename='demo_combined.csv')

    print(f"\n✅ Individual CSV files created")
    print(f"✅ Combined CSV: {combined_file}")


def main():
    """Run all demos"""
    print("\n" + "="*60)
    print("TIINGO DATA FETCHER - DEMO SUITE")
    print("Integer-Based Market Data Acquisition")
    print("="*60)

    # Check for API token
    if not os.getenv('TIINGO_API_TOKEN'):
        print("\n❌ ERROR: TIINGO_API_TOKEN environment variable not set")
        print("\nTo use this demo:")
        print("1. Sign up for free at https://api.tiingo.com")
        print("2. Get your API token")
        print("3. Run: export TIINGO_API_TOKEN='your_token_here'")
        print("4. Run this script again")
        return

    try:
        demo_single_ticker()
        demo_integer_verification()
        demo_data_quality()
        demo_multiple_tickers()
        demo_csv_export()

        print("\n" + "="*60)
        print("ALL DEMOS COMPLETED SUCCESSFULLY!")
        print("="*60)
        print("\nNext steps:")
        print("1. Check CSV files in: data/tiingo_raw/")
        print("2. Run tests: pytest tests/test_tiingo_fetcher.py")
        print("3. Fetch all 100 tickers: python -m src.data.tiingo_fetcher")
        print("="*60)

    except Exception as e:
        print(f"\n❌ Error running demos: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()

#!/usr/bin/env python3
"""
Example usage scripts for Tiingo API Integration

Demonstrates common use cases and patterns for the trading system.
"""

import sys
import os
from datetime import datetime, timedelta
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from api_integration import (
    TiingoAPIClient,
    RateLimitConfig,
    CacheConfig,
    TiingoAPIError,
    RateLimitExceeded
)


def example_1_basic_ticker_fetch():
    """Example 1: Fetch basic ticker data"""
    print("\n" + "="*60)
    print("EXAMPLE 1: Basic Ticker Fetch")
    print("="*60)

    try:
        # Initialize client (uses TIINGO_API_TOKEN from environment)
        client = TiingoAPIClient()

        # Fetch last 30 days of Apple stock data
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

        print(f"\nFetching AAPL data from {start_date} to {end_date}...")
        df = client.get_daily_prices('AAPL', start_date, end_date)

        print(f"\nData shape: {df.shape}")
        print(f"Columns: {df.columns.tolist()}")
        print("\nFirst 5 rows:")
        print(df.head())

        print("\nLast 5 rows:")
        print(df.tail())

        # Export to CSV
        csv_files = client.export_to_csv(df, prefix='example1_aapl')
        print(f"\nExported to: {csv_files[0]}")

    except TiingoAPIError as e:
        print(f"Error: {e}")
        print("\nMake sure TIINGO_API_TOKEN is set in your environment")


def example_2_sector_etfs():
    """Example 2: Fetch all sector ETF data"""
    print("\n" + "="*60)
    print("EXAMPLE 2: Sector ETF Data")
    print("="*60)

    try:
        client = TiingoAPIClient()

        # Fetch last quarter of data
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')

        print(f"\nFetching sector ETF data from {start_date} to {end_date}...")
        print("This will fetch data for 11 sector ETFs:")
        print("SPY, XLK, XLV, XLF, XLE, XLY, XLP, XLI, XLB, XLRE, XLU, XLC")

        sector_data = client.get_sector_etf_data(start_date, end_date)

        print("\n" + "-"*60)
        print(f"{'Ticker':<6} {'Days':<6} {'Latest Close':<15} {'Change %':<10}")
        print("-"*60)

        for ticker, df in sector_data.items():
            if not df.empty:
                latest_close = df.iloc[-1]['close']
                first_close = df.iloc[0]['close']
                change_pct = ((latest_close - first_close) / first_close) * 100

                print(f"{ticker:<6} {len(df):<6} ${latest_close:<14.2f} {change_pct:>+9.2f}%")

        # Export all to CSV
        csv_files = client.export_to_csv(sector_data, prefix='example2_sectors')
        print(f"\nExported {len(csv_files)} CSV files")

    except TiingoAPIError as e:
        print(f"Error: {e}")


def example_3_batch_download():
    """Example 3: Batch download multiple tickers"""
    print("\n" + "="*60)
    print("EXAMPLE 3: Batch Download with Error Handling")
    print("="*60)

    try:
        client = TiingoAPIClient()

        # FAANG + Microsoft
        tickers = ['META', 'AAPL', 'AMZN', 'NFLX', 'GOOGL', 'MSFT']

        # Fetch year-to-date data
        end_date = datetime.now().strftime('%Y-%m-%d')
        start_date = f"{datetime.now().year}-01-01"

        print(f"\nBatch downloading {len(tickers)} tickers...")
        print(f"Date range: {start_date} to {end_date}")
        print(f"Tickers: {', '.join(tickers)}")

        results = client.batch_download_tickers(
            tickers,
            start_date=start_date,
            end_date=end_date,
            max_retries=3,
            retry_delay=5
        )

        # Analyze results
        import pandas as pd
        successful = {}
        failed = {}

        for ticker, result in results.items():
            if isinstance(result, pd.DataFrame):
                successful[ticker] = result
            else:
                failed[ticker] = result

        print(f"\nSuccess: {len(successful)}/{len(tickers)}")

        if successful:
            print("\n" + "-"*70)
            print(f"{'Ticker':<8} {'Days':<6} {'First Close':<15} {'Last Close':<15} {'Return %':<10}")
            print("-"*70)

            for ticker, df in successful.items():
                first_close = df.iloc[0]['close']
                last_close = df.iloc[-1]['close']
                return_pct = ((last_close - first_close) / first_close) * 100

                print(f"{ticker:<8} {len(df):<6} ${first_close:<14.2f} ${last_close:<14.2f} {return_pct:>+9.2f}%")

            # Export
            csv_files = client.export_to_csv(successful, prefix='example3_batch')
            json_files = client.export_to_json(successful, prefix='example3_batch')

            print(f"\nExported to {len(csv_files)} CSV and {len(json_files)} JSON files")

        if failed:
            print(f"\n{len(failed)} ticker(s) failed:")
            for ticker, error in failed.items():
                print(f"  {ticker}: {error}")

    except TiingoAPIError as e:
        print(f"Error: {e}")


def example_4_cache_management():
    """Example 4: Cache management and statistics"""
    print("\n" + "="*60)
    print("EXAMPLE 4: Cache Management")
    print("="*60)

    try:
        client = TiingoAPIClient()

        # Get cache stats
        print("\nCache Statistics:")
        stats = client.get_cache_stats()
        print(f"  Total files: {stats['total_files']}")
        print(f"  Total size: {stats['total_size_mb']:.2f} MB")
        print(f"  Cache directory: {stats['cache_dir']}")

        # Fetch some data (will be cached)
        print("\nFetching AAPL data (first request - will be cached)...")
        import time
        start = time.time()
        df1 = client.get_daily_prices('AAPL', start_date='2024-01-01')
        elapsed1 = time.time() - start
        print(f"  Time: {elapsed1:.2f} seconds")

        # Fetch same data again (should be from cache)
        print("\nFetching AAPL data again (should be from cache)...")
        start = time.time()
        df2 = client.get_daily_prices('AAPL', start_date='2024-01-01')
        elapsed2 = time.time() - start
        print(f"  Time: {elapsed2:.2f} seconds")
        print(f"  Speedup: {elapsed1/elapsed2:.1f}x faster!")

        # Check cache stats again
        print("\nUpdated Cache Statistics:")
        stats = client.get_cache_stats()
        print(f"  Total files: {stats['total_files']}")
        print(f"  Total size: {stats['total_size_mb']:.2f} MB")

        # Optional: Clear cache
        # client.clear_cache()
        # print("\nCache cleared!")

    except TiingoAPIError as e:
        print(f"Error: {e}")


def example_5_ticker_metadata():
    """Example 5: Get ticker metadata"""
    print("\n" + "="*60)
    print("EXAMPLE 5: Ticker Metadata")
    print("="*60)

    try:
        client = TiingoAPIClient()

        tickers = ['AAPL', 'MSFT', 'GOOGL']

        for ticker in tickers:
            print(f"\n{ticker} Metadata:")
            metadata = client.get_ticker_metadata(ticker)

            print(f"  Name: {metadata.get('name', 'N/A')}")
            print(f"  Exchange: {metadata.get('exchangeCode', 'N/A')}")
            print(f"  Start Date: {metadata.get('startDate', 'N/A')}")
            print(f"  End Date: {metadata.get('endDate', 'N/A')}")
            print(f"  Description: {metadata.get('description', 'N/A')[:100]}...")

    except TiingoAPIError as e:
        print(f"Error: {e}")


def example_6_custom_configuration():
    """Example 6: Custom rate limiting and cache configuration"""
    print("\n" + "="*60)
    print("EXAMPLE 6: Custom Configuration")
    print("="*60)

    # Custom rate limiting (for paid tier)
    rate_config = RateLimitConfig(
        max_requests_per_hour=1000,  # Custom limit
        max_requests_per_minute=100
    )

    # Custom caching
    cache_config = CacheConfig(
        cache_dir='/home/user/agentic-flow/trading-system/data/cache',
        ttl_seconds=3600,  # 1 hour
        use_agentdb=True
    )

    client = TiingoAPIClient(
        rate_limit_config=rate_config,
        cache_config=cache_config
    )

    print("\nCustom Configuration Applied:")
    print(f"  Rate Limit: {rate_config.max_requests_per_hour} requests/hour")
    print(f"  Cache TTL: {cache_config.ttl_seconds} seconds")
    print(f"  AgentDB: {cache_config.use_agentdb}")

    # Fetch some data
    df = client.get_daily_prices('AAPL', start_date='2024-01-01')
    print(f"\nFetched {len(df)} days of data")


def main():
    """Run all examples"""
    print("\n" + "="*60)
    print("TIINGO API INTEGRATION - EXAMPLE USAGE")
    print("="*60)

    examples = [
        ("Basic Ticker Fetch", example_1_basic_ticker_fetch),
        ("Sector ETF Data", example_2_sector_etfs),
        ("Batch Download", example_3_batch_download),
        ("Cache Management", example_4_cache_management),
        ("Ticker Metadata", example_5_ticker_metadata),
        ("Custom Configuration", example_6_custom_configuration),
    ]

    print("\nAvailable Examples:")
    for i, (name, _) in enumerate(examples, 1):
        print(f"  {i}. {name}")
    print("  0. Run all examples")

    try:
        choice = input("\nSelect example (0-6): ").strip()

        if choice == '0':
            for name, func in examples:
                func()
        elif 1 <= int(choice) <= len(examples):
            examples[int(choice)-1][1]()
        else:
            print("Invalid choice")
    except (ValueError, KeyboardInterrupt):
        print("\nExiting...")

    print("\n" + "="*60)
    print("Examples completed!")
    print("="*60 + "\n")


if __name__ == '__main__':
    main()

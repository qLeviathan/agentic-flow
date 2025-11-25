"""
Integer-Based Tiingo Data Fetcher for Quantum Trading System

This module fetches daily OHLCV data from Tiingo API and converts all prices to integers
by multiplying by 10000. This eliminates floating-point arithmetic issues and enables
pure integer-based mathematical framework.

Author: Tiingo API Specialist Agent
Zeckendorf Address: 1
Date: 2025-11-24
"""

import os
import time
import json
import logging
import requests
import csv
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from pathlib import Path
from dataclasses import dataclass
import hashlib
from threading import Lock


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# Price conversion factor: all prices multiplied by 10000 for integer storage
PRICE_MULTIPLIER = 10000


@dataclass
class IntegerOHLCV:
    """
    Integer-based OHLCV data structure
    All prices are integers (actual_price * 10000)
    """
    ticker: str
    date: str  # ISO format: YYYY-MM-DD
    open_price: int
    high_price: int
    low_price: int
    close_price: int
    volume: int
    adj_close: int

    def to_dict(self) -> Dict:
        """Convert to dictionary for CSV export"""
        return {
            'ticker': self.ticker,
            'date': self.date,
            'open': self.open_price,
            'high': self.high_price,
            'low': self.low_price,
            'close': self.close_price,
            'volume': self.volume,
            'adj_close': self.adj_close
        }

    @staticmethod
    def from_tiingo_response(ticker: str, data: Dict) -> 'IntegerOHLCV':
        """
        Convert Tiingo API response to integer OHLCV

        Args:
            ticker: Stock ticker symbol
            data: Tiingo API response dict

        Returns:
            IntegerOHLCV object with integer prices
        """
        return IntegerOHLCV(
            ticker=ticker,
            date=data['date'].split('T')[0],  # Extract date only
            open_price=int(round(data['open'] * PRICE_MULTIPLIER)),
            high_price=int(round(data['high'] * PRICE_MULTIPLIER)),
            low_price=int(round(data['low'] * PRICE_MULTIPLIER)),
            close_price=int(round(data['close'] * PRICE_MULTIPLIER)),
            volume=int(data['volume']),
            adj_close=int(round(data['adjClose'] * PRICE_MULTIPLIER))
        )


class RateLimiter:
    """Simple token bucket rate limiter for API calls"""

    def __init__(self, requests_per_hour: int = 500):
        """
        Initialize rate limiter

        Args:
            requests_per_hour: Maximum requests per hour (Tiingo free tier: 500/hour)
        """
        self.rate = requests_per_hour / 3600  # requests per second
        self.capacity = requests_per_hour
        self.tokens = requests_per_hour
        self.last_update = time.time()
        self.lock = Lock()

    def acquire(self) -> float:
        """
        Acquire a token for API call

        Returns:
            float: Wait time in seconds (0 if no wait needed)
        """
        with self.lock:
            now = time.time()
            elapsed = now - self.last_update

            # Refill tokens based on elapsed time
            self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
            self.last_update = now

            if self.tokens >= 1:
                self.tokens -= 1
                return 0.0
            else:
                # Calculate wait time
                wait_time = (1 - self.tokens) / self.rate
                return wait_time


class TiingoDataFetcher:
    """
    Fetch daily OHLCV data from Tiingo API with integer conversion

    All prices are converted to integers by multiplying by 10000.
    This enables pure integer-based mathematical operations.
    """

    BASE_URL = "https://api.tiingo.com"
    DEFAULT_START_DATE = "2020-01-01"

    def __init__(
        self,
        api_token: Optional[str] = None,
        output_dir: str = "/home/user/agentic-flow/quantum-trading-system/data/tiingo_raw",
        rate_limit: int = 500
    ):
        """
        Initialize Tiingo data fetcher

        Args:
            api_token: Tiingo API token (defaults to TIINGO_API_TOKEN env var)
            output_dir: Directory for CSV output files
            rate_limit: Maximum requests per hour (default: 500 for free tier)
        """
        self.api_token = api_token or os.getenv('TIINGO_API_TOKEN')
        if not self.api_token:
            raise ValueError(
                "Tiingo API token required. Set TIINGO_API_TOKEN environment variable.\n"
                "Visit https://api.tiingo.com to get a free API key."
            )

        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.rate_limiter = RateLimiter(requests_per_hour=rate_limit)

        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Token {self.api_token}'
        }

        # Statistics tracking
        self.stats = {
            'total_requests': 0,
            'successful_requests': 0,
            'failed_requests': 0,
            'total_rows': 0,
            'tickers_completed': []
        }

        logger.info(f"TiingoDataFetcher initialized. Output: {self.output_dir}")

    def fetch_daily_prices(
        self,
        ticker: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> List[IntegerOHLCV]:
        """
        Fetch daily price data for a single ticker

        Args:
            ticker: Stock ticker symbol
            start_date: Start date (YYYY-MM-DD), defaults to 2020-01-01
            end_date: End date (YYYY-MM-DD), defaults to today

        Returns:
            List[IntegerOHLCV]: List of integer OHLCV records
        """
        # Apply rate limiting
        wait_time = self.rate_limiter.acquire()
        if wait_time > 0:
            logger.info(f"Rate limit: waiting {wait_time:.2f}s before fetching {ticker}")
            time.sleep(wait_time)

        # Prepare request
        endpoint = f"{self.BASE_URL}/tiingo/daily/{ticker}/prices"
        params = {
            'startDate': start_date or self.DEFAULT_START_DATE,
            'endDate': end_date or datetime.now().strftime('%Y-%m-%d')
        }

        try:
            logger.info(f"Fetching {ticker} from {params['startDate']} to {params['endDate']}")

            self.stats['total_requests'] += 1
            response = requests.get(endpoint, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()

            # Convert to integer OHLCV
            ohlcv_records = [
                IntegerOHLCV.from_tiingo_response(ticker, record)
                for record in data
            ]

            self.stats['successful_requests'] += 1
            self.stats['total_rows'] += len(ohlcv_records)

            logger.info(f"✓ {ticker}: fetched {len(ohlcv_records)} rows")

            return ohlcv_records

        except requests.exceptions.HTTPError as e:
            self.stats['failed_requests'] += 1
            if e.response.status_code == 429:
                logger.error(f"✗ {ticker}: Rate limit exceeded")
                raise
            elif e.response.status_code == 404:
                logger.error(f"✗ {ticker}: Not found")
                return []
            else:
                logger.error(f"✗ {ticker}: HTTP error {e.response.status_code}")
                raise

        except Exception as e:
            self.stats['failed_requests'] += 1
            logger.error(f"✗ {ticker}: {str(e)}")
            raise

    def save_to_csv(
        self,
        ticker: str,
        data: List[IntegerOHLCV],
        filename: Optional[str] = None
    ) -> str:
        """
        Save OHLCV data to CSV file

        Args:
            ticker: Stock ticker symbol
            data: List of IntegerOHLCV records
            filename: Optional custom filename (defaults to {ticker}_daily.csv)

        Returns:
            str: Path to created CSV file
        """
        if not data:
            logger.warning(f"No data to save for {ticker}")
            return ""

        filename = filename or f"{ticker}_daily.csv"
        filepath = self.output_dir / filename

        # Write CSV with integer values
        with open(filepath, 'w', newline='') as f:
            writer = csv.DictWriter(
                f,
                fieldnames=['ticker', 'date', 'open', 'high', 'low', 'close', 'volume', 'adj_close']
            )
            writer.writeheader()

            for record in data:
                writer.writerow(record.to_dict())

        logger.info(f"Saved {len(data)} rows to {filepath}")
        return str(filepath)

    def fetch_multiple_tickers(
        self,
        tickers: List[str],
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        max_retries: int = 3,
        save_individual: bool = True
    ) -> Dict[str, List[IntegerOHLCV]]:
        """
        Fetch data for multiple tickers with retry logic

        Args:
            tickers: List of ticker symbols
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            max_retries: Maximum retry attempts per ticker
            save_individual: Save individual CSV files per ticker

        Returns:
            Dict mapping ticker to list of OHLCV records
        """
        results = {}

        for i, ticker in enumerate(tickers, 1):
            logger.info(f"[{i}/{len(tickers)}] Processing {ticker}")

            retries = 0
            while retries <= max_retries:
                try:
                    data = self.fetch_daily_prices(ticker, start_date, end_date)
                    results[ticker] = data

                    # Save individual CSV
                    if save_individual and data:
                        self.save_to_csv(ticker, data)

                    self.stats['tickers_completed'].append(ticker)
                    break

                except Exception as e:
                    retries += 1
                    if retries > max_retries:
                        logger.error(f"Failed {ticker} after {max_retries} retries: {e}")
                        results[ticker] = []
                        break
                    else:
                        wait = min(60, 2 ** retries)  # Exponential backoff
                        logger.warning(f"Retry {retries}/{max_retries} for {ticker} in {wait}s")
                        time.sleep(wait)

            # Small delay between tickers
            if i < len(tickers):
                time.sleep(0.5)

        return results

    def fetch_top_100_tickers(
        self,
        ticker_file: str = "/home/user/agentic-flow/trading-system/data/top_100_tickers.json",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, List[IntegerOHLCV]]:
        """
        Fetch data for top 100 tickers from ticker list file

        Args:
            ticker_file: Path to JSON file with ticker list
            start_date: Start date (YYYY-MM-DD), defaults to 2020-01-01
            end_date: End date (YYYY-MM-DD), defaults to today

        Returns:
            Dict mapping ticker to OHLCV data
        """
        # Load ticker list
        with open(ticker_file, 'r') as f:
            ticker_data = json.load(f)

        tickers = [t['ticker'] for t in ticker_data['tickers']]

        logger.info(f"Fetching {len(tickers)} tickers from {start_date or self.DEFAULT_START_DATE}")

        # Fetch all tickers
        results = self.fetch_multiple_tickers(tickers, start_date, end_date)

        # Print summary
        self.print_summary()

        return results

    def save_combined_csv(
        self,
        data: Dict[str, List[IntegerOHLCV]],
        filename: str = "all_tickers_combined.csv"
    ) -> str:
        """
        Save all tickers to a single combined CSV file

        Args:
            data: Dictionary mapping ticker to OHLCV records
            filename: Output filename

        Returns:
            str: Path to created file
        """
        filepath = self.output_dir / filename

        with open(filepath, 'w', newline='') as f:
            writer = csv.DictWriter(
                f,
                fieldnames=['ticker', 'date', 'open', 'high', 'low', 'close', 'volume', 'adj_close']
            )
            writer.writeheader()

            total_rows = 0
            for ticker, records in sorted(data.items()):
                for record in records:
                    writer.writerow(record.to_dict())
                    total_rows += 1

        logger.info(f"Saved {total_rows} total rows to {filepath}")
        return str(filepath)

    def print_summary(self) -> None:
        """Print fetching statistics summary"""
        print("\n" + "="*60)
        print("TIINGO DATA FETCH SUMMARY")
        print("="*60)
        print(f"Total API Requests:    {self.stats['total_requests']}")
        print(f"Successful:            {self.stats['successful_requests']}")
        print(f"Failed:                {self.stats['failed_requests']}")
        print(f"Tickers Completed:     {len(self.stats['tickers_completed'])}")
        print(f"Total Rows Fetched:    {self.stats['total_rows']}")
        print(f"Output Directory:      {self.output_dir}")
        print("="*60)

        if self.stats['failed_requests'] > 0:
            print("⚠️  Some requests failed. Check logs for details.")
        else:
            print("✅ All requests completed successfully!")
        print()

    def verify_data_quality(
        self,
        data: Dict[str, List[IntegerOHLCV]],
        min_rows: int = 100
    ) -> Dict[str, any]:
        """
        Verify data quality and completeness

        Args:
            data: Dictionary of ticker data
            min_rows: Minimum expected rows per ticker

        Returns:
            Dict with quality metrics
        """
        quality_report = {
            'total_tickers': len(data),
            'tickers_with_data': 0,
            'tickers_insufficient_data': [],
            'date_range': {},
            'all_integers': True
        }

        for ticker, records in data.items():
            if not records:
                quality_report['tickers_insufficient_data'].append(ticker)
                continue

            quality_report['tickers_with_data'] += 1

            if len(records) < min_rows:
                quality_report['tickers_insufficient_data'].append(ticker)

            # Verify all prices are integers
            for record in records[:10]:  # Sample first 10
                if not all(isinstance(getattr(record, field), int) for field in
                          ['open_price', 'high_price', 'low_price', 'close_price', 'volume', 'adj_close']):
                    quality_report['all_integers'] = False
                    break

            # Track date range
            dates = [r.date for r in records]
            quality_report['date_range'][ticker] = {
                'start': min(dates),
                'end': max(dates),
                'count': len(records)
            }

        return quality_report


def main():
    """
    Main execution function - fetch top 100 tickers with integer conversion
    """
    print("="*60)
    print("TIINGO INTEGER DATA FETCHER - Quantum Trading System")
    print("="*60)
    print(f"Price Multiplier: {PRICE_MULTIPLIER}x (all prices are integers)")
    print(f"Date Range: 2020-01-01 to present")
    print("="*60)
    print()

    # Initialize fetcher
    fetcher = TiingoDataFetcher()

    # Fetch top 100 tickers
    results = fetcher.fetch_top_100_tickers(
        start_date="2020-01-01",
        end_date=datetime.now().strftime('%Y-%m-%d')
    )

    # Save combined CSV
    fetcher.save_combined_csv(results)

    # Verify data quality
    quality_report = fetcher.verify_data_quality(results)

    print("\n" + "="*60)
    print("DATA QUALITY REPORT")
    print("="*60)
    print(f"Total Tickers:         {quality_report['total_tickers']}")
    print(f"With Data:             {quality_report['tickers_with_data']}")
    print(f"Insufficient Data:     {len(quality_report['tickers_insufficient_data'])}")
    print(f"All Integers:          {'✅ YES' if quality_report['all_integers'] else '❌ NO'}")
    print("="*60)

    if quality_report['tickers_insufficient_data']:
        print("\n⚠️  Tickers with insufficient data:")
        for ticker in quality_report['tickers_insufficient_data'][:10]:
            print(f"  - {ticker}")

    print("\n✅ Data acquisition complete!")


if __name__ == '__main__':
    main()

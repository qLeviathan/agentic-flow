"""
Tiingo API Integration Module for Trading System

Comprehensive API client for fetching market data, economic indicators,
and sector ETF data with rate limiting, caching, and AgentDB integration.

Author: Trading System Development Team
License: MIT
"""

import os
import time
import json
import logging
import requests
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Union, Any
from pathlib import Path
from functools import wraps
import hashlib
import subprocess
from dataclasses import dataclass, asdict
from threading import Lock
import csv


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/home/user/agentic-flow/trading-system/logs/api_integration.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


@dataclass
class RateLimitConfig:
    """Rate limiting configuration for Tiingo API"""
    max_requests_per_hour: int = 500
    max_requests_per_minute: int = 50


@dataclass
class CacheConfig:
    """Cache configuration"""
    cache_dir: str = '/home/user/agentic-flow/trading-system/data/cache'
    ttl_seconds: int = 86400  # 24 hours default
    use_agentdb: bool = True


class TokenBucket:
    """Token bucket algorithm for rate limiting"""

    def __init__(self, rate: int, capacity: int):
        """
        Initialize token bucket

        Args:
            rate: Tokens added per second
            capacity: Maximum token capacity
        """
        self.rate = rate
        self.capacity = capacity
        self.tokens = capacity
        self.last_update = time.time()
        self.lock = Lock()

    def consume(self, tokens: int = 1) -> bool:
        """
        Attempt to consume tokens

        Args:
            tokens: Number of tokens to consume

        Returns:
            bool: True if tokens consumed, False otherwise
        """
        with self.lock:
            now = time.time()
            elapsed = now - self.last_update
            self.tokens = min(self.capacity, self.tokens + elapsed * self.rate)
            self.last_update = now

            if self.tokens >= tokens:
                self.tokens -= tokens
                return True
            return False

    def wait_time(self, tokens: int = 1) -> float:
        """Calculate wait time for tokens"""
        with self.lock:
            if self.tokens >= tokens:
                return 0.0
            return (tokens - self.tokens) / self.rate


class TiingoAPIError(Exception):
    """Custom exception for Tiingo API errors"""
    pass


class RateLimitExceeded(TiingoAPIError):
    """Exception raised when rate limit is exceeded"""
    pass


class TiingoAPIClient:
    """
    Comprehensive Tiingo API client with rate limiting, caching, and AgentDB integration
    """

    BASE_URL = "https://api.tiingo.com"
    SECTOR_ETFS = [
        "SPY",   # S&P 500
        "XLK",   # Technology
        "XLV",   # Healthcare
        "XLF",   # Financials
        "XLE",   # Energy
        "XLY",   # Consumer Discretionary
        "XLP",   # Consumer Staples
        "XLI",   # Industrials
        "XLB",   # Materials
        "XLRE",  # Real Estate
        "XLU",   # Utilities
        "XLC"    # Communication Services
    ]

    def __init__(
        self,
        api_token: Optional[str] = None,
        rate_limit_config: Optional[RateLimitConfig] = None,
        cache_config: Optional[CacheConfig] = None
    ):
        """
        Initialize Tiingo API client

        Args:
            api_token: Tiingo API token (defaults to TIINGO_API_TOKEN env var)
            rate_limit_config: Rate limiting configuration
            cache_config: Cache configuration
        """
        self.api_token = api_token or os.getenv('TIINGO_API_TOKEN')
        if not self.api_token:
            raise ValueError(
                "Tiingo API token required. Set TIINGO_API_TOKEN environment variable "
                "or pass api_token parameter. Visit https://api.tiingo.com to get a free trial key."
            )

        self.rate_limit_config = rate_limit_config or RateLimitConfig()
        self.cache_config = cache_config or CacheConfig()

        # Initialize rate limiters
        # Free tier: 500 requests/hour = ~8.33 requests/minute = ~0.139 requests/second
        self.hourly_limiter = TokenBucket(
            rate=self.rate_limit_config.max_requests_per_hour / 3600,
            capacity=self.rate_limit_config.max_requests_per_hour
        )
        self.minute_limiter = TokenBucket(
            rate=self.rate_limit_config.max_requests_per_minute / 60,
            capacity=self.rate_limit_config.max_requests_per_minute
        )

        # Setup cache directory
        Path(self.cache_config.cache_dir).mkdir(parents=True, exist_ok=True)

        # Headers for API requests
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Token {self.api_token}'
        }

        logger.info("TiingoAPIClient initialized successfully")

    def _rate_limit(func):
        """Decorator for rate limiting API calls"""
        @wraps(func)
        def wrapper(self, *args, **kwargs):
            # Wait for both limiters
            max_wait = max(
                self.hourly_limiter.wait_time(),
                self.minute_limiter.wait_time()
            )

            if max_wait > 0:
                logger.warning(f"Rate limit reached. Waiting {max_wait:.2f} seconds...")
                time.sleep(max_wait)

            # Consume tokens
            if not (self.hourly_limiter.consume() and self.minute_limiter.consume()):
                raise RateLimitExceeded("Rate limit exceeded. Please try again later.")

            return func(self, *args, **kwargs)
        return wrapper

    def _get_cache_key(self, endpoint: str, params: Dict) -> str:
        """Generate cache key from endpoint and parameters"""
        cache_string = f"{endpoint}:{json.dumps(params, sort_keys=True)}"
        return hashlib.md5(cache_string.encode()).hexdigest()

    def _get_from_cache(self, cache_key: str) -> Optional[Dict]:
        """Retrieve data from cache"""
        if self.cache_config.use_agentdb:
            try:
                result = subprocess.run(
                    ['npx', 'agentdb', 'reflexion', 'retrieve', '--key', f'tiingo:{cache_key}'],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                if result.returncode == 0 and result.stdout.strip():
                    data = json.loads(result.stdout)
                    # Check TTL
                    if time.time() - data.get('timestamp', 0) < self.cache_config.ttl_seconds:
                        logger.info(f"Cache hit (AgentDB): {cache_key}")
                        return data.get('value')
            except Exception as e:
                logger.warning(f"AgentDB cache retrieval failed: {e}")

        # Fallback to file cache
        cache_file = Path(self.cache_config.cache_dir) / f"{cache_key}.json"
        if cache_file.exists():
            try:
                with open(cache_file, 'r') as f:
                    data = json.load(f)
                    if time.time() - data.get('timestamp', 0) < self.cache_config.ttl_seconds:
                        logger.info(f"Cache hit (file): {cache_key}")
                        return data.get('value')
            except Exception as e:
                logger.warning(f"File cache retrieval failed: {e}")

        return None

    def _save_to_cache(self, cache_key: str, data: Any) -> None:
        """Save data to cache"""
        cache_data = {
            'timestamp': time.time(),
            'value': data
        }

        # Save to AgentDB
        if self.cache_config.use_agentdb:
            try:
                subprocess.run(
                    ['npx', 'agentdb', 'reflexion', 'store',
                     '--key', f'tiingo:{cache_key}',
                     '--value', json.dumps(cache_data)],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                logger.debug(f"Saved to AgentDB cache: {cache_key}")
            except Exception as e:
                logger.warning(f"AgentDB cache save failed: {e}")

        # Save to file cache
        cache_file = Path(self.cache_config.cache_dir) / f"{cache_key}.json"
        try:
            with open(cache_file, 'w') as f:
                json.dump(cache_data, f)
            logger.debug(f"Saved to file cache: {cache_key}")
        except Exception as e:
            logger.warning(f"File cache save failed: {e}")

    @_rate_limit
    def _make_request(
        self,
        endpoint: str,
        params: Optional[Dict] = None,
        use_cache: bool = True
    ) -> Dict:
        """
        Make API request with caching and error handling

        Args:
            endpoint: API endpoint
            params: Query parameters
            use_cache: Whether to use caching

        Returns:
            Dict: API response data
        """
        params = params or {}
        cache_key = self._get_cache_key(endpoint, params)

        # Check cache
        if use_cache:
            cached_data = self._get_from_cache(cache_key)
            if cached_data is not None:
                return cached_data

        # Make API request
        url = f"{self.BASE_URL}{endpoint}"

        try:
            logger.info(f"Making API request: {endpoint}")
            response = requests.get(url, headers=self.headers, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()

            # Save to cache
            if use_cache:
                self._save_to_cache(cache_key, data)

            # Store successful pattern in AgentDB
            try:
                subprocess.run(
                    ['npx', 'agentdb', 'skill', 'create',
                     '--name', f'tiingo_fetch_{endpoint.replace("/", "_")}',
                     '--description', f'Successfully fetched data from {endpoint}',
                     '--pattern', json.dumps({'endpoint': endpoint, 'params': params})],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
            except Exception as e:
                logger.debug(f"Failed to store pattern: {e}")

            return data

        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:
                raise RateLimitExceeded("API rate limit exceeded")
            elif e.response.status_code == 401:
                raise TiingoAPIError("Invalid API token")
            elif e.response.status_code == 404:
                raise TiingoAPIError(f"Endpoint not found: {endpoint}")
            else:
                raise TiingoAPIError(f"HTTP error: {e}")
        except requests.exceptions.Timeout:
            raise TiingoAPIError("Request timeout")
        except requests.exceptions.RequestException as e:
            raise TiingoAPIError(f"Request failed: {e}")
        except json.JSONDecodeError:
            raise TiingoAPIError("Invalid JSON response")

    def get_ticker_metadata(self, ticker: str) -> Dict:
        """
        Get metadata for a ticker

        Args:
            ticker: Stock ticker symbol

        Returns:
            Dict: Ticker metadata
        """
        endpoint = f"/tiingo/daily/{ticker}"
        return self._make_request(endpoint)

    def get_daily_prices(
        self,
        ticker: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Get daily price data for a ticker

        Args:
            ticker: Stock ticker symbol
            start_date: Start date (YYYY-MM-DD format)
            end_date: End date (YYYY-MM-DD format)

        Returns:
            pd.DataFrame: Daily price data
        """
        endpoint = f"/tiingo/daily/{ticker}/prices"
        params = {}

        if start_date:
            params['startDate'] = start_date
        if end_date:
            params['endDate'] = end_date

        data = self._make_request(endpoint, params)

        df = pd.DataFrame(data)
        if not df.empty:
            df['date'] = pd.to_datetime(df['date'])
            df.set_index('date', inplace=True)

        return df

    def get_sector_etf_data(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, pd.DataFrame]:
        """
        Get data for all sector ETFs

        Args:
            start_date: Start date (YYYY-MM-DD format)
            end_date: End date (YYYY-MM-DD format)

        Returns:
            Dict[str, pd.DataFrame]: Dictionary mapping ticker to price data
        """
        sector_data = {}

        for ticker in self.SECTOR_ETFS:
            try:
                logger.info(f"Fetching sector ETF data: {ticker}")
                df = self.get_daily_prices(ticker, start_date, end_date)
                sector_data[ticker] = df

                # Small delay to respect rate limits
                time.sleep(0.1)

            except Exception as e:
                logger.error(f"Failed to fetch {ticker}: {e}")

        return sector_data

    def get_economic_indicator(
        self,
        indicator: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> pd.DataFrame:
        """
        Get economic indicator data

        Note: Economic indicators may require a paid Tiingo subscription.

        Args:
            indicator: Indicator symbol (e.g., 'GDP', 'CPI', 'UNRATE')
            start_date: Start date (YYYY-MM-DD format)
            end_date: End date (YYYY-MM-DD format)

        Returns:
            pd.DataFrame: Economic indicator data
        """
        endpoint = f"/tiingo/fundamentals/definitions"

        # Note: This is a placeholder. Actual economic indicators endpoint
        # may vary based on Tiingo subscription level
        logger.warning(
            "Economic indicators may require a paid Tiingo subscription. "
            "Check Tiingo API documentation for available indicators."
        )

        params = {
            'ticker': indicator
        }

        if start_date:
            params['startDate'] = start_date
        if end_date:
            params['endDate'] = end_date

        try:
            data = self._make_request(endpoint, params)
            df = pd.DataFrame(data)
            return df
        except Exception as e:
            logger.error(f"Failed to fetch economic indicator {indicator}: {e}")
            return pd.DataFrame()

    def batch_download_tickers(
        self,
        tickers: List[str],
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        max_retries: int = 3,
        retry_delay: int = 5
    ) -> Dict[str, Union[pd.DataFrame, Exception]]:
        """
        Download data for multiple tickers with error handling and retry logic

        Args:
            tickers: List of ticker symbols
            start_date: Start date (YYYY-MM-DD format)
            end_date: End date (YYYY-MM-DD format)
            max_retries: Maximum number of retries per ticker
            retry_delay: Delay between retries in seconds

        Returns:
            Dict: Dictionary mapping ticker to DataFrame or Exception
        """
        results = {}

        for ticker in tickers:
            retries = 0
            while retries <= max_retries:
                try:
                    logger.info(f"Downloading {ticker} (attempt {retries + 1}/{max_retries + 1})")
                    df = self.get_daily_prices(ticker, start_date, end_date)
                    results[ticker] = df

                    # Store correlation edge in AgentDB
                    try:
                        subprocess.run(
                            ['npx', 'agentdb', 'causal', 'add-edge',
                             '--from', ticker,
                             '--to', 'market_data',
                             '--weight', '1.0'],
                            capture_output=True,
                            text=True,
                            timeout=10
                        )
                    except Exception:
                        pass

                    break

                except Exception as e:
                    retries += 1
                    if retries > max_retries:
                        logger.error(f"Failed to download {ticker} after {max_retries} retries: {e}")
                        results[ticker] = e
                    else:
                        logger.warning(f"Retry {retries} for {ticker} in {retry_delay}s...")
                        time.sleep(retry_delay)

            # Small delay between tickers
            time.sleep(0.2)

        return results

    def export_to_csv(
        self,
        data: Union[pd.DataFrame, Dict[str, pd.DataFrame]],
        output_dir: str = '/home/user/agentic-flow/trading-system/data/exports',
        prefix: str = 'tiingo_data'
    ) -> List[str]:
        """
        Export data to CSV files

        Args:
            data: DataFrame or dictionary of DataFrames
            output_dir: Output directory path
            prefix: File name prefix

        Returns:
            List[str]: List of created file paths
        """
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        created_files = []
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        if isinstance(data, pd.DataFrame):
            filename = f"{prefix}_{timestamp}.csv"
            filepath = os.path.join(output_dir, filename)
            data.to_csv(filepath)
            created_files.append(filepath)
            logger.info(f"Exported to CSV: {filepath}")

        elif isinstance(data, dict):
            for ticker, df in data.items():
                if isinstance(df, pd.DataFrame) and not df.empty:
                    filename = f"{prefix}_{ticker}_{timestamp}.csv"
                    filepath = os.path.join(output_dir, filename)
                    df.to_csv(filepath)
                    created_files.append(filepath)
                    logger.info(f"Exported to CSV: {filepath}")

        return created_files

    def export_to_json(
        self,
        data: Union[pd.DataFrame, Dict[str, pd.DataFrame]],
        output_dir: str = '/home/user/agentic-flow/trading-system/data/exports',
        prefix: str = 'tiingo_data'
    ) -> List[str]:
        """
        Export data to JSON files

        Args:
            data: DataFrame or dictionary of DataFrames
            output_dir: Output directory path
            prefix: File name prefix

        Returns:
            List[str]: List of created file paths
        """
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        created_files = []
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

        if isinstance(data, pd.DataFrame):
            filename = f"{prefix}_{timestamp}.json"
            filepath = os.path.join(output_dir, filename)
            data.to_json(filepath, orient='records', date_format='iso')
            created_files.append(filepath)
            logger.info(f"Exported to JSON: {filepath}")

        elif isinstance(data, dict):
            for ticker, df in data.items():
                if isinstance(df, pd.DataFrame) and not df.empty:
                    filename = f"{prefix}_{ticker}_{timestamp}.json"
                    filepath = os.path.join(output_dir, filename)
                    df.to_json(filepath, orient='records', date_format='iso')
                    created_files.append(filepath)
                    logger.info(f"Exported to JSON: {filepath}")

        return created_files

    def get_all_tickers(self) -> List[str]:
        """
        Get list of all supported tickers

        Note: This returns a sample list. For comprehensive ticker lists,
        consider using a dedicated data source or the Tiingo supported tickers endpoint.

        Returns:
            List[str]: List of ticker symbols
        """
        # This would typically come from an API endpoint or database
        # For now, return sector ETFs and common stocks
        common_stocks = [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM',
            'V', 'WMT', 'JNJ', 'PG', 'MA', 'HD', 'DIS', 'BAC', 'ADBE', 'CRM',
            'NFLX', 'CMCSA', 'PEP', 'KO', 'CSCO', 'INTC', 'VZ', 'T', 'PFE',
            'ABT', 'TMO', 'CVX', 'XOM', 'MRK', 'ABBV', 'NKE', 'COST', 'AVGO'
        ]

        return self.SECTOR_ETFS + common_stocks

    def clear_cache(self) -> None:
        """Clear all cached data"""
        cache_dir = Path(self.cache_config.cache_dir)
        if cache_dir.exists():
            for cache_file in cache_dir.glob('*.json'):
                cache_file.unlink()
            logger.info("Cache cleared successfully")

    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        cache_dir = Path(self.cache_config.cache_dir)
        cache_files = list(cache_dir.glob('*.json'))

        total_size = sum(f.stat().st_size for f in cache_files)

        return {
            'total_files': len(cache_files),
            'total_size_mb': total_size / (1024 * 1024),
            'cache_dir': str(cache_dir)
        }


# Example usage functions
def example_basic_usage():
    """Example: Basic API usage"""
    client = TiingoAPIClient()

    # Get daily prices for a single ticker
    df = client.get_daily_prices('AAPL', start_date='2024-01-01', end_date='2024-12-31')
    print(f"AAPL data shape: {df.shape}")
    print(df.head())

    # Export to CSV
    client.export_to_csv(df, prefix='aapl_prices')


def example_sector_etfs():
    """Example: Fetch all sector ETF data"""
    client = TiingoAPIClient()

    # Get sector ETF data for the last 90 days
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')

    sector_data = client.get_sector_etf_data(start_date, end_date)

    # Export all to CSV
    client.export_to_csv(sector_data, prefix='sector_etfs')

    print(f"Downloaded {len(sector_data)} sector ETFs")


def example_batch_download():
    """Example: Batch download multiple tickers"""
    client = TiingoAPIClient()

    tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA']
    results = client.batch_download_tickers(
        tickers,
        start_date='2024-01-01',
        end_date='2024-12-31'
    )

    # Check results
    for ticker, result in results.items():
        if isinstance(result, pd.DataFrame):
            print(f"{ticker}: {len(result)} rows")
        else:
            print(f"{ticker}: Error - {result}")

    # Export successful results
    successful = {k: v for k, v in results.items() if isinstance(v, pd.DataFrame)}
    client.export_to_json(successful, prefix='batch_download')


if __name__ == '__main__':
    # Run examples
    print("=== Basic Usage Example ===")
    try:
        example_basic_usage()
    except Exception as e:
        print(f"Error: {e}")

    print("\n=== Sector ETFs Example ===")
    try:
        example_sector_etfs()
    except Exception as e:
        print(f"Error: {e}")

    print("\n=== Batch Download Example ===")
    try:
        example_batch_download()
    except Exception as e:
        print(f"Error: {e}")

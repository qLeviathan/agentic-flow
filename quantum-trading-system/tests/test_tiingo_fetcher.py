"""
Comprehensive tests for TiingoDataFetcher

Tests cover:
- Integer conversion accuracy
- API integration
- Rate limiting
- Data quality validation
- CSV export functionality
- Error handling

Author: Tiingo API Specialist Agent
Date: 2025-11-24
"""

import pytest
import os
import json
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta

# Add src to path for imports
import sys
sys.path.insert(0, '/home/user/agentic-flow/quantum-trading-system/src')

from data.tiingo_fetcher import (
    TiingoDataFetcher,
    IntegerOHLCV,
    RateLimiter,
    PRICE_MULTIPLIER
)


class TestIntegerOHLCV:
    """Test IntegerOHLCV data structure"""

    def test_from_tiingo_response_conversion(self):
        """Test conversion from Tiingo API response to integer OHLCV"""
        tiingo_data = {
            'date': '2024-11-24T00:00:00+00:00',
            'open': 150.25,
            'high': 152.75,
            'low': 149.50,
            'close': 151.80,
            'volume': 1000000,
            'adjClose': 151.80
        }

        ohlcv = IntegerOHLCV.from_tiingo_response('AAPL', tiingo_data)

        assert ohlcv.ticker == 'AAPL'
        assert ohlcv.date == '2024-11-24'
        assert ohlcv.open_price == 1502500  # 150.25 * 10000
        assert ohlcv.high_price == 1527500  # 152.75 * 10000
        assert ohlcv.low_price == 1495000   # 149.50 * 10000
        assert ohlcv.close_price == 1518000 # 151.80 * 10000
        assert ohlcv.volume == 1000000
        assert ohlcv.adj_close == 1518000

    def test_all_fields_are_integers(self):
        """Verify all price fields are integers, not floats"""
        tiingo_data = {
            'date': '2024-11-24T00:00:00+00:00',
            'open': 100.123456,
            'high': 101.987654,
            'low': 99.111111,
            'close': 100.555555,
            'volume': 5000000,
            'adjClose': 100.555555
        }

        ohlcv = IntegerOHLCV.from_tiingo_response('TEST', tiingo_data)

        # Verify all price fields are integers
        assert isinstance(ohlcv.open_price, int)
        assert isinstance(ohlcv.high_price, int)
        assert isinstance(ohlcv.low_price, int)
        assert isinstance(ohlcv.close_price, int)
        assert isinstance(ohlcv.volume, int)
        assert isinstance(ohlcv.adj_close, int)

        # Verify no floats in the entire structure
        for value in [ohlcv.open_price, ohlcv.high_price, ohlcv.low_price,
                     ohlcv.close_price, ohlcv.volume, ohlcv.adj_close]:
            assert not isinstance(value, float), f"Found float: {value}"

    def test_to_dict_conversion(self):
        """Test conversion to dictionary for CSV export"""
        ohlcv = IntegerOHLCV(
            ticker='AAPL',
            date='2024-11-24',
            open_price=1500000,
            high_price=1520000,
            low_price=1490000,
            close_price=1510000,
            volume=1000000,
            adj_close=1510000
        )

        result = ohlcv.to_dict()

        assert result['ticker'] == 'AAPL'
        assert result['date'] == '2024-11-24'
        assert result['open'] == 1500000
        assert result['high'] == 1520000
        assert result['low'] == 1490000
        assert result['close'] == 1510000
        assert result['volume'] == 1000000
        assert result['adj_close'] == 1510000

    def test_precision_rounding(self):
        """Test that rounding preserves precision correctly"""
        tiingo_data = {
            'date': '2024-11-24T00:00:00+00:00',
            'open': 100.99999,   # Should round to 1010000
            'high': 100.00001,   # Should round to 1000000
            'low': 100.00005,    # Should round to 1000001
            'close': 100.00004,  # Should round to 1000000
            'volume': 1000000,
            'adjClose': 100.00006  # Should round to 1000001
        }

        ohlcv = IntegerOHLCV.from_tiingo_response('TEST', tiingo_data)

        assert ohlcv.open_price == 1010000
        assert ohlcv.high_price == 1000000
        assert ohlcv.low_price == 1000001
        assert ohlcv.close_price == 1000000
        assert ohlcv.adj_close == 1000001


class TestRateLimiter:
    """Test rate limiting functionality"""

    def test_initialization(self):
        """Test rate limiter initialization"""
        limiter = RateLimiter(requests_per_hour=500)
        assert limiter.capacity == 500
        assert limiter.tokens == 500
        assert limiter.rate == 500 / 3600

    def test_acquire_with_available_tokens(self):
        """Test acquiring token when available"""
        limiter = RateLimiter(requests_per_hour=500)
        wait_time = limiter.acquire()

        assert wait_time == 0.0
        assert limiter.tokens < limiter.capacity

    def test_acquire_without_available_tokens(self):
        """Test acquiring token when none available"""
        limiter = RateLimiter(requests_per_hour=500)
        limiter.tokens = 0

        wait_time = limiter.acquire()
        assert wait_time > 0

    def test_token_refill_over_time(self):
        """Test that tokens refill over time"""
        import time

        limiter = RateLimiter(requests_per_hour=3600)  # 1 per second
        limiter.tokens = 0

        time.sleep(2.1)  # Wait for 2 tokens to refill

        wait_time = limiter.acquire()
        assert wait_time == 0.0  # Should have refilled


class TestTiingoDataFetcher:
    """Test TiingoDataFetcher functionality"""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for test outputs"""
        with tempfile.TemporaryDirectory() as tmpdir:
            yield tmpdir

    @pytest.fixture
    def mock_api_response(self):
        """Mock Tiingo API response"""
        return [
            {
                'date': '2024-11-20T00:00:00+00:00',
                'open': 150.00,
                'high': 152.00,
                'low': 149.00,
                'close': 151.00,
                'volume': 1000000,
                'adjClose': 151.00
            },
            {
                'date': '2024-11-21T00:00:00+00:00',
                'open': 151.00,
                'high': 153.00,
                'low': 150.00,
                'close': 152.00,
                'volume': 1100000,
                'adjClose': 152.00
            }
        ]

    def test_initialization_with_api_token(self, temp_dir):
        """Test fetcher initialization with API token"""
        fetcher = TiingoDataFetcher(
            api_token='test_token_12345',
            output_dir=temp_dir
        )

        assert fetcher.api_token == 'test_token_12345'
        assert fetcher.output_dir == Path(temp_dir)
        assert fetcher.headers['Authorization'] == 'Token test_token_12345'

    def test_initialization_without_api_token(self):
        """Test that initialization fails without API token"""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ValueError, match="Tiingo API token required"):
                TiingoDataFetcher()

    def test_initialization_with_env_variable(self, temp_dir):
        """Test initialization using environment variable"""
        with patch.dict(os.environ, {'TIINGO_API_TOKEN': 'env_token_123'}):
            fetcher = TiingoDataFetcher(output_dir=temp_dir)
            assert fetcher.api_token == 'env_token_123'

    @patch('requests.get')
    def test_fetch_daily_prices_success(self, mock_get, temp_dir, mock_api_response):
        """Test successful data fetching"""
        # Setup mock
        mock_response = Mock()
        mock_response.json.return_value = mock_api_response
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        # Fetch data
        fetcher = TiingoDataFetcher(api_token='test_token', output_dir=temp_dir)
        results = fetcher.fetch_daily_prices('AAPL', '2024-11-20', '2024-11-21')

        # Verify
        assert len(results) == 2
        assert all(isinstance(r, IntegerOHLCV) for r in results)
        assert results[0].ticker == 'AAPL'
        assert results[0].open_price == 1500000  # 150.00 * 10000
        assert fetcher.stats['successful_requests'] == 1

    @patch('requests.get')
    def test_fetch_daily_prices_rate_limit_error(self, mock_get, temp_dir):
        """Test handling of rate limit errors"""
        # Setup mock to return 429 error
        mock_response = Mock()
        mock_response.status_code = 429
        mock_response.raise_for_status.side_effect = Exception("429 Rate Limit")
        mock_get.return_value = mock_response

        fetcher = TiingoDataFetcher(api_token='test_token', output_dir=temp_dir)

        with pytest.raises(Exception):
            fetcher.fetch_daily_prices('AAPL')

        assert fetcher.stats['failed_requests'] == 1

    @patch('requests.get')
    def test_fetch_daily_prices_ticker_not_found(self, mock_get, temp_dir):
        """Test handling of 404 ticker not found"""
        # Setup mock
        mock_response = Mock()
        mock_response.status_code = 404
        mock_response.raise_for_status.side_effect = Exception("404 Not Found")
        mock_get.return_value = mock_response

        fetcher = TiingoDataFetcher(api_token='test_token', output_dir=temp_dir)
        results = fetcher.fetch_daily_prices('INVALID')

        assert results == []
        assert fetcher.stats['failed_requests'] == 1

    def test_save_to_csv(self, temp_dir):
        """Test CSV export functionality"""
        fetcher = TiingoDataFetcher(api_token='test_token', output_dir=temp_dir)

        # Create test data
        test_data = [
            IntegerOHLCV(
                ticker='AAPL',
                date='2024-11-20',
                open_price=1500000,
                high_price=1520000,
                low_price=1490000,
                close_price=1510000,
                volume=1000000,
                adj_close=1510000
            )
        ]

        # Save to CSV
        filepath = fetcher.save_to_csv('AAPL', test_data)

        # Verify file exists
        assert os.path.exists(filepath)

        # Verify content
        import csv
        with open(filepath, 'r') as f:
            reader = csv.DictReader(f)
            rows = list(reader)

            assert len(rows) == 1
            assert rows[0]['ticker'] == 'AAPL'
            assert int(rows[0]['open']) == 1500000
            assert int(rows[0]['high']) == 1520000

    def test_save_to_csv_empty_data(self, temp_dir):
        """Test CSV export with empty data"""
        fetcher = TiingoDataFetcher(api_token='test_token', output_dir=temp_dir)
        filepath = fetcher.save_to_csv('AAPL', [])

        assert filepath == ""

    def test_verify_data_quality_all_pass(self):
        """Test data quality verification with good data"""
        # Create test data
        data = {
            'AAPL': [
                IntegerOHLCV('AAPL', f'2024-11-{i:02d}', 1500000, 1520000, 1490000, 1510000, 1000000, 1510000)
                for i in range(1, 21)
            ],
            'MSFT': [
                IntegerOHLCV('MSFT', f'2024-11-{i:02d}', 3500000, 3520000, 3490000, 3510000, 2000000, 3510000)
                for i in range(1, 21)
            ]
        }

        fetcher = TiingoDataFetcher(api_token='test_token')
        quality = fetcher.verify_data_quality(data, min_rows=10)

        assert quality['total_tickers'] == 2
        assert quality['tickers_with_data'] == 2
        assert len(quality['tickers_insufficient_data']) == 0
        assert quality['all_integers'] == True

    def test_verify_data_quality_insufficient_data(self):
        """Test data quality verification with insufficient data"""
        data = {
            'AAPL': [IntegerOHLCV('AAPL', '2024-11-20', 1500000, 1520000, 1490000, 1510000, 1000000, 1510000)],
            'MSFT': []
        }

        fetcher = TiingoDataFetcher(api_token='test_token')
        quality = fetcher.verify_data_quality(data, min_rows=100)

        assert quality['total_tickers'] == 2
        assert len(quality['tickers_insufficient_data']) == 2

    def test_statistics_tracking(self, temp_dir):
        """Test that statistics are tracked correctly"""
        fetcher = TiingoDataFetcher(api_token='test_token', output_dir=temp_dir)

        assert fetcher.stats['total_requests'] == 0
        assert fetcher.stats['successful_requests'] == 0
        assert fetcher.stats['failed_requests'] == 0
        assert fetcher.stats['total_rows'] == 0


class TestIntegration:
    """Integration tests (require actual API token)"""

    @pytest.mark.skipif(
        not os.getenv('TIINGO_API_TOKEN'),
        reason="Requires TIINGO_API_TOKEN environment variable"
    )
    def test_real_api_call(self):
        """Test actual API call (only runs if API token available)"""
        fetcher = TiingoDataFetcher()

        # Fetch just a few days of data for one ticker
        results = fetcher.fetch_daily_prices(
            'SPY',
            start_date='2024-11-01',
            end_date='2024-11-05'
        )

        assert len(results) > 0
        assert all(isinstance(r, IntegerOHLCV) for r in results)
        assert all(isinstance(r.open_price, int) for r in results)
        assert all(r.ticker == 'SPY' for r in results)


class TestPriceMultiplier:
    """Test price multiplier constant"""

    def test_price_multiplier_value(self):
        """Verify price multiplier is 10000"""
        assert PRICE_MULTIPLIER == 10000

    def test_conversion_precision(self):
        """Test that multiplier provides 4 decimal places precision"""
        # Test various prices
        test_prices = [0.0001, 0.9999, 100.5555, 1234.5678]

        for price in test_prices:
            integer_price = int(round(price * PRICE_MULTIPLIER))
            # Convert back
            recovered_price = integer_price / PRICE_MULTIPLIER

            # Should be within 0.0001 (4 decimal places)
            assert abs(recovered_price - price) < 0.0001


# Test coverage summary
def test_coverage_summary():
    """Summary of test coverage"""
    print("\n" + "="*60)
    print("TEST COVERAGE SUMMARY")
    print("="*60)
    print("✓ IntegerOHLCV data structure")
    print("✓ Integer conversion accuracy")
    print("✓ Price multiplier precision")
    print("✓ Rate limiting functionality")
    print("✓ API integration (mocked)")
    print("✓ Error handling (404, 429)")
    print("✓ CSV export functionality")
    print("✓ Data quality validation")
    print("✓ Statistics tracking")
    print("✓ Environment variable handling")
    print("="*60)
    print("Target Coverage: 90%+")
    print("="*60)


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])

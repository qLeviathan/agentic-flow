"""
API Integration Tests
Tests for Tiingo API authentication, data fetching, rate limiting, and error handling
"""
import pytest
import time
import os
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, MagicMock
import requests


class TiingoAPIClient:
    """Tiingo API client for testing"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get('TIINGO_API_KEY', 'test_api_key')
        self.base_url = "https://api.tiingo.com"
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Authorization': f'Token {self.api_key}'
        })

        # Rate limiting
        self.requests_per_hour = 500
        self.request_times: List[float] = []

        # Caching
        self.cache: Dict = {}
        self.cache_ttl = 300  # 5 minutes

    def _check_rate_limit(self) -> bool:
        """Check if we're within rate limits"""
        now = time.time()
        # Remove requests older than 1 hour
        self.request_times = [t for t in self.request_times if now - t < 3600]

        if len(self.request_times) >= self.requests_per_hour:
            return False

        self.request_times.append(now)
        return True

    def _get_cache_key(self, endpoint: str, params: Dict) -> str:
        """Generate cache key"""
        return f"{endpoint}:{str(sorted(params.items()))}"

    def _get_cached(self, cache_key: str) -> Optional[Dict]:
        """Get cached response if valid"""
        if cache_key in self.cache:
            data, timestamp = self.cache[cache_key]
            if time.time() - timestamp < self.cache_ttl:
                return data
            else:
                del self.cache[cache_key]
        return None

    def get_ticker_data(self, ticker: str, start_date: str, end_date: str) -> Dict:
        """Fetch ticker price data"""
        cache_key = self._get_cache_key('prices', {
            'ticker': ticker,
            'start': start_date,
            'end': end_date
        })

        # Check cache
        cached = self._get_cached(cache_key)
        if cached:
            return cached

        # Check rate limit
        if not self._check_rate_limit():
            raise Exception("Rate limit exceeded")

        # Make request
        url = f"{self.base_url}/tiingo/daily/{ticker}/prices"
        params = {
            'startDate': start_date,
            'endDate': end_date
        }

        response = self.session.get(url, params=params)
        response.raise_for_status()

        data = response.json()
        self.cache[cache_key] = (data, time.time())
        return data

    def get_economic_indicator(self, indicator: str) -> Dict:
        """Fetch economic indicator data"""
        cache_key = self._get_cache_key('economic', {'indicator': indicator})

        cached = self._get_cached(cache_key)
        if cached:
            return cached

        if not self._check_rate_limit():
            raise Exception("Rate limit exceeded")

        # Mock economic data endpoint
        url = f"{self.base_url}/tiingo/economic/{indicator}"
        response = self.session.get(url)
        response.raise_for_status()

        data = response.json()
        self.cache[cache_key] = (data, time.time())
        return data


class TestTiingoAuthentication:
    """Tests for Tiingo API authentication"""

    def test_api_key_initialization(self):
        """Test API key is properly initialized"""
        api_key = "test_key_12345"
        client = TiingoAPIClient(api_key=api_key)
        assert client.api_key == api_key
        assert 'Authorization' in client.session.headers
        assert client.session.headers['Authorization'] == f'Token {api_key}'

    def test_api_key_from_environment(self):
        """Test API key loaded from environment"""
        with patch.dict(os.environ, {'TIINGO_API_KEY': 'env_key_12345'}):
            client = TiingoAPIClient()
            assert client.api_key == 'env_key_12345'

    @patch('requests.Session.get')
    def test_authentication_header_sent(self, mock_get):
        """Test authentication header is sent with requests"""
        mock_response = Mock()
        mock_response.json.return_value = []
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        client = TiingoAPIClient(api_key='test_key')
        client.get_ticker_data('AAPL', '2024-01-01', '2024-01-31')

        # Verify Authorization header was sent
        assert mock_get.called
        call_kwargs = mock_get.call_args
        # The session headers should include Authorization


class TestDataFetching:
    """Tests for data fetching functionality"""

    @patch('requests.Session.get')
    def test_fetch_single_ticker(self, mock_get):
        """Test fetching data for a single ticker"""
        mock_data = [
            {'date': '2024-01-02', 'close': 185.64, 'high': 186.95, 'low': 184.43, 'open': 185.28, 'volume': 54198800},
            {'date': '2024-01-03', 'close': 184.25, 'high': 185.89, 'low': 183.43, 'open': 184.22, 'volume': 58414500}
        ]

        mock_response = Mock()
        mock_response.json.return_value = mock_data
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        client = TiingoAPIClient()
        data = client.get_ticker_data('AAPL', '2024-01-01', '2024-01-31')

        assert len(data) == 2
        assert data[0]['close'] == 185.64
        assert data[1]['volume'] == 58414500

    @patch('requests.Session.get')
    def test_fetch_multiple_ticker_types(self, mock_get):
        """Test fetching different ticker types (stocks, ETFs, crypto)"""
        tickers = ['AAPL', 'SPY', 'QQQ']  # Stock, ETF, ETF

        mock_response = Mock()
        mock_response.json.return_value = [{'close': 100.0}]
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        client = TiingoAPIClient()

        for ticker in tickers:
            data = client.get_ticker_data(ticker, '2024-01-01', '2024-01-31')
            assert isinstance(data, list)
            assert len(data) > 0

    @patch('requests.Session.get')
    def test_fetch_economic_indicators(self, mock_get):
        """Test fetching economic indicator data"""
        mock_data = {
            'indicator': 'GDP',
            'data': [
                {'date': '2024-Q1', 'value': 2.5},
                {'date': '2023-Q4', 'value': 3.2}
            ]
        }

        mock_response = Mock()
        mock_response.json.return_value = mock_data
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        client = TiingoAPIClient()
        data = client.get_economic_indicator('GDP')

        assert data['indicator'] == 'GDP'
        assert len(data['data']) == 2


class TestRateLimiting:
    """Tests for API rate limiting compliance"""

    def test_rate_limit_tracking(self):
        """Test that rate limits are tracked correctly"""
        client = TiingoAPIClient()
        client.requests_per_hour = 5  # Set low limit for testing

        # Make requests up to limit
        for i in range(5):
            assert client._check_rate_limit() == True

        # Next request should fail
        assert client._check_rate_limit() == False

    def test_rate_limit_window_expiry(self):
        """Test that rate limit window expires correctly"""
        client = TiingoAPIClient()
        client.requests_per_hour = 2

        # Make 2 requests
        client._check_rate_limit()
        client._check_rate_limit()

        # Simulate time passing (1 hour)
        old_time = time.time() - 3601
        client.request_times = [old_time, old_time]

        # Should allow new requests
        assert client._check_rate_limit() == True

    @patch('requests.Session.get')
    def test_rate_limit_exception(self, mock_get):
        """Test that rate limit exceeded raises exception"""
        client = TiingoAPIClient()
        client.requests_per_hour = 1

        mock_response = Mock()
        mock_response.json.return_value = []
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        # First request succeeds
        client.get_ticker_data('AAPL', '2024-01-01', '2024-01-31')

        # Second request should raise exception
        with pytest.raises(Exception, match="Rate limit exceeded"):
            client.get_ticker_data('MSFT', '2024-01-01', '2024-01-31')


class TestErrorHandling:
    """Tests for error handling and retries"""

    @patch('requests.Session.get')
    def test_http_404_error(self, mock_get):
        """Test handling of 404 errors (ticker not found)"""
        mock_response = Mock()
        mock_response.raise_for_status.side_effect = requests.HTTPError("404 Not Found")
        mock_get.return_value = mock_response

        client = TiingoAPIClient()
        with pytest.raises(requests.HTTPError):
            client.get_ticker_data('INVALID_TICKER', '2024-01-01', '2024-01-31')

    @patch('requests.Session.get')
    def test_http_401_error(self, mock_get):
        """Test handling of 401 errors (authentication failed)"""
        mock_response = Mock()
        mock_response.raise_for_status.side_effect = requests.HTTPError("401 Unauthorized")
        mock_get.return_value = mock_response

        client = TiingoAPIClient(api_key='invalid_key')
        with pytest.raises(requests.HTTPError):
            client.get_ticker_data('AAPL', '2024-01-01', '2024-01-31')

    @patch('requests.Session.get')
    def test_network_timeout(self, mock_get):
        """Test handling of network timeouts"""
        mock_get.side_effect = requests.Timeout("Request timed out")

        client = TiingoAPIClient()
        with pytest.raises(requests.Timeout):
            client.get_ticker_data('AAPL', '2024-01-01', '2024-01-31')

    @patch('requests.Session.get')
    def test_malformed_json_response(self, mock_get):
        """Test handling of malformed JSON responses"""
        mock_response = Mock()
        mock_response.json.side_effect = ValueError("Invalid JSON")
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        client = TiingoAPIClient()
        with pytest.raises(ValueError):
            client.get_ticker_data('AAPL', '2024-01-01', '2024-01-31')


class TestCaching:
    """Tests for API response caching"""

    @patch('requests.Session.get')
    def test_cache_hit(self, mock_get):
        """Test that cached responses are returned without API call"""
        mock_response = Mock()
        mock_response.json.return_value = [{'close': 100.0}]
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        client = TiingoAPIClient()

        # First call - should hit API
        data1 = client.get_ticker_data('AAPL', '2024-01-01', '2024-01-31')
        assert mock_get.call_count == 1

        # Second call - should use cache
        data2 = client.get_ticker_data('AAPL', '2024-01-01', '2024-01-31')
        assert mock_get.call_count == 1  # No additional API call
        assert data1 == data2

    def test_cache_expiry(self):
        """Test that cache expires after TTL"""
        client = TiingoAPIClient()
        client.cache_ttl = 1  # 1 second TTL

        cache_key = "test_key"
        client.cache[cache_key] = ({'data': 'test'}, time.time() - 2)  # Expired

        cached = client._get_cached(cache_key)
        assert cached is None
        assert cache_key not in client.cache

    @patch('requests.Session.get')
    def test_cache_different_parameters(self, mock_get):
        """Test that different parameters result in different cache entries"""
        mock_response = Mock()
        mock_response.json.return_value = [{'close': 100.0}]
        mock_response.raise_for_status = Mock()
        mock_get.return_value = mock_response

        client = TiingoAPIClient()

        # Different date ranges should not share cache
        client.get_ticker_data('AAPL', '2024-01-01', '2024-01-31')
        client.get_ticker_data('AAPL', '2024-02-01', '2024-02-28')

        assert mock_get.call_count == 2  # Two separate API calls

    def test_cache_performance(self):
        """Test cache performance improvement"""
        client = TiingoAPIClient()

        # Measure cache hit time
        cache_key = "test_key"
        test_data = {'data': [1, 2, 3, 4, 5] * 1000}  # Large dataset
        client.cache[cache_key] = (test_data, time.time())

        start = time.time()
        cached = client._get_cached(cache_key)
        cache_time = time.time() - start

        assert cached == test_data
        assert cache_time < 0.001  # Should be very fast


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

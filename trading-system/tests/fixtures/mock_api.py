"""
Mock API responses for testing
"""
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json


class MockTiingoResponse:
    """Mock Tiingo API responses"""

    @staticmethod
    def mock_ticker_prices(ticker: str, start_date: str, end_date: str) -> List[Dict]:
        """
        Generate mock price data response

        Returns data in Tiingo API format
        """
        # Convert dates
        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')

        # Generate business days
        current = start
        data = []

        base_prices = {
            'AAPL': 185.0,
            'MSFT': 380.0,
            'GOOGL': 140.0,
            'AMZN': 155.0,
            'SPY': 450.0,
            'QQQ': 380.0,
            'TSLA': 250.0,
            'NVDA': 500.0,
            'META': 350.0,
            'NFLX': 450.0
        }

        base_price = base_prices.get(ticker, 100.0)
        current_price = base_price

        while current <= end:
            # Skip weekends
            if current.weekday() < 5:
                # Small random walk
                import random
                change = random.uniform(-0.02, 0.02)
                current_price = current_price * (1 + change)

                data.append({
                    'date': current.strftime('%Y-%m-%d'),
                    'close': round(current_price, 2),
                    'high': round(current_price * 1.01, 2),
                    'low': round(current_price * 0.99, 2),
                    'open': round(current_price * 1.001, 2),
                    'volume': random.randint(50_000_000, 150_000_000),
                    'adjClose': round(current_price, 2),
                    'adjHigh': round(current_price * 1.01, 2),
                    'adjLow': round(current_price * 0.99, 2),
                    'adjOpen': round(current_price * 1.001, 2),
                    'adjVolume': random.randint(50_000_000, 150_000_000),
                    'divCash': 0.0,
                    'splitFactor': 1.0
                })

            current += timedelta(days=1)

        return data

    @staticmethod
    def mock_ticker_metadata(ticker: str) -> Dict:
        """Generate mock ticker metadata"""
        metadata = {
            'AAPL': {
                'ticker': 'AAPL',
                'name': 'Apple Inc',
                'exchangeCode': 'NASDAQ',
                'startDate': '1980-12-12',
                'endDate': datetime.now().strftime('%Y-%m-%d'),
                'description': 'Apple Inc designs, manufactures, and markets smartphones'
            },
            'SPY': {
                'ticker': 'SPY',
                'name': 'SPDR S&P 500 ETF Trust',
                'exchangeCode': 'NYSE',
                'startDate': '1993-01-29',
                'endDate': datetime.now().strftime('%Y-%m-%d'),
                'description': 'Seeks to track the S&P 500 index'
            }
        }

        return metadata.get(ticker, {
            'ticker': ticker,
            'name': f'{ticker} Corporation',
            'exchangeCode': 'NASDAQ',
            'startDate': '2000-01-01',
            'endDate': datetime.now().strftime('%Y-%m-%d'),
            'description': f'Mock data for {ticker}'
        })

    @staticmethod
    def mock_economic_indicator(indicator: str) -> Dict:
        """Generate mock economic indicator data"""
        indicators = {
            'GDP': {
                'indicator': 'GDP',
                'name': 'Gross Domestic Product',
                'data': [
                    {'date': '2024-Q1', 'value': 2.5},
                    {'date': '2023-Q4', 'value': 3.2},
                    {'date': '2023-Q3', 'value': 4.9},
                    {'date': '2023-Q2', 'value': 2.1}
                ]
            },
            'CPI': {
                'indicator': 'CPI',
                'name': 'Consumer Price Index',
                'data': [
                    {'date': '2024-01', 'value': 3.1},
                    {'date': '2023-12', 'value': 3.4},
                    {'date': '2023-11', 'value': 3.2},
                    {'date': '2023-10', 'value': 3.7}
                ]
            },
            'UNEMPLOYMENT': {
                'indicator': 'UNEMPLOYMENT',
                'name': 'Unemployment Rate',
                'data': [
                    {'date': '2024-01', 'value': 3.7},
                    {'date': '2023-12', 'value': 3.7},
                    {'date': '2023-11', 'value': 3.9},
                    {'date': '2023-10', 'value': 3.9}
                ]
            }
        }

        return indicators.get(indicator, {
            'indicator': indicator,
            'name': indicator,
            'data': []
        })

    @staticmethod
    def mock_error_response(error_code: int, message: str) -> Dict:
        """Generate mock error response"""
        errors = {
            400: {'error': 'Bad Request', 'message': message},
            401: {'error': 'Unauthorized', 'message': 'Invalid API key'},
            404: {'error': 'Not Found', 'message': f'Ticker not found: {message}'},
            429: {'error': 'Rate Limit Exceeded', 'message': 'Too many requests'},
            500: {'error': 'Internal Server Error', 'message': 'Server error occurred'}
        }

        return errors.get(error_code, {'error': 'Unknown Error', 'message': message})


class MockAgentDBResponse:
    """Mock AgentDB responses"""

    @staticmethod
    def mock_store_success() -> Dict:
        """Mock successful storage response"""
        return {
            'status': 'success',
            'message': 'Data stored successfully',
            'id': 'mock_id_12345',
            'timestamp': datetime.now().isoformat()
        }

    @staticmethod
    def mock_retrieve_reflexion(trajectory_id: str) -> Dict:
        """Mock reflexion retrieval"""
        return {
            'trajectory_id': trajectory_id,
            'action': 'fibonacci_entry',
            'observation': 'Price at 61.8% retracement',
            'verdict': 'success',
            'reason': 'Profitable trade',
            'timestamp': datetime.now().isoformat(),
            'context': {
                'from_state': 'analyzing',
                'to_state': 'in_position',
                'entry_price': 100.0,
                'exit_price': 105.0
            }
        }

    @staticmethod
    def mock_skill_consolidation() -> Dict:
        """Mock skill consolidation response"""
        return {
            'skill_id': 'skill_fibonacci_entry',
            'name': 'Fibonacci Entry Strategy',
            'description': 'Enter at 61.8% retracement level',
            'success_rate': 0.75,
            'usage_count': 0,
            'learned_from': ['traj_1', 'traj_2', 'traj_3'],
            'prerequisites': [],
            'timestamp': datetime.now().isoformat()
        }

    @staticmethod
    def mock_causal_edges() -> List[Dict]:
        """Mock causal edge discovery"""
        return [
            {
                'from_state': 'idle',
                'action': 'analyze',
                'to_state': 'analyzing',
                'probability': 0.95,
                'occurrences': 100
            },
            {
                'from_state': 'analyzing',
                'action': 'enter_long',
                'to_state': 'in_position',
                'probability': 0.60,
                'occurrences': 60
            },
            {
                'from_state': 'analyzing',
                'action': 'wait',
                'to_state': 'idle',
                'probability': 0.40,
                'occurrences': 40
            },
            {
                'from_state': 'in_position',
                'action': 'exit',
                'to_state': 'idle',
                'probability': 1.0,
                'occurrences': 60
            }
        ]


def create_mock_session():
    """Create a mock requests session for testing"""
    class MockSession:
        def __init__(self):
            self.headers = {}

        def get(self, url, params=None):
            """Mock GET request"""
            class MockResponse:
                def __init__(self, json_data, status_code=200):
                    self.json_data = json_data
                    self.status_code = status_code

                def json(self):
                    return self.json_data

                def raise_for_status(self):
                    if self.status_code >= 400:
                        import requests
                        raise requests.HTTPError(f"HTTP {self.status_code}")

            # Parse URL to determine response
            if 'prices' in url:
                ticker = url.split('/')[-2]
                data = MockTiingoResponse.mock_ticker_prices(
                    ticker,
                    params.get('startDate', '2024-01-01'),
                    params.get('endDate', '2024-01-31')
                )
                return MockResponse(data)
            elif 'meta' in url:
                ticker = url.split('/')[-1]
                data = MockTiingoResponse.mock_ticker_metadata(ticker)
                return MockResponse(data)
            else:
                return MockResponse({'error': 'Not found'}, 404)

        def post(self, url, json=None):
            """Mock POST request"""
            class MockResponse:
                def __init__(self, json_data, status_code=200):
                    self.json_data = json_data
                    self.status_code = status_code

                def json(self):
                    return self.json_data

                def raise_for_status(self):
                    if self.status_code >= 400:
                        import requests
                        raise requests.HTTPError(f"HTTP {self.status_code}")

            return MockResponse(MockAgentDBResponse.mock_store_success())

    return MockSession()

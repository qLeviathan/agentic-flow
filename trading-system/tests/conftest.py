"""
Pytest configuration and shared fixtures
"""
import pytest
import sys
import os
from pathlib import Path

# Add src directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))


@pytest.fixture(scope='session')
def test_config():
    """Test configuration fixture"""
    return {
        'api_key': 'test_api_key_12345',
        'base_url': 'https://api.tiingo.com',
        'initial_capital': 100000,
        'max_risk_per_trade': 0.02,
        'max_portfolio_risk': 0.06,
        'cache_ttl': 300
    }


@pytest.fixture(scope='function')
def mock_api_client(test_config):
    """Mock API client fixture"""
    from fixtures.mock_api import create_mock_session

    class MockAPIClient:
        def __init__(self, config):
            self.config = config
            self.session = create_mock_session()

    return MockAPIClient(test_config)


@pytest.fixture(scope='function')
def sample_price_data():
    """Sample price data fixture"""
    import pandas as pd
    import numpy as np

    dates = pd.date_range(start='2024-01-01', end='2024-01-31', freq='B')
    n = len(dates)

    return pd.DataFrame({
        'date': dates,
        'open': 100 + np.random.randn(n).cumsum(),
        'high': 102 + np.random.randn(n).cumsum(),
        'low': 98 + np.random.randn(n).cumsum(),
        'close': 100 + np.random.randn(n).cumsum(),
        'volume': np.random.randint(50_000_000, 150_000_000, n)
    })


@pytest.fixture(scope='function')
def fibonacci_sequence():
    """Fibonacci sequence fixture"""
    return [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610,
            987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025]


@pytest.fixture(scope='function')
def lucas_sequence():
    """Lucas sequence fixture"""
    return [2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123, 199, 322, 521, 843,
            1364, 2207, 3571, 5778, 9349, 15127, 24476, 39603, 64079]


@pytest.fixture(scope='session')
def top_liquid_tickers():
    """Top liquid tickers fixture"""
    return ['SPY', 'QQQ', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX']


@pytest.fixture(scope='function')
def market_crash_data():
    """Market crash scenario data fixture"""
    from fixtures.market_data import generate_crash_scenario
    return generate_crash_scenario()


@pytest.fixture(scope='function')
def bull_market_data():
    """Bull market scenario data fixture"""
    from fixtures.market_data import generate_trending_market
    return generate_trending_market('up', 252, 0.20)


@pytest.fixture(scope='function')
def bear_market_data():
    """Bear market scenario data fixture"""
    from fixtures.market_data import generate_trending_market
    return generate_trending_market('down', 252, -0.15)


@pytest.fixture(scope='function')
def sideways_market_data():
    """Sideways market scenario data fixture"""
    from fixtures.market_data import generate_sideways_market
    return generate_sideways_market(252, 0.08)


@pytest.fixture(autouse=True)
def reset_random_seed():
    """Reset random seed for reproducibility"""
    import numpy as np
    import random

    np.random.seed(42)
    random.seed(42)


@pytest.fixture(scope='function')
def temp_directory(tmp_path):
    """Temporary directory for test files"""
    return tmp_path


@pytest.fixture(scope='session')
def performance_thresholds():
    """Performance thresholds for testing"""
    return {
        'max_latency_ms': 100,
        'min_sharpe_ratio': 1.0,
        'max_drawdown': 0.20,
        'min_win_rate': 0.50,
        'min_profit_factor': 1.5
    }


def pytest_configure(config):
    """Pytest configuration hook"""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "e2e: marks tests as end-to-end tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )


def pytest_collection_modifyitems(config, items):
    """Modify test collection"""
    for item in items:
        # Auto-mark tests based on directory
        if "unit" in str(item.fspath):
            item.add_marker(pytest.mark.unit)
        elif "integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
        elif "e2e" in str(item.fspath):
            item.add_marker(pytest.mark.e2e)
            item.add_marker(pytest.mark.slow)


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Hook to capture test results for reporting"""
    outcome = yield
    rep = outcome.get_result()

    # Store test results for documentation
    if rep.when == "call":
        item.test_outcome = rep.outcome
        item.test_duration = rep.duration

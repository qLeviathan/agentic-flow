"""
Test fixtures for market data
"""
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict


def generate_ohlcv_data(
    ticker: str,
    start_date: str,
    end_date: str,
    initial_price: float = 100.0,
    volatility: float = 0.02,
    trend: float = 0.0005
) -> pd.DataFrame:
    """
    Generate synthetic OHLCV data for testing

    Args:
        ticker: Stock ticker symbol
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        initial_price: Starting price
        volatility: Daily volatility
        trend: Daily trend (drift)

    Returns:
        DataFrame with OHLCV data
    """
    dates = pd.date_range(start=start_date, end=end_date, freq='B')
    n_days = len(dates)

    # Generate price series with trend and volatility
    np.random.seed(hash(ticker) % (2**32))
    returns = np.random.normal(trend, volatility, n_days)
    prices = initial_price * np.exp(np.cumsum(returns))

    # Generate OHLC from close prices
    data = []
    for i, close in enumerate(prices):
        # High is close + random amount
        high = close * (1 + abs(np.random.normal(0, volatility/2)))
        # Low is close - random amount
        low = close * (1 - abs(np.random.normal(0, volatility/2)))
        # Open is previous close with some gap
        open_price = prices[i-1] * (1 + np.random.normal(0, volatility/4)) if i > 0 else close

        # Ensure OHLC consistency
        high = max(high, open_price, close)
        low = min(low, open_price, close)

        # Generate volume
        volume = int(np.random.lognormal(15, 0.5))  # Millions of shares

        data.append({
            'date': dates[i],
            'open': round(open_price, 2),
            'high': round(high, 2),
            'low': round(low, 2),
            'close': round(close, 2),
            'volume': volume
        })

    return pd.DataFrame(data)


def generate_crash_scenario(
    ticker: str = 'SPY',
    crash_magnitude: float = 0.34,
    crash_days: int = 23,
    recovery_days: int = 100
) -> pd.DataFrame:
    """
    Generate market crash scenario (like COVID-19 crash)

    Args:
        ticker: Stock ticker
        crash_magnitude: Magnitude of crash (0.34 = 34% drop)
        crash_days: Days to reach bottom
        recovery_days: Days to recover

    Returns:
        DataFrame with crash scenario data
    """
    start_date = '2020-02-19'
    total_days = crash_days + recovery_days

    dates = pd.date_range(start=start_date, periods=total_days, freq='B')

    # Create price path
    initial_price = 339.0  # SPY peak before COVID crash
    bottom_price = initial_price * (1 - crash_magnitude)

    # Crash phase: exponential decay
    crash_prices = initial_price * np.exp(
        np.linspace(0, np.log(1 - crash_magnitude), crash_days)
    )

    # Recovery phase: slower recovery
    recovery_prices = bottom_price + (initial_price - bottom_price) * (
        1 - np.exp(-np.linspace(0, 3, recovery_days))
    )

    prices = np.concatenate([crash_prices, recovery_prices])

    # Generate OHLCV data
    data = []
    for i, close in enumerate(prices):
        volatility = 0.05 if i < crash_days else 0.03  # Higher vol during crash

        high = close * (1 + abs(np.random.normal(0, volatility)))
        low = close * (1 - abs(np.random.normal(0, volatility)))
        open_price = prices[i-1] if i > 0 else close

        high = max(high, open_price, close)
        low = min(low, open_price, close)

        # Higher volume during crash
        base_volume = 100_000_000 if i < crash_days else 80_000_000
        volume = int(base_volume * (1 + np.random.uniform(-0.3, 0.5)))

        data.append({
            'date': dates[i],
            'ticker': ticker,
            'open': round(open_price, 2),
            'high': round(high, 2),
            'low': round(low, 2),
            'close': round(close, 2),
            'volume': volume
        })

    return pd.DataFrame(data)


def generate_trending_market(
    direction: str = 'up',
    duration_days: int = 252,
    trend_strength: float = 0.15
) -> pd.DataFrame:
    """
    Generate trending market data

    Args:
        direction: 'up' or 'down'
        duration_days: Number of trading days
        trend_strength: Annual return/loss

    Returns:
        DataFrame with trending data
    """
    dates = pd.date_range(start='2024-01-01', periods=duration_days, freq='B')

    initial_price = 100.0
    daily_trend = trend_strength / 252

    if direction == 'down':
        daily_trend = -daily_trend

    # Generate trending prices
    trend = np.arange(duration_days) * daily_trend
    noise = np.random.normal(0, 0.01, duration_days)
    log_returns = trend + noise

    prices = initial_price * np.exp(np.cumsum(log_returns))

    data = []
    for i, close in enumerate(prices):
        high = close * (1 + abs(np.random.normal(0, 0.015)))
        low = close * (1 - abs(np.random.normal(0, 0.015)))
        open_price = prices[i-1] if i > 0 else close

        high = max(high, open_price, close)
        low = min(low, open_price, close)

        data.append({
            'date': dates[i],
            'open': round(open_price, 2),
            'high': round(high, 2),
            'low': round(low, 2),
            'close': round(close, 2),
            'volume': int(np.random.lognormal(15, 0.3))
        })

    return pd.DataFrame(data)


def generate_sideways_market(
    duration_days: int = 252,
    price_range: float = 0.10
) -> pd.DataFrame:
    """
    Generate sideways/ranging market data

    Args:
        duration_days: Number of trading days
        price_range: Price range as percentage (0.10 = ±10%)

    Returns:
        DataFrame with sideways market data
    """
    dates = pd.date_range(start='2024-01-01', periods=duration_days, freq='B')

    center_price = 100.0

    # Mean-reverting process
    prices = []
    current_price = center_price

    for _ in range(duration_days):
        # Mean reversion with noise
        mean_reversion = -0.1 * (current_price - center_price) / center_price
        noise = np.random.normal(0, 0.01)

        return_pct = mean_reversion + noise
        current_price = current_price * (1 + return_pct)

        # Keep within range
        current_price = np.clip(
            current_price,
            center_price * (1 - price_range),
            center_price * (1 + price_range)
        )

        prices.append(current_price)

    data = []
    for i, close in enumerate(prices):
        high = close * (1 + abs(np.random.normal(0, 0.01)))
        low = close * (1 - abs(np.random.normal(0, 0.01)))
        open_price = prices[i-1] if i > 0 else close

        high = max(high, open_price, close)
        low = min(low, open_price, close)

        data.append({
            'date': dates[i],
            'open': round(open_price, 2),
            'high': round(high, 2),
            'low': round(low, 2),
            'close': round(close, 2),
            'volume': int(np.random.lognormal(14.8, 0.2))
        })

    return pd.DataFrame(data)


# Pre-defined fixtures for common test scenarios
FIXTURES = {
    'spy_normal': lambda: generate_ohlcv_data('SPY', '2024-01-01', '2024-12-31'),
    'qqq_high_vol': lambda: generate_ohlcv_data('QQQ', '2024-01-01', '2024-12-31', volatility=0.025),
    'aapl_trending': lambda: generate_trending_market('up', 252, 0.25),
    'covid_crash': lambda: generate_crash_scenario(),
    'bear_market': lambda: generate_trending_market('down', 252, -0.20),
    'sideways': lambda: generate_sideways_market(252, 0.08)
}


def get_fixture(name: str) -> pd.DataFrame:
    """Get a predefined fixture by name"""
    if name not in FIXTURES:
        raise ValueError(f"Unknown fixture: {name}")
    return FIXTURES[name]()

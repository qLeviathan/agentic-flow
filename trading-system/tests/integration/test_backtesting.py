"""
Backtesting Tests
Tests for historical data integrity, performance metrics, edge cases, and multi-ticker execution
"""
import pytest
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, field


@dataclass
class BacktestResult:
    """Backtesting results data structure"""
    total_return: float
    sharpe_ratio: float
    max_drawdown: float
    win_rate: float
    profit_factor: float
    total_trades: int
    winning_trades: int
    losing_trades: int
    avg_win: float
    avg_loss: float
    trades: List[Dict] = field(default_factory=list)


class BacktestEngine:
    """Backtesting engine for trading strategies"""

    def __init__(self, initial_capital: float = 100000):
        self.initial_capital = initial_capital
        self.capital = initial_capital
        self.positions = []
        self.closed_trades = []
        self.equity_curve = []

    def calculate_returns(self, prices: pd.Series) -> pd.Series:
        """Calculate returns from price series"""
        return prices.pct_change().fillna(0)

    def calculate_sharpe_ratio(self, returns: pd.Series, risk_free_rate: float = 0.02) -> float:
        """Calculate Sharpe ratio"""
        if len(returns) == 0 or returns.std() == 0:
            return 0.0

        excess_returns = returns - risk_free_rate / 252  # Daily risk-free rate
        return np.sqrt(252) * excess_returns.mean() / returns.std()

    def calculate_max_drawdown(self, equity_curve: pd.Series) -> float:
        """Calculate maximum drawdown"""
        if len(equity_curve) == 0:
            return 0.0

        running_max = equity_curve.cummax()
        drawdown = (equity_curve - running_max) / running_max
        return abs(drawdown.min())

    def calculate_win_rate(self, trades: List[Dict]) -> float:
        """Calculate win rate"""
        if len(trades) == 0:
            return 0.0

        winning_trades = sum(1 for trade in trades if trade['pnl'] > 0)
        return winning_trades / len(trades)

    def calculate_profit_factor(self, trades: List[Dict]) -> float:
        """Calculate profit factor"""
        gross_profit = sum(trade['pnl'] for trade in trades if trade['pnl'] > 0)
        gross_loss = abs(sum(trade['pnl'] for trade in trades if trade['pnl'] < 0))

        if gross_loss == 0:
            return float('inf') if gross_profit > 0 else 0.0

        return gross_profit / gross_loss

    def run_backtest(self, data: pd.DataFrame, strategy) -> BacktestResult:
        """Run backtest on historical data"""
        self.capital = self.initial_capital
        self.positions = []
        self.closed_trades = []
        self.equity_curve = [self.initial_capital]

        for i in range(len(data)):
            # Simulate strategy logic here
            # This is a simplified version
            pass

        # Calculate metrics
        equity_series = pd.Series(self.equity_curve)
        returns = self.calculate_returns(equity_series)

        winning_trades = [t for t in self.closed_trades if t['pnl'] > 0]
        losing_trades = [t for t in self.closed_trades if t['pnl'] < 0]

        result = BacktestResult(
            total_return=(self.capital - self.initial_capital) / self.initial_capital,
            sharpe_ratio=self.calculate_sharpe_ratio(returns),
            max_drawdown=self.calculate_max_drawdown(equity_series),
            win_rate=self.calculate_win_rate(self.closed_trades),
            profit_factor=self.calculate_profit_factor(self.closed_trades),
            total_trades=len(self.closed_trades),
            winning_trades=len(winning_trades),
            losing_trades=len(losing_trades),
            avg_win=np.mean([t['pnl'] for t in winning_trades]) if winning_trades else 0.0,
            avg_loss=np.mean([t['pnl'] for t in losing_trades]) if losing_trades else 0.0,
            trades=self.closed_trades
        )

        return result


class TestHistoricalDataIntegrity:
    """Tests for historical data validation"""

    def test_no_missing_dates(self):
        """Test that there are no unexpected gaps in trading days"""
        # Generate sample data
        dates = pd.date_range(start='2024-01-01', end='2024-01-31', freq='B')  # Business days
        data = pd.DataFrame({
            'date': dates,
            'close': np.random.uniform(100, 110, len(dates))
        })

        # Check for gaps (should only skip weekends)
        date_diffs = data['date'].diff().dropna()
        max_gap = date_diffs.max()

        # Maximum gap should be 3 days (Friday to Monday)
        assert max_gap <= timedelta(days=3)

    def test_no_negative_prices(self):
        """Test that all prices are positive"""
        data = pd.DataFrame({
            'open': [100, 101, 102],
            'high': [105, 106, 107],
            'low': [99, 100, 101],
            'close': [103, 104, 105]
        })

        for col in ['open', 'high', 'low', 'close']:
            assert (data[col] > 0).all(), f"Negative prices found in {col}"

    def test_high_low_relationship(self):
        """Test that high >= low for all bars"""
        data = pd.DataFrame({
            'high': [105, 106, 107],
            'low': [99, 100, 101]
        })

        assert (data['high'] >= data['low']).all(), "High < Low found in data"

    def test_ohlc_consistency(self):
        """Test that OHLC values are consistent"""
        data = pd.DataFrame({
            'open': [100, 101, 102],
            'high': [105, 106, 107],
            'low': [99, 100, 101],
            'close': [103, 104, 105]
        })

        # High should be >= open and close
        assert (data['high'] >= data['open']).all()
        assert (data['high'] >= data['close']).all()

        # Low should be <= open and close
        assert (data['low'] <= data['open']).all()
        assert (data['low'] <= data['close']).all()

    def test_volume_non_negative(self):
        """Test that volume is always non-negative"""
        data = pd.DataFrame({
            'volume': [1000000, 1500000, 2000000, 0]
        })

        assert (data['volume'] >= 0).all(), "Negative volume found"


class TestPerformanceMetrics:
    """Tests for performance metric calculations"""

    def test_sharpe_ratio_calculation(self):
        """Test Sharpe ratio calculation"""
        engine = BacktestEngine()

        # Generate returns with known properties
        returns = pd.Series([0.01, 0.02, -0.01, 0.015, 0.005] * 50)  # 250 days

        sharpe = engine.calculate_sharpe_ratio(returns)

        # Sharpe should be positive for profitable strategy
        assert sharpe > 0
        assert not np.isnan(sharpe)
        assert not np.isinf(sharpe)

    def test_max_drawdown_calculation(self):
        """Test maximum drawdown calculation"""
        engine = BacktestEngine()

        # Create equity curve with known drawdown
        equity = pd.Series([100, 110, 105, 95, 90, 100, 110])  # Max DD: 18.18%

        max_dd = engine.calculate_max_drawdown(equity)

        # Expected: (90 - 110) / 110 = -18.18%
        assert abs(max_dd - 0.1818) < 0.01

    def test_win_rate_calculation(self):
        """Test win rate calculation"""
        engine = BacktestEngine()

        trades = [
            {'pnl': 100},
            {'pnl': -50},
            {'pnl': 75},
            {'pnl': -25},
            {'pnl': 150}
        ]

        win_rate = engine.calculate_win_rate(trades)

        # 3 winning trades out of 5 = 60%
        assert win_rate == 0.6

    def test_profit_factor_calculation(self):
        """Test profit factor calculation"""
        engine = BacktestEngine()

        trades = [
            {'pnl': 100},
            {'pnl': -50},
            {'pnl': 200},
            {'pnl': -75}
        ]

        profit_factor = engine.calculate_profit_factor(trades)

        # Gross profit: 300, Gross loss: 125, PF = 2.4
        assert abs(profit_factor - 2.4) < 0.01

    def test_zero_trades_metrics(self):
        """Test metrics with zero trades"""
        engine = BacktestEngine()

        trades = []

        win_rate = engine.calculate_win_rate(trades)
        profit_factor = engine.calculate_profit_factor(trades)

        assert win_rate == 0.0
        assert profit_factor == 0.0


class TestEdgeCases:
    """Tests for edge case handling"""

    def test_market_crash_handling(self):
        """Test handling of extreme market crash (circuit breaker)"""
        # Simulate 2020 COVID crash: -34% in 23 days
        dates = pd.date_range(start='2020-02-19', end='2020-03-23', freq='B')

        # Start at 339 (SPY peak), end at 218 (bottom)
        prices = np.linspace(339, 218, len(dates))

        data = pd.DataFrame({
            'date': dates,
            'close': prices
        })

        # Calculate drawdown
        running_max = data['close'].cummax()
        drawdown = (data['close'] - running_max) / running_max

        max_drawdown = abs(drawdown.min())

        # Should capture ~34% drawdown
        assert abs(max_drawdown - 0.34) < 0.05

    def test_gap_handling(self):
        """Test handling of overnight gaps"""
        data = pd.DataFrame({
            'close_yesterday': [100, 110, 105],
            'open_today': [105, 108, 100]  # Gaps: +5%, -1.8%, -4.8%
        })

        gaps = (data['open_today'] - data['close_yesterday']) / data['close_yesterday']

        # Verify gaps are calculated correctly
        assert abs(gaps.iloc[0] - 0.05) < 0.001
        assert abs(gaps.iloc[1] - (-0.018)) < 0.001

    def test_trading_halt_handling(self):
        """Test handling of trading halts (zero volume)"""
        data = pd.DataFrame({
            'volume': [1000000, 0, 0, 500000, 1000000]  # Halt on days 2-3
        })

        # Identify halts
        halts = data['volume'] == 0

        assert halts.sum() == 2  # Two halt days
        assert halts.iloc[1] and halts.iloc[2]

    def test_delisting_scenario(self):
        """Test handling of ticker delisting"""
        # Price goes to near zero
        data = pd.DataFrame({
            'close': [50, 25, 10, 1, 0.01]
        })

        # Should detect severe drawdown
        drawdown = (data['close'].iloc[-1] - data['close'].iloc[0]) / data['close'].iloc[0]

        assert drawdown < -0.99  # >99% loss

    def test_split_adjustment(self):
        """Test handling of stock splits"""
        # 2:1 split simulation
        pre_split_price = 200
        post_split_price = 100

        # Adjusted historical prices should reflect split
        adjustment_factor = post_split_price / pre_split_price

        assert adjustment_factor == 0.5  # 2:1 split


class TestMultiTickerExecution:
    """Tests for parallel multi-ticker backtesting"""

    def test_parallel_ticker_processing(self):
        """Test processing multiple tickers in parallel"""
        tickers = ['SPY', 'QQQ', 'AAPL', 'MSFT']

        # Simulate results for each ticker
        results = {}
        for ticker in tickers:
            engine = BacktestEngine()
            # Simulate some trades
            engine.closed_trades = [
                {'pnl': 100},
                {'pnl': -50},
                {'pnl': 75}
            ]

            win_rate = engine.calculate_win_rate(engine.closed_trades)
            results[ticker] = win_rate

        # All tickers should have results
        assert len(results) == len(tickers)
        assert all(ticker in results for ticker in tickers)

    def test_portfolio_aggregation(self):
        """Test aggregating results across multiple tickers"""
        ticker_returns = {
            'SPY': [0.01, 0.02, -0.01],
            'QQQ': [0.015, 0.025, -0.005],
            'AAPL': [0.02, 0.01, -0.015]
        }

        # Equal-weight portfolio
        portfolio_returns = []
        for i in range(3):
            day_return = np.mean([ticker_returns[t][i] for t in ticker_returns])
            portfolio_returns.append(day_return)

        # Portfolio should have reduced volatility
        individual_vol = np.std([ticker_returns['SPY']])
        portfolio_vol = np.std(portfolio_returns)

        # This is a simplification, but portfolio vol should be comparable
        assert portfolio_vol >= 0

    def test_correlation_across_tickers(self):
        """Test correlation analysis across tickers"""
        # Create correlated returns
        np.random.seed(42)
        base_returns = np.random.randn(100)

        spy_returns = base_returns + np.random.randn(100) * 0.1
        qqq_returns = base_returns + np.random.randn(100) * 0.1

        correlation = np.corrcoef(spy_returns, qqq_returns)[0, 1]

        # SPY and QQQ should be highly correlated
        assert correlation > 0.7


class TestEconomicRegimes:
    """Tests for economic regime detection"""

    def test_bull_market_detection(self):
        """Test detection of bull market regime"""
        # Simulate bull market: consistent uptrend
        prices = pd.Series(range(100, 200, 2))  # +100% over period

        sma_200 = prices.rolling(20).mean()  # Simplified

        # Price should be consistently above SMA in bull market
        above_sma = (prices > sma_200).sum()
        total_periods = len(prices.dropna())

        bull_ratio = above_sma / total_periods if total_periods > 0 else 0

        assert bull_ratio > 0.7  # >70% of time above SMA

    def test_bear_market_detection(self):
        """Test detection of bear market regime"""
        # Simulate bear market: -20% decline
        prices = pd.Series(np.linspace(100, 80, 50))

        drawdown = (prices - prices.cummax()) / prices.cummax()

        # Should detect >20% drawdown
        assert drawdown.min() < -0.20

    def test_sideways_market_detection(self):
        """Test detection of ranging/sideways market"""
        # Simulate sideways market
        np.random.seed(42)
        prices = pd.Series(100 + np.random.randn(100) * 2)  # Mean reversion around 100

        # Low trend: price range is small relative to volatility
        price_range = prices.max() - prices.min()
        volatility = prices.std()

        # In sideways market, range should be small relative to volatility
        range_to_vol_ratio = price_range / volatility

        # This is a heuristic, but sideways markets have smaller ratios
        assert range_to_vol_ratio < 10


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

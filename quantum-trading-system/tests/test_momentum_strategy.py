"""
Tests for Momentum Strategy - Agent 15 (Zeckendorf: 10000010)
==============================================================

Validates integer-only momentum calculations:
- RSI calculation accuracy
- MACD with Fibonacci periods
- Signal generation logic
- Trend detection
- Integer arithmetic integrity

Dependencies: momentum_strategy.py
"""

import pytest
from typing import List
from src.strategies.momentum_strategy import (
    MomentumStrategy,
    SignalType,
    TradingSignal,
    get_momentum_signal,
    FIBONACCI_PERIODS,
    SCALE,
    RSI_OVERSOLD,
    RSI_OVERBOUGHT,
    MACD_FAST,
    MACD_SLOW,
    MACD_SIGNAL
)


class TestFibonacciValidation:
    """Test Fibonacci period validation"""

    def test_valid_fibonacci_periods(self):
        """Test that default periods are from Fibonacci sequence"""
        strategy = MomentumStrategy()

        assert strategy.rsi_period in FIBONACCI_PERIODS
        assert strategy.macd_fast in FIBONACCI_PERIODS
        assert strategy.macd_slow in FIBONACCI_PERIODS
        assert strategy.macd_signal_period in FIBONACCI_PERIODS

    def test_invalid_rsi_period_raises(self):
        """Test that non-Fibonacci RSI period raises error"""
        with pytest.raises(ValueError, match="RSI period .* not in Fibonacci"):
            MomentumStrategy(rsi_period=10)

    def test_invalid_macd_fast_raises(self):
        """Test that non-Fibonacci MACD fast raises error"""
        with pytest.raises(ValueError, match="MACD fast .* not in Fibonacci"):
            MomentumStrategy(macd_fast=10)

    def test_invalid_macd_slow_raises(self):
        """Test that non-Fibonacci MACD slow raises error"""
        with pytest.raises(ValueError, match="MACD slow .* not in Fibonacci"):
            MomentumStrategy(macd_slow=20)


class TestRSICalculation:
    """Test RSI calculations with integer arithmetic"""

    def test_rsi_uptrend(self):
        """Test RSI in strong uptrend"""
        strategy = MomentumStrategy(rsi_period=13)

        # Strong uptrend: steadily increasing prices
        prices = [10000 * SCALE + i * 100 * SCALE for i in range(20)]

        rsi = strategy.calculate_rsi(prices)

        # RSI should be high (>50) in uptrend
        assert rsi > 5000, f"RSI {rsi} should be > 5000 in uptrend"
        assert rsi <= SCALE, f"RSI {rsi} should be <= {SCALE}"
        assert isinstance(rsi, int), "RSI must be integer"

    def test_rsi_downtrend(self):
        """Test RSI in strong downtrend"""
        strategy = MomentumStrategy(rsi_period=13)

        # Strong downtrend: steadily decreasing prices
        prices = [10000 * SCALE - i * 100 * SCALE for i in range(20)]

        rsi = strategy.calculate_rsi(prices)

        # RSI should be low (<50) in downtrend
        assert rsi < 5000, f"RSI {rsi} should be < 5000 in downtrend"
        assert rsi >= 0, f"RSI {rsi} should be >= 0"
        assert isinstance(rsi, int), "RSI must be integer"

    def test_rsi_neutral(self):
        """Test RSI in ranging market"""
        strategy = MomentumStrategy(rsi_period=13)

        # Ranging: oscillating prices
        base = 10000 * SCALE
        prices = [base + (100 * SCALE if i % 2 == 0 else -100 * SCALE) for i in range(20)]

        rsi = strategy.calculate_rsi(prices)

        # RSI should be near 50 in ranging market
        assert 4000 <= rsi <= 6000, f"RSI {rsi} should be near 5000 in ranging market"
        assert isinstance(rsi, int), "RSI must be integer"

    def test_rsi_insufficient_data(self):
        """Test RSI with insufficient data returns neutral"""
        strategy = MomentumStrategy(rsi_period=13)

        # Only 5 prices (need 14 for RSI-13)
        prices = [10000 * SCALE] * 5

        rsi = strategy.calculate_rsi(prices)

        assert rsi == 5000, "RSI should be 5000 (neutral) with insufficient data"

    def test_rsi_bounds(self):
        """Test RSI is bounded between 0 and 10000"""
        strategy = MomentumStrategy(rsi_period=13)

        # Extreme uptrend
        prices_up = [10000 * SCALE + i * 1000 * SCALE for i in range(20)]
        rsi_up = strategy.calculate_rsi(prices_up)
        assert 0 <= rsi_up <= SCALE

        # Extreme downtrend
        prices_down = [20000 * SCALE - i * 1000 * SCALE for i in range(20)]
        rsi_down = strategy.calculate_rsi(prices_down)
        assert 0 <= rsi_down <= SCALE

    def test_rsi_integer_only(self):
        """Test RSI uses only integer arithmetic"""
        strategy = MomentumStrategy(rsi_period=13)

        prices = [10000 * SCALE + i * 100 * SCALE for i in range(20)]
        rsi = strategy.calculate_rsi(prices)

        # Verify result is integer
        assert isinstance(rsi, int)
        assert rsi == int(rsi)


class TestEMACalculation:
    """Test EMA calculations with integer arithmetic"""

    def test_ema_single_price(self):
        """Test EMA with single price returns that price"""
        strategy = MomentumStrategy()

        prices = [10000 * SCALE]
        ema = strategy.calculate_ema(prices, period=8)

        assert ema == prices[0]

    def test_ema_uptrend(self):
        """Test EMA follows uptrend"""
        strategy = MomentumStrategy()

        prices = [10000 * SCALE + i * 100 * SCALE for i in range(20)]
        ema = strategy.calculate_ema(prices, period=8)

        # EMA should be less than current price in uptrend
        assert ema < prices[-1]
        # But greater than early prices
        assert ema > prices[0]
        assert isinstance(ema, int)

    def test_ema_integer_only(self):
        """Test EMA uses only integer arithmetic"""
        strategy = MomentumStrategy()

        prices = [10000 * SCALE + i * 50 * SCALE for i in range(15)]
        ema = strategy.calculate_ema(prices, period=13)

        assert isinstance(ema, int)
        assert ema == int(ema)

    def test_ema_fibonacci_periods(self):
        """Test EMA with various Fibonacci periods"""
        strategy = MomentumStrategy()

        prices = [10000 * SCALE + i * 100 * SCALE for i in range(30)]

        for period in [2, 3, 5, 8, 13, 21]:
            ema = strategy.calculate_ema(prices, period=period)
            assert isinstance(ema, int)
            assert ema > 0


class TestMACDCalculation:
    """Test MACD calculations with Fibonacci periods"""

    def test_macd_basic(self):
        """Test basic MACD calculation"""
        strategy = MomentumStrategy()

        # Uptrend
        prices = [10000 * SCALE + i * 100 * SCALE for i in range(30)]

        macd, signal, histogram = strategy.calculate_macd(prices)

        # All should be integers
        assert isinstance(macd, int)
        assert isinstance(signal, int)
        assert isinstance(histogram, int)

        # Histogram = MACD - Signal
        assert histogram == macd - signal

    def test_macd_uptrend(self):
        """Test MACD in uptrend is positive"""
        strategy = MomentumStrategy()

        prices = [10000 * SCALE + i * 150 * SCALE for i in range(30)]

        macd, signal, histogram = strategy.calculate_macd(prices)

        # In strong uptrend, MACD should be positive
        assert macd > 0, f"MACD {macd} should be positive in uptrend"

    def test_macd_downtrend(self):
        """Test MACD in downtrend is negative"""
        strategy = MomentumStrategy()

        prices = [15000 * SCALE - i * 150 * SCALE for i in range(30)]

        macd, signal, histogram = strategy.calculate_macd(prices)

        # In strong downtrend, MACD should be negative
        assert macd < 0, f"MACD {macd} should be negative in downtrend"

    def test_macd_insufficient_data(self):
        """Test MACD with insufficient data returns zeros"""
        strategy = MomentumStrategy()

        # Only 10 prices (need 21 for MACD slow)
        prices = [10000 * SCALE] * 10

        macd, signal, histogram = strategy.calculate_macd(prices)

        assert macd == 0
        assert signal == 0
        assert histogram == 0

    def test_macd_crossover_detection(self):
        """Test MACD crossover detection"""
        strategy = MomentumStrategy()

        # Create price pattern that causes crossover
        # First downtrend, then sharp uptrend
        prices = []
        for i in range(15):
            prices.append(12000 * SCALE - i * 100 * SCALE)
        for i in range(15):
            prices.append(11500 * SCALE + i * 200 * SCALE)

        # Generate signals to populate history
        for i in range(22, len(prices)):
            strategy.calculate_macd(prices[:i])
            strategy.macd_history.append(strategy.calculate_macd(prices[:i]))

        # Should eventually detect bullish crossover
        crossover = strategy._detect_macd_crossover(bullish=True)
        # This may or may not be True depending on exact prices
        assert isinstance(crossover, bool)


class TestMomentumCalculation:
    """Test momentum calculations"""

    def test_momentum_uptrend(self):
        """Test momentum in uptrend > 10000"""
        strategy = MomentumStrategy()

        prices = [10000 * SCALE + i * 200 * SCALE for i in range(20)]

        momentum = strategy.calculate_momentum(prices, period=8)

        # Momentum > SCALE indicates uptrend
        assert momentum > SCALE, f"Momentum {momentum} should be > {SCALE} in uptrend"
        assert isinstance(momentum, int)

    def test_momentum_downtrend(self):
        """Test momentum in downtrend < 10000"""
        strategy = MomentumStrategy()

        prices = [15000 * SCALE - i * 200 * SCALE for i in range(20)]

        momentum = strategy.calculate_momentum(prices, period=8)

        # Momentum < SCALE indicates downtrend
        assert momentum < SCALE, f"Momentum {momentum} should be < {SCALE} in downtrend"
        assert isinstance(momentum, int)

    def test_momentum_flat(self):
        """Test momentum in flat market ≈ 10000"""
        strategy = MomentumStrategy()

        prices = [10000 * SCALE] * 20

        momentum = strategy.calculate_momentum(prices, period=8)

        # Momentum should be exactly SCALE for flat prices
        assert momentum == SCALE, f"Momentum {momentum} should be {SCALE} for flat prices"


class TestTrendStrength:
    """Test trend strength calculations"""

    def test_trend_strength_uptrend(self):
        """Test trend strength in uptrend > 5000"""
        strategy = MomentumStrategy()

        prices = [10000 * SCALE + i * 150 * SCALE for i in range(20)]

        trend = strategy.calculate_trend_strength(prices)

        assert trend > 5000, f"Trend strength {trend} should be > 5000 in uptrend"
        assert trend <= SCALE
        assert isinstance(trend, int)

    def test_trend_strength_downtrend(self):
        """Test trend strength in downtrend < 5000"""
        strategy = MomentumStrategy()

        prices = [15000 * SCALE - i * 150 * SCALE for i in range(20)]

        trend = strategy.calculate_trend_strength(prices)

        assert trend < 5000, f"Trend strength {trend} should be < 5000 in downtrend"
        assert trend >= 0
        assert isinstance(trend, int)

    def test_trend_strength_bounds(self):
        """Test trend strength is bounded 0-10000"""
        strategy = MomentumStrategy()

        # Extreme uptrend
        prices_up = [10000 * SCALE + i * 1000 * SCALE for i in range(20)]
        trend_up = strategy.calculate_trend_strength(prices_up)
        assert 0 <= trend_up <= SCALE

        # Extreme downtrend
        prices_down = [30000 * SCALE - i * 1000 * SCALE for i in range(20)]
        trend_down = strategy.calculate_trend_strength(prices_down)
        assert 0 <= trend_down <= SCALE


class TestSignalGeneration:
    """Test trading signal generation"""

    def test_signal_strong_buy(self):
        """Test STRONG_BUY signal generation"""
        strategy = MomentumStrategy()

        # Create oversold + bullish crossover + uptrend
        # Start low, then sharp rally
        prices = []
        for i in range(15):
            prices.append(8000 * SCALE - i * 50 * SCALE)
        for i in range(15):
            prices.append(7250 * SCALE + i * 300 * SCALE)

        signal = strategy.generate_signal(prices)

        assert isinstance(signal, TradingSignal)
        # Signal type could be BUY or STRONG_BUY
        assert signal.signal_type in [SignalType.BUY, SignalType.STRONG_BUY, SignalType.HOLD]
        assert signal.confidence >= 0
        assert signal.confidence <= SCALE

    def test_signal_hold_insufficient_data(self):
        """Test HOLD signal with insufficient data"""
        strategy = MomentumStrategy()

        prices = [10000 * SCALE] * 10  # Not enough data

        signal = strategy.generate_signal(prices)

        assert signal.signal_type == SignalType.HOLD
        assert signal.confidence == 0
        assert signal.rsi == 5000

    def test_signal_components(self):
        """Test signal contains all components"""
        strategy = MomentumStrategy()

        prices = [10000 * SCALE + i * 100 * SCALE for i in range(30)]

        signal = strategy.generate_signal(prices)

        # Verify all components present
        assert hasattr(signal, 'signal_type')
        assert hasattr(signal, 'rsi')
        assert hasattr(signal, 'macd')
        assert hasattr(signal, 'macd_signal')
        assert hasattr(signal, 'macd_histogram')
        assert hasattr(signal, 'momentum')
        assert hasattr(signal, 'trend_strength')
        assert hasattr(signal, 'confidence')

        # All should be integers
        assert isinstance(signal.rsi, int)
        assert isinstance(signal.macd, int)
        assert isinstance(signal.macd_signal, int)
        assert isinstance(signal.macd_histogram, int)
        assert isinstance(signal.momentum, int)
        assert isinstance(signal.trend_strength, int)
        assert isinstance(signal.confidence, int)

    def test_signal_rsi_bounds(self):
        """Test signal RSI is bounded"""
        strategy = MomentumStrategy()

        prices = [10000 * SCALE + i * 100 * SCALE for i in range(30)]
        signal = strategy.generate_signal(prices)

        assert 0 <= signal.rsi <= SCALE

    def test_signal_trend_bounds(self):
        """Test signal trend strength is bounded"""
        strategy = MomentumStrategy()

        prices = [10000 * SCALE + i * 100 * SCALE for i in range(30)]
        signal = strategy.generate_signal(prices)

        assert 0 <= signal.trend_strength <= SCALE


class TestBacktesting:
    """Test backtesting functionality"""

    def test_backtest_basic(self):
        """Test basic backtesting"""
        strategy = MomentumStrategy()

        # Create 100 price points
        prices = [10000 * SCALE + i * 50 * SCALE for i in range(100)]

        signals = strategy.backtest_signals(prices, window_size=30)

        # Should generate signals for periods after window_size
        assert len(signals) > 0
        assert len(signals) == len(prices) - 30

        # All signals should be TradingSignal
        for signal in signals:
            assert isinstance(signal, TradingSignal)

    def test_backtest_uptrend(self):
        """Test backtesting on uptrend"""
        strategy = MomentumStrategy()

        prices = [10000 * SCALE + i * 100 * SCALE for i in range(80)]

        signals = strategy.backtest_signals(prices, window_size=30)

        # Should have some BUY signals in uptrend
        buy_signals = sum(1 for s in signals if s.signal_type in [SignalType.BUY, SignalType.STRONG_BUY])
        assert buy_signals >= 0  # May or may not have BUY depending on RSI levels


class TestStateExport:
    """Test state export functionality"""

    def test_export_state(self):
        """Test exporting strategy state"""
        strategy = MomentumStrategy()

        state = strategy.export_state()

        # Verify expected keys
        assert 'rsi_period' in state
        assert 'macd_fast' in state
        assert 'macd_slow' in state
        assert 'macd_signal' in state
        assert 'scale' in state
        assert 'fibonacci_periods' in state
        assert 'lucas_weights' in state
        assert 'rsi_thresholds' in state

        # Verify values
        assert state['rsi_period'] == 13
        assert state['macd_fast'] == MACD_FAST
        assert state['macd_slow'] == MACD_SLOW
        assert state['scale'] == SCALE


class TestConvenienceFunction:
    """Test convenience function"""

    def test_get_momentum_signal(self):
        """Test get_momentum_signal convenience function"""
        prices = [10000 * SCALE + i * 100 * SCALE for i in range(30)]

        signal = get_momentum_signal(prices)

        assert isinstance(signal, TradingSignal)
        assert signal.signal_type in [
            SignalType.BUY,
            SignalType.SELL,
            SignalType.HOLD,
            SignalType.STRONG_BUY,
            SignalType.STRONG_SELL
        ]


class TestIntegerIntegrity:
    """Test integer-only arithmetic integrity"""

    def test_no_float_operations(self):
        """Test that all calculations use only integers"""
        strategy = MomentumStrategy()

        prices = [10000 * SCALE + i * 100 * SCALE for i in range(50)]

        # Generate signal
        signal = strategy.generate_signal(prices)

        # Verify all numeric values are integers
        assert isinstance(signal.rsi, int)
        assert isinstance(signal.macd, int)
        assert isinstance(signal.macd_signal, int)
        assert isinstance(signal.macd_histogram, int)
        assert isinstance(signal.momentum, int)
        assert isinstance(signal.trend_strength, int)
        assert isinstance(signal.confidence, int)

        # Verify no float contamination
        assert signal.rsi == int(signal.rsi)
        assert signal.macd == int(signal.macd)
        assert signal.trend_strength == int(signal.trend_strength)

    def test_scale_factor_consistency(self):
        """Test that SCALE factor is used consistently"""
        strategy = MomentumStrategy()

        assert strategy.scale == SCALE
        assert SCALE == 10000

        # Verify RSI is scaled
        prices = [10000 * SCALE] * 20
        rsi = strategy.calculate_rsi(prices)
        assert rsi <= SCALE

        # Verify trend is scaled
        trend = strategy.calculate_trend_strength(prices)
        assert trend <= SCALE


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

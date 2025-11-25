"""
Momentum Trading Strategy - Agent 15 (Zeckendorf: 10000010)
============================================================

Implements integer-only momentum indicators:
- RSI (Relative Strength Index) with integer arithmetic
- MACD (Moving Average Convergence Divergence) with Fibonacci periods
- Trend confirmation using Lucas sequences
- Integer-only momentum calculations

Dependencies: Agents 5 (Fibonacci), 6 (Lucas)

OEIS Sequences:
- A000045 (Fibonacci): Used for MACD periods [8, 13, 21, 34, 55]
- A000032 (Lucas): Used for time weighting [2, 1, 3, 4, 7, 11, 18, 29]

Author: Agent 15 (Zeckendorf: 10000010)
"""

from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass
from enum import Enum


# OEIS A000045: Fibonacci numbers for MACD periods
FIBONACCI_PERIODS = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144]

# OEIS A000032: Lucas numbers for time weighting
LUCAS_WEIGHTS = [2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123, 199]

# Scale factor for integer arithmetic (10^4)
SCALE = 10000

# RSI thresholds (scaled by 100)
RSI_OVERSOLD = 3000   # 30.00
RSI_OVERBOUGHT = 7000  # 70.00
RSI_NEUTRAL_LOW = 4500 # 45.00
RSI_NEUTRAL_HIGH = 5500 # 55.00

# MACD parameters (Fibonacci-based)
MACD_FAST = 8   # F(6) from OEIS A000045
MACD_SLOW = 21  # F(8) from OEIS A000045
MACD_SIGNAL = 13 # F(7) from OEIS A000045


class SignalType(Enum):
    """Trading signal types"""
    BUY = 1
    SELL = 2
    HOLD = 3
    STRONG_BUY = 4
    STRONG_SELL = 5


@dataclass
class TradingSignal:
    """Trading signal with momentum analysis"""
    signal_type: SignalType
    rsi: int  # RSI value (0-10000)
    macd: int  # MACD value (scaled)
    macd_signal: int  # MACD signal line (scaled)
    macd_histogram: int  # MACD histogram (scaled)
    momentum: int  # Raw momentum (scaled)
    trend_strength: int  # Trend strength (0-10000)
    confidence: int  # Signal confidence (0-10000)


class MomentumStrategy:
    """
    Integer-only momentum trading strategy.

    Combines RSI and MACD with Fibonacci periods for trend-following
    and mean-reversion signals. All calculations use integer arithmetic
    with SCALE factor for precision.
    """

    def __init__(
        self,
        rsi_period: int = 13,  # F(7) Fibonacci
        macd_fast: int = MACD_FAST,
        macd_slow: int = MACD_SLOW,
        macd_signal: int = MACD_SIGNAL,
        scale: int = SCALE
    ):
        """
        Initialize momentum strategy.

        Args:
            rsi_period: RSI calculation period (default 13, Fibonacci)
            macd_fast: MACD fast EMA period (default 8, Fibonacci)
            macd_slow: MACD slow EMA period (default 21, Fibonacci)
            macd_signal: MACD signal line period (default 13, Fibonacci)
            scale: Integer scaling factor (default 10000)
        """
        # Validate Fibonacci periods
        if rsi_period not in FIBONACCI_PERIODS:
            raise ValueError(f"RSI period {rsi_period} not in Fibonacci sequence")
        if macd_fast not in FIBONACCI_PERIODS:
            raise ValueError(f"MACD fast {macd_fast} not in Fibonacci sequence")
        if macd_slow not in FIBONACCI_PERIODS:
            raise ValueError(f"MACD slow {macd_slow} not in Fibonacci sequence")
        if macd_signal not in FIBONACCI_PERIODS:
            raise ValueError(f"MACD signal {macd_signal} not in Fibonacci sequence")

        self.rsi_period = rsi_period
        self.macd_fast = macd_fast
        self.macd_slow = macd_slow
        self.macd_signal_period = macd_signal
        self.scale = scale

        # State variables
        self.price_history: List[int] = []
        self.rsi_history: List[int] = []
        self.macd_history: List[Tuple[int, int, int]] = []  # (macd, signal, histogram)

    def calculate_rsi(self, prices: List[int], period: Optional[int] = None) -> int:
        """
        Calculate RSI using integer-only arithmetic.

        RSI = 10000 - (10000 / (1 + RS))
        RS = Average Gain / Average Loss (scaled)

        Args:
            prices: Price series (scaled integers)
            period: RSI period (default: self.rsi_period)

        Returns:
            RSI value (0-10000, representing 0.00-100.00)
        """
        if period is None:
            period = self.rsi_period

        if len(prices) < period + 1:
            return 5000  # Neutral RSI if insufficient data

        # Calculate price changes
        gains = []
        losses = []

        for i in range(1, len(prices)):
            change = prices[i] - prices[i-1]
            if change > 0:
                gains.append(change)
                losses.append(0)
            else:
                gains.append(0)
                losses.append(-change)

        # Use only last 'period' values
        recent_gains = gains[-period:]
        recent_losses = losses[-period:]

        # Calculate average gain and loss (integer division)
        avg_gain = sum(recent_gains) // period
        avg_loss = sum(recent_losses) // period

        # Avoid division by zero
        if avg_loss == 0:
            return 10000 if avg_gain > 0 else 5000

        # Calculate RS = avg_gain / avg_loss (scaled)
        rs = (avg_gain * self.scale) // avg_loss

        # RSI = 100 - (100 / (1 + RS))
        # Scaled: RSI = 10000 - (10000 * 10000 / (10000 + RS))
        rsi = self.scale - ((self.scale * self.scale) // (self.scale + rs))

        return max(0, min(self.scale, rsi))

    def calculate_ema(self, prices: List[int], period: int) -> int:
        """
        Calculate Exponential Moving Average using integer arithmetic.

        EMA[t] = Price[t] * α + EMA[t-1] * (1 - α)
        where α = 2 / (period + 1)

        Args:
            prices: Price series (scaled)
            period: EMA period

        Returns:
            EMA value (scaled integer)
        """
        if not prices:
            return 0
        if len(prices) == 1:
            return prices[0]

        # Calculate α = 2 / (period + 1), scaled
        # α_scaled = (2 * SCALE) / (period + 1)
        alpha = (2 * self.scale) // (period + 1)
        one_minus_alpha = self.scale - alpha

        # Initialize EMA with first price
        ema = prices[0]

        # Calculate EMA iteratively
        for price in prices[1:]:
            # EMA = price * α + ema * (1 - α), with scaling
            ema = ((price * alpha) + (ema * one_minus_alpha)) // self.scale

        return ema

    def calculate_macd(
        self,
        prices: List[int]
    ) -> Tuple[int, int, int]:
        """
        Calculate MACD using Fibonacci periods (integer-only).

        MACD Line = EMA(fast) - EMA(slow)
        Signal Line = EMA(MACD Line, signal_period)
        Histogram = MACD Line - Signal Line

        Args:
            prices: Price series (scaled)

        Returns:
            Tuple of (macd_line, signal_line, histogram) all scaled integers
        """
        if len(prices) < self.macd_slow:
            return (0, 0, 0)

        # Calculate fast and slow EMAs
        ema_fast = self.calculate_ema(prices, self.macd_fast)
        ema_slow = self.calculate_ema(prices, self.macd_slow)

        # MACD line = fast EMA - slow EMA
        macd_line = ema_fast - ema_slow

        # Calculate signal line (EMA of MACD values)
        if len(self.macd_history) >= self.macd_signal_period:
            # Use historical MACD values for signal line
            macd_values = [m[0] for m in self.macd_history[-self.macd_signal_period:]]
            macd_values.append(macd_line)
            signal_line = self.calculate_ema(macd_values, self.macd_signal_period)
        else:
            # Not enough history, signal = macd
            signal_line = macd_line

        # Histogram = MACD - Signal
        histogram = macd_line - signal_line

        return (macd_line, signal_line, histogram)

    def calculate_momentum(self, prices: List[int], period: int = 8) -> int:
        """
        Calculate raw momentum indicator (integer-only).

        Momentum = (Current Price / Price[period ago]) * SCALE

        Args:
            prices: Price series (scaled)
            period: Lookback period (default 8, Fibonacci)

        Returns:
            Momentum value (scaled, 10000 = no change)
        """
        if len(prices) < period + 1:
            return self.scale  # No momentum if insufficient data

        current_price = prices[-1]
        past_price = prices[-period - 1]

        if past_price == 0:
            return self.scale

        # Momentum = (current / past) * SCALE
        momentum = (current_price * self.scale) // past_price

        return momentum

    def calculate_trend_strength(self, prices: List[int]) -> int:
        """
        Calculate trend strength using Lucas-weighted momentum.

        Trend Strength = Σ(momentum[i] * lucas_weight[i]) / Σ(lucas_weight[i])

        Args:
            prices: Price series (scaled)

        Returns:
            Trend strength (0-10000)
        """
        if len(prices) < 5:
            return 5000  # Neutral if insufficient data

        # Calculate momentum at different Fibonacci periods
        periods = [p for p in FIBONACCI_PERIODS if 2 <= p <= 13]
        momenta = []

        for i, period in enumerate(periods):
            if len(prices) >= period + 1:
                mom = self.calculate_momentum(prices, period)
                # Weight by Lucas number
                lucas_weight = LUCAS_WEIGHTS[i] if i < len(LUCAS_WEIGHTS) else 1
                momenta.append((mom, lucas_weight))

        if not momenta:
            return 5000

        # Weighted average
        weighted_sum = sum(m * w for m, w in momenta)
        weight_total = sum(w for _, w in momenta)

        trend = weighted_sum // weight_total

        # Normalize to 0-10000 range
        # trend around 10000 = strong uptrend
        # trend around 10000- = strong downtrend
        # Map to 0-10000 where 5000 = neutral
        if trend > self.scale:
            # Uptrend: map 10000-20000 to 5000-10000
            strength = 5000 + min(5000, (trend - self.scale) // 2)
        else:
            # Downtrend: map 0-10000 to 0-5000
            strength = (trend * 5000) // self.scale

        return max(0, min(self.scale, strength))

    def generate_signal(self, prices: List[int]) -> TradingSignal:
        """
        Generate trading signal based on RSI, MACD, and momentum.

        Signal Logic:
        - STRONG_BUY: RSI oversold + MACD bullish crossover + strong uptrend
        - BUY: RSI < 50 + MACD positive + uptrend
        - STRONG_SELL: RSI overbought + MACD bearish crossover + strong downtrend
        - SELL: RSI > 50 + MACD negative + downtrend
        - HOLD: Mixed signals or neutral conditions

        Args:
            prices: Price series (scaled integers)

        Returns:
            TradingSignal with complete analysis
        """
        if len(prices) < max(self.rsi_period, self.macd_slow) + 1:
            # Insufficient data
            return TradingSignal(
                signal_type=SignalType.HOLD,
                rsi=5000,
                macd=0,
                macd_signal=0,
                macd_histogram=0,
                momentum=self.scale,
                trend_strength=5000,
                confidence=0
            )

        # Calculate indicators
        rsi = self.calculate_rsi(prices)
        macd_line, signal_line, histogram = self.calculate_macd(prices)
        momentum = self.calculate_momentum(prices, period=8)
        trend_strength = self.calculate_trend_strength(prices)

        # Update history
        self.price_history = prices[-100:]  # Keep last 100
        self.rsi_history.append(rsi)
        self.macd_history.append((macd_line, signal_line, histogram))

        # Determine signal
        signal_type = SignalType.HOLD
        confidence = 0

        # Bullish conditions
        is_oversold = rsi < RSI_OVERSOLD
        is_low_rsi = rsi < RSI_NEUTRAL_LOW
        macd_bullish = histogram > 0
        macd_crossover = self._detect_macd_crossover(bullish=True)
        strong_uptrend = trend_strength > 6500
        uptrend = trend_strength > 5500

        # Bearish conditions
        is_overbought = rsi > RSI_OVERBOUGHT
        is_high_rsi = rsi > RSI_NEUTRAL_HIGH
        macd_bearish = histogram < 0
        macd_crossover_down = self._detect_macd_crossover(bullish=False)
        strong_downtrend = trend_strength < 3500
        downtrend = trend_strength < 4500

        # Generate signal
        if is_oversold and macd_crossover and strong_uptrend:
            signal_type = SignalType.STRONG_BUY
            confidence = 9000
        elif is_low_rsi and macd_bullish and uptrend:
            signal_type = SignalType.BUY
            confidence = 7000
        elif is_overbought and macd_crossover_down and strong_downtrend:
            signal_type = SignalType.STRONG_SELL
            confidence = 9000
        elif is_high_rsi and macd_bearish and downtrend:
            signal_type = SignalType.SELL
            confidence = 7000
        else:
            signal_type = SignalType.HOLD
            # Calculate confidence based on indicator agreement
            bullish_count = sum([is_low_rsi, macd_bullish, uptrend])
            bearish_count = sum([is_high_rsi, macd_bearish, downtrend])
            confidence = abs(bullish_count - bearish_count) * 2000

        return TradingSignal(
            signal_type=signal_type,
            rsi=rsi,
            macd=macd_line,
            macd_signal=signal_line,
            macd_histogram=histogram,
            momentum=momentum,
            trend_strength=trend_strength,
            confidence=confidence
        )

    def _detect_macd_crossover(self, bullish: bool = True) -> bool:
        """
        Detect MACD crossover (bullish or bearish).

        Args:
            bullish: True for bullish crossover, False for bearish

        Returns:
            True if crossover detected
        """
        if len(self.macd_history) < 2:
            return False

        # Current and previous histogram
        current_hist = self.macd_history[-1][2]
        prev_hist = self.macd_history[-2][2]

        if bullish:
            # Bullish: histogram crosses from negative to positive
            return prev_hist <= 0 and current_hist > 0
        else:
            # Bearish: histogram crosses from positive to negative
            return prev_hist >= 0 and current_hist < 0

    def backtest_signals(
        self,
        price_series: List[int],
        window_size: int = 50
    ) -> List[TradingSignal]:
        """
        Backtest strategy on historical prices.

        Args:
            price_series: Complete price history (scaled)
            window_size: Rolling window size for signal generation

        Returns:
            List of generated signals
        """
        signals = []

        for i in range(window_size, len(price_series)):
            window = price_series[max(0, i - window_size):i + 1]
            signal = self.generate_signal(window)
            signals.append(signal)

        return signals

    def export_state(self) -> Dict:
        """
        Export strategy state for AgentDB storage.

        Returns:
            Dictionary with strategy state
        """
        return {
            'rsi_period': self.rsi_period,
            'macd_fast': self.macd_fast,
            'macd_slow': self.macd_slow,
            'macd_signal': self.macd_signal_period,
            'scale': self.scale,
            'fibonacci_periods': FIBONACCI_PERIODS[:8],
            'lucas_weights': LUCAS_WEIGHTS[:8],
            'rsi_thresholds': {
                'oversold': RSI_OVERSOLD,
                'overbought': RSI_OVERBOUGHT,
                'neutral_low': RSI_NEUTRAL_LOW,
                'neutral_high': RSI_NEUTRAL_HIGH
            },
            'num_signals_generated': len(self.rsi_history),
            'latest_rsi': self.rsi_history[-1] if self.rsi_history else None,
            'latest_macd': self.macd_history[-1] if self.macd_history else None
        }


# Convenience function for quick signal generation
def get_momentum_signal(prices: List[int], rsi_period: int = 13) -> TradingSignal:
    """
    Quick momentum signal generation.

    Args:
        prices: Price series (scaled integers)
        rsi_period: RSI period (default 13, Fibonacci)

    Returns:
        TradingSignal
    """
    strategy = MomentumStrategy(rsi_period=rsi_period)
    return strategy.generate_signal(prices)

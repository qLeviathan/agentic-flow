#!/usr/bin/env python3
"""
Comprehensive Backtesting Engine for Fibonacci-Based Trading Strategies

This module provides a complete backtesting framework that integrates:
1. Multiple Fibonacci-based trading strategies
2. Lucas sequence time-based exits
3. Momentum strategies with integer encoding
4. Risk management using Fibonacci ratios
5. Performance metrics with Zeckendorf compression
6. AgentDB integration for strategy learning and optimization

Architecture:
- Strategy Testing Framework: Fibonacci, Lucas, Momentum, Mean Reversion, Breakout
- Risk Management: Position sizing, Stop-loss, Take-profit at Fibonacci levels
- Performance Metrics: Sharpe, Sortino, Calmar ratios with integer encoding
- Multi-Strategy Testing: Grid search across all Fibonacci level combinations
- AgentDB Integration: Store successful strategies and track causal relationships

Author: Agentic Flow System
License: MIT
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Callable, Any, Union
from dataclasses import dataclass, field, asdict
from enum import Enum
import json
import subprocess
from datetime import datetime, timedelta
from collections import defaultdict
import warnings

warnings.filterwarnings('ignore')


# ============================================================================
# Fibonacci and Lucas Sequence Utilities
# ============================================================================

class FibonacciLevels(Enum):
    """Standard Fibonacci retracement and extension levels"""
    LEVEL_0 = 0.0
    LEVEL_236 = 0.236
    LEVEL_382 = 0.382
    LEVEL_500 = 0.500
    LEVEL_618 = 0.618
    LEVEL_786 = 0.786
    LEVEL_1000 = 1.000
    LEVEL_1272 = 1.272
    LEVEL_1618 = 1.618
    LEVEL_2618 = 2.618


def generate_fibonacci_sequence(n: int) -> List[int]:
    """Generate Fibonacci sequence up to n terms"""
    if n <= 0:
        return []
    elif n == 1:
        return [1]
    elif n == 2:
        return [1, 1]

    fib = [1, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib


def generate_lucas_sequence(n: int) -> List[int]:
    """Generate Lucas sequence up to n terms"""
    if n <= 0:
        return []
    elif n == 1:
        return [2]
    elif n == 2:
        return [2, 1]

    lucas = [2, 1]
    for i in range(2, n):
        lucas.append(lucas[i-1] + lucas[i-2])
    return lucas


def zeckendorf_encode(n: int) -> List[int]:
    """
    Encode integer using Zeckendorf representation (sum of non-consecutive Fibonacci numbers)
    Returns list of Fibonacci indices used in representation
    """
    if n <= 0:
        return []

    # Generate enough Fibonacci numbers
    fib = generate_fibonacci_sequence(50)

    # Find largest Fibonacci number <= n
    indices = []
    remainder = n

    for i in range(len(fib) - 1, -1, -1):
        if fib[i] <= remainder:
            indices.append(i)
            remainder -= fib[i]
            if remainder == 0:
                break

    return sorted(indices)


def zeckendorf_decode(indices: List[int]) -> int:
    """Decode Zeckendorf representation back to integer"""
    if not indices:
        return 0

    fib = generate_fibonacci_sequence(max(indices) + 1)
    return sum(fib[i] for i in indices)


# ============================================================================
# Data Classes for Trading
# ============================================================================

@dataclass
class OHLCVData:
    """OHLCV (Open, High, Low, Close, Volume) market data"""
    timestamp: pd.Timestamp
    open: float
    high: float
    low: float
    close: float
    volume: float

    def __post_init__(self):
        """Convert timestamp to pandas Timestamp if needed"""
        if not isinstance(self.timestamp, pd.Timestamp):
            self.timestamp = pd.Timestamp(self.timestamp)


@dataclass
class Signal:
    """Trading signal with position information"""
    timestamp: pd.Timestamp
    signal_type: str  # 'BUY', 'SELL', 'HOLD'
    price: float
    position_size: float  # As fraction of portfolio
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    fibonacci_level: Optional[float] = None
    confidence: float = 1.0
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Trade:
    """Executed trade record"""
    entry_timestamp: pd.Timestamp
    exit_timestamp: Optional[pd.Timestamp] = None
    entry_price: float = 0.0
    exit_price: Optional[float] = None
    position_size: float = 0.0
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    pnl: float = 0.0
    pnl_pct: float = 0.0
    status: str = 'OPEN'  # 'OPEN', 'CLOSED', 'STOPPED'
    exit_reason: Optional[str] = None
    fibonacci_level: Optional[float] = None

    def close_trade(self, exit_price: float, exit_timestamp: pd.Timestamp, reason: str = 'SIGNAL'):
        """Close the trade and calculate P&L"""
        self.exit_price = exit_price
        self.exit_timestamp = exit_timestamp
        self.pnl = (exit_price - self.entry_price) * self.position_size
        self.pnl_pct = ((exit_price - self.entry_price) / self.entry_price) * 100
        self.status = 'CLOSED'
        self.exit_reason = reason


@dataclass
class PerformanceMetrics:
    """Comprehensive performance metrics for backtesting"""
    total_return: float = 0.0
    sharpe_ratio: float = 0.0
    sortino_ratio: float = 0.0
    calmar_ratio: float = 0.0
    max_drawdown: float = 0.0
    max_drawdown_duration: int = 0
    win_rate: float = 0.0
    profit_factor: float = 0.0
    expectancy: float = 0.0
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    avg_win: float = 0.0
    avg_loss: float = 0.0
    largest_win: float = 0.0
    largest_loss: float = 0.0
    avg_trade_duration: float = 0.0

    # Integer encoded metrics using Zeckendorf
    encoded_sharpe: List[int] = field(default_factory=list)
    encoded_max_drawdown: List[int] = field(default_factory=list)

    def encode_metrics(self):
        """Encode key metrics using Zeckendorf compression"""
        # Encode Sharpe ratio (scaled by 1000 to preserve precision)
        if self.sharpe_ratio > 0:
            sharpe_int = int(self.sharpe_ratio * 1000)
            self.encoded_sharpe = zeckendorf_encode(sharpe_int)

        # Encode max drawdown (scaled by 1000, must be positive)
        if self.max_drawdown != 0:  # Changed from > 0 to != 0
            dd_int = int(abs(self.max_drawdown) * 1000)
            if dd_int > 0:  # Only encode if non-zero
                self.encoded_max_drawdown = zeckendorf_encode(dd_int)


# ============================================================================
# Strategy Base Class
# ============================================================================

class Strategy:
    """Base class for all trading strategies"""

    def __init__(self, name: str, params: Dict[str, Any] = None):
        self.name = name
        self.params = params or {}
        self.trades: List[Trade] = []
        self.signals: List[Signal] = []

    def generate_signal(self, data: pd.DataFrame, index: int) -> Signal:
        """
        Generate trading signal based on market data

        Args:
            data: DataFrame with OHLCV data
            index: Current position in the data

        Returns:
            Signal object with trading decision
        """
        raise NotImplementedError("Subclasses must implement generate_signal")

    def calculate_position_size(self, signal: Signal, portfolio_value: float) -> float:
        """Calculate position size based on Fibonacci ratios"""
        # Default to golden ratio inverse (0.618) of portfolio
        base_size = self.params.get('base_position_size', 0.618)
        return portfolio_value * base_size * signal.confidence

    def to_dict(self) -> Dict[str, Any]:
        """Convert strategy to dictionary for serialization"""
        return {
            'name': self.name,
            'params': self.params,
            'total_trades': len(self.trades),
            'total_signals': len(self.signals)
        }


# ============================================================================
# Fibonacci Retracement Strategy
# ============================================================================

class FibonacciRetracementStrategy(Strategy):
    """
    Strategy based on Fibonacci retracement levels

    Entry signals:
    - BUY when price retraces to Fibonacci support (38.2%, 50%, 61.8%)
    - SELL when price reaches Fibonacci resistance

    Exit signals:
    - Take profit at Fibonacci extension levels (127.2%, 161.8%)
    - Stop loss at next Fibonacci level below entry
    """

    def __init__(self, params: Dict[str, Any] = None):
        default_params = {
            'entry_levels': [0.382, 0.500, 0.618],  # Fibonacci retracement levels
            'exit_levels': [1.272, 1.618],  # Fibonacci extension levels
            'lookback_period': 20,  # Period to identify swing high/low
            'base_position_size': 0.618,  # Golden ratio position sizing
        }
        if params:
            default_params.update(params)

        super().__init__('FibonacciRetracement', default_params)

    def find_swing_points(self, data: pd.DataFrame, index: int) -> Tuple[float, float]:
        """Find recent swing high and swing low"""
        lookback = self.params['lookback_period']
        start_idx = max(0, index - lookback)

        window = data.iloc[start_idx:index+1]
        swing_high = window['high'].max()
        swing_low = window['low'].min()

        return swing_high, swing_low

    def calculate_fibonacci_levels(self, swing_high: float, swing_low: float) -> Dict[str, float]:
        """Calculate Fibonacci retracement and extension levels"""
        diff = swing_high - swing_low

        levels = {}
        # Retracement levels (from swing high)
        for level in FibonacciLevels:
            level_value = level.value
            if level_value <= 1.0:
                levels[f'retracement_{level.name}'] = swing_high - (diff * level_value)
            else:
                # Extension levels (from swing low)
                levels[f'extension_{level.name}'] = swing_low + (diff * level_value)

        return levels

    def generate_signal(self, data: pd.DataFrame, index: int) -> Signal:
        """Generate trading signal based on Fibonacci levels"""
        if index < self.params['lookback_period']:
            return Signal(
                timestamp=data.iloc[index]['timestamp'],
                signal_type='HOLD',
                price=data.iloc[index]['close'],
                position_size=0.0
            )

        current_price = data.iloc[index]['close']
        timestamp = data.iloc[index]['timestamp']

        swing_high, swing_low = self.find_swing_points(data, index)
        fib_levels = self.calculate_fibonacci_levels(swing_high, swing_low)

        # Check for BUY signals at retracement levels
        for entry_level in self.params['entry_levels']:
            level_name = f'retracement_LEVEL_{int(entry_level * 1000)}'
            if level_name in fib_levels:
                level_price = fib_levels[level_name]

                # Price bouncing off Fibonacci support
                if abs(current_price - level_price) / level_price < 0.01:  # Within 1%
                    # Set stop loss at next lower Fibonacci level
                    stop_loss = swing_low * 0.95  # 5% below swing low

                    # Set take profit at Fibonacci extension
                    take_profit = fib_levels.get('extension_LEVEL_1618', current_price * 1.1)

                    signal = Signal(
                        timestamp=timestamp,
                        signal_type='BUY',
                        price=current_price,
                        position_size=self.params['base_position_size'],
                        stop_loss=stop_loss,
                        take_profit=take_profit,
                        fibonacci_level=entry_level,
                        confidence=1.0 - (entry_level - 0.382) / 0.618,  # Higher confidence at 38.2%
                        metadata={'swing_high': swing_high, 'swing_low': swing_low}
                    )
                    self.signals.append(signal)
                    return signal

        # Check for SELL signals at resistance
        if current_price >= swing_high * 0.99:  # Near swing high
            signal = Signal(
                timestamp=timestamp,
                signal_type='SELL',
                price=current_price,
                position_size=1.0,  # Close entire position
                fibonacci_level=1.0,
                confidence=0.8,
                metadata={'swing_high': swing_high, 'swing_low': swing_low}
            )
            self.signals.append(signal)
            return signal

        return Signal(
            timestamp=timestamp,
            signal_type='HOLD',
            price=current_price,
            position_size=0.0
        )


# ============================================================================
# Lucas Sequence Time-Based Exit Strategy
# ============================================================================

class LucasSequenceExitStrategy(Strategy):
    """
    Strategy that uses Lucas sequence for time-based exits

    Exit rules:
    - Exit positions after Lucas sequence days (2, 1, 3, 4, 7, 11, 18, 29, 47...)
    - Adjust exit timing based on market volatility
    """

    def __init__(self, params: Dict[str, Any] = None):
        default_params = {
            'lucas_terms': 10,  # Number of Lucas terms to use
            'volatility_adjustment': True,  # Adjust timing based on volatility
            'max_hold_days': 47,  # Maximum hold period (Lucas[9])
        }
        if params:
            default_params.update(params)

        super().__init__('LucasSequenceExit', default_params)
        self.lucas_sequence = generate_lucas_sequence(self.params['lucas_terms'])

    def get_exit_day(self, entry_index: int, volatility: float = 1.0) -> int:
        """
        Determine exit day based on Lucas sequence and volatility

        Args:
            entry_index: Index when position was entered
            volatility: Current market volatility (1.0 = normal)

        Returns:
            Number of days to hold position
        """
        # Select Lucas number based on volatility
        if volatility < 0.5:  # Low volatility - longer hold
            lucas_idx = min(len(self.lucas_sequence) - 1, 6)  # Lucas[6] = 18
        elif volatility > 2.0:  # High volatility - shorter hold
            lucas_idx = 2  # Lucas[2] = 3
        else:  # Normal volatility
            lucas_idx = 4  # Lucas[4] = 7

        hold_days = self.lucas_sequence[lucas_idx]

        if self.params['volatility_adjustment']:
            # Adjust for volatility, but keep result as integer
            adjusted = int(hold_days / max(volatility, 0.5))
            hold_days = max(adjusted, 1)  # Ensure at least 1 day

        return min(hold_days, self.params['max_hold_days'])

    def generate_signal(self, data: pd.DataFrame, index: int) -> Signal:
        """Generate exit signal based on Lucas sequence timing"""
        # This strategy primarily modifies exit timing, not entry
        # Return HOLD signal as it's used in combination with other strategies
        return Signal(
            timestamp=data.iloc[index]['timestamp'],
            signal_type='HOLD',
            price=data.iloc[index]['close'],
            position_size=0.0,
            metadata={'lucas_sequence': self.lucas_sequence}
        )


# ============================================================================
# Momentum Strategy with Integer Encoding
# ============================================================================

class MomentumStrategy(Strategy):
    """
    Momentum strategy using RSI and MACD with integer encoding

    Indicators:
    - RSI (Relative Strength Index) - encoded as integers
    - MACD (Moving Average Convergence Divergence) - encoded as integers

    Entry signals:
    - BUY when RSI < 30 (oversold) and MACD crosses above signal
    - SELL when RSI > 70 (overbought) and MACD crosses below signal
    """

    def __init__(self, params: Dict[str, Any] = None):
        default_params = {
            'rsi_period': 14,
            'rsi_oversold': 30,
            'rsi_overbought': 70,
            'macd_fast': 12,
            'macd_slow': 26,
            'macd_signal': 9,
            'base_position_size': 0.382,  # Fibonacci position sizing
        }
        if params:
            default_params.update(params)

        super().__init__('Momentum', default_params)

    def calculate_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        """Calculate RSI indicator"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()

        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi

    def calculate_macd(self, prices: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Tuple[pd.Series, pd.Series, pd.Series]:
        """Calculate MACD indicator"""
        exp1 = prices.ewm(span=fast, adjust=False).mean()
        exp2 = prices.ewm(span=slow, adjust=False).mean()

        macd_line = exp1 - exp2
        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
        histogram = macd_line - signal_line

        return macd_line, signal_line, histogram

    def encode_indicator(self, value: float) -> List[int]:
        """Encode indicator value using Zeckendorf representation"""
        # Scale and convert to integer
        int_value = int(abs(value) * 100)  # Preserve 2 decimal places
        return zeckendorf_encode(int_value)

    def generate_signal(self, data: pd.DataFrame, index: int) -> Signal:
        """Generate momentum-based trading signal"""
        if index < max(self.params['macd_slow'], self.params['rsi_period']):
            return Signal(
                timestamp=data.iloc[index]['timestamp'],
                signal_type='HOLD',
                price=data.iloc[index]['close'],
                position_size=0.0
            )

        # Calculate indicators
        prices = data['close'].iloc[:index+1]
        rsi = self.calculate_rsi(prices, self.params['rsi_period'])
        macd_line, signal_line, histogram = self.calculate_macd(
            prices,
            self.params['macd_fast'],
            self.params['macd_slow'],
            self.params['macd_signal']
        )

        current_rsi = rsi.iloc[-1]
        current_macd = macd_line.iloc[-1]
        current_signal = signal_line.iloc[-1]
        prev_macd = macd_line.iloc[-2]
        prev_signal = signal_line.iloc[-2]

        # Encode indicators
        encoded_rsi = self.encode_indicator(current_rsi)
        encoded_macd = self.encode_indicator(current_macd)

        current_price = data.iloc[index]['close']
        timestamp = data.iloc[index]['timestamp']

        # BUY signal: Oversold RSI + MACD bullish crossover
        if (current_rsi < self.params['rsi_oversold'] and
            prev_macd < prev_signal and current_macd > current_signal):

            signal = Signal(
                timestamp=timestamp,
                signal_type='BUY',
                price=current_price,
                position_size=self.params['base_position_size'],
                stop_loss=current_price * 0.95,  # 5% stop loss
                take_profit=current_price * 1.1,  # 10% take profit
                confidence=1.0 - (current_rsi / 100),  # Higher confidence when more oversold
                metadata={
                    'rsi': current_rsi,
                    'encoded_rsi': encoded_rsi,
                    'macd': current_macd,
                    'encoded_macd': encoded_macd,
                    'signal_line': current_signal
                }
            )
            self.signals.append(signal)
            return signal

        # SELL signal: Overbought RSI + MACD bearish crossover
        if (current_rsi > self.params['rsi_overbought'] and
            prev_macd > prev_signal and current_macd < current_signal):

            signal = Signal(
                timestamp=timestamp,
                signal_type='SELL',
                price=current_price,
                position_size=1.0,
                confidence=(current_rsi - 50) / 50,  # Higher confidence when more overbought
                metadata={
                    'rsi': current_rsi,
                    'encoded_rsi': encoded_rsi,
                    'macd': current_macd,
                    'encoded_macd': encoded_macd,
                    'signal_line': current_signal
                }
            )
            self.signals.append(signal)
            return signal

        return Signal(
            timestamp=timestamp,
            signal_type='HOLD',
            price=current_price,
            position_size=0.0,
            metadata={
                'rsi': current_rsi,
                'encoded_rsi': encoded_rsi,
                'macd': current_macd,
                'encoded_macd': encoded_macd
            }
        )


# ============================================================================
# Mean Reversion Strategy with Fibonacci Bounds
# ============================================================================

class MeanReversionStrategy(Strategy):
    """
    Mean reversion strategy using Fibonacci-based bands

    Entry signals:
    - BUY when price is 1.618 standard deviations below mean
    - SELL when price is 1.618 standard deviations above mean

    Exit signals:
    - Exit when price returns to mean (0.0 standard deviations)
    """

    def __init__(self, params: Dict[str, Any] = None):
        default_params = {
            'lookback_period': 20,
            'entry_std_multiplier': 1.618,  # Golden ratio
            'exit_std_multiplier': 0.382,  # Fibonacci retracement
            'base_position_size': 0.618,
        }
        if params:
            default_params.update(params)

        super().__init__('MeanReversion', default_params)

    def generate_signal(self, data: pd.DataFrame, index: int) -> Signal:
        """Generate mean reversion signal"""
        if index < self.params['lookback_period']:
            return Signal(
                timestamp=data.iloc[index]['timestamp'],
                signal_type='HOLD',
                price=data.iloc[index]['close'],
                position_size=0.0
            )

        # Calculate mean and standard deviation
        lookback = self.params['lookback_period']
        prices = data['close'].iloc[index-lookback:index+1]
        mean_price = prices.mean()
        std_price = prices.std()

        current_price = data.iloc[index]['close']
        timestamp = data.iloc[index]['timestamp']

        # Calculate how many standard deviations away from mean
        z_score = (current_price - mean_price) / std_price if std_price > 0 else 0

        # BUY signal: Price significantly below mean (oversold)
        if z_score < -self.params['entry_std_multiplier']:
            upper_band = mean_price + (std_price * self.params['entry_std_multiplier'])

            signal = Signal(
                timestamp=timestamp,
                signal_type='BUY',
                price=current_price,
                position_size=self.params['base_position_size'],
                stop_loss=current_price * 0.95,
                take_profit=mean_price,  # Target: return to mean
                fibonacci_level=0.618,
                confidence=min(abs(z_score) / 3, 1.0),  # Cap at 1.0
                metadata={
                    'mean': mean_price,
                    'std': std_price,
                    'z_score': z_score,
                    'upper_band': upper_band,
                    'lower_band': mean_price - (std_price * self.params['entry_std_multiplier'])
                }
            )
            self.signals.append(signal)
            return signal

        # SELL signal: Price significantly above mean (overbought)
        if z_score > self.params['entry_std_multiplier']:
            lower_band = mean_price - (std_price * self.params['entry_std_multiplier'])

            signal = Signal(
                timestamp=timestamp,
                signal_type='SELL',
                price=current_price,
                position_size=1.0,
                fibonacci_level=0.618,
                confidence=min(z_score / 3, 1.0),
                metadata={
                    'mean': mean_price,
                    'std': std_price,
                    'z_score': z_score,
                    'upper_band': mean_price + (std_price * self.params['entry_std_multiplier']),
                    'lower_band': lower_band
                }
            )
            self.signals.append(signal)
            return signal

        return Signal(
            timestamp=timestamp,
            signal_type='HOLD',
            price=current_price,
            position_size=0.0,
            metadata={
                'mean': mean_price,
                'std': std_price,
                'z_score': z_score
            }
        )


# ============================================================================
# Breakout Strategy at Golden Ratio Levels
# ============================================================================

class BreakoutStrategy(Strategy):
    """
    Breakout strategy using golden ratio (0.618) volume and price thresholds

    Entry signals:
    - BUY when price breaks above resistance with volume > 1.618x average
    - SELL when price breaks below support with volume > 1.618x average
    """

    def __init__(self, params: Dict[str, Any] = None):
        default_params = {
            'lookback_period': 20,
            'volume_multiplier': 1.618,  # Golden ratio
            'breakout_threshold': 0.02,  # 2% breakout from range
            'base_position_size': 0.382,
        }
        if params:
            default_params.update(params)

        super().__init__('Breakout', default_params)

    def generate_signal(self, data: pd.DataFrame, index: int) -> Signal:
        """Generate breakout signal"""
        if index < self.params['lookback_period']:
            return Signal(
                timestamp=data.iloc[index]['timestamp'],
                signal_type='HOLD',
                price=data.iloc[index]['close'],
                position_size=0.0
            )

        lookback = self.params['lookback_period']
        window = data.iloc[index-lookback:index]

        # Calculate support and resistance
        resistance = window['high'].max()
        support = window['low'].min()
        price_range = resistance - support

        # Calculate average volume
        avg_volume = window['volume'].mean()

        current_price = data.iloc[index]['close']
        current_high = data.iloc[index]['high']
        current_low = data.iloc[index]['low']
        current_volume = data.iloc[index]['volume']
        timestamp = data.iloc[index]['timestamp']

        # Check for volume surge
        volume_surge = current_volume > (avg_volume * self.params['volume_multiplier'])

        # BUY signal: Breakout above resistance with high volume
        if (current_high > resistance and
            volume_surge and
            (current_high - resistance) / price_range > self.params['breakout_threshold']):

            # Calculate Fibonacci extension target
            target_extension = resistance + (price_range * 1.618)

            signal = Signal(
                timestamp=timestamp,
                signal_type='BUY',
                price=current_price,
                position_size=self.params['base_position_size'],
                stop_loss=resistance * 0.98,  # Stop just below breakout level
                take_profit=target_extension,
                fibonacci_level=1.618,
                confidence=min(current_volume / avg_volume / 3, 1.0),
                metadata={
                    'resistance': resistance,
                    'support': support,
                    'avg_volume': avg_volume,
                    'current_volume': current_volume,
                    'volume_ratio': current_volume / avg_volume,
                    'price_range': price_range
                }
            )
            self.signals.append(signal)
            return signal

        # SELL signal: Breakdown below support with high volume
        if (current_low < support and
            volume_surge and
            (support - current_low) / price_range > self.params['breakout_threshold']):

            signal = Signal(
                timestamp=timestamp,
                signal_type='SELL',
                price=current_price,
                position_size=1.0,
                fibonacci_level=1.618,
                confidence=min(current_volume / avg_volume / 3, 1.0),
                metadata={
                    'resistance': resistance,
                    'support': support,
                    'avg_volume': avg_volume,
                    'current_volume': current_volume,
                    'volume_ratio': current_volume / avg_volume,
                    'price_range': price_range
                }
            )
            self.signals.append(signal)
            return signal

        return Signal(
            timestamp=timestamp,
            signal_type='HOLD',
            price=current_price,
            position_size=0.0,
            metadata={
                'resistance': resistance,
                'support': support,
                'volume_ratio': current_volume / avg_volume if avg_volume > 0 else 0
            }
        )


# ============================================================================
# Risk Management System
# ============================================================================

class RiskManager:
    """
    Risk management system using Fibonacci ratios

    Features:
    - Position sizing using Fibonacci ratios (0.382, 0.618, 1.0, 1.618)
    - Stop-loss at Fibonacci support levels
    - Take-profit at Fibonacci extension levels
    - Portfolio risk limits
    """

    def __init__(self, config: Dict[str, Any] = None):
        default_config = {
            'max_position_size': 0.618,  # Max 61.8% of portfolio in single position
            'max_portfolio_risk': 0.236,  # Max 23.6% portfolio at risk
            'fibonacci_position_sizes': [0.236, 0.382, 0.618, 1.0],
            'default_stop_loss_pct': 0.05,  # 5% default stop loss
            'risk_reward_ratio': 1.618,  # Minimum risk/reward ratio (golden ratio)
        }
        if config:
            default_config.update(config)

        self.config = default_config

    def calculate_position_size(
        self,
        signal: Signal,
        portfolio_value: float,
        current_positions: List[Trade],
        volatility: float = 1.0
    ) -> float:
        """
        Calculate optimal position size based on Fibonacci ratios and risk

        Args:
            signal: Trading signal
            portfolio_value: Current portfolio value
            current_positions: List of currently open positions
            volatility: Market volatility adjustment

        Returns:
            Position size in dollars
        """
        # Calculate available capital (not in open positions)
        capital_in_positions = sum(trade.position_size for trade in current_positions if trade.status == 'OPEN')
        available_capital = portfolio_value - capital_in_positions

        # Select Fibonacci position size based on signal confidence
        if signal.confidence >= 0.9:
            size_fraction = 0.618  # High confidence = golden ratio
        elif signal.confidence >= 0.7:
            size_fraction = 0.382
        elif signal.confidence >= 0.5:
            size_fraction = 0.236
        else:
            size_fraction = 0.146  # Low confidence = minimal

        # Adjust for volatility
        size_fraction = size_fraction / volatility

        # Apply maximum position size limit
        size_fraction = min(size_fraction, self.config['max_position_size'])

        # Calculate position size
        position_size = available_capital * size_fraction

        # Ensure we don't exceed portfolio risk limits
        max_risk_amount = portfolio_value * self.config['max_portfolio_risk']
        if signal.stop_loss:
            risk_per_share = abs(signal.price - signal.stop_loss)
            max_shares = max_risk_amount / risk_per_share if risk_per_share > 0 else 0
            position_size = min(position_size, max_shares * signal.price)

        return position_size

    def calculate_stop_loss(
        self,
        entry_price: float,
        signal: Signal,
        data: pd.DataFrame,
        index: int
    ) -> float:
        """Calculate stop-loss price at Fibonacci support level"""
        if signal.stop_loss:
            return signal.stop_loss

        # Calculate stop loss at Fibonacci retracement below entry
        stop_loss = entry_price * (1 - self.config['default_stop_loss_pct'])

        # Alternative: Use recent swing low (should be minimum, not maximum)
        if index >= 20:
            recent_low = data['low'].iloc[index-20:index].min()
            fibonacci_stop = recent_low * 0.98  # 2% below swing low
            stop_loss = min(stop_loss, fibonacci_stop)  # Use lower of the two

        return stop_loss

    def calculate_take_profit(
        self,
        entry_price: float,
        stop_loss: float,
        signal: Signal
    ) -> float:
        """Calculate take-profit at Fibonacci extension level"""
        if signal.take_profit:
            return signal.take_profit

        # Calculate risk
        risk = abs(entry_price - stop_loss)

        # Calculate reward using golden ratio
        reward = risk * self.config['risk_reward_ratio']

        # Take profit at Fibonacci extension
        take_profit = entry_price + reward

        return take_profit

    def validate_trade(
        self,
        signal: Signal,
        portfolio_value: float,
        current_positions: List[Trade]
    ) -> Tuple[bool, str]:
        """
        Validate if trade meets risk management criteria

        Returns:
            (is_valid, reason)
        """
        # Check if we have capacity for new position
        open_positions = sum(1 for trade in current_positions if trade.status == 'OPEN')
        if open_positions >= 5:  # Max 5 concurrent positions
            return False, "Maximum concurrent positions reached"

        # Check portfolio risk
        if signal.stop_loss:
            risk_amount = abs(signal.price - signal.stop_loss) * signal.position_size
            risk_pct = risk_amount / portfolio_value
            if risk_pct > self.config['max_portfolio_risk']:
                return False, f"Trade risk ({risk_pct:.2%}) exceeds maximum ({self.config['max_portfolio_risk']:.2%})"

        # Check risk/reward ratio
        if signal.stop_loss and signal.take_profit:
            risk = abs(signal.price - signal.stop_loss)
            reward = abs(signal.take_profit - signal.price)
            rr_ratio = reward / risk if risk > 0 else 0
            if rr_ratio < self.config['risk_reward_ratio']:
                return False, f"Risk/reward ratio ({rr_ratio:.2f}) below minimum ({self.config['risk_reward_ratio']:.2f})"

        return True, "Trade validated"


# ============================================================================
# Performance Metrics Calculator
# ============================================================================

class PerformanceAnalyzer:
    """
    Calculate comprehensive performance metrics with integer encoding

    Metrics:
    - Sharpe ratio, Sortino ratio, Calmar ratio
    - Maximum drawdown with Zeckendorf compression
    - Win rate, profit factor, expectancy
    - Trade statistics
    """

    def __init__(self):
        self.risk_free_rate = 0.02  # 2% annual risk-free rate

    def calculate_returns(self, equity_curve: pd.Series) -> pd.Series:
        """Calculate period returns from equity curve"""
        return equity_curve.pct_change().fillna(0)

    def calculate_sharpe_ratio(self, returns: pd.Series, periods_per_year: int = 252) -> float:
        """Calculate Sharpe ratio"""
        if len(returns) == 0 or returns.std() == 0:
            return 0.0

        excess_returns = returns - (self.risk_free_rate / periods_per_year)
        sharpe = np.sqrt(periods_per_year) * (excess_returns.mean() / returns.std())
        return sharpe

    def calculate_sortino_ratio(self, returns: pd.Series, periods_per_year: int = 252) -> float:
        """Calculate Sortino ratio (only penalizes downside volatility)"""
        if len(returns) == 0:
            return 0.0

        excess_returns = returns - (self.risk_free_rate / periods_per_year)
        downside_returns = returns[returns < 0]

        if len(downside_returns) == 0 or downside_returns.std() == 0:
            return 0.0

        sortino = np.sqrt(periods_per_year) * (excess_returns.mean() / downside_returns.std())
        return sortino

    def calculate_max_drawdown(self, equity_curve: pd.Series) -> Tuple[float, int]:
        """
        Calculate maximum drawdown and duration

        Returns:
            (max_drawdown_pct, max_drawdown_duration_days)
        """
        if len(equity_curve) == 0:
            return 0.0, 0

        # Calculate running maximum
        running_max = equity_curve.expanding().max()

        # Calculate drawdown
        drawdown = (equity_curve - running_max) / running_max
        max_drawdown = drawdown.min()

        # Calculate drawdown duration
        is_drawdown = drawdown < 0
        drawdown_periods = []
        current_period = 0

        for in_dd in is_drawdown:
            if in_dd:
                current_period += 1
            else:
                if current_period > 0:
                    drawdown_periods.append(current_period)
                current_period = 0

        if current_period > 0:
            drawdown_periods.append(current_period)

        max_dd_duration = max(drawdown_periods) if drawdown_periods else 0

        return max_drawdown, max_dd_duration

    def calculate_calmar_ratio(
        self,
        returns: pd.Series,
        max_drawdown: float,
        periods_per_year: int = 252
    ) -> float:
        """Calculate Calmar ratio (annual return / max drawdown)"""
        if max_drawdown == 0:
            return 0.0

        annual_return = returns.mean() * periods_per_year
        calmar = annual_return / abs(max_drawdown)
        return calmar

    def analyze_trades(self, trades: List[Trade]) -> PerformanceMetrics:
        """
        Analyze completed trades and calculate comprehensive metrics

        Args:
            trades: List of completed trades

        Returns:
            PerformanceMetrics object with all calculated metrics
        """
        closed_trades = [t for t in trades if t.status == 'CLOSED']

        if not closed_trades:
            return PerformanceMetrics()

        # Basic trade statistics
        total_trades = len(closed_trades)
        winning_trades = [t for t in closed_trades if t.pnl > 0]
        losing_trades = [t for t in closed_trades if t.pnl < 0]

        num_winners = len(winning_trades)
        num_losers = len(losing_trades)

        # Win rate
        win_rate = num_winners / total_trades if total_trades > 0 else 0

        # Average win/loss
        avg_win = np.mean([t.pnl for t in winning_trades]) if winning_trades else 0
        avg_loss = np.mean([t.pnl for t in losing_trades]) if losing_trades else 0

        # Largest win/loss
        largest_win = max([t.pnl for t in winning_trades]) if winning_trades else 0
        largest_loss = min([t.pnl for t in losing_trades]) if losing_trades else 0

        # Profit factor
        gross_profit = sum([t.pnl for t in winning_trades]) if winning_trades else 0
        gross_loss = abs(sum([t.pnl for t in losing_trades])) if losing_trades else 0
        profit_factor = gross_profit / gross_loss if gross_loss > 0 else 0

        # Expectancy
        expectancy = (win_rate * avg_win) - ((1 - win_rate) * abs(avg_loss))

        # Average trade duration
        durations = []
        for trade in closed_trades:
            if trade.exit_timestamp and trade.entry_timestamp:
                duration = (trade.exit_timestamp - trade.entry_timestamp).days
                durations.append(duration)
        avg_duration = np.mean(durations) if durations else 0

        # Calculate equity curve for ratio metrics
        equity_curve = pd.Series([0] + [sum(t.pnl for t in closed_trades[:i+1])
                                        for i in range(len(closed_trades))])
        returns = self.calculate_returns(equity_curve)

        # Calculate risk-adjusted metrics
        sharpe_ratio = self.calculate_sharpe_ratio(returns)
        sortino_ratio = self.calculate_sortino_ratio(returns)
        max_dd, max_dd_duration = self.calculate_max_drawdown(equity_curve)
        calmar_ratio = self.calculate_calmar_ratio(returns, max_dd)

        # Total return
        total_return = equity_curve.iloc[-1] if len(equity_curve) > 0 else 0

        # Create metrics object
        metrics = PerformanceMetrics(
            total_return=total_return,
            sharpe_ratio=sharpe_ratio,
            sortino_ratio=sortino_ratio,
            calmar_ratio=calmar_ratio,
            max_drawdown=max_dd,
            max_drawdown_duration=max_dd_duration,
            win_rate=win_rate,
            profit_factor=profit_factor,
            expectancy=expectancy,
            total_trades=total_trades,
            winning_trades=num_winners,
            losing_trades=num_losers,
            avg_win=avg_win,
            avg_loss=avg_loss,
            largest_win=largest_win,
            largest_loss=largest_loss,
            avg_trade_duration=avg_duration
        )

        # Encode metrics using Zeckendorf
        metrics.encode_metrics()

        return metrics


# ============================================================================
# Backtesting Engine
# ============================================================================

class BacktestingEngine:
    """
    Comprehensive backtesting engine for Fibonacci-based trading strategies

    Features:
    - Multiple strategy support
    - Risk management integration
    - Performance analysis
    - AgentDB integration for learning
    - Multi-strategy testing
    """

    def __init__(
        self,
        initial_capital: float = 100000.0,
        commission: float = 0.001,  # 0.1% commission
        slippage: float = 0.001,  # 0.1% slippage
    ):
        self.initial_capital = initial_capital
        self.commission = commission
        self.slippage = slippage

        self.risk_manager = RiskManager()
        self.performance_analyzer = PerformanceAnalyzer()

        self.reset()

    def reset(self):
        """Reset backtesting engine state"""
        self.portfolio_value = self.initial_capital
        self.cash = self.initial_capital
        self.positions: List[Trade] = []
        self.closed_trades: List[Trade] = []
        self.equity_curve: List[float] = [self.initial_capital]
        self.timestamps: List[pd.Timestamp] = []

    def run_backtest(
        self,
        data: pd.DataFrame,
        strategy: Strategy,
        verbose: bool = False
    ) -> Tuple[PerformanceMetrics, List[Trade], pd.DataFrame]:
        """
        Run backtest for a single strategy

        Args:
            data: DataFrame with OHLCV data (columns: timestamp, open, high, low, close, volume)
            strategy: Strategy instance to test
            verbose: Print progress information

        Returns:
            (performance_metrics, trades, equity_curve_df)
        """
        self.reset()

        # Ensure data has required columns
        required_cols = ['timestamp', 'open', 'high', 'low', 'close', 'volume']
        if not all(col in data.columns for col in required_cols):
            raise ValueError(f"Data must contain columns: {required_cols}")

        data = data.copy().reset_index(drop=True)

        for i in range(len(data)):
            timestamp = data.iloc[i]['timestamp']
            self.timestamps.append(timestamp)

            # Generate signal from strategy
            signal = strategy.generate_signal(data, i)

            # Process signal
            if signal.signal_type == 'BUY':
                self._execute_buy(signal, data, i)
            elif signal.signal_type == 'SELL':
                self._execute_sell(signal, data, i)

            # Check stop-loss and take-profit for open positions
            self._check_exit_conditions(data, i)

            # Update portfolio value
            self._update_portfolio_value(data.iloc[i]['close'])

            if verbose and i % 100 == 0:
                print(f"Progress: {i}/{len(data)} bars, Portfolio: ${self.portfolio_value:,.2f}")

        # Close any remaining open positions at the end
        if self.positions:
            final_price = data.iloc[-1]['close']
            final_timestamp = data.iloc[-1]['timestamp']
            for position in self.positions:
                if position.status == 'OPEN':
                    position.close_trade(final_price, final_timestamp, 'END_OF_DATA')
                    self.closed_trades.append(position)
            self.positions = []

        # Analyze performance
        all_trades = self.closed_trades
        metrics = self.performance_analyzer.analyze_trades(all_trades)

        # Create equity curve DataFrame
        # Ensure timestamps and equity curve have same length
        min_len = min(len(self.timestamps), len(self.equity_curve))
        equity_df = pd.DataFrame({
            'timestamp': self.timestamps[:min_len],
            'equity': self.equity_curve[:min_len]
        })

        if verbose:
            print(f"\n{'='*60}")
            print(f"Backtest Results for {strategy.name}")
            print(f"{'='*60}")
            print(f"Total Return: ${metrics.total_return:,.2f} ({metrics.total_return/self.initial_capital*100:.2f}%)")
            print(f"Sharpe Ratio: {metrics.sharpe_ratio:.2f}")
            print(f"Max Drawdown: {metrics.max_drawdown*100:.2f}%")
            print(f"Win Rate: {metrics.win_rate*100:.2f}%")
            print(f"Total Trades: {metrics.total_trades}")
            print(f"{'='*60}\n")

        return metrics, all_trades, equity_df

    def _execute_buy(self, signal: Signal, data: pd.DataFrame, index: int):
        """Execute buy order"""
        # Validate trade with risk manager
        is_valid, reason = self.risk_manager.validate_trade(
            signal,
            self.portfolio_value,
            self.positions
        )

        if not is_valid:
            return

        # Calculate position size
        position_size = self.risk_manager.calculate_position_size(
            signal,
            self.portfolio_value,
            self.positions
        )

        # Apply slippage and commission
        entry_price = signal.price * (1 + self.slippage)
        total_cost = position_size + (position_size * self.commission)

        # Check if we have enough cash
        if total_cost > self.cash:
            position_size = (self.cash / (1 + self.commission)) * 0.99  # Leave 1% buffer
            total_cost = position_size + (position_size * self.commission)

        if position_size < 100:  # Minimum position size
            return

        # Calculate stop-loss and take-profit
        stop_loss = self.risk_manager.calculate_stop_loss(entry_price, signal, data, index)
        take_profit = self.risk_manager.calculate_take_profit(entry_price, stop_loss, signal)

        # Create trade
        trade = Trade(
            entry_timestamp=signal.timestamp,
            entry_price=entry_price,
            position_size=position_size / entry_price,  # Number of shares
            stop_loss=stop_loss,
            take_profit=take_profit,
            fibonacci_level=signal.fibonacci_level
        )

        self.positions.append(trade)
        self.cash -= total_cost

    def _execute_sell(self, signal: Signal, data: pd.DataFrame, index: int):
        """Execute sell order (close positions)"""
        if not self.positions:
            return

        # Close all open positions
        exit_price = signal.price * (1 - self.slippage)

        for position in self.positions:
            if position.status == 'OPEN':
                position.close_trade(exit_price, signal.timestamp, 'SIGNAL')

                # Calculate proceeds
                proceeds = position.position_size * exit_price
                commission = proceeds * self.commission
                self.cash += proceeds - commission

                self.closed_trades.append(position)

        self.positions = [p for p in self.positions if p.status == 'OPEN']

    def _check_exit_conditions(self, data: pd.DataFrame, index: int):
        """Check stop-loss and take-profit conditions"""
        current_high = data.iloc[index]['high']
        current_low = data.iloc[index]['low']
        timestamp = data.iloc[index]['timestamp']

        for position in self.positions:
            if position.status != 'OPEN':
                continue

            # Check stop-loss
            if position.stop_loss and current_low <= position.stop_loss:
                exit_price = position.stop_loss * (1 - self.slippage)
                position.close_trade(exit_price, timestamp, 'STOP_LOSS')

                proceeds = position.position_size * exit_price
                commission = proceeds * self.commission
                self.cash += proceeds - commission

                self.closed_trades.append(position)

            # Check take-profit
            elif position.take_profit and current_high >= position.take_profit:
                exit_price = position.take_profit * (1 - self.slippage)
                position.close_trade(exit_price, timestamp, 'TAKE_PROFIT')

                proceeds = position.position_size * exit_price
                commission = proceeds * self.commission
                self.cash += proceeds - commission

                self.closed_trades.append(position)

        self.positions = [p for p in self.positions if p.status == 'OPEN']

    def _update_portfolio_value(self, current_price: float):
        """Update portfolio value"""
        positions_value = sum(
            p.position_size * current_price
            for p in self.positions
            if p.status == 'OPEN'
        )
        self.portfolio_value = self.cash + positions_value
        self.equity_curve.append(self.portfolio_value)

    def run_multi_strategy_test(
        self,
        data: pd.DataFrame,
        strategies: List[Strategy],
        combination_mode: str = 'sequential'  # 'sequential' or 'ensemble'
    ) -> Dict[str, Any]:
        """
        Test multiple strategies

        Args:
            data: Market data
            strategies: List of strategies to test
            combination_mode: How to combine strategies

        Returns:
            Dictionary with results for each strategy
        """
        results = {}

        for strategy in strategies:
            print(f"\nTesting strategy: {strategy.name}")
            metrics, trades, equity_df = self.run_backtest(data, strategy, verbose=True)

            results[strategy.name] = {
                'metrics': metrics,
                'trades': trades,
                'equity_curve': equity_df,
                'params': strategy.params
            }

        return results

    def grid_search_fibonacci_levels(
        self,
        data: pd.DataFrame,
        base_strategy_class: type,
        level_param_name: str = 'entry_levels',
        test_levels: List[List[float]] = None
    ) -> pd.DataFrame:
        """
        Grid search across different Fibonacci level combinations

        Args:
            data: Market data
            base_strategy_class: Strategy class to test
            level_param_name: Parameter name for Fibonacci levels
            test_levels: List of level combinations to test

        Returns:
            DataFrame with results for each combination
        """
        if test_levels is None:
            # Generate combinations of Fibonacci levels
            test_levels = [
                [0.236],
                [0.382],
                [0.618],
                [0.236, 0.382],
                [0.382, 0.618],
                [0.236, 0.382, 0.618],
                [0.382, 0.5, 0.618],
                [0.236, 0.382, 0.5, 0.618, 0.786]
            ]

        results = []

        for levels in test_levels:
            params = {level_param_name: levels}
            strategy = base_strategy_class(params)

            metrics, trades, _ = self.run_backtest(data, strategy, verbose=False)

            result = {
                'levels': str(levels),
                'total_return': metrics.total_return,
                'sharpe_ratio': metrics.sharpe_ratio,
                'sortino_ratio': metrics.sortino_ratio,
                'max_drawdown': metrics.max_drawdown,
                'win_rate': metrics.win_rate,
                'total_trades': metrics.total_trades,
                'profit_factor': metrics.profit_factor
            }
            results.append(result)

            print(f"Tested {strategy.name} with levels {levels}: "
                  f"Return=${metrics.total_return:,.2f}, "
                  f"Sharpe={metrics.sharpe_ratio:.2f}, "
                  f"Trades={metrics.total_trades}")

        return pd.DataFrame(results)


# ============================================================================
# AgentDB Integration
# ============================================================================

class AgentDBIntegration:
    """
    Integration with AgentDB for strategy learning and optimization

    Features:
    - Store successful strategies using reflexion
    - Track causal relationships between strategy parameters and performance
    - Build skill library from winning strategies
    - Query for similar successful strategies
    """

    def __init__(self):
        self.agentdb_available = self._check_agentdb()

    def _check_agentdb(self) -> bool:
        """Check if AgentDB CLI is available"""
        try:
            result = subprocess.run(
                ['npx', 'agentdb', '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except Exception:
            return False

    def store_strategy(
        self,
        strategy: Strategy,
        metrics: PerformanceMetrics,
        session_id: str = 'backtesting'
    ) -> bool:
        """
        Store successful strategy in AgentDB using reflexion

        Args:
            strategy: Strategy that was tested
            metrics: Performance metrics achieved
            session_id: Session identifier

        Returns:
            Success boolean
        """
        if not self.agentdb_available:
            print("Warning: AgentDB not available. Skipping storage.")
            return False

        # Only store strategies with positive returns and Sharpe > 1
        if metrics.total_return <= 0 or metrics.sharpe_ratio < 1.0:
            return False

        # Prepare trajectory data
        trajectory = {
            'strategy_name': strategy.name,
            'params': strategy.params,
            'total_return': metrics.total_return,
            'sharpe_ratio': metrics.sharpe_ratio,
            'win_rate': metrics.win_rate,
            'max_drawdown': metrics.max_drawdown,
            'total_trades': metrics.total_trades
        }

        # Determine verdict score (0-1) based on performance
        # Normalize sharpe ratio (assume max of 3.0)
        verdict_score = min(metrics.sharpe_ratio / 3.0, 1.0)

        try:
            # Store in AgentDB reflexion memory
            cmd = [
                'npx', 'agentdb', 'reflexion', 'store',
                session_id,
                strategy.name,
                str(verdict_score),
                'true' if metrics.total_return > 0 else 'false',
                json.dumps(trajectory)
            ]

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)

            if result.returncode == 0:
                print(f"✓ Stored strategy '{strategy.name}' in AgentDB (score: {verdict_score:.2f})")
                return True
            else:
                print(f"✗ Failed to store strategy: {result.stderr}")
                return False

        except Exception as e:
            print(f"✗ Error storing strategy in AgentDB: {str(e)}")
            return False

    def add_causal_relationship(
        self,
        param_name: str,
        metric_name: str,
        correlation: float
    ) -> bool:
        """
        Add causal relationship between strategy parameter and performance metric

        Args:
            param_name: Strategy parameter (e.g., 'fibonacci_618')
            metric_name: Performance metric (e.g., 'win_rate')
            correlation: Correlation strength (-1 to 1)

        Returns:
            Success boolean
        """
        if not self.agentdb_available:
            return False

        try:
            cmd = [
                'npx', 'agentdb', 'causal', 'add-edge',
                param_name,
                metric_name,
                str(abs(correlation))
            ]

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)

            if result.returncode == 0:
                direction = "positively" if correlation > 0 else "negatively"
                print(f"✓ Added causal edge: {param_name} -> {metric_name} ({direction} correlated)")
                return True
            else:
                return False

        except Exception as e:
            print(f"✗ Error adding causal relationship: {str(e)}")
            return False

    def query_similar_strategies(
        self,
        strategy_description: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Query AgentDB for similar successful strategies

        Args:
            strategy_description: Description of strategy to find similar ones
            limit: Maximum number of results

        Returns:
            List of similar strategies
        """
        if not self.agentdb_available:
            return []

        try:
            cmd = [
                'npx', 'agentdb', 'skill', 'search',
                strategy_description,
                str(limit)
            ]

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)

            if result.returncode == 0:
                # Parse JSON output
                output = result.stdout.strip()
                if output:
                    strategies = json.loads(output)
                    return strategies

        except Exception as e:
            print(f"✗ Error querying strategies: {str(e)}")

        return []

    def analyze_causal_graph(
        self,
        target_metric: str = 'win_rate',
        min_correlation: float = 0.3
    ) -> List[Dict[str, Any]]:
        """
        Analyze causal graph to find parameters that influence target metric

        Args:
            target_metric: Metric to analyze (e.g., 'win_rate', 'sharpe_ratio')
            min_correlation: Minimum correlation threshold

        Returns:
            List of influencing parameters
        """
        if not self.agentdb_available:
            return []

        try:
            cmd = [
                'npx', 'agentdb', 'causal', 'query',
                '',  # No source filter
                target_metric,
                str(min_correlation)
            ]

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)

            if result.returncode == 0:
                output = result.stdout.strip()
                if output:
                    edges = json.loads(output)
                    return edges

        except Exception as e:
            print(f"✗ Error analyzing causal graph: {str(e)}")

        return []


# ============================================================================
# Utility Functions
# ============================================================================

def generate_sample_data(
    ticker: str = 'AAPL',
    start_date: str = '2023-01-01',
    end_date: str = '2024-01-01',
    num_points: int = 252
) -> pd.DataFrame:
    """
    Generate sample OHLCV data for testing

    In production, replace this with actual market data from API
    """
    dates = pd.date_range(start=start_date, end=end_date, periods=num_points)

    # Generate synthetic price data with trend and noise
    np.random.seed(42)
    base_price = 150
    trend = np.linspace(0, 20, num_points)
    noise = np.random.randn(num_points) * 5
    close_prices = base_price + trend + noise

    # Generate OHLC from close
    data = []
    for i, (date, close) in enumerate(zip(dates, close_prices)):
        daily_range = abs(np.random.randn() * 3)
        high = close + daily_range * 0.618
        low = close - daily_range * 0.382
        open_price = low + (high - low) * np.random.random()
        volume = np.random.randint(1000000, 10000000)

        data.append({
            'timestamp': date,
            'open': open_price,
            'high': high,
            'low': low,
            'close': close,
            'volume': volume
        })

    return pd.DataFrame(data)


def print_performance_report(
    strategy_name: str,
    metrics: PerformanceMetrics,
    trades: List[Trade]
):
    """Print formatted performance report"""
    print(f"\n{'='*70}")
    print(f"  PERFORMANCE REPORT: {strategy_name}")
    print(f"{'='*70}\n")

    print("📊 Returns & Risk-Adjusted Metrics")
    print(f"  Total Return:        ${metrics.total_return:>12,.2f}")
    print(f"  Sharpe Ratio:        {metrics.sharpe_ratio:>15.2f}")
    print(f"  Sortino Ratio:       {metrics.sortino_ratio:>15.2f}")
    print(f"  Calmar Ratio:        {metrics.calmar_ratio:>15.2f}")
    print(f"  Max Drawdown:        {metrics.max_drawdown*100:>14.2f}%")
    print(f"  Max DD Duration:     {metrics.max_drawdown_duration:>12} days")

    if metrics.encoded_sharpe:
        print(f"  Encoded Sharpe:      {metrics.encoded_sharpe}")
    if metrics.encoded_max_drawdown:
        print(f"  Encoded Drawdown:    {metrics.encoded_max_drawdown}")

    print(f"\n📈 Trade Statistics")
    print(f"  Total Trades:        {metrics.total_trades:>15}")
    print(f"  Winning Trades:      {metrics.winning_trades:>15}")
    print(f"  Losing Trades:       {metrics.losing_trades:>15}")
    print(f"  Win Rate:            {metrics.win_rate*100:>14.2f}%")
    print(f"  Profit Factor:       {metrics.profit_factor:>15.2f}")
    print(f"  Expectancy:          ${metrics.expectancy:>14.2f}")

    print(f"\n💰 Win/Loss Analysis")
    print(f"  Average Win:         ${metrics.avg_win:>14.2f}")
    print(f"  Average Loss:        ${metrics.avg_loss:>14.2f}")
    print(f"  Largest Win:         ${metrics.largest_win:>14.2f}")
    print(f"  Largest Loss:        ${metrics.largest_loss:>14.2f}")
    print(f"  Avg Trade Duration:  {metrics.avg_trade_duration:>12.1f} days")

    print(f"\n{'='*70}\n")


# ============================================================================
# Main Execution Example
# ============================================================================

def main():
    """
    Main function demonstrating comprehensive backtesting workflow
    """
    print("🚀 Comprehensive Fibonacci-Based Backtesting Engine")
    print("=" * 70)

    # Generate sample data (replace with real market data in production)
    print("\n📊 Generating sample market data...")
    data = generate_sample_data(ticker='AAPL', num_points=500)
    print(f"✓ Generated {len(data)} bars of data")

    # Initialize backtesting engine
    print("\n🔧 Initializing backtesting engine...")
    engine = BacktestingEngine(initial_capital=100000.0)
    print("✓ Engine initialized with $100,000 capital")

    # Initialize AgentDB integration
    agentdb = AgentDBIntegration()
    if agentdb.agentdb_available:
        print("✓ AgentDB integration enabled")
    else:
        print("⚠ AgentDB not available - strategies will not be persisted")

    # Define strategies to test
    strategies = [
        FibonacciRetracementStrategy({'entry_levels': [0.382, 0.618]}),
        MomentumStrategy({'rsi_period': 14}),
        MeanReversionStrategy({'lookback_period': 20}),
        BreakoutStrategy({'volume_multiplier': 1.618}),
    ]

    # Run multi-strategy backtest
    print(f"\n🧪 Testing {len(strategies)} strategies...")
    print("=" * 70)

    all_results = {}

    for strategy in strategies:
        print(f"\n{'─'*70}")
        print(f"Testing: {strategy.name}")
        print(f"{'─'*70}")

        # Run backtest
        metrics, trades, equity_df = engine.run_backtest(data, strategy, verbose=False)

        # Print performance report
        print_performance_report(strategy.name, metrics, trades)

        # Store in AgentDB if successful
        if agentdb.agentdb_available:
            stored = agentdb.store_strategy(strategy, metrics, session_id='fibonacci_backtest')

            if stored:
                # Add causal relationships
                if strategy.params.get('entry_levels'):
                    for level in strategy.params['entry_levels']:
                        param_name = f"fibonacci_{int(level*1000)}"
                        # Estimate correlation based on performance
                        correlation = metrics.sharpe_ratio / 5.0  # Normalize
                        agentdb.add_causal_relationship(param_name, 'sharpe_ratio', correlation)
                        agentdb.add_causal_relationship(param_name, 'win_rate', metrics.win_rate)

        all_results[strategy.name] = {
            'metrics': metrics,
            'trades': trades,
            'equity_df': equity_df
        }

    # Run Fibonacci level grid search
    print(f"\n{'='*70}")
    print("🔍 Running Fibonacci Level Grid Search")
    print(f"{'='*70}\n")

    grid_results = engine.grid_search_fibonacci_levels(
        data,
        FibonacciRetracementStrategy,
        level_param_name='entry_levels'
    )

    print("\n📊 Grid Search Results (sorted by Sharpe Ratio):")
    print(grid_results.sort_values('sharpe_ratio', ascending=False).to_string(index=False))

    # Query AgentDB for best strategies
    if agentdb.agentdb_available:
        print(f"\n{'='*70}")
        print("🔎 Querying AgentDB for Similar Successful Strategies")
        print(f"{'='*70}\n")

        similar = agentdb.query_similar_strategies("fibonacci retracement", limit=5)
        if similar:
            print(f"Found {len(similar)} similar strategies:")
            for s in similar:
                print(f"  • {s}")

        # Analyze causal relationships
        print(f"\n{'='*70}")
        print("🧠 Analyzing Causal Relationships")
        print(f"{'='*70}\n")

        causal_edges = agentdb.analyze_causal_graph('win_rate', min_correlation=0.2)
        if causal_edges:
            print("Parameters influencing win rate:")
            for edge in causal_edges:
                print(f"  • {edge}")

    print(f"\n{'='*70}")
    print("✅ Backtesting Complete!")
    print(f"{'='*70}\n")

    # Summary
    print("📈 Summary:")
    best_strategy = max(all_results.items(), key=lambda x: x[1]['metrics'].sharpe_ratio)
    print(f"  Best Strategy (by Sharpe): {best_strategy[0]}")
    print(f"  Sharpe Ratio: {best_strategy[1]['metrics'].sharpe_ratio:.2f}")
    print(f"  Total Return: ${best_strategy[1]['metrics'].total_return:,.2f}")
    print(f"  Win Rate: {best_strategy[1]['metrics'].win_rate*100:.1f}%")
    print()


if __name__ == "__main__":
    main()

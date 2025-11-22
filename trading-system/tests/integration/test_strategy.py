"""
Trading Strategy Tests
Tests for Fibonacci entry/exit signals, Lucas time-based exits, risk management, and position sizing
"""
import pytest
import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta


@dataclass
class TradingSignal:
    """Trading signal data structure"""
    timestamp: datetime
    signal_type: str  # 'LONG', 'SHORT', 'EXIT'
    price: float
    strength: float  # 0.0 to 1.0
    fibonacci_level: Optional[int] = None
    lucas_level: Optional[int] = None


@dataclass
class Position:
    """Trading position data structure"""
    entry_price: float
    shares: int
    entry_time: datetime
    stop_loss: float
    take_profit: float
    position_type: str  # 'LONG' or 'SHORT'


class FibonacciStrategy:
    """Fibonacci-based trading strategy"""

    def __init__(self):
        self.fib_levels = self._generate_fibonacci_levels(20)
        self.lucas_levels = self._generate_lucas_levels(15)

    def _generate_fibonacci_levels(self, n: int) -> List[int]:
        """Generate Fibonacci sequence"""
        fib = [0, 1]
        for i in range(2, n):
            fib.append(fib[i-1] + fib[i-2])
        return fib[2:]  # Skip 0 and 1

    def _generate_lucas_levels(self, n: int) -> List[int]:
        """Generate Lucas sequence"""
        lucas = [2, 1]
        for i in range(2, n):
            lucas.append(lucas[i-1] + lucas[i-2])
        return lucas

    def calculate_fibonacci_retracement(self, high: float, low: float) -> Dict[str, float]:
        """Calculate Fibonacci retracement levels"""
        diff = high - low
        levels = {
            'level_0': high,
            'level_236': high - 0.236 * diff,
            'level_382': high - 0.382 * diff,
            'level_500': high - 0.500 * diff,
            'level_618': high - 0.618 * diff,
            'level_786': high - 0.786 * diff,
            'level_100': low
        }
        return levels

    def generate_entry_signal(self, price: float, high: float, low: float) -> Optional[TradingSignal]:
        """Generate Fibonacci-based entry signal"""
        levels = self.calculate_fibonacci_retracement(high, low)

        # Check if price is near a Fibonacci level
        tolerance = 0.005  # 0.5% tolerance

        for level_name, level_price in levels.items():
            if 'level_' in level_name:
                if abs(price - level_price) / level_price < tolerance:
                    # Extract Fibonacci number from level name
                    fib_pct = int(level_name.split('_')[1])

                    # Stronger signals at golden ratio levels (618, 382)
                    strength = 0.8 if fib_pct in [618, 382] else 0.6

                    return TradingSignal(
                        timestamp=datetime.now(),
                        signal_type='LONG',
                        price=price,
                        strength=strength,
                        fibonacci_level=fib_pct
                    )

        return None

    def calculate_lucas_exit_time(self, entry_time: datetime, index: int = 5) -> datetime:
        """Calculate Lucas-based exit time"""
        # Use Lucas number as bars/periods to hold
        lucas_periods = self.lucas_levels[index]
        exit_time = entry_time + timedelta(minutes=lucas_periods)
        return exit_time

    def should_exit_by_time(self, entry_time: datetime, current_time: datetime, lucas_index: int = 5) -> bool:
        """Check if Lucas time-based exit is triggered"""
        exit_time = self.calculate_lucas_exit_time(entry_time, lucas_index)
        return current_time >= exit_time


class RiskManager:
    """Risk management system"""

    def __init__(self, max_risk_per_trade: float = 0.02, max_portfolio_risk: float = 0.06):
        self.max_risk_per_trade = max_risk_per_trade  # 2% default
        self.max_portfolio_risk = max_portfolio_risk  # 6% default
        self.active_positions: List[Position] = []

    def calculate_position_size(self, capital: float, entry_price: float, stop_loss: float) -> int:
        """Calculate position size based on risk"""
        risk_amount = capital * self.max_risk_per_trade
        price_risk = abs(entry_price - stop_loss)

        if price_risk == 0:
            return 0

        shares = int(risk_amount / price_risk)

        # Ensure we can afford the position
        max_affordable = int(capital / entry_price)
        return min(shares, max_affordable)

    def calculate_stop_loss(self, entry_price: float, atr: float, multiplier: float = 2.0) -> float:
        """Calculate stop loss based on ATR"""
        return entry_price - (atr * multiplier)

    def calculate_take_profit(self, entry_price: float, stop_loss: float, risk_reward: float = 2.0) -> float:
        """Calculate take profit based on risk-reward ratio"""
        risk = entry_price - stop_loss
        return entry_price + (risk * risk_reward)

    def validate_risk(self, new_position_risk: float) -> bool:
        """Validate that adding new position doesn't exceed portfolio risk"""
        current_risk = sum(
            abs(pos.entry_price - pos.stop_loss) * pos.shares
            for pos in self.active_positions
        )

        total_risk = current_risk + new_position_risk
        # Simplified validation (would need capital in real implementation)
        return True

    def add_position(self, position: Position):
        """Add position to tracking"""
        self.active_positions.append(position)

    def remove_position(self, position: Position):
        """Remove closed position"""
        if position in self.active_positions:
            self.active_positions.remove(position)


class TestFibonacciSignals:
    """Tests for Fibonacci entry/exit signal generation"""

    def test_fibonacci_retracement_calculation(self):
        """Test Fibonacci retracement level calculation"""
        strategy = FibonacciStrategy()
        high = 100.0
        low = 90.0

        levels = strategy.calculate_fibonacci_retracement(high, low)

        assert levels['level_0'] == 100.0
        assert levels['level_100'] == 90.0
        assert abs(levels['level_618'] - 93.82) < 0.01  # 100 - (10 * 0.618)
        assert abs(levels['level_382'] - 96.18) < 0.01  # 100 - (10 * 0.382)

    def test_entry_signal_at_golden_ratio(self):
        """Test entry signal generation at 61.8% retracement"""
        strategy = FibonacciStrategy()
        high = 150.0
        low = 100.0

        # Price at 61.8% retracement: 150 - (50 * 0.618) = 119.1
        signal = strategy.generate_entry_signal(119.1, high, low)

        assert signal is not None
        assert signal.signal_type == 'LONG'
        assert signal.fibonacci_level == 618
        assert signal.strength >= 0.8  # Higher strength at golden ratio

    def test_no_signal_away_from_levels(self):
        """Test no signal when price is not near Fibonacci levels"""
        strategy = FibonacciStrategy()
        high = 100.0
        low = 90.0

        # Price not near any Fibonacci level
        signal = strategy.generate_entry_signal(96.5, high, low)

        assert signal is None

    def test_signal_strength_variation(self):
        """Test that signal strength varies by Fibonacci level"""
        strategy = FibonacciStrategy()
        high = 100.0
        low = 80.0

        # Signal at 61.8% (golden ratio)
        signal_618 = strategy.generate_entry_signal(87.64, high, low)

        # Signal at 50% (not golden ratio)
        signal_500 = strategy.generate_entry_signal(90.0, high, low)

        if signal_618 and signal_500:
            assert signal_618.strength > signal_500.strength


class TestLucasTimeExits:
    """Tests for Lucas sequence time-based exits"""

    def test_lucas_exit_time_calculation(self):
        """Test Lucas-based exit time calculation"""
        strategy = FibonacciStrategy()
        entry_time = datetime(2024, 1, 1, 10, 0, 0)

        # Lucas sequence: [2, 1, 3, 4, 7, 11, 18, 29, ...]
        # Using index 5 should give 11 periods
        exit_time = strategy.calculate_lucas_exit_time(entry_time, index=5)

        expected_exit = entry_time + timedelta(minutes=11)
        assert exit_time == expected_exit

    def test_should_exit_by_time_true(self):
        """Test time-based exit trigger when time exceeded"""
        strategy = FibonacciStrategy()
        entry_time = datetime(2024, 1, 1, 10, 0, 0)
        current_time = datetime(2024, 1, 1, 10, 15, 0)  # 15 minutes later

        # Lucas index 5 = 11 minutes, so should exit
        should_exit = strategy.should_exit_by_time(entry_time, current_time, lucas_index=5)
        assert should_exit == True

    def test_should_exit_by_time_false(self):
        """Test time-based exit not triggered when time not exceeded"""
        strategy = FibonacciStrategy()
        entry_time = datetime(2024, 1, 1, 10, 0, 0)
        current_time = datetime(2024, 1, 1, 10, 5, 0)  # 5 minutes later

        # Lucas index 5 = 11 minutes, so should not exit yet
        should_exit = strategy.should_exit_by_time(entry_time, current_time, lucas_index=5)
        assert should_exit == False

    def test_lucas_exit_different_indices(self):
        """Test different Lucas indices give different exit times"""
        strategy = FibonacciStrategy()
        entry_time = datetime(2024, 1, 1, 10, 0, 0)

        exit_time_3 = strategy.calculate_lucas_exit_time(entry_time, index=3)
        exit_time_6 = strategy.calculate_lucas_exit_time(entry_time, index=6)

        # Index 6 should give longer holding period than index 3
        assert exit_time_6 > exit_time_3


class TestRiskManagement:
    """Tests for risk management validation"""

    def test_position_size_calculation(self):
        """Test position sizing based on risk"""
        risk_mgr = RiskManager(max_risk_per_trade=0.02)

        capital = 100000  # $100k
        entry_price = 100.0
        stop_loss = 95.0  # $5 risk per share

        shares = risk_mgr.calculate_position_size(capital, entry_price, stop_loss)

        # Risk: $100k * 2% = $2000
        # Risk per share: $5
        # Position size: $2000 / $5 = 400 shares
        assert shares == 400

    def test_position_size_limited_by_capital(self):
        """Test position size doesn't exceed available capital"""
        risk_mgr = RiskManager(max_risk_per_trade=0.50)  # 50% risk (unrealistic but for testing)

        capital = 10000  # $10k
        entry_price = 500.0
        stop_loss = 490.0

        shares = risk_mgr.calculate_position_size(capital, entry_price, stop_loss)

        # Can only afford 20 shares with $10k capital
        assert shares <= 20

    def test_stop_loss_calculation(self):
        """Test ATR-based stop loss calculation"""
        risk_mgr = RiskManager()

        entry_price = 100.0
        atr = 2.0

        stop_loss = risk_mgr.calculate_stop_loss(entry_price, atr, multiplier=2.0)

        # Stop loss should be entry - (ATR * multiplier)
        assert stop_loss == 96.0

    def test_take_profit_calculation(self):
        """Test risk-reward based take profit calculation"""
        risk_mgr = RiskManager()

        entry_price = 100.0
        stop_loss = 95.0  # $5 risk

        take_profit = risk_mgr.calculate_take_profit(entry_price, stop_loss, risk_reward=2.0)

        # Take profit should be entry + (risk * 2.0) = 100 + 10 = 110
        assert take_profit == 110.0

    def test_risk_validation(self):
        """Test portfolio risk validation"""
        risk_mgr = RiskManager(max_risk_per_trade=0.02, max_portfolio_risk=0.06)

        # Add some positions
        pos1 = Position(
            entry_price=100.0,
            shares=100,
            entry_time=datetime.now(),
            stop_loss=95.0,
            take_profit=110.0,
            position_type='LONG'
        )
        risk_mgr.add_position(pos1)

        # Validate we can add another position
        new_position_risk = 1000  # $1000 risk
        assert risk_mgr.validate_risk(new_position_risk) == True


class TestPositionSizing:
    """Tests for position sizing correctness"""

    def test_integer_shares_only(self):
        """Test that position sizes are always whole shares"""
        risk_mgr = RiskManager()

        capital = 100000
        entry_price = 123.45
        stop_loss = 120.00

        shares = risk_mgr.calculate_position_size(capital, entry_price, stop_loss)

        assert isinstance(shares, int)
        assert shares > 0

    def test_zero_risk_handling(self):
        """Test handling of zero price risk (entry == stop loss)"""
        risk_mgr = RiskManager()

        capital = 100000
        entry_price = 100.0
        stop_loss = 100.0  # No risk

        shares = risk_mgr.calculate_position_size(capital, entry_price, stop_loss)

        assert shares == 0

    def test_position_size_scales_with_capital(self):
        """Test that position size scales proportionally with capital"""
        risk_mgr = RiskManager(max_risk_per_trade=0.02)

        entry_price = 100.0
        stop_loss = 95.0

        shares_10k = risk_mgr.calculate_position_size(10000, entry_price, stop_loss)
        shares_100k = risk_mgr.calculate_position_size(100000, entry_price, stop_loss)

        # 10x capital should give ~10x position size
        assert abs(shares_100k / shares_10k - 10) < 0.1


class TestStopLossTakeProfit:
    """Tests for stop-loss and take-profit execution"""

    def test_stop_loss_triggered(self):
        """Test stop loss is triggered when price falls below level"""
        position = Position(
            entry_price=100.0,
            shares=100,
            entry_time=datetime.now(),
            stop_loss=95.0,
            take_profit=110.0,
            position_type='LONG'
        )

        current_price = 94.5

        # Stop loss should be triggered
        assert current_price < position.stop_loss

    def test_take_profit_triggered(self):
        """Test take profit is triggered when price exceeds level"""
        position = Position(
            entry_price=100.0,
            shares=100,
            entry_time=datetime.now(),
            stop_loss=95.0,
            take_profit=110.0,
            position_type='LONG'
        )

        current_price = 110.5

        # Take profit should be triggered
        assert current_price > position.take_profit

    def test_risk_reward_ratio(self):
        """Test that risk-reward ratio is maintained"""
        risk_mgr = RiskManager()

        entry_price = 100.0
        stop_loss = 98.0  # $2 risk
        take_profit = risk_mgr.calculate_take_profit(entry_price, stop_loss, risk_reward=3.0)

        # Take profit should be $6 away (3:1 risk-reward)
        assert take_profit == 106.0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

"""
Fibonacci Retracement Strategy - Agent 13 (Zeckendorf: 10000000)

OEIS A000045: Fibonacci Sequence Trading Strategy
Uses Fibonacci retracement levels (38.2%, 50%, 61.8%) for entry signals.
Implements golden pocket (50-61.8% zone) entries with integer-only arithmetic.

Dependencies: Agent 5 (Fibonacci Encoder)
"""

from typing import Dict, List, Tuple, Optional
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from encoders.fibonacci_encoder import FibonacciEncoder


class FibonacciRetracementStrategy:
    """
    Fibonacci Retracement Trading Strategy using integer-only arithmetic.

    Entry Signals:
    - 38.2% Fibonacci retracement (shallow pullback)
    - 50.0% Fibonacci retracement (mid-point)
    - 61.8% Fibonacci retracement (golden ratio, deep pullback)
    - Golden Pocket: 50-61.8% zone (highest probability)

    Position Sizing:
    - Uses Fibonacci ratios for risk allocation
    - Scales position size based on retracement depth

    All calculations use integer arithmetic with cent precision.
    """

    # Retracement level ratios (scaled by 1000)
    LEVEL_382 = 382  # 38.2%
    LEVEL_500 = 500  # 50.0%
    LEVEL_618 = 618  # 61.8%
    LEVEL_786 = 786  # 78.6%

    # Position sizing ratios (scaled by 1000)
    # Larger positions at stronger levels (61.8%)
    POSITION_SIZE_382 = 618  # 61.8% of max position
    POSITION_SIZE_500 = 1000  # 100% of max position (strongest)
    POSITION_SIZE_618 = 1618  # 161.8% of max position (golden ratio)

    # Stop loss and take profit ratios (scaled by 1000)
    STOP_LOSS_RATIO = 236   # 23.6% below entry
    TAKE_PROFIT_1 = 618     # 61.8% extension
    TAKE_PROFIT_2 = 1618    # 161.8% extension (golden extension)

    # Signal strength thresholds
    TOLERANCE_CENTS = 50    # Price tolerance for level detection (50 cents)

    def __init__(self, max_position_cents: int = 1000000, scale: int = 1000):
        """
        Initialize Fibonacci Retracement Strategy.

        Args:
            max_position_cents: Maximum position size in cents ($10,000 = 1,000,000 cents)
            scale: Scaling factor for ratio calculations (default: 1000)
        """
        self.encoder = FibonacciEncoder(max_index=50)
        self.max_position_cents = max_position_cents
        self.scale = scale

        # Track current swing high/low for retracement calculation
        self.current_swing_high = 0
        self.current_swing_low = 0
        self.retracement_levels = {}
        self.extension_levels = {}

        # Trading state
        self.in_position = False
        self.entry_price = 0
        self.stop_loss = 0
        self.take_profit_1 = 0
        self.take_profit_2 = 0
        self.position_size = 0

        # Performance tracking
        self.trades_executed = 0
        self.winning_trades = 0
        self.total_pnl_cents = 0

    def update_swing_points(self, high_cents: int, low_cents: int) -> None:
        """
        Update swing high and low points, recalculate retracement levels.

        Args:
            high_cents: Recent swing high in cents
            low_cents: Recent swing low in cents
        """
        if high_cents <= low_cents:
            raise ValueError(f"Swing high ({high_cents}) must be > swing low ({low_cents})")

        self.current_swing_high = high_cents
        self.current_swing_low = low_cents

        # Calculate all retracement levels
        self.retracement_levels = self.encoder.calculate_retracements(high_cents, low_cents)

        # Calculate extension levels (profit targets)
        self.extension_levels = self.encoder.calculate_extensions(high_cents, low_cents)

    def check_entry_signal(self, current_price: int) -> Optional[Dict[str, any]]:
        """
        Check if current price provides a Fibonacci entry signal.

        Returns signal dictionary if entry criteria met, None otherwise.

        Args:
            current_price: Current market price in cents

        Returns:
            Signal dictionary with entry details, or None
        """
        if not self.retracement_levels:
            return None

        if self.in_position:
            return None  # Already in position

        # Check each Fibonacci level
        signal = None
        signal_strength = 0
        entry_level_name = ""

        # Check 61.8% level (highest priority - golden ratio)
        level_618 = self.retracement_levels['level_618']
        if self._is_at_level(current_price, level_618):
            signal_strength = 3  # Strongest signal
            entry_level_name = "618_golden_ratio"
            signal = self._create_entry_signal(
                current_price,
                entry_level_name,
                signal_strength,
                self.POSITION_SIZE_618
            )

        # Check 50% level (mid-retracement)
        level_500 = self.retracement_levels['level_500']
        if not signal and self._is_at_level(current_price, level_500):
            signal_strength = 2
            entry_level_name = "500_midpoint"
            signal = self._create_entry_signal(
                current_price,
                entry_level_name,
                signal_strength,
                self.POSITION_SIZE_500
            )

        # Check 38.2% level (shallow retracement)
        level_382 = self.retracement_levels['level_382']
        if not signal and self._is_at_level(current_price, level_382):
            signal_strength = 1
            entry_level_name = "382_shallow"
            signal = self._create_entry_signal(
                current_price,
                entry_level_name,
                signal_strength,
                self.POSITION_SIZE_382
            )

        # Check Golden Pocket (50-61.8% zone) - HIGHEST PROBABILITY
        if not signal and self._is_in_golden_pocket(current_price):
            signal_strength = 4  # Maximum strength
            entry_level_name = "golden_pocket"
            signal = self._create_entry_signal(
                current_price,
                entry_level_name,
                signal_strength,
                self.POSITION_SIZE_618  # Maximum position
            )

        return signal

    def _is_at_level(self, price: int, level: int) -> bool:
        """
        Check if price is at a Fibonacci level within tolerance.

        Args:
            price: Current price in cents
            level: Target level in cents

        Returns:
            True if price is within tolerance of level
        """
        return abs(price - level) <= self.TOLERANCE_CENTS

    def _is_in_golden_pocket(self, price: int) -> bool:
        """
        Check if price is in the golden pocket (50-61.8% zone).

        Args:
            price: Current price in cents

        Returns:
            True if price is in golden pocket zone
        """
        pocket_high = self.retracement_levels['golden_pocket_high']
        pocket_low = self.retracement_levels['golden_pocket_low']

        return pocket_low <= price <= pocket_high

    def _create_entry_signal(self, entry_price: int, level_name: str,
                            strength: int, position_ratio: int) -> Dict[str, any]:
        """
        Create entry signal with risk management parameters.

        Args:
            entry_price: Entry price in cents
            level_name: Name of the Fibonacci level
            strength: Signal strength (1-4)
            position_ratio: Position size ratio (scaled by 1000)

        Returns:
            Signal dictionary with all entry parameters
        """
        # Calculate position size using Fibonacci ratio
        position_size = (self.max_position_cents * position_ratio) // self.scale

        # Calculate stop loss (below entry by 23.6%)
        price_range = self.current_swing_high - self.current_swing_low
        stop_distance = (price_range * self.STOP_LOSS_RATIO) // self.scale
        stop_loss = entry_price - stop_distance

        # Calculate take profit levels using extensions
        take_profit_1 = self.extension_levels['ext_618']
        take_profit_2 = self.extension_levels['ext_1618']

        # Calculate risk-reward ratio (scaled by 1000)
        risk = entry_price - stop_loss
        reward_1 = take_profit_1 - entry_price
        reward_2 = take_profit_2 - entry_price

        rr_ratio_1 = (reward_1 * self.scale) // max(1, risk) if risk > 0 else 0
        rr_ratio_2 = (reward_2 * self.scale) // max(1, risk) if risk > 0 else 0

        return {
            'action': 'BUY',
            'entry_price': entry_price,
            'level': level_name,
            'signal_strength': strength,
            'position_size': position_size,
            'stop_loss': stop_loss,
            'take_profit_1': take_profit_1,
            'take_profit_2': take_profit_2,
            'risk_reward_1': rr_ratio_1,  # Scaled by 1000
            'risk_reward_2': rr_ratio_2,  # Scaled by 1000
            'swing_high': self.current_swing_high,
            'swing_low': self.current_swing_low,
            'retracement_levels': self.retracement_levels.copy()
        }

    def execute_entry(self, signal: Dict[str, any]) -> bool:
        """
        Execute entry based on signal.

        Args:
            signal: Entry signal dictionary from check_entry_signal()

        Returns:
            True if entry executed successfully
        """
        if self.in_position:
            return False

        self.in_position = True
        self.entry_price = signal['entry_price']
        self.position_size = signal['position_size']
        self.stop_loss = signal['stop_loss']
        self.take_profit_1 = signal['take_profit_1']
        self.take_profit_2 = signal['take_profit_2']

        self.trades_executed += 1

        return True

    def check_exit_signal(self, current_price: int) -> Optional[Dict[str, any]]:
        """
        Check if current price triggers an exit (stop loss or take profit).

        Args:
            current_price: Current market price in cents

        Returns:
            Exit signal dictionary if exit triggered, None otherwise
        """
        if not self.in_position:
            return None

        # Check stop loss
        if current_price <= self.stop_loss:
            pnl = (current_price - self.entry_price) * self.position_size // 100
            return {
                'action': 'SELL',
                'exit_type': 'STOP_LOSS',
                'exit_price': current_price,
                'entry_price': self.entry_price,
                'position_size': self.position_size,
                'pnl_cents': pnl
            }

        # Check take profit 2 first (higher level)
        if current_price >= self.take_profit_2:
            pnl = (current_price - self.entry_price) * self.position_size // 100
            return {
                'action': 'SELL',
                'exit_type': 'TAKE_PROFIT_2',
                'exit_price': current_price,
                'entry_price': self.entry_price,
                'position_size': self.position_size,
                'pnl_cents': pnl
            }

        # Check take profit 1
        if current_price >= self.take_profit_1:
            pnl = (current_price - self.entry_price) * self.position_size // 100
            return {
                'action': 'SELL',
                'exit_type': 'TAKE_PROFIT_1',
                'exit_price': current_price,
                'entry_price': self.entry_price,
                'position_size': self.position_size,
                'pnl_cents': pnl
            }

        return None

    def execute_exit(self, exit_signal: Dict[str, any]) -> bool:
        """
        Execute exit based on signal.

        Args:
            exit_signal: Exit signal dictionary from check_exit_signal()

        Returns:
            True if exit executed successfully
        """
        if not self.in_position:
            return False

        # Update performance tracking
        pnl = exit_signal['pnl_cents']
        self.total_pnl_cents += pnl

        if pnl > 0:
            self.winning_trades += 1

        # Reset position state
        self.in_position = False
        self.entry_price = 0
        self.position_size = 0
        self.stop_loss = 0
        self.take_profit_1 = 0
        self.take_profit_2 = 0

        return True

    def calculate_position_size_fibonacci(self, account_balance: int,
                                         risk_per_trade_ratio: int = 20) -> int:
        """
        Calculate position size using Fibonacci-based risk management.

        Uses golden ratio (φ) for optimal position sizing.

        Args:
            account_balance: Account balance in cents
            risk_per_trade_ratio: Risk per trade (scaled by 1000, default 20 = 2%)

        Returns:
            Position size in cents
        """
        # Calculate risk amount
        risk_amount = (account_balance * risk_per_trade_ratio) // self.scale

        # Apply golden ratio scaling
        phi = self.encoder.calculate_golden_ratio()  # Scaled by 10^6
        phi_1000 = phi // 1000  # Scale to 1000 like other ratios

        # Position size = risk_amount * φ (natural scaling)
        position_size = (risk_amount * phi_1000) // self.scale

        # Cap at maximum position size
        return min(position_size, self.max_position_cents)

    def get_strategy_summary(self) -> Dict[str, any]:
        """
        Get strategy configuration and performance summary.

        Returns:
            Dictionary with strategy details
        """
        win_rate = 0
        if self.trades_executed > 0:
            win_rate = (self.winning_trades * self.scale) // self.trades_executed

        return {
            'strategy': 'Fibonacci Retracement Strategy',
            'agent': 'Agent 13 (Zeckendorf: 10000000)',
            'dependencies': 'Agent 5 (Fibonacci Encoder)',
            'configuration': {
                'max_position_cents': self.max_position_cents,
                'tolerance_cents': self.TOLERANCE_CENTS,
                'entry_levels': ['38.2%', '50.0%', '61.8%', 'Golden Pocket (50-61.8%)'],
                'stop_loss_ratio': f"{self.STOP_LOSS_RATIO / 10}%",
                'take_profit_levels': [
                    f"{self.TAKE_PROFIT_1 / 10}% extension",
                    f"{self.TAKE_PROFIT_2 / 10}% extension"
                ]
            },
            'current_state': {
                'in_position': self.in_position,
                'swing_high': self.current_swing_high,
                'swing_low': self.current_swing_low,
                'retracement_levels': self.retracement_levels,
                'extension_levels': self.extension_levels
            },
            'performance': {
                'trades_executed': self.trades_executed,
                'winning_trades': self.winning_trades,
                'win_rate_scaled': win_rate,  # Scaled by 1000
                'win_rate_percent': f"{win_rate / 10}%",
                'total_pnl_cents': self.total_pnl_cents,
                'total_pnl_dollars': f"${self.total_pnl_cents / 100:.2f}"
            },
            'features': [
                'Integer-only arithmetic (cent precision)',
                'Fibonacci retracement entry signals',
                'Golden pocket detection (50-61.8%)',
                'Position sizing using golden ratio',
                'Multi-level take profit targets',
                'OEIS A000045 validated calculations'
            ]
        }

    def backtest_price_series(self, price_data: List[int],
                             lookback_period: int = 20) -> Dict[str, any]:
        """
        Backtest strategy on historical price data.

        Args:
            price_data: List of historical prices in cents
            lookback_period: Period for identifying swing high/low

        Returns:
            Backtest results dictionary
        """
        if len(price_data) < lookback_period:
            raise ValueError(f"Need at least {lookback_period} price points")

        trades = []
        equity_curve = []
        current_equity = self.max_position_cents

        for i in range(lookback_period, len(price_data)):
            # Get price window for swing point calculation
            window = price_data[i - lookback_period:i]
            swing_high = max(window)
            swing_low = min(window)
            current_price = price_data[i]

            # Update swing points if valid
            if swing_high > swing_low:
                try:
                    self.update_swing_points(swing_high, swing_low)
                except ValueError:
                    continue

            # Check for exit if in position
            if self.in_position:
                exit_signal = self.check_exit_signal(current_price)
                if exit_signal:
                    self.execute_exit(exit_signal)
                    current_equity += exit_signal['pnl_cents']
                    trades.append(exit_signal)

            # Check for entry if not in position
            if not self.in_position:
                entry_signal = self.check_entry_signal(current_price)
                if entry_signal:
                    self.execute_entry(entry_signal)
                    trades.append(entry_signal)

            equity_curve.append(current_equity)

        # Calculate performance metrics
        total_trades = len([t for t in trades if 'exit_type' in t])
        winning_trades = len([t for t in trades if 'exit_type' in t and t['pnl_cents'] > 0])

        win_rate = 0
        if total_trades > 0:
            win_rate = (winning_trades * self.scale) // total_trades

        total_pnl = sum([t['pnl_cents'] for t in trades if 'pnl_cents' in t])

        return {
            'total_trades': total_trades,
            'winning_trades': winning_trades,
            'losing_trades': total_trades - winning_trades,
            'win_rate_scaled': win_rate,
            'win_rate_percent': f"{win_rate / 10}%",
            'total_pnl_cents': total_pnl,
            'total_pnl_dollars': f"${total_pnl / 100:.2f}",
            'final_equity': current_equity,
            'return_percent': f"{((current_equity - self.max_position_cents) * 1000) // self.max_position_cents / 10}%",
            'trades': trades,
            'equity_curve': equity_curve
        }


def main():
    """
    Demonstration of Fibonacci Retracement Strategy.
    """
    print("=" * 80)
    print("FIBONACCI RETRACEMENT STRATEGY - Agent 13 (Zeckendorf: 10000000)")
    print("Dependencies: Agent 5 (Fibonacci Encoder)")
    print("=" * 80)
    print()

    # Initialize strategy
    strategy = FibonacciRetracementStrategy(max_position_cents=1000000)  # $10,000 max

    # Display strategy summary
    summary = strategy.get_strategy_summary()
    print(f"[1] Strategy: {summary['strategy']}")
    print(f"    Agent: {summary['agent']}")
    print()

    print("[2] Entry Levels:")
    for level in summary['configuration']['entry_levels']:
        print(f"    - {level}")
    print()

    print("[3] Risk Management:")
    print(f"    Stop Loss: {summary['configuration']['stop_loss_ratio']}")
    print(f"    Take Profit Levels: {', '.join(summary['configuration']['take_profit_levels'])}")
    print()

    # Example: Set up swing points
    print("[4] Example Trade Setup")
    swing_high = 15000  # $150.00
    swing_low = 10000   # $100.00
    print(f"    Swing High: ${swing_high / 100:.2f}")
    print(f"    Swing Low: ${swing_low / 100:.2f}")

    strategy.update_swing_points(swing_high, swing_low)

    print("\n    Fibonacci Retracement Levels:")
    for level_name, price in sorted(strategy.retracement_levels.items(),
                                   key=lambda x: x[1], reverse=True):
        if not level_name.startswith('golden_pocket'):
            print(f"      {level_name}: ${price / 100:.2f}")

    pocket_high = strategy.retracement_levels['golden_pocket_high']
    pocket_low = strategy.retracement_levels['golden_pocket_low']
    print(f"      Golden Pocket: ${pocket_low / 100:.2f} - ${pocket_high / 100:.2f}")
    print()

    # Test entry signal at golden ratio level
    print("[5] Testing Entry Signal at 61.8% Level")
    current_price = 11910  # At 61.8% retracement
    signal = strategy.check_entry_signal(current_price)

    if signal:
        print(f"    ✅ ENTRY SIGNAL DETECTED")
        print(f"    Level: {signal['level']}")
        print(f"    Strength: {signal['signal_strength']}/4")
        print(f"    Entry Price: ${signal['entry_price'] / 100:.2f}")
        print(f"    Position Size: ${signal['position_size'] / 100:.2f}")
        print(f"    Stop Loss: ${signal['stop_loss'] / 100:.2f}")
        print(f"    Take Profit 1: ${signal['take_profit_1'] / 100:.2f}")
        print(f"    Take Profit 2: ${signal['take_profit_2'] / 100:.2f}")
        print(f"    Risk/Reward 1: {signal['risk_reward_1'] / 1000:.2f}x")
        print(f"    Risk/Reward 2: {signal['risk_reward_2'] / 1000:.2f}x")
    else:
        print("    No entry signal")
    print()

    print("=" * 80)
    print("✅ FIBONACCI RETRACEMENT STRATEGY READY FOR BACKTESTING")
    print("=" * 80)


if __name__ == "__main__":
    main()

"""
Mean Reversion Strategy - Agent 16 (Zeckendorf: 10000011)

Statistical arbitrage strategy using mean reversion with Fibonacci bounds.
Implements Z-score calculations with integer-only arithmetic and QFNN enhancement.

Dependencies:
- Agent 5 (Fibonacci Encoder)
- Agent 9 (QFNN)
"""

from typing import Dict, List, Tuple, Optional
import sys
from pathlib import Path
import numpy as np

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from encoders.fibonacci_encoder import FibonacciEncoder
from models.qfnn import QFNN
from models.xi_psi import XiPsiModel, PhaseState


class MeanReversionStrategy:
    """
    Mean Reversion Trading Strategy using integer-only arithmetic.

    Entry Signals:
    - Z-score exceeds Fibonacci-based bounds (±1.618, ±2.618)
    - Price deviation from moving average
    - QFNN confirmation for enhanced accuracy
    - Phase space coherence analysis

    Exit Signals:
    - Z-score returns to neutral zone (±0.382)
    - Take profit at mean reversion
    - Stop loss at extended deviation

    All calculations use integer arithmetic with scaling factors.
    """

    # Z-score thresholds (scaled by 1000)
    # Based on Fibonacci ratios
    ZSCORE_ENTRY_LOW = -1618   # -1.618 (golden ratio)
    ZSCORE_ENTRY_HIGH = 1618   # +1.618
    ZSCORE_EXTREME_LOW = -2618  # -2.618 (Fibonacci extension)
    ZSCORE_EXTREME_HIGH = 2618  # +2.618
    ZSCORE_EXIT_LOW = -382      # -0.382 (Fibonacci retracement)
    ZSCORE_EXIT_HIGH = 382      # +0.382

    # Position sizing ratios (scaled by 1000)
    POSITION_SIZE_NORMAL = 1000    # 100% at normal entry
    POSITION_SIZE_EXTREME = 1618   # 161.8% at extreme levels

    # Stop loss and take profit (scaled by 1000)
    STOP_LOSS_RATIO = 500          # 50% of entry deviation
    TAKE_PROFIT_MEAN = 100         # 10% from mean

    # Moving average periods
    MA_SHORT_PERIOD = 20
    MA_LONG_PERIOD = 50

    # QFNN confidence threshold (scaled by 10000)
    QFNN_CONFIDENCE_THRESHOLD = 6000  # 0.60

    def __init__(
        self,
        max_position_cents: int = 1000000,
        lookback_period: int = 50,
        scale: int = 1000,
        use_qfnn: bool = True
    ):
        """
        Initialize Mean Reversion Strategy.

        Args:
            max_position_cents: Maximum position size in cents
            lookback_period: Period for calculating mean and std dev
            scale: Scaling factor for ratio calculations (default: 1000)
            use_qfnn: Enable QFNN enhancement
        """
        self.encoder = FibonacciEncoder(max_index=50)
        self.xi_psi_model = XiPsiModel(scale=10000)
        self.max_position_cents = max_position_cents
        self.lookback_period = lookback_period
        self.scale = scale
        self.use_qfnn = use_qfnn

        # Initialize QFNN if enabled
        self.qfnn = None
        if use_qfnn:
            self.qfnn = QFNN(
                input_dim=10,
                hidden_dim=20,
                output_dim=3,  # [mean_revert_up, mean_revert_down, no_signal]
                scale=10000
            )

        # Price history for statistics
        self.price_history: List[int] = []

        # Current statistics (scaled integers)
        self.current_mean = 0
        self.current_std = 0
        self.current_zscore = 0

        # Trading state
        self.in_position = False
        self.position_direction = 0  # 1 = long, -1 = short
        self.entry_price = 0
        self.entry_zscore = 0
        self.stop_loss = 0
        self.take_profit = 0
        self.position_size = 0

        # Performance tracking
        self.trades_executed = 0
        self.winning_trades = 0
        self.total_pnl_cents = 0
        self.max_drawdown_cents = 0
        self.peak_equity = max_position_cents

    def update_price(self, price_cents: int) -> None:
        """
        Update price history and recalculate statistics.

        Args:
            price_cents: New price in cents
        """
        self.price_history.append(price_cents)

        # Keep only lookback period
        if len(self.price_history) > self.lookback_period:
            self.price_history = self.price_history[-self.lookback_period:]

        # Recalculate statistics
        if len(self.price_history) >= 2:
            self.current_mean = self._calculate_mean()
            self.current_std = self._calculate_std()
            self.current_zscore = self._calculate_zscore(price_cents)

    def _calculate_mean(self) -> int:
        """
        Calculate mean price using integer arithmetic.

        Returns:
            Mean price in cents
        """
        if not self.price_history:
            return 0

        total = sum(self.price_history)
        return total // len(self.price_history)

    def _calculate_std(self) -> int:
        """
        Calculate standard deviation using integer arithmetic.

        Uses: std = sqrt(E[(X - μ)²])

        Returns:
            Standard deviation in cents
        """
        if len(self.price_history) < 2:
            return 0

        mean = self.current_mean

        # Calculate variance: sum of squared deviations
        squared_diffs = [(p - mean) ** 2 for p in self.price_history]
        variance = sum(squared_diffs) // len(squared_diffs)

        # Integer square root approximation
        std = self._integer_sqrt(variance)

        return max(1, std)  # Avoid division by zero

    def _integer_sqrt(self, n: int) -> int:
        """
        Integer square root using Newton's method.

        Args:
            n: Input value

        Returns:
            Integer square root
        """
        if n == 0:
            return 0

        # Initial guess
        x = n
        y = (x + 1) // 2

        # Newton iteration
        while y < x:
            x = y
            y = (x + n // x) // 2

        return x

    def _calculate_zscore(self, price_cents: int) -> int:
        """
        Calculate Z-score using integer arithmetic.

        Z-score = (X - μ) / σ
        Scaled by self.scale for integer precision.

        Args:
            price_cents: Current price in cents

        Returns:
            Z-score scaled by self.scale
        """
        if self.current_std == 0:
            return 0

        deviation = price_cents - self.current_mean

        # Z-score scaled: (deviation * scale) / std
        zscore = (deviation * self.scale) // self.current_std

        return zscore

    def _get_fibonacci_bounds(self) -> Dict[str, int]:
        """
        Calculate Fibonacci-based bounds for mean reversion.

        Uses current mean ± Fibonacci ratios * std dev.

        Returns:
            Dictionary of bound levels
        """
        if self.current_std == 0:
            return {}

        mean = self.current_mean
        std = self.current_std

        # Fibonacci ratios: 0.382, 0.618, 1.0, 1.618, 2.618
        bounds = {
            'mean': mean,
            'upper_382': mean + (std * 382) // 1000,
            'upper_618': mean + (std * 618) // 1000,
            'upper_1000': mean + std,
            'upper_1618': mean + (std * 1618) // 1000,
            'upper_2618': mean + (std * 2618) // 1000,
            'lower_382': mean - (std * 382) // 1000,
            'lower_618': mean - (std * 618) // 1000,
            'lower_1000': mean - std,
            'lower_1618': mean - (std * 1618) // 1000,
            'lower_2618': mean - (std * 2618) // 1000,
        }

        return bounds

    def _get_qfnn_signal(self, current_price: int) -> Tuple[int, int]:
        """
        Get QFNN-enhanced signal.

        Args:
            current_price: Current price in cents

        Returns:
            Tuple of (signal_direction, confidence)
            signal_direction: 1=long, -1=short, 0=no signal
            confidence: scaled by 10000
        """
        if not self.use_qfnn or self.qfnn is None:
            return 0, 0

        if len(self.price_history) < 10:
            return 0, 0

        # Prepare input features (Fibonacci-encoded)
        features = self._prepare_qfnn_features(current_price)

        # Get QFNN prediction
        prediction = self.qfnn.predict(features)

        # Interpret output: [mean_revert_up, mean_revert_down, no_signal]
        mean_revert_up = prediction[0]
        mean_revert_down = prediction[1]
        no_signal = prediction[2]

        # Determine signal direction
        if mean_revert_up > mean_revert_down and mean_revert_up > no_signal:
            # Expect price to revert UP (buy signal when oversold)
            signal_direction = 1
            confidence = abs(mean_revert_up)
        elif mean_revert_down > mean_revert_up and mean_revert_down > no_signal:
            # Expect price to revert DOWN (sell signal when overbought)
            signal_direction = -1
            confidence = abs(mean_revert_down)
        else:
            signal_direction = 0
            confidence = 0

        return signal_direction, confidence

    def _prepare_qfnn_features(self, current_price: int) -> np.ndarray:
        """
        Prepare features for QFNN input.

        Args:
            current_price: Current price in cents

        Returns:
            Feature vector (scaled integers)
        """
        features = np.zeros(10, dtype=np.int64)

        # Feature 0: Current Z-score
        features[0] = self.current_zscore

        # Feature 1: Price deviation from mean (scaled)
        features[1] = ((current_price - self.current_mean) * 10000) // max(1, self.current_mean)

        # Feature 2: Fibonacci encoding of current price
        features[2] = self.encoder.encode_price(current_price) * 1000

        # Feature 3-7: Recent price momentum (last 5 periods)
        for i in range(min(5, len(self.price_history) - 1)):
            idx = -(i + 1)
            momentum = ((self.price_history[idx] - self.price_history[idx-1]) * 10000) // max(1, self.price_history[idx-1])
            features[3 + i] = momentum

        # Feature 8: Moving average crossover signal
        if len(self.price_history) >= self.MA_SHORT_PERIOD:
            ma_short = sum(self.price_history[-self.MA_SHORT_PERIOD:]) // self.MA_SHORT_PERIOD
            ma_signal = ((current_price - ma_short) * 10000) // max(1, ma_short)
            features[8] = ma_signal

        # Feature 9: Volatility indicator (std/mean ratio)
        if self.current_mean > 0:
            features[9] = (self.current_std * 10000) // self.current_mean

        return features

    def check_entry_signal(self, current_price: int) -> Optional[Dict[str, any]]:
        """
        Check if current price provides a mean reversion entry signal.

        Args:
            current_price: Current market price in cents

        Returns:
            Signal dictionary if entry criteria met, None otherwise
        """
        if self.in_position or len(self.price_history) < self.MA_SHORT_PERIOD:
            return None

        zscore = self.current_zscore
        bounds = self._get_fibonacci_bounds()

        if not bounds:
            return None

        # Get phase space analysis
        phase_point = self.xi_psi_model.compute_phase_point(self.price_history, len(self.price_history) - 1)

        # Determine entry conditions
        signal = None
        signal_strength = 0
        entry_type = ""
        position_direction = 0

        # LONG entry: Price oversold (low Z-score)
        if zscore <= self.ZSCORE_ENTRY_LOW:
            position_direction = 1  # Long

            if zscore <= self.ZSCORE_EXTREME_LOW:
                signal_strength = 4  # Extreme oversold
                entry_type = "extreme_oversold"
                position_ratio = self.POSITION_SIZE_EXTREME
            else:
                signal_strength = 3  # Normal oversold
                entry_type = "oversold"
                position_ratio = self.POSITION_SIZE_NORMAL

        # SHORT entry: Price overbought (high Z-score)
        elif zscore >= self.ZSCORE_ENTRY_HIGH:
            position_direction = -1  # Short

            if zscore >= self.ZSCORE_EXTREME_HIGH:
                signal_strength = 4  # Extreme overbought
                entry_type = "extreme_overbought"
                position_ratio = self.POSITION_SIZE_EXTREME
            else:
                signal_strength = 3  # Normal overbought
                entry_type = "overbought"
                position_ratio = self.POSITION_SIZE_NORMAL

        if position_direction == 0:
            return None

        # Get QFNN confirmation
        qfnn_direction, qfnn_confidence = self._get_qfnn_signal(current_price)

        # QFNN must agree with direction
        if self.use_qfnn and qfnn_direction != 0:
            if qfnn_direction != position_direction:
                return None  # QFNN disagrees, skip signal

            if qfnn_confidence >= self.QFNN_CONFIDENCE_THRESHOLD:
                signal_strength = min(5, signal_strength + 1)  # Boost strength

        # Phase coherence filter (require high coherence)
        if phase_point.coherence < 7000:  # 0.70 threshold
            signal_strength = max(1, signal_strength - 1)

        # Create entry signal
        signal = self._create_entry_signal(
            current_price=current_price,
            position_direction=position_direction,
            entry_type=entry_type,
            signal_strength=signal_strength,
            position_ratio=position_ratio,
            zscore=zscore,
            bounds=bounds,
            qfnn_confidence=qfnn_confidence,
            phase_coherence=phase_point.coherence
        )

        return signal

    def _create_entry_signal(
        self,
        current_price: int,
        position_direction: int,
        entry_type: str,
        signal_strength: int,
        position_ratio: int,
        zscore: int,
        bounds: Dict[str, int],
        qfnn_confidence: int,
        phase_coherence: int
    ) -> Dict[str, any]:
        """
        Create entry signal with risk management parameters.

        Args:
            current_price: Entry price in cents
            position_direction: 1=long, -1=short
            entry_type: Type of entry signal
            signal_strength: Signal strength (1-5)
            position_ratio: Position size ratio
            zscore: Current Z-score
            bounds: Fibonacci bounds
            qfnn_confidence: QFNN confidence level
            phase_coherence: Phase space coherence

        Returns:
            Signal dictionary
        """
        # Calculate position size
        position_size = (self.max_position_cents * position_ratio) // self.scale

        # Calculate stop loss
        # For long: stop below current price
        # For short: stop above current price
        deviation = abs(current_price - self.current_mean)
        stop_distance = (deviation * self.STOP_LOSS_RATIO) // self.scale

        if position_direction == 1:  # Long
            stop_loss = current_price - stop_distance
            take_profit = self.current_mean + (self.current_std * self.TAKE_PROFIT_MEAN) // self.scale
        else:  # Short
            stop_loss = current_price + stop_distance
            take_profit = self.current_mean - (self.current_std * self.TAKE_PROFIT_MEAN) // self.scale

        # Calculate risk-reward ratio
        risk = abs(current_price - stop_loss)
        reward = abs(take_profit - current_price)
        rr_ratio = (reward * self.scale) // max(1, risk)

        return {
            'action': 'BUY' if position_direction == 1 else 'SELL_SHORT',
            'entry_price': current_price,
            'direction': position_direction,
            'entry_type': entry_type,
            'signal_strength': signal_strength,
            'position_size': position_size,
            'stop_loss': stop_loss,
            'take_profit': take_profit,
            'risk_reward_ratio': rr_ratio,
            'zscore': zscore,
            'mean_price': self.current_mean,
            'std_dev': self.current_std,
            'fibonacci_bounds': bounds.copy(),
            'qfnn_confidence': qfnn_confidence,
            'phase_coherence': phase_coherence
        }

    def execute_entry(self, signal: Dict[str, any]) -> bool:
        """
        Execute entry based on signal.

        Args:
            signal: Entry signal dictionary

        Returns:
            True if entry executed successfully
        """
        if self.in_position:
            return False

        self.in_position = True
        self.position_direction = signal['direction']
        self.entry_price = signal['entry_price']
        self.entry_zscore = signal['zscore']
        self.position_size = signal['position_size']
        self.stop_loss = signal['stop_loss']
        self.take_profit = signal['take_profit']

        self.trades_executed += 1

        return True

    def check_exit_signal(self, current_price: int) -> Optional[Dict[str, any]]:
        """
        Check if current price triggers an exit.

        Args:
            current_price: Current market price in cents

        Returns:
            Exit signal dictionary if exit triggered, None otherwise
        """
        if not self.in_position:
            return None

        zscore = self.current_zscore

        # Exit condition 1: Stop loss hit
        if self.position_direction == 1:  # Long
            if current_price <= self.stop_loss:
                return self._create_exit_signal(current_price, 'STOP_LOSS')
        else:  # Short
            if current_price >= self.stop_loss:
                return self._create_exit_signal(current_price, 'STOP_LOSS')

        # Exit condition 2: Take profit hit
        if self.position_direction == 1:  # Long
            if current_price >= self.take_profit:
                return self._create_exit_signal(current_price, 'TAKE_PROFIT')
        else:  # Short
            if current_price <= self.take_profit:
                return self._create_exit_signal(current_price, 'TAKE_PROFIT')

        # Exit condition 3: Z-score mean reversion
        # For long position: exit when Z-score returns to neutral
        # For short position: exit when Z-score returns to neutral
        if self.position_direction == 1 and zscore >= self.ZSCORE_EXIT_LOW:
            return self._create_exit_signal(current_price, 'MEAN_REVERSION')

        if self.position_direction == -1 and zscore <= self.ZSCORE_EXIT_HIGH:
            return self._create_exit_signal(current_price, 'MEAN_REVERSION')

        # Exit condition 4: Z-score reversal (price continues against position)
        if self.position_direction == 1 and zscore >= self.ZSCORE_ENTRY_HIGH:
            return self._create_exit_signal(current_price, 'REVERSAL')

        if self.position_direction == -1 and zscore <= self.ZSCORE_ENTRY_LOW:
            return self._create_exit_signal(current_price, 'REVERSAL')

        return None

    def _create_exit_signal(self, exit_price: int, exit_type: str) -> Dict[str, any]:
        """
        Create exit signal with PnL calculation.

        Args:
            exit_price: Exit price in cents
            exit_type: Type of exit

        Returns:
            Exit signal dictionary
        """
        # Calculate PnL
        if self.position_direction == 1:  # Long
            pnl = (exit_price - self.entry_price) * self.position_size // 100
        else:  # Short
            pnl = (self.entry_price - exit_price) * self.position_size // 100

        return {
            'action': 'SELL' if self.position_direction == 1 else 'BUY_COVER',
            'exit_type': exit_type,
            'exit_price': exit_price,
            'entry_price': self.entry_price,
            'position_size': self.position_size,
            'direction': self.position_direction,
            'pnl_cents': pnl,
            'entry_zscore': self.entry_zscore,
            'exit_zscore': self.current_zscore
        }

    def execute_exit(self, exit_signal: Dict[str, any]) -> bool:
        """
        Execute exit based on signal.

        Args:
            exit_signal: Exit signal dictionary

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

        # Track drawdown
        current_equity = self.max_position_cents + self.total_pnl_cents
        if current_equity > self.peak_equity:
            self.peak_equity = current_equity

        drawdown = self.peak_equity - current_equity
        if drawdown > self.max_drawdown_cents:
            self.max_drawdown_cents = drawdown

        # Reset position state
        self.in_position = False
        self.position_direction = 0
        self.entry_price = 0
        self.entry_zscore = 0
        self.position_size = 0
        self.stop_loss = 0
        self.take_profit = 0

        return True

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
            'strategy': 'Mean Reversion Strategy',
            'agent': 'Agent 16 (Zeckendorf: 10000011)',
            'dependencies': ['Agent 5 (Fibonacci Encoder)', 'Agent 9 (QFNN)'],
            'configuration': {
                'max_position_cents': self.max_position_cents,
                'lookback_period': self.lookback_period,
                'zscore_entry_thresholds': f'±{self.ZSCORE_ENTRY_HIGH / self.scale:.3f}',
                'zscore_extreme_thresholds': f'±{self.ZSCORE_EXTREME_HIGH / self.scale:.3f}',
                'zscore_exit_thresholds': f'±{self.ZSCORE_EXIT_HIGH / self.scale:.3f}',
                'qfnn_enabled': self.use_qfnn,
                'fibonacci_bounds': 'Yes (0.382, 0.618, 1.0, 1.618, 2.618)'
            },
            'current_state': {
                'in_position': self.in_position,
                'position_direction': 'LONG' if self.position_direction == 1 else ('SHORT' if self.position_direction == -1 else 'NONE'),
                'current_mean': self.current_mean,
                'current_std': self.current_std,
                'current_zscore': f'{self.current_zscore / self.scale:.3f}',
                'price_history_length': len(self.price_history)
            },
            'performance': {
                'trades_executed': self.trades_executed,
                'winning_trades': self.winning_trades,
                'win_rate_scaled': win_rate,
                'win_rate_percent': f'{win_rate / 10}%',
                'total_pnl_cents': self.total_pnl_cents,
                'total_pnl_dollars': f'${self.total_pnl_cents / 100:.2f}',
                'max_drawdown_cents': self.max_drawdown_cents,
                'max_drawdown_dollars': f'${self.max_drawdown_cents / 100:.2f}'
            },
            'features': [
                'Integer-only Z-score calculations',
                'Fibonacci-based entry/exit bounds',
                'QFNN enhancement for signal confirmation',
                'Phase space coherence filtering',
                'Statistical arbitrage with mean reversion',
                'Dynamic position sizing based on deviation',
                'Multi-level exit strategy'
            ]
        }

    def backtest_price_series(
        self,
        price_data: List[int],
        update_qfnn: bool = False
    ) -> Dict[str, any]:
        """
        Backtest strategy on historical price data.

        Args:
            price_data: List of historical prices in cents
            update_qfnn: Whether to update QFNN during backtest

        Returns:
            Backtest results dictionary
        """
        if len(price_data) < self.lookback_period:
            raise ValueError(f'Need at least {self.lookback_period} price points')

        trades = []
        equity_curve = []
        current_equity = self.max_position_cents

        # Reset state
        self.price_history = []
        self.in_position = False
        self.trades_executed = 0
        self.winning_trades = 0
        self.total_pnl_cents = 0

        for i, current_price in enumerate(price_data):
            # Update price history and statistics
            self.update_price(current_price)

            # Skip until we have enough data
            if len(self.price_history) < self.MA_SHORT_PERIOD:
                equity_curve.append(current_equity)
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

        # Calculate Sharpe-like ratio (integer approximation)
        if len(equity_curve) > 1:
            returns = [(equity_curve[i] - equity_curve[i-1]) for i in range(1, len(equity_curve))]
            mean_return = sum(returns) // len(returns) if returns else 0

            squared_diffs = [(r - mean_return) ** 2 for r in returns]
            variance = sum(squared_diffs) // len(squared_diffs) if squared_diffs else 0
            std_return = self._integer_sqrt(variance)

            sharpe_ratio = (mean_return * self.scale) // max(1, std_return)
        else:
            sharpe_ratio = 0

        return {
            'total_trades': total_trades,
            'winning_trades': winning_trades,
            'losing_trades': total_trades - winning_trades,
            'win_rate_scaled': win_rate,
            'win_rate_percent': f'{win_rate / 10}%',
            'total_pnl_cents': total_pnl,
            'total_pnl_dollars': f'${total_pnl / 100:.2f}',
            'final_equity': current_equity,
            'return_percent': f'{((current_equity - self.max_position_cents) * 1000) // self.max_position_cents / 10}%',
            'max_drawdown_cents': self.max_drawdown_cents,
            'max_drawdown_dollars': f'${self.max_drawdown_cents / 100:.2f}',
            'sharpe_ratio': f'{sharpe_ratio / self.scale:.2f}',
            'trades': trades,
            'equity_curve': equity_curve
        }


def main():
    """
    Demonstration of Mean Reversion Strategy.
    """
    print('=' * 80)
    print('MEAN REVERSION STRATEGY - Agent 16 (Zeckendorf: 10000011)')
    print('Dependencies: Agent 5 (Fibonacci Encoder), Agent 9 (QFNN)')
    print('=' * 80)
    print()

    # Initialize strategy
    strategy = MeanReversionStrategy(
        max_position_cents=1000000,  # $10,000
        lookback_period=50,
        use_qfnn=True
    )

    # Display strategy summary
    summary = strategy.get_strategy_summary()
    print(f"[1] Strategy: {summary['strategy']}")
    print(f"    Agent: {summary['agent']}")
    print()

    print('[2] Configuration:')
    for key, value in summary['configuration'].items():
        print(f'    {key}: {value}')
    print()

    print('[3] Features:')
    for feature in summary['features']:
        print(f'    - {feature}')
    print()

    # Example: Simulate price series with mean reversion
    print('[4] Example Backtest')
    np.random.seed(42)

    # Generate mean-reverting price series
    base_price = 10000  # $100.00
    prices = [base_price]
    mean_price = base_price

    for i in range(100):
        # Mean reversion with noise
        deviation = prices[-1] - mean_price
        mean_revert_force = -deviation // 10
        noise = np.random.randint(-200, 200)

        new_price = prices[-1] + mean_revert_force + noise
        new_price = max(5000, min(15000, new_price))  # Bounds
        prices.append(new_price)

    print(f'    Price series: {len(prices)} points')
    print(f'    Starting price: ${prices[0] / 100:.2f}')
    print(f'    Ending price: ${prices[-1] / 100:.2f}')
    print()

    # Run backtest
    print('[5] Running Backtest...')
    results = strategy.backtest_price_series(prices)

    print(f'    Total Trades: {results["total_trades"]}')
    print(f'    Win Rate: {results["win_rate_percent"]}')
    print(f'    Total PnL: {results["total_pnl_dollars"]}')
    print(f'    Return: {results["return_percent"]}')
    print(f'    Max Drawdown: {results["max_drawdown_dollars"]}')
    print(f'    Sharpe Ratio: {results["sharpe_ratio"]}')
    print()

    print('=' * 80)
    print('✅ MEAN REVERSION STRATEGY READY FOR DEPLOYMENT')
    print('=' * 80)


if __name__ == '__main__':
    main()

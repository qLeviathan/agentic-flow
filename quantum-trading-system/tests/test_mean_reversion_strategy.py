"""
Tests for Mean Reversion Strategy - Agent 16 (Zeckendorf: 10000011)

Validates:
- Z-score calculations (integer-only)
- Fibonacci bound generation
- Entry/exit signal logic
- QFNN integration
- Position sizing
- Risk management
"""

import pytest
import sys
from pathlib import Path
import numpy as np

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from strategies.mean_reversion_strategy import MeanReversionStrategy


class TestMeanReversionStrategy:
    """Test suite for Mean Reversion Strategy."""

    @pytest.fixture
    def strategy(self):
        """Create strategy instance for testing."""
        return MeanReversionStrategy(
            max_position_cents=1000000,
            lookback_period=50,
            use_qfnn=False  # Disable QFNN for basic tests
        )

    @pytest.fixture
    def strategy_with_qfnn(self):
        """Create strategy instance with QFNN enabled."""
        return MeanReversionStrategy(
            max_position_cents=1000000,
            lookback_period=50,
            use_qfnn=True
        )

    def test_initialization(self, strategy):
        """Test strategy initialization."""
        assert strategy.max_position_cents == 1000000
        assert strategy.lookback_period == 50
        assert strategy.scale == 1000
        assert not strategy.in_position
        assert len(strategy.price_history) == 0

    def test_integer_sqrt(self, strategy):
        """Test integer square root calculation."""
        # Test perfect squares
        assert strategy._integer_sqrt(0) == 0
        assert strategy._integer_sqrt(1) == 1
        assert strategy._integer_sqrt(4) == 2
        assert strategy._integer_sqrt(9) == 3
        assert strategy._integer_sqrt(16) == 4
        assert strategy._integer_sqrt(25) == 5
        assert strategy._integer_sqrt(100) == 10

        # Test non-perfect squares (floor of sqrt)
        assert strategy._integer_sqrt(2) == 1
        assert strategy._integer_sqrt(8) == 2
        assert strategy._integer_sqrt(15) == 3
        assert strategy._integer_sqrt(99) == 9

    def test_update_price(self, strategy):
        """Test price update and statistics calculation."""
        prices = [10000, 10100, 10200, 10150, 10050]

        for price in prices:
            strategy.update_price(price)

        assert len(strategy.price_history) == 5
        assert strategy.current_mean > 0
        assert strategy.current_std > 0

    def test_calculate_mean(self, strategy):
        """Test mean calculation."""
        strategy.price_history = [10000, 10100, 10200, 10300, 10400]
        mean = strategy._calculate_mean()

        # Mean should be 10200 (sum = 51000, count = 5)
        assert mean == 10200

    def test_calculate_std(self, strategy):
        """Test standard deviation calculation."""
        strategy.price_history = [10000, 10100, 10200, 10300, 10400]
        strategy.current_mean = 10200

        std = strategy._calculate_std()

        # Variance = [(200^2 + 100^2 + 0 + 100^2 + 200^2) / 5]
        #          = [80000 / 5] = 16000
        # Std = sqrt(16000) ≈ 126 (integer sqrt may vary slightly)
        assert 120 < std < 150

    def test_calculate_zscore(self, strategy):
        """Test Z-score calculation."""
        strategy.current_mean = 10000
        strategy.current_std = 100

        # Test Z-score = 0
        zscore = strategy._calculate_zscore(10000)
        assert zscore == 0

        # Test Z-score = 2 (scaled by 1000)
        zscore = strategy._calculate_zscore(10200)
        assert zscore == 2000

        # Test Z-score = -1 (scaled by 1000)
        zscore = strategy._calculate_zscore(9900)
        assert zscore == -1000

    def test_fibonacci_bounds(self, strategy):
        """Test Fibonacci bound generation."""
        strategy.current_mean = 10000
        strategy.current_std = 100

        bounds = strategy._get_fibonacci_bounds()

        # Verify mean
        assert bounds['mean'] == 10000

        # Verify Fibonacci ratios (allow ±1 for integer rounding)
        # Upper 1.618: 10000 + 100 * 1.618 = 10161
        assert 10160 <= bounds['upper_1618'] <= 10162

        # Lower 1.618: 10000 - 100 * 1.618 = 9838
        assert 9838 <= bounds['lower_1618'] <= 9840

        # Upper 2.618: 10000 + 100 * 2.618 = 10261
        assert 10260 <= bounds['upper_2618'] <= 10262

    def test_oversold_entry_signal(self, strategy):
        """Test entry signal for oversold condition."""
        # Build price history
        base_price = 10000
        for i in range(30):
            strategy.update_price(base_price - i * 10)

        # Current price well below mean
        current_price = 9000
        strategy.update_price(current_price)

        signal = strategy.check_entry_signal(current_price)

        # Should generate long entry signal
        assert signal is not None
        assert signal['direction'] == 1  # Long
        assert signal['action'] == 'BUY'
        assert 'oversold' in signal['entry_type']

    def test_overbought_entry_signal(self, strategy):
        """Test entry signal for overbought condition."""
        # Build price history
        base_price = 10000
        for i in range(30):
            strategy.update_price(base_price + i * 10)

        # Current price well above mean
        current_price = 11000
        strategy.update_price(current_price)

        signal = strategy.check_entry_signal(current_price)

        # Should generate short entry signal
        assert signal is not None
        assert signal['direction'] == -1  # Short
        assert signal['action'] == 'SELL_SHORT'
        assert 'overbought' in signal['entry_type']

    def test_no_entry_signal_near_mean(self, strategy):
        """Test no entry signal when price near mean."""
        # Build price history around mean
        base_price = 10000
        for i in range(30):
            strategy.update_price(base_price + (i % 10 - 5) * 5)

        current_price = 10000
        strategy.update_price(current_price)

        signal = strategy.check_entry_signal(current_price)

        # Should not generate signal
        assert signal is None

    def test_execute_entry(self, strategy):
        """Test entry execution."""
        signal = {
            'action': 'BUY',
            'entry_price': 10000,
            'direction': 1,
            'position_size': 100000,
            'stop_loss': 9900,
            'take_profit': 10100,
            'zscore': -2000
        }

        success = strategy.execute_entry(signal)

        assert success
        assert strategy.in_position
        assert strategy.position_direction == 1
        assert strategy.entry_price == 10000
        assert strategy.trades_executed == 1

    def test_stop_loss_exit(self, strategy):
        """Test stop loss exit."""
        # Enter long position
        entry_signal = {
            'action': 'BUY',
            'entry_price': 10000,
            'direction': 1,
            'position_size': 100000,
            'stop_loss': 9900,
            'take_profit': 10100,
            'zscore': -2000
        }
        strategy.execute_entry(entry_signal)

        # Price drops to stop loss
        strategy.update_price(9900)
        exit_signal = strategy.check_exit_signal(9900)

        assert exit_signal is not None
        assert exit_signal['exit_type'] == 'STOP_LOSS'
        assert exit_signal['pnl_cents'] < 0  # Loss

    def test_take_profit_exit(self, strategy):
        """Test take profit exit."""
        # Enter long position
        entry_signal = {
            'action': 'BUY',
            'entry_price': 10000,
            'direction': 1,
            'position_size': 100000,
            'stop_loss': 9900,
            'take_profit': 10100,
            'zscore': -2000
        }
        strategy.execute_entry(entry_signal)

        # Price rises to take profit
        strategy.update_price(10100)
        exit_signal = strategy.check_exit_signal(10100)

        assert exit_signal is not None
        assert exit_signal['exit_type'] == 'TAKE_PROFIT'
        assert exit_signal['pnl_cents'] > 0  # Profit

    def test_mean_reversion_exit(self, strategy):
        """Test mean reversion exit."""
        # Build price history
        for i in range(30):
            strategy.update_price(10000)

        # Enter long position at oversold
        entry_signal = {
            'action': 'BUY',
            'entry_price': 9500,
            'direction': 1,
            'position_size': 100000,
            'stop_loss': 9000,
            'take_profit': 10000,
            'zscore': -2000
        }
        strategy.execute_entry(entry_signal)

        # Price reverts to mean (Z-score near 0)
        strategy.update_price(10000)
        exit_signal = strategy.check_exit_signal(10000)

        assert exit_signal is not None
        # Exit can be either MEAN_REVERSION or TAKE_PROFIT depending on conditions
        assert exit_signal['exit_type'] in ['MEAN_REVERSION', 'TAKE_PROFIT']

    def test_execute_exit(self, strategy):
        """Test exit execution."""
        # Setup position
        strategy.in_position = True
        strategy.entry_price = 10000
        strategy.position_size = 100000
        strategy.position_direction = 1

        exit_signal = {
            'action': 'SELL',
            'exit_type': 'TAKE_PROFIT',
            'exit_price': 10100,
            'pnl_cents': 10000
        }

        success = strategy.execute_exit(exit_signal)

        assert success
        assert not strategy.in_position
        assert strategy.total_pnl_cents == 10000
        assert strategy.winning_trades == 1

    def test_backtest_price_series(self, strategy):
        """Test backtesting functionality."""
        # Generate mean-reverting price series
        np.random.seed(42)
        prices = [10000]
        for i in range(100):
            deviation = prices[-1] - 10000
            reversion = -deviation // 10
            noise = np.random.randint(-50, 50)
            new_price = prices[-1] + reversion + noise
            prices.append(max(9000, min(11000, new_price)))

        results = strategy.backtest_price_series(prices)

        assert 'total_trades' in results
        assert 'win_rate_percent' in results
        assert 'total_pnl_cents' in results
        assert 'equity_curve' in results
        assert len(results['equity_curve']) == len(prices)

    def test_strategy_summary(self, strategy):
        """Test strategy summary generation."""
        summary = strategy.get_strategy_summary()

        assert summary['strategy'] == 'Mean Reversion Strategy'
        assert summary['agent'] == 'Agent 16 (Zeckendorf: 10000011)'
        assert 'configuration' in summary
        assert 'current_state' in summary
        assert 'performance' in summary
        assert 'features' in summary

    def test_qfnn_integration(self, strategy_with_qfnn):
        """Test QFNN integration."""
        assert strategy_with_qfnn.qfnn is not None
        assert strategy_with_qfnn.use_qfnn

        # Build price history
        for i in range(30):
            strategy_with_qfnn.update_price(10000 + i * 10)

        # Get QFNN signal
        qfnn_direction, qfnn_confidence = strategy_with_qfnn._get_qfnn_signal(10300)

        # Should return valid signal
        assert qfnn_direction in [-1, 0, 1]
        assert qfnn_confidence >= 0

    def test_position_sizing(self, strategy):
        """Test position sizing calculations."""
        strategy.current_mean = 10000
        strategy.current_std = 100

        # Normal entry
        signal = strategy._create_entry_signal(
            current_price=9000,
            position_direction=1,
            entry_type='oversold',
            signal_strength=3,
            position_ratio=strategy.POSITION_SIZE_NORMAL,
            zscore=-1618,
            bounds={'mean': 10000},
            qfnn_confidence=0,
            phase_coherence=8000
        )

        # Position size should be max_position * 1.0
        expected_size = (strategy.max_position_cents * 1000) // strategy.scale
        assert signal['position_size'] == expected_size

        # Extreme entry (larger position)
        extreme_signal = strategy._create_entry_signal(
            current_price=8500,
            position_direction=1,
            entry_type='extreme_oversold',
            signal_strength=4,
            position_ratio=strategy.POSITION_SIZE_EXTREME,
            zscore=-2618,
            bounds={'mean': 10000},
            qfnn_confidence=0,
            phase_coherence=8000
        )

        # Position size should be max_position * 1.618
        extreme_expected = (strategy.max_position_cents * 1618) // strategy.scale
        assert extreme_signal['position_size'] == extreme_expected

    def test_risk_reward_ratio(self, strategy):
        """Test risk-reward ratio calculation."""
        strategy.current_mean = 10000
        strategy.current_std = 100

        signal = strategy._create_entry_signal(
            current_price=9000,
            position_direction=1,
            entry_type='oversold',
            signal_strength=3,
            position_ratio=strategy.POSITION_SIZE_NORMAL,
            zscore=-1618,
            bounds={'mean': 10000},
            qfnn_confidence=0,
            phase_coherence=8000
        )

        # Risk-reward ratio should be positive
        assert signal['risk_reward_ratio'] > 0

        # For mean reversion, reward should be reasonable
        risk = abs(signal['entry_price'] - signal['stop_loss'])
        reward = abs(signal['take_profit'] - signal['entry_price'])

        assert risk > 0
        assert reward > 0


def test_integer_only_operations():
    """Test that all operations are integer-only."""
    strategy = MeanReversionStrategy(use_qfnn=False)

    # Build price history
    for i in range(60):
        strategy.update_price(10000 + i * 10)

    # All statistics should be integers
    assert isinstance(strategy.current_mean, int)
    assert isinstance(strategy.current_std, int)
    assert isinstance(strategy.current_zscore, int)

    # Entry signal calculations
    signal = strategy.check_entry_signal(11000)
    if signal:
        assert isinstance(signal['entry_price'], int)
        assert isinstance(signal['stop_loss'], int)
        assert isinstance(signal['take_profit'], int)
        assert isinstance(signal['position_size'], int)
        assert isinstance(signal['risk_reward_ratio'], int)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

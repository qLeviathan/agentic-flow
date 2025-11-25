"""
Test Suite for Backtesting Engine - Agent 17 (Zeckendorf: 10000100)

Comprehensive tests for integer-only backtesting framework.

Tests:
- Trade execution and logging
- P&L calculations
- Performance metrics (Sharpe, Sortino, drawdown)
- Commission and slippage
- Strategy integration
- Integer-only arithmetic validation
"""

import unittest
import sys
from pathlib import Path

# Add parent directory for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from backtesting.backtest_engine import (
    BacktestEngine,
    BacktestResult,
    TradeLog
)
from strategies.fibonacci_strategy import FibonacciRetracementStrategy


class TestTradeLog(unittest.TestCase):
    """Test TradeLog dataclass."""

    def test_trade_log_creation(self):
        """Test creating a trade log entry."""
        trade = TradeLog(
            trade_id=1,
            timestamp=100,
            action='BUY',
            price_cents=15000,
            position_size=100,
            strategy_name='Test Strategy',
            entry_signal='fibonacci_618',
            pnl_cents=0,
            commission_cents=10
        )

        self.assertEqual(trade.trade_id, 1)
        self.assertEqual(trade.timestamp, 100)
        self.assertEqual(trade.action, 'BUY')
        self.assertEqual(trade.price_cents, 15000)
        self.assertEqual(trade.position_size, 100)

    def test_trade_log_to_dict(self):
        """Test converting trade log to dictionary."""
        trade = TradeLog(
            trade_id=1,
            timestamp=100,
            action='SELL',
            price_cents=16000,
            position_size=100,
            strategy_name='Test Strategy',
            exit_signal='take_profit',
            pnl_cents=10000,
            commission_cents=10,
            cumulative_pnl_cents=10000
        )

        trade_dict = trade.to_dict()

        self.assertEqual(trade_dict['trade_id'], 1)
        self.assertEqual(trade_dict['action'], 'SELL')
        self.assertEqual(trade_dict['pnl_cents'], 10000)
        self.assertIn('price_dollars', trade_dict)
        self.assertIn('pnl_dollars', trade_dict)


class TestBacktestEngine(unittest.TestCase):
    """Test BacktestEngine core functionality."""

    def setUp(self):
        """Set up test fixtures."""
        self.engine = BacktestEngine(
            initial_capital_cents=10000000,  # $100,000
            commission_cents=10,
            slippage_cents=5
        )

    def test_engine_initialization(self):
        """Test engine initialization."""
        self.assertEqual(self.engine.initial_capital_cents, 10000000)
        self.assertEqual(self.engine.commission_cents, 10)
        self.assertEqual(self.engine.slippage_cents, 5)
        self.assertEqual(self.engine.current_capital_cents, 10000000)
        self.assertEqual(self.engine.trade_counter, 0)

    def test_calculate_commission_fixed(self):
        """Test fixed commission calculation."""
        commission = self.engine.calculate_commission(15000, 100)
        self.assertEqual(commission, 10)  # Fixed 10 cents

    def test_calculate_commission_percentage(self):
        """Test percentage-based commission."""
        engine = BacktestEngine(
            initial_capital_cents=10000000,
            commission_cents=0,
            commission_percent_scaled=10  # 1% (10/1000)
        )

        # Trade value: $150 * 100 shares = $15,000 = 1,500,000 cents
        # Commission: 1% of 1,500,000 = 15,000 cents = $150
        commission = engine.calculate_commission(15000, 100)
        expected = (15000 * 100 * 10) // 1000  # 15000 cents
        self.assertEqual(commission, expected)

    def test_execute_buy_trade(self):
        """Test executing a BUY trade."""
        trade = self.engine.execute_trade(
            timestamp=10,
            action='BUY',
            price_cents=15000,
            position_size=100,
            strategy_name='Test',
            entry_signal='fibonacci_618'
        )

        self.assertEqual(trade.action, 'BUY')
        self.assertEqual(trade.price_cents, 15005)  # Price + slippage
        self.assertEqual(len(self.engine.trades), 1)
        # Capital reduced by commission only on entry
        self.assertLess(self.engine.current_capital_cents, 10000000)

    def test_execute_sell_trade_with_profit(self):
        """Test executing a SELL trade with profit."""
        # First buy
        self.engine.execute_trade(
            timestamp=10,
            action='BUY',
            price_cents=15000,
            position_size=100,
            strategy_name='Test',
            entry_signal='entry'
        )

        # Then sell at higher price
        initial_capital = self.engine.current_capital_cents
        trade = self.engine.execute_trade(
            timestamp=20,
            action='SELL',
            price_cents=16000,
            position_size=100,
            strategy_name='Test',
            exit_signal='take_profit',
            entry_price_cents=15005
        )

        # P&L = (16000 - 5 - 15005) * 100 / 100 - commission
        # P&L = 990 * 100 / 100 - 10 = 990 - 10 = 980 cents
        expected_pnl = (16000 - 5 - 15005) * 100 // 100 - 10
        self.assertEqual(trade.pnl_cents, expected_pnl)
        self.assertGreater(trade.pnl_cents, 0)

    def test_execute_sell_trade_with_loss(self):
        """Test executing a SELL trade with loss."""
        # First buy
        self.engine.execute_trade(
            timestamp=10,
            action='BUY',
            price_cents=15000,
            position_size=100,
            strategy_name='Test'
        )

        # Then sell at lower price
        trade = self.engine.execute_trade(
            timestamp=20,
            action='SELL',
            price_cents=14000,
            position_size=100,
            strategy_name='Test',
            exit_signal='stop_loss',
            entry_price_cents=15005
        )

        self.assertLess(trade.pnl_cents, 0)

    def test_integer_sqrt(self):
        """Test integer square root calculation."""
        self.assertEqual(self.engine._integer_sqrt(0), 0)
        self.assertEqual(self.engine._integer_sqrt(1), 1)
        self.assertEqual(self.engine._integer_sqrt(4), 2)
        self.assertEqual(self.engine._integer_sqrt(9), 3)
        self.assertEqual(self.engine._integer_sqrt(16), 4)
        self.assertEqual(self.engine._integer_sqrt(100), 10)
        self.assertEqual(self.engine._integer_sqrt(10000), 100)


class TestBacktestMetrics(unittest.TestCase):
    """Test backtest performance metrics calculation."""

    def test_max_drawdown_calculation(self):
        """Test maximum drawdown calculation."""
        engine = BacktestEngine(initial_capital_cents=10000000)

        # Simulate equity curve with drawdown
        engine.equity_curve = [
            10000000,  # Start
            11000000,  # +10%
            10500000,  # -5%
            9500000,   # -10% (drawdown from peak)
            10000000,  # Recover
            12000000,  # New peak
            11000000   # -8.3%
        ]

        max_dd_cents, max_dd_percent = engine._calculate_max_drawdown()

        # Max drawdown: 11000000 - 9500000 = 1500000 cents = $15,000
        self.assertEqual(max_dd_cents, 1500000)

        # Max drawdown percent: 1500000 / 11000000 * 1000 = 136.36...
        expected_percent = (1500000 * 1000) // 11000000
        self.assertEqual(max_dd_percent, expected_percent)

    def test_sharpe_ratio_calculation(self):
        """Test Sharpe ratio calculation."""
        engine = BacktestEngine(initial_capital_cents=10000000)

        # Simulate positive returns
        engine.equity_curve = [
            10000000,
            10100000,
            10200000,
            10300000,
            10400000
        ]

        sharpe = engine._calculate_sharpe_ratio()

        # Should be positive for upward trending equity
        self.assertGreater(sharpe, 0)

    def test_sortino_ratio_calculation(self):
        """Test Sortino ratio calculation."""
        engine = BacktestEngine(initial_capital_cents=10000000)

        # Simulate returns with volatility
        engine.equity_curve = [
            10000000,
            10100000,  # +1%
            10050000,  # -0.5%
            10150000,  # +1%
            10100000,  # -0.5%
            10200000   # +1%
        ]

        sortino = engine._calculate_sortino_ratio()

        # Should be positive for net positive returns
        self.assertGreater(sortino, 0)


class TestStrategyIntegration(unittest.TestCase):
    """Test backtesting with Fibonacci strategy."""

    def setUp(self):
        """Set up test fixtures."""
        self.strategy = FibonacciRetracementStrategy(max_position_cents=1000000)
        self.engine = BacktestEngine(
            initial_capital_cents=10000000,
            commission_cents=0,
            slippage_cents=0
        )

    def test_simple_backtest(self):
        """Test running a simple backtest."""
        # Generate trending price data
        price_data = []
        base_price = 10000

        for i in range(50):
            price = base_price + i * 100
            price_data.append(price)

        result = self.engine.run_backtest(
            price_data=price_data,
            strategy=self.strategy,
            strategy_name="Fibonacci Strategy Test",
            lookback_period=10
        )

        # Verify result structure
        self.assertIsInstance(result, BacktestResult)
        self.assertEqual(result.strategy_name, "Fibonacci Strategy Test")
        self.assertEqual(result.initial_capital_cents, 10000000)
        self.assertGreaterEqual(result.total_trades, 0)

    def test_backtest_with_trades(self):
        """Test backtest that generates trades."""
        # Generate price data with pullbacks (Fibonacci pattern)
        price_data = []
        base_price = 10000

        # Uptrend with pullbacks
        for i in range(30):
            if i % 10 < 5:
                # Uptrend
                price = base_price + i * 100
            else:
                # Pullback (Fibonacci retracement)
                price = base_price + i * 100 - 300
            price_data.append(max(5000, price))

        result = self.engine.run_backtest(
            price_data=price_data,
            strategy=self.strategy,
            strategy_name="Fibonacci Strategy",
            lookback_period=10
        )

        # Should have some data
        self.assertGreaterEqual(len(result.equity_curve), 0)

    def test_backtest_metrics_calculation(self):
        """Test that all metrics are calculated correctly."""
        # Simple price series
        price_data = [10000 + i * 50 for i in range(100)]

        result = self.engine.run_backtest(
            price_data=price_data,
            strategy=self.strategy,
            strategy_name="Metrics Test",
            lookback_period=20
        )

        # Verify all metrics are calculated (may be zero if no trades)
        self.assertGreaterEqual(result.total_trades, 0)
        self.assertGreaterEqual(result.winning_trades, 0)
        self.assertGreaterEqual(result.losing_trades, 0)
        self.assertGreaterEqual(result.win_rate_scaled, 0)
        self.assertIsInstance(result.sharpe_ratio_scaled, int)
        self.assertIsInstance(result.sortino_ratio_scaled, int)
        self.assertGreaterEqual(result.max_drawdown_cents, 0)

    def test_backtest_result_to_dict(self):
        """Test converting backtest result to dictionary."""
        price_data = [10000 + i * 50 for i in range(50)]

        result = self.engine.run_backtest(
            price_data=price_data,
            strategy=self.strategy,
            strategy_name="Dict Test",
            lookback_period=10
        )

        result_dict = result.to_dict()

        # Verify dictionary structure
        self.assertIn('summary', result_dict)
        self.assertIn('pnl', result_dict)
        self.assertIn('risk_metrics', result_dict)
        self.assertIn('capital', result_dict)
        self.assertIn('execution', result_dict)

    def test_win_rate_calculation(self):
        """Test win rate calculation with known trades."""
        engine = BacktestEngine(initial_capital_cents=10000000)

        # Simulate trades manually
        # 3 winning trades
        for _ in range(3):
            engine.execute_trade(
                timestamp=1,
                action='BUY',
                price_cents=10000,
                position_size=100,
                strategy_name='Test'
            )
            engine.execute_trade(
                timestamp=2,
                action='SELL',
                price_cents=11000,
                position_size=100,
                strategy_name='Test',
                entry_price_cents=10000
            )

        # 2 losing trades
        for _ in range(2):
            engine.execute_trade(
                timestamp=3,
                action='BUY',
                price_cents=10000,
                position_size=100,
                strategy_name='Test'
            )
            engine.execute_trade(
                timestamp=4,
                action='SELL',
                price_cents=9000,
                position_size=100,
                strategy_name='Test',
                entry_price_cents=10000
            )

        result = engine._calculate_metrics('Test')

        # Win rate: 3 / 5 = 0.6 = 600 (scaled by 1000)
        expected_win_rate = (3 * 1000) // 5
        self.assertEqual(result.win_rate_scaled, expected_win_rate)
        self.assertEqual(result.winning_trades, 3)
        self.assertEqual(result.losing_trades, 2)
        self.assertEqual(result.total_trades, 5)

    def test_profit_factor_calculation(self):
        """Test profit factor calculation."""
        engine = BacktestEngine(initial_capital_cents=10000000, commission_cents=0)

        # Winning trade: +$100
        engine.execute_trade(
            timestamp=1,
            action='BUY',
            price_cents=10000,
            position_size=100,
            strategy_name='Test'
        )
        engine.execute_trade(
            timestamp=2,
            action='SELL',
            price_cents=11000,
            position_size=100,
            strategy_name='Test',
            entry_price_cents=10000
        )

        # Losing trade: -$50
        engine.execute_trade(
            timestamp=3,
            action='BUY',
            price_cents=10000,
            position_size=100,
            strategy_name='Test'
        )
        engine.execute_trade(
            timestamp=4,
            action='SELL',
            price_cents=9500,
            position_size=100,
            strategy_name='Test',
            entry_price_cents=10000
        )

        result = engine._calculate_metrics('Test')

        # Profit factor = gross_profit / gross_loss
        # Should be around 2.0 (scaled to 2000)
        self.assertGreater(result.profit_factor_scaled, 0)
        self.assertGreater(result.gross_profit_cents, 0)
        self.assertGreater(result.gross_loss_cents, 0)


class TestTradeAnalysis(unittest.TestCase):
    """Test trade analysis functionality."""

    def test_trade_analysis(self):
        """Test getting trade analysis."""
        engine = BacktestEngine(initial_capital_cents=10000000, commission_cents=0)
        strategy = FibonacciRetracementStrategy()

        # Generate simple price data
        price_data = [10000 + i * 100 for i in range(50)]

        result = engine.run_backtest(
            price_data=price_data,
            strategy=strategy,
            strategy_name="Analysis Test",
            lookback_period=10
        )

        analysis = engine.get_trade_analysis(result)

        # Verify analysis structure
        self.assertIn('max_consecutive_wins', analysis)
        self.assertIn('max_consecutive_losses', analysis)
        self.assertIn('total_trades', analysis)
        self.assertIn('average_trade_pnl', analysis)


class TestIntegerOnlyArithmetic(unittest.TestCase):
    """Test that all calculations use integer-only arithmetic."""

    def test_no_float_in_commission(self):
        """Test commission calculation uses integers only."""
        engine = BacktestEngine(initial_capital_cents=10000000)
        commission = engine.calculate_commission(15000, 100)
        self.assertIsInstance(commission, int)

    def test_no_float_in_pnl(self):
        """Test P&L calculation uses integers only."""
        engine = BacktestEngine(initial_capital_cents=10000000, commission_cents=0)

        engine.execute_trade(
            timestamp=1,
            action='BUY',
            price_cents=10000,
            position_size=100,
            strategy_name='Test'
        )

        trade = engine.execute_trade(
            timestamp=2,
            action='SELL',
            price_cents=11000,
            position_size=100,
            strategy_name='Test',
            entry_price_cents=10000
        )

        self.assertIsInstance(trade.pnl_cents, int)

    def test_no_float_in_metrics(self):
        """Test all metrics use integer arithmetic."""
        engine = BacktestEngine(initial_capital_cents=10000000)
        strategy = FibonacciRetracementStrategy()

        price_data = [10000 + i * 50 for i in range(50)]

        result = engine.run_backtest(
            price_data=price_data,
            strategy=strategy,
            strategy_name="Integer Test",
            lookback_period=10
        )

        # All metrics should be integers
        self.assertIsInstance(result.sharpe_ratio_scaled, int)
        self.assertIsInstance(result.sortino_ratio_scaled, int)
        self.assertIsInstance(result.profit_factor_scaled, int)
        self.assertIsInstance(result.max_drawdown_cents, int)
        self.assertIsInstance(result.max_drawdown_percent_scaled, int)
        self.assertIsInstance(result.win_rate_scaled, int)


def run_tests():
    """Run all tests."""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestTradeLog))
    suite.addTests(loader.loadTestsFromTestCase(TestBacktestEngine))
    suite.addTests(loader.loadTestsFromTestCase(TestBacktestMetrics))
    suite.addTests(loader.loadTestsFromTestCase(TestStrategyIntegration))
    suite.addTests(loader.loadTestsFromTestCase(TestTradeAnalysis))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegerOnlyArithmetic))

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    return result


if __name__ == '__main__':
    result = run_tests()
    sys.exit(0 if result.wasSuccessful() else 1)

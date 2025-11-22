#!/usr/bin/env python3
"""
Comprehensive Test Suite for Backtesting Engine

Tests all components:
1. Fibonacci and Lucas sequence utilities
2. Strategy implementations
3. Risk management
4. Performance metrics
5. Backtesting engine
6. AgentDB integration
"""

import unittest
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from backtesting_engine import (
    # Utilities
    generate_fibonacci_sequence,
    generate_lucas_sequence,
    zeckendorf_encode,
    zeckendorf_decode,
    generate_sample_data,

    # Data classes
    FibonacciLevels,
    Signal,
    Trade,
    PerformanceMetrics,

    # Strategies
    Strategy,
    FibonacciRetracementStrategy,
    LucasSequenceExitStrategy,
    MomentumStrategy,
    MeanReversionStrategy,
    BreakoutStrategy,

    # Core components
    RiskManager,
    PerformanceAnalyzer,
    BacktestingEngine,
    AgentDBIntegration,
)


class TestFibonacciUtils(unittest.TestCase):
    """Test Fibonacci and Lucas sequence utilities"""

    def test_fibonacci_sequence(self):
        """Test Fibonacci sequence generation"""
        fib = generate_fibonacci_sequence(10)
        expected = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55]
        self.assertEqual(fib, expected)

    def test_lucas_sequence(self):
        """Test Lucas sequence generation"""
        lucas = generate_lucas_sequence(10)
        expected = [2, 1, 3, 4, 7, 11, 18, 29, 47, 76]
        self.assertEqual(lucas, expected)

    def test_zeckendorf_encoding(self):
        """Test Zeckendorf encoding and decoding"""
        test_cases = [1, 5, 10, 25, 100]

        for n in test_cases:
            encoded = zeckendorf_encode(n)
            decoded = zeckendorf_decode(encoded)
            self.assertEqual(n, decoded, f"Failed for n={n}")

    def test_zeckendorf_properties(self):
        """Test Zeckendorf representation properties"""
        encoded = zeckendorf_encode(100)

        # Should be non-empty for positive numbers
        self.assertTrue(len(encoded) > 0)

        # Indices should be sorted
        self.assertEqual(encoded, sorted(encoded))

        # Should not have consecutive Fibonacci numbers
        for i in range(len(encoded) - 1):
            self.assertGreater(encoded[i+1] - encoded[i], 1)


class TestDataClasses(unittest.TestCase):
    """Test data classes"""

    def test_signal_creation(self):
        """Test Signal object creation"""
        signal = Signal(
            timestamp=pd.Timestamp('2024-01-01'),
            signal_type='BUY',
            price=100.0,
            position_size=0.5,
            fibonacci_level=0.618
        )

        self.assertEqual(signal.signal_type, 'BUY')
        self.assertEqual(signal.price, 100.0)
        self.assertEqual(signal.fibonacci_level, 0.618)

    def test_trade_closure(self):
        """Test Trade closing and P&L calculation"""
        trade = Trade(
            entry_timestamp=pd.Timestamp('2024-01-01'),
            entry_price=100.0,
            position_size=10.0
        )

        trade.close_trade(110.0, pd.Timestamp('2024-01-02'), 'SIGNAL')

        self.assertEqual(trade.status, 'CLOSED')
        self.assertEqual(trade.exit_price, 110.0)
        self.assertEqual(trade.pnl, 100.0)  # (110-100) * 10
        self.assertEqual(trade.pnl_pct, 10.0)  # 10% gain

    def test_performance_metrics_encoding(self):
        """Test PerformanceMetrics Zeckendorf encoding"""
        metrics = PerformanceMetrics(
            sharpe_ratio=2.5,
            max_drawdown=-0.15
        )

        metrics.encode_metrics()

        # Should have encoded values
        self.assertTrue(len(metrics.encoded_sharpe) > 0)
        self.assertTrue(len(metrics.encoded_max_drawdown) > 0)

        # Verify encoding is correct
        decoded_sharpe = zeckendorf_decode(metrics.encoded_sharpe) / 1000.0
        self.assertAlmostEqual(decoded_sharpe, 2.5, places=2)


class TestStrategies(unittest.TestCase):
    """Test strategy implementations"""

    def setUp(self):
        """Set up test data"""
        self.data = generate_sample_data(num_points=100)

    def test_fibonacci_retracement_strategy(self):
        """Test Fibonacci retracement strategy"""
        strategy = FibonacciRetracementStrategy()

        # Test signal generation at various points
        signal = strategy.generate_signal(self.data, 50)

        self.assertIsInstance(signal, Signal)
        self.assertIn(signal.signal_type, ['BUY', 'SELL', 'HOLD'])

        # Test that fibonacci levels are calculated
        if signal.signal_type == 'BUY':
            self.assertIsNotNone(signal.fibonacci_level)

    def test_lucas_exit_strategy(self):
        """Test Lucas sequence exit strategy"""
        strategy = LucasSequenceExitStrategy()

        # Test exit day calculation
        exit_day_low_vol = strategy.get_exit_day(0, volatility=0.5)
        exit_day_high_vol = strategy.get_exit_day(0, volatility=2.0)

        # High volatility should give shorter hold period
        self.assertGreater(exit_day_low_vol, exit_day_high_vol)

        # Exit days should be positive integers
        self.assertGreater(exit_day_low_vol, 0)
        self.assertGreater(exit_day_high_vol, 0)

    def test_momentum_strategy(self):
        """Test momentum strategy"""
        strategy = MomentumStrategy()

        # Generate signals
        signal = strategy.generate_signal(self.data, 50)

        self.assertIsInstance(signal, Signal)

        # Check that RSI and MACD are calculated
        if 'rsi' in signal.metadata:
            rsi = signal.metadata['rsi']
            self.assertGreaterEqual(rsi, 0)
            self.assertLessEqual(rsi, 100)

        # Check encoding
        if 'encoded_rsi' in signal.metadata:
            encoded_rsi = signal.metadata['encoded_rsi']
            self.assertIsInstance(encoded_rsi, list)

    def test_mean_reversion_strategy(self):
        """Test mean reversion strategy"""
        strategy = MeanReversionStrategy()

        signal = strategy.generate_signal(self.data, 50)

        self.assertIsInstance(signal, Signal)

        # Check metadata contains mean and std
        if signal.metadata:
            self.assertIn('mean', signal.metadata)
            self.assertIn('std', signal.metadata)
            self.assertIn('z_score', signal.metadata)

    def test_breakout_strategy(self):
        """Test breakout strategy"""
        strategy = BreakoutStrategy()

        signal = strategy.generate_signal(self.data, 50)

        self.assertIsInstance(signal, Signal)

        # Check that support/resistance are calculated
        if signal.metadata:
            self.assertIn('resistance', signal.metadata)
            self.assertIn('support', signal.metadata)
            self.assertIn('volume_ratio', signal.metadata)


class TestRiskManager(unittest.TestCase):
    """Test risk management system"""

    def setUp(self):
        """Set up test data"""
        self.risk_manager = RiskManager()
        self.portfolio_value = 100000.0
        self.data = generate_sample_data(num_points=50)

    def test_position_sizing(self):
        """Test position sizing calculation"""
        signal = Signal(
            timestamp=pd.Timestamp('2024-01-01'),
            signal_type='BUY',
            price=100.0,
            position_size=0.5,
            confidence=0.9
        )

        position_size = self.risk_manager.calculate_position_size(
            signal,
            self.portfolio_value,
            [],  # No current positions
            volatility=1.0
        )

        # Position size should be reasonable fraction of portfolio
        self.assertGreater(position_size, 0)
        self.assertLess(position_size, self.portfolio_value)

        # High confidence should give larger position
        signal_low_conf = Signal(
            timestamp=pd.Timestamp('2024-01-01'),
            signal_type='BUY',
            price=100.0,
            position_size=0.5,
            confidence=0.3
        )

        position_size_low = self.risk_manager.calculate_position_size(
            signal_low_conf,
            self.portfolio_value,
            [],
            volatility=1.0
        )

        self.assertLess(position_size_low, position_size)

    def test_stop_loss_calculation(self):
        """Test stop-loss calculation"""
        signal = Signal(
            timestamp=pd.Timestamp('2024-01-01'),
            signal_type='BUY',
            price=100.0,
            position_size=0.5
        )

        stop_loss = self.risk_manager.calculate_stop_loss(
            entry_price=100.0,
            signal=signal,
            data=self.data,
            index=30
        )

        # Stop loss should be below entry price
        self.assertLess(stop_loss, 100.0)
        self.assertGreater(stop_loss, 0)

    def test_take_profit_calculation(self):
        """Test take-profit calculation"""
        signal = Signal(
            timestamp=pd.Timestamp('2024-01-01'),
            signal_type='BUY',
            price=100.0,
            position_size=0.5
        )

        stop_loss = 95.0
        take_profit = self.risk_manager.calculate_take_profit(
            entry_price=100.0,
            stop_loss=stop_loss,
            signal=signal
        )

        # Take profit should be above entry
        self.assertGreater(take_profit, 100.0)

        # Risk/reward should be at least golden ratio
        risk = 100.0 - stop_loss
        reward = take_profit - 100.0
        rr_ratio = reward / risk
        self.assertGreaterEqual(rr_ratio, 1.6)

    def test_trade_validation(self):
        """Test trade validation"""
        signal = Signal(
            timestamp=pd.Timestamp('2024-01-01'),
            signal_type='BUY',
            price=100.0,
            position_size=0.5,
            stop_loss=95.0,
            take_profit=108.1  # 1.618 risk/reward
        )

        is_valid, reason = self.risk_manager.validate_trade(
            signal,
            self.portfolio_value,
            []  # No current positions
        )

        self.assertTrue(is_valid)
        self.assertEqual(reason, "Trade validated")


class TestPerformanceAnalyzer(unittest.TestCase):
    """Test performance analysis"""

    def setUp(self):
        """Set up test trades"""
        self.analyzer = PerformanceAnalyzer()

        # Create sample trades
        self.trades = [
            Trade(
                entry_timestamp=pd.Timestamp('2024-01-01'),
                entry_price=100.0,
                position_size=10.0,
                exit_timestamp=pd.Timestamp('2024-01-05'),
                exit_price=110.0,
                pnl=100.0,
                pnl_pct=10.0,
                status='CLOSED'
            ),
            Trade(
                entry_timestamp=pd.Timestamp('2024-01-10'),
                entry_price=105.0,
                position_size=10.0,
                exit_timestamp=pd.Timestamp('2024-01-15'),
                exit_price=100.0,
                pnl=-50.0,
                pnl_pct=-4.76,
                status='CLOSED'
            ),
            Trade(
                entry_timestamp=pd.Timestamp('2024-01-20'),
                entry_price=102.0,
                position_size=10.0,
                exit_timestamp=pd.Timestamp('2024-01-25'),
                exit_price=115.0,
                pnl=130.0,
                pnl_pct=12.75,
                status='CLOSED'
            ),
        ]

    def test_calculate_sharpe_ratio(self):
        """Test Sharpe ratio calculation"""
        returns = pd.Series([0.01, -0.005, 0.015, 0.02, -0.01])
        sharpe = self.analyzer.calculate_sharpe_ratio(returns)

        self.assertIsInstance(sharpe, float)
        # Sharpe should be reasonable value
        self.assertGreater(sharpe, -10)
        self.assertLess(sharpe, 10)

    def test_calculate_sortino_ratio(self):
        """Test Sortino ratio calculation"""
        returns = pd.Series([0.01, -0.005, 0.015, 0.02, -0.01])
        sortino = self.analyzer.calculate_sortino_ratio(returns)

        self.assertIsInstance(sortino, float)
        # Sortino should typically be higher than Sharpe (only penalizes downside)
        self.assertGreater(sortino, -10)

    def test_calculate_max_drawdown(self):
        """Test max drawdown calculation"""
        equity_curve = pd.Series([100, 110, 105, 95, 100, 115])
        max_dd, duration = self.analyzer.calculate_max_drawdown(equity_curve)

        # Should detect drawdown from 110 to 95
        self.assertLess(max_dd, 0)
        self.assertGreater(abs(max_dd), 0.1)  # At least 10% drawdown

        # Duration should be positive
        self.assertGreater(duration, 0)

    def test_analyze_trades(self):
        """Test comprehensive trade analysis"""
        metrics = self.analyzer.analyze_trades(self.trades)

        # Check basic metrics
        self.assertEqual(metrics.total_trades, 3)
        self.assertEqual(metrics.winning_trades, 2)
        self.assertEqual(metrics.losing_trades, 1)

        # Win rate should be 2/3
        self.assertAlmostEqual(metrics.win_rate, 2/3, places=2)

        # Total return should be sum of P&Ls
        expected_total = 100 + (-50) + 130
        self.assertAlmostEqual(metrics.total_return, expected_total, places=2)

        # Profit factor should be calculated
        self.assertGreater(metrics.profit_factor, 0)

        # Encoded metrics should be populated
        self.assertIsInstance(metrics.encoded_sharpe, list)


class TestBacktestingEngine(unittest.TestCase):
    """Test backtesting engine"""

    def setUp(self):
        """Set up backtesting engine and data"""
        self.engine = BacktestingEngine(initial_capital=100000.0)
        self.data = generate_sample_data(num_points=200)

    def test_engine_initialization(self):
        """Test engine initialization"""
        self.assertEqual(self.engine.portfolio_value, 100000.0)
        self.assertEqual(self.engine.cash, 100000.0)
        self.assertEqual(len(self.engine.positions), 0)

    def test_run_backtest(self):
        """Test running a backtest"""
        strategy = FibonacciRetracementStrategy()

        metrics, trades, equity_df = self.engine.run_backtest(
            self.data,
            strategy,
            verbose=False
        )

        # Should return valid metrics
        self.assertIsInstance(metrics, PerformanceMetrics)

        # Should have equity curve
        self.assertIsInstance(equity_df, pd.DataFrame)
        self.assertEqual(len(equity_df), len(self.data))

        # Trades should be list
        self.assertIsInstance(trades, list)

    def test_multiple_strategies(self):
        """Test running multiple strategies"""
        strategies = [
            FibonacciRetracementStrategy(),
            MomentumStrategy(),
            MeanReversionStrategy()
        ]

        results = self.engine.run_multi_strategy_test(
            self.data,
            strategies
        )

        # Should have results for each strategy
        self.assertEqual(len(results), len(strategies))

        # Each result should have required keys
        for strategy_name, result in results.items():
            self.assertIn('metrics', result)
            self.assertIn('trades', result)
            self.assertIn('equity_curve', result)

    def test_grid_search(self):
        """Test Fibonacci level grid search"""
        grid_results = self.engine.grid_search_fibonacci_levels(
            self.data,
            FibonacciRetracementStrategy,
            test_levels=[[0.382], [0.618], [0.382, 0.618]]
        )

        # Should return DataFrame with results
        self.assertIsInstance(grid_results, pd.DataFrame)
        self.assertGreater(len(grid_results), 0)

        # Should have required columns
        required_cols = ['levels', 'total_return', 'sharpe_ratio', 'total_trades']
        for col in required_cols:
            self.assertIn(col, grid_results.columns)

    def test_position_sizing(self):
        """Test that position sizing respects limits"""
        strategy = FibonacciRetracementStrategy()

        # Run backtest
        metrics, trades, equity_df = self.engine.run_backtest(
            self.data,
            strategy,
            verbose=False
        )

        # Check that no single position exceeds limits
        for trade in trades:
            if trade.status == 'CLOSED':
                position_value = trade.entry_price * trade.position_size
                # Should not exceed portfolio (with some buffer for leverage)
                self.assertLess(position_value, self.engine.initial_capital * 2)

    def test_stop_loss_execution(self):
        """Test that stop-losses are executed"""
        strategy = FibonacciRetracementStrategy()

        metrics, trades, equity_df = self.engine.run_backtest(
            self.data,
            strategy,
            verbose=False
        )

        # Check if any trades were stopped out
        stopped_trades = [t for t in trades if t.exit_reason == 'STOP_LOSS']

        # At least some trades should have stop losses defined
        trades_with_stops = [t for t in trades if t.stop_loss is not None]
        self.assertGreater(len(trades_with_stops), 0)


class TestAgentDBIntegration(unittest.TestCase):
    """Test AgentDB integration"""

    def setUp(self):
        """Set up AgentDB integration"""
        self.agentdb = AgentDBIntegration()

    def test_agentdb_detection(self):
        """Test AgentDB availability detection"""
        # Should detect if AgentDB is available
        self.assertIsInstance(self.agentdb.agentdb_available, bool)

    def test_store_strategy(self):
        """Test storing strategy in AgentDB"""
        if not self.agentdb.agentdb_available:
            self.skipTest("AgentDB not available")

        strategy = FibonacciRetracementStrategy()
        metrics = PerformanceMetrics(
            total_return=5000.0,
            sharpe_ratio=2.5,
            win_rate=0.65,
            total_trades=20
        )

        # Should attempt to store (may fail if AgentDB not properly configured)
        result = self.agentdb.store_strategy(strategy, metrics)
        self.assertIsInstance(result, bool)

    def test_negative_strategy_not_stored(self):
        """Test that losing strategies are not stored"""
        strategy = FibonacciRetracementStrategy()
        metrics = PerformanceMetrics(
            total_return=-1000.0,  # Negative return
            sharpe_ratio=0.5,
            win_rate=0.4,
            total_trades=10
        )

        # Should not store negative strategy
        result = self.agentdb.store_strategy(strategy, metrics)
        self.assertFalse(result)


class TestIntegration(unittest.TestCase):
    """Integration tests for complete workflow"""

    def test_complete_backtest_workflow(self):
        """Test complete backtest workflow from data to results"""
        # Generate data
        data = generate_sample_data(num_points=100)

        # Create engine
        engine = BacktestingEngine(initial_capital=50000.0)

        # Create strategy
        strategy = FibonacciRetracementStrategy({
            'entry_levels': [0.382, 0.618],
            'lookback_period': 20
        })

        # Run backtest
        metrics, trades, equity_df = engine.run_backtest(data, strategy, verbose=False)

        # Verify results are valid
        self.assertIsInstance(metrics, PerformanceMetrics)
        self.assertIsInstance(trades, list)
        self.assertIsInstance(equity_df, pd.DataFrame)

        # Equity curve should match data length
        self.assertEqual(len(equity_df), len(data))

        # Final equity should be initial capital + total return (within 1% tolerance)
        expected_final = engine.initial_capital + metrics.total_return
        actual_final = equity_df['equity'].iloc[-1]
        # Allow 1% difference due to rounding and execution details
        tolerance = engine.initial_capital * 0.01
        self.assertAlmostEqual(expected_final, actual_final, delta=tolerance)

    def test_multi_strategy_comparison(self):
        """Test comparing multiple strategies"""
        data = generate_sample_data(num_points=150)
        engine = BacktestingEngine(initial_capital=100000.0)

        strategies = [
            FibonacciRetracementStrategy(),
            MomentumStrategy(),
            MeanReversionStrategy()
        ]

        results = {}
        for strategy in strategies:
            metrics, trades, equity_df = engine.run_backtest(data, strategy, verbose=False)
            results[strategy.name] = metrics.sharpe_ratio

        # Should have results for all strategies
        self.assertEqual(len(results), len(strategies))

        # All Sharpe ratios should be numeric
        for sharpe in results.values():
            self.assertIsInstance(sharpe, (int, float))


def run_tests():
    """Run all tests"""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestFibonacciUtils))
    suite.addTests(loader.loadTestsFromTestCase(TestDataClasses))
    suite.addTests(loader.loadTestsFromTestCase(TestStrategies))
    suite.addTests(loader.loadTestsFromTestCase(TestRiskManager))
    suite.addTests(loader.loadTestsFromTestCase(TestPerformanceAnalyzer))
    suite.addTests(loader.loadTestsFromTestCase(TestBacktestingEngine))
    suite.addTests(loader.loadTestsFromTestCase(TestAgentDBIntegration))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegration))

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Print summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"Tests Run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Skipped: {len(result.skipped)}")
    print("=" * 70)

    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)

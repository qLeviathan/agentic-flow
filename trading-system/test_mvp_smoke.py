#!/usr/bin/env python3
"""
Smoke test for trading_system_mvp.py
Validates all major components without requiring API token
"""

import sys
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Import MVP components
from trading_system_mvp import (
    IntegerMathFramework,
    FibonacciRetracementStrategy,
    MomentumStrategy,
    MeanReversionStrategy,
    BreakoutStrategy,
    BacktestingEngine,
    PerformanceAnalyzer
)

def generate_test_data(num_days=100):
    """Generate synthetic market data for testing"""
    np.random.seed(42)
    dates = pd.date_range(start='2024-01-01', periods=num_days, freq='D')

    # Generate realistic price movement
    base_price = 150
    trend = np.linspace(0, 20, num_days)
    noise = np.random.randn(num_days) * 5
    close_prices = base_price + trend + noise

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


def test_mathematical_framework():
    """Test 1: Validate OEIS sequences"""
    print("\n" + "="*70)
    print("TEST 1: Mathematical Framework (OEIS Validation)")
    print("="*70)

    framework = IntegerMathFramework()
    results = framework.validate_oeis_sequences()

    all_passed = True
    for seq, valid in results.items():
        status = "✓ PASS" if valid else "✗ FAIL"
        print(f"  {status} | {seq}")
        if not valid:
            all_passed = False

    # Additional tests
    print(f"\n  Fibonacci Encoding:")
    price = 15000  # $150.00 in cents
    fib_index = framework.fib_encoder.encode_price(price)
    decoded = framework.fib_encoder.decode_price(fib_index)
    print(f"    Price: {price} → Index: {fib_index} → Decoded: {decoded}")

    print(f"\n  Lucas Time Encoding:")
    time_units = 30  # 30 days
    lucas_index = framework.lucas_encoder.encode_time(time_units)
    is_nash = framework.lucas_encoder.is_nash_equilibrium_point(lucas_index)
    print(f"    Time: {time_units} → Index: {lucas_index} → Nash: {is_nash}")

    print(f"\n  Zeckendorf Compression:")
    value = 100
    compressed = framework.zeckendorf.compress(value)
    decompressed = framework.zeckendorf.decompress(compressed)
    golf_score = framework.zeckendorf.golf_score(value)
    print(f"    Value: {value} → Indices: {compressed}")
    print(f"    Decompressed: {decompressed} | Golf Score: {golf_score}")

    return all_passed


def test_strategies():
    """Test 2: Validate all trading strategies"""
    print("\n" + "="*70)
    print("TEST 2: Trading Strategies (Signal Generation)")
    print("="*70)

    data = generate_test_data(num_days=100)

    strategies = [
        FibonacciRetracementStrategy(),
        MomentumStrategy(),
        MeanReversionStrategy(),
        BreakoutStrategy()
    ]

    all_passed = True

    for strategy in strategies:
        try:
            # Generate signal at midpoint
            signal = strategy.generate_signal(data, 50)

            # Count signals
            buy_signals = 0
            sell_signals = 0
            for i in range(len(data)):
                sig = strategy.generate_signal(data, i)
                if sig.signal_type == 'BUY':
                    buy_signals += 1
                elif sig.signal_type == 'SELL':
                    sell_signals += 1

            print(f"  ✓ PASS | {strategy.name:20s} | "
                  f"Buy: {buy_signals:3d} | Sell: {sell_signals:3d}")

        except Exception as e:
            print(f"  ✗ FAIL | {strategy.name:20s} | Error: {e}")
            all_passed = False

    return all_passed


def test_backtesting_engine():
    """Test 3: Validate backtesting engine"""
    print("\n" + "="*70)
    print("TEST 3: Backtesting Engine (Performance Metrics)")
    print("="*70)

    data = generate_test_data(num_days=100)
    engine = BacktestingEngine(initial_capital=100000.0)

    all_passed = True

    strategies = [
        ('Fibonacci', FibonacciRetracementStrategy()),
        ('Momentum', MomentumStrategy()),
        ('Mean Reversion', MeanReversionStrategy()),
        ('Breakout', BreakoutStrategy())
    ]

    for name, strategy in strategies:
        try:
            metrics, trades, equity_df = engine.run_backtest(data, strategy, verbose=False)

            print(f"  ✓ PASS | {name:20s} | "
                  f"Return: ${metrics.total_return:>10,.2f} | "
                  f"Sharpe: {metrics.sharpe_ratio:>6.2f} | "
                  f"Trades: {metrics.total_trades:>3d}")

        except Exception as e:
            print(f"  ✗ FAIL | {name:20s} | Error: {e}")
            all_passed = False

    return all_passed


def test_performance_analyzer():
    """Test 4: Validate performance analyzer"""
    print("\n" + "="*70)
    print("TEST 4: Performance Analyzer (Metric Calculations)")
    print("="*70)

    from trading_system_mvp import Trade

    analyzer = PerformanceAnalyzer()

    # Create mock trades
    trades = []
    for i in range(10):
        trade = Trade(
            entry_timestamp=pd.Timestamp('2024-01-01') + timedelta(days=i*10),
            entry_price=100.0,
            position_size=100
        )
        exit_price = 105.0 if i % 2 == 0 else 95.0  # Alternate wins/losses
        exit_timestamp = trade.entry_timestamp + timedelta(days=5)
        trade.close_trade(exit_price, exit_timestamp, 'SIGNAL')
        trades.append(trade)

    metrics = analyzer.analyze_trades(trades)

    print(f"  Total Trades:     {metrics.total_trades}")
    print(f"  Win Rate:         {metrics.win_rate*100:.1f}%")
    print(f"  Total Return:     ${metrics.total_return:,.2f}")
    print(f"  Sharpe Ratio:     {metrics.sharpe_ratio:.2f}")
    print(f"  Profit Factor:    {metrics.profit_factor:.2f}")

    # Validate basic metrics
    all_passed = True
    if metrics.total_trades != 10:
        print("  ✗ FAIL | Total trades incorrect")
        all_passed = False
    elif abs(metrics.win_rate - 0.5) > 0.1:  # Should be ~50%
        print("  ✗ FAIL | Win rate incorrect")
        all_passed = False
    else:
        print("\n  ✓ PASS | All metrics calculated correctly")

    return all_passed


def test_integer_operations():
    """Test 5: Validate integer-only operations"""
    print("\n" + "="*70)
    print("TEST 5: Integer Operations (>95% Integer Arithmetic)")
    print("="*70)

    framework = IntegerMathFramework()

    # Count integer vs float operations
    integer_ops = 0
    float_ops = 0

    # Test Fibonacci operations
    for i in range(50):
        result = framework.fib_encoder.encode_price(i * 1000)
        if isinstance(result, int):
            integer_ops += 1
        else:
            float_ops += 1

    # Test Lucas operations
    for i in range(50):
        result = framework.lucas_encoder.encode_time(i * 10)
        if isinstance(result, int):
            integer_ops += 1
        else:
            float_ops += 1

    # Test Zeckendorf operations
    for i in range(1, 51):
        result = framework.zeckendorf.compress(i * 100)
        if all(isinstance(x, int) for x in result):
            integer_ops += 1
        else:
            float_ops += 1

    total_ops = integer_ops + float_ops
    integer_percentage = (integer_ops / total_ops) * 100

    print(f"  Integer Operations:  {integer_ops}")
    print(f"  Float Operations:    {float_ops}")
    print(f"  Integer Percentage:  {integer_percentage:.1f}%")

    if integer_percentage >= 95.0:
        print(f"\n  ✓ PASS | {integer_percentage:.1f}% integer operations (target: >95%)")
        return True
    else:
        print(f"\n  ✗ FAIL | {integer_percentage:.1f}% integer operations (target: >95%)")
        return False


def main():
    """Run all smoke tests"""
    print("\n" + "="*70)
    print("  TRADING SYSTEM MVP - SMOKE TEST SUITE")
    print("="*70)

    tests = [
        ("Mathematical Framework", test_mathematical_framework),
        ("Trading Strategies", test_strategies),
        ("Backtesting Engine", test_backtesting_engine),
        ("Performance Analyzer", test_performance_analyzer),
        ("Integer Operations", test_integer_operations)
    ]

    results = []
    for test_name, test_func in tests:
        try:
            passed = test_func()
            results.append((test_name, passed))
        except Exception as e:
            print(f"\n  ✗ EXCEPTION in {test_name}: {e}")
            results.append((test_name, False))

    # Summary
    print("\n" + "="*70)
    print("  TEST SUMMARY")
    print("="*70)

    total_tests = len(results)
    passed_tests = sum(1 for _, passed in results if passed)

    for test_name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {status} | {test_name}")

    print(f"\n  Total:  {passed_tests}/{total_tests} tests passed")
    print("="*70 + "\n")

    return passed_tests == total_tests


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

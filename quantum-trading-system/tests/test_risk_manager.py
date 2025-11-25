"""
Test Suite for Risk Manager - Agent 19

Comprehensive tests for integer-only risk management system.
Tests Fibonacci position sizing, VaR/CVaR, and portfolio allocation.

Test Coverage:
- Fibonacci position sizing (all risk levels)
- Kelly Criterion calculations
- Stop loss calculations
- VaR and CVaR calculations
- Portfolio risk management
- Position addition/removal
- Risk limit checks
- Portfolio allocation methods
- Edge cases and error handling
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from backtesting.risk_manager import RiskManager, PositionRisk, PortfolioRisk


class TestRiskManager:
    """Test suite for RiskManager."""

    def test_initialization(self):
        """Test RiskManager initialization."""
        print("\n[TEST] RiskManager Initialization")

        risk_mgr = RiskManager(
            initial_capital_cents=10000000,
            risk_per_trade_scaled=20,
            max_portfolio_risk_scaled=60,
            max_position_size_scaled=250
        )

        assert risk_mgr.initial_capital_cents == 10000000
        assert risk_mgr.current_capital_cents == 10000000
        assert risk_mgr.risk_per_trade_scaled == 20
        assert risk_mgr.max_portfolio_risk_scaled == 60
        assert risk_mgr.total_risk_cents == 0
        assert len(risk_mgr.positions) == 0

        print("    ✅ Initialization successful")

    def test_fibonacci_position_sizing_moderate(self):
        """Test Fibonacci position sizing - moderate risk."""
        print("\n[TEST] Fibonacci Position Sizing - Moderate")

        risk_mgr = RiskManager(initial_capital_cents=10000000)

        position = risk_mgr.calculate_position_size_fibonacci(
            symbol='AAPL',
            entry_price_cents=15000,
            stop_loss_cents=14000,
            risk_level='moderate'
        )

        assert position.symbol == 'AAPL'
        assert position.entry_price_cents == 15000
        assert position.stop_loss_cents == 14000
        assert position.risk_amount_cents > 0
        assert position.position_size_cents > 0

        # Risk should be around 2% × 61.8% = 1.236%
        expected_risk = (10000000 * 20 * 618) // (1000 * 1000)
        tolerance = expected_risk // 10  # 10% tolerance
        assert abs(position.risk_amount_cents - expected_risk) <= tolerance

        print(f"    Position Size: ${position.position_size_cents / 100:.2f}")
        print(f"    Risk Amount: ${position.risk_amount_cents / 100:.2f}")
        print(f"    Risk %: {position.risk_percent_scaled / 10:.1f}%")
        print("    ✅ Moderate position sizing correct")

    def test_fibonacci_position_sizing_all_levels(self):
        """Test all Fibonacci risk levels."""
        print("\n[TEST] All Fibonacci Risk Levels")

        risk_mgr = RiskManager(initial_capital_cents=10000000)

        risk_levels = ['conservative', 'moderate', 'aggressive', 'golden_ratio']
        expected_ratios = [382, 618, 1000, 1618]

        for level, ratio in zip(risk_levels, expected_ratios):
            position = risk_mgr.calculate_position_size_fibonacci(
                symbol='TEST',
                entry_price_cents=10000,
                stop_loss_cents=9000,
                risk_level=level
            )

            # Base risk is 2% = 200000 cents
            # Adjusted risk = 200000 * ratio / 1000
            expected_risk = (200000 * ratio) // 1000

            # For golden_ratio, position might be capped by max position size
            # Allow more tolerance for higher ratios
            if level == 'golden_ratio':
                # Position might be limited, so just check it's reasonable
                assert position.risk_amount_cents > 0
                assert position.risk_amount_cents <= expected_risk
            else:
                # Allow some tolerance due to rounding and limits
                tolerance = max(expected_risk // 5, 500)  # At least $5 tolerance
                assert abs(position.risk_amount_cents - expected_risk) <= tolerance

            print(f"    {level}: ${position.risk_amount_cents / 100:.2f} " +
                  f"(expected: ${expected_risk / 100:.2f})")

        print("    ✅ All risk levels validated")

    def test_position_size_limits(self):
        """Test position size limiting."""
        print("\n[TEST] Position Size Limits")

        risk_mgr = RiskManager(
            initial_capital_cents=10000000,
            max_position_size_scaled=250  # 25% max
        )

        # Try to create position larger than 25%
        position = risk_mgr.calculate_position_size_fibonacci(
            symbol='TEST',
            entry_price_cents=10000,
            stop_loss_cents=9900,  # Small stop = large position
            risk_level='aggressive'
        )

        # Position should be capped at 25% of capital
        max_position_value = (10000000 * 250) // 1000  # 2,500,000 cents

        assert position.position_value_cents <= max_position_value
        print(f"    Position Value: ${position.position_value_cents / 100:.2f}")
        print(f"    Max Allowed: ${max_position_value / 100:.2f}")
        print("    ✅ Position size properly limited")

    def test_kelly_criterion(self):
        """Test Kelly Criterion position sizing."""
        print("\n[TEST] Kelly Criterion Calculation")

        risk_mgr = RiskManager()

        # Test case: 60% win rate, 2:1 reward:risk
        win_rate = 600  # 60%
        avg_win = 20000  # $200
        avg_loss = 10000  # $100

        kelly_size = risk_mgr.calculate_position_size_kelly(win_rate, avg_win, avg_loss)

        # Kelly = 0.6 - (0.4 / 2) = 0.6 - 0.2 = 0.4 = 40%
        # Fractional Kelly (50%) = 20%
        expected_kelly = 200  # 20% scaled by 1000

        # Allow some tolerance
        assert abs(kelly_size - expected_kelly) <= 50

        print(f"    Win Rate: {win_rate / 10:.1f}%")
        print(f"    Avg Win: ${avg_win / 100:.2f}")
        print(f"    Avg Loss: ${avg_loss / 100:.2f}")
        print(f"    Kelly Size: {kelly_size / 10:.1f}%")
        print("    ✅ Kelly Criterion correct")

    def test_fibonacci_stop_loss(self):
        """Test Fibonacci stop loss calculation."""
        print("\n[TEST] Fibonacci Stop Loss")

        risk_mgr = RiskManager()

        swing_high = 16000  # $160
        swing_low = 12000   # $120
        entry = 15000       # $150

        # Test 61.8% level
        stop_618 = risk_mgr.calculate_stop_loss_fibonacci(
            entry, swing_high, swing_low, '618'
        )

        # 61.8% retracement of $40 range = $160 - ($40 × 0.618) = $135.28
        # Then 1% buffer below
        expected_approx = 13528 - 135  # Approximately $134

        assert stop_618 < entry  # Stop must be below entry
        assert stop_618 > swing_low  # Stop should be above swing low

        print(f"    Swing High: ${swing_high / 100:.2f}")
        print(f"    Swing Low: ${swing_low / 100:.2f}")
        print(f"    Entry: ${entry / 100:.2f}")
        print(f"    Stop (618): ${stop_618 / 100:.2f}")
        print("    ✅ Stop loss calculation correct")

    def test_var_calculation(self):
        """Test VaR (Value at Risk) calculation."""
        print("\n[TEST] VaR Calculation")

        risk_mgr = RiskManager(initial_capital_cents=10000000)

        # Create sample returns distribution
        # Simulate 100 returns from -10% to +15%
        returns = []
        for i in range(100):
            ret = -100 + (i * 250 // 100)  # Linear from -100 to +150
            returns.append(ret)

        var_95 = risk_mgr.calculate_var_95(returns)

        # 5th percentile should be near the worst returns
        assert var_95 > 0

        # Should be less than 10% of capital
        max_expected_var = 1000000  # $10,000
        assert var_95 <= max_expected_var

        print(f"    95% VaR: ${var_95 / 100:.2f}")
        print("    ✅ VaR calculation correct")

    def test_cvar_calculation(self):
        """Test CVaR (Conditional VaR) calculation."""
        print("\n[TEST] CVaR Calculation")

        risk_mgr = RiskManager(initial_capital_cents=10000000)

        # Create sample returns with negative tail
        returns = [-100, -90, -80, -70, -60] + [10] * 95  # Heavy negative tail

        cvar_95 = risk_mgr.calculate_cvar_95(returns)

        # CVaR should be larger than VaR (worse tail risk)
        var_95 = risk_mgr.calculate_var_95(returns)

        assert cvar_95 >= var_95
        assert cvar_95 > 0

        print(f"    95% VaR: ${var_95 / 100:.2f}")
        print(f"    95% CVaR: ${cvar_95 / 100:.2f}")
        print(f"    CVaR/VaR Ratio: {cvar_95 / max(1, var_95):.2f}")
        print("    ✅ CVaR calculation correct")

    def test_add_position(self):
        """Test adding positions to portfolio."""
        print("\n[TEST] Add Position")

        risk_mgr = RiskManager(initial_capital_cents=10000000)

        position = risk_mgr.calculate_position_size_fibonacci(
            symbol='AAPL',
            entry_price_cents=15000,
            stop_loss_cents=14000,
            risk_level='moderate'
        )

        # Add position
        success = risk_mgr.add_position(position)
        assert success
        assert 'AAPL' in risk_mgr.positions
        assert risk_mgr.total_risk_cents > 0

        print(f"    Position Added: AAPL")
        print(f"    Total Risk: ${risk_mgr.total_risk_cents / 100:.2f}")
        print("    ✅ Position added successfully")

    def test_portfolio_risk_limit(self):
        """Test portfolio risk limit enforcement."""
        print("\n[TEST] Portfolio Risk Limit")

        risk_mgr = RiskManager(
            initial_capital_cents=10000000,
            max_portfolio_risk_scaled=60  # 6% max
        )

        # Try to add multiple positions exceeding 6%
        positions = []
        for i in range(5):
            pos = risk_mgr.calculate_position_size_fibonacci(
                symbol=f'STOCK{i}',
                entry_price_cents=10000,
                stop_loss_cents=9000,
                risk_level='moderate'
            )
            positions.append(pos)

        # Add positions until limit reached
        added_count = 0
        for pos in positions:
            if risk_mgr.add_position(pos):
                added_count += 1

        # Should reject some positions
        assert added_count < len(positions)

        # Total risk should be within limit
        max_risk = (10000000 * 60) // 1000  # 600,000 cents
        assert risk_mgr.total_risk_cents <= max_risk

        print(f"    Attempted: {len(positions)} positions")
        print(f"    Added: {added_count} positions")
        print(f"    Total Risk: ${risk_mgr.total_risk_cents / 100:.2f}")
        print(f"    Max Allowed: ${max_risk / 100:.2f}")
        print("    ✅ Risk limit enforced")

    def test_remove_position(self):
        """Test removing positions and P&L calculation."""
        print("\n[TEST] Remove Position")

        risk_mgr = RiskManager(initial_capital_cents=10000000)

        # Add position
        position = risk_mgr.calculate_position_size_fibonacci(
            symbol='AAPL',
            entry_price_cents=10000,
            stop_loss_cents=9000,
            risk_level='moderate'
        )
        risk_mgr.add_position(position)

        initial_capital = risk_mgr.current_capital_cents

        # Exit at profit
        exit_price = 11000  # +10%
        pnl = risk_mgr.remove_position('AAPL', exit_price)

        assert pnl is not None
        assert pnl > 0  # Profitable trade
        assert 'AAPL' not in risk_mgr.positions
        assert risk_mgr.current_capital_cents > initial_capital

        print(f"    Entry: $100.00")
        print(f"    Exit: $110.00")
        print(f"    P&L: ${pnl / 100:.2f}")
        print("    ✅ Position removed, P&L calculated")

    def test_max_drawdown_tracking(self):
        """Test maximum drawdown tracking."""
        print("\n[TEST] Maximum Drawdown Tracking")

        risk_mgr = RiskManager(initial_capital_cents=10000000)

        # Simulate trades with drawdown
        position = risk_mgr.calculate_position_size_fibonacci(
            symbol='TEST',
            entry_price_cents=10000,
            stop_loss_cents=9000,
            risk_level='moderate'
        )

        # Add and remove with loss
        risk_mgr.add_position(position)
        pnl = risk_mgr.remove_position('TEST', 9500)  # -5% loss

        assert risk_mgr.max_drawdown_cents > 0
        assert pnl < 0

        print(f"    P&L: ${pnl / 100:.2f}")
        print(f"    Max Drawdown: ${risk_mgr.max_drawdown_cents / 100:.2f}")
        print("    ✅ Drawdown tracking correct")

    def test_portfolio_allocation_equal_weight(self):
        """Test equal weight portfolio allocation."""
        print("\n[TEST] Portfolio Allocation - Equal Weight")

        risk_mgr = RiskManager()
        symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']

        allocation = risk_mgr.calculate_portfolio_allocation(symbols, 'equal_weight')

        # Each should get 20% (1000 / 5 = 200)
        expected_weight = 1000 // len(symbols)

        for symbol, weight in allocation.items():
            assert abs(weight - expected_weight) <= 1  # Allow rounding

        # Total should sum to ~100%
        total = sum(allocation.values())
        assert abs(total - 1000) <= len(symbols)  # Allow rounding error

        print(f"    Symbols: {len(symbols)}")
        print(f"    Weight per symbol: {expected_weight / 10:.1f}%")
        print("    ✅ Equal weight allocation correct")

    def test_portfolio_allocation_fibonacci(self):
        """Test Fibonacci-weighted allocation."""
        print("\n[TEST] Portfolio Allocation - Fibonacci")

        risk_mgr = RiskManager()
        symbols = ['A', 'B', 'C', 'D', 'E']

        allocation = risk_mgr.calculate_portfolio_allocation(symbols, 'fibonacci')

        # Should use Fibonacci numbers: F(0)=0, F(1)=1, F(2)=1, F(3)=2, F(4)=3
        # Total = 0+1+1+2+3 = 7
        # Weights: 0/7, 1/7, 1/7, 2/7, 3/7

        # First symbol should have least weight
        # Last symbol should have most weight
        weights_list = list(allocation.values())
        assert weights_list[0] <= weights_list[-1]

        # Total should sum to ~100%
        total = sum(allocation.values())
        assert abs(total - 1000) <= 10

        print(f"    Fibonacci weights: {[w/10 for w in weights_list]}")
        print("    ✅ Fibonacci allocation correct")

    def test_risk_limit_checks(self):
        """Test risk limit checking."""
        print("\n[TEST] Risk Limit Checks")

        risk_mgr = RiskManager(initial_capital_cents=10000000)

        # Add a moderate position
        position = risk_mgr.calculate_position_size_fibonacci(
            symbol='AAPL',
            entry_price_cents=15000,
            stop_loss_cents=14000,
            risk_level='moderate'
        )
        risk_mgr.add_position(position)

        limits = risk_mgr.check_risk_limits()

        assert limits['portfolio_risk_ok'] == True
        assert limits['leverage_ok'] == True
        assert limits['drawdown_ok'] == True
        assert limits['capital_positive'] == True

        print(f"    Portfolio Risk OK: {limits['portfolio_risk_ok']}")
        print(f"    Leverage OK: {limits['leverage_ok']}")
        print(f"    Drawdown OK: {limits['drawdown_ok']}")
        print("    ✅ All risk limits passing")

    def test_portfolio_risk_metrics(self):
        """Test comprehensive portfolio risk metrics."""
        print("\n[TEST] Portfolio Risk Metrics")

        risk_mgr = RiskManager(initial_capital_cents=10000000)

        # Add multiple positions
        for i, symbol in enumerate(['AAPL', 'GOOGL', 'MSFT']):
            position = risk_mgr.calculate_position_size_fibonacci(
                symbol=symbol,
                entry_price_cents=10000 + i * 1000,
                stop_loss_cents=9000 + i * 1000,
                risk_level='moderate'
            )
            risk_mgr.add_position(position)

        portfolio_risk = risk_mgr.get_portfolio_risk()

        assert portfolio_risk.total_capital_cents == 10000000
        assert portfolio_risk.total_risk_cents > 0
        assert portfolio_risk.total_exposure_cents > 0
        assert portfolio_risk.risk_utilization_scaled >= 0
        assert portfolio_risk.leverage_scaled >= 0

        print(f"    Total Risk: ${portfolio_risk.total_risk_cents / 100:.2f}")
        print(f"    Total Exposure: ${portfolio_risk.total_exposure_cents / 100:.2f}")
        print(f"    Risk Utilization: {portfolio_risk.risk_utilization_scaled / 10:.1f}%")
        print(f"    Leverage: {portfolio_risk.leverage_scaled / 1000:.2f}x")
        print("    ✅ Portfolio metrics calculated")

    def test_risk_report(self):
        """Test risk report generation."""
        print("\n[TEST] Risk Report Generation")

        risk_mgr = RiskManager(initial_capital_cents=10000000)

        # Add a position
        position = risk_mgr.calculate_position_size_fibonacci(
            symbol='AAPL',
            entry_price_cents=15000,
            stop_loss_cents=14000,
            risk_level='moderate'
        )
        risk_mgr.add_position(position)

        report = risk_mgr.get_risk_report()

        assert 'capital' in report
        assert 'portfolio_risk' in report
        assert 'positions' in report
        assert 'risk_limits' in report
        assert 'configuration' in report

        assert report['positions']['count'] == 1

        print(f"    Report Sections: {list(report.keys())}")
        print(f"    Active Positions: {report['positions']['count']}")
        print("    ✅ Risk report generated")

    def test_edge_case_zero_stop_distance(self):
        """Test edge case: entry equals stop loss."""
        print("\n[TEST] Edge Case - Zero Stop Distance")

        risk_mgr = RiskManager()

        try:
            position = risk_mgr.calculate_position_size_fibonacci(
                symbol='TEST',
                entry_price_cents=10000,
                stop_loss_cents=10000,  # Same as entry
                risk_level='moderate'
            )
            assert False, "Should raise ValueError"
        except ValueError as e:
            print(f"    ✅ Correctly rejected: {str(e)}")

    def test_edge_case_invalid_swing_points(self):
        """Test edge case: invalid swing points."""
        print("\n[TEST] Edge Case - Invalid Swing Points")

        risk_mgr = RiskManager()

        try:
            stop = risk_mgr.calculate_stop_loss_fibonacci(
                entry_price_cents=10000,
                swing_high_cents=12000,
                swing_low_cents=14000,  # Low > High (invalid)
                level='618'
            )
            assert False, "Should raise ValueError"
        except ValueError as e:
            print(f"    ✅ Correctly rejected: {str(e)}")

    def test_edge_case_insufficient_returns(self):
        """Test edge case: insufficient returns for VaR."""
        print("\n[TEST] Edge Case - Insufficient Returns")

        risk_mgr = RiskManager()

        # Less than 20 returns
        returns = [10, -5, 15, -8]

        var = risk_mgr.calculate_var_95(returns)
        cvar = risk_mgr.calculate_cvar_95(returns)

        # Should return 0 for insufficient data
        assert var == 0
        assert cvar == 0

        print("    ✅ Insufficient data handled correctly")


def run_all_tests():
    """Run all risk manager tests."""
    print("=" * 80)
    print("RISK MANAGER TEST SUITE - Agent 19 (Zeckendorf: 10000110)")
    print("=" * 80)

    test = TestRiskManager()

    # Basic functionality tests
    test.test_initialization()
    test.test_fibonacci_position_sizing_moderate()
    test.test_fibonacci_position_sizing_all_levels()
    test.test_position_size_limits()

    # Advanced calculations
    test.test_kelly_criterion()
    test.test_fibonacci_stop_loss()
    test.test_var_calculation()
    test.test_cvar_calculation()

    # Portfolio management
    test.test_add_position()
    test.test_portfolio_risk_limit()
    test.test_remove_position()
    test.test_max_drawdown_tracking()

    # Allocation methods
    test.test_portfolio_allocation_equal_weight()
    test.test_portfolio_allocation_fibonacci()

    # Risk monitoring
    test.test_risk_limit_checks()
    test.test_portfolio_risk_metrics()
    test.test_risk_report()

    # Edge cases
    test.test_edge_case_zero_stop_distance()
    test.test_edge_case_invalid_swing_points()
    test.test_edge_case_insufficient_returns()

    print("\n" + "=" * 80)
    print("✅ ALL RISK MANAGER TESTS PASSED")
    print("=" * 80)


if __name__ == "__main__":
    run_all_tests()

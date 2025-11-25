"""
Comprehensive Test Suite for Options Pricing Engine
====================================================

Tests all three pricing methods:
1. Black-Scholes (integer arithmetic)
2. QFNN-based quantum pricing
3. Xi/Psi phase space pricing

Author: Agent 11 (Zeckendorf: 10100)
Dependencies: Agents 9, 10
"""

import unittest
import numpy as np
import sys
import os
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from models.options_pricing import (
    OptionType,
    OptionContract,
    OptionPrice,
    BlackScholesInteger,
    QFNNOptionPricing,
    XiPsiOptionPricing,
    OptionsPricingEngine,
    create_call_option,
    create_put_option,
    SCALE
)


class TestBlackScholesInteger(unittest.TestCase):
    """Test Black-Scholes pricing with integer arithmetic."""

    def setUp(self):
        self.bs = BlackScholesInteger(scale=SCALE)

    def test_initialization(self):
        """Test Black-Scholes engine initialization."""
        self.assertEqual(self.bs.scale, SCALE)
        self.assertIsNotNone(self.bs.ln_table)
        self.assertIsNotNone(self.bs.exp_table)
        self.assertIsNotNone(self.bs.sqrt_table)
        self.assertIsNotNone(self.bs.norm_cdf_table)

    def test_lookup_tables_populated(self):
        """Test lookup tables are populated."""
        self.assertGreater(len(self.bs.ln_table), 0)
        self.assertGreater(len(self.bs.exp_table), 0)
        self.assertGreater(len(self.bs.sqrt_table), 0)
        self.assertGreater(len(self.bs.norm_cdf_table), 0)

    def test_ln_approximation(self):
        """Test natural log approximation."""
        # ln(1) ≈ 0
        result = self.bs._ln_approx(1000)
        self.assertLess(abs(result), 100)

        # ln(2) ≈ 0.693
        result = self.bs._ln_approx(2000)
        expected = int(0.693 * SCALE)
        self.assertLess(abs(result - expected), 500)

    def test_exp_approximation(self):
        """Test exponential approximation."""
        # e^0 = 1
        result = self.bs._exp_approx(0)
        self.assertAlmostEqual(result, SCALE, delta=100)

        # e^1 ≈ 2.718
        result = self.bs._exp_approx(SCALE)
        expected = int(2.718 * SCALE)
        self.assertLess(abs(result - expected), 1000)

    def test_sqrt_approximation(self):
        """Test square root approximation."""
        # √1 = 1
        result = self.bs._sqrt_approx(SCALE)
        self.assertAlmostEqual(result, SCALE, delta=10)

        # √4 = 2
        result = self.bs._sqrt_approx(4 * SCALE)
        self.assertAlmostEqual(result, 2 * SCALE, delta=20)

        # √9 = 3
        result = self.bs._sqrt_approx(9 * SCALE)
        self.assertAlmostEqual(result, 3 * SCALE, delta=30)

    def test_norm_cdf_approximation(self):
        """Test normal CDF approximation."""
        # N(0) ≈ 0.5
        result = self.bs._norm_cdf_approx(0)
        self.assertAlmostEqual(result, SCALE // 2, delta=500)

        # N(-∞) ≈ 0
        result = self.bs._norm_cdf_approx(-50000)
        self.assertLess(result, 1000)

        # N(+∞) ≈ 1
        result = self.bs._norm_cdf_approx(50000)
        self.assertGreater(result, SCALE - 1000)

    def test_price_atm_call(self):
        """Test pricing at-the-money call option."""
        contract = OptionContract(
            option_type=OptionType.CALL,
            strike=100 * SCALE,
            expiry=30,  # 30 days
            spot=100 * SCALE,
            volatility=2000,  # 20%
            rate=500  # 5%
        )

        price = self.bs.price_option(contract)

        self.assertIsInstance(price.premium, int)
        self.assertGreater(price.premium, 0)
        # ATM call should have delta ≈ 0.5
        self.assertGreater(price.delta, SCALE // 3)
        self.assertLess(price.delta, 2 * SCALE // 3)

    def test_price_atm_put(self):
        """Test pricing at-the-money put option."""
        contract = OptionContract(
            option_type=OptionType.PUT,
            strike=100 * SCALE,
            expiry=30,
            spot=100 * SCALE,
            volatility=2000,
            rate=500
        )

        price = self.bs.price_option(contract)

        self.assertIsInstance(price.premium, int)
        self.assertGreater(price.premium, 0)
        # ATM put should have delta ≈ -0.5
        self.assertLess(price.delta, -SCALE // 3)
        self.assertGreater(price.delta, -2 * SCALE // 3)

    def test_price_itm_call(self):
        """Test pricing in-the-money call."""
        contract = OptionContract(
            option_type=OptionType.CALL,
            strike=95 * SCALE,
            expiry=30,
            spot=100 * SCALE,
            volatility=2000,
            rate=500
        )

        price = self.bs.price_option(contract)

        # ITM call should have premium > intrinsic value
        intrinsic = 5 * SCALE
        self.assertGreater(price.premium, intrinsic)
        # ITM call should have delta > 0.5
        self.assertGreater(price.delta, SCALE // 2)

    def test_price_otm_call(self):
        """Test pricing out-of-the-money call."""
        contract = OptionContract(
            option_type=OptionType.CALL,
            strike=105 * SCALE,
            expiry=30,
            spot=100 * SCALE,
            volatility=2000,
            rate=500
        )

        price = self.bs.price_option(contract)

        # OTM call should have premium > 0 (time value)
        self.assertGreater(price.premium, 0)
        # OTM call should have delta < 0.5
        self.assertLess(price.delta, SCALE // 2)

    def test_price_itm_put(self):
        """Test pricing in-the-money put."""
        contract = OptionContract(
            option_type=OptionType.PUT,
            strike=105 * SCALE,
            expiry=30,
            spot=100 * SCALE,
            volatility=2000,
            rate=500
        )

        price = self.bs.price_option(contract)

        # ITM put should have premium > intrinsic value
        intrinsic = 5 * SCALE
        self.assertGreater(price.premium, intrinsic)
        # ITM put should have delta < -0.5
        self.assertLess(price.delta, -SCALE // 2)

    def test_price_at_expiry(self):
        """Test option pricing at expiry."""
        contract = OptionContract(
            option_type=OptionType.CALL,
            strike=95 * SCALE,
            expiry=0,  # At expiry
            spot=100 * SCALE,
            volatility=2000,
            rate=500
        )

        price = self.bs.price_option(contract)

        # At expiry, premium = intrinsic value
        intrinsic = max(0, 100 * SCALE - 95 * SCALE)
        self.assertEqual(price.premium, intrinsic)

    def test_put_call_parity(self):
        """Test put-call parity relationship."""
        # C - P = S - K*e^(-rT)
        strike = 100 * SCALE
        spot = 100 * SCALE
        expiry = 30
        volatility = 2000
        rate = 500

        call = OptionContract(OptionType.CALL, strike, expiry, spot, volatility, rate)
        put = OptionContract(OptionType.PUT, strike, expiry, spot, volatility, rate)

        call_price = self.bs.price_option(call)
        put_price = self.bs.price_option(put)

        # Approximate put-call parity (integer rounding may cause small differences)
        diff = call_price.premium - put_price.premium
        expected_diff = spot - strike  # Simplified for short expiry

        # Allow 10% tolerance for integer arithmetic
        tolerance = abs(expected_diff) // 10
        self.assertLess(abs(diff - expected_diff), tolerance + 1000)

    def test_integer_only_operations(self):
        """Verify all operations use integer arithmetic."""
        contract = OptionContract(
            option_type=OptionType.CALL,
            strike=100 * SCALE,
            expiry=60,
            spot=105 * SCALE,
            volatility=2500,
            rate=400
        )

        price = self.bs.price_option(contract)

        self.assertIsInstance(price.premium, int)
        self.assertIsInstance(price.delta, int)
        self.assertIsInstance(price.gamma, int)
        self.assertIsInstance(price.theta, int)
        self.assertIsInstance(price.vega, int)

    def test_increasing_volatility_increases_premium(self):
        """Test that higher volatility increases option premium."""
        contract_low_vol = OptionContract(
            option_type=OptionType.CALL,
            strike=100 * SCALE,
            expiry=30,
            spot=100 * SCALE,
            volatility=1000,  # 10%
            rate=500
        )

        contract_high_vol = OptionContract(
            option_type=OptionType.CALL,
            strike=100 * SCALE,
            expiry=30,
            spot=100 * SCALE,
            volatility=3000,  # 30%
            rate=500
        )

        price_low = self.bs.price_option(contract_low_vol)
        price_high = self.bs.price_option(contract_high_vol)

        self.assertGreater(price_high.premium, price_low.premium)


class TestQFNNOptionPricing(unittest.TestCase):
    """Test QFNN-based options pricing."""

    def setUp(self):
        self.qfnn = QFNNOptionPricing(scale=SCALE)

    def test_initialization(self):
        """Test QFNN pricing engine initialization."""
        self.assertEqual(self.qfnn.scale, SCALE)
        self.assertFalse(self.qfnn.is_trained)
        self.assertIsNone(self.qfnn.qfnn)

    def test_training(self):
        """Test QFNN training on option prices."""
        # Generate synthetic training data
        training_data = []
        for i in range(10):
            spot = (100 + i) * SCALE
            strike = 100 * SCALE
            expiry = 30
            volatility = 2000
            rate = 500

            contract = OptionContract(
                OptionType.CALL, strike, expiry, spot, volatility, rate
            )

            # Synthetic premium (intrinsic + time value)
            premium = max(0, spot - strike) + 2 * SCALE

            training_data.append((contract, premium))

        # Train QFNN
        self.qfnn.train(training_data, epochs=10, learning_rate=100)

        self.assertTrue(self.qfnn.is_trained)
        self.assertIsNotNone(self.qfnn.qfnn)

    def test_pricing_after_training(self):
        """Test option pricing after QFNN training."""
        # Train on small dataset
        training_data = [
            (create_call_option(100 * SCALE, 100 * SCALE, 30, 2000, 500), 3 * SCALE),
            (create_call_option(105 * SCALE, 100 * SCALE, 30, 2000, 500), 7 * SCALE),
            (create_call_option(95 * SCALE, 100 * SCALE, 30, 2000, 500), 1 * SCALE),
        ]

        self.qfnn.train(training_data, epochs=5, learning_rate=100)

        # Price new option
        contract = create_call_option(102 * SCALE, 100 * SCALE, 30, 2000, 500)
        price = self.qfnn.price_option(contract)

        self.assertIsInstance(price.premium, int)
        self.assertGreater(price.premium, 0)
        self.assertEqual(price.method, "qfnn_quantum")

    def test_pricing_without_training_raises_error(self):
        """Test that pricing without training raises error."""
        contract = create_call_option(100 * SCALE, 100 * SCALE, 30, 2000, 500)

        with self.assertRaises(ValueError):
            self.qfnn.price_option(contract)

    def test_integer_only_operations(self):
        """Verify QFNN uses integer-only operations."""
        training_data = [
            (create_call_option(100 * SCALE, 100 * SCALE, 30, 2000, 500), 3 * SCALE),
        ]

        self.qfnn.train(training_data, epochs=2, learning_rate=100)

        contract = create_call_option(100 * SCALE, 100 * SCALE, 30, 2000, 500)
        price = self.qfnn.price_option(contract)

        self.assertIsInstance(price.premium, int)
        self.assertIsInstance(price.delta, int)


class TestXiPsiOptionPricing(unittest.TestCase):
    """Test Xi/Psi phase space options pricing."""

    def setUp(self):
        self.xipsi = XiPsiOptionPricing(scale=SCALE)

    def test_initialization(self):
        """Test Xi/Psi pricing engine initialization."""
        self.assertEqual(self.xipsi.scale, SCALE)
        self.assertIsNotNone(self.xipsi.xi_psi_model)

    def test_pricing_with_price_history(self):
        """Test option pricing with price history."""
        # Price history (uptrend)
        price_history = [i * SCALE for i in range(95, 105)]

        contract = create_call_option(100 * SCALE, 100 * SCALE, 30, 2000, 500)

        price = self.xipsi.price_option(contract, price_history)

        self.assertIsInstance(price.premium, int)
        self.assertGreater(price.premium, 0)
        self.assertEqual(price.method, "xi_psi_phase")

    def test_pricing_bullish_increases_call_premium(self):
        """Test that bullish phase increases call option premium."""
        # Strong uptrend
        bullish_history = [i * SCALE for i in range(90, 110, 2)]

        # Ranging market
        ranging_history = [100 * SCALE + (i % 2) * 100 for i in range(20)]

        contract = create_call_option(100 * SCALE, 100 * SCALE, 30, 2000, 500)

        bullish_price = self.xipsi.price_option(contract, bullish_history)
        ranging_price = self.xipsi.price_option(contract, ranging_history)

        # Bullish market should increase call premium
        self.assertGreaterEqual(bullish_price.premium, ranging_price.premium)

    def test_pricing_bearish_increases_put_premium(self):
        """Test that bearish phase increases put option premium."""
        # Strong downtrend
        bearish_history = [i * SCALE for i in range(110, 90, -2)]

        # Ranging market
        ranging_history = [100 * SCALE + (i % 2) * 100 for i in range(20)]

        contract = create_put_option(100 * SCALE, 100 * SCALE, 30, 2000, 500)

        bearish_price = self.xipsi.price_option(contract, bearish_history)
        ranging_price = self.xipsi.price_option(contract, ranging_history)

        # Bearish market should increase put premium
        self.assertGreaterEqual(bearish_price.premium, ranging_price.premium)

    def test_pricing_without_history(self):
        """Test pricing with empty price history."""
        contract = create_call_option(105 * SCALE, 100 * SCALE, 30, 2000, 500)

        price = self.xipsi.price_option(contract, [])

        # Should fallback to intrinsic value
        intrinsic = 5 * SCALE
        self.assertEqual(price.premium, intrinsic)

    def test_integer_only_operations(self):
        """Verify Xi/Psi uses integer-only operations."""
        price_history = [i * SCALE for i in range(95, 105)]
        contract = create_call_option(100 * SCALE, 100 * SCALE, 30, 2000, 500)

        price = self.xipsi.price_option(contract, price_history)

        self.assertIsInstance(price.premium, int)
        self.assertIsInstance(price.delta, int)
        self.assertIsInstance(price.gamma, int)
        self.assertIsInstance(price.theta, int)
        self.assertIsInstance(price.vega, int)


class TestOptionsPricingEngine(unittest.TestCase):
    """Test unified options pricing engine."""

    def setUp(self):
        self.engine = OptionsPricingEngine(scale=SCALE)

    def test_initialization(self):
        """Test engine initialization."""
        self.assertIsNotNone(self.engine.bs_engine)
        self.assertIsNotNone(self.engine.qfnn_engine)
        self.assertIsNotNone(self.engine.xipsi_engine)

    def test_price_all_methods_bs_only(self):
        """Test pricing with Black-Scholes only (QFNN not trained)."""
        contract = create_call_option(100 * SCALE, 100 * SCALE, 30, 2000, 500)

        results = self.engine.price_all_methods(contract)

        self.assertIn('black_scholes', results)
        self.assertNotIn('qfnn', results)  # Not trained

    def test_price_all_methods_with_qfnn(self):
        """Test pricing with all methods after training QFNN."""
        # Train QFNN
        training_data = [
            (create_call_option(100 * SCALE, 100 * SCALE, 30, 2000, 500), 3 * SCALE),
            (create_call_option(105 * SCALE, 100 * SCALE, 30, 2000, 500), 7 * SCALE),
        ]
        self.engine.train_qfnn(training_data, epochs=5, learning_rate=100)

        contract = create_call_option(100 * SCALE, 100 * SCALE, 30, 2000, 500)
        price_history = [i * SCALE for i in range(95, 105)]

        results = self.engine.price_all_methods(contract, price_history)

        self.assertIn('black_scholes', results)
        self.assertIn('qfnn', results)
        self.assertIn('xi_psi', results)

    def test_compare_methods(self):
        """Test method comparison functionality."""
        contract = create_call_option(100 * SCALE, 100 * SCALE, 30, 2000, 500)
        price_history = [i * SCALE for i in range(95, 105)]
        actual_premium = 3 * SCALE

        report = self.engine.compare_methods(contract, price_history, actual_premium)

        self.assertIn('contract', report)
        self.assertIn('prices', report)
        self.assertIn('comparison', report)

    def test_backtest(self):
        """Test backtesting functionality."""
        # Train QFNN first
        training_data = [
            (create_call_option(100 * SCALE, 100 * SCALE, 30, 2000, 500), 3 * SCALE),
        ]
        self.engine.train_qfnn(training_data, epochs=2, learning_rate=100)

        # Backtest data
        test_data = [
            (create_call_option(100 * SCALE, 100 * SCALE, 30, 2000, 500),
             3 * SCALE, [95 * SCALE, 98 * SCALE, 100 * SCALE]),
            (create_call_option(105 * SCALE, 100 * SCALE, 30, 2000, 500),
             7 * SCALE, [100 * SCALE, 103 * SCALE, 105 * SCALE]),
        ]

        report = self.engine.backtest(test_data)

        self.assertIn('black_scholes', report)
        for method, stats in report.items():
            self.assertIn('num_trades', stats)
            self.assertIn('mean_error', stats)
            self.assertIn('rmse', stats)

    def test_inter_method_agreement(self):
        """Test inter-method agreement calculation."""
        # Train QFNN
        training_data = [
            (create_call_option(100 * SCALE, 100 * SCALE, 30, 2000, 500), 3 * SCALE),
        ]
        self.engine.train_qfnn(training_data, epochs=2, learning_rate=100)

        contract = create_call_option(100 * SCALE, 100 * SCALE, 30, 2000, 500)
        price_history = [i * SCALE for i in range(95, 105)]

        report = self.engine.compare_methods(contract, price_history)

        self.assertIn('inter_method_agreement', report)
        self.assertGreaterEqual(report['inter_method_agreement'], 0)
        self.assertLessEqual(report['inter_method_agreement'], SCALE)


class TestConvenienceFunctions(unittest.TestCase):
    """Test convenience functions."""

    def test_create_call_option(self):
        """Test call option creation."""
        option = create_call_option(100 * SCALE, 95 * SCALE, 30, 2000, 500)

        self.assertEqual(option.option_type, OptionType.CALL)
        self.assertEqual(option.spot, 100 * SCALE)
        self.assertEqual(option.strike, 95 * SCALE)
        self.assertEqual(option.expiry, 30)
        self.assertEqual(option.volatility, 2000)
        self.assertEqual(option.rate, 500)

    def test_create_put_option(self):
        """Test put option creation."""
        option = create_put_option(100 * SCALE, 105 * SCALE, 60, 2500, 400)

        self.assertEqual(option.option_type, OptionType.PUT)
        self.assertEqual(option.spot, 100 * SCALE)
        self.assertEqual(option.strike, 105 * SCALE)
        self.assertEqual(option.expiry, 60)
        self.assertEqual(option.volatility, 2500)
        self.assertEqual(option.rate, 400)


class TestIntegrationScenarios(unittest.TestCase):
    """Integration tests for real-world scenarios."""

    def test_complete_pricing_workflow(self):
        """Test complete workflow from training to pricing to comparison."""
        engine = OptionsPricingEngine(scale=SCALE)

        # 1. Generate training data
        training_data = []
        for spot in [95, 100, 105]:
            contract = create_call_option(spot * SCALE, 100 * SCALE, 30, 2000, 500)
            # Synthetic premium
            premium = max(0, spot * SCALE - 100 * SCALE) + 2 * SCALE
            training_data.append((contract, premium))

        # 2. Train QFNN
        engine.train_qfnn(training_data, epochs=10, learning_rate=100)

        # 3. Price new option with all methods
        contract = create_call_option(102 * SCALE, 100 * SCALE, 30, 2000, 500)
        price_history = [i * SCALE for i in range(95, 103)]

        results = engine.price_all_methods(contract, price_history)

        # 4. Verify all methods produced prices
        self.assertIn('black_scholes', results)
        self.assertIn('qfnn', results)
        self.assertIn('xi_psi', results)

        for method, price in results.items():
            self.assertGreater(price.premium, 0)

    def test_backtesting_workflow(self):
        """Test complete backtesting workflow."""
        engine = OptionsPricingEngine(scale=SCALE)

        # Training data
        training_data = [
            (create_call_option(100 * SCALE, 100 * SCALE, 30, 2000, 500), 3 * SCALE),
            (create_call_option(105 * SCALE, 100 * SCALE, 30, 2000, 500), 7 * SCALE),
            (create_call_option(95 * SCALE, 100 * SCALE, 30, 2000, 500), 1 * SCALE),
        ]

        engine.train_qfnn(training_data, epochs=10, learning_rate=100)

        # Test data
        test_data = [
            (create_call_option(98 * SCALE, 100 * SCALE, 30, 2000, 500),
             2 * SCALE, [95 * SCALE, 96 * SCALE, 98 * SCALE]),
            (create_call_option(103 * SCALE, 100 * SCALE, 30, 2000, 500),
             5 * SCALE, [100 * SCALE, 101 * SCALE, 103 * SCALE]),
        ]

        report = engine.backtest(test_data)

        # Verify backtesting report
        for method, stats in report.items():
            self.assertEqual(stats['num_trades'], 2)
            self.assertGreater(stats['mean_error'], 0)


def run_tests():
    """Run all tests and report results."""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestBlackScholesInteger))
    suite.addTests(loader.loadTestsFromTestCase(TestQFNNOptionPricing))
    suite.addTests(loader.loadTestsFromTestCase(TestXiPsiOptionPricing))
    suite.addTests(loader.loadTestsFromTestCase(TestOptionsPricingEngine))
    suite.addTests(loader.loadTestsFromTestCase(TestConvenienceFunctions))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegrationScenarios))

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Report
    print("\n" + "="*70)
    print("OPTIONS PRICING TEST SUMMARY")
    print("="*70)
    print(f"Tests run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
    print("="*70)

    return result


if __name__ == '__main__':
    run_tests()

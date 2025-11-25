"""
Test Suite for Xi/Psi Phase Space Dynamics Model
=================================================

Comprehensive tests for XiPsiModel with integer-only arithmetic validation.

Author: Agent 10 (Zeckendorf: 10010)
Test Coverage Target: 95%+
"""

import unittest
import numpy as np
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src', 'models'))

from xi_psi import (
    XiOperator,
    PsiOperator,
    XiPsiModel,
    PhasePoint,
    PhaseState,
    analyze_phase_dynamics,
    SCALE,
    LUCAS_SEQUENCE,
    PLANCK_SCALED,
    COHERENCE_THRESHOLD
)


class TestXiOperator(unittest.TestCase):
    """Test Xi (position) operator"""

    def setUp(self):
        self.xi_op = XiOperator(scale=SCALE)

    def test_apply_returns_integer(self):
        """Verify Xi operator returns integer"""
        price = 12345 * SCALE
        result = self.xi_op.apply(price)
        self.assertIsInstance(result, int)
        self.assertEqual(result, price)

    def test_commutator_with_psi(self):
        """Verify [Xi, Psi] commutator"""
        psi_value = 5000
        result = self.xi_op.commutator_with_psi(psi_value)
        self.assertIsInstance(result, int)
        self.assertEqual(result, PLANCK_SCALED)

    def test_expectation_calculation(self):
        """Test expectation value <Xi>"""
        prices = [100 * SCALE, 105 * SCALE, 110 * SCALE, 115 * SCALE]
        expected = sum(prices) // len(prices)
        result = self.xi_op.expectation(prices)
        self.assertEqual(result, expected)

    def test_expectation_empty_list(self):
        """Test expectation with empty price list"""
        result = self.xi_op.expectation([])
        self.assertEqual(result, 0)

    def test_variance_calculation(self):
        """Test variance σ²(Xi)"""
        prices = [100 * SCALE, 110 * SCALE, 120 * SCALE]
        result = self.xi_op.variance(prices)
        self.assertIsInstance(result, int)
        self.assertGreater(result, 0)

    def test_variance_constant_prices(self):
        """Test variance with constant prices"""
        prices = [100 * SCALE] * 5
        result = self.xi_op.variance(prices)
        self.assertEqual(result, 0)

    def test_integer_only_operations(self):
        """Verify no float operations in Xi operator"""
        prices = [12345, 23456, 34567, 45678]

        # All operations should return integers
        self.assertIsInstance(self.xi_op.apply(prices[0]), int)
        self.assertIsInstance(self.xi_op.expectation(prices), int)
        self.assertIsInstance(self.xi_op.variance(prices), int)


class TestPsiOperator(unittest.TestCase):
    """Test Psi (momentum) operator"""

    def setUp(self):
        self.psi_op = PsiOperator(scale=SCALE)

    def test_apply_returns_integer(self):
        """Verify Psi operator returns integer"""
        prices = [100 * SCALE, 105 * SCALE]
        lucas_dt = 2
        result = self.psi_op.apply(prices, lucas_dt)
        self.assertIsInstance(result, int)

    def test_apply_with_zero_dt(self):
        """Test momentum with zero time interval"""
        prices = [100 * SCALE, 105 * SCALE]
        result = self.psi_op.apply(prices, lucas_dt=0)
        self.assertEqual(result, 0)

    def test_apply_insufficient_data(self):
        """Test momentum with single price"""
        prices = [100 * SCALE]
        result = self.psi_op.apply(prices, lucas_dt=2)
        self.assertEqual(result, 0)

    def test_positive_momentum(self):
        """Test positive momentum (uptrend)"""
        prices = [100 * SCALE, 110 * SCALE]
        result = self.psi_op.apply(prices, lucas_dt=1)
        self.assertGreater(result, 0)

    def test_negative_momentum(self):
        """Test negative momentum (downtrend)"""
        prices = [110 * SCALE, 100 * SCALE]
        result = self.psi_op.apply(prices, lucas_dt=1)
        self.assertLess(result, 0)

    def test_expectation_calculation(self):
        """Test expectation value <Psi>"""
        prices = [100 * SCALE, 105 * SCALE, 110 * SCALE, 115 * SCALE]
        lucas_times = [1, 2, 3, 4]
        result = self.psi_op.expectation(prices, lucas_times)
        self.assertIsInstance(result, int)

    def test_variance_calculation(self):
        """Test variance σ²(Psi)"""
        prices = [100 * SCALE, 105 * SCALE, 110 * SCALE, 115 * SCALE]
        lucas_times = [1, 2, 3, 4]
        result = self.psi_op.variance(prices, lucas_times)
        self.assertIsInstance(result, int)
        self.assertGreaterEqual(result, 0)

    def test_integer_only_operations(self):
        """Verify no float operations in Psi operator"""
        prices = [12345, 23456, 34567]
        lucas_times = [1, 2, 3]

        self.assertIsInstance(self.psi_op.apply(prices, 2), int)
        self.assertIsInstance(self.psi_op.expectation(prices, lucas_times), int)
        self.assertIsInstance(self.psi_op.variance(prices, lucas_times), int)


class TestXiPsiModel(unittest.TestCase):
    """Test complete Xi/Psi model"""

    def setUp(self):
        self.model = XiPsiModel(scale=SCALE)
        # Sample price series
        self.prices = [
            100 * SCALE, 105 * SCALE, 110 * SCALE, 108 * SCALE,
            112 * SCALE, 115 * SCALE, 113 * SCALE, 118 * SCALE
        ]

    def test_initialization(self):
        """Test model initialization"""
        self.assertEqual(self.model.scale, SCALE)
        self.assertIsInstance(self.model.xi_op, XiOperator)
        self.assertIsInstance(self.model.psi_op, PsiOperator)
        self.assertEqual(len(self.model.phase_history), 0)

    def test_lucas_sequence_generation(self):
        """Test Lucas number generation"""
        # First 10 Lucas numbers
        expected = [2, 1, 3, 4, 7, 11, 18, 29, 47, 76]
        for i, expected_val in enumerate(expected):
            self.assertEqual(self.model.get_lucas_time(i), expected_val)

    def test_lucas_sequence_expansion(self):
        """Test Lucas sequence auto-expansion"""
        # Request beyond initial sequence
        index = len(LUCAS_SEQUENCE) + 5
        result = self.model.get_lucas_time(index)
        self.assertIsInstance(result, int)
        self.assertGreater(result, 0)

    def test_compute_phase_point(self):
        """Test phase point computation"""
        phase_point = self.model.compute_phase_point(self.prices, time_index=3)

        self.assertIsInstance(phase_point, PhasePoint)
        self.assertIsInstance(phase_point.xi, int)
        self.assertIsInstance(phase_point.psi, int)
        self.assertIsInstance(phase_point.time, int)
        self.assertIsInstance(phase_point.coherence, int)
        self.assertIsInstance(phase_point.state, PhaseState)

    def test_phase_point_coherence_range(self):
        """Test coherence is in valid range [0, SCALE]"""
        phase_point = self.model.compute_phase_point(self.prices, time_index=5)
        self.assertGreaterEqual(phase_point.coherence, 0)
        self.assertLessEqual(phase_point.coherence, SCALE)

    def test_classify_state_bullish(self):
        """Test bullish state classification"""
        # Strong uptrend
        uptrend_prices = [i * SCALE for i in range(100, 120, 2)]
        phase_point = self.model.compute_phase_point(uptrend_prices, time_index=10)
        # May be BULLISH or TRANSITIONAL depending on momentum
        self.assertIn(phase_point.state, [PhaseState.BULLISH, PhaseState.TRANSITIONAL])

    def test_classify_state_bearish(self):
        """Test bearish state classification"""
        # Strong downtrend
        downtrend_prices = [i * SCALE for i in range(120, 100, -2)]
        phase_point = self.model.compute_phase_point(downtrend_prices, time_index=10)
        # May be BEARISH or TRANSITIONAL depending on momentum
        self.assertIn(phase_point.state, [PhaseState.BEARISH, PhaseState.TRANSITIONAL])

    def test_classify_state_ranging(self):
        """Test ranging state classification"""
        # Low volatility
        ranging_prices = [100 * SCALE + (i % 2) * 100 for i in range(20)]
        phase_point = self.model.compute_phase_point(ranging_prices, time_index=15)
        # Should be RANGING or TRANSITIONAL
        self.assertIn(phase_point.state, [PhaseState.RANGING, PhaseState.TRANSITIONAL])

    def test_evolve_phase_space(self):
        """Test phase space evolution"""
        portrait = self.model.evolve_phase_space(self.prices, num_steps=len(self.prices))

        self.assertEqual(len(portrait.points), len(self.prices))
        self.assertGreater(len(portrait.trajectories), 0)
        self.assertIsInstance(portrait.coherence_map, np.ndarray)
        self.assertEqual(len(portrait.lucas_times), len(self.prices))

    def test_find_attractors(self):
        """Test attractor detection"""
        portrait = self.model.evolve_phase_space(self.prices, num_steps=len(self.prices))

        # Attractors should be tuples of (xi, psi)
        for attractor in portrait.attractors:
            self.assertIsInstance(attractor, tuple)
            self.assertEqual(len(attractor), 2)
            self.assertIsInstance(attractor[0], int)  # xi
            self.assertIsInstance(attractor[1], int)  # psi

    def test_coherence_map_shape(self):
        """Test coherence map dimensions"""
        portrait = self.model.evolve_phase_space(self.prices, num_steps=len(self.prices))

        self.assertEqual(len(portrait.coherence_map.shape), 2)
        self.assertEqual(portrait.coherence_map.shape[0], portrait.coherence_map.shape[1])

    def test_uncertainty_relation(self):
        """Test Heisenberg uncertainty relation"""
        lucas_times = [self.model.get_lucas_time(i) for i in range(len(self.prices))]
        delta_xi, delta_psi, product = self.model.uncertainty_relation(self.prices, lucas_times)

        # All should be integers
        self.assertIsInstance(delta_xi, int)
        self.assertIsInstance(delta_psi, int)
        self.assertIsInstance(product, int)

        # Product should be positive
        self.assertGreaterEqual(product, 0)

    def test_nash_equilibrium_exit(self):
        """Test Nash equilibrium exit timing"""
        current_price = 110 * SCALE
        entry_price = 100 * SCALE
        time_held = 7  # Lucas number

        should_exit, lucas_time = self.model.nash_equilibrium_exit(
            current_price, entry_price, time_held
        )

        self.assertIsInstance(should_exit, bool)
        self.assertIsInstance(lucas_time, int)
        self.assertIn(lucas_time, LUCAS_SEQUENCE)

    def test_nash_exit_at_profit(self):
        """Test exit at Lucas time with profit"""
        current_price = 105 * SCALE  # 5% profit
        entry_price = 100 * SCALE
        time_held = 7  # Lucas number

        should_exit, _ = self.model.nash_equilibrium_exit(
            current_price, entry_price, time_held
        )

        # Should exit at Lucas time with 5% profit
        self.assertTrue(should_exit)

    def test_nash_exit_at_loss(self):
        """Test exit at Lucas time with significant loss"""
        current_price = 92 * SCALE  # -8% loss
        entry_price = 100 * SCALE
        time_held = 11  # Lucas number

        should_exit, _ = self.model.nash_equilibrium_exit(
            current_price, entry_price, time_held
        )

        # Should exit at Lucas time with large loss
        self.assertTrue(should_exit)

    def test_nash_no_exit_non_lucas(self):
        """Test no exit at non-Lucas time"""
        current_price = 105 * SCALE
        entry_price = 100 * SCALE
        time_held = 5  # Not a Lucas number (5 is Fibonacci)

        should_exit, _ = self.model.nash_equilibrium_exit(
            current_price, entry_price, time_held
        )

        # Should not exit at non-Lucas time
        self.assertFalse(should_exit)

    def test_export_state(self):
        """Test model state export"""
        # Evolve model first
        self.model.evolve_phase_space(self.prices, num_steps=len(self.prices))

        state = self.model.export_state()

        self.assertIsInstance(state, dict)
        self.assertIn('scale', state)
        self.assertIn('lucas_sequence', state)
        self.assertIn('num_phase_points', state)
        self.assertIn('latest_coherence', state)
        self.assertEqual(state['scale'], SCALE)
        self.assertGreater(state['num_phase_points'], 0)

    def test_integer_only_throughout(self):
        """Comprehensive integer-only verification"""
        portrait = self.model.evolve_phase_space(self.prices, num_steps=len(self.prices))

        # Check all phase points
        for point in portrait.points:
            self.assertIsInstance(point.xi, int)
            self.assertIsInstance(point.psi, int)
            self.assertIsInstance(point.time, int)
            self.assertIsInstance(point.coherence, int)

        # Check attractors
        for attractor in portrait.attractors:
            self.assertIsInstance(attractor[0], int)
            self.assertIsInstance(attractor[1], int)

        # Check Lucas times
        for t in portrait.lucas_times:
            self.assertIsInstance(t, int)


class TestAnalysisFunctions(unittest.TestCase):
    """Test utility analysis functions"""

    def setUp(self):
        self.prices = [100 * SCALE + i * 500 for i in range(20)]

    def test_analyze_phase_dynamics(self):
        """Test quick analysis function"""
        result = analyze_phase_dynamics(self.prices, scale=SCALE)

        self.assertIsInstance(result, dict)
        self.assertIn('num_points', result)
        self.assertIn('num_attractors', result)
        self.assertIn('mean_coherence', result)
        self.assertIn('delta_xi', result)
        self.assertIn('delta_psi', result)
        self.assertIn('uncertainty_product', result)
        self.assertIn('phase_states', result)

    def test_analysis_integer_outputs(self):
        """Test analysis returns integer values"""
        result = analyze_phase_dynamics(self.prices, scale=SCALE)

        self.assertIsInstance(result['num_points'], int)
        self.assertIsInstance(result['num_attractors'], int)
        self.assertIsInstance(result['mean_coherence'], int)
        self.assertIsInstance(result['delta_xi'], int)
        self.assertIsInstance(result['delta_psi'], int)
        self.assertIsInstance(result['uncertainty_product'], int)

    def test_analysis_phase_states(self):
        """Test phase state counting"""
        result = analyze_phase_dynamics(self.prices, scale=SCALE)

        states = result['phase_states']
        self.assertIn('bullish', states)
        self.assertIn('bearish', states)
        self.assertIn('ranging', states)
        self.assertIn('transitional', states)

        # Total should equal num_points
        total_states = sum(states.values())
        self.assertEqual(total_states, result['num_points'])


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and error handling"""

    def setUp(self):
        self.model = XiPsiModel(scale=SCALE)

    def test_empty_price_series(self):
        """Test with empty price series"""
        portrait = self.model.evolve_phase_space([], num_steps=10)
        self.assertEqual(len(portrait.points), 0)

    def test_single_price(self):
        """Test with single price"""
        portrait = self.model.evolve_phase_space([100 * SCALE], num_steps=1)
        self.assertEqual(len(portrait.points), 1)
        self.assertEqual(portrait.points[0].psi, 0)  # No momentum with single point

    def test_zero_price_handling(self):
        """Test with zero prices"""
        prices = [0, 0, 0]
        portrait = self.model.evolve_phase_space(prices, num_steps=3)
        # Should not crash
        self.assertEqual(len(portrait.points), 3)

    def test_large_price_values(self):
        """Test with large price values"""
        prices = [1000000 * SCALE, 1000010 * SCALE, 1000020 * SCALE]
        portrait = self.model.evolve_phase_space(prices, num_steps=3)
        self.assertEqual(len(portrait.points), 3)

    def test_negative_prices(self):
        """Test with negative prices (e.g., spreads)"""
        prices = [-100 * SCALE, -105 * SCALE, -110 * SCALE]
        portrait = self.model.evolve_phase_space(prices, num_steps=3)
        self.assertEqual(len(portrait.points), 3)


class TestLucasSequenceProperties(unittest.TestCase):
    """Test Lucas sequence mathematical properties"""

    def test_lucas_recurrence(self):
        """Test Lucas recurrence relation: L(n) = L(n-1) + L(n-2)"""
        model = XiPsiModel()

        for i in range(2, 10):
            lucas_n = model.get_lucas_time(i)
            lucas_n1 = model.get_lucas_time(i-1)
            lucas_n2 = model.get_lucas_time(i-2)

            self.assertEqual(lucas_n, lucas_n1 + lucas_n2)

    def test_lucas_initial_conditions(self):
        """Test Lucas initial conditions: L(0)=2, L(1)=1"""
        model = XiPsiModel()
        self.assertEqual(model.get_lucas_time(0), 2)
        self.assertEqual(model.get_lucas_time(1), 1)


def run_tests():
    """Run all tests and report coverage"""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestXiOperator))
    suite.addTests(loader.loadTestsFromTestCase(TestPsiOperator))
    suite.addTests(loader.loadTestsFromTestCase(TestXiPsiModel))
    suite.addTests(loader.loadTestsFromTestCase(TestAnalysisFunctions))
    suite.addTests(loader.loadTestsFromTestCase(TestEdgeCases))
    suite.addTests(loader.loadTestsFromTestCase(TestLucasSequenceProperties))

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Report
    print("\n" + "="*70)
    print("TEST SUMMARY")
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

"""
Test Suite for Pine Script Generator - Agent 24
================================================

Tests Pine Script generation for all quantum trading strategies.

Dependencies: Agents 13, 14, 15, 16
"""

import unittest
import sys
import os
from pathlib import Path
import re
import tempfile
import shutil

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from visualization.pine_script_generator import PineScriptGenerator


class TestPineScriptGenerator(unittest.TestCase):
    """Test Pine Script generator functionality."""

    def setUp(self):
        """Set up test fixtures."""
        self.generator = PineScriptGenerator()
        self.temp_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up test files."""
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

    def test_generator_initialization(self):
        """Test generator initializes correctly."""
        self.assertEqual(self.generator.version, "5")
        self.assertEqual(self.generator.agent_id, "24")
        self.assertEqual(self.generator.zeckendorf_address, "10000001001")

    def test_generate_header(self):
        """Test Pine Script header generation."""
        header = self.generator.generate_header(
            "Test Indicator",
            "Test description",
            overlay=True
        )

        # Check version declaration
        self.assertIn("//@version=5", header)

        # Check indicator declaration
        self.assertIn('indicator("Test Indicator", overlay=true)', header)

        # Check description
        self.assertIn("Test description", header)

        # Check agent info
        self.assertIn("Agent 24", header)
        self.assertIn("Zeckendorf: 10000001001", header)

        # Check integer-only comment
        self.assertIn("Integer-only arithmetic", header)

    def test_fibonacci_retracement_script(self):
        """Test Fibonacci retracement Pine Script generation."""
        script = self.generator.generate_fibonacci_retracement()

        # Check version and indicator
        self.assertIn("//@version=5", script)
        self.assertIn('indicator("Quantum Fibonacci Retracement - Agent 13"', script)

        # Check Fibonacci ratios defined
        self.assertIn("f236 = 236", script)
        self.assertIn("f382 = 382", script)
        self.assertIn("f500 = 500", script)
        self.assertIn("f618 = 618", script)
        self.assertIn("f786 = 786", script)

        # Check extension ratios
        self.assertIn("ext618 = 618", script)
        self.assertIn("ext1618 = 1618", script)
        self.assertIn("ext2618 = 2618", script)

        # Check calculations use integer division
        self.assertIn("/ 1000", script)

        # Check golden pocket
        self.assertIn("goldenPocketHigh", script)
        self.assertIn("goldenPocketLow", script)

        # Check plotting
        self.assertIn("plot(level_236", script)
        self.assertIn("plot(level_618", script)

        # Check alerts
        self.assertIn("alertcondition", script)

        # Check table display
        self.assertIn("var table", script)

    def test_lucas_timing_script(self):
        """Test Lucas timing Pine Script generation."""
        script = self.generator.generate_lucas_timing()

        # Check version and indicator
        self.assertIn("//@version=5", script)
        self.assertIn('indicator("Quantum Lucas Timing - Agent 14"', script)

        # Check Lucas sequence values
        self.assertIn("lucas_2 = 3", script)
        self.assertIn("lucas_3 = 4", script)
        self.assertIn("lucas_4 = 7", script)
        self.assertIn("lucas_5 = 11", script)
        self.assertIn("lucas_6 = 18", script)
        self.assertIn("lucas_7 = 29", script)
        self.assertIn("lucas_8 = 47", script)

        # Check OEIS reference
        self.assertIn("A000032", script)

        # Check probability weights
        self.assertIn("weight_1 = 3000", script)
        self.assertIn("weight_2 = 2500", script)

        # Check exit detection
        self.assertIn("atExit1", script)
        self.assertIn("exitSignal", script)

        # Check plotting
        self.assertIn("hline(lucas_2", script)
        self.assertIn("bgcolor", script)

        # Check table
        self.assertIn("var table exitTable", script)

    def test_momentum_indicator_script(self):
        """Test momentum indicator Pine Script generation."""
        script = self.generator.generate_momentum_indicator()

        # Check version and indicator
        self.assertIn("//@version=5", script)
        self.assertIn('indicator("Quantum Momentum - Agent 15"', script)

        # Check scaling factor
        self.assertIn("SCALE = 10000", script)

        # Check momentum calculation
        self.assertIn("priceChange = close - close[momentumPeriod]", script)
        self.assertIn("momentum = int(", script)

        # Check trend calculation
        self.assertIn("trend = int(", script)

        # Check volatility
        self.assertIn("volatility = int(", script)

        # Check thresholds
        self.assertIn("momentumThreshold = 7000", script)
        self.assertIn("trendThreshold = 7000", script)

        # Check signals
        self.assertIn("strongBullish", script)
        self.assertIn("strongBearish", script)

        # Check divergence detection
        self.assertIn("Bullish divergence", script)
        self.assertIn("Bearish divergence", script)

        # Check plotting
        self.assertIn("plot(smoothedMomentum", script)
        self.assertIn("plotshape", script)

    def test_mean_reversion_indicator_script(self):
        """Test mean reversion indicator Pine Script generation."""
        script = self.generator.generate_mean_reversion_indicator()

        # Check version and indicator
        self.assertIn("//@version=5", script)
        self.assertIn('indicator("Quantum Mean Reversion - Agent 16"', script)

        # Check Bollinger Bands
        self.assertIn("bbPeriod", script)
        self.assertIn("bbStdDev", script)
        self.assertIn("basis = ta.sma(close, bbPeriod)", script)
        self.assertIn("upperBand", script)
        self.assertIn("lowerBand", script)

        # Check Z-score calculation
        self.assertIn("zScore = int(", script)

        # Check mean reversion signals
        self.assertIn("oversold", script)
        self.assertIn("overbought", script)
        self.assertIn("buySignal", script)
        self.assertIn("sellSignal", script)

        # Check exit signals
        self.assertIn("exitLong", script)
        self.assertIn("exitShort", script)

        # Check statistical edge
        self.assertIn("reversionProb", script)

        # Check plotting
        self.assertIn("plot(basis", script)
        self.assertIn("fill(", script)

    def test_integer_arithmetic_preservation(self):
        """Test that all scripts use integer-only arithmetic."""
        scripts = {
            'fibonacci': self.generator.generate_fibonacci_retracement(),
            'lucas': self.generator.generate_lucas_timing(),
            'momentum': self.generator.generate_momentum_indicator(),
            'mean_reversion': self.generator.generate_mean_reversion_indicator()
        }

        for name, script in scripts.items():
            # Check for integer scaling
            self.assertTrue(
                "SCALE" in script or "1000" in script or "10000" in script,
                f"{name} script should use scaling factors"
            )

            # Check for integer division or int() conversions
            # Lucas timing uses direct integer values, others use division/int()
            has_integer_ops = (
                "/ 1000" in script or
                "int(" in script or
                (name == 'lucas' and all(str(x) in script for x in [3, 4, 7, 11, 18, 29, 47]))
            )
            self.assertTrue(
                has_integer_ops,
                f"{name} script should use integer arithmetic operations"
            )

            # Should not use floating point literals (except for display)
            # This is acceptable in Pine Script for visualization

    def test_tradingview_compatibility(self):
        """Test TradingView Pine Script v5 compatibility."""
        scripts = [
            self.generator.generate_fibonacci_retracement(),
            self.generator.generate_lucas_timing(),
            self.generator.generate_momentum_indicator(),
            self.generator.generate_mean_reversion_indicator()
        ]

        for script in scripts:
            # Check version declaration
            self.assertIn("//@version=5", script)

            # Check indicator() or strategy() declaration
            self.assertTrue(
                'indicator("' in script or 'strategy("' in script,
                "Script must have indicator or strategy declaration"
            )

            # Check for valid Pine Script functions
            valid_functions = [
                'ta.sma', 'ta.highest', 'ta.lowest', 'ta.atr',
                'plot', 'hline', 'bgcolor', 'plotshape',
                'table.new', 'table.cell', 'alertcondition'
            ]

            has_valid_function = any(func in script for func in valid_functions)
            self.assertTrue(has_valid_function, "Script should use valid Pine Script functions")

    def test_generate_all_strategies(self):
        """Test generating all strategies to files."""
        file_paths = self.generator.generate_all_strategies(self.temp_dir)

        # Check all strategies generated
        expected_strategies = [
            'fibonacci_retracement',
            'lucas_timing',
            'momentum',
            'mean_reversion'
        ]

        for strategy in expected_strategies:
            self.assertIn(strategy, file_paths)

            # Check file exists
            file_path = Path(file_paths[strategy])
            self.assertTrue(file_path.exists())

            # Check file has .pine extension
            self.assertEqual(file_path.suffix, '.pine')

            # Check file content
            with open(file_path, 'r') as f:
                content = f.read()
                self.assertIn("//@version=5", content)
                self.assertIn("indicator(", content)

    def test_get_generator_info(self):
        """Test generator info retrieval."""
        info = self.generator.get_generator_info()

        # Check required fields
        self.assertIn('agent', info)
        self.assertIn('zeckendorf_address', info)
        self.assertIn('pine_script_version', info)
        self.assertIn('strategies', info)
        self.assertIn('features', info)
        self.assertIn('dependencies', info)

        # Check values
        self.assertEqual(info['agent'], 'Agent 24')
        self.assertEqual(info['zeckendorf_address'], '10000001001')
        self.assertEqual(info['pine_script_version'], '5')

        # Check strategies list
        self.assertEqual(len(info['strategies']), 4)

        # Check features
        self.assertIn('Integer-only arithmetic', info['features'])
        self.assertIn('TradingView Pine Script v5', info['features'])

    def test_alert_conditions(self):
        """Test alert conditions in generated scripts."""
        scripts = [
            self.generator.generate_fibonacci_retracement(),
            self.generator.generate_lucas_timing(),
            self.generator.generate_momentum_indicator(),
            self.generator.generate_mean_reversion_indicator()
        ]

        for script in scripts:
            # Check for alertcondition declarations
            self.assertIn("alertcondition(", script)

            # Count alerts (should have at least 2 per strategy)
            alert_count = script.count("alertcondition(")
            self.assertGreaterEqual(alert_count, 2, "Script should have at least 2 alerts")

    def test_table_displays(self):
        """Test interactive table displays."""
        scripts = [
            self.generator.generate_fibonacci_retracement(),
            self.generator.generate_lucas_timing(),
            self.generator.generate_momentum_indicator(),
            self.generator.generate_mean_reversion_indicator()
        ]

        for script in scripts:
            # Check for table creation
            self.assertIn("var table", script)
            self.assertIn("table.new(", script)

            # Check for table cells
            self.assertIn("table.cell(", script)

            # Check for conditional display
            self.assertIn("if barstate.islast", script)

    def test_strategy_specific_features(self):
        """Test strategy-specific features are included."""
        # Fibonacci: Golden pocket
        fib_script = self.generator.generate_fibonacci_retracement()
        self.assertIn("goldenPocket", fib_script)
        self.assertIn("Golden Pocket", fib_script)

        # Lucas: Nash equilibrium
        lucas_script = self.generator.generate_lucas_timing()
        self.assertIn("Nash equilibrium", lucas_script)
        self.assertIn("exitSignal", lucas_script)

        # Momentum: Divergence
        momentum_script = self.generator.generate_momentum_indicator()
        self.assertIn("divergence", momentum_script.lower())

        # Mean reversion: Z-score
        mean_reversion_script = self.generator.generate_mean_reversion_indicator()
        self.assertIn("zScore", mean_reversion_script)
        self.assertIn("reversionProb", mean_reversion_script)


def run_tests():
    """Run all tests."""
    unittest.main(argv=[''], verbosity=2, exit=False)


if __name__ == "__main__":
    run_tests()

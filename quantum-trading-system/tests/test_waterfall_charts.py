#!/usr/bin/env python3
"""
Unit Tests for Waterfall Chart Generator
========================================

Tests all functionality of the WaterfallChartGenerator class.
"""

import sys
from pathlib import Path
import unittest
from datetime import datetime, timedelta
import tempfile

import numpy as np
import pandas as pd

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from visualization.waterfall_charts import WaterfallChartGenerator


class TestWaterfallChartGenerator(unittest.TestCase):
    """Test suite for WaterfallChartGenerator"""

    def setUp(self):
        """Set up test fixtures"""
        self.generator = WaterfallChartGenerator(theme='dark')

        # Create sample trade data
        self.sample_trades = pd.DataFrame({
            'timestamp': pd.date_range('2024-01-01', periods=10, freq='D'),
            'pnl': [100, -50, 200, 150, -100, 300, -75, 125, 175, 250],
            'strategy': ['fib'] * 5 + ['lucas'] * 5
        })

        # Create sample strategy totals
        self.sample_strategy_totals = {
            'fibonacci_retracement': 15000,
            'lucas_timing': -2000,
            'momentum_integer': 8500,
            'mean_reversion': 12000,
            'breakout_fibonacci': -1500
        }

        # Create sample GMV data
        self.sample_gmv = pd.DataFrame({
            'timestamp': pd.date_range('2024-01-01', periods=10, freq='D'),
            'gmv': [100000, 102000, 101500, 103000, 102500,
                   104000, 103800, 105000, 106000, 107500],
            'pnl': [100, -50, 200, 150, -100, 300, -75, 125, 175, 250]
        })

    def test_initialization(self):
        """Test generator initialization"""
        # Dark theme
        gen_dark = WaterfallChartGenerator(theme='dark')
        self.assertEqual(gen_dark.theme, 'dark')
        self.assertEqual(gen_dark.template, 'plotly_dark')

        # Light theme
        gen_light = WaterfallChartGenerator(theme='light')
        self.assertEqual(gen_light.theme, 'light')
        self.assertEqual(gen_light.template, 'plotly_white')

    def test_create_cumulative_waterfall(self):
        """Test cumulative waterfall chart creation"""
        fig = self.generator.create_cumulative_waterfall(
            self.sample_trades,
            title="Test Cumulative Chart"
        )

        # Verify figure object
        self.assertIsNotNone(fig)
        self.assertEqual(fig.layout.title.text, "Test Cumulative Chart")

        # Verify data trace
        self.assertEqual(len(fig.data), 1)
        self.assertEqual(fig.data[0].type, 'waterfall')

        # Verify has start and total
        self.assertIn('Start', fig.data[0].x)
        self.assertIn('Total', fig.data[0].x)

    def test_create_cumulative_waterfall_with_list(self):
        """Test cumulative waterfall with list input"""
        trades_list = self.sample_trades.to_dict('records')

        fig = self.generator.create_cumulative_waterfall(
            trades_list,
            title="Test List Input"
        )

        self.assertIsNotNone(fig)
        self.assertEqual(len(fig.data), 1)

    def test_create_strategy_contribution_waterfall(self):
        """Test strategy contribution waterfall"""
        fig = self.generator.create_strategy_contribution_waterfall(
            self.sample_strategy_totals,
            title="Test Strategy Chart"
        )

        # Verify figure
        self.assertIsNotNone(fig)
        self.assertEqual(fig.layout.title.text, "Test Strategy Chart")

        # Verify waterfall trace
        self.assertEqual(len(fig.data), 1)
        self.assertEqual(fig.data[0].type, 'waterfall')

        # Verify all strategies included
        x_labels = list(fig.data[0].x)
        for strategy in self.sample_strategy_totals.keys():
            # Check if any x label contains part of strategy name
            found = any(strategy.split('_')[0] in str(x).lower() for x in x_labels)
            self.assertTrue(found, f"Strategy {strategy} not found in chart")

    def test_create_gmv_tracking_chart(self):
        """Test GMV tracking chart"""
        fig = self.generator.create_gmv_tracking_chart(
            self.sample_gmv,
            title="Test GMV Chart"
        )

        # Verify figure
        self.assertIsNotNone(fig)
        self.assertEqual(fig.layout.title.text, "Test GMV Chart")

        # Verify has multiple traces (GMV and cumulative P&L)
        self.assertGreaterEqual(len(fig.data), 2)

        # Verify trace types
        self.assertTrue(any(trace.type == 'scatter' for trace in fig.data))

    def test_create_gmv_tracking_with_list(self):
        """Test GMV tracking with list input"""
        gmv_list = self.sample_gmv.to_dict('records')

        fig = self.generator.create_gmv_tracking_chart(
            gmv_list,
            title="Test GMV List"
        )

        self.assertIsNotNone(fig)
        self.assertGreaterEqual(len(fig.data), 1)

    def test_create_combined_dashboard(self):
        """Test combined dashboard creation"""
        fig = self.generator.create_combined_dashboard(
            self.sample_trades,
            self.sample_strategy_totals,
            self.sample_gmv,
            title="Test Dashboard"
        )

        # Verify figure
        self.assertIsNotNone(fig)
        self.assertEqual(fig.layout.title.text, "Test Dashboard")

        # Verify has multiple traces (for multiple subplots)
        self.assertGreaterEqual(len(fig.data), 3)

    def test_create_combined_dashboard_without_gmv(self):
        """Test combined dashboard without GMV data"""
        fig = self.generator.create_combined_dashboard(
            self.sample_trades,
            self.sample_strategy_totals,
            gmv_data=None,
            title="Test Dashboard No GMV"
        )

        self.assertIsNotNone(fig)
        # Should have fewer traces without GMV
        self.assertGreaterEqual(len(fig.data), 2)

    def test_save_chart_html(self):
        """Test saving chart as HTML"""
        fig = self.generator.create_cumulative_waterfall(self.sample_trades)

        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = Path(tmpdir) / 'test_chart.html'
            saved_path = self.generator.save_chart(fig, output_path, format='html')

            # Verify file created
            self.assertTrue(Path(saved_path).exists())

            # Verify HTML content
            with open(saved_path, 'r') as f:
                content = f.read()
                self.assertIn('plotly', content.lower())

    def test_generate_sample_data(self):
        """Test sample data generation"""
        trades_df, strategy_totals, gmv_df = self.generator.generate_sample_data(
            num_trades=30,
            num_strategies=4,
            include_gmv=True
        )

        # Verify trades DataFrame
        self.assertEqual(len(trades_df), 30)
        self.assertIn('timestamp', trades_df.columns)
        self.assertIn('pnl', trades_df.columns)
        self.assertIn('strategy', trades_df.columns)

        # Verify strategy totals
        self.assertEqual(len(strategy_totals), 4)
        self.assertTrue(all(isinstance(v, (int, float)) for v in strategy_totals.values()))

        # Verify GMV DataFrame
        self.assertIsNotNone(gmv_df)
        self.assertEqual(len(gmv_df), 30)
        self.assertIn('gmv', gmv_df.columns)
        self.assertIn('pnl', gmv_df.columns)

    def test_generate_sample_data_without_gmv(self):
        """Test sample data generation without GMV"""
        trades_df, strategy_totals, gmv_df = self.generator.generate_sample_data(
            num_trades=20,
            num_strategies=3,
            include_gmv=False
        )

        self.assertEqual(len(trades_df), 20)
        self.assertEqual(len(strategy_totals), 3)
        self.assertIsNone(gmv_df)

    def test_color_scheme_dark(self):
        """Test dark theme color scheme"""
        gen = WaterfallChartGenerator(theme='dark')

        self.assertEqual(gen.COLORS['positive'], '#26A69A')
        self.assertEqual(gen.COLORS['negative'], '#EF5350')
        self.assertEqual(gen.COLORS['background'], '#131722')

    def test_color_scheme_light(self):
        """Test light theme color scheme"""
        gen = WaterfallChartGenerator(theme='light')

        # Light theme should override background colors
        self.assertEqual(gen.COLORS['background'], '#FFFFFF')
        self.assertEqual(gen.COLORS['paper'], '#F8F9FA')

    def test_cumulative_calculation(self):
        """Test cumulative P&L calculation accuracy"""
        trades = pd.DataFrame({
            'timestamp': pd.date_range('2024-01-01', periods=5, freq='D'),
            'pnl': [100, 200, -50, 150, -100],
            'strategy': ['test'] * 5
        })

        fig = self.generator.create_cumulative_waterfall(trades)

        # Total should be sum of all PnL
        expected_total = 100 + 200 - 50 + 150 - 100  # = 300

        # Check that total is in the y values
        y_values = fig.data[0].y
        total_value = y_values[-1]  # Last value is total

        self.assertAlmostEqual(total_value, expected_total, places=2)

    def test_empty_data_handling(self):
        """Test handling of empty datasets"""
        empty_df = pd.DataFrame(columns=['timestamp', 'pnl', 'strategy'])

        # Should not crash
        try:
            fig = self.generator.create_cumulative_waterfall(empty_df)
            # If it creates a figure, it should have at least start and total
            self.assertIsNotNone(fig)
        except Exception as e:
            # Empty data might raise exception, which is acceptable
            self.assertIsInstance(e, (ValueError, KeyError, IndexError))

    def test_chart_dimensions(self):
        """Test custom chart dimensions"""
        fig = self.generator.create_cumulative_waterfall(
            self.sample_trades,
            height=800,
            width=1200
        )

        self.assertEqual(fig.layout.height, 800)
        self.assertEqual(fig.layout.width, 1200)

    def test_large_dataset(self):
        """Test with large dataset"""
        # Generate large dataset
        large_trades = pd.DataFrame({
            'timestamp': pd.date_range('2024-01-01', periods=200, freq='D'),
            'pnl': np.random.normal(100, 500, 200),
            'strategy': np.random.choice(['fib', 'lucas', 'momentum'], 200)
        })

        # Should handle large dataset without crashing
        fig = self.generator.create_cumulative_waterfall(large_trades)
        self.assertIsNotNone(fig)

        # Dashboard should sample the data
        fig_dash = self.generator.create_combined_dashboard(
            large_trades,
            {'fib': 10000, 'lucas': 5000, 'momentum': 8000}
        )
        self.assertIsNotNone(fig_dash)


class TestWaterfallChartIntegration(unittest.TestCase):
    """Integration tests for waterfall charts"""

    def test_end_to_end_workflow(self):
        """Test complete workflow from data generation to chart creation"""
        # Initialize generator
        generator = WaterfallChartGenerator(theme='dark')

        # Generate sample data
        trades_df, strategy_totals, gmv_df = generator.generate_sample_data(
            num_trades=40,
            num_strategies=5,
            include_gmv=True
        )

        # Create all chart types
        fig1 = generator.create_cumulative_waterfall(trades_df)
        fig2 = generator.create_strategy_contribution_waterfall(strategy_totals)
        fig3 = generator.create_gmv_tracking_chart(gmv_df)
        fig4 = generator.create_combined_dashboard(trades_df, strategy_totals, gmv_df)

        # Verify all charts created successfully
        self.assertIsNotNone(fig1)
        self.assertIsNotNone(fig2)
        self.assertIsNotNone(fig3)
        self.assertIsNotNone(fig4)

        # Save to temp directory
        with tempfile.TemporaryDirectory() as tmpdir:
            path1 = generator.save_chart(fig1, Path(tmpdir) / 'chart1.html')
            path2 = generator.save_chart(fig2, Path(tmpdir) / 'chart2.html')
            path3 = generator.save_chart(fig3, Path(tmpdir) / 'chart3.html')
            path4 = generator.save_chart(fig4, Path(tmpdir) / 'chart4.html')

            # Verify all files created
            self.assertTrue(Path(path1).exists())
            self.assertTrue(Path(path2).exists())
            self.assertTrue(Path(path3).exists())
            self.assertTrue(Path(path4).exists())


def run_tests():
    """Run all tests"""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test cases
    suite.addTests(loader.loadTestsFromTestCase(TestWaterfallChartGenerator))
    suite.addTests(loader.loadTestsFromTestCase(TestWaterfallChartIntegration))

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)

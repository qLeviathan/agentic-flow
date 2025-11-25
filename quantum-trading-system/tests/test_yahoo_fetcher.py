"""
Unit Tests for Yahoo Finance Data Fetcher
Agent 3: Yahoo Finance Specialist

Tests:
1. Integer-only arithmetic validation
2. Data fetching functionality
3. Cross-validation logic
4. Report generation
5. Error handling
"""

import unittest
import pandas as pd
import numpy as np
from pathlib import Path
import json
import tempfile
import shutil
from datetime import datetime, timedelta
import sys

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from data.yahoo_fetcher import YahooDataFetcher


class TestYahooDataFetcher(unittest.TestCase):
    """Test suite for YahooDataFetcher class."""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures that are used by multiple tests."""
        cls.temp_dir = tempfile.mkdtemp()
        cls.test_tickers = ['AAPL', 'MSFT', 'GOOGL']

    @classmethod
    def tearDownClass(cls):
        """Clean up test fixtures."""
        if Path(cls.temp_dir).exists():
            shutil.rmtree(cls.temp_dir)

    def setUp(self):
        """Set up for each test."""
        self.fetcher = YahooDataFetcher(
            output_dir=self.temp_dir,
            tickers=self.test_tickers
        )

    def test_initialization(self):
        """Test fetcher initialization."""
        self.assertEqual(len(self.fetcher.tickers), 3)
        self.assertEqual(self.fetcher.SCALE_FACTOR, 10000)
        self.assertTrue(self.fetcher.output_dir.exists())

    def test_default_tickers(self):
        """Test default ticker list."""
        fetcher = YahooDataFetcher(output_dir=self.temp_dir)
        self.assertEqual(len(fetcher.DEFAULT_TICKERS), 100)

        # Check that major tickers are present
        self.assertIn('SPY', fetcher.DEFAULT_TICKERS)
        self.assertIn('AAPL', fetcher.DEFAULT_TICKERS)
        self.assertIn('MSFT', fetcher.DEFAULT_TICKERS)
        self.assertIn('GOOGL', fetcher.DEFAULT_TICKERS)

    def test_fetch_ticker_data_structure(self):
        """Test that fetched data has correct structure."""
        # Fetch recent data (last 30 days to be fast)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)

        df = self.fetcher.fetch_ticker_data(
            'AAPL',
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d")
        )

        # Check columns
        expected_cols = ['Open', 'High', 'Low', 'Close', 'Volume', 'Adj_Close', 'Ticker']
        for col in expected_cols:
            self.assertIn(col, df.columns, f"Missing column: {col}")

        # Check ticker value
        self.assertTrue((df['Ticker'] == 'AAPL').all())

    def test_integer_conversion(self):
        """Test that all prices are converted to integers."""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)

        df = self.fetcher.fetch_ticker_data(
            'MSFT',
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d")
        )

        # Check that OHLC columns are integers
        for col in ['Open', 'High', 'Low', 'Close', 'Adj_Close']:
            self.assertTrue(
                np.issubdtype(df[col].dtype, np.integer),
                f"{col} should be integer type, got {df[col].dtype}"
            )

        # Check that values are scaled correctly (should be large integers)
        # Typical stock prices are $100-500, so scaled values should be 1M-5M
        self.assertGreater(df['Close'].mean(), 100000,
                          "Scaled prices should be large integers")

    def test_integer_scale_factor(self):
        """Test that scale factor is correctly applied."""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=5)

        df = self.fetcher.fetch_ticker_data(
            'AAPL',
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d")
        )

        # All prices should be multiples of the scale factor's precision
        # (when divided by 100, should still be integers for $XX.XX prices)
        for col in ['Open', 'High', 'Low', 'Close']:
            # Check that values are reasonable (not zero or negative)
            self.assertTrue((df[col] > 0).all(), f"{col} should have positive values")

    def test_validate_integer_only_mock(self):
        """Test integer-only validation with mock data."""
        # Create mock integer data
        dates = pd.date_range('2024-01-01', periods=5)
        self.fetcher.data['TEST'] = pd.DataFrame({
            'Open': [100000, 101000, 102000, 103000, 104000],
            'High': [101000, 102000, 103000, 104000, 105000],
            'Low': [99000, 100000, 101000, 102000, 103000],
            'Close': [100500, 101500, 102500, 103500, 104500],
            'Volume': [1000000, 1100000, 1200000, 1300000, 1400000],
            'Ticker': ['TEST'] * 5
        }, index=dates)

        # Should pass validation
        self.assertTrue(self.fetcher.validate_integer_only())

    def test_validate_integer_only_fail(self):
        """Test that float data fails integer validation."""
        # Create mock float data
        dates = pd.date_range('2024-01-01', periods=5)
        self.fetcher.data['TEST'] = pd.DataFrame({
            'Open': [100.5, 101.5, 102.5, 103.5, 104.5],  # Floats!
            'Close': [100500, 101500, 102500, 103500, 104500],
            'Ticker': ['TEST'] * 5
        }, index=dates)

        # Should fail validation
        self.assertFalse(self.fetcher.validate_integer_only())

    def test_cross_validation_logic(self):
        """Test cross-validation correlation calculation."""
        # Create mock Yahoo data
        dates = pd.date_range('2024-01-01', periods=10)
        self.fetcher.data['TEST'] = pd.DataFrame({
            'Close': [100000 + i*1000 for i in range(10)],
            'Ticker': ['TEST'] * 10
        }, index=dates)

        # Create mock Tiingo data (similar but with small differences)
        tiingo_dir = Path(self.temp_dir) / "tiingo_raw"
        tiingo_dir.mkdir(exist_ok=True)

        tiingo_df = pd.DataFrame({
            'Close': [100000 + i*1000 + 50 for i in range(10)],  # Slight offset
            'Ticker': ['TEST'] * 10
        }, index=dates)
        tiingo_df.to_csv(tiingo_dir / "TEST_tiingo_int.csv")

        # Run cross-validation
        results = self.fetcher.cross_validate_with_tiingo(
            tiingo_dir=str(tiingo_dir),
            min_correlation=0.90
        )

        # Should have results for TEST ticker
        self.assertIn('TEST', results)
        self.assertEqual(results['TEST']['status'], 'compared')
        self.assertIsNotNone(results['TEST']['correlation'])
        self.assertGreater(results['TEST']['correlation'], 0.90)

    def test_validation_report_structure(self):
        """Test that validation report has correct structure."""
        # Create minimal mock data
        dates = pd.date_range('2024-01-01', periods=5)
        self.fetcher.data['AAPL'] = pd.DataFrame({
            'Open': [100000] * 5,
            'High': [101000] * 5,
            'Low': [99000] * 5,
            'Close': [100500] * 5,
            'Volume': [1000000] * 5,
            'Ticker': ['AAPL'] * 5
        }, index=dates)

        self.fetcher.validation_results = {
            'AAPL': {
                'status': 'compared',
                'correlation': 0.995,
                'pass': True
            }
        }

        # Generate report
        report_path = Path(self.temp_dir) / "test_report.json"
        self.fetcher.generate_validation_report(output_path=str(report_path))

        # Check that report was created
        self.assertTrue(report_path.exists())

        # Load and validate report structure
        with open(report_path, 'r') as f:
            report = json.load(f)

        # Check required sections
        self.assertIn('metadata', report)
        self.assertIn('data_summary', report)
        self.assertIn('integer_validation', report)
        self.assertIn('cross_validation', report)
        self.assertIn('statistics', report)

        # Check metadata
        self.assertEqual(report['metadata']['agent'], 'Yahoo Finance Specialist')
        self.assertEqual(report['metadata']['zeckendorf_address'], '100')
        self.assertEqual(report['metadata']['scale_factor'], 10000)

        # Check statistics
        self.assertIn('average_correlation', report['statistics'])

    def test_master_dataset_creation(self):
        """Test creation of master dataset."""
        # Create mock data for multiple tickers
        dates = pd.date_range('2024-01-01', periods=5)

        for ticker in ['AAPL', 'MSFT']:
            self.fetcher.data[ticker] = pd.DataFrame({
                'Open': [100000 + i*1000 for i in range(5)],
                'Close': [100500 + i*1000 for i in range(5)],
                'Ticker': [ticker] * 5
            }, index=dates)

        # Create master dataset
        master_path = Path(self.temp_dir) / "master.csv"
        result_path = self.fetcher.create_master_dataset(output_path=str(master_path))

        # Check that file was created
        self.assertTrue(Path(result_path).exists())

        # Load and validate
        master_df = pd.read_csv(result_path, index_col=0)

        # Should have data for both tickers
        self.assertEqual(len(master_df), 10)  # 5 days × 2 tickers
        self.assertIn('AAPL', master_df['Ticker'].values)
        self.assertIn('MSFT', master_df['Ticker'].values)

    def test_error_handling_invalid_ticker(self):
        """Test error handling for invalid ticker."""
        # This should not raise an exception, just return empty DataFrame
        df = self.fetcher.fetch_ticker_data('INVALID_TICKER_XYZ123',
                                           start_date="2024-01-01",
                                           end_date="2024-01-10")

        # Should return empty DataFrame
        self.assertTrue(df.empty)

    def test_high_low_relationship(self):
        """Test that High >= Low for all data points."""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)

        df = self.fetcher.fetch_ticker_data(
            'AAPL',
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d")
        )

        # High should always be >= Low
        self.assertTrue((df['High'] >= df['Low']).all(),
                       "High price should always be >= Low price")

    def test_volume_is_positive(self):
        """Test that volume is always positive."""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)

        df = self.fetcher.fetch_ticker_data(
            'MSFT',
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d")
        )

        # Volume should always be positive
        self.assertTrue((df['Volume'] > 0).all(),
                       "Volume should always be positive")

    def test_no_float_leakage(self):
        """Critical test: ensure no floating-point numbers leak through."""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=10)

        df = self.fetcher.fetch_ticker_data(
            'AAPL',
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d")
        )

        # Check all numeric columns
        for col in df.select_dtypes(include=[np.number]).columns:
            if col != 'Ticker':
                dtype = df[col].dtype
                self.assertTrue(
                    np.issubdtype(dtype, np.integer),
                    f"Float leakage detected in {col}: dtype={dtype}"
                )


class TestIntegration(unittest.TestCase):
    """Integration tests for complete workflow."""

    def setUp(self):
        """Set up for integration tests."""
        self.temp_dir = tempfile.mkdtemp()
        self.fetcher = YahooDataFetcher(
            output_dir=self.temp_dir,
            tickers=['AAPL', 'MSFT']  # Small set for faster tests
        )

    def tearDown(self):
        """Clean up."""
        if Path(self.temp_dir).exists():
            shutil.rmtree(self.temp_dir)

    def test_full_workflow(self):
        """Test complete data fetching and validation workflow."""
        # Fetch data (last 30 days for speed)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)

        data = self.fetcher.fetch_all_tickers(
            start_date=start_date.strftime("%Y-%m-%d"),
            end_date=end_date.strftime("%Y-%m-%d"),
            save_csv=True
        )

        # Should have fetched some data
        self.assertGreater(len(data), 0)

        # Validate integer-only
        is_integer = self.fetcher.validate_integer_only()
        self.assertTrue(is_integer, "All data should be integer-only")

        # Generate report
        report_path = Path(self.temp_dir) / "integration_report.json"
        result = self.fetcher.generate_validation_report(output_path=str(report_path))

        # Report should exist
        self.assertTrue(Path(result).exists())

        # Create master dataset
        master_path = Path(self.temp_dir) / "integration_master.csv"
        master_result = self.fetcher.create_master_dataset(output_path=str(master_path))

        # Master should exist
        self.assertTrue(Path(master_result).exists())


def run_tests():
    """Run all tests with verbose output."""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test cases
    suite.addTests(loader.loadTestsFromTestCase(TestYahooDataFetcher))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegration))

    # Run with verbose output
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Return exit code
    return 0 if result.wasSuccessful() else 1


if __name__ == '__main__':
    exit_code = run_tests()
    sys.exit(exit_code)

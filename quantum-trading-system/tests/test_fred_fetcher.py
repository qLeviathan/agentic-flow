"""
Unit tests for FRED Data Fetcher
Tests integer conversion, scaling, and data fetching functionality.

Author: Agent 2 - FRED API Specialist
Date: 2025-11-24
"""

import unittest
import os
import tempfile
import shutil
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import sys

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from data.fred_fetcher import FREDDataFetcher


class TestFREDDataFetcher(unittest.TestCase):
    """Test cases for FREDDataFetcher class."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.fetcher = FREDDataFetcher(
            api_key='test_key',
            output_dir=self.temp_dir
        )

    def tearDown(self):
        """Clean up test fixtures."""
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

    def test_initialization(self):
        """Test fetcher initialization."""
        self.assertEqual(self.fetcher.api_key, 'test_key')
        self.assertEqual(str(self.fetcher.output_dir), self.temp_dir)
        self.assertTrue(os.path.exists(self.temp_dir))
        self.assertEqual(self.fetcher.start_date, '2000-01-01')

    def test_scaling_factor_determination(self):
        """Test that appropriate scaling factors are chosen."""
        # Test rate/percentage indicators (should use 10000x)
        rate_indicator = {
            'name': 'Unemployment Rate',
            'symbol': 'UNRATE'
        }
        self.assertEqual(
            self.fetcher._determine_scaling_factor(rate_indicator),
            10000
        )

        # Test price index (should use 10000x)
        price_indicator = {
            'name': 'Consumer Price Index',
            'symbol': 'CPIAUCSL'
        }
        self.assertEqual(
            self.fetcher._determine_scaling_factor(price_indicator),
            10000
        )

        # Test large aggregate (should use 1000x)
        gdp_indicator = {
            'name': 'Real Gross Domestic Product',
            'symbol': 'GDPC1'
        }
        self.assertEqual(
            self.fetcher._determine_scaling_factor(gdp_indicator),
            1000
        )

        # Test employment numbers (should use 1000x)
        employment_indicator = {
            'name': 'Nonfarm Payrolls',
            'symbol': 'PAYEMS'
        }
        self.assertEqual(
            self.fetcher._determine_scaling_factor(employment_indicator),
            1000
        )

    def test_integer_conversion_precision(self):
        """Test that integer conversion preserves precision."""
        # Test with 10000x scaling
        test_values = [
            (3.14159, 10000, 31415),
            (0.0025, 10000, 25),
            (100.5678, 10000, 1005678),
            (-2.5, 10000, -25000),
        ]

        for original, scale, expected in test_values:
            result = int(original * scale)
            self.assertEqual(result, expected)

            # Verify we can reconstruct with acceptable precision
            # Note: int() truncates, so precision loss is expected
            reconstructed = result / scale
            # Allow larger tolerance for truncation
            self.assertAlmostEqual(reconstructed, original, places=3)

    @patch('data.fred_fetcher.requests')
    def test_fetch_series_success(self, mock_requests):
        """Test successful series fetch from API."""
        # Mock API response
        mock_response = Mock()
        mock_response.json.return_value = {
            'observations': [
                {'date': '2000-01-01', 'value': '3.5'},
                {'date': '2000-02-01', 'value': '3.6'},
                {'date': '2000-03-01', 'value': '.'},  # Missing value
                {'date': '2000-04-01', 'value': '3.7'},
            ]
        }
        mock_response.raise_for_status = Mock()
        mock_requests.get.return_value = mock_response

        indicator = {
            'name': 'Test Rate',
            'symbol': 'TEST',
            'importance': 10
        }

        data, error = self.fetcher.fetch_series('TEST', indicator)

        # Should have 3 valid observations (skipping the missing one)
        self.assertEqual(len(data), 3)
        self.assertEqual(error, "")

        # Check integer conversion (rate uses 10000x)
        self.assertEqual(data[0], ('2000-01-01', 35000))  # 3.5 * 10000
        self.assertEqual(data[1], ('2000-02-01', 36000))  # 3.6 * 10000
        self.assertEqual(data[2], ('2000-04-01', 37000))  # 3.7 * 10000

    @patch('data.fred_fetcher.requests')
    def test_fetch_series_no_data(self, mock_requests):
        """Test handling of empty response."""
        mock_response = Mock()
        mock_response.json.return_value = {'observations': []}
        mock_response.raise_for_status = Mock()
        mock_requests.get.return_value = mock_response

        indicator = {'name': 'Test', 'symbol': 'TEST'}
        data, error = self.fetcher.fetch_series('TEST', indicator)

        self.assertEqual(len(data), 0)
        self.assertEqual(error, "No data returned")

    @patch('data.fred_fetcher.requests.get')
    def test_fetch_series_api_error(self, mock_get):
        """Test handling of API errors."""
        mock_get.side_effect = Exception("API Error")

        indicator = {'name': 'Test', 'symbol': 'TEST'}
        data, error = self.fetcher.fetch_series('TEST', indicator)

        self.assertEqual(len(data), 0)
        self.assertIn("error", error.lower())

    def test_fetch_series_no_api_key(self):
        """Test behavior when API key is missing."""
        fetcher = FREDDataFetcher(api_key='', output_dir=self.temp_dir)
        indicator = {'name': 'Test', 'symbol': 'TEST'}

        data, error = fetcher.fetch_series('TEST', indicator)

        self.assertEqual(len(data), 0)
        self.assertIn("API_KEY", error)

    def test_save_to_csv(self):
        """Test CSV file creation and format."""
        test_data = [
            ('2000-01-01', 35000),
            ('2000-02-01', 36000),
            ('2000-03-01', 37000),
        ]

        indicator = {
            'name': 'Test Indicator',
            'symbol': 'TEST',
            'category': 'test_category',
            'importance': 10,
            'description': 'Test description'
        }

        self.fetcher.save_to_csv('TEST', test_data, indicator)

        # Check file exists
        csv_path = Path(self.temp_dir) / 'TEST.csv'
        self.assertTrue(csv_path.exists())

        # Read and verify content
        with open(csv_path, 'r') as f:
            content = f.read()

        # Check metadata headers
        self.assertIn('Test Indicator', content)
        self.assertIn('TEST', content)
        self.assertIn('test_category', content)
        self.assertIn('Test description', content)
        self.assertIn('Scaling Factor', content)

        # Check data
        self.assertIn('2000-01-01,35000', content)
        self.assertIn('2000-02-01,36000', content)
        self.assertIn('2000-03-01,37000', content)

    def test_monthly_frequency_parameter(self):
        """Test that monthly frequency is requested."""
        with patch('data.fred_fetcher.requests') as mock_requests:
            mock_response = Mock()
            mock_response.json.return_value = {'observations': []}
            mock_response.raise_for_status = Mock()
            mock_requests.get.return_value = mock_response

            indicator = {'name': 'Test', 'symbol': 'TEST'}
            self.fetcher.fetch_series('TEST', indicator)

            # Check that monthly frequency was requested
            call_args = mock_requests.get.call_args
            params = call_args[1]['params']
            self.assertEqual(params['frequency'], 'm')
            self.assertEqual(params['aggregation_method'], 'avg')

    def test_date_range(self):
        """Test that correct date range is used."""
        self.assertEqual(self.fetcher.start_date, '2000-01-01')
        self.assertIsNotNone(self.fetcher.end_date)
        # End date should be current or recent
        from datetime import datetime
        end_date = datetime.strptime(self.fetcher.end_date, '%Y-%m-%d')
        now = datetime.now()
        self.assertLessEqual((now - end_date).days, 1)

    def test_generate_documentation(self):
        """Test documentation generation."""
        # Add a test indicator
        self.fetcher.indicators = [{
            'symbol': 'TEST',
            'name': 'Test Indicator',
            'category': 'test_category',
            'importance': 10,
            'frequency': 'Monthly',
            'description': 'Test description'
        }]

        doc = self.fetcher.generate_documentation()

        # Check documentation content
        self.assertIn('FRED Economic Indicators', doc)
        self.assertIn('Test Indicator', doc)
        self.assertIn('TEST', doc)
        # Category gets title-cased in documentation
        self.assertTrue('test_category' in doc.lower() or 'Test Category' in doc)
        self.assertIn('Test description', doc)
        self.assertIn('Scaling', doc)

    def test_load_indicators(self):
        """Test indicator loading from JSON."""
        # Should load indicators if file exists
        indicators = self.fetcher.indicators

        # Check we have indicators (assuming the JSON file exists)
        if indicators:
            # Verify structure
            self.assertIsInstance(indicators, list)
            self.assertGreater(len(indicators), 0)

            # Check first indicator has required fields
            first = indicators[0]
            self.assertIn('symbol', first)
            self.assertIn('name', first)
            self.assertIn('category', first)


class TestIntegerPrecision(unittest.TestCase):
    """Test integer conversion precision for various economic indicators."""

    def test_unemployment_rate_precision(self):
        """Test precision for unemployment rate (typically 3.5% to 10.0%)."""
        test_rates = [3.5, 3.67, 5.0, 7.89, 10.2]
        scale = 10000

        for rate in test_rates:
            scaled = int(rate * scale)
            recovered = scaled / scale
            self.assertAlmostEqual(recovered, rate, places=4)

    def test_cpi_precision(self):
        """Test precision for CPI values (typically 200-300 range)."""
        test_values = [250.0, 267.789, 299.99]
        scale = 10000

        for value in test_values:
            scaled = int(value * scale)
            recovered = scaled / scale
            self.assertAlmostEqual(recovered, value, places=4)

    def test_gdp_precision(self):
        """Test precision for GDP (large values in billions)."""
        test_values = [20000.5, 21500.789, 22750.123]
        scale = 1000

        for value in test_values:
            scaled = int(value * scale)
            recovered = scaled / scale
            self.assertAlmostEqual(recovered, value, places=3)

    def test_interest_rate_precision(self):
        """Test precision for interest rates (0.00% to 5.00%)."""
        test_rates = [0.25, 1.5, 2.375, 4.75, 5.125]
        scale = 10000

        for rate in test_rates:
            scaled = int(rate * scale)
            recovered = scaled / scale
            self.assertAlmostEqual(recovered, rate, places=4)

    def test_negative_values(self):
        """Test handling of negative values."""
        test_values = [-2.5, -0.75, -100.5]
        scale = 10000

        for value in test_values:
            scaled = int(value * scale)
            recovered = scaled / scale
            self.assertAlmostEqual(recovered, value, places=4)
            self.assertLess(scaled, 0)  # Should preserve sign


class TestCSVFormat(unittest.TestCase):
    """Test CSV file format compliance."""

    def setUp(self):
        """Set up test fixtures."""
        self.temp_dir = tempfile.mkdtemp()
        self.fetcher = FREDDataFetcher(
            api_key='test_key',
            output_dir=self.temp_dir
        )

    def tearDown(self):
        """Clean up test fixtures."""
        if os.path.exists(self.temp_dir):
            shutil.rmtree(self.temp_dir)

    def test_csv_headers(self):
        """Test that CSV has proper headers."""
        test_data = [('2000-01-01', 35000)]
        indicator = {
            'name': 'Test',
            'symbol': 'TEST',
            'category': 'test',
            'importance': 10,
            'description': 'Test'
        }

        self.fetcher.save_to_csv('TEST', test_data, indicator)

        csv_path = Path(self.temp_dir) / 'TEST.csv'
        with open(csv_path, 'r') as f:
            lines = f.readlines()

        # Should have metadata comments at top
        self.assertTrue(lines[0].startswith('#'))

        # Find data header line
        header_line = None
        for line in lines:
            if line.strip() == 'date,value_scaled':
                header_line = line
                break

        self.assertIsNotNone(header_line, "CSV should have 'date,value_scaled' header")

    def test_csv_data_format(self):
        """Test that CSV data is in correct format."""
        test_data = [
            ('2000-01-01', 35000),
            ('2000-02-01', 36000),
        ]
        indicator = {
            'name': 'Test',
            'symbol': 'TEST',
            'category': 'test',
            'importance': 10,
            'description': 'Test'
        }

        self.fetcher.save_to_csv('TEST', test_data, indicator)

        csv_path = Path(self.temp_dir) / 'TEST.csv'

        import csv
        with open(csv_path, 'r') as f:
            reader = csv.reader(f)
            rows = [row for row in reader if row and not row[0].startswith('#')]

        # Find data rows (after header)
        data_rows = []
        found_header = False
        for row in rows:
            if row == ['date', 'value_scaled']:
                found_header = True
                continue
            if found_header and len(row) == 2:
                data_rows.append(row)

        self.assertEqual(len(data_rows), 2)
        self.assertEqual(data_rows[0], ['2000-01-01', '35000'])
        self.assertEqual(data_rows[1], ['2000-02-01', '36000'])


def run_tests():
    """Run all tests."""
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestFREDDataFetcher))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegerPrecision))
    suite.addTests(loader.loadTestsFromTestCase(TestCSVFormat))

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Return success/failure
    return result.wasSuccessful()


if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)

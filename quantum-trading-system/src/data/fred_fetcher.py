"""
FRED Economic Data Fetcher
Fetches 266+ monthly economic indicators from FRED API with integer-only conversion.

Author: Agent 2 - FRED API Specialist
Date: 2025-11-24
"""

import json
import os
import csv
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from pathlib import Path
import time

try:
    import requests
except ImportError:
    print("Warning: requests module not available. Install with: pip install requests")
    requests = None


class FREDDataFetcher:
    """
    Fetches economic indicators from FRED API and converts to integer format.

    All data is scaled appropriately:
    - Price indices, rates: × 10000 (preserves 4 decimal places)
    - Large values (GDP, etc): × 1000 (preserves 3 decimal places)
    - Small percentages: × 10000 (preserves 4 decimal places)
    """

    def __init__(self, api_key: Optional[str] = None, output_dir: str = "src/data/fred_raw"):
        """
        Initialize FRED data fetcher.

        Args:
            api_key: FRED API key (optional, reads from env if not provided)
            output_dir: Directory to save CSV files
        """
        self.api_key = api_key or os.getenv('FRED_API_KEY', '')
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.base_url = "https://api.stlouisfed.org/fred/series/observations"
        self.start_date = "2000-01-01"
        self.end_date = datetime.now().strftime("%Y-%m-%d")

        # Load indicator definitions
        self.indicators = self._load_indicators()
        self.indicators_processed = 0
        self.indicators_failed = []

    def _load_indicators(self) -> List[Dict]:
        """Load indicator definitions from economic-indicators.json"""
        json_path = Path("/home/user/agentic-flow/trading-system/docs/economic-indicators.json")

        if not json_path.exists():
            print(f"Warning: {json_path} not found. Using empty indicator list.")
            return []

        with open(json_path, 'r') as f:
            data = json.load(f)

        indicators = []

        # Extract indicators from all categories
        for category_key, category_data in data.get('categories', {}).items():
            if category_key == 'sector_indices':
                # Handle nested sector structure
                for sector_key, sector_data in category_data.get('sectors', {}).items():
                    for indicator in sector_data.get('indicators', []):
                        if indicator.get('source') in ['FRED', 'Census', 'BEA']:
                            indicators.append({
                                'category': f"sector_{sector_key}",
                                'sector': sector_data.get('name'),
                                **indicator
                            })
            else:
                # Handle regular categories
                for indicator in category_data.get('indicators', []):
                    if indicator.get('source') in ['FRED', 'Census', 'BEA']:
                        indicators.append({
                            'category': category_key,
                            **indicator
                        })

        # Add cross-sector indicators
        for indicator in data.get('additional_cross_sector_indicators', {}).get('indicators', []):
            if indicator.get('source') in ['FRED', 'Calculated', 'Shiller']:
                indicators.append({
                    'category': 'cross_sector',
                    **indicator
                })

        print(f"Loaded {len(indicators)} FRED-compatible indicators")
        return indicators

    def _determine_scaling_factor(self, indicator: Dict) -> int:
        """
        Determine appropriate scaling factor based on indicator type.

        Returns:
            Scaling factor (1000, 10000, or 100000)
        """
        name = indicator.get('name', '').lower()
        symbol = indicator.get('symbol', '').lower()

        # Rates, percentages, indices - need high precision (4 decimals)
        # Check this first to catch "unemployment rate" before "employment"
        if any(x in name for x in ['rate', 'ratio', 'percent', 'index', 'yield', 'spread']):
            return 10000

        # Price indices - high precision
        if any(x in name for x in ['cpi', 'ppi', 'pce', 'price', 'cost']):
            return 10000

        # Large economic aggregates (GDP, spending, etc) - moderate precision
        if any(x in name for x in ['gdp', 'product', 'spending', 'income', 'sales', 'production', 'inventory']):
            return 1000

        # Employment numbers (large counts, not rates) - moderate precision
        if any(x in name for x in ['payroll', 'payrolls', 'employment', 'jobless', 'claims']):
            return 1000

        # Default: high precision for safety
        return 10000

    def fetch_series(self, series_id: str, indicator: Dict) -> Tuple[List[Tuple], str]:
        """
        Fetch a single time series from FRED API.

        Args:
            series_id: FRED series ID
            indicator: Indicator metadata dict

        Returns:
            Tuple of (data_rows, error_message)
            data_rows: List of (date, integer_value) tuples
            error_message: Empty string if success, error description if failure
        """
        if not self.api_key:
            return [], "FRED_API_KEY not set"

        if not requests:
            return [], "requests library not available"

        params = {
            'series_id': series_id,
            'api_key': self.api_key,
            'file_type': 'json',
            'observation_start': self.start_date,
            'observation_end': self.end_date,
            'frequency': 'm',  # Monthly frequency
            'aggregation_method': 'avg'  # Average for downsampling
        }

        try:
            response = requests.get(self.base_url, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()
            observations = data.get('observations', [])

            if not observations:
                return [], "No data returned"

            # Determine scaling factor
            scale = self._determine_scaling_factor(indicator)

            # Convert to integer format
            rows = []
            for obs in observations:
                date_str = obs.get('date')
                value_str = obs.get('value')

                # Skip missing values
                if value_str == '.' or value_str is None:
                    continue

                try:
                    float_value = float(value_str)
                    # Convert to integer (scaled)
                    int_value = int(float_value * scale)
                    rows.append((date_str, int_value))
                except (ValueError, TypeError):
                    continue

            return rows, ""

        except requests.exceptions.RequestException as e:
            return [], f"Request error: {str(e)}"
        except json.JSONDecodeError as e:
            return [], f"JSON decode error: {str(e)}"
        except Exception as e:
            return [], f"Unexpected error: {str(e)}"

    def save_to_csv(self, series_id: str, data: List[Tuple], indicator: Dict):
        """
        Save time series data to CSV file.

        Args:
            series_id: FRED series ID
            data: List of (date, value) tuples
            indicator: Indicator metadata
        """
        filename = f"{series_id}.csv"
        filepath = self.output_dir / filename

        # Get scaling factor for documentation
        scale = self._determine_scaling_factor(indicator)

        with open(filepath, 'w', newline='') as f:
            writer = csv.writer(f)
            # Write header with metadata
            writer.writerow(['# ' + indicator.get('name', series_id)])
            writer.writerow(['# Symbol: ' + series_id])
            writer.writerow(['# Category: ' + indicator.get('category', 'unknown')])
            writer.writerow(['# Importance: ' + str(indicator.get('importance', 'N/A'))])
            writer.writerow(['# Description: ' + indicator.get('description', '')])
            writer.writerow(['# Scaling Factor: ' + str(scale) + 'x'])
            writer.writerow(['# Format: Integer (multiply by scaling factor to get original)'])
            writer.writerow(['# Date Range: ' + self.start_date + ' to ' + self.end_date])
            writer.writerow([])

            # Write column headers
            writer.writerow(['date', 'value_scaled'])

            # Write data
            writer.writerows(data)

    def fetch_all_indicators(self, max_requests_per_minute: int = 120):
        """
        Fetch all 266+ indicators from FRED API.

        Args:
            max_requests_per_minute: Rate limit for API requests
        """
        print(f"Starting fetch of {len(self.indicators)} indicators...")
        print(f"Output directory: {self.output_dir.absolute()}")
        print(f"Date range: {self.start_date} to {self.end_date}")
        print()

        delay = 60.0 / max_requests_per_minute

        for i, indicator in enumerate(self.indicators, 1):
            series_id = indicator.get('symbol')
            name = indicator.get('name', series_id)

            print(f"[{i}/{len(self.indicators)}] Fetching {series_id}: {name}...")

            # Fetch data
            data, error = self.fetch_series(series_id, indicator)

            if error:
                print(f"  ❌ Failed: {error}")
                self.indicators_failed.append({
                    'symbol': series_id,
                    'name': name,
                    'error': error
                })
            elif not data:
                print(f"  ⚠️  No data available")
                self.indicators_failed.append({
                    'symbol': series_id,
                    'name': name,
                    'error': 'No data available'
                })
            else:
                # Save to CSV
                self.save_to_csv(series_id, data, indicator)
                self.indicators_processed += 1
                print(f"  ✅ Success: {len(data)} observations saved")

            # Rate limiting
            if i < len(self.indicators):
                time.sleep(delay)

        # Print summary
        print()
        print("=" * 70)
        print("FETCH COMPLETE")
        print("=" * 70)
        print(f"Successfully processed: {self.indicators_processed}/{len(self.indicators)}")
        print(f"Failed: {len(self.indicators_failed)}")

        if self.indicators_failed:
            print("\nFailed indicators:")
            for item in self.indicators_failed[:10]:  # Show first 10
                print(f"  - {item['symbol']}: {item['error']}")
            if len(self.indicators_failed) > 10:
                print(f"  ... and {len(self.indicators_failed) - 10} more")

    def generate_documentation(self) -> str:
        """
        Generate comprehensive documentation of all indicators.

        Returns:
            Markdown-formatted documentation string
        """
        doc = "# FRED Economic Indicators Documentation\n\n"
        doc += f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        doc += f"**Total Indicators:** {len(self.indicators)}\n\n"
        doc += f"**Date Range:** {self.start_date} to {self.end_date}\n\n"
        doc += "**Format:** All values are integers scaled by 1000x or 10000x\n\n"
        doc += "---\n\n"

        # Group by category
        by_category = {}
        for indicator in self.indicators:
            category = indicator.get('category', 'uncategorized')
            if category not in by_category:
                by_category[category] = []
            by_category[category].append(indicator)

        # Generate documentation by category
        for category, indicators in sorted(by_category.items()):
            doc += f"## {category.replace('_', ' ').title()}\n\n"
            doc += f"**Count:** {len(indicators)}\n\n"

            for indicator in sorted(indicators, key=lambda x: x.get('importance', 0), reverse=True):
                symbol = indicator.get('symbol')
                name = indicator.get('name')
                importance = indicator.get('importance', 'N/A')
                frequency = indicator.get('frequency', 'Unknown')
                description = indicator.get('description', 'No description')
                scale = self._determine_scaling_factor(indicator)

                doc += f"### {name}\n\n"
                doc += f"- **Symbol:** `{symbol}`\n"
                doc += f"- **Importance:** {importance}/10\n"
                doc += f"- **Frequency:** {frequency}\n"
                doc += f"- **Scaling:** {scale}x (divide integer by {scale} to get original)\n"
                doc += f"- **Description:** {description}\n"
                doc += f"- **File:** `{symbol}.csv`\n\n"

        return doc


def main():
    """Main entry point for FRED data fetcher."""
    import sys

    # Check for API key
    api_key = os.getenv('FRED_API_KEY')
    if not api_key:
        print("ERROR: FRED_API_KEY environment variable not set")
        print("Get your free API key at: https://fred.stlouisfed.org/docs/api/api_key.html")
        print()
        print("Set it with:")
        print("  export FRED_API_KEY='your_key_here'")
        sys.exit(1)

    # Create fetcher
    fetcher = FREDDataFetcher(api_key=api_key)

    # Fetch all indicators
    fetcher.fetch_all_indicators()

    # Generate documentation
    doc = fetcher.generate_documentation()
    doc_path = Path("docs/fred_indicators_documentation.md")
    doc_path.parent.mkdir(parents=True, exist_ok=True)
    with open(doc_path, 'w') as f:
        f.write(doc)

    print(f"\nDocumentation saved to: {doc_path.absolute()}")

    # Log completion
    try:
        import subprocess
        subprocess.run([
            'npx', 'agentdb@latest', 'reflexion', 'store',
            'fred-api-specialist', 'fetch-complete',
            '1.0', 'true',
            f'Fetched {fetcher.indicators_processed} indicators successfully'
        ], check=False, capture_output=True)
    except Exception:
        pass


if __name__ == '__main__':
    main()

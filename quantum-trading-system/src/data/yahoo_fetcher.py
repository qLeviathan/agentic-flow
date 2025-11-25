"""
Yahoo Finance Data Fetcher - Backup and Validation Source
Agent 3: Yahoo Finance Specialist (Zeckendorf Address: 100)

Purpose:
- Backup data source for top 100 tickers
- Cross-validation with Tiingo data
- Integer-only price representation (multiply by 10000)
- Correlation validation (target > 0.99)

Dependencies: yfinance
"""

import yfinance as yf
import pandas as pd
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple, Optional
from datetime import datetime
import json
import csv


class YahooDataFetcher:
    """
    Yahoo Finance data fetcher with integer-only arithmetic.

    All prices are multiplied by 10000 to maintain integer representation.
    Example: $123.45 -> 1234500 (cents * 100)
    """

    # Top 100 tickers for S&P 500 and major indices
    DEFAULT_TICKERS = [
        # Major indices
        'SPY', 'QQQ', 'DIA', 'IWM', 'VTI',
        # Top tech
        'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'AMD', 'INTC', 'CRM',
        # Major financials
        'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW', 'AXP', 'V',
        # Healthcare
        'UNH', 'JNJ', 'PFE', 'ABBV', 'TMO', 'MRK', 'ABT', 'DHR', 'LLY', 'BMY',
        # Consumer
        'WMT', 'HD', 'PG', 'KO', 'PEP', 'COST', 'MCD', 'NKE', 'SBUX', 'TGT',
        # Industrial
        'BA', 'CAT', 'HON', 'UNP', 'UPS', 'RTX', 'LMT', 'GE', 'MMM', 'DE',
        # Energy
        'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'PSX', 'VLO', 'MPC', 'OXY', 'HAL',
        # Communications
        'DIS', 'CMCSA', 'NFLX', 'T', 'VZ', 'CHTR', 'TMUS', 'FOXA', 'PARA', 'WBD',
        # Real Estate & Materials
        'AMT', 'PLD', 'CCI', 'EQIX', 'PSA', 'LIN', 'APD', 'ECL', 'SHW', 'FCX',
        # Technology continued
        'ORCL', 'CSCO', 'ADBE', 'AVGO', 'TXN', 'QCOM', 'AMAT', 'ADI', 'MU', 'LRCX'
    ]

    SCALE_FACTOR = 10000  # Multiply prices by 10000 for integer representation

    def __init__(self,
                 output_dir: str = "/home/user/agentic-flow/quantum-trading-system/src/data/yahoo_raw",
                 tickers: Optional[List[str]] = None):
        """
        Initialize Yahoo Finance data fetcher.

        Args:
            output_dir: Directory to save CSV files
            tickers: List of ticker symbols (defaults to top 100)
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.tickers = tickers if tickers else self.DEFAULT_TICKERS[:100]
        self.data = {}
        self.validation_results = {}

    def fetch_ticker_data(self,
                         ticker: str,
                         start_date: str = "2020-01-01",
                         end_date: Optional[str] = None) -> pd.DataFrame:
        """
        Fetch OHLCV data for a single ticker with integer conversion.

        Args:
            ticker: Stock ticker symbol
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD), defaults to today

        Returns:
            DataFrame with integer prices (scaled by 10000)
        """
        if end_date is None:
            end_date = datetime.now().strftime("%Y-%m-%d")

        try:
            # Fetch data from Yahoo Finance
            stock = yf.Ticker(ticker)
            df = stock.history(start=start_date, end=end_date, auto_adjust=False)

            if df.empty:
                print(f"Warning: No data found for {ticker}")
                return pd.DataFrame()

            # Convert to integer representation
            df_int = pd.DataFrame(index=df.index)

            # Convert OHLCV to integers (multiply by 10000)
            for col in ['Open', 'High', 'Low', 'Close']:
                if col in df.columns:
                    df_int[col] = (df[col] * self.SCALE_FACTOR).round().astype(np.int64)

            # Volume is already integer
            if 'Volume' in df.columns:
                df_int['Volume'] = df['Volume'].astype(np.int64)

            # Adjusted Close (for dividends/splits)
            if 'Adj Close' in df.columns:
                df_int['Adj_Close'] = (df['Adj Close'] * self.SCALE_FACTOR).round().astype(np.int64)

            # Add ticker column
            df_int['Ticker'] = ticker

            return df_int

        except Exception as e:
            print(f"Error fetching {ticker}: {str(e)}")
            return pd.DataFrame()

    def fetch_all_tickers(self,
                         start_date: str = "2020-01-01",
                         end_date: Optional[str] = None,
                         save_csv: bool = True) -> Dict[str, pd.DataFrame]:
        """
        Fetch data for all tickers in the list.

        Args:
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            save_csv: Whether to save individual CSV files

        Returns:
            Dictionary mapping ticker -> DataFrame
        """
        print(f"Fetching Yahoo Finance data for {len(self.tickers)} tickers...")
        print(f"Date range: {start_date} to {end_date or 'today'}")
        print(f"Scale factor: {self.SCALE_FACTOR} (integer-only)")

        for i, ticker in enumerate(self.tickers):
            print(f"[{i+1}/{len(self.tickers)}] Fetching {ticker}...", end=' ')

            df = self.fetch_ticker_data(ticker, start_date, end_date)

            if not df.empty:
                self.data[ticker] = df
                print(f"✓ {len(df)} days")

                if save_csv:
                    csv_path = self.output_dir / f"{ticker}_yahoo_int.csv"
                    df.to_csv(csv_path)
            else:
                print(f"✗ No data")

        print(f"\nCompleted: {len(self.data)}/{len(self.tickers)} tickers successfully fetched")
        return self.data

    def validate_integer_only(self) -> bool:
        """
        Validate that all data uses integer-only representation.

        Returns:
            True if all values are integers, False otherwise
        """
        print("\nValidating integer-only arithmetic...")
        all_integer = True

        for ticker, df in self.data.items():
            for col in df.columns:
                if col != 'Ticker' and not np.issubdtype(df[col].dtype, np.integer):
                    print(f"✗ {ticker}.{col} contains non-integer values: {df[col].dtype}")
                    all_integer = False

        if all_integer:
            print("✓ All data uses integer-only representation")

        return all_integer

    def cross_validate_with_tiingo(self,
                                   tiingo_dir: str = "/home/user/agentic-flow/quantum-trading-system/src/data/tiingo_raw",
                                   min_correlation: float = 0.99) -> Dict[str, Dict]:
        """
        Cross-validate Yahoo data with Tiingo data.

        Args:
            tiingo_dir: Directory containing Tiingo CSV files
            min_correlation: Minimum acceptable correlation coefficient

        Returns:
            Dictionary with validation results per ticker
        """
        print(f"\nCross-validating with Tiingo data...")
        print(f"Minimum correlation threshold: {min_correlation}")

        tiingo_path = Path(tiingo_dir)
        results = {}

        for ticker in self.tickers:
            if ticker not in self.data:
                results[ticker] = {
                    'status': 'missing_yahoo',
                    'correlation': None,
                    'pass': False
                }
                continue

            # Look for corresponding Tiingo file
            tiingo_file = tiingo_path / f"{ticker}_tiingo_int.csv"

            if not tiingo_file.exists():
                results[ticker] = {
                    'status': 'missing_tiingo',
                    'correlation': None,
                    'pass': False
                }
                continue

            try:
                # Load Tiingo data
                tiingo_df = pd.read_csv(tiingo_file, index_col=0, parse_dates=True)
                yahoo_df = self.data[ticker]

                # Align dates (inner join)
                merged = pd.merge(
                    yahoo_df[['Close']],
                    tiingo_df[['Close']],
                    left_index=True,
                    right_index=True,
                    how='inner',
                    suffixes=('_yahoo', '_tiingo')
                )

                if len(merged) < 10:
                    results[ticker] = {
                        'status': 'insufficient_overlap',
                        'correlation': None,
                        'pass': False,
                        'overlapping_days': len(merged)
                    }
                    continue

                # Calculate correlation
                corr = np.corrcoef(
                    merged['Close_yahoo'].values,
                    merged['Close_tiingo'].values
                )[0, 1]

                # Calculate mean absolute percentage difference (in basis points)
                # Since values are integers (×10000), difference is in units of 1/10000
                abs_diff = np.abs(merged['Close_yahoo'] - merged['Close_tiingo'])
                mean_abs_pct_diff = (abs_diff / merged['Close_tiingo']).mean()

                results[ticker] = {
                    'status': 'compared',
                    'correlation': float(corr),
                    'mean_abs_pct_diff': float(mean_abs_pct_diff),
                    'overlapping_days': len(merged),
                    'pass': corr >= min_correlation
                }

                status_symbol = "✓" if corr >= min_correlation else "✗"
                print(f"{status_symbol} {ticker}: corr={corr:.6f}, days={len(merged)}")

            except Exception as e:
                results[ticker] = {
                    'status': 'error',
                    'error': str(e),
                    'pass': False
                }
                print(f"✗ {ticker}: Error - {str(e)}")

        self.validation_results = results

        # Summary statistics
        passing = sum(1 for r in results.values() if r.get('pass', False))
        total_compared = sum(1 for r in results.values() if r.get('status') == 'compared')

        print(f"\nValidation Summary:")
        print(f"  Total tickers: {len(results)}")
        print(f"  Successfully compared: {total_compared}")
        print(f"  Passing (>={min_correlation}): {passing}/{total_compared}")
        print(f"  Pass rate: {passing/total_compared*100:.1f}%" if total_compared > 0 else "  Pass rate: N/A")

        return results

    def generate_validation_report(self,
                                   output_path: str = "/home/user/agentic-flow/quantum-trading-system/src/data/yahoo_validation_report.json") -> str:
        """
        Generate comprehensive validation report in JSON format.

        Args:
            output_path: Path to save the JSON report

        Returns:
            Path to the saved report
        """
        report = {
            'metadata': {
                'agent': 'Yahoo Finance Specialist',
                'zeckendorf_address': '100',
                'timestamp': datetime.now().isoformat(),
                'scale_factor': self.SCALE_FACTOR,
                'total_tickers': len(self.tickers),
                'fetched_tickers': len(self.data)
            },
            'data_summary': {
                'tickers_fetched': list(self.data.keys()),
                'tickers_failed': [t for t in self.tickers if t not in self.data],
                'total_days': {ticker: len(df) for ticker, df in self.data.items()},
                'date_range': {
                    ticker: {
                        'start': df.index.min().isoformat() if len(df) > 0 else None,
                        'end': df.index.max().isoformat() if len(df) > 0 else None
                    }
                    for ticker, df in self.data.items()
                }
            },
            'integer_validation': {
                'all_integer': self.validate_integer_only(),
                'scale_factor': self.SCALE_FACTOR
            },
            'cross_validation': self.validation_results,
            'statistics': {
                'total_compared': sum(1 for r in self.validation_results.values() if r.get('status') == 'compared'),
                'passing_correlation': sum(1 for r in self.validation_results.values() if r.get('pass', False)),
                'average_correlation': np.mean([r['correlation'] for r in self.validation_results.values()
                                               if r.get('correlation') is not None]),
                'min_correlation': min([r['correlation'] for r in self.validation_results.values()
                                       if r.get('correlation') is not None], default=None),
                'max_correlation': max([r['correlation'] for r in self.validation_results.values()
                                       if r.get('correlation') is not None], default=None)
            }
        }

        # Save report
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)

        print(f"\n✓ Validation report saved to: {output_path}")

        # Print summary
        print("\n" + "="*60)
        print("YAHOO FINANCE VALIDATION REPORT SUMMARY")
        print("="*60)
        print(f"Total tickers requested: {report['metadata']['total_tickers']}")
        print(f"Successfully fetched: {report['metadata']['fetched_tickers']}")
        print(f"Integer validation: {'PASS' if report['integer_validation']['all_integer'] else 'FAIL'}")
        print(f"Tickers compared with Tiingo: {report['statistics']['total_compared']}")
        print(f"Passing correlation (≥0.99): {report['statistics']['passing_correlation']}")
        print(f"Average correlation: {report['statistics']['average_correlation']:.6f}"
              if report['statistics']['average_correlation'] else "Average correlation: N/A")
        print("="*60)

        return str(output_path)

    def create_master_dataset(self,
                             output_path: str = "/home/user/agentic-flow/quantum-trading-system/src/data/yahoo_master_int.csv") -> str:
        """
        Create a master CSV file with all ticker data combined.

        Args:
            output_path: Path to save the master CSV

        Returns:
            Path to the saved file
        """
        if not self.data:
            raise ValueError("No data available. Run fetch_all_tickers() first.")

        # Combine all dataframes
        all_data = []
        for ticker, df in self.data.items():
            df_copy = df.copy()
            df_copy['Ticker'] = ticker
            all_data.append(df_copy)

        master_df = pd.concat(all_data, axis=0)

        # Save to CSV
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        master_df.to_csv(output_path)

        print(f"✓ Master dataset saved to: {output_path}")
        print(f"  Total rows: {len(master_df)}")
        print(f"  Columns: {', '.join(master_df.columns)}")

        return str(output_path)


def main():
    """
    Main execution function for Yahoo Finance data fetching and validation.
    """
    print("="*60)
    print("YAHOO FINANCE SPECIALIST - AGENT 3")
    print("Zeckendorf Address: 100")
    print("="*60)

    # Initialize fetcher
    fetcher = YahooDataFetcher()

    # Fetch all ticker data
    fetcher.fetch_all_tickers(start_date="2020-01-01")

    # Validate integer-only arithmetic
    fetcher.validate_integer_only()

    # Cross-validate with Tiingo (if available)
    fetcher.cross_validate_with_tiingo(min_correlation=0.99)

    # Generate validation report
    fetcher.generate_validation_report()

    # Create master dataset
    fetcher.create_master_dataset()

    print("\n✓ Yahoo Finance data acquisition and validation complete!")


if __name__ == "__main__":
    main()

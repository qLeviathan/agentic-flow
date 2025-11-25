"""
Encode 100 Tickers with Fibonacci Price Levels - Agent 5

Applies Fibonacci encoding to 100 tickers with:
- Price retracement levels (236, 382, 500, 618, 786)
- Extension targets (618, 1000, 1618, 2618)
- Support/resistance levels
- Log-space transformations
- OEIS A000045 validation

Outputs: Parquet files with encoded price data
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from encoders.fibonacci_encoder import FibonacciEncoder

# Try to import pandas/pyarrow, fallback to JSON if unavailable
try:
    import pandas as pd
    import pyarrow.parquet as pq
    PARQUET_AVAILABLE = True
except ImportError:
    PARQUET_AVAILABLE = False
    print("⚠️  Pandas/PyArrow not available, will output JSON instead")


# 100 tickers spanning major indices
TICKERS_100 = [
    # Top 50 S&P 500 by market cap
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'UNH', 'JNJ',
    'V', 'WMT', 'XOM', 'JPM', 'PG', 'MA', 'HD', 'CVX', 'MRK', 'ABBV',
    'PEP', 'COST', 'KO', 'AVGO', 'MCD', 'CSCO', 'TMO', 'ACN', 'LLY', 'DHR',
    'ADBE', 'NKE', 'NEE', 'TXN', 'CRM', 'ABT', 'VZ', 'CMCSA', 'PM', 'UPS',
    'ORCL', 'INTC', 'T', 'AMD', 'HON', 'COP', 'RTX', 'QCOM', 'LOW', 'INTU',

    # Additional 50 diversified across sectors
    'GS', 'BA', 'CAT', 'AXP', 'DE', 'MMM', 'IBM', 'GE', 'AMGN', 'NOW',
    'SPGI', 'BLK', 'SCHW', 'TGT', 'CVS', 'LMT', 'SYK', 'CI', 'MDLZ', 'PLD',
    'GILD', 'ADP', 'ISRG', 'BKNG', 'ADI', 'TJX', 'ZTS', 'CB', 'DUK', 'SO',
    'MO', 'BDX', 'MMC', 'REGN', 'EOG', 'CL', 'PNC', 'ITW', 'SHW', 'AON',
    'APD', 'CME', 'BSX', 'MCO', 'USB', 'F', 'GM', 'RIVN', 'LCID', 'NIO'
]


def generate_sample_price_data(ticker: str, seed: int) -> List[int]:
    """
    Generate sample price data for ticker.

    Args:
        ticker: Ticker symbol
        seed: Seed for reproducible generation

    Returns:
        List of 30 prices in cents
    """
    # Deterministic pseudo-random based on ticker hash
    hash_val = sum(ord(c) for c in ticker) + seed

    # Base price between $10 and $500
    base_price = (hash_val % 49000) + 1000  # 1000 to 50000 cents

    prices = [base_price]

    # Generate 29 more prices with ±5% variation
    for i in range(29):
        variation = ((hash_val * (i + 1)) % 1000) - 500  # -500 to +500 cents
        new_price = max(100, prices[-1] + variation)  # Min $1.00
        prices.append(new_price)

    return prices


def encode_all_tickers(encoder: FibonacciEncoder, tickers: List[str]) -> Dict:
    """
    Encode all 100 tickers with Fibonacci price levels.

    Args:
        encoder: FibonacciEncoder instance
        tickers: List of ticker symbols

    Returns:
        Dictionary with encoded data for all tickers
    """
    print(f"Encoding {len(tickers)} tickers...")
    print()

    # Generate sample price data
    ticker_data = {}
    for i, ticker in enumerate(tickers):
        prices = generate_sample_price_data(ticker, i)
        ticker_data[ticker] = prices

    # Encode all tickers
    encoded = encoder.encode_ticker_prices(ticker_data)

    print(f"✓ Encoded {len(encoded)} tickers")
    print()

    return encoded


def save_to_parquet(encoded_data: Dict, output_dir: Path):
    """
    Save encoded data to Parquet format.

    Args:
        encoded_data: Dictionary of encoded ticker data
        output_dir: Output directory path
    """
    if not PARQUET_AVAILABLE:
        print("⚠️  Parquet not available, skipping...")
        return

    output_dir.mkdir(parents=True, exist_ok=True)

    # Flatten data for DataFrame
    rows = []
    for ticker, data in encoded_data.items():
        row = {
            'ticker': ticker,
            'current_price': data['current_price'],
            'current_index': data['current_index'],
            'high': data['high'],
            'low': data['low'],
            'log_space': data['log_space'],
        }

        # Add retracement levels
        for level, price in data['retracements'].items():
            row[f'retracement_{level}'] = price

        # Add extensions
        for level, price in data['extensions'].items():
            row[f'extension_{level}'] = price

        # Add support/resistance (top 3)
        for i, support in enumerate(data['support_resistance']['support'][:3]):
            row[f'support_{i+1}'] = support
        for i, resistance in enumerate(data['support_resistance']['resistance'][:3]):
            row[f'resistance_{i+1}'] = resistance

        rows.append(row)

    # Create DataFrame
    df = pd.DataFrame(rows)

    # Save to Parquet
    output_file = output_dir / "fibonacci_encoded_100_tickers.parquet"
    df.to_parquet(output_file, compression='snappy', index=False)

    print(f"✓ Saved Parquet: {output_file}")
    print(f"  Rows: {len(df)}")
    print(f"  Columns: {len(df.columns)}")
    print()


def save_to_json(encoded_data: Dict, oeis_validation: Dict, output_dir: Path):
    """
    Save encoded data and validation to JSON.

    Args:
        encoded_data: Dictionary of encoded ticker data
        oeis_validation: OEIS validation report
        output_dir: Output directory path
    """
    output_dir.mkdir(parents=True, exist_ok=True)

    # Save encoded data
    encoded_file = output_dir / "fibonacci_encoded_100_tickers.json"
    with open(encoded_file, 'w') as f:
        json.dump(encoded_data, f, indent=2)

    print(f"✓ Saved JSON: {encoded_file}")
    print(f"  Tickers: {len(encoded_data)}")

    # Save OEIS validation
    validation_file = output_dir / "oeis_a000045_validation.json"
    with open(validation_file, 'w') as f:
        json.dump(oeis_validation, f, indent=2)

    print(f"✓ Saved OEIS validation: {validation_file}")
    print()


def print_summary_stats(encoded_data: Dict):
    """
    Print summary statistics of encoded data.

    Args:
        encoded_data: Dictionary of encoded ticker data
    """
    print("=" * 80)
    print("SUMMARY STATISTICS")
    print("=" * 80)

    # Price distribution
    prices = [data['current_price'] for data in encoded_data.values()]
    print(f"Current Prices (cents):")
    print(f"  Min: {min(prices)} (${min(prices)/100:.2f})")
    print(f"  Max: {max(prices)} (${max(prices)/100:.2f})")
    print(f"  Avg: {sum(prices)//len(prices)} (${sum(prices)/len(prices)/100:.2f})")
    print()

    # Fibonacci indices
    indices = [data['current_index'] for data in encoded_data.values()]
    print(f"Fibonacci Indices:")
    print(f"  Min: F({min(indices)})")
    print(f"  Max: F({max(indices)})")
    print(f"  Avg: F({sum(indices)//len(indices)})")
    print()

    # Sample ticker details
    sample_ticker = list(encoded_data.keys())[0]
    sample_data = encoded_data[sample_ticker]
    print(f"Sample Ticker: {sample_ticker}")
    print(f"  Current: ${sample_data['current_price']/100:.2f} (F({sample_data['current_index']}))")
    print(f"  Range: ${sample_data['low']/100:.2f} - ${sample_data['high']/100:.2f}")
    print(f"  Golden Pocket: ${sample_data['retracements']['golden_pocket_low']/100:.2f} - "
          f"${sample_data['retracements']['golden_pocket_high']/100:.2f}")
    print(f"  Target (1.618): ${sample_data['extensions']['ext_1618']/100:.2f}")
    print()


def main():
    """Main execution."""
    print("=" * 80)
    print("FIBONACCI ENCODER - 100 TICKERS")
    print("Agent 5 (Zeckendorf: 1000) - OEIS A000045")
    print("=" * 80)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print()

    # Initialize encoder
    print("[1/5] Initializing Fibonacci Encoder...")
    encoder = FibonacciEncoder(max_index=50)
    print("✓ Encoder initialized with F(0) to F(50)")
    print()

    # Validate OEIS
    print("[2/5] Validating OEIS A000045...")
    oeis_validation = encoder.export_oeis_validation()
    all_valid = all(oeis_validation['validation'].values())
    if all_valid:
        print("✓ OEIS A000045 VALIDATION PASS")
    else:
        print("✗ OEIS A000045 VALIDATION FAIL")
        return 1
    print()

    # Encode 100 tickers
    print("[3/5] Encoding 100 tickers...")
    encoded_data = encode_all_tickers(encoder, TICKERS_100)

    # Save outputs
    print("[4/5] Saving outputs...")
    output_dir = Path(__file__).parent.parent.parent / "team-outputs" / "fibonacci_encoded"

    if PARQUET_AVAILABLE:
        save_to_parquet(encoded_data, output_dir)

    save_to_json(encoded_data, oeis_validation, output_dir)

    # Summary
    print("[5/5] Summary Statistics...")
    print_summary_stats(encoded_data)

    print("=" * 80)
    print("✅ FIBONACCI ENCODING COMPLETE")
    print("=" * 80)
    print(f"Output Directory: {output_dir.absolute()}")
    print()

    return 0


if __name__ == "__main__":
    sys.exit(main())

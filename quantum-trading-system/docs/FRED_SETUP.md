# FRED Data Fetcher Setup Guide

## Overview

The FRED Data Fetcher downloads 266+ monthly economic indicators from the Federal Reserve Economic Data (FRED) API and converts them to integer format for use in the quantum trading system.

## Features

- ✅ **266+ Economic Indicators** from FRED
- ✅ **Integer-Only Format** with appropriate scaling (1000x or 10000x)
- ✅ **Monthly Frequency** for all indicators
- ✅ **Date Range**: January 2000 to Present
- ✅ **Comprehensive Documentation** for all indicators
- ✅ **Rate Limiting** and error handling
- ✅ **CSV Output** with metadata headers

## Prerequisites

### 1. Get FRED API Key

1. Go to https://fred.stlouisfed.org/docs/api/api_key.html
2. Create a free account
3. Request an API key (instant approval)

### 2. Install Dependencies

```bash
cd /home/user/agentic-flow/quantum-trading-system
pip install -r requirements.txt
```

### 3. Set Environment Variable

```bash
export FRED_API_KEY='your_api_key_here'
```

Or add to your `~/.bashrc` or `~/.zshrc`:

```bash
echo 'export FRED_API_KEY="your_api_key_here"' >> ~/.bashrc
source ~/.bashrc
```

## Usage

### Basic Usage

```bash
cd /home/user/agentic-flow/quantum-trading-system
python src/data/fred_fetcher.py
```

This will:
1. Fetch all 266+ indicators
2. Convert to integer format
3. Save CSV files to `src/data/fred_raw/`
4. Generate documentation to `docs/fred_indicators_documentation.md`

### Programmatic Usage

```python
from src.data.fred_fetcher import FREDDataFetcher

# Initialize fetcher
fetcher = FREDDataFetcher(
    api_key='your_key',
    output_dir='src/data/fred_raw'
)

# Fetch all indicators
fetcher.fetch_all_indicators(max_requests_per_minute=120)

# Generate documentation
doc = fetcher.generate_documentation()
```

### Fetch Individual Series

```python
from src.data.fred_fetcher import FREDDataFetcher

fetcher = FREDDataFetcher(api_key='your_key')

indicator = {
    'name': 'Unemployment Rate',
    'symbol': 'UNRATE',
    'importance': 10
}

# Fetch data
data, error = fetcher.fetch_series('UNRATE', indicator)

if not error:
    print(f"Fetched {len(data)} observations")
    for date, value in data[:5]:
        print(f"{date}: {value}")
```

## Data Format

### Integer Scaling

All data is converted to integers with appropriate scaling:

| Indicator Type | Scaling Factor | Precision | Example |
|---------------|----------------|-----------|---------|
| Rates, Percentages | 10000x | 4 decimals | 3.50% → 35000 |
| Price Indices | 10000x | 4 decimals | 250.5 → 2505000 |
| GDP, Large Values | 1000x | 3 decimals | 20000.5 → 20000500 |
| Employment Numbers | 1000x | 3 decimals | 150000.5 → 150000500 |

### CSV Format

Each CSV file includes:

```csv
# Unemployment Rate
# Symbol: UNRATE
# Category: employment_labor
# Importance: 10
# Description: Percentage of unemployed in labor force
# Scaling Factor: 10000x
# Format: Integer (multiply by scaling factor to get original)
# Date Range: 2000-01-01 to 2025-11-24

date,value_scaled
2000-01-01,40000
2000-02-01,41000
...
```

## Indicator Categories

### Main Categories (156 indicators)

1. **GDP and Growth** (15 indicators)
   - Real GDP, GDP Growth Rate, Per Capita GDP, etc.

2. **Employment and Labor** (20 indicators)
   - Nonfarm Payrolls, Unemployment Rate, Jobless Claims, etc.

3. **Inflation and Prices** (20 indicators)
   - CPI, Core CPI, PPI, PCE, etc.

4. **Interest Rates and Monetary Policy** (15 indicators)
   - Fed Funds Rate, Treasury Yields, M2 Money Supply, etc.

5. **Consumer Sentiment and Spending** (15 indicators)
   - Consumer Confidence, Retail Sales, Personal Income, etc.

6. **Manufacturing and Industrial** (15 indicators)
   - ISM PMI, Industrial Production, Durable Goods Orders, etc.

7. **Housing Market** (15 indicators)
   - Housing Starts, Home Sales, Case-Shiller Index, etc.

8. **Trade Balance** (15 indicators)
   - Trade Balance, Exports, Imports, Dollar Index, etc.

9. **Corporate Earnings** (15 indicators)
   - S&P 500 Earnings, P/E Ratios, Corporate Profits, etc.

### Sector Indices (110 indicators)

10 sectors with 10 indicators each:
- Technology (XLK)
- Healthcare (XLV)
- Financials (XLF)
- Energy (XLE)
- Consumer Discretionary (XLY)
- Consumer Staples (XLP)
- Industrials (XLI)
- Materials (XLB)
- Real Estate (XLRE)
- Utilities (XLU)
- Communications (XLC)

### Cross-Sector Indicators (16 indicators)

Market-wide indicators:
- VIX, S&P 500, Russell 2000, NASDAQ
- Credit Spreads, Market Breadth
- Shiller CAPE, Buffett Indicator

## Output Structure

```
quantum-trading-system/
├── src/
│   └── data/
│       ├── fred_raw/
│       │   ├── UNRATE.csv
│       │   ├── GDPC1.csv
│       │   ├── CPIAUCSL.csv
│       │   └── ... (266+ files)
│       ├── __init__.py
│       └── fred_fetcher.py
├── tests/
│   └── test_fred_fetcher.py
├── docs/
│   ├── FRED_SETUP.md
│   └── fred_indicators_documentation.md
└── requirements.txt
```

## Testing

### Run All Tests

```bash
cd /home/user/agentic-flow/quantum-trading-system
python -m pytest tests/test_fred_fetcher.py -v
```

### Run Specific Test Class

```bash
python -m pytest tests/test_fred_fetcher.py::TestFREDDataFetcher -v
```

### Run with Coverage

```bash
python -m pytest tests/test_fred_fetcher.py --cov=src/data --cov-report=html
```

## Rate Limits

FRED API allows:
- **120 requests per minute** (default setting)
- Unlimited total requests per day

The fetcher automatically:
- Enforces rate limiting
- Adds delays between requests
- Handles API errors gracefully

## Troubleshooting

### API Key Not Found

```
ERROR: FRED_API_KEY environment variable not set
```

**Solution:** Set the environment variable:
```bash
export FRED_API_KEY='your_key_here'
```

### No Data Returned

Some indicators may not have monthly data available. The fetcher will:
- Log warnings for missing data
- Continue processing other indicators
- Generate summary report at the end

### Request Timeout

If requests timeout:
1. Check internet connection
2. Reduce `max_requests_per_minute` parameter
3. Try again later (FRED API may be down)

### Import Error

```
ImportError: No module named 'requests'
```

**Solution:** Install dependencies:
```bash
pip install -r requirements.txt
```

## Performance

- **Fetch Time**: ~2-3 minutes for 266 indicators (at 120 req/min)
- **Output Size**: ~10-50 KB per CSV file
- **Total Size**: ~5-10 MB for all indicators
- **Memory Usage**: < 100 MB during fetch

## Integration with Trading System

### Load Data

```python
import csv
from pathlib import Path

def load_fred_indicator(symbol: str, scale: int = 10000):
    """Load FRED indicator from CSV."""
    csv_path = Path(f"src/data/fred_raw/{symbol}.csv")

    data = []
    with open(csv_path, 'r') as f:
        reader = csv.reader(f)
        for row in reader:
            # Skip comments and headers
            if not row or row[0].startswith('#') or row[0] == 'date':
                continue

            date, value_str = row
            # Convert back to float
            value = int(value_str) / scale
            data.append((date, value))

    return data

# Example: Load unemployment rate
unemployment = load_fred_indicator('UNRATE', scale=10000)
print(f"Latest unemployment: {unemployment[-1]}")
```

### Data Pipeline

The FRED data integrates with the quantum trading system:

1. **Fetch** → Monthly economic indicators (this module)
2. **Transform** → Integer format for quantum processing
3. **Analyze** → Feed into trading algorithms
4. **Backtest** → Historical performance evaluation
5. **Trade** → Real-time decision making

## Success Criteria

- ✅ 266+ indicators fetched successfully
- ✅ Monthly frequency maintained
- ✅ Integer-only values (no floating point)
- ✅ All tests pass
- ✅ Complete documentation generated
- ✅ Date range: 2000-01-01 to present

## Support

For issues or questions:

1. Check FRED API status: https://fred.stlouisfed.org/
2. Review error logs in console output
3. Check failed indicators list in summary report
4. Verify API key is valid and not expired

## References

- FRED API Documentation: https://fred.stlouisfed.org/docs/api/
- Economic Indicators: https://fred.stlouisfed.org/tags/series
- API Key Management: https://fred.stlouisfed.org/docs/api/api_key.html

---

**Author:** Agent 2 - FRED API Specialist
**Date:** 2025-11-24
**Version:** 1.0.0

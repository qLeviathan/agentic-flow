# FRED Data Fetcher - Quick Start Guide

## Get Started in 3 Steps

### 1. Get Your Free FRED API Key

Visit: https://fred.stlouisfed.org/docs/api/api_key.html

- Create free account
- Request API key (instant approval)
- Copy your key

### 2. Set Your API Key

```bash
export FRED_API_KEY='your_api_key_here'
```

### 3. Run the Fetcher

```bash
cd /home/user/agentic-flow/quantum-trading-system
python src/data/fred_fetcher.py
```

That's it! The fetcher will download 178 economic indicators.

---

## What You Get

- **178 FRED Economic Indicators**
- **Monthly Frequency** (2000-01-01 to present)
- **Integer-Only Format** (1000x or 10000x scaling)
- **CSV Files** with metadata headers
- **Comprehensive Documentation**

## Output Location

```
src/data/fred_raw/
├── UNRATE.csv          # Unemployment Rate
├── GDPC1.csv           # Real GDP
├── CPIAUCSL.csv        # Consumer Price Index
└── ... (175 more)
```

## Example: Load Data

```python
import csv

def load_fred_data(symbol, scale=10000):
    """Load FRED indicator from CSV."""
    with open(f'src/data/fred_raw/{symbol}.csv', 'r') as f:
        reader = csv.reader(f)
        data = []
        for row in reader:
            if not row or row[0].startswith('#') or row[0] == 'date':
                continue
            date, value_str = row
            # Convert back to original value
            value = int(value_str) / scale
            data.append((date, value))
    return data

# Load unemployment rate (10000x scaling)
unemployment = load_fred_data('UNRATE', scale=10000)
print(f"Latest: {unemployment[-1]}")

# Load GDP (1000x scaling)
gdp = load_fred_data('GDPC1', scale=1000)
print(f"Latest GDP: {gdp[-1]}")
```

## Indicator Categories

1. **GDP & Growth** - Real GDP, GDP growth, productivity
2. **Employment** - Unemployment, payrolls, jobless claims
3. **Inflation** - CPI, PPI, PCE price indices
4. **Interest Rates** - Fed funds, Treasury yields
5. **Consumer** - Sentiment, retail sales, income
6. **Manufacturing** - ISM PMI, industrial production
7. **Housing** - Starts, sales, prices
8. **Trade** - Balance, exports, imports
9. **Sectors** - Technology, healthcare, energy, etc.

## Documentation

- **Setup Guide:** `docs/FRED_SETUP.md`
- **All Indicators:** `docs/fred_indicators_documentation.md`
- **Implementation:** `docs/FRED_IMPLEMENTATION_SUMMARY.md`

## Tests

```bash
# Run all tests
python -m pytest tests/test_fred_fetcher.py -v

# Result: 19/19 PASSING ✅
```

## Performance

- **Fetch Time:** ~2 minutes for 178 indicators
- **Total Size:** ~1-2 MB
- **Rate Limit:** 120 requests/min (automatic)

## Support

- FRED API Docs: https://fred.stlouisfed.org/docs/api/
- Get API Key: https://fred.stlouisfed.org/docs/api/api_key.html

---

**Status:** ✅ Production Ready
**Tests:** ✅ 19/19 Passing
**Documentation:** ✅ Complete

Ready to fetch real economic data for your quantum trading system!

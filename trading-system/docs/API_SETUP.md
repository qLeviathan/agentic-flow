# Tiingo API Integration Setup Guide

Complete guide for setting up and using the Tiingo API integration module for market data, economic indicators, and sector ETF analysis.

## Table of Contents

1. [Getting Started](#getting-started)
2. [API Key Setup](#api-key-setup)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage Examples](#usage-examples)
6. [Rate Limiting](#rate-limiting)
7. [Caching Strategy](#caching-strategy)
8. [AgentDB Integration](#agentdb-integration)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

The Tiingo API integration module provides comprehensive access to:

- **Daily market data** for 10,000+ publicly traded stocks
- **Economic indicators** at daily frequency (requires paid tier)
- **Sector ETF data** for 11 major sector ETFs
- **Historical data** with intelligent caching and rate limiting

### Prerequisites

- Python 3.8 or higher
- Node.js 14+ (for AgentDB integration)
- Active internet connection
- Tiingo API account (free tier available)

---

## API Key Setup

### Step 1: Create Tiingo Account

1. Visit [https://api.tiingo.com](https://api.tiingo.com)
2. Click **"Sign Up"** in the top right corner
3. Choose **"Free Trial"** option (no credit card required)
4. Fill in your details:
   - Email address
   - Password
   - Name
   - Agree to Terms of Service
5. Click **"Create Account"**

### Step 2: Verify Email

1. Check your email inbox for verification email from Tiingo
2. Click the verification link
3. Log in to your Tiingo account

### Step 3: Get API Token

1. After logging in, navigate to **"Account"** > **"API"**
2. Your API token will be displayed under **"API Token"**
3. Click **"Copy"** to copy your token to clipboard
4. **IMPORTANT**: Keep this token secret - never commit it to version control

### Step 4: Set Environment Variable

#### Linux/macOS (Bash/Zsh)

```bash
# Add to ~/.bashrc or ~/.zshrc
export TIINGO_API_TOKEN="your_api_token_here"

# Apply changes
source ~/.bashrc  # or source ~/.zshrc
```

#### Permanent Setup

Create a `.env` file in your trading system directory:

```bash
cd /home/user/agentic-flow/trading-system
cat > .env << 'EOF'
TIINGO_API_TOKEN=your_api_token_here
EOF

# Secure the file
chmod 600 .env
```

**Add to .gitignore:**

```bash
echo ".env" >> .gitignore
```

### Free Tier Limits

- **500 requests per hour**
- **50 requests per minute**
- Access to daily stock prices
- Limited economic indicators
- No real-time data

### Paid Tier Benefits

For production use, consider upgrading:

- **50,000+ requests per hour**
- Real-time data feeds
- Full economic indicators
- Intraday data
- Premium support

Visit [Tiingo Pricing](https://api.tiingo.com/pricing) for details.

---

## Installation

### 1. Install Python Dependencies

```bash
cd /home/user/agentic-flow/trading-system

# Install required packages
pip install -r requirements.txt
```

**requirements.txt contents:**

```text
requests>=2.31.0
pandas>=2.0.0
numpy>=1.24.0
python-dotenv>=1.0.0
```

### 2. Install AgentDB (Optional but Recommended)

```bash
# Install AgentDB globally
npm install -g agentdb@latest

# Verify installation
npx agentdb --version
```

### 3. Create Directory Structure

```bash
cd /home/user/agentic-flow/trading-system

# Create all necessary directories
mkdir -p {src,docs,config,data/cache,data/exports,logs}

# Verify structure
tree -L 2
```

Expected structure:

```
trading-system/
├── src/
│   └── api_integration.py
├── docs/
│   └── API_SETUP.md
├── config/
├── data/
│   ├── cache/
│   └── exports/
├── logs/
└── requirements.txt
```

---

## Configuration

### Basic Configuration

The module uses sensible defaults, but you can customize:

```python
from api_integration import TiingoAPIClient, RateLimitConfig, CacheConfig

# Custom rate limiting
rate_config = RateLimitConfig(
    max_requests_per_hour=500,    # Free tier limit
    max_requests_per_minute=50     # Free tier limit
)

# Custom caching
cache_config = CacheConfig(
    cache_dir='/home/user/agentic-flow/trading-system/data/cache',
    ttl_seconds=86400,  # 24 hours
    use_agentdb=True    # Enable AgentDB integration
)

# Initialize client
client = TiingoAPIClient(
    api_token='your_token_here',  # Or use environment variable
    rate_limit_config=rate_config,
    cache_config=cache_config
)
```

### Environment Variables

Create `/home/user/agentic-flow/trading-system/config/config.py`:

```python
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Configuration
TIINGO_API_TOKEN = os.getenv('TIINGO_API_TOKEN')

# Rate Limiting
MAX_REQUESTS_PER_HOUR = int(os.getenv('MAX_REQUESTS_PER_HOUR', '500'))
MAX_REQUESTS_PER_MINUTE = int(os.getenv('MAX_REQUESTS_PER_MINUTE', '50'))

# Caching
CACHE_DIR = os.getenv('CACHE_DIR', '/home/user/agentic-flow/trading-system/data/cache')
CACHE_TTL_SECONDS = int(os.getenv('CACHE_TTL_SECONDS', '86400'))
USE_AGENTDB = os.getenv('USE_AGENTDB', 'true').lower() == 'true'

# Export
EXPORT_DIR = os.getenv('EXPORT_DIR', '/home/user/agentic-flow/trading-system/data/exports')
```

---

## Usage Examples

### Example 1: Fetch Single Ticker

```python
from api_integration import TiingoAPIClient
from datetime import datetime, timedelta

# Initialize client
client = TiingoAPIClient()

# Get last 30 days of AAPL data
end_date = datetime.now().strftime('%Y-%m-%d')
start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

df = client.get_daily_prices('AAPL', start_date, end_date)

print(f"Shape: {df.shape}")
print(df.head())
print(f"\nColumns: {df.columns.tolist()}")
```

**Output:**

```
                  open    high     low   close    volume   adjClose  ...
date                                                                  ...
2024-10-23   225.50  227.80  224.30  226.50  45678900  226.50      ...
2024-10-24   226.80  228.50  226.00  227.90  42345600  227.90      ...
...
```

### Example 2: Fetch All Sector ETFs

```python
from api_integration import TiingoAPIClient

client = TiingoAPIClient()

# Get 90 days of sector ETF data
sector_data = client.get_sector_etf_data(
    start_date='2024-08-01',
    end_date='2024-10-31'
)

# Display summary
for ticker, df in sector_data.items():
    if not df.empty:
        print(f"{ticker}: {len(df)} days, Latest close: ${df.iloc[-1]['close']:.2f}")
```

**Output:**

```
SPY: 64 days, Latest close: $578.45
XLK: 64 days, Latest close: $215.30
XLV: 64 days, Latest close: $158.75
...
```

### Example 3: Batch Download with Error Handling

```python
from api_integration import TiingoAPIClient
import pandas as pd

client = TiingoAPIClient()

# List of tickers to download
tickers = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
    'META', 'NVDA', 'JPM', 'V', 'WMT'
]

# Batch download with retry logic
results = client.batch_download_tickers(
    tickers,
    start_date='2024-01-01',
    end_date='2024-12-31',
    max_retries=3,
    retry_delay=5
)

# Separate successful and failed downloads
successful = {}
failed = {}

for ticker, result in results.items():
    if isinstance(result, pd.DataFrame):
        successful[ticker] = result
        print(f"✓ {ticker}: {len(result)} rows")
    else:
        failed[ticker] = result
        print(f"✗ {ticker}: {result}")

print(f"\nSuccess: {len(successful)}/{len(tickers)}")

# Export successful downloads
if successful:
    csv_files = client.export_to_csv(successful, prefix='batch_stocks')
    json_files = client.export_to_json(successful, prefix='batch_stocks')
    print(f"\nExported {len(csv_files)} CSV files")
    print(f"Exported {len(json_files)} JSON files")
```

### Example 4: Export Data

```python
from api_integration import TiingoAPIClient

client = TiingoAPIClient()

# Fetch data
df = client.get_daily_prices('AAPL', start_date='2024-01-01')

# Export to CSV
csv_files = client.export_to_csv(
    df,
    output_dir='/home/user/agentic-flow/trading-system/data/exports',
    prefix='aapl_daily'
)
print(f"CSV exported to: {csv_files[0]}")

# Export to JSON
json_files = client.export_to_json(
    df,
    output_dir='/home/user/agentic-flow/trading-system/data/exports',
    prefix='aapl_daily'
)
print(f"JSON exported to: {json_files[0]}")
```

### Example 5: Cache Management

```python
from api_integration import TiingoAPIClient

client = TiingoAPIClient()

# Get cache statistics
stats = client.get_cache_stats()
print(f"Cache files: {stats['total_files']}")
print(f"Cache size: {stats['total_size_mb']:.2f} MB")
print(f"Cache directory: {stats['cache_dir']}")

# Clear cache if needed
client.clear_cache()
print("Cache cleared!")
```

### Example 6: Working with Ticker Metadata

```python
from api_integration import TiingoAPIClient

client = TiingoAPIClient()

# Get ticker metadata
metadata = client.get_ticker_metadata('AAPL')

print(f"Ticker: {metadata['ticker']}")
print(f"Name: {metadata['name']}")
print(f"Exchange: {metadata['exchangeCode']}")
print(f"Start Date: {metadata['startDate']}")
print(f"End Date: {metadata['endDate']}")
```

---

## Rate Limiting

### How It Works

The module implements a **Token Bucket algorithm** with two tiers:

1. **Hourly Limit**: 500 requests/hour (free tier)
2. **Minute Limit**: 50 requests/minute (free tier)

### Token Bucket Algorithm

```python
# Each request consumes 1 token
# Tokens regenerate at a fixed rate:
# - Hourly: 500 tokens / 3600 seconds = 0.139 tokens/second
# - Minute: 50 tokens / 60 seconds = 0.833 tokens/second

# When tokens are depleted, requests automatically wait
```

### Automatic Wait Handling

```python
from api_integration import TiingoAPIClient

client = TiingoAPIClient()

# The client automatically waits if rate limit is reached
# No manual intervention needed!

for i in range(100):
    df = client.get_daily_prices(f'STOCK{i}')
    # If rate limit is reached, the client will wait automatically
    # You'll see: "Rate limit reached. Waiting X seconds..."
```

### Manual Rate Limit Handling

```python
from api_integration import TiingoAPIClient, RateLimitExceeded
import time

client = TiingoAPIClient()

try:
    # Make many requests
    for ticker in many_tickers:
        df = client.get_daily_prices(ticker)

except RateLimitExceeded as e:
    print(f"Rate limit exceeded: {e}")
    print("Waiting 60 seconds...")
    time.sleep(60)
```

### Best Practices

1. **Use caching** - Reduces API calls significantly
2. **Batch requests** - Process multiple tickers in one session
3. **Add delays** - Insert small delays (0.1-0.2s) between requests
4. **Monitor usage** - Check logs for rate limit warnings
5. **Upgrade if needed** - Consider paid tier for production

---

## Caching Strategy

### Two-Tier Caching System

#### 1. AgentDB Cache (Primary)

- **Fast** - In-memory storage with disk persistence
- **Intelligent** - Stores successful patterns
- **Shared** - Available across all agents
- **TTL Support** - Automatic expiration

#### 2. File Cache (Fallback)

- **Reliable** - Local JSON files
- **Portable** - Easy to backup/restore
- **Simple** - No dependencies

### How Caching Works

```python
# 1. Request comes in
client.get_daily_prices('AAPL', start_date='2024-01-01')

# 2. Generate cache key
cache_key = md5("endpoint:params") = "a1b2c3d4..."

# 3. Check AgentDB cache
npx agentdb reflexion retrieve --key "tiingo:a1b2c3d4"

# 4. If not found, check file cache
/data/cache/a1b2c3d4.json

# 5. If not found, make API request
response = requests.get(...)

# 6. Store in both caches
npx agentdb reflexion store --key "tiingo:a1b2c3d4" --value "{data}"
echo "{data}" > /data/cache/a1b2c3d4.json
```

### Cache TTL (Time To Live)

Default: **24 hours** (86400 seconds)

```python
# Customize TTL
cache_config = CacheConfig(
    ttl_seconds=3600  # 1 hour
)

client = TiingoAPIClient(cache_config=cache_config)
```

### Cache Key Generation

Cache keys are generated from:
- API endpoint
- Request parameters
- Sorted to ensure consistency

```python
# Example cache key generation
endpoint = "/tiingo/daily/AAPL/prices"
params = {"startDate": "2024-01-01", "endDate": "2024-12-31"}
cache_string = f"{endpoint}:{json.dumps(params, sort_keys=True)}"
cache_key = hashlib.md5(cache_string.encode()).hexdigest()
# Result: "7d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a"
```

### Bypass Cache

```python
# Force fresh data (bypass cache)
data = client._make_request(endpoint, params, use_cache=False)
```

---

## AgentDB Integration

### Features

The module integrates with AgentDB for:

1. **Reflexion Memory** - Cache API responses
2. **Skill Storage** - Store successful fetch patterns
3. **Causal Graphs** - Track ticker correlations

### Setup AgentDB

```bash
# Install AgentDB
npm install -g agentdb@latest

# Initialize AgentDB
npx agentdb init

# Verify installation
npx agentdb --version
```

### Reflexion Memory Pattern

```bash
# Store API response
npx agentdb reflexion store \
  --key "tiingo:AAPL_prices" \
  --value '{"data": [...], "timestamp": 1234567890}'

# Retrieve from memory
npx agentdb reflexion retrieve \
  --key "tiingo:AAPL_prices"

# List all stored keys
npx agentdb reflexion list-keys
```

### Skill Pattern Storage

```bash
# Successful fetch pattern is automatically stored
# View stored skills
npx agentdb skill list

# Example output:
# - tiingo_fetch_daily_AAPL
# - tiingo_fetch_sector_etfs
# - tiingo_batch_download
```

### Causal Graph for Correlations

```bash
# Track ticker relationships
npx agentdb causal add-edge \
  --from "AAPL" \
  --to "market_data" \
  --weight "1.0"

# Add correlation
npx agentdb causal add-edge \
  --from "AAPL" \
  --to "MSFT" \
  --weight "0.85"  # Correlation coefficient

# View graph
npx agentdb causal visualize
```

### Disable AgentDB

```python
# Use file cache only
cache_config = CacheConfig(
    use_agentdb=False
)

client = TiingoAPIClient(cache_config=cache_config)
```

---

## Error Handling

### Exception Hierarchy

```
Exception
└── TiingoAPIError (base exception)
    └── RateLimitExceeded (rate limit errors)
```

### Common Errors

#### 1. Invalid API Token

```python
from api_integration import TiingoAPIError

try:
    client = TiingoAPIClient(api_token='invalid_token')
    df = client.get_daily_prices('AAPL')
except TiingoAPIError as e:
    print(f"Error: {e}")
    # Output: "Invalid API token"
```

**Solution:**
- Check `TIINGO_API_TOKEN` environment variable
- Verify token on Tiingo website
- Regenerate token if necessary

#### 2. Rate Limit Exceeded

```python
from api_integration import RateLimitExceeded

try:
    # Make too many requests
    for i in range(1000):
        df = client.get_daily_prices(f'STOCK{i}')
except RateLimitExceeded as e:
    print(f"Rate limit exceeded: {e}")
    # Wait and retry
    time.sleep(60)
```

**Solution:**
- Use caching to reduce API calls
- Add delays between requests
- Upgrade to paid tier

#### 3. Ticker Not Found

```python
try:
    df = client.get_daily_prices('INVALID_TICKER')
except TiingoAPIError as e:
    print(f"Error: {e}")
    # Output: "Endpoint not found: /tiingo/daily/INVALID_TICKER"
```

**Solution:**
- Verify ticker symbol is correct
- Check if ticker is supported by Tiingo
- Use metadata endpoint to validate

#### 4. Network Timeout

```python
try:
    df = client.get_daily_prices('AAPL')
except TiingoAPIError as e:
    print(f"Error: {e}")
    # Output: "Request timeout"
```

**Solution:**
- Check internet connection
- Retry with exponential backoff
- Increase timeout in requests

### Retry Logic

The module includes automatic retry logic:

```python
# Batch download with retry
results = client.batch_download_tickers(
    tickers=['AAPL', 'MSFT', 'GOOGL'],
    max_retries=3,        # Retry up to 3 times
    retry_delay=5          # Wait 5 seconds between retries
)
```

### Logging

All errors and operations are logged:

```python
import logging

# View logs
tail -f /home/user/agentic-flow/trading-system/logs/api_integration.log
```

**Log levels:**
- `INFO` - Normal operations
- `WARNING` - Rate limit warnings, cache misses
- `ERROR` - Failed requests, exceptions
- `DEBUG` - Detailed debugging info

---

## Best Practices

### 1. Use Environment Variables

```bash
# Never hardcode API tokens
# ❌ Bad
client = TiingoAPIClient(api_token='abc123xyz')

# ✓ Good
export TIINGO_API_TOKEN='abc123xyz'
client = TiingoAPIClient()
```

### 2. Enable Caching

```python
# Cache reduces API calls by 80-90%
# Always use caching for production
cache_config = CacheConfig(
    use_agentdb=True,
    ttl_seconds=86400  # 24 hours
)
```

### 3. Batch Operations

```python
# ❌ Bad - Sequential requests
for ticker in tickers:
    df = client.get_daily_prices(ticker)

# ✓ Good - Batch download with retry
results = client.batch_download_tickers(tickers)
```

### 4. Handle Errors Gracefully

```python
# Always use try-except
try:
    df = client.get_daily_prices('AAPL')
except TiingoAPIError as e:
    logger.error(f"Failed to fetch AAPL: {e}")
    # Use cached data or skip
```

### 5. Monitor Rate Limits

```python
# Check logs regularly
tail -f logs/api_integration.log | grep "Rate limit"

# Use cache stats
stats = client.get_cache_stats()
print(f"Cache hit rate: {stats['hit_rate']:.1%}")
```

### 6. Export Data Regularly

```python
# Export to multiple formats for redundancy
client.export_to_csv(data, prefix='daily_backup')
client.export_to_json(data, prefix='daily_backup')
```

### 7. Clean Up Cache

```python
# Clear old cache periodically (e.g., weekly)
import schedule

def cleanup_cache():
    client.clear_cache()
    logger.info("Cache cleared")

schedule.every().sunday.at("00:00").do(cleanup_cache)
```

---

## Troubleshooting

### Issue 1: "TIINGO_API_TOKEN not set"

**Error:**
```
ValueError: Tiingo API token required. Set TIINGO_API_TOKEN environment variable
```

**Solution:**
```bash
# Check if variable is set
echo $TIINGO_API_TOKEN

# If not set, add to ~/.bashrc
export TIINGO_API_TOKEN="your_token_here"
source ~/.bashrc

# Verify
python3 -c "import os; print(os.getenv('TIINGO_API_TOKEN'))"
```

### Issue 2: AgentDB Commands Failing

**Error:**
```
Command 'npx' not found
```

**Solution:**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install AgentDB
npm install -g agentdb@latest

# Verify
npx agentdb --version
```

### Issue 3: Permission Denied on Cache Directory

**Error:**
```
PermissionError: [Errno 13] Permission denied: '/data/cache'
```

**Solution:**
```bash
# Create directory with proper permissions
mkdir -p /home/user/agentic-flow/trading-system/data/cache
chmod 755 /home/user/agentic-flow/trading-system/data/cache

# Or use user's home directory
export CACHE_DIR="$HOME/trading-system/data/cache"
```

### Issue 4: Import Errors

**Error:**
```
ModuleNotFoundError: No module named 'requests'
```

**Solution:**
```bash
# Install dependencies
cd /home/user/agentic-flow/trading-system
pip install -r requirements.txt

# Verify
python3 -c "import requests, pandas; print('OK')"
```

### Issue 5: Rate Limit Errors Despite Caching

**Problem:** Still hitting rate limits even with cache enabled

**Solution:**
```python
# Check cache configuration
stats = client.get_cache_stats()
print(stats)

# Verify cache is being used
import logging
logging.basicConfig(level=logging.DEBUG)

# Look for "Cache hit" messages in logs
# If no cache hits, check:
# 1. Cache directory writable?
# 2. AgentDB installed?
# 3. TTL not too short?
```

### Issue 6: Stale Data

**Problem:** Getting old data from cache

**Solution:**
```python
# Option 1: Clear cache
client.clear_cache()

# Option 2: Reduce TTL
cache_config = CacheConfig(ttl_seconds=3600)  # 1 hour

# Option 3: Bypass cache for specific request
data = client._make_request(endpoint, params, use_cache=False)
```

---

## Advanced Usage

### Custom Rate Limiting

```python
# For paid tier (50,000 requests/hour)
rate_config = RateLimitConfig(
    max_requests_per_hour=50000,
    max_requests_per_minute=500
)

client = TiingoAPIClient(rate_limit_config=rate_config)
```

### Parallel Downloads

```python
from concurrent.futures import ThreadPoolExecutor

def download_ticker(ticker):
    return client.get_daily_prices(ticker)

# Download 10 tickers in parallel
with ThreadPoolExecutor(max_workers=5) as executor:
    futures = [executor.submit(download_ticker, t) for t in tickers]
    results = [f.result() for f in futures]
```

### Custom Export Formats

```python
import pickle

# Export to pickle
with open('data.pkl', 'wb') as f:
    pickle.dump(sector_data, f)

# Export to Parquet
for ticker, df in sector_data.items():
    df.to_parquet(f'data/{ticker}.parquet')
```

---

## API Reference

### Main Classes

- `TiingoAPIClient` - Main API client
- `RateLimitConfig` - Rate limiting configuration
- `CacheConfig` - Cache configuration
- `TokenBucket` - Rate limiting algorithm

### Main Methods

- `get_daily_prices(ticker, start_date, end_date)` - Fetch daily prices
- `get_sector_etf_data(start_date, end_date)` - Fetch all sector ETFs
- `batch_download_tickers(tickers, ...)` - Batch download with retry
- `export_to_csv(data, ...)` - Export to CSV
- `export_to_json(data, ...)` - Export to JSON
- `clear_cache()` - Clear cache
- `get_cache_stats()` - Get cache statistics

---

## Support and Resources

### Documentation

- **Tiingo API Docs**: https://api.tiingo.com/documentation
- **AgentDB Docs**: https://github.com/ruvnet/agentdb
- **Pandas Docs**: https://pandas.pydata.org/docs/

### Community

- **GitHub Issues**: https://github.com/ruvnet/agentic-flow/issues
- **Tiingo Support**: support@tiingo.com

### Upgrade Path

Ready for production? Consider:

1. **Tiingo Paid Tier** - More requests, real-time data
2. **Dedicated Server** - Better performance
3. **Database Integration** - PostgreSQL/TimescaleDB for storage
4. **Monitoring** - Grafana dashboards
5. **Alerting** - Real-time notifications

---

## License

MIT License - See LICENSE file for details

---

**Last Updated**: November 2024
**Version**: 1.0.0
**Maintainer**: Trading System Development Team

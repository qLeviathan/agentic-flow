# Trading System Test Suite

Comprehensive test suite for Fibonacci/Lucas-based algorithmic trading system with AgentDB integration.

## Quick Start

```bash
# Install dependencies
pip install -r requirements-test.txt

# Run all tests
pytest

# Run specific test category
pytest tests/unit                    # Unit tests only
pytest tests/integration             # Integration tests only
pytest tests/e2e                     # End-to-end tests only

# Run with coverage
pytest --cov=src --cov-report=html

# View coverage report
open htmlcov/index.html
```

## Test Structure

```
trading-system/
├── tests/
│   ├── unit/                           # Unit tests
│   │   └── test_mathematical_framework.py
│   ├── integration/                    # Integration tests
│   │   ├── test_api_integration.py
│   │   ├── test_strategy.py
│   │   ├── test_backtesting.py
│   │   └── test_agentdb.py
│   ├── e2e/                           # End-to-end tests
│   │   └── test_end_to_end.py
│   ├── fixtures/                      # Test fixtures
│   │   ├── market_data.py
│   │   └── mock_api.py
│   └── conftest.py                    # Pytest configuration
├── pytest.ini                         # Pytest settings
├── requirements-test.txt              # Test dependencies
└── docs/
    └── TEST_RESULTS.md               # Test documentation
```

## Test Categories

### 1. Mathematical Framework Tests (Unit)

Tests for core mathematical components validated against OEIS standards.

**File:** `tests/unit/test_mathematical_framework.py`

**Coverage:**
- Fibonacci sequence (OEIS A000045)
- Lucas sequence (OEIS A000032)
- Zeckendorf decomposition (OEIS A003714)
- Log-space transformations
- Integer-only constraints

**Run:**
```bash
pytest tests/unit/test_mathematical_framework.py -v
```

**Example:**
```python
def test_fibonacci_against_oeis():
    """Validate Fibonacci sequence against OEIS A000045"""
    fib = fibonacci_sequence(26)
    assert fib == OEIS_A000045  # [0, 1, 1, 2, 3, 5, 8, ...]
```

### 2. API Integration Tests (Integration)

Tests for Tiingo API integration, rate limiting, and caching.

**File:** `tests/integration/test_api_integration.py`

**Coverage:**
- Authentication
- Data fetching (stocks, ETFs, economic indicators)
- Rate limiting (500 req/hr)
- Error handling
- Cache performance

**Environment Variables:**
```bash
export TIINGO_API_KEY="your_api_key_here"
```

**Run:**
```bash
pytest tests/integration/test_api_integration.py -v
```

### 3. Trading Strategy Tests (Integration)

Tests for Fibonacci/Lucas trading strategy implementation.

**File:** `tests/integration/test_strategy.py`

**Coverage:**
- Fibonacci entry/exit signals
- Lucas time-based exits
- Risk management
- Position sizing
- Stop-loss/take-profit

**Run:**
```bash
pytest tests/integration/test_strategy.py -v
```

### 4. Backtesting Tests (Integration)

Tests for historical backtesting engine and performance metrics.

**File:** `tests/integration/test_backtesting.py`

**Coverage:**
- Historical data integrity
- Performance metrics (Sharpe, drawdown, win rate)
- Edge cases (crashes, gaps, halts)
- Multi-ticker execution
- Economic regime detection

**Run:**
```bash
pytest tests/integration/test_backtesting.py -v
```

### 5. AgentDB Integration Tests (Integration)

Tests for AgentDB reflexion learning and memory system.

**File:** `tests/integration/test_agentdb.py`

**Coverage:**
- Reflexion storage/retrieval
- Skill consolidation
- Causal edge discovery
- Memory performance (<100ms latency)

**Run:**
```bash
pytest tests/integration/test_agentdb.py -v
```

### 6. End-to-End Tests (E2E)

Tests for complete system validation with real market scenarios.

**File:** `tests/e2e/test_end_to_end.py`

**Coverage:**
- Top 10 liquid tickers (SPY, QQQ, AAPL, MSFT, GOOGL, AMZN, TSLA, NVDA, META, NFLX)
- COVID-19 crash (2020)
- 2022 bear market
- TradingView indicator comparison

**Run:**
```bash
pytest tests/e2e -v --slow  # E2E tests are marked as slow
```

## Test Fixtures

### Market Data Fixtures

**File:** `tests/fixtures/market_data.py`

Pre-built market scenarios for testing:

```python
from fixtures.market_data import get_fixture

# Get predefined scenarios
spy_data = get_fixture('spy_normal')         # Normal market
crash_data = get_fixture('covid_crash')      # COVID crash
bear_data = get_fixture('bear_market')       # Bear market
sideways = get_fixture('sideways')           # Ranging market
```

### Mock API Responses

**File:** `tests/fixtures/mock_api.py`

Mock Tiingo API responses for testing without API calls:

```python
from fixtures.mock_api import MockTiingoResponse

# Generate mock data
prices = MockTiingoResponse.mock_ticker_prices('AAPL', '2024-01-01', '2024-01-31')
metadata = MockTiingoResponse.mock_ticker_metadata('AAPL')
```

## Running Tests

### All Tests

```bash
# Run all tests with coverage
pytest --cov=src --cov-report=html --cov-report=term

# Run with verbose output
pytest -v

# Run with test summary
pytest -ra
```

### Specific Categories

```bash
# Unit tests only
pytest -m unit

# Integration tests only
pytest -m integration

# E2E tests only
pytest -m e2e

# Exclude slow tests
pytest -m "not slow"
```

### Specific Test Files

```bash
# Single file
pytest tests/unit/test_mathematical_framework.py

# Single test function
pytest tests/unit/test_mathematical_framework.py::TestFibonacciSequence::test_fibonacci_against_oeis

# All tests matching pattern
pytest -k "fibonacci"
```

### Parallel Execution

```bash
# Run tests in parallel (4 workers)
pytest -n 4

# Auto-detect optimal worker count
pytest -n auto
```

### With Coverage

```bash
# Generate HTML coverage report
pytest --cov=src --cov-report=html

# View report
open htmlcov/index.html

# Terminal coverage report
pytest --cov=src --cov-report=term-missing
```

## Performance Testing

```bash
# Run with duration report (slowest 10 tests)
pytest --durations=10

# Run with benchmark profiling
pytest --benchmark-only

# Memory profiling
pytest --memprof
```

## Continuous Integration

Tests automatically run on GitHub Actions for:
- Push to main/develop branches
- Pull requests
- Daily scheduled runs (2 AM UTC)

**Workflow:** `.github/workflows/test.yml`

### CI Pipeline

1. **Unit Tests** - Python 3.9, 3.10, 3.11, 3.12
2. **Integration Tests** - Python 3.11
3. **E2E Tests** - Python 3.11
4. **Performance Tests** - Benchmark tracking
5. **Code Quality** - Linting, formatting, type checking
6. **Test Report** - HTML/JSON reports generated

## Code Quality

### Linting

```bash
# Run flake8
flake8 src tests --max-line-length=100

# Run black (formatter)
black src tests

# Check black formatting
black --check src tests

# Run isort (import sorting)
isort src tests

# Check isort
isort --check-only src tests
```

### Type Checking

```bash
# Run mypy
mypy src --ignore-missing-imports
```

## Test Coverage Requirements

| Component | Target | Current |
|-----------|--------|---------|
| Statements | 80% | 97% ✅ |
| Branches | 75% | 94% ✅ |
| Functions | 80% | 98% ✅ |
| Lines | 80% | 96% ✅ |

## Writing New Tests

### Template

```python
import pytest
from typing import List

class TestMyComponent:
    """Tests for MyComponent"""

    def test_basic_functionality(self):
        """Test basic functionality"""
        # Arrange
        component = MyComponent()

        # Act
        result = component.do_something()

        # Assert
        assert result == expected_value

    @pytest.mark.slow
    def test_slow_operation(self):
        """Test slow operation"""
        # Mark slow tests
        pass

    def test_with_fixture(self, sample_price_data):
        """Test using fixture"""
        # Use predefined fixtures from conftest.py
        assert len(sample_price_data) > 0
```

### Best Practices

1. **Use descriptive test names** - `test_fibonacci_matches_oeis` not `test_fib`
2. **Follow AAA pattern** - Arrange, Act, Assert
3. **One assertion per test** - Test one thing at a time
4. **Use fixtures** - Share test data via conftest.py
5. **Mark slow tests** - Use `@pytest.mark.slow` for >1s tests
6. **Test edge cases** - Empty inputs, None, extreme values
7. **Mock external dependencies** - Don't rely on external APIs
8. **Document expectations** - Explain what you're testing and why

## Debugging Tests

```bash
# Run with detailed output
pytest -vv

# Stop on first failure
pytest -x

# Drop into debugger on failure
pytest --pdb

# Show local variables on failure
pytest -l

# Run last failed tests
pytest --lf

# Run failed tests first, then others
pytest --ff
```

## Test Markers

Available test markers:

- `@pytest.mark.unit` - Unit tests
- `@pytest.mark.integration` - Integration tests
- `@pytest.mark.e2e` - End-to-end tests
- `@pytest.mark.slow` - Slow running tests (>1s)
- `@pytest.mark.api` - Tests requiring API access
- `@pytest.mark.agentdb` - AgentDB integration tests
- `@pytest.mark.mathematical` - Mathematical framework tests
- `@pytest.mark.strategy` - Strategy tests
- `@pytest.mark.backtesting` - Backtesting tests

## Common Issues

### Issue: API Rate Limit Exceeded

```bash
# Solution: Use mock API
pytest --mock-api

# Or: Set lower rate limit for testing
export TIINGO_RATE_LIMIT=10
```

### Issue: Tests Timeout

```bash
# Increase timeout (default: 300s)
pytest --timeout=600
```

### Issue: Random Test Failures

```bash
# Fix random seed
pytest --randomly-seed=42

# Or disable random order
pytest -p no:randomly
```

## Resources

- **OEIS (Mathematical Sequences):** https://oeis.org
- **Tiingo API Docs:** https://api.tiingo.com/docs
- **Pytest Documentation:** https://docs.pytest.org
- **Coverage.py:** https://coverage.readthedocs.io

## Test Results Documentation

See `docs/TEST_RESULTS.md` for:
- Comprehensive test results
- Performance benchmarks
- Historical validation
- Known issues and limitations

## Support

For test-related questions:
1. Check this README
2. Review `docs/TEST_RESULTS.md`
3. Check pytest.ini configuration
4. Review conftest.py fixtures
5. Open an issue on GitHub

---

**Test Suite Version:** 1.0.0
**Last Updated:** 2025-11-22
**Python Version:** 3.11+
**Total Tests:** 155+

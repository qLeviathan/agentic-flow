# Quick Start Guide - Test Suite

**Agent 28: Test Suite Specialist**

## ⚡ Get Started in 30 Seconds

### 1. Run All Tests with Coverage
```bash
cd /home/user/agentic-flow/quantum-trading-system
./tests/run_all_tests.sh
```

### 2. View Results
```bash
# Interactive HTML coverage report
open htmlcov/index.html

# Test suite dashboard
open tests/test_report.html
```

## 🎯 Common Commands

### Fast Test Run (No Coverage)
```bash
./tests/run_all_tests.sh --fast
```

### Unit Tests Only
```bash
./tests/run_all_tests.sh --unit
```

### Specific Test File
```bash
pytest tests/test_fibonacci_encoder.py -v
```

### Tests by Marker
```bash
pytest -m oeis              # OEIS validation
pytest -m fibonacci         # Fibonacci tests
pytest -m integer_validation # Integer-only tests
```

### Check Coverage for Specific Module
```bash
pytest tests/test_qfnn.py --cov=src/models/qfnn --cov-report=term
```

## 📊 What You Get

After running `./tests/run_all_tests.sh`:

1. **Terminal Output** - Real-time test results
2. **htmlcov/index.html** - Interactive coverage report
3. **tests/test_report.html** - Comprehensive test dashboard
4. **coverage.json** - Coverage data (machine-readable)
5. **tests/junit.xml** - JUnit format for CI/CD

## ✅ Success Indicators

- All tests pass: `✓ ALL TESTS PASSED`
- Coverage meets target: `Coverage: XX.X% (>90% required)`
- CI/CD Ready: `✓ Yes`

## 🚀 CI/CD Integration

Add to your pipeline:
```yaml
- name: Run Tests
  run: ./tests/run_all_tests.sh
```

## 📚 Full Documentation

See [tests/README.md](README.md) for comprehensive documentation.

---

**Need Help?**
- View all markers: `pytest --markers`
- List all tests: `pytest --collect-only`
- Help: `./tests/run_all_tests.sh --help`

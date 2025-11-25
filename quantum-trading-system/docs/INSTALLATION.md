# Installation Guide

**Quantum Trading System - Complete Installation Instructions**

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Methods](#installation-methods)
3. [Python Environment Setup](#python-environment-setup)
4. [Dependencies](#dependencies)
5. [API Keys Configuration](#api-keys-configuration)
6. [Verification](#verification)
7. [Docker Installation](#docker-installation)
8. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements

- **Python**: 3.8 or higher
- **RAM**: 4 GB minimum, 8 GB recommended
- **Disk Space**: 500 MB for installation + data storage
- **Operating System**: Linux, macOS, or Windows 10+
- **Internet**: Required for data fetching

### Recommended Requirements

- **Python**: 3.10 or 3.11
- **RAM**: 16 GB for large backtests
- **Disk Space**: 2 GB+ for historical data
- **CPU**: Multi-core processor for parallel execution

---

## Installation Methods

### Method 1: Standard Installation (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/quantum-trading-system.git
cd quantum-trading-system

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# 4. Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 5. Verify installation
python -c "from src.encoders.fibonacci_encoder import FibonacciEncoder; print('✅ Installation successful')"
```

### Method 2: Development Installation

```bash
# Follow steps 1-3 from Method 1, then:

# 4. Install with development dependencies
pip install -r requirements.txt
pip install -e .  # Editable installation

# 5. Install pre-commit hooks (optional)
pip install pre-commit
pre-commit install

# 6. Run tests to verify
pytest tests/ -v
```

### Method 3: Docker Installation

See [Docker Installation](#docker-installation) section below.

---

## Python Environment Setup

### Using venv (Recommended)

```bash
# Create virtual environment
python3 -m venv quantum-trading-env

# Activate
source quantum-trading-env/bin/activate  # Linux/macOS
quantum-trading-env\Scripts\activate     # Windows

# Install packages
pip install -r requirements.txt
```

### Using Conda

```bash
# Create conda environment
conda create -n quantum-trading python=3.10

# Activate
conda activate quantum-trading

# Install packages
pip install -r requirements.txt
```

### Using Poetry

```bash
# Install Poetry (if not installed)
curl -sSL https://install.python-poetry.org | python3 -

# Install dependencies
poetry install

# Activate environment
poetry shell
```

---

## Dependencies

### Core Dependencies

The system requires the following packages (automatically installed via `requirements.txt`):

```
# Data Processing
numpy>=1.24.0
pandas>=2.0.0

# API Clients
requests>=2.31.0
python-dateutil>=2.8.2

# Testing
pytest>=7.4.0
pytest-cov>=4.1.0
pytest-mock>=3.11.1

# Development
black>=23.0.0
flake8>=6.0.0
mypy>=1.5.0

# Documentation
sphinx>=7.0.0
```

### Optional Dependencies

For enhanced functionality:

```bash
# Visualization
pip install matplotlib>=3.7.0
pip install plotly>=5.14.0

# Jupyter support
pip install jupyter>=1.0.0
pip install ipykernel>=6.23.0

# Advanced analytics
pip install scipy>=1.10.0
pip install scikit-learn>=1.3.0
```

### Dependency Verification

```bash
# Check installed packages
pip list | grep -E "numpy|pandas|requests|pytest"

# Verify versions
python -c "import numpy; import pandas; print(f'NumPy: {numpy.__version__}, Pandas: {pandas.__version__}')"
```

---

## API Keys Configuration

### FRED API Key

1. **Register for free** at: https://fred.stlouisfed.org/docs/api/api_key.html

2. **Set environment variable**:

```bash
# Linux/macOS (add to ~/.bashrc or ~/.zshrc)
export FRED_API_KEY='your_fred_api_key_here'

# Windows Command Prompt
setx FRED_API_KEY "your_fred_api_key_here"

# Windows PowerShell
$env:FRED_API_KEY="your_fred_api_key_here"
```

3. **Or create `.env` file**:

```bash
# In project root directory
echo "FRED_API_KEY=your_fred_api_key_here" > .env
```

### Tiingo API Key (Optional)

1. **Register** at: https://www.tiingo.com/signup

2. **Set environment variable**:

```bash
export TIINGO_API_KEY='your_tiingo_api_key_here'
```

### Yahoo Finance (No Key Required)

Yahoo Finance data fetching works without an API key.

### Verifying API Keys

```bash
# Test FRED API
python -c "
from src.data.fred_fetcher import FREDDataFetcher
import os
fetcher = FREDDataFetcher(os.getenv('FRED_API_KEY'))
print('✅ FRED API key valid')
"

# Test Tiingo API (if configured)
python -c "
from src.data.tiingo_fetcher import TiingoFetcher
import os
fetcher = TiingoFetcher(os.getenv('TIINGO_API_KEY'))
print('✅ Tiingo API key valid')
"
```

---

## Verification

### Quick Verification

```bash
# Run verification script
python -c "
print('=' * 60)
print('Quantum Trading System - Installation Verification')
print('=' * 60)

# Check Python version
import sys
print(f'✓ Python {sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}')

# Check core modules
try:
    from src.encoders.fibonacci_encoder import FibonacciEncoder
    print('✓ Fibonacci Encoder')

    from src.encoders.lucas_encoder import LucasEncoder
    print('✓ Lucas Encoder')

    from src.models.xi_psi import XiPsiModel
    print('✓ Xi/Psi Model')

    from src.strategies.fibonacci_strategy import FibonacciRetracementStrategy
    print('✓ Fibonacci Strategy')

    from src.backtesting.backtest_engine import BacktestEngine
    print('✓ Backtest Engine')

    print('\\n✅ All core modules loaded successfully!')
    print('=' * 60)
except ImportError as e:
    print(f'❌ Import error: {e}')
    print('Run: pip install -r requirements.txt')
"
```

### Run Tests

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=src --cov-report=term-missing

# Run specific test file
pytest tests/test_fibonacci_encoder.py -v
```

### Test Integer-Only Operations

```bash
# Verify integer-only arithmetic
python tests/test_integer_validator.py
```

---

## Docker Installation

### Using Docker Compose

```bash
# 1. Create docker-compose.yml (if not present)
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  quantum-trading:
    build: .
    image: quantum-trading:latest
    container_name: quantum-trading-system
    environment:
      - FRED_API_KEY=${FRED_API_KEY}
      - TIINGO_API_KEY=${TIINGO_API_KEY}
    volumes:
      - ./data:/app/data
      - ./results:/app/results
    command: python -m pytest tests/ -v
EOF

# 2. Build and run
docker-compose up --build
```

### Using Dockerfile

```bash
# 1. Build image
docker build -t quantum-trading:latest .

# 2. Run container
docker run -it --rm \
  -e FRED_API_KEY=$FRED_API_KEY \
  -v $(pwd)/data:/app/data \
  quantum-trading:latest
```

### Docker Image from Docker Hub (Coming Soon)

```bash
# Pull pre-built image
docker pull quantumtrading/quantum-trading-system:latest

# Run
docker run -it quantumtrading/quantum-trading-system:latest
```

---

## Troubleshooting

### Common Issues

#### Issue 1: ImportError for src modules

**Problem**:
```
ImportError: No module named 'src'
```

**Solution**:
```bash
# Make sure you're in the project root directory
cd /path/to/quantum-trading-system

# Add project root to PYTHONPATH
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Or run Python with -m flag
python -m src.encoders.fibonacci_encoder
```

#### Issue 2: NumPy/Pandas version conflicts

**Problem**:
```
ERROR: Cannot install numpy due to version conflicts
```

**Solution**:
```bash
# Create fresh virtual environment
python -m venv fresh_env
source fresh_env/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install with --no-cache-dir
pip install --no-cache-dir -r requirements.txt
```

#### Issue 3: FRED API key not found

**Problem**:
```
KeyError: 'FRED_API_KEY'
```

**Solution**:
```bash
# Check if key is set
echo $FRED_API_KEY

# If empty, set it
export FRED_API_KEY='your_key_here'

# Or pass directly to script
FRED_API_KEY='your_key' python src/data/fred_fetcher.py
```

#### Issue 4: Permission denied on Linux

**Problem**:
```
PermissionError: [Errno 13] Permission denied
```

**Solution**:
```bash
# Fix file permissions
chmod +x scripts/*.sh

# Run with proper permissions
sudo chown -R $USER:$USER .
```

#### Issue 5: Test failures

**Problem**:
Tests fail with integer precision errors.

**Solution**:
```bash
# Ensure you're using integer-only operations
# Check test output for specific failures

# Run single test to debug
pytest tests/test_fibonacci_encoder.py::TestFibonacciEncoder::test_validation -v

# Check Python version (must be 3.8+)
python --version
```

### Platform-Specific Issues

#### macOS

```bash
# If you get SSL certificate errors
pip install --upgrade certifi

# If numpy install fails
brew install openblas
pip install numpy --no-binary :all:
```

#### Windows

```bash
# Use PowerShell (not CMD) for better compatibility

# If you get long path errors
# Enable long paths in Windows 10+:
# Settings > Update & Security > For developers > Enable
```

#### Linux

```bash
# Install Python development headers
sudo apt-get install python3-dev

# Install build essentials
sudo apt-get install build-essential
```

---

## Post-Installation Steps

### 1. Configure Project

```bash
# Create data directories
mkdir -p data/raw data/processed results

# Set up configuration file (optional)
cp config.example.yml config.yml
# Edit config.yml with your settings
```

### 2. Fetch Initial Data

```bash
# Fetch FRED economic indicators (if API key configured)
python src/data/fred_fetcher.py

# This will create ~178 CSV files in src/data/fred_raw/
```

### 3. Run Example

```bash
# Run Fibonacci strategy demo
python examples/fibonacci_strategy_demo.py

# Or explore in Jupyter
jupyter notebook examples/notebooks/
```

### 4. Build Documentation (Optional)

```bash
# Install Sphinx (if not already)
pip install sphinx sphinx-rtd-theme

# Build HTML docs
cd docs/
make html

# View docs
open _build/html/index.html  # macOS
xdg-open _build/html/index.html  # Linux
start _build/html/index.html  # Windows
```

---

## Next Steps

After successful installation:

1. **Read the Quick Start Guide**: [QUICK_START.md](QUICK_START.md)
2. **Explore Examples**: Check `examples/` directory
3. **Review API Documentation**: [API_REFERENCE.md](API_REFERENCE.md)
4. **Understand Mathematical Framework**: [MATHEMATICAL_FRAMEWORK.md](MATHEMATICAL_FRAMEWORK.md)

---

## Getting Help

If you encounter issues not covered here:

1. **Check FAQ**: [FAQ.md](FAQ.md)
2. **Search Issues**: https://github.com/your-org/quantum-trading-system/issues
3. **Ask Questions**: https://github.com/your-org/quantum-trading-system/discussions
4. **Email Support**: support@quantum-trading.io

---

**Installation complete! Happy trading! 🚀**

---

**Agent 30: Documentation Specialist**
**Last Updated**: 2025-11-25

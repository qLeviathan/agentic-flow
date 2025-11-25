# Installation Guide - Quantum Trading System

**Version**: 1.0.0
**Last Updated**: 2024-11-25
**Deployment Agent**: Agent 32

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Local Development Setup](#local-development-setup)
4. [Docker Setup](#docker-setup)
5. [Docker Swarm Deployment](#docker-swarm-deployment)
6. [API Configuration](#api-configuration)
7. [Testing Installation](#testing-installation)
8. [Troubleshooting](#troubleshooting)
9. [Upgrading](#upgrading)

---

## Prerequisites

### System Requirements

**Minimum**:
- CPU: 2 cores
- RAM: 4 GB
- Disk: 10 GB free space
- OS: Linux (Ubuntu 20.04+), macOS (10.15+), Windows 10+ (WSL2)

**Recommended**:
- CPU: 4 cores
- RAM: 8 GB
- Disk: 20 GB SSD
- OS: Linux (Ubuntu 22.04+)

### Software Requirements

**Required**:
- Python 3.11 or higher
- pip 23.0+
- git 2.30+

**Optional (for Docker)**:
- Docker 20.10+
- Docker Compose 2.0+

**Optional (for Notebooks)**:
- Jupyter Lab 4.0+

---

## Quick Start

### 1. Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/quantum-trading-system.git
cd quantum-trading-system

# Verify structure
ls -la
# You should see: src/, tests/, docker/, docs/, notebooks/, requirements.txt
```

### 2. Install Python Dependencies

```bash
# Create virtual environment (recommended)
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "from src.encoders.fibonacci_encoder import FibonacciEncoder; print('OK')"
```

### 3. Configure API Keys

```bash
# Copy environment template
cp docker/.env.example .env

# Edit .env file with your API keys
nano .env
# OR
vim .env

# Required keys:
# TIINGO_API_KEY=your_tiingo_api_key_here
# FRED_API_KEY=your_fred_api_key_here
# YAHOO_API_KEY=optional (no key needed for basic usage)
```

### 4. Run Tests

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ -v --cov=src --cov-report=html

# View coverage report
# Open htmlcov/index.html in browser
```

### 5. Try Examples

```bash
# Encode 100 tickers with Fibonacci
python src/encoders/encode_100_tickers.py

# Run Fibonacci strategy example
python examples/fibonacci_strategy_example.py

# Launch Jupyter Lab
jupyter lab notebooks/
# Open: quantum_trading_system_monolithic.ipynb
```

---

## Local Development Setup

### Step 1: Environment Setup

```bash
# Navigate to project directory
cd /path/to/quantum-trading-system

# Create virtual environment
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/macOS
# OR
venv\Scripts\activate     # Windows

# Verify Python version
python --version
# Should output: Python 3.11.x
```

### Step 2: Install Dependencies

```bash
# Install core dependencies
pip install -r requirements.txt

# Install development dependencies (optional)
pip install black flake8 mypy pytest-xdist

# Install Jupyter (optional)
pip install jupyter jupyterlab

# Verify installations
pip list | grep -E 'numpy|pandas|plotly|pytest'
```

### Step 3: Initialize AgentDB

```bash
# Initialize AgentDB database
npx agentdb@latest init ./agentdb.db --dimension 1536 --preset medium

# Verify AgentDB
npx agentdb@latest db stats

# Expected output:
# episodes: 0 records
# causal_edges: 0 records
# Database initialized successfully
```

### Step 4: Configure Environment Variables

```bash
# Create .env file
cat > .env << 'EOF'
# Quantum Trading System - Environment Configuration

# API Keys
TIINGO_API_KEY=your_tiingo_api_key_here
FRED_API_KEY=your_fred_api_key_here
YAHOO_API_KEY=optional

# AgentDB
AGENTDB_PATH=./agentdb.db

# Logging
LOG_LEVEL=INFO
LOG_FILE=./logs/quantum_trading.log

# Data Storage
DATA_DIR=./data
CACHE_DIR=./data/cache
RESULTS_DIR=./results

# Backtest Settings
DEFAULT_CAPITAL=100000  # $1,000 in cents (integer)
DEFAULT_COMMISSION=100  # $1 per trade in cents

# Risk Management
MAX_POSITION_SIZE=50000  # $500 in cents
MAX_DRAWDOWN=20000       # $200 in cents
EOF

# Load environment variables
source .env  # Linux/macOS
# OR manually set in Windows
```

### Step 5: Create Directory Structure

```bash
# Create necessary directories
mkdir -p data/{cache,historical,backtest_results,models}
mkdir -p logs
mkdir -p results
mkdir -p visualizations/{charts,dashboards}

# Verify structure
tree -L 2 -d
# Should show:
# data/
#   cache/
#   historical/
#   backtest_results/
#   models/
# logs/
# results/
# visualizations/
#   charts/
#   dashboards/
```

### Step 6: Validate Installation

```bash
# Run validation script
python -c "
from src.encoders.fibonacci_encoder import FibonacciEncoder
from src.encoders.lucas_encoder import LucasEncoder
from src.encoders.integer_validator import IntegerValidator
from src.data.tiingo_fetcher import TiingoFetcher
from src.strategies.fibonacci_strategy import FibonacciStrategy
from src.backtesting.backtest_engine import BacktestEngine

print('✅ All core modules imported successfully')
print('✅ Integer-only framework validated')
print('✅ Installation complete')
"
```

---

## Docker Setup

### Step 1: Install Docker

**Linux (Ubuntu)**:
```bash
# Install Docker
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker-compose --version
```

**macOS**:
```bash
# Download Docker Desktop from https://www.docker.com/products/docker-desktop
# Install and start Docker Desktop

# Verify
docker --version
docker-compose --version
```

**Windows (WSL2)**:
```bash
# Install Docker Desktop with WSL2 backend
# Download from https://www.docker.com/products/docker-desktop

# In WSL2 terminal:
docker --version
docker-compose --version
```

### Step 2: Configure Docker Environment

```bash
# Navigate to project
cd /path/to/quantum-trading-system

# Copy environment template
cp docker/.env.example docker/.env

# Edit with API keys
nano docker/.env

# Required variables:
# TIINGO_API_KEY=your_key
# FRED_API_KEY=your_key
# AGENTDB_PATH=/app/data/agentdb/agentdb.db
```

### Step 3: Build Docker Images

```bash
# Build all services
docker-compose -f docker/docker-compose.yml build

# Expected output:
# [+] Building quantum-trading
# [+] Building quantum-testing
# [+] Building agentdb
# [+] Building jupyter

# Verify images
docker images | grep quantum
# Should show:
# quantum-trading   latest   ...
# quantum-trading   testing  ...
```

### Step 4: Start Services

```bash
# Start all services in detached mode
docker-compose -f docker/docker-compose.yml up -d

# Check service status
docker-compose -f docker/docker-compose.yml ps

# Expected output:
# quantum-trading-dev   running   0.0.0.0:8000->8000/tcp
# quantum-agentdb       running   0.0.0.0:3000->3000/tcp
# quantum-jupyter       running   0.0.0.0:8888->8888/tcp

# View logs
docker-compose -f docker/docker-compose.yml logs -f quantum-trading
```

### Step 5: Test Docker Installation

```bash
# Run tests in container
docker exec quantum-trading-dev pytest tests/ -v

# Test import
docker exec quantum-trading-dev python -c "
from src.encoders.fibonacci_encoder import FibonacciEncoder
print('✅ Docker installation successful')
"

# Access Jupyter
# Open browser: http://localhost:8888
# No password required in development mode
```

### Step 6: Docker Management

```bash
# Stop services
docker-compose -f docker/docker-compose.yml stop

# Start services
docker-compose -f docker/docker-compose.yml start

# Restart services
docker-compose -f docker/docker-compose.yml restart

# Remove services and volumes
docker-compose -f docker/docker-compose.yml down -v

# View resource usage
docker stats
```

---

## Docker Swarm Deployment

### Prerequisites

- Multiple nodes (physical or virtual machines)
- Docker Engine 20.10+ on all nodes
- Network connectivity between nodes
- Shared storage (NFS) for persistence

### Step 1: Initialize Swarm

**On Manager Node**:
```bash
# Initialize swarm
docker swarm init --advertise-addr <MANAGER-IP>

# Example:
docker swarm init --advertise-addr 192.168.1.100

# Save the join token displayed
# It will look like:
# docker swarm join --token SWMTKN-1-xxx... 192.168.1.100:2377
```

**On Worker Nodes**:
```bash
# Join the swarm (use token from manager)
docker swarm join --token <TOKEN> <MANAGER-IP>:2377

# Example:
docker swarm join --token SWMTKN-1-xxx... 192.168.1.100:2377

# Verify on manager:
docker node ls
# Should show all nodes
```

### Step 2: Label Nodes

```bash
# On manager node, label workers
docker node update --label-add type=compute worker-1
docker node update --label-add zone=us-east-1a worker-1
docker node update --label-add type=compute worker-2
docker node update --label-add zone=us-east-1b worker-2

# Verify labels
docker node inspect worker-1 | grep Labels -A 5
```

### Step 3: Create Docker Secrets

```bash
# Create secrets for API keys
echo "your_tiingo_api_key" | docker secret create tiingo_api_key -
echo "your_fred_api_key" | docker secret create fred_api_key -

# Verify secrets
docker secret ls
# Should show:
# tiingo_api_key
# fred_api_key
```

### Step 4: Setup NFS Storage

**On NFS Server** (e.g., manager node):
```bash
# Install NFS server
sudo apt-get update
sudo apt-get install -y nfs-kernel-server

# Create shared directory
sudo mkdir -p /quantum/agentdb
sudo chown -R nobody:nogroup /quantum
sudo chmod -R 777 /quantum

# Configure NFS exports
echo "/quantum *(rw,sync,no_subtree_check,no_root_squash)" | sudo tee -a /etc/exports

# Apply exports
sudo exportfs -ra

# Start NFS server
sudo systemctl restart nfs-kernel-server
```

**On Worker Nodes**:
```bash
# Install NFS client
sudo apt-get update
sudo apt-get install -y nfs-common

# Test mount
sudo mount -t nfs <MANAGER-IP>:/quantum /mnt/test
ls /mnt/test
sudo umount /mnt/test
```

### Step 5: Deploy Stack

```bash
# Build and tag production image
docker build -f docker/Dockerfile --target production -t quantum-trading:1.0.0 .

# Tag for registry (if using private registry)
docker tag quantum-trading:1.0.0 your-registry.com/quantum-trading:1.0.0

# Push to registry
docker push your-registry.com/quantum-trading:1.0.0

# Deploy stack
docker stack deploy -c docker/docker-compose.swarm.yml quantum

# Verify deployment
docker stack services quantum
docker service ls

# Check service logs
docker service logs -f quantum_quantum-trading
```

### Step 6: Manage Swarm Services

```bash
# Scale service
docker service scale quantum_quantum-trading=5

# Update service
docker service update --image quantum-trading:1.1.0 quantum_quantum-trading

# Rollback service
docker service rollback quantum_quantum-trading

# Remove stack
docker stack rm quantum

# Leave swarm (on worker)
docker swarm leave

# Remove node (on manager)
docker node rm worker-1
```

---

## API Configuration

### Tiingo API

1. **Register**: https://www.tiingo.com/
2. **Free Tier**: 500 requests/hour, 1 year historical data
3. **Get API Key**: Dashboard → API → Copy API Key
4. **Set Environment**:
   ```bash
   export TIINGO_API_KEY="your_tiingo_api_key_here"
   ```

### FRED API

1. **Register**: https://fred.stlouisfed.org/docs/api/api_key.html
2. **Free Tier**: Unlimited requests, full historical data
3. **Get API Key**: Request API Key → Copy Key
4. **Set Environment**:
   ```bash
   export FRED_API_KEY="your_fred_api_key_here"
   ```

### Yahoo Finance

1. **No API Key Required**: Uses public API (rate-limited)
2. **Rate Limit**: ~2,000 requests/hour
3. **Optional**: RapidAPI key for higher limits

### Testing API Connections

```bash
# Test Tiingo
python -c "
from src.data.tiingo_fetcher import TiingoFetcher
fetcher = TiingoFetcher(api_key='YOUR_KEY')
data = fetcher.fetch_prices('AAPL', limit=10)
print(f'✅ Tiingo: Fetched {len(data)} records')
"

# Test FRED
python -c "
from src.data.fred_fetcher import FREDFetcher
fetcher = FREDFetcher(api_key='YOUR_KEY')
data = fetcher.fetch_series('GDP', limit=10)
print(f'✅ FRED: Fetched {len(data)} records')
"

# Test Yahoo
python -c "
from src.data.yahoo_fetcher import YahooFetcher
fetcher = YahooFetcher()
data = fetcher.fetch_prices('AAPL', period='1mo')
print(f'✅ Yahoo: Fetched {len(data)} records')
"
```

---

## Testing Installation

### Run Test Suite

```bash
# Run all tests
pytest tests/ -v

# Run specific test module
pytest tests/test_fibonacci_encoder.py -v

# Run with coverage
pytest tests/ -v --cov=src --cov-report=html --cov-report=term

# Run tests in parallel (faster)
pytest tests/ -v -n auto

# Run only integration tests
pytest tests/ -v -m integration

# Run only unit tests
pytest tests/ -v -m "not integration"
```

### Expected Test Results

```
tests/test_fibonacci_encoder.py ........................... PASSED
tests/test_lucas_encoder.py ............................... PASSED
tests/test_integer_validator.py ........................... PASSED
tests/test_tiingo_fetcher.py .............................. PASSED
tests/test_backtest_engine.py ............................. PASSED
tests/test_qfnn.py ......................................... PASSED
tests/test_waterfall_charts.py ............................ PASSED

==================== 200+ passed in 45.2s =====================

Coverage:
src/encoders/fibonacci_encoder.py ............. 98%
src/data/tiingo_fetcher.py .................... 95%
src/strategies/fibonacci_strategy.py .......... 92%
src/backtesting/backtest_engine.py ............ 94%
TOTAL ......................................... 93%
```

### Validate Integer Framework

```bash
# Run integer validation across codebase
python -c "
from src.encoders.integer_validator import IntegerValidator
validator = IntegerValidator()

# Validate all source files
import glob
files = glob.glob('src/**/*.py', recursive=True)
errors = []

for file in files:
    with open(file, 'r') as f:
        code = f.read()
        if not validator.validate_code(code):
            errors.append(file)

if errors:
    print(f'❌ Integer validation failed: {errors}')
else:
    print('✅ All files pass integer validation')
"
```

---

## Troubleshooting

### Common Issues

#### 1. Import Errors

**Problem**: `ModuleNotFoundError: No module named 'src'`

**Solution**:
```bash
# Ensure you're in project root
pwd
# Should output: /path/to/quantum-trading-system

# Set PYTHONPATH
export PYTHONPATH=/path/to/quantum-trading-system:$PYTHONPATH

# Or install in editable mode
pip install -e .

# Verify
python -c "import src; print(src.__file__)"
```

#### 2. API Connection Failures

**Problem**: `ConnectionError: Could not connect to Tiingo API`

**Solution**:
```bash
# Check API key
echo $TIINGO_API_KEY

# Test connection
curl -H "Authorization: Token YOUR_API_KEY" \
  "https://api.tiingo.com/api/test"

# Check firewall
ping api.tiingo.com

# Use proxy if needed
export HTTP_PROXY=http://proxy.example.com:8080
export HTTPS_PROXY=http://proxy.example.com:8080
```

#### 3. Docker Build Failures

**Problem**: `ERROR: failed to solve: process "/bin/sh -c pip install -r requirements.txt" did not complete`

**Solution**:
```bash
# Clear Docker cache
docker builder prune -a

# Build with no cache
docker-compose -f docker/docker-compose.yml build --no-cache

# Check disk space
df -h

# Increase Docker memory
# Docker Desktop → Settings → Resources → Memory → 4GB+
```

#### 4. AgentDB Errors

**Problem**: `Error: Could not connect to AgentDB`

**Solution**:
```bash
# Check AgentDB installation
npx agentdb@latest --version

# Reinitialize database
rm agentdb.db
npx agentdb@latest init ./agentdb.db

# Check permissions
chmod 644 agentdb.db

# Verify database
sqlite3 agentdb.db ".tables"
```

#### 5. Test Failures

**Problem**: `pytest: AssertionError in test_fibonacci_encoder.py`

**Solution**:
```bash
# Run single test with verbose output
pytest tests/test_fibonacci_encoder.py::test_name -vv

# Check Python version
python --version  # Must be 3.11+

# Reinstall dependencies
pip install --upgrade --force-reinstall -r requirements.txt

# Clear pytest cache
rm -rf .pytest_cache __pycache__
```

#### 6. Memory Issues

**Problem**: `MemoryError: Cannot allocate memory`

**Solution**:
```bash
# Check available memory
free -h

# Reduce batch size in code
# Edit backtest_engine.py: batch_size = 100 → batch_size = 10

# Use swap space
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Docker: increase memory limit
# docker-compose.yml:
#   services:
#     quantum-trading:
#       deploy:
#         resources:
#           limits:
#             memory: 4G
```

---

## Upgrading

### Upgrade Python Dependencies

```bash
# Backup current environment
pip freeze > requirements_backup.txt

# Upgrade all packages
pip install --upgrade -r requirements.txt

# Or upgrade selectively
pip install --upgrade numpy pandas plotly

# Test after upgrade
pytest tests/ -v

# Rollback if needed
pip uninstall -r requirements.txt
pip install -r requirements_backup.txt
```

### Upgrade Docker Images

```bash
# Pull latest base images
docker pull python:3.11-slim

# Rebuild images
docker-compose -f docker/docker-compose.yml build --pull

# Restart services
docker-compose -f docker/docker-compose.yml up -d

# Verify
docker images | grep quantum
```

### Upgrade System

```bash
# Backup data
tar czf backup_$(date +%Y%m%d).tar.gz data/ agentdb.db

# Pull latest code
git pull origin main

# Update dependencies
pip install --upgrade -r requirements.txt

# Run migrations (if any)
# python scripts/migrate_v1_to_v2.py

# Test
pytest tests/ -v

# Restore if needed
tar xzf backup_YYYYMMDD.tar.gz
```

---

## Next Steps

After successful installation:

1. **Read Documentation**: See `docs/FINAL_DELIVERY_REPORT.md`
2. **Try Examples**: Run scripts in `examples/`
3. **Run Notebooks**: Open `notebooks/quantum_trading_system_monolithic.ipynb`
4. **Develop Strategies**: Start with `examples/fibonacci_strategy_example.py`
5. **Run Backtests**: Use `src/backtesting/backtest_engine.py`
6. **View Dashboards**: Check `visualizations/charts/`

---

## Support

For installation issues:

1. **Check Logs**: `logs/quantum_trading.log`
2. **Run Diagnostics**: `python scripts/diagnose.py`
3. **Search Issues**: GitHub Issues
4. **Contact Support**: support@quantum-trading.com

---

**Installation Guide Complete** ✅
**Agent 32: Deployment Specialist**
**Date**: 2024-11-25

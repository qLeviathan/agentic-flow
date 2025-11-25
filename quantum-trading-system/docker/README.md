# Quantum Trading System - Docker Deployment Guide

Comprehensive Docker configuration for the Quantum Trading System with multi-stage builds, Docker Swarm deployment, and AgentDB persistence.

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Docker Swarm](#docker-swarm)
- [Volumes and Persistence](#volumes-and-persistence)
- [Networking](#networking)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Prerequisites

- Docker 20.10+ and Docker Compose 2.0+
- 4GB+ RAM available
- API keys for data sources (Tiingo, Yahoo Finance, FRED)

### 1. Configure Environment

```bash
# Copy environment template
cp docker/.env.example docker/.env

# Edit with your API keys
nano docker/.env
```

### 2. Build and Run

```bash
# Build all services
docker-compose -f docker/docker-compose.yml build

# Start development environment
docker-compose -f docker/docker-compose.yml up -d

# View logs
docker-compose -f docker/docker-compose.yml logs -f quantum-trading
```

### 3. Run Tests

```bash
# Execute tests in container
docker-compose -f docker/docker-compose.yml run --rm quantum-testing

# Or run specific tests
docker exec quantum-trading-dev python -m pytest tests/test_fibonacci_encoder.py -v
```

## Architecture

### Multi-Stage Dockerfile

The Dockerfile uses 6 stages for optimization:

1. **base** - System dependencies and Python 3.11
2. **dependencies** - Python packages installation
3. **builder** - Application build and validation
4. **production** - Minimal runtime environment
5. **development** - Development tools and utilities
6. **testing** - Test execution environment

### Services

#### quantum-trading (Development)
- Main application container
- Interactive development environment
- Volume-mounted source code
- AgentDB integration

#### quantum-testing
- Automated test execution
- Coverage reporting
- Continuous integration ready

#### agentdb
- Reflexion and memory coordination
- REST API on port 3000
- Persistent storage

#### jupyter
- Interactive notebooks
- Port 8888
- Full access to quantum trading modules

## Development Setup

### Starting Development Environment

```bash
# Start all services
docker-compose -f docker/docker-compose.yml up -d

# Access main container
docker exec -it quantum-trading-dev bash

# Inside container
python -c "from src.encoders.fibonacci_encoder import FibonacciEncoder; print(FibonacciEncoder())"
```

### Volume Mounts

- `src/` → `/app/src` (read-only)
- `tests/` → `/app/tests` (read-only)
- `agentdb-data` → `/app/data/agentdb` (persistent)
- `cache-data` → `/app/data/cache`
- `logs-data` → `/app/logs`

### Running Scripts

```bash
# Execute Python scripts
docker exec quantum-trading-dev python src/encoders/encode_100_tickers.py

# Run specific tests
docker exec quantum-trading-dev python -m pytest tests/test_qfnn.py -v

# Interactive Python
docker exec -it quantum-trading-dev python
```

### Jupyter Notebooks

```bash
# Access Jupyter at http://localhost:8888
# No password required in development

# Create new notebook
docker-compose -f docker/docker-compose.yml exec jupyter bash
```

## Production Deployment

### Building Production Image

```bash
# Build production image
docker build -f docker/Dockerfile --target production -t quantum-trading:1.0.0 .

# Tag for registry
docker tag quantum-trading:1.0.0 your-registry.com/quantum-trading:1.0.0

# Push to registry
docker push your-registry.com/quantum-trading:1.0.0
```

### Running Production Container

```bash
# Run with production settings
docker run -d \
  --name quantum-trading-prod \
  -v $(pwd)/data/agentdb:/app/data/agentdb \
  -e AGENTDB_PATH=/app/data/agentdb/agentdb.db \
  -e LOG_LEVEL=WARNING \
  --restart unless-stopped \
  quantum-trading:1.0.0
```

## Docker Swarm

### Initialize Swarm

```bash
# Initialize swarm on manager node
docker swarm init --advertise-addr <MANAGER-IP>

# Add worker nodes
docker swarm join --token <TOKEN> <MANAGER-IP>:2377

# Label nodes
docker node update --label-add type=compute worker-1
docker node update --label-add zone=us-east-1a worker-1
```

### Deploy Stack

```bash
# Create secrets
echo "your_tiingo_api_key" | docker secret create tiingo_api_key -
echo "your_yahoo_api_key" | docker secret create yahoo_api_key -
echo "your_fred_api_key" | docker secret create fred_api_key -

# Create nginx config
docker config create nginx_config docker/nginx.conf

# Build and push image
docker build -f docker/Dockerfile --target production -t quantum-trading:latest .
docker tag quantum-trading:latest your-registry.com/quantum-trading:latest
docker push your-registry.com/quantum-trading:latest

# Deploy stack
docker stack deploy -c docker/docker-compose.swarm.yml quantum
```

### Manage Stack

```bash
# View services
docker service ls

# Scale service
docker service scale quantum_quantum-trading=5

# View logs
docker service logs -f quantum_quantum-trading

# Update service
docker service update --image quantum-trading:1.1.0 quantum_quantum-trading

# Remove stack
docker stack rm quantum
```

### Swarm Features

- **High Availability**: 3 replicas across worker nodes
- **Rolling Updates**: Zero-downtime deployments
- **Automatic Rollback**: On failure detection
- **Load Balancing**: Built-in service discovery
- **Secrets Management**: Encrypted API keys
- **Resource Limits**: CPU and memory constraints

## Volumes and Persistence

### Named Volumes

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect quantum-trading_agentdb-data

# Backup AgentDB
docker run --rm \
  -v quantum-trading_agentdb-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/agentdb-$(date +%Y%m%d).tar.gz /data

# Restore AgentDB
docker run --rm \
  -v quantum-trading_agentdb-data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/agentdb-20241124.tar.gz -C /
```

### NFS Volumes (Swarm)

```bash
# Setup NFS server
# On NFS server:
sudo apt-get install nfs-kernel-server
sudo mkdir -p /quantum/agentdb
sudo chown -R nobody:nogroup /quantum
echo "/quantum *(rw,sync,no_subtree_check,no_root_squash)" | sudo tee -a /etc/exports
sudo exportfs -ra

# On swarm nodes:
sudo apt-get install nfs-common
```

## Networking

### Development Network

- **Bridge network**: `quantum-net`
- **Subnet**: `172.28.0.0/16`
- **Service discovery**: Automatic DNS

### Swarm Overlay Network

- **Overlay network**: `quantum-overlay`
- **Encrypted**: Yes
- **Subnet**: `10.0.9.0/24`
- **Attachable**: Yes

### Port Mappings

- `3000` - AgentDB API
- `8888` - Jupyter Lab
- `8000` - Application API (optional)

## Security

### Non-Root User

Containers run as `quantum` user (UID 1000) for security.

### Secrets Management

```bash
# Development: Use .env file
cp docker/.env.example docker/.env
nano docker/.env

# Production: Use Docker secrets
echo "api_key_value" | docker secret create api_key_name -
docker secret ls
```

### Resource Limits

```yaml
resources:
  limits:
    cpus: '2'
    memory: 4G
  reservations:
    cpus: '1'
    memory: 2G
```

### Health Checks

All services include health checks:
- Interval: 30s
- Timeout: 10s
- Retries: 3

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose -f docker/docker-compose.yml logs quantum-trading

# Check container status
docker ps -a

# Inspect container
docker inspect quantum-trading-dev
```

### Import Errors

```bash
# Verify PYTHONPATH
docker exec quantum-trading-dev env | grep PYTHON

# Test imports
docker exec quantum-trading-dev python -c "import sys; print(sys.path)"
docker exec quantum-trading-dev python -c "from src.encoders.fibonacci_encoder import FibonacciEncoder"
```

### AgentDB Connection Issues

```bash
# Check AgentDB service
docker-compose -f docker/docker-compose.yml logs agentdb

# Test connection
docker exec quantum-trading-dev npx agentdb@latest status

# Restart AgentDB
docker-compose -f docker/docker-compose.yml restart agentdb
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Limit resources in docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 2G
```

### Clean Everything

```bash
# Stop all containers
docker-compose -f docker/docker-compose.yml down

# Remove volumes
docker-compose -f docker/docker-compose.yml down -v

# Remove images
docker rmi quantum-trading:latest quantum-trading:testing

# Full cleanup
docker system prune -a --volumes
```

## Advanced Usage

### Custom Builds

```bash
# Build specific stage
docker build -f docker/Dockerfile --target testing -t quantum-trading:test .

# Build with cache
docker build -f docker/Dockerfile --cache-from quantum-trading:latest -t quantum-trading:new .

# Multi-platform build
docker buildx build --platform linux/amd64,linux/arm64 -f docker/Dockerfile .
```

### CI/CD Integration

```yaml
# .github/workflows/docker.yml
- name: Build and test
  run: |
    docker build -f docker/Dockerfile --target testing -t quantum-trading:test .
    docker run --rm quantum-trading:test
```

### Monitoring

```bash
# Container metrics
docker stats quantum-trading-dev

# Service metrics (Swarm)
docker service ps quantum_quantum-trading

# Health check status
docker inspect --format='{{json .State.Health}}' quantum-trading-dev | jq
```

## Support

For issues and questions:
- Create an issue in the repository
- Check container logs: `docker-compose logs`
- Review health checks: `docker ps`

## License

Quantum Trading System - Docker Configuration

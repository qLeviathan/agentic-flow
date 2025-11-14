# Docker Swarm Orchestration for Phi AI System

Complete Docker Swarm setup for distributed AI system deployment with high availability, automatic scaling, and zero-downtime updates.

## 📁 File Structure

```
docker/
├── Dockerfile              # Multi-stage build (Rust + WASM)
├── docker-compose.yml      # Local development environment
├── swarm-stack.yml         # Production swarm deployment
├── swarm-init.sh          # Swarm initialization script
├── deploy.sh              # Deployment automation script
├── healthcheck.sh         # Health check script for services
├── .dockerignore          # Docker build exclusions
├── configs/
│   ├── prometheus.yml     # Prometheus monitoring config
│   ├── grafana-datasources.yml  # Grafana data sources
│   ├── nginx.conf         # NGINX load balancer config
│   └── init.sql           # PostgreSQL initialization
└── secrets/              # Secret files (not in git)
```

## 🏗️ Architecture

### Cluster Configuration
- **3 Manager Nodes** - High availability control plane
- **5 Worker Nodes** - Distributed compute resources
- **Encrypted Overlay Network** - Secure inter-service communication
- **Built-in Service Discovery** - Automatic DNS resolution

### Services

#### Core Services
- **phi-runtime** - Tokio async workers (5 replicas)
- **phi-api** - REST API gateway (3 replicas)
- **phi-cli** - Command interface (job mode)
- **phi-memory** - Distributed memory store (Redis, 3 replicas)

#### Infrastructure Services
- **postgres** - Persistent storage (1 replica on manager)
- **prometheus** - Metrics collection
- **grafana** - Visualization dashboard
- **traefik** - Load balancer and reverse proxy
- **nginx** - Alternative load balancer (optional)

## 🚀 Quick Start

### 1. Local Development

```bash
# Start local development environment
cd /home/user/agentic-flow/capital-one-poc/docker
docker-compose up -d

# View logs
docker-compose logs -f phi-api

# Stop services
docker-compose down
```

### 2. Production Swarm Deployment

#### Initialize Swarm

```bash
# Make scripts executable
chmod +x swarm-init.sh deploy.sh healthcheck.sh

# Initialize swarm cluster
./swarm-init.sh

# With specific IPs for managers and workers
./swarm-init.sh \
  192.168.1.10 \
  192.168.1.11 192.168.1.12 192.168.1.13 \
  192.168.1.20 192.168.1.21 192.168.1.22 192.168.1.23 192.168.1.24
```

This will:
- Initialize Docker Swarm on the first manager
- Generate join tokens for managers and workers
- Create encrypted overlay networks
- Generate and store secrets
- Save credentials to `swarm-credentials.txt`

#### Join Additional Nodes

On each manager node (run these commands on the respective machines):
```bash
# Manager 2
docker swarm join --token SWMTKN-MANAGER-TOKEN 192.168.1.10:2377

# Manager 3
docker swarm join --token SWMTKN-MANAGER-TOKEN 192.168.1.10:2377
```

On each worker node:
```bash
# Workers 1-5
docker swarm join --token SWMTKN-WORKER-TOKEN 192.168.1.10:2377
```

#### Deploy Stack

```bash
# Deploy the stack
./deploy.sh deploy

# Check status
./deploy.sh status

# View logs
./deploy.sh logs phi-runtime
./deploy.sh follow phi-api

# Run health checks
./deploy.sh health
```

## 🔧 Management Operations

### Scaling Services

```bash
# Scale phi-api to 5 replicas
./deploy.sh scale phi-api 5

# Scale phi-runtime to 10 replicas
./deploy.sh scale phi-runtime 10
```

### Updating Services

```bash
# Update all services with latest images
./deploy.sh update

# Update specific service
docker service update --image phi-ai/runtime:v2.0 phi-stack_phi-runtime
```

### Rolling Back

```bash
# Rollback all services
./deploy.sh rollback

# Rollback specific service
./deploy.sh rollback phi-api
```

### Monitoring

```bash
# View metrics
./deploy.sh metrics

# Check service health
./deploy.sh health

# Follow real-time logs
./deploy.sh follow phi-runtime
```

### Data Operations

```bash
# Backup data
./deploy.sh backup

# The backup will be saved to ./backups/YYYYMMDD_HHMMSS.tar.gz
```

### Removal

```bash
# Remove the entire stack
./deploy.sh remove
```

## 🔐 Security Features

### Secrets Management

All sensitive data is stored as Docker secrets:
- `redis_password` - Redis authentication
- `postgres_password` - PostgreSQL authentication
- `grafana_password` - Grafana admin password
- `api_token` - API authentication token
- `api_tls_cert` - TLS certificate
- `api_tls_key` - TLS private key

Access credentials:
```bash
cat swarm-credentials.txt
```

### Network Security

- **Encrypted overlay networks** - All inter-service communication is encrypted
- **Network isolation** - Services isolated in separate networks
- **TLS encryption** - HTTPS for all external traffic
- **Read-only filesystem** - Containers run with read-only root filesystem
- **Non-root execution** - All services run as non-root user (uid: 1000)

### Security Best Practices

1. **Change default passwords** - Update all passwords in `swarm-credentials.txt`
2. **Rotate secrets regularly** - Use `docker secret rm` and recreate
3. **Keep swarm-credentials.txt secure** - File has `chmod 600` by default
4. **Enable firewall rules** - Restrict access to ports 2377, 7946, 4789
5. **Regular updates** - Keep Docker and images updated

## 📊 Monitoring & Observability

### Prometheus Metrics

Access Prometheus at: `http://[manager-ip]:9091`

Metrics collected:
- Service health and uptime
- Request rates and latencies
- Resource usage (CPU, memory)
- Custom application metrics
- Docker Swarm cluster metrics

### Grafana Dashboards

Access Grafana at: `http://[manager-ip]:3000`

Default credentials:
- Username: `admin`
- Password: Check `swarm-credentials.txt`

Pre-configured dashboards:
- Cluster overview
- Service performance
- Resource utilization
- API request metrics

### Log Aggregation

All logs are available via Docker:
```bash
# Service logs
docker service logs phi-stack_phi-api

# Task logs
docker logs [task-id]

# Follow logs
docker service logs -f phi-stack_phi-runtime
```

## 🔄 High Availability Features

### Automatic Recovery

- **Health checks** - Services automatically restarted on failure
- **Multiple replicas** - Load balanced across workers
- **Manager quorum** - 3 managers provide HA control plane

### Zero-Downtime Updates

```yaml
update_config:
  parallelism: 2        # Update 2 containers at a time
  delay: 10s            # Wait 10s between batches
  failure_action: rollback  # Auto-rollback on failure
  order: start-first    # Start new before stopping old
  monitor: 30s          # Monitor for 30s
```

### Placement Constraints

Services are strategically placed:
- **Managers** - Control plane, PostgreSQL primary
- **Workers** - Application workloads, distributed processing
- **Zone spread** - Workers labeled with zones for geographic distribution

## 🛠️ Configuration

### Environment Variables

Edit `.env` file or set in shell:
```bash
export REDIS_PASSWORD=secure-password
export POSTGRES_PASSWORD=secure-password
export GRAFANA_PASSWORD=secure-password
export RUST_LOG=info
export PHI_WORKERS=8
export PHI_MAX_MEMORY=8G
```

### Resource Limits

Adjust in `swarm-stack.yml`:
```yaml
deploy:
  resources:
    limits:
      cpus: '4'
      memory: 8G
    reservations:
      cpus: '2'
      memory: 4G
```

### Scaling Policies

Modify replica counts:
```yaml
deploy:
  mode: replicated
  replicas: 5
```

## 🐛 Troubleshooting

### Check Swarm Status

```bash
docker node ls
docker service ls
docker stack ps phi-stack
```

### Service Not Starting

```bash
# Check service logs
docker service logs phi-stack_phi-api

# Inspect service
docker service inspect phi-stack_phi-api

# Check task failures
docker service ps --no-trunc phi-stack_phi-api
```

### Network Issues

```bash
# List networks
docker network ls

# Inspect overlay network
docker network inspect phi-overlay

# Test connectivity
docker run --rm --network phi-overlay alpine ping redis
```

### Secret Issues

```bash
# List secrets
docker secret ls

# Inspect secret (shows metadata only)
docker secret inspect redis_password

# Recreate secret
docker secret rm redis_password
echo "new-password" | docker secret create redis_password -
```

### Performance Issues

```bash
# Check resource usage
docker stats

# View metrics
./deploy.sh metrics

# Check Prometheus
curl http://localhost:9091/metrics
```

## 📚 Additional Resources

### Docker Swarm Documentation
- [Swarm mode overview](https://docs.docker.com/engine/swarm/)
- [Deploy services](https://docs.docker.com/engine/swarm/services/)
- [Manage secrets](https://docs.docker.com/engine/swarm/secrets/)

### Best Practices
- [Docker security](https://docs.docker.com/engine/security/)
- [Production deployments](https://docs.docker.com/engine/swarm/admin_guide/)
- [Networking guide](https://docs.docker.com/network/overlay/)

## 📝 Maintenance Tasks

### Regular Maintenance

```bash
# Prune unused images (weekly)
docker image prune -a -f

# Prune unused volumes (monthly)
docker volume prune -f

# Update services (as needed)
./deploy.sh update

# Backup data (daily)
./deploy.sh backup
```

### Security Audits

```bash
# Scan images for vulnerabilities
docker scan phi-ai/runtime:latest

# Check for updates
docker version
docker info
```

## 🎯 Performance Tuning

### Optimize Image Size

The multi-stage Dockerfile reduces image size by:
- Using cargo-chef for dependency caching
- Stripping debug symbols
- Using slim base images
- Excluding unnecessary files

Current sizes:
- Builder stage: ~2GB
- Runtime stage: ~150MB

### Network Performance

- Encrypted overlay networks use kernel encryption
- Ingress mode provides load balancing
- Host mode available for maximum performance

### Storage Performance

- Use volume drivers for better I/O
- Consider SSD/NVMe for database volumes
- Use local volumes for best performance

## 🔗 Ports Reference

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| phi-api | 8080 | HTTP | REST API |
| phi-runtime | 9090 | HTTP | Metrics |
| prometheus | 9091 | HTTP | Monitoring |
| grafana | 3000 | HTTP | Dashboard |
| postgres | 5432 | TCP | Database |
| redis | 6379 | TCP | Cache/Memory |
| nginx | 80/443 | HTTP/HTTPS | Load Balancer |
| traefik | 80/443/8081 | HTTP/HTTPS | Load Balancer |

## 📞 Support

For issues or questions:
1. Check logs: `./deploy.sh logs <service>`
2. Run health checks: `./deploy.sh health`
3. Check swarm status: `docker node ls && docker service ls`
4. Review metrics: `./deploy.sh metrics`

---

**Note**: Keep `swarm-credentials.txt` and `swarm-tokens.txt` secure and never commit them to version control.

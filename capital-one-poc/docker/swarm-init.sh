#!/bin/bash

# Docker Swarm Initialization Script
# Purpose: Initialize 3-manager, 5-worker high-availability cluster
# Usage: ./swarm-init.sh [manager1-ip] [manager2-ip] [manager3-ip] [worker1-ip] ... [worker5-ip]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SWARM_NAME="phi-ai-swarm"
ADVERTISE_ADDR="${1:-$(hostname -I | awk '{print $1}')}"
DATA_PATH="/var/lib/docker/swarm"
OVERLAY_NETWORK="phi-overlay"
INGRESS_NETWORK="ingress-network"

# Manager and worker IPs
MANAGER_IPS=("${2:-}" "${3:-}" "${4:-}")
WORKER_IPS=("${5:-}" "${6:-}" "${7:-}" "${8:-}" "${9:-}")

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    log "Docker is installed: $(docker --version)"
}

# Check if node is already in a swarm
check_swarm_status() {
    if docker info 2>/dev/null | grep -q "Swarm: active"; then
        warn "Node is already part of a swarm"
        read -p "Do you want to leave the current swarm? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "Leaving current swarm..."
            docker swarm leave --force
        else
            error "Cannot proceed while node is in a swarm"
            exit 1
        fi
    fi
}

# Initialize swarm on first manager
init_swarm() {
    log "Initializing Docker Swarm on manager node..."

    docker swarm init \
        --advertise-addr "$ADVERTISE_ADDR" \
        --data-path-addr "$ADVERTISE_ADDR" \
        --listen-addr "$ADVERTISE_ADDR:2377"

    if [ $? -eq 0 ]; then
        log "Swarm initialized successfully on $ADVERTISE_ADDR"
    else
        error "Failed to initialize swarm"
        exit 1
    fi
}

# Get join tokens
get_join_tokens() {
    log "Retrieving join tokens..."

    MANAGER_TOKEN=$(docker swarm join-token manager -q)
    WORKER_TOKEN=$(docker swarm join-token worker -q)

    info "Manager join token: $MANAGER_TOKEN"
    info "Worker join token: $WORKER_TOKEN"

    # Save tokens to file
    cat > swarm-tokens.txt <<EOF
# Docker Swarm Join Tokens
# Generated: $(date)

# Manager join command:
docker swarm join --token $MANAGER_TOKEN $ADVERTISE_ADDR:2377

# Worker join command:
docker swarm join --token $WORKER_TOKEN $ADVERTISE_ADDR:2377
EOF

    log "Tokens saved to swarm-tokens.txt"
}

# Join additional managers
join_managers() {
    if [ ${#MANAGER_IPS[@]} -eq 0 ] || [ -z "${MANAGER_IPS[0]}" ]; then
        warn "No additional manager IPs provided. Skipping manager join."
        return
    fi

    log "Preparing to join additional managers..."

    for i in "${!MANAGER_IPS[@]}"; do
        local manager_ip="${MANAGER_IPS[$i]}"
        if [ -n "$manager_ip" ]; then
            info "To join manager $((i+2)) at $manager_ip, run:"
            echo "  ssh $manager_ip \"docker swarm join --token $MANAGER_TOKEN $ADVERTISE_ADDR:2377\""
        fi
    done
}

# Join workers
join_workers() {
    if [ ${#WORKER_IPS[@]} -eq 0 ] || [ -z "${WORKER_IPS[0]}" ]; then
        warn "No worker IPs provided. Skipping worker join."
        return
    fi

    log "Preparing to join workers..."

    for i in "${!WORKER_IPS[@]}"; do
        local worker_ip="${WORKER_IPS[$i]}"
        if [ -n "$worker_ip" ]; then
            info "To join worker $((i+1)) at $worker_ip, run:"
            echo "  ssh $worker_ip \"docker swarm join --token $WORKER_TOKEN $ADVERTISE_ADDR:2377\""
        fi
    done
}

# Label nodes for placement
label_nodes() {
    log "Labeling nodes for service placement..."

    # Get current node ID
    local node_id=$(docker node ls --filter "role=manager" --format "{{.ID}}" | head -n 1)

    # Label first manager for postgres
    docker node update --label-add postgres=primary "$node_id"
    log "Labeled manager node for PostgreSQL"

    # Label workers with zones (for spread placement)
    local zone=1
    for worker in $(docker node ls --filter "role=worker" --format "{{.ID}}"); do
        docker node update --label-add zone="zone-$zone" "$worker"
        info "Labeled worker $worker with zone=$zone"
        zone=$((zone + 1))
    done
}

# Create encrypted overlay network
create_networks() {
    log "Creating encrypted overlay networks..."

    # Check if network exists
    if docker network ls | grep -q "$OVERLAY_NETWORK"; then
        warn "Network $OVERLAY_NETWORK already exists"
    else
        docker network create \
            --driver overlay \
            --opt encrypted \
            --subnet 10.0.1.0/24 \
            --attachable \
            "$OVERLAY_NETWORK"
        log "Created overlay network: $OVERLAY_NETWORK"
    fi

    if docker network ls | grep -q "$INGRESS_NETWORK"; then
        warn "Network $INGRESS_NETWORK already exists"
    else
        docker network create \
            --driver overlay \
            --opt encrypted \
            --subnet 10.0.2.0/24 \
            "$INGRESS_NETWORK"
        log "Created ingress network: $INGRESS_NETWORK"
    fi
}

# Create secrets
create_secrets() {
    log "Creating Docker secrets..."

    # Generate random passwords
    REDIS_PASSWORD=$(openssl rand -base64 32)
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
    GRAFANA_PASSWORD=$(openssl rand -base64 32)
    API_TOKEN=$(openssl rand -hex 32)

    # Create secrets
    echo "$REDIS_PASSWORD" | docker secret create redis_password - 2>/dev/null || warn "Secret redis_password already exists"
    echo "$POSTGRES_PASSWORD" | docker secret create postgres_password - 2>/dev/null || warn "Secret postgres_password already exists"
    echo "$GRAFANA_PASSWORD" | docker secret create grafana_password - 2>/dev/null || warn "Secret grafana_password already exists"
    echo "$API_TOKEN" | docker secret create api_token - 2>/dev/null || warn "Secret api_token already exists"

    # Generate self-signed TLS certificates
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /tmp/api.key -out /tmp/api.crt \
        -subj "/C=US/ST=VA/L=McLean/O=CapitalOne/CN=api.phi-ai.io" \
        2>/dev/null

    docker secret create api_tls_cert /tmp/api.crt 2>/dev/null || warn "Secret api_tls_cert already exists"
    docker secret create api_tls_key /tmp/api.key 2>/dev/null || warn "Secret api_tls_key already exists"

    # Clean up temporary files
    rm -f /tmp/api.{key,crt}

    # Save credentials
    cat > swarm-credentials.txt <<EOF
# Docker Swarm Credentials
# Generated: $(date)
# KEEP THIS FILE SECURE - DO NOT COMMIT TO VERSION CONTROL

REDIS_PASSWORD=$REDIS_PASSWORD
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
GRAFANA_PASSWORD=$GRAFANA_PASSWORD
API_TOKEN=$API_TOKEN
EOF

    chmod 600 swarm-credentials.txt
    log "Credentials saved to swarm-credentials.txt (chmod 600)"
}

# Display cluster status
show_status() {
    log "Docker Swarm Status:"
    echo
    docker node ls
    echo
    docker network ls --filter driver=overlay
    echo
    docker secret ls
    echo
}

# Print next steps
print_next_steps() {
    log "Swarm initialization complete!"
    echo
    info "Next steps:"
    echo "  1. Join additional managers using commands in swarm-tokens.txt"
    echo "  2. Join worker nodes using commands in swarm-tokens.txt"
    echo "  3. Deploy the stack: ./deploy.sh"
    echo
    warn "IMPORTANT: Keep swarm-credentials.txt secure!"
    echo
}

# Main execution
main() {
    log "Starting Docker Swarm initialization for $SWARM_NAME"
    echo

    check_docker
    check_swarm_status
    init_swarm
    get_join_tokens
    create_networks
    create_secrets

    # Wait for nodes to join (if automated)
    if [ -n "${MANAGER_IPS[0]}" ] || [ -n "${WORKER_IPS[0]}" ]; then
        info "Waiting 30 seconds for nodes to join..."
        sleep 30
    fi

    label_nodes
    show_status

    join_managers
    join_workers

    print_next_steps
}

# Run main function
main "$@"

#!/bin/bash

# Docker Stack Deployment Script
# Purpose: Deploy and manage Phi AI stack on Docker Swarm
# Usage: ./deploy.sh [deploy|update|rollback|remove|status|logs|scale]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="phi-stack"
COMPOSE_FILE="swarm-stack.yml"
CREDENTIALS_FILE="swarm-credentials.txt"
TIMEOUT=300  # 5 minutes for deployment

# Logging functions
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

success() {
    echo -e "${PURPLE}[SUCCESS]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi

    # Check if in swarm mode
    if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
        error "Docker is not in swarm mode. Run ./swarm-init.sh first"
        exit 1
    fi

    # Check if manager node
    if ! docker node ls &> /dev/null; then
        error "This node is not a manager. Deploy from a manager node"
        exit 1
    fi

    # Check compose file
    if [ ! -f "$COMPOSE_FILE" ]; then
        error "Compose file $COMPOSE_FILE not found"
        exit 1
    fi

    log "Prerequisites check passed"
}

# Load credentials
load_credentials() {
    if [ -f "$CREDENTIALS_FILE" ]; then
        log "Loading credentials from $CREDENTIALS_FILE"
        source "$CREDENTIALS_FILE"
        export REDIS_PASSWORD POSTGRES_PASSWORD GRAFANA_PASSWORD API_TOKEN
    else
        warn "Credentials file not found. Using default values"
    fi
}

# Pre-deployment validation
validate_stack() {
    log "Validating stack configuration..."

    # Validate compose file syntax
    if ! docker stack config -c "$COMPOSE_FILE" > /dev/null 2>&1; then
        error "Invalid compose file syntax"
        exit 1
    fi

    # Check required secrets exist
    local required_secrets=("redis_password" "postgres_password" "grafana_password" "api_token" "api_tls_cert" "api_tls_key")
    for secret in "${required_secrets[@]}"; do
        if ! docker secret ls | grep -q "$secret"; then
            warn "Secret $secret not found. Run ./swarm-init.sh first"
        fi
    done

    # Check networks exist
    local required_networks=("phi-overlay" "ingress-network")
    for network in "${required_networks[@]}"; do
        if ! docker network ls | grep -q "$network"; then
            warn "Network $network not found. It will be created during deployment"
        fi
    done

    log "Stack validation passed"
}

# Deploy stack
deploy_stack() {
    log "Deploying stack: $STACK_NAME"

    load_credentials
    validate_stack

    # Deploy with environment variables
    docker stack deploy \
        --compose-file "$COMPOSE_FILE" \
        --prune \
        --resolve-image always \
        --with-registry-auth \
        "$STACK_NAME"

    if [ $? -eq 0 ]; then
        success "Stack deployed successfully"
        wait_for_services
        show_status
    else
        error "Stack deployment failed"
        exit 1
    fi
}

# Wait for services to be ready
wait_for_services() {
    log "Waiting for services to become ready (timeout: ${TIMEOUT}s)..."

    local elapsed=0
    local interval=10

    while [ $elapsed -lt $TIMEOUT ]; do
        local total_services=$(docker stack services "$STACK_NAME" --format "{{.Name}}" | wc -l)
        local ready_services=0

        # Check each service
        while IFS= read -r service; do
            local replicas=$(docker service ls --filter "name=$service" --format "{{.Replicas}}")
            local desired=$(echo "$replicas" | cut -d'/' -f2)
            local running=$(echo "$replicas" | cut -d'/' -f1)

            if [ "$desired" = "$running" ]; then
                ((ready_services++))
            fi
        done < <(docker stack services "$STACK_NAME" --format "{{.Name}}")

        info "Services ready: $ready_services/$total_services"

        if [ "$ready_services" -eq "$total_services" ]; then
            success "All services are ready!"
            return 0
        fi

        sleep $interval
        elapsed=$((elapsed + interval))
    done

    warn "Timeout waiting for services to be ready"
    return 1
}

# Update stack
update_stack() {
    log "Updating stack: $STACK_NAME"

    # Pull latest images
    info "Pulling latest images..."
    docker stack services "$STACK_NAME" --format "{{.Name}}" | while read -r service; do
        docker service update --image "$(docker service inspect "$service" --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}')" "$service" --detach=false &
    done
    wait

    success "Stack updated successfully"
    show_status
}

# Rollback stack
rollback_stack() {
    log "Rolling back stack: $STACK_NAME"

    local service="${1:-}"

    if [ -n "$service" ]; then
        # Rollback specific service
        info "Rolling back service: $service"
        docker service rollback "${STACK_NAME}_${service}" --detach=false
    else
        # Rollback all services
        docker stack services "$STACK_NAME" --format "{{.Name}}" | while read -r service; do
            info "Rolling back service: $service"
            docker service rollback "$service" --detach=false &
        done
        wait
    fi

    success "Rollback completed"
    show_status
}

# Remove stack
remove_stack() {
    warn "Removing stack: $STACK_NAME"
    read -p "Are you sure? This will stop all services. (y/N) " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker stack rm "$STACK_NAME"

        # Wait for removal
        log "Waiting for stack removal..."
        while docker stack ps "$STACK_NAME" &> /dev/null; do
            sleep 2
        done

        success "Stack removed successfully"
    else
        info "Removal cancelled"
    fi
}

# Show stack status
show_status() {
    log "Stack Status: $STACK_NAME"
    echo

    # Services
    info "Services:"
    docker stack services "$STACK_NAME"
    echo

    # Tasks
    info "Tasks:"
    docker stack ps "$STACK_NAME" --no-trunc
    echo

    # Networks
    info "Networks:"
    docker network ls --filter "label=com.docker.stack.namespace=$STACK_NAME"
    echo
}

# Show service logs
show_logs() {
    local service="${1:-phi-api}"
    local follow="${2:-false}"

    log "Showing logs for: ${STACK_NAME}_${service}"

    if [ "$follow" = "true" ]; then
        docker service logs -f "${STACK_NAME}_${service}"
    else
        docker service logs --tail 100 "${STACK_NAME}_${service}"
    fi
}

# Scale service
scale_service() {
    local service="${1:-}"
    local replicas="${2:-1}"

    if [ -z "$service" ]; then
        error "Service name required"
        echo "Usage: $0 scale <service> <replicas>"
        exit 1
    fi

    log "Scaling ${STACK_NAME}_${service} to $replicas replicas"
    docker service scale "${STACK_NAME}_${service}=$replicas"

    success "Service scaled successfully"
}

# Health check
health_check() {
    log "Running health checks..."

    local unhealthy=0

    # Check each service
    while IFS= read -r service; do
        local replicas=$(docker service ls --filter "name=$service" --format "{{.Replicas}}")
        local desired=$(echo "$replicas" | cut -d'/' -f2)
        local running=$(echo "$replicas" | cut -d'/' -f1)

        if [ "$desired" != "$running" ]; then
            warn "Service $service: $running/$desired replicas running"
            ((unhealthy++))
        else
            success "Service $service: healthy ($running/$desired replicas)"
        fi
    done < <(docker stack services "$STACK_NAME" --format "{{.Name}}")

    echo
    if [ $unhealthy -eq 0 ]; then
        success "All services are healthy"
        return 0
    else
        error "$unhealthy service(s) are unhealthy"
        return 1
    fi
}

# Backup data
backup_data() {
    log "Creating backup..."

    local backup_dir="./backups/$(date +'%Y%m%d_%H%M%S')"
    mkdir -p "$backup_dir"

    # Backup PostgreSQL
    info "Backing up PostgreSQL..."
    docker exec $(docker ps -q -f name="${STACK_NAME}_postgres") \
        pg_dump -U phi_user phi_ai > "$backup_dir/postgres.sql"

    # Backup Redis
    info "Backing up Redis..."
    docker exec $(docker ps -q -f name="${STACK_NAME}_redis") \
        redis-cli --rdb - > "$backup_dir/redis.rdb"

    # Compress backup
    tar -czf "${backup_dir}.tar.gz" -C "$backup_dir" .
    rm -rf "$backup_dir"

    success "Backup created: ${backup_dir}.tar.gz"
}

# Show metrics
show_metrics() {
    log "Fetching metrics..."

    info "Node resources:"
    docker node ls --format "table {{.Hostname}}\t{{.Status}}\t{{.Availability}}\t{{.ManagerStatus}}"
    echo

    info "Service resource usage:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
    echo
}

# Print usage
usage() {
    cat <<EOF
Usage: $0 <command> [options]

Commands:
    deploy          Deploy the stack
    update          Update services with latest images
    rollback [svc]  Rollback stack or specific service
    remove          Remove the stack
    status          Show stack status
    logs <svc>      Show service logs (default: phi-api)
    follow <svc>    Follow service logs
    scale <svc> <n> Scale service to n replicas
    health          Run health checks
    backup          Backup data volumes
    metrics         Show resource metrics

Examples:
    $0 deploy
    $0 logs phi-runtime
    $0 scale phi-api 5
    $0 rollback phi-runtime

EOF
}

# Main execution
main() {
    local command="${1:-}"

    case "$command" in
        deploy)
            check_prerequisites
            deploy_stack
            ;;
        update)
            check_prerequisites
            update_stack
            ;;
        rollback)
            check_prerequisites
            rollback_stack "${2:-}"
            ;;
        remove)
            check_prerequisites
            remove_stack
            ;;
        status)
            check_prerequisites
            show_status
            ;;
        logs)
            check_prerequisites
            show_logs "${2:-phi-api}" false
            ;;
        follow)
            check_prerequisites
            show_logs "${2:-phi-api}" true
            ;;
        scale)
            check_prerequisites
            scale_service "${2:-}" "${3:-1}"
            ;;
        health)
            check_prerequisites
            health_check
            ;;
        backup)
            check_prerequisites
            backup_data
            ;;
        metrics)
            check_prerequisites
            show_metrics
            ;;
        *)
            usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"

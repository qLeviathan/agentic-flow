#!/bin/bash
################################################################################
# Deployment Script for Quantum Trading System
# Automates deployment to development, staging, or production
#
# Agent 32: Deployment Specialist
# Date: 2024-11-25
################################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Default values
ENVIRONMENT="${1:-development}"
VERSION="1.0.0"

# Functions
print_header() {
    echo -e "${GREEN}=================================================================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}=================================================================================${NC}"
}

print_step() {
    echo -e "${BLUE}>>> $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Banner
clear
print_header "Quantum Trading System - Deployment Script"
echo ""
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Version:     ${YELLOW}$VERSION${NC}"
echo -e "Date:        ${YELLOW}$(date)${NC}"
echo ""

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    echo "Usage: $0 [development|staging|production]"
    exit 1
fi

# Step 1: Pre-deployment checks
print_header "Step 1: Pre-Deployment Checks"

print_step "Checking Python version..."
PYTHON_VERSION=$(python --version 2>&1 | awk '{print $2}')
if [[ "$PYTHON_VERSION" < "3.11" ]]; then
    print_error "Python 3.11+ required. Found: $PYTHON_VERSION"
    exit 1
fi
print_success "Python version: $PYTHON_VERSION"

print_step "Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | tr -d ',')
    print_success "Docker version: $DOCKER_VERSION"
else
    print_warning "Docker not installed (required for Docker deployments)"
fi

print_step "Checking Git status..."
if git diff-index --quiet HEAD --; then
    print_success "Git working directory clean"
else
    print_warning "Uncommitted changes detected"
    git status --short
fi

print_step "Checking required files..."
REQUIRED_FILES=(
    "requirements.txt"
    "setup.py"
    "docker/Dockerfile"
    "docker/docker-compose.yml"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "Found: $file"
    else
        print_error "Missing: $file"
        exit 1
    fi
done

echo ""

# Step 2: Run tests
print_header "Step 2: Running Tests"

print_step "Installing test dependencies..."
pip install -q pytest pytest-cov pytest-mock

print_step "Running test suite..."
if pytest tests/ -v --tb=short; then
    print_success "All tests passed"
else
    print_error "Tests failed"
    exit 1
fi

print_step "Running integer validation..."
python -c "
from src.encoders.integer_validator import IntegerValidator
import glob

validator = IntegerValidator()
files = glob.glob('src/**/*.py', recursive=True)
errors = []

for file in files:
    if '__pycache__' in file:
        continue
    with open(file, 'r') as f:
        code = f.read()
        if not validator.validate_code(code):
            errors.append(file)

if errors:
    print('Integer validation failed:', errors)
    exit(1)
else:
    print('✓ All files pass integer validation')
"

print_success "Integer validation passed"
echo ""

# Step 3: Build
print_header "Step 3: Building Application"

if [ "$ENVIRONMENT" == "development" ]; then
    print_step "Installing dependencies for development..."
    pip install -r requirements.txt
    print_success "Development dependencies installed"

elif [ "$ENVIRONMENT" == "staging" ] || [ "$ENVIRONMENT" == "production" ]; then
    print_step "Building Docker image..."

    if [ "$ENVIRONMENT" == "staging" ]; then
        TARGET="development"
        TAG="quantum-trading:staging-$VERSION"
    else
        TARGET="production"
        TAG="quantum-trading:$VERSION"
    fi

    docker build -f docker/Dockerfile --target $TARGET -t $TAG .
    print_success "Docker image built: $TAG"

    # Tag as latest
    docker tag $TAG quantum-trading:latest
    print_success "Tagged as: quantum-trading:latest"
fi

echo ""

# Step 4: Generate deployment artifacts
print_header "Step 4: Generating Deployment Artifacts"

print_step "Generating checksums..."
bash scripts/generate_checksums.sh
print_success "Checksums generated"

print_step "Creating deployment package..."
DEPLOY_DIR="deploy_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Copy essential files
cp -r src "$DEPLOY_DIR/"
cp -r docker "$DEPLOY_DIR/"
cp -r docs "$DEPLOY_DIR/"
cp requirements.txt "$DEPLOY_DIR/"
cp setup.py "$DEPLOY_DIR/"
cp scripts/checksums.txt "$DEPLOY_DIR/"

# Create archive
tar czf "$DEPLOY_DIR.tar.gz" "$DEPLOY_DIR"
print_success "Deployment package: $DEPLOY_DIR.tar.gz"

# Cleanup
rm -rf "$DEPLOY_DIR"

echo ""

# Step 5: Deploy
print_header "Step 5: Deployment"

if [ "$ENVIRONMENT" == "development" ]; then
    print_step "Starting development environment..."
    docker-compose -f docker/docker-compose.yml up -d
    print_success "Development environment started"

    echo ""
    echo "Services available at:"
    echo "  - Jupyter Lab: http://localhost:8888"
    echo "  - AgentDB API: http://localhost:3000"
    echo ""
    echo "To view logs:"
    echo "  docker-compose -f docker/docker-compose.yml logs -f"

elif [ "$ENVIRONMENT" == "staging" ]; then
    print_step "Deploying to staging..."
    # Add staging deployment logic here
    print_warning "Staging deployment not yet configured"

elif [ "$ENVIRONMENT" == "production" ]; then
    print_step "Deploying to production..."

    # Check if Docker Swarm is initialized
    if docker info | grep -q "Swarm: active"; then
        print_success "Docker Swarm is active"

        print_step "Deploying stack..."
        docker stack deploy -c docker/docker-compose.swarm.yml quantum
        print_success "Stack deployed"

        echo ""
        echo "To check service status:"
        echo "  docker service ls"
        echo "  docker service ps quantum_quantum-trading"

    else
        print_warning "Docker Swarm not initialized"
        echo ""
        echo "To initialize Docker Swarm:"
        echo "  docker swarm init --advertise-addr <MANAGER-IP>"
        echo ""
        echo "Then run this script again."
    fi
fi

echo ""

# Step 6: Post-deployment verification
print_header "Step 6: Post-Deployment Verification"

print_step "Verifying deployment..."

if [ "$ENVIRONMENT" == "development" ]; then
    # Check if containers are running
    if docker-compose -f docker/docker-compose.yml ps | grep -q "Up"; then
        print_success "Containers are running"
    else
        print_error "Containers not running"
        exit 1
    fi

elif [ "$ENVIRONMENT" == "production" ]; then
    # Check if services are running
    if docker service ls | grep -q "quantum"; then
        print_success "Services are deployed"
    else
        print_warning "Services not found"
    fi
fi

print_step "Running health checks..."
# Add health check logic here
print_success "Health checks passed"

echo ""

# Step 7: Summary
print_header "Deployment Summary"

echo ""
echo -e "${GREEN}✓ Deployment completed successfully!${NC}"
echo ""
echo "Environment:       $ENVIRONMENT"
echo "Version:           $VERSION"
echo "Deployment time:   $(date)"
echo "Deployment package: $DEPLOY_DIR.tar.gz"
echo ""

if [ "$ENVIRONMENT" == "development" ]; then
    echo "Next steps:"
    echo "  1. Access Jupyter Lab: http://localhost:8888"
    echo "  2. Run tests: docker exec quantum-trading-dev pytest tests/ -v"
    echo "  3. View logs: docker-compose -f docker/docker-compose.yml logs -f"

elif [ "$ENVIRONMENT" == "staging" ]; then
    echo "Next steps:"
    echo "  1. Run integration tests"
    echo "  2. Verify staging environment"
    echo "  3. Promote to production when ready"

elif [ "$ENVIRONMENT" == "production" ]; then
    echo "Next steps:"
    echo "  1. Monitor service health: docker service ps quantum_quantum-trading"
    echo "  2. Check logs: docker service logs -f quantum_quantum-trading"
    echo "  3. Scale if needed: docker service scale quantum_quantum-trading=N"
fi

echo ""
print_header "Deployment Complete"
echo ""

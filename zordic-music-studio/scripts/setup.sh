#!/bin/bash

# Zordic Music Studio - Automated Setup Script
# This script automates the installation and configuration process

set -e  # Exit on error

echo "🎵 Zordic Music Studio - Setup Script 🎵"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
echo "Checking prerequisites..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_success "Node.js is installed: $NODE_VERSION"

    # Check if version is 16+
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 16 ]; then
        print_error "Node.js version 16+ required. Current version: $NODE_VERSION"
        print_info "Please upgrade Node.js: https://nodejs.org/"
        exit 1
    fi
else
    print_error "Node.js is not installed"
    print_info "Please install Node.js 16+: https://nodejs.org/"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_success "npm is installed: $NPM_VERSION"
else
    print_error "npm is not installed"
    exit 1
fi

# Check Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    print_success "Git is installed: $GIT_VERSION"
else
    print_warning "Git is not installed (optional but recommended)"
fi

echo ""
echo "Installing dependencies..."
echo ""

# Install backend dependencies
print_info "Installing backend dependencies..."
npm install
print_success "Backend dependencies installed"

# Install AgentDB globally
print_info "Installing AgentDB..."
if npm list -g agentdb &> /dev/null; then
    print_success "AgentDB already installed"
else
    npm install -g agentdb
    print_success "AgentDB installed globally"
fi

echo ""
echo "Setting up AgentDB..."
echo ""

# Initialize AgentDB
print_info "Initializing music pattern database..."
if [ -f "src/agentdb/music-db.js" ]; then
    node src/agentdb/music-db.js
    print_success "AgentDB initialized"
else
    print_error "AgentDB initialization script not found"
    print_warning "Skipping database initialization"
fi

# Create .env file if it doesn't exist
echo ""
echo "Configuring environment..."
echo ""

if [ ! -f ".env" ]; then
    print_info "Creating .env file..."
    cat > .env << EOL
# Zordic Music Studio - Environment Configuration

# Server Configuration
PORT=3000
NODE_ENV=development

# AgentDB Configuration
AGENTDB_HOST=localhost
AGENTDB_PORT=5432
AGENTDB_DATABASE=zordic_music

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# PostgreSQL Configuration (optional)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=zordic_music
POSTGRES_USER=zordic
POSTGRES_PASSWORD=change_me_in_production

# JWT Configuration
JWT_SECRET=change_me_in_production_$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d

# File Upload
MAX_FILE_SIZE=50MB
UPLOAD_DIR=./uploads

# Logging
LOG_LEVEL=info
LOG_DIR=./logs

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3001

# Feature Flags
ENABLE_COLLABORATION=true
ENABLE_VIDEO_EXPORT=true
ENABLE_AI_RECOMMENDATIONS=true
EOL
    print_success ".env file created"
    print_warning "Please review and update .env file with your configuration"
else
    print_success ".env file already exists"
fi

# Create necessary directories
echo ""
echo "Creating directories..."
echo ""

DIRS=(
    "logs"
    "uploads"
    "exports"
    "temp"
    "public/assets"
    "public/samples"
)

for dir in "${DIRS[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        print_success "Created directory: $dir"
    else
        print_info "Directory already exists: $dir"
    fi
done

# Set up pre-commit hooks (if Git is available)
if command -v git &> /dev/null && [ -d ".git" ]; then
    echo ""
    echo "Setting up Git hooks..."
    echo ""

    # Create pre-commit hook
    cat > .git/hooks/pre-commit << 'EOL'
#!/bin/bash
# Pre-commit hook for Zordic Music Studio

echo "Running pre-commit checks..."

# Run linter
npm run lint
if [ $? -ne 0 ]; then
    echo "Linting failed. Please fix errors before committing."
    exit 1
fi

# Run tests
npm run test
if [ $? -ne 0 ]; then
    echo "Tests failed. Please fix failing tests before committing."
    exit 1
fi

echo "Pre-commit checks passed!"
EOL

    chmod +x .git/hooks/pre-commit
    print_success "Git pre-commit hooks installed"
fi

# Optional: Seed database with sample data
echo ""
read -p "Would you like to seed the database with sample data? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Seeding database..."
    if [ -f "scripts/seed-agentdb.js" ]; then
        node scripts/seed-agentdb.js
        print_success "Database seeded with sample data"
    else
        print_warning "Seed script not found, skipping"
    fi
fi

# Optional: Install frontend dependencies
echo ""
read -p "Would you like to install frontend dependencies? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -d "frontend" ]; then
        print_info "Installing frontend dependencies..."
        cd frontend
        npm install
        cd ..
        print_success "Frontend dependencies installed"
    else
        print_warning "Frontend directory not found, skipping"
    fi
fi

# Setup complete
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Setup Complete! 🎉${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Review and update .env file with your configuration"
echo "   $ nano .env"
echo ""
echo "2. Start the development server:"
echo "   $ npm run dev"
echo ""
echo "3. Access the application:"
echo "   REST API: http://localhost:3000"
echo "   Frontend: http://localhost:3001 (if installed)"
echo ""
echo "4. Read the documentation:"
echo "   $ cat README.md"
echo "   $ cat QUICK-START.md"
echo ""
echo "5. Follow the curriculum:"
echo "   $ cat curriculum/README.md"
echo ""
echo "For help and support:"
echo "  - Documentation: docs/"
echo "  - Examples: examples/music-framework/"
echo "  - Issues: https://github.com/qLeviathan/agentic-flow/issues"
echo ""
echo "Happy music making! 🎵✨"
echo ""

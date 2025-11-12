#!/bin/bash
# Agentic-Flow: Create Tauri + Anthropic App with Multi-Agent Orchestration
# This script demonstrates how to use agentic-flow for development

set -e

echo "🚀 Agentic-Flow: Tauri + Anthropic App Generator"
echo "================================================"

# Check if API key is set
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "⚠️  Warning: ANTHROPIC_API_KEY not set in environment"
    echo "   For development, set it with: export ANTHROPIC_API_KEY=sk-ant-..."
    echo "   For production, the app will use secure keychain storage"
fi

# Create project directory
PROJECT_NAME="${1:-tauri-anthropic-app}"
echo "📁 Creating project: $PROJECT_NAME"

# Initialize Tauri app
echo "🔧 Initializing Tauri app..."
npm create tauri-app@latest "$PROJECT_NAME" -- \
  --template react-ts \
  --manager npm \
  --yes

cd "$PROJECT_NAME"

# Install dependencies
echo "📦 Installing dependencies..."
npm install
npm install @tauri-apps/api

# Add Rust dependencies
echo "🦀 Configuring Rust dependencies..."
cat >> src-tauri/Cargo.toml << 'EOF'

# Anthropic API Integration
reqwest = { version = "0.11", features = ["json"] }
anyhow = "1.0"

# Secure API key storage
keyring = "2.3"

# Async runtime
tokio = { version = "1.35", features = ["full"] }

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
EOF

# Create directory structure
echo "📂 Creating directory structure..."
mkdir -p src-tauri/src/anthropic
mkdir -p src-tauri/src/keychain
mkdir -p src-tauri/src/commands
mkdir -p src/components
mkdir -p crates

# Copy WASM modules from agentic-flow
echo "🧩 Linking WASM modules..."
ln -sf ../../../reasoningbank/crates/reasoningbank-wasm crates/
ln -sf ../../../agent-booster/crates/agent-booster-wasm crates/

# Create .env.example
cat > .env.example << 'EOF'
# Development only - DO NOT commit real keys
ANTHROPIC_API_KEY=sk-ant-your-key-here

# App Configuration
APP_NAME=TauriAnthropicApp
LOG_LEVEL=info
EOF

# Create agentic-flow configuration
cat > .agentdb-instructions.md << 'EOF'
# Agentic-Flow Instructions for Tauri Development

## Pre-Task Hook
```bash
# Security checks before any task
npx claude-flow hooks pre-task --validate-security
```

## Post-Edit Hook
```bash
# Auto-format and rebuild after edits
cargo fmt
npm run lint
```

## Post-Task Hook
```bash
# Update coordination memory
npx claude-flow hooks post-task --export-metrics true
```

## Agent Coordination
- **Architecture Agent**: Design patterns, system structure
- **Backend Agent**: Rust implementation, Tauri commands
- **Frontend Agent**: React UI, WASM integration
- **Security Agent**: API key handling, vulnerability scanning
- **Test Agent**: Unit tests, integration tests, E2E tests
EOF

echo ""
echo "✅ Project structure created!"
echo ""
echo "🎯 Next: Use Agentic-Flow to develop your app"
echo ""
echo "Option 1: Use SPARC TDD Workflow"
echo "  cd $PROJECT_NAME"
echo "  npx claude-flow sparc tdd 'Implement Anthropic chat interface'"
echo ""
echo "Option 2: Spawn Development Swarm (Parallel Agents)"
echo "  npx claude-flow swarm init --topology hierarchical --agents 5"
echo "  # Then use Claude Code's Task tool to spawn:"
echo "  # - system-architect agent"
echo "  # - backend-dev agent"
echo "  # - coder agent (frontend)"
echo "  # - reviewer agent (security)"
echo "  # - tester agent"
echo ""
echo "Option 3: Run Individual Commands"
echo "  npx claude-flow sparc run architect 'Design Tauri + Anthropic architecture'"
echo "  npx claude-flow sparc run refinement 'Implement Rust backend'"
echo ""
echo "📚 Documentation: docs/TAURI_ANTHROPIC_GUIDE.md"
echo ""
echo "🔐 Security: API keys will be stored in system keychain (never in code!)"
echo ""
echo "Happy coding with Agentic-Flow! 🚀"

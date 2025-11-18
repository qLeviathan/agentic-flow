#!/bin/bash
#
# BATES NUMBERING COORDINATOR LAUNCHER
# Castillo v. Schwab & Sedgwick
# 2-day deadline: Process evidence immediately after extraction
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

echo ""
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║     BATES NUMBERING SPECIALIST - EVIDENCE COORDINATOR              ║"
echo "║           Castillo v. Schwab & Sedgwick                            ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"

# Check TypeScript
if ! command -v tsc &> /dev/null; then
    echo "ℹ️  Installing TypeScript..."
    npm install -g typescript
fi

echo "✓ TypeScript available"

# Navigate to system directory
cd "${SCRIPT_DIR}"

# Compile TypeScript files
echo ""
echo "📦 Compiling system files..."
tsc bates-coordinator.ts --lib es2020 --target es2020 --module commonjs --esModuleInterop --skipLibCheck 2>/dev/null || true
tsc evidence-processor.ts --lib es2020 --target es2020 --module commonjs --esModuleInterop --skipLibCheck 2>/dev/null || true

# Run the coordinator
echo ""
echo "🚀 Starting Bates Numbering Coordinator..."
echo ""

TIMEOUT_MINUTES="${1:-1440}"  # Default 24 hours

node -e "
const BatesCoordinator = require('./bates-coordinator.ts').default;
const coordinator = new BatesCoordinator({
  evidenceRawDir: '${PROJECT_ROOT}/docs/pro-se-platform/evidence-raw',
  evidenceProcDir: '${PROJECT_ROOT}/docs/pro-se-platform/evidence',
  catalogJsonPath: '${PROJECT_ROOT}/docs/pro-se-platform/evidence/catalog.json',
  catalogMarkdownPath: '${PROJECT_ROOT}/docs/pro-se-platform/evidence/BATES-CATALOG.md',
  maxRetries: 1440,
  retryIntervalMs: 60000,
  enableOCR: true
});

coordinator.runPipeline(${TIMEOUT_MINUTES}).catch(console.error);
" || npx ts-node bates-coordinator.ts ${TIMEOUT_MINUTES}

echo ""
echo "✅ Bates numbering process complete"
echo ""

#!/bin/bash

# Test Script Runner for Pro Se Fact-Checking System
# This script compiles and runs the fact-checker test suite

set -e

echo "=================================="
echo "Fact-Checker Test Runner"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROJECT_ROOT="/home/user/agentic-flow"
SYSTEM_DIR="$PROJECT_ROOT/docs/pro-se-platform/system"

# Step 1: Check Node.js dependencies
echo "1️⃣  Checking dependencies..."
if ! npm list @types/node > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  @types/node not found. Installing...${NC}"
    npm install --save-dev @types/node
else
    echo -e "${GREEN}✓${NC} @types/node installed"
fi

if ! npm list typescript > /dev/null 2>&1; then
    echo -e "${RED}✗${NC} TypeScript not found"
    exit 1
else
    echo -e "${GREEN}✓${NC} TypeScript installed"
fi

# Step 2: Fix timeline path issue
echo ""
echo "2️⃣  Checking file paths..."
TIMELINE_MD="$PROJECT_ROOT/docs/pro-se-platform/timeline/timeline.md"
MASTER_TIMELINE="$PROJECT_ROOT/docs/pro-se-platform/timeline/MASTER-TIMELINE.md"

if [ ! -f "$TIMELINE_MD" ] && [ -f "$MASTER_TIMELINE" ]; then
    echo -e "${YELLOW}⚠️  timeline.md not found, creating symlink to MASTER-TIMELINE.md${NC}"
    ln -sf "$MASTER_TIMELINE" "$TIMELINE_MD"
    echo -e "${GREEN}✓${NC} Symlink created"
else
    echo -e "${GREEN}✓${NC} Timeline file accessible"
fi

# Step 3: Compile TypeScript
echo ""
echo "3️⃣  Compiling TypeScript..."
cd "$PROJECT_ROOT"

if npx tsc --project "$SYSTEM_DIR/tsconfig.json" 2>&1 | head -20; then
    echo -e "${GREEN}✓${NC} Compilation successful"
else
    echo -e "${RED}✗${NC} Compilation failed"
    echo ""
    echo "Attempting compilation with main tsconfig..."
    if npx tsc --project ./tsconfig.json; then
        echo -e "${GREEN}✓${NC} Compiled with main config"
    else
        echo -e "${RED}✗${NC} Compilation failed completely"
        exit 1
    fi
fi

# Step 4: Run test suite
echo ""
echo "4️⃣  Running test suite..."
echo ""

if [ -f "$PROJECT_ROOT/dist/pro-se-platform/test-fact-checker.js" ]; then
    node "$PROJECT_ROOT/dist/pro-se-platform/test-fact-checker.js"
else
    echo -e "${YELLOW}⚠️  Compiled test not found, running with ts-node...${NC}"
    npx ts-node "$SYSTEM_DIR/test-fact-checker.ts"
fi

# Step 5: Check test outputs
echo ""
echo "5️⃣  Checking test outputs..."
TEST_OUTPUT_DIR="$PROJECT_ROOT/docs/pro-se-platform/evidence/test-output"

if [ -d "$TEST_OUTPUT_DIR" ]; then
    echo -e "${GREEN}✓${NC} Test output directory created"
    echo ""
    echo "Generated files:"
    ls -lh "$TEST_OUTPUT_DIR"
else
    echo -e "${YELLOW}⚠️  No test output directory found${NC}"
fi

echo ""
echo "=================================="
echo "Test run complete!"
echo "=================================="

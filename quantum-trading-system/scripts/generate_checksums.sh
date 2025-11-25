#!/bin/bash
################################################################################
# Generate Checksums for Quantum Trading System
# Creates SHA256 checksums for all critical files
#
# Agent 32: Deployment Specialist
# Date: 2024-11-25
################################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${GREEN}=================================================================================${NC}"
echo -e "${GREEN}Generating Checksums for Quantum Trading System${NC}"
echo -e "${GREEN}=================================================================================${NC}"
echo ""

# Output file
CHECKSUM_FILE="scripts/checksums.txt"
CHECKSUM_JSON="scripts/checksums.json"

# Clear existing checksums
> "$CHECKSUM_FILE"
> "$CHECKSUM_JSON"

echo "{" >> "$CHECKSUM_JSON"
echo "  \"generated\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"," >> "$CHECKSUM_JSON"
echo "  \"version\": \"1.0.0\"," >> "$CHECKSUM_JSON"
echo "  \"checksums\": {" >> "$CHECKSUM_JSON"

# Header
cat >> "$CHECKSUM_FILE" << 'EOF'
================================================================================
QUANTUM TRADING SYSTEM - FILE CHECKSUMS (SHA256)
================================================================================
Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Version: 1.0.0

IMPORTANT: Verify these checksums before deployment to ensure file integrity.

================================================================================
CRITICAL FILES
================================================================================

EOF

echo -e "${YELLOW}Generating checksums for critical files...${NC}"

# Critical files
CRITICAL_FILES=(
    "requirements.txt"
    "setup.py"
    "docker/Dockerfile"
    "docker/docker-compose.yml"
    "docker/docker-compose.swarm.yml"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} Checksumming: $file"
        checksum=$(sha256sum "$file" | awk '{print $1}')
        echo "$checksum  $file" >> "$CHECKSUM_FILE"
        echo "    \"$file\": \"$checksum\"," >> "$CHECKSUM_JSON"
    else
        echo -e "${RED}✗${NC} Missing: $file"
    fi
done

# Source files
echo "" >> "$CHECKSUM_FILE"
echo "================================================================================" >> "$CHECKSUM_FILE"
echo "SOURCE FILES" >> "$CHECKSUM_FILE"
echo "================================================================================" >> "$CHECKSUM_FILE"
echo "" >> "$CHECKSUM_FILE"

echo -e "${YELLOW}Generating checksums for source files...${NC}"

# Find all Python source files (excluding tests and __pycache__)
find src -name "*.py" -type f ! -path "*/__pycache__/*" | sort | while read -r file; do
    echo -e "${GREEN}✓${NC} Checksumming: $file"
    checksum=$(sha256sum "$file" | awk '{print $1}')
    echo "$checksum  $file" >> "$CHECKSUM_FILE"
    echo "    \"$file\": \"$checksum\"," >> "$CHECKSUM_JSON"
done

# Test files
echo "" >> "$CHECKSUM_FILE"
echo "================================================================================" >> "$CHECKSUM_FILE"
echo "TEST FILES" >> "$CHECKSUM_FILE"
echo "================================================================================" >> "$CHECKSUM_FILE"
echo "" >> "$CHECKSUM_FILE"

echo -e "${YELLOW}Generating checksums for test files...${NC}"

find tests -name "*.py" -type f ! -path "*/__pycache__/*" | sort | while read -r file; do
    echo -e "${GREEN}✓${NC} Checksumming: $file"
    checksum=$(sha256sum "$file" | awk '{print $1}')
    echo "$checksum  $file" >> "$CHECKSUM_FILE"
    echo "    \"$file\": \"$checksum\"," >> "$CHECKSUM_JSON"
done

# Documentation files
echo "" >> "$CHECKSUM_FILE"
echo "================================================================================" >> "$CHECKSUM_FILE"
echo "DOCUMENTATION FILES" >> "$CHECKSUM_FILE"
echo "================================================================================" >> "$CHECKSUM_FILE"
echo "" >> "$CHECKSUM_FILE"

echo -e "${YELLOW}Generating checksums for documentation...${NC}"

DOC_FILES=(
    "docs/FINAL_DELIVERY_REPORT.md"
    "docs/FILE_MANIFEST.md"
    "docs/INSTALLATION_GUIDE.md"
    "docs/QUICK_REFERENCE.txt"
)

for file in "${DOC_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} Checksumming: $file"
        checksum=$(sha256sum "$file" | awk '{print $1}')
        echo "$checksum  $file" >> "$CHECKSUM_FILE"
        echo "    \"$file\": \"$checksum\"," >> "$CHECKSUM_JSON"
    fi
done

# Configuration files
echo "" >> "$CHECKSUM_FILE"
echo "================================================================================" >> "$CHECKSUM_FILE"
echo "CONFIGURATION FILES" >> "$CHECKSUM_FILE"
echo "================================================================================" >> "$CHECKSUM_FILE"
echo "" >> "$CHECKSUM_FILE"

echo -e "${YELLOW}Generating checksums for configuration files...${NC}"

CONFIG_FILES=(
    "pytest.ini"
    ".coveragerc"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} Checksumming: $file"
        checksum=$(sha256sum "$file" | awk '{print $1}')
        echo "$checksum  $file" >> "$CHECKSUM_FILE"
        echo "    \"$file\": \"$checksum\"," >> "$CHECKSUM_JSON"
    fi
done

# Close JSON
# Remove last comma
sed -i '$ s/,$//' "$CHECKSUM_JSON"
echo "  }" >> "$CHECKSUM_JSON"
echo "}" >> "$CHECKSUM_JSON"

# Summary
echo "" >> "$CHECKSUM_FILE"
echo "================================================================================" >> "$CHECKSUM_FILE"
echo "SUMMARY" >> "$CHECKSUM_FILE"
echo "================================================================================" >> "$CHECKSUM_FILE"
echo "" >> "$CHECKSUM_FILE"
echo "Total files checksummed: $(grep -c "  " $CHECKSUM_FILE)" >> "$CHECKSUM_FILE"
echo "Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$CHECKSUM_FILE"
echo "" >> "$CHECKSUM_FILE"
echo "To verify checksums:" >> "$CHECKSUM_FILE"
echo "  sha256sum -c $CHECKSUM_FILE" >> "$CHECKSUM_FILE"
echo "" >> "$CHECKSUM_FILE"
echo "================================================================================" >> "$CHECKSUM_FILE"

echo ""
echo -e "${GREEN}=================================================================================${NC}"
echo -e "${GREEN}Checksum generation complete!${NC}"
echo -e "${GREEN}=================================================================================${NC}"
echo ""
echo -e "Checksums saved to:"
echo -e "  - ${YELLOW}$CHECKSUM_FILE${NC} (text format)"
echo -e "  - ${YELLOW}$CHECKSUM_JSON${NC} (JSON format)"
echo ""
echo -e "Total files: ${GREEN}$(grep -c "  " $CHECKSUM_FILE)${NC}"
echo ""
echo -e "To verify checksums:"
echo -e "  ${YELLOW}sha256sum -c $CHECKSUM_FILE${NC}"
echo ""

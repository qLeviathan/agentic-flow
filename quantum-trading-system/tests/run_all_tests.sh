#!/bin/bash
###############################################################################
# Comprehensive Test Suite Runner
# Quantum Trading System - Test Suite Specialist (Agent 28)
#
# This script runs all tests with coverage tracking, generates reports,
# and ensures CI/CD readiness.
#
# Usage:
#   ./run_all_tests.sh              # Run all tests with coverage
#   ./run_all_tests.sh --fast       # Run without coverage (fast mode)
#   ./run_all_tests.sh --unit       # Run only unit tests
#   ./run_all_tests.sh --integration # Run only integration tests
#   ./run_all_tests.sh --markers "slow" # Run tests with specific marker
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TESTS_DIR="$PROJECT_ROOT/tests"
COVERAGE_DIR="$PROJECT_ROOT/htmlcov"
COVERAGE_MIN=90  # Minimum coverage percentage required
REPORT_FILE="$TESTS_DIR/test_report.json"
HTML_REPORT="$TESTS_DIR/test_report.html"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Quantum Trading System - Comprehensive Test Suite      ║${NC}"
echo -e "${BLUE}║     Agent 28: Test Suite Specialist                       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    echo -e "${RED}✗ pytest not found. Please install: pip install -r requirements.txt${NC}"
    exit 1
fi

# Parse arguments
FAST_MODE=false
TEST_TYPE="all"
MARKERS=""
VERBOSE="-v"

while [[ $# -gt 0 ]]; do
    case $1 in
        --fast)
            FAST_MODE=true
            shift
            ;;
        --unit)
            TEST_TYPE="unit"
            shift
            ;;
        --integration)
            TEST_TYPE="integration"
            shift
            ;;
        --markers)
            MARKERS="$2"
            shift 2
            ;;
        --quiet)
            VERBOSE="-q"
            shift
            ;;
        --very-verbose)
            VERBOSE="-vv"
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --fast            Run tests without coverage (faster)"
            echo "  --unit            Run only unit tests"
            echo "  --integration     Run only integration tests"
            echo "  --markers MARKER  Run tests with specific marker"
            echo "  --quiet           Less verbose output"
            echo "  --very-verbose    More verbose output"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Change to project root
cd "$PROJECT_ROOT"

# Add src to PYTHONPATH
export PYTHONPATH="$PROJECT_ROOT/src:$PYTHONPATH"

echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Project Root: $PROJECT_ROOT"
echo -e "  Tests Directory: $TESTS_DIR"
echo -e "  Fast Mode: $FAST_MODE"
echo -e "  Test Type: $TEST_TYPE"
echo -e "  Coverage Minimum: ${COVERAGE_MIN}%"
echo ""

# Clean previous test artifacts
echo -e "${YELLOW}Cleaning previous test artifacts...${NC}"
rm -rf "$COVERAGE_DIR"
rm -rf "$TESTS_DIR/.pytest_cache"
rm -rf "$TESTS_DIR/__pycache__"
find "$TESTS_DIR" -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find "$PROJECT_ROOT" -type f -name "*.pyc" -delete 2>/dev/null || true
echo -e "${GREEN}✓ Cleanup complete${NC}"
echo ""

# Build pytest command
PYTEST_CMD="pytest $TESTS_DIR $VERBOSE"

# Add markers if specified
if [ ! -z "$MARKERS" ]; then
    PYTEST_CMD="$PYTEST_CMD -m $MARKERS"
fi

# Add test type filter
case $TEST_TYPE in
    unit)
        echo -e "${BLUE}Running Unit Tests Only${NC}"
        PYTEST_CMD="$PYTEST_CMD -m 'not integration and not e2e'"
        ;;
    integration)
        echo -e "${BLUE}Running Integration Tests Only${NC}"
        PYTEST_CMD="$PYTEST_CMD -m integration"
        ;;
    *)
        echo -e "${BLUE}Running All Tests${NC}"
        ;;
esac

# Add coverage options if not in fast mode
if [ "$FAST_MODE" = false ]; then
    PYTEST_CMD="$PYTEST_CMD --cov=src --cov-report=html:$COVERAGE_DIR --cov-report=term --cov-report=json:coverage.json --cov-fail-under=$COVERAGE_MIN"
    echo -e "${YELLOW}Coverage tracking enabled (minimum: ${COVERAGE_MIN}%)${NC}"
else
    echo -e "${YELLOW}Fast mode: Coverage tracking disabled${NC}"
fi

# Add additional pytest options
PYTEST_CMD="$PYTEST_CMD --tb=short --strict-markers --color=yes"
PYTEST_CMD="$PYTEST_CMD --junitxml=$TESTS_DIR/junit.xml"
PYTEST_CMD="$PYTEST_CMD --json-report --json-report-file=$REPORT_FILE"

echo ""
echo -e "${BLUE}Executing Test Suite...${NC}"
echo -e "${YELLOW}Command: $PYTEST_CMD${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run tests
TEST_EXIT_CODE=0
$PYTEST_CMD || TEST_EXIT_CODE=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Generate comprehensive report
if [ -f "$TESTS_DIR/test_suite_report.py" ]; then
    echo -e "${YELLOW}Generating comprehensive test report...${NC}"
    python "$TESTS_DIR/test_suite_report.py" || true
    echo ""
fi

# Display results
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                  ✓ ALL TESTS PASSED                        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

    if [ "$FAST_MODE" = false ]; then
        echo ""
        echo -e "${GREEN}✓ Coverage report generated: $COVERAGE_DIR/index.html${NC}"
        echo -e "${GREEN}✓ Test report: $HTML_REPORT${NC}"

        # Check if coverage.json exists and display summary
        if [ -f "coverage.json" ]; then
            COVERAGE_PERCENT=$(python -c "import json; print(json.load(open('coverage.json'))['totals']['percent_covered'])" 2>/dev/null || echo "N/A")
            echo -e "${GREEN}✓ Coverage: ${COVERAGE_PERCENT}%${NC}"
        fi
    fi

    echo ""
    echo -e "${BLUE}To view coverage report:${NC}"
    echo -e "  ${YELLOW}open $COVERAGE_DIR/index.html${NC}"
    echo ""

    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                  ✗ TESTS FAILED                            ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"

    if [ "$FAST_MODE" = false ]; then
        echo ""
        echo -e "${YELLOW}Partial coverage report may be available at:${NC}"
        echo -e "  $COVERAGE_DIR/index.html"
    fi

    echo ""
    echo -e "${RED}Exit code: $TEST_EXIT_CODE${NC}"
    exit $TEST_EXIT_CODE
fi

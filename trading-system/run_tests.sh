#!/bin/bash
# Trading System Test Runner
# Run comprehensive test suite with various options

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Trading System Test Suite${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# Parse arguments
TEST_TYPE=${1:-all}
COVERAGE=${2:-yes}

# Display test configuration
echo -e "${YELLOW}Test Configuration:${NC}"
echo "  Test Type: $TEST_TYPE"
echo "  Coverage: $COVERAGE"
echo ""

# Function to run tests
run_tests() {
    local test_path=$1
    local test_name=$2

    echo -e "${YELLOW}Running $test_name...${NC}"

    if [ "$COVERAGE" = "yes" ]; then
        pytest "$test_path" -v --cov=src --cov-report=term-missing --cov-report=html
    else
        pytest "$test_path" -v
    fi

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $test_name PASSED${NC}"
    else
        echo -e "${RED}✗ $test_name FAILED${NC}"
        exit 1
    fi
    echo ""
}

# Main test execution
case $TEST_TYPE in
    "unit")
        run_tests "tests/unit" "Unit Tests"
        ;;

    "integration")
        run_tests "tests/integration" "Integration Tests"
        ;;

    "e2e")
        run_tests "tests/e2e" "End-to-End Tests"
        ;;

    "mathematical")
        run_tests "tests/unit/test_mathematical_framework.py" "Mathematical Framework Tests"
        ;;

    "api")
        run_tests "tests/integration/test_api_integration.py" "API Integration Tests"
        ;;

    "strategy")
        run_tests "tests/integration/test_strategy.py" "Strategy Tests"
        ;;

    "backtesting")
        run_tests "tests/integration/test_backtesting.py" "Backtesting Tests"
        ;;

    "agentdb")
        run_tests "tests/integration/test_agentdb.py" "AgentDB Integration Tests"
        ;;

    "fast")
        echo -e "${YELLOW}Running fast tests (excluding slow tests)...${NC}"
        pytest -m "not slow" -v --cov=src --cov-report=term-missing
        ;;

    "all")
        echo -e "${YELLOW}Running ALL tests...${NC}"
        run_tests "tests/unit" "Unit Tests"
        run_tests "tests/integration" "Integration Tests"
        run_tests "tests/e2e" "End-to-End Tests"
        ;;

    "coverage")
        echo -e "${YELLOW}Running tests with detailed coverage report...${NC}"
        pytest tests/ -v --cov=src --cov-report=html --cov-report=term-missing --cov-report=json
        echo ""
        echo -e "${GREEN}Coverage report generated:${NC}"
        echo "  HTML: htmlcov/index.html"
        echo "  JSON: coverage.json"
        ;;

    "benchmark")
        echo -e "${YELLOW}Running performance benchmarks...${NC}"
        pytest tests/ -v --benchmark-only --benchmark-json=benchmark.json
        echo ""
        echo -e "${GREEN}Benchmark results: benchmark.json${NC}"
        ;;

    *)
        echo -e "${RED}Unknown test type: $TEST_TYPE${NC}"
        echo ""
        echo "Usage: ./run_tests.sh [TEST_TYPE] [COVERAGE]"
        echo ""
        echo "TEST_TYPE options:"
        echo "  all          - Run all tests (default)"
        echo "  unit         - Run unit tests only"
        echo "  integration  - Run integration tests only"
        echo "  e2e          - Run end-to-end tests only"
        echo "  mathematical - Run mathematical framework tests"
        echo "  api          - Run API integration tests"
        echo "  strategy     - Run strategy tests"
        echo "  backtesting  - Run backtesting tests"
        echo "  agentdb      - Run AgentDB tests"
        echo "  fast         - Run fast tests only (exclude slow)"
        echo "  coverage     - Generate detailed coverage report"
        echo "  benchmark    - Run performance benchmarks"
        echo ""
        echo "COVERAGE options:"
        echo "  yes - Generate coverage report (default)"
        echo "  no  - Skip coverage"
        echo ""
        echo "Examples:"
        echo "  ./run_tests.sh                    # Run all tests with coverage"
        echo "  ./run_tests.sh unit               # Run unit tests with coverage"
        echo "  ./run_tests.sh integration no     # Run integration tests without coverage"
        echo "  ./run_tests.sh fast               # Run fast tests only"
        exit 1
        ;;
esac

# Final summary
echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Test Execution Complete${NC}"
echo -e "${GREEN}================================================${NC}"

# Show coverage summary if generated
if [ "$COVERAGE" = "yes" ] && [ "$TEST_TYPE" != "benchmark" ]; then
    echo ""
    echo -e "${YELLOW}Coverage Summary:${NC}"
    coverage report --skip-covered
fi

echo ""
echo -e "${GREEN}✓ All tests passed successfully!${NC}"

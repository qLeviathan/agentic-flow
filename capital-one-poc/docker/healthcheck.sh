#!/bin/sh
# Health check script for Phi AI services
# Returns 0 if healthy, 1 if unhealthy

set -e

# Check if the service is listening on its port
check_port() {
    local port=$1
    nc -z localhost "$port" 2>/dev/null || return 1
}

# Check runtime health
check_runtime() {
    # Check if process is running
    if ! pgrep -f phi-runtime > /dev/null; then
        echo "Runtime process not running"
        return 1
    fi

    # Check metrics endpoint
    if command -v curl > /dev/null; then
        if ! curl -sf http://localhost:9090/metrics > /dev/null; then
            echo "Metrics endpoint not responding"
            return 1
        fi
    fi

    return 0
}

# Check API health
check_api() {
    # Check if process is running
    if ! pgrep -f phi-api > /dev/null; then
        echo "API process not running"
        return 1
    fi

    # Check health endpoint
    if command -v curl > /dev/null; then
        if ! curl -sf http://localhost:8080/health > /dev/null; then
            echo "Health endpoint not responding"
            return 1
        fi
    fi

    return 0
}

# Main health check
main() {
    # Determine which service to check based on running processes
    if pgrep -f phi-runtime > /dev/null; then
        check_runtime
    elif pgrep -f phi-api > /dev/null; then
        check_api
    else
        echo "No Phi service detected"
        return 1
    fi
}

main
exit $?

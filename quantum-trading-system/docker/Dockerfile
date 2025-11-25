# Quantum Trading System - Multi-stage Docker Build
# Optimized for production deployment with AgentDB persistence

# Stage 1: Base image with system dependencies
FROM python:3.11-slim as base

LABEL maintainer="Quantum Trading Team"
LABEL description="Quantum Trading System with Fibonacci/Lucas encoding"
LABEL version="1.0.0"

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: Dependencies installation
FROM base as dependencies

WORKDIR /tmp

# Copy requirements file
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install AgentDB and additional runtime dependencies
RUN pip install --no-cache-dir \
    agentdb \
    uvloop \
    orjson \
    python-dotenv

# Stage 3: Application build
FROM base as builder

WORKDIR /app

# Copy Python dependencies from previous stage
COPY --from=dependencies /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# Copy application code
COPY src/ ./src/
COPY tests/ ./tests/
COPY requirements.txt .

# Validate imports and run basic checks
RUN python -c "import sys; sys.path.insert(0, '.'); \
    from src.encoders.fibonacci_encoder import FibonacciEncoder; \
    from src.encoders.lucas_encoder import LucasEncoder; \
    from src.models.qfnn import QFNN; \
    print('✅ All imports successful')"

# Stage 4: Production runtime
FROM base as production

# Create non-root user
RUN useradd -m -u 1000 -s /bin/bash quantum && \
    mkdir -p /app /data /logs && \
    chown -R quantum:quantum /app /data /logs

WORKDIR /app

# Copy dependencies and application
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY --from=builder /app ./

# Switch to non-root user
USER quantum

# Create necessary directories
RUN mkdir -p /app/data/agentdb \
    /app/data/cache \
    /app/logs \
    /app/outputs

# Environment variables for runtime
ENV PYTHONPATH=/app \
    AGENTDB_PATH=/app/data/agentdb/agentdb.db \
    LOG_LEVEL=INFO \
    CACHE_DIR=/app/data/cache

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.path.insert(0, '/app'); \
    from src.encoders.fibonacci_encoder import FibonacciEncoder; \
    encoder = FibonacciEncoder(); \
    assert encoder is not None" || exit 1

# Expose ports (if needed for API endpoints)
EXPOSE 8000

# Default command - can be overridden
CMD ["python", "-m", "pytest", "tests/", "-v"]

# Stage 5: Development environment
FROM production as development

USER root

# Install development tools
RUN pip install --no-cache-dir \
    pytest-watch \
    ipython \
    jupyter \
    black \
    flake8 \
    mypy \
    coverage

# Install Node.js for AgentDB CLI
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g agentdb@latest && \
    rm -rf /var/lib/apt/lists/*

USER quantum

# Development command - interactive shell
CMD ["/bin/bash"]

# Stage 6: Testing environment
FROM development as testing

USER quantum

WORKDIR /app

# Copy test data and fixtures
COPY --chown=quantum:quantum tests/ ./tests/

# Run tests by default
CMD ["python", "-m", "pytest", "tests/", "-v", "--cov=src", "--cov-report=html", "--cov-report=term"]

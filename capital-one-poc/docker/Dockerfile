# Multi-stage Dockerfile for Rust + WASM AI System
# Optimized for small image size and fast builds

# Stage 1: Build environment
FROM rust:1.75-slim-bookworm AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    cmake \
    g++ \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install wasm-pack for WASM compilation
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Install cargo tools for optimization
RUN cargo install cargo-chef --locked

# Set working directory
WORKDIR /build

# Stage 2: Recipe preparation (for layer caching)
FROM builder AS planner
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo chef prepare --recipe-path recipe.json

# Stage 3: Build dependencies (cached layer)
FROM builder AS dependencies
COPY --from=planner /build/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

# Stage 4: Build application
FROM builder AS app-builder
COPY --from=dependencies /build/target target
COPY --from=dependencies /usr/local/cargo /usr/local/cargo
COPY . .

# Build Rust binaries with optimizations
ENV RUSTFLAGS="-C target-cpu=native -C opt-level=3"
RUN cargo build --release --bin phi-runtime
RUN cargo build --release --bin phi-api
RUN cargo build --release --bin phi-cli

# Build WASM modules
WORKDIR /build/wasm
COPY wasm ./
RUN wasm-pack build --target web --release

# Strip binaries to reduce size
RUN strip /build/target/release/phi-runtime
RUN strip /build/target/release/phi-api
RUN strip /build/target/release/phi-cli

# Stage 5: Runtime image
FROM debian:bookworm-slim AS runtime

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN useradd -m -u 1000 -s /bin/bash phi-user

# Set working directory
WORKDIR /app

# Copy binaries from builder
COPY --from=app-builder /build/target/release/phi-runtime /app/bin/phi-runtime
COPY --from=app-builder /build/target/release/phi-api /app/bin/phi-api
COPY --from=app-builder /build/target/release/phi-cli /app/bin/phi-cli

# Copy WASM modules
COPY --from=app-builder /build/wasm/pkg /app/wasm

# Create necessary directories
RUN mkdir -p /app/data /app/logs /app/config && \
    chown -R phi-user:phi-user /app

# Health check script
COPY --chown=phi-user:phi-user docker/healthcheck.sh /app/healthcheck.sh
RUN chmod +x /app/healthcheck.sh

# Switch to non-root user
USER phi-user

# Expose ports
EXPOSE 8080 9090 50051

# Environment variables
ENV RUST_LOG=info
ENV PHI_DATA_DIR=/app/data
ENV PHI_LOG_DIR=/app/logs
ENV PHI_CONFIG_DIR=/app/config

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD ["/app/healthcheck.sh"]

# Default command (can be overridden)
CMD ["/app/bin/phi-runtime"]

# Stage 6: API service variant
FROM runtime AS phi-api
USER phi-user
EXPOSE 8080
CMD ["/app/bin/phi-api"]

# Stage 7: CLI variant
FROM runtime AS phi-cli
USER phi-user
ENTRYPOINT ["/app/bin/phi-cli"]

# Metadata
LABEL org.opencontainers.image.title="Phi AI Runtime"
LABEL org.opencontainers.image.description="Distributed AI system with Rust + WASM"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.vendor="Capital One POC"
LABEL maintainer="backend-dev@phi-ai.io"

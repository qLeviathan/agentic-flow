#!/bin/bash

# Build script for math-framework-wasm
# Builds the WASM module using wasm-pack

set -e

echo "🚀 Building math-framework-wasm..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack is not installed!"
    echo "📦 Install it with: curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh"
    exit 1
fi

# Check if wasm32-unknown-unknown target is installed
if ! rustup target list | grep -q "wasm32-unknown-unknown (installed)"; then
    echo "📦 Installing wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
fi

# Determine target (default to nodejs)
TARGET="${1:-nodejs}"

case "$TARGET" in
    nodejs|node)
        echo "🔧 Building for Node.js..."
        wasm-pack build --target nodejs --release
        ;;
    web)
        echo "🌐 Building for web browsers..."
        wasm-pack build --target web --release
        ;;
    bundler)
        echo "📦 Building for bundlers (webpack, rollup, etc.)..."
        wasm-pack build --target bundler --release
        ;;
    all)
        echo "🔧 Building for all targets..."
        wasm-pack build --target nodejs --release --out-dir pkg-nodejs
        wasm-pack build --target web --release --out-dir pkg-web
        wasm-pack build --target bundler --release --out-dir pkg-bundler
        echo ""
        echo "📝 All builds complete!"
        echo "  - Node.js: pkg-nodejs/"
        echo "  - Web: pkg-web/"
        echo "  - Bundler: pkg-bundler/"
        ;;
    *)
        echo "❌ Unknown target: $TARGET"
        echo "Usage: $0 [nodejs|web|bundler|all]"
        exit 1
        ;;
esac

echo "✅ Build complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Test the build: wasm-pack test --node"
echo "  2. Test in browser: wasm-pack test --headless --chrome"
echo "  3. Publish to npm: cd pkg && npm publish"
echo "  4. Or use locally: cd pkg && npm link"

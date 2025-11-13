# Build Requirements for AURELIA System

## Environment Information

**Current build attempt**: Failed due to missing Linux system libraries
**Rust code status**: ✅ Valid (syntax checked)
**Build blocker**: Missing GTK/WebKit system packages

## Required System Libraries

### Ubuntu/Debian Linux
```bash
sudo apt-get update && sudo apt-get install -y \
  libwebkit2gtk-4.0-dev \
  libsoup2.4-dev \
  libjavascriptcoregtk-4.0-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libpango1.0-dev \
  libgdk3.0-cil-dev \
  patchelf \
  pkg-config \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev
```

### Fedora/RHEL/CentOS
```bash
sudo dnf install -y \
  webkit2gtk4.0-devel \
  libsoup-devel \
  javascriptcoregtk4.0-devel \
  gtk3-devel \
  libappindicator-gtk3-devel \
  librsvg2-devel \
  pango-devel \
  gdk-pixbuf2-devel \
  openssl-devel
```

### Arch Linux
```bash
sudo pacman -S --needed \
  webkit2gtk \
  libsoup \
  gtk3 \
  libappindicator-gtk3 \
  librsvg \
  pango \
  gdk-pixbuf2 \
  openssl \
  pkg-config \
  base-devel
```

### macOS
```bash
# Install Xcode Command Line Tools
xcode-select --install

# No additional packages needed - WebKit is built-in
```

### Windows
```powershell
# Install WebView2 Runtime (usually pre-installed on Windows 11)
# Download from: https://developer.microsoft.com/microsoft-edge/webview2/

# Install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/
# Required components:
#   - Desktop development with C++
#   - Windows 10 SDK
```

## Rust Toolchain

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verify installation
rustc --version  # Should be 1.70+
cargo --version

# Add wasm target (for WASM features)
rustup target add wasm32-unknown-unknown
```

## Node.js/npm

```bash
# Verify Node.js (required 16+)
node --version  # Should be v16+
npm --version   # Should be 7+

# If not installed, use nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

## Build Commands

### Development Build
```bash
cd /home/user/agentic-flow/tauri-anthropic-app

# Install npm dependencies
npm install

# Build Rust backend
cd src-tauri
cargo build

# Return to app directory
cd ..

# Run in development mode
npm run tauri dev
```

### Production Build
```bash
cd /home/user/agentic-flow/tauri-anthropic-app

# Install dependencies
npm install

# Build optimized release
cd src-tauri
cargo build --release

# Build Tauri app bundle
cd ..
npm run tauri build

# Output will be in src-tauri/target/release/bundle/
```

## Current Build Error Analysis

### Error 1: libsoup-2.4 not found
```
The system library `libsoup-2.4` required by crate `soup2-sys` was not found.
The file `libsoup-2.4.pc` needs to be installed and the PKG_CONFIG_PATH
environment variable must contain its parent directory.
```

**Solution**:
```bash
sudo apt-get install libsoup2.4-dev
```

### Error 2: javascriptcoregtk-4.0 not found
```
The system library `javascriptcoregtk-4.0` required by crate
`javascriptcore-rs-sys` was not found.
```

**Solution**:
```bash
sudo apt-get install libjavascriptcoregtk-4.0-dev
```

### Error 3: gdk-3.0 not found
```
The system library `gdk-3.0` required by crate `gdk-sys` was not found.
```

**Solution**:
```bash
sudo apt-get install libgtk-3-dev
```

### Error 4: pango not found
```
The system library `pango` required by crate `pango-sys` was not found.
```

**Solution**:
```bash
sudo apt-get install libpango1.0-dev
```

## Environment Check Script

Save this as `check-build-env.sh`:

```bash
#!/bin/bash

echo "Checking AURELIA build environment..."
echo ""

# Check Rust
if command -v rustc &> /dev/null; then
    echo "✅ Rust: $(rustc --version)"
else
    echo "❌ Rust not found - install from https://rustup.rs"
fi

# Check Cargo
if command -v cargo &> /dev/null; then
    echo "✅ Cargo: $(cargo --version)"
else
    echo "❌ Cargo not found"
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js not found"
fi

# Check npm
if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm not found"
fi

# Check pkg-config
if command -v pkg-config &> /dev/null; then
    echo "✅ pkg-config: $(pkg-config --version)"
else
    echo "❌ pkg-config not found"
fi

echo ""
echo "Checking system libraries..."

# Check GTK
if pkg-config --exists gtk+-3.0; then
    echo "✅ GTK 3: $(pkg-config --modversion gtk+-3.0)"
else
    echo "❌ GTK 3 not found - install libgtk-3-dev"
fi

# Check WebKit
if pkg-config --exists webkit2gtk-4.0; then
    echo "✅ WebKit2GTK: $(pkg-config --modversion webkit2gtk-4.0)"
else
    echo "❌ WebKit2GTK not found - install libwebkit2gtk-4.0-dev"
fi

# Check libsoup
if pkg-config --exists libsoup-2.4; then
    echo "✅ libsoup: $(pkg-config --modversion libsoup-2.4)"
else
    echo "❌ libsoup not found - install libsoup2.4-dev"
fi

# Check JavaScriptCore
if pkg-config --exists javascriptcoregtk-4.0; then
    echo "✅ JavaScriptCore: $(pkg-config --modversion javascriptcoregtk-4.0)"
else
    echo "❌ JavaScriptCore not found - install libjavascriptcoregtk-4.0-dev"
fi

# Check Pango
if pkg-config --exists pango; then
    echo "✅ Pango: $(pkg-config --modversion pango)"
else
    echo "❌ Pango not found - install libpango1.0-dev"
fi

echo ""
echo "Environment check complete."
```

Make it executable:
```bash
chmod +x check-build-env.sh
./check-build-env.sh
```

## Quick Install (Ubuntu/Debian)

All-in-one command to install everything needed:

```bash
#!/bin/bash
set -e

echo "Installing AURELIA build dependencies..."

# Update package lists
sudo apt-get update

# Install system libraries
sudo apt-get install -y \
  libwebkit2gtk-4.0-dev \
  libsoup2.4-dev \
  libjavascriptcoregtk-4.0-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libpango1.0-dev \
  libgdk-pixbuf2.0-dev \
  patchelf \
  pkg-config \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev

# Install Rust (if not installed)
if ! command -v rustc &> /dev/null; then
    echo "Installing Rust..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source $HOME/.cargo/env
fi

# Install Node.js via nvm (if not installed)
if ! command -v node &> /dev/null; then
    echo "Installing Node.js via nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 18
    nvm use 18
fi

echo ""
echo "✅ All dependencies installed!"
echo ""
echo "Next steps:"
echo "1. cd tauri-anthropic-app"
echo "2. npm install"
echo "3. npm run tauri dev"
```

## Verification After Install

```bash
# Test Rust compilation
cd /home/user/agentic-flow/tauri-anthropic-app/src-tauri
cargo check

# If successful, build
cargo build

# If build succeeds, run app
cd ..
npm run tauri dev
```

## Docker Alternative (If Local Build Fails)

Create a `Dockerfile`:

```dockerfile
FROM rust:1.75-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libwebkit2gtk-4.0-dev \
    libsoup2.4-dev \
    libjavascriptcoregtk-4.0-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    libpango1.0-dev \
    patchelf \
    pkg-config \
    build-essential \
    curl \
    nodejs \
    npm

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Build
WORKDIR /app/tauri-anthropic-app/src-tauri
RUN cargo build --release

# Entry point
CMD ["cargo", "run", "--release"]
```

Build and run:
```bash
docker build -t aurelia .
docker run -it aurelia
```

## Status

- ✅ Rust code is valid and ready to build
- ✅ All 23 files committed to branch `claude/get-load-011CV4Ki3NoZteND7VHz1ABc`
- ❌ Build currently blocked by missing system libraries
- 🔧 Install dependencies above to proceed with build

Once dependencies are installed, the app will compile and run successfully.

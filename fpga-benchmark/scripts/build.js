#!/usr/bin/env node

/**
 * FPGA Verilog Benchmark Suite - Build Script
 *
 * Compiles and prepares Verilog modules for simulation and synthesis
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// ANSI colors
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}[OK]${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.bright}${colors.cyan}=== ${msg} ===${colors.reset}\n`)
};

// Project paths
const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const BUILD_DIR = path.join(ROOT_DIR, 'build');
const SIM_DIR = path.join(ROOT_DIR, 'sim');

// Configuration
const config = {
    modules: [
        'core/zeckendorf_encoder.v',
        'core/cascade_engine.v',
        'core/attention_unit.v',
        'core/context_accumulator.v',
        'core/reverse_lookup.v',
        'core/hyperbolic_router.v',
        'core/top_module.v',
        'lut/cascade_lut.v'
    ],
    testbenches: [
        'testbench/tb_zeckendorf_encoder.v',
        'testbench/tb_cascade_engine.v',
        'testbench/tb_attention_unit.v',
        'testbench/tb_top_module.v'
    ],
    iverilogPath: 'iverilog',
    vvpPath: 'vvp'
};

// Ensure directories exist
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        log.info(`Created directory: ${dir}`);
    }
}

// Check for Icarus Verilog
function checkToolchain() {
    log.header('Checking Toolchain');

    try {
        execSync('iverilog -V', { stdio: 'pipe' });
        log.success('Icarus Verilog found');
        return true;
    } catch (e) {
        log.warn('Icarus Verilog not found - simulation disabled');
        log.info('Install with: apt-get install iverilog (Linux) or brew install icarus-verilog (macOS)');
        return false;
    }
}

// Validate Verilog syntax
function validateModule(modulePath) {
    const fullPath = path.join(SRC_DIR, modulePath);

    if (!fs.existsSync(fullPath)) {
        log.error(`Module not found: ${modulePath}`);
        return false;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n').length;
    const moduleMatch = content.match(/module\s+(\w+)/g);
    const modules = moduleMatch ? moduleMatch.map(m => m.replace('module ', '')) : [];

    log.info(`${modulePath}: ${lines} lines, ${modules.length} module(s): ${modules.join(', ')}`);
    return true;
}

// Compile module with iverilog
function compileModule(modulePath, hasIverilog) {
    if (!hasIverilog) return true;

    const fullPath = path.join(SRC_DIR, modulePath);
    const outputName = path.basename(modulePath, '.v') + '.vvp';
    const outputPath = path.join(BUILD_DIR, outputName);

    try {
        // Just syntax check for modules (not testbenches)
        execSync(`iverilog -t null -Wall ${fullPath}`, { stdio: 'pipe' });
        log.success(`Compiled: ${modulePath}`);
        return true;
    } catch (e) {
        log.error(`Compilation failed: ${modulePath}`);
        console.error(e.stderr?.toString() || e.message);
        return false;
    }
}

// Generate file list for synthesis
function generateFilelist() {
    const filelistPath = path.join(BUILD_DIR, 'filelist.f');
    const files = config.modules.map(m => path.join(SRC_DIR, m));

    fs.writeFileSync(filelistPath, files.join('\n'));
    log.success(`Generated filelist: ${filelistPath}`);
}

// Generate module dependency graph
function generateDependencyGraph() {
    log.header('Analyzing Dependencies');

    const dependencies = {};

    for (const modulePath of config.modules) {
        const fullPath = path.join(SRC_DIR, modulePath);
        const content = fs.readFileSync(fullPath, 'utf8');

        // Find module instantiations
        const instantiations = content.match(/(\w+)\s+#?\s*\([^)]*\)\s*\w+\s*\(/g) || [];
        const moduleName = path.basename(modulePath, '.v');

        dependencies[moduleName] = {
            file: modulePath,
            instantiates: []
        };

        for (const inst of instantiations) {
            const match = inst.match(/^(\w+)/);
            if (match && !['if', 'for', 'case', 'begin', 'function', 'task'].includes(match[1])) {
                dependencies[moduleName].instantiates.push(match[1]);
            }
        }
    }

    // Print dependency tree
    for (const [mod, info] of Object.entries(dependencies)) {
        if (info.instantiates.length > 0) {
            log.info(`${mod} -> ${info.instantiates.join(', ')}`);
        }
    }

    // Save to JSON
    const depPath = path.join(BUILD_DIR, 'dependencies.json');
    fs.writeFileSync(depPath, JSON.stringify(dependencies, null, 2));
    log.success(`Dependency graph: ${depPath}`);
}

// Main build function
async function build() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║     φ-Space FPGA Benchmark Suite - Build System               ║
║     Zeckendorf Computation Architecture                       ║
╚═══════════════════════════════════════════════════════════════╝
`);

    const startTime = Date.now();

    // Setup
    ensureDir(BUILD_DIR);
    ensureDir(SIM_DIR);

    const hasIverilog = checkToolchain();

    // Validate modules
    log.header('Validating Modules');
    let validCount = 0;
    for (const mod of config.modules) {
        if (validateModule(mod)) validCount++;
    }
    log.info(`Validated ${validCount}/${config.modules.length} modules`);

    // Compile modules
    log.header('Compiling Modules');
    let compileCount = 0;
    for (const mod of config.modules) {
        if (compileModule(mod, hasIverilog)) compileCount++;
    }
    log.info(`Compiled ${compileCount}/${config.modules.length} modules`);

    // Generate build artifacts
    log.header('Generating Build Artifacts');
    generateFilelist();
    generateDependencyGraph();

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    log.header('Build Summary');
    console.log(`
  Modules validated: ${validCount}/${config.modules.length}
  Modules compiled:  ${compileCount}/${config.modules.length}
  Build time:        ${elapsed}s
  Output directory:  ${BUILD_DIR}
`);

    if (compileCount === config.modules.length) {
        log.success('Build completed successfully!');
        console.log(`
Next steps:
  npm run sim          - Run all simulations
  npm run benchmark    - Run performance benchmarks
  npm run synth        - Synthesize for FPGA
`);
        process.exit(0);
    } else {
        log.error('Build completed with errors');
        process.exit(1);
    }
}

// Run build
build().catch(err => {
    log.error(`Build failed: ${err.message}`);
    process.exit(1);
});

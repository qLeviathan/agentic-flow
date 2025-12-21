#!/usr/bin/env node

/**
 * FPGA Verilog Benchmark Suite - Simulation Runner
 *
 * Runs testbenches using Icarus Verilog
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
    success: (msg) => console.log(`${colors.green}[PASS]${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}[FAIL]${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.bright}${colors.cyan}=== ${msg} ===${colors.reset}\n`)
};

// Project paths
const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const SIM_DIR = path.join(ROOT_DIR, 'sim');

// Testbench configurations
const testbenches = {
    'zeckendorf_encoder': {
        tb: 'testbench/tb_zeckendorf_encoder.v',
        deps: ['core/zeckendorf_encoder.v'],
        description: 'Zeckendorf encoder/decoder roundtrip tests'
    },
    'cascade_engine': {
        tb: 'testbench/tb_cascade_engine.v',
        deps: ['core/cascade_engine.v'],
        description: 'Cascade normalization (φ^k + φ^(k+1) = φ^(k+2))'
    },
    'attention_unit': {
        tb: 'testbench/tb_attention_unit.v',
        deps: ['core/attention_unit.v'],
        description: 'XOR-distance attention mechanism'
    },
    'top_module': {
        tb: 'testbench/tb_top_module.v',
        deps: [
            'core/zeckendorf_encoder.v',
            'core/cascade_engine.v',
            'core/attention_unit.v',
            'core/context_accumulator.v',
            'core/reverse_lookup.v',
            'core/hyperbolic_router.v',
            'core/top_module.v'
        ],
        description: 'Full system integration test'
    }
};

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        all: false,
        module: null,
        verbose: false,
        waves: false
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--all':
            case '-a':
                options.all = true;
                break;
            case '--module':
            case '-m':
                options.module = args[++i];
                break;
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            case '--waves':
            case '-w':
                options.waves = true;
                break;
            default:
                if (!args[i].startsWith('-')) {
                    options.module = args[i];
                }
        }
    }

    return options;
}

// Check for Icarus Verilog
function checkIverilog() {
    try {
        execSync('iverilog -V', { stdio: 'pipe' });
        return true;
    } catch (e) {
        return false;
    }
}

// Compile testbench
function compile(name, config) {
    const tbPath = path.join(SRC_DIR, config.tb);
    const depPaths = config.deps.map(d => path.join(SRC_DIR, d));
    const outputPath = path.join(SIM_DIR, `${name}.vvp`);

    const allFiles = [...depPaths, tbPath].join(' ');
    const cmd = `iverilog -o ${outputPath} -Wall ${allFiles}`;

    try {
        execSync(cmd, { stdio: 'pipe', cwd: ROOT_DIR });
        return outputPath;
    } catch (e) {
        log.error(`Compilation failed for ${name}`);
        console.error(e.stderr?.toString() || e.message);
        return null;
    }
}

// Run simulation
function runSimulation(name, vvpPath, verbose) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        let output = '';
        let passCount = 0;
        let failCount = 0;

        const proc = spawn('vvp', [vvpPath], {
            cwd: SIM_DIR,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        proc.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;

            // Count PASS/FAIL
            const passes = (text.match(/PASS/g) || []).length;
            const fails = (text.match(/FAIL/g) || []).length;
            passCount += passes;
            failCount += fails;

            if (verbose) {
                process.stdout.write(text);
            }
        });

        proc.stderr.on('data', (data) => {
            if (verbose) {
                process.stderr.write(data.toString());
            }
        });

        proc.on('close', (code) => {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

            resolve({
                name,
                success: failCount === 0,
                passCount,
                failCount,
                elapsed,
                output
            });
        });

        // Timeout
        setTimeout(() => {
            proc.kill();
            resolve({
                name,
                success: false,
                passCount,
                failCount,
                elapsed: 'timeout',
                output
            });
        }, 60000);
    });
}

// Main simulation function
async function simulate() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║     φ-Space FPGA Benchmark Suite - Simulation Runner          ║
╚═══════════════════════════════════════════════════════════════╝
`);

    const options = parseArgs();

    // Check toolchain
    if (!checkIverilog()) {
        log.error('Icarus Verilog not found');
        log.info('Install: apt-get install iverilog (Linux) or brew install icarus-verilog (macOS)');
        process.exit(1);
    }

    // Ensure sim directory exists
    if (!fs.existsSync(SIM_DIR)) {
        fs.mkdirSync(SIM_DIR, { recursive: true });
    }

    // Determine which tests to run
    let testsToRun = [];

    if (options.all || !options.module) {
        testsToRun = Object.keys(testbenches);
    } else if (options.module && testbenches[options.module]) {
        testsToRun = [options.module];
    } else {
        log.error(`Unknown module: ${options.module}`);
        log.info(`Available modules: ${Object.keys(testbenches).join(', ')}`);
        process.exit(1);
    }

    log.header('Running Simulations');

    const results = [];

    for (const name of testsToRun) {
        const config = testbenches[name];
        log.info(`${name}: ${config.description}`);

        // Compile
        const vvpPath = compile(name, config);
        if (!vvpPath) {
            results.push({
                name,
                success: false,
                passCount: 0,
                failCount: 1,
                elapsed: 'compile error',
                output: ''
            });
            continue;
        }

        // Run
        const result = await runSimulation(name, vvpPath, options.verbose);
        results.push(result);

        if (result.success) {
            log.success(`${name}: ${result.passCount} tests passed (${result.elapsed}s)`);
        } else {
            log.error(`${name}: ${result.failCount} tests failed (${result.elapsed}s)`);
        }
    }

    // Summary
    log.header('Simulation Summary');

    const totalPass = results.reduce((sum, r) => sum + r.passCount, 0);
    const totalFail = results.reduce((sum, r) => sum + r.failCount, 0);
    const allPassed = results.every(r => r.success);

    console.log(`
  Testbenches run:  ${results.length}
  Total tests:      ${totalPass + totalFail}
  Passed:           ${totalPass}
  Failed:           ${totalFail}
`);

    // Per-module results
    console.log('  Results by module:');
    for (const r of results) {
        const status = r.success ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
        console.log(`    ${r.name.padEnd(20)} ${status} (${r.passCount}/${r.passCount + r.failCount})`);
    }

    console.log('');

    if (allPassed) {
        log.success('All simulations passed!');
        process.exit(0);
    } else {
        log.error('Some simulations failed');
        process.exit(1);
    }
}

// Run simulation
simulate().catch(err => {
    log.error(`Simulation failed: ${err.message}`);
    process.exit(1);
});

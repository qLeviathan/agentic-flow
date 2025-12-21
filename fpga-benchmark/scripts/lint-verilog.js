#!/usr/bin/env node

/**
 * FPGA Verilog Benchmark Suite - Verilog Linter
 *
 * Static analysis of Verilog files for common issues
 */

const fs = require('fs');
const path = require('path');

// ANSI colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    red: '\x1b[31m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
    warn: (file, line, msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${file}:${line}: ${msg}`),
    error: (file, line, msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${file}:${line}: ${msg}`),
    success: (msg) => console.log(`${colors.green}[OK]${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.cyan}=== ${msg} ===${colors.reset}\n`)
};

const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

// Lint rules
const rules = {
    // Check for blocking assignments in always @(posedge)
    blockingInSequential: {
        pattern: /always\s*@\s*\(\s*posedge[^)]+\)\s*begin[\s\S]*?(?<!<=)\s*=\s*(?!.*<=)/,
        message: 'Blocking assignment (=) in sequential always block',
        severity: 'warn'
    },

    // Check for non-blocking in combinational
    nonBlockingInComb: {
        pattern: /always\s*@\s*\(\s*\*\s*\)\s*begin[\s\S]*?<=/,
        message: 'Non-blocking assignment (<=) in combinational always block',
        severity: 'warn'
    },

    // Check for latches (incomplete sensitivity or missing else)
    possibleLatch: {
        pattern: /always\s*@\s*\(\s*\*\s*\)[\s\S]*?if\s*\([^)]+\)[\s\S]*?(?!else)/,
        message: 'Possible unintentional latch (missing else clause)',
        severity: 'warn'
    },

    // Check for multi-driven signals
    // (simplified - real check would be more complex)
    multipleDrivers: {
        pattern: null, // Custom check
        message: 'Signal may have multiple drivers',
        severity: 'error'
    },

    // Deprecated system tasks
    deprecatedTasks: {
        pattern: /\$display\s*\(/,
        message: 'Use $display for debugging only, remove for synthesis',
        severity: 'info'
    },

    // Missing reset
    missingReset: {
        pattern: /always\s*@\s*\(\s*posedge\s+clk\s*\)(?![\s\S]*?rst)/,
        message: 'Sequential block without reset',
        severity: 'warn'
    }
};

// Simple line-based checks
const lineRules = [
    { pattern: /\breg\s+\[(\d+):0\].*=.*'b/, message: 'Consider using explicit width in initialization' },
    { pattern: /integer\s+\w+\s*;/, message: 'Consider using reg [31:0] instead of integer for synthesis' },
    { pattern: /\$random/, message: '$random not synthesizable' },
    { pattern: /initial\s+begin(?!.*\/\/.*sim)/, message: 'Initial blocks may not be synthesizable' },
    { pattern: /\s+$/, message: 'Trailing whitespace' },
    { pattern: /\t/, message: 'Tab character (consider spaces)' }
];

// File statistics
function getFileStats(content) {
    const lines = content.split('\n');
    const stats = {
        lines: lines.length,
        modules: (content.match(/\bmodule\s+\w+/g) || []).length,
        alwaysBlocks: (content.match(/\balways\s*@/g) || []).length,
        registers: (content.match(/\breg\s+/g) || []).length,
        wires: (content.match(/\bwire\s+/g) || []).length,
        parameters: (content.match(/\bparameter\s+/g) || []).length,
        instances: (content.match(/\w+\s+#?\s*\([^)]*\)\s+\w+\s*\(/g) || []).length
    };
    return stats;
}

// Lint a single file
function lintFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];
    const relativePath = path.relative(ROOT_DIR, filePath);

    // Line-by-line checks
    lines.forEach((line, idx) => {
        const lineNum = idx + 1;

        // Skip comments
        if (line.trim().startsWith('//')) return;

        for (const rule of lineRules) {
            if (rule.pattern.test(line)) {
                issues.push({
                    line: lineNum,
                    message: rule.message,
                    severity: 'info'
                });
            }
        }
    });

    // Module-level checks
    const moduleMatches = content.matchAll(/module\s+(\w+)[^;]*;([\s\S]*?)endmodule/g);

    for (const match of moduleMatches) {
        const moduleName = match[1];
        const moduleBody = match[2];
        const moduleStart = content.substring(0, match.index).split('\n').length;

        // Check for proper reset handling
        const alwaysBlocks = moduleBody.matchAll(/always\s*@\s*\(\s*posedge\s+(\w+)[^)]*\)([\s\S]*?)(?=\balways|$)/g);

        for (const block of alwaysBlocks) {
            const blockContent = block[2];
            const blockLine = moduleStart + content.substring(match.index, match.index + block.index).split('\n').length;

            // Check for reset
            if (!blockContent.includes('rst') && !blockContent.includes('reset')) {
                // Only warn if there are assignments
                if (blockContent.includes('<=')) {
                    issues.push({
                        line: blockLine,
                        message: `Sequential block in ${moduleName} may be missing reset`,
                        severity: 'warn'
                    });
                }
            }
        }
    }

    return {
        file: relativePath,
        stats: getFileStats(content),
        issues
    };
}

// Find all Verilog files
function findVerilogFiles(dir) {
    const files = [];

    function scan(currentDir) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            if (entry.isDirectory() && !entry.name.startsWith('.')) {
                scan(fullPath);
            } else if (entry.name.endsWith('.v')) {
                files.push(fullPath);
            }
        }
    }

    scan(dir);
    return files;
}

// Main lint function
async function lint() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║     φ-Space FPGA Benchmark Suite - Verilog Linter             ║
╚═══════════════════════════════════════════════════════════════╝
`);

    const files = findVerilogFiles(SRC_DIR);
    log.info(`Found ${files.length} Verilog files`);

    let totalIssues = 0;
    let totalWarnings = 0;
    let totalErrors = 0;
    const results = [];

    log.header('Linting Results');

    for (const file of files) {
        const result = lintFile(file);
        results.push(result);

        if (result.issues.length > 0) {
            console.log(`\n${colors.cyan}${result.file}${colors.reset}`);
            console.log(`  ${result.stats.lines} lines, ${result.stats.modules} module(s), ${result.stats.alwaysBlocks} always blocks`);

            for (const issue of result.issues) {
                totalIssues++;
                if (issue.severity === 'error') {
                    totalErrors++;
                    log.error(result.file, issue.line, issue.message);
                } else if (issue.severity === 'warn') {
                    totalWarnings++;
                    log.warn(result.file, issue.line, issue.message);
                } else {
                    console.log(`  ${colors.blue}[INFO]${colors.reset} Line ${issue.line}: ${issue.message}`);
                }
            }
        } else {
            log.success(`${result.file} - no issues`);
        }
    }

    // Summary
    log.header('Lint Summary');

    const totalLines = results.reduce((sum, r) => sum + r.stats.lines, 0);
    const totalModules = results.reduce((sum, r) => sum + r.stats.modules, 0);

    console.log(`
  Files analyzed:  ${files.length}
  Total lines:     ${totalLines}
  Total modules:   ${totalModules}

  Issues found:    ${totalIssues}
    Errors:        ${totalErrors}
    Warnings:      ${totalWarnings}
    Info:          ${totalIssues - totalErrors - totalWarnings}
`);

    if (totalErrors > 0) {
        log.error('', '', 'Lint completed with errors');
        process.exit(1);
    } else if (totalWarnings > 0) {
        log.warn('', '', 'Lint completed with warnings');
        process.exit(0);
    } else {
        log.success('Lint completed successfully!');
        process.exit(0);
    }
}

// Run
lint().catch(err => {
    console.error(`Lint failed: ${err.message}`);
    process.exit(1);
});

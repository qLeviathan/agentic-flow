#!/usr/bin/env node

/**
 * FPGA Verilog Benchmark Suite - Clean Script
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const BUILD_DIR = path.join(ROOT_DIR, 'build');
const SIM_DIR = path.join(ROOT_DIR, 'sim');

function rmDir(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        console.log(`Removed: ${dir}`);
    }
}

console.log('Cleaning build artifacts...');
rmDir(BUILD_DIR);
rmDir(SIM_DIR);

// Clean VCD files in any location
const vcdFiles = [];
function findVCD(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
            findVCD(fullPath);
        } else if (entry.name.endsWith('.vcd')) {
            vcdFiles.push(fullPath);
        }
    }
}

findVCD(ROOT_DIR);
for (const vcd of vcdFiles) {
    fs.unlinkSync(vcd);
    console.log(`Removed: ${vcd}`);
}

console.log('Clean complete!');

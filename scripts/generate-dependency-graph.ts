#!/usr/bin/env ts-node
/**
 * Generate Dependency Graph Visualization
 *
 * This script generates a GraphViz DOT file and optionally
 * renders it to various image formats (PNG, SVG, PDF).
 *
 * Usage:
 *   npm run graph:generate              # Generate .dot file
 *   npm run graph:generate -- --render  # Generate and render to PNG
 *   npm run graph:generate -- --format svg  # Render to SVG
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  validateDependencyGraph,
  generateVisualization,
  getComputationOrder
} from '../src/math-framework/validation/dependency-graph';

// ============================================================================
// CONFIGURATION
// ============================================================================

const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'math-framework');
const DOT_FILE = path.join(OUTPUT_DIR, 'dependency-graph.dot');
const REPORT_FILE = path.join(OUTPUT_DIR, 'validation-report.md');
const JSON_FILE = path.join(OUTPUT_DIR, 'dependency-graph.json');

// Parse command-line arguments
const args = process.argv.slice(2);
const shouldRender = args.includes('--render');
const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'png';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function ensureDirectory(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

function writeFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`Written: ${filePath}`);
}

function hasGraphviz(): boolean {
  try {
    execSync('dot -V', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function renderGraph(dotFile: string, outputFormat: string): void {
  if (!hasGraphviz()) {
    console.error('\n⚠️  GraphViz not found. Please install it:');
    console.error('   macOS:   brew install graphviz');
    console.error('   Ubuntu:  sudo apt-get install graphviz');
    console.error('   Windows: choco install graphviz\n');
    return;
  }

  const outputFile = dotFile.replace('.dot', `.${outputFormat}`);

  try {
    console.log(`\nRendering graph to ${outputFormat.toUpperCase()}...`);
    execSync(`dot -T${outputFormat} "${dotFile}" -o "${outputFile}"`, {
      stdio: 'inherit'
    });
    console.log(`✓ Rendered: ${outputFile}\n`);
  } catch (error) {
    console.error(`✗ Failed to render graph: ${error}`);
  }
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateMarkdownReport(result: ReturnType<typeof validateDependencyGraph>): string {
  const lines: string[] = [];

  lines.push('# Mathematical Framework Dependency Graph Validation Report\n');
  lines.push(`**Generated:** ${new Date().toISOString()}\n`);

  // Summary
  lines.push('## Summary\n');
  lines.push(`- **Validation Status:** ${result.valid ? '✓ PASS' : '✗ FAIL'}`);
  lines.push(`- **Total Symbols:** ${result.graphMetrics.totalSymbols}`);
  lines.push(`- **Total Edges:** ${result.graphMetrics.totalEdges}`);
  lines.push(`- **Levels:** ${result.graphMetrics.levels}`);
  lines.push(`- **Root Nodes:** ${result.graphMetrics.rootNodes}`);
  lines.push(`- **Leaf Nodes:** ${result.graphMetrics.leafNodes}`);
  lines.push(`- **Longest Path:** ${result.graphMetrics.longestPath}`);
  lines.push(`- **Average Dependencies:** ${result.graphMetrics.averageDependencies.toFixed(2)}`);
  lines.push(`- **Cycles Detected:** ${result.cycles.length}`);
  lines.push(`- **Errors:** ${result.errors.length}`);
  lines.push(`- **Warnings:** ${result.warnings.length}\n`);

  // Computation Order
  lines.push('## Computation Order\n');
  lines.push('Symbols must be computed in this order (topological sort):\n');
  lines.push('```');
  const order = result.computationOrder;
  for (let i = 0; i < order.length; i += 10) {
    lines.push(order.slice(i, i + 10).join(' → '));
  }
  lines.push('```\n');

  // Independence Validation
  lines.push('## Independence Claims Validation\n');
  lines.push('| Symbol A | Symbol B | Claimed | Actual | Status | Reason |');
  lines.push('|----------|----------|---------|--------|--------|--------|');

  for (const check of result.independenceResults) {
    const status = check.valid ? '✓' : '✗';
    const claimed = check.claimed ? 'Independent' : 'Dependent';
    const actual = check.actual ? 'Independent' : 'Dependent';
    const reason = check.reason || '-';

    lines.push(`| ${check.symbolA} | ${check.symbolB} | ${claimed} | ${actual} | ${status} | ${reason} |`);
  }
  lines.push('');

  // Level Consistency
  lines.push('## Level Consistency\n');
  lines.push(`**Status:** ${result.levelConsistency ? '✓ PASS' : '✗ FAIL'}\n`);

  if (!result.levelConsistency) {
    lines.push('### Level Violations\n');
    const levelErrors = result.errors.filter(e => e.type === 'level-violation');
    for (const error of levelErrors) {
      lines.push(`- ${error.message}`);
    }
    lines.push('');
  }

  // Cycles
  if (result.cycles.length > 0) {
    lines.push('## Circular Dependencies ⚠️\n');
    for (const cycle of result.cycles) {
      lines.push(`- ${cycle.join(' → ')}`);
    }
    lines.push('');
  }

  // Errors
  if (result.errors.length > 0) {
    lines.push('## Errors\n');
    for (const error of result.errors) {
      lines.push(`### [${error.severity.toUpperCase()}] ${error.type}\n`);
      lines.push(`${error.message}\n`);
      if (error.symbols.length > 0) {
        lines.push(`**Affected symbols:** ${error.symbols.join(', ')}\n`);
      }
    }
  }

  // Warnings
  if (result.warnings.length > 0) {
    lines.push('## Warnings\n');
    for (const warning of result.warnings) {
      lines.push(`### ${warning.type}\n`);
      lines.push(`${warning.message}\n`);
      if (warning.symbols.length > 0) {
        lines.push(`**Affected symbols:** ${warning.symbols.join(', ')}\n`);
      }
    }
  }

  // Visualization
  lines.push('## Visualization\n');
  lines.push('See `dependency-graph.dot` for the GraphViz visualization.\n');
  lines.push('To render:\n');
  lines.push('```bash');
  lines.push('dot -Tpng dependency-graph.dot -o dependency-graph.png');
  lines.push('dot -Tsvg dependency-graph.dot -o dependency-graph.svg');
  lines.push('```\n');

  return lines.join('\n');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main(): void {
  console.log('\n=== Mathematical Framework Dependency Graph Generator ===\n');

  // Ensure output directory exists
  ensureDirectory(OUTPUT_DIR);

  // 1. Validate dependency graph
  console.log('Validating dependency graph...');
  const validationResult = validateDependencyGraph();

  console.log(`✓ Validation complete`);
  console.log(`  - Status: ${validationResult.valid ? 'PASS' : 'FAIL'}`);
  console.log(`  - Symbols: ${validationResult.graphMetrics.totalSymbols}`);
  console.log(`  - Edges: ${validationResult.graphMetrics.totalEdges}`);
  console.log(`  - Errors: ${validationResult.errors.length}`);
  console.log(`  - Warnings: ${validationResult.warnings.length}\n`);

  // 2. Generate GraphViz DOT file
  console.log('Generating GraphViz visualization...');
  const dotContent = generateVisualization();
  writeFile(DOT_FILE, dotContent);

  // 3. Generate validation report
  console.log('Generating validation report...');
  const reportContent = generateMarkdownReport(validationResult);
  writeFile(REPORT_FILE, reportContent);

  // 4. Export JSON
  console.log('Exporting JSON data...');
  const jsonContent = JSON.stringify({
    validation: validationResult,
    computationOrder: getComputationOrder()
  }, null, 2);
  writeFile(JSON_FILE, jsonContent);

  // 5. Render graph if requested
  if (shouldRender) {
    renderGraph(DOT_FILE, format);
  } else {
    console.log('\n💡 To render the graph, run:');
    console.log(`   npm run graph:generate -- --render --format=${format}\n`);
    console.log('   Or manually:');
    console.log(`   dot -T${format} ${DOT_FILE} -o ${DOT_FILE.replace('.dot', `.${format}`)}\n`);
  }

  // 6. Summary
  console.log('=== Summary ===\n');
  console.log(`Files generated in: ${OUTPUT_DIR}`);
  console.log(`  - dependency-graph.dot (GraphViz)`);
  console.log(`  - validation-report.md (Markdown report)`);
  console.log(`  - dependency-graph.json (JSON data)\n`);

  if (!validationResult.valid) {
    console.error('⚠️  Validation failed! Check the report for details.\n');
    process.exit(1);
  } else {
    console.log('✓ All validations passed!\n');
  }
}

// Run main function
if (require.main === module) {
  main();
}

export { main as generateDependencyGraph };

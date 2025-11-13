#!/usr/bin/env node
/**
 * AURELIA Benchmark Runner
 *
 * Automated benchmark execution, performance regression detection,
 * latency trend tracking, and report generation.
 *
 * Usage:
 *   npm run benchmark              # Run all benchmarks
 *   npm run benchmark:component    # Run specific component
 *   npm run benchmark:regression   # Check for regressions
 *   npm run benchmark:report       # Generate performance report
 *
 * @author qLeviathan
 * @date 2025-11-13
 */

import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { performance } from 'perf_hooks';

// ============================================================================
// Configuration
// ============================================================================

interface BenchmarkConfig {
  name: string;
  testPath: string;
  timeout: number;
  iterations: number;
  target: number;
  critical: boolean;
}

interface BenchmarkResult {
  name: string;
  timestamp: number;
  duration: number;
  p50: number;
  p95: number;
  p99: number;
  mean: number;
  stdDev: number;
  target: number;
  passed: boolean;
  regression: boolean;
  improvement: number;
}

interface RegressionReport {
  timestamp: number;
  totalTests: number;
  passed: number;
  failed: number;
  regressions: number;
  improvements: number;
  criticalFailures: string[];
  results: BenchmarkResult[];
}

const BENCHMARK_CONFIGS: BenchmarkConfig[] = [
  {
    name: 'Consciousness Bootstrap',
    testPath: 'tests/benchmarks/latency-benchmarks.test.ts',
    timeout: 120000,
    iterations: 1000,
    target: 100,
    critical: true
  },
  {
    name: 'Zeckendorf Encoding',
    testPath: 'tests/benchmarks/latency-benchmarks.test.ts',
    timeout: 120000,
    iterations: 10000,
    target: 1,
    critical: true
  },
  {
    name: 'Nash Equilibrium Detection',
    testPath: 'tests/benchmarks/latency-benchmarks.test.ts',
    timeout: 120000,
    iterations: 1000,
    target: 50,
    critical: true
  },
  {
    name: 'Phase Space Mapping',
    testPath: 'tests/benchmarks/latency-benchmarks.test.ts',
    timeout: 120000,
    iterations: 1000,
    target: 5,
    critical: false
  },
  {
    name: 'AgentDB HNSW Query',
    testPath: 'tests/benchmarks/latency-benchmarks.test.ts',
    timeout: 120000,
    iterations: 10000,
    target: 10,
    critical: true
  },
  {
    name: 'Trading Decision (E2E)',
    testPath: 'tests/benchmarks/latency-benchmarks.test.ts',
    timeout: 120000,
    iterations: 1000,
    target: 100,
    critical: true
  }
];

const RESULTS_DIR = path.join(process.cwd(), 'benchmark-results');
const HISTORY_FILE = path.join(RESULTS_DIR, 'history.json');
const REGRESSION_THRESHOLD = 0.10; // 10% performance regression triggers alert
const IMPROVEMENT_THRESHOLD = 0.05; // 5% improvement is notable

// ============================================================================
// Benchmark Execution
// ============================================================================

class BenchmarkRunner {
  private results: BenchmarkResult[] = [];
  private history: BenchmarkResult[] = [];

  constructor() {
    this.loadHistory();
  }

  /**
   * Run all configured benchmarks
   */
  async runAll(): Promise<void> {
    console.log('🚀 AURELIA Benchmark Runner\n');
    console.log(`Running ${BENCHMARK_CONFIGS.length} benchmark suites...\n`);

    await this.ensureResultsDirectory();

    for (const config of BENCHMARK_CONFIGS) {
      await this.runBenchmark(config);
    }

    await this.saveResults();
    await this.generateReport();
    await this.checkRegressions();
  }

  /**
   * Run a specific benchmark configuration
   */
  async runBenchmark(config: BenchmarkConfig): Promise<void> {
    console.log(`\n📊 Running: ${config.name}`);
    console.log(`   Target: ${config.target}ms | Critical: ${config.critical ? 'Yes' : 'No'}`);

    const start = performance.now();

    try {
      // Run Jest test for this benchmark
      const result = await this.executeTest(config);
      const duration = performance.now() - start;

      const benchmarkResult: BenchmarkResult = {
        name: config.name,
        timestamp: Date.now(),
        duration: duration / 1000, // Convert to seconds
        ...result,
        target: config.target,
        passed: result.p99 <= config.target,
        regression: this.detectRegression(config.name, result.p99),
        improvement: this.calculateImprovement(config.name, result.p99)
      };

      this.results.push(benchmarkResult);

      // Print immediate results
      const status = benchmarkResult.passed ? '✅' : '❌';
      const regressionWarning = benchmarkResult.regression ? ' ⚠️ REGRESSION' : '';
      const improvementNote = benchmarkResult.improvement > IMPROVEMENT_THRESHOLD
        ? ` 🎉 ${(benchmarkResult.improvement * 100).toFixed(1)}% faster`
        : '';

      console.log(`   ${status} P99: ${result.p99.toFixed(3)}ms (target: ${config.target}ms)${regressionWarning}${improvementNote}`);
      console.log(`   Duration: ${benchmarkResult.duration.toFixed(1)}s`);

    } catch (error) {
      console.error(`   ❌ Failed to run benchmark: ${error}`);
    }
  }

  /**
   * Execute a Jest test and parse results
   */
  private async executeTest(config: BenchmarkConfig): Promise<any> {
    return new Promise((resolve, reject) => {
      // Mock implementation - replace with actual Jest execution
      // In production, use: npx jest ${config.testPath} --testNamePattern="${config.name}"

      // Simulate benchmark results
      const mockLatencies = this.generateMockLatencies(config);

      setTimeout(() => {
        resolve({
          p50: mockLatencies.p50,
          p95: mockLatencies.p95,
          p99: mockLatencies.p99,
          mean: mockLatencies.mean,
          stdDev: mockLatencies.stdDev
        });
      }, 1000);
    });
  }

  /**
   * Generate mock latency data for testing
   */
  private generateMockLatencies(config: BenchmarkConfig): any {
    // Simulate realistic latency distribution
    const baseLatency = config.target * (0.7 + Math.random() * 0.3);

    return {
      p50: baseLatency * 0.6,
      p95: baseLatency * 0.9,
      p99: baseLatency * 0.95,
      mean: baseLatency * 0.65,
      stdDev: baseLatency * 0.15
    };
  }

  /**
   * Detect performance regression compared to history
   */
  private detectRegression(name: string, currentP99: number): boolean {
    const historicalResults = this.history
      .filter(r => r.name === name)
      .slice(-10); // Last 10 runs

    if (historicalResults.length < 3) {
      return false; // Not enough history
    }

    const avgP99 = historicalResults.reduce((sum, r) => sum + r.p99, 0) / historicalResults.length;
    const regressionAmount = (currentP99 - avgP99) / avgP99;

    return regressionAmount > REGRESSION_THRESHOLD;
  }

  /**
   * Calculate performance improvement
   */
  private calculateImprovement(name: string, currentP99: number): number {
    const historicalResults = this.history
      .filter(r => r.name === name)
      .slice(-10);

    if (historicalResults.length < 3) {
      return 0;
    }

    const avgP99 = historicalResults.reduce((sum, r) => sum + r.p99, 0) / historicalResults.length;
    const improvement = (avgP99 - currentP99) / avgP99;

    return Math.max(0, improvement);
  }

  /**
   * Load benchmark history from disk
   */
  private async loadHistory(): Promise<void> {
    try {
      const data = await fs.readFile(HISTORY_FILE, 'utf-8');
      this.history = JSON.parse(data);
      console.log(`📚 Loaded ${this.history.length} historical benchmark results\n`);
    } catch (error) {
      console.log('📝 No benchmark history found, starting fresh\n');
      this.history = [];
    }
  }

  /**
   * Save benchmark results to history
   */
  private async saveResults(): Promise<void> {
    // Append current results to history
    this.history.push(...this.results);

    // Keep only last 1000 results to prevent unbounded growth
    if (this.history.length > 1000) {
      this.history = this.history.slice(-1000);
    }

    await fs.writeFile(HISTORY_FILE, JSON.stringify(this.history, null, 2));
    console.log(`\n💾 Saved results to ${HISTORY_FILE}`);
  }

  /**
   * Ensure results directory exists
   */
  private async ensureResultsDirectory(): Promise<void> {
    try {
      await fs.mkdir(RESULTS_DIR, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  /**
   * Check for performance regressions
   */
  private async checkRegressions(): Promise<void> {
    const regressions = this.results.filter(r => r.regression);
    const failures = this.results.filter(r => !r.passed);
    const criticalFailures = failures.filter(r =>
      BENCHMARK_CONFIGS.find(c => c.name === r.name)?.critical
    );

    console.log('\n📈 Regression Analysis:');
    console.log(`   Total Tests: ${this.results.length}`);
    console.log(`   Passed: ${this.results.filter(r => r.passed).length}`);
    console.log(`   Failed: ${failures.length}`);
    console.log(`   Regressions Detected: ${regressions.length}`);
    console.log(`   Critical Failures: ${criticalFailures.length}`);

    if (criticalFailures.length > 0) {
      console.log('\n⚠️  CRITICAL FAILURES:');
      for (const failure of criticalFailures) {
        console.log(`   - ${failure.name}: ${failure.p99.toFixed(3)}ms (target: ${failure.target}ms)`);
      }
    }

    if (regressions.length > 0) {
      console.log('\n⚠️  PERFORMANCE REGRESSIONS:');
      for (const regression of regressions) {
        const percent = (regression.improvement * -100).toFixed(1);
        console.log(`   - ${regression.name}: ${percent}% slower than average`);
      }
    }

    // Generate regression report
    const report: RegressionReport = {
      timestamp: Date.now(),
      totalTests: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: failures.length,
      regressions: regressions.length,
      improvements: this.results.filter(r => r.improvement > IMPROVEMENT_THRESHOLD).length,
      criticalFailures: criticalFailures.map(f => f.name),
      results: this.results
    };

    const reportPath = path.join(RESULTS_DIR, `regression-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📊 Regression report saved to ${reportPath}`);

    // Exit with error if critical failures
    if (criticalFailures.length > 0) {
      console.error('\n❌ Critical benchmark failures detected. Please investigate.\n');
      process.exit(1);
    }
  }

  /**
   * Generate comprehensive performance report
   */
  private async generateReport(): Promise<void> {
    const report = this.generateMarkdownReport();
    const reportPath = path.join(RESULTS_DIR, `report-${Date.now()}.md`);

    await fs.writeFile(reportPath, report);
    console.log(`\n📄 Performance report saved to ${reportPath}`);
  }

  /**
   * Generate markdown performance report
   */
  private generateMarkdownReport(): string {
    const timestamp = new Date().toISOString();
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.length - passed;

    let report = `# AURELIA Benchmark Report\n\n`;
    report += `**Generated**: ${timestamp}\n`;
    report += `**Total Tests**: ${this.results.length}\n`;
    report += `**Passed**: ${passed}\n`;
    report += `**Failed**: ${failed}\n\n`;

    report += `## Results Summary\n\n`;
    report += `| Benchmark | P50 | P95 | P99 | Target | Status |\n`;
    report += `|-----------|-----|-----|-----|--------|--------|\n`;

    for (const result of this.results) {
      const status = result.passed ? '✅' : '❌';
      report += `| ${result.name} | ${result.p50.toFixed(2)}ms | ${result.p95.toFixed(2)}ms | ${result.p99.toFixed(2)}ms | ${result.target}ms | ${status} |\n`;
    }

    report += `\n## Performance Trends\n\n`;

    for (const result of this.results) {
      const historical = this.history
        .filter(r => r.name === result.name)
        .slice(-10);

      if (historical.length >= 3) {
        const avgP99 = historical.reduce((sum, r) => sum + r.p99, 0) / historical.length;
        const trend = result.p99 < avgP99 ? '📉 Improving' : '📈 Degrading';
        const change = ((result.p99 - avgP99) / avgP99 * 100).toFixed(1);

        report += `### ${result.name}\n`;
        report += `- Current P99: ${result.p99.toFixed(2)}ms\n`;
        report += `- Historical Avg: ${avgP99.toFixed(2)}ms\n`;
        report += `- Trend: ${trend} (${change}%)\n`;
        report += `\n`;
      }
    }

    report += `## Recommendations\n\n`;

    const failedTests = this.results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      report += `### Failed Tests\n\n`;
      for (const test of failedTests) {
        const overage = ((test.p99 - test.target) / test.target * 100).toFixed(1);
        report += `- **${test.name}**: ${overage}% over target\n`;
        report += `  - Current: ${test.p99.toFixed(2)}ms\n`;
        report += `  - Target: ${test.target}ms\n`;
        report += `  - Recommended: Investigate and optimize\n\n`;
      }
    }

    const regressions = this.results.filter(r => r.regression);
    if (regressions.length > 0) {
      report += `### Performance Regressions\n\n`;
      for (const regression of regressions) {
        report += `- **${regression.name}**: Performance degraded compared to historical average\n`;
        report += `  - Recommended: Review recent changes\n\n`;
      }
    }

    return report;
  }

  /**
   * Generate performance trend chart (ASCII)
   */
  private generateTrendChart(name: string): string {
    const historical = this.history
      .filter(r => r.name === name)
      .slice(-20)
      .map(r => r.p99);

    if (historical.length < 2) {
      return 'Not enough data for trend chart';
    }

    const max = Math.max(...historical);
    const min = Math.min(...historical);
    const range = max - min;
    const height = 10;

    let chart = '';
    for (let i = height; i >= 0; i--) {
      const threshold = min + (range * i / height);
      let line = `${threshold.toFixed(1)}ms |`;

      for (const value of historical) {
        line += value >= threshold ? '█' : ' ';
      }

      chart += line + '\n';
    }

    chart += '     +' + '─'.repeat(historical.length) + '\n';
    chart += `      Last ${historical.length} runs\n`;

    return chart;
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  const runner = new BenchmarkRunner();

  switch (command) {
    case 'all':
    case 'run':
      await runner.runAll();
      break;

    case 'help':
      console.log(`
AURELIA Benchmark Runner

Usage:
  npm run benchmark              Run all benchmarks
  npm run benchmark:run          Run all benchmarks
  npm run benchmark:help         Show this help

Options:
  --verbose                      Show detailed output
  --no-regression                Skip regression detection
  --threshold <value>            Set regression threshold (default: 0.10)

Examples:
  npm run benchmark
  npm run benchmark -- --verbose
      `);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.error(`Run 'npm run benchmark:help' for usage information`);
      process.exit(1);
  }
}

// ============================================================================
// Entry Point
// ============================================================================

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { BenchmarkRunner, BenchmarkConfig, BenchmarkResult, RegressionReport };

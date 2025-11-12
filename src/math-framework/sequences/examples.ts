/**
 * Examples and Demonstrations
 *
 * Comprehensive examples demonstrating all sequence generation methods,
 * verification of mathematical identities, and AgentDB integration.
 */

import {
  fibonacci,
  lucas,
  fibonacciCompare,
  lucasCompare,
  fibonacciSequence,
  lucasSequence,
  fibonacciQMatrix,
  verifyQMatrixProperties,
  FibonacciIdentities,
  LucasIdentities,
  FibonacciLucasRelations
} from './index';

import {
  fibonacciWithStorage,
  lucasWithStorage,
  benchmarkFibonacciMethods,
  benchmarkLucasMethods,
  generateLearningDataset,
  getAgentDBStats,
  exportForAgentDB
} from './agentdb-integration';

/**
 * Example 1: Basic Fibonacci and Lucas computation
 */
export function example1_BasicComputation() {
  console.log('\n=== Example 1: Basic Computation ===\n');

  // Compute Fibonacci numbers
  console.log('Fibonacci Numbers:');
  for (let n = 0; n <= 15; n++) {
    console.log(`F(${n}) = ${fibonacci(n)}`);
  }

  console.log('\nLucas Numbers:');
  for (let n = 0; n <= 15; n++) {
    console.log(`L(${n}) = ${lucas(n)}`);
  }
}

/**
 * Example 2: Method comparison and verification
 */
export function example2_MethodComparison() {
  console.log('\n=== Example 2: Method Comparison ===\n');

  // Compare Fibonacci methods
  console.log('Fibonacci Method Comparison (n=20):');
  const fibComp = fibonacciCompare(20);
  console.log(`  Recurrence: ${fibComp.recurrence}`);
  console.log(`  Binet:      ${fibComp.binet}`);
  console.log(`  Q-Matrix:   ${fibComp.qmatrix}`);
  console.log(`  Memoized:   ${fibComp.memoized}`);
  console.log(`  All Match:  ${fibComp.allMatch}`);
  console.log('\n  Timings (ms):');
  console.log(`    Recurrence: ${fibComp.timings.recurrence.toFixed(6)}`);
  console.log(`    Binet:      ${fibComp.timings.binet.toFixed(6)}`);
  console.log(`    Q-Matrix:   ${fibComp.timings.qmatrix.toFixed(6)}`);
  console.log(`    Memoized:   ${fibComp.timings.memoized.toFixed(6)}`);

  // Compare Lucas methods
  console.log('\nLucas Method Comparison (n=20):');
  const lucComp = lucasCompare(20);
  console.log(`  Recurrence:        ${lucComp.recurrence}`);
  console.log(`  Binet:             ${lucComp.binet}`);
  console.log(`  Fibonacci Relation: ${lucComp.fibonacciRelation}`);
  console.log(`  Memoized:          ${lucComp.memoized}`);
  console.log(`  All Match:         ${lucComp.allMatch}`);
  console.log('\n  Timings (ms):');
  console.log(`    Recurrence:         ${lucComp.timings.recurrence.toFixed(6)}`);
  console.log(`    Binet:              ${lucComp.timings.binet.toFixed(6)}`);
  console.log(`    Fibonacci Relation: ${lucComp.timings.fibonacciRelation.toFixed(6)}`);
  console.log(`    Memoized:           ${lucComp.timings.memoized.toFixed(6)}`);
}

/**
 * Example 3: Q-Matrix method demonstration
 */
export function example3_QMatrixMethod() {
  console.log('\n=== Example 3: Q-Matrix Method ===\n');

  const n = 15;
  const result = fibonacciQMatrix(n);

  console.log(`Computing F(${n}) using Q-Matrix method:`);
  console.log(`\nQ^${n} = [[${result.matrix[0][0]}, ${result.matrix[0][1]}],`);
  console.log(`         [${result.matrix[1][0]}, ${result.matrix[1][1]}]]`);
  console.log(`\nF(${n})   = ${result.fibonacci}`);
  console.log(`F(${n+1}) = ${result.fibonacciNext}`);
  console.log(`F(${n-1}) = ${result.fibonacciPrev}`);

  const isValid = verifyQMatrixProperties(result);
  console.log(`\nMatrix properties verified: ${isValid}`);

  // Verify recurrence relation
  const recurrenceValid = result.fibonacciNext === result.fibonacci + result.fibonacciPrev;
  console.log(`Recurrence relation F(n+1) = F(n) + F(n-1): ${recurrenceValid}`);

  // Verify determinant
  const det = result.matrix[0][0] * result.matrix[1][1] - result.matrix[0][1] * result.matrix[1][0];
  const expectedDet = BigInt(n % 2 === 0 ? 1 : -1);
  console.log(`Determinant = ${det} (expected: ${expectedDet}): ${det === expectedDet}`);
}

/**
 * Example 4: Mathematical identities verification
 */
export function example4_IdentityVerification() {
  console.log('\n=== Example 4: Mathematical Identities ===\n');

  console.log('Fibonacci Identities:');
  for (let n = 5; n <= 15; n += 5) {
    console.log(`\n  n = ${n}:`);

    const cassini = FibonacciIdentities.verifyCassini(n);
    console.log(`    Cassini: F(n-1)·F(n+1) - F(n)² = (-1)ⁿ: ${cassini}`);

    const sum = FibonacciIdentities.verifySum(n);
    console.log(`    Sum: Σ F(i) = F(n+2) - 1: ${sum}`);
  }

  console.log('\n\nLucas Identities:');
  for (let n = 5; n <= 15; n += 5) {
    console.log(`\n  n = ${n}:`);

    const fibRel = LucasIdentities.verifyFibonacciRelation(n);
    console.log(`    L(n) = F(n-1) + F(n+1): ${fibRel}`);

    const square = LucasIdentities.verifySquareIdentity(n);
    console.log(`    L(n)² - 5·F(n)² = 4·(-1)ⁿ: ${square}`);

    const product = LucasIdentities.verifyFibonacciLucasProduct(n);
    console.log(`    F(2n) = F(n)·L(n): ${product}`);
  }
}

/**
 * Example 5: Large number computation
 */
export function example5_LargeNumbers() {
  console.log('\n=== Example 5: Large Number Computation ===\n');

  const testValues = [100, 200, 500, 1000];

  console.log('Computing large Fibonacci numbers:');
  for (const n of testValues) {
    const start = performance.now();
    const value = fibonacci(n);
    const time = performance.now() - start;

    const valueStr = value.toString();
    const digits = valueStr.length;

    console.log(`\nF(${n}):`);
    console.log(`  Digits: ${digits}`);
    console.log(`  First 50: ${valueStr.substring(0, 50)}...`);
    console.log(`  Time: ${time.toFixed(4)} ms`);
  }

  console.log('\n\nComputing large Lucas numbers:');
  for (const n of testValues) {
    const start = performance.now();
    const value = lucas(n);
    const time = performance.now() - start;

    const valueStr = value.toString();
    const digits = valueStr.length;

    console.log(`\nL(${n}):`);
    console.log(`  Digits: ${digits}`);
    console.log(`  First 50: ${valueStr.substring(0, 50)}...`);
    console.log(`  Time: ${time.toFixed(4)} ms`);
  }
}

/**
 * Example 6: Fibonacci and Lucas relationships
 */
export function example6_FibonacciLucasRelations() {
  console.log('\n=== Example 6: Fibonacci-Lucas Relationships ===\n');

  const n = 10;
  const sequences = FibonacciLucasRelations.parallelSequences(n);

  console.log('Parallel Sequences:');
  console.log('n\tF(n)\tL(n)\tRatio L(n)/F(n)');
  console.log('-'.repeat(50));

  for (const seq of sequences) {
    const ratio = seq.fibonacci !== 0n
      ? Number(seq.lucas) / Number(seq.fibonacci)
      : 0;

    console.log(`${seq.n}\t${seq.fibonacci}\t${seq.lucas}\t${ratio.toFixed(4)}`);
  }

  console.log('\n\nVerifying all identities for n=10:');
  const verification = FibonacciLucasRelations.verifyAllIdentities(10);
  console.log(`  Fibonacci relation:      ${verification.fibonacciRelation}`);
  console.log(`  Alternative relation:    ${verification.alternativeRelation}`);
  console.log(`  Square identity:         ${verification.squareIdentity}`);
  console.log(`  Doubling formula:        ${verification.doublingFormula}`);
  console.log(`  Fibonacci-Lucas product: ${verification.fibonacciLucasProduct}`);
  console.log(`  All pass:                ${verification.allPass}`);
}

/**
 * Example 7: Performance benchmarking
 */
export function example7_PerformanceBenchmark() {
  console.log('\n=== Example 7: Performance Benchmark ===\n');

  console.log('Benchmarking Fibonacci methods (n=0 to 30):');
  const fibPerf = benchmarkFibonacciMethods(0, 30);

  console.log('\nAverage computation time (ms):');
  for (const [method, avgTime] of Object.entries(fibPerf.averagePerformance)) {
    console.log(`  ${method.padEnd(15)}: ${avgTime.toFixed(6)}`);
  }

  console.log('\nFastest method by n:');
  const methodCounts: Record<string, number> = {};
  for (const comp of fibPerf.methodComparisons) {
    methodCounts[comp.fastestMethod] = (methodCounts[comp.fastestMethod] || 0) + 1;
  }
  for (const [method, count] of Object.entries(methodCounts)) {
    console.log(`  ${method.padEnd(15)}: ${count} times`);
  }

  console.log('\n\nBenchmarking Lucas methods (n=0 to 30):');
  const lucPerf = benchmarkLucasMethods(0, 30);

  console.log('\nAverage computation time (ms):');
  for (const [method, avgTime] of Object.entries(lucPerf.averagePerformance)) {
    console.log(`  ${method.padEnd(20)}: ${avgTime.toFixed(6)}`);
  }
}

/**
 * Example 8: AgentDB integration
 */
export function example8_AgentDBIntegration() {
  console.log('\n=== Example 8: AgentDB Integration ===\n');

  console.log('Computing sequences with pattern storage:');

  // Compute with storage
  for (let n = 0; n <= 20; n++) {
    fibonacciWithStorage(n);
    lucasWithStorage(n);
  }

  // Generate learning dataset
  console.log('\nGenerating learning dataset (n=0 to 50):');
  const dataset = generateLearningDataset(50);

  console.log(`  Fibonacci sequence entries: ${dataset.fibonacciSequence.length}`);
  console.log(`  Lucas sequence entries:     ${dataset.lucasSequence.length}`);
  console.log(`  Identity verifications:     ${dataset.identityVerifications.length}`);

  const verified = dataset.identityVerifications.filter(v => v.verified).length;
  const total = dataset.identityVerifications.length;
  const successRate = (verified / total * 100).toFixed(1);

  console.log(`  Verification success rate:  ${successRate}% (${verified}/${total})`);

  // Get statistics
  console.log('\nAgentDB Statistics:');
  const stats = getAgentDBStats();
  console.log(`  Total patterns:      ${stats.totalPatterns}`);
  console.log(`  Fibonacci patterns:  ${stats.fibonacciPatterns}`);
  console.log(`  Lucas patterns:      ${stats.lucasPatterns}`);
  console.log(`  Performance datasets: ${stats.performanceDatasets}`);
  console.log(`  Verifications:       ${stats.verifications}`);
  console.log(`  Success rate:        ${(stats.verificationSuccessRate * 100).toFixed(1)}%`);

  // Export data
  console.log('\nExporting data for AgentDB:');
  const exportData = exportForAgentDB();
  console.log(`  Total data objects:  ${exportData.patterns.length + exportData.performance.length + exportData.verifications.length}`);
}

/**
 * Example 9: Sequence generation
 */
export function example9_SequenceGeneration() {
  console.log('\n=== Example 9: Sequence Generation ===\n');

  const n = 20;

  console.log(`Fibonacci sequence (0 to ${n}):`);
  const fibSeq = fibonacciSequence(n);
  console.log(fibSeq.map((v, i) => `F(${i})=${v}`).join(', '));

  console.log(`\n\nLucas sequence (0 to ${n}):`);
  const lucSeq = lucasSequence(n);
  console.log(lucSeq.map((v, i) => `L(${i})=${v}`).join(', '));
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   FIBONACCI AND LUCAS SEQUENCE GENERATION EXAMPLES          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  try {
    example1_BasicComputation();
    example2_MethodComparison();
    example3_QMatrixMethod();
    example4_IdentityVerification();
    example5_LargeNumbers();
    example6_FibonacciLucasRelations();
    example7_PerformanceBenchmark();
    example8_AgentDBIntegration();
    example9_SequenceGeneration();

    console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║   ALL EXAMPLES COMPLETED SUCCESSFULLY                       ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n\nERROR:', error);
  }
}

// Export individual examples for selective execution
export const examples = {
  basicComputation: example1_BasicComputation,
  methodComparison: example2_MethodComparison,
  qMatrixMethod: example3_QMatrixMethod,
  identityVerification: example4_IdentityVerification,
  largeNumbers: example5_LargeNumbers,
  fibonacciLucasRelations: example6_FibonacciLucasRelations,
  performanceBenchmark: example7_PerformanceBenchmark,
  agentDBIntegration: example8_AgentDBIntegration,
  sequenceGeneration: example9_SequenceGeneration,
  runAll: runAllExamples
};

// Run all examples if executed directly
if (require.main === module) {
  runAllExamples();
}

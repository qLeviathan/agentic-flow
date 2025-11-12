/**
 * Behrend-Kimberling Theorem Demonstration
 *
 * This demo validates the theorem: S(n) = 0 ⟺ n+1 = Lₘ (Lucas number)
 * and stores Nash equilibrium points in AgentDB memory.
 */

import {
  analyzeBKTheorem,
  verifyBKTheoremAt,
  findNashEquilibria,
  generateBKReport,
  computeV,
  computeU,
  computeS,
  computeD,
  type BKAnalysis
} from '../src/math-framework/divergence/behrend-kimberling';

import {
  BKMemoryManager
} from '../src/math-framework/divergence/agentdb-integration';

import { lucas } from '../src/math-framework/sequences/lucas';

/**
 * Demo 1: Basic theorem verification for small values
 */
function demo1_basicVerification() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DEMO 1: Basic Behrend-Kimberling Theorem Verification');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Test first 20 points
  for (let n = 0; n <= 20; n++) {
    const result = verifyBKTheoremAt(n);
    console.log(result.message);
  }

  console.log('\n');
}

/**
 * Demo 2: Full analysis for range [0, 100]
 */
function demo2_fullAnalysis() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DEMO 2: Full Analysis for Range [0, 100]');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const analysis = analyzeBKTheorem(100);
  const report = generateBKReport(analysis);
  console.log(report);
}

/**
 * Demo 3: Nash Equilibrium Detection
 */
function demo3_nashEquilibria() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DEMO 3: Nash Equilibrium Detection');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const equilibria = findNashEquilibria(200);

  console.log(`Found ${equilibria.length} Nash equilibria in range [0, 200]:\n`);

  for (const n of equilibria) {
    const V = computeV(n);
    const U = computeU(n);
    const S = computeS(n, V, U);
    const d = computeD(n);
    const lucasIndex = equilibria.indexOf(n);

    console.log(`n = ${n}:`);
    console.log(`  V(${n}) = ${V}, U(${n}) = ${U}, S(${n}) = ${S}`);
    console.log(`  d(${n}) = ${d}`);
    console.log(`  ${n + 1} = L(${lucas(lucasIndex)})`);
    console.log('');
  }
}

/**
 * Demo 4: AgentDB Memory Integration
 */
async function demo4_agentdbIntegration() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DEMO 4: AgentDB Memory Integration');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const memoryManager = new BKMemoryManager();

  // Analyze and store results
  console.log('Analyzing B-K theorem for range [0, 150]...');
  const result = await memoryManager.storeAnalysis(150);

  console.log(`\nStored ${result.nashKeys.length} Nash equilibrium points`);
  console.log(`Pattern key: ${result.patternKey}`);
  console.log(`\nSummary:`);
  console.log(`  Total Nash points: ${result.summary.totalNashPoints}`);
  console.log(`  Range: [0, ${result.summary.range}]`);
  console.log(`  Theorem verified: ${result.summary.verified ? '✓ YES' : '✗ NO'}`);

  // Retrieve and display some stored Nash points
  console.log('\n─────────────────────────────────────────────────────────────');
  console.log('Stored Nash Equilibria (first 10):');
  console.log('─────────────────────────────────────────────────────────────\n');

  const stored = await memoryManager.getNashEquilibria(150);
  for (let i = 0; i < Math.min(10, stored.length); i++) {
    const entry = stored[i];
    console.log(`n = ${entry.n}:`);
    console.log(`  Lucas number: ${entry.lucasNumber} = L(${entry.lucasIndex})`);
    console.log(`  V = ${entry.V}, U = ${entry.U}, S = ${entry.S}, d = ${entry.d}`);
    console.log('');
  }

  // Memory statistics
  const stats = memoryManager.getStats();
  console.log('─────────────────────────────────────────────────────────────');
  console.log('Memory Statistics:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log(`  Total entries: ${stats.totalEntries}`);
  console.log(`  Nash entries: ${stats.nashEntries}`);
  console.log(`  Pattern entries: ${stats.patternEntries}`);
  console.log('');
}

/**
 * Demo 5: Cumulative Function Comparison
 */
function demo5_cumulativeFunctions() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DEMO 5: Cumulative Function Comparison V(n) vs U(n)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('n\tV(n)\tU(n)\tS(n)\td(n)\tNash?');
  console.log('─────────────────────────────────────────────────────────────');

  for (let n = 0; n <= 30; n++) {
    const V = computeV(n);
    const U = computeU(n);
    const S = computeS(n, V, U);
    const d = computeD(n);
    const isNash = S === 0 ? '✓' : '';

    console.log(`${n}\t${V}\t${U}\t${S}\t${d}\t${isNash}`);
  }

  console.log('\n');
}

/**
 * Demo 6: Pattern Analysis
 */
function demo6_patternAnalysis() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DEMO 6: Pattern Analysis - S(n) Divergence Pattern');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const analysis = analyzeBKTheorem(50);

  console.log('Divergence pattern S(n) for n ∈ [0, 50]:\n');

  let line = '';
  for (let i = 0; i <= 50; i++) {
    const point = analysis.points[i];
    const marker = point.isNashEquilibrium ? '0' :
                   point.S > 0 ? '+' : '-';
    line += marker;

    if ((i + 1) % 50 === 0) {
      console.log(line);
      line = '';
    }
  }
  if (line) console.log(line);

  console.log('\nLegend: 0 = Nash equilibrium (S=0), + = S>0, - = S<0\n');

  // Show statistics
  const positiveCount = analysis.points.filter(p => p.S > 0).length;
  const negativeCount = analysis.points.filter(p => p.S < 0).length;
  const zeroCount = analysis.points.filter(p => p.S === 0).length;

  console.log('Statistics:');
  console.log(`  S(n) > 0: ${positiveCount} points (${(positiveCount / 51 * 100).toFixed(1)}%)`);
  console.log(`  S(n) < 0: ${negativeCount} points (${(negativeCount / 51 * 100).toFixed(1)}%)`);
  console.log(`  S(n) = 0: ${zeroCount} points (${(zeroCount / 51 * 100).toFixed(1)}%)`);
  console.log('');
}

/**
 * Main demo runner
 */
async function runAllDemos() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║     BEHREND-KIMBERLING THEOREM VALIDATOR DEMONSTRATION        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('\n');

  try {
    demo1_basicVerification();
    demo2_fullAnalysis();
    demo3_nashEquilibria();
    await demo4_agentdbIntegration();
    demo5_cumulativeFunctions();
    demo6_patternAnalysis();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('ALL DEMOS COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('Error running demos:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  runAllDemos().catch(console.error);
}

export {
  demo1_basicVerification,
  demo2_fullAnalysis,
  demo3_nashEquilibria,
  demo4_agentdbIntegration,
  demo5_cumulativeFunctions,
  demo6_patternAnalysis,
  runAllDemos
};

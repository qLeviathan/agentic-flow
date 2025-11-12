/**
 * Behrend-Kimberling Theorem - Quick Start Example
 *
 * Demonstrates basic usage of the B-K theorem validator
 */

import {
  analyzeBKTheorem,
  verifyBKTheoremAt,
  findNashEquilibria,
  generateBKReport,
  BKMemoryManager
} from '../src/math-framework/divergence';

// Example 1: Verify theorem at specific point
console.log('Example 1: Verify at n=10');
const result = verifyBKTheoremAt(10);
console.log(result.message);
console.log('');

// Example 2: Find Nash equilibria
console.log('Example 2: Find Nash equilibria in [0, 50]');
const equilibria = findNashEquilibria(50);
console.log(`Found ${equilibria.length} Nash equilibria:`, equilibria);
console.log('');

// Example 3: Full analysis
console.log('Example 3: Full analysis for [0, 30]');
const analysis = analyzeBKTheorem(30);
const report = generateBKReport(analysis);
console.log(report);

// Example 4: Store in AgentDB memory
console.log('Example 4: Store Nash candidates in memory');
(async () => {
  const memory = new BKMemoryManager();
  const stored = await memory.storeAnalysis(50);
  console.log(`Stored ${stored.summary.totalNashPoints} Nash points`);
  console.log(`Theorem verified: ${stored.summary.verified ? 'YES' : 'NO'}`);

  const stats = memory.getStats();
  console.log(`Memory: ${stats.nashEntries} Nash entries, ${stats.patternEntries} patterns`);
})();

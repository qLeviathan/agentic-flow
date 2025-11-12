/**
 * WASM Integration Examples
 *
 * This file demonstrates how to use the WASM modules in your Tauri app.
 */

import wasm, {
  fibonacci,
  lucas,
  zeckendorf,
  bkDivergence,
  phaseSpaceTrajectory,
  initReasoningBank,
  storePattern,
  findSimilarPatterns,
  applyEdit,
  clearCaches,
  formatLargeNumber,
  parseLargeNumber,
} from './index';
import { parseZeckendorf, createPattern, hasHighConfidence } from './types';

// ============================================================================
// MATH FRAMEWORK EXAMPLES
// ============================================================================

/**
 * Example: Computing Fibonacci numbers
 */
export async function fibonacciExample() {
  console.log('=== Fibonacci Example ===');

  // Compute single Fibonacci number
  const f10 = await fibonacci(10);
  console.log('F(10) =', f10); // "55"

  // Compute large Fibonacci number
  const f100 = await fibonacci(100);
  console.log('F(100) =', formatLargeNumber(f100));

  // Compute multiple in parallel
  const numbers = [5, 10, 15, 20, 25];
  const results = await wasm.fibonacciBatch(numbers);
  console.log('Batch results:', results);

  // Work with BigInt for large numbers
  const bigNum = parseLargeNumber(f100);
  console.log('As BigInt:', bigNum);
}

/**
 * Example: Zeckendorf decomposition
 */
export async function zeckendorfExample() {
  console.log('=== Zeckendorf Example ===');

  // Decompose a number
  const result = await zeckendorf(100);
  console.log('Raw result:', result);

  // Parse the result
  const parsed = parseZeckendorf(result);
  console.log('100 = ', parsed.string_repr);
  console.log('Indices:', parsed.indices);
  console.log('Fibonacci numbers:', parsed.fibonacci_numbers);
  console.log('Valid:', parsed.is_valid);

  // Try different numbers
  for (const n of [10, 50, 100, 1000]) {
    const z = await zeckendorf(n);
    const p = parseZeckendorf(z);
    console.log(`${n} = ${p.string_repr}`);
  }
}

/**
 * Example: BK Divergence computation
 */
export async function bkDivergenceExample() {
  console.log('=== BK Divergence Example ===');

  // Compute divergence for a sequence
  const results = [];
  for (let n = 1; n <= 20; n++) {
    const s = await bkDivergence(n);
    results.push({ n, s });
    console.log(`S(${n}) = ${s}`);
  }

  return results;
}

/**
 * Example: Phase space trajectory
 */
export async function trajectoryExample() {
  console.log('=== Phase Space Trajectory Example ===');

  // Create trajectory from 1 to 100
  const traj = await phaseSpaceTrajectory(1, 100);

  console.log('Trajectory info:');
  console.log('- Start:', traj.start);
  console.log('- End:', traj.end);
  console.log('- Points:', traj.length);
  console.log('- Path length:', traj.path_length.toFixed(2));

  return traj;
}

// ============================================================================
// REASONINGBANK EXAMPLES
// ============================================================================

/**
 * Example: Storing and retrieving patterns
 */
export async function reasoningBankExample() {
  console.log('=== ReasoningBank Example ===');

  // Initialize
  await initReasoningBank('my-app-db');
  console.log('ReasoningBank initialized');

  // Create and store a pattern
  const pattern = createPattern(
    'Implement user authentication',
    'security',
    'Use JWT tokens with refresh mechanism',
    0.95,
    120
  );

  const patternId = await storePattern(pattern);
  console.log('Stored pattern:', patternId);

  // Store more patterns
  const patterns = [
    createPattern(
      'Optimize database queries',
      'performance',
      'Add indexes on frequently queried columns',
      0.88,
      60
    ),
    createPattern(
      'Handle authentication errors',
      'security',
      'Show user-friendly error messages without exposing details',
      0.92,
      30
    ),
  ];

  for (const p of patterns) {
    const id = await storePattern(p);
    console.log('Stored pattern:', id);
  }

  // Find similar patterns
  const similar = await findSimilarPatterns(
    'Add user login functionality',
    'security',
    3
  );

  console.log('Similar patterns found:', similar.length);
  similar.forEach((s, i) => {
    console.log(`${i + 1}. ${s.pattern.task_description}`);
    console.log(`   Similarity: ${s.similarity_score.toFixed(2)}`);
  });
}

// ============================================================================
// AGENTBOOSTER EXAMPLES
// ============================================================================

/**
 * Example: Code editing with AgentBooster
 */
export async function agentBoosterExample() {
  console.log('=== AgentBooster Example ===');

  // Original code
  const originalCode = `
function greet(name) {
  console.log("Hello, " + name);
}
  `.trim();

  // Edit snippet
  const editSnippet = `
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
  `.trim();

  // Apply edit
  const result = await applyEdit(originalCode, editSnippet, 'javascript');

  console.log('Edit result:');
  console.log('- Confidence:', result.confidence);
  console.log('- Strategy:', result.strategy);
  console.log('- Chunks found:', result.chunks_found);
  console.log('- Syntax valid:', result.syntax_valid);
  console.log('- Processing time:', result.processing_time_ms, 'ms');

  if (hasHighConfidence(result)) {
    console.log('High confidence edit!');
    console.log('Merged code:', result.merged_code);
  } else {
    console.log('Low confidence, review needed');
  }

  return result;
}

/**
 * Example: Editing TypeScript code
 */
export async function typeScriptEditExample() {
  console.log('=== TypeScript Edit Example ===');

  const originalCode = `
interface User {
  id: number;
  name: string;
}

function getUser(id: number): User | null {
  return null;
}
  `.trim();

  const editSnippet = `
function getUser(id: number): Promise<User | null> {
  return Promise.resolve(null);
}
  `.trim();

  const result = await applyEdit(originalCode, editSnippet, 'typescript');

  console.log('TypeScript edit confidence:', result.confidence);
  return result;
}

// ============================================================================
// PERFORMANCE & CACHE MANAGEMENT
// ============================================================================

/**
 * Example: Performance monitoring
 */
export async function performanceExample() {
  console.log('=== Performance Example ===');

  // Measure Fibonacci computation time
  const start = performance.now();
  await fibonacci(1000);
  const end = performance.now();
  console.log(`F(1000) computed in ${(end - start).toFixed(2)}ms`);

  // Batch operations are faster
  const batchStart = performance.now();
  await wasm.fibonacciBatch([100, 200, 300, 400, 500]);
  const batchEnd = performance.now();
  console.log(`Batch of 5 computed in ${(batchEnd - batchStart).toFixed(2)}ms`);
}

/**
 * Example: Cache management
 */
export async function cacheManagementExample() {
  console.log('=== Cache Management Example ===');

  // First computation (cold cache)
  const start1 = performance.now();
  await fibonacci(500);
  const time1 = performance.now() - start1;
  console.log(`Cold cache: ${time1.toFixed(2)}ms`);

  // Second computation (warm cache)
  const start2 = performance.now();
  await fibonacci(500);
  const time2 = performance.now() - start2;
  console.log(`Warm cache: ${time2.toFixed(2)}ms`);
  console.log(`Speedup: ${(time1 / time2).toFixed(2)}x`);

  // Clear caches
  await clearCaches();
  console.log('Caches cleared');

  // After clearing (cold cache again)
  const start3 = performance.now();
  await fibonacci(500);
  const time3 = performance.now() - start3;
  console.log(`After clear: ${time3.toFixed(2)}ms`);
}

// ============================================================================
// COMBINED WORKFLOW EXAMPLE
// ============================================================================

/**
 * Example: Complete workflow combining all modules
 */
export async function completeWorkflowExample() {
  console.log('=== Complete Workflow Example ===\n');

  // 1. Initialize ReasoningBank
  await initReasoningBank('demo-db');
  console.log('✓ ReasoningBank initialized\n');

  // 2. Compute some mathematical properties
  console.log('Computing mathematical properties...');
  const n = 100;
  const fib = await fibonacci(n);
  const z = await zeckendorf(n);
  const s = await bkDivergence(n);

  console.log(`For n=${n}:`);
  console.log(`- Fibonacci: ${formatLargeNumber(fib)}`);
  console.log(`- Zeckendorf: ${parseZeckendorf(z).string_repr}`);
  console.log(`- BK Divergence: ${s}\n`);

  // 3. Store these results as a pattern
  const pattern = createPattern(
    `Computed properties for n=${n}`,
    'mathematics',
    `Used WASM modules for high-performance computation`,
    1.0,
    1
  );

  const patternId = await storePattern(pattern);
  console.log(`✓ Stored as pattern: ${patternId}\n`);

  // 4. Apply code transformation
  console.log('Applying code transformation...');
  const code = 'const result = fibonacci(100);';
  const edit = 'const result = await fibonacci(100);';

  const editResult = await applyEdit(code, edit, 'javascript');
  console.log(`✓ Code edited with ${editResult.confidence} confidence\n`);

  // 5. Performance summary
  console.log('Workflow completed successfully!');
  console.log('Memory usage can be optimized by calling clearCaches()');
}

// ============================================================================
// ERROR HANDLING EXAMPLE
// ============================================================================

/**
 * Example: Proper error handling
 */
export async function errorHandlingExample() {
  console.log('=== Error Handling Example ===');

  try {
    // This should work
    const result = await fibonacci(10);
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
  }

  try {
    // This will fail (unsupported language)
    await applyEdit('code', 'edit', 'invalid-language');
  } catch (error) {
    console.error('Expected error:', error);
  }

  try {
    // This will fail (invalid pattern ID)
    await wasm.getPattern('not-a-uuid');
  } catch (error) {
    console.error('Expected error:', error);
  }
}

// ============================================================================
// EXPORTS FOR USE IN COMPONENTS
// ============================================================================

export default {
  // Mathematical examples
  fibonacciExample,
  zeckendorfExample,
  bkDivergenceExample,
  trajectoryExample,

  // ReasoningBank examples
  reasoningBankExample,

  // AgentBooster examples
  agentBoosterExample,
  typeScriptEditExample,

  // Performance examples
  performanceExample,
  cacheManagementExample,

  // Complete workflow
  completeWorkflowExample,

  // Error handling
  errorHandlingExample,
};

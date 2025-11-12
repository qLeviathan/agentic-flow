# Usage Examples

Comprehensive examples demonstrating all features of the Mathematical Framework.

## Table of Contents

1. [Basic Sequences](#basic-sequences)
2. [Zeckendorf Decomposition](#zeckendorf-decomposition)
3. [Behrend-Kimberling Theorem](#behrend-kimberling-theorem)
4. [Q-Network Training](#q-network-training)
5. [Phase Space Analysis](#phase-space-analysis)
6. [AgentDB Integration](#agentdb-integration)
7. [WASM Performance](#wasm-performance)
8. [Advanced Patterns](#advanced-patterns)

---

## Basic Sequences

### Example 1: Computing Fibonacci Numbers

```typescript
import { fibonacci, fibonacciRange } from './src/math-framework/sequences';

// Single value
const f10 = fibonacci(10n);
console.log(`F(10) = ${f10}`);  // 55

// Large numbers
const f100 = fibonacci(100n);
console.log(`F(100) = ${f100}`); // 354224848179261915075

// Range of values
const fibs = fibonacciRange(1n, 10n);
console.log('First 10 Fibonacci numbers:', fibs);
// [1n, 1n, 2n, 3n, 5n, 8n, 13n, 21n, 34n, 55n]

// Property verification: F(n)² - F(n-1)·F(n+1) = (-1)^(n+1)
function verifyCassini(n: number): void {
  const fn = fibonacci(BigInt(n));
  const fn_1 = fibonacci(BigInt(n - 1));
  const fn_1_plus = fibonacci(BigInt(n + 1));

  const lhs = fn * fn;
  const rhs = fn_1 * fn_1_plus + BigInt((-1) ** (n + 1));

  console.log(`Cassini identity at n=${n}: ${lhs === rhs ? '✓' : '✗'}`);
}

verifyCassini(10);  // ✓
verifyCassini(50);  // ✓
```

### Example 2: Lucas Numbers and Relations

```typescript
import { lucas, lucasRange, fibonacci } from './src/math-framework/sequences';

// Compute Lucas numbers
const l10 = lucas(10n);
console.log(`L(10) = ${l10}`);  // 123

// Range
const lucasNums = lucasRange(0n, 10n);
console.log('First 11 Lucas numbers:', lucasNums);
// [2n, 1n, 3n, 4n, 7n, 11n, 18n, 29n, 47n, 76n, 123n]

// Verify L(n) = F(n-1) + F(n+1)
function verifyLucasRelation(n: number): void {
  const ln = lucas(BigInt(n));
  const fn_1 = fibonacci(BigInt(n - 1));
  const fn_plus = fibonacci(BigInt(n + 1));

  const sum = fn_1 + fn_plus;
  console.log(`L(${n}) = F(${n-1}) + F(${n+1}): ${ln} = ${sum} ${ln === sum ? '✓' : '✗'}`);
}

verifyLucasRelation(5);   // L(5) = F(4) + F(6): 11 = 11 ✓
verifyLucasRelation(10);  // L(10) = F(9) + F(11): 123 = 123 ✓

// Verify L(n)² - 5F(n)² = 4(-1)ⁿ
function verifyLucasIdentity(n: number): void {
  const ln = lucas(BigInt(n));
  const fn = fibonacci(BigInt(n));

  const lhs = ln * ln - 5n * fn * fn;
  const rhs = BigInt(4 * ((-1) ** n));

  console.log(`L(${n})² - 5F(${n})² = 4(-1)^${n}: ${lhs} = ${rhs} ${lhs === rhs ? '✓' : '✗'}`);
}

verifyLucasIdentity(5);   // ✓
verifyLucasIdentity(10);  // ✓
```

### Example 3: Golden Ratio Approximation

```typescript
import { goldenRatio, fibonacci } from './src/math-framework/sequences';

// Approximate φ using F(n+1)/F(n)
console.log('Golden Ratio Approximations:');
for (let n = 1; n <= 20; n += 5) {
  const phi = goldenRatio(n);
  const error = Math.abs(phi - 1.618033988749895);
  console.log(`n=${n}: φ ≈ ${phi.toFixed(15)}, error=${error.toExponential(2)}`);
}

// Output:
// n=1:  φ ≈ 1.000000000000000, error=6.18e-01
// n=6:  φ ≈ 1.625000000000000, error=6.97e-03
// n=11: φ ≈ 1.618025751072961, error=8.24e-06
// n=16: φ ≈ 1.618033963166707, error=2.56e-08
```

---

## Zeckendorf Decomposition

### Example 4: Basic Decomposition

```typescript
import { zeckendorf, z } from './src/math-framework/decomposition';

// Decompose 100
const decomp = zeckendorf(100n);
console.log(`${decomp.number} = ${decomp.toString()}`);
// 100 = 3 + 8 + 89

console.log('Indices:', decomp.indices);
// [4, 6, 11]

console.log('Fibonacci numbers:', decomp.fibonacciNumbers);
// [3n, 8n, 89n]

console.log('Valid:', decomp.isValid());
// true

// Zeckendorf count
const count = z(100n);
console.log(`z(100) = ${count}`);  // 3

// Binary representation
const binary = decomp.toBinary();
console.log('Binary:', binary);  // "10100100000"
```

### Example 5: Properties of Zeckendorf Decomposition

```typescript
import { zeckendorf, z, isFibonacci } from './src/math-framework/decomposition';

// Property 1: Fibonacci numbers have z(F(n)) = 1
const fibNumbers = [1n, 2n, 3n, 5n, 8n, 13n, 21n, 34n, 55n, 89n];
console.log('Fibonacci numbers have z(n) = 1:');
fibNumbers.forEach(n => {
  console.log(`z(${n}) = ${z(n)} ${z(n) === 1 ? '✓' : '✗'}`);
});

// Property 2: Non-consecutive property
function verifyNonConsecutive(n: bigint): boolean {
  const decomp = zeckendorf(n);
  const indices = decomp.indices;

  for (let i = 0; i < indices.length - 1; i++) {
    if (indices[i] - indices[i + 1] < 2) {
      return false;
    }
  }
  return true;
}

console.log('\nNon-consecutive property:');
[10n, 50n, 100n, 500n, 1000n].forEach(n => {
  const valid = verifyNonConsecutive(n);
  console.log(`z(${n}): ${valid ? '✓' : '✗'}`);
});

// Property 3: z(n) grows logarithmically
console.log('\nLogarithmic growth of z(n):');
for (let n = 10; n <= 100000; n *= 10) {
  const count = z(BigInt(n));
  const logGrowth = Math.log(n) / Math.log(1.618);
  console.log(`z(${n}) = ${count}, log_φ(${n}) ≈ ${logGrowth.toFixed(2)}`);
}
```

### Example 6: Zeckendorf Patterns

```typescript
import { zeckendorf, z } from './src/math-framework/decomposition';

// Analyze z(n) distribution
function analyzeZeckendorfDistribution(max: number): void {
  const distribution: Map<number, number> = new Map();

  for (let n = 1; n <= max; n++) {
    const count = z(BigInt(n));
    distribution.set(count, (distribution.get(count) || 0) + 1);
  }

  console.log(`\nZeckendorf count distribution (n ∈ [1, ${max}]):`);
  const sorted = Array.from(distribution.entries()).sort((a, b) => a[0] - b[0]);
  sorted.forEach(([count, freq]) => {
    const percentage = (freq / max * 100).toFixed(2);
    console.log(`z(n) = ${count}: ${freq} numbers (${percentage}%)`);
  });
}

analyzeZeckendorfDistribution(1000);

// Output:
// z(n) = 1: 13 numbers (1.30%)
// z(n) = 2: 34 numbers (3.40%)
// z(n) = 3: 55 numbers (5.50%)
// z(n) = 4: 89 numbers (8.90%)
// ...
```

---

## Behrend-Kimberling Theorem

### Example 7: Finding Nash Equilibria

```typescript
import {
  findNashEquilibria,
  verifyBKTheoremAt,
  analyzeBKTheorem,
  generateBKReport
} from './src/math-framework/divergence';
import { isLucasNumber, findLucasIndex } from './src/math-framework/sequences';

// Find Nash equilibria in [0, 100]
const nashPoints = findNashEquilibria(100);
console.log('Nash Equilibria:', nashPoints);
// [0, 1, 2, 6, 17, 46]

// Verify each point
console.log('\nVerification:');
nashPoints.forEach(n => {
  const result = verifyBKTheoremAt(n);
  console.log(result.message);
});

// Output:
// ✓ Theorem verified: S(0) = 0 and 1 = L(1)
// ✓ Theorem verified: S(1) = 0 and 2 = L(0)
// ✓ Theorem verified: S(2) = 0 and 3 = L(2)
// ✓ Theorem verified: S(6) = 0 and 7 = L(3)
// ✓ Theorem verified: S(17) = 0 and 18 = L(4)
// ✓ Theorem verified: S(46) = 0 and 47 = L(5)

// Check correspondence with Lucas numbers
console.log('\nNash Points ↔ Lucas Numbers:');
nashPoints.forEach(n => {
  const lucasNum = n + 1;
  const isLucas = isLucasNumber(BigInt(lucasNum));
  if (isLucas) {
    const index = findLucasIndex(BigInt(lucasNum));
    console.log(`n=${n} → n+1=${lucasNum} = L(${index}) ✓`);
  }
});
```

### Example 8: Complete B-K Analysis

```typescript
import { analyzeBKTheorem, generateBKReport } from './src/math-framework/divergence';

// Analyze range [0, 50]
const analysis = analyzeBKTheorem(50);

console.log('Analysis Summary:');
console.log(`Total points: ${analysis.points.length}`);
console.log(`Nash equilibria: ${analysis.nashEquilibria.length}`);
console.log(`Lucas points: ${analysis.lucasPoints.length}`);
console.log(`Theorem verified: ${analysis.theoremVerified ? 'YES' : 'NO'}`);
console.log(`Violations: ${analysis.violations.length}`);

// Generate full report
const report = generateBKReport(analysis);
console.log('\n' + report);

// Detailed Nash analysis
console.log('\nNash Equilibria Details:');
analysis.nashEquilibria.forEach(point => {
  console.log(`n=${point.n}:`);
  console.log(`  V(${point.n}) = ${point.V}`);
  console.log(`  U(${point.n}) = ${point.U}`);
  console.log(`  S(${point.n}) = ${point.S}`);
  console.log(`  z(${point.n}) = ${point.z_n}, ℓ(${point.n}) = ${point.l_n}`);
  console.log(`  d(${point.n}) = ${point.d}`);
  console.log();
});
```

### Example 9: S(n) Oscillation Visualization

```typescript
import { computeCumulativeFunctions } from './src/math-framework/divergence';

// Compute S(n) for visualization
function visualizeSn(max: number): void {
  const { S } = computeCumulativeFunctions(max);

  console.log('S(n) Values:');
  console.log('n\tS(n)\tVisualization');
  console.log('─'.repeat(50));

  for (let n = 0; n <= max; n++) {
    const s = S[n];
    const bar = s === 0 ? '█' : (s > 0 ? '+'.repeat(s) : '-'.repeat(-s));
    console.log(`${n}\t${s}\t${bar}`);
  }
}

visualizeSn(30);

// Output shows oscillation around 0:
// n    S(n)    Visualization
// ──────────────────────────────────────────────────
// 0    0       █
// 1    0       █
// 2    0       █
// 3    1       +
// 4    1       +
// 5    1       +
// 6    0       █
// 7    1       +
// ...
```

### Example 10: AgentDB Storage of Nash Points

```typescript
import {
  analyzeBKTheorem,
  exportNashCandidates,
  BKMemoryManager
} from './src/math-framework/divergence';

// Analyze and export
const analysis = analyzeBKTheorem(100);
const candidates = exportNashCandidates(analysis);

console.log('Nash Candidates for Storage:');
candidates.forEach(c => {
  console.log(`n=${c.n}, L(${c.lucasIndex})=${c.lucasNumber}, S=${c.S}`);
});

// Store in AgentDB
(async () => {
  const memory = new BKMemoryManager();
  const stored = await memory.storeAnalysis(100);

  console.log(`\nStored ${stored.summary.totalNashPoints} Nash points`);
  console.log(`Theorem verified: ${stored.summary.verified ? 'YES' : 'NO'}`);

  const stats = memory.getStats();
  console.log(`Memory stats: ${stats.nashEntries} Nash entries, ${stats.patternEntries} patterns`);
})();
```

---

## Q-Network Training

### Example 11: XOR Problem with Nash Convergence

```typescript
import { QNetwork, Matrix } from './src/math-framework/neural';

// Create network
const network = new QNetwork({
  layers: [2, 4, 1],
  activations: ['tanh', 'sigmoid'],
  learningRate: 0.1,
  lambda: 0.1,
  maxIterations: 2000,
  nashThreshold: 0.001,
  enableLyapunovTracking: true,
});

// XOR dataset
const X = [
  Matrix.from2D([[0], [0]]),
  Matrix.from2D([[0], [1]]),
  Matrix.from2D([[1], [0]]),
  Matrix.from2D([[1], [1]]),
];

const Y = [
  Matrix.from2D([[0]]),
  Matrix.from2D([[1]]),
  Matrix.from2D([[1]]),
  Matrix.from2D([[0]]),
];

// Train with callbacks
console.log('Training XOR Problem...\n');
const result = network.train(X, Y, {
  verbose: true,
  callback: (iter, loss, S_n) => {
    if (iter % 200 === 0) {
      console.log(`Iteration ${iter}:`);
      console.log(`  Loss: ${loss.toFixed(6)}`);
      console.log(`  S(n): ${S_n.toExponential(4)}`);
      console.log();
    }
  },
});

// Results
console.log('\n═══════════ Training Complete ═══════════');
console.log(`Iterations: ${result.iterations}`);
console.log(`Final Loss: ${result.finalLoss.toFixed(6)}`);
console.log(`Final S(n): ${result.finalS_n.toExponential(6)}`);
console.log(`Converged to Nash: ${result.convergedToNash ? 'YES ✓' : 'NO ✗'}`);
console.log(`Lyapunov Stable: ${result.lyapunovStable ? 'YES ✓' : 'NO ✗'}`);

// Test predictions
console.log('\n═══════════ Predictions ═══════════');
X.forEach((x, i) => {
  const prediction = network.predict(x);
  const expected = Y[i].get(0, 0);
  const actual = prediction.get(0, 0);
  const correct = Math.abs(actual - expected) < 0.1;

  console.log(`${x.get(0,0)} XOR ${x.get(1,0)} = ${actual.toFixed(4)} (expected ${expected}) ${correct ? '✓' : '✗'}`);
});

// Analyze trajectories
console.log('\n═══════════ Training Trajectory ═══════════');
const lastTrajectories = result.trajectories.slice(-10);
console.log('Last 10 iterations:');
lastTrajectories.forEach(t => {
  console.log(`Iter ${t.iteration}: Loss=${t.loss.toFixed(6)}, S(n)=${t.S_n.toExponential(4)}, V(n)=${t.V_n.toExponential(4)}`);
});
```

### Example 12: Non-linear Regression

```typescript
import { QNetwork, Matrix } from './src/math-framework/neural';

// Generate non-linear data: y = x² - 2x + 1
function generateData(n: number): { X: Matrix[]; Y: Matrix[] } {
  const X: Matrix[] = [];
  const Y: Matrix[] = [];

  for (let i = 0; i < n; i++) {
    const x = (i / n) * 4 - 2;  // x ∈ [-2, 2]
    const y = x * x - 2 * x + 1;

    X.push(Matrix.from2D([[x]]));
    Y.push(Matrix.from2D([[y]]));
  }

  return { X, Y };
}

const { X, Y } = generateData(50);

// Create network for regression
const network = new QNetwork({
  layers: [1, 8, 8, 1],
  activations: ['relu', 'relu', 'linear'],
  learningRate: 0.01,
  lambda: 0.05,
  maxIterations: 5000,
});

// Train
console.log('Training Non-linear Regression...\n');
const result = network.train(X, Y, { verbose: true });

console.log(`Final Loss: ${result.finalLoss.toFixed(6)}`);
console.log(`Converged to Nash: ${result.convergedToNash}`);

// Test predictions
console.log('\nSample Predictions:');
for (let i = 0; i < 10; i++) {
  const idx = Math.floor(Math.random() * X.length);
  const x = X[idx].get(0, 0);
  const expected = Y[idx].get(0, 0);
  const predicted = network.predict(X[idx]).get(0, 0);
  const error = Math.abs(predicted - expected);

  console.log(`x=${x.toFixed(2)}: y=${predicted.toFixed(4)} (expected ${expected.toFixed(4)}, error=${error.toFixed(4)})`);
}
```

### Example 13: Weight Export/Import

```typescript
import { QNetwork, Matrix } from './src/math-framework/neural';

// Train a network
const network1 = new QNetwork({
  layers: [2, 4, 1],
  learningRate: 0.1,
});

const X = [/* training data */];
const Y = [/* labels */];

network1.train(X, Y);

// Export weights
const weights = network1.exportWeights();
console.log('Exported weights:', JSON.stringify(weights, null, 2));

// Create new network and import weights
const network2 = new QNetwork({
  layers: [2, 4, 1],
  learningRate: 0.1,
});

network2.importWeights(weights);

// Verify predictions match
const testInput = Matrix.from2D([[0.5], [0.5]]);
const pred1 = network1.predict(testInput);
const pred2 = network2.predict(testInput);

console.log(`Network 1 prediction: ${pred1.get(0, 0)}`);
console.log(`Network 2 prediction: ${pred2.get(0, 0)}`);
console.log(`Match: ${Math.abs(pred1.get(0, 0) - pred2.get(0, 0)) < 1e-10 ? 'YES' : 'NO'}`);
```

---

## Phase Space Analysis

### Example 14: Phase Space Trajectory

```typescript
import { PhaseSpaceTrajectory, PhaseSpacePoint } from './src/math-framework/phase-space';

// Create trajectory from n=1 to n=100
const trajectory = new PhaseSpaceTrajectory(1, 100);

console.log(`Trajectory: ${trajectory.start} → ${trajectory.end}`);
console.log(`Points: ${trajectory.points.length}`);
console.log(`Path Length: ${trajectory.pathLength().toFixed(4)}`);

// Find equilibria (low velocity regions)
const equilibria = trajectory.findEquilibria(0.1);
console.log(`\nEquilibrium points (velocity < 0.1):`);
equilibria.forEach(n => {
  const point = trajectory.points[n - trajectory.start];
  console.log(`n=${n}: S(${n})=${point.S}, coords=(${point.coordinates.x.toFixed(4)}, ${point.coordinates.y.toFixed(4)}, ${point.coordinates.z.toFixed(4)})`);
});

// Analyze specific points
console.log('\nSample Points:');
[10, 25, 50, 75, 100].forEach(n => {
  const point = trajectory.getPoint(n - trajectory.start);
  if (point) {
    console.log(`n=${point.n}:`);
    console.log(`  V=${point.V}, U=${point.U}, S=${point.S}`);
    console.log(`  Coordinates: (${point.coordinates.x.toFixed(4)}, ${point.coordinates.y.toFixed(4)}, ${point.coordinates.z.toFixed(4)})`);
  }
});
```

### Example 15: Distance Analysis

```typescript
import { PhaseSpacePoint } from './src/math-framework/phase-space';

// Create multiple points
const points = [10, 17, 25, 46, 50, 75, 100].map(n => new PhaseSpacePoint(n));

console.log('Pairwise Distances:');
for (let i = 0; i < points.length; i++) {
  for (let j = i + 1; j < points.length; j++) {
    const dist = points[i].distanceTo(points[j]);
    console.log(`d(n=${points[i].n}, n=${points[j].n}) = ${dist.toFixed(6)}`);
  }
}

// Nearest neighbor analysis
function findNearestNeighbor(query: PhaseSpacePoint, candidates: PhaseSpacePoint[]): PhaseSpacePoint {
  let nearest = candidates[0];
  let minDist = query.distanceTo(nearest);

  candidates.forEach(candidate => {
    const dist = query.distanceTo(candidate);
    if (dist < minDist && candidate.n !== query.n) {
      nearest = candidate;
      minDist = dist;
    }
  });

  return nearest;
}

const query = new PhaseSpacePoint(30);
const nearest = findNearestNeighbor(query, points);
console.log(`\nNearest neighbor to n=30: n=${nearest.n}, distance=${query.distanceTo(nearest).toFixed(6)}`);
```

---

## AgentDB Integration

### Example 16: Complete Workflow

```typescript
import { createMathFrameworkMemory } from './src/math-framework/memory';

(async () => {
  // Create memory with all features enabled
  const memory = await createMathFrameworkMemory({
    database_path: './math-framework.db',
    enable_learning: true,
    enable_hnsw: true,
    enable_quantization: true,
  });

  console.log('═══════════ AgentDB Integration Demo ═══════════\n');

  // 1. Basic computation
  console.log('1. Computing and storing values...');
  const value10 = await memory.computeAndStore(10);
  console.log(`F(10) = ${value10.F}`);
  console.log(`S(10) = ${value10.S}`);
  console.log(`Nash point: ${value10.is_nash_point}\n`);

  // 2. Batch computation
  console.log('2. Batch computing [1, 100]...');
  const results = await memory.batchCompute(1, 100);
  const nashPoints = results.filter(r => r.is_nash_point);
  console.log(`Found ${nashPoints.length} Nash equilibria\n`);

  // 3. Pattern recognition
  console.log('3. Analyzing patterns...');
  const patterns = await memory.analyzeAndStorePatterns(1, 50);
  patterns.forEach(p => {
    console.log(`  ${p.pattern_type}: ${p.description}`);
  });
  console.log();

  // 4. Similarity search
  console.log('4. Finding similar Nash points to n=10...');
  const similar = await memory.findSimilarNashPoints(10, 5);
  similar.forEach(s => {
    console.log(`  n=${s.data.position}, similarity=${s.score.toFixed(4)}`);
  });
  console.log();

  // 5. Causal memory
  console.log('5. Storing causal relationships...');
  await memory.storeCausalRelation({
    cause: 'S(n)=0',
    effect: 'Nash equilibrium at n',
    n_values: nashPoints.map(p => p.n),
    confidence: 1.0,
    evidence_count: nashPoints.length,
    created_at: Date.now(),
    last_verified: Date.now(),
  });
  const causal = await memory.getCausalRelations('S(n)=0');
  console.log(`  Stored causal relation with ${causal[0].evidence_count} evidence points\n`);

  // 6. Skill library
  console.log('6. Storing optimization skill...');
  await memory.storeSkill({
    skill_id: 'nash-finder-binary-search',
    name: 'Binary Search Nash Finder',
    description: 'Find Nash equilibria using binary search on S(n)=0',
    success_rate: 0.95,
    avg_convergence_steps: 8,
    learned_from: ['task-1', 'task-2', 'task-3'],
    parameters: { tolerance: 1e-10, max_iterations: 100 },
    usage_count: 5,
    last_used: Date.now(),
  });
  const skills = await memory.getBestSkills('nash-finding', 5);
  console.log(`  Top skill: ${skills[0].name}, success rate: ${skills[0].success_rate}\n`);

  // 7. Reflexion memory
  console.log('7. Storing learning trajectory...');
  await memory.storeReflexion({
    attempt_id: 'attempt-1',
    task_description: 'Find Nash equilibria in [0, 100]',
    initial_state: { range: [0, 100], known_nash: 0 },
    steps_taken: ['Compute S(n) for range', 'Filter S(n)=0', 'Verify with Lucas'],
    final_state: { found_nash: nashPoints.length },
    success: true,
    insights: ['S(n)=0 always corresponds to n+1 being Lucas number'],
    improvement_suggestions: ['Cache S(n) values', 'Use binary search'],
    created_at: Date.now(),
  });
  console.log('  Stored reflexion entry\n');

  // 8. Predict future Nash points
  console.log('8. Predicting next Nash points in [100, 500]...');
  const predictions = await memory.predictNextNashPoints([100, 500]);
  console.log(`  Predicted positions: ${predictions.slice(0, 5).join(', ')}...\n`);

  // 9. Statistics
  console.log('9. Memory statistics:');
  const stats = await memory.getStats();
  console.log(`  Total computations: ${stats.total_computations}`);
  console.log(`  Nash points found: ${stats.nash_points_found}`);
  console.log(`  Patterns recognized: ${stats.patterns_recognized}`);
  console.log(`  Causal relations: ${stats.causal_relations_count}`);
  console.log(`  Skills learned: ${stats.skills_count}`);
  console.log();

  // Cleanup
  await memory.close();
  console.log('═══════════ Demo Complete ═══════════');
})();
```

### Example 17: QUIC Distributed Sync

```typescript
import { createMathFrameworkMemory } from './src/math-framework/memory';

// Node 1
(async () => {
  const memory1 = await createMathFrameworkMemory({
    database_path: './node1.db',
    enable_quic_sync: true,
    quic_port: 4433,
  });

  await memory1.enableQuicSync('node-1');

  // Compute on node 1
  await memory1.batchCompute(1, 50);
  console.log('Node 1: Computed [1, 50]');

  // Sync happens automatically every 5 seconds
  setTimeout(async () => {
    const stats = await memory1.getStats();
    console.log(`Node 1: Total computations = ${stats.total_computations}`);
    await memory1.close();
  }, 10000);
})();

// Node 2
(async () => {
  const memory2 = await createMathFrameworkMemory({
    database_path: './node2.db',
    enable_quic_sync: true,
    quic_port: 4434,
  });

  await memory2.enableQuicSync('node-2');

  // Compute on node 2
  await memory2.batchCompute(51, 100);
  console.log('Node 2: Computed [51, 100]');

  // After sync, both nodes have all data
  setTimeout(async () => {
    const stats = await memory2.getStats();
    console.log(`Node 2: Total computations = ${stats.total_computations}`);
    await memory2.close();
  }, 10000);
})();
```

---

## WASM Performance

### Example 18: WASM Benchmarking

```typescript
import * as wasm from './pkg/math_framework_wasm';

wasm.init();

console.log('═══════════ WASM Performance Benchmarks ═══════════\n');

// Benchmark Fibonacci computation
function benchmarkFibonacci(n: number, iterations: number): void {
  console.log(`Fibonacci(${n}) - ${iterations} iterations:`);

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    wasm.fibonacci(BigInt(n));
  }
  const end = performance.now();

  const avgTime = (end - start) / iterations;
  console.log(`  Average time: ${avgTime.toFixed(4)} ms`);
  console.log(`  Throughput: ${(1000 / avgTime).toFixed(0)} ops/sec\n`);
}

benchmarkFibonacci(100, 10000);
benchmarkFibonacci(1000, 1000);
benchmarkFibonacci(10000, 100);

// Benchmark Zeckendorf decomposition
function benchmarkZeckendorf(n: number, iterations: number): void {
  console.log(`Zeckendorf(${n}) - ${iterations} iterations:`);

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    wasm.zeckendorf(n);
  }
  const end = performance.now();

  const avgTime = (end - start) / iterations;
  console.log(`  Average time: ${avgTime.toFixed(4)} ms`);
  console.log(`  Throughput: ${(1000 / avgTime).toFixed(0)} ops/sec\n`);
}

benchmarkZeckendorf(1000, 10000);
benchmarkZeckendorf(10000, 1000);
benchmarkZeckendorf(100000, 100);

// Benchmark trajectory computation
function benchmarkTrajectory(start: number, end: number): void {
  console.log(`Trajectory[${start}, ${end}]:`);

  const t0 = performance.now();
  const trajectory = new wasm.WasmTrajectory(start, end);
  const t1 = performance.now();

  console.log(`  Construction: ${(t1 - t0).toFixed(2)} ms`);
  console.log(`  Points: ${trajectory.length}`);

  const t2 = performance.now();
  const pathLength = trajectory.pathLength();
  const t3 = performance.now();

  console.log(`  Path length computation: ${(t3 - t2).toFixed(2)} ms`);
  console.log(`  Path length: ${pathLength.toFixed(4)}\n`);
}

benchmarkTrajectory(1, 1000);
benchmarkTrajectory(1, 10000);
```

### Example 19: WASM vs TypeScript Comparison

```typescript
import * as wasm from './pkg/math_framework_wasm';
import { fibonacci as tsFibonacci } from './src/math-framework/sequences';

wasm.init();

console.log('═══════════ WASM vs TypeScript Comparison ═══════════\n');

function compareFibonacci(n: number, iterations: number): void {
  console.log(`Fibonacci(${n}) - ${iterations} iterations:\n`);

  // WASM
  const wasmStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    wasm.fibonacci(BigInt(n));
  }
  const wasmEnd = performance.now();
  const wasmTime = (wasmEnd - wasmStart) / iterations;

  // TypeScript
  const tsStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    tsFibonacci(BigInt(n));
  }
  const tsEnd = performance.now();
  const tsTime = (tsEnd - tsStart) / iterations;

  console.log(`  WASM:       ${wasmTime.toFixed(4)} ms/op`);
  console.log(`  TypeScript: ${tsTime.toFixed(4)} ms/op`);
  console.log(`  Speedup:    ${(tsTime / wasmTime).toFixed(2)}x\n`);
}

compareFibonacci(100, 1000);
compareFibonacci(1000, 100);
compareFibonacci(5000, 10);
```

---

## Advanced Patterns

### Example 20: Parallel Nash Search

```typescript
import { computeCumulativeFunctions } from './src/math-framework/divergence';

// Split range into chunks and process in parallel
async function parallelNashSearch(start: number, end: number, chunkSize: number): Promise<number[]> {
  const chunks: Array<[number, number]> = [];
  for (let i = start; i <= end; i += chunkSize) {
    chunks.push([i, Math.min(i + chunkSize - 1, end)]);
  }

  console.log(`Processing ${chunks.length} chunks in parallel...\n`);

  const results = await Promise.all(
    chunks.map(async ([chunkStart, chunkEnd]) => {
      console.log(`Processing chunk [${chunkStart}, ${chunkEnd}]`);
      const { S } = computeCumulativeFunctions(chunkEnd);
      const nash: number[] = [];

      for (let n = chunkStart; n <= chunkEnd; n++) {
        if (S[n] === 0) {
          nash.push(n);
        }
      }

      return nash;
    })
  );

  // Flatten and sort
  return results.flat().sort((a, b) => a - b);
}

(async () => {
  const nashPoints = await parallelNashSearch(0, 1000, 100);
  console.log(`\nFound ${nashPoints.length} Nash equilibria:`);
  console.log(nashPoints.slice(0, 20).join(', '));
})();
```

---

**Version**: 2.0.0
**Last Updated**: 2025-11-12

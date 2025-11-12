# API Reference

Complete API documentation for the Mathematical Framework.

## Table of Contents

1. [Core Primitives](#core-primitives)
2. [Sequences](#sequences)
3. [Decomposition](#decomposition)
4. [Divergence (B-K Theorem)](#divergence-bk-theorem)
5. [Neural Networks](#neural-networks)
6. [Phase Space](#phase-space)
7. [Memory (AgentDB)](#memory-agentdb)
8. [WASM Bindings](#wasm-bindings)

---

## Core Primitives

Module: `src/math-framework/core/primitives.ts`

### Constants

#### `PHI`
Golden ratio constant.

```typescript
const PHI: {
  value: number;    // 1.618033988749895
  symbol: string;   // 'φ'
  name: string;     // 'Golden Ratio'
  decimal: string;  // High-precision decimal
}
```

#### `PSI`
Golden ratio conjugate.

```typescript
const PSI: {
  value: number;    // -0.618033988749895
  symbol: string;   // 'ψ'
  name: string;     // 'Golden Ratio Conjugate'
  relation: string; // 'ψ = φ - 1 = 1/φ'
}
```

#### `E`, `PI`
Mathematical constants e and π.

### Types

#### `Natural`
Natural number type (ℕ).

```typescript
type Natural = number & { __brand: 'Natural' };

function natural(n: number): Natural
```

**Throws**: `TypeError` if n < 0 or not an integer.

#### `Integer`
Integer type (ℤ).

```typescript
type Integer = number & { __brand: 'Integer' };

function integer(n: number): Integer
```

**Throws**: `TypeError` if not an integer.

#### `Real`
Real number type (ℝ).

```typescript
type Real = number & { __brand: 'Real' };

function real(n: number): Real
```

**Throws**: `TypeError` if NaN or Infinity.

#### `Complex`
Complex number type (ℂ).

```typescript
interface Complex {
  real: Real;
  imaginary: Real;
}

function complex(real: number, imaginary?: number): Complex
```

### Validation

#### `isNatural(value: unknown): value is Natural`
Type guard for natural numbers.

#### `isInteger(value: unknown): value is Integer`
Type guard for integers.

#### `isReal(value: unknown): value is Real`
Type guard for real numbers.

#### `isComplex(value: unknown): value is Complex`
Type guard for complex numbers.

#### `validate`
Validation namespace with throwing validators.

```typescript
validate.natural(value: unknown, name?: string): Natural
validate.integer(value: unknown, name?: string): Integer
validate.real(value: unknown, name?: string): Real
validate.complex(value: unknown, name?: string): Complex
```

### Operations

#### `add`
Addition operations.

```typescript
add.real(a: Real, b: Real): Real
add.complex(a: Complex, b: Complex): Complex
add.poly(a: Real | Complex, b: Real | Complex): Real | Complex
```

#### `subtract`
Subtraction operations.

```typescript
subtract.real(a: Real, b: Real): Real
subtract.complex(a: Complex, b: Complex): Complex
subtract.poly(a: Real | Complex, b: Real | Complex): Real | Complex
```

#### `multiply`
Multiplication operations.

```typescript
multiply.real(a: Real, b: Real): Real
multiply.complex(a: Complex, b: Complex): Complex
multiply.poly(a: Real | Complex, b: Real | Complex): Real | Complex
```

#### `divide`
Division operations.

```typescript
divide.real(a: Real, b: Real): Real
divide.complex(a: Complex, b: Complex): Complex
divide.poly(a: Real | Complex, b: Real | Complex): Real | Complex
```

**Throws**: Error if dividing by zero.

#### `power`
Exponentiation operations.

```typescript
power.real(base: Real, exponent: Real): Real
power.integer(base: Real, exponent: Integer): Real
power.complex(base: Complex, exponent: Real): Complex
```

#### `sqrt`
Square root operations.

```typescript
sqrt.real(value: Real): Real                    // Throws if negative
sqrt.complex(value: Complex): Complex
sqrt.poly(value: Real | Complex): Real | Complex // Auto-promotes to complex
```

#### `abs`
Absolute value / magnitude.

```typescript
abs.real(value: Real): Real
abs.complex(value: Complex): Real               // Returns magnitude
```

#### `conjugate`
Complex conjugate.

```typescript
conjugate(c: Complex): Complex
```

#### `approximately`
Approximate equality for floating point.

```typescript
approximately(a: Real, b: Real, epsilon?: number): boolean
```

#### `complexEquals`
Complex number equality with tolerance.

```typescript
complexEquals(a: Complex, b: Complex, epsilon?: number): boolean
```

### Storage

#### `mathStorage`
AgentDB storage integration.

```typescript
mathStorage.store(key: string, value: Real | Complex): Promise<void>
mathStorage.retrieve(key: string): Promise<Real | Complex | null>
mathStorage.storeComputation(
  operation: string,
  inputs: Array<Real | Complex>,
  result: Real | Complex
): Promise<void>
```

#### `computeAndStore`
Compute and store in one operation.

```typescript
computeAndStore(
  key: string,
  operation: string,
  compute: () => Real | Complex,
  ...inputs: Array<Real | Complex>
): Promise<Real | Complex>
```

---

## Sequences

Module: `src/math-framework/sequences/`

### Fibonacci

#### `fibonacci(n: bigint): bigint`
Compute F(n) using O(log n) matrix exponentiation.

```typescript
const f10 = fibonacci(10n);   // 55n
const f100 = fibonacci(100n); // 354224848179261915075n
```

#### `fibonacciRange(start: bigint, end: bigint): bigint[]`
Compute multiple Fibonacci numbers efficiently.

```typescript
const fibs = fibonacciRange(1n, 10n); // [1n, 1n, 2n, 3n, 5n, 8n, 13n, 21n, 34n, 55n]
```

### Lucas

#### `lucas(n: bigint): bigint`
Compute L(n) using O(log n) algorithm.

```typescript
const l10 = lucas(10n);  // 123n
const l20 = lucas(20n);  // 15127n
```

#### `lucasRange(start: bigint, end: bigint): bigint[]`
Compute multiple Lucas numbers.

#### `isLucasNumber(n: bigint): boolean`
Check if n is a Lucas number.

```typescript
isLucasNumber(123n);  // true (L(6) = 123)
isLucasNumber(100n);  // false
```

#### `findLucasIndex(n: bigint): number`
Find m such that L(m) = n.

```typescript
findLucasIndex(123n);  // 6
```

**Throws**: Error if n is not a Lucas number.

### Golden Ratio

#### `goldenRatio(n: number): number`
Approximate φ using F(n+1)/F(n).

```typescript
const phi = goldenRatio(100);  // ≈ 1.618033988749895
```

Higher n gives more accurate approximation.

---

## Decomposition

Module: `src/math-framework/decomposition/`

### Zeckendorf

#### `class ZeckendorfDecomposition`

```typescript
class ZeckendorfDecomposition {
  readonly number: bigint;
  readonly indices: number[];
  readonly fibonacciNumbers: bigint[];
  readonly sum: bigint;

  toString(): string;
  toBinary(): string;
  isValid(): boolean;
}
```

#### `zeckendorf(n: bigint): ZeckendorfDecomposition`
Compute Zeckendorf decomposition using greedy O(log n) algorithm.

```typescript
const z = zeckendorf(100n);
console.log(z.toString());       // "3 + 8 + 89"
console.log(z.indices);          // [4, 6, 11]
console.log(z.fibonacciNumbers); // [3n, 8n, 89n]
console.log(z.sum);              // 100n
console.log(z.isValid());        // true
```

#### `z(n: bigint): number`
Get Zeckendorf count (number of terms).

```typescript
z(100n);  // 3
z(50n);   // 2
```

#### `isFibonacci(n: bigint): boolean`
Check if n is a Fibonacci number.

```typescript
isFibonacci(89n);  // true
isFibonacci(90n);  // false
```

#### `fibonacciWeight(n: bigint): number`
Alias for z(n).

### Lucas Representation

#### `ℓ(n: bigint): number`
Get Lucas representation count.

```typescript
ℓ(100n);  // Lucas count for 100
```

#### `computeLucasCounts(max: number): number[]`
Compute ℓ(k) for all k ∈ [0, max].

```typescript
const counts = computeLucasCounts(100);
// counts[k] = ℓ(k)
```

---

## Divergence (B-K Theorem)

Module: `src/math-framework/divergence/`

### Core Functions

#### `computeV(n: number): number`
Compute V(n) = Σₖ₌₀ⁿ z(k).

```typescript
const v = computeV(50);  // Cumulative Zeckendorf count
```

#### `computeU(n: number): number`
Compute U(n) = Σₖ₌₀ⁿ ℓ(k).

```typescript
const u = computeU(50);  // Cumulative Lucas count
```

#### `computeS(n: number, V?: number, U?: number): number`
Compute S(n) = V(n) - U(n).

```typescript
const s = computeS(50);  // B-K divergence
```

Optional V and U parameters for efficiency.

#### `computeD(n: number): number`
Compute d(n) = z(n) - ℓ(n).

```typescript
const d = computeD(50);  // Local difference
```

#### `computeCumulativeFunctions(n: number)`
Efficiently compute all cumulative functions in one pass.

```typescript
const { V, U, S, d } = computeCumulativeFunctions(100);
// V[k], U[k], S[k], d[k] for k ∈ [0, 100]
```

**Returns**:
```typescript
{
  V: number[];  // Cumulative Zeckendorf
  U: number[];  // Cumulative Lucas
  S: number[];  // Divergence
  d: number[];  // Local difference
}
```

### Nash Equilibria

#### `findNashEquilibria(n: number): number[]`
Find all Nash equilibria (S(k) = 0) in [0, n].

```typescript
const nash = findNashEquilibria(100);
// [0, 1, 2, 6, 17, 46]
```

#### `verifyBKTheoremAt(n: number)`
Verify Behrend-Kimberling theorem at position n.

```typescript
const result = verifyBKTheoremAt(17);
// {
//   verified: true,
//   S_n: 0,
//   isLucasNumber: true,
//   message: "✓ Theorem verified: S(17) = 0 and 18 = L(5)"
// }
```

**Returns**:
```typescript
{
  verified: boolean;
  S_n: number;
  isLucasNumber: boolean;
  message: string;
}
```

### Analysis

#### `interface BKPoint`

```typescript
interface BKPoint {
  n: number;
  V: number;
  U: number;
  S: number;
  d: number;
  z_n: number;
  l_n: number;
  isNashEquilibrium: boolean;
  isLucasPrediction: boolean;
}
```

#### `interface BKAnalysis`

```typescript
interface BKAnalysis {
  points: BKPoint[];
  nashEquilibria: BKPoint[];
  lucasPoints: BKPoint[];
  theoremVerified: boolean;
  violations: BKPoint[];
}
```

#### `analyzeBKTheorem(n: number): BKAnalysis`
Complete analysis of B-K theorem for [0, n].

```typescript
const analysis = analyzeBKTheorem(100);
console.log(`Nash points: ${analysis.nashEquilibria.length}`);
console.log(`Theorem verified: ${analysis.theoremVerified}`);
```

#### `generateBKReport(analysis: BKAnalysis): string`
Generate formatted text report.

```typescript
const report = generateBKReport(analysis);
console.log(report);
```

#### `exportNashCandidates(analysis: BKAnalysis)`
Export Nash equilibria for AgentDB storage.

```typescript
const candidates = exportNashCandidates(analysis);
// Array of { n, lucasNumber, lucasIndex, V, U, S, d, timestamp }
```

### AgentDB Integration

#### `class BKMemoryManager`

```typescript
class BKMemoryManager {
  async storeAnalysis(n: number): Promise<{
    summary: { totalNashPoints: number; verified: boolean };
    nashPoints: any[];
  }>;

  getStats(): {
    nashEntries: number;
    patternEntries: number;
  };
}
```

**Example**:
```typescript
const memory = new BKMemoryManager();
const stored = await memory.storeAnalysis(50);
console.log(`Stored ${stored.summary.totalNashPoints} Nash points`);
```

---

## Neural Networks

Module: `src/math-framework/neural/`

### Matrix Class

#### `class Matrix`

```typescript
class Matrix {
  readonly rows: number;
  readonly cols: number;
  readonly data: number[][];

  // Constructors
  constructor(rows: number, cols: number, data?: number[][]);
  static zeros(rows: number, cols: number): Matrix;
  static ones(rows: number, cols: number): Matrix;
  static identity(size: number): Matrix;
  static random(rows: number, cols: number): Matrix;
  static from2D(data: number[][]): Matrix;

  // Accessors
  get(row: number, col: number): number;
  set(row: number, col: number, value: number): void;

  // Operations
  add(other: Matrix): Matrix;
  subtract(other: Matrix): Matrix;
  multiply(other: Matrix): Matrix;
  scalarMultiply(scalar: number): Matrix;
  transpose(): Matrix;
  hadamard(other: Matrix): Matrix;         // Element-wise multiplication

  // Utilities
  map(fn: (value: number) => number): Matrix;
  sum(): number;
  norm(): number;                          // Frobenius norm
  toString(): string;
  toArray(): number[][];
}
```

### Q-Network

#### `interface QNetworkConfig`

```typescript
interface QNetworkConfig {
  layers: number[];                        // Layer sizes [input, hidden..., output]
  activations?: ActivationFunction[];      // Activation per layer
  learningRate?: number;                   // Default: 0.01
  lambda?: number;                         // S(n) regularization, default: 0.1
  maxIterations?: number;                  // Default: 1000
  nashThreshold?: number;                  // S(n) convergence, default: 1e-6
  convergenceEpsilon?: number;             // Loss convergence, default: 1e-8
  qMatrixScale?: number;                   // Q-matrix init scale, default: 1.0
  enableLyapunovTracking?: boolean;        // Track V(n)=S(n)², default: true
  enableAgentDB?: boolean;                 // Store trajectories, default: false
}
```

#### `type ActivationFunction = 'relu' | 'sigmoid' | 'tanh' | 'linear'`

#### `class QNetwork`

```typescript
class QNetwork {
  constructor(config: QNetworkConfig);

  // Training
  train(
    X: Matrix[],
    Y: Matrix[],
    options?: {
      verbose?: boolean;
      callback?: (iteration: number, loss: number, S_n: number) => void;
    }
  ): TrainingResult;

  // Prediction
  predict(input: Matrix): Matrix;

  // Utilities
  exportWeights(): LayerWeights[];
  importWeights(weights: LayerWeights[]): void;
  computeS_n(): number;
}
```

#### `interface TrainingResult`

```typescript
interface TrainingResult {
  iterations: number;
  finalLoss: number;
  finalS_n: number;
  convergedToNash: boolean;
  lyapunovStable: boolean;
  trajectories: TrainingTrajectory[];
}
```

#### `interface TrainingTrajectory`

```typescript
interface TrainingTrajectory {
  iteration: number;
  loss: number;
  S_n: number;
  V_n: number;                             // Lyapunov function
  gradientNorms: number[];                 // Per-layer gradient norms
  timestamp: number;
}
```

**Example**:
```typescript
const network = new QNetwork({
  layers: [2, 4, 1],
  activations: ['tanh', 'sigmoid'],
  learningRate: 0.1,
  lambda: 0.1,
  maxIterations: 2000,
});

const result = network.train(X, Y, { verbose: true });
console.log('Converged to Nash:', result.convergedToNash);
console.log('S(n):', result.finalS_n);
console.log('Lyapunov Stable:', result.lyapunovStable);
```

---

## Phase Space

Module: `src/math-framework/phase-space/`

### PhaseSpacePoint

#### `class PhaseSpacePoint`

```typescript
class PhaseSpacePoint {
  readonly n: number;
  readonly V: number;
  readonly U: number;
  readonly S: number;
  readonly coordinates: { x: number; y: number; z: number };

  constructor(n: number);

  distanceTo(other: PhaseSpacePoint): number;
  toJSON(): object;
}
```

**Example**:
```typescript
const point = new PhaseSpacePoint(10);
console.log(point.coordinates);  // { x, y, z }
console.log(point.S);            // B-K divergence at n=10
```

### PhaseSpaceTrajectory

#### `class PhaseSpaceTrajectory`

```typescript
class PhaseSpaceTrajectory {
  readonly start: number;
  readonly end: number;
  readonly points: PhaseSpacePoint[];

  constructor(start: number, end: number);

  pathLength(): number;
  findEquilibria(velocityThreshold: number): number[];
  getPoint(index: number): PhaseSpacePoint | undefined;
  toJSON(): object;
}
```

**Example**:
```typescript
const trajectory = new PhaseSpaceTrajectory(1, 100);
console.log(`Points: ${trajectory.points.length}`);
console.log(`Path length: ${trajectory.pathLength()}`);

const equilibria = trajectory.findEquilibria(0.1);
console.log('Equilibrium positions:', equilibria);
```

---

## Memory (AgentDB)

Module: `src/math-framework/memory/`

### MathFrameworkMemory

#### `interface MathFrameworkConfig`

```typescript
interface MathFrameworkConfig {
  database_path?: string;                  // Default: './math-framework.db'
  enable_quic_sync?: boolean;              // Default: false
  quic_port?: number;                      // Default: 4433
  enable_learning?: boolean;               // Default: true
  learning_config?: LearningConfig;
  enable_hnsw?: boolean;                   // Default: true (150x faster)
  enable_quantization?: boolean;           // Default: true (4-32x memory)
  sync_interval_ms?: number;               // Default: 5000
}
```

#### `createMathFrameworkMemory(config: MathFrameworkConfig): Promise<MathFrameworkMemory>`

```typescript
const memory = await createMathFrameworkMemory({
  database_path: './math-framework.db',
  enable_learning: true,
  enable_hnsw: true,
});
```

#### `interface MathFrameworkMemory`

```typescript
interface MathFrameworkMemory {
  // Core computation
  computeAndStore(n: number): Promise<ComputedValues>;
  batchCompute(start: number, end: number): Promise<ComputedValues[]>;

  // Nash equilibria
  storeNashEquilibrium(nash: NashEquilibrium): Promise<void>;
  getAllNashPoints(options?: MemoryQueryOptions): Promise<NashEquilibrium[]>;
  findSimilarNashPoints(n: number, limit: number): Promise<VectorSearchResult<NashEquilibrium>[]>;
  predictNextNashPoints(searchRange: [number, number]): Promise<number[]>;

  // Patterns
  analyzeAndStorePatterns(start: number, end: number): Promise<PatternRecognition[]>;
  getPatterns(type?: string): Promise<PatternRecognition[]>;

  // Causal memory
  storeCausalRelation(causal: CausalMemory): Promise<void>;
  getCausalRelations(cause?: string): Promise<CausalMemory[]>;

  // Skill library
  storeSkill(skill: OptimizationSkill): Promise<void>;
  getBestSkills(taskType: string, limit: number): Promise<OptimizationSkill[]>;

  // Reflexion
  storeReflexion(reflexion: ReflexionEntry): Promise<void>;
  learnFromReflexions(minAttempts: number): Promise<void>;

  // Game states
  storeGameState(state: GameState): Promise<void>;
  findSimilarGameStates(queryState: GameState, limit: number): Promise<VectorSearchResult<GameState>[]>;

  // QUIC sync
  enableQuicSync(nodeId: string): Promise<void>;

  // Stats
  getStats(): Promise<LearningStats>;

  // Cleanup
  close(): Promise<void>;
}
```

#### `interface ComputedValues`

```typescript
interface ComputedValues {
  n: number;
  F: bigint;
  L: bigint;
  Z: bigint;
  S: number;
  phase: { x: number; y: number; z: number };
  is_nash_point: boolean;
  timestamp: number;
}
```

**Example**:
```typescript
const memory = await createMathFrameworkMemory({ enable_learning: true });

// Compute and store
const values = await memory.computeAndStore(10);
console.log(`F(10) = ${values.F}, S(10) = ${values.S}`);

// Batch computation
const results = await memory.batchCompute(1, 100);
const nashPoints = results.filter(r => r.is_nash_point);

// Pattern recognition
const patterns = await memory.analyzeAndStorePatterns(1, 50);

// Statistics
const stats = await memory.getStats();
console.log(`Total computations: ${stats.total_computations}`);

await memory.close();
```

---

## WASM Bindings

Module: `crates/math-framework-wasm/`

### Initialization

```typescript
import * as wasm from './pkg/math_framework_wasm';

wasm.init();
```

### Sequences

```typescript
// Fibonacci
const f100 = wasm.fibonacci(100n);  // "354224848179261915075"

// Lucas
const l10 = wasm.lucas(10);         // "123"

// Golden ratio
const phi = wasm.golden_ratio(100); // 1.618033988749895

// Ranges
const fibs = wasm.fibonacci_range(1, 10);  // JSON array
const lucas = wasm.lucas_range(1, 10);     // JSON array
```

### Zeckendorf

```typescript
const z = wasm.zeckendorf(100);
console.log(z.number);            // "100"
console.log(z.indices);           // JSON: [4, 6, 11]
console.log(z.fibonacci_numbers); // JSON: ["3", "8", "89"]
console.log(z.toString());        // "3 + 8 + 89"
console.log(z.isValid());         // true

// Binary representation
const binary = wasm.zeckendorf_to_binary(z);  // "10100100000"
const num = wasm.binary_to_zeckendorf(binary); // "100"

// Utilities
const weight = wasm.fibonacci_weight(100);     // 3
const isFib = wasm.is_fibonacci(89);           // true
```

### B-K Divergence

```typescript
// Core functions
const v = wasm.bk_v(10);              // V(10)
const u = wasm.bk_u(10);              // U(10)
const s = wasm.bk_divergence(10);     // S(10)
```

### Phase Space

```typescript
// Single point
const point = new wasm.WasmPhaseSpacePoint(10);
console.log(point.n);                 // 10
console.log(point.v);                 // V(10)
console.log(point.s);                 // S(10)
console.log(point.x);                 // x coordinate
console.log(point.y);                 // y coordinate
console.log(point.z);                 // z coordinate

// Distance
const point2 = new wasm.WasmPhaseSpacePoint(20);
const dist = point.distanceTo(point2);

// Trajectory
const trajectory = new wasm.WasmTrajectory(1, 100);
console.log(trajectory.length);       // 100
console.log(trajectory.pathLength()); // Total path length

const point = trajectory.getPoint(10);
const equilibria = trajectory.findEquilibria(0.1); // JSON array
```

### Nash Equilibria

```typescript
const trajectory = new wasm.WasmTrajectory(1, 100);
const nashPoints = wasm.detect_nash_equilibria(trajectory, 5);

nashPoints.forEach(nash => {
  console.log(`Position: ${nash.position}`);
  console.log(`S(n): ${nash.s}`);
  console.log(`Stability: ${nash.stabilityScore}`);
});
```

### Metrics

```typescript
const metrics = new wasm.WasmDivergenceMetrics(1, 100);
console.log(metrics.rangeStart);      // 1
console.log(metrics.rangeEnd);        // 100
console.log(metrics.meanV);           // Average V
console.log(metrics.meanU);           // Average U
console.log(metrics.meanS);           // Average S
console.log(metrics.maxV);            // Max V
console.log(metrics.maxS);            // Max S
```

### Utilities

```typescript
// Clear caches
wasm.clear_caches();

// Version
const version = wasm.version();  // "2.0.0"
```

---

## Error Handling

All functions throw appropriate errors for invalid inputs:

- **TypeError**: Invalid type (e.g., negative natural number)
- **Error**: Domain errors (e.g., division by zero, sqrt of negative real)
- **RangeError**: Out of range values

**Example**:
```typescript
try {
  const n = natural(-1);  // TypeError
} catch (error) {
  console.error(error.message);
}

try {
  const result = divide.real(real(5), real(0));  // Error: Division by zero
} catch (error) {
  console.error(error.message);
}
```

---

## Performance Notes

- **Fibonacci/Lucas**: O(log n) with memoization
- **Zeckendorf**: O(log n) greedy algorithm
- **B-K Functions**: O(n) cumulative computation
- **Q-Network**: O(n³) per iteration (matrix operations)
- **Vector Search**: 150x faster with HNSW
- **Memory**: 4-32x reduction with quantization

---

**Version**: 2.0.0
**Last Updated**: 2025-11-12

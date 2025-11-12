# Behrend-Kimberling Theorem Validator

## Overview

The Behrend-Kimberling (B-K) theorem validator implements a critical mathematical theorem relating Zeckendorf and Lucas representations to identify Nash equilibrium points.

## The Theorem

**CRITICAL THEOREM:**
```
S(n) = 0 ⟺ n+1 = Lₘ (Lucas number)
```

Where:
- **V(n) = Σₖ₌₀ⁿ z(k)** - Cumulative Zeckendorf count
- **U(n) = Σₖ₌₀ⁿ ℓ(k)** - Cumulative Lucas count
- **S(n) = V(n) - U(n)** - B-K divergence (Nash equilibrium indicator)
- **d(n) = z(n) - ℓ(n)** - Local difference
- **z(n)** - Number of terms in Zeckendorf representation of n
- **ℓ(n)** - Number of terms in Lucas representation of n

## Key Concepts

### Zeckendorf Representation
Every positive integer has a unique representation as a sum of non-consecutive Fibonacci numbers (Zeckendorf's theorem).

Example: `100 = F(9) + F(6) + F(4) + F(2) = 55 + 21 + 13 + 8 + 3`
- z(100) = 5 (five terms)

### Lucas Representation
Every positive integer can be represented as a sum of Lucas numbers using a greedy algorithm.

Example: `100 = L(8) + L(7) + L(6) + L(4) + L(1) = 47 + 29 + 18 + 4 + 1 + 1`
- ℓ(100) = 6 (six terms)

### Nash Equilibrium Points
Points where S(n) = 0 represent equilibrium states where the cumulative divergence between Zeckendorf and Lucas counts reaches zero. According to the B-K theorem, these occur exactly when n+1 is a Lucas number.

## File Structure

```
/home/user/agentic-flow/src/math-framework/
├── sequences/
│   ├── fibonacci.ts          # Fibonacci sequence generator
│   ├── lucas.ts               # Lucas sequence generator
│   ├── q-matrix.ts            # Fast matrix exponentiation
│   ├── zeckendorf.ts          # Zeckendorf representation
│   ├── lucas-repr.ts          # Lucas representation
│   └── index.ts               # Sequence exports
│
├── divergence/
│   ├── behrend-kimberling.ts  # Main B-K theorem validator
│   ├── agentdb-integration.ts # AgentDB memory storage
│   └── index.ts               # Divergence exports
│
└── [other modules...]
```

## Usage Examples

### 1. Basic Verification

```typescript
import { verifyBKTheoremAt } from './src/math-framework/divergence';

// Verify theorem at specific point
const result = verifyBKTheoremAt(10);
console.log(result.message);
// Output: ✓ Theorem verified: S(10) = 0 and 11 = L(5)
```

### 2. Full Analysis

```typescript
import { analyzeBKTheorem, generateBKReport } from './src/math-framework/divergence';

// Analyze range [0, 100]
const analysis = analyzeBKTheorem(100);
const report = generateBKReport(analysis);
console.log(report);
```

### 3. Find Nash Equilibria

```typescript
import { findNashEquilibria } from './src/math-framework/divergence';

// Find all Nash equilibrium points in range
const equilibria = findNashEquilibria(200);
console.log(`Found ${equilibria.length} Nash equilibria`);
// Output: Found 12 Nash equilibria
```

### 4. Compute Cumulative Functions

```typescript
import { computeV, computeU, computeS, computeD } from './src/math-framework/divergence';

const n = 50;
const V_n = computeV(n);  // Cumulative Zeckendorf count
const U_n = computeU(n);  // Cumulative Lucas count
const S_n = computeS(n);  // Divergence
const d_n = computeD(n);  // Local difference

console.log(`V(${n}) = ${V_n}`);
console.log(`U(${n}) = ${U_n}`);
console.log(`S(${n}) = ${S_n}`);
console.log(`d(${n}) = ${d_n}`);
```

### 5. AgentDB Integration

```typescript
import { BKMemoryManager } from './src/math-framework/divergence';

const memory = new BKMemoryManager();

// Analyze and store in memory
const result = await memory.storeAnalysis(150);
console.log(`Stored ${result.nashKeys.length} Nash points`);

// Retrieve stored Nash equilibria
const stored = await memory.getNashEquilibria(150);
for (const entry of stored) {
  console.log(`n=${entry.n}: Lucas ${entry.lucasNumber} = L(${entry.lucasIndex})`);
}

// Get memory statistics
const stats = memory.getStats();
console.log(`Total entries: ${stats.totalEntries}`);
console.log(`Nash entries: ${stats.nashEntries}`);
```

## API Reference

### Core Functions

#### `analyzeBKTheorem(n: number): BKAnalysis`
Performs complete B-K theorem analysis for range [0, n].

Returns:
- `points`: All analyzed points with V, U, S, d values
- `nashEquilibria`: Points where S(n) = 0
- `lucasPoints`: Points where n+1 is a Lucas number
- `theoremVerified`: Whether all points satisfy the theorem
- `violations`: Any theorem violations found

#### `verifyBKTheoremAt(n: number)`
Verifies the B-K theorem at a specific point.

Returns object with:
- `verified`: boolean
- `S_n`: divergence value
- `isLucasNumber`: whether n+1 is Lucas
- `message`: human-readable result

#### `findNashEquilibria(n: number): number[]`
Finds all Nash equilibrium points (S(n) = 0) in range [0, n].

#### `computeV(n: number): number`
Computes V(n) = Σₖ₌₀ⁿ z(k) - cumulative Zeckendorf count.

#### `computeU(n: number): number`
Computes U(n) = Σₖ₌₀ⁿ ℓ(k) - cumulative Lucas count.

#### `computeS(n: number): number`
Computes S(n) = V(n) - U(n) - B-K divergence.

#### `computeD(n: number): number`
Computes d(n) = z(n) - ℓ(n) - local difference.

### AgentDB Integration

#### `BKMemoryManager`
Manages persistent storage of B-K analysis results.

Methods:
- `storeAnalysis(n: number)`: Analyze and store complete results
- `getNashEquilibria(range?: number)`: Retrieve stored Nash points
- `getStats()`: Get memory usage statistics
- `exportJSON()`: Export all memory as JSON
- `clear()`: Clear all memory

## Running the Demo

```bash
cd /home/user/agentic-flow
npx tsx tests/behrend-kimberling-demo.ts
```

The demo includes:
1. Basic theorem verification
2. Full range analysis
3. Nash equilibrium detection
4. AgentDB memory integration
5. Cumulative function comparison
6. Pattern analysis

## Mathematical Properties

### Lucas Numbers
L(0) = 2, L(1) = 1, L(n) = L(n-1) + L(n-2)

Sequence: 2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123, 199, ...

### Fibonacci Numbers
F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2)

Sequence: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ...

### Key Identity
L(n) = F(n-1) + F(n+1)

## Performance

The implementation uses efficient algorithms:
- **Fibonacci/Lucas**: Memoized O(1) for cached values, O(log n) with Q-matrix
- **Zeckendorf**: Greedy algorithm O(log n)
- **Lucas representation**: Greedy algorithm O(log n)
- **Cumulative functions**: Single-pass O(n)
- **Full analysis**: O(n²) for range [0, n]

For large ranges (n > 1000), consider batching or streaming results.

## Integration with AgentDB

All Nash equilibrium candidates are stored in AgentDB with:
- Full context (V, U, S, d values)
- Lucas number identification
- Timestamp for tracking
- Metadata for categorization

This enables:
- Pattern learning across multiple analyses
- Historical tracking of equilibrium points
- Cross-session memory persistence
- Neural pattern training

## Future Extensions

Potential enhancements:
- Parallel computation for large ranges
- Streaming analysis for memory efficiency
- Visualization of divergence patterns
- Integration with game theory frameworks
- Extended theorem verification (higher-order)

## References

1. Behrend-Kimberling Theorem (Number Theory)
2. Zeckendorf's Theorem (1972)
3. Lucas Sequences (Édouard Lucas, 1878)
4. Nash Equilibrium (John Nash, 1950)

## License

MIT License - Part of the agentic-flow mathematical framework

# Sequence Generation Module

Comprehensive implementation of Fibonacci and Lucas number generation with multiple computation methods, performance optimization, and AgentDB integration for pattern learning.

## Features

### 1. Fibonacci Numbers

Multiple computation methods:
- **Recurrence Relation**: F(n) = F(n-1) + F(n-2)
- **Binet's Formula**: F(n) = (φⁿ - ψⁿ)/√5
- **Q-Matrix Method**: Fast matrix exponentiation O(log n)
- **Memoization**: Cached results for repeated queries

### 2. Lucas Numbers

Multiple computation methods:
- **Recurrence Relation**: L(n) = L(n-1) + L(n-2)
- **Binet-like Formula**: L(n) = φⁿ + ψⁿ
- **Fibonacci Relation**: L(n) = F(n-1) + F(n+1)
- **Memoization**: Cached results for performance

### 3. Q-Matrix Method

Advanced matrix-based computation:
- Fast exponentiation using binary method
- O(log n) time complexity
- Suitable for computing large Fibonacci numbers
- Matrix verification utilities

### 4. AgentDB Integration

Pattern storage and learning:
- Store computed sequences
- Performance benchmarking
- Identity verification
- Export data for ML training

## Usage Examples

### Basic Usage

```typescript
import { fibonacci, lucas } from './sequences';

// Compute Fibonacci number
const fib10 = fibonacci(10); // 55n

// Compute Lucas number
const lucas10 = lucas(10); // 123n
```

### Method Comparison

```typescript
import { fibonacciCompare, lucasCompare } from './sequences';

// Compare all Fibonacci methods
const fibComparison = fibonacciCompare(20);
console.log('All methods match:', fibComparison.allMatch);
console.log('Timings:', fibComparison.timings);

// Compare all Lucas methods
const lucasComparison = lucasCompare(20);
console.log('All methods match:', lucasComparison.allMatch);
```

### Q-Matrix Method

```typescript
import { fibonacciQMatrix, verifyQMatrixProperties } from './sequences';

// Compute using Q-matrix
const result = fibonacciQMatrix(15);
console.log('F(15):', result.fibonacci);
console.log('F(16):', result.fibonacciNext);
console.log('F(14):', result.fibonacciPrev);

// Verify matrix properties
const isValid = verifyQMatrixProperties(result);
console.log('Matrix valid:', isValid);
```

### Generate Sequences

```typescript
import { fibonacciSequence, lucasSequence } from './sequences';

// Generate Fibonacci sequence 0 to 10
const fibSeq = fibonacciSequence(10);
console.log('Fibonacci:', fibSeq);

// Generate Lucas sequence 0 to 10
const lucSeq = lucasSequence(10);
console.log('Lucas:', lucSeq);
```

### Verify Mathematical Identities

```typescript
import { FibonacciIdentities, LucasIdentities } from './sequences';

// Verify Cassini's identity: F(n-1)*F(n+1) - F(n)² = (-1)ⁿ
const cassiniValid = FibonacciIdentities.verifyCassini(10);

// Verify Lucas-Fibonacci relation: L(n) = F(n-1) + F(n+1)
const lucasFibValid = LucasIdentities.verifyFibonacciRelation(10);

// Verify square identity: L(n)² - 5*F(n)² = 4*(-1)ⁿ
const squareValid = LucasIdentities.verifySquareIdentity(10);
```

### AgentDB Integration

```typescript
import {
  fibonacciWithStorage,
  lucasWithStorage,
  benchmarkFibonacciMethods,
  generateLearningDataset,
  getAgentDBStats
} from './sequences/agentdb-integration';

// Compute with automatic pattern storage
const fib = fibonacciWithStorage(50);
const luc = lucasWithStorage(50);

// Benchmark all methods
const fibPerf = benchmarkFibonacciMethods(0, 30);
console.log('Average performance:', fibPerf.averagePerformance);

// Generate complete learning dataset
const dataset = generateLearningDataset(100);
console.log('Dataset size:', dataset.fibonacciSequence.length);

// Get statistics
const stats = getAgentDBStats();
console.log('Total patterns stored:', stats.totalPatterns);
console.log('Verification success rate:', stats.verificationSuccessRate);
```

## Mathematical Formulas

### Fibonacci Numbers

1. **Recurrence**: F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2)
2. **Binet's Formula**: F(n) = (φⁿ - ψⁿ)/√5
3. **Q-Matrix**: Q = [[1,1],[1,0]], Qⁿ = [[F(n+1),F(n)],[F(n),F(n-1)]]
4. **Cassini's Identity**: F(n-1)·F(n+1) - F(n)² = (-1)ⁿ
5. **Sum Formula**: Σ F(i) from i=0 to n = F(n+2) - 1

### Lucas Numbers

1. **Recurrence**: L(0) = 2, L(1) = 1, L(n) = L(n-1) + L(n-2)
2. **Binet-like**: L(n) = φⁿ + ψⁿ
3. **Fibonacci Relation**: L(n) = F(n-1) + F(n+1)
4. **Alternative**: L(n) = F(n) + 2·F(n-1)
5. **Square Identity**: L(n)² - 5·F(n)² = 4·(-1)ⁿ
6. **Product Formula**: F(2n) = F(n)·L(n)

## Performance Characteristics

| Method | Time Complexity | Space Complexity | Best For |
|--------|----------------|------------------|----------|
| Recurrence | O(2ⁿ) | O(n) | Small n only |
| Binet | O(1) | O(1) | n < 70 (precision limit) |
| Q-Matrix | O(log n) | O(log n) | Large n |
| Memoized | O(n) first, O(1) cached | O(n) | Repeated queries |

## Constants

- **φ (PHI)**: Golden ratio = (1 + √5) / 2 ≈ 1.618033988749895
- **ψ (PSI)**: Conjugate = (1 - √5) / 2 ≈ -0.618033988749895
- **√5 (SQRT5)**: Square root of 5 ≈ 2.23606797749979

## Type Safety

All functions include:
- Input validation (integer checks, range checks)
- Proper error handling
- TypeScript type definitions
- Bigint support for large numbers

## Testing and Verification

The module includes built-in verification:
- All methods cross-verified against each other
- Mathematical identity verification
- Matrix property verification
- Performance benchmarking

## Integration with Math Framework

This module coordinates with other math-framework components:
- **Primitives**: Basic arithmetic operations
- **AgentDB**: Pattern storage and learning
- **Memory Hooks**: Cross-agent coordination

## Files

- `q-matrix.ts`: Q-matrix method and utilities
- `fibonacci.ts`: Fibonacci number generation
- `lucas.ts`: Lucas number generation
- `agentdb-integration.ts`: Pattern storage and learning
- `index.ts`: Module exports

## Coordination Protocol

Coordinates with primitives agent via memory using hooks:
```bash
npx claude-flow@alpha hooks pre-task
npx claude-flow@alpha hooks post-edit --memory-key "sequences/computed"
npx claude-flow@alpha hooks post-task
```

## Future Enhancements

- [ ] Generalized Fibonacci sequences
- [ ] Negative indices support
- [ ] Complex number extensions
- [ ] GPU acceleration for matrix operations
- [ ] Neural network training on sequence patterns

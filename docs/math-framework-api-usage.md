# Math Framework API & CLI Usage Guide

Complete guide for using the Math Framework API and CLI tools.

## Table of Contents

- [Installation](#installation)
- [API Usage](#api-usage)
- [CLI Commands](#cli-commands)
- [REPL Usage](#repl-usage)
- [Examples](#examples)

## Installation

```bash
npm install
npm run build
```

## API Usage

### Basic Import

```typescript
import { MathFramework } from './src/api/framework';

const mf = new MathFramework();
```

### 1. Fibonacci Numbers

```typescript
// Compute F(n)
const f100 = mf.fibonacci(100);
console.log(f100); // 354224848179261915075n (bigint)

// F(10) = 55
const f10 = mf.fibonacci(10);
```

### 2. Lucas Numbers

```typescript
// Compute L(n)
const l10 = mf.lucas(10);
console.log(l10); // 123

// L(20) = 15127
const l20 = mf.lucas(20);
```

### 3. Zeckendorf Decomposition

```typescript
// Decompose n into non-consecutive Fibonacci numbers
const zeck = mf.zeckendorf(42);

console.log(zeck.representation);
// Output: 42 = F7=21 + F6=13 + F5=8

console.log(zeck.summandCount);       // z(42) = 3
console.log(zeck.lucasSummandCount);  // ℓ(42) = count of Lucas indices
console.log(Array.from(zeck.indices)); // [7, 6, 5]
console.log(zeck.values);             // [21, 13, 8]
console.log(zeck.isValid);            // true
```

### 4. Behrend-Kimberling Divergence

```typescript
// Compute S(n) = V(n) - U(n)
const s10 = mf.divergence(10);
console.log(s10); // -13

// Analyze B-K theorem for range [0, n]
const analysis = mf.analyzeBKTheorem(100);

console.log(analysis.theoremVerified);        // true/false
console.log(analysis.nashEquilibria.length);  // Number of Nash points
console.log(analysis.nashEquilibria);         // Array of Nash equilibrium points

// Example Nash point
const nash = analysis.nashEquilibria[0];
console.log(nash.n);          // Index
console.log(nash.S);          // S(n) = 0
console.log(nash.V);          // V(n) cumulative Zeckendorf
console.log(nash.U);          // U(n) cumulative Lucas
```

### 5. Nash Equilibrium Detection

```typescript
// Find all Nash points where S(n) = 0
const nashPoints = mf.findNashPoints(100);
console.log(nashPoints); // [0, 10, 28, ...]

// Verify Nash property
nashPoints.forEach(n => {
  const s_n = mf.divergence(n);
  console.log(`S(${n}) = ${s_n}`); // Should be ≈ 0
});
```

### 6. Phase Space Coordinates

```typescript
// Compute φ(n), ψ(n), θ(n) based on Riemann zeta zeros
const coords = mf.phaseSpace(50);

console.log(coords.phi);        // φ-coordinate
console.log(coords.psi);        // ψ-coordinate
console.log(coords.theta);      // Phase angle (radians)
console.log(coords.magnitude);  // |r| magnitude
```

### 7. Phase Space Trajectory

```typescript
// Generate trajectory from start to end
const trajectory = mf.phaseTrajectory(1, 100, 1);

trajectory.forEach(point => {
  console.log(`n=${point.n}: φ=${point.phi}, ψ=${point.psi}`);
});

// Analyze phase space
const analysis = mf.analyzePhaseSpace(1, 100, 1);
console.log(analysis.nashPoints);     // Nash equilibrium points
console.log(analysis.patterns);       // Detected patterns
```

### 8. Neural Network Training

```typescript
// Create Q-Network with Nash convergence
const nn = mf.createNeuralNetwork({
  layers: [4, 8, 4],          // Network architecture
  learningRate: 0.01,         // α learning rate
  lambda: 0.1,                // λ regularization
  nashThreshold: 1e-6,        // Convergence threshold
  maxIterations: 1000         // Max training steps
});

// Train on game state
const gameState = {
  state: [0.5, 0.3, 0.1, 0.1],     // Current state
  nextState: [0.4, 0.4, 0.1, 0.1]  // Target state
};

const result = await mf.train(gameState, {
  verbose: true,
  callback: (iter, loss, S_n) => {
    console.log(`Iter ${iter}: Loss=${loss}, S(n)=${S_n}`);
  }
});

console.log(result.convergedToNash);  // true if S(n) → 0
console.log(result.finalS_n);         // Final S(n) value
console.log(result.lyapunovStable);   // Lyapunov stability check
console.log(result.trajectories);     // Training trajectories
```

### 9. Complete Profile

```typescript
// Compute all values for range [0, n]
const profile = mf.computeProfile(100);

console.log(profile.fibonacci);    // Array of Fibonacci numbers
console.log(profile.lucas);        // Array of Lucas numbers
console.log(profile.divergence);   // Array of S(n) values
console.log(profile.nashPoints);   // Array of Nash indices
console.log(profile.phaseSpace);   // Array of phase coordinates
```

### 10. Verification

```typescript
// Verify mathematical properties
const verify = mf.verify(100);

console.log(verify.bkTheoremVerified);     // B-K theorem check
console.log(verify.nashPointsConsistent);  // Nash consistency
console.log(verify.zeckendorfValid);       // Zeckendorf validity
console.log(verify.violations);            // List of violations
```

### 11. Data Export

```typescript
// Export data for visualization (JSON)
const data = mf.exportVisualizationData(100);
console.log(data); // JSON string with all computed values
```

## CLI Commands

### Fibonacci

```bash
# Compute Fibonacci number
math-framework fib 100

# With verbose output
math-framework fib 100 --verbose
```

### Lucas

```bash
# Compute Lucas number
math-framework lucas 50

# With details
math-framework lucas 50 -v
```

### Zeckendorf Decomposition

```bash
# Decompose number
math-framework zeck 42
# Output: 42 = F7=21 + F6=13 + F5=8

# Verbose output
math-framework zeck 42 -v
```

### Divergence (B-K)

```bash
# Compute S(n)
math-framework divergence 10

# Analyze range
math-framework divergence 10 --range 100 -v
```

### Nash Equilibrium

```bash
# Find Nash points
math-framework nash 100

# Verbose output
math-framework nash 100 -v
```

### Phase Space

```bash
# Single point
math-framework phase 50

# Trajectory
math-framework phase 1 --trajectory 100

# JSON output for plotting
math-framework phase 1 --trajectory 100 --plot
```

### Neural Network Training

```bash
# Train network
math-framework train --game rock-paper-scissors --steps 1000

# Custom parameters
math-framework train --game tic-tac-toe --steps 2000 --lr 0.01 --lambda 0.1 -v
```

### Verification

```bash
# Verify properties
math-framework verify 100
```

### Export Data

```bash
# Export to stdout
math-framework export 100

# Export to file
math-framework export 100 -o data.json
```

## REPL Usage

Start the interactive REPL:

```bash
math-framework repl
```

### REPL Commands

```
> fib(100)                 # Compute Fibonacci
> lucas(50)                # Compute Lucas
> zeck(42)                 # Zeckendorf decomposition
> divergence(10)           # B-K divergence
> nash(100)                # Find Nash points
> phase(50)                # Phase space coordinates
> trajectory(1, 100)       # Phase trajectory

> x = fib(10)              # Store in variable
> y = lucas(10)
> vars                     # Show variables

> verify(100)              # Verify properties
> profile(50)              # Complete profile

> history                  # Show command history
> clear                    # Clear screen
> help                     # Show help
> exit                     # Exit REPL
```

## Examples

### Example 1: Find all Nash equilibria up to 1000

```typescript
import { MathFramework } from './src/api/framework';

const mf = new MathFramework();
const nash = mf.findNashPoints(1000);

console.log(`Found ${nash.length} Nash equilibrium points`);
nash.forEach(n => {
  const s_n = mf.divergence(n);
  console.log(`n=${n}: S(${n}) = ${s_n.toExponential(4)}`);
});
```

### Example 2: Analyze Zeckendorf patterns

```typescript
const mf = new MathFramework();

for (let n = 1; n <= 100; n++) {
  const zeck = mf.zeckendorf(n);
  if (zeck.summandCount > 5) {
    console.log(`${n} requires ${zeck.summandCount} Fibonacci numbers`);
    console.log(`  ${zeck.representation}`);
  }
}
```

### Example 3: Train neural network for game

```typescript
const mf = new MathFramework();

// Create network
const nn = mf.createNeuralNetwork({
  layers: [9, 16, 9],      // Tic-tac-toe: 9 squares
  learningRate: 0.01,
  lambda: 0.1,
  maxIterations: 5000
});

// Training data (game states)
const states = [
  { state: [...], nextState: [...] },
  // ... more states
];

// Train
const result = await mf.train(states, { verbose: true });

if (result.convergedToNash) {
  console.log('Network converged to Nash equilibrium!');
}
```

### Example 4: Phase space visualization

```typescript
const mf = new MathFramework();

const trajectory = mf.phaseTrajectory(1, 200, 1);
const nashPoints = mf.findNashPoints(200);

// Export for plotting
const data = {
  trajectory: trajectory.map(p => ({ x: p.phi, y: p.psi })),
  nash: nashPoints.map(n => {
    const coords = mf.phaseSpace(n);
    return { x: coords.phi, y: coords.psi };
  })
};

console.log(JSON.stringify(data, null, 2));
```

## Advanced Usage

### Custom Neural Network Configuration

```typescript
const nn = mf.createNeuralNetwork({
  layers: [10, 20, 20, 10],
  activations: ['relu', 'relu', 'tanh'],
  learningRate: 0.005,
  lambda: 0.15,
  nashThreshold: 1e-8,
  maxIterations: 10000,
  convergenceEpsilon: 1e-10,
  qMatrixScale: 1.5,
  enableLyapunovTracking: true,
  enableAgentDB: true
});
```

### Batch Processing

```typescript
const mf = new MathFramework();
const results = [];

for (let n = 0; n <= 1000; n += 10) {
  results.push({
    n,
    fibonacci: mf.fibonacci(n).toString(),
    lucas: mf.lucas(n),
    divergence: mf.divergence(n),
    phase: mf.phaseSpace(n)
  });
}

// Export results
const fs = require('fs');
fs.writeFileSync('results.json', JSON.stringify(results, null, 2));
```

## Performance Tips

1. **Large Fibonacci Numbers**: Use the API directly instead of CLI for F(n) with n > 1000
2. **Batch Operations**: Use `computeProfile()` for multiple values
3. **Neural Training**: Enable AgentDB for trajectory storage and pattern learning
4. **Phase Space**: Use trajectory generation for efficient bulk computation

## Troubleshooting

### Common Issues

1. **Build errors**: Run `npm install` and `npm run build`
2. **Type errors**: Ensure TypeScript 5.x+ is installed
3. **Memory issues**: Use streaming for large datasets
4. **CLI not found**: Run `npm link` after building

## Support

- Documentation: `/docs/math-framework-*.md`
- Examples: `/examples/math-framework-*.ts`
- Tests: `/tests/math-framework/`

---

**Framework Version**: 2.0.0
**Last Updated**: 2025-11-12

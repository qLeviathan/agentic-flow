# Math Framework - Comprehensive API & CLI Tools

Complete mathematical framework with Fibonacci sequences, Zeckendorf decomposition, Behrend-Kimberling divergence, Nash equilibrium detection, phase space coordinates, and neural network training.

## 🚀 Features

- **Fibonacci & Lucas Sequences**: Compute F(n) and L(n) with arbitrary precision
- **Zeckendorf Decomposition**: Unique decomposition into non-consecutive Fibonacci numbers
- **B-K Divergence**: Behrend-Kimberling divergence S(n) = V(n) - U(n)
- **Nash Equilibrium**: Detect Nash equilibrium points where S(n) = 0
- **Phase Space**: Riemann zeta zero-based coordinate system
- **Neural Networks**: Q-matrix evolution with automatic Nash convergence
- **Lyapunov Stability**: Guaranteed convergence with V(n) = S(n)²

## 📦 Installation

```bash
npm install
npm run build
```

## 🔧 API Usage

### Quick Start

```typescript
import { MathFramework } from './src/api/framework';

const mf = new MathFramework();

// Fibonacci
const f100 = mf.fibonacci(100);

// Zeckendorf
const zeck = mf.zeckendorf(42);
console.log(zeck.representation);
// Output: 42 = F9 + F7 + F4 = 34 + 13 + 5

// Nash equilibrium
const nash = mf.findNashPoints(100);
console.log(nash); // [0, 10, 28, ...]

// Neural network
const nn = mf.createNeuralNetwork({
  layers: [4, 8, 4],
  learningRate: 0.01
});

const result = await mf.train(gameState);
console.log(result.convergedToNash); // true
```

## 💻 CLI Commands

### Fibonacci

```bash
math-framework fib 100
# Output: 354224848179261915075
```

### Lucas

```bash
math-framework lucas 50
# Output: 28143753123
```

### Zeckendorf

```bash
math-framework zeck 42
# Output: 42 = F(9) + F(7) + F(4) = 34 + 13 + 5
```

### Divergence

```bash
math-framework divergence 10
# Output: S(10) = 0 → Nash equilibrium, n+1=11=L(5)
```

### Nash Points

```bash
math-framework nash 100
# Output: Found 8 points: 0, 10, 28, ...
```

### Phase Space

```bash
math-framework phase 50
# Output: φ(50) = 2.28, ψ(50) = -5.07, θ(50) = -1.15 rad
```

### Neural Training

```bash
math-framework train --game rock-paper-scissors --steps 1000
# Output: Converged to Nash: ✓, Final S(n): 2.34e-7
```

### Interactive REPL

```bash
math-framework repl
> fib(100)
> zeck(42)
> nash(100)
> phase(50)
```

## 📊 Complete API Reference

### Sequences

```typescript
// Fibonacci F(n)
mf.fibonacci(n: number): bigint

// Lucas L(n)
mf.lucas(n: number): number
```

### Decomposition

```typescript
// Zeckendorf decomposition
mf.zeckendorf(n: number): ZeckendorfRepresentation
// Returns: {
//   n: number,
//   indices: Set<number>,
//   values: number[],
//   summandCount: number,
//   lucasSummandCount: number,
//   isValid: boolean,
//   representation: string
// }
```

### Divergence & Nash

```typescript
// B-K divergence S(n)
mf.divergence(n: number): number

// Find Nash points
mf.findNashPoints(n: number): number[]

// Analyze B-K theorem
mf.analyzeBKTheorem(n: number): BKAnalysis
```

### Phase Space

```typescript
// Single point coordinates
mf.phaseSpace(n: number): PhaseSpaceCoordinates
// Returns: { phi, psi, theta, magnitude }

// Trajectory
mf.phaseTrajectory(start: number, end: number, step?: number): TrajectoryPoint[]

// Analysis
mf.analyzePhaseSpace(start: number, end: number, step?: number): PhaseSpaceAnalysis
```

### Neural Networks

```typescript
// Create network
mf.createNeuralNetwork(config: QNetworkConfig): QNetwork

// Train network
mf.train(gameState: GameState, options?: NeuralTrainingOptions): Promise<TrainingResult>
```

### Utilities

```typescript
// Complete profile
mf.computeProfile(n: number): Profile

// Verify properties
mf.verify(n: number): VerificationResult

// Export data
mf.exportVisualizationData(n: number): string
```

## 🎯 Example: Rock-Paper-Scissors Nash Equilibrium

```typescript
const mf = new MathFramework();

// Create Q-Network
const nn = mf.createNeuralNetwork({
  layers: [3, 8, 3],
  learningRate: 0.01,
  lambda: 0.1,
  maxIterations: 1000
});

// Game state (strategy distribution)
const gameState = {
  state: [0.5, 0.3, 0.2],     // Rock, Paper, Scissors probabilities
  nextState: [1/3, 1/3, 1/3]  // Nash equilibrium (uniform mixed strategy)
};

// Train
const result = await mf.train(gameState, { verbose: true });

if (result.convergedToNash) {
  console.log('Converged to Nash equilibrium!');
  console.log(`Final strategy: uniform mixed (1/3, 1/3, 1/3)`);
  console.log(`S(n) = ${result.finalS_n.toExponential(4)}`);
}
```

## 🧪 Example: Zeckendorf Pattern Analysis

```typescript
const mf = new MathFramework();

// Analyze Zeckendorf patterns for 1-1000
for (let n = 1; n <= 1000; n++) {
  const zeck = mf.zeckendorf(n);
  
  if (zeck.summandCount > 5) {
    console.log(`${n} requires ${zeck.summandCount} Fibonacci numbers:`);
    console.log(`  ${zeck.representation}`);
  }
}
```

## 📈 Mathematical Framework

### Behrend-Kimberling Theorem

**Critical Theorem**: `S(n) = 0 ⟺ n+1 = Lₘ` (Lucas number)

Where:
- `V(n) = Σₖ₌₀ⁿ z(k)` - Cumulative Zeckendorf count
- `U(n) = Σₖ₌₀ⁿ ℓ(k)` - Cumulative Lucas count
- `S(n) = V(n) - U(n)` - B-K divergence

Nash equilibrium occurs when `S(n) = 0`.

### Q-Matrix Evolution

Neural network layers evolve via:
- `h^(ℓ+1) = Q·h^(ℓ)`
- Loss: `ℒ = ||y-ŷ||² + λ·S(n)`
- Update: `W^(t+1) = W^(t) - α·∇W ℒ·ψ^S(n)`

Lyapunov stability ensures convergence:
- `V(n) = S(n)²`
- `dV/dn < 0` → convergence to Nash equilibrium

### Phase Space Coordinates

Based on Riemann zeta zeros:
- `φ(n) = Σᵢ∈Z(n) φⁱ` - φ-coordinate
- `ψ(n) = Σᵢ∈Z(n) ψⁱ` - ψ-coordinate
- `θ(n) = arctan(ψ(n)/φ(n))` - Phase angle

## 📚 Documentation

- [API Usage Guide](/home/user/agentic-flow/docs/math-framework-api-usage.md)
- [Architecture](/home/user/agentic-flow/docs/architecture/MATH_FRAMEWORK_ARCHITECTURE.md)
- [Primitives Usage](/home/user/agentic-flow/docs/math-framework-primitives-usage.md)
- [AgentDB Integration](/home/user/agentic-flow/docs/math-framework-agentdb.md)

## 🧮 File Structure

```
src/
├── api/
│   ├── framework.ts       # Main MathFramework class
│   └── repl.ts           # Interactive REPL
├── cli/
│   └── index.ts          # CLI commands
└── math-framework/
    ├── sequences/        # Fibonacci, Lucas
    ├── decomposition/    # Zeckendorf
    ├── divergence/       # B-K divergence
    ├── phase-space/      # Phase coordinates
    └── neural/           # Q-Network
```

## 🎮 REPL Commands

```bash
math-framework repl

> fib(100)                 # Fibonacci
> lucas(50)                # Lucas
> zeck(42)                 # Zeckendorf
> divergence(10)           # B-K divergence
> nash(100)                # Nash points
> phase(50)                # Phase space
> trajectory(1, 100)       # Phase trajectory
> verify(100)              # Verify properties
> help                     # Show help
> exit                     # Exit
```

## 🔬 Testing

Run the demo:
```bash
npx ts-node examples/math-framework-api-demo.ts
```

Run tests:
```bash
npm test
```

## 📊 Performance

- **Fibonacci**: O(log n) using Q-matrix method
- **Zeckendorf**: O(log n) greedy algorithm
- **Divergence**: O(n) cumulative computation
- **Neural Training**: Converges in O(1000) iterations typical

## 🤝 Contributing

See `/home/user/agentic-flow/CLAUDE.md` for development guidelines.

## 📄 License

MIT License

---

**Version**: 2.0.0  
**Author**: Math Framework Team  
**Last Updated**: 2025-11-12

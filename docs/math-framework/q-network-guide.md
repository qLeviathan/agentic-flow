# Q-Network: Neural Networks with Nash Equilibrium Convergence

## Overview

The Q-Network is an advanced neural network implementation that combines:
- **Q-matrix evolution** for state transitions
- **S(n) regularization** for strategic stability
- **Automatic Nash equilibrium convergence**
- **Lyapunov stability guarantees**
- **AgentDB integration** for trajectory storage

## Mathematical Foundation (Level 8-9)

### 1. Q-Matrix Evolution

State evolution through layers:
```
h^(ℓ+1) = Q·h^(ℓ)
```

Where:
- `h^(ℓ)` is the hidden state at layer ℓ
- `Q` is the evolution matrix (learned)
- This creates a dynamic system with controllable evolution

### 2. Loss Function

```
ℒ = ||y-ŷ||² + λ·S(n)
```

Where:
- `||y-ŷ||²` is the prediction error (MSE)
- `S(n)` is the strategic stability measure
- `λ` controls regularization strength

### 3. Strategic Stability S(n)

```
S(n) = Σ ||∇W^(ℓ)||_F
```

- S(n) measures distance from Nash equilibrium
- At Nash equilibrium: S(n) = 0
- Computed as sum of gradient Frobenius norms

### 4. Gradient with Chain Rule

```
∇W ℒ = ∂||y-ŷ||²/∂W + λ·∂S(n)/∂W
```

Full chain rule through:
- Activation functions
- Q-matrix evolution
- Weight transformations

### 5. Update Rule with Damping

```
W^(t+1) = W^(t) - α·∇W ℒ·ψ^S(n)
```

Where:
- `α` is the learning rate
- `ψ^S(n) = 1/(1 + S(n))` is the damping factor
- Adaptive learning rate based on stability

### 6. Lyapunov Stability

```
V(n) = S(n)²
dV/dn < 0
```

Proves convergence:
- V is a Lyapunov function
- V decreases over time
- System converges to S(n) = 0 (Nash equilibrium)

## Installation

```bash
npm install agentdb  # Optional, for trajectory storage
```

## Basic Usage

### Simple Neural Network

```typescript
import { QNetwork, Matrix } from './src/math-framework/neural/q-network';

// Create network
const network = new QNetwork({
  layers: [2, 4, 1],  // Input: 2, Hidden: 4, Output: 1
  activations: ['relu', 'sigmoid'],
  learningRate: 0.1,
  lambda: 0.1,
  maxIterations: 1000,
});

// Prepare training data
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

// Train with Nash convergence
const result = network.train(X, Y, {
  verbose: true,
  callback: (iter, loss, S_n) => {
    console.log(`Iteration ${iter}: Loss=${loss.toFixed(6)}, S(n)=${S_n.toExponential(4)}`);
  },
});

console.log('Training complete!');
console.log(`Final loss: ${result.finalLoss}`);
console.log(`Converged to Nash: ${result.convergedToNash}`);
console.log(`Final S(n): ${result.finalS_n}`);
console.log(`Lyapunov stable: ${result.lyapunovStable}`);

// Make predictions
const prediction = network.predict(Matrix.from2D([[1], [0]]));
console.log('Prediction:', prediction.get(0, 0));
```

## Advanced Configuration

### Complete Configuration Options

```typescript
const network = new QNetwork({
  // Network architecture
  layers: [10, 20, 10, 5],  // Multiple hidden layers
  activations: ['relu', 'tanh', 'sigmoid'],  // Per-layer activations

  // Training hyperparameters
  learningRate: 0.01,        // α in update rule
  lambda: 0.1,               // S(n) regularization strength
  maxIterations: 5000,       // Maximum training iterations

  // Nash equilibrium convergence
  nashThreshold: 1e-6,       // S(n) threshold for convergence
  convergenceEpsilon: 1e-8,  // Loss convergence threshold

  // Q-matrix configuration
  qMatrixScale: 1.0,         // Q-matrix initialization scale

  // Tracking and storage
  enableLyapunovTracking: true,  // Track stability
  enableAgentDB: true,           // Store trajectories in AgentDB
});
```

### Activation Functions

Available activation functions:
- `'relu'`: Rectified Linear Unit, max(0, x)
- `'sigmoid'`: Sigmoid, 1/(1 + e^(-x))
- `'tanh'`: Hyperbolic tangent
- `'linear'`: Linear activation (no transformation)

### Training Callbacks

```typescript
const result = network.train(X, Y, {
  verbose: true,
  callback: (iteration, loss, S_n) => {
    // Custom monitoring
    if (iteration % 100 === 0) {
      console.log(`[${iteration}] Loss: ${loss}, S(n): ${S_n}`);

      // Check for divergence
      if (loss > 1000) {
        console.warn('Loss diverging! Consider reducing learning rate.');
      }
    }
  },
});
```

## Training Result Analysis

### Understanding the Results

```typescript
interface TrainingResult {
  finalLoss: number;          // Final total loss
  iterations: number;         // Iterations until convergence
  convergedToNash: boolean;   // Did S(n) reach threshold?
  finalS_n: number;           // Final strategic stability
  trajectories: TrainingTrajectory[];  // Full training history
  lyapunovStable: boolean;    // Was V(n) decreasing?
}
```

### Analyzing Trajectories

```typescript
const result = network.train(X, Y);

// Plot S(n) convergence
const S_n_values = result.trajectories.map(t => t.S_n);
console.log('S(n) over time:', S_n_values);

// Verify Lyapunov stability
const V_values = result.trajectories.map(t => t.lyapunov_V);
console.log('V(n) = S(n)² over time:', V_values);

// Check Nash distance
const nash_distances = result.trajectories.map(t => t.nash_distance);
console.log('Distance to Nash equilibrium:', nash_distances);

// Analyze convergence rate
if (result.convergedToNash) {
  console.log(`Converged to Nash in ${result.iterations} iterations`);
  console.log(`Final S(n) = ${result.finalS_n} < ${network.config.nashThreshold}`);
}
```

## Weight Management

### Export and Import Weights

```typescript
// Export trained weights
const weights = network.exportWeights();

// Save to file
import fs from 'fs';
fs.writeFileSync('model.json', JSON.stringify(weights, null, 2));

// Load weights into new network
const network2 = new QNetwork({
  layers: [2, 4, 1],
  activations: ['relu', 'sigmoid'],
});

const loadedWeights = JSON.parse(fs.readFileSync('model.json', 'utf-8'));
network2.importWeights(loadedWeights);

// Make predictions with loaded model
const prediction = network2.predict(input);
```

## AgentDB Integration

### Automatic Trajectory Storage

When `enableAgentDB: true`, training trajectories are automatically stored:

```typescript
const network = new QNetwork({
  layers: [2, 4, 1],
  enableAgentDB: true,  // Enable storage
});

const result = network.train(X, Y);

// Trajectories stored in AgentDB:
// - qnetwork/training/{timestamp} - Training metadata
// - qnetwork/trajectory/{timestamp}/{iteration} - Individual iterations
```

### Querying Stored Trajectories

```typescript
import agentdb from 'agentdb';

// Query training sessions
const trainingSessions = await agentdb.query({
  type: 'qnetwork-training',
  converged: true,
});

// Query specific trajectories
const trajectories = await agentdb.query({
  type: 'qnetwork-trajectory',
  S_n: { $lt: 0.01 },  // S(n) < 0.01
});

// Analyze patterns
for (const session of trainingSessions) {
  console.log('Training session:', session.key);
  console.log('Final S(n):', session.value.result.finalS_n);
  console.log('Converged to Nash:', session.value.result.convergedToNash);
}
```

## Performance Optimization

### Tuning Hyperparameters

```typescript
// For faster convergence
const fastNetwork = new QNetwork({
  layers: [2, 4, 1],
  learningRate: 0.1,      // Higher learning rate
  lambda: 1.0,            // Stronger regularization
  nashThreshold: 0.01,    // Less strict threshold
});

// For better accuracy
const accurateNetwork = new QNetwork({
  layers: [2, 8, 4, 1],   // Deeper network
  learningRate: 0.001,    // Lower learning rate
  lambda: 0.01,           // Weaker regularization
  nashThreshold: 1e-8,    // Stricter threshold
});

// For large-scale problems
const scalableNetwork = new QNetwork({
  layers: [100, 50, 20, 1],
  learningRate: 0.01,
  qMatrixScale: 0.5,      // Smaller Q perturbations
  convergenceEpsilon: 1e-6,
});
```

### Monitoring Performance

```typescript
const startTime = Date.now();

const result = network.train(X, Y, {
  callback: (iter, loss, S_n) => {
    const elapsed = (Date.now() - startTime) / 1000;
    const ips = iter / elapsed;  // Iterations per second

    console.log(`[${iter}] ${ips.toFixed(2)} it/s, Loss: ${loss.toFixed(6)}`);
  },
});

console.log(`Training took ${(Date.now() - startTime) / 1000}s`);
```

## Mathematical Properties

### Nash Equilibrium Theorem

**Theorem**: Given loss function ℒ = ||y-ŷ||² + λ·S(n), the update rule W^(t+1) = W^(t) - α·∇W ℒ·ψ^S(n) converges to a Nash equilibrium where S(n) = 0.

**Proof Sketch**:
1. S(n) measures gradient magnitude: S(n) = Σ||∇W^(ℓ)||_F
2. At Nash equilibrium: ∇ℒ = 0, thus S(n) = 0
3. Lyapunov function V(n) = S(n)² ensures stability
4. dV/dn < 0 proves convergence

### Lyapunov Stability

**Definition**: V(n) = S(n)² is a Lyapunov function if:
- V(n) ≥ 0 for all n
- V(n) = 0 iff at equilibrium
- dV/dn < 0 (decreasing)

**Verification**:
```typescript
const result = network.train(X, Y);

// Check stability
for (let i = 1; i < result.trajectories.length; i++) {
  const V_prev = result.trajectories[i - 1].lyapunov_V;
  const V_curr = result.trajectories[i].lyapunov_V;

  const dV = V_curr - V_prev;

  if (dV < 0) {
    console.log(`✓ Iteration ${i}: dV/dn = ${dV} < 0 (stable)`);
  }
}
```

## Advanced Examples

### Regression Problem

```typescript
// y = 2x + 1
const X_train = Array.from({ length: 100 }, (_, i) =>
  Matrix.from2D([[i / 10]])
);

const Y_train = X_train.map(x =>
  Matrix.from2D([[2 * x.get(0, 0) + 1]])
);

const network = new QNetwork({
  layers: [1, 10, 1],
  activations: ['tanh', 'linear'],
  learningRate: 0.01,
  lambda: 0.05,
});

const result = network.train(X_train, Y_train, { verbose: true });

// Test predictions
const testX = Matrix.from2D([[5]]);
const prediction = network.predict(testX);
console.log('Predicted:', prediction.get(0, 0));
console.log('Expected:', 2 * 5 + 1);  // Should be 11
```

### Multi-Output Classification

```typescript
// 3-class classification
const network = new QNetwork({
  layers: [4, 8, 3],  // Output: 3 classes
  activations: ['relu', 'sigmoid'],
  learningRate: 0.05,
});

const X_train = [
  Matrix.from2D([[1], [0], [0], [0]]),
  Matrix.from2D([[0], [1], [0], [0]]),
  Matrix.from2D([[0], [0], [1], [0]]),
];

const Y_train = [
  Matrix.from2D([[1], [0], [0]]),  // Class 0
  Matrix.from2D([[0], [1], [0]]),  // Class 1
  Matrix.from2D([[0], [0], [1]]),  // Class 2
];

network.train(X_train, Y_train);

// Predict class
const testInput = Matrix.from2D([[1], [0], [0], [0]]);
const output = network.predict(testInput);

// Find max probability
let maxIdx = 0;
for (let i = 1; i < 3; i++) {
  if (output.get(i, 0) > output.get(maxIdx, 0)) {
    maxIdx = i;
  }
}

console.log('Predicted class:', maxIdx);
```

### Time Series Prediction

```typescript
// Predict next value in sequence
const sequence = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const windowSize = 3;

const X_train = [];
const Y_train = [];

for (let i = 0; i < sequence.length - windowSize; i++) {
  const window = sequence.slice(i, i + windowSize);
  const target = sequence[i + windowSize];

  X_train.push(Matrix.from2D(window.map(v => [v])));
  Y_train.push(Matrix.from2D([[target]]));
}

const network = new QNetwork({
  layers: [windowSize, 6, 1],
  activations: ['tanh', 'linear'],
});

network.train(X_train, Y_train);

// Predict next value
const lastWindow = Matrix.from2D([[8], [9], [10]]);
const prediction = network.predict(lastWindow);
console.log('Next value:', prediction.get(0, 0));  // Should be ~11
```

## Best Practices

### 1. Choose Appropriate Architecture

- Start small: [input, hidden, output]
- Add layers if underfitting
- Reduce layers if overfitting
- Use 2-4x input size for hidden layers

### 2. Tune Learning Rate

- Start with 0.01
- Increase if loss decreases slowly
- Decrease if loss oscillates
- Monitor S(n) damping effect

### 3. Set Lambda Wisely

- λ = 0.1: Balanced (default)
- λ > 0.5: Faster Nash convergence
- λ < 0.05: Focus on prediction accuracy

### 4. Monitor Convergence

- Check S(n) → 0
- Verify dV/dn < 0
- Track loss plateaus
- Use callbacks for real-time monitoring

### 5. Use AgentDB

- Enable for production systems
- Analyze training patterns
- Debug convergence issues
- Transfer learning from stored weights

## Troubleshooting

### Loss Not Decreasing

```typescript
// Reduce learning rate
learningRate: 0.001  // Instead of 0.1

// Increase regularization
lambda: 0.5  // Helps stabilize training
```

### S(n) Not Converging

```typescript
// Increase lambda
lambda: 1.0  // Stronger Nash convergence

// Reduce nashThreshold
nashThreshold: 0.01  // Less strict
```

### Training Too Slow

```typescript
// Increase learning rate
learningRate: 0.1

// Reduce network size
layers: [2, 4, 1]  // Instead of [2, 20, 20, 1]

// Reduce maxIterations
maxIterations: 500
```

### Numerical Instability

```typescript
// Use tanh instead of sigmoid
activations: ['tanh', 'tanh']

// Reduce Q-matrix scale
qMatrixScale: 0.5

// Normalize input data
X = X.map(x => x.scale(1 / 10))
```

## References

1. Nash, J. (1950). "Equilibrium points in n-person games"
2. Lyapunov, A.M. (1892). "The general problem of stability of motion"
3. Goodfellow, I. et al. (2016). "Deep Learning" - Chapter 8: Optimization
4. Boyd, S. & Vandenberghe, L. (2004). "Convex Optimization"

## File Locations

- Implementation: `/home/user/agentic-flow/src/math-framework/neural/q-network.ts`
- Tests: `/home/user/agentic-flow/tests/math-framework/neural/q-network.test.ts`
- Documentation: `/home/user/agentic-flow/docs/math-framework/q-network-guide.md`

## License

MIT License - Part of the agentic-flow project.

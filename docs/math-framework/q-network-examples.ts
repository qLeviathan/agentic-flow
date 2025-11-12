/**
 * Q-Network Examples
 *
 * Practical examples demonstrating Q-Network capabilities
 */

import { QNetwork, Matrix } from '../../src/math-framework/neural/q-network';

/**
 * Example 1: XOR Problem (Classic Non-Linear Problem)
 */
export function exampleXOR() {
  console.log('=== Example 1: XOR Problem ===\n');

  const network = new QNetwork({
    layers: [2, 4, 1],
    activations: ['tanh', 'sigmoid'],
    learningRate: 0.1,
    lambda: 0.05,
    maxIterations: 2000,
    nashThreshold: 0.001,
  });

  // XOR truth table
  const X = [
    Matrix.from2D([[0], [0]]),  // Input: 0 XOR 0
    Matrix.from2D([[0], [1]]),  // Input: 0 XOR 1
    Matrix.from2D([[1], [0]]),  // Input: 1 XOR 0
    Matrix.from2D([[1], [1]]),  // Input: 1 XOR 1
  ];

  const Y = [
    Matrix.from2D([[0]]),  // Output: 0
    Matrix.from2D([[1]]),  // Output: 1
    Matrix.from2D([[1]]),  // Output: 1
    Matrix.from2D([[0]]),  // Output: 0
  ];

  console.log('Training XOR network...');
  const result = network.train(X, Y, {
    verbose: true,
    callback: (iter, loss, S_n) => {
      if (iter % 200 === 0) {
        console.log(`  Iter ${iter}: Loss=${loss.toFixed(6)}, S(n)=${S_n.toExponential(4)}`);
      }
    },
  });

  console.log('\nTraining Results:');
  console.log(`  Final Loss: ${result.finalLoss.toFixed(6)}`);
  console.log(`  Iterations: ${result.iterations}`);
  console.log(`  Converged to Nash: ${result.convergedToNash}`);
  console.log(`  Final S(n): ${result.finalS_n.toExponential(6)}`);
  console.log(`  Lyapunov Stable: ${result.lyapunovStable}`);

  // Test predictions
  console.log('\nPredictions:');
  for (let i = 0; i < X.length; i++) {
    const prediction = network.predict(X[i]);
    const expected = Y[i].get(0, 0);
    const predicted = prediction.get(0, 0);
    const correct = Math.abs(predicted - expected) < 0.3;

    console.log(`  ${X[i].get(0, 0)} XOR ${X[i].get(1, 0)} = ${predicted.toFixed(4)} (expected ${expected}) ${correct ? '✓' : '✗'}`);
  }
}

/**
 * Example 2: Linear Regression with Nash Convergence
 */
export function exampleLinearRegression() {
  console.log('\n=== Example 2: Linear Regression (y = 2x + 1) ===\n');

  const network = new QNetwork({
    layers: [1, 5, 1],
    activations: ['relu', 'linear'],
    learningRate: 0.01,
    lambda: 0.1,
    maxIterations: 1000,
  });

  // Generate training data: y = 2x + 1
  const X: Matrix[] = [];
  const Y: Matrix[] = [];

  for (let i = 0; i < 20; i++) {
    const x = i * 0.5;
    const y = 2 * x + 1;
    X.push(Matrix.from2D([[x]]));
    Y.push(Matrix.from2D([[y]]));
  }

  console.log('Training linear regression...');
  const result = network.train(X, Y, {
    verbose: false,
    callback: (iter, loss, S_n) => {
      if (iter % 100 === 0) {
        console.log(`  Iter ${iter}: Loss=${loss.toFixed(6)}, S(n)=${S_n.toExponential(4)}`);
      }
    },
  });

  console.log('\nTraining Results:');
  console.log(`  Final Loss: ${result.finalLoss.toFixed(6)}`);
  console.log(`  Converged to Nash: ${result.convergedToNash}`);

  // Test predictions
  console.log('\nTest Predictions:');
  const testValues = [5, 10, 15];
  for (const x of testValues) {
    const input = Matrix.from2D([[x]]);
    const prediction = network.predict(input);
    const expected = 2 * x + 1;
    const predicted = prediction.get(0, 0);
    const error = Math.abs(predicted - expected);

    console.log(`  x=${x}: predicted=${predicted.toFixed(2)}, expected=${expected}, error=${error.toFixed(2)}`);
  }
}

/**
 * Example 3: Multi-Class Classification
 */
export function exampleMultiClass() {
  console.log('\n=== Example 3: Multi-Class Classification ===\n');

  const network = new QNetwork({
    layers: [4, 8, 3],  // 4 features → 3 classes
    activations: ['relu', 'sigmoid'],
    learningRate: 0.05,
    lambda: 0.1,
    maxIterations: 1000,
  });

  // Training data: 3 classes with distinct patterns
  const X = [
    // Class 0: High first feature
    Matrix.from2D([[1], [0], [0], [0]]),
    Matrix.from2D([[0.9], [0.1], [0], [0]]),
    Matrix.from2D([[0.8], [0], [0.1], [0]]),

    // Class 1: High second feature
    Matrix.from2D([[0], [1], [0], [0]]),
    Matrix.from2D([[0.1], [0.9], [0], [0.1]]),
    Matrix.from2D([[0], [0.8], [0.1], [0]]),

    // Class 2: High third/fourth features
    Matrix.from2D([[0], [0], [1], [0]]),
    Matrix.from2D([[0], [0.1], [0], [1]]),
    Matrix.from2D([[0.1], [0], [0.8], [0.8]]),
  ];

  const Y = [
    // Class 0
    Matrix.from2D([[1], [0], [0]]),
    Matrix.from2D([[1], [0], [0]]),
    Matrix.from2D([[1], [0], [0]]),

    // Class 1
    Matrix.from2D([[0], [1], [0]]),
    Matrix.from2D([[0], [1], [0]]),
    Matrix.from2D([[0], [1], [0]]),

    // Class 2
    Matrix.from2D([[0], [0], [1]]),
    Matrix.from2D([[0], [0], [1]]),
    Matrix.from2D([[0], [0], [1]]),
  ];

  console.log('Training multi-class classifier...');
  const result = network.train(X, Y, { verbose: false });

  console.log('\nTraining Results:');
  console.log(`  Final Loss: ${result.finalLoss.toFixed(6)}`);
  console.log(`  S(n): ${result.finalS_n.toExponential(4)}`);

  // Test predictions
  console.log('\nTest Predictions:');
  for (let i = 0; i < X.length; i++) {
    const prediction = network.predict(X[i]);

    // Find predicted class (argmax)
    let predictedClass = 0;
    let maxProb = prediction.get(0, 0);

    for (let j = 1; j < 3; j++) {
      if (prediction.get(j, 0) > maxProb) {
        maxProb = prediction.get(j, 0);
        predictedClass = j;
      }
    }

    // Find expected class
    let expectedClass = 0;
    for (let j = 0; j < 3; j++) {
      if (Y[i].get(j, 0) === 1) {
        expectedClass = j;
        break;
      }
    }

    const correct = predictedClass === expectedClass;
    console.log(`  Sample ${i}: Predicted=${predictedClass}, Expected=${expectedClass} ${correct ? '✓' : '✗'}`);
  }
}

/**
 * Example 4: Nash Equilibrium Analysis
 */
export function exampleNashAnalysis() {
  console.log('\n=== Example 4: Nash Equilibrium Convergence Analysis ===\n');

  const network = new QNetwork({
    layers: [2, 6, 1],
    activations: ['tanh', 'linear'],
    learningRate: 0.05,
    lambda: 0.5,  // High regularization for faster Nash convergence
    maxIterations: 500,
    nashThreshold: 0.001,
    enableLyapunovTracking: true,
  });

  // Simple dataset
  const X = [
    Matrix.from2D([[0], [0]]),
    Matrix.from2D([[1], [1]]),
    Matrix.from2D([[2], [2]]),
  ];

  const Y = [
    Matrix.from2D([[0]]),
    Matrix.from2D([[2]]),
    Matrix.from2D([[4]]),
  ];

  console.log('Training with Nash convergence tracking...');
  const result = network.train(X, Y, { verbose: false });

  console.log('\nNash Equilibrium Analysis:');
  console.log(`  Converged to Nash: ${result.convergedToNash}`);
  console.log(`  Final S(n): ${result.finalS_n.toExponential(6)}`);
  console.log(`  Lyapunov Stable: ${result.lyapunovStable}`);

  // Analyze S(n) convergence
  console.log('\nS(n) Convergence (every 50 iterations):');
  for (let i = 0; i < result.trajectories.length; i += 50) {
    const traj = result.trajectories[i];
    console.log(`  Iter ${traj.iteration}: S(n)=${traj.S_n.toExponential(6)}, V(n)=${traj.lyapunov_V.toExponential(6)}`);
  }

  // Verify Lyapunov stability
  console.log('\nLyapunov Stability Verification (dV/dn < 0):');
  let stableIterations = 0;
  for (let i = 1; i < Math.min(result.trajectories.length, 10); i++) {
    const V_prev = result.trajectories[i - 1].lyapunov_V;
    const V_curr = result.trajectories[i].lyapunov_V;
    const dV = V_curr - V_prev;

    const stable = dV < 0;
    if (stable) stableIterations++;

    console.log(`  Iter ${i}: dV=${dV.toExponential(4)} ${stable ? '✓ (stable)' : '✗ (unstable)'}`);
  }

  const stabilityRate = stableIterations / 9;
  console.log(`\nStability Rate: ${(stabilityRate * 100).toFixed(1)}%`);
}

/**
 * Example 5: Weight Export/Import
 */
export function exampleWeightManagement() {
  console.log('\n=== Example 5: Weight Export/Import ===\n');

  // Train first network
  const network1 = new QNetwork({
    layers: [2, 4, 1],
    learningRate: 0.1,
    maxIterations: 500,
  });

  const X = [
    Matrix.from2D([[0], [0]]),
    Matrix.from2D([[1], [1]]),
  ];

  const Y = [
    Matrix.from2D([[0]]),
    Matrix.from2D([[1]]),
  ];

  console.log('Training network 1...');
  network1.train(X, Y, { verbose: false });

  // Export weights
  console.log('Exporting weights...');
  const weights = network1.exportWeights();
  console.log(`  Exported ${weights.layers.length} layers`);

  // Create second network and import weights
  console.log('Creating network 2 and importing weights...');
  const network2 = new QNetwork({
    layers: [2, 4, 1],
  });

  network2.importWeights(weights);

  // Compare predictions
  console.log('\nComparing predictions:');
  const testInput = Matrix.from2D([[0.5], [0.5]]);

  const pred1 = network1.predict(testInput);
  const pred2 = network2.predict(testInput);

  console.log(`  Network 1: ${pred1.get(0, 0).toFixed(6)}`);
  console.log(`  Network 2: ${pred2.get(0, 0).toFixed(6)}`);
  console.log(`  Match: ${Math.abs(pred1.get(0, 0) - pred2.get(0, 0)) < 1e-10 ? '✓' : '✗'}`);
}

/**
 * Example 6: Training with Callbacks
 */
export function exampleTrainingCallbacks() {
  console.log('\n=== Example 6: Training with Real-Time Monitoring ===\n');

  const network = new QNetwork({
    layers: [2, 6, 1],
    learningRate: 0.05,
    lambda: 0.2,
    maxIterations: 300,
  });

  const X = [
    Matrix.from2D([[0], [0]]),
    Matrix.from2D([[1], [0]]),
    Matrix.from2D([[0], [1]]),
    Matrix.from2D([[1], [1]]),
  ];

  const Y = [
    Matrix.from2D([[0]]),
    Matrix.from2D([[1]]),
    Matrix.from2D([[1]]),
    Matrix.from2D([[0]]),
  ];

  console.log('Training with real-time monitoring...\n');

  // Track metrics
  let minLoss = Infinity;
  let minS_n = Infinity;
  let nashReachedAt = -1;

  const result = network.train(X, Y, {
    verbose: false,
    callback: (iter, loss, S_n) => {
      // Update minimums
      if (loss < minLoss) minLoss = loss;
      if (S_n < minS_n) minS_n = S_n;

      // Check Nash convergence
      if (nashReachedAt === -1 && S_n < 0.001) {
        nashReachedAt = iter;
        console.log(`🎯 Nash equilibrium reached at iteration ${iter}`);
      }

      // Progress report every 50 iterations
      if (iter % 50 === 0) {
        const nashDist = S_n;
        const progress = (iter / 300) * 100;

        console.log(`[${iter.toString().padStart(3)}] Progress: ${progress.toFixed(0)}% | Loss: ${loss.toFixed(6)} | S(n): ${nashDist.toExponential(4)}`);
      }

      // Warn if diverging
      if (iter > 50 && loss > 10) {
        console.warn('⚠️  Warning: Loss diverging! Consider reducing learning rate.');
      }
    },
  });

  console.log('\n📊 Training Summary:');
  console.log(`  Total Iterations: ${result.iterations}`);
  console.log(`  Minimum Loss: ${minLoss.toFixed(6)}`);
  console.log(`  Minimum S(n): ${minS_n.toExponential(6)}`);
  console.log(`  Nash Reached At: ${nashReachedAt >= 0 ? `Iteration ${nashReachedAt}` : 'Not reached'}`);
  console.log(`  Final Converged: ${result.convergedToNash ? '✓' : '✗'}`);
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Q-Network Examples - Complete Suite     ║');
  console.log('╚════════════════════════════════════════════╝\n');

  try {
    exampleXOR();
    exampleLinearRegression();
    exampleMultiClass();
    exampleNashAnalysis();
    exampleWeightManagement();
    exampleTrainingCallbacks();

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║   All Examples Completed Successfully!    ║');
    console.log('╚════════════════════════════════════════════╝');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}

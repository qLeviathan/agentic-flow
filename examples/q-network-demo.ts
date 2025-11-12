#!/usr/bin/env ts-node
/**
 * Q-Network Quick Demo
 *
 * Demonstrates Nash equilibrium convergence on XOR problem
 */

import { QNetwork, Matrix } from '../src/math-framework/neural/q-network';

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║  Q-Network: Nash Equilibrium Neural Network Demo      ║');
console.log('║  Mathematical Framework Level 8-9                      ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log('📐 Mathematical Properties:');
console.log('  • Q-matrix evolution: h^(ℓ+1) = Q·h^(ℓ)');
console.log('  • Loss function: ℒ = ||y-ŷ||² + λ·S(n)');
console.log('  • Gradient: ∇W ℒ = ∂||·||²/∂W + λ·∂S/∂W');
console.log('  • Update rule: W^(t+1) = W^(t) - α·∇W ℒ·ψ^S(n)');
console.log('  • Convergence: S(n) → 0 (Nash equilibrium)');
console.log('  • Lyapunov stability: V(n) = S(n)², dV/dn < 0\n');

console.log('🎯 Problem: XOR Classification (Non-Linear)');
console.log('  Input → Output');
console.log('  0 ⊕ 0 → 0');
console.log('  0 ⊕ 1 → 1');
console.log('  1 ⊕ 0 → 1');
console.log('  1 ⊕ 1 → 0\n');

// Create Q-Network
console.log('🏗️  Creating Q-Network...');
const network = new QNetwork({
  layers: [2, 6, 1],            // Architecture: 2 → 6 → 1
  activations: ['tanh', 'sigmoid'],
  learningRate: 0.1,            // α = 0.1
  lambda: 0.1,                  // λ = 0.1 for S(n) regularization
  maxIterations: 2000,
  nashThreshold: 0.001,         // S(n) < 0.001 for convergence
  enableLyapunovTracking: true,
  enableAgentDB: false,         // Disable for quick demo
});

const stats = network.getStats();
console.log(`  ✓ Layers: ${stats.layerSizes.join(' → ')}`);
console.log(`  ✓ Q-matrices: ${stats.qMatrices}`);
console.log(`  ✓ Total parameters: ${stats.totalParameters}\n`);

// Prepare XOR dataset
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

// Training with real-time monitoring
console.log('🚀 Training Network...\n');
console.log('Iter | Loss      | S(n)      | V(n)      | Nash Distance');
console.log('-----|-----------|-----------|-----------|---------------');

let nashReached = false;
const startTime = Date.now();

const result = network.train(X, Y, {
  verbose: false,
  callback: (iter, loss, S_n) => {
    if (iter % 200 === 0 || (!nashReached && S_n < 0.001)) {
      const V_n = S_n * S_n;
      const nashDist = S_n;

      console.log(
        `${iter.toString().padStart(4)} | ` +
        `${loss.toFixed(6)} | ` +
        `${S_n.toExponential(3)} | ` +
        `${V_n.toExponential(3)} | ` +
        `${nashDist.toExponential(3)}`
      );

      if (!nashReached && S_n < 0.001) {
        nashReached = true;
        console.log(`     🎯 Nash equilibrium reached! S(n) < 0.001`);
      }
    }
  },
});

const trainingTime = (Date.now() - startTime) / 1000;

console.log('\n═════════════════════════════════════════════════════════');
console.log('📊 Training Results:');
console.log('═════════════════════════════════════════════════════════');
console.log(`  Final Loss:          ${result.finalLoss.toFixed(6)}`);
console.log(`  Total Iterations:    ${result.iterations}`);
console.log(`  Training Time:       ${trainingTime.toFixed(2)}s`);
console.log(`  Iterations/Second:   ${(result.iterations / trainingTime).toFixed(1)}`);
console.log(`  Converged to Nash:   ${result.convergedToNash ? '✓ YES' : '✗ NO'}`);
console.log(`  Final S(n):          ${result.finalS_n.toExponential(6)}`);
console.log(`  Lyapunov Stable:     ${result.lyapunovStable ? '✓ YES' : '✗ NO'}`);
console.log(`  Nash Distance:       ${result.trajectories[result.trajectories.length - 1].nash_distance.toExponential(6)}`);

// Lyapunov stability analysis
console.log('\n🔬 Lyapunov Stability Analysis:');
let stableCount = 0;
for (let i = 1; i < Math.min(result.trajectories.length, 20); i++) {
  const V_prev = result.trajectories[i - 1].lyapunov_V;
  const V_curr = result.trajectories[i].lyapunov_V;
  const dV = V_curr - V_prev;

  if (dV < 0) stableCount++;
}

const stabilityRate = stableCount / Math.min(19, result.trajectories.length - 1);
console.log(`  dV/dn < 0 rate:      ${(stabilityRate * 100).toFixed(1)}%`);
console.log(`  Status:              ${stabilityRate > 0.8 ? '✓ Highly stable' : stabilityRate > 0.5 ? '~ Moderately stable' : '✗ Unstable'}`);

// S(n) convergence trajectory
console.log('\n📈 S(n) Convergence Trajectory:');
const milestones = [0, Math.floor(result.trajectories.length * 0.25), Math.floor(result.trajectories.length * 0.5), Math.floor(result.trajectories.length * 0.75), result.trajectories.length - 1];

for (const idx of milestones) {
  if (idx < result.trajectories.length) {
    const traj = result.trajectories[idx];
    const progress = (traj.iteration / result.iterations) * 100;
    console.log(`  ${progress.toFixed(0).padStart(3)}% | S(n) = ${traj.S_n.toExponential(6)}`);
  }
}

// Test predictions
console.log('\n═════════════════════════════════════════════════════════');
console.log('🧪 Testing XOR Predictions:');
console.log('═════════════════════════════════════════════════════════');
console.log('Input  | Expected | Predicted | Error    | Correct');
console.log('-------|----------|-----------|----------|--------');

let correctCount = 0;

for (let i = 0; i < X.length; i++) {
  const prediction = network.predict(X[i]);
  const expected = Y[i].get(0, 0);
  const predicted = prediction.get(0, 0);
  const error = Math.abs(predicted - expected);
  const correct = error < 0.3;

  if (correct) correctCount++;

  const x0 = X[i].get(0, 0);
  const x1 = X[i].get(1, 0);

  console.log(
    `${x0} ⊕ ${x1}  | ` +
    `${expected.toFixed(4)}   | ` +
    `${predicted.toFixed(4)}    | ` +
    `${error.toFixed(6)} | ` +
    `${correct ? '✓' : '✗'}`
  );
}

const accuracy = (correctCount / X.length) * 100;

console.log('\n═════════════════════════════════════════════════════════');
console.log('🎯 Final Results:');
console.log('═════════════════════════════════════════════════════════');
console.log(`  Accuracy:            ${accuracy.toFixed(1)}% (${correctCount}/${X.length})`);
console.log(`  Status:              ${accuracy === 100 ? '✓ PERFECT' : accuracy >= 75 ? '✓ GOOD' : '✗ NEEDS IMPROVEMENT'}`);

// Mathematical verification
console.log('\n📐 Mathematical Verification:');
console.log('  Theorem: Network converges to Nash equilibrium (S(n) = 0)');
console.log(`  Evidence:`);
console.log(`    • S(n) decreased: ${result.trajectories[0].S_n.toExponential(4)} → ${result.finalS_n.toExponential(4)}`);
console.log(`    • Reduction ratio: ${((1 - result.finalS_n / result.trajectories[0].S_n) * 100).toFixed(1)}%`);
console.log(`    • Lyapunov stable: ${result.lyapunovStable ? '✓' : '✗'} (V(n) = S(n)² decreasing)`);
console.log(`    • Nash convergence: ${result.convergedToNash ? '✓' : '✗'} (S(n) < threshold)`);

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║  Demo Complete - Q-Network with Nash Convergence      ║');
console.log('╚════════════════════════════════════════════════════════╝');

// Export summary
const summary = {
  network: {
    architecture: stats.layerSizes,
    parameters: stats.totalParameters,
  },
  training: {
    finalLoss: result.finalLoss,
    iterations: result.iterations,
    timeSeconds: trainingTime,
    convergedToNash: result.convergedToNash,
    finalS_n: result.finalS_n,
    lyapunovStable: result.lyapunovStable,
  },
  evaluation: {
    accuracy: accuracy,
    correctPredictions: correctCount,
    totalSamples: X.length,
  },
};

console.log('\n💾 Summary JSON:');
console.log(JSON.stringify(summary, null, 2));

console.log('\n📚 For more examples, see:');
console.log('  • Documentation: /home/user/agentic-flow/docs/math-framework/q-network-guide.md');
console.log('  • Examples: /home/user/agentic-flow/docs/math-framework/q-network-examples.ts');
console.log('  • Tests: /home/user/agentic-flow/tests/math-framework/neural/q-network.test.ts');
console.log('  • Implementation: /home/user/agentic-flow/src/math-framework/neural/q-network.ts\n');

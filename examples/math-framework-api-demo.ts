/**
 * Math Framework API Demo
 * Demonstrates comprehensive usage of the Math Framework API
 */

import { MathFramework } from '../src/api/framework';

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         Math Framework API Demo v2.0.0                      ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const mf = new MathFramework();

  // 1. FIBONACCI SEQUENCES
  console.log('1️⃣  FIBONACCI SEQUENCES');
  console.log('━'.repeat(60));
  console.log('F(10) =', mf.fibonacci(10).toString());
  console.log('F(20) =', mf.fibonacci(20).toString());
  console.log('F(100) =', mf.fibonacci(100).toString().slice(0, 40) + '...');
  console.log();

  // 2. LUCAS NUMBERS
  console.log('2️⃣  LUCAS NUMBERS');
  console.log('━'.repeat(60));
  console.log('L(10) =', mf.lucas(10));
  console.log('L(20) =', mf.lucas(20));
  console.log();

  // 3. ZECKENDORF DECOMPOSITION
  console.log('3️⃣  ZECKENDORF DECOMPOSITION');
  console.log('━'.repeat(60));
  const examples = [42, 100, 255, 1000];
  examples.forEach(n => {
    const zeck = mf.zeckendorf(n);
    console.log(zeck.representation);
    console.log(`  → z(${n}) = ${zeck.summandCount}, ℓ(${n}) = ${zeck.lucasSummandCount}`);
  });
  console.log();

  // 4. BEHREND-KIMBERLING DIVERGENCE
  console.log('4️⃣  BEHREND-KIMBERLING DIVERGENCE S(n)');
  console.log('━'.repeat(60));
  const analysis = mf.analyzeBKTheorem(100);
  console.log(`Theorem verified: ${analysis.theoremVerified ? '✓' : '✗'}`);
  console.log(`Nash equilibria found: ${analysis.nashEquilibria.length}`);
  console.log(`Sample Nash points:`, analysis.nashEquilibria.slice(0, 5).map(p => p.n).join(', '));
  console.log();

  // 5. NASH EQUILIBRIUM DETECTION
  console.log('5️⃣  NASH EQUILIBRIUM DETECTION');
  console.log('━'.repeat(60));
  const nashPoints = mf.findNashPoints(100);
  console.log(`Nash points in [0, 100]: ${nashPoints.length} found`);
  console.log('First 10:', nashPoints.slice(0, 10).join(', '));
  console.log();

  // Verify Nash property
  const n = 10;
  const s_n = mf.divergence(n);
  console.log(`Verification at n=${n}:`);
  console.log(`  S(${n}) = ${s_n}`);
  console.log(`  Is Nash: ${Math.abs(s_n) < 1e-10 ? '✓' : '✗'}`);
  console.log();

  // 6. PHASE SPACE COORDINATES
  console.log('6️⃣  PHASE SPACE COORDINATES');
  console.log('━'.repeat(60));
  const phasePoints = [10, 25, 50, 100];
  phasePoints.forEach(n => {
    const coords = mf.phaseSpace(n);
    console.log(`n=${n}:`);
    console.log(`  φ(${n}) = ${coords.phi.toFixed(6)}`);
    console.log(`  ψ(${n}) = ${coords.psi.toFixed(6)}`);
    console.log(`  θ(${n}) = ${coords.theta.toFixed(6)} rad (${(coords.theta * 180 / Math.PI).toFixed(2)}°)`);
    console.log(`  |r| = ${coords.magnitude.toFixed(6)}`);
  });
  console.log();

  // 7. PHASE SPACE TRAJECTORY
  console.log('7️⃣  PHASE SPACE TRAJECTORY');
  console.log('━'.repeat(60));
  const trajectory = mf.phaseTrajectory(1, 50, 10);
  console.log(`Generated ${trajectory.length} trajectory points`);
  if (trajectory.length > 0) {
    console.log('Sample points:');
    trajectory.slice(0, 5).forEach(point => {
      if (point && typeof point.n !== 'undefined') {
        console.log(`  n=${point.n}: (${point.phi?.toFixed(3) || 0}, ${point.psi?.toFixed(3) || 0})`);
      }
    });
  }
  console.log();

  // 8. NEURAL NETWORK TRAINING
  console.log('8️⃣  NEURAL NETWORK TRAINING');
  console.log('━'.repeat(60));
  console.log('Creating Q-Network with Nash convergence...');

  const nn = mf.createNeuralNetwork({
    layers: [3, 8, 3],
    learningRate: 0.01,
    lambda: 0.1,
    maxIterations: 100,
    nashThreshold: 1e-6
  });

  // Simple game state (rock-paper-scissors)
  const gameState = {
    state: [0.5, 0.3, 0.2],  // Strategy distribution
    nextState: [0.4, 0.4, 0.2]
  };

  console.log('Training network...');
  const result = await mf.train(gameState, {
    verbose: false
  });

  console.log(`Training complete:`);
  console.log(`  Final loss: ${result.finalLoss.toFixed(6)}`);
  console.log(`  Iterations: ${result.iterations}`);
  console.log(`  Converged to Nash: ${result.convergedToNash ? '✓' : '✗'}`);
  console.log(`  Final S(n): ${result.finalS_n.toExponential(4)}`);
  console.log(`  Lyapunov stable: ${result.lyapunovStable ? '✓' : '✗'}`);
  console.log();

  // 9. COMPLETE PROFILE
  console.log('9️⃣  COMPLETE MATHEMATICAL PROFILE');
  console.log('━'.repeat(60));
  const profile = mf.computeProfile(20);
  console.log(`Profile computed for range [0, ${profile.range}]:`);
  console.log(`  Fibonacci values: ${profile.fibonacci.length}`);
  console.log(`  Lucas values: ${profile.lucas.length}`);
  console.log(`  Divergence values: ${profile.divergence.length}`);
  console.log(`  Phase space coords: ${profile.phaseSpace.length}`);
  console.log(`  Nash points: ${profile.nashPoints.length}`);
  console.log();

  // 10. VERIFICATION
  console.log('🔟  MATHEMATICAL VERIFICATION');
  console.log('━'.repeat(60));
  const verification = mf.verify(50);
  console.log('Verification results for [0, 50]:');
  console.log(`  B-K Theorem verified: ${verification.bkTheoremVerified ? '✓' : '✗'}`);
  console.log(`  Nash points consistent: ${verification.nashPointsConsistent ? '✓' : '✗'}`);
  console.log(`  Zeckendorf valid: ${verification.zeckendorfValid ? '✓' : '✗'}`);

  if (verification.violations.length > 0) {
    console.log(`  Violations found: ${verification.violations.length}`);
    verification.violations.slice(0, 3).forEach(v => console.log(`    - ${v}`));
  }
  console.log();

  // 11. DATA EXPORT
  console.log('1️⃣1️⃣  DATA EXPORT FOR VISUALIZATION');
  console.log('━'.repeat(60));
  const exportData = mf.exportVisualizationData(10);
  const data = JSON.parse(exportData);
  console.log(`Export metadata:`);
  console.log(`  Range: ${data.meta.range}`);
  console.log(`  Generated: ${data.meta.generatedAt}`);
  console.log(`  Data points: ${data.data.fibonacci.length}`);
  console.log();

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║                  Demo Complete! ✓                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
}

// Run demo
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

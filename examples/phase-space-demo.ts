/**
 * Phase Space Coordinate System - Demonstration
 * Shows usage of Level 6 mathematical framework
 */

import {
  calculateCoordinates,
  generateTrajectory,
  findNashPoints,
  createPattern,
  analyzePhaseSpace,
  ZETA_ZEROS
} from '../src/math-framework/phase-space/coordinates';

import {
  generatePhasePlotSVG,
  generatePhasePortraitSVG,
  generateInteractiveHTML,
  exportVisualizationData
} from '../src/math-framework/phase-space/visualization';

import {
  createPhaseSpaceStorage
} from '../src/math-framework/phase-space/storage';

import * as fs from 'fs';
import * as path from 'path';

/**
 * Demo 1: Basic coordinate calculation
 */
async function demo1_BasicCoordinates() {
  console.log('=== Demo 1: Basic Phase Space Coordinates ===\n');

  for (let n = 10; n <= 100; n += 10) {
    const coords = calculateCoordinates(n, 50);

    console.log(`n = ${n}:`);
    console.log(`  φ(n) = ${coords.phi.toFixed(6)}`);
    console.log(`  ψ(n) = ${coords.psi.toFixed(6)}`);
    console.log(`  θ(n) = ${coords.theta.toFixed(6)} rad (${(coords.theta * 180 / Math.PI).toFixed(2)}°)`);
    console.log(`  r(n) = ${coords.magnitude.toFixed(6)}`);
    console.log(`  Nash: ${coords.isNashPoint ? 'YES' : 'NO'}`);
    console.log();
  }
}

/**
 * Demo 2: Generate and visualize trajectory
 */
async function demo2_Trajectory() {
  console.log('=== Demo 2: Phase Space Trajectory ===\n');

  const nMin = 1;
  const nMax = 200;
  const step = 0.5;

  console.log(`Generating trajectory from n=${nMin} to n=${nMax}...`);
  const trajectory = generateTrajectory(nMin, nMax, step, 50);
  console.log(`Generated ${trajectory.length} points\n`);

  // Find Nash points
  console.log('Searching for Nash points...');
  const nashPoints = findNashPoints(nMin, nMax, 0.1);
  console.log(`Found ${nashPoints.length} Nash points:\n`);

  nashPoints.forEach((np, i) => {
    console.log(`  ${i + 1}. n = ${np.n.toFixed(2)}, flow: ${np.surroundingFlow}, stability: ${np.stabilityIndex.toFixed(4)}`);
  });
  console.log();

  // Generate SVG visualizations
  const outputDir = path.join(__dirname, '../docs/phase-space');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('Generating visualizations...');

  // Phase plot
  const phasePlot = generatePhasePlotSVG(trajectory, nashPoints, {
    colorScheme: 'viridis',
    highlightNashPoints: true,
    resolution: 800
  });
  fs.writeFileSync(path.join(outputDir, 'phase-plot.svg'), phasePlot);
  console.log('  ✓ Phase plot saved to docs/phase-space/phase-plot.svg');

  // Phase portrait
  const phasePortrait = generatePhasePortraitSVG(trajectory, {
    colorScheme: 'plasma',
    showVectorField: true,
    resolution: 800
  });
  fs.writeFileSync(path.join(outputDir, 'phase-portrait.svg'), phasePortrait);
  console.log('  ✓ Phase portrait saved to docs/phase-space/phase-portrait.svg');

  // Interactive HTML
  const interactiveHTML = generateInteractiveHTML(trajectory, nashPoints);
  fs.writeFileSync(path.join(outputDir, 'interactive.html'), interactiveHTML);
  console.log('  ✓ Interactive visualization saved to docs/phase-space/interactive.html');
  console.log();

  // Export data
  const vizData = exportVisualizationData(trajectory, nashPoints);
  fs.writeFileSync(
    path.join(outputDir, 'visualization-data.json'),
    JSON.stringify(vizData, null, 2)
  );
  console.log('  ✓ Visualization data saved to docs/phase-space/visualization-data.json\n');
}

/**
 * Demo 3: Pattern analysis and storage
 */
async function demo3_PatternAnalysis() {
  console.log('=== Demo 3: Pattern Analysis and Storage ===\n');

  // Generate multiple patterns
  const patterns = [
    { nMin: 1, nMax: 50, step: 0.5, maxZeros: 30 },
    { nMin: 50, nMax: 100, step: 0.5, maxZeros: 50 },
    { nMin: 100, nMax: 150, step: 0.5, maxZeros: 70 }
  ];

  const storage = createPhaseSpaceStorage({
    dbPath: './data/phase-space-demo.agentdb'
  });

  await storage.initialize();
  console.log('AgentDB storage initialized\n');

  for (const config of patterns) {
    console.log(`Analyzing pattern: n=${config.nMin}-${config.nMax}`);

    const trajectory = generateTrajectory(
      config.nMin,
      config.nMax,
      config.step,
      config.maxZeros
    );

    const nashPoints = findNashPoints(config.nMin, config.nMax, 0.2);

    const pattern = createPattern(trajectory, nashPoints);

    console.log(`  Chaos indicator: ${pattern.characteristics.chaosIndicator.toFixed(4)}`);
    console.log(`  Lyapunov exponent: ${pattern.characteristics.lyapunovExponent.toFixed(4)}`);
    console.log(`  Convergence rate: ${pattern.characteristics.convergenceRate.toFixed(6)}`);
    console.log(`  Periodicity: ${pattern.characteristics.periodicity || 'None'}`);
    console.log(`  Nash points: ${pattern.nashPoints.length}`);

    // Store pattern
    await storage.storePattern(pattern);
    console.log(`  ✓ Pattern stored with ID: ${pattern.id}\n`);
  }

  // Query statistics
  const stats = await storage.getStatistics();
  console.log('=== Storage Statistics ===');
  console.log(`  Total patterns: ${stats.totalPatterns}`);
  console.log(`  Average chaos: ${stats.avgChaos.toFixed(4)}`);
  console.log(`  Average convergence: ${stats.avgConvergence.toFixed(6)}`);
  console.log(`  Periodic patterns: ${stats.periodicPatterns}`);
  console.log(`  Total Nash points: ${stats.nashPointsTotal}\n`);

  await storage.close();
}

/**
 * Demo 4: Phase space analysis
 */
async function demo4_PhaseSpaceAnalysis() {
  console.log('=== Demo 4: Phase Space Analysis ===\n');

  const trajectory = generateTrajectory(1, 150, 0.5, 60);
  const analysis = analyzePhaseSpace(trajectory);

  console.log('Phase Space Characteristics:');
  console.log(`  Dimensionality: ${analysis.dimensionality}`);
  console.log(`  Entropy: ${analysis.entropy.toFixed(4)}`);
  console.log(`  Attractors found: ${analysis.attractors.length}`);
  console.log(`  Repellers found: ${analysis.repellers.length}`);
  console.log(`  Saddle points found: ${analysis.saddlePoints.length}`);
  console.log();

  if (analysis.attractors.length > 0) {
    console.log('Attractor details:');
    analysis.attractors.forEach((attr, i) => {
      console.log(`  ${i + 1}. n=${attr.n.toFixed(2)}, φ=${attr.phi.toFixed(4)}, ψ=${attr.psi.toFixed(4)}`);
    });
    console.log();
  }

  if (analysis.repellers.length > 0) {
    console.log('Repeller details:');
    analysis.repellers.forEach((rep, i) => {
      console.log(`  ${i + 1}. n=${rep.n.toFixed(2)}, φ=${rep.phi.toFixed(4)}, ψ=${rep.psi.toFixed(4)}`);
    });
    console.log();
  }
}

/**
 * Demo 5: Riemann zeros exploration
 */
async function demo5_ZetaZeros() {
  console.log('=== Demo 5: Riemann Zeta Zeros ===\n');

  console.log(`Total zeros available: ${ZETA_ZEROS.length}\n`);
  console.log('First 10 zeros (imaginary parts on critical line):');

  ZETA_ZEROS.slice(0, 10).forEach((zero, i) => {
    console.log(`  ρ${i + 1} = 1/2 + ${zero.toFixed(6)}i`);
  });
  console.log();

  // Show how different numbers of zeros affect the calculation
  console.log('Effect of zero count on φ(50):');
  for (let maxZeros = 10; maxZeros <= 100; maxZeros += 10) {
    const coords = calculateCoordinates(50, maxZeros);
    console.log(`  ${maxZeros} zeros: φ = ${coords.phi.toFixed(6)}, ψ = ${coords.psi.toFixed(6)}`);
  }
  console.log();
}

/**
 * Run all demos
 */
async function runAllDemos() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   Phase Space Coordinate System - Demo Suite  ║');
  console.log('║   Level 6: Advanced Mathematical Framework    ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  try {
    await demo1_BasicCoordinates();
    await demo2_Trajectory();
    await demo3_PatternAnalysis();
    await demo4_PhaseSpaceAnalysis();
    await demo5_ZetaZeros();

    console.log('╔════════════════════════════════════════════════╗');
    console.log('║   All demos completed successfully!           ║');
    console.log('╚════════════════════════════════════════════════╝');
  } catch (error) {
    console.error('Demo failed:', error);
    process.exit(1);
  }
}

// Run demos if this file is executed directly
if (require.main === module) {
  runAllDemos();
}

export {
  demo1_BasicCoordinates,
  demo2_Trajectory,
  demo3_PatternAnalysis,
  demo4_PhaseSpaceAnalysis,
  demo5_ZetaZeros,
  runAllDemos
};

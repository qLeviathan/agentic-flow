#!/usr/bin/env node

/**
 * Math Framework CLI
 * Command-line interface for mathematical framework operations
 *
 * Usage:
 *   math-framework fib 100
 *   math-framework lucas 50
 *   math-framework zeck 42
 *   math-framework divergence 10
 *   math-framework nash 100
 *   math-framework phase 50 --plot
 *   math-framework train --game rock-paper-scissors --steps 1000
 *   math-framework repl
 */

import { Command } from 'commander';
import { MathFramework } from '../api/framework';

const program = new Command();
const mf = new MathFramework();

// Configure CLI
program
  .name('math-framework')
  .description('Mathematical Framework CLI - Fibonacci, Lucas, Nash, Neural Networks')
  .version('2.0.0');

/**
 * Fibonacci command
 */
program
  .command('fib <n>')
  .alias('fibonacci')
  .description('Compute Fibonacci number F(n)')
  .option('-v, --verbose', 'Show computation details')
  .action((n: string, options) => {
    try {
      const index = parseInt(n, 10);
      if (isNaN(index) || index < 0) {
        console.error('Error: n must be a non-negative integer');
        process.exit(1);
      }

      if (options.verbose) {
        console.log(`Computing Fibonacci number F(${index})...`);
      }

      const result = mf.fibonacci(index);

      if (options.verbose) {
        console.log(`F(${index}) = ${result}`);
        console.log(`Digits: ${result.toString().length}`);
      } else {
        console.log(result.toString());
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

/**
 * Lucas command
 */
program
  .command('lucas <n>')
  .description('Compute Lucas number L(n)')
  .option('-v, --verbose', 'Show computation details')
  .action((n: string, options) => {
    try {
      const index = parseInt(n, 10);
      if (isNaN(index) || index < 0) {
        console.error('Error: n must be a non-negative integer');
        process.exit(1);
      }

      if (options.verbose) {
        console.log(`Computing Lucas number L(${index})...`);
      }

      const result = mf.lucas(index);

      if (options.verbose) {
        console.log(`L(${index}) = ${result}`);
      } else {
        console.log(result);
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

/**
 * Zeckendorf decomposition command
 */
program
  .command('zeck <n>')
  .alias('zeckendorf')
  .description('Zeckendorf decomposition - decompose n into non-consecutive Fibonacci numbers')
  .option('-v, --verbose', 'Show detailed decomposition')
  .action((n: string, options) => {
    try {
      const num = parseInt(n, 10);
      if (isNaN(num) || num < 1) {
        console.error('Error: n must be a positive integer');
        process.exit(1);
      }

      const result = mf.zeckendorf(num);

      console.log(result.representation);

      if (options.verbose) {
        console.log(`\nDetails:`);
        console.log(`  Summand count z(${num}): ${result.summandCount}`);
        console.log(`  Lucas summand count ℓ(${num}): ${result.lucasSummandCount}`);
        console.log(`  Fibonacci indices: {${Array.from(result.indices).join(', ')}}`);
        console.log(`  Values: [${result.values.join(', ')}]`);
        console.log(`  Valid: ${result.isValid ? '✓' : '✗'}`);
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

/**
 * Divergence (B-K) command
 */
program
  .command('divergence <n>')
  .alias('bk')
  .description('Compute Behrend-Kimberling divergence S(n) = V(n) - U(n)')
  .option('-v, --verbose', 'Show detailed analysis')
  .option('-r, --range <max>', 'Analyze range [0, max]')
  .action((n: string, options) => {
    try {
      const index = parseInt(n, 10);
      if (isNaN(index) || index < 0) {
        console.error('Error: n must be a non-negative integer');
        process.exit(1);
      }

      if (options.range) {
        const maxRange = parseInt(options.range, 10);
        const analysis = mf.analyzeBKTheorem(maxRange);

        console.log(`B-K Divergence Analysis [0, ${maxRange}]`);
        console.log(`Theorem verified: ${analysis.theoremVerified ? '✓' : '✗'}`);
        console.log(`Nash equilibria found: ${analysis.nashEquilibria.length}`);

        if (options.verbose && analysis.nashEquilibria.length > 0) {
          console.log(`\nNash Equilibrium Points:`);
          analysis.nashEquilibria.slice(0, 10).forEach(point => {
            console.log(`  n=${point.n}: S(${point.n})=${point.S}, n+1=${point.n + 1} is Lucas number`);
          });

          if (analysis.nashEquilibria.length > 10) {
            console.log(`  ... and ${analysis.nashEquilibria.length - 10} more`);
          }
        }
      } else {
        const s_n = mf.divergence(index);
        const isNash = Math.abs(s_n) < 1e-10;

        console.log(`S(${index}) = ${s_n}`);

        if (isNash) {
          console.log(`→ Nash equilibrium at n=${index}`);
          console.log(`→ ${index + 1} = L(m) is a Lucas number`);
        }
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

/**
 * Nash equilibrium command
 */
program
  .command('nash <n>')
  .description('Find all Nash equilibrium points up to n where S(n) = 0')
  .option('-v, --verbose', 'Show detailed information')
  .action((n: string, options) => {
    try {
      const maxN = parseInt(n, 10);
      if (isNaN(maxN) || maxN < 0) {
        console.error('Error: n must be a non-negative integer');
        process.exit(1);
      }

      const nashPoints = mf.findNashPoints(maxN);

      console.log(`Nash Equilibrium Points in [0, ${maxN}]:`);
      console.log(`Found ${nashPoints.length} points\n`);

      if (options.verbose) {
        nashPoints.forEach(n => {
          const s_n = mf.divergence(n);
          const lucas = mf.lucas(n + 1);
          console.log(`  n=${n}: S(${n})=${s_n.toExponential(4)}, n+1=${n + 1}=L(m)`);
        });
      } else {
        console.log(nashPoints.join(', '));
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

/**
 * Phase space command
 */
program
  .command('phase <n>')
  .description('Compute phase space coordinates φ(n), ψ(n), θ(n)')
  .option('-v, --verbose', 'Show detailed coordinates')
  .option('-t, --trajectory <end>', 'Generate trajectory from n to end')
  .option('--plot', 'Generate plot data (JSON)')
  .action((n: string, options) => {
    try {
      const start = parseInt(n, 10);
      if (isNaN(start) || start < 0) {
        console.error('Error: n must be a non-negative integer');
        process.exit(1);
      }

      if (options.trajectory) {
        const end = parseInt(options.trajectory, 10);
        const trajectory = mf.phaseTrajectory(start, end);

        if (options.plot) {
          console.log(JSON.stringify(trajectory, null, 2));
        } else {
          console.log(`Phase Space Trajectory [${start}, ${end}]:`);
          console.log(`Points: ${trajectory.length}\n`);

          if (options.verbose) {
            trajectory.slice(0, 10).forEach(point => {
              console.log(`  n=${point.n}: φ=${point.phi.toFixed(6)}, ψ=${point.psi.toFixed(6)}, θ=${point.theta.toFixed(6)}`);
            });
            if (trajectory.length > 10) {
              console.log(`  ... and ${trajectory.length - 10} more points`);
            }
          }
        }
      } else {
        const coords = mf.phaseSpace(start);

        if (options.plot) {
          console.log(JSON.stringify(coords, null, 2));
        } else {
          console.log(`Phase Space Coordinates at n=${start}:`);
          console.log(`  φ(${start}) = ${coords.phi}`);
          console.log(`  ψ(${start}) = ${coords.psi}`);
          console.log(`  θ(${start}) = ${coords.theta} rad (${(coords.theta * 180 / Math.PI).toFixed(2)}°)`);
          console.log(`  |r| = ${coords.magnitude}`);
        }
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

/**
 * Neural network training command
 */
program
  .command('train')
  .description('Train neural network with Nash equilibrium convergence')
  .option('--game <type>', 'Game type (rock-paper-scissors, tic-tac-toe)', 'rock-paper-scissors')
  .option('--steps <n>', 'Maximum training steps', '1000')
  .option('--lr <rate>', 'Learning rate', '0.01')
  .option('--lambda <value>', 'Regularization parameter', '0.1')
  .option('-v, --verbose', 'Show training progress')
  .action(async (options) => {
    try {
      console.log(`Training neural network for ${options.game}...`);
      console.log(`Max steps: ${options.steps}`);
      console.log(`Learning rate: ${options.lr}`);
      console.log(`Lambda: ${options.lambda}\n`);

      // Create simple game state (for demo)
      const stateSize = options.game === 'rock-paper-scissors' ? 3 : 9;
      const gameState = {
        state: Array(stateSize).fill(0).map(() => Math.random()),
        nextState: Array(stateSize).fill(0).map(() => Math.random())
      };

      // Create neural network
      const nn = mf.createNeuralNetwork({
        layers: [stateSize, 8, stateSize],
        learningRate: parseFloat(options.lr),
        lambda: parseFloat(options.lambda),
        maxIterations: parseInt(options.steps, 10)
      });

      // Train
      const result = await mf.train(gameState, {
        verbose: options.verbose,
        callback: options.verbose
          ? (iter, loss, S_n) => {
              if (iter % 100 === 0) {
                console.log(`Iteration ${iter}: Loss=${loss.toFixed(6)}, S(n)=${S_n.toExponential(4)}`);
              }
            }
          : undefined
      });

      console.log('\n=== Training Complete ===');
      console.log(`Final loss: ${result.finalLoss.toFixed(6)}`);
      console.log(`Iterations: ${result.iterations}`);
      console.log(`Converged to Nash: ${result.convergedToNash ? '✓' : '✗'}`);
      console.log(`Final S(n): ${result.finalS_n.toExponential(4)}`);
      console.log(`Lyapunov stable: ${result.lyapunovStable ? '✓' : '✗'}`);
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

/**
 * REPL command
 */
program
  .command('repl')
  .description('Start interactive REPL')
  .action(async () => {
    try {
      // Dynamic import to avoid loading REPL unless needed
      const { startREPL } = await import('../api/repl');
      await startREPL();
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

/**
 * Verify command - check mathematical properties
 */
program
  .command('verify <n>')
  .description('Verify mathematical properties and consistency')
  .action((n: string) => {
    try {
      const maxN = parseInt(n, 10);
      if (isNaN(maxN) || maxN < 0) {
        console.error('Error: n must be a non-negative integer');
        process.exit(1);
      }

      console.log(`Verifying mathematical properties for range [0, ${maxN}]...\n`);

      const results = mf.verify(maxN);

      console.log('=== Verification Results ===');
      console.log(`B-K Theorem: ${results.bkTheoremVerified ? '✓ PASSED' : '✗ FAILED'}`);
      console.log(`Nash Points Consistent: ${results.nashPointsConsistent ? '✓ PASSED' : '✗ FAILED'}`);
      console.log(`Zeckendorf Valid: ${results.zeckendorfValid ? '✓ PASSED' : '✗ FAILED'}`);

      if (results.violations.length > 0) {
        console.log(`\nViolations found: ${results.violations.length}`);
        results.violations.forEach(v => console.log(`  - ${v}`));
      } else {
        console.log('\n✓ All checks passed!');
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

/**
 * Export command - generate visualization data
 */
program
  .command('export <n>')
  .description('Export data for visualization')
  .option('-o, --output <file>', 'Output file (default: stdout)')
  .action((n: string, options) => {
    try {
      const maxN = parseInt(n, 10);
      if (isNaN(maxN) || maxN < 0) {
        console.error('Error: n must be a non-negative integer');
        process.exit(1);
      }

      const data = mf.exportVisualizationData(maxN);

      if (options.output) {
        const fs = require('fs');
        fs.writeFileSync(options.output, data);
        console.log(`Data exported to ${options.output}`);
      } else {
        console.log(data);
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

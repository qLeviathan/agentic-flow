/**
 * Nash Equilibrium Solver - Example Usage
 *
 * Demonstrates how to use the Nash solver with AgentDB integration
 * for various game-theoretic scenarios.
 */

import {
  createGameTheorySolver,
  Game,
  defaultCostFunctions
} from '../../agentic-flow/src/math-framework/game-theory';

/**
 * Example 1: Prisoner's Dilemma
 */
async function prisonersDilemmaExample() {
  console.log('\n=== Prisoner\'s Dilemma ===\n');

  const { solver, memory } = await createGameTheorySolver({
    dbPath: './examples-nash.db',
    enableBKAnalysis: true
  });

  const game: Game = {
    id: 'prisoners-dilemma',
    name: 'Prisoner\'s Dilemma',
    description: 'Classic 2-player simultaneous game',
    players: [
      {
        id: 0,
        name: 'Prisoner 1',
        actions: ['cooperate', 'defect'],
        utilityFunction: (profile) => {
          const p1 = profile[0].action;
          const p2 = profile[1].action;

          if (p1 === 'cooperate' && p2 === 'cooperate') return -1; // Both cooperate: 1 year each
          if (p1 === 'cooperate' && p2 === 'defect') return -3;    // Sucker's payoff: 3 years
          if (p1 === 'defect' && p2 === 'cooperate') return 0;     // Temptation: go free
          return -2;                                                 // Both defect: 2 years each
        }
      },
      {
        id: 1,
        name: 'Prisoner 2',
        actions: ['cooperate', 'defect'],
        utilityFunction: (profile) => {
          const p1 = profile[0].action;
          const p2 = profile[1].action;

          if (p1 === 'cooperate' && p2 === 'cooperate') return -1;
          if (p1 === 'defect' && p2 === 'cooperate') return -3;
          if (p1 === 'cooperate' && p2 === 'defect') return 0;
          return -2;
        }
      }
    ],
    costFunctions: defaultCostFunctions
  };

  // Store game definition
  await memory.storeGame(game);

  // Find all pure Nash equilibria
  const equilibria = await solver.findPureNashEquilibria(game);

  console.log(`Found ${equilibria.length} Nash equilibrium:`);
  for (const eq of equilibria) {
    console.log(`\nEquilibrium: ${eq.id}`);
    console.log(`  Profile: ${JSON.stringify(eq.profile)}`);
    console.log(`  Payoffs: [${eq.payoffs.join(', ')}]`);
    console.log(`  Verified: ${eq.verified}`);
    console.log(`  Strict: ${eq.isStrict}`);
    console.log(`  Stability: ${eq.stability.toFixed(4)}`);
    console.log(`  BK Divergence: ${eq.bkDivergence.toFixed(6)}`);

    // Compute BK analysis
    const profile = eq.profile as any[];
    const bkAnalysis = solver.computeBKDivergence(game, profile);

    console.log(`\n  BK Analysis:`);
    console.log(`    S(n) = ${bkAnalysis.score.toFixed(6)}`);
    console.log(`    Is Equilibrium: ${bkAnalysis.isEquilibrium}`);
    console.log(`    Components:`);
    console.log(`      Utility: ${bkAnalysis.components.utilityComponent.toFixed(4)}`);
    console.log(`      Distance: ${bkAnalysis.components.distanceComponent.toFixed(4)}`);
    console.log(`      Penalty: ${bkAnalysis.components.penaltyComponent.toFixed(4)}`);

    // Store in AgentDB
    await memory.storeEquilibrium(game.id, eq, bkAnalysis, {
      algorithm: 'pure-enumeration',
      computeTime: eq.metadata?.convergenceTime || 0,
      spaceExplored: 4 // 2x2 game
    });
  }

  // Build and display game tensor
  console.log('\nGame Tensor:');
  const tensor = solver.buildGameTensor(game);
  console.log(`  Dimensions: [${tensor.dimensions.join(' x ')}]`);
  console.log(`  Elements: ${tensor.elements.size}`);
  console.log(`  Normalization: ${tensor.normalizationFactor.toFixed(6)}`);

  console.log('\n  Tensor Values:');
  for (const [key, elem] of tensor.elements) {
    console.log(`    [${key}]: ${elem.value.toFixed(6)} (U_sum=${elem.utilitySum}, d_sum=${elem.distanceSum}, S(n)=${elem.bkScore.toFixed(6)})`);
  }

  await memory.close();
}

/**
 * Example 2: Rock-Paper-Scissors (Mixed Strategy)
 */
async function rockPaperScissorsExample() {
  console.log('\n=== Rock-Paper-Scissors ===\n');

  const { solver, memory } = await createGameTheorySolver({
    enableBKAnalysis: true,
    maxIterations: 10000
  });

  const game: Game = {
    id: 'rock-paper-scissors',
    name: 'Rock-Paper-Scissors',
    description: 'Zero-sum game requiring mixed strategies',
    players: [
      {
        id: 0,
        name: 'Player 1',
        actions: ['rock', 'paper', 'scissors'],
        utilityFunction: (profile) => {
          const p1 = profile[0].action;
          const p2 = profile[1].action;

          if (p1 === p2) return 0; // Tie
          if (p1 === 'rock' && p2 === 'scissors') return 1;
          if (p1 === 'paper' && p2 === 'rock') return 1;
          if (p1 === 'scissors' && p2 === 'paper') return 1;
          return -1;
        }
      },
      {
        id: 1,
        name: 'Player 2',
        actions: ['rock', 'paper', 'scissors'],
        utilityFunction: (profile) => {
          const p1 = profile[0].action;
          const p2 = profile[1].action;

          if (p1 === p2) return 0;
          if (p2 === 'rock' && p1 === 'scissors') return 1;
          if (p2 === 'paper' && p1 === 'rock') return 1;
          if (p2 === 'scissors' && p1 === 'paper') return 1;
          return -1;
        }
      }
    ],
    costFunctions: defaultCostFunctions
  };

  // Check for pure Nash equilibria (should be none)
  const pureEquilibria = await solver.findPureNashEquilibria(game);
  console.log(`Pure Nash Equilibria: ${pureEquilibria.length}`);

  // Find mixed Nash equilibria
  console.log('\nSearching for mixed Nash equilibria...');
  const mixedEquilibria = await solver.findMixedNashEquilibria(game);

  console.log(`\nFound ${mixedEquilibria.length} mixed equilibrium:`);
  for (const eq of mixedEquilibria) {
    console.log(`\nEquilibrium: ${eq.id}`);
    console.log(`  Type: ${eq.type}`);
    console.log(`  Expected Payoffs: [${eq.payoffs.map(p => p.toFixed(4)).join(', ')}]`);
    console.log(`  Stability: ${eq.stability.toFixed(4)}`);

    if (eq.type === 'mixed') {
      const profile = eq.profile as any[];
      console.log('\n  Mixed Strategies:');
      for (const mixed of profile) {
        console.log(`    Player ${mixed.playerId}:`);
        for (const [action, prob] of mixed.distribution) {
          console.log(`      ${action}: ${(prob * 100).toFixed(2)}%`);
        }
      }
    }
  }

  await memory.close();
}

/**
 * Example 3: Battle of the Sexes (Multiple Equilibria)
 */
async function battleOfSexesExample() {
  console.log('\n=== Battle of the Sexes ===\n');

  const { solver, memory } = await createGameTheorySolver({
    dbPath: './examples-nash.db'
  });

  const game: Game = {
    id: 'battle-of-sexes',
    name: 'Battle of the Sexes',
    description: 'Coordination game with payoff asymmetry',
    players: [
      {
        id: 0,
        name: 'Person A',
        actions: ['opera', 'football'],
        utilityFunction: (profile) => {
          const a = profile[0].action;
          const b = profile[1].action;

          if (a === 'opera' && b === 'opera') return 3;
          if (a === 'football' && b === 'football') return 2;
          return 0; // Miscoordination
        }
      },
      {
        id: 1,
        name: 'Person B',
        actions: ['opera', 'football'],
        utilityFunction: (profile) => {
          const a = profile[0].action;
          const b = profile[1].action;

          if (a === 'opera' && b === 'opera') return 2;
          if (a === 'football' && b === 'football') return 3;
          return 0;
        }
      }
    ],
    costFunctions: defaultCostFunctions
  };

  const equilibria = await solver.findPureNashEquilibria(game);

  console.log(`Found ${equilibria.length} pure Nash equilibria:\n`);
  for (const eq of equilibria) {
    const profile = eq.profile as any[];
    console.log(`Equilibrium ${equilibria.indexOf(eq) + 1}:`);
    console.log(`  Outcome: (${profile[0].action}, ${profile[1].action})`);
    console.log(`  Payoffs: Person A gets ${eq.payoffs[0]}, Person B gets ${eq.payoffs[1]}`);
    console.log(`  Social Welfare: ${eq.payoffs.reduce((a, b) => a + b, 0)}`);
    console.log(`  Stability: ${eq.stability.toFixed(4)}`);
    console.log();
  }

  // Query stored equilibria
  const stats = await memory.getGameStats(game.id);
  console.log('Database Statistics:');
  console.log(`  Total Equilibria: ${stats.totalEquilibria}`);
  console.log(`  Pure: ${stats.pureCount}, Mixed: ${stats.mixedCount}`);
  console.log(`  Average Stability: ${stats.avgStability.toFixed(4)}`);
  console.log(`  Strict Equilibria: ${stats.strictCount}`);

  await memory.close();
}

/**
 * Example 4: Query and Analyze Stored Equilibria
 */
async function queryExample() {
  console.log('\n=== Querying Stored Equilibria ===\n');

  const { memory } = await createGameTheorySolver({
    dbPath: './examples-nash.db'
  });

  // Query high-stability equilibria
  const stableEquilibria = await memory.queryEquilibria({
    minStability: 0.9,
    verified: true,
    limit: 10
  });

  console.log(`Found ${stableEquilibria.length} high-stability equilibria:\n`);
  for (const entry of stableEquilibria) {
    console.log(`Game: ${entry.gameId}`);
    console.log(`  Equilibrium ID: ${entry.equilibrium.id}`);
    console.log(`  Stability: ${entry.equilibrium.stability.toFixed(4)}`);
    console.log(`  BK Score S(n): ${entry.bkAnalysis.score.toFixed(6)}`);
    console.log(`  Algorithm: ${entry.searchMetadata.algorithm}`);
    console.log(`  Compute Time: ${entry.searchMetadata.computeTime}ms`);
    console.log();
  }

  await memory.close();
}

/**
 * Main execution
 */
async function main() {
  try {
    await prisonersDilemmaExample();
    await rockPaperScissorsExample();
    await battleOfSexesExample();
    await queryExample();

    console.log('\n✅ All examples completed successfully!\n');
  } catch (error) {
    console.error('Error running examples:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export {
  prisonersDilemmaExample,
  rockPaperScissorsExample,
  battleOfSexesExample,
  queryExample
};

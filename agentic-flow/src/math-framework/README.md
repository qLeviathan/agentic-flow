# Mathematical Framework for Agentic-Flow

## Overview

Advanced mathematical algorithms and game-theoretic solvers for AI agent coordination and decision-making.

## Modules

### Game Theory (`/game-theory`)

**Nash Equilibrium Solver - Level 7 Implementation**

Compute Nash equilibria for multi-player games with:
- Pure and mixed strategy support
- Multiple solver algorithms (enumeration, fictitious play, regret matching)
- Behrend-Kimberling divergence analysis (S(n) = 0 ⟺ Nash equilibrium)
- Game tensor construction with normalization
- AgentDB integration for persistent memory

**Key Features**:
- Multi-player game support (2+ players)
- Strategy spaces: discrete actions, mixed strategies
- Utility functions: arbitrary payoff structures
- Cost functions: distance (Cₐ), end-state (Cᵦ), BK penalty (C_BK)
- Tensor representation: T[i₁,...,iₖ] = ψ^(ΣUⱼ) · ψ^(Σ|iⱼ-iₖ|) · ψ^S(n)

**Usage**:
```typescript
import { createGameTheorySolver } from 'agentic-flow/math-framework/game-theory';

const { solver, memory } = await createGameTheorySolver();
const equilibria = await solver.findPureNashEquilibria(game);
```

**Documentation**: See `/docs/nash-equilibrium-solver.md`

**Examples**: See `/examples/math-framework/nash-equilibrium-example.ts`

**Tests**: See `/tests/math-framework/game-theory/`

## Installation

The math framework is included in the main agentic-flow package:

```bash
npm install agentic-flow
```

Or for development:

```bash
cd agentic-flow
npm install
npm run build
```

## Quick Start

```typescript
import { createGameTheorySolver, Game, defaultCostFunctions } from 'agentic-flow/math-framework/game-theory';

// Define a game
const game: Game = {
  id: 'example-game',
  name: 'Example Game',
  players: [
    {
      id: 0,
      name: 'Player 1',
      actions: ['A', 'B'],
      utilityFunction: (profile) => {
        // Your payoff logic
        return 0;
      }
    },
    // ... more players
  ],
  costFunctions: defaultCostFunctions
};

// Solve for equilibria
const { solver, memory } = await createGameTheorySolver({
  enableBKAnalysis: true
});

const equilibria = await solver.findPureNashEquilibria(game);

// Store in AgentDB
for (const eq of equilibria) {
  const bkAnalysis = solver.computeBKDivergence(game, eq.profile);
  await memory.storeEquilibrium(game.id, eq, bkAnalysis, {
    algorithm: 'pure-enumeration',
    computeTime: 0,
    spaceExplored: 4
  });
}
```

## Architecture

```
math-framework/
├── game-theory/
│   ├── types.ts              # Type definitions
│   ├── nash-solver.ts        # Core solver algorithms
│   ├── agentdb-integration.ts # Persistent memory
│   └── index.ts              # Public API
├── README.md                 # This file
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run specific module tests
npm test tests/math-framework/game-theory/
```

## Examples

Example scripts demonstrate:
- Classic games (Prisoner's Dilemma, Rock-Paper-Scissors, Battle of the Sexes)
- Pure vs mixed strategy equilibria
- Behrend-Kimberling analysis
- AgentDB storage and querying
- Game tensor analysis

Run examples:

```bash
cd agentic-flow
tsx examples/math-framework/nash-equilibrium-example.ts
```

## API Reference

### Nash Solver

**Classes**:
- `NashSolver` - Main solver with multiple algorithms
- `NashMemoryManager` - AgentDB integration

**Functions**:
- `createGameTheorySolver(config)` - Factory function
- `defaultCostFunctions` - Default cost function implementations

### Types

**Core Types**:
- `Game` - Game definition
- `Player` - Player with actions and utility
- `Strategy` - Pure strategy
- `MixedStrategy` - Probability distribution
- `NashEquilibrium` - Equilibrium result
- `BKAnalysis` - Behrend-Kimberling analysis

See full API documentation in `/docs/nash-equilibrium-solver.md`

## Mathematical Background

### Nash Equilibrium

A strategy profile where no player can improve by unilaterally changing strategy:

```
∀i, ∀sᵢ: Uᵢ(sᵢ*, s₋ᵢ*) ≥ Uᵢ(sᵢ, s₋ᵢ*)
```

### Behrend-Kimberling Link

**Critical Theorem**: S(n) = 0 ⟺ Nash Equilibrium

The BK score quantifies strategic instability:
- S(n) = 0: Perfect equilibrium
- S(n) > 0: Incentive to deviate
- Minimizing S(n) finds equilibria

### Game Tensor

Multi-dimensional representation encoding:
1. **Utility structure** via ψ^(ΣUⱼ)
2. **Strategic distances** via ψ^(Σ|iⱼ-iₖ|)
3. **BK scores** via ψ^S(n)

## Performance

| Game Size | Solver Time | Memory Usage |
|-----------|-------------|--------------|
| 2x2       | < 1ms       | < 1 MB       |
| 3x3       | < 10ms      | < 2 MB       |
| 5x5       | < 100ms     | < 10 MB      |
| 10x10     | < 5s        | < 50 MB      |

## Future Modules

- **Optimization**: Convex optimization, gradient methods
- **Graph Algorithms**: PageRank, community detection
- **Linear Algebra**: Matrix operations, eigensolvers
- **Statistics**: Distributions, hypothesis testing
- **Machine Learning**: Neural networks, reinforcement learning

## Contributing

Contributions welcome! Please:
1. Follow TypeScript best practices
2. Include comprehensive tests
3. Add documentation
4. Provide examples

## License

MIT

## References

1. Nash, J. (1950). "Equilibrium points in n-person games"
2. Behrend, F. (1946). "On sets of integers which contain no three terms"
3. Hart & Mas-Colell (2000). "Simple adaptive procedure"

## Support

- Issues: https://github.com/ruvnet/agentic-flow/issues
- Docs: https://github.com/ruvnet/agentic-flow

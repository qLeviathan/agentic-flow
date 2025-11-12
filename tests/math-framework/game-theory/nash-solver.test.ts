/**
 * Nash Solver Tests
 *
 * Comprehensive test suite for Nash equilibrium solver
 */

import { NashSolver, defaultCostFunctions } from '../../../agentic-flow/src/math-framework/game-theory/nash-solver';
import { Game, Player } from '../../../agentic-flow/src/math-framework/game-theory/types';

describe('NashSolver', () => {
  let solver: NashSolver;

  beforeEach(() => {
    solver = new NashSolver({
      maxIterations: 1000,
      epsilon: 1e-6,
      enableBKAnalysis: true
    });
  });

  describe('Prisoner\'s Dilemma', () => {
    const game: Game = {
      id: 'prisoners-dilemma',
      name: 'Prisoner\'s Dilemma',
      description: 'Classic 2-player game',
      players: [
        {
          id: 0,
          name: 'Player 1',
          actions: ['cooperate', 'defect'],
          utilityFunction: (profile) => {
            const p1Action = profile[0].action;
            const p2Action = profile[1].action;

            if (p1Action === 'cooperate' && p2Action === 'cooperate') return -1;
            if (p1Action === 'cooperate' && p2Action === 'defect') return -3;
            if (p1Action === 'defect' && p2Action === 'cooperate') return 0;
            return -2; // both defect
          }
        },
        {
          id: 1,
          name: 'Player 2',
          actions: ['cooperate', 'defect'],
          utilityFunction: (profile) => {
            const p1Action = profile[0].action;
            const p2Action = profile[1].action;

            if (p1Action === 'cooperate' && p2Action === 'cooperate') return -1;
            if (p1Action === 'defect' && p2Action === 'cooperate') return -3;
            if (p1Action === 'cooperate' && p2Action === 'defect') return 0;
            return -2; // both defect
          }
        }
      ],
      costFunctions: defaultCostFunctions
    };

    it('should find pure Nash equilibrium (defect, defect)', async () => {
      const equilibria = await solver.findPureNashEquilibria(game);

      expect(equilibria).toHaveLength(1);
      expect(equilibria[0].verified).toBe(true);
      expect(equilibria[0].type).toBe('pure');

      const profile = equilibria[0].profile as any[];
      expect(profile[0].action).toBe('defect');
      expect(profile[1].action).toBe('defect');

      expect(equilibria[0].payoffs).toEqual([-2, -2]);
    });

    it('should verify Nash equilibrium condition', () => {
      const profile = [
        { id: '0_defect', playerId: 0, action: 'defect' },
        { id: '1_defect', playerId: 1, action: 'defect' }
      ];

      const verification = solver.verifyNashEquilibrium(game, profile);

      expect(verification.isNash).toBe(true);
      expect(verification.violations).toHaveLength(0);
      expect(verification.stability).toBeCloseTo(1.0);
    });

    it('should compute Behrend-Kimberling divergence', () => {
      const profile = [
        { id: '0_defect', playerId: 0, action: 'defect' },
        { id: '1_defect', playerId: 1, action: 'defect' }
      ];

      const bkAnalysis = solver.computeBKDivergence(game, profile);

      expect(bkAnalysis.score).toBeDefined();
      expect(bkAnalysis.isEquilibrium).toBe(true);
      expect(bkAnalysis.divergence).toBeLessThan(1e-5);
    });
  });

  describe('Matching Pennies', () => {
    const game: Game = {
      id: 'matching-pennies',
      name: 'Matching Pennies',
      description: 'Zero-sum game with no pure Nash equilibrium',
      players: [
        {
          id: 0,
          name: 'Player 1',
          actions: ['heads', 'tails'],
          utilityFunction: (profile) => {
            const match = profile[0].action === profile[1].action;
            return match ? 1 : -1;
          }
        },
        {
          id: 1,
          name: 'Player 2',
          actions: ['heads', 'tails'],
          utilityFunction: (profile) => {
            const match = profile[0].action === profile[1].action;
            return match ? -1 : 1;
          }
        }
      ],
      costFunctions: defaultCostFunctions
    };

    it('should find no pure Nash equilibria', async () => {
      const equilibria = await solver.findPureNashEquilibria(game);
      expect(equilibria).toHaveLength(0);
    });

    it('should find mixed Nash equilibrium', async () => {
      const equilibria = await solver.findMixedNashEquilibria(game);

      expect(equilibria.length).toBeGreaterThan(0);
      expect(equilibria[0].type).toBe('mixed');
    });
  });

  describe('Battle of the Sexes', () => {
    const game: Game = {
      id: 'battle-of-sexes',
      name: 'Battle of the Sexes',
      description: 'Coordination game with multiple equilibria',
      players: [
        {
          id: 0,
          name: 'Player 1',
          actions: ['opera', 'football'],
          utilityFunction: (profile) => {
            const p1 = profile[0].action;
            const p2 = profile[1].action;

            if (p1 === 'opera' && p2 === 'opera') return 2;
            if (p1 === 'football' && p2 === 'football') return 1;
            return 0;
          }
        },
        {
          id: 1,
          name: 'Player 2',
          actions: ['opera', 'football'],
          utilityFunction: (profile) => {
            const p1 = profile[0].action;
            const p2 = profile[1].action;

            if (p1 === 'opera' && p2 === 'opera') return 1;
            if (p1 === 'football' && p2 === 'football') return 2;
            return 0;
          }
        }
      ],
      costFunctions: defaultCostFunctions
    };

    it('should find multiple pure Nash equilibria', async () => {
      const equilibria = await solver.findPureNashEquilibria(game);

      expect(equilibria).toHaveLength(2);
      expect(equilibria.every(eq => eq.verified)).toBe(true);

      // Check that both coordination outcomes are equilibria
      const profiles = equilibria.map(eq => eq.profile as any[]);
      const hasOperaEquilibrium = profiles.some(
        p => p[0].action === 'opera' && p[1].action === 'opera'
      );
      const hasFootballEquilibrium = profiles.some(
        p => p[0].action === 'football' && p[1].action === 'football'
      );

      expect(hasOperaEquilibrium).toBe(true);
      expect(hasFootballEquilibrium).toBe(true);
    });
  });

  describe('Game Tensor Construction', () => {
    const simpleGame: Game = {
      id: 'simple-2x2',
      name: 'Simple 2x2 Game',
      players: [
        {
          id: 0,
          name: 'P1',
          actions: [0, 1],
          utilityFunction: (profile) => profile[0].action as number
        },
        {
          id: 1,
          name: 'P2',
          actions: [0, 1],
          utilityFunction: (profile) => profile[1].action as number
        }
      ],
      costFunctions: defaultCostFunctions
    };

    it('should build game tensor with correct dimensions', () => {
      const tensor = solver.buildGameTensor(simpleGame);

      expect(tensor.dimensions).toEqual([2, 2]);
      expect(tensor.elements.size).toBe(4); // 2x2 = 4 elements
      expect(tensor.normalizationFactor).toBeGreaterThan(0);
    });

    it('should compute tensor elements correctly', () => {
      const tensor = solver.buildGameTensor(simpleGame);

      // Check specific element
      const elem = tensor.elements.get('0,0');
      expect(elem).toBeDefined();
      expect(elem!.indices).toEqual([0, 0]);
      expect(elem!.value).toBeDefined();
      expect(elem!.utilitySum).toBeDefined();
      expect(elem!.distanceSum).toBe(0); // Same action index
    });
  });

  describe('Best Response Computation', () => {
    const game: Game = {
      id: 'test-game',
      name: 'Test Game',
      players: [
        {
          id: 0,
          name: 'P1',
          actions: [0, 1, 2],
          utilityFunction: (profile) => {
            const p1Action = profile[0].action as number;
            const p2Action = profile[1].action as number;
            return p1Action + p2Action;
          }
        },
        {
          id: 1,
          name: 'P2',
          actions: [0, 1, 2],
          utilityFunction: (profile) => {
            const p1Action = profile[0].action as number;
            const p2Action = profile[1].action as number;
            return p1Action * p2Action;
          }
        }
      ],
      costFunctions: defaultCostFunctions
    };

    it('should compute best response correctly', () => {
      const profile = [
        { id: '0_1', playerId: 0, action: 1 },
        { id: '1_1', playerId: 1, action: 1 }
      ];

      const bestResponse = solver.computeBestResponse(game, game.players[0], profile);

      expect(bestResponse.playerId).toBe(0);
      expect(bestResponse.bestAction).toBe(2); // Maximizes p1Action + p2Action
      expect(bestResponse.maxUtility).toBeGreaterThanOrEqual(bestResponse.alternativeActions[0].utility);
    });

    it('should compute regrets for all actions', () => {
      const profile = [
        { id: '0_0', playerId: 0, action: 0 },
        { id: '1_2', playerId: 1, action: 2 }
      ];

      const bestResponse = solver.computeBestResponse(game, game.players[0], profile);

      expect(bestResponse.alternativeActions).toHaveLength(3);
      expect(bestResponse.alternativeActions.every(a => a.regret >= 0)).toBe(true);

      // Best action should have zero regret
      const bestAlt = bestResponse.alternativeActions.find(
        a => a.action === bestResponse.bestAction
      );
      expect(bestAlt!.regret).toBeCloseTo(0);
    });
  });
});

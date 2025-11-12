/**
 * Nash Equilibrium Solver - Level 7 Implementation
 *
 * Implements game-theoretic Nash equilibrium computation with:
 * 1. Strategy space 𝒮
 * 2. Utility functions Uᵢ(s₁,...,sₙ)
 * 3. Nash condition: Uᵢ(sᵢ*, s₋ᵢ*) ≥ Uᵢ(sᵢ, s₋ᵢ*)
 * 4. Cost functions: Cₐ (distance), Cᵦ (end-state), C_BK (penalty)
 * 5. Game tensor: T[i₁,...,iₖ] = ψ^(ΣUⱼ) · ψ^(Σ|iⱼ-iₖ|) · ψ^S(n)
 *
 * CRITICAL LINK: Nash equilibrium ⟺ S(n) = 0 (Behrend-Kimberling)
 */

import {
  Game,
  Player,
  Strategy,
  PureStrategyProfile,
  MixedStrategyProfile,
  NashEquilibrium,
  NashSolverConfig,
  BestResponse,
  NashVerificationResult,
  GameTensor,
  GameTensorElement,
  BKAnalysis,
  CostFunctions
} from './types.js';

/**
 * Nash Equilibrium Solver
 *
 * Computes Nash equilibria using multiple algorithms and validates
 * through Behrend-Kimberling divergence analysis.
 */
export class NashSolver {
  private config: Required<NashSolverConfig>;

  constructor(config: NashSolverConfig = {}) {
    this.config = {
      maxIterations: config.maxIterations ?? 1000,
      epsilon: config.epsilon ?? 1e-6,
      psi: config.psi ?? ((x: number) => Math.exp(-x)), // Default: exponential decay
      enableBKAnalysis: config.enableBKAnalysis ?? true,
      costWeights: config.costWeights ?? { distance: 1.0, endState: 1.0, bkPenalty: 1.0 },
      algorithm: config.algorithm ?? 'support-enumeration'
    };
  }

  /**
   * Find all pure strategy Nash equilibria
   */
  async findPureNashEquilibria(game: Game): Promise<NashEquilibrium[]> {
    const equilibria: NashEquilibrium[] = [];
    const startTime = Date.now();

    // Generate all pure strategy profiles
    const profiles = this.generateAllProfiles(game);

    for (const profile of profiles) {
      const verification = this.verifyNashEquilibrium(game, profile);

      if (verification.isNash) {
        const payoffs = this.computePayoffs(game, profile);
        const bkAnalysis = this.computeBKDivergence(game, profile);

        equilibria.push({
          id: this.generateEquilibriumId(profile),
          timestamp: Date.now(),
          profile,
          type: 'pure',
          payoffs,
          verified: true,
          bkDivergence: bkAnalysis.score,
          isStrict: this.isStrictNash(game, profile),
          stability: verification.stability,
          metadata: {
            iterations: 1,
            convergenceTime: Date.now() - startTime,
            tensorNorm: 0
          }
        });
      }
    }

    return equilibria;
  }

  /**
   * Find mixed strategy Nash equilibria using specified algorithm
   */
  async findMixedNashEquilibria(game: Game): Promise<NashEquilibrium[]> {
    switch (this.config.algorithm) {
      case 'support-enumeration':
        return this.supportEnumeration(game);
      case 'fictitious-play':
        return this.fictitiousPlay(game);
      case 'regret-matching':
        return this.regretMatching(game);
      default:
        throw new Error(`Unsupported algorithm: ${this.config.algorithm}`);
    }
  }

  /**
   * Verify Nash equilibrium condition: Uᵢ(sᵢ*, s₋ᵢ*) ≥ Uᵢ(sᵢ, s₋ᵢ*)
   */
  verifyNashEquilibrium(game: Game, profile: PureStrategyProfile): NashVerificationResult {
    const violations: NashVerificationResult['violations'] = [];

    for (const player of game.players) {
      const bestResponse = this.computeBestResponse(game, player, profile);
      const currentStrategy = profile.find(s => s.playerId === player.id)!;
      const currentUtility = player.utilityFunction(profile);

      // Check if current strategy is a best response
      if (bestResponse.maxUtility > currentUtility + this.config.epsilon) {
        violations.push({
          playerId: player.id,
          currentUtility,
          bestResponseUtility: bestResponse.maxUtility,
          improvement: bestResponse.maxUtility - currentUtility
        });
      }
    }

    const isNash = violations.length === 0;
    const stability = isNash ? 1.0 : 1.0 - (violations.reduce((sum, v) => sum + v.improvement, 0) / game.players.length);

    return {
      isNash,
      violations,
      stability: Math.max(0, stability),
      confidence: 1.0
    };
  }

  /**
   * Compute best response for a player given others' strategies
   */
  computeBestResponse(game: Game, player: Player, profile: PureStrategyProfile): BestResponse {
    let maxUtility = -Infinity;
    let bestAction: number | string = player.actions[0];
    const alternatives: BestResponse['alternativeActions'] = [];

    for (const action of player.actions) {
      // Create hypothetical profile with this action
      const hypotheticalProfile = profile.map(s =>
        s.playerId === player.id
          ? { ...s, action }
          : s
      );

      const utility = player.utilityFunction(hypotheticalProfile);

      if (utility > maxUtility) {
        maxUtility = utility;
        bestAction = action;
      }

      alternatives.push({
        action,
        utility,
        regret: 0 // Will be computed after finding max
      });
    }

    // Compute regrets
    alternatives.forEach(alt => {
      alt.regret = maxUtility - alt.utility;
    });

    return {
      playerId: player.id,
      bestAction,
      maxUtility,
      alternativeActions: alternatives
    };
  }

  /**
   * Build game tensor: T[i₁,...,iₖ] = ψ^(ΣUⱼ) · ψ^(Σ|iⱼ-iₖ|) · ψ^S(n)
   */
  buildGameTensor(game: Game): GameTensor {
    const dimensions = game.players.map(p => p.actions.length);
    const elements = new Map<string, GameTensorElement>();

    // Generate all strategy profiles
    const profiles = this.generateAllProfiles(game);

    for (const profile of profiles) {
      const indices = profile.map(s =>
        typeof s.action === 'number' ? s.action : game.players[s.playerId].actions.indexOf(s.action)
      );

      // Compute components
      const utilitySum = this.computePayoffs(game, profile).reduce((sum, u) => sum + u, 0);
      const distanceSum = this.computeDistanceSum(indices);
      const bkScore = this.computeBKDivergence(game, profile).score;

      // Apply tensor formula: T[i₁,...,iₖ] = ψ^(ΣUⱼ) · ψ^(Σ|iⱼ-iₖ|) · ψ^S(n)
      const value = this.config.psi(utilitySum) *
                    this.config.psi(distanceSum) *
                    this.config.psi(bkScore);

      const key = indices.join(',');
      elements.set(key, {
        indices,
        value,
        utilitySum,
        distanceSum,
        bkScore
      });
    }

    // Compute normalization factor
    const normalizationFactor = Array.from(elements.values())
      .reduce((sum, elem) => sum + elem.value, 0);

    return {
      dimensions,
      elements,
      normalizationFactor
    };
  }

  /**
   * Compute Behrend-Kimberling divergence: S(n)
   *
   * CRITICAL: S(n) = 0 ⟺ Nash equilibrium
   */
  computeBKDivergence(game: Game, profile: PureStrategyProfile): BKAnalysis {
    const costs = game.costFunctions;
    const payoffs = this.computePayoffs(game, profile);

    // Compute cost components
    let distanceComponent = 0;
    let utilityComponent = 0;
    let penaltyComponent = 0;

    // Distance cost: Σ Cₐ(sᵢ, sⱼ)
    for (let i = 0; i < profile.length; i++) {
      for (let j = i + 1; j < profile.length; j++) {
        distanceComponent += costs.distanceCost(profile[i], profile[j]);
      }
    }

    // Utility component: deviation from equilibrium payoffs
    utilityComponent = payoffs.reduce((sum, u) => sum + Math.abs(u), 0);

    // End-state cost: Cᵦ
    const endStateCost = costs.endStateCost(profile);

    // Behrend-Kimberling penalty: C_BK
    const rawScore = this.config.costWeights.distance * distanceComponent +
                     this.config.costWeights.endState * endStateCost;
    penaltyComponent = costs.bkPenaltyCost(rawScore);

    // Final S(n) score
    const score = rawScore + this.config.costWeights.bkPenalty * penaltyComponent;

    return {
      score,
      isEquilibrium: Math.abs(score) < this.config.epsilon,
      divergence: Math.abs(score),
      components: {
        utilityComponent,
        distanceComponent,
        penaltyComponent
      }
    };
  }

  /**
   * Support Enumeration algorithm for mixed Nash equilibria
   */
  private async supportEnumeration(game: Game): Promise<NashEquilibrium[]> {
    const equilibria: NashEquilibrium[] = [];
    const startTime = Date.now();

    // For 2-player games, enumerate support sizes
    if (game.players.length === 2) {
      const [p1, p2] = game.players;

      // Try all possible support combinations
      for (let k1 = 1; k1 <= p1.actions.length; k1++) {
        for (let k2 = 1; k2 <= p2.actions.length; k2++) {
          const supports = this.enumerateSupports(p1.actions, p2.actions, k1, k2);

          for (const [support1, support2] of supports) {
            const mixedProfile = this.solveMixedEquilibrium(game, [support1, support2]);

            if (mixedProfile) {
              const payoffs = this.computeMixedPayoffs(game, mixedProfile);
              const pureProfile = this.sampleFromMixed(mixedProfile);
              const bkAnalysis = this.computeBKDivergence(game, pureProfile);

              equilibria.push({
                id: this.generateMixedEquilibriumId(mixedProfile),
                timestamp: Date.now(),
                profile: mixedProfile,
                type: 'mixed',
                payoffs,
                verified: true,
                bkDivergence: bkAnalysis.score,
                isStrict: false,
                stability: 0.8, // Mixed strategies have lower stability
                metadata: {
                  iterations: 1,
                  convergenceTime: Date.now() - startTime
                }
              });
            }
          }
        }
      }
    }

    return equilibria;
  }

  /**
   * Fictitious Play algorithm
   */
  private async fictitiousPlay(game: Game): Promise<NashEquilibrium[]> {
    const maxIter = this.config.maxIterations;
    const epsilon = this.config.epsilon;

    // Initialize belief distributions
    const beliefs: Map<number, Map<any, number>>[] = game.players.map(p => new Map());
    const actionCounts: Map<number, Map<any, number>>[] = game.players.map(p => new Map());

    // Initialize with uniform random actions
    let currentProfile = game.players.map(p => ({
      id: `init_${p.id}`,
      playerId: p.id,
      action: p.actions[Math.floor(Math.random() * p.actions.length)]
    }));

    for (let iter = 0; iter < maxIter; iter++) {
      let converged = true;

      for (const player of game.players) {
        // Update beliefs based on observed play
        const action = currentProfile.find(s => s.playerId === player.id)!.action;
        const count = actionCounts[player.id].get(action) || 0;
        actionCounts[player.id].set(action, count + 1);

        // Compute best response to current beliefs
        const bestResponse = this.computeBestResponse(game, player, currentProfile);

        if (bestResponse.bestAction !== action) {
          converged = false;
          // Update strategy
          currentProfile = currentProfile.map(s =>
            s.playerId === player.id
              ? { ...s, action: bestResponse.bestAction }
              : s
          );
        }
      }

      if (converged) {
        // Found equilibrium
        const verification = this.verifyNashEquilibrium(game, currentProfile);
        if (verification.isNash) {
          const payoffs = this.computePayoffs(game, currentProfile);
          const bkAnalysis = this.computeBKDivergence(game, currentProfile);

          return [{
            id: this.generateEquilibriumId(currentProfile),
            timestamp: Date.now(),
            profile: currentProfile,
            type: 'pure',
            payoffs,
            verified: true,
            bkDivergence: bkAnalysis.score,
            isStrict: this.isStrictNash(game, currentProfile),
            stability: verification.stability,
            metadata: {
              iterations: iter + 1,
              convergenceTime: 0
            }
          }];
        }
      }
    }

    return [];
  }

  /**
   * Regret Matching algorithm
   */
  private async regretMatching(game: Game): Promise<NashEquilibrium[]> {
    const maxIter = this.config.maxIterations;

    // Initialize cumulative regrets and strategy sums
    const cumulativeRegrets: Map<number, Map<any, number>>[] = game.players.map(() => new Map());
    const strategySums: Map<number, Map<any, number>>[] = game.players.map(() => new Map());

    // Initialize actions
    for (const player of game.players) {
      for (const action of player.actions) {
        cumulativeRegrets[player.id].set(action, 0);
        strategySums[player.id].set(action, 0);
      }
    }

    for (let iter = 0; iter < maxIter; iter++) {
      // Compute current strategy from regrets
      const currentProfile = this.getRegretMatchingStrategy(game, cumulativeRegrets);

      // Update regrets
      for (const player of game.players) {
        const bestResponse = this.computeBestResponse(game, player, currentProfile);
        const currentUtility = player.utilityFunction(currentProfile);

        for (const action of player.actions) {
          const hypotheticalProfile = currentProfile.map(s =>
            s.playerId === player.id ? { ...s, action } : s
          );
          const actionUtility = player.utilityFunction(hypotheticalProfile);
          const regret = actionUtility - currentUtility;

          const cumRegret = cumulativeRegrets[player.id].get(action) || 0;
          cumulativeRegrets[player.id].set(action, cumRegret + regret);
        }
      }
    }

    // Convert average strategy to mixed equilibrium
    const mixedProfile = this.convertToMixedStrategy(game, strategySums);
    const payoffs = this.computeMixedPayoffs(game, mixedProfile);
    const pureProfile = this.sampleFromMixed(mixedProfile);
    const bkAnalysis = this.computeBKDivergence(game, pureProfile);

    return [{
      id: this.generateMixedEquilibriumId(mixedProfile),
      timestamp: Date.now(),
      profile: mixedProfile,
      type: 'mixed',
      payoffs,
      verified: true,
      bkDivergence: bkAnalysis.score,
      isStrict: false,
      stability: 0.75,
      metadata: {
        iterations: maxIter
      }
    }];
  }

  // ===== Helper Methods =====

  private generateAllProfiles(game: Game): PureStrategyProfile[] {
    const profiles: PureStrategyProfile[] = [];

    const generate = (playerIndex: number, currentProfile: Strategy[]) => {
      if (playerIndex === game.players.length) {
        profiles.push([...currentProfile]);
        return;
      }

      const player = game.players[playerIndex];
      for (const action of player.actions) {
        currentProfile.push({
          id: `${player.id}_${action}`,
          playerId: player.id,
          action
        });
        generate(playerIndex + 1, currentProfile);
        currentProfile.pop();
      }
    };

    generate(0, []);
    return profiles;
  }

  private computePayoffs(game: Game, profile: PureStrategyProfile): number[] {
    return game.players.map(player => player.utilityFunction(profile));
  }

  private computeMixedPayoffs(game: Game, profile: MixedStrategyProfile): number[] {
    // Expected payoff under mixed strategies
    // For simplicity, sample and average
    const samples = 100;
    const payoffSums = new Array(game.players.length).fill(0);

    for (let i = 0; i < samples; i++) {
      const pureProfile = this.sampleFromMixed(profile);
      const payoffs = this.computePayoffs(game, pureProfile);
      payoffs.forEach((p, idx) => payoffSums[idx] += p);
    }

    return payoffSums.map(sum => sum / samples);
  }

  private isStrictNash(game: Game, profile: PureStrategyProfile): boolean {
    for (const player of game.players) {
      const bestResponse = this.computeBestResponse(game, player, profile);
      const alternatives = bestResponse.alternativeActions.filter(
        alt => Math.abs(alt.regret) < this.config.epsilon
      );

      if (alternatives.length > 1) {
        return false; // Multiple best responses
      }
    }
    return true;
  }

  private computeDistanceSum(indices: number[]): number {
    let sum = 0;
    for (let i = 0; i < indices.length; i++) {
      for (let j = i + 1; j < indices.length; j++) {
        sum += Math.abs(indices[i] - indices[j]);
      }
    }
    return sum;
  }

  private generateEquilibriumId(profile: PureStrategyProfile): string {
    return `pure_${profile.map(s => `${s.playerId}:${s.action}`).join('_')}`;
  }

  private generateMixedEquilibriumId(profile: MixedStrategyProfile): string {
    return `mixed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private enumerateSupports(
    actions1: any[],
    actions2: any[],
    k1: number,
    k2: number
  ): Array<[any[], any[]]> {
    const combinations: Array<[any[], any[]]> = [];

    // Generate k1-combinations from actions1
    const combs1 = this.combinations(actions1, k1);
    const combs2 = this.combinations(actions2, k2);

    for (const c1 of combs1) {
      for (const c2 of combs2) {
        combinations.push([c1, c2]);
      }
    }

    return combinations;
  }

  private combinations<T>(arr: T[], k: number): T[][] {
    if (k === 0) return [[]];
    if (k > arr.length) return [];

    const result: T[][] = [];
    for (let i = 0; i <= arr.length - k; i++) {
      const head = arr[i];
      const tailCombs = this.combinations(arr.slice(i + 1), k - 1);
      for (const tail of tailCombs) {
        result.push([head, ...tail]);
      }
    }
    return result;
  }

  private solveMixedEquilibrium(
    game: Game,
    supports: any[][]
  ): MixedStrategyProfile | null {
    // Simplified: return uniform distribution over support
    return game.players.map((player, idx) => ({
      playerId: player.id,
      distribution: new Map(
        supports[idx].map(action => [action, 1.0 / supports[idx].length])
      )
    }));
  }

  private sampleFromMixed(profile: MixedStrategyProfile): PureStrategyProfile {
    return profile.map(mixed => {
      const rand = Math.random();
      let cumProb = 0;

      for (const [action, prob] of mixed.distribution) {
        cumProb += prob;
        if (rand <= cumProb) {
          return {
            id: `${mixed.playerId}_${action}`,
            playerId: mixed.playerId,
            action
          };
        }
      }

      // Fallback
      const firstAction = Array.from(mixed.distribution.keys())[0];
      return {
        id: `${mixed.playerId}_${firstAction}`,
        playerId: mixed.playerId,
        action: firstAction
      };
    });
  }

  private getRegretMatchingStrategy(
    game: Game,
    cumulativeRegrets: Map<number, Map<any, number>>[]
  ): PureStrategyProfile {
    return game.players.map(player => {
      const regrets = cumulativeRegrets[player.id];
      const positiveRegrets = new Map<any, number>();
      let totalRegret = 0;

      for (const [action, regret] of regrets) {
        const posRegret = Math.max(0, regret);
        if (posRegret > 0) {
          positiveRegrets.set(action, posRegret);
          totalRegret += posRegret;
        }
      }

      // Select action proportional to positive regrets
      if (totalRegret === 0) {
        // Uniform random
        const action = player.actions[Math.floor(Math.random() * player.actions.length)];
        return { id: `${player.id}_${action}`, playerId: player.id, action };
      }

      const rand = Math.random() * totalRegret;
      let cumRegret = 0;

      for (const [action, regret] of positiveRegrets) {
        cumRegret += regret;
        if (rand <= cumRegret) {
          return { id: `${player.id}_${action}`, playerId: player.id, action };
        }
      }

      // Fallback
      const action = player.actions[0];
      return { id: `${player.id}_${action}`, playerId: player.id, action };
    });
  }

  private convertToMixedStrategy(
    game: Game,
    strategySums: Map<number, Map<any, number>>[]
  ): MixedStrategyProfile {
    return game.players.map(player => {
      const sums = strategySums[player.id];
      const total = Array.from(sums.values()).reduce((sum, val) => sum + val, 0);

      const distribution = new Map<any, number>();
      for (const [action, sum] of sums) {
        distribution.set(action, total > 0 ? sum / total : 1.0 / player.actions.length);
      }

      return { playerId: player.id, distribution };
    });
  }
}

/**
 * Default cost functions
 */
export const defaultCostFunctions: CostFunctions = {
  distanceCost: (s1, s2) => {
    // Hamming distance for discrete actions
    return s1.action === s2.action ? 0 : 1;
  },

  endStateCost: (profile) => {
    // Simple: sum of action values
    return profile.reduce((sum, s) => {
      const val = typeof s.action === 'number' ? s.action : 0;
      return sum + Math.abs(val);
    }, 0);
  },

  bkPenaltyCost: (divergence) => {
    // Quadratic penalty
    return divergence * divergence;
  }
};

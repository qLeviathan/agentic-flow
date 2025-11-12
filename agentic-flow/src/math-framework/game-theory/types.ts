/**
 * Game Theory Nash Equilibrium Solver - Type Definitions
 *
 * Mathematical framework for computing Nash equilibria in multi-player games
 * with support for Behrend-Kimberling divergence analysis.
 */

/**
 * Strategy representation in the strategy space 𝒮
 */
export interface Strategy {
  id: string;
  playerId: number;
  action: number | string;
  probability?: number; // For mixed strategies
  metadata?: Record<string, any>;
}

/**
 * Pure strategy profile: one action per player
 */
export type PureStrategyProfile = Strategy[];

/**
 * Mixed strategy: probability distribution over actions
 */
export interface MixedStrategy {
  playerId: number;
  distribution: Map<number | string, number>; // action -> probability
}

/**
 * Mixed strategy profile: one mixed strategy per player
 */
export type MixedStrategyProfile = MixedStrategy[];

/**
 * Utility function: Uᵢ(s₁,...,sₙ) → ℝ
 * Maps strategy profiles to payoffs for player i
 */
export type UtilityFunction = (profile: PureStrategyProfile) => number;

/**
 * Player definition with utility function
 */
export interface Player {
  id: number;
  name: string;
  actions: (number | string)[]; // Available actions
  utilityFunction: UtilityFunction;
}

/**
 * Cost function types for game analysis
 */
export interface CostFunctions {
  /** Cₐ: Distance cost between strategies */
  distanceCost: (s1: Strategy, s2: Strategy) => number;

  /** Cᵦ: End-state cost for terminal positions */
  endStateCost: (profile: PureStrategyProfile) => number;

  /** C_BK: Behrend-Kimberling penalty cost */
  bkPenaltyCost: (divergence: number) => number;
}

/**
 * Game tensor element: T[i₁,...,iₖ]
 * Represents multi-dimensional game state
 */
export interface GameTensorElement {
  indices: number[]; // [i₁, i₂, ..., iₖ]
  value: number; // Tensor value at this position
  utilitySum: number; // Σ Uⱼ
  distanceSum: number; // Σ |iⱼ - iₖ|
  bkScore: number; // S(n) Behrend-Kimberling score
}

/**
 * Game tensor: multi-dimensional representation
 */
export interface GameTensor {
  dimensions: number[]; // Size of each dimension
  elements: Map<string, GameTensorElement>; // Sparse tensor storage
  normalizationFactor: number; // ψ normalization
}

/**
 * Nash equilibrium result
 */
export interface NashEquilibrium {
  id: string;
  timestamp: number;
  profile: PureStrategyProfile | MixedStrategyProfile;
  type: 'pure' | 'mixed';
  payoffs: number[]; // Payoff for each player
  verified: boolean;
  bkDivergence: number; // S(n) score
  isStrict: boolean; // Strict Nash (unique best response)
  stability: number; // Stability measure [0, 1]
  metadata?: {
    iterations?: number;
    convergenceTime?: number;
    tensorNorm?: number;
  };
}

/**
 * Nash solver configuration
 */
export interface NashSolverConfig {
  /** Maximum iterations for iterative algorithms */
  maxIterations?: number;

  /** Convergence tolerance */
  epsilon?: number;

  /** Tensor normalization function ψ */
  psi?: (x: number) => number;

  /** Enable Behrend-Kimberling analysis */
  enableBKAnalysis?: boolean;

  /** Cost function weights */
  costWeights?: {
    distance: number;
    endState: number;
    bkPenalty: number;
  };

  /** Solver algorithm */
  algorithm?: 'support-enumeration' | 'lemke-howson' | 'fictitious-play' | 'regret-matching';
}

/**
 * Game definition
 */
export interface Game {
  id: string;
  name: string;
  description?: string;
  players: Player[];
  costFunctions: CostFunctions;
  metadata?: Record<string, any>;
}

/**
 * Best response result for a player
 */
export interface BestResponse {
  playerId: number;
  bestAction: number | string;
  maxUtility: number;
  alternativeActions: Array<{
    action: number | string;
    utility: number;
    regret: number; // Difference from max
  }>;
}

/**
 * Verification result for Nash equilibrium
 */
export interface NashVerificationResult {
  isNash: boolean;
  violations: Array<{
    playerId: number;
    currentUtility: number;
    bestResponseUtility: number;
    improvement: number;
  }>;
  stability: number; // Overall stability score
  confidence: number; // Confidence in verification
}

/**
 * Behrend-Kimberling divergence analysis
 */
export interface BKAnalysis {
  score: number; // S(n) value
  isEquilibrium: boolean; // S(n) = 0 ⟺ Nash equilibrium
  divergence: number; // Measure of non-equilibrium
  components: {
    utilityComponent: number;
    distanceComponent: number;
    penaltyComponent: number;
  };
}

/**
 * AgentDB memory entry for Nash equilibria
 */
export interface NashMemoryEntry {
  gameId: string;
  equilibrium: NashEquilibrium;
  bkAnalysis: BKAnalysis;
  searchMetadata: {
    algorithm: string;
    computeTime: number;
    spaceExplored: number;
  };
}

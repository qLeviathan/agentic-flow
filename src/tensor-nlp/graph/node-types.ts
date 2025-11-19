/**
 * Graph Node Type Definitions
 * For tensor-based NLP graph construction
 */

import { TensorCoordinate, TensorElement } from '../core/tensor-core';
import { SymbolicNumber } from '../core/symbolic-arithmetic';

export type NodeState = 'LATENT' | 'ACTIVE' | 'SATURATED' | 'CONDENSED';
export type WaveType = 'FIBONACCI' | 'LUCAS' | 'DUAL';
export type PhaseRegime = 'QUANTUM' | 'INTERMEDIATE' | 'CLASSICAL' | 'SATURATED';

/**
 * Base graph node
 */
export interface GraphNode {
  id: string;
  coord: TensorCoordinate;
  value: SymbolicNumber;
  state: NodeState;
  waveType: WaveType;

  // Metadata
  createdAt: number;        // Time step when spawned
  activatedAt: number | null;  // Time step when activated
  depth: number;            // Distance from origin
  generation: number;       // Propagation generation

  // Relationships
  parent: string | null;    // Parent node ID
  children: string[];       // Child node IDs
  neighbors: string[];      // Adjacent nodes in lattice

  // Physics
  phase: number;            // Phase angle (0 or 1, representing 0 or π)
  parity: number;           // Phase parity (-1)^n
  isNash: boolean;          // Nash equilibrium point
  cassiniValid: boolean;    // Satisfies Cassini identity

  // Collision tracking
  collisionCount: number;   // Number of wave collisions at this node
  interferencePattern: 'CONSTRUCTIVE' | 'DESTRUCTIVE' | 'MIXED' | 'NONE';
}

/**
 * Edge between nodes
 */
export interface GraphEdge {
  id: string;
  source: string;           // Source node ID
  target: string;           // Target node ID
  edgeType: EdgeType;
  weight: number;           // Connection strength
  fibonacciGap: number;     // Fibonacci index difference

  // Metadata
  createdAt: number;
  isActive: boolean;
}

export type EdgeType =
  | 'FIBONACCI_JUMP'      // Forward expansion (φ channel)
  | 'LUCAS_JUMP'          // Backward contraction (ψ channel)
  | 'TEMPORAL'            // Time progression
  | 'SPATIAL'             // Spatial adjacency
  | 'COVALENT'            // Covalent bonding (shared structure)
  | 'INTERFERENCE';       // Wave interference

/**
 * Wave propagation event
 */
export interface PropagationEvent {
  eventId: string;
  timestamp: number;
  sourceNode: string;
  targetNodes: string[];
  waveType: WaveType;

  // Wave properties
  amplitude: SymbolicNumber;
  phase: number;
  shellDistance: number;

  // Results
  spawned: string[];        // Newly created nodes
  activated: string[];      // Activated latent nodes
  collisions: string[];     // Nodes where waves collided
}

/**
 * Collision event (wave interference)
 */
export interface CollisionEvent {
  eventId: string;
  timestamp: number;
  location: TensorCoordinate;
  nodeId: string;

  // Colliding waves
  waves: {
    waveType: WaveType;
    amplitude: SymbolicNumber;
    phase: number;
  }[];

  // Interference result
  resultantAmplitude: SymbolicNumber;
  interferenceType: 'CONSTRUCTIVE' | 'DESTRUCTIVE' | 'MIXED';
  isNashPoint: boolean;
}

/**
 * Saturation state for a region
 */
export interface SaturationState {
  region: {
    phiRange: [number, number];
    psiRange: [number, number];
  };
  timestamp: number;

  // Metrics
  coverage: number;         // 0 to 1 (or ∞ for liquid)
  density: number;          // Nodes per unit area
  phaseRegime: PhaseRegime;

  // Thresholds
  isQuantum: boolean;       // < φ^(-3) ≈ 0.236
  isIntermediate: boolean;  // φ^(-3) to φ^(-1) ≈ 0.618
  isClassical: boolean;     // > φ^(-1)
  isSaturated: boolean;     // Near 1
  isCondensed: boolean;     // = ∞ (liquid)
}

/**
 * Graph snapshot at time t
 */
export interface GraphSnapshot {
  timestamp: number;
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;

  // Statistics
  stats: {
    totalNodes: number;
    activeNodes: number;
    latentNodes: number;
    nashPoints: number;
    collisionCount: number;
  };

  // Phase information
  saturation: SaturationState;
  phaseRegime: PhaseRegime;
}

/**
 * Complete graph structure
 */
export interface TensorGraph {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
  snapshots: Map<number, GraphSnapshot>;

  // Event history
  propagationHistory: PropagationEvent[];
  collisionHistory: CollisionEvent[];

  // Configuration
  config: {
    maxShell: number;
    enableDualPropagation: boolean;
    enableCassiniFiltering: boolean;
    saturationThreshold: number;
  };
}

/**
 * Node query filters
 */
export interface NodeQuery {
  state?: NodeState[];
  waveType?: WaveType[];
  phaseRegime?: PhaseRegime[];
  isNash?: boolean;
  minDepth?: number;
  maxDepth?: number;
  timeRange?: [number, number];
}

/**
 * Visualization data structure
 */
export interface GraphVisualization {
  nodes: {
    id: string;
    x: number;  // φ coordinate (for display)
    y: number;  // ψ coordinate (for display)
    color: string;
    size: number;
    label: string;
    state: NodeState;
  }[];

  edges: {
    id: string;
    source: string;
    target: string;
    color: string;
    width: number;
    type: EdgeType;
  }[];

  metadata: {
    timestamp: number;
    phaseRegime: PhaseRegime;
    saturation: number;
    activeCount: number;
  };
}

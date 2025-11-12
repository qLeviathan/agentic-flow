/**
 * Phase Space Coordinate System - Type Definitions
 * Level 6: Advanced Mathematical Framework
 */

/**
 * Complex number representation
 */
export interface ComplexNumber {
  real: number;
  imaginary: number;
}

/**
 * Zero point in the Riemann zeta function
 */
export interface ZeroPoint {
  index: number;
  value: ComplexNumber;
  phi: ComplexNumber;  // φⁱ value
  psi: ComplexNumber;  // ψⁱ value
}

/**
 * Phase space coordinates for a given n
 */
export interface PhaseSpaceCoordinates {
  n: number;
  phi: number;        // φ(n) = Σᵢ∈Z(n) φⁱ
  psi: number;        // ψ(n) = Σᵢ∈Z(n) ψⁱ
  theta: number;      // θ(n) = arctan(ψ(n)/φ(n))
  isNashPoint: boolean; // S(n) = 0 indicator
  magnitude: number;  // r = √(φ² + ψ²)
  timestamp: number;
}

/**
 * Trajectory point in phase space
 */
export interface TrajectoryPoint {
  coordinates: PhaseSpaceCoordinates;
  velocity: {
    phi: number;  // dφ/dn
    psi: number;  // dψ/dn
  };
  acceleration: {
    phi: number;  // d²φ/dn²
    psi: number;  // d²ψ/dn²
  };
}

/**
 * Phase portrait configuration
 */
export interface PhasePortraitConfig {
  nMin: number;
  nMax: number;
  step: number;
  colorScheme: 'viridis' | 'plasma' | 'inferno' | 'magma';
  highlightNashPoints: boolean;
  showVectorField: boolean;
  resolution: number;
}

/**
 * Nash point (where S(n) = 0)
 */
export interface NashPoint {
  n: number;
  coordinates: PhaseSpaceCoordinates;
  stabilityIndex: number;
  surroundingFlow: 'attractive' | 'repulsive' | 'saddle' | 'neutral';
}

/**
 * Phase space pattern for AgentDB storage
 */
export interface PhaseSpacePattern {
  id: string;
  trajectory: TrajectoryPoint[];
  nashPoints: NashPoint[];
  characteristics: {
    periodicity: number | null;
    chaosIndicator: number;
    lyapunovExponent: number;
    convergenceRate: number;
  };
  metadata: {
    created: number;
    nRange: [number, number];
    totalPoints: number;
  };
}

/**
 * Visualization data structure
 */
export interface VisualizationData {
  points: PhaseSpaceCoordinates[];
  nashPoints: PhaseSpaceCoordinates[];
  trajectory: {
    path: [number, number][];
    colors: string[];
  };
  bounds: {
    phiMin: number;
    phiMax: number;
    psiMin: number;
    psiMax: number;
  };
}

/**
 * Analysis results
 */
export interface PhaseSpaceAnalysis {
  attractors: PhaseSpaceCoordinates[];
  repellers: PhaseSpaceCoordinates[];
  saddlePoints: PhaseSpaceCoordinates[];
  cycles: TrajectoryPoint[][];
  entropy: number;
  dimensionality: number;
}

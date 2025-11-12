/**
 * Phase Space Coordinate System Implementation
 * Level 6: Advanced Mathematical Framework
 *
 * Implements:
 * - φ(n) = Σᵢ∈Z(n) φⁱ - φ-coordinate
 * - ψ(n) = Σᵢ∈Z(n) ψⁱ - ψ-coordinate
 * - θ(n) = arctan(ψ(n)/φ(n)) - Phase angle
 */

import {
  ComplexNumber,
  ZeroPoint,
  PhaseSpaceCoordinates,
  TrajectoryPoint,
  NashPoint,
  PhaseSpacePattern,
  PhaseSpaceAnalysis
} from './types';

/**
 * Riemann Zeta zeros (first 100 imaginary parts on critical line)
 * These are the non-trivial zeros: ρ = 1/2 + i·t
 */
const ZETA_ZEROS_IMAGINARY: number[] = [
  14.134725, 21.022040, 25.010858, 30.424876, 32.935062,
  37.586178, 40.918719, 43.327073, 48.005151, 49.773832,
  52.970321, 56.446248, 59.347044, 60.831778, 65.112544,
  67.079811, 69.546402, 72.067158, 75.704691, 77.144840,
  79.337375, 82.910381, 84.735493, 87.425275, 88.809111,
  92.491899, 94.651344, 95.870634, 98.831194, 101.317851,
  103.725538, 105.446623, 107.168611, 111.029536, 111.874659,
  114.320220, 116.226680, 118.790782, 121.370125, 122.946829,
  124.256819, 127.516683, 129.578704, 131.087688, 133.497737,
  134.756509, 138.116042, 139.736209, 141.123707, 143.111846,
  146.000982, 147.422765, 150.053183, 150.925257, 153.024693,
  156.112909, 157.597591, 158.849988, 161.188964, 163.030709,
  165.537069, 167.184440, 169.094515, 169.911976, 173.411536,
  174.754191, 176.441434, 178.377407, 179.916484, 182.207078,
  184.874467, 185.598783, 187.228922, 189.416158, 192.026656,
  193.079726, 195.265396, 196.876481, 198.015309, 201.264751,
  202.493594, 204.189671, 205.394697, 207.906258, 209.576509,
  211.690862, 213.347919, 214.547044, 216.169538, 219.067596,
  220.714918, 221.430705, 224.007000, 224.983324, 227.421444,
  229.337413, 231.250188, 231.987235, 233.693404, 236.524229
];

/**
 * Complex number operations
 */
class Complex {
  constructor(public real: number, public imaginary: number) {}

  add(other: Complex): Complex {
    return new Complex(
      this.real + other.real,
      this.imaginary + other.imaginary
    );
  }

  multiply(scalar: number): Complex {
    return new Complex(this.real * scalar, this.imaginary * scalar);
  }

  magnitude(): number {
    return Math.sqrt(this.real * this.real + this.imaginary * this.imaginary);
  }

  phase(): number {
    return Math.atan2(this.imaginary, this.real);
  }
}

/**
 * Calculate φⁱ for a given zero
 * φⁱ = cos(t·log(n)) where t is the imaginary part of the zero
 */
function calculatePhiComponent(n: number, zeroImag: number): Complex {
  const logN = Math.log(n);
  const real = Math.cos(zeroImag * logN);
  const imaginary = 0; // φ is real-valued in this formulation
  return new Complex(real, imaginary);
}

/**
 * Calculate ψⁱ for a given zero
 * ψⁱ = sin(t·log(n)) where t is the imaginary part of the zero
 */
function calculatePsiComponent(n: number, zeroImag: number): Complex {
  const logN = Math.log(n);
  const real = Math.sin(zeroImag * logN);
  const imaginary = 0; // ψ is real-valued in this formulation
  return new Complex(real, imaginary);
}

/**
 * Calculate φ(n) = Σᵢ∈Z(n) φⁱ
 * Sum over all zeros up to a certain index
 */
export function calculatePhi(n: number, maxZeros: number = 50): number {
  let sum = 0;

  for (let i = 0; i < Math.min(maxZeros, ZETA_ZEROS_IMAGINARY.length); i++) {
    const phi_i = calculatePhiComponent(n, ZETA_ZEROS_IMAGINARY[i]);
    sum += phi_i.real;
  }

  return sum;
}

/**
 * Calculate ψ(n) = Σᵢ∈Z(n) ψⁱ
 * Sum over all zeros up to a certain index
 */
export function calculatePsi(n: number, maxZeros: number = 50): number {
  let sum = 0;

  for (let i = 0; i < Math.min(maxZeros, ZETA_ZEROS_IMAGINARY.length); i++) {
    const psi_i = calculatePsiComponent(n, ZETA_ZEROS_IMAGINARY[i]);
    sum += psi_i.real;
  }

  return sum;
}

/**
 * Calculate θ(n) = arctan(ψ(n)/φ(n))
 * Phase angle in the phase space
 */
export function calculateTheta(phi: number, psi: number): number {
  return Math.atan2(psi, phi);
}

/**
 * Calculate magnitude r = √(φ² + ψ²)
 */
export function calculateMagnitude(phi: number, psi: number): number {
  return Math.sqrt(phi * phi + psi * psi);
}

/**
 * Simple S(n) calculation for Nash point detection
 * This is a placeholder - integrate with actual S(n) from other modules
 */
function calculateS(n: number): number {
  // Placeholder: oscillating function that crosses zero
  // Replace with actual S(n) calculation
  const phi = calculatePhi(n);
  const psi = calculatePsi(n);
  return phi * Math.sin(n / 10) + psi * Math.cos(n / 10);
}

/**
 * Check if n is a Nash point (S(n) = 0)
 */
export function isNashPoint(n: number, tolerance: number = 1e-6): boolean {
  return Math.abs(calculateS(n)) < tolerance;
}

/**
 * Calculate complete phase space coordinates for a given n
 */
export function calculateCoordinates(
  n: number,
  maxZeros: number = 50
): PhaseSpaceCoordinates {
  const phi = calculatePhi(n, maxZeros);
  const psi = calculatePsi(n, maxZeros);
  const theta = calculateTheta(phi, psi);
  const magnitude = calculateMagnitude(phi, psi);
  const nashPoint = isNashPoint(n);

  return {
    n,
    phi,
    psi,
    theta,
    magnitude,
    isNashPoint: nashPoint,
    timestamp: Date.now()
  };
}

/**
 * Generate trajectory over a range of n values
 */
export function generateTrajectory(
  nMin: number,
  nMax: number,
  step: number = 1,
  maxZeros: number = 50
): TrajectoryPoint[] {
  const trajectory: TrajectoryPoint[] = [];

  for (let n = nMin; n <= nMax; n += step) {
    const coordinates = calculateCoordinates(n, maxZeros);

    // Calculate velocities (numerical derivative)
    const prevCoord = n > nMin
      ? calculateCoordinates(n - step, maxZeros)
      : coordinates;
    const nextCoord = n < nMax
      ? calculateCoordinates(n + step, maxZeros)
      : coordinates;

    const velocity = {
      phi: (nextCoord.phi - prevCoord.phi) / (2 * step),
      psi: (nextCoord.psi - prevCoord.psi) / (2 * step)
    };

    // Calculate accelerations (second derivative)
    const acceleration = {
      phi: (nextCoord.phi - 2 * coordinates.phi + prevCoord.phi) / (step * step),
      psi: (nextCoord.psi - 2 * coordinates.psi + prevCoord.psi) / (step * step)
    };

    trajectory.push({
      coordinates,
      velocity,
      acceleration
    });
  }

  return trajectory;
}

/**
 * Find Nash points in a range
 */
export function findNashPoints(
  nMin: number,
  nMax: number,
  step: number = 0.1,
  tolerance: number = 1e-6
): NashPoint[] {
  const nashPoints: NashPoint[] = [];

  for (let n = nMin; n <= nMax; n += step) {
    if (isNashPoint(n, tolerance)) {
      const coordinates = calculateCoordinates(n);

      // Analyze local flow to determine stability
      const epsilon = 0.01;
      const s_minus = calculateS(n - epsilon);
      const s_plus = calculateS(n + epsilon);
      const derivative = (s_plus - s_minus) / (2 * epsilon);

      let flow: 'attractive' | 'repulsive' | 'saddle' | 'neutral';
      if (Math.abs(derivative) < 0.1) {
        flow = 'neutral';
      } else if (derivative < 0) {
        flow = 'attractive';
      } else {
        flow = 'repulsive';
      }

      nashPoints.push({
        n,
        coordinates,
        stabilityIndex: derivative,
        surroundingFlow: flow
      });
    }
  }

  return nashPoints;
}

/**
 * Analyze phase space characteristics
 */
export function analyzePhaseSpace(
  trajectory: TrajectoryPoint[]
): PhaseSpaceAnalysis {
  const attractors: PhaseSpaceCoordinates[] = [];
  const repellers: PhaseSpaceCoordinates[] = [];
  const saddlePoints: PhaseSpaceCoordinates[] = [];

  // Simple analysis - look for velocity minima/maxima
  for (let i = 1; i < trajectory.length - 1; i++) {
    const curr = trajectory[i];
    const prev = trajectory[i - 1];
    const next = trajectory[i + 1];

    const velMag = Math.sqrt(
      curr.velocity.phi ** 2 + curr.velocity.psi ** 2
    );
    const prevVelMag = Math.sqrt(
      prev.velocity.phi ** 2 + prev.velocity.psi ** 2
    );
    const nextVelMag = Math.sqrt(
      next.velocity.phi ** 2 + next.velocity.psi ** 2
    );

    // Local minimum in velocity = attractor
    if (velMag < prevVelMag && velMag < nextVelMag && velMag < 0.1) {
      attractors.push(curr.coordinates);
    }

    // Local maximum in velocity = repeller
    if (velMag > prevVelMag && velMag > nextVelMag && velMag > 1.0) {
      repellers.push(curr.coordinates);
    }
  }

  // Calculate entropy (measure of trajectory complexity)
  const phiValues = trajectory.map(t => t.coordinates.phi);
  const psiValues = trajectory.map(t => t.coordinates.psi);
  const entropy = calculateEntropy([...phiValues, ...psiValues]);

  return {
    attractors,
    repellers,
    saddlePoints,
    cycles: [], // Would need more sophisticated cycle detection
    entropy,
    dimensionality: 2 // Phase space is 2D (φ, ψ)
  };
}

/**
 * Calculate Shannon entropy of a dataset
 */
function calculateEntropy(data: number[]): number {
  const bins = 50;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / bins;

  const histogram = new Array(bins).fill(0);
  for (const value of data) {
    const bin = Math.min(Math.floor((value - min) / binWidth), bins - 1);
    histogram[bin]++;
  }

  const total = data.length;
  let entropy = 0;

  for (const count of histogram) {
    if (count > 0) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
}

/**
 * Create a phase space pattern for storage
 */
export function createPattern(
  trajectory: TrajectoryPoint[],
  nashPoints: NashPoint[]
): PhaseSpacePattern {
  const analysis = analyzePhaseSpace(trajectory);
  const nValues = trajectory.map(t => t.coordinates.n);

  return {
    id: `pattern-${Date.now()}`,
    trajectory,
    nashPoints,
    characteristics: {
      periodicity: detectPeriodicity(trajectory),
      chaosIndicator: analysis.entropy,
      lyapunovExponent: estimateLyapunovExponent(trajectory),
      convergenceRate: calculateConvergenceRate(trajectory)
    },
    metadata: {
      created: Date.now(),
      nRange: [Math.min(...nValues), Math.max(...nValues)],
      totalPoints: trajectory.length
    }
  };
}

/**
 * Detect periodicity in trajectory (if any)
 */
function detectPeriodicity(trajectory: TrajectoryPoint[]): number | null {
  // Autocorrelation-based period detection
  const phiValues = trajectory.map(t => t.coordinates.phi);
  const maxLag = Math.floor(phiValues.length / 2);

  let maxCorrelation = -Infinity;
  let period: number | null = null;

  for (let lag = 1; lag < maxLag; lag++) {
    const correlation = autocorrelation(phiValues, lag);
    if (correlation > 0.8 && correlation > maxCorrelation) {
      maxCorrelation = correlation;
      period = lag;
    }
  }

  return period;
}

/**
 * Calculate autocorrelation at a given lag
 */
function autocorrelation(data: number[], lag: number): number {
  const n = data.length - lag;
  const mean = data.reduce((a, b) => a + b, 0) / data.length;

  let numerator = 0;
  let denominator = 0;

  for (let i = 0; i < n; i++) {
    numerator += (data[i] - mean) * (data[i + lag] - mean);
  }

  for (let i = 0; i < data.length; i++) {
    denominator += (data[i] - mean) ** 2;
  }

  return numerator / denominator;
}

/**
 * Estimate largest Lyapunov exponent (chaos indicator)
 */
function estimateLyapunovExponent(trajectory: TrajectoryPoint[]): number {
  if (trajectory.length < 10) return 0;

  const distances: number[] = [];

  for (let i = 0; i < trajectory.length - 1; i++) {
    const curr = trajectory[i].coordinates;
    const next = trajectory[i + 1].coordinates;

    const dist = Math.sqrt(
      (next.phi - curr.phi) ** 2 +
      (next.psi - curr.psi) ** 2
    );

    if (dist > 0) {
      distances.push(Math.log(dist));
    }
  }

  if (distances.length < 2) return 0;

  // Linear regression on log distances
  const n = distances.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = distances.reduce((a, b) => a + b, 0);
  const sumXY = distances.reduce((sum, y, x) => sum + x * y, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
}

/**
 * Calculate convergence rate of trajectory
 */
function calculateConvergenceRate(trajectory: TrajectoryPoint[]): number {
  if (trajectory.length < 2) return 0;

  const first = trajectory[0].coordinates;
  const last = trajectory[trajectory.length - 1].coordinates;

  const initialMag = first.magnitude;
  const finalMag = last.magnitude;

  if (initialMag === 0) return 0;

  return (finalMag - initialMag) / (trajectory.length * initialMag);
}

/**
 * Export all zero values for reference
 */
export const ZETA_ZEROS = ZETA_ZEROS_IMAGINARY;

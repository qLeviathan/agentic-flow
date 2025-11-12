/**
 * Phase Space Coordinate System - Main Export
 * Level 6: Advanced Mathematical Framework
 *
 * This module implements phase space coordinates based on Riemann zeta zeros:
 * - φ(n) = Σᵢ∈Z(n) φⁱ - φ-coordinate
 * - ψ(n) = Σᵢ∈Z(n) ψⁱ - ψ-coordinate
 * - θ(n) = arctan(ψ(n)/φ(n)) - Phase angle
 */

// Core coordinate functions
export {
  calculatePhi,
  calculatePsi,
  calculateTheta,
  calculateMagnitude,
  calculateCoordinates,
  generateTrajectory,
  findNashPoints,
  createPattern,
  analyzePhaseSpace,
  isNashPoint,
  ZETA_ZEROS
} from './coordinates';

// Visualization functions
export {
  generatePhasePlotSVG,
  generatePhasePortraitSVG,
  generate3DVisualizationData,
  exportVisualizationData,
  generateInteractiveHTML
} from './visualization';

// Storage and pattern recognition
export {
  PhaseSpaceStorage,
  createPhaseSpaceStorage
} from './storage';

// Type definitions
export type {
  ComplexNumber,
  ZeroPoint,
  PhaseSpaceCoordinates,
  TrajectoryPoint,
  NashPoint,
  PhaseSpacePattern,
  PhasePortraitConfig,
  VisualizationData,
  PhaseSpaceAnalysis
} from './types';

/**
 * Quick start example:
 *
 * ```typescript
 * import {
 *   calculateCoordinates,
 *   generateTrajectory,
 *   findNashPoints,
 *   generatePhasePlotSVG
 * } from './phase-space';
 *
 * // Calculate coordinates for n=50
 * const coords = calculateCoordinates(50);
 * console.log(`φ(50) = ${coords.phi}`);
 * console.log(`ψ(50) = ${coords.psi}`);
 * console.log(`θ(50) = ${coords.theta}`);
 *
 * // Generate trajectory
 * const trajectory = generateTrajectory(1, 100, 1);
 * const nashPoints = findNashPoints(1, 100, 1);
 *
 * // Create visualization
 * const svg = generatePhasePlotSVG(trajectory, nashPoints);
 * ```
 */

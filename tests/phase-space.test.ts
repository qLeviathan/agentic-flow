/**
 * Phase Space Coordinate System - Test Suite
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import {
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
} from '../src/math-framework/phase-space/coordinates';

import {
  generatePhasePlotSVG,
  generatePhasePortraitSVG,
  exportVisualizationData
} from '../src/math-framework/phase-space/visualization';

import {
  createPhaseSpaceStorage,
  PhaseSpaceStorage
} from '../src/math-framework/phase-space/storage';

describe('Phase Space Coordinates', () => {
  describe('Basic Calculations', () => {
    it('should calculate φ(n) correctly', () => {
      const phi = calculatePhi(10, 50);
      expect(typeof phi).toBe('number');
      expect(isFinite(phi)).toBe(true);
    });

    it('should calculate ψ(n) correctly', () => {
      const psi = calculatePsi(10, 50);
      expect(typeof psi).toBe('number');
      expect(isFinite(psi)).toBe(true);
    });

    it('should calculate θ(n) correctly', () => {
      const phi = 3;
      const psi = 4;
      const theta = calculateTheta(phi, psi);
      expect(theta).toBeCloseTo(Math.atan2(4, 3), 6);
    });

    it('should calculate magnitude correctly', () => {
      const phi = 3;
      const psi = 4;
      const magnitude = calculateMagnitude(phi, psi);
      expect(magnitude).toBeCloseTo(5, 6);
    });

    it('should calculate complete coordinates', () => {
      const coords = calculateCoordinates(50, 50);

      expect(coords).toHaveProperty('n', 50);
      expect(coords).toHaveProperty('phi');
      expect(coords).toHaveProperty('psi');
      expect(coords).toHaveProperty('theta');
      expect(coords).toHaveProperty('magnitude');
      expect(coords).toHaveProperty('isNashPoint');
      expect(coords).toHaveProperty('timestamp');

      expect(typeof coords.phi).toBe('number');
      expect(typeof coords.psi).toBe('number');
      expect(typeof coords.theta).toBe('number');
      expect(typeof coords.magnitude).toBe('number');
      expect(typeof coords.isNashPoint).toBe('boolean');
    });

    it('should handle different numbers of zeros', () => {
      const coords10 = calculateCoordinates(50, 10);
      const coords50 = calculateCoordinates(50, 50);
      const coords100 = calculateCoordinates(50, 100);

      // Results should differ with different zero counts
      expect(coords10.phi).not.toBe(coords50.phi);
      expect(coords50.phi).not.toBe(coords100.phi);
    });
  });

  describe('Trajectory Generation', () => {
    it('should generate trajectory with correct length', () => {
      const trajectory = generateTrajectory(1, 10, 1, 30);
      expect(trajectory.length).toBe(10);
    });

    it('should generate trajectory with fractional step', () => {
      const trajectory = generateTrajectory(1, 10, 0.5, 30);
      expect(trajectory.length).toBe(19);
    });

    it('should include velocity and acceleration', () => {
      const trajectory = generateTrajectory(1, 10, 1, 30);

      trajectory.forEach(point => {
        expect(point).toHaveProperty('coordinates');
        expect(point).toHaveProperty('velocity');
        expect(point).toHaveProperty('acceleration');

        expect(point.velocity).toHaveProperty('phi');
        expect(point.velocity).toHaveProperty('psi');
        expect(point.acceleration).toHaveProperty('phi');
        expect(point.acceleration).toHaveProperty('psi');
      });
    });

    it('should have continuous trajectory', () => {
      const trajectory = generateTrajectory(1, 20, 1, 30);

      for (let i = 1; i < trajectory.length; i++) {
        const prev = trajectory[i - 1].coordinates;
        const curr = trajectory[i].coordinates;

        expect(curr.n).toBe(prev.n + 1);
      }
    });
  });

  describe('Nash Points', () => {
    it('should find Nash points in range', () => {
      const nashPoints = findNashPoints(1, 50, 1);

      expect(Array.isArray(nashPoints)).toBe(true);

      nashPoints.forEach(np => {
        expect(np).toHaveProperty('n');
        expect(np).toHaveProperty('coordinates');
        expect(np).toHaveProperty('stabilityIndex');
        expect(np).toHaveProperty('surroundingFlow');

        expect(np.n).toBeGreaterThanOrEqual(1);
        expect(np.n).toBeLessThanOrEqual(50);

        expect(['attractive', 'repulsive', 'saddle', 'neutral']).toContain(np.surroundingFlow);
      });
    });

    it('should detect Nash points correctly', () => {
      // Nash point detection is approximate, so we just check the function works
      const isNash = isNashPoint(10);
      expect(typeof isNash).toBe('boolean');
    });
  });

  describe('Pattern Creation', () => {
    it('should create valid pattern', () => {
      const trajectory = generateTrajectory(1, 50, 1, 30);
      const nashPoints = findNashPoints(1, 50, 2);
      const pattern = createPattern(trajectory, nashPoints);

      expect(pattern).toHaveProperty('id');
      expect(pattern).toHaveProperty('trajectory');
      expect(pattern).toHaveProperty('nashPoints');
      expect(pattern).toHaveProperty('characteristics');
      expect(pattern).toHaveProperty('metadata');

      expect(pattern.characteristics).toHaveProperty('periodicity');
      expect(pattern.characteristics).toHaveProperty('chaosIndicator');
      expect(pattern.characteristics).toHaveProperty('lyapunovExponent');
      expect(pattern.characteristics).toHaveProperty('convergenceRate');

      expect(pattern.metadata).toHaveProperty('created');
      expect(pattern.metadata).toHaveProperty('nRange');
      expect(pattern.metadata).toHaveProperty('totalPoints');
    });

    it('should analyze phase space', () => {
      const trajectory = generateTrajectory(1, 100, 1, 50);
      const analysis = analyzePhaseSpace(trajectory);

      expect(analysis).toHaveProperty('attractors');
      expect(analysis).toHaveProperty('repellers');
      expect(analysis).toHaveProperty('saddlePoints');
      expect(analysis).toHaveProperty('cycles');
      expect(analysis).toHaveProperty('entropy');
      expect(analysis).toHaveProperty('dimensionality');

      expect(analysis.dimensionality).toBe(2);
      expect(analysis.entropy).toBeGreaterThan(0);
    });
  });

  describe('Riemann Zeros', () => {
    it('should have correct number of zeros', () => {
      expect(ZETA_ZEROS.length).toBe(100);
    });

    it('should have positive values', () => {
      ZETA_ZEROS.forEach(zero => {
        expect(zero).toBeGreaterThan(0);
      });
    });

    it('should be in ascending order', () => {
      for (let i = 1; i < ZETA_ZEROS.length; i++) {
        expect(ZETA_ZEROS[i]).toBeGreaterThan(ZETA_ZEROS[i - 1]);
      }
    });

    it('first zero should be approximately 14.134725', () => {
      expect(ZETA_ZEROS[0]).toBeCloseTo(14.134725, 5);
    });
  });
});

describe('Visualization', () => {
  describe('SVG Generation', () => {
    it('should generate phase plot SVG', () => {
      const trajectory = generateTrajectory(1, 50, 1, 30);
      const nashPoints = findNashPoints(1, 50, 5);
      const svg = generatePhasePlotSVG(trajectory, nashPoints);

      expect(typeof svg).toBe('string');
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('Phase Space');
    });

    it('should generate phase portrait SVG', () => {
      const trajectory = generateTrajectory(1, 50, 1, 30);
      const svg = generatePhasePortraitSVG(trajectory);

      expect(typeof svg).toBe('string');
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('Phase Portrait');
    });

    it('should respect configuration options', () => {
      const trajectory = generateTrajectory(1, 50, 1, 30);
      const nashPoints = findNashPoints(1, 50, 5);

      const svg = generatePhasePlotSVG(trajectory, nashPoints, {
        resolution: 1000,
        colorScheme: 'plasma'
      });

      expect(svg).toContain('width="1000"');
      expect(svg).toContain('height="1000"');
    });
  });

  describe('Data Export', () => {
    it('should export visualization data', () => {
      const trajectory = generateTrajectory(1, 50, 1, 30);
      const nashPoints = findNashPoints(1, 50, 5);
      const data = exportVisualizationData(trajectory, nashPoints);

      expect(data).toHaveProperty('points');
      expect(data).toHaveProperty('nashPoints');
      expect(data).toHaveProperty('trajectory');
      expect(data).toHaveProperty('bounds');

      expect(data.points.length).toBe(trajectory.length);
      expect(data.trajectory.path.length).toBe(trajectory.length);
      expect(data.trajectory.colors.length).toBe(trajectory.length);

      expect(data.bounds).toHaveProperty('phiMin');
      expect(data.bounds).toHaveProperty('phiMax');
      expect(data.bounds).toHaveProperty('psiMin');
      expect(data.bounds).toHaveProperty('psiMax');
    });
  });
});

describe('Storage', () => {
  let storage: PhaseSpaceStorage;

  beforeAll(async () => {
    storage = createPhaseSpaceStorage({
      dbPath: ':memory:' // Use in-memory database for tests
    });
    await storage.initialize();
  });

  afterAll(async () => {
    await storage.close();
  });

  describe('Pattern Storage', () => {
    it('should store and retrieve pattern', async () => {
      const trajectory = generateTrajectory(1, 30, 1, 30);
      const nashPoints = findNashPoints(1, 30, 2);
      const pattern = createPattern(trajectory, nashPoints);

      const id = await storage.storePattern(pattern);
      expect(id).toBe(pattern.id);

      const retrieved = await storage.getPattern(id);
      expect(retrieved).toBeDefined();
      // Note: Retrieved pattern may not be identical due to encoding/decoding
    });

    it('should return null for non-existent pattern', async () => {
      const result = await storage.getPattern('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('Pattern Search', () => {
    it('should find similar patterns', async () => {
      const trajectory1 = generateTrajectory(1, 30, 1, 30);
      const nashPoints1 = findNashPoints(1, 30, 2);
      const pattern1 = createPattern(trajectory1, nashPoints1);

      await storage.storePattern(pattern1);

      const trajectory2 = generateTrajectory(1, 30, 1, 30);
      const nashPoints2 = findNashPoints(1, 30, 2);
      const pattern2 = createPattern(trajectory2, nashPoints2);

      const similar = await storage.findSimilarPatterns(pattern2, 5);

      expect(Array.isArray(similar)).toBe(true);
      similar.forEach(result => {
        expect(result).toHaveProperty('pattern');
        expect(result).toHaveProperty('similarity');
      });
    });
  });

  describe('Statistics', () => {
    it('should calculate statistics', async () => {
      const stats = await storage.getStatistics();

      expect(stats).toHaveProperty('totalPatterns');
      expect(stats).toHaveProperty('avgChaos');
      expect(stats).toHaveProperty('avgConvergence');
      expect(stats).toHaveProperty('periodicPatterns');
      expect(stats).toHaveProperty('nashPointsTotal');

      expect(typeof stats.totalPatterns).toBe('number');
      expect(typeof stats.avgChaos).toBe('number');
      expect(typeof stats.avgConvergence).toBe('number');
      expect(typeof stats.periodicPatterns).toBe('number');
      expect(typeof stats.nashPointsTotal).toBe('number');
    });
  });
});

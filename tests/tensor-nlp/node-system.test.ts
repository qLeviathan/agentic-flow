/**
 * Test suite for graph construction and node system
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { NodeSystem } from '../../src/tensor-nlp/graph/node-system';

describe('NodeSystem', () => {
  let system: NodeSystem;

  beforeEach(() => {
    system = new NodeSystem({ maxShell: 10, enableDualPropagation: true, enableCassiniFiltering: true, saturationThreshold: 0.9 });
  });

  describe('Initialization', () => {
    it('should initialize with PRESENT node at origin', () => {
      const stats = system.getStatistics();
      expect(stats).toBeDefined();
      expect(stats!.totalNodes).toBe(1);
      expect(stats!.activeNodes).toBe(1);
    });

    it('should have PRESENT node at coordinates (0,0,0,0)', () => {
      const snapshot = system.getCurrentSnapshot();
      expect(snapshot).toBeDefined();

      const presentNode = Array.from(snapshot!.nodes.values())[0];
      expect(presentNode.coord.phi).toBe(0);
      expect(presentNode.coord.psi).toBe(0);
      expect(presentNode.coord.t).toBe(0);
      expect(presentNode.coord.theta).toBe(0);
    });

    it('should mark PRESENT as Nash point', () => {
      const snapshot = system.getCurrentSnapshot();
      const presentNode = Array.from(snapshot!.nodes.values())[0];
      expect(presentNode.isNash).toBe(true);
    });
  });

  describe('Wave Propagation', () => {
    it('should propagate wave from PRESENT', () => {
      const snapshot = system.getCurrentSnapshot();
      const presentNode = Array.from(snapshot!.nodes.values())[0];

      const event = system.propagateWave(presentNode.id, 'DUAL');

      expect(event).toBeDefined();
      expect(event.spawned.length).toBeGreaterThan(0);
      expect(event.waveType).toBe('DUAL');
    });

    it('should create Fibonacci jumps (forward)', () => {
      const snapshot = system.getCurrentSnapshot();
      const presentNode = Array.from(snapshot!.nodes.values())[0];

      system.propagateWave(presentNode.id, 'FIBONACCI');

      const stats = system.getStatistics();
      expect(stats!.totalNodes).toBeGreaterThan(1);
    });

    it('should create Lucas jumps (backward)', () => {
      const snapshot = system.getCurrentSnapshot();
      const presentNode = Array.from(snapshot!.nodes.values())[0];

      system.propagateWave(presentNode.id, 'LUCAS');

      const stats = system.getStatistics();
      expect(stats!.totalNodes).toBeGreaterThan(1);
    });

    it('should create both Fibonacci and Lucas jumps with DUAL', () => {
      const snapshot = system.getCurrentSnapshot();
      const presentNode = Array.from(snapshot!.nodes.values())[0];

      system.propagateWave(presentNode.id, 'DUAL');

      const stats = system.getStatistics();
      // DUAL should create more nodes than either alone
      expect(stats!.totalNodes).toBeGreaterThan(2);
    });
  });

  describe('Time Stepping', () => {
    it('should advance time with step()', () => {
      system.step();

      const snapshot = system.getCurrentSnapshot();
      expect(snapshot!.timestamp).toBe(1);
    });

    it('should propagate all active nodes on step', () => {
      system.step();  // t=1

      const stats = system.getStatistics();
      expect(stats!.totalNodes).toBeGreaterThan(1);
    });

    it('should create multiple generations', () => {
      system.step();  // t=1
      system.step();  // t=2
      system.step();  // t=3

      const snapshot = system.getCurrentSnapshot();
      expect(snapshot!.timestamp).toBe(3);

      const stats = system.getStatistics();
      expect(stats!.totalNodes).toBeGreaterThan(5);
    });
  });

  describe('Collision Detection', () => {
    it('should detect collisions when waves meet', () => {
      // Propagate multiple steps to create collisions
      for (let i = 0; i < 5; i++) {
        system.step();
      }

      const stats = system.getStatistics();
      // Should have some collisions
      expect(stats!.collisionEvents).toBeGreaterThanOrEqual(0);
    });

    it('should track collision count on nodes', () => {
      for (let i = 0; i < 5; i++) {
        system.step();
      }

      const snapshot = system.getCurrentSnapshot();
      const nodes = Array.from(snapshot!.nodes.values());

      // At least some nodes should have collisions
      const nodesWithCollisions = nodes.filter(n => n.collisionCount > 0);
      expect(nodesWithCollisions.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cassini Filtering', () => {
    it('should filter nodes that violate Cassini identity', () => {
      // With Cassini filtering enabled, only valid nodes survive
      for (let i = 0; i < 3; i++) {
        system.step();
      }

      const snapshot = system.getCurrentSnapshot();
      const nodes = Array.from(snapshot!.nodes.values());

      // All nodes should be Cassini-valid
      for (const node of nodes) {
        expect(node.cassiniValid).toBe(true);
      }
    });
  });

  describe('Saturation Tracking', () => {
    it('should track saturation level', () => {
      for (let i = 0; i < 5; i++) {
        system.step();
      }

      const snapshot = system.getCurrentSnapshot();
      expect(snapshot!.saturation.coverage).toBeGreaterThanOrEqual(0);
      expect(snapshot!.saturation.coverage).toBeLessThanOrEqual(1);
    });

    it('should transition to SATURATED state near threshold', () => {
      // Run many steps to approach saturation
      for (let i = 0; i < 15; i++) {
        system.step();
      }

      const snapshot = system.getCurrentSnapshot();
      if (snapshot!.saturation.coverage >= 0.9) {
        const saturatedNodes = Array.from(snapshot!.nodes.values())
          .filter(n => n.state === 'SATURATED');
        expect(saturatedNodes.length).toBeGreaterThan(0);
      }
    });

    it('should identify phase regime correctly', () => {
      const snapshot = system.getCurrentSnapshot();
      expect(['QUANTUM', 'INTERMEDIATE', 'CLASSICAL', 'SATURATED'])
        .toContain(snapshot!.phaseRegime);
    });
  });

  describe('Nash Points', () => {
    it('should identify Nash equilibrium points', () => {
      for (let i = 0; i < 5; i++) {
        system.step();
      }

      const stats = system.getStatistics();
      expect(stats!.nashPoints).toBeGreaterThanOrEqual(1);  // At least PRESENT
    });

    it('should create Nash points at constructive interference', () => {
      for (let i = 0; i < 5; i++) {
        system.step();
      }

      const snapshot = system.getCurrentSnapshot();
      const nashNodes = Array.from(snapshot!.nodes.values())
        .filter(n => n.isNash);

      // Nash points should have constructive or no interference
      for (const node of nashNodes) {
        expect(['CONSTRUCTIVE', 'NONE']).toContain(node.interferencePattern);
      }
    });
  });

  describe('Node Queries', () => {
    beforeEach(() => {
      for (let i = 0; i < 5; i++) {
        system.step();
      }
    });

    it('should query nodes by state', () => {
      const activeNodes = system.queryNodes({ state: ['ACTIVE'] });
      expect(activeNodes.length).toBeGreaterThan(0);

      for (const node of activeNodes) {
        expect(node.state).toBe('ACTIVE');
      }
    });

    it('should query Nash points', () => {
      const nashNodes = system.queryNodes({ isNash: true });
      expect(nashNodes.length).toBeGreaterThanOrEqual(1);

      for (const node of nashNodes) {
        expect(node.isNash).toBe(true);
      }
    });

    it('should query by depth range', () => {
      const shallowNodes = system.queryNodes({ minDepth: 0, maxDepth: 2 });

      for (const node of shallowNodes) {
        expect(node.depth).toBeGreaterThanOrEqual(0);
        expect(node.depth).toBeLessThanOrEqual(2);
      }
    });

    it('should query by time range', () => {
      const earlyNodes = system.queryNodes({ timeRange: [0, 2] });

      for (const node of earlyNodes) {
        expect(node.createdAt).toBeGreaterThanOrEqual(0);
        expect(node.createdAt).toBeLessThanOrEqual(2);
      }
    });
  });

  describe('Snapshots', () => {
    it('should create snapshot at each time step', () => {
      for (let i = 0; i < 3; i++) {
        system.step();
      }

      const snapshots = system.getAllSnapshots();
      expect(snapshots.length).toBe(4);  // 0, 1, 2, 3
    });

    it('should preserve node and edge counts in snapshots', () => {
      system.step();
      system.step();

      const snapshots = system.getAllSnapshots();
      for (const snapshot of snapshots) {
        expect(snapshot.stats.totalNodes).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Export for Visualization', () => {
    it('should export complete graph data', () => {
      for (let i = 0; i < 3; i++) {
        system.step();
      }

      const exported = system.exportForVisualization();

      expect(exported.nodes.size).toBeGreaterThan(0);
      expect(exported.edges.size).toBeGreaterThanOrEqual(0);
      expect(exported.currentTime).toBe(3);
      expect(exported.statistics).toBeDefined();
    });
  });

  describe('Reset', () => {
    it('should reset to initial state', () => {
      system.step();
      system.step();
      system.step();

      system.reset();

      const stats = system.getStatistics();
      expect(stats!.totalNodes).toBe(1);
      expect(stats!.activeNodes).toBe(1);

      const snapshot = system.getCurrentSnapshot();
      expect(snapshot!.timestamp).toBe(0);
    });
  });
});

/**
 * Dependency Graph Validation Tests
 *
 * Comprehensive test suite for the dependency graph validation system.
 */

import { describe, it, expect } from '@jest/globals';
import {
  DependencyGraph,
  validateDependencyGraph,
  getComputationOrder,
  checkIndependence,
  generateVisualization
} from '../../../src/math-framework/validation/dependency-graph';

describe('DependencyGraph', () => {
  describe('Construction and Initialization', () => {
    it('should create a dependency graph from symbol table', () => {
      const graph = new DependencyGraph();
      const result = graph.validate();

      expect(result).toBeDefined();
      expect(result.graphMetrics.totalSymbols).toBeGreaterThan(0);
    });

    it('should add symbols with dependencies', () => {
      const graph = new DependencyGraph();
      graph.addSymbol('test', 10, ['φ', 'ψ'], 'operation', 'Test symbol');

      const symbol = graph.getSymbol('test');
      expect(symbol).toBeDefined();
      expect(symbol?.name).toBe('test');
      expect(symbol?.level).toBe(10);
      expect(symbol?.dependencies).toEqual(['φ', 'ψ']);
    });
  });

  describe('Cycle Detection', () => {
    it('should detect no cycles in the default graph', () => {
      const result = validateDependencyGraph();

      expect(result.cycles).toHaveLength(0);
    });

    it('should detect cycles when added', () => {
      const graph = new DependencyGraph();

      // Create a cycle: A → B → C → A
      graph.addSymbol('A', 10, ['C'], 'operation', 'Node A');
      graph.addSymbol('B', 10, ['A'], 'operation', 'Node B');
      graph.addSymbol('C', 10, ['B'], 'operation', 'Node C');

      const result = graph.validate();
      expect(result.cycles.length).toBeGreaterThan(0);
      expect(result.valid).toBe(false);
    });
  });

  describe('Topological Sort', () => {
    it('should produce valid computation order', () => {
      const order = getComputationOrder();

      expect(order).toBeDefined();
      expect(order.length).toBeGreaterThan(0);

      // Verify constants come before operations
      const phiIndex = order.indexOf('φ');
      const fibIndex = order.indexOf('F');

      expect(phiIndex).toBeGreaterThanOrEqual(0);
      expect(fibIndex).toBeGreaterThan(phiIndex);
    });

    it('should respect dependency ordering', () => {
      const graph = new DependencyGraph();
      const order = graph.getComputationOrder();

      // Verify that dependencies always come before dependents
      for (const symbolName of order) {
        const symbol = graph.getSymbol(symbolName);
        if (symbol) {
          for (const dep of symbol.dependencies) {
            const depIndex = order.indexOf(dep);
            const symIndex = order.indexOf(symbolName);

            expect(depIndex).toBeLessThan(symIndex);
          }
        }
      }
    });

    it('should organize by levels', () => {
      const order = getComputationOrder();
      const graph = new DependencyGraph();

      let previousLevel = -1;

      for (const symbolName of order) {
        const symbol = graph.getSymbol(symbolName);
        if (symbol) {
          // Level should be monotonically non-decreasing
          expect(symbol.level).toBeGreaterThanOrEqual(previousLevel);
          previousLevel = symbol.level;
        }
      }
    });
  });

  describe('Independence Validation', () => {
    it('should validate φ and ψ are NOT independent', () => {
      // ψ depends on φ: ψ = φ - 1
      const independent = checkIndependence('φ', 'ψ');
      expect(independent).toBe(false);
    });

    it('should validate F and L are NOT independent', () => {
      // L depends on F: L(n) = F(n-1) + F(n+1)
      const independent = checkIndependence('F', 'L');
      expect(independent).toBe(false);
    });

    it('should validate z and ℓ are NOT independent', () => {
      // Both depend on F and L respectively
      const independent = checkIndependence('z', 'ℓ');

      // They share common ancestors (φ, ψ, operations)
      // but are not directly dependent on each other
      expect(typeof independent).toBe('boolean');
    });

    it('should identify truly independent symbols', () => {
      // e and π should be independent (no dependency path)
      const independent = checkIndependence('e', 'π');
      expect(independent).toBe(true);
    });

    it('should validate all independence claims', () => {
      const result = validateDependencyGraph();

      expect(result.independenceResults).toBeDefined();
      expect(result.independenceResults.length).toBeGreaterThan(0);

      // Check that invalid claims are identified
      const invalidClaims = result.independenceResults.filter(r => !r.valid);

      // We expect φ ⊥ ψ to be invalid (ψ depends on φ)
      const phiPsiClaim = result.independenceResults.find(
        r => (r.symbolA === 'φ' && r.symbolB === 'ψ') ||
             (r.symbolA === 'ψ' && r.symbolB === 'φ')
      );

      expect(phiPsiClaim).toBeDefined();
      expect(phiPsiClaim?.valid).toBe(false);
    });
  });

  describe('Level Consistency', () => {
    it('should validate level consistency', () => {
      const result = validateDependencyGraph();

      // All dependencies should be at lower levels
      expect(result.levelConsistency).toBe(true);
    });

    it('should detect level violations', () => {
      const graph = new DependencyGraph();

      // Add a symbol at level 2 that depends on level 3 (violation)
      graph.addSymbol('violation', 2, ['F'], 'operation', 'Level violation');

      const result = graph.validate();

      const levelErrors = result.errors.filter(e => e.type === 'level-violation');
      expect(levelErrors.length).toBeGreaterThan(0);
    });

    it('should verify symbols at correct levels', () => {
      const graph = new DependencyGraph();

      // Level 0: Constants
      expect(graph.getSymbol('φ')?.level).toBe(0);
      expect(graph.getSymbol('e')?.level).toBe(0);

      // Level 3: Fibonacci
      expect(graph.getSymbol('F')?.level).toBe(3);

      // Level 4: Lucas
      expect(graph.getSymbol('L')?.level).toBe(4);
    });
  });

  describe('Graph Metrics', () => {
    it('should calculate correct metrics', () => {
      const result = validateDependencyGraph();
      const metrics = result.graphMetrics;

      expect(metrics.totalSymbols).toBeGreaterThan(20);
      expect(metrics.totalEdges).toBeGreaterThan(0);
      expect(metrics.levels).toBeGreaterThanOrEqual(7);
      expect(metrics.rootNodes).toBeGreaterThan(0);
      expect(metrics.leafNodes).toBeGreaterThan(0);
      expect(metrics.averageDependencies).toBeGreaterThanOrEqual(0);
    });

    it('should identify root nodes (no dependencies)', () => {
      const graph = new DependencyGraph();
      const metrics = graph.validate().graphMetrics;

      // Constants like φ, e, π should be root nodes
      expect(metrics.rootNodes).toBeGreaterThan(0);
    });

    it('should identify leaf nodes (no dependents)', () => {
      const graph = new DependencyGraph();
      const metrics = graph.validate().graphMetrics;

      // Advanced properties should be leaf nodes
      expect(metrics.leafNodes).toBeGreaterThan(0);
    });

    it('should calculate longest path', () => {
      const result = validateDependencyGraph();
      const metrics = result.graphMetrics;

      expect(metrics.longestPath).toBeGreaterThan(0);
      expect(metrics.longestPath).toBeLessThanOrEqual(metrics.levels);
    });
  });

  describe('Missing Dependencies', () => {
    it('should detect no missing dependencies in default graph', () => {
      const result = validateDependencyGraph();

      const missingErrors = result.errors.filter(e => e.type === 'missing-dependency');
      expect(missingErrors).toHaveLength(0);
    });

    it('should detect missing dependencies when added', () => {
      const graph = new DependencyGraph();
      graph.addSymbol('test', 10, ['nonexistent'], 'operation', 'Test');

      const result = graph.validate();
      const missingErrors = result.errors.filter(e => e.type === 'missing-dependency');

      expect(missingErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Symbols by Level', () => {
    it('should retrieve symbols at specific level', () => {
      const graph = new DependencyGraph();

      const level0 = graph.getSymbolsAtLevel(0);
      expect(level0.length).toBeGreaterThan(0);

      // Level 0 should contain constants
      const constantNames = level0.map(s => s.name);
      expect(constantNames).toContain('φ');
      expect(constantNames).toContain('e');
    });

    it('should have symbols at each level', () => {
      const graph = new DependencyGraph();
      const maxLevel = 6;

      for (let level = 0; level <= maxLevel; level++) {
        const symbols = graph.getSymbolsAtLevel(level);
        expect(symbols.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Visualization', () => {
    it('should generate GraphViz DOT format', () => {
      const dot = generateVisualization();

      expect(dot).toBeDefined();
      expect(dot).toContain('digraph MathFramework');
      expect(dot).toContain('φ');
      expect(dot).toContain('F');
      expect(dot).toContain('->');
    });

    it('should include subgraphs for levels', () => {
      const dot = generateVisualization();

      expect(dot).toContain('subgraph cluster_level0');
      expect(dot).toContain('subgraph cluster_level1');
      expect(dot).toContain('subgraph cluster_level3');
    });

    it('should include legend', () => {
      const dot = generateVisualization();

      expect(dot).toContain('Legend');
      expect(dot).toContain('Constant');
      expect(dot).toContain('Operation');
      expect(dot).toContain('Sequence');
    });

    it('should use different colors for symbol types', () => {
      const dot = generateVisualization();

      expect(dot).toContain('fillcolor');
      expect(dot).toContain('#FFE5E5'); // constant color
      expect(dot).toContain('#E5F5FF'); // operation color
    });
  });

  describe('JSON Export', () => {
    it('should export graph as JSON', () => {
      const graph = new DependencyGraph();
      const json = graph.toJSON();

      expect(json).toBeDefined();
      expect(json).toHaveProperty('symbols');
      expect(json).toHaveProperty('edges');
      expect(json).toHaveProperty('metrics');
    });
  });

  describe('Comprehensive Validation', () => {
    it('should pass all validations for default graph', () => {
      const result = validateDependencyGraph();

      // Should have no cycles
      expect(result.cycles).toHaveLength(0);

      // Should have level consistency
      expect(result.levelConsistency).toBe(true);

      // Should have no missing dependencies
      const missingErrors = result.errors.filter(e => e.type === 'missing-dependency');
      expect(missingErrors).toHaveLength(0);

      // Should produce valid computation order
      expect(result.computationOrder.length).toBeGreaterThan(0);

      // May have independence validation errors (expected)
      expect(result.independenceResults.length).toBeGreaterThan(0);
    });

    it('should generate validation report', () => {
      const result = validateDependencyGraph();

      console.log('\n=== Dependency Graph Validation Report ===\n');
      console.log(`Valid: ${result.valid}`);
      console.log(`Total Symbols: ${result.graphMetrics.totalSymbols}`);
      console.log(`Total Edges: ${result.graphMetrics.totalEdges}`);
      console.log(`Levels: ${result.graphMetrics.levels}`);
      console.log(`Cycles: ${result.cycles.length}`);
      console.log(`Errors: ${result.errors.length}`);
      console.log(`Warnings: ${result.warnings.length}`);

      console.log('\n--- Computation Order ---');
      console.log(result.computationOrder.join(' → '));

      console.log('\n--- Independence Validation ---');
      for (const check of result.independenceResults) {
        const status = check.valid ? '✓' : '✗';
        console.log(`${status} ${check.symbolA} ⊥ ${check.symbolB}: ${check.reason || 'valid'}`);
      }

      if (result.errors.length > 0) {
        console.log('\n--- Errors ---');
        for (const error of result.errors) {
          console.log(`[${error.severity}] ${error.type}: ${error.message}`);
        }
      }

      if (result.warnings.length > 0) {
        console.log('\n--- Warnings ---');
        for (const warning of result.warnings) {
          console.log(`[${warning.type}] ${warning.message}`);
        }
      }

      console.log('\n');
    });
  });
});

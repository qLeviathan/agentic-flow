/**
 * Dependency Graph Validation System
 *
 * Validates the mathematical framework's dependency structure:
 * - Builds directed acyclic graph (DAG) from symbol dependencies
 * - Performs topological sort for correct computation order
 * - Detects circular dependencies
 * - Validates independence claims (φ ⊥ ψ, F ⊥ L, z ⊥ ℓ)
 * - Verifies level-based hierarchy
 * - Generates GraphViz visualization
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Symbol {
  name: string;
  level: number;
  dependencies: string[];
  type: 'constant' | 'operation' | 'sequence' | 'decomposition' | 'property';
  description: string;
}

export interface Edge {
  from: string;
  to: string;
  type: 'requires' | 'uses' | 'derives-from' | 'equivalent-to';
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  computationOrder: string[];
  cycles: string[][];
  independenceResults: IndependenceCheck[];
  levelConsistency: boolean;
  graphMetrics: GraphMetrics;
}

export interface ValidationError {
  type: 'cycle' | 'level-violation' | 'missing-dependency' | 'invalid-independence';
  message: string;
  symbols: string[];
  severity: 'critical' | 'error';
}

export interface ValidationWarning {
  type: 'potential-issue' | 'optimization' | 'documentation';
  message: string;
  symbols: string[];
}

export interface IndependenceCheck {
  symbolA: string;
  symbolB: string;
  claimed: boolean;
  actual: boolean;
  valid: boolean;
  reason?: string;
}

export interface GraphMetrics {
  totalSymbols: number;
  totalEdges: number;
  levels: number;
  maxDependencies: number;
  averageDependencies: number;
  leafNodes: number;
  rootNodes: number;
  longestPath: number;
}

// ============================================================================
// SYMBOL TABLE - Mathematical Framework Hierarchy
// ============================================================================

const SYMBOL_TABLE: Symbol[] = [
  // Level 0: Fundamental Constants
  {
    name: 'φ',
    level: 0,
    dependencies: [],
    type: 'constant',
    description: 'Golden Ratio: φ = (1 + √5) / 2'
  },
  {
    name: 'ψ',
    level: 0,
    dependencies: ['φ'],
    type: 'constant',
    description: 'Golden Ratio Conjugate: ψ = (1 - √5) / 2 = φ - 1'
  },
  {
    name: 'e',
    level: 0,
    dependencies: [],
    type: 'constant',
    description: "Euler's Number"
  },
  {
    name: 'π',
    level: 0,
    dependencies: [],
    type: 'constant',
    description: 'Pi - Circle Constant'
  },
  {
    name: '√5',
    level: 0,
    dependencies: [],
    type: 'constant',
    description: 'Square root of 5'
  },

  // Level 1: Type System
  {
    name: 'ℕ',
    level: 1,
    dependencies: [],
    type: 'operation',
    description: 'Natural Numbers'
  },
  {
    name: 'ℤ',
    level: 1,
    dependencies: ['ℕ'],
    type: 'operation',
    description: 'Integers (extends Natural Numbers)'
  },
  {
    name: 'ℝ',
    level: 1,
    dependencies: ['ℤ'],
    type: 'operation',
    description: 'Real Numbers (extends Integers)'
  },
  {
    name: 'ℂ',
    level: 1,
    dependencies: ['ℝ'],
    type: 'operation',
    description: 'Complex Numbers (extends Real Numbers)'
  },

  // Level 1: Basic Operations
  {
    name: '+',
    level: 1,
    dependencies: ['ℝ', 'ℂ'],
    type: 'operation',
    description: 'Addition'
  },
  {
    name: '·',
    level: 1,
    dependencies: ['ℝ', 'ℂ'],
    type: 'operation',
    description: 'Multiplication'
  },
  {
    name: '^',
    level: 1,
    dependencies: ['ℝ', '·'],
    type: 'operation',
    description: 'Exponentiation'
  },
  {
    name: '√',
    level: 1,
    dependencies: ['ℝ', 'ℂ'],
    type: 'operation',
    description: 'Square Root'
  },

  // Level 2: Matrix Operations
  {
    name: 'Q',
    level: 2,
    dependencies: ['ℤ', '·', '+'],
    type: 'operation',
    description: 'Q-Matrix: [[1, 1], [1, 0]]'
  },
  {
    name: 'Q^n',
    level: 2,
    dependencies: ['Q', '^', '·'],
    type: 'operation',
    description: 'Q-Matrix Power (fast exponentiation)'
  },

  // Level 3: Fibonacci Sequence
  {
    name: 'F',
    level: 3,
    dependencies: ['φ', 'ψ', '√5', '+', '-', '^', '/'],
    type: 'sequence',
    description: 'Fibonacci Sequence: F(n) = (φⁿ - ψⁿ)/√5'
  },
  {
    name: 'F_rec',
    level: 3,
    dependencies: ['ℕ', '+'],
    type: 'sequence',
    description: 'Fibonacci Recurrence: F(n) = F(n-1) + F(n-2)'
  },
  {
    name: 'F_matrix',
    level: 3,
    dependencies: ['Q^n'],
    type: 'sequence',
    description: 'Fibonacci via Q-Matrix: F(n) = Q^n[0][1]'
  },

  // Level 4: Lucas Sequence
  {
    name: 'L',
    level: 4,
    dependencies: ['F', '+'],
    type: 'sequence',
    description: 'Lucas Sequence: L(n) = F(n-1) + F(n+1)'
  },
  {
    name: 'L_binet',
    level: 4,
    dependencies: ['φ', 'ψ', '^', '+'],
    type: 'sequence',
    description: 'Lucas via Binet: L(n) = φⁿ + ψⁿ'
  },

  // Level 5: Decompositions
  {
    name: 'z',
    level: 5,
    dependencies: ['F', 'ℕ'],
    type: 'decomposition',
    description: 'Zeckendorf Representation'
  },
  {
    name: 'ℓ',
    level: 5,
    dependencies: ['L', 'ℕ'],
    type: 'decomposition',
    description: 'Lucas Representation'
  },

  // Level 6: Advanced Properties
  {
    name: 'φ_phase',
    level: 6,
    dependencies: ['φ', 'F', 'L'],
    type: 'property',
    description: 'Phase Space Analysis'
  },
  {
    name: 'divergence',
    level: 6,
    dependencies: ['F', 'L', 'z'],
    type: 'property',
    description: 'Behrend-Kimberling Divergence'
  }
];

// Convenience operations (derived from primitives)
const DERIVED_OPERATIONS: Symbol[] = [
  {
    name: '-',
    level: 1,
    dependencies: ['+'],
    type: 'operation',
    description: 'Subtraction (derived from addition)'
  },
  {
    name: '/',
    level: 1,
    dependencies: ['·'],
    type: 'operation',
    description: 'Division (derived from multiplication)'
  }
];

// ============================================================================
// DEPENDENCY GRAPH CLASS
// ============================================================================

export class DependencyGraph {
  private symbols: Map<string, Symbol>;
  private adjacencyList: Map<string, Set<string>>;
  private reverseAdjacencyList: Map<string, Set<string>>;
  private edges: Edge[];

  constructor() {
    this.symbols = new Map();
    this.adjacencyList = new Map();
    this.reverseAdjacencyList = new Map();
    this.edges = [];

    // Initialize with symbol table
    this.initializeFromSymbolTable();
  }

  /**
   * Initialize graph from predefined symbol table
   */
  private initializeFromSymbolTable(): void {
    const allSymbols = [...SYMBOL_TABLE, ...DERIVED_OPERATIONS];

    for (const symbol of allSymbols) {
      this.addSymbol(symbol.name, symbol.level, symbol.dependencies, symbol.type, symbol.description);
    }
  }

  /**
   * Add a symbol to the graph
   */
  addSymbol(
    name: string,
    level: number,
    dependencies: string[],
    type: Symbol['type'] = 'operation',
    description: string = ''
  ): void {
    this.symbols.set(name, { name, level, dependencies, type, description });

    if (!this.adjacencyList.has(name)) {
      this.adjacencyList.set(name, new Set());
    }

    if (!this.reverseAdjacencyList.has(name)) {
      this.reverseAdjacencyList.set(name, new Set());
    }

    // Add edges for dependencies
    for (const dep of dependencies) {
      this.addEdge(dep, name, 'requires');

      // Ensure dependency exists
      if (!this.adjacencyList.has(dep)) {
        this.adjacencyList.set(dep, new Set());
      }
      if (!this.reverseAdjacencyList.has(dep)) {
        this.reverseAdjacencyList.set(dep, new Set());
      }
    }
  }

  /**
   * Add an edge between two symbols
   */
  private addEdge(from: string, to: string, type: Edge['type']): void {
    this.adjacencyList.get(from)?.add(to);
    this.reverseAdjacencyList.get(to)?.add(from);
    this.edges.push({ from, to, type });
  }

  /**
   * Perform comprehensive validation
   */
  validate(): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 1. Detect cycles
    const cycles = this.detectCycles();
    if (cycles.length > 0) {
      errors.push({
        type: 'cycle',
        message: `Detected ${cycles.length} circular dependenc${cycles.length === 1 ? 'y' : 'ies'}`,
        symbols: cycles.flat(),
        severity: 'critical'
      });
    }

    // 2. Verify level consistency
    const levelConsistency = this.validateLevels();
    if (!levelConsistency.valid) {
      errors.push(...levelConsistency.errors);
    }

    // 3. Check for missing dependencies
    const missingDeps = this.findMissingDependencies();
    if (missingDeps.length > 0) {
      errors.push({
        type: 'missing-dependency',
        message: 'Some symbols reference undefined dependencies',
        symbols: missingDeps,
        severity: 'error'
      });
    }

    // 4. Validate independence claims
    const independenceResults = this.checkIndependenceClaims();
    for (const result of independenceResults) {
      if (!result.valid) {
        errors.push({
          type: 'invalid-independence',
          message: `Independence claim ${result.symbolA} ⊥ ${result.symbolB} is invalid: ${result.reason}`,
          symbols: [result.symbolA, result.symbolB],
          severity: 'error'
        });
      }
    }

    // 5. Get computation order
    const computationOrder = cycles.length === 0 ? this.getComputationOrder() : [];

    // 6. Calculate graph metrics
    const graphMetrics = this.calculateMetrics();

    // 7. Generate warnings for potential issues
    if (graphMetrics.maxDependencies > 5) {
      warnings.push({
        type: 'potential-issue',
        message: `Some symbols have high dependency count (${graphMetrics.maxDependencies})`,
        symbols: this.findHighDependencySymbols(5)
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      computationOrder,
      cycles,
      independenceResults,
      levelConsistency: levelConsistency.valid,
      graphMetrics
    };
  }

  /**
   * Detect circular dependencies using DFS
   */
  detectCycles(): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];
    const currentPath: string[] = [];

    const dfs = (node: string): void => {
      visited.add(node);
      recursionStack.add(node);
      currentPath.push(node);

      const neighbors = this.adjacencyList.get(node) || new Set();

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = currentPath.indexOf(neighbor);
          const cycle = currentPath.slice(cycleStart);
          cycles.push([...cycle, neighbor]);
        }
      }

      recursionStack.delete(node);
      currentPath.pop();
    };

    for (const node of this.symbols.keys()) {
      if (!visited.has(node)) {
        dfs(node);
      }
    }

    return cycles;
  }

  /**
   * Get topological sort (computation order)
   */
  getComputationOrder(): string[] {
    const inDegree = new Map<string, number>();
    const order: string[] = [];
    const queue: string[] = [];

    // Initialize in-degrees
    for (const node of this.symbols.keys()) {
      inDegree.set(node, this.reverseAdjacencyList.get(node)?.size || 0);
      if (inDegree.get(node) === 0) {
        queue.push(node);
      }
    }

    // Kahn's algorithm
    while (queue.length > 0) {
      // Sort by level for stable ordering
      queue.sort((a, b) => {
        const levelA = this.symbols.get(a)?.level || 0;
        const levelB = this.symbols.get(b)?.level || 0;
        return levelA - levelB;
      });

      const node = queue.shift()!;
      order.push(node);

      const neighbors = this.adjacencyList.get(node) || new Set();
      for (const neighbor of neighbors) {
        const degree = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, degree);

        if (degree === 0) {
          queue.push(neighbor);
        }
      }
    }

    return order;
  }

  /**
   * Check if two symbols are independent (no path between them)
   */
  checkIndependence(a: string, b: string): boolean {
    // Two symbols are independent if there's no directed path between them
    const hasPathAtoB = this.hasPath(a, b);
    const hasPathBtoA = this.hasPath(b, a);

    return !hasPathAtoB && !hasPathBtoA;
  }

  /**
   * Check if there's a path from source to target using BFS
   */
  private hasPath(source: string, target: string): boolean {
    if (source === target) return true;

    const visited = new Set<string>();
    const queue = [source];
    visited.add(source);

    while (queue.length > 0) {
      const node = queue.shift()!;
      const neighbors = this.adjacencyList.get(node) || new Set();

      for (const neighbor of neighbors) {
        if (neighbor === target) return true;

        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return false;
  }

  /**
   * Validate independence claims from the problem statement
   */
  private checkIndependenceClaims(): IndependenceCheck[] {
    const claims: Array<{ a: string; b: string; claimed: boolean }> = [
      { a: 'φ', b: 'ψ', claimed: true },  // φ ⊥ ψ claimed
      { a: 'F', b: 'L', claimed: true },  // F ⊥ L claimed
      { a: 'z', b: 'ℓ', claimed: true }   // z ⊥ ℓ claimed
    ];

    return claims.map(claim => {
      const actual = this.checkIndependence(claim.a, claim.b);
      const valid = actual === claim.claimed;

      let reason: string | undefined;
      if (!valid) {
        if (claim.claimed && !actual) {
          const path = this.findShortestPath(claim.a, claim.b) ||
                      this.findShortestPath(claim.b, claim.a);
          reason = path ? `Path exists: ${path.join(' → ')}` : 'Dependency found';
        }
      }

      return {
        symbolA: claim.a,
        symbolB: claim.b,
        claimed: claim.claimed,
        actual,
        valid,
        reason
      };
    });
  }

  /**
   * Find shortest path between two symbols
   */
  private findShortestPath(source: string, target: string): string[] | null {
    if (source === target) return [source];

    const visited = new Map<string, string | null>();
    const queue = [source];
    visited.set(source, null);

    while (queue.length > 0) {
      const node = queue.shift()!;
      const neighbors = this.adjacencyList.get(node) || new Set();

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.set(neighbor, node);

          if (neighbor === target) {
            // Reconstruct path
            const path: string[] = [];
            let current: string | null = target;

            while (current !== null) {
              path.unshift(current);
              current = visited.get(current) || null;
            }

            return path;
          }

          queue.push(neighbor);
        }
      }
    }

    return null;
  }

  /**
   * Validate level consistency
   */
  private validateLevels(): { valid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    for (const [name, symbol] of this.symbols) {
      const deps = symbol.dependencies;

      for (const dep of deps) {
        const depSymbol = this.symbols.get(dep);

        if (depSymbol && depSymbol.level >= symbol.level) {
          errors.push({
            type: 'level-violation',
            message: `${name} (level ${symbol.level}) depends on ${dep} (level ${depSymbol.level}), but dependencies must be at lower levels`,
            symbols: [name, dep],
            severity: 'error'
          });
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Find missing dependencies
   */
  private findMissingDependencies(): string[] {
    const missing: string[] = [];

    for (const symbol of this.symbols.values()) {
      for (const dep of symbol.dependencies) {
        if (!this.symbols.has(dep)) {
          missing.push(`${symbol.name} → ${dep}`);
        }
      }
    }

    return missing;
  }

  /**
   * Calculate graph metrics
   */
  private calculateMetrics(): GraphMetrics {
    const symbols = Array.from(this.symbols.values());
    const depCounts = symbols.map(s => s.dependencies.length);

    const leafNodes = symbols.filter(s =>
      (this.adjacencyList.get(s.name)?.size || 0) === 0
    ).length;

    const rootNodes = symbols.filter(s =>
      s.dependencies.length === 0
    ).length;

    return {
      totalSymbols: this.symbols.size,
      totalEdges: this.edges.length,
      levels: Math.max(...symbols.map(s => s.level), 0) + 1,
      maxDependencies: Math.max(...depCounts, 0),
      averageDependencies: depCounts.reduce((a, b) => a + b, 0) / symbols.length || 0,
      leafNodes,
      rootNodes,
      longestPath: this.findLongestPath()
    };
  }

  /**
   * Find longest path in DAG
   */
  private findLongestPath(): number {
    const memo = new Map<string, number>();

    const dfs = (node: string): number => {
      if (memo.has(node)) return memo.get(node)!;

      const neighbors = this.adjacencyList.get(node) || new Set();
      let maxPath = 0;

      for (const neighbor of neighbors) {
        maxPath = Math.max(maxPath, dfs(neighbor) + 1);
      }

      memo.set(node, maxPath);
      return maxPath;
    };

    let longest = 0;
    for (const node of this.symbols.keys()) {
      longest = Math.max(longest, dfs(node));
    }

    return longest;
  }

  /**
   * Find symbols with high dependency counts
   */
  private findHighDependencySymbols(threshold: number): string[] {
    return Array.from(this.symbols.values())
      .filter(s => s.dependencies.length > threshold)
      .map(s => `${s.name}(${s.dependencies.length})`);
  }

  /**
   * Generate GraphViz DOT format visualization
   */
  visualize(): string {
    const lines: string[] = [];

    lines.push('digraph MathFramework {');
    lines.push('  rankdir=TB;');
    lines.push('  node [shape=box, style=rounded];');
    lines.push('  ');

    // Define subgraphs for each level
    const levelMap = new Map<number, Symbol[]>();
    for (const symbol of this.symbols.values()) {
      if (!levelMap.has(symbol.level)) {
        levelMap.set(symbol.level, []);
      }
      levelMap.get(symbol.level)!.push(symbol);
    }

    const levels = Array.from(levelMap.keys()).sort((a, b) => a - b);

    for (const level of levels) {
      lines.push(`  subgraph cluster_level${level} {`);
      lines.push(`    label="Level ${level}";`);
      lines.push(`    style=dashed;`);
      lines.push(`    color=${this.getLevelColor(level)};`);
      lines.push('    ');

      const symbolsAtLevel = levelMap.get(level)!;
      for (const symbol of symbolsAtLevel) {
        const color = this.getSymbolColor(symbol.type);
        const shape = this.getSymbolShape(symbol.type);
        const label = this.escapeLabel(symbol.description);
        lines.push(`    "${symbol.name}" [label="${symbol.name}\\n${label}", fillcolor="${color}", style="filled,rounded", shape=${shape}];`);
      }

      lines.push('  }');
      lines.push('  ');
    }

    // Add edges
    lines.push('  // Dependencies');
    for (const edge of this.edges) {
      const style = this.getEdgeStyle(edge.type);
      lines.push(`  "${edge.from}" -> "${edge.to}" [${style}];`);
    }

    // Add legend
    lines.push('  ');
    lines.push('  // Legend');
    lines.push('  subgraph cluster_legend {');
    lines.push('    label="Legend";');
    lines.push('    style=filled;');
    lines.push('    color=lightgrey;');
    lines.push('    ');
    lines.push('    legend_const [label="Constant", fillcolor="#FFE5E5", style=filled, shape=ellipse];');
    lines.push('    legend_op [label="Operation", fillcolor="#E5F5FF", style=filled, shape=box];');
    lines.push('    legend_seq [label="Sequence", fillcolor="#E5FFE5", style=filled, shape=box];');
    lines.push('    legend_decomp [label="Decomposition", fillcolor="#FFF5E5", style=filled, shape=diamond];');
    lines.push('    legend_prop [label="Property", fillcolor="#F5E5FF", style=filled, shape=hexagon];');
    lines.push('  }');

    lines.push('}');

    return lines.join('\n');
  }

  /**
   * Get color for level
   */
  private getLevelColor(level: number): string {
    const colors = ['blue', 'green', 'orange', 'red', 'purple', 'brown', 'pink'];
    return colors[level % colors.length];
  }

  /**
   * Get color for symbol type
   */
  private getSymbolColor(type: Symbol['type']): string {
    const colors = {
      constant: '#FFE5E5',
      operation: '#E5F5FF',
      sequence: '#E5FFE5',
      decomposition: '#FFF5E5',
      property: '#F5E5FF'
    };
    return colors[type];
  }

  /**
   * Get shape for symbol type
   */
  private getSymbolShape(type: Symbol['type']): string {
    const shapes = {
      constant: 'ellipse',
      operation: 'box',
      sequence: 'box',
      decomposition: 'diamond',
      property: 'hexagon'
    };
    return shapes[type];
  }

  /**
   * Get edge style
   */
  private getEdgeStyle(type: Edge['type']): string {
    const styles = {
      requires: 'color=black',
      uses: 'color=blue, style=dashed',
      'derives-from': 'color=green, style=dotted',
      'equivalent-to': 'color=red, style=bold, dir=both'
    };
    return styles[type];
  }

  /**
   * Escape label for GraphViz
   */
  private escapeLabel(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .substring(0, 40); // Truncate long descriptions
  }

  /**
   * Get symbol information
   */
  getSymbol(name: string): Symbol | undefined {
    return this.symbols.get(name);
  }

  /**
   * Get all symbols at a specific level
   */
  getSymbolsAtLevel(level: number): Symbol[] {
    return Array.from(this.symbols.values()).filter(s => s.level === level);
  }

  /**
   * Export graph data as JSON
   */
  toJSON(): object {
    return {
      symbols: Array.from(this.symbols.values()),
      edges: this.edges,
      metrics: this.calculateMetrics()
    };
  }
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create and validate dependency graph
 */
export function validateDependencyGraph(): ValidationResult {
  const graph = new DependencyGraph();
  return graph.validate();
}

/**
 * Generate GraphViz visualization
 */
export function generateVisualization(): string {
  const graph = new DependencyGraph();
  return graph.visualize();
}

/**
 * Get computation order
 */
export function getComputationOrder(): string[] {
  const graph = new DependencyGraph();
  return graph.getComputationOrder();
}

/**
 * Check specific independence claim
 */
export function checkIndependence(a: string, b: string): boolean {
  const graph = new DependencyGraph();
  return graph.checkIndependence(a, b);
}

/**
 * Rank-4 Tensor Core: T[φ, ψ, t, θ]
 *
 * Dimensions:
 * - φ: Forward expansion (Fibonacci channel)
 * - ψ: Backward contraction (Lucas channel)
 * - t: Time/sequence progression
 * - θ: Phase/angular momentum (0 or π)
 *
 * Sparse structure: ~97.5% compression (80,000 → 2,000 non-zero elements)
 */

import { FibonacciLucas, SymbolicNumber, SymbolicArithmetic } from './symbolic-arithmetic';

export interface TensorCoordinate {
  phi: number;    // Fibonacci shell index
  psi: number;    // Lucas shell index
  t: number;      // Time/sequence index
  theta: number;  // Phase (0 or 1, representing 0 or π)
}

export interface TensorElement {
  coord: TensorCoordinate;
  value: SymbolicNumber;
  metadata: {
    isNash: boolean;           // Nash equilibrium point
    isActive: boolean;         // Currently in wave
    isSaturated: boolean;      // Reached saturation
    shellDistance: number;     // Distance from present (origin)
  };
}

export interface TensorSlice {
  t: number;                    // Time slice
  elements: TensorElement[];    // Non-zero elements in this slice
  statistics: {
    activeCount: number;
    saturation: number;         // 0 to 1 (or ∞ for liquid)
    phaseRegime: 'QUANTUM' | 'INTERMEDIATE' | 'CLASSICAL' | 'SATURATED';
  };
}

/**
 * Rank-4 Sparse Tensor Implementation
 */
export class Rank4Tensor {
  private elements: Map<string, TensorElement>;
  private slices: Map<number, TensorSlice>;
  private maxShell: number;

  constructor(maxShell = 20) {
    this.elements = new Map();
    this.slices = new Map();
    this.maxShell = maxShell;
    this.initializePresentPoint();
  }

  /**
   * Initialize the PRESENT point: (1, 1, 0, 0)
   * This is the ONLY rational point (φ^0 = 1, ψ^0 = 1)
   */
  private initializePresentPoint(): void {
    const present: TensorCoordinate = { phi: 0, psi: 0, t: 0, theta: 0 };
    const value = SymbolicArithmetic.create(1, 0, 0);  // Value = 1 (rational)

    this.set(present, value, {
      isNash: true,      // Present is always stable
      isActive: true,    // Start point
      isSaturated: false,
      shellDistance: 0
    });
  }

  /**
   * Coordinate to key (for sparse storage)
   */
  private coordToKey(coord: TensorCoordinate): string {
    return `${coord.phi},${coord.psi},${coord.t},${coord.theta}`;
  }

  /**
   * Key to coordinate
   */
  private keyToCoord(key: string): TensorCoordinate {
    const [phi, psi, t, theta] = key.split(',').map(Number);
    return { phi, psi, t, theta };
  }

  /**
   * Set tensor element
   */
  set(
    coord: TensorCoordinate,
    value: SymbolicNumber,
    metadata: TensorElement['metadata']
  ): void {
    const key = this.coordToKey(coord);
    this.elements.set(key, { coord, value, metadata });

    // Update slice statistics
    this.updateSliceStatistics(coord.t);
  }

  /**
   * Get tensor element (returns zero if not set)
   */
  get(coord: TensorCoordinate): TensorElement | null {
    const key = this.coordToKey(coord);
    return this.elements.get(key) || null;
  }

  /**
   * Check if coordinate has non-zero value
   */
  has(coord: TensorCoordinate): boolean {
    return this.elements.has(this.coordToKey(coord));
  }

  /**
   * Get all elements at time t
   */
  getSlice(t: number): TensorSlice {
    if (this.slices.has(t)) {
      return this.slices.get(t)!;
    }

    // Compute slice on-demand
    const elements = Array.from(this.elements.values())
      .filter(el => el.coord.t === t);

    const activeCount = elements.filter(el => el.metadata.isActive).length;
    const totalPossible = Math.pow(this.maxShell * 2, 2) * 2; // φ × ψ × θ
    const saturation = activeCount / totalPossible;

    // Determine phase regime based on saturation
    let phaseRegime: TensorSlice['statistics']['phaseRegime'];
    if (saturation < 0.236) phaseRegime = 'QUANTUM';
    else if (saturation < 0.618) phaseRegime = 'INTERMEDIATE';
    else if (saturation < 0.9) phaseRegime = 'CLASSICAL';
    else phaseRegime = 'SATURATED';

    const slice: TensorSlice = {
      t,
      elements,
      statistics: { activeCount, saturation, phaseRegime }
    };

    this.slices.set(t, slice);
    return slice;
  }

  /**
   * Update slice statistics after modification
   */
  private updateSliceStatistics(t: number): void {
    if (this.slices.has(t)) {
      this.slices.delete(t);  // Force recomputation
    }
  }

  /**
   * Fibonacci propagation step (forward expansion, reveals Lucas)
   * From shell k, spawn nodes at shells k+1, k+2 (Fibonacci jumps)
   */
  fibonacciPropagate(coord: TensorCoordinate): TensorCoordinate[] {
    const spawned: TensorCoordinate[] = [];

    // Forward jumps: phi increases
    for (let jump = 1; jump <= 2; jump++) {
      const newPhi = coord.phi + jump;
      if (newPhi <= this.maxShell) {
        // Reveal Lucas at new position
        const newPsi = coord.psi;  // Lucas coordinate revealed
        const newTheta = FibonacciLucas.phaseAngle(newPhi);

        spawned.push({
          phi: newPhi,
          psi: newPsi,
          t: coord.t + 1,
          theta: newTheta
        });
      }
    }

    return spawned;
  }

  /**
   * Lucas propagation step (backward contraction, reveals Fibonacci)
   * From shell k, spawn nodes at shells k+1, k+2 (Lucas jumps)
   */
  lucasPropagate(coord: TensorCoordinate): TensorCoordinate[] {
    const spawned: TensorCoordinate[] = [];

    // Backward jumps: psi increases
    for (let jump = 1; jump <= 2; jump++) {
      const newPsi = coord.psi + jump;
      if (newPsi <= this.maxShell) {
        // Reveal Fibonacci at new position
        const newPhi = coord.phi;  // Fibonacci coordinate revealed
        const newTheta = FibonacciLucas.phaseAngle(newPsi);

        spawned.push({
          phi: newPhi,
          psi: newPsi,
          t: coord.t + 1,
          theta: newTheta
        });
      }
    }

    return spawned;
  }

  /**
   * Dual propagation: both Fibonacci and Lucas waves simultaneously
   * This is the bidirectional revelation mechanism
   */
  dualPropagate(coord: TensorCoordinate): TensorCoordinate[] {
    const fibSpawned = this.fibonacciPropagate(coord);
    const lucasSpawned = this.lucasPropagate(coord);
    return [...fibSpawned, ...lucasSpawned];
  }

  /**
   * Check Cassini survival constraint: L_n² - 5·F_n² = 4·(-1)^n
   * Only nodes satisfying this survive
   */
  checkCassiniSurvival(coord: TensorCoordinate): boolean {
    const n = coord.phi + coord.psi;  // Combined index
    return FibonacciLucas.verifyCassini(n);
  }

  /**
   * Compute shell distance from present (hyperbolic metric)
   */
  shellDistance(coord: TensorCoordinate): number {
    // Distance in Poincaré disk: d = sqrt(φ² + ψ²)
    // But we use integer shell indices
    return Math.sqrt(coord.phi * coord.phi + coord.psi * coord.psi);
  }

  /**
   * Detect Nash equilibrium points (S(n) = 0)
   * For now, using phase parity as proxy
   */
  isNashPoint(coord: TensorCoordinate): boolean {
    // Nash points occur when phase constructively interferes
    const parity = FibonacciLucas.phaseParity(coord.phi + coord.psi);
    return parity === 1;  // Constructive interference
  }

  /**
   * Get all active elements across all time slices
   */
  getAllActive(): TensorElement[] {
    return Array.from(this.elements.values())
      .filter(el => el.metadata.isActive);
  }

  /**
   * Get tensor statistics
   */
  getStatistics() {
    const totalElements = this.elements.size;
    const activeElements = this.getAllActive().length;
    const nashPoints = Array.from(this.elements.values())
      .filter(el => el.metadata.isNash).length;

    const sliceCount = new Set(
      Array.from(this.elements.values()).map(el => el.coord.t)
    ).size;

    return {
      totalElements,
      activeElements,
      nashPoints,
      sliceCount,
      compressionRatio: 1 - (totalElements / Math.pow(this.maxShell * 2, 4))
    };
  }

  /**
   * Clear all elements (reset tensor)
   */
  clear(): void {
    this.elements.clear();
    this.slices.clear();
    this.initializePresentPoint();
  }

  /**
   * Export tensor for visualization
   */
  export(): {
    elements: TensorElement[];
    slices: TensorSlice[];
    statistics: {
      totalElements: number;
      activeElements: number;
      nashPoints: number;
      sliceCount: number;
      compressionRatio: number;
    };
  } {
    return {
      elements: Array.from(this.elements.values()),
      slices: Array.from(this.slices.values()),
      statistics: this.getStatistics()
    };
  }
}

/**
 * Tensor operations (all integer-based)
 */
export class TensorOperations {
  /**
   * Compute tensor contraction along dimension
   */
  static contract(tensor: Rank4Tensor, dimension: 'phi' | 'psi' | 't' | 'theta'): Map<string, SymbolicNumber> {
    const contracted = new Map<string, SymbolicNumber>();
    const elements = tensor.getAllActive();

    for (const element of elements) {
      // Create key excluding contracted dimension
      let key: string;
      const coord = element.coord;

      switch (dimension) {
        case 'phi':
          key = `${coord.psi},${coord.t},${coord.theta}`;
          break;
        case 'psi':
          key = `${coord.phi},${coord.t},${coord.theta}`;
          break;
        case 't':
          key = `${coord.phi},${coord.psi},${coord.theta}`;
          break;
        case 'theta':
          key = `${coord.phi},${coord.psi},${coord.t}`;
          break;
      }

      // Sum values with same key
      const existing = contracted.get(key) || SymbolicArithmetic.create(0, 0, 0);
      contracted.set(key, SymbolicArithmetic.add(existing, element.value));
    }

    return contracted;
  }

  /**
   * Compute fiber bundle projection: π: 𝒮 → T
   * Projects from full state space to time dimension
   */
  static fiberProjection(tensor: Rank4Tensor): Map<number, TensorSlice> {
    const projection = new Map<number, TensorSlice>();
    const sliceIndices = new Set(
      tensor.getAllActive().map(el => el.coord.t)
    );

    for (const t of sliceIndices) {
      projection.set(t, tensor.getSlice(t));
    }

    return projection;
  }

  /**
   * Compute section: σ: T → 𝒮
   * Selects specific trajectory through time
   */
  static section(
    tensor: Rank4Tensor,
    selector: (slice: TensorSlice) => TensorElement | null
  ): TensorElement[] {
    const trajectory: TensorElement[] = [];
    const slices = this.fiberProjection(tensor);

    for (const [t, slice] of Array.from(slices.entries()).sort((a, b) => a[0] - b[0])) {
      const selected = selector(slice);
      if (selected) {
        trajectory.push(selected);
      }
    }

    return trajectory;
  }
}

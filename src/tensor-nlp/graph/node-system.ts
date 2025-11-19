/**
 * Graph Construction and Node Development System
 * Priority: User's main focus area for productionalization
 *
 * Features:
 * - Node spawning at Fibonacci-spaced vertices
 * - Dual lattice propagation (Fibonacci ↔ Lucas)
 * - Collision detection and interference
 * - Saturation tracking and phase transitions
 * - Cassini survival filtering
 */

import {
  GraphNode,
  GraphEdge,
  TensorGraph,
  PropagationEvent,
  CollisionEvent,
  GraphSnapshot,
  SaturationState,
  NodeQuery,
  NodeState,
  WaveType,
  EdgeType,
  PhaseRegime
} from './node-types';
import { Rank4Tensor, TensorCoordinate, TensorElement, TensorOperations } from '../core/tensor-core';
import { FibonacciLucas, SymbolicArithmetic, SymbolicNumber, HyperbolicGeometry } from '../core/symbolic-arithmetic';

/**
 * Main graph construction system
 */
export class NodeSystem {
  private graph: TensorGraph;
  private tensor: Rank4Tensor;
  private currentTime: number;
  private nodeIdCounter: number;
  private eventIdCounter: number;

  constructor(config = { maxShell: 20, enableDualPropagation: true, enableCassiniFiltering: true, saturationThreshold: 0.9 }) {
    this.tensor = new Rank4Tensor(config.maxShell);
    this.currentTime = 0;
    this.nodeIdCounter = 0;
    this.eventIdCounter = 0;

    this.graph = {
      nodes: new Map(),
      edges: new Map(),
      snapshots: new Map(),
      propagationHistory: [],
      collisionHistory: [],
      config
    };

    // Initialize with PRESENT point
    this.initializePresentNode();
  }

  /**
   * Initialize the origin node at PRESENT (0, 0, 0, 0)
   */
  private initializePresentNode(): void {
    const presentCoord: TensorCoordinate = { phi: 0, psi: 0, t: 0, theta: 0 };
    const presentValue = SymbolicArithmetic.create(1, 0, 0);  // Rational anchor

    const presentNode: GraphNode = {
      id: this.generateNodeId(),
      coord: presentCoord,
      value: presentValue,
      state: 'ACTIVE',
      waveType: 'DUAL',
      createdAt: 0,
      activatedAt: 0,
      depth: 0,
      generation: 0,
      parent: null,
      children: [],
      neighbors: [],
      phase: 0,
      parity: 1,
      isNash: true,
      cassiniValid: true,
      collisionCount: 0,
      interferencePattern: 'NONE'
    };

    this.graph.nodes.set(presentNode.id, presentNode);
    this.createSnapshot();
  }

  /**
   * Generate unique node ID
   */
  private generateNodeId(): string {
    return `node_${this.nodeIdCounter++}`;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${this.eventIdCounter++}`;
  }

  /**
   * Create a new node at coordinate
   */
  createNode(
    coord: TensorCoordinate,
    value: SymbolicNumber,
    waveType: WaveType,
    parent: GraphNode | null
  ): GraphNode {
    const node: GraphNode = {
      id: this.generateNodeId(),
      coord,
      value,
      state: 'LATENT',  // Start as latent until activated
      waveType,
      createdAt: this.currentTime,
      activatedAt: null,
      depth: this.tensor.shellDistance(coord),
      generation: parent ? parent.generation + 1 : 0,
      parent: parent?.id || null,
      children: [],
      neighbors: [],
      phase: coord.theta,
      parity: FibonacciLucas.phaseParity(coord.phi + coord.psi),
      isNash: this.tensor.isNashPoint(coord),
      cassiniValid: this.tensor.checkCassiniSurvival(coord),
      collisionCount: 0,
      interferencePattern: 'NONE'
    };

    // Apply Cassini filtering if enabled
    if (this.graph.config.enableCassiniFiltering && !node.cassiniValid) {
      return node;  // Don't add to graph, return for tracking only
    }

    this.graph.nodes.set(node.id, node);

    // Link to parent
    if (parent) {
      parent.children.push(node.id);
      this.createEdge(parent.id, node.id, this.getEdgeTypeFromWave(waveType));
    }

    return node;
  }

  /**
   * Activate a latent node
   */
  activateNode(nodeId: string): void {
    const node = this.graph.nodes.get(nodeId);
    if (!node) return;

    if (node.state === 'LATENT') {
      node.state = 'ACTIVE';
      node.activatedAt = this.currentTime;
    }
  }

  /**
   * Create edge between nodes
   */
  createEdge(sourceId: string, targetId: string, edgeType: EdgeType): GraphEdge {
    const source = this.graph.nodes.get(sourceId);
    const target = this.graph.nodes.get(targetId);
    if (!source || !target) throw new Error('Invalid node IDs for edge');

    const fibGap = Math.abs(target.coord.phi - source.coord.phi) +
                   Math.abs(target.coord.psi - source.coord.psi);

    const edge: GraphEdge = {
      id: `edge_${sourceId}_${targetId}`,
      source: sourceId,
      target: targetId,
      edgeType,
      weight: 1.0,
      fibonacciGap: fibGap,
      createdAt: this.currentTime,
      isActive: true
    };

    this.graph.edges.set(edge.id, edge);

    // Update neighbor relationships
    if (!source.neighbors.includes(targetId)) {
      source.neighbors.push(targetId);
    }
    if (!target.neighbors.includes(sourceId)) {
      target.neighbors.push(sourceId);
    }

    return edge;
  }

  /**
   * Propagate wave from a node (Fibonacci, Lucas, or Dual)
   */
  propagateWave(nodeId: string, waveType: WaveType = 'DUAL'): PropagationEvent {
    const sourceNode = this.graph.nodes.get(nodeId);
    if (!sourceNode) throw new Error(`Node ${nodeId} not found`);

    const spawned: string[] = [];
    const activated: string[] = [];
    const collisions: string[] = [];
    const targetCoords: TensorCoordinate[] = [];

    // Determine propagation coordinates based on wave type
    if (waveType === 'FIBONACCI' || waveType === 'DUAL') {
      targetCoords.push(...this.tensor.fibonacciPropagate(sourceNode.coord));
    }
    if (waveType === 'LUCAS' || waveType === 'DUAL') {
      targetCoords.push(...this.tensor.lucasPropagate(sourceNode.coord));
    }

    // Process each target coordinate
    for (const targetCoord of targetCoords) {
      const existingNode = this.findNodeAtCoordinate(targetCoord);

      if (existingNode) {
        // Node exists - activate if latent, or mark collision
        if (existingNode.state === 'LATENT') {
          this.activateNode(existingNode.id);
          activated.push(existingNode.id);
        } else if (existingNode.state === 'ACTIVE') {
          // Collision detected
          this.handleCollision(existingNode, waveType, sourceNode.value);
          collisions.push(existingNode.id);
        }
      } else {
        // Create new node
        const newValue = this.computePropagatedValue(sourceNode.value, targetCoord);
        const newNode = this.createNode(targetCoord, newValue, waveType, sourceNode);

        if (this.graph.nodes.has(newNode.id)) {  // Check if it survived Cassini filtering
          spawned.push(newNode.id);
          this.activateNode(newNode.id);  // Immediately activate
        }
      }
    }

    // Create propagation event
    const event: PropagationEvent = {
      eventId: this.generateEventId(),
      timestamp: this.currentTime,
      sourceNode: nodeId,
      targetNodes: targetCoords.map(coord => this.coordToString(coord)),
      waveType,
      amplitude: sourceNode.value,
      phase: sourceNode.phase,
      shellDistance: sourceNode.depth,
      spawned,
      activated,
      collisions
    };

    this.graph.propagationHistory.push(event);
    return event;
  }

  /**
   * Handle wave collision at a node
   */
  private handleCollision(node: GraphNode, waveType: WaveType, amplitude: SymbolicNumber): void {
    node.collisionCount++;

    // Determine interference pattern
    const phaseDiff = Math.abs(node.phase - FibonacciLucas.phaseAngle(node.coord.phi + node.coord.psi));

    if (phaseDiff === 0) {
      node.interferencePattern = 'CONSTRUCTIVE';
      // Amplify value
      node.value = SymbolicArithmetic.add(node.value, amplitude);
    } else if (Math.abs(phaseDiff - 1) < 0.01) {  // ≈ π difference
      node.interferencePattern = 'DESTRUCTIVE';
      // Attenuate value
      node.value = SymbolicArithmetic.subtract(node.value, amplitude);
    } else {
      node.interferencePattern = 'MIXED';
    }

    // Check if this creates a Nash point
    if (node.interferencePattern === 'CONSTRUCTIVE' && node.parity === 1) {
      node.isNash = true;
    }

    // Create collision event
    const collision: CollisionEvent = {
      eventId: this.generateEventId(),
      timestamp: this.currentTime,
      location: node.coord,
      nodeId: node.id,
      waves: [
        { waveType, amplitude, phase: node.phase }
      ],
      resultantAmplitude: node.value,
      interferenceType: node.interferencePattern,
      isNashPoint: node.isNash
    };

    this.graph.collisionHistory.push(collision);
  }

  /**
   * Compute propagated value using Binet identities (integer-only)
   */
  private computePropagatedValue(sourceValue: SymbolicNumber, targetCoord: TensorCoordinate): SymbolicNumber {
    // Use Fibonacci numbers to scale value
    const scaleFactor = FibonacciLucas.fibonacci(targetCoord.phi) +
                       FibonacciLucas.lucas(targetCoord.psi);

    return SymbolicArithmetic.scalarMultiply(sourceValue, scaleFactor);
  }

  /**
   * Find node at specific coordinate
   */
  private findNodeAtCoordinate(coord: TensorCoordinate): GraphNode | undefined {
    for (const node of this.graph.nodes.values()) {
      if (this.coordsEqual(node.coord, coord)) {
        return node;
      }
    }
    return undefined;
  }

  /**
   * Check if two coordinates are equal
   */
  private coordsEqual(a: TensorCoordinate, b: TensorCoordinate): boolean {
    return a.phi === b.phi && a.psi === b.psi && a.t === b.t && a.theta === b.theta;
  }

  /**
   * Coordinate to string key
   */
  private coordToString(coord: TensorCoordinate): string {
    return `${coord.phi},${coord.psi},${coord.t},${coord.theta}`;
  }

  /**
   * Advance time and propagate all active nodes
   */
  step(): void {
    this.currentTime++;

    // Get all active nodes at previous time step
    const activeNodes = Array.from(this.graph.nodes.values())
      .filter(node => node.state === 'ACTIVE' && node.activatedAt === this.currentTime - 1);

    // Propagate from each active node
    for (const node of activeNodes) {
      const waveType = this.graph.config.enableDualPropagation ? 'DUAL' : node.waveType;
      this.propagateWave(node.id, waveType);
    }

    // Check saturation and phase transitions
    this.checkSaturation();

    // Create snapshot
    this.createSnapshot();
  }

  /**
   * Check saturation state and phase transitions
   */
  private checkSaturation(): void {
    const activeCount = Array.from(this.graph.nodes.values())
      .filter(n => n.state === 'ACTIVE').length;
    const totalPossible = Math.pow(this.graph.config.maxShell * 2, 2) * 2;
    const coverage = activeCount / totalPossible;

    // Update node states based on saturation
    if (coverage >= this.graph.config.saturationThreshold) {
      for (const node of this.graph.nodes.values()) {
        if (node.state === 'ACTIVE') {
          node.state = 'SATURATED';
        }
      }
    }

    // Check for condensation (liquid phase)
    if (coverage >= 0.99) {
      for (const node of this.graph.nodes.values()) {
        if (node.state === 'SATURATED') {
          node.state = 'CONDENSED';
        }
      }
    }
  }

  /**
   * Create snapshot of current graph state
   */
  private createSnapshot(): void {
    const nodes = new Map(this.graph.nodes);
    const edges = new Map(this.graph.edges);

    const activeNodes = Array.from(nodes.values()).filter(n => n.state === 'ACTIVE');
    const latentNodes = Array.from(nodes.values()).filter(n => n.state === 'LATENT');
    const nashPoints = Array.from(nodes.values()).filter(n => n.isNash);

    const totalCollisions = Array.from(nodes.values())
      .reduce((sum, n) => sum + n.collisionCount, 0);

    const coverage = activeNodes.length / (Math.pow(this.graph.config.maxShell * 2, 2) * 2);
    const phaseRegime = HyperbolicGeometry.getPhaseRegime(
      Math.floor(Math.sqrt(activeNodes.length))
    );

    const snapshot: GraphSnapshot = {
      timestamp: this.currentTime,
      nodes,
      edges,
      stats: {
        totalNodes: nodes.size,
        activeNodes: activeNodes.length,
        latentNodes: latentNodes.length,
        nashPoints: nashPoints.length,
        collisionCount: totalCollisions
      },
      saturation: {
        region: {
          phiRange: [0, this.graph.config.maxShell],
          psiRange: [0, this.graph.config.maxShell]
        },
        timestamp: this.currentTime,
        coverage,
        density: activeNodes.length,
        phaseRegime,
        isQuantum: coverage < 0.236,
        isIntermediate: coverage >= 0.236 && coverage < 0.618,
        isClassical: coverage >= 0.618 && coverage < 0.9,
        isSaturated: coverage >= 0.9,
        isCondensed: coverage >= 0.99
      },
      phaseRegime
    };

    this.graph.snapshots.set(this.currentTime, snapshot);
  }

  /**
   * Query nodes with filters
   */
  queryNodes(query: NodeQuery): GraphNode[] {
    let nodes = Array.from(this.graph.nodes.values());

    if (query.state) {
      nodes = nodes.filter(n => query.state!.includes(n.state));
    }
    if (query.waveType) {
      nodes = nodes.filter(n => query.waveType!.includes(n.waveType));
    }
    if (query.isNash !== undefined) {
      nodes = nodes.filter(n => n.isNash === query.isNash);
    }
    if (query.minDepth !== undefined) {
      nodes = nodes.filter(n => n.depth >= query.minDepth!);
    }
    if (query.maxDepth !== undefined) {
      nodes = nodes.filter(n => n.depth <= query.maxDepth!);
    }
    if (query.timeRange) {
      const [minT, maxT] = query.timeRange;
      nodes = nodes.filter(n => n.createdAt >= minT && n.createdAt <= maxT);
    }

    return nodes;
  }

  /**
   * Get current snapshot
   */
  getCurrentSnapshot(): GraphSnapshot | undefined {
    return this.graph.snapshots.get(this.currentTime);
  }

  /**
   * Get all snapshots
   */
  getAllSnapshots(): GraphSnapshot[] {
    return Array.from(this.graph.snapshots.values());
  }

  /**
   * Get graph statistics
   */
  getStatistics(): {
    totalNodes: number;
    activeNodes: number;
    latentNodes: number;
    nashPoints: number;
    collisionCount: number;
    saturation: number;
    phaseRegime: PhaseRegime;
    propagationEvents: number;
    collisionEvents: number;
  } | null {
    const snapshot = this.getCurrentSnapshot();
    if (!snapshot) return null;

    return {
      ...snapshot.stats,
      saturation: snapshot.saturation.coverage,
      phaseRegime: snapshot.phaseRegime,
      propagationEvents: this.graph.propagationHistory.length,
      collisionEvents: this.graph.collisionHistory.length
    };
  }

  /**
   * Export graph for visualization
   */
  exportForVisualization() {
    return {
      nodes: this.graph.nodes,
      edges: this.graph.edges,
      currentTime: this.currentTime,
      statistics: this.getStatistics(),
      snapshots: this.graph.snapshots
    };
  }

  /**
   * Determine edge type from wave type
   */
  private getEdgeTypeFromWave(waveType: WaveType): EdgeType {
    switch (waveType) {
      case 'FIBONACCI':
        return 'FIBONACCI_JUMP';
      case 'LUCAS':
        return 'LUCAS_JUMP';
      case 'DUAL':
        return 'COVALENT';  // Dual propagation creates covalent bonds
    }
  }

  /**
   * Reset system
   */
  reset(): void {
    this.tensor.clear();
    this.graph.nodes.clear();
    this.graph.edges.clear();
    this.graph.snapshots.clear();
    this.graph.propagationHistory = [];
    this.graph.collisionHistory = [];
    this.currentTime = 0;
    this.nodeIdCounter = 0;
    this.eventIdCounter = 0;
    this.initializePresentNode();
  }
}

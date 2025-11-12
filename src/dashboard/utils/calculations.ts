/**
 * Mathematical Framework Calculation Utilities
 */

import type {
  SequenceData,
  PhaseSpacePoint,
  DivergenceData,
  GameTensorData,
  NeuralNetworkData,
  DependencyGraphData,
} from '../types';

const PHI = (1 + Math.sqrt(5)) / 2; // Golden ratio
const PSI = (1 - Math.sqrt(5)) / 2; // Conjugate

/**
 * Calculate Fibonacci and Lucas sequences
 */
export function calculateSequences(maxN: number): SequenceData[] {
  const data: SequenceData[] = [];

  let f_prev = 0, f_curr = 1;
  let l_prev = 2, l_curr = 1;

  for (let n = 0; n <= maxN; n++) {
    data.push({
      n,
      fibonacci: f_curr,
      lucas: l_curr,
    });

    const f_next = f_curr + f_prev;
    const l_next = l_curr + l_prev;

    f_prev = f_curr;
    f_curr = f_next;
    l_prev = l_curr;
    l_curr = l_next;
  }

  return data;
}

/**
 * Calculate phase space trajectory φ(n), ψ(n)
 */
export function calculatePhaseSpace(maxN: number): PhaseSpacePoint[] {
  const data: PhaseSpacePoint[] = [];

  for (let n = 0; n <= maxN; n++) {
    const phi = Math.pow(PHI, n) / Math.sqrt(5);
    const psi = Math.pow(PSI, n) / Math.sqrt(5);

    data.push({ n, phi, psi });
  }

  return data;
}

/**
 * Calculate divergence S(n) with Nash equilibrium points
 */
export function calculateDivergence(maxN: number): DivergenceData[] {
  const sequences = calculateSequences(maxN);
  const data: DivergenceData[] = [];

  for (let n = 1; n <= maxN; n++) {
    const F_n = sequences[n].fibonacci;
    const L_n = sequences[n].lucas;
    const F_prev = sequences[n - 1].fibonacci;

    // Divergence metric: S(n) = |F(n)/F(n-1) - φ|
    const ratio = F_prev !== 0 ? F_n / F_prev : 0;
    const divergence = Math.abs(ratio - PHI);

    // Nash equilibrium condition: S(n) < ε and L(n)/F(n) converges
    const epsilon = 0.01;
    const isNashPoint = divergence < epsilon && n > 5;

    data.push({
      n,
      value: divergence,
      isNashPoint,
      nashPayoff: isNashPoint ? 1 / divergence : undefined,
    });
  }

  return data;
}

/**
 * Generate game theory tensor representation
 */
export function calculateGameTensor(size: number = 3): GameTensorData {
  const strategies = Array.from({ length: size }, (_, i) => `S${i + 1}`);

  // Generate payoff matrix based on Fibonacci ratios
  const payoffs: number[][] = [];
  const sequences = calculateSequences(size + 5);

  for (let i = 0; i < size; i++) {
    payoffs[i] = [];
    for (let j = 0; j < size; j++) {
      // Payoff based on strategic interaction
      const f_i = sequences[i + 1].fibonacci;
      const f_j = sequences[j + 1].fibonacci;
      payoffs[i][j] = Math.round((f_i * f_j) / (f_i + f_j) * 100) / 100;
    }
  }

  // Find Nash equilibria (simplified: best response points)
  const nashEquilibria: number[][] = [];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const isRowBest = payoffs[i].every((val, k) => k === j || payoffs[i][j] >= val);
      const isColBest = payoffs.every((row, k) => k === i || payoffs[i][j] >= row[j]);

      if (isRowBest && isColBest) {
        nashEquilibria.push([i, j]);
      }
    }
  }

  return { strategies, payoffs, nashEquilibria };
}

/**
 * Simulate neural network convergence
 */
export function calculateNeuralNetwork(
  layers: number[] = [3, 5, 3, 1],
  epochs: number = 100
): NeuralNetworkData {
  const convergenceHistory: number[] = [];

  // Simulate convergence using exponential decay
  const initialLoss = 1.0;
  const decayRate = 0.05;

  for (let epoch = 0; epoch <= epochs; epoch++) {
    const loss = initialLoss * Math.exp(-decayRate * epoch) +
                 Math.random() * 0.01; // Add noise
    convergenceHistory.push(loss);
  }

  const neuralLayers = layers.map((neurons, idx) => ({
    id: `layer-${idx}`,
    neurons,
    activation: idx === layers.length - 1 ? 'linear' : 'relu',
  }));

  return {
    layers: neuralLayers,
    convergenceHistory,
    currentEpoch: epochs,
    loss: convergenceHistory[convergenceHistory.length - 1],
  };
}

/**
 * Generate dependency graph structure
 */
export function calculateDependencyGraph(): DependencyGraphData {
  const nodes: DependencyGraphData['nodes'] = [
    {
      id: 'fibonacci',
      label: 'F(n)',
      type: 'sequence',
      dependencies: [],
      formula: 'F(n) = F(n-1) + F(n-2)',
    },
    {
      id: 'lucas',
      label: 'L(n)',
      type: 'sequence',
      dependencies: [],
      formula: 'L(n) = L(n-1) + L(n-2)',
    },
    {
      id: 'phi',
      label: 'φ(n)',
      type: 'transform',
      dependencies: ['fibonacci'],
      formula: 'φ(n) = φⁿ/√5',
    },
    {
      id: 'psi',
      label: 'ψ(n)',
      type: 'transform',
      dependencies: ['fibonacci'],
      formula: 'ψ(n) = ψⁿ/√5',
    },
    {
      id: 'divergence',
      label: 'S(n)',
      type: 'metric',
      dependencies: ['fibonacci', 'phi'],
      formula: 'S(n) = |F(n)/F(n-1) - φ|',
    },
    {
      id: 'nash',
      label: 'Nash Points',
      type: 'metric',
      dependencies: ['divergence', 'lucas'],
      formula: 'S(n) < ε ∧ L(n)/F(n) → √5',
    },
    {
      id: 'game-tensor',
      label: 'Game Tensor',
      type: 'operator',
      dependencies: ['fibonacci', 'nash'],
      formula: 'T[i,j] = f(F_i, F_j)',
    },
    {
      id: 'neural-net',
      label: 'Neural Network',
      type: 'operator',
      dependencies: ['phi', 'psi', 'divergence'],
      formula: 'NN(φ, ψ, S) → convergence',
    },
  ];

  const edges = nodes
    .flatMap(node =>
      node.dependencies.map(dep => ({
        source: dep,
        target: node.id,
      }))
    );

  return { nodes, edges };
}

/**
 * Export data to JSON
 */
export function exportToJSON(data: any): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Export data to CSV
 */
export function exportToCSV(data: any[], headers: string[]): string {
  const rows = data.map(item =>
    headers.map(header => item[header] ?? '').join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Calculate all data for given parameters
 */
export function calculateAll(n: number) {
  return {
    sequences: calculateSequences(n),
    phaseSpace: calculatePhaseSpace(n),
    divergence: calculateDivergence(n),
    gameTensor: calculateGameTensor(Math.min(5, Math.ceil(n / 10))),
    neuralNetwork: calculateNeuralNetwork([3, 5, 3, 1], Math.min(100, n * 2)),
    dependencyGraph: calculateDependencyGraph(),
  };
}

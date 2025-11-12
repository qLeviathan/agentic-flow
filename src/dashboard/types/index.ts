/**
 * Mathematical Framework Type Definitions
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface SequenceData {
  n: number;
  fibonacci: number;
  lucas: number;
}

export interface PhaseSpacePoint {
  n: number;
  phi: number;
  psi: number;
}

export interface DivergenceData {
  n: number;
  value: number;
  isNashPoint: boolean;
  nashPayoff?: number;
}

export interface GameTensorData {
  strategies: string[];
  payoffs: number[][];
  nashEquilibria: number[][];
}

export interface NeuralLayer {
  id: string;
  neurons: number;
  activation: string;
  weights?: number[][];
}

export interface NeuralNetworkData {
  layers: NeuralLayer[];
  convergenceHistory: number[];
  currentEpoch: number;
  loss: number;
}

export interface DependencyNode {
  id: string;
  label: string;
  type: 'sequence' | 'transform' | 'metric' | 'operator';
  dependencies: string[];
  formula?: string;
}

export interface DependencyGraphData {
  nodes: DependencyNode[];
  edges: Array<{ source: string; target: string }>;
}

export interface ComputationParams {
  n: number;
  maxIterations: number;
  epsilon: number;
  gameMatrixSize: number;
  neuralLayers: number[];
}

export interface ExportData {
  timestamp: string;
  params: ComputationParams;
  sequences: SequenceData[];
  phaseSpace: PhaseSpacePoint[];
  divergence: DivergenceData[];
  gameTensor: GameTensorData;
  neuralNetwork: NeuralNetworkData;
  dependencyGraph: DependencyGraphData;
}

export type VisualizationTheme = 'light' | 'dark';

export interface DashboardState {
  params: ComputationParams;
  isComputing: boolean;
  selectedNashPoint: number | null;
  theme: VisualizationTheme;
  autoUpdate: boolean;
}

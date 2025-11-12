/**
 * Validation Module Exports
 *
 * Provides dependency graph validation and visualization tools
 * for the mathematical framework.
 */

export {
  DependencyGraph,
  validateDependencyGraph,
  generateVisualization,
  getComputationOrder,
  checkIndependence,
  type Symbol,
  type Edge,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type IndependenceCheck,
  type GraphMetrics
} from './dependency-graph';

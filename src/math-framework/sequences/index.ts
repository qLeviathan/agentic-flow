/**
 * Sequence Generation Module
 *
 * Provides efficient implementations of Fibonacci and Lucas sequences
 * with multiple computation methods and verification capabilities.
 */

// Q-Matrix exports
export {
  type Matrix2x2,
  type QMatrixResult,
  Q_MATRIX,
  multiplyMatrices,
  identityMatrix,
  matrixPower,
  fibonacciQMatrix,
  fibonacciQMatrixRange,
  verifyQMatrixProperties,
  getFibonacci
} from './q-matrix';

// Fibonacci exports
export {
  PHI,
  PSI,
  SQRT5,
  type FibonacciResult,
  type FibonacciComparison,
  fibonacciRecurrence,
  fibonacciBinet,
  fibonacciMatrix,
  fibonacciMemoized,
  fibonacci,
  fibonacciCompare,
  fibonacciSequence,
  clearFibonacciCache,
  getFibonacciCacheStats,
  FibonacciIdentities
} from './fibonacci';

// Lucas exports
export {
  type LucasResult,
  type LucasComparison,
  lucasRecurrence,
  lucasBinet,
  lucasFibonacciRelation,
  lucasFibonacciAlternative,
  lucasMemoized,
  lucas,
  lucasCompare,
  lucasSequence,
  clearLucasCache,
  getLucasCacheStats,
  LucasIdentities,
  FibonacciLucasRelations
} from './lucas';

// Zeckendorf exports
export {
  type ZeckendorfRepresentation,
  getZeckendorfRepresentation,
  z,
  computeZeckendorfCounts,
  verifyZeckendorfRepresentation,
  zeckendorfToString
} from './zeckendorf';

// Lucas Representation exports
export {
  type LucasRepresentation,
  getLucasRepresentation,
  ℓ,
  computeLucasCounts,
  verifyLucasRepresentation,
  lucasToString,
  isLucasNumber,
  findLucasIndex
} from './lucas-repr';

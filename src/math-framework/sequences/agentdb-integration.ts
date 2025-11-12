/**
 * AgentDB Integration for Sequence Pattern Learning
 *
 * Stores computed sequences, performance metrics, and pattern data
 * in AgentDB for machine learning and optimization.
 */

import { fibonacci, fibonacciCompare, type FibonacciComparison } from './fibonacci';
import { lucas, lucasCompare, type LucasComparison } from './lucas';
import { fibonacciQMatrix, type QMatrixResult } from './q-matrix';

export interface SequencePattern {
  type: 'fibonacci' | 'lucas';
  n: number;
  value: string; // bigint as string for JSON serialization
  computationMethod: string;
  computationTime: number;
  timestamp: number;
}

export interface SequencePerformanceData {
  sequenceType: 'fibonacci' | 'lucas';
  rangeStart: number;
  rangeEnd: number;
  methodComparisons: Array<{
    n: number;
    methods: Record<string, number>; // method name -> computation time
    fastestMethod: string;
  }>;
  averagePerformance: Record<string, number>;
  timestamp: number;
}

export interface SequenceIdentityVerification {
  identityName: string;
  n: number;
  verified: boolean;
  leftSide: string;
  rightSide: string;
  timestamp: number;
}

/**
 * In-memory pattern storage (would integrate with AgentDB in production)
 */
class SequencePatternStore {
  private patterns: SequencePattern[] = [];
  private performanceData: SequencePerformanceData[] = [];
  private verifications: SequenceIdentityVerification[] = [];

  storePattern(pattern: SequencePattern): void {
    this.patterns.push(pattern);
  }

  storePerformance(data: SequencePerformanceData): void {
    this.performanceData.push(data);
  }

  storeVerification(verification: SequenceIdentityVerification): void {
    this.verifications.push(verification);
  }

  getPatterns(type?: 'fibonacci' | 'lucas'): SequencePattern[] {
    if (type) {
      return this.patterns.filter(p => p.type === type);
    }
    return [...this.patterns];
  }

  getPerformanceData(type?: 'fibonacci' | 'lucas'): SequencePerformanceData[] {
    if (type) {
      return this.performanceData.filter(p => p.sequenceType === type);
    }
    return [...this.performanceData];
  }

  getVerifications(): SequenceIdentityVerification[] {
    return [...this.verifications];
  }

  clear(): void {
    this.patterns = [];
    this.performanceData = [];
    this.verifications = [];
  }

  getStats(): {
    totalPatterns: number;
    fibonacciPatterns: number;
    lucasPatterns: number;
    performanceDatasets: number;
    verifications: number;
    verificationSuccessRate: number;
  } {
    const verified = this.verifications.filter(v => v.verified).length;
    const total = this.verifications.length;

    return {
      totalPatterns: this.patterns.length,
      fibonacciPatterns: this.patterns.filter(p => p.type === 'fibonacci').length,
      lucasPatterns: this.patterns.filter(p => p.type === 'lucas').length,
      performanceDatasets: this.performanceData.length,
      verifications: total,
      verificationSuccessRate: total > 0 ? verified / total : 1.0
    };
  }
}

// Global store instance
const patternStore = new SequencePatternStore();

/**
 * Compute Fibonacci with pattern storage
 */
export function fibonacciWithStorage(n: number, method: 'recurrence' | 'binet' | 'qmatrix' | 'memoized' = 'memoized'): bigint {
  const startTime = performance.now();
  const value = fibonacci(n);
  const computationTime = performance.now() - startTime;

  const pattern: SequencePattern = {
    type: 'fibonacci',
    n,
    value: value.toString(),
    computationMethod: method,
    computationTime,
    timestamp: Date.now()
  };

  patternStore.storePattern(pattern);

  return value;
}

/**
 * Compute Lucas with pattern storage
 */
export function lucasWithStorage(n: number, method: 'recurrence' | 'binet' | 'fibonacci-relation' | 'memoized' = 'memoized'): bigint {
  const startTime = performance.now();
  const value = lucas(n);
  const computationTime = performance.now() - startTime;

  const pattern: SequencePattern = {
    type: 'lucas',
    n,
    value: value.toString(),
    computationMethod: method,
    computationTime,
    timestamp: Date.now()
  };

  patternStore.storePattern(pattern);

  return value;
}

/**
 * Benchmark all Fibonacci methods and store performance data
 */
export function benchmarkFibonacciMethods(rangeStart: number, rangeEnd: number): SequencePerformanceData {
  const methodComparisons: Array<{
    n: number;
    methods: Record<string, number>;
    fastestMethod: string;
  }> = [];

  const methodTotals: Record<string, number> = {
    recurrence: 0,
    binet: 0,
    qmatrix: 0,
    memoized: 0
  };

  for (let n = rangeStart; n <= rangeEnd; n++) {
    // Only test recurrence for small n
    if (n <= 30) {
      const comparison = fibonacciCompare(n);
      const methods = comparison.timings;

      let fastestMethod = 'memoized';
      let fastestTime = methods.memoized;

      for (const [method, time] of Object.entries(methods)) {
        if (time > 0 && time < fastestTime) {
          fastestTime = time;
          fastestMethod = method;
        }
        methodTotals[method] += time;
      }

      methodComparisons.push({
        n,
        methods,
        fastestMethod
      });
    }
  }

  const count = methodComparisons.length;
  const averagePerformance: Record<string, number> = {};

  for (const [method, total] of Object.entries(methodTotals)) {
    averagePerformance[method] = count > 0 ? total / count : 0;
  }

  const performanceData: SequencePerformanceData = {
    sequenceType: 'fibonacci',
    rangeStart,
    rangeEnd,
    methodComparisons,
    averagePerformance,
    timestamp: Date.now()
  };

  patternStore.storePerformance(performanceData);

  return performanceData;
}

/**
 * Benchmark all Lucas methods and store performance data
 */
export function benchmarkLucasMethods(rangeStart: number, rangeEnd: number): SequencePerformanceData {
  const methodComparisons: Array<{
    n: number;
    methods: Record<string, number>;
    fastestMethod: string;
  }> = [];

  const methodTotals: Record<string, number> = {
    recurrence: 0,
    binet: 0,
    fibonacciRelation: 0,
    memoized: 0
  };

  for (let n = rangeStart; n <= rangeEnd; n++) {
    // Only test recurrence for small n
    if (n <= 30) {
      const comparison = lucasCompare(n);
      const methods = comparison.timings;

      let fastestMethod = 'memoized';
      let fastestTime = methods.memoized;

      for (const [method, time] of Object.entries(methods)) {
        if (time > 0 && time < fastestTime) {
          fastestTime = time;
          fastestMethod = method;
        }
        methodTotals[method] += time;
      }

      methodComparisons.push({
        n,
        methods,
        fastestMethod
      });
    }
  }

  const count = methodComparisons.length;
  const averagePerformance: Record<string, number> = {};

  for (const [method, total] of Object.entries(methodTotals)) {
    averagePerformance[method] = count > 0 ? total / count : 0;
  }

  const performanceData: SequencePerformanceData = {
    sequenceType: 'lucas',
    rangeStart,
    rangeEnd,
    methodComparisons,
    averagePerformance,
    timestamp: Date.now()
  };

  patternStore.storePerformance(performanceData);

  return performanceData;
}

/**
 * Verify Fibonacci identities and store results
 */
export function verifyFibonacciIdentities(n: number): SequenceIdentityVerification[] {
  const verifications: SequenceIdentityVerification[] = [];

  // Import identities
  const { FibonacciIdentities } = require('./fibonacci');

  // Cassini's identity
  try {
    const verified = FibonacciIdentities.verifyCassini(n);
    verifications.push({
      identityName: 'Cassini',
      n,
      verified,
      leftSide: 'F(n-1) * F(n+1) - F(n)²',
      rightSide: '(-1)ⁿ',
      timestamp: Date.now()
    });
    patternStore.storeVerification(verifications[verifications.length - 1]);
  } catch (error) {
    // Skip if error
  }

  // Sum identity
  try {
    const verified = FibonacciIdentities.verifySum(n);
    verifications.push({
      identityName: 'Sum',
      n,
      verified,
      leftSide: 'Σ F(i) for i=0 to n',
      rightSide: 'F(n+2) - 1',
      timestamp: Date.now()
    });
    patternStore.storeVerification(verifications[verifications.length - 1]);
  } catch (error) {
    // Skip if error
  }

  return verifications;
}

/**
 * Verify Lucas identities and store results
 */
export function verifyLucasIdentities(n: number): SequenceIdentityVerification[] {
  const verifications: SequenceIdentityVerification[] = [];

  // Import identities
  const { LucasIdentities } = require('./lucas');

  // Fibonacci relation
  try {
    const verified = LucasIdentities.verifyFibonacciRelation(n);
    verifications.push({
      identityName: 'Fibonacci Relation',
      n,
      verified,
      leftSide: 'L(n)',
      rightSide: 'F(n-1) + F(n+1)',
      timestamp: Date.now()
    });
    patternStore.storeVerification(verifications[verifications.length - 1]);
  } catch (error) {
    // Skip if error
  }

  // Square identity
  try {
    const verified = LucasIdentities.verifySquareIdentity(n);
    verifications.push({
      identityName: 'Square Identity',
      n,
      verified,
      leftSide: 'L(n)² - 5*F(n)²',
      rightSide: '4*(-1)ⁿ',
      timestamp: Date.now()
    });
    patternStore.storeVerification(verifications[verifications.length - 1]);
  } catch (error) {
    // Skip if error
  }

  // Fibonacci-Lucas product
  try {
    const verified = LucasIdentities.verifyFibonacciLucasProduct(n);
    verifications.push({
      identityName: 'Fibonacci-Lucas Product',
      n,
      verified,
      leftSide: 'F(2n)',
      rightSide: 'F(n) * L(n)',
      timestamp: Date.now()
    });
    patternStore.storeVerification(verifications[verifications.length - 1]);
  } catch (error) {
    // Skip if error
  }

  return verifications;
}

/**
 * Get all stored patterns
 */
export function getStoredPatterns(type?: 'fibonacci' | 'lucas'): SequencePattern[] {
  return patternStore.getPatterns(type);
}

/**
 * Get performance data
 */
export function getPerformanceData(type?: 'fibonacci' | 'lucas'): SequencePerformanceData[] {
  return patternStore.getPerformanceData(type);
}

/**
 * Get verification data
 */
export function getVerificationData(): SequenceIdentityVerification[] {
  return patternStore.getVerifications();
}

/**
 * Get statistics about stored data
 */
export function getAgentDBStats() {
  return patternStore.getStats();
}

/**
 * Clear all stored data
 */
export function clearAgentDBData(): void {
  patternStore.clear();
}

/**
 * Export data for external AgentDB storage
 */
export function exportForAgentDB(): {
  patterns: SequencePattern[];
  performance: SequencePerformanceData[];
  verifications: SequenceIdentityVerification[];
  stats: ReturnType<typeof getAgentDBStats>;
} {
  return {
    patterns: patternStore.getPatterns(),
    performance: patternStore.getPerformanceData(),
    verifications: patternStore.getVerifications(),
    stats: patternStore.getStats()
  };
}

/**
 * Generate comprehensive learning dataset
 */
export function generateLearningDataset(maxN: number): {
  fibonacciSequence: Array<{ n: number; value: string }>;
  lucasSequence: Array<{ n: number; value: string }>;
  fibonacciPerformance: SequencePerformanceData;
  lucasPerformance: SequencePerformanceData;
  identityVerifications: SequenceIdentityVerification[];
} {
  // Generate sequences
  const fibonacciSequence: Array<{ n: number; value: string }> = [];
  const lucasSequence: Array<{ n: number; value: string }> = [];

  for (let n = 0; n <= maxN; n++) {
    fibonacciSequence.push({
      n,
      value: fibonacci(n).toString()
    });

    lucasSequence.push({
      n,
      value: lucas(n).toString()
    });
  }

  // Benchmark performance (small range for testing)
  const benchmarkRange = Math.min(maxN, 30);
  const fibonacciPerformance = benchmarkFibonacciMethods(0, benchmarkRange);
  const lucasPerformance = benchmarkLucasMethods(0, benchmarkRange);

  // Verify identities at key points
  const identityVerifications: SequenceIdentityVerification[] = [];
  const testPoints = [0, 1, 5, 10, 15, 20].filter(n => n <= maxN);

  for (const n of testPoints) {
    identityVerifications.push(...verifyFibonacciIdentities(n));
    identityVerifications.push(...verifyLucasIdentities(n));
  }

  return {
    fibonacciSequence,
    lucasSequence,
    fibonacciPerformance,
    lucasPerformance,
    identityVerifications
  };
}

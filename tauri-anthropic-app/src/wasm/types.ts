/**
 * TypeScript type definitions for WASM operations
 */

// ============================================================================
// REASONINGBANK TYPES
// ============================================================================

/**
 * Input pattern for ReasoningBank
 */
export interface PatternInput {
  task_description: string;
  task_category: string;
  strategy: string;
  success_score: number;
  duration_seconds?: number;
}

/**
 * Stored pattern with metadata
 */
export interface Pattern {
  id: string;
  task_description: string;
  task_category: string;
  strategy: string;
  success_score: number;
  duration_seconds: number;
  created_at: string;
}

/**
 * Similar pattern result with similarity score
 */
export interface SimilarPattern {
  pattern: Pattern;
  similarity_score: number;
}

/**
 * ReasoningBank storage statistics
 */
export interface StorageStats {
  total_patterns: number;
  categories: Record<string, number>;
  average_score: number;
}

// ============================================================================
// AGENTBOOSTER TYPES
// ============================================================================

/**
 * Code edit result from AgentBooster
 */
export interface EditResultJson {
  /** The merged/edited code */
  merged_code: string;
  /** Confidence score (0.0 - 1.0) */
  confidence: number;
  /** Strategy used for merging */
  strategy: string;
  /** Number of code chunks found */
  chunks_found: number;
  /** Best similarity score found */
  best_similarity: number;
  /** Whether the result is syntactically valid */
  syntax_valid: boolean;
  /** Processing time in milliseconds */
  processing_time_ms?: number;
}

/**
 * Merge strategies for code editing
 */
export type MergeStrategy =
  | 'exact_replace'
  | 'fuzzy_replace'
  | 'insert_after'
  | 'insert_before'
  | 'append';

/**
 * Programming languages supported by AgentBooster
 */
export type ProgrammingLanguage =
  | 'JavaScript'
  | 'TypeScript'
  | 'Python'
  | 'Rust'
  | 'Go'
  | 'Java'
  | 'C'
  | 'Cpp';

// ============================================================================
// MATH FRAMEWORK TYPES
// ============================================================================

/**
 * Zeckendorf decomposition result
 * Represents a number as sum of non-consecutive Fibonacci numbers
 */
export interface ZeckendorfResult {
  /** The original number as string */
  number: string;
  /** Fibonacci indices as JSON array string */
  indices: string;
  /** Fibonacci numbers as JSON array of strings */
  fibonacci_numbers: string;
  /** Whether the decomposition is valid */
  is_valid: boolean;
  /** String representation (e.g., "3 + 8 + 89") */
  string_repr: string;
}

/**
 * Parsed Zeckendorf decomposition
 */
export interface ParsedZeckendorf {
  number: bigint;
  indices: number[];
  fibonacci_numbers: bigint[];
  is_valid: boolean;
  string_repr: string;
}

/**
 * Phase space point coordinates
 */
export interface PhaseSpacePoint {
  /** Position index */
  n: number;
  /** V value (sum of Fibonacci indices) */
  v: number;
  /** U value (cumulative V) */
  u: number;
  /** S value (BK divergence) */
  s: number;
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Z coordinate */
  z: number;
}

/**
 * Phase space trajectory
 */
export interface TrajectoryResult {
  /** Starting position */
  start: number;
  /** Ending position */
  end: number;
  /** Number of points */
  length: number;
  /** Total path length */
  path_length: number;
}

/**
 * Nash equilibrium point
 */
export interface NashEquilibrium {
  /** Position in trajectory */
  position: number;
  /** V value at equilibrium */
  v: number;
  /** U value at equilibrium */
  u: number;
  /** S value at equilibrium */
  s: number;
  /** Stability score */
  stability_score: number;
}

/**
 * Divergence metrics for a range
 */
export interface DivergenceMetrics {
  range_start: number;
  range_end: number;
  mean_v: number;
  mean_u: number;
  mean_s: number;
  max_v: number;
  max_u: number;
  max_s: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * WASM operation result wrapper
 */
export type WasmResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * WASM performance metrics
 */
export interface PerformanceMetrics {
  operation: string;
  duration_ms: number;
  memory_used?: number;
  cache_hits?: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse Zeckendorf result from JSON strings
 */
export function parseZeckendorf(result: ZeckendorfResult): ParsedZeckendorf {
  return {
    number: BigInt(result.number),
    indices: JSON.parse(result.indices) as number[],
    fibonacci_numbers: (JSON.parse(result.fibonacci_numbers) as string[]).map(
      n => BigInt(n)
    ),
    is_valid: result.is_valid,
    string_repr: result.string_repr,
  };
}

/**
 * Create pattern input helper
 */
export function createPattern(
  description: string,
  category: string,
  strategy: string,
  score: number,
  duration?: number
): PatternInput {
  return {
    task_description: description,
    task_category: category,
    strategy,
    success_score: score,
    duration_seconds: duration,
  };
}

/**
 * Validate edit result confidence
 */
export function hasHighConfidence(
  result: EditResultJson,
  threshold: number = 0.7
): boolean {
  return result.confidence >= threshold && result.syntax_valid;
}

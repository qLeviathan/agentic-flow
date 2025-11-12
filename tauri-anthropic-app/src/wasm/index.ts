/**
 * WASM Integration Module
 *
 * Provides TypeScript bindings for high-performance WASM modules:
 * - ReasoningBank: Memory and pattern operations
 * - AgentBooster: Code transformation and acceleration
 * - MathFramework: Mathematical computations
 */

import { invoke } from '@tauri-apps/api/tauri';
import type {
  PatternInput,
  EditResultJson,
  ZeckendorfResult,
  TrajectoryResult,
} from './types';

// ============================================================================
// REASONINGBANK OPERATIONS
// ============================================================================

/**
 * Initialize ReasoningBank with optional database name
 */
export async function initReasoningBank(dbName?: string): Promise<string> {
  return invoke<string>('wasm_init_reasoningbank', { dbName });
}

/**
 * Store a reasoning pattern
 */
export async function storePattern(pattern: PatternInput): Promise<string> {
  const patternJson = JSON.stringify(pattern);
  return invoke<string>('wasm_store_pattern', { patternJson });
}

/**
 * Get a pattern by ID
 */
export async function getPattern(patternId: string): Promise<any> {
  const json = await invoke<string>('wasm_get_pattern', { patternId });
  return JSON.parse(json);
}

/**
 * Search patterns by category
 */
export async function searchPatterns(
  category: string,
  limit: number = 10
): Promise<any[]> {
  const json = await invoke<string>('wasm_search_patterns', { category, limit });
  return JSON.parse(json);
}

/**
 * Find similar patterns
 */
export async function findSimilarPatterns(
  taskDescription: string,
  taskCategory: string,
  topK: number = 5
): Promise<any[]> {
  const json = await invoke<string>('wasm_find_similar', {
    taskDescription,
    taskCategory,
    topK,
  });
  return JSON.parse(json);
}

// ============================================================================
// AGENTBOOSTER OPERATIONS
// ============================================================================

/**
 * Apply code edit using AgentBooster
 */
export async function applyEdit(
  originalCode: string,
  editSnippet: string,
  language: string
): Promise<EditResultJson> {
  return invoke<EditResultJson>('wasm_apply_edit', {
    originalCode,
    editSnippet,
    language,
  });
}

/**
 * Supported languages for code editing
 */
export const SupportedLanguages = [
  'javascript',
  'typescript',
  'python',
  'rust',
  'go',
  'java',
  'c',
  'cpp',
] as const;

export type SupportedLanguage = typeof SupportedLanguages[number];

// ============================================================================
// MATH FRAMEWORK OPERATIONS
// ============================================================================

/**
 * Compute Fibonacci number F(n)
 * Returns result as string to handle large numbers
 */
export async function fibonacci(n: number): Promise<string> {
  return invoke<string>('wasm_fibonacci', { n });
}

/**
 * Compute Lucas number L(n)
 * Returns result as string to handle large numbers
 */
export async function lucas(n: number): Promise<string> {
  return invoke<string>('wasm_lucas', { n });
}

/**
 * Compute Zeckendorf decomposition
 * Every positive integer can be uniquely represented as a sum of
 * non-consecutive Fibonacci numbers
 */
export async function zeckendorf(n: number): Promise<ZeckendorfResult> {
  return invoke<ZeckendorfResult>('wasm_zeckendorf', { n });
}

/**
 * Compute BK divergence S(n)
 */
export async function bkDivergence(n: number): Promise<number> {
  return invoke<number>('wasm_bk_divergence', { n });
}

/**
 * Create phase space trajectory from start to end
 */
export async function phaseSpaceTrajectory(
  start: number,
  end: number
): Promise<TrajectoryResult> {
  return invoke<TrajectoryResult>('wasm_phase_space_trajectory', { start, end });
}

/**
 * Clear all WASM caches (useful for memory management)
 */
export async function clearCaches(): Promise<string> {
  return invoke<string>('wasm_clear_caches');
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Compute multiple Fibonacci numbers in parallel
 */
export async function fibonacciBatch(numbers: number[]): Promise<string[]> {
  return Promise.all(numbers.map(n => fibonacci(n)));
}

/**
 * Compute multiple Lucas numbers in parallel
 */
export async function lucasBatch(numbers: number[]): Promise<string[]> {
  return Promise.all(numbers.map(n => lucas(n)));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse large number string to BigInt
 */
export function parseLargeNumber(value: string): bigint {
  return BigInt(value);
}

/**
 * Format large number with commas for display
 */
export function formatLargeNumber(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(lang: string): lang is SupportedLanguage {
  return SupportedLanguages.includes(lang as SupportedLanguage);
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * WASM operation error
 */
export class WasmError extends Error {
  constructor(message: string, public operation: string) {
    super(message);
    this.name = 'WasmError';
  }
}

/**
 * Wrap WASM operations with error handling
 */
export async function safeWasmInvoke<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw new WasmError(
      error instanceof Error ? error.message : String(error),
      operation
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // ReasoningBank
  initReasoningBank,
  storePattern,
  getPattern,
  searchPatterns,
  findSimilarPatterns,

  // AgentBooster
  applyEdit,
  SupportedLanguages,
  isLanguageSupported,

  // Math Framework
  fibonacci,
  lucas,
  zeckendorf,
  bkDivergence,
  phaseSpaceTrajectory,
  clearCaches,

  // Batch operations
  fibonacciBatch,
  lucasBatch,

  // Utilities
  parseLargeNumber,
  formatLargeNumber,
  safeWasmInvoke,
};

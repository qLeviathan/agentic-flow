/**
 * TypeScript Type Definitions for OEIS Integration
 *
 * Comprehensive type definitions for OEIS (Online Encyclopedia of Integer Sequences)
 * mathematical validation integration with AgentDB.
 */

// ============================================================================
// Core OEIS Types
// ============================================================================

/**
 * OEIS Sequence representation
 */
export interface OeisSequence {
  id?: number;
  oeisId: string;                       // e.g., "A000045" (Fibonacci)
  name: string;
  description?: string;
  keywords?: string[];                  // ["nonn", "easy", "core"]
  terms: number[];                      // First N terms of sequence
  formula?: string;                     // Mathematical formula
  references?: OeisReference[];
  author?: string;
  offset?: number;                      // Starting index (0 or 1)
  metadata?: Record<string, any>;
  cacheTimestamp: number;
  lastValidated?: number;
  validationCount?: number;
  createdAt?: number;
  updatedAt?: number;
}

/**
 * OEIS Reference link
 */
export interface OeisReference {
  type: 'paper' | 'book' | 'website' | 'crossref';
  title: string;
  url?: string;
  authors?: string[];
  year?: number;
}

/**
 * OEIS Match result from validation
 */
export interface OeisMatch {
  sequence: OeisSequence;
  confidence: number;                   // 0.0-1.0
  matchType: 'exact' | 'subsequence' | 'pattern' | 'semantic';
  matchedTerms: number[];
  matchIndices: number[];               // Indices in original sequence
  similarity?: number;                  // Semantic similarity (if applicable)
  metadata?: Record<string, any>;
}

// ============================================================================
// Skill-OEIS Linking Types
// ============================================================================

/**
 * Link between a skill and an OEIS sequence
 */
export interface SkillOeisLink {
  id?: number;
  skillId: number;
  sequenceId: number;
  relationship: 'produces' | 'uses' | 'validates_with' | 'similar_to';
  confidence: number;                   // 0.0-1.0
  matchType?: 'exact' | 'subsequence' | 'pattern' | 'semantic';
  matchData?: Record<string, any>;
  discoveredAt?: number;
  lastUsedAt?: number;
  useCount?: number;
  metadata?: Record<string, any>;
}

/**
 * Validated skill-sequence relationship (from view)
 */
export interface ValidatedSkillSequence {
  skillId: number;
  skillName: string;
  skillSuccessRate: number;
  sequenceId: number;
  oeisId: string;
  sequenceName: string;
  validationCount: number;
  relationship: string;
  confidence: number;
  matchType: string;
  useCount: number;
  lastUsedAt?: number;
}

// ============================================================================
// Episode Validation Types
// ============================================================================

/**
 * Episode validation against OEIS sequence
 */
export interface EpisodeSequenceValidation {
  id?: number;
  episodeId: number;
  sequenceId: number;
  validationType: 'output' | 'pattern' | 'intermediate' | 'trajectory';
  context?: string;
  matchConfidence: number;              // 0.0-1.0
  matchedTerms: number[];
  matchIndices: number[];
  validationResult: 'match' | 'partial' | 'no_match' | 'error';
  improvementScore?: number;
  validatedAt?: number;
  metadata?: Record<string, any>;
}

/**
 * Episode validation summary (from view)
 */
export interface EpisodeValidationSummary {
  episodeId: number;
  task: string;
  success: boolean;
  reward: number;
  validationCount: number;
  avgMatchConfidence: number;
  matchedSequences: string[];           // Array of OEIS IDs
}

// ============================================================================
// Pattern Recognition Types
// ============================================================================

/**
 * Mathematical pattern detected in sequences
 */
export interface MathematicalPattern {
  id?: number;
  patternType: 'arithmetic' | 'geometric' | 'recursive' | 'polynomial' | 'custom';
  patternSignature: string;             // Canonical representation
  patternFormula?: string;              // e.g., "n*(n+1)/2"
  relatedSequences: string[];           // Array of OEIS IDs
  discoveredFrom: 'episode' | 'skill' | 'manual';
  sourceId?: number;
  confidence: number;                   // 0.0-1.0
  validationCount?: number;
  successRate?: number;
  createdAt?: number;
  lastUsedAt?: number;
  metadata?: Record<string, any>;
}

/**
 * Pattern discovery statistics (from view)
 */
export interface PatternDiscoveryStats {
  patternType: string;
  patternCount: number;
  avgConfidence: number;
  totalValidations: number;
  avgSuccessRate: number;
  highQualityCount: number;
}

// ============================================================================
// Validation Query Types
// ============================================================================

/**
 * Query for sequence validation
 */
export interface SequenceValidationQuery {
  terms: number[];
  context?: string;
  minConfidence?: number;               // 0.0-1.0, default 0.7
  maxResults?: number;                  // default 10
  validationType?: 'exact' | 'fuzzy' | 'pattern';
  includePartial?: boolean;             // Include partial matches
}

/**
 * Validation result from SequenceValidator
 */
export interface ValidationResult {
  success: boolean;
  matches: OeisMatch[];
  patterns?: MathematicalPattern[];
  confidence: number;
  improvementSuggestions?: string[];
  metadata?: Record<string, any>;
}

/**
 * Skill mathematical profile (from view)
 */
export interface SkillMathematicalProfile {
  skillId: number;
  skillName: string;
  successRate: number;
  linkedSequences: number;
  relatedPatterns: number;
  avgLinkConfidence: number;
  oeisIds: string[];
  patternTypes: string[];
}

// ============================================================================
// OEIS API Types
// ============================================================================

/**
 * OEIS API response structure
 */
export interface OeisApiResponse {
  results?: OeisApiSequence[];
  count?: number;
  start?: number;
  greeting?: string;
}

/**
 * OEIS API sequence format
 */
export interface OeisApiSequence {
  number: number;                       // 45 for A000045
  id: string;                          // "A000045"
  data: string;                        // Comma-separated terms
  name: string;
  comment?: string[];
  reference?: string[];
  link?: string[];
  formula?: string[];
  example?: string[];
  maple?: string[];
  mathematica?: string[];
  prog?: string[];
  xref?: string[];
  keyword: string;
  offset: string;
  author: string;
  ext?: string[];
  created?: string;
  changed?: string;
}

// ============================================================================
// Cache Types
// ============================================================================

/**
 * Search cache entry
 */
export interface OeisSearchCache {
  id?: number;
  queryHash: string;
  queryType: 'terms' | 'keyword' | 'name' | 'id';
  queryParams: Record<string, any>;
  results: any;
  resultCount?: number;
  cachedAt: number;
  expiresAt: number;
  hitCount?: number;
  lastAccessedAt?: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  hitRate: number;
  avgAge: number;
  expiredEntries: number;
  sizeBytes?: number;
}

// ============================================================================
// Service Interface Types
// ============================================================================

/**
 * OEIS API Client interface
 */
export interface IOeisApiClient {
  /**
   * Search OEIS by sequence terms
   */
  search(terms: number[], limit?: number): Promise<OeisApiResponse>;

  /**
   * Get specific sequence by OEIS ID
   */
  getSequence(oeisId: string): Promise<OeisApiSequence | null>;

  /**
   * Search by keyword
   */
  searchByKeyword(keyword: string, limit?: number): Promise<OeisApiResponse>;

  /**
   * Search by sequence name
   */
  searchByName(name: string, limit?: number): Promise<OeisApiResponse>;

  /**
   * Get API rate limit status
   */
  getRateLimit(): Promise<RateLimitStatus>;
}

/**
 * OEIS Cache interface
 */
export interface IOeisCache {
  /**
   * Get cached sequence by OEIS ID
   */
  getSequence(oeisId: string): Promise<OeisSequence | null>;

  /**
   * Store sequence in cache
   */
  storeSequence(sequence: OeisSequence): Promise<void>;

  /**
   * Search cached sequences
   */
  searchSequences(query: string, limit?: number): Promise<OeisSequence[]>;

  /**
   * Invalidate cached sequence
   */
  invalidateSequence(oeisId: string): Promise<void>;

  /**
   * Get cache statistics
   */
  getCacheStats(): Promise<CacheStats>;

  /**
   * Clear expired cache entries
   */
  clearExpired(): Promise<number>;
}

/**
 * Sequence Validator interface
 */
export interface ISequenceValidator {
  /**
   * Validate sequence terms against OEIS
   */
  validateSequence(query: SequenceValidationQuery): Promise<ValidationResult>;

  /**
   * Validate episode output against OEIS
   */
  validateEpisodeOutput(episodeId: number, output: any): Promise<ValidationResult>;

  /**
   * Link skill to OEIS sequence
   */
  linkSkillToSequence(
    skillId: number,
    sequenceId: number,
    relationship: SkillOeisLink['relationship'],
    confidence?: number
  ): Promise<void>;

  /**
   * Find patterns in sequence terms
   */
  findPatterns(terms: number[]): Promise<MathematicalPattern[]>;

  /**
   * Get OEIS sequences linked to skill
   */
  getSkillSequences(skillId: number): Promise<OeisSequence[]>;

  /**
   * Find related sequences semantically
   */
  findRelatedSequences(skill: { name: string; description?: string }): Promise<OeisSequence[]>;
}

/**
 * Pattern Matcher interface
 */
export interface IPatternMatcher {
  /**
   * Detect mathematical pattern in terms
   */
  detectPattern(terms: number[]): Promise<MathematicalPattern | null>;

  /**
   * Check if terms match a pattern
   */
  matchPattern(pattern: MathematicalPattern, terms: number[]): Promise<boolean>;

  /**
   * Find similar patterns
   */
  findSimilarPatterns(pattern: MathematicalPattern, limit?: number): Promise<MathematicalPattern[]>;

  /**
   * Generate mathematical formula for pattern
   */
  generateFormula(pattern: MathematicalPattern): Promise<string | null>;

  /**
   * Predict next terms using pattern
   */
  predictNextTerms(pattern: MathematicalPattern, count: number): Promise<number[]>;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * API rate limit status
 */
export interface RateLimitStatus {
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Sequence extraction result
 */
export interface SequenceExtractionResult {
  sequences: number[][];
  confidence: number;
  method: 'direct' | 'regex' | 'ml';
  metadata?: Record<string, any>;
}

/**
 * Top validated sequence (from view)
 */
export interface TopValidatedSequence {
  id: number;
  oeisId: string;
  name: string;
  validationCount: number;
  episodeCount: number;
  avgConfidence: number;
  linkedSkillsCount: number;
  lastValidation: number;
}

/**
 * CLI command options
 */
export interface OeisCliOptions {
  minConfidence?: number;
  limit?: number;
  relationship?: string;
  olderThan?: string;
  verbose?: boolean;
}

/**
 * Validation hook result
 */
export interface ValidationHookResult {
  validated: boolean;
  matches: OeisMatch[];
  patterns: MathematicalPattern[];
  error?: string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * OEIS integration errors
 */
export class OeisError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'OeisError';
  }
}

export class RateLimitError extends OeisError {
  constructor(message: string, public retryAfter: number) {
    super(message, 'RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends OeisError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends OeisError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

// ============================================================================
// Export All Types
// ============================================================================

export type {
  // Core
  OeisSequence,
  OeisReference,
  OeisMatch,

  // Linking
  SkillOeisLink,
  ValidatedSkillSequence,

  // Validation
  EpisodeSequenceValidation,
  EpisodeValidationSummary,

  // Patterns
  MathematicalPattern,
  PatternDiscoveryStats,

  // Queries
  SequenceValidationQuery,
  ValidationResult,
  SkillMathematicalProfile,

  // API
  OeisApiResponse,
  OeisApiSequence,

  // Cache
  OeisSearchCache,
  CacheStats,

  // Services
  IOeisApiClient,
  IOeisCache,
  ISequenceValidator,
  IPatternMatcher,

  // Utilities
  RateLimitStatus,
  SequenceExtractionResult,
  TopValidatedSequence,
  OeisCliOptions,
  ValidationHookResult,
};

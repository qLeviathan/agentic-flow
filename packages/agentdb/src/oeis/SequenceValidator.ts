/**
 * SequenceValidator - OEIS Sequence Validation
 *
 * Validates integer sequences against OEIS database.
 * Implements pattern matching, confidence scoring, and support for common sequences.
 */

import { OeisApiClient, type OeisSequence } from './OeisApiClient.js';
import { OeisCache } from './OeisCache.js';
import { MathematicalValidators } from './MathematicalValidators.js';

export interface ValidationResult {
  isValid: boolean;
  confidence: number;       // 0.0 to 1.0
  matchedSequence?: OeisSequence;
  sequenceId?: string;
  matchType: 'exact' | 'partial' | 'pattern' | 'formula' | 'none';
  matchDetails?: {
    matchedTerms: number;
    totalTerms: number;
    startIndex: number;
    formula?: string;
    deviation?: number;
  };
  suggestions?: OeisSequence[];
  error?: string;
}

export interface ValidatorConfig {
  apiClient?: OeisApiClient;
  cache?: OeisCache;
  minConfidence?: number;           // Minimum confidence for valid match
  minMatchLength?: number;          // Minimum terms to match
  maxSuggestions?: number;          // Max suggestions to return
  enablePatternMatching?: boolean;  // Enable fuzzy pattern matching
  enableFormulaValidation?: boolean; // Enable formula-based validation
  cacheResults?: boolean;           // Cache validation results
}

/**
 * Main sequence validator
 */
export class SequenceValidator {
  private apiClient: OeisApiClient;
  private cache: OeisCache;
  private mathValidators: MathematicalValidators;
  private config: Required<ValidatorConfig>;

  constructor(config: ValidatorConfig = {}) {
    this.apiClient = config.apiClient || new OeisApiClient();
    this.cache = config.cache || new OeisCache();
    this.mathValidators = new MathematicalValidators();

    this.config = {
      apiClient: this.apiClient,
      cache: this.cache,
      minConfidence: config.minConfidence ?? 0.8,
      minMatchLength: config.minMatchLength ?? 4,
      maxSuggestions: config.maxSuggestions ?? 5,
      enablePatternMatching: config.enablePatternMatching ?? true,
      enableFormulaValidation: config.enableFormulaValidation ?? true,
      cacheResults: config.cacheResults ?? true,
    };
  }

  /**
   * Initialize validator
   */
  async initialize(): Promise<void> {
    await this.cache.initialize();
    console.log('✅ OEIS validator initialized');
  }

  /**
   * Validate a sequence against OEIS
   */
  async validate(sequence: number[]): Promise<ValidationResult> {
    if (!sequence || sequence.length === 0) {
      return {
        isValid: false,
        confidence: 0,
        matchType: 'none',
        error: 'Empty sequence provided',
      };
    }

    if (sequence.length < this.config.minMatchLength) {
      return {
        isValid: false,
        confidence: 0,
        matchType: 'none',
        error: `Sequence too short (minimum ${this.config.minMatchLength} terms required)`,
      };
    }

    try {
      // 1. Try exact match with mathematical validators first (fast)
      const mathResult = await this.validateWithMathematicalPatterns(sequence);
      if (mathResult.confidence >= this.config.minConfidence) {
        return mathResult;
      }

      // 2. Search OEIS by values
      const searchResult = await this.apiClient.searchByValues(sequence.slice(0, 10));

      if (searchResult.count === 0) {
        // No matches found, but return math result if it exists
        if (mathResult.confidence > 0) {
          return mathResult;
        }

        return {
          isValid: false,
          confidence: 0,
          matchType: 'none',
          error: 'No matching sequences found in OEIS',
        };
      }

      // 3. Validate against top matches
      const validationResults = await Promise.all(
        searchResult.results.slice(0, this.config.maxSuggestions).map(seq =>
          this.validateAgainstSequence(sequence, seq)
        )
      );

      // Find best match
      const bestMatch = validationResults.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );

      // Cache the result if enabled
      if (this.config.cacheResults && bestMatch.matchedSequence) {
        await this.cache.set(bestMatch.matchedSequence);
      }

      // Add suggestions
      if (bestMatch.confidence < this.config.minConfidence) {
        bestMatch.suggestions = searchResult.results.slice(0, this.config.maxSuggestions);
      }

      return bestMatch;
    } catch (error) {
      console.error('Validation error:', error);
      return {
        isValid: false,
        confidence: 0,
        matchType: 'none',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Validate sequence by A-number
   */
  async validateByANumber(sequence: number[], aNumber: string): Promise<ValidationResult> {
    try {
      // Check cache first
      const cachedSeq = await this.cache.get(aNumber);
      let oeisSequence: OeisSequence | null;

      if (cachedSeq) {
        oeisSequence = cachedSeq;
      } else {
        oeisSequence = await this.apiClient.getSequence(aNumber);
        if (oeisSequence && this.config.cacheResults) {
          await this.cache.set(oeisSequence);
        }
      }

      if (!oeisSequence) {
        return {
          isValid: false,
          confidence: 0,
          matchType: 'none',
          error: `Sequence ${aNumber} not found in OEIS`,
        };
      }

      return this.validateAgainstSequence(sequence, oeisSequence);
    } catch (error) {
      return {
        isValid: false,
        confidence: 0,
        matchType: 'none',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Validate against a specific OEIS sequence
   */
  private async validateAgainstSequence(
    sequence: number[],
    oeisSequence: OeisSequence
  ): Promise<ValidationResult> {
    const oeisData = oeisSequence.data;

    if (!oeisData || oeisData.length === 0) {
      return {
        isValid: false,
        confidence: 0,
        matchType: 'none',
        error: 'OEIS sequence has no data',
      };
    }

    // Try exact match
    const exactMatch = this.checkExactMatch(sequence, oeisData);
    if (exactMatch.confidence >= this.config.minConfidence) {
      return {
        isValid: true,
        confidence: exactMatch.confidence,
        matchedSequence: oeisSequence,
        sequenceId: oeisSequence.id,
        matchType: 'exact',
        matchDetails: exactMatch,
      };
    }

    // Try partial match (subsequence)
    const partialMatch = this.checkPartialMatch(sequence, oeisData);
    if (partialMatch.confidence >= this.config.minConfidence) {
      return {
        isValid: true,
        confidence: partialMatch.confidence,
        matchedSequence: oeisSequence,
        sequenceId: oeisSequence.id,
        matchType: 'partial',
        matchDetails: partialMatch,
      };
    }

    // Try pattern match
    if (this.config.enablePatternMatching) {
      const patternMatch = this.checkPatternMatch(sequence, oeisData);
      if (patternMatch.confidence >= this.config.minConfidence) {
        return {
          isValid: true,
          confidence: patternMatch.confidence,
          matchedSequence: oeisSequence,
          sequenceId: oeisSequence.id,
          matchType: 'pattern',
          matchDetails: patternMatch,
        };
      }
    }

    // Return best result even if below threshold
    const bestResult = [exactMatch, partialMatch].reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );

    return {
      isValid: false,
      confidence: bestResult.confidence,
      matchedSequence: oeisSequence,
      sequenceId: oeisSequence.id,
      matchType: bestResult.confidence > 0 ? 'partial' : 'none',
      matchDetails: bestResult.confidence > 0 ? bestResult : undefined,
    };
  }

  /**
   * Check exact match
   */
  private checkExactMatch(sequence: number[], oeisData: number[]): {
    confidence: number;
    matchedTerms: number;
    totalTerms: number;
    startIndex: number;
    deviation: number;
  } {
    const maxLen = Math.min(sequence.length, oeisData.length);
    let matchedTerms = 0;
    let totalDeviation = 0;

    for (let i = 0; i < maxLen; i++) {
      if (sequence[i] === oeisData[i]) {
        matchedTerms++;
      } else {
        totalDeviation += Math.abs(sequence[i] - oeisData[i]);
      }
    }

    const confidence = matchedTerms / sequence.length;
    const avgDeviation = totalDeviation / maxLen;

    return {
      confidence,
      matchedTerms,
      totalTerms: sequence.length,
      startIndex: 0,
      deviation: avgDeviation,
    };
  }

  /**
   * Check partial match (sliding window)
   */
  private checkPartialMatch(sequence: number[], oeisData: number[]): {
    confidence: number;
    matchedTerms: number;
    totalTerms: number;
    startIndex: number;
    deviation: number;
  } {
    let bestMatch = {
      confidence: 0,
      matchedTerms: 0,
      totalTerms: sequence.length,
      startIndex: 0,
      deviation: Infinity,
    };

    // Try sliding window
    for (let start = 0; start <= oeisData.length - sequence.length; start++) {
      let matchedTerms = 0;
      let totalDeviation = 0;

      for (let i = 0; i < sequence.length; i++) {
        if (sequence[i] === oeisData[start + i]) {
          matchedTerms++;
        } else {
          totalDeviation += Math.abs(sequence[i] - oeisData[start + i]);
        }
      }

      const confidence = matchedTerms / sequence.length;
      const avgDeviation = totalDeviation / sequence.length;

      if (confidence > bestMatch.confidence ||
          (confidence === bestMatch.confidence && avgDeviation < bestMatch.deviation)) {
        bestMatch = {
          confidence,
          matchedTerms,
          totalTerms: sequence.length,
          startIndex: start,
          deviation: avgDeviation,
        };
      }
    }

    return bestMatch;
  }

  /**
   * Check pattern match (differences, ratios)
   */
  private checkPatternMatch(sequence: number[], oeisData: number[]): {
    confidence: number;
    matchedTerms: number;
    totalTerms: number;
    startIndex: number;
    deviation: number;
  } {
    // Check if differences match
    const seqDiffs = this.computeDifferences(sequence);
    const oeisDiffs = this.computeDifferences(oeisData.slice(0, sequence.length));

    let matchedDiffs = 0;
    let totalDeviation = 0;

    for (let i = 0; i < Math.min(seqDiffs.length, oeisDiffs.length); i++) {
      if (seqDiffs[i] === oeisDiffs[i]) {
        matchedDiffs++;
      } else {
        totalDeviation += Math.abs(seqDiffs[i] - oeisDiffs[i]);
      }
    }

    const confidence = seqDiffs.length > 0 ? matchedDiffs / seqDiffs.length : 0;
    const avgDeviation = seqDiffs.length > 0 ? totalDeviation / seqDiffs.length : 0;

    return {
      confidence: confidence * 0.9, // Slightly lower confidence for pattern match
      matchedTerms: matchedDiffs,
      totalTerms: seqDiffs.length,
      startIndex: 0,
      deviation: avgDeviation,
    };
  }

  /**
   * Compute differences between consecutive terms
   */
  private computeDifferences(sequence: number[]): number[] {
    const diffs: number[] = [];
    for (let i = 1; i < sequence.length; i++) {
      diffs.push(sequence[i] - sequence[i - 1]);
    }
    return diffs;
  }

  /**
   * Validate with mathematical patterns (Fibonacci, primes, etc.)
   */
  private async validateWithMathematicalPatterns(sequence: number[]): Promise<ValidationResult> {
    const validators = [
      { name: 'Fibonacci', id: 'A000045', fn: () => this.mathValidators.isFibonacci(sequence) },
      { name: 'Prime', id: 'A000040', fn: () => this.mathValidators.isPrime(sequence) },
      { name: 'Factorial', id: 'A000142', fn: () => this.mathValidators.isFactorial(sequence) },
      { name: 'Square', id: 'A000290', fn: () => this.mathValidators.isSquare(sequence) },
      { name: 'Cube', id: 'A000578', fn: () => this.mathValidators.isCube(sequence) },
      { name: 'Power of 2', id: 'A000079', fn: () => this.mathValidators.isPowerOf2(sequence) },
      { name: 'Triangular', id: 'A000217', fn: () => this.mathValidators.isTriangular(sequence) },
      { name: 'Even', id: 'A005843', fn: () => this.mathValidators.isEven(sequence) },
      { name: 'Odd', id: 'A005408', fn: () => this.mathValidators.isOdd(sequence) },
    ];

    for (const validator of validators) {
      const result = validator.fn();
      if (result.isValid && result.confidence >= this.config.minConfidence) {
        // Fetch the sequence for additional info
        const oeisSeq = await this.cache.get(validator.id) ||
                       await this.apiClient.getSequence(validator.id);

        return {
          isValid: true,
          confidence: result.confidence,
          sequenceId: validator.id,
          matchedSequence: oeisSeq || undefined,
          matchType: 'formula',
          matchDetails: {
            matchedTerms: result.matchedTerms || sequence.length,
            totalTerms: sequence.length,
            startIndex: 0,
            formula: result.formula,
          },
        };
      }
    }

    return {
      isValid: false,
      confidence: 0,
      matchType: 'none',
    };
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.cache.close();
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return this.cache.getStats();
  }
}

/**
 * Input Validation and Sanitization for AgentDB Security
 *
 * Provides comprehensive validation to prevent SQL injection and other attacks:
 * - Whitelist-based validation for identifiers (tables, columns, PRAGMA commands)
 * - Input sanitization for user data
 * - Type validation and constraints
 * - Error handling that doesn't leak sensitive information
 */

/**
 * Allowed table names in AgentDB (whitelist)
 */
const ALLOWED_TABLES = new Set([
  'episodes',
  'episode_embeddings',
  'skills',
  'skill_embeddings',
  'causal_edges',
  'causal_experiments',
  'causal_observations',
  'provenance_certificates',
  'reasoning_patterns',
  'pattern_embeddings',
  'rl_sessions',
  'rl_experiences',
  'rl_policies',
  'rl_q_values',
]);

/**
 * Allowed column names by table (whitelist)
 */
const ALLOWED_COLUMNS: Record<string, Set<string>> = {
  episodes: new Set([
    'id', 'ts', 'session_id', 'task', 'input', 'output', 'critique',
    'reward', 'success', 'latency_ms', 'tokens_used', 'tags', 'metadata'
  ]),
  skills: new Set([
    'id', 'ts', 'name', 'description', 'signature', 'code',
    'success_rate', 'uses', 'avg_reward', 'avg_latency_ms', 'tags', 'metadata'
  ]),
  causal_edges: new Set([
    'id', 'ts', 'from_memory_id', 'from_memory_type', 'to_memory_id',
    'to_memory_type', 'similarity', 'uplift', 'confidence', 'sample_size', 'evidence_ids'
  ]),
  // Add more as needed
};

/**
 * Allowed PRAGMA commands (whitelist)
 */
const ALLOWED_PRAGMAS = new Set([
  'journal_mode',
  'synchronous',
  'cache_size',
  'page_size',
  'page_count',
  'user_version',
  'foreign_keys',
  'temp_store',
  'mmap_size',
  'wal_autocheckpoint',
]);

/**
 * Validation error with safe error messages
 */
export class ValidationError extends Error {
  public readonly code: string;
  public readonly field?: string;

  constructor(message: string, code: string = 'VALIDATION_ERROR', field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.field = field;
  }

  /**
   * Get safe error message (doesn't leak sensitive info)
   */
  getSafeMessage(): string {
    return `Invalid input: ${this.field || 'unknown field'}`;
  }
}

/**
 * Validate table name against whitelist
 */
export function validateTableName(tableName: string): string {
  if (!tableName || typeof tableName !== 'string') {
    throw new ValidationError('Table name must be a non-empty string', 'INVALID_TABLE', 'tableName');
  }

  const sanitized = tableName.trim().toLowerCase();

  if (!ALLOWED_TABLES.has(sanitized)) {
    throw new ValidationError(
      `Invalid table name: ${sanitized}. Allowed tables: ${Array.from(ALLOWED_TABLES).join(', ')}`,
      'INVALID_TABLE',
      'tableName'
    );
  }

  return sanitized;
}

/**
 * Validate column name against whitelist
 */
export function validateColumnName(tableName: string, columnName: string): string {
  if (!columnName || typeof columnName !== 'string') {
    throw new ValidationError('Column name must be a non-empty string', 'INVALID_COLUMN', 'columnName');
  }

  const sanitized = columnName.trim().toLowerCase();
  const validatedTable = validateTableName(tableName);

  const allowedColumns = ALLOWED_COLUMNS[validatedTable];
  if (allowedColumns && !allowedColumns.has(sanitized)) {
    throw new ValidationError(
      `Invalid column name for table ${validatedTable}: ${sanitized}`,
      'INVALID_COLUMN',
      'columnName'
    );
  }

  return sanitized;
}

/**
 * Validate PRAGMA command against whitelist
 */
export function validatePragmaCommand(pragma: string): string {
  if (!pragma || typeof pragma !== 'string') {
    throw new ValidationError('PRAGMA command must be a non-empty string', 'INVALID_PRAGMA', 'pragma');
  }

  // Extract the pragma name (before any = or space)
  const pragmaName = pragma.trim().toLowerCase().split(/[=\s]/)[0];

  if (!ALLOWED_PRAGMAS.has(pragmaName)) {
    throw new ValidationError(
      `Invalid PRAGMA command: ${pragmaName}. Allowed: ${Array.from(ALLOWED_PRAGMAS).join(', ')}`,
      'INVALID_PRAGMA',
      'pragma'
    );
  }

  // Return the full pragma for execution (e.g., "journal_mode = WAL")
  return pragma.trim();
}

/**
 * Validate and sanitize session ID
 */
export function validateSessionId(sessionId: string): string {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new ValidationError('Session ID must be a non-empty string', 'INVALID_SESSION_ID', 'sessionId');
  }

  // Allow alphanumeric, hyphens, underscores (max 255 chars)
  const sanitized = sessionId.trim();

  if (sanitized.length > 255) {
    throw new ValidationError('Session ID exceeds maximum length (255)', 'INVALID_SESSION_ID', 'sessionId');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    throw new ValidationError(
      'Session ID must contain only alphanumeric characters, hyphens, and underscores',
      'INVALID_SESSION_ID',
      'sessionId'
    );
  }

  return sanitized;
}

/**
 * Validate numeric ID
 */
export function validateId(id: any, fieldName: string = 'id'): number {
  const numId = Number(id);

  if (!Number.isFinite(numId) || numId < 0 || !Number.isInteger(numId)) {
    throw new ValidationError(`${fieldName} must be a non-negative integer`, 'INVALID_ID', fieldName);
  }

  return numId;
}

/**
 * Validate timestamp
 */
export function validateTimestamp(timestamp: any, fieldName: string = 'timestamp'): number {
  const numTs = Number(timestamp);

  if (!Number.isFinite(numTs) || numTs < 0) {
    throw new ValidationError(`${fieldName} must be a non-negative number`, 'INVALID_TIMESTAMP', fieldName);
  }

  // Reasonable timestamp bounds (2000-01-01 to 2100-01-01)
  const MIN_TIMESTAMP = 946684800; // 2000-01-01
  const MAX_TIMESTAMP = 4102444800; // 2100-01-01

  if (numTs < MIN_TIMESTAMP || numTs > MAX_TIMESTAMP) {
    throw new ValidationError(
      `${fieldName} is out of valid range (2000-2100)`,
      'INVALID_TIMESTAMP',
      fieldName
    );
  }

  return numTs;
}

/**
 * Validate reward value (0-1)
 */
export function validateReward(reward: any): number {
  const numReward = Number(reward);

  if (!Number.isFinite(numReward)) {
    throw new ValidationError('Reward must be a number', 'INVALID_REWARD', 'reward');
  }

  if (numReward < 0 || numReward > 1) {
    throw new ValidationError('Reward must be between 0 and 1', 'INVALID_REWARD', 'reward');
  }

  return numReward;
}

/**
 * Validate success flag
 */
export function validateSuccess(success: any): boolean {
  if (typeof success === 'boolean') {
    return success;
  }

  if (typeof success === 'number') {
    return success !== 0;
  }

  if (typeof success === 'string') {
    const lower = success.toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes') return true;
    if (lower === 'false' || lower === '0' || lower === 'no') return false;
  }

  throw new ValidationError('Success must be a boolean value', 'INVALID_BOOLEAN', 'success');
}

/**
 * Sanitize text input (prevent extremely long strings, null bytes, etc.)
 */
export function sanitizeText(text: string, maxLength: number = 100000, fieldName: string = 'text'): string {
  if (typeof text !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, 'INVALID_TEXT', fieldName);
  }

  // Remove null bytes
  const sanitized = text.replace(/\0/g, '');

  if (sanitized.length > maxLength) {
    throw new ValidationError(
      `${fieldName} exceeds maximum length (${maxLength})`,
      'TEXT_TOO_LONG',
      fieldName
    );
  }

  return sanitized;
}

/**
 * Build safe WHERE clause with parameterized values
 * Returns both the SQL clause and the parameter values
 */
export function buildSafeWhereClause(
  tableName: string,
  conditions: Record<string, any>
): { clause: string; values: any[] } {
  const validatedTable = validateTableName(tableName);

  if (!conditions || typeof conditions !== 'object' || Object.keys(conditions).length === 0) {
    throw new ValidationError('Conditions must be a non-empty object', 'INVALID_CONDITIONS', 'conditions');
  }

  const clauses: string[] = [];
  const values: any[] = [];

  for (const [column, value] of Object.entries(conditions)) {
    const validatedColumn = validateColumnName(validatedTable, column);
    clauses.push(`${validatedColumn} = ?`);
    values.push(value);
  }

  return {
    clause: clauses.join(' AND '),
    values,
  };
}

/**
 * Build safe SET clause for UPDATE statements
 */
export function buildSafeSetClause(
  tableName: string,
  updates: Record<string, any>
): { clause: string; values: any[] } {
  const validatedTable = validateTableName(tableName);

  if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
    throw new ValidationError('Updates must be a non-empty object', 'INVALID_UPDATES', 'updates');
  }

  const clauses: string[] = [];
  const values: any[] = [];

  for (const [column, value] of Object.entries(updates)) {
    const validatedColumn = validateColumnName(validatedTable, column);
    clauses.push(`${validatedColumn} = ?`);
    values.push(value);
  }

  return {
    clause: clauses.join(', '),
    values,
  };
}

/**
 * Validate JSON data
 */
export function validateJSON(data: any, fieldName: string = 'json'): string {
  try {
    return JSON.stringify(data);
  } catch (error) {
    throw new ValidationError(`${fieldName} is not valid JSON`, 'INVALID_JSON', fieldName);
  }
}

/**
 * Validate array of tags
 */
export function validateTags(tags: any): string[] {
  if (!Array.isArray(tags)) {
    throw new ValidationError('Tags must be an array', 'INVALID_TAGS', 'tags');
  }

  const sanitized = tags.map((tag, i) => {
    if (typeof tag !== 'string') {
      throw new ValidationError(`Tag at index ${i} must be a string`, 'INVALID_TAG', `tags[${i}]`);
    }
    return sanitizeText(tag, 100, `tags[${i}]`);
  });

  return sanitized;
}

/**
 * Safe error handler that doesn't leak sensitive information
 */
export function handleSecurityError(error: any): string {
  if (error instanceof ValidationError) {
    // Safe to return validation errors
    return error.message;
  }

  // For other errors, return generic message and log details internally
  console.error('Security error:', error);
  return 'An error occurred while processing your request. Please check your input and try again.';
}

// ========================================================================
// OEIS Sequence Validation
// ========================================================================

/**
 * OEIS sequence pattern interface
 */
export interface OEISSequencePattern {
  sequence: number[];
  confidence: number;
  source: string;
  metadata?: Record<string, any>;
}

/**
 * Validate a numeric sequence for OEIS compatibility
 *
 * @param sequence - Array of numbers to validate
 * @param options - Validation options
 * @returns Validated sequence
 * @throws {ValidationError} If sequence is invalid
 *
 * @example
 * const validSeq = validateSequence([1, 1, 2, 3, 5, 8]); // Fibonacci
 * const invalidSeq = validateSequence([NaN, 1, 2]); // Throws error
 */
export function validateSequence(
  sequence: any,
  options: {
    minLength?: number;
    maxLength?: number;
    allowNegative?: boolean;
    allowFloats?: boolean;
    maxValue?: number;
  } = {}
): number[] {
  const {
    minLength = 3,
    maxLength = 10000,
    allowNegative = true,
    allowFloats = false,
    maxValue = Number.MAX_SAFE_INTEGER
  } = options;

  if (!Array.isArray(sequence)) {
    throw new ValidationError('Sequence must be an array', 'INVALID_SEQUENCE', 'sequence');
  }

  if (sequence.length < minLength) {
    throw new ValidationError(
      `Sequence must have at least ${minLength} elements`,
      'SEQUENCE_TOO_SHORT',
      'sequence'
    );
  }

  if (sequence.length > maxLength) {
    throw new ValidationError(
      `Sequence exceeds maximum length (${maxLength})`,
      'SEQUENCE_TOO_LONG',
      'sequence'
    );
  }

  const validated: number[] = [];

  for (let i = 0; i < sequence.length; i++) {
    const value = Number(sequence[i]);

    if (!Number.isFinite(value)) {
      throw new ValidationError(
        `Sequence element at index ${i} is not a valid number`,
        'INVALID_SEQUENCE_ELEMENT',
        `sequence[${i}]`
      );
    }

    if (!allowFloats && !Number.isInteger(value)) {
      throw new ValidationError(
        `Sequence element at index ${i} must be an integer`,
        'INVALID_SEQUENCE_ELEMENT',
        `sequence[${i}]`
      );
    }

    if (!allowNegative && value < 0) {
      throw new ValidationError(
        `Sequence element at index ${i} must be non-negative`,
        'INVALID_SEQUENCE_ELEMENT',
        `sequence[${i}]`
      );
    }

    if (Math.abs(value) > maxValue) {
      throw new ValidationError(
        `Sequence element at index ${i} exceeds maximum value`,
        'INVALID_SEQUENCE_ELEMENT',
        `sequence[${i}]`
      );
    }

    validated.push(value);
  }

  return validated;
}

/**
 * Validate and normalize an OEIS sequence pattern
 *
 * @param pattern - The sequence pattern to validate
 * @returns Validated pattern
 * @throws {ValidationError} If pattern is invalid
 *
 * @example
 * const pattern = validateSequencePattern({
 *   sequence: [1, 1, 2, 3, 5],
 *   confidence: 0.95,
 *   source: 'output-analysis'
 * });
 */
export function validateSequencePattern(pattern: any): OEISSequencePattern {
  if (!pattern || typeof pattern !== 'object') {
    throw new ValidationError(
      'Sequence pattern must be an object',
      'INVALID_PATTERN',
      'pattern'
    );
  }

  // Validate sequence array
  const sequence = validateSequence(pattern.sequence, {
    minLength: 3,
    maxLength: 100,
    allowNegative: true,
    allowFloats: false
  });

  // Validate confidence (0-1)
  let confidence = Number(pattern.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    confidence = 0.5; // Default confidence
  }

  // Validate source string
  if (!pattern.source || typeof pattern.source !== 'string') {
    throw new ValidationError(
      'Pattern source must be a non-empty string',
      'INVALID_PATTERN',
      'pattern.source'
    );
  }

  const source = sanitizeText(pattern.source, 500, 'pattern.source');

  // Validate metadata if present
  let metadata: Record<string, any> | undefined;
  if (pattern.metadata) {
    if (typeof pattern.metadata !== 'object') {
      throw new ValidationError(
        'Pattern metadata must be an object',
        'INVALID_PATTERN',
        'pattern.metadata'
      );
    }
    metadata = pattern.metadata;
  }

  return {
    sequence,
    confidence,
    source,
    metadata
  };
}

/**
 * Extract numeric sequences from text output
 * Detects comma-separated, space-separated, or newline-separated numbers
 *
 * @param text - Text to analyze
 * @param options - Extraction options
 * @returns Array of detected sequences
 *
 * @example
 * const sequences = extractSequencesFromText("Results: 1, 1, 2, 3, 5, 8, 13");
 * // Returns: [[1, 1, 2, 3, 5, 8, 13]]
 */
export function extractSequencesFromText(
  text: string,
  options: {
    minLength?: number;
    maxLength?: number;
    allowNegative?: boolean;
  } = {}
): number[][] {
  const { minLength = 3, maxLength = 100, allowNegative = true } = options;

  if (typeof text !== 'string' || text.length === 0) {
    return [];
  }

  const sequences: number[][] = [];

  // Pattern 1: Match comma-separated numbers (e.g., "1, 2, 3, 5, 8")
  const commaPattern = /(-?\d+)(?:\s*,\s*(-?\d+))+/g;
  let match;

  while ((match = commaPattern.exec(text)) !== null) {
    const sequenceText = match[0];
    const numbers = sequenceText.split(',').map(s => parseInt(s.trim(), 10));

    if (numbers.length >= minLength && numbers.length <= maxLength) {
      if (allowNegative || numbers.every(n => n >= 0)) {
        sequences.push(numbers);
      }
    }
  }

  // Pattern 2: Match space-separated numbers in brackets/parens (e.g., "[1 2 3 5 8]")
  const bracketPattern = /[\[\(](-?\d+(?:\s+-?\d+)+)[\]\)]/g;

  while ((match = bracketPattern.exec(text)) !== null) {
    const sequenceText = match[1];
    const numbers = sequenceText.trim().split(/\s+/).map(s => parseInt(s, 10));

    if (numbers.length >= minLength && numbers.length <= maxLength) {
      if (allowNegative || numbers.every(n => n >= 0)) {
        sequences.push(numbers);
      }
    }
  }

  // Pattern 3: Match newline-separated numbers
  const lines = text.split('\n');
  const lineNumbers: number[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^-?\d+$/.test(trimmed)) {
      lineNumbers.push(parseInt(trimmed, 10));
    } else if (lineNumbers.length >= minLength) {
      // End of sequence
      if (lineNumbers.length <= maxLength) {
        if (allowNegative || lineNumbers.every(n => n >= 0)) {
          sequences.push([...lineNumbers]);
        }
      }
      lineNumbers.length = 0;
    } else {
      lineNumbers.length = 0;
    }
  }

  // Check final sequence
  if (lineNumbers.length >= minLength && lineNumbers.length <= maxLength) {
    if (allowNegative || lineNumbers.every(n => n >= 0)) {
      sequences.push(lineNumbers);
    }
  }

  return sequences;
}

/**
 * Calculate sequence similarity using multiple metrics
 * Returns a score between 0 and 1
 *
 * @param seq1 - First sequence
 * @param seq2 - Second sequence
 * @returns Similarity score (0-1)
 *
 * @example
 * const similarity = calculateSequenceSimilarity([1,2,3,5,8], [1,2,3,5,8,13]);
 * // Returns: ~0.95 (high similarity despite different lengths)
 */
export function calculateSequenceSimilarity(seq1: number[], seq2: number[]): number {
  if (seq1.length === 0 || seq2.length === 0) {
    return 0;
  }

  // Exact match
  if (seq1.length === seq2.length && seq1.every((val, i) => val === seq2[i])) {
    return 1.0;
  }

  // Use longest common subsequence approach
  const minLen = Math.min(seq1.length, seq2.length);
  let matchCount = 0;

  for (let i = 0; i < minLen; i++) {
    if (seq1[i] === seq2[i]) {
      matchCount++;
    }
  }

  // Calculate similarity based on matches and length difference
  const matchRatio = matchCount / minLen;
  const lengthRatio = minLen / Math.max(seq1.length, seq2.length);

  // Weighted average: 70% match quality, 30% length similarity
  return matchRatio * 0.7 + lengthRatio * 0.3;
}

/**
 * Detect common mathematical sequence patterns
 *
 * @param sequence - The numeric sequence to analyze
 * @returns Pattern description or null if no pattern detected
 *
 * @example
 * const pattern = detectSequencePattern([1, 1, 2, 3, 5, 8]);
 * // Returns: { type: 'fibonacci', confidence: 0.95, description: 'Fibonacci sequence' }
 */
export function detectSequencePattern(sequence: number[]): {
  type: string;
  confidence: number;
  description: string;
} | null {
  if (sequence.length < 3) {
    return null;
  }

  // Check for arithmetic sequence (constant difference)
  if (sequence.length >= 3) {
    const diff = sequence[1] - sequence[0];
    let isArithmetic = true;

    for (let i = 2; i < sequence.length; i++) {
      if (sequence[i] - sequence[i - 1] !== diff) {
        isArithmetic = false;
        break;
      }
    }

    if (isArithmetic) {
      return {
        type: 'arithmetic',
        confidence: 1.0,
        description: `Arithmetic sequence with difference ${diff}`
      };
    }
  }

  // Check for geometric sequence (constant ratio)
  if (sequence.length >= 3 && sequence[0] !== 0) {
    const ratio = sequence[1] / sequence[0];
    let isGeometric = true;

    for (let i = 2; i < sequence.length; i++) {
      if (sequence[i - 1] === 0 || Math.abs(sequence[i] / sequence[i - 1] - ratio) > 0.0001) {
        isGeometric = false;
        break;
      }
    }

    if (isGeometric) {
      return {
        type: 'geometric',
        confidence: 1.0,
        description: `Geometric sequence with ratio ${ratio}`
      };
    }
  }

  // Check for Fibonacci-like (each term is sum of previous two)
  if (sequence.length >= 4) {
    let isFibonacci = true;

    for (let i = 2; i < sequence.length; i++) {
      if (sequence[i] !== sequence[i - 1] + sequence[i - 2]) {
        isFibonacci = false;
        break;
      }
    }

    if (isFibonacci) {
      return {
        type: 'fibonacci',
        confidence: 1.0,
        description: 'Fibonacci-like sequence (a(n) = a(n-1) + a(n-2))'
      };
    }
  }

  // Check for powers (squares, cubes, etc.)
  if (sequence.length >= 3) {
    const powers = [2, 3, 4, 5];

    for (const power of powers) {
      let isPowerSequence = true;

      for (let i = 0; i < sequence.length; i++) {
        const expected = Math.pow(i + 1, power);
        if (Math.abs(sequence[i] - expected) > 0.0001) {
          isPowerSequence = false;
          break;
        }
      }

      if (isPowerSequence) {
        const powerName = power === 2 ? 'squares' : power === 3 ? 'cubes' : `${power}th powers`;
        return {
          type: `power-${power}`,
          confidence: 1.0,
          description: `Sequence of ${powerName}`
        };
      }
    }
  }

  return null;
}

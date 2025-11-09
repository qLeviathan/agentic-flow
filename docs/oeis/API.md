# OEIS Integration - Complete API Reference

Comprehensive API documentation for all OEIS integration classes, interfaces, and methods.

## Table of Contents

- [Core Classes](#core-classes)
- [Interfaces](#interfaces)
- [SequenceValidator](#sequencevalidator)
- [OeisApiClient](#oeisapiclient)
- [OeisCache](#oeiscache)
- [MathematicalValidators](#mathematicalvalidators)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Core Classes

### SequenceValidator

Main class for validating integer sequences against OEIS database.

#### Constructor

```typescript
constructor(config?: ValidatorConfig)
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `config` | `ValidatorConfig` | `{}` | Configuration object |

**Example:**

```typescript
const validator = new SequenceValidator({
  minConfidence: 0.85,
  minMatchLength: 5,
  enablePatternMatching: true,
  cacheResults: true,
});
```

#### Methods

##### initialize()

Initialize validator and cache database.

```typescript
async initialize(): Promise<void>
```

**Returns:** Promise that resolves when initialization is complete

**Throws:** May log warnings if cache initialization fails

**Example:**

```typescript
await validator.initialize();
```

##### validate()

Validate a sequence against OEIS database.

```typescript
async validate(sequence: number[]): Promise<ValidationResult>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sequence` | `number[]` | Integer sequence to validate |

**Returns:** `Promise<ValidationResult>`

**Throws:** `OeisApiError` if network request fails

**Behavior:**

1. Checks if sequence meets minimum length requirement
2. Validates against mathematical patterns (if enabled)
3. Searches OEIS by values if math validation insufficient
4. Evaluates top matches with confidence scoring
5. Caches results if caching enabled

**Example:**

```typescript
const result = await validator.validate([0, 1, 1, 2, 3, 5, 8, 13]);
// {
//   isValid: true,
//   confidence: 1.0,
//   matchedSequence: { ... },
//   sequenceId: 'A000045',
//   matchType: 'exact',
//   matchDetails: { matchedTerms: 8, totalTerms: 8, startIndex: 0 }
// }
```

##### validateByANumber()

Validate sequence against specific OEIS sequence by A-number.

```typescript
async validateByANumber(
  sequence: number[],
  aNumber: string
): Promise<ValidationResult>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sequence` | `number[]` | Sequence to validate |
| `aNumber` | `string` | OEIS A-number (e.g., "A000045", "45") |

**Returns:** `Promise<ValidationResult>`

**Throws:** `OeisApiError` if A-number is invalid

**Example:**

```typescript
// Validate against Fibonacci (A000045)
const result = await validator.validateByANumber(
  [0, 1, 1, 2, 3, 5, 8],
  'A000045'
);
```

##### getCacheStats()

Get cache performance statistics.

```typescript
async getCacheStats(): Promise<CacheStats>
```

**Returns:**

```typescript
interface CacheStats {
  count: number;           // Total cached entries
  memorySize: number;      // Entries in memory cache
  diskSize: number;        // Entries in database cache
  topSequences: Array<{
    id: string;
    hitCount: number;
  }>;
}
```

**Example:**

```typescript
const stats = await validator.getCacheStats();
console.log(`${stats.count} sequences cached`);
console.log(`Top sequence: ${stats.topSequences[0]?.id}`);
```

##### close()

Close database connections and clean up resources.

```typescript
async close(): Promise<void>
```

**Returns:** Promise that resolves when cleanup is complete

**Important:** Always call this when done to avoid resource leaks

**Example:**

```typescript
try {
  // use validator
} finally {
  await validator.close();
}
```

---

### OeisApiClient

Direct API client for OEIS with rate limiting and error handling.

#### Constructor

```typescript
constructor(config?: OeisApiConfig)
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `config` | `OeisApiConfig` | `{}` | Configuration object |

**Config Options:**

```typescript
interface OeisApiConfig {
  baseUrl?: string;        // OEIS base URL (default: https://oeis.org)
  rateLimit?: number;      // Requests per minute (default: 10)
  timeout?: number;        // Request timeout in ms (default: 30000)
  maxRetries?: number;     // Max retry attempts (default: 3)
  retryDelay?: number;     // Delay between retries in ms (default: 1000)
}
```

**Example:**

```typescript
const client = new OeisApiClient({
  rateLimit: 5,           // Conservative rate limiting
  timeout: 60000,         // 60 second timeout
  maxRetries: 5,
  retryDelay: 2000,
});
```

#### Methods

##### search()

Search for sequences matching a query.

```typescript
async search(query: string, start?: number): Promise<OeisSearchResult>
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `query` | `string` | - | Search query (text or sequence) |
| `start` | `number` | `0` | Pagination start index |

**Returns:** `Promise<OeisSearchResult>`

**Example:**

```typescript
// Text search
const textResult = await client.search('Fibonacci');

// Sequence search
const seqResult = await client.search('0,1,1,2,3,5,8');

// Pagination
const page2 = await client.search('primes', 10);
```

##### getSequence()

Get a specific sequence by A-number.

```typescript
async getSequence(aNumber: string): Promise<OeisSequence | null>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `aNumber` | `string` | A-number (auto-formats: "45" → "A000045") |

**Returns:**
- `Promise<OeisSequence>` if found
- `Promise<null>` if not found
- Throws `OeisApiError` on network error

**Example:**

```typescript
const seq = await client.getSequence('A000045');
if (seq) {
  console.log(seq.name);  // Fibonacci numbers
}

// Auto-format handling
const seq2 = await client.getSequence('45');      // → A000045
const seq3 = await client.getSequence('A45');     // → A000045
```

##### searchByValues()

Search for sequences by their values.

```typescript
async searchByValues(values: number[]): Promise<OeisSearchResult>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `values` | `number[]` | Sequence values to search |

**Returns:** `Promise<OeisSearchResult>`

**Example:**

```typescript
const result = await client.searchByValues([1, 1, 2, 3, 5, 8]);
console.log(`Found ${result.count} matches`);
console.log(result.results[0]?.id);  // A000045
```

##### Utility Methods

```typescript
// Parse sequence data from OEIS format
parseSequenceData(sequence: OeisSequence): number[]

// Get sequence formulas
getFormulas(sequence: OeisSequence): string[]

// Check if sequence is finite
isFiniteSequence(sequence: OeisSequence): boolean

// Check if sequence is easy to compute
isEasySequence(sequence: OeisSequence): boolean

// Get cross-references to other sequences
getCrossReferences(sequence: OeisSequence): string[]
```

**Examples:**

```typescript
const seq = await client.getSequence('A000045');
if (seq) {
  const data = client.parseSequenceData(seq);
  const formulas = client.getFormulas(seq);
  const refs = client.getCrossReferences(seq);

  console.log(data);      // [0, 1, 1, 2, 3, 5, ...]
  console.log(formulas);  // ['F(n) = F(n-1) + F(n-2)', ...]
  console.log(refs);      // ['A000108', 'A000110', ...]
}
```

---

### OeisCache

SQLite-based persistent caching for OEIS sequences.

#### Constructor

```typescript
constructor(config?: CacheConfig)
```

**Parameters:**

```typescript
interface CacheConfig {
  dbPath?: string;           // Database file path (default: ':memory:')
  defaultTTL?: number;       // Default TTL in seconds (default: 86400 = 24h)
  maxCacheSize?: number;     // Max cached entries (default: 10000)
  preloadPopular?: boolean;  // Preload popular sequences (default: true)
}
```

**Example:**

```typescript
// Persistent cache
const cache = new OeisCache({
  dbPath: './oeis-cache.db',
  defaultTTL: 604800,         // 7 days
  maxCacheSize: 50000,
  preloadPopular: true,
});

// In-memory cache
const memCache = new OeisCache({
  dbPath: ':memory:',
  defaultTTL: 3600,
});
```

#### Methods

##### initialize()

Initialize cache database.

```typescript
async initialize(): Promise<void>
```

**Returns:** Promise that resolves when database is initialized

**Behavior:**
- Creates tables if they don't exist
- Sets up indexes for performance
- Preloads popular sequences if enabled
- Continues with memory-only mode if database init fails

**Example:**

```typescript
await cache.initialize();
```

##### get()

Retrieve sequence from cache.

```typescript
async get(id: string): Promise<OeisSequence | null>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | OEIS A-number (e.g., "A000045") |

**Returns:**
- `Promise<OeisSequence>` if found and not expired
- `Promise<null>` if not found or expired

**Behavior:**
- Checks memory cache first (microseconds)
- Falls back to database cache (milliseconds)
- Expires and removes stale entries
- Updates hit count for popular sequences

**Example:**

```typescript
const fib = await cache.get('A000045');
if (fib) {
  console.log(fib.data);  // [0, 1, 1, 2, 3, 5, ...]
}
```

##### set()

Store sequence in cache.

```typescript
async set(sequence: OeisSequence, ttl?: number): Promise<void>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sequence` | `OeisSequence` | Sequence to cache |
| `ttl` | `number` | Optional TTL in seconds |

**Example:**

```typescript
const seq = await client.getSequence('A000045');
await cache.set(seq, 604800);  // 7 day TTL
```

##### has()

Check if sequence is cached.

```typescript
async has(id: string): Promise<boolean>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | OEIS A-number |

**Returns:** `Promise<boolean>`

**Example:**

```typescript
if (await cache.has('A000045')) {
  console.log('Fibonacci is cached');
}
```

##### delete()

Remove sequence from cache.

```typescript
async delete(id: string): Promise<void>
```

**Example:**

```typescript
await cache.delete('A000045');
```

##### clear()

Clear all cache entries.

```typescript
async clear(): Promise<void>
```

**Example:**

```typescript
await cache.clear();
```

##### getStats()

Get cache statistics.

```typescript
async getStats(): Promise<CacheStats>
```

**Returns:**

```typescript
interface CacheStats {
  count: number;
  memorySize: number;
  diskSize: number;
  topSequences: Array<{
    id: string;
    hitCount: number;
  }>;
}
```

**Example:**

```typescript
const stats = await cache.getStats();
console.log(`Cache: ${stats.count} entries`);
stats.topSequences.forEach(seq => {
  console.log(`${seq.id}: ${seq.hitCount} hits`);
});
```

##### listCached()

Get list of cached sequence IDs.

```typescript
async listCached(): Promise<string[]>
```

**Returns:** `Promise<string[]>`

**Example:**

```typescript
const cached = await cache.listCached();
console.log('Cached sequences:', cached);
```

##### close()

Close database connection.

```typescript
async close(): Promise<void>
```

**Example:**

```typescript
await cache.close();
```

---

### MathematicalValidators

Pattern recognition for common mathematical sequences (no I/O, all local).

#### Supported Methods

All methods follow the same pattern:

```typescript
methodName(sequence: number[]): MathValidationResult
```

**Returns:**

```typescript
interface MathValidationResult {
  isValid: boolean;
  confidence: number;      // 0.0 to 1.0
  formula?: string;
  matchedTerms?: number;
  error?: string;
}
```

#### Complete Method Reference

##### Arithmetic Sequences

```typescript
// Fibonacci: F(n) = F(n-1) + F(n-2)
isFibonacci(sequence: number[]): MathValidationResult

// Arithmetic progression: a(n) = a + nd
isArithmeticProgression(sequence: number[]): MathValidationResult

// Geometric progression: a(n) = a × r^n
isGeometricProgression(sequence: number[]): MathValidationResult

// Catalan: C(n) = (2n)! / ((n+1)! × n!)
isCatalan(sequence: number[]): MathValidationResult
```

##### Power Functions

```typescript
// Perfect squares: n²
isSquare(sequence: number[]): MathValidationResult

// Perfect cubes: n³
isCube(sequence: number[]): MathValidationResult

// Powers of 2: 2^n
isPowerOf2(sequence: number[]): MathValidationResult

// Powers of 3: 3^n
isPowerOf3(sequence: number[]): MathValidationResult
```

##### Special Sequences

```typescript
// Prime numbers
isPrime(sequence: number[]): MathValidationResult

// Factorials: n!
isFactorial(sequence: number[]): MathValidationResult

// Triangular: T(n) = n(n+1)/2
isTriangular(sequence: number[]): MathValidationResult

// Perfect numbers (sum of proper divisors)
isPerfect(sequence: number[]): MathValidationResult

// Composite numbers (not prime)
isComposite(sequence: number[]): MathValidationResult
```

##### Simple Sequences

```typescript
// Even numbers: 2n
isEven(sequence: number[]): MathValidationResult

// Odd numbers: 2n + 1
isOdd(sequence: number[]): MathValidationResult

// Non-negative integers: n
isNonNegativeIntegers(sequence: number[]): MathValidationResult
```

##### Helper Methods

```typescript
// Check if single number is prime
isPrimeNumber(n: number): boolean

// Check if single number is perfect
isPerfectNumber(n: number): boolean
```

#### Examples

```typescript
const validators = new MathematicalValidators();

// Fibonacci
const fib = validators.isFibonacci([0, 1, 1, 2, 3, 5, 8, 13]);
// { isValid: true, confidence: 1.0, formula: 'F(n) = F(n-1) + F(n-2)', ... }

// Primes
const primes = validators.isPrime([2, 3, 5, 7, 11]);
// { isValid: true, confidence: 1.0, formula: 'Prime numbers: ...', ... }

// Arithmetic progression
const arithmetic = validators.isArithmeticProgression([2, 5, 8, 11, 14]);
// { isValid: true, confidence: 1.0, formula: 'a(n) = 2 + 3n', ... }

// Invalid sequence
const invalid = validators.isFibonacci([1, 2, 3, 4, 5]);
// { isValid: false, confidence: 0, ... }
```

---

## Interfaces

### ValidationResult

```typescript
interface ValidationResult {
  // Whether sequence is valid
  isValid: boolean;

  // Confidence score (0.0 to 1.0)
  confidence: number;

  // Full OEIS sequence information (if matched)
  matchedSequence?: OeisSequence;

  // OEIS A-number (e.g., "A000045")
  sequenceId?: string;

  // Type of match
  matchType: 'exact' | 'partial' | 'pattern' | 'formula' | 'none';

  // Detailed match information
  matchDetails?: {
    matchedTerms: number;      // Number of matching terms
    totalTerms: number;        // Total terms in input sequence
    startIndex: number;        // Where match starts in OEIS data
    formula?: string;          // Mathematical formula if applicable
    deviation?: number;        // Average deviation from expected
  };

  // Alternative sequence matches (if confidence < threshold)
  suggestions?: OeisSequence[];

  // Error message if validation failed
  error?: string;
}
```

### OeisSequence

```typescript
interface OeisSequence {
  // Sequence number (without "A" prefix)
  number: number;

  // Full ID (e.g., "A000045")
  id: string;

  // Sequence values
  data: number[];

  // Sequence name/description
  name: string;

  // Comments about the sequence
  comment?: string[];

  // Mathematical formulas
  formula?: string[];

  // Usage examples
  example?: string[];

  // Keywords (e.g., "nonn", "easy", "core")
  keyword?: string[];

  // Offset information
  offset?: string;

  // Author information
  author?: string;

  // References
  references?: string[];

  // External links
  links?: string[];

  // Cross-references to other sequences
  crossrefs?: string[];

  // Extensions to the sequence
  extensions?: string[];
}
```

### OeisSearchResult

```typescript
interface OeisSearchResult {
  // Number of matches found
  count: number;

  // Array of matching sequences
  results: OeisSequence[];

  // Start index for pagination
  start: number;

  // Optional greeting from API
  greeting?: string;
}
```

### ValidatorConfig

```typescript
interface ValidatorConfig {
  // Custom API client instance
  apiClient?: OeisApiClient;

  // Custom cache instance
  cache?: OeisCache;

  // Minimum confidence for valid match (0.0-1.0)
  minConfidence?: number;        // default: 0.8

  // Minimum terms required
  minMatchLength?: number;       // default: 4

  // Maximum suggestions to return
  maxSuggestions?: number;       // default: 5

  // Enable pattern matching
  enablePatternMatching?: boolean; // default: true

  // Enable formula validation
  enableFormulaValidation?: boolean; // default: true

  // Cache results
  cacheResults?: boolean;        // default: true
}
```

---

## Type Definitions

### All Exported Types

```typescript
// From OeisApiClient
export type OeisSequence = { ... };
export type OeisSearchResult = { ... };
export type OeisApiConfig = { ... };
export class OeisApiError extends Error { ... }

// From SequenceValidator
export type ValidationResult = { ... };
export type ValidatorConfig = { ... };

// From OeisCache
export type CacheConfig = { ... };
export type CachedSequence = { ... };
export type CacheStats = { ... };

// From MathematicalValidators
export type MathValidationResult = { ... };
```

---

## Error Handling

### OeisApiError

```typescript
class OeisApiError extends Error {
  constructor(
    message: string,
    public code: string,           // Error code
    public statusCode?: number,     // HTTP status code
    public details?: unknown        // Additional details
  )
}
```

**Error Codes:**

| Code | Meaning | HTTP Status |
|------|---------|-------------|
| `INVALID_A_NUMBER` | Invalid A-number format | - |
| `HTTP_ERROR` | HTTP request failed | varies |
| `TIMEOUT` | Request timeout | - |
| `REQUEST_FAILED` | Network request failed | - |

**Handling:**

```typescript
try {
  await client.getSequence('invalid');
} catch (error) {
  if (error instanceof OeisApiError) {
    console.log(error.code);        // 'INVALID_A_NUMBER'
    console.log(error.statusCode);  // undefined
    console.log(error.message);     // 'Invalid A-number: invalid'
  }
}
```

---

## Examples

### Complete Working Example

```typescript
import {
  SequenceValidator,
  OeisApiClient,
  OeisCache,
  MathematicalValidators,
  OeisApiError,
} from 'agentic-flow/agentdb';

async function completeExample() {
  // Initialize
  const cache = new OeisCache({ dbPath: ':memory:' });
  const client = new OeisApiClient({ rateLimit: 10 });
  const validator = new SequenceValidator({ cache, apiClient: client });

  await validator.initialize();

  try {
    // Example 1: Direct API call
    const seq = await client.getSequence('A000045');
    console.log('Sequence:', seq?.name);

    // Example 2: Quick pattern check
    const mathValidators = new MathematicalValidators();
    const fibResult = mathValidators.isFibonacci([0, 1, 1, 2, 3, 5, 8]);
    console.log('Math validation:', fibResult.confidence);

    // Example 3: Full validation
    const result = await validator.validate([0, 1, 1, 2, 3, 5, 8, 13]);
    console.log('Full validation:', {
      isValid: result.isValid,
      sequenceId: result.sequenceId,
      confidence: result.confidence,
    });

    // Example 4: Specific sequence validation
    const specificResult = await validator.validateByANumber(
      [0, 1, 1, 2, 3, 5],
      'A000045'
    );
    console.log('Specific validation:', specificResult.confidence);

    // Example 5: Cache stats
    const stats = await validator.getCacheStats();
    console.log('Cache stats:', stats);
  } catch (error) {
    if (error instanceof OeisApiError) {
      console.error('OEIS Error:', error.code, error.message);
    } else {
      throw error;
    }
  } finally {
    await validator.close();
  }
}

completeExample();
```

---

**Last Updated:** 2025-01-09
**Version:** 1.0.0

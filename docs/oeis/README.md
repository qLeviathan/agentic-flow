# OEIS Integration Guide

The Online Encyclopedia of Integer Sequences (OEIS) integration in Agentic Flow provides powerful tools for validating, searching, and analyzing integer sequences. This guide covers everything you need to get started.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [CLI Commands](#cli-commands)
- [Integration Examples](#integration-examples)
- [Troubleshooting](#troubleshooting)
- [Performance Tips](#performance-tips)

## Overview

The OEIS integration offers:

- **Sequence Validation**: Validate integer sequences against the OEIS database
- **Pattern Recognition**: Detect mathematical patterns (Fibonacci, primes, factorials, etc.)
- **Smart Caching**: Fast retrieval with SQLite persistence and memory caching
- **Rate Limiting**: Respectful API usage with automatic request throttling
- **Multiple Match Types**: Exact, partial, pattern-based, and formula-based matches
- **MCP Tools**: Model Context Protocol tools for AI integration
- **Agent Coordination**: Built-in hooks for multi-agent workflows

### Key Components

| Component | Purpose | Performance |
|-----------|---------|-------------|
| **OeisApiClient** | OEIS API communication with rate limiting | ~30ms/request |
| **SequenceValidator** | Main validation engine with confidence scoring | ~50-100ms |
| **OeisCache** | SQLite + memory caching for sequences | <5ms cached lookups |
| **MathematicalValidators** | Built-in math pattern detection | <1ms per pattern |
| **MCP Tools** | AI integration for agent workflows | Native LLM integration |

## Installation

### Prerequisites

- Node.js 18.0 or later
- npm or yarn

### Setup

1. **Install Agentic Flow**:

```bash
npm install agentic-flow
# or
yarn add agentic-flow
```

2. **Initialize the OEIS module**:

```typescript
import {
  SequenceValidator,
  OeisApiClient,
  OeisCache,
  MathematicalValidators,
} from 'agentic-flow/agentdb';

// Create and initialize validator
const validator = new SequenceValidator({
  minConfidence: 0.8,
  minMatchLength: 4,
  cacheResults: true,
});

await validator.initialize();
```

3. **For MCP Tools** (AI agents):

```bash
# Register MCP server
claude mcp add claude-flow npx claude-flow@alpha mcp start

# Use OEIS MCP tools in your AI prompts
```

## Quick Start

### Basic Validation

```typescript
import { SequenceValidator } from 'agentic-flow/agentdb';

const validator = new SequenceValidator();
await validator.initialize();

// Validate a sequence
const result = await validator.validate([0, 1, 1, 2, 3, 5, 8, 13]);

console.log('Is Valid:', result.isValid);              // true
console.log('Confidence:', result.confidence);        // 1.0
console.log('Sequence ID:', result.sequenceId);       // A000045
console.log('Name:', result.matchedSequence?.name);   // Fibonacci numbers

await validator.close();
```

### Pattern Detection

```typescript
import { MathematicalValidators } from 'agentic-flow/agentdb';

const validators = new MathematicalValidators();

// Check for Fibonacci pattern
const fibResult = validators.isFibonacci([0, 1, 1, 2, 3, 5, 8, 13]);
console.log(fibResult);
// { isValid: true, confidence: 1.0, formula: 'F(n) = F(n-1) + F(n-2)' }

// Check for prime numbers
const primeResult = validators.isPrime([2, 3, 5, 7, 11, 13]);
console.log(primeResult);
// { isValid: true, confidence: 1.0, formula: 'Prime numbers' }

// Check for powers of 2
const powerResult = validators.isPowerOf2([1, 2, 4, 8, 16]);
console.log(powerResult);
// { isValid: true, confidence: 1.0, formula: '2^n' }
```

### Search by Values

```typescript
import { OeisApiClient } from 'agentic-flow/agentdb';

const client = new OeisApiClient({
  rateLimit: 10,  // 10 requests per minute
  timeout: 30000, // 30 second timeout
});

// Search for sequences matching values
const result = await client.searchByValues([1, 1, 2, 3, 5, 8]);
console.log(`Found ${result.count} matches`);
console.log('Top match:', result.results[0]);
```

### Get Specific Sequence

```typescript
import { OeisApiClient } from 'agentic-flow/agentdb';

const client = new OeisApiClient();

// Fetch by A-number
const fibonacci = await client.getSequence('A000045');
console.log(fibonacci?.name);        // Fibonacci numbers
console.log(fibonacci?.data.slice(0, 10));
// [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

## Core Concepts

### Validation Results

Every validation returns a `ValidationResult` object:

```typescript
interface ValidationResult {
  isValid: boolean;           // Whether sequence is valid
  confidence: number;         // 0.0 to 1.0 confidence score
  matchedSequence?: OeisSequence;  // Full OEIS sequence info
  sequenceId?: string;        // A-number (e.g., "A000045")
  matchType: 'exact' | 'partial' | 'pattern' | 'formula' | 'none';
  matchDetails?: {
    matchedTerms: number;     // Number of matching terms
    totalTerms: number;       // Total terms in sequence
    startIndex: number;       // Where match starts in OEIS data
    formula?: string;         // Mathematical formula if applicable
    deviation?: number;       // Average deviation from expected
  };
  suggestions?: OeisSequence[];  // Alternative matches
  error?: string;             // Error message if failed
}
```

### Match Types

- **exact**: Sequence matches perfectly from the beginning
- **partial**: Sequence is a contiguous subsequence of OEIS data
- **pattern**: Differences between terms match (pattern-based matching)
- **formula**: Matches a known mathematical formula
- **none**: No match found

### Confidence Scoring

Confidence is calculated based on:

1. **Exact Match**: Percentage of matching terms
2. **Partial Match**: Best sliding window match percentage
3. **Pattern Match**: Percentage of matching differences (0.9x multiplier)
4. **Formula Match**: Perfect if all terms match formula

Minimum confidence for `isValid: true` is configurable (default: 0.8).

### Caching Strategy

OEIS integration uses two-tier caching:

```
Request → Memory Cache → Database Cache → API Request
         (microseconds)  (milliseconds)  (hundreds of ms)
```

**Popular Sequences** (preloaded):
- A000045 (Fibonacci)
- A000040 (Primes)
- A000142 (Factorials)
- A000290 (Squares)
- A000079 (Powers of 2)
- And 15 more...

## API Reference

### SequenceValidator

Main validation engine for sequences.

#### Constructor

```typescript
const validator = new SequenceValidator({
  // Optional: Provide your own API client
  apiClient?: OeisApiClient,

  // Optional: Provide your own cache
  cache?: OeisCache,

  // Minimum confidence for valid match (0.0 to 1.0)
  minConfidence?: number,        // default: 0.8

  // Minimum terms required to validate
  minMatchLength?: number,       // default: 4

  // Maximum suggestions to return
  maxSuggestions?: number,       // default: 5

  // Enable fuzzy pattern matching
  enablePatternMatching?: boolean, // default: true

  // Enable formula-based validation
  enableFormulaValidation?: boolean, // default: true

  // Cache validation results
  cacheResults?: boolean,        // default: true
});
```

#### Methods

**validate(sequence: number[]): Promise<ValidationResult>**

Validate a sequence against OEIS:

```typescript
const result = await validator.validate([0, 1, 1, 2, 3, 5, 8, 13]);
```

**validateByANumber(sequence: number[], aNumber: string): Promise<ValidationResult>**

Validate sequence against specific OEIS sequence:

```typescript
const result = await validator.validateByANumber(
  [0, 1, 1, 2, 3, 5, 8, 13],
  'A000045'  // Fibonacci
);
```

**initialize(): Promise<void>**

Initialize validator and cache:

```typescript
await validator.initialize();
```

**getCacheStats(): Promise<CacheStats>**

Get cache performance statistics:

```typescript
const stats = await validator.getCacheStats();
console.log(stats.count);           // entries in cache
console.log(stats.topSequences);    // most accessed sequences
```

**close(): Promise<void>**

Close database connections:

```typescript
await validator.close();
```

### OeisApiClient

Direct API access to OEIS with rate limiting.

#### Methods

**search(query: string, start?: number): Promise<OeisSearchResult>**

Search for sequences:

```typescript
const result = await client.search('Fibonacci');
const result2 = await client.search('prime numbers');
```

**getSequence(aNumber: string): Promise<OeisSequence | null>**

Get specific sequence by A-number:

```typescript
const seq = await client.getSequence('A000045');
const seq2 = await client.getSequence('45');  // auto-formats
```

**searchByValues(values: number[]): Promise<OeisSearchResult>**

Search for sequences by values:

```typescript
const result = await client.searchByValues([1, 1, 2, 3, 5, 8]);
```

### OeisCache

SQLite-based persistent caching.

#### Methods

**initialize(): Promise<void>**

Initialize cache database:

```typescript
await cache.initialize();
```

**get(id: string): Promise<OeisSequence | null>**

Retrieve sequence from cache:

```typescript
const seq = await cache.get('A000045');
```

**set(sequence: OeisSequence, ttl?: number): Promise<void>**

Store sequence in cache:

```typescript
await cache.set(sequence, 86400);  // 24 hour TTL
```

**has(id: string): Promise<boolean>**

Check if sequence is cached:

```typescript
if (await cache.has('A000045')) {
  console.log('Cached!');
}
```

**getStats(): Promise<CacheStats>**

Get cache statistics:

```typescript
const stats = await cache.getStats();
```

### MathematicalValidators

Pattern recognition for common mathematical sequences.

#### Supported Patterns

```typescript
const validators = new MathematicalValidators();

// Fibonacci: F(n) = F(n-1) + F(n-2)
validators.isFibonacci([0, 1, 1, 2, 3, 5, 8, 13])

// Primes: divisible only by 1 and itself
validators.isPrime([2, 3, 5, 7, 11, 13, 17, 19])

// Factorials: n! = n × (n-1) × ... × 2 × 1
validators.isFactorial([1, 1, 2, 6, 24, 120, 720])

// Perfect squares: n²
validators.isSquare([0, 1, 4, 9, 16, 25, 36, 49])

// Perfect cubes: n³
validators.isCube([0, 1, 8, 27, 64, 125, 216])

// Powers of 2: 2^n
validators.isPowerOf2([1, 2, 4, 8, 16, 32, 64])

// Powers of 3: 3^n
validators.isPowerOf3([1, 3, 9, 27, 81, 243])

// Triangular: T(n) = n(n+1)/2
validators.isTriangular([0, 1, 3, 6, 10, 15, 21, 28])

// Even numbers: 2n
validators.isEven([0, 2, 4, 6, 8, 10, 12])

// Odd numbers: 2n + 1
validators.isOdd([1, 3, 5, 7, 9, 11, 13])

// Perfect numbers: equals sum of proper divisors
validators.isPerfect([6, 28, 496, 8128])

// Composite numbers: not prime
validators.isComposite([4, 6, 8, 9, 10, 12, 14])

// Arithmetic progression: a(n) = a + nd
validators.isArithmeticProgression([5, 10, 15, 20, 25])

// Geometric progression: a(n) = a × r^n
validators.isGeometricProgression([2, 6, 18, 54, 162])

// Catalan numbers: C(n) = (2n)! / ((n+1)! × n!)
validators.isCatalan([1, 1, 2, 5, 14, 42, 132])

// Non-negative integers: n
validators.isNonNegativeIntegers([0, 1, 2, 3, 4, 5, 6])
```

All return `MathValidationResult`:

```typescript
interface MathValidationResult {
  isValid: boolean;        // Whether sequence matches
  confidence: number;      // 0.0 to 1.0
  formula?: string;        // Mathematical formula
  matchedTerms?: number;   // Number of matching terms
  error?: string;          // Error message if failed
}
```

## CLI Commands

### Using with NPX

```bash
# Run OEIS validation demo
npx agentic-flow oeis validate

# Search for sequence
npx agentic-flow oeis search "Fibonacci"

# Validate sequence by A-number
npx agentic-flow oeis validate-by-id "A000045" --sequence "0,1,1,2,3,5,8"
```

### MCP Tool Integration

When OEIS MCP tools are registered, you can use them in AI contexts:

```bash
# Register MCP server
claude mcp add claude-flow npx claude-flow@alpha mcp start
```

Available MCP tools:
- **validate-sequence**: Validate sequences in agent outputs
- **search-sequences**: Find sequences by pattern or values
- **match-pattern**: Detect mathematical patterns
- **link-skill**: Connect sequences to skills

## Integration Examples

### Example 1: Validate Agent Outputs

```typescript
async function validateAgentOutput(output: unknown) {
  if (Array.isArray(output) && output.every(n => typeof n === 'number')) {
    const validator = new SequenceValidator();
    await validator.initialize();

    const result = await validator.validate(output);

    if (result.isValid) {
      console.log(`✅ Output is sequence ${result.sequenceId}: ${result.matchedSequence?.name}`);
    } else if (result.suggestions?.length) {
      console.log('Similar sequences:', result.suggestions.map(s => s.id));
    }

    await validator.close();
    return result;
  }
}
```

### Example 2: Build Pattern-Aware Agent

```typescript
async function createPatternAwareAgent() {
  const validators = new MathematicalValidators();
  const validator = new SequenceValidator();
  await validator.initialize();

  return {
    async analyzeSequence(seq: number[]) {
      // Try common patterns first (fast)
      const patterns = [
        { name: 'Fibonacci', fn: () => validators.isFibonacci(seq) },
        { name: 'Primes', fn: () => validators.isPrime(seq) },
        { name: 'Powers of 2', fn: () => validators.isPowerOf2(seq) },
        { name: 'Factorials', fn: () => validators.isFactorial(seq) },
      ];

      for (const { name, fn } of patterns) {
        const result = fn();
        if (result.isValid) {
          return { pattern: name, ...result };
        }
      }

      // Fall back to full validation
      return await validator.validate(seq);
    },

    async close() {
      await validator.close();
    },
  };
}
```

### Example 3: Link Skills to Mathematical Patterns

```typescript
async function linkSkillToPattern(skillId: string, pattern: string) {
  const validators = new MathematicalValidators();
  const validator = new SequenceValidator();
  await validator.initialize();

  // Map pattern names to A-numbers
  const patternToANumber: Record<string, string> = {
    'fibonacci': 'A000045',
    'primes': 'A000040',
    'factorials': 'A000142',
    'squares': 'A000290',
    'powers-of-2': 'A000079',
  };

  const aNumber = patternToANumber[pattern];
  if (aNumber) {
    const sequence = await validator.apiClient?.getSequence(aNumber);

    // Store link in your skill system
    console.log(`Linked skill ${skillId} to pattern ${pattern} (${aNumber})`);

    return {
      skillId,
      pattern,
      aNumber,
      sequence: sequence?.name,
    };
  }
}
```

### Example 4: Batch Validation

```typescript
async function batchValidateSequences(sequences: number[][]) {
  const validator = new SequenceValidator();
  await validator.initialize();

  const results = await Promise.all(
    sequences.map(seq => validator.validate(seq))
  );

  // Summarize results
  const summary = {
    total: results.length,
    valid: results.filter(r => r.isValid).length,
    sequences: results
      .filter(r => r.isValid)
      .map(r => ({ id: r.sequenceId, name: r.matchedSequence?.name })),
  };

  await validator.close();
  return summary;
}
```

## Troubleshooting

### Issue: "Sequence too short" error

**Problem**: Validation fails with minimum length requirement

**Solution**:
```typescript
// Default minimum is 4 terms, increase if needed
const validator = new SequenceValidator({
  minMatchLength: 3  // Allow 3 terms minimum
});

// Or provide more terms
const result = await validator.validate([1, 1, 2, 3, 5, 8, 13]);  // 7 terms
```

### Issue: Low confidence scores

**Problem**: Validation returns `isValid: false` with low confidence

**Solution**:
```typescript
// Option 1: Lower confidence threshold
const validator = new SequenceValidator({
  minConfidence: 0.7  // Default is 0.8
});

// Option 2: Check suggestions for similar sequences
if (result.suggestions?.length) {
  console.log('Similar sequences:', result.suggestions);

  // Try validating against each suggestion
  for (const suggestion of result.suggestions) {
    const specialResult = await validator.validateByANumber(
      sequence,
      suggestion.id
    );
    if (specialResult.confidence > result.confidence) {
      console.log(`Better match: ${suggestion.id}`);
    }
  }
}
```

### Issue: Cache not persisting

**Problem**: Cache data lost between sessions

**Solution**:
```typescript
// Use persistent database path instead of memory
const cache = new OeisCache({
  dbPath: './oeis-cache.db',  // Instead of ':memory:'
  defaultTTL: 604800,          // 7 days
});

await cache.initialize();
```

### Issue: Rate limit errors

**Problem**: "Too many requests" errors from OEIS API

**Solution**:
```typescript
// Lower request rate
const client = new OeisApiClient({
  rateLimit: 5,      // 5 requests per minute instead of 10
  retryDelay: 2000,  // 2 seconds between retries
  maxRetries: 5,     // Retry up to 5 times
});

// Or use cache to avoid API calls
const validator = new SequenceValidator({
  cacheResults: true,
});
```

### Issue: Network timeouts

**Problem**: Requests timing out

**Solution**:
```typescript
const client = new OeisApiClient({
  timeout: 60000,    // 60 seconds instead of 30
  retryDelay: 2000,
  maxRetries: 5,
});
```

### Issue: Offline validation fails

**Problem**: Validation fails without internet connection

**Solution**:
```typescript
// Use only mathematical validators (no API calls)
const validators = new MathematicalValidators();

const result = validators.isFibonacci([0, 1, 1, 2, 3, 5, 8]);
console.log(result);  // Works without internet

// Or preload cache before going offline
const validator = new SequenceValidator({
  cacheResults: true,
});
await validator.initialize();
// ... use validator while online
// Cache will work offline
```

## Performance Tips

### 1. Use Preloaded Sequences

Popular sequences are preloaded for instant access:

```typescript
// These are instant (microseconds) even on first use
const fib = await cache.get('A000045');    // Fibonacci
const primes = await cache.get('A000040'); // Primes
const squares = await cache.get('A000290'); // Squares
```

### 2. Validate Local Patterns First

Check mathematical patterns before API calls:

```typescript
const validators = new MathematicalValidators();

// 1ms (fast, local)
const pattern = validators.isFibonacci(sequence);
if (pattern.isValid) return pattern;

// Fall back to API if needed
const result = await validator.validate(sequence);
```

### 3. Batch Validations

Validate multiple sequences efficiently:

```typescript
// Parallel validation (respects rate limits)
const results = await Promise.all(
  sequences.map(seq => validator.validate(seq))
);
```

### 4. Use Persistent Cache

Persist cache to disk for cross-session reuse:

```typescript
const cache = new OeisCache({
  dbPath: './oeis-cache.db',
  preloadPopular: true,
});

await cache.initialize();
// Cache hits in future runs: <5ms per lookup
```

### 5. Configure Rate Limits

Adjust rate limiting for your use case:

```typescript
// For heavy workloads, lower rate limit and increase retries
const client = new OeisApiClient({
  rateLimit: 3,      // Conservative: 3 req/min
  maxRetries: 5,
  retryDelay: 3000,
});

// For light usage, increase rate limit
const aggressiveClient = new OeisApiClient({
  rateLimit: 20,     // 20 requests per minute
  timeout: 60000,
});
```

### 6. Set Appropriate TTLs

Configure cache TTL based on update frequency:

```typescript
// Short-lived cache for rapidly changing data
await cache.set(sequence, 3600);    // 1 hour

// Long-lived cache for stable sequences
await cache.set(sequence, 604800);  // 7 days
```

### 7. Use Memory Cache with Frequent Lookups

Memory cache is faster for frequently accessed sequences:

```typescript
const validator = new SequenceValidator({
  cacheResults: true,  // Caches in memory + DB
});

// First lookup: 50-100ms (API)
// Second lookup: <1ms (memory cache)
// Third lookup on new session: 5ms (DB cache)
```

## Next Steps

- [See Examples](./EXAMPLES.md) for practical implementations
- [Read Full API Docs](./API.md) for detailed method signatures
- [Join Community](https://github.com/ruvnet/agentic-flow) for support

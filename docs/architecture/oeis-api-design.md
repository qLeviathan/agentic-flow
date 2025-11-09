# OEIS API Layer Design

## Overview

This document details the API layer design for OEIS integration, including client implementation, caching strategy, validation logic, and pattern matching algorithms.

## 1. Component Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Client Layer                       │
├─────────────────────────────────────────────────────┤
│  ReflexionMemory  │  SkillLibrary  │  CLI/MCP      │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              OEIS Integration Layer                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────┐      ┌──────────────────┐    │
│  │ OeisIntegration │◄────►│ SequenceValidator│    │
│  │   (Main API)    │      └──────────────────┘    │
│  └────────┬────────┘                               │
│           │                                         │
│  ┌────────▼────────┐      ┌──────────────────┐    │
│  │   OeisCache     │      │  PatternMatcher  │    │
│  │  (L1/L2 Cache)  │      │  (Algorithms)    │    │
│  └────────┬────────┘      └──────────────────┘    │
│           │                                         │
│  ┌────────▼────────┐                               │
│  │  OeisApiClient  │                               │
│  │  (HTTP Client)  │                               │
│  └────────┬────────┘                               │
│           │                                         │
└───────────┼─────────────────────────────────────────┘
            │
            ▼
   ┌─────────────────┐
   │   oeis.org API  │
   └─────────────────┘
```

## 2. File Structure

```
/home/user/agentic-flow/agentic-flow/src/agentdb/
├── controllers/
│   ├── OeisIntegration.ts          # Main orchestrator
│   ├── OeisApiClient.ts            # HTTP client for oeis.org
│   ├── OeisCache.ts                # Multi-level caching
│   ├── SequenceValidator.ts        # Validation logic
│   ├── PatternMatcher.ts           # Pattern recognition
│   └── types/
│       └── oeis-types.ts           # Type definitions
├── schemas/
│   └── oeis-schema.sql             # Database schema
├── cli/
│   └── oeis-cli.ts                 # CLI commands
└── tests/
    ├── oeis-api-client.test.ts
    ├── oeis-cache.test.ts
    ├── sequence-validator.test.ts
    ├── pattern-matcher.test.ts
    └── oeis-integration.test.ts
```

## 3. OeisApiClient Implementation

### 3.1 Core Responsibilities

- Fetch sequences from oeis.org API
- Handle rate limiting (3 req/sec)
- Implement exponential backoff
- Parse OEIS API responses
- Transform API format to internal format

### 3.2 Interface

```typescript
export class OeisApiClient implements IOeisApiClient {
  private baseUrl = 'https://oeis.org';
  private rateLimiter: RateLimiter;

  constructor(
    private readonly requestsPerSecond: number = 3,
    private readonly timeout: number = 10000
  ) {
    this.rateLimiter = new RateLimiter(requestsPerSecond);
  }

  async search(terms: number[], limit: number = 10): Promise<OeisApiResponse>;
  async getSequence(oeisId: string): Promise<OeisApiSequence | null>;
  async searchByKeyword(keyword: string, limit?: number): Promise<OeisApiResponse>;
  async searchByName(name: string, limit?: number): Promise<OeisApiResponse>;
  async getRateLimit(): Promise<RateLimitStatus>;
}
```

### 3.3 API Endpoints

```typescript
// Search by terms
GET https://oeis.org/search?q=1,1,2,3,5,8&fmt=json&start=0

// Get by ID
GET https://oeis.org/search?q=id:A000045&fmt=json

// Search by keyword
GET https://oeis.org/search?q=keyword:nonn&fmt=json

// Search by name
GET https://oeis.org/search?q=name:fibonacci&fmt=json
```

### 3.4 Rate Limiting

```typescript
class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(private readonly tokensPerSecond: number) {
    this.tokens = tokensPerSecond;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(
      this.tokensPerSecond,
      this.tokens + elapsed * this.tokensPerSecond
    );
    this.lastRefill = now;

    if (this.tokens < 1) {
      const waitTime = (1 - this.tokens) / this.tokensPerSecond * 1000;
      await sleep(waitTime);
      this.tokens = 0;
    } else {
      this.tokens -= 1;
    }
  }
}
```

### 3.5 Error Handling

```typescript
async request<T>(url: string): Promise<T> {
  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      await this.rateLimiter.acquire();

      const response = await fetch(url, {
        timeout: this.timeout,
        headers: { 'User-Agent': 'agentic-flow/2.0' }
      });

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        throw new RateLimitError('Rate limit exceeded', retryAfter);
      }

      if (!response.ok) {
        throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof RateLimitError) {
        await sleep(error.retryAfter * 1000);
        retries++;
      } else if (error instanceof NetworkError && retries < maxRetries) {
        await sleep(Math.pow(2, retries) * 1000); // Exponential backoff
        retries++;
      } else {
        throw error;
      }
    }
  }

  throw new NetworkError('Max retries exceeded');
}
```

## 4. OeisCache Implementation

### 4.1 Multi-Level Caching

```
L1 Cache (In-Memory LRU)
   ↓ miss
L2 Cache (SQLite Database)
   ↓ miss
L3 Source (OEIS API)
```

### 4.2 Interface

```typescript
export class OeisCache implements IOeisCache {
  private l1Cache: LRUCache<string, OeisSequence>;
  private db: Database;

  constructor(
    db: Database,
    private readonly l1Size: number = 1000,
    private readonly l1TTL: number = 300000,      // 5 minutes
    private readonly l2TTL: number = 604800000    // 7 days
  ) {
    this.l1Cache = new LRUCache({ max: l1Size, ttl: l1TTL });
    this.db = db;
  }

  async getSequence(oeisId: string): Promise<OeisSequence | null>;
  async storeSequence(sequence: OeisSequence): Promise<void>;
  async searchSequences(query: string, limit?: number): Promise<OeisSequence[]>;
  async invalidateSequence(oeisId: string): Promise<void>;
  async getCacheStats(): Promise<CacheStats>;
  async clearExpired(): Promise<number>;
}
```

### 4.3 Cache Key Strategy

```typescript
private getCacheKey(type: 'sequence' | 'search', params: any): string {
  const normalized = JSON.stringify(params, Object.keys(params).sort());
  return `${type}:${crypto.createHash('sha256').update(normalized).digest('hex')}`;
}
```

### 4.4 L1 Cache (In-Memory)

```typescript
async getSequenceL1(oeisId: string): Promise<OeisSequence | null> {
  const cached = this.l1Cache.get(oeisId);
  if (cached) {
    this.stats.l1Hits++;
    return cached;
  }
  this.stats.l1Misses++;
  return null;
}

async setSequenceL1(sequence: OeisSequence): Promise<void> {
  this.l1Cache.set(sequence.oeisId, sequence);
}
```

### 4.5 L2 Cache (SQLite)

```typescript
async getSequenceL2(oeisId: string): Promise<OeisSequence | null> {
  const stmt = this.db.prepare(`
    SELECT * FROM oeis_sequences
    WHERE oeis_id = ?
      AND cache_timestamp > ?
  `);

  const row = stmt.get(oeisId, Date.now() - this.l2TTL);
  if (row) {
    this.stats.l2Hits++;
    const sequence = this.rowToSequence(row);
    await this.setSequenceL1(sequence);  // Promote to L1
    return sequence;
  }

  this.stats.l2Misses++;
  return null;
}

async setSequenceL2(sequence: OeisSequence): Promise<void> {
  const stmt = this.db.prepare(`
    INSERT OR REPLACE INTO oeis_sequences (
      oeis_id, name, description, keywords, terms, formula,
      references, author, offset, metadata, cache_timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    sequence.oeisId,
    sequence.name,
    sequence.description,
    JSON.stringify(sequence.keywords || []),
    JSON.stringify(sequence.terms),
    sequence.formula,
    JSON.stringify(sequence.references || []),
    sequence.author,
    sequence.offset || 0,
    JSON.stringify(sequence.metadata || {}),
    Date.now()
  );

  await this.setSequenceL1(sequence);  // Also cache in L1
}
```

## 5. SequenceValidator Implementation

### 5.1 Core Responsibilities

- Validate sequences against OEIS
- Extract sequences from episode outputs
- Link skills to OEIS patterns
- Score validation quality

### 5.2 Interface

```typescript
export class SequenceValidator implements ISequenceValidator {
  constructor(
    private readonly db: Database,
    private readonly embedder: EmbeddingService,
    private readonly apiClient: OeisApiClient,
    private readonly cache: OeisCache,
    private readonly patternMatcher: PatternMatcher
  ) {}

  async validateSequence(query: SequenceValidationQuery): Promise<ValidationResult>;
  async validateEpisodeOutput(episodeId: number, output: any): Promise<ValidationResult>;
  async linkSkillToSequence(...): Promise<void>;
  async findPatterns(terms: number[]): Promise<MathematicalPattern[]>;
  async getSkillSequences(skillId: number): Promise<OeisSequence[]>;
  async findRelatedSequences(skill): Promise<OeisSequence[]>;
}
```

### 5.3 Validation Algorithm

```typescript
async validateSequence(query: SequenceValidationQuery): Promise<ValidationResult> {
  const { terms, context, minConfidence = 0.7, maxResults = 10 } = query;

  // Step 1: Check cache
  let matches = await this.searchCachedSequences(terms, maxResults);

  // Step 2: If not enough matches, query API
  if (matches.length < maxResults) {
    const apiResults = await this.apiClient.search(terms, maxResults);
    const newMatches = await this.processApiResults(apiResults, terms);
    matches = [...matches, ...newMatches];
  }

  // Step 3: Score matches
  const scoredMatches = await this.scoreMatches(matches, terms, context);

  // Step 4: Filter by confidence
  const filtered = scoredMatches.filter(m => m.confidence >= minConfidence);

  // Step 5: Find patterns
  const patterns = await this.patternMatcher.detectPattern(terms);

  // Step 6: Generate suggestions
  const suggestions = this.generateImprovementSuggestions(filtered, patterns);

  return {
    success: filtered.length > 0,
    matches: filtered.slice(0, maxResults),
    patterns: patterns ? [patterns] : [],
    confidence: filtered[0]?.confidence || 0,
    improvementSuggestions: suggestions
  };
}
```

### 5.4 Match Scoring

```typescript
private async scoreMatches(
  candidates: OeisSequence[],
  queryTerms: number[],
  context?: string
): Promise<OeisMatch[]> {
  const matches: OeisMatch[] = [];

  for (const seq of candidates) {
    // Exact match score
    const exactScore = this.computeExactMatchScore(seq.terms, queryTerms);

    // Subsequence match score
    const subseqScore = this.computeSubsequenceScore(seq.terms, queryTerms);

    // Pattern match score
    const patternScore = await this.computePatternScore(seq, queryTerms);

    // Semantic match score (if context provided)
    const semanticScore = context
      ? await this.computeSemanticScore(seq, context)
      : 0;

    // Weighted combination
    const confidence =
      exactScore * 0.4 +
      subseqScore * 0.3 +
      patternScore * 0.2 +
      semanticScore * 0.1;

    if (confidence > 0) {
      matches.push({
        sequence: seq,
        confidence,
        matchType: this.determineMatchType(exactScore, subseqScore, patternScore, semanticScore),
        matchedTerms: this.findMatchedTerms(seq.terms, queryTerms),
        matchIndices: this.findMatchIndices(seq.terms, queryTerms),
        similarity: semanticScore
      });
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}
```

### 5.5 Sequence Extraction

```typescript
private extractSequences(output: any): number[][] {
  const sequences: number[][] = [];

  // Method 1: Direct array extraction
  if (Array.isArray(output)) {
    const nums = output.filter(x => typeof x === 'number');
    if (nums.length >= 3) sequences.push(nums);
  }

  // Method 2: Regex extraction from strings
  if (typeof output === 'string') {
    const matches = output.matchAll(/\b\d+(?:\s*,\s*\d+){2,}\b/g);
    for (const match of matches) {
      const nums = match[0].split(',').map(s => parseInt(s.trim()));
      if (nums.length >= 3) sequences.push(nums);
    }
  }

  // Method 3: Object property extraction
  if (typeof output === 'object' && output !== null) {
    for (const value of Object.values(output)) {
      sequences.push(...this.extractSequences(value));
    }
  }

  return sequences;
}
```

## 6. PatternMatcher Implementation

### 6.1 Pattern Detection Algorithms

```typescript
export class PatternMatcher implements IPatternMatcher {
  constructor(private readonly db: Database) {}

  async detectPattern(terms: number[]): Promise<MathematicalPattern | null> {
    // Try different pattern types in order of likelihood

    // 1. Arithmetic progression
    const arithmetic = this.detectArithmetic(terms);
    if (arithmetic) return arithmetic;

    // 2. Geometric progression
    const geometric = this.detectGeometric(terms);
    if (geometric) return geometric;

    // 3. Polynomial (degree 2-4)
    const polynomial = this.detectPolynomial(terms);
    if (polynomial) return polynomial;

    // 4. Recursive (Fibonacci-like)
    const recursive = this.detectRecursive(terms);
    if (recursive) return recursive;

    return null;
  }
}
```

### 6.2 Arithmetic Progression Detection

```typescript
private detectArithmetic(terms: number[]): MathematicalPattern | null {
  if (terms.length < 3) return null;

  const differences = [];
  for (let i = 1; i < terms.length; i++) {
    differences.push(terms[i] - terms[i-1]);
  }

  // Check if all differences are equal
  const d = differences[0];
  const isArithmetic = differences.every(diff => diff === d);

  if (isArithmetic) {
    return {
      patternType: 'arithmetic',
      patternSignature: `a(n) = ${terms[0]} + ${d}*n`,
      patternFormula: `a(n) = a(0) + d*n where a(0)=${terms[0]}, d=${d}`,
      relatedSequences: [],
      discoveredFrom: 'episode',
      confidence: 0.95
    };
  }

  return null;
}
```

### 6.3 Geometric Progression Detection

```typescript
private detectGeometric(terms: number[]): MathematicalPattern | null {
  if (terms.length < 3 || terms.some(t => t === 0)) return null;

  const ratios = [];
  for (let i = 1; i < terms.length; i++) {
    ratios.push(terms[i] / terms[i-1]);
  }

  // Check if all ratios are equal (within tolerance)
  const r = ratios[0];
  const tolerance = 0.0001;
  const isGeometric = ratios.every(ratio => Math.abs(ratio - r) < tolerance);

  if (isGeometric) {
    return {
      patternType: 'geometric',
      patternSignature: `a(n) = ${terms[0]} * ${r}^n`,
      patternFormula: `a(n) = a(0) * r^n where a(0)=${terms[0]}, r=${r}`,
      relatedSequences: [],
      discoveredFrom: 'episode',
      confidence: 0.9
    };
  }

  return null;
}
```

### 6.4 Polynomial Detection

```typescript
private detectPolynomial(terms: number[]): MathematicalPattern | null {
  if (terms.length < 5) return null;

  // Try polynomial degrees 2, 3, 4
  for (let degree = 2; degree <= 4; degree++) {
    const coeffs = this.fitPolynomial(terms, degree);
    const predicted = coeffs.map((_, i) => this.evaluatePolynomial(coeffs, i));

    // Check if polynomial fits well
    const error = this.computeError(terms, predicted);
    if (error < 0.01) {  // < 1% error
      return {
        patternType: 'polynomial',
        patternSignature: this.polynomialToString(coeffs),
        patternFormula: this.polynomialToFormula(coeffs),
        relatedSequences: [],
        discoveredFrom: 'episode',
        confidence: 0.85 - (degree * 0.05)  // Lower confidence for higher degree
      };
    }
  }

  return null;
}

private fitPolynomial(terms: number[], degree: number): number[] {
  // Least squares polynomial fitting
  const n = terms.length;
  const X = [];
  const y = terms;

  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j <= degree; j++) {
      row.push(Math.pow(i, j));
    }
    X.push(row);
  }

  // Solve X^T * X * coeffs = X^T * y using normal equations
  return this.leastSquares(X, y);
}
```

### 6.5 Recursive Pattern Detection

```typescript
private detectRecursive(terms: number[]): MathematicalPattern | null {
  if (terms.length < 6) return null;

  // Check for Fibonacci-like: a(n) = a(n-1) + a(n-2)
  const isFibonacci = terms.slice(2).every((term, i) =>
    term === terms[i] + terms[i + 1]
  );

  if (isFibonacci) {
    return {
      patternType: 'recursive',
      patternSignature: 'a(n) = a(n-1) + a(n-2)',
      patternFormula: `Fibonacci-like recurrence with a(0)=${terms[0]}, a(1)=${terms[1]}`,
      relatedSequences: ['A000045'],  // Fibonacci numbers
      discoveredFrom: 'episode',
      confidence: 0.9
    };
  }

  // Check for Lucas-like: a(n) = a(n-1) + a(n-2) with different initial conditions
  // Check for Tribonacci-like: a(n) = a(n-1) + a(n-2) + a(n-3)
  // etc.

  return null;
}
```

## 7. Integration Example

```typescript
// In ReflexionMemory.ts
import { SequenceValidator } from './OeisIntegration.js';

export class ReflexionMemory {
  private validator: SequenceValidator;

  async storeEpisode(episode: Episode): Promise<number> {
    const episodeId = await super.storeEpisode(episode);

    // Auto-validate against OEIS
    if (episode.output) {
      try {
        const result = await this.validator.validateEpisodeOutput(
          episodeId,
          episode.output
        );

        if (result.success) {
          console.log(`Episode ${episodeId} validated against OEIS:`);
          console.log(`- Matches: ${result.matches.length}`);
          console.log(`- Confidence: ${result.confidence.toFixed(2)}`);
        }
      } catch (error) {
        console.error('OEIS validation failed:', error);
      }
    }

    return episodeId;
  }
}
```

## 8. Performance Optimization

### 8.1 Batch Operations

```typescript
async validateBatch(queries: SequenceValidationQuery[]): Promise<ValidationResult[]> {
  // Group queries by similarity to optimize cache hits
  const grouped = this.groupSimilarQueries(queries);

  // Process in parallel with concurrency limit
  const concurrency = 5;
  const results = await pMap(grouped,
    group => this.validateSequence(group),
    { concurrency }
  );

  return results.flat();
}
```

### 8.2 Database Optimization

```sql
-- Create covering indices for hot queries
CREATE INDEX idx_oeis_terms_partial ON oeis_sequences(terms) WHERE validation_count > 10;
CREATE INDEX idx_skill_oeis_composite ON skill_oeis_links(skill_id, confidence) WHERE confidence >= 0.7;
```

### 8.3 Connection Pooling

```typescript
class DatabasePool {
  private pool: Database[] = [];

  async acquire(): Promise<Database> {
    return this.pool.pop() || new Database(this.dbPath);
  }

  async release(db: Database): Promise<void> {
    if (this.pool.length < this.maxSize) {
      this.pool.push(db);
    } else {
      db.close();
    }
  }
}
```

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
describe('SequenceValidator', () => {
  it('should validate exact matches', async () => {
    const result = await validator.validateSequence({
      terms: [1, 1, 2, 3, 5, 8, 13, 21]  // Fibonacci
    });

    expect(result.success).toBe(true);
    expect(result.matches[0].sequence.oeisId).toBe('A000045');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('should detect arithmetic progressions', async () => {
    const result = await validator.validateSequence({
      terms: [2, 4, 6, 8, 10, 12]
    });

    expect(result.patterns).toHaveLength(1);
    expect(result.patterns[0].patternType).toBe('arithmetic');
  });
});
```

### 9.2 Integration Tests

```typescript
describe('OEIS Integration', () => {
  it('should validate episode and create links', async () => {
    const episode = await reflexion.storeEpisode({
      sessionId: 'test',
      task: 'Generate Fibonacci',
      output: [1, 1, 2, 3, 5, 8],
      reward: 0.9,
      success: true
    });

    const validations = await getEpisodeValidations(episode);
    expect(validations).toHaveLength(1);
    expect(validations[0].sequence.oeisId).toBe('A000045');
  });
});
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-09
**Status**: Complete - Ready for Implementation

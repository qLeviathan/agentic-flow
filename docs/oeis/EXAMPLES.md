# OEIS Integration Examples

Practical examples for common OEIS integration scenarios.

## Table of Contents

- [Validating Agent Outputs](#validating-agent-outputs)
- [Building Pattern-Aware Agents](#building-pattern-aware-agents)
- [Linking Skills to Mathematical Patterns](#linking-skills-to-mathematical-patterns)
- [Performance Optimization](#performance-optimization)
- [Real-World Use Cases](#real-world-use-cases)
- [Advanced Workflows](#advanced-workflows)

## Validating Agent Outputs

### Example 1: Basic Output Validation

```typescript
import { SequenceValidator } from 'agentic-flow/agentdb';

async function validateAgentOutput(output: unknown): Promise<{
  isSequence: boolean;
  isValid: boolean;
  id?: string;
  name?: string;
  confidence?: number;
  error?: string;
}> {
  // Check if output looks like a sequence
  if (!Array.isArray(output) || output.length < 4) {
    return { isSequence: false, isValid: false };
  }

  if (!output.every(n => typeof n === 'number' && Number.isInteger(n))) {
    return { isSequence: false, isValid: false };
  }

  // Validate against OEIS
  const validator = new SequenceValidator();
  await validator.initialize();

  try {
    const result = await validator.validate(output);

    return {
      isSequence: true,
      isValid: result.isValid,
      id: result.sequenceId,
      name: result.matchedSequence?.name,
      confidence: result.confidence,
    };
  } finally {
    await validator.close();
  }
}

// Usage
const agentOutput = [0, 1, 1, 2, 3, 5, 8, 13, 21];
const validation = await validateAgentOutput(agentOutput);

console.log(validation);
// {
//   isSequence: true,
//   isValid: true,
//   id: 'A000045',
//   name: 'Fibonacci numbers',
//   confidence: 1.0
// }
```

### Example 2: Multi-Stage Validation

```typescript
import {
  SequenceValidator,
  MathematicalValidators,
} from 'agentic-flow/agentdb';

async function multiStageValidation(
  sequence: number[],
  expectedPattern?: string
) {
  const validators = new MathematicalValidators();
  const validator = new SequenceValidator({
    minConfidence: 0.85,
  });

  await validator.initialize();

  try {
    // Stage 1: Quick local pattern check
    console.log('Stage 1: Checking local patterns...');
    const patterns = [
      { name: 'Fibonacci', fn: () => validators.isFibonacci(sequence) },
      { name: 'Primes', fn: () => validators.isPrime(sequence) },
      { name: 'Factorials', fn: () => validators.isFactorial(sequence) },
      { name: 'Powers of 2', fn: () => validators.isPowerOf2(sequence) },
      { name: 'Squares', fn: () => validators.isSquare(sequence) },
    ];

    for (const { name, fn } of patterns) {
      const result = fn();
      if (result.isValid) {
        console.log(`✅ Match: ${name}`);
        return {
          stage: 1,
          matched: true,
          pattern: name,
          confidence: result.confidence,
          formula: result.formula,
        };
      }
    }

    // Stage 2: Expected pattern validation
    if (expectedPattern) {
      console.log(`Stage 2: Validating expected pattern: ${expectedPattern}...`);
      const expectedResult = await validator.validateByANumber(
        sequence,
        expectedPattern
      );

      if (expectedResult.isValid) {
        console.log(`✅ Matches expected: ${expectedPattern}`);
        return {
          stage: 2,
          matched: true,
          pattern: expectedPattern,
          confidence: expectedResult.confidence,
          matchType: expectedResult.matchType,
        };
      }
    }

    // Stage 3: Full OEIS search
    console.log('Stage 3: Searching OEIS database...');
    const fullResult = await validator.validate(sequence);

    if (fullResult.isValid) {
      console.log(`✅ Found: ${fullResult.sequenceId}`);
      return {
        stage: 3,
        matched: true,
        pattern: fullResult.sequenceId,
        confidence: fullResult.confidence,
        matchType: fullResult.matchType,
      };
    }

    // Stage 4: No match found
    console.log('Stage 4: No exact match, checking suggestions...');
    return {
      stage: 4,
      matched: false,
      suggestions: fullResult.suggestions?.map(s => ({
        id: s.id,
        name: s.name,
      })),
    };
  } finally {
    await validator.close();
  }
}

// Usage
const result = await multiStageValidation(
  [2, 3, 5, 7, 11, 13, 17, 19],
  'A000040'
);
console.log(result);
// { stage: 1, matched: true, pattern: 'Primes', confidence: 1.0, formula: '...' }
```

### Example 3: Batch Validation with Summary

```typescript
import { SequenceValidator } from 'agentic-flow/agentdb';

async function batchValidateWithSummary(sequences: {
  name: string;
  data: number[];
}[]) {
  const validator = new SequenceValidator({
    cacheResults: true,
  });

  await validator.initialize();

  try {
    const results = await Promise.all(
      sequences.map(async seq => ({
        name: seq.name,
        result: await validator.validate(seq.data),
      }))
    );

    // Generate summary
    const validCount = results.filter(r => r.result.isValid).length;
    const totalCount = results.length;
    const validSequences = results
      .filter(r => r.result.isValid)
      .map(r => ({
        name: r.name,
        id: r.result.sequenceId,
        oeis: r.result.matchedSequence?.name,
        confidence: r.result.confidence,
      }));

    const suggestions = results
      .filter(r => !r.result.isValid && r.result.suggestions)
      .map(r => ({
        name: r.name,
        suggestions: r.result.suggestions?.slice(0, 3).map(s => s.id),
      }));

    return {
      summary: {
        totalValidated: totalCount,
        validSequences: validCount,
        matchRate: `${((validCount / totalCount) * 100).toFixed(1)}%`,
      },
      validSequences,
      suggestions,
      cacheStats: await validator.getCacheStats(),
    };
  } finally {
    await validator.close();
  }
}

// Usage
const results = await batchValidateWithSummary([
  { name: 'Fibonacci', data: [0, 1, 1, 2, 3, 5, 8, 13] },
  { name: 'Primes', data: [2, 3, 5, 7, 11, 13, 17, 19] },
  { name: 'Squares', data: [0, 1, 4, 9, 16, 25, 36] },
  { name: 'Powers of 2', data: [1, 2, 4, 8, 16, 32] },
]);

console.log(results.summary);
// { totalValidated: 4, validSequences: 4, matchRate: '100%' }
```

## Building Pattern-Aware Agents

### Example 1: Intelligent Sequence Analyzer

```typescript
import {
  SequenceValidator,
  MathematicalValidators,
  OeisApiClient,
} from 'agentic-flow/agentdb';

class IntelligentSequenceAnalyzer {
  private validators: MathematicalValidators;
  private validator: SequenceValidator;
  private client: OeisApiClient;

  constructor() {
    this.validators = new MathematicalValidators();
    this.validator = new SequenceValidator({
      enablePatternMatching: true,
      enableFormulaValidation: true,
    });
    this.client = new OeisApiClient();
  }

  async initialize(): Promise<void> {
    await this.validator.initialize();
  }

  async analyzeSequence(
    sequence: number[],
    context?: string
  ): Promise<{
    sequence: number[];
    patterns: Array<{
      name: string;
      confidence: number;
      formula?: string;
    }>;
    matchedOEIS?: {
      id: string;
      name: string;
      confidence: number;
      matchType: string;
      description?: string;
    };
    recommendations: string[];
    formula?: string;
  }> {
    const patterns = [];
    const recommendations = [];

    // Check common patterns
    const checks = [
      {
        name: 'Fibonacci',
        fn: () => this.validators.isFibonacci(sequence),
        useCase: 'Recursive growth patterns',
      },
      {
        name: 'Primes',
        fn: () => this.validators.isPrime(sequence),
        useCase: 'Cryptography, number theory',
      },
      {
        name: 'Factorials',
        fn: () => this.validators.isFactorial(sequence),
        useCase: 'Combinatorics, permutations',
      },
      {
        name: 'Powers of 2',
        fn: () => this.validators.isPowerOf2(sequence),
        useCase: 'Binary systems, exponential growth',
      },
      {
        name: 'Perfect Squares',
        fn: () => this.validators.isSquare(sequence),
        useCase: 'Geometry, area calculations',
      },
      {
        name: 'Arithmetic Progression',
        fn: () => this.validators.isArithmeticProgression(sequence),
        useCase: 'Linear growth, scheduling',
      },
      {
        name: 'Geometric Progression',
        fn: () => this.validators.isGeometricProgression(sequence),
        useCase: 'Exponential growth, compound interest',
      },
      {
        name: 'Triangular Numbers',
        fn: () => this.validators.isTriangular(sequence),
        useCase: 'Pyramid structures, cumulative sums',
      },
    ];

    for (const check of checks) {
      const result = check.fn();
      if (result.isValid) {
        patterns.push({
          name: check.name,
          confidence: result.confidence,
          formula: result.formula,
        });
        recommendations.push(`Use for: ${check.useCase}`);
      }
    }

    // Search OEIS for additional matches
    let matchedOEIS;
    let formula;

    const validationResult = await this.validator.validate(sequence);
    if (validationResult.isValid) {
      matchedOEIS = {
        id: validationResult.sequenceId!,
        name: validationResult.matchedSequence?.name || 'Unknown',
        confidence: validationResult.confidence,
        matchType: validationResult.matchType,
        description: validationResult.matchedSequence?.comment?.[0],
      };
      formula = validationResult.matchDetails?.formula;

      // Add additional info from OEIS
      if (validationResult.matchedSequence?.references?.length) {
        recommendations.push(
          `References: ${validationResult.matchedSequence.references[0]}`
        );
      }
    }

    return {
      sequence,
      patterns,
      matchedOEIS,
      recommendations,
      formula,
    };
  }

  async close(): Promise<void> {
    await this.validator.close();
  }
}

// Usage
const analyzer = new IntelligentSequenceAnalyzer();
await analyzer.initialize();

const analysis = await analyzer.analyzeSequence([1, 1, 2, 3, 5, 8, 13]);
console.log(analysis);
// {
//   sequence: [1, 1, 2, 3, 5, 8, 13],
//   patterns: [{
//     name: 'Fibonacci',
//     confidence: 1.0,
//     formula: 'F(n) = F(n-1) + F(n-2)'
//   }],
//   matchedOEIS: {
//     id: 'A000045',
//     name: 'Fibonacci numbers',
//     confidence: 1.0,
//     matchType: 'exact'
//   },
//   recommendations: ['Use for: Recursive growth patterns', ...],
//   formula: 'F(n) = F(n-1) + F(n-2)'
// }

await analyzer.close();
```

### Example 2: Predictive Pattern Recognition

```typescript
import { MathematicalValidators } from 'agentic-flow/agentdb';

class PredictivePatternRecognizer {
  private validators = new MathematicalValidators();

  predictNext(sequence: number[], count: number = 1): number[] {
    // Check which pattern matches
    const patterns = [
      {
        name: 'Arithmetic',
        test: () => this.validators.isArithmeticProgression(sequence),
        predict: (seq: number[], n: number) => {
          const diff = seq[1] - seq[0];
          const lastValue = seq[seq.length - 1];
          return Array.from({ length: n }, (_, i) => lastValue + diff * (i + 1));
        },
      },
      {
        name: 'Geometric',
        test: () => this.validators.isGeometricProgression(sequence),
        predict: (seq: number[], n: number) => {
          const ratio = seq[1] / seq[0];
          const lastValue = seq[seq.length - 1];
          return Array.from({ length: n }, (_, i) =>
            Math.round(lastValue * Math.pow(ratio, i + 1))
          );
        },
      },
      {
        name: 'Fibonacci-like',
        test: () => this.validators.isFibonacci(sequence),
        predict: (seq: number[], n: number) => {
          const result = [];
          let a = seq[seq.length - 2];
          let b = seq[seq.length - 1];
          for (let i = 0; i < n; i++) {
            const next = a + b;
            result.push(next);
            a = b;
            b = next;
          }
          return result;
        },
      },
    ];

    for (const pattern of patterns) {
      if (pattern.test().isValid) {
        return pattern.predict(sequence, count);
      }
    }

    // Fallback: extrapolate based on differences
    const diffs = [];
    for (let i = 1; i < sequence.length; i++) {
      diffs.push(sequence[i] - sequence[i - 1]);
    }
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;

    const result = [];
    let lastValue = sequence[sequence.length - 1];
    for (let i = 0; i < count; i++) {
      lastValue += avgDiff;
      result.push(Math.round(lastValue));
    }
    return result;
  }
}

// Usage
const predictor = new PredictivePatternRecognizer();

const fib = [0, 1, 1, 2, 3, 5, 8];
const nextFib = predictor.predictNext(fib, 3);
console.log('Fibonacci next:', nextFib); // [13, 21, 34]

const arithmetic = [2, 5, 8, 11, 14];
const nextArith = predictor.predictNext(arithmetic, 3);
console.log('Arithmetic next:', nextArith); // [17, 20, 23]
```

## Linking Skills to Mathematical Patterns

### Example 1: Pattern-Based Skill Router

```typescript
import { SequenceValidator } from 'agentic-flow/agentdb';

interface Skill {
  id: string;
  name: string;
  patterns: string[];  // OEIS A-numbers
  execute: (sequence: number[]) => Promise<unknown>;
}

class PatternBasedSkillRouter {
  private validator: SequenceValidator;
  private skills: Map<string, Skill> = new Map();
  private patternIndex: Map<string, Skill[]> = new Map();

  constructor() {
    this.validator = new SequenceValidator();
  }

  async initialize(): Promise<void> {
    await this.validator.initialize();
  }

  registerSkill(skill: Skill): void {
    this.skills.set(skill.id, skill);

    // Index patterns for fast lookup
    for (const pattern of skill.patterns) {
      if (!this.patternIndex.has(pattern)) {
        this.patternIndex.set(pattern, []);
      }
      this.patternIndex.get(pattern)!.push(skill);
    }
  }

  async routeAndExecute(sequence: number[]): Promise<{
    sequence: number[];
    detectedPattern: string;
    appliedSkills: Array<{
      skillId: string;
      skillName: string;
      result: unknown;
    }>;
  }> {
    // Detect pattern
    const validationResult = await this.validator.validate(sequence);

    if (!validationResult.isValid || !validationResult.sequenceId) {
      return {
        sequence,
        detectedPattern: 'unknown',
        appliedSkills: [],
      };
    }

    // Find applicable skills
    const applicableSkills = this.patternIndex.get(
      validationResult.sequenceId
    ) || [];

    // Execute skills
    const results = await Promise.all(
      applicableSkills.map(async skill => ({
        skillId: skill.id,
        skillName: skill.name,
        result: await skill.execute(sequence),
      }))
    );

    return {
      sequence,
      detectedPattern: validationResult.sequenceId,
      appliedSkills: results,
    };
  }

  async close(): Promise<void> {
    await this.validator.close();
  }
}

// Usage
const router = new PatternBasedSkillRouter();
await router.initialize();

// Register pattern-specific skills
router.registerSkill({
  id: 'fib-analyze',
  name: 'Fibonacci Analyzer',
  patterns: ['A000045'],
  execute: async seq => ({
    count: seq.length,
    sum: seq.reduce((a, b) => a + b, 0),
    lastValue: seq[seq.length - 1],
  }),
});

router.registerSkill({
  id: 'prime-factorize',
  name: 'Prime Factorizer',
  patterns: ['A000040'],
  execute: async seq => ({
    count: seq.length,
    maxPrime: Math.max(...seq),
    analysis: 'Prime numbers detected',
  }),
});

// Route and execute
const result = await router.routeAndExecute([2, 3, 5, 7, 11, 13]);
console.log(result);
// {
//   detectedPattern: 'A000040',
//   appliedSkills: [{
//     skillId: 'prime-factorize',
//     skillName: 'Prime Factorizer',
//     result: { count: 6, maxPrime: 13, analysis: '...' }
//   }]
// }

await router.close();
```

## Performance Optimization

### Example 1: Hierarchical Caching Strategy

```typescript
import {
  SequenceValidator,
  OeisCache,
  MathematicalValidators,
} from 'agentic-flow/agentdb';

class OptimizedSequenceValidator {
  private fastCache: Map<string, unknown> = new Map();
  private validator: SequenceValidator;
  private validators = new MathematicalValidators();
  private hits = { fast: 0, db: 0, api: 0 };

  constructor(dbPath?: string) {
    this.validator = new SequenceValidator({
      cache: new OeisCache({
        dbPath: dbPath || './oeis-cache.db',
        preloadPopular: true,
      }),
    });
  }

  async initialize(): Promise<void> {
    await this.validator.initialize();
  }

  async validate(
    sequence: number[],
    options?: { useCache?: boolean; timeout?: number }
  ): Promise<{
    result: unknown;
    cacheHit: 'fast' | 'db' | 'api';
    timing: number;
  }> {
    const startTime = Date.now();

    // Level 1: Fast pattern matching (no I/O)
    const key = JSON.stringify(sequence);
    if (this.fastCache.has(key)) {
      this.hits.fast++;
      return {
        result: this.fastCache.get(key),
        cacheHit: 'fast',
        timing: Date.now() - startTime,
      };
    }

    // Level 2: Local math patterns (<1ms)
    const patterns = [
      () => this.validators.isFibonacci(sequence),
      () => this.validators.isPrime(sequence),
      () => this.validators.isFactorial(sequence),
      () => this.validators.isPowerOf2(sequence),
      () => this.validators.isSquare(sequence),
    ];

    for (const pattern of patterns) {
      const result = pattern();
      if (result.isValid) {
        this.fastCache.set(key, result);
        this.hits.fast++;
        return {
          result,
          cacheHit: 'fast',
          timing: Date.now() - startTime,
        };
      }
    }

    // Level 3: Database cache or API
    const result = await this.validator.validate(sequence);
    this.fastCache.set(key, result);

    const timing = Date.now() - startTime;
    const cacheHit = timing < 10 ? 'db' : 'api';

    if (cacheHit === 'db') {
      this.hits.db++;
    } else {
      this.hits.api++;
    }

    return { result, cacheHit, timing };
  }

  getStats(): {
    fastCache: number;
    hits: typeof this.hits;
    hitRate: string;
  } {
    const total = this.hits.fast + this.hits.db + this.hits.api;
    const hitRate = total > 0 ? ((this.hits.fast / total) * 100).toFixed(1) : '0';

    return {
      fastCache: this.fastCache.size,
      hits: this.hits,
      hitRate: `${hitRate}%`,
    };
  }

  async close(): Promise<void> {
    await this.validator.close();
  }
}

// Usage
const optimized = new OptimizedSequenceValidator();
await optimized.initialize();

// Multiple validations reuse cache
for (let i = 0; i < 1000; i++) {
  await optimized.validate([0, 1, 1, 2, 3, 5, 8, 13]);
}

console.log(optimized.getStats());
// { fastCache: 1, hits: { fast: 999, db: 1, api: 0 }, hitRate: '99.9%' }

await optimized.close();
```

### Example 2: Batch Processing with Concurrency Control

```typescript
async function batchValidateWithConcurrencyControl(
  sequences: number[][],
  maxConcurrent: number = 5
) {
  const validator = new SequenceValidator();
  await validator.initialize();

  const results = [];
  const queue = [...sequences];
  const processing = new Set();

  while (queue.length > 0 || processing.size > 0) {
    // Start new tasks up to concurrency limit
    while (processing.size < maxConcurrent && queue.length > 0) {
      const sequence = queue.shift()!;
      const promise = validator.validate(sequence).then(result => {
        processing.delete(promise);
        results.push(result);
      });
      processing.add(promise);
    }

    // Wait for at least one to complete
    if (processing.size > 0) {
      await Promise.race(processing);
    }
  }

  await validator.close();
  return results;
}
```

## Real-World Use Cases

### Example 1: AI Model Output Verification

```typescript
async function verifyModelOutput(modelOutput: {
  sequence: number[];
  confidence: number;
  reasoning: string;
}) {
  const validator = new SequenceValidator({
    minConfidence: 0.9,
  });

  await validator.initialize();

  const result = await validator.validate(modelOutput.sequence);

  const verification = {
    modelConfidence: modelOutput.confidence,
    oeisConfidence: result.confidence,
    isConsistent: Math.abs(modelOutput.confidence - result.confidence) < 0.2,
    isValid: result.isValid,
    sequenceId: result.sequenceId,
    verified: result.isValid && result.confidence >= 0.9,
  };

  await validator.close();
  return verification;
}
```

### Example 2: Mathematical Problem Generator

```typescript
class MathProblemGenerator {
  private validators: MathematicalValidators;

  constructor() {
    this.validators = new MathematicalValidators();
  }

  generateProblem(difficulty: 'easy' | 'medium' | 'hard'): {
    pattern: string;
    sequence: number[];
    question: string;
    answer: number;
  } {
    const problems = {
      easy: [
        {
          pattern: 'Fibonacci',
          generate: () => this.generateFibonacci(5),
          question: 'What is the next Fibonacci number?',
        },
        {
          pattern: 'Squares',
          generate: () => [1, 4, 9, 16, 25],
          question: 'What is the next perfect square?',
        },
      ],
      medium: [
        {
          pattern: 'Arithmetic',
          generate: () => [3, 7, 11, 15, 19],
          question: 'Find the next term in this arithmetic sequence',
        },
      ],
      hard: [
        {
          pattern: 'Catalan',
          generate: () => [1, 1, 2, 5, 14],
          question: 'Identify the pattern and find the next term',
        },
      ],
    };

    const selected = problems[difficulty][0];
    const sequence = selected.generate();
    const nextVal = this.predictNext(sequence);

    return {
      pattern: selected.pattern,
      sequence,
      question: selected.question,
      answer: nextVal,
    };
  }

  private generateFibonacci(n: number): number[] {
    const result = [0, 1];
    for (let i = 2; i < n; i++) {
      result.push(result[i - 1] + result[i - 2]);
    }
    return result;
  }

  private predictNext(sequence: number[]): number {
    // Simple linear extrapolation
    const diff = sequence[sequence.length - 1] - sequence[sequence.length - 2];
    return sequence[sequence.length - 1] + diff;
  }
}
```

### Example 3: Data Quality Monitor

```typescript
async function monitorDataQuality(
  dataStreams: Map<string, number[][]>
): Promise<{
  stream: string;
  isValid: boolean;
  quality: 'excellent' | 'good' | 'poor';
  recommendation: string;
}[]> {
  const validator = new SequenceValidator();
  await validator.initialize();

  const results = [];

  for (const [streamName, sequences] of dataStreams) {
    const validCount = (
      await Promise.all(sequences.map(seq => validator.validate(seq)))
    ).filter(r => r.isValid).length;

    const validRate = validCount / sequences.length;
    let quality: 'excellent' | 'good' | 'poor';
    let recommendation: string;

    if (validRate >= 0.9) {
      quality = 'excellent';
      recommendation = 'Data quality is excellent, no action needed';
    } else if (validRate >= 0.7) {
      quality = 'good';
      recommendation = 'Review 30% of invalid sequences';
    } else {
      quality = 'poor';
      recommendation = 'Investigate data generation process';
    }

    results.push({
      stream: streamName,
      isValid: validRate >= 0.8,
      quality,
      recommendation,
    });
  }

  await validator.close();
  return results;
}
```

## Advanced Workflows

### Example 1: Multi-Agent Pattern Coordination

```typescript
interface AgentTask {
  agentId: string;
  sequence: number[];
  action: 'validate' | 'predict' | 'analyze';
}

class MultiAgentCoordinator {
  private validator: SequenceValidator;
  private results: Map<string, unknown> = new Map();

  constructor() {
    this.validator = new SequenceValidator();
  }

  async initialize(): Promise<void> {
    await this.validator.initialize();
  }

  async coordinateTasks(tasks: AgentTask[]): Promise<Map<string, unknown>> {
    // Group by sequence to reuse validations
    const sequenceMap = new Map<string, AgentTask[]>();

    for (const task of tasks) {
      const key = JSON.stringify(task.sequence);
      if (!sequenceMap.has(key)) {
        sequenceMap.set(key, []);
      }
      sequenceMap.get(key)!.push(task);
    }

    // Process each unique sequence once
    for (const [, groupedTasks] of sequenceMap) {
      const sequence = groupedTasks[0].sequence;
      const validation = await this.validator.validate(sequence);

      // Distribute results to agents
      for (const task of groupedTasks) {
        const taskKey = `${task.agentId}:${task.action}`;

        switch (task.action) {
          case 'validate':
            this.results.set(taskKey, {
              isValid: validation.isValid,
              confidence: validation.confidence,
            });
            break;
          case 'predict':
            // Implement prediction logic
            break;
          case 'analyze':
            this.results.set(taskKey, validation);
            break;
        }
      }
    }

    return this.results;
  }

  async close(): Promise<void> {
    await this.validator.close();
  }
}
```

---

**Next Steps:**
- Check [API documentation](./API.md) for detailed method signatures
- Visit [README](./README.md) for troubleshooting and performance tips

# OEIS Integration - Step-by-Step Walkthrough

This walkthrough guides you through the OEIS integration with practical, runnable examples.

## Prerequisites

- Node.js 18+
- npm or yarn
- Agentic Flow installed

## Step 1: Basic Setup

### Installation

```bash
npm install agentic-flow
```

### Create Your First Validator

Create a file `validate-fibonacci.ts`:

```typescript
import { SequenceValidator } from 'agentic-flow/agentdb';

async function main() {
  // 1. Create validator instance
  const validator = new SequenceValidator();

  // 2. Initialize (sets up cache)
  await validator.initialize();

  // 3. Validate a Fibonacci sequence
  const sequence = [0, 1, 1, 2, 3, 5, 8, 13];
  const result = await validator.validate(sequence);

  // 4. Check result
  console.log('Result:', {
    isValid: result.isValid,
    confidence: result.confidence,
    sequenceId: result.sequenceId,
    name: result.matchedSequence?.name,
  });

  // 5. Clean up
  await validator.close();
}

main().catch(console.error);
```

### Run It

```bash
npx ts-node validate-fibonacci.ts
```

**Output:**
```
Result: {
  isValid: true,
  confidence: 1,
  sequenceId: 'A000045',
  name: 'Fibonacci numbers: F(n) = F(n-1) + F(n-2)'
}
```

## Step 2: Working with Mathematical Patterns

### Quick Local Validation

Create `validate-patterns.ts`:

```typescript
import { MathematicalValidators } from 'agentic-flow/agentdb';

async function main() {
  const validators = new MathematicalValidators();

  // Test various patterns (no network required!)
  const tests = [
    {
      name: 'Fibonacci',
      seq: [0, 1, 1, 2, 3, 5, 8, 13],
      fn: () => validators.isFibonacci,
    },
    {
      name: 'Prime Numbers',
      seq: [2, 3, 5, 7, 11, 13, 17, 19],
      fn: () => validators.isPrime,
    },
    {
      name: 'Perfect Squares',
      seq: [0, 1, 4, 9, 16, 25, 36, 49],
      fn: () => validators.isSquare,
    },
    {
      name: 'Powers of 2',
      seq: [1, 2, 4, 8, 16, 32, 64],
      fn: () => validators.isPowerOf2,
    },
    {
      name: 'Factorials',
      seq: [1, 1, 2, 6, 24, 120, 720],
      fn: () => validators.isFactorial,
    },
  ];

  console.log('Testing mathematical patterns...\n');

  for (const test of tests) {
    const fn = test.fn();
    const result = fn(test.seq);

    console.log(`${test.name}:`);
    console.log(`  Sequence: [${test.seq.slice(0, 5).join(', ')}...]`);
    console.log(`  Valid: ${result.isValid}`);
    console.log(`  Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    console.log(`  Formula: ${result.formula}\n`);
  }
}

main();
```

### Run It

```bash
npx ts-node validate-patterns.ts
```

**Output:**
```
Testing mathematical patterns...

Fibonacci:
  Sequence: [0, 1, 1, 2, 3, 5]...
  Valid: true
  Confidence: 100%
  Formula: F(n) = F(n-1) + F(n-2)

Prime Numbers:
  Sequence: [2, 3, 5, 7, 11, 13]...
  Valid: true
  Confidence: 100%
  Formula: Prime numbers: divisible only by 1 and themselves

...
```

## Step 3: Searching and Retrieving Sequences

### Using the API Client

Create `search-sequences.ts`:

```typescript
import { OeisApiClient } from 'agentic-flow/agentdb';

async function main() {
  const client = new OeisApiClient({
    rateLimit: 10,
    timeout: 30000,
  });

  console.log('OEIS Search Examples\n');

  // Example 1: Get specific sequence
  console.log('1. Getting Fibonacci (A000045)...');
  const fib = await client.getSequence('A000045');
  console.log(`   Name: ${fib?.name}`);
  console.log(`   First 10 terms: [${fib?.data.slice(0, 10).join(', ')}]`);

  // Example 2: Search by values
  console.log('\n2. Searching by values [1, 1, 2, 3, 5, 8]...');
  const searchResult = await client.searchByValues([1, 1, 2, 3, 5, 8]);
  console.log(`   Found ${searchResult.count} matches`);
  if (searchResult.results[0]) {
    console.log(`   Top match: ${searchResult.results[0].id} - ${searchResult.results[0].name}`);
  }

  // Example 3: Text search
  console.log('\n3. Searching for "prime numbers"...');
  const primeSearch = await client.search('prime numbers');
  console.log(`   Found ${primeSearch.count} matches`);
  if (primeSearch.results[0]) {
    const top = primeSearch.results[0];
    console.log(`   Top match: ${top.id} - ${top.name}`);
  }

  // Example 4: Auto-format A-numbers
  console.log('\n4. Auto-format testing...');
  const variants = ['45', 'A45', 'A000045'];
  for (const variant of variants) {
    const seq = await client.getSequence(variant);
    console.log(`   ${variant} -> ${seq?.id}`);
  }
}

main().catch(console.error);
```

### Run It

```bash
npx ts-node search-sequences.ts
```

## Step 4: Caching for Performance

### Persistent Cache Example

Create `cache-demo.ts`:

```typescript
import { OeisCache, OeisApiClient } from 'agentic-flow/agentdb';

async function main() {
  // Create persistent cache
  const cache = new OeisCache({
    dbPath: './oeis-cache.db',
    defaultTTL: 86400,        // 24 hours
    preloadPopular: true,
  });

  await cache.initialize();

  console.log('Demonstrating OEIS Caching\n');

  const client = new OeisApiClient();

  // First access (from API)
  console.log('First access (from OEIS API):');
  console.time('First');
  const seq1 = await client.getSequence('A000045');
  console.timeEnd('First');

  // Store in cache
  if (seq1) {
    await cache.set(seq1);
    console.log('Stored in cache\n');
  }

  // Second access (from cache)
  console.log('Second access (from cache):');
  console.time('Second');
  const seq2 = await cache.get('A000045');
  console.timeEnd('Second');
  console.log('Sequence:', seq2?.name, '\n');

  // Check cache stats
  const stats = await cache.getStats();
  console.log('Cache Statistics:');
  console.log(`  Total entries: ${stats.count}`);
  console.log(`  Memory cache: ${stats.memorySize}`);
  console.log(`  Database cache: ${stats.diskSize}`);

  await cache.close();
}

main().catch(console.error);
```

### Run It

```bash
npx ts-node cache-demo.ts
```

## Step 5: Batch Validation

### Validating Multiple Sequences

Create `batch-validate.ts`:

```typescript
import { SequenceValidator } from 'agentic-flow/agentdb';

async function main() {
  const validator = new SequenceValidator({
    minConfidence: 0.8,
    cacheResults: true,
  });

  await validator.initialize();

  const sequences = [
    { name: 'Fibonacci', data: [0, 1, 1, 2, 3, 5, 8, 13] },
    { name: 'Primes', data: [2, 3, 5, 7, 11, 13, 17, 19] },
    { name: 'Squares', data: [0, 1, 4, 9, 16, 25, 36, 49] },
    { name: 'Powers of 2', data: [1, 2, 4, 8, 16, 32, 64] },
    { name: 'Factorials', data: [1, 1, 2, 6, 24, 120] },
    { name: 'Random', data: [12, 47, 89, 23, 56, 78] },
  ];

  console.log('Batch Validation Results\n');
  console.log('Sequence'.padEnd(20) + 'Valid'.padEnd(10) + 'ID'.padEnd(15) + 'Confidence');
  console.log('-'.repeat(70));

  const results = await Promise.all(
    sequences.map(seq => validator.validate(seq.data))
  );

  sequences.forEach((seq, i) => {
    const result = results[i];
    const status = result.isValid ? 'Yes' : 'No';
    const id = result.sequenceId || 'N/A';
    const confidence = `${(result.confidence * 100).toFixed(0)}%`;

    console.log(
      seq.name.padEnd(20) +
        status.padEnd(10) +
        id.padEnd(15) +
        confidence
    );
  });

  // Summary
  const validCount = results.filter(r => r.isValid).length;
  console.log('\n' + '='.repeat(70));
  console.log(`Summary: ${validCount}/${sequences.length} sequences validated`);
  console.log(`Match rate: ${((validCount / sequences.length) * 100).toFixed(1)}%\n`);

  const cacheStats = await validator.getCacheStats();
  console.log('Cache Performance:');
  console.log(`  Entries cached: ${cacheStats.count}`);
  if (cacheStats.topSequences.length > 0) {
    console.log(`  Most used: ${cacheStats.topSequences[0]?.id}`);
  }

  await validator.close();
}

main().catch(console.error);
```

### Run It

```bash
npx ts-node batch-validate.ts
```

## Step 6: Advanced - Pattern Recognition Agent

### Building a Smart Agent

Create `pattern-agent.ts`:

```typescript
import {
  SequenceValidator,
  MathematicalValidators,
} from 'agentic-flow/agentdb';

class PatternAgent {
  private validator: SequenceValidator;
  private mathValidators: MathematicalValidators;

  constructor() {
    this.validator = new SequenceValidator();
    this.mathValidators = new MathematicalValidators();
  }

  async initialize() {
    await this.validator.initialize();
  }

  async analyze(sequence: number[]) {
    console.log(`\nAnalyzing sequence: [${sequence.slice(0, 5).join(', ')}...]`);
    console.log('='.repeat(50));

    // Stage 1: Quick pattern check
    console.log('\nStage 1: Checking local patterns...');
    const patterns = [
      { name: 'Fibonacci', fn: () => this.mathValidators.isFibonacci(sequence) },
      { name: 'Primes', fn: () => this.mathValidators.isPrime(sequence) },
      { name: 'Factorials', fn: () => this.mathValidators.isFactorial(sequence) },
      { name: 'Squares', fn: () => this.mathValidators.isSquare(sequence) },
      { name: 'Powers of 2', fn: () => this.mathValidators.isPowerOf2(sequence) },
      { name: 'Arithmetic', fn: () => this.mathValidators.isArithmeticProgression(sequence) },
      { name: 'Geometric', fn: () => this.mathValidators.isGeometricProgression(sequence) },
    ];

    for (const { name, fn } of patterns) {
      const result = fn();
      if (result.isValid) {
        console.log(`  ✓ Match: ${name}`);
        console.log(`    Formula: ${result.formula}`);
        console.log(`    Confidence: ${(result.confidence * 100).toFixed(0)}%`);
        return;
      }
    }

    // Stage 2: Full OEIS search
    console.log('\nStage 2: Searching OEIS database...');
    const result = await this.validator.validate(sequence);

    if (result.isValid) {
      console.log(`  ✓ Found: ${result.sequenceId}`);
      console.log(`    Name: ${result.matchedSequence?.name}`);
      console.log(`    Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`    Match type: ${result.matchType}`);
    } else if (result.suggestions?.length) {
      console.log(`  ! No exact match, suggestions:`);
      result.suggestions.slice(0, 3).forEach(s => {
        console.log(`    - ${s.id}: ${s.name}`);
      });
    } else {
      console.log('  ✗ No patterns detected');
    }
  }

  async close() {
    await this.validator.close();
  }
}

async function main() {
  const agent = new PatternAgent();
  await agent.initialize();

  // Test various sequences
  const testSequences = [
    [0, 1, 1, 2, 3, 5, 8, 13, 21],           // Fibonacci
    [2, 3, 5, 7, 11, 13, 17, 19, 23],        // Primes
    [1, 2, 4, 8, 16, 32, 64, 128],           // Powers of 2
    [1, 4, 9, 16, 25, 36, 49, 64],           // Squares
    [1, 1, 2, 6, 24, 120, 720],              // Factorials
    [5, 10, 15, 20, 25, 30, 35],             // Arithmetic
  ];

  for (const seq of testSequences) {
    await agent.analyze(seq);
  }

  await agent.close();
  console.log('\n' + '='.repeat(50));
  console.log('Analysis complete!');
}

main().catch(console.error);
```

### Run It

```bash
npx ts-node pattern-agent.ts
```

## Step 7: MCP Tool Integration

### Using OEIS with AI Agents

When OEIS MCP tools are registered:

```bash
# Register MCP server
claude mcp add claude-flow npx claude-flow@alpha mcp start
```

Available tools:
- `validate-sequence` - Validate sequences
- `search-sequences` - Find sequences
- `match-pattern` - Detect patterns
- `link-skill` - Connect sequences to skills

## Common Patterns

### Pattern 1: Validate Agent Output

```typescript
async function validateAgentOutput(output: unknown) {
  if (Array.isArray(output) && output.every(n => typeof n === 'number')) {
    const validator = new SequenceValidator();
    await validator.initialize();
    const result = await validator.validate(output);
    await validator.close();
    return result;
  }
  return null;
}
```

### Pattern 2: Predict Next Terms

```typescript
function predictNext(sequence: number[], count: number = 1): number[] {
  const validators = new MathematicalValidators();

  // Check if arithmetic progression
  if (validators.isArithmeticProgression(sequence).isValid) {
    const diff = sequence[1] - sequence[0];
    const last = sequence[sequence.length - 1];
    return Array.from({ length: count }, (_, i) => last + diff * (i + 1));
  }

  // Check if Fibonacci-like
  if (validators.isFibonacci(sequence).isValid) {
    const result = [];
    let [a, b] = [sequence[sequence.length - 2], sequence[sequence.length - 1]];
    for (let i = 0; i < count; i++) {
      const next = a + b;
      result.push(next);
      [a, b] = [b, next];
    }
    return result;
  }

  // Fallback: linear extrapolation
  return [];
}
```

### Pattern 3: Error Handling

```typescript
import { OeisApiError } from 'agentic-flow/agentdb';

try {
  const seq = await client.getSequence('invalid');
} catch (error) {
  if (error instanceof OeisApiError) {
    console.error(`Error [${error.code}]: ${error.message}`);
    if (error.statusCode) {
      console.error(`HTTP Status: ${error.statusCode}`);
    }
  } else {
    throw error;
  }
}
```

## Performance Tips

1. **Use patterns first**: Check `MathematicalValidators` before OEIS API
2. **Enable caching**: Use persistent database cache for repeated queries
3. **Batch validations**: Validate multiple sequences in parallel
4. **Set appropriate timeouts**: Balance between reliability and responsiveness
5. **Adjust rate limits**: Lower for conservative usage, higher for bulk operations

## Next Steps

- Read the [main README](./README.md) for complete documentation
- Check [EXAMPLES.md](./EXAMPLES.md) for advanced use cases
- Review [API.md](./API.md) for detailed method signatures

/**
 * OEIS Module Usage Examples
 *
 * Demonstrates how to use the OEIS validation modules in AgentDB.
 */

import {
  OeisApiClient,
  OeisCache,
  SequenceValidator,
  MathematicalValidators,
} from '../oeis/index.js';

/**
 * Example 1: Basic Mathematical Pattern Validation
 */
async function example1_BasicValidation() {
  console.log('\n=== Example 1: Basic Mathematical Pattern Validation ===\n');

  const validators = new MathematicalValidators();

  // Validate Fibonacci sequence
  const fibonacci = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34];
  const fibResult = validators.isFibonacci(fibonacci);
  console.log('Fibonacci validation:', fibResult);

  // Validate prime numbers
  const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23];
  const primeResult = validators.isPrime(primes);
  console.log('Prime validation:', primeResult);

  // Validate powers of 2
  const powersOf2 = [1, 2, 4, 8, 16, 32, 64, 128];
  const power2Result = validators.isPowerOf2(powersOf2);
  console.log('Powers of 2 validation:', power2Result);
}

/**
 * Example 2: OEIS API Client Usage
 */
async function example2_ApiClient() {
  console.log('\n=== Example 2: OEIS API Client Usage ===\n');

  const client = new OeisApiClient({
    rateLimit: 10, // 10 requests per minute
    timeout: 30000,
  });

  try {
    // Fetch Fibonacci sequence by A-number
    console.log('Fetching A000045 (Fibonacci)...');
    const fibonacci = await client.getSequence('A000045');
    console.log('Sequence:', fibonacci?.name);
    console.log('First terms:', fibonacci?.data.slice(0, 10));

    // Search by sequence values
    console.log('\nSearching for [1, 1, 2, 3, 5, 8]...');
    const searchResults = await client.searchByValues([1, 1, 2, 3, 5, 8]);
    console.log(`Found ${searchResults.count} matches`);
    console.log('Top match:', searchResults.results[0]?.id, searchResults.results[0]?.name);
  } catch (error) {
    console.error('API Error:', error);
  }
}

/**
 * Example 3: Caching Sequences
 */
async function example3_Caching() {
  console.log('\n=== Example 3: Caching Sequences ===\n');

  const cache = new OeisCache({
    dbPath: ':memory:', // Use in-memory database for demo
    defaultTTL: 3600,   // 1 hour cache
  });

  await cache.initialize();

  // Store a sequence
  const sequence = {
    number: 45,
    id: 'A000045',
    data: [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89],
    name: 'Fibonacci numbers: F(n) = F(n-1) + F(n-2)',
    keyword: ['nonn', 'easy', 'core'],
  };

  await cache.set(sequence);
  console.log('Cached sequence:', sequence.id);

  // Retrieve from cache
  const retrieved = await cache.get('A000045');
  console.log('Retrieved from cache:', retrieved?.name);

  // Check if cached
  const exists = await cache.has('A000045');
  console.log('Is cached:', exists);

  // Get statistics
  const stats = await cache.getStats();
  console.log('Cache stats:', stats);

  await cache.close();
}

/**
 * Example 4: Full Sequence Validation
 */
async function example4_FullValidation() {
  console.log('\n=== Example 4: Full Sequence Validation ===\n');

  const cache = new OeisCache({ dbPath: ':memory:' });
  const client = new OeisApiClient();
  const validator = new SequenceValidator({
    cache,
    apiClient: client,
    minConfidence: 0.8,
    minMatchLength: 4,
  });

  await validator.initialize();

  // Test various sequences
  const testSequences = [
    { seq: [0, 1, 1, 2, 3, 5, 8, 13], name: 'Fibonacci' },
    { seq: [2, 3, 5, 7, 11, 13, 17], name: 'Primes' },
    { seq: [1, 4, 9, 16, 25, 36, 49], name: 'Squares' },
    { seq: [1, 2, 4, 8, 16, 32, 64], name: 'Powers of 2' },
    { seq: [0, 1, 3, 6, 10, 15, 21], name: 'Triangular' },
    { seq: [1, 1, 2, 6, 24, 120, 720], name: 'Factorials' },
  ];

  for (const test of testSequences) {
    console.log(`\nValidating ${test.name}:`, test.seq);
    const result = await validator.validate(test.seq);
    console.log('  Valid:', result.isValid);
    console.log('  Confidence:', result.confidence.toFixed(2));
    console.log('  Match Type:', result.matchType);
    if (result.sequenceId) {
      console.log('  OEIS ID:', result.sequenceId);
    }
    if (result.matchDetails?.formula) {
      console.log('  Formula:', result.matchDetails.formula);
    }
  }

  await validator.close();
}

/**
 * Example 5: Advanced Pattern Detection
 */
async function example5_AdvancedPatterns() {
  console.log('\n=== Example 5: Advanced Pattern Detection ===\n');

  const validators = new MathematicalValidators();

  // Arithmetic progression
  const arithmetic = [5, 10, 15, 20, 25, 30];
  const arithResult = validators.isArithmeticProgression(arithmetic);
  console.log('Arithmetic progression:', arithResult);

  // Geometric progression
  const geometric = [2, 6, 18, 54, 162];
  const geomResult = validators.isGeometricProgression(geometric);
  console.log('Geometric progression:', geomResult);

  // Catalan numbers
  const catalan = [1, 1, 2, 5, 14, 42, 132];
  const catalanResult = validators.isCatalan(catalan);
  console.log('Catalan numbers:', catalanResult);

  // Triangular numbers
  const triangular = [0, 1, 3, 6, 10, 15, 21, 28];
  const triangularResult = validators.isTriangular(triangular);
  console.log('Triangular numbers:', triangularResult);
}

/**
 * Example 6: Error Handling
 */
async function example6_ErrorHandling() {
  console.log('\n=== Example 6: Error Handling ===\n');

  const validator = new SequenceValidator();
  await validator.initialize();

  // Test invalid inputs
  const testCases = [
    { seq: [], name: 'Empty sequence' },
    { seq: [1, 2], name: 'Too short' },
    { seq: [999, 888, 777, 666], name: 'No match' },
  ];

  for (const test of testCases) {
    console.log(`\nTesting ${test.name}:`, test.seq);
    const result = await validator.validate(test.seq);
    console.log('  Valid:', result.isValid);
    console.log('  Error:', result.error || 'None');
    console.log('  Confidence:', result.confidence);
  }

  await validator.close();
}

/**
 * Example 7: Validate by A-Number
 */
async function example7_ValidateByANumber() {
  console.log('\n=== Example 7: Validate by A-Number ===\n');

  const validator = new SequenceValidator();
  await validator.initialize();

  // Test if a sequence matches A000045 (Fibonacci)
  const testSequence = [0, 1, 1, 2, 3, 5, 8, 13];
  const result = await validator.validateByANumber(testSequence, 'A000045');

  console.log('Validating against A000045 (Fibonacci)');
  console.log('Sequence:', testSequence);
  console.log('Valid:', result.isValid);
  console.log('Confidence:', result.confidence);
  console.log('Match Type:', result.matchType);

  await validator.close();
}

/**
 * Main execution
 */
async function main() {
  console.log('OEIS Module Usage Examples');
  console.log('===========================');

  try {
    await example1_BasicValidation();
    await example3_Caching();
    await example4_FullValidation();
    await example5_AdvancedPatterns();
    await example6_ErrorHandling();

    // Network-dependent examples (commented out for offline usage)
    // await example2_ApiClient();
    // await example7_ValidateByANumber();

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
  }
}

// Run examples if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

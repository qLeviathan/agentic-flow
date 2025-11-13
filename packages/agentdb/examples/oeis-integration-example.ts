/**
 * OEIS Integration Example
 *
 * Demonstrates how to use the OEIS validation features integrated with
 * AgentDB's SkillLibrary and ReflexionMemory systems.
 */

import {
  createDatabase,
  EmbeddingService,
  SkillLibrary,
  ReflexionMemory,
  validateSequence,
  extractSequencesFromText,
  detectSequencePattern,
  calculateSequenceSimilarity
} from '../src/index.js';

async function main() {
  console.log('🚀 OEIS Integration Example\n');

  // Initialize database and services
  const db = createDatabase(':memory:');
  const embedder = new EmbeddingService({ model: 'default' });
  const skillLib = new SkillLibrary(db, embedder);
  const memory = new ReflexionMemory(db, embedder);

  // ========================================================================
  // Example 1: Basic Sequence Validation
  // ========================================================================
  console.log('📊 Example 1: Basic Sequence Validation\n');

  const fibonacci = [1, 1, 2, 3, 5, 8, 13, 21, 34];
  const validatedSeq = validateSequence(fibonacci, {
    minLength: 3,
    maxLength: 100,
    allowNegative: false
  });
  console.log('✓ Validated Fibonacci sequence:', validatedSeq);

  const pattern = detectSequencePattern(validatedSeq);
  if (pattern) {
    console.log(`✓ Detected pattern: ${pattern.type} (confidence: ${pattern.confidence})`);
    console.log(`  Description: ${pattern.description}\n`);
  }

  // ========================================================================
  // Example 2: Extract Sequences from Text
  // ========================================================================
  console.log('📝 Example 2: Extract Sequences from Text\n');

  const outputText = `
    Analysis complete:
    - Prime numbers found: 2, 3, 5, 7, 11, 13, 17, 19
    - Fibonacci sequence: 1, 1, 2, 3, 5, 8, 13
    - Powers of 2: [2, 4, 8, 16, 32, 64]
  `;

  const sequences = extractSequencesFromText(outputText, {
    minLength: 4,
    maxLength: 20
  });

  console.log(`✓ Found ${sequences.length} sequences:`);
  for (const seq of sequences) {
    const seqPattern = detectSequencePattern(seq);
    console.log(`  - ${seq.join(', ')}`);
    if (seqPattern) {
      console.log(`    Pattern: ${seqPattern.type} - ${seqPattern.description}`);
    }
  }
  console.log();

  // ========================================================================
  // Example 3: SkillLibrary Integration
  // ========================================================================
  console.log('🎯 Example 3: SkillLibrary with OEIS Patterns\n');

  // Create a skill that generates Fibonacci numbers
  const fibonacciSkill = {
    name: 'fibonacci-generator',
    description: 'Generates Fibonacci sequence: 1, 1, 2, 3, 5, 8, 13, 21',
    signature: {
      inputs: { n: 'number' },
      outputs: { sequence: 'number[]' }
    },
    code: `
      function fibonacci(n) {
        const seq = [1, 1];
        for (let i = 2; i < n; i++) {
          seq.push(seq[i-1] + seq[i-2]);
        }
        return seq;
      }
    `,
    successRate: 0.95,
    uses: 20,
    avgReward: 0.9,
    avgLatencyMs: 15
  };

  const skillId = await skillLib.createSkill(fibonacciSkill);
  console.log(`✓ Created skill: ${fibonacciSkill.name} (ID: ${skillId})`);

  // Detect OEIS patterns in the skill
  const skillPatterns = await skillLib.detectOEISPatterns(fibonacciSkill);
  console.log(`✓ Detected ${skillPatterns.length} OEIS patterns in skill:`);
  for (const p of skillPatterns) {
    console.log(`  - Sequence: [${p.sequence.slice(0, 8).join(', ')}...]`);
    console.log(`    Source: ${p.source}, Confidence: ${p.confidence}`);
    if (p.metadata?.patternType) {
      console.log(`    Type: ${p.metadata.patternType}`);
    }
  }
  console.log();

  // Link patterns to skill
  for (const pattern of skillPatterns) {
    skillLib.linkSkillToOEISPattern(skillId, pattern);
  }
  console.log('✓ Linked OEIS patterns to skill\n');

  // Create more skills with different patterns
  const primeSkill = {
    name: 'prime-generator',
    description: 'Generates prime numbers: 2, 3, 5, 7, 11, 13',
    signature: {
      inputs: { limit: 'number' },
      outputs: { primes: 'number[]' }
    },
    successRate: 0.92,
    uses: 15,
    avgReward: 0.88,
    avgLatencyMs: 25
  };

  const primeSkillId = await skillLib.createSkill(primeSkill);
  const primePatterns = await skillLib.detectOEISPatterns(primeSkill);
  for (const pattern of primePatterns) {
    skillLib.linkSkillToOEISPattern(primeSkillId, pattern);
  }
  console.log(`✓ Created and linked patterns for: ${primeSkill.name}\n`);

  // Search for skills by sequence pattern
  const targetSequence = [1, 1, 2, 3, 5];
  const matchingSkills = skillLib.getSkillsWithSequencePattern(targetSequence, {
    minSimilarity: 0.7,
    minSuccessRate: 0.5,
    limit: 5
  });

  console.log(`🔍 Skills matching sequence [${targetSequence.join(', ')}]:`);
  for (const skill of matchingSkills) {
    console.log(`  - ${skill.name} (similarity: ${skill.similarity?.toFixed(2)})`);
    if (skill.oeisPatterns) {
      console.log(`    Matched ${skill.oeisPatterns.length} pattern(s)`);
    }
  }
  console.log();

  // Get OEIS statistics
  const skillStats = skillLib.getOEISPatternStats();
  console.log('📈 Skill Library OEIS Statistics:');
  console.log(`  - Total skills: ${skillStats.totalSkills}`);
  console.log(`  - Skills with patterns: ${skillStats.skillsWithPatterns}`);
  console.log(`  - Total patterns: ${skillStats.totalPatterns}`);
  console.log(`  - Patterns by type:`, skillStats.patternsByType);
  console.log();

  // ========================================================================
  // Example 4: ReflexionMemory Integration
  // ========================================================================
  console.log('💾 Example 4: ReflexionMemory with Sequence Validation\n');

  // Store episodes with sequence validation
  const episode1 = {
    sessionId: 'session-001',
    task: 'generate-fibonacci',
    input: 'n=10',
    output: 'Fibonacci(10): 1, 1, 2, 3, 5, 8, 13, 21, 34, 55',
    critique: 'Successfully generated correct Fibonacci sequence',
    reward: 0.95,
    success: true,
    latencyMs: 12
  };

  const result1 = await memory.storeEpisodeWithValidation(episode1);
  console.log(`✓ Stored episode ${result1.episodeId} with validation:`);
  console.log(`  - Has sequences: ${result1.validation.hasSequences}`);
  console.log(`  - Patterns found: ${result1.validation.patterns.length}`);
  console.log(`  - Validated: ${result1.validation.validated}`);
  if (result1.validation.patterns.length > 0) {
    const p = result1.validation.patterns[0];
    console.log(`  - First pattern: [${p.sequence.slice(0, 5).join(', ')}...]`);
  }
  console.log();

  // Store episode with prime numbers
  const episode2 = {
    sessionId: 'session-002',
    task: 'find-primes',
    input: 'limit=20',
    output: 'Prime numbers up to 20: 2, 3, 5, 7, 11, 13, 17, 19',
    reward: 0.92,
    success: true
  };

  const result2 = await memory.storeEpisodeWithValidation(episode2);
  console.log(`✓ Stored episode ${result2.episodeId} with ${result2.validation.patterns.length} patterns\n`);

  // Store episode with squares
  const episode3 = {
    sessionId: 'session-003',
    task: 'compute-squares',
    output: 'Perfect squares: 1, 4, 9, 16, 25, 36, 49, 64, 81',
    reward: 0.98,
    success: true
  };

  await memory.storeEpisodeWithValidation(episode3);
  console.log('✓ Stored episode with square number sequence\n');

  // Find episodes with similar sequences
  const searchSequence = [1, 1, 2, 3, 5, 8];
  const matchingEpisodes = memory.getEpisodesWithOeisMatch(searchSequence, {
    minSimilarity: 0.7,
    onlySuccesses: true,
    limit: 5
  });

  console.log(`🔍 Episodes matching sequence [${searchSequence.join(', ')}]:`);
  for (const ep of matchingEpisodes) {
    console.log(`  - Episode ${ep.id}: ${ep.task}`);
    console.log(`    Similarity: ${ep.similarity?.toFixed(2)}, Reward: ${ep.reward}`);
    if (ep.oeisPatterns) {
      console.log(`    Matched ${ep.oeisPatterns.length} pattern(s)`);
    }
  }
  console.log();

  // Get sequence statistics
  const episodeStats = memory.getSequenceStats({
    onlySuccesses: true,
    minReward: 0.5
  });

  console.log('📊 Episode Sequence Statistics:');
  console.log(`  - Total episodes: ${episodeStats.totalEpisodes}`);
  console.log(`  - Episodes with sequences: ${episodeStats.episodesWithSequences}`);
  console.log(`  - Total sequences: ${episodeStats.totalSequences}`);
  console.log(`  - Average confidence: ${episodeStats.averageConfidence.toFixed(2)}`);
  console.log(`  - Patterns by type:`, episodeStats.patternsByType);
  console.log();

  // ========================================================================
  // Example 5: Sequence Similarity Calculation
  // ========================================================================
  console.log('🔬 Example 5: Sequence Similarity Analysis\n');

  const seq1 = [1, 1, 2, 3, 5, 8, 13];
  const seq2 = [1, 1, 2, 3, 5, 8, 13, 21];
  const seq3 = [2, 3, 5, 7, 11, 13, 17];

  const sim1 = calculateSequenceSimilarity(seq1, seq2);
  const sim2 = calculateSequenceSimilarity(seq1, seq3);
  const sim3 = calculateSequenceSimilarity(seq2, seq3);

  console.log('Similarity scores:');
  console.log(`  Fibonacci(7) vs Fibonacci(8): ${sim1.toFixed(3)}`);
  console.log(`  Fibonacci(7) vs Primes(7):    ${sim2.toFixed(3)}`);
  console.log(`  Fibonacci(8) vs Primes(7):    ${sim3.toFixed(3)}`);
  console.log();

  // ========================================================================
  // Example 6: Batch Processing
  // ========================================================================
  console.log('⚡ Example 6: Batch Processing\n');

  // Auto-detect patterns across all skills
  const batchStats = await skillLib.autoDetectOEISPatterns({
    minSuccessRate: 0.5,
    batchSize: 100
  });

  console.log('✓ Batch OEIS pattern detection completed:');
  console.log(`  - Processed: ${batchStats.processed} skills`);
  console.log(`  - Patterns found: ${batchStats.patternsFound}`);
  console.log(`  - Skills updated: ${batchStats.skillsUpdated}`);
  console.log();

  // ========================================================================
  // Example 7: Pattern Detection for Different Sequence Types
  // ========================================================================
  console.log('🎨 Example 7: Pattern Detection for Various Sequences\n');

  const testSequences = [
    { name: 'Arithmetic', seq: [2, 4, 6, 8, 10, 12] },
    { name: 'Geometric', seq: [2, 4, 8, 16, 32, 64] },
    { name: 'Fibonacci', seq: [1, 1, 2, 3, 5, 8, 13] },
    { name: 'Squares', seq: [1, 4, 9, 16, 25, 36] },
    { name: 'Cubes', seq: [1, 8, 27, 64, 125, 216] }
  ];

  console.log('Pattern detection results:');
  for (const { name, seq } of testSequences) {
    const detected = detectSequencePattern(seq);
    if (detected) {
      console.log(`  ${name}:`);
      console.log(`    Type: ${detected.type}`);
      console.log(`    Confidence: ${detected.confidence}`);
      console.log(`    Description: ${detected.description}`);
    }
  }
  console.log();

  // ========================================================================
  // Summary
  // ========================================================================
  console.log('✅ OEIS Integration Example Complete!\n');
  console.log('Summary of capabilities demonstrated:');
  console.log('  ✓ Sequence validation and pattern detection');
  console.log('  ✓ Automatic extraction of sequences from text');
  console.log('  ✓ Skill library integration with OEIS patterns');
  console.log('  ✓ Episode validation with sequence detection');
  console.log('  ✓ Pattern-based search and matching');
  console.log('  ✓ Statistical analysis and reporting');
  console.log('  ✓ Batch processing for existing data');
  console.log();

  // Close database
  db.close();
}

// Run the example
main().catch(console.error);

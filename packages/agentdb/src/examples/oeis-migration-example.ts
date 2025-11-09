/**
 * OEIS Migration Example
 *
 * Demonstrates how to:
 * 1. Apply OEIS migration
 * 2. Check migration status
 * 3. Query OEIS sequences
 * 4. Rollback migration
 */

import { createDatabase } from '../db-fallback.js';
import {
  applyOEISMigration,
  isOEISMigrationApplied,
  getOEISMigrationInfo,
  rollbackOEISMigration
} from '../migrations/add-oeis-support.js';

async function runOEISMigrationExample() {
  console.log('='.repeat(60));
  console.log('OEIS Migration Example');
  console.log('='.repeat(60));

  // Create in-memory database
  const db = await createDatabase(':memory:');

  try {
    // Step 1: Check if migration is applied
    console.log('\n📋 Step 1: Check migration status');
    let isApplied = isOEISMigrationApplied(db);
    console.log(`Migration applied: ${isApplied}`);

    // Step 2: Apply migration
    console.log('\n📋 Step 2: Apply OEIS migration');
    await applyOEISMigration(db);

    // Step 3: Verify migration
    console.log('\n📋 Step 3: Verify migration');
    isApplied = isOEISMigrationApplied(db);
    console.log(`Migration applied: ${isApplied}`);

    const info = getOEISMigrationInfo(db);
    console.log(`Migration info:`, info);

    // Step 4: Query some OEIS sequences
    console.log('\n📋 Step 4: Query OEIS sequences');

    // Get Fibonacci sequence
    const fibonacci = db.prepare(`
      SELECT * FROM oeis_sequences WHERE oeis_id = ?
    `).get('A000045');
    console.log('\nFibonacci sequence (A000045):');
    console.log(`  Name: ${fibonacci.name}`);
    console.log(`  Description: ${fibonacci.description}`);
    console.log(`  Values: ${fibonacci.sequence_values}`);
    console.log(`  Formula: ${fibonacci.formula}`);

    // Get all sequences with exponential growth
    const exponential = db.prepare(`
      SELECT oeis_id, name, growth_rate
      FROM oeis_sequences
      WHERE growth_rate = 'exponential'
      LIMIT 5
    `).all();
    console.log('\nExponential growth sequences:');
    exponential.forEach((seq: any) => {
      console.log(`  ${seq.oeis_id}: ${seq.name} (${seq.growth_rate})`);
    });

    // Get prime-related sequences
    const primes = db.prepare(`
      SELECT oeis_id, name
      FROM oeis_sequences
      WHERE name LIKE '%prime%' OR description LIKE '%prime%'
      LIMIT 5
    `).all();
    console.log('\nPrime-related sequences:');
    primes.forEach((seq: any) => {
      console.log(`  ${seq.oeis_id}: ${seq.name}`);
    });

    // Step 5: Test views
    console.log('\n📋 Step 5: Test OEIS views');

    const topSequences = db.prepare(`
      SELECT oeis_id, name, match_count
      FROM oeis_sequences
      ORDER BY match_count DESC
      LIMIT 3
    `).all();
    console.log('\nTop sequences (by match count):');
    topSequences.forEach((seq: any) => {
      console.log(`  ${seq.oeis_id}: ${seq.name} (${seq.match_count} matches)`);
    });

    // Step 6: Create a pattern link example
    console.log('\n📋 Step 6: Simulate pattern detection');

    // First, create a skill (assuming skills table exists)
    try {
      db.exec(`
        INSERT INTO skills (name, description, signature, success_rate, uses, avg_reward, avg_latency_ms)
        VALUES ('fibonacci_predictor', 'Predicts next value using Fibonacci pattern', '{}', 0.95, 10, 0.9, 100)
      `);

      const skillId = db.prepare('SELECT last_insert_rowid() as id').get().id;
      const fibId = db.prepare('SELECT id FROM oeis_sequences WHERE oeis_id = ?').get('A000045').id;

      // Link skill to Fibonacci sequence
      db.prepare(`
        INSERT INTO skill_oeis_links (
          skill_id, oeis_id, link_type, confidence, matched_subsequence,
          pattern_length, match_quality, discovered_by, validation_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        skillId,
        fibId,
        'success_pattern',
        0.95,
        JSON.stringify([1, 1, 2, 3, 5, 8, 13, 21]),
        8,
        0.98,
        'auto',
        'validated'
      );

      console.log('✅ Created skill-OEIS link example');

      // Query the validated skills view
      const validatedSkills = db.prepare(`
        SELECT * FROM oeis_validated_skills LIMIT 1
      `).all();
      console.log('\nValidated skills with OEIS patterns:');
      validatedSkills.forEach((skill: any) => {
        console.log(`  Skill: ${skill.name}`);
        console.log(`  Linked sequences: ${skill.linked_sequences}`);
        console.log(`  Pattern confidence: ${skill.avg_pattern_confidence}`);
      });
    } catch (err) {
      console.log('⚠️  Skills table not available in this example (expected)');
    }

    // Step 7: Test pattern cache
    console.log('\n📋 Step 7: Test pattern cache');

    db.prepare(`
      INSERT INTO pattern_cache (
        query_hash, pattern_values, matched_oeis_ids,
        match_scores, top_match_id, computation_time_ms
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'hash_fibonacci_pattern',
      JSON.stringify([1, 1, 2, 3, 5, 8]),
      JSON.stringify(['A000045']),
      JSON.stringify([0.98]),
      'A000045',
      45
    );

    const cached = db.prepare(`
      SELECT * FROM pattern_cache WHERE query_hash = ?
    `).get('hash_fibonacci_pattern');
    console.log('Cached pattern:');
    console.log(`  Top match: ${cached.top_match_id}`);
    console.log(`  Computation time: ${cached.computation_time_ms}ms`);

    // Step 8: Rollback (optional)
    console.log('\n📋 Step 8: Rollback migration (optional)');
    console.log('Skipping rollback in this example to keep data visible');
    // Uncomment to test rollback:
    // await rollbackOEISMigration(db);
    // console.log('Migration rolled back successfully');

    console.log('\n✅ OEIS migration example completed successfully!');

  } catch (error) {
    console.error('\n❌ Error in OEIS migration example:', (error as Error).message);
    console.error((error as Error).stack);
  } finally {
    db.close();
  }
}

// Run example if executed directly
if (require.main === module) {
  runOEISMigrationExample().catch(console.error);
}

export { runOEISMigrationExample };

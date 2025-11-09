# OEIS Integration for AgentDB

## Overview

The OEIS (Online Encyclopedia of Integer Sequences) integration adds pattern-based skill discovery and validation to AgentDB. This allows agents to recognize mathematical patterns in their behavior and improve performance by learning from proven sequences.

## Features

### 1. Pattern Matching
- Detect mathematical sequences in episode outcomes
- Match agent behaviors against 100+ common OEIS sequences
- Support for multiple pattern types: exact, approximate, trend, derivative

### 2. Skill Validation
- Link skills to validated OEIS sequences
- Track confidence levels for pattern matches
- Measure performance improvements from sequence-based learning

### 3. Performance Caching
- Cache frequently computed pattern matches
- Fast lookup for common sequence patterns
- Automatic cache invalidation with TTL

### 4. Learning Statistics
- Track OEIS integration effectiveness over time
- Monitor pattern detection success rates
- Identify most valuable sequences for agent improvement

## Database Schema

### Tables

#### `oeis_sequences`
Stores OEIS sequence metadata and values for pattern matching.

**Key Fields:**
- `oeis_id` - OEIS identifier (e.g., 'A000045' for Fibonacci)
- `sequence_values` - JSON array of sequence terms
- `growth_rate` - Pattern growth classification
- `match_count` - Usage tracking for popular sequences

#### `skill_oeis_links`
Links agent skills to OEIS sequences for validation.

**Key Fields:**
- `skill_id` - Foreign key to skills table
- `oeis_id` - Foreign key to oeis_sequences
- `link_type` - Type of pattern: success, failure, latency, reward
- `confidence` - Match confidence (0-1)
- `performance_improvement` - Measured improvement

#### `episode_sequence_validations`
Tracks OEIS pattern matches in episode outcomes.

**Key Fields:**
- `episode_id` - Foreign key to episodes
- `detected_pattern` - JSON array of matched values
- `pattern_type` - Match type: exact, approximate, trend
- `match_score` - Quality score (0-1)

#### `pattern_cache`
Performance cache for frequent pattern lookups.

**Key Fields:**
- `query_hash` - Unique pattern identifier
- `matched_oeis_ids` - JSON array of matches
- `hit_count` - Cache usage tracking

### Views

#### `top_oeis_sequences`
Most impactful sequences ranked by:
- Number of skills linked
- Average confidence
- Performance improvement
- Episode matches

#### `oeis_validated_skills`
Skills with validated OEIS patterns, showing:
- Linked sequence IDs
- Pattern confidence
- Performance improvements

#### `recent_oeis_patterns`
Recently discovered patterns (last 7 days)

## Migration Usage

### Apply Migration

```typescript
import { createDatabase, applyOEISMigration } from 'agentdb';

const db = await createDatabase('./my-agent.db');
await applyOEISMigration(db);
```

### Check Migration Status

```typescript
import { isOEISMigrationApplied, getOEISMigrationInfo } from 'agentdb';

// Simple check
const applied = isOEISMigrationApplied(db);
console.log('OEIS tables exist:', applied);

// Detailed info
const info = getOEISMigrationInfo(db);
console.log('Sequences loaded:', info.sequenceCount);
console.log('Active links:', info.linkCount);
console.log('Validations:', info.validationCount);
```

### Rollback Migration

```typescript
import { rollbackOEISMigration } from 'agentdb';

// Remove all OEIS tables and data
await rollbackOEISMigration(db);
```

## Seeded Sequences

The migration seeds 100 common OEIS sequences, including:

### Fundamental Sequences
- **A000045** - Fibonacci numbers
- **A000040** - Prime numbers
- **A000142** - Factorial numbers
- **A000217** - Triangular numbers
- **A000290** - Perfect squares

### Powers
- **A000079** - Powers of 2
- **A000244** - Powers of 3
- **A000302** - Powers of 4

### Combinatorial
- **A000108** - Catalan numbers
- **A000110** - Bell numbers
- **A000041** - Partition function

### Number Theory
- **A000010** - Euler totient function
- **A000005** - Divisor function
- **A000203** - Sum of divisors

### Special Sequences
- **A000796** - Digits of π
- **A001113** - Digits of e
- **A001620** - Euler-Mascheroni constant γ

## Usage Examples

### 1. Link Skill to Sequence

```typescript
db.prepare(`
  INSERT INTO skill_oeis_links (
    skill_id, oeis_id, link_type, confidence,
    matched_subsequence, pattern_length, match_quality,
    discovered_by, validation_status
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`).run(
  skillId,
  oeisId,
  'success_pattern',
  0.95,
  JSON.stringify([1, 1, 2, 3, 5, 8]),
  6,
  0.98,
  'auto',
  'validated'
);
```

### 2. Query Fibonacci Pattern

```typescript
const fibonacci = db.prepare(`
  SELECT * FROM oeis_sequences WHERE oeis_id = 'A000045'
`).get();

console.log('Fibonacci values:', JSON.parse(fibonacci.sequence_values));
```

### 3. Find Exponential Growth Sequences

```typescript
const exponential = db.prepare(`
  SELECT oeis_id, name, growth_rate
  FROM oeis_sequences
  WHERE growth_rate = 'exponential'
  ORDER BY match_count DESC
  LIMIT 10
`).all();
```

### 4. Validate Episode Pattern

```typescript
db.prepare(`
  INSERT INTO episode_sequence_validations (
    episode_id, oeis_id, detected_pattern,
    pattern_type, match_score, metric_type
  ) VALUES (?, ?, ?, ?, ?, ?)
`).run(
  episodeId,
  oeisId,
  JSON.stringify([2, 4, 8, 16, 32]),
  'exact',
  0.98,
  'reward'
);
```

### 5. Check Top Sequences

```typescript
const topSequences = db.prepare(`
  SELECT * FROM top_oeis_sequences LIMIT 5
`).all();

topSequences.forEach(seq => {
  console.log(`${seq.oeis_id}: ${seq.name}`);
  console.log(`  Skills linked: ${seq.skills_linked}`);
  console.log(`  Avg improvement: ${seq.avg_improvement}`);
});
```

## Performance Considerations

### Indexing
All tables have appropriate indexes for:
- Foreign key lookups
- Pattern searches
- Time-based queries
- Confidence/quality filtering

### Caching
Pattern cache provides:
- O(1) lookup for cached patterns
- Automatic TTL-based invalidation
- Hit count tracking for optimization

### Growth Rates
Sequences are classified by growth rate for efficient filtering:
- `constant` - Fixed values
- `linear` - Linear growth
- `polynomial` - Polynomial growth
- `exponential` - Exponential growth
- `factorial` - Factorial growth
- `logarithmic` - Logarithmic growth

## Integration with Existing Features

### ReflexionMemory
Episode patterns can be matched against OEIS sequences to identify:
- Success trajectories following known patterns
- Optimal reward sequences
- Latency optimization patterns

### SkillLibrary
Skills can be:
- Validated against mathematical patterns
- Improved using sequence insights
- Scored based on pattern adherence

### LearningSystem
Reinforcement learning can leverage:
- Sequence-based reward shaping
- Pattern-guided exploration
- Mathematical optimization strategies

## Best Practices

1. **Start with Common Sequences**
   - The migration includes 100 fundamental sequences
   - Focus on Fibonacci, powers, and factorial patterns first

2. **Validate Patterns**
   - Set confidence thresholds (>0.7 recommended)
   - Verify performance improvements before accepting patterns

3. **Cache Aggressively**
   - Use pattern cache for frequent lookups
   - Set appropriate TTLs based on pattern stability

4. **Monitor Learning Stats**
   - Track effectiveness with `oeis_learning_stats` table
   - Adjust pattern detection thresholds based on results

5. **Clean Up Periodically**
   - Remove low-confidence links
   - Prune expired cache entries
   - Archive old validations

## Troubleshooting

### Migration Fails
```typescript
// Check if already applied
if (isOEISMigrationApplied(db)) {
  console.log('Migration already applied');
}

// Check for errors
try {
  await applyOEISMigration(db);
} catch (error) {
  console.error('Migration error:', error);
}
```

### Pattern Not Matching
```typescript
// Check sequence exists
const seq = db.prepare(`
  SELECT * FROM oeis_sequences WHERE oeis_id = ?
`).get('A000045');

if (!seq) {
  console.log('Sequence not found in database');
}

// Check pattern length
const values = JSON.parse(seq.sequence_values);
console.log('Available terms:', values.length);
```

### Performance Issues
```typescript
// Check cache hit rate
const stats = db.prepare(`
  SELECT * FROM pattern_cache_stats
`).get();

console.log('Cache hit rate:', stats.avg_hits_per_entry);
console.log('Expired entries:', stats.expired_entries);

// Clean up if needed
db.exec(`
  DELETE FROM pattern_cache
  WHERE expires_at < strftime('%s', 'now')
  AND hit_count < 5
`);
```

## Future Enhancements

### Planned Features
1. **Real-time OEIS API integration**
   - Fetch sequences on-demand
   - Update existing sequences
   - Discover new patterns

2. **Advanced pattern matching**
   - Fuzzy matching with tolerance
   - Multi-sequence composition
   - Transformation detection

3. **Machine learning integration**
   - Neural pattern recognition
   - Sequence prediction
   - Automated pattern discovery

4. **Performance optimizations**
   - Bloom filters for quick rejection
   - SIMD-accelerated matching
   - Distributed pattern search

## References

- [OEIS Official Website](https://oeis.org/)
- [OEIS Wiki](https://oeis.org/wiki/Main_Page)
- [Sequence Recognition Algorithms](https://oeis.org/wiki/Sequence_recognition)
- [AgentDB Documentation](../README.md)

## License

Same as AgentDB - MIT License

## Contributing

See main AgentDB contributing guidelines. OEIS integration contributions welcome!

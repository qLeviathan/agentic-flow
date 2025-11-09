# OEIS Integration Documentation

## Overview

AgentDB now includes comprehensive OEIS (Online Encyclopedia of Integer Sequences) validation integrated with the existing memory systems. This allows automatic detection, validation, and tracking of numeric sequences in skills and episodes.

## Features

### 1. Input Validation (`security/input-validation.ts`)

New validation functions for sequence handling:

- **`validateSequence(sequence, options)`** - Validates numeric sequences with configurable constraints
- **`validateSequencePattern(pattern)`** - Validates OEIS pattern objects
- **`extractSequencesFromText(text, options)`** - Detects numeric sequences in text output
- **`calculateSequenceSimilarity(seq1, seq2)`** - Computes similarity scores between sequences
- **`detectSequencePattern(sequence)`** - Identifies common mathematical patterns (arithmetic, geometric, Fibonacci, powers)

### 2. SkillLibrary Extensions (`controllers/SkillLibrary.ts`)

New methods for skill-level OEIS integration:

- **`detectOEISPatterns(skill)`** - Analyzes skill code, description, and signatures for numeric sequences
- **`linkSkillToOEISPattern(skillId, pattern)`** - Stores OEIS metadata in skill metadata
- **`getSkillsWithSequencePattern(targetSequence, options)`** - Finds skills that generate specific sequences
- **`autoDetectOEISPatterns(options)`** - Batch process to detect patterns across all skills
- **`getOEISPatternStats()`** - Returns statistics about OEIS patterns in the skill library

### 3. ReflexionMemory Extensions (`controllers/ReflexionMemory.ts`)

New methods for episode-level sequence validation:

- **`validateEpisodeSequences(episode)`** - Validates sequences in episode outputs and critiques
- **`storeEpisodeWithValidation(episode)`** - Stores episode with automatic sequence validation
- **`getEpisodesWithOeisMatch(targetSequence, options)`** - Finds episodes with matching sequences
- **`getSequenceStats(options)`** - Returns sequence statistics across episodes
- **`batchValidateSequences(options)`** - Retroactively validates existing episodes

## Usage Examples

### Basic Sequence Validation

```typescript
import { validateSequence, detectSequencePattern } from 'agentdb';

// Validate a Fibonacci sequence
const fibonacci = validateSequence([1, 1, 2, 3, 5, 8, 13], {
  minLength: 3,
  maxLength: 100,
  allowNegative: false,
  allowFloats: false
});

// Detect pattern type
const pattern = detectSequencePattern(fibonacci);
// Returns: { type: 'fibonacci', confidence: 1.0, description: '...' }
```

### Extract Sequences from Text

```typescript
import { extractSequencesFromText } from 'agentdb';

const output = "The results are: 1, 2, 4, 8, 16, 32";
const sequences = extractSequencesFromText(output, {
  minLength: 3,
  maxLength: 20
});
// Returns: [[1, 2, 4, 8, 16, 32]]
```

### Skill Library Integration

```typescript
import { SkillLibrary, createDatabase, EmbeddingService } from 'agentdb';

const db = createDatabase(':memory:');
const embedder = new EmbeddingService({ model: 'default' });
const skillLib = new SkillLibrary(db, embedder);

// Detect OEIS patterns in a skill
const skill = {
  name: 'fibonacci-generator',
  description: 'Generates Fibonacci sequence: 1, 1, 2, 3, 5, 8',
  signature: { inputs: {}, outputs: { sequence: 'number[]' } },
  code: 'return [1, 1, 2, 3, 5, 8, 13];',
  successRate: 0.95,
  uses: 10,
  avgReward: 0.9,
  avgLatencyMs: 50
};

const skillId = await skillLib.createSkill(skill);
const patterns = await skillLib.detectOEISPatterns(skill);
// Returns: [{ sequence: [1,1,2,3,5,8], confidence: 1.0, source: 'description' }]

// Link patterns to skill
for (const pattern of patterns) {
  skillLib.linkSkillToOEISPattern(skillId, pattern);
}

// Find skills by sequence
const fibonacciSkills = skillLib.getSkillsWithSequencePattern([1, 1, 2, 3, 5], {
  minSimilarity: 0.8,
  minSuccessRate: 0.7,
  limit: 10
});
```

### Episode Validation

```typescript
import { ReflexionMemory, createDatabase, EmbeddingService } from 'agentdb';

const db = createDatabase(':memory:');
const embedder = new EmbeddingService({ model: 'default' });
const memory = new ReflexionMemory(db, embedder);

// Store episode with automatic validation
const episode = {
  sessionId: 'session-123',
  task: 'generate-prime-numbers',
  output: 'Prime numbers: 2, 3, 5, 7, 11, 13, 17',
  reward: 0.95,
  success: true
};

const result = await memory.storeEpisodeWithValidation(episode);
// Returns: {
//   episodeId: 1,
//   validation: {
//     hasSequences: true,
//     patterns: [{ sequence: [2,3,5,7,11,13,17], ... }],
//     validated: true
//   }
// }

// Find episodes with similar sequences
const primeEpisodes = memory.getEpisodesWithOeisMatch([2, 3, 5, 7, 11], {
  minSimilarity: 0.8,
  onlySuccesses: true,
  limit: 5
});
```

### Batch Processing

```typescript
// Auto-detect patterns across all skills
const skillStats = await skillLib.autoDetectOEISPatterns({
  minSuccessRate: 0.6,
  batchSize: 100
});
// Returns: { processed: 100, patternsFound: 45, skillsUpdated: 32 }

// Batch validate existing episodes
const episodeStats = await memory.batchValidateSequences({
  batchSize: 100,
  minReward: 0.5,
  onlySuccesses: true
});
// Returns: { processed: 100, validated: 87, sequencesFound: 23, errors: 0 }
```

### Statistics and Analytics

```typescript
// Get skill library OEIS statistics
const skillStats = skillLib.getOEISPatternStats();
// Returns: {
//   totalSkills: 150,
//   skillsWithPatterns: 45,
//   totalPatterns: 67,
//   patternsByType: { fibonacci: 12, arithmetic: 23, geometric: 8 },
//   topSequences: [...]
// }

// Get episode sequence statistics
const episodeStats = memory.getSequenceStats({
  onlySuccesses: true,
  minReward: 0.7
});
// Returns: {
//   totalEpisodes: 500,
//   episodesWithSequences: 78,
//   totalSequences: 134,
//   patternsByType: { ... },
//   averageConfidence: 0.87,
//   topSequences: [...]
// }
```

## Pattern Types

The system automatically detects these sequence patterns:

- **Arithmetic** - Constant difference (e.g., 2, 4, 6, 8)
- **Geometric** - Constant ratio (e.g., 2, 4, 8, 16)
- **Fibonacci** - Each term is sum of previous two (e.g., 1, 1, 2, 3, 5, 8)
- **Power-2** - Squares (e.g., 1, 4, 9, 16)
- **Power-3** - Cubes (e.g., 1, 8, 27, 64)
- **Power-4, Power-5** - Higher powers

## Metadata Structure

### Skill Metadata

When OEIS patterns are detected in skills:

```json
{
  "oeisPatterns": [
    {
      "sequence": [1, 1, 2, 3, 5, 8],
      "confidence": 1.0,
      "source": "code-analysis",
      "detectedAt": 1699123456789,
      "metadata": {
        "patternType": "fibonacci",
        "description": "Fibonacci-like sequence",
        "skillId": 123,
        "skillName": "fibonacci-generator"
      }
    }
  ],
  "hasOEISPatterns": true,
  "lastOEISUpdate": 1699123456789
}
```

### Episode Metadata

When sequences are validated in episodes:

```json
{
  "sequenceValidation": {
    "hasSequences": true,
    "sequenceCount": 2,
    "validated": true,
    "validationErrors": []
  },
  "oeisPatterns": [
    {
      "sequence": [2, 3, 5, 7, 11],
      "confidence": 0.85,
      "source": "episode-output",
      "metadata": {
        "episodeId": 456,
        "sessionId": "session-123",
        "task": "generate-primes",
        "patternType": "unknown",
        "reward": 0.95,
        "success": true
      }
    }
  ]
}
```

## Backward Compatibility

All OEIS functionality is **fully backward compatible**:

- Existing skills and episodes work without modification
- OEIS metadata is stored in existing `metadata` JSON fields
- New methods are additive and don't modify existing APIs
- All validation is opt-in via new methods

## Performance Considerations

- Sequence extraction uses optimized regex patterns
- Pattern detection is O(n) where n is sequence length
- Similarity calculation is O(min(n,m)) for sequences of length n and m
- Batch operations process in single database transactions
- Metadata stored as JSON for flexible querying

## Security

All sequence validation uses the existing security framework:

- Input validation prevents injection attacks
- Sequences limited to reasonable sizes (default max: 100 elements)
- Value ranges validated (default max: Number.MAX_SAFE_INTEGER)
- Error messages don't leak sensitive information

## Best Practices

1. **Enable automatic validation** for new episodes:
   ```typescript
   await memory.storeEpisodeWithValidation(episode);
   ```

2. **Run batch validation** periodically for historical data:
   ```typescript
   await skillLib.autoDetectOEISPatterns({ minSuccessRate: 0.6 });
   await memory.batchValidateSequences({ minReward: 0.5 });
   ```

3. **Use sequence search** to find similar patterns:
   ```typescript
   const skills = skillLib.getSkillsWithSequencePattern(targetSeq);
   const episodes = memory.getEpisodesWithOeisMatch(targetSeq);
   ```

4. **Monitor statistics** to understand pattern distribution:
   ```typescript
   const stats = skillLib.getOEISPatternStats();
   console.log(`${stats.skillsWithPatterns} skills have OEIS patterns`);
   ```

## Future Enhancements

Potential future improvements:

- Integration with OEIS.org API for sequence lookup
- Machine learning for custom pattern detection
- Cross-referencing sequences between skills and episodes
- Sequence prediction and generation
- Advanced pattern matching algorithms

## References

- [OEIS (Online Encyclopedia of Integer Sequences)](https://oeis.org)
- [AgentDB Documentation](../README.md)
- [ReflexionMemory API](./reflexion-memory.md)
- [SkillLibrary API](./skill-library.md)

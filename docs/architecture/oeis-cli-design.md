# OEIS CLI Command Design

## Overview

This document specifies the command-line interface for OEIS mathematical validation integration. All commands follow the pattern: `npx claude-flow oeis <command> [options]`

## Command Structure

```
npx claude-flow oeis
├── validate              # Validation commands
│   ├── <terms>          # Validate sequence terms
│   └── episode          # Validate episode output
├── search               # Search commands
│   ├── <terms>          # Search by terms
│   ├── keyword          # Search by keyword
│   └── name             # Search by name
├── link                 # Linking commands
│   ├── <skill> <seq>    # Manual link
│   └── auto             # Auto-link skill
├── pattern              # Pattern commands
│   ├── detect           # Detect patterns
│   └── match            # Match pattern
├── cache                # Cache management
│   ├── stats            # Cache statistics
│   └── clear            # Clear cache
├── sync                 # Sync commands
│   └── popular          # Sync popular sequences
└── analyze              # Analysis commands
    ├── skill            # Analyze skill
    ├── episode          # Analyze episode
    └── patterns         # Top patterns
```

## 1. Validation Commands

### 1.1 Validate Sequence

**Command:**
```bash
npx claude-flow oeis validate "1,1,2,3,5,8,13,21"
```

**Options:**
- `--min-confidence <value>` - Minimum confidence threshold (0.0-1.0, default: 0.7)
- `--max-results <n>` - Maximum results to return (default: 10)
- `--include-partial` - Include partial matches
- `--json` - Output as JSON
- `--verbose` - Show detailed match information

**Output:**
```
✓ Found 3 matches for sequence

Match 1: A000045 - Fibonacci numbers (confidence: 0.98)
  Type: exact
  Matched terms: [1,1,2,3,5,8,13,21]
  Formula: F(n) = F(n-1) + F(n-2) with F(0)=0, F(1)=1

Match 2: A000071 - Fibonacci minus 1 (confidence: 0.85)
  Type: pattern
  Matched terms: [1,2,3,5,8,13,21]

Pattern detected: Recursive (Fibonacci-like)
  Formula: a(n) = a(n-1) + a(n-2)
  Confidence: 0.95
```

### 1.2 Validate Episode

**Command:**
```bash
npx claude-flow oeis validate episode 12345
```

**Options:**
- `--auto-link` - Automatically link to skills
- `--store` - Store validation results
- `--min-confidence <value>` - Minimum confidence (default: 0.7)

**Output:**
```
Episode #12345: "Generate Fibonacci sequence"

Extracted sequences:
1. [1,1,2,3,5,8,13,21,34] (9 terms)

Validation results:
✓ Match: A000045 - Fibonacci numbers (0.98)
✓ Pattern: Recursive relation detected

Impact assessment:
- Improvement score: +0.15
- Confidence boost: +0.10

Auto-linking:
✓ Linked skill #678 "fibonacci_generator" to A000045
```

## 2. Search Commands

### 2.1 Search by Terms

**Command:**
```bash
npx claude-flow oeis search "2,3,5,7,11,13"
```

**Options:**
- `--limit <n>` - Maximum results (default: 10)
- `--cached-only` - Search only cached sequences
- `--json` - Output as JSON

**Output:**
```
Found 2 matches:

1. A000040 - Prime numbers
   Terms: 2,3,5,7,11,13,17,19,23,29,31,...
   Keywords: nonn, easy, core
   Author: N. J. A. Sloane

2. A008578 - Prime numbers beginning with 2
   Terms: 2,3,5,7,11,13,17,19,23,29,31,...
   Keywords: nonn, easy
```

### 2.2 Search by Keyword

**Command:**
```bash
npx claude-flow oeis search keyword "fibonacci"
```

**Options:**
- `--limit <n>` - Maximum results (default: 10)

**Output:**
```
Found 87 sequences with keyword "fibonacci":

1. A000045 - Fibonacci numbers
2. A000071 - Fibonacci numbers minus 1
3. A001611 - Fibonacci numbers squared
...
```

### 2.3 Search by Name

**Command:**
```bash
npx claude-flow oeis search name "prime"
```

**Options:**
- `--limit <n>` - Maximum results (default: 10)
- `--exact` - Exact name match only

## 3. Linking Commands

### 3.1 Manual Link

**Command:**
```bash
npx claude-flow oeis link 123 A000045 --relationship produces
```

**Arguments:**
- `<skill-id>` - Skill ID to link
- `<oeis-id>` - OEIS sequence ID (e.g., A000045)

**Options:**
- `--relationship <type>` - Relationship type: produces, uses, validates_with, similar_to (default: similar_to)
- `--confidence <value>` - Confidence score (0.0-1.0, default: 0.8)
- `--match-type <type>` - Match type: exact, subsequence, pattern, semantic

**Output:**
```
✓ Linked skill #123 "fibonacci_generator" to A000045
  Relationship: produces
  Confidence: 0.95
  Match type: exact
```

### 3.2 Auto-Link Skill

**Command:**
```bash
npx claude-flow oeis link auto 123
```

**Options:**
- `--min-confidence <value>` - Minimum confidence for auto-linking (default: 0.7)
- `--max-links <n>` - Maximum links to create (default: 5)
- `--dry-run` - Show what would be linked without creating links

**Output:**
```
Analyzing skill #123 "fibonacci_generator"...

Found 3 potential links:

1. A000045 - Fibonacci numbers (0.95)
   Relationship: produces
   Match type: exact

2. A001611 - Fibonacci squared (0.78)
   Relationship: similar_to
   Match type: pattern

3. A000071 - Fibonacci minus 1 (0.72)
   Relationship: similar_to
   Match type: pattern

✓ Created 3 links for skill #123
```

## 4. Pattern Commands

### 4.1 Detect Pattern

**Command:**
```bash
npx claude-flow oeis pattern detect "1,4,9,16,25,36"
```

**Options:**
- `--types <types>` - Pattern types to check: arithmetic, geometric, recursive, polynomial, custom (comma-separated)
- `--json` - Output as JSON

**Output:**
```
Pattern detected: polynomial
  Type: polynomial (degree 2)
  Signature: a(n) = n^2
  Formula: a(n) = 1*n^2 + 0*n + 0
  Confidence: 0.98

Related OEIS sequences:
- A000290 - Perfect squares
- A001107 - 10-gonal numbers
```

### 4.2 Match Pattern

**Command:**
```bash
npx claude-flow oeis pattern match 42 "1,4,9,16,25"
```

**Arguments:**
- `<pattern-id>` - Pattern ID from database
- `<terms>` - Terms to match against

**Output:**
```
Pattern #42: polynomial (a(n) = n^2)

Match result: ✓ Success
  Confidence: 0.98
  Matched terms: [1,4,9,16,25]
  Predicted next: [36,49,64,81,100]
```

## 5. Cache Management Commands

### 5.1 Cache Statistics

**Command:**
```bash
npx claude-flow oeis cache stats
```

**Options:**
- `--detailed` - Show detailed breakdown
- `--json` - Output as JSON

**Output:**
```
OEIS Cache Statistics:

L1 Cache (In-Memory LRU):
  Size: 847 / 1000 entries
  Hit rate: 67.3%
  Avg age: 3.2 minutes
  Memory: ~12.4 MB

L2 Cache (SQLite):
  Sequences: 4,521 entries
  Search cache: 1,238 entries
  Hit rate: 82.1%
  Avg age: 2.3 days
  Size: 45.7 MB

Overall:
  Combined hit rate: 91.2%
  API calls saved: 8,947
  Bandwidth saved: ~134 MB

Most accessed:
1. A000045 - Fibonacci (342 hits)
2. A000040 - Primes (287 hits)
3. A000290 - Squares (198 hits)
```

### 5.2 Clear Cache

**Command:**
```bash
npx claude-flow oeis cache clear
```

**Options:**
- `--older-than <duration>` - Clear entries older than duration (e.g., 7d, 30d, 60d)
- `--l1-only` - Clear only L1 cache
- `--l2-only` - Clear only L2 cache
- `--unused` - Clear unused entries only
- `--force` - Skip confirmation

**Output:**
```
Clearing OEIS cache (entries older than 7 days)...

L1 Cache: Cleared 234 entries
L2 Cache: Cleared 891 entries
Search cache: Cleared 156 entries

Total freed: 23.4 MB

✓ Cache cleared successfully
```

## 6. Sync Commands

### 6.1 Sync Popular Sequences

**Command:**
```bash
npx claude-flow oeis sync popular
```

**Options:**
- `--limit <n>` - Number of sequences to sync (default: 1000)
- `--update-existing` - Update existing cached sequences
- `--categories <list>` - Specific categories to sync (comma-separated)

**Output:**
```
Syncing popular OEIS sequences...

Categories:
- Core sequences (50)
- Number theory (200)
- Combinatorics (150)
- Geometry (100)
- ...

Progress: [████████████████████] 100% (1000/1000)

✓ Synced 1000 sequences
✓ Updated 234 existing sequences
✓ Created embeddings for 766 new sequences

Time: 2m 34s
Cache size: +48.2 MB
```

## 7. Analysis Commands

### 7.1 Analyze Skill

**Command:**
```bash
npx claude-flow oeis analyze skill 123
```

**Options:**
- `--detailed` - Show detailed analysis
- `--json` - Output as JSON

**Output:**
```
Skill #123: "fibonacci_generator"
Success rate: 89.2%
Uses: 45

Mathematical Profile:
  Linked sequences: 3
  Related patterns: 2
  Avg link confidence: 0.87

OEIS Links:
1. A000045 - Fibonacci numbers (0.95, produces)
   Last used: 2 hours ago
   Use count: 23

2. A001611 - Fibonacci squared (0.78, similar_to)
   Last used: 1 day ago
   Use count: 8

Patterns:
1. Recursive (Fibonacci-like) - Confidence: 0.92
2. Exponential growth - Confidence: 0.73

Validation History:
  Total validations: 45
  Successful: 42 (93.3%)
  Avg confidence: 0.91

Suggestions:
- Consider linking to A000071 (Fibonacci minus 1)
- Pattern matches with golden ratio sequences
```

### 7.2 Analyze Episode

**Command:**
```bash
npx claude-flow oeis analyze episode 12345
```

**Options:**
- `--show-sequences` - Show extracted sequences
- `--json` - Output as JSON

**Output:**
```
Episode #12345: "Generate Fibonacci sequence"
Task: fibonacci generation
Reward: 0.89
Success: ✓

Extracted Sequences:
1. [1,1,2,3,5,8,13,21,34,55] (10 terms)

Validations:
✓ A000045 - Fibonacci (0.98, exact match)
  Impact: +0.15 quality improvement

Patterns:
✓ Recursive (Fibonacci-like) - 0.95

Mathematical Quality:
  Sequence correctness: 98%
  Pattern consistency: 95%
  Formula adherence: 92%

Overall OEIS score: 95/100 (Excellent)
```

### 7.3 Top Patterns

**Command:**
```bash
npx claude-flow oeis analyze patterns
```

**Options:**
- `--limit <n>` - Number of patterns to show (default: 20)
- `--type <type>` - Filter by pattern type
- `--min-confidence <value>` - Minimum confidence (default: 0.7)

**Output:**
```
Top Mathematical Patterns (by usage):

1. Arithmetic progression (a(n) = a + d*n)
   Occurrences: 234
   Avg confidence: 0.94
   Success rate: 96.2%
   Related sequences: 12

2. Fibonacci-like recursive (a(n) = a(n-1) + a(n-2))
   Occurrences: 156
   Avg confidence: 0.91
   Success rate: 93.8%
   Related sequences: 8

3. Polynomial (degree 2)
   Occurrences: 98
   Avg confidence: 0.87
   Success rate: 89.4%
   Related sequences: 15

...

Pattern Statistics:
  Total patterns: 567
  High quality (>0.8): 423 (74.6%)
  Active (used in last 7d): 89 (15.7%)
```

## 8. Global Options

All commands support these global options:

- `--help, -h` - Show command help
- `--version, -v` - Show version
- `--json` - Output as JSON
- `--verbose` - Verbose output
- `--quiet` - Minimal output
- `--db <path>` - Database path (default: ./agentdb.sqlite)
- `--no-color` - Disable colored output

## 9. Configuration File

Create `.oeisrc.json` in project root:

```json
{
  "api": {
    "requestsPerSecond": 3,
    "timeout": 10000,
    "maxRetries": 3
  },
  "cache": {
    "l1": {
      "size": 1000,
      "ttl": 300000
    },
    "l2": {
      "ttl": 604800000
    }
  },
  "validation": {
    "minConfidence": 0.7,
    "maxResults": 10,
    "includePartial": false
  },
  "patterns": {
    "types": ["arithmetic", "geometric", "recursive", "polynomial"],
    "minConfidence": 0.7
  }
}
```

## 10. Exit Codes

- `0` - Success
- `1` - General error
- `2` - Invalid arguments
- `3` - Database error
- `4` - Network error
- `5` - Rate limit exceeded
- `6` - Validation failed

## 11. Examples

### Complete Workflow Example

```bash
# 1. Sync popular sequences
npx claude-flow oeis sync popular --limit 500

# 2. Validate a sequence
npx claude-flow oeis validate "1,1,2,3,5,8" --min-confidence 0.8

# 3. Link to skill
npx claude-flow oeis link auto 123 --min-confidence 0.7

# 4. Analyze results
npx claude-flow oeis analyze skill 123 --detailed

# 5. Check cache performance
npx claude-flow oeis cache stats

# 6. Find patterns
npx claude-flow oeis pattern detect "1,4,9,16,25,36"
```

### JSON Output Example

```bash
npx claude-flow oeis validate "1,1,2,3,5,8" --json
```

```json
{
  "success": true,
  "matches": [
    {
      "sequence": {
        "oeisId": "A000045",
        "name": "Fibonacci numbers",
        "terms": [0,1,1,2,3,5,8,13,21,34]
      },
      "confidence": 0.98,
      "matchType": "exact",
      "matchedTerms": [1,1,2,3,5,8],
      "matchIndices": [2,3,4,5,6,7]
    }
  ],
  "patterns": [
    {
      "patternType": "recursive",
      "patternSignature": "a(n) = a(n-1) + a(n-2)",
      "confidence": 0.95
    }
  ],
  "confidence": 0.98
}
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-09
**Status**: Complete - Ready for Implementation

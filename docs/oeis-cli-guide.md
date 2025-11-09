# OEIS CLI - Comprehensive Guide

The OEIS CLI provides powerful sequence validation and pattern detection capabilities by integrating with the Online Encyclopedia of Integer Sequences (OEIS).

## 🚀 Quick Start

```bash
# Validate the Fibonacci sequence
npx agentic-flow oeis validate 1,1,2,3,5,8,13,21

# Search for prime-related sequences
npx agentic-flow oeis search "prime numbers"

# Detect patterns in a sequence
npx agentic-flow oeis pattern 1,4,9,16,25,36

# Show help
npx agentic-flow oeis help
```

## 📋 Available Commands

### 1. Validate Sequence

Validates a sequence against the OEIS database.

```bash
npx agentic-flow oeis validate <sequence>
```

**Examples:**

```bash
# Validate Fibonacci sequence
npx agentic-flow oeis validate 1,1,2,3,5,8,13,21,34,55

# Validate with quoted sequence
npx agentic-flow oeis validate "0,1,1,2,3,5,8,13,21,34"

# Validate prime numbers
npx agentic-flow oeis validate 2,3,5,7,11,13,17,19

# Validate factorial sequence
npx agentic-flow oeis validate 1,1,2,6,24,120,720
```

**Output includes:**
- OEIS ID (e.g., A000045)
- Confidence score (0-100%)
- Match type (exact, partial, pattern, formula)
- Sequence name and description
- Mathematical formula (if applicable)
- URL to OEIS page
- Match statistics

### 2. Search OEIS

Search the OEIS database by keyword or sequence values.

```bash
npx agentic-flow oeis search <terms>
```

**Examples:**

```bash
# Search by keyword
npx agentic-flow oeis search fibonacci
npx agentic-flow oeis search "prime numbers"
npx agentic-flow oeis search catalan

# Search by sequence values
npx agentic-flow oeis search 2,3,5,7,11,13
npx agentic-flow oeis search 1,4,9,16,25
```

**Output includes:**
- Up to 10 matching sequences
- OEIS IDs
- Sequence names
- First terms
- Mathematical formulas
- Keywords
- Direct links to OEIS

### 3. Pattern Detection

Detect mathematical patterns in a sequence without OEIS lookup.

```bash
npx agentic-flow oeis pattern <sequence>
```

**Examples:**

```bash
# Detect pattern in squares
npx agentic-flow oeis pattern 1,4,9,16,25,36,49

# Detect pattern in powers of 2
npx agentic-flow oeis pattern 2,4,8,16,32,64

# Detect Fibonacci pattern
npx agentic-flow oeis pattern 1,1,2,3,5,8,13

# Detect triangular numbers
npx agentic-flow oeis pattern 1,3,6,10,15,21
```

**Detected patterns include:**
- Fibonacci numbers
- Prime numbers
- Factorials
- Perfect squares (n²)
- Perfect cubes (n³)
- Powers of 2, 3
- Triangular numbers
- Even/odd numbers
- Catalan numbers
- Arithmetic/geometric progressions
- Composite numbers

### 4. Link Skill to OEIS

Link a skill to a specific OEIS sequence for tracking and validation.

```bash
npx agentic-flow oeis link <skill-id> <oeis-id>
```

**Examples:**

```bash
# Link Fibonacci generator to A000045
npx agentic-flow oeis link fibonacci-generator A000045

# Link prime checker to prime sequence
npx agentic-flow oeis link prime-validator A000040

# Link factorial calculator
npx agentic-flow oeis link factorial-calc A000142
```

**Benefits:**
- Track which skills produce which sequences
- Validate skill output automatically
- Build skill libraries based on mathematical patterns
- Document skill capabilities

### 5. Analyze Skill

Analyze a skill's output for OEIS patterns.

```bash
npx agentic-flow oeis analyze <skill-id>
```

**Example:**

```bash
npx agentic-flow oeis analyze sequence-generator
```

**Note:** This command provides guidance on integrating with AgentDB skill library for full analysis.

### 6. Statistics

Show OEIS usage statistics and cache information.

```bash
npx agentic-flow oeis stats
```

**Output includes:**
- Total cached sequences
- Memory cache size
- Disk cache size
- Most accessed sequences
- Hit counts

### 7. Cache Management

Manage the OEIS sequence cache.

```bash
npx agentic-flow oeis cache [command]
```

**Commands:**

```bash
# Show cache statistics
npx agentic-flow oeis cache stats

# Clear all cached data
npx agentic-flow oeis cache clear
```

## 🎯 Popular OEIS Sequences

Here are some commonly used OEIS sequences:

| OEIS ID | Name | Formula | Example Terms |
|---------|------|---------|---------------|
| A000045 | Fibonacci | F(n) = F(n-1) + F(n-2) | 0,1,1,2,3,5,8,13,21 |
| A000040 | Primes | Prime numbers | 2,3,5,7,11,13,17,19 |
| A000142 | Factorials | n! | 1,1,2,6,24,120,720 |
| A000290 | Squares | n² | 0,1,4,9,16,25,36,49 |
| A000578 | Cubes | n³ | 0,1,8,27,64,125,216 |
| A000079 | Powers of 2 | 2^n | 1,2,4,8,16,32,64 |
| A000217 | Triangular | n(n+1)/2 | 0,1,3,6,10,15,21 |
| A000108 | Catalan | C(n) = (2n)!/(n+1)!n! | 1,1,2,5,14,42,132 |
| A005843 | Even numbers | 2n | 0,2,4,6,8,10,12 |
| A005408 | Odd numbers | 2n+1 | 1,3,5,7,9,11,13 |

## 🔧 Configuration

### Environment Variables

```bash
# Set custom cache database path
export OEIS_CACHE_PATH=/path/to/oeis-cache.db

# Default: ./oeis-cache.db
```

### Cache Configuration

The OEIS CLI automatically caches:
- Popular sequences for fast validation
- Recently accessed sequences
- Search results

Cache features:
- **TTL**: 24 hours (configurable)
- **Max size**: 10,000 sequences
- **Storage**: SQLite database
- **Preloading**: Popular sequences loaded on first run

## 📊 Integration with AgentDB

The OEIS CLI works seamlessly with AgentDB for comprehensive skill management:

### Workflow Example

```bash
# 1. Create a skill with AgentDB
npx agentdb skill create "fibonacci" "Generate Fibonacci numbers"

# 2. Test the skill and capture output
# (skill outputs: 1,1,2,3,5,8,13,21)

# 3. Validate the output
npx agentic-flow oeis validate 1,1,2,3,5,8,13,21

# 4. Link the skill to the validated sequence
npx agentic-flow oeis link fibonacci A000045

# 5. View skill statistics
npx agentdb skill search fibonacci
```

### Database Integration

OEIS validation results can be stored in AgentDB's frontier memory features:

- **Episode validation**: Link episodes to OEIS sequences
- **Skill linking**: Associate skills with validated sequences
- **Pattern discovery**: Automatically identify mathematical patterns
- **Success tracking**: Monitor validation confidence over time

## 🎓 Advanced Usage

### Batch Validation

Create a script to validate multiple sequences:

```bash
#!/bin/bash

sequences=(
  "1,1,2,3,5,8,13,21"
  "2,3,5,7,11,13,17"
  "1,4,9,16,25,36"
)

for seq in "${sequences[@]}"; do
  echo "Validating: $seq"
  npx agentic-flow oeis validate "$seq"
  echo "---"
done
```

### API Rate Limiting

The OEIS CLI implements conservative rate limiting:
- **Default**: 10 requests per minute
- **Retry logic**: 3 attempts with exponential backoff
- **Timeout**: 30 seconds per request
- **Caching**: Reduces API calls significantly

### Pattern Detection Pipeline

```bash
# 1. Generate sequence from your code
OUTPUT=$(my-sequence-generator)

# 2. Detect patterns
npx agentic-flow oeis pattern "$OUTPUT"

# 3. Validate against OEIS
npx agentic-flow oeis validate "$OUTPUT"

# 4. If validated, link to skill
npx agentic-flow oeis link my-generator A000045
```

## 🐛 Troubleshooting

### Common Issues

**1. "No matching sequences found"**
- Ensure sequence has at least 4 terms
- Check for typos in sequence values
- Try searching OEIS manually first
- Some sequences may not be in OEIS

**2. "Network timeout"**
- Check internet connection
- OEIS API may be temporarily unavailable
- Cached sequences will still work

**3. "Invalid sequence format"**
- Use comma-separated integers only
- No spaces between commas (or use quotes)
- Example: `1,2,3,4` or `"1, 2, 3, 4"`

**4. Cache issues**
- Clear cache: `npx agentic-flow oeis cache clear`
- Check disk space
- Verify write permissions

### Debug Mode

For verbose output, check the source code and add:

```javascript
process.env.DEBUG = 'oeis:*'
```

## 📚 Resources

- **OEIS Website**: https://oeis.org/
- **OEIS Wiki**: https://oeis.org/wiki/
- **JSON API Docs**: https://oeis.org/wiki/JSON_Format
- **AgentDB**: See agentdb CLI documentation

## 🤝 Contributing

To extend the OEIS CLI:

1. Add new pattern validators in `MathematicalValidators.ts`
2. Extend search capabilities in `OeisApiClient.ts`
3. Add new commands in `oeis-cli.ts`
4. Update help documentation

## 📝 Examples

### Example 1: Validate Unknown Sequence

```bash
$ npx agentic-flow oeis validate 1,3,6,10,15,21,28

🔍 OEIS Sequence Validation
ℹ Sequence: [1, 3, 6, 10, 15, 21, 28]
ℹ Length: 7 terms

✅ Sequence Validated!

Match Details:
  OEIS ID: A000217
  Confidence: 100.0%
  Match Type: formula

Sequence Information:
  Name: Triangular numbers
  URL: https://oeis.org/A000217
  Formula: T(n) = n(n+1)/2
```

### Example 2: Search by Keyword

```bash
$ npx agentic-flow oeis search catalan

🔎 OEIS Search
ℹ Query: "catalan"

✅ Found 247 sequence(s)

#1: A000108 - Catalan numbers
  Terms: 1, 1, 2, 5, 14, 42, 132, 429, 1430, 4862, 16796, 58786
  Formula: C(n) = (2n)!/(n+1)!n!
  Keywords: nonn, core, nice, easy
  URL: https://oeis.org/A000108
```

### Example 3: Pattern Detection

```bash
$ npx agentic-flow oeis pattern 2,4,8,16,32,64

🧩 Pattern Detection
ℹ Sequence: [2, 4, 8, 16, 32, 64]

✅ Detected 2 pattern(s)

✓ Powers of 2
  Confidence: 100.0%
  Formula: 2^n
  Matched: 6/6 terms

✓ Geometric progression
  Confidence: 100.0%
  Formula: a(n) = 2 × 2^n
  Matched: 6/6 terms
```

## 🎉 Success Stories

Use the OEIS CLI to:
- ✅ Validate mathematical algorithms
- ✅ Discover patterns in data
- ✅ Link AI skills to known sequences
- ✅ Build mathematical skill libraries
- ✅ Learn about number theory
- ✅ Research integer sequences

## 🔮 Future Enhancements

Planned features:
- [ ] Sequence generation from OEIS IDs
- [ ] Machine learning pattern detection
- [ ] Custom pattern definitions
- [ ] Batch validation API
- [ ] Integration with Wolfram Alpha
- [ ] Visual sequence plots
- [ ] Latex formula rendering

---

For more information, visit: https://github.com/ruvnet/agentic-flow

# OEIS CLI - Quick Reference

## 🚀 Commands Cheat Sheet

```bash
# Validate sequences
npx agentic-flow oeis validate 1,1,2,3,5,8,13       # Fibonacci
npx agentic-flow oeis validate 2,3,5,7,11,13        # Primes
npx agentic-flow oeis validate 1,4,9,16,25          # Squares

# Search OEIS
npx agentic-flow oeis search fibonacci              # By keyword
npx agentic-flow oeis search "prime numbers"        # Multi-word
npx agentic-flow oeis search 2,3,5,7                # By values

# Detect patterns
npx agentic-flow oeis pattern 2,4,8,16,32           # Powers of 2
npx agentic-flow oeis pattern 1,3,6,10,15           # Triangular

# Link skills
npx agentic-flow oeis link my-skill A000045        # Link to Fibonacci

# Stats & cache
npx agentic-flow oeis stats                        # View stats
npx agentic-flow oeis cache stats                  # Cache info
npx agentic-flow oeis cache clear                  # Clear cache

# Help
npx agentic-flow oeis help                         # Show help
```

## 📊 Common OEIS IDs

| ID | Sequence | Example |
|----|----------|---------|
| A000045 | Fibonacci | 1,1,2,3,5,8,13 |
| A000040 | Primes | 2,3,5,7,11,13 |
| A000142 | Factorials | 1,1,2,6,24,120 |
| A000290 | Squares | 0,1,4,9,16,25 |
| A000079 | Powers of 2 | 1,2,4,8,16,32 |
| A000217 | Triangular | 1,3,6,10,15 |

## 🎯 Pattern Types

- **Fibonacci**: F(n) = F(n-1) + F(n-2)
- **Prime**: Divisible only by 1 and itself
- **Factorial**: n! = n × (n-1) × ... × 1
- **Square**: n²
- **Cube**: n³
- **Power of 2**: 2^n
- **Triangular**: n(n+1)/2
- **Arithmetic**: a + nd
- **Geometric**: a × r^n

## 🔧 Environment

```bash
# Set custom cache location
export OEIS_CACHE_PATH=/path/to/cache.db
```

## 💡 Tips

1. **Minimum 4 terms** required for validation
2. **Comma-separated** values only
3. **Quote sequences** with spaces: `"1, 2, 3"`
4. **Cache persists** between sessions
5. **Rate limited** to 10 requests/minute

## 🔗 Integration

```bash
# Complete workflow
agentdb skill create my-skill "Description"     # Create skill
# ... run skill, capture output ...
agentic-flow oeis validate <output>             # Validate
agentic-flow oeis link my-skill <oeis-id>       # Link
```

## 📚 Resources

- OEIS: https://oeis.org/
- Full Guide: ./oeis-cli-guide.md
- AgentDB: See agentdb documentation

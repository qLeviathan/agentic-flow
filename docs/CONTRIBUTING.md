# Contributing Guide

Thank you for your interest in contributing to the Mathematical Framework! This guide will help you get started.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Code Style](#code-style)
4. [Testing](#testing)
5. [Documentation](#documentation)
6. [Pull Request Process](#pull-request-process)
7. [Areas for Contribution](#areas-for-contribution)
8. [Community](#community)

---

## Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **TypeScript**: v5.0 or higher
- **Git**: Latest version
- **Rust** (optional): For WASM development

### Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/agentic-flow.git
cd agentic-flow
git remote add upstream https://github.com/ruvnet/agentic-flow.git
```

### Install Dependencies

```bash
npm install
```

### Build the Project

```bash
npm run build
```

### Run Tests

```bash
npm test
```

---

## Development Setup

### Project Structure

```
agentic-flow/
├── src/math-framework/       # TypeScript source code
│   ├── core/                  # Primitives and types
│   ├── sequences/             # Fibonacci, Lucas, etc.
│   ├── decomposition/         # Zeckendorf decomposition
│   ├── divergence/            # B-K theorem, Nash
│   ├── neural/                # Q-Networks
│   ├── phase-space/           # State space analysis
│   ├── memory/                # AgentDB integration
│   └── validation/            # Property verification
├── tests/math-framework/      # Test files
├── examples/                  # Usage examples
├── docs/                      # Documentation
├── crates/                    # Rust/WASM modules
│   └── math-framework-wasm/
└── benchmarks/                # Performance benchmarks
```

### Development Workflow

1. **Create a branch**: `git checkout -b feature/your-feature-name`
2. **Make changes**: Edit code, add tests, update docs
3. **Run tests**: `npm test`
4. **Run linter**: `npm run lint`
5. **Type check**: `npm run typecheck`
6. **Build**: `npm run build`
7. **Commit**: `git commit -m "feat: add your feature"`
8. **Push**: `git push origin feature/your-feature-name`
9. **Create PR**: Open a pull request on GitHub

### Setting Up Your Editor

**VS Code** (recommended):
- Install TypeScript extension
- Install ESLint extension
- Install Prettier extension

**`.vscode/settings.json`**:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## Code Style

### TypeScript Style Guide

#### 1. Naming Conventions

```typescript
// Classes: PascalCase
class PhaseSpacePoint { }

// Interfaces: PascalCase with 'I' prefix (optional)
interface BKAnalysis { }

// Functions: camelCase
function computeV(n: number): number { }

// Constants: UPPER_SNAKE_CASE or PascalCase
const PHI = 1.618033988749895;
const EPSILON = 1e-15;

// Variables: camelCase
const nashPoints = findNashEquilibria(100);

// Type parameters: Single uppercase letter or PascalCase
function identity<T>(x: T): T { }
```

#### 2. Type Annotations

```typescript
// Always annotate function return types
function fibonacci(n: bigint): bigint {
  // ...
}

// Annotate complex types
const analysis: BKAnalysis = analyzeBKTheorem(100);

// Use type inference for simple cases
const x = 5;  // inferred as number
```

#### 3. Immutability

```typescript
// Prefer const over let
const value = computeS(10);

// Use readonly for class properties
class Point {
  readonly x: number;
  readonly y: number;
}

// Immutable arrays
const points: readonly PhaseSpacePoint[] = trajectory.points;
```

#### 4. Pure Functions

```typescript
// ✅ Good: Pure function
function add(a: number, b: number): number {
  return a + b;
}

// ❌ Bad: Mutates external state
let total = 0;
function addToTotal(n: number): void {
  total += n;  // Side effect
}

// ✅ Good: Returns new value
function addToTotal(total: number, n: number): number {
  return total + n;
}
```

#### 5. Error Handling

```typescript
// Throw descriptive errors
function natural(n: number): Natural {
  if (n < 0 || !Number.isInteger(n)) {
    throw new TypeError(
      `Expected natural number, got ${n}. Natural numbers must be non-negative integers.`
    );
  }
  return n as Natural;
}

// Document errors in JSDoc
/**
 * Compute S(n) = V(n) - U(n)
 * @throws {RangeError} If n < 0
 */
function computeS(n: number): number {
  if (n < 0) {
    throw new RangeError('n must be non-negative');
  }
  // ...
}
```

#### 6. Documentation

```typescript
/**
 * Compute the n-th Fibonacci number using O(log n) matrix exponentiation.
 *
 * Uses the matrix formula:
 * [[F(n+1), F(n)  ],  = [[1, 1],^n
 *  [F(n),   F(n-1)]]    [1, 0]]
 *
 * @param n - The index (must be non-negative)
 * @returns The n-th Fibonacci number
 * @throws {RangeError} If n < 0
 *
 * @example
 * ```typescript
 * const f10 = fibonacci(10n);  // 55n
 * const f100 = fibonacci(100n); // 354224848179261915075n
 * ```
 */
export function fibonacci(n: bigint): bigint {
  // Implementation...
}
```

### Formatting

We use **Prettier** for code formatting. Configuration:

**`.prettierrc.json`**:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

Format code:
```bash
npm run format
```

### Linting

We use **ESLint** for linting. Run:

```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

---

## Testing

### Test Structure

```
tests/math-framework/
├── unit/                      # Unit tests
│   ├── primitives.test.ts
│   ├── fibonacci.test.ts
│   └── ...
├── integration/               # Integration tests
│   ├── bk-theorem.test.ts
│   └── agentdb-integration.test.ts
├── performance/               # Performance tests
│   └── benchmarks.test.ts
└── properties/                # Property-based tests
    └── mathematical-properties.test.ts
```

### Writing Tests

#### Unit Tests

```typescript
import { fibonacci } from '../../../src/math-framework/sequences';

describe('Fibonacci', () => {
  describe('fibonacci(n)', () => {
    it('should return 0 for n=0', () => {
      expect(fibonacci(0n)).toBe(0n);
    });

    it('should return 1 for n=1', () => {
      expect(fibonacci(1n)).toBe(1n);
    });

    it('should compute F(10) = 55', () => {
      expect(fibonacci(10n)).toBe(55n);
    });

    it('should handle large numbers', () => {
      const f100 = fibonacci(100n);
      expect(f100.toString()).toBe('354224848179261915075');
    });

    it('should throw for negative n', () => {
      expect(() => fibonacci(-1n)).toThrow(RangeError);
    });
  });
});
```

#### Property-Based Tests

```typescript
import { fibonacci, lucas } from '../../../src/math-framework/sequences';

describe('Fibonacci Properties', () => {
  it('should satisfy Cassini identity: F(n)² - F(n-1)·F(n+1) = (-1)^(n+1)', () => {
    for (let n = 2; n <= 20; n++) {
      const fn = fibonacci(BigInt(n));
      const fn_1 = fibonacci(BigInt(n - 1));
      const fn_plus = fibonacci(BigInt(n + 1));

      const lhs = fn * fn;
      const rhs = fn_1 * fn_plus + BigInt((-1) ** (n + 1));

      expect(lhs).toBe(rhs);
    }
  });

  it('should satisfy L(n) = F(n-1) + F(n+1)', () => {
    for (let n = 1; n <= 20; n++) {
      const ln = lucas(BigInt(n));
      const fn_1 = fibonacci(BigInt(n - 1));
      const fn_plus = fibonacci(BigInt(n + 1));

      expect(ln).toBe(fn_1 + fn_plus);
    }
  });
});
```

#### Integration Tests

```typescript
import { createMathFrameworkMemory } from '../../../src/math-framework/memory';
import { findNashEquilibria } from '../../../src/math-framework/divergence';

describe('AgentDB Integration', () => {
  let memory: MathFrameworkMemory;

  beforeAll(async () => {
    memory = await createMathFrameworkMemory({
      database_path: ':memory:',  // In-memory for tests
      enable_learning: true,
    });
  });

  afterAll(async () => {
    await memory.close();
  });

  it('should store and retrieve computed values', async () => {
    const stored = await memory.computeAndStore(10);
    expect(stored.n).toBe(10);
    expect(stored.F).toBe(55n);

    const stats = await memory.getStats();
    expect(stats.total_computations).toBeGreaterThan(0);
  });

  it('should detect Nash equilibria', async () => {
    await memory.batchCompute(1, 50);
    const nashPoints = findNashEquilibria(50);

    expect(nashPoints).toContain(0);
    expect(nashPoints).toContain(1);
    expect(nashPoints).toContain(2);
    expect(nashPoints).toContain(6);
    expect(nashPoints).toContain(17);
    expect(nashPoints).toContain(46);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- primitives.test.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run only integration tests
npm test tests/math-framework/integration/
```

### Coverage Requirements

- **Unit tests**: > 90% coverage
- **Integration tests**: > 80% coverage
- **Overall**: > 85% coverage

Check coverage:
```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

---

## Documentation

### Documentation Standards

1. **JSDoc**: All public APIs must have JSDoc comments
2. **README**: Each module should have a README.md
3. **Examples**: Provide usage examples
4. **Theory**: Document mathematical background

### Writing Documentation

#### API Documentation

```typescript
/**
 * Compute the B-K divergence S(n) = V(n) - U(n).
 *
 * The divergence measures the difference between cumulative Zeckendorf
 * and Lucas representation counts. According to the Behrend-Kimberling
 * theorem, S(n) = 0 if and only if n+1 is a Lucas number.
 *
 * @param n - The index (must be non-negative)
 * @param V - Optional pre-computed V(n) value
 * @param U - Optional pre-computed U(n) value
 * @returns The divergence S(n) = V(n) - U(n)
 * @throws {RangeError} If n < 0
 *
 * @example
 * Basic usage:
 * ```typescript
 * const s = computeS(17);  // 0 (Nash equilibrium)
 * ```
 *
 * @example
 * With pre-computed values:
 * ```typescript
 * const v = computeV(17);
 * const u = computeU(17);
 * const s = computeS(17, v, u);  // More efficient
 * ```
 *
 * @see {@link computeV} for V(n) computation
 * @see {@link computeU} for U(n) computation
 * @see {@link findNashEquilibria} for finding all Nash points
 */
export function computeS(n: number, V?: number, U?: number): number {
  // Implementation...
}
```

#### Mathematical Documentation

Use LaTeX for formulas:

```markdown
The Fibonacci sequence is defined by the recurrence:

$$F(n) = F(n-1) + F(n-2)$$

with initial conditions $F(0) = 0$ and $F(1) = 1$.

The closed form (Binet's formula) is:

$$F(n) = \frac{\varphi^n - \psi^n}{\sqrt{5}}$$

where $\varphi = \frac{1 + \sqrt{5}}{2}$ is the golden ratio.
```

### Updating Documentation

When making changes:

1. Update JSDoc comments
2. Update module README if necessary
3. Update examples if API changed
4. Update theory docs for new theorems
5. Update main docs/ files

---

## Pull Request Process

### Before Submitting

- [ ] Tests pass: `npm test`
- [ ] Linter passes: `npm run lint`
- [ ] Type check passes: `npm run typecheck`
- [ ] Build succeeds: `npm run build`
- [ ] Documentation updated
- [ ] Examples updated if needed
- [ ] CHANGELOG.md updated

### PR Title Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Golden Ratio approximation function
fix: correct Zeckendorf decomposition for edge case
docs: update API documentation for Q-Network
test: add property tests for Lucas numbers
perf: optimize Fibonacci computation with WASM
refactor: simplify phase space coordinate calculation
```

### PR Description Template

```markdown
## Description
Brief description of the changes.

## Motivation
Why is this change needed?

## Changes
- Change 1
- Change 2
- Change 3

## Testing
How was this tested?
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing performed

## Documentation
- [ ] JSDoc comments updated
- [ ] README updated
- [ ] Examples updated
- [ ] CHANGELOG updated

## Breaking Changes
List any breaking changes (or "None").

## Related Issues
Closes #123
Relates to #456
```

### Review Process

1. **Automated checks**: CI/CD runs tests, linting, type checking
2. **Code review**: Maintainer reviews code for quality, style, correctness
3. **Discussion**: Address feedback and make changes
4. **Approval**: Maintainer approves PR
5. **Merge**: PR is merged to main branch

### After Merge

- Delete your branch: `git branch -d feature/your-feature-name`
- Update your fork:
  ```bash
  git checkout main
  git pull upstream main
  git push origin main
  ```

---

## Areas for Contribution

### Good First Issues

- Add more unit tests for edge cases
- Improve documentation examples
- Fix typos in documentation
- Add type definitions for external libraries
- Improve error messages

### Feature Requests

- **Visualization**: Create interactive visualizations for phase space
- **CLI**: Build a command-line interface
- **Web UI**: Create a web-based interface
- **More Sequences**: Add other integer sequences (Pell, Tribonacci, etc.)
- **GPU Acceleration**: Implement CUDA/WebGPU support
- **Distributed Training**: Extend Q-Network for distributed learning

### Optimization

- Improve Fibonacci caching strategy
- Optimize Zeckendorf decomposition algorithm
- Parallelize batch computations
- Reduce memory usage in phase space trajectories
- Profile and optimize hot paths

### Research

- Verify B-K theorem for larger ranges
- Explore new Nash equilibrium properties
- Investigate other divergence functions
- Analyze convergence rates for Q-Networks
- Study phase space topology

### Documentation

- Add more theory documentation
- Create video tutorials
- Write blog posts about mathematical concepts
- Translate documentation to other languages
- Create interactive notebooks (Jupyter/Observable)

---

## Community

### Communication

- **GitHub Issues**: Bug reports, feature requests, questions
- **GitHub Discussions**: General discussions, Q&A
- **Discord**: Real-time chat (link in README)
- **Email**: For sensitive issues

### Code of Conduct

We follow the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

**Key points**:
- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Assume good intentions
- No harassment or discrimination

### Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- GitHub contributors page
- Special thanks in documentation

---

## Development Tips

### Debugging

```typescript
// Use console.log for simple debugging
console.log('Value:', value);

// Use debugger statement
function fibonacci(n: bigint): bigint {
  debugger;  // Execution will pause here
  // ...
}

// Use descriptive variable names
const nashEquilibriaInRange = findNashEquilibria(100);
```

### Performance Profiling

```bash
# Profile with Node.js built-in profiler
node --prof your-script.js

# Generate flamegraph
node --prof-process isolate-*.log > profile.txt

# Use 0x for visual profiling
npx 0x your-script.js
```

### Git Tips

```bash
# Commit message format
git commit -m "feat(sequences): add Tribonacci sequence"

# Amend last commit
git commit --amend

# Interactive rebase (clean up commits before PR)
git rebase -i HEAD~3

# Keep fork updated
git fetch upstream
git rebase upstream/main
```

---

## Questions?

If you have questions:

1. Check existing documentation (README, docs/, API.md)
2. Search GitHub issues for similar questions
3. Ask in GitHub Discussions
4. Reach out on Discord

Thank you for contributing! 🎉

---

**Version**: 2.0.0
**Last Updated**: 2025-11-12

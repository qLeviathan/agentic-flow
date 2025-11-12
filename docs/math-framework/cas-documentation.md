# Computer Algebra System (CAS) - Documentation

## Overview

A complete type-safe Computer Algebra System with type checking and inference for mathematical expressions. Implements formal type theory with comprehensive error reporting and symbolic computation capabilities.

## Features

- ✅ Type signatures for all symbols
- ✅ Type inference engine
- ✅ Type checking for expressions
- ✅ Error reporting for type mismatches
- ✅ Symbolic computation with type safety
- ✅ Type hierarchy: ℕ ⊆ ℤ ⊆ ℝ ⊆ ℂ
- ✅ Type promotion and coercion
- ✅ Lambda calculus with type annotations
- ✅ Vector and matrix types
- ✅ Set types and comprehensions
- ✅ Type unification algorithm

## Type System

### Base Types

```typescript
ℕ - Natural numbers: {0, 1, 2, 3, ...}
ℤ - Integers: {..., -2, -1, 0, 1, 2, ...}
ℝ - Real numbers
ℂ - Complex numbers: a + bi
```

### Composite Types

```typescript
Set<T>              - Set of elements of type T
T₁ → T₂             - Function from T₁ to T₂
Matrix<T, m, n>     - Matrix with m rows, n columns, elements of type T
Vector<T, n>        - Vector with n elements of type T
(T₁, T₂, ..., Tₙ)   - Tuple of types
```

### Type Variables

```typescript
α, β, γ             - Type variables for polymorphic types
α <: T              - Type variable with upper bound constraint
```

## Quick Start

### Installation

```typescript
import { CAS, TypeChecker, Expr, MathTypes } from './src/math-framework/cas';
```

### Basic Usage

```typescript
// Create a type checker
const checker = new TypeChecker();

// Type check an expression
const expr = Expr.add(Expr.literal(3), Expr.literal(5));
const type = checker.infer(expr);
console.log(typeToString(type)); // ℕ

// Check for errors
if (checker.hasErrors()) {
  console.error(checker.formatErrors());
}
```

### Convenience API

```typescript
// Quick type checking
const type = CAS.check(expr);

// Validate expression
if (CAS.isValid(expr)) {
  console.log('Expression is well-typed');
}

// Pretty printing
console.log(CAS.print(expr));      // Expression as string
console.log(CAS.printType(type));  // Type as string
```

## Expression Builders

### Literals

```typescript
Expr.literal(42)                    // Natural number: ℕ
Expr.literal(-5)                    // Integer: ℤ
Expr.literal(3.14)                  // Real: ℝ
Expr.literal({ real: 3, imaginary: 4 })  // Complex: ℂ
```

### Variables

```typescript
Expr.variable('x')     // Variable reference
Expr.variable('φ')     // Golden ratio (built-in constant)
Expr.variable('π')     // Pi (built-in constant)
```

### Binary Operations

```typescript
Expr.add(a, b)         // a + b
Expr.subtract(a, b)    // a - b
Expr.multiply(a, b)    // a * b
Expr.divide(a, b)      // a / b
Expr.power(a, b)       // a ^ b
```

### Unary Operations

```typescript
Expr.negate(x)         // -x
Expr.sqrt(x)           // √x
Expr.abs(x)            // |x|
Expr.unaryOp('sin', x) // sin(x)
Expr.unaryOp('cos', x) // cos(x)
Expr.unaryOp('ln', x)  // ln(x)
```

### Function Application

```typescript
// F(5) - Apply Fibonacci function to 5
Expr.application(
  Expr.variable('F'),
  Expr.literal(5)
)
```

### Lambda Expressions

```typescript
// λx. x + 1
Expr.lambda('x',
  Expr.add(Expr.variable('x'), Expr.literal(1))
)

// λx:ℝ. x * 2 (with type annotation)
Expr.lambda('x',
  Expr.multiply(Expr.variable('x'), Expr.literal(2)),
  MathTypes.Real()
)
```

### Let Bindings

```typescript
// let x = 5 in x + 3
Expr.let('x',
  Expr.literal(5),
  Expr.add(Expr.variable('x'), Expr.literal(3))
)
```

### Conditional Expressions

```typescript
// if cond then e1 else e2
Expr.if(condition, thenBranch, elseBranch)
```

### Vectors and Matrices

```typescript
// Vector: [1, 2, 3]
Expr.vector([
  Expr.literal(1),
  Expr.literal(2),
  Expr.literal(3)
])

// Matrix: [[1, 2], [3, 4]]
Expr.matrix([
  [Expr.literal(1), Expr.literal(2)],
  [Expr.literal(3), Expr.literal(4)]
])
```

### Sets

```typescript
// Set literal: {1, 2, 3}
Expr.set([
  Expr.literal(1),
  Expr.literal(2),
  Expr.literal(3)
])

// Set comprehension: {x * 2 | x ∈ S}
Expr.setComprehension('x', domain, body)
```

## Built-in Functions

### Mathematical Constants

```typescript
φ : ℝ    // Golden ratio (≈ 1.618)
ψ : ℝ    // Golden ratio conjugate (≈ -0.618)
π : ℝ    // Pi (≈ 3.14159)
e : ℝ    // Euler's number (≈ 2.71828)
```

### Sequence Functions

```typescript
F : ℕ → ℤ    // Fibonacci sequence
L : ℕ → ℤ    // Lucas sequence
S : ℕ → ℕ    // Successor function
Z : ℕ → ℕ    // Zeckendorf representation
```

### Trigonometric Functions

```typescript
sin : ℝ → ℝ
cos : ℝ → ℝ
tan : ℝ → ℝ
```

### Other Functions

```typescript
exp  : ℝ → ℝ    // Exponential
ln   : ℝ → ℝ    // Natural logarithm
abs  : ℝ → ℝ    // Absolute value
sqrt : ℝ → ℝ    // Square root
```

## Type Checking Examples

### Valid Expressions ✓

```typescript
// F(5) : ℤ
const expr1 = Expr.application(Expr.variable('F'), Expr.literal(5));
// ✓ Type checks: F : ℕ → ℤ, 5 : ℕ → Result: ℤ

// φ + ψ : ℝ
const expr2 = Expr.add(Expr.variable('φ'), Expr.variable('ψ'));
// ✓ Type checks: φ : ℝ, ψ : ℝ → Result: ℝ

// sin(π) : ℝ
const expr3 = Expr.application(Expr.variable('sin'), Expr.variable('π'));
// ✓ Type checks: sin : ℝ → ℝ, π : ℝ → Result: ℝ
```

### Type Errors ✗

```typescript
// F(φ) - Type error
const expr1 = Expr.application(Expr.variable('F'), Expr.variable('φ'));
// ✗ Error: F expects ℕ, but φ is ℝ

// S(F(5)) - Type error
const expr2 = Expr.application(
  Expr.variable('S'),
  Expr.application(Expr.variable('F'), Expr.literal(5))
);
// ✗ Error: S expects ℕ, but F(5) is ℤ
```

## Type Promotion

The system automatically promotes types according to the type hierarchy:

```
ℕ ⊆ ℤ ⊆ ℝ ⊆ ℂ
```

### Examples

```typescript
// 3 + 3.14 → ℝ (Nat promoted to Real)
Expr.add(Expr.literal(3), Expr.literal(3.14))

// 5 + (2 + 3i) → ℂ (Nat promoted to Complex)
Expr.add(Expr.literal(5), Expr.literal({ real: 2, imaginary: 3 }))

// Vector promotion: [1, 2.5, 3] → Vector<ℝ, 3>
Expr.vector([Expr.literal(1), Expr.literal(2.5), Expr.literal(3)])
```

## Error Handling

### Error Types

```typescript
TypeMismatchError         - Expected type doesn't match actual type
UnificationError          - Cannot unify two types
UndefinedVariableError    - Variable not found in environment
InvalidOperationError     - Operation not supported for given types
ArityMismatchError        - Wrong number of arguments
DimensionMismatchError    - Matrix/vector dimension mismatch
ConstraintViolationError  - Type constraint violated
AnnotationMismatchError   - Type annotation doesn't match inference
OccursCheckError          - Recursive type detected
```

### Error Reporter

```typescript
const checker = new TypeChecker();
const reporter = checker.getReporter();

// Check expressions
try {
  checker.infer(expr1);
  checker.infer(expr2);
} catch {}

// Get all errors
if (reporter.hasErrors()) {
  console.log(`Found ${reporter.errorCount()} errors`);
  console.log(reporter.format());
}

// Get warnings
const warnings = reporter.getWarnings();
```

## Type Unification

The system uses Hindley-Milner style type unification:

```typescript
const checker = new TypeChecker();

// Unify two types
const t1 = MathTypes.TypeVar('a');
const t2 = MathTypes.Int();
const subst = checker.unify(t1, t2);

// Apply substitution
const result = subst.apply(t1); // Result: Int
```

## Advanced Usage

### Custom Type Environment

```typescript
const env = new TypeEnvironment();

// Add custom bindings
env.bind('myFunc', MathTypes.Function(
  MathTypes.Real(),
  MathTypes.Real()
));

// Create checker with custom environment
const checker = new TypeChecker(env);
```

### Type Constraints

```typescript
// Create type variable with constraint
const typeVar = MathTypes.TypeVar('a', MathTypes.Real());
// 'a must be a subtype of Real
```

### Pattern: Safe Function Composition

```typescript
// Define functions with explicit types
const f = MathTypes.Function(MathTypes.Real(), MathTypes.Real());
const g = MathTypes.Function(MathTypes.Real(), MathTypes.Int());

// Compose: cannot compose if types don't match
// This will type-check: g(f(x))
// This will fail: f(g(x)) - type mismatch
```

## Testing

Run the comprehensive test suite:

```bash
npm test tests/math-framework/cas/type-checker.test.ts
```

The test suite includes:
- All specification examples
- Literal type inference
- Variable lookup
- Binary and unary operations
- Function application
- Lambda expressions
- Let bindings
- Vectors, matrices, and sets
- Type hierarchy and subtyping
- Type unification
- Error handling
- Complex real-world examples

## Performance Considerations

- **Type Inference**: O(n) where n is expression size
- **Type Unification**: O(n) per unification
- **Subtype Checking**: O(depth) of type structure
- **Environment Lookup**: O(1) with Map-based implementation

## Architecture

```
cas/
├── types.ts          - Core type system definitions
├── expressions.ts    - Expression AST and builders
├── errors.ts         - Error types and reporting
├── type-checker.ts   - Main type checker implementation
└── index.ts          - Public API exports
```

## Integration with Math Framework

The CAS integrates seamlessly with the existing math framework:

```typescript
import { PHI, PSI } from '../core/primitives';
import { fibonacci } from '../sequences/fibonacci';
import { CAS, Expr } from './cas';

// Type-checked expression using framework constants
const expr = Expr.add(
  Expr.literal(PHI.value),
  Expr.literal(PSI.value)
);

const type = CAS.check(expr); // ℝ
```

## Future Enhancements

- [ ] Algebraic simplification
- [ ] Symbolic differentiation
- [ ] Symbolic integration
- [ ] Pattern matching
- [ ] Rewrite rules
- [ ] Theorem proving
- [ ] SMT solver integration
- [ ] Code generation

## References

- **Type Theory**: Benjamin C. Pierce - "Types and Programming Languages"
- **Hindley-Milner**: Damas & Milner - "Principal type-schemes for functional programs"
- **Computer Algebra**: Geddes, Czapor, Labahn - "Algorithms for Computer Algebra"

## API Summary

### Core Functions

```typescript
typeCheck(expr: Expression): MathType
isWellTyped(expr: Expression): boolean
typeToString(type: MathType): string
exprToString(expr: Expression): string
```

### Classes

```typescript
TypeChecker           - Main type checker
TypeEnvironment       - Variable type bindings
Substitution          - Type variable substitutions
ErrorReporter         - Error collection and reporting
```

### Type Constructors

```typescript
MathTypes.Nat()
MathTypes.Int()
MathTypes.Real()
MathTypes.Complex()
MathTypes.Set(elementType)
MathTypes.Function(domain, codomain)
MathTypes.Matrix(base, rows, cols)
MathTypes.Vector(base, dim)
MathTypes.Tuple(elements)
MathTypes.TypeVar(name, constraint?)
```

---

**Version**: 1.0.0
**License**: MIT
**Author**: Claude Agent SDK
**Repository**: /home/user/agentic-flow/src/math-framework/cas

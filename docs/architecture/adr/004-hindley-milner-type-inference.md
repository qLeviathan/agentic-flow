# ADR-004: Hindley-Milner Type Inference

## Status
Accepted

## Context
The mathematical framework requires a type system that:
- Ensures type safety at compile time
- Minimizes type annotations (developer productivity)
- Supports higher-order functions
- Enables composition without explicit types
- Provides helpful error messages
- Has decidable type checking

We need to balance:
- Type safety guarantees
- Developer experience
- Compilation performance
- Expressiveness

## Decision
We adopt **Hindley-Milner (HM) type inference** with:
- Principal type inference (most general type)
- Let-polymorphism (generalization at let bindings)
- Structural type equality
- Type-safe composition operators
- Level-aware type constraints

### Type System Features

```typescript
// Automatic type inference
const double = (x) => x * 2         // Inferred: number → number
const map = (f, arr) => arr.map(f)  // Inferred: ∀a,b. (a → b, a[]) → b[]

// Type-safe composition (no annotations needed)
const f = (x: number) => x.toString()  // number → string
const g = (s: string) => s.length      // string → number
const composed = Phi(f, g)              // Inferred: number → number

// Parametric polymorphism
function identity<T>(x: T): T { return x }  // ∀T. T → T

// Type constraints from dependencies
const nashOp = /* depends on level 5,6 operations */
// Type checker ensures nashOp is at level ≥ 7
```

## Rationale

### Why Hindley-Milner?

1. **Principal Types**: Every expression has a most general type
2. **Complete Inference**: No type annotations required (though allowed)
3. **Decidable**: Type checking always terminates
4. **Proven**: Used in ML, Haskell, successfully for decades
5. **Compositional**: Types compose naturally

### Type Inference Algorithm

```
1. Assign fresh type variables to unknowns
2. Generate type constraints from expressions
3. Solve constraints via unification (Robinson's algorithm)
4. Apply substitution to get principal type
```

### Example Inference

```typescript
// Expression: λx. λy. x + y
// Step 1: Assign type variables
//   x : α, y : β, result : γ

// Step 2: Generate constraints
//   α = number  (from +)
//   β = number  (from +)
//   γ = number  (result of +)

// Step 3: Solve constraints
//   α = number, β = number, γ = number

// Step 4: Principal type
//   (number, number) → number
```

## Consequences

### Positive
- **No Annotations**: Types inferred automatically
- **Type Safety**: Catch errors at compile time
- **Refactoring**: Change implementation, types adjust
- **Documentation**: Types serve as documentation
- **Optimization**: Type information enables optimization
- **Composability**: Operations compose with type checking

### Negative
- **Error Messages**: Can be cryptic for complex expressions
- **Polymorphism Limits**: No subtyping (uses structural equality)
- **Learning Curve**: Developers need to understand type inference
- **Compilation Time**: Type inference adds to build time

### Mitigations
- Improve error messages with context and suggestions
- Allow explicit type annotations for clarity
- Provide type visualization tools
- Optimize type checker for common patterns
- Comprehensive documentation with examples

## Alternatives Considered

### 1. No Type System (Dynamic)
**Pros**: Maximum flexibility, no annotations
**Cons**: Runtime errors, no compile-time guarantees
**Rejection Reason**: Safety critical for mathematical operations

### 2. Simple Type Checking (C-style)
**Pros**: Fast, predictable
**Cons**: Verbose annotations, no inference
**Rejection Reason**: Poor developer experience

### 3. Gradual Typing (TypeScript-style)
**Pros**: Optional types, flexibility
**Cons**: Unsound (can have runtime errors), no principal types
**Rejection Reason**: Insufficient safety guarantees

### 4. Dependent Types (Agda, Idris)
**Pros**: Maximum expressiveness, prove properties
**Cons**: Undecidable, complex, slow compilation
**Rejection Reason**: Too complex for practical use

### 5. Substructural Types (Rust-style)
**Pros**: Memory safety, no GC needed
**Cons**: Steep learning curve, complex borrow checker
**Rejection Reason**: Overkill for our use case

## Implementation

### Type Representation

```typescript
type Type =
  | { kind: 'Scalar', baseType: 'number' | 'string' | 'boolean' }
  | { kind: 'Vector', length: number, elementType: Type }
  | { kind: 'Matrix', rows: number, cols: number, elementType: Type }
  | { kind: 'Function', input: Type, output: Type }
  | { kind: 'TypeVar', name: string }
  | { kind: 'Sequence', elementType: Type }

type TypeScheme = {
  kind: 'TypeScheme'
  vars: string[]        // Quantified variables
  type: Type
}
```

### Inference Engine

```typescript
class TypeInference {
  private constraints: TypeConstraint[] = []
  private typeVarCounter = 0

  infer(expr: Expr, env: TypeEnv): Type {
    switch (expr.kind) {
      case 'Literal':
        return this.inferLiteral(expr)

      case 'Variable':
        const scheme = env.lookup(expr.name)
        return this.instantiate(scheme)

      case 'Application':
        const fnType = this.infer(expr.fn, env)
        const argType = this.infer(expr.arg, env)
        const resultType = this.freshTypeVar()

        this.addConstraint({
          actual: fnType,
          expected: functionType(argType, resultType)
        })

        return resultType

      case 'Lambda':
        const paramType = this.freshTypeVar()
        const bodyEnv = env.extend(expr.param, paramType)
        const bodyType = this.infer(expr.body, bodyEnv)

        return functionType(paramType, bodyType)

      case 'Let':
        const rhsType = this.infer(expr.rhs, env)
        const scheme = env.generalize(rhsType)
        const bodyEnv = env.extend(expr.name, scheme)

        return this.infer(expr.body, bodyEnv)
    }
  }

  private solve(): Substitution {
    const subst = new Map<string, Type>()

    for (const constraint of this.constraints) {
      const s = this.unify(
        this.apply(subst, constraint.actual),
        this.apply(subst, constraint.expected)
      )

      // Compose substitutions
      for (const [var_, type] of subst) {
        subst.set(var_, this.apply(s, type))
      }

      for (const [var_, type] of s) {
        subst.set(var_, type)
      }
    }

    return subst
  }

  private unify(t1: Type, t2: Type): Substitution {
    if (t1 === t2) {
      return new Map()
    }

    if (isTypeVar(t1)) {
      return this.bindTypeVar(t1.name, t2)
    }

    if (isTypeVar(t2)) {
      return this.bindTypeVar(t2.name, t1)
    }

    if (isFunctionType(t1) && isFunctionType(t2)) {
      const s1 = this.unify(t1.input, t2.input)
      const s2 = this.unify(
        this.apply(s1, t1.output),
        this.apply(s1, t2.output)
      )
      return this.compose(s1, s2)
    }

    throw new TypeError(`Cannot unify ${formatType(t1)} with ${formatType(t2)}`)
  }

  private bindTypeVar(name: string, type: Type): Substitution {
    // Occurs check: prevent infinite types
    if (this.occurs(name, type)) {
      throw new TypeError(`Infinite type: ${name} occurs in ${formatType(type)}`)
    }

    return new Map([[name, type]])
  }

  private occurs(var_: string, type: Type): boolean {
    if (isTypeVar(type)) {
      return type.name === var_
    }

    if (isFunctionType(type)) {
      return this.occurs(var_, type.input) ||
             this.occurs(var_, type.output)
    }

    return false
  }
}
```

### Type Environment

```typescript
class TypeEnv {
  private bindings = new Map<string, TypeScheme>()

  lookup(name: string): TypeScheme {
    const scheme = this.bindings.get(name)
    if (!scheme) {
      throw new TypeError(`Undefined variable: ${name}`)
    }
    return scheme
  }

  extend(name: string, scheme: TypeScheme): TypeEnv {
    const newEnv = new TypeEnv()
    newEnv.bindings = new Map(this.bindings)
    newEnv.bindings.set(name, scheme)
    return newEnv
  }

  generalize(type: Type): TypeScheme {
    const freeVars = this.freeTypeVars(type)
      .filter(v => !this.envContainsVar(v))

    return {
      kind: 'TypeScheme',
      vars: Array.from(freeVars),
      type
    }
  }

  instantiate(scheme: TypeScheme): Type {
    const subst = new Map<string, Type>()
    for (const var_ of scheme.vars) {
      subst.set(var_, this.freshTypeVar())
    }
    return this.applySubst(subst, scheme.type)
  }
}
```

### Composition Type Checking

```typescript
/**
 * Type-safe composition with level checking
 */
function Phi<A, B, C>(
  f: Operation<A, B>,
  g: Operation<B, C>
): ComposedOp<A, B, C> {
  // Type compatibility check
  if (!typesCompatible(f.outputType, g.inputType)) {
    throw new TypeError(
      `Cannot compose: ${formatType(f.outputType)} ≠ ${formatType(g.inputType)}\n` +
      `in ${f.metadata?.name || 'f'} ∘ ${g.metadata?.name || 'g'}`
    )
  }

  // Level constraint check
  const fLevel = f.metadata?.level || 0
  const gLevel = g.metadata?.level || 0
  const composedLevel = Math.max(fLevel, gLevel)

  return {
    _tag: 'ComposedOp',
    inputType: f.inputType,
    outputType: g.outputType,
    pure: f.pure && g.pure,
    f,
    g,
    execute: (input: A) => g.execute(f.execute(input)),
    metadata: {
      name: `${f.metadata?.name || 'f'} ∘ ${g.metadata?.name || 'g'}`,
      level: composedLevel
    }
  }
}
```

## Type Error Examples

### Good Error Message

```
Type Error in composition:

    const result = Phi(double, toBoolean)
                       ~~~~~~  ~~~~~~~~~

Cannot compose operations:
  • double has type: number → number
  • toBoolean has type: string → boolean

The output type of 'double' (number) does not match
the input type of 'toBoolean' (string).

Suggestion: Insert a toString operation between them:
    Phi(Phi(double, toString), toBoolean)
```

### Type Mismatch

```
Type Error in Nash equilibrium computation:

    Nash.findPure(invalidGame)
                  ~~~~~~~~~~~

Expected: GameState<Player[], Action[], number>
Found: GameState<Player[], Action[], string>

Utility type must be numeric, got 'string'
```

## Performance Characteristics

### Type Checking Complexity

| Operation | Complexity | Notes |
|-----------|------------|-------|
| Literal | O(1) | Immediate |
| Variable lookup | O(1) | Hash map |
| Application | O(n) | Unification |
| Lambda | O(n) | Body inference |
| Let | O(n·m) | Generalization |

Where:
- n = expression size
- m = number of free type variables

### Compilation Time

| Project Size | Type Check Time | Acceptable? |
|--------------|-----------------|-------------|
| 1K LOC | < 100ms | ✓ |
| 10K LOC | < 1s | ✓ |
| 100K LOC | < 10s | ✓ |
| 1M LOC | < 100s | Marginal |

## Testing Strategy

```typescript
describe('Type Inference', () => {
  it('should infer identity function', () => {
    const id = (x) => x
    const type = inferType(id)

    expect(type).toEqual(functionType(typeVar('a'), typeVar('a')))
  })

  it('should infer composition', () => {
    const f = (x: number) => x.toString()
    const g = (s: string) => s.length
    const composed = Phi(f, g)

    expect(composed.inputType).toEqual(scalarType('number'))
    expect(composed.outputType).toEqual(scalarType('number'))
  })

  it('should reject invalid composition', () => {
    const f = (x: number) => x.toString()
    const g = (n: number) => n * 2

    expect(() => Phi(f, g)).toThrow(TypeError)
  })

  it('should handle polymorphic operations', () => {
    const map = <T, U>(f: (x: T) => U, arr: T[]) => arr.map(f)

    const type = inferType(map)
    expect(type.kind).toBe('TypeScheme')
    expect(type.vars).toContain('T')
    expect(type.vars).toContain('U')
  })
})
```

## References
- [Hindley-Milner Type System](https://en.wikipedia.org/wiki/Hindley%E2%80%93Milner_type_system)
- [Principal Type Schemes](https://doi.org/10.1016/0022-0000(78)90014-4)
- [Type Inference in ML](https://www.cs.cmu.edu/~rwh/papers/ml-typing/popl96.pdf)
- [Unification Algorithm](https://en.wikipedia.org/wiki/Unification_(computer_science))

## Extensions

### Phase 2: Row Polymorphism
```typescript
// Extensible records
type Person = { name: string, age: number, ... }
```

### Phase 3: Type Classes (Haskell-style)
```typescript
interface Numeric<T> {
  add(a: T, b: T): T
  multiply(a: T, b: T): T
  zero: T
}
```

### Phase 4: GADTs
```typescript
// Generalized Algebraic Data Types
type Expr<T> =
  | { kind: 'Lit', value: T }
  | { kind: 'Add', left: Expr<number>, right: Expr<number> }  // Only for numbers
```

## Monitoring

### Type System Metrics

```typescript
interface TypeMetrics {
  inference: {
    totalExpressions: number
    avgInferenceTime: number
    cacheHitRate: number
  }

  errors: {
    totalErrors: number
    byCategory: Map<string, number>
    errorRate: number
  }

  complexity: {
    maxTypeVars: number
    avgTypeVars: number
    maxUnificationSteps: number
  }
}
```

---
**Date**: 2025-11-12
**Author**: System Architecture Team
**Stakeholders**: Type System Team, Core Team, Language Design Team

# Mathematical Framework - Type System Design

## Overview

This document specifies the complete type system for the mathematical framework, including primitive types, operation types, type inference, and type checking algorithms.

## 1. Type System Philosophy

### 1.1 Design Principles

1. **Strong Static Typing**: All types are checked at compile time
2. **Type Inference**: Minimal type annotations required (Hindley-Milner)
3. **Compositional**: Types compose cleanly through operations
4. **Dependent Levels**: Types respect the 9-level dependency hierarchy
5. **Performance**: Zero runtime overhead for type checking

### 1.2 Type Safety Guarantees

```typescript
// ✅ Type-safe composition
const f: Operation<number, string> = /* ... */
const g: Operation<string, boolean> = /* ... */
const composed = Phi(f, g)  // Operation<number, boolean>

// ❌ Compile error: incompatible types
const h: Operation<string, number> = /* ... */
const invalid = Phi(f, h)  // ERROR: string != boolean
```

## 2. Primitive Types

### 2.1 Scalar Types

```typescript
/**
 * Scalar<T>: Single value of type T
 */
type Scalar<T = number> = {
  readonly _tag: 'Scalar'
  readonly value: T
  readonly type: ScalarType<T>
}

type ScalarType<T> =
  | { kind: 'number', precision: 'f32' | 'f64' }
  | { kind: 'integer', bits: 8 | 16 | 32 | 64 }
  | { kind: 'boolean' }
  | { kind: 'string' }
  | { kind: 'custom', name: string }

// Constructors
function scalar<T>(value: T): Scalar<T> {
  return {
    _tag: 'Scalar',
    value,
    type: inferScalarType(value)
  }
}

// Type guards
function isScalar<T>(value: unknown): value is Scalar<T> {
  return typeof value === 'object' &&
         value !== null &&
         '_tag' in value &&
         value._tag === 'Scalar'
}
```

### 2.2 Vector Types

```typescript
/**
 * Vector<T, N>: Fixed-length array of type T
 */
type Vector<T = number, N extends number = number> = {
  readonly _tag: 'Vector'
  readonly data: readonly T[]
  readonly length: N
  readonly elementType: Type
}

// Phantom type for compile-time length checking
type Vec2<T = number> = Vector<T, 2>
type Vec3<T = number> = Vector<T, 3>
type VecN<T = number, N extends number = number> = Vector<T, N>

// Constructors
function vec2<T>(x: T, y: T): Vec2<T> {
  return {
    _tag: 'Vector',
    data: [x, y] as const,
    length: 2 as const,
    elementType: inferType(x)
  }
}

function vec3<T>(x: T, y: T, z: T): Vec3<T> {
  return {
    _tag: 'Vector',
    data: [x, y, z] as const,
    length: 3 as const,
    elementType: inferType(x)
  }
}

function vecN<T, N extends number>(data: T[], length: N): VecN<T, N> {
  if (data.length !== length) {
    throw new TypeError(`Expected vector of length ${length}, got ${data.length}`)
  }

  return {
    _tag: 'Vector',
    data: data as readonly T[],
    length,
    elementType: inferType(data[0])
  }
}

// Type-safe operations
function vectorAdd<T extends number, N extends number>(
  a: Vector<T, N>,
  b: Vector<T, N>
): Vector<T, N> {
  if (a.length !== b.length) {
    throw new TypeError('Vector length mismatch')
  }

  return vecN(
    a.data.map((x, i) => (x + b.data[i]) as T),
    a.length
  )
}
```

### 2.3 Matrix Types

```typescript
/**
 * Matrix<T, M, N>: M×N matrix of type T
 */
type Matrix<
  T = number,
  M extends number = number,
  N extends number = number
> = {
  readonly _tag: 'Matrix'
  readonly data: readonly (readonly T[])[]
  readonly rows: M
  readonly cols: N
  readonly elementType: Type
}

// Common matrix types
type Mat2<T = number> = Matrix<T, 2, 2>
type Mat3<T = number> = Matrix<T, 3, 3>
type Mat4<T = number> = Matrix<T, 4, 4>
type MatMN<T = number, M extends number = number, N extends number = number> = Matrix<T, M, N>

// Constructors
function mat2<T>(
  a: T, b: T,
  c: T, d: T
): Mat2<T> {
  return {
    _tag: 'Matrix',
    data: [
      [a, b] as const,
      [c, d] as const
    ] as const,
    rows: 2 as const,
    cols: 2 as const,
    elementType: inferType(a)
  }
}

// Type-safe matrix multiplication
function matmul<T extends number, M extends number, N extends number, P extends number>(
  a: Matrix<T, M, N>,
  b: Matrix<T, N, P>
): Matrix<T, M, P> {
  // Compile-time check: a.cols must equal b.rows
  // Runtime implementation
  const result: T[][] = []

  for (let i = 0; i < a.rows; i++) {
    result[i] = []
    for (let j = 0; j < b.cols; j++) {
      let sum = 0 as T
      for (let k = 0; k < a.cols; k++) {
        sum = (sum + a.data[i][k] * b.data[k][j]) as T
      }
      result[i][j] = sum
    }
  }

  return {
    _tag: 'Matrix',
    data: result,
    rows: a.rows,
    cols: b.cols,
    elementType: a.elementType
  }
}
```

### 2.4 Tensor Types

```typescript
/**
 * Tensor<T, Shape>: Multi-dimensional array
 */
type Tensor<T = number, Shape extends number[] = number[]> = {
  readonly _tag: 'Tensor'
  readonly data: any  // Nested arrays
  readonly shape: Shape
  readonly rank: Shape['length']
  readonly elementType: Type
}

// Type-level shape operations
type Reshape<T, OldShape extends number[], NewShape extends number[]> =
  Product<OldShape> extends Product<NewShape>
    ? Tensor<T, NewShape>
    : never

// Helper type for computing product of shape
type Product<T extends number[]> =
  T extends [infer Head extends number, ...infer Tail extends number[]]
    ? Head extends 0 ? 0 : Head * Product<Tail>
    : 1

// Example usage
type T1 = Tensor<number, [2, 3, 4]>      // 2×3×4 tensor
type T2 = Reshape<number, [2, 3, 4], [6, 4]>  // Valid: 24 = 24
type T3 = Reshape<number, [2, 3, 4], [5, 5]>  // Error: 24 ≠ 25
```

## 3. Operation Types

### 3.1 Basic Operation Type

```typescript
/**
 * Operation<In, Out>: Pure function from In to Out
 */
type Operation<In, Out> = {
  readonly _tag: 'Operation'
  readonly inputType: Type
  readonly outputType: Type
  readonly pure: boolean
  readonly execute: (input: In) => Out
  readonly metadata?: OperationMetadata
}

interface OperationMetadata {
  name?: string
  description?: string
  complexity?: Complexity
  wasmOptimized?: boolean
  level?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
}

type Complexity = 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n²)' | 'O(2^n)'

// Constructor
function operation<In, Out>(
  execute: (input: In) => Out,
  inputType: Type,
  outputType: Type,
  metadata?: OperationMetadata
): Operation<In, Out> {
  return {
    _tag: 'Operation',
    inputType,
    outputType,
    pure: true,
    execute,
    metadata
  }
}
```

### 3.2 Composed Operation Type

```typescript
/**
 * ComposedOp<A, B, C>: Composition of two operations
 * f: A → B, g: B → C => φ(f, g): A → C
 */
type ComposedOp<A, B, C> = Operation<A, C> & {
  readonly _tag: 'ComposedOp'
  readonly f: Operation<A, B>
  readonly g: Operation<B, C>
}

// φ operator implementation with type checking
function Phi<A, B, C>(
  f: Operation<A, B>,
  g: Operation<B, C>
): ComposedOp<A, B, C> {
  // Type compatibility check
  if (!typesCompatible(f.outputType, g.inputType)) {
    throw new TypeError(
      `Cannot compose: ${formatType(f.outputType)} ≠ ${formatType(g.inputType)}`
    )
  }

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
      complexity: combineComplexity(f.metadata?.complexity, g.metadata?.complexity),
      level: Math.max(f.metadata?.level || 0, g.metadata?.level || 0) as any
    }
  }
}
```

### 3.3 Convergent Operation Type

```typescript
/**
 * ConvergentOp<T>: Operation that converges to a fixed point
 */
type ConvergentOp<T> = Operation<T, T> & {
  readonly _tag: 'ConvergentOp'
  readonly convergenceCriteria: (a: T, b: T) => boolean
  readonly maxIterations: number
  readonly iterate: (initial: T) => T
}

// Constructor with convergence proof
function convergentOp<T>(
  op: Operation<T, T>,
  convergenceCriteria: (a: T, b: T) => boolean,
  maxIterations = 10000
): ConvergentOp<T> {
  return {
    ...op,
    _tag: 'ConvergentOp',
    convergenceCriteria,
    maxIterations,
    iterate: (initial: T) => {
      let current = initial
      let next = op.execute(current)
      let iterations = 0

      while (!convergenceCriteria(current, next) && iterations < maxIterations) {
        current = next
        next = op.execute(current)
        iterations++
      }

      if (iterations >= maxIterations) {
        throw new Error('Operation did not converge')
      }

      return next
    }
  }
}
```

### 3.4 Sequence Operation Type

```typescript
/**
 * SequenceOp<T>: Operation that produces sequences
 */
type SequenceOp<T> = {
  readonly _tag: 'SequenceOp'
  readonly generate: (n: number) => T
  readonly outputType: Type
  readonly lazy: () => Generator<T, void, unknown>
}

// F operator type
type F = {
  fibonacci: () => SequenceOp<number>
  arithmetic: (a: number, d: number) => SequenceOp<number>
  geometric: (a: number, r: number) => SequenceOp<number>
  custom: <T>(fn: (n: number) => T) => SequenceOp<T>
}
```

### 3.5 Game Theory Operation Types

```typescript
/**
 * Strategy<S, A>: Maps states to actions
 */
type Strategy<S, A> = Operation<S, A> & {
  readonly _tag: 'Strategy'
  readonly stateType: Type
  readonly actionType: Type
  readonly type: 'pure' | 'mixed'
  readonly probabilities?: Map<string, number>
}

/**
 * GameState<P, A, U>: Represents game state
 */
type GameState<
  P extends Player[] = Player[],
  A extends any[] = any[],
  U extends number = number
> = {
  readonly _tag: 'GameState'
  readonly players: P
  readonly actions: A
  readonly utilities: Map<string, U>
}

/**
 * NashEquilibrium<S>: Nash equilibrium strategy profile
 */
type NashEquilibrium<S extends Strategy<any, any>[] = Strategy<any, any>[]> = {
  readonly _tag: 'NashEquilibrium'
  readonly strategies: S
  readonly stable: boolean
  readonly type: 'pure' | 'mixed'
}

/**
 * S operator type: Strategy space operations
 */
type S = {
  pure: <S, A>(id: string, name: string) => Strategy<S, A>
  mixed: <S, A>(strategies: Strategy<S, A>[], probs: number[]) => Strategy<S, A>
  bestResponse: <S, A>(
    game: GameState,
    player: Player,
    opponentStrategies: Map<string, Strategy<S, A>>
  ) => Strategy<S, A>
}

/**
 * Nash operator type: Nash equilibrium computation
 */
type Nash = {
  findPure: (game: GameState) => NashEquilibrium[]
  findMixed: (game: GameState) => NashEquilibrium[]
  findIterative: (game: GameState) => NashEquilibrium | null
}
```

## 4. Type Inference

### 4.1 Hindley-Milner Type Inference

```typescript
/**
 * Type inference engine based on Hindley-Milner
 */
class TypeInference {
  private constraints: TypeConstraint[] = []
  private typeVarCounter = 0

  // Infer type of expression
  infer(expr: Expr, env: TypeEnv): Type {
    switch (expr.kind) {
      case 'Literal':
        return this.inferLiteral(expr)

      case 'Variable':
        return this.inferVariable(expr, env)

      case 'Application':
        return this.inferApplication(expr, env)

      case 'Lambda':
        return this.inferLambda(expr, env)

      case 'Let':
        return this.inferLet(expr, env)
    }
  }

  private inferApplication(expr: ApplicationExpr, env: TypeEnv): Type {
    const fnType = this.infer(expr.fn, env)
    const argType = this.infer(expr.arg, env)

    // Create fresh type variable for result
    const resultType = this.freshTypeVar()

    // Add constraint: fnType must be argType → resultType
    this.addConstraint({
      actual: fnType,
      expected: functionType(argType, resultType)
    })

    // Solve constraints
    const subst = this.solve()

    return this.apply(subst, resultType)
  }

  private solve(): Substitution {
    // Unification algorithm
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
    // Robinson's unification algorithm
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

  private freshTypeVar(): TypeVar {
    return {
      kind: 'TypeVar',
      name: `t${this.typeVarCounter++}`
    }
  }
}
```

### 4.2 Type Environment

```typescript
/**
 * Type environment: maps variables to types
 */
class TypeEnv {
  private bindings = new Map<string, Type>()

  lookup(name: string): Type | undefined {
    return this.bindings.get(name)
  }

  extend(name: string, type: Type): TypeEnv {
    const newEnv = new TypeEnv()
    newEnv.bindings = new Map(this.bindings)
    newEnv.bindings.set(name, type)
    return newEnv
  }

  // Generalization: ∀ free type variables
  generalize(type: Type): TypeScheme {
    const freeVars = this.freeTypeVars(type)
    return {
      kind: 'TypeScheme',
      vars: freeVars,
      type
    }
  }

  // Instantiation: replace quantified variables with fresh ones
  instantiate(scheme: TypeScheme): Type {
    const subst = new Map<string, Type>()
    for (const var_ of scheme.vars) {
      subst.set(var_, this.freshTypeVar())
    }
    return this.applySubst(subst, scheme.type)
  }
}
```

## 5. Type Checking

### 5.1 Type Checker

```typescript
/**
 * Type checker: validates type correctness
 */
class TypeChecker {
  check(expr: Expr, expectedType: Type, env: TypeEnv): void {
    const inferredType = this.inference.infer(expr, env)

    if (!this.typesEqual(inferredType, expectedType)) {
      throw new TypeError(
        `Type mismatch: expected ${formatType(expectedType)}, ` +
        `got ${formatType(inferredType)}`
      )
    }
  }

  checkOperation<In, Out>(
    op: Operation<In, Out>,
    input: In
  ): void {
    const inputType = this.inferType(input)

    if (!this.typesCompatible(inputType, op.inputType)) {
      throw new TypeError(
        `Operation ${op.metadata?.name || 'op'} expects ` +
        `${formatType(op.inputType)}, got ${formatType(inputType)}`
      )
    }
  }

  checkComposition<A, B, C>(
    f: Operation<A, B>,
    g: Operation<B, C>
  ): void {
    if (!this.typesCompatible(f.outputType, g.inputType)) {
      throw new TypeError(
        `Cannot compose: ${formatType(f.outputType)} is not ` +
        `compatible with ${formatType(g.inputType)}`
      )
    }
  }

  private typesEqual(t1: Type, t2: Type): boolean {
    // Structural equality
    if (t1.kind !== t2.kind) return false

    switch (t1.kind) {
      case 'Scalar':
        return t1.baseType === (t2 as ScalarType).baseType

      case 'Vector':
        return t1.length === (t2 as VectorType).length &&
               this.typesEqual(t1.elementType, (t2 as VectorType).elementType)

      case 'Matrix':
        return t1.rows === (t2 as MatrixType).rows &&
               t1.cols === (t2 as MatrixType).cols &&
               this.typesEqual(t1.elementType, (t2 as MatrixType).elementType)

      case 'Function':
        return this.typesEqual(t1.input, (t2 as FunctionType).input) &&
               this.typesEqual(t1.output, (t2 as FunctionType).output)

      default:
        return false
    }
  }

  private typesCompatible(t1: Type, t2: Type): boolean {
    // Check if t1 can be used where t2 is expected
    // Handles subtyping, coercion, etc.

    if (this.typesEqual(t1, t2)) return true

    // Numeric coercion
    if (isNumericType(t1) && isNumericType(t2)) {
      return this.canCoerce(t1, t2)
    }

    // Subtyping
    if (isSubtype(t1, t2)) return true

    return false
  }
}
```

### 5.2 Dependency-Level Type Checking

```typescript
/**
 * Check that operations respect dependency levels
 */
class DependencyTypeChecker {
  checkLevel(op: Operation<any, any>, dependencies: Symbol[]): void {
    const opLevel = op.metadata?.level || 0

    for (const dep of dependencies) {
      const depLevel = dep.def.level

      if (depLevel >= opLevel) {
        throw new TypeError(
          `Invalid dependency: ${dep.def.name} (level ${depLevel}) ` +
          `cannot be used in level ${opLevel} operation`
        )
      }
    }
  }

  checkLevelHierarchy(symbols: Symbol[]): void {
    // Verify entire symbol table respects level hierarchy
    for (const symbol of symbols) {
      this.checkLevel(symbol.implementation, symbol.dependencies)
    }
  }
}
```

## 6. Type Representations

### 6.1 Type AST

```typescript
type Type =
  | { kind: 'Scalar', baseType: 'number' | 'string' | 'boolean' }
  | { kind: 'Vector', length: number, elementType: Type }
  | { kind: 'Matrix', rows: number, cols: number, elementType: Type }
  | { kind: 'Tensor', shape: number[], elementType: Type }
  | { kind: 'Function', input: Type, output: Type }
  | { kind: 'TypeVar', name: string }
  | { kind: 'TypeApp', constructor: Type, args: Type[] }
  | { kind: 'Sequence', elementType: Type }
  | { kind: 'Strategy', stateType: Type, actionType: Type }
  | { kind: 'Game', playerTypes: Type[], actionTypes: Type[], utilityType: Type }

type TypeScheme = {
  kind: 'TypeScheme'
  vars: string[]  // Quantified type variables
  type: Type
}
```

### 6.2 Type Formatting

```typescript
function formatType(type: Type): string {
  switch (type.kind) {
    case 'Scalar':
      return type.baseType

    case 'Vector':
      return `Vec<${formatType(type.elementType)}, ${type.length}>`

    case 'Matrix':
      return `Mat<${formatType(type.elementType)}, ${type.rows}, ${type.cols}>`

    case 'Tensor':
      return `Tensor<${formatType(type.elementType)}, [${type.shape.join(', ')}]>`

    case 'Function':
      return `(${formatType(type.input)} → ${formatType(type.output)})`

    case 'TypeVar':
      return type.name

    case 'Sequence':
      return `Seq<${formatType(type.elementType)}>`

    case 'Strategy':
      return `Strategy<${formatType(type.stateType)}, ${formatType(type.actionType)}>`

    default:
      return 'unknown'
  }
}
```

## 7. Type System Examples

### 7.1 Basic Operations

```typescript
// φ: Composition
const double: Operation<number, number> = operation(
  x => x * 2,
  { kind: 'Scalar', baseType: 'number' },
  { kind: 'Scalar', baseType: 'number' }
)

const toString: Operation<number, string> = operation(
  x => x.toString(),
  { kind: 'Scalar', baseType: 'number' },
  { kind: 'Scalar', baseType: 'string' }
)

const doubleToString = Phi(double, toString)
// Type: Operation<number, string>

// ψ: Transformation
const optimized = Psi(double, op => memoize(op))
// Type: Operation<number, number> (same as input)
```

### 7.2 Sequence Operations

```typescript
// F: Sequence generation
const fibs = F.fibonacci()
// Type: SequenceOp<number>

// L: Limit computation
const limit = L.limit(fibs)
// Type: number

// Q: Quotient sequences
const ratios = Q.ratio(fibs)
// Type: SequenceOp<number>
```

### 7.3 Game Theory Operations

```typescript
// Define game
const game: GameState<[Player, Player], [Action, Action], number> = {
  _tag: 'GameState',
  players: [player1, player2],
  actions: [actions1, actions2],
  utilities: payoffMatrix
}

// S: Strategy operations
const strategy = S.pure<GameState, Action>('cooperate', 'Cooperate')
// Type: Strategy<GameState, Action>

// Nash: Equilibrium computation
const equilibria = Nash.findPure(game)
// Type: NashEquilibrium<Strategy<GameState, Action>[]>[]
```

## 8. Type System Properties

### 8.1 Soundness

**Theorem**: If `e: T` (expression e has type T), then evaluation of e produces a value of type T.

**Proof sketch**:
1. Induction on typing derivation
2. Show each typing rule preserves types
3. Prove progress and preservation lemmas

### 8.2 Completeness

**Theorem**: Every well-typed expression can be given a principal type.

**Proof**: Hindley-Milner type inference algorithm computes principal types.

### 8.3 Decidability

**Theorem**: Type checking is decidable.

**Proof**: Type inference terminates in polynomial time for System F.

## 9. Type System Extensions

### 9.1 Dependent Types (Future)

```typescript
// Length-indexed vectors with dependent types
type Vec<n: Nat, T> = ...

function vectorAdd<n: Nat, T: Numeric>(
  a: Vec<n, T>,
  b: Vec<n, T>
): Vec<n, T>

// Compile error: length mismatch
vectorAdd(vec2(1, 2), vec3(1, 2, 3))  // ERROR
```

### 9.2 Linear Types (Future)

```typescript
// Ensure resources are used exactly once
type Linear<T> = ...

function consume<T>(value: Linear<T>): void {
  // value cannot be used again after this
}

const x: Linear<Resource> = ...
consume(x)
consume(x)  // ERROR: x already consumed
```

## 10. Type System Implementation

### 10.1 Runtime Representation

```typescript
// Types are erased at runtime (zero overhead)
// But available for reflection if needed

interface TypeRepr {
  toJSON(): object
  equals(other: TypeRepr): boolean
  toString(): string
}

class ScalarTypeRepr implements TypeRepr {
  constructor(private baseType: 'number' | 'string' | 'boolean') {}

  toJSON() {
    return { kind: 'Scalar', baseType: this.baseType }
  }

  toString() {
    return this.baseType
  }
}
```

### 10.2 Performance Considerations

- Type checking done at compile time only
- Zero runtime overhead for type checks
- WASM modules get optimized types
- AgentDB stores type metadata for pattern learning

---

**Document Status**: Draft v1.0
**Last Updated**: 2025-11-12
**Related**: MATH_FRAMEWORK_ARCHITECTURE.md, MODULE_BREAKDOWN.md

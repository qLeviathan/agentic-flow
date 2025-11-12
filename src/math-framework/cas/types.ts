/**
 * Computer Algebra System - Type System
 *
 * Defines the mathematical type system for symbolic computation
 * with type safety and inference capabilities.
 */

/**
 * Core mathematical type hierarchy
 */
export type MathType =
  | NatType
  | IntType
  | RealType
  | ComplexType
  | SetType
  | FunctionType
  | MatrixType
  | VectorType
  | TupleType
  | TypeVariable;

/**
 * Natural numbers: ℕ = {0, 1, 2, 3, ...}
 */
export interface NatType {
  kind: 'Nat';
}

/**
 * Integers: ℤ = {..., -2, -1, 0, 1, 2, ...}
 */
export interface IntType {
  kind: 'Int';
}

/**
 * Real numbers: ℝ
 */
export interface RealType {
  kind: 'Real';
}

/**
 * Complex numbers: ℂ = {a + bi | a, b ∈ ℝ}
 */
export interface ComplexType {
  kind: 'Complex';
}

/**
 * Set type: Set<T>
 */
export interface SetType {
  kind: 'Set';
  element: MathType;
}

/**
 * Function type: T₁ → T₂
 */
export interface FunctionType {
  kind: 'Function';
  domain: MathType;
  codomain: MathType;
}

/**
 * Matrix type: Matrix<T, m, n>
 */
export interface MatrixType {
  kind: 'Matrix';
  base: MathType;
  rows: number;
  cols: number;
}

/**
 * Vector type: Vector<T, n>
 */
export interface VectorType {
  kind: 'Vector';
  base: MathType;
  dim: number;
}

/**
 * Tuple type: (T₁, T₂, ..., Tₙ)
 */
export interface TupleType {
  kind: 'Tuple';
  elements: MathType[];
}

/**
 * Type variable for polymorphic types
 */
export interface TypeVariable {
  kind: 'TypeVar';
  name: string;
  constraint?: MathType; // Upper bound constraint
}

/**
 * Type constructors
 */
export const MathTypes = {
  Nat: (): NatType => ({ kind: 'Nat' }),
  Int: (): IntType => ({ kind: 'Int' }),
  Real: (): RealType => ({ kind: 'Real' }),
  Complex: (): ComplexType => ({ kind: 'Complex' }),

  Set: (element: MathType): SetType => ({ kind: 'Set', element }),

  Function: (domain: MathType, codomain: MathType): FunctionType => ({
    kind: 'Function',
    domain,
    codomain,
  }),

  Matrix: (base: MathType, rows: number, cols: number): MatrixType => ({
    kind: 'Matrix',
    base,
    rows,
    cols,
  }),

  Vector: (base: MathType, dim: number): VectorType => ({
    kind: 'Vector',
    base,
    dim,
  }),

  Tuple: (elements: MathType[]): TupleType => ({
    kind: 'Tuple',
    elements,
  }),

  TypeVar: (name: string, constraint?: MathType): TypeVariable => ({
    kind: 'TypeVar',
    name,
    constraint,
  }),
};

/**
 * Type hierarchy for subtype relations
 * ℕ ⊆ ℤ ⊆ ℝ ⊆ ℂ
 */
export function isSubtype(subtype: MathType, supertype: MathType): boolean {
  // Reflexivity: T <: T
  if (typeEquals(subtype, supertype)) {
    return true;
  }

  // Numeric type hierarchy
  if (subtype.kind === 'Nat') {
    return supertype.kind === 'Int' || supertype.kind === 'Real' || supertype.kind === 'Complex';
  }

  if (subtype.kind === 'Int') {
    return supertype.kind === 'Real' || supertype.kind === 'Complex';
  }

  if (subtype.kind === 'Real') {
    return supertype.kind === 'Complex';
  }

  // Set covariance: Set<T> <: Set<U> if T <: U
  if (subtype.kind === 'Set' && supertype.kind === 'Set') {
    return isSubtype(subtype.element, supertype.element);
  }

  // Function contravariance in domain, covariance in codomain
  // (T₁ → T₂) <: (U₁ → U₂) if U₁ <: T₁ and T₂ <: U₂
  if (subtype.kind === 'Function' && supertype.kind === 'Function') {
    return (
      isSubtype(supertype.domain, subtype.domain) &&
      isSubtype(subtype.codomain, supertype.codomain)
    );
  }

  // Matrix and Vector covariance
  if (subtype.kind === 'Matrix' && supertype.kind === 'Matrix') {
    return (
      subtype.rows === supertype.rows &&
      subtype.cols === supertype.cols &&
      isSubtype(subtype.base, supertype.base)
    );
  }

  if (subtype.kind === 'Vector' && supertype.kind === 'Vector') {
    return (
      subtype.dim === supertype.dim &&
      isSubtype(subtype.base, supertype.base)
    );
  }

  // Tuple covariance
  if (subtype.kind === 'Tuple' && supertype.kind === 'Tuple') {
    if (subtype.elements.length !== supertype.elements.length) {
      return false;
    }
    return subtype.elements.every((t, i) =>
      isSubtype(t, supertype.elements[i])
    );
  }

  return false;
}

/**
 * Type equality check
 */
export function typeEquals(t1: MathType, t2: MathType): boolean {
  if (t1.kind !== t2.kind) {
    return false;
  }

  switch (t1.kind) {
    case 'Nat':
    case 'Int':
    case 'Real':
    case 'Complex':
      return true;

    case 'Set':
      return typeEquals((t1 as SetType).element, (t2 as SetType).element);

    case 'Function': {
      const f1 = t1 as FunctionType;
      const f2 = t2 as FunctionType;
      return typeEquals(f1.domain, f2.domain) && typeEquals(f1.codomain, f2.codomain);
    }

    case 'Matrix': {
      const m1 = t1 as MatrixType;
      const m2 = t2 as MatrixType;
      return m1.rows === m2.rows && m1.cols === m2.cols && typeEquals(m1.base, m2.base);
    }

    case 'Vector': {
      const v1 = t1 as VectorType;
      const v2 = t2 as VectorType;
      return v1.dim === v2.dim && typeEquals(v1.base, v2.base);
    }

    case 'Tuple': {
      const tu1 = t1 as TupleType;
      const tu2 = t2 as TupleType;
      if (tu1.elements.length !== tu2.elements.length) {
        return false;
      }
      return tu1.elements.every((e, i) => typeEquals(e, tu2.elements[i]));
    }

    case 'TypeVar': {
      const tv1 = t1 as TypeVariable;
      const tv2 = t2 as TypeVariable;
      return tv1.name === tv2.name;
    }

    default:
      return false;
  }
}

/**
 * Type promotion: find the least upper bound (LUB) of two types
 */
export function promoteTypes(t1: MathType, t2: MathType): MathType | null {
  // If types are equal, return either
  if (typeEquals(t1, t2)) {
    return t1;
  }

  // If either type is a type variable, we can't promote yet - return the more specific type
  if (t1.kind === 'TypeVar' && t2.kind !== 'TypeVar') {
    return t2; // Prefer concrete type over type variable
  }
  if (t2.kind === 'TypeVar' && t1.kind !== 'TypeVar') {
    return t1; // Prefer concrete type over type variable
  }
  if (t1.kind === 'TypeVar' && t2.kind === 'TypeVar') {
    return t1; // Both are type variables, return either
  }

  // Numeric type promotion hierarchy
  const numericHierarchy = ['Nat', 'Int', 'Real', 'Complex'];

  if (numericHierarchy.includes(t1.kind) && numericHierarchy.includes(t2.kind)) {
    const idx1 = numericHierarchy.indexOf(t1.kind);
    const idx2 = numericHierarchy.indexOf(t2.kind);
    const maxIdx = Math.max(idx1, idx2);

    switch (numericHierarchy[maxIdx]) {
      case 'Nat': return MathTypes.Nat();
      case 'Int': return MathTypes.Int();
      case 'Real': return MathTypes.Real();
      case 'Complex': return MathTypes.Complex();
    }
  }

  // Set promotion
  if (t1.kind === 'Set' && t2.kind === 'Set') {
    const elementPromotion = promoteTypes(t1.element, t2.element);
    if (elementPromotion) {
      return MathTypes.Set(elementPromotion);
    }
  }

  // No common type found
  return null;
}

/**
 * Pretty print type for error messages
 */
export function typeToString(type: MathType): string {
  switch (type.kind) {
    case 'Nat':
      return 'ℕ';
    case 'Int':
      return 'ℤ';
    case 'Real':
      return 'ℝ';
    case 'Complex':
      return 'ℂ';
    case 'Set':
      return `Set<${typeToString(type.element)}>`;
    case 'Function':
      return `${typeToString(type.domain)} → ${typeToString(type.codomain)}`;
    case 'Matrix':
      return `Matrix<${typeToString(type.base)}, ${type.rows}, ${type.cols}>`;
    case 'Vector':
      return `Vector<${typeToString(type.base)}, ${type.dim}>`;
    case 'Tuple':
      return `(${type.elements.map(typeToString).join(', ')})`;
    case 'TypeVar':
      return type.constraint ? `${type.name} <: ${typeToString(type.constraint)}` : type.name;
    default:
      return 'Unknown';
  }
}

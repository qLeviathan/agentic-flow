/**
 * Computer Algebra System - Type Checker
 *
 * Implements type checking and inference for mathematical expressions
 * with comprehensive error reporting and type safety guarantees.
 *
 * EXAMPLES from specification:
 * ✓ F(5) : ℤ          - Fibonacci of natural number returns integer
 * ✓ φ + ψ : ℝ         - Sum of reals is real
 * ✗ F(φ)              - Type error: φ is ℝ, need ℕ
 * ✗ S(F(5))           - Type error: F(5) is ℤ, need ℕ
 */

import {
  MathType,
  MathTypes,
  isSubtype,
  typeEquals,
  promoteTypes,
  typeToString,
} from './types';
import { Expression, exprToString } from './expressions';
import {
  TypeCheckError,
  TypeMismatchError,
  UnificationError,
  UndefinedVariableError,
  InvalidOperationError,
  ArityMismatchError,
  DimensionMismatchError,
  AnnotationMismatchError,
  OccursCheckError,
  ErrorReporter,
} from './errors';

/**
 * Type environment (context) for tracking variable types
 */
export class TypeEnvironment {
  private bindings: Map<string, MathType>;
  private parent?: TypeEnvironment;

  constructor(parent?: TypeEnvironment) {
    this.bindings = new Map();
    this.parent = parent;
  }

  /**
   * Bind a variable to a type
   */
  bind(name: string, type: MathType): void {
    this.bindings.set(name, type);
  }

  /**
   * Look up a variable's type
   */
  lookup(name: string): MathType | undefined {
    const type = this.bindings.get(name);
    if (type) {
      return type;
    }
    return this.parent?.lookup(name);
  }

  /**
   * Check if a variable is bound
   */
  has(name: string): boolean {
    return this.bindings.has(name) || (this.parent?.has(name) ?? false);
  }

  /**
   * Create a child environment
   */
  extend(): TypeEnvironment {
    return new TypeEnvironment(this);
  }

  /**
   * Get all bindings (including parent)
   */
  getAllBindings(): Map<string, MathType> {
    const all = new Map<string, MathType>();
    if (this.parent) {
      const parentBindings = this.parent.getAllBindings();
      parentBindings.forEach((type, name) => all.set(name, type));
    }
    this.bindings.forEach((type, name) => all.set(name, type));
    return all;
  }
}

/**
 * Substitution for type variables during unification
 */
export class Substitution {
  private substitutions: Map<string, MathType>;

  constructor() {
    this.substitutions = new Map();
  }

  /**
   * Add a substitution
   */
  add(typeVar: string, type: MathType): void {
    this.substitutions.set(typeVar, type);
  }

  /**
   * Apply substitution to a type
   */
  apply(type: MathType): MathType {
    switch (type.kind) {
      case 'TypeVar':
        const substituted = this.substitutions.get(type.name);
        return substituted ? this.apply(substituted) : type;

      case 'Set':
        return MathTypes.Set(this.apply(type.element));

      case 'Function':
        return MathTypes.Function(this.apply(type.domain), this.apply(type.codomain));

      case 'Matrix':
        return MathTypes.Matrix(this.apply(type.base), type.rows, type.cols);

      case 'Vector':
        return MathTypes.Vector(this.apply(type.base), type.dim);

      case 'Tuple':
        return MathTypes.Tuple(type.elements.map(t => this.apply(t)));

      default:
        return type;
    }
  }

  /**
   * Compose with another substitution
   */
  compose(other: Substitution): Substitution {
    const result = new Substitution();

    // Apply other to all our substitutions
    this.substitutions.forEach((type, name) => {
      result.add(name, other.apply(type));
    });

    // Add all substitutions from other that aren't in this
    other.substitutions.forEach((type, name) => {
      if (!this.substitutions.has(name)) {
        result.add(name, type);
      }
    });

    return result;
  }

  /**
   * Get all substitutions
   */
  getAll(): Map<string, MathType> {
    return new Map(this.substitutions);
  }
}

/**
 * Main type checker class
 */
export class TypeChecker {
  private env: TypeEnvironment;
  private reporter: ErrorReporter;
  private nextTypeVarId: number;

  constructor(initialEnv?: TypeEnvironment) {
    this.env = initialEnv || this.createStandardEnvironment();
    this.reporter = new ErrorReporter();
    this.nextTypeVarId = 0;
  }

  /**
   * Create standard environment with built-in symbols
   */
  private createStandardEnvironment(): TypeEnvironment {
    const env = new TypeEnvironment();

    // Mathematical constants
    env.bind('φ', MathTypes.Real()); // Golden ratio
    env.bind('ψ', MathTypes.Real()); // Golden ratio conjugate
    env.bind('π', MathTypes.Real()); // Pi
    env.bind('e', MathTypes.Real()); // Euler's number

    // Fibonacci function: ℕ → ℤ
    env.bind('F', MathTypes.Function(MathTypes.Nat(), MathTypes.Int()));

    // Successor function: ℕ → ℕ
    env.bind('S', MathTypes.Function(MathTypes.Nat(), MathTypes.Nat()));

    // Lucas function: ℕ → ℤ
    env.bind('L', MathTypes.Function(MathTypes.Nat(), MathTypes.Int()));

    // Zeckendorf sum: ℕ → ℕ
    env.bind('Z', MathTypes.Function(MathTypes.Nat(), MathTypes.Nat()));

    // Common mathematical functions
    env.bind('sin', MathTypes.Function(MathTypes.Real(), MathTypes.Real()));
    env.bind('cos', MathTypes.Function(MathTypes.Real(), MathTypes.Real()));
    env.bind('tan', MathTypes.Function(MathTypes.Real(), MathTypes.Real()));
    env.bind('exp', MathTypes.Function(MathTypes.Real(), MathTypes.Real()));
    env.bind('ln', MathTypes.Function(MathTypes.Real(), MathTypes.Real()));
    env.bind('abs', MathTypes.Function(MathTypes.Real(), MathTypes.Real()));
    env.bind('sqrt', MathTypes.Function(MathTypes.Real(), MathTypes.Real()));

    return env;
  }

  /**
   * Generate a fresh type variable
   */
  private freshTypeVar(): MathType {
    return MathTypes.TypeVar(`t${this.nextTypeVarId++}`);
  }

  /**
   * Main type checking entry point
   * Checks that an expression has the expected type
   */
  check(expr: Expression, expectedType: MathType): MathType {
    try {
      const inferredType = this.infer(expr);

      // Check if inferred type is compatible with expected type
      if (!isSubtype(inferredType, expectedType)) {
        this.reporter.addError(
          new TypeMismatchError(expectedType, inferredType, expr, expr.location)
        );
        return expectedType; // Return expected type to continue checking
      }

      // Annotate expression with its type
      expr.type = inferredType;
      return inferredType;
    } catch (error) {
      if (error instanceof TypeCheckError) {
        this.reporter.addError(error);
        return expectedType;
      }
      throw error;
    }
  }

  /**
   * Type inference
   * Infers the type of an expression
   */
  infer(expr: Expression): MathType {
    switch (expr.kind) {
      case 'Literal':
        return this.inferLiteral(expr);

      case 'Variable':
        return this.inferVariable(expr);

      case 'BinaryOp':
        return this.inferBinaryOp(expr);

      case 'UnaryOp':
        return this.inferUnaryOp(expr);

      case 'Application':
        return this.inferApplication(expr);

      case 'Lambda':
        return this.inferLambda(expr);

      case 'Let':
        return this.inferLet(expr);

      case 'If':
        return this.inferIf(expr);

      case 'Tuple':
        return this.inferTuple(expr);

      case 'Vector':
        return this.inferVector(expr);

      case 'Matrix':
        return this.inferMatrix(expr);

      case 'Set':
        return this.inferSet(expr);

      default:
        throw new TypeCheckError(
          `Unknown expression kind: ${(expr as any).kind}`,
          expr.location,
          expr
        );
    }
  }

  /**
   * Infer type of literal
   */
  private inferLiteral(expr: Expression): MathType {
    if (expr.kind !== 'Literal') {
      throw new Error('Expected Literal expression');
    }

    const { value } = expr;

    // Complex number
    if (typeof value === 'object' && 'real' in value) {
      return MathTypes.Complex();
    }

    // BigInt or integer
    if (typeof value === 'bigint' || Number.isInteger(value)) {
      if (typeof value === 'number' && value >= 0) {
        return MathTypes.Nat(); // Non-negative integer is natural
      }
      return MathTypes.Int();
    }

    // Real number
    return MathTypes.Real();
  }

  /**
   * Infer type of variable
   */
  private inferVariable(expr: Expression): MathType {
    if (expr.kind !== 'Variable') {
      throw new Error('Expected Variable expression');
    }

    const type = this.env.lookup(expr.name);
    if (!type) {
      throw new UndefinedVariableError(expr.name, expr, expr.location);
    }

    return type;
  }

  /**
   * Infer type of binary operation
   */
  private inferBinaryOp(expr: Expression): MathType {
    if (expr.kind !== 'BinaryOp') {
      throw new Error('Expected BinaryOp expression');
    }

    const leftType = this.infer(expr.left);
    const rightType = this.infer(expr.right);

    // Arithmetic operations: +, -, *, /, ^
    if (['+', '-', '*', '/'].includes(expr.operator)) {
      // Try to promote types
      const promoted = promoteTypes(leftType, rightType);
      if (!promoted) {
        throw new InvalidOperationError(
          expr.operator,
          [leftType, rightType],
          expr,
          expr.location
        );
      }
      return promoted;
    }

    // Exponentiation: base ^ exponent
    if (expr.operator === '^') {
      // Base should be numeric, exponent should be numeric
      const numericTypes = ['Nat', 'Int', 'Real', 'Complex', 'TypeVar'];
      if (!numericTypes.includes(leftType.kind) || !numericTypes.includes(rightType.kind)) {
        throw new InvalidOperationError('^', [leftType, rightType], expr, expr.location);
      }
      // Result is promoted type
      const promoted = promoteTypes(leftType, rightType);
      return promoted || (leftType.kind === 'TypeVar' ? leftType : rightType);
    }

    // Comparison operations: =, <, >, ≤, ≥
    if (['=', '<', '>', '≤', '≥'].includes(expr.operator)) {
      // Operands should be comparable (numeric types)
      const numericTypes = ['Nat', 'Int', 'Real'];
      if (!numericTypes.includes(leftType.kind) || !numericTypes.includes(rightType.kind)) {
        throw new InvalidOperationError(
          expr.operator,
          [leftType, rightType],
          expr,
          expr.location
        );
      }
      // Comparison returns boolean (we'll represent as Nat: 0 or 1)
      return MathTypes.Nat();
    }

    throw new InvalidOperationError(expr.operator, [leftType, rightType], expr, expr.location);
  }

  /**
   * Infer type of unary operation
   */
  private inferUnaryOp(expr: Expression): MathType {
    if (expr.kind !== 'UnaryOp') {
      throw new Error('Expected UnaryOp expression');
    }

    const operandType = this.infer(expr.operand);

    // Negation preserves type
    if (expr.operator === '-') {
      if (['Nat', 'Int', 'Real', 'Complex'].includes(operandType.kind)) {
        // Negation of Nat gives Int
        if (operandType.kind === 'Nat') {
          return MathTypes.Int();
        }
        return operandType;
      }
      throw new InvalidOperationError('-', [operandType], expr, expr.location);
    }

    // Square root: ℝ → ℝ or ℂ → ℂ
    if (expr.operator === '√') {
      if (operandType.kind === 'Complex') {
        return MathTypes.Complex();
      }
      if (['Nat', 'Int', 'Real'].includes(operandType.kind)) {
        return MathTypes.Real();
      }
      throw new InvalidOperationError('√', [operandType], expr, expr.location);
    }

    // Trigonometric and transcendental functions: ℝ → ℝ
    if (['sin', 'cos', 'tan', 'exp', 'ln', 'abs'].includes(expr.operator)) {
      if (['Nat', 'Int', 'Real'].includes(operandType.kind)) {
        return MathTypes.Real();
      }
      throw new InvalidOperationError(expr.operator, [operandType], expr, expr.location);
    }

    throw new InvalidOperationError(expr.operator, [operandType], expr, expr.location);
  }

  /**
   * Infer type of function application
   */
  private inferApplication(expr: Expression): MathType {
    if (expr.kind !== 'Application') {
      throw new Error('Expected Application expression');
    }

    const funcType = this.infer(expr.function);
    const argType = this.infer(expr.argument);

    // Function type should be T₁ → T₂
    if (funcType.kind !== 'Function') {
      throw new TypeCheckError(
        `Expected function type, got ${typeToString(funcType)}`,
        expr.location,
        expr
      );
    }

    // Check argument type matches domain
    // If domain is a type variable, try to unify with the argument type
    if (funcType.domain.kind === 'TypeVar') {
      try {
        const subst = this.unify(funcType.domain, argType);
        // Apply substitution to codomain
        return subst.apply(funcType.codomain);
      } catch {
        throw new TypeMismatchError(funcType.domain, argType, expr.argument, expr.argument.location);
      }
    } else if (!isSubtype(argType, funcType.domain)) {
      throw new TypeMismatchError(funcType.domain, argType, expr.argument, expr.argument.location);
    }

    return funcType.codomain;
  }

  /**
   * Infer type of lambda expression
   */
  private inferLambda(expr: Expression): MathType {
    if (expr.kind !== 'Lambda') {
      throw new Error('Expected Lambda expression');
    }

    // Use parameter type annotation or create a fresh type variable
    const paramType = expr.parameterType || this.freshTypeVar();

    // Extend environment with parameter binding
    const extendedEnv = this.env.extend();
    extendedEnv.bind(expr.parameter, paramType);

    // Infer body type in extended environment
    const oldEnv = this.env;
    this.env = extendedEnv;
    const bodyType = this.infer(expr.body);
    this.env = oldEnv;

    return MathTypes.Function(paramType, bodyType);
  }

  /**
   * Infer type of let expression
   */
  private inferLet(expr: Expression): MathType {
    if (expr.kind !== 'Let') {
      throw new Error('Expected Let expression');
    }

    // Infer type of value
    const valueType = this.infer(expr.value);

    // Check against type annotation if present
    if (expr.variableType && !isSubtype(valueType, expr.variableType)) {
      throw new AnnotationMismatchError(
        expr.variableType,
        valueType,
        expr.value,
        expr.value.location
      );
    }

    // Extend environment with variable binding
    const extendedEnv = this.env.extend();
    extendedEnv.bind(expr.variable, valueType);

    // Infer body type in extended environment
    const oldEnv = this.env;
    this.env = extendedEnv;
    const bodyType = this.infer(expr.body);
    this.env = oldEnv;

    return bodyType;
  }

  /**
   * Infer type of conditional expression
   */
  private inferIf(expr: Expression): MathType {
    if (expr.kind !== 'If') {
      throw new Error('Expected If expression');
    }

    // Condition should be boolean (represented as Nat)
    const condType = this.infer(expr.condition);
    // We're lenient: any numeric type can be used as condition

    const thenType = this.infer(expr.thenBranch);
    const elseType = this.infer(expr.elseBranch);

    // Both branches should have compatible types
    const resultType = promoteTypes(thenType, elseType);
    if (!resultType) {
      throw new UnificationError(thenType, elseType, expr, expr.location);
    }

    return resultType;
  }

  /**
   * Infer type of tuple
   */
  private inferTuple(expr: Expression): MathType {
    if (expr.kind !== 'Tuple') {
      throw new Error('Expected Tuple expression');
    }

    const elementTypes = expr.elements.map(e => this.infer(e));
    return MathTypes.Tuple(elementTypes);
  }

  /**
   * Infer type of vector
   */
  private inferVector(expr: Expression): MathType {
    if (expr.kind !== 'Vector') {
      throw new Error('Expected Vector expression');
    }

    if (expr.elements.length === 0) {
      // Empty vector has type Vector<t, 0> with fresh type variable
      return MathTypes.Vector(this.freshTypeVar(), 0);
    }

    // All elements should have the same type
    const firstType = this.infer(expr.elements[0]);
    let commonType = firstType;

    for (let i = 1; i < expr.elements.length; i++) {
      const elemType = this.infer(expr.elements[i]);
      const promoted = promoteTypes(commonType, elemType);
      if (!promoted) {
        throw new TypeCheckError(
          `Inconsistent vector element types: ${typeToString(commonType)} and ${typeToString(
            elemType
          )}`,
          expr.elements[i].location,
          expr.elements[i]
        );
      }
      commonType = promoted;
    }

    return MathTypes.Vector(commonType, expr.elements.length);
  }

  /**
   * Infer type of matrix
   */
  private inferMatrix(expr: Expression): MathType {
    if (expr.kind !== 'Matrix') {
      throw new Error('Expected Matrix expression');
    }

    if (expr.rows.length === 0) {
      // Empty matrix
      return MathTypes.Matrix(this.freshTypeVar(), 0, 0);
    }

    const numRows = expr.rows.length;
    const numCols = expr.rows[0].length;

    // Check all rows have same length
    for (let i = 1; i < expr.rows.length; i++) {
      if (expr.rows[i].length !== numCols) {
        throw new DimensionMismatchError(
          [numRows, numCols],
          [numRows, expr.rows[i].length],
          'matrix',
          expr,
          expr.location
        );
      }
    }

    // Infer common type for all elements
    let commonType: MathType | null = null;

    for (const row of expr.rows) {
      for (const elem of row) {
        const elemType = this.infer(elem);
        if (!commonType) {
          commonType = elemType;
        } else {
          const promoted = promoteTypes(commonType, elemType);
          if (!promoted) {
            throw new TypeCheckError(
              `Inconsistent matrix element types: ${typeToString(commonType)} and ${typeToString(
                elemType
              )}`,
              elem.location,
              elem
            );
          }
          commonType = promoted;
        }
      }
    }

    return MathTypes.Matrix(commonType || this.freshTypeVar(), numRows, numCols);
  }

  /**
   * Infer type of set
   */
  private inferSet(expr: Expression): MathType {
    if (expr.kind !== 'Set') {
      throw new Error('Expected Set expression');
    }

    // Literal set
    if (expr.elements) {
      if (expr.elements.length === 0) {
        return MathTypes.Set(this.freshTypeVar());
      }

      // All elements should have compatible types
      let commonType = this.infer(expr.elements[0]);
      for (let i = 1; i < expr.elements.length; i++) {
        const elemType = this.infer(expr.elements[i]);
        const promoted = promoteTypes(commonType, elemType);
        if (!promoted) {
          throw new TypeCheckError(
            `Inconsistent set element types: ${typeToString(commonType)} and ${typeToString(
              elemType
            )}`,
            expr.elements[i].location,
            expr.elements[i]
          );
        }
        commonType = promoted;
      }

      return MathTypes.Set(commonType);
    }

    // Set comprehension
    if (expr.generator) {
      const domainType = this.infer(expr.generator.domain);

      // Domain should be a set
      if (domainType.kind !== 'Set') {
        throw new TypeCheckError(
          `Set comprehension domain must be a set, got ${typeToString(domainType)}`,
          expr.generator.domain.location,
          expr.generator.domain
        );
      }

      // Extend environment with generator variable
      const extendedEnv = this.env.extend();
      extendedEnv.bind(expr.generator.variable, domainType.element);

      const oldEnv = this.env;
      this.env = extendedEnv;

      // Check condition if present
      if (expr.generator.condition) {
        this.infer(expr.generator.condition);
      }

      // Infer body type
      const bodyType = this.infer(expr.generator.body);

      this.env = oldEnv;

      return MathTypes.Set(bodyType);
    }

    return MathTypes.Set(this.freshTypeVar());
  }

  /**
   * Type unification
   * Attempts to unify two types, returning a substitution or throwing an error
   */
  unify(t1: MathType, t2: MathType): Substitution {
    const subst = new Substitution();
    this.unifyHelper(t1, t2, subst);
    return subst;
  }

  /**
   * Helper for unification
   */
  private unifyHelper(t1: MathType, t2: MathType, subst: Substitution): void {
    // Apply current substitution
    const t1Sub = subst.apply(t1);
    const t2Sub = subst.apply(t2);

    // If types are equal, nothing to do
    if (typeEquals(t1Sub, t2Sub)) {
      return;
    }

    // Type variable unification
    if (t1Sub.kind === 'TypeVar') {
      this.unifyVar(t1Sub.name, t2Sub, subst);
      return;
    }

    if (t2Sub.kind === 'TypeVar') {
      this.unifyVar(t2Sub.name, t1Sub, subst);
      return;
    }

    // Structural unification
    if (t1Sub.kind === 'Set' && t2Sub.kind === 'Set') {
      this.unifyHelper(t1Sub.element, t2Sub.element, subst);
      return;
    }

    if (t1Sub.kind === 'Function' && t2Sub.kind === 'Function') {
      this.unifyHelper(t1Sub.domain, t2Sub.domain, subst);
      this.unifyHelper(t1Sub.codomain, t2Sub.codomain, subst);
      return;
    }

    if (t1Sub.kind === 'Matrix' && t2Sub.kind === 'Matrix') {
      if (t1Sub.rows !== t2Sub.rows || t1Sub.cols !== t2Sub.cols) {
        throw new UnificationError(t1Sub, t2Sub);
      }
      this.unifyHelper(t1Sub.base, t2Sub.base, subst);
      return;
    }

    if (t1Sub.kind === 'Vector' && t2Sub.kind === 'Vector') {
      if (t1Sub.dim !== t2Sub.dim) {
        throw new UnificationError(t1Sub, t2Sub);
      }
      this.unifyHelper(t1Sub.base, t2Sub.base, subst);
      return;
    }

    if (t1Sub.kind === 'Tuple' && t2Sub.kind === 'Tuple') {
      if (t1Sub.elements.length !== t2Sub.elements.length) {
        throw new UnificationError(t1Sub, t2Sub);
      }
      for (let i = 0; i < t1Sub.elements.length; i++) {
        this.unifyHelper(t1Sub.elements[i], t2Sub.elements[i], subst);
      }
      return;
    }

    // Cannot unify
    throw new UnificationError(t1Sub, t2Sub);
  }

  /**
   * Unify a type variable with a type
   */
  private unifyVar(varName: string, type: MathType, subst: Substitution): void {
    // Occurs check: prevent infinite types
    if (this.occursIn(varName, type)) {
      throw new OccursCheckError(varName, type);
    }

    // Check constraint if present
    const typeVar = MathTypes.TypeVar(varName);
    if (typeVar.kind === 'TypeVar' && typeVar.constraint) {
      if (!isSubtype(type, typeVar.constraint)) {
        throw new TypeCheckError(
          `Type ${typeToString(type)} does not satisfy constraint ${typeToString(
            typeVar.constraint
          )}`
        );
      }
    }

    subst.add(varName, type);
  }

  /**
   * Occurs check: does a type variable occur in a type?
   */
  private occursIn(varName: string, type: MathType): boolean {
    if (type.kind === 'TypeVar') {
      return type.name === varName;
    }

    if (type.kind === 'Set') {
      return this.occursIn(varName, type.element);
    }

    if (type.kind === 'Function') {
      return this.occursIn(varName, type.domain) || this.occursIn(varName, type.codomain);
    }

    if (type.kind === 'Matrix') {
      return this.occursIn(varName, type.base);
    }

    if (type.kind === 'Vector') {
      return this.occursIn(varName, type.base);
    }

    if (type.kind === 'Tuple') {
      return type.elements.some(t => this.occursIn(varName, t));
    }

    return false;
  }

  /**
   * Get the current type environment
   */
  getEnvironment(): TypeEnvironment {
    return this.env;
  }

  /**
   * Get the error reporter
   */
  getReporter(): ErrorReporter {
    return this.reporter;
  }

  /**
   * Check if there are any type errors
   */
  hasErrors(): boolean {
    return this.reporter.hasErrors();
  }

  /**
   * Get all errors
   */
  getErrors(): TypeCheckError[] {
    return this.reporter.getErrors();
  }

  /**
   * Format all errors
   */
  formatErrors(): string {
    return this.reporter.format();
  }
}

/**
 * Convenience function to type check an expression
 */
export function typeCheck(expr: Expression, env?: TypeEnvironment): MathType {
  const checker = new TypeChecker(env);
  const type = checker.infer(expr);

  if (checker.hasErrors()) {
    throw new Error(checker.formatErrors());
  }

  return type;
}

/**
 * Convenience function to check if an expression is well-typed
 */
export function isWellTyped(expr: Expression, env?: TypeEnvironment): boolean {
  try {
    typeCheck(expr, env);
    return true;
  } catch {
    return false;
  }
}

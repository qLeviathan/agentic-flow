/**
 * Computer Algebra System (CAS) - Main Export
 *
 * Complete type-safe computer algebra system with:
 * - Type signatures for all symbols
 * - Type inference engine
 * - Type checking for expressions
 * - Error reporting for type mismatches
 * - Symbolic computation with type safety
 */

// Core types
export * from './types';
export type {
  MathType,
  NatType,
  IntType,
  RealType,
  ComplexType,
  SetType,
  FunctionType,
  MatrixType,
  VectorType,
  TupleType,
  TypeVariable,
} from './types';

export {
  MathTypes,
  isSubtype,
  typeEquals,
  promoteTypes,
  typeToString,
} from './types';

// Expressions
export * from './expressions';
export type {
  Expression,
  LiteralExpr,
  VariableExpr,
  BinaryOpExpr,
  UnaryOpExpr,
  ApplicationExpr,
  LambdaExpr,
  LetExpr,
  IfExpr,
  TupleExpr,
  VectorExpr,
  MatrixExpr,
  SetExpr,
  SourceLocation,
} from './expressions';

export { Expr, exprToString } from './expressions';

// Error handling
export * from './errors';
export {
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
  formatErrorWithContext,
} from './errors';

// Type checker
export * from './type-checker';
export {
  TypeChecker,
  TypeEnvironment,
  Substitution,
  typeCheck,
  isWellTyped,
} from './type-checker';

/**
 * Quick start guide and examples
 */
export const CAS = {
  /**
   * Create a new type checker with standard mathematical environment
   */
  createChecker(): TypeChecker {
    return new TypeChecker();
  },

  /**
   * Type check an expression and return its type
   */
  check(expr: Expression): MathType {
    return typeCheck(expr);
  },

  /**
   * Check if an expression is well-typed
   */
  isValid(expr: Expression): boolean {
    return isWellTyped(expr);
  },

  /**
   * Pretty print an expression
   */
  print(expr: Expression): string {
    return exprToString(expr);
  },

  /**
   * Pretty print a type
   */
  printType(type: MathType): string {
    return typeToString(type);
  },
};

// Re-export for convenience
import { TypeChecker } from './type-checker';
import { typeCheck, isWellTyped } from './type-checker';
import { MathTypes } from './types';
import { Expr, exprToString } from './expressions';
import { typeToString, MathType } from './types';
import { Expression } from './expressions';

export default CAS;

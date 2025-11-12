/**
 * Computer Algebra System - Error Reporting
 *
 * Comprehensive error types and reporting for type checking
 * and symbolic computation.
 */

import { MathType, typeToString } from './types';
import { Expression, exprToString, SourceLocation } from './expressions';

/**
 * Base type error with location information
 */
export class TypeCheckError extends Error {
  constructor(
    message: string,
    public readonly location?: SourceLocation,
    public readonly expression?: Expression
  ) {
    super(message);
    this.name = 'TypeCheckError';
  }

  /**
   * Format error message with location
   */
  format(): string {
    let msg = `${this.name}: ${this.message}`;

    if (this.location) {
      msg += `\n  at line ${this.location.line}, column ${this.location.column}`;
    }

    if (this.expression) {
      msg += `\n  in expression: ${exprToString(this.expression)}`;
    }

    return msg;
  }
}

/**
 * Type mismatch error
 */
export class TypeMismatchError extends TypeCheckError {
  constructor(
    public readonly expected: MathType,
    public readonly actual: MathType,
    expression?: Expression,
    location?: SourceLocation
  ) {
    const message = `Type mismatch: expected ${typeToString(expected)}, but got ${typeToString(
      actual
    )}`;
    super(message, location, expression);
    this.name = 'TypeMismatchError';
  }
}

/**
 * Unification failure error
 */
export class UnificationError extends TypeCheckError {
  constructor(
    public readonly type1: MathType,
    public readonly type2: MathType,
    expression?: Expression,
    location?: SourceLocation
  ) {
    const message = `Cannot unify types ${typeToString(type1)} and ${typeToString(type2)}`;
    super(message, location, expression);
    this.name = 'UnificationError';
  }
}

/**
 * Undefined variable error
 */
export class UndefinedVariableError extends TypeCheckError {
  constructor(
    public readonly variableName: string,
    expression?: Expression,
    location?: SourceLocation
  ) {
    const message = `Undefined variable: ${variableName}`;
    super(message, location, expression);
    this.name = 'UndefinedVariableError';
  }
}

/**
 * Invalid operation error
 */
export class InvalidOperationError extends TypeCheckError {
  constructor(
    public readonly operation: string,
    public readonly operandTypes: MathType[],
    expression?: Expression,
    location?: SourceLocation
  ) {
    const typeStrs = operandTypes.map(typeToString).join(', ');
    const message = `Invalid operation ${operation} for types: ${typeStrs}`;
    super(message, location, expression);
    this.name = 'InvalidOperationError';
  }
}

/**
 * Arity mismatch error
 */
export class ArityMismatchError extends TypeCheckError {
  constructor(
    public readonly expected: number,
    public readonly actual: number,
    public readonly context: string,
    expression?: Expression,
    location?: SourceLocation
  ) {
    const message = `Arity mismatch in ${context}: expected ${expected} arguments, got ${actual}`;
    super(message, location, expression);
    this.name = 'ArityMismatchError';
  }
}

/**
 * Dimension mismatch error (for matrices and vectors)
 */
export class DimensionMismatchError extends TypeCheckError {
  constructor(
    public readonly expectedDims: number[],
    public readonly actualDims: number[],
    public readonly context: string,
    expression?: Expression,
    location?: SourceLocation
  ) {
    const message = `Dimension mismatch in ${context}: expected ${expectedDims.join(
      'x'
    )}, got ${actualDims.join('x')}`;
    super(message, location, expression);
    this.name = 'DimensionMismatchError';
  }
}

/**
 * Constraint violation error
 */
export class ConstraintViolationError extends TypeCheckError {
  constructor(
    public readonly constraint: string,
    public readonly violatingType: MathType,
    expression?: Expression,
    location?: SourceLocation
  ) {
    const message = `Constraint violation: ${constraint} violated by type ${typeToString(
      violatingType
    )}`;
    super(message, location, expression);
    this.name = 'ConstraintViolationError';
  }
}

/**
 * Type annotation mismatch error
 */
export class AnnotationMismatchError extends TypeCheckError {
  constructor(
    public readonly annotated: MathType,
    public readonly inferred: MathType,
    expression?: Expression,
    location?: SourceLocation
  ) {
    const message = `Type annotation mismatch: annotated as ${typeToString(
      annotated
    )}, but inferred as ${typeToString(inferred)}`;
    super(message, location, expression);
    this.name = 'AnnotationMismatchError';
  }
}

/**
 * Occurs check failure (for recursive type detection)
 */
export class OccursCheckError extends TypeCheckError {
  constructor(
    public readonly typeVar: string,
    public readonly containingType: MathType,
    expression?: Expression,
    location?: SourceLocation
  ) {
    const message = `Occurs check failed: type variable ${typeVar} occurs in ${typeToString(
      containingType
    )}`;
    super(message, location, expression);
    this.name = 'OccursCheckError';
  }
}

/**
 * Error reporter for collecting and formatting multiple errors
 */
export class ErrorReporter {
  private errors: TypeCheckError[] = [];
  private warnings: string[] = [];

  /**
   * Add an error
   */
  addError(error: TypeCheckError): void {
    this.errors.push(error);
  }

  /**
   * Add a warning
   */
  addWarning(message: string, location?: SourceLocation): void {
    let warning = `Warning: ${message}`;
    if (location) {
      warning += ` at line ${location.line}, column ${location.column}`;
    }
    this.warnings.push(warning);
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Get all errors
   */
  getErrors(): TypeCheckError[] {
    return [...this.errors];
  }

  /**
   * Get all warnings
   */
  getWarnings(): string[] {
    return [...this.warnings];
  }

  /**
   * Format all errors and warnings
   */
  format(): string {
    const parts: string[] = [];

    if (this.errors.length > 0) {
      parts.push('Errors:');
      this.errors.forEach((error, i) => {
        parts.push(`\n${i + 1}. ${error.format()}`);
      });
    }

    if (this.warnings.length > 0) {
      if (parts.length > 0) {
        parts.push('\n');
      }
      parts.push('Warnings:');
      this.warnings.forEach((warning, i) => {
        parts.push(`\n${i + 1}. ${warning}`);
      });
    }

    return parts.join('');
  }

  /**
   * Throw if there are any errors
   */
  throwIfErrors(): void {
    if (this.hasErrors()) {
      throw new Error(this.format());
    }
  }

  /**
   * Clear all errors and warnings
   */
  clear(): void {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Get error count
   */
  errorCount(): number {
    return this.errors.length;
  }

  /**
   * Get warning count
   */
  warningCount(): number {
    return this.warnings.length;
  }
}

/**
 * Create formatted error message with context
 */
export function formatErrorWithContext(
  error: TypeCheckError,
  sourceCode?: string
): string {
  let formatted = error.format();

  if (sourceCode && error.location) {
    const lines = sourceCode.split('\n');
    const line = lines[error.location.line - 1];

    if (line) {
      formatted += `\n  ${line}`;
      formatted += `\n  ${' '.repeat(error.location.column - 1)}^`;
      if (error.location.length && error.location.length > 1) {
        formatted += '~'.repeat(error.location.length - 1);
      }
    }
  }

  return formatted;
}

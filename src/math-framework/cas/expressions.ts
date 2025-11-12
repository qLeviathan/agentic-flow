/**
 * Computer Algebra System - Expression AST
 *
 * Defines the abstract syntax tree for mathematical expressions
 * used in symbolic computation.
 */

import { MathType } from './types';

/**
 * Source location for error reporting
 */
export interface SourceLocation {
  line: number;
  column: number;
  length?: number;
}

/**
 * Base expression with optional type annotation and location
 */
export interface BaseExpression {
  type?: MathType; // Inferred or annotated type
  location?: SourceLocation;
}

/**
 * Mathematical expression types
 */
export type Expression =
  | LiteralExpr
  | VariableExpr
  | BinaryOpExpr
  | UnaryOpExpr
  | ApplicationExpr
  | LambdaExpr
  | LetExpr
  | IfExpr
  | TupleExpr
  | VectorExpr
  | MatrixExpr
  | SetExpr;

/**
 * Literal numeric value
 */
export interface LiteralExpr extends BaseExpression {
  kind: 'Literal';
  value: number | bigint | { real: number; imaginary: number };
}

/**
 * Variable reference
 */
export interface VariableExpr extends BaseExpression {
  kind: 'Variable';
  name: string;
}

/**
 * Binary operation: e1 op e2
 */
export interface BinaryOpExpr extends BaseExpression {
  kind: 'BinaryOp';
  operator: '+' | '-' | '*' | '/' | '^' | '=' | '<' | '>' | '≤' | '≥';
  left: Expression;
  right: Expression;
}

/**
 * Unary operation: op e
 */
export interface UnaryOpExpr extends BaseExpression {
  kind: 'UnaryOp';
  operator: '-' | '√' | '!' | 'sin' | 'cos' | 'tan' | 'exp' | 'ln' | 'abs';
  operand: Expression;
}

/**
 * Function application: f(x)
 */
export interface ApplicationExpr extends BaseExpression {
  kind: 'Application';
  function: Expression;
  argument: Expression;
}

/**
 * Lambda abstraction: λx. e
 */
export interface LambdaExpr extends BaseExpression {
  kind: 'Lambda';
  parameter: string;
  parameterType?: MathType;
  body: Expression;
}

/**
 * Let binding: let x = e1 in e2
 */
export interface LetExpr extends BaseExpression {
  kind: 'Let';
  variable: string;
  variableType?: MathType;
  value: Expression;
  body: Expression;
}

/**
 * Conditional: if cond then e1 else e2
 */
export interface IfExpr extends BaseExpression {
  kind: 'If';
  condition: Expression;
  thenBranch: Expression;
  elseBranch: Expression;
}

/**
 * Tuple: (e1, e2, ..., en)
 */
export interface TupleExpr extends BaseExpression {
  kind: 'Tuple';
  elements: Expression[];
}

/**
 * Vector: [e1, e2, ..., en]
 */
export interface VectorExpr extends BaseExpression {
  kind: 'Vector';
  elements: Expression[];
}

/**
 * Matrix: [[e11, e12], [e21, e22], ...]
 */
export interface MatrixExpr extends BaseExpression {
  kind: 'Matrix';
  rows: Expression[][];
}

/**
 * Set literal or comprehension: {e1, e2, ...} or {e | condition}
 */
export interface SetExpr extends BaseExpression {
  kind: 'Set';
  elements?: Expression[]; // For literal sets
  generator?: {
    // For set comprehensions
    variable: string;
    domain: Expression;
    condition?: Expression;
    body: Expression;
  };
}

/**
 * Expression constructors
 */
export const Expr = {
  /**
   * Create a literal expression
   */
  literal(value: number | bigint | { real: number; imaginary: number }): LiteralExpr {
    return { kind: 'Literal', value };
  },

  /**
   * Create a variable reference
   */
  variable(name: string): VariableExpr {
    return { kind: 'Variable', name };
  },

  /**
   * Create a binary operation
   */
  binaryOp(
    operator: BinaryOpExpr['operator'],
    left: Expression,
    right: Expression
  ): BinaryOpExpr {
    return { kind: 'BinaryOp', operator, left, right };
  },

  /**
   * Create a unary operation
   */
  unaryOp(operator: UnaryOpExpr['operator'], operand: Expression): UnaryOpExpr {
    return { kind: 'UnaryOp', operator, operand };
  },

  /**
   * Create a function application
   */
  application(func: Expression, argument: Expression): ApplicationExpr {
    return { kind: 'Application', function: func, argument };
  },

  /**
   * Create a lambda expression
   */
  lambda(parameter: string, body: Expression, parameterType?: MathType): LambdaExpr {
    return { kind: 'Lambda', parameter, parameterType, body };
  },

  /**
   * Create a let binding
   */
  let(
    variable: string,
    value: Expression,
    body: Expression,
    variableType?: MathType
  ): LetExpr {
    return { kind: 'Let', variable, variableType, value, body };
  },

  /**
   * Create a conditional expression
   */
  if(condition: Expression, thenBranch: Expression, elseBranch: Expression): IfExpr {
    return { kind: 'If', condition, thenBranch, elseBranch };
  },

  /**
   * Create a tuple
   */
  tuple(elements: Expression[]): TupleExpr {
    return { kind: 'Tuple', elements };
  },

  /**
   * Create a vector
   */
  vector(elements: Expression[]): VectorExpr {
    return { kind: 'Vector', elements };
  },

  /**
   * Create a matrix
   */
  matrix(rows: Expression[][]): MatrixExpr {
    return { kind: 'Matrix', rows };
  },

  /**
   * Create a set literal
   */
  set(elements: Expression[]): SetExpr {
    return { kind: 'Set', elements };
  },

  /**
   * Create a set comprehension
   */
  setComprehension(
    variable: string,
    domain: Expression,
    body: Expression,
    condition?: Expression
  ): SetExpr {
    return {
      kind: 'Set',
      generator: { variable, domain, body, condition },
    };
  },

  // Convenience constructors for common operations
  add: (left: Expression, right: Expression): BinaryOpExpr =>
    Expr.binaryOp('+', left, right),

  subtract: (left: Expression, right: Expression): BinaryOpExpr =>
    Expr.binaryOp('-', left, right),

  multiply: (left: Expression, right: Expression): BinaryOpExpr =>
    Expr.binaryOp('*', left, right),

  divide: (left: Expression, right: Expression): BinaryOpExpr =>
    Expr.binaryOp('/', left, right),

  power: (left: Expression, right: Expression): BinaryOpExpr =>
    Expr.binaryOp('^', left, right),

  negate: (operand: Expression): UnaryOpExpr =>
    Expr.unaryOp('-', operand),

  sqrt: (operand: Expression): UnaryOpExpr =>
    Expr.unaryOp('√', operand),

  abs: (operand: Expression): UnaryOpExpr =>
    Expr.unaryOp('abs', operand),
};

/**
 * Pretty print expression for debugging
 */
export function exprToString(expr: Expression): string {
  switch (expr.kind) {
    case 'Literal':
      if (typeof expr.value === 'object' && 'real' in expr.value) {
        return `${expr.value.real} + ${expr.value.imaginary}i`;
      }
      return expr.value.toString();

    case 'Variable':
      return expr.name;

    case 'BinaryOp':
      return `(${exprToString(expr.left)} ${expr.operator} ${exprToString(expr.right)})`;

    case 'UnaryOp':
      return `${expr.operator}(${exprToString(expr.operand)})`;

    case 'Application':
      return `${exprToString(expr.function)}(${exprToString(expr.argument)})`;

    case 'Lambda':
      return `λ${expr.parameter}. ${exprToString(expr.body)}`;

    case 'Let':
      return `let ${expr.variable} = ${exprToString(expr.value)} in ${exprToString(expr.body)}`;

    case 'If':
      return `if ${exprToString(expr.condition)} then ${exprToString(
        expr.thenBranch
      )} else ${exprToString(expr.elseBranch)}`;

    case 'Tuple':
      return `(${expr.elements.map(exprToString).join(', ')})`;

    case 'Vector':
      return `[${expr.elements.map(exprToString).join(', ')}]`;

    case 'Matrix':
      return `[${expr.rows.map(row => `[${row.map(exprToString).join(', ')}]`).join(', ')}]`;

    case 'Set':
      if (expr.elements) {
        return `{${expr.elements.map(exprToString).join(', ')}}`;
      } else if (expr.generator) {
        const cond = expr.generator.condition
          ? ` | ${exprToString(expr.generator.condition)}`
          : '';
        return `{${exprToString(expr.generator.body)} | ${
          expr.generator.variable
        } ∈ ${exprToString(expr.generator.domain)}${cond}}`;
      }
      return '{}';

    default:
      return 'UnknownExpr';
  }
}

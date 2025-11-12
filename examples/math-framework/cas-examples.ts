/**
 * Computer Algebra System - Usage Examples
 *
 * Demonstrates the type-safe CAS with various mathematical expressions
 * including the specification examples.
 */

import {
  CAS,
  TypeChecker,
  MathTypes,
  Expr,
  typeToString,
  exprToString,
  TypeMismatchError,
} from '../../src/math-framework/cas';

console.log('='.repeat(80));
console.log('Computer Algebra System - Examples');
console.log('='.repeat(80));
console.log();

/**
 * Example 1: Valid expressions from specification
 */
console.log('📋 SPECIFICATION EXAMPLES - VALID');
console.log('-'.repeat(80));

// ✓ F(5) : ℤ
try {
  const expr = Expr.application(Expr.variable('F'), Expr.literal(5));
  const type = CAS.check(expr);

  console.log(`✓ Expression: ${exprToString(expr)}`);
  console.log(`  Type: ${typeToString(type)}`);
  console.log(`  Result: Fibonacci of natural number returns integer`);
  console.log();
} catch (error) {
  console.error('Unexpected error:', error);
}

// ✓ φ + ψ : ℝ
try {
  const expr = Expr.add(Expr.variable('φ'), Expr.variable('ψ'));
  const type = CAS.check(expr);

  console.log(`✓ Expression: ${exprToString(expr)}`);
  console.log(`  Type: ${typeToString(type)}`);
  console.log(`  Result: Sum of golden ratio and conjugate is real`);
  console.log();
} catch (error) {
  console.error('Unexpected error:', error);
}

/**
 * Example 2: Invalid expressions from specification (type errors)
 */
console.log('📋 SPECIFICATION EXAMPLES - TYPE ERRORS');
console.log('-'.repeat(80));

// ✗ F(φ) - type error: φ is ℝ, need ℕ
try {
  const checker = new TypeChecker();
  const expr = Expr.application(Expr.variable('F'), Expr.variable('φ'));

  console.log(`✗ Expression: ${exprToString(expr)}`);
  checker.infer(expr);
} catch (error) {
  if (error instanceof Error) {
    console.log(`  Error: Type mismatch`);
    console.log(`  Details: F expects ℕ (natural number), but φ is ℝ (real number)`);
    console.log(`  Message: ${error.message}`);
    console.log();
  }
}

// ✗ S(F(5)) - type error: F(5) is ℤ, need ℕ
try {
  const checker = new TypeChecker();
  const innerExpr = Expr.application(Expr.variable('F'), Expr.literal(5));
  const expr = Expr.application(Expr.variable('S'), innerExpr);

  console.log(`✗ Expression: ${exprToString(expr)}`);
  checker.infer(expr);
} catch (error) {
  if (error instanceof Error) {
    console.log(`  Error: Type mismatch`);
    console.log(`  Details: S expects ℕ, but F(5) returns ℤ (may be negative)`);
    console.log(`  Message: ${error.message}`);
    console.log();
  }
}

/**
 * Example 3: Arithmetic expressions
 */
console.log('🔢 ARITHMETIC EXPRESSIONS');
console.log('-'.repeat(80));

// Natural number arithmetic
const nat1 = Expr.add(Expr.literal(3), Expr.literal(5));
console.log(`Expression: ${exprToString(nat1)}`);
console.log(`Type: ${typeToString(CAS.check(nat1))}`);
console.log();

// Mixed type arithmetic with promotion
const mixed = Expr.multiply(Expr.literal(3), Expr.literal(3.14));
console.log(`Expression: ${exprToString(mixed)}`);
console.log(`Type: ${typeToString(CAS.check(mixed))} (promoted from ℕ)`);
console.log();

// Complex arithmetic
const complex = Expr.add(
  Expr.literal(3),
  Expr.literal({ real: 2, imaginary: 4 })
);
console.log(`Expression: ${exprToString(complex)}`);
console.log(`Type: ${typeToString(CAS.check(complex))} (promoted to complex)`);
console.log();

/**
 * Example 4: Mathematical functions
 */
console.log('📐 MATHEMATICAL FUNCTIONS');
console.log('-'.repeat(80));

// Trigonometric functions
const trig = Expr.application(Expr.variable('sin'), Expr.variable('π'));
console.log(`Expression: ${exprToString(trig)}`);
console.log(`Type: ${typeToString(CAS.check(trig))}`);
console.log();

// Nested functions
const nested = Expr.application(
  Expr.variable('cos'),
  Expr.application(Expr.variable('sin'), Expr.variable('π'))
);
console.log(`Expression: ${exprToString(nested)}`);
console.log(`Type: ${typeToString(CAS.check(nested))}`);
console.log();

// Square root
const sqrt = Expr.sqrt(Expr.literal(16));
console.log(`Expression: ${exprToString(sqrt)}`);
console.log(`Type: ${typeToString(CAS.check(sqrt))}`);
console.log();

/**
 * Example 5: Lambda expressions
 */
console.log('λ LAMBDA EXPRESSIONS');
console.log('-'.repeat(80));

// Simple lambda: λx. x + 1
const lambda1 = Expr.lambda('x', Expr.add(Expr.variable('x'), Expr.literal(1)));
const lambdaType1 = CAS.check(lambda1);
console.log(`Expression: ${exprToString(lambda1)}`);
console.log(`Type: ${typeToString(lambdaType1)}`);
console.log();

// Lambda with type annotation: λx:ℝ. x * 2
const lambda2 = Expr.lambda(
  'x',
  Expr.multiply(Expr.variable('x'), Expr.literal(2)),
  MathTypes.Real()
);
const lambdaType2 = CAS.check(lambda2);
console.log(`Expression: λx:ℝ. (x * 2)`);
console.log(`Type: ${typeToString(lambdaType2)}`);
console.log();

// Lambda application: (λx. x²)(5)
const squareLambda = Expr.lambda('x', Expr.power(Expr.variable('x'), Expr.literal(2)));
const lambdaApp = Expr.application(squareLambda, Expr.literal(5));
console.log(`Expression: ${exprToString(lambdaApp)}`);
console.log(`Type: ${typeToString(CAS.check(lambdaApp))}`);
console.log();

/**
 * Example 6: Let bindings
 */
console.log('📌 LET BINDINGS');
console.log('-'.repeat(80));

// let x = 5 in x + 3
const let1 = Expr.let('x', Expr.literal(5), Expr.add(Expr.variable('x'), Expr.literal(3)));
console.log(`Expression: ${exprToString(let1)}`);
console.log(`Type: ${typeToString(CAS.check(let1))}`);
console.log();

// let f = λx. x * 2 in f(10)
const let2 = Expr.let(
  'f',
  Expr.lambda('x', Expr.multiply(Expr.variable('x'), Expr.literal(2))),
  Expr.application(Expr.variable('f'), Expr.literal(10))
);
console.log(`Expression: let f = λx. (x * 2) in f(10)`);
console.log(`Type: ${typeToString(CAS.check(let2))}`);
console.log();

/**
 * Example 7: Vectors and matrices
 */
console.log('📊 VECTORS AND MATRICES');
console.log('-'.repeat(80));

// Vector
const vec = Expr.vector([Expr.literal(1), Expr.literal(2), Expr.literal(3)]);
console.log(`Expression: ${exprToString(vec)}`);
console.log(`Type: ${typeToString(CAS.check(vec))}`);
console.log();

// Matrix
const matrix = Expr.matrix([
  [Expr.literal(1), Expr.literal(2), Expr.literal(3)],
  [Expr.literal(4), Expr.literal(5), Expr.literal(6)],
]);
console.log(`Expression: ${exprToString(matrix)}`);
console.log(`Type: ${typeToString(CAS.check(matrix))}`);
console.log();

/**
 * Example 8: Sets
 */
console.log('🔷 SETS');
console.log('-'.repeat(80));

// Set literal
const set1 = Expr.set([Expr.literal(1), Expr.literal(2), Expr.literal(3)]);
console.log(`Expression: ${exprToString(set1)}`);
console.log(`Type: ${typeToString(CAS.check(set1))}`);
console.log();

// Set comprehension: {x * 2 | x ∈ {1, 2, 3}}
const domain = Expr.set([Expr.literal(1), Expr.literal(2), Expr.literal(3)]);
const setComp = Expr.setComprehension(
  'x',
  domain,
  Expr.multiply(Expr.variable('x'), Expr.literal(2))
);
console.log(`Expression: ${exprToString(setComp)}`);
console.log(`Type: ${typeToString(CAS.check(setComp))}`);
console.log();

/**
 * Example 9: Conditional expressions
 */
console.log('🔀 CONDITIONAL EXPRESSIONS');
console.log('-'.repeat(80));

const cond = Expr.if(Expr.literal(1), Expr.literal(42), Expr.literal(0));
console.log(`Expression: ${exprToString(cond)}`);
console.log(`Type: ${typeToString(CAS.check(cond))}`);
console.log();

/**
 * Example 10: Complex real-world expression
 */
console.log('🌟 COMPLEX REAL-WORLD EXAMPLE');
console.log('-'.repeat(80));

// Binet's formula approximation: (φⁿ - ψⁿ)/√5
// We'll compute: (φ^5 - ψ^5)
const phiPow = Expr.power(Expr.variable('φ'), Expr.literal(5));
const psiPow = Expr.power(Expr.variable('ψ'), Expr.literal(5));
const binet = Expr.subtract(phiPow, psiPow);

console.log(`Expression: ${exprToString(binet)}`);
console.log(`Type: ${typeToString(CAS.check(binet))}`);
console.log(`Description: Numerator of Binet's formula for F(5)`);
console.log();

/**
 * Example 11: Type hierarchy demonstration
 */
console.log('🔺 TYPE HIERARCHY (ℕ ⊆ ℤ ⊆ ℝ ⊆ ℂ)');
console.log('-'.repeat(80));

const checker = new TypeChecker();

// Create a function that accepts ℝ
const env = checker.getEnvironment();
env.bind('realFunc', MathTypes.Function(MathTypes.Real(), MathTypes.Real()));

// Can call with ℕ (subtype of ℝ)
const call1 = Expr.application(Expr.variable('realFunc'), Expr.literal(5));
console.log(`✓ realFunc(5) where realFunc : ℝ → ℝ`);
console.log(`  5 : ℕ is accepted (ℕ ⊆ ℝ)`);
console.log(`  Result type: ${typeToString(checker.infer(call1))}`);
console.log();

// Can call with ℤ (subtype of ℝ)
const call2 = Expr.application(Expr.variable('realFunc'), Expr.literal(-5));
console.log(`✓ realFunc(-5) where realFunc : ℝ → ℝ`);
console.log(`  -5 : ℤ is accepted (ℤ ⊆ ℝ)`);
console.log(`  Result type: ${typeToString(checker.infer(call2))}`);
console.log();

/**
 * Example 12: Error handling
 */
console.log('⚠️  ERROR HANDLING');
console.log('-'.repeat(80));

// Try multiple expressions and collect errors
const errorChecker = new TypeChecker();
const reporter = errorChecker.getReporter();

// Add some invalid expressions
try {
  errorChecker.infer(Expr.variable('undefinedVar'));
} catch {}

try {
  errorChecker.infer(Expr.application(Expr.variable('F'), Expr.variable('π')));
} catch {}

if (errorChecker.hasErrors()) {
  console.log(`Detected ${errorChecker.getErrors().length} type errors:`);
  console.log(errorChecker.formatErrors());
}

console.log();
console.log('='.repeat(80));
console.log('All examples completed!');
console.log('='.repeat(80));

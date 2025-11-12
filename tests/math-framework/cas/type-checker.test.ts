/**
 * Computer Algebra System - Type Checker Tests
 *
 * Comprehensive test suite including specification examples:
 * ✓ F(5) : ℤ
 * ✓ φ + ψ : ℝ
 * ✗ F(φ) - type error (φ is ℝ, need ℕ)
 * ✗ S(F(5)) - type error (F(5) is ℤ, need ℕ)
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  TypeChecker,
  TypeEnvironment,
  MathTypes,
  Expr,
  typeToString,
  typeCheck,
  isWellTyped,
  TypeMismatchError,
  UndefinedVariableError,
  InvalidOperationError,
} from '../../../src/math-framework/cas';

describe('Computer Algebra System - Type Checker', () => {
  let checker: TypeChecker;

  beforeEach(() => {
    checker = new TypeChecker();
  });

  describe('Specification Examples', () => {
    it('✓ F(5) : ℤ - Fibonacci of natural number returns integer', () => {
      // F(5) where F : ℕ → ℤ
      const expr = Expr.application(Expr.variable('F'), Expr.literal(5));

      const type = checker.infer(expr);

      expect(type.kind).toBe('Int');
      expect(typeToString(type)).toBe('ℤ');
      expect(checker.hasErrors()).toBe(false);
    });

    it('✓ φ + ψ : ℝ - Sum of reals is real', () => {
      // φ + ψ where φ, ψ : ℝ
      const expr = Expr.add(Expr.variable('φ'), Expr.variable('ψ'));

      const type = checker.infer(expr);

      expect(type.kind).toBe('Real');
      expect(typeToString(type)).toBe('ℝ');
      expect(checker.hasErrors()).toBe(false);
    });

    it('✗ F(φ) - type error: φ is ℝ, need ℕ', () => {
      // F(φ) where F : ℕ → ℤ and φ : ℝ
      const expr = Expr.application(Expr.variable('F'), Expr.variable('φ'));

      expect(() => {
        checker.infer(expr);
      }).toThrow();

      expect(checker.hasErrors()).toBe(true);
      const errors = checker.getErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toBeInstanceOf(TypeMismatchError);

      const error = errors[0] as TypeMismatchError;
      expect(typeToString(error.expected)).toBe('ℕ');
      expect(typeToString(error.actual)).toBe('ℝ');
    });

    it('✗ S(F(5)) - type error: F(5) is ℤ, need ℕ', () => {
      // S(F(5)) where S : ℕ → ℕ and F(5) : ℤ
      const innerExpr = Expr.application(Expr.variable('F'), Expr.literal(5));
      const expr = Expr.application(Expr.variable('S'), innerExpr);

      expect(() => {
        checker.infer(expr);
      }).toThrow();

      expect(checker.hasErrors()).toBe(true);
      const errors = checker.getErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toBeInstanceOf(TypeMismatchError);

      const error = errors[0] as TypeMismatchError;
      expect(typeToString(error.expected)).toBe('ℕ');
      expect(typeToString(error.actual)).toBe('ℤ');
    });
  });

  describe('Literal Type Inference', () => {
    it('should infer natural number type for non-negative integers', () => {
      const expr = Expr.literal(42);
      const type = checker.infer(expr);

      expect(type.kind).toBe('Nat');
      expect(typeToString(type)).toBe('ℕ');
    });

    it('should infer integer type for negative integers', () => {
      const expr = Expr.literal(-42);
      const type = checker.infer(expr);

      expect(type.kind).toBe('Int');
      expect(typeToString(type)).toBe('ℤ');
    });

    it('should infer real number type for decimals', () => {
      const expr = Expr.literal(3.14);
      const type = checker.infer(expr);

      expect(type.kind).toBe('Real');
      expect(typeToString(type)).toBe('ℝ');
    });

    it('should infer complex number type', () => {
      const expr = Expr.literal({ real: 3, imaginary: 4 });
      const type = checker.infer(expr);

      expect(type.kind).toBe('Complex');
      expect(typeToString(type)).toBe('ℂ');
    });
  });

  describe('Variable Type Lookup', () => {
    it('should look up mathematical constants', () => {
      const phiType = checker.infer(Expr.variable('φ'));
      expect(phiType.kind).toBe('Real');

      const piType = checker.infer(Expr.variable('π'));
      expect(piType.kind).toBe('Real');
    });

    it('should throw error for undefined variables', () => {
      const expr = Expr.variable('undefinedVar');

      expect(() => {
        checker.infer(expr);
      }).toThrow(UndefinedVariableError);
    });
  });

  describe('Binary Operations', () => {
    it('should infer correct type for addition of naturals', () => {
      const expr = Expr.add(Expr.literal(3), Expr.literal(5));
      const type = checker.infer(expr);

      expect(type.kind).toBe('Nat');
    });

    it('should promote types in mixed operations', () => {
      // 3 + 3.14 (Nat + Real → Real)
      const expr = Expr.add(Expr.literal(3), Expr.literal(3.14));
      const type = checker.infer(expr);

      expect(type.kind).toBe('Real');
    });

    it('should promote to complex when needed', () => {
      // 3 + (2 + 3i) → Complex
      const expr = Expr.add(Expr.literal(3), Expr.literal({ real: 2, imaginary: 3 }));
      const type = checker.infer(expr);

      expect(type.kind).toBe('Complex');
    });

    it('should handle subtraction with type promotion', () => {
      // 5 - 3 (Nat - Nat → Nat, but result could be negative)
      const expr = Expr.subtract(Expr.literal(5), Expr.literal(3));
      const type = checker.infer(expr);

      expect(['Nat', 'Int'].includes(type.kind)).toBe(true);
    });

    it('should handle multiplication', () => {
      const expr = Expr.multiply(Expr.literal(2), Expr.literal(3));
      const type = checker.infer(expr);

      expect(type.kind).toBe('Nat');
    });

    it('should handle division', () => {
      const expr = Expr.divide(Expr.literal(6), Expr.literal(2));
      const type = checker.infer(expr);

      expect(['Nat', 'Int', 'Real'].includes(type.kind)).toBe(true);
    });

    it('should handle exponentiation', () => {
      const expr = Expr.power(Expr.literal(2), Expr.literal(3));
      const type = checker.infer(expr);

      expect(['Nat', 'Int', 'Real'].includes(type.kind)).toBe(true);
    });
  });

  describe('Unary Operations', () => {
    it('should handle negation', () => {
      // -5 : Int (negation of Nat gives Int)
      const expr = Expr.negate(Expr.literal(5));
      const type = checker.infer(expr);

      expect(type.kind).toBe('Int');
    });

    it('should handle square root', () => {
      const expr = Expr.sqrt(Expr.literal(16));
      const type = checker.infer(expr);

      expect(type.kind).toBe('Real');
    });

    it('should handle absolute value', () => {
      const expr = Expr.abs(Expr.literal(-5));
      const type = checker.infer(expr);

      expect(type.kind).toBe('Real');
    });
  });

  describe('Function Application', () => {
    it('should type check valid function applications', () => {
      // sin(π)
      const expr = Expr.application(Expr.variable('sin'), Expr.variable('π'));
      const type = checker.infer(expr);

      expect(type.kind).toBe('Real');
    });

    it('should reject invalid argument types', () => {
      // F expects ℕ, but we give it a complex number
      const expr = Expr.application(
        Expr.variable('F'),
        Expr.literal({ real: 1, imaginary: 1 })
      );

      expect(() => {
        checker.infer(expr);
      }).toThrow();
    });
  });

  describe('Lambda Expressions', () => {
    it('should infer function type for lambda', () => {
      // λx. x + 1
      const expr = Expr.lambda('x', Expr.add(Expr.variable('x'), Expr.literal(1)));
      const type = checker.infer(expr);

      expect(type.kind).toBe('Function');
    });

    it('should handle lambda with type annotation', () => {
      // λx:ℕ. x * 2
      const expr = Expr.lambda(
        'x',
        Expr.multiply(Expr.variable('x'), Expr.literal(2)),
        MathTypes.Nat()
      );
      const type = checker.infer(expr);

      expect(type.kind).toBe('Function');
      if (type.kind === 'Function') {
        expect(type.domain.kind).toBe('Nat');
      }
    });
  });

  describe('Let Expressions', () => {
    it('should bind and use local variables', () => {
      // let x = 5 in x + 3
      const expr = Expr.let(
        'x',
        Expr.literal(5),
        Expr.add(Expr.variable('x'), Expr.literal(3))
      );
      const type = checker.infer(expr);

      expect(type.kind).toBe('Nat');
    });

    it('should check type annotations', () => {
      // let x:ℕ = 5 in x + 3
      const expr = Expr.let(
        'x',
        Expr.literal(5),
        Expr.add(Expr.variable('x'), Expr.literal(3)),
        MathTypes.Nat()
      );
      const type = checker.infer(expr);

      expect(type.kind).toBe('Nat');
    });
  });

  describe('Conditional Expressions', () => {
    it('should infer type from branches', () => {
      // if 1 then 2 else 3 (all naturals)
      const expr = Expr.if(Expr.literal(1), Expr.literal(2), Expr.literal(3));
      const type = checker.infer(expr);

      expect(type.kind).toBe('Nat');
    });

    it('should promote branch types', () => {
      // if 1 then 2 else 3.14 (Nat vs Real → Real)
      const expr = Expr.if(Expr.literal(1), Expr.literal(2), Expr.literal(3.14));
      const type = checker.infer(expr);

      expect(type.kind).toBe('Real');
    });
  });

  describe('Tuple Types', () => {
    it('should infer tuple type', () => {
      const expr = Expr.tuple([Expr.literal(1), Expr.literal(3.14), Expr.variable('φ')]);
      const type = checker.infer(expr);

      expect(type.kind).toBe('Tuple');
      if (type.kind === 'Tuple') {
        expect(type.elements.length).toBe(3);
        expect(type.elements[0].kind).toBe('Nat');
        expect(type.elements[1].kind).toBe('Real');
        expect(type.elements[2].kind).toBe('Real');
      }
    });
  });

  describe('Vector Types', () => {
    it('should infer vector type with common element type', () => {
      const expr = Expr.vector([Expr.literal(1), Expr.literal(2), Expr.literal(3)]);
      const type = checker.infer(expr);

      expect(type.kind).toBe('Vector');
      if (type.kind === 'Vector') {
        expect(type.base.kind).toBe('Nat');
        expect(type.dim).toBe(3);
      }
    });

    it('should promote element types in vectors', () => {
      const expr = Expr.vector([Expr.literal(1), Expr.literal(2.5), Expr.literal(3)]);
      const type = checker.infer(expr);

      expect(type.kind).toBe('Vector');
      if (type.kind === 'Vector') {
        expect(type.base.kind).toBe('Real');
        expect(type.dim).toBe(3);
      }
    });
  });

  describe('Matrix Types', () => {
    it('should infer matrix type', () => {
      const expr = Expr.matrix([
        [Expr.literal(1), Expr.literal(2)],
        [Expr.literal(3), Expr.literal(4)],
      ]);
      const type = checker.infer(expr);

      expect(type.kind).toBe('Matrix');
      if (type.kind === 'Matrix') {
        expect(type.base.kind).toBe('Nat');
        expect(type.rows).toBe(2);
        expect(type.cols).toBe(2);
      }
    });

    it('should reject matrices with inconsistent dimensions', () => {
      const expr = Expr.matrix([
        [Expr.literal(1), Expr.literal(2)],
        [Expr.literal(3)], // Wrong: only 1 element
      ]);

      expect(() => {
        checker.infer(expr);
      }).toThrow();
    });
  });

  describe('Set Types', () => {
    it('should infer set type from elements', () => {
      const expr = Expr.set([Expr.literal(1), Expr.literal(2), Expr.literal(3)]);
      const type = checker.infer(expr);

      expect(type.kind).toBe('Set');
      if (type.kind === 'Set') {
        expect(type.element.kind).toBe('Nat');
      }
    });

    it('should handle set comprehension', () => {
      // {x * 2 | x ∈ {1, 2, 3}}
      const domain = Expr.set([Expr.literal(1), Expr.literal(2), Expr.literal(3)]);
      const body = Expr.multiply(Expr.variable('x'), Expr.literal(2));
      const expr = Expr.setComprehension('x', domain, body);

      const type = checker.infer(expr);

      expect(type.kind).toBe('Set');
      if (type.kind === 'Set') {
        expect(type.element.kind).toBe('Nat');
      }
    });
  });

  describe('Type Hierarchy and Subtyping', () => {
    it('should accept ℕ where ℤ is expected', () => {
      const env = new TypeEnvironment();
      env.bind('f', MathTypes.Function(MathTypes.Int(), MathTypes.Int()));
      const checker2 = new TypeChecker(env);

      // f(5) where f : ℤ → ℤ and 5 : ℕ (should work: ℕ ⊆ ℤ)
      const expr = Expr.application(Expr.variable('f'), Expr.literal(5));
      const type = checker2.infer(expr);

      expect(type.kind).toBe('Int');
      expect(checker2.hasErrors()).toBe(false);
    });

    it('should accept ℤ where ℝ is expected', () => {
      // sin(-5) where sin : ℝ → ℝ and -5 : ℤ (should work: ℤ ⊆ ℝ)
      const expr = Expr.application(Expr.variable('sin'), Expr.literal(-5));
      const type = checker.infer(expr);

      expect(type.kind).toBe('Real');
      expect(checker.hasErrors()).toBe(false);
    });
  });

  describe('Type Unification', () => {
    it('should unify compatible types', () => {
      const t1 = MathTypes.Nat();
      const t2 = MathTypes.Nat();

      const subst = checker.unify(t1, t2);
      expect(subst.getAll().size).toBe(0); // No substitutions needed
    });

    it('should fail to unify incompatible types', () => {
      const t1 = MathTypes.Nat();
      const t2 = MathTypes.Complex();

      expect(() => {
        checker.unify(t1, t2);
      }).toThrow();
    });

    it('should unify type variables', () => {
      const t1 = MathTypes.TypeVar('a');
      const t2 = MathTypes.Int();

      const subst = checker.unify(t1, t2);
      const result = subst.apply(t1);

      expect(result.kind).toBe('Int');
    });
  });

  describe('Error Reporting', () => {
    it('should collect multiple errors', () => {
      // Create multiple type errors
      const expr1 = Expr.application(Expr.variable('F'), Expr.variable('φ'));
      const expr2 = Expr.application(Expr.variable('S'), Expr.literal(-5));

      try {
        checker.infer(expr1);
      } catch {}

      try {
        checker.infer(expr2);
      } catch {}

      expect(checker.hasErrors()).toBe(true);
      expect(checker.getErrors().length).toBeGreaterThan(0);

      const formatted = checker.formatErrors();
      expect(formatted).toContain('Error');
    });
  });

  describe('Convenience Functions', () => {
    it('typeCheck should infer and validate', () => {
      const expr = Expr.add(Expr.literal(1), Expr.literal(2));
      const type = typeCheck(expr);

      expect(type.kind).toBe('Nat');
    });

    it('isWellTyped should return true for valid expressions', () => {
      const expr = Expr.add(Expr.variable('φ'), Expr.variable('ψ'));
      expect(isWellTyped(expr)).toBe(true);
    });

    it('isWellTyped should return false for invalid expressions', () => {
      const expr = Expr.application(Expr.variable('F'), Expr.variable('φ'));
      expect(isWellTyped(expr)).toBe(false);
    });
  });

  describe('Complex Real-World Examples', () => {
    it('should type check Fibonacci sequence operations', () => {
      // F(5) + F(6) where F : ℕ → ℤ
      const f5 = Expr.application(Expr.variable('F'), Expr.literal(5));
      const f6 = Expr.application(Expr.variable('F'), Expr.literal(6));
      const expr = Expr.add(f5, f6);

      const type = checker.infer(expr);
      expect(type.kind).toBe('Int');
    });

    it('should type check mixed mathematical expressions', () => {
      // φ² + ψ² (should be Real)
      const phiSq = Expr.power(Expr.variable('φ'), Expr.literal(2));
      const psiSq = Expr.power(Expr.variable('ψ'), Expr.literal(2));
      const expr = Expr.add(phiSq, psiSq);

      const type = checker.infer(expr);
      expect(type.kind).toBe('Real');
    });

    it('should handle nested function applications', () => {
      // sin(cos(π))
      const cospi = Expr.application(Expr.variable('cos'), Expr.variable('π'));
      const expr = Expr.application(Expr.variable('sin'), cospi);

      const type = checker.infer(expr);
      expect(type.kind).toBe('Real');
    });
  });
});

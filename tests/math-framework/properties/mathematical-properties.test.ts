/**
 * Property-Based Tests for Mathematical Framework
 *
 * Tests mathematical properties using QuickCheck-style property testing:
 * - ∀n: F(n) = (φⁿ - ψⁿ)/√5 (Binet formula)
 * - ∀n: L(n) = φⁿ + ψⁿ (Lucas formula)
 * - ∀n: S(n) ≥ 0 (B-K inequality)
 * - ∀n: Nash(n) → S(n)=0 (Nash equivalence)
 */

import { describe, it, expect } from '@jest/globals';
import {
  fibonacci,
  lucas,
  PHI,
  PSI,
  SQRT5,
  FibonacciIdentities,
  LucasIdentities,
  FibonacciLucasRelations
} from '../../../src/math-framework/sequences/fibonacci';

import { computeS } from '../../../src/math-framework/divergence/behrend-kimberling';

/**
 * Property: ∀n: F(n) = (φⁿ - ψⁿ)/√5
 */
describe('Property: Binet Formula for Fibonacci', () => {
  it('should satisfy Binet formula for all n in [0, 70]', () => {
    for (let n = 0; n <= 70; n++) {
      const fibN = Number(fibonacci(n));
      const binetResult = (Math.pow(PHI, n) - Math.pow(PSI, n)) / SQRT5;
      const rounded = Math.round(binetResult);

      expect(fibN).toBe(rounded);
    }
  });

  it('should satisfy Binet formula within tolerance for larger n', () => {
    for (let n = 71; n <= 100; n++) {
      const fibN = Number(fibonacci(n));
      const binetResult = (Math.pow(PHI, n) - Math.pow(PSI, n)) / SQRT5;

      // For larger n, check relative error due to floating point
      const relativeError = Math.abs(fibN - binetResult) / fibN;
      expect(relativeError).toBeLessThan(0.01); // <1% error
    }
  });

  it('should have φⁿ dominate as n increases', () => {
    for (let n = 10; n <= 30; n++) {
      const phiTerm = Math.pow(PHI, n) / SQRT5;
      const psiTerm = Math.abs(Math.pow(PSI, n)) / SQRT5;

      // ψⁿ should become negligible
      expect(psiTerm).toBeLessThan(phiTerm / 100);
    }
  });
});

/**
 * Property: ∀n: L(n) = φⁿ + ψⁿ
 */
describe('Property: Binet Formula for Lucas', () => {
  it('should satisfy L(n) = φⁿ + ψⁿ for all n in [0, 70]', () => {
    for (let n = 0; n <= 70; n++) {
      const lucasN = Number(lucas(n));
      const binetResult = Math.pow(PHI, n) + Math.pow(PSI, n);
      const rounded = Math.round(binetResult);

      expect(lucasN).toBe(rounded);
    }
  });

  it('should have both terms contribute significantly for small n', () => {
    for (let n = 0; n <= 10; n++) {
      const phiTerm = Math.pow(PHI, n);
      const psiTerm = Math.pow(PSI, n);

      // Both should be non-negligible
      expect(Math.abs(psiTerm / phiTerm)).toBeGreaterThan(0.1);
    }
  });

  it('should converge to φⁿ for large n', () => {
    for (let n = 20; n <= 30; n++) {
      const lucasN = Number(lucas(n));
      const phiN = Math.pow(PHI, n);
      const ratio = lucasN / phiN;

      // Should approach 1 as ψⁿ → 0
      expect(ratio).toBeCloseTo(1, 1);
    }
  });
});

/**
 * Property: ∀n: F(n-1)*F(n+1) - F(n)² = (-1)ⁿ (Cassini Identity)
 */
describe('Property: Cassini Identity', () => {
  it('should satisfy Cassini identity for all n', () => {
    for (let n = 1; n <= 100; n++) {
      expect(FibonacciIdentities.verifyCassini(n)).toBe(true);
    }
  });

  it('should alternate sign based on n', () => {
    for (let n = 1; n <= 50; n++) {
      const fn1 = fibonacci(n - 1);
      const fn = fibonacci(n);
      const fn_plus_1 = fibonacci(n + 1);

      const left = fn1 * fn_plus_1 - fn * fn;
      const expectedSign = n % 2 === 0 ? 1 : -1;

      expect(Number(left)).toBe(expectedSign);
    }
  });
});

/**
 * Property: ∀n: S(n) ≥ 0 (Behrend-Kimberling Inequality)
 */
describe('Property: B-K Inequality', () => {
  it('should satisfy S(n) ≥ 0 for all n in [0, 1000]', () => {
    for (let n = 0; n <= 1000; n += 10) {
      const s = computeS(n);
      expect(s).toBeGreaterThanOrEqual(0);
    }
  });

  it('should achieve minimum S(n) = 0', () => {
    const sValues = [];
    for (let n = 0; n <= 100; n++) {
      sValues.push(computeS(n));
    }

    const minS = Math.min(...sValues);
    expect(minS).toBe(0);

    // Should have at least one zero
    expect(sValues.filter(s => s === 0).length).toBeGreaterThan(0);
  });

  it('should have bounded growth', () => {
    const s100 = computeS(100);
    const s200 = computeS(200);

    // S should not grow too quickly
    expect(s200).toBeLessThan(s100 * 5);
  });
});

/**
 * Property: ∀n: Nash(n) ⟺ S(n)=0
 */
describe('Property: Nash Equilibrium Equivalence', () => {
  it('should have S(n)=0 exactly at Lucas points', () => {
    // Known Lucas numbers: 2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123
    // So n+1 being Lucas: n = 1, 0, 2, 3, 6, 10, 17, 28, 46, 75, 122

    const lucasN = [0, 2, 3, 6, 10, 17, 28, 46, 75];

    for (const n of lucasN) {
      const s = computeS(n);
      expect(s).toBe(0);
    }
  });

  it('should have S(n)>0 at non-Lucas points', () => {
    const nonLucasN = [1, 4, 5, 7, 8, 9, 11, 12, 13];

    for (const n of nonLucasN) {
      const s = computeS(n);
      expect(s).toBeGreaterThan(0);
    }
  });
});

/**
 * Property: ∀n,m: gcd(F(n), F(m)) = F(gcd(n,m))
 */
describe('Property: GCD of Fibonacci Numbers', () => {
  function gcd(a: bigint, b: bigint): bigint {
    while (b !== 0n) {
      [a, b] = [b, a % b];
    }
    return a;
  }

  const testCases: [number, number][] = [
    [6, 9], [8, 12], [10, 15], [12, 18],
    [15, 20], [18, 24], [20, 30], [21, 28]
  ];

  it.each(testCases)('should satisfy gcd(F(%i), F(%i)) = F(gcd(%i,%i))', (n, m) => {
    const fn = fibonacci(n);
    const fm = fibonacci(m);
    const gcdNM = Math.floor(Number(gcd(BigInt(n), BigInt(m))));
    const fGcd = fibonacci(gcdNM);

    expect(gcd(fn, fm)).toBe(fGcd);
  });
});

/**
 * Property: ∀n: Σ[i=0 to n] F(i) = F(n+2) - 1
 */
describe('Property: Sum of Fibonacci Numbers', () => {
  it('should satisfy sum formula for all n', () => {
    for (let n = 0; n <= 50; n++) {
      expect(FibonacciIdentities.verifySum(n)).toBe(true);
    }
  });

  it('should have correct sum values', () => {
    for (let n = 1; n <= 30; n++) {
      let sum = 0n;
      for (let i = 0; i <= n; i++) {
        sum += fibonacci(i);
      }
      const expected = fibonacci(n + 2) - 1n;
      expect(sum).toBe(expected);
    }
  });
});

/**
 * Property: ∀n: L(n)² - 5*F(n)² = 4*(-1)ⁿ
 */
describe('Property: Lucas-Fibonacci Square Identity', () => {
  it('should satisfy square identity for all n', () => {
    for (let n = 0; n <= 50; n++) {
      expect(LucasIdentities.verifySquareIdentity(n)).toBe(true);
    }
  });

  it('should alternate between 4 and -4', () => {
    for (let n = 0; n <= 30; n++) {
      const lucasN = lucas(n);
      const fibN = fibonacci(n);
      const left = lucasN * lucasN - 5n * fibN * fibN;
      const expected = BigInt(4 * (n % 2 === 0 ? 1 : -1));

      expect(left).toBe(expected);
    }
  });
});

/**
 * Property: ∀n: F(2n) = F(n) * L(n)
 */
describe('Property: Fibonacci-Lucas Product', () => {
  it('should satisfy product formula for all n', () => {
    for (let n = 0; n <= 50; n++) {
      expect(LucasIdentities.verifyFibonacciLucasProduct(n)).toBe(true);
    }
  });

  it('should compute F(2n) efficiently via product', () => {
    for (let n = 1; n <= 30; n++) {
      const f2n = fibonacci(2 * n);
      const fn = fibonacci(n);
      const lucasN = lucas(n);
      const product = fn * lucasN;

      expect(f2n).toBe(product);
    }
  });
});

/**
 * Property: ∀n: L(2n) = L(n)² - 2*(-1)ⁿ
 */
describe('Property: Lucas Doubling Formula', () => {
  it('should satisfy doubling formula for all n', () => {
    for (let n = 0; n <= 50; n++) {
      expect(LucasIdentities.verifyDoubling(n)).toBe(true);
    }
  });

  it('should compute L(2n) efficiently via square', () => {
    for (let n = 1; n <= 25; n++) {
      const lucas2n = lucas(2 * n);
      const lucasN = lucas(n);
      const formula = lucasN * lucasN - BigInt(2 * (n % 2 === 0 ? 1 : -1));

      expect(lucas2n).toBe(formula);
    }
  });
});

/**
 * Property: ∀n>0: F(n) < φⁿ < F(n+1)
 */
describe('Property: Fibonacci Bounds via Golden Ratio', () => {
  it('should satisfy lower bound F(n) < φⁿ', () => {
    for (let n = 1; n <= 30; n++) {
      const fn = Number(fibonacci(n));
      const phiN = Math.pow(PHI, n);

      expect(fn).toBeLessThan(phiN);
    }
  });

  it('should satisfy upper bound φⁿ < F(n+1)', () => {
    for (let n = 1; n <= 30; n++) {
      const fn1 = Number(fibonacci(n + 1));
      const phiN = Math.pow(PHI, n);

      expect(phiN).toBeLessThan(fn1);
    }
  });

  it('should have tight bounds', () => {
    for (let n = 10; n <= 30; n++) {
      const fn = Number(fibonacci(n));
      const fn1 = Number(fibonacci(n + 1));
      const phiN = Math.pow(PHI, n);

      const lowerGap = phiN - fn;
      const upperGap = fn1 - phiN;

      // Both gaps should be small relative to φⁿ
      expect(lowerGap / phiN).toBeLessThan(0.5);
      expect(upperGap / phiN).toBeLessThan(0.5);
    }
  });
});

/**
 * Property: ∀n: ratio F(n+1)/F(n) → φ as n → ∞
 */
describe('Property: Convergence to Golden Ratio', () => {
  it('should converge monotonically from below and above', () => {
    const ratios = [];
    for (let n = 1; n <= 50; n++) {
      const ratio = Number(fibonacci(n + 1)) / Number(fibonacci(n));
      ratios.push(ratio);
    }

    // Later ratios should be closer to φ
    const early = ratios.slice(0, 10);
    const late = ratios.slice(40, 50);

    const earlyError = early.map(r => Math.abs(r - PHI));
    const lateError = late.map(r => Math.abs(r - PHI));

    const avgEarlyError = earlyError.reduce((a, b) => a + b) / earlyError.length;
    const avgLateError = lateError.reduce((a, b) => a + b) / lateError.length;

    expect(avgLateError).toBeLessThan(avgEarlyError);
  });

  it('should converge within 1e-6 by n=30', () => {
    for (let n = 30; n <= 50; n++) {
      const ratio = Number(fibonacci(n + 1)) / Number(fibonacci(n));
      expect(Math.abs(ratio - PHI)).toBeLessThan(1e-6);
    }
  });

  it('should alternate above and below φ', () => {
    const ratios = [];
    for (let n = 5; n <= 20; n++) {
      const ratio = Number(fibonacci(n + 1)) / Number(fibonacci(n));
      ratios.push(ratio - PHI);
    }

    // Check for sign alternation
    let alternations = 0;
    for (let i = 1; i < ratios.length; i++) {
      if (Math.sign(ratios[i]) !== Math.sign(ratios[i-1])) {
        alternations++;
      }
    }

    expect(alternations).toBeGreaterThan(5); // Should alternate several times
  });
});

/**
 * Property: ∀n: F(n) and F(n+1) are coprime (gcd = 1)
 */
describe('Property: Consecutive Fibonacci Numbers are Coprime', () => {
  function gcd(a: bigint, b: bigint): bigint {
    while (b !== 0n) {
      [a, b] = [b, a % b];
    }
    return a;
  }

  it('should have gcd(F(n), F(n+1)) = 1 for all n', () => {
    for (let n = 1; n <= 100; n++) {
      const fn = fibonacci(n);
      const fn1 = fibonacci(n + 1);
      expect(gcd(fn, fn1)).toBe(1n);
    }
  });
});

/**
 * Property: ∀n: F(n+m) = F(n)*F(m+1) + F(n-1)*F(m)
 */
describe('Property: Fibonacci Addition Formula', () => {
  const testCases: [number, number][] = [
    [5, 3], [7, 4], [10, 5], [12, 8],
    [15, 10], [20, 15]
  ];

  it.each(testCases)('should satisfy addition formula for n=%i, m=%i', (n, m) => {
    const fnm = fibonacci(n + m);
    const fn = fibonacci(n);
    const fm1 = fibonacci(m + 1);
    const fn1 = n > 0 ? fibonacci(n - 1) : 0n;
    const fm = fibonacci(m);

    const calculated = fn * fm1 + fn1 * fm;

    expect(fnm).toBe(calculated);
  });
});

/**
 * Property: All identities should pass comprehensive verification
 */
describe('Property: Comprehensive Identity Verification', () => {
  it('should pass all identities for range of n', () => {
    for (let n = 1; n <= 30; n++) {
      const verification = FibonacciLucasRelations.verifyAllIdentities(n);

      expect(verification.fibonacciRelation).toBe(true);
      expect(verification.alternativeRelation).toBe(true);
      expect(verification.squareIdentity).toBe(true);
      expect(verification.doublingFormula).toBe(true);
      expect(verification.fibonacciLucasProduct).toBe(true);
      expect(verification.allPass).toBe(true);
    }
  });

  it('should maintain consistency across large n', () => {
    const largeN = [50, 75, 100, 150, 200];

    for (const n of largeN) {
      const verification = FibonacciLucasRelations.verifyAllIdentities(n);
      expect(verification.allPass).toBe(true);
    }
  });
});

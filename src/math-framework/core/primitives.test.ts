/**
 * Test suite for mathematical primitives
 * Verifies constants, operations, type system, and validation
 */

import {
  // Constants
  PHI, PSI, E, PI, CONSTANTS,
  // Types
  Natural, Integer, Real, Complex,
  natural, integer, real, complex,
  isNatural, isInteger, isReal, isComplex,
  validate,
  // Operations
  add, subtract, multiply, divide, power, sqrt,
  abs, conjugate, approximately, complexEquals,
  // Storage
  mathStorage, computeAndStore,
  // Config
  EPSILON
} from './primitives';

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('Mathematical Constants', () => {
  test('PHI (Golden Ratio) has correct value', () => {
    expect(PHI.value).toBeCloseTo(1.618033988749895, 10);
    expect(PHI.symbol).toBe('φ');
    expect(PHI.compute()).toBeCloseTo(1.618033988749895, 10);
  });

  test('PSI (Golden Conjugate) has correct value', () => {
    expect(PSI.value).toBeCloseTo(-0.618033988749895, 10);
    expect(PSI.symbol).toBe('ψ');
    expect(PSI.compute()).toBeCloseTo(-0.618033988749895, 10);
  });

  test('Golden ratio properties', () => {
    // ψ = φ - 1
    expect(PSI.value).toBeCloseTo(PHI.value - 1, 10);
    // ψ = 1/φ
    expect(PSI.value).toBeCloseTo(1 / PHI.value, 10);
    // φ² = φ + 1
    expect(PHI.value * PHI.value).toBeCloseTo(PHI.value + 1, 10);
  });

  test('E (Euler\'s Number) has correct value', () => {
    expect(E.value).toBeCloseTo(2.718281828459045, 10);
    expect(E.symbol).toBe('e');
    expect(Math.abs(E.value - Math.E)).toBeLessThan(EPSILON);
  });

  test('PI has correct value', () => {
    expect(PI.value).toBeCloseTo(3.141592653589793, 10);
    expect(PI.symbol).toBe('π');
    expect(Math.abs(PI.value - Math.PI)).toBeLessThan(EPSILON);
  });

  test('CONSTANTS collection contains all constants', () => {
    expect(CONSTANTS.PHI).toBe(PHI);
    expect(CONSTANTS.PSI).toBe(PSI);
    expect(CONSTANTS.E).toBe(E);
    expect(CONSTANTS.PI).toBe(PI);
  });
});

// ============================================================================
// TYPE VALIDATION TESTS
// ============================================================================

describe('Type System', () => {
  describe('Natural numbers (ℕ)', () => {
    test('validates natural numbers correctly', () => {
      expect(isNatural(0)).toBe(true);
      expect(isNatural(1)).toBe(true);
      expect(isNatural(42)).toBe(true);
      expect(isNatural(-1)).toBe(false);
      expect(isNatural(3.14)).toBe(false);
      expect(isNatural(NaN)).toBe(false);
      expect(isNatural(Infinity)).toBe(false);
    });

    test('natural constructor validates input', () => {
      expect(() => natural(5)).not.toThrow();
      expect(() => natural(-1)).toThrow(TypeError);
      expect(() => natural(3.14)).toThrow(TypeError);
    });
  });

  describe('Integers (ℤ)', () => {
    test('validates integers correctly', () => {
      expect(isInteger(-5)).toBe(true);
      expect(isInteger(0)).toBe(true);
      expect(isInteger(42)).toBe(true);
      expect(isInteger(3.14)).toBe(false);
      expect(isInteger(NaN)).toBe(false);
    });

    test('integer constructor validates input', () => {
      expect(() => integer(-5)).not.toThrow();
      expect(() => integer(0)).not.toThrow();
      expect(() => integer(3.14)).toThrow(TypeError);
    });
  });

  describe('Real numbers (ℝ)', () => {
    test('validates real numbers correctly', () => {
      expect(isReal(-5.5)).toBe(true);
      expect(isReal(0)).toBe(true);
      expect(isReal(3.14159)).toBe(true);
      expect(isReal(NaN)).toBe(false);
      expect(isReal(Infinity)).toBe(false);
    });

    test('real constructor validates input', () => {
      expect(() => real(3.14)).not.toThrow();
      expect(() => real(NaN)).toThrow(TypeError);
      expect(() => real(Infinity)).toThrow(TypeError);
    });
  });

  describe('Complex numbers (ℂ)', () => {
    test('validates complex numbers correctly', () => {
      const c = complex(3, 4);
      expect(isComplex(c)).toBe(true);
      expect(c.real).toBe(3);
      expect(c.imaginary).toBe(4);
    });

    test('complex constructor accepts single argument', () => {
      const c = complex(5);
      expect(c.real).toBe(5);
      expect(c.imaginary).toBe(0);
    });

    test('validates structure', () => {
      expect(isComplex({ real: 1, imaginary: 2 })).toBe(false); // missing __brand
      expect(isComplex(5)).toBe(false);
      expect(isComplex(null)).toBe(false);
    });
  });

  describe('Validate utility', () => {
    test('throws on invalid natural', () => {
      expect(() => validate.natural(-1)).toThrow('must be a natural number');
    });

    test('throws on invalid integer', () => {
      expect(() => validate.integer(3.14)).toThrow('must be an integer');
    });

    test('throws on invalid real', () => {
      expect(() => validate.real(NaN)).toThrow('must be a real number');
    });

    test('throws on invalid complex', () => {
      expect(() => validate.complex(5)).toThrow('must be a complex number');
    });
  });
});

// ============================================================================
// BASIC OPERATIONS TESTS
// ============================================================================

describe('Addition Operations', () => {
  test('adds real numbers', () => {
    const result = add.real(real(3), real(4));
    expect(result).toBe(7);
  });

  test('adds complex numbers', () => {
    const a = complex(3, 4);
    const b = complex(1, 2);
    const result = add.complex(a, b);
    expect(result.real).toBe(4);
    expect(result.imaginary).toBe(6);
  });

  test('polymorphic addition works', () => {
    const r1 = add.poly(real(3), real(4));
    expect(r1).toBe(7);

    const c1 = add.poly(complex(1, 2), complex(3, 4)) as Complex;
    expect(c1.real).toBe(4);
    expect(c1.imaginary).toBe(6);

    const c2 = add.poly(real(5), complex(2, 3)) as Complex;
    expect(c2.real).toBe(7);
    expect(c2.imaginary).toBe(3);
  });
});

describe('Multiplication Operations', () => {
  test('multiplies real numbers', () => {
    const result = multiply.real(real(3), real(4));
    expect(result).toBe(12);
  });

  test('multiplies complex numbers', () => {
    const a = complex(3, 4);  // 3 + 4i
    const b = complex(1, 2);  // 1 + 2i
    const result = multiply.complex(a, b); // (3·1 - 4·2) + (3·2 + 4·1)i = -5 + 10i
    expect(result.real).toBe(-5);
    expect(result.imaginary).toBe(10);
  });

  test('polymorphic multiplication works', () => {
    const r1 = multiply.poly(real(3), real(4));
    expect(r1).toBe(12);

    const c1 = multiply.poly(complex(2, 1), complex(3, 1)) as Complex;
    expect(c1.real).toBe(5);
    expect(c1.imaginary).toBe(5);
  });
});

describe('Subtraction Operations', () => {
  test('subtracts real numbers', () => {
    const result = subtract.real(real(7), real(3));
    expect(result).toBe(4);
  });

  test('subtracts complex numbers', () => {
    const a = complex(5, 8);
    const b = complex(2, 3);
    const result = subtract.complex(a, b);
    expect(result.real).toBe(3);
    expect(result.imaginary).toBe(5);
  });
});

describe('Division Operations', () => {
  test('divides real numbers', () => {
    const result = divide.real(real(12), real(3));
    expect(result).toBe(4);
  });

  test('throws on division by zero', () => {
    expect(() => divide.real(real(5), real(0))).toThrow('Division by zero');
  });

  test('divides complex numbers', () => {
    const a = complex(2, 4);  // 2 + 4i
    const b = complex(1, 1);  // 1 + 1i
    const result = divide.complex(a, b);
    expect(result.real).toBeCloseTo(3, 10);
    expect(result.imaginary).toBeCloseTo(1, 10);
  });

  test('throws on complex division by zero', () => {
    expect(() => divide.complex(complex(5, 3), complex(0, 0))).toThrow('Division by zero');
  });
});

describe('Power Operations', () => {
  test('raises real numbers to power', () => {
    const result = power.real(real(2), real(3));
    expect(result).toBe(8);
  });

  test('handles fractional exponents', () => {
    const result = power.real(real(4), real(0.5));
    expect(result).toBeCloseTo(2, 10);
  });

  test('handles negative exponents', () => {
    const result = power.real(real(2), real(-2));
    expect(result).toBe(0.25);
  });

  test('integer power is more precise', () => {
    const result = power.integer(real(2), integer(10));
    expect(result).toBe(1024);
  });
});

describe('Square Root Operations', () => {
  test('computes real square root', () => {
    const result = sqrt.real(real(9));
    expect(result).toBe(3);
  });

  test('throws on negative real square root', () => {
    expect(() => sqrt.real(real(-4))).toThrow('Cannot take square root of negative');
  });

  test('computes complex square root', () => {
    const result = sqrt.complex(complex(0, 4)); // √(4i)
    expect(result.real).toBeCloseTo(Math.sqrt(2), 10);
    expect(result.imaginary).toBeCloseTo(Math.sqrt(2), 10);
  });

  test('polymorphic sqrt handles negative as complex', () => {
    const result = sqrt.poly(real(-4)) as Complex;
    expect(isComplex(result)).toBe(true);
    expect(result.real).toBeCloseTo(0, 10);
    expect(result.imaginary).toBeCloseTo(2, 10);
  });
});

describe('Utility Operations', () => {
  test('absolute value of real', () => {
    expect(abs.real(real(-5))).toBe(5);
    expect(abs.real(real(3))).toBe(3);
  });

  test('magnitude of complex', () => {
    const c = complex(3, 4);
    const magnitude = abs.complex(c);
    expect(magnitude).toBe(5); // √(3² + 4²) = 5
  });

  test('complex conjugate', () => {
    const c = complex(3, 4);
    const conj = conjugate(c);
    expect(conj.real).toBe(3);
    expect(conj.imaginary).toBe(-4);
  });

  test('approximate equality', () => {
    expect(approximately(real(1.0000001), real(1.0))).toBe(true);
    expect(approximately(real(1.1), real(1.0))).toBe(false);
  });

  test('complex equality', () => {
    const a = complex(1.0000001, 2.0);
    const b = complex(1.0, 2.0);
    expect(complexEquals(a, b)).toBe(true);

    const c = complex(1.5, 2.0);
    expect(complexEquals(a, c)).toBe(false);
  });
});

// ============================================================================
// STORAGE TESTS
// ============================================================================

describe('AgentDB Storage Integration', () => {
  beforeEach(() => {
    // Clear storage before each test
    if ('clear' in mathStorage) {
      (mathStorage as any).clear();
    }
  });

  test('stores and retrieves real values', async () => {
    const value = real(3.14159);
    await mathStorage.store('pi-approx', value);
    const retrieved = await mathStorage.retrieve('pi-approx');
    expect(retrieved).toBe(value);
  });

  test('stores and retrieves complex values', async () => {
    const value = complex(3, 4);
    await mathStorage.store('complex-test', value);
    const retrieved = await mathStorage.retrieve('complex-test');
    expect(isComplex(retrieved!)).toBe(true);
    expect((retrieved as Complex).real).toBe(3);
    expect((retrieved as Complex).imaginary).toBe(4);
  });

  test('returns null for missing keys', async () => {
    const retrieved = await mathStorage.retrieve('nonexistent');
    expect(retrieved).toBeNull();
  });

  test('computeAndStore helper works', async () => {
    const result = await computeAndStore(
      'test-computation',
      'add',
      () => add.real(real(2), real(3)),
      real(2),
      real(3)
    );
    expect(result).toBe(5);

    const retrieved = await mathStorage.retrieve('test-computation');
    expect(retrieved).toBe(5);
  });

  test('stores computation history', async () => {
    await mathStorage.storeComputation('multiply', [real(3), real(4)], real(12));

    if ('getComputations' in mathStorage) {
      const computations = (mathStorage as any).getComputations();
      expect(computations.size).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration Tests', () => {
  test('golden ratio calculations', () => {
    // φ² = φ + 1
    const phiSquared = power.real(real(PHI.value), real(2));
    const phiPlusOne = add.real(real(PHI.value), real(1));
    expect(approximately(phiSquared, phiPlusOne)).toBe(true);

    // φ · ψ = -1
    const product = multiply.real(real(PHI.value), real(PSI.value));
    expect(approximately(product, real(-1))).toBe(true);
  });

  test('Euler\'s identity components', () => {
    // e^(iπ) + 1 = 0 (components test)
    // This requires complex exponential which we'll implement later
    // For now, test e^0 = 1
    const result = power.real(real(E.value), real(0));
    expect(result).toBe(1);
  });

  test('complex number arithmetic chain', () => {
    const a = complex(1, 2);
    const b = complex(3, 4);

    // (a + b) · (a - b) = a² - b²
    const sum = add.complex(a, b);
    const diff = subtract.complex(a, b);
    const product = multiply.complex(sum, diff);

    const aSquared = multiply.complex(a, a);
    const bSquared = multiply.complex(b, b);
    const expected = subtract.complex(aSquared, bSquared);

    expect(complexEquals(product, expected)).toBe(true);
  });

  test('Pythagorean theorem validation', () => {
    // 3² + 4² = 5²
    const a = real(3);
    const b = real(4);
    const c = real(5);

    const aSquared = power.real(a, real(2));
    const bSquared = power.real(b, real(2));
    const cSquared = power.real(c, real(2));

    const sum = add.real(aSquared, bSquared);
    expect(approximately(sum, cSquared)).toBe(true);
  });
});

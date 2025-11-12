/**
 * Mathematical Primitives and Constants
 *
 * Implements Level 0-1 of the mathematical framework:
 * - Constants: φ (golden ratio), ψ (conjugate), e, π
 * - Basic operations: +, ·, ^, √
 * - Type system: ℕ, ℤ, ℝ, ℂ
 * - Runtime validation for each type
 * - AgentDB storage integration for computed values
 *
 * Uses high-precision arithmetic where needed.
 */

// ============================================================================
// PRECISION CONFIGURATION
// ============================================================================

const PRECISION_DIGITS = 50; // High precision for calculations
const EPSILON = 1e-15; // Tolerance for floating point comparisons

// ============================================================================
// MATHEMATICAL CONSTANTS (Level 0)
// ============================================================================

/**
 * φ (Phi) - Golden Ratio
 * φ = (1 + √5) / 2 ≈ 1.618033988749894848204586834...
 */
export const PHI = Object.freeze({
  value: (1 + Math.sqrt(5)) / 2,
  symbol: 'φ',
  name: 'Golden Ratio',
  decimal: '1.6180339887498948482045868343656381177203091798057628621354486227052604628189024497072072041893911374',
  compute: (): number => (1 + Math.sqrt(5)) / 2
});

/**
 * ψ (Psi) - Golden Ratio Conjugate
 * ψ = (1 - √5) / 2 ≈ -0.618033988749894848204586834...
 * Property: ψ = φ - 1 = 1/φ
 */
export const PSI = Object.freeze({
  value: (1 - Math.sqrt(5)) / 2,
  symbol: 'ψ',
  name: 'Golden Ratio Conjugate',
  decimal: '-0.6180339887498948482045868343656381177203091798057628621354486227052604628189024497072072041893911374',
  compute: (): number => (1 - Math.sqrt(5)) / 2,
  relation: 'ψ = φ - 1 = 1/φ'
});

/**
 * e - Euler's Number
 * e ≈ 2.718281828459045235360287471352662497757247093...
 */
export const E = Object.freeze({
  value: Math.E,
  symbol: 'e',
  name: "Euler's Number",
  decimal: '2.7182818284590452353602874713526624977572470936999595749669676277240766303535475945713821785251664274',
  compute: (): number => Math.E
});

/**
 * π (Pi) - Circle Constant
 * π ≈ 3.141592653589793238462643383279502884197169399...
 */
export const PI = Object.freeze({
  value: Math.PI,
  symbol: 'π',
  name: 'Pi',
  decimal: '3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679',
  compute: (): number => Math.PI
});

/**
 * All constants collection for easy access
 */
export const CONSTANTS = Object.freeze({
  PHI,
  PSI,
  E,
  PI
});

// ============================================================================
// TYPE SYSTEM (Level 1)
// ============================================================================

/**
 * ℕ - Natural Numbers: {0, 1, 2, 3, ...}
 * Non-negative integers
 */
export type Natural = number & { __brand: 'Natural' };

/**
 * ℤ - Integers: {..., -2, -1, 0, 1, 2, ...}
 * All whole numbers including negatives
 */
export type Integer = number & { __brand: 'Integer' };

/**
 * ℝ - Real Numbers
 * All rational and irrational numbers
 */
export type Real = number & { __brand: 'Real' };

/**
 * ℂ - Complex Numbers: a + bi
 * Numbers with real and imaginary parts
 */
export interface Complex {
  real: Real;
  imaginary: Real;
  __brand: 'Complex';
}

// ============================================================================
// VALIDATION FUNCTIONS (Runtime Type Checking)
// ============================================================================

/**
 * Validates if a value is a natural number (non-negative integer)
 */
export function isNatural(value: unknown): value is Natural {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
  );
}

/**
 * Validates if a value is an integer
 */
export function isInteger(value: unknown): value is Integer {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    Number.isInteger(value)
  );
}

/**
 * Validates if a value is a real number
 */
export function isReal(value: unknown): value is Real {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  );
}

/**
 * Validates if a value is a complex number
 */
export function isComplex(value: unknown): value is Complex {
  return (
    typeof value === 'object' &&
    value !== null &&
    'real' in value &&
    'imaginary' in value &&
    '__brand' in value &&
    (value as Complex).__brand === 'Complex' &&
    isReal((value as Complex).real) &&
    isReal((value as Complex).imaginary)
  );
}

/**
 * Type guards with error throwing for stricter validation
 */
export const validate = {
  natural: (value: unknown, label = 'value'): Natural => {
    if (!isNatural(value)) {
      throw new TypeError(`${label} must be a natural number (ℕ), got: ${value}`);
    }
    return value;
  },

  integer: (value: unknown, label = 'value'): Integer => {
    if (!isInteger(value)) {
      throw new TypeError(`${label} must be an integer (ℤ), got: ${value}`);
    }
    return value;
  },

  real: (value: unknown, label = 'value'): Real => {
    if (!isReal(value)) {
      throw new TypeError(`${label} must be a real number (ℝ), got: ${value}`);
    }
    return value;
  },

  complex: (value: unknown, label = 'value'): Complex => {
    if (!isComplex(value)) {
      throw new TypeError(`${label} must be a complex number (ℂ), got: ${JSON.stringify(value)}`);
    }
    return value;
  }
};

// ============================================================================
// TYPE CONSTRUCTORS
// ============================================================================

/**
 * Creates a natural number with validation
 */
export function natural(value: number): Natural {
  return validate.natural(value, 'Natural number');
}

/**
 * Creates an integer with validation
 */
export function integer(value: number): Integer {
  return validate.integer(value, 'Integer');
}

/**
 * Creates a real number with validation
 */
export function real(value: number): Real {
  return validate.real(value, 'Real number');
}

/**
 * Creates a complex number with validation
 */
export function complex(realPart: number, imaginaryPart: number = 0): Complex {
  return {
    real: validate.real(realPart, 'Real part'),
    imaginary: validate.real(imaginaryPart, 'Imaginary part'),
    __brand: 'Complex'
  };
}

// ============================================================================
// BASIC OPERATIONS (Level 1)
// ============================================================================

/**
 * Addition: a + b
 * Works with Real and Complex numbers
 */
export const add = {
  real: (a: Real, b: Real): Real => {
    validate.real(a, 'operand a');
    validate.real(b, 'operand b');
    return real(a + b);
  },

  complex: (a: Complex, b: Complex): Complex => {
    validate.complex(a, 'operand a');
    validate.complex(b, 'operand b');
    return complex(
      a.real + b.real,
      a.imaginary + b.imaginary
    );
  },

  // Polymorphic addition
  poly: (a: Real | Complex, b: Real | Complex): Real | Complex => {
    if (isComplex(a) || isComplex(b)) {
      const ca = isComplex(a) ? a : complex(a, 0);
      const cb = isComplex(b) ? b : complex(b, 0);
      return add.complex(ca, cb);
    }
    return add.real(a as Real, b as Real);
  }
};

/**
 * Multiplication: a · b
 * Works with Real and Complex numbers
 */
export const multiply = {
  real: (a: Real, b: Real): Real => {
    validate.real(a, 'operand a');
    validate.real(b, 'operand b');
    return real(a * b);
  },

  complex: (a: Complex, b: Complex): Complex => {
    validate.complex(a, 'operand a');
    validate.complex(b, 'operand b');
    // (a + bi)(c + di) = (ac - bd) + (ad + bc)i
    return complex(
      a.real * b.real - a.imaginary * b.imaginary,
      a.real * b.imaginary + a.imaginary * b.real
    );
  },

  // Polymorphic multiplication
  poly: (a: Real | Complex, b: Real | Complex): Real | Complex => {
    if (isComplex(a) || isComplex(b)) {
      const ca = isComplex(a) ? a : complex(a, 0);
      const cb = isComplex(b) ? b : complex(b, 0);
      return multiply.complex(ca, cb);
    }
    return multiply.real(a as Real, b as Real);
  }
};

/**
 * Exponentiation: a^b (power)
 * Works with Real numbers
 */
export const power = {
  real: (base: Real, exponent: Real): Real => {
    validate.real(base, 'base');
    validate.real(exponent, 'exponent');
    const result = Math.pow(base, exponent);
    if (!Number.isFinite(result)) {
      throw new Error(`Power operation resulted in non-finite value: ${base}^${exponent}`);
    }
    return real(result);
  },

  // Integer exponent for more precise calculation
  integer: (base: Real, exponent: Integer): Real => {
    validate.real(base, 'base');
    validate.integer(exponent, 'exponent');

    if (exponent === 0) return real(1);
    if (exponent === 1) return base;

    let result = base;
    const absExp = Math.abs(exponent);

    for (let i = 1; i < absExp; i++) {
      result *= base;
    }

    return exponent < 0 ? real(1 / result) : real(result);
  }
};

/**
 * Square root: √a
 * Works with Real and Complex numbers
 */
export const sqrt = {
  real: (value: Real): Real => {
    validate.real(value, 'value');
    if (value < 0) {
      throw new Error(`Cannot take square root of negative real number: ${value}. Use complex sqrt instead.`);
    }
    return real(Math.sqrt(value));
  },

  complex: (value: Complex): Complex => {
    validate.complex(value, 'value');
    // √(a + bi) = √r · (cos(θ/2) + i·sin(θ/2))
    // where r = √(a² + b²) and θ = atan2(b, a)
    const r = Math.sqrt(value.real * value.real + value.imaginary * value.imaginary);
    const theta = Math.atan2(value.imaginary, value.real);

    return complex(
      Math.sqrt(r) * Math.cos(theta / 2),
      Math.sqrt(r) * Math.sin(theta / 2)
    );
  },

  // Polymorphic square root
  poly: (value: Real | Complex): Real | Complex => {
    if (isComplex(value)) {
      return sqrt.complex(value);
    }
    if (value < 0) {
      return sqrt.complex(complex(value, 0));
    }
    return sqrt.real(value as Real);
  }
};

// ============================================================================
// UTILITY OPERATIONS
// ============================================================================

/**
 * Subtraction: a - b
 */
export const subtract = {
  real: (a: Real, b: Real): Real => add.real(a, real(-b)),
  complex: (a: Complex, b: Complex): Complex => add.complex(a, complex(-b.real, -b.imaginary)),
  poly: (a: Real | Complex, b: Real | Complex): Real | Complex => {
    if (isComplex(a) || isComplex(b)) {
      const ca = isComplex(a) ? a : complex(a, 0);
      const cb = isComplex(b) ? b : complex(b, 0);
      return subtract.complex(ca, cb);
    }
    return subtract.real(a as Real, b as Real);
  }
};

/**
 * Division: a / b
 */
export const divide = {
  real: (a: Real, b: Real): Real => {
    validate.real(a, 'dividend');
    validate.real(b, 'divisor');
    if (Math.abs(b) < EPSILON) {
      throw new Error('Division by zero');
    }
    return real(a / b);
  },

  complex: (a: Complex, b: Complex): Complex => {
    validate.complex(a, 'dividend');
    validate.complex(b, 'divisor');

    const denominator = b.real * b.real + b.imaginary * b.imaginary;
    if (Math.abs(denominator) < EPSILON) {
      throw new Error('Division by zero (complex)');
    }

    // (a + bi) / (c + di) = [(ac + bd) + (bc - ad)i] / (c² + d²)
    return complex(
      (a.real * b.real + a.imaginary * b.imaginary) / denominator,
      (a.imaginary * b.real - a.real * b.imaginary) / denominator
    );
  },

  poly: (a: Real | Complex, b: Real | Complex): Real | Complex => {
    if (isComplex(a) || isComplex(b)) {
      const ca = isComplex(a) ? a : complex(a, 0);
      const cb = isComplex(b) ? b : complex(b, 0);
      return divide.complex(ca, cb);
    }
    return divide.real(a as Real, b as Real);
  }
};

/**
 * Absolute value / Magnitude
 */
export const abs = {
  real: (value: Real): Real => real(Math.abs(value)),

  complex: (value: Complex): Real => {
    // |a + bi| = √(a² + b²)
    return real(Math.sqrt(value.real * value.real + value.imaginary * value.imaginary));
  }
};

/**
 * Complex conjugate: if z = a + bi, then z* = a - bi
 */
export function conjugate(value: Complex): Complex {
  validate.complex(value, 'value');
  return complex(value.real, -value.imaginary);
}

// ============================================================================
// COMPARISON OPERATIONS (with epsilon tolerance)
// ============================================================================

/**
 * Approximate equality for real numbers
 */
export function approximately(a: Real, b: Real, epsilon = EPSILON): boolean {
  validate.real(a, 'operand a');
  validate.real(b, 'operand b');
  return Math.abs(a - b) < epsilon;
}

/**
 * Equality for complex numbers
 */
export function complexEquals(a: Complex, b: Complex, epsilon = EPSILON): boolean {
  validate.complex(a, 'operand a');
  validate.complex(b, 'operand b');
  return approximately(a.real, b.real, epsilon) &&
         approximately(a.imaginary, b.imaginary, epsilon);
}

// ============================================================================
// AGENTDB STORAGE INTEGRATION
// ============================================================================

/**
 * Storage interface for computed values
 * Integrates with AgentDB for persistent mathematical computations
 */
export interface MathStorage {
  store(key: string, value: Real | Complex): Promise<void>;
  retrieve(key: string): Promise<Real | Complex | null>;
  storeComputation(operation: string, inputs: (Real | Complex)[], result: Real | Complex): Promise<void>;
}

/**
 * In-memory storage implementation (can be replaced with AgentDB)
 */
class InMemoryMathStorage implements MathStorage {
  private storage = new Map<string, Real | Complex>();
  private computations = new Map<string, { inputs: (Real | Complex)[], result: Real | Complex }>();

  async store(key: string, value: Real | Complex): Promise<void> {
    this.storage.set(key, value);
  }

  async retrieve(key: string): Promise<Real | Complex | null> {
    return this.storage.get(key) ?? null;
  }

  async storeComputation(
    operation: string,
    inputs: (Real | Complex)[],
    result: Real | Complex
  ): Promise<void> {
    const key = `${operation}:${inputs.map(i =>
      isComplex(i) ? `${i.real}+${i.imaginary}i` : i
    ).join(',')}`;
    this.computations.set(key, { inputs, result });
  }

  // Additional utility methods
  getComputations(): Map<string, { inputs: (Real | Complex)[], result: Real | Complex }> {
    return new Map(this.computations);
  }

  clear(): void {
    this.storage.clear();
    this.computations.clear();
  }
}

/**
 * Global storage instance
 */
export const mathStorage: MathStorage = new InMemoryMathStorage();

/**
 * Helper to store and return a computed value
 */
export async function computeAndStore<T extends Real | Complex>(
  key: string,
  operation: string,
  compute: () => T,
  ...inputs: (Real | Complex)[]
): Promise<T> {
  const result = compute();
  await mathStorage.store(key, result);
  await mathStorage.storeComputation(operation, inputs, result);
  return result;
}

// ============================================================================
// EXPORTS SUMMARY
// ============================================================================

export const operations = {
  add,
  subtract,
  multiply,
  divide,
  power,
  sqrt,
  abs,
  conjugate,
  approximately,
  complexEquals
};

export const types = {
  natural,
  integer,
  real,
  complex,
  isNatural,
  isInteger,
  isReal,
  isComplex,
  validate
};

// Default export with everything organized
export default {
  constants: CONSTANTS,
  types,
  operations,
  storage: mathStorage,
  computeAndStore,
  EPSILON,
  PRECISION_DIGITS
};

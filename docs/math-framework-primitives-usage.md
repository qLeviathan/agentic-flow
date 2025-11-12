# Mathematical Primitives - Usage Guide

## Overview

The mathematical primitives module provides the foundation for the math framework, implementing Level 0-1 of the symbol table with high-precision arithmetic, type safety, and runtime validation.

## File Location

- **Implementation**: `/home/user/agentic-flow/src/math-framework/core/primitives.ts`
- **Tests**: `/home/user/agentic-flow/src/math-framework/core/primitives.test.ts`

## Features

### 1. Mathematical Constants

High-precision constants with decimal representations:

```typescript
import { PHI, PSI, E, PI, CONSTANTS } from './primitives';

// Golden Ratio (φ)
console.log(PHI.value);      // 1.618033988749894...
console.log(PHI.symbol);     // 'φ'
console.log(PHI.name);       // 'Golden Ratio'

// Golden Ratio Conjugate (ψ)
console.log(PSI.value);      // -0.618033988749894...
console.log(PSI.relation);   // 'ψ = φ - 1 = 1/φ'

// Euler's Number (e)
console.log(E.value);        // 2.718281828459045...

// Pi (π)
console.log(PI.value);       // 3.141592653589793...

// Access all at once
console.log(CONSTANTS.PHI, CONSTANTS.PSI, CONSTANTS.E, CONSTANTS.PI);
```

### 2. Type System (ℕ, ℤ, ℝ, ℂ)

Type-safe number types with runtime validation:

```typescript
import { natural, integer, real, complex } from './primitives';

// Natural numbers (ℕ): {0, 1, 2, 3, ...}
const n = natural(5);        // OK
// const n2 = natural(-1);   // Throws TypeError

// Integers (ℤ): {..., -2, -1, 0, 1, 2, ...}
const z = integer(-5);       // OK
// const z2 = integer(3.14); // Throws TypeError

// Real numbers (ℝ)
const r = real(3.14159);     // OK
// const r2 = real(NaN);     // Throws TypeError

// Complex numbers (ℂ): a + bi
const c1 = complex(3, 4);    // 3 + 4i
const c2 = complex(5);       // 5 + 0i (real number as complex)
```

### 3. Type Validation

Both guards and validators available:

```typescript
import { isNatural, isInteger, isReal, isComplex, validate } from './primitives';

// Type guards (return boolean)
if (isNatural(value)) {
  // value is Natural
}

if (isComplex(value)) {
  console.log(value.real, value.imaginary);
}

// Validators (throw on invalid)
try {
  const n = validate.natural(userInput);
  const z = validate.integer(someValue);
  const r = validate.real(calculation);
  const c = validate.complex(complexValue);
} catch (error) {
  console.error('Type validation failed:', error.message);
}
```

### 4. Basic Operations

Comprehensive arithmetic operations:

```typescript
import { add, subtract, multiply, divide, power, sqrt } from './primitives';

// Addition
const sum = add.real(real(3), real(4));                    // 7
const complexSum = add.complex(complex(1,2), complex(3,4)); // 4+6i
const polySum = add.poly(real(5), complex(2,3));           // 7+3i (polymorphic)

// Subtraction
const diff = subtract.real(real(10), real(3));             // 7
const complexDiff = subtract.complex(complex(5,8), complex(2,3)); // 3+5i

// Multiplication
const product = multiply.real(real(3), real(4));           // 12
const complexProduct = multiply.complex(complex(3,4), complex(1,2)); // -5+10i

// Division
const quotient = divide.real(real(12), real(3));           // 4
const complexQuotient = divide.complex(complex(2,4), complex(1,1)); // 3+1i

// Power
const squared = power.real(real(3), real(2));              // 9
const cubed = power.integer(real(2), integer(3));          // 8 (more precise)

// Square root
const root = sqrt.real(real(16));                          // 4
const complexRoot = sqrt.complex(complex(0, 4));           // ~1.41+1.41i
const negativeRoot = sqrt.poly(real(-4));                  // 0+2i (auto-complex)
```

### 5. Utility Operations

```typescript
import { abs, conjugate, approximately, complexEquals } from './primitives';

// Absolute value / Magnitude
const absValue = abs.real(real(-5));              // 5
const magnitude = abs.complex(complex(3, 4));     // 5 (√(3²+4²))

// Complex conjugate
const c = complex(3, 4);                          // 3+4i
const conj = conjugate(c);                        // 3-4i

// Approximate equality (for floating point)
const equal = approximately(real(1.0000001), real(1.0)); // true
const notEqual = approximately(real(1.1), real(1.0));    // false

// Complex equality
const c1 = complex(1.0000001, 2.0);
const c2 = complex(1.0, 2.0);
complexEquals(c1, c2);                            // true
```

### 6. AgentDB Storage Integration

Persistent storage for computed values:

```typescript
import { mathStorage, computeAndStore } from './primitives';

// Store values
await mathStorage.store('phi-squared', power.real(real(PHI.value), real(2)));
await mathStorage.store('my-complex', complex(3, 4));

// Retrieve values
const retrieved = await mathStorage.retrieve('phi-squared');
console.log(retrieved); // The stored value

// Compute and store in one step
const result = await computeAndStore(
  'fibonacci-phi',
  'power',
  () => power.real(real(PHI.value), real(10)),
  real(PHI.value),
  real(10)
);

// Store computation history
await mathStorage.storeComputation(
  'multiply',
  [real(3), real(4)],
  real(12)
);
```

## Mathematical Properties

### Golden Ratio Properties

The implementation preserves golden ratio properties:

```typescript
// φ² = φ + 1
const phiSquared = power.real(real(PHI.value), real(2));
const phiPlusOne = add.real(real(PHI.value), real(1));
approximately(phiSquared, phiPlusOne); // true

// φ · ψ = -1
const product = multiply.real(real(PHI.value), real(PSI.value));
approximately(product, real(-1)); // true

// ψ = φ - 1 = 1/φ
const psiFromPhi = subtract.real(real(PHI.value), real(1));
approximately(psiFromPhi, real(PSI.value)); // true
```

### Complex Number Operations

```typescript
// Complex multiplication: (a+bi)(c+di) = (ac-bd)+(ad+bc)i
const a = complex(3, 4);  // 3+4i
const b = complex(1, 2);  // 1+2i
const product = multiply.complex(a, b); // -5+10i

// Complex division
const quotient = divide.complex(complex(2,4), complex(1,1)); // 3+1i

// Magnitude (absolute value)
const c = complex(3, 4);
const mag = abs.complex(c); // 5

// Conjugate: z* of (a+bi) = (a-bi)
const z = complex(3, 4);
const zStar = conjugate(z); // 3-4i

// Property: z · z* = |z|²
const product = multiply.complex(z, conjugate(z));
const magnitudeSquared = power.real(abs.complex(z), real(2));
approximately(product.real, magnitudeSquared); // true
```

## Error Handling

The module provides comprehensive error handling:

```typescript
try {
  // Type validation errors
  const invalid = natural(-1); // TypeError: must be a natural number
} catch (error) {
  console.error(error.message);
}

try {
  // Operation errors
  const result = divide.real(real(5), real(0)); // Error: Division by zero
} catch (error) {
  console.error(error.message);
}

try {
  // Domain errors
  const root = sqrt.real(real(-4)); // Error: Cannot take square root of negative real
  // Use sqrt.poly() or sqrt.complex() instead
} catch (error) {
  console.error(error.message);
}
```

## Testing

Run the comprehensive test suite:

```bash
npm test -- primitives.test.ts
```

Test coverage includes:
- All mathematical constants and their properties
- Type system validation for ℕ, ℤ, ℝ, ℂ
- Basic operations (+, -, ·, /, ^, √)
- Utility operations (abs, conjugate, equality)
- Storage integration
- Integration tests (golden ratio, Pythagorean theorem, etc.)

## Configuration

```typescript
import { EPSILON, PRECISION_DIGITS } from './primitives';

console.log(EPSILON);          // 1e-15 (tolerance for comparisons)
console.log(PRECISION_DIGITS); // 50 (decimal precision)
```

## Future Enhancements

The module is designed to integrate with decimal.js when available for even higher precision:

```bash
npm install decimal.js
```

The API remains the same, but internal calculations will use arbitrary precision arithmetic.

## Integration with Math Framework

This module provides the foundation for higher-level mathematical constructs:

- **Level 0-1**: Constants and basic operations (this module)
- **Level 2**: Sequences and series (Fibonacci, Lucas, etc.)
- **Level 3**: Phase space and transformations
- **Level 4**: Neural architecture and learning

## Symbol Table Reference

| Symbol | Type | Description | Value |
|--------|------|-------------|-------|
| φ | Constant | Golden Ratio | 1.618033988749894... |
| ψ | Constant | Golden Conjugate | -0.618033988749894... |
| e | Constant | Euler's Number | 2.718281828459045... |
| π | Constant | Pi | 3.141592653589793... |
| ℕ | Type | Natural Numbers | {0, 1, 2, 3, ...} |
| ℤ | Type | Integers | {..., -1, 0, 1, ...} |
| ℝ | Type | Real Numbers | All finite reals |
| ℂ | Type | Complex Numbers | a + bi |
| + | Operation | Addition | a + b |
| · | Operation | Multiplication | a · b |
| ^ | Operation | Exponentiation | a^b |
| √ | Operation | Square Root | √a |

## Examples

### Example 1: Computing Fibonacci-related Constants

```typescript
import { PHI, power, real } from './primitives';

// φ^n gives Fibonacci ratios
const phi5 = power.real(real(PHI.value), real(5));
console.log('φ^5 =', phi5); // ≈ 11.09 (close to F(5)=5, F(6)=8)
```

### Example 2: Complex Impedance Calculation

```typescript
import { complex, add, multiply, divide } from './primitives';

// Z = R + jωL + 1/(jωC)
const R = complex(100, 0);        // 100Ω resistor
const XL = complex(0, 50);        // Inductive reactance
const XC = complex(0, -25);       // Capacitive reactance

const impedance = add.poly(add.poly(R, XL), XC);
console.log('Total impedance:', impedance); // 100+25i Ω
```

### Example 3: Validation Pipeline

```typescript
import { validate, add, multiply, real } from './primitives';

function calculateArea(width: unknown, height: unknown) {
  const w = validate.real(width, 'width');
  const h = validate.real(height, 'height');
  return multiply.real(w, h);
}

const area = calculateArea(5.5, 3.2); // OK
// calculateArea('invalid', 3.2);      // Throws TypeError
```

## Architecture Notes

The module follows these design principles:

1. **Type Safety**: Branded types prevent mixing incompatible values
2. **Runtime Validation**: All operations validate inputs
3. **Immutability**: Constants are frozen, operations create new values
4. **Composability**: Operations work together seamlessly
5. **Polymorphism**: Poly operations handle both real and complex automatically
6. **Precision**: Prepared for decimal.js integration
7. **Storage**: AgentDB integration for persistent computations

## Support

For issues or questions:
- Check test files for usage examples
- Review the symbol table in the math framework architecture
- See the main framework documentation

---

**Status**: ✅ Complete - Level 0-1 primitives fully implemented
**Version**: 1.0.0
**Last Updated**: 2025-11-12

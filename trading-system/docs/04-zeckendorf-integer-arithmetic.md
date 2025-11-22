# Zeckendorf Representation and Integer-Only Arithmetic Framework

## Overview

This document covers Zeckendorf representation (Fibonacci base numeral system) and comprehensive integer-only arithmetic frameworks for trading systems, including fixed-point arithmetic and log-space dynamics.

---

## Part 1: Zeckendorf Representation

### Zeckendorf's Theorem

**Statement:** Every positive integer can be represented uniquely as the sum of one or more distinct, non-consecutive Fibonacci numbers.

**Mathematical Foundation:**
```
For any positive integer n, there exists a unique representation:

n = F(k₁) + F(k₂) + ... + F(kₘ)

where:
- F(kᵢ) are Fibonacci numbers
- k₁ > k₂ > ... > kₘ ≥ 2
- kᵢ - kᵢ₊₁ ≥ 2 (no consecutive Fibonacci numbers)
```

**Example:**
```
100 = 89 + 8 + 3
    = F(11) + F(6) + F(4)

17 = 13 + 3 + 1
   = F(7) + F(4) + F(2)
```

### Integer Encoding

Represent integers in "Fibonacci base" using binary-like notation:

```
Binary representation: position i → 2^i
Zeckendorf representation: position i → F(i)

Example: 100 in Zeckendorf
Fibonacci: ... 144 89 55 34 21 13 8 5 3 2 1 1
Index:     ... 12  11 10 9  8  7  6 5 4 3 2 1
Binary:    0   1   0  0  0  0  1 0 1 0 0 0

100 = 1×F(11) + 0×F(10) + ... + 1×F(6) + ... + 1×F(4) + ...
100 = 1×89 + 0×55 + 0×34 + 0×21 + 0×13 + 1×8 + 0×5 + 1×3 + 0×2 + 0×1
100 = 89 + 8 + 3
```

---

## Zeckendorf Arithmetic Operations

### Addition Algorithm

```python
def zeckendorf_add(num1_zeck, num2_zeck):
    """
    Add two numbers in Zeckendorf representation.

    Args:
        num1_zeck: List of Fibonacci indices for first number
        num2_zeck: List of Fibonacci indices for second number

    Returns:
        Zeckendorf representation of sum
    """
    # Convert to integers, add, convert back
    # (Simple approach - more efficient algorithms exist)

    sum_int = sum([FIBONACCI[i] for i in num1_zeck])
    sum_int += sum([FIBONACCI[i] for i in num2_zeck])

    return integer_to_zeckendorf(sum_int)

def integer_to_zeckendorf(n):
    """
    Convert integer to Zeckendorf representation.
    Greedy algorithm: O(log n) time complexity.

    Args:
        n: Positive integer

    Returns:
        List of Fibonacci indices
    """
    if n <= 0:
        return []

    # Pre-computed Fibonacci sequence
    FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987,
                 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025]

    result_indices = []
    remaining = n

    # Greedy: use largest Fibonacci numbers first
    for i in range(len(FIBONACCI) - 1, -1, -1):
        if FIBONACCI[i] <= remaining:
            result_indices.append(i)
            remaining -= FIBONACCI[i]

            if remaining == 0:
                break

    return sorted(result_indices, reverse=True)

def zeckendorf_to_integer(zeck_indices):
    """Convert Zeckendorf representation to integer."""
    FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987,
                 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025]

    return sum([FIBONACCI[i] for i in zeck_indices])
```

### Efficient Addition (Linear Time)

Research shows addition can be performed in **O(n)** time using combinational logic:

```python
def zeckendorf_add_efficient(z1, z2):
    """
    Efficient Zeckendorf addition using carry propagation.
    Based on research: "Efficient Algorithms for Zeckendorf Arithmetic"

    Args:
        z1, z2: Binary arrays where z[i] = 1 if F(i) is in representation

    Returns:
        Zeckendorf representation of sum
    """
    # Create combined representation (may have consecutive 1s)
    max_len = max(len(z1), len(z2)) + 3  # Extra space for carries
    result = [0] * max_len

    # Add corresponding positions
    for i in range(len(z1)):
        result[i] += z1[i]
    for i in range(len(z2)):
        result[i] += z2[i]

    # Normalize: eliminate consecutive Fibonacci numbers
    # Rule: F(i) + F(i+1) = F(i+2)
    # Rule: 2×F(i) = F(i+1) + F(i-2)

    i = 0
    while i < len(result) - 2:
        if result[i] >= 2:
            # 2×F(i) = F(i+1) + F(i-2)
            carry = result[i] // 2
            result[i+1] += carry
            if i >= 2:
                result[i-2] += carry
            result[i] %= 2

        if result[i] == 1 and result[i+1] == 1:
            # F(i) + F(i+1) = F(i+2)
            result[i] = 0
            result[i+1] = 0
            result[i+2] += 1

        i += 1

    # Remove leading zeros
    while len(result) > 0 and result[-1] == 0:
        result.pop()

    return result
```

### Multiplication Algorithm

Research shows multiplication of two n-digit Zeckendorf numbers can be performed in **O(n log n)** time:

```python
def zeckendorf_multiply(z1, z2):
    """
    Multiply two Zeckendorf representations.
    Simplified implementation - production would use FFT-based approach.

    Time complexity: O(n²) for this version, O(n log n) possible

    Args:
        z1, z2: Zeckendorf representations

    Returns:
        Product in Zeckendorf representation
    """
    # Convert to integer, multiply, convert back
    # (Actual efficient implementation would work directly in Zeckendorf space)

    val1 = zeckendorf_to_integer(z1)
    val2 = zeckendorf_to_integer(z2)
    product = val1 * val2

    return integer_to_zeckendorf(product)

# Note: Advanced implementation using "Zeckendorf Multiplication Table"
# can achieve O(n log n) complexity as shown in research literature
```

---

## Applications to Trading Systems

### Price Encoding

**Concept:** Store prices in Zeckendorf representation for:
- Compact storage (comparable to binary)
- Natural alignment with Fibonacci trading levels
- Efficient comparison operations

```python
class ZeckendorfPrice:
    """
    Price representation using Zeckendorf encoding.
    All operations integer-only.
    """

    def __init__(self, price_cents):
        """
        Args:
            price_cents: Price in cents (e.g., $123.45 → 12345)
        """
        self.price_cents = price_cents
        self.zeck_repr = integer_to_zeckendorf(price_cents)

    def at_fibonacci_level(self):
        """
        Check if price is exactly a Fibonacci number.
        Efficient in Zeckendorf representation.

        Returns:
            (is_fibonacci, fibonacci_index)
        """
        # Price is Fibonacci if Zeckendorf has only one component
        if len(self.zeck_repr) == 1:
            return (True, self.zeck_repr[0])
        return (False, -1)

    def fibonacci_components(self):
        """
        Get Fibonacci number breakdown of price.
        Natural representation in Zeckendorf.

        Returns:
            List of (fibonacci_number, index) tuples
        """
        FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610,
                     987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025]

        components = []
        for idx in self.zeck_repr:
            components.append((FIBONACCI[idx], idx))

        return components

    def distance_to_next_fibonacci(self):
        """
        Calculate distance to next higher Fibonacci number.
        Useful for resistance level calculation.

        Returns:
            Distance in cents
        """
        FIBONACCI = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610,
                     987, 1597, 2584, 4181, 6765, 10946, 17711, 28657, 46368, 75025]

        # Find largest Fibonacci component
        if not self.zeck_repr:
            return FIBONACCI[0]

        max_fib_idx = max(self.zeck_repr)

        # If already pure Fibonacci, next is next index
        if len(self.zeck_repr) == 1:
            if max_fib_idx + 1 < len(FIBONACCI):
                next_fib = FIBONACCI[max_fib_idx + 1]
                return next_fib - self.price_cents

        # Otherwise, next is the Fibonacci number just above current
        for i in range(max_fib_idx + 1, len(FIBONACCI)):
            if FIBONACCI[i] > self.price_cents:
                return FIBONACCI[i] - self.price_cents

        return 0

# Example usage:
price = ZeckendorfPrice(12345)  # $123.45
print(f"Price $123.45 = {price.fibonacci_components()}")
# Output: [(10946, 19), (987, 14), (377, 12), (34, 7), (1, 0)]
# $123.45 = $109.46 + $9.87 + $3.77 + $0.34 + $0.01

is_fib, idx = price.at_fibonacci_level()
print(f"Is Fibonacci number: {is_fib}")

distance = price.distance_to_next_fibonacci()
print(f"Distance to next Fibonacci level: ${distance/100:.2f}")
```

### Bit Compression

Zeckendorf representation provides efficient bit compression:

```python
def compress_price_history_zeckendorf(prices):
    """
    Compress price history using Zeckendorf representation.

    Args:
        prices: List of prices (integers)

    Returns:
        Compressed representation (list of bit arrays)
    """
    compressed = []

    for price in prices:
        zeck = integer_to_zeckendorf(price)

        # Convert to bit array
        max_idx = max(zeck) if zeck else 0
        bit_array = [0] * (max_idx + 1)

        for idx in zeck:
            bit_array[idx] = 1

        compressed.append(bit_array)

    return compressed

def calculate_compression_ratio(prices):
    """
    Calculate compression ratio vs standard binary.

    Returns:
        Ratio of Zeckendorf bits to binary bits
    """
    import math

    total_binary_bits = 0
    total_zeck_bits = 0

    for price in prices:
        # Binary: need ceil(log2(price)) bits
        binary_bits = math.ceil(math.log2(price)) if price > 0 else 1
        total_binary_bits += binary_bits

        # Zeckendorf: need max Fibonacci index + 1
        zeck = integer_to_zeckendorf(price)
        zeck_bits = max(zeck) + 1 if zeck else 1
        total_zeck_bits += zeck_bits

    return total_zeck_bits / total_binary_bits

# Example:
prices = [10000, 15000, 12500, 13750, 14200]
ratio = calculate_compression_ratio(prices)
print(f"Zeckendorf vs Binary compression ratio: {ratio:.2f}")
# Typically close to 1.0, sometimes slightly better for certain ranges
```

---

## Part 2: Fixed-Point Arithmetic

### Core Principles

**Definition:** Represent real numbers as integers with implicit scaling factor.

```
Real value = Integer value / Scale

Examples with SCALE = 10000:
1.2345 → 12345 (stored as integer)
0.0001 → 1
100.0000 → 1000000
```

### Implementation

```c
// C implementation for trading systems

typedef int64_t fixed_point_t;

#define SCALE 1000000  // 6 decimal places
#define SCALE_BITS 20  // For shift-based operations

// Addition
fixed_point_t fp_add(fixed_point_t a, fixed_point_t b) {
    return a + b;  // Direct addition
}

// Subtraction
fixed_point_t fp_sub(fixed_point_t a, fixed_point_t b) {
    return a - b;  // Direct subtraction
}

// Multiplication
fixed_point_t fp_mul(fixed_point_t a, fixed_point_t b) {
    // Result has scale^2, need to divide by scale
    int64_t product = (int64_t)a * (int64_t)b;
    return product / SCALE;
}

// Division
fixed_point_t fp_div(fixed_point_t a, fixed_point_t b) {
    // Multiply numerator by scale before division
    int64_t scaled_a = (int64_t)a * SCALE;
    return scaled_a / b;
}

// Convert float to fixed-point
fixed_point_t float_to_fp(double value) {
    return (fixed_point_t)(value * SCALE);
}

// Convert fixed-point to float
double fp_to_float(fixed_point_t fp) {
    return (double)fp / SCALE;
}
```

### Price Calculations

```python
class FixedPointPrice:
    """
    Fixed-point price representation for trading.
    SCALE = 1,000,000 (6 decimal places)
    """

    SCALE = 1_000_000

    def __init__(self, value):
        """
        Args:
            value: Can be float, int, or another FixedPointPrice
        """
        if isinstance(value, float):
            self.value = int(value * self.SCALE)
        elif isinstance(value, int):
            self.value = value  # Already scaled
        elif isinstance(value, FixedPointPrice):
            self.value = value.value
        else:
            raise TypeError("Invalid type for FixedPointPrice")

    def __add__(self, other):
        result = FixedPointPrice(0)
        result.value = self.value + other.value
        return result

    def __sub__(self, other):
        result = FixedPointPrice(0)
        result.value = self.value - other.value
        return result

    def __mul__(self, other):
        result = FixedPointPrice(0)
        # Multiply and rescale
        result.value = (self.value * other.value) // self.SCALE
        return result

    def __truediv__(self, other):
        result = FixedPointPrice(0)
        # Scale up before division
        result.value = (self.value * self.SCALE) // other.value
        return result

    def __lt__(self, other):
        return self.value < other.value

    def __gt__(self, other):
        return self.value > other.value

    def __eq__(self, other):
        return self.value == other.value

    def to_float(self):
        return self.value / self.SCALE

    def to_string(self, decimals=2):
        float_val = self.to_float()
        return f"{float_val:.{decimals}f}"

# Example: Moving average calculation
def calculate_sma_fixed_point(prices, period):
    """
    Calculate Simple Moving Average using fixed-point arithmetic.

    Args:
        prices: List of FixedPointPrice objects
        period: Number of periods

    Returns:
        FixedPointPrice SMA value
    """
    if len(prices) < period:
        return None

    # Sum last 'period' prices
    total = FixedPointPrice(0)
    for i in range(-period, 0):
        total = total + prices[i]

    # Divide by period
    divisor = FixedPointPrice(0)
    divisor.value = period * FixedPointPrice.SCALE  # Integer period

    sma = total / divisor
    return sma

# Usage:
prices = [FixedPointPrice(100.50), FixedPointPrice(101.25),
          FixedPointPrice(102.00), FixedPointPrice(101.75)]

sma = calculate_sma_fixed_point(prices, 4)
print(f"SMA: ${sma.to_string(2)}")  # Output: SMA: $101.38
```

---

## Part 3: Log-Space Dynamics

### Mathematical Foundation

**Purpose:** Prevent overflow in multiplication, enable efficient power calculations.

**Key Identity:**
```
log(a × b) = log(a) + log(b)
log(a / b) = log(a) - log(b)
log(a^n) = n × log(a)
a^n × b^m = exp(n×log(a) + m×log(b))
```

### Implementation with Lookup Tables

```python
class LogSpaceCalculator:
    """
    Integer-only calculations using log-space dynamics.
    Pre-computed logarithm tables for efficiency.
    """

    def __init__(self, max_value=100000, log_scale=1000000):
        """
        Args:
            max_value: Maximum value for lookup tables
            log_scale: Scaling factor for log values (integer representation)
        """
        self.max_value = max_value
        self.log_scale = log_scale

        # Pre-compute log table
        self.log_table = self._compute_log_table()
        self.exp_table = self._compute_exp_table()

    def _compute_log_table(self):
        """
        Compute logarithm lookup table.
        log_table[i] = int(log(i) × log_scale)
        """
        import math

        log_table = [0] * (self.max_value + 1)

        for i in range(1, self.max_value + 1):
            log_val = math.log(i)
            log_table[i] = int(log_val * self.log_scale)

        return log_table

    def _compute_exp_table(self):
        """
        Compute exponential lookup table (inverse of log).
        exp_table[i] = int(exp(i / log_scale))
        """
        import math

        max_log = self.log_table[self.max_value]
        exp_table = {}

        # Create reverse mapping
        for i in range(1, self.max_value + 1):
            log_val = self.log_table[i]
            exp_table[log_val] = i

        return exp_table

    def multiply(self, a, b):
        """
        Multiply two integers using log-space.
        Prevents overflow for large values.

        Args:
            a, b: Integers to multiply

        Returns:
            Product (may be approximate due to table quantization)
        """
        if a == 0 or b == 0:
            return 0

        # log(a × b) = log(a) + log(b)
        log_a = self.log_table[a]
        log_b = self.log_table[b]
        log_product = log_a + log_b

        # Find closest exp_table entry
        closest_log = min(self.exp_table.keys(),
                          key=lambda x: abs(x - log_product))

        return self.exp_table[closest_log]

    def power(self, base, exponent):
        """
        Calculate base^exponent using log-space.

        Args:
            base: Base value (integer)
            exponent: Exponent (integer)

        Returns:
            base^exponent
        """
        if base == 0:
            return 0
        if exponent == 0:
            return 1

        # log(base^exp) = exp × log(base)
        log_base = self.log_table[base]
        log_result = exponent * log_base

        # Convert back
        closest_log = min(self.exp_table.keys(),
                         key=lambda x: abs(x - log_result))

        return self.exp_table[closest_log]

# Example usage:
calc = LogSpaceCalculator(max_value=100000)

# Multiply large numbers without overflow
a = 50000
b = 60000
product = calc.multiply(a, b)  # Would overflow 32-bit int normally
print(f"{a} × {b} ≈ {product}")

# Calculate powers
base = 1000
exp = 3
result = calc.power(base, exp)
print(f"{base}^{exp} ≈ {result}")
```

### Application: Compound Returns

```python
def calculate_compound_return_logspace(returns, calc):
    """
    Calculate compound return using log-space to prevent overflow.

    Args:
        returns: List of period returns (integers, scaled by 1000)
                 e.g., 5% return = 1050 (representing 1.050)
        calc: LogSpaceCalculator instance

    Returns:
        Compound return (integer, scaled by 1000)
    """
    # log(r1 × r2 × r3 × ...) = log(r1) + log(r2) + log(r3) + ...

    log_sum = 0
    for ret in returns:
        if ret in calc.log_table:
            log_sum += calc.log_table[ret]
        else:
            # Handle out-of-range values
            import math
            log_sum += int(math.log(ret) * calc.log_scale)

    # Convert back to linear space
    closest_log = min(calc.exp_table.keys(),
                     key=lambda x: abs(x - log_sum))

    compound_return = calc.exp_table[closest_log]

    return compound_return

# Example:
# 10 periods of 5% return each
returns = [1050] * 10  # 1.05 scaled by 1000

calc = LogSpaceCalculator(max_value=10000)
compound = calculate_compound_return_logspace(returns, calc)

print(f"Compound return after 10 periods: {compound/1000:.3f}")
# Expected: (1.05)^10 ≈ 1.629
```

---

## Performance Considerations

### Fixed-Point vs Floating-Point

**Advantages of Fixed-Point:**
- Faster execution (uses integer ALU, more instruction ports available)
- Deterministic results (no floating-point non-determinism)
- Exact decimal representation (critical for financial calculations)
- No cumulative rounding errors
- Better for embedded systems

**Disadvantages:**
- Limited dynamic range (need to choose scale carefully)
- Risk of overflow (mitigated with 64-bit integers)
- Manual scaling management

### Zeckendorf Performance

**Time Complexity:**
- **Conversion to Zeckendorf:** O(log n) using greedy algorithm
- **Addition:** O(n) where n is number of digits
- **Multiplication:** O(n log n) with advanced algorithms

**Space Complexity:**
- Approximately log_φ(n) bits needed (vs log₂(n) for binary)
- Ratio: log_φ(n) / log₂(n) ≈ 1.44 (slightly larger than binary)

### Log-Space Efficiency

**Advantages:**
- Prevents overflow in multiplication chains
- Efficient power calculations
- Reduced precision requirements for some operations

**Disadvantages:**
- Quantization error from lookup tables
- Memory overhead for tables
- Not suitable for addition/subtraction

---

## Sources

- [Zeckendorf representation - Encyclopedia of Mathematics](https://encyclopediaofmath.org/wiki/Zeckendorf_representation)
- [Zeckendorf's theorem - Wikipedia](https://en.wikipedia.org/wiki/Zeckendorf's_theorem)
- [Efficient Algorithms for Zeckendorf Arithmetic (arXiv)](https://arxiv.org/abs/1207.4497)
- [Zeckendorf Integer Arithmetic - Peter Fenwick](https://www.cs.auckland.ac.nz/~peter-f/FTPfiles/Zeckendorf.pdf)
- [Fixed Point Arithmetic | Speculative Branches](https://specbranch.com/posts/fixed-point/)
- [Fixed-point arithmetic - Wikipedia](https://en.wikipedia.org/wiki/Fixed-point_arithmetic)
- [Fixed-Point Arithmetic - MATLAB & Simulink](https://www.mathworks.com/help/fixedpoint/gs/fixed-point-arithmetic-tutorial.html)

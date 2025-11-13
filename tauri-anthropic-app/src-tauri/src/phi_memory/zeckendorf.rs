/// Zeckendorf Representation
///
/// Every positive integer has a unique representation as a sum of
/// non-consecutive Fibonacci numbers (Zeckendorf's theorem).
///
/// Example: 100 = 89 + 8 + 3 = F_11 + F_6 + F_4
/// Bit representation: positions {4, 6, 11} are set

use std::sync::OnceLock;

/// Fibonacci cache (F_0 to F_92 for u64)
static FIBONACCI_NUMBERS: OnceLock<Vec<u64>> = OnceLock::new();

/// Get cached Fibonacci numbers up to F_92 (max for u64)
pub fn fibonacci_cache() -> &'static Vec<u64> {
    FIBONACCI_NUMBERS.get_or_init(|| {
        let mut fibs = vec![0, 1]; // F_0, F_1

        // Generate up to F_92 (largest Fibonacci number in u64)
        for i in 2..93 {
            let next = fibs[i - 1] + fibs[i - 2];
            if next > u64::MAX / 2 {
                break; // Prevent overflow
            }
            fibs.push(next);
        }

        fibs
    })
}

/// Convert integer to Zeckendorf representation (bit field)
///
/// Uses greedy algorithm: subtract largest Fibonacci ≤ n
/// Returns u64 where bit i is set if F_i is in the representation
///
/// # Example
/// ```
/// let bits = to_zeckendorf(100);
/// // 100 = F_11(89) + F_6(8) + F_4(3)
/// // Returns: 0b1000001010000 (bits 4,6,11 set)
/// ```
pub fn to_zeckendorf(mut n: u64) -> u64 {
    if n == 0 {
        return 0;
    }

    let fibs = fibonacci_cache();
    let mut result = 0u64;

    // Start from largest Fibonacci ≤ n
    for i in (2..fibs.len()).rev() {
        if fibs[i] <= n {
            // Set bit at position i
            result |= 1u64 << i;
            n -= fibs[i];

            if n == 0 {
                break;
            }
        }
    }

    result
}

/// Convert Zeckendorf bit field back to integer
///
/// Sum all Fibonacci numbers at positions where bit = 1
///
/// # Example
/// ```
/// let bits = 0b1000001010000; // positions 4,6,11
/// let n = from_zeckendorf(bits);
/// // n = F_4 + F_6 + F_11 = 3 + 8 + 89 = 100
/// ```
pub fn from_zeckendorf(bits: u64) -> u64 {
    let fibs = fibonacci_cache();
    let mut sum = 0u64;

    for i in 0..64 {
        if (bits & (1u64 << i)) != 0 {
            if i < fibs.len() {
                sum += fibs[i];
            }
        }
    }

    sum
}

/// Check if bit field represents valid Zeckendorf (no adjacent bits)
pub fn is_valid_zeckendorf(bits: u64) -> bool {
    (bits & (bits << 1)) == 0
}

/// Normalize bit field to valid Zeckendorf via cascading
///
/// Repeatedly apply: F_i + F_{i+1} = F_{i+2}
/// Collapses adjacent bits to higher position
pub fn normalize(mut bits: u64) -> u64 {
    let mut changed = true;

    while changed {
        changed = false;

        // Find adjacent bits
        let adjacent = bits & (bits << 1);

        if adjacent != 0 {
            // Get position of lowest adjacent pair
            let pos = adjacent.trailing_zeros();

            // Clear bits at pos and pos+1
            bits &= !(3u64 << pos);

            // Set bit at pos+2 (Fibonacci collapse)
            bits |= 1u64 << (pos + 2);

            changed = true;
        }
    }

    bits
}

/// Get Fibonacci number at index i
pub fn fibonacci(i: usize) -> Option<u64> {
    fibonacci_cache().get(i).copied()
}

/// Find index of largest Fibonacci ≤ n
pub fn largest_fib_index(n: u64) -> usize {
    let fibs = fibonacci_cache();

    for i in (0..fibs.len()).rev() {
        if fibs[i] <= n {
            return i;
        }
    }

    0
}

/// Decompose integer into Fibonacci components
/// Returns Vec of (index, value) pairs
///
/// # Example
/// ```
/// let components = decompose(100);
/// // Returns: [(4, 3), (6, 8), (11, 89)]
/// ```
pub fn decompose(n: u64) -> Vec<(usize, u64)> {
    let bits = to_zeckendorf(n);
    let fibs = fibonacci_cache();
    let mut result = Vec::new();

    for i in 0..64 {
        if (bits & (1u64 << i)) != 0 {
            if i < fibs.len() {
                result.push((i, fibs[i]));
            }
        }
    }

    result
}

/// Compute Zeckendorf distance between two integers
/// Distance = Hamming distance in Zeckendorf space
pub fn zeckendorf_distance(a: u64, b: u64) -> u32 {
    let bits_a = to_zeckendorf(a);
    let bits_b = to_zeckendorf(b);
    (bits_a ^ bits_b).count_ones()
}

/// Golden ratio φ approximation via Fibonacci ratio
/// lim_{n→∞} F_{n+1}/F_n = φ
pub fn phi_approximation(n: usize) -> Option<f64> {
    let fibs = fibonacci_cache();

    if n + 1 < fibs.len() && fibs[n] > 0 {
        Some(fibs[n + 1] as f64 / fibs[n] as f64)
    } else {
        None
    }
}

/// Lucas numbers (companion to Fibonacci)
/// L_0 = 2, L_1 = 1, L_n = L_{n-1} + L_{n-2}
/// Used for sync points: {2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123...}
pub fn lucas_sequence(n: usize) -> Vec<u64> {
    if n == 0 {
        return vec![];
    }

    let mut lucas = vec![2, 1];

    for i in 2..n {
        let next = lucas[i - 1] + lucas[i - 2];
        lucas.push(next);
    }

    lucas
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fibonacci_cache() {
        let fibs = fibonacci_cache();
        assert_eq!(fibs[0], 0);
        assert_eq!(fibs[1], 1);
        assert_eq!(fibs[2], 1);
        assert_eq!(fibs[3], 2);
        assert_eq!(fibs[4], 3);
        assert_eq!(fibs[5], 5);
        assert_eq!(fibs[6], 8);
        assert_eq!(fibs[10], 55);
    }

    #[test]
    fn test_to_zeckendorf() {
        // 5 = F_5 (5)
        let bits = to_zeckendorf(5);
        assert_eq!(bits, 1u64 << 5);

        // 10 = F_6(8) + F_3(2) = 8 + 2
        let bits = to_zeckendorf(10);
        assert_eq!(from_zeckendorf(bits), 10);
    }

    #[test]
    fn test_from_zeckendorf() {
        // Bits at positions 4,6,11
        // F_4(3) + F_6(8) + F_11(89) = 100
        let bits = (1u64 << 4) | (1u64 << 6) | (1u64 << 11);
        assert_eq!(from_zeckendorf(bits), 100);
    }

    #[test]
    fn test_roundtrip() {
        for n in [0, 1, 5, 10, 42, 100, 255, 1000, 12345] {
            let bits = to_zeckendorf(n);
            let recovered = from_zeckendorf(bits);
            assert_eq!(n, recovered, "Roundtrip failed for {}", n);
        }
    }

    #[test]
    fn test_normalize() {
        // Adjacent bits at 2,3 should cascade to 4
        // 0b1100 → 0b10000
        let bits = 0b1100;
        let normalized = normalize(bits);
        assert_eq!(normalized, 0b10000);
        assert!(is_valid_zeckendorf(normalized));
    }

    #[test]
    fn test_decompose() {
        let components = decompose(100);

        // 100 = F_11(89) + F_6(8) + F_4(3)
        assert_eq!(components.len(), 3);
        assert!(components.contains(&(4, 3)));
        assert!(components.contains(&(6, 8)));
        assert!(components.contains(&(11, 89)));
    }

    #[test]
    fn test_phi_approximation() {
        // φ ≈ 1.618033988749895
        let phi = phi_approximation(20).unwrap();
        assert!((phi - 1.618033988749895).abs() < 0.0001);
    }

    #[test]
    fn test_lucas_sequence() {
        let lucas = lucas_sequence(10);
        assert_eq!(lucas, vec![2, 1, 3, 4, 7, 11, 18, 29, 47, 76]);
    }

    #[test]
    fn test_zeckendorf_distance() {
        // Same number = 0 distance
        assert_eq!(zeckendorf_distance(42, 42), 0);

        // Different numbers have Hamming distance
        let dist = zeckendorf_distance(10, 20);
        assert!(dist > 0);
    }

    #[test]
    fn test_no_adjacent_bits() {
        // Zeckendorf property: no adjacent Fibonacci numbers
        for n in 1..1000 {
            let bits = to_zeckendorf(n);
            assert!(is_valid_zeckendorf(bits),
                   "Adjacent bits found for n={}, bits={:b}", n, bits);
        }
    }
}

//! Fast Fibonacci and Lucas sequence generation using matrix exponentiation
//!
//! This module implements O(log n) algorithms for computing Fibonacci and Lucas numbers
//! using matrix exponentiation and memoization.

use num_bigint::BigUint;
use num_traits::{One, Zero};
use std::collections::HashMap;
use std::sync::Mutex;

/// Cache for memoized Fibonacci and Lucas numbers
static FIB_CACHE: Mutex<Option<HashMap<u64, BigUint>>> = Mutex::new(None);
static LUCAS_CACHE: Mutex<Option<HashMap<u64, BigUint>>> = Mutex::new(None);

/// Initialize caches
pub fn init_caches() {
    let mut fib = FIB_CACHE.lock().unwrap();
    if fib.is_none() {
        *fib = Some(HashMap::new());
    }

    let mut lucas = LUCAS_CACHE.lock().unwrap();
    if lucas.is_none() {
        *lucas = Some(HashMap::new());
    }
}

/// Clear all caches (useful for testing or memory management)
pub fn clear_caches() {
    if let Ok(mut fib) = FIB_CACHE.lock() {
        if let Some(cache) = fib.as_mut() {
            cache.clear();
        }
    }

    if let Ok(mut lucas) = LUCAS_CACHE.lock() {
        if let Some(cache) = lucas.as_mut() {
            cache.clear();
        }
    }
}

/// Matrix multiplication for 2x2 matrices
/// Used in fast Fibonacci computation
fn matrix_mult(a: &[BigUint; 4], b: &[BigUint; 4]) -> [BigUint; 4] {
    [
        &a[0] * &b[0] + &a[1] * &b[2],
        &a[0] * &b[1] + &a[1] * &b[3],
        &a[2] * &b[0] + &a[3] * &b[2],
        &a[2] * &b[1] + &a[3] * &b[3],
    ]
}

/// Matrix exponentiation using binary exponentiation
/// Base matrix [[1, 1], [1, 0]] for Fibonacci
fn matrix_pow(mut n: u64) -> [BigUint; 4] {
    if n == 0 {
        return [
            BigUint::one(),
            BigUint::zero(),
            BigUint::zero(),
            BigUint::one(),
        ];
    }

    // Base matrix [[1, 1], [1, 0]]
    let base: [BigUint; 4] = [
        BigUint::one(),
        BigUint::one(),
        BigUint::one(),
        BigUint::zero(),
    ];

    let mut result = [
        BigUint::one(),
        BigUint::zero(),
        BigUint::zero(),
        BigUint::one(),
    ];
    let mut power = base.clone();

    while n > 0 {
        if n & 1 == 1 {
            result = matrix_mult(&result, &power);
        }
        power = matrix_mult(&power, &power);
        n >>= 1;
    }

    result
}

/// Compute Fibonacci number F(n) in O(log n) time using matrix exponentiation
///
/// Uses the matrix formula:
/// [[F(n+1), F(n)  ],  = [[1, 1],^n
///  [F(n),   F(n-1)]]    [1, 0]]
pub fn fibonacci(n: u64) -> BigUint {
    // Check cache first
    {
        let cache = FIB_CACHE.lock().unwrap();
        if let Some(ref map) = *cache {
            if let Some(cached) = map.get(&n) {
                return cached.clone();
            }
        }
    }

    let result = if n == 0 {
        BigUint::zero()
    } else if n == 1 {
        BigUint::one()
    } else {
        let matrix = matrix_pow(n);
        matrix[2].clone() // F(n) is at position [2] (bottom-left)
    };

    // Cache the result
    {
        let mut cache = FIB_CACHE.lock().unwrap();
        if let Some(ref mut map) = *cache {
            map.insert(n, result.clone());
        }
    }

    result
}

/// Compute Lucas number L(n) in O(log n) time
///
/// Lucas numbers follow the same recurrence as Fibonacci but with different initial values:
/// L(0) = 2, L(1) = 1, L(n) = L(n-1) + L(n-2)
///
/// Relation to Fibonacci: L(n) = F(n-1) + F(n+1)
pub fn lucas(n: u64) -> BigUint {
    // Check cache first
    {
        let cache = LUCAS_CACHE.lock().unwrap();
        if let Some(ref map) = *cache {
            if let Some(cached) = map.get(&n) {
                return cached.clone();
            }
        }
    }

    let result = match n {
        0 => BigUint::from(2u32),
        1 => BigUint::one(),
        _ => {
            // L(n) = F(n-1) + F(n+1)
            let f_prev = fibonacci(n - 1);
            let f_next = fibonacci(n + 1);
            &f_prev + &f_next
        }
    };

    // Cache the result
    {
        let mut cache = LUCAS_CACHE.lock().unwrap();
        if let Some(ref mut map) = *cache {
            map.insert(n, result.clone());
        }
    }

    result
}

/// Compute multiple Fibonacci numbers efficiently
pub fn fibonacci_range(start: u64, end: u64) -> Vec<BigUint> {
    (start..=end).map(fibonacci).collect()
}

/// Compute multiple Lucas numbers efficiently
pub fn lucas_range(start: u64, end: u64) -> Vec<BigUint> {
    (start..=end).map(lucas).collect()
}

/// Get the golden ratio φ = (1 + √5) / 2 approximation using Fibonacci
/// F(n+1) / F(n) approaches φ as n increases
pub fn golden_ratio_approximation(n: u64) -> f64 {
    let f_n = fibonacci(n);
    let f_n_plus_1 = fibonacci(n + 1);

    // Convert to f64 for division (will be approximate for large n)
    let numerator = f_n_plus_1.to_string().parse::<f64>().unwrap_or(f64::INFINITY);
    let denominator = f_n.to_string().parse::<f64>().unwrap_or(1.0);

    numerator / denominator
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fibonacci_base_cases() {
        assert_eq!(fibonacci(0), BigUint::zero());
        assert_eq!(fibonacci(1), BigUint::one());
        assert_eq!(fibonacci(2), BigUint::one());
        assert_eq!(fibonacci(3), BigUint::from(2u32));
        assert_eq!(fibonacci(4), BigUint::from(3u32));
        assert_eq!(fibonacci(5), BigUint::from(5u32));
        assert_eq!(fibonacci(6), BigUint::from(8u32));
    }

    #[test]
    fn test_fibonacci_large() {
        // F(100) = 354224848179261915075
        let f_100 = fibonacci(100);
        assert_eq!(
            f_100.to_string(),
            "354224848179261915075"
        );
    }

    #[test]
    fn test_lucas_base_cases() {
        assert_eq!(lucas(0), BigUint::from(2u32));
        assert_eq!(lucas(1), BigUint::one());
        assert_eq!(lucas(2), BigUint::from(3u32));
        assert_eq!(lucas(3), BigUint::from(4u32));
        assert_eq!(lucas(4), BigUint::from(7u32));
    }

    #[test]
    fn test_golden_ratio() {
        let ratio = golden_ratio_approximation(20);
        // φ ≈ 1.618033988749895
        assert!((ratio - 1.618033988749895).abs() < 0.0001);
    }

    #[test]
    fn test_cache() {
        clear_caches();
        init_caches();

        // First call should compute
        let _ = fibonacci(50);

        // Second call should use cache
        let _ = fibonacci(50);

        // Verify cache has the value
        let cache = FIB_CACHE.lock().unwrap();
        assert!(cache.as_ref().unwrap().contains_key(&50));
    }
}

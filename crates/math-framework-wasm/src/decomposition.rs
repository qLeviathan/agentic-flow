//! Zeckendorf decomposition using greedy algorithm
//!
//! Every positive integer can be uniquely represented as a sum of non-consecutive Fibonacci numbers.
//! This is known as Zeckendorf's theorem.

use crate::sequences::fibonacci;
use num_bigint::BigUint;
use num_traits::Zero;

/// Zeckendorf decomposition result
#[derive(Debug, Clone, PartialEq)]
pub struct ZeckendorfDecomposition {
    /// The original number
    pub number: BigUint,
    /// Indices of Fibonacci numbers in the decomposition
    pub indices: Vec<u64>,
    /// The actual Fibonacci numbers in the decomposition
    pub fibonacci_numbers: Vec<BigUint>,
    /// Sum verification (should equal number)
    pub sum: BigUint,
}

impl ZeckendorfDecomposition {
    /// Verify that the decomposition is valid
    pub fn is_valid(&self) -> bool {
        // Check sum equals original number
        if self.sum != self.number {
            return false;
        }

        // Check no consecutive indices
        for i in 0..self.indices.len().saturating_sub(1) {
            if self.indices[i + 1] - self.indices[i] == 1 {
                return false;
            }
        }

        true
    }

    /// Get the Zeckendorf representation as a string
    pub fn to_string(&self) -> String {
        if self.fibonacci_numbers.is_empty() {
            return "0".to_string();
        }

        self.fibonacci_numbers
            .iter()
            .map(|n| n.to_string())
            .collect::<Vec<_>>()
            .join(" + ")
    }
}

/// Perform Zeckendorf decomposition using greedy algorithm
///
/// Time complexity: O(log n) where n is the input number
///
/// Algorithm:
/// 1. Find the largest Fibonacci number ≤ n
/// 2. Subtract it from n
/// 3. Repeat until n = 0
pub fn zeckendorf(mut n: BigUint) -> ZeckendorfDecomposition {
    let original = n.clone();
    let mut indices = Vec::new();
    let mut fibonacci_numbers = Vec::new();

    if n.is_zero() {
        return ZeckendorfDecomposition {
            number: original,
            indices,
            fibonacci_numbers,
            sum: BigUint::zero(),
        };
    }

    // Find the maximum Fibonacci index needed
    // We'll search for it efficiently
    let mut max_index = 2u64;
    while fibonacci(max_index) <= n {
        max_index += 1;
    }

    // Greedy algorithm: work backwards from largest Fibonacci number
    for i in (2..max_index).rev() {
        let fib_i = fibonacci(i);

        if fib_i <= n {
            indices.push(i);
            fibonacci_numbers.push(fib_i.clone());
            n -= fib_i;

            if n.is_zero() {
                break;
            }
        }
    }

    // Indices are already in descending order, reverse them for ascending order
    indices.reverse();
    fibonacci_numbers.reverse();

    // Calculate sum for verification
    let sum: BigUint = fibonacci_numbers.iter().sum();

    ZeckendorfDecomposition {
        number: original,
        indices,
        fibonacci_numbers,
        sum,
    }
}

/// Decompose multiple numbers efficiently
#[allow(dead_code)]
pub fn zeckendorf_batch(numbers: &[BigUint]) -> Vec<ZeckendorfDecomposition> {
    numbers.iter().map(|n| zeckendorf(n.clone())).collect()
}

/// Convert Zeckendorf representation to binary string
/// Each bit represents whether F(i+2) is in the decomposition
pub fn zeckendorf_to_binary(decomp: &ZeckendorfDecomposition) -> String {
    if decomp.indices.is_empty() {
        return "0".to_string();
    }

    let max_index = *decomp.indices.last().unwrap();
    let mut binary = vec![false; (max_index - 1) as usize]; // F(2) is at position 0

    for &idx in &decomp.indices {
        if idx >= 2 {
            binary[(idx - 2) as usize] = true;
        }
    }

    binary.iter()
        .rev()
        .map(|&b| if b { '1' } else { '0' })
        .collect()
}

/// Parse a Zeckendorf binary string back to a number
pub fn binary_to_zeckendorf(binary: &str) -> Result<BigUint, String> {
    let mut result = BigUint::zero();
    let len = binary.len();

    for (i, c) in binary.chars().enumerate() {
        if c == '1' {
            let fib_index = (len - i + 1) as u64;
            result += fibonacci(fib_index);
        } else if c != '0' {
            return Err(format!("Invalid binary character: {}", c));
        }
    }

    Ok(result)
}

/// Compute the Fibonacci weight (number of 1s in Zeckendorf representation)
pub fn fibonacci_weight(n: &BigUint) -> usize {
    let decomp = zeckendorf(n.clone());
    decomp.indices.len()
}

/// Check if a number is a Fibonacci number
pub fn is_fibonacci(n: &BigUint) -> bool {
    let decomp = zeckendorf(n.clone());
    decomp.indices.len() == 1
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_zeckendorf_small() {
        let decomp = zeckendorf(BigUint::from(10u32));
        assert_eq!(decomp.indices, vec![3, 6]); // F(3)=2, F(6)=8, 2+8=10
        assert!(decomp.is_valid());
    }

    #[test]
    fn test_zeckendorf_100() {
        let decomp = zeckendorf(BigUint::from(100u32));
        assert!(decomp.is_valid());
        assert_eq!(decomp.sum, BigUint::from(100u32));

        // 100 = 89 + 8 + 3 = F(11) + F(6) + F(4)
        let expected_indices = vec![4, 6, 11];
        assert_eq!(decomp.indices, expected_indices);
    }

    #[test]
    fn test_zeckendorf_zero() {
        let decomp = zeckendorf(BigUint::zero());
        assert!(decomp.indices.is_empty());
        assert_eq!(decomp.sum, BigUint::zero());
    }

    #[test]
    fn test_zeckendorf_fibonacci() {
        // F(10) = 55 should decompose to just [10]
        let decomp = zeckendorf(BigUint::from(55u32));
        assert_eq!(decomp.indices, vec![10]);
        assert!(decomp.is_valid());
    }

    #[test]
    fn test_no_consecutive() {
        let decomp = zeckendorf(BigUint::from(100u32));

        // Check no consecutive indices
        for i in 0..decomp.indices.len().saturating_sub(1) {
            let diff = decomp.indices[i + 1] - decomp.indices[i];
            assert!(diff > 1, "Found consecutive indices at positions {}", i);
        }
    }

    #[test]
    fn test_binary_conversion() {
        let decomp = zeckendorf(BigUint::from(100u32));
        let binary = zeckendorf_to_binary(&decomp);
        let reconstructed = binary_to_zeckendorf(&binary).unwrap();

        assert_eq!(reconstructed, BigUint::from(100u32));
    }

    #[test]
    fn test_fibonacci_weight() {
        assert_eq!(fibonacci_weight(&BigUint::from(10u32)), 2);
        assert_eq!(fibonacci_weight(&BigUint::from(55u32)), 1); // Fibonacci number
        assert_eq!(fibonacci_weight(&BigUint::from(100u32)), 3);
    }

    #[test]
    fn test_is_fibonacci() {
        assert!(is_fibonacci(&BigUint::from(1u32)));
        assert!(is_fibonacci(&BigUint::from(2u32)));
        assert!(is_fibonacci(&BigUint::from(3u32)));
        assert!(is_fibonacci(&BigUint::from(5u32)));
        assert!(is_fibonacci(&BigUint::from(8u32)));
        assert!(!is_fibonacci(&BigUint::from(4u32)));
        assert!(!is_fibonacci(&BigUint::from(6u32)));
        assert!(!is_fibonacci(&BigUint::from(7u32)));
    }
}

//! φ-Core: Logarithmic Intelligence Architecture
//!
//! This crate implements the mathematical foundation of AURELIA:
//! - φ-arithmetic (multiplication → addition)
//! - Zeckendorf bit cascade addressing
//! - Latent-N encoding theorem
//! - Base-φ memory allocation
//!
//! All operations are integer-only with O(1) complexity via lookup tables.

pub mod latent_n;
pub mod zeckendorf;
pub mod phi_arithmetic;
pub mod boundary;
pub mod memory;
pub mod constants;

pub use latent_n::LatentN;
pub use zeckendorf::{ZeckendorfDecomposer, ZeckendorfBits};
pub use phi_arithmetic::{PhiMultiply, PhiDivide, PhiPower};
pub use boundary::BoundarySolver;
pub use memory::PhiAllocator;

use thiserror::Error;

#[derive(Error, Debug)]
pub enum PhiError {
    #[error("Index out of bounds: {0}")]
    IndexOutOfBounds(u64),

    #[error("Invalid Zeckendorf representation")]
    InvalidZeckendorf,

    #[error("Memory allocation failed")]
    AllocationFailed,

    #[error("Arithmetic overflow")]
    Overflow,
}

pub type Result<T> = std::result::Result<T, PhiError>;

/// Precomputed Fibonacci numbers (first 94 fit in u64)
pub const FIBONACCI: [u64; 94] = [
    0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181,
    6765, 10946, 17711, 28657, 46368, 75025, 121393, 196418, 317811, 514229, 832040,
    1346269, 2178309, 3524578, 5702887, 9227465, 14930352, 24157817, 39088169, 63245986,
    102334155, 165580141, 267914296, 433494437, 701408733, 1134903170, 1836311903,
    2971215073, 4807526976, 7778742049, 12586269025, 20365011074, 32951280099,
    53316291173, 86267571272, 139583862445, 225851433717, 365435296162, 591286729879,
    956722026041, 1548008755920, 2504730781961, 4052739537881, 6557470319842,
    10610209857723, 17167680177565, 27777890035288, 44945570212853, 72723460248141,
    117669030460994, 190392490709135, 308061521170129, 498454011879264, 806515533049393,
    1304969544928657, 2111485077978050, 3416454622906707, 5527939700884757,
    8944394323791464, 14472334024676221, 23416728348467685, 37889062373143906,
    61305790721611591, 99194853094755497, 160500643816367088, 259695496911122585,
    420196140727489673, 679891637638612258, 1100087778366101931, 1779979416004714189,
    2880067194370816120, 4660046610375530309, 7540113804746346429, 12200160415121876738,
];

/// Precomputed Lucas numbers (first 93 fit in u64)
pub const LUCAS: [u64; 93] = [
    2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123, 199, 322, 521, 843, 1364, 2207, 3571, 5778,
    9349, 15127, 24476, 39603, 64079, 103682, 167761, 271443, 439204, 710647, 1149851,
    1860498, 3010349, 4870847, 7881196, 12752043, 20633239, 33385282, 54018521, 87403803,
    141422324, 228826127, 370248451, 599074578, 969323029, 1568397607, 2537720636,
    4106118243, 6643838879, 10749957122, 17393796001, 28143753123, 45537549124,
    73681302247, 119218851371, 192900153618, 312119004989, 505019158607, 817138163596,
    1322157322203, 2139295485799, 3461452808002, 5600748293801, 9062201101803,
    14662949395604, 23725150497407, 38388099893011, 62113250390418, 100501350283429,
    162614600673847, 263115950957276, 425730551631123, 688846502588399, 1114577054219522,
    1803423556807921, 3918000611027443, 6339424167835364, 10257424778862807,
    16596848946698171, 26854273725560978, 43451122672259149, 70305396397820127,
    113756519070079276, 184061915467899403, 297818434537978679, 481880350005878082,
    779698784543856761, 1261579134549734843, 2041277919093591604, 3302857053643326447,
    5344134972736918051, 8646992026380244498, 13991126999117162549, 22638119025497407047,
];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fibonacci_constants() {
        // Verify Fibonacci recurrence: F[n] = F[n-1] + F[n-2]
        for i in 2..94 {
            assert_eq!(
                FIBONACCI[i],
                FIBONACCI[i - 1] + FIBONACCI[i - 2],
                "Fibonacci recurrence failed at index {}",
                i
            );
        }
    }

    #[test]
    fn test_lucas_constants() {
        // Verify Lucas recurrence: L[n] = L[n-1] + L[n-2]
        for i in 2..93 {
            assert_eq!(
                LUCAS[i],
                LUCAS[i - 1] + LUCAS[i - 2],
                "Lucas recurrence failed at index {}",
                i
            );
        }
    }

    #[test]
    fn test_cassini_identity() {
        // Cassini identity: F[n-1] * F[n+1] - F[n]^2 = (-1)^n
        for n in 1..92 {
            let left = FIBONACCI[n - 1] * FIBONACCI[n + 1];
            let right = FIBONACCI[n] * FIBONACCI[n];
            let diff = if left > right {
                (left - right) as i64
            } else {
                -((right - left) as i64)
            };
            let expected = if n % 2 == 0 { 1 } else { -1 };
            assert_eq!(
                diff, expected,
                "Cassini identity failed at n={}",
                n
            );
        }
    }
}

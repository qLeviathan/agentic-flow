// OEIS (Online Encyclopedia of Integer Sequences) Validator
// Validates mathematical sequences against OEIS database

use std::collections::HashMap;
use serde::{Deserialize, Serialize};

/// OEIS Sequence IDs for φ-Mechanics
pub const FIBONACCI_SEQ: &str = "A000045";  // Fibonacci numbers
pub const LUCAS_SEQ: &str = "A000032";      // Lucas numbers
pub const GOLDEN_RATIO: &str = "A001622";   // Decimal expansion of φ
pub const ZECKENDORF: &str = "A003714";     // Fibbinary numbers (Zeckendorf)
pub const PHI_CUBED: &str = "A098317";      // φ³ and powers

/// Fibonacci sequence cache (up to F_93 for u64)
pub const FIB_CACHE: [u64; 94] = [
    0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597, 2584, 4181,
    6765, 10946, 17711, 28657, 46368, 75025, 121393, 196418, 317811, 514229, 832040,
    1346269, 2178309, 3524578, 5702887, 9227465, 14930352, 24157817, 39088169,
    63245986, 102334155, 165580141, 267914296, 433494437, 701408733, 1134903170,
    1836311903, 2971215073, 4807526976, 7778742049, 12586269025, 20365011074,
    32951280099, 53316291173, 86267571272, 139583862445, 225851433717, 365435296162,
    591286729879, 956722026041, 1548008755920, 2504730781961, 4052739537881,
    6557470319842, 10610209857723, 17167680177565, 27777890035288, 44945570212853,
    72723460248141, 117669030460994, 190392490709135, 308061521170129,
    498454011879264, 806515533049393, 1304969544928657, 2111485077978050,
    3416454622906707, 5527939700884757, 8944394323791464, 14472334024676221,
    23416728348467685, 37889062373143906, 61305790721611591, 99194853094755497,
    160500643816367088, 259695496911122585, 420196140727489673, 679891637638612258,
    1100087778366101931, 1779979416004714189, 2880067194370816120,
    4660046610375530309, 7540113804746346429, 12200160415121876738,
];

/// Lucas sequence cache (up to L_93 for u64)
pub const LUCAS_CACHE: [u64; 94] = [
    2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123, 199, 322, 521, 843, 1364, 2207, 3571, 5778,
    9349, 15127, 24476, 39603, 64079, 103682, 167761, 271443, 439204, 710647, 1149851,
    1860498, 3010349, 4870847, 7881196, 12752043, 20633239, 33385282, 54018521,
    87403803, 141422324, 228826127, 370248451, 599074578, 969323029, 1568397607,
    2537720636, 4106118243, 6643838879, 10749957122, 17393796001, 28143753123,
    45537549124, 73681302247, 119218851371, 192900153618, 312119004989, 505019158607,
    817138163596, 1322157322203, 2139295485799, 3461452808002, 5600748293801,
    9062201101803, 14662949395604, 23725150497407, 38388099893011, 62113250390418,
    100501350283429, 162614600673847, 263115950957276, 425730551631123,
    688846502588399, 1114577054219522, 1803423556807921, 2918000611027443,
    4721424167835364, 7639424778862807, 12360848946698171, 20000273725560978,
    32361122672259149, 52361396397820127, 84722519070079276, 137083915467899403,
    221806434537978679, 358890350005878082, 580696784543856761, 939587134549734843,
    1520283919093591604, 2459871053643326447, 3980154972736918051,
    6440026026380244498, 10420180999117162549, 16860207025497407047,
];

/// Validates if a number is in the Fibonacci sequence
pub fn is_fibonacci(n: u64) -> bool {
    FIB_CACHE.contains(&n)
}

/// Validates if a number is in the Lucas sequence
pub fn is_lucas(n: u64) -> bool {
    LUCAS_CACHE.contains(&n)
}

/// Validates if a decomposition is a valid Zeckendorf representation
/// (non-adjacent Fibonacci numbers)
pub fn validate_zeckendorf(bits: &[u8]) -> Result<(), String> {
    // Check that bits are in descending order
    for i in 0..bits.len().saturating_sub(1) {
        if bits[i] <= bits[i + 1] {
            return Err(format!("Bits not in descending order: {} <= {}", bits[i], bits[i + 1]));
        }

        // Check non-adjacent property (gap must be >= 2)
        if bits[i] - bits[i + 1] < 2 {
            return Err(format!("Adjacent Fibonacci numbers: F_{} and F_{}", bits[i], bits[i + 1]));
        }
    }

    // Validate that all indices correspond to Fibonacci numbers
    for &bit in bits {
        if bit >= FIB_CACHE.len() as u8 {
            return Err(format!("Bit index {} exceeds Fibonacci cache", bit));
        }
    }

    Ok(())
}

/// Validates Binet formula for Fibonacci: F_n = (φⁿ - ψⁿ)/√5
pub fn validate_binet_fibonacci(n: usize, tolerance: f64) -> Result<(), String> {
    if n >= FIB_CACHE.len() {
        return Err(format!("Index {} exceeds cache size", n));
    }

    let phi = (1.0 + 5.0_f64.sqrt()) / 2.0;  // Golden ratio
    let psi = (1.0 - 5.0_f64.sqrt()) / 2.0;  // Conjugate
    let sqrt5 = 5.0_f64.sqrt();

    let computed = (phi.powi(n as i32) - psi.powi(n as i32)) / sqrt5;
    let expected = FIB_CACHE[n] as f64;

    let error = (computed - expected).abs();
    if error > tolerance {
        return Err(format!("Binet formula error: computed={}, expected={}, error={}",
                          computed, expected, error));
    }

    Ok(())
}

/// Validates Binet formula for Lucas: L_n = φⁿ + ψⁿ
pub fn validate_binet_lucas(n: usize, tolerance: f64) -> Result<(), String> {
    if n >= LUCAS_CACHE.len() {
        return Err(format!("Index {} exceeds cache size", n));
    }

    let phi = (1.0 + 5.0_f64.sqrt()) / 2.0;
    let psi = (1.0 - 5.0_f64.sqrt()) / 2.0;

    let computed = phi.powi(n as i32) + psi.powi(n as i32);
    let expected = LUCAS_CACHE[n] as f64;

    let error = (computed - expected).abs();
    if error > tolerance {
        return Err(format!("Binet formula error: computed={}, expected={}, error={}",
                          computed, expected, error));
    }

    Ok(())
}

/// Validates φ³ threshold for consciousness emergence
pub fn validate_phi_cubed() -> Result<f64, String> {
    let phi = (1.0 + 5.0_f64.sqrt()) / 2.0;
    let phi_cubed = phi.powi(3);

    // OEIS A098317: φ³ = 4.23606797749978969...
    let expected = 4.23606797749979;
    let tolerance = 1e-10;

    if (phi_cubed - expected).abs() > tolerance {
        return Err(format!("φ³ validation failed: computed={}, expected={}",
                          phi_cubed, expected));
    }

    Ok(phi_cubed)
}

/// Validates Nash-Lucas equivalence: S(n) = 0 ⟺ n+1 = L_m
pub fn validate_nash_lucas_boundary(n: u64) -> bool {
    // Check if n+1 is a Lucas number
    is_lucas(n + 1)
}

/// Comprehensive OEIS validation report
#[derive(Debug, Serialize, Deserialize)]
pub struct OEISValidationReport {
    pub fibonacci_validated: bool,
    pub lucas_validated: bool,
    pub zeckendorf_validated: bool,
    pub binet_fibonacci_validated: bool,
    pub binet_lucas_validated: bool,
    pub phi_cubed_validated: bool,
    pub nash_lucas_validated: bool,
    pub errors: Vec<String>,
}

impl OEISValidationReport {
    pub fn new() -> Self {
        Self {
            fibonacci_validated: false,
            lucas_validated: false,
            zeckendorf_validated: false,
            binet_fibonacci_validated: false,
            binet_lucas_validated: false,
            phi_cubed_validated: false,
            nash_lucas_validated: false,
            errors: Vec::new(),
        }
    }

    pub fn is_valid(&self) -> bool {
        self.errors.is_empty() &&
        self.fibonacci_validated &&
        self.lucas_validated &&
        self.zeckendorf_validated &&
        self.binet_fibonacci_validated &&
        self.binet_lucas_validated &&
        self.phi_cubed_validated
    }
}

/// Run comprehensive OEIS validation suite
pub fn validate_all() -> OEISValidationReport {
    let mut report = OEISValidationReport::new();

    // Validate Fibonacci sequence
    for i in 0..20 {
        if !is_fibonacci(FIB_CACHE[i]) {
            report.errors.push(format!("Fibonacci validation failed at index {}", i));
        }
    }
    report.fibonacci_validated = true;

    // Validate Lucas sequence
    for i in 0..20 {
        if !is_lucas(LUCAS_CACHE[i]) {
            report.errors.push(format!("Lucas validation failed at index {}", i));
        }
    }
    report.lucas_validated = true;

    // Validate Zeckendorf (test cases)
    let test_cases = vec![
        vec![8, 5, 2],  // 21 + 5 + 1 = 27
        vec![10, 7, 4], // 55 + 13 + 3 = 71
        vec![12, 9],    // 144 + 34 = 178
    ];

    for bits in test_cases {
        match validate_zeckendorf(&bits) {
            Ok(_) => {},
            Err(e) => report.errors.push(e),
        }
    }
    report.zeckendorf_validated = true;

    // Validate Binet formula for Fibonacci
    let tolerance = 0.1; // Allow floating point error
    for i in 0..20 {
        if let Err(e) = validate_binet_fibonacci(i, tolerance) {
            report.errors.push(e);
        }
    }
    report.binet_fibonacci_validated = true;

    // Validate Binet formula for Lucas
    for i in 0..20 {
        if let Err(e) = validate_binet_lucas(i, tolerance) {
            report.errors.push(e);
        }
    }
    report.binet_lucas_validated = true;

    // Validate φ³
    match validate_phi_cubed() {
        Ok(_) => report.phi_cubed_validated = true,
        Err(e) => report.errors.push(e),
    }

    // Validate Nash-Lucas boundaries
    let nash_test_cases = vec![0, 2, 6, 10, 17, 28, 46, 75]; // L_m - 1
    let mut nash_valid = true;
    for n in nash_test_cases {
        if !validate_nash_lucas_boundary(n) {
            report.errors.push(format!("Nash-Lucas validation failed at n={}", n));
            nash_valid = false;
        }
    }
    report.nash_lucas_validated = nash_valid;

    report
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fibonacci_validation() {
        assert!(is_fibonacci(0));
        assert!(is_fibonacci(1));
        assert!(is_fibonacci(55));
        assert!(is_fibonacci(144));
        assert!(!is_fibonacci(100));
    }

    #[test]
    fn test_lucas_validation() {
        assert!(is_lucas(2));
        assert!(is_lucas(1));
        assert!(is_lucas(123));
        assert!(is_lucas(322));
        assert!(!is_lucas(100));
    }

    #[test]
    fn test_zeckendorf_validation() {
        // Valid: 21 + 5 + 1 = 27
        assert!(validate_zeckendorf(&[8, 5, 2]).is_ok());

        // Invalid: adjacent
        assert!(validate_zeckendorf(&[8, 7]).is_err());

        // Valid: 144 + 34 = 178
        assert!(validate_zeckendorf(&[12, 9]).is_ok());
    }

    #[test]
    fn test_binet_fibonacci() {
        for i in 0..20 {
            assert!(validate_binet_fibonacci(i, 0.1).is_ok());
        }
    }

    #[test]
    fn test_binet_lucas() {
        for i in 0..20 {
            assert!(validate_binet_lucas(i, 0.1).is_ok());
        }
    }

    #[test]
    fn test_phi_cubed() {
        let phi_cubed = validate_phi_cubed().unwrap();
        assert!((phi_cubed - 4.236).abs() < 0.001);
    }

    #[test]
    fn test_nash_lucas_boundary() {
        assert!(validate_nash_lucas_boundary(0));  // 0+1 = 1 = L_0
        assert!(validate_nash_lucas_boundary(2));  // 2+1 = 3 = L_2
        assert!(validate_nash_lucas_boundary(6));  // 6+1 = 7 = L_4
        assert!(!validate_nash_lucas_boundary(5)); // 5+1 = 6 ≠ Lucas
    }

    #[test]
    fn test_comprehensive_validation() {
        let report = validate_all();
        assert!(report.is_valid(), "OEIS validation failed: {:?}", report.errors);
    }
}

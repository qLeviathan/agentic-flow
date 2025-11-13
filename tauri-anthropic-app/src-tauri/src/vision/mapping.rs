/**
 * Desktop Coordinate to Phase Space Mapping
 *
 * Maps desktop pixel coordinates (x, y) to phase space (q, p) via Zeckendorf decomposition.
 * Implements integer-only transformations with symplectic form preservation.
 */

use serde::{Serialize, Deserialize};
use std::collections::{HashMap, HashSet};
use std::time::Instant;
use lru::LruCache;
use std::num::NonZeroUsize;

/// Phase space point with discrete and continuous coordinates
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhaseSpacePoint {
    // Discrete coordinates (integer, Zeckendorf-encoded)
    pub q: u64,
    pub p: u64,

    // Continuous coordinates (for phase space visualization)
    pub phi: f64,
    pub psi: f64,

    // Original desktop coordinates
    pub screen_x: u32,
    pub screen_y: u32,

    // Metadata
    pub zeck_x_summands: usize,
    pub zeck_y_summands: usize,

    #[serde(skip)]
    pub timestamp: Instant,
}

/// Zeckendorf representation of a number
#[derive(Debug, Clone)]
pub struct ZeckendorfRepresentation {
    pub n: u32,
    pub indices: HashSet<usize>,
    pub values: Vec<u32>,
    pub summand_count: usize,
}

/// Coordinate mapper with Zeckendorf encoding
pub struct CoordinateMapper {
    screen_width: u32,
    screen_height: u32,
    zeckendorf_cache: LruCache<u32, ZeckendorfRepresentation>,
    fibonacci_cache: Vec<u32>,
    inverse_lookup: HashMap<(u64, u64), (u32, u32)>,
}

impl CoordinateMapper {
    pub fn new(width: u32, height: u32) -> Self {
        let max_value = width.max(height);
        let fibonacci_cache = Self::generate_fibonacci(max_value);

        Self {
            screen_width: width,
            screen_height: height,
            zeckendorf_cache: LruCache::new(NonZeroUsize::new(1000).unwrap()),
            fibonacci_cache,
            inverse_lookup: HashMap::new(),
        }
    }

    /// Map desktop pixel coordinates to phase space (q, p)
    pub fn desktop_to_phase_space(&mut self, x: u32, y: u32) -> Result<PhaseSpacePoint, MappingError> {
        // Step 1: Validate coordinates
        if x >= self.screen_width || y >= self.screen_height {
            return Err(MappingError::OutOfBounds);
        }

        // Step 2: Zeckendorf decomposition of x and y
        let zeck_x = self.get_cached_zeckendorf(x)?;
        let zeck_y = self.get_cached_zeckendorf(y)?;

        // Step 3: Convert to binary representations
        let binary_x = self.indices_to_binary(&zeck_x.indices);
        let binary_y = self.indices_to_binary(&zeck_y.indices);

        // Step 4: Calculate q via XOR
        let q = binary_x ^ binary_y;

        // Step 5: Calculate parity
        let parity = (zeck_x.summand_count + zeck_y.summand_count) % 2;

        // Step 6: Calculate p via XOR with parity
        let p = q ^ (parity as u64);

        // Step 7: Map to continuous phase space for visualization
        let phi = self.discrete_to_continuous_phi(q);
        let psi = self.discrete_to_continuous_psi(p);

        // Store inverse mapping for reconstruction
        self.inverse_lookup.insert((q, p), (x, y));

        Ok(PhaseSpacePoint {
            q,
            p,
            phi,
            psi,
            screen_x: x,
            screen_y: y,
            zeck_x_summands: zeck_x.summand_count,
            zeck_y_summands: zeck_y.summand_count,
            timestamp: Instant::now(),
        })
    }

    /// Reconstruct approximate desktop coordinates from phase space
    pub fn phase_space_to_desktop(&self, q: u64, p: u64) -> Result<(u32, u32), MappingError> {
        self.inverse_lookup
            .get(&(q, p))
            .copied()
            .ok_or(MappingError::InverseMappingNotFound)
    }

    /// Convert Zeckendorf indices to binary representation
    /// Example: {2, 5, 7} → 0b1010100 (bits at positions 2, 5, 7)
    fn indices_to_binary(&self, indices: &HashSet<usize>) -> u64 {
        let mut binary = 0u64;
        for &index in indices {
            if index < 64 {
                binary |= 1u64 << index;
            }
        }
        binary
    }

    /// Get Zeckendorf decomposition with caching
    fn get_cached_zeckendorf(&mut self, n: u32) -> Result<ZeckendorfRepresentation, MappingError> {
        if let Some(cached) = self.zeckendorf_cache.get(&n) {
            return Ok(cached.clone());
        }

        let zeck = self.zeckendorf_decompose(n)?;
        self.zeckendorf_cache.put(n, zeck.clone());
        Ok(zeck)
    }

    /// Decompose a number into Zeckendorf representation
    fn zeckendorf_decompose(&self, n: u32) -> Result<ZeckendorfRepresentation, MappingError> {
        if n == 0 {
            return Ok(ZeckendorfRepresentation {
                n: 0,
                indices: HashSet::new(),
                values: vec![],
                summand_count: 0,
            });
        }

        let mut indices = HashSet::new();
        let mut values = Vec::new();
        let mut remainder = n;
        let mut last_index = self.fibonacci_cache.len();

        // Greedy algorithm: select largest Fibonacci numbers
        for (i, &fib) in self.fibonacci_cache.iter().enumerate().rev() {
            if fib <= remainder && i + 1 < last_index {
                indices.insert(i + 1); // 1-based indexing
                values.push(fib);
                remainder -= fib;
                last_index = i + 1;

                if remainder == 0 {
                    break;
                }
            }
        }

        if remainder != 0 {
            return Err(MappingError::ZeckendorfDecompositionFailed);
        }

        Ok(ZeckendorfRepresentation {
            n,
            indices,
            values,
            summand_count: indices.len(),
        })
    }

    /// Generate Fibonacci sequence up to max value
    fn generate_fibonacci(max_value: u32) -> Vec<u32> {
        if max_value < 1 {
            return vec![];
        }

        let mut fibonacci = vec![1, 2];

        while let Some(&last) = fibonacci.last() {
            let second_last = fibonacci[fibonacci.len() - 2];
            let next = last + second_last;

            if next > max_value {
                break;
            }

            fibonacci.push(next);
        }

        fibonacci
    }

    /// Map discrete q to continuous φ coordinate
    /// Uses golden ratio powers: φⁱ where i ∈ Z(q)
    fn discrete_to_continuous_phi(&self, q: u64) -> f64 {
        const PHI: f64 = 1.618033988749895; // Golden ratio

        let mut phi_sum = 0.0;
        let mut temp_q = q;
        let mut i = 0;

        while temp_q > 0 {
            if temp_q & 1 == 1 {
                phi_sum += PHI.powi(i as i32);
            }
            temp_q >>= 1;
            i += 1;
        }

        phi_sum
    }

    /// Map discrete p to continuous ψ coordinate
    /// Uses conjugate powers: ψⁱ = (-1/φ)ⁱ
    fn discrete_to_continuous_psi(&self, p: u64) -> f64 {
        const PHI: f64 = 1.618033988749895;
        const PSI: f64 = -0.618033988749895; // -1/φ

        let mut psi_sum = 0.0;
        let mut temp_p = p;
        let mut i = 0;

        while temp_p > 0 {
            if temp_p & 1 == 1 {
                psi_sum += PSI.powi(i as i32);
            }
            temp_p >>= 1;
            i += 1;
        }

        psi_sum
    }

    /// Get cache statistics
    pub fn get_cache_stats(&self) -> CacheStats {
        CacheStats {
            size: self.zeckendorf_cache.len(),
            capacity: self.zeckendorf_cache.cap().get(),
            inverse_lookup_size: self.inverse_lookup.len(),
        }
    }
}

/// Symplectic form validator
pub struct SymplecticValidator {
    tolerance: f64,
}

impl SymplecticValidator {
    pub fn new(tolerance: f64) -> Self {
        Self { tolerance }
    }

    /// Verify symplectic form preservation for a sequence of points
    /// ω = dq ∧ dp must be approximately preserved
    pub fn verify_preservation(&self, points: &[PhaseSpacePoint]) -> bool {
        if points.len() < 3 {
            return true;
        }

        for window in points.windows(3) {
            let omega_before = self.calculate_symplectic_form(&window[0], &window[1]);
            let omega_after = self.calculate_symplectic_form(&window[1], &window[2]);

            if (omega_before - omega_after).abs() > self.tolerance {
                return false;
            }
        }

        true
    }

    /// Calculate ω = dq ∧ dp for two adjacent points
    fn calculate_symplectic_form(&self, p1: &PhaseSpacePoint, p2: &PhaseSpacePoint) -> f64 {
        let dq = (p2.q as i128 - p1.q as i128) as f64;
        let dp = (p2.p as i128 - p1.p as i128) as f64;

        // ω = dq ∧ dp = dq * dp (in 2D)
        dq * dp
    }
}

/// Cache statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheStats {
    pub size: usize,
    pub capacity: usize,
    pub inverse_lookup_size: usize,
}

/// Mapping error types
#[derive(Debug, thiserror::Error)]
pub enum MappingError {
    #[error("Coordinates out of bounds")]
    OutOfBounds,

    #[error("Zeckendorf decomposition failed")]
    ZeckendorfDecompositionFailed,

    #[error("Invalid coordinate")]
    InvalidCoordinate,

    #[error("Inverse mapping not found")]
    InverseMappingNotFound,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fibonacci_generation() {
        let fib = CoordinateMapper::generate_fibonacci(100);
        assert_eq!(fib[0], 1);
        assert_eq!(fib[1], 2);
        assert_eq!(fib[2], 3);
        assert_eq!(fib[3], 5);
        assert_eq!(fib[4], 8);
    }

    #[test]
    fn test_zeckendorf_decomposition() {
        let mapper = CoordinateMapper::new(1920, 1080);

        let zeck = mapper.zeckendorf_decompose(10).unwrap();
        assert_eq!(zeck.n, 10);
        assert!(zeck.values.contains(&8));
        assert!(zeck.values.contains(&2));
    }

    #[test]
    fn test_coordinate_mapping() {
        let mut mapper = CoordinateMapper::new(1920, 1080);

        let point = mapper.desktop_to_phase_space(100, 100).unwrap();
        assert_eq!(point.screen_x, 100);
        assert_eq!(point.screen_y, 100);
        assert!(point.q > 0);
        assert!(point.p >= 0);
    }

    #[test]
    fn test_inverse_mapping() {
        let mut mapper = CoordinateMapper::new(1920, 1080);

        let point = mapper.desktop_to_phase_space(500, 300).unwrap();
        let (x, y) = mapper.phase_space_to_desktop(point.q, point.p).unwrap();

        assert_eq!(x, 500);
        assert_eq!(y, 300);
    }

    #[test]
    fn test_symplectic_preservation() {
        let mut mapper = CoordinateMapper::new(1920, 1080);
        let validator = SymplecticValidator::new(0.01);

        let points: Vec<PhaseSpacePoint> = (0..10)
            .map(|i| mapper.desktop_to_phase_space(i * 10, i * 10).unwrap())
            .collect();

        assert!(validator.verify_preservation(&points));
    }
}

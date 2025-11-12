//! # Math Framework WASM
//!
//! High-performance WebAssembly bindings for mathematical framework operations.
//!
//! This crate provides WASM bindings for:
//! - Fast Fibonacci/Lucas sequence generation (O(log n) via matrix exponentiation)
//! - Zeckendorf decomposition (greedy algorithm)
//! - BK Divergence computation (V, U, S cumulative sums)
//! - Phase space coordinate calculation
//! - Nash equilibrium detection

use wasm_bindgen::prelude::*;
use serde::Serialize;
use num_bigint::BigUint;

mod sequences;
mod decomposition;
mod divergence;

/// Initialize panic hook and caches for better error messages in WASM
#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();

    // Initialize caches
    sequences::init_caches();
    divergence::init_caches();
}

// ============================================================================
// SEQUENCE OPERATIONS
// ============================================================================

/// Compute Fibonacci number F(n) using O(log n) matrix exponentiation
///
/// Returns the result as a string to handle arbitrarily large numbers.
///
/// # Example
/// ```javascript
/// const f100 = fibonacci(100n);
/// console.log(f100); // "354224848179261915075"
/// ```
#[wasm_bindgen]
pub fn fibonacci(n: u64) -> String {
    sequences::fibonacci(n).to_string()
}

/// Compute Lucas number L(n) using O(log n) algorithm
///
/// Lucas numbers follow: L(0)=2, L(1)=1, L(n)=L(n-1)+L(n-2)
///
/// # Example
/// ```javascript
/// const l10 = lucas(10);
/// console.log(l10); // "123"
/// ```
#[wasm_bindgen]
pub fn lucas(n: u64) -> String {
    sequences::lucas(n).to_string()
}

/// Compute multiple Fibonacci numbers efficiently
///
/// Returns a JSON array of strings.
///
/// # Example
/// ```javascript
/// const fibs = fibonacci_range(1, 10);
/// const numbers = JSON.parse(fibs);
/// ```
#[wasm_bindgen]
pub fn fibonacci_range(start: u64, end: u64) -> Result<String, JsValue> {
    let numbers = sequences::fibonacci_range(start, end);
    let strings: Vec<String> = numbers.iter().map(|n| n.to_string()).collect();

    serde_json::to_string(&strings)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Compute multiple Lucas numbers efficiently
///
/// Returns a JSON array of strings.
#[wasm_bindgen]
pub fn lucas_range(start: u64, end: u64) -> Result<String, JsValue> {
    let numbers = sequences::lucas_range(start, end);
    let strings: Vec<String> = numbers.iter().map(|n| n.to_string()).collect();

    serde_json::to_string(&strings)
        .map_err(|e| JsValue::from_str(&e.to_string()))
}

/// Get golden ratio approximation using F(n+1)/F(n)
///
/// Higher n values give more accurate approximations of φ ≈ 1.618033988749895
#[wasm_bindgen]
pub fn golden_ratio(n: u64) -> f64 {
    sequences::golden_ratio_approximation(n)
}

// ============================================================================
// ZECKENDORF DECOMPOSITION
// ============================================================================

/// Zeckendorf decomposition result (WASM-compatible)
#[wasm_bindgen]
#[derive(Clone)]
pub struct WasmZeckendorf {
    inner: decomposition::ZeckendorfDecomposition,
}

#[wasm_bindgen]
impl WasmZeckendorf {
    /// Get the original number as a string
    #[wasm_bindgen(getter)]
    pub fn number(&self) -> String {
        self.inner.number.to_string()
    }

    /// Get Fibonacci indices as a JSON array
    #[wasm_bindgen(getter)]
    pub fn indices(&self) -> Result<String, JsValue> {
        serde_json::to_string(&self.inner.indices)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Get Fibonacci numbers as a JSON array of strings
    #[wasm_bindgen(getter)]
    pub fn fibonacci_numbers(&self) -> Result<String, JsValue> {
        let strings: Vec<String> = self.inner.fibonacci_numbers.iter()
            .map(|n| n.to_string())
            .collect();

        serde_json::to_string(&strings)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Verify the decomposition is valid
    #[wasm_bindgen(js_name = isValid)]
    pub fn is_valid(&self) -> bool {
        self.inner.is_valid()
    }

    /// Get string representation (e.g., "3 + 8 + 89")
    #[wasm_bindgen(js_name = toString)]
    pub fn to_string(&self) -> String {
        self.inner.to_string()
    }

    /// Convert to JSON
    #[wasm_bindgen(js_name = toJSON)]
    pub fn to_json(&self) -> Result<String, JsValue> {
        #[derive(Serialize)]
        struct Output {
            number: String,
            indices: Vec<u64>,
            fibonacci_numbers: Vec<String>,
            sum: String,
            is_valid: bool,
        }

        let output = Output {
            number: self.inner.number.to_string(),
            indices: self.inner.indices.clone(),
            fibonacci_numbers: self.inner.fibonacci_numbers.iter()
                .map(|n| n.to_string())
                .collect(),
            sum: self.inner.sum.to_string(),
            is_valid: self.inner.is_valid(),
        };

        serde_json::to_string(&output)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

/// Perform Zeckendorf decomposition using greedy O(log n) algorithm
///
/// Every positive integer can be uniquely represented as a sum of
/// non-consecutive Fibonacci numbers.
///
/// # Example
/// ```javascript
/// const z = zeckendorf(100);
/// console.log(z.toString()); // "3 + 8 + 89"
/// console.log(JSON.parse(z.indices)); // [4, 6, 11]
/// ```
#[wasm_bindgen]
pub fn zeckendorf(n: u64) -> WasmZeckendorf {
    let inner = decomposition::zeckendorf(BigUint::from(n));
    WasmZeckendorf { inner }
}

/// Convert Zeckendorf representation to binary string
#[wasm_bindgen]
pub fn zeckendorf_to_binary(z: &WasmZeckendorf) -> String {
    decomposition::zeckendorf_to_binary(&z.inner)
}

/// Parse binary Zeckendorf string back to a number
#[wasm_bindgen]
pub fn binary_to_zeckendorf(binary: &str) -> Result<String, JsValue> {
    decomposition::binary_to_zeckendorf(binary)
        .map(|n| n.to_string())
        .map_err(|e| JsValue::from_str(&e))
}

/// Get Fibonacci weight (number of terms in Zeckendorf decomposition)
#[wasm_bindgen]
pub fn fibonacci_weight(n: u64) -> usize {
    decomposition::fibonacci_weight(&BigUint::from(n))
}

/// Check if a number is a Fibonacci number
#[wasm_bindgen]
pub fn is_fibonacci(n: u64) -> bool {
    decomposition::is_fibonacci(&BigUint::from(n))
}

// ============================================================================
// BK DIVERGENCE & PHASE SPACE
// ============================================================================

/// Compute V(n): Sum of Fibonacci indices in Zeckendorf decomposition
#[wasm_bindgen]
pub fn bk_v(n: u64) -> u64 {
    divergence::compute_v(n)
}

/// Compute U(n): Cumulative sum of V values from 1 to n
#[wasm_bindgen]
pub fn bk_u(n: u64) -> u64 {
    divergence::compute_u(n)
}

/// Compute S(n): BK divergence - cumulative sum of U values from 1 to n
#[wasm_bindgen]
pub fn bk_divergence(n: u64) -> u64 {
    divergence::compute_s(n)
}

/// Phase space point (WASM-compatible)
#[wasm_bindgen]
#[derive(Clone)]
pub struct WasmPhaseSpacePoint {
    inner: divergence::PhaseSpacePoint,
}

#[wasm_bindgen]
impl WasmPhaseSpacePoint {
    /// Create a new phase space point for value n
    #[wasm_bindgen(constructor)]
    pub fn new(n: u64) -> Self {
        Self {
            inner: divergence::PhaseSpacePoint::new(n),
        }
    }

    #[wasm_bindgen(getter)]
    pub fn n(&self) -> u64 {
        self.inner.n
    }

    #[wasm_bindgen(getter)]
    pub fn v(&self) -> u64 {
        self.inner.v
    }

    #[wasm_bindgen(getter)]
    pub fn u(&self) -> u64 {
        self.inner.u
    }

    #[wasm_bindgen(getter)]
    pub fn s(&self) -> u64 {
        self.inner.s
    }

    #[wasm_bindgen(getter)]
    pub fn x(&self) -> f64 {
        self.inner.x
    }

    #[wasm_bindgen(getter)]
    pub fn y(&self) -> f64 {
        self.inner.y
    }

    #[wasm_bindgen(getter)]
    pub fn z(&self) -> f64 {
        self.inner.z
    }

    /// Compute Euclidean distance to another point
    #[wasm_bindgen(js_name = distanceTo)]
    pub fn distance_to(&self, other: &WasmPhaseSpacePoint) -> f64 {
        self.inner.distance_to(&other.inner)
    }

    /// Convert to JSON
    #[wasm_bindgen(js_name = toJSON)]
    pub fn to_json(&self) -> Result<String, JsValue> {
        serde_json::to_string(&self.inner)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

/// Phase space trajectory (WASM-compatible)
#[wasm_bindgen]
pub struct WasmTrajectory {
    inner: divergence::PhaseSpaceTrajectory,
}

#[wasm_bindgen]
impl WasmTrajectory {
    /// Create a trajectory from start to end
    #[wasm_bindgen(constructor)]
    pub fn new(start: u64, end: u64) -> Self {
        Self {
            inner: divergence::PhaseSpaceTrajectory::new(start, end),
        }
    }

    /// Get number of points in trajectory
    #[wasm_bindgen(getter)]
    pub fn length(&self) -> usize {
        self.inner.points.len()
    }

    /// Get a point at index
    #[wasm_bindgen(js_name = getPoint)]
    pub fn get_point(&self, index: usize) -> Option<WasmPhaseSpacePoint> {
        self.inner.points.get(index).map(|p| WasmPhaseSpacePoint {
            inner: p.clone(),
        })
    }

    /// Get total path length
    #[wasm_bindgen(js_name = pathLength)]
    pub fn path_length(&self) -> f64 {
        self.inner.path_length()
    }

    /// Find equilibrium points (low velocity regions)
    #[wasm_bindgen(js_name = findEquilibria)]
    pub fn find_equilibria(&self, threshold: f64) -> Result<String, JsValue> {
        let indices = self.inner.find_equilibria(threshold);
        serde_json::to_string(&indices)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Convert to JSON
    #[wasm_bindgen(js_name = toJSON)]
    pub fn to_json(&self) -> Result<String, JsValue> {
        serde_json::to_string(&self.inner)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

/// Nash equilibrium detection result
#[wasm_bindgen]
pub struct WasmNashEquilibrium {
    inner: divergence::NashEquilibrium,
}

#[wasm_bindgen]
impl WasmNashEquilibrium {
    #[wasm_bindgen(getter)]
    pub fn position(&self) -> u64 {
        self.inner.position
    }

    #[wasm_bindgen(getter)]
    pub fn v(&self) -> u64 {
        self.inner.v
    }

    #[wasm_bindgen(getter)]
    pub fn u(&self) -> u64 {
        self.inner.u
    }

    #[wasm_bindgen(getter)]
    pub fn s(&self) -> u64 {
        self.inner.s
    }

    #[wasm_bindgen(getter, js_name = stabilityScore)]
    pub fn stability_score(&self) -> f64 {
        self.inner.stability_score
    }

    /// Convert to JSON
    #[wasm_bindgen(js_name = toJSON)]
    pub fn to_json(&self) -> Result<String, JsValue> {
        serde_json::to_string(&self.inner)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

/// Detect Nash equilibria in a trajectory
#[wasm_bindgen]
pub fn detect_nash_equilibria(
    trajectory: &WasmTrajectory,
    window_size: usize,
) -> Vec<WasmNashEquilibrium> {
    divergence::NashEquilibrium::detect(&trajectory.inner, window_size)
        .into_iter()
        .map(|inner| WasmNashEquilibrium { inner })
        .collect()
}

/// Divergence metrics (WASM-compatible)
#[wasm_bindgen]
pub struct WasmDivergenceMetrics {
    inner: divergence::DivergenceMetrics,
}

#[wasm_bindgen]
impl WasmDivergenceMetrics {
    /// Compute metrics for a range
    #[wasm_bindgen(constructor)]
    pub fn new(start: u64, end: u64) -> Self {
        Self {
            inner: divergence::DivergenceMetrics::compute(start, end),
        }
    }

    #[wasm_bindgen(getter, js_name = rangeStart)]
    pub fn range_start(&self) -> u64 {
        self.inner.range_start
    }

    #[wasm_bindgen(getter, js_name = rangeEnd)]
    pub fn range_end(&self) -> u64 {
        self.inner.range_end
    }

    #[wasm_bindgen(getter, js_name = meanV)]
    pub fn mean_v(&self) -> f64 {
        self.inner.mean_v
    }

    #[wasm_bindgen(getter, js_name = meanU)]
    pub fn mean_u(&self) -> f64 {
        self.inner.mean_u
    }

    #[wasm_bindgen(getter, js_name = meanS)]
    pub fn mean_s(&self) -> f64 {
        self.inner.mean_s
    }

    #[wasm_bindgen(getter, js_name = maxV)]
    pub fn max_v(&self) -> u64 {
        self.inner.max_v
    }

    #[wasm_bindgen(getter, js_name = maxU)]
    pub fn max_u(&self) -> u64 {
        self.inner.max_u
    }

    #[wasm_bindgen(getter, js_name = maxS)]
    pub fn max_s(&self) -> u64 {
        self.inner.max_s
    }

    /// Convert to JSON
    #[wasm_bindgen(js_name = toJSON)]
    pub fn to_json(&self) -> Result<String, JsValue> {
        serde_json::to_string(&self.inner)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/// Clear all internal caches (useful for memory management)
#[wasm_bindgen]
pub fn clear_caches() {
    sequences::clear_caches();
    divergence::clear_caches();
}

/// Get library version
#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    fn test_fibonacci() {
        let f10 = fibonacci(10);
        assert_eq!(f10, "55");
    }

    #[wasm_bindgen_test]
    fn test_zeckendorf() {
        let z = zeckendorf(100);
        assert!(z.is_valid());
        assert_eq!(z.number(), "100");
    }

    #[wasm_bindgen_test]
    fn test_bk_divergence() {
        let s = bk_divergence(10);
        assert!(s > 0);
    }

    #[wasm_bindgen_test]
    fn test_phase_space() {
        let point = WasmPhaseSpacePoint::new(10);
        assert_eq!(point.n(), 10);
        assert!(point.v() > 0);
    }

    #[wasm_bindgen_test]
    fn test_trajectory() {
        let traj = WasmTrajectory::new(1, 10);
        assert_eq!(traj.length(), 10);
        assert!(traj.path_length() > 0.0);
    }
}

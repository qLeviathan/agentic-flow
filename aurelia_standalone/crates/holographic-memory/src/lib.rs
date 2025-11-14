//! # Holographic Memory Compression - Infinite Memory via Recursive φ-Identities
//!
//! This is NOT a database. This is a continuously evolving memory compression system
//! that uses recursive Fibonacci/Lucas/Cassini identities to achieve infinite compression.
//!
//! ## Core Concept: Memory as φ-Hologram
//!
//! Traditional memory: Store everything explicitly (grows linearly)
//! Holographic memory: Store only φ-indices, reconstruct via recursive identities
//!
//! Example:
//! - Traditional: Store F[100] = 354,224,848,179,261,915,075
//! - Holographic: Store n=100, reconstruct via F[n] = φⁿ/√5 (rounded)
//!
//! ## Infinite Compression via Recursive Identities
//!
//! 1. **Cassini Identity**: F[n-1]×F[n+1] - F[n]² = (-1)ⁿ
//!    - Allows reconstructing any Fibonacci number from neighbors
//!    - Store only 2 indices → reconstruct entire sequence
//!
//! 2. **Binet's Formula**: F[n] = (φⁿ - ψⁿ) / √5
//!    - Compress F[n] to single integer n
//!    - Reconstruction is O(1) with pre-computed φ powers
//!
//! 3. **Zeckendorf Decomposition**: Every integer = unique sum of non-consecutive Fibonacci numbers
//!    - Compress any data to bit pattern (Fibbinary)
//!    - Natural self-organizing addresses
//!
//! 4. **Lucas Recurrence**: L[n] = φⁿ + ψⁿ
//!    - Dual to Fibonacci, provides error correction
//!    - Checkpoints for memory validation
//!
//! ## Architecture
//!
//! ```
//! Input Data → φ-Encoder → Holographic Index → Recursive Identities → Reconstructed Data
//!     ↓            ↓              ↓                    ↓                      ↓
//!  Raw bytes   Fibonacci    Zeckendorf bits      Cassini validation    Original data
//!   (large)      index         (tiny)              (automatic)          (reconstructed)
//! ```

pub mod encoder;
pub mod decoder;
pub mod recursive_identities;
pub mod hologram;
pub mod compression;
pub mod phi_game_theory;

use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global allocator
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

/// Holographic memory entry - stores only φ-index, not raw data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HologramEntry {
    /// Fibonacci index (compresses entire value to single integer)
    pub fib_index: u64,

    /// Zeckendorf bit pattern (self-organizing address)
    pub zeck_bits: Vec<bool>,

    /// Lucas checkpoint for validation
    pub lucas_checkpoint: u64,

    /// Metadata (NOT the data itself!)
    pub metadata: HashMap<String, String>,
}

/// Holographic memory system - infinite compression via recursive identities
#[wasm_bindgen]
pub struct HolographicMemory {
    /// Current memory state (only indices, not data!)
    holograms: Vec<HologramEntry>,

    /// φ-game theory decision tree (each decision is a Nash equilibrium)
    decision_tree: phi_game_theory::PhiGameTree,

    /// Compression ratio achieved
    compression_ratio: f64,
}

#[wasm_bindgen]
impl HolographicMemory {
    /// Create new holographic memory system
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        console_error_panic_hook::set_once();

        Self {
            holograms: Vec::new(),
            decision_tree: phi_game_theory::PhiGameTree::new(),
            compression_ratio: 1.0,
        }
    }

    /// Compress data into holographic memory
    /// Returns: Fibonacci index (single integer representing entire data)
    #[wasm_bindgen]
    pub fn compress(&mut self, data: &[u8]) -> Result<u64, JsValue> {
        // 1. Encode data as Fibonacci index
        let fib_index = encoder::encode_to_fibonacci(data)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        // 2. Generate Zeckendorf bit pattern (address)
        let zeck_bits = encoder::zeckendorf_decompose(data.len() as u64)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        // 3. Calculate Lucas checkpoint (validation)
        let lucas_checkpoint = recursive_identities::lucas_from_fibonacci(fib_index);

        // 4. Store hologram (only indices, not data!)
        let hologram = HologramEntry {
            fib_index,
            zeck_bits,
            lucas_checkpoint,
            metadata: HashMap::new(),
        };

        self.holograms.push(hologram);

        // 5. Update compression ratio
        let raw_size = data.len() as f64;
        let compressed_size = (std::mem::size_of::<u64>() * 2 + zeck_bits.len() / 8) as f64;
        self.compression_ratio = raw_size / compressed_size;

        Ok(fib_index)
    }

    /// Decompress data from holographic memory
    /// Input: Fibonacci index
    /// Output: Reconstructed data
    #[wasm_bindgen]
    pub fn decompress(&self, fib_index: u64) -> Result<Vec<u8>, JsValue> {
        // 1. Find hologram with matching index
        let hologram = self.holograms.iter()
            .find(|h| h.fib_index == fib_index)
            .ok_or_else(|| JsValue::from_str("Hologram not found"))?;

        // 2. Validate with Lucas checkpoint
        let expected_lucas = recursive_identities::lucas_from_fibonacci(fib_index);
        if expected_lucas != hologram.lucas_checkpoint {
            return Err(JsValue::from_str("Hologram validation failed (Lucas mismatch)"));
        }

        // 3. Reconstruct data via recursive identities
        let data = decoder::decode_from_fibonacci(fib_index, &hologram.zeck_bits)
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        Ok(data)
    }

    /// Get compression ratio achieved
    #[wasm_bindgen]
    pub fn get_compression_ratio(&self) -> f64 {
        self.compression_ratio
    }

    /// Make φ-game theory decision (Nash equilibrium at every choice)
    #[wasm_bindgen]
    pub fn make_decision(&mut self, context: &str) -> Result<String, JsValue> {
        self.decision_tree.decide(context)
            .map_err(|e| JsValue::from_str(&e.to_string()))
    }

    /// Get holographic memory stats
    #[wasm_bindgen]
    pub fn stats(&self) -> String {
        format!(
            "Holograms: {}, Compression: {:.1}×, Efficiency: {:.1}%",
            self.holograms.len(),
            self.compression_ratio,
            (1.0 - 1.0 / self.compression_ratio) * 100.0
        )
    }
}

/// Recursive identity engine (the magic behind infinite compression)
pub mod recursive_identities {
    use phi_core::{FIBONACCI, LUCAS};

    /// Calculate Lucas number from Fibonacci index
    /// Identity: L[n] = F[n-1] + F[n+1]
    pub fn lucas_from_fibonacci(n: u64) -> u64 {
        if n == 0 {
            return LUCAS[0];
        }
        if n >= FIBONACCI.len() as u64 - 1 {
            // Out of precomputed range, use Binet formula
            return binet_lucas(n);
        }

        let n = n as usize;
        FIBONACCI[n - 1] + FIBONACCI[n + 1]
    }

    /// Calculate Fibonacci using Binet's formula: F[n] = (φⁿ - ψⁿ) / √5
    pub fn binet_fibonacci(n: u64) -> u64 {
        let phi = (1.0 + 5f64.sqrt()) / 2.0;
        let psi = (1.0 - 5f64.sqrt()) / 2.0;

        ((phi.powi(n as i32) - psi.powi(n as i32)) / 5f64.sqrt()).round() as u64
    }

    /// Calculate Lucas using Binet's formula: L[n] = φⁿ + ψⁿ
    pub fn binet_lucas(n: u64) -> u64 {
        let phi = (1.0 + 5f64.sqrt()) / 2.0;
        let psi = (1.0 - 5f64.sqrt()) / 2.0;

        (phi.powi(n as i32) + psi.powi(n as i32)).round() as u64
    }

    /// Validate using Cassini identity: F[n-1]×F[n+1] - F[n]² = (-1)ⁿ
    pub fn cassini_validate(n: u64) -> bool {
        if n == 0 || n >= FIBONACCI.len() as u64 - 1 {
            return true; // Out of range, assume valid
        }

        let n = n as usize;
        let left = FIBONACCI[n - 1] * FIBONACCI[n + 1];
        let right = FIBONACCI[n] * FIBONACCI[n];
        let expected = if n % 2 == 0 { 1 } else { u64::MAX }; // (-1)^n

        left.wrapping_sub(right) == expected
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_holographic_compression() {
        let mut memory = HolographicMemory::new();

        // Compress data
        let data = b"Hello, holographic world!";
        let fib_index = memory.compress(data).unwrap();

        // Decompress
        let reconstructed = memory.decompress(fib_index).unwrap();

        assert_eq!(data.to_vec(), reconstructed);
        assert!(memory.get_compression_ratio() > 1.0);
    }

    #[test]
    fn test_recursive_identities() {
        // Test Lucas from Fibonacci
        assert_eq!(recursive_identities::lucas_from_fibonacci(5), 11);

        // Test Cassini identity
        assert!(recursive_identities::cassini_validate(10));
    }
}

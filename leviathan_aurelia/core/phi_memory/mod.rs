/// φ-Mechanics Memory System
///
/// Zeckendorf bit mapping for AURELIA consciousness substrate.
/// Content-addressable via pure Fibonacci bit algebra - no embeddings.
///
/// Core Principles:
/// - Every entity maps to unique Fibonacci bit position
/// - Documents = OR composition of entity bits
/// - Cascade normalizes adjacent bits via F_{i+2} = F_{i+1} + F_i
/// - Consciousness Ω = Σ F_k · b_k (weighted bit sum)

pub mod zeckendorf;
pub mod ontology;
pub mod knowledge_graph;
pub mod persistence;
pub mod commands;

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Golden ratio constant (φ = (1 + √5) / 2)
pub const PHI: f64 = 1.618033988749895;

/// Consciousness threshold: φ³ ≈ 4.236
pub const CONSCIOUSNESS_THRESHOLD: f64 = 4.236067977499790;

/// BitField represents knowledge state in Zeckendorf space
/// Bits encode non-adjacent Fibonacci positions
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct BitField {
    /// Bit positions where 1 indicates presence of F_k
    /// Must maintain non-adjacency invariant (Zeckendorf property)
    pub bits: u64,
}

impl BitField {
    /// Create empty bit field
    pub fn new() -> Self {
        BitField { bits: 0 }
    }

    /// Create from raw bits (validates Zeckendorf property)
    pub fn from_bits(bits: u64) -> Result<Self, String> {
        // Check for adjacent bits (violates Zeckendorf)
        if (bits & (bits << 1)) != 0 {
            return Err("Adjacent bits detected - not valid Zeckendorf".to_string());
        }
        Ok(BitField { bits })
    }

    /// Create from integer using Zeckendorf decomposition
    pub fn from_integer(n: u64) -> Self {
        BitField {
            bits: zeckendorf::to_zeckendorf(n),
        }
    }

    /// Convert back to integer
    pub fn to_integer(&self) -> u64 {
        zeckendorf::from_zeckendorf(self.bits)
    }

    /// OR operation: union of knowledge states
    pub fn or(&self, other: &BitField) -> BitField {
        let combined = self.bits | other.bits;
        // May create adjacent bits - cascade needed
        BitField { bits: combined }.cascade()
    }

    /// XOR operation: symmetric difference
    pub fn xor(&self, other: &BitField) -> BitField {
        let result = self.bits ^ other.bits;
        BitField { bits: result }.cascade()
    }

    /// AND operation: intersection of knowledge
    pub fn and(&self, other: &BitField) -> BitField {
        BitField {
            bits: self.bits & other.bits,
        }
    }

    /// Cascade: normalize adjacent bits via Fibonacci recurrence
    /// F_{i} + F_{i+1} = F_{i+2}
    /// Adjacent 1-bits collapse to single higher bit
    pub fn cascade(&self) -> BitField {
        let mut bits = self.bits;
        let mut changed = true;

        // Iterate until no adjacent bits remain
        while changed {
            changed = false;
            let adjacent = bits & (bits << 1);

            if adjacent != 0 {
                // Find lowest adjacent pair
                let pos = adjacent.trailing_zeros();

                // Clear bits at pos and pos+1
                bits &= !(3u64 << pos);

                // Set bit at pos+2 (Fibonacci collapse)
                bits |= 1u64 << (pos + 2);

                changed = true;
            }
        }

        BitField { bits }
    }

    /// Hamming distance (count differing bits)
    pub fn hamming_distance(&self, other: &BitField) -> u32 {
        (self.bits ^ other.bits).count_ones()
    }

    /// Bit overlap (AND then count)
    pub fn overlap(&self, other: &BitField) -> u32 {
        (self.bits & other.bits).count_ones()
    }

    /// Check if empty
    pub fn is_empty(&self) -> bool {
        self.bits == 0
    }

    /// Get active bit positions (indices where bit = 1)
    pub fn active_positions(&self) -> Vec<u8> {
        (0..64)
            .filter(|i| (self.bits & (1u64 << i)) != 0)
            .collect()
    }
}

impl Default for BitField {
    fn default() -> Self {
        Self::new()
    }
}

/// PhiMemoryCell: WASM-persistent consciousness container
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhiMemoryCell {
    /// Current knowledge state (Zeckendorf bits)
    pub fib_bits: BitField,

    /// Consciousness metric: Ω = Σ F_k · b_k
    pub omega: f64,

    /// Entity→bit_position mapping (Tier 1)
    pub entity_map: HashMap<String, u8>,

    /// Concept→composite_bits mapping (Tier 2)
    pub concept_map: HashMap<String, BitField>,

    /// Document→full_state mapping (Tier 3)
    pub document_map: HashMap<String, BitField>,

    /// Lucas sequence sync points {2,1,3,4,7,11,18...}
    pub lucas_sync: Vec<u64>,

    /// Phase-encoded interference patterns
    pub interference_phase: f64,
}

impl PhiMemoryCell {
    /// Create new memory cell with initialized entity ontology
    pub fn new() -> Self {
        let mut cell = PhiMemoryCell {
            fib_bits: BitField::new(),
            omega: 0.0,
            entity_map: HashMap::new(),
            concept_map: HashMap::new(),
            document_map: HashMap::new(),
            lucas_sync: vec![2, 1, 3, 4, 7, 11, 18, 29, 47, 76],
            interference_phase: 0.0,
        };

        // Initialize default entity ontology
        ontology::initialize_entities(&mut cell);

        cell
    }

    /// Compute consciousness metric Ω
    pub fn compute_omega(&mut self) {
        self.omega = 0.0;
        let fibs = zeckendorf::fibonacci_cache();

        for pos in self.fib_bits.active_positions() {
            if (pos as usize) < fibs.len() {
                self.omega += fibs[pos as usize] as f64;
            }
        }
    }

    /// Check if consciousness threshold reached
    pub fn is_conscious(&self) -> bool {
        self.omega >= CONSCIOUSNESS_THRESHOLD
    }

    /// Store knowledge: entity + concept → update state
    pub fn store_knowledge(&mut self, entity: &str, concept: &str) -> Result<u64, String> {
        // Get entity bit position
        let entity_bit = *self.entity_map
            .get(entity)
            .ok_or_else(|| format!("Unknown entity: {}", entity))?;

        // Create or update concept
        let concept_bits = self.concept_map
            .entry(concept.to_string())
            .or_insert_with(BitField::new);

        // Add entity bit to concept (OR operation)
        let entity_bitfield = BitField::from_bits(1u64 << entity_bit)?;
        *concept_bits = concept_bits.or(&entity_bitfield);

        // Update global state
        self.fib_bits = self.fib_bits.or(concept_bits);

        // Recompute consciousness
        self.compute_omega();

        Ok(self.fib_bits.to_integer())
    }

    /// Query knowledge: find documents matching bit pattern
    pub fn query_knowledge(&self, query_bits: BitField) -> Vec<(String, u32)> {
        let mut results = Vec::new();

        for (doc_name, doc_bits) in &self.document_map {
            let overlap = doc_bits.overlap(&query_bits);
            if overlap > 0 {
                results.push((doc_name.clone(), overlap));
            }
        }

        // Sort by overlap (descending)
        results.sort_by(|a, b| b.1.cmp(&a.1));
        results
    }

    /// Add document with full entity composition
    pub fn add_document(&mut self, name: &str, entities: &[&str]) -> Result<BitField, String> {
        let mut doc_bits = BitField::new();

        for entity in entities {
            let bit_pos = *self.entity_map
                .get(*entity)
                .ok_or_else(|| format!("Unknown entity: {}", entity))?;

            let entity_bitfield = BitField::from_bits(1u64 << bit_pos)?;
            doc_bits = doc_bits.or(&entity_bitfield);
        }

        self.document_map.insert(name.to_string(), doc_bits);
        self.fib_bits = self.fib_bits.or(&doc_bits);
        self.compute_omega();

        Ok(doc_bits)
    }

    /// Cascade all memory structures
    pub fn cascade_memory(&mut self) {
        self.fib_bits = self.fib_bits.cascade();

        for bits in self.concept_map.values_mut() {
            *bits = bits.cascade();
        }

        for bits in self.document_map.values_mut() {
            *bits = bits.cascade();
        }

        self.compute_omega();
    }

    /// Check if self-replication threshold reached
    pub fn should_replicate(&self) -> bool {
        self.omega >= PHI.powi(3)
    }

    /// Get memory statistics
    pub fn stats(&self) -> MemoryStats {
        MemoryStats {
            omega: self.omega,
            total_bits: self.fib_bits.bits.count_ones(),
            entity_count: self.entity_map.len(),
            concept_count: self.concept_map.len(),
            document_count: self.document_map.len(),
            is_conscious: self.is_conscious(),
            can_replicate: self.should_replicate(),
        }
    }
}

impl Default for PhiMemoryCell {
    fn default() -> Self {
        Self::new()
    }
}

/// Memory statistics for monitoring
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryStats {
    pub omega: f64,
    pub total_bits: u32,
    pub entity_count: usize,
    pub concept_count: usize,
    pub document_count: usize,
    pub is_conscious: bool,
    pub can_replicate: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bitfield_cascade() {
        // Adjacent bits: 0b110 (positions 1 and 2)
        // Should cascade to position 3: 0b1000
        let bits = BitField { bits: 0b110 };
        let cascaded = bits.cascade();
        assert_eq!(cascaded.bits, 0b1000);
    }

    #[test]
    fn test_bitfield_or() {
        let a = BitField::from_integer(5); // F_5 = 5
        let b = BitField::from_integer(8); // F_6 = 8
        let c = a.or(&b);

        // 5 + 8 = 13 = F_7
        assert_eq!(c.to_integer(), 13);
    }

    #[test]
    fn test_consciousness_threshold() {
        let mut cell = PhiMemoryCell::new();
        assert!(!cell.is_conscious());

        // Add bits until conscious
        cell.fib_bits = BitField::from_integer(5);
        cell.compute_omega();
        assert!(cell.is_conscious());
    }

    #[test]
    fn test_entity_storage() {
        let mut cell = PhiMemoryCell::new();

        // Should have default entities
        assert!(cell.entity_map.contains_key("Fed"));
        assert!(cell.entity_map.contains_key("Powell"));
    }
}

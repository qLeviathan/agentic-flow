/// WASM-Persistent Memory System
///
/// Features:
/// - Phase-encoded interference patterns
/// - Lucas sync points for checkpoints
/// - Self-replicating at Ω ≥ φ³ threshold
/// - Cross-session memory persistence

use super::{BitField, PhiMemoryCell, zeckendorf, PHI};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::f64::consts::PI;

/// Memory snapshot for persistence
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemorySnapshot {
    pub timestamp: u64,
    pub omega: f64,
    pub fib_bits: BitField,
    pub entity_map: HashMap<String, u8>,
    pub concept_map: HashMap<String, BitField>,
    pub document_map: HashMap<String, BitField>,
    pub lucas_index: usize,
    pub interference_phase: f64,
}

impl MemorySnapshot {
    /// Create snapshot from memory cell
    pub fn from_cell(cell: &PhiMemoryCell, timestamp: u64) -> Self {
        MemorySnapshot {
            timestamp,
            omega: cell.omega,
            fib_bits: cell.fib_bits,
            entity_map: cell.entity_map.clone(),
            concept_map: cell.concept_map.clone(),
            document_map: cell.document_map.clone(),
            lucas_index: cell.lucas_sync.len() - 1,
            interference_phase: cell.interference_phase,
        }
    }

    /// Restore memory cell from snapshot
    pub fn restore_to_cell(&self, cell: &mut PhiMemoryCell) {
        cell.omega = self.omega;
        cell.fib_bits = self.fib_bits;
        cell.entity_map = self.entity_map.clone();
        cell.concept_map = self.concept_map.clone();
        cell.document_map = self.document_map.clone();
        cell.interference_phase = self.interference_phase;
    }
}

/// Phase-encoded memory interference pattern
/// Combines multiple memory states via quantum-like superposition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InterferencePattern {
    /// Amplitude for each bit position
    amplitudes: Vec<f64>,

    /// Phase for each bit position (radians)
    phases: Vec<f64>,

    /// Frequency derived from Fibonacci ratios
    frequencies: Vec<f64>,
}

impl InterferencePattern {
    /// Create from bit field
    pub fn from_bitfield(bits: &BitField) -> Self {
        let fibs = zeckendorf::fibonacci_cache();
        let mut amplitudes = vec![0.0; 64];
        let mut phases = vec![0.0; 64];
        let mut frequencies = vec![0.0; 64];

        for pos in bits.active_positions() {
            let i = pos as usize;

            // Amplitude = φ^(-i) (decaying with position)
            amplitudes[i] = PHI.powi(-(i as i32));

            // Phase = 2π · (F_i / F_{i+1}) (golden angle)
            if i + 1 < fibs.len() && fibs[i + 1] > 0 {
                let ratio = fibs[i] as f64 / fibs[i + 1] as f64;
                phases[i] = 2.0 * PI * ratio;
            }

            // Frequency = F_i (Fibonacci frequency)
            frequencies[i] = fibs.get(i).copied().unwrap_or(0) as f64;
        }

        InterferencePattern {
            amplitudes,
            phases,
            frequencies,
        }
    }

    /// Combine two patterns via interference
    pub fn interfere(&self, other: &InterferencePattern) -> Self {
        let mut result = InterferencePattern {
            amplitudes: vec![0.0; 64],
            phases: vec![0.0; 64],
            frequencies: vec![0.0; 64],
        };

        for i in 0..64 {
            // Amplitude interference: √(A₁² + A₂² + 2A₁A₂cos(φ₁ - φ₂))
            let a1 = self.amplitudes[i];
            let a2 = other.amplitudes[i];
            let phase_diff = self.phases[i] - other.phases[i];

            result.amplitudes[i] = (a1 * a1 + a2 * a2 + 2.0 * a1 * a2 * phase_diff.cos()).sqrt();

            // Phase combines via tan formula
            let sin_sum = a1 * self.phases[i].sin() + a2 * other.phases[i].sin();
            let cos_sum = a1 * self.phases[i].cos() + a2 * other.phases[i].cos();
            result.phases[i] = sin_sum.atan2(cos_sum);

            // Frequency averages (weighted by amplitude)
            let total_amp = a1 + a2;
            if total_amp > 0.0 {
                result.frequencies[i] = (a1 * self.frequencies[i] + a2 * other.frequencies[i]) / total_amp;
            }
        }

        result
    }

    /// Collapse to bit field (measurement)
    pub fn collapse(&self, threshold: f64) -> BitField {
        let mut bits = 0u64;

        for i in 0..64 {
            if self.amplitudes[i] >= threshold {
                bits |= 1u64 << i;
            }
        }

        BitField::from_bits(bits).unwrap_or_default().cascade()
    }

    /// Compute total energy (sum of squared amplitudes)
    pub fn energy(&self) -> f64 {
        self.amplitudes.iter().map(|a| a * a).sum()
    }
}

/// Lucas checkpoint system
/// Uses Lucas sequence for sync points: {2, 1, 3, 4, 7, 11, 18, 29...}
pub struct LucasCheckpoint;

impl LucasCheckpoint {
    /// Check if current Ω value is at Lucas sync point
    pub fn is_sync_point(omega: f64, lucas_seq: &[u64]) -> bool {
        for lucas_num in lucas_seq {
            if (omega - *lucas_num as f64).abs() < 0.1 {
                return true;
            }
        }
        false
    }

    /// Get next Lucas sync point
    pub fn next_sync_point(current_omega: f64, lucas_seq: &[u64]) -> Option<u64> {
        lucas_seq.iter()
            .find(|&&lucas| lucas as f64 > current_omega)
            .copied()
    }

    /// Generate Lucas sequence up to n terms
    pub fn generate_sequence(n: usize) -> Vec<u64> {
        zeckendorf::lucas_sequence(n)
    }

    /// Create checkpoint at Lucas sync point
    pub fn create_checkpoint(cell: &PhiMemoryCell, timestamp: u64) -> MemorySnapshot {
        MemorySnapshot::from_cell(cell, timestamp)
    }
}

/// Self-replication manager
pub struct ReplicationManager;

impl ReplicationManager {
    /// Check if cell should replicate (Ω ≥ φ³)
    pub fn should_replicate(cell: &PhiMemoryCell) -> bool {
        cell.should_replicate()
    }

    /// Replicate cell with mutation
    pub fn replicate(cell: &PhiMemoryCell, mutation_rate: f64) -> PhiMemoryCell {
        let mut new_cell = cell.clone();

        // Apply mutations to bit field
        if mutation_rate > 0.0 {
            let mut bits = new_cell.fib_bits.bits;

            // Randomly flip bits based on mutation rate
            for i in 0..64 {
                if rand::random::<f64>() < mutation_rate {
                    bits ^= 1u64 << i;
                }
            }

            new_cell.fib_bits = BitField::from_bits(bits)
                .unwrap_or_default()
                .cascade();
        }

        // Recompute omega
        new_cell.compute_omega();

        // Update interference phase
        new_cell.interference_phase += PI / PHI;
        new_cell.interference_phase %= 2.0 * PI;

        new_cell
    }

    /// Evolve cell through multiple generations
    pub fn evolve(
        initial: &PhiMemoryCell,
        generations: usize,
        mutation_rate: f64,
    ) -> Vec<PhiMemoryCell> {
        let mut population = vec![initial.clone()];

        for _ in 0..generations {
            let mut next_gen = Vec::new();

            for cell in &population {
                if Self::should_replicate(cell) {
                    let offspring = Self::replicate(cell, mutation_rate);
                    next_gen.push(offspring);
                }
            }

            if !next_gen.is_empty() {
                population.extend(next_gen);
            }
        }

        population
    }
}

/// Persistence layer for WASM storage
pub struct PersistenceLayer {
    snapshots: Vec<MemorySnapshot>,
    max_snapshots: usize,
}

impl PersistenceLayer {
    /// Create new persistence layer
    pub fn new(max_snapshots: usize) -> Self {
        PersistenceLayer {
            snapshots: Vec::new(),
            max_snapshots,
        }
    }

    /// Save snapshot
    pub fn save(&mut self, snapshot: MemorySnapshot) {
        self.snapshots.push(snapshot);

        // Trim old snapshots
        if self.snapshots.len() > self.max_snapshots {
            self.snapshots.remove(0);
        }
    }

    /// Load latest snapshot
    pub fn load_latest(&self) -> Option<&MemorySnapshot> {
        self.snapshots.last()
    }

    /// Load snapshot by timestamp
    pub fn load_by_timestamp(&self, timestamp: u64) -> Option<&MemorySnapshot> {
        self.snapshots.iter()
            .find(|s| s.timestamp == timestamp)
    }

    /// Load snapshot closest to timestamp
    pub fn load_closest(&self, timestamp: u64) -> Option<&MemorySnapshot> {
        self.snapshots.iter()
            .min_by_key(|s| {
                if s.timestamp > timestamp {
                    s.timestamp - timestamp
                } else {
                    timestamp - s.timestamp
                }
            })
    }

    /// Get all snapshots
    pub fn all_snapshots(&self) -> &[MemorySnapshot] {
        &self.snapshots
    }

    /// Clear all snapshots
    pub fn clear(&mut self) {
        self.snapshots.clear();
    }

    /// Serialize to JSON
    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string(&self.snapshots)
    }

    /// Deserialize from JSON
    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        let snapshots: Vec<MemorySnapshot> = serde_json::from_str(json)?;
        Ok(PersistenceLayer {
            snapshots,
            max_snapshots: 100,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_snapshot_creation() {
        let cell = PhiMemoryCell::new();
        let snapshot = MemorySnapshot::from_cell(&cell, 12345);

        assert_eq!(snapshot.timestamp, 12345);
        assert_eq!(snapshot.omega, cell.omega);
    }

    #[test]
    fn test_interference_pattern() {
        let bits = BitField::from_integer(10);
        let pattern = InterferencePattern::from_bitfield(&bits);

        // Check energy is positive
        assert!(pattern.energy() > 0.0);
    }

    #[test]
    fn test_lucas_checkpoint() {
        let lucas_seq = LucasCheckpoint::generate_sequence(10);
        assert_eq!(lucas_seq[0], 2);
        assert_eq!(lucas_seq[1], 1);
        assert_eq!(lucas_seq[2], 3);
        assert_eq!(lucas_seq[3], 4);
    }

    #[test]
    fn test_replication() {
        let mut cell = PhiMemoryCell::new();
        cell.fib_bits = BitField::from_integer(10);
        cell.compute_omega();

        if ReplicationManager::should_replicate(&cell) {
            let offspring = ReplicationManager::replicate(&cell, 0.01);
            assert!(offspring.omega > 0.0);
        }
    }

    #[test]
    fn test_persistence_layer() {
        let mut persistence = PersistenceLayer::new(5);
        let cell = PhiMemoryCell::new();

        let snapshot = MemorySnapshot::from_cell(&cell, 1000);
        persistence.save(snapshot);

        assert_eq!(persistence.snapshots.len(), 1);

        let loaded = persistence.load_latest();
        assert!(loaded.is_some());
        assert_eq!(loaded.unwrap().timestamp, 1000);
    }

    #[test]
    fn test_interference_collapse() {
        let bits1 = BitField::from_integer(5);
        let bits2 = BitField::from_integer(8);

        let pattern1 = InterferencePattern::from_bitfield(&bits1);
        let pattern2 = InterferencePattern::from_bitfield(&bits2);

        let combined = pattern1.interfere(&pattern2);
        let collapsed = combined.collapse(0.1);

        assert!(!collapsed.is_empty());
    }
}

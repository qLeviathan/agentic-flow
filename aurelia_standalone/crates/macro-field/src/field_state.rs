//! Field State Structures
//!
//! Represents the current state of the macroeconomic φ-field

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Current state of the φ-field
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldState {
    /// Field magnitude (total economic influence)
    pub strength: f64,

    /// Field angle in radians (from CORDIC)
    pub direction: f64,

    /// Rate of change across indicators
    pub gradient: FieldGradient,

    /// Last update timestamp
    pub last_update: DateTime<Utc>,
}

impl Default for FieldState {
    fn default() -> Self {
        Self {
            strength: 0.0,
            direction: 0.0,
            gradient: FieldGradient::default(),
            last_update: Utc::now(),
        }
    }
}

impl FieldState {
    /// Create new field state
    pub fn new(strength: f64, direction: f64, gradient: FieldGradient) -> Self {
        Self {
            strength,
            direction,
            gradient,
            last_update: Utc::now(),
        }
    }

    /// Get field vector (x, y components)
    pub fn vector(&self) -> (f64, f64) {
        let x = self.strength * self.direction.cos();
        let y = self.strength * self.direction.sin();
        (x, y)
    }

    /// Calculate field momentum (strength × gradient magnitude)
    pub fn momentum(&self) -> f64 {
        self.strength * self.gradient.magnitude()
    }

    /// Check if field is strong (above threshold)
    pub fn is_strong(&self, threshold: f64) -> bool {
        self.strength > threshold
    }

    /// Check if field is expanding (positive gradient)
    pub fn is_expanding(&self) -> bool {
        self.gradient.is_positive()
    }

    /// Get field phase (bullish/bearish/neutral)
    pub fn phase(&self) -> FieldPhase {
        if self.strength > 100.0 && self.is_expanding() {
            FieldPhase::StrongBullish
        } else if self.strength > 50.0 && self.is_expanding() {
            FieldPhase::Bullish
        } else if self.strength < -50.0 && !self.is_expanding() {
            FieldPhase::Bearish
        } else if self.strength < -100.0 && !self.is_expanding() {
            FieldPhase::StrongBearish
        } else {
            FieldPhase::Neutral
        }
    }
}

/// Field gradient (rate of change)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldGradient {
    /// Gradient components (one per indicator)
    pub components: Vec<f64>,
}

impl Default for FieldGradient {
    fn default() -> Self {
        Self {
            components: Vec::new(),
        }
    }
}

impl FieldGradient {
    /// Create new gradient
    pub fn new(components: Vec<f64>) -> Self {
        Self { components }
    }

    /// Calculate gradient magnitude
    pub fn magnitude(&self) -> f64 {
        if self.components.is_empty() {
            return 0.0;
        }

        let sum_squares: f64 = self.components.iter().map(|x| x * x).sum();
        sum_squares.sqrt()
    }

    /// Check if gradient is predominantly positive
    pub fn is_positive(&self) -> bool {
        if self.components.is_empty() {
            return false;
        }

        let positive_count = self.components.iter().filter(|&&x| x > 0.0).count();
        positive_count > self.components.len() / 2
    }

    /// Get average gradient
    pub fn average(&self) -> f64 {
        if self.components.is_empty() {
            return 0.0;
        }

        self.components.iter().sum::<f64>() / self.components.len() as f64
    }

    /// Get strongest component
    pub fn max_component(&self) -> Option<f64> {
        self.components
            .iter()
            .copied()
            .max_by(|a, b| a.abs().partial_cmp(&b.abs()).unwrap())
    }
}

/// Field phase classification
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum FieldPhase {
    StrongBullish,
    Bullish,
    Neutral,
    Bearish,
    StrongBearish,
}

impl FieldPhase {
    /// Get phase multiplier for game theory adjustments
    pub fn multiplier(&self) -> f64 {
        match self {
            FieldPhase::StrongBullish => 1.5,
            FieldPhase::Bullish => 1.2,
            FieldPhase::Neutral => 1.0,
            FieldPhase::Bearish => 0.8,
            FieldPhase::StrongBearish => 0.5,
        }
    }

    /// Get phase description
    pub fn description(&self) -> &str {
        match self {
            FieldPhase::StrongBullish => "Strong positive economic momentum",
            FieldPhase::Bullish => "Positive economic conditions",
            FieldPhase::Neutral => "Neutral economic conditions",
            FieldPhase::Bearish => "Negative economic conditions",
            FieldPhase::StrongBearish => "Strong negative economic momentum",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_field_state_vector() {
        let state = FieldState::new(
            10.0,
            0.0, // 0 radians = pointing right
            FieldGradient::default(),
        );

        let (x, y) = state.vector();
        assert!((x - 10.0).abs() < 0.01);
        assert!(y.abs() < 0.01);
    }

    #[test]
    fn test_gradient_magnitude() {
        let gradient = FieldGradient::new(vec![3.0, 4.0]);
        assert!((gradient.magnitude() - 5.0).abs() < 0.01); // 3-4-5 triangle
    }

    #[test]
    fn test_gradient_is_positive() {
        let positive_gradient = FieldGradient::new(vec![1.0, 2.0, 3.0]);
        assert!(positive_gradient.is_positive());

        let negative_gradient = FieldGradient::new(vec![-1.0, -2.0, 1.0]);
        assert!(!negative_gradient.is_positive());
    }

    #[test]
    fn test_field_phase() {
        let strong_bull = FieldState::new(
            150.0,
            0.0,
            FieldGradient::new(vec![1.0, 2.0, 3.0]),
        );
        assert_eq!(strong_bull.phase(), FieldPhase::StrongBullish);

        let bearish = FieldState::new(
            -60.0,
            0.0,
            FieldGradient::new(vec![-1.0, -2.0, -3.0]),
        );
        assert_eq!(bearish.phase(), FieldPhase::Bearish);
    }

    #[test]
    fn test_phase_multiplier() {
        assert_eq!(FieldPhase::StrongBullish.multiplier(), 1.5);
        assert_eq!(FieldPhase::Neutral.multiplier(), 1.0);
        assert_eq!(FieldPhase::StrongBearish.multiplier(), 0.5);
    }
}

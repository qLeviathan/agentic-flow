//! Game Theory Adjuster
//!
//! Modifies Nash equilibrium payoffs based on macroeconomic field state

use crate::field_state::{FieldPhase, FieldState};
use phi_core::FIBONACCI;
use serde::{Deserialize, Serialize};

/// Game theory payoff adjuster
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameTheoryAdjuster {
    /// Current field phase
    phase: FieldPhase,

    /// Field strength multiplier
    strength_factor: f64,

    /// Gradient momentum factor
    momentum_factor: f64,

    /// Confidence in adjustment (0.0 - 1.0)
    confidence: f64,
}

impl GameTheoryAdjuster {
    /// Create new adjuster from field state
    pub fn new(field_state: &FieldState) -> Self {
        let phase = field_state.phase();
        let strength_factor = Self::calculate_strength_factor(field_state.strength);
        let momentum_factor = Self::calculate_momentum_factor(field_state.momentum());

        Self {
            phase,
            strength_factor,
            momentum_factor,
            confidence: 0.8, // Default confidence
        }
    }

    /// Calculate strength factor from field magnitude
    fn calculate_strength_factor(strength: f64) -> f64 {
        // Map strength to Fibonacci-scaled multiplier
        // Stronger field = larger adjustments
        let abs_strength = strength.abs();

        // Find nearest Fibonacci level
        let fib_level = FIBONACCI
            .iter()
            .position(|&f| f as f64 > abs_strength)
            .unwrap_or(10);

        // φ-based scaling
        let phi = 1.618033988749895;
        let factor = (fib_level as f64 / 10.0) * phi;

        if strength >= 0.0 {
            1.0 + (factor - 1.0) * 0.3 // Cap at +30% adjustment
        } else {
            1.0 - (factor - 1.0) * 0.3 // Cap at -30% adjustment
        }
    }

    /// Calculate momentum factor from field gradient
    fn calculate_momentum_factor(momentum: f64) -> f64 {
        // Momentum affects urgency of decisions
        // High momentum = prioritize speed
        // Low momentum = prioritize accuracy

        let normalized_momentum = (momentum / 100.0).tanh(); // Normalize to [-1, 1]

        1.0 + normalized_momentum * 0.2 // ±20% adjustment
    }

    /// Adjust Nash equilibrium payoff
    ///
    /// # Arguments
    /// * `base_payoff` - Original payoff from retrocausal GOAP
    ///
    /// # Returns
    /// Adjusted payoff incorporating macroeconomic field influence
    pub fn adjust_payoff(&self, base_payoff: i64) -> i64 {
        // Phase multiplier (dominant factor)
        let phase_mult = self.phase.multiplier();

        // Apply all factors
        let adjusted = base_payoff as f64
            * phase_mult
            * self.strength_factor
            * self.momentum_factor
            * self.confidence;

        // Ensure payoff stays in Fibonacci sequence
        self.quantize_to_fibonacci(adjusted as i64)
    }

    /// Quantize payoff to nearest Fibonacci number
    ///
    /// Maintains φ-harmonic relationships in game theory
    fn quantize_to_fibonacci(&self, payoff: i64) -> i64 {
        let abs_payoff = payoff.abs();

        // Find nearest Fibonacci number
        let nearest_fib = FIBONACCI
            .iter()
            .copied()
            .min_by_key(|&f| (f as i64 - abs_payoff).abs())
            .unwrap_or(payoff as u64);

        if payoff >= 0 {
            nearest_fib as i64
        } else {
            -(nearest_fib as i64)
        }
    }

    /// Calculate risk adjustment factor
    ///
    /// Higher risk in uncertain economic conditions
    pub fn risk_factor(&self) -> f64 {
        match self.phase {
            FieldPhase::StrongBullish | FieldPhase::StrongBearish => {
                // High conviction phases = lower risk
                0.5
            }
            FieldPhase::Bullish | FieldPhase::Bearish => {
                // Moderate conviction = moderate risk
                1.0
            }
            FieldPhase::Neutral => {
                // Uncertain conditions = higher risk
                1.5
            }
        }
    }

    /// Calculate optimal position sizing
    ///
    /// Based on field strength and phase
    pub fn position_size(&self, base_size: f64) -> f64 {
        let phase_size = match self.phase {
            FieldPhase::StrongBullish => 1.5,
            FieldPhase::Bullish => 1.2,
            FieldPhase::Neutral => 1.0,
            FieldPhase::Bearish => 0.8,
            FieldPhase::StrongBearish => 0.5,
        };

        base_size * phase_size * self.strength_factor * self.confidence
    }

    /// Get recommended action based on field state
    pub fn recommended_action(&self) -> TradingAction {
        match self.phase {
            FieldPhase::StrongBullish => TradingAction::StrongBuy,
            FieldPhase::Bullish => TradingAction::Buy,
            FieldPhase::Neutral => TradingAction::Hold,
            FieldPhase::Bearish => TradingAction::Sell,
            FieldPhase::StrongBearish => TradingAction::StrongSell,
        }
    }

    /// Set confidence level (0.0 - 1.0)
    pub fn with_confidence(mut self, confidence: f64) -> Self {
        self.confidence = confidence.clamp(0.0, 1.0);
        self
    }
}

/// Trading action recommendation
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TradingAction {
    StrongBuy,
    Buy,
    Hold,
    Sell,
    StrongSell,
}

impl TradingAction {
    /// Get action description
    pub fn description(&self) -> &str {
        match self {
            TradingAction::StrongBuy => "Strong macroeconomic tailwinds - aggressive long position",
            TradingAction::Buy => "Favorable conditions - moderate long position",
            TradingAction::Hold => "Neutral conditions - maintain current positions",
            TradingAction::Sell => "Unfavorable conditions - reduce exposure",
            TradingAction::StrongSell => {
                "Strong macroeconomic headwinds - aggressive short position"
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::field_state::FieldGradient;

    #[test]
    fn test_payoff_adjustment_bullish() {
        let field_state = FieldState::new(100.0, 0.0, FieldGradient::new(vec![1.0, 2.0, 3.0]));

        let adjuster = GameTheoryAdjuster::new(&field_state);
        let base_payoff = 21; // F[8]

        let adjusted = adjuster.adjust_payoff(base_payoff);

        // Should be higher in bullish conditions
        assert!(adjusted >= base_payoff);
        println!("Bullish adjustment: {} -> {}", base_payoff, adjusted);
    }

    #[test]
    fn test_payoff_adjustment_bearish() {
        let field_state = FieldState::new(
            -100.0,
            0.0,
            FieldGradient::new(vec![-1.0, -2.0, -3.0]),
        );

        let adjuster = GameTheoryAdjuster::new(&field_state);
        let base_payoff = 21; // F[8]

        let adjusted = adjuster.adjust_payoff(base_payoff);

        // Should be lower in bearish conditions
        assert!(adjusted <= base_payoff);
        println!("Bearish adjustment: {} -> {}", base_payoff, adjusted);
    }

    #[test]
    fn test_fibonacci_quantization() {
        let field_state = FieldState::default();
        let adjuster = GameTheoryAdjuster::new(&field_state);

        let quantized = adjuster.quantize_to_fibonacci(20);
        assert_eq!(quantized, 21); // Nearest Fibonacci

        let quantized = adjuster.quantize_to_fibonacci(100);
        assert_eq!(quantized, 89); // Nearest Fibonacci
    }

    #[test]
    fn test_risk_factor() {
        let strong_bullish = FieldState::new(
            150.0,
            0.0,
            FieldGradient::new(vec![1.0, 2.0, 3.0]),
        );
        let adjuster = GameTheoryAdjuster::new(&strong_bullish);
        assert_eq!(adjuster.risk_factor(), 0.5); // Low risk

        let neutral = FieldState::new(0.0, 0.0, FieldGradient::default());
        let adjuster = GameTheoryAdjuster::new(&neutral);
        assert_eq!(adjuster.risk_factor(), 1.5); // High risk
    }

    #[test]
    fn test_position_sizing() {
        let field_state = FieldState::new(100.0, 0.0, FieldGradient::new(vec![1.0, 2.0]));
        let adjuster = GameTheoryAdjuster::new(&field_state);

        let base_size = 1000.0;
        let adjusted_size = adjuster.position_size(base_size);

        assert!(adjusted_size > base_size); // Larger in bullish conditions
    }

    #[test]
    fn test_recommended_action() {
        let strong_bullish = FieldState::new(
            150.0,
            0.0,
            FieldGradient::new(vec![1.0, 2.0, 3.0]),
        );
        let adjuster = GameTheoryAdjuster::new(&strong_bullish);
        assert_eq!(adjuster.recommended_action(), TradingAction::StrongBuy);

        let bearish = FieldState::new(-60.0, 0.0, FieldGradient::new(vec![-1.0, -2.0]));
        let adjuster = GameTheoryAdjuster::new(&bearish);
        assert_eq!(adjuster.recommended_action(), TradingAction::Sell);
    }

    #[test]
    fn test_confidence_adjustment() {
        let field_state = FieldState::default();
        let adjuster = GameTheoryAdjuster::new(&field_state).with_confidence(0.5);

        let base_payoff = 21;
        let adjusted = adjuster.adjust_payoff(base_payoff);

        // Lower confidence = smaller adjustments
        assert!((adjusted - base_payoff).abs() < base_payoff);
    }
}

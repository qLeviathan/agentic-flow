//! # Macroeconomic φ-Field Model
//!
//! Treats macroeconomic data as a φ-field that influences trading decisions
//! through game theory optimization.
//!
//! ## Concept
//! Economic indicators (GDP, unemployment, inflation, interest rates) are encoded
//! as field vectors in φ-space using Latent-N. The field has:
//! - **Strength**: Magnitude of economic influence (Fibonacci-scaled)
//! - **Direction**: Field angle calculated via CORDIC rotation
//! - **Gradient**: Rate of change across indicators
//!
//! The field modifies Nash equilibrium payoffs in the retrocausal GOAP planner,
//! allowing trading strategies to adapt to macroeconomic conditions.
//!
//! ## Integration
//! - Uses `phi-core::LatentN` for state encoding
//! - Uses `phi-core::CORDIC` for field rotation calculations
//! - Modifies `retrocausal_goap::GOAPAction` payoffs
//! - Can be toggled on/off for A/B testing

pub mod fred_client;
pub mod field_state;
pub mod game_theory;
pub mod influence;

use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use phi_core::{LatentN, FIBONACCI, LUCAS};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub use field_state::{FieldState, FieldGradient};
pub use fred_client::{FREDClient, IndicatorType};
pub use game_theory::GameTheoryAdjuster;
pub use influence::FieldInfluence;

// Re-export CORDIC from phi-core
use phi_core::cordic::PhiCORDIC;

/// Main macroeconomic field manager
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MacroField {
    /// Economic indicators with φ-encoding
    pub indicators: Vec<Indicator>,

    /// Current field state (strength, direction, gradient)
    pub field_state: FieldState,

    /// Fibonacci-indexed influence matrix (how each indicator affects others)
    pub influence_matrix: Vec<Vec<f64>>,

    /// Field enabled flag (for A/B testing)
    pub enabled: bool,

    /// Last update timestamp
    pub last_update: DateTime<Utc>,

    /// CORDIC engine for rotation calculations
    #[serde(skip)]
    cordic: Option<PhiCORDIC>,
}

/// Individual economic indicator
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Indicator {
    /// Indicator name (e.g., "GDP", "UNRATE", "CPIAUCSL")
    pub name: String,

    /// FRED series ID
    pub series_id: String,

    /// Current value
    pub value: f64,

    /// Historical values (for gradient calculation)
    pub history: Vec<f64>,

    /// Latent-N encoding of indicator state
    pub latent_encoding: LatentN,

    /// Fibonacci level (determines influence weight)
    pub fibonacci_level: u64,

    /// Indicator type
    pub indicator_type: IndicatorType,

    /// Last fetch timestamp
    pub timestamp: DateTime<Utc>,
}

impl MacroField {
    /// Create new macroeconomic field
    pub fn new() -> Self {
        Self {
            indicators: Vec::new(),
            field_state: FieldState::default(),
            influence_matrix: Vec::new(),
            enabled: true,
            last_update: Utc::now(),
            cordic: Some(PhiCORDIC::new()),
        }
    }

    /// Initialize CORDIC engine if not already present
    fn ensure_cordic(&mut self) {
        if self.cordic.is_none() {
            self.cordic = Some(PhiCORDIC::new());
        }
    }

    /// Load macroeconomic indicators from FRED API
    ///
    /// # Arguments
    /// * `api_key` - FRED API key
    /// * `indicator_types` - Types of indicators to load
    ///
    /// # Example
    /// ```ignore
    /// let mut field = MacroField::new();
    /// field.load_indicators(api_key, vec![
    ///     IndicatorType::GDP,
    ///     IndicatorType::Unemployment,
    ///     IndicatorType::Inflation,
    /// ]).await?;
    /// ```
    pub async fn load_indicators(
        &mut self,
        api_key: &str,
        indicator_types: Vec<IndicatorType>,
    ) -> Result<()> {
        let client = FREDClient::new(api_key.to_string());
        let mut indicators = Vec::new();

        for (idx, indicator_type) in indicator_types.iter().enumerate() {
            // Fetch data from FRED
            let data = client
                .fetch_series(indicator_type.series_id(), None)
                .await
                .context(format!("Failed to fetch {:?}", indicator_type))?;

            if data.is_empty() {
                continue;
            }

            // Get latest value and history
            let latest_value = data.last().unwrap().value;
            let history: Vec<f64> = data.iter().map(|d| d.value).collect();

            // Calculate Fibonacci level based on indicator importance
            let fibonacci_level = self.calculate_fibonacci_level(indicator_type, idx);

            // Encode as Latent-N
            let latent_encoding = self.encode_to_latent_n(latest_value, &history, fibonacci_level);

            indicators.push(Indicator {
                name: indicator_type.name().to_string(),
                series_id: indicator_type.series_id().to_string(),
                value: latest_value,
                history,
                latent_encoding,
                fibonacci_level,
                indicator_type: indicator_type.clone(),
                timestamp: Utc::now(),
            });
        }

        self.indicators = indicators;
        self.last_update = Utc::now();

        // Rebuild influence matrix
        self.build_influence_matrix();

        // Update field state
        self.update_field_state()?;

        Ok(())
    }

    /// Encode indicator data to Latent-N
    fn encode_to_latent_n(&self, value: f64, history: &[f64], fibonacci_level: u64) -> LatentN {
        // Normalize value to positive integer
        let normalized = (value.abs() * 1000.0) as u64;

        // Calculate volatility (standard deviation of history)
        let volatility = if history.len() > 1 {
            let mean = history.iter().sum::<f64>() / history.len() as f64;
            let variance: f64 = history.iter().map(|x| (x - mean).powi(2)).sum::<f64>()
                / history.len() as f64;
            variance.sqrt()
        } else {
            0.0
        };

        // Encode as Latent-N index
        // Higher volatility → higher Fibonacci level → higher energy
        let volatility_factor = (volatility * 10.0) as u64;
        let n = (fibonacci_level + volatility_factor).min(93);

        LatentN::new(n)
    }

    /// Calculate Fibonacci level for indicator based on importance
    fn calculate_fibonacci_level(&self, indicator_type: &IndicatorType, index: usize) -> u64 {
        // Base level from Fibonacci sequence position
        let base_level = FIBONACCI.get(index + 3).copied().unwrap_or(0);

        // Weight by indicator type importance
        let importance_weight = match indicator_type {
            IndicatorType::GDP => 1.5,
            IndicatorType::Unemployment => 1.3,
            IndicatorType::Inflation => 1.4,
            IndicatorType::InterestRate => 1.6,
            IndicatorType::Custom(_) => 1.0,
        };

        ((base_level as f64 * importance_weight) as u64).min(93)
    }

    /// Build Fibonacci-indexed influence matrix
    ///
    /// Matrix[i][j] = how much indicator i influences indicator j
    /// Values are scaled by Fibonacci ratios for harmonic relationships
    fn build_influence_matrix(&mut self) {
        let n = self.indicators.len();
        if n == 0 {
            return;
        }

        let mut matrix = vec![vec![0.0; n]; n];

        for i in 0..n {
            for j in 0..n {
                if i == j {
                    // Self-influence is 1.0
                    matrix[i][j] = 1.0;
                } else {
                    // Cross-influence based on Fibonacci levels
                    let fib_i = self.indicators[i].fibonacci_level as usize;
                    let fib_j = self.indicators[j].fibonacci_level as usize;

                    // Golden ratio φ-based coupling
                    let phi = 1.618033988749895;
                    let coupling = if fib_i < FIBONACCI.len() && fib_j < FIBONACCI.len() {
                        let ratio = FIBONACCI[fib_i] as f64 / FIBONACCI[fib_j] as f64;
                        (ratio / phi).min(1.0)
                    } else {
                        0.5
                    };

                    matrix[i][j] = coupling;
                }
            }
        }

        self.influence_matrix = matrix;
    }

    /// Encode indicators as φ-field vectors
    ///
    /// Converts economic data into field representation with:
    /// - Position: Latent-N coordinates
    /// - Magnitude: Fibonacci-scaled energy
    /// - Direction: CORDIC-calculated angle
    pub fn encode_to_field(&mut self) -> Result<Vec<FieldVector>> {
        self.ensure_cordic();
        let cordic = self.cordic.as_ref().unwrap();

        let mut vectors = Vec::new();

        for indicator in &self.indicators {
            // Decode Latent-N to get universe state
            let universe = indicator.latent_encoding.decode();

            // Field magnitude from Fibonacci energy
            let magnitude = universe.energy as f64;

            // Field direction from CORDIC rotation
            // Rotate by φ-angle based on Latent-N index
            let angle = universe.angle;
            let cordic_state = cordic.rotate(
                indicator.value as i64,
                0,
                (angle * 65536.0) as i64, // CORDIC fixed-point scaling
            );

            let direction_x = cordic_state.x as f64 / 65536.0;
            let direction_y = cordic_state.y as f64 / 65536.0;

            vectors.push(FieldVector {
                position: (indicator.fibonacci_level as f64, universe.time as f64),
                magnitude,
                direction: (direction_x, direction_y),
                latent_n: indicator.latent_encoding,
            });
        }

        Ok(vectors)
    }

    /// Calculate field influence on a specific point in φ-space
    ///
    /// # Arguments
    /// * `position` - (x, y) coordinates in φ-space
    ///
    /// # Returns
    /// Total field influence at that point (magnitude and direction)
    pub fn calculate_influence(&self, position: (f64, f64)) -> FieldInfluence {
        let mut total_magnitude = 0.0;
        let mut total_direction_x = 0.0;
        let mut total_direction_y = 0.0;

        for (i, indicator) in self.indicators.iter().enumerate() {
            let universe = indicator.latent_encoding.decode();

            // Distance from indicator to position (φ-metric)
            let dx = position.0 - indicator.fibonacci_level as f64;
            let dy = position.1 - universe.time as f64;
            let distance = (dx * dx + dy * dy).sqrt();

            // Field falls off as 1/r² (inverse square law)
            let phi = 1.618033988749895;
            let falloff = if distance > 0.0 {
                phi / (distance * distance)
            } else {
                1.0
            };

            // Weight by Fibonacci energy
            let energy = universe.energy as f64;

            // Apply influence matrix
            let influence_weight: f64 = self
                .influence_matrix
                .get(i)
                .map(|row| row.iter().sum::<f64>() / row.len() as f64)
                .unwrap_or(1.0);

            total_magnitude += energy * falloff * influence_weight;

            // Direction components
            if distance > 0.0 {
                total_direction_x += (dx / distance) * energy * falloff;
                total_direction_y += (dy / distance) * energy * falloff;
            }
        }

        FieldInfluence {
            magnitude: total_magnitude,
            direction_x: total_direction_x,
            direction_y: total_direction_y,
            confidence: self.calculate_confidence(),
        }
    }

    /// Calculate confidence in field predictions (0.0 - 1.0)
    fn calculate_confidence(&self) -> f64 {
        if self.indicators.is_empty() {
            return 0.0;
        }

        // Confidence based on data freshness and completeness
        let now = Utc::now();
        let avg_age: f64 = self
            .indicators
            .iter()
            .map(|i| (now - i.timestamp).num_hours() as f64)
            .sum::<f64>()
            / self.indicators.len() as f64;

        // Decay confidence over time (24 hours = 100%, 720 hours = 0%)
        let freshness = (1.0 - (avg_age / 720.0)).max(0.0);

        // Data completeness (% of indicators with history)
        let completeness = self
            .indicators
            .iter()
            .filter(|i| i.history.len() > 10)
            .count() as f64
            / self.indicators.len() as f64;

        (freshness * 0.6 + completeness * 0.4).min(1.0)
    }

    /// Update field state (strength, direction, gradient)
    fn update_field_state(&mut self) -> Result<()> {
        self.ensure_cordic();

        // Calculate field at origin (current market position)
        let influence = self.calculate_influence((0.0, 0.0));

        // Field strength from total magnitude
        let strength = influence.magnitude;

        // Field direction from CORDIC rotation
        let direction = influence.direction_x.atan2(influence.direction_y);

        // Calculate gradient (rate of change)
        let gradient = self.calculate_field_gradient()?;

        self.field_state = FieldState {
            strength,
            direction,
            gradient,
            last_update: Utc::now(),
        };

        Ok(())
    }

    /// Calculate field gradient (rate of change across indicators)
    fn calculate_field_gradient(&self) -> Result<FieldGradient> {
        let mut gradients = Vec::new();

        for indicator in &self.indicators {
            if indicator.history.len() < 2 {
                gradients.push(0.0);
                continue;
            }

            // Calculate rate of change (latest - previous) / time
            let latest = indicator.history.last().unwrap();
            let previous = indicator.history[indicator.history.len() - 2];
            let gradient = latest - previous;

            gradients.push(gradient);
        }

        Ok(FieldGradient { components: gradients })
    }

    /// Adjust game theory Nash equilibrium based on field state
    ///
    /// Modifies action payoffs in retrocausal GOAP planner based on
    /// macroeconomic field conditions
    pub fn game_theory_adjust(&self, base_payoff: i64) -> i64 {
        if !self.enabled {
            return base_payoff;
        }

        let adjuster = GameTheoryAdjuster::new(&self.field_state);
        adjuster.adjust_payoff(base_payoff)
    }

    /// Toggle field influence on/off (for A/B testing)
    pub fn toggle(&mut self) {
        self.enabled = !self.enabled;
    }

    /// Check if field is enabled
    pub fn is_enabled(&self) -> bool {
        self.enabled
    }

    /// Get field health metrics
    pub fn health_metrics(&self) -> HealthMetrics {
        HealthMetrics {
            indicator_count: self.indicators.len(),
            confidence: self.calculate_confidence(),
            field_strength: self.field_state.strength,
            last_update: self.last_update,
            enabled: self.enabled,
        }
    }
}

impl Default for MacroField {
    fn default() -> Self {
        Self::new()
    }
}

/// Field vector in φ-space
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldVector {
    /// Position in φ-space (Fibonacci level, Lucas time)
    pub position: (f64, f64),

    /// Field magnitude (Fibonacci-scaled energy)
    pub magnitude: f64,

    /// Field direction (x, y components from CORDIC)
    pub direction: (f64, f64),

    /// Latent-N encoding
    pub latent_n: LatentN,
}

/// Health metrics for monitoring
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthMetrics {
    pub indicator_count: usize,
    pub confidence: f64,
    pub field_strength: f64,
    pub last_update: DateTime<Utc>,
    pub enabled: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_macro_field_creation() {
        let field = MacroField::new();
        assert!(field.enabled);
        assert_eq!(field.indicators.len(), 0);
    }

    #[test]
    fn test_toggle() {
        let mut field = MacroField::new();
        assert!(field.is_enabled());

        field.toggle();
        assert!(!field.is_enabled());

        field.toggle();
        assert!(field.is_enabled());
    }

    #[test]
    fn test_latent_n_encoding() {
        let field = MacroField::new();
        let history = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let latent = field.encode_to_latent_n(3.5, &history, 5);

        assert!(latent.n > 0);
        assert!(latent.n < 94);
    }

    #[test]
    fn test_fibonacci_level_calculation() {
        let field = MacroField::new();

        let gdp_level = field.calculate_fibonacci_level(&IndicatorType::GDP, 0);
        let unemployment_level = field.calculate_fibonacci_level(&IndicatorType::Unemployment, 1);

        assert!(gdp_level > 0);
        assert!(unemployment_level > 0);
    }

    #[test]
    fn test_influence_matrix_build() {
        let mut field = MacroField::new();

        // Add dummy indicators
        field.indicators = vec![
            Indicator {
                name: "GDP".to_string(),
                series_id: "GDP".to_string(),
                value: 100.0,
                history: vec![],
                latent_encoding: LatentN::new(5),
                fibonacci_level: 5,
                indicator_type: IndicatorType::GDP,
                timestamp: Utc::now(),
            },
            Indicator {
                name: "UNRATE".to_string(),
                series_id: "UNRATE".to_string(),
                value: 4.5,
                history: vec![],
                latent_encoding: LatentN::new(8),
                fibonacci_level: 8,
                indicator_type: IndicatorType::Unemployment,
                timestamp: Utc::now(),
            },
        ];

        field.build_influence_matrix();

        assert_eq!(field.influence_matrix.len(), 2);
        assert_eq!(field.influence_matrix[0].len(), 2);
        assert_eq!(field.influence_matrix[0][0], 1.0); // Self-influence
        assert!(field.influence_matrix[0][1] > 0.0); // Cross-influence
        assert!(field.influence_matrix[0][1] < 1.0);
    }

    #[test]
    fn test_field_influence_calculation() {
        let mut field = MacroField::new();

        field.indicators = vec![Indicator {
            name: "GDP".to_string(),
            series_id: "GDP".to_string(),
            value: 100.0,
            history: vec![95.0, 97.0, 99.0, 100.0],
            latent_encoding: LatentN::new(10),
            fibonacci_level: 5,
            indicator_type: IndicatorType::GDP,
            timestamp: Utc::now(),
        }];

        field.build_influence_matrix();

        let influence = field.calculate_influence((0.0, 0.0));
        assert!(influence.magnitude > 0.0);
        assert!(influence.confidence >= 0.0);
        assert!(influence.confidence <= 1.0);
    }

    #[test]
    fn test_health_metrics() {
        let field = MacroField::new();
        let metrics = field.health_metrics();

        assert_eq!(metrics.indicator_count, 0);
        assert!(metrics.enabled);
        assert_eq!(metrics.field_strength, 0.0);
    }
}

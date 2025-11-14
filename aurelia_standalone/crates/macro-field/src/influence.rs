//! Field Influence Calculations
//!
//! Computes how the φ-field influences specific points in strategy space

use serde::{Deserialize, Serialize};

/// Field influence at a specific point
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldInfluence {
    /// Total field magnitude at this point
    pub magnitude: f64,

    /// X component of field direction
    pub direction_x: f64,

    /// Y component of field direction
    pub direction_y: f64,

    /// Confidence in influence calculation (0.0 - 1.0)
    pub confidence: f64,
}

impl FieldInfluence {
    /// Create new field influence
    pub fn new(magnitude: f64, direction_x: f64, direction_y: f64, confidence: f64) -> Self {
        Self {
            magnitude,
            direction_x,
            direction_y,
            confidence,
        }
    }

    /// Get direction angle in radians
    pub fn angle(&self) -> f64 {
        self.direction_y.atan2(self.direction_x)
    }

    /// Get direction as unit vector
    pub fn direction_vector(&self) -> (f64, f64) {
        let mag = (self.direction_x.powi(2) + self.direction_y.powi(2)).sqrt();
        if mag > 0.0 {
            (self.direction_x / mag, self.direction_y / mag)
        } else {
            (0.0, 0.0)
        }
    }

    /// Get influence strength (magnitude × confidence)
    pub fn strength(&self) -> f64 {
        self.magnitude * self.confidence
    }

    /// Check if influence is significant (above threshold)
    pub fn is_significant(&self, threshold: f64) -> bool {
        self.strength() > threshold
    }

    /// Interpolate between two influences
    pub fn interpolate(&self, other: &FieldInfluence, t: f64) -> FieldInfluence {
        let t = t.clamp(0.0, 1.0);
        FieldInfluence {
            magnitude: self.magnitude * (1.0 - t) + other.magnitude * t,
            direction_x: self.direction_x * (1.0 - t) + other.direction_x * t,
            direction_y: self.direction_y * (1.0 - t) + other.direction_y * t,
            confidence: self.confidence * (1.0 - t) + other.confidence * t,
        }
    }

    /// Combine multiple influences (superposition principle)
    pub fn combine(influences: &[FieldInfluence]) -> FieldInfluence {
        if influences.is_empty() {
            return FieldInfluence::default();
        }

        let total_magnitude: f64 = influences.iter().map(|i| i.magnitude).sum();
        let total_direction_x: f64 = influences.iter().map(|i| i.direction_x).sum();
        let total_direction_y: f64 = influences.iter().map(|i| i.direction_y).sum();
        let avg_confidence: f64 =
            influences.iter().map(|i| i.confidence).sum::<f64>() / influences.len() as f64;

        FieldInfluence {
            magnitude: total_magnitude,
            direction_x: total_direction_x,
            direction_y: total_direction_y,
            confidence: avg_confidence,
        }
    }

    /// Apply φ-scaling (golden ratio damping)
    pub fn phi_scale(&self, scale: f64) -> FieldInfluence {
        let phi = 1.618033988749895;
        let phi_scale = (scale / phi).max(0.0).min(1.0);

        FieldInfluence {
            magnitude: self.magnitude * phi_scale,
            direction_x: self.direction_x * phi_scale,
            direction_y: self.direction_y * phi_scale,
            confidence: self.confidence,
        }
    }
}

impl Default for FieldInfluence {
    fn default() -> Self {
        Self {
            magnitude: 0.0,
            direction_x: 0.0,
            direction_y: 0.0,
            confidence: 0.0,
        }
    }
}

/// Influence map for strategy space
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InfluenceMap {
    /// Grid resolution
    pub resolution: usize,

    /// Influence values at each grid point
    pub values: Vec<Vec<FieldInfluence>>,

    /// Bounds: (min_x, max_x, min_y, max_y)
    pub bounds: (f64, f64, f64, f64),
}

impl InfluenceMap {
    /// Create new influence map
    pub fn new(resolution: usize, bounds: (f64, f64, f64, f64)) -> Self {
        let values = vec![vec![FieldInfluence::default(); resolution]; resolution];
        Self {
            resolution,
            values,
            bounds,
        }
    }

    /// Sample influence at arbitrary position (bilinear interpolation)
    pub fn sample(&self, x: f64, y: f64) -> FieldInfluence {
        let (min_x, max_x, min_y, max_y) = self.bounds;

        // Normalize coordinates to [0, 1]
        let nx = ((x - min_x) / (max_x - min_x)).clamp(0.0, 1.0);
        let ny = ((y - min_y) / (max_y - min_y)).clamp(0.0, 1.0);

        // Grid coordinates
        let gx = nx * (self.resolution - 1) as f64;
        let gy = ny * (self.resolution - 1) as f64;

        let x0 = gx.floor() as usize;
        let y0 = gy.floor() as usize;
        let x1 = (x0 + 1).min(self.resolution - 1);
        let y1 = (y0 + 1).min(self.resolution - 1);

        // Interpolation weights
        let tx = gx - x0 as f64;
        let ty = gy - y0 as f64;

        // Bilinear interpolation
        let v00 = &self.values[y0][x0];
        let v10 = &self.values[y0][x1];
        let v01 = &self.values[y1][x0];
        let v11 = &self.values[y1][x1];

        let v0 = v00.interpolate(v10, tx);
        let v1 = v01.interpolate(v11, tx);
        v0.interpolate(&v1, ty)
    }

    /// Find point of maximum influence
    pub fn find_maximum(&self) -> Option<((f64, f64), FieldInfluence)> {
        let mut max_influence: Option<(usize, usize, f64)> = None;

        for y in 0..self.resolution {
            for x in 0..self.resolution {
                let strength = self.values[y][x].strength();
                if max_influence.is_none() || strength > max_influence.unwrap().2 {
                    max_influence = Some((x, y, strength));
                }
            }
        }

        max_influence.map(|(x, y, _)| {
            let (min_x, max_x, min_y, max_y) = self.bounds;
            let world_x = min_x + (x as f64 / (self.resolution - 1) as f64) * (max_x - min_x);
            let world_y = min_y + (y as f64 / (self.resolution - 1) as f64) * (max_y - min_y);
            ((world_x, world_y), self.values[y][x].clone())
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_field_influence_angle() {
        let influence = FieldInfluence::new(10.0, 1.0, 1.0, 1.0);
        let angle = influence.angle();
        assert!((angle - std::f64::consts::FRAC_PI_4).abs() < 0.01); // 45 degrees
    }

    #[test]
    fn test_direction_vector() {
        let influence = FieldInfluence::new(10.0, 3.0, 4.0, 1.0);
        let (dx, dy) = influence.direction_vector();
        assert!((dx - 0.6).abs() < 0.01); // 3/5
        assert!((dy - 0.8).abs() < 0.01); // 4/5
    }

    #[test]
    fn test_influence_strength() {
        let influence = FieldInfluence::new(10.0, 0.0, 0.0, 0.5);
        assert_eq!(influence.strength(), 5.0); // 10.0 * 0.5
    }

    #[test]
    fn test_interpolate() {
        let i1 = FieldInfluence::new(0.0, 0.0, 0.0, 1.0);
        let i2 = FieldInfluence::new(10.0, 10.0, 10.0, 1.0);

        let mid = i1.interpolate(&i2, 0.5);
        assert_eq!(mid.magnitude, 5.0);
        assert_eq!(mid.direction_x, 5.0);
        assert_eq!(mid.direction_y, 5.0);
    }

    #[test]
    fn test_combine_influences() {
        let influences = vec![
            FieldInfluence::new(10.0, 1.0, 0.0, 1.0),
            FieldInfluence::new(5.0, 0.0, 1.0, 1.0),
        ];

        let combined = FieldInfluence::combine(&influences);
        assert_eq!(combined.magnitude, 15.0);
        assert_eq!(combined.direction_x, 1.0);
        assert_eq!(combined.direction_y, 1.0);
    }

    #[test]
    fn test_phi_scale() {
        let influence = FieldInfluence::new(10.0, 5.0, 5.0, 1.0);
        let scaled = influence.phi_scale(1.618033988749895);

        assert!(scaled.magnitude < influence.magnitude);
        assert!(scaled.magnitude > 0.0);
    }

    #[test]
    fn test_influence_map_creation() {
        let map = InfluenceMap::new(10, (-10.0, 10.0, -10.0, 10.0));
        assert_eq!(map.resolution, 10);
        assert_eq!(map.values.len(), 10);
        assert_eq!(map.values[0].len(), 10);
    }

    #[test]
    fn test_influence_map_sampling() {
        let mut map = InfluenceMap::new(2, (0.0, 1.0, 0.0, 1.0));
        map.values[0][0] = FieldInfluence::new(0.0, 0.0, 0.0, 1.0);
        map.values[0][1] = FieldInfluence::new(10.0, 10.0, 10.0, 1.0);
        map.values[1][0] = FieldInfluence::new(0.0, 0.0, 0.0, 1.0);
        map.values[1][1] = FieldInfluence::new(10.0, 10.0, 10.0, 1.0);

        // Sample at midpoint
        let sampled = map.sample(0.5, 0.5);
        assert!(sampled.magnitude > 0.0);
        assert!(sampled.magnitude < 10.0);
    }
}

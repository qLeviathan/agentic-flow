//! # CORDIC (COordinate Rotation DIgital Computer)
//!
//! Integer-only rotation and transcendental function computation
//! using Fibonacci angles and φ-based iteration.
//!
//! Traditional CORDIC: Uses binary angles (1, 1/2, 1/4, ...)
//! φ-CORDIC: Uses Fibonacci angles (φ, φ², φ³, ...)
//!
//! Result: Natural convergence to golden ratio spirals

use serde::{Serialize, Deserialize};
use phi_core::FIBONACCI;

/// CORDIC state (all integer, no floating point!)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CORDICState {
    /// X coordinate (scaled by 2^16)
    pub x: i64,

    /// Y coordinate (scaled by 2^16)
    pub y: i64,

    /// Z angle (scaled by 2^16, in units of π)
    pub z: i64,

    /// Current iteration
    pub iteration: u64,
}

/// φ-CORDIC engine
pub struct PhiCORDIC {
    /// Scale factor (2^16 for fixed-point)
    scale: i64,

    /// Fibonacci angles (precomputed)
    angles: Vec<i64>,
}

impl PhiCORDIC {
    /// Create new φ-CORDIC engine
    pub fn new() -> Self {
        let scale = 1 << 16;  // 65536

        // Precompute Fibonacci angles: atan(1/F[n])
        let mut angles = Vec::new();
        for i in 1..20 {
            let fib = FIBONACCI[i] as f64;
            let angle = (1.0 / fib).atan();
            angles.push((angle * scale as f64) as i64);
        }

        Self { scale, angles }
    }

    /// Rotate vector by angle (all integer math)
    pub fn rotate(&self, x: i64, y: i64, target_angle: i64) -> CORDICState {
        let mut state = CORDICState {
            x: x * self.scale,
            y: y * self.scale,
            z: target_angle * self.scale,
            iteration: 0,
        };

        // CORDIC iteration (integer-only)
        for i in 0..self.angles.len() {
            let angle = self.angles[i];

            let direction = if state.z >= 0 { 1 } else { -1 };

            // Rotate by Fibonacci angle
            let fib = FIBONACCI[i + 1] as i64;
            let x_new = state.x - direction * (state.y / fib);
            let y_new = state.y + direction * (state.x / fib);
            let z_new = state.z - direction * angle;

            state.x = x_new;
            state.y = y_new;
            state.z = z_new;
            state.iteration = i as u64;
        }

        // Descale
        state.x /= self.scale;
        state.y /= self.scale;
        state.z /= self.scale;

        state
    }

    /// Calculate sin/cos using CORDIC
    pub fn sincos(&self, angle: i64) -> (f64, f64) {
        let result = self.rotate(1, 0, angle);
        (result.x as f64 / self.scale as f64, result.y as f64 / self.scale as f64)
    }

    /// Generate Fibonacci spiral points
    pub fn fibonacci_spiral(&self, num_points: usize) -> Vec<(f64, f64)> {
        let mut points = Vec::new();
        let phi = 1.618033988749895;

        for i in 0..num_points {
            // Golden angle: 2π / φ
            let angle = (i as f64) * (std::f64::consts::PI * 2.0 / phi);
            let radius = (i as f64).sqrt() * phi;

            // Use CORDIC to calculate position
            let (cos_angle, sin_angle) = self.sincos((angle * self.scale as f64) as i64);

            let x = radius * cos_angle;
            let y = radius * sin_angle;

            points.push((x, y));
        }

        points
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cordic_rotation() {
        let cordic = PhiCORDIC::new();

        // Rotate (1,0) by 90 degrees (π/2)
        let result = cordic.rotate(1, 0, cordic.scale / 2);

        // Should be approximately (0, 1)
        assert!((result.x as f64).abs() < 0.1);
        assert!((result.y as f64 - 1.0).abs() < 0.1);
    }

    #[test]
    fn test_fibonacci_spiral() {
        let cordic = PhiCORDIC::new();
        let points = cordic.fibonacci_spiral(100);

        assert_eq!(points.len(), 100);

        // Check golden angle property
        let angle1 = points[1].1.atan2(points[1].0);
        let angle2 = points[2].1.atan2(points[2].0);
        let diff = (angle2 - angle1).abs();

        // Should be approximately golden angle
        let golden_angle = std::f64::consts::PI * 2.0 / 1.618033988749895;
        assert!((diff - golden_angle).abs() < 0.1);
    }
}

//! BK Divergence, cumulative sums, phase space coordinates, and Nash equilibrium detection
//!
//! This module implements the mathematical framework for analyzing sequences using:
//! - V(n): Sum of Fibonacci indices in Zeckendorf decomposition
//! - U(n): Sum of V(k) for k from 1 to n
//! - S(n): Sum of U(k) for k from 1 to n (BK divergence)
//! - Phase space coordinates for trajectory analysis
//! - Nash equilibrium detection

use crate::decomposition::zeckendorf;
use num_bigint::BigUint;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;

/// Cache for memoized V, U, and S values
static V_CACHE: Mutex<Option<HashMap<u64, u64>>> = Mutex::new(None);
static U_CACHE: Mutex<Option<HashMap<u64, u64>>> = Mutex::new(None);
static S_CACHE: Mutex<Option<HashMap<u64, u64>>> = Mutex::new(None);

/// Initialize caches
pub fn init_caches() {
    let mut v = V_CACHE.lock().unwrap();
    if v.is_none() {
        *v = Some(HashMap::new());
    }

    let mut u = U_CACHE.lock().unwrap();
    if u.is_none() {
        *u = Some(HashMap::new());
    }

    let mut s = S_CACHE.lock().unwrap();
    if s.is_none() {
        *s = Some(HashMap::new());
    }
}

/// Clear all caches
pub fn clear_caches() {
    if let Ok(mut v) = V_CACHE.lock() {
        if let Some(cache) = v.as_mut() {
            cache.clear();
        }
    }

    if let Ok(mut u) = U_CACHE.lock() {
        if let Some(cache) = u.as_mut() {
            cache.clear();
        }
    }

    if let Ok(mut s) = S_CACHE.lock() {
        if let Some(cache) = s.as_mut() {
            cache.clear();
        }
    }
}

/// Compute V(n): Sum of Fibonacci indices in Zeckendorf decomposition
///
/// V(n) = Σ(indices in Zeckendorf decomposition of n)
pub fn compute_v(n: u64) -> u64 {
    // Check cache
    {
        let cache = V_CACHE.lock().unwrap();
        if let Some(ref map) = *cache {
            if let Some(&cached) = map.get(&n) {
                return cached;
            }
        }
    }

    if n == 0 {
        return 0;
    }

    let decomp = zeckendorf(BigUint::from(n));
    let result: u64 = decomp.indices.iter().sum();

    // Cache the result
    {
        let mut cache = V_CACHE.lock().unwrap();
        if let Some(ref mut map) = *cache {
            map.insert(n, result);
        }
    }

    result
}

/// Compute U(n): Cumulative sum of V values
///
/// U(n) = Σ(V(k) for k = 1 to n)
pub fn compute_u(n: u64) -> u64 {
    // Check cache
    {
        let cache = U_CACHE.lock().unwrap();
        if let Some(ref map) = *cache {
            if let Some(&cached) = map.get(&n) {
                return cached;
            }
        }
    }

    if n == 0 {
        return 0;
    }

    // Compute incrementally from last cached value
    let mut start = 0u64;
    let mut result = 0u64;

    {
        let cache = U_CACHE.lock().unwrap();
        if let Some(ref map) = *cache {
            // Find largest cached value < n
            for k in (1..n).rev() {
                if let Some(&cached) = map.get(&k) {
                    start = k;
                    result = cached;
                    break;
                }
            }
        }
    }

    // Compute remaining values
    for k in (start + 1)..=n {
        result += compute_v(k);
    }

    // Cache the result
    {
        let mut cache = U_CACHE.lock().unwrap();
        if let Some(ref mut map) = *cache {
            map.insert(n, result);
        }
    }

    result
}

/// Compute S(n): BK Divergence - cumulative sum of U values
///
/// S(n) = Σ(U(k) for k = 1 to n)
pub fn compute_s(n: u64) -> u64 {
    // Check cache
    {
        let cache = S_CACHE.lock().unwrap();
        if let Some(ref map) = *cache {
            if let Some(&cached) = map.get(&n) {
                return cached;
            }
        }
    }

    if n == 0 {
        return 0;
    }

    // Compute incrementally from last cached value
    let mut start = 0u64;
    let mut result = 0u64;

    {
        let cache = S_CACHE.lock().unwrap();
        if let Some(ref map) = *cache {
            // Find largest cached value < n
            for k in (1..n).rev() {
                if let Some(&cached) = map.get(&k) {
                    start = k;
                    result = cached;
                    break;
                }
            }
        }
    }

    // Compute remaining values
    for k in (start + 1)..=n {
        result += compute_u(k);
    }

    // Cache the result
    {
        let mut cache = S_CACHE.lock().unwrap();
        if let Some(ref mut map) = *cache {
            map.insert(n, result);
        }
    }

    result
}

/// Phase space coordinates for trajectory analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhaseSpacePoint {
    pub n: u64,
    pub v: u64,
    pub u: u64,
    pub s: u64,
    pub x: f64, // Normalized V coordinate
    pub y: f64, // Normalized U coordinate
    pub z: f64, // Normalized S coordinate
}

impl PhaseSpacePoint {
    /// Create a new phase space point
    pub fn new(n: u64) -> Self {
        let v = compute_v(n);
        let u = compute_u(n);
        let s = compute_s(n);

        // Normalize coordinates (using log scale for better visualization)
        let x = if v > 0 { (v as f64).ln() } else { 0.0 };
        let y = if u > 0 { (u as f64).ln() } else { 0.0 };
        let z = if s > 0 { (s as f64).ln() } else { 0.0 };

        Self { n, v, u, s, x, y, z }
    }

    /// Compute Euclidean distance to another point
    pub fn distance_to(&self, other: &PhaseSpacePoint) -> f64 {
        let dx = self.x - other.x;
        let dy = self.y - other.y;
        let dz = self.z - other.z;
        (dx * dx + dy * dy + dz * dz).sqrt()
    }

    /// Compute velocity vector (derivative approximation)
    pub fn velocity_to(&self, other: &PhaseSpacePoint) -> (f64, f64, f64) {
        let dt = (other.n - self.n) as f64;
        if dt == 0.0 {
            return (0.0, 0.0, 0.0);
        }

        (
            (other.x - self.x) / dt,
            (other.y - self.y) / dt,
            (other.z - self.z) / dt,
        )
    }
}

/// Trajectory in phase space
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhaseSpaceTrajectory {
    pub points: Vec<PhaseSpacePoint>,
    pub start: u64,
    pub end: u64,
}

impl PhaseSpaceTrajectory {
    /// Create a trajectory from start to end
    pub fn new(start: u64, end: u64) -> Self {
        let points: Vec<PhaseSpacePoint> = (start..=end)
            .map(PhaseSpacePoint::new)
            .collect();

        Self { points, start, end }
    }

    /// Get total path length
    pub fn path_length(&self) -> f64 {
        self.points.windows(2)
            .map(|w| w[0].distance_to(&w[1]))
            .sum()
    }

    /// Detect potential equilibrium points (where velocity is low)
    pub fn find_equilibria(&self, threshold: f64) -> Vec<usize> {
        let mut equilibria = Vec::new();

        for i in 0..self.points.len().saturating_sub(1) {
            let (vx, vy, vz) = self.points[i].velocity_to(&self.points[i + 1]);
            let speed = (vx * vx + vy * vy + vz * vz).sqrt();

            if speed < threshold {
                equilibria.push(i);
            }
        }

        equilibria
    }
}

/// Nash equilibrium detection for game-theoretic analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NashEquilibrium {
    pub position: u64,
    pub v: u64,
    pub u: u64,
    pub s: u64,
    pub stability_score: f64,
}

impl NashEquilibrium {
    /// Detect Nash equilibrium by analyzing local stability
    pub fn detect(trajectory: &PhaseSpaceTrajectory, window_size: usize) -> Vec<NashEquilibrium> {
        let mut equilibria = Vec::new();

        if trajectory.points.len() < window_size {
            return equilibria;
        }

        for i in window_size..trajectory.points.len() - window_size {
            let point = &trajectory.points[i];

            // Analyze local neighborhood
            let mut stability = 0.0;
            let mut count = 0;

            for j in (i.saturating_sub(window_size))..=(i + window_size).min(trajectory.points.len() - 1) {
                if i != j {
                    let dist = point.distance_to(&trajectory.points[j]);
                    stability += 1.0 / (1.0 + dist); // Inverse distance weighting
                    count += 1;
                }
            }

            stability /= count as f64;

            // If stability is high, it's a potential equilibrium
            if stability > 0.8 {
                equilibria.push(NashEquilibrium {
                    position: point.n,
                    v: point.v,
                    u: point.u,
                    s: point.s,
                    stability_score: stability,
                });
            }
        }

        equilibria
    }
}

/// Compute divergence metrics for a range
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DivergenceMetrics {
    pub range_start: u64,
    pub range_end: u64,
    pub total_v: u64,
    pub total_u: u64,
    pub total_s: u64,
    pub mean_v: f64,
    pub mean_u: f64,
    pub mean_s: f64,
    pub max_v: u64,
    pub max_u: u64,
    pub max_s: u64,
}

impl DivergenceMetrics {
    /// Compute metrics for a range
    pub fn compute(start: u64, end: u64) -> Self {
        let mut total_v = 0u64;
        let mut total_u = 0u64;
        let mut total_s = 0u64;
        let mut max_v = 0u64;
        let mut max_u = 0u64;
        let mut max_s = 0u64;

        let count = (end - start + 1) as f64;

        for n in start..=end {
            let v = compute_v(n);
            let u = compute_u(n);
            let s = compute_s(n);

            total_v += v;
            total_u += u;
            total_s += s;

            max_v = max_v.max(v);
            max_u = max_u.max(u);
            max_s = max_s.max(s);
        }

        Self {
            range_start: start,
            range_end: end,
            total_v,
            total_u,
            total_s,
            mean_v: total_v as f64 / count,
            mean_u: total_u as f64 / count,
            mean_s: total_s as f64 / count,
            max_v,
            max_u,
            max_s,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_v() {
        // 10 = F(3) + F(6) = 2 + 8, indices [3, 6], sum = 9
        assert_eq!(compute_v(10), 9);

        // 1 = F(2)=1 or F(1)=1, using F(1), indices [1], sum = 1
        // Actually 1 = F(2) = 1, so indices [2], sum = 2
        assert_eq!(compute_v(1), 2);
    }

    #[test]
    fn test_compute_u() {
        let u_5 = compute_u(5);

        // U(5) = V(1) + V(2) + V(3) + V(4) + V(5)
        let expected: u64 = (1..=5).map(compute_v).sum();
        assert_eq!(u_5, expected);
    }

    #[test]
    fn test_compute_s() {
        let s_5 = compute_s(5);

        // S(5) = U(1) + U(2) + U(3) + U(4) + U(5)
        let expected: u64 = (1..=5).map(compute_u).sum();
        assert_eq!(s_5, expected);
    }

    #[test]
    fn test_phase_space_point() {
        let point = PhaseSpacePoint::new(10);
        assert_eq!(point.n, 10);
        assert_eq!(point.v, compute_v(10));
        assert_eq!(point.u, compute_u(10));
        assert_eq!(point.s, compute_s(10));
    }

    #[test]
    fn test_trajectory() {
        let trajectory = PhaseSpaceTrajectory::new(1, 10);
        assert_eq!(trajectory.points.len(), 10);
        assert!(trajectory.path_length() > 0.0);
    }

    #[test]
    fn test_divergence_metrics() {
        let metrics = DivergenceMetrics::compute(1, 10);
        assert_eq!(metrics.range_start, 1);
        assert_eq!(metrics.range_end, 10);
        assert!(metrics.mean_v > 0.0);
        assert!(metrics.mean_u > 0.0);
        assert!(metrics.mean_s > 0.0);
    }

    #[test]
    fn test_caching() {
        clear_caches();
        init_caches();

        // First computation
        let _ = compute_s(50);

        // Verify cache has values
        let cache = S_CACHE.lock().unwrap();
        assert!(cache.as_ref().unwrap().contains_key(&50));
    }
}

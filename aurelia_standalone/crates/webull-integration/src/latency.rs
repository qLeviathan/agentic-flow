//! Latency tracking and monitoring

use chrono::{DateTime, Utc};
use phi_core::LatentN;
use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::time::Instant;
use tokio::sync::RwLock;
use tracing::{debug, warn};

use crate::types::LatencyMetrics;

/// Latency target in microseconds (10ms = 10,000 microseconds)
const TARGET_LATENCY_US: u64 = 10_000;

/// Maximum number of latency samples to keep
const MAX_SAMPLES: usize = 1000;

/// Latency tracker for monitoring API performance
pub struct LatencyTracker {
    samples: RwLock<VecDeque<LatencyMetrics>>,
    stats: RwLock<LatencyStats>,
}

impl LatencyTracker {
    /// Create new latency tracker
    pub fn new() -> Self {
        Self {
            samples: RwLock::new(VecDeque::with_capacity(MAX_SAMPLES)),
            stats: RwLock::new(LatencyStats::default()),
        }
    }

    /// Start timing an operation
    pub fn start(&self) -> LatencyTimer {
        LatencyTimer::new()
    }

    /// Record latency measurement
    pub async fn record(&self, operation: String, duration_us: u64) {
        let request_time = Utc::now() - chrono::Duration::microseconds(duration_us as i64);
        let response_time = Utc::now();
        let meets_target = duration_us < TARGET_LATENCY_US;

        // Encode latency into Latent-N (use microseconds as index)
        // Cap at u64::MAX to avoid overflow
        let latent_n = (duration_us / 1000).min(u64::MAX);
        let latent_state = LatentN::new(latent_n);

        let metric = LatencyMetrics {
            request_time,
            response_time,
            latency_us: duration_us,
            operation: operation.clone(),
            meets_target,
            latent_state,
        };

        // Add to samples
        {
            let mut samples = self.samples.write().await;
            if samples.len() >= MAX_SAMPLES {
                samples.pop_front();
            }
            samples.push_back(metric);
        }

        // Update stats
        self.update_stats(duration_us, meets_target, &operation).await;

        // Log warning if latency exceeds target
        if !meets_target {
            warn!(
                "Operation '{}' exceeded latency target: {}μs (target: {}μs)",
                operation, duration_us, TARGET_LATENCY_US
            );
        } else {
            debug!(
                "Operation '{}' completed in {}μs ({}ms)",
                operation, duration_us, duration_us / 1000
            );
        }
    }

    /// Get current latency statistics
    pub async fn get_stats(&self) -> LatencyStats {
        let stats = self.stats.read().await;
        stats.clone()
    }

    /// Get recent latency samples
    pub async fn get_samples(&self, count: usize) -> Vec<LatencyMetrics> {
        let samples = self.samples.read().await;
        samples.iter()
            .rev()
            .take(count)
            .cloned()
            .collect()
    }

    /// Get average latency for operation type
    pub async fn get_average_latency(&self, operation: &str) -> Option<u64> {
        let samples = self.samples.read().await;
        let matching: Vec<_> = samples.iter()
            .filter(|s| s.operation == operation)
            .collect();

        if matching.is_empty() {
            return None;
        }

        let sum: u64 = matching.iter().map(|s| s.latency_us).sum();
        Some(sum / matching.len() as u64)
    }

    /// Get percentile latency (p50, p95, p99)
    pub async fn get_percentile(&self, percentile: f64) -> Option<u64> {
        let samples = self.samples.read().await;
        if samples.is_empty() {
            return None;
        }

        let mut latencies: Vec<_> = samples.iter().map(|s| s.latency_us).collect();
        latencies.sort_unstable();

        let index = ((percentile / 100.0) * latencies.len() as f64) as usize;
        latencies.get(index.min(latencies.len() - 1)).copied()
    }

    /// Check if system is meeting latency targets
    pub async fn is_healthy(&self) -> bool {
        let stats = self.stats.read().await;
        stats.success_rate > 0.95  // 95% of operations should meet target
    }

    /// Update statistics
    async fn update_stats(&self, latency_us: u64, meets_target: bool, operation: &str) {
        let mut stats = self.stats.write().await;

        stats.total_operations += 1;
        if meets_target {
            stats.successful_operations += 1;
        }

        stats.success_rate = stats.successful_operations as f64 / stats.total_operations as f64;

        // Update min/max
        if stats.min_latency_us == 0 || latency_us < stats.min_latency_us {
            stats.min_latency_us = latency_us;
        }
        if latency_us > stats.max_latency_us {
            stats.max_latency_us = latency_us;
        }

        // Update average (running average)
        stats.avg_latency_us = ((stats.avg_latency_us * (stats.total_operations - 1) as f64)
            + latency_us as f64) / stats.total_operations as f64;

        // Track per-operation stats
        let op_stats = stats.per_operation.entry(operation.to_string())
            .or_insert(OperationStats::default());

        op_stats.count += 1;
        op_stats.total_latency_us += latency_us;
        op_stats.avg_latency_us = op_stats.total_latency_us as f64 / op_stats.count as f64;
    }
}

impl Default for LatencyTracker {
    fn default() -> Self {
        Self::new()
    }
}

/// Latency timer for measuring operation duration
pub struct LatencyTimer {
    start: Instant,
}

impl LatencyTimer {
    fn new() -> Self {
        Self {
            start: Instant::now(),
        }
    }

    /// Stop timer and get elapsed microseconds
    pub fn stop(&self) -> u64 {
        self.start.elapsed().as_micros() as u64
    }

    /// Get elapsed microseconds without stopping
    pub fn elapsed(&self) -> u64 {
        self.start.elapsed().as_micros() as u64
    }
}

/// Latency statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LatencyStats {
    /// Total operations measured
    pub total_operations: u64,

    /// Operations meeting target
    pub successful_operations: u64,

    /// Success rate (0.0 - 1.0)
    pub success_rate: f64,

    /// Minimum latency (μs)
    pub min_latency_us: u64,

    /// Maximum latency (μs)
    pub max_latency_us: u64,

    /// Average latency (μs)
    pub avg_latency_us: f64,

    /// Per-operation statistics
    pub per_operation: std::collections::HashMap<String, OperationStats>,
}

impl Default for LatencyStats {
    fn default() -> Self {
        Self {
            total_operations: 0,
            successful_operations: 0,
            success_rate: 0.0,
            min_latency_us: 0,
            max_latency_us: 0,
            avg_latency_us: 0.0,
            per_operation: std::collections::HashMap::new(),
        }
    }
}

/// Statistics for specific operation type
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OperationStats {
    pub count: u64,
    pub total_latency_us: u64,
    pub avg_latency_us: f64,
}

impl Default for OperationStats {
    fn default() -> Self {
        Self {
            count: 0,
            total_latency_us: 0,
            avg_latency_us: 0.0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_latency_tracking() {
        let tracker = LatencyTracker::new();

        // Record some measurements
        tracker.record("test_op".to_string(), 5_000).await;  // 5ms - meets target
        tracker.record("test_op".to_string(), 15_000).await; // 15ms - exceeds target

        let stats = tracker.get_stats().await;
        assert_eq!(stats.total_operations, 2);
        assert_eq!(stats.successful_operations, 1);
        assert_eq!(stats.success_rate, 0.5);
    }

    #[test]
    fn test_latency_timer() {
        let timer = LatencyTimer::new();
        std::thread::sleep(std::time::Duration::from_millis(10));
        let elapsed = timer.stop();

        // Should be at least 10ms (10,000 μs)
        assert!(elapsed >= 10_000);
    }
}

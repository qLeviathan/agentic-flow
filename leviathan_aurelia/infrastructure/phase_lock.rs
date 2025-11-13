// Phase-Locked Coordination System
// Inspired by phase-space coordinate framework

use std::sync::{Arc, Mutex, atomic::{AtomicU64, Ordering}};
use std::collections::HashMap;
use std::time::{Duration, Instant};

/// φ-coordinates in phase space
#[derive(Debug, Clone, Copy)]
pub struct PhaseCoordinates {
    pub phi: f64,      // φ coordinate
    pub psi: f64,      // ψ coordinate
    pub theta: f64,    // Angular position
    pub magnitude: f64, // Radial distance
    pub n: f64,        // Index parameter
}

/// Nash equilibrium point
#[derive(Debug, Clone)]
pub struct NashPoint {
    pub n: f64,
    pub coordinates: PhaseCoordinates,
    pub stability_index: f64,
    pub surrounding_flow: String,
}

/// Phase-locked swarm coordinator
pub struct PhaseLockedCoordinator {
    agents: Arc<Mutex<HashMap<String, AgentPhase>>>,
    global_phase: Arc<AtomicU64>,
    sync_threshold: f64,
    base_frequency: f64,
}

/// Agent phase state
#[derive(Debug, Clone)]
pub struct AgentPhase {
    pub id: String,
    pub phase: f64,           // Current phase angle
    pub frequency: f64,       // Natural frequency
    pub coordinates: PhaseCoordinates,
    pub last_sync: Instant,
    pub task_progress: f64,
}

impl PhaseLockedCoordinator {
    pub fn new(base_frequency: f64, sync_threshold: f64) -> Self {
        Self {
            agents: Arc::new(Mutex::new(HashMap::new())),
            global_phase: Arc::new(AtomicU64::new(0)),
            sync_threshold,
            base_frequency,
        }
    }

    /// Register new agent with phase initialization
    pub fn register_agent(&self, id: String, natural_frequency: f64) {
        let n = self.agents.lock().unwrap().len() as f64;
        let coordinates = self.calculate_coordinates(n, 50);

        let agent = AgentPhase {
            id: id.clone(),
            phase: 0.0,
            frequency: natural_frequency,
            coordinates,
            last_sync: Instant::now(),
            task_progress: 0.0,
        };

        self.agents.lock().unwrap().insert(id, agent);
    }

    /// Calculate phase space coordinates using Riemann zeta zeros
    /// Based on phase-space-demo.ts coordinate calculation
    fn calculate_coordinates(&self, n: f64, max_zeros: usize) -> PhaseCoordinates {
        // Golden ratio and conjugate
        let phi = (1.0 + 5.0_f64.sqrt()) / 2.0;
        let psi = (1.0 - 5.0_f64.sqrt()) / 2.0;

        // Simplified calculation (full version uses Riemann zeros)
        let phi_coord = phi.powf(n) / n.sqrt();
        let psi_coord = psi.powf(n) / n.sqrt();

        let magnitude = (phi_coord * phi_coord + psi_coord * psi_coord).sqrt();
        let theta = psi_coord.atan2(phi_coord);

        PhaseCoordinates {
            phi: phi_coord,
            psi: psi_coord,
            theta,
            magnitude,
            n,
        }
    }

    /// Check if current state is at Nash equilibrium
    fn is_nash_point(&self, n: f64) -> bool {
        // Nash points occur at Lucas sequence boundaries
        // L_m = φ^m + ψ^m
        let lucas = [1.0, 3.0, 4.0, 7.0, 11.0, 18.0, 29.0, 47.0, 76.0, 123.0];

        for &l in &lucas {
            if (n - l).abs() < 0.5 {
                return true;
            }
        }
        false
    }

    /// Kuramoto model phase synchronization
    /// dθ_i/dt = ω_i + (K/N) Σ sin(θ_j - θ_i)
    pub fn sync_step(&self, dt: f64, coupling: f64) {
        let mut agents = self.agents.lock().unwrap();
        let n = agents.len() as f64;

        if n == 0 {
            return;
        }

        // Calculate phase updates
        let agent_phases: Vec<(String, f64)> = agents.iter()
            .map(|(id, a)| (id.clone(), a.phase))
            .collect();

        for (id, current_phase) in &agent_phases {
            if let Some(agent) = agents.get_mut(id) {
                // Natural frequency drift
                let mut phase_change = agent.frequency * dt;

                // Coupling term (Kuramoto model)
                let coupling_sum: f64 = agent_phases.iter()
                    .filter(|(other_id, _)| other_id != id)
                    .map(|(_, other_phase)| (other_phase - current_phase).sin())
                    .sum();

                phase_change += (coupling / n) * coupling_sum;

                // Update phase
                agent.phase = (agent.phase + phase_change) % (2.0 * std::f64::consts::PI);

                // Update coordinates based on new phase
                agent.coordinates = self.calculate_coordinates(agent.phase, 50);
            }
        }

        // Update global phase (average)
        let avg_phase = agent_phases.iter()
            .map(|(_, p)| p)
            .sum::<f64>() / n;

        let phase_bits = avg_phase.to_bits();
        self.global_phase.store(phase_bits, Ordering::SeqCst);
    }

    /// Check synchronization level (order parameter)
    /// r = |⟨e^{iθ}⟩| where ⟨⟩ is ensemble average
    pub fn sync_level(&self) -> f64 {
        let agents = self.agents.lock().unwrap();
        let n = agents.len() as f64;

        if n == 0.0 {
            return 0.0;
        }

        let (sum_cos, sum_sin): (f64, f64) = agents.values()
            .map(|a| (a.phase.cos(), a.phase.sin()))
            .fold((0.0, 0.0), |(sc, ss), (c, s)| (sc + c, ss + s));

        let r_x = sum_cos / n;
        let r_y = sum_sin / n;

        (r_x * r_x + r_y * r_y).sqrt()
    }

    /// Find agents near Nash equilibrium points
    pub fn find_nash_agents(&self) -> Vec<(String, NashPoint)> {
        let agents = self.agents.lock().unwrap();
        let mut nash_agents = Vec::new();

        for (id, agent) in agents.iter() {
            if self.is_nash_point(agent.coordinates.n) {
                let nash_point = NashPoint {
                    n: agent.coordinates.n,
                    coordinates: agent.coordinates.clone(),
                    stability_index: self.calculate_stability(&agent.coordinates),
                    surrounding_flow: self.classify_flow(&agent.coordinates),
                };

                nash_agents.push((id.clone(), nash_point));
            }
        }

        nash_agents
    }

    /// Calculate local stability index
    fn calculate_stability(&self, coords: &PhaseCoordinates) -> f64 {
        // Lyapunov exponent approximation
        let divergence = coords.magnitude.ln();
        let time_scale = coords.n;

        divergence / time_scale.max(1.0)
    }

    /// Classify flow around point
    fn classify_flow(&self, coords: &PhaseCoordinates) -> String {
        let stability = self.calculate_stability(coords);

        if stability < -0.1 {
            "sink".to_string()
        } else if stability > 0.1 {
            "source".to_string()
        } else {
            "saddle".to_string()
        }
    }

    /// Get coordination metrics
    pub fn get_metrics(&self) -> CoordinationMetrics {
        let agents = self.agents.lock().unwrap();
        let sync = self.sync_level();
        let nash_count = self.find_nash_agents().len();

        let avg_progress = if !agents.is_empty() {
            agents.values().map(|a| a.task_progress).sum::<f64>() / agents.len() as f64
        } else {
            0.0
        };

        CoordinationMetrics {
            agent_count: agents.len(),
            sync_level: sync,
            is_synchronized: sync > self.sync_threshold,
            nash_points: nash_count,
            avg_task_progress: avg_progress,
            global_phase: f64::from_bits(self.global_phase.load(Ordering::SeqCst)),
        }
    }

    /// Update agent task progress
    pub fn update_progress(&self, agent_id: &str, progress: f64) {
        if let Some(agent) = self.agents.lock().unwrap().get_mut(agent_id) {
            agent.task_progress = progress.clamp(0.0, 1.0);
            agent.last_sync = Instant::now();
        }
    }
}

/// Coordination metrics for monitoring
#[derive(Debug, Clone)]
pub struct CoordinationMetrics {
    pub agent_count: usize,
    pub sync_level: f64,
    pub is_synchronized: bool,
    pub nash_points: usize,
    pub avg_task_progress: f64,
    pub global_phase: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_phase_sync() {
        let coordinator = PhaseLockedCoordinator::new(1.0, 0.8);

        // Register agents with different natural frequencies
        coordinator.register_agent("agent1".to_string(), 1.0);
        coordinator.register_agent("agent2".to_string(), 1.1);
        coordinator.register_agent("agent3".to_string(), 0.9);

        // Run synchronization steps
        for _ in 0..100 {
            coordinator.sync_step(0.1, 1.0);
        }

        // Check synchronization level
        let sync = coordinator.sync_level();
        assert!(sync > 0.5, "Agents should achieve partial synchronization");
    }

    #[test]
    fn test_nash_points() {
        let coordinator = PhaseLockedCoordinator::new(1.0, 0.8);

        // Register agent at Nash point
        coordinator.register_agent("nash_agent".to_string(), 1.0);

        // Manually set coordinates to Nash point
        {
            let mut agents = coordinator.agents.lock().unwrap();
            if let Some(agent) = agents.get_mut("nash_agent") {
                agent.coordinates.n = 7.0; // Lucas number
            }
        }

        let nash_agents = coordinator.find_nash_agents();
        assert_eq!(nash_agents.len(), 1, "Should find Nash point at L_4=7");
    }

    #[test]
    fn test_coordination_metrics() {
        let coordinator = PhaseLockedCoordinator::new(1.0, 0.8);

        coordinator.register_agent("agent1".to_string(), 1.0);
        coordinator.register_agent("agent2".to_string(), 1.0);

        coordinator.update_progress("agent1", 0.5);
        coordinator.update_progress("agent2", 0.7);

        let metrics = coordinator.get_metrics();
        assert_eq!(metrics.agent_count, 2);
        assert!((metrics.avg_task_progress - 0.6).abs() < 0.01);
    }
}

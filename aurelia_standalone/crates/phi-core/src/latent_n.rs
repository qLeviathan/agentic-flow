//! # Latent-N Universe Encoder
//!
//! The CORE of AURELIA: Every piece of information is encoded as a single integer n,
//! from which we can extract:
//! - Energy: F[n] (Fibonacci)
//! - Time: L[n] (Lucas)
//! - Address: Zeckendorf(n)
//! - Direction: (-1)^n (forward/backward)
//! - Rotation: CORDIC angle at n
//!
//! This is the UNIFIED STATE TRACKER for the entire system.

use serde::{Serialize, Deserialize};
use phi_core::{FIBONACCI, LUCAS};

/// Latent-N: Single integer encoding entire universe state
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct LatentN {
    /// The fundamental index
    pub n: u64,
}

/// Universe decoded from Latent-N
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UniverseState {
    /// Energy level (Fibonacci)
    pub energy: u64,

    /// Time coordinate (Lucas)
    pub time: u64,

    /// Memory address (Zeckendorf bits)
    pub address: Vec<bool>,

    /// Direction (forward/backward)
    pub direction: Direction,

    /// CORDIC rotation angle
    pub angle: f64,

    /// φ-level (for game theory)
    pub phi_level: u64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum Direction {
    Forward,   // Even n
    Backward,  // Odd n (retrocausal)
}

impl LatentN {
    /// Create new Latent-N from index
    pub fn new(n: u64) -> Self {
        Self { n }
    }

    /// Decode entire universe from single integer
    pub fn decode(&self) -> UniverseState {
        let n = self.n as usize;

        // Energy from Fibonacci
        let energy = if n < FIBONACCI.len() {
            FIBONACCI[n]
        } else {
            self.binet_fibonacci(self.n)
        };

        // Time from Lucas
        let time = if n < LUCAS.len() {
            LUCAS[n]
        } else {
            self.binet_lucas(self.n)
        };

        // Address from Zeckendorf decomposition
        let address = self.zeckendorf_bits(self.n);

        // Direction from parity
        let direction = if self.n % 2 == 0 {
            Direction::Forward
        } else {
            Direction::Backward  // Retrocausal!
        };

        // CORDIC angle (φ-based rotation)
        let angle = (self.n as f64) * (std::f64::consts::PI * 2.0 / 1.618033988749895);

        // φ-level for game theory
        let phi_level = self.calculate_phi_level();

        UniverseState {
            energy,
            time,
            address,
            direction,
            angle,
            phi_level,
        }
    }

    /// Calculate Fibonacci using Binet's formula
    fn binet_fibonacci(&self, n: u64) -> u64 {
        let phi = 1.618033988749895;
        let psi = -0.618033988749895;
        ((phi.powi(n as i32) - psi.powi(n as i32)) / 5f64.sqrt()).round() as u64
    }

    /// Calculate Lucas using Binet's formula
    fn binet_lucas(&self, n: u64) -> u64 {
        let phi = 1.618033988749895;
        let psi = -0.618033988749895;
        (phi.powi(n as i32) + psi.powi(n as i32)).round() as u64
    }

    /// Zeckendorf decomposition to bit pattern
    fn zeckendorf_bits(&self, mut n: u64) -> Vec<bool> {
        let mut bits = Vec::new();
        let mut i = FIBONACCI.len() - 1;

        while n > 0 && i > 0 {
            if FIBONACCI[i] <= n {
                bits.push(true);
                n -= FIBONACCI[i];
                i = i.saturating_sub(2);  // Skip consecutive Fibonacci
            } else {
                bits.push(false);
                i -= 1;
            }
        }

        bits.reverse();
        bits
    }

    /// Calculate φ-level (how "deep" in golden ratio hierarchy)
    fn calculate_phi_level(&self) -> u64 {
        // φ-level = log_φ(F[n])
        if self.n < FIBONACCI.len() as u64 {
            let fib = FIBONACCI[self.n as usize] as f64;
            if fib > 0.0 {
                (fib.ln() / 1.618033988749895f64.ln()) as u64
            } else {
                0
            }
        } else {
            self.n / 2  // Approximation for large n
        }
    }

    /// Advance to next state (forward or retrocausal)
    pub fn advance(&self, direction: Direction) -> Self {
        match direction {
            Direction::Forward => Self::new(self.n + 1),
            Direction::Backward => Self::new(self.n.saturating_sub(1)),  // Retrocausal
        }
    }

    /// Check if at Lucas boundary (natural stopping point)
    pub fn is_lucas_boundary(&self) -> bool {
        if self.n < LUCAS.len() as u64 {
            let lucas = LUCAS[self.n as usize];
            let fib = FIBONACCI[self.n as usize];
            // Lucas boundary when L[n] is close to φ^n
            (lucas as f64 / fib as f64 - 1.618033988749895).abs() < 0.01
        } else {
            false
        }
    }
}

/// Equation process (coefficients/exponents change, not values)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EquationProcess {
    /// Base equation: y = a * φ^(bx + c)
    pub coefficients: Coefficients,

    /// Current Latent-N state
    pub state: LatentN,

    /// History of state transitions
    pub history: Vec<LatentN>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Coefficients {
    pub a: f64,  // Amplitude
    pub b: f64,  // Frequency
    pub c: f64,  // Phase shift
}

impl EquationProcess {
    /// Create new equation process from Latent-N
    pub fn new(initial_state: LatentN) -> Self {
        let universe = initial_state.decode();

        Self {
            coefficients: Coefficients {
                a: universe.energy as f64,
                b: 1.0 / universe.time as f64,
                c: universe.angle,
            },
            state: initial_state,
            history: vec![initial_state],
        }
    }

    /// Update coefficients based on new state
    pub fn update(&mut self, new_state: LatentN) {
        let universe = new_state.decode();

        // Coefficients change based on Latent-N evolution
        self.coefficients.a *= (universe.energy as f64).ln() / (self.state.decode().energy as f64).ln();
        self.coefficients.b += 0.1 * (universe.time as f64 - self.state.decode().time as f64);
        self.coefficients.c = universe.angle;

        self.state = new_state;
        self.history.push(new_state);
    }

    /// Evaluate equation at x
    pub fn evaluate(&self, x: f64) -> f64 {
        let phi = 1.618033988749895;
        self.coefficients.a * phi.powf(self.coefficients.b * x + self.coefficients.c)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_latent_n_decode() {
        let n = LatentN::new(10);
        let universe = n.decode();

        assert_eq!(universe.energy, 55);  // F[10]
        assert_eq!(universe.time, 123);   // L[10]
        assert_eq!(universe.direction, Direction::Forward);  // Even
    }

    #[test]
    fn test_equation_process() {
        let initial = LatentN::new(5);
        let mut process = EquationProcess::new(initial);

        // Evaluate at x=1
        let y = process.evaluate(1.0);
        assert!(y > 0.0);

        // Update to new state
        process.update(LatentN::new(8));
        assert_eq!(process.history.len(), 2);
    }
}

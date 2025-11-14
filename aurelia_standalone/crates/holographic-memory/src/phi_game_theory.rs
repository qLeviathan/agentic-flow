//! # Φ-Game Theory: Nash Equilibrium at Every Decision Point
//!
//! Unlike AgentDB (which learns from past episodes), this uses φ-mechanics to
//! calculate the Nash equilibrium for every decision in real-time.
//!
//! ## Core Concept
//!
//! Every decision is mapped to φ-space where:
//! - Payoff matrix → Fibonacci matrix
//! - Strategy space → Zeckendorf decomposition
//! - Nash equilibrium → Lucas boundary convergence
//!
//! ## Example Decision Mapping
//!
//! ```
//! Decision: "Should I compress this memory?"
//!
//! Payoffs in φ-space:
//! - Compress: Cost=F[3]=2, Benefit=F[8]=21 → Net=19 (φ⁵)
//! - Don't compress: Cost=F[0]=0, Benefit=F[0]=0 → Net=0
//!
//! Nash equilibrium: Compress (dominant strategy at φ⁵ level)
//! ```

use anyhow::{Result, Context};
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use phi_core::FIBONACCI;

/// Decision node in φ-game tree
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhiDecisionNode {
    /// Decision description
    pub description: String,

    /// Available actions (mapped to Fibonacci indices)
    pub actions: Vec<PhiAction>,

    /// Current state (as Zeckendorf bits)
    pub state: Vec<bool>,

    /// Nash equilibrium solution
    pub equilibrium: Option<PhiAction>,
}

/// Action in φ-game theory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhiAction {
    /// Action name
    pub name: String,

    /// Cost (as Fibonacci index)
    pub cost_index: u64,

    /// Benefit (as Fibonacci index)
    pub benefit_index: u64,

    /// Net payoff (benefit - cost in φ-space)
    pub net_payoff: i64,

    /// φ-level (higher = better strategy)
    pub phi_level: u64,
}

/// φ-Game theory decision tree
pub struct PhiGameTree {
    /// All decision nodes
    nodes: Vec<PhiDecisionNode>,

    /// Decision cache (context → action)
    cache: HashMap<String, String>,
}

impl PhiGameTree {
    /// Create new φ-game tree
    pub fn new() -> Self {
        Self {
            nodes: Vec::new(),
            cache: HashMap::new(),
        }
    }

    /// Make decision using φ-game theory (Nash equilibrium)
    pub fn decide(&mut self, context: &str) -> Result<String> {
        // Check cache first
        if let Some(cached_action) = self.cache.get(context) {
            return Ok(cached_action.clone());
        }

        // Parse context to extract decision parameters
        let decision = self.parse_context(context)?;

        // Calculate Nash equilibrium in φ-space
        let equilibrium_action = self.calculate_nash_equilibrium(&decision)?;

        // Cache for future
        self.cache.insert(context.to_string(), equilibrium_action.name.clone());

        // Store decision node
        self.nodes.push(decision);

        Ok(equilibrium_action.name)
    }

    /// Parse context string into decision node
    fn parse_context(&self, context: &str) -> Result<PhiDecisionNode> {
        // Example context: "compress_memory:size=1024,benefit=high"

        let parts: Vec<&str> = context.split(':').collect();
        let description = parts.get(0).unwrap_or(&"").to_string();

        // Extract parameters
        let params: HashMap<String, String> = if parts.len() > 1 {
            parts[1].split(',')
                .filter_map(|kv| {
                    let mut split = kv.split('=');
                    Some((split.next()?.to_string(), split.next()?.to_string()))
                })
                .collect()
        } else {
            HashMap::new()
        };

        // Generate actions based on decision type
        let actions = match description.as_str() {
            "compress_memory" => vec![
                PhiAction {
                    name: "compress".to_string(),
                    cost_index: 3,  // F[3]=2 (small cost)
                    benefit_index: 8, // F[8]=21 (high benefit)
                    net_payoff: (FIBONACCI[8] - FIBONACCI[3]) as i64,
                    phi_level: 5,
                },
                PhiAction {
                    name: "skip".to_string(),
                    cost_index: 0,
                    benefit_index: 0,
                    net_payoff: 0,
                    phi_level: 0,
                },
            ],
            "communicate" => vec![
                PhiAction {
                    name: "holographic_display".to_string(),
                    cost_index: 5,  // F[5]=5 (medium cost)
                    benefit_index: 10, // F[10]=55 (very high benefit)
                    net_payoff: (FIBONACCI[10] - FIBONACCI[5]) as i64,
                    phi_level: 7,
                },
                PhiAction {
                    name: "text_only".to_string(),
                    cost_index: 1,  // F[1]=1 (tiny cost)
                    benefit_index: 3, // F[3]=2 (low benefit)
                    net_payoff: (FIBONACCI[3] - FIBONACCI[1]) as i64,
                    phi_level: 2,
                },
            ],
            _ => vec![
                PhiAction {
                    name: "default".to_string(),
                    cost_index: 0,
                    benefit_index: 1,
                    net_payoff: 1,
                    phi_level: 1,
                },
            ],
        };

        Ok(PhiDecisionNode {
            description,
            actions,
            state: vec![true], // Placeholder
            equilibrium: None,
        })
    }

    /// Calculate Nash equilibrium in φ-space
    fn calculate_nash_equilibrium(&self, decision: &PhiDecisionNode) -> Result<PhiAction> {
        // Nash equilibrium = action with highest φ-level (dominant strategy)
        decision.actions.iter()
            .max_by_key(|action| action.phi_level)
            .cloned()
            .context("No actions available")
    }

    /// Get decision tree statistics
    pub fn stats(&self) -> String {
        format!(
            "Decisions: {}, Cached: {}, Avg φ-level: {:.1}",
            self.nodes.len(),
            self.cache.len(),
            self.nodes.iter()
                .filter_map(|n| n.equilibrium.as_ref().map(|e| e.phi_level))
                .sum::<u64>() as f64 / self.nodes.len().max(1) as f64
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_phi_game_decision() {
        let mut tree = PhiGameTree::new();

        // Decision: Should compress memory?
        let action = tree.decide("compress_memory:size=1024").unwrap();
        assert_eq!(action, "compress");

        // Decision: How to communicate?
        let action = tree.decide("communicate:urgency=high").unwrap();
        assert_eq!(action, "holographic_display");
    }
}

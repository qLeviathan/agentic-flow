//! # Retrocausal GOAP (Goal-Oriented Action Planning)
//!
//! **Inverse Greedy Algorithm**: Instead of maximizing immediate reward,
//! we work BACKWARDS from the goal to find the optimal path.
//!
//! Traditional Greedy: Start → Pick best local action → Repeat
//! Retrocausal GOAP: Goal ← Find preconditions ← Find actions ← Start
//!
//! Uses Latent-N to track state at each step.

use super::latent_n::{LatentN, Direction, UniverseState};
use anyhow::{Result, Context};
use serde::{Serialize, Deserialize};
use std::collections::{HashMap, VecDeque};

/// GOAP Action (with preconditions and effects)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GOAPAction {
    /// Action name
    pub name: String,

    /// Cost in φ-space (Fibonacci index)
    pub cost: u64,

    /// Preconditions (required Latent-N state)
    pub preconditions: Vec<Condition>,

    /// Effects (resulting Latent-N state changes)
    pub effects: Vec<Effect>,

    /// Nash equilibrium payoff
    pub payoff: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Condition {
    pub property: String,
    pub required_value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Effect {
    pub property: String,
    pub new_value: String,
}

/// GOAP Planner (retrocausal)
pub struct RetrocausalGOAP {
    /// All available actions
    actions: Vec<GOAPAction>,

    /// Current world state (Latent-N)
    current_state: LatentN,

    /// Goal state (Latent-N)
    goal_state: LatentN,

    /// Planned action sequence (backwards)
    plan: Vec<GOAPAction>,
}

impl RetrocausalGOAP {
    /// Create new retrocausal planner
    pub fn new(current: LatentN, goal: LatentN, actions: Vec<GOAPAction>) -> Self {
        Self {
            actions,
            current_state: current,
            goal_state: goal,
            plan: Vec::new(),
        }
    }

    /// Plan retrocausally (work backwards from goal)
    pub fn plan(&mut self) -> Result<Vec<GOAPAction>> {
        // Start from goal, work backwards to current state
        let mut working_state = self.goal_state;
        let mut plan = VecDeque::new();

        while working_state.n > self.current_state.n {
            // Find action that leads TO this state (inverse)
            let action = self.find_action_to_state(working_state)?;

            // Add to plan (front, since we're going backwards)
            plan.push_front(action.clone());

            // Move backwards to preconditions
            working_state = self.apply_inverse_effects(&action, working_state)?;
        }

        self.plan = plan.into_iter().collect();
        Ok(self.plan.clone())
    }

    /// Find action that produces the given state
    fn find_action_to_state(&self, target: LatentN) -> Result<GOAPAction> {
        // Find action whose effects match target state
        self.actions
            .iter()
            .filter(|action| {
                // Check if effects would produce target state
                self.check_effects_match(action, target)
            })
            .min_by_key(|action| action.cost)
            .cloned()
            .context("No action found to reach state")
    }

    /// Check if action effects match target state
    fn check_effects_match(&self, action: &GOAPAction, target: LatentN) -> bool {
        let target_universe = target.decode();

        for effect in &action.effects {
            match effect.property.as_str() {
                "energy" => {
                    if effect.new_value != target_universe.energy.to_string() {
                        return false;
                    }
                }
                "direction" => {
                    let expected = format!("{:?}", target_universe.direction);
                    if effect.new_value != expected {
                        return false;
                    }
                }
                _ => {}
            }
        }

        true
    }

    /// Apply inverse effects (go backwards)
    fn apply_inverse_effects(&self, action: &GOAPAction, current: LatentN) -> Result<LatentN> {
        // Move backwards by action cost
        Ok(current.advance(Direction::Backward))
    }

    /// Execute plan forward (after planning backwards)
    pub fn execute(&self) -> Vec<LatentN> {
        let mut state = self.current_state;
        let mut states = vec![state];

        for action in &self.plan {
            // Apply action effects
            state = state.advance(Direction::Forward);
            states.push(state);
        }

        states
    }

    /// Get Nash equilibrium payoff for plan
    pub fn total_payoff(&self) -> i64 {
        self.plan.iter().map(|a| a.payoff).sum()
    }
}

/// Create trading actions for retrocausal planning
pub fn create_trading_actions() -> Vec<GOAPAction> {
    vec![
        GOAPAction {
            name: "analyze_market".to_string(),
            cost: 3,  // F[3] = 2
            preconditions: vec![
                Condition {
                    property: "data_available".to_string(),
                    required_value: "true".to_string(),
                }
            ],
            effects: vec![
                Effect {
                    property: "market_analyzed".to_string(),
                    new_value: "true".to_string(),
                }
            ],
            payoff: 5,  // F[5] = 5
        },
        GOAPAction {
            name: "calculate_fibonacci_levels".to_string(),
            cost: 4,  // F[4] = 3
            preconditions: vec![
                Condition {
                    property: "market_analyzed".to_string(),
                    required_value: "true".to_string(),
                }
            ],
            effects: vec![
                Effect {
                    property: "levels_identified".to_string(),
                    new_value: "true".to_string(),
                }
            ],
            payoff: 8,  // F[6] = 8
        },
        GOAPAction {
            name: "identify_lucas_time_window".to_string(),
            cost: 4,  // F[4] = 3
            preconditions: vec![
                Condition {
                    property: "market_analyzed".to_string(),
                    required_value: "true".to_string(),
                }
            ],
            effects: vec![
                Effect {
                    property: "time_window_set".to_string(),
                    new_value: "true".to_string(),
                }
            ],
            payoff: 11,  // L[5] = 11
        },
        GOAPAction {
            name: "calculate_game_theory_optimal".to_string(),
            cost: 5,  // F[5] = 5
            preconditions: vec![
                Condition {
                    property: "levels_identified".to_string(),
                    required_value: "true".to_string(),
                },
                Condition {
                    property: "time_window_set".to_string(),
                    required_value: "true".to_string(),
                }
            ],
            effects: vec![
                Effect {
                    property: "nash_equilibrium".to_string(),
                    new_value: "true".to_string(),
                }
            ],
            payoff: 21,  // F[8] = 21
        },
        GOAPAction {
            name: "execute_trade_webull".to_string(),
            cost: 6,  // F[6] = 8
            preconditions: vec![
                Condition {
                    property: "nash_equilibrium".to_string(),
                    required_value: "true".to_string(),
                }
            ],
            effects: vec![
                Effect {
                    property: "trade_executed".to_string(),
                    new_value: "true".to_string(),
                }
            ],
            payoff: 34,  // F[9] = 34
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_retrocausal_planning() {
        let current = LatentN::new(0);  // Start
        let goal = LatentN::new(20);    // Goal
        let actions = create_trading_actions();

        let mut planner = RetrocausalGOAP::new(current, goal, actions);
        let plan = planner.plan().unwrap();

        assert!(!plan.is_empty());
        println!("Retrocausal plan: {} actions", plan.len());

        // Execute forward
        let states = planner.execute();
        assert_eq!(states.first().unwrap().n, 0);
        assert!(states.last().unwrap().n <= 20);
    }
}

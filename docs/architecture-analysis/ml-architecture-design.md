# Actor-Critic ML Architecture for Phase-Space Optimization

**Version:** 1.0.0
**Date:** 2025-11-19
**Status:** Design Document

## Executive Summary

This document specifies a complete Actor-Critic reinforcement learning system for optimizing phase-space trajectory exploration. The system learns to efficiently find Nash equilibrium points, optimize convergence rates, and minimize chaotic behavior in the Level 6 phase-space coordinate system.

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  Phase-Space Environment                     │
│  ┌────────────────────────────────────────────────────┐    │
│  │  State: (n, φ(n), ψ(n), θ(n), r(n), velocity,     │    │
│  │          acceleration, history)                     │    │
│  └────────────────────────────────────────────────────┘    │
│                           ↓                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │              State Preprocessor                     │    │
│  │  • Normalization • Feature extraction              │    │
│  │  • History encoding • Context embedding            │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌──────────────────┴──────────────────┐
        ↓                                      ↓
┌──────────────────┐                  ┌──────────────────┐
│  Actor Network   │                  │  Critic Network  │
│  π(a|s; θ_π)     │                  │  V(s; θ_v)       │
│                  │                  │                  │
│  Input: State    │                  │  Input: State    │
│  Output: Action  │                  │  Output: Value   │
│  Distribution    │                  │  Estimate        │
└──────────────────┘                  └──────────────────┘
        ↓                                      ↓
        └──────────────────┬──────────────────┘
                           ↓
                 ┌──────────────────┐
                 │  AgentDB Storage │
                 │  • Episodes      │
                 │  • Reflexion     │
                 │  • Causal Edges  │
                 └──────────────────┘
                           ↓
                 ┌──────────────────┐
                 │ Experience Replay│
                 │  & Learning      │
                 └──────────────────┘
```

## 2. Network Architectures

### 2.1 Actor Network (Policy Network)

**Purpose:** Learns a policy π(a|s) that selects optimal actions for phase-space exploration.

**Architecture:**

```typescript
Input Layer: State vector [n, φ, ψ, θ, r, v_φ, v_ψ, a_φ, a_ψ, history_features]
    ↓ (dimension: 64)
Dense Layer 1: 256 neurons + LayerNorm + ReLU + Dropout(0.2)
    ↓
Dense Layer 2: 512 neurons + LayerNorm + ReLU + Dropout(0.2)
    ↓
Dense Layer 3: 256 neurons + LayerNorm + ReLU + Dropout(0.2)
    ↓
Branching Outputs:
├─ Action Mean: Dense(action_dim) + Tanh
└─ Action Std: Dense(action_dim) + Softplus + Clamp(min=0.01, max=1.0)
```

**Layer Specifications:**
- **Input Dimension:** Variable (based on state representation)
- **Hidden Layers:** [256, 512, 256] neurons
- **Activation:** ReLU for hidden layers, Tanh for mean, Softplus for std
- **Normalization:** Layer Normalization after each hidden layer
- **Regularization:** Dropout (p=0.2)
- **Output:** Gaussian distribution parameters (mean, std)

**Loss Function:**
```
L_actor = -E[log π(a|s) * A(s,a) - α * H(π(·|s))]

Where:
- A(s,a) = advantage estimate from critic
- α = entropy coefficient (0.01)
- H(π) = entropy bonus for exploration
```

### 2.2 Critic Network (Value Network)

**Purpose:** Estimates V(s), the expected cumulative reward from state s.

**Architecture:**

```typescript
Input Layer: State vector [n, φ, ψ, θ, r, v_φ, v_ψ, a_φ, a_ψ, history_features]
    ↓ (dimension: 64)
Dense Layer 1: 512 neurons + LayerNorm + ReLU + Dropout(0.2)
    ↓
Dense Layer 2: 512 neurons + LayerNorm + ReLU + Dropout(0.2)
    ↓
Dense Layer 3: 256 neurons + LayerNorm + ReLU + Dropout(0.1)
    ↓
Value Head: Dense(1) [no activation]
```

**Layer Specifications:**
- **Input Dimension:** Same as Actor
- **Hidden Layers:** [512, 512, 256] neurons
- **Activation:** ReLU for hidden layers, Linear for output
- **Normalization:** Layer Normalization
- **Regularization:** Dropout (p=0.2 → 0.1)
- **Output:** Scalar value V(s)

**Loss Function:**
```
L_critic = MSE(V(s), R_target)

Where:
R_target = r + γ * V(s') (TD target)
γ = discount factor (0.99)
```

## 3. State Representation

### 3.1 Raw State Components

```typescript
interface RawState {
  // Current position
  n: number;                    // Current integer in sequence
  phi: number;                  // φ(n) coordinate
  psi: number;                  // ψ(n) coordinate
  theta: number;                // Phase angle θ(n)
  magnitude: number;            // Magnitude r(n)

  // Dynamics
  velocity: {
    phi: number;                // dφ/dn
    psi: number;                // dψ/dn
  };
  acceleration: {
    phi: number;                // d²φ/dn²
    psi: number;                // d²ψ/dn²
  };

  // Context
  maxZeros: number;             // Number of zeta zeros used
  stepSize: number;             // Current step size
  isNashPoint: boolean;         // Nash point indicator
}
```

### 3.2 Engineered Features

```typescript
interface EngineeredFeatures {
  // Normalized coordinates
  n_norm: number;               // n / n_max
  phi_norm: number;             // (φ - φ_min) / (φ_max - φ_min)
  psi_norm: number;             // (ψ - ψ_min) / (ψ_max - ψ_min)

  // Velocity magnitude and direction
  v_magnitude: number;          // √(v_φ² + v_ψ²)
  v_angle: number;              // atan2(v_ψ, v_φ)

  // Acceleration features
  a_magnitude: number;          // √(a_φ² + a_ψ²)
  a_angle: number;              // atan2(a_ψ, a_φ)

  // Trajectory characteristics
  curvature: number;            // Rate of angle change
  jerk: number;                 // Rate of acceleration change

  // Historical context (last k steps)
  phi_trend: number[];          // Moving average of φ
  psi_trend: number[];          // Moving average of ψ
  nash_density: number;         // Nash points found / steps taken

  // Exploration metrics
  coverage: number;             // Area explored in phase space
  repetition_score: number;     // Measure of revisiting states
}
```

### 3.3 Final State Vector

**Dimension:** 64 features

```
[n_norm, phi_norm, psi_norm, theta, magnitude,
 v_phi, v_psi, v_magnitude, v_angle,
 a_phi, a_psi, a_magnitude, a_angle,
 curvature, jerk,
 phi_trend_5, psi_trend_5, nash_density,
 coverage, repetition_score,
 stepSize_norm, maxZeros_norm,
 ... (additional contextual features) ...
 history_embedding[32]]  // LSTM-encoded trajectory history
```

## 4. Action Space Design

### 4.1 Continuous Actions

**Action Vector:** 4-dimensional continuous space

```typescript
interface Action {
  delta_n: number;              // Step size adjustment [-1, 1] → [0.1, 2.0]
  delta_maxZeros: number;       // Zero count adjustment [-1, 1] → [-10, 10]
  exploration_weight: number;   // Exploration vs exploitation [0, 1]
  search_direction: number;     // Angle in phase space [0, 2π]
}
```

**Action Transformation:**
```typescript
// From network output [-1, 1] to actual parameter space
actual_step = 0.1 + (delta_n + 1) * 0.95  // Maps to [0.1, 2.0]
actual_zeros = current_zeros + round(delta_maxZeros * 10)  // ±10 zeros
exploration = sigmoid(exploration_weight)  // [0, 1]
direction = (search_direction + 1) * π  // [0, 2π]
```

### 4.2 Action Constraints

- **Step Size:** [0.1, 2.0] - ensures reasonable granularity
- **Max Zeros:** [10, 100] - uses available Riemann zeros
- **Exploration Weight:** [0, 1] - balances exploration/exploitation
- **Search Direction:** [0, 2π] - full phase space coverage

## 5. Reward Function Engineering

### 5.1 Multi-Objective Reward

```typescript
R_total = w₁·R_nash + w₂·R_convergence + w₃·R_exploration - w₄·R_penalty

Where:
  w₁ = 1.0   (Nash discovery weight)
  w₂ = 0.5   (Convergence weight)
  w₃ = 0.3   (Exploration weight)
  w₄ = 0.2   (Penalty weight)
```

### 5.2 Reward Components

**R_nash (Nash Point Discovery):**
```typescript
R_nash = {
  +10.0  if new Nash point found
  +2.0   if close to Nash point (|S(n)| < 0.1)
  0.0    otherwise
} * (1 + stability_bonus)

stability_bonus = stability_index * 0.5  // Reward stable Nash points more
```

**R_convergence (Trajectory Quality):**
```typescript
R_convergence = -chaos_indicator + 0.5 * (1 / (1 + lyapunov_exponent))

// Penalize chaotic behavior, reward convergent trajectories
```

**R_exploration (Coverage Reward):**
```typescript
R_exploration = {
  new_area_explored / total_area * 5.0  if exploring new regions
  -0.1  if revisiting same region repeatedly
}
```

**R_penalty (Efficiency Penalties):**
```typescript
R_penalty = {
  0.01 * steps_taken  // Small time penalty
  + 0.5 * (out_of_bounds ? 1 : 0)  // Out of valid range
  + 0.2 * (computation_time / max_time)  // Resource usage
}
```

### 5.3 Sparse vs Dense Rewards

**Strategy:** Use shaped rewards for faster learning

```typescript
// Dense intermediate rewards every step
R_step = R_convergence + R_exploration - R_penalty

// Sparse milestone rewards
R_milestone = R_nash  // Only when significant events occur
```

## 6. AgentDB Integration

### 6.1 Schema Design

**Episodes Table:**
```sql
CREATE TABLE IF NOT EXISTS phase_space_episodes (
  episode_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,

  -- Initial state
  start_n INTEGER NOT NULL,
  start_phi REAL NOT NULL,
  start_psi REAL NOT NULL,

  -- Episode statistics
  total_steps INTEGER NOT NULL,
  total_reward REAL NOT NULL,
  nash_points_found INTEGER NOT NULL,
  final_chaos_indicator REAL NOT NULL,

  -- Terminal state
  end_n INTEGER NOT NULL,
  end_phi REAL NOT NULL,
  end_psi REAL NOT NULL,

  -- Metadata
  success BOOLEAN NOT NULL,
  latency_ms INTEGER,
  metadata_json TEXT
);

CREATE INDEX idx_episodes_session ON phase_space_episodes(session_id);
CREATE INDEX idx_episodes_reward ON phase_space_episodes(total_reward DESC);
```

**Reflexion Table (Experience Replay):**
```sql
CREATE TABLE IF NOT EXISTS phase_space_reflexion (
  step_id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,

  -- SARS' tuple
  state_vector TEXT NOT NULL,      -- JSON serialized state
  action_vector TEXT NOT NULL,     -- JSON serialized action
  reward REAL NOT NULL,
  next_state_vector TEXT,          -- JSON serialized next state
  done BOOLEAN NOT NULL,

  -- Learning signals
  advantage REAL,
  td_error REAL,
  value_estimate REAL,

  -- Metadata
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (episode_id) REFERENCES phase_space_episodes(episode_id)
);

CREATE INDEX idx_reflexion_episode ON phase_space_reflexion(episode_id);
CREATE INDEX idx_reflexion_advantage ON phase_space_reflexion(advantage DESC);
```

**Causal Edges Table (State Transitions):**
```sql
CREATE TABLE IF NOT EXISTS phase_space_causal_edges (
  edge_id TEXT PRIMARY KEY,
  from_step_id TEXT NOT NULL,
  to_step_id TEXT NOT NULL,

  -- Transition characteristics
  nash_point_reached BOOLEAN NOT NULL,
  chaos_change REAL NOT NULL,
  convergence_improvement REAL NOT NULL,

  -- Action that caused transition
  action_type TEXT NOT NULL,
  action_magnitude REAL NOT NULL,

  FOREIGN KEY (from_step_id) REFERENCES phase_space_reflexion(step_id),
  FOREIGN KEY (to_step_id) REFERENCES phase_space_reflexion(step_id)
);

CREATE INDEX idx_edges_nash ON phase_space_causal_edges(nash_point_reached);
CREATE INDEX idx_edges_convergence ON phase_space_causal_edges(convergence_improvement DESC);
```

### 6.2 Experience Replay Strategy

**Prioritized Experience Replay (PER):**

```typescript
interface ExperienceBuffer {
  // Priority based on TD-error magnitude
  priority_queue: PriorityQueue<Experience>;

  // Stratified sampling by outcome
  nash_discoveries: Experience[];  // High-value experiences
  convergent_trajectories: Experience[];
  exploratory_moves: Experience[];

  buffer_size: 100000;  // Maximum experiences stored
  batch_size: 256;      // Training batch size
}

// Sampling strategy
sample_batch():
  50% from priority_queue (high TD-error)
  30% from nash_discoveries (successful outcomes)
  20% from exploratory_moves (maintain diversity)
```

### 6.3 Memory Management

**Storage Strategy:**
- Store all episodes for later analysis
- Keep last 100K transitions in reflexion table
- Prune low-priority experiences when buffer is full
- Maintain separate high-value experiences indefinitely

**Retrieval Optimization:**
```typescript
// Indexed queries for fast retrieval
- Get top K experiences by advantage
- Fetch episodes with Nash discoveries
- Query transitions with high convergence
- Sample random batch efficiently
```

## 7. Training Algorithm

### 7.1 Advantage Actor-Critic (A2C) Pseudocode

```python
# Initialization
actor = ActorNetwork(state_dim=64, action_dim=4)
critic = CriticNetwork(state_dim=64)
optimizer_actor = Adam(actor.parameters(), lr=3e-4)
optimizer_critic = Adam(critic.parameters(), lr=1e-3)
replay_buffer = ExperienceReplayBuffer(max_size=100000)

# Training loop
for episode in range(max_episodes):
    state = env.reset()  # Initialize at random n
    episode_buffer = []

    for step in range(max_steps_per_episode):
        # Actor samples action
        action_dist = actor(state)
        action = action_dist.sample()

        # Environment step
        next_state, reward, done, info = env.step(action)

        # Store transition
        episode_buffer.append({
            'state': state,
            'action': action,
            'reward': reward,
            'next_state': next_state,
            'done': done
        })

        state = next_state

        if done:
            break

    # Store episode in AgentDB
    store_episode_in_agentdb(episode_buffer)

    # Add to replay buffer
    replay_buffer.add_episode(episode_buffer)

    # Training updates (every N episodes)
    if episode % update_frequency == 0:
        # Sample batch from replay buffer
        batch = replay_buffer.sample_batch(batch_size=256)

        # Compute targets and advantages
        with torch.no_grad():
            values = critic(batch['states'])
            next_values = critic(batch['next_states'])
            td_targets = batch['rewards'] + gamma * next_values * (1 - batch['done'])
            advantages = td_targets - values

        # Update critic
        value_pred = critic(batch['states'])
        critic_loss = mse_loss(value_pred, td_targets)

        optimizer_critic.zero_grad()
        critic_loss.backward()
        clip_grad_norm_(critic.parameters(), max_norm=0.5)
        optimizer_critic.step()

        # Update actor
        action_dist = actor(batch['states'])
        log_probs = action_dist.log_prob(batch['actions'])
        entropy = action_dist.entropy().mean()

        actor_loss = -(log_probs * advantages).mean() - entropy_coef * entropy

        optimizer_actor.zero_grad()
        actor_loss.backward()
        clip_grad_norm_(actor.parameters(), max_norm=0.5)
        optimizer_actor.step()

        # Log metrics to AgentDB
        log_training_metrics({
            'episode': episode,
            'critic_loss': critic_loss.item(),
            'actor_loss': actor_loss.item(),
            'avg_reward': batch['rewards'].mean(),
            'entropy': entropy.item()
        })
```

### 7.2 Hyperparameters

```typescript
const HYPERPARAMETERS = {
  // Network
  state_dim: 64,
  action_dim: 4,
  hidden_dims_actor: [256, 512, 256],
  hidden_dims_critic: [512, 512, 256],

  // Learning
  learning_rate_actor: 3e-4,
  learning_rate_critic: 1e-3,
  gamma: 0.99,              // Discount factor
  lambda_gae: 0.95,         // GAE parameter
  entropy_coef: 0.01,       // Entropy bonus

  // Training
  max_episodes: 10000,
  max_steps_per_episode: 500,
  update_frequency: 4,      // Update every N episodes
  batch_size: 256,

  // Experience Replay
  buffer_size: 100000,
  prioritized_replay_alpha: 0.6,
  prioritized_replay_beta: 0.4,

  // Exploration
  initial_exploration_noise: 0.3,
  final_exploration_noise: 0.05,
  exploration_decay_steps: 5000,

  // Regularization
  dropout_rate: 0.2,
  gradient_clip_norm: 0.5,
  weight_decay: 1e-5
};
```

### 7.3 Curriculum Learning

**Phase 1: Simple Exploration (Episodes 0-2000)**
- Reward heavily weighted toward exploration
- Large step sizes allowed
- Goal: Learn basic phase-space navigation

**Phase 2: Nash Discovery (Episodes 2000-5000)**
- Increase R_nash weight
- Reduce exploration noise
- Goal: Learn to identify and reach Nash points

**Phase 3: Optimization (Episodes 5000-10000)**
- Focus on convergence and efficiency
- Fine-tune policy for optimal trajectories
- Goal: Minimize chaos, maximize stability

## 8. Evaluation Metrics

### 8.1 Learning Performance Metrics

```typescript
interface LearningMetrics {
  // Episode-level
  avg_reward_per_episode: number;
  nash_points_per_episode: number;
  steps_per_episode: number;
  success_rate: number;           // % episodes reaching goal

  // Trajectory quality
  avg_chaos_indicator: number;
  avg_lyapunov_exponent: number;
  avg_convergence_rate: number;

  // Efficiency
  nash_discovery_rate: number;    // Nash points / step
  computation_time_per_step: number;
  coverage_efficiency: number;    // Area explored / steps

  // Learning progress
  critic_loss: number;
  actor_loss: number;
  entropy: number;
  td_error: number;
}
```

### 8.2 Benchmark Tasks

**Task 1: Nash Point Discovery**
- Goal: Find N Nash points in range [1, 1000]
- Success: Find ≥80% of ground truth Nash points
- Metric: Discovery rate, false positive rate

**Task 2: Convergent Trajectory**
- Goal: Generate trajectory with chaos_indicator < 0.5
- Success: Lyapunov exponent < 0.1
- Metric: Trajectory stability score

**Task 3: Efficient Exploration**
- Goal: Cover maximum phase-space area in 200 steps
- Success: Coverage > 70% of reachable space
- Metric: Coverage efficiency ratio

**Task 4: Transfer Learning**
- Goal: Apply learned policy to different n-ranges
- Success: Performance degradation < 20%
- Metric: Cross-range generalization score

### 8.3 Comparative Baselines

```typescript
const BASELINES = {
  random_policy: {
    description: "Random action selection",
    expected_score: 0.2
  },

  greedy_local: {
    description: "Greedy local search",
    expected_score: 0.5
  },

  heuristic_policy: {
    description: "Hand-crafted rules",
    expected_score: 0.7
  },

  actor_critic: {
    description: "Proposed A2C method",
    target_score: 0.85
  }
};
```

## 9. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Implement state representation and preprocessing
- [ ] Create phase-space environment wrapper
- [ ] Set up AgentDB schema for ML integration
- [ ] Develop reward function

### Phase 2: Network Implementation (Weeks 3-4)
- [ ] Build Actor network with PyTorch/TensorFlow
- [ ] Build Critic network
- [ ] Implement action sampling and transformation
- [ ] Create training loop infrastructure

### Phase 3: Experience Replay (Week 5)
- [ ] Implement prioritized experience replay
- [ ] Connect to AgentDB storage
- [ ] Build efficient batch sampling

### Phase 4: Training (Weeks 6-8)
- [ ] Train on simple exploration tasks
- [ ] Implement curriculum learning
- [ ] Tune hyperparameters
- [ ] Evaluate on benchmark tasks

### Phase 5: Optimization (Weeks 9-10)
- [ ] Profile and optimize performance
- [ ] Implement transfer learning
- [ ] Add visualization tools
- [ ] Document results and insights

### Phase 6: Production (Weeks 11-12)
- [ ] Create inference API
- [ ] Build monitoring dashboard
- [ ] Write user documentation
- [ ] Deploy trained models

## 10. Performance Targets

### Minimum Viable Performance (MVP)
- Nash discovery rate: >60% of ground truth
- Convergence success: >50% of episodes
- Training time: <24 hours on single GPU
- Inference time: <100ms per action

### Target Performance
- Nash discovery rate: >80% of ground truth
- Convergence success: >70% of episodes
- Training time: <12 hours on single GPU
- Inference time: <50ms per action

### Stretch Goals
- Nash discovery rate: >90% with <5% false positives
- Convergence success: >85% of episodes
- Transfer learning: <15% performance drop across domains
- Real-time optimization: <10ms per action

## 11. Risk Analysis and Mitigation

### Technical Risks

**Risk 1: High-dimensional state space**
- Mitigation: Use dimensionality reduction (PCA/autoencoders)
- Mitigation: Careful feature engineering
- Fallback: Simplify state representation

**Risk 2: Sparse rewards (Nash points are rare)**
- Mitigation: Dense intermediate rewards
- Mitigation: Curriculum learning
- Fallback: Imitation learning from expert trajectories

**Risk 3: Non-stationary dynamics**
- Mitigation: Adaptive learning rates
- Mitigation: Periodic retraining
- Fallback: Ensemble of policies

**Risk 4: Computational cost**
- Mitigation: Batch processing
- Mitigation: Model quantization
- Fallback: Smaller network architectures

## 12. Future Extensions

### Multi-Agent Coordination
- Multiple agents exploring different regions simultaneously
- Shared experience pool for faster learning
- Competitive/cooperative training regimes

### Meta-Learning
- Learn to learn: adapt quickly to new n-ranges
- Few-shot learning for rare Nash point patterns
- Automated hyperparameter tuning

### Hierarchical RL
- High-level policy: strategic planning (which regions to explore)
- Low-level policy: tactical execution (how to navigate)
- Temporal abstraction for long-horizon planning

### Neural Architecture Search
- Automatically discover optimal network architectures
- Task-specific architecture adaptation
- Resource-constrained architecture optimization

## 13. References

### Reinforcement Learning
- Sutton & Barto (2018): Reinforcement Learning: An Introduction
- Schulman et al. (2017): Proximal Policy Optimization (PPO)
- Mnih et al. (2016): Asynchronous Advantage Actor-Critic (A3C)

### Phase-Space Theory
- Devaney (2003): An Introduction to Chaotic Dynamical Systems
- Strogatz (2015): Nonlinear Dynamics and Chaos

### Neural Network Optimization
- Kingma & Ba (2015): Adam Optimizer
- Ioffe & Szegedy (2015): Batch Normalization

---

**Document Status:** Ready for Implementation
**Next Steps:** Begin Phase 1 implementation with state representation and environment setup.

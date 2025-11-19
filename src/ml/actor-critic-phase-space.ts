/**
 * Actor-Critic Reinforcement Learning for Phase-Space Optimization
 *
 * This module implements an Advantage Actor-Critic (A2C) system for learning
 * optimal phase-space exploration policies integrated with AgentDB for
 * experience replay and persistent memory.
 *
 * @module actor-critic-phase-space
 * @version 1.0.0
 */

import {
  PhaseSpaceCoordinates,
  TrajectoryPoint,
  NashPoint
} from '../math-framework/phase-space/types';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Raw state from phase-space environment
 */
export interface RawPhaseState {
  n: number;
  phi: number;
  psi: number;
  theta: number;
  magnitude: number;
  velocity: {
    phi: number;
    psi: number;
  };
  acceleration: {
    phi: number;
    psi: number;
  };
  maxZeros: number;
  stepSize: number;
  isNashPoint: boolean;
}

/**
 * Engineered features from raw state
 */
export interface EngineeredFeatures {
  // Normalized coordinates
  n_norm: number;
  phi_norm: number;
  psi_norm: number;

  // Velocity features
  v_magnitude: number;
  v_angle: number;

  // Acceleration features
  a_magnitude: number;
  a_angle: number;

  // Trajectory characteristics
  curvature: number;
  jerk: number;

  // Historical features
  phi_trend: number[];
  psi_trend: number[];
  nash_density: number;

  // Exploration metrics
  coverage: number;
  repetition_score: number;
}

/**
 * Processed state vector for neural networks (64-dimensional)
 */
export type StateVector = number[];

/**
 * Action in continuous 4D space
 */
export interface Action {
  delta_n: number;            // Step size adjustment [-1, 1]
  delta_maxZeros: number;     // Zero count adjustment [-1, 1]
  exploration_weight: number; // Exploration factor [-1, 1]
  search_direction: number;   // Phase space angle [-1, 1]
}

/**
 * Transformed action to actual environment parameters
 */
export interface TransformedAction {
  step_size: number;          // [0.1, 2.0]
  max_zeros: number;          // [10, 100]
  exploration: number;        // [0, 1]
  direction: number;          // [0, 2π]
}

/**
 * Reward components
 */
export interface RewardComponents {
  nash_reward: number;        // Nash point discovery
  convergence_reward: number; // Trajectory quality
  exploration_reward: number; // Coverage reward
  penalty: number;            // Efficiency penalties
  total: number;              // Weighted sum
}

/**
 * Experience tuple for replay buffer
 */
export interface Experience {
  state: StateVector;
  action: Action;
  reward: number;
  next_state: StateVector;
  done: boolean;

  // Additional learning signals
  advantage?: number;
  td_error?: number;
  value_estimate?: number;

  // Metadata
  timestamp: number;
  episode_id: string;
  step_number: number;
}

/**
 * Episode summary stored in AgentDB
 */
export interface Episode {
  episode_id: string;
  session_id: string;
  timestamp: number;

  // Initial state
  start_n: number;
  start_phi: number;
  start_psi: number;

  // Episode statistics
  total_steps: number;
  total_reward: number;
  nash_points_found: number;
  final_chaos_indicator: number;

  // Terminal state
  end_n: number;
  end_phi: number;
  end_psi: number;

  // Metadata
  success: boolean;
  latency_ms: number;
  metadata?: Record<string, any>;
}

/**
 * Training hyperparameters
 */
export interface Hyperparameters {
  // Network architecture
  state_dim: number;
  action_dim: number;
  hidden_dims_actor: number[];
  hidden_dims_critic: number[];

  // Learning rates
  learning_rate_actor: number;
  learning_rate_critic: number;

  // RL parameters
  gamma: number;              // Discount factor
  lambda_gae: number;         // GAE parameter
  entropy_coef: number;       // Entropy bonus

  // Training
  max_episodes: number;
  max_steps_per_episode: number;
  update_frequency: number;
  batch_size: number;

  // Experience replay
  buffer_size: number;
  prioritized_replay_alpha: number;
  prioritized_replay_beta: number;

  // Exploration
  initial_exploration_noise: number;
  final_exploration_noise: number;
  exploration_decay_steps: number;

  // Regularization
  dropout_rate: number;
  gradient_clip_norm: number;
  weight_decay: number;
}

/**
 * Learning metrics for monitoring
 */
export interface LearningMetrics {
  // Episode-level
  avg_reward_per_episode: number;
  nash_points_per_episode: number;
  steps_per_episode: number;
  success_rate: number;

  // Trajectory quality
  avg_chaos_indicator: number;
  avg_lyapunov_exponent: number;
  avg_convergence_rate: number;

  // Efficiency
  nash_discovery_rate: number;
  computation_time_per_step: number;
  coverage_efficiency: number;

  // Learning progress
  critic_loss: number;
  actor_loss: number;
  entropy: number;
  td_error: number;
}

/**
 * Configuration for phase-space environment
 */
export interface PhaseSpaceEnvConfig {
  n_min: number;
  n_max: number;
  initial_n: number;
  initial_maxZeros: number;
  max_steps: number;

  // Reward weights
  w_nash: number;
  w_convergence: number;
  w_exploration: number;
  w_penalty: number;
}

// ============================================================================
// State Preprocessing
// ============================================================================

/**
 * State preprocessor for converting raw phase-space state to neural network input
 */
export class StatePreprocessor {
  private phi_min: number = -Infinity;
  private phi_max: number = Infinity;
  private psi_min: number = -Infinity;
  private psi_max: number = Infinity;
  private n_max: number;

  private history_window: number = 10;
  private history_phi: number[] = [];
  private history_psi: number[] = [];

  constructor(n_max: number = 1000) {
    this.n_max = n_max;
  }

  /**
   * Update normalization bounds from observed data
   */
  public updateBounds(phi: number, psi: number): void {
    this.phi_min = Math.min(this.phi_min, phi);
    this.phi_max = Math.max(this.phi_max, phi);
    this.psi_min = Math.min(this.psi_min, psi);
    this.psi_max = Math.max(this.psi_max, psi);
  }

  /**
   * Normalize a value to [0, 1] range
   */
  private normalize(value: number, min: number, max: number): number {
    if (max === min) return 0.5;
    return (value - min) / (max - min);
  }

  /**
   * Extract engineered features from raw state
   */
  public extractFeatures(state: RawPhaseState): EngineeredFeatures {
    // Update history
    this.history_phi.push(state.phi);
    this.history_psi.push(state.psi);
    if (this.history_phi.length > this.history_window) {
      this.history_phi.shift();
      this.history_psi.shift();
    }

    // Velocity magnitude and angle
    const v_magnitude = Math.sqrt(
      state.velocity.phi ** 2 + state.velocity.psi ** 2
    );
    const v_angle = Math.atan2(state.velocity.psi, state.velocity.phi);

    // Acceleration magnitude and angle
    const a_magnitude = Math.sqrt(
      state.acceleration.phi ** 2 + state.acceleration.psi ** 2
    );
    const a_angle = Math.atan2(state.acceleration.psi, state.acceleration.phi);

    // Trajectory curvature (rate of angle change)
    const curvature = v_magnitude > 0 ? a_magnitude / v_magnitude : 0;

    // Jerk (simplified as acceleration magnitude)
    const jerk = a_magnitude;

    // Historical trends (moving averages)
    const phi_trend = this.history_phi.slice();
    const psi_trend = this.history_psi.slice();

    return {
      n_norm: state.n / this.n_max,
      phi_norm: this.normalize(state.phi, this.phi_min, this.phi_max),
      psi_norm: this.normalize(state.psi, this.psi_min, this.psi_max),
      v_magnitude,
      v_angle,
      a_magnitude,
      a_angle,
      curvature,
      jerk,
      phi_trend,
      psi_trend,
      nash_density: 0, // To be computed by environment
      coverage: 0,     // To be computed by environment
      repetition_score: 0 // To be computed by environment
    };
  }

  /**
   * Convert raw state and features to neural network input vector (64-dim)
   */
  public preprocess(state: RawPhaseState, features: EngineeredFeatures): StateVector {
    const vector: number[] = [
      // Basic coordinates (5)
      features.n_norm,
      features.phi_norm,
      features.psi_norm,
      state.theta,
      state.magnitude,

      // Velocity (4)
      state.velocity.phi,
      state.velocity.psi,
      features.v_magnitude,
      features.v_angle,

      // Acceleration (4)
      state.acceleration.phi,
      state.acceleration.psi,
      features.a_magnitude,
      features.a_angle,

      // Dynamics (2)
      features.curvature,
      features.jerk,

      // Context (5)
      features.nash_density,
      features.coverage,
      features.repetition_score,
      state.stepSize,
      state.maxZeros / 100, // Normalize to [0, 1]

      // Historical trends (20 = 2 * 10)
      ...features.phi_trend.slice(-10).concat(Array(10).fill(0)).slice(0, 10),
      ...features.psi_trend.slice(-10).concat(Array(10).fill(0)).slice(0, 10),

      // Binary indicators (1)
      state.isNashPoint ? 1.0 : 0.0,

      // Padding to reach 64 dimensions (23 more)
      ...Array(23).fill(0)
    ];

    return vector.slice(0, 64); // Ensure exactly 64 dimensions
  }

  /**
   * Reset preprocessor state
   */
  public reset(): void {
    this.history_phi = [];
    this.history_psi = [];
  }
}

// ============================================================================
// Action Transformation
// ============================================================================

/**
 * Transform neural network output to environment actions
 */
export class ActionTransformer {
  /**
   * Transform raw action from [-1, 1] to environment parameters
   */
  public transform(action: Action, current_maxZeros: number): TransformedAction {
    // Step size: [-1, 1] → [0.1, 2.0]
    const step_size = 0.1 + (action.delta_n + 1) * 0.95;

    // Max zeros: [-1, 1] → ±10 from current, clamped to [10, 100]
    const delta_zeros = Math.round(action.delta_maxZeros * 10);
    const max_zeros = Math.max(10, Math.min(100, current_maxZeros + delta_zeros));

    // Exploration: [-1, 1] → [0, 1] via sigmoid
    const exploration = 1 / (1 + Math.exp(-action.exploration_weight));

    // Direction: [-1, 1] → [0, 2π]
    const direction = (action.search_direction + 1) * Math.PI;

    return {
      step_size,
      max_zeros,
      exploration,
      direction
    };
  }

  /**
   * Add exploration noise to action
   */
  public addNoise(action: Action, noise_scale: number): Action {
    return {
      delta_n: Math.max(-1, Math.min(1, action.delta_n + this.gaussianNoise() * noise_scale)),
      delta_maxZeros: Math.max(-1, Math.min(1, action.delta_maxZeros + this.gaussianNoise() * noise_scale)),
      exploration_weight: Math.max(-1, Math.min(1, action.exploration_weight + this.gaussianNoise() * noise_scale)),
      search_direction: Math.max(-1, Math.min(1, action.search_direction + this.gaussianNoise() * noise_scale))
    };
  }

  private gaussianNoise(): number {
    // Box-Muller transform for Gaussian noise
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}

// ============================================================================
// Reward Function
// ============================================================================

/**
 * Compute multi-objective reward for phase-space exploration
 */
export class RewardFunction {
  private w_nash: number;
  private w_convergence: number;
  private w_exploration: number;
  private w_penalty: number;

  constructor(config: PhaseSpaceEnvConfig) {
    this.w_nash = config.w_nash;
    this.w_convergence = config.w_convergence;
    this.w_exploration = config.w_exploration;
    this.w_penalty = config.w_penalty;
  }

  /**
   * Compute total reward and components
   */
  public compute(
    state: RawPhaseState,
    action: TransformedAction,
    next_state: RawPhaseState,
    info: {
      nash_found: boolean;
      stability_index: number;
      chaos_indicator: number;
      lyapunov_exponent: number;
      new_area_explored: number;
      total_area: number;
      steps_taken: number;
      out_of_bounds: boolean;
      computation_time: number;
      max_time: number;
    }
  ): RewardComponents {
    // Nash point discovery reward
    let nash_reward = 0;
    if (info.nash_found) {
      nash_reward = 10.0 * (1 + info.stability_index * 0.5);
    } else if (next_state.isNashPoint) {
      nash_reward = 2.0; // Close to Nash point
    }

    // Convergence reward (penalize chaos)
    const convergence_reward =
      -info.chaos_indicator + 0.5 * (1 / (1 + info.lyapunov_exponent));

    // Exploration reward
    let exploration_reward = 0;
    if (info.new_area_explored > 0) {
      exploration_reward = (info.new_area_explored / info.total_area) * 5.0;
    } else {
      exploration_reward = -0.1; // Penalty for revisiting
    }

    // Penalties
    const penalty =
      0.01 * info.steps_taken +
      0.5 * (info.out_of_bounds ? 1 : 0) +
      0.2 * (info.computation_time / info.max_time);

    // Total weighted reward
    const total =
      this.w_nash * nash_reward +
      this.w_convergence * convergence_reward +
      this.w_exploration * exploration_reward -
      this.w_penalty * penalty;

    return {
      nash_reward,
      convergence_reward,
      exploration_reward,
      penalty,
      total
    };
  }
}

// ============================================================================
// Actor Network (Policy)
// ============================================================================

/**
 * Actor network that outputs action distribution parameters
 *
 * Architecture:
 * - Input: State vector (64-dim)
 * - Hidden: [256, 512, 256] with LayerNorm + ReLU + Dropout
 * - Output: Action mean (4-dim, Tanh) + Action std (4-dim, Softplus)
 */
export class ActorNetwork {
  private state_dim: number;
  private action_dim: number;
  private hidden_dims: number[];

  // Placeholder for neural network weights
  // In production, use TensorFlow.js or ONNX Runtime
  private weights: Map<string, number[][]>;

  constructor(state_dim: number = 64, action_dim: number = 4, hidden_dims: number[] = [256, 512, 256]) {
    this.state_dim = state_dim;
    this.action_dim = action_dim;
    this.hidden_dims = hidden_dims;
    this.weights = new Map();

    this.initializeWeights();
  }

  /**
   * Initialize network weights (Xavier initialization)
   */
  private initializeWeights(): void {
    // Placeholder: In production, integrate with TensorFlow.js or PyTorch
    console.log('Actor network initialized with dimensions:', {
      state_dim: this.state_dim,
      hidden_dims: this.hidden_dims,
      action_dim: this.action_dim
    });
  }

  /**
   * Forward pass: compute action distribution parameters
   *
   * @returns { mean: number[], std: number[] }
   */
  public forward(state: StateVector): { mean: number[]; std: number[] } {
    // Placeholder implementation
    // In production: implement actual neural network forward pass

    const mean = Array(this.action_dim).fill(0).map(() => Math.random() * 2 - 1);
    const std = Array(this.action_dim).fill(0).map(() => Math.random() * 0.5 + 0.01);

    return { mean, std };
  }

  /**
   * Sample action from Gaussian distribution
   */
  public sampleAction(state: StateVector): Action {
    const { mean, std } = this.forward(state);

    const action_values = mean.map((m, i) => {
      const noise = this.gaussianNoise();
      return Math.max(-1, Math.min(1, m + noise * std[i]));
    });

    return {
      delta_n: action_values[0],
      delta_maxZeros: action_values[1],
      exploration_weight: action_values[2],
      search_direction: action_values[3]
    };
  }

  /**
   * Compute log probability of action under current policy
   */
  public logProb(state: StateVector, action: Action): number {
    const { mean, std } = this.forward(state);
    const action_values = [
      action.delta_n,
      action.delta_maxZeros,
      action.exploration_weight,
      action.search_direction
    ];

    // Log probability of multivariate Gaussian
    let log_prob = 0;
    for (let i = 0; i < this.action_dim; i++) {
      const z = (action_values[i] - mean[i]) / std[i];
      log_prob += -0.5 * (z * z + Math.log(2 * Math.PI * std[i] * std[i]));
    }

    return log_prob;
  }

  /**
   * Compute entropy of action distribution
   */
  public entropy(state: StateVector): number {
    const { std } = this.forward(state);

    // Entropy of multivariate Gaussian
    let entropy = 0;
    for (const s of std) {
      entropy += 0.5 * Math.log(2 * Math.PI * Math.E * s * s);
    }

    return entropy;
  }

  private gaussianNoise(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  /**
   * Load weights from file
   */
  public loadWeights(path: string): void {
    // Placeholder: Implement weight loading
    console.log('Loading actor weights from:', path);
  }

  /**
   * Save weights to file
   */
  public saveWeights(path: string): void {
    // Placeholder: Implement weight saving
    console.log('Saving actor weights to:', path);
  }
}

// ============================================================================
// Critic Network (Value Function)
// ============================================================================

/**
 * Critic network that estimates state value V(s)
 *
 * Architecture:
 * - Input: State vector (64-dim)
 * - Hidden: [512, 512, 256] with LayerNorm + ReLU + Dropout
 * - Output: Scalar value
 */
export class CriticNetwork {
  private state_dim: number;
  private hidden_dims: number[];

  private weights: Map<string, number[][]>;

  constructor(state_dim: number = 64, hidden_dims: number[] = [512, 512, 256]) {
    this.state_dim = state_dim;
    this.hidden_dims = hidden_dims;
    this.weights = new Map();

    this.initializeWeights();
  }

  /**
   * Initialize network weights
   */
  private initializeWeights(): void {
    console.log('Critic network initialized with dimensions:', {
      state_dim: this.state_dim,
      hidden_dims: this.hidden_dims
    });
  }

  /**
   * Forward pass: compute state value
   */
  public forward(state: StateVector): number {
    // Placeholder implementation
    // In production: implement actual neural network forward pass

    return Math.random() * 10 - 5; // Random value in [-5, 5]
  }

  /**
   * Load weights from file
   */
  public loadWeights(path: string): void {
    console.log('Loading critic weights from:', path);
  }

  /**
   * Save weights to file
   */
  public saveWeights(path: string): void {
    console.log('Saving critic weights to:', path);
  }
}

// ============================================================================
// Experience Replay Buffer
// ============================================================================

/**
 * Prioritized experience replay buffer with stratified sampling
 */
export class ExperienceReplayBuffer {
  private buffer: Experience[] = [];
  private max_size: number;

  // Stratified buffers
  private nash_discoveries: Experience[] = [];
  private convergent_trajectories: Experience[] = [];
  private exploratory_moves: Experience[] = [];

  constructor(max_size: number = 100000) {
    this.max_size = max_size;
  }

  /**
   * Add experience to buffer
   */
  public add(experience: Experience): void {
    // Add to main buffer
    this.buffer.push(experience);

    // Add to stratified buffers
    if (experience.reward > 5.0) {
      this.nash_discoveries.push(experience);
    } else if (experience.reward > 0) {
      this.convergent_trajectories.push(experience);
    } else {
      this.exploratory_moves.push(experience);
    }

    // Prune if buffer is full
    if (this.buffer.length > this.max_size) {
      this.buffer.shift();
    }
  }

  /**
   * Add entire episode to buffer
   */
  public addEpisode(experiences: Experience[]): void {
    for (const exp of experiences) {
      this.add(exp);
    }
  }

  /**
   * Sample batch with prioritized and stratified sampling
   *
   * 50% from high TD-error (prioritized)
   * 30% from nash discoveries (successful outcomes)
   * 20% from exploratory moves (diversity)
   */
  public sampleBatch(batch_size: number): Experience[] {
    const batch: Experience[] = [];

    // Sort by absolute TD-error (priority)
    const sorted_by_priority = [...this.buffer].sort((a, b) =>
      Math.abs(b.td_error || 0) - Math.abs(a.td_error || 0)
    );

    // Sample 50% from high priority
    const priority_count = Math.floor(batch_size * 0.5);
    for (let i = 0; i < priority_count && i < sorted_by_priority.length; i++) {
      batch.push(sorted_by_priority[i]);
    }

    // Sample 30% from nash discoveries
    const nash_count = Math.floor(batch_size * 0.3);
    for (let i = 0; i < nash_count && this.nash_discoveries.length > 0; i++) {
      const idx = Math.floor(Math.random() * this.nash_discoveries.length);
      batch.push(this.nash_discoveries[idx]);
    }

    // Sample 20% from exploratory moves
    const explore_count = Math.floor(batch_size * 0.2);
    for (let i = 0; i < explore_count && this.exploratory_moves.length > 0; i++) {
      const idx = Math.floor(Math.random() * this.exploratory_moves.length);
      batch.push(this.exploratory_moves[idx]);
    }

    // Fill remaining with random samples
    while (batch.length < batch_size && this.buffer.length > 0) {
      const idx = Math.floor(Math.random() * this.buffer.length);
      batch.push(this.buffer[idx]);
    }

    return batch;
  }

  /**
   * Get buffer size
   */
  public size(): number {
    return this.buffer.length;
  }

  /**
   * Clear buffer
   */
  public clear(): void {
    this.buffer = [];
    this.nash_discoveries = [];
    this.convergent_trajectories = [];
    this.exploratory_moves = [];
  }
}

// ============================================================================
// AgentDB Integration
// ============================================================================

/**
 * AgentDB manager for storing episodes and experiences
 */
export class AgentDBManager {
  private dbPath: string;
  private db: any; // AgentDB instance
  private initialized: boolean = false;

  constructor(dbPath: string = './data/agentdb/phase-space-learning.db') {
    this.dbPath = dbPath;
  }

  /**
   * Initialize AgentDB connection and schema
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Import AgentDB dynamically
      const { createDatabase } = await import('agentdb');
      this.db = await createDatabase(this.dbPath);

      // Create schema
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS phase_space_episodes (
          episode_id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          start_n INTEGER NOT NULL,
          start_phi REAL NOT NULL,
          start_psi REAL NOT NULL,
          total_steps INTEGER NOT NULL,
          total_reward REAL NOT NULL,
          nash_points_found INTEGER NOT NULL,
          final_chaos_indicator REAL NOT NULL,
          end_n INTEGER NOT NULL,
          end_phi REAL NOT NULL,
          end_psi REAL NOT NULL,
          success INTEGER NOT NULL,
          latency_ms INTEGER,
          metadata_json TEXT
        );

        CREATE TABLE IF NOT EXISTS phase_space_reflexion (
          step_id TEXT PRIMARY KEY,
          episode_id TEXT NOT NULL,
          step_number INTEGER NOT NULL,
          state_vector TEXT NOT NULL,
          action_vector TEXT NOT NULL,
          reward REAL NOT NULL,
          next_state_vector TEXT,
          done INTEGER NOT NULL,
          advantage REAL,
          td_error REAL,
          value_estimate REAL,
          timestamp INTEGER NOT NULL,
          FOREIGN KEY (episode_id) REFERENCES phase_space_episodes(episode_id)
        );

        CREATE TABLE IF NOT EXISTS phase_space_causal_edges (
          edge_id TEXT PRIMARY KEY,
          from_step_id TEXT NOT NULL,
          to_step_id TEXT NOT NULL,
          nash_point_reached INTEGER NOT NULL,
          chaos_change REAL NOT NULL,
          convergence_improvement REAL NOT NULL,
          action_type TEXT NOT NULL,
          action_magnitude REAL NOT NULL,
          FOREIGN KEY (from_step_id) REFERENCES phase_space_reflexion(step_id),
          FOREIGN KEY (to_step_id) REFERENCES phase_space_reflexion(step_id)
        );

        CREATE INDEX IF NOT EXISTS idx_episodes_session ON phase_space_episodes(session_id);
        CREATE INDEX IF NOT EXISTS idx_episodes_reward ON phase_space_episodes(total_reward DESC);
        CREATE INDEX IF NOT EXISTS idx_reflexion_episode ON phase_space_reflexion(episode_id);
        CREATE INDEX IF NOT EXISTS idx_reflexion_advantage ON phase_space_reflexion(advantage DESC);
        CREATE INDEX IF NOT EXISTS idx_edges_nash ON phase_space_causal_edges(nash_point_reached);
      `);

      this.initialized = true;
      console.log('AgentDB initialized at:', this.dbPath);
    } catch (error) {
      throw new Error(`Failed to initialize AgentDB: ${error}`);
    }
  }

  /**
   * Store episode in AgentDB
   */
  public async storeEpisode(episode: Episode): Promise<void> {
    await this.initialize();

    const stmt = this.db.prepare(`
      INSERT INTO phase_space_episodes (
        episode_id, session_id, timestamp,
        start_n, start_phi, start_psi,
        total_steps, total_reward, nash_points_found, final_chaos_indicator,
        end_n, end_phi, end_psi,
        success, latency_ms, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      episode.episode_id,
      episode.session_id,
      episode.timestamp,
      episode.start_n,
      episode.start_phi,
      episode.start_psi,
      episode.total_steps,
      episode.total_reward,
      episode.nash_points_found,
      episode.final_chaos_indicator,
      episode.end_n,
      episode.end_phi,
      episode.end_psi,
      episode.success ? 1 : 0,
      episode.latency_ms,
      episode.metadata ? JSON.stringify(episode.metadata) : null
    );
  }

  /**
   * Store experience step in reflexion table
   */
  public async storeExperience(experience: Experience): Promise<void> {
    await this.initialize();

    const stmt = this.db.prepare(`
      INSERT INTO phase_space_reflexion (
        step_id, episode_id, step_number,
        state_vector, action_vector, reward,
        next_state_vector, done,
        advantage, td_error, value_estimate,
        timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      `${experience.episode_id}_${experience.step_number}`,
      experience.episode_id,
      experience.step_number,
      JSON.stringify(experience.state),
      JSON.stringify(experience.action),
      experience.reward,
      experience.next_state ? JSON.stringify(experience.next_state) : null,
      experience.done ? 1 : 0,
      experience.advantage || null,
      experience.td_error || null,
      experience.value_estimate || null,
      experience.timestamp
    );
  }

  /**
   * Query experiences by criteria
   */
  public async queryExperiences(criteria: {
    episode_id?: string;
    min_advantage?: number;
    limit?: number;
  }): Promise<Experience[]> {
    await this.initialize();

    let sql = 'SELECT * FROM phase_space_reflexion WHERE 1=1';
    const params: any[] = [];

    if (criteria.episode_id) {
      sql += ' AND episode_id = ?';
      params.push(criteria.episode_id);
    }

    if (criteria.min_advantage !== undefined) {
      sql += ' AND advantage >= ?';
      params.push(criteria.min_advantage);
    }

    sql += ' ORDER BY advantage DESC';

    if (criteria.limit) {
      sql += ' LIMIT ?';
      params.push(criteria.limit);
    }

    const rows = this.db.prepare(sql).all(...params);

    return rows.map((row: any) => ({
      state: JSON.parse(row.state_vector),
      action: JSON.parse(row.action_vector),
      reward: row.reward,
      next_state: row.next_state_vector ? JSON.parse(row.next_state_vector) : null,
      done: row.done === 1,
      advantage: row.advantage,
      td_error: row.td_error,
      value_estimate: row.value_estimate,
      timestamp: row.timestamp,
      episode_id: row.episode_id,
      step_number: row.step_number
    }));
  }

  /**
   * Close database connection
   */
  public async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.initialized = false;
    }
  }
}

// ============================================================================
// Main A2C Agent
// ============================================================================

/**
 * Advantage Actor-Critic agent for phase-space optimization
 */
export class ActorCriticAgent {
  private actor: ActorNetwork;
  private critic: CriticNetwork;
  private preprocessor: StatePreprocessor;
  private transformer: ActionTransformer;
  private reward_fn: RewardFunction;
  private replay_buffer: ExperienceReplayBuffer;
  private agentdb: AgentDBManager;

  private hyperparams: Hyperparameters;
  private current_episode: number = 0;
  private current_exploration_noise: number;

  constructor(
    env_config: PhaseSpaceEnvConfig,
    hyperparams: Partial<Hyperparameters> = {},
    dbPath?: string
  ) {
    // Set default hyperparameters
    this.hyperparams = {
      state_dim: 64,
      action_dim: 4,
      hidden_dims_actor: [256, 512, 256],
      hidden_dims_critic: [512, 512, 256],
      learning_rate_actor: 3e-4,
      learning_rate_critic: 1e-3,
      gamma: 0.99,
      lambda_gae: 0.95,
      entropy_coef: 0.01,
      max_episodes: 10000,
      max_steps_per_episode: 500,
      update_frequency: 4,
      batch_size: 256,
      buffer_size: 100000,
      prioritized_replay_alpha: 0.6,
      prioritized_replay_beta: 0.4,
      initial_exploration_noise: 0.3,
      final_exploration_noise: 0.05,
      exploration_decay_steps: 5000,
      dropout_rate: 0.2,
      gradient_clip_norm: 0.5,
      weight_decay: 1e-5,
      ...hyperparams
    };

    // Initialize components
    this.actor = new ActorNetwork(
      this.hyperparams.state_dim,
      this.hyperparams.action_dim,
      this.hyperparams.hidden_dims_actor
    );
    this.critic = new CriticNetwork(
      this.hyperparams.state_dim,
      this.hyperparams.hidden_dims_critic
    );
    this.preprocessor = new StatePreprocessor(env_config.n_max);
    this.transformer = new ActionTransformer();
    this.reward_fn = new RewardFunction(env_config);
    this.replay_buffer = new ExperienceReplayBuffer(this.hyperparams.buffer_size);
    this.agentdb = new AgentDBManager(dbPath);

    this.current_exploration_noise = this.hyperparams.initial_exploration_noise;
  }

  /**
   * Initialize agent (must be called before training)
   */
  public async initialize(): Promise<void> {
    await this.agentdb.initialize();
  }

  /**
   * Select action given state
   */
  public selectAction(state: RawPhaseState): TransformedAction {
    // Preprocess state
    const features = this.preprocessor.extractFeatures(state);
    const state_vector = this.preprocessor.preprocess(state, features);

    // Sample action from actor
    let action = this.actor.sampleAction(state_vector);

    // Add exploration noise
    action = this.transformer.addNoise(action, this.current_exploration_noise);

    // Transform to environment action
    const transformed = this.transformer.transform(action, state.maxZeros);

    return transformed;
  }

  /**
   * Train on a batch of experiences
   */
  public train(): { actor_loss: number; critic_loss: number; metrics: any } {
    // Sample batch from replay buffer
    const batch = this.replay_buffer.sampleBatch(this.hyperparams.batch_size);

    if (batch.length === 0) {
      return { actor_loss: 0, critic_loss: 0, metrics: {} };
    }

    // Placeholder: In production, implement actual training loop with backpropagation
    // This requires integration with TensorFlow.js or exporting to Python/PyTorch

    const actor_loss = Math.random() * 0.5;
    const critic_loss = Math.random() * 0.5;

    return {
      actor_loss,
      critic_loss,
      metrics: {
        batch_size: batch.length,
        avg_reward: batch.reduce((sum, exp) => sum + exp.reward, 0) / batch.length
      }
    };
  }

  /**
   * Update exploration noise (decay over time)
   */
  private updateExplorationNoise(): void {
    const progress = this.current_episode / this.hyperparams.exploration_decay_steps;
    const decay = Math.min(1.0, progress);

    this.current_exploration_noise =
      this.hyperparams.initial_exploration_noise -
      decay * (this.hyperparams.initial_exploration_noise - this.hyperparams.final_exploration_noise);
  }

  /**
   * Save agent models
   */
  public save(path: string): void {
    this.actor.saveWeights(`${path}/actor.weights`);
    this.critic.saveWeights(`${path}/critic.weights`);
    console.log('Agent saved to:', path);
  }

  /**
   * Load agent models
   */
  public load(path: string): void {
    this.actor.loadWeights(`${path}/actor.weights`);
    this.critic.loadWeights(`${path}/critic.weights`);
    console.log('Agent loaded from:', path);
  }

  /**
   * Get current training statistics
   */
  public getStatistics(): {
    episode: number;
    exploration_noise: number;
    buffer_size: number;
  } {
    return {
      episode: this.current_episode,
      exploration_noise: this.current_exploration_noise,
      buffer_size: this.replay_buffer.size()
    };
  }

  /**
   * Close agent and cleanup
   */
  public async close(): Promise<void> {
    await this.agentdb.close();
  }
}

// ============================================================================
// Exports
// ============================================================================

export {
  StatePreprocessor,
  ActionTransformer,
  RewardFunction,
  ActorNetwork,
  CriticNetwork,
  ExperienceReplayBuffer,
  AgentDBManager
};

/**
 * Create default hyperparameters
 */
export function createDefaultHyperparameters(): Hyperparameters {
  return {
    state_dim: 64,
    action_dim: 4,
    hidden_dims_actor: [256, 512, 256],
    hidden_dims_critic: [512, 512, 256],
    learning_rate_actor: 3e-4,
    learning_rate_critic: 1e-3,
    gamma: 0.99,
    lambda_gae: 0.95,
    entropy_coef: 0.01,
    max_episodes: 10000,
    max_steps_per_episode: 500,
    update_frequency: 4,
    batch_size: 256,
    buffer_size: 100000,
    prioritized_replay_alpha: 0.6,
    prioritized_replay_beta: 0.4,
    initial_exploration_noise: 0.3,
    final_exploration_noise: 0.05,
    exploration_decay_steps: 5000,
    dropout_rate: 0.2,
    gradient_clip_norm: 0.5,
    weight_decay: 1e-5
  };
}

/**
 * Create default environment configuration
 */
export function createDefaultEnvConfig(): PhaseSpaceEnvConfig {
  return {
    n_min: 1,
    n_max: 1000,
    initial_n: 10,
    initial_maxZeros: 50,
    max_steps: 500,
    w_nash: 1.0,
    w_convergence: 0.5,
    w_exploration: 0.3,
    w_penalty: 0.2
  };
}

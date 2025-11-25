"""
Quantum Field Neural Network (QFNN) - Integer-Only Implementation
Implements quantum field operators, Hebbian learning, phase-aware attention, and RK2 integration.

All operations use integer arithmetic scaled by 10000.
Trains on Fibonacci-encoded prices for market prediction.
"""

import json
import numpy as np
from typing import List, Tuple, Dict, Optional
from pathlib import Path


class QuantumFieldOperator:
    """
    Quantum field operator using integer matrices.
    Represents quantum states and transformations in trading space.
    """

    def __init__(self, size: int, scale: int = 10000):
        """
        Initialize quantum field operator.

        Args:
            size: Dimension of the operator matrix
            scale: Scaling factor for integer arithmetic (default: 10000)
        """
        self.size = size
        self.scale = scale
        # Initialize operator as identity matrix scaled
        self.operator = np.eye(size, dtype=np.int64) * scale

    def apply(self, state: np.ndarray) -> np.ndarray:
        """
        Apply quantum field operator to state vector.

        Args:
            state: State vector (integer array)

        Returns:
            Transformed state vector
        """
        # Matrix multiplication with integer scaling
        result = np.matmul(self.operator, state)
        return (result // self.scale).astype(np.int64)

    def evolve(self, delta_t: int) -> None:
        """
        Evolve operator in time using integer rotation.

        Args:
            delta_t: Time step (scaled integer)
        """
        # Simple rotation using integer trigonometry approximation
        # cos(θ) ≈ 1 - θ²/2, sin(θ) ≈ θ for small θ
        theta = delta_t  # Already scaled

        # Create rotation-like transformation
        cos_approx = self.scale - (theta * theta) // (2 * self.scale)
        sin_approx = theta

        # Apply to diagonal elements
        for i in range(self.size):
            self.operator[i, i] = (self.operator[i, i] * cos_approx) // self.scale


class HebbianLayer:
    """
    Hebbian learning layer with zero-gradient updates.
    Implements "neurons that fire together, wire together" principle.
    """

    def __init__(self, input_size: int, output_size: int, scale: int = 10000):
        """
        Initialize Hebbian layer.

        Args:
            input_size: Number of input neurons
            output_size: Number of output neurons
            scale: Scaling factor for integer arithmetic
        """
        self.input_size = input_size
        self.output_size = output_size
        self.scale = scale

        # Initialize weights with small random integers
        self.weights = np.random.randint(-scale // 10, scale // 10,
                                        (output_size, input_size),
                                        dtype=np.int64)

        # Track firing patterns for Hebbian updates
        self.last_input = None
        self.last_output = None

    def forward(self, x: np.ndarray) -> np.ndarray:
        """
        Forward pass through Hebbian layer.

        Args:
            x: Input vector (scaled integers)

        Returns:
            Output vector (scaled integers)
        """
        # Store for Hebbian update
        self.last_input = x.copy()

        # Linear transformation with integer scaling
        output = np.matmul(self.weights, x)
        output = (output // self.scale).astype(np.int64)

        # Binary activation (sign function)
        output = np.where(output > 0, self.scale, -self.scale).astype(np.int64)

        self.last_output = output.copy()
        return output

    def hebbian_update(self, learning_rate: int = 100) -> None:
        """
        Update weights using Hebbian learning rule (zero-gradient).
        ΔW = η * x * y^T (no backpropagation needed)

        Args:
            learning_rate: Learning rate (scaled integer, default: 100 = 0.01)
        """
        if self.last_input is None or self.last_output is None:
            return

        # Hebbian rule: ΔW ∝ output ⊗ input
        # Outer product scaled
        outer = np.outer(self.last_output, self.last_input)
        delta = (outer * learning_rate) // (self.scale * self.scale)

        # Update weights
        self.weights += delta.astype(np.int64)

        # Normalize to prevent overflow
        max_weight = np.max(np.abs(self.weights))
        if max_weight > self.scale * 100:
            self.weights = (self.weights * self.scale * 100) // max_weight


class PhaseAwareBinaryAttention:
    """
    Phase-aware binary attention mechanism.
    Uses phase encoding to determine attention weights in binary space.
    """

    def __init__(self, num_heads: int, dim: int, scale: int = 10000):
        """
        Initialize phase-aware attention.

        Args:
            num_heads: Number of attention heads
            dim: Dimension of attention space
            scale: Scaling factor
        """
        self.num_heads = num_heads
        self.dim = dim
        self.scale = scale

        # Phase encodings for each head (integer angles 0-359)
        self.phase_encodings = np.random.randint(0, 360, num_heads, dtype=np.int32)

    def compute_attention(self, query: np.ndarray, key: np.ndarray,
                         value: np.ndarray) -> np.ndarray:
        """
        Compute phase-aware binary attention.

        Args:
            query: Query vector (scaled integers)
            key: Key vector (scaled integers)
            value: Value vector (scaled integers)

        Returns:
            Attended output vector
        """
        outputs = []

        for head in range(self.num_heads):
            # Compute phase-modulated similarity
            phase = self.phase_encodings[head]

            # Integer cosine approximation: cos(θ) ≈ 1 - θ²/2 for small θ
            # Scale phase to radians equivalent
            phase_rad = (phase * 314) // 18000  # phase * π/180 scaled
            cos_phase = self.scale - (phase_rad * phase_rad) // (2 * self.scale)

            # Dot product attention with phase modulation
            similarity = np.dot(query, key)
            similarity = (similarity * cos_phase) // (self.scale * self.scale)

            # Binary attention weights (sign function)
            attention_weight = 1 if similarity > 0 else -1

            # Apply attention to value
            attended = (value * attention_weight * self.scale) // self.scale
            outputs.append(attended)

        # Average across heads
        output = np.sum(outputs, axis=0) // self.num_heads
        return output.astype(np.int64)

    def update_phases(self, delta_phase: int) -> None:
        """
        Update phase encodings based on learning.

        Args:
            delta_phase: Phase adjustment (degrees)
        """
        self.phase_encodings = (self.phase_encodings + delta_phase) % 360


class RK2Integrator:
    """
    Runge-Kutta 2nd order (RK2) integrator for quantum diffusion.
    Provides stable integration of quantum field dynamics.
    """

    def __init__(self, scale: int = 10000):
        """
        Initialize RK2 integrator.

        Args:
            scale: Scaling factor for integer arithmetic
        """
        self.scale = scale

    def integrate(self, state: np.ndarray, derivative_func, dt: int) -> np.ndarray:
        """
        Integrate state forward using RK2 method.

        RK2 (Midpoint method):
        k1 = f(t, y)
        k2 = f(t + dt/2, y + dt*k1/2)
        y_new = y + dt*k2

        Args:
            state: Current state vector (scaled integers)
            derivative_func: Function computing derivative
            dt: Time step (scaled integer)

        Returns:
            Integrated state vector
        """
        # First stage: k1 = f(t, y)
        k1 = derivative_func(state)

        # Second stage: k2 = f(t + dt/2, y + dt*k1/2)
        half_step = state + (dt * k1) // (2 * self.scale)
        k2 = derivative_func(half_step)

        # Final update: y_new = y + dt*k2
        new_state = state + (dt * k2) // self.scale

        return new_state.astype(np.int64)


class QFNN:
    """
    Quantum Field Neural Network - Main Model Class

    Combines:
    - Quantum field operators for state transformations
    - Hebbian learning layers (zero-gradient updates)
    - Phase-aware binary attention
    - RK2 integration for stable quantum diffusion
    - Training on Fibonacci-encoded prices
    """

    def __init__(self, input_dim: int = 10, hidden_dim: int = 20,
                 output_dim: int = 3, num_heads: int = 4, scale: int = 10000):
        """
        Initialize QFNN model.

        Args:
            input_dim: Input dimension (Fibonacci-encoded features)
            hidden_dim: Hidden layer dimension
            output_dim: Output dimension (price predictions)
            num_heads: Number of attention heads
            scale: Integer scaling factor (default: 10000)
        """
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.output_dim = output_dim
        self.scale = scale

        # Initialize quantum field operators
        self.field_operator = QuantumFieldOperator(hidden_dim, scale)

        # Initialize Hebbian layers
        self.hebbian_layer1 = HebbianLayer(input_dim, hidden_dim, scale)
        self.hebbian_layer2 = HebbianLayer(hidden_dim, hidden_dim, scale)
        self.hebbian_layer3 = HebbianLayer(hidden_dim, output_dim, scale)

        # Initialize phase-aware attention
        self.attention = PhaseAwareBinaryAttention(num_heads, hidden_dim, scale)

        # Initialize RK2 integrator
        self.integrator = RK2Integrator(scale)

        # Training history
        self.training_history = []

    def forward(self, x: np.ndarray) -> np.ndarray:
        """
        Forward pass through QFNN.

        Args:
            x: Input vector (Fibonacci-encoded prices, scaled integers)

        Returns:
            Output vector (predicted price movements)
        """
        # Layer 1: Hebbian transformation
        h1 = self.hebbian_layer1.forward(x)

        # Apply quantum field operator
        h1 = self.field_operator.apply(h1)

        # Layer 2: Hebbian transformation with attention
        h2 = self.hebbian_layer2.forward(h1)

        # Phase-aware attention (self-attention)
        h2_attended = self.attention.compute_attention(h2, h2, h2)

        # Integrate quantum diffusion using RK2
        def quantum_derivative(state):
            # Simple diffusion: dψ/dt = -λψ
            lambda_decay = self.scale // 100  # 0.01
            return -(lambda_decay * state) // self.scale

        dt = self.scale // 10  # 0.1
        h2_integrated = self.integrator.integrate(h2_attended, quantum_derivative, dt)

        # Layer 3: Output layer
        output = self.hebbian_layer3.forward(h2_integrated)

        return output

    def train_step(self, x: np.ndarray, y_target: np.ndarray,
                   learning_rate: int = 100) -> int:
        """
        Single training step using Hebbian learning (no backprop).

        Args:
            x: Input features (Fibonacci-encoded)
            y_target: Target output (scaled integers)
            learning_rate: Learning rate (scaled, default: 100 = 0.01)

        Returns:
            Loss value (scaled integer)
        """
        # Forward pass
        y_pred = self.forward(x)

        # Compute loss (mean squared error, scaled)
        error = y_target - y_pred
        loss = np.sum(error * error) // len(error)

        # Hebbian updates (zero-gradient learning)
        self.hebbian_layer1.hebbian_update(learning_rate)
        self.hebbian_layer2.hebbian_update(learning_rate)
        self.hebbian_layer3.hebbian_update(learning_rate)

        # Update attention phases based on error
        avg_error = np.mean(error)
        phase_delta = 1 if avg_error > 0 else -1
        self.attention.update_phases(phase_delta)

        # Evolve quantum field operator
        self.field_operator.evolve(learning_rate // 10)

        return int(loss)

    def train(self, X_train: List[np.ndarray], y_train: List[np.ndarray],
              epochs: int = 100, learning_rate: int = 100,
              verbose: bool = True) -> List[int]:
        """
        Train QFNN on Fibonacci-encoded price data.

        Args:
            X_train: List of training inputs (Fibonacci-encoded)
            y_train: List of training targets
            epochs: Number of training epochs
            learning_rate: Learning rate (scaled integer)
            verbose: Print training progress

        Returns:
            List of loss values per epoch
        """
        epoch_losses = []

        for epoch in range(epochs):
            total_loss = 0

            for x, y in zip(X_train, y_train):
                loss = self.train_step(x, y, learning_rate)
                total_loss += loss

            avg_loss = total_loss // len(X_train)
            epoch_losses.append(avg_loss)

            # Store in training history
            self.training_history.append({
                'epoch': epoch,
                'loss': avg_loss,
                'learning_rate': learning_rate
            })

            if verbose and (epoch % 10 == 0 or epoch == epochs - 1):
                print(f"Epoch {epoch}/{epochs}, Loss: {avg_loss} (scaled)")

        return epoch_losses

    def predict(self, x: np.ndarray) -> np.ndarray:
        """
        Make prediction with trained model.

        Args:
            x: Input features (Fibonacci-encoded)

        Returns:
            Prediction output
        """
        return self.forward(x)

    def save_checkpoint(self, filepath: str) -> None:
        """
        Save model checkpoint to file.

        Args:
            filepath: Path to save checkpoint
        """
        checkpoint = {
            'input_dim': self.input_dim,
            'hidden_dim': self.hidden_dim,
            'output_dim': self.output_dim,
            'scale': self.scale,
            'field_operator': self.field_operator.operator.tolist(),
            'hebbian_weights_1': self.hebbian_layer1.weights.tolist(),
            'hebbian_weights_2': self.hebbian_layer2.weights.tolist(),
            'hebbian_weights_3': self.hebbian_layer3.weights.tolist(),
            'phase_encodings': self.attention.phase_encodings.tolist(),
            'training_history': self.training_history
        }

        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        with open(filepath, 'w') as f:
            json.dump(checkpoint, f, indent=2)

        print(f"✅ Checkpoint saved to {filepath}")

    def load_checkpoint(self, filepath: str) -> None:
        """
        Load model checkpoint from file.

        Args:
            filepath: Path to checkpoint file
        """
        with open(filepath, 'r') as f:
            checkpoint = json.load(f)

        # Restore model dimensions
        self.input_dim = checkpoint['input_dim']
        self.hidden_dim = checkpoint['hidden_dim']
        self.output_dim = checkpoint['output_dim']
        self.scale = checkpoint['scale']

        # Restore weights and operators
        self.field_operator.operator = np.array(checkpoint['field_operator'], dtype=np.int64)
        self.hebbian_layer1.weights = np.array(checkpoint['hebbian_weights_1'], dtype=np.int64)
        self.hebbian_layer2.weights = np.array(checkpoint['hebbian_weights_2'], dtype=np.int64)
        self.hebbian_layer3.weights = np.array(checkpoint['hebbian_weights_3'], dtype=np.int64)
        self.attention.phase_encodings = np.array(checkpoint['phase_encodings'], dtype=np.int32)
        self.training_history = checkpoint['training_history']

        print(f"✅ Checkpoint loaded from {filepath}")

    def get_model_summary(self) -> Dict:
        """
        Get model architecture summary.

        Returns:
            Dictionary with model information
        """
        return {
            'architecture': 'Quantum Field Neural Network (QFNN)',
            'input_dim': self.input_dim,
            'hidden_dim': self.hidden_dim,
            'output_dim': self.output_dim,
            'scale_factor': self.scale,
            'components': {
                'quantum_field_operator': f'{self.hidden_dim}x{self.hidden_dim}',
                'hebbian_layers': 3,
                'attention_heads': self.attention.num_heads,
                'integrator': 'RK2 (Runge-Kutta 2nd order)'
            },
            'features': [
                'Integer-only operations (scaled by 10000)',
                'Hebbian learning (zero-gradient updates)',
                'Phase-aware binary attention',
                'RK2 quantum diffusion integration',
                'Fibonacci-encoded price training'
            ],
            'total_parameters': (
                self.hebbian_layer1.weights.size +
                self.hebbian_layer2.weights.size +
                self.hebbian_layer3.weights.size +
                self.field_operator.operator.size
            )
        }


# Convenience function for creating and training QFNN
def create_and_train_qfnn(X_train: List[np.ndarray], y_train: List[np.ndarray],
                          input_dim: int = 10, hidden_dim: int = 20,
                          output_dim: int = 3, epochs: int = 100,
                          learning_rate: int = 100,
                          checkpoint_path: Optional[str] = None) -> QFNN:
    """
    Create and train a QFNN model.

    Args:
        X_train: Training inputs (Fibonacci-encoded)
        y_train: Training targets
        input_dim: Input dimension
        hidden_dim: Hidden layer dimension
        output_dim: Output dimension
        epochs: Training epochs
        learning_rate: Learning rate (scaled)
        checkpoint_path: Optional path to save checkpoint

    Returns:
        Trained QFNN model
    """
    # Create model
    model = QFNN(input_dim, hidden_dim, output_dim)

    # Print model summary
    summary = model.get_model_summary()
    print("\n" + "="*60)
    print(f"🧠 {summary['architecture']}")
    print("="*60)
    print(f"Input dimension: {summary['input_dim']}")
    print(f"Hidden dimension: {summary['hidden_dim']}")
    print(f"Output dimension: {summary['output_dim']}")
    print(f"Total parameters: {summary['total_parameters']:,}")
    print("\nFeatures:")
    for feature in summary['features']:
        print(f"  ✓ {feature}")
    print("="*60 + "\n")

    # Train model
    print("🚀 Starting training...")
    losses = model.train(X_train, y_train, epochs, learning_rate, verbose=True)

    print(f"\n✅ Training complete! Final loss: {losses[-1]} (scaled)")

    # Save checkpoint if path provided
    if checkpoint_path:
        model.save_checkpoint(checkpoint_path)

    return model

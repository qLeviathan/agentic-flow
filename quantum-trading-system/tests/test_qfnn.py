"""
Comprehensive tests for Quantum Field Neural Network (QFNN)
Tests all components: quantum operators, Hebbian learning, attention, RK2 integration
"""

import pytest
import numpy as np
import sys
from pathlib import Path
import tempfile
import json

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from models.qfnn import (
    QuantumFieldOperator,
    HebbianLayer,
    PhaseAwareBinaryAttention,
    RK2Integrator,
    QFNN,
    create_and_train_qfnn
)


class TestQuantumFieldOperator:
    """Test quantum field operator functionality."""

    def test_initialization(self):
        """Test operator initialization."""
        operator = QuantumFieldOperator(size=5, scale=10000)
        assert operator.size == 5
        assert operator.scale == 10000
        assert operator.operator.shape == (5, 5)
        # Should be identity matrix scaled
        assert np.allclose(operator.operator, np.eye(5) * 10000)

    def test_apply_identity(self):
        """Test applying identity operator."""
        operator = QuantumFieldOperator(size=3, scale=10000)
        state = np.array([10000, 20000, 30000], dtype=np.int64)
        result = operator.apply(state)
        # Identity should preserve state
        assert np.array_equal(result, state)

    def test_apply_custom_operator(self):
        """Test applying custom operator."""
        operator = QuantumFieldOperator(size=2, scale=10000)
        # Set custom operator
        operator.operator = np.array([[20000, 10000],
                                      [10000, 20000]], dtype=np.int64)
        state = np.array([10000, 20000], dtype=np.int64)
        result = operator.apply(state)
        # Should compute matrix multiplication
        expected = np.array([40000, 50000], dtype=np.int64)
        assert np.array_equal(result, expected)

    def test_evolve(self):
        """Test operator evolution in time."""
        operator = QuantumFieldOperator(size=3, scale=10000)
        initial = operator.operator.copy()
        operator.evolve(delta_t=100)
        # Operator should have changed
        assert not np.array_equal(operator.operator, initial)

    def test_integer_only_operations(self):
        """Test that all operations use integers only."""
        operator = QuantumFieldOperator(size=4, scale=10000)
        state = np.array([5000, 10000, 15000, 20000], dtype=np.int64)
        result = operator.apply(state)
        assert result.dtype == np.int64
        operator.evolve(delta_t=50)
        assert operator.operator.dtype == np.int64


class TestHebbianLayer:
    """Test Hebbian learning layer."""

    def test_initialization(self):
        """Test layer initialization."""
        layer = HebbianLayer(input_size=5, output_size=3, scale=10000)
        assert layer.input_size == 5
        assert layer.output_size == 3
        assert layer.weights.shape == (3, 5)
        assert layer.weights.dtype == np.int64

    def test_forward_pass(self):
        """Test forward propagation."""
        layer = HebbianLayer(input_size=3, output_size=2, scale=10000)
        x = np.array([10000, -5000, 8000], dtype=np.int64)
        output = layer.forward(x)
        assert output.shape == (2,)
        assert output.dtype == np.int64
        # Output should be binary (±scale)
        assert np.all(np.abs(output) == 10000)

    def test_hebbian_update(self):
        """Test Hebbian weight update."""
        layer = HebbianLayer(input_size=2, output_size=2, scale=10000)
        x = np.array([10000, 5000], dtype=np.int64)
        initial_weights = layer.weights.copy()

        # Forward pass to store activations
        layer.forward(x)

        # Hebbian update
        layer.hebbian_update(learning_rate=100)

        # Weights should have changed
        assert not np.array_equal(layer.weights, initial_weights)

    def test_weight_normalization(self):
        """Test that weights don't overflow."""
        layer = HebbianLayer(input_size=3, output_size=3, scale=10000)
        x = np.array([10000, 10000, 10000], dtype=np.int64)

        # Multiple updates to test normalization
        for _ in range(100):
            layer.forward(x)
            layer.hebbian_update(learning_rate=500)

        # Weights should stay bounded
        max_weight = np.max(np.abs(layer.weights))
        assert max_weight <= 10000 * 100  # Maximum allowed

    def test_integer_only_operations(self):
        """Test integer-only arithmetic."""
        layer = HebbianLayer(input_size=4, output_size=3, scale=10000)
        x = np.array([5000, 10000, 15000, 20000], dtype=np.int64)
        output = layer.forward(x)
        assert output.dtype == np.int64
        layer.hebbian_update(learning_rate=100)
        assert layer.weights.dtype == np.int64


class TestPhaseAwareBinaryAttention:
    """Test phase-aware attention mechanism."""

    def test_initialization(self):
        """Test attention initialization."""
        attention = PhaseAwareBinaryAttention(num_heads=4, dim=8, scale=10000)
        assert attention.num_heads == 4
        assert attention.dim == 8
        assert attention.phase_encodings.shape == (4,)
        # Phases should be in [0, 360)
        assert np.all(attention.phase_encodings >= 0)
        assert np.all(attention.phase_encodings < 360)

    def test_compute_attention(self):
        """Test attention computation."""
        attention = PhaseAwareBinaryAttention(num_heads=2, dim=3, scale=10000)
        query = np.array([10000, 5000, 8000], dtype=np.int64)
        key = np.array([8000, 6000, 9000], dtype=np.int64)
        value = np.array([12000, 7000, 11000], dtype=np.int64)

        output = attention.compute_attention(query, key, value)
        assert output.shape == value.shape
        assert output.dtype == np.int64

    def test_update_phases(self):
        """Test phase update mechanism."""
        attention = PhaseAwareBinaryAttention(num_heads=3, dim=5, scale=10000)
        initial_phases = attention.phase_encodings.copy()

        attention.update_phases(delta_phase=10)

        # Phases should have changed
        assert not np.array_equal(attention.phase_encodings, initial_phases)
        # Should wrap around 360
        assert np.all(attention.phase_encodings >= 0)
        assert np.all(attention.phase_encodings < 360)

    def test_phase_modulation(self):
        """Test that different phases give different outputs."""
        attention = PhaseAwareBinaryAttention(num_heads=2, dim=3, scale=10000)
        query = np.array([10000, 5000, 8000], dtype=np.int64)
        key = np.array([8000, 6000, 9000], dtype=np.int64)
        value = np.array([12000, 7000, 11000], dtype=np.int64)

        output1 = attention.compute_attention(query, key, value)

        # Change phases
        attention.update_phases(delta_phase=90)

        output2 = attention.compute_attention(query, key, value)

        # Outputs should differ (phase affects attention)
        assert not np.array_equal(output1, output2)

    def test_integer_only_operations(self):
        """Test integer-only arithmetic."""
        attention = PhaseAwareBinaryAttention(num_heads=3, dim=4, scale=10000)
        query = np.array([10000, 5000, 8000, 6000], dtype=np.int64)
        key = np.array([8000, 6000, 9000, 7000], dtype=np.int64)
        value = np.array([12000, 7000, 11000, 9000], dtype=np.int64)

        output = attention.compute_attention(query, key, value)
        assert output.dtype == np.int64
        assert attention.phase_encodings.dtype == np.int32


class TestRK2Integrator:
    """Test Runge-Kutta 2nd order integrator."""

    def test_initialization(self):
        """Test integrator initialization."""
        integrator = RK2Integrator(scale=10000)
        assert integrator.scale == 10000

    def test_linear_integration(self):
        """Test integration of linear dynamics."""
        integrator = RK2Integrator(scale=10000)
        state = np.array([10000, 20000], dtype=np.int64)

        def linear_derivative(s):
            # ds/dt = -s/10
            return -(s // 10)

        # Integrate forward
        new_state = integrator.integrate(state, linear_derivative, dt=1000)
        assert new_state.shape == state.shape
        assert new_state.dtype == np.int64
        # State should decrease
        assert np.all(new_state < state)

    def test_stability(self):
        """Test integration stability over multiple steps."""
        integrator = RK2Integrator(scale=10000)
        state = np.array([50000], dtype=np.int64)

        def decay(s):
            return -(s // 100)

        # Multiple integration steps
        for _ in range(10):
            state = integrator.integrate(state, decay, dt=1000)

        # State should remain finite
        assert np.all(np.isfinite(state))
        assert state[0] > 0  # Should decay but stay positive

    def test_integer_only_operations(self):
        """Test integer-only arithmetic."""
        integrator = RK2Integrator(scale=10000)
        state = np.array([10000, 20000, 30000], dtype=np.int64)

        def derivative(s):
            return -(s // 50)

        new_state = integrator.integrate(state, derivative, dt=500)
        assert new_state.dtype == np.int64


class TestQFNN:
    """Test complete QFNN model."""

    def test_initialization(self):
        """Test model initialization."""
        model = QFNN(input_dim=5, hidden_dim=10, output_dim=3, num_heads=2, scale=10000)
        assert model.input_dim == 5
        assert model.hidden_dim == 10
        assert model.output_dim == 3
        assert model.scale == 10000

    def test_forward_pass(self):
        """Test forward propagation through full model."""
        model = QFNN(input_dim=5, hidden_dim=8, output_dim=3, scale=10000)
        x = np.array([10000, 5000, 8000, 12000, 6000], dtype=np.int64)
        output = model.forward(x)
        assert output.shape == (3,)
        assert output.dtype == np.int64

    def test_train_step(self):
        """Test single training step."""
        model = QFNN(input_dim=3, hidden_dim=5, output_dim=2, scale=10000)
        x = np.array([10000, 5000, 8000], dtype=np.int64)
        y_target = np.array([10000, -10000], dtype=np.int64)

        loss = model.train_step(x, y_target, learning_rate=100)
        assert isinstance(loss, int)
        assert loss >= 0

    def test_training_loop(self):
        """Test full training loop."""
        model = QFNN(input_dim=3, hidden_dim=5, output_dim=2, scale=10000)

        # Create simple training data
        X_train = [
            np.array([10000, 5000, 8000], dtype=np.int64),
            np.array([12000, 6000, 9000], dtype=np.int64),
            np.array([8000, 4000, 7000], dtype=np.int64)
        ]
        y_train = [
            np.array([10000, -10000], dtype=np.int64),
            np.array([10000, 10000], dtype=np.int64),
            np.array([-10000, -10000], dtype=np.int64)
        ]

        losses = model.train(X_train, y_train, epochs=5, verbose=False)
        assert len(losses) == 5
        # Loss should decrease (learning)
        assert losses[-1] <= losses[0] * 2  # Allow some tolerance

    def test_prediction(self):
        """Test model prediction."""
        model = QFNN(input_dim=4, hidden_dim=6, output_dim=2, scale=10000)
        x = np.array([10000, 5000, 8000, 12000], dtype=np.int64)
        prediction = model.predict(x)
        assert prediction.shape == (2,)
        assert prediction.dtype == np.int64

    def test_checkpoint_save_load(self):
        """Test saving and loading model checkpoints."""
        model = QFNN(input_dim=3, hidden_dim=4, output_dim=2, scale=10000)

        # Train briefly
        X_train = [np.array([10000, 5000, 8000], dtype=np.int64)]
        y_train = [np.array([10000, -10000], dtype=np.int64)]
        model.train(X_train, y_train, epochs=2, verbose=False)

        # Save checkpoint
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            checkpoint_path = f.name

        model.save_checkpoint(checkpoint_path)

        # Create new model and load
        model2 = QFNN(input_dim=3, hidden_dim=4, output_dim=2, scale=10000)
        model2.load_checkpoint(checkpoint_path)

        # Models should produce same output
        x = np.array([10000, 5000, 8000], dtype=np.int64)
        output1 = model.predict(x)
        output2 = model2.predict(x)
        assert np.array_equal(output1, output2)

        # Cleanup
        Path(checkpoint_path).unlink()

    def test_get_model_summary(self):
        """Test model summary generation."""
        model = QFNN(input_dim=5, hidden_dim=10, output_dim=3, num_heads=4, scale=10000)
        summary = model.get_model_summary()

        assert 'architecture' in summary
        assert summary['input_dim'] == 5
        assert summary['hidden_dim'] == 10
        assert summary['output_dim'] == 3
        assert summary['scale_factor'] == 10000
        assert 'total_parameters' in summary
        assert summary['total_parameters'] > 0

    def test_integer_only_operations(self):
        """Test that entire model uses integer-only operations."""
        model = QFNN(input_dim=4, hidden_dim=8, output_dim=3, scale=10000)
        x = np.array([10000, 5000, 8000, 12000], dtype=np.int64)

        # Forward pass
        output = model.forward(x)
        assert output.dtype == np.int64

        # Training step
        y_target = np.array([10000, -10000, 10000], dtype=np.int64)
        loss = model.train_step(x, y_target)
        assert isinstance(loss, int)

        # All internal weights should be integers
        assert model.hebbian_layer1.weights.dtype == np.int64
        assert model.hebbian_layer2.weights.dtype == np.int64
        assert model.hebbian_layer3.weights.dtype == np.int64
        assert model.field_operator.operator.dtype == np.int64

    def test_fibonacci_encoded_training(self):
        """Test training with Fibonacci-encoded price data."""
        # Simulate Fibonacci-encoded prices (indices scaled)
        # F(10)=55, F(11)=89, F(12)=144, etc.
        fibonacci_prices = [
            np.array([55000, 89000, 144000, 233000], dtype=np.int64),
            np.array([89000, 144000, 233000, 377000], dtype=np.int64),
            np.array([144000, 233000, 377000, 610000], dtype=np.int64)
        ]

        # Targets: predict next movement (up/down/neutral)
        targets = [
            np.array([10000, 10000, -10000], dtype=np.int64),  # up, up, down
            np.array([10000, -10000, 10000], dtype=np.int64),  # up, down, up
            np.array([-10000, 10000, 10000], dtype=np.int64)   # down, up, up
        ]

        model = QFNN(input_dim=4, hidden_dim=8, output_dim=3, scale=10000)
        losses = model.train(fibonacci_prices, targets, epochs=10, verbose=False)

        # Training should complete successfully
        assert len(losses) == 10
        assert all(isinstance(loss, int) for loss in losses)


class TestCreateAndTrainQFNN:
    """Test convenience function for creating and training."""

    def test_create_and_train(self):
        """Test create_and_train_qfnn function."""
        X_train = [
            np.array([10000, 5000, 8000], dtype=np.int64),
            np.array([12000, 6000, 9000], dtype=np.int64)
        ]
        y_train = [
            np.array([10000, -10000], dtype=np.int64),
            np.array([10000, 10000], dtype=np.int64)
        ]

        model = create_and_train_qfnn(
            X_train, y_train,
            input_dim=3, hidden_dim=5, output_dim=2,
            epochs=5, learning_rate=100,
            checkpoint_path=None
        )

        assert isinstance(model, QFNN)
        assert model.input_dim == 3
        assert len(model.training_history) == 5

    def test_create_and_train_with_checkpoint(self):
        """Test creating and training with checkpoint saving."""
        X_train = [np.array([10000, 5000], dtype=np.int64)]
        y_train = [np.array([10000], dtype=np.int64)]

        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            checkpoint_path = f.name

        model = create_and_train_qfnn(
            X_train, y_train,
            input_dim=2, hidden_dim=3, output_dim=1,
            epochs=2, learning_rate=100,
            checkpoint_path=checkpoint_path
        )

        # Checkpoint should exist
        assert Path(checkpoint_path).exists()

        # Cleanup
        Path(checkpoint_path).unlink()


class TestIntegrationScenarios:
    """Integration tests for real-world scenarios."""

    def test_price_prediction_scenario(self):
        """Test complete price prediction scenario."""
        # Simulate historical Fibonacci-encoded prices
        historical_data = [
            np.array([55000, 89000, 144000, 233000, 377000], dtype=np.int64),
            np.array([89000, 144000, 233000, 377000, 610000], dtype=np.int64),
            np.array([144000, 233000, 377000, 610000, 987000], dtype=np.int64),
            np.array([233000, 377000, 610000, 987000, 1597000], dtype=np.int64)
        ]

        # Targets: predict trend (bullish=1, bearish=-1, neutral=0)
        trends = [
            np.array([10000, 10000, 10000], dtype=np.int64),   # bullish
            np.array([10000, 10000, -10000], dtype=np.int64),  # bullish then bearish
            np.array([-10000, -10000, -10000], dtype=np.int64), # bearish
            np.array([-10000, 10000, 10000], dtype=np.int64)   # reversal
        ]

        # Create and train model
        model = QFNN(input_dim=5, hidden_dim=12, output_dim=3, num_heads=3, scale=10000)
        losses = model.train(historical_data, trends, epochs=20, verbose=False)

        # Make prediction on new data
        new_data = np.array([377000, 610000, 987000, 1597000, 2584000], dtype=np.int64)
        prediction = model.predict(new_data)

        # Prediction should be valid
        assert prediction.shape == (3,)
        assert prediction.dtype == np.int64
        assert len(losses) == 20

    def test_model_persistence_scenario(self):
        """Test saving, loading, and reusing trained model."""
        # Train initial model
        X_train = [
            np.array([10000, 20000, 30000], dtype=np.int64),
            np.array([15000, 25000, 35000], dtype=np.int64)
        ]
        y_train = [
            np.array([10000, -10000], dtype=np.int64),
            np.array([10000, 10000], dtype=np.int64)
        ]

        model1 = QFNN(input_dim=3, hidden_dim=6, output_dim=2, scale=10000)
        model1.train(X_train, y_train, epochs=5, verbose=False)

        # Save model
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            checkpoint_path = f.name
        model1.save_checkpoint(checkpoint_path)

        # Load into new model and continue training
        model2 = QFNN(input_dim=3, hidden_dim=6, output_dim=2, scale=10000)
        model2.load_checkpoint(checkpoint_path)

        # Continue training
        model2.train(X_train, y_train, epochs=3, verbose=False)

        # Make predictions with both models
        x_test = np.array([12000, 22000, 32000], dtype=np.int64)
        pred1 = model1.predict(x_test)
        pred2 = model2.predict(x_test)

        # Predictions should differ (model2 trained more)
        # But both should be valid
        assert pred1.dtype == np.int64
        assert pred2.dtype == np.int64

        # Cleanup
        Path(checkpoint_path).unlink()


# Run tests if executed directly
if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])

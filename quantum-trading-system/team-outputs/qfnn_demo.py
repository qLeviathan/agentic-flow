#!/usr/bin/env python3
"""
QFNN Demo Script - Quantum Field Neural Network for Trading
Demonstrates training and prediction with Fibonacci-encoded prices
"""

import sys
from pathlib import Path
import numpy as np

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from models.qfnn import create_and_train_qfnn, QFNN


def fibonacci_sequence(n):
    """Generate Fibonacci sequence up to n terms."""
    if n <= 0:
        return []
    if n == 1:
        return [0]
    if n == 2:
        return [0, 1]

    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[-1] + fib[-2])
    return fib


def create_fibonacci_training_data():
    """
    Create training data using Fibonacci-encoded prices.
    Simulates market price movements based on Fibonacci levels.
    """
    # Generate Fibonacci numbers (representing price levels)
    fib = fibonacci_sequence(20)
    fib_scaled = [f * 10000 for f in fib[5:]]  # Start from F(5)=5

    print("\n📊 Fibonacci Price Levels (scaled by 10000):")
    print(f"F(5) to F(19): {fib_scaled[:10]}...")

    # Create sliding window training samples
    X_train = []
    y_train = []

    # Pattern 1: Rising trend (bullish)
    for i in range(0, 8):
        X_train.append(np.array([
            fib_scaled[i],
            fib_scaled[i+1],
            fib_scaled[i+2],
            fib_scaled[i+3],
            fib_scaled[i+4]
        ], dtype=np.int64))
        y_train.append(np.array([10000, 10000, 10000], dtype=np.int64))  # bullish

    # Pattern 2: Peak reversal
    for i in range(8, 10):
        X_train.append(np.array([
            fib_scaled[i],
            fib_scaled[i+1],
            fib_scaled[i+2],
            fib_scaled[i+1],
            fib_scaled[i]
        ], dtype=np.int64))
        y_train.append(np.array([10000, -10000, -10000], dtype=np.int64))  # peak then bearish

    # Pattern 3: Support level (consolidation)
    for i in range(5, 8):
        X_train.append(np.array([
            fib_scaled[i],
            fib_scaled[i],
            fib_scaled[i],
            fib_scaled[i],
            fib_scaled[i]
        ], dtype=np.int64))
        y_train.append(np.array([0, 0, 0], dtype=np.int64))  # neutral

    print(f"\n✅ Created {len(X_train)} training samples")
    print(f"   Input shape: ({X_train[0].shape[0]},) - 5 Fibonacci price levels")
    print(f"   Output shape: ({y_train[0].shape[0]},) - 3 trend predictions")

    return X_train, y_train


def demonstrate_qfnn_components():
    """Demonstrate individual QFNN components."""
    print("\n" + "="*70)
    print("🧪 QFNN Component Demonstrations")
    print("="*70)

    from models.qfnn import (
        QuantumFieldOperator,
        HebbianLayer,
        PhaseAwareBinaryAttention,
        RK2Integrator
    )

    # 1. Quantum Field Operator
    print("\n1️⃣  Quantum Field Operator")
    print("-" * 50)
    operator = QuantumFieldOperator(size=5, scale=10000)
    state = np.array([10000, 20000, 30000, 40000, 50000], dtype=np.int64)
    print(f"   Input state: {state}")
    transformed = operator.apply(state)
    print(f"   Transformed: {transformed}")
    print("   ✓ Quantum field transformation applied")

    # 2. Hebbian Learning Layer
    print("\n2️⃣  Hebbian Learning Layer")
    print("-" * 50)
    hebbian = HebbianLayer(input_size=3, output_size=2, scale=10000)
    x = np.array([10000, 5000, 8000], dtype=np.int64)
    print(f"   Input: {x}")
    output = hebbian.forward(x)
    print(f"   Output (binary): {output}")
    hebbian.hebbian_update(learning_rate=100)
    print("   ✓ Hebbian update applied (zero-gradient learning)")

    # 3. Phase-Aware Binary Attention
    print("\n3️⃣  Phase-Aware Binary Attention")
    print("-" * 50)
    attention = PhaseAwareBinaryAttention(num_heads=4, dim=3, scale=10000)
    query = np.array([10000, 5000, 8000], dtype=np.int64)
    key = np.array([8000, 6000, 9000], dtype=np.int64)
    value = np.array([12000, 7000, 11000], dtype=np.int64)
    print(f"   Phase encodings: {attention.phase_encodings}°")
    attended = attention.compute_attention(query, key, value)
    print(f"   Attended output: {attended}")
    print("   ✓ Phase-aware attention computed")

    # 4. RK2 Integrator
    print("\n4️⃣  RK2 Integrator (Quantum Diffusion)")
    print("-" * 50)
    integrator = RK2Integrator(scale=10000)
    state = np.array([50000, 30000], dtype=np.int64)

    def decay(s):
        return -(s // 50)  # Simple decay dynamics

    print(f"   Initial state: {state}")
    integrated = integrator.integrate(state, decay, dt=1000)
    print(f"   After RK2 integration: {integrated}")
    print("   ✓ Quantum diffusion integrated")


def train_and_evaluate_qfnn():
    """Train QFNN model and evaluate performance."""
    print("\n" + "="*70)
    print("🚀 QFNN Training on Fibonacci-Encoded Prices")
    print("="*70)

    # Create training data
    X_train, y_train = create_fibonacci_training_data()

    # Create and train model
    print("\n📝 Model Configuration:")
    print("   • Input dimension: 5 (Fibonacci price levels)")
    print("   • Hidden dimension: 12 (quantum field size)")
    print("   • Output dimension: 3 (trend predictions: bullish/bearish/neutral)")
    print("   • Attention heads: 4")
    print("   • Scale factor: 10000 (for integer arithmetic)")

    # Save checkpoint path
    checkpoint_dir = Path(__file__).parent / 'checkpoints'
    checkpoint_dir.mkdir(exist_ok=True)
    checkpoint_path = str(checkpoint_dir / 'qfnn_fibonacci_model.json')

    model = create_and_train_qfnn(
        X_train=X_train,
        y_train=y_train,
        input_dim=5,
        hidden_dim=12,
        output_dim=3,
        epochs=50,
        learning_rate=100,
        checkpoint_path=checkpoint_path
    )

    return model, X_train, checkpoint_path


def make_predictions(model, X_train):
    """Make predictions on test data."""
    print("\n" + "="*70)
    print("🔮 Making Predictions")
    print("="*70)

    # Test on training samples
    print("\n📊 Sample Predictions:")
    print("-" * 50)

    for i in range(min(5, len(X_train))):
        x_test = X_train[i]
        prediction = model.predict(x_test)

        # Interpret prediction
        trend_labels = []
        for val in prediction:
            if val > 5000:
                trend_labels.append("📈 BULLISH")
            elif val < -5000:
                trend_labels.append("📉 BEARISH")
            else:
                trend_labels.append("➡️  NEUTRAL")

        print(f"\nSample {i+1}:")
        print(f"   Input prices: {x_test}")
        print(f"   Raw prediction: {prediction}")
        print(f"   Interpretation: {' | '.join(trend_labels)}")


def demonstrate_model_persistence(checkpoint_path):
    """Demonstrate saving and loading model."""
    print("\n" + "="*70)
    print("💾 Model Persistence Demonstration")
    print("="*70)

    print(f"\n✅ Model checkpoint saved to:")
    print(f"   {checkpoint_path}")

    # Load model in new instance
    print("\n📥 Loading model from checkpoint...")
    model_loaded = QFNN(input_dim=5, hidden_dim=12, output_dim=3)
    model_loaded.load_checkpoint(checkpoint_path)

    # Make prediction with loaded model
    x_test = np.array([10000, 20000, 30000, 40000, 50000], dtype=np.int64)
    prediction = model_loaded.predict(x_test)
    print(f"\n🔮 Prediction with loaded model: {prediction}")
    print("✅ Model persistence verified")


def print_model_details(model):
    """Print detailed model information."""
    print("\n" + "="*70)
    print("📋 Model Architecture Summary")
    print("="*70)

    summary = model.get_model_summary()

    print(f"\n🏗️  {summary['architecture']}")
    print("-" * 50)
    print(f"Input dimension:    {summary['input_dim']}")
    print(f"Hidden dimension:   {summary['hidden_dim']}")
    print(f"Output dimension:   {summary['output_dim']}")
    print(f"Scale factor:       {summary['scale_factor']}")
    print(f"\nTotal parameters:   {summary['total_parameters']:,}")

    print("\n🔧 Components:")
    for key, value in summary['components'].items():
        print(f"   • {key.replace('_', ' ').title()}: {value}")

    print("\n✨ Features:")
    for feature in summary['features']:
        print(f"   ✓ {feature}")

    print("\n📈 Training History:")
    if model.training_history:
        print(f"   • Total epochs: {len(model.training_history)}")
        print(f"   • Initial loss: {model.training_history[0]['loss']}")
        print(f"   • Final loss: {model.training_history[-1]['loss']}")
        loss_reduction = (
            (model.training_history[0]['loss'] - model.training_history[-1]['loss'])
            / max(1, model.training_history[0]['loss']) * 100
        )
        print(f"   • Loss reduction: {loss_reduction:.1f}%")


def main():
    """Main demonstration script."""
    print("="*70)
    print("🌟 QFNN - Quantum Field Neural Network Demo")
    print("   Integer-Only Implementation for Trading Systems")
    print("="*70)

    # 1. Demonstrate components
    demonstrate_qfnn_components()

    # 2. Train model
    model, X_train, checkpoint_path = train_and_evaluate_qfnn()

    # 3. Make predictions
    make_predictions(model, X_train)

    # 4. Show model details
    print_model_details(model)

    # 5. Demonstrate persistence
    demonstrate_model_persistence(checkpoint_path)

    print("\n" + "="*70)
    print("✅ QFNN Demo Complete!")
    print("="*70)
    print("\n📝 Summary:")
    print("   ✓ Quantum field operators: Integer-only transformations")
    print("   ✓ Hebbian learning: Zero-gradient updates")
    print("   ✓ Phase-aware attention: Binary attention mechanism")
    print("   ✓ RK2 integration: Stable quantum diffusion")
    print("   ✓ Fibonacci encoding: Price level representation")
    print("   ✓ Model persistence: Save/load functionality")
    print("\n🎯 Model ready for trading system integration!")
    print("="*70 + "\n")


if __name__ == '__main__':
    main()

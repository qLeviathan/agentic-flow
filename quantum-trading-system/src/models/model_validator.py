"""
Model Validation Framework - Agent 12 (Zeckendorf: 10101)
=========================================================

Comprehensive validation of trading models with integer-only metrics:
- Accuracy: RMSE, MAE (scaled integers)
- Coherence: Quantum state preservation tracking
- Speed: Benchmark inference and training times
- Comparison: QFNN vs Xi/Psi vs Black-Scholes baseline

Dependencies: Agents 9 (QFNN), 10 (Xi/Psi), 11 (Phase Portraits)
"""

import time
import json
import numpy as np
from typing import List, Dict, Tuple, Optional, Any
from dataclasses import dataclass, asdict
from pathlib import Path
from datetime import datetime
import sys

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from models.qfnn import QFNN
from models.xi_psi import XiPsiModel, PhaseState, SCALE


@dataclass
class AccuracyMetrics:
    """Accuracy metrics (all integer-scaled)"""
    rmse: int  # Root Mean Square Error (scaled)
    mae: int  # Mean Absolute Error (scaled)
    max_error: int  # Maximum absolute error (scaled)
    accuracy_score: int  # Percentage correct predictions (0-10000)
    num_samples: int


@dataclass
class CoherenceMetrics:
    """Quantum coherence metrics for Xi/Psi model"""
    mean_coherence: int  # Mean coherence across trajectory (0-10000)
    coherence_stability: int  # Std deviation of coherence (scaled)
    attractor_count: int  # Number of stable attractors
    phase_transitions: int  # Number of state transitions
    uncertainty_product: int  # Δξ * Δψ (scaled)


@dataclass
class SpeedMetrics:
    """Performance benchmarks (microseconds, integers)"""
    inference_time_us: int  # Single prediction time
    training_step_time_us: int  # Single training step time
    batch_inference_time_us: int  # Batch (100 samples) time
    throughput_per_sec: int  # Predictions per second


@dataclass
class ModelValidationReport:
    """Complete validation report for a model"""
    model_name: str
    model_type: str  # "QFNN", "XiPsi", "BlackScholes"
    timestamp: str
    accuracy: AccuracyMetrics
    coherence: Optional[CoherenceMetrics]
    speed: SpeedMetrics
    validation_status: str  # "PASS", "FAIL", "WARNING"
    notes: List[str]


class ModelValidator:
    """
    Comprehensive model validation framework.

    Validates:
    1. Prediction accuracy (RMSE, MAE with integer math)
    2. Quantum coherence (for Xi/Psi model)
    3. Inference speed (microsecond timing)
    4. Comparison against baselines
    """

    def __init__(self, scale: int = SCALE):
        """
        Initialize validator.

        Args:
            scale: Integer scaling factor (default: 10000)
        """
        self.scale = scale
        self.validation_reports: List[ModelValidationReport] = []

    def validate_qfnn(
        self,
        model: QFNN,
        X_test: List[np.ndarray],
        y_test: List[np.ndarray],
        X_train_sample: Optional[List[np.ndarray]] = None,
        y_train_sample: Optional[List[np.ndarray]] = None
    ) -> ModelValidationReport:
        """
        Validate QFNN model.

        Args:
            model: Trained QFNN instance
            X_test: Test inputs
            y_test: Test targets
            X_train_sample: Optional training sample for speed test
            y_train_sample: Optional training targets for speed test

        Returns:
            ModelValidationReport with complete metrics
        """
        notes = []

        # 1. Accuracy metrics
        accuracy = self._compute_accuracy_metrics(
            model, X_test, y_test, is_qfnn=True
        )
        notes.append(f"RMSE: {accuracy.rmse / self.scale:.4f} (scaled: {accuracy.rmse})")
        notes.append(f"MAE: {accuracy.mae / self.scale:.4f} (scaled: {accuracy.mae})")
        notes.append(f"Accuracy: {accuracy.accuracy_score / 100:.2f}%")

        # 2. Coherence metrics (N/A for QFNN, it doesn't track phase space)
        coherence = None
        notes.append("Coherence: N/A (QFNN doesn't use phase space dynamics)")

        # 3. Speed metrics
        speed = self._benchmark_qfnn_speed(
            model, X_test, X_train_sample, y_train_sample
        )
        notes.append(f"Inference: {speed.inference_time_us} μs per sample")
        notes.append(f"Throughput: {speed.throughput_per_sec} predictions/sec")

        # 4. Validation status
        status = self._determine_status(accuracy, speed)

        report = ModelValidationReport(
            model_name="QFNN",
            model_type="QFNN",
            timestamp=datetime.now().isoformat(),
            accuracy=accuracy,
            coherence=coherence,
            speed=speed,
            validation_status=status,
            notes=notes
        )

        self.validation_reports.append(report)
        return report

    def validate_xi_psi(
        self,
        model: XiPsiModel,
        price_series_test: List[List[int]],
        targets_test: List[int],
        price_series_train: Optional[List[int]] = None
    ) -> ModelValidationReport:
        """
        Validate Xi/Psi phase space model.

        Args:
            model: XiPsiModel instance
            price_series_test: List of price sequences for testing
            targets_test: Target predictions (next price or direction)
            price_series_train: Optional training data for benchmarking

        Returns:
            ModelValidationReport with phase space metrics
        """
        notes = []

        # 1. Accuracy metrics
        accuracy = self._compute_accuracy_metrics_xipsi(
            model, price_series_test, targets_test
        )
        notes.append(f"RMSE: {accuracy.rmse / self.scale:.4f} (scaled: {accuracy.rmse})")
        notes.append(f"MAE: {accuracy.mae / self.scale:.4f} (scaled: {accuracy.mae})")
        notes.append(f"Prediction accuracy: {accuracy.accuracy_score / 100:.2f}%")

        # 2. Coherence metrics (Xi/Psi specialty)
        coherence = self._compute_coherence_metrics_xipsi(
            model, price_series_test
        )
        notes.append(f"Mean coherence: {coherence.mean_coherence / self.scale:.4f}")
        notes.append(f"Attractors found: {coherence.attractor_count}")
        notes.append(f"Phase transitions: {coherence.phase_transitions}")
        notes.append(f"Uncertainty product: {coherence.uncertainty_product}")

        # 3. Speed metrics
        speed = self._benchmark_xipsi_speed(
            model, price_series_test, price_series_train
        )
        notes.append(f"Phase computation: {speed.inference_time_us} μs")
        notes.append(f"Throughput: {speed.throughput_per_sec} phase points/sec")

        # 4. Validation status
        status = self._determine_status(accuracy, speed, coherence)

        report = ModelValidationReport(
            model_name="XiPsi",
            model_type="XiPsi",
            timestamp=datetime.now().isoformat(),
            accuracy=accuracy,
            coherence=coherence,
            speed=speed,
            validation_status=status,
            notes=notes
        )

        self.validation_reports.append(report)
        return report

    def validate_black_scholes_baseline(
        self,
        test_prices: List[int],
        test_targets: List[int]
    ) -> ModelValidationReport:
        """
        Validate Black-Scholes baseline (integer approximation).

        Uses simplified Black-Scholes for comparison baseline.

        Args:
            test_prices: Test price series (scaled integers)
            test_targets: Target values

        Returns:
            ModelValidationReport for baseline
        """
        notes = []

        # Black-Scholes prediction: simple moving average + momentum
        predictions = []
        for i in range(len(test_prices)):
            if i < 5:
                # Not enough data, predict current price
                pred = test_prices[i]
            else:
                # SMA + momentum
                recent = test_prices[max(0, i-10):i]
                sma = sum(recent) // len(recent)
                momentum = (recent[-1] - recent[0]) // len(recent)
                pred = sma + momentum
            predictions.append(pred)

        # 1. Accuracy metrics
        accuracy = self._compute_accuracy_from_predictions(
            predictions, test_targets
        )
        notes.append(f"RMSE: {accuracy.rmse / self.scale:.4f} (scaled: {accuracy.rmse})")
        notes.append(f"MAE: {accuracy.mae / self.scale:.4f} (scaled: {accuracy.mae})")
        notes.append(f"Baseline model: SMA + Momentum")

        # 2. Coherence N/A
        coherence = None
        notes.append("Coherence: N/A (classical model)")

        # 3. Speed metrics (baseline is very fast)
        start = time.perf_counter_ns()
        for _ in range(1000):
            # Simulate single prediction
            recent = test_prices[-10:] if len(test_prices) >= 10 else test_prices
            sma = sum(recent) // len(recent) if recent else 0
        end = time.perf_counter_ns()

        inference_us = (end - start) // 1000  # Convert to microseconds

        speed = SpeedMetrics(
            inference_time_us=inference_us,
            training_step_time_us=0,  # No training for baseline
            batch_inference_time_us=inference_us * 100,
            throughput_per_sec=1_000_000 // max(1, inference_us) if inference_us > 0 else 1_000_000
        )
        notes.append(f"Inference: {speed.inference_time_us} μs")
        notes.append(f"Throughput: {speed.throughput_per_sec} predictions/sec")

        # 4. Status
        status = "PASS"  # Baseline always passes

        report = ModelValidationReport(
            model_name="BlackScholes",
            model_type="BlackScholes",
            timestamp=datetime.now().isoformat(),
            accuracy=accuracy,
            coherence=coherence,
            speed=speed,
            validation_status=status,
            notes=notes
        )

        self.validation_reports.append(report)
        return report

    def compare_models(self) -> Dict[str, Any]:
        """
        Compare all validated models.

        Returns:
            Comparison report with rankings
        """
        if not self.validation_reports:
            return {
                'status': 'ERROR',
                'message': 'No models validated yet'
            }

        # Rank by accuracy (lower RMSE is better)
        by_accuracy = sorted(
            self.validation_reports,
            key=lambda r: r.accuracy.rmse
        )

        # Rank by speed (lower inference time is better)
        by_speed = sorted(
            self.validation_reports,
            key=lambda r: r.speed.inference_time_us
        )

        # Rank by coherence (only Xi/Psi)
        models_with_coherence = [
            r for r in self.validation_reports
            if r.coherence is not None
        ]
        by_coherence = sorted(
            models_with_coherence,
            key=lambda r: r.coherence.mean_coherence,
            reverse=True  # Higher coherence is better
        )

        comparison = {
            'num_models_validated': len(self.validation_reports),
            'timestamp': datetime.now().isoformat(),
            'rankings': {
                'by_accuracy': [
                    {
                        'model': r.model_name,
                        'rmse': r.accuracy.rmse,
                        'rmse_scaled': r.accuracy.rmse / self.scale,
                        'mae': r.accuracy.mae,
                        'mae_scaled': r.accuracy.mae / self.scale
                    }
                    for r in by_accuracy
                ],
                'by_speed': [
                    {
                        'model': r.model_name,
                        'inference_us': r.speed.inference_time_us,
                        'throughput': r.speed.throughput_per_sec
                    }
                    for r in by_speed
                ],
                'by_coherence': [
                    {
                        'model': r.model_name,
                        'mean_coherence': r.coherence.mean_coherence,
                        'coherence_scaled': r.coherence.mean_coherence / self.scale,
                        'attractors': r.coherence.attractor_count
                    }
                    for r in by_coherence
                ] if by_coherence else None
            },
            'winner': {
                'most_accurate': by_accuracy[0].model_name if by_accuracy else None,
                'fastest': by_speed[0].model_name if by_speed else None,
                'most_coherent': by_coherence[0].model_name if by_coherence else None
            },
            'detailed_reports': [
                self._report_to_dict(r) for r in self.validation_reports
            ]
        }

        return comparison

    # ========== Private helper methods ==========

    def _compute_accuracy_metrics(
        self,
        model: QFNN,
        X_test: List[np.ndarray],
        y_test: List[np.ndarray],
        is_qfnn: bool = True
    ) -> AccuracyMetrics:
        """Compute accuracy metrics for QFNN."""
        predictions = []
        targets = []

        for x, y in zip(X_test, y_test):
            pred = model.predict(x)
            predictions.append(pred)
            targets.append(y)

        return self._compute_accuracy_from_arrays(predictions, targets)

    def _compute_accuracy_metrics_xipsi(
        self,
        model: XiPsiModel,
        price_series_test: List[List[int]],
        targets_test: List[int]
    ) -> AccuracyMetrics:
        """Compute accuracy metrics for Xi/Psi model."""
        predictions = []

        for price_series in price_series_test:
            # Compute phase point and use momentum as prediction
            phase_point = model.compute_phase_point(
                price_series,
                time_index=len(price_series) - 1
            )
            # Predict next price based on current + momentum
            pred = price_series[-1] + (phase_point.psi // self.scale)
            predictions.append(pred)

        return self._compute_accuracy_from_predictions(predictions, targets_test)

    def _compute_accuracy_from_arrays(
        self,
        predictions: List[np.ndarray],
        targets: List[np.ndarray]
    ) -> AccuracyMetrics:
        """Compute accuracy from prediction and target arrays."""
        squared_errors = []
        absolute_errors = []
        correct_count = 0

        for pred, target in zip(predictions, targets):
            # Compute errors (element-wise if arrays)
            error = target - pred
            squared_errors.extend((error ** 2).flatten().tolist())
            absolute_errors.extend(np.abs(error).flatten().tolist())

            # Count correct sign predictions
            if np.sign(pred).sum() == np.sign(target).sum():
                correct_count += 1

        num_samples = len(predictions)

        # Handle empty case
        if not squared_errors or num_samples == 0:
            return AccuracyMetrics(
                rmse=0,
                mae=0,
                max_error=0,
                accuracy_score=0,
                num_samples=0
            )

        # RMSE (integer square root)
        mse = sum(squared_errors) // len(squared_errors)
        rmse = self._integer_sqrt(mse)

        # MAE
        mae = sum(absolute_errors) // len(absolute_errors)

        # Max error
        max_error = max(absolute_errors)

        # Accuracy score
        accuracy_score = (correct_count * self.scale) // num_samples

        return AccuracyMetrics(
            rmse=rmse,
            mae=mae,
            max_error=max_error,
            accuracy_score=accuracy_score,
            num_samples=num_samples
        )

    def _compute_accuracy_from_predictions(
        self,
        predictions: List[int],
        targets: List[int]
    ) -> AccuracyMetrics:
        """Compute accuracy from integer prediction lists."""
        squared_errors = []
        absolute_errors = []
        correct_count = 0

        for pred, target in zip(predictions, targets):
            error = target - pred
            squared_errors.append(error ** 2)
            absolute_errors.append(abs(error))

            # Check if prediction sign matches target sign
            if (pred > 0 and target > 0) or (pred < 0 and target < 0) or (pred == target):
                correct_count += 1

        num_samples = len(predictions)

        # RMSE
        mse = sum(squared_errors) // num_samples if num_samples > 0 else 0
        rmse = self._integer_sqrt(mse)

        # MAE
        mae = sum(absolute_errors) // num_samples if num_samples > 0 else 0

        # Max error
        max_error = max(absolute_errors) if absolute_errors else 0

        # Accuracy score
        accuracy_score = (correct_count * self.scale) // num_samples if num_samples > 0 else 0

        return AccuracyMetrics(
            rmse=rmse,
            mae=mae,
            max_error=max_error,
            accuracy_score=accuracy_score,
            num_samples=num_samples
        )

    def _compute_coherence_metrics_xipsi(
        self,
        model: XiPsiModel,
        price_series_list: List[List[int]]
    ) -> CoherenceMetrics:
        """Compute quantum coherence metrics for Xi/Psi."""
        all_coherences = []
        all_attractors = []
        total_transitions = 0
        all_uncertainty_products = []

        for price_series in price_series_list:
            # Evolve phase space
            portrait = model.evolve_phase_space(
                price_series,
                num_steps=len(price_series)
            )

            # Collect coherences
            coherences = [p.coherence for p in portrait.points]
            all_coherences.extend(coherences)

            # Count attractors
            all_attractors.append(len(portrait.attractors))

            # Count state transitions
            prev_state = None
            for point in portrait.points:
                if prev_state is not None and point.state != prev_state:
                    total_transitions += 1
                prev_state = point.state

            # Uncertainty product
            if len(price_series) > 1:
                lucas_times = [model.get_lucas_time(i) for i in range(len(price_series))]
                _, _, uncertainty_prod = model.uncertainty_relation(
                    price_series, lucas_times
                )
                all_uncertainty_products.append(uncertainty_prod)

        # Aggregate metrics
        mean_coherence = sum(all_coherences) // len(all_coherences) if all_coherences else 0

        # Coherence stability (integer std deviation)
        variance = sum(
            (c - mean_coherence) ** 2 for c in all_coherences
        ) // len(all_coherences) if all_coherences else 0
        coherence_stability = self._integer_sqrt(variance)

        attractor_count = sum(all_attractors) // len(all_attractors) if all_attractors else 0

        uncertainty_product = (
            sum(all_uncertainty_products) // len(all_uncertainty_products)
            if all_uncertainty_products else 0
        )

        return CoherenceMetrics(
            mean_coherence=mean_coherence,
            coherence_stability=coherence_stability,
            attractor_count=attractor_count,
            phase_transitions=total_transitions,
            uncertainty_product=uncertainty_product
        )

    def _benchmark_qfnn_speed(
        self,
        model: QFNN,
        X_test: List[np.ndarray],
        X_train_sample: Optional[List[np.ndarray]],
        y_train_sample: Optional[List[np.ndarray]]
    ) -> SpeedMetrics:
        """Benchmark QFNN speed."""
        # Single inference
        if X_test:
            start = time.perf_counter_ns()
            for _ in range(100):
                _ = model.predict(X_test[0])
            end = time.perf_counter_ns()
            inference_us = (end - start) // (100 * 1000)  # Average per call, in μs
        else:
            inference_us = 0

        # Training step speed
        if X_train_sample and y_train_sample:
            start = time.perf_counter_ns()
            for _ in range(10):
                _ = model.train_step(X_train_sample[0], y_train_sample[0])
            end = time.perf_counter_ns()
            training_us = (end - start) // (10 * 1000)
        else:
            training_us = 0

        # Batch inference
        if len(X_test) >= 100:
            start = time.perf_counter_ns()
            for x in X_test[:100]:
                _ = model.predict(x)
            end = time.perf_counter_ns()
            batch_us = (end - start) // 1000
        else:
            batch_us = inference_us * 100

        # Throughput
        throughput = 1_000_000 // max(1, inference_us) if inference_us > 0 else 1_000_000

        return SpeedMetrics(
            inference_time_us=inference_us,
            training_step_time_us=training_us,
            batch_inference_time_us=batch_us,
            throughput_per_sec=throughput
        )

    def _benchmark_xipsi_speed(
        self,
        model: XiPsiModel,
        price_series_test: List[List[int]],
        price_series_train: Optional[List[int]]
    ) -> SpeedMetrics:
        """Benchmark Xi/Psi speed."""
        # Single phase computation
        if price_series_test:
            test_series = price_series_test[0]
            start = time.perf_counter_ns()
            for _ in range(100):
                _ = model.compute_phase_point(test_series, len(test_series) - 1)
            end = time.perf_counter_ns()
            inference_us = (end - start) // (100 * 1000)
        else:
            inference_us = 0

        # Phase space evolution (training equivalent)
        if price_series_train and len(price_series_train) > 10:
            start = time.perf_counter_ns()
            _ = model.evolve_phase_space(price_series_train[:10], num_steps=10)
            end = time.perf_counter_ns()
            training_us = (end - start) // 1000
        else:
            training_us = 0

        # Batch processing
        if len(price_series_test) >= 100:
            start = time.perf_counter_ns()
            for series in price_series_test[:100]:
                _ = model.compute_phase_point(series, len(series) - 1)
            end = time.perf_counter_ns()
            batch_us = (end - start) // 1000
        else:
            batch_us = inference_us * 100

        # Throughput
        throughput = 1_000_000 // max(1, inference_us) if inference_us > 0 else 1_000_000

        return SpeedMetrics(
            inference_time_us=inference_us,
            training_step_time_us=training_us,
            batch_inference_time_us=batch_us,
            throughput_per_sec=throughput
        )

    def _determine_status(
        self,
        accuracy: AccuracyMetrics,
        speed: SpeedMetrics,
        coherence: Optional[CoherenceMetrics] = None
    ) -> str:
        """Determine validation status."""
        # Thresholds
        MAX_ACCEPTABLE_RMSE = self.scale * 100  # 100 units scaled
        MIN_ACCEPTABLE_ACCURACY = self.scale // 4  # 25%
        MAX_ACCEPTABLE_INFERENCE_US = 10000  # 10ms
        MIN_COHERENCE = self.scale // 2  # 0.50

        # Check accuracy
        if accuracy.rmse > MAX_ACCEPTABLE_RMSE:
            return "FAIL"

        if accuracy.accuracy_score < MIN_ACCEPTABLE_ACCURACY:
            return "WARNING"

        # Check speed
        if speed.inference_time_us > MAX_ACCEPTABLE_INFERENCE_US:
            return "WARNING"

        # Check coherence (if applicable)
        if coherence and coherence.mean_coherence < MIN_COHERENCE:
            return "WARNING"

        return "PASS"

    def _integer_sqrt(self, n: int) -> int:
        """
        Integer square root using Newton's method.

        Args:
            n: Non-negative integer

        Returns:
            floor(sqrt(n))
        """
        if n < 0:
            return 0
        if n == 0:
            return 0

        # Initial guess
        x = n
        y = (x + 1) // 2

        # Newton iteration
        while y < x:
            x = y
            y = (x + n // x) // 2

        return x

    def _report_to_dict(self, report: ModelValidationReport) -> Dict[str, Any]:
        """Convert report to dictionary."""
        report_dict = asdict(report)
        return report_dict

    def save_validation_report(self, output_path: str) -> None:
        """
        Save validation reports to JSON file.

        Args:
            output_path: Path to save report
        """
        comparison = self.compare_models()

        output_file = Path(output_path)
        output_file.parent.mkdir(parents=True, exist_ok=True)

        with open(output_file, 'w') as f:
            json.dump(comparison, f, indent=2)

        print(f"✅ Validation report saved to: {output_path}")

    def print_summary(self) -> None:
        """Print validation summary to console."""
        if not self.validation_reports:
            print("No models validated yet.")
            return

        print()
        print("=" * 80)
        print("MODEL VALIDATION SUMMARY - Agent 12 (Zeckendorf: 10101)")
        print("=" * 80)
        print()

        for report in self.validation_reports:
            print(f"Model: {report.model_name} ({report.model_type})")
            print(f"Status: {report.validation_status}")
            print(f"Timestamp: {report.timestamp}")
            print()

            # Accuracy
            acc = report.accuracy
            print(f"  Accuracy Metrics:")
            print(f"    RMSE: {acc.rmse / self.scale:.4f} (scaled: {acc.rmse})")
            print(f"    MAE: {acc.mae / self.scale:.4f} (scaled: {acc.mae})")
            print(f"    Max Error: {acc.max_error / self.scale:.4f}")
            print(f"    Accuracy Score: {acc.accuracy_score / 100:.2f}%")
            print(f"    Samples: {acc.num_samples}")
            print()

            # Coherence (if available)
            if report.coherence:
                coh = report.coherence
                print(f"  Coherence Metrics:")
                print(f"    Mean Coherence: {coh.mean_coherence / self.scale:.4f}")
                print(f"    Stability: {coh.coherence_stability / self.scale:.4f}")
                print(f"    Attractors: {coh.attractor_count}")
                print(f"    Phase Transitions: {coh.phase_transitions}")
                print(f"    Uncertainty Product: {coh.uncertainty_product}")
                print()

            # Speed
            speed = report.speed
            print(f"  Speed Metrics:")
            print(f"    Inference: {speed.inference_time_us} μs")
            print(f"    Training Step: {speed.training_step_time_us} μs")
            print(f"    Batch (100): {speed.batch_inference_time_us} μs")
            print(f"    Throughput: {speed.throughput_per_sec:,} predictions/sec")
            print()

            print("  Notes:")
            for note in report.notes:
                print(f"    - {note}")
            print()
            print("-" * 80)
            print()

        # Print comparison
        comparison = self.compare_models()
        print("=" * 80)
        print("MODEL COMPARISON")
        print("=" * 80)
        print()

        if comparison['winner']['most_accurate']:
            print(f"🏆 Most Accurate: {comparison['winner']['most_accurate']}")
        if comparison['winner']['fastest']:
            print(f"⚡ Fastest: {comparison['winner']['fastest']}")
        if comparison['winner']['most_coherent']:
            print(f"🌀 Most Coherent: {comparison['winner']['most_coherent']}")

        print()
        print("=" * 80)


def main():
    """Example validation workflow."""
    print("ModelValidator - Agent 12 (Zeckendorf: 10101)")
    print("=" * 80)
    print()
    print("This module provides comprehensive model validation.")
    print("Import and use the ModelValidator class to validate your models.")
    print()
    print("Example usage:")
    print()
    print("  from models.model_validator import ModelValidator")
    print("  from models.qfnn import QFNN")
    print("  from models.xi_psi import XiPsiModel")
    print()
    print("  validator = ModelValidator()")
    print("  ")
    print("  # Validate QFNN")
    print("  qfnn_report = validator.validate_qfnn(model, X_test, y_test)")
    print("  ")
    print("  # Validate Xi/Psi")
    print("  xipsi_report = validator.validate_xi_psi(model, price_series, targets)")
    print("  ")
    print("  # Compare models")
    print("  comparison = validator.compare_models()")
    print("  validator.print_summary()")
    print()


if __name__ == "__main__":
    main()

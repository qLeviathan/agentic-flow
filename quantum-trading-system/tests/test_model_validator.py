"""
Test Suite for Model Validator - Agent 12 (Zeckendorf: 10101)
==============================================================

Comprehensive tests for model validation framework.
"""

import pytest
import numpy as np
import json
import tempfile
from pathlib import Path
import sys

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from models.model_validator import (
    ModelValidator,
    AccuracyMetrics,
    CoherenceMetrics,
    SpeedMetrics,
    ModelValidationReport
)
from models.qfnn import QFNN
from models.xi_psi import XiPsiModel, SCALE


class TestAccuracyMetrics:
    """Test accuracy metrics calculations."""

    def test_accuracy_metrics_creation(self):
        """Test creating accuracy metrics."""
        metrics = AccuracyMetrics(
            rmse=5000,
            mae=3000,
            max_error=8000,
            accuracy_score=7500,
            num_samples=100
        )

        assert metrics.rmse == 5000
        assert metrics.mae == 3000
        assert metrics.max_error == 8000
        assert metrics.accuracy_score == 7500
        assert metrics.num_samples == 100


class TestCoherenceMetrics:
    """Test coherence metrics calculations."""

    def test_coherence_metrics_creation(self):
        """Test creating coherence metrics."""
        metrics = CoherenceMetrics(
            mean_coherence=8500,
            coherence_stability=500,
            attractor_count=3,
            phase_transitions=12,
            uncertainty_product=150
        )

        assert metrics.mean_coherence == 8500
        assert metrics.coherence_stability == 500
        assert metrics.attractor_count == 3
        assert metrics.phase_transitions == 12
        assert metrics.uncertainty_product == 150


class TestSpeedMetrics:
    """Test speed metrics calculations."""

    def test_speed_metrics_creation(self):
        """Test creating speed metrics."""
        metrics = SpeedMetrics(
            inference_time_us=150,
            training_step_time_us=500,
            batch_inference_time_us=15000,
            throughput_per_sec=6666
        )

        assert metrics.inference_time_us == 150
        assert metrics.training_step_time_us == 500
        assert metrics.batch_inference_time_us == 15000
        assert metrics.throughput_per_sec == 6666


class TestModelValidator:
    """Test ModelValidator class."""

    def test_initialization(self):
        """Test validator initialization."""
        validator = ModelValidator(scale=10000)

        assert validator.scale == 10000
        assert len(validator.validation_reports) == 0

    def test_integer_sqrt(self):
        """Test integer square root function."""
        validator = ModelValidator()

        assert validator._integer_sqrt(0) == 0
        assert validator._integer_sqrt(1) == 1
        assert validator._integer_sqrt(4) == 2
        assert validator._integer_sqrt(9) == 3
        assert validator._integer_sqrt(16) == 4
        assert validator._integer_sqrt(25) == 5
        assert validator._integer_sqrt(100) == 10
        assert validator._integer_sqrt(10000) == 100

        # Non-perfect squares
        assert validator._integer_sqrt(5) == 2
        assert validator._integer_sqrt(10) == 3
        assert validator._integer_sqrt(99) == 9

    def test_compute_accuracy_from_predictions(self):
        """Test accuracy computation from predictions."""
        validator = ModelValidator(scale=10000)

        predictions = [10000, 20000, 30000, 40000]
        targets = [10500, 19500, 30500, 39500]

        metrics = validator._compute_accuracy_from_predictions(predictions, targets)

        assert metrics.num_samples == 4
        assert metrics.rmse > 0
        assert metrics.mae > 0
        assert metrics.max_error > 0
        assert 0 <= metrics.accuracy_score <= 10000

    def test_validate_qfnn(self):
        """Test QFNN validation."""
        validator = ModelValidator(scale=10000)

        # Create small QFNN model
        model = QFNN(input_dim=3, hidden_dim=5, output_dim=2, scale=10000)

        # Create test data
        X_test = [
            np.array([10000, 5000, 8000], dtype=np.int64),
            np.array([12000, 6000, 9000], dtype=np.int64)
        ]
        y_test = [
            np.array([10000, -10000], dtype=np.int64),
            np.array([10000, 10000], dtype=np.int64)
        ]

        # Train briefly
        model.train(X_test, y_test, epochs=2, verbose=False)

        # Validate
        report = validator.validate_qfnn(model, X_test, y_test)

        assert report.model_name == "QFNN"
        assert report.model_type == "QFNN"
        assert report.accuracy is not None
        assert report.coherence is None  # QFNN doesn't have coherence
        assert report.speed is not None
        assert report.validation_status in ["PASS", "WARNING", "FAIL"]
        assert len(report.notes) > 0

    def test_validate_xi_psi(self):
        """Test Xi/Psi validation."""
        validator = ModelValidator(scale=10000)

        # Create Xi/Psi model
        model = XiPsiModel(scale=10000)

        # Create test data
        price_series_test = [
            [100000, 105000, 110000, 108000, 112000],
            [150000, 148000, 152000, 155000, 153000]
        ]

        # Targets: next price
        targets_test = [115000, 156000]

        # Validate
        report = validator.validate_xi_psi(
            model, price_series_test, targets_test
        )

        assert report.model_name == "XiPsi"
        assert report.model_type == "XiPsi"
        assert report.accuracy is not None
        assert report.coherence is not None  # Xi/Psi has coherence metrics
        assert report.speed is not None
        assert report.validation_status in ["PASS", "WARNING", "FAIL"]

    def test_validate_black_scholes_baseline(self):
        """Test Black-Scholes baseline validation."""
        validator = ModelValidator(scale=10000)

        # Create test data
        test_prices = [100000 + i * 1000 for i in range(20)]
        test_targets = [100000 + i * 1200 for i in range(20)]

        # Validate
        report = validator.validate_black_scholes_baseline(
            test_prices, test_targets
        )

        assert report.model_name == "BlackScholes"
        assert report.model_type == "BlackScholes"
        assert report.accuracy is not None
        assert report.coherence is None  # Classical model, no coherence
        assert report.speed is not None
        assert report.validation_status == "PASS"  # Baseline always passes

    def test_compare_models(self):
        """Test model comparison."""
        validator = ModelValidator(scale=10000)

        # Add mock reports
        validator.validation_reports = [
            ModelValidationReport(
                model_name="Model1",
                model_type="QFNN",
                timestamp="2025-01-01T00:00:00",
                accuracy=AccuracyMetrics(5000, 3000, 8000, 7500, 100),
                coherence=None,
                speed=SpeedMetrics(100, 500, 10000, 10000),
                validation_status="PASS",
                notes=[]
            ),
            ModelValidationReport(
                model_name="Model2",
                model_type="XiPsi",
                timestamp="2025-01-01T00:00:00",
                accuracy=AccuracyMetrics(6000, 3500, 9000, 7000, 100),
                coherence=CoherenceMetrics(8500, 500, 3, 12, 150),
                speed=SpeedMetrics(150, 600, 15000, 6666),
                validation_status="PASS",
                notes=[]
            )
        ]

        comparison = validator.compare_models()

        assert comparison['num_models_validated'] == 2
        assert 'rankings' in comparison
        assert 'by_accuracy' in comparison['rankings']
        assert 'by_speed' in comparison['rankings']
        assert 'by_coherence' in comparison['rankings']
        assert 'winner' in comparison
        assert comparison['winner']['most_accurate'] is not None
        assert comparison['winner']['fastest'] is not None

    def test_compare_models_empty(self):
        """Test comparison with no models."""
        validator = ModelValidator(scale=10000)

        comparison = validator.compare_models()

        assert comparison['status'] == 'ERROR'
        assert 'message' in comparison

    def test_save_validation_report(self):
        """Test saving validation report."""
        validator = ModelValidator(scale=10000)

        # Add mock report
        validator.validation_reports = [
            ModelValidationReport(
                model_name="TestModel",
                model_type="QFNN",
                timestamp="2025-01-01T00:00:00",
                accuracy=AccuracyMetrics(5000, 3000, 8000, 7500, 100),
                coherence=None,
                speed=SpeedMetrics(100, 500, 10000, 10000),
                validation_status="PASS",
                notes=["Test note"]
            )
        ]

        with tempfile.TemporaryDirectory() as tmpdir:
            output_path = Path(tmpdir) / "validation_report.json"
            validator.save_validation_report(str(output_path))

            # Verify file was created
            assert output_path.exists()

            # Verify contents
            with open(output_path) as f:
                data = json.load(f)

            assert 'num_models_validated' in data
            assert data['num_models_validated'] == 1
            assert 'rankings' in data

    def test_determine_status_pass(self):
        """Test status determination - PASS."""
        validator = ModelValidator(scale=10000)

        accuracy = AccuracyMetrics(5000, 3000, 8000, 7500, 100)
        speed = SpeedMetrics(100, 500, 10000, 10000)
        coherence = CoherenceMetrics(8500, 500, 3, 12, 150)

        status = validator._determine_status(accuracy, speed, coherence)
        assert status == "PASS"

    def test_determine_status_fail_accuracy(self):
        """Test status determination - FAIL due to accuracy."""
        validator = ModelValidator(scale=10000)

        # Very high RMSE
        accuracy = AccuracyMetrics(2000000, 1000000, 3000000, 7500, 100)
        speed = SpeedMetrics(100, 500, 10000, 10000)

        status = validator._determine_status(accuracy, speed)
        assert status == "FAIL"

    def test_determine_status_warning_speed(self):
        """Test status determination - WARNING due to speed."""
        validator = ModelValidator(scale=10000)

        accuracy = AccuracyMetrics(5000, 3000, 8000, 7500, 100)
        # Very slow inference
        speed = SpeedMetrics(20000, 50000, 2000000, 50)

        status = validator._determine_status(accuracy, speed)
        assert status == "WARNING"

    def test_determine_status_warning_coherence(self):
        """Test status determination - WARNING due to coherence."""
        validator = ModelValidator(scale=10000)

        accuracy = AccuracyMetrics(5000, 3000, 8000, 7500, 100)
        speed = SpeedMetrics(100, 500, 10000, 10000)
        # Low coherence
        coherence = CoherenceMetrics(3000, 2000, 1, 50, 50)

        status = validator._determine_status(accuracy, speed, coherence)
        assert status == "WARNING"


class TestIntegrationScenarios:
    """Integration tests for validation workflows."""

    def test_full_qfnn_validation_workflow(self):
        """Test complete QFNN validation workflow."""
        validator = ModelValidator(scale=10000)

        # Create and train QFNN
        model = QFNN(input_dim=4, hidden_dim=8, output_dim=2, scale=10000)

        X_train = [
            np.array([10000, 5000, 8000, 12000], dtype=np.int64),
            np.array([12000, 6000, 9000, 13000], dtype=np.int64),
            np.array([8000, 4000, 7000, 11000], dtype=np.int64)
        ]
        y_train = [
            np.array([10000, -10000], dtype=np.int64),
            np.array([10000, 10000], dtype=np.int64),
            np.array([-10000, -10000], dtype=np.int64)
        ]

        model.train(X_train, y_train, epochs=5, verbose=False)

        # Validate
        report = validator.validate_qfnn(
            model, X_train, y_train, X_train[:1], y_train[:1]
        )

        assert report.accuracy.num_samples == 3
        assert report.speed.inference_time_us > 0
        assert report.validation_status in ["PASS", "WARNING", "FAIL"]

    def test_full_xipsi_validation_workflow(self):
        """Test complete Xi/Psi validation workflow."""
        validator = ModelValidator(scale=10000)

        # Create Xi/Psi model
        model = XiPsiModel(scale=10000)

        # Generate test data
        price_series_test = []
        targets_test = []

        for i in range(5):
            base_price = 100000 + i * 10000
            series = [base_price + j * 1000 for j in range(10)]
            target = series[-1] + 2000  # Next price

            price_series_test.append(series)
            targets_test.append(target)

        # Validate
        report = validator.validate_xi_psi(
            model, price_series_test, targets_test, price_series_test[0]
        )

        assert report.accuracy.num_samples == 5
        assert report.coherence is not None
        assert report.coherence.mean_coherence > 0
        assert report.speed.inference_time_us > 0

    def test_compare_all_models(self):
        """Test comparing all three model types."""
        validator = ModelValidator(scale=10000)

        # 1. Validate QFNN
        qfnn = QFNN(input_dim=3, hidden_dim=5, output_dim=2, scale=10000)
        X_test = [np.array([10000, 5000, 8000], dtype=np.int64)]
        y_test = [np.array([10000, -10000], dtype=np.int64)]
        qfnn.train(X_test, y_test, epochs=2, verbose=False)
        validator.validate_qfnn(qfnn, X_test, y_test)

        # 2. Validate Xi/Psi
        xipsi = XiPsiModel(scale=10000)
        price_series = [[100000, 105000, 110000]]
        targets = [115000]
        validator.validate_xi_psi(xipsi, price_series, targets)

        # 3. Validate Black-Scholes
        test_prices = [100000, 105000, 110000]
        test_targets = [115000, 120000, 125000]
        validator.validate_black_scholes_baseline(test_prices, test_targets)

        # Compare
        comparison = validator.compare_models()

        assert comparison['num_models_validated'] == 3
        assert len(comparison['rankings']['by_accuracy']) == 3
        assert len(comparison['rankings']['by_speed']) == 3
        assert comparison['winner']['most_accurate'] is not None
        assert comparison['winner']['fastest'] is not None

    def test_print_summary(self, capsys):
        """Test printing validation summary."""
        validator = ModelValidator(scale=10000)

        # Add mock report
        validator.validation_reports = [
            ModelValidationReport(
                model_name="TestModel",
                model_type="QFNN",
                timestamp="2025-01-01T00:00:00",
                accuracy=AccuracyMetrics(5000, 3000, 8000, 7500, 100),
                coherence=None,
                speed=SpeedMetrics(100, 500, 10000, 10000),
                validation_status="PASS",
                notes=["Test completed successfully"]
            )
        ]

        # Print summary
        validator.print_summary()

        # Capture output
        captured = capsys.readouterr()

        assert "MODEL VALIDATION SUMMARY" in captured.out
        assert "TestModel" in captured.out
        assert "PASS" in captured.out
        assert "Accuracy Metrics" in captured.out
        assert "Speed Metrics" in captured.out


class TestEdgeCases:
    """Test edge cases and error handling."""

    def test_empty_test_data(self):
        """Test validation with empty test data."""
        validator = ModelValidator(scale=10000)

        model = QFNN(input_dim=3, hidden_dim=5, output_dim=2, scale=10000)
        X_test = []
        y_test = []

        # Should handle gracefully
        report = validator.validate_qfnn(model, X_test, y_test)
        assert report.accuracy.num_samples == 0

    def test_single_sample(self):
        """Test validation with single sample."""
        validator = ModelValidator(scale=10000)

        model = QFNN(input_dim=2, hidden_dim=3, output_dim=1, scale=10000)
        X_test = [np.array([10000, 5000], dtype=np.int64)]
        y_test = [np.array([10000], dtype=np.int64)]

        model.train(X_test, y_test, epochs=1, verbose=False)
        report = validator.validate_qfnn(model, X_test, y_test)

        assert report.accuracy.num_samples == 1

    def test_large_errors(self):
        """Test handling of large prediction errors."""
        validator = ModelValidator(scale=10000)

        # Predictions very far from targets
        predictions = [10000, 20000, 30000]
        targets = [500000, 600000, 700000]

        metrics = validator._compute_accuracy_from_predictions(predictions, targets)

        assert metrics.rmse > 0
        assert metrics.mae > 0
        assert metrics.max_error > 400000


def run_tests():
    """Run all tests."""
    pytest.main([__file__, '-v', '--tb=short'])


if __name__ == '__main__':
    run_tests()

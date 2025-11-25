"""
Tests for Integer Operations Validator - Agent 8 (Zeckendorf: 10000)

Comprehensive test suite for integer-only validation.
"""

import pytest
import json
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch

import sys
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from encoders.integer_validator import IntegerValidator


class TestIntegerValidator:
    """Test suite for IntegerValidator class."""

    @pytest.fixture
    def temp_project(self, tmp_path):
        """Create temporary project structure."""
        project = tmp_path / "test_project"
        src = project / "src" / "encoders"
        src.mkdir(parents=True)
        return project

    @pytest.fixture
    def validator(self, temp_project):
        """Create IntegerValidator instance with temp project."""
        return IntegerValidator(str(temp_project))

    def test_init(self, validator, temp_project):
        """Test validator initialization."""
        assert validator.project_root == Path(temp_project)
        assert validator.files_scanned == 0
        assert validator.total_lines == 0
        assert len(validator.errors) == 0
        assert len(validator.warnings) == 0

    def test_is_power_of_10(self, validator):
        """Test power of 10 detection."""
        assert validator._is_power_of_10(1) is True
        assert validator._is_power_of_10(10) is True
        assert validator._is_power_of_10(100) is True
        assert validator._is_power_of_10(1000) is True
        assert validator._is_power_of_10(10000) is True
        assert validator._is_power_of_10(100000) is True

        assert validator._is_power_of_10(0) is False
        assert validator._is_power_of_10(-10) is False
        assert validator._is_power_of_10(15) is False
        assert validator._is_power_of_10(123) is False
        assert validator._is_power_of_10(1001) is False

    def test_is_safe_line(self, validator):
        """Test safe line detection (comments, etc.)."""
        assert validator._is_safe_line("# This is a comment") is True
        assert validator._is_safe_line("   # Indented comment") is True
        assert validator._is_safe_line('"""Docstring"""') is True
        assert validator._is_safe_line("'''Another docstring'''") is True
        assert validator._is_safe_line("") is True
        assert validator._is_safe_line("   ") is True

        assert validator._is_safe_line("price = 123.45") is False
        assert validator._is_safe_line("x = float(y)") is False

    def test_detect_float_literals(self, temp_project, validator):
        """Test detection of float literals."""
        # Create file with float literals
        src_file = temp_project / "src" / "encoders" / "test.py"
        src_file.write_text("""
# This should be detected
price = 123.45
ratio = 0.236
value = .5
end = 10.

# This should be safe (in comment: 123.45)
x = 10000  # Scale by 10000
""")

        validator._scan_file_for_floats(src_file)

        # Should detect 4 float literals (excluding comment)
        float_errors = [e for e in validator.errors if 'float_leakage' in e['type']]
        assert len(float_errors) >= 3  # At least 123.45, 0.236, .5

    def test_detect_float_keyword(self, temp_project, validator):
        """Test detection of float keyword."""
        src_file = temp_project / "src" / "encoders" / "test.py"
        src_file.write_text("""
x = float(123)
y = np.float64(456)
z = astype('float32')
""")

        validator._scan_file_for_floats(src_file)

        float_errors = [e for e in validator.errors if 'float_leakage' in e['type']]
        assert len(float_errors) >= 2  # float() and np.float64()

    def test_safe_integer_division(self, temp_project, validator):
        """Test that integer division is not flagged."""
        src_file = temp_project / "src" / "encoders" / "test.py"
        src_file.write_text("""
# Integer division - should be safe
x = 10000 // 236
y = divmod(1000, 3)
z = int(500)
a = value.astype(int)
b = data.astype('int64')
""")

        validator._scan_file_for_floats(src_file)

        # Should have minimal or no errors
        float_errors = [e for e in validator.errors if 'float_leakage' in e['type']]
        assert len(float_errors) == 0  # All should be safe

    def test_fibonacci_sequence_constants(self, validator):
        """Test Fibonacci sequence constants."""
        expected = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597]
        assert validator.FIBONACCI_A000045 == expected

    def test_lucas_sequence_constants(self, validator):
        """Test Lucas sequence constants."""
        expected = [2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123, 199, 322, 521, 843, 1364, 2207]
        assert validator.LUCAS_A000032 == expected

    def test_valid_scale_factors(self, validator):
        """Test valid scaling factors."""
        assert 100 in validator.VALID_SCALE_FACTORS
        assert 1000 in validator.VALID_SCALE_FACTORS
        assert 10000 in validator.VALID_SCALE_FACTORS
        assert 100000 in validator.VALID_SCALE_FACTORS

    def test_scan_python_files_missing_dir(self, validator):
        """Test scanning when source directory doesn't exist."""
        validator._scan_python_files()

        # Should add warning about missing directory
        warnings = [w for w in validator.warnings if w['type'] == 'missing_directory']
        assert len(warnings) == 1

    def test_scan_python_files_empty_dir(self, temp_project, validator):
        """Test scanning empty directory."""
        (temp_project / "src").mkdir(parents=True, exist_ok=True)

        validator._scan_python_files()

        # Should scan 0 files
        assert validator.files_scanned == 0

    def test_validate_fibonacci_missing(self, validator):
        """Test Fibonacci validation when file is missing."""
        validator._validate_fibonacci()

        # Should add warning about missing file
        warnings = [w for w in validator.warnings if 'fibonacci' in str(w).lower()]
        assert len(warnings) >= 1

    def test_validate_lucas_missing(self, validator):
        """Test Lucas validation when file is missing."""
        validator._validate_lucas()

        # Should add warning about missing file
        warnings = [w for w in validator.warnings if 'lucas' in str(w).lower()]
        assert len(warnings) >= 1

    def test_validate_zeckendorf_missing(self, validator):
        """Test Zeckendorf validation when file is missing."""
        validator._validate_zeckendorf()

        # Should add warning about missing file
        warnings = [w for w in validator.warnings if 'zeckendorf' in str(w).lower()]
        assert len(warnings) >= 1

    def test_generate_report_pass(self, validator):
        """Test report generation with no errors."""
        report = validator._generate_report()

        assert report['status'] == 'PASS'
        assert report['agent'] == 'Agent 8'
        assert report['zeckendorf_address'] == '10000'
        assert 'timestamp' in report
        assert report['statistics']['critical_errors'] == 0
        assert 'recommendation' in report
        assert 'INTEGER VALIDATION PASS' in report['recommendation']

    def test_generate_report_fail(self, validator):
        """Test report generation with critical errors."""
        # Add critical error
        validator.errors.append({
            'type': 'float_leakage',
            'severity': 'critical',
            'file': 'test.py',
            'line': 10,
            'context': 'price = 123.45'
        })

        report = validator._generate_report()

        assert report['status'] == 'FAIL'
        assert report['statistics']['critical_errors'] == 1
        assert 'INTEGER VALIDATION FAIL' in report['recommendation']

    def test_validate_all_structure(self, temp_project, validator):
        """Test complete validation returns proper structure."""
        # Create minimal source structure
        (temp_project / "src" / "encoders").mkdir(parents=True, exist_ok=True)

        report = validator.validate_all()

        # Verify report structure
        assert 'status' in report
        assert 'statistics' in report
        assert 'validation_steps' in report
        assert 'errors' in report
        assert 'warnings' in report
        assert 'scaling_factors' in report
        assert 'oeis_sequences' in report
        assert 'recommendation' in report

        # Verify validation steps completed
        steps = report['validation_steps']
        assert steps['float_leakage_scan'] == 'completed'
        assert steps['scaling_factors'] == 'completed'
        assert steps['fibonacci_validation'] == 'completed'
        assert steps['lucas_validation'] == 'completed'
        assert steps['zeckendorf_validation'] == 'completed'

    def test_save_report(self, temp_project, validator):
        """Test saving report to file."""
        # Create minimal structure
        (temp_project / "src" / "encoders").mkdir(parents=True, exist_ok=True)
        (temp_project / "team-outputs" / "team2").mkdir(parents=True, exist_ok=True)

        output_path = temp_project / "team-outputs" / "team2" / "test_report.json"

        # Mock validate_all to avoid full scan
        with patch.object(validator, 'validate_all') as mock_validate:
            mock_validate.return_value = {
                'status': 'PASS',
                'test': 'data'
            }

            report = validator.save_report(str(output_path))

        # Verify file was created
        assert output_path.exists()

        # Verify contents
        with open(output_path) as f:
            saved = json.load(f)
        assert saved['status'] == 'PASS'
        assert saved['test'] == 'data'

    def test_comprehensive_float_detection(self, temp_project, validator):
        """Test comprehensive float detection across various patterns."""
        src_file = temp_project / "src" / "encoders" / "test.py"
        src_file.write_text("""
# Various float patterns to detect
import numpy as np

# Float literals
a = 123.45
b = 0.236
c = .618
d = 100.

# Float keywords
e = float(10)
f = np.float32(20)
g = data.astype('float64')

# Division (may produce floats)
h = 100 / 3

# Float-producing functions
i = np.mean([1, 2, 3])
j = np.std([4, 5, 6])
k = data.mean()

# SAFE patterns (should not be detected)
safe1 = 10000 // 236  # Integer division
safe2 = int(12345)
safe3 = data.astype(int)
safe4 = 100  # Integer
safe5 = "Price: 123.45"  # String literal
# Comment: 0.236 should be ignored
\"\"\"Docstring: 0.618 should be ignored\"\"\"
""")

        validator._scan_file_for_floats(src_file)

        float_errors = [e for e in validator.errors if 'float_leakage' in e['type']]

        # Should detect multiple float patterns
        assert len(float_errors) >= 5  # At least some of the problematic patterns

    def test_edge_cases(self, temp_project, validator):
        """Test edge cases and boundary conditions."""
        src_file = temp_project / "src" / "encoders" / "test.py"

        # Empty file
        src_file.write_text("")
        validator._scan_file_for_floats(src_file)
        assert validator.total_lines == 0

        # Only comments
        src_file.write_text("# Comment only\n# Another comment")
        validator.total_lines = 0  # Reset
        validator._scan_file_for_floats(src_file)
        assert validator.total_lines == 2

        # Mixed safe and unsafe
        src_file.write_text("""
# Safe comment
x = 10000  # Integer
y = 123.45  # UNSAFE float
""")
        validator.errors = []  # Reset
        validator._scan_file_for_floats(src_file)
        float_errors = [e for e in validator.errors if 'float_leakage' in e['type']]
        assert len(float_errors) >= 1


class TestIntegerValidatorIntegration:
    """Integration tests for full validation workflow."""

    def test_full_validation_clean_project(self, tmp_path):
        """Test validation on a clean integer-only project."""
        project = tmp_path / "clean_project"
        src = project / "src" / "encoders"
        src.mkdir(parents=True)

        # Create clean integer-only file
        (src / "clean.py").write_text("""
# Clean integer-only code
def calculate_fibonacci_level(price_cents: int, ratio_numerator: int, ratio_denominator: int) -> int:
    \"\"\"Calculate Fibonacci retracement level using integer arithmetic.\"\"\"
    return (price_cents * ratio_numerator) // ratio_denominator

# Scale prices by 10000
price = 12345  # $123.45
fib_236 = calculate_fibonacci_level(price, 236, 1000)
fib_382 = calculate_fibonacci_level(price, 382, 1000)
fib_618 = calculate_fibonacci_level(price, 618, 1000)
""")

        validator = IntegerValidator(str(project))
        report = validator.validate_all()

        # Should PASS with no critical errors
        assert report['status'] == 'PASS'
        assert report['statistics']['critical_errors'] == 0

    def test_full_validation_dirty_project(self, tmp_path):
        """Test validation on project with float leakage."""
        project = tmp_path / "dirty_project"
        src = project / "src" / "encoders"
        src.mkdir(parents=True)

        # Create file with float operations
        (src / "dirty.py").write_text("""
# Dirty code with floats
def calculate_fibonacci_level(price: float, ratio: float) -> float:
    \"\"\"WRONG: Uses floats instead of integers.\"\"\"
    return price * ratio

# Float prices (WRONG!)
price = 123.45
fib_236 = price * 0.236
fib_382 = price * 0.382
""")

        validator = IntegerValidator(str(project))
        report = validator.validate_all()

        # Should FAIL with critical errors
        assert report['status'] == 'FAIL'
        assert report['statistics']['critical_errors'] > 0

    def test_oeis_sequence_validation(self, tmp_path):
        """Test OEIS sequence validation."""
        project = tmp_path / "oeis_project"
        src = project / "src" / "encoders"
        src.mkdir(parents=True)

        # Create Fibonacci encoder
        (src / "fibonacci_encoder.py").write_text("""
def generate_fibonacci(n: int) -> list:
    \"\"\"Generate Fibonacci sequence (A000045).\"\"\"
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    return fib

# Fibonacci: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233
""")

        # Create Lucas encoder
        (src / "lucas_encoder.py").write_text("""
def generate_lucas(n: int) -> list:
    \"\"\"Generate Lucas sequence (A000032).\"\"\"
    lucas = [2, 1]
    for i in range(2, n):
        lucas.append(lucas[i-1] + lucas[i-2])
    return lucas

# Lucas: 2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123
""")

        # Create Zeckendorf compressor
        (src / "zeckendorf_compressor.py").write_text("""
def to_zeckendorf(n: int) -> str:
    \"\"\"Convert to Zeckendorf representation (A003714).

    Uses non-consecutive Fibonacci numbers.
    \"\"\"
    # Implementation here
    pass
""")

        validator = IntegerValidator(str(project))
        report = validator.validate_all()

        # Should complete all validations
        assert report['validation_steps']['fibonacci_validation'] == 'completed'
        assert report['validation_steps']['lucas_validation'] == 'completed'
        assert report['validation_steps']['zeckendorf_validation'] == 'completed'


def test_main_function():
    """Test main function execution."""
    with patch('encoders.integer_validator.IntegerValidator') as MockValidator:
        mock_instance = Mock()
        MockValidator.return_value = mock_instance
        mock_instance.save_report.return_value = {'status': 'PASS'}

        from encoders.integer_validator import main
        exit_code = main()

        assert exit_code == 0
        mock_instance.save_report.assert_called_once()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

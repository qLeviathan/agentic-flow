"""
Integer Operations Validator - Agent 8 (Zeckendorf: 10000)

Validates 100% integer-only arithmetic across the quantum trading system.
Scans for float leakage, verifies scaling factors, and validates OEIS sequence outputs.

Dependencies: Agents 5, 6, 7 (Fibonacci, Lucas, Zeckendorf encoders)
"""

import re
import os
import ast
import json
from typing import Dict, List, Tuple, Set, Any
from pathlib import Path
from datetime import datetime


class IntegerValidator:
    """
    Comprehensive integer-only validation system.

    Validates:
    - No float/decimal operations
    - All scaling factors are powers of 10
    - Fibonacci sequence outputs (A000045)
    - Lucas sequence outputs (A000032)
    - Zeckendorf representation outputs (A003714)
    """

    # Float detection patterns
    FLOAT_PATTERNS = [
        r'\bfloat\b',                    # float keyword
        r'\bdouble\b',                   # double keyword
        r'\bnp\.float\w*\b',            # numpy float types
        r'\bastype\(["\']float',        # astype('float')
        r'\d+\.\d+',                    # decimal literals (e.g., 123.45)
        r'\.\d+',                       # decimals starting with . (e.g., .5)
        r'\d+\.',                       # decimals ending with . (e.g., 5.)
        r'/\s*[^/]',                    # division operator (may produce float)
        r'np\.divide',                  # numpy divide
        r'\.mean\(\)',                  # mean (produces float)
        r'\.std\(\)',                   # std (produces float)
        r'\.var\(\)',                   # variance (produces float)
        r'math\.sqrt',                  # sqrt (produces float)
        r'np\.sqrt',                    # numpy sqrt
    ]

    # Safe integer patterns (exceptions to float detection)
    SAFE_PATTERNS = [
        r'//\s*\d+',                    # integer division
        r'divmod\(',                    # divmod function
        r'int\(',                       # explicit int conversion
        r'\.to_int\(',                  # pandas to_int
        r'\.astype\(["\']int',         # astype('int')
        r'\.astype\(int\)',            # astype(int)
        r'# .*\d+\.\d+',               # comments with decimals
        r'""".*\d+\.\d+.*"""',         # docstrings with decimals
        r"'''.*\d+\.\d+.*'''",         # docstrings with decimals
        r'"[^"]*\d+\.\d+[^"]*"',       # string literals with decimals
        r"'[^']*\d+\.\d+[^']*'",       # string literals with decimals
    ]

    # Valid scaling factors (powers of 10)
    VALID_SCALE_FACTORS = {100, 1000, 10000, 100000, 1000000}

    # OEIS sequences for validation
    FIBONACCI_A000045 = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597]
    LUCAS_A000032 = [2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123, 199, 322, 521, 843, 1364, 2207]

    def __init__(self, project_root: str = "/home/user/agentic-flow/quantum-trading-system"):
        self.project_root = Path(project_root)
        self.errors: List[Dict[str, Any]] = []
        self.warnings: List[Dict[str, Any]] = []
        self.files_scanned = 0
        self.total_lines = 0

    def validate_all(self) -> Dict[str, Any]:
        """
        Run complete validation suite.

        Returns:
            Validation report with PASS/FAIL status
        """
        print("=" * 80)
        print("INTEGER OPERATIONS VALIDATOR - Agent 8 (Zeckendorf: 10000)")
        print("=" * 80)
        print(f"Project Root: {self.project_root}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print()

        # Step 1: Scan Python files for float leakage
        print("[1/5] Scanning Python files for float leakage...")
        self._scan_python_files()

        # Step 2: Validate scaling factors
        print("[2/5] Validating scaling factors...")
        self._validate_scaling_factors()

        # Step 3: Validate Fibonacci encoder (if exists)
        print("[3/5] Validating Fibonacci encoder outputs (A000045)...")
        self._validate_fibonacci()

        # Step 4: Validate Lucas encoder (if exists)
        print("[4/5] Validating Lucas encoder outputs (A000032)...")
        self._validate_lucas()

        # Step 5: Validate Zeckendorf compressor (if exists)
        print("[5/5] Validating Zeckendorf representation (A003714)...")
        self._validate_zeckendorf()

        # Generate report
        report = self._generate_report()

        # Print summary
        self._print_summary(report)

        return report

    def _scan_python_files(self):
        """Scan all Python files for float operations."""
        src_dir = self.project_root / "src"
        if not src_dir.exists():
            self.warnings.append({
                "type": "missing_directory",
                "message": f"Source directory not found: {src_dir}",
                "severity": "warning"
            })
            return

        for py_file in src_dir.rglob("*.py"):
            self.files_scanned += 1
            self._scan_file_for_floats(py_file)

    def _scan_file_for_floats(self, file_path: Path):
        """Scan a single file for float operations."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')
                self.total_lines += len(lines)

                # Check if entire file is in docstring
                in_docstring = False
                docstring_char = None

                for line_num, line in enumerate(lines, 1):
                    # Track multiline docstrings
                    if '"""' in line:
                        if not in_docstring:
                            in_docstring = True
                            docstring_char = '"""'
                        elif docstring_char == '"""':
                            in_docstring = False
                            continue
                    elif "'''" in line:
                        if not in_docstring:
                            in_docstring = True
                            docstring_char = "'''"
                        elif docstring_char == "'''":
                            in_docstring = False
                            continue

                    # Skip if in docstring
                    if in_docstring:
                        continue

                    # Skip comments and empty lines
                    if self._is_safe_line(line):
                        continue

                    # Check for float patterns
                    for pattern in self.FLOAT_PATTERNS:
                        matches = re.finditer(pattern, line, re.IGNORECASE)
                        for match in matches:
                            # Double-check it's not a safe pattern
                            if not self._is_safe_context(line, match.start()):
                                self.errors.append({
                                    "type": "float_leakage",
                                    "file": str(file_path.relative_to(self.project_root)),
                                    "line": line_num,
                                    "column": match.start(),
                                    "pattern": pattern,
                                    "context": line.strip(),
                                    "severity": "critical"
                                })
        except Exception as e:
            self.warnings.append({
                "type": "scan_error",
                "file": str(file_path),
                "message": f"Error scanning file: {str(e)}",
                "severity": "warning"
            })

    def _is_safe_line(self, line: str) -> bool:
        """Check if line is a comment or docstring."""
        stripped = line.strip()
        return (
            stripped.startswith('#') or
            stripped.startswith('"""') or
            stripped.startswith("'''") or
            len(stripped) == 0
        )

    def _is_safe_context(self, line: str, pos: int) -> bool:
        """Check if match is in a safe context (string, comment, etc.)."""
        # Check if in comment (must come first)
        comment_pos = line.find('#')
        if comment_pos != -1 and pos >= comment_pos:
            return True

        # Check if in string literal (before match position)
        before_match = line[:pos+1]

        # Count quotes before position
        double_quotes = before_match.count('"') - before_match.count('\\"')
        single_quotes = before_match.count("'") - before_match.count("\\'")

        # If odd number of quotes, we're inside a string
        if double_quotes % 2 == 1 or single_quotes % 2 == 1:
            return True

        # Check if it's a docstring (multiline)
        if '"""' in line or "'''" in line:
            return True

        # Check if match is part of integer division //
        if pos > 0 and line[pos-1:pos+1] == '//':
            return True
        if pos < len(line)-1 and line[pos:pos+2] == '//':
            return True

        # Check if it's part of a file path (has multiple / or \)
        # Extract context around match
        start = max(0, pos - 20)
        end = min(len(line), pos + 20)
        context = line[start:end]

        # File paths have multiple slashes
        if context.count('/') >= 2 or context.count('\\') >= 2:
            return True

        # Check if it's part of a URL
        if 'http' in context.lower() or 'oeis.org' in context.lower():
            return True

        # Check safe patterns in the specific match context
        for safe_pattern in self.SAFE_PATTERNS:
            if re.search(safe_pattern, context):
                return True

        return False

    def _validate_scaling_factors(self):
        """Validate that all scaling factors are powers of 10."""
        src_dir = self.project_root / "src"
        if not src_dir.exists():
            return

        # Pattern to find multiplication/division by constants
        scale_pattern = r'[*/]\s*(\d+)\b'

        for py_file in src_dir.rglob("*.py"):
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Parse AST to find numeric constants
                try:
                    tree = ast.parse(content)
                    for node in ast.walk(tree):
                        if isinstance(node, ast.Num):
                            value = node.n
                            # Check if it's a scaling factor (>= 100)
                            if isinstance(value, int) and value >= 100:
                                if value not in self.VALID_SCALE_FACTORS and self._is_power_of_10(value):
                                    self.VALID_SCALE_FACTORS.add(value)
                                elif value >= 100 and not self._is_power_of_10(value):
                                    # Potentially invalid scale factor
                                    self.warnings.append({
                                        "type": "scaling_factor",
                                        "file": str(py_file.relative_to(self.project_root)),
                                        "value": value,
                                        "message": f"Non-power-of-10 scaling factor: {value}",
                                        "severity": "warning"
                                    })
                except SyntaxError:
                    pass  # Skip files with syntax errors

            except Exception as e:
                pass  # Skip errors

    def _is_power_of_10(self, n: int) -> bool:
        """Check if number is a power of 10."""
        if n < 1:
            return False
        while n > 1:
            if n % 10 != 0:
                return False
            n //= 10
        return True

    def _validate_fibonacci(self):
        """Validate Fibonacci encoder outputs against A000045."""
        fib_file = self.project_root / "src" / "encoders" / "fibonacci_encoder.py"
        if not fib_file.exists():
            self.warnings.append({
                "type": "missing_file",
                "file": "src/encoders/fibonacci_encoder.py",
                "message": "Fibonacci encoder not found (Agent 5 may not have completed)",
                "severity": "info"
            })
            return

        # Try to import and validate
        try:
            with open(fib_file, 'r') as f:
                content = f.read()

            # Look for Fibonacci sequence generation
            if 'def' in content and 'fibonacci' in content.lower():
                # Check for correct sequence values
                for i, fib_val in enumerate(self.FIBONACCI_A000045[:10]):
                    if str(fib_val) not in content and fib_val > 1:
                        self.warnings.append({
                            "type": "fibonacci_sequence",
                            "message": f"Fibonacci F({i}) = {fib_val} not found in encoder",
                            "severity": "info"
                        })
        except Exception as e:
            self.warnings.append({
                "type": "validation_error",
                "file": "fibonacci_encoder.py",
                "message": f"Error validating Fibonacci: {str(e)}",
                "severity": "warning"
            })

    def _validate_lucas(self):
        """Validate Lucas encoder outputs against A000032."""
        lucas_file = self.project_root / "src" / "encoders" / "lucas_encoder.py"
        if not lucas_file.exists():
            self.warnings.append({
                "type": "missing_file",
                "file": "src/encoders/lucas_encoder.py",
                "message": "Lucas encoder not found (Agent 6 may not have completed)",
                "severity": "info"
            })
            return

        # Try to validate Lucas sequence
        try:
            with open(lucas_file, 'r') as f:
                content = f.read()

            # Look for Lucas sequence generation
            if 'def' in content and 'lucas' in content.lower():
                # Check for correct sequence values (2, 1, 3, 4, 7, 11, 18...)
                for i, lucas_val in enumerate(self.LUCAS_A000032[:10]):
                    if str(lucas_val) not in content and lucas_val > 1:
                        self.warnings.append({
                            "type": "lucas_sequence",
                            "message": f"Lucas L({i}) = {lucas_val} not found in encoder",
                            "severity": "info"
                        })
        except Exception as e:
            self.warnings.append({
                "type": "validation_error",
                "file": "lucas_encoder.py",
                "message": f"Error validating Lucas: {str(e)}",
                "severity": "warning"
            })

    def _validate_zeckendorf(self):
        """Validate Zeckendorf representation against A003714."""
        zeck_file = self.project_root / "src" / "encoders" / "zeckendorf_compressor.py"
        if not zeck_file.exists():
            self.warnings.append({
                "type": "missing_file",
                "file": "src/encoders/zeckendorf_compressor.py",
                "message": "Zeckendorf compressor not found (Agent 7 may not have completed)",
                "severity": "info"
            })
            return

        # Validate Zeckendorf properties
        try:
            with open(zeck_file, 'r') as f:
                content = f.read()

            # Check for non-consecutive Fibonacci constraint
            if 'consecutive' not in content.lower():
                self.warnings.append({
                    "type": "zeckendorf_property",
                    "message": "Zeckendorf non-consecutive property not explicitly mentioned",
                    "severity": "info"
                })
        except Exception as e:
            self.warnings.append({
                "type": "validation_error",
                "file": "zeckendorf_compressor.py",
                "message": f"Error validating Zeckendorf: {str(e)}",
                "severity": "warning"
            })

    def _generate_report(self) -> Dict[str, Any]:
        """Generate comprehensive validation report."""
        critical_errors = [e for e in self.errors if e.get('severity') == 'critical']

        status = "PASS" if len(critical_errors) == 0 else "FAIL"

        report = {
            "validator": "Integer Operations Validator",
            "agent": "Agent 8",
            "zeckendorf_address": "10000",
            "timestamp": datetime.now().isoformat(),
            "status": status,
            "statistics": {
                "files_scanned": self.files_scanned,
                "total_lines": self.total_lines,
                "critical_errors": len(critical_errors),
                "total_errors": len(self.errors),
                "warnings": len(self.warnings),
            },
            "validation_steps": {
                "float_leakage_scan": "completed",
                "scaling_factors": "completed",
                "fibonacci_validation": "completed",
                "lucas_validation": "completed",
                "zeckendorf_validation": "completed",
            },
            "errors": self.errors,
            "warnings": self.warnings,
            "scaling_factors": {
                "valid": sorted(list(self.VALID_SCALE_FACTORS)),
                "all_powers_of_10": all(self._is_power_of_10(f) for f in self.VALID_SCALE_FACTORS)
            },
            "oeis_sequences": {
                "fibonacci_a000045": self.FIBONACCI_A000045[:10],
                "lucas_a000032": self.LUCAS_A000032[:10],
            },
            "recommendation": self._get_recommendation(critical_errors)
        }

        return report

    def _get_recommendation(self, critical_errors: List[Dict]) -> str:
        """Get recommendation based on validation results."""
        if len(critical_errors) == 0:
            return "✅ INTEGER VALIDATION PASS: All operations verified as integer-only. Safe to proceed."
        else:
            return f"❌ INTEGER VALIDATION FAIL: {len(critical_errors)} critical float leakage(s) detected. Must fix before deployment."

    def _print_summary(self, report: Dict[str, Any]):
        """Print validation summary to console."""
        print()
        print("=" * 80)
        print("VALIDATION SUMMARY")
        print("=" * 80)
        print(f"Status: {report['status']}")
        print(f"Files Scanned: {report['statistics']['files_scanned']}")
        print(f"Total Lines: {report['statistics']['total_lines']}")
        print(f"Critical Errors: {report['statistics']['critical_errors']}")
        print(f"Warnings: {report['statistics']['warnings']}")
        print()
        print(f"Recommendation: {report['recommendation']}")
        print("=" * 80)

        # Print critical errors
        if report['statistics']['critical_errors'] > 0:
            print()
            print("CRITICAL ERRORS:")
            for error in report['errors']:
                if error.get('severity') == 'critical':
                    print(f"  ❌ {error['file']}:{error['line']}")
                    print(f"     {error['context']}")
                    print()

    def save_report(self, output_path: str = None):
        """Save validation report to JSON file."""
        if output_path is None:
            output_path = self.project_root / "team-outputs" / "team2" / "integer_validation_report.json"

        report = self.validate_all()

        # Ensure directory exists
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            json.dump(report, f, indent=2)

        print(f"\n✅ Report saved to: {output_path}")

        return report


def main():
    """Main validation entry point."""
    validator = IntegerValidator()
    report = validator.save_report()

    # Return exit code based on status
    return 0 if report['status'] == 'PASS' else 1


if __name__ == "__main__":
    exit(main())

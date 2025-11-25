#!/usr/bin/env python3
"""
Comprehensive Test Suite Report Generator
Quantum Trading System - Test Suite Specialist (Agent 28)

Generates detailed HTML and JSON reports from test results and coverage data.
Includes metrics, trends, and CI/CD readiness indicators.
"""

import json
import sys
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional, Any
import subprocess


class TestSuiteReporter:
    """Generate comprehensive test suite reports."""

    def __init__(self, project_root: Optional[Path] = None):
        """Initialize reporter with project root directory."""
        self.project_root = project_root or Path(__file__).parent.parent
        self.tests_dir = self.project_root / "tests"
        self.coverage_file = self.project_root / "coverage.json"
        self.junit_file = self.tests_dir / "junit.xml"
        self.report_file = self.tests_dir / "test_report.json"
        self.html_file = self.tests_dir / "test_report.html"

    def load_coverage_data(self) -> Dict[str, Any]:
        """Load coverage data from coverage.json."""
        if not self.coverage_file.exists():
            return {"totals": {"percent_covered": 0, "num_statements": 0, "missing_lines": 0}}

        try:
            with open(self.coverage_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load coverage data: {e}")
            return {"totals": {"percent_covered": 0, "num_statements": 0, "missing_lines": 0}}

    def load_test_results(self) -> Dict[str, Any]:
        """Load test results from pytest JSON report."""
        if not self.report_file.exists():
            return {"tests": [], "summary": {}}

        try:
            with open(self.report_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Could not load test results: {e}")
            return {"tests": [], "summary": {}}

    def count_test_files(self) -> int:
        """Count number of test files."""
        return len(list(self.tests_dir.glob("test_*.py")))

    def get_git_info(self) -> Dict[str, str]:
        """Get current git branch and commit."""
        try:
            branch = subprocess.check_output(
                ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
                cwd=self.project_root,
                stderr=subprocess.DEVNULL
            ).decode().strip()

            commit = subprocess.check_output(
                ['git', 'rev-parse', '--short', 'HEAD'],
                cwd=self.project_root,
                stderr=subprocess.DEVNULL
            ).decode().strip()

            return {"branch": branch, "commit": commit}
        except Exception:
            return {"branch": "unknown", "commit": "unknown"}

    def analyze_coverage_by_module(self, coverage_data: Dict[str, Any]) -> Dict[str, Dict[str, float]]:
        """Analyze coverage by module/component."""
        files = coverage_data.get('files', {})
        modules = {}

        for filepath, data in files.items():
            # Extract module name (src/models/qfnn.py -> models)
            path_parts = Path(filepath).parts
            if 'src' in path_parts:
                idx = path_parts.index('src')
                if len(path_parts) > idx + 1:
                    module = path_parts[idx + 1]

                    if module not in modules:
                        modules[module] = {
                            'covered': 0,
                            'total': 0,
                            'percent': 0.0
                        }

                    summary = data.get('summary', {})
                    modules[module]['covered'] += summary.get('covered_lines', 0)
                    modules[module]['total'] += summary.get('num_statements', 0)

        # Calculate percentages
        for module in modules.values():
            if module['total'] > 0:
                module['percent'] = (module['covered'] / module['total']) * 100

        return modules

    def identify_untested_files(self, coverage_data: Dict[str, Any]) -> List[str]:
        """Identify source files with no test coverage."""
        files = coverage_data.get('files', {})
        untested = []

        for filepath, data in files.items():
            summary = data.get('summary', {})
            if summary.get('percent_covered', 0) == 0:
                untested.append(filepath)

        return untested

    def calculate_test_metrics(self, test_results: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate comprehensive test metrics."""
        summary = test_results.get('summary', {})
        tests = test_results.get('tests', [])

        # Basic counts
        total = summary.get('total', 0)
        passed = summary.get('passed', 0)
        failed = summary.get('failed', 0)
        skipped = summary.get('skipped', 0)
        errors = summary.get('error', 0)

        # Calculate rates
        pass_rate = (passed / total * 100) if total > 0 else 0
        fail_rate = (failed / total * 100) if total > 0 else 0

        # Execution time
        duration = summary.get('duration', 0)

        # Test categories
        categories = {
            'unit': 0,
            'integration': 0,
            'performance': 0,
            'oeis_validation': 0,
            'integer_validation': 0
        }

        for test in tests:
            name = test.get('nodeid', '').lower()
            if 'integration' in name:
                categories['integration'] += 1
            elif 'performance' in name or 'benchmark' in name:
                categories['performance'] += 1
            elif 'oeis' in name:
                categories['oeis_validation'] += 1
            elif 'integer' in name:
                categories['integer_validation'] += 1
            else:
                categories['unit'] += 1

        return {
            'total': total,
            'passed': passed,
            'failed': failed,
            'skipped': skipped,
            'errors': errors,
            'pass_rate': round(pass_rate, 2),
            'fail_rate': round(fail_rate, 2),
            'duration': round(duration, 2),
            'categories': categories
        }

    def generate_html_report(
        self,
        metrics: Dict[str, Any],
        coverage_data: Dict[str, Any],
        modules: Dict[str, Dict[str, float]],
        untested: List[str],
        git_info: Dict[str, str]
    ) -> str:
        """Generate comprehensive HTML report."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        coverage_percent = coverage_data.get('totals', {}).get('percent_covered', 0)

        # Status indicator
        status = "✓ PASSED" if metrics['failed'] == 0 and metrics['errors'] == 0 else "✗ FAILED"
        status_color = "#28a745" if status == "✓ PASSED" else "#dc3545"
        coverage_color = "#28a745" if coverage_percent >= 90 else "#ffc107" if coverage_percent >= 75 else "#dc3545"

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quantum Trading System - Test Suite Report</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}

        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            color: #333;
        }}

        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
        }}

        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }}

        .header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
        }}

        .header p {{
            font-size: 1.1em;
            opacity: 0.9;
        }}

        .status-banner {{
            background: {status_color};
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 1.5em;
            font-weight: bold;
        }}

        .content {{
            padding: 30px;
        }}

        .section {{
            margin-bottom: 30px;
        }}

        .section h2 {{
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }}

        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}

        .metric-card {{
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            border-radius: 5px;
        }}

        .metric-card h3 {{
            color: #666;
            font-size: 0.9em;
            margin-bottom: 10px;
        }}

        .metric-card .value {{
            font-size: 2em;
            font-weight: bold;
            color: #333;
        }}

        .metric-card .subvalue {{
            font-size: 0.9em;
            color: #999;
            margin-top: 5px;
        }}

        .coverage-bar {{
            background: #e9ecef;
            height: 30px;
            border-radius: 15px;
            overflow: hidden;
            position: relative;
        }}

        .coverage-fill {{
            background: {coverage_color};
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            transition: width 0.3s ease;
        }}

        .module-list {{
            display: grid;
            gap: 10px;
        }}

        .module-item {{
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }}

        .module-name {{
            font-weight: bold;
        }}

        .module-coverage {{
            font-size: 1.2em;
            font-weight: bold;
        }}

        .category-table {{
            width: 100%;
            border-collapse: collapse;
        }}

        .category-table th,
        .category-table td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }}

        .category-table th {{
            background: #667eea;
            color: white;
        }}

        .category-table tr:hover {{
            background: #f8f9fa;
        }}

        .warning-box {{
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
        }}

        .success-box {{
            background: #d4edda;
            border-left: 4px solid #28a745;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
        }}

        .footer {{
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }}

        .badge {{
            display: inline-block;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 0.85em;
            font-weight: bold;
            margin-left: 10px;
        }}

        .badge-success {{
            background: #28a745;
            color: white;
        }}

        .badge-warning {{
            background: #ffc107;
            color: #333;
        }}

        .badge-danger {{
            background: #dc3545;
            color: white;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Quantum Trading System</h1>
            <p>Comprehensive Test Suite Report</p>
            <p style="font-size: 0.9em; opacity: 0.8;">Agent 28: Test Suite Specialist</p>
        </div>

        <div class="status-banner">
            {status}
        </div>

        <div class="content">
            <div class="section">
                <h2>📊 Test Execution Summary</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h3>Total Tests</h3>
                        <div class="value">{metrics['total']}</div>
                    </div>
                    <div class="metric-card">
                        <h3>Passed</h3>
                        <div class="value" style="color: #28a745;">{metrics['passed']}</div>
                        <div class="subvalue">{metrics['pass_rate']}%</div>
                    </div>
                    <div class="metric-card">
                        <h3>Failed</h3>
                        <div class="value" style="color: #dc3545;">{metrics['failed']}</div>
                        <div class="subvalue">{metrics['fail_rate']}%</div>
                    </div>
                    <div class="metric-card">
                        <h3>Duration</h3>
                        <div class="value">{metrics['duration']}s</div>
                    </div>
                    <div class="metric-card">
                        <h3>Test Files</h3>
                        <div class="value">{self.count_test_files()}</div>
                    </div>
                    <div class="metric-card">
                        <h3>Skipped</h3>
                        <div class="value">{metrics['skipped']}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>📈 Code Coverage</h2>
                <div class="coverage-bar">
                    <div class="coverage-fill" style="width: {coverage_percent}%;">
                        {coverage_percent:.1f}%
                    </div>
                </div>

                <div style="margin-top: 20px;">
                    {"<div class='success-box'>✓ Coverage exceeds 90% threshold - Excellent!</div>" if coverage_percent >= 90 else
                     "<div class='warning-box'>⚠ Coverage below 90% threshold - Additional tests needed</div>" if coverage_percent >= 75 else
                     "<div class='warning-box' style='background: #f8d7da; border-color: #dc3545;'>✗ Coverage critically low - Immediate attention required</div>"}
                </div>
            </div>

            <div class="section">
                <h2>📦 Coverage by Module</h2>
                <div class="module-list">
"""

        # Add module coverage
        for module_name, data in sorted(modules.items(), key=lambda x: x[1]['percent'], reverse=True):
            percent = data['percent']
            badge_class = "badge-success" if percent >= 90 else "badge-warning" if percent >= 75 else "badge-danger"
            html += f"""
                    <div class="module-item">
                        <div class="module-name">{module_name}</div>
                        <div>
                            <span class="module-coverage">{percent:.1f}%</span>
                            <span class="badge {badge_class}">{data['covered']}/{data['total']} lines</span>
                        </div>
                    </div>
"""

        html += """
                </div>
            </div>

            <div class="section">
                <h2>🏷️ Test Categories</h2>
                <table class="category-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Count</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
"""

        # Add test categories
        total_tests = metrics['total']
        for category, count in metrics['categories'].items():
            percentage = (count / total_tests * 100) if total_tests > 0 else 0
            html += f"""
                        <tr>
                            <td>{category.replace('_', ' ').title()}</td>
                            <td>{count}</td>
                            <td>{percentage:.1f}%</td>
                        </tr>
"""

        html += f"""
                    </tbody>
                </table>
            </div>
"""

        # Add untested files warning if any
        if untested:
            html += """
            <div class="section">
                <h2>⚠️ Files Without Test Coverage</h2>
                <div class="warning-box">
                    <p><strong>The following files have no test coverage:</strong></p>
                    <ul style="margin-top: 10px;">
"""
            for filepath in untested[:10]:  # Show first 10
                html += f"                        <li>{filepath}</li>\n"

            if len(untested) > 10:
                html += f"                        <li><em>... and {len(untested) - 10} more</em></li>\n"

            html += """
                    </ul>
                </div>
            </div>
"""

        # Footer with metadata
        html += f"""
        </div>

        <div class="footer">
            <p><strong>Report Generated:</strong> {timestamp}</p>
            <p><strong>Git Branch:</strong> {git_info['branch']} | <strong>Commit:</strong> {git_info['commit']}</p>
            <p><strong>CI/CD Ready:</strong> {"✓ Yes" if metrics['failed'] == 0 and coverage_percent >= 90 else "✗ No"}</p>
        </div>
    </div>
</body>
</html>
"""

        return html

    def generate_report(self) -> bool:
        """Generate comprehensive test suite report."""
        print("=" * 60)
        print("📊 Generating Comprehensive Test Suite Report")
        print("=" * 60)
        print()

        # Load data
        print("Loading test data...")
        coverage_data = self.load_coverage_data()
        test_results = self.load_test_results()
        git_info = self.get_git_info()

        # Calculate metrics
        print("Calculating metrics...")
        metrics = self.calculate_test_metrics(test_results)
        modules = self.analyze_coverage_by_module(coverage_data)
        untested = self.identify_untested_files(coverage_data)

        # Generate HTML report
        print("Generating HTML report...")
        html = self.generate_html_report(metrics, coverage_data, modules, untested, git_info)

        # Save HTML report
        with open(self.html_file, 'w') as f:
            f.write(html)

        print()
        print("=" * 60)
        print("✓ Report Generation Complete")
        print("=" * 60)
        print()
        print(f"📄 HTML Report: {self.html_file}")
        print(f"📈 Coverage: {coverage_data.get('totals', {}).get('percent_covered', 0):.1f}%")
        print(f"✓ Tests Passed: {metrics['passed']}/{metrics['total']}")
        print()

        return metrics['failed'] == 0 and metrics['errors'] == 0


def main():
    """Main entry point."""
    reporter = TestSuiteReporter()
    success = reporter.generate_report()
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()

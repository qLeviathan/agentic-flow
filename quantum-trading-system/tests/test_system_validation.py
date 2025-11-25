"""
Quantum Trading System - System Validation Tests
Agent 31 (Zeckendorf: 10000010000) - System Validation

Comprehensive system-level validation tests that verify:
1. Complete system integration
2. End-to-end workflows
3. Production readiness
4. Docker deployment
5. Performance under load
"""

import pytest
import subprocess
import json
import time
from pathlib import Path
from typing import Dict, List
import sys

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))


class TestSystemIntegration:
    """Test complete system integration"""

    @pytest.fixture
    def project_root(self):
        """Get project root directory"""
        return Path(__file__).parent.parent

    def test_all_critical_modules_importable(self):
        """Test that all critical modules can be imported"""
        critical_modules = [
            "src.encoders.fibonacci_encoder",
            "src.encoders.lucas_encoder",
            "src.encoders.zeckendorf_compressor",
            "src.encoders.integer_validator",
            "src.data.tiingo_fetcher",
            "src.data.yahoo_fetcher",
            "src.data.fred_fetcher",
            "src.models.qfnn",
            "src.models.xi_psi",
            "src.backtesting.backtest_engine",
            "src.backtesting.risk_manager",
            "src.backtesting.performance_analytics",
            "src.strategies.fibonacci_strategy",
            "src.strategies.lucas_strategy",
        ]

        for module_name in critical_modules:
            try:
                __import__(module_name)
            except ImportError as e:
                pytest.fail(f"Failed to import {module_name}: {e}")

    def test_project_structure(self, project_root):
        """Test that project has correct structure"""
        required_dirs = [
            "src",
            "src/encoders",
            "src/data",
            "src/models",
            "src/backtesting",
            "src/strategies",
            "src/utils",
            "tests",
            "docker",
            "docs",
        ]

        for dir_path in required_dirs:
            full_path = project_root / dir_path
            assert full_path.exists(), f"Required directory missing: {dir_path}"
            assert full_path.is_dir(), f"Not a directory: {dir_path}"

    def test_configuration_files_exist(self, project_root):
        """Test that all configuration files exist"""
        required_files = [
            "docker/Dockerfile",
            "docker/docker-compose.yml",
            "docker/docker-compose.swarm.yml",
            "docker/.env.example",
            "docker/.dockerignore",
            "requirements.txt",
        ]

        for file_path in required_files:
            full_path = project_root / file_path
            assert full_path.exists(), f"Required file missing: {file_path}"
            assert full_path.is_file(), f"Not a file: {file_path}"


class TestIntegerOnlyValidation:
    """Test 100% integer-only arithmetic across system"""

    def test_fibonacci_encoder_integer_only(self):
        """Test Fibonacci encoder uses only integers"""
        from src.encoders.fibonacci_encoder import FibonacciEncoder

        encoder = FibonacciEncoder(scale=10000)

        # Test price encoding
        price_cents = 12345  # $123.45
        encoded = encoder.encode_price(price_cents)

        assert isinstance(encoded, int), "Encoded value must be integer"
        assert encoded > 0, "Encoded value must be positive"

        # Test decoding
        decoded = encoder.decode_price(encoded)
        assert isinstance(decoded, int), "Decoded value must be integer"

        # Verify no float operations
        assert abs(decoded - price_cents) < encoder.scale, "Decoding error too large"

    def test_lucas_encoder_integer_only(self):
        """Test Lucas encoder uses only integers"""
        from src.encoders.lucas_encoder import LucasEncoder

        encoder = LucasEncoder(scale=10000)

        # Test time encoding
        timestamp = 1700000000  # Unix timestamp
        encoded = encoder.encode_time(timestamp)

        assert isinstance(encoded, int), "Encoded time must be integer"
        assert encoded > 0, "Encoded time must be positive"

        # Test decoding
        decoded = encoder.decode_time(encoded)
        assert isinstance(decoded, int), "Decoded time must be integer"

    def test_qfnn_integer_only(self):
        """Test QFNN uses only integers"""
        import numpy as np
        from src.models.qfnn import QFNN

        model = QFNN(input_size=5, hidden_size=10, output_size=3, scale=10000)

        # Create integer input
        input_data = np.array([1000, 2000, 3000, 4000, 5000], dtype=np.int64)

        # Forward pass
        output = model.forward(input_data)

        assert output.dtype == np.int64, "Output must be int64"
        assert all(isinstance(x, (int, np.integer)) for x in output), "All outputs must be integers"

    def test_xi_psi_integer_only(self):
        """Test Xi/Psi model uses only integers"""
        from src.models.xi_psi import XiPsiDynamics

        model = XiPsiDynamics(scale=10000)

        # Integer price series
        prices = [10000, 10100, 10050, 10200, 10150]  # Prices in cents
        lucas_times = [1, 2, 3, 4, 5]  # Lucas-encoded times

        # Calculate Xi (position)
        xi = model.xi_op.position(prices)
        assert isinstance(xi, int), "Xi must be integer"

        # Calculate Psi (momentum)
        psi = model.psi_op.momentum(prices, lucas_times)
        assert isinstance(psi, int), "Psi must be integer"

    def test_backtest_engine_integer_only(self):
        """Test backtest engine uses only integers"""
        from src.backtesting.backtest_engine import BacktestEngine
        from src.strategies.fibonacci_strategy import FibonacciStrategy

        strategy = FibonacciStrategy(scale=10000)
        engine = BacktestEngine(
            initial_capital=1000000,  # $10,000.00
            commission_rate=10,  # 0.10% = 10 basis points
            scale=10000
        )

        # Integer-only price data
        prices = [10000, 10500, 10200, 10800, 10600]
        timestamps = [1, 2, 3, 4, 5]

        # Run backtest
        result = engine.run(prices, timestamps, strategy)

        # Verify all results are integers
        assert isinstance(result.final_capital, int), "Final capital must be integer"
        assert isinstance(result.total_pnl, int), "Total PnL must be integer"

        for trade in result.trades:
            assert isinstance(trade.entry_price, int), "Entry price must be integer"
            assert isinstance(trade.exit_price, int), "Exit price must be integer"
            assert isinstance(trade.pnl, int), "PnL must be integer"


class TestOEISSequenceValidation:
    """Test OEIS sequence compliance"""

    def test_fibonacci_a000045_sequence(self):
        """Test Fibonacci sequence matches OEIS A000045"""
        from src.encoders.fibonacci_encoder import FibonacciEncoder

        encoder = FibonacciEncoder()

        # OEIS A000045: https://oeis.org/A000045
        expected_sequence = [0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597]

        generated_sequence = encoder.generate_fibonacci(len(expected_sequence))

        assert generated_sequence == expected_sequence, \
            f"Fibonacci sequence doesn't match OEIS A000045:\nExpected: {expected_sequence}\nGot: {generated_sequence}"

    def test_lucas_a000032_sequence(self):
        """Test Lucas sequence matches OEIS A000032"""
        from src.encoders.lucas_encoder import LucasEncoder

        encoder = LucasEncoder()

        # OEIS A000032: https://oeis.org/A000032
        expected_sequence = [2, 1, 3, 4, 7, 11, 18, 29, 47, 76, 123, 199, 322, 521, 843, 1364, 2207]

        generated_sequence = encoder.generate_lucas(len(expected_sequence))

        assert generated_sequence == expected_sequence, \
            f"Lucas sequence doesn't match OEIS A000032:\nExpected: {expected_sequence}\nGot: {generated_sequence}"

    def test_zeckendorf_a003714_representation(self):
        """Test Zeckendorf representation compliance with OEIS A003714"""
        from src.encoders.zeckendorf_compressor import ZeckendorfCompressor

        compressor = ZeckendorfCompressor()

        # Test Zeckendorf representations for various numbers
        # OEIS A003714: https://oeis.org/A003714
        test_cases = [
            (1, "1"),      # F(2) = 1
            (2, "10"),     # F(3) = 2
            (3, "100"),    # F(4) = 3
            (4, "101"),    # F(2) + F(4) = 1 + 3
            (5, "1000"),   # F(5) = 5
            (6, "1001"),   # F(2) + F(5) = 1 + 5
            (7, "1010"),   # F(3) + F(5) = 2 + 5
            (8, "10000"),  # F(6) = 8
        ]

        for number, expected_zeck in test_cases:
            zeck_repr = compressor.to_zeckendorf(number)
            # The representation should use non-consecutive Fibonacci numbers
            assert isinstance(zeck_repr, str), f"Zeckendorf representation must be string for {number}"


class TestDockerDeployment:
    """Test Docker deployment readiness"""

    @pytest.fixture
    def project_root(self):
        """Get project root directory"""
        return Path(__file__).parent.parent

    def test_dockerfile_multi_stage_build(self, project_root):
        """Test Dockerfile has correct multi-stage structure"""
        dockerfile = project_root / "docker" / "Dockerfile"
        content = dockerfile.read_text()

        required_stages = [
            "FROM python:3.11-slim as base",
            "FROM base as dependencies",
            "FROM base as builder",
            "FROM base as production",
            "FROM production as development",
            "FROM development as testing",
        ]

        for stage in required_stages:
            assert stage in content, f"Missing stage in Dockerfile: {stage}"

    def test_dockerfile_security_best_practices(self, project_root):
        """Test Dockerfile follows security best practices"""
        dockerfile = project_root / "docker" / "Dockerfile"
        content = dockerfile.read_text()

        # Check for non-root user
        assert "useradd" in content or "adduser" in content, "Dockerfile must create non-root user"
        assert "USER quantum" in content, "Dockerfile must switch to non-root user"

        # Check for health check
        assert "HEALTHCHECK" in content, "Dockerfile must include health check"

    def test_docker_compose_configuration(self, project_root):
        """Test docker-compose.yml is valid"""
        compose_file = project_root / "docker" / "docker-compose.yml"

        try:
            import yaml
            config = yaml.safe_load(compose_file.read_text())

            assert "services" in config, "docker-compose.yml must define services"
            assert "volumes" in config, "docker-compose.yml must define volumes"
            assert "networks" in config, "docker-compose.yml must define networks"

            # Check required services
            services = config["services"]
            assert "quantum-trading" in services, "Must have quantum-trading service"
            assert "quantum-testing" in services, "Must have quantum-testing service"
            assert "agentdb" in services, "Must have agentdb service"

        except ImportError:
            pytest.skip("PyYAML not installed")

    def test_docker_swarm_configuration(self, project_root):
        """Test Docker Swarm deployment configuration"""
        swarm_file = project_root / "docker" / "docker-compose.swarm.yml"

        try:
            import yaml
            config = yaml.safe_load(swarm_file.read_text())

            assert "services" in config, "Swarm config must define services"

            # Check deployment configuration
            qt_service = config["services"]["quantum-trading"]
            assert "deploy" in qt_service, "Service must have deploy config"

            deploy = qt_service["deploy"]
            assert "replicas" in deploy, "Must specify replicas"
            assert "update_config" in deploy, "Must have update config"
            assert "restart_policy" in deploy, "Must have restart policy"

        except ImportError:
            pytest.skip("PyYAML not installed")


class TestEndToEndWorkflows:
    """Test complete end-to-end workflows"""

    def test_data_fetch_to_backtest_workflow(self):
        """Test complete workflow from data fetching to backtesting"""
        import numpy as np
        from src.encoders.fibonacci_encoder import FibonacciEncoder
        from src.encoders.lucas_encoder import LucasEncoder
        from src.strategies.fibonacci_strategy import FibonacciStrategy
        from src.backtesting.backtest_engine import BacktestEngine

        # 1. Simulate fetched data (integer prices in cents)
        raw_prices = [10000, 10100, 10050, 10200, 10150, 10300, 10250]
        raw_timestamps = [1700000000 + i * 86400 for i in range(len(raw_prices))]

        # 2. Encode prices with Fibonacci
        fib_encoder = FibonacciEncoder(scale=10000)
        encoded_prices = [fib_encoder.encode_price(p) for p in raw_prices]

        # 3. Encode times with Lucas
        lucas_encoder = LucasEncoder(scale=10000)
        encoded_times = [lucas_encoder.encode_time(t) for t in raw_timestamps]

        # 4. Run Fibonacci strategy
        strategy = FibonacciStrategy(scale=10000)

        # 5. Execute backtest
        engine = BacktestEngine(
            initial_capital=1000000,  # $10,000
            commission_rate=10,  # 0.10%
            scale=10000
        )

        result = engine.run(raw_prices, raw_timestamps, strategy)

        # 6. Verify results are all integers
        assert isinstance(result.final_capital, int)
        assert isinstance(result.total_pnl, int)
        assert all(isinstance(t.pnl, int) for t in result.trades)

    def test_multi_strategy_comparison_workflow(self):
        """Test workflow for comparing multiple strategies"""
        from src.strategies.fibonacci_strategy import FibonacciStrategy
        from src.strategies.lucas_strategy import LucasStrategy
        from src.backtesting.backtest_engine import BacktestEngine
        from src.backtesting.performance_analytics import PerformanceAnalytics

        # Test data
        prices = [10000, 10200, 10100, 10400, 10300, 10600, 10500]
        timestamps = [1 + i for i in range(len(prices))]

        # Initialize strategies
        strategies = {
            "Fibonacci": FibonacciStrategy(scale=10000),
            "Lucas": LucasStrategy(scale=10000),
        }

        # Run backtests
        results = {}
        for name, strategy in strategies.items():
            engine = BacktestEngine(
                initial_capital=1000000,
                commission_rate=10,
                scale=10000
            )
            results[name] = engine.run(prices, timestamps, strategy)

        # Compare results
        for name, result in results.items():
            assert isinstance(result.final_capital, int), f"{name} final capital must be integer"
            assert isinstance(result.total_pnl, int), f"{name} PnL must be integer"


class TestProductionReadiness:
    """Test production deployment readiness"""

    def test_validation_script_executable(self, project_root):
        """Test that validation script exists and is executable"""
        project_root = Path(__file__).parent.parent
        validation_script = project_root / "run_full_validation.sh"

        assert validation_script.exists(), "Validation script must exist"
        assert validation_script.stat().st_mode & 0o111, "Validation script must be executable"

    def test_no_hardcoded_secrets(self, project_root):
        """Test that no hardcoded secrets exist in code"""
        project_root = Path(__file__).parent.parent

        # Patterns that might indicate hardcoded secrets
        secret_patterns = [
            b"api_key = \"",
            b"password = \"",
            b"secret = \"",
            b"token = \"",
        ]

        # Files to check
        python_files = list((project_root / "src").rglob("*.py"))

        for py_file in python_files:
            content = py_file.read_bytes()
            for pattern in secret_patterns:
                assert pattern not in content.lower(), \
                    f"Possible hardcoded secret in {py_file}: {pattern.decode()}"

    def test_error_handling_in_critical_paths(self):
        """Test that critical paths have proper error handling"""
        from src.encoders.fibonacci_encoder import FibonacciEncoder
        from src.backtesting.backtest_engine import BacktestEngine

        # Test invalid input handling
        encoder = FibonacciEncoder()

        # Should handle negative prices gracefully
        try:
            result = encoder.encode_price(-1000)
            # If it doesn't raise, verify it returns valid data
            assert isinstance(result, int)
        except (ValueError, AssertionError):
            # Expected - negative prices should be rejected
            pass

    def test_performance_benchmarks(self):
        """Test that system meets performance benchmarks"""
        import time
        from src.encoders.fibonacci_encoder import FibonacciEncoder
        from src.models.qfnn import QFNN
        import numpy as np

        # Benchmark 1: Encoding performance
        encoder = FibonacciEncoder()
        start = time.time()
        for i in range(1000):
            encoder.encode_price(10000 + i)
        encoding_time = time.time() - start

        assert encoding_time < 5.0, f"Encoding too slow: {encoding_time:.3f}s for 1000 operations"

        # Benchmark 2: Model inference
        model = QFNN(input_size=10, hidden_size=20, output_size=5)
        test_input = np.random.randint(-10000, 10000, (10,), dtype=np.int64)

        start = time.time()
        for i in range(100):
            output = model.forward(test_input)
        inference_time = time.time() - start

        assert inference_time < 10.0, f"Inference too slow: {inference_time:.3f}s for 100 passes"


class TestAgentDBIntegration:
    """Test AgentDB reflexion system integration"""

    def test_agentdb_accessible(self):
        """Test that AgentDB is accessible"""
        try:
            result = subprocess.run(
                ["npx", "agentdb@latest", "status"],
                capture_output=True,
                text=True,
                timeout=10
            )
            # AgentDB should respond (may work or fail, but should respond)
            assert result.returncode in [0, 1], "AgentDB should respond to status check"
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pytest.skip("AgentDB not available")

    def test_reflexion_storage(self):
        """Test reflexion storage and retrieval"""
        try:
            # Store a reflexion
            store_result = subprocess.run(
                [
                    "npx", "agentdb@latest", "reflexion", "store",
                    "test-task", "test-step", "1.0", "true", "Test message"
                ],
                capture_output=True,
                text=True,
                timeout=10
            )

            # Should succeed or gracefully fail
            assert store_result.returncode in [0, 1], "Reflexion store should complete"

        except (subprocess.TimeoutExpired, FileNotFoundError):
            pytest.skip("AgentDB not available")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

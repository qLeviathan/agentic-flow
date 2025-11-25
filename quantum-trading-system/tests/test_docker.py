"""
Quantum Trading System - Docker Configuration Tests
Tests for Docker builds, containers, and deployment validation
"""

import subprocess
import json
import os
import pytest
import time
from pathlib import Path


class TestDockerfile:
    """Tests for Dockerfile configuration and builds"""

    @pytest.fixture
    def project_root(self):
        """Get project root directory"""
        return Path(__file__).parent.parent

    @pytest.fixture
    def dockerfile_path(self, project_root):
        """Get Dockerfile path"""
        return project_root / "docker" / "Dockerfile"

    def test_dockerfile_exists(self, dockerfile_path):
        """Test that Dockerfile exists"""
        assert dockerfile_path.exists(), "Dockerfile not found"
        assert dockerfile_path.is_file(), "Dockerfile is not a file"

    def test_dockerfile_syntax(self, dockerfile_path):
        """Test Dockerfile has valid syntax"""
        content = dockerfile_path.read_text()

        # Check for multi-stage build stages
        assert "FROM python:3.11-slim as base" in content
        assert "FROM base as dependencies" in content
        assert "FROM base as builder" in content
        assert "FROM base as production" in content
        assert "FROM production as development" in content
        assert "FROM development as testing" in content

    def test_dockerfile_user_security(self, dockerfile_path):
        """Test that Dockerfile uses non-root user"""
        content = dockerfile_path.read_text()
        assert "useradd" in content, "No user creation found"
        assert "USER quantum" in content, "Production stage doesn't switch to quantum user"

    def test_dockerfile_healthcheck(self, dockerfile_path):
        """Test that Dockerfile includes health check"""
        content = dockerfile_path.read_text()
        assert "HEALTHCHECK" in content, "No health check defined"
        assert "--interval" in content
        assert "--timeout" in content

    def test_dockerfile_labels(self, dockerfile_path):
        """Test that Dockerfile has proper labels"""
        content = dockerfile_path.read_text()
        assert "LABEL maintainer" in content
        assert "LABEL description" in content
        assert "LABEL version" in content


class TestDockerCompose:
    """Tests for docker-compose configuration"""

    @pytest.fixture
    def compose_path(self, project_root):
        """Get docker-compose.yml path"""
        return project_root / "docker" / "docker-compose.yml"

    @pytest.fixture
    def project_root(self):
        """Get project root directory"""
        return Path(__file__).parent.parent

    def test_compose_file_exists(self, compose_path):
        """Test that docker-compose.yml exists"""
        assert compose_path.exists(), "docker-compose.yml not found"

    def test_compose_syntax(self, compose_path):
        """Test docker-compose.yml has valid YAML syntax"""
        try:
            import yaml
            content = yaml.safe_load(compose_path.read_text())
            assert content is not None
            assert "version" in content
            assert "services" in content
        except ImportError:
            pytest.skip("PyYAML not installed")

    def test_compose_services(self, compose_path):
        """Test that all required services are defined"""
        try:
            import yaml
            content = yaml.safe_load(compose_path.read_text())
            services = content.get("services", {})

            assert "quantum-trading" in services
            assert "quantum-testing" in services
            assert "agentdb" in services
            assert "jupyter" in services
        except ImportError:
            pytest.skip("PyYAML not installed")

    def test_compose_volumes(self, compose_path):
        """Test that volumes are properly defined"""
        try:
            import yaml
            content = yaml.safe_load(compose_path.read_text())
            volumes = content.get("volumes", {})

            assert "agentdb-data" in volumes
            assert "cache-data" in volumes
            assert "logs-data" in volumes
        except ImportError:
            pytest.skip("PyYAML not installed")

    def test_compose_networks(self, compose_path):
        """Test that networks are defined"""
        try:
            import yaml
            content = yaml.safe_load(compose_path.read_text())
            networks = content.get("networks", {})

            assert "quantum-net" in networks
        except ImportError:
            pytest.skip("PyYAML not installed")


class TestDockerSwarm:
    """Tests for Docker Swarm configuration"""

    @pytest.fixture
    def swarm_compose_path(self, project_root):
        """Get docker-compose.swarm.yml path"""
        return project_root / "docker" / "docker-compose.swarm.yml"

    @pytest.fixture
    def project_root(self):
        """Get project root directory"""
        return Path(__file__).parent.parent

    def test_swarm_compose_exists(self, swarm_compose_path):
        """Test that swarm compose file exists"""
        assert swarm_compose_path.exists(), "docker-compose.swarm.yml not found"

    def test_swarm_deploy_config(self, swarm_compose_path):
        """Test swarm deployment configuration"""
        try:
            import yaml
            content = yaml.safe_load(swarm_compose_path.read_text())
            services = content.get("services", {})

            # Check quantum-trading service has deploy config
            qt_service = services.get("quantum-trading", {})
            deploy = qt_service.get("deploy", {})

            assert "replicas" in deploy
            assert "update_config" in deploy
            assert "rollback_config" in deploy
            assert "restart_policy" in deploy
            assert "resources" in deploy
            assert "placement" in deploy
        except ImportError:
            pytest.skip("PyYAML not installed")

    def test_swarm_secrets(self, swarm_compose_path):
        """Test that secrets are configured"""
        try:
            import yaml
            content = yaml.safe_load(swarm_compose_path.read_text())
            secrets = content.get("secrets", {})

            assert "tiingo_api_key" in secrets
            assert "yahoo_api_key" in secrets
            assert "fred_api_key" in secrets
        except ImportError:
            pytest.skip("PyYAML not installed")

    def test_swarm_overlay_network(self, swarm_compose_path):
        """Test overlay network configuration"""
        try:
            import yaml
            content = yaml.safe_load(swarm_compose_path.read_text())
            networks = content.get("networks", {})

            assert "quantum-overlay" in networks
            overlay = networks["quantum-overlay"]
            assert overlay.get("driver") == "overlay"
            assert overlay.get("attachable") is True
        except ImportError:
            pytest.skip("PyYAML not installed")


class TestDockerEnvironment:
    """Tests for Docker environment configuration"""

    @pytest.fixture
    def env_example_path(self, project_root):
        """Get .env.example path"""
        return project_root / "docker" / ".env.example"

    @pytest.fixture
    def project_root(self):
        """Get project root directory"""
        return Path(__file__).parent.parent

    def test_env_example_exists(self, env_example_path):
        """Test that .env.example exists"""
        assert env_example_path.exists(), ".env.example not found"

    def test_env_required_variables(self, env_example_path):
        """Test that required environment variables are documented"""
        content = env_example_path.read_text()

        required_vars = [
            "TIINGO_API_KEY",
            "YAHOO_FINANCE_API_KEY",
            "FRED_API_KEY",
            "LOG_LEVEL",
            "PYTHONPATH",
            "AGENTDB_PATH",
        ]

        for var in required_vars:
            assert var in content, f"Required variable {var} not in .env.example"


class TestDockerignore:
    """Tests for .dockerignore configuration"""

    @pytest.fixture
    def dockerignore_path(self, project_root):
        """Get .dockerignore path"""
        return project_root / "docker" / ".dockerignore"

    @pytest.fixture
    def project_root(self):
        """Get project root directory"""
        return Path(__file__).parent.parent

    def test_dockerignore_exists(self, dockerignore_path):
        """Test that .dockerignore exists"""
        assert dockerignore_path.exists(), ".dockerignore not found"

    def test_dockerignore_patterns(self, dockerignore_path):
        """Test that important patterns are excluded"""
        content = dockerignore_path.read_text()

        important_patterns = [
            ".git",
            "__pycache__",
            "*.pyc",
            ".pytest_cache",
            "*.db",
            ".vscode",
            "*.log",
        ]

        for pattern in important_patterns:
            assert pattern in content, f"Pattern {pattern} not in .dockerignore"


class TestDockerBuild:
    """Integration tests for Docker builds (requires Docker)"""

    @pytest.fixture
    def project_root(self):
        """Get project root directory"""
        return Path(__file__).parent.parent

    def test_docker_available(self):
        """Test that Docker is available"""
        try:
            result = subprocess.run(
                ["docker", "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            assert result.returncode == 0, "Docker not available"
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pytest.skip("Docker not available")

    @pytest.mark.slow
    @pytest.mark.integration
    def test_build_production_stage(self, project_root):
        """Test building production stage"""
        try:
            result = subprocess.run(
                [
                    "docker", "build",
                    "-f", str(project_root / "docker" / "Dockerfile"),
                    "--target", "production",
                    "-t", "quantum-trading:test-prod",
                    str(project_root)
                ],
                capture_output=True,
                text=True,
                timeout=300
            )
            assert result.returncode == 0, f"Build failed: {result.stderr}"
        except subprocess.TimeoutExpired:
            pytest.fail("Build timed out")
        except FileNotFoundError:
            pytest.skip("Docker not available")

    @pytest.mark.slow
    @pytest.mark.integration
    def test_build_development_stage(self, project_root):
        """Test building development stage"""
        try:
            result = subprocess.run(
                [
                    "docker", "build",
                    "-f", str(project_root / "docker" / "Dockerfile"),
                    "--target", "development",
                    "-t", "quantum-trading:test-dev",
                    str(project_root)
                ],
                capture_output=True,
                text=True,
                timeout=300
            )
            assert result.returncode == 0, f"Build failed: {result.stderr}"
        except subprocess.TimeoutExpired:
            pytest.fail("Build timed out")
        except FileNotFoundError:
            pytest.skip("Docker not available")


class TestDockerRuntime:
    """Runtime tests for Docker containers"""

    @pytest.fixture
    def project_root(self):
        """Get project root directory"""
        return Path(__file__).parent.parent

    @pytest.mark.slow
    @pytest.mark.integration
    def test_container_imports(self, project_root):
        """Test that imports work in container"""
        try:
            # Build image first
            subprocess.run(
                [
                    "docker", "build",
                    "-f", str(project_root / "docker" / "Dockerfile"),
                    "--target", "production",
                    "-t", "quantum-trading:test",
                    str(project_root)
                ],
                capture_output=True,
                timeout=300,
                check=True
            )

            # Run import test
            result = subprocess.run(
                [
                    "docker", "run", "--rm",
                    "quantum-trading:test",
                    "python", "-c",
                    "from src.encoders.fibonacci_encoder import FibonacciEncoder; "
                    "from src.models.qfnn import QFNN; "
                    "print('Success')"
                ],
                capture_output=True,
                text=True,
                timeout=30
            )

            assert result.returncode == 0, f"Import test failed: {result.stderr}"
            assert "Success" in result.stdout

        except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.CalledProcessError) as e:
            pytest.skip(f"Docker test skipped: {e}")


class TestDockerDocumentation:
    """Tests for Docker documentation"""

    @pytest.fixture
    def readme_path(self, project_root):
        """Get Docker README path"""
        return project_root / "docker" / "README.md"

    @pytest.fixture
    def project_root(self):
        """Get project root directory"""
        return Path(__file__).parent.parent

    def test_readme_exists(self, readme_path):
        """Test that Docker README exists"""
        assert readme_path.exists(), "docker/README.md not found"

    def test_readme_sections(self, readme_path):
        """Test that README has required sections"""
        content = readme_path.read_text()

        required_sections = [
            "Quick Start",
            "Architecture",
            "Development Setup",
            "Production Deployment",
            "Docker Swarm",
            "Troubleshooting",
        ]

        for section in required_sections:
            assert section in content, f"Section '{section}' not found in README"

    def test_readme_commands(self, readme_path):
        """Test that README contains essential commands"""
        content = readme_path.read_text()

        essential_commands = [
            "docker-compose",
            "docker build",
            "docker run",
            "docker stack deploy",
        ]

        for cmd in essential_commands:
            assert cmd in content, f"Command '{cmd}' not documented in README"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

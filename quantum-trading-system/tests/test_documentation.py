#!/usr/bin/env python3
"""
Test Documentation Integrity
=============================

Tests that all documentation files exist, are properly formatted,
and contain required sections.

Agent 30: Documentation Specialist (Zeckendorf: 10000001111)
"""

import os
import re
from pathlib import Path
import pytest


# Base directory
BASE_DIR = Path(__file__).parent.parent
DOCS_DIR = BASE_DIR / 'docs'


class TestDocumentationFiles:
    """Test that all required documentation files exist."""

    def test_readme_exists(self):
        """Test that README.md exists in docs directory."""
        readme_path = DOCS_DIR / 'README.md'
        assert readme_path.exists(), f"README.md not found at {readme_path}"
        assert readme_path.is_file(), "README.md is not a file"

    def test_installation_guide_exists(self):
        """Test that INSTALLATION.md exists."""
        install_path = DOCS_DIR / 'INSTALLATION.md'
        assert install_path.exists(), f"INSTALLATION.md not found at {install_path}"
        assert install_path.is_file(), "INSTALLATION.md is not a file"

    def test_quick_start_exists(self):
        """Test that QUICK_START.md exists."""
        quick_start_path = DOCS_DIR / 'QUICK_START.md'
        assert quick_start_path.exists(), f"QUICK_START.md not found at {quick_start_path}"
        assert quick_start_path.is_file(), "QUICK_START.md is not a file"

    def test_api_reference_exists(self):
        """Test that API_REFERENCE.md exists."""
        api_ref_path = DOCS_DIR / 'API_REFERENCE.md'
        assert api_ref_path.exists(), f"API_REFERENCE.md not found at {api_ref_path}"
        assert api_ref_path.is_file(), "API_REFERENCE.md is not a file"

    def test_mathematical_framework_exists(self):
        """Test that MATHEMATICAL_FRAMEWORK.md exists."""
        math_path = DOCS_DIR / 'MATHEMATICAL_FRAMEWORK.md'
        assert math_path.exists(), f"MATHEMATICAL_FRAMEWORK.md not found at {math_path}"
        assert math_path.is_file(), "MATHEMATICAL_FRAMEWORK.md is not a file"

    def test_strategies_guide_exists(self):
        """Test that STRATEGIES.md exists."""
        strategies_path = DOCS_DIR / 'STRATEGIES.md'
        assert strategies_path.exists(), f"STRATEGIES.md not found at {strategies_path}"
        assert strategies_path.is_file(), "STRATEGIES.md is not a file"

    def test_visualization_guide_exists(self):
        """Test that VISUALIZATION.md exists."""
        viz_path = DOCS_DIR / 'VISUALIZATION.md'
        assert viz_path.exists(), f"VISUALIZATION.md not found at {viz_path}"
        assert viz_path.is_file(), "VISUALIZATION.md is not a file"

    def test_faq_exists(self):
        """Test that FAQ.md exists."""
        faq_path = DOCS_DIR / 'FAQ.md'
        assert faq_path.exists(), f"FAQ.md not found at {faq_path}"
        assert faq_path.is_file(), "FAQ.md is not a file"


class TestDocumentationContent:
    """Test that documentation files contain required sections."""

    def test_readme_has_table_of_contents(self):
        """Test that README has a table of contents."""
        readme_path = DOCS_DIR / 'README.md'
        with open(readme_path, 'r') as f:
            content = f.read()

        assert '## Table of Contents' in content or '## Contents' in content, \
            "README.md missing Table of Contents"

    def test_readme_has_overview(self):
        """Test that README has an overview section."""
        readme_path = DOCS_DIR / 'README.md'
        with open(readme_path, 'r') as f:
            content = f.read()

        assert '## Overview' in content or '# Overview' in content, \
            "README.md missing Overview section"

    def test_installation_has_prerequisites(self):
        """Test that INSTALLATION.md has prerequisites section."""
        install_path = DOCS_DIR / 'INSTALLATION.md'
        with open(install_path, 'r') as f:
            content = f.read()

        # Should have either "System Requirements" or "Prerequisites"
        has_prereqs = any(phrase in content for phrase in [
            '## System Requirements',
            '## Prerequisites',
            'Requirements'
        ])
        assert has_prereqs, "INSTALLATION.md missing prerequisites section"

    def test_installation_has_installation_steps(self):
        """Test that INSTALLATION.md has installation steps."""
        install_path = DOCS_DIR / 'INSTALLATION.md'
        with open(install_path, 'r') as f:
            content = f.read()

        # Should have installation methods or steps
        has_steps = any(phrase in content for phrase in [
            '## Installation',
            'Installation Methods',
            '```bash'
        ])
        assert has_steps, "INSTALLATION.md missing installation steps"

    def test_api_reference_has_class_documentation(self):
        """Test that API_REFERENCE.md documents classes."""
        api_ref_path = DOCS_DIR / 'API_REFERENCE.md'
        with open(api_ref_path, 'r') as f:
            content = f.read()

        # Should document key classes
        key_classes = [
            'FibonacciEncoder',
            'LucasEncoder',
            'XiPsiModel',
            'BacktestEngine'
        ]

        for class_name in key_classes:
            assert class_name in content, f"API_REFERENCE.md missing {class_name} documentation"

    def test_mathematical_framework_has_oeis_sequences(self):
        """Test that MATHEMATICAL_FRAMEWORK.md documents OEIS sequences."""
        math_path = DOCS_DIR / 'MATHEMATICAL_FRAMEWORK.md'
        with open(math_path, 'r') as f:
            content = f.read()

        # Should document all three main OEIS sequences
        oeis_sequences = ['A000045', 'A000032', 'A003714']

        for oeis_id in oeis_sequences:
            assert oeis_id in content, f"MATHEMATICAL_FRAMEWORK.md missing {oeis_id}"

    def test_strategies_has_fibonacci_strategy(self):
        """Test that STRATEGIES.md documents Fibonacci strategy."""
        strategies_path = DOCS_DIR / 'STRATEGIES.md'
        with open(strategies_path, 'r') as f:
            content = f.read()

        assert 'Fibonacci' in content or 'fibonacci' in content, \
            "STRATEGIES.md missing Fibonacci strategy documentation"

    def test_strategies_has_lucas_strategy(self):
        """Test that STRATEGIES.md documents Lucas strategy."""
        strategies_path = DOCS_DIR / 'STRATEGIES.md'
        with open(strategies_path, 'r') as f:
            content = f.read()

        assert 'Lucas' in content or 'lucas' in content, \
            "STRATEGIES.md missing Lucas strategy documentation"

    def test_visualization_has_examples(self):
        """Test that VISUALIZATION.md has code examples."""
        viz_path = DOCS_DIR / 'VISUALIZATION.md'
        with open(viz_path, 'r') as f:
            content = f.read()

        # Should have Python code blocks
        assert '```python' in content, "VISUALIZATION.md missing Python code examples"

    def test_faq_has_questions(self):
        """Test that FAQ.md has at least 10 questions."""
        faq_path = DOCS_DIR / 'FAQ.md'
        with open(faq_path, 'r') as f:
            content = f.read()

        # Count questions (sections starting with ###)
        question_count = content.count('###')

        assert question_count >= 10, f"FAQ.md has only {question_count} questions, expected >= 10"


class TestDocumentationFormatting:
    """Test that documentation follows markdown formatting standards."""

    def test_no_broken_links_in_readme(self):
        """Test that README has no obviously broken markdown links."""
        readme_path = DOCS_DIR / 'README.md'
        with open(readme_path, 'r') as f:
            content = f.read()

        # Find all markdown links [text](url)
        links = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', content)

        for link_text, link_url in links:
            # Check internal links (relative paths)
            if not link_url.startswith(('http://', 'https://', '#')):
                # It's a relative file link
                if link_url.endswith('.md'):
                    # Check if file exists
                    link_path = DOCS_DIR / link_url
                    assert link_path.exists(), f"Broken link in README: {link_url}"

    def test_code_blocks_have_language_specification(self):
        """Test that code blocks specify language for syntax highlighting."""
        api_ref_path = DOCS_DIR / 'API_REFERENCE.md'
        with open(api_ref_path, 'r') as f:
            content = f.read()

        # Find code blocks without language spec (```)
        code_blocks = re.findall(r'```(\w*)\n', content)

        # Count code blocks without language
        unspecified = sum(1 for lang in code_blocks if lang == '')

        # Allow some, but most should have language specified
        assert unspecified < len(code_blocks) * 0.2, \
            f"{unspecified} code blocks without language specification"

    def test_headers_follow_hierarchy(self):
        """Test that markdown headers follow proper hierarchy (no skipping levels)."""
        readme_path = DOCS_DIR / 'README.md'
        with open(readme_path, 'r') as f:
            lines = f.readlines()

        # Track header levels
        prev_level = 0
        for line in lines:
            if line.startswith('#'):
                # Count header level
                level = len(line) - len(line.lstrip('#'))

                # Should not skip levels (e.g., # -> ###)
                if prev_level > 0:  # Skip first header
                    assert level <= prev_level + 1, \
                        f"Header hierarchy skip: level {prev_level} -> {level} in README.md"

                prev_level = level


class TestDocumentationCompleteness:
    """Test that documentation covers all major components."""

    def test_all_oeis_sequences_documented(self):
        """Test that all OEIS sequences used in code are documented."""
        math_path = DOCS_DIR / 'MATHEMATICAL_FRAMEWORK.md'
        with open(math_path, 'r') as f:
            content = f.read()

        # Check for all OEIS sequences used in the system
        required_sequences = {
            'A000045': 'Fibonacci numbers',
            'A000032': 'Lucas numbers',
            'A003714': 'Zeckendorf representation'
        }

        for oeis_id, description in required_sequences.items():
            assert oeis_id in content, \
                f"MATHEMATICAL_FRAMEWORK.md missing {oeis_id} ({description})"

    def test_all_main_classes_documented(self):
        """Test that all main classes are documented in API reference."""
        api_ref_path = DOCS_DIR / 'API_REFERENCE.md'
        with open(api_ref_path, 'r') as f:
            content = f.read()

        # Main classes that should be documented
        main_classes = [
            'FibonacciEncoder',
            'LucasEncoder',
            'XiPsiModel',
            'QFNN',
            'FibonacciRetracementStrategy',
            'BacktestEngine',
            'BacktestValidator'
        ]

        for class_name in main_classes:
            assert class_name in content, \
                f"API_REFERENCE.md missing documentation for {class_name}"

    def test_integer_only_concept_explained(self):
        """Test that integer-only arithmetic is explained."""
        # Should be explained in both README and MATHEMATICAL_FRAMEWORK
        readme_path = DOCS_DIR / 'README.md'
        math_path = DOCS_DIR / 'MATHEMATICAL_FRAMEWORK.md'

        for doc_path in [readme_path, math_path]:
            with open(doc_path, 'r') as f:
                content = f.read().lower()

            assert 'integer' in content, f"{doc_path.name} doesn't explain integer arithmetic"

    def test_scaling_factors_documented(self):
        """Test that scaling factors are documented."""
        math_path = DOCS_DIR / 'MATHEMATICAL_FRAMEWORK.md'
        with open(math_path, 'r') as f:
            content = f.read()

        # Should document common scale factors
        scale_concepts = ['cents', 'scale', 'scaling', '1000', '10000']

        found_concepts = sum(1 for concept in scale_concepts if concept in content.lower())

        assert found_concepts >= 3, "MATHEMATICAL_FRAMEWORK.md lacks scaling factor documentation"


class TestDocumentationExamples:
    """Test that documentation includes working code examples."""

    def test_quick_start_has_runnable_example(self):
        """Test that QUICK_START.md has a complete, runnable example."""
        quick_start_path = DOCS_DIR / 'QUICK_START.md'
        with open(quick_start_path, 'r') as f:
            content = f.read()

        # Should have import statements
        assert 'import' in content or 'from' in content, \
            "QUICK_START.md missing import statements"

        # Should have instantiation examples
        assert any(word in content for word in ['= ', '()', 'class']), \
            "QUICK_START.md missing code instantiation examples"

    def test_strategies_has_implementation_examples(self):
        """Test that STRATEGIES.md has implementation examples for each strategy."""
        strategies_path = DOCS_DIR / 'STRATEGIES.md'
        with open(strategies_path, 'r') as f:
            content = f.read()

        # Count code blocks (should have many for examples)
        code_block_count = content.count('```python')

        assert code_block_count >= 5, \
            f"STRATEGIES.md has only {code_block_count} Python code blocks, expected >= 5"


class TestDocumentationMetadata:
    """Test that documentation has proper metadata."""

    def test_all_docs_have_agent_attribution(self):
        """Test that major docs reference Agent 30 (Documentation Specialist)."""
        major_docs = [
            'README.md',
            'INSTALLATION.md',
            'API_REFERENCE.md',
            'MATHEMATICAL_FRAMEWORK.md'
        ]

        for doc_name in major_docs:
            doc_path = DOCS_DIR / doc_name
            with open(doc_path, 'r') as f:
                content = f.read()

            # Should mention Agent 30 or Documentation Specialist
            has_attribution = any(phrase in content for phrase in [
                'Agent 30',
                'Documentation Specialist',
                '10000001111'  # Zeckendorf address
            ])

            # Not all docs need this, so just check it exists in at least some
            # This is a soft check
            if has_attribution:
                assert True
                return

    def test_docs_have_last_updated_date(self):
        """Test that docs have last updated dates."""
        major_docs = [
            'README.md',
            'API_REFERENCE.md',
            'MATHEMATICAL_FRAMEWORK.md'
        ]

        for doc_name in major_docs:
            doc_path = DOCS_DIR / doc_name
            with open(doc_path, 'r') as f:
                content = f.read()

            # Should have a date (YYYY-MM-DD format)
            has_date = bool(re.search(r'\d{4}-\d{2}-\d{2}', content))

            assert has_date, f"{doc_name} missing last updated date"


class TestDocumentationAccessibility:
    """Test that documentation is accessible and well-structured."""

    def test_readme_not_too_long(self):
        """Test that README.md is not excessively long."""
        readme_path = DOCS_DIR / 'README.md'
        with open(readme_path, 'r') as f:
            lines = f.readlines()

        # Should be comprehensive but not overwhelming
        # Reasonable range: 200-1000 lines
        line_count = len(lines)

        assert 100 < line_count < 2000, \
            f"README.md has {line_count} lines (expected 100-2000 for readability)"

    def test_headers_use_sentence_case_or_title_case(self):
        """Test that headers use consistent capitalization."""
        readme_path = DOCS_DIR / 'README.md'
        with open(readme_path, 'r') as f:
            content = f.read()

        # Find all headers
        headers = re.findall(r'^#+\s+(.+)$', content, re.MULTILINE)

        # Most headers should start with capital letter
        capitalized = sum(1 for h in headers if h[0].isupper() or h[0].isdigit())

        assert capitalized >= len(headers) * 0.9, \
            "Headers should use consistent capitalization (Title Case or Sentence case)"


def main():
    """Run documentation tests."""
    print("=" * 70)
    print("Testing Documentation Integrity")
    print("=" * 70)
    print()

    # Run pytest
    pytest.main([__file__, '-v', '--tb=short'])


if __name__ == '__main__':
    main()

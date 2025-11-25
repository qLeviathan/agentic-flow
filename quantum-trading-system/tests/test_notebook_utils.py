"""
Test Suite for Jupyter Notebook Utilities
=========================================

Comprehensive tests for notebook generation, formatting,
cell management, and R markdown support.
"""

import unittest
import json
import tempfile
import os
from typing import Dict, Any

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from notebooks.notebook_utils import (
    NotebookUtilities,
    quick_notebook,
    create_analysis_notebook
)


class TestNotebookCreation(unittest.TestCase):
    """Test notebook structure creation."""

    def setUp(self):
        self.utils = NotebookUtilities()

    def test_create_empty_notebook(self):
        """Test creating an empty notebook."""
        nb = self.utils.create_notebook()

        self.assertEqual(nb["nbformat"], 4)
        self.assertEqual(nb["nbformat_minor"], 5)
        self.assertIn("metadata", nb)
        self.assertIn("cells", nb)
        self.assertEqual(len(nb["cells"]), 0)

    def test_notebook_metadata_structure(self):
        """Test notebook metadata structure."""
        nb = self.utils.create_notebook()

        metadata = nb["metadata"]
        self.assertIn("kernelspec", metadata)
        self.assertIn("language_info", metadata)
        self.assertIn("created", metadata)
        self.assertIn("quantum_trading_system", metadata)

        # Verify integer-only flag
        self.assertTrue(metadata["quantum_trading_system"]["integer_only"])

    def test_python_kernel_info(self):
        """Test Python kernel information."""
        utils = NotebookUtilities(kernel_name="python3")
        nb = utils.create_notebook()

        lang_info = nb["metadata"]["language_info"]
        self.assertEqual(lang_info["name"], "python")
        self.assertEqual(lang_info["file_extension"], ".py")

    def test_r_kernel_info(self):
        """Test R kernel information."""
        utils = NotebookUtilities(kernel_name="ir")
        nb = utils.create_notebook()

        lang_info = nb["metadata"]["language_info"]
        self.assertEqual(lang_info["name"], "R")
        self.assertEqual(lang_info["file_extension"], ".r")


class TestCellCreation(unittest.TestCase):
    """Test cell creation functions."""

    def setUp(self):
        self.utils = NotebookUtilities()

    def test_create_code_cell_string(self):
        """Test creating code cell from string."""
        code = "print('Hello World')"
        cell = self.utils.create_code_cell(code)

        self.assertEqual(cell["cell_type"], "code")
        self.assertIsNone(cell["execution_count"])
        self.assertEqual(cell["outputs"], [])
        self.assertIsInstance(cell["source"], list)

    def test_create_code_cell_list(self):
        """Test creating code cell from list."""
        code_lines = ["import numpy as np\n", "x = 100\n"]
        cell = self.utils.create_code_cell(code_lines)

        self.assertEqual(cell["cell_type"], "code")
        self.assertEqual(len(cell["source"]), 2)

    def test_create_markdown_cell(self):
        """Test creating markdown cell."""
        markdown = "# Title\n\nThis is a test."
        cell = self.utils.create_markdown_cell(markdown)

        self.assertEqual(cell["cell_type"], "markdown")
        self.assertIsInstance(cell["source"], list)
        self.assertIn("metadata", cell)

    def test_create_raw_cell(self):
        """Test creating raw cell."""
        raw_text = "Raw content here"
        cell = self.utils.create_raw_cell(raw_text)

        self.assertEqual(cell["cell_type"], "raw")
        self.assertIsInstance(cell["source"], list)

    def test_code_cell_with_execution_count(self):
        """Test code cell with execution count."""
        cell = self.utils.create_code_cell("x = 5", execution_count=1)

        self.assertEqual(cell["execution_count"], 1)

    def test_code_cell_with_metadata(self):
        """Test code cell with custom metadata."""
        metadata = {"tags": ["test"], "collapsed": False}
        cell = self.utils.create_code_cell("pass", metadata=metadata)

        self.assertEqual(cell["metadata"], metadata)


class TestMarkdownFormatting(unittest.TestCase):
    """Test markdown formatting utilities."""

    def setUp(self):
        self.utils = NotebookUtilities()

    def test_format_heading_levels(self):
        """Test heading formatting at different levels."""
        h1 = self.utils.format_heading("Title", 1)
        h2 = self.utils.format_heading("Subtitle", 2)
        h3 = self.utils.format_heading("Section", 3)

        self.assertEqual(h1, "# Title")
        self.assertEqual(h2, "## Subtitle")
        self.assertEqual(h3, "### Section")

    def test_format_heading_bounds(self):
        """Test heading level bounds."""
        h_min = self.utils.format_heading("Min", 0)
        h_max = self.utils.format_heading("Max", 10)

        self.assertEqual(h_min, "# Min")  # Should clamp to 1
        self.assertEqual(h_max, "###### Max")  # Should clamp to 6

    def test_format_bold(self):
        """Test bold formatting."""
        bold = self.utils.format_bold("important")
        self.assertEqual(bold, "**important**")

    def test_format_italic(self):
        """Test italic formatting."""
        italic = self.utils.format_italic("emphasis")
        self.assertEqual(italic, "*emphasis*")

    def test_format_code_inline(self):
        """Test inline code formatting."""
        code = self.utils.format_code_inline("x = 5")
        self.assertEqual(code, "`x = 5`")

    def test_format_code_block(self):
        """Test code block formatting."""
        code = "def hello():\n    print('hi')"
        block = self.utils.format_code_block(code, "python")

        self.assertIn("```python", block)
        self.assertIn(code, block)
        self.assertIn("```", block)

    def test_format_unordered_list(self):
        """Test unordered list formatting."""
        items = ["First item", "Second item", "Third item"]
        list_md = self.utils.format_list(items, ordered=False)

        self.assertIn("- First item", list_md)
        self.assertIn("- Second item", list_md)
        self.assertIn("- Third item", list_md)

    def test_format_ordered_list(self):
        """Test ordered list formatting."""
        items = ["First", "Second", "Third"]
        list_md = self.utils.format_list(items, ordered=True)

        self.assertIn("1. First", list_md)
        self.assertIn("2. Second", list_md)
        self.assertIn("3. Third", list_md)

    def test_format_list_indented(self):
        """Test indented list formatting."""
        items = ["Nested item"]
        list_md = self.utils.format_list(items, ordered=False, indent_level=1)

        self.assertIn("  - Nested item", list_md)

    def test_format_table(self):
        """Test table formatting."""
        headers = ["Name", "Value", "Type"]
        rows = [
            ["x", "100", "int"],
            ["y", "200", "int"]
        ]
        table = self.utils.format_table(headers, rows)

        self.assertIn("| Name | Value | Type |", table)
        self.assertIn("| x | 100 | int |", table)
        self.assertIn("| y | 200 | int |", table)

    def test_format_table_alignment(self):
        """Test table alignment options."""
        headers = ["Left", "Center", "Right"]
        rows = [["L", "C", "R"]]
        alignment = ["left", "center", "right"]
        table = self.utils.format_table(headers, rows, alignment)

        self.assertIn(":---", table)
        self.assertIn(":---:", table)
        self.assertIn("---:", table)

    def test_format_inline_equation(self):
        """Test inline equation formatting."""
        eq = self.utils.format_equation("x^2", inline=True)
        self.assertEqual(eq, "$x^2$")

    def test_format_display_equation(self):
        """Test display equation formatting."""
        eq = self.utils.format_equation("E = mc^2", inline=False)
        self.assertIn("$$", eq)
        self.assertIn("E = mc^2", eq)

    def test_format_link(self):
        """Test link formatting."""
        link = self.utils.format_link("GitHub", "https://github.com")
        self.assertEqual(link, "[GitHub](https://github.com)")

    def test_format_image(self):
        """Test image formatting."""
        img = self.utils.format_image("Plot", "/path/to/plot.png")
        self.assertEqual(img, "![Plot](/path/to/plot.png)")

    def test_format_image_with_title(self):
        """Test image formatting with title."""
        img = self.utils.format_image("Plot", "/path/to/plot.png", "Results")
        self.assertEqual(img, '![Plot](/path/to/plot.png "Results")')


class TestOutputFormatting(unittest.TestCase):
    """Test output formatting utilities."""

    def setUp(self):
        self.utils = NotebookUtilities()

    def test_create_stream_output_stdout(self):
        """Test creating stdout stream output."""
        output = self.utils.create_stream_output("Hello World\n", "stdout")

        self.assertEqual(output["output_type"], "stream")
        self.assertEqual(output["name"], "stdout")
        self.assertIsInstance(output["text"], list)

    def test_create_stream_output_stderr(self):
        """Test creating stderr stream output."""
        output = self.utils.create_stream_output("Error!", "stderr")

        self.assertEqual(output["name"], "stderr")

    def test_create_display_data_output(self):
        """Test creating display_data output."""
        data = {"text/plain": "Result", "text/html": "<b>Result</b>"}
        output = self.utils.create_display_data_output(data)

        self.assertEqual(output["output_type"], "display_data")
        self.assertEqual(output["data"], data)
        self.assertIn("metadata", output)

    def test_create_execute_result_output(self):
        """Test creating execute_result output."""
        data = {"text/plain": "42"}
        output = self.utils.create_execute_result_output(data, execution_count=5)

        self.assertEqual(output["output_type"], "execute_result")
        self.assertEqual(output["execution_count"], 5)
        self.assertEqual(output["data"], data)

    def test_create_error_output(self):
        """Test creating error output."""
        output = self.utils.create_error_output(
            "ValueError",
            "invalid value",
            ["Traceback (most recent call last):", "  ValueError: invalid value"]
        )

        self.assertEqual(output["output_type"], "error")
        self.assertEqual(output["ename"], "ValueError")
        self.assertEqual(output["evalue"], "invalid value")
        self.assertIsInstance(output["traceback"], list)


class TestCellMetadata(unittest.TestCase):
    """Test cell metadata management."""

    def setUp(self):
        self.utils = NotebookUtilities()

    def test_add_metadata(self):
        """Test adding metadata to cell."""
        cell = self.utils.create_code_cell("pass")
        updated = self.utils.add_metadata(cell, "custom_key", "custom_value")

        self.assertEqual(updated["metadata"]["custom_key"], "custom_value")

    def test_add_tags(self):
        """Test adding tags to cell."""
        cell = self.utils.create_code_cell("pass")
        updated = self.utils.add_tags(cell, ["test", "important"])

        self.assertIn("tags", updated["metadata"])
        self.assertEqual(len(updated["metadata"]["tags"]), 2)
        self.assertIn("test", updated["metadata"]["tags"])

    def test_collapse_input(self):
        """Test collapsing cell input."""
        cell = self.utils.create_code_cell("pass")
        updated = self.utils.collapse_input(cell)

        self.assertTrue(updated["metadata"]["jupyter"]["source_hidden"])

    def test_collapse_output(self):
        """Test collapsing cell output."""
        cell = self.utils.create_code_cell("pass")
        updated = self.utils.collapse_output(cell)

        self.assertTrue(updated["metadata"]["jupyter"]["outputs_hidden"])


class TestRMarkdownSupport(unittest.TestCase):
    """Test R Markdown style support."""

    def setUp(self):
        self.utils = NotebookUtilities(kernel_name="ir")

    def test_create_r_markdown_header(self):
        """Test R Markdown YAML header creation."""
        header = self.utils.create_r_markdown_header(
            title="Analysis Report",
            author="Data Scientist",
            output="html_document"
        )

        self.assertIn("---", header)
        self.assertIn('title: "Analysis Report"', header)
        self.assertIn('author: "Data Scientist"', header)
        self.assertIn("output: html_document", header)

    def test_create_r_markdown_header_minimal(self):
        """Test minimal R Markdown header."""
        header = self.utils.create_r_markdown_header(title="Report")

        self.assertIn('title: "Report"', header)
        self.assertIn("date:", header)

    def test_create_r_code_chunk_basic(self):
        """Test basic R code chunk creation."""
        chunk = self.utils.create_r_code_chunk("x <- 1:10\nplot(x)")

        self.assertIn("```{r}", chunk)
        self.assertIn("x <- 1:10", chunk)
        self.assertIn("```", chunk)

    def test_create_r_code_chunk_named(self):
        """Test named R code chunk."""
        chunk = self.utils.create_r_code_chunk(
            "summary(data)",
            chunk_name="summary-stats"
        )

        self.assertIn("```{r summary-stats}", chunk)

    def test_create_r_code_chunk_options(self):
        """Test R code chunk with options."""
        chunk = self.utils.create_r_code_chunk(
            "plot(x, y)",
            chunk_name="plot1",
            echo=True,
            eval=True,
            warning=False
        )

        self.assertIn("echo=True", chunk)
        self.assertIn("eval=True", chunk)
        self.assertIn("warning=False", chunk)


class TestIntegerValidation(unittest.TestCase):
    """Test integer-only validation."""

    def setUp(self):
        self.utils = NotebookUtilities()

    def test_validate_integer_safe_code(self):
        """Test validating integer-safe code."""
        cell = self.utils.create_code_cell("x = 100\ny = 200\nz = x + y")

        self.assertTrue(self.utils.validate_integer_cell(cell))

    def test_validate_float_literal_detected(self):
        """Test detecting float literals."""
        cell = self.utils.create_code_cell("x = 3.14")

        self.assertFalse(self.utils.validate_integer_cell(cell))

    def test_validate_float_function_detected(self):
        """Test detecting float conversion."""
        cell = self.utils.create_code_cell("x = float(5)")

        self.assertFalse(self.utils.validate_integer_cell(cell))

    def test_validate_markdown_always_safe(self):
        """Test markdown cells always validate."""
        cell = self.utils.create_markdown_cell("x = 3.14")

        self.assertTrue(self.utils.validate_integer_cell(cell))


class TestFileOperations(unittest.TestCase):
    """Test notebook file operations."""

    def setUp(self):
        self.utils = NotebookUtilities()
        self.temp_file = None

    def tearDown(self):
        if self.temp_file and os.path.exists(self.temp_file):
            os.remove(self.temp_file)

    def test_save_and_load_notebook(self):
        """Test saving and loading notebook."""
        nb = self.utils.create_notebook()
        nb["cells"].append(self.utils.create_code_cell("print('test')"))

        with tempfile.NamedTemporaryFile(
            mode='w',
            suffix='.ipynb',
            delete=False
        ) as f:
            self.temp_file = f.name

        self.utils.save_notebook(nb, self.temp_file)
        loaded_nb = self.utils.load_notebook(self.temp_file)

        self.assertEqual(loaded_nb["nbformat"], nb["nbformat"])
        self.assertEqual(len(loaded_nb["cells"]), 1)


class TestUtilityFunctions(unittest.TestCase):
    """Test utility functions."""

    def setUp(self):
        self.utils = NotebookUtilities()

    def test_count_cells_total(self):
        """Test counting total cells."""
        nb = self.utils.create_notebook()
        nb["cells"].append(self.utils.create_code_cell("pass"))
        nb["cells"].append(self.utils.create_markdown_cell("# Title"))

        count = self.utils.count_cells(nb)
        self.assertEqual(count, 2)

    def test_count_cells_by_type(self):
        """Test counting cells by type."""
        nb = self.utils.create_notebook()
        nb["cells"].append(self.utils.create_code_cell("pass"))
        nb["cells"].append(self.utils.create_code_cell("x = 5"))
        nb["cells"].append(self.utils.create_markdown_cell("# Title"))

        code_count = self.utils.count_cells(nb, cell_type="code")
        markdown_count = self.utils.count_cells(nb, cell_type="markdown")

        self.assertEqual(code_count, 2)
        self.assertEqual(markdown_count, 1)

    def test_extract_code(self):
        """Test extracting code from notebook."""
        nb = self.utils.create_notebook()
        nb["cells"].append(self.utils.create_code_cell("x = 5"))
        nb["cells"].append(self.utils.create_markdown_cell("# Title"))
        nb["cells"].append(self.utils.create_code_cell("y = 10"))

        code = self.utils.extract_code(nb)

        self.assertIn("x = 5", code)
        self.assertIn("y = 10", code)
        self.assertNotIn("# Title", code)

    def test_get_cell_stats(self):
        """Test getting cell statistics."""
        nb = self.utils.create_notebook()
        nb["cells"].append(self.utils.create_code_cell("x = 5", execution_count=1))
        nb["cells"].append(self.utils.create_code_cell("y = 10"))
        nb["cells"].append(self.utils.create_markdown_cell("# Title"))

        stats = self.utils.get_cell_stats(nb)

        self.assertEqual(stats["total_cells"], 3)
        self.assertEqual(stats["code_cells"], 2)
        self.assertEqual(stats["markdown_cells"], 1)
        self.assertEqual(stats["executed_cells"], 1)


class TestConvenienceFunctions(unittest.TestCase):
    """Test convenience functions."""

    def test_quick_notebook(self):
        """Test quick notebook creation."""
        cells = [
            ("markdown", "# Analysis"),
            ("code", "import numpy as np"),
            ("code", "x = np.array([1, 2, 3])")
        ]

        nb = quick_notebook(cells, title="Test Notebook")

        self.assertEqual(len(nb["cells"]), 4)  # title + 3 cells
        self.assertEqual(nb["cells"][0]["cell_type"], "markdown")

    def test_create_analysis_notebook(self):
        """Test creating analysis notebook."""
        nb = create_analysis_notebook(
            title="Data Analysis",
            description="Analysis of trading data",
            setup_code="import numpy as np\nimport pandas as pd",
            analysis_sections=[
                ("Load Data", "data = pd.read_csv('data.csv')"),
                ("Analyze", "data.describe()")
            ]
        )

        cells = nb["cells"]
        self.assertGreater(len(cells), 0)

        # Check structure
        self.assertEqual(cells[0]["cell_type"], "markdown")  # Title
        self.assertIn("Data Analysis", "".join(cells[0]["source"]))


def run_tests():
    """Run all test suites with detailed output."""
    print("=" * 70)
    print("Jupyter Notebook Utilities Test Suite")
    print("=" * 70)

    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()

    # Add all test cases
    suite.addTests(loader.loadTestsFromTestCase(TestNotebookCreation))
    suite.addTests(loader.loadTestsFromTestCase(TestCellCreation))
    suite.addTests(loader.loadTestsFromTestCase(TestMarkdownFormatting))
    suite.addTests(loader.loadTestsFromTestCase(TestOutputFormatting))
    suite.addTests(loader.loadTestsFromTestCase(TestCellMetadata))
    suite.addTests(loader.loadTestsFromTestCase(TestRMarkdownSupport))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegerValidation))
    suite.addTests(loader.loadTestsFromTestCase(TestFileOperations))
    suite.addTests(loader.loadTestsFromTestCase(TestUtilityFunctions))
    suite.addTests(loader.loadTestsFromTestCase(TestConvenienceFunctions))

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Summary
    print("\n" + "=" * 70)
    print("Test Summary")
    print("=" * 70)
    print(f"Tests Run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")

    if result.wasSuccessful():
        print("\n✅ ALL TESTS PASSED - Notebook Utilities Ready")
    else:
        print("\n❌ TESTS FAILED - Review failures above")

    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)

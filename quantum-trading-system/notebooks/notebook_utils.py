"""
Jupyter Notebook Utilities for Quantum Trading System
=====================================================

Comprehensive utilities for Jupyter notebook generation, formatting,
cell management, and R markdown style support.

Author: Agent 26 - Jupyter Specialist
Integer-Only Framework: All operations maintain integer precision
"""

import json
from typing import List, Dict, Any, Optional, Union, Tuple
from datetime import datetime
import re


class NotebookUtilities:
    """
    Comprehensive utilities for Jupyter notebook operations.

    Features:
    - Cell generation (code, markdown, raw)
    - Markdown formatting (headings, lists, tables, equations)
    - Code cell creation with metadata
    - Output formatting
    - Cell metadata management
    - R markdown style support
    - Integer-only validation
    """

    # Notebook format version
    NBFORMAT_VERSION = 4
    NBFORMAT_MINOR_VERSION = 5

    # Cell types
    CELL_TYPE_CODE = "code"
    CELL_TYPE_MARKDOWN = "markdown"
    CELL_TYPE_RAW = "raw"

    # Kernel specifications
    KERNEL_PYTHON = "python3"
    KERNEL_R = "ir"

    def __init__(self, kernel_name: str = KERNEL_PYTHON):
        """
        Initialize notebook utilities.

        Args:
            kernel_name: Kernel specification (python3, ir, etc.)
        """
        self.kernel_name = kernel_name
        self.execution_count = 0

    # ==================== Notebook Creation ====================

    def create_notebook(
        self,
        cells: Optional[List[Dict[str, Any]]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a complete Jupyter notebook structure.

        Args:
            cells: List of cell dictionaries
            metadata: Notebook metadata

        Returns:
            Complete notebook dictionary
        """
        default_metadata = {
            "kernelspec": {
                "display_name": "Python 3" if self.kernel_name == "python3" else "R",
                "language": "python" if self.kernel_name == "python3" else "R",
                "name": self.kernel_name
            },
            "language_info": self._get_language_info(),
            "created": datetime.utcnow().isoformat() + "Z",
            "quantum_trading_system": {
                "integer_only": True,
                "framework": "Quantum Trading System",
                "agent": "Jupyter Specialist"
            }
        }

        if metadata:
            default_metadata.update(metadata)

        return {
            "nbformat": self.NBFORMAT_VERSION,
            "nbformat_minor": self.NBFORMAT_MINOR_VERSION,
            "metadata": default_metadata,
            "cells": cells or []
        }

    def _get_language_info(self) -> Dict[str, Any]:
        """Get language info based on kernel."""
        if self.kernel_name == "python3":
            return {
                "name": "python",
                "version": "3.10.0",
                "mimetype": "text/x-python",
                "codemirror_mode": {"name": "ipython", "version": 3},
                "pygments_lexer": "ipython3",
                "nbconvert_exporter": "python",
                "file_extension": ".py"
            }
        elif self.kernel_name == "ir":
            return {
                "name": "R",
                "version": "4.0.0",
                "mimetype": "text/x-r-source",
                "file_extension": ".r"
            }
        else:
            return {"name": self.kernel_name}

    # ==================== Cell Creation ====================

    def create_code_cell(
        self,
        source: Union[str, List[str]],
        outputs: Optional[List[Dict[str, Any]]] = None,
        execution_count: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a code cell.

        Args:
            source: Code source (string or list of lines)
            outputs: Cell outputs
            execution_count: Execution count (None if not executed)
            metadata: Cell metadata

        Returns:
            Code cell dictionary
        """
        if isinstance(source, str):
            source = source.split('\n')
            if source and not source[-1].endswith('\n'):
                source[-1] += '\n'
            else:
                source = [line + '\n' for line in source[:-1]] + [source[-1]]

        cell = {
            "cell_type": self.CELL_TYPE_CODE,
            "execution_count": execution_count,
            "metadata": metadata or {},
            "source": source,
            "outputs": outputs or []
        }

        return cell

    def create_markdown_cell(
        self,
        source: Union[str, List[str]],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a markdown cell.

        Args:
            source: Markdown source (string or list of lines)
            metadata: Cell metadata

        Returns:
            Markdown cell dictionary
        """
        if isinstance(source, str):
            source = source.split('\n')
            if source and not source[-1].endswith('\n'):
                source[-1] += '\n'
            else:
                source = [line + '\n' for line in source[:-1]] + [source[-1]]

        return {
            "cell_type": self.CELL_TYPE_MARKDOWN,
            "metadata": metadata or {},
            "source": source
        }

    def create_raw_cell(
        self,
        source: Union[str, List[str]],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a raw cell.

        Args:
            source: Raw source (string or list of lines)
            metadata: Cell metadata

        Returns:
            Raw cell dictionary
        """
        if isinstance(source, str):
            source = source.split('\n')
            if source and not source[-1].endswith('\n'):
                source[-1] += '\n'
            else:
                source = [line + '\n' for line in source[:-1]] + [source[-1]]

        return {
            "cell_type": self.CELL_TYPE_RAW,
            "metadata": metadata or {},
            "source": source
        }

    # ==================== Markdown Formatting ====================

    def format_heading(self, text: str, level: int = 1) -> str:
        """
        Format a markdown heading.

        Args:
            text: Heading text
            level: Heading level (1-6)

        Returns:
            Formatted heading string
        """
        level = max(1, min(6, level))
        return f"{'#' * level} {text}"

    def format_bold(self, text: str) -> str:
        """Format text as bold."""
        return f"**{text}**"

    def format_italic(self, text: str) -> str:
        """Format text as italic."""
        return f"*{text}*"

    def format_code_inline(self, text: str) -> str:
        """Format inline code."""
        return f"`{text}`"

    def format_code_block(self, code: str, language: str = "python") -> str:
        """
        Format a code block.

        Args:
            code: Code content
            language: Language identifier

        Returns:
            Formatted code block
        """
        return f"```{language}\n{code}\n```"

    def format_list(
        self,
        items: List[str],
        ordered: bool = False,
        indent_level: int = 0
    ) -> str:
        """
        Format a list.

        Args:
            items: List items
            ordered: Whether to use ordered list
            indent_level: Indentation level

        Returns:
            Formatted list string
        """
        indent = "  " * indent_level
        lines = []

        for i, item in enumerate(items, 1):
            if ordered:
                lines.append(f"{indent}{i}. {item}")
            else:
                lines.append(f"{indent}- {item}")

        return "\n".join(lines)

    def format_table(
        self,
        headers: List[str],
        rows: List[List[str]],
        alignment: Optional[List[str]] = None
    ) -> str:
        """
        Format a markdown table.

        Args:
            headers: Table headers
            rows: Table rows
            alignment: Column alignment ('left', 'center', 'right')

        Returns:
            Formatted table string
        """
        if not alignment:
            alignment = ['left'] * len(headers)

        # Header row
        header_line = "| " + " | ".join(headers) + " |"

        # Separator row
        separators = []
        for align in alignment:
            if align == 'center':
                separators.append(":---:")
            elif align == 'right':
                separators.append("---:")
            else:
                separators.append(":---")
        separator_line = "| " + " | ".join(separators) + " |"

        # Data rows
        data_lines = []
        for row in rows:
            data_lines.append("| " + " | ".join(str(cell) for cell in row) + " |")

        return "\n".join([header_line, separator_line] + data_lines)

    def format_equation(self, equation: str, inline: bool = False) -> str:
        """
        Format a LaTeX equation.

        Args:
            equation: LaTeX equation
            inline: Whether to format as inline equation

        Returns:
            Formatted equation string
        """
        if inline:
            return f"${equation}$"
        else:
            return f"$$\n{equation}\n$$"

    def format_link(self, text: str, url: str) -> str:
        """Format a markdown link."""
        return f"[{text}]({url})"

    def format_image(
        self,
        alt_text: str,
        url: str,
        title: Optional[str] = None
    ) -> str:
        """
        Format an image reference.

        Args:
            alt_text: Alternative text
            url: Image URL
            title: Optional title

        Returns:
            Formatted image reference
        """
        if title:
            return f"![{alt_text}]({url} \"{title}\")"
        else:
            return f"![{alt_text}]({url})"

    # ==================== Output Formatting ====================

    def create_stream_output(
        self,
        text: str,
        stream_name: str = "stdout"
    ) -> Dict[str, Any]:
        """
        Create a stream output (stdout/stderr).

        Args:
            text: Output text
            stream_name: Stream name (stdout or stderr)

        Returns:
            Stream output dictionary
        """
        return {
            "output_type": "stream",
            "name": stream_name,
            "text": text.split('\n') if '\n' in text else [text]
        }

    def create_display_data_output(
        self,
        data: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a display_data output.

        Args:
            data: Display data (MIME type -> data)
            metadata: Output metadata

        Returns:
            Display data output dictionary
        """
        return {
            "output_type": "display_data",
            "data": data,
            "metadata": metadata or {}
        }

    def create_execute_result_output(
        self,
        data: Dict[str, Any],
        execution_count: int,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create an execute_result output.

        Args:
            data: Result data (MIME type -> data)
            execution_count: Execution count
            metadata: Output metadata

        Returns:
            Execute result output dictionary
        """
        return {
            "output_type": "execute_result",
            "data": data,
            "metadata": metadata or {},
            "execution_count": execution_count
        }

    def create_error_output(
        self,
        ename: str,
        evalue: str,
        traceback: List[str]
    ) -> Dict[str, Any]:
        """
        Create an error output.

        Args:
            ename: Error name
            evalue: Error value
            traceback: Traceback lines

        Returns:
            Error output dictionary
        """
        return {
            "output_type": "error",
            "ename": ename,
            "evalue": evalue,
            "traceback": traceback
        }

    # ==================== Cell Metadata Management ====================

    def add_metadata(
        self,
        cell: Dict[str, Any],
        key: str,
        value: Any
    ) -> Dict[str, Any]:
        """
        Add metadata to a cell.

        Args:
            cell: Cell dictionary
            key: Metadata key
            value: Metadata value

        Returns:
            Updated cell
        """
        if "metadata" not in cell:
            cell["metadata"] = {}
        cell["metadata"][key] = value
        return cell

    def add_tags(
        self,
        cell: Dict[str, Any],
        tags: List[str]
    ) -> Dict[str, Any]:
        """
        Add tags to a cell.

        Args:
            cell: Cell dictionary
            tags: List of tags

        Returns:
            Updated cell
        """
        if "metadata" not in cell:
            cell["metadata"] = {}
        if "tags" not in cell["metadata"]:
            cell["metadata"]["tags"] = []
        cell["metadata"]["tags"].extend(tags)
        return cell

    def collapse_input(self, cell: Dict[str, Any]) -> Dict[str, Any]:
        """Mark cell input as collapsed."""
        return self.add_metadata(cell, "jupyter", {"source_hidden": True})

    def collapse_output(self, cell: Dict[str, Any]) -> Dict[str, Any]:
        """Mark cell output as collapsed."""
        return self.add_metadata(cell, "jupyter", {"outputs_hidden": True})

    # ==================== R Markdown Style Support ====================

    def create_r_markdown_header(
        self,
        title: str,
        author: Optional[str] = None,
        date: Optional[str] = None,
        output: str = "html_document"
    ) -> str:
        """
        Create R Markdown YAML header.

        Args:
            title: Document title
            author: Author name
            date: Date (defaults to current date)
            output: Output format

        Returns:
            YAML header string
        """
        if date is None:
            date = datetime.utcnow().strftime("%Y-%m-%d")

        header = f"""---
title: "{title}"
"""
        if author:
            header += f'author: "{author}"\n'
        header += f"""date: "{date}"
output: {output}
---"""
        return header

    def create_r_code_chunk(
        self,
        code: str,
        chunk_name: Optional[str] = None,
        **options
    ) -> str:
        """
        Create R markdown code chunk.

        Args:
            code: R code
            chunk_name: Optional chunk name
            **options: Chunk options (echo, eval, warning, etc.)

        Returns:
            Formatted R code chunk
        """
        chunk_header = "```{r"

        if chunk_name:
            chunk_header += f" {chunk_name}"

        if options:
            option_str = ", ".join(f"{k}={v}" for k, v in options.items())
            chunk_header += f", {option_str}"

        chunk_header += "}"

        return f"{chunk_header}\n{code}\n```"

    # ==================== Utility Functions ====================

    def validate_integer_cell(self, cell: Dict[str, Any]) -> bool:
        """
        Validate that cell maintains integer-only operations.

        Args:
            cell: Cell dictionary

        Returns:
            True if cell is integer-safe
        """
        if cell["cell_type"] != self.CELL_TYPE_CODE:
            return True

        source = "".join(cell["source"])

        # Check for float literals
        float_pattern = r'\b\d+\.\d+\b'
        if re.search(float_pattern, source):
            return False

        # Check for float conversion functions
        float_funcs = ['float(', 'np.float', 'np.float32', 'np.float64']
        if any(func in source for func in float_funcs):
            return False

        return True

    def save_notebook(
        self,
        notebook: Dict[str, Any],
        filepath: str,
        indent: int = 1
    ) -> None:
        """
        Save notebook to file.

        Args:
            notebook: Notebook dictionary
            filepath: Output file path
            indent: JSON indentation
        """
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(notebook, f, indent=indent, ensure_ascii=False)

    def load_notebook(self, filepath: str) -> Dict[str, Any]:
        """
        Load notebook from file.

        Args:
            filepath: Notebook file path

        Returns:
            Notebook dictionary
        """
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)

    def count_cells(
        self,
        notebook: Dict[str, Any],
        cell_type: Optional[str] = None
    ) -> int:
        """
        Count cells in notebook.

        Args:
            notebook: Notebook dictionary
            cell_type: Optional cell type filter

        Returns:
            Cell count
        """
        cells = notebook.get("cells", [])
        if cell_type:
            return sum(1 for cell in cells if cell["cell_type"] == cell_type)
        return len(cells)

    def extract_code(self, notebook: Dict[str, Any]) -> str:
        """
        Extract all code from notebook.

        Args:
            notebook: Notebook dictionary

        Returns:
            Concatenated code
        """
        code_cells = [
            cell for cell in notebook.get("cells", [])
            if cell["cell_type"] == self.CELL_TYPE_CODE
        ]

        code_parts = []
        for cell in code_cells:
            code_parts.append("".join(cell["source"]))

        return "\n\n".join(code_parts)

    def get_cell_stats(self, notebook: Dict[str, Any]) -> Dict[str, int]:
        """
        Get notebook statistics.

        Args:
            notebook: Notebook dictionary

        Returns:
            Statistics dictionary
        """
        cells = notebook.get("cells", [])

        return {
            "total_cells": len(cells),
            "code_cells": sum(1 for c in cells if c["cell_type"] == self.CELL_TYPE_CODE),
            "markdown_cells": sum(1 for c in cells if c["cell_type"] == self.CELL_TYPE_MARKDOWN),
            "raw_cells": sum(1 for c in cells if c["cell_type"] == self.CELL_TYPE_RAW),
            "executed_cells": sum(
                1 for c in cells
                if c["cell_type"] == self.CELL_TYPE_CODE and c.get("execution_count")
            )
        }


# ==================== Convenience Functions ====================

def quick_notebook(
    cells: List[Tuple[str, str]],
    title: Optional[str] = None,
    kernel: str = "python3"
) -> Dict[str, Any]:
    """
    Quickly create a notebook from (type, content) tuples.

    Args:
        cells: List of (cell_type, content) tuples
        title: Optional notebook title
        kernel: Kernel name

    Returns:
        Complete notebook
    """
    utils = NotebookUtilities(kernel_name=kernel)
    nb_cells = []

    if title:
        title_cell = utils.create_markdown_cell(utils.format_heading(title, 1))
        nb_cells.append(title_cell)

    for cell_type, content in cells:
        if cell_type == "code":
            nb_cells.append(utils.create_code_cell(content))
        elif cell_type == "markdown":
            nb_cells.append(utils.create_markdown_cell(content))
        elif cell_type == "raw":
            nb_cells.append(utils.create_raw_cell(content))

    return utils.create_notebook(cells=nb_cells)


def create_analysis_notebook(
    title: str,
    description: str,
    setup_code: str,
    analysis_sections: List[Tuple[str, str]]
) -> Dict[str, Any]:
    """
    Create a structured analysis notebook.

    Args:
        title: Notebook title
        description: Analysis description
        setup_code: Setup/import code
        analysis_sections: List of (section_name, code) tuples

    Returns:
        Complete analysis notebook
    """
    utils = NotebookUtilities()
    cells = []

    # Title
    cells.append(utils.create_markdown_cell(utils.format_heading(title, 1)))

    # Description
    cells.append(utils.create_markdown_cell(description))

    # Setup section
    cells.append(utils.create_markdown_cell(utils.format_heading("Setup", 2)))
    cells.append(utils.create_code_cell(setup_code))

    # Analysis sections
    for section_name, code in analysis_sections:
        cells.append(utils.create_markdown_cell(utils.format_heading(section_name, 2)))
        cells.append(utils.create_code_cell(code))

    return utils.create_notebook(cells=cells)

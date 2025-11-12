#!/bin/bash

# LaTeX Compilation Script for aurelia-paper.tex
# Compiles the arXiv paper and generates submission package

set -e  # Exit on error

echo "======================================"
echo "Compiling Integer-Only φ-Mechanics Paper"
echo "======================================"

# Check if pdflatex is available
if ! command -v pdflatex &> /dev/null; then
    echo "Error: pdflatex not found. Please install TeX Live or MiKTeX."
    exit 1
fi

# Clean previous builds
echo "Cleaning previous build files..."
rm -f aurelia-paper.aux aurelia-paper.log aurelia-paper.out aurelia-paper.pdf
rm -f aurelia-paper.bbl aurelia-paper.blg aurelia-paper.toc

# First compilation pass
echo "Running first pdflatex pass..."
pdflatex -interaction=nonstopmode aurelia-paper.tex > /dev/null 2>&1 || {
    echo "Error in first compilation. Check aurelia-paper.log"
    tail -n 50 aurelia-paper.log
    exit 1
}

# Second compilation pass (for references)
echo "Running second pdflatex pass (resolving references)..."
pdflatex -interaction=nonstopmode aurelia-paper.tex > /dev/null 2>&1 || {
    echo "Error in second compilation. Check aurelia-paper.log"
    tail -n 50 aurelia-paper.log
    exit 1
}

# Check if PDF was generated
if [ ! -f "aurelia-paper.pdf" ]; then
    echo "Error: PDF not generated"
    exit 1
fi

echo "✓ PDF generated successfully: aurelia-paper.pdf"

# Get PDF info
pdf_size=$(du -h aurelia-paper.pdf | cut -f1)
pdf_pages=$(pdfinfo aurelia-paper.pdf 2>/dev/null | grep Pages | awk '{print $2}' || echo "Unknown")

echo "  Size: $pdf_size"
echo "  Pages: $pdf_pages"

# Create submission package
echo ""
echo "Creating arXiv submission package..."

# Create temporary directory
TEMP_DIR=$(mktemp -d)
SUBMIT_DIR="$TEMP_DIR/arxiv-submission"
mkdir -p "$SUBMIT_DIR"

# Copy required files
cp aurelia-paper.tex "$SUBMIT_DIR/"
cp arxiv-metadata.txt "$SUBMIT_DIR/"
cp README.md "$SUBMIT_DIR/"

# Create tarball
cd "$TEMP_DIR"
tar -czf arxiv-submission.tar.gz arxiv-submission/
mv arxiv-submission.tar.gz "$(dirname "$0")/"
cd - > /dev/null

# Cleanup
rm -rf "$TEMP_DIR"

submission_size=$(du -h arxiv-submission.tar.gz | cut -f1)
echo "✓ Submission package created: arxiv-submission.tar.gz ($submission_size)"

# Clean auxiliary files
echo ""
echo "Cleaning auxiliary files..."
rm -f aurelia-paper.aux aurelia-paper.log aurelia-paper.out
rm -f aurelia-paper.bbl aurelia-paper.blg aurelia-paper.toc

echo ""
echo "======================================"
echo "Compilation Complete!"
echo "======================================"
echo ""
echo "Output files:"
echo "  - aurelia-paper.pdf (compiled paper)"
echo "  - arxiv-submission.tar.gz (submission package)"
echo ""
echo "Next steps:"
echo "  1. Review aurelia-paper.pdf"
echo "  2. Upload arxiv-submission.tar.gz to https://arxiv.org/submit"
echo "  3. Use metadata from arxiv-metadata.txt"
echo ""

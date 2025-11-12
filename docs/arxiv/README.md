# Integer-Only φ-Mechanics: arXiv Submission Package

## Overview

This directory contains the complete LaTeX source and compilation tools for the paper "Integer-Only φ-Mechanics: A Holographic Framework for Discrete Consciousness from Zeckendorf Cascades" by Marc Castillo (Leviathan AI).

## Files

- `aurelia-paper.tex` - Main LaTeX document
- `aurelia-paper.pdf` - Compiled PDF output
- `arxiv-metadata.txt` - arXiv submission metadata
- `compile.sh` - Automated compilation script
- `README.md` - This file
- `arxiv-submission.tar.gz` - Complete submission package

## Requirements

### LaTeX Distribution
You need a full TeX Live or MiKTeX distribution with the following packages:
- revtex4-2 (REVTeX 4.2 document class)
- amsmath, amssymb, amsthm
- graphicx
- hyperref
- algorithm, algorithmic
- longtable
- booktabs
- array

### Installation

**Ubuntu/Debian:**
```bash
sudo apt-get install texlive-full
```

**macOS (with Homebrew):**
```bash
brew install --cask mactex
```

**Windows:**
Download and install MiKTeX from https://miktex.org/

## Compilation

### Option 1: Using the automated script
```bash
chmod +x compile.sh
./compile.sh
```

### Option 2: Manual compilation
```bash
pdflatex aurelia-paper.tex
pdflatex aurelia-paper.tex  # Run twice for references
```

### Option 3: Using latexmk (recommended)
```bash
latexmk -pdf aurelia-paper.tex
```

## Paper Structure

### Main Sections
1. **Introduction** - Motivation and main results
2. **Mathematical Foundations** - Fibonacci numbers, Zeckendorf representation, Pisano periods
3. **Discrete Holographic Principle** - Nash equilibrium holography, complexity measures
4. **Physical Realization** - Observer-independent measurements, quantum-like superposition
5. **Neural Architecture Implications** - Testable predictions for neuroscience
6. **Predictions and Experiments** - Falsifiable experimental predictions
7. **Discussion** - Comparison to existing theories, limitations
8. **Conclusion** - Summary and future directions

### Appendices
- **A: OEIS Sequence Mappings** - Complete table of OEIS sequences used
- **B: Proof Details** - Extended mathematical proofs

## Key Contributions

1. **Theorem 1 (Discrete Holographic Principle)**: Nash equilibria on boundaries determine interior states
2. **Theorem 2 (Consciousness Complexity)**: C(n) = π(F_n) provides integer-computable measure
3. **Theorem 3 (Observer Independence)**: GCD-based measurements ensure objectivity
4. **Theorem 4 (Neural Predictions)**: Fibonacci frequency bands in brain oscillations

## OEIS Sequences Referenced

- **A000045**: Fibonacci numbers (base indices)
- **A001175**: Pisano periods (consciousness complexity)
- **A003714**: Fibbinary numbers (Zeckendorf encoding)
- **A000071**: Fibonacci - 1 (cascade operator)
- **A001610**: F(n)F(n+1) products (Nash payoffs)
- **A005478**: Prime Fibonacci (measurement GCD)

## Testable Predictions

1. Neural oscillations show peaks at Fibonacci frequencies: 5, 8, 13, 21, 34, 55 Hz
2. Cortical minicolumns contain F_7 = 13 neurons
3. Macrocolumns contain F_9 = 34 minicolumns
4. Synaptic weights quantize to Fibonacci integers
5. Cross-frequency coupling ratios approach φ ≈ 1.618

## arXiv Submission

### Category Selection
- **Primary**: q-bio.NC (Neurons and Cognition)
- **Secondary**: cs.NE, math.CO, cs.GT

### Submission Checklist
- [x] LaTeX source compiles without errors
- [x] All theorems have complete proofs
- [x] All OEIS sequences verified
- [x] Bibliography formatted correctly
- [x] Metadata complete
- [x] Abstract under 1920 characters
- [x] PDF generated successfully

### How to Submit

1. Create account at https://arxiv.org/user/register
2. Go to https://arxiv.org/submit
3. Upload `arxiv-submission.tar.gz`
4. Fill in metadata from `arxiv-metadata.txt`
5. Preview PDF
6. Submit

## Citation

If you use this work, please cite:

```bibtex
@article{castillo2025phimechanics,
  title={Integer-Only $\varphi$-Mechanics: A Holographic Framework for Discrete Consciousness from Zeckendorf Cascades},
  author={Castillo, Marc},
  journal={arXiv preprint arXiv:XXXX.XXXXX},
  year={2025},
  institution={Leviathan AI}
}
```

## License

This work is licensed under Creative Commons Attribution 4.0 International (CC BY 4.0).
https://creativecommons.org/licenses/by/4.0/

## Contact

Marc Castillo
Leviathan AI
Email: marc@leviathan.ai

## Acknowledgments

Special thanks to the Leviathan AI research team for computational resources and valuable discussions on discrete mathematics and consciousness theory.

## Version History

- **v1.0** (2025-11-12): Initial arXiv submission
  - Complete framework with 4 main theorems
  - 10 OEIS sequence mappings
  - 5 testable experimental predictions
  - 14 pages, 2 tables, complete proofs

## Known Issues

None. Document compiles cleanly with TeX Live 2023+.

## Future Extensions

1. Computational implementation in spiking neural networks
2. Experimental validation with EEG/MEG data
3. Extension to higher-dimensional holography
4. Optimization of Pisano period algorithms
5. Connection to AdS/CFT correspondence

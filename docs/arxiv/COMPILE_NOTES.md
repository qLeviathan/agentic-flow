# Compilation Notes

## LaTeX Not Available in Environment

The current environment does not have `pdflatex` installed. To compile the paper:

### Option 1: Local Compilation
1. Download all files from `/home/user/agentic-flow/docs/arxiv/`
2. Install TeX Live or MiKTeX on your local machine
3. Run `./compile.sh` or manually: `pdflatex aurelia-paper.tex`

### Option 2: Online LaTeX Editors
Upload `aurelia-paper.tex` to:
- **Overleaf**: https://www.overleaf.com/
- **Papeeria**: https://papeeria.com/
- **CoCalc**: https://cocalc.com/

### Option 3: Docker
```bash
docker run --rm -v $(pwd):/workspace texlive/texlive:latest \
  pdflatex -interaction=nonstopmode /workspace/aurelia-paper.tex
```

## Required LaTeX Packages

The paper requires REVTeX 4.2, which is part of full TeX distributions:
- `revtex4-2` (document class)
- `amsmath`, `amssymb`, `amsthm` (mathematics)
- `hyperref` (links and references)
- `longtable`, `booktabs`, `array` (tables)
- `algorithm`, `algorithmic` (algorithms, if needed)

## Expected Output

When successfully compiled:
- **Pages**: ~14-16 pages in two-column REVTeX format
- **File size**: ~200-300 KB
- **Sections**: 7 main sections + 2 appendices
- **Tables**: 1 long table (OEIS sequences)
- **Theorems**: 4 main theorems with proofs
- **Bibliography**: 13 references

## Verification Checklist

After compilation, verify:
- [ ] All equations numbered correctly
- [ ] All theorem references resolve
- [ ] All citations appear in bibliography
- [ ] Table spans pages correctly
- [ ] No overfull hboxes >5pt
- [ ] Hyperlinks work (if viewing PDF)

## arXiv Submission

arXiv accepts:
1. **TeX source** (.tex files) - preferred
2. **PDF** (if TeX compilation fails on arXiv)

The submission package `arxiv-submission.tar.gz` contains all necessary source files. arXiv will compile it automatically using their TeX Live installation.

## Contact

If you encounter compilation issues:
- Check `aurelia-paper.log` for detailed errors
- Ensure all packages are up to date
- Try `pdflatex` twice (for references)
- Contact: marc@leviathan.ai

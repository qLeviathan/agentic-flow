# Mathematical Framework Dependency Graph Validation Report

**Generated:** 2025-11-12T17:55:06.471Z

## Summary

- **Validation Status:** ✗ FAIL
- **Total Symbols:** 26
- **Total Edges:** 46
- **Levels:** 7
- **Root Nodes:** 5
- **Leaf Nodes:** 11
- **Longest Path:** 8
- **Average Dependencies:** 1.77
- **Cycles Detected:** 0
- **Errors:** 17
- **Warnings:** 1

## Computation Order

Symbols must be computed in this order (topological sort):

```
φ → e → π → √5 → ψ → ℕ → ℤ → ℝ → ℂ → +
· → √ → - → ^ → / → Q → Q^n → F_rec → F_matrix → L_binet
```

## Independence Claims Validation

| Symbol A | Symbol B | Claimed | Actual | Status | Reason |
|----------|----------|---------|--------|--------|--------|
| φ | ψ | Independent | Dependent | ✗ | Path exists: φ → ψ |
| F | L | Independent | Dependent | ✗ | Path exists: F → L |
| z | ℓ | Independent | Independent | ✓ | - |

## Level Consistency

**Status:** ✗ FAIL

### Level Violations

- ψ (level 0) depends on φ (level 0), but dependencies must be at lower levels
- ℤ (level 1) depends on ℕ (level 1), but dependencies must be at lower levels
- ℝ (level 1) depends on ℤ (level 1), but dependencies must be at lower levels
- ℂ (level 1) depends on ℝ (level 1), but dependencies must be at lower levels
- + (level 1) depends on ℝ (level 1), but dependencies must be at lower levels
- + (level 1) depends on ℂ (level 1), but dependencies must be at lower levels
- · (level 1) depends on ℝ (level 1), but dependencies must be at lower levels
- · (level 1) depends on ℂ (level 1), but dependencies must be at lower levels
- ^ (level 1) depends on ℝ (level 1), but dependencies must be at lower levels
- ^ (level 1) depends on · (level 1), but dependencies must be at lower levels
- √ (level 1) depends on ℝ (level 1), but dependencies must be at lower levels
- √ (level 1) depends on ℂ (level 1), but dependencies must be at lower levels
- Q^n (level 2) depends on Q (level 2), but dependencies must be at lower levels
- - (level 1) depends on + (level 1), but dependencies must be at lower levels
- / (level 1) depends on · (level 1), but dependencies must be at lower levels

## Errors

### [ERROR] level-violation

ψ (level 0) depends on φ (level 0), but dependencies must be at lower levels

**Affected symbols:** ψ, φ

### [ERROR] level-violation

ℤ (level 1) depends on ℕ (level 1), but dependencies must be at lower levels

**Affected symbols:** ℤ, ℕ

### [ERROR] level-violation

ℝ (level 1) depends on ℤ (level 1), but dependencies must be at lower levels

**Affected symbols:** ℝ, ℤ

### [ERROR] level-violation

ℂ (level 1) depends on ℝ (level 1), but dependencies must be at lower levels

**Affected symbols:** ℂ, ℝ

### [ERROR] level-violation

+ (level 1) depends on ℝ (level 1), but dependencies must be at lower levels

**Affected symbols:** +, ℝ

### [ERROR] level-violation

+ (level 1) depends on ℂ (level 1), but dependencies must be at lower levels

**Affected symbols:** +, ℂ

### [ERROR] level-violation

· (level 1) depends on ℝ (level 1), but dependencies must be at lower levels

**Affected symbols:** ·, ℝ

### [ERROR] level-violation

· (level 1) depends on ℂ (level 1), but dependencies must be at lower levels

**Affected symbols:** ·, ℂ

### [ERROR] level-violation

^ (level 1) depends on ℝ (level 1), but dependencies must be at lower levels

**Affected symbols:** ^, ℝ

### [ERROR] level-violation

^ (level 1) depends on · (level 1), but dependencies must be at lower levels

**Affected symbols:** ^, ·

### [ERROR] level-violation

√ (level 1) depends on ℝ (level 1), but dependencies must be at lower levels

**Affected symbols:** √, ℝ

### [ERROR] level-violation

√ (level 1) depends on ℂ (level 1), but dependencies must be at lower levels

**Affected symbols:** √, ℂ

### [ERROR] level-violation

Q^n (level 2) depends on Q (level 2), but dependencies must be at lower levels

**Affected symbols:** Q^n, Q

### [ERROR] level-violation

- (level 1) depends on + (level 1), but dependencies must be at lower levels

**Affected symbols:** -, +

### [ERROR] level-violation

/ (level 1) depends on · (level 1), but dependencies must be at lower levels

**Affected symbols:** /, ·

### [ERROR] invalid-independence

Independence claim φ ⊥ ψ is invalid: Path exists: φ → ψ

**Affected symbols:** φ, ψ

### [ERROR] invalid-independence

Independence claim F ⊥ L is invalid: Path exists: F → L

**Affected symbols:** F, L

## Warnings

### potential-issue

Some symbols have high dependency count (7)

**Affected symbols:** F(7)

## Visualization

See `dependency-graph.dot` for the GraphViz visualization.

To render:

```bash
dot -Tpng dependency-graph.dot -o dependency-graph.png
dot -Tsvg dependency-graph.dot -o dependency-graph.svg
```

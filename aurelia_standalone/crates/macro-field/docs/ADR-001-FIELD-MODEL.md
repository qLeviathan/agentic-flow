# Architecture Decision Record: Macroeconomic φ-Field Model

## Status
**Accepted** - 2025-11-14

## Context

AURELIA's trading system uses retrocausal GOAP with Nash equilibrium optimization for decision-making. However, it lacks integration with macroeconomic conditions, which significantly impact market behavior. Traditional approaches include:

1. **Direct Feature Engineering**: Add economic indicators as features
   - ❌ High dimensional, requires retraining
   - ❌ No natural way to weight importance
   - ❌ Doesn't integrate with φ-arithmetic

2. **Regime Detection**: Classify market regimes, switch strategies
   - ❌ Discrete states don't capture gradual transitions
   - ❌ Requires labeled training data
   - ❌ Hard thresholds are brittle

3. **Economic Models**: Use econometric models (VAR, DSGE)
   - ❌ Complex, computationally expensive
   - ❌ Many assumptions about relationships
   - ❌ Not integrated with game theory

## Decision

We treat macroeconomic data as a **φ-field** (phi-field) in the same mathematical framework as AURELIA's core:

1. **Encode indicators as Latent-N**: Each indicator → single integer → (energy, time, address)
2. **Build influence matrix**: Fibonacci-indexed relationships between indicators
3. **Calculate field state**: Magnitude, direction (CORDIC), gradient
4. **Adjust Nash equilibrium**: Modify game theory payoffs based on field strength

### Why φ-Field Model?

**Advantages:**
- ✅ **Natural Integration**: Uses existing Latent-N, CORDIC, Fibonacci infrastructure
- ✅ **Continuous Representation**: Field strength varies smoothly with economic changes
- ✅ **Physical Intuition**: Inverse-square law, superposition principle
- ✅ **Game Theory Compatible**: Directly modifies Nash equilibrium payoffs
- ✅ **Testable**: Can toggle on/off for A/B testing

**Mathematical Elegance:**
- Indicators live in same φ-space as AURELIA's internal state
- Field influence follows inverse-square law with φ-scaling
- Nash equilibrium adjustments maintain Fibonacci quantization
- CORDIC rotation provides natural field direction

## Implementation Details

### Core Algorithm

```rust
// 1. Load economic data
indicators = fetch_from_fred(["GDP", "UNRATE", "CPIAUCSL", "FEDFUNDS"])

// 2. Encode as Latent-N
for indicator in indicators:
    n = fibonacci_level(indicator) + volatility(indicator.history)
    indicator.latent = LatentN::new(n)

// 3. Build influence matrix
for i, j in all_pairs(indicators):
    influence[i][j] = (F[i] / F[j]) / φ

// 4. Calculate field at decision point (0, 0)
field_magnitude = Σ (E[i] × φ / distance²) × influence_weight[i]
field_direction = CORDIC.rotate(weighted_sum)

// 5. Classify phase
phase = match field_magnitude:
    > 100  → StrongBullish
    > 50   → Bullish
    < -50  → Bearish
    < -100 → StrongBearish
    else   → Neutral

// 6. Adjust Nash equilibrium payoff
adjusted = base_payoff
    × phase.multiplier()
    × strength_factor
    × momentum_factor
    × confidence

return quantize_fibonacci(adjusted)
```

### Integration Points

**With retrocausal GOAP:**
```rust
// In GOAPAction evaluation
let base_payoff = action.calculate_payoff();
let adjusted_payoff = if macro_field.enabled {
    macro_field.game_theory_adjust(base_payoff)
} else {
    base_payoff
};
```

**With Latent-N state:**
```rust
// Indicators use same encoding as trading state
pub struct Indicator {
    pub latent_encoding: LatentN,  // Unified state representation
}
```

**With CORDIC rotation:**
```rust
// Field direction calculated via φ-CORDIC
let angle = indicator.latent_encoding.decode().angle;
let (dx, dy) = cordic.rotate(value, 0, angle);
```

## Consequences

### Positive

1. **Unified Framework**: All of AURELIA operates in φ-space
2. **Mathematical Consistency**: Latent-N → Field → Nash equilibrium all φ-based
3. **Interpretability**: Field strength/direction has physical meaning
4. **Modularity**: Can disable field, add/remove indicators independently
5. **Performance**: O(n) influence calculation, O(1) payoff adjustment

### Negative

1. **External Dependency**: Requires FRED API access and key
2. **Data Latency**: Economic indicators updated monthly/quarterly
3. **Stale Data**: Field confidence degrades over time
4. **Calibration**: Thresholds (strong/weak field) need tuning

### Risks

1. **Overfitting**: Field might explain past but not predict future
   - **Mitigation**: A/B testing with field on/off

2. **Latency**: Monthly GDP doesn't capture intra-day moves
   - **Mitigation**: Confidence decay based on data age

3. **Correlation vs Causation**: Macro data correlated but may not cause price moves
   - **Mitigation**: Use as modifier, not sole decision factor

4. **API Rate Limits**: FRED limits requests
   - **Mitigation**: Cache data, update periodically not per-trade

## Alternatives Considered

### 1. Separate ML Model
Train a model to predict market regime from economic data, use regime to select strategy.

**Rejected because:**
- Requires labeled training data
- Separate from φ-arithmetic framework
- Binary regime classification too rigid

### 2. Direct Feature Addition
Add indicators as features to existing decision model.

**Rejected because:**
- Increases dimensionality
- No natural weighting mechanism
- Doesn't leverage φ-harmonic structure

### 3. Bayesian Prior
Use economic data as prior for Bayesian inference on strategy selection.

**Rejected because:**
- Computationally expensive
- Hard to integrate with retrocausal GOAP
- Requires probability distributions

## Validation Plan

### Phase 1: Correctness (Week 1)
- [ ] Unit tests for all modules
- [ ] Integration test with mock FRED API
- [ ] Verify Fibonacci quantization
- [ ] Check influence matrix symmetry

### Phase 2: Calibration (Weeks 2-3)
- [ ] Backtest with field disabled (baseline)
- [ ] Backtest with field enabled
- [ ] Compare Sharpe ratio, max drawdown
- [ ] Tune strength thresholds

### Phase 3: Production (Week 4+)
- [ ] Deploy with 10% allocation
- [ ] Monitor field health metrics
- [ ] A/B test against baseline
- [ ] Scale if metrics improve

## Success Metrics

**Primary:**
- Improved Sharpe ratio vs baseline (target: +10%)
- Reduced maximum drawdown (target: -20%)

**Secondary:**
- Win rate improvement
- Lower volatility in returns
- Fewer false signals

**Health:**
- Field confidence > 0.7
- API uptime > 99%
- Data freshness < 48 hours

## Related Decisions

- **ADR-000**: φ-arithmetic core architecture
- **ADR-XXX**: Retrocausal GOAP planning (to be documented)
- **ADR-XXX**: Latent-N encoding theorem (to be documented)

## References

1. Federal Reserve Economic Data API: https://fred.stlouisfed.org
2. Nash Equilibrium in Game Theory (Nash, 1950)
3. CORDIC Algorithm (Volder, 1959)
4. Fibonacci Trading (Pesavento, 1997)

## Reviewers

- [@qLeviathan](https://github.com/qLeviathan) - AURELIA architect
- TBD - Economics domain expert
- TBD - Quantitative trading expert

## Change Log

- 2025-11-14: Initial draft
- 2025-11-14: Accepted for implementation

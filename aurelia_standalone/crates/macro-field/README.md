# Macro-Field 🌐📊

> Macroeconomic φ-field model with game theory decision integration for AURELIA

[![Crates.io](https://img.shields.io/crates/v/macro-field.svg)](https://crates.io/crates/macro-field)
[![Documentation](https://docs.rs/macro-field/badge.svg)](https://docs.rs/macro-field)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](../../../LICENSE)

## Overview

The **macro-field** crate treats macroeconomic data (GDP, unemployment, inflation, interest rates) as a φ-field that influences trading decisions through game theory optimization. Economic indicators are encoded as field vectors in φ-space, creating a field with:

- **Strength**: Magnitude of economic influence (Fibonacci-scaled)
- **Direction**: Field angle calculated via CORDIC rotation
- **Gradient**: Rate of change across indicators

This field modifies Nash equilibrium payoffs in AURELIA's retrocausal GOAP planner, allowing strategies to dynamically adapt to macroeconomic conditions.

## Features

- 🌍 **FRED API Integration**: Automatic fetching of economic data
- 🔢 **Latent-N Encoding**: Unified state representation with AURELIA core
- 🌀 **CORDIC Field Rotation**: φ-based geometric calculations
- 🎮 **Game Theory Adjustment**: Nash equilibrium modification
- 📈 **Field Phase Detection**: Bullish/Bearish/Neutral classification
- ⚡ **Toggle Capability**: Enable/disable for A/B testing
- 🔄 **Real-time Updates**: Async indicator loading
- 📊 **Health Monitoring**: Confidence and freshness metrics

## Quick Start

```rust
use macro_field::{MacroField, IndicatorType};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize field
    let mut field = MacroField::new();

    // Load economic indicators
    let api_key = std::env::var("FRED_API_KEY")?;
    field.load_indicators(
        &api_key,
        vec![
            IndicatorType::GDP,
            IndicatorType::Unemployment,
            IndicatorType::Inflation,
            IndicatorType::InterestRate,
        ]
    ).await?;

    // Calculate field influence
    let influence = field.calculate_influence((0.0, 0.0));
    println!("Field strength: {}", influence.magnitude);

    // Adjust game theory payoff
    let base_payoff = 21; // F[8] from retrocausal GOAP
    let adjusted = field.game_theory_adjust(base_payoff);
    println!("Payoff: {} → {}", base_payoff, adjusted);

    Ok(())
}
```

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
macro-field = { path = "crates/macro-field" }
phi-core = { path = "crates/phi-core" }
tokio = { version = "1.35", features = ["full"] }
```

## Architecture

```
FRED API → Indicators → Latent-N Encoding → Field State
                              ↓
                        CORDIC Rotation
                              ↓
                      Influence Matrix
                              ↓
                    Game Theory Adjuster
                              ↓
                    Trading Decision (GOAP)
```

### Core Components

1. **MacroField**: Main coordinator managing indicators and field state
2. **Indicator**: Individual economic data point with Latent-N encoding
3. **FieldState**: Current field configuration (strength, direction, gradient)
4. **FREDClient**: API client for Federal Reserve Economic Data
5. **GameTheoryAdjuster**: Nash equilibrium modifier
6. **FieldInfluence**: Influence calculation at specific points

## Mathematical Foundation

### Latent-N Encoding
Each indicator is encoded as a single integer `n`:
```
n = fibonacci_level + volatility_factor
```

From `n`, we decode:
- **Energy**: F[n] (Fibonacci)
- **Time**: L[n] (Lucas)
- **Direction**: (-1)^n
- **Angle**: n × (2π / φ)

### Influence Matrix
Cross-indicator relationships:
```
Matrix[i][j] = (F[i] / F[j]) / φ
```

### Field Calculation
At point (x, y):
```
influence = Σ (E[i] × φ / distance²) × weight[i]
```

### Nash Adjustment
```
adjusted = quantize_fibonacci(
    base_payoff
    × phase.multiplier()
    × strength_factor
    × momentum_factor
    × confidence
)
```

## Usage Examples

### Basic Field Monitoring

```rust
let health = field.health_metrics();
println!("Indicators: {}", health.indicator_count);
println!("Confidence: {:.1}%", health.confidence * 100.0);
println!("Strength: {:.2}", health.field_strength);
```

### Trading Recommendations

```rust
use macro_field::GameTheoryAdjuster;

let adjuster = GameTheoryAdjuster::new(&field.field_state);
let action = adjuster.recommended_action();
let size = adjuster.position_size(1000.0);
let risk = adjuster.risk_factor();

println!("Action: {:?}", action);
println!("Size: ${:.2}", size);
println!("Risk: {:.2}x", risk);
```

### A/B Testing

```rust
// Test without macro field
field.toggle(); // Disable
let baseline = run_strategy(&field).await?;

// Test with macro field
field.toggle(); // Enable
let enhanced = run_strategy(&field).await?;

println!("Improvement: {:.1}%",
    (enhanced.sharpe / baseline.sharpe - 1.0) * 100.0
);
```

## Integration with AURELIA

### With Retrocausal GOAP

```rust
use phi_core::retrocausal_goap::{RetrocausalGOAP, GOAPAction};

// Adjust action payoffs based on macro field
for action in planner.actions.iter_mut() {
    action.payoff = field.game_theory_adjust(action.payoff);
}
```

### With Trading Strategy

```rust
fn should_enter_trade(&self, signal: &Signal) -> bool {
    let phase = self.macro_field.field_state.phase();

    match (signal.direction, phase) {
        (Long, Bullish | StrongBullish) => true,
        (Short, Bearish | StrongBearish) => true,
        _ => false,
    }
}
```

## Configuration

### Supported Indicators

- **GDP**: Gross Domestic Product (`GDP`)
- **Unemployment**: Unemployment Rate (`UNRATE`)
- **Inflation**: Consumer Price Index (`CPIAUCSL`)
- **Interest Rate**: Federal Funds Rate (`FEDFUNDS`)
- **Custom**: Any FRED series ID

### Field Phases

| Phase | Strength | Gradient | Multiplier |
|-------|----------|----------|------------|
| StrongBullish | > 100 | Positive | 1.5× |
| Bullish | > 50 | Positive | 1.2× |
| Neutral | -50 to 50 | Any | 1.0× |
| Bearish | < -50 | Negative | 0.8× |
| StrongBearish | < -100 | Negative | 0.5× |

## API Key Setup

Get a free API key from [FRED](https://fred.stlouisfed.org/docs/api/api_key.html):

```bash
export FRED_API_KEY="your_key_here"
```

Or in code:
```rust
let api_key = "your_key_here";
field.load_indicators(&api_key, indicators).await?;
```

## Performance

- **Time Complexity**: O(n) influence calculation, O(1) payoff adjustment
- **Space Complexity**: O(n² + nm) for matrix and history
- **Update Frequency**: Recommended hourly (economic data changes slowly)
- **Cache Strategy**: Field state cached, recalculated on indicator updates

## Testing

```bash
# Run all tests
cargo test -p macro-field

# Run with FRED API integration (requires API key)
FRED_API_KEY=your_key cargo test -p macro-field -- --ignored

# Run specific test
cargo test -p macro-field test_field_influence_calculation
```

## Documentation

- [Architecture](./docs/ARCHITECTURE.md) - System design and components
- [ADR-001](./docs/ADR-001-FIELD-MODEL.md) - Architecture decision record
- [Usage Guide](./docs/USAGE.md) - Detailed usage examples

## Roadmap

### Phase 2
- [ ] Real-time WebSocket updates from FRED
- [ ] Machine learning on field → outcome correlations
- [ ] Multi-timeframe field analysis
- [ ] Regional/market-specific fields

### Phase 3
- [ ] Adaptive influence matrix learning
- [ ] Field state prediction/forecasting
- [ ] Anomaly detection in field patterns
- [ ] Cross-asset field correlations

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## License

MIT License - see [LICENSE](../../../LICENSE) for details.

## References

1. [FRED API Documentation](https://fred.stlouisfed.org/docs/api/)
2. Nash, J. (1950). "Equilibrium Points in N-Person Games"
3. Volder, J. (1959). "The CORDIC Trigonometric Computing Technique"
4. [phi-core Documentation](../phi-core/README.md)

## Authors

- [@qLeviathan](https://github.com/qLeviathan) - AURELIA architect

---

**Part of the AURELIA Autonomous Trading System**

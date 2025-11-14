# Macro-Field Usage Guide

## Quick Start

### 1. Initialize the Field

```rust
use macro_field::{MacroField, IndicatorType};

let mut field = MacroField::new();
```

### 2. Load Economic Indicators

```rust
// Get FRED API key from environment or config
let api_key = std::env::var("FRED_API_KEY")
    .expect("FRED_API_KEY not set");

// Load key indicators
field.load_indicators(
    &api_key,
    vec![
        IndicatorType::GDP,
        IndicatorType::Unemployment,
        IndicatorType::Inflation,
        IndicatorType::InterestRate,
    ]
).await?;
```

### 3. Calculate Field Influence

```rust
// Calculate field at current trading position (0, 0)
let influence = field.calculate_influence((0.0, 0.0));

println!("Field strength: {}", influence.magnitude);
println!("Field direction: {:.2}°", influence.angle().to_degrees());
println!("Confidence: {:.1}%", influence.confidence * 100.0);
```

### 4. Adjust Game Theory Payoffs

```rust
use phi_core::retrocausal_goap::GOAPAction;

// Get action from retrocausal planner
let mut action = planner.find_optimal_action();

// Adjust payoff based on macroeconomic field
let original_payoff = action.payoff;
action.payoff = field.game_theory_adjust(original_payoff);

println!("Payoff adjusted: {} → {}", original_payoff, action.payoff);
```

### 5. Get Trading Recommendations

```rust
use macro_field::GameTheoryAdjuster;

let adjuster = GameTheoryAdjuster::new(&field.field_state);

// Get recommended action
let action = adjuster.recommended_action();
println!("Recommendation: {:?}", action);
println!("{}", action.description());

// Calculate position size
let base_size = 1000.0; // $1000
let adjusted_size = adjuster.position_size(base_size);
println!("Position size: ${:.2}", adjusted_size);

// Get risk factor
let risk = adjuster.risk_factor();
println!("Risk factor: {:.2}x", risk);
```

## Advanced Usage

### Custom Indicators

```rust
// Add custom economic series
field.load_indicators(
    &api_key,
    vec![
        IndicatorType::Custom("M2SL".to_string()),  // Money supply
        IndicatorType::Custom("DGS10".to_string()), // 10-year Treasury
        IndicatorType::Custom("VIXCLS".to_string()), // VIX volatility
    ]
).await?;
```

### Field Health Monitoring

```rust
// Check field health
let health = field.health_metrics();

if health.confidence < 0.5 {
    eprintln!("Warning: Low field confidence ({})", health.confidence);
}

if (Utc::now() - health.last_update).num_hours() > 168 {
    eprintln!("Warning: Stale field data ({})", health.last_update);
}

println!("Field health:");
println!("  Indicators: {}", health.indicator_count);
println!("  Confidence: {:.1}%", health.confidence * 100.0);
println!("  Strength: {:.2}", health.field_strength);
println!("  Status: {}", if health.enabled { "ENABLED" } else { "DISABLED" });
```

### A/B Testing

```rust
// Backtest without macro field
field.toggle(); // Disable
let baseline_results = run_backtest(&field).await?;

// Backtest with macro field
field.toggle(); // Enable
let enhanced_results = run_backtest(&field).await?;

// Compare results
println!("Baseline Sharpe: {:.2}", baseline_results.sharpe_ratio);
println!("Enhanced Sharpe: {:.2}", enhanced_results.sharpe_ratio);
println!("Improvement: {:.1}%",
    (enhanced_results.sharpe_ratio / baseline_results.sharpe_ratio - 1.0) * 100.0
);
```

### Field Visualization

```rust
// Encode indicators to field vectors
let vectors = field.encode_to_field()?;

for (i, vector) in vectors.iter().enumerate() {
    let indicator = &field.indicators[i];
    println!("Indicator: {}", indicator.name);
    println!("  Position: ({:.2}, {:.2})", vector.position.0, vector.position.1);
    println!("  Magnitude: {:.2}", vector.magnitude);
    println!("  Direction: ({:.2}, {:.2})", vector.direction.0, vector.direction.1);
    println!("  Latent-N: {}", vector.latent_n.n);
}
```

### Real-time Updates

```rust
use tokio::time::{interval, Duration};

// Update field every hour
let mut update_interval = interval(Duration::from_secs(3600));

loop {
    tokio::select! {
        _ = update_interval.tick() => {
            // Reload indicators
            match field.load_indicators(&api_key, indicator_types.clone()).await {
                Ok(_) => {
                    let health = field.health_metrics();
                    println!("Field updated: confidence={:.1}%",
                        health.confidence * 100.0);
                },
                Err(e) => {
                    eprintln!("Failed to update field: {}", e);
                }
            }
        }
        // ... other async work
    }
}
```

## Integration Patterns

### With Retrocausal GOAP

```rust
use phi_core::retrocausal_goap::{RetrocausalGOAP, create_trading_actions};
use phi_core::LatentN;

// Initialize GOAP planner
let current = LatentN::new(0);
let goal = LatentN::new(20);
let actions = create_trading_actions();

let mut planner = RetrocausalGOAP::new(current, goal, actions);

// Plan without macro field (baseline)
let baseline_plan = planner.plan()?;
let baseline_payoff = planner.total_payoff();

// Adjust actions with macro field
for action in planner.actions.iter_mut() {
    action.payoff = field.game_theory_adjust(action.payoff);
}

// Replan with adjusted payoffs
planner.plan()?;
let enhanced_payoff = planner.total_payoff();

println!("Payoff improvement: {} → {}", baseline_payoff, enhanced_payoff);
```

### With Trading Strategy

```rust
struct TradingStrategy {
    macro_field: MacroField,
    // ... other components
}

impl TradingStrategy {
    async fn should_enter_trade(&self, signal: &TradeSignal) -> bool {
        // Get field phase
        let phase = self.macro_field.field_state.phase();

        match (signal.direction, phase) {
            // Long signal in bullish field → strong confirmation
            (Direction::Long, FieldPhase::Bullish | FieldPhase::StrongBullish) => true,

            // Short signal in bearish field → strong confirmation
            (Direction::Short, FieldPhase::Bearish | FieldPhase::StrongBearish) => true,

            // Opposing signals → wait for clarity
            (Direction::Long, FieldPhase::Bearish | FieldPhase::StrongBearish) => false,
            (Direction::Short, FieldPhase::Bullish | FieldPhase::StrongBullish) => false,

            // Neutral field → use other factors
            _ => self.check_other_conditions(signal)
        }
    }

    fn calculate_position_size(&self, base_size: f64) -> f64 {
        let adjuster = GameTheoryAdjuster::new(&self.macro_field.field_state);
        adjuster.position_size(base_size)
    }
}
```

### With Risk Management

```rust
struct RiskManager {
    macro_field: MacroField,
    max_position: f64,
}

impl RiskManager {
    fn calculate_stop_loss(&self, entry_price: f64) -> f64 {
        let adjuster = GameTheoryAdjuster::new(&self.macro_field.field_state);
        let risk_factor = adjuster.risk_factor();

        // Wider stops in uncertain conditions
        let stop_distance = entry_price * 0.02 * risk_factor; // 2% base

        entry_price - stop_distance
    }

    fn max_portfolio_risk(&self) -> f64 {
        let phase = self.macro_field.field_state.phase();

        match phase {
            FieldPhase::StrongBullish => 0.10, // 10% max risk
            FieldPhase::Bullish => 0.08,
            FieldPhase::Neutral => 0.05,
            FieldPhase::Bearish => 0.03,
            FieldPhase::StrongBearish => 0.02, // 2% max risk
        }
    }
}
```

## Error Handling

### Graceful Degradation

```rust
// Always have a fallback if field fails
let adjusted_payoff = match field.game_theory_adjust(base_payoff) {
    payoff if field.is_enabled() && field.health_metrics().confidence > 0.5 => {
        // Use field adjustment
        payoff
    },
    _ => {
        // Fallback to base payoff
        eprintln!("Field unavailable, using base payoff");
        base_payoff
    }
};
```

### Retry Logic

```rust
use tokio::time::{sleep, Duration};

async fn load_with_retry(
    field: &mut MacroField,
    api_key: &str,
    indicators: Vec<IndicatorType>,
    max_retries: u32,
) -> anyhow::Result<()> {
    let mut retries = 0;

    loop {
        match field.load_indicators(api_key, indicators.clone()).await {
            Ok(_) => return Ok(()),
            Err(e) if retries < max_retries => {
                retries += 1;
                let wait = Duration::from_secs(2u64.pow(retries)); // Exponential backoff
                eprintln!("Failed to load indicators (attempt {}): {}", retries, e);
                eprintln!("Retrying in {:?}...", wait);
                sleep(wait).await;
            },
            Err(e) => return Err(e),
        }
    }
}
```

## Best Practices

### 1. Cache Field State

```rust
// Don't recalculate field for every decision
struct FieldCache {
    field: MacroField,
    cached_influence: HashMap<(i32, i32), FieldInfluence>,
    cache_time: DateTime<Utc>,
}

impl FieldCache {
    fn get_influence(&mut self, pos: (f64, f64)) -> FieldInfluence {
        let key = ((pos.0 * 100.0) as i32, (pos.1 * 100.0) as i32);

        // Invalidate cache after 1 hour
        if (Utc::now() - self.cache_time).num_hours() > 1 {
            self.cached_influence.clear();
            self.cache_time = Utc::now();
        }

        self.cached_influence.entry(key)
            .or_insert_with(|| self.field.calculate_influence(pos))
            .clone()
    }
}
```

### 2. Monitor Data Freshness

```rust
fn check_data_freshness(field: &MacroField) -> bool {
    let max_age_hours = 168; // 1 week
    let now = Utc::now();

    for indicator in &field.indicators {
        let age = (now - indicator.timestamp).num_hours();
        if age > max_age_hours {
            eprintln!("Warning: Stale indicator {} (age: {} hours)",
                indicator.name, age);
            return false;
        }
    }

    true
}
```

### 3. Validate Field State

```rust
fn validate_field(field: &MacroField) -> Result<(), String> {
    if field.indicators.is_empty() {
        return Err("No indicators loaded".to_string());
    }

    if field.field_state.strength.is_nan() || field.field_state.strength.is_infinite() {
        return Err("Invalid field strength".to_string());
    }

    let health = field.health_metrics();
    if health.confidence < 0.3 {
        return Err(format!("Low confidence: {:.1}%", health.confidence * 100.0));
    }

    Ok(())
}
```

### 4. Log Field Decisions

```rust
use tracing::{info, warn};

fn apply_field_adjustment(
    field: &MacroField,
    base_payoff: i64,
) -> i64 {
    let adjusted = field.game_theory_adjust(base_payoff);
    let change_pct = ((adjusted as f64 / base_payoff as f64) - 1.0) * 100.0;

    info!(
        base = base_payoff,
        adjusted = adjusted,
        change_pct = format!("{:+.1}%", change_pct),
        phase = format!("{:?}", field.field_state.phase()),
        confidence = format!("{:.1}%", field.health_metrics().confidence * 100.0),
        "Applied macro field adjustment"
    );

    if change_pct.abs() > 30.0 {
        warn!(
            "Large field adjustment: {:+.1}%",
            change_pct
        );
    }

    adjusted
}
```

## Troubleshooting

### Issue: Low Confidence

**Symptoms:** `health.confidence < 0.5`

**Causes:**
- Stale data (indicators not updated recently)
- Missing historical data
- Few indicators loaded

**Solutions:**
```rust
// Reload indicators
field.load_indicators(&api_key, indicator_types).await?;

// Add more indicators
field.load_indicators(&api_key, vec![
    IndicatorType::GDP,
    IndicatorType::Unemployment,
    IndicatorType::Inflation,
    IndicatorType::InterestRate,
    IndicatorType::Custom("M2SL"), // Add money supply
]).await?;
```

### Issue: Field Not Updating

**Symptoms:** `last_update` timestamp is old

**Causes:**
- API rate limits
- Network issues
- Invalid API key

**Solutions:**
```rust
// Check API key
let api_key = std::env::var("FRED_API_KEY")
    .expect("FRED_API_KEY not set");

// Test API connectivity
let client = FREDClient::new(api_key.clone());
match client.fetch_latest("GDP").await {
    Ok(obs) => println!("API working: GDP = {}", obs.value),
    Err(e) => eprintln!("API error: {}", e),
}

// Implement backoff
tokio::time::sleep(Duration::from_secs(60)).await;
field.load_indicators(&api_key, indicators).await?;
```

### Issue: Extreme Payoff Adjustments

**Symptoms:** Adjusted payoff >> base payoff

**Causes:**
- Extreme field strength
- High volatility indicators
- Misconfigured thresholds

**Solutions:**
```rust
// Cap adjustments
fn capped_adjust(field: &MacroField, base: i64) -> i64 {
    let adjusted = field.game_theory_adjust(base);
    let max_change = (base as f64 * 0.5) as i64; // Max ±50%

    if (adjusted - base).abs() > max_change {
        if adjusted > base {
            base + max_change
        } else {
            base - max_change
        }
    } else {
        adjusted
    }
}
```

## Performance Tips

1. **Update Frequency**: Economic data changes slowly, update hourly not per-trade
2. **Cache Calculations**: Influence calculation is O(n), cache results
3. **Lazy Loading**: Only load indicators you actually use
4. **Async Loading**: Use `tokio::spawn` for parallel indicator fetching
5. **Prune History**: Keep only last N data points per indicator

## See Also

- [Architecture Documentation](./ARCHITECTURE.md)
- [Architecture Decision Record](./ADR-001-FIELD-MODEL.md)
- [FRED API Documentation](https://fred.stlouisfed.org/docs/api/)
- [phi-core Documentation](../phi-core/README.md)

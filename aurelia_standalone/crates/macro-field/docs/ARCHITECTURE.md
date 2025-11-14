# Macroeconomic φ-Field Architecture

## System Overview

The **macro-field** crate implements a novel approach to incorporating macroeconomic data into trading decisions by treating economic indicators as a φ-field (phi-field) that influences game theory optimization through Nash equilibrium adjustments.

## Core Concept

### φ-Field Model

Economic data is encoded as vectors in φ-space, creating a field that has:
- **Strength**: Magnitude of economic influence (Fibonacci-scaled)
- **Direction**: Field angle calculated via CORDIC rotation
- **Gradient**: Rate of change across indicators

This field modifies Nash equilibrium payoffs in AURELIA's retrocausal GOAP planner, allowing trading strategies to dynamically adapt to macroeconomic conditions.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Macroeconomic φ-Field                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────┐    ┌──────────────┐    ┌──────────────────┐
│   FRED API      │───▶│  Indicators  │───▶│  Latent-N        │
│   (Data Source) │    │  (GDP, etc.) │    │  Encoding        │
└─────────────────┘    └──────────────┘    └──────────────────┘
                              │                      │
                              ▼                      ▼
                    ┌──────────────────┐   ┌─────────────────┐
                    │ Influence Matrix │   │ CORDIC Rotation │
                    │ (Fibonacci)      │   │ (Field Angle)   │
                    └──────────────────┘   └─────────────────┘
                              │                      │
                              └──────────┬───────────┘
                                         ▼
                              ┌─────────────────────┐
                              │   Field State       │
                              │ - Strength          │
                              │ - Direction         │
                              │ - Gradient          │
                              └─────────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │ Game Theory         │
                              │ Adjuster            │
                              │ (Nash Equilibrium)  │
                              └─────────────────────┘
                                         │
                                         ▼
                              ┌─────────────────────┐
                              │ Trading Decision    │
                              │ (Retrocausal GOAP)  │
                              └─────────────────────┘
```

## Component Architecture

### 1. MacroField (Main Coordinator)

**Responsibilities:**
- Orchestrate data loading from FRED API
- Manage indicator collection
- Build and maintain influence matrix
- Calculate field state
- Provide toggle capability for A/B testing

**Key Methods:**
```rust
pub async fn load_indicators(&mut self, api_key: &str, types: Vec<IndicatorType>)
pub fn encode_to_field(&mut self) -> Result<Vec<FieldVector>>
pub fn calculate_influence(&self, position: (f64, f64)) -> FieldInfluence
pub fn game_theory_adjust(&self, base_payoff: i64) -> i64
pub fn toggle(&mut self)
```

**State:**
- `indicators: Vec<Indicator>` - Economic data points
- `field_state: FieldState` - Current field configuration
- `influence_matrix: Vec<Vec<f64>>` - Fibonacci-indexed relationships
- `enabled: bool` - Feature flag for testing
- `cordic: PhiCORDIC` - Rotation calculator

### 2. Indicator

**Responsibilities:**
- Store individual economic data
- Maintain historical values
- Encode state as Latent-N

**Structure:**
```rust
pub struct Indicator {
    pub name: String,              // "GDP", "Unemployment", etc.
    pub series_id: String,         // FRED series ID
    pub value: f64,                // Current value
    pub history: Vec<f64>,         // Historical data
    pub latent_encoding: LatentN,  // φ-space encoding
    pub fibonacci_level: u64,      // Influence weight
    pub indicator_type: IndicatorType,
    pub timestamp: DateTime<Utc>,
}
```

### 3. FieldState

**Responsibilities:**
- Represent current field configuration
- Calculate field vectors and momentum
- Classify market phase (bullish/bearish/neutral)

**Structure:**
```rust
pub struct FieldState {
    pub strength: f64,           // Field magnitude
    pub direction: f64,          // Angle in radians
    pub gradient: FieldGradient, // Rate of change
    pub last_update: DateTime<Utc>,
}
```

**Phases:**
- `StrongBullish` - Strength > 100, positive gradient
- `Bullish` - Strength > 50, positive gradient
- `Neutral` - Default state
- `Bearish` - Strength < -50, negative gradient
- `StrongBearish` - Strength < -100, negative gradient

### 4. FREDClient

**Responsibilities:**
- Fetch data from Federal Reserve Economic Data API
- Parse and validate responses
- Support multiple indicator types

**Supported Indicators:**
- GDP (Gross Domestic Product)
- UNRATE (Unemployment Rate)
- CPIAUCSL (Consumer Price Index / Inflation)
- FEDFUNDS (Federal Funds Rate)
- Custom series by ID

### 5. GameTheoryAdjuster

**Responsibilities:**
- Modify Nash equilibrium payoffs based on field state
- Calculate risk factors
- Determine optimal position sizing
- Recommend trading actions

**Adjustment Algorithm:**
```rust
adjusted_payoff = base_payoff
    × phase_multiplier        // 0.5 - 1.5
    × strength_factor         // Fibonacci-scaled
    × momentum_factor         // Gradient-based
    × confidence             // Data quality
```

**Output:**
- Adjusted payoffs (quantized to Fibonacci)
- Risk factors (0.5 - 1.5)
- Position sizing recommendations
- Trading action signals

### 6. FieldInfluence

**Responsibilities:**
- Represent field effect at specific point
- Support interpolation and superposition
- Apply φ-scaling for damping

**Structure:**
```rust
pub struct FieldInfluence {
    pub magnitude: f64,      // Total influence strength
    pub direction_x: f64,    // X component
    pub direction_y: f64,    // Y component
    pub confidence: f64,     // Prediction confidence
}
```

## Mathematical Foundation

### Latent-N Encoding

Each indicator is encoded as a Latent-N state:
```
n = fibonacci_level + volatility_factor
```

Where:
- `fibonacci_level` = importance-weighted Fibonacci index
- `volatility_factor` = (std_dev × 10) for recent history

From Latent-N, we decode:
- **Energy**: F[n] (Fibonacci sequence)
- **Time**: L[n] (Lucas sequence)
- **Address**: Zeckendorf decomposition
- **Direction**: (-1)^n (forward/backward)
- **Angle**: n × (2π / φ) for CORDIC rotation

### Influence Matrix

The influence matrix captures cross-indicator relationships:
```
Matrix[i][j] = (F[i] / F[j]) / φ
```

Properties:
- Diagonal = 1.0 (self-influence)
- Off-diagonal = φ-scaled coupling
- Symmetric in φ-space
- Maintains golden ratio harmonics

### CORDIC Field Rotation

Field direction is calculated using φ-CORDIC:
```
angle = Latent-N.angle
(x, y) = CORDIC.rotate(value, 0, angle)
direction = atan2(y, x)
```

Benefits:
- Integer-only arithmetic
- Natural φ-spiral convergence
- O(log n) complexity

### Field Influence Calculation

At any point (x, y) in strategy space:
```
influence = Σ (E[i] × falloff[i] × weight[i])
falloff[i] = φ / distance²
weight[i] = influence_matrix[i].average()
```

This follows inverse-square law with φ-scaling.

### Nash Equilibrium Adjustment

Game theory payoffs are modified:
```
adjusted = quantize_fibonacci(
    base_payoff
    × phase.multiplier()
    × strength_factor
    × momentum_factor
    × confidence
)
```

Quantization ensures payoffs remain in Fibonacci sequence, maintaining φ-harmonic game theory.

## Data Flow

### 1. Initialization
```rust
let mut field = MacroField::new();
```

### 2. Load Indicators
```rust
field.load_indicators(api_key, vec![
    IndicatorType::GDP,
    IndicatorType::Unemployment,
    IndicatorType::Inflation,
    IndicatorType::InterestRate,
]).await?;
```

### 3. Encode to φ-Field
```rust
let vectors = field.encode_to_field()?;
// Each vector has: position, magnitude, direction, latent_n
```

### 4. Calculate Influence
```rust
let influence = field.calculate_influence((0.0, 0.0));
// Returns: magnitude, direction_x, direction_y, confidence
```

### 5. Adjust Game Theory
```rust
let base_payoff = 21; // F[8] from retrocausal GOAP
let adjusted = field.game_theory_adjust(base_payoff);
// Returns: Fibonacci-quantized adjusted payoff
```

### 6. Make Trading Decision
```rust
let adjuster = GameTheoryAdjuster::new(&field.field_state);
let action = adjuster.recommended_action();
let size = adjuster.position_size(1000.0);
```

## Integration with AURELIA

### Retrocausal GOAP Integration

The macro-field modifies `GOAPAction` payoffs:
```rust
// In retrocausal_goap.rs
let mut action = find_optimal_action();
if macro_field.is_enabled() {
    action.payoff = macro_field.game_theory_adjust(action.payoff);
}
```

### Latent-N State Tracking

Indicators use the same Latent-N encoding as core AURELIA:
```rust
pub struct Indicator {
    pub latent_encoding: LatentN,  // From phi-core
    // ...
}
```

This ensures consistent state representation across the system.

### CORDIC Rotation

Field directions use φ-CORDIC from phi-core:
```rust
use phi_core::cordic::PhiCORDIC;

let cordic = PhiCORDIC::new();
let state = cordic.rotate(x, y, angle);
```

## Performance Characteristics

### Time Complexity
- Indicator loading: O(n × m) where n = indicators, m = history points
- Field encoding: O(n)
- Influence calculation: O(n) per query point
- Matrix building: O(n²)
- Payoff adjustment: O(1)

### Space Complexity
- Indicators: O(n × m) for history
- Influence matrix: O(n²)
- Field state: O(n) for gradient
- Total: O(n² + nm)

### Caching Strategy
- Field state updated on indicator changes
- Influence matrix rebuilt when indicators added/removed
- CORDIC engine reused across calculations

## Configuration Options

### Indicator Selection
```rust
// Minimal setup
vec![IndicatorType::GDP, IndicatorType::Unemployment]

// Full economic picture
vec![
    IndicatorType::GDP,
    IndicatorType::Unemployment,
    IndicatorType::Inflation,
    IndicatorType::InterestRate,
    IndicatorType::Custom("M2SL"), // Money supply
]
```

### Field Strength Thresholds
- Strong: |strength| > 100
- Moderate: 50 < |strength| < 100
- Weak: |strength| < 50

### Confidence Calculation
```rust
confidence = freshness × 0.6 + completeness × 0.4
freshness = 1.0 - (age_hours / 720)  // 30 days
completeness = (indicators_with_history / total)
```

## A/B Testing

The field can be toggled for controlled experiments:
```rust
field.toggle();  // Disable
// Run strategy without macro field
field.toggle();  // Re-enable
// Run strategy with macro field
```

This allows measuring impact on:
- Win rate
- Sharpe ratio
- Maximum drawdown
- Return on investment

## Error Handling

### FRED API Errors
- Invalid API key → `Err(anyhow!("FRED API error"))`
- Missing data → Skip indicator with warning
- Rate limiting → Exponential backoff (not yet implemented)

### Data Validation
- Non-numeric values → Filtered out
- Missing history → Uses current value only
- Stale data → Reduced confidence

### Numerical Stability
- Division by zero → Returns 0.0 with low confidence
- Overflow → Clamps to Fibonacci bounds
- NaN/Inf → Replaced with neutral values

## Future Enhancements

### Phase 2 Features
1. **Real-time Updates**: WebSocket connection to FRED
2. **Machine Learning**: Train on historical field → outcome correlations
3. **Multi-timeframe**: Separate fields for day/week/month horizons
4. **Regional Fields**: Separate φ-fields per market/region
5. **Sentiment Integration**: Incorporate news sentiment as indicator

### Phase 3 Features
1. **Adaptive Weights**: Learn optimal influence matrix from results
2. **Field Prediction**: Forecast future field states
3. **Anomaly Detection**: Identify unusual field configurations
4. **Cross-asset Fields**: Correlate equities, bonds, commodities

## Testing Strategy

### Unit Tests
- Latent-N encoding correctness
- Influence matrix properties
- Field state calculations
- Payoff adjustments

### Integration Tests
- FRED API integration (with mock server)
- End-to-end field calculation
- Game theory adjustment pipeline

### Property Tests
- Fibonacci quantization maintains sequence
- Influence matrix symmetry
- Confidence bounds [0, 1]
- Field strength proportional to indicator values

## References

### Papers
- Nash, J. (1950). "Equilibrium Points in N-Person Games"
- Cassini Identity: F[n-1] × F[n+1] - F[n]² = (-1)^n
- φ-arithmetic: log(a×b) = log(a) + log(b)

### APIs
- FRED API: https://fred.stlouisfed.org/docs/api/
- Federal Reserve Economic Data

### Related AURELIA Components
- `phi-core`: Latent-N, CORDIC, Fibonacci sequences
- `retrocausal_goap`: Goal-oriented action planning
- `holographic-memory`: State persistence

## License

MIT License - See LICENSE file for details

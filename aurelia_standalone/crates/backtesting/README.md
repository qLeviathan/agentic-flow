# AURELIA Enhanced Backtesting Framework

Advanced backtesting system integrated with AURELIA's Latent-N encoding and φ-game theory for optimal trading strategy evaluation.

## 🌟 Features

### Fibonacci Analysis
- **Retracement Levels**: Automatic calculation of 23.6%, 38.2%, 50%, 61.8% support levels
- **Extension Levels**: 61.8%, 100%, 161.8% (φ), 261.8% (φ²) resistance levels
- **Dynamic Swing Detection**: Configurable lookback period for swing high/low identification
- **Latent-N Encoding**: Each Fibonacci level encoded as single integer state

### Lucas Time Windows
- **Natural Time Boundaries**: Entry/exit timing based on Lucas sequences
- **Multiple Window Sizes**: From L[1]=1 to L[n] bars
- **Boundary Detection**: Optimal decision points at window edges
- **Temporal Encoding**: Time itself encoded as Latent-N state

### Latent-N State Tracking
- **Universe Encoding**: Every market state → single integer n
- **Energy Extraction**: F[n] (Fibonacci) represents price momentum
- **Time Coordinate**: L[n] (Lucas) represents temporal position
- **Direction Tracking**: Even n = forward, odd n = retrocausal
- **CORDIC Rotation**: φ-based angle calculation for market phase

### φ-Game Theory Decision Making
- **Nash Equilibrium**: Calculate optimal strategy at each decision point
- **Payoff Mapping**: Costs/benefits mapped to Fibonacci matrix
- **Strategy Space**: Actions represented as Zeckendorf decomposition
- **Real-time Optimization**: No machine learning, pure mathematical optimization

### Performance Metrics
- **Sharpe Ratio**: Risk-adjusted returns (annualized)
- **Win Rate**: Percentage of profitable trades
- **Profit Factor**: Gross profit / gross loss ratio
- **Maximum Drawdown**: Peak-to-trough decline
- **Kelly Criterion**: Optimal position sizing
- **Equity Curve**: Capital over time tracking

## 📦 Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
backtesting = { path = "crates/backtesting" }
phi-core = { path = "crates/phi-core" }
```

## 🚀 Quick Start

### From CSV File

```rust
use backtesting::{BacktestEngine, BacktestConfig};

fn main() -> anyhow::Result<()> {
    let config = BacktestConfig {
        initial_capital: 10000.0,
        commission: 0.001,
        slippage: 0.0005,
        risk_per_trade: 0.02,
        use_phi_game_theory: true,
        ..Default::default()
    };

    let mut engine = BacktestEngine::from_csv("data/market_data.csv", config)?;
    let results = engine.backtest_strategy()?;

    println!("Sharpe Ratio: {:.2}", results.sharpe_ratio);
    println!("Total Return: {:.2}%", results.total_return * 100.0);

    Ok(())
}
```

### From In-Memory Data

```rust
use backtesting::{BacktestEngine, BacktestConfig, OHLCV};
use chrono::Utc;

let data = vec![
    OHLCV {
        timestamp: Utc::now(),
        open: 100.0,
        high: 105.0,
        low: 99.0,
        close: 103.0,
        volume: 1000.0,
    },
    // ... more data
];

let config = BacktestConfig::default();
let mut engine = BacktestEngine::new(data, config);
let results = engine.backtest_strategy()?;
```

## 📊 CSV Format

The CSV file should have the following columns:

```csv
timestamp,open,high,low,close,volume
2024-01-01T00:00:00Z,100.0,105.0,99.0,103.0,1000.0
2024-01-02T00:00:00Z,103.0,108.0,102.0,107.0,1200.0
```

## 🧮 Core Concepts

### Latent-N Encoding

Every market state is encoded as a single integer `n`, from which we extract:

```rust
let latent_state = LatentN::new(42);
let universe = latent_state.decode();

// Energy level (Fibonacci)
println!("Energy: {}", universe.energy);  // F[42]

// Time coordinate (Lucas)
println!("Time: {}", universe.time);      // L[42]

// Direction (forward/backward)
println!("Direction: {:?}", universe.direction);

// CORDIC angle
println!("Phase: {}", universe.angle);
```

### Fibonacci Levels

Calculated from swing high/low using golden ratio:

```rust
engine.calculate_fibonacci_levels(bar_index)?;

let fib = engine.fib_levels.unwrap();

// Support levels
println!("Support 23.6%: {}", fib.support[0]);
println!("Support 38.2%: {}", fib.support[1]);
println!("Support 50.0%: {}", fib.support[2]);
println!("Support 61.8%: {}", fib.support[3]);

// Resistance levels
println!("Resistance 61.8%: {}", fib.resistance[0]);
println!("Resistance 100%: {}", fib.resistance[1]);
println!("Resistance φ: {}", fib.resistance[2]);
println!("Resistance φ²: {}", fib.resistance[3]);
```

### Lucas Time Windows

Natural time boundaries for decision-making:

```rust
engine.identify_lucas_windows();

for window in &engine.lucas_windows {
    println!("Window: bars {}-{} (L[{}] = {})",
        window.start_bar,
        window.end_bar,
        window.lucas_index,
        window.lucas_value
    );
}
```

### φ-Game Theory Decisions

Optimal strategy calculated using Nash equilibrium:

```rust
let action = engine.evaluate_trade(
    bar_index,
    &current_bar,
    &latent_state,
    &lucas_window
)?;

match action.as_str() {
    "enter_long" => println!("Optimal: GO LONG"),
    "enter_short" => println!("Optimal: GO SHORT"),
    "exit" => println!("Optimal: CLOSE POSITION"),
    _ => println!("Optimal: HOLD"),
}
```

## 📈 Performance Analysis

### Accessing Results

```rust
let results = engine.backtest_strategy()?;

println!("Total Trades: {}", results.total_trades);
println!("Win Rate: {:.2}%", results.win_rate * 100.0);
println!("Profit Factor: {:.2}", results.profit_factor);
println!("Sharpe Ratio: {:.2}", results.sharpe_ratio);
println!("Max Drawdown: {:.2}%", results.max_drawdown * 100.0);
println!("Total Return: {:.2}%", results.total_return * 100.0);
```

### Analyzing Trades

```rust
for trade in results.trades {
    println!("Trade: {} @ ${:.2}",
        if trade.direction == 1 { "LONG" } else { "SHORT" },
        trade.entry_price
    );
    println!("  Entry Time: {}", trade.entry_time);
    println!("  Exit Time: {}", trade.exit_time);
    println!("  P&L: ${:.2}", trade.pnl);
    println!("  Fib Level: ${:.2}", trade.entry_fib_level);
    println!("  Lucas Window: L[{}]", trade.lucas_window.lucas_index);
    println!("  Latent-N: n={}", trade.entry_latent_state.n);
}
```

### Equity Curve

```rust
for (timestamp, equity) in results.equity_curve {
    println!("{}: ${:.2}", timestamp, equity);
}
```

## 🎯 Strategy Examples

### Fibonacci Retracement Strategy

Buy at support levels during uptrend:

```rust
if at_fibonacci_support && trend_is_up && at_lucas_boundary {
    engine.enter_long(&bar, latent_state, lucas_window)?;
}
```

### Mean Reversion Strategy

Trade reversals at extreme Fibonacci extensions:

```rust
if price > fibonacci_resistance[3] && at_lucas_boundary {
    engine.enter_short(&bar, latent_state, lucas_window)?;
}
```

### φ-Optimal Strategy

Let game theory decide (recommended):

```rust
let config = BacktestConfig {
    use_phi_game_theory: true,
    ..Default::default()
};
```

## 🔧 Configuration Options

```rust
pub struct BacktestConfig {
    /// Initial capital
    pub initial_capital: f64,           // Default: 10000.0

    /// Commission per trade (fraction)
    pub commission: f64,                // Default: 0.001 (0.1%)

    /// Slippage per trade (fraction)
    pub slippage: f64,                  // Default: 0.0005 (0.05%)

    /// Risk per trade (fraction)
    pub risk_per_trade: f64,            // Default: 0.02 (2%)

    /// Maximum concurrent positions
    pub max_positions: usize,           // Default: 1

    /// Lookback period for swing detection
    pub swing_lookback: usize,          // Default: 20

    /// Use φ-game theory for decisions
    pub use_phi_game_theory: bool,      // Default: true
}
```

## 🧪 Testing

Run the test suite:

```bash
cargo test --package backtesting
```

Run the example:

```bash
cargo run --package backtesting --example simple_backtest
```

Run benchmarks:

```bash
cargo bench --package backtesting
```

## 📚 Mathematical Foundation

### Fibonacci Retracements

Based on the golden ratio φ = 1.618:

- 23.6% = 1 - 1/φ²
- 38.2% = 1 - 1/φ
- 50.0% = simple midpoint
- 61.8% = 1/φ
- 100% = full range
- 161.8% = φ extension

### Lucas Numbers

L[n] = L[n-1] + L[n-2], with L[0] = 2, L[1] = 1

Used for natural time boundaries in market cycles.

### Latent-N Theorem

Every state can be encoded as single integer n, with:

- Energy: F[n] (Fibonacci)
- Time: L[n] (Lucas)
- Address: Zeckendorf(n)
- Direction: (-1)^n

### φ-Game Theory

Nash equilibrium calculated using:

- Payoff matrix → Fibonacci matrix
- Strategy space → Zeckendorf bits
- Convergence → Lucas boundaries

## 🤝 Integration with AURELIA

The backtesting framework is fully integrated with AURELIA's core systems:

- **phi-core**: Latent-N encoding, Fibonacci/Lucas constants
- **holographic-memory**: φ-game theory decision tree
- **cosmos-physics**: Future integration for market dynamics

## 📄 License

MIT License - see LICENSE file for details

## 🔗 References

- [Fibonacci Retracements in Technical Analysis](https://www.investopedia.com/terms/f/fibonacciretracement.asp)
- [Lucas Numbers and the Golden Ratio](https://en.wikipedia.org/wiki/Lucas_number)
- [Nash Equilibrium in Game Theory](https://en.wikipedia.org/wiki/Nash_equilibrium)
- [AURELIA Project](https://github.com/qLeviathan/agentic-flow)

# Webull Integration for AURELIA

Comprehensive Webull API integration for live and co-trading with AURELIA's Latent-N encoding system.

## Features

- **Authentication**: Secure login with Webull API (including MFA support)
- **Real-time Market Data**: Fetch quotes, option chains, and streaming data
- **Options Trading**: Place and manage options orders with Fibonacci-based entry levels
- **Position Monitoring**: Track holdings, P&L, and portfolio value
- **Latency Tracking**: Monitor API performance with <10ms target
- **Latent-N Encoding**: All data structures encoded using AURELIA's Fibonacci/Lucas system
- **Co-Trading Mode**: AI suggestions with human approval
- **Paper Trading**: Safe testing environment without real money

## Architecture

### Latent-N Universe Encoding

Every piece of data is encoded as a single integer `n`, from which we extract:

- **Energy**: F[n] (Fibonacci sequence)
- **Time**: L[n] (Lucas sequence)
- **Direction**: (-1)^n (forward/backward, retrocausal)
- **Address**: Zeckendorf decomposition

### Trading Modes

1. **Paper**: Simulated trading for testing (no real money)
2. **CoPilot**: AI suggestions with mandatory human approval
3. **Autonomous**: Fully AI-driven (requires explicit user consent)

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
webull-integration = { path = "./crates/webull-integration" }
phi-core = { path = "./crates/phi-core" }
```

## Quick Start

### 1. Set up credentials

Create a `.env` file:

```bash
WEBULL_USERNAME=your_email@example.com
WEBULL_PASSWORD=your_password
WEBULL_DEVICE_ID=your_device_id
WEBULL_TRADING_MODE=Paper
```

### 2. Basic usage

```rust
use webull_integration::*;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load credentials
    let credentials = auth::Credentials::from_env()?;

    // Create client in CoPilot mode
    let client = WebullClient::new(
        credentials,
        types::TradingMode::CoPilot
    ).await?;

    // Get market data
    let quote = client.get_market_data("AAPL").await?;
    println!("AAPL: ${:.2} (Latent-N: {})", quote.price, quote.latent_state.n);

    Ok(())
}
```

## Usage Examples

### Get Market Data

```rust
// Get single quote
let quote = client.get_market_data("AAPL").await?;
println!("Price: ${:.2}", quote.price);
println!("Bid/Ask: ${:.2} / ${:.2}", quote.bid, quote.ask);

// Decode Latent-N universe
let universe = quote.latent_state.decode();
println!("Energy: {}, Time: {}", universe.energy, universe.time);
```

### Place Option Order

```rust
use chrono::Utc;
use phi_core::LatentN;

// Create option contract
let contract = types::OptionContract {
    symbol: "AAPL".to_string(),
    strike: 150.0,
    expiration: Utc::now() + chrono::Duration::days(30),
    option_type: types::OptionType::Call,
    latent_state: LatentN::new(15000),
};

// Create order with Fibonacci entry
let order = types::OptionOrder {
    contract,
    action: types::Action::Buy,
    quantity: 5,
    order_type: types::OrderType::Limit,
    limit_price: Some(2.50),
    stop_price: None,
    time_in_force: types::TimeInForce::Day,
    fibonacci_level: 0.618,  // Golden ratio entry
    latent_state: LatentN::new(250),
    order_id: None,
    status: types::OrderStatus::Pending,
    timestamp: Utc::now(),
};

// Place order
let placed_order = client.place_option_order(order).await?;
println!("Order ID: {:?}", placed_order.order_id);
```

### Co-Trading Mode (AI + Human)

```rust
// Generate AI suggestion
let suggestion = client.suggest_trade("AAPL", types::Action::Buy).await?;

println!("AI Suggestion:");
println!("  Confidence: {:.2}%", suggestion.confidence * 100.0);
println!("  Risk: {:?}", suggestion.risk_level);
println!("  Reasoning: {}", suggestion.reasoning);
println!("  Expected Return: {:.2}%", suggestion.expected_return * 100.0);

// User reviews and approves
let approval = types::TradeApproval {
    suggestion_id: "suggestion-id".to_string(),
    approved: true,
    modified_order: None,
    comments: Some("Looks good to me!".to_string()),
    timestamp: Utc::now(),
};

// Execute approved trade
if let Some(order) = client.confirm_with_user(approval).await? {
    println!("Order executed: {:?}", order.order_id);
}
```

### Monitor Positions

```rust
// Get all positions
let positions = client.get_positions().await?;

for position in positions {
    println!("{}: {} shares @ ${:.2}",
        position.symbol,
        position.quantity,
        position.avg_price
    );
    println!("  Current: ${:.2}", position.current_price);
    println!("  P&L: ${:.2} ({:.2}%)",
        position.unrealized_pnl,
        (position.unrealized_pnl / (position.avg_price * position.quantity as f64)) * 100.0
    );
    println!("  Latent-N: {}", position.latent_state.n);
}
```

### Track Latency

```rust
// Get latency statistics
let stats = client.get_latency_stats().await;

println!("API Performance:");
println!("  Average: {:.2}ms", stats.avg_latency_us as f64 / 1000.0);
println!("  Min: {:.2}ms", stats.min_latency_us as f64 / 1000.0);
println!("  Max: {:.2}ms", stats.max_latency_us as f64 / 1000.0);
println!("  Success Rate: {:.2}%", stats.success_rate * 100.0);

// Check if meeting <10ms target
if client.is_latency_healthy().await {
    println!("✓ Latency targets met");
} else {
    println!("✗ Latency exceeds targets");
}
```

## Fibonacci-Based Trading

AURELIA uses Fibonacci retracement levels for optimal entry points:

- **0.236** (23.6%): Shallow retracement
- **0.382** (38.2%): Minor retracement
- **0.500** (50.0%): Half retracement
- **0.618** (61.8%): Golden ratio (optimal)
- **0.786** (78.6%): Deep retracement

Example:

```rust
// Calculate Fibonacci levels for entry
let price = 100.0;
let fib_levels = vec![
    price * 0.236,  // $23.60
    price * 0.382,  // $38.20
    price * 0.500,  // $50.00
    price * 0.618,  // $61.80 (golden ratio)
    price * 0.786,  // $78.60
];

// Use golden ratio level for order
order.fibonacci_level = 0.618;
order.limit_price = Some(fib_levels[3]);
```

## Safety Features

### Paper Trading Mode

Test strategies without risking real money:

```rust
let client = WebullClient::new(
    credentials,
    types::TradingMode::Paper  // No real trades
).await?;
```

### Risk Assessment

AI automatically assesses risk levels:

```rust
match suggestion.risk_level {
    types::RiskLevel::Low => println!("Safe trade"),
    types::RiskLevel::Medium => println!("Moderate risk"),
    types::RiskLevel::High => println!("High risk - caution advised"),
    types::RiskLevel::Extreme => println!("Extreme risk - avoid"),
}
```

### Position Sizing

Automatic position sizing based on risk:

- **Low Risk**: 10 contracts
- **Medium Risk**: 5 contracts
- **High Risk**: 2 contracts
- **Extreme Risk**: 1 contract

## Latent-N Data Encoding

All data structures include Latent-N encoding:

```rust
// Quote encoding
let latent = quote.latent_state;
let universe = latent.decode();

println!("Energy (Fibonacci): {}", universe.energy);
println!("Time (Lucas): {}", universe.time);
println!("Direction: {:?}", universe.direction);
println!("φ-Level: {}", universe.phi_level);
```

## Error Handling

```rust
match client.place_option_order(order).await {
    Ok(placed_order) => {
        println!("Success: {:?}", placed_order.order_id);
    }
    Err(e) => {
        eprintln!("Order failed: {}", e);
        // Handle error appropriately
    }
}
```

## API Documentation

### Core Types

- `WebullClient`: Main client interface
- `Quote`: Real-time market quote
- `OptionOrder`: Options order structure
- `Position`: Account position
- `TradeSuggestion`: AI trade recommendation
- `TradeApproval`: User approval/rejection

### Trading Modes

- `TradingMode::Paper`: Simulated trading
- `TradingMode::CoPilot`: AI + human approval
- `TradingMode::Autonomous`: Fully automated

## Performance

- **Target Latency**: <10ms for API operations
- **Success Rate**: 95%+ operations meet latency target
- **Throughput**: Supports real-time trading with sub-millisecond decision making

## Security

- Credentials stored in environment variables (never hardcoded)
- MFA support for enhanced security
- Session management with automatic refresh
- HTTPS/TLS encryption for all API calls

## Testing

Run tests:

```bash
cd crates/webull-integration
cargo test
```

Run integration tests (requires credentials):

```bash
cargo test --test integration_test -- --nocapture
```

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub: https://github.com/qLeviathan/agentic-flow
- Docs: https://aurelia.dev

//! Basic usage example for Webull integration

use webull_integration::*;
use anyhow::Result;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter("info")
        .init();

    println!("🚀 AURELIA Webull Integration - Basic Usage Example\n");

    // Load credentials from environment
    let credentials = match auth::Credentials::from_env() {
        Ok(creds) => creds,
        Err(_) => {
            println!("⚠️  No credentials found in environment.");
            println!("   Using demo credentials for paper trading mode.\n");

            auth::Credentials {
                username: "demo@aurelia.dev".to_string(),
                password: "demo_password".to_string(),
                device_id: "demo_device".to_string(),
                mfa_code: None,
            }
        }
    };

    // Create client in Paper trading mode (safe for testing)
    println!("📊 Initializing Webull client in Paper Trading mode...");
    let client = match WebullClient::new(credentials, types::TradingMode::Paper).await {
        Ok(client) => {
            println!("✓ Client initialized successfully\n");
            client
        }
        Err(e) => {
            println!("✗ Failed to initialize client: {}", e);
            println!("\n💡 Make sure you have set up your credentials in .env file:");
            println!("   WEBULL_USERNAME=your_email@example.com");
            println!("   WEBULL_PASSWORD=your_password");
            println!("   WEBULL_DEVICE_ID=your_device_id\n");
            return Ok(());
        }
    };

    // Example 1: Get market data
    println!("📈 Example 1: Fetching Market Data");
    println!("   Requesting quote for AAPL...");

    match client.get_market_data("AAPL").await {
        Ok(quote) => {
            println!("   ✓ Quote received:");
            println!("     Symbol: {}", quote.symbol);
            println!("     Price: ${:.2}", quote.price);
            println!("     Bid: ${:.2}", quote.bid);
            println!("     Ask: ${:.2}", quote.ask);
            println!("     Volume: {}", quote.volume);

            // Decode Latent-N encoding
            let universe = quote.latent_state.decode();
            println!("\n   📊 Latent-N Universe State:");
            println!("     Energy (Fibonacci): {}", universe.energy);
            println!("     Time (Lucas): {}", universe.time);
            println!("     Direction: {:?}", universe.direction);
            println!("     φ-Level: {}", universe.phi_level);
        }
        Err(e) => {
            println!("   ✗ Failed to fetch quote: {}", e);
            println!("   (This is expected in Paper mode without API access)");
        }
    }

    println!("\n");

    // Example 2: Generate AI trade suggestion
    println!("🤖 Example 2: AI Trade Suggestion (Co-Trading Mode)");
    println!("   Generating suggestion for AAPL...");

    match client.suggest_trade("AAPL", types::Action::Buy).await {
        Ok(suggestion) => {
            println!("   ✓ AI Suggestion generated:");
            println!("     Action: BUY");
            println!("     Confidence: {:.2}%", suggestion.confidence * 100.0);
            println!("     Risk Level: {:?}", suggestion.risk_level);
            println!("     Expected Return: {:.2}%", suggestion.expected_return * 100.0);
            println!("\n   📝 Reasoning:");
            println!("     {}", suggestion.reasoning);
            println!("\n   📊 Fibonacci Levels:");
            for (i, level) in suggestion.fib_levels.iter().enumerate() {
                let ratios = vec![0.236, 0.382, 0.5, 0.618, 0.786];
                println!("     {:.3}: ${:.2}", ratios[i], level);
            }
        }
        Err(e) => {
            println!("   ✗ Failed to generate suggestion: {}", e);
            println!("   (This is expected in Paper mode without API access)");
        }
    }

    println!("\n");

    // Example 3: Latency tracking
    println!("⏱️  Example 3: Latency Tracking");
    let stats = client.get_latency_stats().await;

    if stats.total_operations > 0 {
        println!("   API Performance Metrics:");
        println!("     Total Operations: {}", stats.total_operations);
        println!("     Average Latency: {:.2}ms", stats.avg_latency_us as f64 / 1000.0);
        println!("     Min Latency: {:.2}ms", stats.min_latency_us as f64 / 1000.0);
        println!("     Max Latency: {:.2}ms", stats.max_latency_us as f64 / 1000.0);
        println!("     Success Rate: {:.2}%", stats.success_rate * 100.0);

        if client.is_latency_healthy().await {
            println!("     ✓ Meeting <10ms target");
        } else {
            println!("     ⚠️  Exceeding latency targets");
        }
    } else {
        println!("   No latency data collected yet.");
    }

    println!("\n");

    // Example 4: Latent-N encoding
    println!("🔢 Example 4: Latent-N Encoding");
    println!("   Encoding stock price into Latent-N universe...");

    let price = 150.75;
    let price_cents = (price * 100.0) as u64;
    let latent = client.encode_to_latent_n(price_cents);

    println!("   Price: ${:.2}", price);
    println!("   Latent-N Index: {}", latent.n);

    let universe = latent.decode();
    println!("\n   Universe State:");
    println!("     Energy: {} (Fibonacci sequence)", universe.energy);
    println!("     Time: {} (Lucas sequence)", universe.time);
    println!("     Direction: {:?}", universe.direction);
    println!("     Angle: {:.4} radians", universe.angle);
    println!("     φ-Level: {}", universe.phi_level);

    println!("\n✅ Examples completed!");
    println!("\n💡 Next steps:");
    println!("   - Set up real credentials in .env file");
    println!("   - Switch to CoPilot mode for AI-assisted trading");
    println!("   - Explore the full API in the documentation");

    Ok(())
}

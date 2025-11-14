//! Simple backtesting example demonstrating Fibonacci/Lucas strategy
//!
//! Run with:
//! ```bash
//! cargo run --package backtesting --example simple_backtest
//! ```

use backtesting::{BacktestEngine, BacktestConfig, OHLCV};
use chrono::{TimeZone, Utc};

fn main() -> anyhow::Result<()> {
    println!("🌟 AURELIA Enhanced Backtesting Framework");
    println!("========================================\n");

    // Generate synthetic market data (uptrend with retracements)
    let data = generate_synthetic_data();

    println!("📊 Generated {} bars of synthetic market data", data.len());
    println!("   Price range: ${:.2} - ${:.2}\n",
        data.iter().map(|b| b.low).fold(f64::INFINITY, f64::min),
        data.iter().map(|b| b.high).fold(f64::NEG_INFINITY, f64::max)
    );

    // Configure backtest
    let config = BacktestConfig {
        initial_capital: 10000.0,
        commission: 0.001,      // 0.1% per trade
        slippage: 0.0005,       // 0.05% slippage
        risk_per_trade: 0.02,   // Risk 2% per trade
        max_positions: 1,
        swing_lookback: 20,
        use_phi_game_theory: true,
    };

    println!("⚙️  Backtest Configuration:");
    println!("   Initial Capital: ${:.2}", config.initial_capital);
    println!("   Commission: {:.2}%", config.commission * 100.0);
    println!("   Risk per Trade: {:.2}%", config.risk_per_trade * 100.0);
    println!("   φ-Game Theory: {}\n", if config.use_phi_game_theory { "Enabled" } else { "Disabled" });

    // Create backtest engine
    let mut engine = BacktestEngine::new(data, config);

    println!("🧮 Running backtest with Fibonacci/Lucas logic...\n");

    // Run backtest
    let results = engine.backtest_strategy()?;

    // Display results
    println!("📈 Backtest Results");
    println!("==================\n");

    println!("Trading Performance:");
    println!("  Total Trades: {}", results.total_trades);
    println!("  Winning Trades: {} ({:.1}%)", results.winning_trades, results.win_rate * 100.0);
    println!("  Losing Trades: {}", results.losing_trades);
    println!("  Win Rate: {:.2}%\n", results.win_rate * 100.0);

    println!("Profitability:");
    println!("  Total P&L: ${:.2}", results.total_pnl);
    println!("  Average Win: ${:.2}", results.avg_win);
    println!("  Average Loss: ${:.2}", results.avg_loss);
    println!("  Profit Factor: {:.2}\n", results.profit_factor);

    println!("Risk Metrics:");
    println!("  Maximum Drawdown: {:.2}%", results.max_drawdown * 100.0);
    println!("  Sharpe Ratio: {:.2}\n", results.sharpe_ratio);

    println!("Returns:");
    println!("  Initial Capital: $10,000.00");
    println!("  Final Capital: ${:.2}", results.final_capital);
    println!("  Total Return: {:.2}%\n", results.total_return * 100.0);

    // Display some example trades
    if !results.trades.is_empty() {
        println!("📋 Sample Trades (first 5):");
        println!("============================\n");

        for (i, trade) in results.trades.iter().take(5).enumerate() {
            let direction = if trade.direction == 1 { "LONG" } else { "SHORT" };
            let profit_pct = (trade.exit_price - trade.entry_price) / trade.entry_price
                           * trade.direction as f64 * 100.0;

            println!("Trade #{}", i + 1);
            println!("  Direction: {}", direction);
            println!("  Entry: ${:.2} @ {}", trade.entry_price, trade.entry_time.format("%Y-%m-%d"));
            println!("  Exit: ${:.2} @ {}", trade.exit_price, trade.exit_time.format("%Y-%m-%d"));
            println!("  P&L: ${:.2} ({:+.2}%)", trade.pnl, profit_pct);
            println!("  Fibonacci Level: ${:.2}", trade.entry_fib_level);
            println!("  Lucas Window: {} -> {} (L[{}] = {})",
                trade.lucas_window.start_bar,
                trade.lucas_window.end_bar,
                trade.lucas_window.lucas_index,
                trade.lucas_window.lucas_value
            );
            println!("  Latent-N State: n={}", trade.entry_latent_state.n);
            println!("  φ-Action: {}\n", trade.phi_action);
        }
    }

    // Display Latent-N statistics
    println!("🧬 Latent-N Statistics:");
    println!("========================\n");

    let total_states = engine.latent_states.len();
    let avg_n = engine.latent_states.iter().map(|s| s.n).sum::<u64>() as f64 / total_states as f64;

    println!("  Total States Tracked: {}", total_states);
    println!("  Average Latent-N: {:.2}", avg_n);
    println!("  State Range: {} - {}",
        engine.latent_states.iter().map(|s| s.n).min().unwrap_or(0),
        engine.latent_states.iter().map(|s| s.n).max().unwrap_or(0)
    );

    // Display Lucas window statistics
    println!("\n⏰ Lucas Time Windows:");
    println!("======================\n");

    println!("  Total Windows: {}", engine.lucas_windows.len());
    if !engine.lucas_windows.is_empty() {
        let window_sizes: Vec<u64> = engine.lucas_windows.iter()
            .map(|w| w.lucas_value)
            .collect();
        let min_size = window_sizes.iter().min().unwrap();
        let max_size = window_sizes.iter().max().unwrap();

        println!("  Window Size Range: {} - {} bars", min_size, max_size);
        println!("  Lucas Numbers Used: {} unique values",
            window_sizes.iter().collect::<std::collections::HashSet<_>>().len()
        );
    }

    println!("\n✨ Backtest complete!");

    Ok(())
}

/// Generate synthetic market data with realistic price movements
fn generate_synthetic_data() -> Vec<OHLCV> {
    let mut data = Vec::new();
    let mut price = 100.0;
    let base_date = Utc.with_ymd_and_hms(2024, 1, 1, 0, 0, 0).unwrap();

    for day in 0..250 {
        // Simulate trend with noise
        let trend = (day as f64 / 50.0).sin() * 5.0;
        let noise = (day as f64 * 0.1).sin() * 2.0;

        price += trend + noise;

        let volatility = 2.0 + (day as f64 / 100.0).sin().abs() * 1.5;

        let open = price;
        let high = price + volatility;
        let low = price - volatility;
        let close = price + (day as f64 * 0.05).cos() * volatility;

        data.push(OHLCV {
            timestamp: base_date + chrono::Duration::days(day),
            open,
            high,
            low,
            close,
            volume: 1000.0 + (day as f64 * 100.0),
        });

        price = close;
    }

    data
}

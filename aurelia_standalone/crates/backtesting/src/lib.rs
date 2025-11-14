//! # Enhanced Backtesting Framework
//!
//! Backtesting system integrated with AURELIA's Latent-N encoding and φ-game theory.
//!
//! ## Key Features
//!
//! - **Fibonacci Retracement Levels**: Calculate support/resistance from swing points
//! - **Lucas Time Windows**: Natural time boundaries for entry/exit timing
//! - **Latent-N State Tracking**: Encode all market states as single integers
//! - **φ-Game Theory**: Optimal strategy calculation at each decision point
//! - **Performance Metrics**: Sharpe ratio, win rate, profit factor, max drawdown
//!
//! ## Example
//!
//! ```rust,no_run
//! use backtesting::{BacktestEngine, BacktestConfig};
//!
//! let config = BacktestConfig {
//!     initial_capital: 10000.0,
//!     commission: 0.001,
//!     slippage: 0.0005,
//!     ..Default::default()
//! };
//!
//! let mut engine = BacktestEngine::from_csv("market_data.csv", config)?;
//! let results = engine.backtest_strategy()?;
//!
//! println!("Sharpe Ratio: {:.2}", results.sharpe_ratio);
//! println!("Win Rate: {:.2}%", results.win_rate * 100.0);
//! ```

use anyhow::{anyhow, Context, Result};
use chrono::{DateTime, Utc};
use phi_core::{LatentN, FIBONACCI, LUCAS};
use holographic_memory::phi_game_theory::{PhiGameTree, PhiAction, PhiDecisionNode};
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::path::Path;

// ============================================================================
// Core Data Structures
// ============================================================================

/// OHLCV candlestick data
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OHLCV {
    pub timestamp: DateTime<Utc>,
    pub open: f64,
    pub high: f64,
    pub low: f64,
    pub close: f64,
    pub volume: f64,
}

/// Fibonacci retracement levels calculated from swing high/low
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FibonacciLevels {
    /// Swing high price
    pub swing_high: f64,

    /// Swing low price
    pub swing_low: f64,

    /// Support levels (23.6%, 38.2%, 50%, 61.8%)
    pub support: Vec<f64>,

    /// Resistance levels (61.8%, 100%, 161.8%, 261.8%)
    pub resistance: Vec<f64>,

    /// Latent-N encoding of this Fibonacci level
    pub latent_state: LatentN,
}

/// Lucas time window for natural entry/exit timing
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LucasWindow {
    /// Start bar index
    pub start_bar: usize,

    /// End bar index
    pub end_bar: usize,

    /// Which Lucas number (index)
    pub lucas_index: u64,

    /// Lucas number value
    pub lucas_value: u64,

    /// Latent-N encoding of this time window
    pub latent_state: LatentN,
}

/// Trade execution record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trade {
    /// Entry timestamp
    pub entry_time: DateTime<Utc>,

    /// Exit timestamp
    pub exit_time: DateTime<Utc>,

    /// Entry price
    pub entry_price: f64,

    /// Exit price
    pub exit_price: f64,

    /// Position size
    pub size: f64,

    /// Trade direction (1 = long, -1 = short)
    pub direction: i32,

    /// Profit/loss
    pub pnl: f64,

    /// Fibonacci level at entry
    pub entry_fib_level: f64,

    /// Lucas window during trade
    pub lucas_window: LucasWindow,

    /// Latent-N state at entry
    pub entry_latent_state: LatentN,

    /// φ-game theory action taken
    pub phi_action: String,
}

/// Backtest configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BacktestConfig {
    /// Initial capital
    pub initial_capital: f64,

    /// Commission per trade (as fraction)
    pub commission: f64,

    /// Slippage per trade (as fraction)
    pub slippage: f64,

    /// Risk per trade (as fraction of capital)
    pub risk_per_trade: f64,

    /// Maximum concurrent positions
    pub max_positions: usize,

    /// Lookback period for swing detection
    pub swing_lookback: usize,

    /// Use φ-game theory for decisions
    pub use_phi_game_theory: bool,
}

impl Default for BacktestConfig {
    fn default() -> Self {
        Self {
            initial_capital: 10000.0,
            commission: 0.001,
            slippage: 0.0005,
            risk_per_trade: 0.02,
            max_positions: 1,
            swing_lookback: 20,
            use_phi_game_theory: true,
        }
    }
}

/// Backtest performance results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BacktestResults {
    /// Total number of trades
    pub total_trades: usize,

    /// Winning trades
    pub winning_trades: usize,

    /// Losing trades
    pub losing_trades: usize,

    /// Win rate (0-1)
    pub win_rate: f64,

    /// Total profit/loss
    pub total_pnl: f64,

    /// Average win
    pub avg_win: f64,

    /// Average loss
    pub avg_loss: f64,

    /// Profit factor (gross profit / gross loss)
    pub profit_factor: f64,

    /// Maximum drawdown
    pub max_drawdown: f64,

    /// Sharpe ratio (annualized)
    pub sharpe_ratio: f64,

    /// Final capital
    pub final_capital: f64,

    /// Total return (as fraction)
    pub total_return: f64,

    /// All executed trades
    pub trades: Vec<Trade>,

    /// Equity curve (capital over time)
    pub equity_curve: Vec<(DateTime<Utc>, f64)>,
}

// ============================================================================
// Backtesting Engine
// ============================================================================

/// Main backtesting engine
pub struct BacktestEngine {
    /// Historical OHLCV data
    pub data: Vec<OHLCV>,

    /// Configuration
    pub config: BacktestConfig,

    /// Current Fibonacci levels
    pub fib_levels: Option<FibonacciLevels>,

    /// Lucas time windows
    pub lucas_windows: Vec<LucasWindow>,

    /// Latent-N states throughout backtest
    pub latent_states: Vec<LatentN>,

    /// φ-Game theory decision tree
    phi_game: PhiGameTree,

    /// Current capital
    capital: f64,

    /// Open positions
    positions: Vec<Trade>,

    /// Closed trades
    trades: Vec<Trade>,

    /// Equity curve
    equity_curve: Vec<(DateTime<Utc>, f64)>,
}

impl BacktestEngine {
    /// Create new backtest engine from CSV file
    pub fn from_csv<P: AsRef<Path>>(path: P, config: BacktestConfig) -> Result<Self> {
        let file = File::open(path.as_ref())
            .context("Failed to open CSV file")?;

        let mut reader = csv::Reader::from_reader(file);
        let mut data = Vec::new();

        for result in reader.deserialize() {
            let record: OHLCV = result.context("Failed to parse CSV row")?;
            data.push(record);
        }

        if data.is_empty() {
            return Err(anyhow!("CSV file contains no data"));
        }

        Ok(Self::new(data, config))
    }

    /// Create new backtest engine from data
    pub fn new(data: Vec<OHLCV>, config: BacktestConfig) -> Self {
        let capital = config.initial_capital;

        Self {
            data,
            config,
            fib_levels: None,
            lucas_windows: Vec::new(),
            latent_states: Vec::new(),
            phi_game: PhiGameTree::new(),
            capital,
            positions: Vec::new(),
            trades: Vec::new(),
            equity_curve: Vec::new(),
        }
    }

    /// Run backtest strategy
    pub fn backtest_strategy(&mut self) -> Result<BacktestResults> {
        // Initialize Lucas windows
        self.identify_lucas_windows();

        // Main backtest loop
        for i in self.config.swing_lookback..self.data.len() {
            // Calculate current Fibonacci levels
            self.calculate_fibonacci_levels(i)?;

            // Get current bar
            let bar = &self.data[i].clone();

            // Encode current state as Latent-N
            let latent_state = self.encode_market_state(i)?;
            self.latent_states.push(latent_state);

            // Find current Lucas window
            let lucas_window = self.find_lucas_window(i)?;

            // Evaluate trade opportunity using φ-game theory
            let action = self.evaluate_trade(i, &bar, &latent_state, &lucas_window)?;

            // Execute trade based on action
            match action.as_str() {
                "enter_long" => self.enter_long(bar, latent_state, lucas_window)?,
                "enter_short" => self.enter_short(bar, latent_state, lucas_window)?,
                "exit" => self.exit_positions(bar)?,
                _ => {} // Hold
            }

            // Update equity curve
            self.equity_curve.push((bar.timestamp, self.capital));
        }

        // Close any remaining positions
        if !self.positions.is_empty() {
            let last_bar = self.data.last().unwrap();
            self.exit_positions(last_bar)?;
        }

        // Calculate performance metrics
        self.calculate_results()
    }

    /// Calculate Fibonacci retracement levels from swing high/low
    pub fn calculate_fibonacci_levels(&mut self, current_idx: usize) -> Result<()> {
        let lookback = self.config.swing_lookback;

        if current_idx < lookback {
            return Ok(());
        }

        // Find swing high and low in lookback period
        let slice = &self.data[current_idx - lookback..current_idx];

        let swing_high = slice.iter()
            .map(|bar| bar.high)
            .fold(f64::NEG_INFINITY, f64::max);

        let swing_low = slice.iter()
            .map(|bar| bar.low)
            .fold(f64::INFINITY, f64::min);

        let range = swing_high - swing_low;

        // Calculate retracement levels using Fibonacci ratios
        let phi = 1.618033988749895;
        let fib_ratios = [
            0.236,  // 23.6%
            0.382,  // 38.2%
            0.500,  // 50%
            0.618,  // 61.8%
        ];

        let support: Vec<f64> = fib_ratios.iter()
            .map(|ratio| swing_high - (range * ratio))
            .collect();

        let resistance: Vec<f64> = vec![
            swing_high + (range * 0.618),  // 61.8% extension
            swing_high + range,             // 100% extension
            swing_high + (range * 1.618),  // 161.8% extension (φ)
            swing_high + (range * 2.618),  // 261.8% extension (φ²)
        ];

        // Encode as Latent-N (use swing high as index approximation)
        let latent_n_index = ((swing_high / swing_low) * 10.0) as u64 % 94;
        let latent_state = LatentN::new(latent_n_index);

        self.fib_levels = Some(FibonacciLevels {
            swing_high,
            swing_low,
            support,
            resistance,
            latent_state,
        });

        Ok(())
    }

    /// Identify Lucas time windows (natural time boundaries)
    pub fn identify_lucas_windows(&mut self) {
        self.lucas_windows.clear();

        let total_bars = self.data.len();

        // Find Lucas numbers that fit within our data range
        for (idx, &lucas_value) in LUCAS.iter().enumerate() {
            let lucas_value = lucas_value as usize;

            if lucas_value >= total_bars {
                break;
            }

            // Create windows at Lucas intervals
            let mut start = 0;
            while start + lucas_value < total_bars {
                let window = LucasWindow {
                    start_bar: start,
                    end_bar: start + lucas_value,
                    lucas_index: idx as u64,
                    lucas_value: LUCAS[idx],
                    latent_state: LatentN::new(idx as u64),
                };

                self.lucas_windows.push(window);
                start += lucas_value;
            }
        }
    }

    /// Find Lucas window containing current bar
    fn find_lucas_window(&self, bar_idx: usize) -> Result<LucasWindow> {
        self.lucas_windows.iter()
            .find(|w| bar_idx >= w.start_bar && bar_idx < w.end_bar)
            .cloned()
            .ok_or_else(|| anyhow!("No Lucas window found for bar {}", bar_idx))
    }

    /// Encode market state as Latent-N
    fn encode_market_state(&self, bar_idx: usize) -> Result<LatentN> {
        let bar = &self.data[bar_idx];

        // Use price volatility to determine Latent-N index
        let volatility = (bar.high - bar.low) / bar.close;

        // Map volatility to Fibonacci index (0-93)
        let n = (volatility * 1000.0) as u64 % 94;

        Ok(LatentN::new(n))
    }

    /// Evaluate trade opportunity using φ-game theory
    fn evaluate_trade(
        &mut self,
        bar_idx: usize,
        bar: &OHLCV,
        latent_state: &LatentN,
        lucas_window: &LucasWindow,
    ) -> Result<String> {
        if !self.config.use_phi_game_theory {
            return Ok("hold".to_string());
        }

        let fib_levels = self.fib_levels.as_ref()
            .ok_or_else(|| anyhow!("Fibonacci levels not calculated"))?;

        // Check if price is near Fibonacci support/resistance
        let at_support = fib_levels.support.iter()
            .any(|&level| (bar.close - level).abs() / bar.close < 0.01);

        let at_resistance = fib_levels.resistance.iter()
            .any(|&level| (bar.close - level).abs() / bar.close < 0.01);

        // Check if at Lucas window boundary (good entry/exit timing)
        let at_lucas_boundary = latent_state.is_lucas_boundary() ||
                                bar_idx == lucas_window.start_bar ||
                                bar_idx == lucas_window.end_bar - 1;

        // Build context for φ-game theory decision
        let context = if self.positions.is_empty() {
            // No position - consider entry
            if at_support && at_lucas_boundary {
                format!("trade_entry:direction=long,fib_level=support,lucas_boundary=true,latent_n={}", latent_state.n)
            } else if at_resistance && at_lucas_boundary {
                format!("trade_entry:direction=short,fib_level=resistance,lucas_boundary=true,latent_n={}", latent_state.n)
            } else {
                return Ok("hold".to_string());
            }
        } else {
            // Has position - consider exit
            let position = &self.positions[0];
            let profit_pct = (bar.close - position.entry_price) / position.entry_price * position.direction as f64;

            if profit_pct > 0.02 || profit_pct < -0.01 {
                format!("trade_exit:profit={:.2},lucas_boundary={},latent_n={}", profit_pct, at_lucas_boundary, latent_state.n)
            } else {
                return Ok("hold".to_string());
            }
        };

        // Use φ-game theory to decide
        let action = self.phi_game.decide(&context)?;

        Ok(action)
    }

    /// Enter long position
    fn enter_long(
        &mut self,
        bar: &OHLCV,
        latent_state: LatentN,
        lucas_window: LucasWindow,
    ) -> Result<()> {
        if self.positions.len() >= self.config.max_positions {
            return Ok(());
        }

        let risk_amount = self.capital * self.config.risk_per_trade;
        let position_size = risk_amount / bar.close;

        // Apply slippage and commission
        let entry_price = bar.close * (1.0 + self.config.slippage);
        let cost = position_size * entry_price * (1.0 + self.config.commission);

        if cost > self.capital {
            return Ok(()); // Not enough capital
        }

        let fib_level = self.fib_levels.as_ref()
            .and_then(|f| f.support.first().copied())
            .unwrap_or(0.0);

        let trade = Trade {
            entry_time: bar.timestamp,
            exit_time: bar.timestamp, // Will be updated on exit
            entry_price,
            exit_price: 0.0,
            size: position_size,
            direction: 1, // Long
            pnl: 0.0,
            entry_fib_level: fib_level,
            lucas_window: lucas_window.clone(),
            entry_latent_state: latent_state,
            phi_action: "enter_long".to_string(),
        };

        self.capital -= cost;
        self.positions.push(trade);

        Ok(())
    }

    /// Enter short position
    fn enter_short(
        &mut self,
        bar: &OHLCV,
        latent_state: LatentN,
        lucas_window: LucasWindow,
    ) -> Result<()> {
        if self.positions.len() >= self.config.max_positions {
            return Ok(());
        }

        let risk_amount = self.capital * self.config.risk_per_trade;
        let position_size = risk_amount / bar.close;

        // Apply slippage and commission
        let entry_price = bar.close * (1.0 - self.config.slippage);
        let margin = position_size * entry_price * 0.5; // 50% margin
        let cost = margin + (position_size * entry_price * self.config.commission);

        if cost > self.capital {
            return Ok(());
        }

        let fib_level = self.fib_levels.as_ref()
            .and_then(|f| f.resistance.first().copied())
            .unwrap_or(0.0);

        let trade = Trade {
            entry_time: bar.timestamp,
            exit_time: bar.timestamp,
            entry_price,
            exit_price: 0.0,
            size: position_size,
            direction: -1, // Short
            pnl: 0.0,
            entry_fib_level: fib_level,
            lucas_window: lucas_window.clone(),
            entry_latent_state: latent_state,
            phi_action: "enter_short".to_string(),
        };

        self.capital -= cost;
        self.positions.push(trade);

        Ok(())
    }

    /// Exit all positions
    fn exit_positions(&mut self, bar: &OHLCV) -> Result<()> {
        for mut position in self.positions.drain(..) {
            // Apply slippage and commission
            let exit_price = if position.direction == 1 {
                bar.close * (1.0 - self.config.slippage)
            } else {
                bar.close * (1.0 + self.config.slippage)
            };

            let pnl = (exit_price - position.entry_price) * position.size * position.direction as f64;
            let commission_cost = position.size * exit_price * self.config.commission;

            position.exit_time = bar.timestamp;
            position.exit_price = exit_price;
            position.pnl = pnl - commission_cost;

            self.capital += position.pnl;

            if position.direction == 1 {
                self.capital += position.size * exit_price; // Return long capital
            } else {
                self.capital += position.size * position.entry_price * 0.5; // Return short margin
            }

            self.trades.push(position);
        }

        Ok(())
    }

    /// Calculate backtest results
    fn calculate_results(&self) -> Result<BacktestResults> {
        let total_trades = self.trades.len();

        if total_trades == 0 {
            return Ok(BacktestResults {
                total_trades: 0,
                winning_trades: 0,
                losing_trades: 0,
                win_rate: 0.0,
                total_pnl: 0.0,
                avg_win: 0.0,
                avg_loss: 0.0,
                profit_factor: 0.0,
                max_drawdown: 0.0,
                sharpe_ratio: 0.0,
                final_capital: self.capital,
                total_return: 0.0,
                trades: Vec::new(),
                equity_curve: self.equity_curve.clone(),
            });
        }

        let winning_trades = self.trades.iter().filter(|t| t.pnl > 0.0).count();
        let losing_trades = self.trades.iter().filter(|t| t.pnl <= 0.0).count();

        let win_rate = winning_trades as f64 / total_trades as f64;

        let total_pnl: f64 = self.trades.iter().map(|t| t.pnl).sum();

        let gross_profit: f64 = self.trades.iter()
            .filter(|t| t.pnl > 0.0)
            .map(|t| t.pnl)
            .sum();

        let gross_loss: f64 = self.trades.iter()
            .filter(|t| t.pnl < 0.0)
            .map(|t| t.pnl.abs())
            .sum();

        let avg_win = if winning_trades > 0 {
            gross_profit / winning_trades as f64
        } else {
            0.0
        };

        let avg_loss = if losing_trades > 0 {
            gross_loss / losing_trades as f64
        } else {
            0.0
        };

        let profit_factor = if gross_loss > 0.0 {
            gross_profit / gross_loss
        } else {
            0.0
        };

        // Calculate maximum drawdown
        let mut peak = self.config.initial_capital;
        let mut max_drawdown = 0.0;

        for &(_, equity) in &self.equity_curve {
            if equity > peak {
                peak = equity;
            }
            let drawdown = (peak - equity) / peak;
            if drawdown > max_drawdown {
                max_drawdown = drawdown;
            }
        }

        // Calculate Sharpe ratio (annualized)
        let returns: Vec<f64> = self.equity_curve.windows(2)
            .map(|w| (w[1].1 - w[0].1) / w[0].1)
            .collect();

        let mean_return = returns.iter().sum::<f64>() / returns.len() as f64;
        let variance = returns.iter()
            .map(|r| (r - mean_return).powi(2))
            .sum::<f64>() / returns.len() as f64;
        let std_dev = variance.sqrt();

        // Annualize (assuming daily data, 252 trading days)
        let sharpe_ratio = if std_dev > 0.0 {
            (mean_return / std_dev) * 252f64.sqrt()
        } else {
            0.0
        };

        let total_return = (self.capital - self.config.initial_capital) / self.config.initial_capital;

        Ok(BacktestResults {
            total_trades,
            winning_trades,
            losing_trades,
            win_rate,
            total_pnl,
            avg_win,
            avg_loss,
            profit_factor,
            max_drawdown,
            sharpe_ratio,
            final_capital: self.capital,
            total_return,
            trades: self.trades.clone(),
            equity_curve: self.equity_curve.clone(),
        })
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/// Calculate φ-optimal position size using Kelly criterion
pub fn calculate_optimal_position_size(
    win_rate: f64,
    avg_win: f64,
    avg_loss: f64,
) -> f64 {
    if avg_loss == 0.0 {
        return 0.0;
    }

    let win_loss_ratio = avg_win / avg_loss;

    // Kelly formula: f* = (p * b - q) / b
    // where p = win rate, q = 1 - p, b = win/loss ratio
    let kelly = (win_rate * win_loss_ratio - (1.0 - win_rate)) / win_loss_ratio;

    // Use fractional Kelly (0.25) for safety
    (kelly * 0.25).max(0.0).min(0.1)
}

/// Find nearest Fibonacci level to price
pub fn find_nearest_fibonacci_level(
    price: f64,
    fib_levels: &FibonacciLevels,
) -> (f64, &str) {
    let mut min_distance = f64::MAX;
    let mut nearest_level = 0.0;
    let mut level_type = "unknown";

    for &level in &fib_levels.support {
        let distance = (price - level).abs();
        if distance < min_distance {
            min_distance = distance;
            nearest_level = level;
            level_type = "support";
        }
    }

    for &level in &fib_levels.resistance {
        let distance = (price - level).abs();
        if distance < min_distance {
            min_distance = distance;
            nearest_level = level;
            level_type = "resistance";
        }
    }

    (nearest_level, level_type)
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    fn create_test_data() -> Vec<OHLCV> {
        vec![
            OHLCV {
                timestamp: Utc.with_ymd_and_hms(2024, 1, 1, 0, 0, 0).unwrap(),
                open: 100.0,
                high: 105.0,
                low: 99.0,
                close: 103.0,
                volume: 1000.0,
            },
            OHLCV {
                timestamp: Utc.with_ymd_and_hms(2024, 1, 2, 0, 0, 0).unwrap(),
                open: 103.0,
                high: 108.0,
                low: 102.0,
                close: 107.0,
                volume: 1200.0,
            },
            OHLCV {
                timestamp: Utc.with_ymd_and_hms(2024, 1, 3, 0, 0, 0).unwrap(),
                open: 107.0,
                high: 110.0,
                low: 105.0,
                close: 106.0,
                volume: 900.0,
            },
        ]
    }

    #[test]
    fn test_fibonacci_levels() {
        let data = create_test_data();
        let config = BacktestConfig::default();
        let mut engine = BacktestEngine::new(data, config);

        engine.calculate_fibonacci_levels(2).unwrap();

        assert!(engine.fib_levels.is_some());
        let levels = engine.fib_levels.unwrap();

        assert_eq!(levels.swing_high, 110.0);
        assert_eq!(levels.swing_low, 99.0);
        assert_eq!(levels.support.len(), 4);
        assert_eq!(levels.resistance.len(), 4);
    }

    #[test]
    fn test_lucas_windows() {
        let data = (0..100)
            .map(|i| OHLCV {
                timestamp: Utc.with_ymd_and_hms(2024, 1, 1, 0, 0, 0).unwrap(),
                open: 100.0 + i as f64,
                high: 105.0 + i as f64,
                low: 99.0 + i as f64,
                close: 103.0 + i as f64,
                volume: 1000.0,
            })
            .collect();

        let config = BacktestConfig::default();
        let mut engine = BacktestEngine::new(data, config);

        engine.identify_lucas_windows();

        assert!(!engine.lucas_windows.is_empty());

        // Verify windows use Lucas numbers
        for window in &engine.lucas_windows {
            let window_size = window.end_bar - window.start_bar;
            assert_eq!(window_size, window.lucas_value as usize);
        }
    }

    #[test]
    fn test_latent_n_encoding() {
        let data = create_test_data();
        let config = BacktestConfig::default();
        let engine = BacktestEngine::new(data, config);

        let latent_state = engine.encode_market_state(1).unwrap();

        assert!(latent_state.n < 94);

        let universe = latent_state.decode();
        assert!(universe.energy > 0);
        assert!(universe.time > 0);
    }

    #[test]
    fn test_kelly_criterion() {
        let position_size = calculate_optimal_position_size(0.6, 2.0, 1.0);
        assert!(position_size > 0.0);
        assert!(position_size <= 0.1); // Capped at 10%
    }
}

//! Core types and structures for Webull integration

use chrono::{DateTime, Utc};
use phi_core::LatentN;
use serde::{Deserialize, Serialize};

/// Trade action (Buy or Sell)
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "UPPERCASE")]
pub enum Action {
    Buy,
    Sell,
}

/// Order type
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum OrderType {
    Market,
    Limit,
    Stop,
    StopLimit,
}

/// Order status
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum OrderStatus {
    Pending,
    Submitted,
    PartiallyFilled,
    Filled,
    Cancelled,
    Rejected,
    Expired,
}

/// Time in force
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum TimeInForce {
    Day,
    GTC,  // Good Till Cancelled
    IOC,  // Immediate Or Cancel
    FOK,  // Fill Or Kill
}

/// Option contract details
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptionContract {
    /// Underlying symbol (e.g., "AAPL")
    pub symbol: String,

    /// Strike price
    pub strike: f64,

    /// Expiration date (Lucas-indexed)
    pub expiration: DateTime<Utc>,

    /// Option type (Call/Put)
    pub option_type: OptionType,

    /// Latent-N encoding of contract
    pub latent_state: LatentN,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum OptionType {
    Call,
    Put,
}

/// Option order with Fibonacci-based entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptionOrder {
    /// Option contract details
    pub contract: OptionContract,

    /// Buy or Sell action
    pub action: Action,

    /// Number of contracts
    pub quantity: u64,

    /// Order type
    pub order_type: OrderType,

    /// Limit price (if applicable)
    pub limit_price: Option<f64>,

    /// Stop price (if applicable)
    pub stop_price: Option<f64>,

    /// Time in force
    pub time_in_force: TimeInForce,

    /// Fibonacci level for entry (0.236, 0.382, 0.5, 0.618, 0.786)
    pub fibonacci_level: f64,

    /// Latent-N encoding of order state
    pub latent_state: LatentN,

    /// Order ID (assigned by Webull)
    pub order_id: Option<String>,

    /// Order status
    pub status: OrderStatus,

    /// Timestamp
    pub timestamp: DateTime<Utc>,
}

/// Market data quote
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Quote {
    /// Symbol
    pub symbol: String,

    /// Last price
    pub price: f64,

    /// Bid price
    pub bid: f64,

    /// Ask price
    pub ask: f64,

    /// Volume
    pub volume: u64,

    /// Timestamp
    pub timestamp: DateTime<Utc>,

    /// Latent-N encoding of quote
    pub latent_state: LatentN,
}

/// Position information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    /// Symbol or contract
    pub symbol: String,

    /// Quantity held
    pub quantity: i64,  // Negative for short positions

    /// Average entry price
    pub avg_price: f64,

    /// Current market price
    pub current_price: f64,

    /// Unrealized P&L
    pub unrealized_pnl: f64,

    /// Realized P&L
    pub realized_pnl: f64,

    /// Position type
    pub position_type: PositionType,

    /// Latent-N encoding of position
    pub latent_state: LatentN,

    /// Last update timestamp
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum PositionType {
    Stock,
    Option,
    Future,
    Forex,
}

/// Latency measurement
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LatencyMetrics {
    /// Request timestamp
    pub request_time: DateTime<Utc>,

    /// Response timestamp
    pub response_time: DateTime<Utc>,

    /// Latency in microseconds
    pub latency_us: u64,

    /// Operation type
    pub operation: String,

    /// Whether latency meets <10ms target
    pub meets_target: bool,

    /// Latent-N encoding of metrics
    pub latent_state: LatentN,
}

/// Trade suggestion from AI
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeSuggestion {
    /// Suggested order
    pub order: OptionOrder,

    /// Confidence score (0.0 - 1.0)
    pub confidence: f64,

    /// Reasoning/explanation
    pub reasoning: String,

    /// Risk assessment
    pub risk_level: RiskLevel,

    /// Expected return
    pub expected_return: f64,

    /// Fibonacci-based technical levels
    pub fib_levels: Vec<f64>,

    /// Latent-N encoding of suggestion
    pub latent_state: LatentN,

    /// Timestamp
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Extreme,
}

/// User approval for co-trading
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TradeApproval {
    /// Suggestion ID
    pub suggestion_id: String,

    /// Approved or rejected
    pub approved: bool,

    /// Modified order (if user changed parameters)
    pub modified_order: Option<OptionOrder>,

    /// User comments
    pub comments: Option<String>,

    /// Timestamp
    pub timestamp: DateTime<Utc>,
}

/// Trading mode
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum TradingMode {
    /// Paper trading (simulated)
    Paper,

    /// Live trading with co-pilot (AI suggestions + human approval)
    CoPilot,

    /// Fully autonomous (AI only, requires explicit user consent)
    Autonomous,
}

/// Account information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AccountInfo {
    /// Account ID
    pub account_id: String,

    /// Account type
    pub account_type: String,

    /// Total equity
    pub equity: f64,

    /// Buying power
    pub buying_power: f64,

    /// Cash balance
    pub cash: f64,

    /// Margin used
    pub margin_used: f64,

    /// Day trades remaining
    pub day_trades_remaining: Option<u32>,

    /// Latent-N encoding of account state
    pub latent_state: LatentN,
}

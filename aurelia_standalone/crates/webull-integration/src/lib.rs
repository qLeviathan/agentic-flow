//! Webull API Integration for AURELIA Live/Co-Trading
//!
//! This crate provides comprehensive integration with the Webull trading platform,
//! featuring:
//! - Authentication with Webull API
//! - Real-time market data fetching
//! - Options order placement with Fibonacci-based entry levels
//! - Position monitoring and tracking
//! - Latency tracking (<10ms target)
//! - Latent-N encoding for all data structures
//! - Co-trading mode (AI suggestions + human approval)
//! - Paper trading mode for testing
//!
//! # Architecture
//!
//! All data structures are encoded using AURELIA's Latent-N universe encoding:
//! - Energy: F[n] (Fibonacci sequence)
//! - Time: L[n] (Lucas sequence)
//! - Direction: (-1)^n (forward/backward, retrocausal)
//!
//! # Trading Modes
//!
//! - **Paper**: Simulated trading for testing (no real money)
//! - **CoPilot**: AI suggestions with mandatory human approval
//! - **Autonomous**: Fully AI-driven (requires explicit user consent)
//!
//! # Example Usage
//!
//! ```rust,no_run
//! use webull_integration::*;
//!
//! #[tokio::main]
//! async fn main() -> anyhow::Result<()> {
//!     // Load credentials from environment
//!     let credentials = auth::Credentials::from_env()?;
//!
//!     // Create Webull client
//!     let client = WebullClient::new(credentials, types::TradingMode::CoPilot).await?;
//!
//!     // Get market data
//!     let quote = client.get_market_data("AAPL").await?;
//!     println!("AAPL: ${:.2}", quote.price);
//!
//!     // Generate trade suggestion
//!     let suggestion = client.suggest_trade("AAPL", types::Action::Buy).await?;
//!     println!("AI suggests: {}", suggestion.reasoning);
//!
//!     // User approves trade
//!     let approval = types::TradeApproval {
//!         suggestion_id: "suggestion-id".to_string(),
//!         approved: true,
//!         modified_order: None,
//!         comments: Some("Looks good!".to_string()),
//!         timestamp: chrono::Utc::now(),
//!     };
//!
//!     let order = client.confirm_with_user(approval).await?;
//!     println!("Order placed: {:?}", order);
//!
//!     Ok(())
//! }
//! ```

pub mod auth;
pub mod market_data;
pub mod orders;
pub mod positions;
pub mod latency;
pub mod co_trading;
pub mod types;

use anyhow::{Context, Result};
use phi_core::LatentN;
use reqwest::Client;
use std::sync::Arc;
use tokio::sync::RwLock;
use tracing::{info, warn};

pub use auth::{Credentials, Session};
pub use types::{
    Action, OptionOrder, OptionContract, Quote, Position,
    TradeSuggestion, TradeApproval, TradingMode, AccountInfo,
};

/// Main Webull client for AURELIA integration
pub struct WebullClient {
    /// HTTP client for API requests
    client: Client,

    /// Authentication session
    session: Arc<RwLock<Session>>,

    /// Authentication handler
    auth: auth::WebullAuth,

    /// Market data provider
    market_data: Arc<market_data::MarketDataProvider>,

    /// Order manager
    order_manager: Arc<orders::OrderManager>,

    /// Position tracker
    position_tracker: Arc<positions::PositionTracker>,

    /// Latency tracker
    pub latency_tracker: Arc<latency::LatencyTracker>,

    /// Co-trading coordinator
    co_trading: Arc<co_trading::CoTradingCoordinator>,

    /// Trading mode
    trading_mode: TradingMode,
}

impl WebullClient {
    /// Create new Webull client and authenticate
    pub async fn new(credentials: Credentials, trading_mode: TradingMode) -> Result<Self> {
        info!("Initializing Webull client in {:?} mode", trading_mode);

        let client = Client::builder()
            .cookie_store(true)
            .user_agent("AURELIA/2.0.0")
            .timeout(std::time::Duration::from_secs(30))
            .build()
            .context("Failed to create HTTP client")?;

        // Authenticate
        let auth = auth::WebullAuth::new(credentials)?;
        let session = auth.authenticate().await
            .context("Failed to authenticate with Webull")?;

        let session = Arc::new(RwLock::new(session));

        // Initialize components
        let latency_tracker = Arc::new(latency::LatencyTracker::new());

        let session_clone = session.read().await.clone();
        let market_data = Arc::new(market_data::MarketDataProvider::new(
            client.clone(),
            session_clone.clone(),
        ));

        let order_manager = Arc::new(orders::OrderManager::new(
            client.clone(),
            session_clone.clone(),
            trading_mode,
        ));

        let position_tracker = Arc::new(positions::PositionTracker::new(
            client.clone(),
            session_clone.clone(),
        ));

        let co_trading = Arc::new(co_trading::CoTradingCoordinator::new(
            (*market_data).clone(),
            (*order_manager).clone(),
            trading_mode,
        ));

        info!("Webull client initialized successfully");

        Ok(Self {
            client,
            session,
            auth,
            market_data,
            order_manager,
            position_tracker,
            latency_tracker,
            co_trading,
            trading_mode,
        })
    }

    /// Authenticate with Webull API
    pub async fn authenticate(&mut self) -> Result<()> {
        let timer = self.latency_tracker.start();

        let new_session = self.auth.authenticate().await?;

        let mut session = self.session.write().await;
        *session = new_session;

        self.latency_tracker.record("authenticate".to_string(), timer.stop()).await;

        info!("Re-authenticated successfully");
        Ok(())
    }

    /// Get real-time market data for symbol
    pub async fn get_market_data(&self, symbol: &str) -> Result<Quote> {
        let timer = self.latency_tracker.start();

        self.check_session().await?;

        let quote = self.market_data.get_quote(symbol).await?;

        self.latency_tracker.record("get_market_data".to_string(), timer.stop()).await;

        Ok(quote)
    }

    /// Place an option order
    pub async fn place_option_order(&self, order: OptionOrder) -> Result<OptionOrder> {
        let timer = self.latency_tracker.start();

        self.check_session().await?;

        let placed_order = self.order_manager.place_option_order(order).await?;

        let latency = timer.stop();
        self.latency_tracker.record("place_option_order".to_string(), latency).await;

        Ok(placed_order)
    }

    /// Get current positions
    pub async fn get_positions(&self) -> Result<Vec<Position>> {
        let timer = self.latency_tracker.start();

        self.check_session().await?;

        let positions = self.position_tracker.get_positions().await?;

        self.latency_tracker.record("get_positions".to_string(), timer.stop()).await;

        Ok(positions)
    }

    /// Calculate trade execution latency
    pub async fn calculate_latency(&self) -> Result<f64> {
        let stats = self.latency_tracker.get_stats().await;
        Ok(stats.avg_latency_us as f64 / 1000.0) // Convert to milliseconds
    }

    /// Encode data to Latent-N format
    pub fn encode_to_latent_n(&self, value: u64) -> LatentN {
        LatentN::new(value)
    }

    /// Generate AI trade suggestion (co-trading mode)
    pub async fn suggest_trade(&self, symbol: &str, action: Action) -> Result<TradeSuggestion> {
        let timer = self.latency_tracker.start();

        self.check_session().await?;

        let suggestion = self.co_trading.suggest_trade(symbol, action).await?;

        self.latency_tracker.record("suggest_trade".to_string(), timer.stop()).await;

        Ok(suggestion)
    }

    /// Process user approval/rejection of trade suggestion
    pub async fn confirm_with_user(&self, approval: TradeApproval) -> Result<Option<OptionOrder>> {
        let timer = self.latency_tracker.start();

        let result = self.co_trading.process_approval(approval).await?;

        self.latency_tracker.record("confirm_with_user".to_string(), timer.stop()).await;

        Ok(result)
    }

    /// Execute approved order (internal use by confirm_with_user)
    pub async fn execute_approved(&self, order: OptionOrder) -> Result<OptionOrder> {
        self.place_option_order(order).await
    }

    /// Get latency statistics
    pub async fn get_latency_stats(&self) -> latency::LatencyStats {
        self.latency_tracker.get_stats().await
    }

    /// Check if system is meeting latency targets
    pub async fn is_latency_healthy(&self) -> bool {
        self.latency_tracker.is_healthy().await
    }

    /// Check and refresh session if needed
    async fn check_session(&self) -> Result<()> {
        let session = self.session.read().await;

        if session.needs_refresh() {
            drop(session); // Release read lock

            warn!("Session expiring soon, refreshing...");

            let old_session = self.session.read().await.clone();
            let new_session = self.auth.refresh_session(&old_session).await?;

            let mut session_write = self.session.write().await;
            *session_write = new_session;

            info!("Session refreshed successfully");
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_latent_n_encoding() {
        let value = 12345u64;
        let latent = LatentN::new(value);

        assert_eq!(latent.n, 12345);

        let universe = latent.decode();
        assert!(universe.energy > 0);
        assert!(universe.time > 0);
    }
}

//! Co-trading mode: AI suggestions with human approval

use anyhow::{Context, Result};
use chrono::Utc;
use phi_core::{LatentN, FIBONACCI, LUCAS};
use std::collections::HashMap;
use tokio::sync::RwLock;
use tracing::{debug, info, warn};
use uuid::Uuid;

use crate::types::{
    TradeSuggestion, TradeApproval, OptionOrder, RiskLevel,
    Action, OrderType, TimeInForce, TradingMode,
};
use crate::market_data::MarketDataProvider;
use crate::orders::OrderManager;

/// Co-trading coordinator
pub struct CoTradingCoordinator {
    market_data: MarketDataProvider,
    order_manager: OrderManager,
    pending_suggestions: RwLock<HashMap<String, TradeSuggestion>>,
    trading_mode: TradingMode,
}

impl CoTradingCoordinator {
    /// Create new co-trading coordinator
    pub fn new(
        market_data: MarketDataProvider,
        order_manager: OrderManager,
        trading_mode: TradingMode,
    ) -> Self {
        Self {
            market_data,
            order_manager,
            pending_suggestions: RwLock::new(HashMap::new()),
            trading_mode,
        }
    }

    /// Generate trade suggestion using AI analysis
    pub async fn suggest_trade(
        &self,
        symbol: &str,
        action: Action,
    ) -> Result<TradeSuggestion> {
        info!("Generating trade suggestion for {} ({})", symbol,
            if matches!(action, Action::Buy) { "BUY" } else { "SELL" });

        // Get current market data
        let quote = self.market_data.get_quote(symbol).await?;

        // Get option chain
        let options = self.market_data.get_option_chain(symbol, None).await?;

        if options.is_empty() {
            anyhow::bail!("No options available for {}", symbol);
        }

        // Analyze using Fibonacci levels and Latent-N encoding
        let analysis = self.analyze_trade_opportunity(&quote, &options, action).await?;

        // Create suggestion
        let suggestion_id = Uuid::new_v4().to_string();

        let suggestion = TradeSuggestion {
            order: analysis.recommended_order,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning,
            risk_level: analysis.risk_level,
            expected_return: analysis.expected_return,
            fib_levels: analysis.fib_levels,
            latent_state: LatentN::new((analysis.confidence * 1000.0) as u64),
            timestamp: Utc::now(),
        };

        // Store suggestion
        let mut pending = self.pending_suggestions.write().await;
        pending.insert(suggestion_id, suggestion.clone());

        info!("Generated suggestion: {} confidence, {} risk, {:.2}% expected return",
            suggestion.confidence,
            format!("{:?}", suggestion.risk_level).to_lowercase(),
            suggestion.expected_return * 100.0
        );

        Ok(suggestion)
    }

    /// Process user approval/rejection of trade suggestion
    pub async fn process_approval(&self, approval: TradeApproval) -> Result<Option<OptionOrder>> {
        debug!("Processing approval for suggestion {}", approval.suggestion_id);

        // Get the suggestion
        let suggestion = {
            let pending = self.pending_suggestions.read().await;
            pending.get(&approval.suggestion_id).cloned()
        };

        let suggestion = match suggestion {
            Some(s) => s,
            None => anyhow::bail!("Suggestion not found: {}", approval.suggestion_id),
        };

        if !approval.approved {
            info!("Trade suggestion {} rejected by user", approval.suggestion_id);

            // Remove from pending
            let mut pending = self.pending_suggestions.write().await;
            pending.remove(&approval.suggestion_id);

            return Ok(None);
        }

        info!("Trade suggestion {} approved by user", approval.suggestion_id);

        // Use modified order if provided, otherwise use original
        let order = approval.modified_order.unwrap_or(suggestion.order);

        // Place the order
        let placed_order = self.order_manager.place_option_order(order).await
            .context("Failed to place approved order")?;

        // Remove from pending
        let mut pending = self.pending_suggestions.write().await;
        pending.remove(&approval.suggestion_id);

        Ok(Some(placed_order))
    }

    /// Get all pending suggestions
    pub async fn get_pending_suggestions(&self) -> Vec<TradeSuggestion> {
        let pending = self.pending_suggestions.read().await;
        pending.values().cloned().collect()
    }

    /// Automatically execute suggestion (for autonomous mode)
    pub async fn execute_autonomous(&self, suggestion: TradeSuggestion) -> Result<OptionOrder> {
        if !matches!(self.trading_mode, TradingMode::Autonomous) {
            anyhow::bail!("Autonomous execution only available in Autonomous mode");
        }

        warn!("AUTONOMOUS EXECUTION: Placing order without human approval");

        // Additional safety checks for autonomous mode
        if suggestion.risk_level == RiskLevel::Extreme {
            anyhow::bail!("Refusing to execute extreme risk trade autonomously");
        }

        if suggestion.confidence < 0.75 {
            anyhow::bail!("Confidence too low for autonomous execution: {}", suggestion.confidence);
        }

        // Place order
        let order = self.order_manager.place_option_order(suggestion.order).await?;

        info!("Autonomous order placed: {:?}", order.order_id);

        Ok(order)
    }

    /// Analyze trade opportunity using Fibonacci and Latent-N
    async fn analyze_trade_opportunity(
        &self,
        quote: &crate::types::Quote,
        options: &[crate::types::OptionContract],
        action: Action,
    ) -> Result<TradeAnalysis> {
        // Calculate Fibonacci retracement levels
        let price = quote.price;
        let fib_levels = vec![
            price * 0.236,
            price * 0.382,
            price * 0.5,
            price * 0.618,
            price * 0.786,
        ];

        // Find best option contract based on Fibonacci levels
        let best_contract = self.find_optimal_contract(options, &fib_levels, action)?;

        // Calculate confidence using Latent-N encoding
        let latent_state = quote.latent_state.decode();
        let confidence = self.calculate_confidence(&latent_state);

        // Assess risk
        let risk_level = self.assess_risk(confidence, price, &best_contract);

        // Calculate expected return (simplified)
        let expected_return = match action {
            Action::Buy => 0.15,  // 15% expected return on buy
            Action::Sell => 0.08, // 8% expected return on sell
        };

        // Build recommended order
        let order = OptionOrder {
            contract: best_contract.clone(),
            action,
            quantity: self.calculate_position_size(risk_level),
            order_type: OrderType::Limit,
            limit_price: Some(fib_levels[2]), // Use 0.5 Fibonacci level
            stop_price: None,
            time_in_force: TimeInForce::Day,
            fibonacci_level: 0.5,
            latent_state: quote.latent_state,
            order_id: None,
            status: crate::types::OrderStatus::Pending,
            timestamp: Utc::now(),
        };

        Ok(TradeAnalysis {
            recommended_order: order,
            confidence,
            reasoning: format!(
                "Based on Fibonacci analysis: Price at ${:.2}, optimal entry at ${:.2} (0.5 level). \
                Latent-N energy: {}, time: {}. Pattern suggests {} with {} risk.",
                price, fib_levels[2], latent_state.energy, latent_state.time,
                if matches!(action, Action::Buy) { "bullish momentum" } else { "bearish momentum" },
                format!("{:?}", risk_level).to_lowercase()
            ),
            risk_level,
            expected_return,
            fib_levels,
        })
    }

    /// Find optimal option contract
    fn find_optimal_contract(
        &self,
        options: &[crate::types::OptionContract],
        fib_levels: &[f64],
        _action: Action,
    ) -> Result<crate::types::OptionContract> {
        // Find contract with strike closest to 0.618 Fibonacci level
        let target_strike = fib_levels[3]; // 0.618 level

        options.iter()
            .min_by(|a, b| {
                let diff_a = (a.strike - target_strike).abs();
                let diff_b = (b.strike - target_strike).abs();
                diff_a.partial_cmp(&diff_b).unwrap()
            })
            .cloned()
            .context("No suitable option contract found")
    }

    /// Calculate confidence score from Latent-N universe state
    fn calculate_confidence(&self, universe: &phi_core::latent_n::UniverseState) -> f64 {
        // Use energy/time ratio to calculate confidence
        let ratio = universe.energy as f64 / universe.time.max(1) as f64;

        // Normalize to 0.0-1.0 range
        let confidence = (ratio / 1.618).min(1.0).max(0.0);

        // Adjust based on phi-level (higher levels = more confidence)
        let phi_adjustment = (universe.phi_level as f64 / 10.0).min(0.2);

        (confidence + phi_adjustment).min(1.0)
    }

    /// Assess risk level
    fn assess_risk(
        &self,
        confidence: f64,
        price: f64,
        _contract: &crate::types::OptionContract,
    ) -> RiskLevel {
        if confidence < 0.5 {
            RiskLevel::Extreme
        } else if confidence < 0.65 {
            RiskLevel::High
        } else if confidence < 0.8 || price > 500.0 {
            RiskLevel::Medium
        } else {
            RiskLevel::Low
        }
    }

    /// Calculate position size based on risk
    fn calculate_position_size(&self, risk_level: RiskLevel) -> u64 {
        match risk_level {
            RiskLevel::Low => 10,
            RiskLevel::Medium => 5,
            RiskLevel::High => 2,
            RiskLevel::Extreme => 1,
        }
    }
}

/// Trade analysis result
struct TradeAnalysis {
    recommended_order: OptionOrder,
    confidence: f64,
    reasoning: String,
    risk_level: RiskLevel,
    expected_return: f64,
    fib_levels: Vec<f64>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fibonacci_levels() {
        let price = 100.0;
        let fib_levels = vec![
            price * 0.236,
            price * 0.382,
            price * 0.5,
            price * 0.618,
            price * 0.786,
        ];

        assert_eq!(fib_levels[0], 23.6);
        assert_eq!(fib_levels[4], 78.6);
    }

    #[test]
    fn test_position_sizing() {
        let coordinator = CoTradingCoordinator {
            market_data: unimplemented!(),
            order_manager: unimplemented!(),
            pending_suggestions: RwLock::new(HashMap::new()),
            trading_mode: TradingMode::CoPilot,
        };

        assert_eq!(coordinator.calculate_position_size(RiskLevel::Low), 10);
        assert_eq!(coordinator.calculate_position_size(RiskLevel::Extreme), 1);
    }
}

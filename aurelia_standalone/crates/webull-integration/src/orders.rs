//! Order placement and management

use anyhow::{Context, Result};
use chrono::Utc;
use phi_core::{LatentN, FIBONACCI};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tracing::{debug, info, warn};
use uuid::Uuid;

use crate::auth::Session;
use crate::types::{
    Action, OptionOrder, OrderStatus, OrderType, TimeInForce,
    OptionContract, TradingMode,
};

const WEBULL_ORDER_URL: &str = "https://tradeapi.webull.com/api/trade/order";
const WEBULL_ORDER_STATUS_URL: &str = "https://tradeapi.webull.com/api/trade/order/status";

/// Order manager for placing and tracking orders
pub struct OrderManager {
    client: Client,
    session: Session,
    trading_mode: TradingMode,
}

impl OrderManager {
    /// Create new order manager
    pub fn new(client: Client, session: Session, trading_mode: TradingMode) -> Self {
        Self {
            client,
            session,
            trading_mode,
        }
    }

    /// Place an option order
    pub async fn place_option_order(&self, mut order: OptionOrder) -> Result<OptionOrder> {
        info!("Placing {} option order for {} contracts of {}",
            if matches!(order.action, Action::Buy) { "BUY" } else { "SELL" },
            order.quantity,
            order.contract.symbol
        );

        // Validate order parameters
        self.validate_order(&order)?;

        // Calculate Fibonacci-based entry if needed
        if order.limit_price.is_none() && order.order_type == OrderType::Limit {
            order.limit_price = Some(self.calculate_fib_entry(&order.contract, order.fibonacci_level).await?);
        }

        // Check trading mode
        match self.trading_mode {
            TradingMode::Paper => {
                return self.place_paper_order(order).await;
            }
            TradingMode::CoPilot | TradingMode::Autonomous => {
                // Continue with live order
            }
        }

        // Build order payload
        let order_payload = self.build_order_payload(&order)?;

        // Submit order to Webull
        let response = self.client
            .post(WEBULL_ORDER_URL)
            .header("Authorization", format!("Bearer {}", self.session.access_token))
            .json(&order_payload)
            .send()
            .await
            .context("Failed to submit order")?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Order placement failed: {}", error_text);
        }

        let order_response: OrderResponse = response.json().await
            .context("Failed to parse order response")?;

        // Update order with response data
        order.order_id = Some(order_response.order_id.clone());
        order.status = OrderStatus::Submitted;
        order.timestamp = Utc::now();

        info!("Order placed successfully: {}", order_response.order_id);

        Ok(order)
    }

    /// Get order status
    pub async fn get_order_status(&self, order_id: &str) -> Result<OrderStatus> {
        debug!("Fetching status for order {}", order_id);

        let url = format!("{}?orderId={}", WEBULL_ORDER_STATUS_URL, order_id);

        let response = self.client
            .get(&url)
            .header("Authorization", format!("Bearer {}", self.session.access_token))
            .send()
            .await
            .context("Failed to fetch order status")?;

        if !response.status().is_success() {
            anyhow::bail!("Failed to get order status");
        }

        let status_response: OrderStatusResponse = response.json().await
            .context("Failed to parse status response")?;

        Ok(status_response.status)
    }

    /// Cancel an order
    pub async fn cancel_order(&self, order_id: &str) -> Result<()> {
        info!("Cancelling order {}", order_id);

        let cancel_url = format!("{}/cancel", WEBULL_ORDER_URL);
        let cancel_payload = serde_json::json!({
            "orderId": order_id,
        });

        let response = self.client
            .post(&cancel_url)
            .header("Authorization", format!("Bearer {}", self.session.access_token))
            .json(&cancel_payload)
            .send()
            .await
            .context("Failed to cancel order")?;

        if !response.status().is_success() {
            anyhow::bail!("Order cancellation failed");
        }

        info!("Order {} cancelled successfully", order_id);
        Ok(())
    }

    /// Validate order parameters
    fn validate_order(&self, order: &OptionOrder) -> Result<()> {
        // Check quantity
        if order.quantity == 0 {
            anyhow::bail!("Order quantity must be greater than 0");
        }

        // Check Fibonacci level
        if order.fibonacci_level <= 0.0 || order.fibonacci_level >= 1.0 {
            anyhow::bail!("Fibonacci level must be between 0.0 and 1.0");
        }

        // Check limit price for limit orders
        if order.order_type == OrderType::Limit && order.limit_price.is_none() {
            anyhow::bail!("Limit orders require a limit price");
        }

        // Check stop price for stop orders
        if matches!(order.order_type, OrderType::Stop | OrderType::StopLimit)
            && order.stop_price.is_none() {
            anyhow::bail!("Stop orders require a stop price");
        }

        Ok(())
    }

    /// Calculate Fibonacci-based entry price
    async fn calculate_fib_entry(
        &self,
        contract: &OptionContract,
        fib_level: f64,
    ) -> Result<f64> {
        // Use Fibonacci numbers from phi-core to calculate entry
        // This is a simplified example - real implementation would use price history

        let strike = contract.strike;
        let fib_adjustment = 1.0 + (fib_level - 0.5) * 0.1;  // ±10% adjustment

        let entry_price = strike * fib_adjustment;

        debug!("Calculated Fibonacci entry: ${:.2} at {:.3} level", entry_price, fib_level);

        Ok(entry_price)
    }

    /// Place paper trading order (simulated)
    async fn place_paper_order(&self, mut order: OptionOrder) -> Result<OptionOrder> {
        info!("PAPER TRADING: Simulating order placement");

        // Generate fake order ID
        order.order_id = Some(format!("PAPER-{}", Uuid::new_v4()));
        order.status = OrderStatus::Filled;  // Instantly "fill" paper orders
        order.timestamp = Utc::now();

        info!("PAPER ORDER FILLED: {}", order.order_id.as_ref().unwrap());

        Ok(order)
    }

    /// Build order payload for Webull API
    fn build_order_payload(&self, order: &OptionOrder) -> Result<serde_json::Value> {
        let order_type_str = match order.order_type {
            OrderType::Market => "MKT",
            OrderType::Limit => "LMT",
            OrderType::Stop => "STP",
            OrderType::StopLimit => "STP_LMT",
        };

        let action_str = match order.action {
            Action::Buy => "BUY",
            Action::Sell => "SELL",
        };

        let tif_str = match order.time_in_force {
            TimeInForce::Day => "DAY",
            TimeInForce::GTC => "GTC",
            TimeInForce::IOC => "IOC",
            TimeInForce::FOK => "FOK",
        };

        let mut payload = serde_json::json!({
            "action": action_str,
            "orderType": order_type_str,
            "quantity": order.quantity,
            "timeInForce": tif_str,
            "symbol": order.contract.symbol,
            "strike": order.contract.strike,
            "expiration": order.contract.expiration.format("%Y-%m-%d").to_string(),
            "optionType": match order.contract.option_type {
                crate::types::OptionType::Call => "CALL",
                crate::types::OptionType::Put => "PUT",
            },
        });

        if let Some(limit_price) = order.limit_price {
            payload["limitPrice"] = serde_json::json!(limit_price);
        }

        if let Some(stop_price) = order.stop_price {
            payload["stopPrice"] = serde_json::json!(stop_price);
        }

        Ok(payload)
    }
}

/// Order response from Webull
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct OrderResponse {
    order_id: String,
    #[serde(default)]
    status: OrderStatus,
}

/// Order status response
#[derive(Debug, Deserialize)]
struct OrderStatusResponse {
    status: OrderStatus,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::OptionType;

    #[test]
    fn test_fibonacci_levels() {
        let levels = vec![0.236, 0.382, 0.5, 0.618, 0.786];

        for level in levels {
            assert!(level > 0.0 && level < 1.0);
        }
    }
}

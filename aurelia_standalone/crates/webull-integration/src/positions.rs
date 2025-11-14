//! Position monitoring and tracking

use anyhow::{Context, Result};
use chrono::Utc;
use phi_core::LatentN;
use reqwest::Client;
use serde::Deserialize;
use std::collections::HashMap;
use tokio::sync::RwLock;
use tracing::{debug, info};

use crate::auth::Session;
use crate::types::{Position, PositionType};

const WEBULL_POSITIONS_URL: &str = "https://tradeapi.webull.com/api/trade/account/positions";
const WEBULL_ACCOUNT_URL: &str = "https://tradeapi.webull.com/api/trade/account";

/// Position tracker
pub struct PositionTracker {
    client: Client,
    session: Session,
    positions: RwLock<HashMap<String, Position>>,
}

impl PositionTracker {
    /// Create new position tracker
    pub fn new(client: Client, session: Session) -> Self {
        Self {
            client,
            session,
            positions: RwLock::new(HashMap::new()),
        }
    }

    /// Get all current positions
    pub async fn get_positions(&self) -> Result<Vec<Position>> {
        debug!("Fetching current positions");

        let response = self.client
            .get(WEBULL_POSITIONS_URL)
            .header("Authorization", format!("Bearer {}", self.session.access_token))
            .send()
            .await
            .context("Failed to fetch positions")?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Failed to get positions: {}", error_text);
        }

        let positions_response: PositionsResponse = response.json().await
            .context("Failed to parse positions response")?;

        let positions = self.parse_positions(positions_response)?;

        // Update cache
        let mut cache = self.positions.write().await;
        cache.clear();
        for position in &positions {
            cache.insert(position.symbol.clone(), position.clone());
        }

        info!("Retrieved {} positions", positions.len());
        Ok(positions)
    }

    /// Get position for specific symbol
    pub async fn get_position(&self, symbol: &str) -> Result<Option<Position>> {
        // Check cache first
        {
            let cache = self.positions.read().await;
            if let Some(position) = cache.get(symbol) {
                return Ok(Some(position.clone()));
            }
        }

        // Fetch fresh data
        let positions = self.get_positions().await?;
        Ok(positions.into_iter().find(|p| p.symbol == symbol))
    }

    /// Calculate total portfolio value
    pub async fn get_portfolio_value(&self) -> Result<f64> {
        let positions = self.get_positions().await?;

        let total_value: f64 = positions.iter()
            .map(|p| p.current_price * p.quantity.abs() as f64)
            .sum();

        Ok(total_value)
    }

    /// Calculate total unrealized P&L
    pub async fn get_total_pnl(&self) -> Result<(f64, f64)> {
        let positions = self.get_positions().await?;

        let unrealized: f64 = positions.iter().map(|p| p.unrealized_pnl).sum();
        let realized: f64 = positions.iter().map(|p| p.realized_pnl).sum();

        Ok((unrealized, realized))
    }

    /// Get positions filtered by type
    pub async fn get_positions_by_type(&self, position_type: PositionType) -> Result<Vec<Position>> {
        let positions = self.get_positions().await?;
        Ok(positions.into_iter()
            .filter(|p| p.position_type == position_type)
            .collect())
    }

    /// Get cached positions (without API call)
    pub async fn get_cached_positions(&self) -> Vec<Position> {
        let cache = self.positions.read().await;
        cache.values().cloned().collect()
    }

    /// Monitor position for changes
    pub async fn monitor_position(&self, symbol: &str, threshold: f64) -> Result<bool> {
        if let Some(position) = self.get_position(symbol).await? {
            let pnl_percent = (position.unrealized_pnl /
                (position.avg_price * position.quantity.abs() as f64)) * 100.0;

            if pnl_percent.abs() > threshold {
                info!("Position {} has significant P&L: {:.2}%", symbol, pnl_percent);
                return Ok(true);
            }
        }

        Ok(false)
    }

    /// Parse positions from API response
    fn parse_positions(&self, response: PositionsResponse) -> Result<Vec<Position>> {
        let mut positions = Vec::new();

        for pos_data in response.positions {
            // Encode position into Latent-N (use quantity as index)
            let latent_state = LatentN::new(pos_data.quantity.abs() as u64);

            let unrealized_pnl = (pos_data.current_price - pos_data.avg_price)
                * pos_data.quantity as f64;

            positions.push(Position {
                symbol: pos_data.symbol,
                quantity: pos_data.quantity,
                avg_price: pos_data.avg_price,
                current_price: pos_data.current_price,
                unrealized_pnl,
                realized_pnl: pos_data.realized_pnl,
                position_type: pos_data.position_type,
                latent_state,
                updated_at: Utc::now(),
            });
        }

        Ok(positions)
    }
}

/// Positions response from Webull
#[derive(Debug, Deserialize)]
struct PositionsResponse {
    positions: Vec<PositionData>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PositionData {
    symbol: String,
    quantity: i64,
    avg_price: f64,
    current_price: f64,
    #[serde(default)]
    realized_pnl: f64,
    #[serde(rename = "type")]
    position_type: PositionType,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pnl_calculation() {
        let quantity = 10i64;
        let avg_price = 100.0;
        let current_price = 110.0;

        let unrealized_pnl = (current_price - avg_price) * quantity as f64;

        assert_eq!(unrealized_pnl, 100.0);
    }

    #[test]
    fn test_pnl_percentage() {
        let unrealized_pnl = 100.0;
        let cost_basis = 1000.0;

        let pnl_percent = (unrealized_pnl / cost_basis) * 100.0;

        assert_eq!(pnl_percent, 10.0);
    }
}

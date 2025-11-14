//! Real-time market data fetching

use anyhow::{Context, Result};
use chrono::Utc;
use phi_core::LatentN;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tokio::sync::RwLock;
use tracing::{debug, info};

use crate::auth::Session;
use crate::types::{Quote, OptionContract, OptionType};

const WEBULL_QUOTES_URL: &str = "https://quoteapi.webull.com/api/quote/tickerRealTime/getQuote";
const WEBULL_OPTIONS_URL: &str = "https://quoteapi.webull.com/api/quote/option/query/list";
const WEBULL_STREAM_URL: &str = "wss://quoteapi.webull.com/quote-stream";

/// Market data provider
pub struct MarketDataProvider {
    client: Client,
    session: Session,
    quote_cache: RwLock<HashMap<String, Quote>>,
}

impl MarketDataProvider {
    /// Create new market data provider
    pub fn new(client: Client, session: Session) -> Self {
        Self {
            client,
            session,
            quote_cache: RwLock::new(HashMap::new()),
        }
    }

    /// Get real-time quote for symbol
    pub async fn get_quote(&self, symbol: &str) -> Result<Quote> {
        debug!("Fetching quote for {}", symbol);

        let url = format!("{}?symbol={}", WEBULL_QUOTES_URL, symbol);

        let response = self.client
            .get(&url)
            .header("Authorization", format!("Bearer {}", self.session.access_token))
            .send()
            .await
            .context("Failed to fetch quote")?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Failed to get quote: {}", error_text);
        }

        let quote_response: QuoteResponse = response.json().await
            .context("Failed to parse quote response")?;

        let quote = self.parse_quote(symbol, quote_response)?;

        // Cache the quote
        let mut cache = self.quote_cache.write().await;
        cache.insert(symbol.to_string(), quote.clone());

        Ok(quote)
    }

    /// Get multiple quotes at once
    pub async fn get_quotes(&self, symbols: &[String]) -> Result<Vec<Quote>> {
        let mut quotes = Vec::new();

        // Batch request (up to 50 symbols at once)
        for chunk in symbols.chunks(50) {
            let symbols_param = chunk.join(",");
            let url = format!("{}?symbols={}", WEBULL_QUOTES_URL, symbols_param);

            let response = self.client
                .get(&url)
                .header("Authorization", format!("Bearer {}", self.session.access_token))
                .send()
                .await
                .context("Failed to fetch quotes")?;

            if !response.status().is_success() {
                continue;
            }

            let batch_response: Vec<QuoteResponse> = response.json().await
                .context("Failed to parse batch quotes")?;

            for (i, quote_response) in batch_response.into_iter().enumerate() {
                if let Ok(quote) = self.parse_quote(&chunk[i], quote_response) {
                    quotes.push(quote);
                }
            }
        }

        info!("Fetched {} quotes", quotes.len());
        Ok(quotes)
    }

    /// Get option chain for underlying symbol
    pub async fn get_option_chain(
        &self,
        symbol: &str,
        expiration_date: Option<&str>,
    ) -> Result<Vec<OptionContract>> {
        debug!("Fetching option chain for {}", symbol);

        let mut url = format!("{}?symbol={}", WEBULL_OPTIONS_URL, symbol);
        if let Some(date) = expiration_date {
            url.push_str(&format!("&expireDate={}", date));
        }

        let response = self.client
            .get(&url)
            .header("Authorization", format!("Bearer {}", self.session.access_token))
            .send()
            .await
            .context("Failed to fetch option chain")?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Failed to get option chain: {}", error_text);
        }

        let chain_response: OptionChainResponse = response.json().await
            .context("Failed to parse option chain")?;

        let contracts = self.parse_option_chain(symbol, chain_response)?;

        info!("Retrieved {} option contracts for {}", contracts.len(), symbol);
        Ok(contracts)
    }

    /// Get cached quote (if available)
    pub async fn get_cached_quote(&self, symbol: &str) -> Option<Quote> {
        let cache = self.quote_cache.read().await;
        cache.get(symbol).cloned()
    }

    /// Subscribe to real-time quote stream (WebSocket)
    pub async fn subscribe_quotes(&self, symbols: Vec<String>) -> Result<()> {
        // TODO: Implement WebSocket streaming for real-time quotes
        // This would use tokio-tungstenite to maintain a persistent connection
        info!("Quote streaming not yet implemented. Use polling via get_quote()");
        Ok(())
    }

    /// Parse quote response into Quote struct
    fn parse_quote(&self, symbol: &str, response: QuoteResponse) -> Result<Quote> {
        // Encode quote into Latent-N
        let price_cents = (response.price * 100.0) as u64;
        let latent_state = LatentN::new(price_cents);

        Ok(Quote {
            symbol: symbol.to_string(),
            price: response.price,
            bid: response.bid,
            ask: response.ask,
            volume: response.volume,
            timestamp: Utc::now(),
            latent_state,
        })
    }

    /// Parse option chain response
    fn parse_option_chain(
        &self,
        symbol: &str,
        response: OptionChainResponse,
    ) -> Result<Vec<OptionContract>> {
        let mut contracts = Vec::new();

        for option in response.options {
            // Encode contract into Latent-N (use strike price in cents)
            let strike_cents = (option.strike * 100.0) as u64;
            let latent_state = LatentN::new(strike_cents);

            contracts.push(OptionContract {
                symbol: symbol.to_string(),
                strike: option.strike,
                expiration: option.expiration,
                option_type: option.option_type,
                latent_state,
            });
        }

        Ok(contracts)
    }
}

/// Quote response from Webull API
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct QuoteResponse {
    #[serde(default)]
    price: f64,
    #[serde(default)]
    bid: f64,
    #[serde(default)]
    ask: f64,
    #[serde(default)]
    volume: u64,
}

/// Option chain response
#[derive(Debug, Deserialize)]
struct OptionChainResponse {
    options: Vec<OptionData>,
}

#[derive(Debug, Deserialize)]
struct OptionData {
    strike: f64,
    #[serde(with = "chrono::serde::ts_seconds")]
    expiration: chrono::DateTime<Utc>,
    #[serde(rename = "type")]
    option_type: OptionType,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_quote_latent_encoding() {
        let price = 150.75;
        let price_cents = (price * 100.0) as u64;
        let latent = LatentN::new(price_cents);

        assert_eq!(latent.n, 15075);
    }
}

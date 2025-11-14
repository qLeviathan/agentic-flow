//! FRED API Client
//!
//! Fetches macroeconomic data from Federal Reserve Economic Data (FRED)

use anyhow::{Context, Result};
use chrono::{DateTime, NaiveDate, Utc};
use reqwest::Client;
use serde::{Deserialize, Serialize};

const FRED_API_BASE: &str = "https://api.stlouisfed.org/fred";

/// FRED API client
pub struct FREDClient {
    api_key: String,
    client: Client,
}

/// Types of economic indicators
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum IndicatorType {
    /// Gross Domestic Product
    GDP,
    /// Unemployment Rate
    Unemployment,
    /// Consumer Price Index (Inflation)
    Inflation,
    /// Federal Funds Effective Rate
    InterestRate,
    /// Custom indicator by series ID
    Custom(String),
}

impl IndicatorType {
    /// Get FRED series ID for indicator type
    pub fn series_id(&self) -> &str {
        match self {
            IndicatorType::GDP => "GDP",
            IndicatorType::Unemployment => "UNRATE",
            IndicatorType::Inflation => "CPIAUCSL",
            IndicatorType::InterestRate => "FEDFUNDS",
            IndicatorType::Custom(id) => id,
        }
    }

    /// Get human-readable name
    pub fn name(&self) -> &str {
        match self {
            IndicatorType::GDP => "Gross Domestic Product",
            IndicatorType::Unemployment => "Unemployment Rate",
            IndicatorType::Inflation => "Consumer Price Index",
            IndicatorType::InterestRate => "Federal Funds Rate",
            IndicatorType::Custom(id) => id,
        }
    }
}

/// FRED API observation (data point)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Observation {
    pub date: NaiveDate,
    pub value: f64,
    pub realtime_start: NaiveDate,
    pub realtime_end: NaiveDate,
}

/// FRED API series response
#[derive(Debug, Deserialize)]
struct SeriesResponse {
    observations: Vec<ObservationRaw>,
}

#[derive(Debug, Deserialize)]
struct ObservationRaw {
    date: String,
    value: String,
    realtime_start: String,
    realtime_end: String,
}

impl FREDClient {
    /// Create new FRED API client
    pub fn new(api_key: String) -> Self {
        Self {
            api_key,
            client: Client::new(),
        }
    }

    /// Fetch series data from FRED
    ///
    /// # Arguments
    /// * `series_id` - FRED series ID (e.g., "GDP", "UNRATE")
    /// * `limit` - Maximum number of observations (None = all)
    ///
    /// # Example
    /// ```ignore
    /// let client = FREDClient::new(api_key);
    /// let data = client.fetch_series("GDP", Some(100)).await?;
    /// ```
    pub async fn fetch_series(
        &self,
        series_id: &str,
        limit: Option<usize>,
    ) -> Result<Vec<Observation>> {
        let url = format!(
            "{}/series/observations?series_id={}&api_key={}&file_type=json&sort_order=desc",
            FRED_API_BASE, series_id, self.api_key
        );

        let url = if let Some(limit) = limit {
            format!("{}&limit={}", url, limit)
        } else {
            url
        };

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .context("Failed to fetch FRED data")?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "FRED API error: {} - {}",
                response.status(),
                response.text().await.unwrap_or_default()
            ));
        }

        let series_response: SeriesResponse = response
            .json()
            .await
            .context("Failed to parse FRED response")?;

        // Parse observations
        let mut observations = Vec::new();
        for obs in series_response.observations {
            // Skip missing values (".")
            if obs.value == "." {
                continue;
            }

            let value: f64 = obs
                .value
                .parse()
                .context(format!("Failed to parse value: {}", obs.value))?;

            let date = NaiveDate::parse_from_str(&obs.date, "%Y-%m-%d")
                .context(format!("Failed to parse date: {}", obs.date))?;

            let realtime_start = NaiveDate::parse_from_str(&obs.realtime_start, "%Y-%m-%d")
                .context(format!(
                    "Failed to parse realtime_start: {}",
                    obs.realtime_start
                ))?;

            let realtime_end = NaiveDate::parse_from_str(&obs.realtime_end, "%Y-%m-%d")
                .context(format!("Failed to parse realtime_end: {}", obs.realtime_end))?;

            observations.push(Observation {
                date,
                value,
                realtime_start,
                realtime_end,
            });
        }

        // Reverse to get chronological order
        observations.reverse();

        Ok(observations)
    }

    /// Fetch latest value for a series
    pub async fn fetch_latest(&self, series_id: &str) -> Result<Observation> {
        let data = self.fetch_series(series_id, Some(1)).await?;

        data.into_iter()
            .next()
            .context("No data available for series")
    }

    /// Fetch multiple series in parallel
    pub async fn fetch_multiple(
        &self,
        series_ids: &[&str],
        limit: Option<usize>,
    ) -> Result<Vec<(String, Vec<Observation>)>> {
        let mut results = Vec::new();

        for series_id in series_ids {
            let data = self.fetch_series(series_id, limit).await?;
            results.push((series_id.to_string(), data));
        }

        Ok(results)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_indicator_type_series_id() {
        assert_eq!(IndicatorType::GDP.series_id(), "GDP");
        assert_eq!(IndicatorType::Unemployment.series_id(), "UNRATE");
        assert_eq!(IndicatorType::Inflation.series_id(), "CPIAUCSL");
        assert_eq!(IndicatorType::InterestRate.series_id(), "FEDFUNDS");
    }

    #[test]
    fn test_custom_indicator() {
        let custom = IndicatorType::Custom("M2SL".to_string());
        assert_eq!(custom.series_id(), "M2SL");
    }

    #[tokio::test]
    #[ignore] // Requires valid API key
    async fn test_fetch_series() {
        let api_key = std::env::var("FRED_API_KEY").unwrap_or_default();
        if api_key.is_empty() {
            return;
        }

        let client = FREDClient::new(api_key);
        let result = client.fetch_series("GDP", Some(10)).await;

        assert!(result.is_ok());
        let data = result.unwrap();
        assert!(data.len() <= 10);
    }
}

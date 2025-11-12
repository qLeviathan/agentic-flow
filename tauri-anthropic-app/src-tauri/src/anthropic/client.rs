use crate::anthropic::{
    error::{AnthropicError, Result},
    types::*,
};
use eventsource_stream::Eventsource;
use futures::stream::Stream;
use futures::StreamExt;
use reqwest::{header, Client as HttpClient};
use serde_json;
use std::pin::Pin;
use std::time::Duration;
use tokio::time::sleep;
use tracing::{debug, error, info, warn};

/// Base URL for Anthropic API
const ANTHROPIC_API_BASE: &str = "https://api.anthropic.com";

/// Anthropic API client
#[derive(Clone)]
pub struct AnthropicClient {
    client: HttpClient,
    api_key: String,
    max_retries: u32,
}

impl AnthropicClient {
    /// Create a new Anthropic client
    pub fn new(api_key: impl Into<String>) -> Result<Self> {
        let api_key = api_key.into();

        if api_key.is_empty() {
            return Err(AnthropicError::InvalidApiKey);
        }

        let client = HttpClient::builder()
            .timeout(Duration::from_secs(120))
            .build()
            .map_err(AnthropicError::RequestFailed)?;

        Ok(Self {
            client,
            api_key,
            max_retries: 3,
        })
    }

    /// Set maximum number of retries
    pub fn max_retries(mut self, max_retries: u32) -> Self {
        self.max_retries = max_retries;
        self
    }

    /// Send a message to Claude and get a response
    pub async fn send_message(&self, request: MessageRequest) -> Result<MessageResponse> {
        info!("Sending message to Claude with model: {}", request.model);

        let mut retries = 0;
        loop {
            match self.send_message_internal(&request).await {
                Ok(response) => {
                    info!("Received response from Claude");
                    return Ok(response);
                }
                Err(e) if e.is_retryable() && retries < self.max_retries => {
                    retries += 1;
                    let delay = e.retry_delay_ms();
                    warn!(
                        "Request failed, retrying in {}ms (attempt {}/{}): {}",
                        delay, retries, self.max_retries, e
                    );
                    sleep(Duration::from_millis(delay)).await;
                }
                Err(e) => {
                    error!("Request failed: {}", e);
                    return Err(e);
                }
            }
        }
    }

    async fn send_message_internal(&self, request: &MessageRequest) -> Result<MessageResponse> {
        let url = format!("{}/v1/messages", ANTHROPIC_API_BASE);

        debug!("Making request to: {}", url);

        let response = self
            .client
            .post(&url)
            .header(header::CONTENT_TYPE, "application/json")
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", ANTHROPIC_VERSION)
            .json(request)
            .send()
            .await?;

        let status = response.status();
        debug!("Response status: {}", status);

        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            error!("API error: {}", error_text);

            return Err(match status.as_u16() {
                401 => AnthropicError::InvalidApiKey,
                429 => AnthropicError::RateLimitExceeded,
                _ => AnthropicError::ApiError {
                    message: error_text,
                },
            });
        }

        let response_text = response.text().await?;
        debug!("Response body: {}", response_text);

        serde_json::from_str(&response_text)
            .map_err(|e| AnthropicError::InvalidResponse(format!("Failed to parse response: {}", e)))
    }

    /// Send a message and stream the response
    pub async fn stream_message(
        &self,
        mut request: MessageRequest,
    ) -> Result<Pin<Box<dyn Stream<Item = Result<StreamEvent>> + Send>>> {
        info!("Starting streaming message to Claude with model: {}", request.model);

        // Enable streaming
        request.stream = true;

        let url = format!("{}/v1/messages", ANTHROPIC_API_BASE);

        debug!("Making streaming request to: {}", url);

        let response = self
            .client
            .post(&url)
            .header(header::CONTENT_TYPE, "application/json")
            .header(header::ACCEPT, "text/event-stream")
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", ANTHROPIC_VERSION)
            .json(&request)
            .send()
            .await?;

        let status = response.status();
        debug!("Streaming response status: {}", status);

        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            error!("Streaming API error: {}", error_text);

            return Err(match status.as_u16() {
                401 => AnthropicError::InvalidApiKey,
                429 => AnthropicError::RateLimitExceeded,
                _ => AnthropicError::ApiError {
                    message: error_text,
                },
            });
        }

        let stream = response
            .bytes_stream()
            .eventsource()
            .map(|result| match result {
                Ok(event) => {
                    debug!("Received SSE event: {:?}", event.event);

                    if event.event == "error" {
                        let error: ApiError = serde_json::from_str(&event.data)
                            .map_err(|e| AnthropicError::InvalidResponse(e.to_string()))?;
                        return Err(AnthropicError::ApiError {
                            message: error.message,
                        });
                    }

                    serde_json::from_str::<StreamEvent>(&event.data)
                        .map_err(|e| AnthropicError::InvalidResponse(format!("Failed to parse event: {}", e)))
                }
                Err(e) => {
                    error!("Stream error: {}", e);
                    Err(AnthropicError::StreamError(e.to_string()))
                }
            });

        Ok(Box::pin(stream))
    }

    /// Helper method to send a simple text message
    pub async fn send_text(&self, text: impl Into<String>) -> Result<String> {
        let message = Message::user(text);
        let request = MessageRequest::new(vec![message]);
        let response = self.send_message(request).await?;
        Ok(response.text())
    }

    /// Helper method to send a text message with a system prompt
    pub async fn send_with_system(
        &self,
        text: impl Into<String>,
        system: impl Into<String>,
    ) -> Result<String> {
        let message = Message::user(text);
        let request = MessageRequest::new(vec![message]).system(system);
        let response = self.send_message(request).await?;
        Ok(response.text())
    }

    /// Helper method to continue a conversation
    pub async fn continue_conversation(&self, messages: Vec<Message>) -> Result<String> {
        let request = MessageRequest::new(messages);
        let response = self.send_message(request).await?;
        Ok(response.text())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_client_creation() {
        let result = AnthropicClient::new("test-key");
        assert!(result.is_ok());
    }

    #[test]
    fn test_empty_api_key() {
        let result = AnthropicClient::new("");
        assert!(matches!(result, Err(AnthropicError::InvalidApiKey)));
    }

    #[tokio::test]
    async fn test_message_request_builder() {
        let messages = vec![Message::user("Hello")];
        let request = MessageRequest::new(messages)
            .model("claude-3-5-sonnet-20241022")
            .max_tokens(2048)
            .temperature(0.7)
            .system("You are a helpful assistant");

        assert_eq!(request.model, "claude-3-5-sonnet-20241022");
        assert_eq!(request.max_tokens, 2048);
        assert_eq!(request.temperature, Some(0.7));
        assert_eq!(request.system, Some("You are a helpful assistant".to_string()));
    }
}

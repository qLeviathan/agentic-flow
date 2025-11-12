use thiserror::Error;

/// Errors that can occur when interacting with the Anthropic API
#[derive(Error, Debug)]
pub enum AnthropicError {
    #[error("HTTP request failed: {0}")]
    RequestFailed(#[from] reqwest::Error),

    #[error("API error: {message}")]
    ApiError { message: String },

    #[error("Invalid API key")]
    InvalidApiKey,

    #[error("Rate limit exceeded")]
    RateLimitExceeded,

    #[error("Invalid response format: {0}")]
    InvalidResponse(String),

    #[error("Streaming error: {0}")]
    StreamError(String),

    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("I/O error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Unknown error: {0}")]
    Unknown(String),
}

pub type Result<T> = std::result::Result<T, AnthropicError>;

impl AnthropicError {
    /// Check if error is retryable
    pub fn is_retryable(&self) -> bool {
        matches!(
            self,
            AnthropicError::RateLimitExceeded
                | AnthropicError::RequestFailed(_)
                | AnthropicError::StreamError(_)
        )
    }

    /// Get retry delay in milliseconds
    pub fn retry_delay_ms(&self) -> u64 {
        match self {
            AnthropicError::RateLimitExceeded => 60000, // 1 minute
            AnthropicError::RequestFailed(_) => 1000,   // 1 second
            AnthropicError::StreamError(_) => 2000,     // 2 seconds
            _ => 0,
        }
    }
}

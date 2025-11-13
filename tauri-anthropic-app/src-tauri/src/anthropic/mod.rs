/// Anthropic Claude API client module
///
/// This module provides a complete Rust client for the Anthropic Claude API,
/// including support for message sending, streaming responses, and error handling.

pub mod client;
pub mod error;
pub mod types;

// Re-export main types
pub use client::AnthropicClient;
pub use error::{AnthropicError, Result};
pub use types::{
    ContentBlock, Message, MessageRequest, MessageResponse, Role, StreamEvent,
    ANTHROPIC_VERSION, DEFAULT_MAX_TOKENS, DEFAULT_MODEL,
};

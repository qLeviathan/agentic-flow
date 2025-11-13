// Unit tests for Anthropic API client
use mockito::{mock, Server};
use serde_json::json;

// Mock the anthropic module for testing
mod mock_anthropic {
    use reqwest::Client;
    use serde::{Deserialize, Serialize};
    use anyhow::Result;

    #[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
    pub struct Message {
        pub role: String,
        pub content: String,
    }

    pub struct AnthropicClient {
        client: Client,
        api_key: String,
        base_url: String,
    }

    impl AnthropicClient {
        pub fn new(api_key: String) -> Result<Self> {
            Ok(Self {
                client: Client::new(),
                api_key,
                base_url: "https://api.anthropic.com".to_string(),
            })
        }

        pub fn with_base_url(api_key: String, base_url: String) -> Result<Self> {
            Ok(Self {
                client: Client::new(),
                api_key,
                base_url,
            })
        }

        pub async fn send_message(
            &self,
            messages: Vec<Message>,
            model: &str,
            max_tokens: u32,
        ) -> Result<String> {
            #[derive(Serialize)]
            struct MessageRequest {
                model: String,
                messages: Vec<Message>,
                max_tokens: u32,
            }

            #[derive(Deserialize)]
            struct MessageResponse {
                content: Vec<ContentBlock>,
            }

            #[derive(Deserialize)]
            struct ContentBlock {
                text: String,
            }

            let request = MessageRequest {
                model: model.to_string(),
                messages,
                max_tokens,
            };

            let response = self.client
                .post(format!("{}/v1/messages", self.base_url))
                .header("x-api-key", &self.api_key)
                .header("anthropic-version", "2023-06-01")
                .header("content-type", "application/json")
                .json(&request)
                .send()
                .await?;

            let response_data: MessageResponse = response.json().await?;
            Ok(response_data.content[0].text.clone())
        }
    }
}

use mock_anthropic::{AnthropicClient, Message};

#[tokio::test]
async fn test_client_creation() {
    let client = AnthropicClient::new("test-api-key".to_string());
    assert!(client.is_ok());
}

#[tokio::test]
async fn test_client_creation_with_empty_key() {
    let client = AnthropicClient::new("".to_string());
    assert!(client.is_ok()); // Client creation succeeds, API call would fail
}

#[tokio::test]
async fn test_send_message_success() {
    let mut server = Server::new_async().await;

    let mock = server.mock("POST", "/v1/messages")
        .match_header("x-api-key", "test-key")
        .match_header("anthropic-version", "2023-06-01")
        .with_status(200)
        .with_body(json!({
            "content": [{
                "text": "Hello! How can I help you today?"
            }],
            "id": "msg_123",
            "model": "claude-3-5-sonnet-20241022",
            "role": "assistant"
        }).to_string())
        .create_async()
        .await;

    let client = AnthropicClient::with_base_url(
        "test-key".to_string(),
        server.url()
    ).unwrap();

    let messages = vec![Message {
        role: "user".to_string(),
        content: "Hello".to_string(),
    }];

    let result = client.send_message(messages, "claude-3-5-sonnet-20241022", 1024).await;

    mock.assert_async().await;
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "Hello! How can I help you today?");
}

#[tokio::test]
async fn test_send_message_with_invalid_api_key() {
    let mut server = Server::new_async().await;

    let mock = server.mock("POST", "/v1/messages")
        .with_status(401)
        .with_body(json!({
            "error": {
                "type": "authentication_error",
                "message": "Invalid API key"
            }
        }).to_string())
        .create_async()
        .await;

    let client = AnthropicClient::with_base_url(
        "invalid-key".to_string(),
        server.url()
    ).unwrap();

    let messages = vec![Message {
        role: "user".to_string(),
        content: "Hello".to_string(),
    }];

    let result = client.send_message(messages, "claude-3-5-sonnet-20241022", 1024).await;

    mock.assert_async().await;
    assert!(result.is_err());
}

#[tokio::test]
async fn test_send_message_with_multiple_messages() {
    let mut server = Server::new_async().await;

    let mock = server.mock("POST", "/v1/messages")
        .with_status(200)
        .with_body(json!({
            "content": [{
                "text": "I understand the context from previous messages."
            }]
        }).to_string())
        .create_async()
        .await;

    let client = AnthropicClient::with_base_url(
        "test-key".to_string(),
        server.url()
    ).unwrap();

    let messages = vec![
        Message {
            role: "user".to_string(),
            content: "First message".to_string(),
        },
        Message {
            role: "assistant".to_string(),
            content: "First response".to_string(),
        },
        Message {
            role: "user".to_string(),
            content: "Second message".to_string(),
        },
    ];

    let result = client.send_message(messages, "claude-3-5-sonnet-20241022", 1024).await;

    mock.assert_async().await;
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_send_message_with_max_tokens() {
    let mut server = Server::new_async().await;

    let mock = server.mock("POST", "/v1/messages")
        .match_body(mockito::Matcher::Json(json!({
            "model": "claude-3-5-sonnet-20241022",
            "messages": [{
                "role": "user",
                "content": "Test"
            }],
            "max_tokens": 2048
        })))
        .with_status(200)
        .with_body(json!({
            "content": [{ "text": "Response" }]
        }).to_string())
        .create_async()
        .await;

    let client = AnthropicClient::with_base_url(
        "test-key".to_string(),
        server.url()
    ).unwrap();

    let messages = vec![Message {
        role: "user".to_string(),
        content: "Test".to_string(),
    }];

    let result = client.send_message(messages, "claude-3-5-sonnet-20241022", 2048).await;

    mock.assert_async().await;
    assert!(result.is_ok());
}

#[tokio::test]
async fn test_send_message_network_error() {
    let client = AnthropicClient::with_base_url(
        "test-key".to_string(),
        "http://invalid-url-that-does-not-exist.test".to_string()
    ).unwrap();

    let messages = vec![Message {
        role: "user".to_string(),
        content: "Hello".to_string(),
    }];

    let result = client.send_message(messages, "claude-3-5-sonnet-20241022", 1024).await;
    assert!(result.is_err());
}

#[test]
fn test_message_serialization() {
    let message = Message {
        role: "user".to_string(),
        content: "Test content".to_string(),
    };

    let json = serde_json::to_string(&message).unwrap();
    assert!(json.contains("user"));
    assert!(json.contains("Test content"));
}

#[test]
fn test_message_deserialization() {
    let json = r#"{"role":"assistant","content":"Response text"}"#;
    let message: Message = serde_json::from_str(json).unwrap();

    assert_eq!(message.role, "assistant");
    assert_eq!(message.content, "Response text");
}

#[test]
fn test_message_clone() {
    let original = Message {
        role: "user".to_string(),
        content: "Original".to_string(),
    };

    let cloned = original.clone();
    assert_eq!(original, cloned);
}

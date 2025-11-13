use crate::anthropic::{AnthropicClient, Message, MessageRequest, StreamEvent};
use crate::keychain::KeychainStorage;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;
use tracing::{error, info};

/// Application state containing the Anthropic client
pub struct AppState {
    pub client: Arc<Mutex<Option<AnthropicClient>>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            client: Arc::new(Mutex::new(None)),
        }
    }
}

/// Request to initialize the client
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InitRequest {
    pub api_key: String,
}

/// Response for initialization
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InitResponse {
    pub success: bool,
    pub message: String,
}

/// Request to send a message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendMessageRequest {
    pub messages: Vec<MessageData>,
    pub model: Option<String>,
    pub max_tokens: Option<u32>,
    pub temperature: Option<f32>,
    pub system: Option<String>,
}

/// Message data for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageData {
    pub role: String,
    pub content: String,
}

/// Response for message sending
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SendMessageResponse {
    pub success: bool,
    pub message: Option<String>,
    pub error: Option<String>,
    pub usage: Option<UsageData>,
}

/// Usage data for frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageData {
    pub input_tokens: u32,
    pub output_tokens: u32,
}

/// Initialize the Anthropic client
#[tauri::command]
pub async fn init_client(
    state: State<'_, AppState>,
    request: InitRequest,
) -> Result<InitResponse, String> {
    info!("Initializing Anthropic client");

    match AnthropicClient::new(request.api_key) {
        Ok(client) => {
            let mut client_guard = state.client.lock().await;
            *client_guard = Some(client);

            info!("Client initialized successfully");
            Ok(InitResponse {
                success: true,
                message: "Client initialized successfully".to_string(),
            })
        }
        Err(e) => {
            error!("Failed to initialize client: {}", e);
            Err(format!("Failed to initialize client: {}", e))
        }
    }
}

/// Send a message to Claude
#[tauri::command]
pub async fn send_message(
    state: State<'_, AppState>,
    request: SendMessageRequest,
) -> Result<SendMessageResponse, String> {
    info!("Sending message to Claude");

    let client_guard = state.client.lock().await;
    let client = client_guard
        .as_ref()
        .ok_or_else(|| "Client not initialized".to_string())?;

    // Convert frontend messages to API messages
    let messages: Vec<Message> = request
        .messages
        .iter()
        .map(|msg| {
            let role = match msg.role.as_str() {
                "user" => crate::anthropic::Role::User,
                "assistant" => crate::anthropic::Role::Assistant,
                _ => crate::anthropic::Role::User,
            };
            Message {
                role,
                content: vec![crate::anthropic::ContentBlock::Text {
                    text: msg.content.clone(),
                }],
            }
        })
        .collect();

    // Build request
    let mut api_request = MessageRequest::new(messages);

    if let Some(model) = request.model {
        api_request = api_request.model(model);
    }
    if let Some(max_tokens) = request.max_tokens {
        api_request = api_request.max_tokens(max_tokens);
    }
    if let Some(temperature) = request.temperature {
        api_request = api_request.temperature(temperature);
    }
    if let Some(system) = request.system {
        api_request = api_request.system(system);
    }

    // Send message
    match client.send_message(api_request).await {
        Ok(response) => {
            info!("Message sent successfully");
            Ok(SendMessageResponse {
                success: true,
                message: Some(response.text()),
                error: None,
                usage: Some(UsageData {
                    input_tokens: response.usage.input_tokens,
                    output_tokens: response.usage.output_tokens,
                }),
            })
        }
        Err(e) => {
            error!("Failed to send message: {}", e);
            Ok(SendMessageResponse {
                success: false,
                message: None,
                error: Some(format!("Failed to send message: {}", e)),
                usage: None,
            })
        }
    }
}

/// Send a simple text message (convenience method)
#[tauri::command]
pub async fn send_text(
    state: State<'_, AppState>,
    text: String,
    system: Option<String>,
) -> Result<SendMessageResponse, String> {
    info!("Sending text message");

    let client_guard = state.client.lock().await;
    let client = client_guard
        .as_ref()
        .ok_or_else(|| "Client not initialized".to_string())?;

    let result = if let Some(system_prompt) = system {
        client.send_with_system(text, system_prompt).await
    } else {
        client.send_text(text).await
    };

    match result {
        Ok(message) => {
            info!("Text message sent successfully");
            Ok(SendMessageResponse {
                success: true,
                message: Some(message),
                error: None,
                usage: None,
            })
        }
        Err(e) => {
            error!("Failed to send text message: {}", e);
            Ok(SendMessageResponse {
                success: false,
                message: None,
                error: Some(format!("Failed to send message: {}", e)),
                usage: None,
            })
        }
    }
}

/// Check if client is initialized
#[tauri::command]
pub async fn is_initialized(state: State<'_, AppState>) -> Result<bool, String> {
    let client_guard = state.client.lock().await;
    Ok(client_guard.is_some())
}

/// Initialize the client using API key from keychain
#[tauri::command]
pub async fn init_with_keychain(
    state: State<'_, AppState>,
) -> Result<InitResponse, String> {
    info!("Initializing Anthropic client from keychain");

    // Get API key from keychain
    let keychain = KeychainStorage::new("tauri-anthropic-app");
    let api_key = keychain.get_api_key().map_err(|e| {
        error!("Failed to retrieve API key from keychain: {}", e);
        format!("API key not found in keychain. Please save your API key first: {}", e)
    })?;

    // Initialize client with retrieved key
    match AnthropicClient::new(api_key) {
        Ok(client) => {
            let mut client_guard = state.client.lock().await;
            *client_guard = Some(client);

            info!("Client initialized successfully from keychain");
            Ok(InitResponse {
                success: true,
                message: "Client initialized successfully from keychain".to_string(),
            })
        }
        Err(e) => {
            error!("Failed to initialize client: {}", e);
            Err(format!("Failed to initialize client: {}", e))
        }
    }
}

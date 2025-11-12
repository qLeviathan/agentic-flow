use tauri::{State, Window};
use crate::anthropic::{AnthropicClient, Message, MessageRequest, Role, ContentBlock};
use crate::AppState;
use serde::{Deserialize, Serialize};

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

/// Send a chat message to the Anthropic API and return the complete response
///
/// # Arguments
/// * `request` - The message request with configuration
/// * `state` - Application state containing the API client
///
/// # Returns
/// * `Result<SendMessageResponse, String>` - The AI response or an error message
#[tauri::command]
pub async fn send_chat_message(
    state: State<'_, AppState>,
    request: SendMessageRequest,
) -> Result<SendMessageResponse, String> {
    log::info!("Sending message to Claude");

    let client_guard = state.client.lock().await;
    let client = client_guard
        .as_ref()
        .ok_or_else(|| "Client not initialized. Please configure your API key first.".to_string())?;

    // Convert frontend messages to API messages
    let messages: Vec<Message> = request
        .messages
        .iter()
        .map(|msg| {
            let role = match msg.role.as_str() {
                "user" => Role::User,
                "assistant" => Role::Assistant,
                _ => Role::User,
            };
            Message {
                role,
                content: vec![ContentBlock::Text {
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
            log::info!("Message sent successfully");
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
            log::error!("Failed to send message: {}", e);
            Ok(SendMessageResponse {
                success: false,
                message: None,
                error: Some(format!("Failed to send message: {}", e)),
                usage: None,
            })
        }
    }
}

/// Stream a chat message to the Anthropic API with real-time updates
///
/// This command sends events to the frontend as the response is generated,
/// allowing for a more interactive user experience.
///
/// # Arguments
/// * `text` - The user's message to send
/// * `window` - Tauri window for emitting events
/// * `state` - Application state containing the API client
///
/// # Returns
/// * `Result<(), String>` - Success or error message
///
/// # Events Emitted
/// * `chat-stream-chunk` - Emitted for each chunk of the response
/// * `chat-stream-complete` - Emitted when the stream is complete
/// * `chat-stream-error` - Emitted if an error occurs
#[tauri::command]
pub async fn stream_chat_message(
    text: String,
    window: Window,
    state: State<'_, AppState>,
) -> Result<(), String> {
    use futures::StreamExt;

    log::info!("Starting streaming message to Claude");

    let client_guard = state.client.lock().await;
    let client = client_guard
        .as_ref()
        .ok_or_else(|| "Client not initialized. Please configure your API key first.".to_string())?;

    // Create message
    let messages = vec![Message::user(text)];
    let request = MessageRequest::new(messages);

    // Start streaming
    match client.stream_message(request).await {
        Ok(mut stream) => {
            while let Some(result) = stream.next().await {
                match result {
                    Ok(event) => {
                        // Handle different stream events
                        use crate::anthropic::StreamEvent;
                        match event {
                            StreamEvent::ContentBlockDelta { delta, .. } => {
                                if let crate::anthropic::ContentDelta::TextDelta { text } = delta {
                                    window.emit("chat-stream-chunk", &text)
                                        .map_err(|e| format!("Failed to emit chunk: {}", e))?;
                                }
                            }
                            StreamEvent::MessageStop => {
                                window.emit("chat-stream-complete", ())
                                    .map_err(|e| format!("Failed to emit completion: {}", e))?;
                            }
                            StreamEvent::Error { error } => {
                                let error_msg = error.message;
                                window.emit("chat-stream-error", &error_msg)
                                    .map_err(|e| format!("Failed to emit error: {}", e))?;
                                return Err(error_msg);
                            }
                            _ => {} // Ignore other events
                        }
                    }
                    Err(e) => {
                        let error_msg = format!("Stream error: {}", e);
                        log::error!("{}", error_msg);
                        window.emit("chat-stream-error", &error_msg)
                            .map_err(|e| format!("Failed to emit error: {}", e))?;
                        return Err(error_msg);
                    }
                }
            }
            Ok(())
        }
        Err(e) => {
            let error_msg = format!("Failed to start streaming: {}", e);
            log::error!("{}", error_msg);
            window.emit("chat-stream-error", &error_msg)
                .map_err(|e| format!("Failed to emit error: {}", e))?;
            Err(error_msg)
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
    log::info!("Sending text message");

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
            log::info!("Text message sent successfully");
            Ok(SendMessageResponse {
                success: true,
                message: Some(message),
                error: None,
                usage: None,
            })
        }
        Err(e) => {
            log::error!("Failed to send text message: {}", e);
            Ok(SendMessageResponse {
                success: false,
                message: None,
                error: Some(format!("Failed to send message: {}", e)),
                usage: None,
            })
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_message_data_serialization() {
        let msg = MessageData {
            role: "user".to_string(),
            content: "Hello".to_string(),
        };

        let json = serde_json::to_string(&msg).unwrap();
        assert!(json.contains("user"));
        assert!(json.contains("Hello"));
    }
}

/**
 * AURELIA Tauri Commands
 *
 * Exposes AURELIA conversational interface and learning system
 * to the Tauri frontend.
 */

use super::conversation::{ConversationManager, ConversationMessage, MarketContext, ConversationState};
use super::learning::{LearningEngine, LearningFeedback, LearningProgress, Sentiment};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

/// Global AURELIA chat state
pub struct AureliaChatState {
    conversation: Mutex<Option<ConversationManager>>,
    learning: Mutex<LearningEngine>,
}

impl AureliaChatState {
    pub fn new() -> Self {
        Self {
            conversation: Mutex::new(None),
            learning: Mutex::new(LearningEngine::new("default-session".to_string())),
        }
    }
}

/// Chat message request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatRequest {
    pub message: String,
    pub entities: Vec<String>,
    pub market_context: Option<MarketContext>,
}

/// Chat response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatResponse {
    pub message_id: String,
    pub content: String,
    pub psi: f64,
    pub omega: f64,
    pub is_conscious: bool,
    pub timestamp: i64,
}

/// Personality profile response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonalityResponse {
    pub name: String,
    pub traits: std::collections::HashMap<String, f64>,
    pub preferred_style: String,
    pub expertise_areas: Vec<String>,
}

/// Initialize AURELIA chat with API key
#[tauri::command]
pub async fn aurelia_chat_init(
    api_key: String,
    session_id: Option<String>,
    state: State<'_, AureliaChatState>,
) -> Result<String, String> {
    log::info!("Initializing AURELIA chat system");

    let session = session_id.unwrap_or_else(|| format!("session-{}", chrono::Utc::now().timestamp_millis()));

    let mut manager = ConversationManager::new(session.clone());
    manager.init_anthropic(api_key)?;

    let mut conversation = state.conversation.lock().map_err(|e| e.to_string())?;
    *conversation = Some(manager);

    // Update learning engine session
    let mut learning = state.learning.lock().map_err(|e| e.to_string())?;
    *learning = LearningEngine::new(session.clone());

    log::info!("✓ AURELIA chat initialized: {}", session);

    Ok(session)
}

/// Send a message to AURELIA and get response
#[tauri::command]
pub async fn aurelia_chat(
    request: ChatRequest,
    state: State<'_, AureliaChatState>,
) -> Result<ChatResponse, String> {
    log::debug!("Processing chat message: {}", request.message);

    let mut conversation = state.conversation.lock().map_err(|e| e.to_string())?;
    let manager = conversation.as_mut()
        .ok_or_else(|| "Chat not initialized. Call aurelia_chat_init first.".to_string())?;

    // Set market context if provided
    if let Some(context) = request.market_context {
        manager.set_market_context(context);
    }

    // Add user message
    let user_msg = manager.add_user_message(request.message.clone(), request.entities.clone());

    // Generate response
    let response_text = manager.generate_response(&request.message).await?;

    // Get current state for metrics
    let current_state = manager.get_state();

    Ok(ChatResponse {
        message_id: user_msg.id,
        content: response_text,
        psi: current_state.consciousness_metrics.psi,
        omega: current_state.consciousness_metrics.omega,
        is_conscious: current_state.consciousness_metrics.is_conscious,
        timestamp: chrono::Utc::now().timestamp_millis(),
    })
}

/// Stream chat response (returns initial status, actual streaming via events)
#[tauri::command]
pub async fn aurelia_chat_stream(
    request: ChatRequest,
    app: AppHandle,
    state: State<'_, AureliaChatState>,
) -> Result<String, String> {
    log::debug!("Starting streaming chat: {}", request.message);

    let mut conversation = state.conversation.lock().map_err(|e| e.to_string())?;
    let manager = conversation.as_mut()
        .ok_or_else(|| "Chat not initialized".to_string())?;

    // Set market context if provided
    if let Some(context) = request.market_context.clone() {
        manager.set_market_context(context);
    }

    // Add user message
    let user_msg = manager.add_user_message(request.message.clone(), request.entities.clone());
    let message_id = user_msg.id.clone();

    // Start streaming in background
    let stream = manager.stream_response(&request.message).await?;

    // Spawn background task to emit chunks
    tauri::async_runtime::spawn(async move {
        use futures::StreamExt;

        let mut stream_pinned = Box::pin(stream);
        let mut full_response = String::new();

        while let Some(result) = stream_pinned.next().await {
            match result {
                Ok(text_chunk) => {
                    full_response.push_str(&text_chunk);

                    // Emit chunk to frontend
                    let _ = app.emit_all("aurelia-stream-chunk", serde_json::json!({
                        "message_id": message_id,
                        "chunk": text_chunk,
                        "is_final": false,
                    }));
                }
                Err(e) => {
                    log::error!("Stream error: {}", e);
                    let _ = app.emit_all("aurelia-stream-error", serde_json::json!({
                        "message_id": message_id,
                        "error": e,
                    }));
                    break;
                }
            }
        }

        // Emit final event
        let _ = app.emit_all("aurelia-stream-complete", serde_json::json!({
            "message_id": message_id,
            "full_response": full_response,
        }));
    });

    Ok(message_id)
}

/// Get current conversation context
#[tauri::command]
pub async fn aurelia_get_context(
    state: State<'_, AureliaChatState>,
) -> Result<ConversationState, String> {
    let conversation = state.conversation.lock().map_err(|e| e.to_string())?;
    let manager = conversation.as_ref()
        .ok_or_else(|| "Chat not initialized".to_string())?;

    Ok(manager.get_state().clone())
}

/// Submit learning feedback
#[tauri::command]
pub async fn aurelia_learn(
    feedback: LearningFeedback,
    state: State<'_, AureliaChatState>,
) -> Result<(), String> {
    log::info!("Receiving learning feedback");

    let mut learning = state.learning.lock().map_err(|e| e.to_string())?;
    learning.learn_from_feedback(feedback)?;

    Ok(())
}

/// Get personality profile
#[tauri::command]
pub async fn aurelia_get_personality(
    state: State<'_, AureliaChatState>,
) -> Result<PersonalityResponse, String> {
    let conversation = state.conversation.lock().map_err(|e| e.to_string())?;
    let manager = conversation.as_ref()
        .ok_or_else(|| "Chat not initialized".to_string())?;

    let profile = &manager.get_state().personality_profile;

    Ok(PersonalityResponse {
        name: profile.name.clone(),
        traits: profile.traits.clone(),
        preferred_style: profile.preferred_style.clone(),
        expertise_areas: profile.expertise_areas.clone(),
    })
}

/// Get learning progress
#[tauri::command]
pub async fn aurelia_get_learning_progress(
    state: State<'_, AureliaChatState>,
) -> Result<LearningProgress, String> {
    let learning = state.learning.lock().map_err(|e| e.to_string())?;
    Ok(learning.get_learning_progress())
}

/// Reset conversation context
#[tauri::command]
pub async fn aurelia_reset_context(
    state: State<'_, AureliaChatState>,
) -> Result<(), String> {
    log::info!("Resetting conversation context");

    let mut conversation = state.conversation.lock().map_err(|e| e.to_string())?;
    if let Some(manager) = conversation.as_mut() {
        manager.reset();
    }

    Ok(())
}

/// Get conversation history
#[tauri::command]
pub async fn aurelia_get_history(
    state: State<'_, AureliaChatState>,
) -> Result<Vec<ConversationMessage>, String> {
    let conversation = state.conversation.lock().map_err(|e| e.to_string())?;
    let manager = conversation.as_ref()
        .ok_or_else(|| "Chat not initialized".to_string())?;

    Ok(manager.get_history())
}

/// Set market context for conversation
#[tauri::command]
pub async fn aurelia_set_market_context(
    context: MarketContext,
    state: State<'_, AureliaChatState>,
) -> Result<(), String> {
    let mut conversation = state.conversation.lock().map_err(|e| e.to_string())?;
    let manager = conversation.as_mut()
        .ok_or_else(|| "Chat not initialized".to_string())?;

    manager.set_market_context(context);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chat_state_creation() {
        let state = AureliaChatState::new();
        assert!(state.conversation.lock().unwrap().is_none());
    }
}

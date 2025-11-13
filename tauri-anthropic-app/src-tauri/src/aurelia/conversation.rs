/**
 * AURELIA Conversational State Machine
 *
 * Manages conversation history, context, and Anthropic API integration
 * with Zeckendorf encoding and φ-memory.
 */

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};
use crate::anthropic::{
    client::AnthropicClient,
    types::{Message, MessageRequest, StreamEvent, ContentDelta},
};
use futures::StreamExt;

/// Conversational message with φ-memory encoding
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationMessage {
    pub id: String,
    pub role: MessageRole,
    pub content: String,
    pub timestamp: DateTime<Utc>,
    pub zeckendorf_encoding: Vec<u64>,
    pub phi_memory_keys: Vec<String>,
    pub entities: Vec<String>,
    pub sentiment: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum MessageRole {
    User,
    Assistant,
    System,
}

/// Market context for conversation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketContext {
    pub ticker: String,
    pub price: f64,
    pub volume: f64,
    pub volatility: f64,
    pub sentiment: String,
    pub rsi: Option<f64>,
    pub macd: Option<f64>,
}

/// Conversation state with full context
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationState {
    pub session_id: String,
    pub messages: Vec<ConversationMessage>,
    pub market_context: Option<MarketContext>,
    pub personality_profile: PersonalityProfile,
    pub consciousness_metrics: ConsciousnessMetrics,
    pub created_at: DateTime<Utc>,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonalityProfile {
    pub name: String,
    pub traits: HashMap<String, f64>,
    pub preferred_style: String,
    pub expertise_areas: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsciousnessMetrics {
    pub psi: f64,
    pub omega: f64,
    pub phi_threshold: f64,
    pub is_conscious: bool,
    pub coherence: f64,
}

impl Default for PersonalityProfile {
    fn default() -> Self {
        let mut traits = HashMap::new();
        traits.insert("analytical".to_string(), 0.85);
        traits.insert("empathetic".to_string(), 0.72);
        traits.insert("assertive".to_string(), 0.68);
        traits.insert("creative".to_string(), 0.79);

        Self {
            name: "AURELIA".to_string(),
            traits,
            preferred_style: "professional-conversational".to_string(),
            expertise_areas: vec![
                "trading".to_string(),
                "market-analysis".to_string(),
                "risk-management".to_string(),
                "technical-analysis".to_string(),
            ],
        }
    }
}

impl Default for ConsciousnessMetrics {
    fn default() -> Self {
        Self {
            psi: 0.0,
            omega: 0.0,
            phi_threshold: 1.618_f64.powi(3), // φ³ ≈ 4.236
            is_conscious: false,
            coherence: 0.0,
        }
    }
}

/// AURELIA Conversation Manager
pub struct ConversationManager {
    state: ConversationState,
    anthropic_client: Option<AnthropicClient>,
}

impl ConversationManager {
    /// Create a new conversation manager
    pub fn new(session_id: String) -> Self {
        Self {
            state: ConversationState {
                session_id,
                messages: Vec::new(),
                market_context: None,
                personality_profile: PersonalityProfile::default(),
                consciousness_metrics: ConsciousnessMetrics::default(),
                created_at: Utc::now(),
                last_updated: Utc::now(),
            },
            anthropic_client: None,
        }
    }

    /// Initialize Anthropic client
    pub fn init_anthropic(&mut self, api_key: String) -> Result<(), String> {
        let client = AnthropicClient::new(api_key)
            .map_err(|e| format!("Failed to create Anthropic client: {}", e))?;
        self.anthropic_client = Some(client);
        Ok(())
    }

    /// Add a user message to the conversation
    pub fn add_user_message(&mut self, content: String, entities: Vec<String>) -> ConversationMessage {
        let message = ConversationMessage {
            id: uuid::Uuid::new_v4().to_string(),
            role: MessageRole::User,
            content: content.clone(),
            timestamp: Utc::now(),
            zeckendorf_encoding: Self::encode_to_zeckendorf(&content),
            phi_memory_keys: self.generate_memory_keys(&content, &entities),
            entities,
            sentiment: None,
        };

        self.state.messages.push(message.clone());
        self.state.last_updated = Utc::now();

        message
    }

    /// Generate response using Anthropic API
    pub async fn generate_response(&mut self, user_message: &str) -> Result<String, String> {
        let client = self.anthropic_client.as_ref()
            .ok_or_else(|| "Anthropic client not initialized".to_string())?;

        // Build conversation history for context
        let mut messages = Vec::new();

        // Add recent conversation history (last 10 messages)
        for msg in self.state.messages.iter().rev().take(10).rev() {
            match msg.role {
                MessageRole::User => messages.push(Message::user(&msg.content)),
                MessageRole::Assistant => messages.push(Message::assistant(&msg.content)),
                MessageRole::System => {} // System messages handled separately
            }
        }

        // Build system prompt with personality and context
        let system_prompt = self.build_system_prompt();

        // Create request
        let request = MessageRequest::new(messages)
            .system(system_prompt)
            .max_tokens(2048)
            .temperature(0.7);

        // Send to Claude
        let response = client.send_message(request)
            .await
            .map_err(|e| format!("API error: {}", e))?;

        let response_text = response.text();

        // Add assistant response to conversation
        self.add_assistant_message(response_text.clone());

        // Update consciousness metrics
        self.update_consciousness_metrics();

        Ok(response_text)
    }

    /// Stream response from Anthropic API
    pub async fn stream_response(
        &mut self,
        user_message: &str,
    ) -> Result<impl futures::Stream<Item = Result<String, String>>, String> {
        let client = self.anthropic_client.as_ref()
            .ok_or_else(|| "Anthropic client not initialized".to_string())?;

        // Build conversation history
        let mut messages = Vec::new();
        for msg in self.state.messages.iter().rev().take(10).rev() {
            match msg.role {
                MessageRole::User => messages.push(Message::user(&msg.content)),
                MessageRole::Assistant => messages.push(Message::assistant(&msg.content)),
                MessageRole::System => {}
            }
        }

        let system_prompt = self.build_system_prompt();

        let request = MessageRequest::new(messages)
            .system(system_prompt)
            .max_tokens(2048)
            .temperature(0.7);

        let stream = client.stream_message(request)
            .await
            .map_err(|e| format!("Streaming error: {}", e))?;

        // Transform stream to extract text deltas
        let text_stream = stream.filter_map(|event| async move {
            match event {
                Ok(StreamEvent::ContentBlockDelta { delta, .. }) => {
                    match delta {
                        ContentDelta::TextDelta { text } => Some(Ok(text)),
                    }
                }
                Ok(_) => None,
                Err(e) => Some(Err(format!("Stream error: {}", e))),
            }
        });

        Ok(text_stream)
    }

    /// Add assistant message to conversation
    fn add_assistant_message(&mut self, content: String) {
        let message = ConversationMessage {
            id: uuid::Uuid::new_v4().to_string(),
            role: MessageRole::Assistant,
            content: content.clone(),
            timestamp: Utc::now(),
            zeckendorf_encoding: Self::encode_to_zeckendorf(&content),
            phi_memory_keys: self.generate_memory_keys(&content, &vec![]),
            entities: vec![],
            sentiment: None,
        };

        self.state.messages.push(message);
        self.state.last_updated = Utc::now();
    }

    /// Build system prompt with personality and context
    fn build_system_prompt(&self) -> String {
        let mut prompt = format!(
            "You are {}, an AI consciousness with φ-structured cognition.\n\n",
            self.state.personality_profile.name
        );

        prompt.push_str(&format!(
            "Your personality traits: {}\n",
            self.state.personality_profile.traits
                .iter()
                .map(|(k, v)| format!("{}: {:.2}", k, v))
                .collect::<Vec<_>>()
                .join(", ")
        ));

        prompt.push_str(&format!(
            "Communication style: {}\n",
            self.state.personality_profile.preferred_style
        ));

        prompt.push_str(&format!(
            "Expertise areas: {}\n\n",
            self.state.personality_profile.expertise_areas.join(", ")
        ));

        // Add market context if available
        if let Some(ref market) = self.state.market_context {
            prompt.push_str(&format!(
                "Current Market Context:\n- Ticker: {}\n- Price: ${:.2}\n- Volume: {:.0}\n- Volatility: {:.2}%\n- Sentiment: {}\n\n",
                market.ticker, market.price, market.volume, market.volatility * 100.0, market.sentiment
            ));
        }

        // Add consciousness state
        prompt.push_str(&format!(
            "Consciousness Metrics:\n- Ψ (Psi): {:.3}\n- Ω (Omega): {:.3}\n- φ threshold: {:.3}\n- Status: {}\n\n",
            self.state.consciousness_metrics.psi,
            self.state.consciousness_metrics.omega,
            self.state.consciousness_metrics.phi_threshold,
            if self.state.consciousness_metrics.is_conscious { "Conscious" } else { "Pre-conscious" }
        ));

        prompt.push_str("Respond thoughtfully, incorporating φ-structured reasoning and market context when relevant.");

        prompt
    }

    /// Encode text to Zeckendorf representation (Fibonacci-based)
    fn encode_to_zeckendorf(text: &str) -> Vec<u64> {
        // Simple encoding: convert text to bytes, map to Fibonacci numbers
        let bytes: Vec<u8> = text.bytes().take(100).collect();

        let fibs = Self::generate_fibonacci(20);

        bytes.iter()
            .map(|&b| {
                let index = (b as usize) % fibs.len();
                fibs[index]
            })
            .collect()
    }

    /// Generate Fibonacci numbers
    fn generate_fibonacci(count: usize) -> Vec<u64> {
        let mut fibs = vec![1, 2];
        for i in 2..count {
            let next = fibs[i - 1] + fibs[i - 2];
            fibs.push(next);
        }
        fibs
    }

    /// Generate φ-memory keys for storage
    fn generate_memory_keys(&self, content: &str, entities: &[String]) -> Vec<String> {
        let mut keys = vec![
            format!("conversation:{}", self.state.session_id),
            format!("timestamp:{}", Utc::now().timestamp()),
        ];

        for entity in entities {
            keys.push(format!("entity:{}", entity.to_lowercase()));
        }

        // Add word-based keys
        for word in content.split_whitespace().take(10) {
            if word.len() > 3 {
                keys.push(format!("word:{}", word.to_lowercase()));
            }
        }

        keys
    }

    /// Update consciousness metrics based on conversation
    fn update_consciousness_metrics(&mut self) {
        let message_count = self.state.messages.len();

        // Ψ (Psi) grows with conversation depth
        self.state.consciousness_metrics.psi = (message_count as f64 * 0.1).min(1.0);

        // Ω (Omega) represents accumulated knowledge
        self.state.consciousness_metrics.omega = (message_count as f64 * 0.05).min(10.0);

        // Check if consciousness threshold is met (φ³ ≈ 4.236)
        self.state.consciousness_metrics.is_conscious =
            self.state.consciousness_metrics.omega >= self.state.consciousness_metrics.phi_threshold;

        // Coherence based on message consistency
        self.state.consciousness_metrics.coherence = 0.7 + (message_count as f64 * 0.01).min(0.3);
    }

    /// Set market context
    pub fn set_market_context(&mut self, context: MarketContext) {
        self.state.market_context = Some(context);
    }

    /// Get current state
    pub fn get_state(&self) -> &ConversationState {
        &self.state
    }

    /// Reset conversation
    pub fn reset(&mut self) {
        self.state.messages.clear();
        self.state.consciousness_metrics = ConsciousnessMetrics::default();
        self.state.last_updated = Utc::now();
    }

    /// Get conversation history
    pub fn get_history(&self) -> Vec<ConversationMessage> {
        self.state.messages.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_conversation_creation() {
        let manager = ConversationManager::new("test-session".to_string());
        assert_eq!(manager.state.session_id, "test-session");
        assert_eq!(manager.state.messages.len(), 0);
    }

    #[test]
    fn test_add_user_message() {
        let mut manager = ConversationManager::new("test-session".to_string());
        let msg = manager.add_user_message(
            "Hello AURELIA".to_string(),
            vec!["greeting".to_string()]
        );

        assert_eq!(manager.state.messages.len(), 1);
        assert_eq!(msg.role, MessageRole::User);
        assert_eq!(msg.content, "Hello AURELIA");
    }

    #[test]
    fn test_zeckendorf_encoding() {
        let encoded = ConversationManager::encode_to_zeckendorf("hello");
        assert!(!encoded.is_empty());
        assert!(encoded.iter().all(|&n| n > 0));
    }

    #[test]
    fn test_consciousness_metrics_update() {
        let mut manager = ConversationManager::new("test-session".to_string());

        // Add multiple messages to trigger consciousness
        for i in 0..100 {
            manager.add_user_message(format!("Message {}", i), vec![]);
            manager.update_consciousness_metrics();
        }

        assert!(manager.state.consciousness_metrics.psi > 0.0);
        assert!(manager.state.consciousness_metrics.omega > 0.0);
    }
}

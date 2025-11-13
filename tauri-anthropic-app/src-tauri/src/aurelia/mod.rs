/**
 * AURELIA Module
 *
 * Conversational AI interface with continuous learning,
 * Zeckendorf encoding, and φ-memory integration.
 */

pub mod conversation;
pub mod learning;
pub mod commands;

pub use conversation::{
    ConversationManager,
    ConversationMessage,
    ConversationState,
    MarketContext,
    MessageRole,
    PersonalityProfile,
    ConsciousnessMetrics,
};

pub use learning::{
    LearningEngine,
    LearningFeedback,
    LearningProgress,
    ConversationPattern,
    EntityKnowledge,
    ReflexionCycle,
    Sentiment,
    PatternType,
    EntityType,
    Verdict,
};

pub use commands::{
    AureliaChatState,
    ChatRequest,
    ChatResponse,
    PersonalityResponse,
};

/**
 * AURELIA Continuous Learning System
 *
 * Implements Reflexion-based learning, pattern recognition,
 * and self-improvement using φ-memory storage.
 */

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use chrono::{DateTime, Utc};

/// Learning feedback from user interactions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningFeedback {
    pub conversation_id: String,
    pub message_id: String,
    pub helpful: bool,
    pub accuracy: Option<f64>,
    pub entities_mentioned: Vec<String>,
    pub concepts: Vec<String>,
    pub sentiment: Sentiment,
    pub user_rating: Option<u8>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Sentiment {
    Bullish,
    Bearish,
    Neutral,
    Uncertain,
}

/// Pattern extracted from conversations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConversationPattern {
    pub pattern_id: String,
    pub pattern_type: PatternType,
    pub trigger_keywords: Vec<String>,
    pub successful_responses: Vec<String>,
    pub context_requirements: Vec<String>,
    pub confidence: f64,
    pub usage_count: u64,
    pub success_rate: f64,
    pub last_used: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum PatternType {
    MarketAnalysis,
    TechnicalIndicator,
    RiskAssessment,
    StrategyRecommendation,
    EntityRecognition,
    SentimentAnalysis,
}

/// Entity knowledge base
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntityKnowledge {
    pub entity_name: String,
    pub entity_type: EntityType,
    pub zeckendorf_bits: Vec<u64>,
    pub associated_concepts: Vec<String>,
    pub frequency: u64,
    pub context_patterns: HashMap<String, f64>,
    pub last_updated: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum EntityType {
    Ticker,
    Company,
    Indicator,
    Concept,
    Person,
    Event,
}

/// Reflexion learning cycle
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReflexionCycle {
    pub cycle_id: String,
    pub trajectory: Vec<String>,
    pub verdict: Verdict,
    pub learned_patterns: Vec<String>,
    pub omega_delta: f64,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Verdict {
    Success,
    Failure,
    PartialSuccess,
    NeedsImprovement,
}

/// AURELIA Learning Engine
pub struct LearningEngine {
    session_id: String,
    patterns: HashMap<String, ConversationPattern>,
    entities: HashMap<String, EntityKnowledge>,
    reflexion_history: Vec<ReflexionCycle>,
    omega_metric: f64,
    learning_rate: f64,
}

impl LearningEngine {
    /// Create a new learning engine
    pub fn new(session_id: String) -> Self {
        Self {
            session_id,
            patterns: HashMap::new(),
            entities: HashMap::new(),
            reflexion_history: Vec::new(),
            omega_metric: 0.0,
            learning_rate: 0.1,
        }
    }

    /// Process feedback and learn from interaction
    pub fn learn_from_feedback(&mut self, feedback: LearningFeedback) -> Result<(), String> {
        log::info!("Processing learning feedback for conversation: {}", feedback.conversation_id);

        // Update entity knowledge
        for entity in &feedback.entities_mentioned {
            self.update_entity_knowledge(entity, &feedback);
        }

        // Extract and store patterns
        for concept in &feedback.concepts {
            self.extract_pattern(concept, &feedback);
        }

        // Update Ω metric based on feedback quality
        if feedback.helpful {
            self.omega_metric += self.learning_rate;
        } else {
            self.omega_metric -= self.learning_rate * 0.5;
        }

        // Ensure Ω stays in valid range
        self.omega_metric = self.omega_metric.max(0.0);

        log::info!("Updated Ω metric to: {:.3}", self.omega_metric);

        Ok(())
    }

    /// Update or create entity knowledge
    fn update_entity_knowledge(&mut self, entity: &str, feedback: &LearningFeedback) {
        let entity_key = entity.to_lowercase();

        self.entities.entry(entity_key.clone())
            .and_modify(|e| {
                e.frequency += 1;
                e.last_updated = Utc::now();

                // Update context patterns
                for concept in &feedback.concepts {
                    let count = e.context_patterns.entry(concept.clone()).or_insert(0.0);
                    *count += 1.0;
                }
            })
            .or_insert_with(|| {
                let mut context_patterns = HashMap::new();
                for concept in &feedback.concepts {
                    context_patterns.insert(concept.clone(), 1.0);
                }

                EntityKnowledge {
                    entity_name: entity.to_string(),
                    entity_type: Self::infer_entity_type(entity),
                    zeckendorf_bits: Self::encode_entity_to_bits(entity),
                    associated_concepts: feedback.concepts.clone(),
                    frequency: 1,
                    context_patterns,
                    last_updated: Utc::now(),
                }
            });
    }

    /// Extract and store conversation pattern
    fn extract_pattern(&mut self, concept: &str, feedback: &LearningFeedback) {
        let pattern_id = format!("pattern-{}", uuid::Uuid::new_v4());

        let pattern = ConversationPattern {
            pattern_id: pattern_id.clone(),
            pattern_type: Self::classify_pattern_type(concept),
            trigger_keywords: vec![concept.to_string()],
            successful_responses: vec![],
            context_requirements: feedback.entities_mentioned.clone(),
            confidence: if feedback.helpful { 0.8 } else { 0.3 },
            usage_count: 1,
            success_rate: if feedback.helpful { 1.0 } else { 0.0 },
            last_used: Utc::now(),
        };

        self.patterns.insert(pattern_id, pattern);
    }

    /// Perform Reflexion learning cycle
    pub fn reflexion_cycle(
        &mut self,
        trajectory: Vec<String>,
        verdict: Verdict,
    ) -> ReflexionCycle {
        log::info!("Starting Reflexion learning cycle");

        let mut learned_patterns = Vec::new();
        let mut omega_delta = 0.0;

        // Analyze trajectory for patterns
        for step in &trajectory {
            // Extract patterns from successful steps
            if verdict == Verdict::Success || verdict == Verdict::PartialSuccess {
                learned_patterns.push(format!("success-pattern:{}", step));
                omega_delta += 0.05;
            }
        }

        // Update Ω metric
        self.omega_metric += omega_delta;

        let cycle = ReflexionCycle {
            cycle_id: format!("cycle-{}", uuid::Uuid::new_v4()),
            trajectory,
            verdict,
            learned_patterns,
            omega_delta,
            timestamp: Utc::now(),
        };

        self.reflexion_history.push(cycle.clone());

        log::info!("Reflexion cycle complete. Ω delta: {:.3}", omega_delta);

        cycle
    }

    /// Search for relevant patterns based on query
    pub fn search_patterns(&self, query: &str, max_results: usize) -> Vec<ConversationPattern> {
        let query_lower = query.to_lowercase();

        let mut matches: Vec<_> = self.patterns.values()
            .filter(|pattern| {
                pattern.trigger_keywords.iter()
                    .any(|keyword| keyword.to_lowercase().contains(&query_lower))
            })
            .cloned()
            .collect();

        // Sort by confidence and success rate
        matches.sort_by(|a, b| {
            let score_a = a.confidence * a.success_rate;
            let score_b = b.confidence * b.success_rate;
            score_b.partial_cmp(&score_a).unwrap()
        });

        matches.into_iter().take(max_results).collect()
    }

    /// Get entity knowledge
    pub fn get_entity_knowledge(&self, entity: &str) -> Option<&EntityKnowledge> {
        self.entities.get(&entity.to_lowercase())
    }

    /// Get all entities
    pub fn get_all_entities(&self) -> Vec<EntityKnowledge> {
        self.entities.values().cloned().collect()
    }

    /// Get current Ω (Omega) metric
    pub fn get_omega_metric(&self) -> f64 {
        self.omega_metric
    }

    /// Check if Ω threshold is met (φ³ ≈ 4.236)
    pub fn is_omega_threshold_met(&self) -> bool {
        let phi_cubed = 1.618_f64.powi(3);
        self.omega_metric >= phi_cubed
    }

    /// Get learning progress
    pub fn get_learning_progress(&self) -> LearningProgress {
        LearningProgress {
            total_patterns: self.patterns.len(),
            total_entities: self.entities.len(),
            omega_metric: self.omega_metric,
            phi_threshold: 1.618_f64.powi(3),
            threshold_met: self.is_omega_threshold_met(),
            reflexion_cycles: self.reflexion_history.len(),
            average_success_rate: self.calculate_average_success_rate(),
        }
    }

    /// Calculate average success rate across all patterns
    fn calculate_average_success_rate(&self) -> f64 {
        if self.patterns.is_empty() {
            return 0.0;
        }

        let total: f64 = self.patterns.values()
            .map(|p| p.success_rate)
            .sum();

        total / self.patterns.len() as f64
    }

    /// Encode entity to Fibonacci-based bits
    fn encode_entity_to_bits(entity: &str) -> Vec<u64> {
        let fibs = vec![1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];

        entity.bytes()
            .map(|b| {
                let index = (b as usize) % fibs.len();
                fibs[index]
            })
            .collect()
    }

    /// Infer entity type from name
    fn infer_entity_type(entity: &str) -> EntityType {
        let upper = entity.to_uppercase();

        if upper.len() <= 5 && upper.chars().all(|c| c.is_alphabetic()) {
            EntityType::Ticker
        } else if ["RSI", "MACD", "SMA", "EMA", "BOLLINGER"].contains(&upper.as_str()) {
            EntityType::Indicator
        } else {
            EntityType::Concept
        }
    }

    /// Classify pattern type
    fn classify_pattern_type(concept: &str) -> PatternType {
        let lower = concept.to_lowercase();

        if lower.contains("market") || lower.contains("trend") {
            PatternType::MarketAnalysis
        } else if lower.contains("rsi") || lower.contains("macd") || lower.contains("indicator") {
            PatternType::TechnicalIndicator
        } else if lower.contains("risk") || lower.contains("volatility") {
            PatternType::RiskAssessment
        } else if lower.contains("strategy") || lower.contains("trade") {
            PatternType::StrategyRecommendation
        } else if lower.contains("sentiment") {
            PatternType::SentimentAnalysis
        } else {
            PatternType::EntityRecognition
        }
    }

    /// Export learning data for persistence
    pub fn export_learning_data(&self) -> LearningSnapshot {
        LearningSnapshot {
            session_id: self.session_id.clone(),
            patterns: self.patterns.clone(),
            entities: self.entities.clone(),
            omega_metric: self.omega_metric,
            timestamp: Utc::now(),
        }
    }

    /// Import learning data from persistence
    pub fn import_learning_data(&mut self, snapshot: LearningSnapshot) {
        self.patterns = snapshot.patterns;
        self.entities = snapshot.entities;
        self.omega_metric = snapshot.omega_metric;

        log::info!("Imported learning data: {} patterns, {} entities, Ω={:.3}",
            self.patterns.len(), self.entities.len(), self.omega_metric);
    }
}

/// Learning progress summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningProgress {
    pub total_patterns: usize,
    pub total_entities: usize,
    pub omega_metric: f64,
    pub phi_threshold: f64,
    pub threshold_met: bool,
    pub reflexion_cycles: usize,
    pub average_success_rate: f64,
}

/// Learning data snapshot for persistence
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LearningSnapshot {
    pub session_id: String,
    pub patterns: HashMap<String, ConversationPattern>,
    pub entities: HashMap<String, EntityKnowledge>,
    pub omega_metric: f64,
    pub timestamp: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_learning_engine_creation() {
        let engine = LearningEngine::new("test-session".to_string());
        assert_eq!(engine.session_id, "test-session");
        assert_eq!(engine.omega_metric, 0.0);
    }

    #[test]
    fn test_learn_from_feedback() {
        let mut engine = LearningEngine::new("test-session".to_string());

        let feedback = LearningFeedback {
            conversation_id: "conv-1".to_string(),
            message_id: "msg-1".to_string(),
            helpful: true,
            accuracy: Some(0.9),
            entities_mentioned: vec!["SPY".to_string(), "AAPL".to_string()],
            concepts: vec!["bullish-trend".to_string()],
            sentiment: Sentiment::Bullish,
            user_rating: Some(5),
            timestamp: Utc::now(),
        };

        let result = engine.learn_from_feedback(feedback);
        assert!(result.is_ok());
        assert!(engine.omega_metric > 0.0);
        assert_eq!(engine.entities.len(), 2);
    }

    #[test]
    fn test_omega_threshold() {
        let mut engine = LearningEngine::new("test-session".to_string());
        engine.omega_metric = 5.0;

        assert!(engine.is_omega_threshold_met());
    }

    #[test]
    fn test_pattern_search() {
        let mut engine = LearningEngine::new("test-session".to_string());

        let pattern = ConversationPattern {
            pattern_id: "p1".to_string(),
            pattern_type: PatternType::MarketAnalysis,
            trigger_keywords: vec!["bullish".to_string()],
            successful_responses: vec![],
            context_requirements: vec![],
            confidence: 0.8,
            usage_count: 5,
            success_rate: 0.9,
            last_used: Utc::now(),
        };

        engine.patterns.insert("p1".to_string(), pattern);

        let results = engine.search_patterns("bullish", 10);
        assert_eq!(results.len(), 1);
    }
}

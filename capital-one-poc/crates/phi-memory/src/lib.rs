//! # Phi Memory - AgentDB-Equivalent Memory System
//!
//! Episode storage, reflexion learning, skill extraction, and causal discovery.
//! All operations via Latent-N encoding for efficient memory compression.

use anyhow::{Context, Result};
use dashmap::DashMap;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Episode represents a single interaction or experience
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Episode {
    pub id: String,
    pub timestamp: u64,
    pub context: String,
    pub action: String,
    pub outcome: Outcome,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Outcome {
    Success(String),
    Failure(String),
    Partial(String, f64), // outcome, score
}

/// Extracted skill from episodes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    pub id: String,
    pub name: String,
    pub pattern: Vec<String>,
    pub confidence: f64,
    pub usage_count: u64,
}

/// Causal relationship discovered from episodes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CausalEdge {
    pub from: String,
    pub to: String,
    pub strength: f64,
    pub confidence: f64,
}

/// Latent-N encoded memory block
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LatentMemory {
    pub encoding: Vec<f32>,
    pub metadata: HashMap<String, String>,
    pub compression_ratio: f64,
}

/// Core memory system - AgentDB equivalent
pub struct PhiMemory {
    episodes: Arc<DashMap<String, Episode>>,
    skills: Arc<RwLock<Vec<Skill>>>,
    causal_graph: Arc<RwLock<Vec<CausalEdge>>>,
    latent_store: Arc<DashMap<String, LatentMemory>>,
}

impl PhiMemory {
    pub fn new() -> Self {
        Self {
            episodes: Arc::new(DashMap::new()),
            skills: Arc::new(RwLock::new(Vec::new())),
            causal_graph: Arc::new(RwLock::new(Vec::new())),
            latent_store: Arc::new(DashMap::new()),
        }
    }

    /// Store episode with automatic indexing
    pub async fn store_episode(&self, episode: Episode) -> Result<()> {
        self.episodes.insert(episode.id.clone(), episode);
        Ok(())
    }

    /// Retrieve episode by ID
    pub async fn get_episode(&self, id: &str) -> Option<Episode> {
        self.episodes.get(id).map(|e| e.clone())
    }

    /// Query episodes by context pattern
    pub async fn query_episodes(&self, pattern: &str) -> Vec<Episode> {
        self.episodes
            .iter()
            .filter(|entry| entry.value().context.contains(pattern))
            .map(|entry| entry.value().clone())
            .collect()
    }

    /// Extract skills from episode patterns (reflexion learning)
    pub async fn extract_skills(&self) -> Result<Vec<Skill>> {
        let episodes: Vec<_> = self.episodes.iter().map(|e| e.value().clone()).collect();

        // Group by successful patterns
        let mut patterns: HashMap<String, u64> = HashMap::new();
        for episode in &episodes {
            if matches!(episode.outcome, Outcome::Success(_)) {
                *patterns.entry(episode.action.clone()).or_insert(0) += 1;
            }
        }

        // Create skills from frequent patterns
        let mut skills = Vec::new();
        for (pattern, count) in patterns {
            if count > 2 {
                // Threshold for skill extraction
                let skill = Skill {
                    id: format!("skill_{}", uuid_simple()),
                    name: format!("Skill: {}", pattern),
                    pattern: vec![pattern],
                    confidence: (count as f64) / (episodes.len() as f64),
                    usage_count: count,
                };
                skills.push(skill.clone());
            }
        }

        *self.skills.write().await = skills.clone();
        Ok(skills)
    }

    /// Discover causal relationships from episodes
    pub async fn discover_causality(&self) -> Result<Vec<CausalEdge>> {
        let episodes: Vec<_> = self.episodes.iter().map(|e| e.value().clone()).collect();
        let mut edges = Vec::new();

        // Analyze temporal sequences
        for window in episodes.windows(2) {
            if window.len() == 2 {
                let prev = &window[0];
                let next = &window[1];

                // Check if outcome of prev relates to context of next
                if let Outcome::Success(ref outcome) = prev.outcome {
                    if next.context.contains(outcome) {
                        edges.push(CausalEdge {
                            from: prev.id.clone(),
                            to: next.id.clone(),
                            strength: 0.8,
                            confidence: 0.7,
                        });
                    }
                }
            }
        }

        *self.causal_graph.write().await = edges.clone();
        Ok(edges)
    }

    /// Encode memory with Latent-N compression
    pub async fn encode_latent(&self, key: &str, data: &[u8]) -> Result<LatentMemory> {
        // Simplified encoding: convert to f32 normalized values
        let encoding: Vec<f32> = data
            .iter()
            .map(|&b| b as f32 / 255.0)
            .collect();

        let original_size = data.len();
        let compressed_size = encoding.len() * 4; // f32 = 4 bytes
        let compression_ratio = original_size as f64 / compressed_size as f64;

        let memory = LatentMemory {
            encoding,
            metadata: HashMap::new(),
            compression_ratio,
        };

        self.latent_store.insert(key.to_string(), memory.clone());
        Ok(memory)
    }

    /// Decode Latent-N memory
    pub async fn decode_latent(&self, key: &str) -> Result<Vec<u8>> {
        let memory = self
            .latent_store
            .get(key)
            .context("Memory not found")?;

        let decoded: Vec<u8> = memory
            .encoding
            .iter()
            .map(|&f| (f * 255.0) as u8)
            .collect();

        Ok(decoded)
    }

    /// Get memory statistics
    pub async fn stats(&self) -> MemoryStats {
        MemoryStats {
            episode_count: self.episodes.len(),
            skill_count: self.skills.read().await.len(),
            causal_edge_count: self.causal_graph.read().await.len(),
            latent_memory_count: self.latent_store.len(),
        }
    }

    /// Consolidate skills (merge similar patterns)
    pub async fn consolidate_skills(&self, threshold: f64) -> Result<()> {
        let mut skills = self.skills.write().await;
        let mut consolidated = Vec::new();
        let mut processed = std::collections::HashSet::new();

        for (i, skill) in skills.iter().enumerate() {
            if processed.contains(&i) {
                continue;
            }

            let mut merged = skill.clone();
            for (j, other) in skills.iter().enumerate() {
                if i != j && !processed.contains(&j) {
                    // Simple similarity check based on pattern overlap
                    let similarity = calculate_similarity(&skill.pattern, &other.pattern);
                    if similarity > threshold {
                        merged.confidence = (merged.confidence + other.confidence) / 2.0;
                        merged.usage_count += other.usage_count;
                        processed.insert(j);
                    }
                }
            }
            consolidated.push(merged);
            processed.insert(i);
        }

        *skills = consolidated;
        Ok(())
    }
}

impl Default for PhiMemory {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryStats {
    pub episode_count: usize,
    pub skill_count: usize,
    pub causal_edge_count: usize,
    pub latent_memory_count: usize,
}

fn uuid_simple() -> String {
    format!("{:x}", std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos())
}

fn calculate_similarity(a: &[String], b: &[String]) -> f64 {
    let set_a: std::collections::HashSet<_> = a.iter().collect();
    let set_b: std::collections::HashSet<_> = b.iter().collect();
    let intersection = set_a.intersection(&set_b).count();
    let union = set_a.union(&set_b).count();
    intersection as f64 / union as f64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_store_episode() {
        let memory = PhiMemory::new();
        let episode = Episode {
            id: "test1".to_string(),
            timestamp: 12345,
            context: "test context".to_string(),
            action: "test action".to_string(),
            outcome: Outcome::Success("done".to_string()),
            metadata: HashMap::new(),
        };

        assert!(memory.store_episode(episode).await.is_ok());
        assert!(memory.get_episode("test1").await.is_some());
    }

    #[tokio::test]
    async fn test_extract_skills() {
        let memory = PhiMemory::new();
        for i in 0..5 {
            let episode = Episode {
                id: format!("ep{}", i),
                timestamp: i,
                context: "context".to_string(),
                action: "repeated_action".to_string(),
                outcome: Outcome::Success("done".to_string()),
                metadata: HashMap::new(),
            };
            memory.store_episode(episode).await.unwrap();
        }

        let skills = memory.extract_skills().await.unwrap();
        assert!(!skills.is_empty());
    }

    #[tokio::test]
    async fn test_latent_encoding() {
        let memory = PhiMemory::new();
        let data = vec![1u8, 2, 3, 4, 5];
        let encoded = memory.encode_latent("test", &data).await.unwrap();
        assert_eq!(encoded.encoding.len(), 5);

        let decoded = memory.decode_latent("test").await.unwrap();
        assert_eq!(decoded.len(), 5);
    }
}

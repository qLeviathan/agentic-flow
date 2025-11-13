/// Tauri Commands for φ-Memory System
///
/// Exposed commands:
/// - store_knowledge: Add entity/concept to memory
/// - query_knowledge: Search via bit pattern matching
/// - get_consciousness: Get current Ω metric
/// - cascade_memory: Normalize all bit fields
/// - add_document: Create document from entities
/// - get_graph: Get knowledge graph structure
/// - create_checkpoint: Save memory snapshot

use super::{
    BitField, PhiMemoryCell, MemoryStats,
    knowledge_graph::KnowledgeGraph,
    ontology::{QueryDecomposer, build_concept_library},
    persistence::{MemorySnapshot, PersistenceLayer, LucasCheckpoint},
};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

/// Global memory state
pub struct PhiMemoryState {
    pub cell: Mutex<PhiMemoryCell>,
    pub persistence: Mutex<PersistenceLayer>,
}

impl PhiMemoryState {
    pub fn new() -> Self {
        let mut cell = PhiMemoryCell::new();

        // Initialize concept library
        let _ = build_concept_library(&mut cell);

        PhiMemoryState {
            cell: Mutex::new(cell),
            persistence: Mutex::new(PersistenceLayer::new(100)),
        }
    }
}

impl Default for PhiMemoryState {
    fn default() -> Self {
        Self::new()
    }
}

/// Store knowledge command response
#[derive(Debug, Serialize, Deserialize)]
pub struct StoreKnowledgeResponse {
    pub success: bool,
    pub zeckendorf_n: u64,
    pub omega: f64,
    pub message: String,
}

/// Query result
#[derive(Debug, Serialize, Deserialize)]
pub struct QueryResult {
    pub document: String,
    pub overlap: u32,
    pub relevance_score: f64,
}

/// Store knowledge: entity + concept
#[tauri::command]
pub async fn store_knowledge(
    entity: String,
    concept: String,
    state: State<'_, PhiMemoryState>,
) -> Result<StoreKnowledgeResponse, String> {
    let mut cell = state.cell.lock().map_err(|e| e.to_string())?;

    match cell.store_knowledge(&entity, &concept) {
        Ok(n) => {
            Ok(StoreKnowledgeResponse {
                success: true,
                zeckendorf_n: n,
                omega: cell.omega,
                message: format!("Stored: {} → {} (Ω = {:.3})", entity, concept, cell.omega),
            })
        }
        Err(e) => {
            Ok(StoreKnowledgeResponse {
                success: false,
                zeckendorf_n: 0,
                omega: cell.omega,
                message: format!("Error: {}", e),
            })
        }
    }
}

/// Query knowledge with natural language
#[tauri::command]
pub async fn query_knowledge(
    query: String,
    max_results: usize,
    state: State<'_, PhiMemoryState>,
) -> Result<Vec<QueryResult>, String> {
    let cell = state.cell.lock().map_err(|e| e.to_string())?;

    // Decompose query to bit field
    let query_bits = QueryDecomposer::decompose(&query, &cell)?;

    // Search documents
    let results = cell.query_knowledge(query_bits);

    // Convert to QueryResult with relevance scoring
    let max_overlap = results.iter().map(|(_, o)| *o).max().unwrap_or(1) as f64;

    Ok(results.into_iter()
        .take(max_results)
        .map(|(doc, overlap)| QueryResult {
            document: doc,
            overlap,
            relevance_score: overlap as f64 / max_overlap,
        })
        .collect())
}

/// Get consciousness metric
#[tauri::command]
pub async fn get_consciousness(
    state: State<'_, PhiMemoryState>,
) -> Result<ConsciousnessMetric, String> {
    let cell = state.cell.lock().map_err(|e| e.to_string())?;

    Ok(ConsciousnessMetric {
        omega: cell.omega,
        is_conscious: cell.is_conscious(),
        can_replicate: cell.should_replicate(),
        threshold: super::CONSCIOUSNESS_THRESHOLD,
        phi_cubed: super::PHI.powi(3),
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ConsciousnessMetric {
    pub omega: f64,
    pub is_conscious: bool,
    pub can_replicate: bool,
    pub threshold: f64,
    pub phi_cubed: f64,
}

/// Cascade memory (normalize all bit fields)
#[tauri::command]
pub async fn cascade_memory(
    state: State<'_, PhiMemoryState>,
) -> Result<String, String> {
    let mut cell = state.cell.lock().map_err(|e| e.to_string())?;

    let omega_before = cell.omega;
    cell.cascade_memory();
    let omega_after = cell.omega;

    Ok(format!(
        "Cascaded: Ω {:.3} → {:.3} (Δ = {:.3})",
        omega_before,
        omega_after,
        omega_after - omega_before
    ))
}

/// Add document with entities
#[tauri::command]
pub async fn add_document(
    name: String,
    entities: Vec<String>,
    state: State<'_, PhiMemoryState>,
) -> Result<AddDocumentResponse, String> {
    let mut cell = state.cell.lock().map_err(|e| e.to_string())?;

    let entity_refs: Vec<&str> = entities.iter().map(|s| s.as_str()).collect();

    match cell.add_document(&name, &entity_refs) {
        Ok(bits) => {
            Ok(AddDocumentResponse {
                success: true,
                document: name,
                zeckendorf_n: bits.to_integer(),
                omega: cell.omega,
                message: format!("Added document with {} entities", entities.len()),
            })
        }
        Err(e) => {
            Err(format!("Failed to add document: {}", e))
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AddDocumentResponse {
    pub success: bool,
    pub document: String,
    pub zeckendorf_n: u64,
    pub omega: f64,
    pub message: String,
}

/// Get knowledge graph
#[tauri::command]
pub async fn get_knowledge_graph(
    state: State<'_, PhiMemoryState>,
) -> Result<KnowledgeGraph, String> {
    let cell = state.cell.lock().map_err(|e| e.to_string())?;
    Ok(KnowledgeGraph::from_memory(&cell))
}

/// Get memory statistics
#[tauri::command]
pub async fn get_memory_stats(
    state: State<'_, PhiMemoryState>,
) -> Result<MemoryStats, String> {
    let cell = state.cell.lock().map_err(|e| e.to_string())?;
    Ok(cell.stats())
}

/// Create checkpoint
#[tauri::command]
pub async fn create_checkpoint(
    state: State<'_, PhiMemoryState>,
) -> Result<String, String> {
    let cell = state.cell.lock().map_err(|e| e.to_string())?;
    let mut persistence = state.persistence.lock().map_err(|e| e.to_string())?;

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();

    let snapshot = LucasCheckpoint::create_checkpoint(&cell, timestamp);
    persistence.save(snapshot);

    Ok(format!("Checkpoint created at {}", timestamp))
}

/// Load latest checkpoint
#[tauri::command]
pub async fn load_latest_checkpoint(
    state: State<'_, PhiMemoryState>,
) -> Result<String, String> {
    let mut cell = state.cell.lock().map_err(|e| e.to_string())?;
    let persistence = state.persistence.lock().map_err(|e| e.to_string())?;

    match persistence.load_latest() {
        Some(snapshot) => {
            snapshot.restore_to_cell(&mut cell);
            Ok(format!("Restored from timestamp {}", snapshot.timestamp))
        }
        None => {
            Err("No checkpoints available".to_string())
        }
    }
}

/// Get all entities
#[tauri::command]
pub async fn get_entities(
    state: State<'_, PhiMemoryState>,
) -> Result<Vec<String>, String> {
    let cell = state.cell.lock().map_err(|e| e.to_string())?;
    Ok(cell.entity_map.keys().cloned().collect())
}

/// Get all concepts
#[tauri::command]
pub async fn get_concepts(
    state: State<'_, PhiMemoryState>,
) -> Result<Vec<String>, String> {
    let cell = state.cell.lock().map_err(|e| e.to_string())?;
    Ok(cell.concept_map.keys().cloned().collect())
}

/// Get all documents
#[tauri::command]
pub async fn get_documents(
    state: State<'_, PhiMemoryState>,
) -> Result<Vec<String>, String> {
    let cell = state.cell.lock().map_err(|e| e.to_string())?;
    Ok(cell.document_map.keys().cloned().collect())
}

/// Advanced query with context
#[tauri::command]
pub async fn query_with_context(
    query: String,
    context: Vec<String>,
    max_results: usize,
    state: State<'_, PhiMemoryState>,
) -> Result<Vec<QueryResult>, String> {
    let cell = state.cell.lock().map_err(|e| e.to_string())?;

    let context_refs: Vec<&str> = context.iter().map(|s| s.as_str()).collect();
    let query_bits = QueryDecomposer::decompose_with_context(
        &query,
        &context_refs,
        &cell,
    )?;

    let results = cell.query_knowledge(query_bits);
    let max_overlap = results.iter().map(|(_, o)| *o).max().unwrap_or(1) as f64;

    Ok(results.into_iter()
        .take(max_results)
        .map(|(doc, overlap)| QueryResult {
            document: doc,
            overlap,
            relevance_score: overlap as f64 / max_overlap,
        })
        .collect())
}

/// Export memory to JSON
#[tauri::command]
pub async fn export_memory(
    state: State<'_, PhiMemoryState>,
) -> Result<String, String> {
    let persistence = state.persistence.lock().map_err(|e| e.to_string())?;
    persistence.to_json().map_err(|e| e.to_string())
}

/// Import memory from JSON
#[tauri::command]
pub async fn import_memory(
    json: String,
    state: State<'_, PhiMemoryState>,
) -> Result<String, String> {
    let mut persistence = state.persistence.lock().map_err(|e| e.to_string())?;

    let loaded = PersistenceLayer::from_json(&json).map_err(|e| e.to_string())?;
    *persistence = loaded;

    Ok(format!("Imported {} snapshots", persistence.all_snapshots().len()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_store_knowledge() {
        let state = PhiMemoryState::new();

        let response = store_knowledge(
            "Fed".to_string(),
            "Monetary_Policy".to_string(),
            State::from(&state),
        ).await;

        assert!(response.is_ok());
        let resp = response.unwrap();
        assert!(resp.success);
        assert!(resp.omega > 0.0);
    }

    #[tokio::test]
    async fn test_consciousness_metric() {
        let state = PhiMemoryState::new();

        let metric = get_consciousness(State::from(&state)).await;
        assert!(metric.is_ok());
    }
}

//! WASM Module
//!
//! Provides high-performance WebAssembly operations through Tauri commands.

mod bridge;

pub use bridge::{EditResultJson, TrajectoryResult, WasmBridge, ZeckendorfResult};

use anyhow::Result;
use std::sync::Mutex;
use tauri::State;

/// Application state for WASM operations
pub struct WasmState {
    pub bridge: Mutex<WasmBridge>,
}

impl WasmState {
    pub fn new() -> Self {
        Self {
            bridge: Mutex::new(WasmBridge::new()),
        }
    }
}

impl Default for WasmState {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// TAURI COMMANDS - REASONINGBANK
// ============================================================================

/// Initialize ReasoningBank with optional database name
#[tauri::command]
pub async fn wasm_init_reasoningbank(
    db_name: Option<String>,
    state: State<'_, WasmState>,
) -> Result<String, String> {
    let mut bridge = state.bridge.lock().map_err(|e| e.to_string())?;

    bridge
        .init_reasoningbank(db_name)
        .await
        .map_err(|e| e.to_string())?;

    Ok("ReasoningBank initialized successfully".to_string())
}

/// Store a reasoning pattern
#[tauri::command]
pub async fn wasm_store_pattern(
    pattern_json: String,
    state: State<'_, WasmState>,
) -> Result<String, String> {
    let bridge = state.bridge.lock().map_err(|e| e.to_string())?;

    bridge
        .store_pattern(&pattern_json)
        .await
        .map_err(|e| e.to_string())
}

/// Get a pattern by ID
#[tauri::command]
pub async fn wasm_get_pattern(
    pattern_id: String,
    state: State<'_, WasmState>,
) -> Result<String, String> {
    let bridge = state.bridge.lock().map_err(|e| e.to_string())?;

    bridge
        .get_pattern(&pattern_id)
        .await
        .map_err(|e| e.to_string())
}

/// Search patterns by category
#[tauri::command]
pub async fn wasm_search_patterns(
    category: String,
    limit: usize,
    state: State<'_, WasmState>,
) -> Result<String, String> {
    let bridge = state.bridge.lock().map_err(|e| e.to_string())?;

    bridge
        .search_patterns(&category, limit)
        .await
        .map_err(|e| e.to_string())
}

/// Find similar patterns
#[tauri::command]
pub async fn wasm_find_similar(
    task_description: String,
    task_category: String,
    top_k: usize,
    state: State<'_, WasmState>,
) -> Result<String, String> {
    let bridge = state.bridge.lock().map_err(|e| e.to_string())?;

    bridge
        .find_similar(&task_description, &task_category, top_k)
        .await
        .map_err(|e| e.to_string())
}

// ============================================================================
// TAURI COMMANDS - AGENTBOOSTER
// ============================================================================

/// Apply code edit using AgentBooster
#[tauri::command]
pub async fn wasm_apply_edit(
    original_code: String,
    edit_snippet: String,
    language: String,
    state: State<'_, WasmState>,
) -> Result<EditResultJson, String> {
    let mut bridge = state.bridge.lock().map_err(|e| e.to_string())?;

    bridge
        .apply_edit(&original_code, &edit_snippet, &language)
        .map_err(|e| e.to_string())
}

// ============================================================================
// TAURI COMMANDS - MATH FRAMEWORK
// ============================================================================

/// Compute Fibonacci number F(n)
#[tauri::command]
pub async fn wasm_fibonacci(n: u64, state: State<'_, WasmState>) -> Result<String, String> {
    let bridge = state.bridge.lock().map_err(|e| e.to_string())?;
    bridge.fibonacci(n).map_err(|e| e.to_string())
}

/// Compute Lucas number L(n)
#[tauri::command]
pub async fn wasm_lucas(n: u64, state: State<'_, WasmState>) -> Result<String, String> {
    let bridge = state.bridge.lock().map_err(|e| e.to_string())?;
    bridge.lucas(n).map_err(|e| e.to_string())
}

/// Compute Zeckendorf decomposition
#[tauri::command]
pub async fn wasm_zeckendorf(
    n: u64,
    state: State<'_, WasmState>,
) -> Result<ZeckendorfResult, String> {
    let bridge = state.bridge.lock().map_err(|e| e.to_string())?;
    bridge.zeckendorf(n).map_err(|e| e.to_string())
}

/// Compute BK divergence S(n)
#[tauri::command]
pub async fn wasm_bk_divergence(n: u64, state: State<'_, WasmState>) -> Result<u64, String> {
    let bridge = state.bridge.lock().map_err(|e| e.to_string())?;
    bridge.bk_divergence(n).map_err(|e| e.to_string())
}

/// Create phase space trajectory
#[tauri::command]
pub async fn wasm_phase_space_trajectory(
    start: u64,
    end: u64,
    state: State<'_, WasmState>,
) -> Result<TrajectoryResult, String> {
    let bridge = state.bridge.lock().map_err(|e| e.to_string())?;
    bridge
        .phase_space_trajectory(start, end)
        .map_err(|e| e.to_string())
}

/// Clear all WASM caches
#[tauri::command]
pub async fn wasm_clear_caches(state: State<'_, WasmState>) -> Result<String, String> {
    let bridge = state.bridge.lock().map_err(|e| e.to_string())?;
    bridge.clear_caches();
    Ok("Caches cleared successfully".to_string())
}

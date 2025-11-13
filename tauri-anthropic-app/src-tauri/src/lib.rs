// Prevent console window on Windows in release mode
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

pub mod anthropic;
pub mod commands;
pub mod keychain;
pub mod wasm;
pub mod overlay;
pub mod vision;
pub mod aurelia_integration;
pub mod aurelia;
pub mod phi_memory;

use commands::{AppState, init_client, init_with_keychain, is_initialized, send_message, send_text};
use keychain::KeychainStorage;
use wasm::WasmState;
use overlay::OverlayState;
use vision::VisionSystemState;
use aurelia_integration::AureliaState;
use aurelia::commands::AureliaChatState;
use phi_memory::commands::PhiMemoryState;
use std::sync::Mutex;
use tauri::State;

/// Application state holding keychain storage
struct KeychainState {
    keychain: Mutex<KeychainStorage>,
}

/// Save API key to system keychain
///
/// # Security
/// - Never logs the actual key
/// - Uses OS-level encryption
/// - Validates key format before storing
#[tauri::command]
fn save_api_key(api_key: String, state: State<KeychainState>) -> Result<String, String> {
    log::info!("Attempting to save API key to keychain");

    let keychain = state.keychain.lock().map_err(|e| {
        log::error!("Failed to acquire keychain lock: {}", e);
        "Failed to access keychain".to_string()
    })?;

    keychain.save_api_key(&api_key).map_err(|e| {
        log::error!("Failed to save API key: {}", e);
        format!("Failed to save API key: {}", e)
    })?;

    Ok("API key saved successfully".to_string())
}

/// Retrieve API key from system keychain
///
/// # Security
/// - Key is only retrieved when needed
/// - Never logged in plaintext
/// - Encrypted by OS keychain
#[tauri::command]
fn get_api_key(state: State<KeychainState>) -> Result<String, String> {
    log::debug!("Retrieving API key from keychain");

    let keychain = state.keychain.lock().map_err(|e| {
        log::error!("Failed to acquire keychain lock: {}", e);
        "Failed to access keychain".to_string()
    })?;

    keychain.get_api_key().map_err(|e| {
        log::warn!("Failed to retrieve API key: {}", e);
        "API key not found. Please configure your Anthropic API key.".to_string()
    })
}

/// Delete API key from system keychain
#[tauri::command]
fn delete_api_key(state: State<KeychainState>) -> Result<String, String> {
    log::info!("Attempting to delete API key from keychain");

    let keychain = state.keychain.lock().map_err(|e| {
        log::error!("Failed to acquire keychain lock: {}", e);
        "Failed to access keychain".to_string()
    })?;

    keychain.delete_api_key().map_err(|e| {
        log::error!("Failed to delete API key: {}", e);
        format!("Failed to delete API key: {}", e)
    })?;

    Ok("API key deleted successfully".to_string())
}

/// Check if API key exists in keychain
#[tauri::command]
fn has_api_key(state: State<KeychainState>) -> Result<bool, String> {
    let keychain = state.keychain.lock().map_err(|e| {
        log::error!("Failed to acquire keychain lock: {}", e);
        "Failed to access keychain".to_string()
    })?;

    Ok(keychain.has_api_key())
}

/// Validate stored API key
#[tauri::command]
fn validate_api_key(state: State<KeychainState>) -> Result<bool, String> {
    let keychain = state.keychain.lock().map_err(|e| {
        log::error!("Failed to acquire keychain lock: {}", e);
        "Failed to access keychain".to_string()
    })?;

    Ok(keychain.validate_api_key())
}

/// Run the Tauri application
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize logger
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    log::info!("Starting Tauri Anthropic App with secure keychain storage");

    // Initialize keychain storage
    let keychain = KeychainStorage::new("tauri-anthropic-app");

    // Check if keychain is available
    if !keychain::check_keychain_availability() {
        log::warn!("Keychain may not be available on this platform");
    }

    // Create application state for Anthropic client
    let app_state = AppState::new();

    tauri::Builder::default()
        .manage(app_state)
        .manage(KeychainState {
            keychain: Mutex::new(keychain),
        })
        .manage(WasmState::new())
        .manage(OverlayState::default())
        .manage(VisionSystemState::new())
        .manage(AureliaState::new())
        .manage(AureliaChatState::new())
        .manage(PhiMemoryState::new())
        .invoke_handler(tauri::generate_handler![
            // Keychain commands
            save_api_key,
            get_api_key,
            delete_api_key,
            has_api_key,
            validate_api_key,
            // Anthropic API commands
            init_client,
            init_with_keychain,
            send_message,
            send_text,
            is_initialized,
            // Overlay commands
            overlay::toggle_overlay,
            overlay::get_overlay_state,
            overlay::toggle_ticker,
            overlay::get_ticker_data,
            overlay::start_ticker_stream,
            overlay::get_phase_space_visualization,
            overlay::start_aurelia_session,
            overlay::get_aurelia_state,
            overlay::aurelia_interact,
            overlay::end_aurelia_session,
            // WASM - ReasoningBank
            wasm::wasm_init_reasoningbank,
            wasm::wasm_store_pattern,
            wasm::wasm_get_pattern,
            wasm::wasm_search_patterns,
            wasm::wasm_find_similar,
            // WASM - AgentBooster
            wasm::wasm_apply_edit,
            // WASM - Math Framework
            wasm::wasm_fibonacci,
            wasm::wasm_lucas,
            wasm::wasm_zeckendorf,
            wasm::wasm_bk_divergence,
            wasm::wasm_phase_space_trajectory,
            wasm::wasm_clear_caches,
            // Vision System commands
            vision::start_vision_capture,
            vision::stop_vision_capture,
            vision::get_phase_space_stream,
            vision::get_capture_metrics,
            vision::configure_ocr,
            vision::list_capture_sessions,
            vision::get_monitors,
            // AURELIA Integration commands
            aurelia_integration::aurelia_initialize,
            aurelia_integration::aurelia_start_session,
            aurelia_integration::aurelia_end_session,
            aurelia_integration::aurelia_interact,
            aurelia_integration::aurelia_get_state,
            aurelia_integration::aurelia_get_consciousness,
            aurelia_integration::aurelia_get_trading_strategy,
            aurelia_integration::aurelia_process_market_data,
            aurelia_integration::aurelia_detect_nash,
            aurelia_integration::aurelia_get_insights,
            aurelia_integration::aurelia_get_system_status,
            aurelia_integration::aurelia_get_health,
            aurelia_integration::aurelia_subscribe_events,
            aurelia_integration::aurelia_get_performance_metrics,
            aurelia_integration::aurelia_shutdown,
            // AURELIA Chat commands
            aurelia::commands::aurelia_chat_init,
            aurelia::commands::aurelia_chat,
            aurelia::commands::aurelia_chat_stream,
            aurelia::commands::aurelia_get_context,
            aurelia::commands::aurelia_learn,
            aurelia::commands::aurelia_get_personality,
            aurelia::commands::aurelia_get_learning_progress,
            aurelia::commands::aurelia_reset_context,
            aurelia::commands::aurelia_get_history,
            aurelia::commands::aurelia_set_market_context,
            // φ-Memory System commands
            phi_memory::commands::store_knowledge,
            phi_memory::commands::query_knowledge,
            phi_memory::commands::get_consciousness,
            phi_memory::commands::cascade_memory,
            phi_memory::commands::add_document,
            phi_memory::commands::get_knowledge_graph,
            phi_memory::commands::get_memory_stats,
            phi_memory::commands::create_checkpoint,
            phi_memory::commands::load_latest_checkpoint,
            phi_memory::commands::get_entities,
            phi_memory::commands::get_concepts,
            phi_memory::commands::get_documents,
            phi_memory::commands::query_with_context,
            phi_memory::commands::export_memory,
            phi_memory::commands::import_memory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/**
 * Tauri Command Handlers for Vision System
 *
 * Exposes vision capture functionality to the frontend via Tauri IPC.
 */

use crate::vision::{
    pipeline::{VisionPipeline, PipelineMetrics},
    ocr::OCRConfig,
    mapping::PhaseSpacePoint,
};
use tauri::{command, State, Window};
use std::sync::Arc;
use tokio::sync::Mutex;
use std::collections::HashMap;
use serde::{Serialize, Deserialize};

/// Vision system state shared across commands
pub struct VisionSystemState {
    pub pipelines: Arc<Mutex<HashMap<String, Arc<VisionPipeline>>>>,
}

impl VisionSystemState {
    pub fn new() -> Self {
        Self {
            pipelines: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

/// Capture session configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureConfig {
    pub monitor_index: usize,
    pub screen_width: u32,
    pub screen_height: u32,
    pub ocr_config: OCRConfig,
}

impl Default for CaptureConfig {
    fn default() -> Self {
        Self {
            monitor_index: 0,
            screen_width: 1920,
            screen_height: 1080,
            ocr_config: OCRConfig::default(),
        }
    }
}

/// Start vision capture session
#[command]
pub async fn start_vision_capture(
    config: CaptureConfig,
    state: State<'_, VisionSystemState>,
    window: Window,
) -> Result<String, String> {
    let pipeline = VisionPipeline::new(
        config.screen_width,
        config.screen_height,
        config.ocr_config,
    ).map_err(|e| e.to_string())?;

    let session_id = pipeline.get_session_id().to_string();
    let pipeline = Arc::new(pipeline);

    // Store pipeline
    {
        let mut pipelines = state.pipelines.lock().await;
        pipelines.insert(session_id.clone(), Arc::clone(&pipeline));
    }

    // Start pipeline in background
    let pipeline_clone = Arc::clone(&pipeline);
    let session_id_clone = session_id.clone();
    let window_clone = window.clone();

    tokio::spawn(async move {
        if let Err(e) = pipeline_clone.start(config.monitor_index).await {
            eprintln!("Pipeline error: {:?}", e);
            let _ = window_clone.emit("vision_error", e.to_string());
        }
    });

    // Start event emission task
    let pipeline_clone = Arc::clone(&pipeline);
    tokio::spawn(async move {
        loop {
            if let Ok(points) = pipeline_clone.get_latest_points(10).await {
                for point in points {
                    let _ = window.emit("phase_space_update", &point);
                }
            }

            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        }
    });

    Ok(session_id)
}

/// Stop vision capture session
#[command]
pub async fn stop_vision_capture(
    session_id: String,
    state: State<'_, VisionSystemState>,
) -> Result<(), String> {
    let mut pipelines = state.pipelines.lock().await;

    if let Some(pipeline) = pipelines.get(&session_id) {
        pipeline.stop().await.map_err(|e| e.to_string())?;
        pipelines.remove(&session_id);
        Ok(())
    } else {
        Err(format!("Session not found: {}", session_id))
    }
}

/// Get latest phase space points
#[command]
pub async fn get_phase_space_stream(
    session_id: String,
    limit: usize,
    state: State<'_, VisionSystemState>,
) -> Result<Vec<PhaseSpacePoint>, String> {
    let pipelines = state.pipelines.lock().await;

    if let Some(pipeline) = pipelines.get(&session_id) {
        pipeline.get_latest_points(limit).await
            .map_err(|e| e.to_string())
    } else {
        Err(format!("Session not found: {}", session_id))
    }
}

/// Get capture performance metrics
#[command]
pub async fn get_capture_metrics(
    session_id: String,
    state: State<'_, VisionSystemState>,
) -> Result<PipelineMetrics, String> {
    let pipelines = state.pipelines.lock().await;

    if let Some(pipeline) = pipelines.get(&session_id) {
        Ok(pipeline.get_metrics().await)
    } else {
        Err(format!("Session not found: {}", session_id))
    }
}

/// Update OCR configuration for active session
#[command]
pub async fn configure_ocr(
    session_id: String,
    config: OCRConfig,
    state: State<'_, VisionSystemState>,
) -> Result<(), String> {
    let pipelines = state.pipelines.lock().await;

    if let Some(pipeline) = pipelines.get(&session_id) {
        pipeline.update_ocr_config(config).await
            .map_err(|e| e.to_string())
    } else {
        Err(format!("Session not found: {}", session_id))
    }
}

/// List active capture sessions
#[command]
pub async fn list_capture_sessions(
    state: State<'_, VisionSystemState>,
) -> Result<Vec<String>, String> {
    let pipelines = state.pipelines.lock().await;
    Ok(pipelines.keys().cloned().collect())
}

/// Get monitor information
#[command]
pub async fn get_monitors() -> Result<Vec<MonitorInfo>, String> {
    // TODO: Query actual monitor information from OS
    Ok(vec![
        MonitorInfo {
            index: 0,
            name: "Primary Monitor".to_string(),
            width: 1920,
            height: 1080,
            is_primary: true,
        }
    ])
}

/// Monitor information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitorInfo {
    pub index: usize,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub is_primary: bool,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vision_system_state_creation() {
        let state = VisionSystemState::new();
        assert!(state.pipelines.try_lock().is_ok());
    }

    #[test]
    fn test_capture_config_default() {
        let config = CaptureConfig::default();
        assert_eq!(config.monitor_index, 0);
        assert_eq!(config.screen_width, 1920);
        assert_eq!(config.screen_height, 1080);
    }
}

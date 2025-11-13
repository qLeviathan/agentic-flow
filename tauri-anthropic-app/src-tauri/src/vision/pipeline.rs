/**
 * Real-Time Vision Processing Pipeline
 *
 * Orchestrates concurrent tasks:
 * - Screen capture at 60fps
 * - OCR processing at 6fps (every 10th frame)
 * - Phase space mapping at 60fps
 *
 * Uses async channels with tokio for streaming architecture.
 */

use crate::vision::{
    capture::{ScreenCapture, CaptureFrame, CaptureScheduler, FrameBuffer, create_screen_capture},
    ocr::{OCREngine, OCRConfig, OCRResult, TradingData},
    mapping::{CoordinateMapper, PhaseSpacePoint, SymplecticValidator},
};
use std::sync::Arc;
use tokio::sync::{Mutex, mpsc, RwLock};
use std::time::{Duration, Instant};
use serde::{Serialize, Deserialize};
use uuid::Uuid;

/// Vision pipeline orchestrator
pub struct VisionPipeline {
    session_id: String,
    capture: Arc<Mutex<Box<dyn ScreenCapture>>>,
    frame_buffer: Arc<FrameBuffer>,
    ocr_engine: Arc<Mutex<OCREngine>>,
    coordinate_mapper: Arc<Mutex<CoordinateMapper>>,
    symplectic_validator: Arc<SymplecticValidator>,

    // Output streams
    phase_space_tx: mpsc::Sender<PhaseSpacePoint>,
    phase_space_rx: Arc<Mutex<mpsc::Receiver<PhaseSpacePoint>>>,

    ocr_results_tx: mpsc::Sender<OCRResult>,
    ocr_results_rx: Arc<Mutex<mpsc::Receiver<OCRResult>>>,

    // State
    running: Arc<RwLock<bool>>,
    metrics: Arc<RwLock<PipelineMetrics>>,
}

impl VisionPipeline {
    pub fn new(
        width: u32,
        height: u32,
        ocr_config: OCRConfig,
    ) -> Result<Self, PipelineError> {
        let session_id = Uuid::new_v4().to_string();

        let capture = create_screen_capture();
        let frame_buffer = FrameBuffer::new(180); // 3 seconds at 60fps
        let ocr_engine = OCREngine::new(ocr_config)
            .map_err(|e| PipelineError::InitializationFailed(e.to_string()))?;
        let coordinate_mapper = CoordinateMapper::new(width, height);
        let symplectic_validator = SymplecticValidator::new(0.01);

        let (phase_space_tx, phase_space_rx) = mpsc::channel(1000);
        let (ocr_results_tx, ocr_results_rx) = mpsc::channel(100);

        Ok(Self {
            session_id,
            capture: Arc::new(Mutex::new(capture)),
            frame_buffer: Arc::new(frame_buffer),
            ocr_engine: Arc::new(Mutex::new(ocr_engine)),
            coordinate_mapper: Arc::new(Mutex::new(coordinate_mapper)),
            symplectic_validator: Arc::new(symplectic_validator),
            phase_space_tx,
            phase_space_rx: Arc::new(Mutex::new(phase_space_rx)),
            ocr_results_tx,
            ocr_results_rx: Arc::new(Mutex::new(ocr_results_rx)),
            running: Arc::new(RwLock::new(false)),
            metrics: Arc::new(RwLock::new(PipelineMetrics::default())),
        })
    }

    /// Start the pipeline with all concurrent tasks
    pub async fn start(&self, monitor_index: usize) -> Result<(), PipelineError> {
        // Initialize capture
        {
            let mut capture = self.capture.lock().await;
            capture.initialize(monitor_index).await
                .map_err(|e| PipelineError::CaptureError(e.to_string()))?;
        }

        *self.running.write().await = true;

        // Spawn concurrent tasks
        let capture_handle = self.spawn_capture_task();
        let ocr_handle = self.spawn_ocr_task();
        let mapping_handle = self.spawn_mapping_task();
        let metrics_handle = self.spawn_metrics_task();

        // Wait for all tasks (they run indefinitely until stopped)
        tokio::select! {
            _ = capture_handle => {},
            _ = ocr_handle => {},
            _ = mapping_handle => {},
            _ = metrics_handle => {},
        }

        Ok(())
    }

    /// Stop the pipeline
    pub async fn stop(&self) -> Result<(), PipelineError> {
        *self.running.write().await = false;

        // Cleanup capture
        let mut capture = self.capture.lock().await;
        capture.cleanup().await
            .map_err(|e| PipelineError::CleanupError(e.to_string()))?;

        Ok(())
    }

    /// Task 1: Screen capture at 60fps
    async fn spawn_capture_task(&self) -> tokio::task::JoinHandle<()> {
        let capture = Arc::clone(&self.capture);
        let frame_buffer = Arc::clone(&self.frame_buffer);
        let running = Arc::clone(&self.running);
        let metrics = Arc::clone(&self.metrics);

        tokio::spawn(async move {
            let mut scheduler = CaptureScheduler::new(60.0);

            while *running.read().await {
                if scheduler.should_capture_frame() {
                    let start = Instant::now();

                    let mut capture_guard = capture.lock().await;
                    match capture_guard.capture_frame().await {
                        Ok(frame) => {
                            frame_buffer.push(frame).await;

                            let elapsed = start.elapsed().as_millis() as u64;
                            let mut metrics_guard = metrics.write().await;
                            metrics_guard.record_capture(elapsed);
                        }
                        Err(e) => {
                            eprintln!("Capture error: {:?}", e);
                            let mut metrics_guard = metrics.write().await;
                            metrics_guard.capture_errors += 1;
                        }
                    }
                }

                tokio::time::sleep(Duration::from_millis(1)).await;
            }
        })
    }

    /// Task 2: OCR processing at 6fps (every 10th frame)
    async fn spawn_ocr_task(&self) -> tokio::task::JoinHandle<()> {
        let frame_buffer = Arc::clone(&self.frame_buffer);
        let ocr_engine = Arc::clone(&self.ocr_engine);
        let ocr_results_tx = self.ocr_results_tx.clone();
        let running = Arc::clone(&self.running);
        let metrics = Arc::clone(&self.metrics);

        tokio::spawn(async move {
            let mut frame_count = 0u64;
            let ocr_interval = 10; // Process every 10th frame (6fps from 60fps)

            while *running.read().await {
                if let Some(frame) = frame_buffer.pop().await {
                    frame_count += 1;

                    if frame_count % ocr_interval == 0 {
                        let start = Instant::now();

                        let mut ocr = ocr_engine.lock().await;
                        match ocr.recognize(&frame).await {
                            Ok(result) => {
                                let _ = ocr_results_tx.send(result).await;

                                let elapsed = start.elapsed().as_millis() as u64;
                                let mut metrics_guard = metrics.write().await;
                                metrics_guard.record_ocr(elapsed);
                            }
                            Err(e) => {
                                eprintln!("OCR error: {:?}", e);
                                let mut metrics_guard = metrics.write().await;
                                metrics_guard.ocr_errors += 1;
                            }
                        }
                    }
                }

                tokio::time::sleep(Duration::from_millis(16)).await;
            }
        })
    }

    /// Task 3: Phase space mapping at 60fps
    async fn spawn_mapping_task(&self) -> tokio::task::JoinHandle<()> {
        let frame_buffer = Arc::clone(&self.frame_buffer);
        let coordinate_mapper = Arc::clone(&self.coordinate_mapper);
        let phase_space_tx = self.phase_space_tx.clone();
        let running = Arc::clone(&self.running);
        let metrics = Arc::clone(&self.metrics);

        tokio::spawn(async move {
            while *running.read().await {
                if let Some(frame) = frame_buffer.peek().await {
                    let start = Instant::now();

                    // Map UI element positions to phase space
                    for region in &frame.regions {
                        let center_x = region.x + region.width / 2;
                        let center_y = region.y + region.height / 2;

                        let mut mapper = coordinate_mapper.lock().await;
                        match mapper.desktop_to_phase_space(center_x, center_y) {
                            Ok(phase_point) => {
                                let _ = phase_space_tx.send(phase_point).await;

                                let elapsed = start.elapsed().as_micros() as u64;
                                let mut metrics_guard = metrics.write().await;
                                metrics_guard.record_mapping(elapsed);
                            }
                            Err(e) => {
                                eprintln!("Mapping error: {:?}", e);
                                let mut metrics_guard = metrics.write().await;
                                metrics_guard.mapping_errors += 1;
                            }
                        }
                    }
                }

                tokio::time::sleep(Duration::from_millis(1)).await;
            }
        })
    }

    /// Task 4: Metrics collection
    async fn spawn_metrics_task(&self) -> tokio::task::JoinHandle<()> {
        let running = Arc::clone(&self.running);
        let metrics = Arc::clone(&self.metrics);

        tokio::spawn(async move {
            while *running.read().await {
                let mut metrics_guard = metrics.write().await;
                metrics_guard.update_fps();

                tokio::time::sleep(Duration::from_secs(1)).await;
            }
        })
    }

    /// Get latest phase space points (non-blocking)
    pub async fn get_latest_points(&self, limit: usize) -> Result<Vec<PhaseSpacePoint>, PipelineError> {
        let mut points = Vec::with_capacity(limit);
        let mut rx = self.phase_space_rx.lock().await;

        for _ in 0..limit {
            match rx.try_recv() {
                Ok(point) => points.push(point),
                Err(_) => break,
            }
        }

        Ok(points)
    }

    /// Get latest OCR results
    pub async fn get_latest_ocr_results(&self, limit: usize) -> Result<Vec<OCRResult>, PipelineError> {
        let mut results = Vec::with_capacity(limit);
        let mut rx = self.ocr_results_rx.lock().await;

        for _ in 0..limit {
            match rx.try_recv() {
                Ok(result) => results.push(result),
                Err(_) => break,
            }
        }

        Ok(results)
    }

    /// Get current metrics
    pub async fn get_metrics(&self) -> PipelineMetrics {
        self.metrics.read().await.clone()
    }

    /// Get session ID
    pub fn get_session_id(&self) -> &str {
        &self.session_id
    }

    /// Update OCR configuration
    pub async fn update_ocr_config(&self, config: OCRConfig) -> Result<(), PipelineError> {
        let mut ocr = self.ocr_engine.lock().await;
        *ocr = OCREngine::new(config)
            .map_err(|e| PipelineError::ConfigurationError(e.to_string()))?;
        Ok(())
    }
}

/// Pipeline performance metrics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineMetrics {
    pub capture_fps: f64,
    pub processing_fps: f64,
    pub dropped_frames: u64,

    pub average_capture_time_ms: f64,
    pub average_ocr_time_ms: f64,
    pub average_mapping_time_us: f64,

    pub total_frames_captured: u64,
    pub total_frames_processed: u64,

    pub capture_errors: u64,
    pub ocr_errors: u64,
    pub mapping_errors: u64,

    pub cache_hit_rate: f64,
    pub memory_usage_mb: f64,

    #[serde(skip)]
    last_update: Instant,

    #[serde(skip)]
    capture_times: Vec<u64>,

    #[serde(skip)]
    ocr_times: Vec<u64>,

    #[serde(skip)]
    mapping_times: Vec<u64>,
}

impl Default for PipelineMetrics {
    fn default() -> Self {
        Self {
            capture_fps: 0.0,
            processing_fps: 0.0,
            dropped_frames: 0,
            average_capture_time_ms: 0.0,
            average_ocr_time_ms: 0.0,
            average_mapping_time_us: 0.0,
            total_frames_captured: 0,
            total_frames_processed: 0,
            capture_errors: 0,
            ocr_errors: 0,
            mapping_errors: 0,
            cache_hit_rate: 0.0,
            memory_usage_mb: 0.0,
            last_update: Instant::now(),
            capture_times: Vec::new(),
            ocr_times: Vec::new(),
            mapping_times: Vec::new(),
        }
    }
}

impl PipelineMetrics {
    fn record_capture(&mut self, time_ms: u64) {
        self.capture_times.push(time_ms);
        self.total_frames_captured += 1;

        if self.capture_times.len() > 60 {
            self.capture_times.remove(0);
        }

        self.average_capture_time_ms = self.capture_times.iter().sum::<u64>() as f64
            / self.capture_times.len() as f64;
    }

    fn record_ocr(&mut self, time_ms: u64) {
        self.ocr_times.push(time_ms);
        self.total_frames_processed += 1;

        if self.ocr_times.len() > 10 {
            self.ocr_times.remove(0);
        }

        self.average_ocr_time_ms = self.ocr_times.iter().sum::<u64>() as f64
            / self.ocr_times.len() as f64;
    }

    fn record_mapping(&mut self, time_us: u64) {
        self.mapping_times.push(time_us);

        if self.mapping_times.len() > 60 {
            self.mapping_times.remove(0);
        }

        self.average_mapping_time_us = self.mapping_times.iter().sum::<u64>() as f64
            / self.mapping_times.len() as f64;
    }

    fn update_fps(&mut self) {
        let elapsed = self.last_update.elapsed().as_secs_f64();

        if elapsed >= 1.0 {
            self.capture_fps = self.total_frames_captured as f64 / elapsed;
            self.processing_fps = self.total_frames_processed as f64 / elapsed;
            self.last_update = Instant::now();
        }
    }
}

/// Pipeline error types
#[derive(Debug, thiserror::Error)]
pub enum PipelineError {
    #[error("Failed to initialize pipeline: {0}")]
    InitializationFailed(String),

    #[error("Capture error: {0}")]
    CaptureError(String),

    #[error("OCR error: {0}")]
    OCRError(String),

    #[error("Mapping error: {0}")]
    MappingError(String),

    #[error("Configuration error: {0}")]
    ConfigurationError(String),

    #[error("Cleanup error: {0}")]
    CleanupError(String),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_pipeline_creation() {
        let config = OCRConfig::default();
        let pipeline = VisionPipeline::new(1920, 1080, config);

        assert!(pipeline.is_ok());
    }

    #[tokio::test]
    async fn test_metrics_recording() {
        let mut metrics = PipelineMetrics::default();

        metrics.record_capture(5);
        metrics.record_capture(6);
        metrics.record_capture(4);

        assert_eq!(metrics.total_frames_captured, 3);
        assert!((metrics.average_capture_time_ms - 5.0).abs() < 1.0);
    }
}

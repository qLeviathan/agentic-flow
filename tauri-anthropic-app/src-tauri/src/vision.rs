/**
 * Vision Module Entry Point
 *
 * Re-exports vision system commands for Tauri registration.
 */

mod capture;
mod ocr;
mod mapping;
mod pipeline;
mod commands;

// Re-export command handlers
pub use commands::{
    VisionSystemState,
    start_vision_capture,
    stop_vision_capture,
    get_phase_space_stream,
    get_capture_metrics,
    configure_ocr,
    list_capture_sessions,
    get_monitors,
};

// Re-export core types for internal use
pub(crate) use capture::{ScreenCapture, CaptureFrame, FrameBuffer};
pub(crate) use ocr::{OCREngine, OCRConfig, OCRResult};
pub(crate) use mapping::{CoordinateMapper, PhaseSpacePoint};
pub(crate) use pipeline::{VisionPipeline, PipelineMetrics};

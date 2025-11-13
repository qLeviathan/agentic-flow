/**
 * Vision Module
 *
 * Computer Vision Screen Capture System for AURELIA
 * Provides 60fps screen capture with OCR and phase space mapping.
 */

pub mod capture;
pub mod ocr;
pub mod mapping;
pub mod pipeline;

// Re-export main types
pub use capture::{ScreenCapture, CaptureFrame, FrameBuffer, CaptureScheduler};
pub use ocr::{OCREngine, OCRConfig, OCRResult, TradingData};
pub use mapping::{CoordinateMapper, PhaseSpacePoint, SymplecticValidator};
pub use pipeline::{VisionPipeline, PipelineMetrics};

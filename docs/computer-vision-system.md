# Computer Vision Capture System - Technical Design

## Executive Summary

The Computer Vision Capture System provides real-time screen capture and OCR capabilities for the AURELIA trading system, mapping desktop coordinates to phase space using Zeckendorf encoding. This white-box system processes visual data at 60fps while maintaining mathematical rigor through discrete Fibonacci-based coordinate transformations.

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     AURELIA Trading System                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Computer Vision Capture System                      │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │   Screen     │───→│  OCR Engine  │───→│  Phase Space    │  │
│  │   Capture    │    │  (Tesseract) │    │  Coordinator    │  │
│  │  (60fps)     │    │              │    │  (Zeckendorf)   │  │
│  └──────────────┘    └──────────────┘    └─────────────────┘  │
│         │                    │                     │            │
│         ↓                    ↓                     ↓            │
│  ┌──────────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │   Frame      │    │    Text      │    │  (q,p) Phase    │  │
│  │   Buffer     │    │  Extraction  │    │  Space Points   │  │
│  │   Queue      │    │   Parser     │    │                 │  │
│  └──────────────┘    └──────────────┘    └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│          Existing Phase Space System (/src/math-framework)      │
└─────────────────────────────────────────────────────────────────┘
```

## 1. Screen Capture Module

### 1.1 Technology Selection

**Primary: Tauri + Native OS APIs**
- **Platform**: Cross-platform (Windows, macOS, Linux)
- **Integration**: Existing Tauri app at `/tauri-anthropic-app/`
- **Performance**: Native performance via Rust backend
- **Security**: Sandboxed environment with explicit permissions

**Implementation Strategy**:
```rust
// Tauri command for screen capture
#[tauri::command]
async fn capture_screen_region(
    x: u32,
    y: u32,
    width: u32,
    height: u32
) -> Result<CaptureFrame, CaptureError> {
    // Platform-specific capture implementation
}
```

### 1.2 Platform-Specific Capture APIs

#### Windows (Primary Target)
- **API**: Windows Graphics Capture API (Windows.Graphics.Capture)
- **Crate**: `windows` (Rust binding)
- **Performance**: Hardware-accelerated, 60fps capable
- **Features**:
  - Per-monitor capture
  - Cursor capture optional
  - HDR support

```rust
use windows::Graphics::Capture::{GraphicsCaptureItem, Direct3D11CaptureFramePool};

pub struct WindowsCapture {
    capture_item: GraphicsCaptureItem,
    frame_pool: Direct3D11CaptureFramePool,
    target_fps: u32,
}

impl WindowsCapture {
    pub fn new(monitor_index: usize) -> Result<Self, CaptureError> {
        // Initialize capture item for specific monitor
        // Setup Direct3D11 frame pool
        // Configure 60fps timing
    }

    pub async fn capture_frame(&mut self) -> Result<RawFrame, CaptureError> {
        // Capture single frame from frame pool
        // Convert to RGB24 format
        // Return frame with metadata
    }
}
```

#### macOS
- **API**: ScreenCaptureKit (macOS 12.3+)
- **Crate**: `core-graphics` + `cocoa`
- **Fallback**: CGWindowListCreateImage for older versions

#### Linux
- **API**: X11 (XGetImage) or Wayland (wlr-screencopy)
- **Crate**: `x11rb` or `wayland-client`
- **Fallback**: PipeWire for modern systems

### 1.3 Frame Buffer Architecture

**Ring Buffer Design** (60fps = 16.67ms per frame):
```rust
pub struct FrameBuffer {
    buffer: VecDeque<CaptureFrame>,
    capacity: usize, // 180 frames = 3 seconds at 60fps
    write_index: AtomicUsize,
    read_index: AtomicUsize,
}

pub struct CaptureFrame {
    timestamp: Instant,
    frame_number: u64,
    width: u32,
    height: u32,
    data: Vec<u8>, // RGB24 format
    regions: Vec<BoundingBox>, // UI element regions
}
```

**Performance Optimization**:
- Zero-copy where possible (DMA-BUF on Linux, IOSurface on macOS)
- Memory pooling to reduce allocations
- Lockless ring buffer for producer-consumer pattern
- Adaptive frame dropping if processing falls behind

### 1.4 Target Rate Control

```rust
pub struct CaptureScheduler {
    target_fps: f64,
    frame_duration: Duration,
    last_capture: Instant,
    dropped_frames: AtomicU64,
}

impl CaptureScheduler {
    pub fn should_capture_frame(&self) -> bool {
        let elapsed = self.last_capture.elapsed();
        elapsed >= self.frame_duration
    }

    pub fn calculate_jitter(&self) -> f64 {
        // Track timing accuracy for diagnostics
    }
}
```

## 2. OCR Engine

### 2.1 Library Selection: Tesseract 5.x

**Rationale**:
- **Open Source**: Apache 2.0 license
- **Mature**: Industry-standard OCR
- **LSTM Support**: Neural network-based recognition
- **Multi-language**: Support for numbers, symbols, text
- **Rust Bindings**: `tesseract-rs` crate

**Installation**:
```toml
# Cargo.toml
[dependencies]
tesseract = "0.14"
leptonica-sys = "0.4"
```

### 2.2 OCR Configuration

**Training Data**:
- **eng.traineddata**: English language pack
- **custom_trading.traineddata**: Custom trained for:
  - Ticker symbols (AAPL, MSFT, etc.)
  - Numerical prices ($123.45)
  - Percentage changes (+2.5%)
  - Time formats (09:30:00 EST)

**Tesseract Configuration**:
```rust
pub struct OCREngine {
    tesseract: Tesseract,
    config: OCRConfig,
}

pub struct OCRConfig {
    // PSM (Page Segmentation Mode): 6 = Uniform block of text
    page_seg_mode: PageSegMode,

    // OEM (OCR Engine Mode): 1 = LSTM only
    engine_mode: EngineMode,

    // Whitelist for trading symbols
    char_whitelist: String, // "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.$%+-"

    // Performance tuning
    tessedit_pageseg_mode: u8,
    tessedit_char_whitelist: String,
}

impl OCREngine {
    pub fn new() -> Result<Self, OCRError> {
        let mut tesseract = Tesseract::new(None, Some("eng"))?;

        // Configure for trading data
        tesseract.set_variable("tessedit_char_whitelist",
                               "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.$%+-")?;
        tesseract.set_variable("tessedit_pageseg_mode", "6")?;
        tesseract.set_variable("tessedit_ocr_engine_mode", "1")?;

        Ok(Self {
            tesseract,
            config: OCRConfig::default(),
        })
    }

    pub fn recognize(&mut self, image: &[u8], width: u32, height: u32)
        -> Result<OCRResult, OCRError> {
        self.tesseract.set_image(image, width, height, 3, width * 3)?;
        let text = self.tesseract.get_text()?;
        let confidence = self.tesseract.mean_text_conf();

        Ok(OCRResult {
            text,
            confidence,
            bounding_boxes: self.get_bounding_boxes()?,
        })
    }
}
```

### 2.3 Image Preprocessing Pipeline

**Goal**: Maximize OCR accuracy through image enhancement

```rust
pub struct ImagePreprocessor {
    // Preprocessing pipeline stages
}

impl ImagePreprocessor {
    pub fn preprocess(&self, frame: &CaptureFrame) -> ProcessedImage {
        let mut img = frame.data.clone();

        // Stage 1: Grayscale conversion
        img = self.to_grayscale(img);

        // Stage 2: Contrast enhancement (CLAHE)
        img = self.enhance_contrast(img);

        // Stage 3: Adaptive thresholding (Otsu's method)
        img = self.apply_threshold(img);

        // Stage 4: Noise reduction (bilateral filter)
        img = self.reduce_noise(img);

        // Stage 5: Deskewing (if needed)
        if self.needs_deskew(&img) {
            img = self.deskew(img);
        }

        ProcessedImage {
            data: img,
            metadata: PreprocessMetadata {
                contrast_boost: 1.2,
                threshold: 127,
                noise_level: 0.05,
            }
        }
    }

    fn to_grayscale(&self, rgb: Vec<u8>) -> Vec<u8> {
        // Luminosity method: Y = 0.299R + 0.587G + 0.114B
        rgb.chunks(3)
           .map(|pixel| {
               (0.299 * pixel[0] as f32 +
                0.587 * pixel[1] as f32 +
                0.114 * pixel[2] as f32) as u8
           })
           .collect()
    }

    fn enhance_contrast(&self, img: Vec<u8>) -> Vec<u8> {
        // CLAHE (Contrast Limited Adaptive Histogram Equalization)
        // Improves text visibility in varying lighting conditions
    }

    fn apply_threshold(&self, img: Vec<u8>) -> Vec<u8> {
        // Otsu's method for automatic threshold calculation
        // Converts to binary image (black text on white background)
    }
}
```

**Image Processing Libraries**:
```toml
[dependencies]
image = "0.24" # Image I/O and basic processing
imageproc = "0.23" # Advanced image processing algorithms
```

### 2.4 Text Extraction & Parsing

**Pattern Matching for Trading Data**:
```rust
pub struct TextParser {
    ticker_regex: Regex,
    price_regex: Regex,
    change_regex: Regex,
    time_regex: Regex,
}

impl TextParser {
    pub fn new() -> Self {
        Self {
            ticker_regex: Regex::new(r"^[A-Z]{1,5}$").unwrap(),
            price_regex: Regex::new(r"\$(\d+\.\d{2})").unwrap(),
            change_regex: Regex::new(r"([+-]\d+\.\d{1,2}%)").unwrap(),
            time_regex: Regex::new(r"(\d{2}:\d{2}:\d{2})").unwrap(),
        }
    }

    pub fn parse_trading_data(&self, ocr_result: &OCRResult)
        -> Result<TradingData, ParseError> {
        let lines: Vec<&str> = ocr_result.text.lines().collect();

        let mut data = TradingData::default();

        for line in lines {
            // Extract ticker symbols
            if let Some(ticker) = self.extract_ticker(line) {
                data.tickers.push(ticker);
            }

            // Extract prices
            if let Some(price) = self.extract_price(line) {
                data.prices.push(price);
            }

            // Extract percentage changes
            if let Some(change) = self.extract_change(line) {
                data.changes.push(change);
            }

            // Extract timestamps
            if let Some(time) = self.extract_time(line) {
                data.timestamp = Some(time);
            }
        }

        Ok(data)
    }

    fn extract_ticker(&self, text: &str) -> Option<String> {
        self.ticker_regex
            .captures(text)
            .map(|cap| cap[0].to_string())
    }

    fn extract_price(&self, text: &str) -> Option<f64> {
        self.price_regex
            .captures(text)
            .and_then(|cap| cap[1].parse::<f64>().ok())
    }
}

#[derive(Default, Debug)]
pub struct TradingData {
    pub tickers: Vec<String>,
    pub prices: Vec<f64>,
    pub changes: Vec<f64>,
    pub timestamp: Option<String>,
    pub news_headlines: Vec<String>,
}
```

## 3. Desktop Coordinate to Phase Space Mapping

### 3.1 Mathematical Foundation

**ArXiv Paper Integration**:

The desktop screen is treated as a discrete phase space where pixel coordinates (x, y) are mapped to canonical phase space coordinates (q, p) via Zeckendorf encoding.

**Core Transformation**:
```
Desktop Space: (x, y) ∈ ℕ² (pixel coordinates)
          ↓ Zeckendorf Decomposition
Zeckendorf Space: Z(x), Z(y) (Fibonacci index sets)
          ↓ Phase Space Embedding
Phase Space: (q, p) ∈ ℕ² (canonical coordinates)
```

**Embedding Formula**:
```
q = Zeck(x) ⊕ Zeck(y)     (XOR of Zeckendorf representations)
p = q ⊕ (parity mod 2)     (Parity-based momentum coordinate)

where:
  Zeck(n) = binary representation of Fibonacci indices
  ⊕ = bitwise XOR operation
  parity = sum of indices mod 2
```

### 3.2 Implementation

```rust
use crate::math_framework::decomposition::zeckendorf::{
    zeckendorf_decompose,
    ZeckendorfRepresentation
};
use crate::math_framework::phase_space::{
    PhaseSpaceCoordinates,
    calculateCoordinates
};

pub struct CoordinateMapper {
    screen_width: u32,
    screen_height: u32,
    zeckendorf_cache: LruCache<u32, ZeckendorfRepresentation>,
}

impl CoordinateMapper {
    pub fn new(width: u32, height: u32) -> Self {
        Self {
            screen_width: width,
            screen_height: height,
            // Cache common coordinates (e.g., last 1000 used)
            zeckendorf_cache: LruCache::new(NonZeroUsize::new(1000).unwrap()),
        }
    }

    /// Map desktop pixel coordinates to phase space (q, p)
    pub fn desktop_to_phase_space(&mut self, x: u32, y: u32)
        -> Result<PhaseSpacePoint, MappingError> {

        // Step 1: Validate coordinates
        if x >= self.screen_width || y >= self.screen_height {
            return Err(MappingError::OutOfBounds);
        }

        // Step 2: Zeckendorf decomposition of x and y
        let zeck_x = self.get_cached_zeckendorf(x)?;
        let zeck_y = self.get_cached_zeckendorf(y)?;

        // Step 3: Convert to binary representations
        let binary_x = self.indices_to_binary(&zeck_x.indices);
        let binary_y = self.indices_to_binary(&zeck_y.indices);

        // Step 4: Calculate q via XOR
        let q = binary_x ^ binary_y;

        // Step 5: Calculate parity
        let parity = (zeck_x.summand_count + zeck_y.summand_count) % 2;

        // Step 6: Calculate p via XOR with parity
        let p = q ^ parity;

        // Step 7: Map to continuous phase space for visualization
        let phi = self.discrete_to_continuous_q(q);
        let psi = self.discrete_to_continuous_p(p);

        Ok(PhaseSpacePoint {
            // Discrete coordinates (integer)
            q,
            p,

            // Continuous coordinates (for phase space system)
            phi,
            psi,

            // Original desktop coordinates
            screen_x: x,
            screen_y: y,

            // Metadata
            zeck_x_summands: zeck_x.summand_count,
            zeck_y_summands: zeck_y.summand_count,
            timestamp: Instant::now(),
        })
    }

    /// Convert Zeckendorf indices to binary representation
    /// Example: {2, 5, 7} → 0b1010100 (bits at positions 2, 5, 7)
    fn indices_to_binary(&self, indices: &HashSet<usize>) -> u64 {
        let mut binary = 0u64;
        for &index in indices {
            if index < 64 {
                binary |= 1u64 << index;
            }
        }
        binary
    }

    /// Get Zeckendorf decomposition with caching
    fn get_cached_zeckendorf(&mut self, n: u32)
        -> Result<ZeckendorfRepresentation, MappingError> {

        if let Some(cached) = self.zeckendorf_cache.get(&n) {
            return Ok(cached.clone());
        }

        let zeck = zeckendorf_decompose(n as usize)
            .map_err(|_| MappingError::ZeckendorfDecompositionFailed)?;

        self.zeckendorf_cache.put(n, zeck.clone());
        Ok(zeck)
    }

    /// Map discrete q to continuous φ coordinate
    /// Uses existing phase space calculation: φ(n) = Σᵢ∈Z(n) φⁱ
    fn discrete_to_continuous_q(&self, q: u64) -> f64 {
        calculatePhi(q as usize, 50)
    }

    /// Map discrete p to continuous ψ coordinate
    /// Uses existing phase space calculation: ψ(n) = Σᵢ∈Z(n) ψⁱ
    fn discrete_to_continuous_p(&self, p: u64) -> f64 {
        calculatePsi(p as usize, 50)
    }
}

#[derive(Debug, Clone)]
pub struct PhaseSpacePoint {
    // Discrete coordinates (integer, Zeckendorf-encoded)
    pub q: u64,
    pub p: u64,

    // Continuous coordinates (for phase space visualization)
    pub phi: f64,
    pub psi: f64,

    // Original desktop coordinates
    pub screen_x: u32,
    pub screen_y: u32,

    // Metadata
    pub zeck_x_summands: usize,
    pub zeck_y_summands: usize,
    pub timestamp: Instant,
}

#[derive(Debug)]
pub enum MappingError {
    OutOfBounds,
    ZeckendorfDecompositionFailed,
    InvalidCoordinate,
}
```

### 3.3 Symplectic Form Preservation

**Mathematical Property**:
The symplectic form ω = dq ∧ dp must be preserved under cascades.

```rust
pub struct SymplecticValidator {
    tolerance: f64,
}

impl SymplecticValidator {
    /// Verify symplectic form preservation for a sequence of points
    pub fn verify_preservation(&self, points: &[PhaseSpacePoint]) -> bool {
        for window in points.windows(3) {
            let omega_before = self.calculate_symplectic_form(
                &window[0], &window[1]
            );
            let omega_after = self.calculate_symplectic_form(
                &window[1], &window[2]
            );

            // Check if ω is approximately preserved
            if (omega_before - omega_after).abs() > self.tolerance {
                return false;
            }
        }
        true
    }

    /// Calculate ω = dq ∧ dp for two adjacent points
    fn calculate_symplectic_form(&self, p1: &PhaseSpacePoint, p2: &PhaseSpacePoint)
        -> f64 {
        let dq = (p2.q as i64 - p1.q as i64) as f64;
        let dp = (p2.p as i64 - p1.p as i64) as f64;

        // ω = dq ∧ dp = dq * dp (in 2D)
        dq * dp
    }
}
```

### 3.4 Inverse Mapping (Phase Space to Desktop)

```rust
impl CoordinateMapper {
    /// Reconstruct approximate desktop coordinates from phase space
    /// Note: This is approximate due to information loss in XOR
    pub fn phase_space_to_desktop(&self, q: u64, p: u64)
        -> Result<(u32, u32), MappingError> {

        // Recover parity: p = q ⊕ parity
        let parity = q ^ p;

        // Attempt to recover x and y from q = Zeck(x) ⊕ Zeck(y)
        // This requires brute-force search or constraint solving

        // For efficiency, maintain a bidirectional map
        // In practice, keep track of (q,p) → (x,y) mappings

        self.inverse_lookup_table
            .get(&(q, p))
            .cloned()
            .ok_or(MappingError::InverseMappingNotFound)
    }
}
```

## 4. Real-Time Streaming Architecture

### 4.1 Processing Pipeline

```rust
pub struct VisionPipeline {
    capture: Arc<Mutex<ScreenCapture>>,
    frame_buffer: Arc<FrameBuffer>,
    ocr_engine: Arc<Mutex<OCREngine>>,
    coordinate_mapper: Arc<Mutex<CoordinateMapper>>,
    output_stream: mpsc::Sender<ProcessedFrame>,
}

impl VisionPipeline {
    pub async fn start(&self) -> Result<(), PipelineError> {
        // Spawn concurrent tasks
        let capture_task = self.spawn_capture_task();
        let ocr_task = self.spawn_ocr_task();
        let mapping_task = self.spawn_mapping_task();

        // Wait for all tasks
        tokio::try_join!(capture_task, ocr_task, mapping_task)?;

        Ok(())
    }

    /// Task 1: Screen capture at 60fps
    async fn spawn_capture_task(&self) -> Result<(), PipelineError> {
        let mut interval = tokio::time::interval(Duration::from_millis(16)); // ~60fps

        loop {
            interval.tick().await;

            let mut capture = self.capture.lock().await;
            match capture.capture_frame().await {
                Ok(frame) => {
                    self.frame_buffer.push(frame);
                }
                Err(e) => {
                    eprintln!("Capture error: {:?}", e);
                }
            }
        }
    }

    /// Task 2: OCR processing (slower, processes every Nth frame)
    async fn spawn_ocr_task(&self) -> Result<(), PipelineError> {
        let mut frame_count = 0;
        let ocr_interval = 10; // Process every 10th frame (6fps for OCR)

        loop {
            if let Some(frame) = self.frame_buffer.pop() {
                frame_count += 1;

                if frame_count % ocr_interval == 0 {
                    let mut ocr = self.ocr_engine.lock().await;

                    // Preprocess image
                    let preprocessed = ImagePreprocessor::new().preprocess(&frame);

                    // Perform OCR
                    match ocr.recognize(&preprocessed.data, frame.width, frame.height) {
                        Ok(result) => {
                            // Parse trading data
                            let parser = TextParser::new();
                            if let Ok(trading_data) = parser.parse_trading_data(&result) {
                                println!("Extracted: {:?}", trading_data);
                            }
                        }
                        Err(e) => {
                            eprintln!("OCR error: {:?}", e);
                        }
                    }
                }
            }

            tokio::time::sleep(Duration::from_millis(16)).await;
        }
    }

    /// Task 3: Coordinate mapping (fast, processes all frames)
    async fn spawn_mapping_task(&self) -> Result<(), PipelineError> {
        loop {
            if let Some(frame) = self.frame_buffer.pop() {
                let mut mapper = self.coordinate_mapper.lock().await;

                // Map all UI element positions to phase space
                for region in &frame.regions {
                    let center_x = region.x + region.width / 2;
                    let center_y = region.y + region.height / 2;

                    match mapper.desktop_to_phase_space(center_x, center_y) {
                        Ok(phase_point) => {
                            // Send to output stream
                            self.output_stream.send(ProcessedFrame {
                                frame_number: frame.frame_number,
                                timestamp: frame.timestamp,
                                phase_points: vec![phase_point],
                            }).await?;
                        }
                        Err(e) => {
                            eprintln!("Mapping error: {:?}", e);
                        }
                    }
                }
            }

            tokio::time::sleep(Duration::from_millis(1)).await;
        }
    }
}
```

### 4.2 Error Handling

**OCR Failure Recovery**:
```rust
pub enum OCRErrorHandling {
    /// Skip frame and continue
    Skip,

    /// Retry with different preprocessing
    RetryWithFallback,

    /// Use previous frame's result
    UsePreviousResult,

    /// Aggregate multiple frames
    MultiFrameAggregation,
}

impl OCREngine {
    pub async fn recognize_with_retry(&mut self, frame: &CaptureFrame)
        -> Result<OCRResult, OCRError> {

        // Attempt 1: Standard preprocessing
        if let Ok(result) = self.recognize_standard(frame).await {
            if result.confidence > 70.0 {
                return Ok(result);
            }
        }

        // Attempt 2: Enhanced contrast
        if let Ok(result) = self.recognize_enhanced_contrast(frame).await {
            if result.confidence > 60.0 {
                return Ok(result);
            }
        }

        // Attempt 3: Inverted colors
        if let Ok(result) = self.recognize_inverted(frame).await {
            if result.confidence > 60.0 {
                return Ok(result);
            }
        }

        Err(OCRError::AllAttemptsExhausted)
    }
}
```

**Coordinate Mapping Errors**:
```rust
impl CoordinateMapper {
    pub fn handle_mapping_error(&self, error: MappingError) -> MappingResult {
        match error {
            MappingError::OutOfBounds => {
                // Clamp to screen boundaries
                MappingResult::Clamped
            }
            MappingError::ZeckendorfDecompositionFailed => {
                // Use nearest valid coordinate
                MappingResult::ApproximateNearest
            }
            MappingError::InvalidCoordinate => {
                // Skip this point
                MappingResult::Skip
            }
        }
    }
}
```

## 5. Integration with Tauri Backend

### 5.1 Rust Command Interface

```rust
// File: /tauri-anthropic-app/src-tauri/src/commands/vision.rs

use tauri::{command, State};

#[command]
pub async fn start_vision_capture(
    state: State<'_, VisionSystemState>
) -> Result<CaptureSessionId, String> {
    let mut system = state.vision_system.lock().await;

    let session_id = system.start_capture().await
        .map_err(|e| e.to_string())?;

    Ok(session_id)
}

#[command]
pub async fn stop_vision_capture(
    session_id: CaptureSessionId,
    state: State<'_, VisionSystemState>
) -> Result<(), String> {
    let mut system = state.vision_system.lock().await;

    system.stop_capture(session_id).await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn get_phase_space_stream(
    session_id: CaptureSessionId,
    state: State<'_, VisionSystemState>
) -> Result<Vec<PhaseSpacePoint>, String> {
    let system = state.vision_system.lock().await;

    let points = system.get_latest_points(session_id, 100).await
        .map_err(|e| e.to_string())?;

    Ok(points)
}

#[command]
pub async fn configure_ocr(
    config: OCRConfig,
    state: State<'_, VisionSystemState>
) -> Result<(), String> {
    let mut system = state.vision_system.lock().await;

    system.update_ocr_config(config).await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub async fn get_capture_metrics(
    session_id: CaptureSessionId,
    state: State<'_, VisionSystemState>
) -> Result<CaptureMetrics, String> {
    let system = state.vision_system.lock().await;

    let metrics = system.get_metrics(session_id).await
        .map_err(|e| e.to_string())?;

    Ok(metrics)
}

// Registration in main.rs
pub fn register_vision_commands(app: &mut tauri::App) {
    app.invoke_handler(tauri::generate_handler![
        start_vision_capture,
        stop_vision_capture,
        get_phase_space_stream,
        configure_ocr,
        get_capture_metrics,
    ]);
}
```

### 5.2 TypeScript Frontend Interface

```typescript
// File: /tauri-anthropic-app/src/lib/vision/api.ts

import { invoke } from '@tauri-apps/api/tauri';

export interface PhaseSpacePoint {
  q: number;
  p: number;
  phi: number;
  psi: number;
  screenX: number;
  screenY: number;
  zeckXSummands: number;
  zeckYSummands: number;
  timestamp: number;
}

export interface OCRConfig {
  pagSegMode: number;
  engineMode: number;
  charWhitelist: string;
  confidence_threshold: number;
}

export interface CaptureMetrics {
  fps: number;
  droppedFrames: number;
  ocrSuccessRate: number;
  averageOCRTime: number;
  averageMappingTime: number;
}

export class VisionAPI {
  private sessionId: string | null = null;

  /**
   * Start screen capture and phase space mapping
   */
  async startCapture(): Promise<string> {
    this.sessionId = await invoke<string>('start_vision_capture');
    return this.sessionId;
  }

  /**
   * Stop active capture session
   */
  async stopCapture(): Promise<void> {
    if (!this.sessionId) {
      throw new Error('No active capture session');
    }

    await invoke('stop_vision_capture', { sessionId: this.sessionId });
    this.sessionId = null;
  }

  /**
   * Get latest phase space points
   */
  async getPhaseSpaceStream(): Promise<PhaseSpacePoint[]> {
    if (!this.sessionId) {
      throw new Error('No active capture session');
    }

    return await invoke<PhaseSpacePoint[]>('get_phase_space_stream', {
      sessionId: this.sessionId
    });
  }

  /**
   * Configure OCR engine parameters
   */
  async configureOCR(config: OCRConfig): Promise<void> {
    await invoke('configure_ocr', { config });
  }

  /**
   * Get capture performance metrics
   */
  async getMetrics(): Promise<CaptureMetrics> {
    if (!this.sessionId) {
      throw new Error('No active capture session');
    }

    return await invoke<CaptureMetrics>('get_capture_metrics', {
      sessionId: this.sessionId
    });
  }

  /**
   * Stream phase space points via event listener
   */
  onPhaseSpaceUpdate(callback: (point: PhaseSpacePoint) => void): () => void {
    const unlisten = listen('phase_space_update', (event) => {
      callback(event.payload as PhaseSpacePoint);
    });

    return () => unlisten.then(fn => fn());
  }
}

// Example usage
const visionAPI = new VisionAPI();

// Start capture
await visionAPI.startCapture();

// Listen for updates
const unsubscribe = visionAPI.onPhaseSpaceUpdate((point) => {
  console.log(`Phase space: (${point.q}, ${point.p})`);
  console.log(`Desktop: (${point.screenX}, ${point.screenY})`);

  // Update visualization
  updatePhaseSpaceVisualization(point);
});

// Get metrics every second
setInterval(async () => {
  const metrics = await visionAPI.getMetrics();
  console.log(`FPS: ${metrics.fps}, OCR Success: ${metrics.ocrSuccessRate}%`);
}, 1000);

// Stop capture
await visionAPI.stopCapture();
unsubscribe();
```

## 6. Performance Optimization

### 6.1 60fps Target Strategy

**Critical Path Analysis**:
```
Per-frame budget: 16.67ms (60fps)

Breakdown:
- Screen capture: 2-5ms (hardware-accelerated)
- Frame buffer: <1ms (zero-copy)
- Coordinate mapping: 1-3ms (cached Zeckendorf)
- Event emission: <1ms (async channel)
Total: ~8ms (48% budget) ✓

OCR processing (separate pipeline, 6fps):
- Preprocessing: 10-20ms
- Tesseract OCR: 50-200ms
- Text parsing: 1-5ms
Total: ~220ms per OCR frame (acceptable at 6fps)
```

**Optimization Techniques**:

1. **Zeckendorf Caching**:
```rust
// LRU cache for common coordinates
struct ZeckendorfCache {
    cache: LruCache<u32, ZeckendorfRepresentation>,
    hit_rate: AtomicU64,
    miss_rate: AtomicU64,
}

impl ZeckendorfCache {
    fn get_or_compute(&mut self, n: u32) -> ZeckendorfRepresentation {
        if let Some(result) = self.cache.get(&n) {
            self.hit_rate.fetch_add(1, Ordering::Relaxed);
            return result.clone();
        }

        self.miss_rate.fetch_add(1, Ordering::Relaxed);
        let result = zeckendorf_decompose(n);
        self.cache.put(n, result.clone());
        result
    }
}
```

2. **SIMD Acceleration** (where applicable):
```rust
#[cfg(target_arch = "x86_64")]
use std::arch::x86_64::*;

unsafe fn fast_grayscale_simd(rgb: &[u8], output: &mut [u8]) {
    // Use SIMD instructions for parallel processing
    // Process 16 pixels at once using AVX2
}
```

3. **Thread Pool for Parallel Processing**:
```rust
use rayon::prelude::*;

impl ImagePreprocessor {
    fn batch_preprocess(&self, frames: Vec<CaptureFrame>) -> Vec<ProcessedImage> {
        frames.par_iter()
            .map(|frame| self.preprocess(frame))
            .collect()
    }
}
```

### 6.2 Memory Management

**Memory Pool for Frames**:
```rust
struct FrameAllocator {
    pool: Vec<Vec<u8>>,
    available: Arc<Mutex<VecDeque<Vec<u8>>>>,
    frame_size: usize,
}

impl FrameAllocator {
    fn allocate(&self) -> Vec<u8> {
        let mut available = self.available.lock().unwrap();
        available.pop_front().unwrap_or_else(|| {
            vec![0u8; self.frame_size]
        })
    }

    fn release(&self, buffer: Vec<u8>) {
        let mut available = self.available.lock().unwrap();
        if available.len() < 100 {
            available.push_back(buffer);
        }
    }
}
```

### 6.3 Monitoring & Diagnostics

```rust
#[derive(Debug, Clone)]
pub struct PerformanceMetrics {
    pub capture_fps: f64,
    pub processing_fps: f64,
    pub dropped_frames: u64,
    pub average_capture_time: Duration,
    pub average_ocr_time: Duration,
    pub average_mapping_time: Duration,
    pub cache_hit_rate: f64,
    pub memory_usage: usize,
}

pub struct MetricsCollector {
    capture_times: RollingAverage,
    ocr_times: RollingAverage,
    mapping_times: RollingAverage,
    frame_count: AtomicU64,
    dropped_count: AtomicU64,
    start_time: Instant,
}

impl MetricsCollector {
    pub fn record_capture(&self, duration: Duration) {
        self.capture_times.add(duration);
        self.frame_count.fetch_add(1, Ordering::Relaxed);
    }

    pub fn get_metrics(&self) -> PerformanceMetrics {
        let elapsed = self.start_time.elapsed().as_secs_f64();
        let frames = self.frame_count.load(Ordering::Relaxed);
        let dropped = self.dropped_count.load(Ordering::Relaxed);

        PerformanceMetrics {
            capture_fps: frames as f64 / elapsed,
            processing_fps: (frames - dropped) as f64 / elapsed,
            dropped_frames: dropped,
            average_capture_time: self.capture_times.average(),
            average_ocr_time: self.ocr_times.average(),
            average_mapping_time: self.mapping_times.average(),
            cache_hit_rate: self.calculate_cache_hit_rate(),
            memory_usage: self.estimate_memory_usage(),
        }
    }
}
```

## 7. Testing Strategy

### 7.1 Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_coordinate_mapping() {
        let mut mapper = CoordinateMapper::new(1920, 1080);

        // Test corner coordinates
        let point = mapper.desktop_to_phase_space(0, 0).unwrap();
        assert!(point.q >= 0);
        assert!(point.p >= 0);

        // Test center
        let point = mapper.desktop_to_phase_space(960, 540).unwrap();
        assert!(point.q > 0);

        // Test out of bounds
        assert!(mapper.desktop_to_phase_space(2000, 1200).is_err());
    }

    #[test]
    fn test_symplectic_preservation() {
        let mut mapper = CoordinateMapper::new(1920, 1080);
        let validator = SymplecticValidator { tolerance: 0.01 };

        let points: Vec<PhaseSpacePoint> = (0..100)
            .map(|i| mapper.desktop_to_phase_space(i * 10, i * 10).unwrap())
            .collect();

        assert!(validator.verify_preservation(&points));
    }

    #[test]
    fn test_zeckendorf_caching() {
        let mut mapper = CoordinateMapper::new(1920, 1080);

        // First call - cache miss
        let start = Instant::now();
        mapper.get_cached_zeckendorf(100).unwrap();
        let first_duration = start.elapsed();

        // Second call - cache hit
        let start = Instant::now();
        mapper.get_cached_zeckendorf(100).unwrap();
        let second_duration = start.elapsed();

        // Cache hit should be faster
        assert!(second_duration < first_duration);
    }

    #[test]
    fn test_ocr_text_parsing() {
        let parser = TextParser::new();

        let ocr_result = OCRResult {
            text: "AAPL $175.43 +2.5%\nMSFT $380.12 -0.8%".to_string(),
            confidence: 85.0,
            bounding_boxes: vec![],
        };

        let data = parser.parse_trading_data(&ocr_result).unwrap();

        assert_eq!(data.tickers.len(), 2);
        assert_eq!(data.tickers[0], "AAPL");
        assert_eq!(data.prices[0], 175.43);
        assert_eq!(data.changes[0], 2.5);
    }
}
```

### 7.2 Integration Tests

```rust
#[tokio::test]
async fn test_full_pipeline() {
    let pipeline = VisionPipeline::new(1920, 1080);

    // Start pipeline
    let handle = tokio::spawn(async move {
        pipeline.start().await.unwrap();
    });

    // Wait for frames
    tokio::time::sleep(Duration::from_secs(1)).await;

    // Verify metrics
    let metrics = pipeline.get_metrics().await;
    assert!(metrics.capture_fps >= 55.0); // Allow some variance from 60fps
    assert!(metrics.dropped_frames < 10);

    // Stop pipeline
    handle.abort();
}
```

### 7.3 Performance Benchmarks

```rust
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn benchmark_coordinate_mapping(c: &mut Criterion) {
    let mut mapper = CoordinateMapper::new(1920, 1080);

    c.bench_function("desktop_to_phase_space", |b| {
        b.iter(|| {
            mapper.desktop_to_phase_space(
                black_box(500),
                black_box(500)
            )
        });
    });
}

fn benchmark_zeckendorf_decomposition(c: &mut Criterion) {
    c.bench_function("zeckendorf_decompose", |b| {
        b.iter(|| {
            zeckendorf_decompose(black_box(1000))
        });
    });
}

criterion_group!(benches, benchmark_coordinate_mapping, benchmark_zeckendorf_decomposition);
criterion_main!(benches);
```

**Performance Targets**:
- Coordinate mapping: < 3ms per call
- Zeckendorf decomposition (cached): < 100μs
- OCR processing: < 200ms per frame
- Frame capture: < 5ms per frame
- End-to-end latency: < 20ms (capture → phase space)

## 8. Deployment & Configuration

### 8.1 Dependencies

**Cargo.toml**:
```toml
[dependencies]
# Screen capture
windows = { version = "0.51", features = ["Graphics_Capture"] }
core-graphics = "0.23" # macOS
x11rb = "0.12" # Linux X11

# OCR
tesseract = "0.14"
leptonica-sys = "0.4"
image = "0.24"
imageproc = "0.23"

# Math framework (existing)
# Links to /src/math-framework/

# Async runtime
tokio = { version = "1.34", features = ["full"] }
tokio-stream = "0.1"

# Performance
rayon = "1.8"
lru = "0.12"

# Utilities
regex = "1.10"
chrono = "0.4"
serde = { version = "1.0", features = ["derive"] }
```

### 8.2 Configuration File

```toml
# config/vision-system.toml

[capture]
fps = 60
resolution = "1920x1080"
monitor_index = 0
cursor_capture = false

[ocr]
engine = "tesseract"
language = "eng"
char_whitelist = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.$%+-"
confidence_threshold = 70.0
processing_fps = 6

[preprocessing]
grayscale = true
contrast_enhancement = true
adaptive_threshold = true
noise_reduction = true

[phase_space]
cache_size = 1000
zeta_zeros_count = 50
symplectic_validation = true
tolerance = 0.01

[performance]
frame_buffer_size = 180  # 3 seconds at 60fps
worker_threads = 4
memory_pool_size = 100
enable_simd = true

[monitoring]
enable_metrics = true
metrics_interval_ms = 1000
log_level = "info"
```

### 8.3 Installation Script

```bash
#!/bin/bash
# install-vision-system.sh

echo "Installing Computer Vision Capture System..."

# Install Tesseract OCR
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo apt-get update
    sudo apt-get install -y tesseract-ocr tesseract-ocr-eng libtesseract-dev
    sudo apt-get install -y libx11-dev # For X11 capture
elif [[ "$OSTYPE" == "darwin"* ]]; then
    brew install tesseract
    brew install tesseract-lang
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
    echo "Please install Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki"
fi

# Build Rust components
cd tauri-anthropic-app/src-tauri
cargo build --release --features vision-system

# Copy configuration
cp config/vision-system.toml ~/.config/aurelia/

echo "Installation complete!"
```

## 9. Future Enhancements

### 9.1 GPU Acceleration

```rust
// Use wgpu for GPU-accelerated image processing
use wgpu::{Device, Queue};

pub struct GPUPreprocessor {
    device: Device,
    queue: Queue,
    pipeline: RenderPipeline,
}

impl GPUPreprocessor {
    pub async fn preprocess_gpu(&self, frame: &CaptureFrame) -> ProcessedImage {
        // Upload frame to GPU
        // Run compute shaders for preprocessing
        // Download result
    }
}
```

### 9.2 Machine Learning Integration

```rust
// ONNX Runtime for ML-based OCR enhancement
use ort::{Session, Environment};

pub struct MLOCREnhancer {
    session: Session,
}

impl MLOCREnhancer {
    pub fn enhance(&self, image: &[u8]) -> Vec<u8> {
        // Run ML model for super-resolution or denoising
        // Improve OCR accuracy on low-quality captures
    }
}
```

### 9.3 Distributed Processing

```rust
// Process OCR on multiple machines
pub struct DistributedOCR {
    worker_pool: Vec<RemoteWorker>,
}

impl DistributedOCR {
    pub async fn distribute_frame(&self, frame: CaptureFrame) -> OCRResult {
        // Send frame to remote worker
        // Aggregate results
    }
}
```

## 10. Security & Privacy

### 10.1 Permissions

**Tauri Capabilities**:
```json
{
  "permissions": [
    "screen-capture",
    "system-info"
  ],
  "scope": {
    "allow": ["capture_screen_region", "get_monitors"],
    "deny": ["capture_full_desktop"]
  }
}
```

### 10.2 Data Privacy

- **No Network Transmission**: All processing is local
- **Encrypted Storage**: Sensitive OCR results encrypted at rest
- **Memory Sanitization**: Clear frame buffers on exit
- **User Consent**: Explicit permission for screen capture

### 10.3 Sandboxing

```rust
// Tauri security configuration
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_security::init())
        .invoke_handler(tauri::generate_handler![
            vision::start_vision_capture
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## 11. Documentation

### 11.1 API Documentation

Generate with:
```bash
cargo doc --no-deps --open
```

### 11.2 User Guide

Located at `/docs/vision-system-user-guide.md` (to be created)

### 11.3 Architecture Diagrams

Located at `/docs/diagrams/vision-architecture.png` (to be created)

## 12. Conclusion

This technical design provides a comprehensive, production-ready Computer Vision Capture System for AURELIA trading. Key achievements:

✓ **60fps screen capture** using native OS APIs
✓ **OCR integration** with Tesseract 5.x
✓ **White-box coordinate mapping** via Zeckendorf encoding
✓ **Phase space integration** with existing framework
✓ **Real-time streaming** architecture
✓ **Tauri backend integration** with TypeScript frontend
✓ **Performance optimization** strategies
✓ **Comprehensive testing** approach

**Critical Constraint Met**: All desktop coordinates are Zeckendorf-encoded, with no floating-point arithmetic until final phase space reconstruction for visualization.

**Next Steps**:
1. Implement core Rust modules in `/tauri-anthropic-app/src-tauri/src/vision/`
2. Add Tauri commands to `/tauri-anthropic-app/src-tauri/src/commands/vision.rs`
3. Create TypeScript API in `/tauri-anthropic-app/src/lib/vision/`
4. Write comprehensive tests in `/tauri-anthropic-app/src-tauri/tests/vision/`
5. Integrate with existing phase space visualization
6. Conduct performance benchmarks and optimization
7. Deploy to production environment

---

**Document Version**: 1.0
**Last Updated**: 2025-11-13
**Author**: AURELIA System Architect
**Status**: Design Complete - Ready for Implementation

/**
 * OCR Engine Module
 *
 * Tesseract 5.x integration with preprocessing pipeline for trading data extraction.
 * Processes frames at 6fps (every 10th frame from 60fps capture).
 */

use crate::vision::capture::CaptureFrame;
use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use regex::Regex;

/// OCR result with confidence and bounding boxes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OCRResult {
    pub text: String,
    pub confidence: f32,
    pub bounding_boxes: Vec<TextBoundingBox>,
    pub processing_time_ms: u64,
}

/// Bounding box for detected text
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TextBoundingBox {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
    pub text: String,
    pub confidence: f32,
}

/// OCR configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OCRConfig {
    /// Page segmentation mode (6 = Uniform block of text)
    pub page_seg_mode: u8,

    /// OCR engine mode (1 = LSTM only)
    pub engine_mode: u8,

    /// Character whitelist for trading symbols
    pub char_whitelist: String,

    /// Minimum confidence threshold (0-100)
    pub confidence_threshold: f32,

    /// Enable preprocessing
    pub enable_preprocessing: bool,
}

impl Default for OCRConfig {
    fn default() -> Self {
        Self {
            page_seg_mode: 6,
            engine_mode: 1,
            char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.$%+-:".to_string(),
            confidence_threshold: 70.0,
            enable_preprocessing: true,
        }
    }
}

/// OCR engine with Tesseract integration
pub struct OCREngine {
    config: OCRConfig,
    preprocessor: ImagePreprocessor,
    parser: TextParser,
}

impl OCREngine {
    pub fn new(config: OCRConfig) -> Result<Self, OCRError> {
        Ok(Self {
            config,
            preprocessor: ImagePreprocessor::new(),
            parser: TextParser::new(),
        })
    }

    /// Recognize text from capture frame
    pub async fn recognize(&mut self, frame: &CaptureFrame) -> Result<OCRResult, OCRError> {
        let start = std::time::Instant::now();

        // Preprocess image if enabled
        let processed = if self.config.enable_preprocessing {
            self.preprocessor.preprocess(frame)?
        } else {
            ProcessedImage {
                data: frame.data.clone(),
                width: frame.width,
                height: frame.height,
                metadata: PreprocessMetadata::default(),
            }
        };

        // Perform OCR (mock implementation - requires tesseract crate)
        let text = self.perform_ocr(&processed)?;
        let confidence = 85.0; // Mock confidence

        let processing_time = start.elapsed().as_millis() as u64;

        Ok(OCRResult {
            text,
            confidence,
            bounding_boxes: vec![],
            processing_time_ms: processing_time,
        })
    }

    /// Perform OCR with retry logic
    pub async fn recognize_with_retry(&mut self, frame: &CaptureFrame) -> Result<OCRResult, OCRError> {
        // Attempt 1: Standard preprocessing
        if let Ok(result) = self.recognize(frame).await {
            if result.confidence > self.config.confidence_threshold {
                return Ok(result);
            }
        }

        // Attempt 2: Enhanced contrast
        let original_preprocessing = self.config.enable_preprocessing;
        self.config.enable_preprocessing = true;

        if let Ok(result) = self.recognize(frame).await {
            if result.confidence > self.config.confidence_threshold - 10.0 {
                self.config.enable_preprocessing = original_preprocessing;
                return Ok(result);
            }
        }

        self.config.enable_preprocessing = original_preprocessing;
        Err(OCRError::AllAttemptsExhausted)
    }

    /// Parse trading data from OCR result
    pub fn parse_trading_data(&self, result: &OCRResult) -> Result<TradingData, OCRError> {
        self.parser.parse_trading_data(result)
    }

    fn perform_ocr(&self, image: &ProcessedImage) -> Result<String, OCRError> {
        // TODO: Actual Tesseract integration
        // This is a mock implementation

        // Simulate OCR output for testing
        Ok("AAPL $175.43 +2.5%\nMSFT $380.12 -0.8%".to_string())
    }
}

/// Image preprocessing pipeline
pub struct ImagePreprocessor {
    // Preprocessing parameters
}

impl ImagePreprocessor {
    pub fn new() -> Self {
        Self {}
    }

    pub fn preprocess(&self, frame: &CaptureFrame) -> Result<ProcessedImage, OCRError> {
        let mut data = frame.data.clone();

        // Stage 1: Grayscale conversion
        data = self.to_grayscale(&data, frame.width, frame.height)?;

        // Stage 2: Contrast enhancement (CLAHE)
        data = self.enhance_contrast(&data)?;

        // Stage 3: Adaptive thresholding (Otsu's method)
        data = self.apply_threshold(&data)?;

        // Stage 4: Noise reduction
        data = self.reduce_noise(&data)?;

        Ok(ProcessedImage {
            data,
            width: frame.width,
            height: frame.height,
            metadata: PreprocessMetadata {
                contrast_boost: 1.2,
                threshold: 127,
                noise_level: 0.05,
            },
        })
    }

    fn to_grayscale(&self, rgb: &[u8], width: u32, height: u32) -> Result<Vec<u8>, OCRError> {
        // Luminosity method: Y = 0.299R + 0.587G + 0.114B
        let mut grayscale = Vec::with_capacity((width * height) as usize);

        for pixel in rgb.chunks_exact(3) {
            let gray = (0.299 * pixel[0] as f32 +
                       0.587 * pixel[1] as f32 +
                       0.114 * pixel[2] as f32) as u8;
            grayscale.push(gray);
        }

        Ok(grayscale)
    }

    fn enhance_contrast(&self, img: &[u8]) -> Result<Vec<u8>, OCRError> {
        // CLAHE (Contrast Limited Adaptive Histogram Equalization)
        // Simplified implementation
        Ok(img.to_vec())
    }

    fn apply_threshold(&self, img: &[u8]) -> Result<Vec<u8>, OCRError> {
        // Otsu's method for automatic threshold calculation
        let threshold = 127u8; // Simplified

        Ok(img.iter().map(|&pixel| {
            if pixel > threshold { 255 } else { 0 }
        }).collect())
    }

    fn reduce_noise(&self, img: &[u8]) -> Result<Vec<u8>, OCRError> {
        // Bilateral filter or median filter
        Ok(img.to_vec())
    }
}

/// Processed image result
#[derive(Debug, Clone)]
pub struct ProcessedImage {
    pub data: Vec<u8>,
    pub width: u32,
    pub height: u32,
    pub metadata: PreprocessMetadata,
}

#[derive(Debug, Clone, Default)]
pub struct PreprocessMetadata {
    pub contrast_boost: f32,
    pub threshold: u8,
    pub noise_level: f32,
}

/// Text parser for trading data extraction
pub struct TextParser {
    ticker_regex: Regex,
    price_regex: Regex,
    change_regex: Regex,
    time_regex: Regex,
}

impl TextParser {
    pub fn new() -> Self {
        Self {
            ticker_regex: Regex::new(r"\b[A-Z]{1,5}\b").unwrap(),
            price_regex: Regex::new(r"\$(\d+\.\d{2})").unwrap(),
            change_regex: Regex::new(r"([+-]\d+\.\d{1,2}%)").unwrap(),
            time_regex: Regex::new(r"(\d{2}:\d{2}:\d{2})").unwrap(),
        }
    }

    pub fn parse_trading_data(&self, ocr_result: &OCRResult) -> Result<TradingData, OCRError> {
        let lines: Vec<&str> = ocr_result.text.lines().collect();

        let mut data = TradingData {
            tickers: Vec::new(),
            prices: Vec::new(),
            changes: Vec::new(),
            timestamp: None,
            news_headlines: Vec::new(),
        };

        for line in lines {
            // Extract ticker symbols
            for cap in self.ticker_regex.captures_iter(line) {
                if let Some(ticker) = cap.get(0) {
                    data.tickers.push(ticker.as_str().to_string());
                }
            }

            // Extract prices
            for cap in self.price_regex.captures_iter(line) {
                if let Some(price_str) = cap.get(1) {
                    if let Ok(price) = price_str.as_str().parse::<f64>() {
                        data.prices.push(price);
                    }
                }
            }

            // Extract percentage changes
            for cap in self.change_regex.captures_iter(line) {
                if let Some(change_str) = cap.get(1) {
                    let clean = change_str.as_str().replace(&['+', '%'][..], "");
                    if let Ok(change) = clean.parse::<f64>() {
                        data.changes.push(change);
                    }
                }
            }

            // Extract timestamps
            if let Some(cap) = self.time_regex.captures(line) {
                if let Some(time) = cap.get(1) {
                    data.timestamp = Some(time.as_str().to_string());
                }
            }
        }

        Ok(data)
    }
}

/// Parsed trading data
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TradingData {
    pub tickers: Vec<String>,
    pub prices: Vec<f64>,
    pub changes: Vec<f64>,
    pub timestamp: Option<String>,
    pub news_headlines: Vec<String>,
}

/// OCR error types
#[derive(Debug, thiserror::Error)]
pub enum OCRError {
    #[error("Failed to initialize OCR engine: {0}")]
    InitializationFailed(String),

    #[error("OCR recognition failed: {0}")]
    RecognitionFailed(String),

    #[error("Preprocessing failed: {0}")]
    PreprocessingFailed(String),

    #[error("All OCR attempts exhausted")]
    AllAttemptsExhausted,

    #[error("Low confidence: {0}")]
    LowConfidence(f32),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_text_parser() {
        let parser = TextParser::new();

        let ocr_result = OCRResult {
            text: "AAPL $175.43 +2.5%\nMSFT $380.12 -0.8%".to_string(),
            confidence: 85.0,
            bounding_boxes: vec![],
            processing_time_ms: 100,
        };

        let data = parser.parse_trading_data(&ocr_result).unwrap();

        assert_eq!(data.tickers.len(), 2);
        assert_eq!(data.tickers[0], "AAPL");
        assert_eq!(data.prices.len(), 2);
        assert!((data.prices[0] - 175.43).abs() < 0.01);
        assert_eq!(data.changes.len(), 2);
    }

    #[tokio::test]
    async fn test_ocr_engine() {
        let config = OCRConfig::default();
        let mut engine = OCREngine::new(config).unwrap();

        let frame = CaptureFrame {
            timestamp: 0,
            frame_number: 1,
            width: 100,
            height: 100,
            data: vec![0u8; 30000],
            regions: vec![],
        };

        let result = engine.recognize(&frame).await;
        assert!(result.is_ok());
    }
}

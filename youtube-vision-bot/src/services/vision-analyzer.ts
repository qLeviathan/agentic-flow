import cv from 'opencv4nodejs';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { logger } from '../utils/logger.js';
import type { Frame } from './youtube-service.js';
import type { SwarmCoordinator } from '../agents/swarm-coordinator.js';

export interface FrameAnalysis {
  frameIndex: number;
  timestamp: number;
  objects: DetectedObject[];
  text: ExtractedText[];
  faces: DetectedFace[];
  scenes: SceneInfo;
  dominantColors: ColorInfo[];
}

export interface DetectedObject {
  label: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export interface ExtractedText {
  text: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export interface DetectedFace {
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  landmarks?: any;
}

export interface SceneInfo {
  brightness: number;
  contrast: number;
  sharpness: number;
  sceneChange: boolean;
}

export interface ColorInfo {
  rgb: [number, number, number];
  percentage: number;
}

export interface TextAnalysis {
  summary: string;
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  entities: Array<{ text: string; type: string }>;
}

export class VisionAnalyzer {
  private faceClassifier: cv.CascadeClassifier | null = null;

  async initialize(): Promise<void> {
    try {
      // Load Haar cascade for face detection
      this.faceClassifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);
      logger.info('✅ Vision analyzer initialized');
    } catch (error) {
      logger.error(`Vision analyzer initialization failed: ${error}`);
      throw error;
    }
  }

  async analyzeFrames(
    frames: Frame[],
    swarm: SwarmCoordinator
  ): Promise<FrameAnalysis[]> {
    logger.info(`🔍 Analyzing ${frames.length} frames using swarm...`);

    // Distribute frame analysis across swarm agents
    const analyses = await swarm.distributeTask<FrameAnalysis>(
      'analyze-frames',
      frames.map((frame, index) => ({
        taskId: `frame-${index}`,
        data: frame,
        analyzer: this,
      }))
    );

    return analyses;
  }

  async analyzeFrame(frame: Frame): Promise<FrameAnalysis> {
    try {
      const image = await cv.imreadAsync(frame.path);

      // Parallel analysis tasks
      const [objects, text, faces, scenes, colors] = await Promise.all([
        this.detectObjects(image),
        this.extractText(frame.path),
        this.detectFaces(image),
        this.analyzeScene(image),
        this.extractDominantColors(frame.path),
      ]);

      return {
        frameIndex: frame.index,
        timestamp: frame.timestamp,
        objects,
        text,
        faces,
        scenes,
        dominantColors: colors,
      };
    } catch (error) {
      logger.error(`Frame analysis failed for ${frame.path}: ${error}`);
      throw error;
    }
  }

  private async detectObjects(image: cv.Mat): Promise<DetectedObject[]> {
    // Simplified object detection using color-based segmentation
    // In production, use TensorFlow.js or ONNX models
    const objects: DetectedObject[] = [];

    try {
      const gray = image.cvtColor(cv.COLOR_BGR2GRAY);
      const blurred = gray.gaussianBlur(new cv.Size(5, 5), 0);
      const edges = blurred.canny(50, 150);

      const contours = edges.findContours(cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      contours.slice(0, 10).forEach((contour, index) => {
        const rect = contour.boundingRect();
        if (rect.width > 50 && rect.height > 50) {
          objects.push({
            label: `object_${index}`,
            confidence: 0.7,
            boundingBox: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            },
          });
        }
      });

      return objects;
    } catch (error) {
      logger.error(`Object detection failed: ${error}`);
      return [];
    }
  }

  private async extractText(imagePath: string): Promise<ExtractedText[]> {
    try {
      const { data } = await Tesseract.recognize(imagePath, 'eng', {
        logger: (m) => {}, // Suppress Tesseract logs
      });

      return data.words.map((word) => ({
        text: word.text,
        confidence: word.confidence / 100,
        boundingBox: {
          x: word.bbox.x0,
          y: word.bbox.y0,
          width: word.bbox.x1 - word.bbox.x0,
          height: word.bbox.y1 - word.bbox.y0,
        },
      }));
    } catch (error) {
      logger.error(`Text extraction failed: ${error}`);
      return [];
    }
  }

  private async detectFaces(image: cv.Mat): Promise<DetectedFace[]> {
    if (!this.faceClassifier) {
      return [];
    }

    try {
      const gray = image.cvtColor(cv.COLOR_BGR2GRAY);
      const faces = this.faceClassifier.detectMultiScale(gray);

      return faces.objects.map((rect) => ({
        confidence: 0.9,
        boundingBox: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        },
      }));
    } catch (error) {
      logger.error(`Face detection failed: ${error}`);
      return [];
    }
  }

  private async analyzeScene(image: cv.Mat): Promise<SceneInfo> {
    try {
      const gray = image.cvtColor(cv.COLOR_BGR2GRAY);

      // Calculate brightness
      const mean = gray.mean();
      const brightness = mean[0] / 255;

      // Calculate contrast (standard deviation)
      const stdDev = gray.stddev();
      const contrast = stdDev[0] / 128;

      // Calculate sharpness (Laplacian variance)
      const laplacian = gray.laplacian(cv.CV_64F);
      const variance = laplacian.stddev()[0];
      const sharpness = variance / 100;

      return {
        brightness,
        contrast,
        sharpness,
        sceneChange: false, // Would compare with previous frame
      };
    } catch (error) {
      logger.error(`Scene analysis failed: ${error}`);
      return {
        brightness: 0,
        contrast: 0,
        sharpness: 0,
        sceneChange: false,
      };
    }
  }

  private async extractDominantColors(imagePath: string): Promise<ColorInfo[]> {
    try {
      const { dominant } = await sharp(imagePath).stats();

      return [
        {
          rgb: [dominant.r, dominant.g, dominant.b],
          percentage: 1.0,
        },
      ];
    } catch (error) {
      logger.error(`Color extraction failed: ${error}`);
      return [];
    }
  }

  async analyzeText(transcript: any): Promise<TextAnalysis> {
    // Simplified NLP analysis
    // In production, use transformers.js or external NLP API
    const text = transcript.text || '';
    const words = text.toLowerCase().split(/\s+/);

    // Extract keywords (simple frequency analysis)
    const wordFreq = new Map<string, number>();
    words.forEach((word) => {
      if (word.length > 4) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    });

    const keywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);

    // Simple sentiment analysis
    const positiveWords = ['good', 'great', 'awesome', 'excellent', 'love'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'poor'];

    const positiveCount = words.filter((w) => positiveWords.includes(w)).length;
    const negativeCount = words.filter((w) => negativeWords.includes(w)).length;

    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    if (positiveCount > negativeCount * 1.5) sentiment = 'positive';
    else if (negativeCount > positiveCount * 1.5) sentiment = 'negative';

    return {
      summary: text.slice(0, 200) + '...',
      keywords,
      sentiment,
      topics: keywords.slice(0, 5),
      entities: [],
    };
  }
}

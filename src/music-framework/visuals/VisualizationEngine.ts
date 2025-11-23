/**
 * VisualizationEngine - Main orchestration engine for audio visualizations
 * Coordinates audio analysis, visual mapping, rendering, and export
 */

import { AudioVisualMapper, AudioAnalysisData, VisualData, MapperConfig, defaultMapperConfig } from './AudioVisualMapper';

export interface EngineConfig {
  container: HTMLElement;
  audio: AudioConfig;
  visual: VisualConfig;
  performance: PerformanceConfig;
}

export interface AudioConfig {
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
}

export interface VisualConfig {
  width: number;
  height: number;
  renderer: '2d' | 'webgl';
  backgroundColor: string;
  fps: number;
}

export interface PerformanceConfig {
  enableWebWorkers: boolean;
  enableOffscreenCanvas: boolean;
  targetFPS: number;
  adaptiveQuality: boolean;
}

export interface Visualizer {
  name: string;
  type: '2D' | '3D' | 'hybrid';

  initialize(renderer: any): Promise<void>;
  update(visualData: VisualData, deltaTime: number): void;
  render(): void;
  dispose(): void;

  setParameter(key: string, value: any): void;
  getParameters(): VisualizerParameter[];
}

export interface VisualizerParameter {
  key: string;
  label: string;
  type: 'number' | 'boolean' | 'color' | 'select';
  value: any;
  min?: number;
  max?: number;
  options?: string[];
}

export interface ExportConfig {
  format: 'mp4' | 'webm' | 'gif';
  width: number;
  height: number;
  frameRate: number;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  duration?: number; // in seconds
}

export interface ExportProgress {
  currentFrame: number;
  totalFrames: number;
  percentage: number;
  estimatedTimeRemaining: number;
  encodedBytes: number;
}

/**
 * Main Visualization Engine
 */
export class VisualizationEngine {
  private config: EngineConfig;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private audioSource: MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null = null;

  private mapper: AudioVisualMapper;
  private visualizer: Visualizer | null = null;
  private renderer: any = null;

  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;

  // Audio data buffers
  private frequencyData: Uint8Array | null = null;
  private timeDomainData: Uint8Array | null = null;

  // Performance monitoring
  private fps: number = 0;
  private fpsUpdateTime: number = 0;
  private frameTimeHistory: number[] = [];

  // Export state
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private exportProgress: ExportProgress | null = null;

  constructor(config: EngineConfig) {
    this.config = config;
    this.mapper = new AudioVisualMapper(defaultMapperConfig);
  }

  /**
   * Initialize the engine
   */
  async initialize(): Promise<void> {
    // Create audio context
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

    // Create analyser node
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = this.config.audio.fftSize;
    this.analyser.smoothingTimeConstant = this.config.audio.smoothingTimeConstant;
    this.analyser.minDecibels = this.config.audio.minDecibels;
    this.analyser.maxDecibels = this.config.audio.maxDecibels;

    // Allocate audio data buffers
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeDomainData = new Uint8Array(this.analyser.fftSize);

    // Initialize renderer based on config
    await this.initializeRenderer();
  }

  /**
   * Initialize renderer (Canvas 2D or WebGL)
   */
  private async initializeRenderer(): Promise<void> {
    const canvas = document.createElement('canvas');
    canvas.width = this.config.visual.width;
    canvas.height = this.config.visual.height;
    this.config.container.appendChild(canvas);

    if (this.config.visual.renderer === '2d') {
      this.renderer = canvas.getContext('2d', {
        alpha: false,
        desynchronized: true
      });
    } else {
      // WebGL renderer setup would go here
      // For now, fallback to 2D
      this.renderer = canvas.getContext('2d');
    }
  }

  /**
   * Connect audio source
   */
  connectAudioSource(source: HTMLAudioElement | HTMLVideoElement | MediaStream): void {
    if (!this.audioContext || !this.analyser) {
      throw new Error('Engine not initialized');
    }

    // Disconnect previous source
    if (this.audioSource) {
      this.audioSource.disconnect();
    }

    // Create appropriate audio source
    if (source instanceof MediaStream) {
      this.audioSource = this.audioContext.createMediaStreamSource(source);
    } else {
      this.audioSource = this.audioContext.createMediaElementSource(source);
    }

    // Connect to analyser
    this.audioSource.connect(this.analyser);

    // Connect analyser to destination (so audio plays)
    this.analyser.connect(this.audioContext.destination);
  }

  /**
   * Set active visualizer
   */
  setVisualizer(visualizer: Visualizer): void {
    // Dispose previous visualizer
    if (this.visualizer) {
      this.visualizer.dispose();
    }

    this.visualizer = visualizer;
    this.visualizer.initialize(this.renderer);
  }

  /**
   * Update mapper configuration
   */
  updateMapperConfig(config: Partial<MapperConfig>): void {
    this.mapper.updateConfig(config);
  }

  /**
   * Start visualization
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.fpsUpdateTime = this.lastFrameTime;
    this.renderLoop();
  }

  /**
   * Stop visualization
   */
  stop(): void {
    this.isRunning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Main render loop
   */
  private renderLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Update FPS counter
    this.updateFPS(currentTime, deltaTime);

    // Get audio analysis data
    const audioData = this.analyzeAudio();

    // Map audio to visual parameters
    const visualData = this.mapper.map(audioData);

    // Update visualizer
    if (this.visualizer) {
      this.visualizer.update(visualData, deltaTime);
      this.visualizer.render();
    }

    this.frameCount++;

    // Continue loop
    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  };

  /**
   * Analyze audio and extract features
   */
  private analyzeAudio(): AudioAnalysisData {
    if (!this.analyser || !this.frequencyData || !this.timeDomainData) {
      throw new Error('Analyser not initialized');
    }

    // Get frequency and time domain data
    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeDomainData);

    // Convert to Float32Array (normalized)
    const floatFrequency = this.uint8ToFloat32(this.frequencyData);
    const floatTime = this.uint8ToFloat32(this.timeDomainData);

    // Extract features (simplified for now)
    const features = this.extractFeatures(floatFrequency, floatTime);

    // Beat detection (simplified)
    const beat = this.detectBeat(floatFrequency);

    return {
      frequencyData: floatFrequency,
      timeDomainData: floatTime,
      features,
      beat,
      timestamp: performance.now()
    };
  }

  /**
   * Convert Uint8Array to Float32Array (normalized to 0-1)
   */
  private uint8ToFloat32(data: Uint8Array): Float32Array {
    const float = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      float[i] = data[i] / 255;
    }
    return float;
  }

  /**
   * Extract audio features (simplified implementation)
   */
  private extractFeatures(frequencyData: Float32Array, timeDomainData: Float32Array): any {
    // Calculate RMS energy
    const rmsEnergy = Math.sqrt(
      timeDomainData.reduce((sum, val) => sum + val * val, 0) / timeDomainData.length
    );

    // Calculate spectral centroid (brightness)
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      numerator += i * frequencyData[i];
      denominator += frequencyData[i];
    }
    const spectralCentroid = denominator > 0 ? numerator / denominator : 0;

    // Simplified features
    return {
      spectralCentroid,
      spectralRolloff: 0,
      spectralFlux: 0,
      spectralFlatness: 0,
      rmsEnergy,
      energyByBand: this.calculateBandEnergies(frequencyData),
      zeroCrossingRate: 0,
      onsetDetected: false,
      beatConfidence: 0,
      tempo: 0,
      harmonicRatio: 0,
      pitchEstimate: 0,
      chroma: []
    };
  }

  /**
   * Calculate energy by frequency band
   */
  private calculateBandEnergies(frequencyData: Float32Array): number[] {
    const bands = [
      [0, 4],      // Sub-bass
      [4, 8],      // Bass
      [8, 16],     // Low-mid
      [16, 64],    // Mid
      [64, 256],   // High-mid
      [256, 512]   // High
    ];

    return bands.map(([start, end]) => {
      let sum = 0;
      for (let i = start; i < end && i < frequencyData.length; i++) {
        sum += frequencyData[i];
      }
      return sum / (end - start);
    });
  }

  /**
   * Simple beat detection
   */
  private detectBeat(frequencyData: Float32Array): any {
    // Calculate energy in bass range
    const bassEnergy = frequencyData.slice(0, 10).reduce((sum, val) => sum + val, 0) / 10;

    // Simplified beat detection (would be more sophisticated in production)
    if (bassEnergy > 0.7) {
      return {
        timestamp: performance.now(),
        energy: bassEnergy,
        confidence: bassEnergy
      };
    }

    return null;
  }

  /**
   * Update FPS counter
   */
  private updateFPS(currentTime: number, deltaTime: number): void {
    this.frameTimeHistory.push(deltaTime);

    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
    }

    if (currentTime - this.fpsUpdateTime >= 1000) {
      const avgFrameTime = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
      this.fps = 1000 / avgFrameTime;
      this.fpsUpdateTime = currentTime;
    }
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Start video export
   */
  async startExport(config: ExportConfig): Promise<void> {
    const canvas = this.config.container.querySelector('canvas');
    if (!canvas) {
      throw new Error('Canvas not found');
    }

    // Create stream from canvas
    const stream = (canvas as HTMLCanvasElement).captureStream(config.frameRate);

    // Add audio track if available
    if (this.audioContext && this.analyser) {
      const dest = this.audioContext.createMediaStreamDestination();
      this.analyser.connect(dest);
      stream.addTrack(dest.stream.getAudioTracks()[0]);
    }

    // Determine MIME type
    let mimeType: string;
    if (config.format === 'mp4') {
      mimeType = 'video/mp4;codecs=h264';
    } else if (config.format === 'webm') {
      mimeType = 'video/webm;codecs=vp9';
    } else {
      throw new Error('GIF export not yet implemented');
    }

    // Create MediaRecorder
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: config.videoBitsPerSecond || 5000000,
      audioBitsPerSecond: config.audioBitsPerSecond || 128000
    });

    this.recordedChunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(100); // Collect chunks every 100ms

    // Initialize export progress
    const totalFrames = config.duration ? config.duration * config.frameRate : 0;
    this.exportProgress = {
      currentFrame: 0,
      totalFrames,
      percentage: 0,
      estimatedTimeRemaining: 0,
      encodedBytes: 0
    };
  }

  /**
   * Stop video export
   */
  async stopExport(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder!.mimeType
        });
        this.recordedChunks = [];
        this.exportProgress = null;
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Get export progress
   */
  getExportProgress(): ExportProgress | null {
    if (!this.exportProgress) return null;

    return {
      ...this.exportProgress,
      currentFrame: this.frameCount,
      percentage: this.exportProgress.totalFrames > 0
        ? (this.frameCount / this.exportProgress.totalFrames) * 100
        : 0,
      encodedBytes: this.recordedChunks.reduce((sum, chunk) => sum + chunk.size, 0)
    };
  }

  /**
   * Resize canvas
   */
  resize(width: number, height: number): void {
    const canvas = this.config.container.querySelector('canvas');
    if (canvas) {
      (canvas as HTMLCanvasElement).width = width;
      (canvas as HTMLCanvasElement).height = height;
    }

    this.config.visual.width = width;
    this.config.visual.height = height;
  }

  /**
   * Cleanup and dispose
   */
  dispose(): void {
    this.stop();

    if (this.visualizer) {
      this.visualizer.dispose();
    }

    if (this.audioSource) {
      this.audioSource.disconnect();
    }

    if (this.analyser) {
      this.analyser.disconnect();
    }

    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

/**
 * Default engine configuration
 */
export const defaultEngineConfig: Partial<EngineConfig> = {
  audio: {
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    minDecibels: -90,
    maxDecibels: -10
  },
  visual: {
    width: 1920,
    height: 1080,
    renderer: '2d',
    backgroundColor: '#000000',
    fps: 60
  },
  performance: {
    enableWebWorkers: true,
    enableOffscreenCanvas: true,
    targetFPS: 60,
    adaptiveQuality: true
  }
};

# Visual Dynamics System - Architecture Design

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Zordic Music Studio                         │
│                   Visual Dynamics System                         │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌────────▼────────┐   ┌───────▼────────┐
│  Audio Layer   │   │  Visual Layer   │   │  Export Layer  │
└───────┬────────┘   └────────┬────────┘   └───────┬────────┘
        │                     │                     │
┌───────▼────────────────────▼─────────────────────▼────────┐
│              Core Visualization Engine                     │
└────────────────────────────────────────────────────────────┘
```

## 1. Layer Architecture

### 1.1 Audio Layer

**Responsibility**: Audio capture, analysis, and feature extraction

```typescript
// /src/music-framework/visuals/audio/AudioAnalyzer.ts

interface AudioLayer {
  // Components
  audioContext: AudioContext;
  analyserNode: AnalyserNode;
  audioSource: MediaElementAudioSourceNode | MediaStreamAudioSourceNode;

  // Analysis outputs
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
  beatDetector: BeatDetector;
  featureExtractor: AudioFeatureExtractor;

  // Methods
  connect(source: AudioNode): void;
  disconnect(): void;
  getFrequencyData(): Float32Array;
  getTimeDomainData(): Float32Array;
  getBeatData(): BeatData;
  getFeatures(): AudioFeatures;
}

interface AudioFeatures {
  // Spectral features
  spectralCentroid: number;      // Brightness
  spectralRolloff: number;       // High-frequency content
  spectralFlux: number;          // Change over time
  spectralFlatness: number;      // Noisiness

  // Energy features
  rmsEnergy: number;             // Overall loudness
  energyByBand: number[];        // Per-band energy
  zeroCrossingRate: number;      // Pitch indicator

  // Temporal features
  onsetDetected: boolean;        // Note/hit detected
  beatConfidence: number;        // Beat detection certainty
  tempo: number;                 // Estimated BPM

  // Harmonic features
  harmonicRatio: number;         // Harmonic vs noise
  pitchEstimate: number;         // Fundamental frequency
  chroma: number[];              // Pitch class profile
}
```

**Component Breakdown**:

```typescript
// Beat Detection System
class BeatDetector {
  private energyHistory: CircularBuffer<number>;
  private threshold: number;
  private cooldownTimer: number;

  constructor(config: BeatDetectorConfig) {
    this.energyHistory = new CircularBuffer(43); // ~1 second at 43 FPS
    this.threshold = config.initialThreshold;
  }

  detect(audioData: Float32Array): BeatEvent | null {
    const energy = this.calculateEnergy(audioData);
    const average = this.energyHistory.average();
    const variance = this.energyHistory.variance();

    // Adaptive threshold
    const threshold = average + (variance * this.threshold);

    if (energy > threshold && this.cooldownTimer === 0) {
      this.cooldownTimer = 15; // Cooldown frames
      return {
        timestamp: performance.now(),
        energy: energy,
        confidence: Math.min((energy - threshold) / threshold, 1)
      };
    }

    this.cooldownTimer = Math.max(0, this.cooldownTimer - 1);
    this.energyHistory.push(energy);
    return null;
  }

  private calculateEnergy(data: Float32Array): number {
    return data.reduce((sum, val) => sum + val * val, 0) / data.length;
  }
}

// Feature Extraction
class AudioFeatureExtractor {
  private fftSize: number;
  private sampleRate: number;

  extractFeatures(
    frequencyData: Float32Array,
    timeDomainData: Float32Array
  ): AudioFeatures {
    return {
      spectralCentroid: this.calculateSpectralCentroid(frequencyData),
      spectralRolloff: this.calculateSpectralRolloff(frequencyData),
      spectralFlux: this.calculateSpectralFlux(frequencyData),
      spectralFlatness: this.calculateSpectralFlatness(frequencyData),
      rmsEnergy: this.calculateRMS(timeDomainData),
      energyByBand: this.calculateBandEnergies(frequencyData),
      zeroCrossingRate: this.calculateZCR(timeDomainData),
      onsetDetected: this.detectOnset(frequencyData),
      beatConfidence: 0, // Provided by BeatDetector
      tempo: 0, // Provided by tempo estimator
      harmonicRatio: this.calculateHarmonicRatio(frequencyData),
      pitchEstimate: this.estimatePitch(frequencyData),
      chroma: this.calculateChroma(frequencyData)
    };
  }

  private calculateSpectralCentroid(data: Float32Array): number {
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < data.length; i++) {
      const frequency = (i * this.sampleRate) / this.fftSize;
      numerator += frequency * data[i];
      denominator += data[i];
    }

    return denominator === 0 ? 0 : numerator / denominator;
  }

  // Additional feature calculation methods...
}
```

### 1.2 Visual Layer

**Responsibility**: Rendering visualizations, managing renderers, handling visual state

```typescript
// /src/music-framework/visuals/core/VisualLayer.ts

interface VisualLayer {
  // Renderers
  canvas2D: Canvas2DRenderer | null;
  webGL: WebGLRenderer | null;
  currentRenderer: Renderer;

  // Visualizers
  activeVisualizer: Visualizer;
  visualizerRegistry: Map<string, VisualizerFactory>;

  // State
  renderState: RenderState;
  parameters: VisualizerParameters;

  // Methods
  setVisualizer(type: string, params?: Partial<VisualizerParameters>): void;
  render(audioData: AudioAnalysisData): void;
  resize(width: number, height: number): void;
  destroy(): void;
}

interface Visualizer {
  name: string;
  type: '2D' | '3D' | 'hybrid';

  // Lifecycle
  initialize(renderer: Renderer): Promise<void>;
  update(audioData: AudioAnalysisData, deltaTime: number): void;
  render(): void;
  dispose(): void;

  // Configuration
  getParameters(): VisualizerParameter[];
  setParameter(key: string, value: any): void;
  getPresets(): VisualizerPreset[];
  applyPreset(presetName: string): void;
}
```

**Visualizer Plugin Architecture**:

```typescript
// Base Visualizer Class
abstract class BaseVisualizer implements Visualizer {
  protected renderer: Renderer;
  protected parameters: Map<string, any>;
  protected animationState: AnimationState;

  abstract name: string;
  abstract type: '2D' | '3D' | 'hybrid';

  async initialize(renderer: Renderer): Promise<void> {
    this.renderer = renderer;
    await this.onInitialize();
  }

  update(audioData: AudioAnalysisData, deltaTime: number): void {
    // Update animation state
    this.animationState.time += deltaTime;

    // Process audio data
    this.processAudioData(audioData);

    // Custom update logic
    this.onUpdate(deltaTime);
  }

  render(): void {
    this.onRender();
  }

  dispose(): void {
    this.onDispose();
  }

  // Hooks for subclasses
  protected abstract onInitialize(): Promise<void>;
  protected abstract processAudioData(data: AudioAnalysisData): void;
  protected abstract onUpdate(deltaTime: number): void;
  protected abstract onRender(): void;
  protected abstract onDispose(): void;

  // Parameter management
  setParameter(key: string, value: any): void {
    this.parameters.set(key, value);
    this.onParameterChanged(key, value);
  }

  protected onParameterChanged(key: string, value: any): void {
    // Override in subclasses
  }
}

// Example: Spectrum Analyzer Visualizer
class SpectrumAnalyzerVisualizer extends BaseVisualizer {
  name = 'Spectrum Analyzer';
  type = '2D' as const;

  private bars: SpectrumBar[];
  private colorMapper: ColorMapper;

  protected async onInitialize(): Promise<void> {
    this.bars = this.createBars();
    this.colorMapper = new FrequencyColorMapper();
  }

  protected processAudioData(data: AudioAnalysisData): void {
    const frequencies = data.frequencyData;

    for (let i = 0; i < this.bars.length; i++) {
      const bar = this.bars[i];
      const targetHeight = frequencies[i] / 255; // Normalize

      // Smooth animation
      bar.height += (targetHeight - bar.height) * 0.3;

      // Color mapping
      bar.color = this.colorMapper.map(bar.frequency, bar.height);
    }
  }

  protected onUpdate(deltaTime: number): void {
    // Additional animation logic
  }

  protected onRender(): void {
    const ctx = (this.renderer as Canvas2DRenderer).context;

    for (const bar of this.bars) {
      ctx.fillStyle = bar.color;
      ctx.fillRect(bar.x, bar.y, bar.width, bar.height * bar.maxHeight);
    }
  }

  protected onDispose(): void {
    this.bars = [];
  }

  private createBars(): SpectrumBar[] {
    const barCount = 64;
    const bars: SpectrumBar[] = [];

    for (let i = 0; i < barCount; i++) {
      bars.push({
        x: (i / barCount) * this.renderer.width,
        y: 0,
        width: this.renderer.width / barCount,
        height: 0,
        maxHeight: this.renderer.height,
        frequency: this.getFrequencyForBin(i, barCount),
        color: '#ffffff'
      });
    }

    return bars;
  }
}
```

### 1.3 Export Layer

**Responsibility**: Video encoding, frame capture, format conversion

```typescript
// /src/music-framework/visuals/export/ExportLayer.ts

interface ExportLayer {
  // Encoder
  mediaRecorder: MediaRecorder | null;
  frameCapture: FrameCaptureSystem;

  // State
  exportSession: ExportSession | null;

  // Methods
  startExport(config: ExportConfig): Promise<ExportSession>;
  stopExport(): Promise<Blob>;
  cancelExport(): void;
  captureFrame(): Promise<ImageData>;
}

class ExportSession {
  private config: ExportConfig;
  private recorder: MediaRecorder;
  private chunks: Blob[] = [];
  private frameCount: number = 0;
  private startTime: number;

  constructor(
    canvas: HTMLCanvasElement,
    audioTrack: MediaStreamTrack,
    config: ExportConfig
  ) {
    this.config = config;
    this.startTime = performance.now();

    // Create canvas stream
    const canvasStream = canvas.captureStream(config.frameRate);

    // Combine with audio
    const stream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      audioTrack
    ]);

    // Create recorder
    this.recorder = new MediaRecorder(stream, {
      mimeType: config.mimeType,
      videoBitsPerSecond: config.videoBitsPerSecond,
      audioBitsPerSecond: config.audioBitsPerSecond
    });

    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };
  }

  start(): void {
    this.recorder.start(100); // Collect chunks every 100ms
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      this.recorder.onstop = () => {
        const blob = new Blob(this.chunks, {
          type: this.config.mimeType
        });
        resolve(blob);
      };

      this.recorder.stop();
    });
  }

  getProgress(): ExportProgress {
    return {
      currentFrame: this.frameCount,
      totalFrames: this.config.totalFrames,
      percentage: (this.frameCount / this.config.totalFrames) * 100,
      estimatedTimeRemaining: this.calculateETA(),
      encodedBytes: this.chunks.reduce((sum, chunk) => sum + chunk.size, 0),
      errors: []
    };
  }

  private calculateETA(): number {
    const elapsed = performance.now() - this.startTime;
    const framesRemaining = this.config.totalFrames - this.frameCount;
    const msPerFrame = elapsed / this.frameCount;
    return framesRemaining * msPerFrame;
  }
}
```

## 2. Core Engine Architecture

### 2.1 Visualization Engine

```typescript
// /src/music-framework/visuals/core/VisualizationEngine.ts

class VisualizationEngine {
  private audioLayer: AudioLayer;
  private visualLayer: VisualLayer;
  private exportLayer: ExportLayer;

  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastFrameTime: number = 0;

  constructor(container: HTMLElement, config: EngineConfig) {
    this.audioLayer = new AudioLayer(config.audio);
    this.visualLayer = new VisualLayer(container, config.visual);
    this.exportLayer = new ExportLayer();
  }

  async initialize(): Promise<void> {
    await this.audioLayer.initialize();
    await this.visualLayer.initialize();
  }

  connectAudioSource(source: AudioNode): void {
    this.audioLayer.connect(source);
  }

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.renderLoop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private renderLoop = (): void => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Get audio analysis data
    const audioData = this.audioLayer.analyze();

    // Update visualizer
    this.visualLayer.update(audioData, deltaTime);

    // Render frame
    this.visualLayer.render();

    // Continue loop
    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  };

  async startExport(config: ExportConfig): Promise<ExportSession> {
    return this.exportLayer.startExport(config);
  }
}
```

### 2.2 Renderer Abstraction

```typescript
// /src/music-framework/visuals/renderers/Renderer.ts

interface Renderer {
  type: 'canvas2d' | 'webgl' | 'webgpu';
  width: number;
  height: number;

  clear(): void;
  resize(width: number, height: number): void;
  captureFrame(): Promise<ImageData>;
  destroy(): void;
}

// Canvas 2D Renderer
class Canvas2DRenderer implements Renderer {
  type = 'canvas2d' as const;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  offscreenCanvas: OffscreenCanvas | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true // Reduce latency
    })!;

    // Use OffscreenCanvas if available
    if (typeof OffscreenCanvas !== 'undefined') {
      this.offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height);
    }
  }

  clear(): void {
    this.context.clearRect(0, 0, this.width, this.height);
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.offscreenCanvas?.width = width;
    this.offscreenCanvas?.height = height;
  }

  async captureFrame(): Promise<ImageData> {
    return this.context.getImageData(0, 0, this.width, this.height);
  }

  get width(): number {
    return this.canvas.width;
  }

  get height(): number {
    return this.canvas.height;
  }

  destroy(): void {
    // Cleanup
  }
}

// WebGL Renderer
class WebGLRenderer implements Renderer {
  type = 'webgl' as const;
  canvas: HTMLCanvasElement;
  gl: WebGL2RenderingContext;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  composer: EffectComposer;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: true,
      powerPreference: 'high-performance'
    })!;

    // Three.js setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.width / canvas.height,
      0.1,
      1000
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      context: this.gl,
      antialias: true
    });

    this.composer = new EffectComposer(this.renderer);
  }

  clear(): void {
    this.renderer.clear();
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  async captureFrame(): Promise<ImageData> {
    const pixels = new Uint8Array(this.width * this.height * 4);
    this.gl.readPixels(
      0, 0,
      this.width, this.height,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      pixels
    );

    return new ImageData(
      new Uint8ClampedArray(pixels),
      this.width,
      this.height
    );
  }

  get width(): number {
    return this.canvas.width;
  }

  get height(): number {
    return this.canvas.height;
  }

  destroy(): void {
    this.renderer.dispose();
    this.composer.dispose();
  }
}
```

## 3. Data Flow Architecture

```
┌──────────────┐
│ Audio Source │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  AudioContext    │
│  AnalyserNode    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ AudioAnalyzer    │ ◄── FFT Processing
│  - Frequency     │ ◄── Beat Detection
│  - Time Domain   │ ◄── Feature Extraction
│  - Features      │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ AudioVisual      │
│ Mapper           │ ◄── Frequency → Color
└──────┬───────────┘     ◄── Amplitude → Size
       │                 ◄── Beat → Trigger
       ▼
┌──────────────────┐
│ Visualizer       │
│  - Process Data  │
│  - Update State  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Renderer         │
│  - Canvas 2D     │
│  - WebGL         │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Display/Export   │
└──────────────────┘
```

## 4. Memory Management

### 4.1 Object Pooling

```typescript
class ObjectPool<T> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private factory: () => T;
  private reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T) => void, initialSize: number = 100) {
    this.factory = factory;
    this.reset = reset;

    // Pre-allocate
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }
  }

  acquire(): T {
    let obj = this.available.pop();

    if (!obj) {
      obj = this.factory();
    }

    this.inUse.add(obj);
    return obj;
  }

  release(obj: T): void {
    if (this.inUse.has(obj)) {
      this.inUse.delete(obj);
      this.reset(obj);
      this.available.push(obj);
    }
  }

  clear(): void {
    this.available = [];
    this.inUse.clear();
  }
}

// Usage example
const particlePool = new ObjectPool(
  () => new Particle(),
  (particle) => particle.reset(),
  1000 // Pre-allocate 1000 particles
);
```

### 4.2 Typed Array Buffers

```typescript
class AudioDataBuffer {
  private frequencyBuffer: Float32Array;
  private timeBuffer: Float32Array;
  private fftSize: number;

  constructor(fftSize: number) {
    this.fftSize = fftSize;
    this.frequencyBuffer = new Float32Array(fftSize / 2);
    this.timeBuffer = new Float32Array(fftSize);
  }

  updateFrequencyData(analyser: AnalyserNode): void {
    analyser.getFloatFrequencyData(this.frequencyBuffer);
  }

  updateTimeData(analyser: AnalyserNode): void {
    analyser.getFloatTimeDomainData(this.timeBuffer);
  }

  getFrequencyData(): Float32Array {
    return this.frequencyBuffer;
  }

  getTimeData(): Float32Array {
    return this.timeBuffer;
  }
}
```

## 5. Thread Architecture

### 5.1 Web Worker Setup

```typescript
// Main Thread
class WorkerCoordinator {
  private audioWorker: Worker;
  private analysisWorker: Worker;

  constructor() {
    this.audioWorker = new Worker('/workers/audio-processor.worker.js');
    this.analysisWorker = new Worker('/workers/audio-analysis.worker.js');

    this.setupMessageHandlers();
  }

  private setupMessageHandlers(): void {
    this.audioWorker.onmessage = (event) => {
      const { type, data } = event.data;

      switch (type) {
        case 'audio-data':
          this.analysisWorker.postMessage({ type: 'analyze', data });
          break;
      }
    };

    this.analysisWorker.onmessage = (event) => {
      const { type, features } = event.data;

      switch (type) {
        case 'features-extracted':
          this.onFeaturesExtracted(features);
          break;
      }
    };
  }

  private onFeaturesExtracted(features: AudioFeatures): void {
    // Use features in main thread for visualization
  }
}

// Audio Processor Worker
// /src/music-framework/visuals/workers/audio-processor.worker.ts
self.onmessage = (event) => {
  const { type, data } = event.data;

  if (type === 'process') {
    const processed = processAudioData(data);
    self.postMessage({ type: 'audio-data', data: processed });
  }
};
```

## 6. Plugin System

### 6.1 Visualizer Plugin Interface

```typescript
interface VisualizerPlugin {
  metadata: {
    name: string;
    version: string;
    author: string;
    description: string;
    category: 'spectrum' | 'waveform' | 'particle' | '3d' | 'abstract';
  };

  factory: () => Visualizer;
  presets: VisualizerPreset[];
  parameters: VisualizerParameter[];
}

// Plugin Registration
class VisualizerRegistry {
  private plugins: Map<string, VisualizerPlugin> = new Map();

  register(plugin: VisualizerPlugin): void {
    this.plugins.set(plugin.metadata.name, plugin);
  }

  unregister(name: string): void {
    this.plugins.delete(name);
  }

  create(name: string): Visualizer | null {
    const plugin = this.plugins.get(name);
    return plugin ? plugin.factory() : null;
  }

  list(): VisualizerPlugin[] {
    return Array.from(this.plugins.values());
  }
}
```

---

**Version**: 1.0.0
**Last Updated**: 2025-11-21

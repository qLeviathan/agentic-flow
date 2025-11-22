# Visual Rendering Pipeline

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   RENDERING PIPELINE                         │
└─────────────────────────────────────────────────────────────┘

1. INPUT STAGE
   ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
   │ Audio Data  │────▶│ Audio Mapper │────▶│ Visual Data │
   └─────────────┘     └──────────────┘     └─────────────┘

2. UPDATE STAGE
   ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
   │ Visual Data │────▶│  Visualizer  │────▶│ Scene State │
   └─────────────┘     │    Update    │     └─────────────┘
                       └──────────────┘

3. RENDER STAGE
   ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
   │ Scene State │────▶│   Renderer   │────▶│  Framebuffer│
   └─────────────┘     └──────────────┘     └─────────────┘

4. POST-PROCESSING STAGE
   ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
   │ Framebuffer │────▶│ Post Effects │────▶│   Display   │
   └─────────────┘     └──────────────┘     └─────────────┘

5. EXPORT STAGE (Optional)
   ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
   │ Framebuffer │────▶│Frame Capture │────▶│Video Encoder│
   └─────────────┘     └──────────────┘     └─────────────┘
```

## 1. Input Stage

### 1.1 Audio Data Collection

```typescript
// /src/music-framework/visuals/pipeline/InputStage.ts

class InputStage {
  private analyser: AnalyserNode;
  private frequencyData: Uint8Array;
  private timeDomainData: Uint8Array;
  private beatDetector: BeatDetector;
  private featureExtractor: AudioFeatureExtractor;

  constructor(audioContext: AudioContext, fftSize: number = 2048) {
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = fftSize;
    this.analyser.smoothingTimeConstant = 0.8;

    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    this.timeDomainData = new Uint8Array(this.analyser.fftSize);

    this.beatDetector = new BeatDetector();
    this.featureExtractor = new AudioFeatureExtractor(fftSize, audioContext.sampleRate);
  }

  process(): AudioAnalysisData {
    // Collect raw audio data
    this.analyser.getByteFrequencyData(this.frequencyData);
    this.analyser.getByteTimeDomainData(this.timeDomainData);

    // Convert to float for processing
    const floatFrequency = this.uint8ToFloat32(this.frequencyData);
    const floatTime = this.uint8ToFloat32(this.timeDomainData);

    // Extract features
    const features = this.featureExtractor.extract(floatFrequency, floatTime);
    const beat = this.beatDetector.detect(floatFrequency);

    return {
      frequencyData: floatFrequency,
      timeDomainData: floatTime,
      features,
      beat,
      timestamp: performance.now()
    };
  }

  private uint8ToFloat32(data: Uint8Array): Float32Array {
    const float = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      float[i] = (data[i] - 128) / 128; // Normalize to [-1, 1]
    }
    return float;
  }
}
```

### 1.2 Audio-Visual Mapping

```typescript
// /src/music-framework/visuals/pipeline/AudioVisualMapper.ts

class AudioVisualMapper {
  private colorMapper: FrequencyColorMapper;
  private sizeMapper: AmplitudeSizeMapper;
  private triggerMapper: BeatTriggerMapper;
  private patternMapper: RhythmPatternMapper;

  constructor(config: MapperConfig) {
    this.colorMapper = new FrequencyColorMapper(config.colorMapping);
    this.sizeMapper = new AmplitudeSizeMapper(config.sizeMapping);
    this.triggerMapper = new BeatTriggerMapper(config.triggerMapping);
    this.patternMapper = new RhythmPatternMapper(config.patternMapping);
  }

  map(audioData: AudioAnalysisData): VisualData {
    const { frequencyData, timeDomainData, features, beat } = audioData;

    // Frequency → Color
    const colors = this.colorMapper.mapFrequenciesToColors(frequencyData);

    // Amplitude → Size
    const sizes = this.sizeMapper.mapAmplitudesToSizes(frequencyData);

    // Beat → Triggers
    const triggers = beat ? this.triggerMapper.createTriggers(beat) : [];

    // Rhythm → Patterns
    const patterns = this.patternMapper.generatePatterns(features);

    return {
      colors,
      sizes,
      triggers,
      patterns,
      features
    };
  }
}

// Frequency Color Mapping
class FrequencyColorMapper {
  private config: ColorMappingConfig;

  mapFrequenciesToColors(frequencyData: Float32Array): Color[] {
    const colors: Color[] = [];
    const binCount = frequencyData.length;

    for (let i = 0; i < binCount; i++) {
      const frequency = this.binToFrequency(i, binCount);
      const amplitude = frequencyData[i];

      // Map frequency to hue
      const hue = this.frequencyToHue(frequency);

      // Map amplitude to saturation and lightness
      const saturation = this.amplitudeToSaturation(amplitude);
      const lightness = this.amplitudeToLightness(amplitude);

      colors.push({
        h: hue,
        s: saturation,
        l: lightness
      });
    }

    return colors;
  }

  private frequencyToHue(frequency: number): number {
    // Logarithmic frequency to hue mapping
    const minFreq = 20;
    const maxFreq = 20000;
    const logFreq = Math.log10(frequency);
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);

    const normalized = (logFreq - logMin) / (logMax - logMin);
    return normalized * 360; // Full hue spectrum
  }

  private amplitudeToSaturation(amplitude: number): number {
    // Higher amplitude = more saturated
    return 30 + (amplitude * 70); // 30-100%
  }

  private amplitudeToLightness(amplitude: number): number {
    // Higher amplitude = brighter (but not too bright)
    return 20 + (amplitude * 60); // 20-80%
  }

  private binToFrequency(bin: number, totalBins: number): number {
    const nyquist = 22050; // Assume 44100 Hz sample rate
    return (bin / totalBins) * nyquist;
  }
}
```

## 2. Update Stage

### 2.1 Visualizer Update System

```typescript
// /src/music-framework/visuals/pipeline/UpdateStage.ts

class UpdateStage {
  private visualizer: Visualizer;
  private interpolator: ValueInterpolator;
  private smoothing: SmoothingFilter;

  update(visualData: VisualData, deltaTime: number): SceneState {
    // Smooth data to prevent jitter
    const smoothedData = this.smoothing.apply(visualData);

    // Update visualizer with smoothed data
    this.visualizer.update(smoothedData, deltaTime);

    // Get current scene state
    return this.visualizer.getSceneState();
  }
}

// Smoothing Filter
class SmoothingFilter {
  private history: Map<string, number[]> = new Map();
  private windowSize: number;

  constructor(windowSize: number = 5) {
    this.windowSize = windowSize;
  }

  apply(data: VisualData): VisualData {
    const smoothed = { ...data };

    // Smooth sizes
    smoothed.sizes = data.sizes.map((size, index) => {
      return this.smoothValue(`size_${index}`, size);
    });

    // Smooth colors (hue only, keep saturation/lightness responsive)
    smoothed.colors = data.colors.map((color, index) => ({
      h: this.smoothValue(`hue_${index}`, color.h),
      s: color.s,
      l: color.l
    }));

    return smoothed;
  }

  private smoothValue(key: string, value: number): number {
    if (!this.history.has(key)) {
      this.history.set(key, []);
    }

    const values = this.history.get(key)!;
    values.push(value);

    if (values.length > this.windowSize) {
      values.shift();
    }

    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
}

// Animation Interpolator
class ValueInterpolator {
  lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  smoothstep(start: number, end: number, t: number): number {
    t = this.clamp((t - start) / (end - start), 0, 1);
    return t * t * (3 - 2 * t);
  }

  easeInOut(start: number, end: number, t: number): number {
    t = this.clamp(t, 0, 1);
    t = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    return start + (end - start) * t;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
```

### 2.2 Scene State Management

```typescript
interface SceneState {
  // Geometry
  meshes: MeshState[];
  particles: ParticleState[];

  // Lighting
  lights: LightState[];

  // Camera
  camera: CameraState;

  // Effects
  activeEffects: EffectState[];

  // Animation
  time: number;
  deltaTime: number;
}

interface MeshState {
  id: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  color: Color;
  visible: boolean;
  material: MaterialState;
}

interface ParticleState {
  id: string;
  position: Vector3;
  velocity: Vector3;
  color: Color;
  size: number;
  life: number;
  maxLife: number;
}
```

## 3. Render Stage

### 3.1 Canvas 2D Rendering

```typescript
// /src/music-framework/visuals/renderers/Canvas2DRenderer.ts

class Canvas2DRenderPipeline {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  render(sceneState: SceneState): void {
    // Clear canvas
    this.clear();

    // Set global composite operation
    this.ctx.globalCompositeOperation = 'source-over';

    // Render background
    this.renderBackground(sceneState);

    // Render main content
    this.renderContent(sceneState);

    // Render overlays
    this.renderOverlays(sceneState);
  }

  private clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  private renderBackground(state: SceneState): void {
    // Gradient background
    const gradient = this.ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, this.width / 2
    );

    gradient.addColorStop(0, 'rgba(10, 10, 20, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private renderContent(state: SceneState): void {
    // Render spectrum bars
    for (const mesh of state.meshes) {
      this.renderMesh(mesh);
    }

    // Render particles
    for (const particle of state.particles) {
      this.renderParticle(particle);
    }
  }

  private renderMesh(mesh: MeshState): void {
    const { position, scale, color } = mesh;

    this.ctx.save();

    // Transform
    this.ctx.translate(position.x, position.y);
    this.ctx.scale(scale.x, scale.y);

    // Draw
    this.ctx.fillStyle = this.colorToCSS(color);
    this.ctx.fillRect(-0.5, -0.5, 1, 1);

    this.ctx.restore();
  }

  private renderParticle(particle: ParticleState): void {
    const { position, size, color, life, maxLife } = particle;

    // Fade based on life
    const alpha = life / maxLife;

    this.ctx.save();

    this.ctx.globalAlpha = alpha;
    this.ctx.fillStyle = this.colorToCSS(color);

    this.ctx.beginPath();
    this.ctx.arc(position.x, position.y, size, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  private renderOverlays(state: SceneState): void {
    // FPS counter, debug info, etc.
  }

  private colorToCSS(color: Color): string {
    return `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
  }
}
```

### 3.2 WebGL Rendering

```typescript
// /src/music-framework/visuals/renderers/WebGLRenderer.ts

class WebGLRenderPipeline {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  render(sceneState: SceneState): void {
    // Update scene from state
    this.updateSceneFromState(sceneState);

    // Render
    this.renderer.render(this.scene, this.camera);
  }

  private updateSceneFromState(state: SceneState): void {
    // Update camera
    this.updateCamera(state.camera);

    // Update meshes
    for (const meshState of state.meshes) {
      this.updateMesh(meshState);
    }

    // Update particles
    this.updateParticles(state.particles);

    // Update lights
    for (const lightState of state.lights) {
      this.updateLight(lightState);
    }
  }

  private updateMesh(meshState: MeshState): void {
    let mesh = this.scene.getObjectByName(meshState.id) as THREE.Mesh;

    if (!mesh) {
      mesh = this.createMesh(meshState);
      this.scene.add(mesh);
    }

    mesh.position.copy(meshState.position);
    mesh.rotation.setFromVector3(meshState.rotation);
    mesh.scale.copy(meshState.scale);
    mesh.visible = meshState.visible;

    // Update material
    if (mesh.material instanceof THREE.MeshStandardMaterial) {
      mesh.material.color.setHSL(
        meshState.color.h / 360,
        meshState.color.s / 100,
        meshState.color.l / 100
      );
    }
  }

  private createMesh(meshState: MeshState): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.5,
      roughness: 0.5
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = meshState.id;

    return mesh;
  }
}
```

## 4. Post-Processing Stage

### 4.1 Effect Pipeline

```typescript
// /src/music-framework/visuals/pipeline/PostProcessStage.ts

class PostProcessingPipeline {
  private composer: EffectComposer;
  private passes: Map<string, Pass> = new Map();

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
    this.composer = new EffectComposer(renderer);

    // Add render pass (base)
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // Add effect passes
    this.initializeEffects();
  }

  private initializeEffects(): void {
    // Bloom effect
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,  // strength
      0.4,  // radius
      0.85  // threshold
    );
    this.passes.set('bloom', bloomPass);
    this.composer.addPass(bloomPass);

    // FXAA (antialiasing)
    const fxaaPass = new ShaderPass(FXAAShader);
    this.passes.set('fxaa', fxaaPass);
    this.composer.addPass(fxaaPass);

    // Color correction
    const colorCorrectionPass = new ShaderPass(ColorCorrectionShader);
    this.passes.set('colorCorrection', colorCorrectionPass);
    this.composer.addPass(colorCorrectionPass);

    // Vignette
    const vignettePass = new ShaderPass(VignetteShader);
    this.passes.set('vignette', vignettePass);
    this.composer.addPass(vignettePass);
  }

  render(deltaTime: number): void {
    this.composer.render(deltaTime);
  }

  enableEffect(name: string): void {
    const pass = this.passes.get(name);
    if (pass) {
      pass.enabled = true;
    }
  }

  disableEffect(name: string): void {
    const pass = this.passes.get(name);
    if (pass) {
      pass.enabled = false;
    }
  }

  setEffectParameter(effect: string, param: string, value: any): void {
    const pass = this.passes.get(effect);
    if (pass && 'uniforms' in pass) {
      const uniforms = (pass as any).uniforms;
      if (uniforms[param]) {
        uniforms[param].value = value;
      }
    }
  }
}

// Custom Shader: Audio-Reactive Glow
const AudioGlowShader = {
  uniforms: {
    tDiffuse: { value: null },
    glowIntensity: { value: 1.0 },
    audioEnergy: { value: 0.0 }
  },

  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float glowIntensity;
    uniform float audioEnergy;

    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      // Calculate distance from center
      vec2 center = vec2(0.5, 0.5);
      float dist = length(vUv - center);

      // Audio-reactive glow
      float glow = glowIntensity * audioEnergy * (1.0 - dist);
      color.rgb += vec3(glow);

      gl_FragColor = color;
    }
  `
};
```

## 5. Export Stage

### 5.1 Frame Capture System

```typescript
// /src/music-framework/visuals/pipeline/ExportStage.ts

class ExportPipeline {
  private canvas: HTMLCanvasElement;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  async startCapture(config: ExportConfig): Promise<void> {
    // Create media stream from canvas
    const stream = this.canvas.captureStream(config.frameRate);

    // Add audio track if available
    if (config.audioTrack) {
      stream.addTrack(config.audioTrack);
    }

    // Create recorder
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: config.mimeType,
      videoBitsPerSecond: config.videoBitsPerSecond,
      audioBitsPerSecond: config.audioBitsPerSecond
    });

    // Handle data
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    // Start recording
    this.mediaRecorder.start(100); // Collect chunks every 100ms
  }

  async stopCapture(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, {
          type: this.mediaRecorder!.mimeType
        });

        this.chunks = [];
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  captureFrame(): ImageData {
    const ctx = this.canvas.getContext('2d')!;
    return ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }
}

// GIF Export (using gif.js library)
class GIFExporter {
  private gif: any; // gif.js instance

  constructor(config: GIFExportConfig) {
    this.gif = new GIF({
      workers: 4,
      quality: config.quality,
      width: config.width,
      height: config.height,
      workerScript: '/libs/gif.worker.js'
    });
  }

  addFrame(canvas: HTMLCanvasElement, delay: number): void {
    this.gif.addFrame(canvas, { delay, copy: true });
  }

  async render(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.gif.on('finished', (blob: Blob) => {
        resolve(blob);
      });

      this.gif.on('error', (error: Error) => {
        reject(error);
      });

      this.gif.render();
    });
  }
}
```

## 6. Performance Monitoring

### 6.1 Pipeline Performance Tracker

```typescript
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();

  startMeasure(name: string): void {
    this.metrics.set(name, {
      startTime: performance.now(),
      endTime: 0,
      duration: 0
    });
  }

  endMeasure(name: string): number {
    const metric = this.metrics.get(name);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      return metric.duration;
    }
    return 0;
  }

  getMetrics(): Map<string, PerformanceMetric> {
    return this.metrics;
  }

  reset(): void {
    this.metrics.clear();
  }
}

// Usage in pipeline
class MeasuredRenderPipeline {
  private monitor = new PerformanceMonitor();

  render(sceneState: SceneState): void {
    this.monitor.startMeasure('total');

    this.monitor.startMeasure('update');
    this.updateStage.update(sceneState);
    console.log('Update:', this.monitor.endMeasure('update'), 'ms');

    this.monitor.startMeasure('render');
    this.renderStage.render();
    console.log('Render:', this.monitor.endMeasure('render'), 'ms');

    this.monitor.startMeasure('postprocess');
    this.postProcessStage.render();
    console.log('Post-process:', this.monitor.endMeasure('postprocess'), 'ms');

    console.log('Total frame time:', this.monitor.endMeasure('total'), 'ms');
  }
}
```

---

**Version**: 1.0.0
**Last Updated**: 2025-11-21

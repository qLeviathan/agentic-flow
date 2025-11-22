# Zordic Music Studio - Visual Dynamics System Specifications

## Executive Summary

The Visual Dynamics System provides real-time audio-reactive visualizations for the Zordic Music Studio framework, enabling users to create stunning visual representations of music that synchronize perfectly with audio playback, recording, and production workflows.

## 1. System Overview

### 1.1 Core Capabilities

- **Real-time Audio Analysis**: Process audio streams with minimal latency (<10ms)
- **Multi-format Visualization**: Support 2D, 3D, and hybrid rendering
- **Educational Integration**: Visual representation of music theory concepts
- **Export Pipeline**: Generate video files in multiple formats
- **Performance Optimization**: 60 FPS rendering at 1080p minimum
- **Extensible Architecture**: Plugin system for custom visualizers

### 1.2 Technical Stack

```typescript
{
  "audioProcessing": {
    "api": "Web Audio API",
    "nodes": ["AnalyserNode", "FFT", "AudioContext"],
    "fftSize": [256, 512, 1024, 2048, 4096, 8192, 16384, 32768],
    "smoothingTimeConstant": 0.8
  },
  "rendering2D": {
    "primary": "Canvas API",
    "acceleration": "OffscreenCanvas",
    "workers": "Dedicated rendering threads"
  },
  "rendering3D": {
    "library": "Three.js r160+",
    "renderer": "WebGLRenderer",
    "postProcessing": "EffectComposer",
    "shaders": "GLSL 3.0"
  },
  "videoExport": {
    "api": "MediaRecorder API",
    "formats": ["MP4 (H.264)", "WebM (VP9)", "GIF"],
    "codecs": ["video/webm;codecs=vp9", "video/mp4;codecs=h264"],
    "quality": "Variable bitrate 2-10 Mbps"
  }
}
```

## 2. Audio-Visual Mapping System

### 2.1 Frequency to Color Mapping

**Algorithm**: Perceptual color mapping based on musical frequency ranges

```typescript
interface FrequencyColorMapping {
  subBass: { range: [20, 60], hue: [240, 260] };      // Deep blue-purple
  bass: { range: [60, 250], hue: [260, 300] };        // Purple-magenta
  lowMid: { range: [250, 500], hue: [300, 0] };       // Magenta-red
  mid: { range: [500, 2000], hue: [0, 60] };          // Red-yellow
  highMid: { range: [2000, 6000], hue: [60, 120] };   // Yellow-green
  presence: { range: [6000, 12000], hue: [120, 180] }; // Green-cyan
  brilliance: { range: [12000, 20000], hue: [180, 240] }; // Cyan-blue
}
```

**Saturation Mapping**: Energy-based saturation (0-100%)
- Low energy (0-30%): Desaturated (30-50% saturation)
- Medium energy (30-70%): Moderate (50-80% saturation)
- High energy (70-100%): Fully saturated (80-100% saturation)

**Lightness Mapping**: Dynamic range compression
- Peak detection: Identify musical peaks
- Adaptive brightness: Scale to maintain visual clarity
- Contrast enhancement: Boost visual separation

### 2.2 Amplitude to Size/Intensity

**Linear Scaling**: Direct amplitude mapping
```
visualSize = baseSize + (amplitude * scaleFactor)
visualIntensity = baseIntensity * (1 + amplitude * multiplier)
```

**Logarithmic Scaling**: Perceptual amplitude mapping (dB scale)
```
dB = 20 * log10(amplitude)
visualSize = baseSize * pow(10, dB / 40)
```

**Exponential Scaling**: Dramatic visual impact
```
visualSize = baseSize * exp(amplitude * exponent)
```

### 2.3 Beat Detection System

**Multi-Algorithm Approach**:

1. **Energy-based Detection**
   - Track energy flux across frequency bands
   - Threshold crossing with adaptive sensitivity
   - Cooldown period to prevent double-triggers

2. **Spectral Flux Detection**
   - Compare spectral differences frame-to-frame
   - Peak picking in flux signal
   - Band-specific beat detection

3. **Onset Detection**
   - High-frequency content analysis
   - Transient detection using differentiation
   - Machine learning enhanced (optional)

```typescript
interface BeatDetectionConfig {
  energyThreshold: number;      // 0.8-1.5 typical
  spectralFluxThreshold: number; // 0.3-0.7 typical
  minimumInterval: number;       // 100ms-500ms
  adaptiveThreshold: boolean;    // Auto-adjust to music
  bandFilters: {
    kick: [20, 150],
    snare: [150, 4000],
    hihat: [4000, 16000]
  };
}
```

### 2.4 Rhythm to Pattern Generation

**Pattern Systems**:
- **Grid Patterns**: Tile-based rhythm visualization
- **Radial Patterns**: Circular rhythm propagation
- **Fractal Patterns**: Self-similar recursive structures
- **L-System Patterns**: Algorithmic plant-like growth
- **Cellular Automata**: Rule-based pattern evolution

**Rhythm Quantization**:
```typescript
interface RhythmPattern {
  timeSignature: [number, number]; // e.g., [4, 4]
  subdivision: number;              // 8, 16, 32, 64
  swing: number;                    // 0-1 (0=straight, 0.67=triplet feel)
  syncopation: number;              // 0-1 (off-beat emphasis)
}
```

## 3. Visualization Types

### 3.1 Spectrum Analyzer

**Frequency Bar Display**:
- **Linear Frequency**: Equal spacing across spectrum
- **Logarithmic Frequency**: Musical spacing (octaves)
- **Mel Scale**: Perceptual frequency spacing
- **Bark Scale**: Critical band spacing

**Rendering Modes**:
- Vertical bars (classic)
- Horizontal bars
- Circular/radial spectrum
- 3D bars with depth
- Mirrored/symmetric layouts

**Styling Options**:
- Gradient fills (frequency-based colors)
- Solid colors with borders
- Wireframe/outline mode
- Glow effects and bloom
- Shadow and reflection

### 3.2 Waveform Display

**Oscilloscope Modes**:
- Time-domain waveform
- Stereo phase scope (Lissajous)
- Multi-channel overlay
- Scrolling waveform (historical)

**Rendering Techniques**:
- Line rendering (smooth curves)
- Point cloud (particles)
- Filled area (amplitude envelope)
- Symmetrical mirroring
- 3D waveform tube

### 3.3 Particle Systems

**Particle Behaviors**:
```typescript
interface ParticleSystem {
  emissionRate: number;          // Particles per second
  particleLife: number;          // Lifespan in seconds
  velocityRange: [number, number]; // Speed range
  gravityEffect: Vector3;         // Gravitational pull
  audioReactivity: {
    emission: boolean;            // Emit on beats
    velocity: boolean;            // Speed changes with amplitude
    color: boolean;               // Color shifts with frequency
    size: boolean;                // Size modulation
  };
  forces: {
    attraction: AttractorPoint[]; // Attraction points
    repulsion: RepulsorPoint[];   // Repulsion points
    turbulence: number;           // Noise-based chaos
    vortex: VortexPoint[];        // Spiral forces
  };
}
```

**Particle Types**:
- Point sprites
- Billboard quads
- Instanced meshes
- Trail renderers
- Metaballs (fluid simulation)

### 3.4 3D Geometry Morphing

**Geometry Types**:
- Sphere (subdivided icosahedron)
- Torus (donut shape)
- Cube (subdivided)
- Custom meshes (OBJ/GLTF import)
- Procedural terrain
- Abstract shapes

**Morphing Techniques**:
```typescript
interface GeometryMorpher {
  baseGeometry: BufferGeometry;
  morphTargets: BufferGeometry[];
  morphMethod: 'vertex' | 'normal' | 'displacement' | 'shader';
  audioMapping: {
    vertexDisplacement: {
      frequency: FrequencyBand;
      amplitude: number;
      direction: 'normal' | 'random' | 'radial';
    };
    rotation: {
      axis: Vector3;
      speed: number;
      audioModulation: boolean;
    };
    scale: {
      uniform: boolean;
      axes: Vector3;
      pulseWithBeat: boolean;
    };
  };
}
```

**Shader Effects**:
- Vertex displacement (audio-driven)
- Fragment coloring (frequency mapping)
- Normal mapping (texture detail)
- Fresnel effects (edge glow)
- Holographic shaders

### 3.5 Abstract Pattern Generation

**Pattern Algorithms**:
- Perlin/Simplex noise fields
- Reaction-diffusion systems
- Voronoi diagrams
- Delaunay triangulation
- Strange attractors (Lorenz, Rössler)
- Fourier series visualization

**Symmetry Modes**:
- Radial symmetry (kaleidoscope)
- Mirror symmetry (bilateral)
- Translational symmetry (tiling)
- Rotational symmetry (n-fold)

### 3.6 Music Video Generation

**Scene Composition**:
```typescript
interface MusicVideoScene {
  duration: number;              // Scene length in seconds
  visualizers: VisualizerLayer[]; // Multiple layers
  transitions: {
    in: TransitionType;
    out: TransitionType;
    duration: number;
  };
  cameraPath: {
    keyframes: CameraKeyframe[];
    interpolation: 'linear' | 'bezier' | 'catmull-rom';
  };
  effects: PostProcessEffect[];
}
```

**Automated Choreography**:
- Beat-synchronized scene changes
- Crescendo-based camera zoom
- Frequency-driven camera rotation
- Dynamic transition timing
- AI-assisted scene selection

## 4. Performance Optimization Strategies

### 4.1 Rendering Optimization

**Level of Detail (LOD)**:
- Reduce particle count at distance
- Simplify geometry based on screen size
- Disable expensive effects when not visible

**Culling Techniques**:
- Frustum culling (off-screen rejection)
- Occlusion culling (hidden object removal)
- Distance-based culling

**Batch Rendering**:
- Instanced rendering for particles
- Geometry batching (merge similar objects)
- Texture atlasing (reduce draw calls)

### 4.2 Audio Processing Optimization

**Efficient FFT**:
```typescript
interface FFTOptimization {
  fftSize: 2048;                 // Power of 2 for efficiency
  smoothing: 0.8;                // Reduce jitter
  decimation: 2;                 // Process every Nth sample
  frequencyBinning: {
    method: 'logarithmic';       // Reduce bins intelligently
    bins: 64;                    // Final bin count
  };
}
```

**Web Workers**:
- Offload audio analysis to worker threads
- Parallel processing of frequency bands
- Non-blocking visualization updates

### 4.3 Memory Management

**Resource Pooling**:
- Reuse particle objects
- Geometry buffer reuse
- Texture caching

**Garbage Collection Optimization**:
- Pre-allocate buffers
- Avoid object creation in hot paths
- Use TypedArrays (Float32Array, Uint8Array)

### 4.4 Canvas/WebGL Optimization

**Canvas 2D**:
- Use OffscreenCanvas for background rendering
- Minimize state changes
- Layer caching (render static elements once)
- Dirty rectangle tracking

**WebGL/Three.js**:
- Shader compilation caching
- Uniform buffer objects
- Reduce texture uploads
- Use geometry attributes efficiently

## 5. Export System Specifications

### 5.1 Video Export Formats

**MP4 (H.264)**:
```typescript
interface MP4ExportConfig {
  codec: 'avc1.42E01E';          // H.264 Baseline
  videoBitsPerSecond: 5000000;   // 5 Mbps
  audioBitsPerSecond: 128000;    // 128 kbps AAC
  width: 1920;
  height: 1080;
  frameRate: 60;
}
```

**WebM (VP9)**:
```typescript
interface WebMExportConfig {
  codec: 'vp09.00.10.08';        // VP9 Profile 0
  videoBitsPerSecond: 3000000;   // 3 Mbps (more efficient)
  audioBitsPerSecond: 128000;    // 128 kbps Opus
  width: 1920;
  height: 1080;
  frameRate: 60;
}
```

**GIF Export**:
```typescript
interface GIFExportConfig {
  width: 800;                    // Reduce size for GIF
  height: 600;
  frameRate: 30;                 // Lower FPS for smaller file
  quality: 10;                   // 1-30 (10 recommended)
  dithering: 'FloydSteinberg';   // Dithering algorithm
  maxColors: 256;                // GIF color limit
  repeat: 0;                     // 0 = infinite loop
}
```

### 5.2 Export Pipeline

**Render to Video Process**:
1. **Pre-processing**
   - Analyze audio file length
   - Calculate total frames needed
   - Allocate memory buffers
   - Initialize encoder

2. **Frame Capture**
   - Seek audio to frame position
   - Update visualization state
   - Render frame to canvas
   - Capture canvas as ImageData

3. **Encoding**
   - Feed frames to MediaRecorder
   - Buffer encoded chunks
   - Monitor encoding progress
   - Handle backpressure

4. **Post-processing**
   - Concatenate video chunks
   - Mux audio and video streams
   - Apply final compression
   - Generate thumbnail/preview

**Progress Tracking**:
```typescript
interface ExportProgress {
  currentFrame: number;
  totalFrames: number;
  percentage: number;
  estimatedTimeRemaining: number;
  encodedBytes: number;
  errors: ExportError[];
}
```

### 5.3 Quality Presets

```typescript
const exportPresets = {
  web: {
    resolution: [1280, 720],
    frameRate: 30,
    bitrate: 2000000
  },
  hd: {
    resolution: [1920, 1080],
    frameRate: 60,
    bitrate: 5000000
  },
  '4k': {
    resolution: [3840, 2160],
    frameRate: 60,
    bitrate: 20000000
  },
  social: {
    instagram: { resolution: [1080, 1080], frameRate: 30 },
    youtube: { resolution: [1920, 1080], frameRate: 60 },
    tiktok: { resolution: [1080, 1920], frameRate: 30 }
  }
};
```

## 6. Educational Integration

### 6.1 Music Theory Visualization

**Frequency and Pitch**:
- Display note names on frequency bars
- Highlight musical scales and chords
- Show harmonic relationships
- Visualize overtone series

**Rhythm and Timing**:
- Beat grid overlay
- Time signature visualization
- Tempo changes (visual metronome)
- Polyrhythm display

**Timbre and Texture**:
- Spectral centroid visualization
- Harmonic vs inharmonic content
- Attack/Decay/Sustain/Release (ADSR) envelope
- Formant frequency display (voice)

### 6.2 Instrument Visualization

**Visual Fingerprints**:
```typescript
interface InstrumentProfile {
  name: string;
  frequencyRange: [number, number];
  characteristicFrequencies: number[];
  spectralShape: 'bright' | 'dark' | 'hollow' | 'rich';
  visualTheme: {
    primaryColor: string;
    secondaryColor: string;
    particleShape: string;
    geometryType: string;
  };
}
```

**Comparison Mode**:
- Side-by-side instrument comparison
- Overlay multiple instruments
- Highlight differences in real-time
- Educational annotations

### 6.3 Interactive Learning Modules

**Guided Lessons**:
- "Understanding Frequency Spectrum"
- "Visualizing Musical Intervals"
- "See the Difference: Major vs Minor"
- "How Compression Affects Sound"
- "Reverb and Space Visualization"

**Interactive Experiments**:
- Adjust EQ and see visual changes
- Create visual patterns by singing
- Frequency guessing game
- Rhythm pattern matching

## 7. Technical Implementation Requirements

### 7.1 Browser Compatibility

**Minimum Requirements**:
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Web Audio API support
- Canvas 2D with hardware acceleration
- WebGL 2.0 support
- MediaRecorder API (for export)

**Fallback Strategies**:
- Detect capabilities at runtime
- Graceful degradation for older browsers
- 2D fallback for 3D visualizations
- Reduced particle counts on low-end devices

### 7.2 Performance Targets

**Real-time Rendering**:
- 60 FPS at 1080p (desktop)
- 30 FPS at 720p (mobile)
- <10ms audio latency
- <5% CPU usage when idle

**Export Performance**:
- 1:1 real-time export minimum
- 2:1 target (export 1 minute in 30 seconds)
- Multi-threaded encoding support
- Background export capability

### 7.3 API Surface

**Public API Example**:
```typescript
interface VisualDynamicsAPI {
  // Initialization
  initialize(config: VisualizerConfig): Promise<void>;

  // Audio connection
  connectAudioSource(source: AudioNode): void;
  disconnectAudioSource(): void;

  // Visualization control
  setVisualizer(type: VisualizerType): void;
  setPreset(presetName: string): void;
  updateParameters(params: Partial<VisualizerParams>): void;

  // Rendering
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;

  // Export
  startExport(config: ExportConfig): Promise<ExportSession>;
  cancelExport(): void;

  // Events
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;

  // Utilities
  captureFrame(): Promise<Blob>;
  getAudioData(): AudioAnalysisData;
  getPerformanceMetrics(): PerformanceMetrics;
}
```

## 8. Future Enhancements

### 8.1 Advanced Features

- **AI-Generated Visualizations**: Machine learning to create unique visuals
- **VR/AR Support**: Immersive 3D audio visualization
- **Multi-user Collaboration**: Shared visual jam sessions
- **MIDI Integration**: Visualize MIDI instruments and controllers
- **Live Performance Mode**: Low-latency for stage use

### 8.2 Platform Extensions

- **Desktop App**: Electron-based standalone application
- **Mobile Apps**: Native iOS/Android implementations
- **Browser Extension**: Visualize any web audio
- **DAW Plugin**: VST/AU plugin for DAWs
- **Streaming Integration**: OBS/Twitch overlay support

## 9. Success Metrics

### 9.1 Performance KPIs

- Frame rate: >60 FPS (95th percentile)
- Audio latency: <10ms
- Export speed: >1:1 real-time
- Memory usage: <500MB for HD rendering
- Time to first frame: <100ms

### 9.2 User Experience Metrics

- Preset load time: <50ms
- Parameter update latency: <16ms (1 frame)
- Export success rate: >99%
- Cross-browser compatibility: 95%+

## 10. Documentation Requirements

### 10.1 Developer Documentation

- API reference (TypeScript definitions)
- Architecture diagrams
- Performance optimization guide
- Custom visualizer creation tutorial
- Shader programming guide

### 10.2 User Documentation

- Getting started guide
- Preset library documentation
- Parameter reference
- Export guide
- Troubleshooting FAQ

---

**Version**: 1.0.0
**Last Updated**: 2025-11-21
**Status**: Design Phase
**Next Phase**: Implementation

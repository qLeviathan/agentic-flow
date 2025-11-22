# Performance Optimization Guide - Visual Dynamics System

## Overview

This guide provides comprehensive strategies for optimizing the performance of the Zordic Music Studio Visual Dynamics System to achieve 60 FPS rendering at 1080p with minimal CPU usage.

## Performance Targets

| Metric | Target | Acceptable | Poor |
|--------|--------|------------|------|
| Frame Rate | 60 FPS | 45-60 FPS | <45 FPS |
| Frame Time | <16.67ms | <22ms | >22ms |
| Audio Latency | <10ms | <20ms | >20ms |
| CPU Usage (Idle) | <5% | <10% | >10% |
| CPU Usage (Active) | <30% | <50% | >50% |
| Memory Usage | <500MB | <1GB | >1GB |
| Time to First Frame | <100ms | <200ms | >200ms |

## 1. Audio Processing Optimization

### 1.1 FFT Configuration

```typescript
// Optimal FFT settings
const audioConfig = {
  fftSize: 2048,  // Balance between resolution and performance
  smoothingTimeConstant: 0.8,  // Reduce jitter
  minDecibels: -90,
  maxDecibels: -10
};

// Avoid:
// - Very large FFT sizes (8192+) unless needed
// - Very small smoothing (causes jitter and extra processing)
```

**Recommendations**:
- Use power-of-2 FFT sizes: 256, 512, 1024, 2048, 4096
- 2048 is optimal for most visualizations
- Increase to 4096 only for detailed frequency analysis
- Reduce to 1024 for mobile devices

### 1.2 Frequency Binning

```typescript
class FrequencyBinner {
  /**
   * Reduce frequency bins intelligently
   * Maps 1024 bins to 64 logarithmic bins
   */
  binFrequencies(frequencyData: Float32Array, targetBins: number): Float32Array {
    const result = new Float32Array(targetBins);
    const sourceLength = frequencyData.length;

    for (let i = 0; i < targetBins; i++) {
      // Logarithmic mapping (musical scale)
      const logMin = Math.log10(1);
      const logMax = Math.log10(sourceLength);
      const logValue = logMin + (i / targetBins) * (logMax - logMin);

      const startBin = Math.floor(Math.pow(10, logValue));
      const endBin = Math.floor(Math.pow(10, logMin + ((i + 1) / targetBins) * (logMax - logMin)));

      // Average bins in range
      let sum = 0;
      let count = 0;
      for (let j = startBin; j < endBin && j < sourceLength; j++) {
        sum += frequencyData[j];
        count++;
      }

      result[i] = count > 0 ? sum / count : 0;
    }

    return result;
  }
}
```

### 1.3 Web Workers for Audio Analysis

```typescript
// Main thread
const audioWorker = new Worker('/workers/audio-analyzer.worker.js');

audioWorker.postMessage({
  type: 'analyze',
  frequencyData: frequencyArray,
  timeDomainData: timeArray
});

audioWorker.onmessage = (event) => {
  const { features } = event.data;
  // Use features for visualization
};

// Worker thread (audio-analyzer.worker.js)
self.onmessage = (event) => {
  const { frequencyData, timeDomainData } = event.data;

  const features = {
    spectralCentroid: calculateSpectralCentroid(frequencyData),
    rmsEnergy: calculateRMS(timeDomainData),
    // ... other expensive calculations
  };

  self.postMessage({ type: 'features', features });
};
```

## 2. Rendering Optimization

### 2.1 Canvas 2D Optimization

```typescript
class OptimizedCanvas2DRenderer {
  private offscreenCanvas: OffscreenCanvas | null = null;
  private layerCache: Map<string, ImageData> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    // Use OffscreenCanvas for background rendering
    if (typeof OffscreenCanvas !== 'undefined') {
      this.offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height);
    }
  }

  /**
   * Minimize state changes
   */
  renderOptimized(objects: RenderObject[]): void {
    const ctx = this.getContext();

    // Group by style to minimize state changes
    const groupedByStyle = this.groupByStyle(objects);

    for (const [style, objectGroup] of groupedByStyle) {
      // Set style once
      ctx.fillStyle = style.color;
      ctx.globalAlpha = style.alpha;

      // Render all objects with same style
      for (const obj of objectGroup) {
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
      }
    }
  }

  /**
   * Layer caching for static elements
   */
  renderWithCache(backgroundLayer: RenderLayer, dynamicLayer: RenderLayer): void {
    const ctx = this.getContext();

    // Render background only if changed
    if (!this.layerCache.has('background') || backgroundLayer.dirty) {
      const bgImageData = this.renderLayer(backgroundLayer);
      this.layerCache.set('background', bgImageData);
      backgroundLayer.dirty = false;
    }

    // Draw cached background
    const bgCache = this.layerCache.get('background')!;
    ctx.putImageData(bgCache, 0, 0);

    // Render dynamic content
    this.renderLayer(dynamicLayer);
  }

  /**
   * Dirty rectangle tracking
   */
  renderDirtyRegions(dirtyRects: Rectangle[]): void {
    const ctx = this.getContext();

    for (const rect of dirtyRects) {
      // Clear only dirty region
      ctx.clearRect(rect.x, rect.y, rect.width, rect.height);

      // Redraw only affected objects
      this.renderRegion(rect);
    }
  }
}
```

### 2.2 WebGL/Three.js Optimization

```typescript
class OptimizedWebGLRenderer {
  private renderer: THREE.WebGLRenderer;
  private geometryPool: Map<string, THREE.BufferGeometry> = new Map();
  private materialPool: Map<string, THREE.Material> = new Map();

  /**
   * Geometry batching
   */
  createInstancedMesh(geometry: THREE.BufferGeometry, count: number): THREE.InstancedMesh {
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.5,
      roughness: 0.5
    });

    const mesh = new THREE.InstancedMesh(geometry, material, count);

    // Set individual transforms
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      matrix.setPosition(
        Math.random() * 100 - 50,
        Math.random() * 100 - 50,
        Math.random() * 100 - 50
      );

      mesh.setMatrixAt(i, matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    return mesh;
  }

  /**
   * Frustum culling
   */
  enableCulling(camera: THREE.Camera, scene: THREE.Scene): void {
    const frustum = new THREE.Frustum();
    const cameraViewProjectionMatrix = new THREE.Matrix4();

    cameraViewProjectionMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );

    frustum.setFromProjectionMatrix(cameraViewProjectionMatrix);

    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.visible = frustum.intersectsObject(object);
      }
    });
  }

  /**
   * Level of Detail (LOD)
   */
  createLODSystem(highPoly: THREE.Mesh, medPoly: THREE.Mesh, lowPoly: THREE.Mesh): THREE.LOD {
    const lod = new THREE.LOD();

    lod.addLevel(highPoly, 0);    // 0-50 units
    lod.addLevel(medPoly, 50);    // 50-100 units
    lod.addLevel(lowPoly, 100);   // 100+ units

    return lod;
  }

  /**
   * Texture atlasing
   */
  createTextureAtlas(textures: THREE.Texture[]): THREE.Texture {
    const atlasSize = 2048;
    const canvas = document.createElement('canvas');
    canvas.width = atlasSize;
    canvas.height = atlasSize;

    const ctx = canvas.getContext('2d')!;
    const tilesPerRow = Math.ceil(Math.sqrt(textures.length));
    const tileSize = atlasSize / tilesPerRow;

    textures.forEach((texture, index) => {
      const x = (index % tilesPerRow) * tileSize;
      const y = Math.floor(index / tilesPerRow) * tileSize;

      ctx.drawImage(texture.image, x, y, tileSize, tileSize);
    });

    return new THREE.CanvasTexture(canvas);
  }
}
```

### 2.3 Particle System Optimization

```typescript
class OptimizedParticleSystem {
  private particlePool: Particle[] = [];
  private activeParticles: Particle[] = [];
  private maxParticles: number = 1000;

  constructor() {
    // Pre-allocate particle pool
    for (let i = 0; i < this.maxParticles; i++) {
      this.particlePool.push(new Particle());
    }
  }

  /**
   * Object pooling
   */
  spawnParticle(): Particle | null {
    if (this.particlePool.length === 0) {
      return null; // Pool exhausted
    }

    const particle = this.particlePool.pop()!;
    this.activeParticles.push(particle);
    particle.reset();

    return particle;
  }

  /**
   * Return particle to pool
   */
  recycleParticle(particle: Particle): void {
    const index = this.activeParticles.indexOf(particle);
    if (index !== -1) {
      this.activeParticles.splice(index, 1);
      this.particlePool.push(particle);
    }
  }

  /**
   * Batch update (single loop)
   */
  update(deltaTime: number): void {
    for (let i = this.activeParticles.length - 1; i >= 0; i--) {
      const particle = this.activeParticles[i];

      particle.life -= deltaTime;

      if (particle.life <= 0) {
        this.recycleParticle(particle);
      } else {
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
      }
    }
  }

  /**
   * Instanced rendering (WebGL)
   */
  renderInstanced(gl: WebGLRenderingContext): void {
    const positions = new Float32Array(this.activeParticles.length * 3);
    const colors = new Float32Array(this.activeParticles.length * 4);

    for (let i = 0; i < this.activeParticles.length; i++) {
      const p = this.activeParticles[i];

      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;

      colors[i * 4] = p.r;
      colors[i * 4 + 1] = p.g;
      colors[i * 4 + 2] = p.b;
      colors[i * 4 + 3] = p.alpha;
    }

    // Upload to GPU and render
    // ... WebGL instanced rendering code
  }
}
```

## 3. Memory Management

### 3.1 Typed Arrays

```typescript
// ✅ Good: Use TypedArrays
const frequencyData = new Float32Array(1024);
const timeDomainData = new Uint8Array(2048);

// ❌ Bad: Regular arrays
const frequencyData = new Array(1024);
```

### 3.2 Avoid Garbage Collection

```typescript
class GCFriendlyRenderer {
  // Pre-allocated buffers
  private tempVector = new THREE.Vector3();
  private tempMatrix = new THREE.Matrix4();
  private tempColor = new THREE.Color();

  /**
   * Reuse objects instead of creating new ones
   */
  updateParticle(particle: Particle, position: THREE.Vector3): void {
    // ✅ Good: Reuse temp vector
    this.tempVector.copy(position);
    this.tempVector.multiplyScalar(2);
    particle.position.copy(this.tempVector);

    // ❌ Bad: Create new vector each call
    // particle.position.copy(position.clone().multiplyScalar(2));
  }

  /**
   * Object pooling for frequently created objects
   */
  private vector3Pool: THREE.Vector3[] = [];

  acquireVector3(): THREE.Vector3 {
    return this.vector3Pool.pop() || new THREE.Vector3();
  }

  releaseVector3(vec: THREE.Vector3): void {
    vec.set(0, 0, 0);
    this.vector3Pool.push(vec);
  }
}
```

### 3.3 Memory Monitoring

```typescript
class MemoryMonitor {
  private samples: number[] = [];

  getMemoryUsage(): number {
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      return mem.usedJSHeapSize;
    }
    return 0;
  }

  logMemoryUsage(): void {
    const usage = this.getMemoryUsage();
    this.samples.push(usage);

    if (this.samples.length > 60) {
      this.samples.shift();
    }

    console.log(`Memory: ${(usage / 1024 / 1024).toFixed(2)} MB`);
  }

  detectMemoryLeak(): boolean {
    if (this.samples.length < 60) return false;

    // Check if memory is consistently increasing
    const firstHalf = this.samples.slice(0, 30);
    const secondHalf = this.samples.slice(30);

    const avgFirst = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b) / secondHalf.length;

    // If memory increased by more than 20%, possible leak
    return (avgSecond - avgFirst) / avgFirst > 0.2;
  }
}
```

## 4. Frame Rate Optimization

### 4.1 Adaptive Quality

```typescript
class AdaptiveQualityController {
  private targetFPS: number = 60;
  private currentQuality: number = 1.0; // 0.0 to 1.0
  private fpsHistory: number[] = [];

  adjustQuality(currentFPS: number): void {
    this.fpsHistory.push(currentFPS);

    if (this.fpsHistory.length > 10) {
      this.fpsHistory.shift();
    }

    const avgFPS = this.fpsHistory.reduce((a, b) => a + b) / this.fpsHistory.length;

    if (avgFPS < this.targetFPS * 0.9) {
      // FPS too low, reduce quality
      this.currentQuality = Math.max(0.5, this.currentQuality - 0.1);
    } else if (avgFPS > this.targetFPS * 0.95) {
      // FPS stable, increase quality
      this.currentQuality = Math.min(1.0, this.currentQuality + 0.05);
    }
  }

  applyQuality(visualizer: Visualizer): void {
    if (visualizer instanceof ParticleSystemVisualizer) {
      visualizer.setParameter(
        'maxParticles',
        Math.floor(2000 * this.currentQuality)
      );
    } else if (visualizer instanceof SpectrumAnalyzerVisualizer) {
      visualizer.setParameter(
        'barCount',
        Math.floor(128 * this.currentQuality)
      );
    }
  }
}
```

### 4.2 Request Animation Frame Optimization

```typescript
class OptimizedRenderLoop {
  private isRunning: boolean = false;
  private rafId: number | null = null;
  private targetFPS: number = 60;
  private frameInterval: number;
  private lastFrameTime: number = 0;

  constructor(targetFPS: number = 60) {
    this.targetFPS = targetFPS;
    this.frameInterval = 1000 / targetFPS;
  }

  start(renderCallback: (deltaTime: number) => void): void {
    this.isRunning = true;
    this.lastFrameTime = performance.now();

    const loop = (currentTime: number) => {
      if (!this.isRunning) return;

      this.rafId = requestAnimationFrame(loop);

      const deltaTime = currentTime - this.lastFrameTime;

      // Throttle to target FPS
      if (deltaTime >= this.frameInterval) {
        this.lastFrameTime = currentTime - (deltaTime % this.frameInterval);
        renderCallback(deltaTime);
      }
    };

    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    this.isRunning = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
```

## 5. Profiling and Debugging

### 5.1 Performance Profiler

```typescript
class PerformanceProfiler {
  private markers: Map<string, number> = new Map();
  private measurements: Map<string, number[]> = new Map();

  mark(name: string): void {
    this.markers.set(name, performance.now());
  }

  measure(name: string, startMark: string): number {
    const startTime = this.markers.get(startMark);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;

    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }

    this.measurements.get(name)!.push(duration);

    return duration;
  }

  getAverageMeasurement(name: string): number {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) return 0;

    return measurements.reduce((a, b) => a + b) / measurements.length;
  }

  logProfile(): void {
    console.log('=== Performance Profile ===');

    for (const [name, measurements] of this.measurements) {
      const avg = measurements.reduce((a, b) => a + b) / measurements.length;
      const min = Math.min(...measurements);
      const max = Math.max(...measurements);

      console.log(`${name}:`);
      console.log(`  Average: ${avg.toFixed(2)}ms`);
      console.log(`  Min: ${min.toFixed(2)}ms`);
      console.log(`  Max: ${max.toFixed(2)}ms`);
    }
  }
}

// Usage
const profiler = new PerformanceProfiler();

profiler.mark('frame-start');
// ... audio processing
profiler.measure('audio-processing', 'frame-start');

profiler.mark('render-start');
// ... rendering
profiler.measure('rendering', 'render-start');

profiler.mark('postprocess-start');
// ... post-processing
profiler.measure('post-processing', 'postprocess-start');

profiler.measure('total-frame-time', 'frame-start');
```

## 6. Best Practices Summary

### Do's
- ✅ Use TypedArrays for audio data
- ✅ Pre-allocate objects and use pooling
- ✅ Batch rendering operations
- ✅ Use Web Workers for heavy processing
- ✅ Implement adaptive quality
- ✅ Profile regularly
- ✅ Cache static elements
- ✅ Use instanced rendering for particles
- ✅ Minimize state changes
- ✅ Implement LOD systems

### Don'ts
- ❌ Create objects in hot paths
- ❌ Use very large FFT sizes unnecessarily
- ❌ Render everything every frame
- ❌ Skip profiling
- ❌ Ignore memory leaks
- ❌ Use synchronous heavy operations
- ❌ Neglect browser differences
- ❌ Over-engineer prematurely
- ❌ Ignore user's hardware capabilities

---

**Version**: 1.0.0
**Last Updated**: 2025-11-21

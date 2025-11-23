/**
 * Basic Visualization Example
 * Demonstrates how to set up and use the visual dynamics system
 */

import { VisualizationEngine, defaultEngineConfig } from '../../src/music-framework/visuals/VisualizationEngine';
import { SpectrumAnalyzerVisualizer } from '../../src/music-framework/visuals/visualizers/SpectrumAnalyzer';
import { WaveformVisualizer } from '../../src/music-framework/visuals/visualizers/WaveformVisualizer';
import { ParticleSystemVisualizer } from '../../src/music-framework/visuals/visualizers/ParticleSystem';

/**
 * Example 1: Basic Spectrum Analyzer
 */
async function basicSpectrumExample() {
  // Get container element
  const container = document.getElementById('visualizer-container')!;

  // Create engine
  const engine = new VisualizationEngine({
    container,
    ...defaultEngineConfig,
    visual: {
      width: 1920,
      height: 1080,
      renderer: '2d',
      backgroundColor: '#000000',
      fps: 60
    }
  });

  // Initialize engine
  await engine.initialize();

  // Create spectrum analyzer visualizer
  const spectrumAnalyzer = new SpectrumAnalyzerVisualizer({
    barCount: 64,
    layout: 'vertical',
    style: 'bars',
    gradient: true,
    showPeaks: true,
    glowEffect: false
  });

  // Set visualizer
  engine.setVisualizer(spectrumAnalyzer);

  // Connect audio source
  const audioElement = document.getElementById('audio-player') as HTMLAudioElement;
  engine.connectAudioSource(audioElement);

  // Start visualization
  engine.start();

  // Update parameters dynamically
  setTimeout(() => {
    spectrumAnalyzer.setParameter('layout', 'circular');
  }, 5000);

  // Export to video after 10 seconds
  setTimeout(async () => {
    await engine.startExport({
      format: 'webm',
      width: 1920,
      height: 1080,
      frameRate: 60,
      duration: 30 // 30 seconds
    });

    setTimeout(async () => {
      const videoBlob = await engine.stopExport();
      const url = URL.createObjectURL(videoBlob);

      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = 'visualization.webm';
      downloadLink.click();
    }, 30000);
  }, 10000);
}

/**
 * Example 2: Waveform Visualizer
 */
async function waveformExample() {
  const container = document.getElementById('visualizer-container')!;

  const engine = new VisualizationEngine({
    container,
    ...defaultEngineConfig
  });

  await engine.initialize();

  const waveform = new WaveformVisualizer({
    mode: 'waveform',
    lineColor: '#00FF00',
    fillWaveform: true,
    showGrid: true
  });

  engine.setVisualizer(waveform);

  const audioElement = document.getElementById('audio-player') as HTMLAudioElement;
  engine.connectAudioSource(audioElement);

  engine.start();

  // Switch to phase scope after 10 seconds
  setTimeout(() => {
    waveform.setParameter('mode', 'phase');
  }, 10000);
}

/**
 * Example 3: Particle System
 */
async function particleSystemExample() {
  const container = document.getElementById('visualizer-container')!;

  const engine = new VisualizationEngine({
    container,
    ...defaultEngineConfig
  });

  await engine.initialize();

  const particles = new ParticleSystemVisualizer({
    maxParticles: 2000,
    emissionRate: 50,
    particleLife: 3,
    shape: 'star',
    blendMode: 'additive',
    trail: true,
    audioReactive: {
      emission: true,
      velocity: true,
      color: true,
      size: true
    }
  });

  engine.setVisualizer(particles);

  const audioElement = document.getElementById('audio-player') as HTMLAudioElement;
  engine.connectAudioSource(audioElement);

  engine.start();

  // Monitor FPS
  setInterval(() => {
    console.log('FPS:', engine.getFPS());
  }, 1000);
}

/**
 * Example 4: Custom Mapper Configuration
 */
async function customMapperExample() {
  const container = document.getElementById('visualizer-container')!;

  const engine = new VisualizationEngine({
    container,
    ...defaultEngineConfig
  });

  await engine.initialize();

  // Customize audio-visual mapping
  engine.updateMapperConfig({
    colorMapping: {
      mode: 'hybrid',
      saturationRange: [70, 100],
      lightnessRange: [40, 80],
      hueRotation: 120 // Shift hue spectrum
    },
    sizeMapping: {
      mode: 'logarithmic',
      baseSize: 20,
      scaleFactor: 100,
      maxSize: 500
    },
    triggerMapping: {
      beatSensitivity: 0.8,
      onsetSensitivity: 0.6,
      cooldownMs: 100
    }
  });

  const spectrumAnalyzer = new SpectrumAnalyzerVisualizer();
  engine.setVisualizer(spectrumAnalyzer);

  const audioElement = document.getElementById('audio-player') as HTMLAudioElement;
  engine.connectAudioSource(audioElement);

  engine.start();
}

/**
 * Example 5: Microphone Input (Live Visualization)
 */
async function microphoneExample() {
  const container = document.getElementById('visualizer-container')!;

  const engine = new VisualizationEngine({
    container,
    ...defaultEngineConfig
  });

  await engine.initialize();

  const spectrumAnalyzer = new SpectrumAnalyzerVisualizer({
    barCount: 128,
    layout: 'circular',
    gradient: true,
    glowEffect: true
  });

  engine.setVisualizer(spectrumAnalyzer);

  // Get microphone access
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    engine.connectAudioSource(stream);
    engine.start();

    console.log('Microphone connected - visualization started');
  } catch (error) {
    console.error('Failed to access microphone:', error);
  }
}

/**
 * Example 6: Preset Loading
 */
async function presetExample() {
  const container = document.getElementById('visualizer-container')!;

  const engine = new VisualizationEngine({
    container,
    ...defaultEngineConfig
  });

  await engine.initialize();

  // Load presets from JSON
  const response = await fetch('/config/music-framework/visual-presets.json');
  const presets = await response.json();

  // Apply "Classic Bars" preset
  const classicBarsPreset = presets.presets.spectrum.find(
    (p: any) => p.name === 'Classic Bars'
  );

  const spectrumAnalyzer = new SpectrumAnalyzerVisualizer(
    classicBarsPreset.parameters
  );

  engine.setVisualizer(spectrumAnalyzer);
  engine.updateMapperConfig(classicBarsPreset.mapper);

  const audioElement = document.getElementById('audio-player') as HTMLAudioElement;
  engine.connectAudioSource(audioElement);

  engine.start();

  // Switch presets every 10 seconds
  let currentPresetIndex = 0;
  setInterval(() => {
    currentPresetIndex = (currentPresetIndex + 1) % presets.presets.spectrum.length;
    const preset = presets.presets.spectrum[currentPresetIndex];

    console.log('Switching to preset:', preset.name);

    const newVisualizer = new SpectrumAnalyzerVisualizer(preset.parameters);
    engine.setVisualizer(newVisualizer);
    engine.updateMapperConfig(preset.mapper);
  }, 10000);
}

/**
 * Example 7: HTML Setup
 */
function createHTMLExample(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zordic Music Visualizer</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #000;
      font-family: Arial, sans-serif;
      color: #fff;
    }

    #visualizer-container {
      width: 100vw;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    canvas {
      max-width: 100%;
      max-height: 100%;
    }

    #controls {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      padding: 20px;
      border-radius: 10px;
    }

    button {
      background: #007AFF;
      color: white;
      border: none;
      padding: 10px 20px;
      margin: 5px;
      border-radius: 5px;
      cursor: pointer;
    }

    button:hover {
      background: #0051D5;
    }
  </style>
</head>
<body>
  <div id="visualizer-container"></div>

  <div id="controls">
    <audio id="audio-player" controls>
      <source src="your-audio-file.mp3" type="audio/mpeg">
    </audio>
    <br>
    <button id="start-btn">Start Visualization</button>
    <button id="stop-btn">Stop</button>
    <button id="export-btn">Export Video</button>
    <button id="mic-btn">Use Microphone</button>
  </div>

  <script type="module">
    import { basicSpectrumExample } from './basic-visualization-example.js';

    document.getElementById('start-btn').addEventListener('click', () => {
      basicSpectrumExample();
    });
  </script>
</body>
</html>
  `;
}

// Export examples
export {
  basicSpectrumExample,
  waveformExample,
  particleSystemExample,
  customMapperExample,
  microphoneExample,
  presetExample,
  createHTMLExample
};

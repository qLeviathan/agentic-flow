/**
 * Example 3: Creating Audio-Reactive Music Video
 *
 * This example demonstrates how to:
 * - Initialize the visual dynamics system
 * - Sync visuals with audio in real-time
 * - Use different visualization presets
 * - Export music video to MP4
 */

import { VisualizationEngine } from '../src/music-framework/visuals/VisualizationEngine.js';
import { SpectrumAnalyzerVisualizer } from '../src/music-framework/visuals/visualizers/SpectrumAnalyzer.js';
import { ParticleSystemVisualizer } from '../src/music-framework/visuals/visualizers/ParticleSystem.js';
import { ZordicMusicClient } from '../src/api/client.js';

async function createMusicVideo() {
  console.log('🎨 Example 3: Creating Audio-Reactive Music Video\n');

  // Step 1: Set up the visualization engine
  console.log('Step 1: Initializing visualization engine...');
  const container = document.getElementById('visualizer-container');
  const engine = new VisualizationEngine({
    container,
    width: 1920,
    height: 1080,
    fps: 60,
    renderer: 'canvas2d'  // Also: 'webgl'
  });

  await engine.initialize();
  console.log('✓ Visualization engine ready\n');

  // Step 2: Load audio file
  console.log('Step 2: Loading audio...');
  const audioElement = document.getElementById('audio-player');
  audioElement.src = '/examples/assets/sample-beat.mp3';

  await engine.connectAudioSource(audioElement);
  console.log('✓ Audio connected\n');

  // Step 3: Create spectrum analyzer
  console.log('Step 3: Setting up spectrum analyzer...');
  const spectrum = new SpectrumAnalyzerVisualizer({
    barCount: 64,
    layout: 'circular',
    gradient: true,
    colors: {
      low: '#00FF88',     // Bass - green
      mid: '#00FFFF',     // Mid - cyan
      high: '#FF00FF'     // Treble - magenta
    },
    showPeaks: true,
    smoothing: 0.8,
    scale: 'logarithmic'
  });

  engine.setVisualizer(spectrum);
  console.log('✓ Spectrum analyzer configured\n');

  // Step 4: Start visualization
  console.log('Step 4: Starting visualization...');
  engine.start();
  audioElement.play();
  console.log('✓ Visualization running at 60 FPS\n');

  // Step 5: Switch to particle system after 10 seconds
  console.log('Step 5: Preparing particle system...');
  setTimeout(() => {
    console.log('Switching to particle visualization...');

    const particles = new ParticleSystemVisualizer({
      particleCount: 1000,
      particleShape: 'circle',
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'],
      physics: {
        gravity: { x: 0, y: 0.1 },
        friction: 0.98,
        attraction: 0.001
      },
      audioReactive: {
        sizeMultiplier: 2.0,
        velocityMultiplier: 5.0,
        beatTrigger: true
      },
      trail: {
        enabled: true,
        length: 10,
        fadeSpeed: 0.1
      }
    });

    engine.setVisualizer(particles);
    console.log('✓ Switched to particle system\n');
  }, 10000);

  // Step 6: Export to video after 30 seconds
  setTimeout(async () => {
    console.log('Step 6: Exporting to video...');

    const exportConfig = {
      format: 'mp4',
      codec: 'h264',
      width: 1920,
      height: 1080,
      frameRate: 60,
      bitrate: 5000000,  // 5 Mbps
      duration: 30,       // seconds
      quality: 'high'
    };

    const exportResult = await engine.startExport(exportConfig);
    console.log(`✓ Export started: ${exportResult.jobId}\n`);

    // Monitor export progress
    const progressInterval = setInterval(async () => {
      const status = await engine.getExportStatus(exportResult.jobId);
      console.log(`Export progress: ${status.progress}%`);

      if (status.complete) {
        clearInterval(progressInterval);
        console.log(`✓ Video exported: ${status.url}\n`);
        console.log('🎉 Music video created successfully!');
        console.log(`Download: ${status.url}`);
        console.log(`File size: ${(status.fileSize / 1024 / 1024).toFixed(2)} MB`);

        // Clean up
        engine.stop();
      }
    }, 1000);
  }, 30000);
}

// Example: Using visualization presets
async function useVisualizationPresets() {
  console.log('🎨 Using Visualization Presets\n');

  const client = new ZordicMusicClient({
    apiUrl: 'http://localhost:3000',
    userId: 'student_003'
  });

  // Load available presets
  const presets = await client.visuals.listPresets();
  console.log(`Available presets: ${presets.length}`);
  presets.forEach((preset, i) => {
    console.log(`  ${i + 1}. ${preset.name} - ${preset.description}`);
  });
  console.log();

  // Apply a preset
  const selectedPreset = presets.find(p => p.name === 'Neon Spectrum Bars');
  console.log(`Applying preset: ${selectedPreset.name}`);

  const engine = new VisualizationEngine({ /* config */ });
  await engine.loadPreset(selectedPreset);
  console.log('✓ Preset applied\n');

  // Customize preset parameters
  await engine.updateVisualizerConfig({
    barCount: 128,           // More bars for detail
    sensitivity: 1.5,        // More reactive
    'colors.low': '#FF00FF'  // Change bass color
  });
  console.log('✓ Preset customized\n');
}

// Example: Social media optimized exports
async function exportForSocialMedia() {
  console.log('📱 Exporting for Social Media\n');

  const engine = new VisualizationEngine({ /* config */ });

  // Instagram Reel (9:16 vertical)
  console.log('Exporting Instagram Reel...');
  await engine.startExport({
    format: 'mp4',
    width: 1080,
    height: 1920,
    frameRate: 30,
    duration: 30,
    preset: 'instagram-reel'
  });

  // TikTok (9:16 vertical)
  console.log('Exporting TikTok video...');
  await engine.startExport({
    format: 'mp4',
    width: 1080,
    height: 1920,
    frameRate: 30,
    duration: 60,
    preset: 'tiktok'
  });

  // YouTube (16:9 horizontal)
  console.log('Exporting YouTube video...');
  await engine.startExport({
    format: 'mp4',
    width: 1920,
    height: 1080,
    frameRate: 60,
    quality: 'high',
    preset: 'youtube'
  });

  // Twitter/X (16:9 horizontal, compressed)
  console.log('Exporting Twitter video...');
  await engine.startExport({
    format: 'mp4',
    width: 1280,
    height: 720,
    frameRate: 30,
    bitrate: 2000000,  // 2 Mbps (under Twitter's limit)
    preset: 'twitter'
  });

  console.log('✓ All social media exports queued\n');
}

// HTML Integration Example
const htmlExample = `
<!DOCTYPE html>
<html>
<head>
  <title>Zordic Music Video Creator</title>
  <style>
    #visualizer-container {
      width: 100%;
      height: 100vh;
      background: #000;
    }
    #controls {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
    }
  </style>
</head>
<body>
  <div id="visualizer-container"></div>

  <audio id="audio-player" style="display: none;"></audio>

  <div id="controls">
    <button onclick="engine.start()">Play</button>
    <button onclick="engine.stop()">Stop</button>
    <button onclick="exportVideo()">Export Video</button>
    <select id="preset-selector" onchange="changePreset()">
      <option value="spectrum">Spectrum Analyzer</option>
      <option value="particles">Particles</option>
      <option value="waveform">Waveform</option>
      <option value="3d">3D Visualization</option>
    </select>
  </div>

  <script type="module">
    import { VisualizationEngine } from './src/music-framework/visuals/VisualizationEngine.js';

    // Initialize engine
    const container = document.getElementById('visualizer-container');
    window.engine = new VisualizationEngine({ container });
    await engine.initialize();

    // Load audio
    const audio = document.getElementById('audio-player');
    audio.src = 'my-beat.mp3';
    await engine.connectAudioSource(audio);

    // Export function
    window.exportVideo = async () => {
      await engine.startExport({
        format: 'mp4',
        width: 1920,
        height: 1080,
        frameRate: 60
      });
    };
  </script>
</body>
</html>
`;

// Run examples (uncomment to use)
// createMusicVideo().catch(console.error);
// useVisualizationPresets().catch(console.error);
// exportForSocialMedia().catch(console.error);

/**
 * Visualization Tips:
 *
 * 1. Performance:
 *    - Use lower particle counts for slower devices
 *    - Reduce FPS to 30 for better performance
 *    - Use Canvas 2D for simple visuals, WebGL for complex
 *
 * 2. Aesthetics:
 *    - Match colors to music genre (blues for electronic, warm for acoustic)
 *    - Use circular layouts for energetic music
 *    - Enable trails for dreamy effects
 *
 * 3. Export:
 *    - Higher bitrate = larger file but better quality
 *    - 60 FPS for smooth motion, 30 FPS for smaller files
 *    - Consider platform requirements (Instagram max 60s, TikTok max 3min)
 */

/**
 * WaveformVisualizer - Time-domain audio visualization
 * Displays waveform, oscilloscope, and phase scope views
 */

import { Visualizer, VisualizerParameter } from '../VisualizationEngine';
import { VisualData } from '../AudioVisualMapper';

export interface WaveformConfig {
  mode: 'waveform' | 'oscilloscope' | 'phase' | 'scrolling';
  lineWidth: number;
  lineColor: string;
  fillWaveform: boolean;
  fillOpacity: number;
  smoothing: boolean;
  showGrid: boolean;
  gridColor: string;
  symmetry: 'none' | 'horizontal' | 'vertical' | 'both';
  amplification: number;
}

export class WaveformVisualizer implements Visualizer {
  name = 'Waveform Display';
  type = '2D' as const;

  private config: WaveformConfig;
  private renderer: CanvasRenderingContext2D | null = null;
  private width: number = 0;
  private height: number = 0;
  private waveformHistory: Float32Array[] = [];
  private maxHistoryLength: number = 100;

  constructor(config: Partial<WaveformConfig> = {}) {
    this.config = {
      mode: 'waveform',
      lineWidth: 2,
      lineColor: '#00FF00',
      fillWaveform: true,
      fillOpacity: 0.3,
      smoothing: true,
      showGrid: false,
      gridColor: 'rgba(255, 255, 255, 0.1)',
      symmetry: 'none',
      amplification: 1.0,
      ...config
    };
  }

  async initialize(renderer: CanvasRenderingContext2D): Promise<void> {
    this.renderer = renderer;
    this.width = renderer.canvas.width;
    this.height = renderer.canvas.height;
  }

  update(visualData: VisualData, deltaTime: number): void {
    // Store current waveform in history for scrolling mode
    if (this.config.mode === 'scrolling') {
      this.waveformHistory.push(new Float32Array(visualData.sizes));

      if (this.waveformHistory.length > this.maxHistoryLength) {
        this.waveformHistory.shift();
      }
    }
  }

  render(): void {
    if (!this.renderer) return;

    const ctx = this.renderer;

    // Clear canvas
    ctx.clearRect(0, 0, this.width, this.height);

    // Draw grid if enabled
    if (this.config.showGrid) {
      this.drawGrid(ctx);
    }

    // Render based on mode
    switch (this.config.mode) {
      case 'waveform':
        this.renderWaveform(ctx);
        break;
      case 'oscilloscope':
        this.renderOscilloscope(ctx);
        break;
      case 'phase':
        this.renderPhaseScope(ctx);
        break;
      case 'scrolling':
        this.renderScrolling(ctx);
        break;
    }
  }

  private renderWaveform(ctx: CanvasRenderingContext2D): void {
    // This would receive actual time-domain data from visualData
    // For now, using a placeholder approach
    const centerY = this.height / 2;

    ctx.strokeStyle = this.config.lineColor;
    ctx.lineWidth = this.config.lineWidth;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Draw waveform
    ctx.beginPath();

    // Placeholder: draw a simple sine wave
    // In production, this would use actual audio time-domain data
    const points = 1024;
    const step = this.width / points;

    for (let i = 0; i < points; i++) {
      const x = i * step;
      const t = (i / points) * Math.PI * 4;
      const y = centerY + Math.sin(t) * (this.height * 0.4) * this.config.amplification;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();

    // Fill waveform if enabled
    if (this.config.fillWaveform) {
      ctx.lineTo(this.width, centerY);
      ctx.lineTo(0, centerY);
      ctx.closePath();

      ctx.fillStyle = this.hexToRGBA(this.config.lineColor, this.config.fillOpacity);
      ctx.fill();
    }

    // Apply symmetry
    if (this.config.symmetry !== 'none') {
      this.applySymmetry(ctx);
    }
  }

  private renderOscilloscope(ctx: CanvasRenderingContext2D): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    ctx.strokeStyle = this.config.lineColor;
    ctx.lineWidth = this.config.lineWidth;

    ctx.beginPath();

    // Circular oscilloscope pattern
    const points = 360;
    const radius = Math.min(this.width, this.height) * 0.4;

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const amplitude = Math.sin(angle * 3) * 0.3 + 1; // Placeholder
      const r = radius * amplitude * this.config.amplification;

      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.stroke();

    if (this.config.fillWaveform) {
      ctx.fillStyle = this.hexToRGBA(this.config.lineColor, this.config.fillOpacity);
      ctx.fill();
    }
  }

  private renderPhaseScope(ctx: CanvasRenderingContext2D): void {
    // Lissajous curve (stereo phase correlation)
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const size = Math.min(this.width, this.height) * 0.8;

    ctx.strokeStyle = this.config.lineColor;
    ctx.lineWidth = this.config.lineWidth;

    // Draw center cross
    ctx.strokeStyle = this.config.gridColor;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, this.height);
    ctx.moveTo(0, centerY);
    ctx.lineTo(this.width, centerY);
    ctx.stroke();

    // Draw phase scope
    ctx.strokeStyle = this.config.lineColor;
    ctx.lineWidth = this.config.lineWidth;

    ctx.beginPath();

    const points = 1000;
    for (let i = 0; i < points; i++) {
      const t = (i / points) * Math.PI * 2;

      // Placeholder: Lissajous figure
      // In production: left channel = x, right channel = y
      const left = Math.sin(t * 2);
      const right = Math.sin(t * 3);

      const x = centerX + (left * size / 2) * this.config.amplification;
      const y = centerY + (right * size / 2) * this.config.amplification;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  private renderScrolling(ctx: CanvasRenderingContext2D): void {
    if (this.waveformHistory.length === 0) return;

    const centerY = this.height / 2;
    const stepX = this.width / this.waveformHistory.length;

    ctx.strokeStyle = this.config.lineColor;
    ctx.lineWidth = this.config.lineWidth;

    // Draw historical waveforms with fade
    for (let t = 0; t < this.waveformHistory.length; t++) {
      const waveform = this.waveformHistory[t];
      const alpha = (t / this.waveformHistory.length) * 0.8 + 0.2;

      ctx.globalAlpha = alpha;
      ctx.beginPath();

      const x = t * stepX;
      const samples = waveform.length;
      const stepY = this.height / samples;

      for (let i = 0; i < samples; i++) {
        const amplitude = (waveform[i] - 0.5) * 2; // Normalize to -1 to 1
        const y = centerY + (amplitude * centerY * this.config.amplification);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
  }

  private drawGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = this.config.gridColor;
    ctx.lineWidth = 1;

    const gridSpacing = 50;

    // Vertical lines
    for (let x = 0; x < this.width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < this.height; y += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Center lines (brighter)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(this.width / 2, 0);
    ctx.lineTo(this.width / 2, this.height);
    ctx.moveTo(0, this.height / 2);
    ctx.lineTo(this.width, this.height / 2);
    ctx.stroke();
  }

  private applySymmetry(ctx: CanvasRenderingContext2D): void {
    // Save current canvas state
    ctx.save();

    if (this.config.symmetry === 'horizontal' || this.config.symmetry === 'both') {
      ctx.scale(1, -1);
      ctx.translate(0, -this.height);
      ctx.globalAlpha = 0.5;
      // Redraw would happen here
    }

    if (this.config.symmetry === 'vertical' || this.config.symmetry === 'both') {
      ctx.scale(-1, 1);
      ctx.translate(-this.width, 0);
      ctx.globalAlpha = 0.5;
      // Redraw would happen here
    }

    ctx.restore();
  }

  private hexToRGBA(hex: string, alpha: number): string {
    // Convert hex color to rgba
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  getParameters(): VisualizerParameter[] {
    return [
      {
        key: 'mode',
        label: 'Mode',
        type: 'select',
        value: this.config.mode,
        options: ['waveform', 'oscilloscope', 'phase', 'scrolling']
      },
      {
        key: 'lineWidth',
        label: 'Line Width',
        type: 'number',
        value: this.config.lineWidth,
        min: 1,
        max: 10
      },
      {
        key: 'lineColor',
        label: 'Line Color',
        type: 'color',
        value: this.config.lineColor
      },
      {
        key: 'fillWaveform',
        label: 'Fill Waveform',
        type: 'boolean',
        value: this.config.fillWaveform
      },
      {
        key: 'fillOpacity',
        label: 'Fill Opacity',
        type: 'number',
        value: this.config.fillOpacity,
        min: 0,
        max: 1
      },
      {
        key: 'showGrid',
        label: 'Show Grid',
        type: 'boolean',
        value: this.config.showGrid
      },
      {
        key: 'symmetry',
        label: 'Symmetry',
        type: 'select',
        value: this.config.symmetry,
        options: ['none', 'horizontal', 'vertical', 'both']
      },
      {
        key: 'amplification',
        label: 'Amplification',
        type: 'number',
        value: this.config.amplification,
        min: 0.1,
        max: 5
      }
    ];
  }

  setParameter(key: string, value: any): void {
    if (key in this.config) {
      (this.config as any)[key] = value;
    }
  }

  dispose(): void {
    this.waveformHistory = [];
    this.renderer = null;
  }
}

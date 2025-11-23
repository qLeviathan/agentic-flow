/**
 * SpectrumAnalyzer - Frequency bar visualizer
 * Classic spectrum analyzer with customizable appearance and layout
 */

import { Visualizer, VisualizerParameter } from '../VisualizationEngine';
import { VisualData } from '../AudioVisualMapper';

export interface SpectrumAnalyzerConfig {
  barCount: number;
  barSpacing: number;
  barWidth: number | 'auto';
  layout: 'vertical' | 'horizontal' | 'circular' | 'mirrored';
  style: 'bars' | 'line' | 'filled' | 'dots';
  frequencyScale: 'linear' | 'logarithmic' | 'mel' | 'bark';
  smoothing: number;
  gradient: boolean;
  showPeaks: boolean;
  peakDecay: number;
  glowEffect: boolean;
  reflection: boolean;
}

interface SpectrumBar {
  x: number;
  y: number;
  width: number;
  height: number;
  targetHeight: number;
  currentHeight: number;
  peakHeight: number;
  peakDecayCounter: number;
  color: string;
  frequencyBin: number;
}

export class SpectrumAnalyzerVisualizer implements Visualizer {
  name = 'Spectrum Analyzer';
  type = '2D' as const;

  private config: SpectrumAnalyzerConfig;
  private renderer: CanvasRenderingContext2D | null = null;
  private bars: SpectrumBar[] = [];
  private width: number = 0;
  private height: number = 0;
  private gradient: CanvasGradient | null = null;

  constructor(config: Partial<SpectrumAnalyzerConfig> = {}) {
    this.config = {
      barCount: 64,
      barSpacing: 2,
      barWidth: 'auto',
      layout: 'vertical',
      style: 'bars',
      frequencyScale: 'logarithmic',
      smoothing: 0.7,
      gradient: true,
      showPeaks: true,
      peakDecay: 0.95,
      glowEffect: false,
      reflection: false,
      ...config
    };
  }

  async initialize(renderer: CanvasRenderingContext2D): Promise<void> {
    this.renderer = renderer;
    this.width = renderer.canvas.width;
    this.height = renderer.canvas.height;

    this.createBars();
    this.createGradient();
  }

  update(visualData: VisualData, deltaTime: number): void {
    const { sizes, colors } = visualData;

    // Map frequency data to bars
    for (let i = 0; i < this.bars.length; i++) {
      const bar = this.bars[i];

      // Get corresponding frequency data
      const dataIndex = Math.floor((i / this.bars.length) * sizes.length);
      const targetHeight = sizes[dataIndex] || 0;

      // Smooth transition
      bar.targetHeight = targetHeight * this.height * 0.8;
      bar.currentHeight += (bar.targetHeight - bar.currentHeight) * this.config.smoothing;

      // Update color
      if (colors[dataIndex]) {
        const color = colors[dataIndex];
        bar.color = `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
      }

      // Peak tracking
      if (this.config.showPeaks) {
        if (bar.currentHeight > bar.peakHeight) {
          bar.peakHeight = bar.currentHeight;
          bar.peakDecayCounter = 0;
        } else {
          bar.peakDecayCounter++;
          if (bar.peakDecayCounter > 5) {
            bar.peakHeight *= this.config.peakDecay;
          }
        }
      }
    }
  }

  render(): void {
    if (!this.renderer) return;

    const ctx = this.renderer;

    // Clear canvas
    ctx.clearRect(0, 0, this.width, this.height);

    // Render based on layout
    switch (this.config.layout) {
      case 'vertical':
        this.renderVertical(ctx);
        break;
      case 'horizontal':
        this.renderHorizontal(ctx);
        break;
      case 'circular':
        this.renderCircular(ctx);
        break;
      case 'mirrored':
        this.renderMirrored(ctx);
        break;
    }

    // Render reflection
    if (this.config.reflection) {
      this.renderReflection(ctx);
    }
  }

  private renderVertical(ctx: CanvasRenderingContext2D): void {
    for (const bar of this.bars) {
      // Render bar
      if (this.config.style === 'bars') {
        this.renderBar(ctx, bar);
      } else if (this.config.style === 'filled') {
        this.renderFilledBar(ctx, bar);
      }

      // Render peak
      if (this.config.showPeaks) {
        this.renderPeak(ctx, bar);
      }

      // Render glow
      if (this.config.glowEffect) {
        this.renderGlow(ctx, bar);
      }
    }
  }

  private renderBar(ctx: CanvasRenderingContext2D, bar: SpectrumBar): void {
    ctx.fillStyle = this.config.gradient && this.gradient ? this.gradient : bar.color;

    const barHeight = Math.max(bar.currentHeight, 1);
    const y = this.height - barHeight;

    ctx.fillRect(bar.x, y, bar.width, barHeight);

    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(bar.x, y, bar.width, barHeight);
  }

  private renderFilledBar(ctx: CanvasRenderingContext2D, bar: SpectrumBar): void {
    ctx.fillStyle = bar.color;

    const barHeight = Math.max(bar.currentHeight, 1);
    const y = this.height - barHeight;

    ctx.beginPath();
    ctx.rect(bar.x, y, bar.width, barHeight);
    ctx.fill();
  }

  private renderPeak(ctx: CanvasRenderingContext2D, bar: SpectrumBar): void {
    if (bar.peakHeight < 2) return;

    ctx.fillStyle = bar.color;
    const y = this.height - bar.peakHeight;

    // Draw peak line
    ctx.fillRect(bar.x, y - 2, bar.width, 2);

    // Glow effect for peak
    ctx.shadowBlur = 10;
    ctx.shadowColor = bar.color;
    ctx.fillRect(bar.x, y - 2, bar.width, 2);
    ctx.shadowBlur = 0;
  }

  private renderGlow(ctx: CanvasRenderingContext2D, bar: SpectrumBar): void {
    const barHeight = Math.max(bar.currentHeight, 1);
    const y = this.height - barHeight;

    ctx.shadowBlur = 20;
    ctx.shadowColor = bar.color;
    ctx.fillStyle = bar.color;
    ctx.fillRect(bar.x, y, bar.width, barHeight);
    ctx.shadowBlur = 0;
  }

  private renderHorizontal(ctx: CanvasRenderingContext2D): void {
    for (const bar of this.bars) {
      ctx.fillStyle = bar.color;

      const barWidth = Math.max(bar.currentHeight, 1);

      ctx.fillRect(0, bar.y, barWidth, bar.height);
    }
  }

  private renderCircular(ctx: CanvasRenderingContext2D): void {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(this.width, this.height) * 0.3;

    ctx.save();
    ctx.translate(centerX, centerY);

    for (let i = 0; i < this.bars.length; i++) {
      const bar = this.bars[i];
      const angle = (i / this.bars.length) * Math.PI * 2;

      ctx.save();
      ctx.rotate(angle);

      ctx.fillStyle = bar.color;
      const barHeight = Math.max(bar.currentHeight * 0.5, 1);

      ctx.fillRect(radius, -bar.width / 2, barHeight, bar.width);

      ctx.restore();
    }

    ctx.restore();
  }

  private renderMirrored(ctx: CanvasRenderingContext2D): void {
    const centerY = this.height / 2;

    for (const bar of this.bars) {
      ctx.fillStyle = bar.color;

      const barHeight = Math.max(bar.currentHeight, 1) / 2;

      // Top half
      ctx.fillRect(bar.x, centerY - barHeight, bar.width, barHeight);

      // Bottom half (mirrored)
      ctx.fillRect(bar.x, centerY, bar.width, barHeight);
    }
  }

  private renderReflection(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // Create reflection gradient
    const reflectionGradient = ctx.createLinearGradient(
      0, this.height / 2, 0, this.height
    );
    reflectionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    reflectionGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.3;

    // Flip and render reflection
    ctx.scale(1, -1);
    ctx.translate(0, -this.height);

    this.renderVertical(ctx);

    ctx.restore();
  }

  private createBars(): void {
    this.bars = [];

    const barWidth = this.config.barWidth === 'auto'
      ? (this.width / this.config.barCount) - this.config.barSpacing
      : this.config.barWidth;

    const totalSpacing = this.config.barSpacing * (this.config.barCount - 1);
    const totalBarsWidth = barWidth * this.config.barCount;
    const startX = (this.width - totalBarsWidth - totalSpacing) / 2;

    for (let i = 0; i < this.config.barCount; i++) {
      const x = startX + (i * (barWidth + this.config.barSpacing));

      this.bars.push({
        x,
        y: 0,
        width: barWidth,
        height: 0,
        targetHeight: 0,
        currentHeight: 0,
        peakHeight: 0,
        peakDecayCounter: 0,
        color: '#ffffff',
        frequencyBin: this.mapBarToFrequencyBin(i)
      });
    }
  }

  private mapBarToFrequencyBin(barIndex: number): number {
    const totalBins = 1024; // Typical FFT size / 2

    if (this.config.frequencyScale === 'linear') {
      return Math.floor((barIndex / this.config.barCount) * totalBins);
    } else if (this.config.frequencyScale === 'logarithmic') {
      // Logarithmic scaling (musical)
      const minFreq = 20;
      const maxFreq = 20000;
      const logMin = Math.log10(minFreq);
      const logMax = Math.log10(maxFreq);

      const logValue = logMin + (barIndex / this.config.barCount) * (logMax - logMin);
      const frequency = Math.pow(10, logValue);

      // Map frequency to bin
      const nyquist = 22050;
      return Math.floor((frequency / nyquist) * totalBins);
    }

    return barIndex;
  }

  private createGradient(): void {
    if (!this.renderer) return;

    this.gradient = this.renderer.createLinearGradient(
      0, this.height, 0, 0
    );

    this.gradient.addColorStop(0, '#FF0000');    // Red (bass)
    this.gradient.addColorStop(0.2, '#FF7F00');  // Orange
    this.gradient.addColorStop(0.4, '#FFFF00');  // Yellow
    this.gradient.addColorStop(0.6, '#00FF00');  // Green
    this.gradient.addColorStop(0.8, '#0000FF');  // Blue
    this.gradient.addColorStop(1, '#9400D3');    // Violet (treble)
  }

  getParameters(): VisualizerParameter[] {
    return [
      {
        key: 'barCount',
        label: 'Bar Count',
        type: 'number',
        value: this.config.barCount,
        min: 16,
        max: 256
      },
      {
        key: 'barSpacing',
        label: 'Bar Spacing',
        type: 'number',
        value: this.config.barSpacing,
        min: 0,
        max: 10
      },
      {
        key: 'layout',
        label: 'Layout',
        type: 'select',
        value: this.config.layout,
        options: ['vertical', 'horizontal', 'circular', 'mirrored']
      },
      {
        key: 'style',
        label: 'Style',
        type: 'select',
        value: this.config.style,
        options: ['bars', 'line', 'filled', 'dots']
      },
      {
        key: 'smoothing',
        label: 'Smoothing',
        type: 'number',
        value: this.config.smoothing,
        min: 0,
        max: 1
      },
      {
        key: 'gradient',
        label: 'Gradient',
        type: 'boolean',
        value: this.config.gradient
      },
      {
        key: 'showPeaks',
        label: 'Show Peaks',
        type: 'boolean',
        value: this.config.showPeaks
      },
      {
        key: 'glowEffect',
        label: 'Glow Effect',
        type: 'boolean',
        value: this.config.glowEffect
      },
      {
        key: 'reflection',
        label: 'Reflection',
        type: 'boolean',
        value: this.config.reflection
      }
    ];
  }

  setParameter(key: string, value: any): void {
    if (key in this.config) {
      (this.config as any)[key] = value;

      // Recreate bars if bar count changed
      if (key === 'barCount' || key === 'barSpacing' || key === 'barWidth') {
        this.createBars();
      }
    }
  }

  dispose(): void {
    this.bars = [];
    this.gradient = null;
    this.renderer = null;
  }
}

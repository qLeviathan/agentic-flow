/**
 * ParticleSystem - Audio-reactive particle visualizer
 * Creates dynamic particle effects that respond to music
 */

import { Visualizer, VisualizerParameter } from '../VisualizationEngine';
import { VisualData, Trigger } from '../AudioVisualMapper';

export interface ParticleSystemConfig {
  maxParticles: number;
  emissionRate: number;
  particleLife: number;
  particleSize: number;
  sizeVariation: number;
  velocityRange: [number, number];
  gravity: number;
  audioReactive: {
    emission: boolean;
    velocity: boolean;
    color: boolean;
    size: boolean;
  };
  blendMode: 'normal' | 'additive' | 'multiply';
  shape: 'circle' | 'square' | 'triangle' | 'star';
  trail: boolean;
  trailLength: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: { h: number; s: number; l: number };
  alpha: number;
  rotation: number;
  rotationSpeed: number;
}

export class ParticleSystemVisualizer implements Visualizer {
  name = 'Particle System';
  type = '2D' as const;

  private config: ParticleSystemConfig;
  private renderer: CanvasRenderingContext2D | null = null;
  private width: number = 0;
  private height: number = 0;
  private particles: Particle[] = [];
  private emissionAccumulator: number = 0;
  private audioEnergy: number = 0;

  constructor(config: Partial<ParticleSystemConfig> = {}) {
    this.config = {
      maxParticles: 1000,
      emissionRate: 10, // particles per second
      particleLife: 3, // seconds
      particleSize: 5,
      sizeVariation: 0.5,
      velocityRange: [-100, 100],
      gravity: 50,
      audioReactive: {
        emission: true,
        velocity: true,
        color: true,
        size: true
      },
      blendMode: 'additive',
      shape: 'circle',
      trail: false,
      trailLength: 10,
      ...config
    };
  }

  async initialize(renderer: CanvasRenderingContext2D): Promise<void> {
    this.renderer = renderer;
    this.width = renderer.canvas.width;
    this.height = renderer.canvas.height;
  }

  update(visualData: VisualData, deltaTime: number): void {
    const dt = deltaTime / 1000; // Convert to seconds

    // Calculate audio energy
    this.audioEnergy = visualData.features.rmsEnergy;

    // Emit new particles
    this.emitParticles(visualData, dt);

    // Update existing particles
    this.updateParticles(dt);

    // Handle triggers (beats)
    this.handleTriggers(visualData.triggers);
  }

  private emitParticles(visualData: VisualData, dt: number): void {
    let emissionRate = this.config.emissionRate;

    // Audio-reactive emission
    if (this.config.audioReactive.emission) {
      emissionRate *= (1 + this.audioEnergy * 5);
    }

    this.emissionAccumulator += emissionRate * dt;

    const particlesToEmit = Math.floor(this.emissionAccumulator);
    this.emissionAccumulator -= particlesToEmit;

    for (let i = 0; i < particlesToEmit; i++) {
      if (this.particles.length >= this.config.maxParticles) break;

      this.createParticle(visualData);
    }
  }

  private createParticle(visualData: VisualData): void {
    const [minVel, maxVel] = this.config.velocityRange;

    // Velocity
    let vx = minVel + Math.random() * (maxVel - minVel);
    let vy = minVel + Math.random() * (maxVel - minVel);

    // Audio-reactive velocity
    if (this.config.audioReactive.velocity) {
      const velocityMultiplier = 1 + this.audioEnergy * 2;
      vx *= velocityMultiplier;
      vy *= velocityMultiplier;
    }

    // Size
    let size = this.config.particleSize;
    if (this.config.sizeVariation > 0) {
      size *= (1 - this.config.sizeVariation) + Math.random() * this.config.sizeVariation * 2;
    }

    // Audio-reactive size
    if (this.config.audioReactive.size) {
      size *= (1 + this.audioEnergy);
    }

    // Color
    let color = { h: 180, s: 70, l: 50 };
    if (this.config.audioReactive.color && visualData.colors.length > 0) {
      const colorIndex = Math.floor(Math.random() * visualData.colors.length);
      color = visualData.colors[colorIndex];
    }

    const particle: Particle = {
      x: this.width / 2,
      y: this.height / 2,
      vx,
      vy,
      size,
      life: this.config.particleLife,
      maxLife: this.config.particleLife,
      color,
      alpha: 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 2
    };

    this.particles.push(particle);
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Update position
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Apply gravity
      p.vy += this.config.gravity * dt;

      // Update rotation
      p.rotation += p.rotationSpeed * dt;

      // Update life
      p.life -= dt;

      // Update alpha based on life
      p.alpha = Math.min(p.life / p.maxLife, 1);

      // Remove dead particles
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private handleTriggers(triggers: Trigger[]): void {
    for (const trigger of triggers) {
      if (trigger.type === 'beat') {
        // Burst of particles on beat
        const burstCount = Math.floor(trigger.intensity * 50);

        for (let i = 0; i < burstCount; i++) {
          if (this.particles.length >= this.config.maxParticles) break;

          // Create burst particle with radial velocity
          const angle = Math.random() * Math.PI * 2;
          const speed = 200 + Math.random() * 300;

          const particle: Particle = {
            x: this.width / 2,
            y: this.height / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: this.config.particleSize * (1 + trigger.intensity),
            life: this.config.particleLife,
            maxLife: this.config.particleLife,
            color: { h: Math.random() * 360, s: 70, l: 50 },
            alpha: 1,
            rotation: 0,
            rotationSpeed: (Math.random() - 0.5) * 4
          };

          this.particles.push(particle);
        }
      }
    }
  }

  render(): void {
    if (!this.renderer) return;

    const ctx = this.renderer;

    // Clear canvas (with trail effect if enabled)
    if (this.config.trail) {
      ctx.fillStyle = `rgba(0, 0, 0, ${1 / this.config.trailLength})`;
      ctx.fillRect(0, 0, this.width, this.height);
    } else {
      ctx.clearRect(0, 0, this.width, this.height);
    }

    // Set blend mode
    ctx.globalCompositeOperation = this.config.blendMode === 'additive' ? 'lighter' :
                                    this.config.blendMode === 'multiply' ? 'multiply' :
                                    'source-over';

    // Render particles
    for (const p of this.particles) {
      this.renderParticle(ctx, p);
    }

    ctx.globalCompositeOperation = 'source-over';
  }

  private renderParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
    ctx.save();

    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    ctx.globalAlpha = p.alpha;

    const color = `hsl(${p.color.h}, ${p.color.s}%, ${p.color.l}%)`;
    ctx.fillStyle = color;

    switch (this.config.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'square':
        ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
        break;

      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size, p.size);
        ctx.lineTo(-p.size, p.size);
        ctx.closePath();
        ctx.fill();
        break;

      case 'star':
        this.drawStar(ctx, 0, 0, 5, p.size, p.size / 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ): void {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }

    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  getParameters(): VisualizerParameter[] {
    return [
      {
        key: 'maxParticles',
        label: 'Max Particles',
        type: 'number',
        value: this.config.maxParticles,
        min: 100,
        max: 10000
      },
      {
        key: 'emissionRate',
        label: 'Emission Rate',
        type: 'number',
        value: this.config.emissionRate,
        min: 1,
        max: 100
      },
      {
        key: 'particleLife',
        label: 'Particle Life (s)',
        type: 'number',
        value: this.config.particleLife,
        min: 0.5,
        max: 10
      },
      {
        key: 'particleSize',
        label: 'Particle Size',
        type: 'number',
        value: this.config.particleSize,
        min: 1,
        max: 20
      },
      {
        key: 'gravity',
        label: 'Gravity',
        type: 'number',
        value: this.config.gravity,
        min: -200,
        max: 200
      },
      {
        key: 'shape',
        label: 'Shape',
        type: 'select',
        value: this.config.shape,
        options: ['circle', 'square', 'triangle', 'star']
      },
      {
        key: 'blendMode',
        label: 'Blend Mode',
        type: 'select',
        value: this.config.blendMode,
        options: ['normal', 'additive', 'multiply']
      },
      {
        key: 'trail',
        label: 'Trail Effect',
        type: 'boolean',
        value: this.config.trail
      }
    ];
  }

  setParameter(key: string, value: any): void {
    if (key in this.config) {
      (this.config as any)[key] = value;
    }
  }

  dispose(): void {
    this.particles = [];
    this.renderer = null;
  }
}

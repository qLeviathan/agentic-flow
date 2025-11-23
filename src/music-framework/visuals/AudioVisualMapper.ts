/**
 * AudioVisualMapper - Core audio-to-visual mapping system
 * Converts audio analysis data into visual parameters
 */

export interface AudioAnalysisData {
  frequencyData: Float32Array;
  timeDomainData: Float32Array;
  features: AudioFeatures;
  beat: BeatEvent | null;
  timestamp: number;
}

export interface AudioFeatures {
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlux: number;
  spectralFlatness: number;
  rmsEnergy: number;
  energyByBand: number[];
  zeroCrossingRate: number;
  onsetDetected: boolean;
  beatConfidence: number;
  tempo: number;
  harmonicRatio: number;
  pitchEstimate: number;
  chroma: number[];
}

export interface BeatEvent {
  timestamp: number;
  energy: number;
  confidence: number;
}

export interface VisualData {
  colors: Color[];
  sizes: number[];
  triggers: Trigger[];
  patterns: Pattern[];
  features: AudioFeatures;
}

export interface Color {
  h: number; // Hue 0-360
  s: number; // Saturation 0-100
  l: number; // Lightness 0-100
}

export interface Trigger {
  type: 'beat' | 'onset' | 'custom';
  intensity: number;
  timestamp: number;
}

export interface Pattern {
  type: 'grid' | 'radial' | 'fractal' | 'lsystem' | 'cellular';
  parameters: Record<string, any>;
}

export interface MapperConfig {
  colorMapping: ColorMappingConfig;
  sizeMapping: SizeMappingConfig;
  triggerMapping: TriggerMappingConfig;
  patternMapping: PatternMappingConfig;
}

export interface ColorMappingConfig {
  mode: 'frequency' | 'energy' | 'hybrid';
  saturationRange: [number, number];
  lightnessRange: [number, number];
  hueRotation: number;
}

export interface SizeMappingConfig {
  mode: 'linear' | 'logarithmic' | 'exponential';
  baseSize: number;
  scaleFactor: number;
  maxSize: number;
}

export interface TriggerMappingConfig {
  beatSensitivity: number;
  onsetSensitivity: number;
  cooldownMs: number;
}

export interface PatternMappingConfig {
  enabled: boolean;
  adaptToRhythm: boolean;
  complexity: number;
}

/**
 * Main AudioVisualMapper class
 */
export class AudioVisualMapper {
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

  /**
   * Map audio analysis data to visual parameters
   */
  map(audioData: AudioAnalysisData): VisualData {
    const { frequencyData, timeDomainData, features, beat } = audioData;

    // Frequency → Color
    const colors = this.colorMapper.mapFrequenciesToColors(frequencyData, features);

    // Amplitude → Size
    const sizes = this.sizeMapper.mapAmplitudesToSizes(frequencyData);

    // Beat → Triggers
    const triggers: Trigger[] = [];
    if (beat) {
      triggers.push(...this.triggerMapper.createTriggers(beat));
    }
    if (features.onsetDetected) {
      triggers.push({
        type: 'onset',
        intensity: features.rmsEnergy,
        timestamp: audioData.timestamp
      });
    }

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

  /**
   * Update configuration
   */
  updateConfig(config: Partial<MapperConfig>): void {
    if (config.colorMapping) {
      this.colorMapper.updateConfig(config.colorMapping);
    }
    if (config.sizeMapping) {
      this.sizeMapper.updateConfig(config.sizeMapping);
    }
    if (config.triggerMapping) {
      this.triggerMapper.updateConfig(config.triggerMapping);
    }
    if (config.patternMapping) {
      this.patternMapper.updateConfig(config.patternMapping);
    }
  }
}

/**
 * Frequency to Color Mapper
 */
export class FrequencyColorMapper {
  private config: ColorMappingConfig;

  constructor(config: ColorMappingConfig) {
    this.config = config;
  }

  mapFrequenciesToColors(frequencyData: Float32Array, features: AudioFeatures): Color[] {
    const colors: Color[] = [];
    const binCount = frequencyData.length;

    for (let i = 0; i < binCount; i++) {
      const frequency = this.binToFrequency(i, binCount);
      const amplitude = frequencyData[i];

      let hue: number;
      if (this.config.mode === 'frequency') {
        hue = this.frequencyToHue(frequency);
      } else if (this.config.mode === 'energy') {
        hue = this.energyToHue(amplitude, features.rmsEnergy);
      } else {
        // Hybrid: blend frequency and energy
        const freqHue = this.frequencyToHue(frequency);
        const energyHue = this.energyToHue(amplitude, features.rmsEnergy);
        hue = (freqHue + energyHue) / 2;
      }

      // Apply hue rotation
      hue = (hue + this.config.hueRotation) % 360;

      const saturation = this.amplitudeToSaturation(amplitude);
      const lightness = this.amplitudeToLightness(amplitude);

      colors.push({ h: hue, s: saturation, l: lightness });
    }

    return colors;
  }

  private frequencyToHue(frequency: number): number {
    // Logarithmic frequency to hue mapping (musical scale)
    const minFreq = 20;
    const maxFreq = 20000;
    const logFreq = Math.log10(Math.max(frequency, minFreq));
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);

    const normalized = (logFreq - logMin) / (logMax - logMin);
    return normalized * 360;
  }

  private energyToHue(amplitude: number, rmsEnergy: number): number {
    // Energy-based hue (cool to warm)
    const normalizedEnergy = Math.min(amplitude / (rmsEnergy * 2), 1);
    return normalizedEnergy * 240; // Blue (240) to Red (0)
  }

  private amplitudeToSaturation(amplitude: number): number {
    const [min, max] = this.config.saturationRange;
    return min + (amplitude * (max - min));
  }

  private amplitudeToLightness(amplitude: number): number {
    const [min, max] = this.config.lightnessRange;
    return min + (amplitude * (max - min));
  }

  private binToFrequency(bin: number, totalBins: number): number {
    const nyquist = 22050; // Assuming 44100 Hz sample rate
    return (bin / totalBins) * nyquist;
  }

  updateConfig(config: ColorMappingConfig): void {
    this.config = config;
  }
}

/**
 * Amplitude to Size Mapper
 */
export class AmplitudeSizeMapper {
  private config: SizeMappingConfig;

  constructor(config: SizeMappingConfig) {
    this.config = config;
  }

  mapAmplitudesToSizes(frequencyData: Float32Array): number[] {
    const sizes: number[] = [];

    for (let i = 0; i < frequencyData.length; i++) {
      const amplitude = frequencyData[i];
      let size: number;

      switch (this.config.mode) {
        case 'linear':
          size = this.config.baseSize + (amplitude * this.config.scaleFactor);
          break;
        case 'logarithmic':
          const dB = 20 * Math.log10(amplitude + 0.0001); // Avoid log(0)
          size = this.config.baseSize * Math.pow(10, dB / 40);
          break;
        case 'exponential':
          size = this.config.baseSize * Math.exp(amplitude * this.config.scaleFactor);
          break;
        default:
          size = this.config.baseSize;
      }

      // Clamp to max size
      size = Math.min(size, this.config.maxSize);
      sizes.push(size);
    }

    return sizes;
  }

  updateConfig(config: SizeMappingConfig): void {
    this.config = config;
  }
}

/**
 * Beat to Trigger Mapper
 */
export class BeatTriggerMapper {
  private config: TriggerMappingConfig;
  private lastTriggerTime: number = 0;

  constructor(config: TriggerMappingConfig) {
    this.config = config;
  }

  createTriggers(beat: BeatEvent): Trigger[] {
    const triggers: Trigger[] = [];
    const now = beat.timestamp;

    // Check cooldown
    if (now - this.lastTriggerTime < this.config.cooldownMs) {
      return triggers;
    }

    // Check sensitivity threshold
    if (beat.confidence >= this.config.beatSensitivity) {
      triggers.push({
        type: 'beat',
        intensity: beat.energy,
        timestamp: now
      });

      this.lastTriggerTime = now;
    }

    return triggers;
  }

  updateConfig(config: TriggerMappingConfig): void {
    this.config = config;
  }
}

/**
 * Rhythm to Pattern Mapper
 */
export class RhythmPatternMapper {
  private config: PatternMappingConfig;

  constructor(config: PatternMappingConfig) {
    this.config = config;
  }

  generatePatterns(features: AudioFeatures): Pattern[] {
    if (!this.config.enabled) {
      return [];
    }

    const patterns: Pattern[] = [];

    // Tempo-based radial pattern
    if (features.tempo > 0 && this.config.adaptToRhythm) {
      patterns.push({
        type: 'radial',
        parameters: {
          segments: Math.floor(features.tempo / 10),
          rotation: features.spectralCentroid / 10000,
          radius: features.rmsEnergy * 100
        }
      });
    }

    // Spectral complexity pattern
    if (features.spectralFlux > 0.5) {
      patterns.push({
        type: 'fractal',
        parameters: {
          iterations: Math.floor(this.config.complexity * 5),
          scale: features.spectralFlux,
          angle: features.spectralCentroid / 1000
        }
      });
    }

    return patterns;
  }

  updateConfig(config: PatternMappingConfig): void {
    this.config = config;
  }
}

/**
 * Default configuration
 */
export const defaultMapperConfig: MapperConfig = {
  colorMapping: {
    mode: 'frequency',
    saturationRange: [30, 100],
    lightnessRange: [20, 80],
    hueRotation: 0
  },
  sizeMapping: {
    mode: 'linear',
    baseSize: 10,
    scaleFactor: 50,
    maxSize: 200
  },
  triggerMapping: {
    beatSensitivity: 0.7,
    onsetSensitivity: 0.5,
    cooldownMs: 100
  },
  patternMapping: {
    enabled: true,
    adaptToRhythm: true,
    complexity: 0.5
  }
};

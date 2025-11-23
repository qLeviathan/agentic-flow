/**
 * VideoExporter - Export visualizations to video files
 * Supports MP4 (H.264), WebM (VP9), and GIF formats
 */

export interface VideoExportConfig {
  format: 'mp4' | 'webm' | 'gif';
  width: number;
  height: number;
  frameRate: number;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  duration?: number; // in seconds
  quality?: number; // 1-30 for GIF
}

export interface ExportProgress {
  currentFrame: number;
  totalFrames: number;
  percentage: number;
  estimatedTimeRemaining: number;
  encodedBytes: number;
  status: 'preparing' | 'recording' | 'encoding' | 'complete' | 'error';
  message?: string;
}

export type ExportProgressCallback = (progress: ExportProgress) => void;

/**
 * MP4/WebM Video Exporter using MediaRecorder API
 */
export class VideoExporter {
  private canvas: HTMLCanvasElement;
  private audioSource: HTMLAudioElement | MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private startTime: number = 0;
  private frameCount: number = 0;
  private config: VideoExportConfig;
  private progressCallback: ExportProgressCallback | null = null;
  private progressInterval: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.config = {
      format: 'webm',
      width: 1920,
      height: 1080,
      frameRate: 60
    };
  }

  /**
   * Check if the browser supports the requested format
   */
  static isFormatSupported(format: 'mp4' | 'webm'): boolean {
    const mimeTypes = {
      mp4: [
        'video/mp4;codecs=h264',
        'video/mp4;codecs=avc1',
        'video/mp4'
      ],
      webm: [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
      ]
    };

    return mimeTypes[format].some(mimeType =>
      MediaRecorder.isTypeSupported(mimeType)
    );
  }

  /**
   * Get the best supported MIME type for the format
   */
  private getBestMimeType(format: 'mp4' | 'webm'): string {
    const mimeTypes = {
      mp4: [
        'video/mp4;codecs=h264,aac',
        'video/mp4;codecs=h264',
        'video/mp4;codecs=avc1',
        'video/mp4'
      ],
      webm: [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp8',
        'video/webm'
      ]
    };

    const supportedTypes = mimeTypes[format].filter(mimeType =>
      MediaRecorder.isTypeSupported(mimeType)
    );

    if (supportedTypes.length === 0) {
      throw new Error(`Format ${format} is not supported in this browser`);
    }

    return supportedTypes[0];
  }

  /**
   * Set audio source for export
   */
  setAudioSource(source: HTMLAudioElement | MediaStream): void {
    this.audioSource = source;
  }

  /**
   * Set progress callback
   */
  onProgress(callback: ExportProgressCallback): void {
    this.progressCallback = callback;
  }

  /**
   * Start video export
   */
  async startExport(config: VideoExportConfig): Promise<void> {
    this.config = config;
    this.recordedChunks = [];
    this.frameCount = 0;
    this.startTime = performance.now();

    // Notify progress: preparing
    this.notifyProgress({
      currentFrame: 0,
      totalFrames: config.duration ? config.duration * config.frameRate : 0,
      percentage: 0,
      estimatedTimeRemaining: 0,
      encodedBytes: 0,
      status: 'preparing',
      message: 'Preparing export...'
    });

    // Create canvas stream
    const canvasStream = this.canvas.captureStream(config.frameRate);

    // Combine with audio if available
    let finalStream: MediaStream;

    if (this.audioSource) {
      finalStream = new MediaStream();

      // Add video tracks
      canvasStream.getVideoTracks().forEach(track => {
        finalStream.addTrack(track);
      });

      // Add audio tracks
      if (this.audioSource instanceof MediaStream) {
        this.audioSource.getAudioTracks().forEach(track => {
          finalStream.addTrack(track);
        });
      } else if (this.audioSource instanceof HTMLAudioElement) {
        // Create MediaStreamSource from audio element
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(this.audioSource);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);

        destination.stream.getAudioTracks().forEach(track => {
          finalStream.addTrack(track);
        });
      }
    } else {
      finalStream = canvasStream;
    }

    // Get MIME type
    const mimeType = this.getBestMimeType(config.format);

    // Create MediaRecorder
    const recorderOptions: MediaRecorderOptions = {
      mimeType,
      videoBitsPerSecond: config.videoBitsPerSecond || 5000000,
      audioBitsPerSecond: config.audioBitsPerSecond || 128000
    };

    this.mediaRecorder = new MediaRecorder(finalStream, recorderOptions);

    // Handle data chunks
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
        this.frameCount++;
      }
    };

    // Handle errors
    this.mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      this.notifyProgress({
        currentFrame: this.frameCount,
        totalFrames: config.duration ? config.duration * config.frameRate : 0,
        percentage: 0,
        estimatedTimeRemaining: 0,
        encodedBytes: this.getEncodedBytes(),
        status: 'error',
        message: 'Recording error occurred'
      });
    };

    // Start recording
    this.mediaRecorder.start(100); // Collect chunks every 100ms

    // Notify progress: recording
    this.notifyProgress({
      currentFrame: 0,
      totalFrames: config.duration ? config.duration * config.frameRate : 0,
      percentage: 0,
      estimatedTimeRemaining: config.duration || 0,
      encodedBytes: 0,
      status: 'recording',
      message: 'Recording...'
    });

    // Start progress updates
    this.startProgressUpdates();
  }

  /**
   * Stop export and return video blob
   */
  async stopExport(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        // Stop progress updates
        this.stopProgressUpdates();

        // Notify progress: encoding
        this.notifyProgress({
          currentFrame: this.frameCount,
          totalFrames: this.config.duration ? this.config.duration * this.config.frameRate : 0,
          percentage: 100,
          estimatedTimeRemaining: 0,
          encodedBytes: this.getEncodedBytes(),
          status: 'encoding',
          message: 'Finalizing video...'
        });

        // Create final blob
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder!.mimeType
        });

        // Notify progress: complete
        this.notifyProgress({
          currentFrame: this.frameCount,
          totalFrames: this.config.duration ? this.config.duration * this.config.frameRate : 0,
          percentage: 100,
          estimatedTimeRemaining: 0,
          encodedBytes: blob.size,
          status: 'complete',
          message: 'Export complete'
        });

        this.recordedChunks = [];
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Cancel export
   */
  cancelExport(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    this.stopProgressUpdates();
    this.recordedChunks = [];
  }

  /**
   * Get current export progress
   */
  getProgress(): ExportProgress {
    const elapsed = (performance.now() - this.startTime) / 1000;
    const totalFrames = this.config.duration ? this.config.duration * this.config.frameRate : 0;
    const percentage = totalFrames > 0 ? (this.frameCount / totalFrames) * 100 : 0;

    let estimatedTimeRemaining = 0;
    if (this.frameCount > 0 && totalFrames > 0) {
      const timePerFrame = elapsed / this.frameCount;
      const framesRemaining = totalFrames - this.frameCount;
      estimatedTimeRemaining = framesRemaining * timePerFrame;
    }

    return {
      currentFrame: this.frameCount,
      totalFrames,
      percentage,
      estimatedTimeRemaining,
      encodedBytes: this.getEncodedBytes(),
      status: this.mediaRecorder?.state === 'recording' ? 'recording' : 'preparing'
    };
  }

  /**
   * Start periodic progress updates
   */
  private startProgressUpdates(): void {
    this.progressInterval = window.setInterval(() => {
      if (this.progressCallback) {
        this.progressCallback(this.getProgress());
      }
    }, 500); // Update every 500ms
  }

  /**
   * Stop progress updates
   */
  private stopProgressUpdates(): void {
    if (this.progressInterval !== null) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  /**
   * Get total encoded bytes
   */
  private getEncodedBytes(): number {
    return this.recordedChunks.reduce((sum, chunk) => sum + chunk.size, 0);
  }

  /**
   * Notify progress callback
   */
  private notifyProgress(progress: ExportProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  /**
   * Download video file
   */
  static downloadVideo(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * GIF Exporter (requires gif.js library)
 * This is a separate implementation for GIF export
 */
export class GIFExporter {
  private canvas: HTMLCanvasElement;
  private config: VideoExportConfig;
  private gif: any = null; // gif.js instance
  private progressCallback: ExportProgressCallback | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.config = {
      format: 'gif',
      width: 800,
      height: 600,
      frameRate: 30,
      quality: 10
    };
  }

  /**
   * Check if gif.js is loaded
   */
  static isAvailable(): boolean {
    return typeof (window as any).GIF !== 'undefined';
  }

  /**
   * Set progress callback
   */
  onProgress(callback: ExportProgressCallback): void {
    this.progressCallback = callback;
  }

  /**
   * Start GIF export
   */
  async startExport(config: VideoExportConfig): Promise<void> {
    if (!GIFExporter.isAvailable()) {
      throw new Error('gif.js library not loaded. Include <script src="gif.js"></script>');
    }

    this.config = config;

    // Initialize gif.js
    const GIF = (window as any).GIF;

    this.gif = new GIF({
      workers: 4,
      quality: config.quality || 10,
      width: config.width,
      height: config.height,
      workerScript: '/libs/gif.worker.js',
      repeat: 0, // 0 = loop forever
      transparent: null
    });

    // Progress handler
    this.gif.on('progress', (progress: number) => {
      if (this.progressCallback) {
        this.progressCallback({
          currentFrame: 0,
          totalFrames: 0,
          percentage: progress * 100,
          estimatedTimeRemaining: 0,
          encodedBytes: 0,
          status: 'encoding',
          message: `Encoding GIF: ${Math.round(progress * 100)}%`
        });
      }
    });
  }

  /**
   * Add frame to GIF
   */
  addFrame(delay: number): void {
    if (!this.gif) {
      throw new Error('GIF export not started');
    }

    this.gif.addFrame(this.canvas, {
      delay,
      copy: true
    });
  }

  /**
   * Render and return GIF blob
   */
  async render(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.gif) {
        reject(new Error('GIF export not started'));
        return;
      }

      this.gif.on('finished', (blob: Blob) => {
        if (this.progressCallback) {
          this.progressCallback({
            currentFrame: 0,
            totalFrames: 0,
            percentage: 100,
            estimatedTimeRemaining: 0,
            encodedBytes: blob.size,
            status: 'complete',
            message: 'GIF export complete'
          });
        }

        resolve(blob);
      });

      this.gif.on('error', (error: Error) => {
        reject(error);
      });

      this.gif.render();
    });
  }

  /**
   * Download GIF file
   */
  static downloadGIF(blob: Blob, filename: string): void {
    VideoExporter.downloadVideo(blob, filename);
  }
}

/**
 * Export utility functions
 */
export class ExportUtils {
  /**
   * Calculate optimal bitrate based on resolution and framerate
   */
  static calculateBitrate(width: number, height: number, frameRate: number): number {
    const pixelsPerFrame = width * height;
    const pixelsPerSecond = pixelsPerFrame * frameRate;

    // Rough estimate: 0.1 bits per pixel per second for good quality
    const bitsPerSecond = pixelsPerSecond * 0.1;

    // Clamp to reasonable range
    return Math.max(1000000, Math.min(20000000, bitsPerSecond));
  }

  /**
   * Estimate file size
   */
  static estimateFileSize(
    duration: number,
    videoBitrate: number,
    audioBitrate: number
  ): number {
    const videoBits = duration * videoBitrate;
    const audioBits = duration * audioBitrate;
    const totalBits = videoBits + audioBits;

    return totalBits / 8; // Convert to bytes
  }

  /**
   * Format bytes to human-readable string
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format time to human-readable string
   */
  static formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

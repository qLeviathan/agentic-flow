/**
 * React Hook for Vision Capture System
 *
 * Provides real-time phase space updates and vision capture controls.
 * Integrates with Tauri backend via IPC.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export interface PhaseSpacePoint {
  q: number;
  p: number;
  phi: number;
  psi: number;
  screenX: number;
  screenY: number;
  zeckXSummands: number;
  zeckYSummands: number;
}

export interface OCRConfig {
  pageSegMode: number;
  engineMode: number;
  charWhitelist: string;
  confidenceThreshold: number;
  enablePreprocessing: boolean;
}

export interface CaptureMetrics {
  captureFps: number;
  processingFps: number;
  droppedFrames: number;
  averageCaptureTimeMs: number;
  averageOcrTimeMs: number;
  averageMappingTimeUs: number;
  totalFramesCaptured: number;
  totalFramesProcessed: number;
  captureErrors: number;
  ocrErrors: number;
  mappingErrors: number;
  cacheHitRate: number;
  memoryUsageMb: number;
}

export interface CaptureConfig {
  monitorIndex: number;
  screenWidth: number;
  screenHeight: number;
  ocrConfig: OCRConfig;
}

export interface MonitorInfo {
  index: number;
  name: string;
  width: number;
  height: number;
  isPrimary: boolean;
}

export interface VisionCaptureState {
  sessionId: string | null;
  isCapturing: boolean;
  phaseSpacePoints: PhaseSpacePoint[];
  metrics: CaptureMetrics | null;
  error: string | null;
  monitors: MonitorInfo[];
}

export interface VisionCaptureControls {
  startCapture: (config?: Partial<CaptureConfig>) => Promise<void>;
  stopCapture: () => Promise<void>;
  configureOCR: (config: Partial<OCRConfig>) => Promise<void>;
  getMetrics: () => Promise<CaptureMetrics | null>;
  clearPoints: () => void;
  refreshMonitors: () => Promise<void>;
}

const DEFAULT_OCR_CONFIG: OCRConfig = {
  pageSegMode: 6,
  engineMode: 1,
  charWhitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.$%+-:',
  confidenceThreshold: 70.0,
  enablePreprocessing: true,
};

const DEFAULT_CAPTURE_CONFIG: CaptureConfig = {
  monitorIndex: 0,
  screenWidth: 1920,
  screenHeight: 1080,
  ocrConfig: DEFAULT_OCR_CONFIG,
};

/**
 * useVisionCapture Hook
 *
 * Manages vision capture system lifecycle and real-time phase space streaming.
 *
 * @param maxPoints Maximum number of phase space points to keep in memory
 * @param metricsInterval Interval in ms to fetch metrics (0 = no automatic fetching)
 * @returns [state, controls]
 *
 * @example
 * ```tsx
 * const [state, controls] = useVisionCapture(1000, 1000);
 *
 * // Start capture
 * await controls.startCapture({ monitorIndex: 0 });
 *
 * // Access real-time phase space points
 * state.phaseSpacePoints.forEach(point => {
 *   console.log(`(q=${point.q}, p=${point.p})`);
 * });
 *
 * // Stop capture
 * await controls.stopCapture();
 * ```
 */
export function useVisionCapture(
  maxPoints: number = 1000,
  metricsInterval: number = 1000
): [VisionCaptureState, VisionCaptureControls] {
  const [state, setState] = useState<VisionCaptureState>({
    sessionId: null,
    isCapturing: false,
    phaseSpacePoints: [],
    metrics: null,
    error: null,
    monitors: [],
  });

  const unlistenRef = useRef<UnlistenFn | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch available monitors on mount
  useEffect(() => {
    refreshMonitors();
  }, []);

  // Setup event listeners for phase space updates
  useEffect(() => {
    if (state.isCapturing) {
      setupEventListeners();
    }

    return () => {
      cleanupEventListeners();
    };
  }, [state.isCapturing]);

  // Setup metrics polling
  useEffect(() => {
    if (state.isCapturing && metricsInterval > 0) {
      metricsIntervalRef.current = setInterval(() => {
        getMetrics();
      }, metricsInterval);
    }

    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
        metricsIntervalRef.current = null;
      }
    };
  }, [state.isCapturing, metricsInterval]);

  const setupEventListeners = async () => {
    try {
      // Listen for phase space updates
      const unlisten = await listen<PhaseSpacePoint>('phase_space_update', (event) => {
        setState((prev) => {
          const newPoints = [...prev.phaseSpacePoints, event.payload];

          // Keep only the latest maxPoints
          if (newPoints.length > maxPoints) {
            newPoints.shift();
          }

          return {
            ...prev,
            phaseSpacePoints: newPoints,
          };
        });
      });

      unlistenRef.current = unlisten;

      // Listen for errors
      await listen<string>('vision_error', (event) => {
        setState((prev) => ({
          ...prev,
          error: event.payload,
          isCapturing: false,
        }));
      });
    } catch (error) {
      console.error('Failed to setup event listeners:', error);
      setState((prev) => ({
        ...prev,
        error: String(error),
      }));
    }
  };

  const cleanupEventListeners = () => {
    if (unlistenRef.current) {
      unlistenRef.current();
      unlistenRef.current = null;
    }
  };

  const startCapture = useCallback(async (config?: Partial<CaptureConfig>) => {
    try {
      const fullConfig: CaptureConfig = {
        ...DEFAULT_CAPTURE_CONFIG,
        ...config,
        ocrConfig: {
          ...DEFAULT_OCR_CONFIG,
          ...config?.ocrConfig,
        },
      };

      const sessionId = await invoke<string>('start_vision_capture', { config: fullConfig });

      setState((prev) => ({
        ...prev,
        sessionId,
        isCapturing: true,
        error: null,
        phaseSpacePoints: [],
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: String(error),
        isCapturing: false,
      }));
      throw error;
    }
  }, []);

  const stopCapture = useCallback(async () => {
    if (!state.sessionId) {
      return;
    }

    try {
      await invoke('stop_vision_capture', { sessionId: state.sessionId });

      setState((prev) => ({
        ...prev,
        sessionId: null,
        isCapturing: false,
      }));

      cleanupEventListeners();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: String(error),
      }));
      throw error;
    }
  }, [state.sessionId]);

  const configureOCR = useCallback(async (config: Partial<OCRConfig>) => {
    if (!state.sessionId) {
      throw new Error('No active capture session');
    }

    try {
      const fullConfig: OCRConfig = {
        ...DEFAULT_OCR_CONFIG,
        ...config,
      };

      await invoke('configure_ocr', {
        sessionId: state.sessionId,
        config: fullConfig,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: String(error),
      }));
      throw error;
    }
  }, [state.sessionId]);

  const getMetrics = useCallback(async (): Promise<CaptureMetrics | null> => {
    if (!state.sessionId) {
      return null;
    }

    try {
      const metrics = await invoke<CaptureMetrics>('get_capture_metrics', {
        sessionId: state.sessionId,
      });

      setState((prev) => ({
        ...prev,
        metrics,
      }));

      return metrics;
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      return null;
    }
  }, [state.sessionId]);

  const clearPoints = useCallback(() => {
    setState((prev) => ({
      ...prev,
      phaseSpacePoints: [],
    }));
  }, []);

  const refreshMonitors = useCallback(async () => {
    try {
      const monitors = await invoke<MonitorInfo[]>('get_monitors');
      setState((prev) => ({
        ...prev,
        monitors,
      }));
    } catch (error) {
      console.error('Failed to fetch monitors:', error);
    }
  }, []);

  const controls: VisionCaptureControls = {
    startCapture,
    stopCapture,
    configureOCR,
    getMetrics,
    clearPoints,
    refreshMonitors,
  };

  return [state, controls];
}

/**
 * Helper hook for phase space visualization
 *
 * Provides normalized coordinates for rendering phase space points.
 *
 * @param points Array of phase space points
 * @param bounds Visualization bounds { minQ, maxQ, minP, maxP }
 * @returns Normalized points for rendering
 */
export function usePhaseSpaceVisualization(
  points: PhaseSpacePoint[],
  bounds?: { minQ: number; maxQ: number; minP: number; maxP: number }
) {
  return useState(() => {
    if (!bounds) {
      // Auto-calculate bounds
      const qs = points.map(p => p.q);
      const ps = points.map(p => p.p);

      bounds = {
        minQ: Math.min(...qs),
        maxQ: Math.max(...qs),
        minP: Math.min(...ps),
        maxP: Math.max(...ps),
      };
    }

    return points.map(point => ({
      ...point,
      normalizedQ: (point.q - bounds!.minQ) / (bounds!.maxQ - bounds!.minQ),
      normalizedP: (point.p - bounds!.minP) / (bounds!.maxP - bounds!.minP),
      normalizedPhi: point.phi,
      normalizedPsi: point.psi,
    }));
  });
}

export default useVisionCapture;

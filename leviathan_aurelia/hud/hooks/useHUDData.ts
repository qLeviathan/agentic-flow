/**
 * Custom Hook for AURELIA HUD Data Management
 *
 * Provides real-time HUD data with WebSocket support,
 * automatic reconnection, error handling, and optimistic updates.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import type {
  HUDData,
  HUDUpdateEvent,
  HUDError,
  HUDConfig,
} from '../types/hud-types';

interface UseHUDDataOptions {
  /** Update interval in milliseconds */
  updateInterval?: number;

  /** Enable WebSocket streaming */
  enableWebSocket?: boolean;

  /** WebSocket URL */
  wsUrl?: string;

  /** Auto-reconnect on WebSocket disconnect */
  autoReconnect?: boolean;

  /** Max reconnection attempts */
  maxReconnectAttempts?: number;

  /** Error callback */
  onError?: (error: HUDError) => void;

  /** Data update callback */
  onDataUpdate?: (data: HUDData) => void;

  /** Connection status callback */
  onConnectionChange?: (connected: boolean) => void;
}

interface UseHUDDataReturn {
  /** Current HUD data */
  data: HUDData | null;

  /** Loading state */
  loading: boolean;

  /** Error state */
  error: HUDError | null;

  /** WebSocket connection status */
  connected: boolean;

  /** Manually refresh data */
  refresh: () => Promise<void>;

  /** Clear error state */
  clearError: () => void;

  /** Reconnect WebSocket */
  reconnect: () => void;

  /** Update specific metric */
  updateMetric: <K extends keyof HUDData>(key: K, value: Partial<HUDData[K]>) => void;
}

export const useHUDData = (options: UseHUDDataOptions = {}): UseHUDDataReturn => {
  const {
    updateInterval = 1000,
    enableWebSocket = true,
    wsUrl = 'ws://localhost:3001/hud-stream',
    autoReconnect = true,
    maxReconnectAttempts = 5,
    onError,
    onDataUpdate,
    onConnectionChange,
  } = options;

  // State
  const [data, setData] = useState<HUDData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<HUDError | null>(null);
  const [connected, setConnected] = useState(false);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ==================== Data Fetching ====================

  const fetchHUDData = useCallback(async (): Promise<HUDData | null> => {
    try {
      const result = await invoke<HUDData>('get_hud_data');
      return result;
    } catch (err: any) {
      const hudError: HUDError = {
        code: 'FETCH_ERROR',
        message: err.message || 'Failed to fetch HUD data',
        details: err,
        timestamp: Date.now(),
      };
      throw hudError;
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchHUDData();

      if (result) {
        setData(result);
        setError(null);

        if (onDataUpdate) {
          onDataUpdate(result);
        }
      }
    } catch (err: any) {
      setError(err);

      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchHUDData, onDataUpdate, onError]);

  // ==================== WebSocket Management ====================

  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const update: HUDUpdateEvent = JSON.parse(event.data);

      setData((prevData) => {
        if (!prevData) return update.data as HUDData;

        // Merge partial updates
        if (update.type === 'partial') {
          return {
            ...prevData,
            ...update.data,
            timestamp: update.timestamp,
          };
        }

        // Full update
        if (update.type === 'full') {
          return update.data as HUDData;
        }

        // Specific panel update
        return {
          ...prevData,
          ...update.data,
          timestamp: update.timestamp,
        };
      });

      setError(null);

      if (onDataUpdate && update.data) {
        onDataUpdate(update.data as HUDData);
      }
    } catch (err: any) {
      console.error('Failed to parse WebSocket message:', err);

      const hudError: HUDError = {
        code: 'WS_PARSE_ERROR',
        message: 'Failed to parse WebSocket message',
        details: err,
        timestamp: Date.now(),
      };

      setError(hudError);

      if (onError) {
        onError(hudError);
      }
    }
  }, [onDataUpdate, onError]);

  const connectWebSocket = useCallback(() => {
    if (!enableWebSocket) return;

    try {
      console.log(`Connecting to WebSocket: ${wsUrl}`);

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✓ HUD WebSocket connected');
        setConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        if (onConnectionChange) {
          onConnectionChange(true);
        }
      };

      ws.onmessage = handleWebSocketMessage;

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);

        const hudError: HUDError = {
          code: 'WS_ERROR',
          message: 'WebSocket connection error',
          details: event,
          timestamp: Date.now(),
        };

        setError(hudError);

        if (onError) {
          onError(hudError);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        wsRef.current = null;

        if (onConnectionChange) {
          onConnectionChange(false);
        }

        // Auto-reconnect
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);

          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('Max reconnection attempts reached, falling back to polling');

          // Fallback to polling
          pollIntervalRef.current = setInterval(refresh, updateInterval);
        }
      };

      wsRef.current = ws;
    } catch (err: any) {
      console.error('Failed to connect WebSocket:', err);

      const hudError: HUDError = {
        code: 'WS_CONNECT_ERROR',
        message: 'Failed to establish WebSocket connection',
        details: err,
        timestamp: Date.now(),
      };

      setError(hudError);

      if (onError) {
        onError(hudError);
      }

      // Fallback to polling
      pollIntervalRef.current = setInterval(refresh, updateInterval);
    }
  }, [
    enableWebSocket,
    wsUrl,
    autoReconnect,
    maxReconnectAttempts,
    handleWebSocketMessage,
    onConnectionChange,
    onError,
    refresh,
    updateInterval,
  ]);

  const reconnect = useCallback(() => {
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Reset reconnect attempts
    reconnectAttemptsRef.current = 0;

    // Reconnect
    connectWebSocket();
  }, [connectWebSocket]);

  // ==================== Optimistic Updates ====================

  const updateMetric = useCallback(<K extends keyof HUDData>(
    key: K,
    value: Partial<HUDData[K]>
  ) => {
    setData((prevData) => {
      if (!prevData) return null;

      return {
        ...prevData,
        [key]: {
          ...prevData[key],
          ...value,
        },
        timestamp: Date.now(),
      };
    });
  }, []);

  // ==================== Error Handling ====================

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ==================== Lifecycle ====================

  useEffect(() => {
    // Initial data fetch
    refresh();

    // Setup WebSocket or polling
    if (enableWebSocket) {
      connectWebSocket();
    } else {
      pollIntervalRef.current = setInterval(refresh, updateInterval);
    }

    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [refresh, connectWebSocket, enableWebSocket, updateInterval]);

  // ==================== Return ====================

  return {
    data,
    loading,
    error,
    connected,
    refresh,
    clearError,
    reconnect,
    updateMetric,
  };
};

export default useHUDData;

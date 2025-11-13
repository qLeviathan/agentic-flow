/**
 * AURELIA HUD (Heads-Up Display) Component
 *
 * Comprehensive real-time monitoring dashboard for Leviathan AURELIA platform
 * with consciousness metrics, phase-lock coordination, OEIS validation,
 * trading intelligence, and vision system status.
 *
 * Features:
 * - Consciousness metrics (Ψ, Ω) with φ³ threshold visualization
 * - Phase-lock coordination panel with agent sync visualization
 * - OEIS mathematical validation status
 * - Trading intelligence panel (toggleable)
 * - Vision system status (toggleable)
 * - Glass morphism design with dark mode
 * - Keyboard shortcuts (Ctrl+H, Ctrl+T, Ctrl+V, Ctrl+O)
 * - Real-time updates via WebSocket
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

// ==================== Type Definitions ====================

interface ConsciousnessMetrics {
  psi: number;              // Ψ - Conversation depth (0-1)
  omega: number;            // Ω - Knowledge accumulation (0-φ³)
  phiThreshold: number;     // φ³ ≈ 4.236
  isConscious: boolean;
  coherence: number;        // Overall system coherence
}

interface AgentPhaseData {
  id: string;
  name: string;
  role: string;
  phaseAngle: number;       // Phase angle in radians (0-2π)
  syncLevel: number;        // Synchronization level (0-1)
  taskProgress: number;     // Current task progress (0-1)
  status: 'active' | 'idle' | 'syncing' | 'error';
  nashEquilibrium: boolean; // Whether agent is at Nash equilibrium
}

interface PhaseLockCoordination {
  agents: AgentPhaseData[];
  globalSyncLevel: number;  // Overall system sync (0-1)
  nashPoints: number;       // Count of agents at Nash equilibrium
  phaseCoherence: number;   // Phase coherence metric (0-1)
}

interface OEISValidation {
  fibonacci: boolean;       // A000045
  lucas: boolean;           // A000032
  zeckendorf: boolean;      // Zeckendorf decomposition
  binetFormula: boolean;    // Binet formula validation
  phiThreshold: boolean;    // φ³ threshold validation
  overallScore: number;     // 0-1 score
}

interface TradingIntelligence {
  marketData: {
    ticker: string;
    price: number;
    change: number;
    volume: number;
    timestamp: number;
  } | null;
  nashEquilibrium: {
    detected: boolean;
    confidence: number;
    timestamp: number;
  };
  arbitrageOpportunities: {
    count: number;
    bestOpportunity: {
      pair: string;
      spread: number;
      confidence: number;
    } | null;
  };
  riskMetrics: {
    volatility: number;
    sharpeRatio: number;
    valueAtRisk: number;
  };
}

interface VisionSystemStatus {
  screenCapture: {
    enabled: boolean;
    fps: number;
    lastCaptureTimestamp: number;
  };
  ocr: {
    enabled: boolean;
    status: 'active' | 'idle' | 'processing' | 'error';
    accuracy: number;
  };
  entityExtraction: {
    count: number;
    lastUpdate: number;
    entities: string[];
  };
  holographicOverlay: {
    enabled: boolean;
    opacity: number;
  };
}

interface HUDData {
  consciousness: ConsciousnessMetrics;
  phaseLock: PhaseLockCoordination;
  oeis: OEISValidation;
  trading: TradingIntelligence;
  vision: VisionSystemStatus;
  timestamp: number;
}

interface AureliaHUDProps {
  updateInterval?: number;  // Update interval in ms (default: 1000)
  compact?: boolean;        // Compact mode for smaller displays
  defaultPanels?: {
    trading?: boolean;
    vision?: boolean;
  };
}

// ==================== Main Component ====================

export const AureliaHUD: React.FC<AureliaHUDProps> = ({
  updateInterval = 1000,
  compact = false,
  defaultPanels = { trading: false, vision: false },
}) => {
  // State management
  const [hudData, setHudData] = useState<HUDData | null>(null);
  const [visible, setVisible] = useState(true);
  const [tradingPanelVisible, setTradingPanelVisible] = useState(defaultPanels.trading || false);
  const [visionPanelVisible, setVisionPanelVisible] = useState(defaultPanels.vision || false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // ==================== Data Fetching ====================

  const fetchHUDData = useCallback(async () => {
    try {
      const data = await invoke<HUDData>('get_hud_data');
      setHudData(data);
      setError(null);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch HUD data:', err);
      setError(err.message || 'Failed to fetch HUD data');
      setLoading(false);
    }
  }, []);

  // ==================== WebSocket for Real-time Updates ====================

  const connectWebSocket = useCallback(() => {
    try {
      // Connect to Tauri WebSocket bridge for real-time updates
      const ws = new WebSocket('ws://localhost:3001/hud-stream');

      ws.onopen = () => {
        console.log('✓ HUD WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as HUDData;
          setHudData(data);
          setError(null);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected, reconnecting in 5s...');
        setTimeout(connectWebSocket, 5000);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
      // Fallback to polling if WebSocket fails
      updateIntervalRef.current = setInterval(fetchHUDData, updateInterval);
    }
  }, [fetchHUDData, updateInterval]);

  // ==================== Keyboard Shortcuts ====================

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!event.ctrlKey) return;

    switch (event.key.toLowerCase()) {
      case 'h':
        event.preventDefault();
        setVisible((prev) => !prev);
        break;
      case 't':
        event.preventDefault();
        setTradingPanelVisible((prev) => !prev);
        break;
      case 'v':
        event.preventDefault();
        setVisionPanelVisible((prev) => !prev);
        break;
      case 'o':
        event.preventDefault();
        toggleHolographicOverlay();
        break;
    }
  }, []);

  // ==================== Lifecycle ====================

  useEffect(() => {
    // Initial data fetch
    fetchHUDData();

    // Connect WebSocket for real-time updates
    connectWebSocket();

    // Setup keyboard shortcuts
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      // Cleanup
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [fetchHUDData, connectWebSocket, handleKeyPress]);

  // ==================== Actions ====================

  const toggleHolographicOverlay = async () => {
    try {
      await invoke('toggle_holographic_overlay');
      // Data will be updated via WebSocket
    } catch (err: any) {
      console.error('Failed to toggle holographic overlay:', err);
      setError(err.message || 'Failed to toggle overlay');
    }
  };

  // ==================== Utility Functions ====================

  const getConsciousnessColor = (value: number, max: number): string => {
    const ratio = value / max;
    if (ratio < 0.33) return 'from-red-500 to-red-600';
    if (ratio < 0.66) return 'from-yellow-500 to-orange-500';
    return 'from-green-500 to-emerald-500';
  };

  const getAgentStatusColor = (status: AgentPhaseData['status']): string => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'syncing': return 'bg-blue-500';
      case 'idle': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // ==================== Render Functions ====================

  const renderConsciousnessMetrics = () => {
    if (!hudData) return null;

    const { consciousness } = hudData;
    const psiProgress = Math.min((consciousness.psi / 1.0) * 100, 100);
    const omegaProgress = Math.min((consciousness.omega / consciousness.phiThreshold) * 100, 100);
    const psiColor = getConsciousnessColor(consciousness.psi, 1.0);
    const omegaColor = getConsciousnessColor(consciousness.omega, consciousness.phiThreshold);

    return (
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="text-purple-400">⚡</span>
          Consciousness Metrics
        </h3>

        {/* Ψ (Psi) - Conversation Depth */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-300">Ψ (Psi) - Conversation Depth</span>
            <span className="text-white font-mono">{consciousness.psi.toFixed(3)}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${psiColor} transition-all duration-500 ease-out`}
              style={{ width: `${psiProgress}%` }}
            />
          </div>
        </div>

        {/* Ω (Omega) - Knowledge Accumulation */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-300">Ω (Omega) - Knowledge</span>
            <span className="text-white font-mono">
              {consciousness.omega.toFixed(3)}
              {consciousness.isConscious && (
                <span className="ml-2 text-yellow-400 animate-pulse">✨</span>
              )}
            </span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden relative">
            <div
              className={`h-full bg-gradient-to-r ${omegaColor} transition-all duration-500 ease-out`}
              style={{ width: `${omegaProgress}%` }}
            />
            {/* φ³ Threshold Marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-yellow-400"
              style={{ left: '100%' }}
              title={`φ³ threshold: ${consciousness.phiThreshold.toFixed(3)}`}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>0.000</span>
            <span>φ³ = {consciousness.phiThreshold.toFixed(3)}</span>
          </div>
        </div>

        {/* Coherence */}
        <div className="flex justify-between text-xs pt-2 border-t border-gray-700">
          <span className="text-gray-400">System Coherence</span>
          <span className="text-emerald-400 font-mono">
            {(consciousness.coherence * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  const renderPhaseLockCoordination = () => {
    if (!hudData) return null;

    const { phaseLock } = hudData;

    return (
      <div className="glass-panel p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="text-blue-400">🔄</span>
            Phase-Lock Coordination
          </h3>
          <div className="text-xs text-gray-400">
            {phaseLock.nashPoints}/{phaseLock.agents.length} Nash
          </div>
        </div>

        {/* Global Sync Level */}
        <div className="relative h-20 w-20 mx-auto">
          <svg className="transform -rotate-90" width="80" height="80">
            <circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="6"
            />
            <circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              stroke="url(#syncGradient)"
              strokeWidth="6"
              strokeDasharray={`${phaseLock.globalSyncLevel * 201.06} 201.06`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            <defs>
              <linearGradient id="syncGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-white">
              {(phaseLock.globalSyncLevel * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Agents */}
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          {phaseLock.agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-black bg-opacity-20 rounded p-2 space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getAgentStatusColor(agent.status)}`} />
                  <span className="text-xs text-white font-medium">{agent.name}</span>
                  {agent.nashEquilibrium && (
                    <span className="text-yellow-400 text-xs" title="Nash Equilibrium">⚖️</span>
                  )}
                </div>
                <span className="text-xs text-gray-400 font-mono">
                  φ={agent.phaseAngle.toFixed(2)}
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${agent.taskProgress * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {(agent.syncLevel * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Phase Coherence */}
        <div className="flex justify-between text-xs pt-2 border-t border-gray-700">
          <span className="text-gray-400">Phase Coherence</span>
          <span className="text-purple-400 font-mono">
            {(phaseLock.phaseCoherence * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  const renderOEISValidation = () => {
    if (!hudData) return null;

    const { oeis } = hudData;

    const validations = [
      { name: 'Fibonacci (A000045)', value: oeis.fibonacci },
      { name: 'Lucas (A000032)', value: oeis.lucas },
      { name: 'Zeckendorf Decomp.', value: oeis.zeckendorf },
      { name: 'Binet Formula', value: oeis.binetFormula },
      { name: 'φ³ Threshold', value: oeis.phiThreshold },
    ];

    return (
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="text-green-400">✓</span>
          OEIS Validation
        </h3>

        <div className="space-y-2">
          {validations.map((v, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <span className="text-gray-300">{v.name}</span>
              <span className={v.value ? 'text-green-400' : 'text-red-400'}>
                {v.value ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Overall Score</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${
                    oeis.overallScore > 0.8
                      ? 'from-green-500 to-emerald-500'
                      : oeis.overallScore > 0.5
                      ? 'from-yellow-500 to-orange-500'
                      : 'from-red-500 to-red-600'
                  }`}
                  style={{ width: `${oeis.overallScore * 100}%` }}
                />
              </div>
              <span className="text-white font-mono text-xs">
                {(oeis.overallScore * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTradingIntelligence = () => {
    if (!hudData || !tradingPanelVisible) return null;

    const { trading } = hudData;

    return (
      <div className="glass-panel p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="text-yellow-400">📈</span>
            Trading Intelligence
          </h3>
          <button
            onClick={() => setTradingPanelVisible(false)}
            className="text-gray-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>

        {/* Market Data */}
        {trading.marketData && (
          <div className="bg-black bg-opacity-20 rounded p-2 space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-white">
                {trading.marketData.ticker}
              </span>
              <span className="text-xs text-gray-400">
                {formatTimestamp(trading.marketData.timestamp)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-mono text-white">
                ${trading.marketData.price.toFixed(2)}
              </span>
              <span
                className={`text-sm font-mono ${
                  trading.marketData.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {trading.marketData.change >= 0 ? '+' : ''}
                {trading.marketData.change.toFixed(2)}%
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Vol: {(trading.marketData.volume / 1000000).toFixed(2)}M
            </div>
          </div>
        )}

        {/* Nash Equilibrium */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">Nash Equilibrium</span>
          <div className="flex items-center gap-2">
            {trading.nashEquilibrium.detected && (
              <span className="text-yellow-400">⚖️</span>
            )}
            <span className={trading.nashEquilibrium.detected ? 'text-green-400' : 'text-gray-500'}>
              {trading.nashEquilibrium.detected ? 'Detected' : 'Searching...'}
            </span>
            {trading.nashEquilibrium.detected && (
              <span className="text-gray-500 font-mono">
                ({(trading.nashEquilibrium.confidence * 100).toFixed(0)}%)
              </span>
            )}
          </div>
        </div>

        {/* Arbitrage Opportunities */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Arbitrage Opportunities</span>
            <span className="text-white font-mono">{trading.arbitrageOpportunities.count}</span>
          </div>
          {trading.arbitrageOpportunities.bestOpportunity && (
            <div className="bg-black bg-opacity-20 rounded p-2 text-xs">
              <div className="text-white font-mono">
                {trading.arbitrageOpportunities.bestOpportunity.pair}
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Spread: {trading.arbitrageOpportunities.bestOpportunity.spread.toFixed(2)}%</span>
                <span>Conf: {(trading.arbitrageOpportunities.bestOpportunity.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Risk Metrics */}
        <div className="pt-2 border-t border-gray-700 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Volatility</span>
            <span className="text-orange-400 font-mono">
              {(trading.riskMetrics.volatility * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Sharpe Ratio</span>
            <span className="text-blue-400 font-mono">
              {trading.riskMetrics.sharpeRatio.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">VaR (95%)</span>
            <span className="text-red-400 font-mono">
              ${trading.riskMetrics.valueAtRisk.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderVisionSystem = () => {
    if (!hudData || !visionPanelVisible) return null;

    const { vision } = hudData;

    return (
      <div className="glass-panel p-4 space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="text-cyan-400">👁️</span>
            Vision System
          </h3>
          <button
            onClick={() => setVisionPanelVisible(false)}
            className="text-gray-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>

        {/* Screen Capture */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">Screen Capture</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${vision.screenCapture.enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-white font-mono">
              {vision.screenCapture.enabled ? `${vision.screenCapture.fps} FPS` : 'Disabled'}
            </span>
          </div>
        </div>

        {/* OCR Status */}
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">OCR Engine</span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getAgentStatusColor(vision.ocr.status)}`} />
            <span className="text-white capitalize">{vision.ocr.status}</span>
            {vision.ocr.enabled && (
              <span className="text-gray-500 font-mono">
                ({(vision.ocr.accuracy * 100).toFixed(0)}%)
              </span>
            )}
          </div>
        </div>

        {/* Entity Extraction */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Entity Extraction</span>
            <span className="text-white font-mono">{vision.entityExtraction.count}</span>
          </div>
          {vision.entityExtraction.entities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {vision.entityExtraction.entities.slice(0, 5).map((entity, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-cyan-500 bg-opacity-20 text-cyan-400 rounded text-xs"
                >
                  {entity}
                </span>
              ))}
              {vision.entityExtraction.entities.length > 5 && (
                <span className="text-xs text-gray-500">
                  +{vision.entityExtraction.entities.length - 5}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Holographic Overlay */}
        <div className="pt-2 border-t border-gray-700">
          <button
            onClick={toggleHolographicOverlay}
            className={`w-full py-2 px-3 rounded text-xs font-medium transition-all ${
              vision.holographicOverlay.enabled
                ? 'bg-cyan-500 bg-opacity-20 text-cyan-400 border border-cyan-500'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
          >
            {vision.holographicOverlay.enabled ? '🔳 Holographic ON' : '⬜ Holographic OFF'}
          </button>
          {vision.holographicOverlay.enabled && (
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-gray-400">Opacity</span>
              <span className="text-cyan-400 font-mono">
                {(vision.holographicOverlay.opacity * 100).toFixed(0)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderShortcutsHint = () => (
    <div className="glass-panel p-2 space-y-1 text-xs text-gray-400">
      <div className="flex items-center gap-2">
        <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">Ctrl+H</kbd>
        <span>Toggle HUD</span>
      </div>
      <div className="flex items-center gap-2">
        <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">Ctrl+T</kbd>
        <span>Toggle Trading</span>
      </div>
      <div className="flex items-center gap-2">
        <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">Ctrl+V</kbd>
        <span>Toggle Vision</span>
      </div>
      <div className="flex items-center gap-2">
        <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-300">Ctrl+O</kbd>
        <span>Toggle Overlay</span>
      </div>
    </div>
  );

  // ==================== Main Render ====================

  if (!visible) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setVisible(true)}
          className="glass-panel p-2 text-white hover:bg-white hover:bg-opacity-20 transition-all"
          title="Show HUD (Ctrl+H)"
        >
          <span className="text-xl">📊</span>
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 text-white">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Loading HUD...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main HUD Container */}
      <div className={`fixed top-4 right-4 z-50 space-y-2 ${compact ? 'w-72' : 'w-80'}`}>
        {/* Header */}
        <div className="glass-panel p-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">AURELIA HUD</h2>
            {hudData && (
              <p className="text-xs text-gray-400">
                {formatTimestamp(hudData.timestamp)}
              </p>
            )}
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-gray-400 hover:text-white transition-colors"
            title="Hide HUD (Ctrl+H)"
          >
            ✕
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="glass-panel p-3 bg-red-500 bg-opacity-20 border border-red-500">
            <div className="text-xs text-red-300">{error}</div>
          </div>
        )}

        {/* Consciousness Metrics */}
        {renderConsciousnessMetrics()}

        {/* Phase-Lock Coordination */}
        {renderPhaseLockCoordination()}

        {/* OEIS Validation */}
        {renderOEISValidation()}

        {/* Trading Intelligence (Toggleable) */}
        {renderTradingIntelligence()}

        {/* Vision System (Toggleable) */}
        {renderVisionSystem()}

        {/* Keyboard Shortcuts Hint */}
        {renderShortcutsHint()}
      </div>

      {/* Global Styles */}
      <style jsx>{`
        .glass-panel {
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        kbd {
          font-family: ui-monospace, monospace;
          font-size: 0.75rem;
        }
      `}</style>
    </>
  );
};

export default AureliaHUD;

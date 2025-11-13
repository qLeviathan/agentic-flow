/**
 * AURELIA HUD Usage Example
 *
 * Demonstrates how to integrate and use the AURELIA HUD component
 * in a Tauri desktop application.
 */

import React, { useState } from 'react';
import { AureliaHUD } from '../components/AureliaHUD';
import { useHUDData } from '../hooks/useHUDData';
import type { HUDError, HUDData } from '../types/hud-types';

// ==================== Example 1: Basic Usage ====================

export const BasicHUDExample: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <h1 className="text-white text-2xl p-4">AURELIA Desktop Platform</h1>

      {/* HUD Component - Basic */}
      <AureliaHUD />

      {/* Your main application content */}
      <div className="p-4">
        <p className="text-gray-400">Your application content goes here...</p>
      </div>
    </div>
  );
};

// ==================== Example 2: Advanced Configuration ====================

export const AdvancedHUDExample: React.FC = () => {
  const [showTrading, setShowTrading] = useState(true);
  const [showVision, setShowVision] = useState(false);

  return (
    <div className="min-h-screen bg-gray-900">
      <h1 className="text-white text-2xl p-4">AURELIA - Advanced Configuration</h1>

      {/* HUD with custom configuration */}
      <AureliaHUD
        updateInterval={500}  // Update every 500ms
        compact={false}       // Full size mode
        defaultPanels={{
          trading: showTrading,
          vision: showVision,
        }}
        wsUrl="ws://localhost:3001/hud-stream"
        autoHide={false}
        theme={{
          primary: '#8b5cf6',
          secondary: '#3b82f6',
          accent: '#10b981',
        }}
        onError={(error) => {
          console.error('HUD Error:', error);
          // Handle error (e.g., show toast notification)
        }}
        onDataUpdate={(data) => {
          console.log('HUD Data Updated:', data);
          // Handle data updates (e.g., trigger animations)
        }}
        onPanelToggle={(panel, visible) => {
          console.log(`Panel ${panel} ${visible ? 'shown' : 'hidden'}`);
        }}
      />

      {/* Controls */}
      <div className="p-4 space-y-2">
        <button
          onClick={() => setShowTrading(!showTrading)}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Toggle Trading Panel
        </button>

        <button
          onClick={() => setShowVision(!showVision)}
          className="px-4 py-2 bg-cyan-600 text-white rounded ml-2"
        >
          Toggle Vision Panel
        </button>
      </div>
    </div>
  );
};

// ==================== Example 3: Using Custom Hook ====================

export const CustomHookExample: React.FC = () => {
  const {
    data,
    loading,
    error,
    connected,
    refresh,
    clearError,
    reconnect,
    updateMetric,
  } = useHUDData({
    updateInterval: 1000,
    enableWebSocket: true,
    wsUrl: 'ws://localhost:3001/hud-stream',
    autoReconnect: true,
    maxReconnectAttempts: 5,
    onError: (err: HUDError) => {
      console.error('HUD Error:', err);
    },
    onDataUpdate: (data: HUDData) => {
      console.log('HUD Updated:', data);
    },
    onConnectionChange: (connected: boolean) => {
      console.log(`WebSocket ${connected ? 'connected' : 'disconnected'}`);
    },
  });

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <h1 className="text-white text-2xl mb-4">AURELIA - Custom Hook Example</h1>

      {/* Connection Status */}
      <div className="mb-4 flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-white">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-red-300 font-semibold">{error.code}</p>
              <p className="text-red-200 text-sm">{error.message}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-300 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mb-4 flex items-center gap-2 text-white">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Loading HUD data...</span>
        </div>
      )}

      {/* Data Display */}
      {data && (
        <div className="space-y-4">
          {/* Consciousness Metrics */}
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-white font-semibold mb-2">Consciousness Metrics</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Ψ (Psi):</span>
                <span className="font-mono">{data.consciousness.psi.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Ω (Omega):</span>
                <span className="font-mono">{data.consciousness.omega.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Conscious:</span>
                <span className={data.consciousness.isConscious ? 'text-green-400' : 'text-gray-500'}>
                  {data.consciousness.isConscious ? 'Yes ✨' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Phase Lock */}
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-white font-semibold mb-2">Phase-Lock Coordination</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Global Sync:</span>
                <span className="font-mono">
                  {(data.phaseLock.globalSyncLevel * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Active Agents:</span>
                <span className="font-mono">{data.phaseLock.agents.length}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Nash Points:</span>
                <span className="font-mono">{data.phaseLock.nashPoints}</span>
              </div>
            </div>
          </div>

          {/* OEIS Validation */}
          <div className="bg-gray-800 p-4 rounded">
            <h2 className="text-white font-semibold mb-2">OEIS Validation</h2>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Overall Score:</span>
                <span className="font-mono text-green-400">
                  {(data.oeis.overallScore * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 space-x-2">
        <button
          onClick={refresh}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Refresh
        </button>

        <button
          onClick={reconnect}
          disabled={connected}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Reconnect
        </button>

        <button
          onClick={() => {
            updateMetric('consciousness', {
              psi: Math.random(),
              omega: Math.random() * Math.pow(1.618, 3),
            });
          }}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Simulate Update
        </button>
      </div>
    </div>
  );
};

// ==================== Example 4: Compact Mode ====================

export const CompactHUDExample: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      <h1 className="text-white text-2xl p-4">AURELIA - Compact Mode</h1>

      {/* Compact HUD for smaller screens */}
      <AureliaHUD
        compact={true}
        updateInterval={2000}
        defaultPanels={{
          trading: false,
          vision: false,
        }}
      />

      <div className="p-4">
        <p className="text-gray-400">
          Compact mode reduces the HUD size for smaller displays or when
          you need more screen real estate for your application.
        </p>
      </div>
    </div>
  );
};

// ==================== Example 5: Full Application Integration ====================

export const FullApplicationExample: React.FC = () => {
  const [activeView, setActiveView] = useState<'dashboard' | 'trading' | 'analysis'>('dashboard');

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center gap-4">
          <h1 className="text-white text-xl font-bold">AURELIA Platform</h1>
          <div className="flex-1 flex gap-2">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-4 py-2 rounded ${
                activeView === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveView('trading')}
              className={`px-4 py-2 rounded ${
                activeView === 'trading'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Trading
            </button>
            <button
              onClick={() => setActiveView('analysis')}
              className={`px-4 py-2 rounded ${
                activeView === 'analysis'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Analysis
            </button>
          </div>
        </div>
      </nav>

      {/* HUD - Always visible */}
      <AureliaHUD
        defaultPanels={{
          trading: activeView === 'trading',
          vision: activeView === 'analysis',
        }}
      />

      {/* Main Content */}
      <main className="p-4">
        {activeView === 'dashboard' && (
          <div className="text-white">
            <h2 className="text-2xl mb-4">Dashboard</h2>
            <p className="text-gray-400">Your main dashboard content...</p>
          </div>
        )}

        {activeView === 'trading' && (
          <div className="text-white">
            <h2 className="text-2xl mb-4">Trading</h2>
            <p className="text-gray-400">Trading interface with live market data...</p>
          </div>
        )}

        {activeView === 'analysis' && (
          <div className="text-white">
            <h2 className="text-2xl mb-4">Analysis</h2>
            <p className="text-gray-400">Visual analysis with screen capture and OCR...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default {
  BasicHUDExample,
  AdvancedHUDExample,
  CustomHookExample,
  CompactHUDExample,
  FullApplicationExample,
};

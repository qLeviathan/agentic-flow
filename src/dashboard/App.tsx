/**
 * Mathematical Framework Dashboard - Main Application
 */

import React, { useState } from 'react';
import { SequencePlot } from './components/SequencePlot';
import { PhaseSpace } from './components/PhaseSpace';
import { DivergencePlot } from './components/DivergencePlot';
import { GameTensor } from './components/GameTensor';
import { NeuralNetwork } from './components/NeuralNetwork';
import { DependencyGraph } from './components/DependencyGraph';
import { useRealtimeComputation } from './hooks/useRealtimeComputation';
import { exportToJSON, exportToCSV } from './utils/calculations';
import type { ComputationParams, DivergenceData, VisualizationTheme } from './types';

const INITIAL_PARAMS: ComputationParams = {
  n: 20,
  maxIterations: 100,
  epsilon: 0.01,
  gameMatrixSize: 3,
  neuralLayers: [3, 5, 3, 1],
};

export const App: React.FC = () => {
  const [theme, setTheme] = useState<VisualizationTheme>('light');
  const [selectedNashPoint, setSelectedNashPoint] = useState<DivergenceData | null>(null);

  const {
    params,
    data,
    isComputing,
    autoUpdate,
    updateN,
    updateParams,
    toggleAutoUpdate,
    reset,
  } = useRealtimeComputation(INITIAL_PARAMS);

  const handleExportJSON = () => {
    const exportData = {
      timestamp: new Date().toISOString(),
      params,
      ...data,
    };
    const json = exportToJSON(exportData);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `framework-data-n${params.n}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = ['n', 'fibonacci', 'lucas', 'phi', 'psi', 'divergence', 'isNashPoint'];
    const csvData = data.sequences.map((seq, i) => ({
      n: seq.n,
      fibonacci: seq.fibonacci,
      lucas: seq.lucas,
      phi: data.phaseSpace[i]?.phi || 0,
      psi: data.phaseSpace[i]?.psi || 0,
      divergence: data.divergence[i]?.value || 0,
      isNashPoint: data.divergence[i]?.isNashPoint || false,
    }));
    const csv = exportToCSV(csvData, headers);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `framework-data-n${params.n}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Mathematical Framework Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Interactive visualization of Fibonacci, Lucas sequences, Nash equilibria, and neural convergence
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
        </header>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* N Slider */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Iterations (n): {params.n}
              </label>
              <input
                type="range"
                min="5"
                max={params.maxIterations}
                value={params.n}
                onChange={e => updateN(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                disabled={autoUpdate}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5</span>
                <span>{params.maxIterations}</span>
              </div>
            </div>

            {/* Max Iterations */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Max Iterations
              </label>
              <input
                type="number"
                min="10"
                max="1000"
                value={params.maxIterations}
                onChange={e =>
                  updateParams({ maxIterations: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Epsilon */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Epsilon (ε)
              </label>
              <input
                type="number"
                min="0.001"
                max="0.1"
                step="0.001"
                value={params.epsilon}
                onChange={e =>
                  updateParams({ epsilon: parseFloat(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-2">
              <button
                onClick={toggleAutoUpdate}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  autoUpdate
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {autoUpdate ? '⏸ Pause' : '▶ Auto Update'}
              </button>
              <button
                onClick={reset}
                className="px-4 py-2 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-semibold transition-colors"
              >
                🔄 Reset
              </button>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleExportJSON}
              className="px-6 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors"
              disabled={isComputing}
            >
              📥 Export JSON
            </button>
            <button
              onClick={handleExportCSV}
              className="px-6 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white font-semibold transition-colors"
              disabled={isComputing}
            >
              📊 Export CSV
            </button>
            {isComputing && (
              <span className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <svg
                  className="animate-spin h-5 w-5 mr-2"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Computing...
              </span>
            )}
          </div>
        </div>

        {/* Visualizations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Row 1 */}
          <SequencePlot data={data.sequences} theme={theme} width={600} height={400} />
          <PhaseSpace data={data.phaseSpace} theme={theme} width={600} height={400} />

          {/* Row 2 */}
          <DivergencePlot
            data={data.divergence}
            theme={theme}
            width={600}
            height={400}
            onNashPointClick={setSelectedNashPoint}
          />
          <GameTensor data={data.gameTensor} theme={theme} width={600} height={400} />

          {/* Row 3 - Full Width */}
          <div className="lg:col-span-2">
            <NeuralNetwork
              data={data.neuralNetwork}
              theme={theme}
              width={1200}
              height={500}
              animate={autoUpdate}
            />
          </div>

          {/* Row 4 - Full Width */}
          <div className="lg:col-span-2">
            <DependencyGraph
              data={data.dependencyGraph}
              theme={theme}
              width={1200}
              height={600}
            />
          </div>
        </div>

        {/* Nash Point Details */}
        {selectedNashPoint && (
          <div className="fixed bottom-8 right-8 bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-md border-2 border-green-500">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Nash Equilibrium Point
              </h3>
              <button
                onClick={() => setSelectedNashPoint(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-600 dark:text-gray-400">Position (n):</span>
                <strong className="ml-2 text-green-600 dark:text-green-400">
                  {selectedNashPoint.n}
                </strong>
              </p>
              <p>
                <span className="text-gray-600 dark:text-gray-400">Divergence S(n):</span>
                <strong className="ml-2">{selectedNashPoint.value.toFixed(6)}</strong>
              </p>
              <p>
                <span className="text-gray-600 dark:text-gray-400">Payoff:</span>
                <strong className="ml-2">
                  {selectedNashPoint.nashPayoff?.toFixed(2) || 'N/A'}
                </strong>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                This point represents a Nash equilibrium where no player can improve their
                outcome by unilaterally changing strategy.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Interactive Mathematical Framework Dashboard • Built with React, TypeScript, D3.js
          </p>
          <p className="mt-2">
            Real-time computation • Fibonacci & Lucas sequences • Nash equilibria • Neural convergence
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;

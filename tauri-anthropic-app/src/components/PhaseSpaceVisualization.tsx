import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion } from 'framer-motion';
import { X, RefreshCw, Download } from 'lucide-react';

interface PhaseSpacePoint {
  phi: number;
  psi: number;
  theta: number;
  magnitude: number;
  isNashPoint: boolean;
}

interface PhaseSpaceData {
  trajectory: PhaseSpacePoint[];
  nashPoints: PhaseSpacePoint[];
  bounds: {
    phiMin: number;
    phiMax: number;
    psiMin: number;
    psiMax: number;
  };
}

interface PhaseSpaceVisualizationProps {
  onClose: () => void;
}

export function PhaseSpaceVisualization({ onClose }: PhaseSpaceVisualizationProps) {
  const [data, setData] = useState<PhaseSpaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNashPoints, setShowNashPoints] = useState(true);
  const [showTrajectory, setShowTrajectory] = useState(true);

  useEffect(() => {
    loadPhaseSpaceData();
  }, []);

  const loadPhaseSpaceData = async () => {
    setIsLoading(true);
    try {
      const phaseData = await invoke<PhaseSpaceData>('get_phase_space_visualization');
      setData(phaseData);
    } catch (error) {
      console.error('Failed to load phase space data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async () => {
    if (!data) return;

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phase-space-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <motion.div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] glass-popup flex items-center justify-center"
        drag
        dragConstraints={{ left: -400, top: -300, right: 400, bottom: 300 }}
        dragMomentum={false}
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 border-4 border-glass-accent border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="glass-text">Loading phase space visualization...</p>
        </div>
      </motion.div>
    );
  }

  if (!data) {
    return (
      <motion.div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] glass-popup flex items-center justify-center"
        drag
        dragConstraints={{ left: -400, top: -300, right: 400, bottom: 300 }}
        dragMomentum={false}
      >
        <div className="text-center">
          <p className="glass-text-muted mb-4">No phase space data available</p>
          <button
            onClick={loadPhaseSpaceData}
            className="px-4 py-2 glass-accent rounded-lg glass-text text-sm hover:scale-105 transition-transform"
          >
            Retry
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] glass-popup flex flex-col"
      drag
      dragConstraints={{ left: -400, top: -300, right: 400, bottom: 300 }}
      dragMomentum={false}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 glass-border-bottom">
        <h3 className="glass-text font-bold">Phase Space Visualization</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={loadPhaseSpaceData}
            className="p-1.5 rounded-lg hover:bg-glass-accent transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-glass-text" />
          </button>
          <button
            onClick={exportData}
            className="p-1.5 rounded-lg hover:bg-glass-accent transition-all"
            title="Export Data"
          >
            <Download className="w-4 h-4 text-glass-text" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-red-500/20 hover:border-red-500/50 transition-all"
            title="Close"
          >
            <X className="w-4 h-4 text-glass-text" />
          </button>
        </div>
      </div>

      {/* SVG Visualization */}
      <div className="flex-1 p-4 overflow-hidden">
        <svg width="100%" height="100%" viewBox="0 0 760 520" className="gpu-accelerated">
          <defs>
            {/* Gradient for trajectory */}
            <linearGradient id="phase-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#440154" />
              <stop offset="50%" stopColor="#20A387" />
              <stop offset="100%" stopColor="#FDE725" />
            </linearGradient>

            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background grid */}
          <g opacity="0.2">
            {Array.from({ length: 10 }).map((_, i) => (
              <g key={i}>
                <line
                  x1={76 * (i + 1)}
                  y1={0}
                  x2={76 * (i + 1)}
                  y2={520}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="1"
                />
                <line
                  x1={0}
                  y1={52 * (i + 1)}
                  x2={760}
                  y2={52 * (i + 1)}
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="1"
                />
              </g>
            ))}
          </g>

          {/* Axes */}
          <g>
            <line x1={20} y1={260} x2={740} y2={260} stroke="rgba(255, 255, 255, 0.4)" strokeWidth="2" />
            <line x1={380} y1={10} x2={380} y2={510} stroke="rgba(255, 255, 255, 0.4)" strokeWidth="2" />
            <text x={730} y={255} className="glass-text-muted text-xs">φ</text>
            <text x={385} y={20} className="glass-text-muted text-xs">ψ</text>
          </g>

          {/* Trajectory path */}
          {showTrajectory && data.trajectory.length > 1 && (
            <path
              d={generatePathFromPoints(data.trajectory, data.bounds)}
              fill="none"
              stroke="url(#phase-gradient)"
              strokeWidth="3"
              opacity="0.8"
              filter="url(#glow)"
            />
          )}

          {/* Trajectory points */}
          {showTrajectory && data.trajectory.map((point, index) => (
            <circle
              key={`traj-${index}`}
              cx={scaleX(point.phi, data.bounds)}
              cy={scaleY(point.psi, data.bounds)}
              r="3"
              fill="#20A387"
              opacity="0.6"
            />
          ))}

          {/* Nash equilibrium points */}
          {showNashPoints && data.nashPoints.map((point, index) => (
            <g key={`nash-${index}`}>
              {/* Outer ring */}
              <circle
                cx={scaleX(point.phi, data.bounds)}
                cy={scaleY(point.psi, data.bounds)}
                r="12"
                fill="none"
                stroke="#ff0000"
                strokeWidth="2"
                opacity="0.6"
              >
                <animate
                  attributeName="r"
                  values="12;16;12"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.6;0.3;0.6"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
              {/* Inner dot */}
              <circle
                cx={scaleX(point.phi, data.bounds)}
                cy={scaleY(point.psi, data.bounds)}
                r="4"
                fill="#ff0000"
                opacity="0.8"
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 glass-border-top flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setShowTrajectory(!showTrajectory)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              showTrajectory ? 'glass-accent' : 'glass-window'
            }`}
          >
            Trajectory
          </button>
          <button
            onClick={() => setShowNashPoints(!showNashPoints)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              showNashPoints ? 'glass-accent' : 'glass-window'
            }`}
          >
            Nash Points
          </button>
        </div>

        <div className="glass-text-muted text-xs">
          Points: {data.trajectory.length} | Nash: {data.nashPoints.length}
        </div>
      </div>
    </motion.div>
  );
}

// Helper: Generate SVG path from points
function generatePathFromPoints(points: PhaseSpacePoint[], bounds: PhaseSpaceData['bounds']): string {
  return points
    .map((p, i) => {
      const x = scaleX(p.phi, bounds);
      const y = scaleY(p.psi, bounds);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

// Helper: Scale X coordinate
function scaleX(value: number, bounds: PhaseSpaceData['bounds']): number {
  const range = bounds.phiMax - bounds.phiMin;
  return ((value - bounds.phiMin) / range) * 720 + 20;
}

// Helper: Scale Y coordinate (inverted for SVG)
function scaleY(value: number, bounds: PhaseSpaceData['bounds']): number {
  const range = bounds.psiMax - bounds.psiMin;
  return 500 - ((value - bounds.psiMin) / range) * 500 + 10;
}

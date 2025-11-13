import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OverlayToggle } from './OverlayToggle';
import { AureliaChat } from './AureliaChat';
import { TickerDisplay } from './TickerDisplay';
import { PhaseSpaceVisualization } from './PhaseSpaceVisualization';
import '../styles/glass-overlay.css';

interface HolographicOverlayProps {
  children?: React.ReactNode;
}

export function HolographicOverlay({ children }: HolographicOverlayProps) {
  const [isActive, setIsActive] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showTicker, setShowTicker] = useState(true);
  const [showPhaseSpace, setShowPhaseSpace] = useState(false);

  // Keyboard shortcut: Ctrl+Shift+O to toggle overlay
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        setIsActive(prev => !prev);
      }

      // Only allow other shortcuts when overlay is active
      if (!isActive) return;

      // Ctrl+Shift+C: Toggle chat
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        setShowChat(prev => !prev);
      }

      // Ctrl+Shift+T: Toggle ticker
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        setShowTicker(prev => !prev);
      }

      // Ctrl+Shift+P: Toggle phase space
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowPhaseSpace(prev => !prev);
      }

      // Escape: Close all windows
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowChat(false);
        setShowPhaseSpace(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive]);

  const handleToggle = () => {
    setIsActive(prev => !prev);
  };

  return (
    <>
      {/* Main application content */}
      <div className={isActive ? 'blur-sm pointer-events-none' : ''}>
        {children}
      </div>

      {/* Overlay toggle button - always visible */}
      <OverlayToggle isActive={isActive} onToggle={handleToggle} />

      {/* Holographic overlay */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="holographic-overlay active"
          >
            {/* Glass background */}
            <div className="glass-background" />

            {/* Ticker Display */}
            <AnimatePresence>
              {showTicker && (
                <motion.div
                  initial={{ y: -100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -100, opacity: 0 }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                >
                  <TickerDisplay />
                </motion.div>
              )}
            </AnimatePresence>

            {/* AURELIA Chat Window */}
            <AnimatePresence>
              {showChat && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 50 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                  <AureliaChat onClose={() => setShowChat(false)} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Phase Space Visualization */}
            <AnimatePresence>
              {showPhaseSpace && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 50 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                >
                  <PhaseSpaceVisualization onClose={() => setShowPhaseSpace(false)} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Control Panel - Floating buttons */}
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-[10001]"
            >
              <ControlButton
                icon="💬"
                label="Chat"
                active={showChat}
                onClick={() => setShowChat(!showChat)}
              />
              <ControlButton
                icon="📊"
                label="Phase Space"
                active={showPhaseSpace}
                onClick={() => setShowPhaseSpace(!showPhaseSpace)}
              />
              <ControlButton
                icon="📈"
                label="Ticker"
                active={showTicker}
                onClick={() => setShowTicker(!showTicker)}
              />
            </motion.div>

            {/* Keyboard shortcuts help */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 glass-window text-glass-text-muted text-xs z-[10001]">
              <span className="font-mono">Ctrl+Shift+O</span> Toggle Overlay •
              <span className="font-mono ml-2">Ctrl+Shift+C</span> Chat •
              <span className="font-mono ml-2">Ctrl+Shift+P</span> Phase Space •
              <span className="font-mono ml-2">ESC</span> Close
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Control button component
interface ControlButtonProps {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}

function ControlButton({ icon, label, active, onClick }: ControlButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`p-3 glass-window group relative ${active ? 'glass-accent' : ''}`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      title={label}
    >
      <div className="text-2xl">{icon}</div>

      {/* Tooltip */}
      <div className="absolute left-full ml-3 px-3 py-1.5 glass-window opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
        <span className="glass-text text-sm font-medium">{label}</span>
      </div>
    </motion.button>
  );
}

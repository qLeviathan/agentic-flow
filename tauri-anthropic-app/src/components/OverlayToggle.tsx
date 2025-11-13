import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

interface OverlayToggleProps {
  isActive: boolean;
  onToggle: () => void;
}

export function OverlayToggle({ isActive, onToggle }: OverlayToggleProps) {
  return (
    <motion.button
      onClick={onToggle}
      className="fixed top-4 right-4 z-[10000] px-6 py-3 glass-window hover:scale-105 transition-transform"
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      title={isActive ? 'Hide Overlay (Ctrl+Shift+O)' : 'Show Overlay (Ctrl+Shift+O)'}
      aria-label={isActive ? 'Hide overlay' : 'Show overlay'}
      aria-pressed={isActive}
      role="switch"
    >
      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Eye className="w-5 h-5 text-glass-accent" />
            </motion.div>
          ) : (
            <motion.div
              key="inactive"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <EyeOff className="w-5 h-5 text-glass-muted" />
            </motion.div>
          )}
        </AnimatePresence>

        <span className="glass-text font-semibold">
          {isActive ? 'OVERLAY ON' : 'OVERLAY OFF'}
        </span>
      </div>

      {/* Pulse effect when active */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-glass-accent"
          animate={{
            opacity: [0.5, 0, 0.5],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.button>
  );
}

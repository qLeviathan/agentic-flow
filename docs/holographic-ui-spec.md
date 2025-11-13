# AURELIA Holographic UI Overlay Specification

## Executive Summary

This document specifies the design and implementation of a holographic glass overlay system for the AURELIA trading platform. The overlay provides a minimalist, high-tech interface featuring real-time stock tickers, AI chat communication, phase space visualizations, and Matrix-style knowledge transfer animations.

**Design Philosophy**: Cold, clean glass aesthetic with high contrast for readability and smooth 60fps animations.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Component Hierarchy](#component-hierarchy)
3. [Glass Overlay System](#glass-overlay-system)
4. [Window Management](#window-management)
5. [Component Specifications](#component-specifications)
6. [TypeScript Interfaces](#typescript-interfaces)
7. [Tauri Backend Commands](#tauri-backend-commands)
8. [Animation System](#animation-system)
9. [Keyboard Shortcuts](#keyboard-shortcuts)
10. [Accessibility](#accessibility)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Desktop Layer                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Holographic Overlay (OFF by default)      │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Control Panel (Toggle, Settings)          │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Chat Window (AURELIA AI)                  │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Ticker Display (Real-time Stock Data)     │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Phase Space Visualization Window          │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Chart/Graph Windows (Pop-up)              │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  Matrix Knowledge Upload Visualization     │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: React 18+ with TypeScript
- **Backend**: Tauri (Rust)
- **Styling**: CSS3 with backdrop-filter, Tailwind CSS
- **Animations**: Framer Motion
- **Charting**: D3.js, Recharts
- **State Management**: Zustand
- **Window Management**: React DnD (drag and drop)

---

## Component Hierarchy

### Root Component Tree

```
<HolographicOverlay>
├── <OverlayContainer>
│   ├── <GlassBackground>
│   ├── <OverlayToggle>           // Global ON/OFF switch
│   ├── <ControlPanel>             // User settings and controls
│   ├── <ChatWindow>               // AURELIA AI chat interface
│   │   ├── <ChatHeader>
│   │   ├── <MessageList>
│   │   ├── <ChatInput>
│   │   └── <StreamingIndicator>
│   ├── <TickerDisplay>            // Real-time stock ticker
│   │   ├── <TickerBar>
│   │   ├── <TickerItem>
│   │   └── <TickerControls>
│   ├── <WindowManager>            // Pop-up window container
│   │   ├── <PhaseSpaceWindow>
│   │   ├── <ChartWindow>
│   │   ├── <GraphWindow>
│   │   └── <WindowControls>      // Drag, resize, minimize
│   └── <MatrixUpload>             // Knowledge upload animation
└── <KeyboardShortcutHandler>
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `HolographicOverlay` | Root container, manages overlay visibility state |
| `OverlayContainer` | Main glass overlay with backdrop-filter effects |
| `OverlayToggle` | Global ON/OFF switch with smooth fade animation |
| `ControlPanel` | User settings, window toggles, theme controls |
| `ChatWindow` | AURELIA AI chat integration, extends existing ChatInterface |
| `TickerDisplay` | Real-time stock ticker with scrolling animation |
| `WindowManager` | Manages multiple draggable, resizable windows |
| `PhaseSpaceWindow` | Embeds phase space visualization from /src/math-framework/ |
| `MatrixUpload` | Matrix-style code rain animation for knowledge transfer |

---

## Glass Overlay System

### Glass Overlay CSS

```css
/* Base glass overlay container */
.holographic-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.holographic-overlay.active {
  opacity: 1;
  pointer-events: auto;
}

/* Glass background effect */
.glass-background {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(20, 30, 48, 0.7) 0%,
    rgba(36, 59, 85, 0.6) 50%,
    rgba(20, 30, 48, 0.7) 100%
  );
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Glass window (for individual components) */
.glass-window {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    rgba(255, 255, 255, 0.02) 100%
  );
  backdrop-filter: blur(20px) saturate(180%) brightness(110%);
  -webkit-backdrop-filter: blur(20px) saturate(180%) brightness(110%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.37),
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-window:hover {
  border-color: rgba(100, 200, 255, 0.3);
  box-shadow:
    0 12px 48px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(100, 200, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

/* Frosted glass effect for popups */
.glass-popup {
  background: rgba(15, 25, 40, 0.85);
  backdrop-filter: blur(32px) saturate(200%);
  -webkit-backdrop-filter: blur(32px) saturate(200%);
  border: 2px solid rgba(100, 200, 255, 0.2);
  border-radius: 20px;
  box-shadow:
    0 24px 64px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(100, 200, 255, 0.15),
    inset 0 2px 0 rgba(255, 255, 255, 0.12),
    inset 0 -2px 0 rgba(0, 0, 0, 0.15);
}

/* Text styling for readability */
.glass-text {
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  font-weight: 500;
  letter-spacing: 0.02em;
}

.glass-text-muted {
  color: rgba(200, 220, 240, 0.7);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
}

/* Accent colors for interactive elements */
.glass-accent {
  background: linear-gradient(
    135deg,
    rgba(100, 200, 255, 0.2) 0%,
    rgba(80, 160, 220, 0.15) 100%
  );
  border: 1px solid rgba(100, 200, 255, 0.3);
}

.glass-accent:hover {
  background: linear-gradient(
    135deg,
    rgba(100, 200, 255, 0.3) 0%,
    rgba(80, 160, 220, 0.25) 100%
  );
  border-color: rgba(100, 200, 255, 0.5);
  box-shadow: 0 0 20px rgba(100, 200, 255, 0.2);
}

/* High contrast borders */
.glass-border-top {
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.glass-border-bottom {
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
}

/* Scrollbar styling */
.glass-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.glass-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.glass-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(100, 200, 255, 0.3);
  border-radius: 4px;
  border: 2px solid rgba(0, 0, 0, 0.1);
}

.glass-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 200, 255, 0.5);
}
```

### Tailwind CSS Configuration

```javascript
// tailwind.config.js - Add to existing config
module.exports = {
  theme: {
    extend: {
      backdropBlur: {
        '4xl': '80px',
      },
      colors: {
        glass: {
          bg: 'rgba(20, 30, 48, 0.7)',
          border: 'rgba(255, 255, 255, 0.12)',
          accent: 'rgba(100, 200, 255, 0.3)',
          text: 'rgba(255, 255, 255, 0.95)',
          muted: 'rgba(200, 220, 240, 0.7)',
        },
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'glass-hover': '0 12px 48px rgba(0, 0, 0, 0.5), 0 0 20px rgba(100, 200, 255, 0.1)',
      },
    },
  },
};
```

---

## Window Management

### Draggable Window System

```typescript
// components/WindowManager/DraggableWindow.tsx
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Minimize2, Maximize2, X, Move } from 'lucide-react';

interface WindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  onClose?: () => void;
  onMinimize?: () => void;
  zIndex?: number;
}

export const DraggableWindow: React.FC<WindowProps> = ({
  id,
  title,
  children,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 600, height: 400 },
  onClose,
  onMinimize,
  zIndex = 1000,
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleMaximize = () => {
    if (isMaximized) {
      setPosition(initialPosition);
      setSize(initialSize);
    } else {
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    setIsMaximized(!isMaximized);
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{ left: 0, top: 0, right: window.innerWidth - size.width, bottom: window.innerHeight - size.height }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      style={{
        position: 'absolute',
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        zIndex,
      }}
      className="glass-popup"
    >
      {/* Window Header */}
      <div
        ref={dragRef}
        className="flex items-center justify-between px-4 py-3 glass-border-bottom cursor-move select-none"
      >
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-glass-muted" />
          <h3 className="glass-text font-semibold">{title}</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onMinimize}
            className="p-1.5 rounded-lg hover:bg-glass-accent transition-all"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4 text-glass-text" />
          </button>
          <button
            onClick={handleMaximize}
            className="p-1.5 rounded-lg hover:bg-glass-accent transition-all"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            <Maximize2 className="w-4 h-4 text-glass-text" />
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

      {/* Window Content */}
      <div className="p-4 overflow-auto glass-scrollbar" style={{ height: 'calc(100% - 56px)' }}>
        {children}
      </div>

      {/* Resize Handle (bottom-right corner) */}
      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize"
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startY = e.clientY;
          const startWidth = size.width;
          const startHeight = size.height;

          const handleMouseMove = (moveEvent: MouseEvent) => {
            const newWidth = startWidth + (moveEvent.clientX - startX);
            const newHeight = startHeight + (moveEvent.clientY - startY);
            setSize({
              width: Math.max(400, Math.min(newWidth, window.innerWidth)),
              height: Math.max(300, Math.min(newHeight, window.innerHeight)),
            });
          };

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      >
        <div className="w-full h-full bg-glass-accent rounded-tl-lg opacity-50 hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  );
};
```

### Window Manager Component

```typescript
// components/WindowManager/WindowManager.tsx
import React, { useState } from 'react';
import { DraggableWindow } from './DraggableWindow';
import { PhaseSpaceWindow } from './PhaseSpaceWindow';
import { ChartWindow } from './ChartWindow';

interface Window {
  id: string;
  type: 'phase-space' | 'chart' | 'graph' | 'custom';
  title: string;
  content?: React.ReactNode;
  isMinimized: boolean;
  zIndex: number;
}

export const WindowManager: React.FC = () => {
  const [windows, setWindows] = useState<Window[]>([]);
  const [maxZIndex, setMaxZIndex] = useState(1000);

  const addWindow = (type: Window['type'], title: string, content?: React.ReactNode) => {
    const newWindow: Window = {
      id: `window-${Date.now()}`,
      type,
      title,
      content,
      isMinimized: false,
      zIndex: maxZIndex + 1,
    };
    setWindows([...windows, newWindow]);
    setMaxZIndex(maxZIndex + 1);
  };

  const closeWindow = (id: string) => {
    setWindows(windows.filter(w => w.id !== id));
  };

  const minimizeWindow = (id: string) => {
    setWindows(windows.map(w =>
      w.id === id ? { ...w, isMinimized: true } : w
    ));
  };

  const restoreWindow = (id: string) => {
    setWindows(windows.map(w =>
      w.id === id ? { ...w, isMinimized: false, zIndex: maxZIndex + 1 } : w
    ));
    setMaxZIndex(maxZIndex + 1);
  };

  const bringToFront = (id: string) => {
    setWindows(windows.map(w =>
      w.id === id ? { ...w, zIndex: maxZIndex + 1 } : w
    ));
    setMaxZIndex(maxZIndex + 1);
  };

  return (
    <>
      {/* Render active windows */}
      {windows.filter(w => !w.isMinimized).map(window => (
        <DraggableWindow
          key={window.id}
          id={window.id}
          title={window.title}
          zIndex={window.zIndex}
          onClose={() => closeWindow(window.id)}
          onMinimize={() => minimizeWindow(window.id)}
        >
          {window.type === 'phase-space' && <PhaseSpaceWindow />}
          {window.type === 'chart' && <ChartWindow />}
          {window.type === 'custom' && window.content}
        </DraggableWindow>
      ))}

      {/* Minimized windows taskbar */}
      {windows.filter(w => w.isMinimized).length > 0 && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 p-2 glass-window">
          {windows.filter(w => w.isMinimized).map(window => (
            <button
              key={window.id}
              onClick={() => restoreWindow(window.id)}
              className="px-4 py-2 glass-accent rounded-lg glass-text text-sm hover:scale-105 transition-transform"
            >
              {window.title}
            </button>
          ))}
        </div>
      )}
    </>
  );
};
```

---

## Component Specifications

### 1. Overlay Toggle Component

```typescript
// components/OverlayToggle.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

interface OverlayToggleProps {
  isActive: boolean;
  onToggle: () => void;
}

export const OverlayToggle: React.FC<OverlayToggleProps> = ({ isActive, onToggle }) => {
  return (
    <motion.button
      onClick={onToggle}
      className="fixed top-4 right-4 z-[10000] px-6 py-3 glass-window hover:scale-105 transition-transform"
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.div
              key="active"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
            >
              <Eye className="w-5 h-5 text-glass-accent" />
            </motion.div>
          ) : (
            <motion.div
              key="inactive"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
            >
              <EyeOff className="w-5 h-5 text-glass-muted" />
            </motion.div>
          )}
        </AnimatePresence>
        <span className="glass-text font-semibold">
          {isActive ? 'OVERLAY ON' : 'OVERLAY OFF'}
        </span>
      </div>
    </motion.button>
  );
};
```

### 2. Ticker Display Component

```typescript
// components/TickerDisplay.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export const TickerDisplay: React.FC = () => {
  const [tickers, setTickers] = useState<TickerData[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Subscribe to real-time ticker updates via Tauri
    const unsubscribe = window.__TAURI__.event.listen('ticker-update', (event: any) => {
      setTickers(event.payload);
    });

    return () => {
      unsubscribe.then(fn => fn());
    };
  }, []);

  return (
    <div
      className="fixed top-20 left-0 right-0 h-16 glass-window overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <motion.div
        className="flex items-center gap-8 h-full px-4"
        animate={{ x: isPaused ? 0 : ['0%', '-100%'] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 60,
            ease: 'linear',
          },
        }}
      >
        {[...tickers, ...tickers].map((ticker, index) => (
          <TickerItem key={`${ticker.symbol}-${index}`} ticker={ticker} />
        ))}
      </motion.div>
    </div>
  );
};

const TickerItem: React.FC<{ ticker: TickerData }> = ({ ticker }) => {
  const isPositive = ticker.change >= 0;

  return (
    <div className="flex items-center gap-3 whitespace-nowrap">
      <span className="glass-text font-bold text-lg">{ticker.symbol}</span>
      <span className="glass-text font-mono text-base">${ticker.price.toFixed(2)}</span>
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span className="font-mono text-sm">
          {isPositive ? '+' : ''}{ticker.change.toFixed(2)} ({ticker.changePercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  );
};
```

### 3. Chat Window Component (Extended)

```typescript
// components/ChatWindow.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { ChatInterface } from './ChatInterface'; // Existing component

export const ChatWindow: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed right-4 top-32 w-96 h-[600px] glass-popup overflow-hidden"
    >
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 glass-border-bottom">
        <div className="p-2 rounded-lg glass-accent">
          <MessageSquare className="w-5 h-5 text-glass-accent" />
        </div>
        <div>
          <h3 className="glass-text font-bold">AURELIA AI</h3>
          <p className="glass-text-muted text-xs">Trading Assistant</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="glass-text-muted text-xs">Online</span>
        </div>
      </div>

      {/* Integrate existing ChatInterface */}
      <div className="h-[calc(100%-60px)]">
        <ChatInterface />
      </div>
    </motion.div>
  );
};
```

### 4. Phase Space Window Component

```typescript
// components/WindowManager/PhaseSpaceWindow.tsx
import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { VisualizationData } from '@/types/phase-space';

export const PhaseSpaceWindow: React.FC = () => {
  const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPhaseSpaceData();
  }, []);

  const loadPhaseSpaceData = async () => {
    try {
      const data = await invoke<VisualizationData>('get_phase_space_visualization');
      setVisualizationData(data);
    } catch (error) {
      console.error('Failed to load phase space data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass-text">Loading phase space...</div>
      </div>
    );
  }

  if (!visualizationData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="glass-text-muted">No data available</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {/* SVG-based phase space visualization */}
      <svg width="100%" height="100%" viewBox="0 0 800 600">
        <defs>
          <linearGradient id="phase-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#440154" />
            <stop offset="50%" stopColor="#20A387" />
            <stop offset="100%" stopColor="#FDE725" />
          </linearGradient>
        </defs>

        {/* Background grid */}
        <g opacity="0.2">
          {Array.from({ length: 10 }).map((_, i) => (
            <React.Fragment key={i}>
              <line
                x1={80 * (i + 1)}
                y1={0}
                x2={80 * (i + 1)}
                y2={600}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1"
              />
              <line
                x1={0}
                y1={60 * (i + 1)}
                x2={800}
                y2={60 * (i + 1)}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1"
              />
            </React.Fragment>
          ))}
        </g>

        {/* Trajectory path */}
        <path
          d={generatePathFromPoints(visualizationData.trajectory.path)}
          fill="none"
          stroke="url(#phase-gradient)"
          strokeWidth="2"
          opacity="0.8"
        />

        {/* Nash points */}
        {visualizationData.nashPoints.map((point, index) => (
          <circle
            key={index}
            cx={scaleX(point.phi, visualizationData.bounds)}
            cy={scaleY(point.psi, visualizationData.bounds)}
            r="8"
            fill="none"
            stroke="#ff0000"
            strokeWidth="2"
            opacity="0.8"
          />
        ))}
      </svg>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex gap-2">
        <button className="px-3 py-2 glass-accent rounded-lg glass-text text-sm">
          Reset View
        </button>
        <button className="px-3 py-2 glass-accent rounded-lg glass-text text-sm">
          Toggle Nash Points
        </button>
        <button className="px-3 py-2 glass-accent rounded-lg glass-text text-sm ml-auto">
          Export Data
        </button>
      </div>
    </div>
  );
};

// Helper functions
const generatePathFromPoints = (points: [number, number][]): string => {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
};

const scaleX = (value: number, bounds: any): number => {
  return ((value - bounds.phiMin) / (bounds.phiMax - bounds.phiMin)) * 760 + 20;
};

const scaleY = (value: number, bounds: any): number => {
  return 580 - ((value - bounds.psiMin) / (bounds.psiMax - bounds.psiMin)) * 560;
};
```

### 5. Matrix Knowledge Upload Component

```typescript
// components/MatrixUpload.tsx
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface MatrixUploadProps {
  isActive: boolean;
  progress: number;
  message?: string;
}

export const MatrixUpload: React.FC<MatrixUploadProps> = ({ isActive, progress, message }) => {
  const [matrixChars, setMatrixChars] = useState<string[][]>([]);

  useEffect(() => {
    if (!isActive) return;

    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZαβγδεζηθλμνξπρστφχψω';
    const columns = Math.floor(window.innerWidth / 20);
    const rows = Math.floor(window.innerHeight / 20);

    const interval = setInterval(() => {
      setMatrixChars(
        Array.from({ length: rows }, () =>
          Array.from({ length: columns }, () =>
            chars[Math.floor(Math.random() * chars.length)]
          )
        )
      );
    }, 50);

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm"
        >
          {/* Matrix rain effect */}
          <div className="absolute inset-0 overflow-hidden font-mono text-sm">
            {matrixChars.map((row, rowIndex) => (
              <div key={rowIndex} className="flex">
                {row.map((char, colIndex) => (
                  <motion.span
                    key={colIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: Math.random() }}
                    className="text-green-400"
                    style={{
                      textShadow: '0 0 8px rgba(0, 255, 0, 0.8)',
                    }}
                  >
                    {char}
                  </motion.span>
                ))}
              </div>
            ))}
          </div>

          {/* Upload progress indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="glass-popup p-8 w-96">
              <h3 className="glass-text text-xl font-bold mb-4 text-center">
                Knowledge Transfer
              </h3>

              {/* Progress bar */}
              <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden mb-4">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-400 to-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  style={{
                    boxShadow: '0 0 20px rgba(0, 255, 0, 0.5)',
                  }}
                />
              </div>

              {/* Progress text */}
              <div className="text-center glass-text text-lg font-mono mb-2">
                {progress.toFixed(1)}%
              </div>

              {/* Status message */}
              {message && (
                <div className="text-center glass-text-muted text-sm">
                  {message}
                </div>
              )}

              {/* Animated dots */}
              <div className="flex justify-center gap-2 mt-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 rounded-full bg-green-400"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                    style={{
                      boxShadow: '0 0 10px rgba(0, 255, 0, 0.8)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
```

### 6. Control Panel Component

```typescript
// components/ControlPanel.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Settings, BarChart3, MessageSquare, Activity, Layers } from 'lucide-react';

interface ControlPanelProps {
  onOpenChat: () => void;
  onOpenPhaseSpace: () => void;
  onOpenCharts: () => void;
  onToggleTicker: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onOpenChat,
  onOpenPhaseSpace,
  onOpenCharts,
  onToggleTicker,
}) => {
  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3"
    >
      <ControlButton
        icon={<MessageSquare className="w-5 h-5" />}
        label="Chat"
        onClick={onOpenChat}
      />
      <ControlButton
        icon={<Activity className="w-5 h-5" />}
        label="Phase Space"
        onClick={onOpenPhaseSpace}
      />
      <ControlButton
        icon={<BarChart3 className="w-5 h-5" />}
        label="Charts"
        onClick={onOpenCharts}
      />
      <ControlButton
        icon={<Layers className="w-5 h-5" />}
        label="Ticker"
        onClick={onToggleTicker}
      />
      <div className="h-px bg-glass-border my-2" />
      <ControlButton
        icon={<Settings className="w-5 h-5" />}
        label="Settings"
        onClick={() => {}}
      />
    </motion.div>
  );
};

const ControlButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => {
  return (
    <motion.button
      onClick={onClick}
      className="p-3 glass-window hover:glass-accent group relative"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="text-glass-text group-hover:text-glass-accent transition-colors">
        {icon}
      </div>
      <div className="absolute left-full ml-3 px-3 py-1.5 glass-window opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
        <span className="glass-text text-sm font-medium">{label}</span>
      </div>
    </motion.button>
  );
};
```

---

## TypeScript Interfaces

```typescript
// types/holographic-overlay.ts

export interface OverlayState {
  isActive: boolean;
  activeWindows: Window[];
  tickerEnabled: boolean;
  matrixUpload: MatrixUploadState | null;
}

export interface Window {
  id: string;
  type: 'chat' | 'phase-space' | 'chart' | 'graph' | 'ticker' | 'custom';
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  content?: React.ReactNode;
}

export interface TickerData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

export interface MatrixUploadState {
  isActive: boolean;
  progress: number;
  message: string;
  startTime: number;
}

export interface PhaseSpaceVisualization {
  id: string;
  data: VisualizationData;
  config: PhasePortraitConfig;
  lastUpdated: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface OverlayConfig {
  theme: 'dark' | 'light';
  glassOpacity: number;
  blurAmount: number;
  animationSpeed: 'slow' | 'normal' | 'fast';
  keyboardShortcutsEnabled: boolean;
}

// Zustand store interface
export interface OverlayStore {
  state: OverlayState;
  config: OverlayConfig;

  // Actions
  toggleOverlay: () => void;
  addWindow: (window: Omit<Window, 'id' | 'zIndex'>) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  maximizeWindow: (id: string) => void;
  bringToFront: (id: string) => void;
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;
  toggleTicker: () => void;
  startMatrixUpload: (message: string) => void;
  updateMatrixProgress: (progress: number) => void;
  endMatrixUpload: () => void;
  updateConfig: (config: Partial<OverlayConfig>) => void;
}
```

---

## Tauri Backend Commands

```rust
// src-tauri/src/main.rs (partial)

use tauri::{Command, State, Window};
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TickerData {
    symbol: String,
    price: f64,
    change: f64,
    change_percent: f64,
    volume: u64,
    timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhaseSpaceVisualization {
    points: Vec<PhaseSpaceCoordinates>,
    nash_points: Vec<PhaseSpaceCoordinates>,
    trajectory: TrajectoryData,
    bounds: Bounds,
}

// Overlay state management
#[derive(Default)]
pub struct OverlayState {
    is_active: Mutex<bool>,
    ticker_enabled: Mutex<bool>,
}

#[tauri::command]
async fn toggle_overlay(state: State<'_, OverlayState>) -> Result<bool, String> {
    let mut is_active = state.is_active.lock().await;
    *is_active = !*is_active;
    Ok(*is_active)
}

#[tauri::command]
async fn get_overlay_state(state: State<'_, OverlayState>) -> Result<bool, String> {
    let is_active = state.is_active.lock().await;
    Ok(*is_active)
}

#[tauri::command]
async fn toggle_ticker(state: State<'_, OverlayState>) -> Result<bool, String> {
    let mut ticker_enabled = state.ticker_enabled.lock().await;
    *ticker_enabled = !*ticker_enabled;
    Ok(*ticker_enabled)
}

#[tauri::command]
async fn get_ticker_data() -> Result<Vec<TickerData>, String> {
    // Fetch real-time ticker data from API
    // This is a placeholder - implement actual API integration
    let tickers = vec![
        TickerData {
            symbol: "AAPL".to_string(),
            price: 178.45,
            change: 2.34,
            change_percent: 1.32,
            volume: 52_847_392,
            timestamp: chrono::Utc::now().timestamp(),
        },
        // Add more tickers...
    ];

    Ok(tickers)
}

#[tauri::command]
async fn get_phase_space_visualization() -> Result<PhaseSpaceVisualization, String> {
    // Load phase space data from the math framework
    // This integrates with /src/math-framework/phase-space/

    // Placeholder - implement actual data loading
    Err("Not implemented".to_string())
}

#[tauri::command]
async fn start_ticker_stream(window: Window) -> Result<(), String> {
    // Start real-time ticker streaming
    tokio::spawn(async move {
        loop {
            tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;

            // Fetch updated ticker data
            match get_ticker_data().await {
                Ok(tickers) => {
                    let _ = window.emit("ticker-update", tickers);
                }
                Err(e) => {
                    eprintln!("Error fetching ticker data: {}", e);
                }
            }
        }
    });

    Ok(())
}

#[tauri::command]
async fn capture_screen_region(x: i32, y: i32, width: u32, height: u32) -> Result<String, String> {
    // Integrate with computer vision capture system
    // Return base64-encoded image data
    Err("Not implemented".to_string())
}

#[tauri::command]
async fn analyze_market_pattern(data: Vec<f64>) -> Result<String, String> {
    // Use AI to analyze market patterns
    // This could integrate with the Anthropic API
    Err("Not implemented".to_string())
}

// Main function setup
fn main() {
    tauri::Builder::default()
        .manage(OverlayState::default())
        .invoke_handler(tauri::generate_handler![
            toggle_overlay,
            get_overlay_state,
            toggle_ticker,
            get_ticker_data,
            get_phase_space_visualization,
            start_ticker_stream,
            capture_screen_region,
            analyze_market_pattern,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## Animation System

### Framer Motion Variants

```typescript
// utils/animations.ts

export const overlayVariants = {
  hidden: {
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const windowVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 50,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: {
      duration: 0.2,
    },
  },
};

export const tickerVariants = {
  hidden: { y: -100, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 30,
      stiffness: 300,
    },
  },
};

export const matrixFadeVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  },
};

// Performance-optimized animation settings
export const performanceConfig = {
  // Use transform for animations (GPU-accelerated)
  transition: {
    type: 'spring',
    damping: 25,
    stiffness: 300,
  },
  // Reduce motion for accessibility
  reducedMotion: {
    type: 'tween',
    duration: 0.01,
  },
};
```

### CSS Animations

```css
/* animations.css */

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(100, 200, 255, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(100, 200, 255, 0.6);
  }
}

@keyframes ticker-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
}

@keyframes matrix-fall {
  0% {
    transform: translateY(-100%);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh);
    opacity: 0;
  }
}

.shimmer-effect {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 3s infinite linear;
}

.pulse-glow {
  animation: pulse-glow 2s infinite ease-in-out;
}

.ticker-scroll {
  animation: ticker-scroll 60s linear infinite;
}

.matrix-char {
  animation: matrix-fall 3s linear infinite;
}

/* Performance optimization */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
}
```

---

## Keyboard Shortcuts

```typescript
// hooks/useKeyboardShortcuts.tsx
import { useEffect } from 'react';
import { useOverlayStore } from '@/store/overlayStore';

export const useKeyboardShortcuts = () => {
  const {
    toggleOverlay,
    addWindow,
    toggleTicker,
    closeWindow,
    state,
  } = useOverlayStore();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl/Cmd + Shift + O: Toggle overlay
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'O') {
        e.preventDefault();
        toggleOverlay();
      }

      // Only allow other shortcuts when overlay is active
      if (!state.isActive) return;

      // Ctrl/Cmd + Shift + C: Open chat window
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        addWindow({
          type: 'chat',
          title: 'AURELIA Chat',
          position: { x: 100, y: 100 },
          size: { width: 400, height: 600 },
          isMinimized: false,
          isMaximized: false,
        });
      }

      // Ctrl/Cmd + Shift + P: Open phase space
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        addWindow({
          type: 'phase-space',
          title: 'Phase Space Visualization',
          position: { x: 200, y: 200 },
          size: { width: 800, height: 600 },
          isMinimized: false,
          isMaximized: false,
        });
      }

      // Ctrl/Cmd + Shift + T: Toggle ticker
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        toggleTicker();
      }

      // Escape: Close top window
      if (e.key === 'Escape') {
        e.preventDefault();
        const topWindow = state.activeWindows
          .sort((a, b) => b.zIndex - a.zIndex)[0];
        if (topWindow) {
          closeWindow(topWindow.id);
        }
      }

      // Ctrl/Cmd + W: Close focused window
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        const topWindow = state.activeWindows
          .sort((a, b) => b.zIndex - a.zIndex)[0];
        if (topWindow) {
          closeWindow(topWindow.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [state.isActive, state.activeWindows]);
};

// Keyboard shortcut reference component
export const KeyboardShortcutHelp: React.FC = () => {
  return (
    <div className="glass-popup p-6 space-y-4">
      <h3 className="glass-text text-xl font-bold mb-4">Keyboard Shortcuts</h3>

      <ShortcutRow
        keys={['Ctrl/Cmd', 'Shift', 'O']}
        description="Toggle overlay"
      />
      <ShortcutRow
        keys={['Ctrl/Cmd', 'Shift', 'C']}
        description="Open chat window"
      />
      <ShortcutRow
        keys={['Ctrl/Cmd', 'Shift', 'P']}
        description="Open phase space"
      />
      <ShortcutRow
        keys={['Ctrl/Cmd', 'Shift', 'T']}
        description="Toggle ticker"
      />
      <ShortcutRow
        keys={['Escape']}
        description="Close top window"
      />
      <ShortcutRow
        keys={['Ctrl/Cmd', 'W']}
        description="Close focused window"
      />
    </div>
  );
};

const ShortcutRow: React.FC<{ keys: string[]; description: string }> = ({
  keys,
  description,
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            <kbd className="px-3 py-1 glass-accent rounded glass-text text-sm font-mono">
              {key}
            </kbd>
            {index < keys.length - 1 && (
              <span className="glass-text-muted">+</span>
            )}
          </React.Fragment>
        ))}
      </div>
      <span className="glass-text-muted text-sm">{description}</span>
    </div>
  );
};
```

---

## Accessibility

### ARIA Labels and Roles

```typescript
// Accessibility implementation examples

// Overlay toggle
<button
  onClick={toggleOverlay}
  aria-label={isActive ? 'Hide overlay' : 'Show overlay'}
  aria-pressed={isActive}
  role="switch"
>
  {/* Button content */}
</button>

// Window component
<div
  role="dialog"
  aria-labelledby={`window-title-${id}`}
  aria-modal="true"
  tabIndex={-1}
>
  <h3 id={`window-title-${id}`}>{title}</h3>
  {/* Window content */}
</div>

// Ticker display
<div
  role="marquee"
  aria-live="polite"
  aria-label="Stock ticker display"
>
  {/* Ticker content */}
</div>

// Chat interface
<div
  role="log"
  aria-live="polite"
  aria-relevant="additions"
  aria-label="Chat messages"
>
  {/* Messages */}
</div>
```

### Focus Management

```typescript
// hooks/useFocusManagement.tsx
import { useEffect, useRef } from 'react';

export const useFocusManagement = (isOpen: boolean) => {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus container
      containerRef.current?.focus();

      // Trap focus within container
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        const focusableElements = containerRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      };

      document.addEventListener('keydown', handleTabKey);

      return () => {
        document.removeEventListener('keydown', handleTabKey);

        // Restore previous focus
        previousFocusRef.current?.focus();
      };
    }
  }, [isOpen]);

  return containerRef;
};
```

### Reduced Motion Support

```typescript
// hooks/useReducedMotion.tsx
import { useEffect, useState } from 'react';

export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Usage in components
const MyComponent = () => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1 }}
      transition={prefersReducedMotion ? { duration: 0.01 } : { duration: 0.6 }}
    >
      {/* Content */}
    </motion.div>
  );
};
```

### Color Contrast

```typescript
// Ensure all text meets WCAG AA standards (4.5:1 contrast ratio)

const colorContrast = {
  // Primary text on glass background
  primary: 'rgba(255, 255, 255, 0.95)', // High contrast

  // Secondary text
  secondary: 'rgba(200, 220, 240, 0.85)', // Good contrast

  // Muted text (use sparingly)
  muted: 'rgba(180, 200, 220, 0.7)', // Minimum acceptable

  // Accent colors (buttons, links)
  accent: 'rgba(100, 200, 255, 0.9)', // High contrast

  // Error/warning
  error: 'rgba(255, 100, 100, 0.95)', // High contrast
  success: 'rgba(100, 255, 150, 0.95)', // High contrast
};
```

---

## Implementation Checklist

### Phase 1: Core Overlay System
- [ ] Create base `HolographicOverlay` component
- [ ] Implement glass CSS styling
- [ ] Add `OverlayToggle` component with ON/OFF switch
- [ ] Set up Zustand store for state management
- [ ] Integrate with existing Tauri app

### Phase 2: Window Management
- [ ] Build `WindowManager` component
- [ ] Implement `DraggableWindow` with React DnD
- [ ] Add resize functionality
- [ ] Implement minimize/maximize features
- [ ] Add window focus management

### Phase 3: Core Components
- [ ] Extend `ChatInterface` with glass styling
- [ ] Build `TickerDisplay` component
- [ ] Integrate real-time ticker data via Tauri
- [ ] Add `ControlPanel` with navigation
- [ ] Implement keyboard shortcuts

### Phase 4: Visualizations
- [ ] Create `PhaseSpaceWindow` component
- [ ] Integrate phase space data from `/src/math-framework/`
- [ ] Build `ChartWindow` for stock charts
- [ ] Add D3.js/Recharts integration
- [ ] Implement interactive controls

### Phase 5: Matrix Upload
- [ ] Build `MatrixUpload` animation component
- [ ] Create matrix rain effect
- [ ] Add progress indicator
- [ ] Integrate with knowledge transfer system

### Phase 6: Backend Integration
- [ ] Implement Tauri commands for overlay control
- [ ] Add ticker data streaming
- [ ] Integrate computer vision capture
- [ ] Set up Anthropic API for chat
- [ ] Add phase space data endpoints

### Phase 7: Polish & Optimization
- [ ] Optimize animations for 60fps
- [ ] Implement accessibility features
- [ ] Add keyboard shortcuts
- [ ] Test reduced motion support
- [ ] Ensure WCAG AA compliance

### Phase 8: Testing & Deployment
- [ ] Unit tests for all components
- [ ] Integration tests for Tauri commands
- [ ] Performance testing
- [ ] Cross-platform testing (Windows/Mac/Linux)
- [ ] User acceptance testing

---

## Performance Optimization

### GPU Acceleration

```css
/* Force GPU acceleration for smooth animations */
.gpu-layer {
  transform: translateZ(0);
  will-change: transform, opacity;
  backface-visibility: hidden;
  perspective: 1000px;
}
```

### React Optimization

```typescript
// Memoize expensive components
export const PhaseSpaceWindow = React.memo<PhaseSpaceWindowProps>(
  ({ data }) => {
    // Component implementation
  },
  (prevProps, nextProps) => {
    return prevProps.data.id === nextProps.data.id;
  }
);

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return computePhaseSpaceVisualization(rawData);
}, [rawData]);

// Use useCallback for event handlers
const handleWindowDrag = useCallback((position: { x: number; y: number }) => {
  updateWindowPosition(windowId, position);
}, [windowId, updateWindowPosition]);
```

### Lazy Loading

```typescript
// Lazy load heavy components
const MatrixUpload = React.lazy(() => import('./MatrixUpload'));
const PhaseSpaceWindow = React.lazy(() => import('./PhaseSpaceWindow'));

// Use Suspense for loading states
<Suspense fallback={<LoadingSpinner />}>
  <MatrixUpload {...props} />
</Suspense>
```

---

## Deployment Notes

### Environment Variables

```bash
# .env
VITE_ANTHROPIC_API_KEY=your_api_key_here
VITE_TICKER_API_URL=https://api.ticker-service.com
VITE_ENABLE_OVERLAY=true
VITE_OVERLAY_DEFAULT_STATE=off
```

### Build Configuration

```json
// tauri.conf.json
{
  "tauri": {
    "windows": [
      {
        "title": "AURELIA Trading System",
        "width": 1920,
        "height": 1080,
        "resizable": true,
        "fullscreen": false,
        "transparent": true,
        "decorations": true
      }
    ],
    "allowlist": {
      "all": false,
      "window": {
        "all": true,
        "create": true,
        "center": true,
        "requestUserAttention": true
      },
      "shell": {
        "all": false,
        "open": true
      }
    }
  }
}
```

---

## Conclusion

This specification provides a comprehensive blueprint for implementing the AURELIA holographic UI overlay system. The design emphasizes:

1. **Glass aesthetic**: Cold, clean visual design with high readability
2. **Performance**: 60fps animations with GPU acceleration
3. **Modularity**: Component-based architecture for maintainability
4. **Accessibility**: WCAG AA compliance and keyboard navigation
5. **Integration**: Seamless integration with existing Tauri app and phase space visualizations

The implementation should follow the phased approach outlined in the checklist, with continuous testing and optimization throughout each phase.

**Next Steps**:
1. Review this specification with stakeholders
2. Set up development environment
3. Begin Phase 1 implementation
4. Iterate based on user feedback

---

**Document Version**: 1.0
**Last Updated**: 2025-11-13
**Author**: AURELIA Development Team

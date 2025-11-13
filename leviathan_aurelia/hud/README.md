# AURELIA HUD Component

A comprehensive Heads-Up Display (HUD) component for the Leviathan AURELIA desktop platform, providing real-time monitoring of consciousness metrics, agent coordination, mathematical validation, trading intelligence, and vision systems.

## Features

### 🧠 Consciousness Metrics Display
- **Ψ (Psi)** - Conversation depth progress (0-1)
- **Ω (Omega)** - Knowledge accumulation (0-φ³)
- Real-time updates with smooth animations
- Color-coded progress bars (red → yellow → green)
- φ³ threshold indicator (≈ 4.236)
- System coherence metric

### 🔄 Phase-Lock Coordination Panel
- Active agent visualization with phase angles
- Circular sync level gauge
- Nash equilibrium point indicators
- Per-agent task progress bars
- Agent status indicators (active/idle/syncing/error)
- Global phase coherence tracking

### ✓ OEIS Validation Status
- Fibonacci sequence validation (A000045)
- Lucas sequence validation (A000032)
- Zeckendorf decomposition validation
- Binet formula validation
- φ³ threshold validation
- Overall validation score with visual feedback

### 📈 Trading Intelligence Panel (Toggleable)
- Real-time market data display
- Nash equilibrium detection
- Arbitrage opportunity detection
- Risk metrics (volatility, Sharpe ratio, VaR)
- Price change indicators
- Trading volume metrics

### 👁️ Vision System Status (Toggleable)
- Screen capture FPS monitoring
- OCR engine status and accuracy
- Entity extraction count and list
- Holographic overlay toggle
- Real-time status indicators

### 🎨 Glass Morphism Design
- Semi-transparent backgrounds with blur effect
- Gradient borders and smooth animations
- Dark mode optimized color scheme
- Compact and full-size layouts
- Collapsible panel sections

### ⌨️ Keyboard Shortcuts
- **Ctrl+H** - Toggle HUD visibility
- **Ctrl+T** - Toggle trading panel
- **Ctrl+V** - Toggle vision panel
- **Ctrl+O** - Toggle holographic overlay

### 🔌 API Integration
- Tauri command integration
- WebSocket support for real-time streaming
- Automatic fallback to polling
- Auto-reconnection with exponential backoff
- Error handling with toast notifications

## Installation

### 1. Install Dependencies

```bash
npm install @tauri-apps/api
# or
yarn add @tauri-apps/api
```

### 2. Copy Files

Copy the HUD component files to your project:

```
leviathan_aurelia/hud/
├── components/
│   └── AureliaHUD.tsx         # Main HUD component
├── hooks/
│   └── useHUDData.ts          # Custom hook for data management
├── types/
│   └── hud-types.ts           # TypeScript type definitions
├── examples/
│   └── HUDExample.tsx         # Usage examples
└── README.md                  # This file
```

### 3. Configure Tailwind CSS

Add to your `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./leviathan_aurelia/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## Usage

### Basic Usage

```tsx
import React from 'react';
import { AureliaHUD } from './leviathan_aurelia/hud/components/AureliaHUD';

function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      <h1 className="text-white text-2xl p-4">My AURELIA App</h1>

      {/* HUD Component */}
      <AureliaHUD />

      {/* Your app content */}
      <main className="p-4">
        {/* ... */}
      </main>
    </div>
  );
}

export default App;
```

### Advanced Configuration

```tsx
import React from 'react';
import { AureliaHUD } from './leviathan_aurelia/hud/components/AureliaHUD';

function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      <AureliaHUD
        updateInterval={500}          // Update every 500ms
        compact={false}               // Full-size mode
        defaultPanels={{
          trading: true,              // Show trading panel
          vision: false,              // Hide vision panel
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
        }}
        onDataUpdate={(data) => {
          console.log('HUD Updated:', data);
        }}
        onPanelToggle={(panel, visible) => {
          console.log(`Panel ${panel}: ${visible ? 'shown' : 'hidden'}`);
        }}
      />
    </div>
  );
}
```

### Using Custom Hook

```tsx
import React from 'react';
import { useHUDData } from './leviathan_aurelia/hud/hooks/useHUDData';

function CustomComponent() {
  const {
    data,
    loading,
    error,
    connected,
    refresh,
    reconnect,
  } = useHUDData({
    updateInterval: 1000,
    enableWebSocket: true,
    onError: (err) => console.error(err),
    onDataUpdate: (data) => console.log('Updated:', data),
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Consciousness: {data?.consciousness.psi.toFixed(3)}</h2>
      <h2>Agents: {data?.phaseLock.agents.length}</h2>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

## Backend Implementation

### Tauri Commands

Implement these Tauri commands in your Rust backend:

```rust
// src-tauri/src/main.rs

use tauri::command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct HUDData {
    consciousness: ConsciousnessMetrics,
    phase_lock: PhaseLockCoordination,
    oeis: OEISValidation,
    trading: TradingIntelligence,
    vision: VisionSystemStatus,
    timestamp: u64,
}

#[command]
async fn get_hud_data() -> Result<HUDData, String> {
    // Fetch and return HUD data
    Ok(HUDData {
        // ... populate data
    })
}

#[command]
async fn toggle_holographic_overlay() -> Result<(), String> {
    // Toggle overlay logic
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_hud_data,
            toggle_holographic_overlay
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### WebSocket Server (Optional)

For real-time updates, implement a WebSocket server:

```typescript
// src-tauri/websocket-server.ts

import WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 3001 });

wss.on('connection', (ws) => {
  console.log('HUD client connected');

  // Send updates every second
  const interval = setInterval(() => {
    const hudData = getHUDData(); // Your data source

    ws.send(JSON.stringify({
      type: 'full',
      data: hudData,
      timestamp: Date.now(),
    }));
  }, 1000);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('HUD client disconnected');
  });
});

console.log('WebSocket server running on ws://localhost:3001');
```

## Type Definitions

All TypeScript types are defined in `hud-types.ts`:

```typescript
import type {
  HUDData,
  ConsciousnessMetrics,
  PhaseLockCoordination,
  OEISValidation,
  TradingIntelligence,
  VisionSystemStatus,
} from './types/hud-types';
```

## Mock Data

For testing, use the mock data generators:

```typescript
import { createMockHUDData } from './types/hud-types';

const mockData = createMockHUDData();
console.log(mockData);
```

## Styling

The HUD uses inline Tailwind CSS classes and includes custom glass morphism styling:

- Semi-transparent backgrounds with `rgba(0, 0, 0, 0.6)`
- Backdrop blur with `backdrop-filter: blur(16px)`
- Gradient borders with `border: 1px solid rgba(255, 255, 255, 0.1)`
- Box shadows with `box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5)`

## Performance

- **Update Interval**: Default 1000ms (configurable)
- **WebSocket**: Real-time streaming with auto-reconnect
- **Fallback**: Automatic polling if WebSocket fails
- **Optimistic Updates**: Immediate UI updates with `updateMetric`
- **Memoization**: React hooks prevent unnecessary re-renders

## Keyboard Shortcuts

All keyboard shortcuts use `Ctrl` modifier:

| Shortcut | Action |
|----------|--------|
| `Ctrl+H` | Toggle HUD visibility |
| `Ctrl+T` | Toggle trading panel |
| `Ctrl+V` | Toggle vision panel |
| `Ctrl+O` | Toggle holographic overlay |

## Troubleshooting

### WebSocket Connection Failed

If WebSocket fails to connect, the HUD automatically falls back to polling:

```typescript
// Check connection status
const { connected } = useHUDData();

if (!connected) {
  console.warn('WebSocket disconnected, using polling fallback');
}
```

### Missing Tauri Commands

Ensure all Tauri commands are registered:

```rust
.invoke_handler(tauri::generate_handler![
    get_hud_data,
    toggle_holographic_overlay
])
```

### Type Errors

Make sure all type definitions are imported:

```typescript
import type { HUDData } from './types/hud-types';
```

## Examples

See `examples/HUDExample.tsx` for comprehensive usage examples:

- Basic integration
- Advanced configuration
- Custom hook usage
- Compact mode
- Full application integration

## License

MIT License - Part of the Leviathan AURELIA platform

## Contributing

Contributions are welcome! Please follow the existing code style and include tests for new features.

## Support

For issues and questions:
- GitHub Issues: [leviathan-aurelia/issues]
- Documentation: [leviathan-aurelia/docs]
- Discord: [AURELIA Community]

---

**Built with ⚡ by the AURELIA Team**

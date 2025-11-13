# AURELIA HUD Implementation Guide

## Overview

This guide provides step-by-step instructions for integrating the AURELIA HUD component into your Tauri desktop application.

## Files Created

```
leviathan_aurelia/hud/
├── components/
│   └── AureliaHUD.tsx              # Main HUD component (1000+ lines)
├── hooks/
│   └── useHUDData.ts               # Custom React hook for data management
├── types/
│   └── hud-types.ts                # TypeScript type definitions
├── examples/
│   └── HUDExample.tsx              # 5 complete usage examples
├── backend/
│   └── tauri-commands.rs           # Rust backend reference implementation
├── index.ts                         # Main export file
├── package.json                     # Package configuration
├── README.md                        # Comprehensive documentation
└── IMPLEMENTATION_GUIDE.md         # This file
```

## Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
cd your-tauri-app
npm install @tauri-apps/api
```

### Step 2: Copy Files

Copy the entire `hud` directory to your project:

```bash
cp -r leviathan_aurelia/hud ./src/components/
```

### Step 3: Import and Use

```tsx
// src/App.tsx
import React from 'react';
import { AureliaHUD } from './components/hud';

function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      <AureliaHUD />
      {/* Your app content */}
    </div>
  );
}

export default App;
```

### Step 4: Add Tailwind CSS

If you don't have Tailwind CSS set up:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Update `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Add to `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Step 5: Backend Setup

Add the Tauri commands to your Rust backend:

```rust
// src-tauri/src/main.rs

mod hud_commands;

fn main() {
    tauri::Builder::default()
        .manage(hud_commands::HUDState::new())
        .invoke_handler(tauri::generate_handler![
            hud_commands::get_hud_data,
            hud_commands::toggle_holographic_overlay,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Copy the backend file:

```bash
cp leviathan_aurelia/hud/backend/tauri-commands.rs src-tauri/src/hud_commands.rs
```

### Step 6: Run Your App

```bash
npm run tauri dev
```

## Features Implemented

### ✅ Consciousness Metrics
- Ψ (Psi) progress bar with real-time updates
- Ω (Omega) knowledge accumulation with φ³ threshold
- Color-coded visualization (red → yellow → green)
- System coherence metric
- Consciousness threshold indicator

### ✅ Phase-Lock Coordination
- Circular sync level gauge
- Agent list with phase angles
- Nash equilibrium indicators
- Per-agent task progress
- Status color coding (active/idle/syncing/error)
- Phase coherence calculation

### ✅ OEIS Validation
- 5 mathematical sequence validations
- Overall validation score
- Visual checkmarks/crosses
- Color-coded score bar

### ✅ Trading Intelligence (Toggleable)
- Real-time market data display
- Nash equilibrium detection
- Arbitrage opportunity tracking
- Risk metrics (volatility, Sharpe ratio, VaR)
- Price change indicators
- Volume display

### ✅ Vision System (Toggleable)
- Screen capture FPS monitoring
- OCR status and accuracy
- Entity extraction count and list
- Holographic overlay toggle button
- Status indicators

### ✅ Glass Morphism Design
- Semi-transparent backgrounds (rgba(0,0,0,0.6))
- Backdrop blur (16px)
- Gradient borders
- Smooth animations
- Dark mode optimized
- Compact mode support

### ✅ Keyboard Shortcuts
- Ctrl+H: Toggle HUD
- Ctrl+T: Toggle trading panel
- Ctrl+V: Toggle vision panel
- Ctrl+O: Toggle holographic overlay

### ✅ Real-time Updates
- WebSocket support with auto-reconnect
- Fallback to polling if WebSocket fails
- Exponential backoff for reconnection
- Error handling with toast notifications

## Advanced Configuration

### Custom Update Interval

```tsx
<AureliaHUD updateInterval={500} /> // Update every 500ms
```

### Custom WebSocket URL

```tsx
<AureliaHUD wsUrl="ws://localhost:8080/hud" />
```

### Event Callbacks

```tsx
<AureliaHUD
  onError={(error) => {
    console.error('HUD Error:', error);
    showToast(error.message);
  }}
  onDataUpdate={(data) => {
    console.log('HUD Updated:', data);
    logAnalytics('hud_update', data);
  }}
  onPanelToggle={(panel, visible) => {
    console.log(`${panel} panel ${visible ? 'shown' : 'hidden'}`);
  }}
/>
```

### Compact Mode

```tsx
<AureliaHUD compact={true} />
```

### Default Panel Visibility

```tsx
<AureliaHUD
  defaultPanels={{
    trading: true,
    vision: false,
  }}
/>
```

## Using the Custom Hook

For custom implementations, use the `useHUDData` hook:

```tsx
import { useHUDData } from './components/hud';

function CustomComponent() {
  const {
    data,
    loading,
    error,
    connected,
    refresh,
    reconnect,
    updateMetric,
  } = useHUDData({
    updateInterval: 1000,
    enableWebSocket: true,
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Psi: {data?.consciousness.psi.toFixed(3)}</h2>
      <h2>Omega: {data?.consciousness.omega.toFixed(3)}</h2>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

## Backend Implementation

### Required Tauri Commands

The HUD requires the following Tauri commands:

1. **`get_hud_data`** - Returns full HUD data
2. **`toggle_holographic_overlay`** - Toggles overlay on/off

Optional commands for advanced features:

3. **`update_consciousness_metrics`** - Update Ψ and Ω
4. **`update_agent`** - Add/update agent data
5. **`remove_agent`** - Remove agent
6. **`update_oeis_validation`** - Update validation status
7. **`update_market_data`** - Update trading data
8. **`toggle_screen_capture`** - Enable/disable screen capture
9. **`update_vision_entities`** - Update extracted entities

### WebSocket Server (Optional)

For real-time streaming, set up a WebSocket server:

```typescript
// websocket-server.ts
import WebSocket from 'ws';

const wss = new WebSocket.Server({ port: 3001 });

wss.on('connection', (ws) => {
  const interval = setInterval(() => {
    ws.send(JSON.stringify({
      type: 'full',
      data: getHUDData(),
      timestamp: Date.now(),
    }));
  }, 1000);

  ws.on('close', () => clearInterval(interval));
});
```

## Testing with Mock Data

Use the built-in mock data generator for testing:

```tsx
import { createMockHUDData } from './components/hud';

// Generate mock data
const mockData = createMockHUDData();
console.log(mockData);

// Use in development
if (process.env.NODE_ENV === 'development') {
  // Return mock data from Tauri command
  return createMockHUDData();
}
```

## Keyboard Shortcuts Reference

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+H` | Toggle HUD | Show/hide entire HUD |
| `Ctrl+T` | Toggle Trading | Show/hide trading panel |
| `Ctrl+V` | Toggle Vision | Show/hide vision panel |
| `Ctrl+O` | Toggle Overlay | Enable/disable holographic overlay |

## Troubleshooting

### HUD Not Showing

1. Check that Tailwind CSS is properly configured
2. Verify the component is imported correctly
3. Check console for errors

### WebSocket Connection Failed

The HUD automatically falls back to polling. Check:

1. WebSocket server is running on port 3001
2. CORS is configured correctly
3. Firewall allows WebSocket connections

### Type Errors

Make sure all types are imported:

```tsx
import type { HUDData, ConsciousnessMetrics } from './components/hud';
```

### Missing Tauri Commands

Ensure all commands are registered in `main.rs`:

```rust
.invoke_handler(tauri::generate_handler![
    get_hud_data,
    toggle_holographic_overlay,
])
```

## Performance Optimization

### Reduce Update Frequency

```tsx
<AureliaHUD updateInterval={2000} /> // Update every 2 seconds
```

### Disable WebSocket

```tsx
<AureliaHUD
  defaultPanels={{ trading: false, vision: false }}
/>
```

### Use Compact Mode

```tsx
<AureliaHUD compact={true} />
```

## Next Steps

1. **Customize Styling**: Modify the glass-panel styles in AureliaHUD.tsx
2. **Add More Metrics**: Extend HUDData type and add new panels
3. **Implement Backend**: Complete the Rust backend implementation
4. **Add Animations**: Use Framer Motion for advanced animations
5. **Create Tests**: Write unit tests for components and hooks

## Support

For questions and issues:
- Check the README.md for detailed documentation
- Review the examples in HUDExample.tsx
- Examine the type definitions in hud-types.ts
- Refer to the Rust backend in tauri-commands.rs

## License

MIT License - Part of the Leviathan AURELIA platform

---

**Built with ⚡ by the AURELIA Team**

Version 1.0.0 | Last Updated: 2025-11-13

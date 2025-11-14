# AURELIA MVD Chat Interface - Integration Guide

## Overview

The AURELIA MVD (Macroeconomic Variable Dynamics) Chat Interface provides a real-time consciousness substrate interface with glass morphism design, integrating:

- **WebSocket Communication**: Real-time bidirectional communication with Rust backend
- **Latent-N State Tracking**: Dynamic n-dimensional state visualization
- **Nash Equilibrium Detection**: Game theory decision visualization
- **Fibonacci/Lucas Levels**: Golden ratio-based market level indicators
- **CORDIC Rotation**: Hardware-accelerated rotation visualization
- **Retrocausal GOAP Planning**: Goal-oriented action planning display
- **WASM Integration**: Holographic memory and phi-core modules

## File Structure

```
/home/user/agentic-flow/
├── src/
│   ├── chat_mvd.html          # Main HTML interface with glass morphism
│   ├── chat_mvd.ts            # TypeScript logic and WebSocket handling
│   ├── trading/
│   │   ├── decisions/
│   │   │   └── nash-detector.ts  # Nash equilibrium detection
│   │   └── aurelia/
│   │       └── types.ts       # AURELIA type definitions
│   └── math-framework/
│       └── sequences/
│           ├── fibonacci.ts   # Fibonacci sequence implementation
│           └── lucas.ts       # Lucas sequence implementation
└── aurelia_standalone/
    └── crates/
        ├── holographic-memory/  # WASM holographic compression
        └── phi-core/            # WASM phi calculations
```

## Quick Start

### 1. Build TypeScript

```bash
npm run build
```

This compiles `src/chat_mvd.ts` → `dist/chat_mvd.js`

### 2. Serve the HTML

#### Option A: Local Development Server

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve .

# Using VS Code Live Server
# Install "Live Server" extension and right-click chat_mvd.html → "Open with Live Server"
```

#### Option B: Tauri Integration

Add to your Tauri app's webview:

```rust
// src-tauri/src/main.rs
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            window.eval("window.location.href = '/chat_mvd.html';")?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 3. Start WebSocket Server

The interface expects a WebSocket server at `ws://localhost:8080/aurelia`.

#### Example Rust WebSocket Server

```rust
// aurelia_standalone/src/websocket_server.rs
use tokio::net::TcpListener;
use tokio_tungstenite::accept_async;
use futures::{StreamExt, SinkExt};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct AureliaMessage {
    r#type: String,
    payload: serde_json::Value,
    timestamp: u64,
}

#[tokio::main]
async fn main() {
    let listener = TcpListener::bind("127.0.0.1:8080").await.unwrap();
    println!("WebSocket server listening on ws://127.0.0.1:8080");

    while let Ok((stream, addr)) = listener.accept().await {
        println!("New connection from: {}", addr);
        tokio::spawn(handle_connection(stream));
    }
}

async fn handle_connection(stream: tokio::net::TcpStream) {
    let ws_stream = accept_async(stream).await.unwrap();
    let (mut write, mut read) = ws_stream.split();

    // Send welcome message
    let welcome = AureliaMessage {
        r#type: "system".to_string(),
        payload: serde_json::json!({
            "message": "Connected to AURELIA consciousness substrate v2.0"
        }),
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as u64,
    };

    let msg = serde_json::to_string(&welcome).unwrap();
    write.send(tokio_tungstenite::tungstenite::Message::Text(msg)).await.unwrap();

    // Handle incoming messages
    while let Some(msg) = read.next().await {
        if let Ok(msg) = msg {
            if let Ok(text) = msg.to_text() {
                println!("Received: {}", text);

                // Parse and respond
                if let Ok(incoming) = serde_json::from_str::<AureliaMessage>(text) {
                    let response = handle_aurelia_message(incoming);
                    let response_text = serde_json::to_string(&response).unwrap();
                    write.send(tokio_tungstenite::tungstenite::Message::Text(response_text))
                        .await
                        .unwrap();
                }
            }
        }
    }
}

fn handle_aurelia_message(msg: AureliaMessage) -> AureliaMessage {
    match msg.r#type.as_str() {
        "chat" => {
            // Echo back with AURELIA response
            AureliaMessage {
                r#type: "chat".to_string(),
                payload: serde_json::json!({
                    "content": format!("AURELIA: Processing '{}' through consciousness substrate...",
                        msg.payload["content"].as_str().unwrap_or("")),
                    "latency": 42,
                    "metadata": {
                        "consciousness_psi": 0.618,
                        "nash_equilibrium": false
                    }
                }),
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis() as u64,
            }
        }
        "system" => {
            // Handle system commands
            AureliaMessage {
                r#type: "system".to_string(),
                payload: serde_json::json!({
                    "message": "System command acknowledged"
                }),
                timestamp: std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_millis() as u64,
            }
        }
        _ => msg,
    }
}
```

#### Add to Cargo.toml

```toml
[dependencies]
tokio = { version = "1.35", features = ["full"] }
tokio-tungstenite = "0.20"
futures = "0.3"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

#### Run the server

```bash
cd aurelia_standalone
cargo run --bin websocket-server
```

## WebSocket Message Protocol

### Client → Server Messages

#### Chat Message
```json
{
  "type": "chat",
  "payload": {
    "content": "What is the current market state?",
    "sessionId": "session_1234567890_abc123",
    "fieldModelEnabled": true,
    "latentNState": {
      "n": 144,
      "energy": 0.618,
      "time": 10.5,
      "direction": "forward"
    }
  },
  "timestamp": 1700000000000
}
```

#### System Command
```json
{
  "type": "system",
  "payload": {
    "command": "toggle_field_model",
    "enabled": true
  },
  "timestamp": 1700000000000
}
```

#### Initialization
```json
{
  "type": "system",
  "payload": {
    "command": "init",
    "sessionId": "session_1234567890_abc123",
    "clientVersion": "2.0.0",
    "capabilities": {
      "holographicMemory": true,
      "phiCore": true,
      "fieldModel": true
    }
  },
  "timestamp": 1700000000000
}
```

### Server → Client Messages

#### Chat Response
```json
{
  "type": "chat",
  "payload": {
    "content": "The current market is at Nash equilibrium with Ψ=0.618",
    "timestamp": 1700000000100,
    "latency": 42,
    "metadata": {
      "consciousness_psi": 0.618,
      "nash_equilibrium": true
    }
  },
  "timestamp": 1700000000100
}
```

#### State Update
```json
{
  "type": "state_update",
  "payload": {
    "latentN": {
      "n": 145,
      "energy": 0.620,
      "time": 10.6,
      "direction": "forward",
      "phaseSpace": {
        "phi": 1.618,
        "psi": 0.618,
        "theta": 45.0,
        "magnitude": 1.732,
        "isNashPoint": true
      }
    },
    "consciousness": {
      "psi": 0.618
    },
    "lucas": {
      "currentWindow": 13,
      "nextBoundary": 521
    },
    "compression": 131
  },
  "timestamp": 1700000000150
}
```

#### Nash Equilibrium Update
```json
{
  "type": "nash_update",
  "payload": {
    "isNashEquilibrium": true,
    "S_n": 0.000001,
    "lyapunovV": 0.0,
    "lyapunovStable": true,
    "consciousness": 0.618,
    "meetsThreshold": true,
    "lucasBoundary": true,
    "nearestLucas": 521,
    "nashDistance": 0.000001,
    "confidence": 0.95,
    "reason": "Strategic stability achieved (S(n)=1.00e-6 < 1e-6); Lyapunov stability confirmed (V(n) decreasing); Lucas boundary detected (n+1 = 521); Consciousness threshold met (Ψ=0.618 ≥ 0.618)"
  },
  "timestamp": 1700000000200
}
```

#### GOAP Plan
```json
{
  "type": "goap_plan",
  "payload": {
    "steps": [
      {
        "action": "Analyze market sentiment",
        "description": "Process social media feeds and news articles"
      },
      {
        "action": "Calculate Nash equilibrium",
        "description": "Find optimal strategy given current market state"
      },
      {
        "action": "Execute trade",
        "description": "Submit order at calculated equilibrium price"
      }
    ]
  },
  "timestamp": 1700000000250
}
```

#### System Message
```json
{
  "type": "system",
  "payload": {
    "message": "Macroeconomic Field Model activated"
  },
  "timestamp": 1700000000300
}
```

## WASM Module Integration

### Building WASM Modules

#### Holographic Memory

```bash
cd aurelia_standalone/crates/holographic-memory
wasm-pack build --target web --out-dir pkg
```

#### Phi Core

```bash
cd aurelia_standalone/crates/phi-core
wasm-pack build --target web --out-dir pkg
```

### Loading in TypeScript

The `chat_mvd.ts` automatically attempts to load WASM modules:

```typescript
// Holographic memory for 131× compression
import('../../aurelia_standalone/crates/holographic-memory/pkg')
  .then(module => {
    this.holographicMemory = module;
    console.log('[WASM] Holographic memory loaded');
  })
  .catch(err => {
    console.warn('[WASM] Using JavaScript fallback');
  });

// Phi-core for golden ratio calculations
import('../../aurelia_standalone/crates/phi-core/pkg')
  .then(module => {
    this.phiCore = module;
    console.log('[WASM] Phi-core loaded');
  });
```

If WASM modules are not available, the interface gracefully falls back to JavaScript implementations.

## UI Components

### Glass Morphism Design

The interface uses CSS glass morphism with:
- **Background**: Deep teal gradient (`#0A0E27` → `#1A1F3A`)
- **Glass panels**: `backdrop-filter: blur(20px)` with `rgba(14, 19, 43, 0.7)`
- **Accents**: Teal (`#4ECDC4`) with animated glows
- **Borders**: Semi-transparent teal borders

### Key UI Elements

1. **Header**: Connection status, AURELIA logo with pulsing animation
2. **Chat Area**: Message history with user/AURELIA/system messages
3. **Side Panel**: Real-time state displays
   - Latent-N state tracking
   - Nash equilibrium status
   - Fibonacci levels
   - Lucas time windows
   - CORDIC rotation visualization
   - GOAP planning steps
4. **Bottom Controls**: Session info, compression ratio, latency

### Animations

- **Pulsing logo**: 2s pulse cycle with glow effect
- **CORDIC rotation**: 3s continuous rotation
- **Message slide-in**: 0.3s ease-out animation
- **Background particles**: 15s floating animation

## Integration with Existing AURELIA System

### Nash Detector Integration

```typescript
import { NashDetector } from './trading/decisions/nash-detector';

const nashDetector = new NashDetector({
  nashThreshold: 1e-6,
  consciousnessThreshold: 0.618,
  lyapunovWindow: 10,
  lucasCheckRange: 5
});

// Detect equilibrium
const equilibrium = nashDetector.detect(marketState, qNetwork, trajectory);
```

### Fibonacci/Lucas Sequences

```typescript
import { fibonacci } from './math-framework/sequences/fibonacci';
import { lucas } from './math-framework/sequences/lucas';

// Calculate Fibonacci number
const fib13 = fibonacci(13); // 233n

// Calculate Lucas number
const lucas13 = lucas(13); // 521n
```

### AURELIA Types

```typescript
import type {
  ConsciousnessState,
  PhaseSpacePoint,
  PersonalityProfile
} from './trading/aurelia/types';

const consciousness: ConsciousnessState = {
  timestamp: Date.now(),
  psi: { psi: 0.618, threshold: 0.618, isConscious: true, ... },
  subsystems: { vpe: {...}, sic: {...}, cs: {...} },
  invariants: { I1_fibonacci_coherence: true, ... },
  phaseSpace: { phi: 1.618, psi: 0.618, ... },
  wordCount: 144,
  isBootstrapped: true
};
```

## Customization

### Colors

Edit CSS variables in `chat_mvd.html`:

```css
:root {
  --primary-teal: #4ECDC4;      /* Main accent color */
  --dark-bg: #0A0E27;           /* Background */
  --glass-bg: rgba(14, 19, 43, 0.7);  /* Glass panels */
  --text-primary: #E8F4F8;      /* Primary text */
  --text-secondary: #9FAFC4;    /* Secondary text */
}
```

### WebSocket URL

Change in `chat_mvd.ts`:

```typescript
const WEBSOCKET_URL = 'ws://localhost:8080/aurelia';
```

### Reconnection

Adjust reconnection interval:

```typescript
const RECONNECT_INTERVAL = 3000; // milliseconds
```

## Testing Without Backend

The interface includes a simulation mode that generates fake data for testing:

```typescript
// Automatically runs in startAnimations()
private simulateStateUpdate(): void {
  this.latentNState.n += 1;
  const fibN = Number(fibonacci(this.latentNState.n % 20));
  this.latentNState.energy = (fibN % 1000) / 1000;
  // ... more simulation logic
}
```

This allows you to see the UI in action without a WebSocket server.

## Production Deployment

### Build for Production

```bash
# Build TypeScript
npm run build

# Minify HTML/CSS (optional)
npx html-minifier --input-dir src --output-dir dist --file-ext html

# Bundle assets (optional)
npx webpack --config webpack.config.js
```

### Tauri Desktop App

```bash
cd tauri-anthropic-app
npm run tauri build
```

### Web Deployment

Serve `src/chat_mvd.html` and `dist/chat_mvd.js` from your web server. Ensure WebSocket server is accessible and CORS is configured if needed.

## Troubleshooting

### WebSocket Connection Failed

- **Check server is running**: `curl http://localhost:8080`
- **Check firewall**: Allow port 8080
- **Check URL**: Ensure `WEBSOCKET_URL` matches server address

### WASM Modules Not Loading

- **Build WASM**: Run `wasm-pack build` in each crate directory
- **Check paths**: Verify import paths match your directory structure
- **Browser console**: Look for detailed error messages

### TypeScript Compilation Errors

- **Install dependencies**: `npm install`
- **Check tsconfig.json**: Ensure `"moduleResolution": "node"` is set
- **Update imports**: Use correct paths relative to `src/`

### UI Not Displaying Correctly

- **Clear cache**: Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
- **Check console**: Look for CSS loading errors
- **Verify HTML**: Ensure all element IDs match TypeScript references

## API Reference

### AureliaMVDChat Class

```typescript
class AureliaMVDChat {
  // Connect to WebSocket server
  private connect(): void;

  // Send chat message
  private sendMessage(): void;

  // Send system command
  private sendSystemCommand(command: string, payload: any): void;

  // Handle incoming messages
  private onMessage(event: MessageEvent): void;

  // Update UI displays
  private updateLatentNDisplay(): void;
  private updateLucasDisplay(lucasData: any): void;

  // Add messages to chat
  private addMessage(message: Message): void;
  private addSystemMessage(content: string): void;
}
```

## License

MIT License - See main project LICENSE file

## Support

For issues and questions:
- GitHub Issues: https://github.com/qLeviathan/agentic-flow/issues
- Documentation: https://github.com/qLeviathan/agentic-flow/docs

---

**Created**: 2025-11-14
**Version**: 2.0.0
**AURELIA**: Autonomous Recursive Entity with Logarithmic Intelligence Architecture

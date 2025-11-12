# Building a Tauri + Rust WASM App with Anthropic API using Agentic-Flow

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Tauri Desktop App                        │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React/Vue/Svelte)                                │
│  ├─ UI Components                                           │
│  ├─ WASM Performance Layer (reasoningbank-wasm)             │
│  └─ Tauri API Bindings                                      │
├─────────────────────────────────────────────────────────────┤
│  Rust Backend (Tauri Core)                                  │
│  ├─ Secure Keychain API Key Storage                         │
│  ├─ Anthropic API Client                                    │
│  ├─ WASM Integration (agent-booster-wasm)                   │
│  └─ IPC Commands                                            │
├─────────────────────────────────────────────────────────────┤
│  Agentic-Flow Orchestration                                 │
│  ├─ Multi-Agent Coordination                                │
│  ├─ QUIC Transport for Agent Communication                  │
│  └─ Memory Management (AgentDB)                             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Using Agentic-Flow for Development

### Step 1: Spawn Architecture & Planning Agents

Use agentic-flow's **concurrent agent execution** to plan and build:

```typescript
// Use Claude Code's Task tool for parallel agent execution
// Single message with all agents spawned concurrently

Task("System Architect", `
  Design Tauri architecture with:
  - Rust backend for Anthropic API calls
  - WASM modules for vector operations (use existing reasoningbank-wasm)
  - Secure keychain storage for API keys
  - IPC command structure
  Store architecture decisions in memory.
`, "system-architect")

Task("Backend Developer", `
  Create Rust Tauri commands for:
  - Anthropic API integration (Claude SDK)
  - Environment variable loading
  - Keychain API key storage/retrieval
  Reference memory for architecture decisions.
`, "backend-dev")

Task("WASM Specialist", `
  Integrate existing WASM modules:
  - reasoningbank-wasm for memory operations
  - agent-booster-wasm for performance
  Optimize for Tauri desktop environment.
`, "coder")

Task("Security Reviewer", `
  Audit security patterns:
  - API key storage (never in localStorage)
  - Environment variable handling
  - WASM memory safety
`, "reviewer")

// Batch all todos in ONE call
TodoWrite { todos: [
  {content: "Design Tauri architecture", status: "in_progress"},
  {content: "Create Cargo workspace for Tauri", status: "pending"},
  {content: "Implement Anthropic API client", status: "pending"},
  {content: "Set up secure API key storage", status: "pending"},
  {content: "Integrate WASM modules", status: "pending"},
  {content: "Create IPC commands", status: "pending"},
  {content: "Build frontend UI", status: "pending"},
  {content: "Write tests", status: "pending"}
]}
```

## 📁 Project Structure

```
tauri-anthropic-app/
├── src-tauri/              # Rust backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   ├── main.rs
│   │   ├── anthropic/      # Anthropic API client
│   │   │   ├── mod.rs
│   │   │   ├── client.rs
│   │   │   └── types.rs
│   │   ├── keychain/       # Secure storage
│   │   │   ├── mod.rs
│   │   │   └── storage.rs
│   │   └── commands/       # Tauri IPC commands
│   │       ├── mod.rs
│   │       ├── chat.rs
│   │       └── config.rs
├── src/                    # Frontend
│   ├── main.tsx
│   ├── App.tsx
│   └── wasm/               # WASM integration
│       ├── reasoningbank.ts
│       └── agent_booster.ts
├── crates/                 # WASM modules
│   ├── reasoningbank-wasm/ # From existing project
│   └── agent-booster-wasm/ # From existing project
└── .env.example
```

## 🔧 Implementation with Agentic-Flow

### Using SPARC Methodology

```bash
# Run SPARC TDD workflow for Tauri development
npx claude-flow sparc tdd "Tauri app with Anthropic API integration"

# This will:
# 1. Specification: Analyze requirements
# 2. Pseudocode: Design algorithms
# 3. Architecture: Create system design
# 4. Refinement: Implement with TDD
# 5. Completion: Integration testing
```

### Agent Coordination Pattern

```bash
# Initialize hierarchical swarm for complex task
npx claude-flow swarm init \
  --topology hierarchical \
  --agents 8 \
  --memory-enabled

# Agents coordinate through:
# - Shared memory (AgentDB)
# - QUIC transport for fast IPC
# - Hooks for automatic coordination
```

## 🔐 Secure API Key Management

### Rust Backend (src-tauri/src/keychain/storage.rs)

```rust
use keyring::{Entry, Error};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct ApiKeyConfig {
    pub anthropic_api_key: String,
}

pub struct KeychainStorage {
    service: String,
}

impl KeychainStorage {
    pub fn new(app_name: &str) -> Self {
        Self {
            service: format!("{}.api-keys", app_name),
        }
    }

    pub fn save_api_key(&self, key: &str) -> Result<(), Error> {
        let entry = Entry::new(&self.service, "anthropic")?;
        entry.set_password(key)
    }

    pub fn get_api_key(&self) -> Result<String, Error> {
        let entry = Entry::new(&self.service, "anthropic")?;
        entry.get_password()
    }

    pub fn delete_api_key(&self) -> Result<(), Error> {
        let entry = Entry::new(&self.service, "anthropic")?;
        entry.delete_password()
    }
}
```

### Anthropic API Client (src-tauri/src/anthropic/client.rs)

```rust
use reqwest::{Client, header};
use serde::{Deserialize, Serialize};
use anyhow::{Result, Context};

#[derive(Serialize)]
struct MessageRequest {
    model: String,
    messages: Vec<Message>,
    max_tokens: u32,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Message {
    pub role: String,
    pub content: String,
}

#[derive(Deserialize)]
struct MessageResponse {
    content: Vec<ContentBlock>,
}

#[derive(Deserialize)]
struct ContentBlock {
    text: String,
}

pub struct AnthropicClient {
    client: Client,
    api_key: String,
}

impl AnthropicClient {
    pub fn new(api_key: String) -> Result<Self> {
        let client = Client::new();
        Ok(Self { client, api_key })
    }

    pub async fn send_message(
        &self,
        messages: Vec<Message>,
        model: &str,
        max_tokens: u32,
    ) -> Result<String> {
        let request = MessageRequest {
            model: model.to_string(),
            messages,
            max_tokens,
        };

        let response = self.client
            .post("https://api.anthropic.com/v1/messages")
            .header("x-api-key", &self.api_key)
            .header("anthropic-version", "2023-06-01")
            .header(header::CONTENT_TYPE, "application/json")
            .json(&request)
            .send()
            .await
            .context("Failed to send request to Anthropic API")?;

        let response_data: MessageResponse = response
            .json()
            .await
            .context("Failed to parse Anthropic API response")?;

        Ok(response_data.content[0].text.clone())
    }
}
```

### Tauri Commands (src-tauri/src/commands/chat.rs)

```rust
use tauri::State;
use std::sync::Mutex;
use crate::anthropic::{AnthropicClient, Message};
use crate::keychain::KeychainStorage;

pub struct AppState {
    pub client: Mutex<Option<AnthropicClient>>,
    pub keychain: KeychainStorage,
}

#[tauri::command]
pub async fn save_api_key(
    api_key: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    state.keychain
        .save_api_key(&api_key)
        .map_err(|e| e.to_string())?;

    let client = AnthropicClient::new(api_key)
        .map_err(|e| e.to_string())?;

    *state.client.lock().unwrap() = Some(client);
    Ok(())
}

#[tauri::command]
pub async fn send_chat_message(
    message: String,
    state: State<'_, AppState>,
) -> Result<String, String> {
    let client_guard = state.client.lock().unwrap();
    let client = client_guard
        .as_ref()
        .ok_or("API key not configured")?;

    let messages = vec![Message {
        role: "user".to_string(),
        content: message,
    }];

    client
        .send_message(messages, "claude-3-5-sonnet-20241022", 1024)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_api_key(
    state: State<'_, AppState>,
) -> Result<bool, String> {
    match state.keychain.get_api_key() {
        Ok(key) if !key.is_empty() => Ok(true),
        _ => Ok(false),
    }
}
```

### Main Application (src-tauri/src/main.rs)

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod anthropic;
mod commands;
mod keychain;

use commands::chat::{AppState, save_api_key, send_chat_message, check_api_key};
use keychain::KeychainStorage;
use std::sync::Mutex;

fn main() {
    let keychain = KeychainStorage::new("tauri-anthropic-app");

    let app_state = AppState {
        client: Mutex::new(None),
        keychain,
    };

    tauri::Builder::default()
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            save_api_key,
            send_chat_message,
            check_api_key
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## 🎨 Frontend Integration

### React Component with WASM

```typescript
import { invoke } from '@tauri-apps/api/tauri';
import { useEffect, useState } from 'react';
import init, { ReasoningBank } from './wasm/reasoningbank';

function ChatApp() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [reasoningBank, setReasoningBank] = useState<ReasoningBank | null>(null);

  useEffect(() => {
    // Initialize WASM modules
    init().then(() => {
      const bank = new ReasoningBank();
      setReasoningBank(bank);
    });

    // Check if API key is configured
    invoke<boolean>('check_api_key').then(setApiKeyConfigured);
  }, []);

  const sendMessage = async () => {
    try {
      // Store message context in WASM memory
      if (reasoningBank) {
        reasoningBank.store_context(message);
      }

      // Send to Anthropic API via Tauri backend
      const result = await invoke<string>('send_chat_message', {
        message
      });

      setResponse(result);

      // Store response pattern in WASM
      if (reasoningBank) {
        reasoningBank.store_pattern(result);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="chat-container">
      <h1>Anthropic Chat (Tauri + WASM)</h1>
      {!apiKeyConfigured && <ApiKeySetup />}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Enter your message..."
      />
      <button onClick={sendMessage}>Send</button>
      {response && <div className="response">{response}</div>}
    </div>
  );
}
```

## 📦 Cargo.toml Configuration

```toml
[package]
name = "tauri-anthropic-app"
version = "0.1.0"
edition = "2021"

[dependencies]
# Tauri
tauri = { version = "1.5", features = ["shell-open"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Anthropic API
reqwest = { version = "0.11", features = ["json"] }
anyhow = "1.0"

# Secure storage
keyring = "2.3"

# Async runtime
tokio = { version = "1.35", features = ["full"] }

# WASM integration (reuse existing)
reasoningbank-wasm = { path = "../../reasoningbank/crates/reasoningbank-wasm" }
agent-booster-wasm = { path = "../../agent-booster/crates/agent-booster-wasm" }

[build-dependencies]
tauri-build = { version = "1.5", features = [] }
```

## 🎯 Environment Configuration

### .env.example

```bash
# Development only - DO NOT commit real keys
ANTHROPIC_API_KEY=sk-ant-...

# App Configuration
APP_NAME=TauriAnthropicApp
LOG_LEVEL=info
```

### Loading Environment Variables

```rust
// Only for development - production uses keychain
#[cfg(debug_assertions)]
fn load_dev_api_key() -> Option<String> {
    std::env::var("ANTHROPIC_API_KEY").ok()
}

#[cfg(not(debug_assertions))]
fn load_dev_api_key() -> Option<String> {
    None // Production must use keychain
}
```

## 🧪 Testing Strategy

### Using Agentic-Flow TDD

```bash
# Spawn test agents in parallel
Task("Unit Test Writer", "Create Rust unit tests for Anthropic client", "tester")
Task("Integration Test Writer", "Create Tauri command integration tests", "tester")
Task("E2E Test Writer", "Create frontend E2E tests with Playwright", "tester")

# Run tests with coordination
npx claude-flow sparc run refinement "Test Tauri Anthropic integration"
```

## 🚀 Building & Running

### Development

```bash
# Install Tauri CLI
cargo install tauri-cli

# Run in dev mode
cargo tauri dev
```

### Production Build

```bash
# Build with optimized WASM
cd crates/reasoningbank-wasm
wasm-pack build --target web --release

cd ../../
cargo tauri build
```

## 🔗 Agentic-Flow Integration Patterns

### Hook-Based Coordination

Create `.agentdb-instructions.md` in your Tauri project:

```markdown
## Pre-Task Hook
- Check API key security
- Validate WASM module integrity

## Post-Edit Hook
- Auto-format Rust code
- Update type definitions
- Rebuild WASM if needed

## Post-Task Hook
- Run security audit
- Update documentation
- Commit changes
```

### Memory Coordination

```typescript
// Agents coordinate through AgentDB memory
await agentdb.store("tauri/architecture", architectureDecisions);
await agentdb.store("tauri/api-patterns", apiPatterns);

// Other agents retrieve context
const architecture = await agentdb.recall("tauri/architecture");
```

## 🎉 Benefits of Agentic-Flow Approach

✅ **Parallel Development**: Multiple agents work concurrently
✅ **Consistent Architecture**: Shared memory ensures coherent design
✅ **Automated Testing**: Test agents run continuously
✅ **Security First**: Security reviewer validates all changes
✅ **Performance**: WASM + QUIC transport for fast operations
✅ **Type Safety**: Rust backend + TypeScript frontend

## 📚 Next Steps

1. **Initialize Project**:
   ```bash
   npm create tauri-app@latest
   ```

2. **Use Agentic-Flow**:
   ```bash
   npx claude-flow sparc tdd "Implement features from this guide"
   ```

3. **Spawn Development Swarm**:
   - Architecture agent for design
   - Backend agent for Rust implementation
   - Frontend agent for UI
   - Security agent for continuous auditing
   - Test agent for TDD
   - Documentation agent for guides

4. **Deploy**: Build and distribute your secure Tauri app!

---

**Remember**: All API keys in **keychain only**, never in code or localStorage! 🔐

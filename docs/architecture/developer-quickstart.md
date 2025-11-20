# Tauri-OS Developer Quickstart Guide

**Version:** 1.0.0
**Date:** 2025-11-20
**Target Audience:** Developers implementing the Tauri-OS architecture

---

## Quick Setup

```bash
# 1. Clone repository
cd /home/user/agentic-flow

# 2. Install dependencies
npm install

# 3. Build AgentDB
cd packages/agentdb
npm run build
cd ../..

# 4. Build Math Framework WASM
cd crates/math-framework-wasm
wasm-pack build --target web
cd ../..

# 5. Create Tauri OS project
./scripts/create-tauri-anthropic-app.sh tauri-os
cd tauri-os

# 6. Run development server
npm run tauri dev
```

---

## Key Integration Points

### 1. QUIC IPC Setup

**Rust Backend:**
```rust
// src-tauri/src/quic_ipc.rs
use crate::transport::quic::{QuicClient, QuicServer, QuicStream};

pub struct QuicIPC {
    server: QuicServer,
    client: QuicClient,
}

impl QuicIPC {
    pub async fn new(port: u16) -> Result<Self> {
        let server = QuicServer::new(QuicConfig {
            host: "127.0.0.1".to_string(),
            port,
            cert_path: "./certs/cert.pem".to_string(),
            key_path: "./certs/key.pem".to_string(),
            ..Default::default()
        });

        let client = QuicClient::new(QuicConfig {
            server_host: "127.0.0.1".to_string(),
            server_port: port,
            ..Default::default()
        });

        server.initialize().await?;
        server.listen().await?;
        client.initialize().await?;

        Ok(Self { server, client })
    }

    pub async fn send(&self, target: ProcessId, msg: IPCMessage) -> Result<IPCResponse> {
        let conn = self.client.connect("127.0.0.1", target.port()).await?;
        let stream = self.client.create_stream(&conn.id).await?;

        let serialized = bincode::serialize(&msg)?;
        stream.send(serialized.into()).await?;

        let response = stream.receive().await?;
        Ok(bincode::deserialize(&response)?)
    }
}
```

**Tauri Command:**
```rust
// src-tauri/src/commands.rs
#[tauri::command]
async fn send_ipc_message(
    target: String,
    message: serde_json::Value,
    state: State<'_, QuicIPC>
) -> Result<serde_json::Value, String> {
    let msg = IPCMessage::from_json(message)
        .map_err(|e| e.to_string())?;

    let response = state.send(target, msg).await
        .map_err(|e| e.to_string())?;

    Ok(response.to_json())
}
```

**TypeScript Usage:**
```typescript
// src/services/ipc.ts
import { invoke } from '@tauri-apps/api/tauri';

export async function sendIPCMessage(
  target: string,
  message: any
): Promise<any> {
  return await invoke('send_ipc_message', { target, message });
}
```

### 2. AgentDB Integration

**Rust Backend:**
```rust
// src-tauri/src/memory/mod.rs
use agentdb::{AgentDB, Episode, Skill};

pub struct OSMemoryManager {
    agentdb: AgentDB,
}

impl OSMemoryManager {
    pub async fn new() -> Result<Self> {
        let agentdb = AgentDB::new(AgentDBConfig {
            dimensions: 1536,
            metric: "cosine",
            quantization: Some("uint8"),
            hnsw: Some(HNSWConfig {
                ef_construction: 200,
                m: 16,
            }),
        }).await?;

        Ok(Self { agentdb })
    }

    pub async fn semantic_search(&self, query: &str) -> Result<Vec<SearchResult>> {
        let embedding = self.agentdb.embed(query).await?;
        let results = self.agentdb.search(&embedding, 10).await?;

        Ok(results.into_iter().map(|r| SearchResult {
            path: r.metadata.get("path").unwrap().clone(),
            similarity: r.similarity,
        }).collect())
    }
}
```

**Tauri Command:**
```rust
#[tauri::command]
async fn semantic_file_search(
    query: String,
    state: State<'_, OSMemoryManager>
) -> Result<Vec<SearchResult>, String> {
    state.semantic_search(&query).await
        .map_err(|e| e.to_string())
}
```

**TypeScript Usage:**
```typescript
// src/hooks/useSemanticSearch.ts
import { invoke } from '@tauri-apps/api/tauri';

export function useSemanticSearch() {
  const search = async (query: string): Promise<SearchResult[]> => {
    return await invoke('semantic_file_search', { query });
  };

  return { search };
}

// React Component
export const SearchBar: React.FC = () => {
  const { search } = useSemanticSearch();
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async (query: string) => {
    const results = await search(query);
    setResults(results);
  };

  return (
    <input
      type="text"
      onChange={(e) => handleSearch(e.target.value)}
      placeholder="Search anything..."
    />
  );
};
```

### 3. Agent Swarm Orchestration

**TypeScript Setup:**
```typescript
// src/swarm/os-orchestrator.ts
import { AgentDBSwarmOrchestrator } from '@/swarm/agentdb-swarm-orchestrator';

export class OSSwarmOrchestrator extends AgentDBSwarmOrchestrator {
  async startOSServices(): Promise<void> {
    // Spawn system agents
    await Promise.all([
      this.spawnAgent('window-manager'),
      this.spawnAgent('process-coordinator'),
      this.spawnAgent('file-indexer'),
      this.spawnAgent('network-monitor'),
      this.spawnAgent('power-optimizer'),
    ]);
  }

  async optimizeWindowLayout(windows: WindowState[]): Promise<Layout> {
    const taskId = await this.submitTask({
      type: 'window_layout_optimization',
      priority: 'medium',
      data: { windows },
    });

    return await this.getTaskResult(taskId);
  }
}
```

**React Integration:**
```typescript
// src/context/SwarmContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';

const SwarmContext = createContext<OSSwarmOrchestrator | null>(null);

export const SwarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [swarm, setSwarm] = useState<OSSwarmOrchestrator | null>(null);

  useEffect(() => {
    const initSwarm = async () => {
      const orchestrator = new OSSwarmOrchestrator({
        topology: 'adaptive',
        maxAgents: 100,
      });

      await orchestrator.start();
      await orchestrator.startOSServices();

      setSwarm(orchestrator);
    };

    initSwarm();

    return () => {
      swarm?.stop();
    };
  }, []);

  return (
    <SwarmContext.Provider value={swarm}>
      {children}
    </SwarmContext.Provider>
  );
};

export const useSwarm = () => {
  const context = useContext(SwarmContext);
  if (!context) throw new Error('useSwarm must be used within SwarmProvider');
  return context;
};
```

### 4. Event Bus Integration

**Setup Event Bus:**
```typescript
// src/events/system-event-bus.ts
import { AureliaEventBus } from '@/holographic-desktop/event-bus';

export class SystemEventBus extends AureliaEventBus {
  // Window events
  emitWindowCreated(windowId: string, state: WindowState): void {
    this.emit('window_created', { windowId, state });
  }

  // System health
  emitSystemAlert(severity: AlertSeverity, message: string): void {
    this.emit('system_alert', { severity, message });
  }

  // Performance metrics
  emitPerformanceMetrics(metrics: PerformanceMetrics): void {
    this.emit('performance_metrics', metrics);
  }
}

// Singleton instance
export const systemEventBus = new SystemEventBus();
```

**React Component Subscription:**
```typescript
// src/components/SystemTray.tsx
import { useEffect, useState } from 'react';
import { systemEventBus } from '@/events/system-event-bus';

export const SystemTray: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const handleAlert = (event: any) => {
      setAlerts(prev => [...prev, event.payload]);

      // Show notification for critical alerts
      if (event.payload.severity === 'critical') {
        showNotification(event.payload.message);
      }
    };

    systemEventBus.on('system_alert', handleAlert);

    return () => {
      systemEventBus.off('system_alert', handleAlert);
    };
  }, []);

  return (
    <div className="system-tray">
      {alerts.map(alert => (
        <AlertBadge key={alert.timestamp} alert={alert} />
      ))}
    </div>
  );
};
```

### 5. WASM Math Framework

**Load WASM Module:**
```typescript
// src/wasm/math-framework.ts
import init, { PhaseSpace, NeuralNetwork } from '@/wasm/math-framework-wasm';

let initialized = false;

export async function initMathFramework(): Promise<void> {
  if (initialized) return;

  await init();
  initialized = true;
}

export class MathFrameworkWASM {
  private phaseSpace?: PhaseSpace;
  private neuralNet?: NeuralNetwork;

  async initialize(): Promise<void> {
    await initMathFramework();
    this.phaseSpace = new PhaseSpace();
    this.neuralNet = new NeuralNetwork();
  }

  async analyzeSystemMetrics(data: number[][]): Promise<TrajectoryAnalysis> {
    if (!this.phaseSpace) throw new Error('Not initialized');
    return this.phaseSpace.analyze(data);
  }

  async predictPerformance(input: number[]): Promise<number[]> {
    if (!this.neuralNet) throw new Error('Not initialized');
    return this.neuralNet.predict(input);
  }
}
```

**React Usage:**
```typescript
// src/components/PerformanceChart.tsx
import { useEffect, useState } from 'react';
import { MathFrameworkWASM } from '@/wasm/math-framework';

export const PerformanceChart: React.FC = () => {
  const [mathFramework] = useState(() => new MathFrameworkWASM());
  const [trajectory, setTrajectory] = useState<TrajectoryAnalysis | null>(null);

  useEffect(() => {
    mathFramework.initialize();
  }, []);

  const analyzeMetrics = async (metrics: number[][]) => {
    const analysis = await mathFramework.analyzeSystemMetrics(metrics);
    setTrajectory(analysis);
  };

  return (
    <div>
      {trajectory && (
        <PhaseSpacePlot data={trajectory} />
      )}
    </div>
  );
};
```

### 6. Window Manager Implementation

**Rust Window Manager:**
```rust
// src-tauri/src/window/manager.rs
use tauri::{Manager, Window, WindowBuilder};

pub struct WindowManagerService {
    windows: HashMap<WindowId, WindowState>,
    quic_ipc: QuicIPC,
    memory: OSMemoryManager,
    agent_coordinator: AgentCoordinator,
}

impl WindowManagerService {
    pub async fn create_window(&mut self, config: WindowConfig) -> Result<WindowId> {
        // 1. Submit to agent swarm
        let task_id = self.agent_coordinator.submit_task(AgentTask {
            task_type: TaskType::WindowCreate,
            priority: TaskPriority::High,
            data: serde_json::to_value(config.clone())?,
        }).await?;

        // 2. Create Tauri window
        let window = WindowBuilder::new(
            &self.app_handle,
            &config.label,
            tauri::WindowUrl::App(config.url.into())
        )
        .title(&config.title)
        .inner_size(config.width, config.height)
        .position(config.x, config.y)
        .build()?;

        let window_id = WindowId::new();

        // 3. Register with QUIC IPC
        let port = self.allocate_port()?;
        self.quic_ipc.register_window(window_id, port).await?;

        // 4. Store state
        let state = WindowState {
            id: window_id,
            title: config.title.clone(),
            position: (config.x, config.y),
            size: (config.width, config.height),
            is_focused: false,
        };

        self.windows.insert(window_id, state.clone());

        // 5. Record in AgentDB
        self.memory.record_user_action(UserAction {
            action_type: ActionType::WindowCreate,
            context: serde_json::to_string(&config)?,
            result: serde_json::to_string(&state)?,
            success: true,
        }).await?;

        Ok(window_id)
    }
}
```

**Tauri Commands:**
```rust
// src-tauri/src/commands/window.rs
#[tauri::command]
async fn create_window(
    config: WindowConfig,
    state: State<'_, WindowManagerService>
) -> Result<WindowId, String> {
    state.create_window(config).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn close_window(
    window_id: WindowId,
    state: State<'_, WindowManagerService>
) -> Result<(), String> {
    state.close_window(window_id).await
        .map_err(|e| e.to_string())
}
```

---

## Code Patterns

### Pattern 1: Rust Performance + TypeScript Intelligence

```
┌─────────────────────────────────────────┐
│  TypeScript (Intelligence)             │
│  - Agent coordination                   │
│  - Layout optimization                  │
│  - Learning from patterns               │
└────────────┬────────────────────────────┘
             │ Tauri IPC
             ▼
┌─────────────────────────────────────────┐
│  Rust (Performance)                     │
│  - Window creation                      │
│  - Process spawning                     │
│  - File operations                      │
└─────────────────────────────────────────┘
```

**Example:**
```typescript
// TypeScript decides optimal layout
const layout = await swarm.optimizeWindowLayout(windows);

// Rust executes the layout quickly
await invoke('apply_window_layout', { layout });
```

### Pattern 2: Event-Driven Architecture

```typescript
// Emit event from anywhere
systemEventBus.emit('window_created', { windowId, state });

// Multiple components react
// Component 1: Update window list
windowListComponent.on('window_created', updateList);

// Component 2: Show notification
notificationComponent.on('window_created', showNotification);

// Component 3: Record analytics
analyticsComponent.on('window_created', recordEvent);
```

### Pattern 3: Memory-Backed Operations

```typescript
// Before operation: Get recommendations from memory
const recommendations = await memory.getRecommendations({
  current_app: 'VSCode',
  current_directory: '~/projects',
});

// After operation: Record for learning
await memory.record_user_action({
  action_type: 'app_open',
  context: 'VSCode in ~/projects',
  result: 'Terminal opened',
  success: true,
});
```

### Pattern 4: Agent Task Submission

```typescript
// Submit task to swarm
const taskId = await swarm.submitTask({
  type: 'optimize_performance',
  priority: 'high',
  data: { cpu: 85, memory: 70 },
});

// Agents work in parallel
// Wait for result
const result = await swarm.getTaskResult(taskId);

// Apply optimization
await applyOptimization(result);
```

---

## Testing Patterns

### Unit Testing (Rust)

```rust
// src-tauri/src/window/manager_test.rs
#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_window_creation() {
        let mut manager = WindowManagerService::new_test();

        let config = WindowConfig {
            title: "Test Window".to_string(),
            width: 800,
            height: 600,
            ..Default::default()
        };

        let window_id = manager.create_window(config).await.unwrap();

        assert!(manager.windows.contains_key(&window_id));
    }

    #[tokio::test]
    async fn test_quic_ipc_latency() {
        let quic_ipc = QuicIPC::new(4433).await.unwrap();

        let start = Instant::now();
        let response = quic_ipc.send(target, message).await.unwrap();
        let latency = start.elapsed();

        assert!(latency < Duration::from_millis(5));
    }
}
```

### Integration Testing (TypeScript)

```typescript
// src/__tests__/swarm-integration.test.ts
import { describe, it, expect, beforeAll } from '@jest/globals';
import { OSSwarmOrchestrator } from '@/swarm/os-orchestrator';

describe('Swarm Integration', () => {
  let swarm: OSSwarmOrchestrator;

  beforeAll(async () => {
    swarm = new OSSwarmOrchestrator();
    await swarm.start();
  });

  it('should spawn system agents', async () => {
    await swarm.startOSServices();

    const state = swarm.getState();
    expect(state.activeAgents).toBeGreaterThanOrEqual(5);
  });

  it('should process tasks in parallel', async () => {
    const tasks = Array.from({ length: 100 }, (_, i) => ({
      type: 'test_task',
      priority: 'medium',
      data: { index: i },
    }));

    const start = Date.now();
    const taskIds = await swarm.submitBatch(tasks);
    await Promise.all(taskIds.map(id => swarm.getTaskResult(id)));
    const duration = Date.now() - start;

    // Should complete faster than sequential (< 1 second)
    expect(duration).toBeLessThan(1000);
  });
});
```

### E2E Testing (Playwright)

```typescript
// tests/e2e/window-creation.test.ts
import { test, expect } from '@playwright/test';

test('create and close window', async ({ page }) => {
  await page.goto('http://localhost:1420');

  // Click "New Window" button
  await page.click('[data-testid="new-window-btn"]');

  // Wait for window to appear
  await page.waitForSelector('[data-testid="window-1"]', { timeout: 1000 });

  // Verify window is visible
  const window = await page.locator('[data-testid="window-1"]');
  await expect(window).toBeVisible();

  // Close window
  await page.click('[data-testid="close-window-1"]');

  // Verify window is gone
  await expect(window).not.toBeVisible();
});
```

---

## Performance Monitoring

### Setup Monitoring

```typescript
// src/monitoring/performance.ts
import { systemEventBus } from '@/events/system-event-bus';

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    cpu: 0,
    memory: 0,
    quicLatency: 0,
    agentTasks: 0,
  };

  async start(): Promise<void> {
    setInterval(async () => {
      this.metrics = await this.collectMetrics();

      // Emit to event bus
      systemEventBus.emitPerformanceMetrics(this.metrics);

      // Alert if thresholds exceeded
      if (this.metrics.quicLatency > 5) {
        systemEventBus.emitSystemAlert('warning', 'QUIC latency degraded');
      }
    }, 100); // Every 100ms
  }

  private async collectMetrics(): Promise<PerformanceMetrics> {
    return {
      cpu: await invoke('get_cpu_usage'),
      memory: await invoke('get_memory_usage'),
      quicLatency: await invoke('get_quic_latency'),
      agentTasks: await invoke('get_agent_throughput'),
    };
  }
}
```

### Visualize Metrics

```typescript
// src/components/MetricsDashboard.tsx
import { useEffect, useState } from 'react';
import { systemEventBus } from '@/events/system-event-bus';

export const MetricsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>();

  useEffect(() => {
    systemEventBus.on('performance_metrics', (event) => {
      setMetrics(event.payload);
    });
  }, []);

  return (
    <div className="metrics-dashboard">
      <MetricCard title="CPU" value={`${metrics?.cpu}%`} />
      <MetricCard title="Memory" value={`${metrics?.memory} MB`} />
      <MetricCard title="QUIC Latency" value={`${metrics?.quicLatency} ms`} />
      <MetricCard title="Agent Tasks/sec" value={metrics?.agentTasks} />
    </div>
  );
};
```

---

## Debugging Tips

### 1. QUIC IPC Debugging

```rust
// Enable QUIC debug logging
env::set_var("RUST_LOG", "quinn=debug");
```

### 2. AgentDB Query Debugging

```typescript
// Enable AgentDB query logging
agentdb.enableDebugLogging();

// Log all searches
const results = await agentdb.search(query, 10);
console.log('Search results:', results);
```

### 3. Event Bus Tracing

```typescript
// Enable event tracing
systemEventBus.enableTracing();

// View event replay buffer
const events = systemEventBus.getReplayBuffer();
console.log('Recent events:', events);
```

### 4. Agent Task Monitoring

```typescript
// Get swarm metrics
const metrics = swarm.getPerformanceMetrics();
console.log('Swarm metrics:', metrics);

// Get specific agent metrics
const agentMetrics = swarm.getAgentMetrics(agentId);
console.log('Agent metrics:', agentMetrics);
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Forgetting to Initialize QUIC

**Problem:**
```typescript
// ❌ Trying to send IPC before QUIC initialized
await sendIPCMessage(target, message);
// Error: QUIC client not initialized
```

**Solution:**
```typescript
// ✅ Initialize QUIC first
await quicIPC.initialize();
await sendIPCMessage(target, message);
```

### Pitfall 2: Blocking the UI Thread

**Problem:**
```typescript
// ❌ Synchronous operation blocks UI
const results = heavyComputation(data); // UI freezes
```

**Solution:**
```typescript
// ✅ Use WASM or Web Worker
const results = await mathFramework.analyze(data); // Non-blocking
```

### Pitfall 3: Not Handling Agent Task Failures

**Problem:**
```typescript
// ❌ No error handling
const result = await swarm.getTaskResult(taskId);
```

**Solution:**
```typescript
// ✅ Handle failures gracefully
try {
  const result = await swarm.getTaskResult(taskId, 30000);
} catch (error) {
  console.error('Task failed:', error);
  // Retry or fallback
}
```

---

## Next Steps

1. **Set up development environment** (see Quick Setup)
2. **Implement QUIC IPC** (Pattern 1)
3. **Integrate AgentDB** (Pattern 2)
4. **Set up agent swarm** (Pattern 3)
5. **Build first prototype** (Window creation)
6. **Add performance monitoring** (Pattern 4)
7. **Write tests** (Testing Patterns)

---

## Useful Commands

```bash
# Development
npm run tauri dev          # Run development server
npm run build              # Build for production
npm run tauri build        # Build Tauri app

# Testing
npm run test               # Run unit tests
npm run test:e2e           # Run E2E tests
npm run bench              # Run benchmarks

# AgentDB
npx agentdb init           # Initialize AgentDB
npx agentdb stats          # Show database stats

# QUIC
npm run quic:bench         # Benchmark QUIC transport
```

---

**Happy Coding!** 🚀

For questions or issues, refer to the [Main Architecture Document](./tauri-os-architecture.md) or [ADRs](./adrs.md).

---

**Document Status:** ✅ Complete
**Last Updated:** 2025-11-20
**Version:** 1.0.0

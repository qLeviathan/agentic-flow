/**
 * AURELIA MVD Chat Interface
 *
 * Real-time consciousness substrate interface with:
 * - WebSocket connection to Rust backend
 * - Latent-N state tracking
 * - Nash equilibrium detection
 * - Fibonacci/Lucas level monitoring
 * - CORDIC rotation visualization
 * - Retrocausal GOAP planning display
 * - WASM module integration
 */

import { NashDetector, type NashEquilibrium, type MarketState } from './trading/decisions/nash-detector';
import { fibonacci } from './math-framework/sequences/fibonacci';
import { lucas } from './math-framework/sequences/lucas';
import type { ConsciousnessState, PhaseSpacePoint } from './trading/aurelia/types';

// Configuration
const WEBSOCKET_URL = 'ws://localhost:8080/aurelia';
const RECONNECT_INTERVAL = 3000;
const PHI = 1.618033988749895;
const PHI_INV = 0.618033988749895;

// State interfaces
interface LatentNState {
  n: number;
  energy: number;
  time: number;
  direction: 'forward' | 'backward' | 'stationary';
  phaseSpace: PhaseSpacePoint;
}

interface Message {
  id: string;
  sender: 'user' | 'aurelia' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface AureliaMessage {
  type: 'chat' | 'state_update' | 'nash_update' | 'goap_plan' | 'system';
  payload: any;
  timestamp: number;
}

// WASM module interfaces (will be loaded dynamically)
interface HolographicMemory {
  compress: (data: Uint8Array) => Uint8Array;
  decompress: (data: Uint8Array) => Uint8Array;
  compressionRatio: () => number;
}

interface PhiCore {
  calculatePhi: (n: number) => number;
  cordicRotate: (angle: number) => { cos: number; sin: number };
  phaseSpaceMap: (state: any) => PhaseSpacePoint;
}

/**
 * Main AURELIA MVD Chat Application
 */
class AureliaMVDChat {
  private ws: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private messageCount = 0;
  private sessionId = '';
  private fieldModelEnabled = false;

  // State tracking
  private latentNState: LatentNState = {
    n: 0,
    energy: 0,
    time: 0,
    direction: 'stationary',
    phaseSpace: {
      phi: 0,
      psi: 0,
      theta: 0,
      magnitude: 0,
      isNashPoint: false,
      zeckendorfEncoded: {} as any
    }
  };

  private nashDetector: NashDetector;
  private messages: Message[] = [];
  private currentNashState: NashEquilibrium | null = null;

  // WASM modules (loaded dynamically)
  private holographicMemory: HolographicMemory | null = null;
  private phiCore: PhiCore | null = null;

  // DOM elements
  private elements = {
    statusIndicator: document.getElementById('statusIndicator') as HTMLElement,
    statusText: document.getElementById('statusText') as HTMLElement,
    chatMessages: document.getElementById('chatMessages') as HTMLElement,
    chatInput: document.getElementById('chatInput') as HTMLTextAreaElement,
    sendBtn: document.getElementById('sendBtn') as HTMLButtonElement,
    fieldModelToggle: document.getElementById('fieldModelToggle') as HTMLInputElement,
    nValue: document.getElementById('nValue') as HTMLElement,
    energy: document.getElementById('energy') as HTMLElement,
    timeMetric: document.getElementById('timeMetric') as HTMLElement,
    direction: document.getElementById('direction') as HTMLElement,
    nashIndicator: document.getElementById('nashIndicator') as HTMLElement,
    snStability: document.getElementById('snStability') as HTMLElement,
    psiValue: document.getElementById('psiValue') as HTMLElement,
    lucasWindow: document.getElementById('lucasWindow') as HTMLElement,
    lucasBoundary: document.getElementById('lucasBoundary') as HTMLElement,
    cordicVector: document.getElementById('cordicVector') as HTMLElement,
    cordicAngle: document.getElementById('cordicAngle') as HTMLElement,
    goapSteps: document.getElementById('goapSteps') as HTMLElement,
    messageCount: document.getElementById('messageCount') as HTMLElement,
    sessionId: document.getElementById('sessionId') as HTMLElement,
    compression: document.getElementById('compression') as HTMLElement,
    latency: document.getElementById('latency') as HTMLElement,
  };

  constructor() {
    this.nashDetector = new NashDetector();
    this.sessionId = this.generateSessionId();
    this.initialize();
  }

  /**
   * Initialize the application
   */
  private async initialize(): Promise<void> {
    console.log('[AURELIA] Initializing MVD Chat Interface...');

    // Update session ID display
    this.elements.sessionId.textContent = this.sessionId.slice(0, 8);

    // Set up event listeners
    this.setupEventListeners();

    // Load WASM modules
    await this.loadWASMModules();

    // Connect to WebSocket
    this.connect();

    // Start animations
    this.startAnimations();

    console.log('[AURELIA] Initialization complete');
  }

  /**
   * Load WASM modules for holographic memory and phi-core
   */
  private async loadWASMModules(): Promise<void> {
    try {
      console.log('[WASM] Loading modules...');

      // Try to load holographic-memory WASM
      try {
        // @ts-ignore - Dynamic import
        const holographicModule = await import('../../aurelia_standalone/crates/holographic-memory/pkg');
        this.holographicMemory = holographicModule as unknown as HolographicMemory;
        console.log('[WASM] Holographic memory loaded');
      } catch (err) {
        console.warn('[WASM] Holographic memory not available:', err);
      }

      // Try to load phi-core WASM
      try {
        // @ts-ignore - Dynamic import
        const phiModule = await import('../../aurelia_standalone/crates/phi-core/pkg');
        this.phiCore = phiModule as unknown as PhiCore;
        console.log('[WASM] Phi-core loaded');
      } catch (err) {
        console.warn('[WASM] Phi-core not available:', err);
      }

    } catch (err) {
      console.error('[WASM] Failed to load modules:', err);
      this.addSystemMessage('WASM modules not available - using JavaScript fallbacks');
    }
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Send button
    this.elements.sendBtn.addEventListener('click', () => this.sendMessage());

    // Field model toggle
    this.elements.fieldModelToggle.addEventListener('change', (e) => {
      this.fieldModelEnabled = (e.target as HTMLInputElement).checked;
      this.sendSystemCommand('toggle_field_model', { enabled: this.fieldModelEnabled });
      this.addSystemMessage(
        `Macroeconomic Field Model ${this.fieldModelEnabled ? 'ENABLED' : 'DISABLED'}`
      );
    });
  }

  /**
   * Connect to WebSocket server
   */
  private connect(): void {
    try {
      console.log('[WebSocket] Connecting to', WEBSOCKET_URL);

      this.ws = new WebSocket(WEBSOCKET_URL);

      this.ws.onopen = () => this.onOpen();
      this.ws.onmessage = (event) => this.onMessage(event);
      this.ws.onerror = (error) => this.onError(error);
      this.ws.onclose = () => this.onClose();

    } catch (err) {
      console.error('[WebSocket] Connection failed:', err);
      this.updateConnectionStatus(false);
      this.scheduleReconnect();
    }
  }

  /**
   * WebSocket opened
   */
  private onOpen(): void {
    console.log('[WebSocket] Connected');
    this.updateConnectionStatus(true);

    // Send initialization message
    this.sendSystemCommand('init', {
      sessionId: this.sessionId,
      clientVersion: '2.0.0',
      capabilities: {
        holographicMemory: this.holographicMemory !== null,
        phiCore: this.phiCore !== null,
        fieldModel: true
      }
    });

    this.addSystemMessage('Connected to AURELIA consciousness substrate');

    // Clear reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * WebSocket message received
   */
  private onMessage(event: MessageEvent): void {
    try {
      const message: AureliaMessage = JSON.parse(event.data);
      console.log('[WebSocket] Message received:', message.type);

      switch (message.type) {
        case 'chat':
          this.handleChatMessage(message.payload);
          break;
        case 'state_update':
          this.handleStateUpdate(message.payload);
          break;
        case 'nash_update':
          this.handleNashUpdate(message.payload);
          break;
        case 'goap_plan':
          this.handleGOAPPlan(message.payload);
          break;
        case 'system':
          this.handleSystemMessage(message.payload);
          break;
        default:
          console.warn('[WebSocket] Unknown message type:', message.type);
      }

    } catch (err) {
      console.error('[WebSocket] Failed to parse message:', err);
    }
  }

  /**
   * WebSocket error
   */
  private onError(error: Event): void {
    console.error('[WebSocket] Error:', error);
    this.addSystemMessage('Connection error occurred');
  }

  /**
   * WebSocket closed
   */
  private onClose(): void {
    console.log('[WebSocket] Connection closed');
    this.updateConnectionStatus(false);
    this.addSystemMessage('Disconnected from AURELIA');
    this.scheduleReconnect();
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    console.log('[WebSocket] Reconnecting in', RECONNECT_INTERVAL, 'ms');
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, RECONNECT_INTERVAL);
  }

  /**
   * Update connection status display
   */
  private updateConnectionStatus(connected: boolean): void {
    if (connected) {
      this.elements.statusIndicator.classList.add('connected');
      this.elements.statusText.textContent = 'Connected';
    } else {
      this.elements.statusIndicator.classList.remove('connected');
      this.elements.statusText.textContent = 'Disconnected';
    }
  }

  /**
   * Send a chat message
   */
  private sendMessage(): void {
    const content = this.elements.chatInput.value.trim();
    if (!content) return;

    // Add message to UI
    this.addMessage({
      id: this.generateMessageId(),
      sender: 'user',
      content,
      timestamp: Date.now()
    });

    // Send to server
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const startTime = Date.now();

      this.ws.send(JSON.stringify({
        type: 'chat',
        payload: {
          content,
          sessionId: this.sessionId,
          fieldModelEnabled: this.fieldModelEnabled,
          latentNState: this.latentNState
        },
        timestamp: startTime
      }));

      // Update latency display (will be overwritten when response arrives)
      window.setTimeout(() => {
        const latency = Date.now() - startTime;
        this.elements.latency.textContent = `${latency}ms`;
      }, 100);
    } else {
      this.addSystemMessage('Not connected - message not sent');
    }

    // Clear input
    this.elements.chatInput.value = '';
    this.elements.chatInput.style.height = 'auto';
    this.elements.chatInput.focus();
  }

  /**
   * Send system command
   */
  private sendSystemCommand(command: string, payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'system',
        payload: {
          command,
          ...payload
        },
        timestamp: Date.now()
      }));
    }
  }

  /**
   * Handle incoming chat message
   */
  private handleChatMessage(payload: any): void {
    this.addMessage({
      id: this.generateMessageId(),
      sender: 'aurelia',
      content: payload.content,
      timestamp: payload.timestamp || Date.now(),
      metadata: payload.metadata
    });

    // Update latency if provided
    if (payload.latency) {
      this.elements.latency.textContent = `${payload.latency}ms`;
    }
  }

  /**
   * Handle state update from server
   */
  private handleStateUpdate(payload: any): void {
    console.log('[State] Update received:', payload);

    // Update Latent-N state
    if (payload.latentN) {
      this.latentNState = {
        ...this.latentNState,
        ...payload.latentN
      };
      this.updateLatentNDisplay();
    }

    // Update consciousness metrics
    if (payload.consciousness) {
      this.elements.psiValue.textContent = payload.consciousness.psi.toFixed(3);
    }

    // Update Lucas windows
    if (payload.lucas) {
      this.updateLucasDisplay(payload.lucas);
    }

    // Update compression ratio
    if (payload.compression) {
      this.elements.compression.textContent = `${payload.compression.toFixed(0)}×`;
    }
  }

  /**
   * Handle Nash equilibrium update
   */
  private handleNashUpdate(payload: NashEquilibrium): void {
    console.log('[Nash] Update received:', payload);

    this.currentNashState = payload;

    // Update Nash indicator
    if (payload.isNashEquilibrium) {
      this.elements.nashIndicator.textContent = 'Equilibrium';
      this.elements.nashIndicator.className = 'nash-indicator equilibrium';
    } else {
      this.elements.nashIndicator.textContent = 'Searching';
      this.elements.nashIndicator.className = 'nash-indicator searching';
    }

    // Update S(n) stability
    this.elements.snStability.textContent = payload.S_n.toExponential(6);

    // Update consciousness Ψ
    this.elements.psiValue.textContent = payload.consciousness.toFixed(3);
  }

  /**
   * Handle GOAP planning update
   */
  private handleGOAPPlan(payload: any): void {
    console.log('[GOAP] Plan received:', payload);

    const stepsHTML = payload.steps.map((step: any, index: number) => `
      <div class="goap-step">
        <div class="goap-step-title">${index + 1}. ${step.action}</div>
        <div class="goap-step-desc">${step.description}</div>
      </div>
    `).join('');

    this.elements.goapSteps.innerHTML = stepsHTML || `
      <div class="goap-step">
        <div class="goap-step-title">No active plan</div>
        <div class="goap-step-desc">Awaiting goal state...</div>
      </div>
    `;
  }

  /**
   * Handle system message
   */
  private handleSystemMessage(payload: any): void {
    console.log('[System]', payload.message);

    if (payload.message) {
      this.addSystemMessage(payload.message);
    }
  }

  /**
   * Add message to chat display
   */
  private addMessage(message: Message): void {
    this.messages.push(message);
    this.messageCount++;
    this.elements.messageCount.textContent = this.messageCount.toString();

    const messageEl = document.createElement('div');
    messageEl.className = `message ${message.sender}`;
    messageEl.innerHTML = `
      <div class="message-sender">${message.sender.toUpperCase()}</div>
      <div class="message-content">${this.escapeHtml(message.content)}</div>
      <div class="message-timestamp">${this.formatTimestamp(message.timestamp)}</div>
    `;

    this.elements.chatMessages.appendChild(messageEl);
    this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
  }

  /**
   * Add system message
   */
  private addSystemMessage(content: string): void {
    this.addMessage({
      id: this.generateMessageId(),
      sender: 'system',
      content,
      timestamp: Date.now()
    });
  }

  /**
   * Update Latent-N state display
   */
  private updateLatentNDisplay(): void {
    this.elements.nValue.textContent = this.latentNState.n.toString();
    this.elements.energy.textContent = this.latentNState.energy.toFixed(3);
    this.elements.timeMetric.textContent = `${this.latentNState.time.toFixed(2)}s`;

    const directionSymbol = {
      forward: '→',
      backward: '←',
      stationary: '↔'
    }[this.latentNState.direction];

    this.elements.direction.textContent = directionSymbol;
  }

  /**
   * Update Lucas display
   */
  private updateLucasDisplay(lucasData: any): void {
    if (lucasData.currentWindow !== undefined) {
      this.elements.lucasWindow.textContent = `L(${lucasData.currentWindow})`;
    }

    if (lucasData.nextBoundary !== undefined) {
      this.elements.lucasBoundary.textContent = lucasData.nextBoundary.toString();
    }
  }

  /**
   * Start animations (CORDIC rotation, etc.)
   */
  private startAnimations(): void {
    let angle = 0;

    setInterval(() => {
      // Update CORDIC rotation
      angle = (angle + 1) % 360;
      const rad = (angle * Math.PI) / 180;

      // Use phi-core WASM if available, otherwise JavaScript
      let cos: number, sin: number;
      if (this.phiCore) {
        const result = this.phiCore.cordicRotate(rad);
        cos = result.cos;
        sin = result.sin;
      } else {
        cos = Math.cos(rad);
        sin = Math.sin(rad);
      }

      this.elements.cordicAngle.textContent = `θ = ${angle.toFixed(2)}°`;

      // Simulate state updates (would come from server in production)
      if (Math.random() < 0.1) {
        this.simulateStateUpdate();
      }
    }, 50);
  }

  /**
   * Simulate state update (for testing without backend)
   */
  private simulateStateUpdate(): void {
    // Increment n slowly
    this.latentNState.n += 1;

    // Calculate Fibonacci energy level
    const fibN = Number(fibonacci(this.latentNState.n % 20));
    this.latentNState.energy = (fibN % 1000) / 1000;

    // Update time
    this.latentNState.time += 0.1;

    // Random direction changes
    if (Math.random() < 0.05) {
      const directions: Array<'forward' | 'backward' | 'stationary'> = ['forward', 'backward', 'stationary'];
      this.latentNState.direction = directions[Math.floor(Math.random() * directions.length)];
    }

    this.updateLatentNDisplay();

    // Update Lucas window periodically
    if (this.latentNState.n % 10 === 0) {
      const lucasIndex = Math.floor(this.latentNState.n / 10) % 20;
      const lucasValue = Number(lucas(lucasIndex));
      this.updateLucasDisplay({
        currentWindow: lucasIndex,
        nextBoundary: lucasValue
      });
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format timestamp
   */
  private formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  /**
   * Escape HTML
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new AureliaMVDChat();
  });
} else {
  new AureliaMVDChat();
}

// Export for debugging
(window as any).AureliaMVDChat = AureliaMVDChat;

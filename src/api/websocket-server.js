/**
 * WebSocket Server for Real-time Music Collaboration
 * Enables live agent updates and multi-user collaboration
 */

const WebSocket = require('ws');
const { EventEmitter } = require('events');

class MusicWebSocketServer extends EventEmitter {
  constructor(httpServer, coordinator) {
    super();
    this.wss = new WebSocket.Server({ server: httpServer });
    this.coordinator = coordinator;
    this.clients = new Map(); // clientId -> { ws, userId, rooms }
    this.rooms = new Map(); // roomId -> Set of clientIds
    this.setupWebSocket();
    this.setupCoordinatorListeners();
  }

  /**
   * Setup WebSocket connection handling
   */
  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();

      console.log(`🔌 WebSocket client connected: ${clientId}`);

      // Initialize client
      this.clients.set(clientId, {
        ws,
        userId: null,
        rooms: new Set(),
        lastActivity: Date.now()
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connected',
        clientId,
        timestamp: Date.now()
      });

      // Handle messages
      ws.on('message', (data) => {
        this.handleMessage(clientId, data);
      });

      // Handle disconnection
      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for client ${clientId}:`, error);
      });

      // Ping/Pong for connection health
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });
    });

    // Heartbeat to detect dead connections
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  /**
   * Setup listeners for coordinator events
   */
  setupCoordinatorListeners() {
    // Agent activity notifications
    this.coordinator.on('request_completed', (data) => {
      this.broadcast({
        type: 'agent_completed',
        requestId: data.requestId,
        result: data.result,
        timestamp: Date.now()
      });
    });

    this.coordinator.on('agent_registered', (data) => {
      this.broadcast({
        type: 'agent_registered',
        agentId: data.agentId,
        capabilities: data.capabilities,
        timestamp: Date.now()
      });
    });

    this.coordinator.on('request_failed', (data) => {
      this.broadcast({
        type: 'agent_failed',
        requestId: data.requestId,
        error: data.error,
        timestamp: Date.now()
      });
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  async handleMessage(clientId, data) {
    try {
      const message = JSON.parse(data.toString());
      const client = this.clients.get(clientId);

      if (!client) return;

      client.lastActivity = Date.now();

      console.log(`📨 WebSocket message from ${clientId}:`, message.type);

      switch (message.type) {
        case 'authenticate':
          await this.handleAuthenticate(clientId, message);
          break;

        case 'join_room':
          this.handleJoinRoom(clientId, message);
          break;

        case 'leave_room':
          this.handleLeaveRoom(clientId, message);
          break;

        case 'agent_request':
          await this.handleAgentRequest(clientId, message);
          break;

        case 'collaboration_event':
          this.handleCollaborationEvent(clientId, message);
          break;

        case 'ping':
          this.sendToClient(clientId, { type: 'pong', timestamp: Date.now() });
          break;

        default:
          this.sendToClient(clientId, {
            type: 'error',
            message: `Unknown message type: ${message.type}`
          });
      }
    } catch (error) {
      console.error('❌ Error handling WebSocket message:', error);
      this.sendToClient(clientId, {
        type: 'error',
        message: error.message
      });
    }
  }

  /**
   * Handle user authentication
   */
  async handleAuthenticate(clientId, message) {
    const { userId, token } = message;

    // In production, validate token
    // For now, simple userId assignment

    const client = this.clients.get(clientId);
    if (client) {
      client.userId = userId;

      this.sendToClient(clientId, {
        type: 'authenticated',
        userId,
        timestamp: Date.now()
      });

      console.log(`✅ Client ${clientId} authenticated as user ${userId}`);
    }
  }

  /**
   * Handle joining a collaboration room
   */
  handleJoinRoom(clientId, message) {
    const { roomId } = message;

    if (!roomId) {
      return this.sendToClient(clientId, {
        type: 'error',
        message: 'roomId is required'
      });
    }

    const client = this.clients.get(clientId);
    if (!client) return;

    // Add client to room
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }

    this.rooms.get(roomId).add(clientId);
    client.rooms.add(roomId);

    // Notify client
    this.sendToClient(clientId, {
      type: 'joined_room',
      roomId,
      participants: this.rooms.get(roomId).size,
      timestamp: Date.now()
    });

    // Notify other room members
    this.broadcastToRoom(roomId, {
      type: 'user_joined',
      userId: client.userId,
      clientId,
      timestamp: Date.now()
    }, clientId);

    console.log(`✅ Client ${clientId} joined room ${roomId}`);
  }

  /**
   * Handle leaving a room
   */
  handleLeaveRoom(clientId, message) {
    const { roomId } = message;

    const client = this.clients.get(clientId);
    if (!client) return;

    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(clientId);

      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      } else {
        // Notify other room members
        this.broadcastToRoom(roomId, {
          type: 'user_left',
          userId: client.userId,
          clientId,
          timestamp: Date.now()
        });
      }
    }

    client.rooms.delete(roomId);

    this.sendToClient(clientId, {
      type: 'left_room',
      roomId,
      timestamp: Date.now()
    });

    console.log(`✅ Client ${clientId} left room ${roomId}`);
  }

  /**
   * Handle agent request via WebSocket
   */
  async handleAgentRequest(clientId, message) {
    try {
      const { requestType, requestData, options } = message;

      // Route through coordinator
      const result = await this.coordinator.routeRequest(
        requestType,
        requestData,
        options || {}
      );

      // Send result to client
      this.sendToClient(clientId, {
        type: 'agent_response',
        requestType,
        result,
        timestamp: Date.now()
      });

      // Broadcast to room if client is in any rooms
      const client = this.clients.get(clientId);
      if (client && client.rooms.size > 0) {
        client.rooms.forEach(roomId => {
          this.broadcastToRoom(roomId, {
            type: 'room_agent_activity',
            userId: client.userId,
            requestType,
            result,
            timestamp: Date.now()
          }, clientId);
        });
      }
    } catch (error) {
      this.sendToClient(clientId, {
        type: 'agent_error',
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Handle collaboration events (e.g., shared playback, cursor position)
   */
  handleCollaborationEvent(clientId, message) {
    const { roomId, event, data } = message;

    if (!roomId) {
      return this.sendToClient(clientId, {
        type: 'error',
        message: 'roomId is required for collaboration events'
      });
    }

    const client = this.clients.get(clientId);
    if (!client || !client.rooms.has(roomId)) {
      return this.sendToClient(clientId, {
        type: 'error',
        message: 'Not in specified room'
      });
    }

    // Broadcast event to room
    this.broadcastToRoom(roomId, {
      type: 'collaboration_event',
      event,
      data,
      userId: client.userId,
      timestamp: Date.now()
    }, clientId);
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);

    if (client) {
      // Remove from all rooms
      client.rooms.forEach(roomId => {
        if (this.rooms.has(roomId)) {
          this.rooms.get(roomId).delete(clientId);

          // Notify room members
          this.broadcastToRoom(roomId, {
            type: 'user_disconnected',
            userId: client.userId,
            clientId,
            timestamp: Date.now()
          });

          // Clean up empty rooms
          if (this.rooms.get(roomId).size === 0) {
            this.rooms.delete(roomId);
          }
        }
      });

      this.clients.delete(clientId);
    }

    console.log(`🔌 WebSocket client disconnected: ${clientId}`);
  }

  /**
   * Send message to specific client
   */
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);

    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message, excludeClientId = null) {
    this.clients.forEach((client, clientId) => {
      if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  /**
   * Broadcast to specific room
   */
  broadcastToRoom(roomId, message, excludeClientId = null) {
    if (!this.rooms.has(roomId)) return;

    this.rooms.get(roomId).forEach(clientId => {
      if (clientId !== excludeClientId) {
        this.sendToClient(clientId, message);
      }
    });
  }

  /**
   * Generate unique client ID
   */
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get server statistics
   */
  getStatistics() {
    return {
      connectedClients: this.clients.size,
      activeRooms: this.rooms.size,
      totalConnections: this.wss.clients.size
    };
  }

  /**
   * Cleanup inactive clients
   */
  cleanupInactiveClients(maxInactivity = 300000) { // 5 minutes
    const now = Date.now();
    let cleaned = 0;

    this.clients.forEach((client, clientId) => {
      if (now - client.lastActivity > maxInactivity) {
        this.handleDisconnect(clientId);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} inactive WebSocket clients`);
    }

    return cleaned;
  }

  /**
   * Close WebSocket server
   */
  close() {
    clearInterval(this.heartbeatInterval);

    this.wss.clients.forEach((ws) => {
      ws.close();
    });

    this.wss.close(() => {
      console.log('✅ WebSocket server closed');
    });
  }
}

module.exports = { MusicWebSocketServer };

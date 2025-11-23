/**
 * Zordic Music Studio - AgentDB Fleet Coordination System
 * Main entry point for the music framework
 */

const { MusicAPI } = require('./api/music-api');
const { MusicWebSocketServer } = require('./api/websocket-server');
const { HooksIntegration } = require('./fleet/hooks-integration');
const { MusicAgentDB } = require('./agentdb/music-db');

class ZordicMusicStudio {
  constructor(config = {}) {
    this.config = {
      port: config.port || process.env.PORT || 3000,
      dbPath: config.dbPath || process.env.MUSIC_DB_PATH || './data/music-agentdb',
      enableHooks: config.enableHooks !== false,
      enableWebSocket: config.enableWebSocket !== false,
      sessionId: config.sessionId || `music-session-${Date.now()}`
    };

    this.api = null;
    this.wsServer = null;
    this.hooks = null;
    this.isRunning = false;
  }

  /**
   * Initialize all components
   */
  async initialize() {
    try {
      console.log('🎵 Initializing Zordic Music Studio...\n');

      // Initialize hooks if enabled
      if (this.config.enableHooks) {
        this.hooks = new HooksIntegration({
          sessionId: this.config.sessionId,
          enabled: true
        });

        await this.hooks.initializeSession({
          framework: 'zordic-music-studio',
          version: '1.0.0',
          timestamp: Date.now()
        });

        await this.hooks.preTask('Initializing music framework');
      }

      // Initialize API server
      this.api = new MusicAPI({
        port: this.config.port,
        dbPath: this.config.dbPath
      });

      const server = await this.api.start();

      // Initialize WebSocket server if enabled
      if (this.config.enableWebSocket) {
        this.wsServer = new MusicWebSocketServer(server, this.api.coordinator);
        console.log('✅ WebSocket server initialized\n');
      }

      this.isRunning = true;

      console.log('═══════════════════════════════════════════════════════');
      console.log('🎵 Zordic Music Studio - Ready');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`REST API: http://localhost:${this.config.port}`);
      console.log(`WebSocket: ws://localhost:${this.config.port}`);
      console.log(`Hooks: ${this.config.enableHooks ? 'Enabled' : 'Disabled'}`);
      console.log(`Session ID: ${this.config.sessionId}`);
      console.log('═══════════════════════════════════════════════════════\n');

      if (this.config.enableHooks) {
        await this.hooks.postTask('initialization', { success: true });
        await this.hooks.notify('Music framework started', {
          port: this.config.port,
          sessionId: this.config.sessionId
        });
      }

      return {
        success: true,
        api: this.api,
        wsServer: this.wsServer,
        hooks: this.hooks
      };
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Shutdown gracefully
   */
  async shutdown() {
    if (!this.isRunning) {
      console.log('⚠️  System not running');
      return;
    }

    try {
      console.log('\n🛑 Shutting down Zordic Music Studio...');

      // Close WebSocket server
      if (this.wsServer) {
        this.wsServer.close();
        console.log('✅ WebSocket server closed');
      }

      // Stop API server
      if (this.api) {
        await this.api.stop();
        console.log('✅ API server stopped');
      }

      // Finalize hooks
      if (this.hooks) {
        await this.hooks.finalizeSession({
          shutdownTime: Date.now(),
          reason: 'graceful_shutdown'
        });
        console.log('✅ Hooks finalized');
      }

      this.isRunning = false;

      console.log('✅ Shutdown complete\n');
    } catch (error) {
      console.error('❌ Shutdown error:', error);
      throw error;
    }
  }

  /**
   * Get system status
   */
  async getStatus() {
    if (!this.isRunning) {
      return {
        running: false,
        message: 'System not running'
      };
    }

    const fleetStatus = this.api.coordinator.getFleetStatus();
    const fleetStats = this.api.coordinator.getStatistics();

    const status = {
      running: true,
      port: this.config.port,
      sessionId: this.config.sessionId,
      fleet: fleetStatus,
      statistics: fleetStats
    };

    if (this.wsServer) {
      status.websocket = this.wsServer.getStatistics();
    }

    return status;
  }

  /**
   * Export public API for programmatic use
   */
  getAPI() {
    if (!this.isRunning) {
      throw new Error('System not running');
    }

    return {
      // Agent access
      agents: this.api.agents,

      // Coordinator access
      coordinator: this.api.coordinator,

      // Database access
      db: this.api.db,

      // Hooks access
      hooks: this.hooks,

      // WebSocket access
      websocket: this.wsServer
    };
  }
}

// CLI entry point
async function main() {
  const studio = new ZordicMusicStudio({
    port: process.env.PORT || 3000,
    enableHooks: process.env.ENABLE_HOOKS !== 'false',
    enableWebSocket: process.env.ENABLE_WEBSOCKET !== 'false'
  });

  // Initialize
  await studio.initialize();

  // Handle graceful shutdown
  const shutdownHandler = async () => {
    await studio.shutdown();
    process.exit(0);
  };

  process.on('SIGTERM', shutdownHandler);
  process.on('SIGINT', shutdownHandler);

  // Keep process alive
  process.stdin.resume();
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  ZordicMusicStudio,
  MusicAPI,
  MusicWebSocketServer,
  MusicAgentDB,
  HooksIntegration
};

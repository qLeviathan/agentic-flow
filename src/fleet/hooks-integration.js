/**
 * Hooks Integration for Music Framework
 * Integrates Claude Flow hooks for memory persistence and coordination
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

class HooksIntegration {
  constructor(config = {}) {
    this.configPath = config.configPath || path.join(__dirname, '../../config/agentdb/hooks-config.json');
    this.sessionId = config.sessionId || 'music-agentdb-session';
    this.enabled = config.enabled !== false;
    this.config = null;
  }

  /**
   * Load hooks configuration
   */
  async loadConfig() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(configData);
      console.log('✅ Hooks configuration loaded');
      return this.config;
    } catch (error) {
      console.warn('⚠️  No hooks config found, using defaults');
      this.config = this.getDefaultConfig();
      return this.config;
    }
  }

  /**
   * Get default configuration
   */
  getDefaultConfig() {
    return {
      hooks: {
        enabled: true,
        memory: { enabled: true },
        preTask: { enabled: true },
        postTask: { enabled: true },
        postEdit: { enabled: true },
        sessionEnd: { enabled: true }
      }
    };
  }

  /**
   * Execute pre-task hook
   */
  async preTask(description) {
    if (!this.enabled || !this.config?.hooks?.preTask?.enabled) {
      return { success: true, skipped: true };
    }

    try {
      console.log(`🪝 [Pre-Task Hook] ${description}`);

      const commands = [
        `npx claude-flow@alpha hooks pre-task --description "${description}"`,
        `npx claude-flow@alpha hooks session-restore --session-id "${this.sessionId}"`
      ];

      for (const cmd of commands) {
        await execAsync(cmd);
      }

      return {
        success: true,
        description,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Pre-task hook failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute post-task hook
   */
  async postTask(taskId, result = {}) {
    if (!this.enabled || !this.config?.hooks?.postTask?.enabled) {
      return { success: true, skipped: true };
    }

    try {
      console.log(`🪝 [Post-Task Hook] Task ${taskId}`);

      await execAsync(`npx claude-flow@alpha hooks post-task --task-id "${taskId}"`);

      return {
        success: true,
        taskId,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Post-task hook failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute post-edit hook for memory persistence
   */
  async postEdit(filePath, memoryKey, data = {}) {
    if (!this.enabled || !this.config?.hooks?.postEdit?.enabled) {
      return { success: true, skipped: true };
    }

    try {
      console.log(`🪝 [Post-Edit Hook] Storing to memory: ${memoryKey}`);

      // Store in memory using hooks
      await execAsync(
        `npx claude-flow@alpha hooks post-edit --file "${filePath}" --memory-key "${memoryKey}"`
      );

      // Store additional metadata if needed
      if (Object.keys(data).length > 0) {
        await this.storeMemory(`${memoryKey}/metadata`, data);
      }

      return {
        success: true,
        memoryKey,
        filePath,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Post-edit hook failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Store data in memory
   */
  async storeMemory(key, data) {
    try {
      const jsonData = JSON.stringify(data);
      await execAsync(
        `npx claude-flow@alpha memory store --key "${key}" --value '${jsonData}'`
      );

      console.log(`💾 Stored in memory: ${key}`);

      return {
        success: true,
        key,
        size: jsonData.length
      };
    } catch (error) {
      console.error('❌ Memory store failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Retrieve data from memory
   */
  async retrieveMemory(key) {
    try {
      const { stdout } = await execAsync(
        `npx claude-flow@alpha memory retrieve --key "${key}"`
      );

      const data = JSON.parse(stdout.trim());

      console.log(`💾 Retrieved from memory: ${key}`);

      return {
        success: true,
        key,
        data
      };
    } catch (error) {
      console.error('❌ Memory retrieve failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send notification via hooks
   */
  async notify(message, data = {}) {
    if (!this.enabled || !this.config?.hooks?.notifications?.enabled) {
      return { success: true, skipped: true };
    }

    try {
      const payload = JSON.stringify({ message, ...data });

      await execAsync(
        `npx claude-flow@alpha hooks notify --message "${message}" --data '${payload}'`
      );

      console.log(`🔔 Notification sent: ${message}`);

      return {
        success: true,
        message,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Notification failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Execute session-end hook
   */
  async sessionEnd(exportMetrics = true) {
    if (!this.enabled || !this.config?.hooks?.sessionEnd?.enabled) {
      return { success: true, skipped: true };
    }

    try {
      console.log('🪝 [Session-End Hook] Finalizing session');

      const exportFlag = exportMetrics ? '--export-metrics true' : '';

      await execAsync(
        `npx claude-flow@alpha hooks session-end --session-id "${this.sessionId}" ${exportFlag}`
      );

      return {
        success: true,
        sessionId: this.sessionId,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Session-end hook failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Store agent pattern in memory
   */
  async storeAgentPattern(agentId, patternType, pattern) {
    const memoryKey = `music-framework/agentdb/${agentId}/${patternType}`;

    return await this.storeMemory(memoryKey, {
      agentId,
      patternType,
      pattern,
      timestamp: Date.now()
    });
  }

  /**
   * Retrieve agent patterns from memory
   */
  async retrieveAgentPatterns(agentId, patternType) {
    const memoryKey = `music-framework/agentdb/${agentId}/${patternType}`;
    return await this.retrieveMemory(memoryKey);
  }

  /**
   * Store coordination decision
   */
  async storeCoordinationDecision(requestId, decision) {
    const memoryKey = `music-framework/coordination/decisions/${requestId}`;

    return await this.storeMemory(memoryKey, {
      requestId,
      decision,
      timestamp: Date.now()
    });
  }

  /**
   * Get coordination history
   */
  async getCoordinationHistory(limit = 10) {
    try {
      const { stdout } = await execAsync(
        `npx claude-flow@alpha memory list --prefix "music-framework/coordination/decisions" --limit ${limit}`
      );

      const keys = stdout.trim().split('\n').filter(k => k);
      const history = [];

      for (const key of keys) {
        const result = await this.retrieveMemory(key);
        if (result.success) {
          history.push(result.data);
        }
      }

      return {
        success: true,
        history,
        count: history.length
      };
    } catch (error) {
      console.error('❌ Failed to get coordination history:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Initialize session with hooks
   */
  async initializeSession(metadata = {}) {
    await this.loadConfig();

    if (!this.enabled) {
      console.log('ℹ️  Hooks integration disabled');
      return { success: true, enabled: false };
    }

    try {
      // Pre-task for session start
      await this.preTask('Initializing music framework session');

      // Store session metadata
      await this.storeMemory(`music-framework/sessions/${this.sessionId}`, {
        sessionId: this.sessionId,
        startTime: Date.now(),
        ...metadata
      });

      console.log(`✅ Session initialized: ${this.sessionId}`);

      return {
        success: true,
        sessionId: this.sessionId,
        enabled: true
      };
    } catch (error) {
      console.error('❌ Session initialization failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Finalize session with hooks
   */
  async finalizeSession(metrics = {}) {
    if (!this.enabled) {
      return { success: true, enabled: false };
    }

    try {
      // Store final metrics
      await this.storeMemory(`music-framework/sessions/${this.sessionId}/metrics`, {
        ...metrics,
        endTime: Date.now()
      });

      // Execute session-end hook
      await this.sessionEnd(true);

      console.log(`✅ Session finalized: ${this.sessionId}`);

      return {
        success: true,
        sessionId: this.sessionId
      };
    } catch (error) {
      console.error('❌ Session finalization failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = { HooksIntegration };

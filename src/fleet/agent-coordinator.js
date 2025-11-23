/**
 * Agent Fleet Coordinator
 * Manages communication between music agents, handles conflicts,
 * and coordinates multi-agent suggestions
 */

const EventEmitter = require('events');

class AgentFleetCoordinator extends EventEmitter {
  constructor(musicDB) {
    super();
    this.db = musicDB;
    this.coordinatorId = 'fleet-coordinator';
    this.agents = new Map();
    this.activeRequests = new Map();
    this.priorityLevels = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      background: 1
    };
    this.messageQueue = [];
    this.processingQueue = false;
  }

  /**
   * Register an agent with the coordinator
   */
  registerAgent(agentId, agentInstance, capabilities = []) {
    this.agents.set(agentId, {
      instance: agentInstance,
      capabilities,
      status: 'idle',
      lastActive: Date.now(),
      requestCount: 0,
      successRate: 1.0
    });

    console.log(`✅ [Fleet Coordinator] Registered agent: ${agentId}`);

    this.emit('agent_registered', { agentId, capabilities });

    return {
      success: true,
      agentId,
      message: 'Agent registered successfully'
    };
  }

  /**
   * Unregister an agent
   */
  unregisterAgent(agentId) {
    if (this.agents.has(agentId)) {
      this.agents.delete(agentId);
      console.log(`✅ [Fleet Coordinator] Unregistered agent: ${agentId}`);
      this.emit('agent_unregistered', { agentId });
      return { success: true };
    }

    return { success: false, error: 'Agent not found' };
  }

  /**
   * Route request to appropriate agent(s)
   */
  async routeRequest(requestType, requestData, options = {}) {
    const {
      priority = 'medium',
      multiAgent = false,
      timeout = 30000
    } = options;

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Find capable agents
      const capableAgents = this.findCapableAgents(requestType);

      if (capableAgents.length === 0) {
        throw new Error(`No agents available for request type: ${requestType}`);
      }

      console.log(`📨 [Fleet Coordinator] Routing ${requestType} request to ${capableAgents.length} agent(s)`);

      // Store active request
      this.activeRequests.set(requestId, {
        type: requestType,
        data: requestData,
        priority: this.priorityLevels[priority],
        agents: capableAgents,
        startTime: Date.now(),
        status: 'pending'
      });

      // Execute request
      let result;
      if (multiAgent) {
        result = await this.executeMultiAgentRequest(requestId, capableAgents, requestData, timeout);
      } else {
        result = await this.executeSingleAgentRequest(requestId, capableAgents[0], requestData, timeout);
      }

      // Update request status
      this.activeRequests.get(requestId).status = 'completed';
      this.activeRequests.get(requestId).result = result;

      this.emit('request_completed', { requestId, result });

      return {
        success: true,
        requestId,
        result
      };
    } catch (error) {
      console.error(`❌ [Fleet Coordinator] Request ${requestId} failed:`, error);

      if (this.activeRequests.has(requestId)) {
        this.activeRequests.get(requestId).status = 'failed';
        this.activeRequests.get(requestId).error = error.message;
      }

      this.emit('request_failed', { requestId, error: error.message });

      throw error;
    }
  }

  /**
   * Find agents capable of handling request
   */
  findCapableAgents(requestType) {
    const capabilityMap = {
      pattern_recommendation: ['pattern-learning-agent'],
      beat_suggestion: ['beat-coordinator-agent'],
      melody_generation: ['melody-agent'],
      student_assessment: ['teacher-agent'],
      music_creation: ['pattern-learning-agent', 'beat-coordinator-agent', 'melody-agent'],
      learning_path: ['teacher-agent', 'pattern-learning-agent']
    };

    const requiredAgents = capabilityMap[requestType] || [];
    const available = [];

    for (const agentId of requiredAgents) {
      const agent = this.agents.get(agentId);
      if (agent && agent.status !== 'error') {
        available.push(agentId);
      }
    }

    // Sort by success rate and availability
    return available.sort((a, b) => {
      const agentA = this.agents.get(a);
      const agentB = this.agents.get(b);
      return agentB.successRate - agentA.successRate;
    });
  }

  /**
   * Execute request with single agent
   */
  async executeSingleAgentRequest(requestId, agentId, requestData, timeout) {
    const agent = this.agents.get(agentId);

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    // Update agent status
    agent.status = 'busy';
    agent.lastActive = Date.now();
    agent.requestCount++;

    try {
      // Execute with timeout
      const result = await Promise.race([
        this.executeAgentMethod(agent.instance, requestData),
        this.createTimeout(timeout)
      ]);

      // Update success rate
      agent.successRate = (agent.successRate * 0.9) + (1.0 * 0.1); // Exponential moving average
      agent.status = 'idle';

      return result;
    } catch (error) {
      // Update failure rate
      agent.successRate = (agent.successRate * 0.9) + (0.0 * 0.1);
      agent.status = 'idle';
      throw error;
    }
  }

  /**
   * Execute request with multiple agents and aggregate results
   */
  async executeMultiAgentRequest(requestId, agentIds, requestData, timeout) {
    const promises = agentIds.map(agentId =>
      this.executeSingleAgentRequest(requestId, agentId, requestData, timeout)
        .catch(error => ({ error: error.message, agentId }))
    );

    const results = await Promise.all(promises);

    // Filter out errors
    const successful = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);

    if (successful.length === 0) {
      throw new Error('All agents failed to process request');
    }

    // Aggregate and resolve conflicts
    const aggregated = this.aggregateResults(successful, requestData);

    return {
      primary: aggregated,
      allResults: successful,
      failedAgents: failed.map(f => f.agentId)
    };
  }

  /**
   * Execute agent method based on request data
   */
  async executeAgentMethod(agentInstance, requestData) {
    const { method, params } = requestData;

    if (typeof agentInstance[method] !== 'function') {
      throw new Error(`Method ${method} not found on agent`);
    }

    return await agentInstance[method](...(Array.isArray(params) ? params : [params]));
  }

  /**
   * Create timeout promise
   */
  createTimeout(ms) {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), ms)
    );
  }

  /**
   * Aggregate results from multiple agents
   */
  aggregateResults(results, requestData) {
    if (results.length === 1) {
      return results[0];
    }

    // Aggregate based on confidence scores
    const withConfidence = results.map(r => ({
      ...r,
      confidence: r.confidence || 0.5
    }));

    // Sort by confidence
    withConfidence.sort((a, b) => b.confidence - a.confidence);

    // Return highest confidence result with alternatives
    return {
      primary: withConfidence[0],
      alternatives: withConfidence.slice(1),
      aggregationMethod: 'confidence_ranking'
    };
  }

  /**
   * Resolve conflicts between agent suggestions
   */
  async resolveConflict(suggestions, context = {}) {
    const {
      strategy = 'voting',
      userPreference = null
    } = context;

    switch (strategy) {
      case 'voting':
        return this.resolveByVoting(suggestions);

      case 'priority':
        return this.resolveByPriority(suggestions);

      case 'confidence':
        return this.resolveByConfidence(suggestions);

      case 'user_preference':
        return this.resolveByUserPreference(suggestions, userPreference);

      default:
        return this.resolveByConfidence(suggestions);
    }
  }

  /**
   * Resolve by voting (majority wins)
   */
  resolveByVoting(suggestions) {
    const votes = new Map();

    suggestions.forEach(suggestion => {
      const key = JSON.stringify(suggestion);
      votes.set(key, (votes.get(key) || 0) + 1);
    });

    const winner = [...votes.entries()].reduce((a, b) => b[1] > a[1] ? b : a);

    return {
      winner: JSON.parse(winner[0]),
      votes: winner[1],
      totalSuggestions: suggestions.length,
      method: 'voting'
    };
  }

  /**
   * Resolve by agent priority
   */
  resolveByPriority(suggestions) {
    // Agent priority order
    const priorityOrder = [
      'teacher-agent',        // Highest - education focused
      'pattern-learning-agent', // User preferences
      'melody-agent',         // Musical correctness
      'beat-coordinator-agent' // Foundation
    ];

    for (const agentId of priorityOrder) {
      const suggestion = suggestions.find(s => s.agentId === agentId);
      if (suggestion) {
        return {
          winner: suggestion,
          method: 'priority',
          priorityLevel: priorityOrder.indexOf(agentId)
        };
      }
    }

    // Fallback to first suggestion
    return {
      winner: suggestions[0],
      method: 'priority_fallback'
    };
  }

  /**
   * Resolve by confidence score
   */
  resolveByConfidence(suggestions) {
    const withConfidence = suggestions.map(s => ({
      ...s,
      confidence: s.confidence || 0.5
    }));

    withConfidence.sort((a, b) => b.confidence - a.confidence);

    return {
      winner: withConfidence[0],
      method: 'confidence',
      confidenceScore: withConfidence[0].confidence
    };
  }

  /**
   * Resolve by user preference from past behavior
   */
  async resolveByUserPreference(suggestions, userId) {
    if (!userId) {
      return this.resolveByConfidence(suggestions);
    }

    // Get user's history with each agent's suggestions
    const preferences = await this.db.db.query(this.db.collections.preferences, {
      userId
    });

    // Score each suggestion based on similarity to user's liked patterns
    const scored = await Promise.all(
      suggestions.map(async suggestion => {
        const similarityScores = await this.calculateUserSimilarity(
          suggestion,
          preferences
        );

        return {
          ...suggestion,
          userSimilarity: similarityScores
        };
      })
    );

    scored.sort((a, b) => b.userSimilarity - a.userSimilarity);

    return {
      winner: scored[0],
      method: 'user_preference',
      similarityScore: scored[0].userSimilarity
    };
  }

  /**
   * Calculate similarity to user's preferences
   */
  async calculateUserSimilarity(suggestion, userPreferences) {
    // Simple similarity based on matching attributes
    let score = 0;
    const highRatedPrefs = userPreferences.filter(p => p.rating >= 4);

    if (highRatedPrefs.length === 0) {
      return 0.5; // Neutral score
    }

    // Check genre/mood/style matches
    highRatedPrefs.forEach(pref => {
      if (pref.context?.genre === suggestion.genre) score += 0.3;
      if (pref.context?.mood === suggestion.mood) score += 0.3;
      if (pref.context?.complexity === suggestion.complexity) score += 0.2;
    });

    return Math.min(score / highRatedPrefs.length, 1.0);
  }

  /**
   * Broadcast message to all agents
   */
  async broadcast(message, data) {
    const results = [];

    for (const [agentId, agent] of this.agents.entries()) {
      try {
        if (typeof agent.instance.onMessage === 'function') {
          const result = await agent.instance.onMessage(message, data);
          results.push({ agentId, result });
        }
      } catch (error) {
        console.error(`Error broadcasting to ${agentId}:`, error);
        results.push({ agentId, error: error.message });
      }
    }

    this.emit('broadcast_completed', { message, results });

    return results;
  }

  /**
   * Add message to coordination queue
   */
  enqueueMessage(message, priority = 'medium') {
    this.messageQueue.push({
      ...message,
      priority: this.priorityLevels[priority],
      timestamp: Date.now()
    });

    // Sort by priority
    this.messageQueue.sort((a, b) => b.priority - a.priority);

    // Process queue if not already processing
    if (!this.processingQueue) {
      this.processMessageQueue();
    }
  }

  /**
   * Process queued messages
   */
  async processMessageQueue() {
    this.processingQueue = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();

      try {
        await this.routeRequest(message.type, message.data, {
          priority: Object.keys(this.priorityLevels).find(
            k => this.priorityLevels[k] === message.priority
          )
        });
      } catch (error) {
        console.error('Error processing queued message:', error);
      }
    }

    this.processingQueue = false;
  }

  /**
   * Get fleet status
   */
  getFleetStatus() {
    const agentStats = [];

    for (const [agentId, agent] of this.agents.entries()) {
      agentStats.push({
        agentId,
        status: agent.status,
        capabilities: agent.capabilities,
        requestCount: agent.requestCount,
        successRate: (agent.successRate * 100).toFixed(1) + '%',
        lastActive: new Date(agent.lastActive).toISOString()
      });
    }

    return {
      coordinatorId: this.coordinatorId,
      totalAgents: this.agents.size,
      activeRequests: this.activeRequests.size,
      queuedMessages: this.messageQueue.length,
      agents: agentStats
    };
  }

  /**
   * Get coordination statistics
   */
  getStatistics() {
    const completedRequests = [...this.activeRequests.values()]
      .filter(r => r.status === 'completed');

    const failedRequests = [...this.activeRequests.values()]
      .filter(r => r.status === 'failed');

    const avgResponseTime = completedRequests.length > 0
      ? completedRequests.reduce((sum, r) =>
          sum + (Date.now() - r.startTime), 0
        ) / completedRequests.length
      : 0;

    return {
      totalRequests: this.activeRequests.size,
      completed: completedRequests.length,
      failed: failedRequests.length,
      successRate: completedRequests.length > 0
        ? ((completedRequests.length / this.activeRequests.size) * 100).toFixed(1) + '%'
        : '0%',
      averageResponseTime: avgResponseTime.toFixed(0) + 'ms'
    };
  }

  /**
   * Clear old requests from memory
   */
  clearOldRequests(maxAge = 3600000) { // 1 hour default
    const now = Date.now();
    let cleared = 0;

    for (const [requestId, request] of this.activeRequests.entries()) {
      if (now - request.startTime > maxAge) {
        this.activeRequests.delete(requestId);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`🧹 [Fleet Coordinator] Cleared ${cleared} old requests`);
    }

    return cleared;
  }
}

module.exports = { AgentFleetCoordinator };

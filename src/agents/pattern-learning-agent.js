/**
 * Pattern Learning Agent
 * Learns from user music preferences and recommends similar patterns/styles
 */

class PatternLearningAgent {
  constructor(musicDB) {
    this.db = musicDB;
    this.agentId = 'pattern-learning-agent';
    this.learningRate = 0.1;
    this.minSamplesForRecommendation = 3;
  }

  /**
   * Analyze user's creation and store as learning data
   */
  async learnFromCreation(userId, creation) {
    try {
      // Extract musical features from creation
      const pattern = {
        id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        genre: creation.genre || 'unknown',
        mood: creation.mood || 'neutral',
        tempo: creation.tempo || 120,
        key: creation.key || 'C',
        timeSignature: creation.timeSignature || '4/4',
        complexity: this.calculateComplexity(creation),
        tags: creation.tags || [],
        userId,
        timestamp: Date.now()
      };

      // Store pattern in AgentDB
      await this.db.storePattern(pattern);

      // Store as user preference (implicit positive rating)
      await this.db.storeUserPreference(userId, pattern.id, 5, {
        source: 'user_creation',
        sessionTime: creation.sessionTime || 0
      });

      console.log(`✅ [Pattern Learning] Learned from user ${userId} creation`);

      return {
        success: true,
        patternId: pattern.id,
        message: 'Pattern learned successfully'
      };
    } catch (error) {
      console.error('❌ [Pattern Learning] Error learning from creation:', error);
      throw error;
    }
  }

  /**
   * Calculate complexity score for a musical creation
   */
  calculateComplexity(creation) {
    let complexity = 0;

    // Tempo complexity (faster = more complex)
    if (creation.tempo > 140) complexity += 2;
    else if (creation.tempo > 100) complexity += 1;

    // Time signature complexity
    if (creation.timeSignature && !['4/4', '3/4'].includes(creation.timeSignature)) {
      complexity += 2;
    }

    // Number of tracks/layers
    if (creation.tracks) {
      complexity += Math.min(creation.tracks.length, 5);
    }

    // Key complexity (non-C major/A minor)
    const simpleKeys = ['C', 'G', 'F', 'Am', 'Em'];
    if (creation.key && !simpleKeys.includes(creation.key)) {
      complexity += 1;
    }

    return Math.min(complexity, 10); // Cap at 10
  }

  /**
   * Get personalized pattern recommendations
   */
  async getRecommendations(userId, context = {}) {
    try {
      const limit = context.limit || 5;

      // Get user's learning history
      const history = await this.db.db.query(this.db.collections.preferences, {
        userId
      });

      if (history.length < this.minSamplesForRecommendation) {
        // Not enough data - use cold start strategy
        return await this.getColdStartRecommendations(context);
      }

      // Get recommendations based on user's taste profile
      const recommendations = await this.db.getRecommendations(userId, limit);

      // Enhance with learning context
      const enhanced = recommendations.map(rec => ({
        ...rec,
        reason: this.explainRecommendation(rec, history),
        confidence: this.calculateConfidence(rec, history)
      }));

      console.log(`✅ [Pattern Learning] Generated ${enhanced.length} recommendations for user ${userId}`);

      return {
        success: true,
        recommendations: enhanced,
        userProfile: this.buildUserProfile(history)
      };
    } catch (error) {
      console.error('❌ [Pattern Learning] Error getting recommendations:', error);
      throw error;
    }
  }

  /**
   * Cold start recommendations for new users
   */
  async getColdStartRecommendations(context = {}) {
    const limit = context.limit || 5;

    // Return popular beginner-friendly patterns
    const popular = await this.db.getPopularPatterns(limit);

    return {
      success: true,
      recommendations: popular.map(p => ({
        ...p,
        reason: 'Popular beginner-friendly pattern',
        confidence: 0.5,
        coldStart: true
      })),
      userProfile: null
    };
  }

  /**
   * Explain why a pattern was recommended
   */
  explainRecommendation(recommendation, userHistory) {
    const reasons = [];

    // Find similar patterns in history
    const similarInHistory = userHistory.filter(h =>
      h.rating >= 4 &&
      this.arePatternsRelated(recommendation, h)
    );

    if (similarInHistory.length > 0) {
      reasons.push(`Similar to ${similarInHistory.length} patterns you enjoyed`);
    }

    if (recommendation.relevanceScore > 0.8) {
      reasons.push('Highly relevant to your style');
    }

    if (recommendation.complexity) {
      const avgComplexity = userHistory.reduce((sum, h) =>
        sum + (h.context?.complexity || 5), 0
      ) / userHistory.length;

      if (Math.abs(recommendation.complexity - avgComplexity) < 2) {
        reasons.push('Matches your skill level');
      }
    }

    return reasons.join(', ') || 'Recommended based on your profile';
  }

  /**
   * Check if two patterns are related
   */
  arePatternsRelated(pattern1, pattern2) {
    return pattern1.genre === pattern2.genre ||
           pattern1.mood === pattern2.mood ||
           pattern1.key === pattern2.key;
  }

  /**
   * Calculate confidence score for recommendation
   */
  calculateConfidence(recommendation, userHistory) {
    let confidence = recommendation.relevanceScore || 0.5;

    // Boost confidence if user has more history
    const historyBoost = Math.min(userHistory.length / 20, 0.3);
    confidence += historyBoost;

    // Reduce confidence if pattern is very different from user's typical complexity
    if (recommendation.complexity) {
      const avgComplexity = userHistory.reduce((sum, h) =>
        sum + (h.context?.complexity || 5), 0
      ) / userHistory.length;

      const complexityDiff = Math.abs(recommendation.complexity - avgComplexity);
      if (complexityDiff > 3) {
        confidence -= 0.2;
      }
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Build user's musical taste profile
   */
  buildUserProfile(history) {
    if (history.length === 0) return null;

    const genres = {};
    const moods = {};
    let totalComplexity = 0;
    let complexityCount = 0;

    history.forEach(item => {
      if (item.context?.genre) {
        genres[item.context.genre] = (genres[item.context.genre] || 0) + 1;
      }
      if (item.context?.mood) {
        moods[item.context.mood] = (moods[item.context.mood] || 0) + 1;
      }
      if (item.context?.complexity) {
        totalComplexity += item.context.complexity;
        complexityCount++;
      }
    });

    return {
      favoriteGenres: Object.entries(genres)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([genre]) => genre),
      favoriteMoods: Object.entries(moods)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([mood]) => mood),
      averageComplexity: complexityCount > 0
        ? totalComplexity / complexityCount
        : 5,
      totalCreations: history.length
    };
  }

  /**
   * Rate a pattern (explicit feedback)
   */
  async ratePattern(userId, patternId, rating, feedback = {}) {
    try {
      await this.db.storeUserPreference(userId, patternId, rating, {
        source: 'explicit_rating',
        feedback,
        timestamp: Date.now()
      });

      console.log(`✅ [Pattern Learning] User ${userId} rated pattern ${patternId}: ${rating}/5`);

      return {
        success: true,
        message: 'Rating recorded successfully'
      };
    } catch (error) {
      console.error('❌ [Pattern Learning] Error rating pattern:', error);
      throw error;
    }
  }

  /**
   * Find similar styles based on a query
   */
  async findSimilarStyles(query, limit = 10) {
    try {
      const similar = await this.db.findSimilarPatterns(query, limit);

      console.log(`✅ [Pattern Learning] Found ${similar.length} similar styles for query`);

      return {
        success: true,
        patterns: similar
      };
    } catch (error) {
      console.error('❌ [Pattern Learning] Error finding similar styles:', error);
      throw error;
    }
  }

  /**
   * Get agent status and statistics
   */
  async getStatus() {
    const totalPatterns = await this.db.db.count(this.db.collections.patterns);
    const totalPreferences = await this.db.db.count(this.db.collections.preferences);

    return {
      agentId: this.agentId,
      status: 'active',
      statistics: {
        totalPatterns,
        totalPreferences,
        minSamplesForRecommendation: this.minSamplesForRecommendation
      }
    };
  }
}

module.exports = { PatternLearningAgent };

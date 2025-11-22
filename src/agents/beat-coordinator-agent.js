/**
 * Beat Coordinator Agent
 * Manages rhythm patterns, suggests drum arrangements, and learns successful combinations
 */

class BeatCoordinatorAgent {
  constructor(musicDB) {
    this.db = musicDB;
    this.agentId = 'beat-coordinator-agent';
    this.standardPatterns = this.initializeStandardPatterns();
  }

  /**
   * Initialize library of standard drum patterns
   */
  initializeStandardPatterns() {
    return {
      basic: {
        name: 'Basic Rock Beat',
        pattern: [1, 0, 1, 0, 1, 0, 1, 0], // Kick on 1,3 snare on 2,4
        style: 'rock',
        complexity: 1
      },
      disco: {
        name: 'Four on the Floor',
        pattern: [1, 1, 1, 1, 1, 1, 1, 1], // Kick on every beat
        style: 'disco',
        complexity: 2
      },
      funk: {
        name: 'Funk Groove',
        pattern: [1, 0, 0, 1, 1, 0, 1, 0], // Syncopated kick pattern
        style: 'funk',
        complexity: 4
      },
      jazz: {
        name: 'Jazz Swing',
        pattern: [1, 0, 1, 1, 0, 1, 1, 0], // Swing rhythm
        style: 'jazz',
        complexity: 6
      },
      hiphop: {
        name: 'Hip Hop Boom Bap',
        pattern: [1, 0, 0, 0, 1, 0, 0, 0], // Classic boom bap
        style: 'hip-hop',
        complexity: 3
      }
    };
  }

  /**
   * Suggest drum arrangement based on context
   */
  async suggestArrangement(context = {}) {
    try {
      const {
        genre,
        mood,
        tempo = 120,
        complexity = 5,
        existingTracks = []
      } = context;

      // Find compatible beat patterns from database
      const similarBeats = await this.findCompatibleBeats({
        style: genre || 'rock',
        complexity: Math.max(1, complexity - 2), // Slightly easier
        limit: 5
      });

      // If no matches in DB, use standard patterns
      const suggestions = similarBeats.length > 0
        ? similarBeats
        : this.getStandardPatternSuggestions(genre, complexity);

      // Adapt patterns to existing tracks
      const adapted = suggestions.map(beat =>
        this.adaptBeatToTracks(beat, existingTracks, tempo)
      );

      console.log(`✅ [Beat Coordinator] Generated ${adapted.length} beat suggestions`);

      return {
        success: true,
        arrangements: adapted,
        context: {
          genre,
          tempo,
          complexity
        }
      };
    } catch (error) {
      console.error('❌ [Beat Coordinator] Error suggesting arrangement:', error);
      throw error;
    }
  }

  /**
   * Find compatible beats from database
   */
  async findCompatibleBeats(criteria) {
    const { style, complexity, limit = 5 } = criteria;

    try {
      const beats = await this.db.findComplementaryBeats({
        style,
        complexity
      }, limit);

      return beats.map(b => ({
        ...b.data,
        similarity: b.score
      }));
    } catch (error) {
      console.error('Beat search error:', error);
      return [];
    }
  }

  /**
   * Get suggestions from standard pattern library
   */
  getStandardPatternSuggestions(genre, complexity) {
    const genreMap = {
      rock: ['basic', 'funk'],
      electronic: ['disco', 'basic'],
      jazz: ['jazz', 'funk'],
      'hip-hop': ['hiphop', 'funk'],
      funk: ['funk', 'basic']
    };

    const styles = genreMap[genre?.toLowerCase()] || ['basic', 'funk'];

    return styles.map(style => ({
      ...this.standardPatterns[style],
      id: `standard_${style}`,
      source: 'standard_library'
    }));
  }

  /**
   * Adapt beat pattern to complement existing tracks
   */
  adaptBeatToTracks(beat, existingTracks, tempo) {
    const adapted = { ...beat };

    // Adjust complexity based on track density
    if (existingTracks.length > 3) {
      adapted.complexity = Math.max(1, beat.complexity - 1);
      adapted.adaptationNote = 'Simplified to avoid clutter with multiple tracks';
    }

    // Tempo-based adjustments
    if (tempo > 140) {
      adapted.pattern = this.simplifyForFastTempo(beat.pattern);
      adapted.adaptationNote = 'Simplified for fast tempo';
    } else if (tempo < 80) {
      adapted.pattern = this.enhanceForSlowTempo(beat.pattern);
      adapted.adaptationNote = 'Enhanced for slow tempo';
    }

    // Add variation suggestions
    adapted.variations = this.generateVariations(beat.pattern);

    return adapted;
  }

  /**
   * Simplify pattern for fast tempo
   */
  simplifyForFastTempo(pattern) {
    // Keep only strong beats
    return pattern.map((hit, i) =>
      i % 2 === 0 ? hit : 0
    );
  }

  /**
   * Enhance pattern for slow tempo
   */
  enhanceForSlowTempo(pattern) {
    // Add ghost notes between main beats
    const enhanced = [];
    pattern.forEach(hit => {
      enhanced.push(hit);
      enhanced.push(hit > 0 ? 0.3 : 0); // Add ghost note
    });
    return enhanced;
  }

  /**
   * Generate pattern variations
   */
  generateVariations(basePattern) {
    return {
      fills: this.generateFill(basePattern),
      breakdown: this.generateBreakdown(basePattern),
      buildup: this.generateBuildup(basePattern)
    };
  }

  /**
   * Generate fill pattern
   */
  generateFill(pattern) {
    // Create a fill by inverting and intensifying the pattern
    return pattern.map((hit, i) =>
      i % 2 === 0 ? 1 : hit
    );
  }

  /**
   * Generate breakdown pattern (simplified)
   */
  generateBreakdown(pattern) {
    return pattern.map((hit, i) =>
      i % 4 === 0 ? hit : 0
    );
  }

  /**
   * Generate buildup pattern (progressive)
   */
  generateBuildup(pattern) {
    return pattern.map((hit, i) => {
      const intensity = (i / pattern.length);
      return hit * intensity;
    });
  }

  /**
   * Store successful beat combination
   */
  async learnBeatCombination(beatData, performance = {}) {
    try {
      const beat = {
        id: `beat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: beatData.name || 'User Beat',
        pattern: beatData.pattern,
        style: beatData.style || 'custom',
        complexity: beatData.complexity || 5,
        successRate: performance.rating || 0.5,
        metadata: {
          tempo: beatData.tempo,
          timeSignature: beatData.timeSignature || '4/4',
          userRating: performance.userRating,
          completionRate: performance.completionRate || 1.0,
          timestamp: Date.now()
        }
      };

      await this.db.storeBeat(beat);

      console.log(`✅ [Beat Coordinator] Learned new beat combination: ${beat.name}`);

      return {
        success: true,
        beatId: beat.id,
        message: 'Beat combination learned successfully'
      };
    } catch (error) {
      console.error('❌ [Beat Coordinator] Error learning beat:', error);
      throw error;
    }
  }

  /**
   * Update beat success rate based on usage
   */
  async updateBeatPerformance(beatId, performance) {
    try {
      const beat = await this.db.db.get(this.db.collections.beats, beatId);

      if (!beat) {
        throw new Error(`Beat ${beatId} not found`);
      }

      // Calculate new success rate (exponential moving average)
      const alpha = 0.3; // Learning rate
      const newSuccessRate = alpha * performance.rating +
                            (1 - alpha) * beat.data.successRate;

      await this.db.db.update(this.db.collections.beats, beatId, {
        successRate: newSuccessRate,
        lastUsed: Date.now(),
        usageCount: (beat.data.usageCount || 0) + 1
      });

      console.log(`✅ [Beat Coordinator] Updated beat ${beatId} performance`);

      return {
        success: true,
        beatId,
        newSuccessRate
      };
    } catch (error) {
      console.error('❌ [Beat Coordinator] Error updating performance:', error);
      throw error;
    }
  }

  /**
   * Get beat templates by style
   */
  async getBeatTemplates(style, limit = 10) {
    try {
      const templates = await this.db.db.query(this.db.collections.beats, {
        style,
        limit,
        sort: { successRate: -1 } // Highest rated first
      });

      return {
        success: true,
        templates: templates.map(t => t.data),
        count: templates.length
      };
    } catch (error) {
      console.error('❌ [Beat Coordinator] Error getting templates:', error);
      throw error;
    }
  }

  /**
   * Analyze beat pattern complexity
   */
  analyzeBeatComplexity(pattern) {
    const metrics = {
      density: 0,
      syncopation: 0,
      variation: 0,
      complexity: 0
    };

    // Density - how many hits
    metrics.density = pattern.filter(h => h > 0).length / pattern.length;

    // Syncopation - hits on off-beats
    const offBeatHits = pattern.filter((h, i) =>
      h > 0 && i % 2 !== 0
    ).length;
    metrics.syncopation = offBeatHits / pattern.length;

    // Variation - pattern changes
    let changes = 0;
    for (let i = 1; i < pattern.length; i++) {
      if (pattern[i] !== pattern[i-1]) changes++;
    }
    metrics.variation = changes / pattern.length;

    // Overall complexity score (1-10)
    metrics.complexity = Math.round(
      (metrics.density * 3 +
       metrics.syncopation * 4 +
       metrics.variation * 3) * 10
    );

    return metrics;
  }

  /**
   * Generate complementary pattern for existing beat
   */
  async generateComplementaryPattern(existingBeat) {
    try {
      // Find beats that work well with this one
      const complementary = await this.db.findComplementaryBeats(
        existingBeat,
        5
      );

      // Generate new pattern based on complementary beats
      const newPattern = this.synthesizePattern(
        existingBeat.pattern,
        complementary.map(c => c.data.pattern)
      );

      return {
        success: true,
        pattern: newPattern,
        suggestions: complementary.map(c => ({
          id: c.id,
          name: c.data.name,
          similarity: c.score
        }))
      };
    } catch (error) {
      console.error('❌ [Beat Coordinator] Error generating complement:', error);
      throw error;
    }
  }

  /**
   * Synthesize new pattern from existing patterns
   */
  synthesizePattern(basePattern, referencePatterns) {
    if (referencePatterns.length === 0) {
      return basePattern;
    }

    const synthesized = basePattern.map((beat, i) => {
      // Average the patterns at this position
      const avg = referencePatterns.reduce((sum, pattern) =>
        sum + (pattern[i % pattern.length] || 0), 0
      ) / referencePatterns.length;

      // Blend with base pattern (70% base, 30% references)
      return beat * 0.7 + avg * 0.3;
    });

    return synthesized;
  }

  /**
   * Get agent status and statistics
   */
  async getStatus() {
    const totalBeats = await this.db.db.count(this.db.collections.beats);

    return {
      agentId: this.agentId,
      status: 'active',
      statistics: {
        totalBeats,
        standardPatterns: Object.keys(this.standardPatterns).length,
        capabilities: [
          'beat_suggestion',
          'pattern_learning',
          'complementary_generation',
          'complexity_analysis'
        ]
      }
    };
  }
}

module.exports = { BeatCoordinatorAgent };

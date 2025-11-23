/**
 * Teacher Agent
 * Tracks student progress, adapts difficulty, provides feedback,
 * and suggests personalized learning paths
 */

class TeacherAgent {
  constructor(musicDB) {
    this.db = musicDB;
    this.agentId = 'teacher-agent';
    this.curriculum = this.initializeCurriculum();
    this.skillLevels = this.initializeSkillLevels();
  }

  /**
   * Initialize structured music curriculum
   */
  initializeCurriculum() {
    return {
      beginner: {
        level: 1,
        skills: [
          { id: 'rhythm_basic', name: 'Basic Rhythm', lessons: ['quarter_notes', 'half_notes', 'whole_notes'] },
          { id: 'melody_simple', name: 'Simple Melodies', lessons: ['c_major_scale', 'simple_songs', 'ear_training'] },
          { id: 'theory_intro', name: 'Music Theory Basics', lessons: ['note_names', 'staff_reading', 'time_signatures'] }
        ]
      },
      intermediate: {
        level: 2,
        skills: [
          { id: 'rhythm_advanced', name: 'Advanced Rhythm', lessons: ['syncopation', 'polyrhythm', 'odd_meters'] },
          { id: 'harmony_basic', name: 'Basic Harmony', lessons: ['chords', 'progressions', 'voice_leading'] },
          { id: 'composition', name: 'Song Structure', lessons: ['verse_chorus', 'bridge', 'arrangement'] }
        ]
      },
      advanced: {
        level: 3,
        skills: [
          { id: 'jazz_theory', name: 'Jazz Theory', lessons: ['modal_harmony', 'substitutions', 'improvisation'] },
          { id: 'production', name: 'Music Production', lessons: ['mixing', 'mastering', 'sound_design'] },
          { id: 'orchestration', name: 'Orchestration', lessons: ['instrumentation', 'arrangement', 'counterpoint'] }
        ]
      }
    };
  }

  /**
   * Initialize skill level definitions
   */
  initializeSkillLevels() {
    return {
      novice: { min: 0, max: 30, label: 'Novice' },
      beginner: { min: 30, max: 50, label: 'Beginner' },
      intermediate: { min: 50, max: 75, label: 'Intermediate' },
      advanced: { min: 75, max: 90, label: 'Advanced' },
      expert: { min: 90, max: 100, label: 'Expert' }
    };
  }

  /**
   * Assess student performance on a task
   */
  async assessPerformance(userId, taskData) {
    try {
      const {
        skill,
        taskId,
        score,
        timeSpent,
        mistakes = [],
        completion = 1.0
      } = taskData;

      // Calculate accuracy
      const accuracy = Math.max(0, Math.min(100, score * 100));

      // Get current progress
      const currentProgress = await this.db.getProgress(userId);
      const skillProgress = currentProgress.find(p => p.skill === skill);

      // Calculate new level
      const newLevel = this.calculateNewLevel(
        skillProgress?.level || 0,
        accuracy,
        completion
      );

      // Analyze strengths and weaknesses
      const analysis = this.analyzePerformance({
        accuracy,
        timeSpent,
        mistakes,
        currentLevel: skillProgress?.level || 0,
        newLevel
      });

      // Update progress in database
      await this.updateStudentProgress(userId, {
        skill,
        level: newLevel,
        accuracy,
        completedLessons: [...(skillProgress?.completedLessons || []), taskId],
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        lastAssessment: Date.now()
      });

      console.log(`✅ [Teacher Agent] Assessed ${userId} - ${skill}: ${accuracy.toFixed(1)}%`);

      return {
        success: true,
        assessment: {
          skill,
          previousLevel: skillProgress?.level || 0,
          newLevel,
          accuracy,
          improvement: newLevel - (skillProgress?.level || 0),
          feedback: this.generateFeedback(analysis, newLevel),
          nextSteps: await this.suggestNextSteps(userId, skill, newLevel)
        }
      };
    } catch (error) {
      console.error('❌ [Teacher Agent] Error assessing performance:', error);
      throw error;
    }
  }

  /**
   * Calculate new skill level based on performance
   */
  calculateNewLevel(currentLevel, accuracy, completion) {
    // Learning rate - how quickly student progresses
    const learningRate = 0.15;

    // Target level based on performance
    const targetLevel = accuracy;

    // Exponential moving average for smooth progression
    const newLevel = currentLevel + learningRate * (targetLevel - currentLevel);

    // Apply completion bonus
    const completionBonus = completion >= 1.0 ? 2 : 0;

    return Math.max(0, Math.min(100, newLevel + completionBonus));
  }

  /**
   * Analyze performance to identify strengths and weaknesses
   */
  analyzePerformance(data) {
    const { accuracy, timeSpent, mistakes, currentLevel, newLevel } = data;
    const strengths = [];
    const weaknesses = [];

    // Accuracy analysis
    if (accuracy >= 90) {
      strengths.push('high_accuracy');
    } else if (accuracy < 70) {
      weaknesses.push('accuracy_needs_work');
    }

    // Progress analysis
    if (newLevel > currentLevel + 3) {
      strengths.push('fast_learner');
    } else if (newLevel <= currentLevel) {
      weaknesses.push('needs_more_practice');
    }

    // Speed analysis (assuming target is 300 seconds)
    if (timeSpent < 180) {
      strengths.push('efficient');
    } else if (timeSpent > 600) {
      weaknesses.push('pace_slow');
    }

    // Mistake pattern analysis
    if (mistakes.length === 0) {
      strengths.push('mistake_free');
    } else if (mistakes.length > 5) {
      const mistakeTypes = this.categorizeMistakes(mistakes);
      weaknesses.push(...mistakeTypes);
    }

    return { strengths, weaknesses };
  }

  /**
   * Categorize mistakes into types
   */
  categorizeMistakes(mistakes) {
    const categories = {
      timing: 0,
      pitch: 0,
      rhythm: 0,
      technique: 0
    };

    mistakes.forEach(mistake => {
      if (mistake.type in categories) {
        categories[mistake.type]++;
      }
    });

    // Return categories with most mistakes
    return Object.entries(categories)
      .filter(([_, count]) => count > 2)
      .map(([type, _]) => `${type}_issues`);
  }

  /**
   * Generate personalized feedback
   */
  generateFeedback(analysis, level) {
    const { strengths, weaknesses } = analysis;
    const feedback = [];

    // Positive feedback
    if (strengths.includes('high_accuracy')) {
      feedback.push('Excellent accuracy! You have a strong grasp of this concept.');
    }
    if (strengths.includes('fast_learner')) {
      feedback.push('Great progress! You are advancing quickly.');
    }
    if (strengths.includes('efficient')) {
      feedback.push('Good pace! You are working efficiently.');
    }
    if (strengths.includes('mistake_free')) {
      feedback.push('Perfect execution! Keep up the excellent work.');
    }

    // Constructive feedback
    if (weaknesses.includes('accuracy_needs_work')) {
      feedback.push('Focus on accuracy. Take your time with each note.');
    }
    if (weaknesses.includes('timing_issues')) {
      feedback.push('Practice with a metronome to improve timing.');
    }
    if (weaknesses.includes('rhythm_issues')) {
      feedback.push('Work on rhythm exercises to strengthen this skill.');
    }
    if (weaknesses.includes('pace_slow')) {
      feedback.push('Try to increase your practice efficiency.');
    }

    // Level-based encouragement
    const skillLevel = this.getSkillLevelLabel(level);
    feedback.push(`Current skill level: ${skillLevel} (${level.toFixed(1)}/100)`);

    return feedback;
  }

  /**
   * Get skill level label
   */
  getSkillLevelLabel(level) {
    for (const [label, range] of Object.entries(this.skillLevels)) {
      if (level >= range.min && level < range.max) {
        return range.label;
      }
    }
    return 'Expert';
  }

  /**
   * Suggest next learning steps
   */
  async suggestNextSteps(userId, currentSkill, level) {
    const suggestions = [];

    // Determine curriculum tier
    let tier = 'beginner';
    if (level >= 75) tier = 'advanced';
    else if (level >= 50) tier = 'intermediate';

    const tierCurriculum = this.curriculum[tier];

    // Find current skill in curriculum
    const currentSkillData = Object.values(this.curriculum)
      .flatMap(t => t.skills)
      .find(s => s.id === currentSkill);

    if (currentSkillData) {
      // Suggest next lessons in current skill
      const progress = await this.db.getProgress(userId);
      const skillProgress = progress.find(p => p.skill === currentSkill);
      const completedLessons = skillProgress?.completedLessons || [];

      const nextLesson = currentSkillData.lessons.find(
        lesson => !completedLessons.includes(lesson)
      );

      if (nextLesson) {
        suggestions.push({
          type: 'continue_skill',
          skill: currentSkill,
          lesson: nextLesson,
          reason: 'Continue mastering current skill'
        });
      } else {
        // Current skill completed, suggest next skill
        const nextSkill = this.getNextSkill(currentSkill, tier);
        if (nextSkill) {
          suggestions.push({
            type: 'new_skill',
            skill: nextSkill.id,
            lesson: nextSkill.lessons[0],
            reason: 'Ready for new challenge'
          });
        }
      }
    }

    // If level is high enough, suggest advancement
    if (level >= 50 && tier === 'beginner') {
      suggestions.push({
        type: 'advance_tier',
        tier: 'intermediate',
        reason: 'You are ready for intermediate material'
      });
    } else if (level >= 75 && tier === 'intermediate') {
      suggestions.push({
        type: 'advance_tier',
        tier: 'advanced',
        reason: 'You are ready for advanced material'
      });
    }

    // Suggest similar students for peer learning
    const peers = await this.db.findSimilarStudents(userId, 3);
    if (peers.length > 0) {
      suggestions.push({
        type: 'peer_learning',
        peers: peers.map(p => p.data.userId),
        reason: 'Connect with students at similar level'
      });
    }

    return suggestions;
  }

  /**
   * Get next skill in progression
   */
  getNextSkill(currentSkillId, tier) {
    const tierSkills = this.curriculum[tier].skills;
    const currentIndex = tierSkills.findIndex(s => s.id === currentSkillId);

    if (currentIndex !== -1 && currentIndex < tierSkills.length - 1) {
      return tierSkills[currentIndex + 1];
    }

    return null;
  }

  /**
   * Update student progress in database
   */
  async updateStudentProgress(userId, progressData) {
    await this.db.updateProgress(userId, progressData);
  }

  /**
   * Get comprehensive student report
   */
  async getStudentReport(userId) {
    try {
      const progress = await this.db.getProgress(userId);

      if (progress.length === 0) {
        return {
          success: true,
          report: {
            userId,
            status: 'new_student',
            message: 'No learning history yet. Start with beginner lessons.'
          }
        };
      }

      // Calculate overall statistics
      const overallLevel = progress.reduce((sum, p) => sum + p.level, 0) / progress.length;
      const overallAccuracy = progress.reduce((sum, p) => sum + p.accuracy, 0) / progress.length;
      const totalLessons = progress.reduce((sum, p) => sum + p.completedLessons.length, 0);

      // Get strengths and weaknesses
      const allStrengths = progress.flatMap(p => p.strengths || []);
      const allWeaknesses = progress.flatMap(p => p.weaknesses || []);

      const strengthCounts = this.countOccurrences(allStrengths);
      const weaknessCounts = this.countOccurrences(allWeaknesses);

      // Determine learning style
      const learningStyle = this.determineLearningStyle(progress);

      console.log(`✅ [Teacher Agent] Generated report for ${userId}`);

      return {
        success: true,
        report: {
          userId,
          overallLevel: overallLevel.toFixed(1),
          skillLevel: this.getSkillLevelLabel(overallLevel),
          overallAccuracy: overallAccuracy.toFixed(1),
          totalLessonsCompleted: totalLessons,
          skills: progress.map(p => ({
            skill: p.skill,
            level: p.level.toFixed(1),
            accuracy: p.accuracy.toFixed(1),
            lessonsCompleted: p.completedLessons.length
          })),
          topStrengths: Object.entries(strengthCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([strength]) => strength),
          areasForImprovement: Object.entries(weaknessCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([weakness]) => weakness),
          learningStyle,
          recommendedPath: await this.getRecommendedPath(userId, progress)
        }
      };
    } catch (error) {
      console.error('❌ [Teacher Agent] Error generating report:', error);
      throw error;
    }
  }

  /**
   * Count occurrences in array
   */
  countOccurrences(arr) {
    return arr.reduce((counts, item) => {
      counts[item] = (counts[item] || 0) + 1;
      return counts;
    }, {});
  }

  /**
   * Determine student's learning style based on performance patterns
   */
  determineLearningStyle(progress) {
    // Analyze completion speed, accuracy patterns, etc.
    const avgAccuracy = progress.reduce((sum, p) => sum + p.accuracy, 0) / progress.length;
    const hasHighAccuracy = avgAccuracy >= 85;

    const totalLessons = progress.reduce((sum, p) => sum + p.completedLessons.length, 0);
    const fastPace = totalLessons > 20;

    if (hasHighAccuracy && fastPace) {
      return 'quick_mastery';
    } else if (hasHighAccuracy) {
      return 'thorough_learner';
    } else if (fastPace) {
      return 'exploratory';
    } else {
      return 'steady_progress';
    }
  }

  /**
   * Get recommended learning path
   */
  async getRecommendedPath(userId, progress) {
    const path = [];

    for (const skillProgress of progress) {
      const nextSteps = await this.suggestNextSteps(
        userId,
        skillProgress.skill,
        skillProgress.level
      );

      if (nextSteps.length > 0) {
        path.push({
          currentSkill: skillProgress.skill,
          nextStep: nextSteps[0]
        });
      }
    }

    return path;
  }

  /**
   * Adapt difficulty based on performance
   */
  adaptDifficulty(currentDifficulty, performanceScore) {
    // Performance-based difficulty adjustment
    if (performanceScore >= 90) {
      // Student excelling - increase difficulty
      return Math.min(10, currentDifficulty + 1);
    } else if (performanceScore < 60) {
      // Student struggling - decrease difficulty
      return Math.max(1, currentDifficulty - 1);
    }

    // Performance acceptable - maintain difficulty
    return currentDifficulty;
  }

  /**
   * Get agent status
   */
  async getStatus() {
    const totalStudents = await this.db.db.query(this.db.collections.progress, {})
      .then(results => new Set(results.map(r => r.data.userId)).size);

    return {
      agentId: this.agentId,
      status: 'active',
      statistics: {
        totalStudents,
        curriculumTiers: Object.keys(this.curriculum).length,
        capabilities: [
          'progress_tracking',
          'adaptive_difficulty',
          'personalized_feedback',
          'learning_path_recommendation'
        ]
      }
    };
  }
}

module.exports = { TeacherAgent };

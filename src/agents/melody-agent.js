/**
 * Melody Agent
 * Harmonizes with existing tracks, suggests melodic progressions,
 * and generates complementary melodies
 */

class MelodyAgent {
  constructor(musicDB) {
    this.db = musicDB;
    this.agentId = 'melody-agent';
    this.scaleDefinitions = this.initializeScales();
    this.chordProgressions = this.initializeProgressions();
  }

  /**
   * Initialize music theory - scale definitions
   */
  initializeScales() {
    return {
      major: {
        intervals: [0, 2, 4, 5, 7, 9, 11], // W-W-H-W-W-W-H
        mood: 'happy',
        chordQualities: ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim']
      },
      minor: {
        intervals: [0, 2, 3, 5, 7, 8, 10], // W-H-W-W-H-W-W (natural)
        mood: 'sad',
        chordQualities: ['min', 'dim', 'maj', 'min', 'min', 'maj', 'maj']
      },
      dorian: {
        intervals: [0, 2, 3, 5, 7, 9, 10], // Modal scale
        mood: 'jazzy',
        chordQualities: ['min', 'min', 'maj', 'maj', 'min', 'dim', 'maj']
      },
      pentatonic_major: {
        intervals: [0, 2, 4, 7, 9], // Simplified major
        mood: 'uplifting',
        chordQualities: ['maj', 'maj', 'maj', 'maj', 'maj']
      },
      pentatonic_minor: {
        intervals: [0, 3, 5, 7, 10], // Simplified minor
        mood: 'bluesy',
        chordQualities: ['min', 'min', 'min', 'min', 'min']
      },
      harmonic_minor: {
        intervals: [0, 2, 3, 5, 7, 8, 11], // Dramatic minor
        mood: 'dramatic',
        chordQualities: ['min', 'dim', 'aug', 'min', 'maj', 'maj', 'dim']
      }
    };
  }

  /**
   * Initialize common chord progressions
   */
  initializeProgressions() {
    return {
      pop: [
        { name: 'I-V-vi-IV', chords: [1, 5, 6, 4], mood: 'uplifting' },
        { name: 'I-IV-V', chords: [1, 4, 5], mood: 'classic' },
        { name: 'vi-IV-I-V', chords: [6, 4, 1, 5], mood: 'emotional' }
      ],
      jazz: [
        { name: 'ii-V-I', chords: [2, 5, 1], mood: 'sophisticated' },
        { name: 'I-vi-ii-V', chords: [1, 6, 2, 5], mood: 'smooth' }
      ],
      blues: [
        { name: '12-bar blues', chords: [1, 1, 1, 1, 4, 4, 1, 1, 5, 4, 1, 5], mood: 'bluesy' }
      ],
      rock: [
        { name: 'I-bVII-IV', chords: [1, 7, 4], mood: 'powerful' },
        { name: 'I-IV-I-V', chords: [1, 4, 1, 5], mood: 'energetic' }
      ]
    };
  }

  /**
   * Generate complementary melody for existing track
   */
  async generateComplementaryMelody(existingTrack, options = {}) {
    try {
      const {
        key = 'C',
        scale = 'major',
        length = 16, // Number of notes
        complexity = 5,
        harmonic_role = 'harmony' // 'harmony', 'counter', or 'unison'
      } = options;

      // Get scale notes
      const scaleNotes = this.getScaleNotes(key, scale);

      // Analyze existing track to find compatible melodies
      const compatible = await this.findCompatibleMelodies({
        key,
        scale,
        harmonic_role
      });

      let melody;

      if (compatible.length > 0 && Math.random() > 0.3) {
        // Use learned melody as inspiration
        melody = this.adaptMelody(compatible[0].data, scaleNotes, length);
      } else {
        // Generate new melody
        melody = this.generateNewMelody(scaleNotes, {
          length,
          complexity,
          existingTrack
        });
      }

      // Harmonize with existing track
      const harmonized = this.harmonizeMelody(melody, existingTrack, harmonic_role);

      console.log(`✅ [Melody Agent] Generated ${harmonic_role} melody in ${key} ${scale}`);

      return {
        success: true,
        melody: harmonized,
        metadata: {
          key,
          scale,
          scaleNotes,
          harmonic_role,
          complexity: this.analyzeMelodyComplexity(harmonized)
        }
      };
    } catch (error) {
      console.error('❌ [Melody Agent] Error generating melody:', error);
      throw error;
    }
  }

  /**
   * Get notes for a specific scale and key
   */
  getScaleNotes(key, scaleName) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = noteNames.indexOf(key);

    if (rootIndex === -1) {
      throw new Error(`Invalid key: ${key}`);
    }

    const scale = this.scaleDefinitions[scaleName];
    if (!scale) {
      throw new Error(`Invalid scale: ${scaleName}`);
    }

    return scale.intervals.map(interval => ({
      note: noteNames[(rootIndex + interval) % 12],
      midiNote: 60 + ((rootIndex + interval) % 12), // Middle C octave
      interval
    }));
  }

  /**
   * Find compatible melodies from database
   */
  async findCompatibleMelodies(criteria) {
    const { key, scale, harmonic_role, limit = 5 } = criteria;

    try {
      const melodies = await this.db.findHarmonizingMelodies({
        key,
        scale,
        harmonicFunction: harmonic_role
      }, limit);

      return melodies;
    } catch (error) {
      console.error('Melody search error:', error);
      return [];
    }
  }

  /**
   * Adapt existing melody to new context
   */
  adaptMelody(sourceMelody, targetScale, targetLength) {
    const sourceNotes = sourceMelody.notes || [];
    const adapted = [];

    for (let i = 0; i < targetLength; i++) {
      // Map source note to target scale
      const sourceNote = sourceNotes[i % sourceNotes.length];
      const targetNote = this.mapNoteToScale(sourceNote, targetScale);
      adapted.push(targetNote);
    }

    return adapted;
  }

  /**
   * Map a note to the closest note in target scale
   */
  mapNoteToScale(note, scale) {
    // Find closest scale degree
    const scaleMidi = scale.map(n => n.midiNote);
    const closest = scaleMidi.reduce((prev, curr) =>
      Math.abs(curr - note.midiNote) < Math.abs(prev - note.midiNote) ? curr : prev
    );

    return scale.find(n => n.midiNote === closest);
  }

  /**
   * Generate completely new melody
   */
  generateNewMelody(scaleNotes, options) {
    const { length, complexity, existingTrack } = options;
    const melody = [];

    // Start on tonic or dominant
    let currentNoteIndex = [0, 4].includes(complexity % 2) ? 0 : 4;

    for (let i = 0; i < length; i++) {
      melody.push({
        ...scaleNotes[currentNoteIndex],
        duration: this.generateNoteDuration(complexity),
        velocity: this.generateVelocity(i, length)
      });

      // Move to next note based on complexity
      currentNoteIndex = this.getNextNoteIndex(
        currentNoteIndex,
        scaleNotes.length,
        complexity
      );
    }

    return melody;
  }

  /**
   * Generate note duration based on complexity
   */
  generateNoteDuration(complexity) {
    const durations = [
      0.25,  // 16th note
      0.5,   // 8th note
      1.0,   // quarter note
      2.0    // half note
    ];

    // Higher complexity = more varied rhythms
    if (complexity > 7) {
      return durations[Math.floor(Math.random() * durations.length)];
    } else if (complexity > 4) {
      return durations[Math.floor(Math.random() * 3)];
    } else {
      return durations[2]; // Mostly quarter notes
    }
  }

  /**
   * Generate velocity (volume) for note
   */
  generateVelocity(position, totalLength) {
    // Create dynamic contour
    const phase = (position / totalLength) * Math.PI * 2;
    const contour = (Math.sin(phase) + 1) / 2; // 0 to 1

    return 64 + Math.floor(contour * 48); // 64-112 MIDI velocity
  }

  /**
   * Get next note index for melodic movement
   */
  getNextNoteIndex(current, scaleLength, complexity) {
    if (complexity > 7) {
      // Complex - allow leaps
      const leap = Math.floor(Math.random() * 5) - 2; // -2 to +2
      return (current + leap + scaleLength) % scaleLength;
    } else if (complexity > 4) {
      // Medium - stepwise with occasional skip
      const step = Math.random() > 0.7 ? 2 : 1;
      const direction = Math.random() > 0.5 ? 1 : -1;
      return (current + (step * direction) + scaleLength) % scaleLength;
    } else {
      // Simple - mostly stepwise
      const direction = Math.random() > 0.5 ? 1 : -1;
      return (current + direction + scaleLength) % scaleLength;
    }
  }

  /**
   * Harmonize melody with existing track
   */
  harmonizeMelody(melody, existingTrack, role) {
    if (!existingTrack || !existingTrack.notes) {
      return melody;
    }

    return melody.map((note, i) => {
      const existingNote = existingTrack.notes[i % existingTrack.notes.length];

      switch (role) {
        case 'harmony':
          // Harmonize at 3rd or 5th interval
          return {
            ...note,
            midiNote: note.midiNote + (Math.random() > 0.5 ? 4 : 7)
          };

        case 'counter':
          // Move in opposite direction
          const direction = i > 0 && existingNote.midiNote >
            existingTrack.notes[i-1].midiNote ? -1 : 1;
          return {
            ...note,
            midiNote: note.midiNote + (direction * 2)
          };

        case 'unison':
        default:
          return note;
      }
    });
  }

  /**
   * Suggest chord progression for context
   */
  suggestChordProgression(context = {}) {
    const {
      genre = 'pop',
      mood,
      key = 'C',
      length = 4
    } = context;

    // Get progressions for genre
    const genreProgressions = this.chordProgressions[genre] || this.chordProgressions.pop;

    // Filter by mood if specified
    let candidates = mood
      ? genreProgressions.filter(p => p.mood === mood)
      : genreProgressions;

    if (candidates.length === 0) {
      candidates = genreProgressions;
    }

    // Pick random progression
    const progression = candidates[Math.floor(Math.random() * candidates.length)];

    // Convert to actual chords in the key
    const chords = this.progressionToChords(progression.chords, key);

    return {
      success: true,
      progression: {
        name: progression.name,
        chords,
        key,
        mood: progression.mood
      }
    };
  }

  /**
   * Convert progression numbers to chord names
   */
  progressionToChords(romanNumerals, key) {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const rootIndex = noteNames.indexOf(key);
    const scale = this.scaleDefinitions.major; // Assume major for chord roots

    return romanNumerals.map(numeral => {
      const degree = numeral - 1; // Convert to 0-indexed
      const interval = scale.intervals[degree % scale.intervals.length];
      const root = noteNames[(rootIndex + interval) % 12];
      const quality = scale.chordQualities[degree % scale.chordQualities.length];

      return {
        root,
        quality,
        name: `${root}${quality}`
      };
    });
  }

  /**
   * Analyze melody complexity
   */
  analyzeMelodyComplexity(melody) {
    if (!melody || melody.length === 0) return 0;

    let complexity = 0;

    // Range (wider range = more complex)
    const midiNotes = melody.map(n => n.midiNote);
    const range = Math.max(...midiNotes) - Math.min(...midiNotes);
    complexity += Math.min(range / 2, 5);

    // Interval diversity (more varied intervals = complex)
    const intervals = [];
    for (let i = 1; i < melody.length; i++) {
      intervals.push(Math.abs(midiNotes[i] - midiNotes[i-1]));
    }
    const uniqueIntervals = new Set(intervals).size;
    complexity += Math.min(uniqueIntervals, 5);

    return Math.round(Math.min(complexity, 10));
  }

  /**
   * Store successful melody for learning
   */
  async learnMelody(melodyData, performance = {}) {
    try {
      const melody = {
        id: `melody_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        notes: melodyData.notes,
        scale: melodyData.scale || 'major',
        key: melodyData.key || 'C',
        progression: melodyData.progression || [],
        harmonicFunction: melodyData.harmonicFunction || 'melody',
        metadata: {
          complexity: this.analyzeMelodyComplexity(melodyData.notes),
          userRating: performance.rating,
          timestamp: Date.now()
        }
      };

      await this.db.storeMelody(melody);

      console.log(`✅ [Melody Agent] Learned new melody in ${melody.key} ${melody.scale}`);

      return {
        success: true,
        melodyId: melody.id
      };
    } catch (error) {
      console.error('❌ [Melody Agent] Error learning melody:', error);
      throw error;
    }
  }

  /**
   * Get agent status
   */
  async getStatus() {
    const totalMelodies = await this.db.db.count(this.db.collections.melodies);

    return {
      agentId: this.agentId,
      status: 'active',
      statistics: {
        totalMelodies,
        availableScales: Object.keys(this.scaleDefinitions).length,
        capabilities: [
          'melody_generation',
          'harmonization',
          'chord_progression',
          'scale_analysis'
        ]
      }
    };
  }
}

module.exports = { MelodyAgent };

# Zordic Music Studio - Component Specifications

## Overview

This document provides detailed specifications for each major component in the Zordic Music Studio system, including interfaces, dependencies, and implementation guidelines.

---

## 1. Music Pattern Agent

### Purpose
Learn user preferences, recommend patterns, and adapt to musical styles through continuous interaction.

### Responsibilities
- Track user interactions and preferences
- Generate personalized recommendations
- Adapt suggestions based on feedback
- Maintain user style profile

### Interface

```typescript
interface MusicPatternAgent {
  // Initialization
  initialize(userId: string, config: AgentConfig): Promise<void>;

  // Learning
  learnFromInteraction(interaction: UserInteraction): Promise<void>;
  updatePreferences(feedback: UserFeedback): Promise<void>;

  // Recommendations
  recommendPatterns(context: Context, limit: number): Promise<Pattern[]>;
  findSimilar(pattern: Pattern, limit: number): Promise<Pattern[]>;

  // Profile
  getUserProfile(userId: string): Promise<UserProfile>;
  exportProfile(userId: string): Promise<ProfileExport>;
}

interface UserInteraction {
  type: "create" | "like" | "dislike" | "use" | "share";
  pattern_id: string;
  timestamp: number;
  context: {
    session_duration?: number;
    project_type?: string;
    other_patterns?: string[];
  };
}

interface UserFeedback {
  pattern_id: string;
  rating: number;                      // 0-5 stars
  explicit: boolean;                   // User-provided vs. implicit
  comments?: string;
}

interface Context {
  bpm?: number;
  key?: string;
  genre?: string[];
  mood?: string[];
  duration?: number;
}
```

### Dependencies
- AgentDB Vector Database (pattern storage)
- Redis (caching)
- Event Bus (agent communication)

### Implementation Details

```typescript
class MusicPatternAgentImpl implements MusicPatternAgent {
  private agentDB: AgentDB;
  private embedder: PatternEmbedder;
  private learningEngine: ReasoningBankEngine;

  async initialize(userId: string, config: AgentConfig) {
    // Load or create user preferences
    let prefs = await this.agentDB.collection('user_preferences')
      .findOne({ user_id: userId });

    if (!prefs) {
      prefs = await this.createDefaultPreferences(userId);
    }

    this.userId = userId;
    this.preferences = prefs;

    // Initialize learning engine
    await this.learningEngine.loadModel(`user_${userId}`);
  }

  async learnFromInteraction(interaction: UserInteraction) {
    // 1. Update interaction history
    await this.recordInteraction(interaction);

    // 2. Adjust preference embedding
    const pattern = await this.loadPattern(interaction.pattern_id);
    const weight = this.getInteractionWeight(interaction.type);

    // Move user embedding toward liked patterns
    this.preferences.embedding = this.adjustEmbedding(
      this.preferences.embedding,
      pattern.embedding,
      weight
    );

    // 3. Store updated preferences
    await this.agentDB.collection('user_preferences')
      .update({ user_id: this.userId }, this.preferences);

    // 4. Create learning trace
    await this.learningEngine.recordTrace({
      task: `Recommendation for ${interaction.context.project_type}`,
      action: `User ${interaction.type} pattern ${interaction.pattern_id}`,
      outcome: interaction.type === 'like' ? 'success' : 'failure',
      reward: weight
    });
  }

  async recommendPatterns(context: Context, limit: number): Promise<Pattern[]> {
    // Hybrid recommendation: collaborative + content-based
    const [collaborative, contentBased] = await Promise.all([
      this.collaborativeFiltering(context, limit * 2),
      this.contentBasedFiltering(context, limit * 2)
    ]);

    // Merge and re-rank
    const merged = this.mergeRecommendations(collaborative, contentBased);

    // Apply diversity filter
    const diverse = this.ensureDiversity(merged, limit);

    return diverse;
  }

  private async collaborativeFiltering(
    context: Context,
    limit: number
  ): Promise<Pattern[]> {
    // Find users with similar taste
    const similarUsers = await this.agentDB.collection('user_preferences').search({
      vector: this.preferences.embedding,
      limit: 50,
      filter: { user_id: { $ne: this.userId } }
    });

    // Aggregate their favorite patterns
    const patternCounts = new Map<string, number>();

    for (const user of similarUsers) {
      const similarity = 1 - user.distance;
      for (const patternId of user.liked_patterns || []) {
        const current = patternCounts.get(patternId) || 0;
        patternCounts.set(patternId, current + similarity);
      }
    }

    // Get top patterns
    const topPatternIds = Array.from(patternCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    return this.loadPatterns(topPatternIds);
  }

  private async contentBasedFiltering(
    context: Context,
    limit: number
  ): Promise<Pattern[]> {
    // Create context embedding
    const contextEmbedding = await this.embedder.embedContext(context);

    // Combine with user preferences
    const queryEmbedding = this.combineEmbeddings(
      this.preferences.embedding,
      contextEmbedding,
      0.7, // 70% user prefs, 30% context
      0.3
    );

    // Search AgentDB
    return this.agentDB.collection('beat_patterns').search({
      vector: queryEmbedding,
      limit: limit,
      filter: this.buildFilter(context)
    });
  }

  private mergeRecommendations(
    collaborative: Pattern[],
    contentBased: Pattern[]
  ): Pattern[] {
    // Combine with reciprocal rank fusion
    const scores = new Map<string, number>();

    collaborative.forEach((pattern, rank) => {
      scores.set(pattern.id, 1 / (rank + 60)); // RRF with k=60
    });

    contentBased.forEach((pattern, rank) => {
      const current = scores.get(pattern.id) || 0;
      scores.set(pattern.id, current + 1 / (rank + 60));
    });

    // Sort by combined score
    const sortedIds = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);

    // Return full pattern objects
    return sortedIds.map(id =>
      collaborative.find(p => p.id === id) ||
      contentBased.find(p => p.id === id)
    ).filter(Boolean);
  }

  private ensureDiversity(patterns: Pattern[], limit: number): Pattern[] {
    // Maximal Marginal Relevance (MMR) for diversity
    const selected: Pattern[] = [];
    const remaining = [...patterns];

    // Always select the top-ranked item
    selected.push(remaining.shift());

    while (selected.length < limit && remaining.length > 0) {
      let maxMmr = -Infinity;
      let maxIndex = 0;

      for (let i = 0; i < remaining.length; i++) {
        const pattern = remaining[i];

        // Relevance score (rank-based)
        const relevance = 1 - (i / remaining.length);

        // Diversity score (distance from selected items)
        const minSimilarity = Math.min(
          ...selected.map(s => this.cosineSimilarity(pattern.embedding, s.embedding))
        );

        // MMR: balance relevance and diversity (λ=0.5)
        const mmr = 0.5 * relevance + 0.5 * minSimilarity;

        if (mmr > maxMmr) {
          maxMmr = mmr;
          maxIndex = i;
        }
      }

      selected.push(remaining.splice(maxIndex, 1)[0]);
    }

    return selected;
  }
}
```

### Performance Requirements
- Recommendation generation: <500ms
- Preference update: <100ms
- User profile load: <50ms

### Testing Strategy
- Unit tests for embedding calculations
- Integration tests with AgentDB
- A/B testing for recommendation quality
- User satisfaction metrics (CTR, engagement time)

---

## 2. Beat Agent

### Purpose
Generate rhythmic patterns, quantize user input, and maintain groove consistency.

### Responsibilities
- Generate drum patterns based on genre and style
- Quantize user input to grid
- Maintain rhythmic coherence
- Suggest variations and fills

### Interface

```typescript
interface BeatAgent {
  // Generation
  generateBeat(params: BeatParams): Promise<BeatPattern>;
  generateVariation(basePattern: BeatPattern, variation: VariationType): Promise<BeatPattern>;
  generateFill(currentPattern: BeatPattern, bars: number): Promise<BeatPattern>;

  // Quantization
  quantize(hits: DrumHit[], grid: QuantizeGrid): DrumHit[];

  // Analysis
  analyzeGroove(pattern: BeatPattern): GrooveAnalysis;
  suggestImprovements(pattern: BeatPattern): Suggestion[];
}

interface BeatParams {
  bpm: number;
  time_signature: string;
  genre: string;
  complexity: number;                  // 1-10
  instruments: string[];
  duration_bars: number;
}

interface GrooveAnalysis {
  density: number;                     // Hits per beat
  syncopation: number;                 // Off-beat emphasis
  pocket: string;                      // "ahead", "center", "behind"
  swing_amount: number;                // 0-100%
  humanization: number;                // Timing variation
}
```

### Implementation

```typescript
class BeatAgentImpl implements BeatAgent {
  private patterns: PatternLibrary;
  private generator: MarkovChainGenerator;

  async generateBeat(params: BeatParams): Promise<BeatPattern> {
    // 1. Find similar patterns from library
    const contextEmbedding = await this.embedBeatParams(params);

    const similarPatterns = await agentDB.collection('beat_patterns').search({
      vector: contextEmbedding,
      limit: 10,
      filter: {
        genre: params.genre,
        time_signature: params.time_signature
      }
    });

    // 2. Build Markov chain from similar patterns
    const chain = this.generator.buildChain(similarPatterns, {
      order: 2,                        // 2nd order Markov chain
      instruments: params.instruments
    });

    // 3. Generate sequence
    const sequence = chain.generate({
      length: params.duration_bars * 16, // 16th note resolution
      temperature: params.complexity / 10 // Higher complexity = more randomness
    });

    // 4. Apply groove and humanization
    const grooved = this.applyGroove(sequence, params);

    // 5. Create pattern object
    const pattern: BeatPattern = {
      id: uuidv4(),
      name: `Generated ${params.genre} beat`,
      bpm: params.bpm,
      time_signature: params.time_signature,
      genre: [params.genre],
      complexity: params.complexity,
      duration_bars: params.duration_bars,
      sequence: grooved,
      instruments: params.instruments,
      groove_type: this.detectGrooveType(grooved),
      embedding: contextEmbedding,
      created_at: Date.now(),
      user_id: 'system',
      is_public: false,
      tags: [],
      usage_count: 0,
      rating: 0,
      distance_metric: 'cosine'
    };

    return pattern;
  }

  generateVariation(basePattern: BeatPattern, variation: VariationType): Promise<BeatPattern> {
    const variations = {
      subtle: () => this.addHumanization(basePattern, 0.1),
      moderate: () => this.mutatePattern(basePattern, 0.3),
      major: () => this.transformPattern(basePattern, 0.6)
    };

    return variations[variation]();
  }

  private applyGroove(sequence: DrumHit[], params: BeatParams): DrumHit[] {
    // Apply swing
    const swing = this.detectSwingAmount(params.genre);

    return sequence.map(hit => {
      const beatPosition = hit.time % 1;

      // Apply swing to off-beats
      if (beatPosition === 0.5) {
        hit.time += swing * 0.1; // Delay 16th notes
      }

      // Humanize timing (±5ms)
      hit.time += (Math.random() - 0.5) * 0.01;

      // Humanize velocity (±10%)
      hit.velocity *= 0.9 + Math.random() * 0.2;

      return hit;
    });
  }

  quantize(hits: DrumHit[], grid: QuantizeGrid): DrumHit[] {
    const gridSize = 1 / grid.division; // e.g., 1/16 for 16th notes

    return hits.map(hit => {
      const snappedTime = Math.round(hit.time / gridSize) * gridSize;

      return {
        ...hit,
        time: snappedTime,
        // Preserve some human feel
        velocity: grid.humanize ? hit.velocity : Math.round(hit.velocity)
      };
    });
  }
}
```

---

## 3. Melody Agent

### Purpose
Compose melodic sequences that complement rhythmic patterns and follow harmonic constraints.

### Interface

```typescript
interface MelodyAgent {
  // Composition
  composeMelody(params: MelodyParams): Promise<MelodyPattern>;
  harmonize(melody: MelodyPattern, harmony: HarmonyPattern): Promise<MelodyPattern>;

  // Variation
  transpose(melody: MelodyPattern, semitones: number): MelodyPattern;
  invert(melody: MelodyPattern): MelodyPattern;
  retrograde(melody: MelodyPattern): MelodyPattern;

  // Analysis
  analyzeContour(melody: MelodyPattern): ContourAnalysis;
  extractMotifs(melody: MelodyPattern): Motif[];
}

interface MelodyParams {
  key: string;
  scale: string;
  octave_range: [number, number];
  duration_bars: number;
  complexity: number;
  style: string;                       // "stepwise", "leaping", "mixed"
  rhythm_source?: BeatPattern;         // Sync with rhythm
}

interface ContourAnalysis {
  direction: "ascending" | "descending" | "arch" | "inverted_arch" | "wave";
  peaks: number[];                     // Indices of peak notes
  valleys: number[];
  range: number;                       // Semitones
  tessitura: number;                   // Average pitch
}
```

### Implementation

```typescript
class MelodyAgentImpl implements MelodyAgent {
  private scaleGenerator: ScaleGenerator;
  private rhythmicMotifs: MotifLibrary;

  async composeMelody(params: MelodyParams): Promise<MelodyPattern> {
    // 1. Get scale notes
    const scale = this.scaleGenerator.getScale(params.key, params.scale);
    const notes = this.expandScale(scale, params.octave_range);

    // 2. Generate rhythmic foundation
    const rhythm = params.rhythm_source ?
      this.extractRhythm(params.rhythm_source) :
      this.generateRhythm(params.duration_bars);

    // 3. Generate melodic contour
    const contour = this.generateContour({
      length: rhythm.length,
      complexity: params.complexity,
      style: params.style
    });

    // 4. Map contour to pitches
    const pitches = this.mapContourToPitches(contour, notes, params);

    // 5. Combine rhythm and pitches
    const noteSequence: Note[] = rhythm.map((rhythmEvent, i) => ({
      pitch: pitches[i],
      duration: rhythmEvent.duration,
      velocity: rhythmEvent.velocity,
      start_time: rhythmEvent.start_time
    }));

    // 6. Apply musical constraints
    const refined = this.applyConstraints(noteSequence, {
      maxInterval: params.complexity > 7 ? 12 : 7, // Max leap size
      avoidRepeats: params.complexity > 3,
      preferStepwise: params.style === 'stepwise'
    });

    // 7. Create pattern
    const embedding = await this.embedMelody({
      ...params,
      notes: refined
    });

    return {
      id: uuidv4(),
      name: `Generated ${params.key} ${params.scale} melody`,
      key: params.key,
      scale: params.scale,
      octave_range: params.octave_range,
      interval_complexity: this.calculateIntervalComplexity(refined),
      notes: refined,
      duration_bars: params.duration_bars,
      contour: contour.type,
      motif_type: this.detectMotifType(refined),
      embedding: embedding,
      emotion: this.detectEmotion(refined, params.scale),
      genre: [],
      usage_count: 0,
      created_at: Date.now(),
      distance_metric: 'cosine'
    };
  }

  private generateContour(params: {
    length: number;
    complexity: number;
    style: string;
  }): { type: string; points: number[] } {
    // Generate melodic contour using fractals or random walk
    const points: number[] = [];
    let current = 0.5; // Start in middle

    for (let i = 0; i < params.length; i++) {
      // Random walk with bounds
      const step = (Math.random() - 0.5) * (params.complexity / 10);
      current = Math.max(0, Math.min(1, current + step));
      points.push(current);
    }

    // Detect contour type
    const type = this.detectContourType(points);

    return { type, points };
  }

  private mapContourToPitches(
    contour: { points: number[] },
    availableNotes: number[],
    params: MelodyParams
  ): number[] {
    return contour.points.map(point => {
      // Map 0-1 contour to note range
      const index = Math.floor(point * (availableNotes.length - 1));
      return availableNotes[index];
    });
  }

  harmonize(melody: MelodyPattern, harmony: HarmonyPattern): Promise<MelodyPattern> {
    // Adjust melody to fit chord progression
    const harmonizedNotes = melody.notes.map((note, i) => {
      const currentTime = note.start_time;

      // Find active chord at this time
      const activeChord = this.findChordAtTime(harmony, currentTime);

      // If note is not in chord, adjust to nearest chord tone
      if (!this.isChordTone(note.pitch, activeChord)) {
        return {
          ...note,
          pitch: this.findNearestChordTone(note.pitch, activeChord)
        };
      }

      return note;
    });

    return {
      ...melody,
      notes: harmonizedNotes
    };
  }
}
```

---

## 4. Harmony Agent

### Purpose
Generate chord progressions, voice leading, and harmonic analysis.

### Interface

```typescript
interface HarmonyAgent {
  // Generation
  generateProgression(params: HarmonyParams): Promise<HarmonyPattern>;
  suggestNextChord(currentChords: Chord[], key: string): Chord[];

  // Voice Leading
  voiceLeading(chords: Chord[], style: VoiceLeadingStyle): Chord[];

  // Analysis
  analyzeProgression(pattern: HarmonyPattern): ProgressionAnalysis;
  detectKey(chords: Chord[]): string;
}

interface HarmonyParams {
  key: string;
  duration_bars: number;
  complexity: number;
  style: string;                       // "classical", "jazz", "pop"
  mood: string;                        // "happy", "sad", "tense"
}

interface ProgressionAnalysis {
  key: string;
  common_progressions: string[];       // e.g., ["I-V-vi-IV"]
  tension_points: number[];            // Bar numbers with high tension
  cadence_type: string;
  modal_interchange: boolean;
}
```

### Implementation

```typescript
class HarmonyAgentImpl implements HarmonyAgent {
  private markovModel: ChordMarkovChain;
  private voiceLeader: VoiceLeader;

  async generateProgression(params: HarmonyParams): Promise<HarmonyPattern> {
    // 1. Load chord transition probabilities for style
    await this.markovModel.loadStyle(params.style);

    // 2. Generate chord sequence
    const romanNumerals = this.markovModel.generate({
      length: params.duration_bars,
      start: 'I',                      // Start on tonic
      end: 'I',                        // End on tonic
      mood: params.mood
    });

    // 3. Convert to actual chords
    const chords = this.romanToChords(romanNumerals, params.key);

    // 4. Apply voice leading
    const voiced = this.voiceLeader.applyVoiceLeading(chords, {
      style: params.style === 'classical' ? 'smooth' : 'varied',
      range: [48, 72]                  // C3 to C5
    });

    // 5. Calculate tension curve
    const tensionCurve = this.calculateTensionCurve(voiced);

    return {
      id: uuidv4(),
      name: `${params.key} ${params.style} progression`,
      key: params.key,
      progression: romanNumerals,
      chords: voiced,
      cadence_type: this.detectCadence(romanNumerals),
      tension_curve: tensionCurve,
      voice_leading: this.extractVoiceLeading(voiced),
      embedding: await this.embedHarmony(voiced),
      mood: [params.mood],
      complexity: params.complexity,
      created_at: Date.now(),
      distance_metric: 'cosine'
    };
  }

  private calculateTensionCurve(chords: Chord[]): number[] {
    return chords.map((chord, i) => {
      let tension = 0;

      // Distance from tonic
      tension += this.distanceFromTonic(chord) * 0.4;

      // Dissonance level
      tension += this.calculateDissonance(chord) * 0.3;

      // Preparation for resolution
      if (i < chords.length - 1) {
        const nextChord = chords[i + 1];
        tension += this.resolutionTendency(chord, nextChord) * 0.3;
      }

      return Math.min(1, tension);
    });
  }
}
```

---

## 5. Visual Agent

### Purpose
Generate and synchronize visual effects with audio in real-time.

### Interface

```typescript
interface VisualAgent {
  // Generation
  generateVisuals(audioContext: AudioContext, template: VisualTemplate): VisualEffect[];
  syncToAudio(visual: VisualEffect, audioEvent: AudioEvent): void;

  // Rendering
  render(canvas: HTMLCanvasElement, effects: VisualEffect[], time: number): void;

  // Templates
  createTemplate(params: VisualTemplateParams): VisualTemplate;
  findMatchingTemplate(audioSignature: AudioSignature): VisualTemplate;
}

interface VisualEffect {
  id: string;
  type: "particles" | "waveform" | "spectrum" | "geometry";
  properties: EffectProperties;
  animation: Animation;
  audioBinding: AudioBinding;
}

interface AudioBinding {
  parameter: string;                   // "amplitude", "frequency", "onset"
  frequencyRange?: [number, number];
  mapping: (audioValue: number) => number;
  smoothing: number;                   // 0-1
}
```

### Implementation

```typescript
class VisualAgentImpl implements VisualAgent {
  private analyser: AnalyserNode;
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;

  generateVisuals(audioContext: AudioContext, template: VisualTemplate): VisualEffect[] {
    // Create analyser node
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 2048;

    const effects: VisualEffect[] = [];

    // Create particle system for beats
    if (template.effect_type.includes('particles')) {
      effects.push(this.createParticleEffect(template));
    }

    // Create spectrum visualizer
    if (template.effect_type.includes('spectrum')) {
      effects.push(this.createSpectrumEffect(template));
    }

    // Create waveform
    if (template.effect_type.includes('waveform')) {
      effects.push(this.createWaveformEffect(template));
    }

    return effects;
  }

  render(canvas: HTMLCanvasElement, effects: VisualEffect[], time: number): void {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get audio data
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);

    // Render each effect
    for (const effect of effects) {
      switch (effect.type) {
        case 'particles':
          this.renderParticles(ctx, effect, dataArray, time);
          break;
        case 'spectrum':
          this.renderSpectrum(ctx, effect, dataArray);
          break;
        case 'waveform':
          this.renderWaveform(ctx, effect, dataArray);
          break;
      }
    }
  }

  private renderParticles(
    ctx: CanvasRenderingContext2D,
    effect: VisualEffect,
    audioData: Uint8Array,
    time: number
  ): void {
    const particles = effect.properties.particles || [];

    // Update particle positions
    particles.forEach(particle => {
      // Map audio to particle properties
      const audioValue = this.getAudioValue(audioData, effect.audioBinding);
      const mappedValue = effect.audioBinding.mapping(audioValue);

      particle.size = particle.baseSize * (1 + mappedValue);
      particle.opacity = 0.5 + mappedValue * 0.5;

      // Update position
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;

      // Gravity
      particle.velocityY += 0.1;

      // Bounce
      if (particle.y > ctx.canvas.height) {
        particle.y = ctx.canvas.height;
        particle.velocityY *= -0.8;
      }

      // Draw
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}
```

---

## 6. Teacher Agent

### Purpose
Provide educational guidance, track progress, and adapt curriculum to student needs.

### Interface

```typescript
interface TeacherAgent {
  // Curriculum
  getNextLesson(userId: string): Promise<Lesson>;
  assessSkillLevel(userId: string): Promise<SkillAssessment>;

  // Guidance
  provideFeedback(userWork: Project, context: LearningContext): Promise<Feedback>;
  suggestExercises(skill: string, level: number): Promise<Exercise[]>;

  // Progress
  trackProgress(userId: string, lessonId: string, result: LessonResult): Promise<void>;
  generateReport(userId: string, period: DateRange): Promise<ProgressReport>;
}

interface SkillAssessment {
  overall_level: number;               // 1-10
  skills: {
    rhythm: number;
    melody: number;
    harmony: number;
    composition: number;
    technical: number;
  };
  strengths: string[];
  areas_for_improvement: string[];
  recommended_lessons: string[];
}

interface Feedback {
  overall_score: number;               // 0-100
  positive_aspects: string[];
  suggestions: Suggestion[];
  next_steps: string[];
  encouragement: string;
}
```

### Implementation

```typescript
class TeacherAgentImpl implements TeacherAgent {
  private curriculum: CurriculumGraph;
  private assessor: SkillAssessor;

  async getNextLesson(userId: string): Promise<Lesson> {
    // 1. Load student profile
    const profile = await this.loadStudentProfile(userId);

    // 2. Assess current skill level
    const skills = await this.assessSkillLevel(userId);

    // 3. Find lessons in curriculum graph
    const availableLessons = this.curriculum.getAvailableLessons({
      completed: profile.completed_lessons,
      skillLevel: skills.overall_level
    });

    // 4. Select best lesson based on:
    //    - Skill gaps
    //    - Learning pace
    //    - User interests
    const scored = availableLessons.map(lesson => ({
      lesson,
      score: this.scoreLessonRelevance(lesson, skills, profile)
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored[0].lesson;
  }

  async provideFeedback(userWork: Project, context: LearningContext): Promise<Feedback> {
    // 1. Analyze the work
    const analysis = await this.analyzeProject(userWork);

    // 2. Compare to learning objectives
    const objectives = context.lesson.objectives;
    const achievement = this.measureAchievement(analysis, objectives);

    // 3. Generate constructive feedback
    const positive = this.identifyPositiveAspects(analysis, objectives);
    const suggestions = this.generateSuggestions(analysis, achievement);

    // 4. Determine next steps
    const nextSteps = this.recommendNextSteps(achievement, context);

    return {
      overall_score: achievement.score,
      positive_aspects: positive,
      suggestions: suggestions,
      next_steps: nextSteps,
      encouragement: this.generateEncouragement(achievement.score)
    };
  }

  private async analyzeProject(project: Project): Promise<ProjectAnalysis> {
    return {
      rhythm_quality: await this.analyzeRhythm(project.beat_pattern),
      melody_quality: await this.analyzeMelody(project.melody_pattern),
      harmony_quality: await this.analyzeHarmony(project.harmony_pattern),
      creativity: this.measureCreativity(project),
      technical_execution: this.assessTechnicalSkill(project),
      completion: project.is_complete ? 1 : 0
    };
  }
}
```

---

## 7. Collaboration Agent

### Purpose
Manage multi-user sessions, conflict resolution, and role coordination.

### Interface

```typescript
interface CollaborationAgent {
  // Session Management
  createSession(projectId: string, config: SessionConfig): Promise<Session>;
  joinSession(sessionId: string, userId: string): Promise<void>;
  leaveSession(sessionId: string, userId: string): Promise<void>;

  // Synchronization
  synchronizeState(sessionId: string): Promise<ProjectState>;
  applyOperation(sessionId: string, op: Operation): Promise<void>;
  resolveConflict(op1: Operation, op2: Operation): Operation;

  // Roles & Permissions
  assignRole(sessionId: string, userId: string, role: Role): Promise<void>;
  checkPermission(userId: string, action: string): boolean;
}

interface SessionConfig {
  max_participants: number;
  allow_public: boolean;
  conflict_resolution: "ot" | "crdt" | "lock";
  auto_save_interval: number;
}
```

---

**Performance Benchmarks**

| Component | Latency Target | Throughput Target |
|-----------|----------------|-------------------|
| Pattern Agent | <500ms (recommendations) | 100 req/s |
| Beat Agent | <200ms (generation) | 50 req/s |
| Melody Agent | <300ms (composition) | 50 req/s |
| Harmony Agent | <250ms (progression) | 30 req/s |
| Visual Agent | 60 FPS (rendering) | N/A |
| Teacher Agent | <1s (feedback) | 20 req/s |
| Collaboration Agent | <50ms (sync) | 1000 ops/s |

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-21
**Architecture Team**

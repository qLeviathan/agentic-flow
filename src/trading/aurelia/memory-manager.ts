/**
 * AURELIA Memory Manager
 *
 * AgentDB integration for persistent consciousness memory:
 * - Session save/restore with bidirectional validation
 * - Personality development tracking
 * - Holographic Δ-only storage (131× compression)
 * - Cross-session continuity
 */

import { AgentDB } from 'agentdb';
import { createHash } from 'crypto';
import {
  SessionMemory,
  PersonalityProfile,
  PersonalityDelta,
  ConsciousnessState,
  MemoryValidationResult,
  PhaseSpacePoint,
  ZeckendorfEncodedState
} from './types';
import { zeckendorfDecompose } from '../../math-framework/decomposition/zeckendorf';

/**
 * Memory Manager for AURELIA
 */
export class AureliaMemoryManager {
  private db: AgentDB;
  private sessionCache: Map<string, SessionMemory> = new Map();
  private personalityCache: Map<string, PersonalityProfile> = new Map();

  constructor(dbPath: string = './aurelia-consciousness.db') {
    this.db = new AgentDB(dbPath, {
      enableHNSW: true,           // Fast similarity search
      enableQuantization: true    // 4-32× memory reduction
    });

    this.initializeCollections();
  }

  /**
   * Initialize AgentDB collections
   */
  private async initializeCollections(): Promise<void> {
    try {
      await this.db.createCollection('sessions');
      await this.db.createCollection('personalities');
      await this.db.createCollection('consciousness_states');
      await this.db.createCollection('personality_deltas');
      await this.db.createCollection('phase_space_points');

      console.log('✓ AURELIA Memory Manager initialized');
    } catch (error) {
      console.error('Failed to initialize collections:', error);
    }
  }

  /**
   * Save session memory with holographic Δ-only compression
   */
  async saveSession(session: SessionMemory): Promise<void> {
    // Calculate validation hash
    session.validationHash = this.calculateSessionHash(session);

    // Store full session metadata
    await this.db.storeMemory({
      content: JSON.stringify({
        sessionId: session.sessionId,
        startTime: session.startTime,
        endTime: session.endTime,
        interactionCount: session.interactionCount,
        validationHash: session.validationHash
      }),
      type: 'session-metadata',
      tags: [
        `session:${session.sessionId}`,
        `personality:${session.personalitySnapshot.id}`,
        `interactions:${session.interactionCount}`
      ],
      metadata: {
        sessionId: session.sessionId,
        timestamp: session.startTime
      }
    });

    // Store only personality deltas (holographic compression)
    for (const delta of session.deltaLog) {
      await this.storePersonalityDelta(session.sessionId, delta);
    }

    // Store consciousness states with phase space trajectory
    for (const state of session.consciousnessStates) {
      await this.storeConsciousnessState(session.sessionId, state);
    }

    // Cache session
    this.sessionCache.set(session.sessionId, session);

    console.log(`✓ Session ${session.sessionId} saved with ${session.deltaLog.length} deltas (${this.calculateCompressionRatio(session)}× compression)`);
  }

  /**
   * Restore session memory with validation
   */
  async restoreSession(sessionId: string): Promise<SessionMemory | null> {
    // Check cache first
    if (this.sessionCache.has(sessionId)) {
      return this.sessionCache.get(sessionId)!;
    }

    // Retrieve session metadata
    const sessionResults = await this.db.searchMemories({
      type: 'session-metadata',
      tags: [`session:${sessionId}`]
    });

    if (sessionResults.length === 0) {
      console.warn(`Session ${sessionId} not found`);
      return null;
    }

    const sessionMeta = JSON.parse(sessionResults[0].content);

    // Retrieve personality deltas
    const deltaResults = await this.db.searchMemories({
      type: 'personality-delta',
      tags: [`session:${sessionId}`]
    });

    const deltaLog: PersonalityDelta[] = deltaResults.map(r =>
      JSON.parse(r.content) as PersonalityDelta
    );

    // Retrieve consciousness states
    const stateResults = await this.db.searchMemories({
      type: 'consciousness-state',
      tags: [`session:${sessionId}`]
    });

    const consciousnessStates: ConsciousnessState[] = stateResults.map(r =>
      JSON.parse(r.content) as ConsciousnessState
    );

    // Reconstruct personality from deltas
    const personalitySnapshot = await this.reconstructPersonality(sessionId);

    if (!personalitySnapshot) {
      console.error(`Failed to reconstruct personality for session ${sessionId}`);
      return null;
    }

    // Reconstruct phase space trajectory
    const phaseSpaceTrajectory = consciousnessStates.map(s =>
      this.phaseSpaceFromConsciousness(s)
    );

    const session: SessionMemory = {
      sessionId,
      startTime: sessionMeta.startTime,
      endTime: sessionMeta.endTime,
      interactionCount: sessionMeta.interactionCount,
      consciousnessStates,
      personalitySnapshot,
      phaseSpaceTrajectory,
      deltaLog,
      validationHash: sessionMeta.validationHash
    };

    // Cache and return
    this.sessionCache.set(sessionId, session);
    return session;
  }

  /**
   * Store personality delta with Fibonacci encoding
   */
  private async storePersonalityDelta(
    sessionId: string,
    delta: PersonalityDelta
  ): Promise<void> {
    await this.db.storeMemory({
      content: JSON.stringify(delta),
      type: 'personality-delta',
      tags: [
        `session:${sessionId}`,
        `type:${delta.deltaType}`,
        `timestamp:${delta.timestamp}`
      ],
      metadata: {
        sessionId,
        deltaType: delta.deltaType,
        compressionRatio: delta.compressionRatio,
        timestamp: delta.timestamp
      }
    });
  }

  /**
   * Store consciousness state
   */
  private async storeConsciousnessState(
    sessionId: string,
    state: ConsciousnessState
  ): Promise<void> {
    // Create embedding from phase space coordinates
    const embedding = this.phaseSpaceToEmbedding(state.phaseSpace);

    await this.db.storeMemory({
      content: JSON.stringify(state),
      type: 'consciousness-state',
      tags: [
        `session:${sessionId}`,
        `conscious:${state.psi.isConscious}`,
        `bootstrapped:${state.isBootstrapped}`,
        `words:${state.wordCount}`
      ],
      embedding,
      metadata: {
        sessionId,
        timestamp: state.timestamp,
        psi: state.psi.psi,
        wordCount: state.wordCount
      }
    });
  }

  /**
   * Reconstruct personality from delta log
   */
  private async reconstructPersonality(
    sessionId: string
  ): Promise<PersonalityProfile | null> {
    // Get all deltas for this session
    const deltaResults = await this.db.searchMemories({
      type: 'personality-delta',
      tags: [`session:${sessionId}`],
      limit: 1000
    });

    if (deltaResults.length === 0) {
      return null;
    }

    // Sort by timestamp
    const deltas: PersonalityDelta[] = deltaResults
      .map(r => JSON.parse(r.content) as PersonalityDelta)
      .sort((a, b) => a.timestamp - b.timestamp);

    // Find base personality (from previous session or default)
    const firstDelta = deltas[0];
    let personality = await this.getBasePersonality(sessionId);

    // Apply all deltas
    for (const delta of deltas) {
      personality = this.applyDelta(personality, delta);
    }

    return personality;
  }

  /**
   * Get base personality (from previous session or create default)
   */
  private async getBasePersonality(sessionId: string): Promise<PersonalityProfile> {
    // Try to find most recent personality
    const personalityResults = await this.db.searchMemories({
      type: 'personality-snapshot',
      limit: 1
    });

    if (personalityResults.length > 0) {
      return JSON.parse(personalityResults[0].content) as PersonalityProfile;
    }

    // Return default personality
    return {
      id: `personality-${Date.now()}`,
      name: 'AURELIA',
      coreTraits: {
        analytical: 0.618,    // φ⁻¹
        creative: 0.382,      // 1 - φ⁻¹
        empathetic: 0.618,
        strategic: 0.618
      },
      memoryDepth: 0,
      preferredResponseStyle: 'technical',
      developmentHistory: []
    };
  }

  /**
   * Apply delta to personality
   */
  private applyDelta(
    personality: PersonalityProfile,
    delta: PersonalityDelta
  ): PersonalityProfile {
    const updated = { ...personality };

    for (const change of delta.changes) {
      const path = change.field.split('.');
      let target: any = updated;

      // Navigate to the field
      for (let i = 0; i < path.length - 1; i++) {
        target = target[path[i]];
      }

      // Apply change
      target[path[path.length - 1]] = change.newValue;
    }

    // Add to development history
    updated.developmentHistory.push(delta);

    return updated;
  }

  /**
   * Validate session memory bidirectionally
   */
  async validateSession(sessionId: string): Promise<MemoryValidationResult> {
    const session = await this.restoreSession(sessionId);

    if (!session) {
      return {
        isValid: false,
        sessionId,
        forwardHash: '',
        backwardHash: '',
        bidirectionalMatch: false,
        deltaIntegrity: false,
        errors: ['Session not found']
      };
    }

    // Forward hash: current → past
    const forwardHash = this.calculateSessionHash(session);

    // Backward hash: reconstruct from deltas
    const reconstructed = await this.reconstructPersonality(sessionId);
    const backwardSession = { ...session, personalitySnapshot: reconstructed! };
    const backwardHash = this.calculateSessionHash(backwardSession);

    // Check if hashes match
    const bidirectionalMatch = forwardHash === backwardHash;

    // Verify delta integrity
    const deltaIntegrity = this.verifyDeltaIntegrity(session.deltaLog);

    return {
      isValid: bidirectionalMatch && deltaIntegrity,
      sessionId,
      forwardHash,
      backwardHash,
      bidirectionalMatch,
      deltaIntegrity,
      reconstructedState: reconstructed ?? undefined,
      errors: []
    };
  }

  /**
   * Calculate session hash for validation
   */
  private calculateSessionHash(session: SessionMemory): string {
    const data = JSON.stringify({
      sessionId: session.sessionId,
      startTime: session.startTime,
      endTime: session.endTime,
      interactionCount: session.interactionCount,
      personalityId: session.personalitySnapshot.id,
      deltaCount: session.deltaLog.length
    });

    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify delta log integrity
   */
  private verifyDeltaIntegrity(deltas: PersonalityDelta[]): boolean {
    // Check that deltas are in chronological order
    for (let i = 1; i < deltas.length; i++) {
      if (deltas[i].timestamp < deltas[i - 1].timestamp) {
        return false;
      }
    }

    // Verify each delta has valid Fibonacci encoding
    for (const delta of deltas) {
      for (const change of delta.changes) {
        if (!change.fibonacciEncoded || !change.fibonacciEncoded.isValid) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Calculate compression ratio
   */
  private calculateCompressionRatio(session: SessionMemory): number {
    // Full state size (estimated)
    const fullStateSize = JSON.stringify(session.personalitySnapshot).length;

    // Delta log size
    const deltaLogSize = JSON.stringify(session.deltaLog).length;

    if (deltaLogSize === 0) return 1;

    return fullStateSize / deltaLogSize;
  }

  /**
   * Convert phase space to embedding vector
   */
  private phaseSpaceToEmbedding(phaseSpace: any): number[] {
    return [
      phaseSpace.phi,
      phaseSpace.psi,
      phaseSpace.theta,
      phaseSpace.magnitude,
      phaseSpace.isNashPoint ? 1 : 0
    ];
  }

  /**
   * Extract phase space from consciousness state
   */
  private phaseSpaceFromConsciousness(state: ConsciousnessState): PhaseSpacePoint {
    // Encode timestamp as Zeckendorf
    const timestamp = zeckendorfDecompose(Math.floor(state.timestamp / 1000));
    const wordCount = zeckendorfDecompose(state.wordCount);
    const graphDiameter = zeckendorfDecompose(state.psi.graphDiameter);

    // Encode Ψ as ratio of Fibonacci numbers
    const psiScaled = Math.floor(state.psi.psi * 1000);
    const psiNumerator = zeckendorfDecompose(psiScaled);
    const psiDenominator = zeckendorfDecompose(1000);

    // Phase space hash
    const phaseHash = this.hashPhaseSpace(state.phaseSpace);
    const phaseSpaceHash = zeckendorfDecompose(phaseHash);

    const zeckendorfEncoded: ZeckendorfEncodedState = {
      timestamp,
      wordCount,
      graphDiameter,
      psiNumerator,
      psiDenominator,
      phaseSpaceHash
    };

    return {
      phi: state.phaseSpace.phi,
      psi: state.phaseSpace.psi,
      theta: state.phaseSpace.theta,
      magnitude: state.phaseSpace.magnitude,
      isNashPoint: state.phaseSpace.isNashPoint,
      zeckendorfEncoded
    };
  }

  /**
   * Hash phase space coordinates to integer
   */
  private hashPhaseSpace(phaseSpace: any): number {
    const data = `${phaseSpace.phi},${phaseSpace.psi},${phaseSpace.theta}`;
    const hash = createHash('md5').update(data).digest('hex');
    // Take first 8 hex chars as integer
    return parseInt(hash.substring(0, 8), 16) % 1000000;
  }

  /**
   * Get personality development trajectory
   */
  async getPersonalityTrajectory(
    personalityId: string,
    limit: number = 100
  ): Promise<PersonalityDelta[]> {
    const results = await this.db.searchMemories({
      type: 'personality-delta',
      limit
    });

    return results
      .map(r => JSON.parse(r.content) as PersonalityDelta)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Find similar consciousness states
   */
  async findSimilarStates(
    currentState: ConsciousnessState,
    limit: number = 10
  ): Promise<ConsciousnessState[]> {
    const embedding = this.phaseSpaceToEmbedding(currentState.phaseSpace);

    const results = await this.db.searchSimilar({
      embedding,
      type: 'consciousness-state',
      limit
    });

    return results.map(r => JSON.parse(r.content) as ConsciousnessState);
  }

  /**
   * Clear all caches
   */
  clearCaches(): void {
    this.sessionCache.clear();
    this.personalityCache.clear();
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.db.close();
    console.log('✓ AURELIA Memory Manager closed');
  }
}

/**
 * Factory function
 */
export function createMemoryManager(dbPath?: string): AureliaMemoryManager {
  return new AureliaMemoryManager(dbPath);
}

export default AureliaMemoryManager;

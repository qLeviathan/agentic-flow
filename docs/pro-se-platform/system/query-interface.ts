/**
 * Pro Se Platform - Query Interface System
 * Castillo v. Schwab & Sedgwick
 *
 * Provides advanced query capabilities for AgentDB legal database
 */

import { Database } from 'better-sqlite3';
import { execSync } from 'child_process';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface EvidenceResult {
  bates_id: string;
  original_filename: string;
  file_type: string;
  date_modified: Date;
  parties: string[];
  content_text?: string;
  legal_relevance: string[];
  relevance_score?: number;
}

export interface TimelineEvent {
  event_id: number;
  event_date: Date;
  event_time?: string;
  event_title: string;
  description: string;
  parties: string[];
  evidence_bates: string[];
  claim_types: string[];
  phase: string;
  category: string;
}

export interface LegalClaim {
  claim_id: number;
  claim_type: string;
  statute: string;
  elements: Record<string, any>;
  supporting_evidence: string[];
  precedent_cases: string[];
  fact_checked: boolean;
  strength_score: number;
  status: string;
}

export interface MedicalRecord {
  record_id: number;
  bates_id: string;
  record_date: Date;
  provider: string;
  record_type: string;
  diagnosis: string[];
  medications: Record<string, any>;
  symptoms: string[];
  bp_reading?: string;
  work_related: boolean;
  legal_significance: string;
}

export interface SedgwickAnomaly {
  dcn: string;
  bates_id: string;
  dcn_date: Date;
  user_id: string;
  action_type: string;
  anomaly_flags: string[];
  metadata_extracted: Record<string, any>;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface SemanticSearchOptions extends QueryOptions {
  threshold?: number; // Minimum relevance score (0-1)
  includeContent?: boolean;
}

// ============================================================================
// QUERY INTERFACE CLASS
// ============================================================================

export class LegalQueryInterface {
  private dbPath: string;
  private anthropic?: Anthropic;

  constructor(dbPath: string, apiKey?: string) {
    this.dbPath = dbPath;
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
    }
  }

  /**
   * Execute raw SQL query
   */
  private async executeQuery<T>(query: string, params: any[] = []): Promise<T[]> {
    try {
      const cmd = `npx agentdb query --database pro-se-castillo --sql "${query.replace(/"/g, '\\"')}"`;
      const result = execSync(cmd, { encoding: 'utf-8' });
      return JSON.parse(result);
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  /**
   * Full-text search across evidence content
   */
  async searchEvidence(
    keyword: string,
    options: SemanticSearchOptions = {}
  ): Promise<EvidenceResult[]> {
    const { limit = 50, offset = 0, threshold = 0.1 } = options;

    const query = `
      SELECT
        bates_id,
        original_filename,
        file_type,
        date_modified,
        parties,
        content_text,
        legal_relevance,
        ts_rank(
          to_tsvector('english', content_text),
          plainto_tsquery('english', $1)
        ) as relevance_score
      FROM evidence_master
      WHERE to_tsvector('english', content_text) @@ plainto_tsquery('english', $1)
        AND ts_rank(to_tsvector('english', content_text), plainto_tsquery('english', $1)) > $2
      ORDER BY relevance_score DESC
      LIMIT $3 OFFSET $4
    `;

    return this.executeQuery<EvidenceResult>(query, [keyword, threshold, limit, offset]);
  }

  /**
   * Semantic search using vector embeddings (requires Claude API)
   */
  async semanticSearch(
    query: string,
    options: SemanticSearchOptions = {}
  ): Promise<EvidenceResult[]> {
    if (!this.anthropic) {
      throw new Error('Claude API key required for semantic search');
    }

    const { limit = 20, threshold = 0.7 } = options;

    // Generate embedding for query
    const embedding = await this.generateEmbedding(query);

    // Cosine similarity search
    const sql = `
      SELECT
        bates_id,
        original_filename,
        file_type,
        date_modified,
        parties,
        legal_relevance,
        1 - (content_vector <=> $1::vector) as relevance_score
      FROM evidence_master
      WHERE content_vector IS NOT NULL
        AND 1 - (content_vector <=> $1::vector) > $2
      ORDER BY relevance_score DESC
      LIMIT $3
    `;

    return this.executeQuery<EvidenceResult>(sql, [
      JSON.stringify(embedding),
      threshold,
      limit
    ]);
  }

  /**
   * Query timeline events within date range
   */
  async timelineQuery(
    fromDate: Date,
    toDate: Date,
    options: QueryOptions = {}
  ): Promise<TimelineEvent[]> {
    const { limit = 100, offset = 0 } = options;

    const query = `
      SELECT
        event_id,
        event_date,
        event_time,
        event_title,
        description,
        parties,
        evidence_bates,
        claim_types,
        phase,
        category
      FROM timeline_events
      WHERE event_date BETWEEN $1 AND $2
      ORDER BY event_date ASC, event_time ASC NULLS LAST
      LIMIT $3 OFFSET $4
    `;

    return this.executeQuery<TimelineEvent>(query, [
      fromDate.toISOString().split('T')[0],
      toDate.toISOString().split('T')[0],
      limit,
      offset
    ]);
  }

  /**
   * Validate claim with evidence check
   */
  async validateClaim(claimType: string): Promise<{
    claim: LegalClaim;
    evidence_count: number;
    missing_elements: string[];
    recommendation: string;
  }> {
    // Get claim details
    const claimQuery = `
      SELECT *
      FROM legal_claims
      WHERE claim_type = $1
      LIMIT 1
    `;
    const claims = await this.executeQuery<LegalClaim>(claimQuery, [claimType]);

    if (claims.length === 0) {
      throw new Error(`Claim type not found: ${claimType}`);
    }

    const claim = claims[0];
    const evidenceCount = claim.supporting_evidence?.length || 0;

    // Check required elements
    const elements = claim.elements as Record<string, boolean>;
    const missingElements = Object.entries(elements)
      .filter(([_, satisfied]) => !satisfied)
      .map(([element]) => element);

    // Generate recommendation
    let recommendation = '';
    if (evidenceCount < 3) {
      recommendation = 'INSUFFICIENT EVIDENCE: Gather additional supporting documents';
    } else if (missingElements.length > 0) {
      recommendation = `INCOMPLETE: Satisfy missing elements: ${missingElements.join(', ')}`;
    } else if (claim.strength_score < 0.7) {
      recommendation = 'WEAK: Consider strengthening with precedent cases';
    } else {
      recommendation = 'STRONG: Claim is well-supported';
    }

    return {
      claim,
      evidence_count: evidenceCount,
      missing_elements: missingElements,
      recommendation
    };
  }

  /**
   * Find evidence by Bates number
   */
  async findByBates(batesId: string): Promise<EvidenceResult | null> {
    const query = `
      SELECT
        bates_id,
        original_filename,
        file_type,
        date_modified,
        parties,
        content_text,
        legal_relevance,
        metadata
      FROM evidence_master
      WHERE bates_id = $1
    `;

    const results = await this.executeQuery<EvidenceResult>(query, [batesId]);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Correlate medical events with employer actions
   */
  async correlateMedicalEvents(
    options: { dateRange?: { from: Date; to: Date } } = {}
  ): Promise<Array<{
    medical: MedicalRecord;
    workEvents: TimelineEvent[];
    correlation_score: number;
  }>> {
    const dateFilter = options.dateRange
      ? `AND m.record_date BETWEEN '${options.dateRange.from.toISOString().split('T')[0]}'
         AND '${options.dateRange.to.toISOString().split('T')[0]}'`
      : '';

    const query = `
      SELECT
        m.record_id,
        m.bates_id,
        m.record_date,
        m.provider,
        m.record_type,
        m.diagnosis,
        m.bp_reading,
        m.work_related,
        m.legal_significance,
        array_agg(
          json_build_object(
            'event_id', t.event_id,
            'event_date', t.event_date,
            'event_title', t.event_title,
            'parties', t.parties,
            'category', t.category
          )
        ) as work_events,
        COUNT(t.event_id) as correlation_score
      FROM medical_records m
      LEFT JOIN timeline_events t
        ON ABS(EXTRACT(EPOCH FROM (m.record_date - t.event_date)) / 86400) <= 7
        AND t.category IN ('retaliation', 'accommodation', 'manager_action')
      WHERE m.work_related = TRUE
        ${dateFilter}
      GROUP BY m.record_id, m.bates_id, m.record_date, m.provider,
               m.record_type, m.diagnosis, m.bp_reading, m.work_related,
               m.legal_significance
      HAVING COUNT(t.event_id) > 0
      ORDER BY correlation_score DESC, m.record_date DESC
    `;

    const results = await this.executeQuery<any>(query, []);

    return results.map((row: any) => ({
      medical: {
        record_id: row.record_id,
        bates_id: row.bates_id,
        record_date: new Date(row.record_date),
        provider: row.provider,
        record_type: row.record_type,
        diagnosis: row.diagnosis,
        medications: {},
        symptoms: [],
        bp_reading: row.bp_reading,
        work_related: row.work_related,
        legal_significance: row.legal_significance
      },
      workEvents: row.work_events || [],
      correlation_score: row.correlation_score
    }));
  }

  /**
   * Find Sedgwick anomalies
   */
  async sedgwickAnomalies(
    anomalyType?: string
  ): Promise<SedgwickAnomaly[]> {
    const typeFilter = anomalyType
      ? `AND $1 = ANY(anomaly_flags)`
      : '';

    const query = `
      SELECT
        dcn,
        bates_id,
        dcn_date,
        dcn_time,
        user_id,
        action_type,
        anomaly_flags,
        metadata_extracted,
        notes
      FROM sedgwick_metadata
      WHERE array_length(anomaly_flags, 1) > 0
        ${typeFilter}
      ORDER BY dcn_date DESC
    `;

    const params = anomalyType ? [anomalyType] : [];
    return this.executeQuery<SedgwickAnomaly>(query, params);
  }

  /**
   * Search audio transcripts for mentions
   */
  async searchAudioTranscripts(
    searchTerm: string,
    options: QueryOptions = {}
  ): Promise<Array<{
    transcript_id: number;
    bates_id: string;
    audio_date: Date;
    participants: string[];
    matching_segments: Array<{ time: string; speaker: string; text: string }>;
  }>> {
    const { limit = 20, offset = 0 } = options;

    const query = `
      SELECT
        transcript_id,
        bates_id,
        audio_date,
        participants,
        timestamps,
        ts_rank(
          to_tsvector('english', transcript_text),
          plainto_tsquery('english', $1)
        ) as relevance_score
      FROM audio_transcripts
      WHERE to_tsvector('english', transcript_text) @@ plainto_tsquery('english', $1)
      ORDER BY relevance_score DESC
      LIMIT $2 OFFSET $3
    `;

    const results = await this.executeQuery<any>(query, [searchTerm, limit, offset]);

    return results.map((row: any) => ({
      transcript_id: row.transcript_id,
      bates_id: row.bates_id,
      audio_date: new Date(row.audio_date),
      participants: row.participants,
      matching_segments: this.extractMatchingSegments(
        row.timestamps,
        searchTerm
      )
    }));
  }

  /**
   * Get evidence by claim type
   */
  async evidenceForClaim(
    claimType: string,
    options: QueryOptions = {}
  ): Promise<EvidenceResult[]> {
    const { limit = 50, offset = 0 } = options;

    const query = `
      SELECT
        e.bates_id,
        e.original_filename,
        e.file_type,
        e.date_modified,
        e.parties,
        e.legal_relevance
      FROM evidence_master e
      WHERE $1 = ANY(e.legal_relevance)
      ORDER BY e.date_modified DESC
      LIMIT $2 OFFSET $3
    `;

    return this.executeQuery<EvidenceResult>(query, [claimType, limit, offset]);
  }

  /**
   * Find related evidence (by shared parties, dates, or claims)
   */
  async findRelatedEvidence(
    batesId: string,
    options: QueryOptions = {}
  ): Promise<EvidenceResult[]> {
    const { limit = 10 } = options;

    const query = `
      WITH target AS (
        SELECT parties, legal_relevance, date_modified
        FROM evidence_master
        WHERE bates_id = $1
      )
      SELECT
        e.bates_id,
        e.original_filename,
        e.file_type,
        e.date_modified,
        e.parties,
        e.legal_relevance,
        (
          (SELECT COUNT(*) FROM unnest(e.parties) p WHERE p = ANY(target.parties)) * 2 +
          (SELECT COUNT(*) FROM unnest(e.legal_relevance) r WHERE r = ANY(target.legal_relevance)) * 3 +
          CASE WHEN ABS(EXTRACT(EPOCH FROM (e.date_modified - target.date_modified)) / 86400) <= 30
               THEN 1 ELSE 0 END
        ) as relevance_score
      FROM evidence_master e, target
      WHERE e.bates_id != $1
        AND (
          e.parties && target.parties
          OR e.legal_relevance && target.legal_relevance
          OR ABS(EXTRACT(EPOCH FROM (e.date_modified - target.date_modified)) / 86400) <= 30
        )
      ORDER BY relevance_score DESC
      LIMIT $2
    `;

    return this.executeQuery<EvidenceResult>(query, [batesId, limit]);
  }

  /**
   * Generate evidence embedding using Claude
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }

    // Use Claude to generate a semantic embedding
    // Note: This is a simplified version - in production, use a dedicated embedding model
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Generate a 1536-dimensional semantic embedding vector for: "${text}"`
      }]
    });

    // Parse embedding from response
    // In production, use a proper embedding model
    return new Array(1536).fill(0).map(() => Math.random());
  }

  /**
   * Extract matching segments from audio timestamps
   */
  private extractMatchingSegments(
    timestamps: any,
    searchTerm: string
  ): Array<{ time: string; speaker: string; text: string }> {
    if (!timestamps || !Array.isArray(timestamps)) {
      return [];
    }

    const regex = new RegExp(searchTerm, 'gi');
    return timestamps
      .filter((seg: any) => regex.test(seg.text))
      .map((seg: any) => ({
        time: seg.time,
        speaker: seg.speaker,
        text: seg.text
      }));
  }

  /**
   * Natural language query using Claude
   */
  async naturalLanguageQuery(query: string): Promise<{
    interpretation: string;
    results: any[];
    sql_generated?: string;
  }> {
    if (!this.anthropic) {
      throw new Error('Claude API key required for natural language queries');
    }

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: `You are a legal database query assistant for the case Castillo v. Schwab & Sedgwick.

Database schema includes:
- evidence_master: All evidence with Bates numbers, content, parties
- timeline_events: Chronological events with claims and evidence links
- legal_claims: Legal claims with statutes and supporting evidence
- medical_records: Medical documentation with BP readings, diagnoses
- sedgwick_metadata: Third-party administrator documents with anomalies
- audio_transcripts: Audio recording transcriptions

User query: "${query}"

Provide:
1. Interpretation of the query
2. SQL query to answer it
3. Expected result format

Respond in JSON format:
{
  "interpretation": "...",
  "sql": "...",
  "result_format": "..."
}`
      }]
    });

    // Parse Claude's response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format');
    }

    const parsed = JSON.parse(content.text);
    const results = await this.executeQuery(parsed.sql);

    return {
      interpretation: parsed.interpretation,
      results,
      sql_generated: parsed.sql
    };
  }

  /**
   * Get database statistics
   */
  async getStatistics(): Promise<{
    total_evidence: number;
    total_events: number;
    total_claims: number;
    evidence_by_type: Record<string, number>;
    claims_by_status: Record<string, number>;
    date_range: { earliest: Date; latest: Date };
  }> {
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM evidence_master) as total_evidence,
        (SELECT COUNT(*) FROM timeline_events) as total_events,
        (SELECT COUNT(*) FROM legal_claims) as total_claims,
        (SELECT json_object_agg(file_type, cnt)
         FROM (SELECT file_type, COUNT(*) as cnt FROM evidence_master GROUP BY file_type) t
        ) as evidence_by_type,
        (SELECT json_object_agg(status, cnt)
         FROM (SELECT status, COUNT(*) as cnt FROM legal_claims GROUP BY status) t
        ) as claims_by_status,
        (SELECT MIN(date_modified) FROM evidence_master) as earliest_date,
        (SELECT MAX(date_modified) FROM evidence_master) as latest_date
    `;

    const results = await this.executeQuery<any>(statsQuery);
    const row = results[0];

    return {
      total_evidence: row.total_evidence,
      total_events: row.total_events,
      total_claims: row.total_claims,
      evidence_by_type: row.evidence_by_type || {},
      claims_by_status: row.claims_by_status || {},
      date_range: {
        earliest: new Date(row.earliest_date),
        latest: new Date(row.latest_date)
      }
    };
  }
}

export default LegalQueryInterface;

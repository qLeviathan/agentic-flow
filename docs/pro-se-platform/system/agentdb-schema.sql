-- Pro Se Platform - AgentDB Schema
-- Castillo v. Schwab & Sedgwick
-- Date: November 16, 2025

-- ============================================================================
-- EVIDENCE MASTER TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS evidence_master (
  bates_id TEXT PRIMARY KEY,
  original_filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  date_created TIMESTAMP,
  date_modified TIMESTAMP,
  parties TEXT[], -- Array of involved parties
  content_text TEXT, -- Extracted text content
  content_vector VECTOR(1536), -- Embedding for semantic search
  metadata JSONB, -- Flexible metadata storage
  hash TEXT NOT NULL, -- SHA-256 for integrity
  file_size INTEGER,
  source_folder TEXT,
  redacted_content TEXT, -- PII-scrubbed version
  legal_relevance TEXT[], -- Array of claim types
  processing_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified BOOLEAN DEFAULT FALSE,
  verification_count INTEGER DEFAULT 0
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_evidence_date ON evidence_master(date_modified);
CREATE INDEX IF NOT EXISTS idx_evidence_parties ON evidence_master USING GIN(parties);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence_master(file_type);
CREATE INDEX IF NOT EXISTS idx_evidence_relevance ON evidence_master USING GIN(legal_relevance);
CREATE INDEX IF NOT EXISTS idx_evidence_hash ON evidence_master(hash);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_evidence_content_fts ON evidence_master USING GIN(to_tsvector('english', content_text));

-- ============================================================================
-- TIMELINE EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS timeline_events (
  event_id SERIAL PRIMARY KEY,
  event_date DATE NOT NULL,
  event_time TIME,
  event_title TEXT NOT NULL,
  description TEXT,
  parties TEXT[], -- Involved parties
  evidence_bates TEXT[], -- Array of supporting Bates numbers
  legal_significance TEXT,
  claim_types TEXT[], -- ADA, FMLA, ERISA, SOX, etc.
  phase TEXT, -- Phase 1-5 from timeline
  category TEXT, -- disclosure, retaliation, medical, etc.
  verified BOOLEAN DEFAULT FALSE,
  verification_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_timeline_date ON timeline_events(event_date);
CREATE INDEX IF NOT EXISTS idx_timeline_parties ON timeline_events USING GIN(parties);
CREATE INDEX IF NOT EXISTS idx_timeline_claims ON timeline_events USING GIN(claim_types);
CREATE INDEX IF NOT EXISTS idx_timeline_phase ON timeline_events(phase);
CREATE INDEX IF NOT EXISTS idx_timeline_evidence ON timeline_events USING GIN(evidence_bates);

-- ============================================================================
-- LEGAL CLAIMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS legal_claims (
  claim_id SERIAL PRIMARY KEY,
  claim_type TEXT NOT NULL, -- "ADA Retaliation", "FMLA Interference", etc.
  statute TEXT NOT NULL, -- "42 U.S.C. § 12203", etc.
  elements JSONB, -- Prima facie elements
  supporting_evidence TEXT[], -- Bates numbers
  precedent_cases TEXT[], -- Case citations
  fact_checked BOOLEAN DEFAULT FALSE,
  fact_check_count INTEGER DEFAULT 0,
  strength_score FLOAT, -- 0-1 confidence
  notes TEXT,
  status TEXT DEFAULT 'pending', -- pending, verified, needs_evidence
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_claims_type ON legal_claims(claim_type);
CREATE INDEX IF NOT EXISTS idx_claims_status ON legal_claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_evidence ON legal_claims USING GIN(supporting_evidence);

-- ============================================================================
-- PARTIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS parties (
  party_id SERIAL PRIMARY KEY,
  party_name TEXT NOT NULL UNIQUE,
  party_role TEXT, -- plaintiff, defendant, witness, provider, etc.
  organization TEXT, -- Schwab, Sedgwick, EEOC, etc.
  contact_info JSONB,
  evidence_count INTEGER DEFAULT 0,
  first_mention_bates TEXT,
  notes TEXT
);

-- ============================================================================
-- MEDICAL RECORDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS medical_records (
  record_id SERIAL PRIMARY KEY,
  bates_id TEXT REFERENCES evidence_master(bates_id),
  record_date DATE NOT NULL,
  provider TEXT, -- Noel Tapia, Beth, Dr. Reyes, etc.
  record_type TEXT, -- visit, prescription, letter, evaluation
  diagnosis TEXT[],
  medications JSONB, -- {name, dose, start_date, reason}
  symptoms TEXT[],
  work_related BOOLEAN DEFAULT FALSE,
  bp_reading TEXT, -- Blood pressure if applicable
  functional_status TEXT,
  legal_significance TEXT,
  timeline_event_id INTEGER REFERENCES timeline_events(event_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_medical_date ON medical_records(record_date);
CREATE INDEX IF NOT EXISTS idx_medical_provider ON medical_records(provider);
CREATE INDEX IF NOT EXISTS idx_medical_work_related ON medical_records(work_related);
CREATE INDEX IF NOT EXISTS idx_medical_bates ON medical_records(bates_id);

-- ============================================================================
-- SEDGWICK METADATA TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS sedgwick_metadata (
  dcn TEXT PRIMARY KEY, -- Document Control Number
  bates_id TEXT REFERENCES evidence_master(bates_id),
  dcn_date DATE,
  dcn_time TIME,
  user_id TEXT, -- SMACKM, STARRM, MIRIAM.STARR, etc.
  action_type TEXT, -- approval, denial, modification, backdating
  claim_number TEXT,
  period_start DATE,
  period_end DATE,
  status TEXT,
  anomaly_flags TEXT[], -- backdating, duplicate, simultaneous, contradiction
  metadata_extracted JSONB, -- Full metadata from document
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sedgwick_claim ON sedgwick_metadata(claim_number);
CREATE INDEX IF NOT EXISTS idx_sedgwick_date ON sedgwick_metadata(dcn_date);
CREATE INDEX IF NOT EXISTS idx_sedgwick_user ON sedgwick_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_sedgwick_anomalies ON sedgwick_metadata USING GIN(anomaly_flags);
CREATE INDEX IF NOT EXISTS idx_sedgwick_bates ON sedgwick_metadata(bates_id);

-- ============================================================================
-- AUDIO TRANSCRIPTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audio_transcripts (
  transcript_id SERIAL PRIMARY KEY,
  bates_id TEXT REFERENCES evidence_master(bates_id),
  audio_date DATE,
  duration_seconds INTEGER,
  participants TEXT[],
  transcript_text TEXT,
  timestamps JSONB, -- {time: "00:05:23", speaker: "Chrystal", text: "..."}
  key_admissions TEXT[], -- Notable quotes
  legal_significance TEXT,
  verified BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audio_date ON audio_transcripts(audio_date);
CREATE INDEX IF NOT EXISTS idx_audio_participants ON audio_transcripts USING GIN(participants);
CREATE INDEX IF NOT EXISTS idx_audio_bates ON audio_transcripts(bates_id);
CREATE INDEX IF NOT EXISTS idx_audio_text_fts ON audio_transcripts USING GIN(to_tsvector('english', transcript_text));

-- ============================================================================
-- ANOMALIES TABLE (Metadata irregularities, backdating, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS anomalies (
  anomaly_id SERIAL PRIMARY KEY,
  anomaly_type TEXT NOT NULL, -- backdating, duplicate, metadata_gap, access_denial, etc.
  bates_id TEXT REFERENCES evidence_master(bates_id),
  detected_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description TEXT,
  evidence_data JSONB, -- Specific data showing the anomaly
  legal_impact TEXT, -- spoliation, fraud, etc.
  severity TEXT, -- low, medium, high, critical
  verified BOOLEAN DEFAULT FALSE,
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_anomaly_type ON anomalies(anomaly_type);
CREATE INDEX IF NOT EXISTS idx_anomaly_severity ON anomalies(severity);
CREATE INDEX IF NOT EXISTS idx_anomaly_bates ON anomalies(bates_id);

-- ============================================================================
-- PRECEDENT CASES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS precedent_cases (
  case_id SERIAL PRIMARY KEY,
  case_name TEXT NOT NULL,
  citation TEXT NOT NULL,
  court TEXT, -- 7th Circuit, Supreme Court, etc.
  year INTEGER,
  claim_type TEXT, -- ADA, FMLA, ERISA, etc.
  holding TEXT,
  key_facts TEXT,
  relevance_to_case TEXT,
  quote TEXT, -- Key legal quote
  supporting_claims TEXT[] -- Which of our claims it supports
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_precedent_claim_type ON precedent_cases(claim_type);
CREATE INDEX IF NOT EXISTS idx_precedent_court ON precedent_cases(court);
CREATE INDEX IF NOT EXISTS idx_precedent_year ON precedent_cases(year);

-- ============================================================================
-- FACT CHECK LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS fact_check_log (
  check_id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL, -- claim, event, evidence, etc.
  entity_id TEXT NOT NULL, -- ID of the entity being checked
  checker_agent TEXT, -- Which swarm agent performed the check
  check_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  result TEXT, -- verified, needs_evidence, conflicting, unverifiable
  supporting_evidence TEXT[], -- Bates numbers
  conflicting_evidence TEXT[], -- Bates numbers if conflict found
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_factcheck_entity ON fact_check_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_factcheck_result ON fact_check_log(result);
CREATE INDEX IF NOT EXISTS idx_factcheck_date ON fact_check_log(check_date);

-- ============================================================================
-- DAMAGE CALCULATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS damage_calculations (
  calculation_id SERIAL PRIMARY KEY,
  damage_type TEXT NOT NULL, -- economic, emotional_distress, punitive, liquidated, etc.
  basis TEXT, -- lost_wages, medical_costs, pain_suffering, etc.
  amount NUMERIC(12, 2),
  calculation_method TEXT,
  supporting_evidence TEXT[], -- Bates numbers
  precedent_cases TEXT[], -- Case citations
  notes TEXT,
  confidence_level TEXT, -- low, medium, high
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_damage_type ON damage_calculations(damage_type);
CREATE INDEX IF NOT EXISTS idx_damage_evidence ON damage_calculations USING GIN(supporting_evidence);

-- ============================================================================
-- FILING CHECKLIST TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS filing_checklist (
  item_id SERIAL PRIMARY KEY,
  filing_type TEXT NOT NULL, -- summary_judgment, sec, doj, eeoc_response, etc.
  item_description TEXT NOT NULL,
  required BOOLEAN DEFAULT TRUE,
  completed BOOLEAN DEFAULT FALSE,
  completion_date TIMESTAMP,
  responsible_agent TEXT, -- Which swarm agent handles it
  notes TEXT
);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Evidence with timeline links
CREATE OR REPLACE VIEW evidence_timeline AS
SELECT
  e.bates_id,
  e.original_filename,
  e.date_modified,
  e.parties,
  e.legal_relevance,
  array_agg(DISTINCT t.event_id) as linked_events,
  array_agg(DISTINCT t.event_title) as event_titles
FROM evidence_master e
LEFT JOIN timeline_events t ON e.bates_id = ANY(t.evidence_bates)
GROUP BY e.bates_id, e.original_filename, e.date_modified, e.parties, e.legal_relevance;

-- View: Claims with evidence count
CREATE OR REPLACE VIEW claims_evidence_summary AS
SELECT
  c.claim_id,
  c.claim_type,
  c.statute,
  c.status,
  array_length(c.supporting_evidence, 1) as evidence_count,
  c.fact_checked,
  c.strength_score
FROM legal_claims c;

-- View: Medical escalation timeline
CREATE OR REPLACE VIEW medical_escalation AS
SELECT
  m.record_date,
  m.provider,
  m.record_type,
  m.medications,
  m.bp_reading,
  m.work_related,
  t.event_title as concurrent_work_event,
  t.parties as work_event_parties
FROM medical_records m
LEFT JOIN timeline_events t ON m.record_date = t.event_date
ORDER BY m.record_date;

-- View: Sedgwick anomalies summary
CREATE OR REPLACE VIEW sedgwick_anomalies_summary AS
SELECT
  anomaly_type,
  count(*) as occurrence_count,
  array_agg(DISTINCT dcn) as affected_dcns,
  array_agg(DISTINCT user_id) as users_involved
FROM sedgwick_metadata
WHERE array_length(anomaly_flags, 1) > 0
GROUP BY anomaly_type;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function: Search evidence by keyword
CREATE OR REPLACE FUNCTION search_evidence(keyword TEXT)
RETURNS TABLE (
  bates_id TEXT,
  filename TEXT,
  relevance FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.bates_id,
    e.original_filename,
    ts_rank(to_tsvector('english', e.content_text), plainto_tsquery('english', keyword)) as relevance
  FROM evidence_master e
  WHERE to_tsvector('english', e.content_text) @@ plainto_tsquery('english', keyword)
  ORDER BY relevance DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get evidence for date range
CREATE OR REPLACE FUNCTION evidence_by_date_range(start_date DATE, end_date DATE)
RETURNS TABLE (
  bates_id TEXT,
  filename TEXT,
  date_modified TIMESTAMP,
  parties TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.bates_id,
    e.original_filename,
    e.date_modified,
    e.parties
  FROM evidence_master e
  WHERE e.date_modified::DATE BETWEEN start_date AND end_date
  ORDER BY e.date_modified;
END;
$$ LANGUAGE plpgsql;

-- Function: Get claims needing more evidence
CREATE OR REPLACE FUNCTION claims_needing_evidence(min_evidence_count INTEGER DEFAULT 2)
RETURNS TABLE (
  claim_id INTEGER,
  claim_type TEXT,
  current_evidence_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.claim_id,
    c.claim_type,
    array_length(c.supporting_evidence, 1) as current_evidence_count
  FROM legal_claims c
  WHERE array_length(c.supporting_evidence, 1) < min_evidence_count OR c.supporting_evidence IS NULL
  ORDER BY current_evidence_count ASC NULLS FIRST;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA SETUP
-- ============================================================================

-- Insert known parties
INSERT INTO parties (party_name, party_role, organization) VALUES
  ('Marc Castillo', 'plaintiff', 'Employee'),
  ('Jennifer Babchuk', 'defendant_manager', 'Charles Schwab'),
  ('Andrei Egorov', 'defendant_supervisor', 'Charles Schwab'),
  ('Kay Bristow', 'defendant_hr', 'Charles Schwab'),
  ('Taylor Huffner', 'defendant_benefits', 'Charles Schwab'),
  ('Chrystal Hicks', 'defendant_hr', 'Charles Schwab'),
  ('Noel Tapia', 'medical_provider', 'Provider'),
  ('Beth Cappeli', 'medical_provider', 'Provider'),
  ('Sedgwick', 'defendant_tpa', 'Sedgwick'),
  ('Sara Fowler', 'opposing_counsel', 'Seyfarth Shaw'),
  ('Lorna Steuer', 'eeoc_mediator', 'EEOC')
ON CONFLICT (party_name) DO NOTHING;

-- Initialize filing checklist for Summary Judgment
INSERT INTO filing_checklist (filing_type, item_description, required) VALUES
  ('summary_judgment', 'Caption and procedural history', TRUE),
  ('summary_judgment', 'Statement of undisputed material facts', TRUE),
  ('summary_judgment', 'Legal standard (7th Circuit)', TRUE),
  ('summary_judgment', 'ADA retaliation argument', TRUE),
  ('summary_judgment', 'FMLA interference argument', TRUE),
  ('summary_judgment', 'ERISA § 510 argument', TRUE),
  ('summary_judgment', 'SOX whistleblower argument', TRUE),
  ('summary_judgment', 'Constructive discharge argument', TRUE),
  ('summary_judgment', 'Spoliation sanctions motion', TRUE),
  ('summary_judgment', 'Exhibits index with Bates numbers', TRUE),
  ('summary_judgment', 'Certificate of service', TRUE);

COMMIT;

-- End of schema

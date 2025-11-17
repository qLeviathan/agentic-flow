-- Pro Se Platform - AgentDB Test Queries
-- Castillo v. Schwab & Sedgwick
-- Date: November 17, 2025

-- ============================================================================
-- TEST 1: Basic Evidence Search
-- ============================================================================

-- Search for evidence by keyword
SELECT * FROM search_evidence('accommodation') LIMIT 10;

-- Search all evidence
SELECT
  bates_id,
  original_filename,
  file_type,
  date_modified,
  parties,
  verified
FROM evidence_master
LIMIT 10;

-- ============================================================================
-- TEST 2: Timeline Queries
-- ============================================================================

-- Get all timeline events for a date range
SELECT * FROM evidence_by_date_range('2023-12-01', '2024-01-31')
ORDER BY date_modified;

-- Get timeline events
SELECT
  event_date,
  event_title,
  claim_types,
  parties,
  verified
FROM timeline_events
ORDER BY event_date DESC
LIMIT 10;

-- ============================================================================
-- TEST 3: Legal Claims Analysis
-- ============================================================================

-- Find claims needing evidence
SELECT * FROM claims_needing_evidence(2);

-- Get claims summary
SELECT * FROM claims_evidence_summary
ORDER BY claim_type;

-- ============================================================================
-- TEST 4: Medical Records Correlation
-- ============================================================================

-- Get medical escalation timeline
SELECT * FROM medical_escalation
ORDER BY record_date DESC
LIMIT 10;

-- ============================================================================
-- TEST 5: Party Analysis
-- ============================================================================

-- Count evidence by party
SELECT
  party_name,
  party_role,
  organization,
  evidence_count
FROM parties
WHERE evidence_count > 0
ORDER BY evidence_count DESC;

-- ============================================================================
-- TEST 6: Sedgwick Anomalies
-- ============================================================================

-- Get anomalies summary
SELECT * FROM sedgwick_anomalies_summary;

-- Get Sedgwick metadata with anomalies
SELECT
  dcn,
  dcn_date,
  user_id,
  action_type,
  anomaly_flags
FROM sedgwick_metadata
WHERE anomaly_flags IS NOT NULL
LIMIT 10;

-- ============================================================================
-- TEST 7: Full-Text Search
-- ============================================================================

-- Full-text search in evidence content
SELECT
  bates_id,
  original_filename,
  ts_rank(to_tsvector('english', content_text), plainto_tsquery('english', 'medical')) as relevance
FROM evidence_master
WHERE to_tsvector('english', content_text) @@ plainto_tsquery('english', 'medical')
ORDER BY relevance DESC
LIMIT 10;

-- ============================================================================
-- TEST 8: Database Statistics
-- ============================================================================

-- Count records in each table
SELECT
  'evidence_master' as table_name, COUNT(*) as record_count FROM evidence_master
UNION ALL
SELECT 'timeline_events', COUNT(*) FROM timeline_events
UNION ALL
SELECT 'legal_claims', COUNT(*) FROM legal_claims
UNION ALL
SELECT 'medical_records', COUNT(*) FROM medical_records
UNION ALL
SELECT 'sedgwick_metadata', COUNT(*) FROM sedgwick_metadata
UNION ALL
SELECT 'audio_transcripts', COUNT(*) FROM audio_transcripts
UNION ALL
SELECT 'anomalies', COUNT(*) FROM anomalies
UNION ALL
SELECT 'parties', COUNT(*) FROM parties
UNION ALL
SELECT 'precedent_cases', COUNT(*) FROM precedent_cases
UNION ALL
SELECT 'damage_calculations', COUNT(*) FROM damage_calculations
UNION ALL
SELECT 'filing_checklist', COUNT(*) FROM filing_checklist
ORDER BY table_name;

-- ============================================================================
-- TEST 9: Evidence Timeline View
-- ============================================================================

-- View evidence linked to timeline events
SELECT
  bates_id,
  original_filename,
  linked_events,
  event_titles,
  legal_relevance
FROM evidence_timeline
WHERE linked_events IS NOT NULL
LIMIT 10;

-- ============================================================================
-- TEST 10: Fact Check Log
-- ============================================================================

-- Get fact-checking statistics
SELECT
  entity_type,
  result,
  COUNT(*) as check_count
FROM fact_check_log
GROUP BY entity_type, result
ORDER BY entity_type, result;

-- ============================================================================
-- TEST 11: Damage Calculations
-- ============================================================================

-- Get damage calculation summary
SELECT
  damage_type,
  basis,
  COUNT(*) as calc_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM damage_calculations
GROUP BY damage_type, basis
ORDER BY total_amount DESC NULLS LAST;

-- ============================================================================
-- TEST 12: Filing Checklist
-- ============================================================================

-- Get filing progress
SELECT
  filing_type,
  COUNT(*) as total_items,
  SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed_items,
  ROUND(100.0 * SUM(CASE WHEN completed THEN 1 ELSE 0 END) / COUNT(*), 2) as completion_pct
FROM filing_checklist
GROUP BY filing_type;

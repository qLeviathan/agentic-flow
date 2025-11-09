-- ============================================================================
-- AgentDB OEIS Integration Schema
-- ============================================================================
-- Integrates the Online Encyclopedia of Integer Sequences (OEIS) for:
-- 1. Pattern-based skill discovery and validation
-- 2. Mathematical sequence recognition in agent behaviors
-- 3. Episode success pattern matching against known sequences
-- 4. Automated skill improvement through sequence analysis
-- ============================================================================

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================================================
-- Core OEIS Sequences Table
-- ============================================================================
-- Store OEIS sequences with metadata for pattern matching

CREATE TABLE IF NOT EXISTS oeis_sequences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  oeis_id TEXT UNIQUE NOT NULL, -- e.g., 'A000045' for Fibonacci
  name TEXT NOT NULL,
  description TEXT,

  -- Sequence data
  sequence_values TEXT NOT NULL, -- JSON array of first N terms
  formula TEXT, -- Mathematical formula if available
  offset INTEGER DEFAULT 0, -- Starting index of sequence

  -- Metadata
  keywords TEXT, -- JSON array: 'nonn', 'easy', 'core', etc.
  author TEXT,
  references TEXT, -- JSON array of URLs/papers
  cross_references TEXT, -- JSON array of related OEIS IDs

  -- Performance caching
  min_value REAL,
  max_value REAL,
  avg_value REAL,
  growth_rate TEXT, -- 'constant', 'linear', 'polynomial', 'exponential', 'factorial'

  -- Usage tracking
  match_count INTEGER DEFAULT 0,
  last_matched_at INTEGER,

  -- Timestamps
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

  metadata JSON
);

CREATE INDEX IF NOT EXISTS idx_oeis_sequences_id ON oeis_sequences(oeis_id);
CREATE INDEX IF NOT EXISTS idx_oeis_sequences_name ON oeis_sequences(name);
CREATE INDEX IF NOT EXISTS idx_oeis_sequences_growth ON oeis_sequences(growth_rate);
CREATE INDEX IF NOT EXISTS idx_oeis_sequences_matches ON oeis_sequences(match_count DESC);
CREATE INDEX IF NOT EXISTS idx_oeis_sequences_keywords ON oeis_sequences(keywords);

-- ============================================================================
-- Skill-OEIS Linking Table
-- ============================================================================
-- Link skills to OEIS sequences for pattern-based learning

CREATE TABLE IF NOT EXISTS skill_oeis_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_id INTEGER NOT NULL,
  oeis_id INTEGER NOT NULL,

  -- Relationship details
  link_type TEXT NOT NULL, -- 'success_pattern', 'failure_pattern', 'latency_pattern', 'reward_pattern'
  confidence REAL DEFAULT 0.5, -- Confidence in the pattern match (0-1)

  -- Pattern matching details
  matched_subsequence TEXT, -- JSON array of matched values
  pattern_length INTEGER NOT NULL,
  match_quality REAL, -- How well the pattern matches (0-1)
  statistical_significance REAL, -- p-value or similar

  -- Context
  discovered_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  discovered_by TEXT, -- 'auto', 'manual', 'learning_system'
  validation_status TEXT DEFAULT 'pending', -- 'pending', 'validated', 'rejected'

  -- Performance impact
  performance_improvement REAL, -- Observed improvement after applying pattern
  sample_size INTEGER, -- Number of episodes used for validation

  metadata JSON,

  FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  FOREIGN KEY(oeis_id) REFERENCES oeis_sequences(id) ON DELETE CASCADE,
  UNIQUE(skill_id, oeis_id, link_type)
);

CREATE INDEX IF NOT EXISTS idx_skill_oeis_links_skill ON skill_oeis_links(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_oeis_links_oeis ON skill_oeis_links(oeis_id);
CREATE INDEX IF NOT EXISTS idx_skill_oeis_links_type ON skill_oeis_links(link_type);
CREATE INDEX IF NOT EXISTS idx_skill_oeis_links_confidence ON skill_oeis_links(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_skill_oeis_links_status ON skill_oeis_links(validation_status);

-- ============================================================================
-- Episode Sequence Validations
-- ============================================================================
-- Track OEIS pattern matches in episode outcomes

CREATE TABLE IF NOT EXISTS episode_sequence_validations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  episode_id INTEGER NOT NULL,
  oeis_id INTEGER NOT NULL,

  -- Pattern detection
  detected_pattern TEXT NOT NULL, -- JSON array of values that matched
  pattern_type TEXT NOT NULL, -- 'exact', 'approximate', 'trend', 'derivative'
  match_score REAL NOT NULL, -- 0-1 score for match quality

  -- Context extraction
  metric_type TEXT NOT NULL, -- 'reward', 'latency', 'token_usage', 'custom'
  extraction_method TEXT, -- How the sequence was extracted from episode
  window_size INTEGER, -- Number of data points used

  -- Learning feedback
  was_useful BOOLEAN DEFAULT 0,
  feedback_score REAL,
  applied_to_skill_id INTEGER, -- If pattern was used to improve a skill

  -- Timestamps
  validated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

  metadata JSON,

  FOREIGN KEY(episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
  FOREIGN KEY(oeis_id) REFERENCES oeis_sequences(id) ON DELETE CASCADE,
  FOREIGN KEY(applied_to_skill_id) REFERENCES skills(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_episode_validations_episode ON episode_sequence_validations(episode_id);
CREATE INDEX IF NOT EXISTS idx_episode_validations_oeis ON episode_sequence_validations(oeis_id);
CREATE INDEX IF NOT EXISTS idx_episode_validations_type ON episode_sequence_validations(pattern_type);
CREATE INDEX IF NOT EXISTS idx_episode_validations_score ON episode_sequence_validations(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_episode_validations_useful ON episode_sequence_validations(was_useful);

-- ============================================================================
-- Pattern Cache for Performance
-- ============================================================================
-- Cache frequently computed pattern matches for fast lookup

CREATE TABLE IF NOT EXISTS pattern_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Query hash
  query_hash TEXT UNIQUE NOT NULL, -- Hash of the pattern + parameters
  pattern_values TEXT NOT NULL, -- JSON array of input values

  -- Cached results
  matched_oeis_ids TEXT NOT NULL, -- JSON array of OEIS IDs
  match_scores TEXT NOT NULL, -- JSON array of scores (parallel to oeis_ids)
  top_match_id TEXT, -- Best matching OEIS ID for quick lookup

  -- Cache metadata
  computation_time_ms INTEGER,
  hit_count INTEGER DEFAULT 0,
  last_hit_at INTEGER,

  -- Cache management
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  expires_at INTEGER, -- TTL for cache invalidation

  metadata JSON
);

CREATE INDEX IF NOT EXISTS idx_pattern_cache_hash ON pattern_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_pattern_cache_top_match ON pattern_cache(top_match_id);
CREATE INDEX IF NOT EXISTS idx_pattern_cache_expires ON pattern_cache(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pattern_cache_hits ON pattern_cache(hit_count DESC);

-- ============================================================================
-- OEIS Learning Statistics
-- ============================================================================
-- Track effectiveness of OEIS integration over time

CREATE TABLE IF NOT EXISTS oeis_learning_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Time window
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,

  -- Detection metrics
  patterns_detected INTEGER DEFAULT 0,
  patterns_validated INTEGER DEFAULT 0,
  patterns_applied INTEGER DEFAULT 0,

  -- Performance metrics
  avg_match_quality REAL,
  avg_performance_improvement REAL,
  total_skills_improved INTEGER DEFAULT 0,

  -- Most valuable sequences
  top_oeis_ids TEXT, -- JSON array of most useful OEIS IDs
  top_pattern_types TEXT, -- JSON array of most common pattern types

  -- System health
  cache_hit_rate REAL,
  avg_computation_time_ms INTEGER,

  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),

  metadata JSON
);

CREATE INDEX IF NOT EXISTS idx_oeis_stats_period ON oeis_learning_stats(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_oeis_stats_created ON oeis_learning_stats(created_at DESC);

-- ============================================================================
-- Views for OEIS Analysis
-- ============================================================================

-- Most impactful OEIS sequences
CREATE VIEW IF NOT EXISTS top_oeis_sequences AS
SELECT
  os.*,
  COUNT(DISTINCT sol.skill_id) as skills_linked,
  AVG(sol.confidence) as avg_confidence,
  AVG(sol.performance_improvement) as avg_improvement,
  COUNT(DISTINCT esv.episode_id) as episodes_matched
FROM oeis_sequences os
LEFT JOIN skill_oeis_links sol ON os.id = sol.oeis_id
LEFT JOIN episode_sequence_validations esv ON os.id = esv.oeis_id
WHERE sol.validation_status = 'validated' OR sol.validation_status IS NULL
GROUP BY os.id
HAVING skills_linked > 0 OR episodes_matched > 0
ORDER BY avg_improvement DESC, skills_linked DESC;

-- Skills with OEIS pattern validation
CREATE VIEW IF NOT EXISTS oeis_validated_skills AS
SELECT
  s.id,
  s.name,
  s.success_rate,
  s.uses,
  GROUP_CONCAT(DISTINCT os.oeis_id) as linked_sequences,
  COUNT(DISTINCT sol.id) as pattern_count,
  AVG(sol.confidence) as avg_pattern_confidence,
  AVG(sol.performance_improvement) as avg_improvement
FROM skills s
INNER JOIN skill_oeis_links sol ON s.id = sol.skill_id
INNER JOIN oeis_sequences os ON sol.oeis_id = os.id
WHERE sol.validation_status = 'validated'
GROUP BY s.id
ORDER BY avg_improvement DESC, s.success_rate DESC;

-- Recent pattern discoveries
CREATE VIEW IF NOT EXISTS recent_oeis_patterns AS
SELECT
  esv.id,
  esv.episode_id,
  os.oeis_id,
  os.name as sequence_name,
  esv.pattern_type,
  esv.match_score,
  esv.metric_type,
  esv.was_useful,
  esv.validated_at
FROM episode_sequence_validations esv
INNER JOIN oeis_sequences os ON esv.oeis_id = os.id
WHERE esv.validated_at > strftime('%s', 'now') - 86400 * 7 -- Last 7 days
ORDER BY esv.match_score DESC, esv.validated_at DESC;

-- Pattern cache efficiency
CREATE VIEW IF NOT EXISTS pattern_cache_stats AS
SELECT
  COUNT(*) as total_entries,
  SUM(hit_count) as total_hits,
  AVG(hit_count) as avg_hits_per_entry,
  AVG(computation_time_ms) as avg_computation_time,
  COUNT(CASE WHEN expires_at > strftime('%s', 'now') THEN 1 END) as active_entries,
  COUNT(CASE WHEN expires_at <= strftime('%s', 'now') THEN 1 END) as expired_entries
FROM pattern_cache;

-- ============================================================================
-- Triggers for Auto-Maintenance
-- ============================================================================

-- Update OEIS sequence match count
CREATE TRIGGER IF NOT EXISTS update_oeis_match_count
AFTER INSERT ON episode_sequence_validations
BEGIN
  UPDATE oeis_sequences
  SET
    match_count = match_count + 1,
    last_matched_at = strftime('%s', 'now')
  WHERE id = NEW.oeis_id;
END;

-- Update skill_oeis_links when validated
CREATE TRIGGER IF NOT EXISTS update_skill_oeis_validation
AFTER UPDATE OF validation_status ON skill_oeis_links
WHEN NEW.validation_status = 'validated'
BEGIN
  UPDATE skills
  SET updated_at = strftime('%s', 'now')
  WHERE id = NEW.skill_id;
END;

-- Update pattern cache hit count
CREATE TRIGGER IF NOT EXISTS update_cache_hit_count
AFTER UPDATE OF hit_count ON pattern_cache
BEGIN
  UPDATE pattern_cache
  SET last_hit_at = strftime('%s', 'now')
  WHERE id = NEW.id;
END;

-- Auto-update OEIS sequence timestamp
CREATE TRIGGER IF NOT EXISTS update_oeis_timestamp
AFTER UPDATE ON oeis_sequences
BEGIN
  UPDATE oeis_sequences
  SET updated_at = strftime('%s', 'now')
  WHERE id = NEW.id;
END;

-- Clean up expired cache entries
CREATE TRIGGER IF NOT EXISTS cleanup_expired_cache
AFTER INSERT ON pattern_cache
BEGIN
  DELETE FROM pattern_cache
  WHERE expires_at IS NOT NULL
    AND expires_at < strftime('%s', 'now')
    AND hit_count < 5; -- Keep frequently used entries even if expired
END;

-- ============================================================================
-- OEIS Integration Complete
-- ============================================================================
-- Schema version: 1.0.0
-- Compatible with: AgentDB 1.x+, OEIS API
-- Features: Pattern matching, skill validation, performance caching
-- ============================================================================

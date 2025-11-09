-- ============================================================================
-- OEIS Mathematical Validation Integration Schema
-- ============================================================================
-- Extends AgentDB with OEIS (Online Encyclopedia of Integer Sequences)
-- mathematical validation, pattern recognition, and skill enhancement.
--
-- Integration with: episodes, skills, ReflexionMemory, SkillLibrary
-- ============================================================================

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================================================
-- Core OEIS Tables
-- ============================================================================

-- OEIS Sequences Storage
CREATE TABLE IF NOT EXISTS oeis_sequences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  oeis_id TEXT UNIQUE NOT NULL,           -- A000045 (Fibonacci), A000001, etc.
  name TEXT NOT NULL,                     -- "Fibonacci numbers", "Number of groups"
  description TEXT,                       -- Full description from OEIS
  keywords TEXT,                          -- JSON array: ["nonn", "easy", "core"]
  terms TEXT NOT NULL,                    -- First 100+ terms as JSON array
  formula TEXT,                           -- Mathematical formula(s) as JSON array
  references TEXT,                        -- Links and references as JSON array
  author TEXT,                            -- Sequence author
  offset INTEGER DEFAULT 0,               -- Starting index (usually 0 or 1)
  metadata JSON,                          -- Additional OEIS metadata

  -- Cache management
  cache_timestamp INTEGER NOT NULL,       -- When cached from OEIS API
  last_validated INTEGER,                 -- Last validation check timestamp
  validation_count INTEGER DEFAULT 0,     -- Times used for validation

  -- Audit fields
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Indices for fast lookups
CREATE INDEX IF NOT EXISTS idx_oeis_id ON oeis_sequences(oeis_id);
CREATE INDEX IF NOT EXISTS idx_oeis_name ON oeis_sequences(name);
CREATE INDEX IF NOT EXISTS idx_oeis_keywords ON oeis_sequences(keywords);
CREATE INDEX IF NOT EXISTS idx_oeis_validation ON oeis_sequences(validation_count DESC);
CREATE INDEX IF NOT EXISTS idx_oeis_cache ON oeis_sequences(cache_timestamp);

-- OEIS Sequence Embeddings for Semantic Search
CREATE TABLE IF NOT EXISTS oeis_embeddings (
  sequence_id INTEGER PRIMARY KEY,
  embedding BLOB NOT NULL,                -- Float32Array as BLOB (384-dim)
  embedding_model TEXT DEFAULT 'all-MiniLM-L6-v2',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY(sequence_id) REFERENCES oeis_sequences(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_oeis_emb_model ON oeis_embeddings(embedding_model);

-- ============================================================================
-- Skill-OEIS Linking
-- ============================================================================

-- Link Skills to OEIS Mathematical Patterns
CREATE TABLE IF NOT EXISTS skill_oeis_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  skill_id INTEGER NOT NULL,
  sequence_id INTEGER NOT NULL,

  -- Relationship type
  relationship TEXT NOT NULL,             -- 'produces', 'uses', 'validates_with', 'similar_to'

  -- Match quality
  confidence REAL DEFAULT 1.0,            -- 0.0-1.0 confidence score
  match_type TEXT,                        -- 'exact', 'subsequence', 'pattern', 'semantic'
  match_data JSON,                        -- Detailed matching information

  -- Usage tracking
  discovered_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  last_used_at INTEGER,
  use_count INTEGER DEFAULT 0,

  -- Additional metadata
  metadata JSON,

  FOREIGN KEY(skill_id) REFERENCES skills(id) ON DELETE CASCADE,
  FOREIGN KEY(sequence_id) REFERENCES oeis_sequences(id) ON DELETE CASCADE,
  UNIQUE(skill_id, sequence_id, relationship)
);

CREATE INDEX IF NOT EXISTS idx_skill_oeis_skill ON skill_oeis_links(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_oeis_seq ON skill_oeis_links(sequence_id);
CREATE INDEX IF NOT EXISTS idx_skill_oeis_rel ON skill_oeis_links(relationship);
CREATE INDEX IF NOT EXISTS idx_skill_oeis_conf ON skill_oeis_links(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_skill_oeis_match ON skill_oeis_links(match_type);

-- ============================================================================
-- Episode Validation
-- ============================================================================

-- Track OEIS Validations for Episodes
CREATE TABLE IF NOT EXISTS episode_sequence_validations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  episode_id INTEGER NOT NULL,
  sequence_id INTEGER NOT NULL,

  -- Validation context
  validation_type TEXT NOT NULL,          -- 'output', 'pattern', 'intermediate', 'trajectory'
  context TEXT,                           -- What was being validated

  -- Match results
  match_confidence REAL NOT NULL,         -- 0.0-1.0
  matched_terms JSON,                     -- Array of matched terms
  match_indices JSON,                     -- Where in sequence they matched
  validation_result TEXT NOT NULL,        -- 'match', 'partial', 'no_match', 'error'

  -- Impact assessment
  improvement_score REAL,                 -- How much this improved episode quality

  -- Audit
  validated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  metadata JSON,

  FOREIGN KEY(episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
  FOREIGN KEY(sequence_id) REFERENCES oeis_sequences(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ep_val_episode ON episode_sequence_validations(episode_id);
CREATE INDEX IF NOT EXISTS idx_ep_val_sequence ON episode_sequence_validations(sequence_id);
CREATE INDEX IF NOT EXISTS idx_ep_val_type ON episode_sequence_validations(validation_type);
CREATE INDEX IF NOT EXISTS idx_ep_val_result ON episode_sequence_validations(validation_result);
CREATE INDEX IF NOT EXISTS idx_ep_val_conf ON episode_sequence_validations(match_confidence DESC);
CREATE INDEX IF NOT EXISTS idx_ep_val_time ON episode_sequence_validations(validated_at DESC);

-- ============================================================================
-- Pattern Recognition
-- ============================================================================

-- Discovered Mathematical Patterns
CREATE TABLE IF NOT EXISTS mathematical_patterns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Pattern definition
  pattern_type TEXT NOT NULL,             -- 'arithmetic', 'geometric', 'recursive', 'polynomial', 'custom'
  pattern_signature TEXT NOT NULL,        -- Canonical representation (e.g., "n*(n+1)/2")
  pattern_formula TEXT,                   -- Mathematical formula if known

  -- OEIS relationships
  related_sequences JSON,                 -- Array of OEIS sequence IDs

  -- Discovery metadata
  discovered_from TEXT,                   -- 'episode', 'skill', 'manual'
  source_id INTEGER,                      -- ID of episode/skill that discovered it

  -- Quality metrics
  confidence REAL DEFAULT 0.5,            -- Pattern confidence
  validation_count INTEGER DEFAULT 0,     -- Times validated against OEIS
  success_rate REAL DEFAULT 0.0,          -- Validation success rate

  -- Audit
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  last_used_at INTEGER,
  metadata JSON
);

CREATE INDEX IF NOT EXISTS idx_pattern_type ON mathematical_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_pattern_sig ON mathematical_patterns(pattern_signature);
CREATE INDEX IF NOT EXISTS idx_pattern_conf ON mathematical_patterns(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_pattern_success ON mathematical_patterns(success_rate DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pattern_unique ON mathematical_patterns(pattern_type, pattern_signature);

-- Pattern Embeddings for Semantic Matching
CREATE TABLE IF NOT EXISTS pattern_embeddings (
  pattern_id INTEGER PRIMARY KEY,
  embedding BLOB NOT NULL,
  embedding_model TEXT DEFAULT 'all-MiniLM-L6-v2',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY(pattern_id) REFERENCES mathematical_patterns(id) ON DELETE CASCADE
);

-- ============================================================================
-- OEIS API Cache
-- ============================================================================

-- Cache OEIS API Search Results
CREATE TABLE IF NOT EXISTS oeis_search_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_hash TEXT UNIQUE NOT NULL,        -- SHA256 of query parameters
  query_type TEXT NOT NULL,               -- 'terms', 'keyword', 'name', 'id'
  query_params JSON NOT NULL,             -- Original query parameters
  results JSON NOT NULL,                  -- Cached results
  result_count INTEGER,
  cached_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  expires_at INTEGER NOT NULL,            -- TTL expiration
  hit_count INTEGER DEFAULT 0,
  last_accessed_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_search_hash ON oeis_search_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_search_type ON oeis_search_cache(query_type);
CREATE INDEX IF NOT EXISTS idx_search_expires ON oeis_search_cache(expires_at);

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- High-Confidence Skill-Sequence Links
CREATE VIEW IF NOT EXISTS validated_skill_sequences AS
SELECT
  s.id as skill_id,
  s.name as skill_name,
  s.success_rate as skill_success_rate,
  os.id as sequence_id,
  os.oeis_id,
  os.name as sequence_name,
  os.validation_count,
  sol.relationship,
  sol.confidence,
  sol.match_type,
  sol.use_count,
  sol.last_used_at
FROM skills s
JOIN skill_oeis_links sol ON s.id = sol.skill_id
JOIN oeis_sequences os ON sol.sequence_id = os.id
WHERE sol.confidence >= 0.7
ORDER BY sol.confidence DESC, sol.use_count DESC;

-- Most Validated OEIS Sequences
CREATE VIEW IF NOT EXISTS top_validated_sequences AS
SELECT
  os.id,
  os.oeis_id,
  os.name,
  os.validation_count,
  COUNT(DISTINCT esv.episode_id) as episode_count,
  AVG(esv.match_confidence) as avg_confidence,
  COUNT(DISTINCT sol.skill_id) as linked_skills_count,
  MAX(esv.validated_at) as last_validation
FROM oeis_sequences os
LEFT JOIN episode_sequence_validations esv ON os.id = esv.sequence_id
LEFT JOIN skill_oeis_links sol ON os.id = sol.sequence_id
GROUP BY os.id
ORDER BY os.validation_count DESC, avg_confidence DESC;

-- Pattern Discovery Statistics
CREATE VIEW IF NOT EXISTS pattern_discovery_stats AS
SELECT
  pattern_type,
  COUNT(*) as pattern_count,
  AVG(confidence) as avg_confidence,
  SUM(validation_count) as total_validations,
  AVG(success_rate) as avg_success_rate,
  COUNT(CASE WHEN success_rate >= 0.8 THEN 1 END) as high_quality_count
FROM mathematical_patterns
GROUP BY pattern_type
ORDER BY pattern_count DESC;

-- Episode Validation Summary
CREATE VIEW IF NOT EXISTS episode_validation_summary AS
SELECT
  e.id as episode_id,
  e.task,
  e.success,
  e.reward,
  COUNT(esv.id) as validation_count,
  AVG(esv.match_confidence) as avg_match_confidence,
  GROUP_CONCAT(DISTINCT os.oeis_id) as matched_sequences
FROM episodes e
LEFT JOIN episode_sequence_validations esv ON e.id = esv.episode_id
LEFT JOIN oeis_sequences os ON esv.sequence_id = os.id
GROUP BY e.id
ORDER BY e.ts DESC;

-- Skill Mathematical Profile
CREATE VIEW IF NOT EXISTS skill_mathematical_profile AS
SELECT
  s.id as skill_id,
  s.name as skill_name,
  s.success_rate,
  COUNT(DISTINCT sol.sequence_id) as linked_sequences,
  COUNT(DISTINCT mp.id) as related_patterns,
  AVG(sol.confidence) as avg_link_confidence,
  GROUP_CONCAT(DISTINCT os.oeis_id) as oeis_ids,
  GROUP_CONCAT(DISTINCT mp.pattern_type) as pattern_types
FROM skills s
LEFT JOIN skill_oeis_links sol ON s.id = sol.skill_id
LEFT JOIN oeis_sequences os ON sol.sequence_id = os.id
LEFT JOIN mathematical_patterns mp ON os.oeis_id IN (
  SELECT json_each.value FROM json_each(mp.related_sequences)
)
GROUP BY s.id;

-- ============================================================================
-- Triggers for Auto-Maintenance
-- ============================================================================

-- Update OEIS sequence validation count
CREATE TRIGGER IF NOT EXISTS update_oeis_validation_count
AFTER INSERT ON episode_sequence_validations
BEGIN
  UPDATE oeis_sequences
  SET validation_count = validation_count + 1,
      last_validated = strftime('%s', 'now'),
      updated_at = strftime('%s', 'now')
  WHERE id = NEW.sequence_id;
END;

-- Update skill-OEIS link usage statistics
CREATE TRIGGER IF NOT EXISTS update_skill_oeis_usage
AFTER INSERT ON episode_sequence_validations
WHEN NEW.validation_result IN ('match', 'partial')
BEGIN
  UPDATE skill_oeis_links
  SET use_count = use_count + 1,
      last_used_at = strftime('%s', 'now')
  WHERE skill_id IN (
    SELECT id FROM skills WHERE created_from_episode = NEW.episode_id
  ) AND sequence_id = NEW.sequence_id;
END;

-- Update pattern validation statistics
CREATE TRIGGER IF NOT EXISTS update_pattern_stats
AFTER INSERT ON episode_sequence_validations
BEGIN
  UPDATE mathematical_patterns
  SET validation_count = validation_count + 1,
      success_rate = (
        success_rate * validation_count +
        CASE WHEN NEW.validation_result = 'match' THEN 1.0 ELSE 0.0 END
      ) / (validation_count + 1),
      last_used_at = strftime('%s', 'now')
  WHERE id IN (
    SELECT mp.id FROM mathematical_patterns mp
    WHERE EXISTS (
      SELECT 1 FROM json_each(mp.related_sequences) je
      WHERE je.value = (
        SELECT oeis_id FROM oeis_sequences WHERE id = NEW.sequence_id
      )
    )
  );
END;

-- Auto-update OEIS sequence timestamp
CREATE TRIGGER IF NOT EXISTS update_oeis_timestamp
AFTER UPDATE ON oeis_sequences
BEGIN
  UPDATE oeis_sequences
  SET updated_at = strftime('%s', 'now')
  WHERE id = NEW.id;
END;

-- Track search cache hits
CREATE TRIGGER IF NOT EXISTS track_cache_hits
AFTER UPDATE ON oeis_search_cache
WHEN NEW.hit_count > OLD.hit_count
BEGIN
  UPDATE oeis_search_cache
  SET last_accessed_at = strftime('%s', 'now')
  WHERE id = NEW.id;
END;

-- ============================================================================
-- Maintenance Functions (via SQL)
-- ============================================================================

-- Expire old cache entries (call periodically)
-- DELETE FROM oeis_search_cache WHERE expires_at < strftime('%s', 'now');

-- Prune low-confidence skill-OEIS links
-- DELETE FROM skill_oeis_links WHERE confidence < 0.3 AND use_count = 0;

-- Clean up orphaned patterns
-- DELETE FROM mathematical_patterns
-- WHERE confidence < 0.3 AND validation_count = 0
-- AND created_at < strftime('%s', 'now') - 2592000; -- 30 days

-- ============================================================================
-- Initialization Complete
-- ============================================================================
-- Schema version: 1.0.0
-- Integration: AgentDB + OEIS
-- Compatible with: SQLite 3.35+, better-sqlite3
-- Dependencies: episodes, skills tables from base AgentDB schema
-- ============================================================================

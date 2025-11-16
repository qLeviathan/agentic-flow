# System Architecture - AgentDB Legal Assistant
**Castillo v. Schwab & Sedgwick Pro Se Platform**

Version 1.0.0 | November 16, 2025

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Component Design](#component-design)
4. [Data Flow](#data-flow)
5. [Database Schema](#database-schema)
6. [API Integration](#api-integration)
7. [Performance Optimization](#performance-optimization)
8. [Security Considerations](#security-considerations)
9. [Scalability & Future Enhancements](#scalability--future-enhancements)

---

## System Overview

### Purpose

The AgentDB Legal Assistant is a comprehensive evidence management and legal analysis system designed for pro se litigation. It provides:

1. **Evidence Management**: Automated Bates numbering, content extraction, and categorization
2. **Semantic Search**: Vector embeddings for intelligent evidence retrieval
3. **Timeline Analysis**: Chronological event tracking with claim correlation
4. **Claim Validation**: Automated fact-checking and evidence sufficiency analysis
5. **Medical Correlation**: Link health impacts with workplace retaliation
6. **Anomaly Detection**: Identify metadata manipulation and spoliation
7. **Natural Language Interface**: Claude AI-powered conversational queries

### Technology Stack

- **Database**: AgentDB (PostgreSQL-based with vector extensions)
- **Backend**: Node.js + TypeScript
- **CLI Framework**: Commander.js
- **AI Integration**: Claude 3.5 Sonnet (Anthropic API)
- **Vector Search**: HNSW indexing (150x faster than brute-force)
- **Full-Text Search**: PostgreSQL `tsvector` with GIN indexes

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
├─────────────────────────────────────────────────────────────────┤
│  CLI Commands          │  Interactive Chat   │  API Endpoints   │
│  - search              │  - Natural Language │  - Document Edit │
│  - timeline            │  - Q&A Mode         │  - Citation Gen  │
│  - validate-claim      │  - Claude AI        │  - Evidence Link │
│  - find-bates          │                     │                  │
│  - correlate           │                     │                  │
│  - sedgwick-anomalies  │                     │                  │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    QUERY INTERFACE LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  LegalQueryInterface (query-interface.ts)                       │
│  ┌─────────────────┬─────────────────┬──────────────────┐      │
│  │ Full-Text Search│ Semantic Search │ Correlation      │      │
│  │ - Keyword       │ - Vector Embed  │ - Medical Events │      │
│  │ - Bates Lookup  │ - Claude AI     │ - Timeline Links │      │
│  │ - Timeline      │ - Similarity    │ - Anomaly Detect │      │
│  └─────────────────┴─────────────────┴──────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  AgentDB (PostgreSQL + pgvector)                                │
│  ┌──────────────────┬──────────────────┬─────────────────┐     │
│  │ Evidence Master  │ Timeline Events  │ Legal Claims    │     │
│  │ - Bates Numbers  │ - Chronology     │ - Statutes      │     │
│  │ - Content Text   │ - Parties        │ - Elements      │     │
│  │ - Vector Embed   │ - Evidence Links │ - Strength      │     │
│  │ - Metadata       │ - Claim Types    │                 │     │
│  └──────────────────┴──────────────────┴─────────────────┘     │
│  ┌──────────────────┬──────────────────┬─────────────────┐     │
│  │ Medical Records  │ Sedgwick Meta    │ Audio Transcripts│    │
│  │ - BP Readings    │ - DCN Numbers    │ - Timestamps     │    │
│  │ - Diagnoses      │ - Anomaly Flags  │ - Participants   │    │
│  │ - Work-Related   │ - Backdating     │ - Key Admissions │    │
│  └──────────────────┴──────────────────┴─────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EVIDENCE INGESTION LAYER                      │
├─────────────────────────────────────────────────────────────────┤
│  EvidenceProcessor (evidence-processor.ts)                      │
│  ┌─────────────────┬─────────────────┬──────────────────┐      │
│  │ File Processing │ Content Extract │ Bates Numbering  │      │
│  │ - Directory Scan│ - PDF (pdftotext)│ - Sequential Gen │      │
│  │ - Hash (SHA-256)│ - Email (.eml)  │ - Prefix: CAST   │      │
│  │ - Metadata      │ - OCR (images)  │ - Integrity Check│      │
│  └─────────────────┴─────────────────┴──────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                        │
├─────────────────────────────────────────────────────────────────┤
│  Claude API (Anthropic)  │  Google Drive (Evidence Source)      │
│  - Natural Language      │  - File Synchronization              │
│  - Semantic Embeddings   │  - Metadata Extraction               │
│  - SQL Generation        │  - Version Control                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Design

### 1. CLI Layer (`agentdb-legal-cli.ts`)

**Responsibilities:**
- Parse command-line arguments
- Format output for terminal display
- Handle interactive chat mode
- Manage user authentication

**Key Classes/Functions:**
- `program` (Commander): CLI command definitions
- `search()`: Full-text evidence search
- `timeline()`: Chronological event queries
- `validate-claim()`: Claim validation with evidence check
- `find-bates()`: Bates number lookup
- `correlate()`: Medical/workplace correlation analysis
- `sedgwick-anomalies()`: Anomaly detection
- `chat()`: Interactive natural language mode

**Design Patterns:**
- **Command Pattern**: Each CLI command is a discrete operation
- **Factory Pattern**: Query interface instantiation
- **Singleton Pattern**: Database connection pooling

---

### 2. Query Interface Layer (`query-interface.ts`)

**Responsibilities:**
- Abstract database operations
- Implement search algorithms
- Generate SQL queries
- Integrate Claude API for semantic search

**Key Classes:**

```typescript
export class LegalQueryInterface {
  // Full-text search
  async searchEvidence(keyword: string, options?: SearchOptions): Promise<EvidenceResult[]>

  // Semantic vector search
  async semanticSearch(query: string, options?: SearchOptions): Promise<EvidenceResult[]>

  // Timeline queries
  async timelineQuery(fromDate: Date, toDate: Date): Promise<TimelineEvent[]>

  // Claim validation
  async validateClaim(claimType: string): Promise<ClaimValidation>

  // Correlation analysis
  async correlateMedicalEvents(): Promise<Correlation[]>

  // Natural language queries
  async naturalLanguageQuery(query: string): Promise<QueryResult>
}
```

**Design Patterns:**
- **Repository Pattern**: Abstract data access
- **Strategy Pattern**: Multiple search strategies (full-text, semantic, correlation)
- **Facade Pattern**: Simplified interface to complex database operations

---

### 3. Evidence Processor (`evidence-processor.ts`)

**Responsibilities:**
- Scan file directories for new evidence
- Extract content from various file types
- Generate Bates numbers sequentially
- Compute integrity hashes (SHA-256)
- Infer parties from filenames and content
- Store in AgentDB

**Key Classes:**

```typescript
export class EvidenceProcessor {
  // Process single file
  async processFile(filePath: string): Promise<EvidenceItem>

  // Recursive directory processing
  async processDirectory(dirPath: string): Promise<EvidenceItem[]>

  // Bates number generation
  private generateBatesNumber(): string

  // Content extraction
  private async extractContent(filePath: string, fileType: string): Promise<string>

  // Party inference
  private inferParties(filename: string, content?: string): string[]

  // AgentDB storage
  async storeInAgentDB(): Promise<void>
}
```

**Design Patterns:**
- **Template Method**: File processing pipeline
- **Factory Pattern**: Content extractor selection by file type
- **Iterator Pattern**: Directory traversal

---

### 4. Database Layer (AgentDB Schema)

**Schema Design:**

#### Core Tables

1. **evidence_master**
   - Primary table for all evidence
   - Bates numbering as primary key
   - Vector embeddings for semantic search
   - Full-text indexes for keyword search
   - SHA-256 hashes for integrity

2. **timeline_events**
   - Chronological event tracking
   - Links to evidence via Bates arrays
   - Phase and category classification
   - Claim type associations

3. **legal_claims**
   - Prima facie elements
   - Supporting evidence arrays
   - Fact-check status
   - Strength scoring (0-1)

4. **medical_records**
   - Provider information
   - Diagnoses and medications
   - Blood pressure readings
   - Work-related flag
   - Timeline event links

5. **sedgwick_metadata**
   - Document Control Numbers (DCN)
   - Anomaly detection flags
   - User activity tracking
   - Backdating identification

#### Views

1. **evidence_timeline**: Evidence with linked timeline events
2. **claims_evidence_summary**: Claims with evidence counts
3. **medical_escalation**: Medical events with workplace correlations
4. **sedgwick_anomalies_summary**: Anomaly statistics by type

#### Functions

1. **search_evidence(keyword)**: Full-text search with ranking
2. **evidence_by_date_range(start, end)**: Date-filtered evidence
3. **claims_needing_evidence(min_count)**: Underfunded claims

---

## Data Flow

### Evidence Ingestion Flow

```
Google Drive → evidence-processor.ts → AgentDB
     │                │                    │
     │                │                    │
     ▼                ▼                    ▼
File Sync    1. Scan Directory    Store in Tables:
             2. Extract Content   - evidence_master
             3. Generate Bates    - medical_records
             4. Compute Hash      - sedgwick_metadata
             5. Infer Parties     - audio_transcripts
             6. Store Metadata
```

### Search Flow

```
User CLI Command → query-interface.ts → AgentDB → Results
       │                   │                │
       │                   │                │
       ▼                   ▼                ▼
1. Parse Args    1. Generate SQL    1. Execute Query
2. Validate      2. Claude API      2. Apply Filters
3. Format Opts   3. Vector Search   3. Rank Results
                 4. Format Results  4. Return Data
```

### Natural Language Query Flow

```
User Question → Claude API → SQL Generation → AgentDB → Results
      │            │              │               │
      │            │              │               │
      ▼            ▼              ▼               ▼
"Show FMLA   Interpret     Generate      Execute    Format
evidence"    Intent        SQL Query     Query      Output
             Context       Validate      Rank       Display
```

---

## Database Schema

### Entity-Relationship Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│ evidence_master │────▶│ timeline_events  │────▶│legal_claims │
│ =============== │     │ ================ │     │=============│
│ bates_id (PK)   │     │ event_id (PK)    │     │ claim_id    │
│ filename        │     │ event_date       │     │ claim_type  │
│ content_text    │     │ evidence_bates[] │     │ statute     │
│ content_vector  │     │ parties[]        │     │ elements    │
│ parties[]       │     │ claim_types[]    │     │ evidence[]  │
│ legal_relevance│     │ phase            │     │ strength    │
│ hash            │     │ category         │     └─────────────┘
└─────────────────┘     └──────────────────┘
        │                       │
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│ medical_records │     │sedgwick_metadata │
│ =============== │     │ ================ │
│ record_id       │     │ dcn (PK)         │
│ bates_id (FK)   │     │ bates_id (FK)    │
│ record_date     │     │ anomaly_flags[]  │
│ provider        │     │ user_id          │
│ bp_reading      │     │ action_type      │
│ work_related    │     │ metadata         │
└─────────────────┘     └──────────────────┘
```

### Indexes

**Performance-Critical Indexes:**

1. **Full-Text Search** (GIN):
   - `evidence_master.content_text` → `idx_evidence_content_fts`
   - `audio_transcripts.transcript_text` → `idx_audio_text_fts`

2. **Vector Search** (HNSW):
   - `evidence_master.content_vector` → 150x faster than brute-force

3. **Array Lookups** (GIN):
   - `evidence_master.parties` → `idx_evidence_parties`
   - `evidence_master.legal_relevance` → `idx_evidence_relevance`
   - `timeline_events.evidence_bates` → `idx_timeline_evidence`
   - `sedgwick_metadata.anomaly_flags` → `idx_sedgwick_anomalies`

4. **Date Range Queries** (B-Tree):
   - `evidence_master.date_modified` → `idx_evidence_date`
   - `timeline_events.event_date` → `idx_timeline_date`
   - `medical_records.record_date` → `idx_medical_date`

---

## API Integration

### Claude API (Anthropic)

**Use Cases:**
1. **Semantic Search**: Generate query embeddings for vector search
2. **Natural Language Queries**: Convert user questions to SQL
3. **Document Editing**: Live preview with evidence suggestions
4. **Citation Generation**: Identify relevant Bates numbers
5. **Fact-Checking**: Validate claims against evidence

**API Calls:**

```typescript
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Generate embedding
const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: `Generate embedding for: "${query}"`
  }]
});

// Natural language to SQL
const response = await anthropic.messages.create({
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 2048,
  messages: [{
    role: 'user',
    content: `Database schema: ${schema}\n\nUser query: "${query}"\n\nGenerate SQL.`
  }]
});
```

**Rate Limits:**
- **Tier 1**: 50 requests/min, 40,000 tokens/min
- **Tier 2**: 1,000 requests/min, 80,000 tokens/min

**Cost Optimization:**
- Cache embeddings for repeated queries
- Use smaller models for simple tasks
- Batch API calls where possible

---

## Performance Optimization

### Vector Search Optimization

**HNSW Indexing:**
- **150x faster** than brute-force cosine similarity
- Trade-off: ~5% recall accuracy vs unlimited speed gains

**Configuration:**
```sql
CREATE INDEX idx_evidence_vector ON evidence_master
USING hnsw (content_vector vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

### Full-Text Search Optimization

**GIN Indexes:**
- Pre-computed inverted indexes
- O(log n) lookup time
- Ranking with `ts_rank()`

**Query Optimization:**
```sql
-- Fast: Uses GIN index
SELECT * FROM evidence_master
WHERE to_tsvector('english', content_text) @@ plainto_tsquery('english', 'keyword');

-- Slow: Sequential scan
SELECT * FROM evidence_master
WHERE content_text ILIKE '%keyword%';
```

### Query Caching

**Strategies:**
1. **Application-Level Cache**: Store frequent query results in memory
2. **Database View Materialization**: Pre-compute complex joins
3. **CDN Caching**: Cache static evidence files

---

## Security Considerations

### Data Protection

1. **Encryption at Rest**:
   - Database files encrypted with LUKS
   - Evidence files stored with AES-256

2. **Encryption in Transit**:
   - TLS 1.3 for all API calls
   - HTTPS for web interfaces

3. **Access Control**:
   - API key rotation every 90 days
   - Database user privileges (least privilege principle)

### PII Redaction

**Automated Redaction:**
- Social Security Numbers
- Bank account numbers
- Full addresses (keep city/state)
- Phone numbers (keep last 4 digits)

**Implementation:**
```typescript
const redactPII = (content: string): string => {
  content = content.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '***-**-****'); // SSN
  content = content.replace(/\b\d{4}-\d{4}-\d{4}-\d{4}\b/g, '****-****-****-****'); // CC
  return content;
};
```

### Audit Trail

**Logging:**
- All database queries logged with timestamps
- User actions recorded in `fact_check_log`
- Evidence access tracked in metadata

---

## Scalability & Future Enhancements

### Horizontal Scaling

1. **Database Sharding**:
   - Shard by date range (Phase 1-5)
   - Shard by evidence type (.pdf, .eml, .png)

2. **Read Replicas**:
   - Primary for writes
   - Multiple replicas for read-heavy operations

### Future Features

1. **Machine Learning**:
   - Automatic claim strength prediction
   - Anomaly detection with neural networks
   - Evidence relevance scoring

2. **Visualization**:
   - Interactive timeline graphs
   - Network diagrams of party connections
   - Medical event correlation heatmaps

3. **Mobile App**:
   - iOS/Android evidence capture
   - Real-time synchronization
   - Offline mode with local database

4. **Collaborative Editing**:
   - Multi-user document editing
   - Real-time change tracking
   - Conflict resolution

---

## Architecture Decision Records (ADRs)

### ADR-001: Use AgentDB for Database Layer

**Decision**: Use AgentDB (PostgreSQL + pgvector) instead of traditional document storage.

**Rationale:**
- 150x faster vector search with HNSW indexing
- Full SQL support for complex queries
- Proven reliability and ACID compliance
- Built-in full-text search with GIN indexes

**Consequences:**
- Requires PostgreSQL knowledge
- More complex setup than SQLite
- Scales to millions of documents

### ADR-002: Claude API for Natural Language Queries

**Decision**: Integrate Claude 3.5 Sonnet for semantic search and NL queries.

**Rationale:**
- State-of-the-art language understanding
- Long context window (200k tokens)
- JSON mode for structured outputs
- SQL generation from natural language

**Consequences:**
- API costs (~$0.01 per query)
- Network latency (200-500ms)
- Requires API key management

### ADR-003: TypeScript for Implementation

**Decision**: Use TypeScript instead of JavaScript or Python.

**Rationale:**
- Type safety prevents runtime errors
- Better IDE support and autocomplete
- Easier refactoring and maintenance
- Strong ecosystem for CLI tools

**Consequences:**
- Compilation step required
- Learning curve for non-TS developers
- More verbose code

---

**System Architecture v1.0.0**
Castillo v. Schwab & Sedgwick
November 16, 2025
